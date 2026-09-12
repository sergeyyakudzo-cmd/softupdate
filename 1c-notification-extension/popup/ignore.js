import { state, elements } from './state.js';
import { showToast, showModal, hideModal, sendMessageToContentScript } from './utils.js';

function setupIgnoreEventListeners() {
    if (!elements.ignoreSettingsBtn || !elements.ignoreModal) return;
    if (elements.addIgnoreNumberBtn) elements.addIgnoreNumberBtn.addEventListener('click', addIgnoreNumber);
    if (elements.clearIgnoredNumbersBtn) elements.clearIgnoredNumbersBtn.addEventListener('click', clearAllIgnoredNumbers);
    if (elements.saveIgnoreSettingsBtn) elements.saveIgnoreSettingsBtn.addEventListener('click', saveIgnoreSettings);
    if (elements.closeIgnoreModalBtn) elements.closeIgnoreModalBtn.addEventListener('click', closeIgnoreModal);

    elements.ignoreModal.addEventListener('click', (event) => {
        if (event.target === elements.ignoreModal) closeIgnoreModal();
    });

    if (elements.ignoreNumberInput) {
        elements.ignoreNumberInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addIgnoreNumber();
        });
    }
}

function showIgnoreModal() {
    if (!elements.ignoreModal) return;
    showModal(elements.ignoreModal);
    loadAndDisplayIgnoredNumbers();
}

function closeIgnoreModal() {
    if (elements.ignoreModal) hideModal(elements.ignoreModal);
}

function addIgnoreNumber() {
    const input = elements.ignoreNumberInput;
    if (!input) return;
    let number = input.value.trim();
    if (!number) { showToast('Введите номер заявки', 'warning'); return; }

    if (number.toUpperCase().startsWith('HD')) {
        number = number.substring(2);
        if (number.length > 9) number = number.slice(-9);
    }
    if (!/^\d+$/.test(number)) { showToast('Номер должен содержать только цифры', 'error'); return; }
    if (number.length !== 9 && !confirm(`Номер ${number} имеет ${number.length} цифр. Обычно 9. Добавить?`)) return;

    chrome.storage.local.get(['ignoredNumbers'], (result) => {
        const numbers = result.ignoredNumbers || [];
        if (numbers.includes(number)) { showToast('Этот номер уже добавлен', 'warning'); return; }
        numbers.push(number);
        chrome.storage.local.set({ ignoredNumbers: numbers }, () => {
            input.value = '';
            updateIgnoredNumbersList(numbers);
            sendToContentScript(numbers);
            showToast('Номер добавлен', 'success');
        });
    });
}

function clearAllIgnoredNumbers() {
    chrome.storage.local.get(['ignoredNumbers'], (result) => {
        const numbers = result.ignoredNumbers || [];
        if (numbers.length === 0) return;
        if (confirm(`Удалить все ${numbers.length} номеров?`)) {
            chrome.storage.local.set({ ignoredNumbers: [] }, () => {
                updateIgnoredNumbersList([]);
                sendToContentScript([]);
            });
        }
    });
}

function saveIgnoreSettings() { closeIgnoreModal(); }

function loadAndDisplayIgnoredNumbers() {
    chrome.storage.local.get(['ignoredNumbers'], (result) => {
        updateIgnoredNumbersList(result.ignoredNumbers || []);
    });
}

function updateIgnoredNumbersList(numbers) {
    const list = elements.ignoredNumbersList;
    if (!list) return;
    list.innerHTML = '';
    if (numbers.length === 0) {
        const msg = document.createElement('div');
        msg.style.cssText = 'text-align:center;color:var(--text-lighter);padding:20px;';
        msg.textContent = 'Нет игнорируемых номеров';
        list.appendChild(msg);
    } else {
        numbers.forEach(num => {
            const item = document.createElement('div');
            item.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:8px;margin:5px 0;background:var(--background-subtle);border-radius:4px;';
            const span = document.createElement('span');
            span.style.fontFamily = 'monospace';
            span.textContent = num;
            const btn = document.createElement('button');
            btn.style.cssText = 'background:none;border:none;color:var(--danger);cursor:pointer;font-size:18px;';
            btn.textContent = '\u00D7';
            btn.addEventListener('click', () => removeIgnoredNumber(num));
            item.appendChild(span);
            item.appendChild(btn);
            list.appendChild(item);
        });
    }
}

function removeIgnoredNumber(numberToRemove) {
    chrome.storage.local.get(['ignoredNumbers'], (result) => {
        const numbers = (result.ignoredNumbers || []).filter(n => n !== numberToRemove);
        chrome.storage.local.set({ ignoredNumbers: numbers }, () => {
            updateIgnoredNumbersList(numbers);
            sendToContentScript(numbers);
        });
    });
}

function sendToContentScript(numbers) {
    const tab = state.currentTab;
    if (!tab || !tab.id) return;
    chrome.tabs.sendMessage(tab.id, { type: 'UPDATE_IGNORED_NUMBERS', numbers }, () => {
        if (chrome.runtime.lastError) logger.log('Content script не готов');
    });
}

export { setupIgnoreEventListeners, showIgnoreModal };
