// SilverMeal AI marketing site — bilingual EN / 繁體中文 toggle.
(function () {
  const I18N = {
    en: {
      skip: 'Skip to content',
      'nav.problem': 'Problem', 'nav.solution': 'Solution', 'nav.how': 'How it works', 'nav.preview': 'Preview',
      'cta.app': 'Open the app', 'cta.sim': 'Try the simulator',
      'hero.eyebrow': 'For community meal centers & long-term care kitchens',
      'hero.title': 'Safer food. Stronger seniors. Less waste.',
      'hero.lead': 'SilverMeal AI connects expiry tracking, senior-friendly meal planning and dish-level leftover feedback into one simple loop — on the phones your staff already carry.',
      'hero.c1': 'Software only — no extra hardware', 'hero.c2': 'Works offline', 'hero.c3': 'English / 繁體中文',
      'demo.title': "Today's stock", 'demo.items': '19 items',
      'demo.r': 'Soft tofu · 4 kg', 'demo.rb': 'Today', 'demo.y': 'Minced pork · 5 kg', 'demo.yb': '1 day',
      'demo.y2': 'Sweet potato · 25 kg', 'demo.y2b': '3 days', 'demo.g': 'Eggs · 6 kg', 'demo.gb': '12 days',
      'demo.ai': 'AI menu · Soft & bite-sized', 'demo.dish': 'Braised tofu with spinach (thickened)',
      'demo.protein': 'Protein 22.6 g of 24 g target',
      'prob.eyebrow': 'The problem',
      'prob.title': "Institutional kitchens aren't personal calorie trackers",
      'prob.sub': 'They manage bulk and donated food for dozens of seniors a day, often with few staff and volunteer cooks.',
      'prob.1t': 'Food safety & expiry risk',
      'prob.1p': 'Large purchased and donated deliveries make manual First-In, First-Out tracking fail — and expired food is dangerous for frail seniors.',
      'prob.2t': 'Nutrition & texture gaps',
      'prob.2p': 'Cooking "whatever arrived" (often starchy donations) leads to low-protein meals and sarcopenia risk, and soft-texture needs get overlooked.',
      'prob.3t': 'No dish-level leftover data',
      'prob.3p': 'All food waste is weighed together, so nobody knows which dish went uneaten, what it cost, or what seniors actually like.',
      'sol.eyebrow': 'The solution', 'sol.title': 'One closed loop, three simple modules',
      'loop.1a': 'Quick-Snap', 'loop.1b': 'expiry tracker', 'loop.2a': 'AI Meal', 'loop.2b': 'planner',
      'loop.3a': 'Leftover', 'loop.3b': 'slider', 'loop.e1': 'expiring items', 'loop.e2': 'served dishes',
      'loop.e3': 'ratings & cost', 'loop.c1': 'SilverMeal AI', 'loop.c2': 'data loop',
      'm1.t': 'Quick-Snap Expiration Tracker',
      'm1.p': 'Photograph a food label; OCR reads the expiry date (including 民國 dates) and sorts stock into Red (today), Yellow (within 3 days) and Green (safe).',
      'm1.v': 'Prevents foodborne illness and enforces FIFO without manual logs.',
      'm2.t': 'AI Senior Meal Planner',
      'm2.p': 'Tick the red/yellow items and get a group menu that uses them first, with IDDSI texture guidance (minced, thickened…) and a protein-gap alert with what to add.',
      'm2.v': 'Helps volunteer cooks serve safe, balanced, high-protein meals.',
      'm3.t': 'Leftover & Preference Slider',
      'm3.p': 'After the meal, slide 0% – 75%+ per dish. The app calculates waste cost and updates dish ratings that refine the next menu.',
      'm3.v': "Tracks waste cost and adapts menus to seniors' tastes — no scales needed.",
      'how.eyebrow': 'How it works', 'how.title': 'A daily routine that takes minutes',
      'how.1t': 'Snap on arrival', 'how.1p': 'When deliveries or donations arrive, staff photograph each label. Stock appears on the traffic-light board, soonest first.',
      'how.2t': 'Plan before cooking', 'how.2p': "Pick today's expiring items, the number of seniors and their texture level. The planner suggests dishes, quantities and prep steps.",
      'how.3t': 'Slide after serving', 'how.3p': "Record leftovers per dish with one slider. Costs and ratings update automatically and shape tomorrow's menu.",
      'imp.eyebrow': "Who it's for", 'imp.title': 'Built for real community kitchens',
      'imp.1t': 'Community meal centers · 共餐據點', 'imp.1p': 'Volunteer-run lunches with variable donations. Clear, guided steps for non-professional cooks.',
      'imp.2t': 'Long-term care facilities', 'imp.2p': 'Residents with chewing and swallowing difficulties. Texture levels aligned with the IDDSI framework.',
      'imp.3t': 'Managers & dietitians', 'imp.3p': 'Waste cost, expiry incidents and protein adequacy in one dashboard to support reports and funding.',
      'imp.s1': 'FIFO', 'imp.s1t': 'enforced automatically', 'imp.s2': '1.2 g/kg', 'imp.s2t': 'daily protein target (ESPEN)',
      'imp.s3': '5 levels', 'imp.s3t': 'of IDDSI food texture', 'imp.s4': '0 devices', 'imp.s4t': 'to buy — just a phone',
      'pre.eyebrow': 'See it in action', 'pre.title': 'Try SilverMeal AI right here',
      'pre.sub': 'The live app is preloaded with demo stock. Tap around the phone, or open the simulator to see a month of kitchen operations with and without SilverMeal AI.',
      'ref.eyebrow': 'Evidence base', 'ref.title': 'References',
      'foot.tag': 'AI food-expiry tracking & senior meal planning. Software only.',
      'foot.app': 'App', 'foot.sim': 'Simulator', 'foot.refs': 'References',
      'foot.note': 'Nutrition values are planning estimates and do not replace advice from a dietitian.',
      _toggle: '中文', _toggleLabel: 'Switch to Traditional Chinese',
      _desc: 'AI-powered food expiration tracking and senior meal planning for community meal centers and long-term care facilities. Software only — no extra hardware.',
    },
    zh: {
      skip: '跳至主要內容',
      'nav.problem': '問題', 'nav.solution': '解決方案', 'nav.how': '使用流程', 'nav.preview': '試用',
      'cta.app': '開啟 App', 'cta.sim': '體驗模擬器',
      'hero.eyebrow': '專為社區共餐據點與長照機構廚房設計',
      'hero.title': '吃得安心、長輩更有力、浪費更少。',
      'hero.lead': '《銀膳智庫》把「效期把關、高齡配膳、餐後回饋」串成一個簡單的數據閉環——只要用廚房人員手上的手機就能完成。',
      'hero.c1': '純軟體，免額外硬體', 'hero.c2': '離線也能用', 'hero.c3': 'English / 繁體中文',
      'demo.title': '今日庫存', 'demo.items': '共 19 項',
      'demo.r': '嫩豆腐 · 4 公斤', 'demo.rb': '今日到期', 'demo.y': '豬絞肉 · 5 公斤', 'demo.yb': '剩 1 天',
      'demo.y2': '地瓜 · 25 公斤', 'demo.y2b': '剩 3 天', 'demo.g': '雞蛋 · 6 公斤', 'demo.gb': '剩 12 天',
      'demo.ai': 'AI 菜單 · 軟質一口大小', 'demo.dish': '菠菜燴嫩豆腐（勾芡）',
      'demo.protein': '蛋白質 22.6 克／目標 24 克',
      'prob.eyebrow': '核心問題',
      'prob.title': '機構廚房的需求，不是個人熱量紀錄',
      'prob.sub': '每天要處理大量採購與愛心捐贈食材、供應數十位長輩，且常由少數廚工或志工掌廚。',
      'prob.1t': '食安與效期管理風險',
      'prob.1p': '大量進貨與捐贈食材讓人工盤點難以落實「先進先出」，誤用過期食材將對免疫力較弱的長輩造成集體食安風險。',
      'prob.2t': '營養失衡與忽略質地',
      'prob.2p': '「有什麼煮什麼」（例如大量捐贈的地瓜、白米）容易煮出高澱粉、低蛋白的餐點，增加肌少症風險，也常忽略牙口退化長輩的軟化需求。',
      'prob.3t': '缺乏單品項廚餘追蹤',
      'prob.3p': '所有廚餘混在一起秤重，無從得知哪一道菜被倒掉、浪費多少錢，以及長輩真正的口味偏好。',
      'sol.eyebrow': '解決方案', 'sol.title': '一個數據閉環，三個簡單功能',
      'loop.1a': '快拍入庫', 'loop.1b': '效期紅綠燈', 'loop.2a': 'AI 高齡', 'loop.2b': '配膳',
      'loop.3a': '廚餘', 'loop.3b': '喜好度滑桿', 'loop.e1': '即期食材', 'loop.e2': '供餐菜色',
      'loop.e3': '評分與成本', 'loop.c1': '銀膳智庫', 'loop.c2': '數據閉環',
      'm1.t': '快拍入庫與效期紅綠燈',
      'm1.p': '用手機拍攝食品標籤，OCR 自動辨識有效日期（支援民國年），並分為紅燈（今日到期）、黃燈（3 天內）、綠燈（安全）。',
      'm1.v': '取代人工手寫標籤，落實先進先出、預防食安事件。',
      'm2.t': 'AI 即期品高齡配膳',
      'm2.p': '勾選紅／黃燈即期食材，自動產出優先消化即期品的團膳菜單，附上 IDDSI 質地軟化建議（切細碎、勾芡…）與蛋白質缺口提醒。',
      'm2.v': '幫助志工煮出安全、均衡、高蛋白的餐點。',
      'm3.t': '餐後廚餘與喜好度滑桿',
      'm3.p': '供餐後針對每道菜滑動選擇剩餘比例（0%～75% 以上），系統自動換算浪費金額，並更新菜色喜好度，作為下次菜單的依據。',
      'm3.v': '免秤重即可追蹤浪費成本，讓菜單越來越合長輩口味。',
      'how.eyebrow': '使用流程', 'how.title': '每天只要幾分鐘',
      'how.1t': '進貨時快拍', 'how.1p': '食材或捐贈品送達時拍下標籤，庫存立即依到期日排列在紅綠燈看板上。',
      'how.2t': '煮之前配膳', 'how.2p': '勾選今日即期食材、用餐人數與質地等級，系統建議菜色、份量與備料步驟。',
      'how.3t': '餐後滑一滑', 'how.3p': '每道菜一個滑桿記錄剩餘量，成本與評分自動更新，讓明天的菜單更好。',
      'imp.eyebrow': '適用對象', 'imp.title': '為真實的社區廚房打造',
      'imp.1t': '社區共餐據點', 'imp.1p': '志工掌廚、捐贈食材不固定。清楚的引導步驟，非專業廚師也能上手。',
      'imp.2t': '長期照顧機構', 'imp.2p': '住民有咀嚼與吞嚥困難，質地等級依循國際 IDDSI 架構。',
      'imp.3t': '管理者與營養師', 'imp.3p': '浪費成本、過期事件與蛋白質達成率集中呈現，方便撰寫報告與申請補助。',
      'imp.s1': '先進先出', 'imp.s1t': '自動落實', 'imp.s2': '1.2 g/kg', 'imp.s2t': '每日蛋白質目標（ESPEN）',
      'imp.s3': '5 級', 'imp.s3t': 'IDDSI 食物質地', 'imp.s4': '0 台', 'imp.s4t': '設備需購買，手機即可',
      'pre.eyebrow': '實際體驗', 'pre.title': '立即試用銀膳智庫',
      'pre.sub': 'App 已預載示範庫存，可直接在手機畫面中操作；或開啟模擬器，比較使用前後一個月的廚房營運差異。',
      'ref.eyebrow': '實證基礎', 'ref.title': '參考文獻',
      'foot.tag': 'AI 效期監控與高齡配膳系統，純軟體免硬體。',
      'foot.app': 'App', 'foot.sim': '模擬器', 'foot.refs': '參考文獻',
      'foot.note': '營養數值為配膳估算，不能取代營養師的專業建議。',
      _toggle: 'EN', _toggleLabel: 'Switch to English',
      _desc: '社區共餐與長照機構之 AI 效期監控與高齡配膳系統，純軟體、免額外硬體。',
    },
  };

  const KEY = 'silvermeal.lang';
  const store = {
    get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* storage unavailable */ } },
  };

  function apply(lang) {
    const dict = I18N[lang] || I18N.en;
    document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const v = dict[el.getAttribute('data-i18n')];
      if (v != null) el.textContent = v;
    });
    const btn = document.getElementById('langBtn');
    if (btn) { btn.textContent = dict._toggle; btn.setAttribute('aria-label', dict._toggleLabel); }
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', dict._desc);
    document.title = lang === 'zh' ? '銀膳智庫 SilverMeal AI' : 'SilverMeal AI';
  }

  let lang = store.get() || ((navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en');
  apply(lang);
  document.getElementById('langBtn')?.addEventListener('click', () => {
    lang = lang === 'zh' ? 'en' : 'zh';
    store.set(lang);
    apply(lang);
  });
})();
