import { state } from './state.js';
import { setStatus, showToast, sendMessageToContentScript, updateLastNotificationTime } from './utils.js';
import { updateGroupMonitoringToggle, updateVoiceStatus } from './utils.js';
import { updateCurrentIntervalsDisplay, updateNightAutoEnableUI, updateAutoTakeUI } from './settings.js';
import { updateMaxUI } from './max.js';

function getCurrentTab() {
    chrome.tabs.query({ url: 'https://2phoenix.alidi.ru/*' }, (tabs) => {
        if (tabs && tabs[0]) {
            state.currentTab = tabs[0];
            updateStatus();
        } else {
            chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
                if (activeTabs && activeTabs[0]) {
                    state.currentTab = activeTabs[0];
                    updateStatus();
                } else {
                    setStatus('Откройте страницу 1С', '0', '0', false);
                }
            });
        }
    });
}

function updateStatus() {
    if (!state.currentTab) {
        setStatus('Откройте страницу 1С', '0', '0', false);
        return;
    }

    sendMessageToContentScript({ type: 'GET_STATUS' })
        .then(response => {
            const r = response;
            if (r && !r.error) {
                setStatus(r.status, r.count, r.groupCount, r.isMonitoring);
                state.isGroupMonitoringEnabled = !!r.isGroupMonitoring;
                state.notificationType = r.notificationType || 'sound';
                state.soundType = r.soundType || 'modern';
                state.groupSoundType = r.groupSoundType || 'group_chime';
                state.maxEnabled = !!r.maxEnabled;
                state.maxConfigured = !!r.maxConfigured;
                state.autoTakeEnabled = r.autoTakeEnabled === true;
                state.autoTakeTimeout = r.autoTakeTimeout || 240000;

                updateVoiceStatus(!!r.voiceAvailable);

                if (r.checkInterval !== undefined) state.checkInterval = r.checkInterval;
                if (r.notificationCooldown !== undefined) state.notificationCooldown = r.notificationCooldown;

                updateGroupMonitoringToggle();
                updateCurrentIntervalsDisplay();
                updateNightAutoEnableUI();
                updateMaxUI();
                updateAutoTakeUI();

                state.lastUpdate = Date.now();
                updateLastNotificationTime();

                if (state.autoRestartEnabled && !r.isMonitoring) {
                    autoRestartMonitoring();
                }
            } else {
                setStatus('Обновите страницу 1С', '0', '0', false);
            }
        })
        .catch(() => {
            setStatus('Обновите страницу 1С', '0', '0', false);
        });
}

function toggleMonitoring() {
    if (!state.currentTab) {
        showToast('Сначала откройте страницу 1С', 'warning');
        return;
    }

    sendMessageToContentScript({ type: 'TOGGLE_MONITOR' })
        .then(response => {
            const r = response;
            if (r && !r.error) {
                setStatus(r.status, r.count, r.groupCount, r.isMonitoring);
                showToast(r.isMonitoring ? 'Мониторинг запущен' : 'Мониторинг остановлен',
                    r.isMonitoring ? 'success' : 'warning');
            } else {
                showToast('Обновите страницу 1С', 'error');
            }
        })
        .catch(() => showToast('Ошибка: Обновите страницу 1С', 'error'));
}

function startAutoRestartTimer() {
    if (state.autoRestartTimer) clearInterval(state.autoRestartTimer);
    state.autoRestartTimer = setInterval(() => {
        if (!state.currentTab || !state.autoRestartEnabled) return;
        sendMessageToContentScript({ type: 'GET_STATUS' })
            .then(response => {
                const r = response;
                if (r && !r.error && !r.isMonitoring) {
                    sendMessageToContentScript({ type: 'TOGGLE_MONITOR' }).catch(() => logger.warn('Auto-restart: failed to start monitoring'));
                }
            })
            .catch(() => { getCurrentTab(); logger.warn('Auto-restart: status check failed, refreshing tab'); });
    }, state.autoRestartInterval);
}

function stopAutoRestartTimer() {
    if (state.autoRestartTimer) {
        clearInterval(state.autoRestartTimer);
        state.autoRestartTimer = null;
    }
}

function autoRestartMonitoring() {
    if (state.autoRestartCheckCount > 3) {
        state.autoRestartCheckCount = 0;
        return;
    }
    state.autoRestartCheckCount++;
    sendMessageToContentScript({ type: 'TOGGLE_MONITOR' })
        .then(response => {
            const r = response;
            if (r && r.isMonitoring) {
                state.autoRestartCheckCount = 0;
                showToast('Мониторинг автоматически перезапущен', 'success');
                updateStatus();
            }
        })
        .catch(() => logger.warn('Auto-restart monitoring: failed to toggle monitor'));
}

export { getCurrentTab, updateStatus, toggleMonitoring, startAutoRestartTimer, stopAutoRestartTimer, autoRestartMonitoring };
