const HOURS = Array.from({ length: 24 }, (_, i) => (i + 7) % 24);
const LABELS = HOURS.map(h => String(h).padStart(2, '0'));
const MONTHS = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
const WEEK = ['ВС','ПН','ВТ','СР','ЧТ','ПТ','СБ'];
const fmtDate = d => { const y = d.slice(0,4), m = +d.slice(5,7), dd = +d.slice(8,10); return `${dd} ${MONTHS[m-1]} ${y}`; };
const fmtdd = d => `${String(+d.slice(8,10)).padStart(2,'0')}.${String(+d.slice(5,7)).padStart(2,'0')}`;
const fmtFull = t => { const dt = new Date(t); return dt.toLocaleString('ru-RU', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }); };
const sum = a => a.reduce((s, v) => s + v, 0);
const avg = a => sum(a) / a.length;
const argMax = a => a.reduce((bi, v, i) => v > a[bi] ? i : bi, 0);
const plural = (n, one, few, many) => { const a = Math.abs(n) % 100, b = a % 10; if (a > 10 && a < 20) return many; if (b > 1 && b < 5) return few; if (b === 1) return one; return many; };

Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = 'rgba(148,163,184,.12)';
Chart.defaults.font.family = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15,23,42,.92)';
Chart.defaults.plugins.tooltip.padding = 10;
Chart.defaults.plugins.tooltip.cornerRadius = 8;
Chart.defaults.plugins.tooltip.titleColor = '#e2e8f0';
Chart.defaults.plugins.tooltip.bodyColor = '#cbd5e1';
Chart.defaults.animation.duration = 700;
Chart.defaults.animation.easing = 'easeOutQuart';

const banner = document.getElementById('banner');
function showBanner(msg, isError = true) {
  banner.textContent = msg;
  banner.classList.add('show');
  banner.style.background = isError ? 'rgba(244,63,94,.12)' : 'rgba(52,211,153,.12)';
  banner.style.color = isError ? '#fda4af' : '#6ee7b7';
}

const pickBtn = document.getElementById('pickBtn');
const fallbackInput = document.getElementById('fallbackInput');
const reportEl = document.getElementById('report');
const exportBtn = document.getElementById('exportBtn');
const loadStorageBtn = document.getElementById('loadStorageBtn');

pickBtn.addEventListener('click', async () => {
  const files = [];
  try {
    if (window.showDirectoryPicker) {
      const dir = await window.showDirectoryPicker({ mode: 'read' });
      for await (const [, handle] of dir.entries())
        if (handle.kind === 'file' && handle.name.toLowerCase().endsWith('.json'))
          files.push(await handle.getFile());
    } else {
      fallbackInput.click();
      return;
    }
  } catch (e) {
    if (e.name === 'AbortError') return;
    fallbackInput.click();
    return;
  }
  if (files.length) await processFiles(files); else showBanner('В выбранной папке не найдено JSON-файлов статистики.');
});

fallbackInput.addEventListener('change', async (e) => {
  const files = [...e.target.files].filter(f => f.name.toLowerCase().endsWith('.json'));
  if (files.length) await processFiles(files); else showBanner('Не выбрано JSON-файлов статистики.');
  fallbackInput.value = '';
});

async function buildExportHTML() {
  const json = JSON.stringify(dataState.summary);
  const chartJs = await (await fetch('chart.umd.js')).text();
  const appSrc = await (await fetch('report.js')).text();
  const css = document.querySelector('style').textContent;
  const bodyClone = document.body.cloneNode(true);
  const sc = bodyClone.querySelector('script'); if (sc) sc.remove();
  const bodyHtml = bodyClone.innerHTML;
  const r0 = dataState.summary[0].date;
  const r1 = dataState.summary[dataState.summary.length - 1].date;
  const stamp = new Date().toLocaleString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const boot = `
(function(){
  const data = JSON.parse(document.getElementById("embeddedData").textContent);
  document.getElementById("report").style.display = "block";
  render(data);
  const p = document.getElementById("pickBtn"); if (p) p.style.display = "none";
  const e = document.getElementById("exportBtn"); if (e) e.style.display = "none";
  const l = document.getElementById("loadStorageBtn"); if (l) l.style.display = "none";
  const b = document.getElementById("banner");
  b.style.background = "rgba(52,211,153,.12)"; b.style.color = "#6ee7b7";
  b.innerHTML = "Статический отчёт по сменам ${r0} — ${r1}, создан ${stamp}.";
  b.classList.add("show");
})();
`;
  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Отчёт по заявкам за смену (${r0} — ${r1})</title>
<script>${chartJs}<\/script>
<style>${css}</style>
</head>
<body>
${bodyHtml}
<script type="application/json" id="embeddedData">${json}<\/script>
<script>
${appSrc}
<\/script>
<script>${boot}<\/script>
</body>
</html>`;
}

async function saveHTMLFile(html, name) {
  if (window.showSaveFilePicker) {
    try {
      const fh = await window.showSaveFilePicker({
        suggestedName: name,
        types: [{ description: 'HTML отчёт', accept: { 'text/html': ['.html'] } }]
      });
      const w = await fh.createWritable();
      await w.write(html);
      await w.close();
      return 'saved';
    } catch (err) {
      if (err.name === 'AbortError') return 'abort';
    }
  }
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  return 'saved';
}

exportBtn.addEventListener('click', async () => {
  if (!dataState.summary.length) { showBanner('Сначала загрузите статистику.'); return; }
  exportBtn.disabled = true;
  const r0 = dataState.summary[0].date;
  const r1 = dataState.summary[dataState.summary.length - 1].date;
  const name = `otchet_1c-shift_${r0}_${r1}.html`;
  try {
    const res = await saveHTMLFile(await buildExportHTML(), name);
    if (res === 'abort') return;
    showBanner('Отчёт сохранён.', false);
  } catch (err) {
    showBanner('Не удалось сохранить: ' + (err && err.message ? err.message : err));
  } finally {
    exportBtn.disabled = false;
  }
});

const canStorage = () => typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

function getStoredData() {
  if (!canStorage()) return Promise.resolve({ shiftsArchive: {}, shiftData: null });
  return new Promise(res => {
    try {
      chrome.storage.local.get(['shiftsArchive', 'shiftData'], r =>
        res({ shiftsArchive: r.shiftsArchive || {}, shiftData: r.shiftData || null }));
    } catch { res({ shiftsArchive: {}, shiftData: null }); }
  });
}

function slimShift(d) {
  const hc = Array.isArray(d.hourlyClassification) && d.hourlyClassification.length === 24 ? d.hourlyClassification : Array(24).fill(0);
  const hg = Array.isArray(d.hourlyGroup) && d.hourlyGroup.length === 24 ? d.hourlyGroup : Array(24).fill(0);
  return {
    date: d.date || '',
    classificationTotal: d.classificationTotal || 0,
    groupTotal: d.groupTotal || 0,
    totalUnique: d.totalUnique || 0,
    peakClassification: d.peakClassification || 0,
    peakClassificationTime: d.peakClassificationTime || null,
    hourlyClassification: hc,
    hourlyGroup: hg
  };
}

function persistToArchive(list) {
  if (!canStorage()) return;
  chrome.storage.local.get(['shiftsArchive'], r => {
    const arch = r.shiftsArchive || {};
    list.forEach(d => { if (d && d.date) arch[d.date] = slimShift(d); });
    chrome.storage.local.set({ shiftsArchive: arch }).catch(() => {});
  });
}

async function loadFromStorage() {
  const { shiftsArchive = {}, shiftData = null } = await getStoredData();
  let list = Object.keys(shiftsArchive).sort().map(k => shiftsArchive[k]);
  if (shiftData && shiftData.date && !list.some(x => x.date === shiftData.date)) {
    list.push(slimShift(shiftData));
    list.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }
  if (!list.length) {
    showBanner('В расширении пока нет данных. Импортируйте папку с файлами статистики.');
    return;
  }
  render(list);
  reportEl.style.display = 'block';
  reportEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

if (loadStorageBtn) loadStorageBtn.addEventListener('click', loadFromStorage);

async function processFiles(files) {
  const data = [];
  let bad = 0;
  for (const f of files) {
    try {
      const j = JSON.parse(await f.text());
      if (j && Array.isArray(j.hourlyClassification) && j.hourlyClassification.length === 24) data.push(j);
      else bad++;
    } catch { bad++; }
  }
  data.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  if (!data.length) { showBanner('Не удалось распарсить ни одного файла статистики.'); return; }
  if (bad) showBanner(`Пропущено файлов: ${bad}.`, false);
  persistToArchive(data);
  render(data);
  reportEl.style.display = 'block';
  reportEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function render(data) {
  dataState.summary = data;
  exportBtn.disabled = false;
  const n = data.length;
  const totUnique = sum(data.map(d => d.totalUnique || 0));
  const totCls = sum(data.map(d => d.classificationTotal || 0));
  const totGrp = sum(data.map(d => d.groupTotal || 0));
  const topPeak = data.reduce((m, d) => (d.peakClassification || 0) > (m.v || 0) ? { v: d.peakClassification || 0, d } : m, { v: 0, d: null });
  const maxShift = data.reduce((m, d) => (d.totalUnique || 0) > (m.v || 0) ? { v: d.totalUnique || 0, d } : m, { v: 0, d: null });
  const dates = data.map(d => d.date);
  const d0 = dates[0], d1 = dates[n - 1];
  const busyHourIdx = argMax(Array.from({ length: 24 }, (_, i) => avg(data.map(d => d.hourlyClassification[i]))));

  document.getElementById('statsRow').innerHTML = `
    <div class="stat card"><div class="label">Смен в анализе</div><div class="value sky" data-count="${n}">0</div><div class="sub">${fmtDate(d0)} &mdash; ${fmtDate(d1)}</div></div>
    <div class="stat card"><div class="label">Всего заявок (уник.)</div><div class="value green" data-count="${totUnique}">0</div><div class="sub">в сумме за все смены</div></div>
    <div class="stat card"><div class="label">Классификация</div><div class="value rose" data-count="${totCls}">0</div><div class="sub">группа: ${totGrp.toLocaleString('ru-RU')}</div></div>
    <div class="stat card"><div class="label">В среднем за смену</div><div class="value violet" data-count="${(totUnique / n).toFixed(1)}" data-dec="1">0</div><div class="sub">заявок</div></div>
    <div class="stat card"><div class="label">Макс. заявок за смену</div><div class="value amber" data-count="${maxShift.v}">0</div><div class="sub">${fmtDate(maxShift.d.date)}</div></div>
    <div class="stat card"><div class="label">Макс. одновременных</div><div class="value" data-count="${topPeak.v}">0</div><div class="sub">${topPeak.d ? `${fmtDate(topPeak.d.date)}, ${fmtFull(topPeak.d.peakClassificationTime)}` : ''}</div></div>
    <div class="stat card"><div class="label">Пиковая загрузка</div><div class="value">${LABELS[busyHourIdx]}:00</div><div class="sub">в среднем самый долгий час</div></div>
  `;

  buildTotalChart(data);
  buildHourlyChart(data);
  buildPolar(data);
  buildDayNight(data);
  buildShiftPlay(data);
  buildFlow(data);
  buildDoughnut(data);
  buildWeekday(data);
  buildCum(data);
  buildHist(data);
  buildPeakHour(data);
  buildPeakChart(data);
  buildProfiles(data);
  buildHeatmap(data, 'classification');
  bindSeg('heatSeg', mode => buildHeatmap(dataState.summary, mode));
  buildCalendar(data);
  buildTable(data);
  countUpCards();
  staggerPanels();
}

// ---------- Всего по сменам (стек) ----------
function buildTotalChart(data) {
  const dates = data.map(d => d.date);
  new Chart(document.getElementById('cTotal'), {
    type: 'bar',
    data: {
      labels: dates.map(d => fmtdd(d)),
      datasets: [
        { label: 'Классификация', data: data.map(d => d.classificationTotal || 0), backgroundColor: 'rgba(244,63,94,.85)', borderRadius: 5, stack: 's' },
        { label: 'Группа', data: data.map(d => d.groupTotal || 0), backgroundColor: 'rgba(56,189,248,.85)', borderRadius: 5, stack: 's' }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { labels: { boxWidth: 12, boxHeight: 12, usePointStyle: true, pointStyle: 'circle' } },
        tooltip: { callbacks: {
          label: c => `${c.dataset.label}: ${c.parsed.y.toLocaleString('ru-RU')}`,
          footer: it => `Всего уник.: ${(data[it[0].dataIndex].totalUnique || 0).toLocaleString('ru-RU')}`
        } }
      },
      scales: { y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,.08)' }, ticks: { precision: 0 } }, x: { grid: { display: false } } }
    }
  });
}

// ---------- Часовое распределение ----------
let hourlyChart = null;
function hourlyData(mode) {
  const cls = Array.from({ length: 24 }, (_, i) => dataState.summary.map(d => d.hourlyClassification[i]));
  const grp = Array.from({ length: 24 }, (_, i) => dataState.summary.map(d => d.hourlyGroup[i]));
  const pick = mode === 'sum' ? sum : avg;
  return { cls: cls.map(pick), grp: grp.map(pick) };
}
function buildHourlyChart(data) {
  const d = hourlyData('avg');
  hourlyChart = new Chart(document.getElementById('cHourly'), {
    type: 'bar',
    data: {
      labels: LABELS.map((h, i) => h === '00' ? '00*' : h),
      datasets: [
        { label: 'Классификация', data: d.cls, backgroundColor: 'rgba(244,63,94,.8)', borderRadius: 4 },
        { label: 'Группа', data: d.grp, backgroundColor: 'rgba(56,189,248,.8)', borderRadius: 4 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { labels: { boxWidth: 12, boxHeight: 12, usePointStyle: true, pointStyle: 'circle' } },
        tooltip: { callbacks: { title: it => `Час ${it[0].label.replace('*','')}:00` } }
      },
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,.08)' }, ticks: { precision: 0 } },
        x: { grid: { display: false }, title: { display: true, text: 'Час смены (07:00 → 06:59, * — полночь)', color: '#64748b', font: { size: 11 } } }
      }
    }
  });
  bindSeg('hourlySeg', mode => {
    const dd = hourlyData(mode);
    hourlyChart.data.datasets[0].data = dd.cls;
    hourlyChart.data.datasets[1].data = dd.grp;
    hourlyChart.update();
  });
}

function bindSeg(id, onMode) {
  const seg = document.getElementById(id);
  seg.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    seg.querySelectorAll('button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    onMode(b.dataset.mode);
  }));
}

// ---------- Доля классификация / группа ----------
function buildDoughnut(data) {
  const totCls = sum(data.map(d => d.classificationTotal || 0));
  const totGrp = sum(data.map(d => d.groupTotal || 0));
  const center = {
    id: 'centerText',
    afterDraw(c) {
      const { ctx, chartArea: a } = c;
      const x = (a.left + a.right) / 2, y = (a.top + a.bottom) / 2;
      ctx.save();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '700 26px system-ui'; ctx.fillStyle = '#f1f5f9';
      ctx.fillText((totCls + totGrp).toLocaleString('ru-RU'), x, y - 8);
      ctx.font = '500 12px system-ui'; ctx.fillStyle = '#64748b';
      ctx.fillText('всего заявок', x, y + 14);
      ctx.restore();
    }
  };
  new Chart(document.getElementById('cDoughnut'), {
    type: 'doughnut',
    data: {
      labels: ['Классификация', 'Группа'],
      datasets: [{
        data: [totCls, totGrp],
        backgroundColor: ['rgba(244,63,94,.85)', 'rgba(56,189,248,.85)'],
        borderColor: '#0f172a', borderWidth: 3, hoverOffset: 8
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '68%',
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, boxHeight: 12, usePointStyle: true, pointStyle: 'circle', padding: 16 } },
        tooltip: { callbacks: { label: c => ` ${c.label}: ${c.parsed.toLocaleString('ru-RU')} (${((c.parsed / (totCls + totGrp)) * 100).toFixed(1)}%)` } }
      }
    },
    plugins: [center]
  });
}

// ---------- Дни недели ----------
function buildWeekday(data) {
  const byDay = WEEK.map(() => []);
  data.forEach(d => { byDay[new Date(d.date + 'T00:00:00').getDay()].push(d.totalUnique || 0); });
  const values = WEEK.map((w, i) => byDay[i].length ? avg(byDay[i]) : null);
  const colors = WEEK.map((w, i) => byDay[i].length ? 'rgba(56,189,248,.8)' : 'rgba(148,163,184,.15)');
  new Chart(document.getElementById('cWeekday'), {
    type: 'bar',
    data: {
      labels: WEEK,
      datasets: [{
        label: 'Среднее заявок за смену', data: values,
        backgroundColor: colors, borderRadius: 5, barPercentage: .7
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,.08)' }, ticks: { precision: 0 } }, x: { grid: { display: false } } }
    }
  });
}

// ---------- Накопленный итог ----------
function buildCum(data) {
  const run = [], a = [];
  data.forEach((d, i) => { a[i] = d.totalUnique || 0; run[i] = i ? run[i - 1] + a[i] : a[i]; });
  const dates = data.map(d => d.date);
  new Chart(document.getElementById('cCum'), {
    type: 'line',
    data: {
      labels: dates.map(d => fmtdd(d)),
      datasets: [{
        label: 'Накоплено заявок', data: run,
        borderColor: '#34d399', backgroundColor: 'rgba(52,211,153,.18)',
        fill: true, tension: .3, pointRadius: 3, borderWidth: 2.5
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,.08)' } }, x: { grid: { display: false } } }
    }
  });
}

// ---------- Гистограмма смен по объёму ----------
function buildHist(data) {
  const edges = [0, 50, 100, 150, 200, 250, 300, Infinity];
  const labels = ['0–49', '50–99', '100–149', '150–199', '200–249', '250–299', '300+'];
  const counts = edges.slice(0, -1).map((e, i) => data.filter(d => (d.totalUnique || 0) >= e && (d.totalUnique || 0) < edges[i + 1]).length);
  new Chart(document.getElementById('cHist'), {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Смен', data: counts, backgroundColor: 'rgba(167,139,250,.8)', borderRadius: 5, barPercentage: .68 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,.08)' }, ticks: { precision: 0 } }, x: { grid: { display: false } } }
    }
  });
}

// ---------- Час пика по сменам ----------
function buildPeakHour(data) {
  const peakIdx = data.map(d => argMax(d.hourlyClassification));
  const counts = LABELS.map((_, i) => peakIdx.filter(x => x === i).length);
  new Chart(document.getElementById('cPeakHour'), {
    type: 'bar',
    data: {
      labels: LABELS.map((h, i) => h === '00' ? '00*' : h),
      datasets: [{ label: 'Смен с пиком в этом часу', data: counts, backgroundColor: 'rgba(251,191,36,.8)', borderRadius: 4 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,.08)' }, ticks: { precision: 0 } }, x: { grid: { display: false } } }
    }
  });
}

// ---------- Пик одновременно ----------
function buildPeakChart(data) {
  const dates = data.map(d => d.date);
  new Chart(document.getElementById('cPeak'), {
    type: 'line',
    data: {
      labels: dates.map(d => fmtdd(d)),
      datasets: [{
        label: 'Пик (классификация)', data: data.map(d => d.peakClassification || 0),
        borderColor: '#fbbf24', backgroundColor: 'rgba(251,191,36,.18)',
        fill: true, tension: .35, pointRadius: 4, pointBackgroundColor: '#fbbf24', borderWidth: 2.5
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,.08)' }, ticks: { precision: 0 } }, x: { grid: { display: false } } }
    }
  });
}

// ---------- Почасовые профили ----------
function buildProfiles(data) {
  const ds = data.map((d, i) => ({
    label: fmtDate(d.date),
    data: d.hourlyClassification,
    borderColor: `hsla(${(i * 137.5) % 360}, 75%, 65%, .55)`,
    backgroundColor: 'transparent',
    borderWidth: 1.5, tension: .3, pointRadius: 0
  }));
  const avgLine = Array.from({ length: 24 }, (_, i) => avg(data.map(d => d.hourlyClassification[i])));
  ds.push({
    label: 'Средняя по всем сменам', data: avgLine,
    borderColor: '#f8fafc', backgroundColor: 'transparent',
    borderWidth: 3, tension: .3, pointRadius: 2.5, pointBackgroundColor: '#f8fafc'
  });
  new Chart(document.getElementById('cProfiles'), {
    type: 'line',
    data: { labels: LABELS.map((h, i) => h === '00' ? '00*' : h), datasets: ds },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { title: it => `Час ${it[0].label.replace('*','')}:00` } }
      },
      scales: { y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,.08)' }, ticks: { precision: 0 } }, x: { grid: { display: false } } }
    }
  });
}

// ---------- Радар часов ----------
const clockDial = {
  id: 'clockDial',
  afterDraw(chart) {
    const rs = chart.scales.r;
    if (!rs || !rs.xCenter) return;
    const info = chart.$polarInfo || { offsets: Array.from({ length: 24 }, (_, i) => i) };
    const ctx = chart.ctx;
    const cx = rs.xCenter, cy = rs.yCenter;
    const R = Math.min(rs.right - rs.xCenter, rs.yCenter - rs.top);
    if (R < 20) return;
    const n = info.offsets.length;
    const step = n === 12 ? 3 : 6;
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.strokeStyle = 'rgba(148,163,184,.4)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    for (let s = 0; s < n; s++) {
      const a = -Math.PI / 2 + (s * 2 * Math.PI) / n;
      const h = info.offsets[s];
      const major = s % step === 0;
      const dx = Math.cos(a), dy = Math.sin(a);
      ctx.strokeStyle = major ? 'rgba(203,213,225,.95)' : 'rgba(148,163,184,.55)';
      ctx.lineWidth = major ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(cx + dx * (R - (major ? 15 : 7)), cy + dy * (R - (major ? 15 : 7)));
      ctx.lineTo(cx + dx * R, cy + dy * R);
      ctx.stroke();
      ctx.fillStyle = s === 0 ? '#fbbf24' : '#94a3b8';
      ctx.font = (major ? '700 ' : '500 ') + '10px system-ui';
      ctx.fillText(LABELS[h], cx + dx * (R - 20), cy + dy * (R - 20));
    }
    ctx.restore();
  }
};
const polar = { chart: null };
function buildPolar(data) {
  const avgArr = Array.from({ length: 24 }, (_, i) => avg(data.map(d => d.hourlyClassification[i])));
  const maxV = Math.max(...avgArr, 1);
  const modeSet = {
    '24': { offsets: Array.from({ length: 24 }, (_, i) => i), label: LABELS.map((h, i) => h === '00' ? '00*' : h) },
    day: { offsets: Array.from({ length: 12 }, (_, i) => i), label: LABELS.slice(0, 12) },
    night: { offsets: Array.from({ length: 12 }, (_, i) => i + 12), label: LABELS.slice(12) }
  };
  const chart = new Chart(document.getElementById('cPolar'), {
    type: 'polarArea',
    data: {
      labels: modeSet['24'].label,
      datasets: [{ data: avgArr, backgroundColor: avgArr.map((v, i) => `hsla(${(i / 24) * 360}, 80%, 60%, .55)`), borderColor: 'rgba(11,18,32,.6)', borderWidth: 1 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { title: it => `Час ${it[0].label.replace('*','')}:00` } }
      },
      scales: { r: { beginAtZero: true, max: Math.ceil(maxV * 1.35), ticks: { display: false }, grid: { color: 'rgba(148,163,184,.10)' } } }
    },
    plugins: [clockDial]
  });
  polar.chart = chart;
  function applyMode(m) {
    const mode = modeSet[m];
    const ds = chart.data.datasets[0];
    ds.data = mode.offsets.map(o => avgArr[o]);
    ds.backgroundColor = mode.offsets.map(o => `hsla(${(o / 24) * 360}, 80%, 60%, .55)`);
    chart.data.labels = mode.label.slice();
    chart.$polarInfo = mode;
    chart.update();
  }
  document.getElementById('polarSeg').querySelectorAll('button').forEach(b => {
    b.addEventListener('click', () => {
      document.getElementById('polarSeg').querySelectorAll('button').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      applyMode(b.dataset.mode);
    });
  });
  chart.$polarInfo = modeSet['24'];
}

// ---------- День / ночь ----------
function buildDayNight(data) {
  const dates = data.map(d => d.date);
  const day = data.map(d => sum(d.hourlyClassification.slice(0, 12)));
  const night = data.map(d => sum(d.hourlyClassification.slice(12)));
  new Chart(document.getElementById('cDayNight'), {
    type: 'bar',
    data: {
      labels: dates.map(d => fmtdd(d)),
      datasets: [
        { label: 'День (07–19)', data: day, backgroundColor: 'rgba(251,191,36,.9)', borderRadius: 4, stack: 's' },
        { label: 'Ночь (19–07)', data: night, backgroundColor: 'rgba(99,102,241,.9)', borderRadius: 4, stack: 's' }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { labels: { boxWidth: 12, boxHeight: 12, usePointStyle: true, pointStyle: 'circle' } },
        tooltip: { callbacks: {
          label: c => `${c.dataset.label}: ${c.parsed.y.toLocaleString('ru-RU')}`,
          footer: it => `Всего: ${(data[it[0].dataIndex].totalUnique || 0).toLocaleString('ru-RU')}`
        } }
      },
      scales: { y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,.08)' }, ticks: { precision: 0 } }, x: { grid: { display: false } } }
    }
  });
}

// ---------- Профиль смены и средняя (с автопроигрыванием) ----------
const shiftPlay = { chart: null, idx: 0, timer: null, speed: 1, playing: false };
function buildShiftPlay(data) {
  const sel = document.getElementById('cpSelect');
  const playBtn = document.getElementById('cpPlay');
  const dateEl = document.getElementById('cpDate');
  const avgLine = Array.from({ length: 24 }, (_, i) => avg(data.map(d => d.hourlyClassification[i])));
  sel.innerHTML = data.map((d, i) => `<option value="${i}">${fmtDate(d.date)}</option>`).join('');
  const chart = new Chart(document.getElementById('cShiftPlay'), {
    type: 'bar',
    data: {
      labels: LABELS.map((h, i) => h === '00' ? '00*' : h),
      datasets: [
        { label: 'Смена', data: data[0].hourlyClassification, backgroundColor: 'rgba(251,191,36,.85)', borderRadius: 4 },
        { label: 'В среднем за все смены', data: avgLine, type: 'line', borderColor: '#f8fafc', backgroundColor: 'rgba(248,250,252,.08)', borderWidth: 2.5, tension: .35, pointRadius: 0, fill: true }
      ]
    },
options: {
        responsive: true, maintainAspectRatio: false, animation: { duration: 250 },
        plugins: {
          legend: { labels: { boxWidth: 12, boxHeight: 12, usePointStyle: true, pointStyle: 'circle' } },
          tooltip: { callbacks: { title: it => `Час ${it[0].label.replace('*','')}:00` } }
        },
        scales: {
          y: { beginAtZero: true, max: Math.ceil(Math.max(...data.map(d => Math.max(...d.hourlyClassification)))), grid: { color: 'rgba(148,163,184,.08)' }, ticks: { precision: 0 } },
          x: { grid: { display: false } }
        }
      }
  });
  shiftPlay.chart = chart;
  function updateIdx(i) {
    shiftPlay.idx = i;
    sel.value = String(i);
    chart.data.datasets[0].data = data[i].hourlyClassification;
    chart.update();
    dateEl.innerHTML = `<span>Смена <b>${fmtDate(data[i].date)}</b></span><span>всего <b>${(data[i].totalUnique || 0).toLocaleString('ru-RU')}</b> заявок</span>`;
  }
  updateIdx(0);
  const play = () => {
    shiftPlay.playing = true; playBtn.textContent = '⏸'; playBtn.classList.add('playing');
    const step = () => {
      if (!shiftPlay.playing) return;
      const next = (shiftPlay.idx + 1) % data.length;
      updateIdx(next);
      if (next === 0) { stop(); return; }
      shiftPlay.timer = setTimeout(step, 1500 / shiftPlay.speed);
    };
    shiftPlay.timer = setTimeout(step, 1500 / shiftPlay.speed);
  };
  const stop = () => {
    shiftPlay.playing = false; playBtn.textContent = '▶'; playBtn.classList.remove('playing');
    clearTimeout(shiftPlay.timer);
  };
  playBtn.addEventListener('click', () => { shiftPlay.playing ? stop() : play(); });
  sel.addEventListener('change', () => { stop(); updateIdx(+sel.value); });
  document.getElementById('cpSeg').querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    document.getElementById('cpSeg').querySelectorAll('button').forEach(x => x.classList.remove('active'));
    b.classList.add('active'); shiftPlay.speed = +b.dataset.speed;
  }));
}

// ---------- Скруббер по профилю смены ----------
const flow = { chart: null, k: 0, reveal: 0, playing: false, raf: null, last: 0 };
const flowPx = (chart, t) => {
  const xs = chart.scales.x;
  if (!xs) return null;
  const i = Math.min(23, Math.max(0, Math.floor(t)));
  const f = t - i;
  const a = xs.getPixelForTick(i);
  const b = xs.getPixelForTick(Math.min(23, i + 1));
  return a + (b - a) * f;
};
const monoY = (chart, h) => {
  const vals = chart.data.datasets[0].data;
  const xs = chart.scales.x, ys = chart.scales.y;
  if (!xs || !ys || !vals || !vals.length) return null;
  const n = vals.length;
  const i = Math.min(n - 1, Math.max(0, Math.floor(h)));
  const f = Math.min(1, Math.max(0, h - i));
  if (i >= n - 1) return ys.getPixelForValue(vals[n - 1]);
  if (f === 0) return ys.getPixelForValue(vals[i]);
  const yp = Array.from({ length: n }, (_, k) => ys.getPixelForValue(vals[k]));
  const dxP = (xs.getPixelForTick(1) - xs.getPixelForTick(0)) || 1;
  const sl = new Array(n - 1);
  for (let k = 0; k < n - 1; k++) sl[k] = (yp[k + 1] - yp[k]) / dxP;
  const tg = new Array(n).fill(0);
  tg[0] = sl[0];
  tg[n - 1] = sl[n - 2];
  for (let k = 1; k < n - 1; k++) {
    tg[k] = sl[k - 1] * sl[k] <= 0 ? 0 : 2 / (1 / sl[k - 1] + 1 / sl[k]);
  }
  const p0 = yp[i], p1 = yp[i + 1];
  const c1 = p0 + (tg[i] * dxP) / 3;
  const c2 = p1 - (tg[i + 1] * dxP) / 3;
  const u = 1 - f;
  return u * u * u * p0 + 3 * u * u * f * c1 + 3 * u * f * f * c2 + f * f * f * p1;
};
const revealClip = {
  id: 'revealClip',
  beforeDatasetsDraw(chart) {
    if (chart.$reveal === undefined || !chart.chartArea) { chart._rx = null; return; }
    const ctx = chart.ctx;
    const { left, top, bottom, right } = chart.chartArea;
    const x = flowPx(chart, chart.$reveal);
    if (x === null) { chart._rx = null; return; }
    const cx = Math.min(Math.max(x, left), right);
    chart._rx = cx;
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, top, Math.max(0, cx - left), bottom - top);
    ctx.clip();
  },
  afterDatasetsDraw(chart) {
    const cx = chart._rx;
    chart._rx = null;
    if (cx === null || cx === undefined || !chart.chartArea) return;
    const ctx = chart.ctx;
    ctx.restore();
    const { top, bottom } = chart.chartArea;
    const t = chart.$reveal || 0;
    ctx.save();
    ctx.strokeStyle = 'rgba(248,250,252,.55)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx, top); ctx.lineTo(cx, bottom); ctx.stroke();
    const vals = chart.data.datasets[0].data;
    if (vals && vals.length) {
      const y = monoY(chart, t);
      if (y !== null && !Number.isNaN(y)) {
        ctx.fillStyle = '#fbbf24';
        ctx.strokeStyle = '#0b1220'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, y, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
    }
    const marks = [];
    let cum = 0, mk = 50;
    for (let hh = 0; hh < vals.length; hh++) {
      const vh = vals[hh] || 0;
      if (vh > 0) {
        while (mk <= cum + vh) {
          const tf = Math.min(1, Math.max(0, (mk - cum) / vh));
          const th = hh + tf;
          if (th <= t) marks.push({ h: th, label: String(mk) });
          mk += 50;
        }
      }
      cum += vh;
    }
    let lastX = -1e9, row = 0;
    marks.forEach(m => {
      m.x = flowPx(chart, m.h);
      m.y = m.x === null ? null : monoY(chart, m.h);
      if (m.x === null || m.y === null || Number.isNaN(m.y)) return;
      if (m.x - lastX < 26) row = Math.min(row + 1, 4); else row = 0;
      m.row = row;
      lastX = m.x;
    });
    marks.forEach(m => {
      if (m.x === null || m.y === null || Number.isNaN(m.y)) return;
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.arc(m.x, m.y, 3, 0, Math.PI * 2); ctx.fill();
      const ly = Math.max(top + 8, m.y - 22 - m.row * 16);
      ctx.strokeStyle = 'rgba(251,191,36,.5)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(m.x, m.y - 4); ctx.lineTo(m.x, ly - 1); ctx.stroke();
      ctx.font = '600 10px system-ui';
      const w = ctx.measureText(m.label).width + 10;
      const hh = 14;
      ctx.fillStyle = 'rgba(11,18,32,.85)';
      ctx.beginPath();
      ctx.roundRect(m.x - w / 2, ly - hh, w, hh, 4);
      ctx.fill();
      ctx.fillStyle = 'rgba(251,191,36,.95)';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(m.label, m.x, ly - hh / 2 + 1);
    });
    ctx.restore();
  }
};
function buildFlow(data) {
  const sel = document.getElementById('sfSelect');
  const playBtn = document.getElementById('sfPlay');
  const slider = document.getElementById('sfSlider');
  const dateEl = document.getElementById('sfDate');
  const labels = LABELS.map((h, i) => h === '00' ? '00*' : h);
  sel.innerHTML = data.map((d, i) => `<option value="${i}">${fmtDate(d.date)}</option>`).join('');
  const chart = new Chart(document.getElementById('cFlow'), {
    type: 'line',
    data: {
      labels,
      datasets: [{ data: [], borderColor: '#fbbf24', backgroundColor: 'rgba(251,191,36,.10)', borderWidth: 3, tension: .45, interpolation: { mode: 'monotone' }, fill: true, pointRadius: 0, pointHoverRadius: 5, pointHoverBackgroundColor: '#fbbf24' }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, animation: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, max: Math.ceil(Math.max(...data.map(d => Math.max(...d.hourlyClassification)))), grid: { color: 'rgba(148,163,184,.08)' }, ticks: { precision: 0 } },
        x: { grid: { display: false } }
      }
    },
    plugins: [revealClip]
  });
  flow.chart = chart;
  const setShift = k => {
    flow.k = k;
    chart.data.datasets[0].data = data[k].hourlyClassification.slice();
  };
  const paint = () => {
    chart.$reveal = flow.reveal;
    chart.update('none');
    const vals = chart.data.datasets[0].data;
    const h = Math.min(23, Math.max(0, Math.floor(flow.reveal - 1e-9)));
    const cum = vals.slice(0, h + 1).reduce((s, v) => s + (v || 0), 0);
    const total = data[flow.k].totalUnique || 0;
    const pct = total ? Math.round(cum / total * 100) : 0;
    dateEl.innerHTML = `<span>Смена <b>${fmtDate(data[flow.k].date)}</b></span><span>час <b>${labels[h].replace('*','')}:00</b></span><span class="delta">заявок: ${vals[h] || 0}</span><span>накоплено <b>${cum.toLocaleString('ru-RU')}</b> из ${total.toLocaleString('ru-RU')} (${pct}%)</span>`;
  };
  flow.paint = paint;
  setShift(0);
  flow.reveal = 0; slider.value = 0; paint();
  const start = () => {
    if (flow.reveal >= 23) flow.reveal = 0;
    flow.playing = true; playBtn.textContent = '⏸'; playBtn.classList.add('playing'); flow.last = performance.now();
    const step = now => {
      if (!flow.playing) return;
      const dt = Math.min(.05, (now - flow.last) / 1000); flow.last = now;
      flow.reveal += dt * (23 / 10);
      if (flow.reveal >= 23) { flow.reveal = 23; slider.value = 23; paint(); stop(); return; }
      if (Math.round(flow.reveal) !== +slider.value) slider.value = Math.round(flow.reveal);
      paint();
      flow.raf = requestAnimationFrame(step);
    };
    flow.raf = requestAnimationFrame(step);
  };
  const stop = () => {
    flow.playing = false; playBtn.textContent = '▶'; playBtn.classList.remove('playing');
    cancelAnimationFrame(flow.raf);
  };
  playBtn.addEventListener('click', () => { flow.playing ? stop() : start(); });
  slider.addEventListener('input', () => { stop(); flow.reveal = +slider.value; paint(); });
  sel.addEventListener('change', () => { stop(); flow.reveal = 0; slider.value = 0; setShift(+sel.value); paint(); });
}

// ---------- Count-up цифр и каскадное появление ----------
function countUpCards() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = (v, dec) => dec ? v.toFixed(1).replace('.', ',') : Math.round(v).toLocaleString('ru-RU');
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseFloat(el.dataset.count);
    const dec = el.dataset.dec || 0;
    if (reduce || !('requestAnimationFrame' in window)) { el.textContent = fmt(target, dec); return; }
    const t0 = performance.now();
    const tick = now => {
      const p = Math.min(1, (now - t0) / 800);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * e, dec);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}
function staggerPanels() {
  const panels = document.querySelectorAll('.panel');
  panels.forEach((p, i) => { p.style.animationDelay = Math.min(i * 45, 400) + 'ms'; });
}

// ---------- Тепловая карта по часам ----------
function heatColor(v, max) {
  if (!max) return 'rgba(148,163,184,.10)';
  const t = v / max;
  const hue = 220 - 220 * t;
  return `hsla(${hue}, 85%, 47%, ${0.22 + 0.78 * t})`;
}
function buildHeatmap(data, field) {
  const get = d => (d[field === 'classification' ? 'hourlyClassification' : 'hourlyGroup'] || []);
  const max = Math.max(1, ...data.flatMap(d => get(d)));
  const grid = document.getElementById('heatMap');
  let html = '<div class="corner"></div>';
  html += LABELS.map(h => `<div class="hourhead">${h}</div>`).join('');
  data.forEach(d => {
    html += `<div class="datehead">${fmtdd(d.date)}</div>`;
    get(d).forEach((v, i) => {
      html += `<div class="cell" style="background:${heatColor(v, max)}" title="${fmtdd(d.date)}, час ${LABELS[i]}:00 — ${v} заявок">${v || ''}</div>`;
    });
  });
  grid.innerHTML = html;
}

// ---------- Календарь ----------
function buildCalendar(data) {
  const byDate = new Map(data.map(d => [d.date, d.totalUnique || 0]));
  const max = Math.max(1, ...byDate.values());
  const months = [];
  for (const d of data) {
    const k = d.date.slice(0, 7);
    if (!months.includes(k)) months.push(k);
  }
  const wdOrder = [1, 2, 3, 4, 5, 6, 0];
  let html = '';
  months.forEach(m => {
    const [yy, mm] = m.split('-').map(Number);
    const first = new Date(yy, mm - 1, 1);
    const daysInMonth = new Date(yy, mm, 0).getDate();
    const lead = (first.getDay() + 6) % 7;
    const name = `${MONTHS[mm - 1]} ${yy}`;
    let cells = wdOrder.map(w => `<div class="cal-cell weekday">${WEEK[w]}</div>`).join('');
    for (let i = 0; i < lead; i++) cells += '<div class="cal-cell empty"></div>';
    for (let dd = 1; dd <= daysInMonth; dd++) {
      const key = `${m}-${String(dd).padStart(2, '0')}`;
      const v = byDate.get(key);
      if (v === undefined) {
        cells += `<div class="cal-cell empty"><div class="day">${dd}</div></div>`;
      } else {
        cells += `<div class="cal-cell" style="background:${heatColor(v, max)}" title="${fmtDate(key)} — ${v} заявок"><div class="day">${dd}</div><div class="val">${v}</div></div>`;
      }
    }
    html += `<div class="cal-month"><h3>${name}</h3><div class="cal-grid">${cells}</div></div>`;
  });
  document.getElementById('calWrap').innerHTML = html;
}

// ---------- Таблица ----------
function buildTable(data) {
  const tbody = data.map(d => {
    const peak = d.peakClassification || 0;
    return `<tr>
      <td><strong>${fmtDate(d.date)}</strong></td>
      <td><span class="tag rose">${d.classificationTotal || 0}</span></td>
      <td><span class="tag sky">${d.groupTotal || 0}</span></td>
      <td>${d.totalUnique || 0}</td>
      <td>${peak}</td>
      <td>${d.peakClassificationTime ? fmtFull(d.peakClassificationTime) : '—'}</td>
    </tr>`;
  }).join('');
  document.getElementById('tbl').innerHTML = `
    <thead><tr><th>Смена</th><th>Классификация</th><th>Группа</th><th>Всего уник.</th><th>Пик за раз</th><th>Время пика</th></tr></thead>
    <tbody>${tbody}</tbody>`;
}

let dataState = { summary: [] };

if (canStorage()) loadFromStorage();
