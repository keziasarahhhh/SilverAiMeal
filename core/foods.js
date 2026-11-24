// Ingredient reference data (approximate values per 100 g edible portion,
// Taiwan wholesale prices in NT$/kg). For planning only, not clinical use.
// category: protein | starch | veg | fruit | dairy | other
// hard: 1 soft, 2 medium, 3 hard/fibrous (drives texture-modification advice)

export const FOODS = [
  // --- protein ---
  { id: 'tofu',        en: 'Soft tofu',         zh: '嫩豆腐',   cat: 'protein', protein: 5.0,  kcal: 51,  price: 60,  shelf: 5,   hard: 1 },
  { id: 'firm_tofu',   en: 'Firm tofu',         zh: '板豆腐',   cat: 'protein', protein: 8.5,  kcal: 88,  price: 70,  shelf: 5,   hard: 2 },
  { id: 'egg',         en: 'Eggs',              zh: '雞蛋',     cat: 'protein', protein: 12.5, kcal: 140, price: 110, shelf: 21,  hard: 1 },
  { id: 'chicken',     en: 'Chicken thigh',     zh: '雞腿肉',   cat: 'protein', protein: 18.0, kcal: 160, price: 220, shelf: 3,   hard: 2 },
  { id: 'chicken_br',  en: 'Chicken breast',    zh: '雞胸肉',   cat: 'protein', protein: 22.4, kcal: 117, price: 200, shelf: 3,   hard: 3 },
  { id: 'pork_mince',  en: 'Minced pork',       zh: '豬絞肉',   cat: 'protein', protein: 17.0, kcal: 230, price: 230, shelf: 2,   hard: 1 },
  { id: 'pork_loin',   en: 'Pork loin',         zh: '豬里肌',   cat: 'protein', protein: 21.0, kcal: 170, price: 260, shelf: 3,   hard: 3 },
  { id: 'fish',        en: 'Tilapia fillet',    zh: '鯛魚片',   cat: 'protein', protein: 19.0, kcal: 110, price: 240, shelf: 2,   hard: 1 },
  { id: 'salmon',      en: 'Salmon',            zh: '鮭魚',     cat: 'protein', protein: 20.0, kcal: 200, price: 600, shelf: 2,   hard: 1 },
  { id: 'milkfish',    en: 'Milkfish belly',    zh: '虱目魚肚', cat: 'protein', protein: 15.0, kcal: 260, price: 280, shelf: 2,   hard: 1 },
  { id: 'soy_milk',    en: 'Soy milk',          zh: '豆漿',     cat: 'protein', protein: 3.6,  kcal: 54,  price: 50,  shelf: 5,   hard: 1 },
  { id: 'edamame',     en: 'Edamame',           zh: '毛豆',     cat: 'protein', protein: 13.0, kcal: 125, price: 120, shelf: 90,  hard: 2 },
  { id: 'canned_tuna', en: 'Canned tuna',       zh: '鮪魚罐頭', cat: 'protein', protein: 24.0, kcal: 130, price: 350, shelf: 900, hard: 1 },
  // --- dairy ---
  { id: 'milk',        en: 'Milk',              zh: '鮮奶',     cat: 'dairy',   protein: 3.2,  kcal: 63,  price: 95,  shelf: 7,   hard: 1 },
  { id: 'yogurt',      en: 'Plain yogurt',      zh: '無糖優格', cat: 'dairy',   protein: 4.0,  kcal: 70,  price: 150, shelf: 14,  hard: 1 },
  { id: 'cheese',      en: 'Cheese slices',     zh: '起司片',   cat: 'dairy',   protein: 18.0, kcal: 300, price: 400, shelf: 60,  hard: 1 },
  // --- starch ---
  { id: 'rice',        en: 'White rice',        zh: '白米',     cat: 'starch',  protein: 7.0,  kcal: 350, price: 45,  shelf: 365, hard: 2 },
  { id: 'brown_rice',  en: 'Brown rice',        zh: '糙米',     cat: 'starch',  protein: 7.9,  kcal: 355, price: 70,  shelf: 180, hard: 3 },
  { id: 'sweet_potato',en: 'Sweet potato',      zh: '地瓜',     cat: 'starch',  protein: 1.3,  kcal: 115, price: 40,  shelf: 21,  hard: 2 },
  { id: 'pumpkin',     en: 'Pumpkin',           zh: '南瓜',     cat: 'starch',  protein: 1.6,  kcal: 70,  price: 35,  shelf: 30,  hard: 2 },
  { id: 'potato',      en: 'Potato',            zh: '馬鈴薯',   cat: 'starch',  protein: 2.0,  kcal: 77,  price: 40,  shelf: 30,  hard: 2 },
  { id: 'noodles',     en: 'Noodles',           zh: '麵條',     cat: 'starch',  protein: 9.0,  kcal: 280, price: 60,  shelf: 4,   hard: 1 },
  { id: 'bread',       en: 'Bread',             zh: '吐司',     cat: 'starch',  protein: 8.0,  kcal: 270, price: 90,  shelf: 4,   hard: 1 },
  { id: 'taro',        en: 'Taro',              zh: '芋頭',     cat: 'starch',  protein: 2.5,  kcal: 128, price: 80,  shelf: 21,  hard: 2 },
  { id: 'oats',        en: 'Oats',              zh: '燕麥片',   cat: 'starch',  protein: 11.0, kcal: 390, price: 120, shelf: 300, hard: 1 },
  // --- vegetables ---
  { id: 'cabbage',     en: 'Cabbage',           zh: '高麗菜',   cat: 'veg',     protein: 1.3,  kcal: 23,  price: 35,  shelf: 10,  hard: 2 },
  { id: 'napa',        en: 'Napa cabbage',      zh: '大白菜',   cat: 'veg',     protein: 1.2,  kcal: 16,  price: 30,  shelf: 10,  hard: 1 },
  { id: 'spinach',     en: 'Spinach',           zh: '菠菜',     cat: 'veg',     protein: 2.2,  kcal: 22,  price: 80,  shelf: 3,   hard: 2 },
  { id: 'carrot',      en: 'Carrot',            zh: '紅蘿蔔',   cat: 'veg',     protein: 0.9,  kcal: 39,  price: 35,  shelf: 21,  hard: 3 },
  { id: 'daikon',      en: 'Daikon radish',     zh: '白蘿蔔',   cat: 'veg',     protein: 0.6,  kcal: 18,  price: 25,  shelf: 14,  hard: 2 },
  { id: 'tomato',      en: 'Tomato',            zh: '番茄',     cat: 'veg',     protein: 0.9,  kcal: 18,  price: 60,  shelf: 7,   hard: 1 },
  { id: 'broccoli',    en: 'Broccoli',          zh: '青花菜',   cat: 'veg',     protein: 3.7,  kcal: 28,  price: 90,  shelf: 5,   hard: 2 },
  { id: 'eggplant',    en: 'Eggplant',          zh: '茄子',     cat: 'veg',     protein: 1.1,  kcal: 24,  price: 50,  shelf: 5,   hard: 1 },
  { id: 'loofah',      en: 'Loofah',            zh: '絲瓜',     cat: 'veg',     protein: 1.0,  kcal: 18,  price: 55,  shelf: 4,   hard: 1 },
  { id: 'winter_melon',en: 'Winter melon',      zh: '冬瓜',     cat: 'veg',     protein: 0.4,  kcal: 13,  price: 25,  shelf: 14,  hard: 1 },
  { id: 'mushroom',    en: 'Shiitake mushroom', zh: '香菇',     cat: 'veg',     protein: 3.0,  kcal: 39,  price: 180, shelf: 6,   hard: 2 },
  { id: 'zucchini',    en: 'Zucchini',          zh: '櫛瓜',     cat: 'veg',     protein: 1.2,  kcal: 17,  price: 70,  shelf: 7,   hard: 1 },
  // --- fruit ---
  { id: 'banana',      en: 'Banana',            zh: '香蕉',     cat: 'fruit',   protein: 1.1,  kcal: 89,  price: 45,  shelf: 5,   hard: 1 },
  { id: 'papaya',      en: 'Papaya',            zh: '木瓜',     cat: 'fruit',   protein: 0.5,  kcal: 43,  price: 50,  shelf: 5,   hard: 1 },
  { id: 'apple',       en: 'Apple',             zh: '蘋果',     cat: 'fruit',   protein: 0.3,  kcal: 52,  price: 90,  shelf: 21,  hard: 3 },
  { id: 'orange',      en: 'Orange',            zh: '柳橙',     cat: 'fruit',   protein: 0.9,  kcal: 47,  price: 50,  shelf: 14,  hard: 2 },
];

export const FOOD_BY_ID = Object.fromEntries(FOODS.map((f) => [f.id, f]));

export function foodName(id, lang = 'en') {
  const f = FOOD_BY_ID[id];
  return f ? f[lang] || f.en : id;
}

/** Best-effort match of a free-text product name (from a label) to a food id. */
export function matchFood(text) {
  const t = String(text || '').toLowerCase();
  let best = null; let bestLen = 0;
  for (const f of FOODS) {
    for (const name of [f.zh, f.en.toLowerCase(), f.id.replace('_', ' ')]) {
      if (name && t.includes(name.toLowerCase()) && name.length > bestLen) { best = f.id; bestLen = name.length; }
    }
  }
  // looser single-word hints
  const hints = { 豆腐: 'tofu', 蛋: 'egg', 雞: 'chicken', 豬: 'pork_mince', 魚: 'fish', 奶: 'milk', 米: 'rice', 麵: 'noodles', tofu: 'tofu', egg: 'egg', chicken: 'chicken', pork: 'pork_mince', fish: 'fish', milk: 'milk', rice: 'rice', noodle: 'noodles' };
  if (!best) for (const [k, v] of Object.entries(hints)) if (t.includes(k)) { best = v; break; }
  return best;
}

/**
 * IDDSI food texture levels used in Taiwan's senior texture handbook.
 * https://iddsi.org/framework
 */
export const TEXTURES = [
  { id: 'regular', iddsi: 7, en: 'Regular', zh: '一般' },
  { id: 'easy',    iddsi: '7EC', en: 'Easy to chew', zh: '容易咀嚼' },
  { id: 'soft',    iddsi: 6, en: 'Soft & bite-sized', zh: '軟質一口大小' },
  { id: 'minced',  iddsi: 5, en: 'Minced & moist', zh: '細碎濕潤' },
  { id: 'pureed',  iddsi: 4, en: 'Pureed', zh: '糊狀' },
];

/** Category-specific preparation advice per texture level (en, zh). */
export const TEXTURE_PREP = {
  protein: {
    regular: ['Cook until tender.', '烹煮至軟嫩。'],
    easy:    ['Slice thinly against the grain; braise or steam until fork-tender.', '逆紋切薄片，燉煮或蒸至筷子可輕易分開。'],
    soft:    ['Cut into 1.5 cm pieces; steam/braise; pieces should break with a spoon.', '切成1.5公分小塊，蒸或燉至湯匙可壓開。'],
    minced:  ['Mince to ≤4 mm, bind with egg or starch and keep moist with gravy.', '剁碎至4毫米以下，加蛋或太白粉黏合，淋醬汁保持濕潤。'],
    pureed:  ['Blend with broth until smooth; thicken so it holds shape on a spoon.', '加高湯打成泥，以增稠劑調整至湯匙上可維持形狀。'],
  },
  veg: {
    regular: ['Stir-fry or blanch.', '清炒或汆燙。'],
    easy:    ['Remove tough stems/skins; cook longer until soft.', '去除粗梗與外皮，延長烹煮至軟爛。'],
    soft:    ['Cut 1.5 cm; braise until soft; thicken sauce (勾芡) to aid swallowing.', '切1.5公分，燉軟後勾芡幫助吞嚥。'],
    minced:  ['Finely chop after cooking; mix with thickened sauce.', '煮軟後切細碎，拌入勾芡醬汁。'],
    pureed:  ['Blend cooked vegetables with stock; strain fibres.', '煮熟後加高湯打泥並過濾粗纖維。'],
  },
  starch: {
    regular: ['Cook as usual.', '一般烹煮。'],
    easy:    ['Cook rice with extra water (soft rice 軟飯).', '多加水煮成軟飯。'],
    soft:    ['Serve as soft rice or thick congee; steam root vegetables until mashable.', '供應軟飯或稠粥；根莖類蒸至可壓碎。'],
    minced:  ['Serve as congee; mash root vegetables with milk/broth.', '供應粥品；根莖類加奶或高湯壓泥。'],
    pureed:  ['Blend congee smooth; avoid separated liquid.', '粥打成均勻糊狀，避免湯水分離。'],
  },
  fruit: {
    regular: ['Serve fresh pieces.', '切塊供應。'],
    easy:    ['Peel and cut thin slices; choose ripe fruit.', '去皮切薄片，選熟軟水果。'],
    soft:    ['Peel; cut 1.5 cm; prefer banana, papaya.', '去皮切1.5公分，優先香蕉、木瓜。'],
    minced:  ['Mash ripe fruit; drain excess juice.', '熟果壓碎並瀝除多餘汁液。'],
    pureed:  ['Blend into smooth puree.', '打成細緻果泥。'],
  },
};
TEXTURE_PREP.dairy = TEXTURE_PREP.protein;
TEXTURE_PREP.other = TEXTURE_PREP.veg;
