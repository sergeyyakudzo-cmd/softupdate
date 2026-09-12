import { state } from './state.js';
import { renderChart } from './utils.js';

function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            const content = document.getElementById('tab-' + tabId);
            if (content) content.classList.add('active');
            if (tabId === 'stats') {
                const container = document.getElementById('hourlyChartContainer');
                if (container) container.dataset.forceRender = 'true';
                renderChart();
            }
        });
    });
}

function setupSmartCollapsing() {
    chrome.storage.local.get(['sectionOpenCounts', 'popupOpenCount'], (result) => {
        state.sectionOpenCounts = result.sectionOpenCounts || {};
        state.popupOpenCount = (result.popupOpenCount || 0) + 1;
        chrome.storage.local.set({ popupOpenCount: state.popupOpenCount });

        if (state.popupOpenCount >= 3) {
            document.querySelectorAll('.collapsible-section.open').forEach(section => {
                const name = section.dataset.section || '';
                const opens = state.sectionOpenCounts[name] || 0;
                if (opens < 2 && name !== 'autoRestart' && name !== 'sound') {
                    section.classList.remove('open');
                }
            });
        }
    });

    document.querySelectorAll('.collapsible-header').forEach(header => {
        header.addEventListener('click', () => {
            const section = header.closest('.collapsible-section');
            if (!section) return;
            const name = section.dataset.section;
            if (!name) return;
            state.sectionOpenCounts[name] = (state.sectionOpenCounts[name] || 0) + 1;
            chrome.storage.local.set({ sectionOpenCounts: state.sectionOpenCounts });
        });
    });
}

function setupPopupResize() {
    const handle = document.getElementById('resizeHandle');
    if (!handle) return;

    let isResizing = false, startX = 0, startY = 0, startW = 0, startH = 0;

    function onStart(e) {
        isResizing = true;
        const rect = document.documentElement.getBoundingClientRect();
        startW = rect.width; startH = rect.height;
        startX = e.clientX; startY = e.clientY;
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onEnd);
    }

    function onMove(e) {
        if (!isResizing) return;
        const w = Math.max(320, Math.min(800, startW + (e.clientX - startX)));
        const h = Math.max(320, Math.min(700, startH + (e.clientY - startY)));
        document.documentElement.style.setProperty('--popup-width', w + 'px');
        document.documentElement.style.setProperty('--popup-height', h + 'px');
    }

    function onEnd() {
        if (!isResizing) return;
        isResizing = false;
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onEnd);
        const w = document.documentElement.style.getPropertyValue('--popup-width');
        const h = document.documentElement.style.getPropertyValue('--popup-height');
        chrome.storage.local.set({ popupWidth: w, popupHeight: h });
    }

    handle.addEventListener('mousedown', onStart);
}

export { initTabs, setupSmartCollapsing, setupPopupResize };
