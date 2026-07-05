logger.logModuleLoad('content.js');

const messageHandler = {
    async handle(message) {
        try {
            switch (message.type) {
                case 'GET_STATUS':
                    return await this.handleGetStatus();
                    
                case 'TOGGLE_MONITOR':
                    return await this.handleToggleMonitor();
                    
                case 'TOGGLE_GROUP_MONITOR':
                    return await this.handleToggleGroup();
                    
                case 'SET_SOUND_SETTING':
                    return await this.handleSetSound(message.soundEnabled);
                    
                case 'ENABLE_SOUND':
                    return await soundManager.enable();
                    
                case 'GET_SOUND_INFO':
                    return soundManager.getInfo();
                    
                case 'SET_VOLUME':
                    return await soundManager.setSoundVolume(message.volume);
                    
                case 'SET_GROUP_VOLUME':
                    return await soundManager.setGroupVolume(message.volume);
                    
                case 'SET_VOICE_VOLUME':
                    return await soundManager.setVoiceVolume(message.volume);
                    
                case 'SET_NOTIFICATION_TYPE':
                    return await soundManager.setNotificationType(message.notificationType);
                    
                case 'SET_SOUND_TYPE':
                    return await soundManager.setSoundType(message.soundType);
                    
                case 'SET_GROUP_SOUND_TYPE':
                    return await soundManager.setGroupSoundType(message.soundType);
                    
                case 'GET_SOUND_OPTIONS':
                    return {
                        success: true,
                        soundOptions: audio.getAvailableSounds(),
                        groupSoundOptions: audio.getAvailableGroupSounds()
                    };
                    
                case 'TEST_SOUND':
                    if (message.soundType) {
                        audio.testSound(message.soundType);
                    } else {
                        audio.testSound();
                    }
                    return { success: true };
                    
                case 'TEST_GROUP_SOUND':
                    if (message.soundType) {
                        audio.testGroupSound(message.soundType);
                    } else {
                        audio.testGroupSound();
                    }
                    return { success: true };
                    
                case 'TEST_VOICE':
                    await voice.testVoice();
                    return { success: true };
                    
                case 'SET_INTERVALS':
                    return await this.handleSetIntervals(message);
                    
                case 'GET_INTERVALS':
                    return this.handleGetIntervals();
                    
                case 'TOGGLE_NIGHT_AUTO_ENABLE':
                    return await nightAutoEnable.setEnabled(message.enabled);
                    
                case 'GET_NIGHT_AUTO_ENABLE_STATUS':
                    return nightAutoEnable.getStatus();
                 
                case 'DEBUG_NUMBERS':
                    return debugApplicationNumbers();    

                case 'GET_APPLICATION_NUMBERS': {
                    const counts = monitor.countRealApplications();
                    return {
                        success: true,
                        classificationNumbers: counts.onlyClassification,
                        groupNumbers: counts.onlyGroup,
                        allNumbers: counts.allNumbers
                    };
                }
    
                case 'UPDATE_MAX_ENABLED':
                    return await this.handleUpdateMaxEnabled(message.enabled);
                
                case 'UPDATE_MAX_USER_ID':
                    return await this.handleUpdateMaxUserId(message.userId);
                
                case 'DEBUG_PAGE':
                    return this.handleDebug();
                    
  case 'UPDATE_IGNORED_NUMBERS':
        return await this.handleUpdateIgnoredNumbers(message.numbers);

                case 'UPDATE_AUTO_TAKE_ENABLED':
                    state.autoTakeEnabled = message.enabled === true;
                    await storage.set({ autoTakeEnabled: state.autoTakeEnabled });
                    logger.log(`🤖 Auto-take enabled set to: ${state.autoTakeEnabled}`);
                    return { success: true };

                case 'UPDATE_AUTO_TAKE_TIMEOUT':
                    state.autoTakeTimeout = parseInt(message.timeout) || 240000;
                    await storage.set({ autoTakeTimeout: state.autoTakeTimeout });
                    logger.log(`🤖 Auto-take timeout set to: ${state.autoTakeTimeout}ms`);
                    return { success: true };

                default:
                    logger.warn('🔧 Unknown message type:', message.type);
                    return { error: 'Unknown command' };
            }
        } catch (error) {
            logger.error('🔧 Error processing message:', error);
            return { error: error.message };
        }
    },
    
    async handleGetStatus() {
        const counts = monitor.countRealApplications();
        const soundInfo = soundManager.getInfo();
        
        let maxInfo = null;
        if (window.maxModule) {
            maxInfo = window.maxModule.getSettings();
        }
        
        return {
            status: state.isMonitoring ? 
                `Активен` : 
                'Остановлен',
            count: counts.count,
            groupCount: counts.groupCount,
            isMonitoring: state.isMonitoring,
            isGroupMonitoring: state.isGroupMonitoring,
            checkInterval: state.checkInterval,
            notificationCooldown: state.notificationCooldown,
            notificationType: state.notificationType,
            soundType: state.soundType,
            groupSoundType: state.groupSoundType,
            voiceAvailable: soundInfo.voiceAvailable,
            autoRestartEnabled: state.autoRestartEnabled,
            autoRestartInterval: state.autoRestartInterval,
            maxEnabled: maxInfo?.enabled || false,
            maxConfigured: maxInfo?.isConfigured || false,
            autoTakeEnabled: state.autoTakeEnabled,
            autoTakeTimeout: state.autoTakeTimeout
        };
    },
    
    async handleToggleMonitor() {
        state.isMonitoring = !state.isMonitoring;
        
        if (state.isMonitoring) {
            monitor.start();
        } else {
            monitor.stop();
        }
        
        const counts = monitor.countRealApplications();
        state.lastCount = counts.count;
        state.lastGroupCount = counts.groupCount;
        
        monitor.sendStateUpdate();
        
        return {
            status: state.isMonitoring ? 
                `Активен` : 
                'Остановлен',
            count: state.lastCount,
            groupCount: state.lastGroupCount,
            isMonitoring: state.isMonitoring
        };
    },
    
    async handleToggleGroup() {
        state.isGroupMonitoring = !state.isGroupMonitoring;
        await storage.set({ groupMonitoringEnabled: state.isGroupMonitoring });
        
        const counts = monitor.countRealApplications();
        state.lastCount = counts.count;
        state.lastGroupCount = counts.groupCount;
        
        monitor.sendStateUpdate();
        
        return {
            isGroupMonitoring: state.isGroupMonitoring,
            count: state.lastCount,
            groupCount: state.lastGroupCount
        };
    },
    
    async handleSetSound(soundEnabled) {
        if (soundEnabled === false) {
            return await soundManager.handleDisableRequest();
        } else {
            return await soundManager.enable();
        }
    },
    
    
    async handleSetGroupVolume(volume) {
        state.groupVolume = volume;
        await storage.set({ groupVolumeLevel: Math.round(volume * 100) });
        return { success: true };
    },
    
    async handleTestVoice() {
        await voice.testVoice();
        return { success: true };
    },
    
    async handleSetIntervals({ checkInterval, notificationCooldown }) {
        state.checkInterval = parseInt(checkInterval) || APP_CONFIG.DEFAULT_CHECK_INTERVAL;
        state.notificationCooldown = parseInt(notificationCooldown) || APP_CONFIG.DEFAULT_COOLDOWN;
        
        await storage.set({
            checkInterval: state.checkInterval,
            notificationCooldown: state.notificationCooldown
        });
        
        if (state.isMonitoring) {
            monitor.restart();
        }
        
        return {
            success: true,
            checkInterval: state.checkInterval,
            notificationCooldown: state.notificationCooldown
        };
    },
    
    handleGetIntervals() {
        return {
            checkInterval: state.checkInterval,
            notificationCooldown: state.notificationCooldown
        };
    },
    
    async handleUpdateMaxEnabled(enabled) {
        if (!window.maxModule) {
            return { success: false, error: 'MAX module not loaded' };
        }
        
        const result = await window.maxModule.saveSettings({ enabled: enabled });
        
        state.maxEnabled = enabled;
        
        logger.log(`🔧 MAX enabled: ${enabled}, state updated`);
        
        return result;
    },

    async handleUpdateMaxUserId(userId) {
        if (!window.maxModule) {
            return { success: false, error: 'MAX module not loaded' };
        }
        
        const result = await window.maxModule.saveSettings({ userId: userId });
        
        logger.log(`🔧 MAX User ID updated: ${userId}`);
        
        return result;
    },

    async handleUpdateIgnoredNumbers(numbers) {
    state.ignoredNumbers = numbers || [];
    
    await storage.set({ ignoredNumbers: state.ignoredNumbers });
    
    logger.log(`🔧 Ignored numbers updated: ${state.ignoredNumbers.length} numbers`);
    
    if (state.isMonitoring) {
        monitor.checkApplications();
    }
    
    return { success: true, count: state.ignoredNumbers.length };
},
    
    handleDebug() {
        logger.log('🔧 Debug: Current URL:', window.location.href);
        logger.log('🔧 Debug: Page title:', document.title);
        
        const grids = document.querySelectorAll('[id*="grid"], [class*="grid"]');
        logger.log(`🔧 Debug: Found ${grids.length} grid elements`);
        
        const voices = speechSynthesis.getVoices();
        logger.log(`🔧 Debug: Available voices:`, voices.map(v => `${v.name} (${v.lang})`));
        
        logger.log('🔧 Debug: Available sounds:', Object.keys(SOUND_LIBRARY));
        logger.log('🔧 Debug: Available group sounds:', Object.keys(GROUP_SOUND_LIBRARY));
        
        return { success: true };
    }
};

async function init() {
    try {
        const data = await storage.get([
            'soundEnabled', 'soundVolumeLevel', 'groupVolumeLevel',
            'voiceVolumeLevel', 'groupMonitoringEnabled', 'soundDisableEndTime',
            'checkInterval', 'notificationCooldown', 'notificationType',
            'soundType', 'groupSoundType', 'autoRestartEnabled', 'autoRestartInterval',
            'nightAutoEnableEnabled',
            'maxEnabled',
            'maxUserId',
            'ignoredNumbers',
            'autoTakeEnabled',
            'autoTakeTimeout'
        ]);
        
        state.soundEnabled = data.soundEnabled !== false;
        state.notificationType = data.notificationType || 'sound';
        state.soundType = data.soundType || 'modern';
        state.groupSoundType = data.groupSoundType || 'group_chime';
        state.voiceVolume = data.voiceVolumeLevel ? data.voiceVolumeLevel / 100 : 1.0;
        state.soundVolume = data.soundVolumeLevel ? data.soundVolumeLevel / 100 : 0.8;
        state.groupVolume = data.groupVolumeLevel ? data.groupVolumeLevel / 100 : 0.7;
        state.isGroupMonitoring = data.groupMonitoringEnabled || false;
        state.checkInterval = parseInt(data.checkInterval) || APP_CONFIG.DEFAULT_CHECK_INTERVAL;
        state.notificationCooldown = parseInt(data.notificationCooldown) || APP_CONFIG.DEFAULT_COOLDOWN;
        
        state.autoRestartEnabled = data.autoRestartEnabled || false;
        state.autoRestartInterval = parseInt(data.autoRestartInterval) || window.SHARED_CONSTANTS?.INTERVALS?.AUTO_RESTART_MIN || 30000;
        
state.ignoredNumbers = data.ignoredNumbers || [];
logger.log(`🔧 Ignored numbers loaded: ${state.ignoredNumbers.length} numbers`);
        
        state.maxEnabled = data.maxEnabled === true;
        logger.log(`🔧 MAX enabled loaded: ${state.maxEnabled}, userId: ${data.maxUserId || 'not set'}`);
        
        state.autoTakeEnabled = data.autoTakeEnabled === true;
        state.autoTakeTimeout = parseInt(data.autoTakeTimeout) || window.SHARED_CONSTANTS?.MONITORING?.DEFAULT_AUTO_TAKE_TIMEOUT || 240000;
        logger.log(`🤖 Auto-take enabled: ${state.autoTakeEnabled}, timeout: ${state.autoTakeTimeout}ms`);
        
        if (data.soundDisableEndTime) {
            const now = Date.now();
            if (now < data.soundDisableEndTime) {
                state.soundEnabled = false;
                soundDisableEndTime = data.soundDisableEndTime;
                
                soundDisableTimer = setTimeout(() => {
                    soundManager.enable();
                }, data.soundDisableEndTime - now);
                
                logger.log(`🔊 Sound disabled until ${new Date(data.soundDisableEndTime).toLocaleTimeString()}`);
            } else {
                await storage.remove('soundDisableEndTime');
            }
        }
        
        logger.log(`🔧 Settings loaded - Sound: ${state.soundEnabled}, ` +
                   `Type: ${state.notificationType}, Sound: ${state.soundType}, ` +
                   `Group Sound: ${state.groupSoundType}, ` +
                   `Auto-restart: ${state.autoRestartEnabled} (${state.autoRestartInterval}ms), ` +
                   `MAX: ${state.maxEnabled}`);
        
        if (state.autoRestartEnabled && !state.isMonitoring) {
            logger.log('🔁 Auto-restart: Enabling monitoring on startup');
            state.isMonitoring = true;
            monitor.start();
        }
        
        voice.init();
        if (speechSynthesis) {
            speechSynthesis.getVoices();
            
            if (speechSynthesis.onvoiceschanged !== undefined) {
                const oldHandler = speechSynthesis.onvoiceschanged;
                speechSynthesis.onvoiceschanged = () => {
                    if (typeof oldHandler === 'function') oldHandler();
                    logger.log(`🗣️ Voices loaded: ${speechSynthesis.getVoices().length}`);
                };
            }
        }
        
        await nightAutoEnable.init();
        
        logger.log(`🔧 Settings loaded - Night auto-enable: ${nightAutoEnable.enabled}`);
        
        loadMaxModule();
        
        monitor.startShiftTracking();
        
        setTimeout(() => {
            const counts = monitor.countRealApplications();
            state.lastCount = counts.count;
            state.lastGroupCount = counts.groupCount;
            monitor.sendStateUpdate();
        }, 1000);
        
    } catch (error) {
        logger.error('🔧 Initialization failed:', error);
    }
}

function debugApplicationNumbers() {
    try {
        logger.log('🔧 === DEBUG: Поиск номеров заявок ===');
        
        const classificationTable = document.querySelector('.gridContent[id*="ЗаявкиНаКлассификации"]');
        const groupTable = document.querySelector('.gridContent[id*="УМеняВОчереди"]');
        
        logger.log('🔧 Классификация таблица найдена:', !!classificationTable);
        logger.log('🔧 Группы таблица найдена:', !!groupTable);
        
        if (classificationTable) {
            logger.log('🔧 === АНАЛИЗ ТАБЛИЦЫ КЛАССИФИКАЦИИ ===');
            const rows = classificationTable.querySelectorAll('.gridLine');
            logger.log(`🔧 Найдено строк: ${rows.length}`);
            
            rows.forEach((row, index) => {
                const rowText = row.textContent.trim();
                logger.log(`🔧 Строка ${index + 1}: ${rowText.substring(0, 100)}...`);
                
                const cells = row.querySelectorAll('.gridCell');
                logger.log(`🔧   Ячеек: ${cells.length}`);
                
                cells.forEach((cell, cellIndex) => {
                    const cellText = cell.textContent.trim();
                    logger.log(`🔧   Ячейка ${cellIndex}: "${cellText}"`);
                });
                
                const numberMatch = rowText.match(/\b(\d{3,})\b/);
                if (numberMatch) {
                    logger.log(`🔧   Найден номер: ${numberMatch[1]}`);
                    logger.log(`🔧   После обрезки 3 цифр: ${numberMatch[1].slice(0, -3)}`);
                }
                
                logger.log('---');
            });
        }
        
        if (groupTable) {
            logger.log('🔧 === АНАЛИЗ ТАБЛИЦЫ ГРУПП ===');
            const rows = groupTable.querySelectorAll('.gridLine');
            logger.log(`🔧 Найдено строк: ${rows.length}`);
            
            rows.forEach((row, index) => {
                const rowText = row.textContent.trim();
                logger.log(`🔧 Строка ${index + 1}: ${rowText.substring(0, 100)}...`);
                
                const cells = row.querySelectorAll('.gridCell');
                logger.log(`🔧   Ячеек: ${cells.length}`);
                
                cells.forEach((cell, cellIndex) => {
                    const cellText = cell.textContent.trim();
                    logger.log(`🔧   Ячейка ${cellIndex}: "${cellText}"`);
                });
                
                const numberMatch = rowText.match(/\b(\d{3,})\b/);
                if (numberMatch) {
                    logger.log(`🔧   Найден номер: ${numberMatch[1]}`);
                    logger.log(`🔧   После обрезки 3 цифр: ${numberMatch[1].slice(0, -3)}`);
                }
                
                logger.log('---');
            });
        }
        
        logger.log('🔧 === ПОИСК СЕЛЕКТОРОВ НОМЕРОВ ===');
        
        const numberElements = document.querySelectorAll('[class*="номер"], [class*="number"], [data-field*="номер"], [data-field*="number"]');
        logger.log(`🔧 Элементов с номером в классе: ${numberElements.length}`);
        
        numberElements.forEach((el, index) => {
            logger.log(`🔧 Элемент ${index}: ${el.className} -> "${el.textContent.trim()}"`);
        });
        
        return {
            classificationFound: !!classificationTable,
            groupFound: !!groupTable,
            classificationRows: classificationTable ? classificationTable.querySelectorAll('.gridLine').length : 0,
            groupRows: groupTable ? groupTable.querySelectorAll('.gridLine').length : 0,
            numberElements: numberElements.length
        };
        
    } catch (error) {
        logger.error('🔧 DEBUG error:', error);
        return { error: error.message };
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    logger.log('🔧 Content: Received message:', message.type);
    
    messageHandler.handle(message)
        .then(sendResponse)
        .catch(error => {
            logger.error('🔧 Message handler error:', error);
            sendResponse({ error: error.message });
        });
    
    return true;
});

window.addEventListener('beforeunload', () => {
    if (checkIntervalId) {
        clearInterval(checkIntervalId);
    }
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
    if (soundDisableTimer) {
        clearTimeout(soundDisableTimer);
    }
});

try { init(); } catch (e) { logger.error('content.js init error:', e); }
