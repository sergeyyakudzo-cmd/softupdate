import { state, appUtils, storage } from './state.js';
import { setSoundDisableEndTime, setSoundDisableTimer, soundDisableTimer, soundDisableEndTime } from './state.js';
import { SOUND_LIBRARY, GROUP_SOUND_LIBRARY } from './sounds.js';
import { voice } from './voice.js';
import { APP_CONFIG } from './config.js';

export const soundManager = {
    async disableForNight() {
        const dur = appUtils.getMaxDisableTime();
        const end = Date.now() + dur;
        setSoundDisableEndTime(end);
        state.soundEnabled = false;
        await storage.set({ soundEnabled: false, soundDisableEndTime: end });
        if (soundDisableTimer) clearTimeout(soundDisableTimer);
        setSoundDisableTimer(setTimeout(() => this.enable(), dur));
        logger.log(`🔊 Sound disabled for ${Math.round(dur/60000)} minutes (night time limit)`);
        return { success: true, duration: APP_CONFIG.MAX_NIGHT_DISABLE_MINUTES, reason: 'night_time_limit' };
    },

    async disableIndefinitely() {
        await this.clearTimers();
        state.soundEnabled = false;
        setSoundDisableEndTime(null);
        await storage.set({ soundEnabled: false });
        await storage.remove('soundDisableEndTime');
        return { success: true, reason: 'indefinite' };
    },

    async enable() {
        await this.clearTimers();
        state.soundEnabled = true;
        setSoundDisableEndTime(null);
        await storage.set({ soundEnabled: true });
        await storage.remove('soundDisableEndTime');
        return { success: true };
    },

    async clearTimers() {
        if (soundDisableTimer) { clearTimeout(soundDisableTimer); setSoundDisableTimer(null); }
    },

    getInfo() {
        const now = Date.now();
        let timeLeft = soundDisableEndTime ? Math.max(0, soundDisableEndTime - now) : null;
        return {
            enabled: state.soundEnabled,
            isNightTime: appUtils.isNightTime(),
            maxDisableMinutes: APP_CONFIG.MAX_NIGHT_DISABLE_MINUTES,
            timeLeft,
            disableEndTime: soundDisableEndTime ? new Date(soundDisableEndTime) : null,
            canDisableIndefinitely: !appUtils.isNightTime(),
            notificationType: state.notificationType,
            soundType: state.soundType,
            groupSoundType: state.groupSoundType,
            voiceAvailable: voice?.isAvailable() || false,
            soundOptions: appUtils.getSoundOptions(),
            groupSoundOptions: appUtils.getGroupSoundOptions()
        };
    },

    async handleDisableRequest() {
        return appUtils.isNightTime() ? await this.disableForNight() : await this.disableIndefinitely();
    },

    async setNotificationType(type) { state.notificationType = type; await storage.set({ notificationType: type }); return { success: true }; },
    async setSoundType(type) { if (SOUND_LIBRARY[type]) { state.soundType = type; await storage.set({ soundType: type }); return { success: true }; } return { success: false, error: 'Invalid sound type' }; },
    async setGroupSoundType(type) { if (GROUP_SOUND_LIBRARY[type]) { state.groupSoundType = type; await storage.set({ groupSoundType: type }); return { success: true }; } return { success: false, error: 'Invalid sound type' }; },
    async setVoiceVolume(vol) { state.voiceVolume = vol; await storage.set({ voiceVolumeLevel: Math.round(vol * 100) }); return { success: true }; },
    async setSoundVolume(vol) { state.soundVolume = vol; await storage.set({ soundVolumeLevel: Math.round(vol * 100) }); return { success: true }; },
    async setGroupVolume(vol) { state.groupVolume = vol; await storage.set({ groupVolumeLevel: Math.round(vol * 100) }); return { success: true }; }
};
