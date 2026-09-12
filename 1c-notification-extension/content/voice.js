import { state, appUtils } from './state.js';

export const voice = {
    _voicesLoaded: false,
    _voices: [],

    init() {
        if (speechSynthesis) {
            const load = () => { this._voices = speechSynthesis.getVoices(); this._voicesLoaded = this._voices.length > 0; };
            load();
            if (speechSynthesis.onvoiceschanged !== undefined) {
                const old = speechSynthesis.onvoiceschanged;
                speechSynthesis.onvoiceschanged = function(ev) {
                    if (typeof old === 'function') old.call(speechSynthesis, ev);
                    load();
                };
            } else {
                const poll = setInterval(() => {
                    if (speechSynthesis.getVoices().length > 0) { load(); clearInterval(poll); }
                }, 200);
                setTimeout(() => clearInterval(poll), 5000);
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
        if (this._voices.length === 0 && speechSynthesis) this._voices = speechSynthesis.getVoices();
        return this._voices.find(v => v.lang.startsWith('ru'))
            || this._voices.find(v => v.name.includes('Female'))
            || this._voices[0] || null;
    },

    async speak(text, volume = state.voiceVolume) {
        if (!state.soundEnabled || !speechSynthesis || state.notificationType !== 'voice') return;
        return new Promise((resolve) => {
            if (speechSynthesis.speaking) speechSynthesis.cancel();
            setTimeout(() => {
                const u = new SpeechSynthesisUtterance(text);
                const v = this.getVoice();
                if (v) u.voice = v;
                u.lang = 'ru-RU'; u.rate = 1.0; u.pitch = 1.0; u.volume = Math.min(volume, 1.0);
                u.onend = u.onerror = resolve;
                speechSynthesis.speak(u);
            }, 100);
        });
    },

    speakClassificationAlert(count) {
        if (count <= 0) return;
        const word = appUtils.getNumberWord(count);
        const form = appUtils.getCaseWord(count, ['заявка', 'заявки', 'заявок']);
        const text = count === 1 ? 'В очереди одна заявка на классификацию'
            : count <= 10 ? `В очереди ${word} ${form} на классификацию`
            : `В очереди ${count} заявок на классификацию`;
        return this.speak(text);
    },

    speakGroupAlert(count) {
        if (count <= 0) return;
        const word = appUtils.getNumberWord(count);
        const form = appUtils.getCaseWord(count, ['задача', 'задачи', 'задач']);
        const text = count === 1 ? 'В моих группах одна новая задача'
            : count <= 10 ? `В моих группах ${word} новые ${form}`
            : `В моих группах ${count} новых задач`;
        return this.speak(text);
    },

    testVoice() { return this.speak('Тест голосового оповещения. Звук работает корректно.'); }
};
