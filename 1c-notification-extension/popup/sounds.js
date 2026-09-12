import { state, elements } from './state.js';
import { showToast, showModal, hideModal, sendMessageToContentScript, updateVolumeIndicators, updateGroupMonitoringToggle, updateVoiceStatus, setStatus } from './utils.js';
import { updateAutoRestartUI, updateAutoTakeUI, updateNightAutoEnableUI, updateCurrentIntervalsDisplay } from './settings.js';
import { startAutoRestartTimer } from './monitoring.js';

function loadSettings() {
    chrome.storage.local.get([
        'soundEnabled', 'soundVolumeLevel', 'groupVolumeLevel', 'voiceVolumeLevel',
        'groupMonitoringEnabled', 'checkInterval', 'notificationCooldown',
        'soundDisableEndTime', 'notificationType', 'soundType', 'groupSoundType',
        'autoRestartEnabled', 'autoRestartInterval', 'nightAutoEnableEnabled',
        'extensionFolder', 'autoTakeEnabled', 'autoTakeTimeout'
    ], (result) => {
        try {
            let soundEnabledFromStorage = result.soundEnabled !== false;
            if (result.soundDisableEndTime) {
                if (Date.now() < result.soundDisableEndTime) {
                    soundEnabledFromStorage = false;
                } else {
                    chrome.storage.local.remove('soundDisableEndTime');
                }
            }

            state.isSoundEnabled = soundEnabledFromStorage;
            state.isGroupMonitoringEnabled = result.groupMonitoringEnabled === true;
            state.notificationType = result.notificationType || 'sound';
            state.soundType = result.soundType || 'modern';
            state.groupSoundType = result.groupSoundType || 'group_chime';
            state.autoRestartEnabled = result.autoRestartEnabled === true;
            state.autoRestartInterval = result.autoRestartInterval || 30000;
            state.autoTakeEnabled = result.autoTakeEnabled === true;
            state.autoTakeTimeout = result.autoTakeTimeout || 240000;
            state.nightAutoEnableEnabled = result.nightAutoEnableEnabled === true;

            if (result.checkInterval !== undefined) {
                state.checkInterval = parseInt(result.checkInterval) || 10000;
                state.checkIntervalMs = state.checkInterval;
                if (elements.checkInterval) elements.checkInterval.value = String(state.checkInterval);
            }
            if (result.notificationCooldown !== undefined) {
                state.notificationCooldown = parseInt(result.notificationCooldown) || 10000;
                if (elements.notificationCooldown) elements.notificationCooldown.value = String(state.notificationCooldown);
            }

            const def = (typeof window.SHARED_CONSTANTS !== 'undefined' ? window.SHARED_CONSTANTS.SOUND : {});
            state.soundVolume = result.soundVolumeLevel !== undefined ? result.soundVolumeLevel : (def.DEFAULT_VOLUME || 80);
            state.groupVolume = result.groupVolumeLevel !== undefined ? result.groupVolumeLevel : (def.DEFAULT_GROUP_VOLUME || 70);
            state.voiceVolume = result.voiceVolumeLevel !== undefined ? result.voiceVolumeLevel : (def.DEFAULT_VOICE_VOLUME || 100);
            state.notificationThreshold = result.notificationThreshold !== undefined ? result.notificationThreshold : 1;

            if (elements.soundVolumeSlider) elements.soundVolumeSlider.value = String(state.soundVolume);
            if (elements.groupVolumeSlider) elements.groupVolumeSlider.value = String(state.groupVolume);
            if (elements.notificationThreshold) elements.notificationThreshold.value = String(state.notificationThreshold);
            if (elements.voiceVolumeSliderModal) elements.voiceVolumeSliderModal.value = String(state.voiceVolume);

            if (elements.soundVolumeValue) elements.soundVolumeValue.textContent = state.soundVolume + '%';
            if (elements.groupVolumeValue) elements.groupVolumeValue.textContent = state.groupVolume + '%';
            if (elements.voiceVolumeValueModal) elements.voiceVolumeValueModal.textContent = state.voiceVolume + '%';

            updateSoundToggle();
            updateGroupMonitoringToggle();
            updateCurrentIntervalsDisplay();
            updateAutoRestartUI();
            updateAutoTakeUI();
            updateNightAutoEnableUI();

            if (result.extensionFolder && elements.extensionFolder) {
                elements.extensionFolder.value = result.extensionFolder;
            }

            if (state.autoRestartEnabled) startAutoRestartTimer();
        } catch (error) {
            logger.error('🔴 Ошибка загрузки настроек:', error);
        }
    });
}

function updateSoundInfo() {
    if (!state.currentTab) return;
    sendMessageToContentScript({ type: 'GET_SOUND_INFO' })
        .then(response => {
            const r = response;
            if (r && !r.error) {
                state.soundInfo = r;
                state.isSoundEnabled = !!r.enabled;
                state.notificationType = r.notificationType || 'sound';
                state.soundType = r.soundType || 'modern';
                state.groupSoundType = r.groupSoundType || 'group_chime';
                updateVoiceStatus(!!r.voiceAvailable);
                updateSoundToggle();

                if (!r.enabled && r.timeLeft) {
                    const timeLeft = r.timeLeft;
                    const minutes = Math.ceil(timeLeft / 60000);
                    if (elements.soundStatus) {
                        elements.soundStatus.textContent = minutes > 0 ? `Включится через ${minutes} мин` : 'Включится скоро';
                        elements.soundStatus.style.color = 'var(--accent)';
                    }
                    if (state.soundDisableTimer) clearTimeout(state.soundDisableTimer);
                    state.soundDisableTimer = setTimeout(() => updateSoundInfo(), Math.min(timeLeft, 1000));
                }
            }
        })
        .catch(() => {});
}

function updateSoundToggle() {
    if (!elements.toggleSound) return;
    elements.toggleSound.checked = state.isSoundEnabled;
    updateDashboardSoundButton();
    if (elements.soundStatus) {
        if (state.isSoundEnabled) {
            elements.soundStatus.textContent = 'Звук включен';
            elements.soundStatus.style.color = 'var(--success)';
        } else if (state.soundInfo && state.soundInfo.timeLeft) {
            const m = Math.ceil(state.soundInfo.timeLeft / 60000);
            elements.soundStatus.textContent = m > 0 ? `Включится через ${m} мин` : 'Включится скоро';
            elements.soundStatus.style.color = 'var(--warning)';
        } else {
            elements.soundStatus.textContent = 'Звук выключен';
            elements.soundStatus.style.color = 'var(--text-gray)';
        }
    }
}

function updateDashboardSoundButton() {
    const btn = elements.dashboardToggleSound;
    if (!btn) return;
    const icon = btn.querySelector('i');
    if (icon) icon.className = state.isSoundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
}

function toggleSoundHandler() {
    if (state.isSoundEnabled) {
        sendMessageToContentScript({ type: 'SET_SOUND_SETTING', soundEnabled: false })
            .then(response => {
                if (response && response.success) {
                    state.isSoundEnabled = false;
                    if (response.reason === 'night_time_limit') {
                        showToast('Звук отключён на ' + response.duration + ' мин', 'warning');
                    } else {
                        showToast('Звук выключен', 'warning');
                    }
                    updateSoundInfo();
                    updateSoundToggle();
                }
            })
            .catch(() => showToast('Ошибка: Обновите страницу 1С', 'error'));
    } else {
        sendMessageToContentScript({ type: 'ENABLE_SOUND' })
            .then(response => {
                if (response && response.success) {
                    state.isSoundEnabled = true;
                    showToast('Звук включён', 'success');
                    updateSoundToggle();
                    updateSoundInfo();
                    if (state.soundDisableTimer) {
                        clearTimeout(state.soundDisableTimer);
                        state.soundDisableTimer = null;
                    }
                }
            })
            .catch(() => showToast('Ошибка: Обновите страницу 1С', 'error'));
        }
    }

function toggleSoundFromDashboard() {
    if (elements.toggleSound) {
        elements.toggleSound.checked = !elements.toggleSound.checked;
        elements.toggleSound.dispatchEvent(new Event('change'));
    }
}

function toggleGroupMonitoringHandler() {
    if (!state.currentTab) {
        showToast('Сначала откройте страницу 1С', 'warning');
        updateGroupMonitoringToggle();
        return;
    }

    sendMessageToContentScript({ type: 'TOGGLE_GROUP_MONITOR' })
        .then(response => {
            const r = response;
            if (r && !r.error) {
                state.isGroupMonitoringEnabled = r.isGroupMonitoring === true;
                updateGroupMonitoringToggle();
                setStatus(state.isMonitoring ? 'Активен' : 'Остановлен', r.count, r.groupCount, state.isMonitoring);
                showToast(state.isGroupMonitoringEnabled ? 'Мониторинг групп включён' : 'Мониторинг групп выключен',
                    state.isGroupMonitoringEnabled ? 'success' : 'info');
            } else {
                state.isGroupMonitoringEnabled = !state.isGroupMonitoringEnabled;
                updateGroupMonitoringToggle();
            }
        })
        .catch(() => {
            state.isGroupMonitoringEnabled = !state.isGroupMonitoringEnabled;
            updateGroupMonitoringToggle();
            showToast('Ошибка: Обновите страницу 1С', 'error');
        });
}

function testSoundAlert() {
    sendMessageToContentScript({ type: 'TEST_SOUND' })
        .then(() => showToast('Звук классификации', 'info'))
        .catch(() => showToast('Ошибка воспроизведения', 'error'));
}

function testGroupSoundAlert() {
    sendMessageToContentScript({ type: 'TEST_GROUP_SOUND' })
        .then(() => showToast('Звук групп', 'info'))
        .catch(() => showToast('Ошибка воспроизведения', 'error'));
}

function showSoundSettings() {
    const modal = elements.soundSettingsModal;
    if (!modal) return;
    syncModalStateFromStorage();
    state.modalState.notificationType = state.notificationType;
    state.modalState.soundType = state.soundType;
    state.modalState.groupSoundType = state.groupSoundType;
    state.modalState.voiceVolume = state.voiceVolume;

    document.querySelectorAll('.type-option-modal').forEach(el => {
        el.classList.toggle('active', el.dataset.type === state.modalState.notificationType);
    });

    if (elements.typeSoundModal) elements.typeSoundModal.checked = state.modalState.notificationType === 'sound';
    if (elements.typeVoiceModal) elements.typeVoiceModal.checked = state.modalState.notificationType === 'voice';

    renderSoundOptions();
    updateModalVoiceUI();
    showModal(modal);
}

function syncModalStateFromStorage() {
    state.modalState = {
        notificationType: state.notificationType,
        soundType: state.soundType,
        groupSoundType: state.groupSoundType,
        voiceVolume: state.voiceVolume
    };
}

function renderSoundOptions() {
    const classContainer = elements.classificationSoundsModal;
    const groupContainer = elements.groupSoundsModal;
    if (!classContainer || !groupContainer) return;

    classContainer.innerHTML = '';
    groupContainer.innerHTML = '';

    const opts = state.soundOptions.length ? state.soundOptions : getDefaultSoundOptions();
    const groupOpts = state.groupSoundOptions.length ? state.groupSoundOptions : getDefaultGroupSoundOptions();

    opts.forEach(s => {
        const div = document.createElement('div');
        div.className = 'sound-option-modal' + (s.id === state.modalState.soundType ? ' active' : '');
        div.dataset.soundId = s.id;
        div.innerHTML = `<div class="sound-option-icon-modal"><i class="fas fa-music"></i></div><div><div class="sound-option-title-modal">${s.name}</div></div>`;
        div.addEventListener('click', () => {
            classContainer.querySelectorAll('.sound-option-modal').forEach(el => el.classList.remove('active'));
            div.classList.add('active');
            state.modalState.soundType = s.id;
            sendMessageToContentScript({ type: 'SET_SOUND_TYPE', soundType: s.id }).catch(() => {});
            sendMessageToContentScript({ type: 'TEST_SOUND', soundType: s.id }).catch(() => {});
        });
        classContainer.appendChild(div);
    });

    groupOpts.forEach(s => {
        const div = document.createElement('div');
        div.className = 'sound-option-modal' + (s.id === state.modalState.groupSoundType ? ' active' : '');
        div.dataset.soundId = s.id;
        div.innerHTML = `<div class="sound-option-icon-modal"><i class="fas fa-music"></i></div><div><div class="sound-option-title-modal">${s.name}</div></div>`;
        div.addEventListener('click', () => {
            groupContainer.querySelectorAll('.sound-option-modal').forEach(el => el.classList.remove('active'));
            div.classList.add('active');
            state.modalState.groupSoundType = s.id;
            sendMessageToContentScript({ type: 'SET_GROUP_SOUND_TYPE', soundType: s.id }).catch(() => {});
            sendMessageToContentScript({ type: 'TEST_GROUP_SOUND', soundType: s.id }).catch(() => {});
        });
        groupContainer.appendChild(div);
    });
}

function getDefaultSoundOptions() {
    return [
        { id: 'classic', name: 'Классический', description: 'Стандартный звук', category: 'main' },
        { id: 'modern', name: 'Современный', description: 'Современный цифровой звук', category: 'main' },
        { id: 'alert', name: 'Громкий', description: 'Громкий привлекающий внимание', category: 'main' },
        { id: 'soft', name: 'Мягкий', description: 'Тихий ненавязчивый звук', category: 'main' },
        { id: 'game', name: 'Игровой', description: 'Звук из видеоигр', category: 'fun' },
        { id: 'office', name: 'Офисный', description: 'Тихий звук для офиса', category: 'subtle' },
        { id: 'melody', name: 'Мелодия', description: 'Приятная мелодия', category: 'fun' },
        { id: 'beep', name: 'Бип', description: 'Простой короткий бип', category: 'simple' },
        { id: 'chime', name: 'Колокольчик', description: 'Звонкий колокольчик', category: 'notification' },
        { id: 'notification', name: 'Уведомление', description: 'Стандартное уведомление', category: 'notification' },
        { id: 'pop', name: 'Всплывающий', description: 'Мягкий всплывающий звук', category: 'subtle' },
        { id: 'success', name: 'Успех', description: 'Звук успешного действия', category: 'notification' },
        { id: 'error', name: 'Ошибка', description: 'Звук ошибки', category: 'alert' },
        { id: 'click', name: 'Клик', description: 'Звук щелчка', category: 'subtle' }
    ];
}

function getDefaultGroupSoundOptions() {
    return [
        ...getDefaultSoundOptions(),
        { id: 'group_chime', name: 'Колокольчик', description: 'Мягкий колокольчик для групп', category: 'group' },
        { id: 'group_notification', name: 'Групповое уведомление', description: 'Отдельный звук для групповых задач', category: 'group' },
        { id: 'group_bell', name: 'Звонок', description: 'Громкий звонок для групп', category: 'group' },
        { id: 'group_ding', name: 'Динь', description: 'Легкий звук динь', category: 'group' }
    ];
}

function loadSoundOptions() {
    if (state.currentTab && state.currentTab.id) {
        chrome.tabs.sendMessage(state.currentTab.id, { type: 'GET_SOUND_OPTIONS' }, (response) => {
            if (response && response.success) {
                state.soundOptions = response.soundOptions || getDefaultSoundOptions();
                state.groupSoundOptions = response.groupSoundOptions || getDefaultGroupSoundOptions();
            } else {
                state.soundOptions = getDefaultSoundOptions();
                state.groupSoundOptions = getDefaultGroupSoundOptions();
            }
            syncModalStateFromStorage();
        });
    } else {
        state.soundOptions = getDefaultSoundOptions();
        state.groupSoundOptions = getDefaultGroupSoundOptions();
        syncModalStateFromStorage();
    }
}

function updateModalNotificationType(type) {
    state.modalState.notificationType = type;
    document.querySelectorAll('.type-option-modal').forEach(el => el.classList.toggle('active', el.dataset.type === type));
    if (elements.typeSoundModal) elements.typeSoundModal.checked = type === 'sound';
    if (elements.typeVoiceModal) elements.typeVoiceModal.checked = type === 'voice';
    updateModalVoiceUI();
}

function updateModalVoiceUI() {
    if (!elements.voiceVolumeSection || !elements.soundSelectionSection) return;
    if (state.modalState.notificationType === 'voice') {
        elements.voiceVolumeSection.style.display = 'block';
        elements.soundSelectionSection.style.display = 'none';
    } else {
        elements.voiceVolumeSection.style.display = 'none';
        elements.soundSelectionSection.style.display = 'block';
    }
}

function saveSoundSettings() {
    const promises = [];

    if (state.modalState.notificationType !== state.notificationType) {
        promises.push(sendMessageToContentScript({ type: 'SET_NOTIFICATION_TYPE', notificationType: state.modalState.notificationType }));
        state.notificationType = state.modalState.notificationType;
        chrome.storage.local.set({ notificationType: state.notificationType });
    }
    if (state.modalState.soundType !== state.soundType) {
        promises.push(sendMessageToContentScript({ type: 'SET_SOUND_TYPE', soundType: state.modalState.soundType }));
        state.soundType = state.modalState.soundType;
        chrome.storage.local.set({ soundType: state.soundType });
    }
    if (state.modalState.groupSoundType !== state.groupSoundType) {
        promises.push(sendMessageToContentScript({ type: 'SET_GROUP_SOUND_TYPE', soundType: state.modalState.groupSoundType }));
        state.groupSoundType = state.modalState.groupSoundType;
        chrome.storage.local.set({ groupSoundType: state.groupSoundType });
    }
    if (state.modalState.voiceVolume !== state.voiceVolume) {
        promises.push(sendMessageToContentScript({ type: 'SET_VOICE_VOLUME', volume: state.modalState.voiceVolume / 100 }));
        state.voiceVolume = state.modalState.voiceVolume;
        chrome.storage.local.set({ voiceVolumeLevel: state.voiceVolume });
    }

    Promise.all(promises).then(() => {
        showToast('Настройки сохранены', 'success');
        hideModal(elements.soundSettingsModal);
    }).catch(() => {
        showToast('Ошибка сохранения', 'error');
    });
}

function updateSoundVolume() {
    if (!elements.soundVolumeSlider) return;
    const val = parseInt(elements.soundVolumeSlider.value);
    state.soundVolume = val;
    if (elements.soundVolumeValue) elements.soundVolumeValue.textContent = val + '%';
    updateVolumeIndicators('soundVolumeSlider', '.volume-level-indicator[data-for="sound"] span');
    sendMessageToContentScript({ type: 'SET_VOLUME', volume: val / 100 }).catch(() => logger.warn('Volume change failed: content script not ready'));
    chrome.storage.local.set({ soundVolumeLevel: val });
}

function updateGroupVolume() {
    if (!elements.groupVolumeSlider) return;
    const val = parseInt(elements.groupVolumeSlider.value);
    state.groupVolume = val;
    if (elements.groupVolumeValue) elements.groupVolumeValue.textContent = val + '%';
    updateVolumeIndicators('groupVolumeSlider', '.volume-level-indicator[data-for="group"] span');
    sendMessageToContentScript({ type: 'SET_GROUP_VOLUME', volume: val / 100 }).catch(() => logger.warn('Group volume change failed: content script not ready'));
    chrome.storage.local.set({ groupVolumeLevel: val });
}

export {
    loadSettings, updateSoundInfo, updateSoundToggle, updateDashboardSoundButton,
    toggleSoundHandler, toggleSoundFromDashboard, toggleGroupMonitoringHandler,
    testSoundAlert, testGroupSoundAlert, showSoundSettings, saveSoundSettings,
    loadSoundOptions, syncModalStateFromStorage, updateModalNotificationType,
    updateSoundVolume, updateGroupVolume, getDefaultSoundOptions, getDefaultGroupSoundOptions,
};
