/*!
 * Mise — ingredient library panel
 * Search, group/sub-group filters, families with their types, drag & drop.
 */
(function (root) {
  "use strict";

  var Mise = root.Mise;
  var E = Mise.engine, ui = Mise.ui, h = ui.h, fx = Mise.fx;
  var PAGE = 40;

  var el = {}, state = { group: "all", sub: null, query: "", results: [], shown: 0, open: null };
  var sentinelObserver = null;

  function hueOf(group) { var g = E.groupByKey.get(group); return g ? g.hue : 200; }

  function kcalRange(fam) {
    var lo = Math.round(fam.kcalLo), hi = Math.round(fam.kcalHi);
    return lo === hi ? E.fmt(lo) : E.fmt(lo) + "–" + E.fmt(hi);
  }

  function macroLine(f) {
    return "P " + E.fmtNutrient("protein", f.n.protein) + " · C " + E.fmtNutrient("carbs", f.n.carbs) + " · F " + E.fmtNutrient("fat", f.n.fat);
  }

  /* ---------------- chips ---------------- */

  function renderGroups() {
    ui.clear(el.groups);
    var counts = {};
    E.foods.forEach(function (f) { counts[f.group] = (counts[f.group] || 0) + 1; });
    var all = [{ key: "all", label: "All", short: "All", hue: 150 }].concat(E.groups.filter(function (g) { return counts[g.key]; }));
    all.forEach(function (g) {
      var on = state.group === g.key;
      el.groups.appendChild(h("button", {
        class: "chip" + (on ? " is-on" : ""), type: "button", role: "tab",
        "aria-selected": on ? "true" : "false", dataset: { group: g.key },
        style: { "--h": g.hue },
        title: g.label + (counts[g.key] ? " · " + counts[g.key] : "")
      }, ui.icon(g.key === "all" ? "all" : g.key), h("span", null, g.short || g.label)));
    });
  }

  function renderSubs() {
    ui.clear(el.subs);
    if (state.group === "all") { el.subs.hidden = true; return; }
    var g = E.groupByKey.get(state.group);
    var present = {};
    E.families.forEach(function (f) { if (f.group === g.key) present[f.sub] = (present[f.sub] || 0) + 1; });
    var subs = g.subs.filter(function (s) { return present[s]; });
    if (subs.length < 2) { el.subs.hidden = true; return; }
    el.subs.hidden = false;
    [null].concat(subs).forEach(function (s) {
      var on = state.sub === s;
      el.subs.appendChild(h("button", {
        class: "subchip" + (on ? " is-on" : ""), type: "button", "aria-pressed": on ? "true" : "false",
        dataset: { sub: s || "" }
      }, s || "All " + (g.short || g.label).toLowerCase()));
    });
  }

  /* ---------------- recently used ---------------- */

  function renderRecent() {
    if (!el.recent) return;
    var ids = Mise.store.get().recent || [];
    var show = !state.query && state.group === "all" && ids.length > 0;
    el.recent.hidden = !show;
    if (!show) return;
    var sig = ids.join(",");
    if (el.recent.dataset.sig === sig) return;
    el.recent.dataset.sig = sig;
    ui.clear(el.recent);
    el.recent.appendChild(h("span", { class: "recent-label" }, "Recent"));
    ids.forEach(function (id) {
      var f = E.byId.get(id);
      if (!f) return;
      el.recent.appendChild(h("button", { class: "recent", type: "button", dataset: { id: id }, title: "Add " + f.name + " — " + f.type },
        h("span", { class: "recent-emoji", "aria-hidden": "true" }, f.emoji), h("span", null, f.name)));
    });
  }

  /* ---------------- list ---------------- */

  function famNode(res) {
    var fam = res.family, match = res.match;
    var many = fam.variants.length > 1;
    var meta = state.query && match && many ? match.type : fam.sub + (many ? " · " + fam.variants.length + " types" : " · " + fam.variants[0].type);
    var node = h("div", { class: "fam", role: "listitem", dataset: { key: fam.key }, style: { "--h": hueOf(fam.group) } },
      h("button", {
        class: "fam-main", type: "button", draggable: "true",
        "aria-expanded": many ? "false" : null,
        dataset: { id: match.id },
        title: many ? "Show types" : "Add to plate"
      },
        h("span", { class: "fam-emoji" }, fam.emoji),
        h("span", { class: "fam-text" },
          h("span", { class: "fam-name" }, fam.name),
          h("span", { class: "fam-meta" }, meta)
        ),
        h("span", { class: "fam-kcal" }, h("b", null, kcalRange(fam)), h("small", null, "kcal/100g")),
        many ? ui.icon("chevronDown", "fam-chev") : null
      ),
      h("button", { class: "fam-add", type: "button", "aria-label": "Add " + fam.name + " (" + match.type + ")", dataset: { id: match.id } }, ui.icon("plus"))
    );
    return node;
  }

  function typesNode(fam) {
    var wrap = h("div", { class: "fam-types", role: "group", "aria-label": fam.name + " types" });
    fam.variants.forEach(function (v) {
      wrap.appendChild(h("button", { class: "type", type: "button", dataset: { id: v.id }, draggable: "true", title: "Add " + v.name + " — " + v.type },
        h("span", { class: "type-name" }, v.type),
        h("span", { class: "type-macros" }, macroLine(v)),
        h("span", { class: "type-kcal" }, h("b", null, E.fmt(v.n.kcal)), " kcal"),
        ui.icon("plus", "type-plus")
      ));
    });
    return wrap;
  }

  function renderList(reset) {
    if (reset) renderRecent();
    if (reset) {
      state.results = E.search(state.query, { group: state.group, sub: state.sub });
      state.shown = 0;
      ui.clear(el.list);
      el.list.scrollTop = 0;
      state.open = null;
      var n = state.results.length;
      el.status.textContent = state.query
        ? (n ? (state.results.fuzzy ? "Close matches for “" + state.query + "”" : n + " match" + (n === 1 ? "" : "es")) : "")
        : "";
      if (!n) {
        el.list.appendChild(h("div", { class: "lib-empty" },
          h("div", { class: "lib-empty-emoji", "aria-hidden": "true" }, "🔍"),
          h("p", null, h("b", null, "No match for “" + state.query + "”.")),
          h("p", null, "Try another spelling or a local name — ", h("i", null, "kangkung, tempe, bayam, santan"), ".")
        ));
        return;
      }
    }
    var frag = document.createDocumentFragment();
    var end = Math.min(state.results.length, state.shown + PAGE);
    for (var i = state.shown; i < end; i++) {
      var node = famNode(state.results[i]);
      node.style.setProperty("--d", ((i - state.shown) * 18) + "ms");
      frag.appendChild(node);
    }
    state.shown = end;
    var old = el.list.querySelector(".lib-sentinel");
    if (old) old.remove();
    el.list.appendChild(frag);
    if (state.shown < state.results.length) {
      var s = h("div", { class: "lib-sentinel", "aria-hidden": "true" });
      el.list.appendChild(s);
      if (sentinelObserver) sentinelObserver.observe(s);
    }
  }

  function toggleFamily(node) {
    var fam = E.familyByKey.get(node.dataset.key);
    if (!fam) return;
    var btn = node.querySelector(".fam-main");
    var open = node.classList.contains("is-open");
    // close others
    ui.$$(".fam.is-open", el.list).forEach(function (n) {
      if (n === node) return;
      n.classList.remove("is-open");
      n.querySelector(".fam-main").setAttribute("aria-expanded", "false");
      var t = n.querySelector(".fam-types");
      if (t) t.remove();
    });
    if (open) {
      node.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
      var t = node.querySelector(".fam-types");
      if (t) t.remove();
      return;
    }
    node.classList.add("is-open");
    btn.setAttribute("aria-expanded", "true");
    var types = typesNode(fam);
    node.appendChild(types);
    // keep the opened family visible inside the scroll area
    requestAnimationFrame(function () {
      var lr = el.list.getBoundingClientRect(), nr = node.getBoundingClientRect();
      if (nr.bottom > lr.bottom) el.list.scrollBy({ top: nr.bottom - lr.bottom + 12, behavior: fx.reduced() ? "auto" : "smooth" });
    });
  }

  /* ---------------- events ---------------- */

  function onListClick(e) {
    var add = e.target.closest(".fam-add, .type");
    if (add) {
      var emoji = add.closest(".fam").querySelector(".fam-emoji");
      Mise.app.addFood(add.dataset.id, emoji);
      if (add.classList.contains("type")) fx.pulse(add, "is-added");
      else fx.pulse(add, "is-added");
      return;
    }
    var main = e.target.closest(".fam-main");
    if (main) {
      var node = main.closest(".fam");
      var fam = E.familyByKey.get(node.dataset.key);
      if (fam && fam.variants.length > 1) toggleFamily(node);
      else { Mise.app.addFood(main.dataset.id, node.querySelector(".fam-emoji")); fx.pulse(node.querySelector(".fam-add"), "is-added"); }
    }
  }

  function onKeyDown(e) {
    var t = e.target;
    if (t === el.search) {
      if (e.key === "ArrowDown") { var first = el.list.querySelector(".fam-main"); if (first) { e.preventDefault(); first.focus(); } }
      else if (e.key === "Enter") {
        var top = el.list.querySelector(".fam-add");
        if (top) { e.preventDefault(); Mise.app.addFood(top.dataset.id, top.closest(".fam").querySelector(".fam-emoji")); fx.pulse(top, "is-added"); }
      } else if (e.key === "Escape" && el.search.value) { e.stopPropagation(); setQuery(""); }
      return;
    }
    if (!t.closest || !t.closest("#lib-list")) return;
    var focusables = ui.$$(".fam-main, .type", el.list);
    var i = focusables.indexOf(t);
    if (e.key === "ArrowDown" && i >= 0) { e.preventDefault(); (focusables[i + 1] || t).focus(); }
    else if (e.key === "ArrowUp" && i >= 0) { e.preventDefault(); if (i === 0) el.search.focus(); else focusables[i - 1].focus(); }
    else if (e.key === "ArrowRight" && t.classList.contains("fam-main") && t.getAttribute("aria-expanded") === "false") { e.preventDefault(); toggleFamily(t.closest(".fam")); }
    else if (e.key === "ArrowLeft") {
      var fam = t.closest(".fam");
      if (fam && fam.classList.contains("is-open")) { e.preventDefault(); toggleFamily(fam); fam.querySelector(".fam-main").focus(); }
    }
  }

  function onDragStart(e) {
    var src = e.target.closest && e.target.closest(".fam-main, .type");
    if (!src || !e.dataTransfer) return;
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("application/x-mise-food", src.dataset.id);
    e.dataTransfer.setData("text/plain", src.dataset.id);
    document.body.classList.add("is-dragging");
  }

  function setQuery(q) {
    state.query = q;
    el.search.value = q;
    el.clearBtn.hidden = !q;
    renderList(true);
  }

  function setGroup(g) {
    state.group = g;
    state.sub = null;
    renderGroups();
    renderSubs();
    renderList(true);
    var on = el.groups.querySelector(".chip.is-on");
    if (on && on.scrollIntoView) on.scrollIntoView({ block: "nearest", inline: "center", behavior: fx.reduced() ? "auto" : "smooth" });
  }

  function init() {
    el.root = document.getElementById("library");
    el.search = document.getElementById("lib-search");
    el.clearBtn = document.getElementById("lib-clear");
    el.groups = document.getElementById("lib-groups");
    el.subs = document.getElementById("lib-subs");
    el.list = document.getElementById("lib-list");
    el.status = document.getElementById("lib-status");
    el.recent = document.getElementById("lib-recent");
    if (el.recent) {
      el.recent.addEventListener("click", function (e) {
        var b = e.target.closest(".recent");
        if (!b) return;
        Mise.app.addFood(b.dataset.id, b.querySelector(".recent-emoji"));
        fx.pulse(b, "is-added");
      });
      Mise.store.subscribe(function (s, ch) { if (ch.type === "add") renderRecent(); });
    }
    var count = document.getElementById("lib-count");
    if (count) count.textContent = E.fmt(E.foods.length);
    el.search.placeholder = "Search " + E.fmt(Math.floor(E.foods.length / 10) * 10) + "+ ingredients…";

    if ("IntersectionObserver" in root) {
      sentinelObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { sentinelObserver.unobserve(en.target); renderList(false); } });
      }, { root: el.list, rootMargin: "200px" });
    }

    var onInput = ui.debounce(function () { state.query = el.search.value.trim(); el.clearBtn.hidden = !state.query; renderList(true); }, 90);
    el.search.addEventListener("input", onInput);
    el.clearBtn.addEventListener("click", function () { setQuery(""); el.search.focus(); });
    el.groups.addEventListener("click", function (e) { var c = e.target.closest(".chip"); if (c) setGroup(c.dataset.group); });
    el.subs.addEventListener("click", function (e) {
      var c = e.target.closest(".subchip");
      if (!c) return;
      state.sub = c.dataset.sub || null;
      renderSubs();
      renderList(true);
    });
    el.list.addEventListener("click", onListClick);
    el.root.addEventListener("keydown", onKeyDown);
    el.list.addEventListener("dragstart", onDragStart);
    document.addEventListener("dragend", function () { document.body.classList.remove("is-dragging"); });

    renderGroups();
    renderSubs();
    renderList(true);
  }

  Mise.library = {
    init: init,
    focusSearch: function () { if (el.search) { el.search.focus({ preventScroll: true }); el.search.select(); } },
    setQuery: setQuery,
    setGroup: setGroup
  };
})(window);
