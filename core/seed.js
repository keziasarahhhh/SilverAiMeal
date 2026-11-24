// Demo inventory so the app is useful on first open. Dates are relative to today.
import { isoDate, addDays } from './expiry.js';

const ROWS = [
  // foodId, qtyKg, days to expiry, received days ago, source
  ['tofu', 4, 0, 3, 'purchase'],
  ['spinach', 3, 0, 2, 'donation'],
  ['pork_mince', 5, 1, 1, 'purchase'],
  ['milk', 6, 2, 4, 'donation'],
  ['banana', 4, 1, 3, 'donation'],
  ['sweet_potato', 25, 3, 10, 'donation'],
  ['fish', 4, 2, 1, 'purchase'],
  ['noodles', 3, 2, 2, 'donation'],
  ['cabbage', 8, 6, 2, 'purchase'],
  ['carrot', 5, 14, 5, 'purchase'],
  ['egg', 6, 12, 4, 'purchase'],
  ['rice', 30, 200, 20, 'donation'],
  ['pumpkin', 10, 20, 6, 'donation'],
  ['mushroom', 2, 4, 2, 'purchase'],
  ['napa', 6, 7, 1, 'purchase'],
  ['yogurt', 4, 9, 2, 'purchase'],
  ['canned_tuna', 3, 400, 30, 'donation'],
  ['papaya', 3, 3, 1, 'donation'],
  ['bread', 2, -1, 4, 'donation'],
];

export function seedInventory(today = new Date()) {
  return ROWS.map(([foodId, qtyKg, exp, rec, source], i) => ({
    id: `seed-${i + 1}`,
    foodId, qtyKg, source,
    expiry: isoDate(addDays(today, exp)),
    received: isoDate(addDays(today, -rec)),
  }));
}
