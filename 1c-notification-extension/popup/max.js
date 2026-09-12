import { state, elements } from './state.js';
import { showToast, sendMessageToContentScript } from './utils.js';

function loadMaxSettings() {
    chrome.storage.local.get(['maxEnabled', 'maxUserId'], (result) => {
        try {
            state.maxSettings = { enabled: result.maxEnabled === true, userId: result.maxUserId || '' };
            state.maxEnabled = state.maxSettings.enabled;
            state.maxConfigured = !!result.maxUserId;
            if (elements.maxUserId && result.maxUserId) elements.maxUserId.value = result.maxUserId;
            if (elements.toggleMax) elements.toggleMax.checked = state.maxEnabled;
            updateMaxUI();
        } catch (error) {
            logger.error('🔴 Ошибка загрузки настроек MAX:', error);
        }
    });
}

function updateMaxUI() {
    if (!elements.toggleMax) return;
    elements.toggleMax.checked = state.maxEnabled;
    if (elements.maxStatus) {
        if (state.maxEnabled) {
            if (state.maxConfigured) {
                elements.maxStatus.textContent = 'MAX настроен и активен';
                elements.maxStatus.style.color = 'var(--success)';
            } else {
                elements.maxStatus.textContent = 'MAX включен, но не настроен';
                elements.maxStatus.style.color = 'var(--warning)';
            }
        } else {
            elements.maxStatus.textContent = 'MAX выключен';
            elements.maxStatus.style.color = 'var(--text-gray)';
        }
    }
}

function toggleMaxHandler() {
    state.maxEnabled = !state.maxEnabled;
    sendMessageToContentScript({ type: 'UPDATE_MAX_ENABLED', enabled: state.maxEnabled })
        .then(() => {
            chrome.storage.local.set({ maxEnabled: state.maxEnabled });
            updateMaxUI();
            showToast(state.maxEnabled ? 'MAX включён' : 'MAX выключен', 'info');
        })
            .catch(() => showToast('Ошибка: Обновите страницу 1С', 'error'));
}

function saveMaxUserId() {
    const userId = elements.maxUserId ? elements.maxUserId.value.trim() : '';
    state.maxUserId = userId;
    state.maxConfigured = !!userId;
    chrome.storage.local.set({ maxUserId: userId });
    sendMessageToContentScript({ type: 'UPDATE_MAX_USER_ID', userId })
        .then(() => { updateMaxUI(); })
        .catch(() => logger.warn('MAX user ID save failed: content script not ready'));
}

function sendTestMaxMessage() {
    if (!state.currentTab) { showToast('Сначала откройте страницу 1С', 'warning'); return; }
    sendMessageToContentScript({ type: 'TEST_MAX' })
        .then(result => {
            if (result && result.success) showToast('Тест MAX отправлен', 'success');
            else showToast('Ошибка MAX: ' + (result?.error || 'неизвестная'), 'error');
        })
        .catch(() => showToast('Ошибка отправки', 'error'));
}

function sendCurrentStatsToMax() {
    chrome.runtime.sendMessage({ type: 'SHIFT_SEND_REPORT' }, (response) => {
        if (response && response.success) showToast('Статистика отправлена', 'success');
        else showToast('Ошибка: ' + (response?.error || 'MAX не настроен'), 'error');
    });
}

function sendMonthlyStatsToMax() {
    chrome.runtime.sendMessage({ type: 'SHIFT_SEND_MONTHLY_REPORT' }, (response) => {
        if (response && response.success) showToast('Отчёт за месяц отправлен', 'success');
        else showToast('Ошибка: ' + (response?.error || 'MAX не настроен'), 'error');
    });
}

export { loadMaxSettings, updateMaxUI, toggleMaxHandler, saveMaxUserId, sendTestMaxMessage, sendCurrentStatsToMax, sendMonthlyStatsToMax };
