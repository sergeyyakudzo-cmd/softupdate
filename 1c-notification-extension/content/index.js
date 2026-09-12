// Импортируем всё в порядке зависимостей
// Сначала скрипты, которые устанавливают глобалы (побочные эффекты)
import '../config.js';          // window.CONFIG
import '../logger.js';          // window.logger, globalThis.logger
import '../shared/constants.js'; // window.SHARED_CONSTANTS, self.SHARED_CONSTANTS
import '../utils.js';           // window.utils, window.storageUtils
import '../max.js';             // window.maxModule
import '../update-generator.js'; // window.generateUpdateBat

// Затем наши модули
import { state, storage, checkIntervalId, audioContext, setCheckIntervalId, setAudioContext } from './state.js';
import { soundDisableTimer, setSoundDisableEndTime, setSoundDisableTimer } from './state.js';
import { APP_CONFIG } from './config.js';
import { voice } from './voice.js';
import { audio } from './audio.js';
import { soundManager } from './sound.js';
import { monitor } from './monitor.js';
import { nightAutoEnable } from './night.js';

// Инициализация
async function init() {
    try {
        const data = await storage.get([
            'soundEnabled', 'classSoundEnabled', 'groupSoundEnabled',
            'soundVolumeLevel', 'groupVolumeLevel', 'voiceVolumeLevel',
            'groupMonitoringEnabled', 'soundDisableEndTime', 'checkInterval', 'notificationCooldown',
            'notificationType', 'soundType', 'groupSoundType', 'autoRestartEnabled', 'autoRestartInterval',
            'nightAutoEnableEnabled', 'maxEnabled', 'maxUserId', 'ignoredNumbers',
            'autoTakeEnabled', 'autoTakeTimeout', 'notificationThreshold'
        ]);

        state.soundEnabled = data.soundEnabled !== false;
        state.classSoundEnabled = data.classSoundEnabled !== false;
        state.groupSoundEnabled = data.groupSoundEnabled !== false;
        state.notificationType = data.notificationType || 'sound';
        state.soundType = data.soundType || 'modern';
        state.groupSoundType = data.groupSoundType || 'group_chime';
        state.voiceVolume = data.voiceVolumeLevel ? data.voiceVolumeLevel / 100 : 1.0;
        state.soundVolume = data.soundVolumeLevel ? data.soundVolumeLevel / 100 : 0.8;
        state.groupVolume = data.groupVolumeLevel ? data.groupVolumeLevel / 100 : 0.7;
        state.isGroupMonitoring = data.groupMonitoringEnabled === true;
        state.checkInterval = parseInt(data.checkInterval) || APP_CONFIG.DEFAULT_CHECK_INTERVAL;
        state.notificationCooldown = parseInt(data.notificationCooldown) || APP_CONFIG.DEFAULT_COOLDOWN;
        state.autoRestartEnabled = data.autoRestartEnabled === true;
        state.autoRestartInterval = parseInt(data.autoRestartInterval) || 30000;
        state.notificationThreshold = parseInt(data.notificationThreshold) || 1;
        state.ignoredNumbers = data.ignoredNumbers || [];
        state.maxEnabled = data.maxEnabled === true;
        state.autoTakeEnabled = data.autoTakeEnabled === true;
        state.autoTakeTimeout = parseInt(data.autoTakeTimeout) || 240000;

        if (data.soundDisableEndTime) {
            const now = Date.now();
            if (now < data.soundDisableEndTime) {
                state.soundEnabled = false;
                setSoundDisableEndTime(data.soundDisableEndTime);
                setSoundDisableTimer(setTimeout(() => soundManager.enable(), data.soundDisableEndTime - now));
            } else {
                await storage.remove('soundDisableEndTime');
            }
        }

        if (state.autoRestartEnabled && !state.isMonitoring) {
            state.isMonitoring = true;
            monitor.start();
        }

        voice.init();
        await nightAutoEnable.init();
        if (window.maxModule) window.maxModule.init().catch(err => logger.warn('MAX init failed:', err.message));
        monitor.startShiftTracking();

        setTimeout(() => {
            const counts = monitor.countRealApplications();
            state.lastCount = counts.count;
            state.lastGroupCount = counts.groupCount;
            monitor.sendStateUpdate(counts);
        }, 1000);

    } catch (error) {
        logger.error('🔧 Initialization failed:', error);
    }
}

// Обработчик сообщений
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    Promise.resolve().then(async () => {
        try {
            switch (message.type) {
                case 'GET_STATUS': {
                    const counts = monitor.countRealApplications();
                    const info = soundManager.getInfo();
                    return {
                        status: state.isMonitoring ? 'Активен' : 'Остановлен',
                        count: counts.count, groupCount: counts.groupCount,
                        isMonitoring: state.isMonitoring, isGroupMonitoring: state.isGroupMonitoring,
                        checkInterval: state.checkInterval, notificationCooldown: state.notificationCooldown,
                        notificationType: state.notificationType, soundType: state.soundType,
                        groupSoundType: state.groupSoundType, classSoundEnabled: state.classSoundEnabled,
                        groupSoundEnabled: state.groupSoundEnabled, voiceAvailable: info.voiceAvailable,
                        autoRestartEnabled: state.autoRestartEnabled, autoRestartInterval: state.autoRestartInterval,
                        maxEnabled: window.maxModule?.getSettings()?.enabled || false,
                        maxConfigured: window.maxModule?.getSettings()?.isConfigured || false,
                        autoTakeEnabled: state.autoTakeEnabled, autoTakeTimeout: state.autoTakeTimeout
                    };
                }
                case 'TOGGLE_MONITOR': {
                    state.isMonitoring = !state.isMonitoring;
                    if (state.isMonitoring) monitor.start(); else monitor.stop();
                    const c = monitor.countRealApplications();
                    state.lastCount = c.count; state.lastGroupCount = c.groupCount;
                    monitor.sendStateUpdate(c);
                    return { status: state.isMonitoring ? 'Активен' : 'Остановлен', count: state.lastCount, groupCount: state.lastGroupCount, isMonitoring: state.isMonitoring };
                }
                case 'TOGGLE_GROUP_MONITOR': {
                    state.isGroupMonitoring = !state.isGroupMonitoring;
                    await storage.set({ groupMonitoringEnabled: state.isGroupMonitoring });
                    const c = monitor.countRealApplications();
                    state.lastCount = c.count; state.lastGroupCount = c.groupCount;
                    monitor.sendStateUpdate(c);
                    return { isGroupMonitoring: state.isGroupMonitoring, count: state.lastCount, groupCount: state.lastGroupCount };
                }
                case 'SET_SOUND_SETTING': return message.soundEnabled === false ? await soundManager.handleDisableRequest() : await soundManager.enable();
                case 'ENABLE_SOUND': return await soundManager.enable();
                case 'SET_CLASS_SOUND_ENABLED': return await soundManager.setClassSoundEnabled(message.enabled);
                case 'SET_GROUP_SOUND_ENABLED': return await soundManager.setGroupSoundEnabled(message.enabled);
                case 'GET_SOUND_INFO': return soundManager.getInfo();
                case 'SET_VOLUME': return await soundManager.setSoundVolume(message.volume);
                case 'SET_GROUP_VOLUME': return await soundManager.setGroupVolume(message.volume);
                case 'SET_VOICE_VOLUME': return await soundManager.setVoiceVolume(message.volume);
                case 'SET_NOTIFICATION_TYPE': return await soundManager.setNotificationType(message.notificationType);
                case 'SET_SOUND_TYPE': return await soundManager.setSoundType(message.soundType);
                case 'SET_GROUP_SOUND_TYPE': return await soundManager.setGroupSoundType(message.soundType);
                case 'GET_SOUND_OPTIONS': return { success: true, soundOptions: audio.getAvailableSounds(), groupSoundOptions: audio.getAvailableGroupSounds() };
                case 'TEST_SOUND': if (message.soundType) audio.testSound(message.soundType); else audio.testSound(); return { success: true };
                case 'TEST_GROUP_SOUND': if (message.soundType) audio.testGroupSound(message.soundType); else audio.testGroupSound(); return { success: true };
                case 'TEST_VOICE': await voice.testVoice(); return { success: true };
                case 'SET_INTERVALS': {
                    state.checkInterval = parseInt(message.checkInterval) || APP_CONFIG.DEFAULT_CHECK_INTERVAL;
                    state.notificationCooldown = parseInt(message.notificationCooldown) || APP_CONFIG.DEFAULT_COOLDOWN;
                    await storage.set({ checkInterval: state.checkInterval, notificationCooldown: state.notificationCooldown });
                    if (state.isMonitoring) monitor.restart();
                    return { success: true, checkInterval: state.checkInterval, notificationCooldown: state.notificationCooldown };
                }
                case 'GET_INTERVALS': return { checkInterval: state.checkInterval, notificationCooldown: state.notificationCooldown };
                case 'TOGGLE_NIGHT_AUTO_ENABLE': return await nightAutoEnable.setEnabled(message.enabled);
                case 'GET_NIGHT_AUTO_ENABLE_STATUS': return nightAutoEnable.getStatus();
                case 'GET_APPLICATION_NUMBERS': {
                    const c = monitor.countRealApplications();
                    return { success: true, classificationNumbers: c.onlyClassification, groupNumbers: c.onlyGroup, allNumbers: c.allNumbers };
                }
                case 'UPDATE_MAX_ENABLED': if (window.maxModule) return await window.maxModule.saveSettings({ enabled: message.enabled }); return { success: false, error: 'MAX module not loaded' };
                case 'UPDATE_MAX_USER_ID': if (window.maxModule) return await window.maxModule.saveSettings({ userId: message.userId }); return { success: false, error: 'MAX module not loaded' };
                case 'UPDATE_NOTIFICATION_THRESHOLD': state.notificationThreshold = parseInt(message.threshold) || 1; await storage.set({ notificationThreshold: state.notificationThreshold }); return { success: true };
                case 'UPDATE_AUTO_TAKE_ENABLED': state.autoTakeEnabled = message.enabled === true; await storage.set({ autoTakeEnabled: state.autoTakeEnabled }); return { success: true };
                case 'UPDATE_AUTO_TAKE_TIMEOUT': state.autoTakeTimeout = parseInt(message.timeout) || 240000; await storage.set({ autoTakeTimeout: state.autoTakeTimeout }); return { success: true };
                case 'UPDATE_IGNORED_NUMBERS': {
                    state.ignoredNumbers = message.numbers || [];
                    await storage.set({ ignoredNumbers: state.ignoredNumbers });
                    return { success: true };
                }
                default: return { error: 'Unknown command' };
            }
        } catch (error) {
            logger.error('🔧 Error processing message:', error);
            return { error: error.message };
        }
    }).then(sendResponse).catch(error => { logger.error('🔧 Message handler error:', error); sendResponse({ error: error.message }); });
    return true;
});

// Очистка
window.addEventListener('beforeunload', () => {
    if (checkIntervalId) clearInterval(checkIntervalId);
    if (monitor.shiftTrackingIntervalId !== null) { clearInterval(monitor.shiftTrackingIntervalId); monitor.shiftTrackingIntervalId = null; }
    if (window.__soundTimers) { window.__soundTimers.forEach(clearTimeout); window.__soundTimers = []; }
    if (audioContext) { audioContext.close(); setAudioContext(null); }
    if (soundDisableTimer) clearTimeout(soundDisableTimer);
});

init().catch(e => logger.error('content.js init error:', e));
