#!/usr/bin/env node
/**
 * Engine smoke tests: unit conversion, meal maths, parsing, search, share links.
 *   node scripts/test-engine.mjs
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const memory = {};
const ctx = vm.createContext({
  console, Intl, Map, Set,
  localStorage: { getItem: (k) => memory[k] ?? null, setItem: (k, v) => { memory[k] = String(v); } },
  location: { href: "https://example.test/", hash: "", pathname: "/", search: "" },
  setTimeout, clearTimeout,
});
ctx.window = ctx;
const load = (rel) => vm.runInContext(fs.readFileSync(path.join(ROOT, rel), "utf8"), ctx, { filename: rel });

load("data/db.js");
for (const f of fs.readdirSync(path.join(ROOT, "data")).filter((f) => /^foods-.+\.js$/.test(f)).sort()) load("data/" + f);
if (fs.existsSync(path.join(ROOT, "data/tips.js"))) load("data/tips.js");
load("assets/js/engine.js");
load("assets/js/store.js");

const E = ctx.Mise.engine;
const S = ctx.Mise.store;
let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.log("  ✖ " + msg); } };
const near = (a, b, tol, msg) => ok(Math.abs(a - b) <= tol, `${msg}: got ${a}, expected ≈ ${b} (±${tol})`);
const has = (id) => E.byId.has(id);

console.log(`Library: ${E.foods.length} foods, ${E.families.length} families`);

// parsing ---------------------------------------------------------------------
near(E.parseQty("1,5"), 1.5, 1e-9, "parse 1,5");
near(E.parseQty("1 1/2"), 1.5, 1e-9, "parse 1 1/2");
near(E.parseQty("½"), 0.5, 1e-9, "parse ½");
near(E.parseQty("1½"), 1.5, 1e-9, "parse 1½");
near(E.parseQty("3/4"), 0.75, 1e-9, "parse 3/4");
near(E.parseQty(".5"), 0.5, 1e-9, "parse .5");
ok(Number.isNaN(E.parseQty("abc")), "parse abc → NaN");
ok(Number.isNaN(E.parseQty("1/0")), "parse 1/0 → NaN");

// units -----------------------------------------------------------------------
const fake = { id: "x", group: "fat", density: 0.91, units: { "large": 50 }, n: E.zero() };
near(E.toGrams(fake, 1, "tbsp"), 13.46, 0.02, "1 tbsp oil → g");
near(E.toGrams(fake, 2, "large"), 100, 1e-9, "2 large → g");
near(E.toGrams(fake, 1, "oz"), 28.35, 0.01, "1 oz → g");
near(E.fromGrams(fake, 13.46, "tbsp"), 1, 0.01, "13.46 g → tbsp");
ok(Number.isNaN(E.toGrams({ group: "protein", n: E.zero() }, 1, "cup")), "cup without density → NaN");
ok(E.unitOptions(fake).some((o) => o.key === "large"), "portion unit offered");
ok(E.unitOptions(fake).some((o) => o.key === "tbsp"), "volume units offered with density");
near(E.niceQty(3.527, "oz"), 3.55, 0.001, "niceQty oz");
near(E.niceQty(152.4, "g"), 152, 0, "niceQty g");

// the user's own example --------------------------------------------------------
if (has("chicken-breast-skinless-raw") && has("olive-oil-extra-virgin") && has("spinach-raw")) {
  const c = E.computeMeal({ servings: 1, items: [
    { id: "chicken-breast-skinless-raw", qty: 100, unit: "g" },
    { id: "olive-oil-extra-virgin", qty: 1, unit: "tbsp" },
    { id: "spinach-raw", qty: 150, unit: "g" },
  ] });
  const ck = E.byId.get("chicken-breast-skinless-raw").n, oil = E.byId.get("olive-oil-extra-virgin"), sp = E.byId.get("spinach-raw").n;
  const expect = ck.kcal + oil.n.kcal * (14.7868 * oil.density) / 100 + sp.kcal * 1.5;
  near(c.total.kcal, expect, 0.01, "chicken + oil + spinach kcal");
  near(c.weight, 100 + 14.7868 * oil.density + 150, 0.01, "meal weight");
  console.log(`  example plate → ${c.total.kcal.toFixed(0)} kcal · P ${c.total.protein.toFixed(1)} g · C ${c.total.carbs.toFixed(1)} g · F ${c.total.fat.toFixed(1)} g · Na ${c.total.sodium.toFixed(0)} mg`);
  ok(c.total.kcal > 220 && c.total.kcal < 330, "example plate kcal in a sane range");
  const halves = E.computeMeal({ servings: 2, items: [{ id: "spinach-raw", qty: 200, unit: "g" }] });
  near(halves.per.kcal, sp.kcal, 1e-9, "servings split");
}
if (has("egg-whole-raw")) {
  const egg = E.byId.get("egg-whole-raw");
  ok(egg.units && egg.units.large === 50, "egg large = 50 g");
  near(E.toGrams(egg, 2, "large"), 100, 1e-9, "2 large eggs = 100 g");
}

// search ------------------------------------------------------------------------
const top = (q, opts) => { const r = E.search(q, opts); return r.length ? r[0].family.name + " — " + r[0].match.id : "(none)"; };
const expectTop = (q, re) => { const t = top(q); ok(re.test(t), `search "${q}" → ${t}`); };
if (E.foods.length > 100) {
  expectTop("chicken breast", /chicken-breast/);
  expectTop("kangkung", /water-spinach/);
  expectTop("dada ayam", /chicken-breast/);
  expectTop("olive oil", /olive-oil/);
  expectTop("tempe", /tempeh/);
  expectTop("chiken", /chicken/);
  expectTop("spinach", /spinach/);
  expectTop("jasmine rice", /rice-jasmine/);
  expectTop("soy sauce", /soy-sauce/);
  ok(E.search("", { group: "veg" }).every((r) => r.family.group === "veg"), "group filter");
}

// insights ------------------------------------------------------------------------
if (has("soy-sauce") && has("rice-white-cooked")) {
  const salty = E.computeMeal({ servings: 1, items: [{ id: "soy-sauce", qty: 3, unit: "tbsp" }, { id: "rice-white-cooked", qty: 150, unit: "g" }] });
  ok(E.insights(salty, "serving", 2000).some((i) => i.key === "sodium-high"), "salty meal flagged");
}

// tips menus resolve ----------------------------------------------------------------
const tips = ctx.MiseTips || [];
let missing = 0;
for (const t of tips) for (const [id, q, u] of t.menu.items) {
  const f = E.byId.get(id);
  if (!f || !E.unitValid(f, u) || !(q > 0)) { missing++; if (missing <= 15) console.log(`  ✖ tip ${t.id}: ${id} ${q} ${u}`); }
}
ok(!missing, `${missing} tip menu items unresolved`);
if (tips.length) {
  const kcals = tips.map((t) => E.computeMeal({ servings: t.menu.servings, items: t.menu.items.map(([id, qty, unit]) => ({ id, qty, unit })) }).per.kcal);
  console.log(`  tips: ${tips.length}, per-serving kcal ${Math.min(...kcals).toFixed(0)}–${Math.max(...kcals).toFixed(0)}`);
}

// share links ------------------------------------------------------------------------
if (has("chicken-breast-skinless-raw") && has("egg-whole-raw")) {
  S.loadMeal({ name: "Test & co", servings: 2, items: [["chicken-breast-skinless-raw", 120, "g"], ["egg-whole-raw", 2, "large"]] });
  const url = S.shareURL();
  const parsed = S.parseHash(url.split("#")[1]);
  ok(parsed && parsed.name === "Test & co" && parsed.servings === 2 && parsed.items.length === 2 && parsed.items[1][2] === "large", "share link round-trip");
  S.updateItem(S.get().meal.items[0].uid, { unit: "oz" });
  near(S.get().meal.items[0].qty, 4.25, 0.05, "unit switch converts the amount (120 g → oz)");
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
