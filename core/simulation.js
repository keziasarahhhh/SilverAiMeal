// Kitchen operations simulator: Manual (paper logs) vs SilverMeal AI.
// Pure, deterministic for a given seed, no DOM. Both strategies receive the
// exact same deliveries (purchases + donations) and serve the same seniors;
// only the way stock is picked, checked and learned from differs.

import { FOODS, FOOD_BY_ID } from './foods.js';
import { addDays, isoDate } from './expiry.js';
import { planMenu, proteinTargetPerMeal } from './planner.js';
import { applyFeedback, leftoverFraction } from './waste.js';

export const DEFAULT_PARAMS = {
  days: 60,
  seniors: 40,
  donationFreq: 0.35,   // probability of a donation batch on a given day
  donationKg: 20,       // average size of a donation batch
  fifoCompliance: 0.55, // manual: chance a cook picks the oldest item
  missRate: 0.08,       // manual: chance an expired item is not noticed on a given day
  seed: 42,
  texture: 'soft',
};

/** mulberry32 — tiny deterministic PRNG. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BASE_DATE = new Date(2026, 0, 5); // a Monday; only relative days matter
const STOPS = [0, 25, 50, 75];
const ROLE_GRAMS = { main: 80, side: 120, staple: 140, soup: 60, dessert: 80 }; // manual portions

const byCat = (cat) => FOODS.filter((f) => f.cat === cat).map((f) => f.id);
const REG_PROTEIN = ['chicken', 'pork_mince', 'fish', 'tofu', 'egg', 'firm_tofu', 'milkfish'];
const REG_VEG = ['cabbage', 'napa', 'carrot', 'daikon', 'broccoli', 'loofah', 'winter_melon', 'eggplant', 'spinach', 'tomato', 'zucchini'];
const DON_STARCH = ['sweet_potato', 'pumpkin', 'bread', 'noodles', 'rice', 'taro', 'potato'];
const DON_FRESH = ['cabbage', 'banana', 'papaya', 'tomato', 'napa', 'orange', 'spinach'];
const DON_PROTEIN = ['milk', 'tofu', 'soy_milk', 'egg', 'yogurt'];

const pickOf = (rand, arr) => arr[Math.floor(rand() * arr.length)];
const snapPct = (f) => STOPS.reduce((b, s) => (Math.abs(s - f * 100) < Math.abs(b - f * 100) ? s : b), 0);
const r1 = (x) => Math.round(x * 10) / 10;

/** Pre-generate identical deliveries for both strategies. */
function generateArrivals(p, rand) {
  const days = [];
  for (let d = 0; d < p.days; d++) {
    const list = [];
    const add = (foodId, qtyKg, lifeDays, source) => list.push({ foodId, qtyKg: r1(Math.max(0.5, qtyKg)), expiryDay: d + Math.max(1, Math.round(lifeDays)), receivedDay: d, source });
    // Regular purchase every 3 days, sized for ~3 days of meals.
    if (d % 3 === 0) {
      const n = p.seniors * 3;
      const prot = [pickOf(rand, REG_PROTEIN), pickOf(rand, REG_PROTEIN)];
      for (const id of prot) add(id, (n * 0.1) / 2, FOOD_BY_ID[id].shelf * (0.8 + rand() * 0.4), 'purchase');
      for (let k = 0; k < 3; k++) { const id = pickOf(rand, REG_VEG); add(id, (n * 0.19) / 3, FOOD_BY_ID[id].shelf * (0.7 + rand() * 0.5), 'purchase'); }
      if (d % 6 === 0) add('rice', n * 0.05 * 2, 200, 'purchase');
      if (rand() < 0.6) { const id = pickOf(rand, ['banana', 'papaya', 'orange']); add(id, n * 0.06, FOOD_BY_ID[id].shelf * (0.7 + rand() * 0.4), 'purchase'); }
    }
    // Donations: random, often starch-heavy and close to the date.
    if (rand() < p.donationFreq) {
      const size = p.donationKg * (0.5 + rand());
      const parts = [[DON_STARCH, 0.6], [DON_FRESH, 0.25], [DON_PROTEIN, 0.15]];
      for (const [pool, share] of parts) {
        const id = pickOf(rand, pool);
        const f = FOOD_BY_ID[id];
        add(id, size * share, Math.min(f.shelf, 30) * (0.1 + rand() * 0.5), 'donation');
      }
    }
    days.push(list);
  }
  return days;
}

function makeTastes(rand) {
  // Hidden preference of this group of seniors for each food (0..1).
  const t = {};
  for (const f of FOODS) t[f.id] = 0.4 + rand() * 0.55;
  return t;
}

function newStats() {
  return { expiredKg: [], expiredNT: [], incidents: [], protein: [], plateKg: [], plateNT: [], cost: [], extraNT: [], leftoverPct: [], stockKg: [], rescuedKg: [] };
}

function summarize(s, target) {
  const sum = (a) => a.reduce((x, y) => x + y, 0);
  const avg = (a) => (a.length ? sum(a) / a.length : 0);
  const expiredKg = sum(s.expiredKg); const rescued = sum(s.rescuedKg);
  return {
    expiredKg: r1(expiredKg),
    expiredNT: Math.round(sum(s.expiredNT)),
    incidents: sum(s.incidents),
    avgProtein: r1(avg(s.protein)),
    proteinTarget: target,
    daysProteinMet: s.protein.filter((x) => x >= target - 0.5).length,
    plateKg: r1(sum(s.plateKg)),
    plateNT: Math.round(sum(s.plateNT)),
    avgLeftoverPct: r1(avg(s.leftoverPct)),
    lastWeekLeftoverPct: r1(avg(s.leftoverPct.slice(-7))),
    foodCost: Math.round(sum(s.cost)),
    topUpNT: Math.round(sum(s.extraNT)),
    rescuePct: rescued + expiredKg > 0 ? Math.round((rescued / (rescued + expiredKg)) * 100) : 100,
    totalWasteNT: Math.round(sum(s.expiredNT) + sum(s.plateNT)),
  };
}

/** Take `kg` of a food from inventory, preferring `first` item, then by `order` fn. Returns kg actually taken & list of taken parts. */
function take(inv, foodId, kg, order, day, first) {
  const parts = [];
  let need = kg;
  const cands = inv.filter((x) => x.foodId === foodId && x.qtyKg > 0.001);
  const ordered = order(cands);
  if (first) { const i = ordered.indexOf(first); if (i > 0) { ordered.splice(i, 1); ordered.unshift(first); } }
  for (const it of ordered) {
    if (need <= 0.0001) break;
    const q = Math.min(it.qtyKg, need);
    it.qtyKg -= q; need -= q;
    parts.push({ item: it, kg: q });
  }
  return { taken: kg - need, parts };
}

function leftoverFor(rand, tastes, foodIds, penalty, tuning) {
  // tuning: per-food acceptance gain from recipe adjustments learned via feedback (SilverMeal only)
  const accept = foodIds.reduce((s, id) => s + tastes[id] + (tuning ? tuning(id) : 0), 0) / foodIds.length - penalty;
  const f = Math.min(1, Math.max(0, (1 - accept) * 0.95 + (rand() - 0.5) * 0.25));
  return snapPct(f);
}

/**
 * Run both strategies.
 * @returns {{params, target, days:number, manual:{daily, summary}, silver:{daily, summary}, snapshots:Array}}
 */
export function runSimulation(params = {}) {
  const p = { ...DEFAULT_PARAMS, ...params };
  p.days = Math.max(1, Math.round(p.days));
  p.seniors = Math.max(1, Math.round(p.seniors));
  const target = proteinTargetPerMeal();
  const arrivals = generateArrivals(p, mulberry32(p.seed));
  const tastes = makeTastes(mulberry32(p.seed * 7 + 1));

  const strategies = {
    manual: { inv: [], stats: newStats(), rand: mulberry32(p.seed * 13 + 3) },
    silver: { inv: [], stats: newStats(), rand: mulberry32(p.seed * 17 + 5), ratings: {}, seen: {} },
  };
  const snapshots = [];
  let uid = 0;
  const fifo = (a) => [...a].sort((x, y) => x.expiryDay - y.expiryDay || x.receivedDay - y.receivedDay);

  for (let d = 0; d < p.days; d++) {
    const today = addDays(BASE_DATE, d);
    const snap = { day: d + 1 };

    for (const key of ['manual', 'silver']) {
      const S = strategies[key];
      const st = S.stats; const rand = S.rand;
      // Each round of feedback lets the planner adjust softness/seasoning for that food:
      // acceptance gain approaches +0.25 for disliked foods, less for already-liked ones.
      const tuning = (id) => (1 - tastes[id]) * 0.45 * (1 - Math.exp(-(S.seen?.[id] || 0) / 4));
      let cost = 0; let extra = 0;
      // 1) deliveries
      for (const a of arrivals[d]) {
        S.inv.push({ id: `i${++uid}`, ...a });
        if (a.source === 'purchase') cost += a.qtyKg * FOOD_BY_ID[a.foodId].price;
      }
      // 2) expiry check
      let expKg = 0, expNT = 0;
      for (const it of S.inv) {
        if (it.qtyKg > 0 && it.expiryDay < d) {
          const caught = key === 'silver' || rand() > p.missRate;
          if (caught) { expKg += it.qtyKg; expNT += it.qtyKg * FOOD_BY_ID[it.foodId].price; it.qtyKg = 0; }
        }
      }
      S.inv = S.inv.filter((x) => x.qtyKg > 0.001);

      // 3) cook
      let dishes = []; let incidents = 0; let rescued = 0; let protein = 0;
      const servings = p.seniors;
      const accountParts = (parts) => {
        for (const { item, kg } of parts) {
          if (item.expiryDay < d) incidents++;
          else if (item.expiryDay - d <= 3) rescued += kg;
        }
      };

      if (key === 'silver') {
        const inventory = S.inv.map((x) => ({ id: x.id, foodId: x.foodId, qtyKg: x.qtyKg, expiry: isoDate(addDays(BASE_DATE, x.expiryDay)), received: isoDate(addDays(BASE_DATE, x.receivedDay)), source: x.source }));
        const selectedIds = S.inv.filter((x) => x.expiryDay - d <= 3).map((x) => x.id);
        const plan = planMenu({ inventory, selectedIds, servings, texture: p.texture, today, ratings: S.ratings });
        for (const dish of plan.dishes) {
          const foodIds = [];
          let dishCost = 0;
          for (const l of dish.ingredients) {
            const first = S.inv.find((x) => x.id === l.itemId);
            const { taken, parts } = take(S.inv, l.foodId, l.needKg, fifo, d, first);
            accountParts(parts);
            let short = l.needKg - taken;
            const cat = FOOD_BY_ID[l.foodId].cat;
            if (short > 0.01) {
              // substitute with other in-stock food of the same category (FIFO) before buying
              for (const sub of fifo(S.inv.filter((x) => x.qtyKg > 0.001 && FOOD_BY_ID[x.foodId].cat === cat))) {
                if (short <= 0.01) break;
                const r = take(S.inv, sub.foodId, short, fifo, d, sub);
                accountParts(r.parts); short -= r.taken;
              }
            }
            if (short > 0.01) { const c = short * FOOD_BY_ID[l.foodId].price; cost += c; extra += c; } // buy what is still missing
            dishCost += l.needKg * FOOD_BY_ID[l.foodId].price;
            foodIds.push(l.foodId);
          }
          dishes.push({ key: dish.key, role: dish.role, name: dish.name, foodIds, grams: dish.ingredients.reduce((s, l) => s + l.grams, 0), costPerServing: dishCost / servings, penalty: 0 });
        }
        protein = plan.totals.proteinPerServing;
        // protein boost: use stock first, then buy (cheapest soft protein)
        const b = plan.boosts?.[0];
        if (b && plan.proteinGap > 0.5) {
          const { taken, parts } = take(S.inv, b.foodId, b.needKg, fifo, d);
          accountParts(parts);
          { const c = (b.needKg - taken) * FOOD_BY_ID[b.foodId].price; cost += c; extra += c; }
          protein += plan.proteinGap;
          const main = dishes.find((x) => x.role === 'main');
          if (main) { main.foodIds.push(b.foodId); main.grams += b.gramsPerServing; main.costPerServing += (b.needKg * FOOD_BY_ID[b.foodId].price) / servings; }
        }
      } else {
        // Manual: "cook whatever is there", fixed portions, FIFO only sometimes, no texture adaptation, no learning.
        const usable = () => S.inv.filter((x) => x.qtyKg > 0.05);
        const choose = (pred) => {
          const c = usable().filter((x) => pred(FOOD_BY_ID[x.foodId]));
          if (!c.length) return null;
          return rand() < p.fifoCompliance ? fifo(c)[0] : c[Math.floor(rand() * c.length)];
        };
        const roles = [
          ['main', (f) => f.cat === 'protein' && !['soy_milk', 'edamame'].includes(f.id)],
          ['side', (f) => f.cat === 'veg'],
          ['staple', (f) => f.cat === 'starch'],
          ['soup', (f) => f.cat === 'veg' || f.cat === 'protein'],
          ['dessert', (f) => f.cat === 'fruit' || f.cat === 'dairy'],
        ];
        for (const [role, pred] of roles) {
          const it = choose(pred);
          if (!it) continue;
          let grams = ROLE_GRAMS[role];
          // Abundant starch donations make manual cooks serve bigger starch portions
          if (role === 'staple') grams = Math.min(220, grams + usable().filter((x) => FOOD_BY_ID[x.foodId].cat === 'starch').reduce((s, x) => s + x.qtyKg, 0) * 0.5);
          const need = (grams * servings) / 1000;
          const { taken, parts } = take(S.inv, it.foodId, need, fifo, d, it);
          // Manual cooks don't apply FIFO when topping up from other batches either
          accountParts(parts);
          const realGrams = (taken / servings) * 1000;
          const f = FOOD_BY_ID[it.foodId];
          protein += (f.protein * realGrams) / 100;
          dishes.push({ key: `${role}:${it.foodId}`, role, name: { en: f.en, zh: f.zh }, foodIds: [it.foodId], grams: realGrams, costPerServing: (f.price * realGrams) / 1000, penalty: f.hard >= 3 ? 0.2 : f.hard === 2 ? 0.06 : 0 });
        }
      }
      S.inv = S.inv.filter((x) => x.qtyKg > 0.001);

      // 4) leftovers
      let plateKg = 0, plateNT = 0, pctSum = 0;
      const feedback = [];
      for (const dish of dishes) {
        dish.leftoverPct = leftoverFor(rand, tastes, dish.foodIds, dish.penalty, key === 'silver' ? tuning : null);
        const fr = leftoverFraction(dish.leftoverPct);
        plateKg += (dish.grams * servings * fr) / 1000;
        plateNT += dish.costPerServing * servings * fr;
        pctSum += dish.leftoverPct;
        feedback.push({ dishKey: dish.key, foodIds: dish.foodIds, leftoverPct: dish.leftoverPct });
      }
      if (key === 'silver') {
        S.ratings = applyFeedback(S.ratings, feedback);
        for (const f of feedback) for (const id of f.foodIds) S.seen[id] = (S.seen[id] || 0) + 1;
      }

      st.expiredKg.push(r1(expKg)); st.expiredNT.push(Math.round(expNT)); st.incidents.push(incidents);
      st.protein.push(r1(protein)); st.plateKg.push(r1(plateKg)); st.plateNT.push(Math.round(plateNT));
      st.cost.push(Math.round(cost)); st.extraNT.push(Math.round(extra)); st.leftoverPct.push(dishes.length ? r1(pctSum / dishes.length) : 0);
      st.stockKg.push(r1(S.inv.reduce((s, x) => s + x.qtyKg, 0))); st.rescuedKg.push(r1(rescued));

      snap[key] = {
        menu: dishes.map((x) => ({ role: x.role, name: x.name, leftoverPct: x.leftoverPct })),
        protein: r1(protein), expiredKg: r1(expKg), incidents,
        shelf: key === 'silver' ? fifo(S.inv).slice(0, 40).map((x) => ({ foodId: x.foodId, qtyKg: r1(x.qtyKg), daysLeft: x.expiryDay - d })) : undefined,
      };
    }
    snap.arrivals = arrivals[d].map((a) => ({ foodId: a.foodId, qtyKg: a.qtyKg, source: a.source }));
    snapshots.push(snap);
  }

  return {
    params: p, target, days: p.days,
    manual: { daily: strategies.manual.stats, summary: summarize(strategies.manual.stats, target) },
    silver: { daily: strategies.silver.stats, summary: summarize(strategies.silver.stats, target) },
    snapshots,
  };
}

/** CSV export of the daily series for both strategies. */
export function toCSV(result) {
  const keys = ['expiredKg', 'expiredNT', 'incidents', 'protein', 'plateKg', 'plateNT', 'cost', 'extraNT', 'leftoverPct', 'stockKg', 'rescuedKg'];
  const head = ['day', ...keys.map((k) => `manual_${k}`), ...keys.map((k) => `silvermeal_${k}`)];
  const rows = [head.join(',')];
  for (let i = 0; i < result.days; i++) {
    rows.push([i + 1, ...keys.map((k) => result.manual.daily[k][i]), ...keys.map((k) => result.silver.daily[k][i])].join(','));
  }
  return rows.join('\n');
}
