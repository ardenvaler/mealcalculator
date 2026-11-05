/*!
 * Mise — calculation engine
 * Pure functions: units & conversions, nutrient maths, search and insights.
 * No DOM access here, so it can be tested in Node as well as the browser.
 */
(function (root) {
  "use strict";

  var DB = root.MiseDB;
  var Mise = root.Mise || (root.Mise = {});

  /* ------------------------------------------------------------------ */
  /* Nutrients                                                           */
  /* ------------------------------------------------------------------ */

  /* dv = FDA reference daily value (2,000 kcal diet). `scale` values follow
     the user's calorie goal. kind: good = more is better, limit = keep low. */
  var NUTRIENTS = [
    { key: "kcal", label: "Calories", short: "Calories", unit: "kcal", dv: 2000, scale: true, dp: 0 },
    { key: "protein", label: "Protein", short: "Protein", unit: "g", dv: 50, scale: true, dp: 1, kind: "good" },
    { key: "carbs", label: "Total carbohydrate", short: "Carbs", unit: "g", dv: 275, scale: true, dp: 1 },
    { key: "fiber", label: "Dietary fiber", short: "Fiber", unit: "g", dv: 28, scale: true, dp: 1, kind: "good" },
    { key: "sugar", label: "Total sugars", short: "Sugars", unit: "g", dv: null, dp: 1, kind: "limit" },
    { key: "fat", label: "Total fat", short: "Fat", unit: "g", dv: 78, scale: true, dp: 1 },
    { key: "satfat", label: "Saturated fat", short: "Sat. fat", unit: "g", dv: 20, scale: true, dp: 1, kind: "limit" },
    { key: "chol", label: "Cholesterol", short: "Cholesterol", unit: "mg", dv: 300, dp: 0, kind: "limit" },
    { key: "sodium", label: "Sodium", short: "Sodium", unit: "mg", dv: 2300, dp: 0, kind: "limit" },
    { key: "potassium", label: "Potassium", short: "Potassium", unit: "mg", dv: 4700, dp: 0, kind: "good" },
    { key: "calcium", label: "Calcium", short: "Calcium", unit: "mg", dv: 1300, dp: 0, kind: "good" },
    { key: "iron", label: "Iron", short: "Iron", unit: "mg", dv: 18, dp: 1, kind: "good" },
    { key: "magnesium", label: "Magnesium", short: "Magnesium", unit: "mg", dv: 420, dp: 0, kind: "good" },
    { key: "vitc", label: "Vitamin C", short: "Vitamin C", unit: "mg", dv: 90, dp: 1, kind: "good" },
    { key: "vita", label: "Vitamin A", short: "Vitamin A", unit: "µg", dv: 900, dp: 0, kind: "good" },
    { key: "vitd", label: "Vitamin D", short: "Vitamin D", unit: "µg", dv: 20, dp: 1, kind: "good" },
    { key: "b12", label: "Vitamin B12", short: "Vitamin B12", unit: "µg", dv: 2.4, dp: 2, kind: "good" }
  ];
  var NUTRIENT = {};
  NUTRIENTS.forEach(function (n) { NUTRIENT[n.key] = n; });
  var KEYS = NUTRIENTS.map(function (n) { return n.key; });

  function zero() {
    var o = {};
    for (var i = 0; i < KEYS.length; i++) o[KEYS[i]] = 0;
    return o;
  }

  function dvFor(key, kcalGoal) {
    var n = NUTRIENT[key];
    if (!n || !n.dv) return null;
    return n.scale ? n.dv * ((kcalGoal || 2000) / 2000) : n.dv;
  }

  function pctDV(key, value, kcalGoal) {
    var dv = dvFor(key, kcalGoal);
    return dv ? (value / dv) * 100 : null;
  }

  /* ------------------------------------------------------------------ */
  /* Units                                                               */
  /* ------------------------------------------------------------------ */

  var UNITS = {
    g: { label: "g", name: "grams", kind: "mass", f: 1 },
    kg: { label: "kg", name: "kilograms", kind: "mass", f: 1000 },
    mg: { label: "mg", name: "milligrams", kind: "mass", f: 0.001 },
    oz: { label: "oz", name: "ounces", kind: "mass", f: 28.349523125 },
    lb: { label: "lb", name: "pounds", kind: "mass", f: 453.59237 },
    ml: { label: "ml", name: "millilitres", kind: "vol", f: 1 },
    l: { label: "l", name: "litres", kind: "vol", f: 1000 },
    tsp: { label: "tsp", name: "teaspoons", kind: "vol", f: 4.92892159375 },
    tbsp: { label: "tbsp", name: "tablespoons", kind: "vol", f: 14.78676478125 },
    cup: { label: "cup", name: "cups (US)", kind: "vol", f: 236.5882365 },
    floz: { label: "fl oz", name: "fluid ounces", kind: "vol", f: 29.5735295625 },
    pinch: { label: "pinch", name: "pinch (⅟₁₆ tsp)", kind: "vol", f: 0.30805759961 },
    dash: { label: "dash", name: "dash (⅛ tsp)", kind: "vol", f: 0.61611519922 }
  };

  var BIG_GROUPS = { protein: 1, veg: 1, carb: 1, legume: 1, fruit: 1 };
  var LIQUID_GROUPS = { drink: 1, dairy: 1, sauce: 1, fat: 1 };

  /** Unit choices for a food, grouped for a <select>. */
  function unitOptions(food) {
    var out = [];
    var g = food.group;
    if (food.units) {
      for (var label in food.units) {
        if (Object.prototype.hasOwnProperty.call(food.units, label)) {
          out.push({ key: label, label: label, group: "Portions", grams: food.units[label] });
        }
      }
    }
    var mass = ["g", "oz"];
    if (BIG_GROUPS[g] || g === "dairy" || g === "drink") mass.push("kg", "lb");
    if (g === "spice") mass.push("mg");
    mass.forEach(function (k) { out.push({ key: k, label: UNITS[k].label, group: "Weight" }); });
    if (food.density) {
      var vol = ["tsp", "tbsp", "cup", "ml"];
      if (g === "spice" || g === "sauce" || g === "sweet") vol = ["pinch", "dash"].concat(vol);
      if (LIQUID_GROUPS[g]) vol.push("floz");
      if (g === "drink" || g === "dairy") vol.push("l");
      vol.forEach(function (k) { out.push({ key: k, label: UNITS[k].label, group: "Volume" }); });
    }
    return out;
  }

  function unitValid(food, unit) {
    if (!food) return false;
    if (food.units && Object.prototype.hasOwnProperty.call(food.units, unit)) return true;
    var u = UNITS[unit];
    if (!u) return false;
    return u.kind === "mass" || !!food.density;
  }

  /** grams represented by `qty` of `unit` for this food (NaN if impossible). */
  function toGrams(food, qty, unit) {
    qty = +qty;
    if (!food || !(qty >= 0)) return 0;
    if (food.units && Object.prototype.hasOwnProperty.call(food.units, unit)) return qty * food.units[unit];
    var u = UNITS[unit];
    if (!u) return NaN;
    if (u.kind === "mass") return qty * u.f;
    return food.density ? qty * u.f * food.density : NaN;
  }

  function fromGrams(food, grams, unit) {
    var one = toGrams(food, 1, unit);
    return one > 0 ? grams / one : NaN;
  }

  /** Round a converted quantity to something a cook would type. */
  function niceQty(q, unit) {
    if (!isFinite(q) || q <= 0) return 0;
    var u = UNITS[unit];
    if (u && (unit === "g" || unit === "ml" || unit === "mg")) {
      if (q >= 100) return Math.round(q);
      if (q >= 10) return Math.round(q * 2) / 2;
      return Math.round(q * 10) / 10;
    }
    if (unit === "pinch" || unit === "dash") return Math.max(1, Math.round(q * 2) / 2);
    if (q >= 100) return Math.round(q);
    if (q >= 10) return Math.round(q * 10) / 10;
    if (q >= 1) return Math.round(q * 20) / 20;
    return Math.max(0.01, Math.round(q * 100) / 100);
  }

  /** Step size for the − / + buttons. */
  function stepFor(unit, qty) {
    switch (unit) {
      case "g": case "ml": return qty < 20 ? 1 : qty < 100 ? 5 : 10;
      case "mg": return qty < 100 ? 10 : 50;
      case "kg": case "l": return 0.1;
      case "oz": case "floz": return qty < 4 ? 0.5 : 1;
      case "lb": return 0.25;
      case "tsp": case "tbsp": return qty < 1 ? 0.25 : 0.5;
      case "cup": return 0.25;
      case "pinch": case "dash": return 1;
      default: return qty < 1 ? 0.25 : qty < 4 ? 0.5 : 1;
    }
  }

  function unitLabel(unit, qty) {
    var u = UNITS[unit];
    if (u) {
      if (unit === "cup" && qty !== 1) return "cups";
      if (unit === "pinch" && qty !== 1) return "pinches";
      if (unit === "dash" && qty !== 1) return "dashes";
      return u.label;
    }
    return unit;
  }

  /* ------------------------------------------------------------------ */
  /* Library index                                                       */
  /* ------------------------------------------------------------------ */

  function norm(s) {
    return String(s || "")
      .toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9%]+/g, " ")
      .trim();
  }

  var foods = DB ? DB.foods : [];
  var byId = new Map();
  var families = [];
  var familyByKey = new Map();
  var groupByKey = new Map();
  var subOrder = {};

  if (DB) {
    DB.groups.forEach(function (g, gi) {
      groupByKey.set(g.key, g);
      g.subs.forEach(function (s, si) { subOrder[g.key + "|" + s] = gi * 100 + si; });
    });
  }

  foods.forEach(function (f, i) {
    f._i = i;
    byId.set(f.id, f);
    var key = f.group + "|" + f.name;
    var fam = familyByKey.get(key);
    if (!fam) {
      fam = { key: key, name: f.name, group: f.group, sub: f.sub, emoji: f.emoji, variants: [], _i: i };
      familyByKey.set(key, fam);
      families.push(fam);
    }
    fam.variants.push(f);
    f.family = fam;
    var g = groupByKey.get(f.group);
    f._name = norm(f.name);
    f._type = norm(f.type);
    f._aka = (f.aka || []).map(norm);
    f._hay = norm([f.name, f.type, f.sub, g ? g.label : "", (f.aka || []).join(" ")].join(" "));
  });

  families.forEach(function (fam) {
    var lo = Infinity, hi = -Infinity;
    fam.variants.forEach(function (v) { lo = Math.min(lo, v.n.kcal); hi = Math.max(hi, v.n.kcal); });
    fam.kcalLo = lo; fam.kcalHi = hi;
    fam.order = (subOrder[fam.group + "|" + fam.sub] || 0) * 10000 + fam._i;
  });
  families.sort(function (a, b) { return a.order - b.order; });

  function wordStart(hay, token) {
    return hay.indexOf(token) === 0 || hay.indexOf(" " + token) !== -1;
  }

  function scoreFood(f, tokens) {
    var score = 0;
    for (var i = 0; i < tokens.length; i++) {
      var t = tokens[i];
      var s = 0;
      if (f._name.indexOf(t) === 0) s = 12;
      else if (wordStart(f._name, t)) s = 9;
      else if (f._aka.some(function (a) { return wordStart(a, t); })) s = 8;
      else if (wordStart(f._type, t)) s = 5;
      else if (wordStart(f._hay, t)) s = 3;
      else if (t.length >= 3 && f._hay.indexOf(t) !== -1) s = 1;
      else return -1;
      score += s;
    }
    if (f._name === tokens.join(" ")) score += 20;
    if (f._aka.indexOf(tokens.join(" ")) !== -1) score += 14;
    return score - f.name.length / 40;
  }

  function editDistanceWithin(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return false;
    var prev = [], cur = [], i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur = [i];
      var rowMin = i;
      for (j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (cur[j] < rowMin) rowMin = cur[j];
      }
      if (rowMin > max) return false;
      prev = cur;
    }
    return prev[b.length] <= max;
  }

  function fuzzyFood(f, tokens) {
    var words = f._hay.split(" ");
    var score = 0;
    for (var i = 0; i < tokens.length; i++) {
      var t = tokens[i];
      var max = t.length <= 4 ? 1 : 2;
      var hit = words.some(function (w) {
        return editDistanceWithin(t, w, max) || (w.length > t.length && editDistanceWithin(t, w.slice(0, t.length), max - (t.length <= 4 ? 0 : 1)));
      });
      if (!hit) return -1;
      score += 1;
    }
    return score;
  }

  /**
   * Search the library. Returns families (with `match`: the best variant).
   * opts: { group, sub, limit }
   */
  function search(query, opts) {
    opts = opts || {};
    var tokens = norm(query).split(" ").filter(Boolean);
    var pool = families.filter(function (fam) {
      if (opts.group && opts.group !== "all" && fam.group !== opts.group) return false;
      if (opts.sub && fam.sub !== opts.sub) return false;
      return true;
    });
    if (!tokens.length) return pool.map(function (fam) { return { family: fam, match: fam.variants[0], score: 0 }; });

    var run = function (scorer) {
      var res = [];
      pool.forEach(function (fam) {
        var best = null, bestScore = -1;
        fam.variants.forEach(function (v) {
          var s = scorer(v, tokens);
          if (s > bestScore) { bestScore = s; best = v; }
        });
        if (bestScore >= 0) res.push({ family: fam, match: best, score: bestScore });
      });
      return res;
    };
    var results = run(scoreFood);
    var fuzzy = false;
    if (!results.length && tokens.join("").length >= 3) { results = run(fuzzyFood); fuzzy = true; }
    results.sort(function (a, b) { return b.score - a.score || a.family.order - b.family.order; });
    results.fuzzy = fuzzy;
    return results;
  }

  /* ------------------------------------------------------------------ */
  /* Meal maths                                                          */
  /* ------------------------------------------------------------------ */

  function defaultAmount(food) {
    if (food.def && unitValid(food, food.def[1])) return { qty: food.def[0], unit: food.def[1] };
    var d = food.density;
    switch (food.group) {
      case "fat": return d ? { qty: 1, unit: "tbsp" } : { qty: 14, unit: "g" };
      case "nut": return { qty: 30, unit: "g" };
      case "spice": return d ? { qty: 1, unit: "tsp" } : { qty: 1, unit: "g" };
      case "sauce": case "sweet": return d ? { qty: 1, unit: "tbsp" } : { qty: 15, unit: "g" };
      case "drink": return d ? { qty: 1, unit: "cup" } : { qty: 250, unit: "g" };
      default: return { qty: 100, unit: "g" };
    }
  }

  /** Energy (kcal) from each macro, 4/4/9. */
  function energySplit(n) {
    var p = n.protein * 4, c = n.carbs * 4, f = n.fat * 9;
    var sum = p + c + f;
    return {
      protein: sum ? p / sum : 0, carbs: sum ? c / sum : 0, fat: sum ? f / sum : 0,
      kcal: { protein: p, carbs: c, fat: f }, sum: sum
    };
  }

  function scaleNutrients(src, k, into) {
    var o = into || zero();
    for (var i = 0; i < KEYS.length; i++) o[KEYS[i]] += (src[KEYS[i]] || 0) * k;
    return o;
  }

  /**
   * meal: { name, servings, items: [{ uid, id, qty, unit }] }
   * → { rows, total, per, weight, perWeight, servings, split }
   */
  function computeMeal(meal) {
    var total = zero();
    var weight = 0;
    var rows = (meal.items || []).map(function (it) {
      var food = byId.get(it.id);
      if (!food) return { item: it, food: null, grams: 0, n: zero(), valid: false };
      var grams = toGrams(food, it.qty, it.unit);
      var valid = isFinite(grams);
      if (!valid) grams = 0;
      var n = scaleNutrients(food.n, grams / 100);
      scaleNutrients(n, 1, total);
      weight += grams;
      return { item: it, food: food, grams: grams, n: n, valid: valid };
    });
    var servings = Math.max(1, Math.round(+meal.servings || 1));
    var per = scaleNutrients(total, 1 / servings);
    return {
      rows: rows, total: total, per: per, weight: weight, perWeight: weight / servings,
      servings: servings, split: energySplit(total)
    };
  }

  /* ------------------------------------------------------------------ */
  /* Insights — plain-language reading of a serving                     */
  /* ------------------------------------------------------------------ */

  /**
   * calc: result of computeMeal. view: "serving" | "meal". goal: kcal goal.
   * Returns [{ key, tone: "good" | "warn" | "info", title, detail }]
   */
  function insights(calc, view, goal) {
    var n = view === "meal" ? calc.total : calc.per;
    var w = view === "meal" ? calc.weight : calc.perWeight;
    var out = [];
    if (!(n.kcal > 0) && !(w > 0)) return out;
    var sp = energySplit(n);
    var pct = function (k) { return pctDV(k, n[k], goal) || 0; };
    var r0 = function (x) { return Math.round(x); };

    // macro balance
    if (n.protein >= 20 && sp.protein >= 0.25) {
      out.push({ key: "protein-high", tone: "good", title: "Protein-packed", detail: fmt(n.protein, 0) + " g protein — " + r0(pct("protein")) + "% of a day's target." });
    } else if (n.kcal > 250 && sp.protein < 0.12) {
      out.push({ key: "protein-low", tone: "info", title: "Light on protein", detail: "Only " + r0(sp.protein * 100) + "% of calories come from protein. Eggs, tofu, tempeh, fish or chicken would balance it." });
    }
    if (n.kcal > 150 && sp.fat > 0.4) {
      var satShare = (n.satfat * 9) / n.kcal;
      if (satShare > 0.1) out.push({ key: "fat-high", tone: "warn", title: "Fat-heavy", detail: r0(sp.fat * 100) + "% of calories from fat (a common target is 20–35%). Oils and fatty cuts add up quickly — 1 tbsp of oil ≈ 120 kcal." });
      else out.push({ key: "fat-high", tone: "info", title: "Rich in fats — mostly unsaturated", detail: r0(sp.fat * 100) + "% of calories from fat, little of it saturated. Still worth measuring oils: 1 tbsp ≈ 120 kcal." });
    }
    if (n.kcal > 150 && (n.satfat * 9) / n.kcal > 0.1) {
      out.push({ key: "satfat-high", tone: "warn", title: "High in saturated fat", detail: r0((n.satfat * 9 / n.kcal) * 100) + "% of calories from saturated fat — guidelines suggest under 10%." });
    }
    if (n.kcal > 250 && sp.carbs > 0.7) {
      out.push({ key: "carbs-high", tone: "info", title: "Carb-forward", detail: r0(sp.carbs * 100) + "% of calories from carbs. Adding protein or veg slows digestion and keeps you full longer." });
    }

    // fibre
    if (n.fiber >= 7) out.push({ key: "fiber-high", tone: "good", title: "High fiber", detail: fmt(n.fiber, 1) + " g — " + r0(pct("fiber")) + "% of a day's fiber in one go." });
    else if (n.fiber >= 4) out.push({ key: "fiber-good", tone: "good", title: "Good source of fiber", detail: fmt(n.fiber, 1) + " g of fiber (" + r0(pct("fiber")) + "% DV)." });
    else if (n.kcal > 300 && n.fiber < 2) out.push({ key: "fiber-low", tone: "info", title: "Low in fiber", detail: "Under 2 g of fiber. Veg, legumes, whole grains or fruit would lift it." });

    // sodium
    var na = pct("sodium");
    if (na >= 40) out.push({ key: "sodium-high", tone: "warn", title: "High in sodium", detail: fmt(n.sodium, 0) + " mg — " + r0(na) + "% of the daily limit in one serving." });
    else if (na >= 30) out.push({ key: "sodium-mid", tone: "info", title: "Sodium adds up", detail: fmt(n.sodium, 0) + " mg (" + r0(na) + "% DV). Sauces and stock are usually the source." });
    else if (w >= 80 && n.sodium / w * 100 <= 140) out.push({ key: "sodium-low", tone: "good", title: "Low sodium", detail: "≈ " + r0(n.sodium / w * 100) + " mg per 100 g — comfortably low." });

    // sugar
    if (n.sugar >= 25) out.push({ key: "sugar-high", tone: "warn", title: "Sugary", detail: fmt(n.sugar, 0) + " g of sugars ≈ " + fmt(n.sugar / 4.2, 0) + " tsp (includes natural sugars from fruit & milk)." });

    // cholesterol
    if (n.chol >= 300) out.push({ key: "chol-high", tone: "info", title: "High in cholesterol", detail: fmt(n.chol, 0) + " mg — mostly a concern if your doctor has asked you to watch it." });

    // micronutrients
    var rich = [], good = [];
    ["potassium", "calcium", "iron", "magnesium", "vitc", "vita", "vitd", "b12"].forEach(function (k) {
      var p = pct(k);
      if (p >= 20) rich.push({ k: k, p: p }); else if (p >= 10) good.push({ k: k, p: p });
    });
    rich.sort(function (a, b) { return b.p - a.p; });
    good.sort(function (a, b) { return b.p - a.p; });
    if (rich.length) {
      out.push({
        key: "micro-rich", tone: "good",
        title: "Rich in " + listJoin(rich.slice(0, 3).map(function (x) { return NUTRIENT[x.k].short; })),
        detail: rich.slice(0, 4).map(function (x) { return NUTRIENT[x.k].short + " " + r0(x.p) + "%"; }).join(" · ") + " of daily value."
      });
    }
    if (good.length && rich.length < 3) {
      out.push({
        key: "micro-good", tone: "good",
        title: "Good source of " + listJoin(good.slice(0, 2).map(function (x) { return NUTRIENT[x.k].short; })),
        detail: good.slice(0, 3).map(function (x) { return NUTRIENT[x.k].short + " " + r0(x.p) + "%"; }).join(" · ") + " of daily value."
      });
    }

    // energy density & size
    if (w >= 60 && n.kcal > 0) {
      var ed = n.kcal / w * 100;
      if (ed < 100) out.push({ key: "density-low", tone: "good", title: "Big volume, few calories", detail: r0(ed) + " kcal per 100 g — very filling for the energy." });
      else if (ed > 320) out.push({ key: "density-high", tone: "info", title: "Energy-dense", detail: r0(ed) + " kcal per 100 g. Bulking it up with veg makes the same calories go further." });
    }
    var kp = pct("kcal");
    if (kp >= 55) out.push({ key: "kcal-big", tone: "info", title: "A big plate", detail: r0(kp) + "% of your " + fmt(goal || 2000, 0) + " kcal day in one serving." });

    var order = { warn: 0, good: 1, info: 2 };
    out.sort(function (a, b) { return order[a.tone] - order[b.tone]; });
    return out;
  }

  function listJoin(arr) {
    if (arr.length <= 1) return arr.join("");
    return arr.slice(0, -1).join(", ") + " & " + arr[arr.length - 1];
  }

  /* ------------------------------------------------------------------ */
  /* Formatting                                                          */
  /* ------------------------------------------------------------------ */

  var nfCache = {};
  function fmt(x, dp) {
    if (!isFinite(x)) return "–";
    dp = dp == null ? 0 : dp;
    var key = dp;
    var nf = nfCache[key] || (nfCache[key] = new Intl.NumberFormat("en-US", { maximumFractionDigits: dp, minimumFractionDigits: 0 }));
    return nf.format(x);
  }

  /** Display precision that keeps small amounts meaningful. */
  function fmtNutrient(key, v) {
    var meta = NUTRIENT[key];
    if (!meta) return fmt(v, 1);
    if (v === 0) return "0";
    var dp = meta.dp;
    if (v < 1 && dp < 2) dp = meta.unit === "µg" ? 2 : 1;
    if (v >= 100) dp = 0;
    else if (v >= 10 && dp > 1) dp = 1;
    var s = fmt(v, dp);
    if (s === "0") return "<" + (dp === 0 ? "1" : "0." + "0".repeat(dp - 1) + "1");
    return s;
  }

  function fmtQty(q) {
    if (!isFinite(q)) return "";
    var r = Math.round(q * 100) / 100;
    return String(+r.toFixed(2));
  }

  var FRACTIONS = { "½": 0.5, "⅓": 1 / 3, "⅔": 2 / 3, "¼": 0.25, "¾": 0.75, "⅕": 0.2, "⅛": 0.125, "⅜": 0.375, "⅝": 0.625, "⅞": 0.875 };

  /** "1,5" "1.5" "1 1/2" "½" "1½" → number (NaN if it isn't a quantity) */
  function parseQty(str) {
    var s = String(str == null ? "" : str).trim().replace(/,/g, ".");
    if (!s) return NaN;
    var extra = 0;
    s = s.replace(/[½⅓⅔¼¾⅕⅛⅜⅝⅞]/g, function (c) { extra += FRACTIONS[c]; return " "; }).trim();
    if (!s) return extra;
    var m = s.match(/^(\d+(?:\.\d+)?|\.\d+)?\s*(?:(\d+)\s*\/\s*(\d+))?$/);
    if (!m || (!m[1] && !m[2])) return NaN;
    var v = m[1] ? parseFloat(m[1]) : 0;
    if (m[2]) {
      var den = parseFloat(m[3]);
      if (!den) return NaN;
      v += parseFloat(m[2]) / den;
    }
    return v + extra;
  }

  Mise.engine = {
    NUTRIENTS: NUTRIENTS, NUTRIENT: NUTRIENT, KEYS: KEYS, UNITS: UNITS,
    foods: foods, byId: byId, families: families, familyByKey: familyByKey, groups: DB ? DB.groups : [], groupByKey: groupByKey,
    zero: zero, dvFor: dvFor, pctDV: pctDV,
    unitOptions: unitOptions, unitValid: unitValid, toGrams: toGrams, fromGrams: fromGrams,
    niceQty: niceQty, stepFor: stepFor, unitLabel: unitLabel,
    norm: norm, search: search,
    defaultAmount: defaultAmount, energySplit: energySplit, computeMeal: computeMeal, insights: insights,
    fmt: fmt, fmtNutrient: fmtNutrient, fmtQty: fmtQty, listJoin: listJoin, parseQty: parseQty
  };
})(typeof window !== "undefined" ? window : this);
