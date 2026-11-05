/*!
 * Mise — nutrition results panel
 * Calorie meter, macro split, stat tiles, insights, vitamins & minerals,
 * nutrition-facts label and calorie sources.
 */
(function (root) {
  "use strict";

  var Mise = root.Mise;
  var E = Mise.engine, S = Mise.store, ui = Mise.ui, h = ui.h, fx = Mise.fx;
  var el = {};
  var MACROS = [
    { key: "protein", label: "Protein", cls: "p" },
    { key: "carbs", label: "Carbs", cls: "c" },
    { key: "fat", label: "Fat", cls: "f" }
  ];
  var MICROS = ["sodium", "potassium", "calcium", "iron", "magnesium", "vita", "vitc", "vitd", "b12", "chol", "satfat"];

  /* ---------------- tooltip ---------------- */

  var tipEl = null;
  function showTip(target, lines, x, y) {
    if (!tipEl) {
      tipEl = h("div", { class: "viz-tip", role: "tooltip" });
      document.body.appendChild(tipEl);
    }
    ui.clear(tipEl);
    lines.forEach(function (l, i) {
      tipEl.appendChild(h("div", { class: i === 0 ? "viz-tip-val" : "viz-tip-row" },
        l.key ? h("i", { class: "viz-tip-key key-" + l.key }) : null, l.text));
    });
    var r = target.getBoundingClientRect();
    var px = x != null ? x : r.left + r.width / 2;
    var py = y != null ? y : r.top;
    tipEl.style.left = Math.round(px) + "px";
    tipEl.style.top = Math.round(py) + "px";
    tipEl.classList.add("is-on");
  }
  function hideTip() { if (tipEl) tipEl.classList.remove("is-on"); }

  function bindTips(container, resolver) {
    container.addEventListener("pointermove", function (e) {
      var t = e.target.closest("[data-tip]");
      if (!t || !container.contains(t)) { hideTip(); return; }
      var lines = resolver(t);
      if (lines) showTip(t, lines, e.clientX, t.getBoundingClientRect().top);
    });
    container.addEventListener("pointerleave", hideTip);
    container.addEventListener("focusin", function (e) {
      var t = e.target.closest("[data-tip]");
      if (t) { var lines = resolver(t); if (lines) showTip(t, lines); }
    });
    container.addEventListener("focusout", hideTip);
  }

  /* ---------------- helpers ---------------- */

  function val(key, v) { return E.fmtNutrient(key, v); }
  function unitOf(key) { return E.NUTRIENT[key].unit; }
  function pct(key, v) { var p = E.pctDV(key, v, S.get().goal); return p == null ? null : p; }
  function pctText(p) { return p == null ? "" : (p > 0 && p < 1 ? "<1" : E.fmt(p)) + "%"; }

  function severity(key, p) {
    var meta = E.NUTRIENT[key];
    if (meta.kind !== "limit" || p == null) return null;
    if (p >= 40) return "critical";
    if (p >= 25) return "warning";
    return null;
  }

  /* ---------------- build static structure ---------------- */

  function buildMacros() {
    ui.clear(el.macros);
    el.macroRefs = {};
    MACROS.forEach(function (m) {
      var refs = {};
      refs.val = h("b", null, "0");
      refs.meter = h("i");
      refs.sub = h("span", { class: "macro-sub" }, "—");
      el.macros.appendChild(h("div", { class: "macro macro-" + m.cls, dataset: { tip: m.key }, tabindex: "0" },
        h("span", { class: "macro-head" },
          h("i", { class: "swatch key-" + m.cls, "aria-hidden": "true" }),
          h("span", { class: "macro-name" }, m.label),
          h("span", { class: "macro-val" }, refs.val, h("small", null, " g"))
        ),
        h("span", { class: "meter meter-" + m.cls, "aria-hidden": "true" }, refs.meter),
        refs.sub
      ));
      el.macroRefs[m.key] = refs;
    });
  }

  function buildStats() {
    ui.clear(el.stats);
    el.statRefs = {};
    [
      { key: "fiber", label: "Fiber" },
      { key: "sugar", label: "Sugars" },
      { key: "sodium", label: "Sodium" },
      { key: "weight", label: "Weight" }
    ].forEach(function (s) {
      var refs = { val: h("span", { class: "stat-num" }, "0"), unit: h("small", null, ""), sub: h("span", { class: "stat-sub" }, "—"), badge: h("span", { class: "stat-badge", hidden: true }) };
      el.stats.appendChild(h("div", { class: "stat", dataset: { stat: s.key } },
        h("span", { class: "stat-label" }, s.label, refs.badge),
        h("span", { class: "stat-value" }, refs.val, refs.unit),
        refs.sub
      ));
      el.statRefs[s.key] = refs;
    });
  }

  function buildMicros() {
    ui.clear(el.micros);
    el.microRefs = {};
    MICROS.forEach(function (k) {
      var meta = E.NUTRIENT[k];
      var refs = { amt: h("span", { class: "micro-amt" }, "0"), pct: h("span", { class: "micro-pct" }, "0%"), fill: h("i"), flag: h("span", { class: "micro-flag", hidden: true }) };
      el.micros.appendChild(h("li", { class: "micro", dataset: { k: k, tip: k }, tabindex: "0" },
        h("span", { class: "micro-top" },
          h("span", { class: "micro-name" }, meta.label, refs.flag),
          refs.amt, refs.pct
        ),
        h("span", { class: "meter meter-micro" + (meta.kind === "limit" ? " is-limit" : ""), "aria-hidden": "true" }, refs.fill)
      ));
      el.microRefs[k] = refs;
    });
  }

  /* ---------------- render ---------------- */

  function render(calc) {
    var st = S.get();
    var view = st.view;
    var n = view === "meal" ? calc.total : calc.per;
    var weight = view === "meal" ? calc.weight : calc.perWeight;
    var goal = st.goal;
    var empty = !calc.rows.length;
    el.root.classList.toggle("is-empty", empty);

    // segmented control
    ui.$$(".seg button", el.root).forEach(function (b) {
      var on = b.dataset.view === view;
      b.setAttribute("aria-selected", on ? "true" : "false");
      b.classList.toggle("is-on", on);
    });
    el.seg.style.setProperty("--i", view === "meal" ? 1 : 0);
    el.context.textContent = view === "meal"
      ? "Whole meal · " + calc.servings + (calc.servings === 1 ? " serving" : " servings")
      : "Per serving · 1 of " + calc.servings;

    // calorie meter
    var kp = pct("kcal", n.kcal) || 0;
    fx.tween(el.kcal, n.kcal, function (v) { return E.fmt(v); }, 800);
    el.kcalGoal.textContent = pctText(kp) + " of " + E.fmt(goal) + " kcal";
    var arc = Math.min(100, kp);
    el.ringFill.style.strokeDasharray = arc.toFixed(2) + " 100";
    el.ring.classList.toggle("is-over", kp > 100);
    el.ring.classList.toggle("is-zero", !(n.kcal > 0.5));
    el.kcal.classList.toggle("is-long", n.kcal >= 9999.5);
    el.ringFlag.hidden = kp <= 100;
    el.ring.setAttribute("aria-label", E.fmt(n.kcal) + " kilocalories, " + pctText(kp) + " of your daily goal");

    // macros
    var sp = E.energySplit(n);
    MACROS.forEach(function (m) {
      var refs = el.macroRefs[m.key];
      var p = pct(m.key, n[m.key]) || 0;
      fx.tween(refs.val, n[m.key], function (v) { return E.fmtNutrient(m.key, v); }, 700);
      refs.meter.style.width = Math.min(100, p).toFixed(2) + "%";
      refs.sub.textContent = sp.sum ? Math.round(sp[m.key] * 100) + "% of energy · " + pctText(p) + " DV" : pctText(p) + " DV";
    });
    ui.setBar(el.split, sp);
    el.split.setAttribute("aria-label", "Energy split: protein " + Math.round(sp.protein * 100) + "%, carbs " + Math.round(sp.carbs * 100) + "%, fat " + Math.round(sp.fat * 100) + "%");
    el.lastSplit = sp;
    el.lastN = n;

    // stats
    var sr = el.statRefs;
    fx.tween(sr.fiber.val, n.fiber, function (v) { return E.fmtNutrient("fiber", v); });
    sr.fiber.unit.textContent = " g";
    sr.fiber.sub.textContent = pctText(pct("fiber", n.fiber)) + " DV";
    fx.tween(sr.sugar.val, n.sugar, function (v) { return E.fmtNutrient("sugar", v); });
    sr.sugar.unit.textContent = " g";
    sr.sugar.sub.textContent = n.sugar > 0 ? "≈ " + E.fmt(n.sugar / 4.2, 1) + " tsp" : "none";
    fx.tween(sr.sodium.val, n.sodium, function (v) { return E.fmt(v); });
    sr.sodium.unit.textContent = " mg";
    var naP = pct("sodium", n.sodium);
    sr.sodium.sub.textContent = pctText(naP) + " of limit";
    var sev = severity("sodium", naP);
    sr.sodium.badge.hidden = !sev;
    if (sev) { ui.clear(sr.sodium.badge).appendChild(ui.icon("warn")); sr.sodium.badge.appendChild(document.createTextNode(sev === "critical" ? "High" : "Watch")); sr.sodium.badge.className = "stat-badge is-" + sev; }
    fx.tween(sr.weight.val, weight, function (v) { return E.fmt(v); });
    sr.weight.unit.textContent = " g";
    sr.weight.sub.textContent = weight > 0 ? E.fmt(n.kcal / weight * 100) + " kcal / 100 g" : "—";

    renderInsights(calc, view, goal);
    renderMicros(n);
    renderLabel(calc, view, n, weight);
    renderSources(calc);
  }

  function renderInsights(calc, view, goal) {
    ui.clear(el.insights);
    var list = calc.rows.length ? E.insights(calc, view, goal) : [];
    if (!list.length) {
      el.insights.appendChild(h("li", { class: "insight is-placeholder" },
        h("span", { class: "insight-ico" }, ui.icon("sparkle")),
        h("span", { class: "insight-text" },
          h("b", null, calc.rows.length ? "Balanced so far" : "Insights appear here"),
          h("span", null, calc.rows.length ? "Nothing stands out — add more to see how it shapes up." : "Add ingredients and Mise reads your plate: protein, fiber, sodium, vitamins and more.")
        )));
      return;
    }
    list.slice(0, 6).forEach(function (ins, i) {
      el.insights.appendChild(h("li", { class: "insight is-" + ins.tone, style: { "--d": (i * 50) + "ms" } },
        h("span", { class: "insight-ico" }, ui.icon(ins.tone === "good" ? "good" : ins.tone === "warn" ? "warn" : "info")),
        h("span", { class: "insight-text" }, h("b", null, ins.title), h("span", null, ins.detail))
      ));
    });
  }

  function renderMicros(n) {
    MICROS.forEach(function (k) {
      var refs = el.microRefs[k];
      var p = pct(k, n[k]);
      refs.amt.textContent = val(k, n[k]) + " " + unitOf(k);
      refs.pct.textContent = pctText(p);
      refs.fill.style.width = Math.min(100, p || 0).toFixed(2) + "%";
      var sev = severity(k, p);
      var meter = refs.fill.parentNode;
      meter.classList.toggle("is-warning", sev === "warning");
      meter.classList.toggle("is-critical", sev === "critical");
      meter.classList.toggle("is-over", (p || 0) > 100);
      refs.flag.hidden = !sev && !(E.NUTRIENT[k].kind === "good" && p >= 20);
      ui.clear(refs.flag);
      if (sev) { refs.flag.className = "micro-flag is-" + sev; refs.flag.appendChild(ui.icon("warn")); refs.flag.appendChild(document.createTextNode(sev === "critical" ? "High" : "Watch")); }
      else if (E.NUTRIENT[k].kind === "good" && p >= 20) { refs.flag.className = "micro-flag is-good"; refs.flag.appendChild(ui.icon("good")); refs.flag.appendChild(document.createTextNode("Rich")); }
    });
  }

  function labelRow(name, amount, p, cls) {
    return h("div", { class: "nf-row" + (cls ? " " + cls : "") },
      h("span", { class: "nf-name" }, name, amount ? h("span", { class: "nf-amt" }, " " + amount) : null),
      h("span", { class: "nf-pct" }, p == null ? "" : pctText(p)));
  }

  function renderLabel(calc, view, n, weight) {
    var goal = S.get().goal;
    var a = function (k) { return val(k, n[k]) + unitOf(k); };
    var P = function (k) { return pct(k, n[k]); };
    ui.clear(el.label);
    el.label.appendChild(h("div", { class: "nf" },
      h("div", { class: "nf-title" }, "Nutrition Facts"),
      h("div", { class: "nf-servings" }, calc.servings + (calc.servings === 1 ? " serving" : " servings") + " per meal"),
      h("div", { class: "nf-size" }, h("b", null, view === "meal" ? "Whole meal" : "Serving size"), h("b", null, E.fmt(weight) + " g")),
      h("div", { class: "nf-rule nf-rule-xl" }),
      h("div", { class: "nf-small" }, view === "meal" ? "Amount per meal" : "Amount per serving"),
      h("div", { class: "nf-cal" }, h("span", null, "Calories"), h("span", null, E.fmt(n.kcal))),
      h("div", { class: "nf-rule nf-rule-lg" }),
      h("div", { class: "nf-dvhead" }, "% Daily Value*"),
      labelRow("Total Fat", a("fat"), P("fat"), "is-strong"),
      labelRow("Saturated Fat", a("satfat"), P("satfat"), "is-indent"),
      labelRow("Cholesterol", a("chol"), P("chol"), "is-strong"),
      labelRow("Sodium", a("sodium"), P("sodium"), "is-strong"),
      labelRow("Total Carbohydrate", a("carbs"), P("carbs"), "is-strong"),
      labelRow("Dietary Fiber", a("fiber"), P("fiber"), "is-indent"),
      labelRow("Total Sugars", a("sugar"), null, "is-indent"),
      labelRow("Protein", a("protein"), P("protein"), "is-strong"),
      h("div", { class: "nf-rule nf-rule-xl" }),
      labelRow("Vitamin D", a("vitd"), P("vitd")),
      labelRow("Calcium", a("calcium"), P("calcium")),
      labelRow("Iron", a("iron"), P("iron")),
      labelRow("Potassium", a("potassium"), P("potassium")),
      labelRow("Vitamin A", a("vita"), P("vita")),
      labelRow("Vitamin C", a("vitc"), P("vitc")),
      labelRow("Magnesium", a("magnesium"), P("magnesium")),
      labelRow("Vitamin B12", a("b12"), P("b12")),
      h("div", { class: "nf-rule nf-rule-lg" }),
      h("p", { class: "nf-foot" }, "* The % Daily Value tells you how much a nutrient in a serving contributes to a daily diet. " +
        (goal === 2000 ? "2,000 calories a day is used for general nutrition advice." : "Calorie-linked values are scaled to your " + E.fmt(goal) + " kcal goal; vitamins & minerals use standard daily values."))
    ));
  }

  function renderSources(calc) {
    ui.clear(el.sources);
    var rows = calc.rows.filter(function (r) { return r.food && r.n.kcal > 0.05; });
    if (!rows.length) {
      el.sources.appendChild(h("li", { class: "src-empty" }, calc.rows.length ? "Everything on this plate is calorie-free." : "Where your calories come from will show here."));
      return;
    }
    rows.sort(function (a, b) { return b.n.kcal - a.n.kcal; });
    var max = rows[0].n.kcal;
    var total = calc.total.kcal || 1;
    rows.forEach(function (r, i) {
      var sp = E.energySplit(r.n);
      var w = (r.n.kcal / max) * 100;
      el.sources.appendChild(h("li", { class: "src", style: { "--d": (i * 40) + "ms" } },
        h("span", { class: "src-top" },
          h("span", { class: "src-emoji", "aria-hidden": "true" }, r.food.emoji),
          h("span", { class: "src-name" }, r.food.name, h("small", null, " " + r.food.type)),
          h("span", { class: "src-kcal" }, h("b", null, E.fmt(r.n.kcal)), " kcal · " + Math.round(r.n.kcal / total * 100) + "%")
        ),
        h("span", { class: "src-bar", style: { width: Math.max(2, w).toFixed(2) + "%" } },
          sp.protein > 0 ? h("i", { class: "seg-p", style: { "flex-grow": sp.protein }, dataset: { tip: "src", m: "protein", g: r.n.protein, k: sp.kcal.protein, name: r.food.name }, tabindex: "-1" }) : null,
          sp.carbs > 0 ? h("i", { class: "seg-c", style: { "flex-grow": sp.carbs }, dataset: { tip: "src", m: "carbs", g: r.n.carbs, k: sp.kcal.carbs, name: r.food.name }, tabindex: "-1" }) : null,
          sp.fat > 0 ? h("i", { class: "seg-f", style: { "flex-grow": sp.fat }, dataset: { tip: "src", m: "fat", g: r.n.fat, k: sp.kcal.fat, name: r.food.name }, tabindex: "-1" }) : null
        )
      ));
    });
  }

  /* ---------------- init ---------------- */

  function init() {
    el.root = document.getElementById("results");
    el.seg = el.root.querySelector(".seg");
    el.context = document.getElementById("res-context");
    el.ring = document.getElementById("kcal-ring");
    el.ringFill = el.ring.querySelector(".ring-fill");
    el.ringFlag = document.getElementById("kcal-over");
    el.kcal = document.getElementById("kcal");
    el.kcalGoal = document.getElementById("kcal-goal");
    el.macros = document.getElementById("macros");
    el.split = document.getElementById("split");
    el.stats = document.getElementById("stats");
    el.insights = document.getElementById("insights");
    el.micros = document.getElementById("micros");
    el.label = document.getElementById("nf-label");
    el.sources = document.getElementById("sources");
    buildMacros();
    buildStats();
    buildMicros();

    el.seg.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-view]");
      if (b) S.setView(b.dataset.view);
    });

    // tabs
    var tabs = ui.$$(".tabs [role=tab]", el.root);
    var thumb = el.root.querySelector(".tabs");
    function placeThumb() {
      var on = tabs.filter(function (t) { return t.getAttribute("aria-selected") === "true"; })[0];
      if (!on || !on.offsetWidth) return;
      thumb.style.setProperty("--tx", on.offsetLeft + "px");
      thumb.style.setProperty("--tw", on.offsetWidth + "px");
    }
    function selectTab(btn, focus) {
      tabs.forEach(function (t) {
        var on = t === btn;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
      placeThumb();
      if (focus) btn.focus();
    }
    placeThumb();
    root.addEventListener("resize", ui.debounce(placeThumb, 100));
    if ("ResizeObserver" in root) new ResizeObserver(placeThumb).observe(thumb); // thumb = the .tabs strip
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { selectTab(t); });
      t.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          selectTab(tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length], true);
        }
      });
    });

    // hover layers
    bindTips(el.split, function (t) {
      var m = t.dataset.m, sp = el.lastSplit, n = el.lastN;
      if (!sp || !n) return null;
      return [{ text: Math.round(sp[m] * 100) + "% of energy" }, { key: m === "protein" ? "p" : m === "carbs" ? "c" : "f", text: (m === "carbs" ? "Carbs" : m.charAt(0).toUpperCase() + m.slice(1)) + " · " + E.fmtNutrient(m, n[m]) + " g · " + E.fmt(sp.kcal[m]) + " kcal" }];
    });
    bindTips(el.sources, function (t) {
      var m = t.dataset.m;
      return [{ text: E.fmt(+t.dataset.k) + " kcal" }, { key: m === "protein" ? "p" : m === "carbs" ? "c" : "f", text: t.dataset.name + " · " + (m === "carbs" ? "Carbs" : m.charAt(0).toUpperCase() + m.slice(1)) + " " + E.fmtNutrient(m, +t.dataset.g) + " g" }];
    });
    bindTips(el.macros, function (t) {
      var k = t.dataset.tip, n = el.lastN;
      if (!n) return null;
      var dv = E.dvFor(k, S.get().goal);
      return [{ text: E.fmtNutrient(k, n[k]) + " g of " + E.fmt(dv) + " g" }, { text: "Daily value scales with your " + E.fmt(S.get().goal) + " kcal goal" }];
    });
    bindTips(el.micros, function (t) {
      var k = t.dataset.k, n = el.lastN;
      if (!n) return null;
      var meta = E.NUTRIENT[k], dv = E.dvFor(k, S.get().goal);
      return [{ text: val(k, n[k]) + " " + meta.unit + " of " + E.fmt(dv, dv < 10 ? 1 : 0) + " " + meta.unit }, { text: meta.kind === "limit" ? "Daily limit — lower is better" : "Daily value — higher is better" }];
    });
  }

  Mise.results = { init: init, render: render, hideTip: hideTip };
})(window);
