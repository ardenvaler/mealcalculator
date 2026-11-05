/*!
 * Mise — app state, persistence (localStorage) and share links.
 */
(function (root) {
  "use strict";

  var Mise = root.Mise;
  var E = Mise.engine;
  var STORAGE_KEY = "mise:v1";

  var seq = 0;
  function uid() { return "i" + Date.now().toString(36) + (seq++).toString(36); }

  function blankMeal() { return { name: "My plate", servings: 1, items: [] }; }

  var state = {
    meal: blankMeal(),
    view: "serving",     // "serving" | "meal"
    goal: 2000,          // daily kcal goal
    sageAuto: true,      // Sage rotates tips automatically
    recent: [],          // recently added food ids, newest first
    saved: []            // [{ id, name, servings, items: [[id, qty, unit]], savedAt }]
  };

  /* ---------------- persistence ---------------- */

  function sanitizeItems(list) {
    var out = [];
    (list || []).forEach(function (x) {
      var id = Array.isArray(x) ? x[0] : x && x.id;
      var qty = +(Array.isArray(x) ? x[1] : x && x.qty);
      var unit = Array.isArray(x) ? x[2] : x && x.unit;
      var food = E.byId.get(id);
      if (!food || !(qty >= 0) || qty > 100000) return;
      if (!E.unitValid(food, unit)) {
        var d = E.defaultAmount(food);
        unit = d.unit; qty = d.qty;
      }
      out.push({ uid: uid(), id: id, qty: qty, unit: unit });
    });
    return out;
  }

  function load() {
    try {
      var raw = root.localStorage && root.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var s = JSON.parse(raw);
      if (s.meal) {
        state.meal = {
          name: typeof s.meal.name === "string" ? s.meal.name.slice(0, 80) : "My plate",
          servings: clampServings(s.meal.servings),
          items: sanitizeItems(s.meal.items)
        };
      }
      if (s.view === "meal" || s.view === "serving") state.view = s.view;
      if (+s.goal >= 800 && +s.goal <= 6000) state.goal = Math.round(+s.goal);
      if (typeof s.sageAuto === "boolean") state.sageAuto = s.sageAuto;
      if (Array.isArray(s.recent)) state.recent = s.recent.filter(function (id) { return E.byId.has(id); }).slice(0, 12);
      if (Array.isArray(s.saved)) {
        state.saved = s.saved.filter(function (m) { return m && typeof m.name === "string" && Array.isArray(m.items); }).slice(0, 200);
      }
    } catch (e) { /* storage unavailable or corrupt — start fresh */ }
  }

  var saveTimer = null;
  function persist() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try {
        root.localStorage.setItem(STORAGE_KEY, JSON.stringify({
          meal: { name: state.meal.name, servings: state.meal.servings, items: state.meal.items.map(pack) },
          view: state.view, goal: state.goal, sageAuto: state.sageAuto, saved: state.saved, recent: state.recent
        }));
      } catch (e) { /* private mode etc. */ }
    }, 200);
  }

  function pack(it) { return [it.id, +E.fmtQty(it.qty), it.unit]; }
  function clampServings(s) { s = Math.round(+s || 1); return Math.min(50, Math.max(1, s)); }

  /* ---------------- pub/sub ---------------- */

  var subs = [];
  function subscribe(fn) { subs.push(fn); return function () { subs = subs.filter(function (f) { return f !== fn; }); }; }
  function emit(change) {
    for (var i = 0; i < subs.length; i++) {
      try { subs[i](state, change || {}); } catch (e) { if (root.console) console.error(e); }
    }
    persist();
  }

  /* ---------------- undo ---------------- */

  function snapshot() {
    return { name: state.meal.name, servings: state.meal.servings, items: state.meal.items.map(function (i) { return { uid: i.uid, id: i.id, qty: i.qty, unit: i.unit }; }) };
  }
  function restore(snap) {
    state.meal = { name: snap.name, servings: snap.servings, items: snap.items.map(function (i) { return { uid: i.uid, id: i.id, qty: i.qty, unit: i.unit }; }) };
    emit({ type: "load", reason: "undo" });
  }

  /* ---------------- plate actions ---------------- */

  function addItem(id, qty, unit) {
    var food = E.byId.get(id);
    if (!food) return null;
    var d = E.defaultAmount(food);
    var item = { uid: uid(), id: id, qty: qty != null ? +qty : d.qty, unit: unit && E.unitValid(food, unit) ? unit : d.unit };
    state.meal.items.push(item);
    state.recent = [id].concat(state.recent.filter(function (r) { return r !== id; })).slice(0, 12);
    emit({ type: "add", uid: item.uid });
    return item;
  }

  function findItem(u) {
    for (var i = 0; i < state.meal.items.length; i++) if (state.meal.items[i].uid === u) return state.meal.items[i];
    return null;
  }

  function updateItem(u, patch) {
    var it = findItem(u);
    if (!it) return;
    var food = E.byId.get(patch.id || it.id);
    if (patch.id && patch.id !== it.id) {
      // switching type: keep the same amount if the unit still makes sense
      if (!E.unitValid(food, it.unit)) {
        var grams = E.toGrams(E.byId.get(it.id), it.qty, it.unit);
        it.unit = "g";
        it.qty = E.niceQty(grams, "g");
      }
      it.id = patch.id;
    }
    if (patch.unit && patch.unit !== it.unit && E.unitValid(food, patch.unit)) {
      var g = E.toGrams(food, it.qty, it.unit);
      var q = E.niceQty(E.fromGrams(food, g, patch.unit), patch.unit);
      it.unit = patch.unit;
      it.qty = q > 0 ? q : E.defaultAmount(food).qty;
    }
    if (patch.qty != null) {
      var v = +patch.qty;
      it.qty = isFinite(v) && v >= 0 ? Math.min(v, 100000) : it.qty;
    }
    emit({ type: "update", uid: u, field: patch.id ? "type" : patch.unit ? "unit" : "qty" });
  }

  function removeItem(u) {
    var before = state.meal.items.length;
    state.meal.items = state.meal.items.filter(function (i) { return i.uid !== u; });
    if (state.meal.items.length !== before) emit({ type: "remove", uid: u });
  }

  function clear() {
    state.meal = { name: state.meal.name, servings: state.meal.servings, items: [] };
    emit({ type: "load", reason: "clear" });
  }

  function loadMeal(meal, reason) {
    state.meal = {
      name: (meal.name || "My plate").slice(0, 80),
      servings: clampServings(meal.servings),
      items: sanitizeItems(meal.items)
    };
    emit({ type: "load", reason: reason || "menu" });
  }

  function setName(name) { state.meal.name = String(name || "").slice(0, 80); emit({ type: "meta" }); }
  function setServings(s) { state.meal.servings = clampServings(s); emit({ type: "meta", field: "servings" }); }
  function setView(v) { state.view = v === "meal" ? "meal" : "serving"; emit({ type: "view" }); }
  function setGoal(g) { g = Math.round(+g); if (g >= 800 && g <= 6000) { state.goal = g; emit({ type: "goal" }); } }
  function setSageAuto(on) { state.sageAuto = !!on; emit({ type: "sage" }); }

  /* ---------------- saved meals ---------------- */

  function saveCurrent(name) {
    var m = state.meal;
    var entry = {
      id: "m" + Date.now().toString(36),
      name: (name || m.name || "My plate").slice(0, 80),
      servings: m.servings,
      items: m.items.map(pack),
      savedAt: Date.now()
    };
    // overwrite an existing meal with the same name
    var idx = -1;
    state.saved.forEach(function (s, i) { if (s.name.toLowerCase() === entry.name.toLowerCase()) idx = i; });
    if (idx >= 0) { entry.id = state.saved[idx].id; state.saved.splice(idx, 1); }
    state.saved.unshift(entry);
    emit({ type: "saved" });
    return { entry: entry, replaced: idx >= 0 };
  }

  function deleteSaved(id) {
    state.saved = state.saved.filter(function (s) { return s.id !== id; });
    emit({ type: "saved" });
  }

  function restoreSaved(entry) {
    if (!entry || getSaved(entry.id)) return;
    state.saved.unshift(entry);
    state.saved.sort(function (a, b) { return (b.savedAt || 0) - (a.savedAt || 0); });
    emit({ type: "saved" });
  }

  function getSaved(id) {
    for (var i = 0; i < state.saved.length; i++) if (state.saved[i].id === id) return state.saved[i];
    return null;
  }

  /* ---------------- share links ---------------- */

  function shareURL() {
    var m = state.meal;
    var items = m.items.map(function (it) {
      return [it.id, E.fmtQty(it.qty), encodeURIComponent(it.unit)].join("~");
    }).join(",");
    var hash = "n=" + encodeURIComponent(m.name) + "&s=" + m.servings + "&i=" + items;
    var base = root.location.href.split("#")[0];
    return base + "#" + hash;
  }

  function parseHash(hash) {
    hash = (hash || "").replace(/^#/, "");
    if (!/(^|&)i=/.test(hash)) return null;
    var out = { name: "Shared plate", servings: 1, items: [] };
    hash.split("&").forEach(function (part) {
      var eq = part.indexOf("=");
      if (eq < 0) return;
      var k = part.slice(0, eq), v = part.slice(eq + 1);
      try {
        if (k === "n") out.name = decodeURIComponent(v).slice(0, 80) || out.name;
        else if (k === "s") out.servings = clampServings(v);
        else if (k === "i") {
          out.items = v.split(",").filter(Boolean).map(function (t) {
            var f = t.split("~");
            return [f[0], +f[1], decodeURIComponent(f[2] || "g")];
          });
        }
      } catch (e) { /* ignore malformed parts */ }
    });
    return out.items.length ? out : null;
  }

  load();

  Mise.store = {
    get: function () { return state; },
    subscribe: subscribe,
    addItem: addItem, updateItem: updateItem, removeItem: removeItem, findItem: findItem,
    clear: clear, loadMeal: loadMeal, setName: setName, setServings: setServings,
    setView: setView, setGoal: setGoal, setSageAuto: setSageAuto,
    snapshot: snapshot, restore: restore,
    saveCurrent: saveCurrent, deleteSaved: deleteSaved, getSaved: getSaved, restoreSaved: restoreSaved,
    shareURL: shareURL, parseHash: parseHash, sanitizeItems: sanitizeItems
  };
})(typeof window !== "undefined" ? window : this);
