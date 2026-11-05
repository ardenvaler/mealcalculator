# Mise ingredient library — data format

The library is plain JavaScript so the site works with no build step and no
network lookups. `data/db.js` defines the registry; every `data/foods-*.js`
file adds items to it:

```js
/* Mise library — <what this file covers> */
MiseDB.add("protein", [
  { id: "chicken-breast-skinless-raw", name: "Chicken breast", type: "Skinless · raw",
    sub: "Poultry", emoji: "🍗", aka: ["dada ayam", "fillet"],
    n: { kcal: 120, protein: 22.5, carbs: 0, fiber: 0, sugar: 0, fat: 2.6, satfat: 0.56,
         chol: 73, sodium: 45, potassium: 334, calcium: 5, iron: 0.37, magnesium: 28,
         vitc: 0, vita: 9, vitd: 0.1, b12: 0.21 },
    density: 0.59, units: { "breast": 200, "fillet": 120 } },
]);
```

A file may call `MiseDB.add` several times (once per group it covers).

## Fields

| field     | required | meaning |
|-----------|----------|---------|
| `id`      | yes | Unique, stable, kebab-case (`a-z0-9-`), ≤ 64 chars. Saved meals and share links use it, so never rename an id once published. Pattern: name slug + the key type words, e.g. `rice-jasmine-cooked`, `olive-oil-extra-virgin`. |
| `name`    | yes | The **family** name, i.e. what people search for: `Chicken breast`, `Olive oil`, `Jasmine rice`. Items sharing a `name` inside a group are shown as *types* of one family. ≤ 40 chars. |
| `type`    | yes | The variant inside the family: state, cut, grade or style. Use ` · ` to join parts: `Skinless · raw`, `With skin · roasted`, `Extra virgin`, `Cooked`, `Uncooked`. ≤ 48 chars. Every item has a type, even single-item families (`Raw`, `Fresh`, `Ground`, `Dried`). |
| `sub`     | yes | Sub-group, must be one of the group's `subs` listed in `data/db.js`. All types of a family share one sub. |
| `emoji`   | yes | One emoji used as the item's icon (closest match is fine). |
| `aka`     | no  | Search aliases: local names (Indonesian especially), synonyms, US/UK names. e.g. `["kangkung", "water spinach", "morning glory"]`. |
| `n`       | yes | Nutrients **per 100 g** of the edible portion in the state the type names. All 17 keys required (below). Use `0` where a nutrient is truly absent. Optional `alcohol` (g) for items that contain it. |
| `density` | no  | Grams per millilitre **as the food is usually measured by volume** (chopped, sliced, loosely packed, ground, poured). Enables tsp / tbsp / cup / ml. Compute as grams-per-cup ÷ 236.6 or grams-per-tbsp ÷ 14.79. Give it whenever cooks measure the food by volume. |
| `units`   | no  | Household portions → grams: `{ "large": 50, "slice": 28, "clove": 3 }`. Labels are lowercase, singular, ≤ 24 chars and must not be a standard unit name. |
| `def`     | no  | Default amount when added to a plate: `[qty, unit]`, unit is a standard unit or a key of `units`. Omit for the group default (see below). |
| `note`    | no  | Free-text note for maintainers (not shown in the app). |

### Nutrient keys (`n`)

| key | unit | | key | unit |
|-----|------|-|-----|------|
| `kcal` | kcal | | `sodium` | mg |
| `protein` | g | | `potassium` | mg |
| `carbs` | g — total, by difference (includes fiber & sugars) | | `calcium` | mg |
| `fiber` | g | | `iron` | mg |
| `sugar` | g — total sugars | | `magnesium` | mg |
| `fat` | g | | `vitc` | mg — vitamin C |
| `satfat` | g | | `vita` | µg RAE — vitamin A |
| `chol` | mg | | `vitd` | µg — vitamin D (D2 + D3); 1 µg = 40 IU |
| | | | `b12` | µg |

### Standard units (always available in the app)

Mass: `g`, `kg`, `mg`, `oz`, `lb`.
Volume (only when the item has `density`): `ml`, `l`, `tsp` (4.93 ml), `tbsp` (14.79 ml), `cup` (US, 236.6 ml), `floz`, `pinch` (≈ 1/16 tsp), `dash` (≈ 1/8 tsp).

### Group defaults when `def` is omitted

protein / veg / carb / legume / fruit / dairy → `100 g` · fat → `1 tbsp` ·
nut → `30 g` · spice → `1 tsp` (or `1 g` without density) · sauce / sweet →
`1 tbsp` (or `15 g`) · drink → `1 cup` (or `250 g`).

## Data quality rules

* Source values from **USDA FoodData Central** (SR Legacy / Foundation
  Foods) per 100 g. For Indonesian / Southeast-Asian foods that USDA lacks,
  use the **Indonesian Food Composition Table (TKPI)** or another national
  table. When a value is not published, estimate it from the closest similar
  food rather than leaving it out — never guess wildly.
* Raw and cooked are different items (`type: "Raw"` vs `"Boiled, drained"`):
  values change a lot with water loss/gain (rice: ~360 kcal raw, ~130 cooked).
* Prefer plain states (raw, boiled, steamed, grilled, roasted, baked). Only
  add fried/oil-containing states when food is commonly bought or weighed
  that way (fried tempeh, French fries), because users add cooking oil as its
  own ingredient.
* List the **most common type first** in each family — it is the default.
* `kcal` must agree with the macros (≈ 4·protein + 4·carbs + 9·fat, give or
  take fiber and specific Atwater factors). The validator flags outliers.

## Validate

```bash
node scripts/validate-data.mjs                  # whole library (+ tips)
node scripts/validate-data.mjs data/foods-x.js  # one file
node scripts/validate-data.mjs --list           # print every id
```

Fix every error. Treat warnings as probable typos: correct them, or keep the
value only when you are sure the source says so.
