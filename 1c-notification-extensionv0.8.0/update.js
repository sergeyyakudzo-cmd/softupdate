/**
 * Модуль обновления - базовый
 */

const ExtensionUpdater = {
    VERSION: '0.8.1'
};

if (typeof window !== 'undefined') {
    window.ExtensionUpdater = ExtensionUpdater;
}