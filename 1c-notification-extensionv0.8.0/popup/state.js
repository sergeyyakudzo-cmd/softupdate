/**
 * Popup State Module - Управление состоянием приложения
 * Вынесено из popup.js для разделения ответственности
 */

const PopupState = {
    // ============ СОСТОЯНИЕ ПРИЛОЖЕНИЯ ============
    state: {
        isSoundEnabled: true,
        isGroupMonitoringEnabled: false,
        isMonitoring: false,
        notificationType: 'sound',
        currentTab: null,
        soundType: 'classic',
        groupSoundType: 'group_notification',
        soundVolume: 80,
        groupVolume: 70,
        voiceVolume: 100,
        voiceAvailable: true,
        soundOptions: [],
        groupSoundOptions: [],
        soundInfo: null,
        soundDisableTimer: null,
        checkInterval: 10000,
        notificationCooldown: 10000,
        lastUpdate: null,
        
        // Сессионная статистика
        sessionStart: Date.now(),
        sessionTotalRequests: 0,
        lastCheckTime: null,
        
        // История для sparkline
        classificationHistory: [],
        groupHistory: [],
        maxHistoryLength: 20,
        
        // Таймер проверки
        lastCheckTimestamp: null,
        checkIntervalMs: 10000,
        
        // Порог уведомлений
        notificationThreshold: 1,
        lastNotifiedCount: { classification: 0, group: 0 },
        
        // Статистика за день
        todayStats: {
            date: new Date().toDateString(),
            totalRequests: 0,
            peakCount: 0,
            peakTime: null,
            checks: 0,
            counts: []
        },
        
        // Умное сворачивание
        sectionOpenCounts: {},
        popupOpenCount: 0,
        
        // Авто-перезапуск
        autoRestartEnabled: false,
        autoRestartInterval: 30000,
        autoRestartTimer: null,
        autoRestartCheckCount: 0,
        
        // Авто-включение звука ночью
        nightAutoEnableEnabled: false,
        nextNightEnableTimer: null,
        
        // Telegram
        telegramEnabled: false,
        telegramConfigured: false,
        telegramSettings: {
            enabled: false,
            botToken: '',
            chatId: '',
            messageTemplate: '🔔 В {time} обнаружено {count} новых заявок на {type}',
            groupMessageTemplate: '👥 В {time} обнаружено {count} задач в группах',
            sendImmediately: true
        },
        
        // Состояние модальных окон
        modalState: {
            notificationType: 'sound',
            soundType: 'classic',
            groupSoundType: 'group_notification',
            voiceVolume: 100
        },

        telegramModalState: {
            botToken: '',
            chatId: '',
            messageTemplate: '🔔 В {time} обнаружено {count} новых заявок на {type}',
            groupMessageTemplate: '👥 В {time} обнаружено {count} задач в группах',
            sendImmediately: true,
            tokenValidated: false,
            chatIdObtained: false
        }
    },

    // Интервалы для очистки при закрытии popup
    intervalIds: new Set(),

    // ============ МЕТОДЫ СОСТОЯНИЯ ============

    /**
     * Создать безопасный интервал с автоматическим отслеживанием
     */
    createSafeInterval(fn, ms) {
        const id = setInterval(fn, ms);
        this.intervalIds.add(id);
        return id;
    },

    /**
     * Очистить безопасный интервал
     */
    clearSafeInterval(id) {
        if (id) {
            clearInterval(id);
            this.intervalIds.delete(id);
        }
    },

    /**
     * Очистить все интервалы
     */
    clearAllIntervals() {
        for (const id of this.intervalIds) {
            clearInterval(id);
        }
        this.intervalIds.clear();
    },

    /**
     * Обновить счётчик в истории
     */
    updateHistory(type, count) {
        const history = type === 'classification' 
            ? this.state.classificationHistory 
            : this.state.groupHistory;
        
        history.push(count);
        
        // Ограничиваем длину истории
        if (history.length > this.state.maxHistoryLength) {
            history.shift();
        }
    },

    /**
     * Обновить статистику за день
     */
    updateDailyStats(classCount, grpCount) {
        const stats = this.state.todayStats;
        const today = new Date().toDateString();
        
        if (stats.date !== today) {
            // Новый день - сброс
            stats.date = today;
            stats.totalRequests = 0;
            stats.peakCount = 0;
            stats.peakTime = null;
            stats.checks = 0;
            stats.counts = [];
        }
        
        stats.checks++;
        const total = classCount + grpCount;
        stats.counts.push(total);
        stats.totalRequests += classCount;
        
        if (total > stats.peakCount) {
            stats.peakCount = total;
            stats.peakTime = new Date().toLocaleTimeString('ru-RU', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
        
        return stats;
    },

    /**
     * Получить усреднённое значение за день
     */
    getDailyAverage() {
        const stats = this.state.todayStats;
        if (stats.checks > 0) {
            return (stats.counts.reduce((a, b) => a + b, 0) / stats.checks).toFixed(1);
        }
        return '0';
    },

    /**
     * Сохранить настройки звука
     */
    saveSoundSettings(settings) {
        return new Promise(resolve => {
            chrome.storage.local.set({
                soundEnabled: settings.soundEnabled,
                soundVolumeLevel: settings.soundVolume,
                groupVolumeLevel: settings.groupVolume,
                voiceVolumeLevel: settings.voiceVolume,
                notificationType: settings.notificationType,
                soundType: settings.soundType,
                groupSoundType: settings.groupSoundType
            }, resolve);
        });
    },

    /**
     * Загрузить настройки звука
     */
    loadSoundSettings() {
        return new Promise(resolve => {
            chrome.storage.local.get([
                'soundEnabled', 'soundVolumeLevel', 'groupVolumeLevel', 'voiceVolumeLevel',
                'notificationType', 'soundType', 'groupSoundType'
            ], resolve);
        });
    },

    /**
     * Сохранить настройки мониторинга
     */
    saveMonitoringSettings(settings) {
        return new Promise(resolve => {
            chrome.storage.local.set({
                groupMonitoringEnabled: settings.groupMonitoringEnabled,
                checkInterval: settings.checkInterval,
                notificationCooldown: settings.notificationCooldown,
                notificationThreshold: settings.notificationThreshold
            }, resolve);
        });
    },

    /**
     * Загрузить настройки мониторинга
     */
    loadMonitoringSettings() {
        return new Promise(resolve => {
            chrome.storage.local.get([
                'groupMonitoringEnabled', 'checkInterval', 'notificationCooldown',
                'notificationThreshold'
            ], resolve);
        });
    },

    /**
     * Сохранить настройки авто-перезапуска
     */
    saveAutoRestartSettings(settings) {
        return new Promise(resolve => {
            chrome.storage.local.set({
                autoRestartEnabled: settings.autoRestartEnabled,
                autoRestartInterval: settings.autoRestartInterval
            }, resolve);
        });
    },

    /**
     * Загрузить настройки авто-перезапуска
     */
    loadAutoRestartSettings() {
        return new Promise(resolve => {
            chrome.storage.local.get([
                'autoRestartEnabled', 'autoRestartInterval', 'nightAutoEnableEnabled'
            ], resolve);
        });
    },

    /**
     * Сохранить настройки Telegram
     */
    saveTelegramSettings(settings) {
        return new Promise(resolve => {
            chrome.storage.local.set({
                telegramEnabled: settings.enabled,
                telegramMessageTemplate: settings.messageTemplate,
                telegramGroupMessageTemplate: settings.groupMessageTemplate,
                telegramSendImmediately: settings.sendImmediately
            }, resolve);
        });
    },

    /**
     * Загрузить настройки Telegram
     */
    loadTelegramSettings() {
        return new Promise(resolve => {
            chrome.storage.local.get([
                'telegramEnabled', 'telegramMessageTemplate',
                'telegramGroupMessageTemplate', 'telegramSendImmediately'
            ], resolve);
        });
    }
};

// Экспорт
if (typeof window !== 'undefined') {
    window.PopupState = PopupState;
}
