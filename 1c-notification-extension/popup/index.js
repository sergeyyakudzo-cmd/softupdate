import { state, elements, intervalIds, createSafeInterval } from './state.js';
import {
    showToast, showModal, hideModal, setupCollapsibleSections, setupRippleEffect,
    updateVolumeIndicators, updateCheckTimer, renderHourlyChart, updateShiftTimer,
    sendMessageToContentScript, updateLastNotificationTime, updateFooterSessionInfo,
    setStatus
} from './utils.js';
import {
    getCurrentTab, updateStatus, toggleMonitoring, startAutoRestartTimer
} from './monitoring.js';
import {
    loadSettings, updateSoundInfo, updateSoundToggle, updateDashboardSoundButton,
    toggleSoundHandler, toggleSoundFromDashboard, toggleGroupMonitoringHandler,
    testSoundAlert, testGroupSoundAlert, showSoundSettings, saveSoundSettings,
    loadSoundOptions, updateSoundVolume, updateGroupVolume, updateModalNotificationType
} from './sounds.js';
import {
    setupIgnoreEventListeners, showIgnoreModal
} from './ignore.js';
import {
    loadMaxSettings, updateMaxUI, toggleMaxHandler, saveMaxUserId, sendTestMaxMessage,
    sendCurrentStatsToMax, sendMonthlyStatsToMax
} from './max.js';
import {
    updateAutoRestartUI, updateAutoTakeUI, updateNightAutoEnableUI, updateCurrentIntervalsDisplay,
    toggleAutoRestartHandler, updateAutoRestartInterval, toggleAutoTakeHandler, updateAutoTakeTimeout,
    toggleNightAutoEnableHandler, applyIntervals, updateNotificationThreshold,
    exportSettings, importSettings, handleImportFile, downloadLogs, clearLogs, updateLogsInfo,
    setupUpdateHandlers
} from './settings.js';
import {
    updateStatsWithNumbers, loadDailyStats, saveDailyStats, renderDailyStats, fillDemoStats
} from './stats.js';
import { initTabs, setupSmartCollapsing, setupPopupResize } from './ui.js';

document.addEventListener('DOMContentLoaded', function() {

    initialize();

    function initialize() {
        logger.log('🔊 Инициализация монитора...');

        chrome.storage.local.get(['popupWidth', 'popupHeight'], (result) => {
            if (result.popupWidth) document.documentElement.style.setProperty('--popup-width', result.popupWidth);
            if (result.popupHeight) document.documentElement.style.setProperty('--popup-height', result.popupHeight);
        });

        loadDailyStats().then(() => renderDailyStats());
        updateStatsWithNumbers();

        loadSettings();
        loadMaxSettings();
        initTabs();
        renderHourlyChart();
        setupEventListeners();
        setupIgnoreEventListeners();
        setupCollapsibleSections();
        setupRippleEffect();
        setupSmartCollapsing();
        setupPopupResize();
        setupUpdateHandlers();
        getCurrentTab();
        updateSoundInfo();
        updateCurrentIntervalsDisplay();
        updateLastNotificationTime();
        updateFooterSessionInfo();
        loadSoundOptions();

        updateVolumeIndicators('soundVolumeSlider', '.volume-level-indicator[data-for="sound"] span');
        updateVolumeIndicators('groupVolumeSlider', '.volume-level-indicator[data-for="group"] span');

        createSafeInterval(updateSoundInfo, 30000);
        createSafeInterval(updateStatsWithNumbers, 10000);

        createSafeInterval(() => {
            updateCheckTimer();
            updateShiftTimer();
        }, 1000);

        createSafeInterval(() => {
            updateStatus();
            updateLastNotificationTime();
            updateFooterSessionInfo();
            if (state.autoRestartEnabled && state.autoRestartTimer === null) {
                startAutoRestartTimer();
            }
        }, 3000);
    }

    function setupEventListeners() {
        if (elements.toggleMonitor) elements.toggleMonitor.addEventListener('click', toggleMonitoring);
        if (elements.refreshCount) elements.refreshCount.addEventListener('click', updateStatus);
        if (elements.maxUserId) {
            elements.maxUserId.addEventListener('change', saveMaxUserId);
            elements.maxUserId.addEventListener('blur', saveMaxUserId);
        }
        if (elements.toggleMax) elements.toggleMax.addEventListener('change', toggleMaxHandler);
        if (elements.configureMax) elements.configureMax.addEventListener('click', () => sendTestMaxMessage());

        if (elements.toggleAutoRestart) elements.toggleAutoRestart.addEventListener('change', toggleAutoRestartHandler);
        if (elements.autoRestartInterval) elements.autoRestartInterval.addEventListener('change', updateAutoRestartInterval);
        if (elements.toggleAutoTake) elements.toggleAutoTake.addEventListener('change', toggleAutoTakeHandler);
        if (elements.autoTakeTimeout) elements.autoTakeTimeout.addEventListener('change', updateAutoTakeTimeout);
        if (elements.toggleNightAutoEnable) elements.toggleNightAutoEnable.addEventListener('change', toggleNightAutoEnableHandler);

        if (elements.toggleSound) elements.toggleSound.addEventListener('change', toggleSoundHandler);
        if (elements.dashboardToggleSound) elements.dashboardToggleSound.addEventListener('click', toggleSoundFromDashboard);
        if (elements.toggleGroupMonitor) elements.toggleGroupMonitor.addEventListener('change', toggleGroupMonitoringHandler);

        if (elements.soundVolumeSlider) elements.soundVolumeSlider.addEventListener('input', updateSoundVolume);
        if (elements.groupVolumeSlider) elements.groupVolumeSlider.addEventListener('input', updateGroupVolume);
        if (elements.notificationThreshold) elements.notificationThreshold.addEventListener('change', updateNotificationThreshold);

        if (elements.emptyRefresh) elements.emptyRefresh.addEventListener('click', () => getCurrentTab());
        if (elements.importFileInput) elements.importFileInput.addEventListener('change', handleImportFile);
        if (elements.exportSettingsBtn) elements.exportSettingsBtn.addEventListener('click', exportSettings);
        if (elements.importSettingsBtn) elements.importSettingsBtn.addEventListener('click', importSettings);

        if (elements.downloadLogsBtn) elements.downloadLogsBtn.addEventListener('click', downloadLogs);
        if (elements.clearLogsBtn) elements.clearLogsBtn.addEventListener('click', () => {
            clearLogs();
            updateLogsInfo();
        });
        updateLogsInfo();

        if (elements.sendStatsToMax) elements.sendStatsToMax.addEventListener('click', sendCurrentStatsToMax);
        if (elements.sendMonthlyStatsToMax) elements.sendMonthlyStatsToMax.addEventListener('click', sendMonthlyStatsToMax);

        const statsHeader = document.querySelector('.stats-card-header');
        if (statsHeader) {
            statsHeader.title = 'Двойной клик — демо-данные';
            statsHeader.addEventListener('dblclick', () => {
                fillDemoStats();
                showToast('Демо-данные загружены', 'success');
            });
        }

        chrome.runtime.onMessage.addListener((message) => {
            if (message.type === 'KEYBOARD_COMMAND') {
                if (message.command === 'toggle-monitor') toggleMonitoring();
                if (message.command === 'refresh-count') updateStatus();
            }
        });

        if (elements.testSound) elements.testSound.addEventListener('click', testSoundAlert);
        if (elements.testGroupSound) elements.testGroupSound.addEventListener('click', testGroupSoundAlert);

        if (elements.checkInterval) elements.checkInterval.addEventListener('change', updateCurrentIntervalsDisplay);
        if (elements.notificationCooldown) elements.notificationCooldown.addEventListener('change', updateCurrentIntervalsDisplay);
        if (elements.applyIntervals) elements.applyIntervals.addEventListener('click', applyIntervals);

        if (elements.showSettings) elements.showSettings.addEventListener('click', showSoundSettings);
        if (elements.ignoreSettingsBtn) elements.ignoreSettingsBtn.addEventListener('click', showIgnoreModal);

        if (elements.soundSettingsModal) {
            const modal = elements.soundSettingsModal;
            if (elements.closeSettings) elements.closeSettings.addEventListener('click', () => hideModal(modal));
            modal.addEventListener('click', (event) => { if (event.target === modal) hideModal(modal); });
        }
        if (elements.saveSettings) elements.saveSettings.addEventListener('click', saveSoundSettings);

        document.querySelectorAll('.type-option-modal').forEach(option => {
            option.setAttribute('role', 'radio');
            option.setAttribute('tabindex', '0');
            option.addEventListener('click', () => {
                updateModalNotificationType(option.dataset.type || 'sound');
            });
            option.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    updateModalNotificationType(option.dataset.type || 'sound');
                }
            });
        });
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) saveDailyStats();
    });

    window.addEventListener('beforeunload', () => {
        for (const id of intervalIds) clearInterval(id);
        intervalIds.clear();
        if (state.soundDisableTimer) clearTimeout(state.soundDisableTimer);
        if (state.autoRestartTimer) clearInterval(state.autoRestartTimer);
        if (state.nextNightEnableTimer) clearTimeout(state.nextNightEnableTimer);
    });
});
