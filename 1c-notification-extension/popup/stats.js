import { state, elements } from './state.js';
import { sendMessageToContentScript, renderHourlyChart, getShiftDateKey } from './utils.js';

const STATS_STORAGE_KEY = 'dailyStats';

function updateStatsWithNumbers() {
    return new Promise(resolve => {
        chrome.runtime.sendMessage({ type: 'SHIFT_GET_STATS' }, (response) => {
            if (response && response.success) {
                const classificationTotal = response.classificationTotal || 0;
                const groupTotal = response.groupTotal || 0;
                const currentClassification = response.currentClassification || 0;
                const currentGroup = response.currentGroup || 0;

                state.todayStats.classificationCount = classificationTotal;
                state.todayStats.groupCount = groupTotal;
                state.todayStats.totalRequests = classificationTotal + groupTotal;

                const peakFromTracker = response.peakClassification || 0;
                if (peakFromTracker > state.todayStats.peakCount) {
                    state.todayStats.peakCount = peakFromTracker;
                    if (response.peakClassificationTime) {
                        state.todayStats.peakTime = new Date(response.peakClassificationTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                    }
                }
                if (currentClassification > state.todayStats.peakCount) {
                    state.todayStats.peakCount = currentClassification;
                    state.todayStats.peakTime = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                }

                if (response.shift) {
                    state.hourlyClassification = response.shift.hourlyClassification || [];
                    state.hourlyGroup = response.shift.hourlyGroup || [];
                }

                saveDailyStats();
                renderDailyStats();
                resolve();
            } else {
                updateStatsFromContent().then(() => resolve()).catch(() => resolve());
            }
        });
    });
}

function updateStatsFromContent() {
    if (!state.currentTab) return Promise.resolve();
    return sendMessageToContentScript({ type: 'GET_APPLICATION_NUMBERS' })
        .then(response => {
            if (response && response.success) {
                const classCount = (response.classificationNumbers || []).length;
                const groupCount = (response.groupNumbers || []).length;
                state.todayStats.classificationCount = classCount;
                state.todayStats.groupCount = groupCount;
                state.todayStats.totalRequests = classCount + groupCount;
                if (classCount > state.todayStats.peakCount) {
                    state.todayStats.peakCount = classCount;
                    state.todayStats.peakTime = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                }
                saveDailyStats();
                renderDailyStats();
            }
        })
        .catch(() => {});
}

function loadDailyStats() {
    return new Promise(resolve => {
        chrome.storage.local.get([STATS_STORAGE_KEY], (result) => {
            const stored = result[STATS_STORAGE_KEY];
            const today = getShiftDateKey();
            if (stored && stored.date === today) {
                state.todayStats = {
                    date: today,
                    totalRequests: stored.totalRequests || 0,
                    classificationCount: stored.classificationCount || 0,
                    groupCount: stored.groupCount || 0,
                    peakCount: stored.peakCount || 0,
                    peakTime: stored.peakTime || null,
                    checks: stored.checks || 0,
                    counts: stored.counts || []
                };
            } else {
                state.todayStats = {
                    date: today, totalRequests: 0, classificationCount: 0, groupCount: 0,
                    peakCount: 0, peakTime: null, checks: 0, counts: []
                };
            }
            resolve();
        });
    });
}

function saveDailyStats() {
    chrome.storage.local.set({ [STATS_STORAGE_KEY]: state.todayStats });
}

function renderDailyStats() {
    const s = state.todayStats;
    if (elements.statTotalToday) elements.statTotalToday.textContent = String(s.totalRequests || 0);
    if (elements.statClassification) elements.statClassification.textContent = String(s.classificationCount || 0);
    if (elements.statGroup) elements.statGroup.textContent = String(s.groupCount || 0);
    if (elements.statPeak) elements.statPeak.textContent = String(s.peakCount || 0);
    if (elements.statPeakTime) elements.statPeakTime.textContent = s.peakTime || '—';
    renderHourlyChart();
}

function fillDemoStats() {
    const today = getShiftDateKey();
    state.todayStats = {
        date: today, totalRequests: 73, classificationCount: 42, groupCount: 18,
        peakCount: 7, peakTime: '14:32', checks: 128, counts: []
    };

    if (elements.statTotalToday) elements.statTotalToday.textContent = '73';
    if (elements.statClassification) elements.statClassification.textContent = '42';
    if (elements.statGroup) elements.statGroup.textContent = '18';
    if (elements.statPeak) elements.statPeak.textContent = '7';
    if (elements.statPeakTime) elements.statPeakTime.textContent = '14:32';

    const hour = new Date().getHours();

    const chartContainer = document.getElementById('hourlyChartContainer');
    if (!chartContainer) return;
    chartContainer.innerHTML = '';

    const hours = [];
    for (let i = 4; i >= 0; i--) {
        const h = hour - i;
        const label = (h < 0 ? h + 24 : h).toString().padStart(2, '0') + ':00';
        hours.push({ label, val: Math.floor(Math.random() * 8) + 2 });
    }

    const maxVal = Math.max(...hours.map(h => h.val), 1);
    const px = 140;
    let html = '<div class="chart-wrap"><div class="chart-bars">';
    hours.forEach((h, idx) => {
        const barH = Math.max(3, (h.val / maxVal) * px);
        html += `<div class="chart-col${idx === hours.length - 1 ? ' chart-bar-last' : ''}" style="--i:${idx}">
            <div class="chart-bar" style="height:${barH}px"><span class="chart-bar-label">${h.val}</span></div>
            <span class="chart-hour">${h.label}</span></div>`;
    });
    html += '</div></div>';
    chartContainer.innerHTML = html;

    logger.log('🔧 Demo stats filled');
}

export { updateStatsWithNumbers, updateStatsFromContent, loadDailyStats, saveDailyStats, renderDailyStats, fillDemoStats };
