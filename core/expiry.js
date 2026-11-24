// Expiration logic: traffic-light classification and OCR date extraction.
// Pure functions, no DOM — shared by the app, the simulator and the tests.

export const DAY_MS = 86400000;

/** Parse "YYYY-MM-DD" (or a Date) to a local-midnight Date. */
export function toDate(d) {
  if (d instanceof Date) return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const [y, m, day] = String(d).split('-').map(Number);
  return new Date(y, m - 1, day);
}

export function isoDate(d) {
  const x = toDate(d);
  const mm = String(x.getMonth() + 1).padStart(2, '0');
  const dd = String(x.getDate()).padStart(2, '0');
  return `${x.getFullYear()}-${mm}-${dd}`;
}

export function addDays(d, n) {
  const x = toDate(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function daysUntil(expiry, today = new Date()) {
  return Math.round((toDate(expiry) - toDate(today)) / DAY_MS);
}

/**
 * Traffic light from the proposal:
 *   expired — past the date, must be discarded
 *   red     — expires today
 *   yellow  — within 3 days
 *   green   — safe
 */
export function expiryStatus(expiry, today = new Date(), yellowDays = 3) {
  const d = daysUntil(expiry, today);
  if (d < 0) return 'expired';
  if (d === 0) return 'red';
  if (d <= yellowDays) return 'yellow';
  return 'green';
}

export const STATUS_ORDER = { expired: 0, red: 1, yellow: 2, green: 3 };

/** First-In-First-Out ordering: soonest expiry first, then oldest received. */
export function sortFIFO(items) {
  return [...items].sort((a, b) =>
    toDate(a.expiry) - toDate(b.expiry) ||
    String(a.received || '').localeCompare(String(b.received || '')));
}

// ---------------------------------------------------------------------------
// OCR text → expiry date
// ---------------------------------------------------------------------------

const EXP_KEYWORDS = [
  '有效日期', '有效期限', '有效期至', '賞味期限', '到期日', '保存期限至', '最佳賞味',
  'exp', 'expiry', 'expires', 'expiration', 'use by', 'best before', 'best by', 'bb', 'bbe',
];
const MFG_KEYWORDS = ['製造日期', '製造日', '生產日期', '包裝日期', 'mfg', 'mfd', 'manufactured', 'packed', 'prod'];

function validYMD(y, m, d) {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(y, m - 1, d);
  if (dt.getMonth() !== m - 1) return null;
  if (y < 2000 || y > 2100) return null;
  return dt;
}

/** Convert a year token, supporting Taiwan's ROC calendar (民國 115 = 2026) and 2-digit years. */
function normYear(raw) {
  const y = Number(raw);
  if (raw.length === 4) return y;
  if (raw.length === 3) return y + 1911;          // ROC year, e.g. 115 → 2026
  if (raw.length === 2) return y >= 90 ? y + 1911 : 2000 + y; // 2-digit: assume 20xx (or ROC 9x)
  return NaN;
}

/** Find every date-looking token in text with its character position. */
export function findDates(text) {
  const out = [];
  const t = String(text)
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[／．。]/g, (c) => ({ '／': '/', '．': '.', '。': '.' })[c]);
  const push = (dt, index) => { if (dt) out.push({ date: dt, index }); };
  let m;

  // 民國115年11月25日 / 2026年11月25日
  const reCJK = /(?:民國\s*)?(\d{2,4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日?/g;
  while ((m = reCJK.exec(t))) push(validYMD(normYear(m[1]), +m[2], +m[3]), m.index);

  // Y-M-D with separators: 2026/11/25, 2026-11-25, 2026.11.25, 115.11.25, 26/11/25
  const reYMD = /(?<![\d])(\d{2,4})[\/.\-](\d{1,2})[\/.\-](\d{1,2})(?![\d])/g;
  while ((m = reYMD.exec(t))) {
    const first = m[1];
    if (first.length >= 3) push(validYMD(normYear(first), +m[2], +m[3]), m.index);
  }

  // D-M-Y / M-D-Y with 4-digit year at the end: 25/11/2026 or 11/25/2026
  const reDMY = /(?<![\d])(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})(?![\d])/g;
  while ((m = reDMY.exec(t))) {
    const a = +m[1], b = +m[2], y = +m[3];
    // Prefer day-first (common on imported labels in Taiwan); fall back to month-first.
    push(a > 12 ? validYMD(y, b, a) : (validYMD(y, b, a) || validYMD(y, a, b)), m.index);
  }

  // Compact 20261125 or 1151125 (ROC)
  const reCompact = /(?<![\d])(20\d{2}|1[01]\d)(\d{2})(\d{2})(?![\d])/g;
  while ((m = reCompact.exec(t))) push(validYMD(normYear(m[1]), +m[2], +m[3]), m.index);

  // "25 NOV 2026" / "NOV 25 2026"
  const MON = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
  const reMon1 = /(\d{1,2})\s*([A-Za-z]{3})[A-Za-z]*\.?\s*(\d{4})/g;
  while ((m = reMon1.exec(t))) { const mo = MON[m[2].toLowerCase()]; if (mo) push(validYMD(+m[3], mo, +m[1]), m.index); }
  const reMon2 = /([A-Za-z]{3})[A-Za-z]*\.?\s*(\d{1,2}),?\s*(\d{4})/g;
  while ((m = reMon2.exec(t))) { const mo = MON[m[1].toLowerCase()]; if (mo) push(validYMD(+m[3], mo, +m[2]), m.index); }

  // de-duplicate by date+index proximity
  const seen = new Set();
  return out
    .sort((a, b) => a.index - b.index)
    .filter((d) => { const k = isoDate(d.date) + '@' + Math.floor(d.index / 4); if (seen.has(k)) return false; seen.add(k); return true; });
}

function keywordPositions(lower, keywords) {
  const pos = [];
  for (const k of keywords) {
    const re = new RegExp(k.length <= 3 && /^[a-z]+$/.test(k) ? `\\b${k}\\b` : k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    let m; while ((m = re.exec(lower))) pos.push(m.index);
  }
  return pos;
}

/**
 * Extract the most likely expiry date from noisy OCR text.
 * Returns { expiry: 'YYYY-MM-DD' | null, confidence: 0..1, method, candidates }.
 */
export function parseExpiryFromText(text) {
  const lower = String(text).toLowerCase();
  const dates = findDates(text);
  const expPos = keywordPositions(lower, EXP_KEYWORDS);
  const mfgPos = keywordPositions(lower, MFG_KEYWORDS);
  const candidates = dates.map((d) => isoDate(d.date));

  const nearest = (idx, list) => list.reduce((best, p) => (p <= idx + 2 && idx - p < best ? idx - p : best), Infinity);

  if (dates.length) {
    // 1) a date right after an expiry keyword
    const scored = dates.map((d) => ({ ...d, exp: nearest(d.index, expPos), mfg: nearest(d.index, mfgPos) }));
    const byExp = scored.filter((d) => d.exp < 40 && d.exp <= d.mfg).sort((a, b) => a.exp - b.exp);
    if (byExp.length) return { expiry: isoDate(byExp[0].date), confidence: 0.95, method: 'keyword', candidates };

    // 2) manufacture date + shelf life ("保存期限 12個月", "shelf life 180 days")
    const mfg = scored.filter((d) => d.mfg < 40).sort((a, b) => a.mfg - b.mfg)[0];
    const life = lower.match(/(?:保存期限|保存期間|賞味期間|shelf\s*life)[^\d]{0,6}(\d{1,4})\s*(個月|月|天|日|年|months?|days?|years?)/);
    if (mfg && life) {
      const n = +life[1]; const u = life[2];
      const dt = new Date(mfg.date);
      if (/月|month/.test(u)) dt.setMonth(dt.getMonth() + n);
      else if (/年|year/.test(u)) dt.setFullYear(dt.getFullYear() + n);
      else dt.setDate(dt.getDate() + n);
      return { expiry: isoDate(dt), confidence: 0.85, method: 'mfg+shelf-life', candidates };
    }

    // 3) exclude manufacture-tagged dates, pick the latest remaining
    const rest = scored.filter((d) => !(d.mfg < 40 && d.mfg < d.exp));
    const pool = rest.length ? rest : scored;
    const latest = pool.reduce((a, b) => (b.date > a.date ? b : a));
    return { expiry: isoDate(latest.date), confidence: pool.length === 1 ? 0.7 : 0.5, method: 'latest-date', candidates };
  }
  return { expiry: null, confidence: 0, method: 'none', candidates };
}
