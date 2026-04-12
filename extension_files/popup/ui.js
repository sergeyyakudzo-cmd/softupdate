/**
 * Popup UI Module - Визуальные функции и компоненты
 * Вынесено из popup.js для разделения ответственности
 */

const PopupUI = {
    // Предыдущие значения счётчиков для анимации
    previousCounts: { classification: 0, group: 0 },

    // ============ TOAST УВЕДОМЛЕНИЯ ============

    /**
     * Показать toast-уведомление
     */
    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="${icons[type] || icons.info} toast-icon"></i>
            <span class="toast-message">${message}</span>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, duration);
    },

    // ============ COLLAPSIBLE СЕКЦИИ ============

    /**
     * Настроить сворачиваемые секции с сохранением состояния
     */
    setupCollapsibleSections() {
        chrome.storage.local.get(['sectionStates'], (result) => {
            const states = result.sectionStates || {};
            document.querySelectorAll('.collapsible-section').forEach(section => {
                const name = section.dataset.section;
                if (name && states[name] !== undefined) {
                    if (states[name]) {
                        section.classList.add('open');
                    } else {
                        section.classList.remove('open');
                    }
                }
            });
        });
        
        document.querySelectorAll('.collapsible-header').forEach(header => {
            header.addEventListener('click', () => {
                const section = header.closest('.collapsible-section');
                if (section) {
                    section.classList.toggle('open');
                    const name = section.dataset.section;
                    if (name) {
                        chrome.storage.local.get(['sectionStates'], (result) => {
                            const states = result.sectionStates || {};
                            states[name] = section.classList.contains('open');
                            chrome.storage.local.set({ sectionStates: states });
                        });
                    }
                }
            });
        });
    },

    // ============ БЕЙДЖИ И ИНДИКАТОРЫ ============

    /**
     * Обновить бейдж секции звука
     */
    updateSoundSectionBadge(isEnabled) {
        const badge = document.getElementById('soundSectionBadge');
        if (!badge) return;
        
        if (isEnabled) {
            badge.textContent = 'Активно';
            badge.className = 'section-badge success';
        } else {
            badge.textContent = 'Выключено';
            badge.className = 'section-badge secondary';
        }
    },

    /**
     * Обновить статусную кнопку мониторинга
     */
    updateMonitoringButtonState(isMonitoring, button) {
        if (!button) return;
        
        if (isMonitoring) {
            button.classList.add('btn-monitor-active');
        } else {
            button.classList.remove('btn-monitor-active');
        }
    },

    // ============ АНИМАЦИИ СЧЁТЧИКОВ ============

    /**
     * Анимировать изменение счётчика
     */
    animateCounterChange(elementId, newValue, cardId) {
        const element = document.getElementById(elementId);
        const card = document.getElementById(cardId);
        if (!element) return;
        
        const numValue = parseInt(newValue) || 0;
        const prevValue = elementId === 'countText' 
            ? this.previousCounts.classification 
            : this.previousCounts.group;
        
        if (elementId === 'countText') {
            this.previousCounts.classification = numValue;
        } else {
            this.previousCounts.group = numValue;
        }
        
        if (numValue !== prevValue) {
            element.classList.remove('bounce', 'flash');
            void element.offsetWidth;
            element.classList.add('bounce');
            
            setTimeout(() => {
                element.classList.add('flash');
            }, 100);
            
            if (card) {
                card.classList.remove('pulse-alert', 'pulse-success');
                void card.offsetWidth;
                
                if (numValue > prevValue) {
                    card.classList.add('pulse-alert');
                } else if (numValue < prevValue && numValue === 0) {
                    card.classList.add('pulse-success');
                }
            }
            
            setTimeout(() => {
                element.classList.remove('bounce', 'flash');
                if (card) card.classList.remove('pulse-alert', 'pulse-success');
            }, 1200);
        }
    },

    // ============ RIPPLE ЭФФЕКТ ============

    /**
     * Настроить ripple-эффект на кнопках
     */
    setupRippleEffect() {
        document.querySelectorAll('.btn').forEach(button => {
            button.addEventListener('click', function(e) {
                const ripple = document.createElement('span');
                ripple.className = 'ripple';
                
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                
                this.appendChild(ripple);
                
                setTimeout(() => ripple.remove(), 600);
            });
        });
    },

    // ============ МОДАЛЬНЫЕ ОКНА ============

    /**
     * Показать модальное окно с анимацией
     */
    showModal(modalElement) {
        if (!modalElement) return;
        modalElement.style.display = 'flex';
        void modalElement.offsetWidth;
        modalElement.classList.add('show');
    },

    /**
     * Скрыть модальное окно с анимацией
     */
    hideModal(modalElement) {
        if (!modalElement) return;
        modalElement.classList.remove('show');
        setTimeout(() => {
            modalElement.style.display = 'none';
        }, 250);
    },

    // ============ КНОПКИ И ЗАГРУЗКА ============

    /**
     * Установить состояние загрузки кнопки
     */
    setButtonLoading(button, isLoading) {
        if (!button) return;
        if (isLoading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    },

    // ============ ИНДИКАТОРЫ ГРОМКОСТИ ============

    /**
     * Обновить индикаторы уровня громкости
     */
    updateVolumeIndicators(sliderId, indicatorSelector) {
        const slider = document.getElementById(sliderId);
        const indicators = document.querySelectorAll(indicatorSelector);
        if (!slider || !indicators.length) return;
        
        const value = parseInt(slider.value);
        
        indicators.forEach(ind => {
            ind.classList.remove('active');
        });
        
        if (value <= 33) {
            indicators[0]?.classList.add('active');
        } else if (value <= 66) {
            indicators[1]?.classList.add('active');
        } else {
            indicators[2]?.classList.add('active');
        }
    },

    // ============ ПРОГРЕСС-БАР ТАЙМЕРА ============

    /**
     * Обновить прогресс-бар таймера следующей проверки
     */
    updateCheckTimer(lastCheckTimestamp, checkIntervalMs) {
        const bar = document.getElementById('checkTimerBar');
        const progress = document.getElementById('checkTimerProgress');
        const text = document.getElementById('checkTimerText');
        if (!bar || !progress || !text) return;
        
        if (!lastCheckTimestamp) {
            bar.style.display = 'none';
            text.textContent = '';
            return;
        }
        
        bar.style.display = 'block';
        bar.classList.add('active');
        
        const elapsed = Date.now() - lastCheckTimestamp;
        const interval = checkIntervalMs || 10000;
        const pct = Math.min((elapsed / interval) * 100, 100);
        const remaining = Math.max(Math.ceil((interval - elapsed) / 1000), 0);
        
        progress.style.width = pct + '%';
        text.textContent = 'Следующая проверка через ' + remaining + 'с';
    },

    // ============ SPARKLINE ============

    /**
     * Отрендерить sparkline график
     */
    renderSparkline(svgId, data, color) {
        const svg = document.getElementById(svgId);
        if (!svg || data.length < 2) return;
        
        const width = 160;
        const height = 28;
        const padding = 2;
        
        const max = Math.max(...data, 1);
        const min = 0;
        const range = max - min || 1;
        
        const points = data.map((val, i) => {
            const x = padding + (i / (data.length - 1)) * (width - padding * 2);
            const y = height - padding - ((val - min) / range) * (height - padding * 2);
            return { x, y, val };
        });
        
        const linePath = points.map((p, i) => 
            (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1)
        ).join(' ');
        const areaPath = linePath + ` L${points[points.length - 1].x.toFixed(1)},${height} L${points[0].x.toFixed(1)},${height} Z`;
        
        const lastPoint = points[points.length - 1];
        
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.innerHTML = `
            <defs>
                <linearGradient id="sparkGrad_${svgId}" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="${color}" stop-opacity="0.4"/>
                    <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
                </linearGradient>
            </defs>
            <path d="${areaPath}" fill="url(#sparkGrad_${svgId})" />
            <path d="${linePath}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="${lastPoint.x}" cy="${lastPoint.y}" r="2.5" fill="${color}" stroke="white" stroke-width="1.5"/>
        `;
    },

    /**
     * Обновить все sparkline графики
     */
    updateSparklines(classificationHistory, groupHistory) {
        const classContainer = document.getElementById('classificationSparkline');
        const groupContainer = document.getElementById('groupSparkline');
        
        if (classificationHistory.length >= 2) {
            classContainer.style.display = 'block';
            this.renderSparkline('classificationSparkSvg', classificationHistory, '#0041aa');
        }
        
        if (groupHistory.length >= 2) {
            groupContainer.style.display = 'block';
            this.renderSparkline('groupSparkSvg', groupHistory, '#f8371c');
        }
    },

    // ============ СКЕЛЕТОН ЗАГРУЗКИ ============

    /**
     * Убрать скелетон при первой загрузке данных
     */
    removeSkeleton() {
        document.querySelectorAll('.skeleton-text').forEach(el => {
            el.classList.remove('skeleton-text', 'skeleton');
        });
    },

    // ============ СТАТИСТИКА ЗА ДЕНЬ ============

    /**
     * Отрендерить статистику за день
     */
    renderDailyStats(stats) {
        const elements = {
            statTotalToday: document.getElementById('statTotalToday'),
            statPeak: document.getElementById('statPeak'),
            statPeakTime: document.getElementById('statPeakTime'),
            statAvg: document.getElementById('statAvg'),
            statChecks: document.getElementById('statChecks')
        };
        
        if (elements.statTotalToday) elements.statTotalToday.textContent = stats.totalRequests;
        if (elements.statPeak) elements.statPeak.textContent = stats.peakCount;
        if (elements.statPeakTime) elements.statPeakTime.textContent = stats.peakTime || '—';
        if (elements.statChecks) elements.statChecks.textContent = stats.checks;
        if (elements.statAvg) {
            const avg = stats.checks > 0 
                ? (stats.counts.reduce((a, b) => a + b, 0) / stats.checks).toFixed(1) 
                : '0';
            elements.statAvg.textContent = avg;
        }
    },

    // ============ ЭКСПОРТ/ИМПОРТ ============

    /**
     * Экспортировать настройки в JSON файл
     */
    exportSettings() {
        chrome.storage.local.get(null, (data) => {
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = '1c-monitor-settings-' + new Date().toISOString().slice(0, 10) + '.json';
            a.click();
            URL.revokeObjectURL(url);
            this.showToast('Настройки экспортированы', 'success');
        });
    },

    /**
     * Импортировать настройки из JSON файла
     */
    importSettings(callback) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    chrome.storage.local.set(data, () => {
                        this.showToast('Настройки импортированы. Перезагрузите popup.', 'success');
                        setTimeout(() => window.location.reload(), 1500);
                        if (callback) callback();
                    });
                } catch (err) {
                    this.showToast('Ошибка: неверный формат файла', 'error');
                }
            };
            reader.readAsText(file);
        });
        
        input.click();
    },

    // ============ УМНОЕ СВОРАЧИВАНИЕ ============

    /**
     * Настроить умное сворачивание секций
     */
    setupSmartCollapsing(popupOpenCount, sectionOpenCounts, state) {
        chrome.storage.local.get(['sectionOpenCounts', 'popupOpenCount'], (result) => {
            state.sectionOpenCounts = result.sectionOpenCounts || {};
            state.popupOpenCount = (result.popupOpenCount || 0) + 1;
            chrome.storage.local.set({ popupOpenCount: state.popupOpenCount });
            
            // После 3+ открытий — авто-сворачиваем редко используемые
            if (state.popupOpenCount >= 3) {
                document.querySelectorAll('.collapsible-section.open').forEach(section => {
                    const name = section.dataset.section;
                    const opens = state.sectionOpenCounts[name] || 0;
                    if (opens < 2 && name !== 'autoRestart' && name !== 'sound') {
                        section.classList.remove('open');
                    }
                });
            }
        });
        
        // Отслеживаем открытия секций
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
    },

    // ============ FAB MENU ============

    /**
     * Настроить FAB (Floating Action Button) меню
     */
    setupFAB(handlers) {
        const fabButton = document.getElementById('fabButton');
        const fabMenu = document.getElementById('fabMenu');
        
        if (!fabButton || !fabMenu) return;
        
        fabButton.addEventListener('click', () => {
            fabButton.classList.toggle('open');
            fabMenu.classList.toggle('open');
        });
        
        // Закрываем при клике вне FAB
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.fab-container')) {
                fabButton.classList.remove('open');
                fabMenu.classList.remove('open');
            }
        });
        
        // Обработчики
        const fabHandlers = {
            fabToggleMonitor: handlers.toggleMonitoring,
            fabRefresh: handlers.refreshCount,
            fabTestSound: handlers.testSound,
            fabIgnore: handlers.showIgnoreModal
        };
        
        Object.entries(fabHandlers).forEach(([id, handler]) => {
            const el = document.getElementById(id);
            if (el && handler) {
                el.addEventListener('click', () => {
                    handler();
                    fabButton.classList.remove('open');
                    fabMenu.classList.remove('open');
                });
            }
        });
    }
};

// Экспорт
if (typeof window !== 'undefined') {
    window.PopupUI = PopupUI;
}
