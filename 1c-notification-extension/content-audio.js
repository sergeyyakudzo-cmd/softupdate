logger.logModuleLoad('content-audio.js');

const audio = {
    init() {
        if (!audioContext && state.soundEnabled) {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                logger.log('🔊 Audio context initialized');
            } catch (error) {
                logger.error('🔊 Audio initialization failed:', error);
            }
        }
    },
    
    ensureActivated() {
        if (!audioContext && state.soundEnabled) this.init();
        return !!audioContext;
    },
    
    playSound(soundType = state.soundType, volume = state.soundVolume, isGroup = false) {
        if (!state.soundEnabled || !this.ensureActivated()) return;
        
        try {
            if (audioContext.state === 'suspended') audioContext.resume();
            
            const library = isGroup ? GROUP_SOUND_LIBRARY : SOUND_LIBRARY;
            const sound = library[soundType] || library['classic'];
            
            if (sound && sound.play) {
                sound.play(audioContext, volume);
            } else {
                SOUND_LIBRARY.classic.play(audioContext, volume);
            }
        } catch (error) {
            logger.error('🔊 Sound playback error:', error);
        }
    },
    
    playClassificationAlert() {
        this.playSound(state.soundType, state.soundVolume, false);
    },
    
    playGroupAlert() {
        this.playSound(state.groupSoundType, state.groupVolume, true);
    },
    
    testSound(soundType = state.soundType) {
        this.playSound(soundType, state.soundVolume, false);
    },
    
    testGroupSound(soundType = state.groupSoundType) {
        this.playSound(soundType, state.groupVolume, true);
    },
    
    getAvailableSounds() {
        return appUtils.getSoundOptions();
    },
    
    getAvailableGroupSounds() {
        return appUtils.getGroupSoundOptions();
    }
};
