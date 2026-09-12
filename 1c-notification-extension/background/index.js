// Загружаем вспомогательные скрипты (устанавливают глобалы для остальных модулей)
importScripts('logger.js', 'utils.js', 'config.js', 'shared/constants.js');
logger.logModuleLoad('background/index.js');

// После importScripts глобалы logger, getCaseWord, CONFIG, SHARED_CONSTANTS доступны
import { shiftTracker, scheduleDailyReport, isReportHandled, setReportHandled } from './shift-tracker.js';
import { monthlyStats } from './monthly-stats.js';
import { sendMaxMessage, getMaxBotInfo } from './max-api.js';
import { cdpAttach, cdpDetach, cdpMouseClick, cdpKey, getAttachedTabId, setAttachedTabId } from './cdp.js';
import { debouncedUpdateIcon, updateMonitoringState } from './icon.js';
import { createNotification, TARGET_DOMAIN } from './notifications.js';

// ============ СЛУШАТЕЛИ (вынесены из модулей, т.к. importScripts должен выполниться первым) ============

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'dailyReport') {
        if (isReportHandled()) { setReportHandled(false); scheduleDailyReport(); return; }
        if (!shiftTracker._loaded) { logger.warn('🔧 ShiftTracker: alarm до загрузки — пропускаем'); scheduleDailyReport(); return; }
        logger.log('🔧 ShiftTracker: Время отчета!');
        const oldShift = shiftTracker.currentShift ? JSON.parse(JSON.stringify(shiftTracker.currentShift)) : null;
        const currentShift = shiftTracker.getCurrentShift();
        const reportShift = oldShift && (!currentShift || currentShift.date !== oldShift.date) ? oldShift : currentShift;
        if (reportShift) {
            monthlyStats.addShift(reportShift);
            shiftTracker.saveShiftToFile(reportShift);
            shiftTracker.archiveShift(reportShift);
            shiftTracker.sendDailyReport(reportShift);
        }
        scheduleDailyReport();
        shiftTracker.reset();
    }
});

chrome.debugger.onDetach.addListener((source) => {
    const id = getAttachedTabId();
    if (source.tabId === id) {
        setAttachedTabId(null);
        logger.log('🔧 CDP auto-detached from tab:', source.tabId);
    }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (chrome.runtime.lastError) { logger.warn('🔧 tabs.get error:', chrome.runtime.lastError.message); return; }
        if (tab?.url?.startsWith(TARGET_DOMAIN)) debouncedUpdateIcon();
    });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab?.url?.startsWith(TARGET_DOMAIN)) debouncedUpdateIcon();
});

chrome.commands.onCommand.addListener((command) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs?.[0]?.id) return;
        chrome.tabs.sendMessage(tabs[0].id, { type: 'KEYBOARD_COMMAND', command }, (response) => {
            if (chrome.runtime.lastError) {
                chrome.runtime.sendMessage({ type: 'KEYBOARD_COMMAND', command });
            }
        });
    });
});

chrome.runtime.onInstalled.addListener(() => {
    logger.log('🔧 1C Monitor: Extension installed');
    debouncedUpdateIcon();
    chrome.storage.local.get(['maxBotToken'], (result) => {
        if (!result.maxBotToken && self.CONFIG?.MAX?.BOT_TOKEN) {
            chrome.storage.local.set({ maxBotToken: self.CONFIG.MAX.BOT_TOKEN });
            logger.log('🔧 MAX token saved to storage from config.js');
        }
    });
});

// ============ ОБРАБОТЧИК СООБЩЕНИЙ ============

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message?.type || typeof message.type !== 'string') {
        logger.warn('🔧 Background: Invalid message received');
        if (typeof sendResponse === 'function') sendResponse({ success: false, error: 'Invalid message' });
        return;
    }
    logger.log('🔧 Background: Received message:', message.type);

    try {
        switch (message.type) {
            case 'CDP_MOUSE_CLICK': {
                const tabId = sender.tab?.id;
                if (!tabId) { sendResponse({ success: false, error: 'No tab context' }); break; }
                cdpAttach(tabId)
                    .then(() => cdpMouseClick(message.x, message.y, message.button || 0))
                    .then(() => sendResponse({ success: true }))
                    .catch(err => sendResponse({ success: false, error: err.message }));
                return true;
            }
            case 'CDP_KEY': {
                const tabId = sender.tab?.id;
                if (!tabId) { sendResponse({ success: false, error: 'No tab context' }); break; }
                cdpAttach(tabId)
                    .then(() => cdpKey(message.key))
                    .then(() => sendResponse({ success: true }))
                    .catch(err => sendResponse({ success: false, error: err.message }));
                return true;
            }
            case 'CDP_DETACH':
                cdpDetach().then(() => sendResponse({ success: true })).catch(() => sendResponse({ success: true }));
                return true;

            case 'UPDATE_MONITORING_STATE':
                updateMonitoringState(message.state);
                debouncedUpdateIcon();
                sendResponse({ success: true });
                break;

            case 'SHOW_NOTIFICATION':
                createNotification(message.title, message.message);
                sendResponse({ success: true });
                break;

            case 'MAX_API_GET_BOT_INFO':
                getMaxBotInfo(message.botToken).then(sendResponse);
                return true;

            case 'MAX_API_SEND_MESSAGE':
                sendMaxMessage(message.botToken, message.userId, message.text).then(sendResponse);
                return true;

            case 'SHIFT_UPDATE':
                if (message.counts) {
                    shiftTracker.processApplications(
                        message.counts.classificationNumbers || [],
                        message.counts.groupNumbers || []
                    );
                }
                sendResponse({ success: true });
                break;

            case 'SHIFT_GET_STATS': {
                const shift = shiftTracker.getCurrentShift();
                sendResponse({
                    success: true, shift,
                    classificationTotal: shift.classificationTotal || 0,
                    groupTotal: shift.groupTotal || 0,
                    currentClassification: shift.currentClassificationCount || 0,
                    currentGroup: shift.currentGroupCount || 0,
                    peakClassification: shift.peakClassification || 0,
                    peakClassificationTime: shift.peakClassificationTime || null
                });
                return true;
            }
            case 'SHIFT_SEND_REPORT':
                shiftTracker.sendDailyReport().then(result => { sendResponse(result); });
                return true;

            case 'SHIFT_SEND_MONTHLY_REPORT':
                monthlyStats.sendMonthlyReport().then(result => { sendResponse(result); });
                return true;

            case 'SHIFT_TRACKER_GET_MAX_TOKEN':
                chrome.storage.local.get(['maxBotToken'], (result) => {
                    sendResponse({ success: true, token: result.maxBotToken || '' });
                });
                return true;

            default:
                logger.warn('🔧 Background: Unknown message type:', message.type);
                sendResponse({ success: false, error: 'Unknown message type' });
        }
    } catch (error) {
        logger.error('🔧 Background: Error processing message:', error);
        sendResponse({ success: false, error: error.message });
    }
    return true;
});

// ============ ИНИЦИАЛИЗАЦИЯ ============

(async function initBackground() {
    try {
        chrome.downloads.onChanged.addListener((delta) => shiftTracker._handleDownloadChanged(delta));
        await monthlyStats.init();
        shiftTracker.load(() => {
            logger.log('🔧 ShiftTracker: Загружены данные смены:', shiftTracker.currentShift);
            scheduleDailyReport();
        });
    } catch (err) {
        logger.error('🔧 Background init error:', err);
    }
})();
