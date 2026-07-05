logger.logModuleLoad('content-config.js');

const APP_CONFIG = {
    DEFAULT_CHECK_INTERVAL: (typeof window.SHARED_CONSTANTS !== 'undefined') 
        ? window.SHARED_CONSTANTS.INTERVALS.DEFAULT_CHECK 
        : 10000,
    DEFAULT_COOLDOWN: (typeof window.SHARED_CONSTANTS !== 'undefined') 
        ? window.SHARED_CONSTANTS.INTERVALS.DEFAULT_COOLDOWN 
        : 10000,
    NIGHT_TIME_START: (typeof window.SHARED_CONSTANTS !== 'undefined') 
        ? window.SHARED_CONSTANTS.NIGHT_MODE.START 
        : 22,
    NIGHT_TIME_END: (typeof window.SHARED_CONSTANTS !== 'undefined') 
        ? window.SHARED_CONSTANTS.NIGHT_MODE.END 
        : 8,
    MAX_NIGHT_DISABLE_MINUTES: (typeof window.SHARED_CONSTANTS !== 'undefined') 
        ? window.SHARED_CONSTANTS.NIGHT_MODE.MAX_DISABLE_MINUTES 
        : 10,
    HD_PATTERN: (typeof window.SHARED_CONSTANTS !== 'undefined') 
        ? window.SHARED_CONSTANTS.MONITORING.HD_PATTERN 
        : 'HD'
};
