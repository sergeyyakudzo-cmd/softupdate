import { state, appUtils, storage } from './state.js';
import { soundManager } from './sound.js';

export const nightAutoEnable = {
    timer: null,
    enabled: false,

    async init() {
        const data = await storage.get(['nightAutoEnableEnabled']);
        this.enabled = !!(data.nightAutoEnableEnabled);
        if (this.enabled) this.start();
    },

    isNightTime() { return appUtils.isNightTime(); },

    async enableSoundForPeriod() {
        if (!this.isNightTime()) return false;
        try { await soundManager.enable(); return true; } catch (e) { logger.error('🌙 Ошибка ночного авто-включения:', e); }
        return false;
    },

    async start() {
        if (this.timer) clearInterval(this.timer);
        if (this.isNightTime() && !state.soundEnabled) await this.enableSoundForPeriod();
        this.timer = setInterval(async () => {
            if (this.isNightTime() && !state.soundEnabled) await this.enableSoundForPeriod();
        }, 300000);
    },

    stop() {
        if (this.timer) { clearInterval(this.timer); this.timer = null; }
    },

    async setEnabled(enabled) {
        this.enabled = enabled;
        await storage.set({ nightAutoEnableEnabled: enabled });
        if (enabled) this.start(); else this.stop();
        return { success: true };
    },

    getStatus() { return { enabled: this.enabled, isNightTime: this.isNightTime(), nextCheck: this.timer ? 'активен' : 'не активен' }; }
};
