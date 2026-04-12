logger.logModuleLoad('content.js');

// Конфигурация - используем общие константы с fallback для совместимости
const CONFIG = {
    DEFAULT_CHECK_INTERVAL: (typeof SHARED_CONSTANTS !== 'undefined') 
        ? SHARED_CONSTANTS.INTERVALS.DEFAULT_CHECK 
        : 10000,
    DEFAULT_COOLDOWN: (typeof SHARED_CONSTANTS !== 'undefined') 
        ? SHARED_CONSTANTS.INTERVALS.DEFAULT_COOLDOWN 
        : 10000,
    NIGHT_TIME_START: (typeof SHARED_CONSTANTS !== 'undefined') 
        ? SHARED_CONSTANTS.NIGHT_MODE.START 
        : 22,
    NIGHT_TIME_END: (typeof SHARED_CONSTANTS !== 'undefined') 
        ? SHARED_CONSTANTS.NIGHT_MODE.END 
        : 8,
    MAX_NIGHT_DISABLE_MINUTES: (typeof SHARED_CONSTANTS !== 'undefined') 
        ? SHARED_CONSTANTS.NIGHT_MODE.MAX_DISABLE_MINUTES 
        : 10,
    HD_PATTERN: (typeof SHARED_CONSTANTS !== 'undefined') 
        ? SHARED_CONSTANTS.MONITORING.HD_PATTERN 
        : 'HD'
};

// Библиотека звуков
const SOUND_LIBRARY = {
    // Классические звуки
    classic: {
        name: 'Классический',
        description: 'Стандартный звук уведомления',
        play: function(context, volume = 1.0) {
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(800, context.currentTime);
            gainNode.gain.setValueAtTime(volume, context.currentTime);
            
            oscillator.connect(gainNode);
            gainNode.connect(context.destination);
            
            oscillator.start();
            setTimeout(() => oscillator.stop(), 800);
            
            // Дополнительные тоны
            const frequencies = [800, 1200, 600, 1000];
            const delays = [200, 400, 600];
            
            delays.forEach((delay, index) => {
                setTimeout(() => {
                    const osc2 = context.createOscillator();
                    const gain2 = context.createGain();
                    
                    osc2.type = 'square';
                    osc2.frequency.setValueAtTime(frequencies[index + 1], context.currentTime);
                    gain2.gain.setValueAtTime(volume * 0.7, context.currentTime);
                    
                    osc2.connect(gain2);
                    gain2.connect(context.destination);
                    
                    osc2.start();
                    setTimeout(() => osc2.stop(), 100);
                }, delay);
            });
        }
    },
    
    // Современный звук
    modern: {
        name: 'Современный',
        description: 'Современный цифровой звук',
        play: function(context, volume = 1.0) {
            // Основной тон
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(1000, context.currentTime);
            gainNode.gain.setValueAtTime(volume, context.currentTime);
            
            // ФМ-модуляция для современного звука
            const modulator = context.createOscillator();
            const modGain = context.createGain();
            
            modulator.frequency.setValueAtTime(5, context.currentTime);
            modGain.gain.setValueAtTime(100, context.currentTime);
            
            modulator.connect(modGain);
            modGain.connect(oscillator.frequency);
            
            oscillator.connect(gainNode);
            gainNode.connect(context.destination);
            
            oscillator.start();
            modulator.start();
            
            // Затухание
            gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1);
            
            setTimeout(() => {
                oscillator.stop();
                modulator.stop();
            }, 1000);
        }
    },
    
    // Тревожный звук
    alert: {
        name: 'Тревожный',
        description: 'Громкий привлекающий внимание',
        play: function(context, volume = 1.0) {
            // Серия громких прерывистых звуков
            const playBeep = (freq, duration, delay) => {
                setTimeout(() => {
                    const oscillator = context.createOscillator();
                    const gainNode = context.createGain();
                    
                    oscillator.type = 'square';
                    oscillator.frequency.setValueAtTime(freq, context.currentTime);
                    gainNode.gain.setValueAtTime(volume, context.currentTime);
                    
                    // Быстрое нарастание
                    gainNode.gain.setValueAtTime(0, context.currentTime);
                    gainNode.gain.linearRampToValueAtTime(volume, context.currentTime + 0.05);
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(context.destination);
                    
                    oscillator.start();
                    setTimeout(() => oscillator.stop(), duration);
                }, delay);
            };
            
            // Серия из 3 сигналов
            playBeep(1200, 200, 0);
            playBeep(800, 200, 300);
            playBeep(1000, 300, 600);
        }
    },
    
    // Мягкий звук
    soft: {
        name: 'Мягкий',
        description: 'Тихий ненавязчивый звук',
        play: function(context, volume = 1.0) {
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(600, context.currentTime);
            gainNode.gain.setValueAtTime(volume * 0.5, context.currentTime);
            
            // Плавное нарастание и затухание
            gainNode.gain.setValueAtTime(0, context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(volume * 0.5, context.currentTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1);
            
            oscillator.connect(gainNode);
            gainNode.connect(context.destination);
            
            oscillator.start();
            setTimeout(() => oscillator.stop(), 1000);
        }
    },
    
    // Игровой звук
    game: {
        name: 'Игровой',
        description: 'Звук из видеоигр',
        play: function(context, volume = 1.0) {
            // Восходящая арпеджио
            const notes = [523.25, 587.33, 659.25, 698.46, 783.99]; // C5, D5, E5, F5, G5
            notes.forEach((note, index) => {
                setTimeout(() => {
                    const oscillator = context.createOscillator();
                    const gainNode = context.createGain();
                    
                    oscillator.type = 'triangle';
                    oscillator.frequency.setValueAtTime(note, context.currentTime);
                    gainNode.gain.setValueAtTime(volume * 0.6, context.currentTime);
                    
                    // Короткий звук
                    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.1);
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(context.destination);
                    
                    oscillator.start();
                    setTimeout(() => oscillator.stop(), 100);
                }, index * 80);
            });
        }
    },
    
    // Офисный звук
    office: {
        name: 'Офисный',
        description: 'Тихий звук для офиса',
        play: function(context, volume = 1.0) {
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(440, context.currentTime); // A4
            gainNode.gain.setValueAtTime(volume * 0.3, context.currentTime);
            
            // Фильтр для смягчения звука
            const filter = context.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1000, context.currentTime);
            
            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(context.destination);
            
            oscillator.start();
            setTimeout(() => oscillator.stop(), 500);
        }
    },
    
    // Мелодия
    melody: {
        name: 'Мелодия',
        description: 'Приятная мелодия',
        play: function(context, volume = 1.0) {
            // Простая приятная мелодика
            const notes = [523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25];
            notes.forEach((note, index) => {
                setTimeout(() => {
                    const oscillator = context.createOscillator();
                    const gainNode = context.createGain();
                    
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(note, context.currentTime);
                    gainNode.gain.setValueAtTime(volume * 0.4, context.currentTime);
                    
                    // Плавное затухание
                    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.3);
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(context.destination);
                    
                    oscillator.start();
                    setTimeout(() => oscillator.stop(), 300);
                }, index * 150);
            });
        }
    },
    
    // Простой бип
    beep: {
        name: 'Бип',
        description: 'Простой короткий бип',
        play: function(context, volume = 1.0) {
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, context.currentTime); // A5
            gainNode.gain.setValueAtTime(volume * 0.5, context.currentTime);
            
            // Короткий звук с резким затуханием
            gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.15);
            
            oscillator.connect(gainNode);
            gainNode.connect(context.destination);
            
            oscillator.start();
            setTimeout(() => oscillator.stop(), 150);
        }
    },
    
    // Колокольчик
    chime: {
        name: 'Колокольчик',
        description: 'Звонкий колокольчик',
        play: function(context, volume = 1.0) {
            const playBell = (freq, delay, duration) => {
                setTimeout(() => {
                    const oscillator = context.createOscillator();
                    const gainNode = context.createGain();
                    
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(freq, context.currentTime);
                    gainNode.gain.setValueAtTime(volume * 0.6, context.currentTime);
                    
                    // Характерное колокольное затухание
                    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(context.destination);
                    
                    oscillator.start();
                    setTimeout(() => oscillator.stop(), duration * 1000);
                }, delay);
            };
            
            playBell(1046.5, 0, 0.8);    // C6
            playBell(1318.5, 100, 0.6);  // E6
            playBell(1568, 200, 0.4);    // G6
        }
    },
    
    // Стандартное уведомление
    notification: {
        name: 'Уведомление',
        description: 'Стандартное уведомление',
        play: function(context, volume = 1.0) {
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(700, context.currentTime);
            gainNode.gain.setValueAtTime(volume * 0.6, context.currentTime);
            
            // Два коротких звука
            oscillator.connect(gainNode);
            gainNode.connect(context.destination);
            
            oscillator.start();
            setTimeout(() => {
                oscillator.frequency.setValueAtTime(900, context.currentTime);
            }, 100);
            setTimeout(() => oscillator.stop(), 200);
            
            // Второй звук
            setTimeout(() => {
                const osc2 = context.createOscillator();
                const gain2 = context.createGain();
                
                osc2.type = 'triangle';
                osc2.frequency.setValueAtTime(900, context.currentTime);
                gain2.gain.setValueAtTime(volume * 0.6, context.currentTime);
                gain2.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.15);
                
                osc2.connect(gain2);
                gain2.connect(context.destination);
                
                osc2.start();
                setTimeout(() => osc2.stop(), 150);
            }, 250);
        }
    },
    
    // Всплывающий звук
    pop: {
        name: 'Всплывающий',
        description: 'Мягкий всплывающий звук',
        play: function(context, volume = 1.0) {
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(400, context.currentTime);
            // Нарастание частоты (pop эффект)
            oscillator.frequency.exponentialRampToValueAtTime(800, context.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(volume * 0.4, context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.2);
            
            oscillator.connect(gainNode);
            gainNode.connect(context.destination);
            
            oscillator.start();
            setTimeout(() => oscillator.stop(), 200);
        }
    },
    
    // Успех
    success: {
        name: 'Успех',
        description: 'Звук успешного действия',
        play: function(context, volume = 1.0) {
            // Восходящая последовательность
            const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
            notes.forEach((note, index) => {
                setTimeout(() => {
                    const oscillator = context.createOscillator();
                    const gainNode = context.createGain();
                    
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(note, context.currentTime);
                    gainNode.gain.setValueAtTime(volume * 0.4, context.currentTime);
                    
                    // Быстрое затухание
                    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.15);
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(context.destination);
                    
                    oscillator.start();
                    setTimeout(() => oscillator.stop(), 150);
                }, index * 80);
            });
        }
    },
    
    // Ошибка
    error: {
        name: 'Ошибка',
        description: 'Звук ошибки',
        play: function(context, volume = 1.0) {
            // Нисходящая последовательность
            const notes = [400, 350, 300, 250];
            notes.forEach((note, index) => {
                setTimeout(() => {
                    const oscillator = context.createOscillator();
                    const gainNode = context.createGain();
                    
                    oscillator.type = 'sawtooth';
                    oscillator.frequency.setValueAtTime(note, context.currentTime);
                    gainNode.gain.setValueAtTime(volume * 0.3, context.currentTime);
                    
                    // Фильтр для смягчения
                    const filter = context.createBiquadFilter();
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(800, context.currentTime);
                    
                    oscillator.connect(filter);
                    filter.connect(gainNode);
                    gainNode.connect(context.destination);
                    
                    oscillator.start();
                    setTimeout(() => oscillator.stop(), 100);
                }, index * 100);
            });
        }
    },
    
    // Клик
    click: {
        name: 'Клик',
        description: 'Звук щелчка',
        play: function(context, volume = 1.0) {
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(1200, context.currentTime);
            gainNode.gain.setValueAtTime(volume * 0.3, context.currentTime);
            
            // Очень короткий звук
            gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.05);
            
            oscillator.connect(gainNode);
            gainNode.connect(context.destination);
            
            oscillator.start();
            setTimeout(() => oscillator.stop(), 50);
        }
    }
};

// Библиотека звуков для групп
const GROUP_SOUND_LIBRARY = {
    ...SOUND_LIBRARY,
    
    // Специальные звуки для групп
    group_chime: {
        name: 'Колокольчик',
        description: 'Мягкий колокольчик для групп',
        play: function(context, volume = 1.0) {
            // Колокольный звук
            const playBell = (freq, time) => {
                const oscillator = context.createOscillator();
                const gainNode = context.createGain();
                
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(freq, context.currentTime);
                gainNode.gain.setValueAtTime(volume * 0.7, context.currentTime);
                
                // Колокольное затухание
                gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1.5);
                
                oscillator.connect(gainNode);
                gainNode.connect(context.destination);
                
                oscillator.start(time);
                oscillator.stop(time + 1.5);
            };
            
            playBell(784, context.currentTime); // G5
            playBell(659, context.currentTime + 0.1); // E5
            playBell(523, context.currentTime + 0.2); // C5
        }
    },
    
    group_notification: {
        name: 'Групповое уведомление',
        description: 'Отдельный звук для групповых задач',
        play: function(context, volume = 1.0) {
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(600, context.currentTime);
            gainNode.gain.setValueAtTime(volume, context.currentTime);
            
            const frequencies = [800, 400];
            const delays = [150, 300];
            
            oscillator.connect(gainNode);
            gainNode.connect(context.destination);
            
            oscillator.start();
            setTimeout(() => oscillator.stop(), 500);
            
            delays.forEach((delay, index) => {
                setTimeout(() => {
                    const osc2 = context.createOscillator();
                    const gain2 = context.createGain();
                    
                    osc2.type = 'sine';
                    osc2.frequency.setValueAtTime(frequencies[index], context.currentTime);
                    gain2.gain.setValueAtTime(volume * 0.8, context.currentTime);
                    
                    osc2.connect(gain2);
                    gain2.connect(context.destination);
                    
                    osc2.start();
                    setTimeout(() => osc2.stop(), 50);
                }, delay);
            });
        }
    },
    
    // Новые групповые звуки
    group_bell: {
        name: 'Звонок',
        description: 'Громкий звонок для групп',
        play: function(context, volume = 1.0) {
            const playRing = (freq, delay, duration) => {
                setTimeout(() => {
                    const oscillator = context.createOscillator();
                    const gainNode = context.createGain();
                    
                    oscillator.type = 'triangle';
                    oscillator.frequency.setValueAtTime(freq, context.currentTime);
                    gainNode.gain.setValueAtTime(volume * 0.8, context.currentTime);
                    
                    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(context.destination);
                    
                    oscillator.start();
                    setTimeout(() => oscillator.stop(), duration * 1000);
                }, delay);
            };
            
            playRing(880, 0, 0.5);
            playRing(1100, 200, 0.3);
            playRing(880, 400, 0.5);
        }
    },
    
    group_ding: {
        name: 'Динь',
        description: 'Легкий звук динь',
        play: function(context, volume = 1.0) {
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(1200, context.currentTime);
            gainNode.gain.setValueAtTime(volume * 0.5, context.currentTime);
            
            // Быстрое затухание
            gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.3);
            
            oscillator.connect(gainNode);
            gainNode.connect(context.destination);
            
            oscillator.start();
            setTimeout(() => oscillator.stop(), 300);
        }
    }
};

// Состояние приложения
const state = {
    isMonitoring: false,
    isGroupMonitoring: false,
    lastCount: 0,
    lastGroupCount: 0,
    soundEnabled: true,
    notificationType: 'sound',
    soundType: 'classic',
    groupSoundType: 'group_notification',
    voiceVolume: 1.0,
    soundVolume: 0.8,
    groupVolume: 0.7,
    checkInterval: CONFIG.DEFAULT_CHECK_INTERVAL,
    notificationCooldown: CONFIG.DEFAULT_COOLDOWN,
    lastNotificationTime: 0,
    
    // Авто-перезапуск
    autoRestartEnabled: false,
    autoRestartInterval: 30000,
    
    // Telegram (новое поле)
    telegramEnabled: false,
     ignoredNumbers: []
};

// Системные переменные
let audioContext = null;
let soundDisableTimer = null;
let soundDisableEndTime = null;
let checkIntervalId = null;
let speechSynthesis = window.speechSynthesis;
let contextInvalidated = false;

// Безопасная отправка сообщений в background
function safeSendMessage(message) {
    if (contextInvalidated) return Promise.resolve(null);
    try {
        return chrome.runtime.sendMessage(message).catch(error => {
            if (error.message && error.message.includes('Extension context invalidated')) {
                contextInvalidated = true;
                logger.warn('🔧 Extension context invalidated — stopping all operations');
                monitor.stop();
                return null;
            }
            throw error;
        });
    } catch (e) {
        contextInvalidated = true;
        monitor.stop();
        return Promise.resolve(null);
    }
}

// Слушаем отключение расширения
if (chrome.runtime && chrome.runtime.onDisconnect) {
    chrome.runtime.onDisconnect.addListener(() => {
        contextInvalidated = true;
        logger.warn('🔧 Extension disconnected');
        monitor.stop();
    });
}

// Утилиты приложения (используем общие из utils.js через window.utils)
const appUtils = {
    isNightTime() {
        const hours = new Date().getHours();
        return hours >= CONFIG.NIGHT_TIME_START || hours < CONFIG.NIGHT_TIME_END;
    },
    
    getMaxDisableTime() {
        return CONFIG.MAX_NIGHT_DISABLE_MINUTES * 60 * 1000;
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

// Хранилище
const storage = {
    async get(keys) {
        return new Promise(resolve => {
            chrome.storage.local.get(keys, resolve);
        });
    },
    
    async set(data) {
        return new Promise(resolve => {
            chrome.storage.local.set(data, resolve);
        });
    },
    
    async remove(key) {
        return new Promise(resolve => {
            chrome.storage.local.remove(key, resolve);
        });
    }
};

// Голосовые уведомления
const voice = {
    _voicesLoaded: false,
    _voices: [],
    
    init() {
        // Голоса могут загружаться асинхронно
        if (speechSynthesis) {
            const loadVoices = () => {
                this._voices = speechSynthesis.getVoices();
                this._voicesLoaded = this._voices.length > 0;
            };
            
            // Загружаем сразу если доступны
            loadVoices();
            
            // Или слушаем событие
            if (speechSynthesis.onvoiceschanged !== undefined) {
                speechSynthesis.onvoiceschanged = loadVoices;
            }
        }
    },
    
    isAvailable() {
        // Пробуем получить голоса, если ещё не загружены
        if (!this._voicesLoaded && speechSynthesis) {
            this._voices = speechSynthesis.getVoices();
            this._voicesLoaded = this._voices.length > 0;
        }
        return speechSynthesis && this._voicesLoaded;
    },
    
    getVoice() {
        // Пробуем получить голоса, если ещё не загружены
        if (this._voices.length === 0 && speechSynthesis) {
            this._voices = speechSynthesis.getVoices();
        }
        
        // Предпочитаем русские голоса
        const russianVoice = this._voices.find(voice => 
            voice.lang.includes('ru') || voice.lang.includes('RU')
        );
        
        if (russianVoice) {
            return russianVoice;
        }
        
        // Если нет русского, ищем любой доступный
        const femaleVoice = this._voices.find(voice => 
            voice.name.includes('Female') || voice.gender === 'female'
        );
        
        return femaleVoice || this._voices[0] || null;
    },
    
    async speak(text, volume = state.voiceVolume) {
        if (!state.soundEnabled || !speechSynthesis || state.notificationType !== 'voice') {
            return;
        }
        
        return new Promise((resolve) => {
            if (speechSynthesis.speaking) {
                speechSynthesis.cancel();
            }
            
            setTimeout(() => {
                const utterance = new SpeechSynthesisUtterance(text);
                const voice = this.getVoice();
                
                if (voice) {
                    utterance.voice = voice;
                }
                
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

// Аудио модуль
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
        if (!audioContext && state.soundEnabled) {
            this.init();
        }
        return !!audioContext;
    },
    
    playSound(soundType = state.soundType, volume = state.soundVolume, isGroup = false) {
        if (!state.soundEnabled || !this.ensureActivated()) return;
        
        try {
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            
            const library = isGroup ? GROUP_SOUND_LIBRARY : SOUND_LIBRARY;
            const sound = library[soundType] || library['classic'];
            
            if (sound && sound.play) {
                sound.play(audioContext, volume);
            } else {
                // Фолбэк на классический звук
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

// Мониторинг
const monitor = {
    start() {
        if (checkIntervalId) {
            clearInterval(checkIntervalId);
        }
        
        checkIntervalId = setInterval(() => {
            if (state.isMonitoring) {
                this.checkApplications();
            }
        }, state.checkInterval);
        
        logger.log(`🔧 Monitoring started with interval: ${state.checkInterval}ms, type: ${state.notificationType}, sound: ${state.soundType}`);
    },
    
    stop() {
        if (checkIntervalId) {
            clearInterval(checkIntervalId);
            checkIntervalId = null;
            logger.log('🔧 Monitoring stopped');
        }
    },
    
    restart() {
        this.stop();
        if (state.isMonitoring) {
            logger.log(`🔄 Restarting monitoring with interval: ${state.checkInterval}ms`);
            this.start();
        }
    },
    
    checkApplications() {
        const counts = this.countRealApplications();
        
        // Детальный лог
        logger.log('🔧 checkApplications - counts:', {
            count: counts.count,
            groupCount: counts.groupCount,
            onlyClassification: counts.onlyClassification?.length || 0,
            onlyGroup: counts.onlyGroup?.length || 0,
            maxEnabled: state.maxEnabled,
            maxModuleLoaded: !!window.maxModule
        });
        
        // Уведомления для классификации (только уникальные для классификации)
        if (counts.count > 0) {
            logger.log(`🎯 Классификация: ${counts.count} заявок`);
            this.notifyClassification(counts.count);
            
            // Отправляем в MAX ТОЛЬКО если есть уникальные для классификации
            if (state.maxEnabled && window.maxModule && 
                counts.onlyClassification && Array.isArray(counts.onlyClassification)) {
                
                const classificationCount = counts.onlyClassification.length;
                const classificationNumbers = counts.onlyClassification;
                
                // Проверяем настройки перед отправкой
                const maxSettings = window.maxModule.getSettings();
                logger.log(`🔧 MAX: Перед отправкой - enabled: ${maxSettings.enabled}, userId: "${maxSettings.userId}", isConfigured: ${maxSettings.isConfigured}`);
                
                logger.log(`🔧 MAX: Sending classification alert - count: ${classificationCount}, numbers:`, classificationNumbers);
                
                if (classificationCount > 0) {
                    window.maxModule.sendClassificationAlert(classificationCount, classificationNumbers)
                        .then(result => {
                            logger.log('🔧 MAX classification result:', result);
                        })
                        .catch(err => {
                            logger.error('🔧 MAX classification error:', err);
                        });
                }
            } else {
                logger.log(`🔧 MAX: Не отправляем - maxEnabled: ${state.maxEnabled}, maxModule: ${!!window.maxModule}, onlyClassification: ${counts.onlyClassification?.length}`);
            }
        }

        // Уведомления для групп (только уникальные для групп)
        if (counts.groupCount > 0 && state.isGroupMonitoring) {
            logger.log(`👥 Группы: ${counts.groupCount} задач`);
            this.notifyGroup(counts.groupCount);
            
            // Отправляем в MAX ТОЛЬКО если есть уникальные для групп
            if (state.maxEnabled && window.maxModule && 
                counts.onlyGroup && Array.isArray(counts.onlyGroup)) {
                
                const groupCount = counts.onlyGroup.length;
                const groupNumbers = counts.onlyGroup;
                
                logger.log(`🔧 MAX: Sending group alert - count: ${groupCount}, numbers:`, groupNumbers);
                
                if (groupCount > 0) {
                    // Отправляем напрямую, не через очередь
                    window.maxModule.sendGroupAlert(groupCount)
                        .then(result => {
                            logger.log('🔧 MAX group result:', result);
                        })
                        .catch(err => {
                            logger.error('🔧 MAX group error:', err);
                        });
                }
            }
        }
        
        // Обновляем состояние
        state.lastCount = counts.count;
        state.lastGroupCount = counts.groupCount;
        this.sendStateUpdate(counts);
        
        // Отправляем данные смены в background для учета
        // Даже если мониторинг выключен - мы все равно считаем заявки!
        this.sendShiftUpdate(counts);
    },
    
    // Периодическая проверка для учета заявок даже при выключенном мониторинге
    // Запускается из init() для отслеживания заявок в фоне
    startShiftTracking() {
        // Проверяем каждые 30 секунд (даже при выключенном мониторинге)
        setInterval(() => {
            const counts = this.countRealApplications();
            
            // Обновляем счетчики смены
            this.sendShiftUpdate(counts);
            
            logger.log('🔧 Shift tracking: allUnique=' + counts.allUniqueNumbers?.length + ', class=' + counts.classificationNumbers?.length + ', group=' + counts.groupNumbers?.length);
        }, 30000);
        
        logger.log('🔧 Shift tracking started (works even when monitoring is OFF)');
    },
    
    // Отправка данных смены в background
    sendShiftUpdate(counts) {
        // Для оповещателя - показываем ВСЕ заявки (классификация + группы отдельно)
        // Для счетчика уникальных - отправляем все уникальные номера
        safeSendMessage({
            type: 'SHIFT_UPDATE',
            counts: {
                // Все номера из классификации (для оповещателя)
                classificationNumbers: counts.classificationNumbers || [],
                // Все номера из групп (для оповещателя)
                groupNumbers: counts.groupNumbers || [],
                // Все уникальные номера (для счетчика) - используем allNumbers
                allUniqueNumbers: counts.allNumbers || []
            }
        }).catch(err => {
            // Игнорируем ошибки - это не критично
        });
    },
    
    notifyClassification(count) {
        if (state.notificationType === 'voice') {
            voice.speakClassificationAlert(count);
        } else {
            audio.playClassificationAlert();
        }
    },
    
    notifyGroup(count) {
        if (state.notificationType === 'voice') {
            voice.speakGroupAlert(count);
        } else {
            audio.playGroupAlert();
        }
    },
    
    sendStateUpdate(counts = null) {
        if (!counts) {
            counts = this.countRealApplications();
        }
        
        const message = {
            type: 'UPDATE_MONITORING_STATE',
            state: {
                isMonitoring: state.isMonitoring,
                count: counts.count,
                groupCount: counts.groupCount,
                uniqueCount: counts.uniqueCount,
                onlyClassification: counts.onlyClassification,
                onlyGroup: counts.onlyGroup,
                commonNumbers: counts.commonNumbers
            }
        };
        
        safeSendMessage(message);
    },
    
    countRealApplications() {
        try {
            // Универсальный селектор — работает с любым префиксом (form1, form2 и т.д.)
            const classificationRows = document.querySelectorAll('.gridContent[id*="ЗаявкиНаКлассификации"] .gridLine');
            const groupRows = state.isGroupMonitoring ? 
                document.querySelectorAll('.gridContent[id*="УМеняВОчереди"] .gridLine') : [];
            
            // Функция для извлечения номеров из строк
            const extractNumbers = (rows) => {
                const numbers = new Set();
                
                rows.forEach(row => {
                    const rowText = row.textContent || '';
                    const hdMatches = rowText.match(/HD\d{12}/g);
                    
                    if (hdMatches) {
                        hdMatches.forEach(hdNumber => {
                            const numberWithoutHD = hdNumber.substring(2);
                            const finalNumber = numberWithoutHD.slice(0, -3);
                            // ПРОВЕРЯЕМ, НЕ ИГНОРИРУЕТСЯ ЛИ НОМЕР
                            if (!state.ignoredNumbers.includes(finalNumber)) {
                                numbers.add(finalNumber);
                            }
                        });
                    }
                });
                
                return Array.from(numbers);
            };
        
        const classificationNumbers = extractNumbers(classificationRows);
        const groupNumbers = extractNumbers(groupRows);
        
        // Находим пересечение (номера, которые есть в обеих таблицах)
        const classificationSet = new Set(classificationNumbers);
        const groupSet = new Set(groupNumbers);
        
        // Номера, которые есть ТОЛЬКО в классификации
        const onlyClassification = classificationNumbers.filter(num => !groupSet.has(num));
        
        // Номера, которые есть ТОЛЬКО в группах
        const onlyGroup = groupNumbers.filter(num => !classificationSet.has(num));
        
        // Номера, которые есть в обеих таблицах
        const commonNumbers = classificationNumbers.filter(num => groupSet.has(num));
        
        // Все уникальные номера (без дубликатов)
        const allUniqueNumbers = [...new Set([...classificationNumbers, ...groupNumbers])];
        
        // Логируем для отладки
        logger.log('🔧 === СТАТИСТИКА ЗАЯВОК ===');
        logger.log(`🔧 Классификация: ${classificationNumbers.length} заявок`);
        logger.log(`🔧 Группы: ${groupNumbers.length} задач`);
        logger.log(`🔧 Общие номера (в обеих таблицах): ${commonNumbers.length}`);
        logger.log(`🔧 Только в классификации: ${onlyClassification.length}`);
        logger.log(`🔧 Только в группах: ${onlyGroup.length}`);
        logger.log(`🔧 Всего уникальных: ${allUniqueNumbers.length}`);
        
        if (onlyClassification.length > 0) {
            logger.log(`🔧 Номера только в классификации: ${onlyClassification.join(', ')}`);
        }
        
        if (onlyGroup.length > 0) {
            logger.log(`🔧 Номера только в группах: ${onlyGroup.join(', ')}`);
        }
        
        if (commonNumbers.length > 0) {
            logger.log(`🔧 Общие номера: ${commonNumbers.join(', ')}`);
        }
        
        return {
            // Основные счетчики (для отображения в интерфейсе)
            count: onlyClassification.length, // Только классификация
            groupCount: onlyGroup.length,     // Только группы
            
            // Уникальные заявки (все разные номера)
            uniqueCount: allUniqueNumbers.length, // Исправлено!
            
            // Дополнительная информация
            classificationNumbers: classificationNumbers,
            groupNumbers: groupNumbers,
            onlyClassification: onlyClassification,
            onlyGroup: onlyGroup,
            commonNumbers: commonNumbers,
            allNumbers: allUniqueNumbers
        };
        
    } catch (error) {
        logger.error('🔧 Error counting applications:', error);
        return { 
            count: 0,
            groupCount: 0,
            uniqueCount: 0,
            classificationNumbers: [], 
            groupNumbers: [],
            onlyClassification: [],
            onlyGroup: [],
            commonNumbers: [],
            allNumbers: []
        };
    }
    }
};

// Управление звуком
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
        
        logger.log(`🔊 Sound disabled for ${CONFIG.MAX_NIGHT_DISABLE_MINUTES} minutes (night time limit)`);
        
        return {
            success: true,
            duration: CONFIG.MAX_NIGHT_DISABLE_MINUTES,
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
            maxDisableMinutes: CONFIG.MAX_NIGHT_DISABLE_MINUTES,
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

// Ночное авто-включение звука
const nightAutoEnable = {
    timer: null,
    enabled: false,
    
    async init() {
        const data = await storage.get(['nightAutoEnableEnabled']);
        this.enabled = data.nightAutoEnableEnabled || false;
        
        if (this.enabled) {
            this.start();
        }
    },
    
    isNightTime() {
        const hours = new Date().getHours();
        return hours >= CONFIG.NIGHT_TIME_START || hours < CONFIG.NIGHT_TIME_END;
    },
    
    async enableSoundForPeriod() {
        if (!this.isNightTime()) {
            return false;
        }
        
        try {
            // Включаем звук
            const result = await soundManager.enable();
            
            if (result.success) {
                logger.log('🌙 Ночное авто-включение: звук включен');
                
                // Выключаем через 10 секунд (чтобы было услышано)
                setTimeout(async () => {
                    if (this.isNightTime()) {
                        await soundManager.disableForNight();
                        logger.log('🌙 Ночное авто-включение: звук снова выключен (ночное время)');
                    }
                }, 10000);
                
                return true;
            }
        } catch (error) {
            logger.error('🌙 Ошибка ночного авто-включения:', error);
        }
        
        return false;
    },
    
    async start() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        // Первая проверка сразу
        if (this.isNightTime() && !state.soundEnabled) {
            await this.enableSoundForPeriod();
        }
        
        // Запускаем интервал каждые 5 минут
        this.timer = setInterval(async () => {
            if (this.isNightTime() && !state.soundEnabled) {
                await this.enableSoundForPeriod();
            }
        }, 300000); // 5 минут
        
        logger.log('🌙 Ночное авто-включение звука запущено');
    },
    
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
            logger.log('🌙 Ночное авто-включение звука остановлено');
        }
    },
    
    async setEnabled(enabled) {
        this.enabled = enabled;
        
        await storage.set({ nightAutoEnableEnabled: enabled });
        
        if (enabled) {
            this.start();
        } else {
            this.stop();
        }
        
        return { success: true };
    },
    
    getStatus() {
        const isNight = this.isNightTime();
        return {
            enabled: this.enabled,
            isNightTime: isNight,
            nextCheck: this.timer ? 'активен' : 'не активен'
        };
    }
};

// Telegram Module — загружается из telegram.js через window.telegramModule

// Загружаем Telegram модуль
function loadTelegramModule() {
    try {
        if (window.telegramModule) {
            window.telegramModule.init();
            logger.log('🔧 Telegram module loaded successfully');
        } else {
            logger.warn('🔧 Telegram module not found on window.telegramModule');
        }
    } catch (error) {
        logger.error('🔧 Initialization failed:', error);
    }
}

// Загрузка MAX модуля
function loadMaxModule() {
    try {
        if (window.maxModule) {
            window.maxModule.init().then(() => {
                logger.log('🔧 MAX module initialized');
            }).catch(err => {
                logger.error('🔧 MAX module init error:', err);
            });
        } else {
            logger.warn('🔧 MAX module not found');
        }
    } catch (error) {
        logger.error('🔧 Error loading MAX module:', error);
    }
}

// Обработчик сообщений
const messageHandler = {
    async handle(message) {
        try {
            switch (message.type) {
                case 'GET_STATUS':
                    return await this.handleGetStatus();
                    
                case 'TOGGLE_MONITOR':
                    return await this.handleToggleMonitor();
                    
                case 'TOGGLE_GROUP_MONITOR':
                    return await this.handleToggleGroup();
                    
                case 'SET_SOUND_SETTING':
                    return await this.handleSetSound(message.soundEnabled);
                    
                case 'ENABLE_SOUND':
                    return await soundManager.enable();
                    
                case 'GET_SOUND_INFO':
                    return soundManager.getInfo();
                    
                case 'SET_VOLUME':
                    return await soundManager.setSoundVolume(message.volume);
                    
                case 'SET_GROUP_VOLUME':
                    return await soundManager.setGroupVolume(message.volume);
                    
                case 'SET_VOICE_VOLUME':
                    return await soundManager.setVoiceVolume(message.volume);
                    
                case 'SET_NOTIFICATION_TYPE':
                    return await soundManager.setNotificationType(message.notificationType);
                    
                case 'SET_SOUND_TYPE':
                    return await soundManager.setSoundType(message.soundType);
                    
                case 'SET_GROUP_SOUND_TYPE':
                    return await soundManager.setGroupSoundType(message.soundType);
                    
                case 'GET_SOUND_OPTIONS':
                    return {
                        success: true,
                        soundOptions: audio.getAvailableSounds(),
                        groupSoundOptions: audio.getAvailableGroupSounds()
                    };
                    
                case 'TEST_SOUND':
                    if (message.soundType) {
                        audio.testSound(message.soundType);
                    } else {
                        audio.testSound();
                    }
                    return { success: true };
                    
                case 'TEST_GROUP_SOUND':
                    if (message.soundType) {
                        audio.testGroupSound(message.soundType);
                    } else {
                        audio.testGroupSound();
                    }
                    return { success: true };
                    
                case 'TEST_VOICE':
                    await voice.testVoice();
                    return { success: true };
                    
                case 'SET_INTERVALS':
                    return await this.handleSetIntervals(message);
                    
                case 'GET_INTERVALS':
                    return this.handleGetIntervals();
                    
                case 'TOGGLE_NIGHT_AUTO_ENABLE':
                    return await nightAutoEnable.setEnabled(message.enabled);
                    
                case 'GET_NIGHT_AUTO_ENABLE_STATUS':
                    return nightAutoEnable.getStatus();
                 
                case 'DEBUG_NUMBERS':
                    return debugApplicationNumbers();    

                case 'GET_APPLICATION_NUMBERS': {
                    // Возвращает номера заявок для статистики
                    const counts = monitor.countRealApplications();
                    return {
                        success: true,
                        classificationNumbers: counts.onlyClassification,
                        groupNumbers: counts.onlyGroup,
                        allNumbers: counts.allNumbers
                    };
                }
    

                // НОВЫЕ КОМАНДЫ ДЛЯ TELEGRAM
                case 'TELEGRAM_GET_SETTINGS':
                    return await this.handleTelegramGetSettings();
                    
                case 'TELEGRAM_VALIDATE_TOKEN':
                    return await this.handleTelegramValidateToken(message.token);
                    
                case 'TELEGRAM_GET_UPDATES':
                    return await this.handleTelegramGetUpdates(message.token);
                    
                case 'TELEGRAM_SAVE_SETTINGS':
                    return await this.handleTelegramSaveSettings(message.settings);
                    
                case 'TELEGRAM_SEND_TEST':
                    return await this.handleTelegramSendTest();
                    
                case 'TELEGRAM_CLEAR_SETTINGS':
                    return await this.handleTelegramClearSettings();
                    
                case 'TELEGRAM_GET_INFO':
                    return await this.handleTelegramGetInfo();
                
                case 'UPDATE_TELEGRAM_CHAT_ID':
                    return await this.handleUpdateTelegramChatId(message.chatId);
                
                // MAX обработчики
                case 'UPDATE_MAX_ENABLED':
                    return await this.handleUpdateMaxEnabled(message.enabled);
                
                case 'UPDATE_MAX_USER_ID':
                    return await this.handleUpdateMaxUserId(message.userId);
                
                case 'DEBUG_PAGE':
                    return this.handleDebug();
                    
  case 'UPDATE_IGNORED_NUMBERS':
        return await this.handleUpdateIgnoredNumbers(message.numbers);

                default:
                    logger.warn('🔧 Unknown message type:', message.type);
                    return { error: 'Unknown command' };
            }
        } catch (error) {
            logger.error('🔧 Error processing message:', error);
            return { error: error.message };
        }
    },
    
    async handleGetStatus() {
        const counts = monitor.countRealApplications();
        const soundInfo = soundManager.getInfo();
        
        // Получаем информацию о MAX
        let maxInfo = null;
        if (window.maxModule) {
            maxInfo = window.maxModule.getSettings();
        }
        
        return {
            status: state.isMonitoring ? 
                `Активен. Классификация: ${counts.count}, Группы: ${counts.groupCount}` : 
                'Остановлен',
            count: counts.count,
            groupCount: counts.groupCount,
            isMonitoring: state.isMonitoring,
            isGroupMonitoring: state.isGroupMonitoring,
            checkInterval: state.checkInterval,
            notificationCooldown: state.notificationCooldown,
            notificationType: state.notificationType,
            soundType: state.soundType,
            groupSoundType: state.groupSoundType,
            voiceAvailable: soundInfo.voiceAvailable,
            autoRestartEnabled: state.autoRestartEnabled,
            autoRestartInterval: state.autoRestartInterval,
            maxEnabled: maxInfo?.enabled || false,
            maxConfigured: maxInfo?.isConfigured || false
        };
    },
    
    async handleToggleMonitor() {
        state.isMonitoring = !state.isMonitoring;
        
        if (state.isMonitoring) {
            monitor.start();
        } else {
            monitor.stop();
        }
        
        const counts = monitor.countRealApplications();
        state.lastCount = counts.count;
        state.lastGroupCount = counts.groupCount;
        
        monitor.sendStateUpdate();
        
        return {
            status: state.isMonitoring ? 
                `Активен. Классификация: ${state.lastCount}, Группы: ${state.lastGroupCount}` : 
                'Остановлен',
            count: state.lastCount,
            groupCount: state.lastGroupCount,
            isMonitoring: state.isMonitoring
        };
    },
    
    async handleToggleGroup() {
        state.isGroupMonitoring = !state.isGroupMonitoring;
        await storage.set({ groupMonitoringEnabled: state.isGroupMonitoring });
        
        const counts = monitor.countRealApplications();
        state.lastCount = counts.count;
        state.lastGroupCount = counts.groupCount;
        
        monitor.sendStateUpdate();
        
        return {
            isGroupMonitoring: state.isGroupMonitoring,
            count: state.lastCount,
            groupCount: state.lastGroupCount
        };
    },
    
    async handleSetSound(soundEnabled) {
        if (soundEnabled === false) {
            return await soundManager.handleDisableRequest();
        } else {
            return await soundManager.enable();
        }
    },
    
    async handleSetVolume(volume) {
        state.soundVolume = volume;
        await storage.set({ soundVolumeLevel: Math.round(volume * 100) });
        return { success: true };
    },
    
    async handleSetGroupVolume(volume) {
        state.groupVolume = volume;
        await storage.set({ groupVolumeLevel: Math.round(volume * 100) });
        return { success: true };
    },
    
    async handleTestVoice() {
        await voice.testVoice();
        return { success: true };
    },
    
    async handleSetIntervals({ checkInterval, notificationCooldown }) {
        state.checkInterval = parseInt(checkInterval) || CONFIG.DEFAULT_CHECK_INTERVAL;
        state.notificationCooldown = parseInt(notificationCooldown) || CONFIG.DEFAULT_COOLDOWN;
        
        await storage.set({
            checkInterval: state.checkInterval,
            notificationCooldown: state.notificationCooldown
        });
        
        if (state.isMonitoring) {
            monitor.restart();
        }
        
        return {
            success: true,
            checkInterval: state.checkInterval,
            notificationCooldown: state.notificationCooldown
        };
    },
    
    handleGetIntervals() {
        return {
            checkInterval: state.checkInterval,
            notificationCooldown: state.notificationCooldown
        };
    },
    
    // НОВЫЕ МЕТОДЫ ДЛЯ TELEGRAM
    async handleTelegramGetSettings() {
        if (!window.telegramModule) {
            return { success: false, error: 'Telegram module not loaded' };
        }
        return { success: true, settings: window.telegramModule.getSettings() };
    },
    
    async handleTelegramValidateToken(token) {
        if (!window.telegramModule) {
            return { success: false, error: 'Telegram module not loaded' };
        }
        return await window.telegramModule.validateToken(token);
    },
    
    async handleTelegramGetUpdates(token) {
        if (!window.telegramModule) {
            return { success: false, error: 'Telegram module not loaded' };
        }
        return await window.telegramModule.getUpdates(token);
    },
    
    async handleTelegramSaveSettings(settings) {
        if (!window.telegramModule) {
            return { success: false, error: 'Telegram module not loaded' };
        }
        const result = await window.telegramModule.saveSettings(settings);
        
        // Обновляем состояние в нашем основном state
        if (settings.enabled !== undefined) {
            state.telegramEnabled = settings.enabled;
        }
        
        return result;
    },
    
    async handleTelegramSendTest() {
        if (!window.telegramModule) {
            return { success: false, error: 'Telegram module not loaded' };
        }
        return await window.telegramModule.sendTestMessage();
    },
    
    async handleTelegramClearSettings() {
        if (!window.telegramModule) {
            return { success: false, error: 'Telegram module not loaded' };
        }
        const result = await window.telegramModule.clearSettings();
        
        // Обновляем состояние
        if (result.success) {
            state.telegramEnabled = false;
        }
        
        return result;
    },
    
    async handleTelegramGetInfo() {
        if (!window.telegramModule) {
            return { success: false, error: 'Telegram module not loaded' };
        }
        
        const settings = window.telegramModule.getSettings();
        const isConfigured = !!(settings.botToken && settings.chatId);
        
        return {
            success: true,
            enabled: settings.enabled,
            isConfigured: isConfigured,
            hasToken: !!settings.botToken,
            hasChatId: !!settings.chatId,
            sendImmediately: settings.sendImmediately
        };
    },

    async handleUpdateTelegramChatId(chatId) {
        if (!window.telegramModule) {
            return { success: false, error: 'Telegram module not loaded' };
        }
        
        // Сохраняем chatId через telegram модуль
        const result = await window.telegramModule.saveSettings({ chatId: chatId });
        
        logger.log(`🔧 Telegram Chat ID updated: ${chatId}`);
        
        return result;
    },

    async handleUpdateMaxEnabled(enabled) {
        if (!window.maxModule) {
            return { success: false, error: 'MAX module not loaded' };
        }
        
        // Сохраняем через max модуль
        const result = await window.maxModule.saveSettings({ enabled: enabled });
        
        // Также обновляем state content.js
        state.maxEnabled = enabled;
        
        logger.log(`🔧 MAX enabled: ${enabled}, state updated`);
        
        return result;
    },

    async handleUpdateMaxUserId(userId) {
        if (!window.maxModule) {
            return { success: false, error: 'MAX module not loaded' };
        }
        
        const result = await window.maxModule.saveSettings({ userId: userId });
        
        logger.log(`🔧 MAX User ID updated: ${userId}`);
        
        return result;
    },

    async handleUpdateIgnoredNumbers(numbers) {
    state.ignoredNumbers = numbers || [];
    
    // Сохраняем в хранилище
    await storage.set({ ignoredNumbers: state.ignoredNumbers });
    
    logger.log(`🔧 Ignored numbers updated: ${state.ignoredNumbers.length} numbers`);
    
    // Пересчитываем заявки с учетом новых настроек
    if (state.isMonitoring) {
        monitor.checkApplications();
    }
    
    return { success: true, count: state.ignoredNumbers.length };
},
    
    handleDebug() {
        logger.log('🔧 Debug: Current URL:', window.location.href);
        logger.log('🔧 Debug: Page title:', document.title);
        
        const grids = document.querySelectorAll('[id*="grid"], [class*="grid"]');
        logger.log(`🔧 Debug: Found ${grids.length} grid elements`);
        
        const voices = speechSynthesis.getVoices();
        logger.log(`🔧 Debug: Available voices:`, voices.map(v => `${v.name} (${v.lang})`));
        
        logger.log('🔧 Debug: Available sounds:', Object.keys(SOUND_LIBRARY));
        logger.log('🔧 Debug: Available group sounds:', Object.keys(GROUP_SOUND_LIBRARY));
        
        // Добавляем информацию о Telegram
        logger.log('🔧 Debug: Telegram module loaded:', !!window.telegramModule);
        if (window.telegramModule) {
            logger.log('🔧 Debug: Telegram settings:', window.telegramModule.getSettings());
        }
        
        return { success: true };
    }
};

// Инициализация
async function init() {
    try {
        const data = await storage.get([
            'soundEnabled', 'soundVolumeLevel', 'groupVolumeLevel',
            'voiceVolumeLevel', 'groupMonitoringEnabled', 'soundDisableEndTime',
            'checkInterval', 'notificationCooldown', 'notificationType',
            'soundType', 'groupSoundType', 'autoRestartEnabled', 'autoRestartInterval',
            'nightAutoEnableEnabled',
            // MAX настройки
            'maxEnabled',
            'maxUserId',
            'ignoredNumbers'
        ]);
        
        // Загрузка настроек
        state.soundEnabled = data.soundEnabled !== false;
        state.notificationType = data.notificationType || 'sound';
        state.soundType = data.soundType || 'classic';
        state.groupSoundType = data.groupSoundType || 'group_notification';
        state.voiceVolume = data.voiceVolumeLevel ? data.voiceVolumeLevel / 100 : 1.0;
        state.soundVolume = data.soundVolumeLevel ? data.soundVolumeLevel / 100 : 0.8;
        state.groupVolume = data.groupVolumeLevel ? data.groupVolumeLevel / 100 : 0.7;
        state.isGroupMonitoring = data.groupMonitoringEnabled || false;
        state.checkInterval = parseInt(data.checkInterval) || CONFIG.DEFAULT_CHECK_INTERVAL;
        state.notificationCooldown = parseInt(data.notificationCooldown) || CONFIG.DEFAULT_COOLDOWN;
        
        // Загрузка авто-перезапуска
        state.autoRestartEnabled = data.autoRestartEnabled || false;
        state.autoRestartInterval = parseInt(data.autoRestartInterval) || 30000;
        
        // Загрузка Telegram настроек (по умолчанию выключено)
        state.telegramEnabled = data.telegramEnabled === true;
        // Загрузка игнорируемых номеров
state.ignoredNumbers = data.ignoredNumbers || [];
logger.log(`🔧 Ignored numbers loaded: ${state.ignoredNumbers.length} numbers`);
        
        // Загрузка MAX настроек
        state.maxEnabled = data.maxEnabled === true;
        logger.log(`🔧 MAX enabled loaded: ${state.maxEnabled}, userId: ${data.maxUserId || 'not set'}`);
        
        // Обработка временного отключения звука
        if (data.soundDisableEndTime) {
            const now = Date.now();
            if (now < data.soundDisableEndTime) {
                state.soundEnabled = false;
                soundDisableEndTime = data.soundDisableEndTime;
                
                soundDisableTimer = setTimeout(() => {
                    soundManager.enable();
                }, data.soundDisableEndTime - now);
                
                logger.log(`🔊 Sound disabled until ${new Date(data.soundDisableEndTime).toLocaleTimeString()}`);
            } else {
                await storage.remove('soundDisableEndTime');
            }
        }
        
        logger.log(`🔧 Settings loaded - Sound: ${state.soundEnabled}, ` +
                   `Type: ${state.notificationType}, Sound: ${state.soundType}, ` +
                   `Group Sound: ${state.groupSoundType}, ` +
                   `Auto-restart: ${state.autoRestartEnabled} (${state.autoRestartInterval}ms), ` +
                   `MAX: ${state.maxEnabled}`);
        
        // Если авто-перезапуск включен, но мониторинг выключен - включаем его
        if (state.autoRestartEnabled && !state.isMonitoring) {
            logger.log('🔁 Auto-restart: Enabling monitoring on startup');
            state.isMonitoring = true;
            monitor.start();
        }
        
        // Инициализация голоса
        voice.init();
        if (speechSynthesis) {
            speechSynthesis.getVoices();
            
            if (speechSynthesis.onvoiceschanged !== undefined) {
                speechSynthesis.onvoiceschanged = () => {
                    logger.log(`🗣️ Voices loaded: ${speechSynthesis.getVoices().length}`);
                };
            }
        }
        
        // Инициализация ночного авто-включения
        await nightAutoEnable.init();
        
        logger.log(`🔧 Settings loaded - Night auto-enable: ${nightAutoEnable.enabled}`);
        
        // Загружаем MAX модуль
        loadMaxModule();
        
        // Запускаем отслеживание смены (даже при выключенном мониторинге!)
        monitor.startShiftTracking();
        
        // Первоначальная проверка
        setTimeout(() => {
            const counts = monitor.countRealApplications();
            state.lastCount = counts.count;
            state.lastGroupCount = counts.groupCount;
            monitor.sendStateUpdate();
        }, 1000);
        
    } catch (error) {
        logger.error('🔧 Initialization failed:', error);
    }
}

// Загрузка MAX модуля
function loadMaxModule() {
    try {
        if (window.maxModule) {
            window.maxModule.init().then(() => {
                logger.log('🔧 MAX module initialized');
            }).catch(err => {
                logger.error('🔧 MAX module init error:', err);
            });
        } else {
            logger.warn('🔧 MAX module not found');
        }
    } catch (error) {
        logger.error('🔧 Error loading MAX module:', error);
    }
}

// Функция для отладки номеров заявок
function debugApplicationNumbers() {
    try {
        logger.log('🔧 === DEBUG: Поиск номеров заявок ===');
        
        // Универсальный селектор — работает с любым префиксом (form1, form2 и т.д.)
        const classificationTable = document.querySelector('.gridContent[id*="ЗаявкиНаКлассификации"]');
        const groupTable = document.querySelector('.gridContent[id*="УМеняВОчереди"]');
        
        logger.log('🔧 Классификация таблица найдена:', !!classificationTable);
        logger.log('🔧 Группы таблица найдена:', !!groupTable);
        
        // Анализируем структуру таблиц
        if (classificationTable) {
            logger.log('🔧 === АНАЛИЗ ТАБЛИЦЫ КЛАССИФИКАЦИИ ===');
            const rows = classificationTable.querySelectorAll('.gridLine');
            logger.log(`🔧 Найдено строк: ${rows.length}`);
            
            rows.forEach((row, index) => {
                const rowText = row.textContent.trim();
                logger.log(`🔧 Строка ${index + 1}: ${rowText.substring(0, 100)}...`);
                
                // Ищем все ячейки
                const cells = row.querySelectorAll('.gridCell');
                logger.log(`🔧   Ячеек: ${cells.length}`);
                
                cells.forEach((cell, cellIndex) => {
                    const cellText = cell.textContent.trim();
                    logger.log(`🔧   Ячейка ${cellIndex}: "${cellText}"`);
                });
                
                // Ищем номер
                const numberMatch = rowText.match(/\b(\d{3,})\b/);
                if (numberMatch) {
                    logger.log(`🔧   Найден номер: ${numberMatch[1]}`);
                    logger.log(`🔧   После обрезки 3 цифр: ${numberMatch[1].slice(0, -3)}`);
                }
                
                logger.log('---');
            });
        }
        
        if (groupTable) {
            logger.log('🔧 === АНАЛИЗ ТАБЛИЦЫ ГРУПП ===');
            const rows = groupTable.querySelectorAll('.gridLine');
            logger.log(`🔧 Найдено строк: ${rows.length}`);
            
            rows.forEach((row, index) => {
                const rowText = row.textContent.trim();
                logger.log(`🔧 Строка ${index + 1}: ${rowText.substring(0, 100)}...`);
                
                // Ищем все ячейки
                const cells = row.querySelectorAll('.gridCell');
                logger.log(`🔧   Ячеек: ${cells.length}`);
                
                cells.forEach((cell, cellIndex) => {
                    const cellText = cell.textContent.trim();
                    logger.log(`🔧   Ячейка ${cellIndex}: "${cellText}"`);
                });
                
                // Ищем номер
                const numberMatch = rowText.match(/\b(\d{3,})\b/);
                if (numberMatch) {
                    logger.log(`🔧   Найден номер: ${numberMatch[1]}`);
                    logger.log(`🔧   После обрезки 3 цифр: ${numberMatch[1].slice(0, -3)}`);
                }
                
                logger.log('---');
            });
        }
        
        // Пробуем разные селекторы для номеров
        logger.log('🔧 === ПОИСК СЕЛЕКТОРОВ НОМЕРОВ ===');
        
        // Пробуем найти элементы с классами, содержащими "номер"
        const numberElements = document.querySelectorAll('[class*="номер"], [class*="number"], [data-field*="номер"], [data-field*="number"]');
        logger.log(`🔧 Элементов с номером в классе: ${numberElements.length}`);
        
        numberElements.forEach((el, index) => {
            logger.log(`🔧 Элемент ${index}: ${el.className} -> "${el.textContent.trim()}"`);
        });
        
        return {
            classificationFound: !!classificationTable,
            groupFound: !!groupTable,
            classificationRows: classificationTable ? classificationTable.querySelectorAll('.gridLine').length : 0,
            groupRows: groupTable ? groupTable.querySelectorAll('.gridLine').length : 0,
            numberElements: numberElements.length
        };
        
    } catch (error) {
        logger.error('🔧 DEBUG error:', error);
        return { error: error.message };
    }
}

// Обработчик сообщений
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    logger.log('🔧 Content: Received message:', message.type);
    
    messageHandler.handle(message)
        .then(sendResponse)
        .catch(error => {
            logger.error('🔧 Message handler error:', error);
            sendResponse({ error: error.message });
        });
    
    return true;
});

// Очистка ресурсов при выгрузке страницы
window.addEventListener('beforeunload', () => {
    if (checkIntervalId) {
        clearInterval(checkIntervalId);
    }
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
    if (soundDisableTimer) {
        clearTimeout(soundDisableTimer);
    }
});

// Запуск
try { init(); } catch (e) { logger.error('content.js init error:', e); }