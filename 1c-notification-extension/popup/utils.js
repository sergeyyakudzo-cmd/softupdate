import { state, elements, previousCounts } from './state.js';

function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    while (container.firstChild) container.firstChild.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = {
        success: 'fas fa-check-circle', error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle', info: 'fas fa-info-circle'
    };
    toast.innerHTML = `<i class="${icons[type] || icons.info} toast-icon"></i><span class="toast-message">${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, duration);
}

function showModal(modalElement) {
    if (!modalElement) return;
    modalElement.style.display = 'flex';
    void modalElement.offsetWidth;
    modalElement.classList.add('show');
}

function hideModal(modalElement) {
    if (!modalElement) return;
    modalElement.classList.remove('show');
    setTimeout(() => { modalElement.style.display = 'none'; }, 250);
}

function setButtonLoading(button, isLoading) {
    if (!button) return;
    button.classList.toggle('loading', isLoading);
    button.disabled = isLoading;
}

function updateVolumeIndicators(sliderId, indicatorSelector) {
    const slider = document.getElementById(sliderId);
    const indicators = document.querySelectorAll(indicatorSelector);
    if (!slider || !indicators.length) return;
    const value = parseInt(slider.value);
    indicators.forEach(ind => ind.classList.remove('active'));
    if (value <= 33) { indicators[0]?.classList.add('active'); }
    else if (value <= 66) { indicators[1]?.classList.add('active'); }
    else { indicators[2]?.classList.add('active'); }
}

function removeSkeleton() {
    document.querySelectorAll('.skeleton-text').forEach(el => el.classList.remove('skeleton-text', 'skeleton'));
}

function animateCounterChange(elementId, newValue, cardId) {
    const element = document.getElementById(elementId);
    const card = document.getElementById(cardId);
    if (!element) return;
    const numValue = parseInt(newValue) || 0;
    const prevKey = elementId === 'countText' ? 'classification' : 'group';
    const prevValue = previousCounts[prevKey];
    previousCounts[prevKey] = numValue;
    if (numValue !== prevValue) {
        element.classList.remove('bounce', 'flash');
        void element.offsetWidth;
        element.classList.add('bounce');
        setTimeout(() => element.classList.add('flash'), 100);
        if (card) {
            card.classList.remove('pulse-alert', 'pulse-success');
            void card.offsetWidth;
            card.classList.add(numValue > prevValue ? 'pulse-alert' : (numValue === 0 ? 'pulse-success' : 'none'));
        }
        setTimeout(() => {
            element.classList.remove('bounce', 'flash');
            if (card) card.classList.remove('pulse-alert', 'pulse-success');
        }, 1200);
    }
}

function setupCollapsibleSections() {
    chrome.storage.local.get(['sectionStates'], (result) => {
        const states = result.sectionStates || {};
        document.querySelectorAll('.collapsible-section').forEach(s => {
            const name = s.dataset.section;
            if (name && states[name] !== undefined) s.classList.toggle('open', states[name]);
        });
        const ls = document.querySelector('.collapsible-section[data-section="logs"]');
        if (ls && states.logs === undefined) ls.classList.remove('open');
    });

    function toggle() {
        const section = this.closest('.collapsible-section');
        if (!section) return;
        section.classList.toggle('open');
        const name = section.dataset.section;
        if (name) {
            chrome.storage.local.get(['sectionStates'], (r) => {
                const st = r.sectionStates || {};
                st[name] = section.classList.contains('open');
                chrome.storage.local.set({ sectionStates: st });
            });
        }
    }

    document.querySelectorAll('.collapsible-header').forEach(h => {
        h.setAttribute('role', 'button');
        h.setAttribute('tabindex', '0');
        h.addEventListener('click', toggle);
        h.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle.call(h); }
        });
    });
}

function setupRippleEffect() {
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            const r = this.getBoundingClientRect();
            const s = Math.max(r.width, r.height);
            ripple.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s/2}px;top:${e.clientY - r.top - s/2}px;`;
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });
}

function updateCheckTimer() {
    const bar = document.getElementById('checkTimerBar');
    const progress = document.getElementById('checkTimerProgress');
    const text = document.getElementById('checkTimerText');
    if (!bar || !progress || !text) return;
    if (!state.isMonitoring || !state.lastCheckTimestamp) {
        bar.style.display = 'none'; text.textContent = ''; return;
    }
    bar.style.display = 'block'; bar.classList.add('active');
    const interval = state.checkIntervalMs || 10000;
    const elapsed = (Date.now() - state.lastCheckTimestamp) % interval;
    progress.style.width = ((elapsed / interval) * 100) + '%';
    text.textContent = 'Следующая проверка через ' + Math.max(Math.ceil((interval - elapsed) / 1000), 0) + 'с';
}

function renderHourlyChart() {
    const container = document.getElementById('hourlyChartContainer');
    if (!container) return;
    const classH = state.hourlyClassification || [];
    const groupH = state.hourlyGroup || [];
    const total = Array.from({length: 24}, (_, i) => (classH[i]||0) + (groupH[i]||0));
    const currentHour = new Date().getHours();
    let lastIndex = currentHour >= 7 ? currentHour - 7 : currentHour + 17;
    if (lastIndex < 0) lastIndex = 0;
    const data = total.slice(0, lastIndex + 1);
    if (data.length < 1) { container.innerHTML = '<div class="chart-empty">Нет данных</div>'; return; }
    const dataMax = Math.max(...data, 1);
    const steps = [5,10,20,30,50,100,150,200,300,500,1000,2000,5000];
    const ceiling = steps.find(s => s >= dataMax) || 5000;
    const xLabels = Array.from({length: data.length}, (_, i) => (i + 7) % 24);
    const yStep = [1,2,5,10,20,50,100,200,500].find(s => s * 2 >= ceiling / 3) || 100;
    const yLabels = [];
    for (let v = 0; v <= ceiling; v += yStep) yLabels.push(v);
    if (yLabels[yLabels.length - 1] < ceiling) yLabels.push(ceiling);
    if (yLabels[0] > 5) yLabels.unshift(0);
    const dk = data.join(',');
    if (container.dataset.lastData === dk && container.querySelector('.chart-bars') && container.dataset.forceRender !== 'true') return;
    delete container.dataset.forceRender;
    container.dataset.lastData = dk;
    let html = '<div class="chart-wrap"><div class="chart-ylabels">';
    yLabels.forEach(v => { html += `<span class="chart-ylabel">${v}</span>`; });
    html += '</div><div class="chart-bars">';
    const chartPx = 140;
    yLabels.forEach(v => { html += `<div class="chart-gridline" style="bottom:${(v/ceiling)*chartPx}px"></div>`; });
    data.forEach((val, i) => {
        const barH = Math.max(1, (val / ceiling) * chartPx);
        html += `<div class="chart-col${i === data.length - 1 ? ' chart-bar-last' : ''}" style="--i:${i}">
            <div class="chart-bar" style="height:${barH}px">${val > 0 ? `<span class="chart-bar-label">${val}</span>` : ''}</div>
            <span class="chart-hour">${xLabels[i].toString().padStart(2, '0')}</span></div>`;
    });
    html += '</div></div>';
    container.innerHTML = html;
}

function updateShiftTimer() {
    const el = document.getElementById('shiftTimer');
    if (!el) return;
    const now = new Date();
    const t = new Date(now); t.setHours(7, 0, 0, 0);
    if (t <= now) t.setDate(t.getDate() + 1);
    const d = t.getTime() - now.getTime();
    el.textContent = `${Math.floor(d/3600000).toString().padStart(2,'0')}:${Math.floor((d%3600000)/60000).toString().padStart(2,'0')}:${Math.floor((d%60000)/1000).toString().padStart(2,'0')}`;
}

function getShiftDateKey() {
    const now = new Date();
    if (now.getHours() < 7) {
        const y = new Date(now); y.setDate(y.getDate() - 1); return y.toISOString().split('T')[0];
    }
    return now.toISOString().split('T')[0];
}

function sendMessageToContentScript(message) {
    return new Promise((resolve, reject) => {
        const tab = state.currentTab;
        if (!tab || !tab.id) { reject(new Error('No active tab')); return; }
        chrome.tabs.sendMessage(tab.id, message, (response) => {
            if (chrome.runtime.lastError) reject(new Error('Content script not ready'));
            else resolve(response);
        });
    });
}

function updateButtonIcons() {
    if (!elements.toggleMonitor) return;
    const icon = elements.toggleMonitor.querySelector('i');
    const text = elements.toggleMonitor.querySelector('span');
    if (state.isMonitoring) {
        if (icon) icon.className = 'fas fa-pause';
        if (text) text.textContent = 'Активно';
        elements.toggleMonitor.classList.add('active');
    } else {
        if (icon) icon.className = 'fas fa-play';
        if (text) text.textContent = 'Запустить';
        elements.toggleMonitor.classList.remove('active');
    }
}

function updateFooterSessionInfo() {
    const el = document.getElementById('footerSessionInfo');
    if (!el) return;
    const elapsed = Date.now() - state.sessionStart;
    const sec = Math.floor(elapsed / 1000);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    el.textContent = 'Сессия: ' + state.sessionTotalRequests + ' запросов • ' +
        (h > 0 ? h + ':' + m.toString().padStart(2,'0') + ':' + s.toString().padStart(2,'0') : m + ':' + s.toString().padStart(2,'0'));
}

function updateLastNotificationTime() {
    if (!state.lastUpdate || !elements.lastNotification) return;
    const diff = Math.floor((Date.now() - state.lastUpdate) / 1000);
    elements.lastNotification.textContent = diff < 60 ? `${diff} сек назад` :
        diff < 3600 ? `${Math.floor(diff/60)} мин назад` : `${Math.floor(diff/3600)} ч назад`;
}

function updateGroupMonitoringToggle() {
    if (!elements.toggleGroupMonitor) return;
    elements.toggleGroupMonitor.checked = state.isGroupMonitoringEnabled;
    if (elements.groupMonitorStatus) {
        elements.groupMonitorStatus.textContent = state.isGroupMonitoringEnabled ? 'Мониторинг групп активен' : 'Мониторинг групп выключен';
        elements.groupMonitorStatus.style.color = state.isGroupMonitoringEnabled ? 'var(--primary)' : 'var(--text-gray)';
    }
}

function updateVoiceStatus(available) {
    state.voiceAvailable = available;
    if (elements.voiceStatusModal) {
        if (available) {
            elements.voiceStatusModal.innerHTML = '<i class="fas fa-info-circle"></i><span>Голосовая система готова к работе</span>';
            elements.voiceStatusModal.className = 'voice-status-modal';
        } else {
            elements.voiceStatusModal.innerHTML = '<i class="fas fa-exclamation-triangle"></i><span>Голосовая система недоступна</span>';
            elements.voiceStatusModal.className = 'voice-status-modal error';
            if (state.modalState.notificationType === 'voice') updateModalNotificationType('sound');
        }
    }
}

function setStatus(status, count, groupCount, monitoring) {
    const bar = document.getElementById('footerStatusBar');
    if (bar) Object.assign(bar.style, { marginBottom: '0px', paddingBottom: '0px', borderBottom: 'none' });
    const container = document.querySelector('.container');
    const isEmpty = status && status.includes('Обновите') && !state.currentTab;
    if (container) container.classList.toggle('empty-mode', isEmpty);
    if (elements.statusText) elements.statusText.textContent = status || 'Неизвестно';
    const c = (count || '0').toString();
    const g = (groupCount || '0').toString();
    if (elements.countText) elements.countText.textContent = c;
    if (elements.groupCountText) elements.groupCountText.textContent = g;
    removeSkeleton();
    animateCounterChange('countText', c, 'classificationCard');
    animateCounterChange('groupCountText', g, 'groupCard');
    const cn = parseInt(c) || 0, gn = parseInt(g) || 0;
    const total = cn + gn;
    if (total > state._lastSessionTotal) state.sessionTotalRequests += total - state._lastSessionTotal;
    state._lastSessionTotal = total;
    state.lastCheckTime = Date.now();
    if (monitoring && !state._monitoringStarted) { state._monitoringStarted = true; state.lastCheckTimestamp = Date.now(); }
    updateCheckTimer();
    const th = state.notificationThreshold || 1;
    const cd = cn - state.lastNotifiedCount.classification;
    const gd = gn - state.lastNotifiedCount.group;
    if (cd >= th && cd > 0) showToast('+' + cd + ' новых заявок', 'warning', 2000);
    if (gd >= th && gd > 0) showToast('+' + gd + ' новых задач в группах', 'info', 2000);
    state.lastNotifiedCount = { classification: cn, group: gn };
    const dot = document.getElementById('footerStatusDot');
    if (dot) dot.className = 'status-bar-dot' + (status && status.includes('Обновите') ? ' error' : '');
    state.isMonitoring = monitoring !== undefined ? monitoring : false;
    updateButtonIcons();
    updateMonitoringButtonState();
    updateFooterSessionInfo();
}

function updateMonitoringButtonState() {
    const btn = document.getElementById('toggleMonitor');
    if (btn) btn.classList.toggle('active', state.isMonitoring);
}

export {
    showToast, showModal, hideModal, setButtonLoading, updateVolumeIndicators,
    removeSkeleton, animateCounterChange, setupCollapsibleSections, setupRippleEffect,
    updateCheckTimer, renderHourlyChart, updateShiftTimer, getShiftDateKey,
    sendMessageToContentScript, updateButtonIcons, updateFooterSessionInfo,
    updateLastNotificationTime, updateGroupMonitoringToggle, updateVoiceStatus, setStatus,
    updateMonitoringButtonState,
};
