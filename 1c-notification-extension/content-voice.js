logger.logModuleLoad('content-voice.js');

const voice = {
    _voicesLoaded: false,
    _voices: [],
    
    init() {
        if (speechSynthesis) {
            const loadVoices = () => {
                this._voices = speechSynthesis.getVoices();
                this._voicesLoaded = this._voices.length > 0;
            };
            
            loadVoices();
            
            if (speechSynthesis.onvoiceschanged !== undefined) {
                speechSynthesis.onvoiceschanged = loadVoices;
            }
        }
    },
    
    isAvailable() {
        if (!this._voicesLoaded && speechSynthesis) {
            this._voices = speechSynthesis.getVoices();
            this._voicesLoaded = this._voices.length > 0;
        }
        return speechSynthesis && this._voicesLoaded;
    },
    
    getVoice() {
        if (this._voices.length === 0 && speechSynthesis) {
            this._voices = speechSynthesis.getVoices();
        }
        
        const russianVoice = this._voices.find(voice => 
            voice.lang.includes('ru') || voice.lang.includes('RU')
        );
        
        if (russianVoice) return russianVoice;
        
        const femaleVoice = this._voices.find(voice => 
            voice.name.includes('Female') || voice.gender === 'female'
        );
        
        return femaleVoice || this._voices[0] || null;
    },
    
    async speak(text, volume = state.voiceVolume) {
        if (!state.soundEnabled || !speechSynthesis || state.notificationType !== 'voice') return;
        
        return new Promise((resolve) => {
            if (speechSynthesis.speaking) speechSynthesis.cancel();
            
            setTimeout(() => {
                const utterance = new SpeechSynthesisUtterance(text);
                const voice = this.getVoice();
                
                if (voice) utterance.voice = voice;
                
                utterance.lang = 'ru-RU';
                utterance.rate = 1.0;
                utterance.pitch = 1.0;
                utterance.volume = Math.min(volume, 1.0);
                
                utterance.onend = resolve;
                utterance.onerror = resolve;
                
                speechSynthesis.speak(utterance);
            }, 100);
        });
    },
    
    speakClassificationAlert(count) {
        if (count <= 0) return;
        
        const word = appUtils.getNumberWord(count);
        const form = appUtils.getCaseWord(count, ['заявка', 'заявки', 'заявок']);
        
        let text = '';
        if (count === 1) {
            text = 'В очереди одна заявка на классификацию';
        } else if (count <= 10) {
            text = `В очереди ${word} ${form} на классификацию`;
        } else {
            text = `В очереди ${count} заявок на классификацию`;
        }
        
        return this.speak(text);
    },
    
    speakGroupAlert(count) {
        if (count <= 0) return;
        
        const word = appUtils.getNumberWord(count);
        const form = appUtils.getCaseWord(count, ['заявка', 'заявки', 'заявок']);
        
        let text = '';
        if (count === 1) {
            text = 'В моих группах одна новая заявка';
        } else if (count <= 10) {
            text = `В моих группах ${word} новых ${form}`;
        } else {
            text = `В моих группах ${count} новых заявок`;
        }
        
        return this.speak(text);
    },
    
    testVoice() {
        return this.speak('Тест голосового оповещения. Звук работает корректно.');
    }
};
