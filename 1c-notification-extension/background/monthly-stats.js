import { sendMaxMessage } from './max-api.js';
const getCaseWord = (num, forms) => { const n = Math.abs(num) % 100, n1 = n % 10; return (n > 10 && n < 20) ? forms[2] : (n1 > 1 && n1 < 5) ? forms[1] : (n1 === 1) ? forms[0] : forms[2]; };

const monthlyStats = {
    data: { months: {} },

    init() {
        return new Promise(resolve => {
            chrome.storage.local.get(['monthlyStatsData'], (result) => {
                if (result.monthlyStatsData) this.data = result.monthlyStatsData;
                if (!this.data.months) this.data.months = {};
                resolve();
            });
        });
    },

    getMonthKey(date = new Date()) { return date.toISOString().slice(0, 7); },

    addShift(shift) {
        if (!shift?.date) return;
        const monthKey = this.getMonthKey(new Date(shift.date));
        if (!this.data.months[monthKey]) {
            this.data.months[monthKey] = { totalClassification: 0, totalGroup: 0, totalUnique: 0, shifts: 0, peakCount: 0, peakDate: null, dailyStats: {} };
        }
        const month = this.data.months[monthKey];
        const shiftTotal = (shift.classificationTotal || 0) + (shift.groupTotal || 0);
        month.shifts++;
        month.totalClassification += shift.classificationTotal || 0;
        month.totalGroup += shift.groupTotal || 0;
        month.totalUnique += shift.totalUnique || 0;
        if (shiftTotal > month.peakCount) { month.peakCount = shiftTotal; month.peakDate = shift.date; }
        month.dailyStats[shift.date] = { classification: shift.classificationTotal || 0, group: shift.groupTotal || 0, total: shiftTotal };
        this.save();
    },

    save() {
        chrome.storage.local.set({ monthlyStatsData: this.data }).catch(err => logger.error('monthlyStats: Ошибка сохранения:', err));
    },

    getMonthStats(monthKey) {
        if (!monthKey) monthKey = this.getMonthKey();
        return this.data.months[monthKey] || null;
    },

    getAllMonths() { return Object.keys(this.data.months || {}).sort().reverse(); },

    formatMonthlyReport(monthKey) {
        const month = this.data.months[monthKey];
        if (!month) return null;
        const [y, m] = monthKey.split('-');
        const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
        let text = `📊 *Статистика за ${monthNames[parseInt(m)-1]} ${y}*\n\n`;
        text += `📅 Смен: ${month.shifts}\n`;
        text += `🔔 Классификация: ${month.totalClassification} ${getCaseWord(month.totalClassification||0, ['заявка','заявки','заявок'])}\n`;
        text += `👥 Группы: ${month.totalGroup} ${getCaseWord(month.totalGroup||0, ['задача','задачи','задач'])}\n`;
        const total = (month.totalClassification || 0) + (month.totalGroup || 0);
        text += `📈 *Всего: ${total} ${getCaseWord(total, ['заявка','заявки','заявок'])}*\n\n`;
        text += `🔥 Пик: ${month.peakCount} (${month.peakDate || '-'})\n`;

        const days = Object.keys(month.dailyStats || {}).sort().reverse();
        const dayMax = Math.max(...days.map(d => month.dailyStats[d].total), 1);
        const getBar = (v, max, len = 12) => max <= 0 ? '░'.repeat(len) : '█'.repeat(Math.round((v/max)*len)) + '░'.repeat(len - Math.round((v/max)*len));
        text += '\n📊 ' + days.slice(0, 14).map(d => `${d.slice(5)}: ${getBar(month.dailyStats[d].total, dayMax)}${month.dailyStats[d].total}`).join('\n   ');
        return text;
    },

    sendMonthlyReport() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['maxBotToken', 'maxUserId'], (result) => {
                const userId = result.maxUserId || '';
                const botToken = result.maxBotToken || self.CONFIG?.MAX?.BOT_TOKEN;
                if (!botToken || !userId) { logger.log('🔧 MonthlyStats: MAX не настроен'); resolve({ success: false, error: 'MAX не настроен' }); return; }
                const report = this.formatMonthlyReport(this.getMonthKey());
                if (!report) { resolve({ success: false, error: 'Нет данных за месяц' }); return; }
                sendMaxMessage(botToken, userId, report).then(resolve).catch(err => resolve({ success: false, error: err.message }));
            });
        });
    }
};

export { monthlyStats };
