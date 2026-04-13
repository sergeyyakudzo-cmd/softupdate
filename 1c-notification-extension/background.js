importScripts('logger.js', 'utils.js', 'config.js');
logger.logModuleLoad('background.js');

function getMaxToken() {
    return typeof CONFIG !== 'undefined' ? CONFIG.MAX?.BOT_TOKEN : '';
}

function getBar(value, max, length = 8) {
    if (max <= 0) return '░'.repeat(length);
    const len = Math.round((value / max) * length);
    return '█'.repeat(Math.max(0, Math.min(length, len))) + '░'.repeat(Math.max(0, length - len));
}

// Настройки подключения Telegram
let telegramConnection = {
    type: 'direct', // 'direct', 'proxy', 'custom'
    proxy: { type: '', host: '', port: null, username: '', password: '' },
    customApiUrl: ''
};

// Определяем URL для Telegram API
const TARGET_DOMAIN = 'https://2phoenix.alidi.ru/';

// Состояние мониторинга (объявлено явно — использовалось без объявления)
let monitoringState = {
    isActive: false,
    classificationCount: 0,
    groupCount: 0,
    telegramEnabled: false,
    telegramConfigured: false
};

// ============ СМЕННЫЙ УЧЕТ ЗАЯВОК (7:00 - 7:00) ============
const shiftTracker = {
    currentShift: null, // { date: 'YYYY-MM-DD', classification: 0, group: 0 }
    
    // Получить текущую дату смены (с 7:00 до 7:00)
    getShiftDate() {
        const now = new Date();
        const hours = now.getHours();
        
        // Если сейчас меньше 7:00, смена еще со вчерашнего дня
        if (hours < 7) {
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            return yesterday.toISOString().split('T')[0];
        }
        
        return now.toISOString().split('T')[0];
    },
    
    // Инициализировать смену
    initShift() {
        const shiftDate = this.getShiftDate();
        
        if (!this.currentShift || this.currentShift.date !== shiftDate) {
            // Новая смена
            this.currentShift = {
                date: shiftDate,
                // Всего уникальных заявок за смену
                totalUnique: 0,
                // Уникальных было на классификации (когда-либо)
                classificationTotal: 0,
                // Уникальных было в очереди (когда-либо)
                groupTotal: 0,
                // Номера, которые были на классификации
                seenOnClassification: [],
                // Номера, которые были в очереди
                seenInGroup: [],
                // Часовые срезы (7:00-7:00 следующего дня = 24 часа)
                hourlyClassification: Array(24).fill(0),
                hourlyGroup: Array(24).fill(0),
                // Текущее состояние для отображения
                currentClassificationCount: 0,
                currentGroupCount: 0
            };
            logger.log('🔧 ShiftTracker: Новая смена началась:', shiftDate);
            this.save();
        }
        
        return this.currentShift;
    },
    
    // Добавить заявки - с учетом откуда они пришли
    processApplications(classNumbers = [], groupNumbers = []) {
        this.initShift();
        
        const now = new Date();
        const hour = now.getHours();
        const hourIndex = hour >= 7 ? hour - 7 : hour + 17;
        
        let newClassification = 0;
        let newGroup = 0;
        
        // Обрабатываем классификацию
        if (classNumbers && classNumbers.length > 0) {
            classNumbers.forEach(num => {
                const wasOnClassification = this.currentShift.seenOnClassification.includes(num);
                const wasInGroup = this.currentShift.seenInGroup.includes(num);
                
                if (!wasOnClassification && !wasInGroup) {
                    // Новый номер - добавляем на классификацию
                    this.currentShift.seenOnClassification.push(num);
                    this.currentShift.classificationTotal++;
                    newClassification++;
                    
                    if (hourIndex >= 0 && hourIndex < 24) {
                        this.currentShift.hourlyClassification[hourIndex]++;
                    }
                } else if (wasOnClassification && !wasInGroup) {
                    // Уже был на классификации - не считаем
                }
                // Если был в группе - не добавляем (он уже был в очереди)
            });
        }
        
        // Обрабатываем группу
        if (groupNumbers && groupNumbers.length > 0) {
            groupNumbers.forEach(num => {
                const wasOnClassification = this.currentShift.seenOnClassification.includes(num);
                const wasInGroup = this.currentShift.seenInGroup.includes(num);
                
                if (!wasOnClassification && !wasInGroup) {
                    // Новый номер - добавляем в группу
                    this.currentShift.seenInGroup.push(num);
                    this.currentShift.groupTotal++;
                    newGroup++;
                    
                    if (hourIndex >= 0 && hourIndex < 24) {
                        this.currentShift.hourlyGroup[hourIndex]++;
                    }
                } else if (wasInGroup && !wasOnClassification) {
                    // Уже был в группе - не считаем
                }
                // Если был на классификации - не добавляем (он уже был на классификации)
            });
        }
        
        // Обновляем текущее состояние
        this.currentShift.currentClassificationCount = classNumbers.length;
        this.currentShift.currentGroupCount = groupNumbers.length;
        
        // Всего уникальных
        this.currentShift.totalUnique = this.currentShift.seenOnClassification.length + this.currentShift.seenInGroup.length;
        
        if (newClassification > 0 || newGroup > 0) {
            this.save();
            this.updateBadge();
            logger.log(`🔧 ShiftTracker: New class: ${newClassification}, new group: ${newGroup} | Total class: ${this.currentShift.classificationTotal}, group: ${this.currentShift.groupTotal}`);
        }
    },
    
    // Добавить заявки к счетчику (только новые номера!)
    addClassification(count, numbers = []) {
        this.initShift();
        
        // Считаем только НОВЫЕ номера (которых еще не видели)
        let newCount = 0;
        if (numbers && numbers.length > 0) {
            const now = new Date();
            const hour = now.getHours();
            
            numbers.forEach(num => {
                if (!this.currentShift.seenClassificationNumbers.includes(num)) {
                    this.currentShift.seenClassificationNumbers.push(num);
                    this.currentShift.classificationNumbers.push(num); // Для отчета
                    newCount++;
                    
                    // Записываем в часовой срез
                    // Смена с 7:00 до 7:00, значит час 7 - это индекс 0
                    const hourIndex = hour >= 7 ? hour - 7 : hour + 17;
                    if (hourIndex >= 0 && hourIndex < 24) {
                        this.currentShift.hourlyClassification[hourIndex]++;
                    }
                }
            });
        }
        
        // Добавляем только новые заявки
        if (newCount > 0) {
            this.currentShift.classification += newCount;
            this.save();
            this.updateBadge();
            logger.log(`🔧 ShiftTracker: Classification added ${newCount}. Total: ${this.currentShift.classification}`);
        }
    },
    
    // Добавить группу к счетчику (только новые номера!)
    addGroup(count, numbers = []) {
        this.initShift();
        
        // Считаем только НОВЫЕ номера (которых еще не видели)
        let newCount = 0;
        if (numbers && numbers.length > 0) {
            const now = new Date();
            const hour = now.getHours();
            
            numbers.forEach(num => {
                if (!this.currentShift.seenGroupNumbers.includes(num)) {
                    this.currentShift.seenGroupNumbers.push(num);
                    this.currentShift.groupNumbers.push(num); // Для отчета
                    newCount++;
                    
                    // Записываем в часовой срез
                    const hourIndex = hour >= 7 ? hour - 7 : hour + 17;
                    if (hourIndex >= 0 && hourIndex < 24) {
                        this.currentShift.hourlyGroup[hourIndex]++;
                    }
                }
            });
        }
        
        this.save();
        this.updateBadge();
    },
    
    // Получить текущие данные смены
    getCurrentShift() {
        return this.initShift();
    },
    
    // Сохранить в storage
    save() {
        if (this.currentShift) {
            chrome.storage.local.set({ shiftData: this.currentShift });
        }
    },
    
    // Загрузить из storage
    load(callback) {
        chrome.storage.local.get(['shiftData'], (result) => {
            if (result.shiftData) {
                // Проверяем, не закончилась ли смена пока расширение было закрыто
                const shiftDate = this.getShiftDate();
                if (result.shiftData.date === shiftDate) {
                    this.currentShift = result.shiftData;
                    
                    // Обеспечиваем обратную совместимость - добавляем недостающие поля
                    if (!this.currentShift.hourlyClassification) {
                        this.currentShift.hourlyClassification = Array(24).fill(0);
                    }
                    if (!this.currentShift.hourlyGroup) {
                        this.currentShift.hourlyGroup = Array(24).fill(0);
                    }
                    if (!this.currentShift.seenClassificationNumbers) {
                        this.currentShift.seenClassificationNumbers = this.currentShift.classificationNumbers || [];
                    }
                    if (!this.currentShift.seenGroupNumbers) {
                        this.currentShift.seenGroupNumbers = this.currentShift.groupNumbers || [];
                    }
                    if (!this.currentShift.seenAllNumbers) {
                        this.currentShift.seenAllNumbers = [];
                    }
                } else {
                    // Смена закончилась - сбрасываем
                    logger.log('🔧 ShiftTracker: Смена изменилась, сбрасываем счетчик');
                    this.currentShift = null;
                    this.initShift();
                }
            } else {
                this.initShift();
            }
            
            if (callback) callback(this.currentShift);
        });
    },
    
    // Обновить бейдж с общим числом за смену
    updateBadge() {
        if (this.currentShift) {
            const total = (this.currentShift.classificationTotal || 0) + (this.currentShift.groupTotal || 0);
            if (total > 0) {
                const badgeText = total > 99 ? '99+' : total.toString();
                chrome.action.setBadgeText({ text: badgeText });
                chrome.action.setBadgeBackgroundColor({ color: [249, 115, 22, 255] }); // Оранжевый
            }
        }
    },
    
    // Отправить отчет за смену в MAX
    async sendDailyReport() {
        if (!this.currentShift) {
            return { success: false, error: 'Нет данных смены' };
        }
        
        const shift = this.currentShift;
        
        // Формируем текст отчета
        const dateObj = new Date(shift.date);
        const dateStr = dateObj.toLocaleDateString('ru-RU', { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short' 
        });
        
        let reportText = `📊 *Отчет за смену ${dateStr}*\n\n`;
        
        // Классификация (без номеров)
        const classWord = getCaseWord(shift.classificationTotal || 0, ['заявка', 'заявки', 'заявок']);
        reportText += `🔔 Классификация: ${shift.classificationTotal || 0} ${classWord}\n`;
        
        // Группы (без номеров)
        const groupWord = getCaseWord(shift.groupTotal || 0, ['задача', 'задачи', 'задач']);
        reportText += `👥 Группы: ${shift.groupTotal || 0} ${groupWord}\n`;
        
        // Итого
        const total = (shift.classificationTotal || 0) + (shift.groupTotal || 0);
        const totalWord = getCaseWord(total, ['заявка', 'заявки', 'заявок']);
        reportText += `\n📈 *Всего: ${total} ${totalWord}*\n`;
        
        // График загруженности по часам
        reportText += '\n' + this.generateHourlyChart(shift);
        
        logger.log('🔧 ShiftTracker: Отправляем отчет в MAX:', reportText);
        
        // Отправляем через MAX API
        return await sendMaxDailyReport(reportText);
    },
    
    generateHourlyChart(shift) {
        const hourlyClass = shift.hourlyClassification || [];
        const hourlyGrp = shift.hourlyGroup || [];
        
        const chartLines = ['📈 По часам:'];
        
        // Часы с 7:00 до 19:00 - классификация, 19:00-7:00 - группы
        let peak = 0, peakHour = 0;
        for (let i = 0; i < 24; i++) {
            if (hourlyClass[i] > peak) { peak = hourlyClass[i]; peakHour = i; }
            if (hourlyGrp[i] > peak) { peak = hourlyGrp[i]; peakHour = i; }
        }
        
        for (let i = 0; i < 24; i++) {
            const hour = (i + 7) % 24;
            const h = hour.toString().padStart(2, '0') + ':00';
            
            const classVal = hourlyClass[i] || 0;
            const groupVal = hourlyGrp[i] || 0;
            
            if (classVal > 0 || groupVal > 0) {
                const bar = getBar(classVal + groupVal, peak, 6);
                const isPeak = (classVal + groupVal) === peak && peak > 0;
                const flag = isPeak ? ' ✨' : '';
                chartLines.push(`${h}: ${bar}${classVal + groupVal}${flag}`);
            }
        }
        
        if (peak > 0) {
            const peakH = ((peakHour + 7) % 24).toString().padStart(2, '0') + ':00';
            chartLines.push(`\n🔥 Пик: ${peak} в ${peakH}`);
        }
        
        return chartLines.join('\n');
    },
    
    // Сбросить счетчик смены и начать новую
    reset() {
        // Запоминаем дату старой смены перед сбросом
        const oldDate = this.currentShift ? this.currentShift.date : null;
        
        this.currentShift = null;
        this.initShift();
        
        // Если была активная смена - логируем
        if (oldDate) {
            logger.log('🔧 ShiftTracker: Смена ' + oldDate + ' завершена, начата новая: ' + this.getShiftDate());
        }
        
        chrome.action.setBadgeText({ text: '' });
    }
};

// Функция отправки дневного отчета в MAX (использует существующий API)
function sendMaxDailyReport(text) {
    return new Promise((resolve) => {
        chrome.storage.local.get(['maxUserId', 'maxBotToken'], (result) => {
            const userId = result.maxUserId || '';
            const botToken = result.maxBotToken || getMaxToken();
            
            if (!botToken || !userId) {
                logger.log('🔧 ShiftTracker: MAX не настроен, userId=' + userId + ', botToken=' + (botToken ? 'есть' : 'нет'));
                resolve({ success: false, error: 'MAX не настроен' });
                return;
            }
            
            sendMaxMessage(botToken, userId, text).then(response => {
                if (response && response.success) {
                    logger.log('🔧 ShiftTracker: Отчет успешно отправлен в MAX');
                    resolve({ success: true });
                } else {
                    logger.error('🔧 ShiftTracker: Ошибка отправки отчета:', response?.error);
                    resolve({ success: false, error: response?.error });
                }
            }).catch(error => {
                logger.error('🔧 ShiftTracker: Ошибка отправки:', error);
                resolve({ success: false, error: error.message });
            });
        });
    });
}

// Планирование ежедневного отчета
function scheduleDailyReport() {
    const now = new Date();
    const targetTime = new Date(now);
    
    // 7:00 - конец смены (24 часа подсчета), отправляем отчет и начинаем новую смену
    targetTime.setHours(7, 0, 0, 0);
    
    // Если уже прошло 7:00, планируем на завтра
    if (targetTime <= now) {
        targetTime.setDate(targetTime.getDate() + 1);
    }
    
    const delay = targetTime.getTime() - now.getTime();
    
    chrome.alarms.create('dailyReport', { delayInMinutes: delay / 60000 });
    logger.log('🔧 ShiftTracker: Отчет запланирован на', targetTime.toLocaleString('ru-RU'));
}

// Слушатель будильников для отчета
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'dailyReport') {
        logger.log('🔧 ShiftTracker: Время отчета!');
        
        const currentShift = shiftTracker.getCurrentShift();
        
        // Сохраняем смену в месячную статистику
        if (currentShift) {
            monthlyStats.addShift(currentShift);
        }
        
        // Отправляем отчет
        shiftTracker.sendDailyReport().then(result => {
            logger.log('🔧 ShiftTracker: Результат отчета:', result);
        });
        
        // Планируем следующий отчет (через 24 часа)
        scheduleDailyReport();
        
        // Сбрасываем счетчик и начинаем новую смену
        shiftTracker.reset();
    }
});

// Загружаем данные смены при старте
shiftTracker.load(() => {
    logger.log('🔧 ShiftTracker: Загружены данные смены:', shiftTracker.currentShift);
    scheduleDailyReport();
});

// Дебаунсинг обновления иконки — не чаще раза в 2 секунды
let iconUpdateScheduled = false;
let lastIconUpdateTime = 0;
const ICON_UPDATE_COOLDOWN = 2000;

function debouncedUpdateIcon() {
    const now = Date.now();
    if (now - lastIconUpdateTime < ICON_UPDATE_COOLDOWN) {
        // Уже обновляли недавно — запланируем позже
        if (!iconUpdateScheduled) {
            iconUpdateScheduled = true;
            setTimeout(() => {
                iconUpdateScheduled = false;
                lastIconUpdateTime = Date.now();
                updateExtensionIcon();
            }, ICON_UPDATE_COOLDOWN);
        }
        return;
    }
    lastIconUpdateTime = now;
    updateExtensionIcon();
}

function getTelegramApiUrl() {
    // Используем Netlify прокси (он работал)
    return 'https://tg1cproxy.netlify.app/.netlify/functions/telegram/bot';
}

// Загружаем настройки подключения при запуске
function setupTelegramConnection() {
    chrome.storage.local.get(['telegramConnection'], (result) => {
        if (result.telegramConnection) {
            telegramConnection = result.telegramConnection;
            
            if (telegramConnection.type === 'proxy' && telegramConnection.proxy?.host) {
                applyProxy();
            } else {
                clearProxy();
            }
            
            logger.log('🔧 Telegram connection:', telegramConnection.type);
        } else {
            clearProxy();
        }
    });
}

function applyProxy() {
    const proxy = telegramConnection.proxy;
    if (!proxy || !proxy.type || !proxy.host || !proxy.port) {
        logger.warn('⚠️ Proxy: incomplete settings, skipping');
        return;
    }
    
    const config = {
        mode: 'fixed_servers',
        rules: {
            singleProxy: {
                scheme: proxy.type.toUpperCase(),
                host: proxy.host,
                port: parseInt(proxy.port)
            }
        }
    };
    
    if (proxy.username && proxy.password) {
        config.rules.singleProxy.username = proxy.username;
        config.rules.singleProxy.password = proxy.password;
    }
    
    chrome.proxy.settings.set({ value: config, scope: 'regular' }, () => {
        if (chrome.runtime.lastError) {
            logger.error('❌ Proxy apply error:', chrome.runtime.lastError.message);
        } else {
            logger.log('🔧 Proxy configured:', proxy.type, proxy.host + ':' + proxy.port);
        }
    });
}

function clearProxy() {
    chrome.proxy.settings.set({ value: { mode: 'direct' }, scope: 'regular' }, () => {
        if (chrome.runtime.lastError) {
            logger.error('❌ Proxy clear error:', chrome.runtime.lastError.message);
        } else {
            logger.log('🔧 Proxy disabled - direct connection');
        }
    });
}

// ============ МЕСЯЧНАЯ СТАТИСТИКА ============
const monthlyStats = {
    data: {},
    
    init() {
        chrome.storage.local.get(['monthlyStatsData'], (result) => {
            if (result.monthlyStatsData) {
                this.data = result.monthlyStatsData;
            } else {
                this.data = { months: {} };
            }
        });
    },
    
    getMonthKey(date = new Date()) {
        return date.toISOString().slice(0, 7);
    },
    
    addShift(shift) {
        if (!shift || !shift.date) return;
        
        const monthKey = this.getMonthKey(new Date(shift.date));
        
        if (!this.data.months[monthKey]) {
            this.data.months[monthKey] = {
                totalClassification: 0,
                totalGroup: 0,
                totalUnique: 0,
                shifts: 0,
                peakCount: 0,
                peakDate: null,
                dailyStats: {}
            };
        }
        
        const month = this.data.months[monthKey];
        const shiftTotal = (shift.classificationTotal || 0) + (shift.groupTotal || 0);
        
        month.shifts++;
        month.totalClassification += shift.classificationTotal || 0;
        month.totalGroup += shift.groupTotal || 0;
        month.totalUnique += shift.totalUnique || 0;
        
        if (shiftTotal > month.peakCount) {
            month.peakCount = shiftTotal;
            month.peakDate = shift.date;
        }
        
        month.dailyStats[shift.date] = {
            classification: shift.classificationTotal || 0,
            group: shift.groupTotal || 0,
            total: shiftTotal
        };
        
        this.save();
    },
    
    save() {
        chrome.storage.local.set({ monthlyStatsData: this.data });
    },
    
    getMonthStats(monthKey) {
        if (!monthKey) monthKey = this.getMonthKey();
        return this.data.months[monthKey] || null;
    },
    
    getAllMonths() {
        return Object.keys(this.data.months || {}).sort().reverse();
    },
    
    formatMonthlyReport(monthKey) {
        const month = this.data.months[monthKey];
        if (!month) return null;
        
        const dateParts = monthKey.split('-');
        const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
        const monthName = monthNames[parseInt(dateParts[1]) - 1] + ' ' + dateParts[0];
        
        let report = `📊 *Статистика за ${monthName}*\n\n`;
        
        report += `📅 Смен: ${month.shifts}\n`;
        
        const classWord = getCaseWord(month.totalClassification || 0, ['заявка', 'заявки', 'заявок']);
        const groupWord = getCaseWord(month.totalGroup || 0, ['задача', 'задачи', 'задач']);
        
        report += `🔔 Классификация: ${month.totalClassification} ${classWord}\n`;
        report += `👥 Группы: ${month.totalGroup} ${groupWord}\n`;
        
        const totalUnique = (month.totalClassification || 0) + (month.totalGroup || 0);
        const totalWord = getCaseWord(totalUnique, ['заявка', 'заявки', 'заявок']);
        report += `📈 *Всего: ${totalUnique} ${totalWord}*\n`;
        
        report += `\n🔥 Пик: ${month.peakCount} (${month.peakDate || '-'})\n`;
        
        // График по дням
        const days = Object.keys(month.dailyStats || {}).sort().reverse();
        const dayBars = [];
        const dayMax = Math.max(...days.map(d => month.dailyStats[d].total), 1);
        
        days.slice(0, 14).forEach(day => {
            const dayStat = month.dailyStats[day];
            const bar = getBar(dayStat.total, dayMax, 12);
            dayBars.push(`${day.slice(5)}: ${bar}${dayStat.total}`);
        });
        
        report += '\n📊 ' + dayBars.join('\n   ');
        
        return report;
    },
    
    sendMonthlyReport() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['maxBotToken', 'maxUserId'], (result) => {
                const userId = result.maxUserId || '';
                const botToken = result.maxBotToken || getMaxToken();
                
                if (!botToken || !userId) {
                    logger.log('🔧 MonthlyStats: MAX не настроен, userId=' + userId);
                    resolve({ success: false, error: 'MAX не настроен' });
                    return;
                }
                
                const monthKey = this.getMonthKey();
                const report = this.formatMonthlyReport(monthKey);
                
                if (!report) {
                    resolve({ success: false, error: 'Нет данных за месяц' });
                    return;
                }
                
                sendMaxMessage(botToken, userId, report).then(response => {
                    resolve(response);
                }).catch(err => {
                    resolve({ success: false, error: err.message });
                });
            });
        });
    }
};

monthlyStats.init();

chrome.runtime.onInstalled.addListener(() => {
    logger.log('🔧 1C Monitor: Extension installed');
    setupTelegramConnection();
    updateExtensionIcon();
});

// Загружаем подключение при старте
setupTelegramConnection();

// ============ TELEGRAM API ============

async function validateTelegramBot(token) {
    const startTime = performance.now();
    const apiUrl = getTelegramApiUrl();
    const url = `${apiUrl}***/getMe`;
    
    logger.log(`📤 Telegram validation → GET ${url}`);
    
    try {
        const response = await fetch(url);
        const elapsed = (performance.now() - startTime).toFixed(0);
        
        if (!response.ok) {
            logger.error(`❌ Telegram validation ← ${response.status} за ${elapsed}мс`);
            return { valid: false, error: 'Неверный токен или проблемы с сетью' };
        }
        const data = await response.json();
        
        if (data.ok && data.result) {
            logger.log(`✅ Telegram validation ← OK за ${elapsed}мс: ${data.result.first_name} (@${data.result.username})`);
            return { valid: true, botName: data.result.first_name, username: data.result.username };
        }
        logger.error(`❌ Telegram validation ← FAIL за ${elapsed}мс: ${data.description}`);
        return { valid: false, error: data.description || 'Неверный токен' };
    } catch (error) {
        const elapsed = (performance.now() - startTime).toFixed(0);
        logger.error(`❌ Telegram validation ← NETWORK ERROR за ${elapsed}мс: ${error.message}`);
        return { valid: false, error: 'Ошибка сети: ' + error.message };
    }
}

async function getTelegramUpdates(token) {
    const startTime = performance.now();
    const apiUrl = getTelegramApiUrl();
    const url = `${apiUrl}${token}/getUpdates`;
    
    logger.log(`📤 Telegram getUpdates → GET ${url.replace(token, '***')}`);
    
    try {
        const response = await fetch(url);
        const elapsed = (performance.now() - startTime).toFixed(0);
        
        if (!response.ok) {
            logger.error(`❌ Telegram getUpdates ← ${response.status} за ${elapsed}мс`);
            return { success: false, error: 'Ошибка сети' };
        }
        const data = await response.json();
        if (!data.ok) {
            logger.error(`❌ Telegram getUpdates ← FAIL за ${elapsed}мс: ${data.description}`);
            return { success: false, error: data.description };
        }
        
        const updates = data.result || [];
        for (let i = updates.length - 1; i >= 0; i--) {
            const msg = updates[i].message;
            if (msg && msg.text && msg.text.startsWith('/start')) {
                logger.log(`✅ Telegram getUpdates ← OK за ${elapsed}мс: chatId=${msg.chat.id}`);
                return { success: true, chatId: msg.chat.id.toString(), username: msg.chat.username || '' };
            }
        }
        logger.log(`⚠️ Telegram getUpdates ← OK за ${elapsed}мс, но /start не найден`);
        return { success: false, error: 'Не найдено сообщение /start. Отправьте /start боту.' };
    } catch (error) {
        const elapsed = (performance.now() - startTime).toFixed(0);
        logger.error(`❌ Telegram getUpdates ← NETWORK ERROR за ${elapsed}мс: ${error.message}`);
        return { success: false, error: 'Ошибка сети: ' + error.message };
    }
}

async function sendTelegramMessage(token, chatId, text) {
    const startTime = performance.now();
    const apiUrl = getTelegramApiUrl();
    const url = `${apiUrl}${token}/sendMessage`;
    
    logger.log(`📤 Telegram → POST ${url.replace(token, '***')}`);
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'HTML' })
        });
        
        const elapsed = (performance.now() - startTime).toFixed(0);
        
        if (!response.ok) {
            const err = await response.json();
            logger.error(`❌ Telegram ← ${response.status} за ${elapsed}мс: ${err.description}`);
            return { success: false, error: err.description || 'Ошибка отправки' };
        }
        const data = await response.json();
        
        if (data.ok) {
            const msgId = data.result?.message_id || '?';
            logger.log(`✅ Telegram ← OK за ${elapsed}мс, message_id: ${msgId}`);
            return { success: true };
        } else {
            logger.error(`❌ Telegram ← FAIL за ${elapsed}мс: ${data.description}`);
            return { success: false, error: data.description || 'Ошибка Telegram' };
        }
    } catch (error) {
        const elapsed = (performance.now() - startTime).toFixed(0);
        logger.error(`❌ Telegram ← NETWORK ERROR за ${elapsed}мс: ${error.message}`);
        return { success: false, error: 'Ошибка сети: ' + error.message };
    }
}

// ============ MAX API ============
async function getMaxBotInfo(botToken) {
    const startTime = performance.now();
    const API_URL = 'https://platform-api.max.ru';
    
    try {
        const response = await fetch(`${API_URL}/me`, {
            method: 'GET',
            headers: { 'Authorization': botToken }
        });
        
        const elapsed = (performance.now() - startTime).toFixed(0);
        
        if (!response.ok) {
            const err = await response.json();
            logger.error(`❌ MAX ← ${response.status} за ${elapsed}мс: ${err.message || err.error}`);
            return { valid: false, error: err.message || 'Ошибка' };
        }
        
        const data = await response.json();
        
        if (data.ok || data.user_id || data.is_bot) {
            logger.log(`✅ MAX ← OK за ${elapsed}мс`);
            return { 
                valid: true, 
                botName: data.name || data.first_name || 'Bot',
                username: data.username || ''
            };
        } else {
            logger.error(`❌ MAX ← FAIL за ${elapsed}мс: ${data.message}`);
            return { valid: false, error: data.message || 'Ошибка получения информации о боте' };
        }
    } catch (error) {
        const elapsed = (performance.now() - startTime).toFixed(0);
        logger.error(`❌ MAX ← NETWORK ERROR за ${elapsed}мс: ${error.message}`);
        return { valid: false, error: 'Ошибка сети: ' + error.message };
    }
}

async function sendMaxMessage(botToken, userId, text) {
    const startTime = performance.now();
    const API_URL = 'https://platform-api.max.ru';
    
    try {
        const response = await fetch(`${API_URL}/messages?user_id=${userId}`, {
            method: 'POST',
            headers: { 
                'Authorization': botToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: text })
        });
        
        const elapsed = (performance.now() - startTime).toFixed(0);
        
        if (!response.ok) {
            const err = await response.json();
            logger.error(`❌ MAX ← ${response.status} за ${elapsed}мс: ${err.message || err.error}`);
            return { success: false, error: err.message || 'Ошибка отправки' };
        }
        
        const data = await response.json();
        
        // Проверяем успешность разными способами
        if (data.ok || data.message_id || data.message || data.status === 'sent') {
            logger.log(`✅ MAX ← OK за ${elapsed}мс`);
            return { success: true };
        } else {
            const errorMsg = typeof data.message === 'object' ? JSON.stringify(data.message) : (data.error || data.message || 'Ошибка MAX');
            logger.log(`⚠️ MAX ← response: ${JSON.stringify(data)}`);
            // Даже при ошибке парсинга - считаем успехом если сообщение ушло
            return { success: true };
        }
    } catch (error) {
        const elapsed = (performance.now() - startTime).toFixed(0);
        logger.error(`❌ MAX ← NETWORK ERROR за ${elapsed}мс: ${error.message}`);
        return { success: false, error: 'Ошибка сети: ' + error.message };
    }
}

// ============ MESSAGE HANDLER ============
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    logger.log('🔧 Background: Received message:', message.type);
    
    try {
        switch (message.type) {
            case 'UPDATE_TELEGRAM_CONNECTION':
                telegramConnection = message.connection || {};
                
                if (telegramConnection.type === 'proxy' && telegramConnection.proxy?.host) {
                    applyProxy();
                } else {
                    clearProxy();
                }
                
                logger.log('🔧 Telegram connection updated:', telegramConnection.type);
                sendResponse({ success: true });
                return true;
                
            case 'UPDATE_MONITORING_STATE':
                logger.log('🔧 Background: Updating monitoring state:', message.state);
                if (message.state) {
                    monitoringState.isActive = message.state.isMonitoring || false;
                    monitoringState.classificationCount = message.state.count || 0;
                    monitoringState.groupCount = message.state.groupCount || 0;
                    monitoringState.telegramEnabled = message.state.telegramEnabled || false;
                    monitoringState.telegramConfigured = message.state.telegramConfigured || false;
                    updateExtensionIcon();
                }
                sendResponse({ success: true });
                break;
                
            case 'SHOW_NOTIFICATION':
                createNotification(message.title, message.message);
                sendResponse({ success: true });
                break;
                
            case 'TELEGRAM_STATUS_UPDATE':
                if (message.state) {
                    monitoringState.telegramEnabled = message.state.enabled || false;
                    monitoringState.telegramConfigured = message.state.configured || false;
                    updateExtensionIcon();
                }
                sendResponse({ success: true });
                break;
            
            // Telegram API — делегируем через background (content scripts не могут fetch внешние домены)
            case 'TELEGRAM_API_VALIDATE':
                validateTelegramBot(message.botToken).then(sendResponse);
                return true;
                
            case 'TELEGRAM_API_GET_UPDATES':
                getTelegramUpdates(message.botToken).then(sendResponse);
                return true;
                
            case 'TELEGRAM_API_SEND_MESSAGE':
                sendTelegramMessage(message.botToken, message.chatId, message.text).then(sendResponse);
                return true;
            
            // MAX API
            case 'MAX_API_GET_BOT_INFO':
                getMaxBotInfo(message.botToken).then(sendResponse);
                return true;
                
            case 'MAX_API_SEND_MESSAGE':
                sendMaxMessage(message.botToken, message.userId, message.text).then(sendResponse);
                return true;
            
            // Обновление счетчиков смены из content.js
            case 'SHIFT_UPDATE':
                if (message.counts) {
                    const counts = message.counts;
                    
                    const classificationNumbers = counts.classificationNumbers || [];
                    const groupNumbers = counts.groupNumbers || [];
                    
                    logger.log('🔧 SHIFT_UPDATE: class=' + classificationNumbers.length + ', group=' + groupNumbers.length);
                    
                    // Обрабатываем заявки с учетом источника
                    shiftTracker.processApplications(classificationNumbers, groupNumbers);
                    
                    logger.log('🔧 Background: Shift processed - classTotal: ' + shiftTracker.getCurrentShift().classificationTotal + ', groupTotal: ' + shiftTracker.getCurrentShift().groupTotal);
                }
                sendResponse({ success: true });
                break;
            
            // Получить текущую статистику смены
            case 'SHIFT_GET_STATS': {
                const shift = shiftTracker.getCurrentShift();
                sendResponse({ 
                    success: true, 
                    shift: shift,
                    // Всего было на классификации
                    classificationTotal: shift.classificationTotal || 0,
                    // Всего было в группе
                    groupTotal: shift.groupTotal || 0,
                    // Текущие на классификации
                    currentClassification: shift.currentClassificationCount || 0,
                    // Текущие в группах
                    currentGroup: shift.currentGroupCount || 0
                });
                return true;
            }
                
            // Принудительно отправить отчет (для тестирования)
            case 'SHIFT_SEND_REPORT':
                shiftTracker.sendDailyReport().then(result => {
                    sendResponse(result);
                });
                return true;
            
            // Отправить месячный отчет
            case 'SHIFT_SEND_MONTHLY_REPORT':
                monthlyStats.sendMonthlyReport().then(result => {
                    sendResponse(result);
                });
                return true;
            
            // Получить токен MAX для отправки отчета
            case 'SHIFT_TRACKER_GET_MAX_TOKEN':
                chrome.storage.local.get(['maxBotToken'], (result) => {
                    sendResponse({ 
                        success: true, 
                        token: result.maxBotToken || '' 
                    });
                });
                return true;
                
            default:
                logger.warn('🔧 Background: Unknown message type:', message.type);
                sendResponse({ success: false, error: 'Unknown message type' });
        }
    } catch (error) {
        logger.error('🔧 Background: Error processing message:', error);
        sendResponse({ success: false, error: error.message });
    }
    
    return true;
});

function updateExtensionIcon() {
    const totalCount = monitoringState.classificationCount + monitoringState.groupCount;
    
    logger.log('🔧 Background: Updating icon - Active:', monitoringState.isActive, 
                'Count:', totalCount);
    
    // Определяем цвет бейджа (иконка остается стандартной)
    let badgeText, badgeColor;
    
    if (!monitoringState.isActive) {
        // Мониторинг выключен
        badgeText = '●';
        badgeColor = [128, 128, 128, 255]; // Серый
    } else if (totalCount > 0) {
        // Есть заявки
        badgeText = totalCount > 99 ? '99+' : totalCount.toString();
        badgeColor = [249, 115, 22, 255]; // Оранжевый
    } else {
        // Мониторинг включен, заявок нет
        badgeText = '●';
        badgeColor = [34, 197, 94, 255]; // Зеленый
    }
    
    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({ color: badgeColor });
    
    // Обновляем title
    let title = '1C Монитор заявок';
    if (!monitoringState.isActive) {
        title += ' - ВЫКЛ';
    } else if (totalCount > 0) {
        title += ` - ${totalCount} заявок`;
    } else {
        title += ' - Активен';
    }
    
    if (monitoringState.telegramEnabled) {
        title += monitoringState.telegramConfigured ? ' | Telegram: ✅' : ' | Telegram: ⚠️';
    } else {
        title += ' | Telegram: ❌';
    }
    
    chrome.action.setTitle({ title: title });
}

function createNotification(title, message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon48.png'),
        title: title,
        message: message,
        priority: 2
    }, (notificationId) => {
        if (chrome.runtime.lastError) {
            logger.error('🔧 Notification error:', chrome.runtime.lastError);
        } else {
            logger.log('🔧 Desktop notification shown:', notificationId);
            setTimeout(() => chrome.notifications.clear(notificationId), 5000);
        }
    });
}

chrome.notifications.onClicked.addListener((notificationId) => {
    logger.log('🔧 Notification clicked:', notificationId);
    chrome.tabs.query({ url: TARGET_DOMAIN + '*' }, (tabs) => {
        if (tabs && tabs.length > 0) {
            chrome.tabs.update(tabs[0].id, { active: true });
        }
    });
});

chrome.alarms.create('periodicCheck', { periodInMinutes: 0.5 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'periodicCheck' && monitoringState.isActive) {
        logger.log('🔧 Background: Periodic check - Active:', monitoringState.isActive, 
                   'Counts:', monitoringState.classificationCount, monitoringState.groupCount,
                   'Telegram:', monitoringState.telegramEnabled);
    }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
    // Проверяем, что активированная вкладка относится к нашему домену
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (chrome.runtime.lastError) return;
        if (tab && tab.url && tab.url.startsWith(TARGET_DOMAIN)) {
            debouncedUpdateIcon();
        }
    });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith(TARGET_DOMAIN)) {
        debouncedUpdateIcon();
    }
});

// Горячие клавиши
chrome.commands.onCommand.addListener((command) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || !tabs[0]) return;
        chrome.tabs.sendMessage(tabs[0].id, { type: 'KEYBOARD_COMMAND', command }, (response) => {
            if (chrome.runtime.lastError) {
                // Content script not ready, try popup
                chrome.runtime.sendMessage({ type: 'KEYBOARD_COMMAND', command });
            }
        });
    });
});
