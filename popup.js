document.addEventListener('DOMContentLoaded', function() {
    logger.logModuleLoad('popup.js');

    // ============ КЭШИРОВАНИЕ ЭЛЕМЕНТОВ ============
    const elements = {
        // Статус и счетчики
        statusText: document.getElementById('statusText'),
        countText: document.getElementById('countText'),
        groupCountText: document.getElementById('groupCountText'),
        lastNotification: document.getElementById('lastNotification'),
        statusIndicator: document.getElementById('statusIndicator'),
        debugNumbers: document.getElementById('debugNumbers'),

        // Кнопки управления
        toggleMonitor: document.getElementById('toggleMonitor'),
        refreshCount: document.getElementById('refreshCount'),
        
        // MAX элементы
        toggleMax: document.getElementById('toggleMax'),
        configureMax: document.getElementById('configureMax'),
        testMax: document.getElementById('testMax'),
        maxStatus: document.getElementById('maxStatus'),
        maxQuickInfo: document.getElementById('maxQuickInfo'),
        
        // Модальное окно MAX
        maxSettingsModal: document.getElementById('maxSettingsModal'),
        maxBotToken: document.getElementById('maxBotToken'),
        showTokenToggle: document.getElementById('showTokenToggle'),
        validateToken: document.getElementById('validateToken'),
        clearToken: document.getElementById('clearToken'),
        tokenValidationStatus: document.getElementById('tokenValidationStatus'),
        maxUserId: document.getElementById('maxUserId'),
        getUserId: document.getElementById('getUserId'),
        clearUserId: document.getElementById('clearUserId'),
        userIdStatus: document.getElementById('userIdStatus'),
        maxMessageTemplate: document.getElementById('maxMessageTemplate'),
        maxGroupMessageTemplate: document.getElementById('maxGroupMessageTemplate'),
        maxSendImmediately: document.getElementById('maxSendImmediately'),
        sendTestMax: document.getElementById('sendTestMax'),
        testMessageStatus: document.getElementById('testMessageStatus'),
        maxConfigStatus: document.getElementById('maxConfigStatus'),
        statusToken: document.getElementById('statusToken'),
        statusUserId: document.getElementById('statusUserId'),
        statusTemplates: document.getElementById('statusTemplates'),
        statusSendMode: document.getElementById('statusSendMode'),
        saveMaxSettings: document.getElementById('saveMaxSettings'),
        clearMaxSettings: document.getElementById('clearMaxSettings'),
        closeMaxSettings: document.getElementById('closeMaxSettings'),
        maxModalClose: document.getElementById('maxModalClose'),
        
        // Прокси для MAX
        maxConnectionType: document.getElementById('maxConnectionType'),
        maxProxyType: document.getElementById('maxProxyType'),
        maxProxyHost: document.getElementById('maxProxyHost'),
        maxProxyPort: document.getElementById('maxProxyPort'),
        maxProxyUsername: document.getElementById('maxProxyUsername'),
        maxProxyPassword: document.getElementById('maxProxyPassword'),
        maxCustomApiUrl: document.getElementById('maxCustomApiUrl'),
        proxyStatus: document.getElementById('proxyStatus'),
        
        // Авто-перезапуск
        toggleAutoRestart: document.getElementById('toggleAutoRestart'),
        autoRestartInterval: document.getElementById('autoRestartInterval'),
        currentAutoRestartInterval: document.getElementById('currentAutoRestartInterval'),
        autoRestartStatus: document.getElementById('autoRestartStatus'),
        
        // Авто-включение звука ночью
        toggleNightAutoEnable: document.getElementById('toggleNightAutoEnable'),
        nightAutoEnableStatus: document.getElementById('nightAutoEnableStatus'),
        nextNightEnableTime: document.getElementById('nextNightEnableTime'),
        
        // Звук и переключатели
        toggleSound: document.getElementById('toggleSound'),
        toggleGroupMonitor: document.getElementById('toggleGroupMonitor'),
        soundStatus: document.querySelector('.sound-status-text'),
        groupMonitorStatus: document.getElementById('groupMonitorStatus'),
        
        // Ползунки громкости
        soundVolumeSlider: document.getElementById('soundVolumeSlider'),
        groupVolumeSlider: document.getElementById('groupVolumeSlider'),
        soundVolumeValue: document.getElementById('soundVolumeValue'),
        groupVolumeValue: document.getElementById('groupVolumeValue'),
        
        // Тесты звука
        testSound: document.getElementById('testSound'),
        testGroupSound: document.getElementById('testGroupSound'),
        
        // Интервалы
        checkInterval: document.getElementById('checkInterval'),
        notificationCooldown: document.getElementById('notificationCooldown'),
        applyIntervals: document.getElementById('applyIntervals'),
        currentCheckInterval: document.getElementById('currentCheckInterval'),
        currentCooldown: document.getElementById('currentCooldown'),
        
        // Кнопки
        showSettings: document.getElementById('showSettings'),
        
        // Модальное окно звуков
        soundSettingsModal: document.getElementById('soundSettingsModal'),
        typeSoundModal: document.getElementById('typeSoundModal'),
        typeVoiceModal: document.getElementById('typeVoiceModal'),
        voiceStatusModal: document.getElementById('voiceStatusModal'),
        voiceVolumeSliderModal: document.getElementById('voiceVolumeSliderModal'),
        voiceVolumeValueModal: document.getElementById('voiceVolumeValueModal'),
        voiceVolumeSection: document.getElementById('voiceVolumeSection'),
        soundSelectionSection: document.getElementById('soundSelectionSection'),
        classificationSoundsModal: document.getElementById('classificationSoundsModal'),
        groupSoundsModal: document.getElementById('groupSoundsModal'),
        saveSettings: document.getElementById('saveSettings'),
        closeSettings: document.getElementById('closeSettings'),

        // Модальное окно игнорирования
        ignoreModal: document.getElementById('ignoreModal'),
        ignoreNumberInput: document.getElementById('ignoreNumberInput'),
        addIgnoreNumberBtn: document.getElementById('addIgnoreNumber'),
        ignoredNumbersList: document.getElementById('ignoredNumbersList'),
        clearIgnoredNumbersBtn: document.getElementById('clearIgnoredNumbers'),
        saveIgnoreSettingsBtn: document.getElementById('saveIgnoreSettings'),
        closeIgnoreModalBtn: document.getElementById('closeIgnoreModal'),
        ignoreModalClose: document.getElementById('ignoreModalClose'),
        ignoredCountSpan: document.getElementById('ignoredCount'),
        ignoreSettingsBtn: document.getElementById('ignoreSettings'),
        notificationThreshold: document.getElementById('notificationThreshold'),
        // Экспорт/импорт
        exportSettingsBtn: document.getElementById('exportSettings'),
        importSettingsBtn: document.getElementById('importSettings'),
        importFileInput: document.getElementById('importFileInput'),
        // Статистика
        statTotalToday: document.getElementById('statTotalToday'),
        statClassification: document.getElementById('statClassification'),
        statGroup: document.getElementById('statGroup'),
        statPeak: document.getElementById('statPeak'),
        statPeakTime: document.getElementById('statPeakTime'),
        // FAB
        fabButton: document.getElementById('fabButton'),
        fabMenu: document.getElementById('fabMenu'),
        fabToggleMonitor: document.getElementById('fabToggleMonitor'),
        fabRefresh: document.getElementById('fabRefresh'),
        fabTestSound: document.getElementById('fabTestSound'),
        fabIgnore: document.getElementById('fabIgnore'),
        // Логи
        downloadLogsBtn: document.getElementById('downloadLogs'),
        clearLogsBtn: document.getElementById('clearLogs'),
        logsInfo: document.getElementById('logsInfo')
    };

    // ============ СОСТОЯНИЕ ПРИЛОЖЕНИЯ ============
    const state = {
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
        
        // Номера заявок для отслеживания новых (для статистики)
        knownApplicationNumbers: {
            classification: [],
            group: []
        },
        
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
        
        // MAX
        maxEnabled: false,
        maxConfigured: false,
        maxSettings: {
            enabled: false,
            botToken: '',
            userId: '',
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
        
        maxModalState: {
            botToken: '',
            userId: '',
            messageTemplate: '🔔 В {time} обнаружено {count} новых заявок на {type}',
            groupMessageTemplate: '👥 В {time} обнаружено {count} задач в группах',
            sendImmediately: true,
            tokenValidated: false,
            userIdObtained: false
        }
    };

    // ============ ИНИЦИАЛИЗАЦИЯ ============
    // Используем Set для хранения ID интервалов
    const intervalIds = new Set();

    function createSafeInterval(fn, ms) {
        const id = setInterval(fn, ms);
        intervalIds.add(id);
        return id;
    }

    function clearSafeInterval(id) {
        if (id) {
            clearInterval(id);
            intervalIds.delete(id);
        }
    }

    // ============ ВИЗУАЛЬНЫЕ УЛУЧШЕНИЯ ============
    
    // --- Toast-уведомления ---
    function showToast(message, type = 'info', duration = 3000) {
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
    }
    
    // --- Collapsible-секции с сохранением состояния ---
    function setupCollapsibleSections() {
        // Загружаем сохранённые состояния
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
                    // Сохраняем состояние
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
    }
    
    // --- Динамические бейджи секций ---
    function updateSoundSectionBadge() {
        const badge = document.getElementById('soundSectionBadge');
        if (!badge) return;
        if (state.isSoundEnabled) {
            badge.textContent = 'Активно';
            badge.className = 'section-badge success';
        } else {
            badge.textContent = 'Выключено';
            badge.className = 'section-badge secondary';
        }
    }
    
    // --- Анимации счётчиков ---
    const previousCounts = { classification: 0, group: 0 };
    
    function animateCounterChange(elementId, newValue, cardId) {
        const element = document.getElementById(elementId);
        const card = document.getElementById(cardId);
        if (!element) return;
        
        const numValue = parseInt(newValue) || 0;
        const prevValue = elementId === 'countText' ? previousCounts.classification : previousCounts.group;
        
        if (elementId === 'countText') {
            previousCounts.classification = numValue;
        } else {
            previousCounts.group = numValue;
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
    }
    
    // --- Ripple-эффект на кнопках ---
    function setupRippleEffect() {
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
    }
    
    // --- Fade-in для модалок ---
    function showModal(modalElement) {
        if (!modalElement) return;
        modalElement.style.display = 'flex';
        void modalElement.offsetWidth;
        modalElement.classList.add('show');
    }
    
    function hideModal(modalElement) {
        if (!modalElement) return;
        modalElement.classList.remove('show');
        setTimeout(() => {
            modalElement.style.display = 'none';
        }, 250);
    }
    
    // --- Loading-состояние кнопок ---
    function setButtonLoading(button, isLoading) {
        if (!button) return;
        if (isLoading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }
    
    // --- Индикаторы уровня громкости ---
    function updateVolumeIndicators(sliderId, indicatorSelector) {
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
    }
    
    // --- Улучшенный статус мониторинга ---
    function updateMonitoringButtonState() {
        const btn = elements.toggleMonitor;
        if (!btn) return;
        
        if (state.isMonitoring) {
            btn.classList.add('btn-monitor-active');
        } else {
            btn.classList.remove('btn-monitor-active');
        }
    }
    
    // --- Убрать скелетон при первой загрузке данных ---
    function removeSkeleton() {
        document.querySelectorAll('.skeleton-text').forEach(el => {
            el.classList.remove('skeleton-text', 'skeleton');
        });
    }
    
    // --- Обновление прогресс-бара таймера ---
    function updateCheckTimer() {
        const bar = document.getElementById('checkTimerBar');
        const progress = document.getElementById('checkTimerProgress');
        const text = document.getElementById('checkTimerText');
        if (!bar || !progress || !text) return;
        
        if (!state.isMonitoring || !state.lastCheckTimestamp) {
            bar.style.display = 'none';
            text.textContent = '';
            return;
        }
        
        bar.style.display = 'block';
        bar.classList.add('active');
        
        const elapsed = Date.now() - state.lastCheckTimestamp;
        const interval = state.checkIntervalMs || 10000;
        const pct = Math.min((elapsed / interval) * 100, 100);
        const remaining = Math.max(Math.ceil((interval - elapsed) / 1000), 0);
        
        progress.style.width = pct + '%';
        text.textContent = 'Следующая проверка через ' + remaining + 'с';
    }
    
    // --- Sparkline рендеринг ---
    function renderSparkline(svgId, data, color) {
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
        
        const linePath = points.map((p, i) => (i === 0 ? 'M' : 'L') + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ');
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
    }
    
    function updateSparklines() {
        const classContainer = document.getElementById('classificationSparkline');
        const groupContainer = document.getElementById('groupSparkline');
        
        if (state.classificationHistory.length >= 2) {
            classContainer.style.display = 'block';
            renderSparkline('classificationSparkSvg', state.classificationHistory, '#0041aa');
        }
        
        if (state.groupHistory.length >= 2) {
            groupContainer.style.display = 'block';
            renderSparkline('groupSparkSvg', state.groupHistory, '#f8371c');
        }
    }
    
    // ============ ТАЙМЕР КОНЦА СМЕНЫ ============
    function updateShiftTimer() {
        const timerEl = document.getElementById('shiftTimer');
        if (!timerEl) return;
        
        const now = new Date();
        const targetTime = new Date(now);
        
        // Следующие 7:00
        targetTime.setHours(7, 0, 0, 0);
        
        if (targetTime <= now) {
            targetTime.setDate(targetTime.getDate() + 1);
        }
        
        const diff = targetTime.getTime() - now.getTime();
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        timerEl.textContent = hours.toString().padStart(2, '0') + ':' + 
                              minutes.toString().padStart(2, '0') + ':' + 
                              seconds.toString().padStart(2, '0');
    }

    // ============ ПОЛУЧЕНИЕ НОМЕРОВ ЗАЯВОК И СТАТИСТИКА ============
    
    /**
     * Получить номера заявок из content script и обновить статистику
      */
    function updateStatsWithNumbers() {
        // Сначала пробуем получить из shiftTracker (работает даже при выключенном мониторинге)
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({ type: 'SHIFT_GET_STATS' }, (response) => {
                if (response && response.success) {
                    // classificationTotal - сколько было ВСЕГО на классификации за смену
                    // groupTotal - сколько было ВСЕГО в группе за смену
                    // currentClassification - сколько сейчас на классификации
                    // currentGroup - сколько сейчас в группах
                    const classificationTotal = response.classificationTotal || 0;
                    const groupTotal = response.groupTotal || 0;
                    const currentClassification = response.currentClassification || 0;
                    const currentGroup = response.currentGroup || 0;
                    
                    logger.log('🔧 Stats: classTotal=' + classificationTotal + ', groupTotal=' + groupTotal + ', currentClass=' + currentClassification + ', currentGroup=' + currentGroup);
                    
                    // Для статистики показываем:
                    // classificationCount - сколько ВСЕГО было на классификации за смену
                    // groupCount - сколько ВСЕГО было в группе за смену
                    state.todayStats.classificationCount = classificationTotal;
                    state.todayStats.groupCount = groupTotal;
                    state.todayStats.totalRequests = classificationTotal + groupTotal;
                    
                    // Обновляем peak если текущее больше
                    const currentTotal = currentClassification + currentGroup;
                    if (currentTotal > state.todayStats.peakCount) {
                        state.todayStats.peakCount = currentTotal;
                        state.todayStats.peakTime = new Date().toLocaleTimeString('ru-RU', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        });
                    }
                    
                    // Сохраняем в storage
                    saveDailyStats();
                    
                    // Рендерим
                    renderDailyStats();
                    resolve();
                } else {
                    // Fallback: пробуем получить из content script
                    resolve(updateStatsFromContent());
                }
            });
        });
    }
    
    // Fallback: получить статистику из content script
    function updateStatsFromContent() {
        if (!state.currentTab) return Promise.resolve();
        
        return sendMessageToContentScript({ type: 'GET_APPLICATION_NUMBERS' })
            .then(response => {
                if (response && response.success) {
                    const classificationCount = (response.classificationNumbers || []).length;
                    const groupCount = (response.groupNumbers || []).length;
                    const totalToday = classificationCount + groupCount;
                    
                    // Сохраняем в state для отображения
                    state.todayStats.classificationCount = classificationCount;
                    state.todayStats.groupCount = groupCount;
                    state.todayStats.totalRequests = totalToday;
                    
                    // Обновляем peak если текущее больше
                    if (totalToday > state.todayStats.peakCount) {
                        state.todayStats.peakCount = totalToday;
                        state.todayStats.peakTime = new Date().toLocaleTimeString('ru-RU', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        });
                    }
                    
                    // Сохраняем в storage
                    saveDailyStats();
                    
                    // Рендерим
                    renderDailyStats();
                }
            })
            .catch(err => {
                logger.log('⚠️ Ошибка получения номеров заявок:', err);
            });
    }

    // ============ ЭКСПОРТ/ИМПОРТ НАСТРОЕК ============
    function exportSettings() {
        chrome.storage.local.get(null, (data) => {
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = '1c-monitor-settings-' + new Date().toISOString().slice(0, 10) + '.json';
            a.click();
            URL.revokeObjectURL(url);
            showToast('Настройки экспортированы', 'success');
        });
    }

    function importSettings() {
        if (elements.importFileInput) elements.importFileInput.click();
    }

    function handleImportFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                chrome.storage.local.set(data, () => {
                    showToast('Настройки импортированы. Перезагрузите popup.', 'success');
                    setTimeout(() => window.location.reload(), 1500);
                });
            } catch (err) {
                showToast('Ошибка: неверный формат файла', 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    // ============ СТАТИСТИКА ЗА ДЕНЬ ============
    // Ключ для хранения в chrome.storage.local
    const STATS_STORAGE_KEY = 'dailyStats';

    function loadDailyStats() {
        return new Promise(resolve => {
            chrome.storage.local.get([STATS_STORAGE_KEY], (result) => {
                const stored = result[STATS_STORAGE_KEY];
                const today = new Date().toDateString();
                
                // Если сохранённые данные за сегодня - загружаем
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
                    // Новый день - сброс
                    state.todayStats = {
                        date: today,
                        totalRequests: 0,
                        classificationCount: 0,
                        groupCount: 0,
                        peakCount: 0,
                        peakTime: null,
                        checks: 0,
                        counts: []
                    };
                }
                resolve();
            });
        });
    }

    function saveDailyStats() {
        chrome.storage.local.set({
            [STATS_STORAGE_KEY]: state.todayStats
        });
    }

    function updateDailyStats(newClassCount, newGroupCount) {
    const stats = state.todayStats;
    const today = new Date().toDateString();
    
    // Проверка на новый день
    if (stats.date !== today) {
        stats.date = today;
        stats.totalRequests = 0;
        stats.classificationCount = 0;
        stats.groupCount = 0;
        stats.peakCount = 0;
        stats.peakTime = null;
        stats.checks = 0;
        stats.counts = [];
    }
    
    // Увеличиваем счётчик проверок
    stats.checks++;
    
    // Добавляем НОВЫЕ заявки (только приращение)
    const newTotal = newClassCount + newGroupCount;
    if (newTotal > 0) {
        stats.totalRequests += newTotal;
        stats.classificationCount += newClassCount;
        stats.groupCount += newGroupCount;
        stats.counts.push(newTotal);
        
        // Обновляем пик
        if (newTotal > stats.peakCount) {
            stats.peakCount = newTotal;
            stats.peakTime = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        }
        
        // Сохраняем в storage
        saveDailyStats();
    }
    
    renderDailyStats();
}

    function renderDailyStats() {
        const stats = state.todayStats;
        if (elements.statTotalToday) elements.statTotalToday.textContent = stats.totalRequests || 0;
        if (elements.statClassification) elements.statClassification.textContent = stats.classificationCount || 0;
        if (elements.statGroup) elements.statGroup.textContent = stats.groupCount || 0;
        if (elements.statPeak) elements.statPeak.textContent = stats.peakCount || 0;
        if (elements.statPeakTime) elements.statPeakTime.textContent = stats.peakTime || '—';
    }

    // ============ УМНОЕ СВОРАЧИВАНИЕ ============
    function setupSmartCollapsing() {
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
    }

    // ============ QUICK-ACTIONS FAB ============
    function setupFAB() {
        if (!elements.fabButton || !elements.fabMenu) return;
        
        elements.fabButton.addEventListener('click', () => {
            elements.fabButton.classList.toggle('open');
            elements.fabMenu.classList.toggle('open');
        });
        
        // Закрываем при клике вне FAB
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.fab-container')) {
                elements.fabButton.classList.remove('open');
                elements.fabMenu.classList.remove('open');
            }
        });
        
        if (elements.fabToggleMonitor) elements.fabToggleMonitor.addEventListener('click', () => {
            toggleMonitoring();
            elements.fabButton.classList.remove('open');
            elements.fabMenu.classList.remove('open');
        });
        if (elements.fabRefresh) elements.fabRefresh.addEventListener('click', () => {
            updateStatus();
            elements.fabButton.classList.remove('open');
            elements.fabMenu.classList.remove('open');
        });
        if (elements.fabTestSound) elements.fabTestSound.addEventListener('click', () => {
            testSoundAlert();
            elements.fabButton.classList.remove('open');
            elements.fabMenu.classList.remove('open');
        });
        if (elements.fabIgnore) elements.fabIgnore.addEventListener('click', () => {
            showIgnoreModal();
            elements.fabButton.classList.remove('open');
            elements.fabMenu.classList.remove('open');
        });
    }

    function initialize() {
        logger.log('🔊 Инициализация монитора...');
        
        // Сначала загружаем данные из storage
        loadDailyStats().then(() => {
            renderDailyStats();
        });
        
        // Получаем статистику из shiftTracker (работает даже при выключенном мониторинге)
        updateStatsWithNumbers();
        
        loadSettings();
        loadMaxSettings();
        setupEventListeners();
        setupIgnoreEventListeners();
        setupCollapsibleSections();
        setupRippleEffect();
        setupSmartCollapsing();
        setupFAB();
        getCurrentTab();
        updateSoundInfo();
        updateIntervalsFromContentScript();
        updateLastNotificationTime();
        updateFooterSessionInfo();
        loadSoundOptions();
        
        // Инициализация индикаторов громкости
        updateVolumeIndicators('soundVolumeSlider', '.volume-level-indicator[data-for="sound"] span');
        updateVolumeIndicators('groupVolumeSlider', '.volume-level-indicator[data-for="group"] span');

        // Периодическое обновление (с автоматической очисткой)
        createSafeInterval(updateSoundInfo, 30000);
        createSafeInterval(updateLastNotificationTime, 60000);
        createSafeInterval(updateStatus, 3000);
        createSafeInterval(updateFooterSessionInfo, 30000);
        createSafeInterval(updateCheckTimer, 1000);
        createSafeInterval(updateStatsWithNumbers, 10000);
        createSafeInterval(updateShiftTimer, 1000);
        
        // Проверка авто-перезапуска
        createSafeInterval(() => {
            if (state.autoRestartEnabled && state.autoRestartTimer === null) {
                startAutoRestartTimer();
            }
        }, 5000);
    }

    // Очистка интервалов при закрытии popup
    window.addEventListener('beforeunload', () => {
        // Сохраняем статистику перед закрытием
        saveDailyStats();
        
        for (const id of intervalIds) {
            clearInterval(id);
        }
        intervalIds.clear();
        if (state.soundDisableTimer) {
            clearTimeout(state.soundDisableTimer);
        }
        if (state.autoRestartTimer) {
            clearInterval(state.autoRestartTimer);
        }
        if (state.nextNightEnableTimer) {
            clearTimeout(state.nextNightEnableTimer);
        }
    });

    // ============ НАСТРОЙКИ ЗВУКА ============
    function loadSettings() {
        chrome.storage.local.get([
            'soundEnabled', 'soundVolumeLevel', 'groupVolumeLevel', 'voiceVolumeLevel',
            'groupMonitoringEnabled', 'checkInterval', 'notificationCooldown',
            'soundDisableEndTime', 'notificationType', 'soundType', 'groupSoundType',
            'autoRestartEnabled', 'autoRestartInterval', 'nightAutoEnableEnabled'
        ], (result) => {
            try {
                // Проверка временного отключения звука
                let soundEnabledFromStorage = result.soundEnabled !== false;
                
                if (result.soundDisableEndTime) {
                    const now = new Date().getTime();
                    if (now < result.soundDisableEndTime) {
                        soundEnabledFromStorage = false;
                    } else {
                        chrome.storage.local.remove('soundDisableEndTime');
                        soundEnabledFromStorage = true;
                    }
                }
                
                state.isSoundEnabled = soundEnabledFromStorage;
                state.isGroupMonitoringEnabled = result.groupMonitoringEnabled === true;
                state.notificationType = result.notificationType || 'sound';
                state.soundType = result.soundType || 'classic';
                state.groupSoundType = result.groupSoundType || 'group_notification';
                state.autoRestartEnabled = result.autoRestartEnabled === true;
                state.autoRestartInterval = result.autoRestartInterval || 30000;
                state.nightAutoEnableEnabled = result.nightAutoEnableEnabled === true;
                
                if (result.checkInterval !== undefined) {
                    state.checkInterval = parseInt(result.checkInterval) || 10000;
                    state.checkIntervalMs = state.checkInterval;
                    if (elements.checkInterval) elements.checkInterval.value = state.checkInterval;
                }
                if (result.notificationCooldown !== undefined) {
                    state.notificationCooldown = parseInt(result.notificationCooldown) || 10000;
                    if (elements.notificationCooldown) elements.notificationCooldown.value = state.notificationCooldown;
                }
                
                state.soundVolume = result.soundVolumeLevel !== undefined ? result.soundVolumeLevel : 80;
                state.groupVolume = result.groupVolumeLevel !== undefined ? result.groupVolumeLevel : 70;
                state.voiceVolume = result.voiceVolumeLevel !== undefined ? result.voiceVolumeLevel : 100;
                state.notificationThreshold = result.notificationThreshold !== undefined ? result.notificationThreshold : 1;
                
                if (elements.soundVolumeSlider) elements.soundVolumeSlider.value = state.soundVolume;
                if (elements.groupVolumeSlider) elements.groupVolumeSlider.value = state.groupVolume;
                if (elements.notificationThreshold) elements.notificationThreshold.value = state.notificationThreshold;
                if (elements.voiceVolumeSliderModal) elements.voiceVolumeSliderModal.value = state.voiceVolume;
                
                if (elements.soundVolumeValue) elements.soundVolumeValue.textContent = state.soundVolume + '%';
                if (elements.groupVolumeValue) elements.groupVolumeValue.textContent = state.groupVolume + '%';
                if (elements.voiceVolumeValueModal) elements.voiceVolumeValueModal.textContent = state.voiceVolume + '%';
                
                updateSoundToggle();
                updateGroupMonitoringToggle();
                updateCurrentIntervalsDisplay();
                updateAutoRestartUI();
                updateNightAutoEnableUI();
                
                if (state.autoRestartEnabled) {
                    startAutoRestartTimer();
                }
                
                logger.log('🔊 Настройки загружены');
            } catch (error) {
                logger.error('🔴 Ошибка загрузки настроек:', error);
            }
        });
    }

    function loadMaxSettings() {
        chrome.storage.local.get([
            'maxEnabled', 'maxMessageTemplate',
            'maxGroupMessageTemplate', 'maxSendImmediately',
            'maxBotToken', 'maxUserId', 'maxProxy'
        ], (result) => {
            try {
                // По умолчанию выключено
                state.maxSettings = {
                    enabled: result.maxEnabled === true,
                    messageTemplate: result.maxMessageTemplate || '🔔 В {time} обнаружено {count} новых заявок на {type}\n📋 Номера: {numbers}',
                    groupMessageTemplate: result.maxGroupMessageTemplate || '👥 В {time} обнаружено {count} задач в группах\n📋 Номера: {numbers}',
                    sendImmediately: result.maxSendImmediately !== false,
                    botToken: result.maxBotToken || '',
                    userId: result.maxUserId || '',
                    proxy: result.maxProxy || {}
                };
                
                state.maxEnabled = state.maxSettings.enabled;
                state.maxConfigured = !!result.maxUserId;
                
                // Заполняем поле User ID если сохранено
                if (elements.maxUserId && result.maxUserId) {
                    elements.maxUserId.value = result.maxUserId;
                }
                
                // Устанавливаем чекбокс из storage
                if (elements.toggleMax) {
                    elements.toggleMax.checked = state.maxEnabled;
                }
                
                updateMaxUI();
                logger.log('🔧 MAX настройки загружены, enabled:', state.maxEnabled);
            } catch (error) {
                logger.error('🔴 Ошибка загрузки настроек MAX:', error);
            }
        });
    }

    function loadSoundOptions() {
        state.soundOptions = [
            // Основные звуки
            { id: 'classic', name: 'Классический', description: 'Стандартный звук уведомления', category: 'main' },
            { id: 'modern', name: 'Современный', description: 'Современный цифровой звук', category: 'main' },
            { id: 'alert', name: 'Тревожный', description: 'Громкий привлекающий внимание', category: 'main' },
            { id: 'soft', name: 'Мягкий', description: 'Тихий ненавязчивый звук', category: 'main' },
            { id: 'game', name: 'Игровой', description: 'Звук из видеоигр', category: 'fun' },
            { id: 'office', name: 'Офисный', description: 'Тихий звук для офиса', category: 'subtle' },
            // Новые звуки
            { id: 'melody', name: 'Мелодия', description: 'Приятная мелодия', category: 'fun' },
            { id: 'beep', name: 'Бип', description: 'Простой короткий бип', category: 'simple' },
            { id: 'chime', name: 'Колокольчик', description: 'Звонкий колокольчик', category: 'notification' },
            { id: 'notification', name: 'Уведомление', description: 'Стандартное уведомление', category: 'notification' },
            { id: 'pop', name: 'Всплывающий', description: 'Мягкий всплывающий звук', category: 'subtle' },
            { id: 'success', name: 'Успех', description: 'Звук успешного действия', category: 'notification' },
            { id: 'error', name: 'Ошибка', description: 'Звук ошибки', category: 'alert' },
            { id: 'click', name: 'Клик', description: 'Звук щелчка', category: 'subtle' }
        ];
        
        state.groupSoundOptions = [
            ...state.soundOptions,
            { id: 'group_chime', name: 'Колокольчик', description: 'Мягкий колокольчик для групп', category: 'group' },
            { id: 'group_notification', name: 'Групповое уведомление', description: 'Отдельный звук для групповых задач', category: 'group' },
            { id: 'group_bell', name: 'Звонок', description: 'Громкий звонок для групп', category: 'group' },
            { id: 'group_ding', name: 'Динь', description: 'Легкий звук динь', category: 'group' }
        ];
        
        state.modalState = {
            notificationType: state.notificationType,
            soundType: state.soundType,
            groupSoundType: state.groupSoundType,
            voiceVolume: state.voiceVolume
        };
    }

    // ============ ОБРАБОТЧИКИ СОБЫТИЙ ============
    function setupEventListeners() {
        // Основные кнопки
        if (elements.toggleMonitor) elements.toggleMonitor.addEventListener('click', toggleMonitoring);
        if (elements.refreshCount) elements.refreshCount.addEventListener('click', updateStatus);
        if (elements.debugNumbers) elements.debugNumbers.addEventListener('click', debugNumbersHandler);

        // Telegram кнопки (оставлено для совместимости с модальным окном, если нужно)
        // if (elements.toggleTelegram) elements.toggleTelegram.addEventListener('change', toggleTelegramHandler);
        // if (elements.configureTelegram) {
        //     elements.configureTelegram.addEventListener('click', () => showTelegramSettings());
        // }
        // if (elements.testTelegram) elements.testTelegram.addEventListener('click', testTelegramAlert);
        
        // Сохранение User ID при вводе
        if (elements.maxUserId) {
            elements.maxUserId.addEventListener('change', saveMaxUserId);
            elements.maxUserId.addEventListener('blur', saveMaxUserId);
        }
        
        // MAX кнопки
        if (elements.toggleMax) elements.toggleMax.addEventListener('change', toggleMaxHandler);
        if (elements.configureMax) {
            elements.configureMax.addEventListener('click', () => sendTestMaxMessage());
        }
        
        // Модальное окно MAX
        if (elements.closeMaxSettings) {
            elements.closeMaxSettings.addEventListener('click', hideMaxSettings);
        }
        if (elements.maxModalClose) {
            elements.maxModalClose.addEventListener('click', hideMaxSettings);
        }
        
        if (elements.maxSettingsModal) {
            elements.maxSettingsModal.addEventListener('click', (event) => {
                if (event.target === elements.maxSettingsModal) {
                    hideMaxSettings();
                }
            });
        }
        if (elements.maxModalClose) {
            elements.maxModalClose.addEventListener('click', hideMaxSettings);
        }
        
        if (elements.maxSettingsModal) {
            elements.maxSettingsModal.addEventListener('click', (event) => {
                if (event.target === elements.maxSettingsModal) {
                    hideTelegramSettings();
                }
            });
        }
        
        if (elements.saveTelegramSettings) elements.saveTelegramSettings.addEventListener('click', saveTelegramSettings);
        if (elements.clearTelegramSettings) elements.clearTelegramSettings.addEventListener('click', clearTelegramSettings);
        if (elements.sendTestTelegram) elements.sendTestTelegram.addEventListener('click', sendTestTelegramMessage);
        
        // Переключение типа подключения
        if (elements.telegramConnectionType) {
            elements.telegramConnectionType.addEventListener('change', () => {
                const type = elements.telegramConnectionType.value;
                const proxySettings = document.getElementById('proxySettings');
                const customApiSettings = document.getElementById('customApiSettings');
                
                if (proxySettings) proxySettings.style.display = type === 'proxy' ? 'block' : 'none';
                if (customApiSettings) customApiSettings.style.display = type === 'custom' ? 'block' : 'none';
            });
        }
        
        // Авто-перезапуск
        if (elements.toggleAutoRestart) elements.toggleAutoRestart.addEventListener('change', toggleAutoRestartHandler);
        if (elements.autoRestartInterval) elements.autoRestartInterval.addEventListener('change', updateAutoRestartInterval);
        
        // Авто-включение звука ночью
        if (elements.toggleNightAutoEnable) elements.toggleNightAutoEnable.addEventListener('change', toggleNightAutoEnableHandler);
        
        // Переключатели
        if (elements.toggleSound) elements.toggleSound.addEventListener('change', toggleSoundHandler);
        if (elements.toggleGroupMonitor) elements.toggleGroupMonitor.addEventListener('change', toggleGroupMonitoringHandler);
        
        // Ползунки громкости
        if (elements.soundVolumeSlider) elements.soundVolumeSlider.addEventListener('input', updateSoundVolume);
        if (elements.groupVolumeSlider) elements.groupVolumeSlider.addEventListener('input', updateGroupVolume);
        if (elements.notificationThreshold) elements.notificationThreshold.addEventListener('change', updateNotificationThreshold);
        
        // Empty state refresh
        if (elements.emptyRefresh) elements.emptyRefresh.addEventListener('click', () => {
            getCurrentTab();
        });
        
        if (elements.importFileInput) elements.importFileInput.addEventListener('change', handleImportFile);
        if (elements.exportSettingsBtn) elements.exportSettingsBtn.addEventListener('click', exportSettings);
        if (elements.importSettingsBtn) elements.importSettingsBtn.addEventListener('click', importSettings);
        
        // Логи
        if (elements.downloadLogsBtn) elements.downloadLogsBtn.addEventListener('click', downloadLogs);
        if (elements.clearLogsBtn) elements.clearLogsBtn.addEventListener('click', clearLogs);
        updateLogsInfo();
        
        // Горячие клавиши (через chrome.commands — обрабатываются в background.js)
        chrome.runtime.onMessage.addListener((message) => {
            if (message.type === 'KEYBOARD_COMMAND') {
                if (message.command === 'toggle-monitor') toggleMonitoring();
                if (message.command === 'refresh-count') updateStatus();
            }
        });
        
        // Тесты звука
        if (elements.testSound) elements.testSound.addEventListener('click', testSoundAlert);
        if (elements.testGroupSound) elements.testGroupSound.addEventListener('click', testGroupSoundAlert);
        
        // Интервалы
        if (elements.checkInterval) elements.checkInterval.addEventListener('change', updateCurrentIntervalsDisplay);
        if (elements.notificationCooldown) elements.notificationCooldown.addEventListener('change', updateCurrentIntervalsDisplay);
        if (elements.applyIntervals) elements.applyIntervals.addEventListener('click', applyIntervals);
        
        // Дополнительные кнопки
        if (elements.showSettings) elements.showSettings.addEventListener('click', showSoundSettings);
        if (elements.ignoreSettingsBtn) elements.ignoreSettingsBtn.addEventListener('click', showIgnoreModal);
        
        // Модальное окно звуков
        if (elements.soundSettingsModal) {
            const modalClose = elements.soundSettingsModal.querySelector('.modal-close');
            if (modalClose) {
                modalClose.addEventListener('click', () => {
                    elements.soundSettingsModal.style.display = 'none';
                });
            }
            
            if (elements.closeSettings) {
                elements.closeSettings.addEventListener('click', () => {
                    elements.soundSettingsModal.style.display = 'none';
                });
            }
            
            elements.soundSettingsModal.addEventListener('click', (event) => {
                if (event.target === elements.soundSettingsModal) {
                    elements.soundSettingsModal.style.display = 'none';
                }
            });
        }
        
        if (elements.saveSettings) elements.saveSettings.addEventListener('click', saveSoundSettings);
        
        document.querySelectorAll('.type-option-modal').forEach(option => {
            option.addEventListener('click', () => {
                const type = option.dataset.type;
                updateModalNotificationType(type);
            });
        });
        
        updateButtonIcons();
    }

    // ============ ОБРАБОТЧИКИ ИГНОРИРОВАНИЯ ============
    function setupIgnoreEventListeners() {
        if (!elements.ignoreSettingsBtn || !elements.ignoreModal) {
            logger.log('⚠️ Элементы игнорирования не найдены');
            return;
        }

        // Открытие модального окна
        elements.ignoreSettingsBtn.addEventListener('click', () => {
            showIgnoreModal();
        });

        // Кнопка добавления номера
        if (elements.addIgnoreNumberBtn) {
            elements.addIgnoreNumberBtn.addEventListener('click', addIgnoreNumber);
        }

        // Кнопка очистки всех номеров
        if (elements.clearIgnoredNumbersBtn) {
            elements.clearIgnoredNumbersBtn.addEventListener('click', clearAllIgnoredNumbers);
        }

        // Кнопка сохранения
        if (elements.saveIgnoreSettingsBtn) {
            elements.saveIgnoreSettingsBtn.addEventListener('click', saveIgnoreSettings);
        }

        // Кнопки закрытия
        if (elements.closeIgnoreModalBtn) {
            elements.closeIgnoreModalBtn.addEventListener('click', closeIgnoreModal);
        }

        if (elements.ignoreModalClose) {
            elements.ignoreModalClose.addEventListener('click', closeIgnoreModal);
        }

        // Закрытие по клику вне окна
        elements.ignoreModal.addEventListener('click', (event) => {
            if (event.target === elements.ignoreModal) {
                closeIgnoreModal();
            }
        });

        // Обработка Enter в поле ввода
        if (elements.ignoreNumberInput) {
            elements.ignoreNumberInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    addIgnoreNumber();
                }
            });
        }
    }

    function showIgnoreModal() {
        const modal = elements.ignoreModal;
        if (!modal) return;
        
        // Используем стандартный showModal с fade-in
        showModal(modal);
        loadAndDisplayIgnoredNumbers();
    }

    function closeIgnoreModal() {
        const modal = elements.ignoreModal;
        if (modal) hideModal(modal);
        
        const overlay = document.getElementById('ignoreModalOverlay');
        if (overlay) overlay.remove();
    }

    function addIgnoreNumber() {
        if (!elements.ignoreNumberInput) return;
        
        let number = elements.ignoreNumberInput.value.trim();
        
        if (!number) {
            alert('Введите номер заявки');
            return;
        }
        
        // Обработка разных форматов
        if (number.toUpperCase().startsWith('HD') && number.length === 14) {
            number = number.substring(2, 11); // HD + 9 цифр
        }
        
        if (!/^\d+$/.test(number)) {
            alert('Номер должен содержать только цифры');
            return;
        }
        
        if (number.length !== 9) {
            if (!confirm(`Номер ${number} имеет ${number.length} цифр. Обычно 9. Добавить?`)) {
                return;
            }
        }
        
        chrome.storage.local.get(['ignoredNumbers'], (result) => {
            const numbers = result.ignoredNumbers || [];
            
            if (numbers.includes(number)) {
                alert('Этот номер уже добавлен');
                return;
            }
            
            numbers.push(number);
            
            chrome.storage.local.set({ ignoredNumbers: numbers }, () => {
                elements.ignoreNumberInput.value = '';
                updateIgnoredNumbersList(numbers);
                sendToContentScript(numbers);
                logger.log('✅ Номер добавлен:', number);
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
                    logger.log('✅ Список очищен');
                });
            }
        });
    }

    function saveIgnoreSettings() {
        closeIgnoreModal();
    }

    function loadAndDisplayIgnoredNumbers() {
        chrome.storage.local.get(['ignoredNumbers'], (result) => {
            const numbers = result.ignoredNumbers || [];
            updateIgnoredNumbersList(numbers);
        });
    }

    function updateIgnoredNumbersList(numbers) {
        if (!elements.ignoredNumbersList) return;
        
        elements.ignoredNumbersList.innerHTML = '';
        
        if (numbers.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.style.cssText = 'text-align: center; color: #999; padding: 20px;';
            emptyMsg.textContent = 'Нет игнорируемых номеров';
            elements.ignoredNumbersList.appendChild(emptyMsg);
        } else {
            numbers.forEach(num => {
                const item = document.createElement('div');
                item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 8px; margin: 5px 0; background: #f8f9fa; border-radius: 4px;';
                
                const span = document.createElement('span');
                span.style.fontFamily = 'monospace';
                span.textContent = num; // безопасно от XSS
                
                const btn = document.createElement('button');
                btn.className = 'remove-ignore-btn';
                btn.dataset.number = num;
                btn.style.cssText = 'background: none; border: none; color: #dc3545; cursor: pointer; font-size: 18px;';
                btn.textContent = '×'; // безопасно от XSS
                
                item.appendChild(span);
                item.appendChild(btn);
                elements.ignoredNumbersList.appendChild(item);
            });
            
            // Обработчики удаления
            document.querySelectorAll('.remove-ignore-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const numToRemove = btn.dataset.number;
                    removeIgnoredNumber(numToRemove);
                });
            });
        }
        
        if (elements.ignoredCountSpan) {
            elements.ignoredCountSpan.textContent = numbers.length;
        }
    }

    function removeIgnoredNumber(numberToRemove) {
        chrome.storage.local.get(['ignoredNumbers'], (result) => {
            const numbers = result.ignoredNumbers || [];
            const newNumbers = numbers.filter(num => num !== numberToRemove);
            
            chrome.storage.local.set({ ignoredNumbers: newNumbers }, () => {
                updateIgnoredNumbersList(newNumbers);
                sendToContentScript(newNumbers);
            });
        });
    }

    function sendToContentScript(numbers) {
        if (!state.currentTab) return;
        
        chrome.tabs.sendMessage(state.currentTab.id, {
            type: 'UPDATE_IGNORED_NUMBERS',
            numbers: numbers
        }, (response) => {
            if (chrome.runtime.lastError) {
                logger.log('⚠️ Content script не готов');
            }
        });
    }

    // ============ ОСНОВНЫЕ ФУНКЦИИ ============
    function getCurrentTab() {
        // Ищем вкладку с 1С по точному URL
        chrome.tabs.query({ url: 'https://2phoenix.alidi.ru/*' }, (tabs) => {
            if (tabs && tabs[0]) {
                state.currentTab = tabs[0];
                updateStatus();
            } else {
                // Если не найдена, пробуем активную вкладку
                chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
                    if (activeTabs && activeTabs[0]) {
                        state.currentTab = activeTabs[0];
                        updateStatus();
                    } else {
                        setStatus('Откройте страницу 1С', '0', '0', false);
                    }
                });
            }
        });
    }

    function sendMessageToContentScript(message) {
        return new Promise((resolve, reject) => {
            if (!state.currentTab) {
                reject(new Error('No active tab'));
                return;
            }

            chrome.tabs.sendMessage(state.currentTab.id, message, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error('Content script not ready'));
                } else {
                    resolve(response);
                }
            });
        });
    }

    function updateStatus() {
        if (!state.currentTab) {
            setStatus('Откройте страницу 1С', '0', '0', false);
            return;
        }

        sendMessageToContentScript({type: 'GET_STATUS'})
            .then(response => {
                if (response && !response.error) {
                    setStatus(response.status, response.count, response.groupCount, response.isMonitoring);
                    state.isGroupMonitoringEnabled = response.isGroupMonitoring;
                    state.notificationType = response.notificationType || 'sound';
                    state.soundType = response.soundType || 'classic';
                    state.groupSoundType = response.groupSoundType || 'group_notification';
                    state.maxEnabled = response.maxEnabled || false;
                    state.maxConfigured = response.maxConfigured || false;
                    
                    updateVoiceStatus(response.voiceAvailable);
                    
                    if (response.checkInterval) {
                        state.checkInterval = response.checkInterval;
                        if (elements.checkInterval) elements.checkInterval.value = state.checkInterval;
                    }
                    if (response.notificationCooldown) {
                        state.notificationCooldown = response.notificationCooldown;
                        if (elements.notificationCooldown) elements.notificationCooldown.value = state.notificationCooldown;
                    }
                    
                    updateGroupMonitoringToggle();
                    updateCurrentIntervalsDisplay();
                    updateNightAutoEnableUI();
                    updateMaxUI();
                    
                    state.lastUpdate = new Date();
                    updateLastNotificationTime();
                    
                    if (state.autoRestartEnabled && !response.isMonitoring) {
                        autoRestartMonitoring();
                    }
                } else {
                    setStatus('Обновите страницу 1С', '0', '0', false);
                }
            })
            .catch(() => {
                setStatus('Обновите страницу 1С', '0', '0', false);
            });
    }

    function setStatus(status, count, groupCount, monitoring) {
        const container = document.querySelector('.container');
        const isEmpty = status && status.includes('Обновите') && !state.currentTab;
        
        if (container) {
            if (isEmpty) {
                container.classList.add('empty-mode');
            } else {
                container.classList.remove('empty-mode');
            }
        }
        
        if (elements.statusText) elements.statusText.textContent = status || 'Неизвестно';
        
        const classCount = count || '0';
        const grpCount = groupCount || '0';
        
        if (elements.countText) elements.countText.textContent = classCount;
        if (elements.groupCountText) elements.groupCountText.textContent = grpCount;
        
        // Убираем скелетон при первой загрузке
        removeSkeleton();
        
        // Анимации счётчиков при изменении
        animateCounterChange('countText', classCount, 'classificationCard');
        animateCounterChange('groupCountText', grpCount, 'groupCard');
        
        // Обновляем счётчик сессии
        state.sessionTotalRequests++;
        state.lastCheckTime = Date.now();
        state.lastCheckTimestamp = Date.now();
        
        // Обновляем историю для sparkline
        const classNum = parseInt(classCount) || 0;
        const grpNum = parseInt(grpCount) || 0;
        state.classificationHistory.push(classNum);
        state.groupHistory.push(grpNum);
        if (state.classificationHistory.length > state.maxHistoryLength) state.classificationHistory.shift();
        if (state.groupHistory.length > state.maxHistoryLength) state.groupHistory.shift();
        updateSparklines();
        
        // Обновляем статистику на основе реальных номеров заявок
        // Вызываем асинхронно, чтобы не блокировать UI
        updateStatsWithNumbers();
        
        // Обновляем таймер
        updateCheckTimer();
        
        // Проверяем порог для toast-уведомления
        const threshold = state.notificationThreshold || 1;
        const classDiff = classNum - state.lastNotifiedCount.classification;
        const grpDiff = grpNum - state.lastNotifiedCount.group;
        if (classDiff >= threshold && classDiff > 0) {
            showToast('+' + classDiff + ' новых заявок', 'warning', 2000);
        }
        if (grpDiff >= threshold && grpDiff > 0) {
            showToast('+' + grpDiff + ' новых задач в группах', 'info', 2000);
        }
        state.lastNotifiedCount.classification = classNum;
        state.lastNotifiedCount.group = grpNum;
        
        if (elements.statusIndicator) {
            elements.statusIndicator.className = 'status-indicator ' + (monitoring ? 'active' : 'inactive');
        }
        
        // Обновляем статус-точку в футере
        const footerDot = document.getElementById('footerStatusDot');
        if (footerDot) {
            footerDot.className = 'status-dot' + (status && status.includes('Обновите') ? ' error' : '');
        }
        
        state.isMonitoring = monitoring !== undefined ? monitoring : false;
        updateButtonIcons();
        updateMonitoringButtonState();
        updateFooterSessionInfo();
    }

    function updateButtonIcons() {
        if (!elements.toggleMonitor) return;
        
        const toggleIcon = elements.toggleMonitor.querySelector('i');
        const toggleText = elements.toggleMonitor.querySelector('span');
        
        if (state.isMonitoring) {
            toggleIcon.className = 'fas fa-stop';
            toggleText.textContent = 'Остановить';
            elements.toggleMonitor.classList.remove('btn-primary');
            elements.toggleMonitor.classList.add('btn-danger');
        } else {
            toggleIcon.className = 'fas fa-play';
            toggleText.textContent = 'Запуск мониторинга';
            elements.toggleMonitor.classList.remove('btn-danger');
            elements.toggleMonitor.classList.add('btn-primary');
        }
    }

    function toggleMonitoring() {
        if (!state.currentTab) {
            alert('Сначала откройте страницу 1С');
            return;
        }

        sendMessageToContentScript({type: 'TOGGLE_MONITOR'})
            .then(response => {
                if (response && !response.error) {
                    setStatus(response.status, response.count, response.groupCount, response.isMonitoring);
                    showToast(
                        response.isMonitoring ? 'Мониторинг запущен' : 'Мониторинг остановлен',
                        response.isMonitoring ? 'success' : 'warning'
                    );
                } else {
                    alert('Сначала перейдите на страницу 1С и обновите её');
                }
            })
            .catch(() => {
                alert('Ошибка: Обновите страницу 1С');
            });
    }

    // ============ ФУНКЦИИ ОБНОВЛЕНИЯ UI ============
    function updateSoundInfo() {
        if (!state.currentTab) return;

        sendMessageToContentScript({type: 'GET_SOUND_INFO'})
            .then(response => {
                if (response && !response.error) {
                    state.soundInfo = response;
                    state.isSoundEnabled = response.enabled;
                    state.notificationType = response.notificationType || 'sound';
                    state.soundType = response.soundType || 'classic';
                    state.groupSoundType = response.groupSoundType || 'group_notification';
                    
                    updateVoiceStatus(response.voiceAvailable);
                    updateSoundToggle();
                    
                    if (!response.enabled && response.timeLeft) {
                        const minutes = Math.ceil(response.timeLeft / 60000);
                        const seconds = Math.ceil((response.timeLeft % 60000) / 1000);
                        
                        if (elements.soundStatus) {
                            elements.soundStatus.textContent = minutes > 0 ? `Включится через ${minutes} мин` : `Включится через ${seconds} сек`;
                            elements.soundStatus.style.color = '#ff9800';
                        }
                        
                        if (state.soundDisableTimer) {
                            clearTimeout(state.soundDisableTimer);
                        }
                        
                        const updateDelay = Math.min(response.timeLeft, 1000);
                        if (updateDelay > 0) {
                            state.soundDisableTimer = setTimeout(() => updateSoundInfo(), updateDelay);
                        }
                    }
                }
            })
            .catch(() => {});
    }

    function updateSoundToggle() {
        if (!elements.toggleSound) return;
        
        elements.toggleSound.checked = state.isSoundEnabled;
        
        if (elements.soundStatus) {
            if (state.isSoundEnabled) {
                elements.soundStatus.textContent = 'Звук включен';
                elements.soundStatus.style.color = '#4CAF50';
            } else {
                if (state.soundInfo && state.soundInfo.timeLeft) {
                    const minutes = Math.ceil(state.soundInfo.timeLeft / 60000);
                    elements.soundStatus.textContent = minutes > 0 ? `Включится через ${minutes} мин` : 'Включится скоро';
                    elements.soundStatus.style.color = '#ff9800';
                } else {
                    elements.soundStatus.textContent = 'Звук выключен';
                    elements.soundStatus.style.color = '#666';
                }
            }
        }
    }

    function updateGroupMonitoringToggle() {
        if (!elements.toggleGroupMonitor) return;
        
        elements.toggleGroupMonitor.checked = state.isGroupMonitoringEnabled;
        
        if (elements.groupMonitorStatus) {
            elements.groupMonitorStatus.textContent = state.isGroupMonitoringEnabled ? 'Мониторинг групп активен' : 'Мониторинг групп выключен';
            elements.groupMonitorStatus.style.color = state.isGroupMonitoringEnabled ? '#2196F3' : '#666';
        }
    }

    function updateMaxUI() {
        if (!elements.toggleMax) return;
        
        // Не перезаписываем чекбокс - пользователь сам управляет
        // Но загружаем текущее состояние
        if (elements.maxStatus) {
            if (state.maxEnabled) {
                if (state.maxConfigured) {
                    elements.maxStatus.textContent = 'MAX настроен и активен';
                    elements.maxStatus.style.color = '#4CAF50';
                } else {
                    elements.maxStatus.textContent = 'MAX включен, но не настроен';
                    elements.maxStatus.style.color = '#ff9800';
                }
            } else {
                elements.maxStatus.textContent = 'MAX выключен';
                elements.maxStatus.style.color = '#666';
            }
        }
        
        if (elements.maxQuickInfo) {
            elements.maxQuickInfo.innerHTML = state.maxConfigured ? 'Настройки сохранены' : 'Введите User ID для получения уведомлений';
        }
    }

    function updateCurrentIntervalsDisplay() {
        if (!elements.checkInterval || !elements.notificationCooldown) return;
        
        const checkInterval = parseInt(elements.checkInterval.value) || 10000;
        const cooldown = parseInt(elements.notificationCooldown.value) || 10000;
        
        if (elements.currentCheckInterval) elements.currentCheckInterval.textContent = Math.round(checkInterval / 1000);
        if (elements.currentCooldown) elements.currentCooldown.textContent = Math.round(cooldown / 1000);
    }

    function updateAutoRestartUI() {
        if (!elements.toggleAutoRestart) return;
        
        elements.toggleAutoRestart.checked = state.autoRestartEnabled;
        
        if (elements.autoRestartInterval) {
            elements.autoRestartInterval.value = state.autoRestartInterval;
        }
        
        if (elements.currentAutoRestartInterval) {
            elements.currentAutoRestartInterval.textContent = Math.round(state.autoRestartInterval / 1000);
        }
        
        if (elements.autoRestartStatus) {
            if (state.autoRestartEnabled) {
                elements.autoRestartStatus.textContent = 'Активно - перезапуск каждые ' + Math.round(state.autoRestartInterval / 1000) + ' сек';
                elements.autoRestartStatus.style.color = '#10b981';
            } else {
                elements.autoRestartStatus.textContent = 'Не активно';
                elements.autoRestartStatus.style.color = '#666';
            }
        }
    }

    function updateNightAutoEnableUI() {
        if (!elements.toggleNightAutoEnable) return;
        
        elements.toggleNightAutoEnable.checked = state.nightAutoEnableEnabled;
        
        if (elements.nightAutoEnableStatus) {
            if (state.nightAutoEnableEnabled) {
                elements.nightAutoEnableStatus.textContent = 'Авто-включение активно (22:00-7:00)';
                elements.nightAutoEnableStatus.style.color = '#4CAF50';
                updateNextNightEnableTime();
            } else {
                elements.nightAutoEnableStatus.textContent = 'Авто-включение выключено';
                elements.nightAutoEnableStatus.style.color = '#666';
                if (elements.nextNightEnableTime) elements.nextNightEnableTime.textContent = '';
            }
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
                
                if (state.modalState.notificationType === 'voice') {
                    updateModalNotificationType('sound');
                }
            }
        }
    }

    function updateLastNotificationTime() {
        if (!state.lastUpdate || !elements.lastNotification) return;
        
        const now = new Date();
        const diff = Math.floor((now - state.lastUpdate) / 1000);
        
        let text = '—';
        if (diff < 60) {
            text = `${diff} сек назад`;
        } else if (diff < 3600) {
            text = `${Math.floor(diff / 60)} мин назад`;
        } else {
            text = `${Math.floor(diff / 3600)} ч назад`;
        }
        
        elements.lastNotification.textContent = text;
    }

    // --- Обновление информации о сессии в футере ---
    function updateFooterSessionInfo() {
        const el = document.getElementById('footerSessionInfo');
        if (!el) return;
        
        const elapsed = Date.now() - state.sessionStart;
        const minutes = Math.floor(elapsed / 60000);
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        
        let timeStr;
        if (hours > 0) {
            timeStr = hours + ':' + mins.toString().padStart(2, '0');
        } else {
            timeStr = mins + ':00';
        }
        
        const reqs = state.sessionTotalRequests;
        el.textContent = 'Сессия: ' + reqs + ' запросов • ' + timeStr;
    }

    function updateNextNightEnableTime() {
        if (!state.nightAutoEnableEnabled || !elements.nextNightEnableTime) return;
        
        const now = new Date();
        const nextHour = (now.getHours() + 1) % 24;
        const isNightTime = nextHour >= 22 || nextHour < 7;
        
        if (isNightTime) {
            elements.nextNightEnableTime.textContent = `След. включение: ${nextHour.toString().padStart(2, '0')}:00`;
        } else {
            elements.nextNightEnableTime.textContent = 'След. включение: только ночью';
        }
    }

    // ============ ОБРАБОТЧИКИ СОБЫТИЙ ============
    function toggleSoundHandler() {
        if (state.isSoundEnabled) {
            sendMessageToContentScript({type: 'SET_SOUND_SETTING', soundEnabled: false})
                .then(response => {
                    if (response && response.success) {
                        state.isSoundEnabled = false;
                        if (response.reason === 'night_time_limit') {
                            showToast('Звук отключён на ' + response.duration + ' мин', 'warning');
                        } else {
                            showToast('Звук выключен', 'warning');
                        }
                        updateSoundInfo();
                        updateSoundToggle();
                        updateSoundSectionBadge();
                    }
                })
                .catch(() => alert('Ошибка: Обновите страницу 1С'));
        } else {
            sendMessageToContentScript({type: 'ENABLE_SOUND'})
                .then(response => {
                    if (response && response.success) {
                        state.isSoundEnabled = true;
                        showToast('Звук включён', 'success');
                        updateSoundToggle();
                        updateSoundInfo();
                        updateSoundSectionBadge();
                        if (state.soundDisableTimer) {
                            clearTimeout(state.soundDisableTimer);
                            state.soundDisableTimer = null;
                        }
                    }
                })
                .catch(() => alert('Ошибка: Обновите страницу 1С'));
        }
    }

    function toggleGroupMonitoringHandler() {
        state.isGroupMonitoringEnabled = !state.isGroupMonitoringEnabled;
        updateGroupMonitoringToggle();
        
        if (!state.currentTab) {
            alert('Сначала откройте страницу 1С');
            return;
        }

        sendMessageToContentScript({type: 'TOGGLE_GROUP_MONITOR'})
            .then(response => {
                if (response && !response.error) {
                    setStatus(response.status, response.count, response.groupCount, response.isMonitoring);
                    showToast(
                        state.isGroupMonitoringEnabled ? 'Мониторинг групп включён' : 'Мониторинг групп выключен',
                        state.isGroupMonitoringEnabled ? 'success' : 'info'
                    );
                }
            })
            .catch(() => alert('Ошибка: Обновите страницу 1С'));
    }

    function toggleAutoRestartHandler() {
        state.autoRestartEnabled = !state.autoRestartEnabled;
        chrome.storage.local.set({ autoRestartEnabled: state.autoRestartEnabled });
        
        if (state.autoRestartEnabled) {
            startAutoRestartTimer();
            showToast('Авто-перезапуск активирован', 'success');
        } else {
            stopAutoRestartTimer();
            showToast('Авто-перезапуск отключён', 'warning');
        }
        
        updateAutoRestartUI();
    }

    function updateAutoRestartInterval() {
        const interval = parseInt(elements.autoRestartInterval.value) || 30000;
        state.autoRestartInterval = interval;
        chrome.storage.local.set({ autoRestartInterval: interval });
        
        if (elements.currentAutoRestartInterval) {
            elements.currentAutoRestartInterval.textContent = Math.round(interval / 1000);
        }
        
        if (state.autoRestartEnabled) {
            startAutoRestartTimer();
        }
    }

    function toggleNightAutoEnableHandler() {
        const enabled = elements.toggleNightAutoEnable.checked;
        
        if (!state.currentTab) {
            alert('Сначала откройте страницу 1С');
            elements.toggleNightAutoEnable.checked = !enabled;
            return;
        }
        
        sendMessageToContentScript({
            type: 'TOGGLE_NIGHT_AUTO_ENABLE',
            enabled: enabled
        })
        .then(response => {
            if (response && response.success !== false) {
                state.nightAutoEnableEnabled = enabled;
                chrome.storage.local.set({ nightAutoEnableEnabled: enabled });
                updateNightAutoEnableUI();
                showToast(enabled ? 'Ночной режим включён' : 'Ночной режим отключён', enabled ? 'success' : 'info');
            } else {
                elements.toggleNightAutoEnable.checked = !enabled;
            }
        })
        .catch(() => {
            elements.toggleNightAutoEnable.checked = !enabled;
            alert('Ошибка: Обновите страницу 1С');
        });
    }

    function startAutoRestartTimer() {
        if (state.autoRestartTimer) {
            clearInterval(state.autoRestartTimer);
        }
        
        if (!state.autoRestartEnabled) return;
        
        logger.log('🔁 Авто-перезапуск запущен:', state.autoRestartInterval, 'мс');
        
        setTimeout(() => autoRestartMonitoring(), 1000);
        
        state.autoRestartTimer = setInterval(() => autoRestartMonitoring(), state.autoRestartInterval);
    }

    function stopAutoRestartTimer() {
        if (state.autoRestartTimer) {
            clearInterval(state.autoRestartTimer);
            state.autoRestartTimer = null;
            logger.log('🔁 Авто-перезапуск остановлен');
        }
    }

    async function autoRestartMonitoring() {
        if (!state.currentTab || !state.autoRestartEnabled) return;
        
        state.autoRestartCheckCount++;
        
        try {
            const response = await sendMessageToContentScript({type: 'GET_STATUS'});
            
            if (response && !response.error && !response.isMonitoring) {
                logger.log('🔁 Авто-перезапуск: включаем мониторинг');
                
                const toggleResponse = await sendMessageToContentScript({type: 'TOGGLE_MONITOR'});
                
                if (toggleResponse && toggleResponse.isMonitoring) {
                    logger.log('✅ Мониторинг включен');
                    setStatus(toggleResponse.status, toggleResponse.count, toggleResponse.groupCount, true);
                    showNotification('Мониторинг автоматически включен');
                }
            }
        } catch (error) {
            // Content script not ready — не ошибка, просто пропускаем
            if (!error.message.includes('Content script not ready')) {
                logger.error('🔁 Ошибка авто-перезапуска:', error);
            }
        }
    }

    function updateSoundVolume() {
        const volume = parseInt(elements.soundVolumeSlider.value);
        if (elements.soundVolumeValue) elements.soundVolumeValue.textContent = volume + '%';
        state.soundVolume = volume;
        
        // Обновляем индикатор уровня громкости
        updateVolumeIndicators('soundVolumeSlider', '.volume-level-indicator[data-for="sound"] span');
        
        chrome.storage.local.set({ soundVolumeLevel: volume });
        
        if (!state.currentTab) return;
        
        sendMessageToContentScript({
            type: 'SET_VOLUME',
            volume: volume / 100
        }).catch(() => {});
    }

    function updateGroupVolume() {
        const volume = parseInt(elements.groupVolumeSlider.value);
        if (elements.groupVolumeValue) elements.groupVolumeValue.textContent = volume + '%';
        state.groupVolume = volume;
        
        updateVolumeIndicators('groupVolumeSlider', '.volume-level-indicator[data-for="group"] span');
        
        chrome.storage.local.set({ groupVolumeLevel: volume });
        
        if (!state.currentTab) return;
        
        sendMessageToContentScript({
            type: 'SET_GROUP_VOLUME',
            volume: volume / 100
        }).catch(() => {});
    }

    function updateNotificationThreshold() {
        const val = parseInt(elements.notificationThreshold.value) || 1;
        state.notificationThreshold = Math.max(1, Math.min(50, val));
        elements.notificationThreshold.value = state.notificationThreshold;
        chrome.storage.local.set({ notificationThreshold: state.notificationThreshold });
        showToast('Порог оповещения: ' + state.notificationThreshold, 'info', 1500);
    }

    function testSoundAlert() {
        if (!state.isSoundEnabled) {
            alert('Сначала включите звук!');
            return;
        }

        if (!state.currentTab) {
            alert('Сначала откройте страницу 1С');
            return;
        }

        sendMessageToContentScript({type: 'TEST_SOUND'})
            .catch(() => alert('Ошибка теста звука. Обновите страницу 1С.'));
    }

    function testGroupSoundAlert() {
        if (!state.isSoundEnabled) {
            alert('Сначала включите звук!');
            return;
        }

        if (!state.currentTab) {
            alert('Сначала откройте страницу 1С');
            return;
        }

        sendMessageToContentScript({type: 'TEST_GROUP_SOUND'})
            .catch(() => alert('Ошибка теста звука. Обновите страницу 1С.'));
    }

    function applyIntervals() {
        const checkInterval = parseInt(elements.checkInterval.value);
        const notificationCooldown = parseInt(elements.notificationCooldown.value);
        
        if (!checkInterval || !notificationCooldown) {
            alert('Пожалуйста, выберите корректные интервалы');
            return;
        }

        if (!state.currentTab) {
            alert('Сначала откройте страницу 1С');
            return;
        }

        chrome.storage.local.set({
            checkInterval: checkInterval,
            notificationCooldown: notificationCooldown
        });

        sendMessageToContentScript({
            type: 'SET_INTERVALS',
            checkInterval: checkInterval,
            notificationCooldown: notificationCooldown
        })
        .then(response => {
            if (response && response.success) {
                state.checkInterval = checkInterval;
                state.notificationCooldown = notificationCooldown;
                updateCurrentIntervalsDisplay();
                const ci = checkInterval / 1000;
                const nc = notificationCooldown / 1000;
                showToast('Интервалы: проверка ' + ci + 'с, задержка ' + nc + 'с', 'success');
            } else {
                showToast('Ошибка применения интервалов', 'error');
            }
        })
        .catch(() => showToast('Ошибка: Обновите страницу 1С', 'error'));
    }

    function debugNumbersHandler() {
        if (!state.currentTab) {
            alert('Сначала откройте страницу 1С');
            return;
        }

        sendMessageToContentScript({type: 'DEBUG_NUMBERS'})
            .then(() => {
                alert('Отладочная информация в консоли (F12)');
            })
            .catch(() => alert('Ошибка: Обновите страницу 1С'));
    }

    async function updateIntervalsFromContentScript() {
        if (!state.currentTab) return;
        
        try {
            const response = await sendMessageToContentScript({type: 'GET_INTERVALS'});
            if (response && !response.error) {
                state.checkInterval = response.checkInterval || 10000;
                state.notificationCooldown = response.notificationCooldown || 10000;
                
                if (elements.checkInterval) elements.checkInterval.value = state.checkInterval;
                if (elements.notificationCooldown) elements.notificationCooldown.value = state.notificationCooldown;
                
                updateCurrentIntervalsDisplay();
            }
        } catch (error) {}
    }

    // ============ НАСТРОЙКИ ЗВУКА (МОДАЛЬНОЕ ОКНО) ============
    function showSoundSettings() {
        state.modalState = {
            notificationType: state.notificationType,
            soundType: state.soundType,
            groupSoundType: state.groupSoundType,
            voiceVolume: state.voiceVolume
        };
        
        updateModalUI();
        
        if (elements.soundSettingsModal) {
            showModal(elements.soundSettingsModal);
        }
    }

    function updateModalUI() {
        if (!elements.soundSettingsModal) return;
        
        if (elements.typeSoundModal) {
            elements.typeSoundModal.checked = state.modalState.notificationType === 'sound';
        }
        if (elements.typeVoiceModal) {
            elements.typeVoiceModal.checked = state.modalState.notificationType === 'voice';
        }
        
        document.querySelectorAll('.type-option-modal').forEach(option => {
            if (option.dataset.type === state.modalState.notificationType) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
        
        if (elements.voiceVolumeSliderModal) {
            elements.voiceVolumeSliderModal.value = state.modalState.voiceVolume;
        }
        if (elements.voiceVolumeValueModal) {
            elements.voiceVolumeValueModal.textContent = state.modalState.voiceVolume + '%';
        }
        
        if (elements.voiceVolumeSection) {
            elements.voiceVolumeSection.style.display = state.modalState.notificationType === 'voice' ? 'block' : 'none';
        }
        if (elements.soundSelectionSection) {
            elements.soundSelectionSection.style.display = state.modalState.notificationType === 'voice' ? 'none' : 'block';
            
            if (state.modalState.notificationType !== 'voice') {
                renderSoundOptionsModal();
            }
        }
    }

    function updateModalNotificationType(type) {
        if (type === 'voice' && !state.voiceAvailable) {
            alert('Голосовая система недоступна');
            type = 'sound';
        }
        
        state.modalState.notificationType = type;
        updateModalUI();
    }

    function renderSoundOptionsModal() {
        if (!elements.classificationSoundsModal || !elements.groupSoundsModal) return;
        
        elements.classificationSoundsModal.innerHTML = '';
        elements.groupSoundsModal.innerHTML = '';
        
        state.soundOptions.forEach(sound => {
            const el = createSoundOptionElement(sound, 'classification');
            elements.classificationSoundsModal.appendChild(el);
        });
        
        state.groupSoundOptions.forEach(sound => {
            const el = createSoundOptionElement(sound, 'group');
            elements.groupSoundsModal.appendChild(el);
        });
        
        updateActiveSoundSelections();
        
        document.querySelectorAll('.sound-option-modal').forEach(option => {
            option.addEventListener('click', handleSoundOptionClick);
        });
        
        document.querySelectorAll('.btn-test-sound-modal').forEach(button => {
            button.addEventListener('click', handleTestSoundClick);
        });
    }

    function createSoundOptionElement(sound, type) {
        const div = document.createElement('div');
        div.className = 'sound-option-modal';
        div.dataset.type = sound.id;
        div.dataset.for = type;
        div.title = sound.description;
        
        const iconClass = getSoundIconClass(sound.id);
        
        div.innerHTML = `
            <div class="sound-option-icon-modal"><i class="${iconClass}"></i></div>
            <div class="sound-option-title-modal">${sound.name}</div>
            <div class="sound-option-description-modal">${sound.description}</div>
            <button class="btn-test-sound-modal" data-for="${type}" data-sound="${sound.id}" title="Прослушать">
                <i class="fas fa-play"></i>
            </button>
        `;
        
        return div;
    }

    function getSoundIconClass(soundId) {
        const iconMap = {
            'classic': 'fas fa-bell',
            'modern': 'fas fa-bolt',
            'alert': 'fas fa-exclamation-triangle',
            'soft': 'fas fa-volume-down',
            'game': 'fas fa-gamepad',
            'office': 'fas fa-briefcase',
            'group_chime': 'fas fa-bell',
            'group_notification': 'fas fa-users'
        };
        return iconMap[soundId] || 'fas fa-music';
    }

    function updateActiveSoundSelections() {
        document.querySelectorAll('.sound-option-modal').forEach(option => {
            option.classList.remove('active');
        });
        
        const classOpt = document.querySelector(`.sound-option-modal[data-type="${state.modalState.soundType}"][data-for="classification"]`);
        const groupOpt = document.querySelector(`.sound-option-modal[data-type="${state.modalState.groupSoundType}"][data-for="group"]`);
        
        if (classOpt) classOpt.classList.add('active');
        if (groupOpt) groupOpt.classList.add('active');
    }

    function handleSoundOptionClick(event) {
        const option = event.currentTarget;
        const soundType = option.dataset.type;
        const soundFor = option.dataset.for;
        
        if (soundFor === 'classification') {
            state.modalState.soundType = soundType;
        } else if (soundFor === 'group') {
            state.modalState.groupSoundType = soundType;
        }
        
        updateActiveSoundSelections();
    }

    function handleTestSoundClick(event) {
        event.stopPropagation();
        const button = event.currentTarget;
        const soundFor = button.dataset.for;
        const soundId = button.dataset.sound;
        
        // Визуальная индикация воспроизведения
        const originalContent = button.innerHTML;
        button.innerHTML = '<i class="fas fa-volume-up"></i>';
        button.style.opacity = '0.7';
        
        setTimeout(() => {
            button.innerHTML = originalContent;
            button.style.opacity = '1';
        }, 1000);
        
        if (!state.currentTab) {
            alert('Сначала откройте страницу 1С');
            return;
        }

        if (soundFor === 'classification') {
            sendMessageToContentScript({
                type: 'TEST_SOUND',
                soundType: soundId
            }).catch(() => {});
        } else if (soundFor === 'group') {
            sendMessageToContentScript({
                type: 'TEST_GROUP_SOUND',
                soundType: soundId
            }).catch(() => {});
        }
    }

    function saveSoundSettings() {
        state.modalState.voiceVolume = parseInt(elements.voiceVolumeSliderModal.value);
        
        state.notificationType = state.modalState.notificationType;
        state.soundType = state.modalState.soundType;
        state.groupSoundType = state.modalState.groupSoundType;
        state.voiceVolume = state.modalState.voiceVolume;
        
        chrome.storage.local.set({
            notificationType: state.notificationType,
            soundType: state.soundType,
            groupSoundType: state.groupSoundType,
            voiceVolumeLevel: state.voiceVolume
        });
        
        if (state.currentTab) {
            sendMessageToContentScript({
                type: 'SET_NOTIFICATION_TYPE',
                notificationType: state.notificationType
            }).catch(() => {});
            
            if (state.notificationType === 'sound') {
                sendMessageToContentScript({type: 'SET_SOUND_TYPE', soundType: state.soundType}).catch(() => {});
                sendMessageToContentScript({type: 'SET_GROUP_SOUND_TYPE', soundType: state.groupSoundType}).catch(() => {});
            }
            
            sendMessageToContentScript({
                type: 'SET_VOICE_VOLUME',
                volume: state.voiceVolume / 100
            }).catch(() => {});
        }
        
        // Toast-уведомление
        showToast('Настройки звука сохранены', 'success');
        
        // Закрываем модалку с задержкой для показа тоста
        setTimeout(() => {
            if (elements.soundSettingsModal) hideModal(elements.soundSettingsModal);
        }, 500);
        
        logger.log('⚙️ Настройки звука сохранены');
    }

    // ============ MAX ============
    function toggleMaxHandler() {
        const enabled = elements.toggleMax.checked;
        console.log('🔧 toggleMaxHandler: enabled =', enabled);
        
        // Сначала обновляем UI
        updateMaxUI();
        
        // Сохраняем настройку
        chrome.storage.local.set({ maxEnabled: enabled }, () => {
            state.maxEnabled = enabled;
            console.log('🔧 MAX saved to storage:', enabled);
            
            // Также отправляем в content script чтобы обновить maxModule
            if (state.currentTab) {
                chrome.tabs.sendMessage(state.currentTab.id, {
                    type: 'UPDATE_MAX_ENABLED',
                    enabled: enabled
                }, (response) => {
                    console.log('🔧 Content script responded:', response);
                });
            }
        });
        
        // Проверяем настройки - если не настроено, показываем предупреждение
        if (enabled && !state.maxConfigured) {
            showToast('Введите ваш User ID в поле ниже', 'warning');
        }
        
        console.log('🔧 MAX enabled:', enabled);
    }
         
    // ============ ТЕСТОВОЕ СООБЩЕНИЕ MAX ============
    async function sendTestMaxMessage() {
        const userId = state.maxSettings.userId;
        
        if (!userId) {
            showToast('Сначала введите ваш User ID', 'error');
            return;
        }

        try {
            const response = await new Promise(resolve => {
                chrome.runtime.sendMessage({
                    type: 'MAX_API_SEND_MESSAGE',
                    botToken: window.maxModule?.botToken || 'f9LHodD0cOIsuFM7s3BgTcIw2zTV3ZfC7UFn0NPNy7Xb8nBln-UvBnSNASjw-5w671OMv0G7QUsKJoLTGr-A',
                    userId: userId,
                    text: `✅ Тест 1C Монитора\n\nЕсли вы видите это — MAX настроен правильно!\n⏰ ${new Date().toLocaleTimeString('ru-RU')}`
                }, resolve);
            });
            
            if (response && response.success) {
                showToast('Тестовое сообщение отправлено!', 'success');
            } else {
                showToast('Ошибка: ' + (response?.error || 'Неизвестная ошибка'), 'error');
            }
        } catch (error) {
            showToast('Ошибка: ' + error.message, 'error');
        }
    }

    function hideMaxSettings() {
        if (!elements.telegramSettingsModal) return;
        elements.telegramSettingsModal.classList.remove('show');
        setTimeout(() => {
            elements.telegramSettingsModal.style.display = 'none';
        }, 300);
    }

    function showTelegramSettings() {
        logger.log('🔧 showTelegramSettings вызвана');
        
        // Если модалка уже открыта - не открываем повторно
        if (elements.telegramSettingsModal && elements.telegramSettingsModal.classList.contains('show')) {
            return;
        }
        
        // Загружаем настройки подключения из storage
        chrome.storage.local.get(['telegramConnection'], (result) => {
            const conn = result.telegramConnection || { type: 'direct' };
            
            if (elements.telegramConnectionType) elements.telegramConnectionType.value = conn.type || 'direct';
            
            // Показываем/скрываем секции
            const proxySettings = document.getElementById('proxySettings');
            const customApiSettings = document.getElementById('customApiSettings');
            
            if (proxySettings) proxySettings.style.display = conn.type === 'proxy' ? 'block' : 'none';
            if (customApiSettings) customApiSettings.style.display = conn.type === 'custom' ? 'block' : 'none';
            
            if (conn.type === 'proxy') {
                if (elements.telegramProxyType) elements.telegramProxyType.value = conn.proxy?.type || '';
                if (elements.telegramProxyHost) elements.telegramProxyHost.value = conn.proxy?.host || '';
                if (elements.telegramProxyPort) elements.telegramProxyPort.value = conn.proxy?.port || '';
                if (elements.telegramProxyUsername) elements.telegramProxyUsername.value = conn.proxy?.username || '';
                if (elements.telegramProxyPassword) elements.telegramProxyPassword.value = conn.proxy?.password || '';
            } else if (conn.type === 'custom') {
                if (elements.telegramCustomApiUrl) elements.telegramCustomApiUrl.value = conn.customApiUrl || '';
            }
        });
        
        if (elements.telegramSettingsModal) {
            elements.telegramSettingsModal.style.display = 'flex';
            requestAnimationFrame(() => {
                elements.telegramSettingsModal.classList.add('show');
            });
            logger.log('🔧 Modal opened');
        }
    }

    function updateTelegramModalStatus() {
        if (!elements.statusToken) return;
        
        elements.statusToken.textContent = state.telegramModalState.botToken 
            ? `Установлен (${state.telegramModalState.botToken.substring(0, 10)}...)` 
            : 'Не установлен';
        
        elements.statusChatId.textContent = state.telegramModalState.chatId 
            ? `Установлен (${state.telegramModalState.chatId.substring(0, 8)}...)` 
            : 'Не установлен';
        
        if (elements.statusTemplates) elements.statusTemplates.textContent = '2';
        if (elements.statusSendMode) elements.statusSendMode.textContent = state.telegramModalState.sendImmediately ? 'Немедленная' : 'Накопление';
        
        if (elements.tokenValidationStatus) {
            if (state.telegramModalState.tokenValidated) {
                elements.tokenValidationStatus.textContent = '✅ Токен проверен';
                elements.tokenValidationStatus.style.display = 'block';
                elements.tokenValidationStatus.style.background = '#d4edda';
                elements.tokenValidationStatus.style.color = '#155724';
            } else if (state.telegramModalState.botToken) {
                elements.tokenValidationStatus.textContent = '⚠️ Токен не проверен';
                elements.tokenValidationStatus.style.display = 'block';
                elements.tokenValidationStatus.style.background = '#fff3cd';
                elements.tokenValidationStatus.style.color = '#856404';
            } else {
                elements.tokenValidationStatus.style.display = 'none';
            }
        }
        
        if (elements.chatIdStatus) {
            if (state.telegramModalState.chatIdObtained) {
                elements.chatIdStatus.textContent = '✅ Chat ID получен';
                elements.chatIdStatus.style.display = 'block';
                elements.chatIdStatus.style.background = '#d4edda';
                elements.chatIdStatus.style.color = '#155724';
            } else if (state.telegramModalState.chatId) {
                elements.chatIdStatus.textContent = '⚠️ Chat ID введен вручную';
                elements.chatIdStatus.style.display = 'block';
                elements.chatIdStatus.style.background = '#fff3cd';
                elements.chatIdStatus.style.color = '#856404';
            } else {
                elements.chatIdStatus.style.display = 'none';
            }
        }
    }

    function toggleTokenVisibility() {
        if (!elements.telegramBotToken || !elements.showTokenToggle) return;
        
        if (elements.telegramBotToken.type === 'password') {
            elements.telegramBotToken.type = 'text';
            elements.showTokenToggle.innerHTML = '<i class="fas fa-eye-slash"></i>';
        } else {
            elements.telegramBotToken.type = 'password';
            elements.showTokenToggle.innerHTML = '<i class="fas fa-eye"></i>';
        }
    }

    async function validateTelegramToken() {
        const token = elements.telegramBotToken.value.trim();
        
        if (!token) {
            showTelegramModalMessage('Введите токен бота', 'error');
            return;
        }

        if (elements.validateToken) {
            elements.validateToken.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Проверка...';
            elements.validateToken.disabled = true;
        }

        const startTime = performance.now();

        try {
            const response = await sendMessageToContentScript({
                type: 'TELEGRAM_VALIDATE_TOKEN',
                token: token
            });

            const elapsed = (performance.now() - startTime).toFixed(0);
            logger.log(`🔧 Telegram token validation: ${response?.valid ? 'OK' : 'FAIL'} за ${elapsed}мс`);

            if (response && response.valid) {
                state.telegramModalState.tokenValidated = true;
                showTelegramModalMessage(`✅ Токен действителен. Бот: ${response.botName}`, 'success');
                updateTelegramModalStatus();
            } else {
                state.telegramModalState.tokenValidated = false;
                showTelegramModalMessage(`❌ ${response.error || 'Неверный токен'}`, 'error');
                updateTelegramModalStatus();
            }
        } catch (error) {
            const elapsed = (performance.now() - startTime).toFixed(0);
            logger.error(`🔧 Telegram token validation error за ${elapsed}мс:`, error);
            showTelegramModalMessage('❌ Ошибка проверки токена', 'error');
        } finally {
            if (elements.validateToken) {
                elements.validateToken.innerHTML = '<i class="fas fa-check-circle"></i> Проверить токен';
                elements.validateToken.disabled = false;
            }
        }
    }

    async function getTelegramChatId() {
        const token = elements.telegramBotToken.value.trim();
        
        if (!token) {
            showTelegramModalMessage('Сначала введите токен', 'error');
            return;
        }

        if (!state.telegramModalState.tokenValidated) {
            showTelegramModalMessage('Сначала проверьте токен', 'error');
            return;
        }

        if (elements.getChatId) {
            elements.getChatId.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Получение...';
            elements.getChatId.disabled = true;
        }

        try {
            const response = await sendMessageToContentScript({
                type: 'TELEGRAM_GET_UPDATES',
                token: token
            });

            if (response && response.success) {
                if (elements.telegramChatId) elements.telegramChatId.value = response.chatId;
                state.telegramModalState.chatId = response.chatId;
                state.telegramModalState.chatIdObtained = true;
                showTelegramModalMessage('✅ Chat ID получен!', 'success');
                updateTelegramModalStatus();
            } else {
                showTelegramModalMessage(`❌ ${response.error || 'Ошибка получения Chat ID'}`, 'error');
            }
        } catch (error) {
            showTelegramModalMessage('❌ Ошибка получения Chat ID', 'error');
        } finally {
            if (elements.getChatId) {
                elements.getChatId.innerHTML = '<i class="fas fa-download"></i> Получить Chat ID';
                elements.getChatId.disabled = false;
            }
        }
    }

    async function sendTestTelegramMessage() {
        const startTime = performance.now();
        logger.log('🔧 Telegram test: кнопка нажата, отправка запроса...');
        
        if (elements.sendTestTelegram) {
            elements.sendTestTelegram.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
            elements.sendTestTelegram.disabled = true;
        }

        // Получаем chatId из storage
        const chatId = state.telegramSettings.chatId;
        
        if (!chatId) {
            showTelegramModalMessage('❌ Сначала введите ваш Chat ID в поле выше', 'error');
            if (elements.sendTestTelegram) {
                elements.sendTestTelegram.innerHTML = '<i class="fas fa-paper-plane"></i> Тест';
                elements.sendTestTelegram.disabled = false;
            }
            return;
        }

        try {
            // Отправляем тест напрямую через background
            const response = await new Promise(resolve => {
                chrome.runtime.sendMessage({
                    type: 'TELEGRAM_API_SEND_MESSAGE',
                    botToken: window.telegramModule?.botToken || '8542040998:AAGuwymgAEPeB43PoHFNPyJPJxG-EzntzaI',
                    chatId: chatId,
                    text: `✅ Тестовое сообщение от 1C Монитора\n\nЭто тест. Если вы видите это сообщение в личке — настройки верны!\n⏰ Время: ${new Date().toLocaleTimeString('ru-RU')}`
                }, resolve);
            });
            
            const elapsed = (performance.now() - startTime).toFixed(0);
            logger.log(`🔧 Telegram test: ${response?.success ? 'OK' : 'FAIL'} за ${elapsed}мс`, response);

            if (response && response.success) {
                showTelegramModalMessage('✅ Тестовое сообщение отправлено вам в личку!', 'success');
            } else {
                showTelegramModalMessage(`❌ ${response?.error || 'Ошибка отправки'}`, 'error');
            }
        } catch (error) {
            const elapsed = (performance.now() - startTime).toFixed(0);
            logger.error(`🔧 Telegram test error за ${elapsed}мс:`, error);
            showTelegramModalMessage('❌ Ошибка: ' + error.message, 'error');
        } finally {
            if (elements.sendTestTelegram) {
                elements.sendTestTelegram.innerHTML = '<i class="fas fa-paper-plane"></i> Тест';
                elements.sendTestTelegram.disabled = false;
            }
        }
    }

    // ============ СОХРАНЕНИЕ USER ID ИЗ ОСНОВНОГО ПОЛЯ ============
    function saveMaxUserId() {
        const userId = elements.maxUserId.value.trim();
        
        if (!userId) {
            return;
        }
        
        // Сохраняем в storage
        chrome.storage.local.set({ maxUserId: userId }, () => {
            state.maxSettings.userId = userId;
            state.maxConfigured = !!userId;
            state.maxModalState.userId = userId;
            state.maxModalState.userIdObtained = !!userId;
            
            updateMaxUI();
            logger.log('🔧 User ID сохранён:', userId);
            
            // Отправляем в content script для обновления
            if (state.currentTab) {
                chrome.tabs.sendMessage(state.currentTab.id, {
                    type: 'UPDATE_MAX_USER_ID',
                    userId: userId
                }, () => {});
            }
        });
    }

    async function saveTelegramSettings() {
        const connectionType = elements.telegramConnectionType ? elements.telegramConnectionType.value : 'direct';
        
        const connection = {
            type: connectionType
        };
        
        if (connectionType === 'proxy') {
            connection.proxy = {
                type: elements.telegramProxyType ? elements.telegramProxyType.value : '',
                host: elements.telegramProxyHost ? elements.telegramProxyHost.value.trim() : '',
                port: elements.telegramProxyPort ? parseInt(elements.telegramProxyPort.value) : '',
                username: elements.telegramProxyUsername ? elements.telegramProxyUsername.value.trim() : '',
                password: elements.telegramProxyPassword ? elements.telegramProxyPassword.value : ''
            };
        } else if (connectionType === 'custom') {
            connection.customApiUrl = elements.telegramCustomApiUrl ? elements.telegramCustomApiUrl.value.trim() : '';
        }

        if (elements.saveTelegramSettings) {
            elements.saveTelegramSettings.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Сохранение...';
            elements.saveTelegramSettings.disabled = true;
        }

        // Сохраняем настройки подключения в storage
        chrome.storage.local.set({ telegramConnection: connection }, () => {
            state.telegramSettings.connection = connection;
            
            // Обновляем настройки в background (fire-and-forget с таймаутом)
            try {
                chrome.runtime.sendMessage({
                    type: 'UPDATE_TELEGRAM_CONNECTION',
                    connection: connection
                }, (response) => {
                    // Ответ может не прийти если background занят — это нормально
                    if (chrome.runtime.lastError) {
                        logger.warn('⚠️ Background не ответил на UPDATE_TELEGRAM_CONNECTION:', chrome.runtime.lastError.message);
                    }
                });
            } catch (_) {
                // Extension context invalidated — не критично
            }
            
            if (elements.saveTelegramSettings) {
                elements.saveTelegramSettings.innerHTML = '<i class="fas fa-check"></i> Сохранено!';
            }
            
            setTimeout(() => {
                hideTelegramSettings();
                if (elements.saveTelegramSettings) {
                    elements.saveTelegramSettings.innerHTML = '<i class="fas fa-save"></i> Сохранить';
                    elements.saveTelegramSettings.disabled = false;
                }
            }, 1000);
        });
    }

    function clearTelegramSettings() {
        if (!confirm('Очистить настройки подключения?')) return;

        const connection = { type: 'direct' };
        chrome.storage.local.set({ telegramConnection: connection }, () => {
            if (elements.telegramConnectionType) elements.telegramConnectionType.value = 'direct';
            if (elements.telegramProxyType) elements.telegramProxyType.value = '';
            if (elements.telegramProxyHost) elements.telegramProxyHost.value = '';
            if (elements.telegramProxyPort) elements.telegramProxyPort.value = '';
            if (elements.telegramProxyUsername) elements.telegramProxyUsername.value = '';
            if (elements.telegramProxyPassword) elements.telegramProxyPassword.value = '';
            if (elements.telegramCustomApiUrl) elements.telegramCustomApiUrl.value = '';
            
            const proxySettings = document.getElementById('proxySettings');
            const customApiSettings = document.getElementById('customApiSettings');
            if (proxySettings) proxySettings.style.display = 'none';
            if (customApiSettings) customApiSettings.style.display = 'none';
            
            chrome.runtime.sendMessage({
                type: 'UPDATE_TELEGRAM_CONNECTION',
                connection: connection
            });
            
            alert('✅ Настройки подключения очищены');
        });
    }

    function testTelegramAlert() {
        if (!state.telegramEnabled || !state.telegramConfigured) {
            alert('Сначала настройте и включите Telegram');
            return;
        }

        if (!state.currentTab) {
            alert('Сначала откройте страницу 1С');
            return;
        }

        sendMessageToContentScript({type: 'TELEGRAM_SEND_TEST'})
            .then(response => {
                if (response && response.success) {
                    alert('Тестовое сообщение отправлено!');
                } else {
                    alert(`Ошибка: ${response.error || 'Неизвестная ошибка'}`);
                }
            })
            .catch(() => alert('Ошибка: Обновите страницу 1С'));
    }

    function showTelegramModalMessage(message, type = 'info') {
        if (!elements.testMessageStatus) return;
        
        elements.testMessageStatus.textContent = message;
        elements.testMessageStatus.style.display = 'block';
        
        switch (type) {
            case 'success':
                elements.testMessageStatus.style.background = '#d4edda';
                elements.testMessageStatus.style.color = '#155724';
                break;
            case 'error':
                elements.testMessageStatus.style.background = '#f8d7da';
                elements.testMessageStatus.style.color = '#721c24';
                break;
            default:
                elements.testMessageStatus.style.background = '#d1ecf1';
                elements.testMessageStatus.style.color = '#0c5460';
        }
        
        setTimeout(() => {
            elements.testMessageStatus.style.display = 'none';
        }, 5000);
    }

    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `auto-restart-notification ${type}`;
        notification.innerHTML = `
            <div class="auto-restart-status-dot" style="background: ${type === 'success' ? '#10b981' : '#f59e0b'}"></div>
            <span>${message}</span>
        `;
        
        if (elements.nightAutoEnableStatus) {
            const parent = elements.nightAutoEnableStatus.parentNode;
            parent.insertBefore(notification, elements.nightAutoEnableStatus);
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 3000);
        }
    }

    // ============ ЛОГИ ============
    async function updateLogsInfo() {
        if (!elements.logsInfo) return;
        try {
            const logs = await logger.getAll();
            const count = logs.length;
            const sizeBytes = new Blob([logs.join('\n')]).size;
            const sizeKb = (sizeBytes / 1024).toFixed(1);
            elements.logsInfo.textContent = count > 0
                ? `${count} записей (${sizeKb} КБ)`
                : 'Логи пусты';
        } catch (_) {
            elements.logsInfo.textContent = '';
        }
    }

    async function downloadLogs() {
        try {
            const success = await logger.download();
            if (success) {
                showToast('Логи сохранены', 'success');
            } else {
                showToast('Логи пусты — нечего скачивать', 'warning');
            }
        } catch (err) {
            showToast('Ошибка скачивания логов', 'error');
        }
    }

    async function clearLogs() {
        if (!confirm('Очистить все логи?')) return;
        try {
            await logger.clear();
            showToast('Логи очищены', 'success');
            await updateLogsInfo();
        } catch (err) {
            showToast('Ошибка очистки логов', 'error');
        }
    }

    // Запуск инициализации
    initialize();
    logger.logModuleLoad('popup.js');
});
