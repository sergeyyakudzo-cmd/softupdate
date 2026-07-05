logger.logModuleLoad('content-sounds.js');

const SOUND_LIBRARY = {
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
    
    modern: {
        name: 'Современный',
        description: 'Современный цифровой звук',
        play: function(context, volume = 1.0) {
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(1000, context.currentTime);
            gainNode.gain.setValueAtTime(volume, context.currentTime);
            
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
            
            gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1);
            
            setTimeout(() => {
                oscillator.stop();
                modulator.stop();
            }, 1000);
        }
    },
    
    alert: {
        name: 'Тревожный',
        description: 'Громкий привлекающий внимание',
        play: function(context, volume = 1.0) {
            const playBeep = (freq, duration, delay) => {
                setTimeout(() => {
                    const oscillator = context.createOscillator();
                    const gainNode = context.createGain();
                    
                    oscillator.type = 'square';
                    oscillator.frequency.setValueAtTime(freq, context.currentTime);
                    gainNode.gain.setValueAtTime(volume, context.currentTime);
                    
                    gainNode.gain.setValueAtTime(0, context.currentTime);
                    gainNode.gain.linearRampToValueAtTime(volume, context.currentTime + 0.05);
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(context.destination);
                    
                    oscillator.start();
                    setTimeout(() => oscillator.stop(), duration);
                }, delay);
            };
            
            playBeep(1200, 200, 0);
            playBeep(800, 200, 300);
            playBeep(1000, 300, 600);
        }
    },
    
    soft: {
        name: 'Мягкий',
        description: 'Тихий ненавязчивый звук',
        play: function(context, volume = 1.0) {
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(600, context.currentTime);
            gainNode.gain.setValueAtTime(volume * 0.5, context.currentTime);
            
            gainNode.gain.setValueAtTime(0, context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(volume * 0.5, context.currentTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1);
            
            oscillator.connect(gainNode);
            gainNode.connect(context.destination);
            
            oscillator.start();
            setTimeout(() => oscillator.stop(), 1000);
        }
    },
    
    game: {
        name: 'Игровой',
        description: 'Звук из видеоигр',
        play: function(context, volume = 1.0) {
            const notes = [523.25, 587.33, 659.25, 698.46, 783.99];
            notes.forEach((note, index) => {
                setTimeout(() => {
                    const oscillator = context.createOscillator();
                    const gainNode = context.createGain();
                    
                    oscillator.type = 'triangle';
                    oscillator.frequency.setValueAtTime(note, context.currentTime);
                    gainNode.gain.setValueAtTime(volume * 0.6, context.currentTime);
                    
                    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.1);
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(context.destination);
                    
                    oscillator.start();
                    setTimeout(() => oscillator.stop(), 100);
                }, index * 80);
            });
        }
    },
    
    office: {
        name: 'Офисный',
        description: 'Тихий звук для офиса',
        play: function(context, volume = 1.0) {
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(440, context.currentTime);
            gainNode.gain.setValueAtTime(volume * 0.3, context.currentTime);
            
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
    
    melody: {
        name: 'Мелодия',
        description: 'Приятная мелодия',
        play: function(context, volume = 1.0) {
            const notes = [523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25];
            notes.forEach((note, index) => {
                setTimeout(() => {
                    const oscillator = context.createOscillator();
                    const gainNode = context.createGain();
                    
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(note, context.currentTime);
                    gainNode.gain.setValueAtTime(volume * 0.4, context.currentTime);
                    
                    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.3);
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(context.destination);
                    
                    oscillator.start();
                    setTimeout(() => oscillator.stop(), 300);
                }, index * 150);
            });
        }
    },
    
    beep: {
        name: 'Бип',
        description: 'Простой короткий бип',
        play: function(context, volume = 1.0) {
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, context.currentTime);
            gainNode.gain.setValueAtTime(volume * 0.5, context.currentTime);
            
            gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.15);
            
            oscillator.connect(gainNode);
            gainNode.connect(context.destination);
            
            oscillator.start();
            setTimeout(() => oscillator.stop(), 150);
        }
    },
    
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
                    
                    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(context.destination);
                    
                    oscillator.start();
                    setTimeout(() => oscillator.stop(), duration * 1000);
                }, delay);
            };
            
            playBell(1046.5, 0, 0.8);
            playBell(1318.5, 100, 0.6);
            playBell(1568, 200, 0.4);
        }
    },
    
    notification: {
        name: 'Уведомление',
        description: 'Стандартное уведомление',
        play: function(context, volume = 1.0) {
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(700, context.currentTime);
            gainNode.gain.setValueAtTime(volume * 0.6, context.currentTime);
            
            oscillator.connect(gainNode);
            gainNode.connect(context.destination);
            
            oscillator.start();
            setTimeout(() => {
                oscillator.frequency.setValueAtTime(900, context.currentTime);
            }, 100);
            setTimeout(() => oscillator.stop(), 200);
            
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
    
    pop: {
        name: 'Всплывающий',
        description: 'Мягкий всплывающий звук',
        play: function(context, volume = 1.0) {
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(400, context.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(800, context.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(volume * 0.4, context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.2);
            
            oscillator.connect(gainNode);
            gainNode.connect(context.destination);
            
            oscillator.start();
            setTimeout(() => oscillator.stop(), 200);
        }
    },
    
    success: {
        name: 'Успех',
        description: 'Звук успешного действия',
        play: function(context, volume = 1.0) {
            const notes = [523.25, 659.25, 783.99, 1046.5];
            notes.forEach((note, index) => {
                setTimeout(() => {
                    const oscillator = context.createOscillator();
                    const gainNode = context.createGain();
                    
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(note, context.currentTime);
                    gainNode.gain.setValueAtTime(volume * 0.4, context.currentTime);
                    
                    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.15);
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(context.destination);
                    
                    oscillator.start();
                    setTimeout(() => oscillator.stop(), 150);
                }, index * 80);
            });
        }
    },
    
    error: {
        name: 'Ошибка',
        description: 'Звук ошибки',
        play: function(context, volume = 1.0) {
            const notes = [400, 350, 300, 250];
            notes.forEach((note, index) => {
                setTimeout(() => {
                    const oscillator = context.createOscillator();
                    const gainNode = context.createGain();
                    
                    oscillator.type = 'sawtooth';
                    oscillator.frequency.setValueAtTime(note, context.currentTime);
                    gainNode.gain.setValueAtTime(volume * 0.3, context.currentTime);
                    
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
    
    click: {
        name: 'Клик',
        description: 'Звук щелчка',
        play: function(context, volume = 1.0) {
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(1200, context.currentTime);
            gainNode.gain.setValueAtTime(volume * 0.3, context.currentTime);
            
            gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.05);
            
            oscillator.connect(gainNode);
            gainNode.connect(context.destination);
            
            oscillator.start();
            setTimeout(() => oscillator.stop(), 50);
        }
    }
};

const GROUP_SOUND_LIBRARY = {
    ...SOUND_LIBRARY,
    
    group_chime: {
        name: 'Колокольчик',
        description: 'Мягкий колокольчик для групп',
        play: function(context, volume = 1.0) {
            const playBell = (freq, time) => {
                const oscillator = context.createOscillator();
                const gainNode = context.createGain();
                
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(freq, context.currentTime);
                gainNode.gain.setValueAtTime(volume * 0.7, context.currentTime);
                
                gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1.5);
                
                oscillator.connect(gainNode);
                gainNode.connect(context.destination);
                
                oscillator.start(time);
                oscillator.stop(time + 1.5);
            };
            
            playBell(784, context.currentTime);
            playBell(659, context.currentTime + 0.1);
            playBell(523, context.currentTime + 0.2);
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
            
            gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.3);
            
            oscillator.connect(gainNode);
            gainNode.connect(context.destination);
            
            oscillator.start();
            setTimeout(() => oscillator.stop(), 300);
        }
    }
};
