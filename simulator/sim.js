import { runSimulation, toCSV, DEFAULT_PARAMS } from '../core/simulation.js';
import { foodName } from '../core/foods.js';

// ---------------------------------------------------------------------------
// i18n
// ---------------------------------------------------------------------------
const STR = {
  en: {
    brandSub: 'Simulator', navSite: 'Website', navApp: 'Open app', title: 'SilverMeal Simulator',
    lede: 'Run a virtual community kitchen for weeks in seconds. Both kitchens get the same deliveries and serve the same seniors — one runs on paper logs, the other on SilverMeal AI.',
    tabSim: 'Kitchen simulation', tabDev: 'Device preview', params: 'Parameters',
    pDays: 'Days to simulate', pSeniors: 'Seniors served per day', pDonFreq: 'Donation frequency', hDonFreq: 'Chance of a donation batch arriving on any day',
    pDonKg: 'Donation batch size', hDonKg: 'Average kg per batch — mostly starch, often near its date', pFifo: 'Manual FIFO compliance', hFifo: 'How often paper-log cooks pick the oldest item',
    pMiss: 'Manual missed-expiry rate', hMiss: 'Daily chance an expired item goes unnoticed', pSeed: 'Random seed',
    run: 'Run', play: '▶ Play', pause: '❚❚ Pause', newSeed: 'New seed', speed: 'Speed', csv: 'Export CSV', reset: 'Reset',
    kitchenTitle: 'Live kitchen view', shelfTitle: 'SilverMeal shelf (FIFO order)', lgRed: 'Today', lgYellow: '≤ 3 days', lgGreen: 'Safe',
    menuSilver: 'SilverMeal menu & leftovers', menuManual: 'Manual menu & leftovers', howTitle: 'How the model works',
    devNote: 'This is the real, working SilverMeal app running inside a device frame — tap around, snap a label, plan a meal and log leftovers. Data stays in this browser.',
    device: 'Device', rotate: '⟳ Rotate', reload: 'Reload app', newTab: 'Open in new tab',
    foot: 'Illustrative model with assumed parameters — not measured field data.',
    day: 'Day', of: 'of', manual: 'Manual', silver: 'SilverMeal', target: 'Target',
    kExpired: 'Expired food discarded', kIncidents: 'Expired items served', kProtein: 'Protein per serving', kLeft: 'Avg plate leftovers',
    kWaste: 'Total waste cost', kRescue: 'Expiring stock rescued', kCost: 'Food purchases', lower: 'lower', higher: 'higher', none: 'none',
    kCostNote: 'incl. NT$ {x} protein & shortfall top-ups',
    cExpired: 'Expired food discarded (cumulative)', cExpiredSub: 'kg thrown away because it passed its date',
    cProtein: 'Protein per serving', cProteinSub: 'grams per senior per meal vs ESPEN-based target',
    cLeft: 'Plate leftovers', cLeftSub: '7-day average of the per-dish leftover slider (%)',
    cWaste: 'Total waste cost (cumulative)', cWasteSub: 'NT$ of expired stock plus uneaten food',
    tableView: 'Show data table', arrivalsLbl: 'Arrived today', donation: 'donation', purchase: 'purchase', nothingArrived: 'No deliveries today.',
    protein: 'Protein', expired: 'Expired', incidentsLbl: 'Expired served', emptyShelf: 'Shelf empty',
    roles: { main: 'Main', side: 'Side', staple: 'Staple', soup: 'Soup', dessert: 'Fruit/Dairy' },
    how: [
      'Both kitchens receive identical deliveries: a regular purchase every 3 days plus random donation batches (60% starch such as sweet potato and bread, often only days from expiry).',
      'Manual kitchen: cooks pick the oldest item only with the FIFO-compliance probability, miss expired items at the missed-expiry rate (an expired item that gets cooked counts as an incident), use fixed portions and never adapt the menu.',
      'SilverMeal kitchen: the traffic light removes expired items every morning, the real planner from the app (core/planner.js) builds each menu from red/yellow stock first and tops up protein to the ESPEN-based target (1.2 g/kg/day, lunch = 35%).',
      'Seniors have hidden taste preferences per food. Leftovers are drawn around (1 − preference), snapped to the 0/25/50/75%+ slider stops. Hard foods served without texture modification are eaten less.',
      'SilverMeal feeds every slider value back into dish ratings (core/waste.js), which steer future menus and soften/season disliked foods — so leftovers fall over time. Values are illustrative, not field measurements.',
    ],
  },
  zh: {
    brandSub: '模擬器', navSite: '官網', navApp: '開啟 App', title: '銀膳智庫 模擬器',
    lede: '幾秒內模擬一個共餐廚房數週的營運。兩個廚房收到相同的進貨與捐贈、服務相同的長輩——一個用紙本紀錄，一個用銀膳智庫。',
    tabSim: '廚房營運模擬', tabDev: '裝置預覽', params: '參數設定',
    pDays: '模擬天數', pSeniors: '每日供餐人數', pDonFreq: '捐贈頻率', hDonFreq: '每天收到一批捐贈的機率',
    pDonKg: '每批捐贈量', hDonKg: '每批平均公斤數——多為澱粉類，常接近到期', pFifo: '人工先進先出遵循率', hFifo: '紙本作業時廚工挑選最舊食材的比例',
    pMiss: '人工漏檢過期率', hMiss: '過期食材每天未被發現的機率', pSeed: '亂數種子',
    run: '執行', play: '▶ 播放', pause: '❚❚ 暫停', newSeed: '換一組亂數', speed: '速度', csv: '匯出 CSV', reset: '重設',
    kitchenTitle: '即時廚房畫面', shelfTitle: '銀膳智庫庫存（先進先出排序）', lgRed: '今日到期', lgYellow: '3天內', lgGreen: '安全',
    menuSilver: '銀膳智庫菜單與廚餘', menuManual: '人工菜單與廚餘', howTitle: '模型說明',
    devNote: '這是實際可操作的銀膳智庫 App，放在裝置外框中——可以拍標籤、排菜單、記錄廚餘。資料只存在此瀏覽器。',
    device: '裝置', rotate: '⟳ 旋轉', reload: '重新載入', newTab: '在新分頁開啟',
    foot: '示意模型，參數為假設值，非實地量測數據。',
    day: '第', of: '／', manual: '人工', silver: '銀膳智庫', target: '目標',
    kExpired: '過期報廢食材', kIncidents: '誤用過期食材次數', kProtein: '每份蛋白質', kLeft: '平均廚餘比例',
    kWaste: '總浪費金額', kRescue: '即期品消化率', kCost: '食材採購', lower: '減少', higher: '增加', none: '無',
    kCostNote: '含 NT$ {x} 蛋白質與缺料補購',
    cExpired: '過期報廢量（累計）', cExpiredSub: '因過期而丟棄的公斤數',
    cProtein: '每份蛋白質', cProteinSub: '每位長輩每餐克數，對照 ESPEN 建議目標',
    cLeft: '餐後廚餘', cLeftSub: '各菜色廚餘滑桿的 7 日平均（%）',
    cWaste: '總浪費金額（累計）', cWasteSub: '過期報廢加上未吃完食物的金額（NT$）',
    tableView: '顯示數據表', arrivalsLbl: '今日入庫', donation: '捐贈', purchase: '採購', nothingArrived: '今日無進貨。',
    protein: '蛋白質', expired: '過期', incidentsLbl: '誤用過期', emptyShelf: '庫存已空',
    roles: { main: '主菜', side: '配菜', staple: '主食', soup: '湯品', dessert: '水果/乳品' },
    how: [
      '兩個廚房收到完全相同的食材：每 3 天固定採購一次，加上隨機的愛心捐贈（60% 為地瓜、吐司等澱粉，且常只剩幾天效期）。',
      '人工廚房：廚工只有「先進先出遵循率」的機會挑最舊的食材；過期品以「漏檢率」未被發現（煮到過期品即計一次事件）；份量固定，菜單不會調整。',
      '銀膳智庫廚房：紅綠燈每天早上移除過期品；直接使用 App 內的配膳引擎（core/planner.js），優先使用紅／黃燈食材，並依 ESPEN 建議（每日 1.2 g/kg，午餐占 35%）補足蛋白質。',
      '長輩對每種食材有隱藏的喜好度。廚餘依（1－喜好度）抽樣，並對齊 0/25/50/75%+ 滑桿刻度；未經質地調整的硬質食材吃得較少。',
      '銀膳智庫把每次滑桿結果回饋到菜色評分（core/waste.js），影響之後的菜單並調整不受歡迎食材的軟硬與調味，因此廚餘會逐步下降。數值為示意，非實地量測。',
    ],
  },
};

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
};

let lang = store.get('sm-lang') || ((navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en');
const t = (k) => STR[lang][k] ?? STR.en[k] ?? k;
const $ = (s) => document.querySelector(s);
const fmt = (n, d = 0) => Number(n).toLocaleString(lang === 'zh' ? 'zh-TW' : 'en-US', { maximumFractionDigits: d, minimumFractionDigits: d });
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function applyLang() {
  document.documentElement.lang = lang === 'zh' ? 'zh-Hant-TW' : 'en';
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  $('#langBtn').textContent = lang === 'zh' ? 'EN' : '中文';
  $('#howList').innerHTML = t('how').map((x) => `<li>${esc(x)}</li>`).join('');
  $('#playBtn').textContent = timer ? t('pause') : t('play');
  document.title = t('title');
  if (result) render();
}

// theme: auto → light → dark
const THEMES = ['auto', 'light', 'dark'];
let theme = store.get('sm-theme') || 'auto';
function applyTheme() {
  if (theme === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', theme);
  $('#themeBtn').textContent = theme === 'auto' ? '◐' : theme === 'light' ? '☀' : '☾';
  $('#themeBtn').title = theme;
}

// ---------------------------------------------------------------------------
// Parameters
// ---------------------------------------------------------------------------
const P = {
  days: ['#p-days', '#o-days', (v) => v],
  seniors: ['#p-seniors', '#o-seniors', (v) => v],
  donationFreq: ['#p-donFreq', '#o-donFreq', (v) => `${Math.round(v * 100)}%`],
  donationKg: ['#p-donKg', '#o-donKg', (v) => `${v} kg`],
  fifoCompliance: ['#p-fifo', '#o-fifo', (v) => `${Math.round(v * 100)}%`],
  missRate: ['#p-miss', '#o-miss', (v) => `${Math.round(v * 100)}%`],
};
function readParams() {
  const p = {};
  for (const [k, [inp, out, f]] of Object.entries(P)) { const v = Number($(inp).value); p[k] = v; $(out).textContent = f(v); }
  p.seed = Math.max(1, Math.round(Number($('#p-seed').value) || 1));
  return p;
}
function setParams(p) {
  for (const [k, [inp]] of Object.entries(P)) $(inp).value = p[k];
  $('#p-seed').value = p.seed;
}

// ---------------------------------------------------------------------------
// Simulation state
// ---------------------------------------------------------------------------
let result = null;
let shown = 0; // number of days revealed
let timer = null;

function run(reveal = true) {
  stop();
  result = runSimulation(readParams());
  shown = reveal ? result.days : 1;
  render();
}

function stop() {
  if (timer) { clearInterval(timer); timer = null; }
  $('#playBtn').textContent = t('play');
}

function play() {
  if (timer) { stop(); return; }
  if (!result || shown >= result.days) { result = runSimulation(readParams()); shown = 0; }
  $('#playBtn').textContent = t('pause');
  const tick = () => {
    shown += 1;
    render();
    if (shown >= result.days) stop();
  };
  const speed = Number($('#p-speed').value);
  timer = setInterval(tick, Math.round(1000 / speed));
  tick();
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------
const sum = (a) => a.reduce((x, y) => x + y, 0);
const avg = (a) => (a.length ? sum(a) / a.length : 0);
const cumsum = (a) => { let s = 0; return a.map((x) => (s += x)); };
const rolling = (a, w) => a.map((_, i) => avg(a.slice(Math.max(0, i - w + 1), i + 1)));

function partialSummary(daily, n, target) {
  const sl = (k) => daily[k].slice(0, n);
  const exp = sum(sl('expiredKg')); const resc = sum(sl('rescuedKg'));
  return {
    expiredKg: exp, expiredNT: sum(sl('expiredNT')), incidents: sum(sl('incidents')),
    protein: avg(sl('protein')), daysMet: sl('protein').filter((x) => x >= target - 0.5).length,
    leftover: avg(sl('leftoverPct')), waste: sum(sl('expiredNT')) + sum(sl('plateNT')),
    rescue: resc + exp > 0 ? (resc / (resc + exp)) * 100 : 100,
    cost: sum(sl('cost')), topUp: sum(sl('extraNT')),
  };
}

function delta(m, s, lowerIsBetter) {
  if (!m && !s) return { txt: '—', cls: '' };
  if (!m) return { txt: s > 0 ? `+${fmt(s)}` : '—', cls: lowerIsBetter ? 'bad' : 'good' };
  const pct = ((s - m) / m) * 100;
  const good = lowerIsBetter ? pct < 0 : pct > 0;
  const arrow = pct < 0 ? '▼' : '▲';
  return { txt: `${arrow} ${fmt(Math.abs(pct))}% ${pct < 0 ? t('lower') : t('higher')}`, cls: Math.abs(pct) < 0.5 ? '' : good ? 'good' : 'bad' };
}

function renderKPIs() {
  const n = shown; const target = result.target;
  const m = partialSummary(result.manual.daily, n, target);
  const s = partialSummary(result.silver.daily, n, target);
  const tiles = [
    [t('kExpired'), `NT$ ${fmt(m.expiredNT)}`, `NT$ ${fmt(s.expiredNT)}`, delta(m.expiredNT, s.expiredNT, true), `${fmt(m.expiredKg, 1)} kg → ${fmt(s.expiredKg, 1)} kg`],
    [t('kIncidents'), fmt(m.incidents), fmt(s.incidents), delta(m.incidents, s.incidents, true)],
    [t('kProtein'), `${fmt(m.protein, 1)} g`, `${fmt(s.protein, 1)} g`, delta(m.protein, s.protein, false), `${t('target')} ${target} g`],
    [t('kLeft'), `${fmt(m.leftover, 1)}%`, `${fmt(s.leftover, 1)}%`, delta(m.leftover, s.leftover, true)],
    [t('kWaste'), `NT$ ${fmt(m.waste)}`, `NT$ ${fmt(s.waste)}`, delta(m.waste, s.waste, true)],
    [t('kRescue'), `${fmt(m.rescue)}%`, `${fmt(s.rescue)}%`, delta(m.rescue, s.rescue, false)],
    [t('kCost'), `NT$ ${fmt(m.cost)}`, `NT$ ${fmt(s.cost)}`, delta(m.cost, s.cost, true), t('kCostNote').replace('{x}', fmt(s.topUp))],
  ];
  $('#kpis').innerHTML = tiles.map(([label, mv, sv, d, note]) => `
    <div class="kpi">
      <div class="k-label">${esc(label)}</div>
      <div class="k-row"><span><i class="sw manual"></i>${esc(t('manual'))}</span><span class="k-val">${esc(mv)}</span></div>
      <div class="k-row k-silver"><span><i class="sw silver"></i>${esc(t('silver'))}</span><span class="k-val">${esc(sv)}</span></div>
      <span class="delta ${d.cls}">${esc(d.txt)}</span>
      ${note ? `<div class="small muted" style="margin-top:4px">${esc(note)}</div>` : ''}
    </div>`).join('');
}

function statusOf(daysLeft) { return daysLeft <= 0 ? 'red' : daysLeft <= 3 ? 'yellow' : 'green'; }

function menuHTML(menu) {
  return menu.map((d) => {
    const color = d.leftoverPct >= 50 ? 'var(--red)' : d.leftoverPct >= 25 ? 'var(--yellow)' : 'var(--green)';
    const pctLabel = d.leftoverPct >= 75 ? '75%+' : `${d.leftoverPct}%`;
    return `<li><div><span class="role">${esc(t('roles')[d.role] || d.role)}</span>${esc(d.name[lang] || d.name.en)}</div>
      <div><div class="lbar"><i style="width:${Math.max(4, d.leftoverPct >= 75 ? 85 : d.leftoverPct)}%;background:${color}"></i></div><div class="lbar-wrap">${pctLabel}</div></div></li>`;
  }).join('');
}

function renderKitchen() {
  const snap = result.snapshots[shown - 1];
  $('#dayBadge').textContent = lang === 'zh' ? `第 ${shown} 天 ／ 共 ${result.days} 天` : `${t('day')} ${shown} ${t('of')} ${result.days}`;
  $('#progressBar').style.width = `${(shown / result.days) * 100}%`;
  // group batches of the same food (sum kg, soonest expiry)
  const groups = new Map();
  for (const x of snap.silver.shelf) {
    const g = groups.get(x.foodId);
    if (g) { g.qtyKg += x.qtyKg; g.daysLeft = Math.min(g.daysLeft, x.daysLeft); g.n++; } else groups.set(x.foodId, { ...x, n: 1 });
  }
  const shelf = [...groups.values()].sort((a, b) => a.daysLeft - b.daysLeft);
  $('#shelf').innerHTML = shelf.length ? shelf.slice(0, 24).map((x) => `<span class="fchip ${statusOf(x.daysLeft)}" title="${x.n} × · ${x.daysLeft} d"><i class="dot"></i>${esc(foodName(x.foodId, lang))} <b>${fmt(x.qtyKg, 1)}kg</b></span>`).join('') + (shelf.length > 24 ? `<span class="fchip">+${shelf.length - 24}</span>` : '') : `<span class="muted small">${t('emptyShelf')}</span>`;
  $('#arrivals').innerHTML = snap.arrivals.length
    ? `<b>${t('arrivalsLbl')}:</b> ` + snap.arrivals.map((a) => `${esc(foodName(a.foodId, lang))} ${fmt(a.qtyKg, 1)}kg (${t(a.source)})`).join(' · ')
    : t('nothingArrived');
  $('#menuSilver').innerHTML = menuHTML(snap.silver.menu);
  $('#menuManual').innerHTML = menuHTML(snap.manual.menu);
  const stats = (x) => `<span>${t('protein')} <b>${fmt(x.protein, 1)} g</b></span><span>${t('expired')} <b>${fmt(x.expiredKg, 1)} kg</b></span>${x.incidents ? `<span class="flag">⚠ ${t('incidentsLbl')} ×${x.incidents}</span>` : ''}`;
  $('#statsSilver').innerHTML = stats(snap.silver);
  $('#statsManual').innerHTML = stats(snap.manual);
}

// ---- charts (inline SVG) ----
const CHARTS = [
  { id: 'expired', title: 'cExpired', sub: 'cExpiredSub', get: (d) => cumsum(d.expiredKg), unit: 'kg', dec: 1 },
  { id: 'protein', title: 'cProtein', sub: 'cProteinSub', get: (d) => d.protein, unit: 'g', dec: 1, target: true },
  { id: 'left', title: 'cLeft', sub: 'cLeftSub', get: (d) => rolling(d.leftoverPct, 7), unit: '%', dec: 1, max: 100 },
  { id: 'waste', title: 'cWaste', sub: 'cWasteSub', get: (d) => cumsum(d.expiredNT.map((x, i) => x + d.plateNT[i])), unit: 'NT$', dec: 0, prefix: true },
];

function niceMax(v) {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}

function buildCharts() {
  $('#charts').innerHTML = CHARTS.map((c) => `
    <section class="card chart-card" id="cc-${c.id}">
      <h3>${esc(t(c.title))}</h3>
      <p class="sub">${esc(t(c.sub))}</p>
      <div class="chart-legend"><span><i class="ln manual"></i>${esc(t('manual'))}</span><span><i class="ln silver"></i>${esc(t('silver'))}</span>${c.target ? `<span><i class="ln target"></i>${esc(t('target'))}</span>` : ''}</div>
      <div class="chart" id="ch-${c.id}"></div>
      <details class="table-view"><summary>${esc(t('tableView'))}</summary><div class="tscroll" id="tb-${c.id}"></div></details>
    </section>`).join('');
}

function fmtVal(c, v) { return c.prefix ? `${c.unit} ${fmt(v, c.dec)}` : `${fmt(v, c.dec)} ${c.unit}`; }

function drawChart(c) {
  const box = $(`#ch-${c.id}`);
  const W = Math.max(280, box.clientWidth || 500); const H = 210;
  const m = { l: 46, r: 78, t: 10, b: 26 };
  const iw = W - m.l - m.r; const ih = H - m.t - m.b;
  const N = result.days; const n = shown;
  const sm = c.get(result.manual.daily).slice(0, n);
  const ss = c.get(result.silver.daily).slice(0, n);
  const allFull = [...c.get(result.manual.daily), ...c.get(result.silver.daily), c.target ? result.target : 0];
  const yMax = c.max || niceMax(Math.max(...allFull) * 1.05);
  const x = (i) => m.l + (N <= 1 ? 0 : (i / (N - 1)) * iw);
  const y = (v) => m.t + ih - (v / yMax) * ih;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * yMax);
  const path = (arr) => arr.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const xt = [];
  const step = N > 120 ? 30 : N > 60 ? 15 : N > 21 ? 7 : N > 10 ? 3 : 1;
  for (let i = 0; i < N; i += step) xt.push(i);
  // direct end labels, nudged apart
  let ym = y(sm[n - 1] ?? 0), ys = y(ss[n - 1] ?? 0);
  if (Math.abs(ym - ys) < 13) { const mid = (ym + ys) / 2; const up = ym <= ys; ym = mid + (up ? -7 : 7); ys = mid + (up ? 7 : -7); }
  const ex = x(n - 1) + 8;
  box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t(c.title))}">
    <g class="grid">${ticks.map((v) => `<line x1="${m.l}" x2="${m.l + iw}" y1="${y(v)}" y2="${y(v)}"/>`).join('')}</g>
    <g>${ticks.map((v) => `<text x="${m.l - 6}" y="${y(v) + 4}" text-anchor="end">${fmt(v, v < 10 && yMax <= 10 ? 1 : 0)}</text>`).join('')}</g>
    <g>${xt.map((i) => `<text x="${x(i)}" y="${H - 6}" text-anchor="middle">${i + 1}</text>`).join('')}</g>
    ${c.target ? `<line x1="${m.l}" x2="${m.l + iw}" y1="${y(result.target)}" y2="${y(result.target)}" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="2 4"/><text x="${m.l + iw + 4}" y="${y(result.target) + 4}">${t('target')}</text>` : ''}
    <path d="${path(sm)}" fill="none" stroke="var(--s-manual)" stroke-width="2" stroke-dasharray="6 4" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="${path(ss)}" fill="none" stroke="var(--s-silver)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    ${n ? `<circle cx="${x(n - 1)}" cy="${y(sm[n - 1])}" r="4" fill="var(--s-manual)" stroke="var(--surface)" stroke-width="2"/>
    <circle cx="${x(n - 1)}" cy="${y(ss[n - 1])}" r="4" fill="var(--s-silver)" stroke="var(--surface)" stroke-width="2"/>
    ${c.target ? '' : `<text class="endlabel" x="${ex}" y="${ym + 4}">${esc(t('manual'))}</text><text class="endlabel" x="${ex}" y="${ys + 4}">${esc(t('silver'))}</text>`}` : ''}
    <g class="hover" style="display:none"><line class="xhair" y1="${m.t}" y2="${m.t + ih}"/><circle class="hm" r="4.5" fill="var(--s-manual)" stroke="var(--surface)" stroke-width="2"/><circle class="hs" r="4.5" fill="var(--s-silver)" stroke="var(--surface)" stroke-width="2"/></g>
    <rect x="${m.l}" y="${m.t}" width="${iw}" height="${ih}" fill="transparent" class="hit"/>
  </svg><div class="tip" style="display:none"></div>`;

  const svg = box.querySelector('svg'); const hov = svg.querySelector('.hover'); const tip = box.querySelector('.tip');
  const move = (ev) => {
    const r = svg.getBoundingClientRect(); const sx = ((ev.clientX - r.left) / r.width) * W;
    const i = Math.max(0, Math.min(n - 1, Math.round(((sx - m.l) / iw) * (N - 1))));
    if (n < 1) return;
    hov.style.display = '';
    hov.querySelector('.xhair').setAttribute('x1', x(i)); hov.querySelector('.xhair').setAttribute('x2', x(i));
    hov.querySelector('.hm').setAttribute('cx', x(i)); hov.querySelector('.hm').setAttribute('cy', y(sm[i]));
    hov.querySelector('.hs').setAttribute('cx', x(i)); hov.querySelector('.hs').setAttribute('cy', y(ss[i]));
    tip.style.display = '';
    tip.innerHTML = `<div class="muted">${lang === 'zh' ? `第 ${i + 1} 天` : `${t('day')} ${i + 1}`}</div>
      <div class="t-row"><i class="sw manual"></i>${esc(t('manual'))}<b>${esc(fmtVal(c, sm[i]))}</b></div>
      <div class="t-row"><i class="sw silver"></i>${esc(t('silver'))}<b>${esc(fmtVal(c, ss[i]))}</b></div>`;
    const px = (x(i) / W) * r.width; const py = (Math.min(y(sm[i]), y(ss[i])) / H) * r.height;
    tip.style.left = `${Math.max(70, Math.min(r.width - 70, px))}px`; tip.style.top = `${Math.max(40, py)}px`;
  };
  const leave = () => { hov.style.display = 'none'; tip.style.display = 'none'; };
  svg.addEventListener('pointermove', move); svg.addEventListener('pointerdown', move); svg.addEventListener('pointerleave', leave);

  // table view
  $(`#tb-${c.id}`).innerHTML = `<table><thead><tr><th>${t('day')}</th><th>${esc(t('manual'))}</th><th>${esc(t('silver'))}</th></tr></thead><tbody>${sm.map((v, i) => `<tr><td>${i + 1}</td><td>${fmt(v, c.dec)}</td><td>${fmt(ss[i], c.dec)}</td></tr>`).join('')}</tbody></table>`;
}

let builtLang = null;
function render() {
  if (!result) return;
  renderKPIs();
  renderKitchen();
  if (builtLang !== lang) { buildCharts(); builtLang = lang; }
  CHARTS.forEach(drawChart);
}

// ---------------------------------------------------------------------------
// Device preview
// ---------------------------------------------------------------------------
const DEVICES = { iphone: [390, 844], android: [360, 740], tablet: [768, 1024] };
let landscape = false;
function layoutDevice() {
  const key = $('#deviceSel').value;
  let [w, h] = DEVICES[key];
  if (landscape) [w, h] = [h, w];
  const phone = $('#phone'); const frame = $('#appFrame');
  phone.classList.toggle('tablet', key === 'tablet');
  phone.classList.toggle('landscape', landscape);
  frame.style.width = `${w}px`; frame.style.height = `${h}px`;
  const pad = key === 'tablet' ? 22 : 14;
  const fw = w + pad * 2; const fh = h + pad * 2;
  const stage = $('#stage');
  const avail = stage.clientWidth || window.innerWidth - 32;
  const s = Math.min(1, avail / fw, Math.max(0.35, (window.innerHeight - 140) / fh));
  const sc = $('#scaler');
  sc.style.width = `${fw}px`; sc.style.transform = `scale(${s})`;
  stage.style.height = `${fh * s + 40}px`;
  // keep the scaled element centred without overflowing
  sc.style.marginLeft = sc.style.marginRight = `${-(fw - fw * s) / 2}px`;
}

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------
function selectTab(which) {
  const sim = which === 'sim';
  $('#tab-sim').setAttribute('aria-selected', String(sim));
  $('#tab-dev').setAttribute('aria-selected', String(!sim));
  $('#panel-sim').hidden = !sim; $('#panel-dev').hidden = sim;
  if (!sim) layoutDevice(); else render();
  store.set('sm-sim-tab', which);
  if (location.hash !== `#${which === 'sim' ? 'simulation' : 'device'}`) history.replaceState(null, '', `#${which === 'sim' ? 'simulation' : 'device'}`);
}

let deb = null;
document.querySelectorAll('.controls input[type="range"]:not(#p-speed), #p-seed').forEach((el) => {
  el.addEventListener('input', () => {
    readParams();
    clearTimeout(deb);
    deb = setTimeout(() => run(true), 120);
  });
});
$('#p-speed').addEventListener('input', () => { if (timer) { stop(); play(); } });
$('#runBtn').addEventListener('click', () => run(true));
$('#playBtn').addEventListener('click', play);
$('#randBtn').addEventListener('click', () => { $('#p-seed').value = Math.floor(Math.random() * 99999) + 1; run(true); });
$('#resetBtn').addEventListener('click', () => { setParams(DEFAULT_PARAMS); run(true); });
$('#csvBtn').addEventListener('click', () => {
  if (!result) return;
  const blob = new Blob([toCSV(result)], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `silvermeal-simulation-seed${result.params.seed}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});
$('#langBtn').addEventListener('click', () => { lang = lang === 'zh' ? 'en' : 'zh'; store.set('sm-lang', lang); applyLang(); });
$('#themeBtn').addEventListener('click', () => { theme = THEMES[(THEMES.indexOf(theme) + 1) % 3]; store.set('sm-theme', theme); applyTheme(); if (result) CHARTS.forEach(drawChart); });
$('#tab-sim').addEventListener('click', () => selectTab('sim'));
$('#tab-dev').addEventListener('click', () => selectTab('dev'));
$('#deviceSel').addEventListener('change', layoutDevice);
$('#rotateBtn').addEventListener('click', () => { landscape = !landscape; layoutDevice(); });
$('#reloadBtn').addEventListener('click', () => { $('#appFrame').src = '../app/'; });
let rz = null;
window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (!$('#panel-dev').hidden) layoutDevice(); else if (result) CHARTS.forEach(drawChart); }, 100); });

applyTheme();
readParams();
applyLang();
run(true);
selectTab(location.hash === '#device' ? 'dev' : 'sim');
