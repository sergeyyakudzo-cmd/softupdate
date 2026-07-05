logger.logModuleLoad('content-monitor.js');

const monitor = {
    start() {
        if (checkIntervalId) {
            clearInterval(checkIntervalId);
        }
        
        checkIntervalId = setInterval(() => {
            if (state.isMonitoring) {
                this.checkApplications();
            }
        }, state.checkInterval);
        
        logger.log(`🔧 Monitoring started with interval: ${state.checkInterval}ms, type: ${state.notificationType}, sound: ${state.soundType}`);
    },
    
    stop() {
        if (checkIntervalId) {
            clearInterval(checkIntervalId);
            checkIntervalId = null;
            logger.log('🔧 Monitoring stopped');
        }
    },
    
    restart() {
        this.stop();
        if (state.isMonitoring) {
            logger.log(`🔄 Restarting monitoring with interval: ${state.checkInterval}ms`);
            this.start();
        }
    },
    
    checkApplications() {
        const counts = this.countRealApplications();
        
        logger.log('🔧 checkApplications - counts:', {
            count: counts.count,
            groupCount: counts.groupCount,
            onlyClassification: counts.onlyClassification?.length || 0,
            onlyGroup: counts.onlyGroup?.length || 0,
            maxEnabled: state.maxEnabled,
            maxModuleLoaded: !!window.maxModule
        });
        
        if (counts.count > 0) {
            logger.log(`🎯 Классификация: ${counts.count} заявок`);
            if (appUtils.canNotify()) {
                this.notifyClassification(counts.count);
                state.lastNotificationTime = Date.now();
            }
            
            if (state.maxEnabled && window.maxModule && 
                counts.onlyClassification && Array.isArray(counts.onlyClassification)) {
                
                const classificationCount = counts.onlyClassification.length;
                const classificationNumbers = counts.onlyClassification;
                
                const maxSettings = window.maxModule.getSettings();
                logger.log(`🔧 MAX: Перед отправкой - enabled: ${maxSettings.enabled}, userId: "${maxSettings.userId}", isConfigured: ${maxSettings.isConfigured}`);
                
                logger.log(`🔧 MAX: Sending classification alert - count: ${classificationCount}, numbers:`, classificationNumbers);
                
                if (classificationCount > 0) {
                    window.maxModule.sendClassificationAlert(classificationCount, classificationNumbers)
                        .then(result => {
                            logger.log('🔧 MAX classification result:', result);
                        })
                        .catch(err => {
                            logger.error('🔧 MAX classification error:', err);
                        });
                }
            } else {
                logger.log(`🔧 MAX: Не отправляем - maxEnabled: ${state.maxEnabled}, maxModule: ${!!window.maxModule}, onlyClassification: ${counts.onlyClassification?.length}`);
            }
        }
        
        if (counts.groupCount > 0 && state.isGroupMonitoring) {
            logger.log(`👥 Группы: ${counts.groupCount} задач`);
            if (appUtils.canNotify()) {
                this.notifyGroup(counts.groupCount);
                state.lastNotificationTime = Date.now();
            }
            
            if (state.maxEnabled && window.maxModule && 
                counts.onlyGroup && Array.isArray(counts.onlyGroup)) {
                
                const groupCount = counts.onlyGroup.length;
                const groupNumbers = counts.onlyGroup;
                
                logger.log(`🔧 MAX: Sending group alert - count: ${groupCount}, numbers:`, groupNumbers);
                
                if (groupCount > 0) {
                    window.maxModule.sendGroupAlert(groupCount)
                        .then(result => {
                            logger.log('🔧 MAX group result:', result);
                        })
                        .catch(err => {
                            logger.error('🔧 MAX group error:', err);
                        });
                }
            }
        }
        
        if (state.autoTakeEnabled && counts.numberToRow) {
            this.trackAndAutoTake(counts);
        }
        
        state.lastCount = counts.count;
        state.lastGroupCount = counts.groupCount;
        this.sendStateUpdate(counts);
        
        this.sendShiftUpdate(counts);
    },
    
    startShiftTracking() {
        setInterval(() => {
            const counts = this.countRealApplications();
            this.sendShiftUpdate(counts);
            
            logger.log('🔧 Shift tracking: allUnique=' + (counts.allNumbers?.length ?? 'N/A') + ', class=' + (counts.classificationNumbers?.length ?? 'N/A') + ', group=' + (counts.groupNumbers?.length ?? 'N/A'));
        }, 30000);
        
        logger.log('🔧 Shift tracking started (works even when monitoring is OFF)');
    },
    
    sendShiftUpdate(counts) {
        safeSendMessage({
            type: 'SHIFT_UPDATE',
            counts: {
                classificationNumbers: counts.classificationNumbers || [],
                groupNumbers: counts.groupNumbers || [],
            }
        }).catch(err => {
            logger.warn('🔧 Shift update send failed:', err?.message || err);
        });
    },
    
    notifyClassification(count) {
        if (state.notificationType === 'voice') {
            voice.speakClassificationAlert(count);
        } else {
            audio.playClassificationAlert();
        }
    },
    
    notifyGroup(count) {
        if (state.notificationType === 'voice') {
            voice.speakGroupAlert(count);
        } else {
            audio.playGroupAlert();
        }
    },
    
    trackAndAutoTake(counts) {
        if (state.autoTakeProcessing) return;
        
        const now = Date.now();
        const timeout = state.autoTakeTimeout;
        const onlyClassification = counts.onlyClassification || [];
        const onlySet = new Set(onlyClassification);
        
        for (const num of Object.keys(state.trackedTickets)) {
            if (!onlySet.has(num)) {
                delete state.trackedTickets[num];
                delete state.takenTickets[num];
            }
        }
        
        for (const num of onlyClassification) {
            if (!state.trackedTickets[num]) {
                state.trackedTickets[num] = now;
                logger.log(`🤖 Авто-взятие: начат отсчёт для заявки ${num}`);
            }
        }
        
        let oldestNum = null;
        let oldestElapsed = -1;
        for (const num of onlyClassification) {
            if (state.takenTickets[num]) continue;
            const elapsed = now - state.trackedTickets[num];
            if (elapsed >= timeout && elapsed > oldestElapsed) {
                oldestElapsed = elapsed;
                oldestNum = num;
            }
        }
        
        if (oldestNum) {
            const row = counts.numberToRow[oldestNum];
            if (row) {
                state.autoTakeProcessing = true;
                logger.log(`🤖 Авто-взятие: заявка ${oldestNum} висит ${Math.round(oldestElapsed/1000)}с, берём!`);
                this.autoTakeTicket(oldestNum);
            } else {
                logger.warn(`🤖 Авто-взятие: не найдена строка для заявки ${oldestNum}`);
                state.takenTickets[oldestNum] = true;
            }
        }
    },
    
    async autoTakeTicket(num) {
        try {
            const classificationRows = document.querySelectorAll('.gridContent[id*="ЗаявкиНаКлассификации"] .gridLine');
            let row = null;
            for (const r of classificationRows) {
                const text = r.textContent || '';
                const hdMatch = text.match(/HD\d{12}/g);
                if (hdMatch) {
                    for (const hd of hdMatch) {
                        const n = hd.substring(2).slice(-9);
                        if (n === num) { row = r; break; }
                    }
                    if (row) break;
                }
            }
            
            if (!row) {
                logger.warn(`🤖 Авто-взятие: строка для заявки ${num} не найдена (возможно, уже взята)`);
                state.takenTickets[num] = true;
                state.autoTakeProcessing = false;
                return;
            }
            
            row.scrollIntoView({ block: 'center', behavior: 'instant' });
            await new Promise(r => setTimeout(r, 300));
            
            const target = row.querySelector('.gridCell') || row;
            const rect = target.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            
            const allClassRows = document.querySelectorAll('.gridContent[id*="ЗаявкиНаКлассификации"] .gridLine');
            const rowIndex = Array.from(allClassRows).indexOf(row);
            
            await sendCdpMouseClick(x, y, 0);
            await new Promise(r => setTimeout(r, 500));
            
            await sendCdpMouseClick(x, y, 2);
            
            logger.log(`🤖 Авто-взятие: CDP клик по строке [${rowIndex}] заявки ${num} (x:${Math.round(x)}, y:${Math.round(y)})`);
            
            await new Promise(r => setTimeout(r, 2000));
            
            await this.clickContextMenuItem(num);
            
        } catch (error) {
            logger.error(`🤖 Авто-взятие: ошибка для заявки ${num}:`, error);
            state.autoTakeProcessing = false;
        }
    },
    
    async clickContextMenuItem(num) {
        try {
            const targetTexts = ['Взять в работу', 'Взять'];
            
            const menu = document.querySelector(
                '.contextMenu, ' +
                '[class*="ctxmenu"], ' +
                '[class*="ContextMenu"], ' +
                '.menuPopup, ' +
                '.popupMenu, ' +
                '.menuItemContainer, ' +
                '.x-menu, ' +
                '[class*="x-menu"], ' +
                '[class*="menu-popup"], ' +
                '[class*="MenuPopup"], ' +
                '.gwt-MenuBar, ' +
                '[role="menu"], ' +
                '[role="menuitem"]'
            );
            
            logger.log(`🤖 Авто-взятие: меню по селектору: ${menu ? 'найдено (' + (menu.className || menu.id) + ')' : 'НЕ найдено'}`);
            
            const tryClickElementAsync = async (element) => {
                try {
                    const r = element.getBoundingClientRect();
                    const ex = r.left + r.width / 2;
                    const ey = r.top + r.height / 2;
                    await sendCdpMouseClick(ex, ey, 0);
                    logger.log(`🤖 Авто-взятие: CDP кликнули по "${element.textContent.trim().substring(0, 50)}"`);
                    return true;
                } catch (e) {
                    return false;
                }
            };
            
            const findAndClickItemAsync = async (elements) => {
                for (const el of elements) {
                    const text = el.textContent.trim();
                    if (text && targetTexts.some(t => text.includes(t))) {
                        logger.log(`🤖 Авто-взятие: найден пункт "${text.substring(0, 50)}" для заявки ${num}`);
                        state.takenTickets[num] = true;
                        
                        if (await tryClickElementAsync(el)) {
                            await new Promise(r => setTimeout(r, 1500));
                            await sendCdpKey('ArrowDown');
                            return true;
                        }
                    }
                }
                return false;
            };
            
            if (menu) {
                const items = menu.querySelectorAll('div, span, td, a, button, li');
                if (await findAndClickItemAsync(items)) {
                    await new Promise(r => setTimeout(r, 500));
                    await sendCdpKey('ArrowDown');
                    state.autoTakeProcessing = false;
                    return;
                }
            }
            
            logger.log(`🤖 Авто-взятие: глобальный поиск пункта меню...`);
            
            const allElements = document.body.querySelectorAll('*');
            
            const scoredItems = [];
            for (const el of allElements) {
                const text = el.textContent.trim();
                const innerText = el.innerText ? el.innerText.trim() : text;
                const normalizedText = innerText.replace(/\s+/g, ' ');
                const normalizedText2 = text.replace(/\s+/g, ' ');
                
                if (!normalizedText || normalizedText.length > 60) continue;
                
                const style = window.getComputedStyle(el);
                if (style.display === 'none' || style.visibility === 'hidden') continue;
                
                const matchedTarget = targetTexts.find(t => normalizedText.includes(t) || normalizedText2.includes(t));
                if (!matchedTarget) continue;
                
                if (normalizedText.includes('...')) continue;
                
                let score = 0;
                
                if (matchedTarget === 'Взять в работу') score += 1000;
                
                if (normalizedText === matchedTarget) score += 10;
                
                if (normalizedText.length <= matchedTarget.length + 3) score += 3;
                
                if (el.tagName === 'SPAN') score += 3;
                if (el.tagName === 'I') score += 1;
                
                if (el.className.includes('submenuName') || el.className.includes('submenuText')) score += 4;
                
                if (!normalizedText.includes('F2') && !normalizedText.includes('Ctrl') && !normalizedText.includes('Shift')) score += 2;
                
                scoredItems.push({ el, text: normalizedText, score });
            }
            
            scoredItems.sort((a, b) => b.score - a.score);
            
            logger.log(`🤖 Авто-взятие: найдено ${scoredItems.length} подходящих элементов`);
            scoredItems.forEach((item, i) => {
                logger.log(`🤖   [${i}] score=${item.score} "${item.text.substring(0, 50)}" tag=${item.el.tagName} class=${item.el.className || '-'}`);
            });
            
            if (scoredItems.length > 0) {
                state.takenTickets[num] = true;
                if (await tryClickElementAsync(scoredItems[0].el)) {
                    await new Promise(r => setTimeout(r, 1500));
                    await sendCdpKey('ArrowDown');
                    state.autoTakeProcessing = false;
                    return;
                }
            }
            
            logger.warn(`🤖 Авто-взятие: поиск "Взять" во всём документе...`);
            const allEls = document.body.querySelectorAll('*');
            let foundAny = false;
            for (const el of allEls) {
                const t = (el.textContent || '').replace(/\s+/g, ' ');
                if (t.includes('Взять') && t.length < 100) {
                    const st = window.getComputedStyle(el);
                    const visible = st.display !== 'none' && st.visibility !== 'hidden';
                    logger.log(`🤖   [${visible?'✓':'✗'}] "${t.substring(0, 80)}" tag=${el.tagName} class=${el.className.substring(0,60)}`);
                    foundAny = true;
                }
            }
            if (!foundAny) logger.warn(`🤖   "Взять" не найдено нигде в DOM`);
            
            logger.warn(`🤖 Авто-взятие: дамп видимых элементов меню...`);
            
            const allBodyDivs = document.querySelectorAll('body > div');
            allBodyDivs.forEach((div, i) => {
                const html = div.innerHTML.substring(0, 500);
                const cls = div.className || '-';
                const txt = div.textContent.trim().substring(0, 200).replace(/\s+/g, ' ');
                if (txt) {
                    logger.log(`🤖   body>div[${i}] class="${cls}" text="${txt}"`);
                    logger.log(`🤖   body>div[${i}] HTML(500): ${html}`);
                }
            });
            
            state.takenTickets[num] = true;
            
        } catch (error) {
            logger.error(`🤖 Авто-взятие: ошибка при поиске меню для заявки ${num}:`, error);
        }
        
        state.autoTakeProcessing = false;
    },
    
    sendStateUpdate(counts = null) {
        if (!counts) {
            counts = this.countRealApplications();
        }
        
        const message = {
            type: 'UPDATE_MONITORING_STATE',
            state: {
                isMonitoring: state.isMonitoring,
                count: counts.count,
                groupCount: counts.groupCount,
                uniqueCount: counts.uniqueCount,
                onlyClassification: counts.onlyClassification,
                onlyGroup: counts.onlyGroup,
                commonNumbers: counts.commonNumbers
            }
        };
        
        safeSendMessage(message);
    },
    
    countRealApplications() {
        try {
            const classificationRows = document.querySelectorAll('.gridContent[id*="ЗаявкиНаКлассификации"] .gridLine');
            const groupRows = state.isGroupMonitoring ? 
                document.querySelectorAll('.gridContent[id*="УМеняВОчереди"] .gridLine') : [];
            
            logger.log('🔧 countRealApplications: found rows - class=' + classificationRows.length + ', group=' + (groupRows.length || 0));
            
            const extractNumbers = (rows) => {
                const numbers = new Set();
                
                rows.forEach(row => {
                    const rowText = row.textContent || '';
                    const hdMatches = rowText.match(/HD\d{12}/g);
                    
                    if (hdMatches) {
                        hdMatches.forEach(hdNumber => {
                            const numberWithoutHD = hdNumber.substring(2);
                            const finalNumber = numberWithoutHD.slice(-9);
                            if (!state.ignoredNumbers.includes(finalNumber)) {
                                numbers.add(finalNumber);
                            }
                        });
                    }
                });
                
                return Array.from(numbers);
            };
            
            const buildNumberToRowMap = (rows) => {
                const map = {};
                rows.forEach(row => {
                    const rowText = row.textContent || '';
                    const hdMatches = rowText.match(/HD\d{12}/g);
                    if (hdMatches) {
                        hdMatches.forEach(hdNumber => {
                            const finalNumber = hdNumber.substring(2).slice(-9);
                            if (!state.ignoredNumbers.includes(finalNumber)) {
                                map[finalNumber] = row;
                            }
                        });
                    }
                });
                return map;
            };
        
        const classificationNumbers = extractNumbers(classificationRows);
        const groupNumbers = extractNumbers(groupRows);
        const numberToRow = buildNumberToRowMap(classificationRows);
        
        const classificationSet = new Set(classificationNumbers);
        const groupSet = new Set(groupNumbers);
        
        const onlyClassification = classificationNumbers.filter(num => !groupSet.has(num));
        
        const onlyGroup = groupNumbers.filter(num => !classificationSet.has(num));
        
        const commonNumbers = classificationNumbers.filter(num => groupSet.has(num));
        
        const allUniqueNumbers = [...new Set([...classificationNumbers, ...groupNumbers])];
        
        logger.log('🔧 === СТАТИСТИКА ЗАЯВОК ===');
        logger.log(`🔧 Классификация: ${classificationNumbers.length} заявок`);
        logger.log(`🔧 Группы: ${groupNumbers.length} задач`);
        logger.log(`🔧 Общие номера (в обеих таблицах): ${commonNumbers.length}`);
        logger.log(`🔧 Только в классификации: ${onlyClassification.length}`);
        logger.log(`🔧 Только в группах: ${onlyGroup.length}`);
        logger.log(`🔧 Всего уникальных: ${allUniqueNumbers.length}`);
        
        if (onlyClassification.length > 0) {
            logger.log(`🔧 Номера только в классификации: ${onlyClassification.join(', ')}`);
        }
        
        if (onlyGroup.length > 0) {
            logger.log(`🔧 Номера только в группах: ${onlyGroup.join(', ')}`);
        }
        
        if (commonNumbers.length > 0) {
            logger.log(`🔧 Общие номера: ${commonNumbers.join(', ')}`);
        }
        
            return {
                count: onlyClassification.length,
                groupCount: onlyGroup.length,
                
                uniqueCount: allUniqueNumbers.length,
                
                classificationNumbers: classificationNumbers,
                groupNumbers: groupNumbers,
                onlyClassification: onlyClassification,
                onlyGroup: onlyGroup,
                commonNumbers: commonNumbers,
                allNumbers: allUniqueNumbers,
                
                numberToRow: numberToRow
            };
        
    } catch (error) {
        logger.error('🔧 Error counting applications:', error);
        return { 
            count: 0,
            groupCount: 0,
            uniqueCount: 0,
            classificationNumbers: [], 
            groupNumbers: [],
            onlyClassification: [],
            onlyGroup: [],
            commonNumbers: [],
            allNumbers: [],
            numberToRow: {}
        };
    }
    }
};
