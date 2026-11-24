// Optional generative-AI layer using the official Anthropic TypeScript SDK in the browser.
// The rule-based plan (core/planner.js) is sent as grounding; Claude returns
// richer group recipes as structured JSON. The API key is entered by the user,
// kept only in this browser's localStorage, and sent only to api.anthropic.com.
// For production, route this through your own backend instead of a browser key.

const SDK_URL = 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@1.5.0/+esm';
export const CLAUDE_MODEL = 'claude-opus-5-5';

const RECIPE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'dishes', 'proteinAdvice'],
  properties: {
    summary: { type: 'string' },
    proteinAdvice: { type: 'string' },
    dishes: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['role', 'name', 'ingredients', 'steps', 'textureNotes'],
        properties: {
          role: { type: 'string' },
          name: { type: 'string' },
          ingredients: { type: 'array', items: { type: 'string' } },
          steps: { type: 'array', items: { type: 'string' } },
          textureNotes: { type: 'string' },
        },
      },
    },
  },
};

const SYSTEM = `You are a dietitian assistant for community meal centers and long-term care kitchens in Taiwan.
Volunteer cooks with no nutrition training will follow your recipes for a whole group of older adults.
Rules: use the provided expiring ingredients first (FIFO); keep the quantities given in the draft plan;
apply the requested IDDSI texture level to every dish (cut size, softening, thickening/勾芡);
avoid choking hazards (sticky rice cakes, whole nuts, dry crumbly food) for texture-modified diets;
keep sodium moderate; write short numbered steps a volunteer can follow; and if protein is below target,
explain concretely how to close the gap with soft, affordable protein.`;

/**
 * @param {object} plan  result of planMenu()
 * @param {object} ctx   { apiKey, lang: 'en'|'zh', textureLabel, inventoryNames }
 */
export async function enhanceWithClaude(plan, { apiKey, lang = 'en', textureLabel, signal } = {}) {
  if (!apiKey) throw new Error('missing_key');
  const { default: Anthropic } = await import(SDK_URL);
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const draft = plan.dishes.map((d) => ({
    role: d.role, name: lang === 'zh' ? d.name.zh : d.name.en,
    ingredients: d.ingredients.map((l) => ({ food: l.foodId, gramsPerServing: l.grams, totalKg: l.needKg, expiringSoon: l.urgent })),
  }));
  const user = `Language for all text: ${lang === 'zh' ? 'Traditional Chinese (繁體中文, Taiwan)' : 'English'}.
Servings: ${plan.servings}. Texture level: ${textureLabel} (IDDSI).
Protein per serving in draft: ${plan.totals.proteinPerServing} g; target ${plan.proteinTarget} g.
Draft plan (keep dish roles and quantities, improve names, steps and texture handling):
${JSON.stringify(draft)}`;

  const response = await client.beta.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: RECIPE_SCHEMA } },
    system: SYSTEM,
    messages: [{ role: 'user', content: user }],
  }, { signal });

  if (response.stop_reason === 'refusal') throw new Error('refused');
  if (response.stop_reason === 'max_tokens') throw new Error('truncated');
  const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  return JSON.parse(text);
}
