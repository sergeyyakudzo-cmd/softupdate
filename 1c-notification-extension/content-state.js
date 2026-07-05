logger.logModuleLoad('content-state.js');

const state = {
    isMonitoring: false,
    isGroupMonitoring: false,
    lastCount: 0,
    lastGroupCount: 0,
    soundEnabled: true,
    notificationType: 'sound',
    soundType: 'modern',
    groupSoundType: 'group_chime',
    voiceVolume: 1.0,
    soundVolume: 0.8,
    groupVolume: 0.7,
    checkInterval: APP_CONFIG.DEFAULT_CHECK_INTERVAL,
    notificationCooldown: APP_CONFIG.DEFAULT_COOLDOWN,
    lastNotificationTime: 0,
    
    autoRestartEnabled: false,
    autoRestartInterval: 30000,
    
    maxEnabled: false,
    
    ignoredNumbers: [],
    
    autoTakeEnabled: false,
    autoTakeTimeout: 240000,
    autoTakeProcessing: false,
    trackedTickets: {},
    takenTickets: {}
};

let audioContext = null;
let soundDisableTimer = null;
let soundDisableEndTime = null;
let checkIntervalId = null;
let speechSynthesis = window.speechSynthesis;
let contextInvalidated = false;

function safeSendMessage(message) {
    if (contextInvalidated) return Promise.resolve(null);
    try {
        return chrome.runtime.sendMessage(message).catch(error => {
            if (error.message && error.message.includes('Extension context invalidated')) {
                contextInvalidated = true;
                logger.warn('🔧 Extension context invalidated — stopping all operations');
                if (typeof monitor !== 'undefined' && monitor.stop) monitor.stop();
                return null;
            }
            throw error;
        });
    } catch (e) {
        contextInvalidated = true;
        if (typeof monitor !== 'undefined' && monitor.stop) monitor.stop();
        return Promise.resolve(null);
    }
}

if (chrome.runtime && chrome.runtime.onDisconnect) {
    chrome.runtime.onDisconnect.addListener(() => {
        contextInvalidated = true;
        logger.warn('🔧 Extension disconnected');
        if (typeof monitor !== 'undefined' && monitor.stop) monitor.stop();
    });
}

function sendCdpMouseClick(x, y, button = 0) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: 'CDP_MOUSE_CLICK', x, y, button }, (response) => {
            if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
            if (response?.success) resolve(response);
            else reject(new Error(response?.error || 'CDP mouse click failed'));
        });
    });
}

function sendCdpKey(key) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: 'CDP_KEY', key }, (response) => {
            if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
            if (response?.success) resolve(response);
            else reject(new Error(response?.error || 'CDP key failed'));
        });
    });
}

const appUtils = {
    isNightTime() {
        const hours = new Date().getHours();
        return hours >= APP_CONFIG.NIGHT_TIME_START || hours < APP_CONFIG.NIGHT_TIME_END;
    },
    
    getMaxDisableTime() {
        return APP_CONFIG.MAX_NIGHT_DISABLE_MINUTES * 60 * 1000;
    },
    
    canNotify() {
        const now = Date.now();
        return (now - state.lastNotificationTime) >= state.notificationCooldown;
    },
    
    getNumberWord(num) {
        return window.utils.getNumberWord(num);
    },
    
    getCaseWord(num, forms) {
        return window.utils.getCaseWord(num, forms);
    },
    
    getSoundOptions() {
        return Object.keys(SOUND_LIBRARY).map(key => ({
            id: key,
            name: SOUND_LIBRARY[key].name,
            description: SOUND_LIBRARY[key].description
        }));
    },
    
    getGroupSoundOptions() {
        return Object.keys(GROUP_SOUND_LIBRARY).map(key => ({
            id: key,
            name: GROUP_SOUND_LIBRARY[key].name,
            description: GROUP_SOUND_LIBRARY[key].description
        }));
    }
};

const storage = window.storageUtils;
