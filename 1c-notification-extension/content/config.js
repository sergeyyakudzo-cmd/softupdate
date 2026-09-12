window.__soundTimers = [];
window.__st = (fn, delay) => {
    const id = setTimeout(fn, delay);
    window.__soundTimers.push(id);
    if (window.__soundTimers.length > 200) window.__soundTimers.splice(0, window.__soundTimers.length - 200);
    return id;
};

export const APP_CONFIG = {
    DEFAULT_CHECK_INTERVAL: window.SHARED_CONSTANTS?.INTERVALS?.DEFAULT_CHECK || 10000,
    DEFAULT_COOLDOWN: window.SHARED_CONSTANTS?.INTERVALS?.DEFAULT_COOLDOWN || 10000,
    NIGHT_TIME_START: window.SHARED_CONSTANTS?.NIGHT_MODE?.START || 22,
    NIGHT_TIME_END: window.SHARED_CONSTANTS?.NIGHT_MODE?.END || 8,
    MAX_NIGHT_DISABLE_MINUTES: window.SHARED_CONSTANTS?.NIGHT_MODE?.MAX_DISABLE_MINUTES || 10,
    HD_PATTERN: window.SHARED_CONSTANTS?.MONITORING?.HD_PATTERN || 'HD'
};
