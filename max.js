logger.logModuleLoad('max.js');
// Конфигурация MAX (VK Teams)
const MAX_CONFIG = {
    API_URL: 'https://platform-api.max.ru',
    MAX_MESSAGE_LENGTH: 4096,
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    RATE_LIMIT: 1000,
    
    // Токен бота MAX
    BOT_TOKEN: 'f9LHodD0cOIsuFM7s3BgTcIw2zTV3ZfC7UFn0NPNy7Xb8nBln-UvBnSNASjw-5w671OMv0G7QUsKJoLTGr-A'
};

// Глобальные утилиты
const maxUtils = {
    getNumberWord(num) {
        return window.utils.getNumberWord(num);
    },
    
    getCaseWord(num, forms) {
        return window.utils.getCaseWord(num, forms);
    },
    
    formatTime(date = new Date()) {
        return window.utils.formatTime(date);
    }
};

// Хранилище
const maxStorage = {
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
    
    async remove(keys) {
        return new Promise(resolve => {
            chrome.storage.local.remove(keys, resolve);
        });
    }
};

// Модуль для работы с MAX
const max = {
    // Состояние
    enabled: false,
    botToken: '',
    userId: '',
    messageTemplate: '🔔 В {time} обнаружено {count} новых заявок на {type}',
    groupMessageTemplate: '👥 В {time} обнаружено {count} задач в группах',
    sendImmediately: true,
    lastSendTime: 0,
    pendingNotifications: [],
    isSending: false,
    botInfo: null,

    // Инициализация
    async init() {
        try {
            this.botToken = MAX_CONFIG.BOT_TOKEN;
            
            const data = await maxStorage.get([
                'maxEnabled',
                'maxUserId',
                'maxMessageTemplate',
                'maxGroupMessageTemplate',
                'maxSendImmediately'
            ]);

            this.userId = data.maxUserId || '';
            this.enabled = data.maxEnabled === true;
            this.messageTemplate = data.maxMessageTemplate || '🔔 В {time} обнаружено {count} новых заявок на {type}';
            this.groupMessageTemplate = data.maxGroupMessageTemplate || '👥 В {time} обнаружено {count} задач в группах';
            this.sendImmediately = data.maxSendImmediately !== false; // По умолчанию true

            logger.log(`🔧 MAX module initialized: userId=${this.userId ? 'установлен' : 'не задан'}`);
            
            // Валидация бота
            if (this.botToken) {
                this.validateAndGetBotInfo().then(result => {
                    if (result.valid) {
                        logger.log(`🔧 MAX bot validated: ${result.botName}`);
                    }
                }).catch(err => {
                    logger.warn('🔧 MAX validation failed:', err.message);
                });
            }
            
            this.processPendingNotifications().catch(err => {
                logger.warn('🔧 MAX pending notifications error:', err.message);
            });
            
        } catch (error) {
            logger.error('🔧 MAX init error:', error);
        }
    },

    // Проверка токена и получение информации о боте
    async validateAndGetBotInfo() {
        if (!this.botToken || this.botToken.length < 10) {
            this.botInfo = null;
            return { valid: false, error: 'Токен слишком короткий' };
        }

        try {
            const result = await new Promise(resolve => {
                chrome.runtime.sendMessage(
                    { type: 'MAX_API_GET_BOT_INFO', botToken: this.botToken },
                    resolve
                );
            });

            if (result && result.valid) {
                this.botInfo = result;
                logger.log(`🔧 MAX bot info: ${result.botName}`);
                return { valid: true, botName: result.botName };
            } else {
                this.botInfo = null;
                return { valid: false, error: result?.error || 'Неверный токен' };
            }
        } catch (error) {
            logger.error('🔧 MAX token validation error:', error);
            this.botInfo = null;
            return { valid: false, error: 'Ошибка сети: ' + error.message };
        }
    },

    // Проверка доступа к пользователю
    async testUserAccess() {
        if (!this.botToken || !this.userId) {
            return { success: false, error: 'Токен или User ID не настроены' };
        }

        try {
            const result = await new Promise(resolve => {
                chrome.runtime.sendMessage({
                    type: 'MAX_API_SEND_MESSAGE',
                    botToken: this.botToken,
                    userId: this.userId,
                    text: '🔍 Проверка доступа...'
                }, resolve);
            });

            if (result && result.success) {
                return { success: true, message: 'Доступ подтвержден' };
            } else {
                let errorMessage = result?.error || 'Неизвестная ошибка';
                if (errorMessage.includes('user not found')) {
                    errorMessage = 'Пользователь не найден. Проверьте User ID.';
                } else if (errorMessage.includes(' forbidden')) {
                    errorMessage = 'Нет доступа к пользователю.';
                }
                return { success: false, error: errorMessage };
            }
        } catch (error) {
            return { success: false, error: 'Ошибка сети: ' + error.message };
        }
    },

    // Отправка сообщения
    async sendMessage(text, options = {}) {
        if (!this.enabled || !this.botToken || !this.userId) {
            logger.log('🔧 MAX: Not configured');
            return { success: false, error: 'MAX не настроен' };
        }

        if (text.length > MAX_CONFIG.MAX_MESSAGE_LENGTH) {
            text = text.substring(0, MAX_CONFIG.MAX_MESSAGE_LENGTH - 3) + '...';
        }

        const now = Date.now();
        const timeSinceLastSend = now - this.lastSendTime;
        if (timeSinceLastSend < MAX_CONFIG.RATE_LIMIT) {
            await new Promise(resolve => 
                setTimeout(resolve, MAX_CONFIG.RATE_LIMIT - timeSinceLastSend)
            );
        }

        try {
            const result = await new Promise(resolve => {
                chrome.runtime.sendMessage({
                    type: 'MAX_API_SEND_MESSAGE',
                    botToken: this.botToken,
                    userId: this.userId,
                    text: text
                }, resolve);
            });

            if (result && result.success) {
                this.lastSendTime = Date.now();
                logger.log('🔧 MAX: Message sent successfully');
                return { success: true, userId: this.userId };
            } else {
                let errorMessage = result?.error || 'Неизвестная ошибка';
                if (errorMessage.includes('user not found')) {
                    errorMessage = 'Пользователь не найден. Проверьте User ID.';
                }
                return { success: false, error: errorMessage };
            }
        } catch (error) {
            return { success: false, error: 'Ошибка сети: ' + error.message };
        }
    },

    formatClassificationMessage(count, numbers = []) {
        logger.log(`🔧 MAX: formatClassificationMessage called, count=${count}`);
        
        const time = maxUtils.formatTime();
        
        // Если заявок нет
        if (count <= 0) {
            return `🔔 В ${time} нет новых заявок на классификацию`;
        }

        const typeWord = maxUtils.getCaseWord(count, ['классификацию', 'классификации', 'классификаций']);
        const appWord = maxUtils.getCaseWord(count, ['заявка', 'заявки', 'заявок']);
        
        // Числительное: одна/две/три/четыре или число
        const numWords = {
            1: 'одна',
            2: 'две',
            3: 'три',
            4: 'четыре',
            5: 'пять',
            6: 'шесть',
            7: 'семь',
            8: 'восемь',
            9: 'девять',
            10: 'десять'
        };
        const countWord = numWords[count] || count.toString();
        
        // Склонение глагола "обнаружен"
        // одна заявка - обнаруженА (женский род)
        // две/три/четыре заявки - обнаруженЫ (множественное число)
        // пять/шесть... заявок - обнаруженО (средний род/число)
        const verbForm = count === 1 ? 'обнаружена' : (count > 1 && count < 5 ? 'обнаружены' : 'обнаружено');
        
        let message = `🔔 В ${time} ${verbForm} ${countWord} ${appWord} на ${typeWord}`;
        
        if (numbers.length > 0) {
            const numbersText = numbers.slice(0, 10).join(', ');
            message += `\n📋 Номера: ${numbersText}`;
            if (numbers.length > 10) {
                message += ` и ещё ${numbers.length - 10}`;
            }
        }
        
        return message;
    },

    formatGroupMessage(count, numbers = []) {
        const time = maxUtils.formatTime();
        
        const taskWord = maxUtils.getCaseWord(count, ['задача', 'задачи', 'задач']);
        
        // Числительное: одна/две/три/четыре или число
        const numWords = {
            1: 'одна',
            2: 'две',
            3: 'три',
            4: 'четыре',
            5: 'пять',
            6: 'шесть',
            7: 'семь',
            8: 'восемь',
            9: 'девять',
            10: 'десять'
        };
        const countWord = numWords[count] || count.toString();
        
        // Склонение глагола "обнаружен"
        // одна задача - обнаруженА (женский род)
        // две/три/четыре задачи - обнаруженЫ (множественное число)
        // пять/шесть... задач - обнаруженО (средний род/число)
        const verbForm = count === 1 ? 'обнаружена' : (count > 1 && count < 5 ? 'обнаружены' : 'обнаружено');
        
        let message = `👥 В ${time} ${verbForm} ${countWord} ${taskWord} в моих группах`;
        
        if (numbers.length > 0) {
            message += `\n📋 Номера: ${numbers.slice(0, 10).join(', ')}`;
            if (numbers.length > 10) message += ` и ещё ${numbers.length - 10}`;
        }
        
        return message;
    },

    // Отправка уведомления о классификации
    async sendClassificationAlert(count, numbers = []) {
        if (!this.enabled || count <= 0) {
            return { success: false, reason: 'not_enabled_or_no_count' };
        }

        if (!this.sendImmediately) {
            logger.log('🔧 MAX: Not sending immediately - added to queue');
            this.addToQueue('classification', count, numbers);
            return { success: true, queued: true };
        }

        logger.log(`🔧 MAX: Sending classification alert (count=${count})`);
        const message = this.formatClassificationMessage(count, numbers);
        const result = await this.sendMessage(message);
        
        logger.log(`🔧 MAX: sendClassificationAlert result:`, result);
        return result;
    },

    // Отправка уведомления о группах
    async sendGroupAlert(count) {
        if (!this.enabled || count <= 0 || !this.sendImmediately) {
            return { success: false, reason: 'not_enabled_or_immediate' };
        }

        const message = this.formatGroupMessage(count);
        return await this.sendMessage(message);
    },

    // Добавление уведомления в очередь
    addToQueue(type, count, numbers = []) {
        if (!this.enabled) return;

        let formattedMessage;
        
        switch(type) {
            case 'classification':
                formattedMessage = `📄 Классификация: ${count} заявка(и)\n📋 Номера: ${numbers.slice(0, 10).join(', ')}`;
                if (numbers.length > 10) formattedMessage += ` и ещё ${numbers.length - 10}`;
                break;
            case 'group':
                formattedMessage = `👥Задач в моей группе: ${count} \n📋 Номера: ${numbers.slice(0, 10).join(', ')}`;
                if (numbers.length > 10) formattedMessage += ` и ещё ${numbers.length - 10}`;
                break;
            default:
                return;
        }

        this.pendingNotifications.push({
            type: type,
            message: formattedMessage,
            timestamp: Date.now()
        });

        logger.log(`🔧 MAX: Added to queue, total: ${this.pendingNotifications.length}`);
    },

    // Обработка очереди уведомлений
    async processPendingNotifications() {
        if (!this.enabled || this.pendingNotifications.length === 0 || this.isSending) {
            return;
        }

        this.isSending = true;
        
        try {
            const notification = this.pendingNotifications.shift();
            const result = await this.sendMessage(notification.message);
            
            if (result.success) {
                logger.log(`🔧 MAX: Queued notification sent`);
            } else {
                logger.warn(`🔧 MAX: Failed to send queued notification:`, result.error);
            }
        } catch (error) {
            logger.error('🔧 MAX: Error processing queue:', error);
        } finally {
            this.isSending = false;
        }
    },

    // Отправка тестового сообщения
    async sendTestMessage() {
        if (!this.enabled || !this.botToken || !this.userId) {
            return { success: false, error: 'MAX не настроен' };
        }

        const time = new Date().toLocaleTimeString('ru-RU');
        const message = `✅ Тестовое сообщение от 1C Монитора\n\nЭто тест. Если вы видите это сообщение — настройки верны!\n⏰ Время: ${time}`;
        
        return await this.sendMessage(message);
    },

    // Сохранение настроек
    async saveSettings(settings) {
        try {
            const toSave = {};
            
            if (settings.enabled !== undefined) {
                toSave.maxEnabled = settings.enabled;
                this.enabled = settings.enabled;
            }
            
            if (settings.userId !== undefined) {
                toSave.maxUserId = settings.userId;
                this.userId = settings.userId;
            }
            
            if (settings.messageTemplate !== undefined) {
                toSave.maxMessageTemplate = settings.messageTemplate;
                this.messageTemplate = settings.messageTemplate;
            }
            
            if (settings.groupMessageTemplate !== undefined) {
                toSave.maxGroupMessageTemplate = settings.groupMessageTemplate;
                this.groupMessageTemplate = settings.groupMessageTemplate;
            }
            
            if (settings.sendImmediately !== undefined) {
                toSave.maxSendImmediately = settings.sendImmediately;
                this.sendImmediately = settings.sendImmediately;
            }
            
            if (Object.keys(toSave).length > 0) {
                await maxStorage.set(toSave);
            }
            
            logger.log('🔧 MAX settings saved:', toSave);
            return { success: true };
        } catch (error) {
            logger.error('🔧 MAX save settings error:', error);
            return { success: false, error: error.message };
        }
    },

    // Получение текущих настроек
    getSettings() {
        return {
            enabled: this.enabled,
            botToken: this.botToken,
            userId: this.userId,
            messageTemplate: this.messageTemplate,
            groupMessageTemplate: this.groupMessageTemplate,
            sendImmediately: this.sendImmediately,
            isConfigured: !!this.botToken && !!this.userId,
            pendingNotifications: this.pendingNotifications.length,
            botInfo: this.botInfo ? {
                name: this.botInfo.first_name,
                username: this.botInfo.username
            } : null
        };
    },

    // Очистка настроек
    async clearSettings() {
        try {
            await maxStorage.remove([
                'maxEnabled',
                'maxUserId',
                'maxMessageTemplate',
                'maxGroupMessageTemplate',
                'maxSendImmediately'
            ]);
            
            this.enabled = false;
            this.userId = '';
            this.botInfo = null;
            this.pendingNotifications = [];
            
            logger.log('🔧 MAX settings cleared');
            return { success: true };
        } catch (error) {
            logger.error('🔧 MAX clear settings error:', error);
            return { success: false, error: error.message };
        }
    }
};

// Экспорт модуля
window.maxModule = max;
