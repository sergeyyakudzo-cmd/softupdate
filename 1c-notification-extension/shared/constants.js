/**
 * Единый источник констант для 1C Notification Extension
 * Все константы проекта в одном месте - избегаем дублирования
 */

const SHARED_CONSTANTS = {
    // ============ URLs ============
    URLS: {
        TARGET_DOMAIN: 'https://2phoenix.alidi.ru',
        TELEGRAM_API: 'https://api.telegram.org'
    },

    // ============ Интервалы ============
    INTERVALS: {
        DEFAULT_CHECK: 10000,        // 10 секунд
        DEFAULT_COOLDOWN: 10000,     // 10 секунд
        NIGHT_CHECK: 300000,         // 5 минут
        AUTO_RESTART_MIN: 30000      // 30 секунд
    },

    // ============ Время ночного режима ============
    NIGHT_MODE: {
        START: 22,                   // 22:00
        END: 8,                      // 8:00
        MAX_DISABLE_MINUTES: 10,      // Максимум 10 минут ночью
        ENABLE_DURATION: 10000       // Включать на 10 секунд
    },

    // ============ Notification ============
    NOTIFICATION: {
        TYPE_SOUND: 'sound',
        TYPE_VOICE: 'voice',
        DEFAULT_TYPE: 'sound',
        ICON_URL: 'icons/icon48.png',
        AUTO_CLEAR_MS: 5000,
        PRIORITY: 2
    },

    // ============ Sounds ============
    SOUND: {
        DEFAULT_TYPE: 'classic',
        DEFAULT_GROUP_TYPE: 'group_notification',
        DEFAULT_VOLUME: 80,
        DEFAULT_GROUP_VOLUME: 70,
        DEFAULT_VOICE_VOLUME: 100,
        VOLUME_STEPS: [33, 66, 100]
    },

    // ============ Monitoring ============
    MONITORING: {
        HD_PATTERN: 'HD',
        HD_LENGTH: 12,
        HD_SKIP_LAST: 3,
        DEFAULT_THRESHOLD: 1
    },

    // ============ Telegram ============
    TELEGRAM: {
        API_URL: 'https://api.telegram.org/bot',
        MAX_MESSAGE_LENGTH: 4096,
        MAX_RETRIES: 3,
        RETRY_DELAY: 1000,
        RATE_LIMIT: 1000,
        MAX_UPDATES_RETENTION: 100,
        DEFAULT_TEMPLATE: '🔔 В {time} обнаружено {count} новых заявок на {type}',
        DEFAULT_GROUP_TEMPLATE: '👥 В {time} обнаружено {count} задач в группах',
        MAX_NUMBERS_DISPLAY: 10
    },

    // ============ UI ============
    UI: {
        TOAST_DURATION: 3000,
        RIPPLE_DURATION: 600,
        MODAL_ANIMATION: 250,
        SPARKLINE: {
            WIDTH: 160,
            HEIGHT: 28,
            PADDING: 2,
            MAX_POINTS: 20
        },
        HISTORY_LENGTH: 20,
        MIN_OPENS_FOR_COLLAPSE: 3,
        MIN_OPENS_TO_KEEP: 2
    },

    // ============ Storage Keys ============
    STORAGE_KEYS: {
        // Звук
        SOUND_ENABLED: 'soundEnabled',
        SOUND_VOLUME: 'soundVolumeLevel',
        GROUP_VOLUME: 'groupVolumeLevel',
        VOICE_VOLUME: 'voiceVolumeLevel',
        SOUND_TYPE: 'soundType',
        GROUP_SOUND_TYPE: 'groupSoundType',
        NOTIFICATION_TYPE: 'notificationType',
        SOUND_DISABLE_END: 'soundDisableEndTime',
        
        // Мониторинг
        MONITORING_ENABLED: 'monitoringEnabled',
        GROUP_MONITORING: 'groupMonitoringEnabled',
        CHECK_INTERVAL: 'checkInterval',
        NOTIFICATION_COOLDOWN: 'notificationCooldown',
        NOTIFICATION_THRESHOLD: 'notificationThreshold',
        IGNORED_NUMBERS: 'ignoredNumbers',
        
        // Авто-перезапуск
        AUTO_RESTART_ENABLED: 'autoRestartEnabled',
        AUTO_RESTART_INTERVAL: 'autoRestartInterval',
        
        // Ночной режим
        NIGHT_AUTO_ENABLE: 'nightAutoEnableEnabled',
        
        // UI
        SECTION_STATES: 'sectionStates',
        SECTION_OPEN_COUNTS: 'sectionOpenCounts',
        POPUP_OPEN_COUNT: 'popupOpenCount',
        
        // Telegram
        TELEGRAM_ENABLED: 'telegramEnabled',
        TELEGRAM_BOT_TOKEN: 'telegramBotToken',
        TELEGRAM_CHAT_ID: 'telegramChatId',
        TELEGRAM_TEMPLATE: 'telegramMessageTemplate',
        TELEGRAM_GROUP_TEMPLATE: 'telegramGroupMessageTemplate',
        TELEGRAM_SEND_IMMEDIATELY: 'telegramSendImmediately'
    },

    // ============ Messages ============
    MESSAGES: {
        STATUS_ACTIVE: 'Активен',
        STATUS_INACTIVE: 'Выключен',
        STATUS_CHECKING: 'Проверка...',
        STATUS_ERROR: 'Ошибка',
        TOAST_SAVED: 'Настройки сохранены',
        TOAST_ERROR: 'Произошла ошибка',
        TOAST_EXPORTED: 'Настройки экспортированы',
        TOAST_IMPORTED: 'Настройки импортированы'
    }
};

// Экспорт для использования во всех модулях
if (typeof window !== 'undefined') {
    window.SHARED_CONSTANTS = SHARED_CONSTANTS;
}

// ESM-совместимый экспорт (для будущего использования с бандлером)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SHARED_CONSTANTS;
}
