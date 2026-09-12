import { APP_CONFIG } from './config.js';
import { SOUND_LIBRARY, GROUP_SOUND_LIBRARY } from './sounds.js';

export const state = {
    isMonitoring: false, isGroupMonitoring: false,
    lastCount: 0, lastGroupCount: 0,
    soundEnabled: true, notificationType: 'sound',
    classSoundEnabled: true, groupSoundEnabled: true,
    soundType: 'modern', groupSoundType: 'group_chime',
    voiceVolume: 1.0, soundVolume: 0.8, groupVolume: 0.7,
    checkInterval: APP_CONFIG.DEFAULT_CHECK_INTERVAL,
    notificationCooldown: APP_CONFIG.DEFAULT_COOLDOWN,
    lastNotificationTime: Date.now(),
    lastClassificationNotificationTime: Date.now(),
    lastGroupNotificationTime: Date.now(),
    autoRestartEnabled: false, autoRestartInterval: 30000,
    maxEnabled: false,
    notificationThreshold: 1,
    ignoredNumbers: [],
    autoTakeEnabled: false, autoTakeTimeout: 240000,
    autoTakeProcessing: false,
    trackedTickets: {}, takenTickets: {},
    _lastClickX: 0, _lastClickY: 0
};

export let audioContext = null;
export function setAudioContext(v) { audioContext = v; }
export let soundDisableTimer = null;
export function setSoundDisableTimer(v) { soundDisableTimer = v; }
export let soundDisableEndTime = null;
export function setSoundDisableEndTime(v) { soundDisableEndTime = v; }
export let checkIntervalId = null;
export function setCheckIntervalId(v) { checkIntervalId = v; }
export let contextInvalidated = false;

export function handleContextInvalidated() {
    contextInvalidated = true;
}

export function safeSendMessage(message) {
    if (contextInvalidated) return Promise.resolve(null);
    try {
        return chrome.runtime.sendMessage(message).catch(error => {
            if (error.message?.includes('Extension context invalidated')) {
                handleContextInvalidated();
                return Promise.resolve(null);
            }
            logger.warn('🔧 sendMessage error:', error?.message || error);
            return Promise.resolve(null);
        });
    } catch (e) {
        handleContextInvalidated();
        return Promise.resolve(null);
    }
}

function cdpSendWithRetry(message, retries = 3) {
    const trySend = (attempt) => {
        return chrome.runtime.sendMessage(message).then(response => {
            if (response?.success) return response;
            throw new Error(response?.error || 'CDP command failed');
        }).catch(err => {
            if (attempt < retries) {
                logger.warn(`🔧 CDP retry ${attempt + 1}/${retries}: ${err.message}`);
                return new Promise(r => setTimeout(r, 500)).then(() => trySend(attempt + 1));
            }
            throw err;
        });
    };
    return trySend(0);
}

export function sendCdpMouseClick(x, y, button = 0) {
    return cdpSendWithRetry({ type: 'CDP_MOUSE_CLICK', x, y, button });
}

export function sendCdpKey(key) {
    return cdpSendWithRetry({ type: 'CDP_KEY', key });
}

export const appUtils = {
    isNightTime() {
        const h = new Date().getHours();
        const s = APP_CONFIG.NIGHT_TIME_START, e = APP_CONFIG.NIGHT_TIME_END;
        return s > e ? (h >= s || h < e) : (h >= s && h < e);
    },
    getMaxDisableTime() { return APP_CONFIG.MAX_NIGHT_DISABLE_MINUTES * 60 * 1000; },
    canNotify(type) {
        const now = Date.now();
        const last = type === 'group' ? state.lastGroupNotificationTime : state.lastClassificationNotificationTime;
        return (now - last) >= state.notificationCooldown;
    },
    getNumberWord(num) { return window.utils.getNumberWord(num); },
    getCaseWord(num, forms) { return window.utils.getCaseWord(num, forms); },
    getSoundOptions() {
        return Object.keys(SOUND_LIBRARY).map(k => ({ id: k, name: SOUND_LIBRARY[k].name, description: SOUND_LIBRARY[k].description }));
    },
    getGroupSoundOptions() {
        return Object.keys(GROUP_SOUND_LIBRARY).map(k => ({ id: k, name: GROUP_SOUND_LIBRARY[k].name, description: GROUP_SOUND_LIBRARY[k].description }));
    }
};

export const storage = window.storageUtils;
