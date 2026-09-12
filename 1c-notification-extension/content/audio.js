import { state, setAudioContext, appUtils } from './state.js';
import { SOUND_LIBRARY, GROUP_SOUND_LIBRARY } from './sounds.js';

let ctx = null;

export const audio = {
    ensureActivated() {
        if (!ctx && state.soundEnabled) {
            try {
                ctx = new (window.AudioContext || window.webkitAudioContext)();
                setAudioContext(ctx);
            } catch (e) { logger.error('🔊 Audio initialization failed:', e); }
        }
        return !!ctx;
    },

    async playSound(soundType = state.soundType, volume = state.soundVolume, isGroup = false) {
        const channelEnabled = isGroup ? state.groupSoundEnabled : state.classSoundEnabled;
        if (!state.soundEnabled || !channelEnabled || !this.ensureActivated()) return;
        try {
            if (ctx?.state === 'suspended') await ctx.resume();
            const lib = isGroup ? GROUP_SOUND_LIBRARY : SOUND_LIBRARY;
            const sound = lib[soundType] || lib.classic;
            sound?.play(ctx, volume);
        } catch (e) { logger.error('🔊 Sound playback error:', e); }
    },

    playClassificationAlert() { this.playSound(state.soundType, state.soundVolume, false); },
    playGroupAlert() { this.playSound(state.groupSoundType, state.groupVolume, true); },
    testSound(soundType = state.soundType) { this.playSound(soundType, state.soundVolume, false); },
    testGroupSound(soundType = state.groupSoundType) { this.playSound(soundType, state.groupVolume, true); },
    getAvailableSounds() { return appUtils.getSoundOptions(); },
    getAvailableGroupSounds() { return appUtils.getGroupSoundOptions(); }
};
