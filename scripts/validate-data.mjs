#!/usr/bin/env node
/**
 * Validate the Mise ingredient library (and the tips/menus that reference it).
 *
 *   node scripts/validate-data.mjs                 # every data/foods-*.js + data/tips.js
 *   node scripts/validate-data.mjs data/foods-x.js # just the given file(s)
 *   node scripts/validate-data.mjs --list          # also print id | name | type
 *   node scripts/validate-data.mjs --strict        # treat warnings as errors
 *
 * Errors are structural problems that would break the app. Warnings are
 * plausibility checks (energy vs. macros, ranges) that usually mean a typo.
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "data");
const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith("--")));
let files = argv.filter((a) => !a.startsWith("--")).map((f) => path.resolve(f));
const allMode = files.length === 0;
if (allMode) {
  files = fs.readdirSync(DATA)
    .filter((f) => /^foods-.+\.js$/.test(f))
    .sort()
    .map((f) => path.join(DATA, f));
}

const rel = (f) => path.relative(ROOT, f);
const ctx = vm.createContext({ console });
ctx.window = ctx;
const load = (f) => vm.runInContext(fs.readFileSync(f, "utf8"), ctx, { filename: f });
load(path.join(DATA, "db.js"));
const DB = ctx.MiseDB;

const errors = [];
const warnings = [];
const fileOf = new Map();

for (const f of files) {
  const before = DB.foods.length;
  try {
    load(f);
  } catch (e) {
    errors.push(`${rel(f)}: failed to load — ${e.message}`);
    continue;
  }
  for (const item of DB.foods.slice(before)) fileOf.set(item, rel(f));
}

const NUTRIENTS = DB.nutrients;
const GROUPS = new Map(DB.groups.map((g) => [g.key, g]));
const MASS = new Set(["g", "kg", "mg", "oz", "lb"]);
const VOLUME = new Set(["ml", "l", "tsp", "tbsp", "cup", "floz", "pinch", "dash"]);
const LIMITS = {
  kcal: 902, protein: 100, carbs: 100, fiber: 100, sugar: 100, fat: 100, satfat: 100,
  chol: 3200, sodium: 40000, potassium: 53000, calcium: 8000, iron: 150, magnesium: 800,
  vitc: 2000, vita: 31000, vitd: 300, b12: 300,
};
const ID_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UNIT_RE = /^[a-z][a-z0-9 ()\-/.,']*$/;

const seen = new Map();
const families = new Map();

for (const it of DB.foods) {
  const where = `${fileOf.get(it) || "?"} › ${it.id || "(no id)"}`;
  const err = (m) => errors.push(`${where}: ${m}`);
  const warn = (m) => warnings.push(`${where}: ${m}`);

  // identity -------------------------------------------------------------
  if (typeof it.id !== "string" || !ID_RE.test(it.id)) err(`id must be kebab-case a-z0-9 (got ${JSON.stringify(it.id)})`);
  else if (it.id.length > 64) err("id longer than 64 chars");
  if (seen.has(it.id)) err(`duplicate id (also in ${fileOf.get(seen.get(it.id))})`);
  seen.set(it.id, it);

  const g = GROUPS.get(it.group);
  if (!g) err(`unknown group ${JSON.stringify(it.group)}`);
  for (const k of ["name", "type", "sub", "emoji"]) {
    if (typeof it[k] !== "string" || !it[k].trim()) err(`missing ${k}`);
  }
  if (typeof it.name === "string" && it.name.length > 40) warn(`name longer than 40 chars (${it.name.length})`);
  if (typeof it.type === "string" && it.type.length > 48) warn(`type longer than 48 chars (${it.type.length})`);
  if (g && typeof it.sub === "string" && !g.subs.includes(it.sub)) err(`sub ${JSON.stringify(it.sub)} not in group "${g.key}" (${g.subs.join(", ")})`);

  const allowed = new Set(["id", "name", "type", "sub", "emoji", "n", "density", "units", "def", "aka", "group", "note", "kcalOk"]);
  for (const k of Object.keys(it)) if (!allowed.has(k)) err(`unknown field "${k}"`);

  // nutrients ------------------------------------------------------------
  const n = it.n;
  if (!n || typeof n !== "object") {
    err("missing n {…}");
  } else {
    for (const k of NUTRIENTS) {
      if (!(k in n)) err(`n.${k} missing`);
      else if (typeof n[k] !== "number" || !Number.isFinite(n[k]) || n[k] < 0) err(`n.${k} must be a number ≥ 0 (got ${JSON.stringify(n[k])})`);
      else if (n[k] > LIMITS[k]) warn(`n.${k} = ${n[k]} looks too high (limit ${LIMITS[k]})`);
    }
    for (const k of Object.keys(n)) if (!NUTRIENTS.includes(k) && k !== "alcohol") err(`n.${k} is not a known nutrient`);
    const alc = n.alcohol || 0;
    if (NUTRIENTS.every((k) => typeof n[k] === "number")) {
      if (n.fiber > n.carbs + 0.15) warn(`fiber (${n.fiber}) > carbs (${n.carbs})`);
      if (n.sugar > n.carbs + 0.15) warn(`sugar (${n.sugar}) > carbs (${n.carbs})`);
      if (n.satfat > n.fat + 0.05) warn(`satfat (${n.satfat}) > fat (${n.fat})`);
      const mass = n.protein + n.carbs + n.fat + alc;
      if (mass > 100.5) warn(`protein + carbs + fat = ${mass.toFixed(1)} g > 100 g`);
      const atw = 4 * n.protein + 4 * n.carbs + 9 * n.fat + 7 * alc;
      const atwFib = 4 * n.protein + 4 * (n.carbs - n.fiber) + 2 * n.fiber + 9 * n.fat + 7 * alc;
      const lo = Math.min(atw, atwFib) * 0.8 - 12;
      const hi = Math.max(atw, atwFib) * 1.2 + 12;
      if (it.kcalOk !== undefined && typeof it.kcalOk !== "boolean") err("kcalOk must be true or false");
      if (!it.kcalOk && (n.kcal < lo || n.kcal > hi)) warn(`kcal ${n.kcal} inconsistent with macros (expected ≈ ${Math.round(atwFib)}–${Math.round(atw)})`);
    }
  }

  // measures -------------------------------------------------------------
  if (it.density !== undefined && (typeof it.density !== "number" || it.density < 0.03 || it.density > 2.5)) err(`density must be g/ml between 0.03 and 2.5 (got ${it.density})`);
  if (it.units !== undefined) {
    if (!it.units || typeof it.units !== "object" || Array.isArray(it.units)) err("units must be an object { label: grams }");
    else for (const [label, grams] of Object.entries(it.units)) {
      if (!UNIT_RE.test(label) || label.length > 24) err(`unit label ${JSON.stringify(label)} must be lowercase, ≤ 24 chars`);
      if (MASS.has(label) || VOLUME.has(label)) err(`unit label "${label}" clashes with a standard unit`);
      if (typeof grams !== "number" || !(grams > 0) || grams > 5000) err(`unit "${label}" grams must be 0–5000 (got ${grams})`);
    }
  }
  if (it.def !== undefined) {
    const ok = Array.isArray(it.def) && it.def.length === 2 && typeof it.def[0] === "number" && it.def[0] > 0 && typeof it.def[1] === "string";
    if (!ok) err(`def must be [qty > 0, "unit"] (got ${JSON.stringify(it.def)})`);
    else {
      const u = it.def[1];
      const known = MASS.has(u) || VOLUME.has(u) || (it.units && u in it.units);
      if (!known) err(`def unit "${u}" is not a standard unit or a key of units`);
      if (VOLUME.has(u) && it.density === undefined) err(`def uses volume unit "${u}" but the item has no density`);
    }
  }
  if (it.aka !== undefined && (!Array.isArray(it.aka) || it.aka.some((a) => typeof a !== "string" || !a.trim()))) err("aka must be an array of non-empty strings");

  // families -------------------------------------------------------------
  const fk = `${it.group}|${it.name}`;
  if (!families.has(fk)) families.set(fk, []);
  families.get(fk).push(it);
}

for (const [fk, list] of families) {
  const types = new Set();
  for (const it of list) {
    const t = String(it.type).toLowerCase();
    if (types.has(t)) errors.push(`${fileOf.get(it)} › ${it.id}: family "${fk}" has two items with type "${it.type}"`);
    types.add(t);
  }
  const subs = new Set(list.map((i) => i.sub));
  if (subs.size > 1) warnings.push(`family "${fk}" spans several subs (${[...subs].join(", ")}) — keep one sub per family`);
}

// tips & menus ---------------------------------------------------------------
const tipsFile = path.join(DATA, "tips.js");
let tipCount = 0;
if (allMode && fs.existsSync(tipsFile)) {
  try {
    load(tipsFile);
    const tips = ctx.MiseTips || [];
    tipCount = tips.length;
    const tipIds = new Set();
    for (const t of tips) {
      const where = `data/tips.js › ${t.id}`;
      if (!t.id || tipIds.has(t.id)) errors.push(`${where}: missing or duplicate tip id`);
      tipIds.add(t.id);
      for (const k of ["cat", "title", "body"]) if (!t[k]) errors.push(`${where}: missing ${k}`);
      if (!t.menu || !Array.isArray(t.menu.items) || !t.menu.items.length) { errors.push(`${where}: missing menu.items`); continue; }
      if (!t.menu.name) errors.push(`${where}: missing menu.name`);
      for (const [id, qty, unit] of t.menu.items) {
        const food = seen.get(id);
        if (!food) { errors.push(`${where}: unknown food id "${id}"`); continue; }
        const known = MASS.has(unit) || (VOLUME.has(unit) && food.density !== undefined) || (food.units && unit in food.units);
        if (!(qty > 0) || !known) errors.push(`${where}: bad amount ${qty} "${unit}" for ${id}`);
      }
    }
  } catch (e) {
    errors.push(`data/tips.js: failed to load — ${e.message}`);
  }
}

// report ---------------------------------------------------------------------
if (flags.has("--list")) {
  for (const it of DB.foods) console.log(`${it.id.padEnd(44)} ${it.group.padEnd(8)} ${it.name} — ${it.type}`);
  console.log("");
}

const byGroup = {};
for (const it of DB.foods) byGroup[it.group] = (byGroup[it.group] || 0) + 1;
console.log(`Foods: ${DB.foods.length} in ${families.size} families` + (tipCount ? ` · Tips: ${tipCount}` : ""));
console.log("  " + Object.entries(byGroup).map(([k, v]) => `${k} ${v}`).join(" · "));

if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const w of warnings) console.log("  ⚠ " + w);
}
if (errors.length) {
  console.log(`\n${errors.length} error(s):`);
  for (const e of errors) console.log("  ✖ " + e);
}
if (!errors.length && !warnings.length) console.log("\n✔ All checks passed.");

process.exit(errors.length || (flags.has("--strict") && warnings.length) ? 1 : 0);
