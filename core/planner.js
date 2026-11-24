// Rule-based senior group-meal planner.
// Works fully offline; the optional generative-AI layer (core/claude.js) can
// rewrite the result into richer recipes, but this engine is always the source
// of quantities, protein math and FIFO priority.

import { FOOD_BY_ID, TEXTURE_PREP, foodName } from './foods.js';
import { daysUntil, expiryStatus } from './expiry.js';

// ESPEN geriatric guideline: ≥1.0 g protein/kg/day (1.2–1.5 for frail/sarcopenic).
export const PROTEIN_G_PER_KG_DAY = 1.2;
export const DEFAULT_BODY_KG = 58;
export const DEFAULT_MEAL_SHARE = 0.35; // community lunch ≈ the main meal of the day

export function proteinTargetPerMeal(bodyKg = DEFAULT_BODY_KG, share = DEFAULT_MEAL_SHARE) {
  return Math.round(bodyKg * PROTEIN_G_PER_KG_DAY * share);
}

const FISH = new Set(['fish', 'salmon', 'milkfish', 'canned_tuna']);
const TOFU = new Set(['tofu', 'firm_tofu']);
const MINCE = new Set(['pork_mince']);
const MEAT = new Set(['chicken', 'chicken_br', 'pork_loin']);
const MAIN_PROTEINS = new Set([...FISH, ...TOFU, ...MINCE, ...MEAT, 'egg']);
const RICE = new Set(['rice', 'brown_rice', 'oats']);
const ROOT = new Set(['sweet_potato', 'pumpkin', 'potato', 'taro']);

// grams per serving (raw weight)
const PORTION = { mainProtein: 90, mainVeg: 40, sideVeg: 100, sideVeg2: 40, rice: 70, root: 120, noodles: 100, bread: 60, soupVeg: 50, soupProtein: 30, fruit: 80, dairy: 100 };

const fill = (tpl, map) => tpl.replace(/\{(\w+)\}/g, (_, k) => map[k] ?? '');

function priorityOf(item, today, selected, ratings) {
  const d = daysUntil(item.expiry, today);
  const st = expiryStatus(item.expiry, today);
  let p = 0;
  if (selected.has(item.id)) p += 100;
  if (st === 'red') p += 50; else if (st === 'yellow') p += 30;
  p += Math.max(0, 20 - d);              // sooner = higher
  if (item.source === 'donation') p += 3; // donated stock tends to arrive close to date
  const r = ratings?.foods?.[item.foodId];
  if (r != null) p *= 0.6 + 0.8 * r;     // rating 0..1 → ×0.6..1.4
  return p;
}

/**
 * @param {object} o
 * @param {Array}  o.inventory  [{id, foodId, qtyKg, expiry, received, source}]
 * @param {Array}  o.selectedIds inventory ids the user ticked (red/yellow items)
 * @param {number} o.servings
 * @param {string} o.texture    regular|easy|soft|minced|pureed
 * @param {object} o.ratings    {foods:{foodId:0..1}, dishes:{dishKey:0..1}}
 */
export function planMenu({ inventory = [], selectedIds = [], servings = 30, texture = 'soft', today = new Date(), ratings = {}, bodyKg = DEFAULT_BODY_KG, mealShare = DEFAULT_MEAL_SHARE } = {}) {
  const selected = new Set(selectedIds);
  const pool = inventory
    .filter((it) => it.qtyKg > 0.01 && expiryStatus(it.expiry, today) !== 'expired' && FOOD_BY_ID[it.foodId])
    .map((it) => ({ ...it, food: FOOD_BY_ID[it.foodId], prio: priorityOf(it, today, selected, ratings), left: it.qtyKg }))
    .sort((a, b) => b.prio - a.prio);

  const used = new Set();
  const pick = (pred) => {
    const it = pool.find((x) => !used.has(x.foodId) && pred(x));
    if (it) used.add(it.foodId);
    return it || null;
  };

  const lines = []; // all ingredient lines for shopping/stock math
  const line = (it, foodId, gramsPerServing) => {
    const needKg = (gramsPerServing * servings) / 1000;
    const takeKg = it ? Math.min(it.left, needKg) : 0;
    if (it) it.left -= takeKg;
    const l = { itemId: it?.id ?? null, foodId: it?.foodId ?? foodId, grams: gramsPerServing, needKg: +needKg.toFixed(2), fromStockKg: +takeKg.toFixed(2), shortKg: +(needKg - takeKg).toFixed(2), urgent: it ? ['red', 'yellow'].includes(expiryStatus(it.expiry, today)) : false, selected: it ? selected.has(it.id) : false };
    lines.push(l);
    return l;
  };

  const N = (id) => ({ en: foodName(id, 'en'), zh: foodName(id, 'zh') });
  const dishes = [];
  const addDish = (key, role, nameEn, nameZh, ingLines) => dishes.push({ key, role, name: { en: nameEn, zh: nameZh }, ingredients: ingLines });

  // ---- main protein dish ----
  const pMain = pick((x) => MAIN_PROTEINS.has(x.foodId));
  const vMain = pick((x) => x.food.cat === 'veg');
  const pid = pMain?.foodId || 'egg';
  const vid = vMain?.foodId || 'carrot';
  const p = N(pid), v = N(vid);
  const mainLines = [line(pMain, pid, PORTION.mainProtein), line(vMain, vid, PORTION.mainVeg)];
  if (FISH.has(pid)) addDish(`main:steamed:${pid}`, 'main', fill('Steamed {p} with {v} & ginger', { p: p.en, v: v.en.toLowerCase() }), fill('薑絲{v}蒸{p}', { p: p.zh, v: v.zh }), mainLines);
  else if (pid === 'egg') addDish('main:custard:egg', 'main', fill('Steamed egg custard with {v}', { v: v.en.toLowerCase() }), fill('{v}蒸蛋', { v: v.zh }), mainLines);
  else if (TOFU.has(pid)) addDish(`main:braise:${pid}`, 'main', fill('Braised {p} with {v} (thickened)', { p: p.en.toLowerCase(), v: v.en.toLowerCase() }), fill('{v}燴{p}', { p: p.zh, v: v.zh }), mainLines);
  else if (MINCE.has(pid) || texture === 'minced' || texture === 'pureed') addDish(`main:meatball:${pid}`, 'main', fill('Tender {p} & {v} meatballs', { p: p.en.toLowerCase(), v: v.en.toLowerCase() }), fill('{v}{p}丸子', { p: p.zh, v: v.zh }), mainLines);
  else addDish(`main:stew:${pid}`, 'main', fill('Slow-braised {p} with {v}', { p: p.en.toLowerCase(), v: v.en.toLowerCase() }), fill('{v}燉{p}', { p: p.zh, v: v.zh }), mainLines);

  // ---- vegetable side ----
  const s1 = pick((x) => x.food.cat === 'veg' && x.foodId !== 'mushroom') || pick((x) => x.food.cat === 'veg');
  const s2 = pick((x) => x.food.cat === 'veg' || x.foodId === 'mushroom');
  const s1id = s1?.foodId || 'cabbage';
  const sideLines = [line(s1, s1id, PORTION.sideVeg)];
  if (s2) {
    sideLines.push(line(s2, s2.foodId, PORTION.sideVeg2));
    const textured = texture !== 'regular';
    addDish(`side:${textured ? 'thick' : 'fry'}:${s1id}`, 'side',
      textured ? `Thickened ${N(s1id).en.toLowerCase()} with ${N(s2.foodId).en.toLowerCase()}` : `Stir-fried ${N(s1id).en.toLowerCase()} with ${N(s2.foodId).en.toLowerCase()}`,
      textured ? `${N(s2.foodId).zh}燴${N(s1id).zh}` : `${N(s2.foodId).zh}炒${N(s1id).zh}`, sideLines);
  } else {
    addDish(`side:plain:${s1id}`, 'side', `Braised ${N(s1id).en.toLowerCase()}`, `滷${N(s1id).zh}`, sideLines);
  }

  // ---- staple ----
  const st = pick((x) => x.food.cat === 'starch');
  const sid = st?.foodId || 'rice';
  const congee = texture === 'minced' || texture === 'pureed';
  if (RICE.has(sid)) {
    addDish(`staple:${congee ? 'congee' : 'rice'}:${sid}`, 'staple', congee ? `${N(sid).en} congee` : `Soft ${N(sid).en.toLowerCase()}`, congee ? `${N(sid).zh}粥` : `${N(sid).zh}軟飯`, [line(st, sid, PORTION.rice)]);
  } else if (ROOT.has(sid)) {
    const riceIt = pick((x) => RICE.has(x.foodId));
    const rid = riceIt?.foodId || 'rice';
    addDish(`staple:${congee ? 'congee' : 'rice'}:${sid}`, 'staple', congee ? `${N(sid).en} congee` : `${N(sid).en} rice`, congee ? `${N(sid).zh}粥` : `${N(sid).zh}飯`, [line(st, sid, PORTION.root * 0.6), line(riceIt, rid, PORTION.rice * 0.6)]);
  } else if (sid === 'noodles') {
    addDish('staple:noodle:noodles', 'staple', 'Soft-cooked noodles', '軟麵條', [line(st, sid, PORTION.noodles)]);
  } else {
    addDish(`staple:bread:${sid}`, 'staple', 'Milk-soaked bread pudding', '牛奶麵包布丁', [line(st, sid, PORTION.bread)]);
  }

  // ---- soup ----
  const sv = pick((x) => x.food.cat === 'veg');
  const sp = pick((x) => ['egg', 'tofu', 'firm_tofu', 'soy_milk', 'edamame', 'pork_mince', 'chicken'].includes(x.foodId));
  const svid = sv?.foodId || 'winter_melon';
  const spid = sp?.foodId || (pid === 'egg' ? 'tofu' : 'egg');
  addDish(`soup:${svid}:${spid}`, 'soup', `${N(svid).en} & ${N(spid).en.toLowerCase()} soup`, `${N(svid).zh}${N(spid).zh}湯`, [line(sv, svid, PORTION.soupVeg), line(sp, spid, PORTION.soupProtein)]);

  // ---- fruit / dairy ----
  const fr = pick((x) => x.food.cat === 'fruit');
  const dy = pick((x) => x.food.cat === 'dairy');
  if (fr || dy) {
    const ls = [];
    if (fr) ls.push(line(fr, fr.foodId, PORTION.fruit));
    if (dy) ls.push(line(dy, dy.foodId, PORTION.dairy));
    const en = fr && dy ? `${N(fr.foodId).en} with ${N(dy.foodId).en.toLowerCase()}` : N((fr || dy).foodId).en;
    const zh = fr && dy ? `${N(fr.foodId).zh}${N(dy.foodId).zh}` : N((fr || dy).foodId).zh;
    addDish(`dessert:${fr?.foodId || ''}:${dy?.foodId || ''}`, 'dessert', en, zh, ls);
  }

  // ---- nutrition, cost, texture guidance ----
  const nutr = (l) => { const f = FOOD_BY_ID[l.foodId]; return { protein: (f.protein * l.grams) / 100, kcal: (f.kcal * l.grams) / 100, cost: (f.price * l.grams) / 1000 }; };
  for (const d of dishes) {
    const n = d.ingredients.map(nutr);
    d.proteinG = +n.reduce((s, x) => s + x.protein, 0).toFixed(1);
    d.kcal = Math.round(n.reduce((s, x) => s + x.kcal, 0));
    d.costPerServing = +n.reduce((s, x) => s + x.cost, 0).toFixed(1);
    d.rating = ratings?.dishes?.[d.key] ?? null;
    d.prep = [...new Set(d.ingredients.map((l) => FOOD_BY_ID[l.foodId].cat))].map((cat) => {
      const tip = (TEXTURE_PREP[cat] || TEXTURE_PREP.other)[texture];
      return { cat, en: tip[0], zh: tip[1] };
    });
  }

  const target = proteinTargetPerMeal(bodyKg, mealShare);
  const proteinPerServing = +dishes.reduce((s, d) => s + d.proteinG, 0).toFixed(1);
  const gap = +(target - proteinPerServing).toFixed(1);

  // Protein boost suggestion: cheapest protein per gram, preferring soft foods.
  const boosts = [];
  if (gap > 0.5) {
    const opts = ['egg', 'tofu', 'soy_milk', 'canned_tuna', 'fish'].map((id) => {
      const f = FOOD_BY_ID[id];
      const gPerServing = Math.ceil((gap / f.protein) * 100);
      const stock = pool.filter((x) => x.foodId === id).reduce((s, x) => s + x.left, 0);
      const needKg = (gPerServing * servings) / 1000;
      return { foodId: id, gramsPerServing: gPerServing, needKg: +needKg.toFixed(2), inStockKg: +stock.toFixed(2), buyKg: +Math.max(0, needKg - stock).toFixed(2), cost: +((f.price * Math.max(0, needKg - stock))).toFixed(0), costPerG: f.price / f.protein };
    }).sort((a, b) => (a.buyKg > 0) - (b.buyKg > 0) || a.costPerG - b.costPerG);
    boosts.push(...opts.slice(0, 3));
  }

  const starchKcal = lines.reduce((s, l) => s + (FOOD_BY_ID[l.foodId].cat === 'starch' ? (FOOD_BY_ID[l.foodId].kcal * l.grams) / 100 : 0), 0);
  const kcal = dishes.reduce((s, d) => s + d.kcal, 0);
  const warnings = [];
  if (gap > 0.5) warnings.push({ code: 'protein_gap', gap });
  if (kcal && starchKcal / kcal > 0.6) warnings.push({ code: 'starch_heavy', share: +(starchKcal / kcal).toFixed(2) });
  const shopping = lines.filter((l) => l.shortKg > 0.01).reduce((acc, l) => { acc[l.foodId] = +((acc[l.foodId] || 0) + l.shortKg).toFixed(2); return acc; }, {});
  if (Object.keys(shopping).length) warnings.push({ code: 'shortage', items: shopping });

  const urgentIds = pool.filter((x) => ['red', 'yellow'].includes(expiryStatus(x.expiry, today))).map((x) => x.id);
  const usedUrgent = lines.filter((l) => l.urgent && l.itemId).map((l) => l.itemId);
  const unusedSelected = [...selected].filter((id) => !lines.some((l) => l.itemId === id));

  return {
    servings, texture, dishes, lines,
    totals: { proteinPerServing, kcal, costPerServing: +dishes.reduce((s, d) => s + d.costPerServing, 0).toFixed(1), totalCost: Math.round(dishes.reduce((s, d) => s + d.costPerServing, 0) * servings) },
    proteinTarget: target, proteinGap: Math.max(0, gap), boosts, warnings, shopping,
    expiringUsed: usedUrgent.length, expiringTotal: urgentIds.length, unusedSelected,
  };
}

/** Deduct a confirmed plan from inventory (FIFO within the same food). Returns new inventory. */
export function consumePlan(inventory, plan) {
  const inv = inventory.map((x) => ({ ...x }));
  for (const l of plan.lines) {
    if (!l.itemId) continue;
    const it = inv.find((x) => x.id === l.itemId);
    if (it) it.qtyKg = +Math.max(0, it.qtyKg - l.fromStockKg).toFixed(2);
  }
  return inv.filter((x) => x.qtyKg > 0.01);
}
