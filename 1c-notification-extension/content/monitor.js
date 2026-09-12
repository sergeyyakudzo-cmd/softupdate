import { state, setCheckIntervalId, checkIntervalId, appUtils, safeSendMessage, sendCdpMouseClick, sendCdpKey } from './state.js';
import { audio } from './audio.js';
import { voice } from './voice.js';

export const monitor = {
    shiftTrackingIntervalId: null,

    start() {
        if (checkIntervalId) clearInterval(checkIntervalId);
        setCheckIntervalId(setInterval(() => { if (state.isMonitoring) this.checkApplications(); }, state.checkInterval));
    },

    stop() {
        if (checkIntervalId) { clearInterval(checkIntervalId); setCheckIntervalId(null); }
    },

    restart() { this.stop(); if (state.isMonitoring) this.start(); },

    checkApplications() {
        const counts = this.countRealApplications();
        const threshold = state.notificationThreshold || 1;

        const classDelta = counts.count - state.lastCount;
        const groupDelta = counts.groupCount - state.lastGroupCount;

        if (classDelta > 0 && classDelta >= threshold) {
            if (appUtils.canNotify('classification')) {
                this.notifyClassification(classDelta);
                state.lastClassificationNotificationTime = Date.now();
            }
            if (state.maxEnabled && window.maxModule && counts.onlyClassification?.length > 0) {
                window.maxModule.sendClassificationAlert(counts.onlyClassification.length, counts.onlyClassification);
            }
        } else if (counts.count > 0 && appUtils.canNotify('classification')) {
            this.notifyClassification(counts.count);
            state.lastClassificationNotificationTime = Date.now();
        }
        if (groupDelta > 0 && groupDelta >= threshold && state.isGroupMonitoring) {
            if (appUtils.canNotify('group')) {
                this.notifyGroup(groupDelta);
                state.lastGroupNotificationTime = Date.now();
            }
            if (state.maxEnabled && window.maxModule && counts.onlyGroup?.length > 0) {
                window.maxModule.sendGroupAlert(counts.onlyGroup.length, counts.onlyGroup);
            }
        } else if (counts.groupCount > 0 && state.isGroupMonitoring && appUtils.canNotify('group')) {
            this.notifyGroup(counts.groupCount);
            state.lastGroupNotificationTime = Date.now();
        }
        if (state.autoTakeEnabled && counts.numberToRow) this.trackAndAutoTake(counts);
        state.lastCount = counts.count;
        state.lastGroupCount = counts.groupCount;
        this.sendStateUpdate(counts);
        this.sendShiftUpdate(counts);
    },

    startShiftTracking() {
        if (this.shiftTrackingIntervalId !== null) clearInterval(this.shiftTrackingIntervalId);
        this.shiftTrackingIntervalId = setInterval(() => {
            if (!state.isMonitoring && !state.isGroupMonitoring) return;
            this.sendShiftUpdate(this.countRealApplications());
        }, 30000);
    },

    sendShiftUpdate(counts) {
        safeSendMessage({
            type: 'SHIFT_UPDATE',
            counts: { classificationNumbers: counts.classificationNumbers || [], groupNumbers: counts.groupNumbers || [] }
        }).catch(() => logger.warn('Shift update failed'));
    },

    notifyClassification(count) {
        if (state.notificationType === 'voice') voice.speakClassificationAlert(count)?.catch(() => logger.warn('Voice classification alert failed'));
        else audio.playClassificationAlert();
    },

    notifyGroup(count) {
        if (state.notificationType === 'voice') voice.speakGroupAlert(count)?.catch(() => logger.warn('Voice group alert failed'));
        else audio.playGroupAlert();
    },

    async trackAndAutoTake(counts) {
        if (state.autoTakeProcessing) return;
        const now = Date.now(), timeout = state.autoTakeTimeout;
        const onlyClassification = counts.onlyClassification || [];
        const onlySet = new Set(onlyClassification);
        Object.keys(state.trackedTickets).forEach(n => { if (!onlySet.has(n)) { delete state.trackedTickets[n]; delete state.takenTickets[n]; } });
        onlyClassification.forEach(n => { if (!state.trackedTickets[n]) state.trackedTickets[n] = now; });

        let oldestNum = null, oldestElapsed = -1;
        onlyClassification.forEach(n => {
            if (state.takenTickets[n]) return;
            const elapsed = now - state.trackedTickets[n];
            if (elapsed >= timeout && elapsed > oldestElapsed) { oldestElapsed = elapsed; oldestNum = n; }
        });

        if (oldestNum) {
            const row = counts.numberToRow[oldestNum];
            if (row) {
                state.autoTakeProcessing = true;
                try { await this.autoTakeTicket(oldestNum); } catch (err) { logger.error(`🤖 Авто-взятие: ошибка ${err}`); state.autoTakeProcessing = false; }
            } else { state.takenTickets[oldestNum] = true; }
        }
    },

    async autoTakeTicket(num) {
        try {
            const rows = document.querySelectorAll('.gridContent[id*="ЗаявкиНаКлассификации"] .gridLine');
            let row = null;
            for (const r of rows) {
                const text = r.textContent || '';
                const hdMatch = text.match(/HD\d{12}/g);
                if (hdMatch) { for (const hd of hdMatch) { const n = hd.substring(2).slice(-9); if (n === num) { row = r; break; } } if (row) break; }
            }
            if (!row) { state.autoTakeProcessing = false; return; }
            row.scrollIntoView({ block: 'center', behavior: 'instant' });
            await new Promise(r => setTimeout(r, 300));
            const target = row.querySelector('.gridCell') || row;
            const rect = target.getBoundingClientRect();
            const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
            state._lastClickX = x;
            state._lastClickY = y;
            await sendCdpMouseClick(x, y, 0);
            await new Promise(r => setTimeout(r, 500));
            await sendCdpMouseClick(x, y, 2);
            await this._clickContextMenuItem(num, sendCdpMouseClick, sendCdpKey);
        } catch (error) { logger.error(`🤖 Авто-взятие: ошибка для заявки ${num}:`, error); state.autoTakeProcessing = false; }
    },

    async _clickContextMenuItem(num, mouseClick, key) {
        const targets = ['Взять в работу', 'Взять'];

        const nativeClick = (el) => {
            ['mouseenter', 'mousedown', 'mouseup', 'click'].forEach(type => {
                el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window, button: 0, clientX: 0, clientY: 0 }));
            });
        };

        const tryClickEl = async (el, useDomFallback = true) => {
            const r = el.getBoundingClientRect();
            try {
                await mouseClick(r.left + r.width / 2, r.top + r.height / 2, 0);
                logger.log(`🤖 CDP клик по "${el.textContent.trim().substring(0, 50)}"`);
            } catch (cdpErr) {
                if (useDomFallback) {
                    logger.warn(`🤖 CDP не сработал, DOM click: ${cdpErr}`);
                    nativeClick(el);
                } else {
                    throw cdpErr;
                }
            }
        };

        await new Promise(r => setTimeout(r, 2000));

        logger.log(`🤖 elementsFromPoint: ищем меню рядом с (${state._lastClickX}, ${state._lastClickY})...`);
        const checkedEls = new Set();
        for (let dy = 0; dy <= 200; dy += 20) {
            const els = document.elementsFromPoint(state._lastClickX, state._lastClickY + dy);
            if (!els.length) continue;
            const popup = els.find(e => {
                const cn = e.className || '';
                return cn.includes('Menu') || cn.includes('menu') || cn.includes('Popup') || cn.includes('popup') || cn.includes('context') || cn === '';
            });
            const root = popup || els[0];
            if (checkedEls.has(root)) continue;
            checkedEls.add(root);
            const items = root.querySelectorAll('div, span, td, a, button, li, [class*="MenuItem"], [class*="menuItem"]');
            if (items.length > 0) {
                logger.log(`🤖 elementsFromPoint (dy=${dy}): ${items.length} элементов`);
                items.forEach((el, i) => logger.log(`🤖   [${i}] "${el.textContent.trim().substring(0, 60)}"`));
                for (const el of items) {
                    const text = el.textContent.trim();
                    if (text && targets.some(t => text.includes(t))) {
                        logger.log(`🤖 Найден "${text.substring(0, 50)}" через elementsFromPoint+dy!`);
                        try {
                            await tryClickEl(el);
                            await new Promise(r => setTimeout(r, 1500));
                            await key('ArrowDown');
                            state.takenTickets[num] = true;
                            state.autoTakeProcessing = false;
                            logger.log(`🤖 Заявка ${num} успешно взята`);
                            return;
                        } catch (err) {
                            logger.warn(`🤖 Клик через elementsFromPoint не удался: ${err}`);
                        }
                    }
                }
            }
        }

        logger.log(`🤖 Поиск меню по селекторам...`);
        const menuSelectors = '.contextMenu, [class*="ctxmenu"], [class*="ContextMenu"], .menuPopup, .popupMenu, .menuItemContainer, .x-menu, [class*="x-menu"], [class*="menu-popup"], [class*="MenuPopup"], .gwt-MenuBar, [class*="gwt-MenuBar"], [class*="gwt-MenuItem"], [role="menu"], [role="menuitem"], [class*="PopupPanel"]';
        const menu = document.querySelector(menuSelectors);
        if (menu) {
            logger.log(`🤖 Меню: class="${menu.className}" id="${menu.id}"`);
            const itemSel = 'div, span, td, a, button, li, [class*="MenuItem"], [class*="menuItem"], [role="menuitem"]';
            const items = menu.querySelectorAll(itemSel);
            logger.log(`🤖 В меню ${items.length} элементов`);
            items.forEach((el, i) => logger.log(`🤖   [${i}] "${el.textContent.trim().substring(0, 60)}"`));
            for (const el of items) {
                const text = el.textContent.trim();
                if (text && targets.some(t => text.includes(t))) {
                    try {
                        await tryClickEl(el);
                        await new Promise(r => setTimeout(r, 1500));
                        await key('ArrowDown');
                        state.takenTickets[num] = true;
                        state.autoTakeProcessing = false;
                        logger.log(`🤖 Заявка ${num} успешно взята`);
                        return;
                    } catch (err) {
                        logger.warn(`🤖 Клик пункта меню не удался: ${err}`);
                    }
                }
            }
        }

        logger.log(`🤖 Глобальный поиск по тексту "${targets.join('/')}"...`);
        const allElements = document.querySelectorAll('*');
        const scoredItems = [];
        for (const el of allElements) {
            try {
                const style = window.getComputedStyle(el);
                if (style.display === 'none' || style.visibility === 'hidden') continue;
                const r = el.getBoundingClientRect();
                if (r.width === 0 || r.height === 0) continue;
            } catch { continue; }
            const text = el.textContent.trim();
            const normalized = (el.innerText || text).replace(/\s+/g, ' ').substring(0, 60);
            if (!normalized) continue;
            const matched = targets.find(t => normalized.includes(t));
            if (!matched || normalized.includes('...')) continue;
            let score = 0;
            if (matched === 'Взять в работу') score += 1000;
            if (normalized === matched) score += 20;
            score += (el.tagName === 'SPAN' || el.tagName === 'TD') ? 5 : 0;
            score += (normalized.length <= matched.length + 3) ? 3 : 0;
            scoredItems.push({ el, score });
        }
        scoredItems.sort((a, b) => b.score - a.score);
        logger.log(`🤖 Всего ${scoredItems.length} подходящих элементов`);
        scoredItems.slice(0, 3).forEach((item, i) => logger.log(`🤖   [${i}] score=${item.score} "${item.el.textContent.trim().substring(0, 60)}"`));

        for (const item of scoredItems) {
            try {
                await tryClickEl(item.el);
                await new Promise(r => setTimeout(r, 1500));
                await key('ArrowDown');
                state.takenTickets[num] = true;
                state.autoTakeProcessing = false;
                logger.log(`🤖 Заявка ${num} успешно взята`);
                return;
            } catch (err) {
                logger.warn(`🤖 Клик "${item.el.textContent.trim().substring(0, 40)}" не удался: ${err}`);
            }
        }

        logger.log(`🤖 Пробуем Enter...`);
        try {
            await key('Enter');
            await new Promise(r => setTimeout(r, 1500));
            state.takenTickets[num] = true;
            state.autoTakeProcessing = false;
            logger.log(`🤖 Заявка ${num} успешно взята (Enter)`);
            return;
        } catch (err) {
            logger.warn(`🤖 Enter не сработал: ${err}`);
        }

        logger.warn(`🤖 Не удалось взять заявку ${num}`);
        state.autoTakeProcessing = false;
    },

    sendStateUpdate(counts) {
        safeSendMessage({
            type: 'UPDATE_MONITORING_STATE',
            state: { isMonitoring: state.isMonitoring, count: counts.count, groupCount: counts.groupCount, uniqueCount: counts.uniqueCount }
        });
    },

    countRealApplications() {
        try {
            const classRows = document.querySelectorAll('.gridContent[id*="ЗаявкиНаКлассификации"] .gridLine');
            const groupRows = state.isGroupMonitoring ? document.querySelectorAll('.gridContent[id*="УМеняВОчереди"] .gridLine') : [];
            const ignoredSet = new Set(state.ignoredNumbers);
            const proc = (rows) => {
                const nums = [], map = {};
                rows.forEach(r => { (r.textContent || '').match(/HD\d{12}/g)?.forEach(hd => { const n = hd.substring(2).slice(-9); if (!ignoredSet.has(n)) { nums.push(n); map[n] = r; } }); });
                return { nums, map };
            };
            const c = proc(classRows), g = proc(groupRows);
            const cn = c.nums, gn = g.nums, cs = new Set(cn), gs = new Set(gn);
            const onlyClass = cn.filter(n => !gs.has(n)), onlyGroup = gn.filter(n => !cs.has(n));
            return { count: onlyClass.length, groupCount: onlyGroup.length, uniqueCount: new Set([...cn, ...gn]).size, classificationNumbers: cn, groupNumbers: gn, onlyClassification: onlyClass, onlyGroup, commonNumbers: cn.filter(n => gs.has(n)), allNumbers: [...new Set([...cn, ...gn])], numberToRow: c.map };
        } catch (e) { logger.error('🔧 Error counting applications:', e); return { count: 0, groupCount: 0, uniqueCount: 0, classificationNumbers: [], groupNumbers: [], onlyClassification: [], onlyGroup: [], commonNumbers: [], allNumbers: [], numberToRow: {} }; }
    }
};
