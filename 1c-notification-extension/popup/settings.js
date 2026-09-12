import { state, elements } from './state.js';
import { showToast, sendMessageToContentScript } from './utils.js';

function updateAutoRestartUI() {
    if (!elements.toggleAutoRestart) return;
    elements.toggleAutoRestart.checked = state.autoRestartEnabled;
    if (elements.autoRestartInterval) elements.autoRestartInterval.value = String(state.autoRestartInterval);
    if (elements.autoRestartStatus) {
        if (state.autoRestartEnabled) {
            elements.autoRestartStatus.textContent = 'Активно - перезапуск каждые ' + Math.round(state.autoRestartInterval / 1000) + ' сек';
            elements.autoRestartStatus.style.color = 'var(--primary)';
        } else {
            elements.autoRestartStatus.textContent = 'Не активно';
            elements.autoRestartStatus.style.color = 'var(--text-gray)';
        }
    }
}

function updateAutoTakeUI() {
    if (!elements.toggleAutoTake) return;
    elements.toggleAutoTake.checked = state.autoTakeEnabled;
    if (elements.autoTakeTimeout) elements.autoTakeTimeout.value = String(state.autoTakeTimeout);
    if (elements.currentAutoTakeTimeout) elements.currentAutoTakeTimeout.textContent = String(Math.round(state.autoTakeTimeout / 60000));
    if (elements.autoTakeStatus) {
        elements.autoTakeStatus.innerHTML = state.autoTakeEnabled
            ? '<i class="fas fa-check-circle" style="color: var(--success);"></i> Активно — через ' + Math.round(state.autoTakeTimeout / 60000) + ' мин'
            : '<i class="fas fa-times-circle" style="color: var(--text-lighter);"></i> Не активно';
    }
}

function updateNightAutoEnableUI() {
    if (!elements.toggleNightAutoEnable) return;
    elements.toggleNightAutoEnable.checked = state.nightAutoEnableEnabled;
    if (elements.nightAutoEnableStatus) {
        if (state.nightAutoEnableEnabled) {
            const start = (window.SHARED_CONSTANTS?.NIGHT_MODE?.START || 22).toString().padStart(2, '0');
            const end = (window.SHARED_CONSTANTS?.NIGHT_MODE?.END || 8).toString().padStart(2, '0');
            elements.nightAutoEnableStatus.textContent = `Авто-включение активно (${start}:00-${end}:00)`;
            elements.nightAutoEnableStatus.style.color = 'var(--success)';
            updateNextNightEnableTime();
        } else {
            elements.nightAutoEnableStatus.textContent = 'Авто-включение выключено';
            elements.nightAutoEnableStatus.style.color = 'var(--text-gray)';
            if (elements.nextNightEnableTime) elements.nextNightEnableTime.textContent = '';
        }
    }
}

function updateNextNightEnableTime() {
    if (!state.nightAutoEnableEnabled || !elements.nextNightEnableTime) return;
    const hour = new Date().getHours();
    elements.nextNightEnableTime.textContent = (hour >= 22 || hour < 8) ? 'Активно (ночной режим)' : 'След. включение: 22:00';
}

function updateCurrentIntervalsDisplay() {
    if (elements.checkInterval) state.checkInterval = parseInt(elements.checkInterval.value) || 10000;
    if (elements.notificationCooldown) state.notificationCooldown = parseInt(elements.notificationCooldown.value) || 10000;
}

function toggleAutoRestartHandler() {
    state.autoRestartEnabled = !state.autoRestartEnabled;
    chrome.storage.local.set({ autoRestartEnabled: state.autoRestartEnabled });
    showToast(state.autoRestartEnabled ? 'Авто-перезапуск активирован' : 'Авто-перезапуск отключён',
        state.autoRestartEnabled ? 'success' : 'warning');
    updateAutoRestartUI();
}

function updateAutoRestartInterval() {
    if (!elements.autoRestartInterval) return;
    state.autoRestartInterval = parseInt(elements.autoRestartInterval.value) || 30000;
    chrome.storage.local.set({ autoRestartInterval: state.autoRestartInterval });
    if (state.autoRestartEnabled) {
        startAutoRestartTimer();
    }
    updateAutoRestartUI();
}

function toggleAutoTakeHandler() {
    state.autoTakeEnabled = !state.autoTakeEnabled;
    chrome.storage.local.set({ autoTakeEnabled: state.autoTakeEnabled });
    sendMessageToContentScript({ type: 'UPDATE_AUTO_TAKE_ENABLED', enabled: state.autoTakeEnabled }).catch(() => {});
    showToast(state.autoTakeEnabled ? 'Авто-взятие активировано' : 'Авто-взятие отключено', state.autoTakeEnabled ? 'success' : 'warning');
    updateAutoTakeUI();
}

function updateAutoTakeTimeout() {
    if (!elements.autoTakeTimeout) return;
    state.autoTakeTimeout = parseInt(elements.autoTakeTimeout.value) || 240000;
    chrome.storage.local.set({ autoTakeTimeout: state.autoTakeTimeout });
    sendMessageToContentScript({ type: 'UPDATE_AUTO_TAKE_TIMEOUT', timeout: state.autoTakeTimeout }).catch(() => {});
    updateAutoTakeUI();
}

function toggleNightAutoEnableHandler() {
    state.nightAutoEnableEnabled = !state.nightAutoEnableEnabled;
    chrome.storage.local.set({ nightAutoEnableEnabled: state.nightAutoEnableEnabled });
    sendMessageToContentScript({ type: 'TOGGLE_NIGHT_AUTO_ENABLE', enabled: state.nightAutoEnableEnabled }).catch(() => {});
    showToast(state.nightAutoEnableEnabled ? 'Ночной режим активирован' : 'Ночной режим отключён', 'info');
    updateNightAutoEnableUI();
}

function applyIntervals() {
    const ci = parseInt(elements.checkInterval?.value) || 10000;
    const nc = parseInt(elements.notificationCooldown?.value) || 10000;
    state.checkInterval = ci;
    state.notificationCooldown = nc;
    chrome.storage.local.set({ checkInterval: ci, notificationCooldown: nc });
    sendMessageToContentScript({ type: 'SET_INTERVALS', checkInterval: ci, notificationCooldown: nc })
        .then(() => showToast('Интервалы обновлены', 'success'))
        .catch(() => showToast('Ошибка: Обновите страницу 1С', 'error'));
}

function updateNotificationThreshold() {
    const val = parseInt(elements.notificationThreshold?.value) || 1;
    state.notificationThreshold = Math.max(1, Math.min(50, val));
    chrome.storage.local.set({ notificationThreshold: state.notificationThreshold });
    if (elements.notificationThreshold) elements.notificationThreshold.value = String(state.notificationThreshold);
    sendMessageToContentScript({ type: 'UPDATE_NOTIFICATION_THRESHOLD', threshold: state.notificationThreshold }).catch(() => logger.warn('Threshold update failed: content script not ready'));
}

function exportSettings() {
    chrome.storage.local.get([
        'soundEnabled', 'soundVolumeLevel', 'groupVolumeLevel', 'voiceVolumeLevel',
        'soundType', 'groupSoundType', 'notificationType',
        'groupMonitoringEnabled', 'checkInterval', 'notificationCooldown', 'notificationThreshold',
        'maxEnabled', 'maxUserId', 'autoRestartEnabled', 'autoRestartInterval',
        'autoTakeEnabled', 'autoTakeTimeout', 'nightAutoEnableEnabled',
        'ignoredNumbers', 'extensionFolder', 'sectionStates', 'sectionOpenCounts',
        'popupOpenCount', 'dailyStats', 'popupWidth', 'popupHeight'
    ], (data) => {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '1c-monitor-settings-' + new Date().toISOString().slice(0, 10) + '.json';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
        showToast('Настройки экспортированы', 'success');
    });
}

function importSettings() {
    if (elements.importFileInput) elements.importFileInput.click();
}

function handleImportFile(event) {
    const input = event.target;
    const file = input.files ? input.files[0] : null;
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (typeof data !== 'object' || data === null || Array.isArray(data)) {
                showToast('Ошибка: файл должен содержать объект с настройками', 'error');
                return;
            }
            const allowedKeys = {
                soundEnabled: 'boolean', soundVolumeLevel: 'number', groupVolumeLevel: 'number', voiceVolumeLevel: 'number',
                soundType: 'string', groupSoundType: 'string', notificationType: 'string', soundDisableEndTime: 'number',
                groupMonitoringEnabled: 'boolean', checkInterval: 'number', notificationCooldown: 'number', notificationThreshold: 'number',
                ignoredNumbers: 'array', autoRestartEnabled: 'boolean', autoRestartInterval: 'number',
                autoTakeEnabled: 'boolean', autoTakeTimeout: 'number', nightAutoEnableEnabled: 'boolean',
                sectionStates: 'object', sectionOpenCounts: 'object', popupOpenCount: 'number',
                maxEnabled: 'boolean', maxUserId: 'string', extensionFolder: 'string', dailyStats: 'object'
            };
            const clean = {};
            let validCount = 0;
            for (const [key, value] of Object.entries(data)) {
                if (!(key in allowedKeys)) continue;
                const actualType = Array.isArray(value) ? 'array' : typeof value;
                if (actualType !== allowedKeys[key]) continue;
                clean[key] = value;
                validCount++;
            }
            if (validCount === 0) { showToast('Ошибка: в файле нет подходящих настроек', 'error'); return; }
            chrome.storage.local.set(clean, () => {
                showToast(`Импортировано ${validCount} настроек. Перезагрузите popup.`, 'success');
                setTimeout(() => window.location.reload(), 1500);
            });
        } catch (err) { showToast('Ошибка: неверный формат файла', 'error'); }
    };
    reader.readAsText(file);
    input.value = '';
}

function downloadLogs() {
    if (typeof logger !== 'undefined' && logger.download) {
        logger.download().then(success => {
            if (!success) showToast('Нет логов для скачивания', 'info');
        });
    } else {
        // Fallback: получаем логи через background
        chrome.runtime.sendMessage({ type: 'GET_LOGS' }, (response) => {
            if (response && response.logs) {
                const content = response.logs.join('\n');
                const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = '1c-monitor-logs-' + new Date().toISOString().slice(0, 10) + '.txt';
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
            } else {
                showToast('Логи недоступны', 'warning');
            }
        });
    }
}

function clearLogs() {
    if (typeof logger !== 'undefined' && logger.clear) {
        logger.clear().then(() => {
            showToast('Логи очищены', 'success');
            updateLogsInfo();
        });
    } else {
        showToast('Логи недоступны', 'warning');
    }
}

function updateLogsInfo() {
    if (!elements.logsInfo) return;
    if (typeof logger !== 'undefined' && logger.getAll) {
        logger.getAll().then(logs => {
            elements.logsInfo.textContent = logs.length + ' записей';
        }).catch(() => { elements.logsInfo.textContent = '—'; });
    } else {
        elements.logsInfo.textContent = '—';
    }
}

function setupUpdateHandlers() {
    if (elements.checkUpdate && elements.updateStatus) {
        const el = elements.updateStatus;
        elements.checkUpdate.addEventListener('click', () => {
            el.textContent = 'Проверяю на GitHub...';
            const currentVersion = 'v' + chrome.runtime.getManifest().version;
            fetch('https://raw.githubusercontent.com/sergeyyakudzo-cmd/softupdate/main/1c-notification-extension/version.txt')
                .then(r => r.text())
                .then(ver => {
                    ver = ver.trim();
                    const cur = currentVersion.replace('v', '').trim();
                    const git = ver.replace('v', '').trim();
                    const curParts = cur.split('.').map(Number);
                    const gitParts = git.split('.').map(Number);
                    let isNewer = false;
                    for (let i = 0; i < Math.max(curParts.length, gitParts.length); i++) {
                        const c = curParts[i] || 0, g = gitParts[i] || 0;
                        if (g > c) { isNewer = true; break; }
                        if (g < c) break;
                    }
                    if (isNewer) el.innerHTML = '<span style="color:#28a745;">' + currentVersion + '</span> → <span style="color:#dc3545;font-weight:bold;">' + ver + ' (НОВАЯ!)</span>';
                    else if (cur === git) el.innerHTML = '<span style="color:#28a745;">' + currentVersion + '</span> = <span style="color:#28a745;">' + ver + ' (актуально)</span>';
                    else el.innerHTML = '<span style="color:#28a745;">' + currentVersion + '</span> → <span style="color:#28a745;">' + ver + '</span>';
                })
                .catch(() => { el.textContent = 'GitHub недоступен'; });
        });
    }

    if (elements.extensionFolder) {
        const save = function() {
            const folder = this.value.trim();
            if (folder) chrome.storage.local.set({ extensionFolder: folder });
        };
        elements.extensionFolder.addEventListener('change', save);
        elements.extensionFolder.addEventListener('blur', save);
    }

    if (elements.applyUpdate) {
        elements.applyUpdate.addEventListener('click', () => {
            const folder = elements.extensionFolder?.value?.trim();
            const baseUrl = window.CONFIG?.UPDATE?.GITHUB_BASE;
            if (!folder || !baseUrl) {
                showToast('Укажите путь к папке расширения', 'warning');
                return;
            }
            const bat = generateUpdateBat(folder, baseUrl);
            if (!bat) { showToast('Ошибка генерации скрипта', 'error'); return; }
            const blob = new Blob([bat], { type: 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'update-extension.bat';
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
            showToast('Скрипт обновления сохранён', 'success');
        });
    }
}

export {
    updateAutoRestartUI, updateAutoTakeUI, updateNightAutoEnableUI, updateNextNightEnableTime,
    updateCurrentIntervalsDisplay,
    toggleAutoRestartHandler, updateAutoRestartInterval, toggleAutoTakeHandler, updateAutoTakeTimeout,
    toggleNightAutoEnableHandler, applyIntervals, updateNotificationThreshold,
    exportSettings, importSettings, handleImportFile, downloadLogs, clearLogs, updateLogsInfo,
    setupUpdateHandlers,
};
