import { STRINGS } from './i18n.js';
import { FOODS, FOOD_BY_ID, TEXTURES, foodName, matchFood } from '../core/foods.js';
import { expiryStatus, daysUntil, sortFIFO, isoDate, addDays, parseExpiryFromText, STATUS_ORDER } from '../core/expiry.js';
import { planMenu, consumePlan } from '../core/planner.js';
import { LEFTOVER_STOPS, dishWaste, applyFeedback, stars } from '../core/waste.js';
import { seedInventory } from '../core/seed.js';
import { enhanceWithClaude } from '../core/claude.js';

// ---------------------------------------------------------------------------
// State (persisted in localStorage; everything stays on this device)
// ---------------------------------------------------------------------------
const KEY = 'silvermeal.v1';
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage blocked: keep in memory */ } },
};

function defaultState() {
  const lang = (navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';
  return {
    inventory: seedInventory(),
    meals: [], ratings: { foods: {}, dishes: {} }, wasteLog: [],
    settings: { lang, theme: 'auto', facility: lang === 'zh' ? '幸福里共餐據點' : 'Sunshine Community Kitchen', servings: 30, texture: 'soft', apiKey: '' },
  };
}

let S;
try { S = JSON.parse(store.get(KEY)) || defaultState(); } catch { S = defaultState(); }
S.settings = { ...defaultState().settings, ...S.settings };
const save = () => store.set(KEY, JSON.stringify(S));

let draftPlan = null;   // current planner result (not yet confirmed)
let aiResult = null;    // Claude rewrite for draftPlan
let planSelection = null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const L = () => S.settings.lang;
const t = (k, ...a) => { const v = STRINGS[L()][k] ?? STRINGS.en[k] ?? k; return typeof v === 'function' ? v(...a) : v; };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fn = (id) => foodName(id, L());
const nt = (n) => `NT$${Math.round(n).toLocaleString()}`;
const today = () => new Date();
const uid = () => Math.random().toString(36).slice(2, 10);
const texLabel = (id) => { const x = TEXTURES.find((tx) => tx.id === id); return x ? `${x[L()]} (${x.iddsi})` : id; };

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove('show'), 2600);
}

function applyChrome() {
  document.documentElement.lang = L() === 'zh' ? 'zh-Hant' : 'en';
  document.documentElement.dataset.theme = S.settings.theme === 'auto' ? '' : S.settings.theme;
  if (S.settings.theme === 'auto') delete document.documentElement.dataset.theme;
  $$('[data-t]').forEach((el) => { el.textContent = t(el.dataset.t); });
  $('#langBtn').textContent = L() === 'zh' ? 'EN' : '中';
  $('#facilityName').textContent = S.settings.facility;
  document.title = `${t('appName')} · ${t('tagline')}`;
}

function counts() {
  const c = { expired: 0, red: 0, yellow: 0, green: 0 };
  for (const it of S.inventory) c[expiryStatus(it.expiry, today())]++;
  return c;
}


/**
 * Two-step confirmation inside the button itself (no browser pop-up, which
 * some embedded viewers block): first tap shows the question, second tap acts.
 */
function armConfirm(btn, question, action) {
  const label = btn.textContent;
  let timer = null;
  btn.onclick = () => {
    if (btn.dataset.armed) { clearTimeout(timer); action(); return; }
    btn.dataset.armed = '1';
    btn.classList.add('armed');
    btn.textContent = `${question} ${t('tap_again')}`;
    timer = setTimeout(() => { delete btn.dataset.armed; btn.classList.remove('armed'); btn.textContent = label; }, 4000);
  };
}

const statusDot = (st) => `<span class="dot dot-${st}" aria-hidden="true"></span>`;

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------
const routes = { home: renderHome, snap: renderSnap, plan: renderPlan, leftover: renderLeftover, report: renderReport };
let homeFilter = 'all';
let homeQuery = '';

function route() {
  const r = (location.hash.slice(1) || 'home').split('?')[0];
  const view = routes[r] ? r : 'home';
  $$('.tabbar a').forEach((a) => a.classList.toggle('active', a.dataset.route === view));
  $$('.tabbar a').forEach((a) => a.toggleAttribute('aria-current', a.dataset.route === view));
  routes[view]();
  const pending = S.meals.filter((m) => !m.feedback).length;
  const lt = $('.tabbar a[data-route="leftover"]');
  lt.dataset.badge = pending || '';
}

// ---------------------------------------------------------------------------
// HOME — traffic-light stock
// ---------------------------------------------------------------------------
function renderHome() {
  const c = counts();
  const urgent = c.red + c.yellow;
  const items = sortFIFO(S.inventory)
    .map((it) => ({ ...it, st: expiryStatus(it.expiry, today()), d: daysUntil(it.expiry, today()) }))
    .filter((it) => homeFilter === 'all' || it.st === homeFilter)
    .filter((it) => !homeQuery || `${fn(it.foodId)} ${it.note || ''}`.toLowerCase().includes(homeQuery.toLowerCase()))
    .sort((a, b) => STATUS_ORDER[a.st] - STATUS_ORDER[b.st] || a.d - b.d);

  $('#view').innerHTML = `
    <section class="lights" aria-label="Traffic light">
      ${['expired', 'red', 'yellow', 'green'].map((st) => `
        <button class="light light-${st} ${homeFilter === st ? 'on' : ''}" data-filter="${st}" aria-pressed="${homeFilter === st}">
          <span class="light-n">${c[st]}</span><span class="light-l">${t('st_' + st)}</span>
        </button>`).join('')}
    </section>
    ${urgent ? `<a class="btn btn-primary btn-block cta" href="#plan">${t('plan_cta', urgent)} →</a>` : ''}
    <div class="toolbar">
      <input type="search" id="q" placeholder="${t('search')}" value="${esc(homeQuery)}" aria-label="${t('search')}">
      ${homeFilter !== 'all' ? `<button class="chip" data-filter="all">${t('all')} ✕</button>` : ''}
    </div>
    <p class="hint">${t('fifo_hint')}</p>
    <ul class="stock">
      ${items.length ? items.map((it) => `
        <li class="item st-${it.st}">
          <button class="item-main" data-open="${it.id}">
            ${statusDot(it.st)}
            <span class="item-name">${esc(fn(it.foodId))}${it.note ? `<small>${esc(it.note)}</small>` : ''}</span>
            <span class="item-qty">${it.qtyKg} kg</span>
            <span class="badge badge-${it.st}">${t('days_left', it.d)}</span>
          </button>
        </li>`).join('') : `<li class="empty">${t('empty_stock')}</li>`}
    </ul>`;

  $$('[data-filter]').forEach((b) => b.onclick = () => { homeFilter = homeFilter === b.dataset.filter ? 'all' : b.dataset.filter; renderHome(); });
  const q = $('#q');
  q.oninput = () => { homeQuery = q.value; const pos = q.selectionStart; renderHome(); const nq = $('#q'); nq.focus(); nq.setSelectionRange(pos, pos); };
  $$('[data-open]').forEach((b) => b.onclick = () => openItem(b.dataset.open));
}

function foodOptions(selected) {
  const cats = ['protein', 'dairy', 'starch', 'veg', 'fruit'];
  return cats.map((c) => `<optgroup label="${c}">${FOODS.filter((f) => f.cat === c).map((f) => `<option value="${f.id}" ${f.id === selected ? 'selected' : ''}>${esc(f[L()])}</option>`).join('')}</optgroup>`).join('');
}

function openSheet(html, onMount) {
  const d = $('#sheet');
  d.innerHTML = `<div class="sheet-body">${html}</div>`;
  d.showModal();
  d.onclick = (e) => { if (e.target === d) d.close(); };
  onMount?.(d);
}

function openItem(id) {
  const it = S.inventory.find((x) => x.id === id);
  if (!it) return;
  const st = expiryStatus(it.expiry, today());
  openSheet(`
    <header class="sheet-head">${statusDot(st)}<h2>${esc(fn(it.foodId))}</h2><button class="icon-btn" data-close aria-label="${t('close')}">✕</button></header>
    <p class="badge badge-${st}">${t('st_' + st + '_long')} · ${it.expiry}</p>
    <form id="itemForm" class="form">
      <label>${t('food')}<select name="foodId">${foodOptions(it.foodId)}</select></label>
      <div class="row2">
        <label>${t('qty')}<input name="qtyKg" type="number" min="0" step="0.1" value="${it.qtyKg}" required></label>
        <label>${t('expiry')}<input name="expiry" type="date" value="${it.expiry}" required></label>
      </div>
      <div class="row2">
        <label>${t('source')}<select name="source"><option value="purchase" ${it.source === 'purchase' ? 'selected' : ''}>${t('purchase')}</option><option value="donation" ${it.source === 'donation' ? 'selected' : ''}>${t('donation')}</option></select></label>
        <label>${t('received')}<input name="received" type="date" value="${it.received || ''}"></label>
      </div>
      <label>${t('note')}<input name="note" value="${esc(it.note || '')}" maxlength="60"></label>
      <div class="row2">
        <label>${t('used_kg')}<input name="used" type="number" min="0" step="0.1" max="${it.qtyKg}" placeholder="0"></label>
        <button type="button" class="btn" data-use>${t('use')}</button>
      </div>
      <div class="actions">
        <button type="button" class="btn btn-danger" data-discard>${t('discard')}</button>
        <button type="submit" class="btn btn-primary">${t('save')}</button>
      </div>
    </form>`, (d) => {
    $('[data-close]', d).onclick = () => d.close();
    const f = $('#itemForm', d);
    f.onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(f);
      Object.assign(it, { foodId: fd.get('foodId'), qtyKg: +(+fd.get('qtyKg')).toFixed(2), expiry: fd.get('expiry'), source: fd.get('source'), received: fd.get('received'), note: fd.get('note').trim() });
      if (it.qtyKg <= 0) S.inventory = S.inventory.filter((x) => x !== it);
      save(); d.close(); toast(t('saved')); route();
    };
    $('[data-use]', d).onclick = () => {
      const used = +f.used.value;
      if (!(used > 0)) return;
      it.qtyKg = +Math.max(0, it.qtyKg - used).toFixed(2);
      if (it.qtyKg <= 0) S.inventory = S.inventory.filter((x) => x !== it);
      save(); d.close(); toast(t('saved')); route();
    };
    armConfirm($('[data-discard]', d), t('discard_confirm'), () => {
      const f0 = FOOD_BY_ID[it.foodId];
      S.wasteLog.push({ date: isoDate(today()), type: 'expired', foodId: it.foodId, kg: it.qtyKg, cost: Math.round(it.qtyKg * f0.price), wasExpired: st === 'expired' });
      S.inventory = S.inventory.filter((x) => x !== it);
      save(); d.close(); toast(t('discarded')); route();
    });
  });
}

// ---------------------------------------------------------------------------
// SNAP — camera + OCR
// ---------------------------------------------------------------------------
let tesseractPromise = null;
function loadTesseract() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  tesseractPromise ??= new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
    s.onload = () => res(window.Tesseract);
    s.onerror = () => { tesseractPromise = null; rej(new Error('ocr_load')); };
    document.head.appendChild(s);
  });
  return tesseractPromise;
}

function sampleLabelCanvas() {
  const c = document.createElement('canvas');
  c.width = 900; c.height = 520;
  const g = c.getContext('2d');
  g.fillStyle = '#fffdf6'; g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = '#222'; g.lineWidth = 6; g.strokeRect(20, 20, 860, 480);
  g.fillStyle = '#111';
  const exp = addDays(today(), 2); const mfg = addDays(today(), -5);
  const roc = (d) => `${d.getFullYear() - 1911}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  g.font = 'bold 64px "Noto Sans TC", sans-serif'; g.fillText('嫩豆腐 Soft Tofu', 60, 120);
  g.font = '40px "Noto Sans TC", sans-serif';
  g.fillText('淨重 Net Wt: 1 kg', 60, 200);
  g.fillText(`製造日期 MFG: ${roc(mfg)}`, 60, 290);
  g.font = 'bold 52px "Noto Sans TC", sans-serif';
  g.fillText(`有效日期 EXP: ${roc(exp)}`, 60, 390);
  g.font = '32px "Noto Sans TC", sans-serif'; g.fillText('冷藏 0-7°C  Keep refrigerated', 60, 460);
  return c;
}

let snapState = { image: null, status: '', text: '', parsed: null, foodId: null };

function renderSnap() {
  const s = snapState;
  const p = s.parsed;
  const exp = p?.expiry || '';
  const st = exp ? expiryStatus(exp, today()) : null;
  const fid = s.foodId || 'tofu';
  $('#view').innerHTML = `
    <section class="card">
      <h1>${t('snap_title')}</h1>
      <p class="muted">${t('snap_desc')}</p>
      <div class="snap-actions">
        <label class="btn btn-primary btn-lg"><input type="file" accept="image/*" capture="environment" id="photo" hidden>📷 ${t('take_photo')}</label>
        <button class="btn" id="sampleBtn">${t('sample_label')}</button>
      </div>
      ${s.image ? `<img class="snap-preview" src="${s.image}" alt="">` : ''}
      ${s.status ? `<p class="status">${esc(s.status)}</p>` : ''}
      ${p ? (p.expiry ? `<div class="detected badge-${st}"><span>${t('detected_date')}</span><strong>${p.expiry}</strong><span>${t('st_' + st + '_long')} · ${t('confidence')} ${Math.round(p.confidence * 100)}%</span></div>` : `<p class="warn">${t('no_date')}</p>`) : ''}
      ${s.text ? `<details><summary>${t('raw_text')}</summary><pre>${esc(s.text)}</pre></details>` : ''}
      <details ${s.text ? '' : ''}><summary>${t('paste_text')}</summary>
        <textarea id="pasteText" rows="3" placeholder="有效日期 115.12.01 / EXP 2026-12-01">${esc(s.pasted || '')}</textarea>
        <button class="btn btn-sm" id="parseBtn">OK</button>
      </details>
    </section>
    <section class="card">
      <form id="addForm" class="form">
        <label>${t('food')}<select name="foodId">${foodOptions(fid)}</select></label>
        <div class="row2">
          <label>${t('qty')}<input name="qtyKg" type="number" min="0.1" step="0.1" value="1" required></label>
          <label>${t('expiry')}<input name="expiry" type="date" value="${exp || isoDate(addDays(today(), FOOD_BY_ID[fid].shelf))}" required></label>
        </div>
        <div class="row2">
          <label>${t('source')}<select name="source"><option value="purchase">${t('purchase')}</option><option value="donation">${t('donation')}</option></select></label>
          <label>${t('note')}<input name="note" maxlength="60"></label>
        </div>
        <button class="btn btn-primary btn-block btn-lg" type="submit">${t('add_item')}</button>
      </form>
    </section>`;

  $('#photo').onchange = (e) => { const f = e.target.files[0]; if (f) runOCR(f, URL.createObjectURL(f)); };
  $('#sampleBtn').onclick = () => { const c = sampleLabelCanvas(); runOCR(c, c.toDataURL('image/png')); };
  $('#parseBtn').onclick = () => {
    const txt = $('#pasteText').value;
    snapState = { ...snapState, pasted: txt, text: txt, parsed: parseExpiryFromText(txt), foodId: matchFood(txt) || snapState.foodId, status: '' };
    renderSnap();
  };
  const form = $('#addForm');
  form.foodId.onchange = () => { snapState.foodId = form.foodId.value; if (!snapState.parsed?.expiry) form.expiry.value = isoDate(addDays(today(), FOOD_BY_ID[form.foodId.value].shelf)); };
  form.onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    S.inventory.push({ id: uid(), foodId: fd.get('foodId'), qtyKg: +(+fd.get('qtyKg')).toFixed(2), expiry: fd.get('expiry'), received: isoDate(today()), source: fd.get('source'), note: fd.get('note').trim() });
    save();
    snapState = { image: null, status: '', text: '', parsed: null, foodId: null };
    toast(`${t('added')} · ${t('st_' + expiryStatus(fd.get('expiry'), today()) + '_long')}`);
    location.hash = '#home';
  };
}

async function runOCR(source, previewUrl) {
  snapState = { ...snapState, image: previewUrl, status: t('ocr_loading'), text: '', parsed: null };
  renderSnap();
  try {
    const T = await loadTesseract();
    snapState.status = t('ocr_running'); renderSnap();
    const { data } = await T.recognize(source, 'eng+chi_tra');
    const text = data.text || '';
    snapState = { ...snapState, text, parsed: parseExpiryFromText(text), foodId: matchFood(text) || snapState.foodId, status: t('ocr_done') };
  } catch (err) {
    console.warn(err);
    snapState = { ...snapState, status: t('ocr_fail'), parsed: { expiry: null, confidence: 0 } };
  }
  if (location.hash === '#snap') renderSnap();
}

// ---------------------------------------------------------------------------
// PLAN — AI senior meal planner
// ---------------------------------------------------------------------------
function renderPlan() {
  const urgent = sortFIFO(S.inventory).filter((it) => ['red', 'yellow'].includes(expiryStatus(it.expiry, today())));
  planSelection ??= new Set(urgent.filter((it) => expiryStatus(it.expiry, today()) === 'red').map((it) => it.id));
  const servings = draftPlan?.servings ?? S.settings.servings;
  const texture = draftPlan?.texture ?? S.settings.texture;

  $('#view').innerHTML = `
    <section class="card">
      <h1>${t('plan_title')}</h1>
      <h3>${t('pick_expiring')}</h3>
      ${urgent.length ? `<div class="picks">${urgent.map((it) => {
        const st = expiryStatus(it.expiry, today());
        return `<label class="pick st-${st}"><input type="checkbox" value="${it.id}" ${planSelection.has(it.id) ? 'checked' : ''}>${statusDot(st)}<span>${esc(fn(it.foodId))}</span><small>${it.qtyKg} kg · ${t('days_left', daysUntil(it.expiry, today()))}</small></label>`;
      }).join('')}</div>` : `<p class="muted">${t('no_expiring')}</p>`}
      <div class="row2">
        <label>${t('servings')}<input id="servings" type="number" min="1" max="500" value="${servings}"></label>
        <label>${t('texture')}<select id="texture">${TEXTURES.map((x) => `<option value="${x.id}" ${x.id === texture ? 'selected' : ''}>${x[L()]} (IDDSI ${x.iddsi})</option>`).join('')}</select></label>
      </div>
      <button class="btn btn-primary btn-block btn-lg" id="genBtn">✨ ${t('generate')}</button>
    </section>
    <div id="planOut">${draftPlan ? planHTML(draftPlan) : ''}</div>`;

  $$('.picks input').forEach((cb) => cb.onchange = () => { cb.checked ? planSelection.add(cb.value) : planSelection.delete(cb.value); });
  $('#genBtn').onclick = () => {
    draftPlan = planMenu({ inventory: S.inventory, selectedIds: [...planSelection], servings: Math.max(1, +$('#servings').value || 30), texture: $('#texture').value, today: today(), ratings: S.ratings });
    aiResult = null;
    $('#planOut').innerHTML = planHTML(draftPlan);
    bindPlan();
    $('#planOut').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  };
  bindPlan();
}

function planHTML(p) {
  const pct = Math.min(100, Math.round((p.totals.proteinPerServing / p.proteinTarget) * 100));
  const warn = p.warnings.map((w) => {
    if (w.code === 'protein_gap') return `<li class="w-red">${t('w_protein_gap', w.gap)}</li>`;
    if (w.code === 'starch_heavy') return `<li class="w-yellow">${t('w_starch', w.share)}</li>`;
    if (w.code === 'shortage') return `<li class="w-yellow">${t('w_shortage')} ${Object.entries(w.items).map(([id, kg]) => `${esc(fn(id))} ${kg} kg`).join('、')}</li>`;
    return '';
  }).join('');
  return `
    <section class="card plan">
      <div class="plan-head">
        <h2>${t('menu_for', p.servings, texLabel(p.texture))}</h2>
        <p class="muted">${t('rescued', p.expiringUsed, p.expiringTotal)} · ${t('cost')} ${nt(p.totals.totalCost)} (${nt(p.totals.costPerServing)}/${t('per_serving')}) · ${p.totals.kcal} ${t('kcal')}</p>
        <div class="meter" role="meter" aria-valuenow="${p.totals.proteinPerServing}" aria-valuemin="0" aria-valuemax="${p.proteinTarget}" aria-label="${t('protein')}">
          <div class="meter-fill ${pct >= 100 ? 'ok' : 'low'}" style="width:${pct}%"></div>
          <span>${t('protein')} ${p.totals.proteinPerServing} g / ${t('target')} ${p.proteinTarget} g ${t('per_serving')}</span>
        </div>
      </div>
      ${warn ? `<ul class="warnings">${warn}</ul>` : ''}
      ${p.boosts.length ? `<div class="boost"><h3>💪 ${t('boost_title')}</h3><ul>${p.boosts.map((b) => `<li>${t('boost_line', esc(fn(b.foodId)), b.gramsPerServing, b.needKg, b.buyKg)}</li>`).join('')}</ul></div>` : ''}
      <ol class="dishes">
        ${p.dishes.map((d, i) => {
          const ai = aiResult?.dishes?.find((x) => x.role === d.role) || aiResult?.dishes?.[i];
          return `
          <li class="dish">
            <div class="dish-top"><span class="role">${t('role_' + d.role)}</span>${d.rating != null ? `<span class="stars">★ ${stars(d.rating)}</span>` : ''}</div>
            <h3>${esc(ai?.name || d.name[L()])}</h3>
            <p class="dish-meta">${t('protein')} ${d.proteinG} g · ${d.kcal} ${t('kcal')} · ${nt(d.costPerServing)}/${t('per_serving')}</p>
            <ul class="ings">${d.ingredients.map((l) => `<li>${esc(fn(l.foodId))} <span class="muted">${l.grams} g × ${p.servings} = ${l.needKg} kg</span>${l.urgent ? ` <span class="tag">${t('expiring_tag')}</span>` : ''}${l.shortKg > 0 ? ` <span class="tag tag-buy">${t('buy')} ${l.shortKg} kg</span>` : ''}</li>`).join('')}</ul>
            <details><summary>${t('prep')}</summary><ul class="prep">${d.prep.map((x) => `<li>${esc(x[L()])}</li>`).join('')}</ul>${ai ? `<p class="ai-note">${esc(ai.textureNotes)}</p><h4>${t('steps')}</h4><ol>${ai.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}</details>
          </li>`;
        }).join('')}
      </ol>
      ${aiResult ? `<div class="ai-box"><h3>🤖 ${t('ai_title')}</h3><p>${esc(aiResult.summary)}</p><p>${esc(aiResult.proteinAdvice)}</p></div>` : ''}
      <div class="actions">
        <button class="btn" id="aiBtn">🤖 ${t('ai_enhance')}</button>
        <button class="btn btn-primary" id="cookBtn">✓ ${t('confirm_cook')}</button>
      </div>
      <p class="status" id="aiStatus"></p>
    </section>`;
}

function bindPlan() {
  const ai = $('#aiBtn'); const cook = $('#cookBtn');
  if (!ai) return;
  ai.onclick = async () => {
    if (!S.settings.apiKey) { $('#aiStatus').textContent = t('ai_need_key'); return; }
    ai.disabled = true; $('#aiStatus').textContent = t('ai_working');
    try {
      aiResult = await enhanceWithClaude(draftPlan, { apiKey: S.settings.apiKey, lang: L(), textureLabel: texLabel(draftPlan.texture) });
      $('#planOut').innerHTML = planHTML(draftPlan); bindPlan();
    } catch (err) {
      $('#aiStatus').textContent = t('ai_error') + (err?.message || err);
      ai.disabled = false;
    }
  };
  cook.onclick = () => {
    const p = draftPlan;
    S.inventory = consumePlan(S.inventory, p);
    S.meals.unshift({
      id: uid(), date: isoDate(today()), servings: p.servings, texture: p.texture,
      proteinPerServing: p.totals.proteinPerServing, proteinTarget: p.proteinTarget, expiringUsed: p.expiringUsed,
      dishes: p.dishes.map((d, i) => ({ key: d.key, role: d.role, name: aiResult?.dishes?.[i]?.name ? { en: aiResult.dishes[i].name, zh: aiResult.dishes[i].name } : d.name, costPerServing: d.costPerServing, grams: d.ingredients.reduce((s, l) => s + l.grams, 0), foodIds: d.ingredients.map((l) => l.foodId) })),
      feedback: null,
    });
    draftPlan = null; aiResult = null; planSelection = null;
    save(); toast(t('cooked')); location.hash = '#leftover';
  };
}

// ---------------------------------------------------------------------------
// LEFTOVER — per-dish slider & preference learning
// ---------------------------------------------------------------------------
const FACES = ['😋', '🙂', '😐', '😣'];
function renderLeftover() {
  const pending = S.meals.filter((m) => !m.feedback);
  const rated = Object.entries(S.ratings.dishes || {}).map(([key, score]) => {
    const meal = S.meals.find((m) => m.dishes.some((d) => d.key === key));
    const dish = meal?.dishes.find((d) => d.key === key);
    return { key, score, name: dish ? dish.name[L()] : key };
  }).sort((a, b) => b.score - a.score);

  $('#view').innerHTML = `
    <section class="card">
      <h1>${t('leftover_title')}</h1>
      <p class="muted">${t('leftover_desc')}</p>
    </section>
    ${pending.length ? pending.map((m) => `
      <section class="card meal" data-meal="${m.id}">
        <h2>${m.date} · ${m.servings} · ${esc(texLabel(m.texture))}</h2>
        ${m.dishes.map((d, i) => `
          <div class="slider-row">
            <div class="slider-label"><span class="role">${t('role_' + d.role)}</span><strong>${esc(d.name[L()])}</strong></div>
            <div class="slider-wrap">
              <span class="face" id="face-${m.id}-${i}" aria-hidden="true">${FACES[0]}</span>
              <input type="range" min="0" max="3" step="1" value="0" data-i="${i}" aria-label="${esc(d.name[L()])}" list="stops">
              <output id="out-${m.id}-${i}">${t('lv0')}</output>
            </div>
          </div>`).join('')}
        <p class="waste-total">${t('waste_cost')}: <strong id="wt-${m.id}">NT$0</strong></p>
        <button class="btn btn-primary btn-block" data-savefb="${m.id}">${t('save_feedback')}</button>
      </section>`).join('') : `<section class="card"><p class="muted">${t('no_pending')}</p></section>`}
    <datalist id="stops"><option value="0"><option value="1"><option value="2"><option value="3"></datalist>
    <section class="card">
      <h2>${t('ratings')}</h2>
      ${rated.length ? `<ul class="ratings">${rated.map((r) => `<li><span>${esc(r.name)}</span><span class="bar"><span style="width:${Math.round(r.score * 100)}%"></span></span><span class="stars">★ ${stars(r.score)}</span></li>`).join('')}</ul>` : `<p class="muted">${t('no_ratings')}</p>`}
    </section>`;

  for (const m of pending) {
    const root = $(`[data-meal="${m.id}"]`);
    const update = () => {
      let sum = 0;
      $$('input[type=range]', root).forEach((r) => {
        const i = +r.dataset.i; const pct = LEFTOVER_STOPS[+r.value]; const d = m.dishes[i];
        $(`#face-${m.id}-${i}`).textContent = FACES[+r.value];
        $(`#out-${m.id}-${i}`).textContent = t(['lv0', 'lv25', 'lv50', 'lv75'][+r.value]);
        r.style.setProperty('--v', `${(+r.value / 3) * 100}%`);
        sum += dishWaste({ costPerServing: d.costPerServing, servings: m.servings, leftoverPct: pct }).costNT;
      });
      $(`#wt-${m.id}`).textContent = nt(sum);
    };
    $$('input[type=range]', root).forEach((r) => r.oninput = update);
    update();
    $(`[data-savefb="${m.id}"]`).onclick = () => {
      const fb = $$('input[type=range]', root).map((r) => {
        const d = m.dishes[+r.dataset.i]; const pct = LEFTOVER_STOPS[+r.value];
        const w = dishWaste({ costPerServing: d.costPerServing, servings: m.servings, leftoverPct: pct, gramsPerServing: d.grams });
        return { dishKey: d.key, foodIds: d.foodIds, leftoverPct: pct, costNT: w.costNT, kg: w.kg };
      });
      m.feedback = fb;
      S.ratings = applyFeedback(S.ratings, fb);
      for (const f of fb) if (f.costNT > 0) S.wasteLog.push({ date: m.date, type: 'plate', dishKey: f.dishKey, kg: f.kg, cost: f.costNT });
      save(); toast(t('feedback_saved')); route();
    };
  }
}

// ---------------------------------------------------------------------------
// REPORT
// ---------------------------------------------------------------------------
function renderReport() {
  const since = isoDate(addDays(today(), -30));
  const meals = S.meals.filter((m) => m.date >= since);
  const waste = S.wasteLog.filter((w) => w.date >= since);
  const expiredCost = waste.filter((w) => w.type === 'expired').reduce((s, w) => s + w.cost, 0);
  const plateCost = waste.filter((w) => w.type === 'plate').reduce((s, w) => s + w.cost, 0);
  const rescued = meals.reduce((s, m) => s + (m.expiringUsed || 0), 0);
  const avgProtein = meals.length ? (meals.reduce((s, m) => s + m.proteinPerServing, 0) / meals.length).toFixed(1) : '–';
  const target = meals[0]?.proteinTarget;

  const byDish = {};
  for (const m of meals) for (const f of m.feedback || []) {
    const d = m.dishes.find((x) => x.key === f.dishKey);
    const k = d ? d.name[L()] : f.dishKey;
    byDish[k] = (byDish[k] || 0) + f.costNT;
  }
  const dishRows = Object.entries(byDish).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const max = Math.max(1, ...dishRows.map((r) => r[1]));

  $('#view').innerHTML = `
    <section class="card"><h1>${t('report_title')}</h1><p class="muted">${t('last30')}</p>
      <div class="kpis">
        <div class="kpi"><span>${t('k_meals')}</span><strong>${meals.length}</strong></div>
        <div class="kpi"><span>${t('k_rescued')}</span><strong>${rescued}</strong></div>
        <div class="kpi"><span>${t('k_expired')}</span><strong>${nt(expiredCost)}</strong></div>
        <div class="kpi"><span>${t('k_plate')}</span><strong>${nt(plateCost)}</strong></div>
        <div class="kpi"><span>${t('k_protein')}</span><strong>${avgProtein}${avgProtein !== '–' ? ' g' : ''}</strong>${target ? `<small>${t('target')} ${target} g</small>` : ''}</div>
      </div>
    </section>
    <section class="card"><h2>${t('waste_by_dish')}</h2>
      ${dishRows.length ? `<ul class="hbars">${dishRows.map(([k, v]) => `<li><span class="hb-label">${esc(k)}</span><span class="hb-track"><span class="hb-fill" style="width:${(v / max) * 100}%"></span></span><span class="hb-val">${nt(v)}</span></li>`).join('')}</ul>` : `<p class="muted">${t('no_data')}</p>`}
    </section>
    <section class="card"><h2>${t('history')}</h2>
      ${S.meals.length ? `<ul class="history">${S.meals.slice(0, 20).map((m) => `<li><strong>${m.date}</strong> · ${m.servings} · ${m.dishes.map((d) => esc(d.name[L()])).join('、')}${m.feedback ? ` · ${nt(m.feedback.reduce((s, f) => s + f.costNT, 0))}` : ' · ⏳'}</li>`).join('')}</ul>` : `<p class="muted">${t('no_data')}</p>`}
      <button class="btn" id="csvBtn">⬇ ${t('export_csv')}</button>
    </section>`;

  $('#csvBtn').onclick = () => {
    const rows = [['type', 'date', 'item', 'kg', 'cost_ntd']];
    for (const w of S.wasteLog) rows.push([w.type, w.date, w.foodId || w.dishKey, w.kg, w.cost]);
    for (const m of S.meals) rows.push(['meal', m.date, m.dishes.map((d) => d.name.en).join(' | '), '', Math.round(m.dishes.reduce((s, d) => s + d.costPerServing, 0) * m.servings)]);
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' }));
    a.download = `silvermeal-${isoDate(today())}.csv`;
    a.click();
  };
}

// ---------------------------------------------------------------------------
// SETTINGS
// ---------------------------------------------------------------------------
function openSettings() {
  const s = S.settings;
  openSheet(`
    <header class="sheet-head"><h2>${t('settings')}</h2><button class="icon-btn" data-close aria-label="${t('close')}">✕</button></header>
    <form id="setForm" class="form">
      <label>${t('facility')}<input name="facility" value="${esc(s.facility)}" maxlength="40"></label>
      <div class="row2">
        <label>${t('default_servings')}<input name="servings" type="number" min="1" max="500" value="${s.servings}"></label>
        <label>${t('default_texture')}<select name="texture">${TEXTURES.map((x) => `<option value="${x.id}" ${x.id === s.texture ? 'selected' : ''}>${x[L()]}</option>`).join('')}</select></label>
      </div>
      <div class="row2">
        <label>${t('language')}<select name="lang"><option value="zh" ${s.lang === 'zh' ? 'selected' : ''}>繁體中文</option><option value="en" ${s.lang === 'en' ? 'selected' : ''}>English</option></select></label>
        <label>${t('theme')}<select name="theme">${['auto', 'light', 'dark'].map((x) => `<option value="${x}" ${s.theme === x ? 'selected' : ''}>${t('theme_' + x)}</option>`).join('')}</select></label>
      </div>
      <label>${t('api_key')}<input name="apiKey" type="password" autocomplete="off" value="${esc(s.apiKey)}" placeholder="sk-ant-…"></label>
      <p class="muted small">${t('api_key_help')}</p>
      <button class="btn btn-primary btn-block" type="submit">${t('save')}</button>
      <div class="actions">
        <button type="button" class="btn" data-reset>${t('reset_demo')}</button>
        <button type="button" class="btn btn-danger" data-clear>${t('clear_all')}</button>
      </div>
    </form>`, (d) => {
    $('[data-close]', d).onclick = () => d.close();
    const f = $('#setForm', d);
    f.onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(f);
      Object.assign(S.settings, { facility: fd.get('facility').trim() || s.facility, servings: Math.max(1, +fd.get('servings') || 30), texture: fd.get('texture'), lang: fd.get('lang'), theme: fd.get('theme'), apiKey: fd.get('apiKey').trim() });
      save(); d.close(); applyChrome(); route(); toast(t('saved'));
    };
    armConfirm($('[data-reset]', d), t('reset_confirm'), () => { const keep = S.settings; S = defaultState(); S.settings = keep; draftPlan = null; planSelection = null; save(); d.close(); route(); });
    armConfirm($('[data-clear]', d), t('clear_confirm'), () => { const keep = S.settings; S = { ...defaultState(), inventory: [], settings: keep }; draftPlan = null; planSelection = null; save(); d.close(); route(); });
  });
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
$('#langBtn').onclick = () => { S.settings.lang = L() === 'zh' ? 'en' : 'zh'; save(); applyChrome(); route(); };
$('#settingsBtn').onclick = openSettings;
window.addEventListener('hashchange', () => { route(); $('#view').focus({ preventScroll: true }); window.scrollTo(0, 0); });
applyChrome();
route();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
