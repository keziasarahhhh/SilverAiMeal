# SilverMeal AI · 銀膳智庫

AI-powered food expiration tracking and senior group-meal planning for **community meal centers (共餐據點)** and **long-term care facilities**. It's software only, with no extra hardware: a website, an installable mobile web app (PWA), and a simulator.

## Try it live

**▶ [Open the simulator](https://keziasarahhhh.github.io/SilverAiMeal/simulator/)** · **[Open the app](https://keziasarahhhh.github.io/SilverAiMeal/app/)** · **[Visit the website](https://keziasarahhhh.github.io/SilverAiMeal/)**

| Part | Live link | Code | What it is |
|---|---|---|---|
| Website | [keziasarahhhh.github.io/SilverAiMeal](https://keziasarahhhh.github.io/SilverAiMeal/) | [`index.html`](index.html) | Bilingual landing page explaining the problem, the closed loop and the impact |
| App | […/SilverAiMeal/app/](https://keziasarahhhh.github.io/SilverAiMeal/app/) | [`app/`](app/) | The working mobile app (PWA, works offline, installable to the home screen) |
| Simulator | […/SilverAiMeal/simulator/](https://keziasarahhhh.github.io/SilverAiMeal/simulator/) | [`simulator/`](simulator/) | Kitchen simulation (paper logs vs SilverMeal AI) + phone/tablet preview of the app |

The app opens with a demo kitchen already stocked. On a phone, open the app link and choose **Add to Home Screen** to install it.

## The closed loop

1. **Quick-Snap Expiration Tracker.** Photograph a food label. OCR (Tesseract.js, English + Traditional Chinese) reads the expiry date and the item is sorted into **Red (today) / Yellow (≤3 days) / Green (safe)**, with expired items flagged for discard. Stock is listed first-in, first-out. The date parser understands Taiwan label formats: ROC years (`115.11.26` = 2026-11-26), `有效日期`/`製造日期` keywords, manufacture date + `保存期限 12個月`, full-width digits, `EXP`/`BEST BEFORE`, and `25 NOV 2026`.
2. **AI Senior Meal Planner.** Tick the red/yellow items and the planner builds a group menu (main, vegetable, staple, soup, fruit/dairy) that uses expiring stock first. It scales quantities to the number of servings, applies **IDDSI texture levels** (regular → pureed: cut size, softening, thickening/勾芡), checks protein against the ESPEN target (1.2 g/kg/day), suggests the cheapest soft protein boosts, and flags starch-heavy menus and stock shortages. Optionally, **Claude** (`claude-opus-5-5`, via the official Anthropic SDK) rewrites the plan into step-by-step recipes for volunteer cooks.
3. **Leftover & Preference Slider.** After the meal, staff slide 0% / 25% / 50% / 75%+ per dish. The app calculates waste cost in NT$ and updates dish and ingredient preference scores (an exponential moving average), and those scores steer the next plan.

Reports show expiring items rescued, expired food discarded, plate-waste cost by dish, average protein, and a CSV export.

## Run locally

No build step and no dependencies. Serve the folder with any static server:

```bash
npm start            # = python3 -m http.server 8080
# open http://localhost:8080/          (website)
#      http://localhost:8080/app/      (app)
#      http://localhost:8080/simulator/
npm test             # unit tests for the core logic (Node 18+)
```

To use it on a phone, deploy to **GitHub Pages** (Settings → Pages → deploy from branch, root folder). Then open `/app/` on the phone and choose "Add to Home Screen". The camera and OCR need HTTPS, which GitHub Pages provides.

## Project structure

```
core/         shared, framework-free logic (used by app, simulator and tests)
  expiry.js     traffic light, FIFO, OCR date extraction
  foods.js      ingredient data (protein, kcal, NT$/kg, shelf life), IDDSI texture prep
  planner.js    rule-based menu engine (FIFO priority, portions, protein gap, shopping)
  waste.js      leftover cost & preference learning
  claude.js     optional Claude recipe rewrite (structured JSON output)
  simulation.js kitchen simulation engine
app/          PWA (index.html, app.js, app.css, i18n.js, sw.js, manifest)
simulator/    simulation UI and device preview
assets/       website styles/scripts
tests/        node:test unit tests
```

## Notes

- **Data stays on the device.** Stock, meals and ratings are saved in the browser's localStorage. Settings has "Reset demo data" to reload the sample kitchen.
- **Claude API key.** It's optional and is entered in Settings. The key is kept only in that browser and sent only to `api.anthropic.com`. For a shared deployment, put the call behind a small backend instead of using a browser key.
- **Nutrition values** are approximate reference figures for planning, not clinical advice. Have a dietitian review the menus for residents with dysphagia.

## References

- Cichero, J. A. et al. (2017). Development of international terminology and definitions for texture-modified foods and thickened fluids used in dysphagia management: The IDDSI framework. *Dysphagia, 32*(2), 293–314.
- FAO (2019). *The State of Food and Agriculture 2019: Moving forward on food loss and waste reduction.*
- Health Promotion Administration, MOHW Taiwan (2019). 高齡營養飲食質地衛教手冊.
- Volkert, D. et al. (2019). ESPEN guideline on clinical nutrition and hydration in geriatrics. *Clinical Nutrition, 38*(1), 10–47.
