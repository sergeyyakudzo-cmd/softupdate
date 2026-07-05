logger.logModuleLoad('content-sound.js');

const soundManager = {
    async disableForNight() {
        const disableDuration = appUtils.getMaxDisableTime();
        const endTime = Date.now() + disableDuration;
        
        soundDisableEndTime = endTime;
        state.soundEnabled = false;
        
        await storage.set({
            soundEnabled: false,
            soundDisableEndTime: endTime
        });
        
        soundDisableTimer = setTimeout(() => {
            this.enable();
        }, disableDuration);
        
        logger.log(`🔊 Sound disabled for ${APP_CONFIG.MAX_NIGHT_DISABLE_MINUTES} minutes (night time limit)`);
        
        return {
            success: true,
            duration: APP_CONFIG.MAX_NIGHT_DISABLE_MINUTES,
            reason: 'night_time_limit'
        };
    },
    
    async disableIndefinitely() {
        await this.clearTimers();
        state.soundEnabled = false;
        soundDisableEndTime = null;
        
        await storage.set({ soundEnabled: false });
        await storage.remove('soundDisableEndTime');
        
        logger.log('🔊 Sound disabled indefinitely');
        
        return { success: true, reason: 'indefinite' };
    },
    
    async enable() {
        await this.clearTimers();
        state.soundEnabled = true;
        soundDisableEndTime = null;
        
        await storage.set({ soundEnabled: true });
        await storage.remove('soundDisableEndTime');
        
        logger.log('🔊 Sound enabled');
        
        return { success: true };
    },
    
    async clearTimers() {
        if (soundDisableTimer) {
            clearTimeout(soundDisableTimer);
            soundDisableTimer = null;
        }
    },
    
    getInfo() {
        const now = Date.now();
        const isNight = appUtils.isNightTime();
        
        let timeLeft = null;
        if (soundDisableEndTime) {
            timeLeft = Math.max(0, soundDisableEndTime - now);
        }
        
        return {
            enabled: state.soundEnabled,
            isNightTime: isNight,
            maxDisableMinutes: APP_CONFIG.MAX_NIGHT_DISABLE_MINUTES,
            timeLeft,
            disableEndTime: soundDisableEndTime ? new Date(soundDisableEndTime) : null,
            canDisableIndefinitely: !isNight,
            notificationType: state.notificationType,
            soundType: state.soundType,
            groupSoundType: state.groupSoundType,
            voiceAvailable: voice.isAvailable(),
            soundOptions: appUtils.getSoundOptions(),
            groupSoundOptions: appUtils.getGroupSoundOptions()
        };
    },
    
    async handleDisableRequest() {
        if (appUtils.isNightTime()) {
            return await this.disableForNight();
        } else {
            return await this.disableIndefinitely();
        }
    },
    
    async setNotificationType(type) {
        state.notificationType = type;
        await storage.set({ notificationType: type });
        return { success: true };
    },
    
    async setSoundType(soundType) {
        if (SOUND_LIBRARY[soundType]) {
            state.soundType = soundType;
            await storage.set({ soundType: soundType });
            return { success: true };
        }
        return { success: false, error: 'Invalid sound type' };
    },
    
    async setGroupSoundType(soundType) {
        if (GROUP_SOUND_LIBRARY[soundType]) {
            state.groupSoundType = soundType;
            await storage.set({ groupSoundType: soundType });
            return { success: true };
        }
        return { success: false, error: 'Invalid sound type' };
    },
    
    async setVoiceVolume(volume) {
        state.voiceVolume = volume;
        await storage.set({ voiceVolumeLevel: Math.round(volume * 100) });
        return { success: true };
    },
    
    async setSoundVolume(volume) {
        state.soundVolume = volume;
        await storage.set({ soundVolumeLevel: Math.round(volume * 100) });
        return { success: true };
    },
    
    async setGroupVolume(volume) {
        state.groupVolume = volume;
        await storage.set({ groupVolumeLevel: Math.round(volume * 100) });
        return { success: true };
    }
};
