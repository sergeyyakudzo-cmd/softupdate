/**
 * Конфигурация с конфиденциальными данными
 * ВАЖНО: Добавь этот файл в .gitignore чтобы не коммитить токены
 */

const CONFIG = {
    // ============ Telegram Bot ============
    TELEGRAM: {
        BOT_TOKEN: '8542040998:AAGuwymgAEPeB43PoHFNPyJPJxG-EzntzaI'
    },

    // ============ MAX (VK Teams) Bot ============
    MAX: {
        BOT_TOKEN: 'f9LHodD0cOIsuFM7s3BgTcIw2zTV3ZfC7UFn0NPNy7Xb8nBln-UvBnSNASjw-5w671OMv0G7QUsKJoLTGr-A'
    },

    // ============ Обновление ============
    UPDATE: {
        GITHUB_BASE: 'https://raw.githubusercontent.com/sergeyyakudzo-cmd/softupdate/main/1c-notification-extensionv/',
        EXTENSION_FOLDER: ''
    }
};

// Экспорт
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
}