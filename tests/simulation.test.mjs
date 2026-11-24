import test from 'node:test';
import assert from 'node:assert/strict';
import { runSimulation, toCSV, mulberry32, DEFAULT_PARAMS } from '../core/simulation.js';

test('mulberry32 is deterministic and in [0,1)', () => {
  const a = mulberry32(7), b = mulberry32(7);
  for (let i = 0; i < 100; i++) { const x = a(); assert.equal(x, b()); assert.ok(x >= 0 && x < 1); }
});

test('same seed gives identical results; different seed differs', () => {
  const r1 = runSimulation({ seed: 123, days: 30 });
  const r2 = runSimulation({ seed: 123, days: 30 });
  assert.deepEqual(r1.manual.summary, r2.manual.summary);
  assert.deepEqual(r1.silver.daily, r2.silver.daily);
  const r3 = runSimulation({ seed: 124, days: 30 });
  assert.notDeepEqual(r1.manual.daily.expiredKg, r3.manual.daily.expiredKg);
});

test('series lengths match the number of days', () => {
  const r = runSimulation({ days: 17, seniors: 25 });
  for (const s of [r.manual, r.silver]) for (const arr of Object.values(s.daily)) assert.equal(arr.length, 17);
  assert.equal(r.snapshots.length, 17);
  assert.equal(toCSV(r).split('\n').length, 18);
});

test('SilverMeal beats Manual on expired waste, incidents and protein (default params)', () => {
  const r = runSimulation(DEFAULT_PARAMS);
  const m = r.manual.summary, s = r.silver.summary;
  assert.ok(s.expiredKg < m.expiredKg, `expired ${s.expiredKg} < ${m.expiredKg}`);
  assert.equal(s.incidents, 0);
  assert.ok(s.avgProtein > m.avgProtein);
  assert.ok(s.avgProtein >= r.target - 0.5);
  assert.ok(s.avgLeftoverPct < m.avgLeftoverPct);
});

test('SilverMeal wins across several seeds', () => {
  for (const seed of [1, 2, 3, 5, 8]) {
    const r = runSimulation({ seed });
    assert.ok(r.silver.summary.expiredKg < r.manual.summary.expiredKg, `seed ${seed}`);
    assert.ok(r.silver.summary.totalWasteNT < r.manual.summary.totalWasteNT, `seed ${seed}`);
  }
});

test('default run is fast', () => {
  const t = performance.now();
  runSimulation({ days: 60, seniors: 40 });
  assert.ok(performance.now() - t < 1000);
});
