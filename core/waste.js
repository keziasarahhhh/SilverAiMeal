// Dish-level leftover tracking and preference learning.

/** Slider stops from the proposal: 0%, 25%, 50%, 75%+ (75%+ counted as 85%). */
export const LEFTOVER_STOPS = [0, 25, 50, 75];
export const leftoverFraction = (pct) => (pct >= 75 ? 0.85 : pct / 100);

/** Waste cost of one dish given cost/serving, servings and leftover slider %. */
export function dishWaste({ costPerServing, servings, leftoverPct, gramsPerServing = 0 }) {
  const f = leftoverFraction(leftoverPct);
  return { costNT: +(costPerServing * servings * f).toFixed(0), kg: +((gramsPerServing * servings * f) / 1000).toFixed(2), fraction: f };
}

/** Preference score = 1 − leftover fraction, smoothed with an exponential moving average. */
export function updateRating(prev, leftoverPct, alpha = 0.35) {
  const obs = 1 - leftoverFraction(leftoverPct);
  return prev == null ? +obs.toFixed(3) : +((1 - alpha) * prev + alpha * obs).toFixed(3);
}

/**
 * Apply one meal's feedback to the ratings store.
 * feedback: [{ dishKey, foodIds:[...], leftoverPct }]
 */
export function applyFeedback(ratings = {}, feedback = []) {
  const r = { foods: { ...(ratings.foods || {}) }, dishes: { ...(ratings.dishes || {}) } };
  for (const f of feedback) {
    r.dishes[f.dishKey] = updateRating(r.dishes[f.dishKey], f.leftoverPct);
    for (const id of f.foodIds || []) r.foods[id] = updateRating(r.foods[id], f.leftoverPct, 0.2);
  }
  return r;
}

export function stars(score) {
  if (score == null) return null;
  return Math.max(1, Math.min(5, Math.round(score * 5 * 10) / 10));
}
