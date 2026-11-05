# Mise — meal calculator

**Know your plate. Down to the gram.**

Mise is a static, dependency-free meal calculator. Pick the exact *type* of
every ingredient (skinless vs. skin-on chicken breast, extra-virgin vs. light
olive oil, raw vs. boiled spinach…), measure it in grams, spoons, cups or
pieces, and the dashboard shows calories, macros and 17 nutrients live.

Everything runs in the browser from a built-in library — no API calls, no
accounts, no build step.

## Features

- **Ingredient library** — 900+ foods in 12 groups (protein, vegetables,
  grains & starches, legumes, fruit, dairy & alternatives, oils & fats, nuts &
  seeds, herbs & spices, sauces, sweeteners & baking, drinks), each family with
  its types. Search understands Indonesian names (*kangkung, tempe, dada ayam,
  santan…*) and forgives typos.
- **Any measurement** — g, kg, mg, oz, lb, ml, l, tsp, tbsp, cup, fl oz, pinch,
  dash, plus real portions (1 large egg, 1 slice, 1 clove, 1 medium banana…).
  Switching unit converts the amount; amounts accept `1,5`, `1 1/2` or `½`.
- **Nutrition dashboard** — calorie meter against your daily goal, macro
  energy split, fiber/sugar/sodium tiles, plain-language insights, vitamins &
  minerals with % Daily Value, a nutrition-facts label and a calorie-sources
  chart. Per serving or whole meal.
- **Sage, the tips assistant** — a little sprout who rotates 60+ healthy-eating
  tips (each one loads a menu you can calculate in one tap), reacts to your
  plate, and offers one-tap swaps (e.g. regular → low-sodium soy sauce).
- **Saved meals & share links** — save plates on the device; share a link that
  re-creates the plate anywhere.
- **Light & dark mode**, animated aurora background, keyboard shortcuts
  (`/` or `⌘K` to search, `Esc` to close), reduced-motion support.

## Run locally

Open `index.html` directly in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

then visit <http://localhost:8000>.

## Deploy

The site is plain static files — publish the repository root as-is (no build
command, publish directory `.`). Works on any static host, including Netlify.

## Project layout

```
index.html              page markup
assets/css/styles.css   all styles (tokens, light/dark, layout, motion)
assets/js/engine.js     units, conversions, nutrient maths, search, insights
assets/js/store.js      state, localStorage, share links
assets/js/fx.js         motion: tweens, fly-to, aurora background, toasts
assets/js/library.js    ingredient library panel
assets/js/plate.js      the plate builder
assets/js/results.js    nutrition panel
assets/js/sage.js       Sage, the tips assistant
assets/js/tipsui.js     tip library carousel
assets/js/app.js        wiring
data/db.js              library registry (groups, nutrient keys)
data/foods-*.js         the ingredient library
data/tips.js            Sage's tips and their menus
data/SCHEMA.md          data format reference
scripts/                validators and tests
```

## Updating the library

1. Add items to the matching `data/foods-*.js` file (or create a new
   `data/foods-<topic>.js` and add a `<script>` tag for it in `index.html`,
   before `data/tips.js`). The format is documented in `data/SCHEMA.md`.
2. Validate:

   ```bash
   node scripts/validate-data.mjs
   node scripts/test-engine.mjs
   ```

Never rename an existing `id` — saved meals and share links depend on it.

## Data sources & disclaimer

Values are per 100 g estimates based on USDA FoodData Central (SR Legacy /
Foundation Foods), the Indonesian Food Composition Table (TKPI) and similar
references. Real foods vary with brand, ripeness and cooking. Mise is for
general information and is not medical advice.
