logger.logModuleLoad('telegram.js');
// Конфигурация Telegram (используем прямые значения)
const TELEGRAM_CONFIG = {
    // Прямые значения
    API_URL: 'https://tg1cproxy.netlify.app/.netlify/functions/telegram/bot',
    MAX_MESSAGE_LENGTH: 4096,
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    RATE_LIMIT: 1000,
    MAX_UPDATES_RETENTION: 100,
    
    // Вшитые настройки бота (оставляем как есть)
    BOT_TOKEN: '8542040998:AAGuwymgAEPeB43PoHFNPyJPJxG-EzntzaI'
    // CHAT_ID теперь вводится пользователем в расширении
};

// Глобальные утилиты (используем общие из utils.js)
const telegramUtils = {
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
const telegramStorage = {
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

// Модуль для работы с Telegram
const telegram = {
    // Состояние
    enabled: false,
    botToken: '',
    chatId: '',
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
            // Используем вшитый токен
            this.botToken = TELEGRAM_CONFIG.BOT_TOKEN;
            
            // Читаем настройки из storage
            const data = await telegramStorage.get([
                'telegramEnabled',
                'telegramChatId',
                'telegramMessageTemplate',
                'telegramGroupMessageTemplate',
                'telegramSendImmediately'
            ]);

            // chat_id теперь вводится пользователем
            this.chatId = data.telegramChatId || '';
            this.enabled = data.telegramEnabled === true;
            this.messageTemplate = data.telegramMessageTemplate || '🔔 В {time} обнаружено {count} новых заявок на {type}';
            this.groupMessageTemplate = data.telegramGroupMessageTemplate || '👥 В {time} обнаружено {count} задач в группах';
            this.sendImmediately = data.telegramSendImmediately !== false;

            logger.log(`🔧 Telegram module initialized: chatId=${this.chatId ? 'установлен' : 'не задан'}`);
            
            // Валидация бота — НЕ блокирует инициализацию, запускается в фоне
            if (this.botToken) {
                this.validateAndGetBotInfo().then(result => {
                    if (result.valid) {
                        logger.log(`🔧 Telegram bot validated: ${result.botName} (@${result.username})`);
                    }
                }).catch(err => {
                    logger.warn('🔧 Telegram background validation failed:', err.message);
                });
            }
            
            // Обработка отложенных уведомлений — НЕ блокирует, запускается в фоне
            this.processPendingNotifications().catch(err => {
                logger.warn('🔧 Telegram pending notifications error:', err.message);
            });
            
        } catch (error) {
            logger.error('🔧 Telegram init error:', error);
        }
    },

    // Проверка токена и получение информации о боте
    async validateAndGetBotInfo() {
        if (!this.botToken || this.botToken.length < 10) {
            this.botInfo = null;
            return { valid: false, error: 'Токен слишком короткий' };
        }

        try {
            // Делегируем background, т.к. content script не может fetch внешние домены
            const result = await new Promise(resolve => {
                chrome.runtime.sendMessage(
                    { type: 'TELEGRAM_API_VALIDATE', botToken: this.botToken },
                    resolve
                );
            });

            if (result && result.valid) {
                this.botInfo = result;
                logger.log(`🔧 Telegram bot info: ${result.botName} (@${result.username})`);
                return { valid: true, botName: result.botName, username: result.username };
            } else {
                this.botInfo = null;
                return { valid: false, error: result?.error || 'Неверный токен' };
            }
        } catch (error) {
            logger.error('🔧 Telegram token validation error:', error);
            this.botInfo = null;
            return { valid: false, error: 'Ошибка сети: ' + error.message };
        }
    },

    // Получение Chat ID через команду /start (делегирование в background)
    async getChatId() {
        if (!this.botToken) {
            return { success: false, error: 'Токен не указан' };
        }

        try {
            // Делегируем background, т.к. content script не может fetch внешние домены
            const result = await new Promise(resolve => {
                chrome.runtime.sendMessage(
                    { type: 'TELEGRAM_API_GET_UPDATES', botToken: this.botToken },
                    resolve
                );
            });

            if (result && result.success) {
                this.chatId = result.chatId.toString();
                return { success: true, chatId: this.chatId, message: 'Chat ID успешно получен!' };
            } else {
                return { success: false, error: result?.error || 'Ошибка получения Chat ID' };
            }
        } catch (error) {
            return { success: false, error: 'Ошибка сети: ' + error.message };
        }
    },

    // Очистка обновлений (делегирование в background)
    async clearUpdates() {
        // Background уже обрабатывает это в getTelegramUpdates
        logger.log('🔧 Telegram updates clearing delegated to background');
    },

    // Проверка доступа к чату (делегирование в background)
    async testChatAccess() {
        if (!this.botToken || !this.chatId) {
            return { success: false, error: 'Токен или Chat ID не настроены' };
        }

        try {
            const result = await new Promise(resolve => {
                chrome.runtime.sendMessage({
                    type: 'TELEGRAM_API_SEND_MESSAGE',
                    botToken: this.botToken,
                    chatId: this.chatId,
                    text: '🔍 Проверка доступа...'
                }, resolve);
            });

            if (result && result.success) {
                return { success: true, message: 'Доступ к чату подтвержден' };
            } else {
                let errorMessage = result?.error || 'Неизвестная ошибка';
                if (errorMessage.includes('chat not found')) {
                    errorMessage = 'Чат не найден. Убедитесь, что бот добавлен в чат/канал.';
                } else if (errorMessage.includes('bot was blocked')) {
                    errorMessage = 'Бот заблокирован. Разблокируйте бота в Telegram.';
                } else if (errorMessage.includes('have no rights')) {
                    errorMessage = 'У бота нет прав на отправку сообщений.';
                }
                return { success: false, error: errorMessage };
            }
        } catch (error) {
            return { success: false, error: 'Ошибка сети: ' + error.message };
        }
    },

    // Отправка сообщения (делегирование в background)
    async sendMessage(text, options = {}) {
        if (!this.enabled || !this.botToken || !this.chatId) {
            logger.log('🔧 Telegram: Not configured');
            return { success: false, error: 'Telegram не настроен' };
        }

        // Проверка длины сообщения
        if (text.length > TELEGRAM_CONFIG.MAX_MESSAGE_LENGTH) {
            text = text.substring(0, TELEGRAM_CONFIG.MAX_MESSAGE_LENGTH - 3) + '...';
        }

        // Соблюдение rate limit
        const now = Date.now();
        const timeSinceLastSend = now - this.lastSendTime;
        if (timeSinceLastSend < TELEGRAM_CONFIG.RATE_LIMIT) {
            await new Promise(resolve => 
                setTimeout(resolve, TELEGRAM_CONFIG.RATE_LIMIT - timeSinceLastSend)
            );
        }

        // Делегируем в background, т.к. content script не может fetch внешние домены
        try {
            const result = await new Promise(resolve => {
                chrome.runtime.sendMessage({
                    type: 'TELEGRAM_API_SEND_MESSAGE',
                    botToken: this.botToken,
                    chatId: this.chatId,
                    text: text
                }, resolve);
            });

            if (result && result.success) {
                this.lastSendTime = Date.now();
                logger.log('🔧 Telegram: Message sent successfully');
                return { success: true, chatId: this.chatId };
            } else {
                let errorMessage = result?.error || 'Неизвестная ошибка';
                if (errorMessage.includes('chat not found')) {
                    errorMessage = 'Чат не найден. Проверьте Chat ID и права бота.';
                    this.chatId = '';
                    await telegramStorage.set({ telegramChatId: '' });
                } else if (errorMessage.includes('bot was blocked')) {
                    errorMessage = 'Бот заблокирован пользователем.';
                }
                return { success: false, error: errorMessage };
            }
        } catch (error) {
            return { success: false, error: 'Ошибка сети: ' + error.message };
        }
    },

    formatClassificationMessage(count, numbers = []) {
    logger.log(`🔧 Telegram: formatClassificationMessage called, count=${count}, numbers=${JSON.stringify(numbers)}`);
    
    const time = telegramUtils.formatTime();
    
 // === ДОБАВЬТЕ ЭТО В НАЧАЛЕ ФУНКЦИИ ===
    // Если заявок нет
    if (count <= 0) {
        logger.log(`🔧 Telegram: count <= 0, returning empty message`);
        return `🔔 В ${time} нет новых заявок на классификацию`;
    }
    // === КОНЕЦ ДОБАВЛЕНИЯ ===

    const typeWord = telegramUtils.getCaseWord(count, ['классификацию', 'классификации', 'классификаций']);
    const countWord = count === 1 ? 'одна' : count.toString();
    
    logger.log(`🔧 Telegram: typeWord=${typeWord}, countWord=${countWord}`);
    
    let message = this.messageTemplate
        .replace('{time}', time)
        .replace('{count}', countWord)
        .replace('{type}', typeWord);
    
    logger.log(`🔧 Telegram: message template result: "${message}"`);
    
    // Добавляем номера задач, если есть
    if (numbers.length > 0) {
        const numbersText = numbers.slice(0, 10).join(', ');
        message += `\n📋 Номера: ${numbersText}`;
        if (numbers.length > 10) {
            message += ` и ещё ${numbers.length - 10}`;
        }
        logger.log(`🔧 Telegram: added numbers, final message length: ${message.length}`);
    }
    
    logger.log(`🔧 Telegram: final message: "${message}"`);
    return message;
},


formatGroupMessage(count, numbers = []) {
    const time = telegramUtils.formatTime();
    
    const countWord = count === 1 ? 'одна' : count.toString();
    
    let message = this.groupMessageTemplate
        .replace('{time}', time)
        .replace('{count}', countWord);
    
    // Добавляем номера задач, если есть
    if (numbers.length > 0) {
        message += `\n📋 Номера: ${numbers.slice(0, 10).join(', ')}`;
        if (numbers.length > 10) {
            message += ` и ещё ${numbers.length - 10}`;
        }
    }
    
    return message;
},

    async sendClassificationAlert(count, numbers = []) {
    logger.log(`🔧 Telegram: sendClassificationAlert START, count=${count}, numbers=${JSON.stringify(numbers)}`);
    
    if (!this.enabled) {
        logger.log('🔧 Telegram: Not sending - Telegram disabled');
        return { success: false, reason: 'disabled' };
    }
    
    if (!this.sendImmediately) {
        logger.log('🔧 Telegram: Not sending immediately - added to queue');
        this.addToQueue('classification', count, numbers);
        return { success: true, queued: true };
    }
    
    // Даже если count = 0, отправляем сообщение
    logger.log(`🔧 Telegram: Sending classification alert (count=${count})`);
    const message = this.formatClassificationMessage(count, numbers);
    const result = await this.sendMessage(message);
    
    logger.log(`🔧 Telegram: sendClassificationAlert result:`, result);
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

// Форматирование для уникальных заявок
formatUniqueMessage(count, numbers = []) {
    const time = telegramUtils.formatTime();
    
    const countWord = count === 1 ? 'одна' : count.toString();
    const form = telegramUtils.getCaseWord(count, ['заявка', 'заявки', 'заявок']);
    
    let message = `🔔 В ${time} обнаружено ${countWord} уникальных ${form}`;
    
    // Добавляем номера заявок, если есть
    if (numbers.length > 0) {
        message += `\n📋 Номера: ${numbers.slice(0, 10).join(', ')}`;
        if (numbers.length > 10) {
            message += ` и ещё ${numbers.length - 10}`;
        }
    }
    
    return message;
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
            formattedMessage = this.formatUniqueMessage(count, numbers);
    }

    this.pendingNotifications.push({
        type,
        count,
        numbers: numbers || [],
        timestamp: Date.now(),
        formatted: formattedMessage
    });

    logger.log(`🔧 Telegram: Added ${type} to queue (${count} items)`);
    
    if (this.sendImmediately) {
        this.processPendingNotifications();
    }
},

    // Обработка отложенных уведомлений — НЕ блокирует main thread
    async processPendingNotifications() {
        if (this.isSending || this.pendingNotifications.length === 0) {
            return;
        }

        this.isSending = true;

        // Обрабатываем асинхронно, не блокируя main thread
        const processNext = async () => {
            if (this.pendingNotifications.length === 0) {
                this.isSending = false;
                return;
            }

            const notification = this.pendingNotifications.shift();
            
            try {
                const result = await this.sendMessage(notification.formatted, {
                    silent: false
                });

                if (!result.success) {
                    logger.warn('🔧 Telegram: Failed to send notification:', result.error);
                    
                    // Если фатальная ошибка, прекращаем отправку
                    if (result.fatal) {
                        logger.error('🔧 Telegram: Fatal error, stopping notifications');
                        this.enabled = false;
                        await telegramStorage.set({ telegramEnabled: false });
                        this.isSending = false;
                        return;
                    }
                    
                    // Возвращаем уведомление в очередь для повторной попытки позже
                    this.pendingNotifications.unshift(notification);
                    this.isSending = false;
                    return;
                }
            } catch (error) {
                logger.error('🔧 Telegram: Error processing notification:', error);
                // Возвращаем уведомление в очередь
                this.pendingNotifications.unshift(notification);
                this.isSending = false;
                return;
            }

            // Задержка между сообщениями — через setTimeout, не блокирует thread
            if (this.pendingNotifications.length > 0) {
                setTimeout(() => processNext(), TELEGRAM_CONFIG.RATE_LIMIT);
            } else {
                this.isSending = false;
            }
        };

        // Запускаем первый вызов
        await processNext();
    },

    // Тестовое сообщение (улучшенное)
    async sendTestMessage() {
        if (!this.botToken || !this.chatId) {
            return { success: false, error: 'Токен или Chat ID не настроены' };
        }

        const message = `✅ Тестовое сообщение от 1C Монитора\n\n` +
                       `Если вы видите это сообщение, Telegram-уведомления настроены правильно!\n` +
                       `👤 Бот: ${this.botInfo?.first_name || 'Unknown'}\n` +
                       `🆔 Chat ID: ${this.chatId}\n` +
                       `⏰ Время: ${telegramUtils.formatTime()}\n\n` +
                       `Теперь вы будете получать уведомления о новых заявках.`;

        const result = await this.sendMessage(message);
        
        if (result.success) {
            return { 
                success: true, 
                message: 'Тестовое сообщение отправлено успешно!',
                messageId: result.messageId 
            };
        } else {
            return { 
                success: false, 
                error: result.error,
                retries: result.retries
            };
        }
    },

    // Получение информации о боте для интерфейса
    async getBotInfoForUI() {
        if (!this.botToken) {
            return { hasToken: false };
        }

        const validation = await this.validateAndGetBotInfo();
        
        return {
            hasToken: true,
            isValid: validation.valid,
            botName: validation.botName,
            username: validation.username,
            error: validation.error
        };
    },

    // Сохранение настроек
    async saveSettings(settings) {
        try {
            const saveData = {};
            let changes = [];
            
            if (settings.enabled !== undefined) {
                this.enabled = settings.enabled;
                saveData.telegramEnabled = settings.enabled;
                changes.push(`enabled: ${settings.enabled}`);
            }
            
            if (settings.botToken !== undefined) {
                const newToken = settings.botToken.trim();
                if (newToken !== this.botToken) {
                    this.botToken = newToken;
                    saveData.telegramBotToken = this.botToken;
                    changes.push('token updated');
                    
                    // При изменении токена проверяем его
                    if (this.botToken) {
                        await this.validateAndGetBotInfo();
                    } else {
                        this.botInfo = null;
                    }
                }
            }
            
            if (settings.chatId !== undefined) {
                const newChatId = settings.chatId.trim();
                if (newChatId !== this.chatId) {
                    this.chatId = newChatId;
                    saveData.telegramChatId = this.chatId;
                    changes.push('chatId updated');
                }
            }
            
            if (settings.messageTemplate !== undefined) {
                this.messageTemplate = settings.messageTemplate;
                saveData.telegramMessageTemplate = this.messageTemplate;
                changes.push('messageTemplate updated');
            }
            
            if (settings.groupMessageTemplate !== undefined) {
                this.groupMessageTemplate = settings.groupMessageTemplate;
                saveData.telegramGroupMessageTemplate = this.groupMessageTemplate;
                changes.push('groupMessageTemplate updated');
            }
            
            if (settings.sendImmediately !== undefined) {
                this.sendImmediately = settings.sendImmediately;
                saveData.telegramSendImmediately = this.sendImmediately;
                changes.push(`sendImmediately: ${this.sendImmediately}`);
            }
            
            if (Object.keys(saveData).length > 0) {
                await telegramStorage.set(saveData);
                logger.log('🔧 Telegram settings saved:', changes);
                
                // Проверяем доступ к чату после сохранения настроек
                if (this.botToken && this.chatId) {
                    const accessTest = await this.testChatAccess();
                    if (!accessTest.success) {
                        logger.warn('🔧 Telegram: Chat access test failed after save:', accessTest.error);
                    }
                }
            }
            
            return { success: true, changes: changes };
        } catch (error) {
            logger.error('🔧 Telegram save settings error:', error);
            return { success: false, error: error.message };
        }
    },

    // Получение текущих настроек
    getSettings() {
        return {
            enabled: this.enabled,
            botToken: this.botToken,
            chatId: this.chatId,
            messageTemplate: this.messageTemplate,
            groupMessageTemplate: this.groupMessageTemplate,
            sendImmediately: this.sendImmediately,
            isConfigured: !!this.botToken && !!this.chatId,
            pendingNotifications: this.pendingNotifications.length,
            botInfo: this.botInfo ? {
                name: this.botInfo.first_name,
                username: this.botInfo.username
            } : null
        };
    },

debugTemplates: async function() {
    logger.log('=== ШАБЛОНЫ СООБЩЕНИЙ ===');
    
    // Получаем из хранилища
    const storageData = await telegramStorage.get([
        'telegramMessageTemplate', 
        'telegramGroupMessageTemplate'
    ]);
    
    logger.log('1. Для КЛАССИФИКАЦИЙ:');
    logger.log('   • В модуле (используется):', this.messageTemplate);
    logger.log('   • В хранилище (сохранено):', storageData.telegramMessageTemplate || 'НЕ ЗАДАН');
    logger.log('   • Совпадают?:', this.messageTemplate === storageData.telegramMessageTemplate);
    
    logger.log('\n2. Для ГРУПП:');
    logger.log('   • В модуле (используется):', this.groupMessageTemplate);
    logger.log('   • В хранилище (сохранено):', storageData.telegramGroupMessageTemplate || 'НЕ ЗАДАН');
    logger.log('   • Совпадают?:', this.groupMessageTemplate === storageData.telegramGroupMessageTemplate);
    
    logger.log('\n3. ТЕСТ подстановки:');
    const testClassification = this.formatClassificationMessage(3, ['123', '456', '789']);
    logger.log('   • Классификация (3 заявки):', testClassification);
    
    const testGroup = this.formatGroupMessage(2, ['G-001', 'G-002']);
    logger.log('   • Группы (2 задачи):', testGroup);
    
    return {
        classification: {
            inModule: this.messageTemplate,
            inStorage: storageData.telegramMessageTemplate,
            testResult: testClassification
        },
        group: {
            inModule: this.groupMessageTemplate,
            inStorage: storageData.telegramGroupMessageTemplate,
            testResult: testGroup
        }
    };
},

    // Очистка настроек
    async clearSettings() {
        try {
            await telegramStorage.remove([
                'telegramEnabled',
                'telegramBotToken',
                'telegramChatId',
                'telegramMessageTemplate',
                'telegramGroupMessageTemplate',
                'telegramSendImmediately'
            ]);
            
            this.enabled = false;
            this.botToken = '';
            this.chatId = '';
            this.botInfo = null;
            this.pendingNotifications = [];
            
            logger.log('🔧 Telegram settings cleared');
            return { success: true };
        } catch (error) {
            logger.error('🔧 Telegram clear settings error:', error);
            return { success: false, error: error.message };
        }
    },

      

};

// Экспорт модуля
window.telegramModule = telegram;