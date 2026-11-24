import { test } from 'node:test';
import assert from 'node:assert/strict';
import { expiryStatus, parseExpiryFromText, sortFIFO, daysUntil } from '../core/expiry.js';
import { planMenu, consumePlan, proteinTargetPerMeal } from '../core/planner.js';
import { dishWaste, applyFeedback, leftoverFraction } from '../core/waste.js';
import { seedInventory } from '../core/seed.js';
import { matchFood } from '../core/foods.js';

const TODAY = new Date(2026, 10, 24); // 2026-11-24

test('traffic light classification', () => {
  assert.equal(expiryStatus('2026-11-23', TODAY), 'expired');
  assert.equal(expiryStatus('2026-11-24', TODAY), 'red');
  assert.equal(expiryStatus('2026-11-25', TODAY), 'yellow');
  assert.equal(expiryStatus('2026-11-27', TODAY), 'yellow');
  assert.equal(expiryStatus('2026-11-28', TODAY), 'green');
  assert.equal(daysUntil('2026-12-01', TODAY), 7);
});

test('FIFO sorts by expiry then received date', () => {
  const s = sortFIFO([{ id: 'a', expiry: '2026-12-01', received: '2026-11-01' }, { id: 'b', expiry: '2026-11-25' }, { id: 'c', expiry: '2026-12-01', received: '2026-10-01' }]);
  assert.deepEqual(s.map((x) => x.id), ['b', 'c', 'a']);
});

test('OCR date parsing handles Taiwan label formats', () => {
  const cases = [
    ['有效日期：115.11.26 製造日期:115.05.26', '2026-11-26'],
    ['製造日期 115/05/26 有效日期 115/11/26', '2026-11-26'],
    ['MFG 2026/05/01 EXP 2027/05/01', '2027-05-01'],
    ['製造日期 2026年10月01日 保存期限 12個月', '2027-10-01'],
    ['民國115年12月3日 有效', '2026-12-03'],
    ['BEST BEFORE 25 NOV 2026', '2026-11-25'],
    ['Exp: 26/12/2026', '2026-12-26'],
    ['有效日期 ２０２６．１２．０５', '2026-12-05'],
    ['EXP20261130 LOT A12', '2026-11-30'],
  ];
  for (const [text, want] of cases) assert.equal(parseExpiryFromText(text).expiry, want, text);
  assert.equal(parseExpiryFromText('no date here').expiry, null);
});

test('food matching from label text', () => {
  assert.equal(matchFood('嫩豆腐 Soft Tofu 1kg'), 'tofu');
  assert.equal(matchFood('鮮奶 936ml'), 'milk');
  assert.equal(matchFood('Canned tuna in water'), 'canned_tuna');
});

test('planner prioritises selected expiring items and computes protein', () => {
  const inv = seedInventory(TODAY);
  const tofu = inv.find((x) => x.foodId === 'tofu');
  const plan = planMenu({ inventory: inv, selectedIds: [tofu.id], servings: 30, texture: 'soft', today: TODAY });
  assert.ok(plan.dishes.length >= 4);
  assert.ok(plan.lines.some((l) => l.itemId === tofu.id), 'selected item is used');
  assert.ok(!plan.lines.some((l) => l.foodId === 'bread' && l.itemId), 'expired stock is never used');
  assert.equal(plan.proteinTarget, proteinTargetPerMeal());
  const sum = plan.dishes.reduce((s, d) => s + d.proteinG, 0);
  assert.ok(Math.abs(sum - plan.totals.proteinPerServing) < 0.2);
  for (const d of plan.dishes) assert.ok(d.prep.length > 0 && d.name.zh && d.name.en);
});

test('planner flags a protein gap with boost options', () => {
  const inv = [
    { id: '1', foodId: 'sweet_potato', qtyKg: 30, expiry: '2026-11-25' },
    { id: '2', foodId: 'cabbage', qtyKg: 10, expiry: '2026-11-30' },
    { id: '3', foodId: 'rice', qtyKg: 30, expiry: '2027-06-01' },
  ];
  const plan = planMenu({ inventory: inv, selectedIds: ['1'], servings: 20, texture: 'minced', today: TODAY });
  assert.ok(plan.warnings.some((w) => w.code === 'protein_gap' || w.code === 'shortage'));
  assert.ok(plan.dishes.some((d) => d.key.startsWith('staple:congee')), 'minced texture → congee');
});

test('consumePlan deducts stock', () => {
  const inv = seedInventory(TODAY);
  const plan = planMenu({ inventory: inv, servings: 10, today: TODAY });
  const after = consumePlan(inv, plan);
  const before = inv.reduce((s, x) => s + x.qtyKg, 0);
  const now = after.reduce((s, x) => s + x.qtyKg, 0);
  assert.ok(now < before);
});

test('leftover waste cost and preference learning', () => {
  assert.equal(leftoverFraction(75), 0.85);
  assert.equal(dishWaste({ costPerServing: 20, servings: 30, leftoverPct: 50 }).costNT, 300);
  let r = applyFeedback({}, [{ dishKey: 'main:x', foodIds: ['tofu'], leftoverPct: 0 }]);
  assert.equal(r.dishes['main:x'], 1);
  r = applyFeedback(r, [{ dishKey: 'main:x', foodIds: ['tofu'], leftoverPct: 75 }]);
  assert.ok(r.dishes['main:x'] < 1 && r.dishes['main:x'] > 0.15);
});
