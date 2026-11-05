/*!
 * Mise — Sage's tip library section (carousel of clickable tips)
 */
(function (root) {
  "use strict";

  var Mise = root.Mise;
  var E = Mise.engine, ui = Mise.ui, h = ui.h, fx = Mise.fx;
  var TIPS = root.MiseTips || [];
  var CATS = root.MiseTipCategories || [];
  var cache = new Map();
  var el = {}, filter = "all";

  /** Nutrition of a tip's menu (cached). */
  function summary(tip) {
    if (cache.has(tip.id)) return cache.get(tip.id);
    var meal = { name: tip.menu.name, servings: tip.menu.servings || 1, items: tip.menu.items.map(function (x) { return { id: x[0], qty: x[1], unit: x[2] }; }) };
    var c = E.computeMeal(meal);
    cache.set(tip.id, c);
    return c;
  }

  function menuEmojis(tip, max) {
    var seen = {}, out = [];
    tip.menu.items.forEach(function (x) {
      var f = E.byId.get(x[0]);
      if (!f || seen[f.emoji] || f.group === "spice" || f.group === "sauce" || f.group === "fat") return;
      seen[f.emoji] = 1;
      out.push(f.emoji);
    });
    if (!out.length) tip.menu.items.forEach(function (x) { var f = E.byId.get(x[0]); if (f && !seen[f.emoji]) { seen[f.emoji] = 1; out.push(f.emoji); } });
    return out.slice(0, max || 5);
  }

  function catOf(key) {
    for (var i = 0; i < CATS.length; i++) if (CATS[i].key === key) return CATS[i];
    return { key: key, label: key, icon: "sparkle", hue: 150 };
  }

  function card(tip, i) {
    var c = summary(tip);
    var cat = catOf(tip.cat);
    var node = h("article", { class: "tip-card", role: "listitem", dataset: { tip: tip.id, reveal: "" }, style: { "--h": cat.hue, "--d": Math.min(i, 6) * 60 + "ms" } },
      h("div", { class: "tip-glow", "aria-hidden": "true" }),
      h("div", { class: "tip-top" },
        h("span", { class: "tip-cat" }, ui.icon(cat.icon), cat.label),
        h("span", { class: "tip-emojis", "aria-hidden": "true" }, menuEmojis(tip, 3).join(" "))
      ),
      h("h3", { class: "tip-title" }, tip.title),
      h("p", { class: "tip-body" }, tip.body),
      h("div", { class: "tip-menu" },
        h("span", { class: "tip-menu-label" }, "Menu"),
        h("span", { class: "tip-menu-name" }, tip.menu.name),
        h("span", { class: "tip-stats" },
          h("span", null, h("b", null, E.fmt(c.per.kcal)), " kcal"),
          h("span", null, h("b", null, E.fmt(c.per.protein)), " g protein"),
          h("span", null, h("b", null, E.fmtNutrient("fiber", c.per.fiber)), " g fiber")
        )
      ),
      h("button", { class: "tip-cta", type: "button", dataset: { tip: tip.id } }, "Calculate this menu", ui.icon("arrowRight"))
    );
    return node;
  }

  function renderFilters() {
    ui.clear(el.filters);
    var counts = {};
    TIPS.forEach(function (t) { counts[t.cat] = (counts[t.cat] || 0) + 1; });
    [{ key: "all", label: "All tips", icon: "sparkle", hue: 150 }].concat(CATS.filter(function (c) { return counts[c.key]; })).forEach(function (c) {
      var on = filter === c.key;
      el.filters.appendChild(h("button", { class: "chip" + (on ? " is-on" : ""), type: "button", "aria-pressed": on ? "true" : "false", dataset: { cat: c.key }, style: { "--h": c.hue } },
        ui.icon(c.icon), h("span", null, c.label), h("small", null, c.key === "all" ? TIPS.length : counts[c.key])));
    });
  }

  function renderRail() {
    ui.clear(el.rail);
    var list = TIPS.filter(function (t) { return filter === "all" || t.cat === filter; });
    list.forEach(function (t, i) {
      var c = card(t, i);
      el.rail.appendChild(c);
      fx.spotlight(c);
    });
    el.rail.scrollLeft = 0;
    fx.reveal(el.rail);
    updateNav();
  }

  function updateNav() {
    var max = el.rail.scrollWidth - el.rail.clientWidth - 4;
    el.prev.disabled = el.rail.scrollLeft <= 4;
    el.next.disabled = el.rail.scrollLeft >= max;
  }

  function page(dir) {
    var cardEl = el.rail.querySelector(".tip-card");
    var step = cardEl ? cardEl.getBoundingClientRect().width + 20 : 320;
    var n = Math.max(1, Math.floor(el.rail.clientWidth / step));
    el.rail.scrollBy({ left: dir * step * n, behavior: fx.reduced() ? "auto" : "smooth" });
  }

  function init() {
    el.root = document.getElementById("tips");
    if (!el.root) return;
    el.filters = document.getElementById("tip-filters");
    el.rail = document.getElementById("tip-rail");
    el.prev = document.getElementById("tip-prev");
    el.next = document.getElementById("tip-next");
    var count = document.getElementById("tip-count");
    if (count) count.textContent = TIPS.length;

    renderFilters();
    renderRail();

    el.filters.addEventListener("click", function (e) {
      var b = e.target.closest(".chip");
      if (!b) return;
      filter = b.dataset.cat;
      renderFilters();
      renderRail();
      var on = el.filters.querySelector(".chip.is-on");
      if (on && on.scrollIntoView) on.scrollIntoView({ block: "nearest", inline: "center", behavior: fx.reduced() ? "auto" : "smooth" });
    });
    el.rail.addEventListener("click", function (e) {
      var c = e.target.closest(".tip-card");
      if (c) Mise.app.loadTip(c.dataset.tip, c.querySelector(".tip-cta"));
    });
    el.rail.addEventListener("scroll", ui.debounce(updateNav, 60), { passive: true });
    el.prev.addEventListener("click", function () { page(-1); });
    el.next.addEventListener("click", function () { page(1); });
    root.addEventListener("resize", ui.debounce(updateNav, 120));
    var surprise = document.getElementById("tip-surprise");
    if (surprise) surprise.addEventListener("click", function () {
      var t = TIPS[Math.floor(Math.random() * TIPS.length)];
      if (t) Mise.app.loadTip(t.id, surprise);
    });
  }

  Mise.tipsUI = {
    init: init, summary: summary, menuEmojis: menuEmojis, catOf: catOf,
    get: function (id) { for (var i = 0; i < TIPS.length; i++) if (TIPS[i].id === id) return TIPS[i]; return null; },
    featured: function (n) {
      var f = TIPS.filter(function (t) { return t.featured; });
      return (f.length ? f : TIPS).slice(0, n || 4);
    }
  };
})(window);
