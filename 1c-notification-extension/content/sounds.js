export const SOUND_LIBRARY = {
    classic: {
        name: 'Классический', description: 'Стандартный звук уведомления',
        play(context, volume = 1.0) {
            const osc = context.createOscillator(), gain = context.createGain();
            osc.type = 'square'; osc.frequency.setValueAtTime(800, context.currentTime);
            gain.gain.setValueAtTime(volume, context.currentTime);
            osc.connect(gain); gain.connect(context.destination);
            osc.onended = () => { osc.disconnect(); gain.disconnect(); };
            osc.start(); window.__st(() => osc.stop(), 800);
            [800, 1200, 600, 1000].slice(1).forEach((f, i) => {
                window.__st(() => {
                    const o = context.createOscillator(), g = context.createGain();
                    o.type = 'square'; o.frequency.setValueAtTime(f, context.currentTime);
                    g.gain.setValueAtTime(volume * 0.7, context.currentTime);
                    o.connect(g); g.connect(context.destination);
                    o.onended = () => { o.disconnect(); g.disconnect(); };
                    o.start(); window.__st(() => o.stop(), 100);
                }, [200, 400, 600][i]);
            });
        }
    },
    modern: {
        name: 'Современный', description: 'Современный цифровой звук',
        play(context, volume = 1.0) {
            const osc = context.createOscillator(), gain = context.createGain();
            osc.type = 'sine'; osc.frequency.setValueAtTime(1000, context.currentTime);
            gain.gain.setValueAtTime(volume, context.currentTime);
            const mod = context.createOscillator(), mg = context.createGain();
            mod.frequency.setValueAtTime(5, context.currentTime);
            mg.gain.setValueAtTime(100, context.currentTime);
            mod.connect(mg); mg.connect(osc.frequency);
            osc.connect(gain); gain.connect(context.destination);
            osc.onended = () => { osc.disconnect(); gain.disconnect(); };
            osc.start(); mod.start();
            gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1);
            window.__st(() => { osc.stop(); mod.stop(); mod.disconnect(); mg.disconnect(); }, 1000);
        }
    },
    alert: {
        name: 'Тревожный', description: 'Громкий привлекающий внимание',
        play(context, volume = 1.0) {
            const beep = (freq, dur, delay) => {
                window.__st(() => {
                    const o = context.createOscillator(), g = context.createGain();
                    o.type = 'square'; o.frequency.setValueAtTime(freq, context.currentTime);
                    g.gain.setValueAtTime(0, context.currentTime);
                    g.gain.linearRampToValueAtTime(volume, context.currentTime + 0.05);
                    o.connect(g); g.connect(context.destination);
                    o.onended = () => { o.disconnect(); g.disconnect(); };
                    o.start(); window.__st(() => o.stop(), dur);
                }, delay);
            };
            beep(1200, 200, 0); beep(800, 200, 300); beep(1000, 300, 600);
        }
    },
    soft: {
        name: 'Мягкий', description: 'Тихий ненавязчивый звук',
        play(context, volume = 1.0) {
            const o = context.createOscillator(), g = context.createGain();
            o.type = 'sine'; o.frequency.setValueAtTime(600, context.currentTime);
            g.gain.setValueAtTime(0.001, context.currentTime);
            g.gain.exponentialRampToValueAtTime(volume * 0.5, context.currentTime + 0.1);
            g.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1);
            o.connect(g); g.connect(context.destination);
            o.onended = () => { o.disconnect(); g.disconnect(); };
            o.start(); window.__st(() => o.stop(), 1000);
        }
    },
    game: {
        name: 'Игровой', description: 'Звук из видеоигр',
        play(context, volume = 1.0) {
            [523.25, 587.33, 659.25, 698.46, 783.99].forEach((n, i) => {
                window.__st(() => {
                    const o = context.createOscillator(), g = context.createGain();
                    o.type = 'triangle'; o.frequency.setValueAtTime(n, context.currentTime);
                    g.gain.setValueAtTime(volume * 0.6, context.currentTime);
                    g.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.1);
                    o.connect(g); g.connect(context.destination);
                    o.onended = () => { o.disconnect(); g.disconnect(); };
                    o.start(); window.__st(() => { o.stop(); o.disconnect(); g.disconnect(); }, 100);
                }, i * 80);
            });
        }
    },
    office: {
        name: 'Офисный', description: 'Тихий звук для офиса',
        play(context, volume = 1.0) {
            const o = context.createOscillator(), g = context.createGain();
            const f = context.createBiquadFilter();
            o.type = 'sawtooth'; o.frequency.setValueAtTime(440, context.currentTime);
            g.gain.setValueAtTime(volume * 0.3, context.currentTime);
            f.type = 'lowpass'; f.frequency.setValueAtTime(1000, context.currentTime);
            o.connect(f); f.connect(g); g.connect(context.destination);
            o.onended = () => { o.disconnect(); f.disconnect(); g.disconnect(); };
            o.start(); window.__st(() => { o.stop(); o.disconnect(); f.disconnect(); g.disconnect(); }, 500);
        }
    },
    melody: {
        name: 'Мелодия', description: 'Приятная мелодия',
        play(context, volume = 1.0) {
            [523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25].forEach((n, i) => {
                window.__st(() => {
                    const o = context.createOscillator(), g = context.createGain();
                    o.type = 'sine'; o.frequency.setValueAtTime(n, context.currentTime);
                    g.gain.setValueAtTime(volume * 0.4, context.currentTime);
                    g.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.3);
                    o.connect(g); g.connect(context.destination);
                    o.onended = () => { o.disconnect(); g.disconnect(); };
                    o.start(); window.__st(() => { o.stop(); o.disconnect(); g.disconnect(); }, 300);
                }, i * 150);
            });
        }
    },
    beep: {
        name: 'Бип', description: 'Простой короткий бип',
        play(context, volume = 1.0) {
            const o = context.createOscillator(), g = context.createGain();
            o.type = 'sine'; o.frequency.setValueAtTime(880, context.currentTime);
            g.gain.setValueAtTime(volume * 0.5, context.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.15);
            o.connect(g); g.connect(context.destination);
            o.onended = () => { o.disconnect(); g.disconnect(); };
            o.start(); window.__st(() => { o.stop(); o.disconnect(); g.disconnect(); }, 150);
        }
    },
    chime: {
        name: 'Колокольчик', description: 'Звонкий колокольчик',
        play(context, volume = 1.0) {
            const bell = (freq, delay, dur) => {
                window.__st(() => {
                    const o = context.createOscillator(), g = context.createGain();
                    o.type = 'sine'; o.frequency.setValueAtTime(freq, context.currentTime);
                    g.gain.setValueAtTime(volume * 0.6, context.currentTime);
                    g.gain.exponentialRampToValueAtTime(0.001, context.currentTime + dur);
                    o.connect(g); g.connect(context.destination);
                    o.onended = () => { o.disconnect(); g.disconnect(); };
                    o.start(); window.__st(() => { o.stop(); o.disconnect(); g.disconnect(); }, dur * 1000);
                }, delay);
            };
            bell(1046.5, 0, 0.8); bell(1318.5, 100, 0.6); bell(1568, 200, 0.4);
        }
    },
    notification: {
        name: 'Уведомление', description: 'Стандартное уведомление',
        play(context, volume = 1.0) {
            const o = context.createOscillator(), g = context.createGain();
            o.type = 'triangle'; o.frequency.setValueAtTime(700, context.currentTime);
            g.gain.setValueAtTime(volume * 0.6, context.currentTime);
            o.connect(g); g.connect(context.destination);
            o.onended = () => { o.disconnect(); g.disconnect(); };
            o.start(); window.__st(() => { o.frequency.setValueAtTime(900, context.currentTime); }, 100);
            window.__st(() => { o.stop(); o.disconnect(); g.disconnect(); }, 200);
            window.__st(() => {
                const o2 = context.createOscillator(), g2 = context.createGain();
                o2.type = 'triangle'; o2.frequency.setValueAtTime(900, context.currentTime);
                g2.gain.setValueAtTime(volume * 0.6, context.currentTime);
                g2.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.15);
                o2.connect(g2); g2.connect(context.destination);
                o2.onended = () => { o2.disconnect(); g2.disconnect(); };
                o2.start(); window.__st(() => { o2.stop(); o2.disconnect(); g2.disconnect(); }, 150);
            }, 250);
        }
    },
    pop: {
        name: 'Всплывающий', description: 'Мягкий всплывающий звук',
        play(context, volume = 1.0) {
            const o = context.createOscillator(), g = context.createGain();
            o.type = 'sine'; o.frequency.setValueAtTime(400, context.currentTime);
            o.frequency.exponentialRampToValueAtTime(800, context.currentTime + 0.1);
            g.gain.setValueAtTime(volume * 0.4, context.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.2);
            o.connect(g); g.connect(context.destination);
            o.onended = () => { o.disconnect(); g.disconnect(); };
            o.start(); window.__st(() => { o.stop(); o.disconnect(); g.disconnect(); }, 200);
        }
    },
    success: {
        name: 'Успех', description: 'Звук успешного действия',
        play(context, volume = 1.0) {
            [523.25, 659.25, 783.99, 1046.5].forEach((n, i) => {
                window.__st(() => {
                    const o = context.createOscillator(), g = context.createGain();
                    o.type = 'sine'; o.frequency.setValueAtTime(n, context.currentTime);
                    g.gain.setValueAtTime(volume * 0.4, context.currentTime);
                    g.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.15);
                    o.connect(g); g.connect(context.destination);
                    o.onended = () => { o.disconnect(); g.disconnect(); };
                    o.start(); window.__st(() => { o.stop(); o.disconnect(); g.disconnect(); }, 150);
                }, i * 80);
            });
        }
    },
    error: {
        name: 'Ошибка', description: 'Звук ошибки',
        play(context, volume = 1.0) {
            [400, 350, 300, 250].forEach((n, i) => {
                window.__st(() => {
                    const o = context.createOscillator(), g = context.createGain();
                    const f = context.createBiquadFilter();
                    o.type = 'sawtooth'; o.frequency.setValueAtTime(n, context.currentTime);
                    g.gain.setValueAtTime(volume * 0.3, context.currentTime);
                    f.type = 'lowpass'; f.frequency.setValueAtTime(800, context.currentTime);
                    o.connect(f); f.connect(g); g.connect(context.destination);
                    o.onended = () => { o.disconnect(); f.disconnect(); g.disconnect(); };
                    o.start(); window.__st(() => { o.stop(); o.disconnect(); f.disconnect(); g.disconnect(); }, 100);
                }, i * 100);
            });
        }
    },
    click: {
        name: 'Клик', description: 'Звук щелчка',
        play(context, volume = 1.0) {
            const o = context.createOscillator(), g = context.createGain();
            o.type = 'square'; o.frequency.setValueAtTime(1200, context.currentTime);
            g.gain.setValueAtTime(volume * 0.3, context.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.05);
            o.connect(g); g.connect(context.destination);
            o.onended = () => { o.disconnect(); g.disconnect(); };
            o.start(); window.__st(() => { o.stop(); o.disconnect(); g.disconnect(); }, 50);
        }
    }
};

export const GROUP_SOUND_LIBRARY = {
    ...SOUND_LIBRARY,
    group_chime: {
        name: 'Колокольчик', description: 'Мягкий колокольчик для групп',
        play(context, volume = 1.0) {
            const bell = (freq, time) => {
                const o = context.createOscillator(), g = context.createGain();
                o.type = 'sine'; o.frequency.setValueAtTime(freq, context.currentTime);
                g.gain.setValueAtTime(volume * 0.7, context.currentTime);
                g.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1.5);
                o.connect(g); g.connect(context.destination);
                o.onended = () => { o.disconnect(); g.disconnect(); };
                o.start(time); o.stop(time + 1.5);
            };
            bell(784, context.currentTime);
            bell(659, context.currentTime + 0.1);
            bell(523, context.currentTime + 0.2);
        }
    },
    group_notification: {
        name: 'Групповое уведомление', description: 'Отдельный звук для групповых задач',
        play(context, volume = 1.0) {
            const o = context.createOscillator(), g = context.createGain();
            o.type = 'square'; o.frequency.setValueAtTime(600, context.currentTime);
            g.gain.setValueAtTime(volume, context.currentTime);
            o.connect(g); g.connect(context.destination);
            o.onended = () => { o.disconnect(); g.disconnect(); };
            o.start(); window.__st(() => { o.stop(); o.disconnect(); g.disconnect(); }, 500);
            [800, 400].forEach((f, i) => {
                window.__st(() => {
                    const o2 = context.createOscillator(), g2 = context.createGain();
                    o2.type = 'sine'; o2.frequency.setValueAtTime(f, context.currentTime);
                    g2.gain.setValueAtTime(volume * 0.8, context.currentTime);
                    o2.connect(g2); g2.connect(context.destination);
                    o2.onended = () => { o2.disconnect(); g2.disconnect(); };
                    o2.start(); window.__st(() => { o2.stop(); o2.disconnect(); g2.disconnect(); }, 50);
                }, [150, 300][i]);
            });
        }
    },
    group_bell: {
        name: 'Звонок', description: 'Громкий звонок для групп',
        play(context, volume = 1.0) {
            const ring = (freq, delay, dur) => {
                window.__st(() => {
                    const o = context.createOscillator(), g = context.createGain();
                    o.type = 'triangle'; o.frequency.setValueAtTime(freq, context.currentTime);
                    g.gain.setValueAtTime(volume * 0.8, context.currentTime);
                    g.gain.exponentialRampToValueAtTime(0.001, context.currentTime + dur);
                    o.connect(g); g.connect(context.destination);
                    o.onended = () => { o.disconnect(); g.disconnect(); };
                    o.start(); window.__st(() => { o.stop(); o.disconnect(); g.disconnect(); }, dur * 1000);
                }, delay);
            };
            ring(880, 0, 0.5); ring(1100, 200, 0.3); ring(880, 400, 0.5);
        }
    },
    group_ding: {
        name: 'Динь', description: 'Легкий звук динь',
        play(context, volume = 1.0) {
            const o = context.createOscillator(), g = context.createGain();
            o.type = 'sine'; o.frequency.setValueAtTime(1200, context.currentTime);
            g.gain.setValueAtTime(volume * 0.5, context.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.3);
            o.connect(g); g.connect(context.destination);
            o.onended = () => { o.disconnect(); g.disconnect(); };
            o.start(); window.__st(() => { o.stop(); o.disconnect(); g.disconnect(); }, 300);
        }
    }
};
