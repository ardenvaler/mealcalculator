/*!
 * Mise — app wiring
 */
(function (root) {
  "use strict";

  var Mise = root.Mise;
  var E = Mise.engine, S = Mise.store, ui = Mise.ui, h = ui.h, fx = Mise.fx;
  var $ = ui.$, $$ = ui.$$;
  var THEME_KEY = "mise:theme";
  var sheetMQ = root.matchMedia("(max-width: 1279.98px)");
  var aurora = null;
  var lastCalc = null;

  function calc() { return lastCalc || (lastCalc = E.computeMeal(S.get().meal)); }

  /* ---------------- theme ---------------- */

  function currentTheme() { return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light"; }

  function initTheme() {
    var btn = $("#theme-toggle");
    var sync = function () {
      var dark = currentTheme() === "dark";
      btn.setAttribute("aria-pressed", dark ? "true" : "false");
      btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    };
    sync();
    btn.addEventListener("click", function () {
      var next = currentTheme() === "dark" ? "light" : "dark";
      var r = btn.getBoundingClientRect();
      fx.switchTheme(next, r.left + r.width / 2, r.top + r.height / 2, function (name) {
        if (aurora) aurora.setTheme(name);
        try { localStorage.setItem(THEME_KEY, name); } catch (e) {}
        sync();
      });
    });
    var sys = root.matchMedia("(prefers-color-scheme: dark)");
    var onSys = function () {
      var saved = null;
      try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
      if (saved) return;
      fx.applyTheme(sys.matches ? "dark" : "light");
      if (aurora) aurora.setTheme(currentTheme());
      sync();
    };
    if (sys.addEventListener) sys.addEventListener("change", onSys);
  }

  /* ---------------- library sheet (narrow screens) ---------------- */

  var sheetAdded = 0;
  function isSheet() { return sheetMQ.matches; }

  function openLibrary() {
    var lib = $("#library");
    if (!isSheet()) { Mise.library.focusSearch(); return; }
    sheetAdded = 0;
    updateSheetDone();
    lib.classList.add("is-open");
    lib.setAttribute("role", "dialog");
    lib.setAttribute("aria-modal", "true");
    document.body.classList.add("has-sheet");
    $("#sheet-backdrop").classList.add("is-on");
    setTimeout(function () { Mise.library.focusSearch(); }, 280);
  }

  function closeLibrary() {
    var lib = $("#library");
    if (!lib.classList.contains("is-open")) return;
    lib.classList.remove("is-open");
    lib.removeAttribute("role");
    lib.removeAttribute("aria-modal");
    document.body.classList.remove("has-sheet");
    $("#sheet-backdrop").classList.remove("is-on");
    if (document.activeElement && lib.contains(document.activeElement)) document.activeElement.blur();
  }

  function updateSheetDone() {
    var b = $("#lib-done");
    if (!b) return;
    b.textContent = sheetAdded ? "Done · " + sheetAdded + " added" : "Done";
  }

  /* ---------------- actions ---------------- */

  function addFood(id, sourceEl, qty, unit) {
    var food = E.byId.get(id);
    if (!food) return;
    var item = S.addItem(id, qty, unit);
    if (!item) return;
    var lib = $("#library");
    if (isSheet() && lib.classList.contains("is-open")) {
      sheetAdded++;
      updateSheetDone();
      var done = $("#lib-done");
      if (sourceEl) fx.fly(sourceEl, done, food.emoji);
      fx.pulse(done, "is-bump");
      return;
    }
    requestAnimationFrame(function () {
      var target = Mise.plate.rowEmoji(item.uid);
      if (target && sourceEl) {
        target.style.visibility = "hidden";
        fx.fly(sourceEl, target, food.emoji);
        setTimeout(function () { target.style.visibility = ""; fx.pulse(target, "is-land"); }, fx.reduced() ? 0 : 760);
      }
      var row = target && target.closest(".row");
      if (row && row.scrollIntoView) {
        var r = row.getBoundingClientRect();
        if (r.bottom > root.innerHeight - 20 || r.top < 70) row.scrollIntoView({ block: "nearest", behavior: fx.reduced() ? "auto" : "smooth" });
      }
    });
  }

  function loadTip(id, sourceEl) {
    var tip = Mise.tipsUI.get(id);
    if (!tip) return;
    var snap = S.snapshot();
    var had = snap.items.length > 0;
    S.loadMeal({ name: tip.menu.name, servings: tip.menu.servings || 1, items: tip.menu.items }, "tip");
    fx.toast("Loaded “" + tip.menu.name + "”", had ? { icon: "sparkle", action: "Undo", onAction: function () { S.restore(snap); } } : { icon: "sparkle" });
    closeLibrary();
    scrollTo("build");
    setTimeout(function () { Mise.sage.sayAfterMenu(tip, calc()); }, 900);
  }

  function scrollTo(id) {
    var target = document.getElementById(id);
    if (!target) return;
    var r = target.getBoundingClientRect();
    if (r.top >= 0 && r.top < root.innerHeight * 0.35) return;
    target.scrollIntoView({ behavior: fx.reduced() ? "auto" : "smooth", block: "start" });
  }

  function saveMeal() {
    var m = S.get().meal;
    if (!m.items.length) { fx.toast("Add something to your plate first", { icon: "info" }); return; }
    var res = S.saveCurrent(m.name);
    fx.toast((res.replaced ? "Updated “" : "Saved “") + res.entry.name + "”", { icon: "bookmark", action: "View", onAction: openSaved });
  }

  function share() {
    var m = S.get().meal;
    if (!m.items.length) { fx.toast("Your plate is empty — nothing to share yet", { icon: "info" }); return; }
    var url = S.shareURL();
    var copied = function () { fx.toast("Link copied — anyone with it sees this plate", { icon: "link" }); };
    var copy = function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(copied, function () { fallbackCopy(url) ? copied() : fx.toast(url); });
      } else if (fallbackCopy(url)) copied();
      else fx.toast(url);
    };
    if (navigator.share && root.matchMedia("(pointer: coarse)").matches) {
      navigator.share({ title: m.name + " · Mise", url: url }).catch(function (err) { if (!err || err.name !== "AbortError") copy(); });
      return;
    }
    copy();
  }

  function fallbackCopy(text) {
    try {
      var ta = h("textarea", { style: { position: "fixed", opacity: "0", top: "0" } });
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch (e) { return false; }
  }

  function clearPlate() {
    var snap = S.snapshot();
    if (!snap.items.length) return;
    S.clear();
    fx.toast("Plate cleared", { icon: "trash", action: "Undo", onAction: function () { S.restore(snap); } });
  }

  /* ---------------- saved meals drawer ---------------- */

  function openSaved() {
    var d = $("#saved");
    renderSaved();
    d.hidden = false;
    requestAnimationFrame(function () { d.classList.add("is-open"); });
    document.body.classList.add("has-drawer");
    setTimeout(function () { var f = d.querySelector(".drawer-panel button"); if (f) f.focus(); }, 80);
  }

  function closeSaved() {
    var d = $("#saved");
    if (d.hidden) return;
    d.classList.remove("is-open");
    document.body.classList.remove("has-drawer");
    setTimeout(function () { d.hidden = true; }, 380);
  }

  function renderSaved() {
    var list = $("#saved-list");
    ui.clear(list);
    var saved = S.get().saved;
    $("#saved-count").textContent = saved.length ? saved.length + (saved.length === 1 ? " meal" : " meals") : "";
    if (!saved.length) {
      list.appendChild(h("li", { class: "saved-empty" },
        h("div", { class: "saved-empty-art", "aria-hidden": "true" }, "🍽️"),
        h("b", null, "No saved meals yet"),
        h("span", null, "Build a plate and tap the bookmark — it lives here, on this device.")));
      return;
    }
    saved.forEach(function (m) {
      var c = E.computeMeal({ servings: m.servings, items: S.sanitizeItems(m.items) });
      var emojis = [];
      m.items.forEach(function (x) { var f = E.byId.get(x[0]); if (f && emojis.indexOf(f.emoji) < 0 && f.group !== "spice") emojis.push(f.emoji); });
      var date = new Date(m.savedAt || Date.now());
      list.appendChild(h("li", { class: "saved-item" },
        h("span", { class: "saved-emojis", "aria-hidden": "true" }, emojis.slice(0, 3).join("")),
        h("span", { class: "saved-text" },
          h("b", null, m.name),
          h("span", null, E.fmt(c.per.kcal) + " kcal · P " + E.fmt(c.per.protein) + " · C " + E.fmt(c.per.carbs) + " · F " + E.fmt(c.per.fat) + " g" + (m.servings > 1 ? " · per serving" : "")),
          h("small", null, m.items.length + " ingredients · " + date.toLocaleDateString(undefined, { day: "numeric", month: "short" }))
        ),
        h("span", { class: "saved-actions" },
          h("button", { class: "btn btn-primary btn-sm", type: "button", dataset: { load: m.id } }, "Load"),
          h("button", { class: "icon-btn", type: "button", "aria-label": "Delete " + m.name, dataset: { del: m.id } }, ui.icon("trash"))
        )
      ));
    });
  }

  function initSaved() {
    $("#nav-saved").addEventListener("click", openSaved);
    $("#saved").addEventListener("click", function (e) {
      if (e.target.closest("[data-close]")) { closeSaved(); return; }
      var load = e.target.closest("[data-load]");
      if (load) {
        var m = S.getSaved(load.dataset.load);
        if (!m) return;
        var snap = S.snapshot();
        S.loadMeal(m, "saved");
        closeSaved();
        fx.toast("Loaded “" + m.name + "”", snap.items.length ? { icon: "bookmark", action: "Undo", onAction: function () { S.restore(snap); } } : { icon: "bookmark" });
        scrollTo("build");
        return;
      }
      var del = e.target.closest("[data-del]");
      if (del) {
        var entry = S.getSaved(del.dataset.del);
        S.deleteSaved(del.dataset.del);
        renderSaved();
        if (entry) fx.toast("Deleted “" + entry.name + "”", { icon: "trash", action: "Undo", onAction: function () { S.restoreSaved(entry); renderSaved(); } });
      }
    });
    $("#saved-current").addEventListener("click", function () { saveMeal(); renderSaved(); });
  }

  /* ---------------- goal popover ---------------- */

  function initGoal() {
    var btn = $("#goal-btn"), pop = $("#goal-pop"), input = $("#goal-input");
    var sync = function () {
      $("#goal-value").textContent = E.fmt(S.get().goal);
      if (document.activeElement !== input) input.value = S.get().goal;
      $$(".goal-presets button", pop).forEach(function (b) { b.classList.toggle("is-on", +b.dataset.goal === S.get().goal); });
    };
    var openPop = function () {
      pop.hidden = false;
      btn.setAttribute("aria-expanded", "true");
      requestAnimationFrame(function () { pop.classList.add("is-open"); });
      setTimeout(function () { input.focus(); input.select(); }, 60);
    };
    var closePop = function () {
      if (pop.hidden) return;
      pop.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
      setTimeout(function () { pop.hidden = true; }, 200);
    };
    btn.addEventListener("click", function (e) { e.stopPropagation(); if (pop.hidden) openPop(); else closePop(); });
    document.addEventListener("click", function (e) { if (!pop.hidden && !pop.contains(e.target) && e.target !== btn) closePop(); });
    pop.addEventListener("click", function (e) {
      var b = e.target.closest("[data-goal]");
      if (b) { S.setGoal(+b.dataset.goal); sync(); }
    });
    input.addEventListener("change", function () {
      var v = Math.round(+input.value);
      if (v >= 800 && v <= 6000) S.setGoal(v);
      sync();
    });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") { input.dispatchEvent(new Event("change")); closePop(); } });
    pop.addEventListener("keydown", function (e) { if (e.key === "Escape") { closePop(); btn.focus(); } });
    S.subscribe(function (s, ch) { if (ch.type === "goal") sync(); });
    sync();
    return closePop;
  }

  /* ---------------- hero ---------------- */

  var DEFAULT_ORBIT = ["🥦", "🍗", "🥑", "🍚", "🍅", "🥚", "🐟", "🥕", "🫘", "🍋", "🧄", "🌶️"];
  var orbitSig = "";

  function updateHero(c) {
    var kcalEl = $("#disc-kcal");
    if (!kcalEl) return;
    fx.tween(kcalEl, c.per.kcal, function (v) { return E.fmt(v); }, 900);
    $("#disc-label").textContent = c.rows.length ? (c.servings > 1 ? "kcal per serving" : "kcal on your plate") : "kcal · add ingredients";
    ui.setBar($("#disc-bar"), c.split);

    var emojis = [];
    c.rows.forEach(function (r) { if (r.food && emojis.indexOf(r.food.emoji) < 0) emojis.push(r.food.emoji); });
    DEFAULT_ORBIT.forEach(function (e) { if (emojis.length < 12 && emojis.indexOf(e) < 0) emojis.push(e); });
    var sig = emojis.join("");
    if (sig === orbitSig) return;
    orbitSig = sig;
    var inner = emojis.slice(0, 5), outer = emojis.slice(5, 12);
    [["#orbit-1", inner], ["#orbit-2", outer]].forEach(function (pair) {
      var track = $(pair[0]);
      ui.clear(track);
      pair[1].forEach(function (e, i) {
        track.appendChild(h("span", { class: "orbit-item", style: { "--a": (360 / pair[1].length * i) + "deg", "--i": i } }, h("span", { class: "orbit-emoji" }, e)));
      });
    });
  }

  function initHero() {
    var hero = $("#hero");
    if (!hero) return;
    fx.tilt($("#orbit"), 10);
    var tipsCount = (root.MiseTips || []).length;
    $("#stat-foods").dataset.count = E.foods.length;
    $("#stat-tips").dataset.count = tipsCount;
    $("#foot-count").textContent = E.fmt(E.foods.length);
    $("#foot-version").textContent = (root.MiseDB && root.MiseDB.version) || "1.0";
    // count-up stats
    var stats = $$("[data-count]");
    var started = false;
    var run = function () {
      if (started) return;
      started = true;
      stats.forEach(function (s, i) {
        var to = +s.dataset.count;
        s._v = 0;
        setTimeout(function () { fx.tween(s, to, function (v) { return E.fmt(v); }, 1400); }, i * 120);
      });
    };
    if ("IntersectionObserver" in root) {
      var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { run(); io.disconnect(); } }, { threshold: 0.3 });
      io.observe($("#hero-stats"));
    } else run();

    // scroll-linked fade
    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var p = Math.max(0, Math.min(1, root.scrollY / (hero.offsetHeight * 0.9)));
        hero.style.setProperty("--p", p.toFixed(3));
        document.body.classList.toggle("is-scrolled", root.scrollY > 8);
        document.body.classList.toggle("is-past-hero", root.scrollY > hero.offsetHeight * 0.45);
      });
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------------- dock (narrow screens) ---------------- */

  function updateDock(c) {
    var n = c.per;
    var k = $("#dock-kcal");
    if (!k) return;
    fx.tween(k, n.kcal, function (v) { return E.fmt(v); }, 600);
    $("#dock-macros").textContent = "P " + E.fmt(n.protein) + " · C " + E.fmt(n.carbs) + " · F " + E.fmt(n.fat) + " g";
    ui.setBar($("#dock-bar"), c.split);
  }

  /* ---------------- nav ---------------- */

  function initNav() {
    var links = $$(".nav-links a[href^='#']");
    if (!("IntersectionObserver" in root)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) {
          if (a.getAttribute("href") === "#" + e.target.id) a.setAttribute("aria-current", "true");
          else a.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["hero", "build", "tips"].forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ---------------- boot ---------------- */

  function render(state, change) {
    lastCalc = E.computeMeal(state.meal);
    var c = lastCalc;
    Mise.plate.render(c, change);
    Mise.results.render(c);
    updateHero(c);
    updateDock(c);
    if (aurora) aurora.setMood(c.split, Math.min(1, c.per.kcal / 900));
  }

  function boot() {
    var canvas = $("#aurora");
    if (canvas && canvas.getContext) {
      aurora = fx.Aurora(canvas);
      aurora.setTheme(currentTheme());
    }
    initTheme();
    Mise.library.init();
    Mise.plate.init();
    Mise.results.init();
    Mise.tipsUI.init();
    Mise.plate.renderEmptyStarters(Mise.tipsUI.featured(4));
    initSaved();
    var closeGoal = initGoal();
    initHero();
    initNav();

    // shared link? (on load, and when a link is pasted into an open tab)
    var importShared = function (delay) {
      var shared = S.parseHash(root.location.hash);
      if (!shared) return;
      var snap = S.snapshot();
      S.loadMeal(shared, "share");
      try { history.replaceState(null, "", root.location.pathname + root.location.search); } catch (e) {}
      setTimeout(function () {
        fx.toast("Opened a shared plate: “" + S.get().meal.name + "”", snap.items.length ? { icon: "link", action: "Undo", onAction: function () { S.restore(snap); } } : { icon: "link" });
      }, delay);
    };
    importShared(600);
    root.addEventListener("hashchange", function () { importShared(0); scrollTo("build"); });

    S.subscribe(render);
    render(S.get(), { type: "load", reason: "boot" });
    Mise.sage.init();

    // buttons
    $$("[data-open-library]").forEach(function (b) { b.addEventListener("click", function () { if (!isSheet()) scrollTo("build"); openLibrary(); }); });
    $("#lib-done").addEventListener("click", closeLibrary);
    $("#sheet-backdrop").addEventListener("click", closeLibrary);
    $("#btn-save").addEventListener("click", saveMeal);
    $("#btn-share").addEventListener("click", share);
    $("#btn-clear").addEventListener("click", clearPlate);
    $("#dock-summary").addEventListener("click", function () { scrollTo("results"); });
    $$("[data-scroll]").forEach(function (a) {
      a.addEventListener("click", function (e) { e.preventDefault(); var id = a.dataset.scroll; var t = document.getElementById(id); if (t) t.scrollIntoView({ behavior: fx.reduced() ? "auto" : "smooth", block: "start" }); });
    });
    var sageBtn = $("#hero-sage");
    if (sageBtn) sageBtn.addEventListener("click", function () {
      var all = root.MiseTips || [];
      if (all.length) Mise.sage.sayTip(all[Math.floor(Math.random() * all.length)]);
    });
    sheetMQ.addEventListener && sheetMQ.addEventListener("change", function () { if (!isSheet()) closeLibrary(); });

    // keyboard
    document.addEventListener("keydown", function (e) {
      var k = e.key;
      if ((k === "k" || k === "K") && (e.metaKey || e.ctrlKey)) { e.preventDefault(); if (!isSheet()) scrollTo("build"); openLibrary(); return; }
      if (k === "/" && !ui.isTyping()) { e.preventDefault(); if (!isSheet()) scrollTo("build"); openLibrary(); return; }
      if (k === "Escape") { closeLibrary(); closeSaved(); closeGoal(); Mise.results.hideTip(); }
    });

    fx.reveal(document);
    $$(".panel").forEach(fx.spotlight);
    document.documentElement.classList.add("is-ready");
  }

  Mise.app = { calc: calc, addFood: addFood, loadTip: loadTip, saveMeal: saveMeal, scrollTo: scrollTo, openLibrary: openLibrary, closeLibrary: closeLibrary };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window);
