/**
 * Конфигурация расширения
 * ⚠️ BOT_TOKEN удалён из кода в целях безопасности.
 * Задай токен через chrome.storage.local.set({ maxBotToken: '...' }) в консоли разработчика
 * или через интерфейс расширения (если реализовано).
 */

(function() {
    const CONFIG = {
        // ============ MAX (VK Teams) Bot ============
        MAX: {
            BOT_TOKEN: ''
        },

        // ============ Обновление ============
        UPDATE: {
            GITHUB_BASE: 'https://raw.githubusercontent.com/sergeyyakudzo-cmd/softupdate/main/1c-notification-extension/',
            EXTENSION_FOLDER: ''
        }
    };

    // Service worker (background.js через importScripts): экспортируем полный CONFIG
    if (typeof self !== 'undefined' && typeof window === 'undefined') {
        // @ts-ignore — self in service worker intentionally gets full CONFIG with BOT_TOKEN
        self.CONFIG = CONFIG;
    }

    // Popup и content-скрипты: только очищенный CONFIG (без BOT_TOKEN)
    if (typeof window !== 'undefined') {
        window.CONFIG = {
            MAX: {},
            UPDATE: CONFIG.UPDATE
        };
    }
})();