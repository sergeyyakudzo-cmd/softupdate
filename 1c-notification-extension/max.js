logger.logModuleLoad('max.js');
const MAX_CONFIG = {
    API_URL: 'https://platform-api.max.ru',
    MAX_MESSAGE_LENGTH: 4096,
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    RATE_LIMIT: 1000,
    // BOT_TOKEN intentionally empty in content scripts (window.CONFIG.MAX = {} for security).
    // Actual token is loaded from chrome.storage.local in init()
    BOT_TOKEN: ''
};

const maxUtils = {
    /** @param {number} num @returns {string} */
    getNumberWord(num) {
        return window.utils.getNumberWord(num);
    },
    
    /** @param {number} num @param {[string, string, string]} forms @returns {string} */
    getCaseWord(num, forms) {
        return window.utils.getCaseWord(num, forms);
    },
    
    /** @param {Date} [date] @returns {string} */
    formatTime(date = new Date()) {
        return window.utils.formatTime(date);
    }
};

/** @type {{get: (keys: string | string[] | Record<string, unknown> | null) => Promise<Record<string, unknown>>, set: (data: Record<string, unknown>) => Promise<void>, remove: (keys: string | string[]) => Promise<void>}} */
const maxStorage = window.storageUtils;

const max = {
    enabled: false,
    botToken: '',
    userId: '',
    messageTemplate: SHARED_CONSTANTS?.MAX?.DEFAULT_TEMPLATE || '🔔 В {time} обнаружено {count} новых заявок на {type}',
    groupMessageTemplate: SHARED_CONSTANTS?.MAX?.DEFAULT_GROUP_TEMPLATE || '👥 В {time} обнаружено {count} задач в группах',
    sendImmediately: true,
    lastSendTime: 0,
    /** @type {{type?: string, message: string, timestamp: number}[]} */
    pendingNotifications: [],
    isSending: false,
    /** @type {{valid?: boolean, botName?: string, username?: string} | null} */
    botInfo: null,

    /** @returns {Promise<void>} */
    async init() {
        try {
            const data = await maxStorage.get([
                'maxEnabled',
                'maxUserId',
                'maxBotToken',
                'maxMessageTemplate',
                'maxGroupMessageTemplate',
                'maxSendImmediately'
            ]);

            this.userId = /** @type {string} */(data.maxUserId) || '';
            this.botToken = /** @type {string} */(data.maxBotToken) || this.botToken;
            this.enabled = data.maxEnabled === true;
            this.messageTemplate = /** @type {string} */(data.maxMessageTemplate) || SHARED_CONSTANTS?.MAX?.DEFAULT_TEMPLATE || '🔔 В {time} обнаружено {count} новых заявок на {type}';
            this.groupMessageTemplate = /** @type {string} */(data.maxGroupMessageTemplate) || SHARED_CONSTANTS?.MAX?.DEFAULT_GROUP_TEMPLATE || '👥 В {time} обнаружено {count} задач в группах';
            this.sendImmediately = data.maxSendImmediately !== false;

            logger.log(`🔧 MAX module initialized: userId=${this.userId ? 'установлен' : 'не задан'}`);
            
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

    /** @returns {Promise<{valid: boolean, botName?: string, error?: string}>} */
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
            return { valid: false, error: 'Ошибка сети: ' + /** @type {Error} */(error).message };
        }
    },

    /** @returns {Promise<{success: boolean, message?: string, error?: string}>} */
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
            return { success: false, error: 'Ошибка сети: ' + /** @type {Error} */(error).message };
        }
    },

    /** @param {string} text @param {Record<string, unknown>} [options] @returns {Promise<{success: boolean, error?: string, userId?: string}>} */
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
            return { success: false, error: 'Ошибка сети: ' + /** @type {Error} */(error).message };
        }
    },

    /** @param {number} count @param {string[]} [numbers] @returns {string} */
    formatClassificationMessage(count, numbers = []) {
        logger.log(`🔧 MAX: formatClassificationMessage called, count=${count}`);
        
        const time = maxUtils.formatTime();
        
        if (count <= 0) {
            return `🔔 В ${time} нет новых заявок на классификацию`;
        }

        const typeWord = maxUtils.getCaseWord(count, ['классификацию', 'классификации', 'классификаций']);
        const appWord = maxUtils.getCaseWord(count, ['заявка', 'заявки', 'заявок']);
        
        /** @type {Record<number, string>} */
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

    /** @param {number} count @param {string[]} [numbers] @returns {string} */
    formatGroupMessage(count, numbers = []) {
        const time = maxUtils.formatTime();
        
        const taskWord = maxUtils.getCaseWord(count, ['задача', 'задачи', 'задач']);
        
        /** @type {Record<number, string>} */
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
        
        const verbForm = count === 1 ? 'обнаружена' : (count > 1 && count < 5 ? 'обнаружены' : 'обнаружено');
        
        let message = `👥 В ${time} ${verbForm} ${countWord} ${taskWord} в моих группах`;
        
        if (numbers.length > 0) {
            message += `\n📋 Номера: ${numbers.slice(0, 10).join(', ')}`;
            if (numbers.length > 10) message += ` и ещё ${numbers.length - 10}`;
        }
        
        return message;
    },

    /** @param {number} count @param {string[]} [numbers] @returns {Promise<{success: boolean, queued?: boolean, reason?: string}>} */
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

    /** @param {number} count @param {string[]} [numbers] @returns {Promise<{success: boolean, reason?: string, queued?: boolean}>} */
    async sendGroupAlert(count, numbers = []) {
        if (!this.enabled || count <= 0) {
            return { success: false, reason: 'not_enabled_or_no_count' };
        }

        if (!this.sendImmediately) {
            logger.log('🔧 MAX: Not sending group alert immediately - added to queue');
            this.addToQueue('group', count, numbers);
            return { success: true, queued: true };
        }

        const message = this.formatGroupMessage(count, numbers);
        return await this.sendMessage(message);
    },

    /** @param {string} type @param {number} count @param {string[]} [numbers] */
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
            if (!notification) return;
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

    /** @param {Record<string, unknown>} settings @returns {Promise<{success: boolean, error?: string}>} */
    async saveSettings(settings) {
        try {
            /** @type {Record<string, unknown>} */
            const toSave = {};
            
            if (settings.enabled !== undefined) {
                toSave.maxEnabled = settings.enabled;
                this.enabled = /** @type {boolean} */ (settings.enabled);
            }
            
            if (settings.userId !== undefined) {
                toSave.maxUserId = settings.userId;
                this.userId = /** @type {string} */ (settings.userId);
            }
            
            if (settings.messageTemplate !== undefined) {
                toSave.maxMessageTemplate = settings.messageTemplate;
                this.messageTemplate = /** @type {string} */ (settings.messageTemplate);
            }
            
            if (settings.groupMessageTemplate !== undefined) {
                toSave.maxGroupMessageTemplate = settings.groupMessageTemplate;
                this.groupMessageTemplate = /** @type {string} */ (settings.groupMessageTemplate);
            }
            
            if (settings.sendImmediately !== undefined) {
                toSave.maxSendImmediately = settings.sendImmediately;
                this.sendImmediately = /** @type {boolean} */ (settings.sendImmediately);
            }
            
            if (Object.keys(toSave).length > 0) {
                await maxStorage.set(toSave);
            }
            
            logger.log('🔧 MAX settings saved:', toSave);
            return { success: true };
        } catch (error) {
            logger.error('🔧 MAX save settings error:', error);
            return { success: false, error: /** @type {Error} */ (error).message };
        }
    },

    /** @returns {{ enabled: boolean, botToken: string, userId: string, messageTemplate: string, groupMessageTemplate: string, sendImmediately: boolean, isConfigured: boolean, pendingNotifications: number, botInfo: ({ name: string, username: string }) | null }} */
    getSettings() {
        return {
            enabled: this.enabled,
            botToken: '',
            userId: this.userId,
            messageTemplate: this.messageTemplate,
            groupMessageTemplate: this.groupMessageTemplate,
            sendImmediately: this.sendImmediately,
            isConfigured: !!this.botToken && !!this.userId,
            pendingNotifications: this.pendingNotifications.length,
            botInfo: this.botInfo ? {
                name: /** @type {string} */ (this.botInfo.botName),
                username: /** @type {string} */ (this.botInfo.username)
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
            return { success: false, error: /** @type {Error} */ (error).message };
        }
    }
};

// Экспорт модуля
window.maxModule = max;
