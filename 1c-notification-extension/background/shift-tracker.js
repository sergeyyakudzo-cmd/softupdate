import { monthlyStats } from './monthly-stats.js';
import { sendMaxMessage } from './max-api.js';

function getBar(value, max, length = 8) {
    if (max <= 0 || !isFinite(max) || !isFinite(value)) return '░'.repeat(length);
    const len = Math.round((value / max) * length);
    return '█'.repeat(Math.max(0, Math.min(length, len))) + '░'.repeat(Math.max(0, length - len));
}

function sendMaxDailyReport(text) {
    return new Promise((resolve) => {
        chrome.storage.local.get(['maxUserId', 'maxBotToken'], (result) => {
            const userId = result.maxUserId || '';
            const botToken = result.maxBotToken || (self.CONFIG?.MAX?.BOT_TOKEN);
            if (!botToken || !userId) {
                logger.log('🔧 ShiftTracker: MAX не настроен');
                resolve({ success: false, error: 'MAX не настроен' });
                return;
            }
            sendMaxMessage(botToken, userId, text).then(response => {
                if (response?.success) {
                    logger.log('🔧 ShiftTracker: Отчет успешно отправлен в MAX');
                    resolve({ success: true });
                } else {
                    logger.error('🔧 ShiftTracker: Ошибка отправки отчета:', response?.error);
                    resolve({ success: false, error: response?.error });
                }
            }).catch(error => {
                logger.error('🔧 ShiftTracker: Ошибка отправки:', error);
                resolve({ success: false, error: error.message });
            });
        });
    });
}

let _dailyReportHandled = false;

const shiftTracker = {
    currentShift: null,
    _loaded: false,
    _pendingUpdates: [],

    getShiftDate() {
        const now = new Date();
        if (now.getHours() < 7) {
            const y = new Date(now);
            y.setDate(y.getDate() - 1);
            return y.toISOString().split('T')[0];
        }
        return now.toISOString().split('T')[0];
    },

    initShift() {
        const shiftDate = this.getShiftDate();
        if (!this.currentShift || this.currentShift.date !== shiftDate) {
            this.currentShift = {
                date: shiftDate, totalUnique: 0, classificationTotal: 0, groupTotal: 0,
                seenOnClassification: [], seenInGroup: [],
                hourlyClassification: Array(24).fill(0), hourlyGroup: Array(24).fill(0),
                currentClassificationCount: 0, currentGroupCount: 0,
                peakClassification: 0, peakClassificationTime: null
            };
            logger.log('🔧 ShiftTracker: Новая смена началась:', shiftDate);
            this.save();
        }
        return this.currentShift;
    },

    processApplications(classNumbers = [], groupNumbers = []) {
        if (!this._loaded) { this._pendingUpdates.push({ classNumbers: [...(classNumbers || [])], groupNumbers: [...(groupNumbers || [])] }); return; }
        const shift = this.initShift();
        const hourIndex = (new Date().getHours() - 7 + 24) % 24;

        const seenClassSet = new Set(shift.seenOnClassification);
        const seenGroupSet = new Set(shift.seenInGroup);
        let newClass = 0, newGroup = 0;
        (classNumbers || []).forEach(num => {
            if (!seenClassSet.has(num) && !seenGroupSet.has(num)) { seenClassSet.add(num); shift.seenOnClassification.push(num); shift.classificationTotal++; newClass++; shift.hourlyClassification[hourIndex]++; }
        });
        (groupNumbers || []).forEach(num => {
            if (!seenClassSet.has(num) && !seenGroupSet.has(num)) { seenGroupSet.add(num); shift.seenInGroup.push(num); shift.groupTotal++; newGroup++; shift.hourlyGroup[hourIndex]++; }
        });

        shift.currentClassificationCount = classNumbers.length;
        shift.currentGroupCount = groupNumbers.length;
        if (shift.currentClassificationCount > shift.peakClassification) {
            shift.peakClassification = shift.currentClassificationCount;
            shift.peakClassificationTime = new Date().toISOString();
        }
        shift.totalUnique = shift.seenOnClassification.length + shift.seenInGroup.length;
        this.save();
        if (newClass > 0 || newGroup > 0) logger.log(`🔧 ShiftTracker: New class: ${newClass}, new group: ${newGroup}`);
    },

    getCurrentShift() { return this.initShift(); },

    save() {
        if (this.currentShift) {
            chrome.storage.local.set({ shiftData: this.currentShift }).catch(err => logger.error('🔧 ShiftTracker: Ошибка сохранения shiftData:', err));
        }
    },

    saveShiftToFile(shift) {
        if (!shift?.date) return;
        const fileData = {
            date: shift.date, classificationTotal: shift.classificationTotal || 0, groupTotal: shift.groupTotal || 0,
            totalUnique: shift.totalUnique || 0, currentClassificationCount: shift.currentClassificationCount || 0,
            currentGroupCount: shift.currentGroupCount || 0, peakClassification: shift.peakClassification || 0,
            peakClassificationTime: shift.peakClassificationTime || null,
            seenOnClassificationCount: (shift.seenOnClassification || []).length,
            seenInGroupCount: (shift.seenInGroup || []).length,
            hourlyClassification: shift.hourlyClassification || [], hourlyGroup: shift.hourlyGroup || []
        };
        const json = JSON.stringify(fileData, null, 2);
        const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
        chrome.downloads.download({ url, filename: `1c-shift/1c-shift_${shift.date}.json`, saveAs: false })
            .then((id) => { setTimeout(() => URL.revokeObjectURL(url), 1000); logger.log('🔧 ShiftTracker: Download started, id:', id); })
            .catch(err => { logger.error('🔧 ShiftTracker: Ошибка сохранения файла смены:', err); URL.revokeObjectURL(url); });
    },

    _handleDownloadChanged(delta) {
        if (delta.state) {
            if (delta.state.current === 'complete') logger.log('🔧 ShiftTracker: Download completed:', delta.id);
            else if (delta.state.current === 'interrupted') logger.error('🔧 ShiftTracker: Download interrupted:', delta.id);
        }
    },

    load(callback) {
        return new Promise(resolve => {
            chrome.storage.local.get(['shiftData'], (result) => {
                if (result.shiftData) {
                    const shiftDate = this.getShiftDate();
                    if (result.shiftData.date === shiftDate) {
                        this.currentShift = result.shiftData;
                        const s = this.currentShift;
                        if (!s.hourlyClassification) s.hourlyClassification = Array(24).fill(0);
                        if (!s.hourlyGroup) s.hourlyGroup = Array(24).fill(0);
                        if (s.peakClassification === undefined) { s.peakClassification = 0; s.peakClassificationTime = null; }
                    } else {
                        logger.log('🔧 ShiftTracker: Смена изменилась, сохраняем статистику');
                        monthlyStats.addShift(result.shiftData);
                        this.saveShiftToFile(result.shiftData);
                        this.sendDailyReport(result.shiftData);
                        chrome.alarms.clear('dailyReport');
                        setReportHandled(true);
                        this.currentShift = null;
                        this.initShift();
                    }
                } else {
                    this.initShift();
                }
                const pending = this._pendingUpdates.slice();
                this._pendingUpdates = [];
                pending.forEach(u => this.processApplications(u.classNumbers, u.groupNumbers));
                this._loaded = true;
                if (callback) callback(this.currentShift);
                resolve(this.currentShift);
            });
        });
    },

    async sendDailyReport(shiftData) {
        const shift = shiftData || this.currentShift;
        if (!shift) return { success: false, error: 'Нет данных смены' };

        const dateStr = new Date(shift.date).toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
        let text = `📊 *Отчет за смену ${dateStr}*\n\n`;
        text += `🔔 Классификация: ${shift.classificationTotal || 0} ${getCaseWord(shift.classificationTotal || 0, ['заявка', 'заявки', 'заявок'])}\n`;
        text += `👥 Группы: ${shift.groupTotal || 0} ${getCaseWord(shift.groupTotal || 0, ['задача', 'задачи', 'задач'])}\n`;
        const total = shift.totalUnique || ((shift.classificationTotal || 0) + (shift.groupTotal || 0));
        text += `\n📈 *Всего: ${total} ${getCaseWord(total, ['заявка', 'заявки', 'заявок'])}*\n\n`;
        text += this.generateHourlyChart(shift);
        logger.log('🔧 ShiftTracker: Отправляем отчет в MAX:', text);
        return await sendMaxDailyReport(text);
    },

    generateHourlyChart(shift) {
        const hc = shift.hourlyClassification || [], hg = shift.hourlyGroup || [];
        const lines = ['📈 По часам:'];
        let peak = 0, peakHour = 0;
        for (let i = 0; i < 24; i++) { if ((hc[i] || 0) > peak) { peak = hc[i]; peakHour = i; } if ((hg[i] || 0) > peak) { peak = hg[i]; peakHour = i; } }
        for (let i = 0; i < 24; i++) {
            const h = ((i + 7) % 24).toString().padStart(2, '0') + ':00';
            const v = (hc[i] || 0) + (hg[i] || 0);
            if (v > 0) {
                const bar = getBar(v, peak, 6);
                const isPeak = v === peak && peak > 0;
                lines.push(`${h}: ${bar}${v}${isPeak ? ' ✨' : ''}`);
            }
        }
        if (peak > 0) lines.push(`\n🔥 Пик: ${peak} в ${((peakHour + 7) % 24).toString().padStart(2, '0')}:00`);
        return lines.join('\n');
    },

    reset() {
        this.currentShift = null;
        this.initShift();
        chrome.action.setBadgeText({ text: '' });
    }
};

function scheduleDailyReport() {
    const now = new Date();
    const target = new Date(now);
    target.setHours(6, 50, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    chrome.alarms.create('dailyReport', { delayInMinutes: Math.max(1, (target - now) / 60000) });
    _dailyReportHandled = false;
    logger.log('🔧 ShiftTracker: Отчет запланирован на', target.toLocaleString('ru-RU'));
}

function isReportHandled() { return _dailyReportHandled; }
function setReportHandled(v) { _dailyReportHandled = v; }

export { shiftTracker, scheduleDailyReport, isReportHandled, setReportHandled };
