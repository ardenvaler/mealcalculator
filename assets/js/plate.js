/*!
 * Mise — "Your plate": the meal builder list.
 */
(function (root) {
  "use strict";

  var Mise = root.Mise;
  var E = Mise.engine, S = Mise.store, ui = Mise.ui, h = ui.h, fx = Mise.fx;
  var el = {};
  var rows = new Map(); // uid → { li, refs }

  var parseQty = E.parseQty;

  /* ---------------- row building ---------------- */

  function buildTypeSelect(food) {
    var fam = food.family;
    if (!fam || fam.variants.length < 2) return h("span", { class: "row-type-static" }, food.type);
    var sel = h("select", { class: "row-type", "aria-label": food.name + " type" });
    fam.variants.forEach(function (v) {
      var o = h("option", { value: v.id }, v.type + " · " + E.fmt(v.n.kcal) + " kcal/100g");
      if (v.id === food.id) o.selected = true;
      sel.appendChild(o);
    });
    return h("label", { class: "select select-type" }, sel, ui.icon("chevronDown"));
  }

  function buildUnitSelect(food, unit) {
    var sel = h("select", { class: "row-unit", "aria-label": "Unit" });
    var groups = {};
    E.unitOptions(food).forEach(function (o) {
      if (!groups[o.group]) { groups[o.group] = h("optgroup", { label: o.group }); sel.appendChild(groups[o.group]); }
      var label = o.group === "Portions" ? o.label + " · " + E.fmt(o.grams, o.grams < 10 ? 1 : 0) + " g" : o.label;
      var opt = h("option", { value: o.key }, label);
      if (o.key === unit) opt.selected = true;
      groups[o.group].appendChild(opt);
    });
    return sel;
  }

  function createRow(item) {
    var food = E.byId.get(item.id);
    var refs = {};
    var g = E.groupByKey.get(food.group);
    var li = h("li", { class: "row", dataset: { uid: item.uid }, style: { "--h": g ? g.hue : 200 } });
    refs.emoji = h("span", { class: "row-emoji", "aria-hidden": "true" }, food.emoji);
    refs.name = h("span", { class: "row-name" }, food.name);
    refs.kcal = h("b", null, "0");
    refs.typeWrap = h("span", { class: "row-type-wrap" }, buildTypeSelect(food));
    refs.qty = h("input", {
      class: "row-qty", type: "text", inputmode: "decimal", autocomplete: "off", spellcheck: "false",
      value: E.fmtQty(item.qty), "aria-label": "Amount of " + food.name
    });
    refs.unitSel = buildUnitSelect(food, item.unit);
    refs.unitWrap = h("label", { class: "select select-unit" }, refs.unitSel, ui.icon("chevronDown"));
    refs.grams = h("span", { class: "row-grams" });
    refs.macros = h("span", { class: "row-macros" });
    refs.bar = h("span", { class: "thinbar", "aria-hidden": "true" },
      h("i", { class: "seg-p" }), h("i", { class: "seg-c" }), h("i", { class: "seg-f" }));
    refs.share = h("span", { class: "row-share", "aria-hidden": "true" });

    li.appendChild(refs.share);
    li.appendChild(refs.emoji);
    li.appendChild(h("div", { class: "row-main" },
      h("div", { class: "row-top" }, refs.name, h("span", { class: "row-kcal" }, refs.kcal, h("small", null, " kcal"))),
      h("div", { class: "row-controls" },
        refs.typeWrap,
        h("div", { class: "qty" },
          h("button", { class: "qty-btn", type: "button", "aria-label": "Less", dataset: { step: "-1" } }, ui.icon("minus")),
          refs.qty,
          h("button", { class: "qty-btn", type: "button", "aria-label": "More", dataset: { step: "1" } }, ui.icon("plus"))
        ),
        refs.unitWrap
      ),
      h("div", { class: "row-bottom" }, refs.grams, refs.macros, refs.bar)
    ));
    li.appendChild(h("button", { class: "row-remove", type: "button", "aria-label": "Remove " + food.name }, ui.icon("x")));
    var rec = { li: li, refs: refs, id: item.id, unit: item.unit };
    rows.set(item.uid, rec);
    return rec;
  }

  function refreshRow(rec, row, totalKcal) {
    var item = row.item, food = row.food, r = rec.refs;
    if (rec.id !== item.id) {
      // type changed → rebuild selects
      var nf = E.byId.get(item.id);
      r.emoji.textContent = nf.emoji;
      r.name.textContent = nf.name;
      ui.clear(r.typeWrap).appendChild(buildTypeSelect(nf));
      var ns = buildUnitSelect(nf, item.unit);
      r.unitWrap.replaceChild(ns, r.unitSel);
      r.unitSel = ns;
      rec.id = item.id;
      rec.unit = item.unit;
      fx.pulse(rec.li, "is-changed");
    } else if (rec.unit !== item.unit) {
      r.unitSel.value = item.unit;
      rec.unit = item.unit;
    }
    if (document.activeElement !== r.qty) r.qty.value = E.fmtQty(item.qty);
    fx.tween(r.kcal, row.n.kcal, function (v) { return E.fmt(v); }, 450);
    var isGrams = item.unit === "g";
    r.grams.textContent = isGrams ? E.fmt(row.grams, row.grams < 10 ? 1 : 0) + " g" : "= " + E.fmt(row.grams, row.grams < 10 ? 1 : 0) + " g";
    r.macros.textContent = "P " + E.fmtNutrient("protein", row.n.protein) + " · C " + E.fmtNutrient("carbs", row.n.carbs) + " · F " + E.fmtNutrient("fat", row.n.fat) + " g";
    ui.setBar(r.bar, E.energySplit(row.n));
    var share = totalKcal > 0 ? row.n.kcal / totalKcal : 0;
    r.share.style.transform = "scaleX(" + share.toFixed(4) + ")";
    rec.li.title = Math.round(share * 100) + "% of this plate's calories";
    rec.li.classList.toggle("is-invalid", !row.valid);
  }

  /* ---------------- render ---------------- */

  function render(calc, change) {
    var items = S.get().meal.items;
    var type = change && change.type;

    // remove rows that no longer exist
    rows.forEach(function (rec, u) {
      if (!items.some(function (i) { return i.uid === u; })) {
        rows.delete(u);
        if (type === "remove" && !fx.reduced()) {
          var li = rec.li;
          li.style.height = li.offsetHeight + "px";
          li.classList.add("is-leaving");
          requestAnimationFrame(function () { li.style.height = "0px"; });
          setTimeout(function () { li.remove(); }, 380);
        } else rec.li.remove();
      }
    });

    // add / order rows
    var stagger = type === "load" ? 55 : 0;
    var addedIdx = 0;
    var live = Array.prototype.filter.call(el.list.children, function (c) { return !c.classList.contains("is-leaving"); });
    items.forEach(function (it, i) {
      var rec = rows.get(it.uid);
      if (!rec) {
        rec = createRow(it);
        rec.li.classList.add("is-entering");
        rec.li.style.setProperty("--d", (addedIdx++ * stagger) + "ms");
        var li = rec.li;
        setTimeout(function () { li.classList.remove("is-entering"); }, 900 + addedIdx * stagger);
      }
      var at = live[i];
      if (at !== rec.li) {
        el.list.insertBefore(rec.li, at || null);
        var j = live.indexOf(rec.li);
        if (j >= 0) live.splice(j, 1);
        live.splice(i, 0, rec.li);
      }
    });

    calc.rows.forEach(function (row) {
      var rec = rows.get(row.item.uid);
      if (rec && row.food) refreshRow(rec, row, calc.total.kcal);
    });

    var n = items.length;
    el.root.classList.toggle("is-empty", !n);
    el.empty.hidden = !!n;
    el.count.textContent = n + (n === 1 ? " ingredient" : " ingredients");
    el.weight.textContent = E.fmt(calc.weight) + " g total";
    if (document.activeElement !== el.name) el.name.value = S.get().meal.name;
    el.servings.textContent = S.get().meal.servings;
    el.servDown.disabled = S.get().meal.servings <= 1;
  }

  function rowFromEvent(e) {
    var li = e.target.closest && e.target.closest(".row");
    return li ? li.dataset.uid : null;
  }

  /* ---------------- events ---------------- */

  var holdTimer = null, holdInterval = null;
  function stopHold() { clearTimeout(holdTimer); clearInterval(holdInterval); holdTimer = holdInterval = null; }

  function stepItem(u, dir) {
    var it = S.findItem(u);
    if (!it) return;
    var step = E.stepFor(it.unit, it.qty);
    var next = dir > 0 ? it.qty + step : it.qty - step;
    if (dir > 0 && it.qty < step && it.qty > 0) next = step; // snap tiny amounts up to the first step
    next = Math.max(0, Math.round(next / step) * step);
    next = Math.round(next * 1000) / 1000;
    S.updateItem(u, { qty: next });
  }

  function bind() {
    el.list.addEventListener("change", function (e) {
      var u = rowFromEvent(e);
      if (!u) return;
      if (e.target.classList.contains("row-type")) S.updateItem(u, { id: e.target.value });
      else if (e.target.classList.contains("row-unit")) S.updateItem(u, { unit: e.target.value });
    });

    var qtyInput = ui.debounce(function (input, u) {
      var v = parseQty(input.value);
      var bad = !(v >= 0);
      input.classList.toggle("is-bad", bad);
      if (!bad) S.updateItem(u, { qty: v });
    }, 140);
    el.list.addEventListener("input", function (e) {
      if (!e.target.classList.contains("row-qty")) return;
      qtyInput(e.target, rowFromEvent(e));
    });
    el.list.addEventListener("focusout", function (e) {
      if (!e.target.classList.contains("row-qty")) return;
      var u = rowFromEvent(e);
      var v = parseQty(e.target.value);
      var it = S.findItem(u);
      // commit what was typed before normalising the field
      if (it && v >= 0 && Math.abs(v - it.qty) > 1e-9) S.updateItem(u, { qty: v });
      e.target.classList.remove("is-bad");
      it = S.findItem(u);
      if (it) e.target.value = E.fmtQty(it.qty);
    });
    el.list.addEventListener("keydown", function (e) {
      if (!e.target.classList.contains("row-qty")) return;
      if (e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); stepItem(rowFromEvent(e), e.key === "ArrowUp" ? 1 : -1); }
      if (e.key === "Enter") e.target.blur();
    });

    el.list.addEventListener("pointerdown", function (e) {
      var b = e.target.closest(".qty-btn");
      if (!b) return;
      var u = rowFromEvent(e), dir = +b.dataset.step;
      stepItem(u, dir);
      stopHold();
      holdTimer = setTimeout(function () { holdInterval = setInterval(function () { stepItem(u, dir); }, 85); }, 420);
    });
    ["pointerup", "pointercancel"].forEach(function (t) { document.addEventListener(t, stopHold); });
    el.list.addEventListener("pointerleave", stopHold);
    el.list.addEventListener("keydown", function (e) {
      var b = e.target.closest && e.target.closest(".qty-btn");
      if (b && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); stepItem(rowFromEvent(e), +b.dataset.step); }
    });

    el.list.addEventListener("click", function (e) {
      var rm = e.target.closest(".row-remove");
      if (!rm) return;
      var u = rowFromEvent(e);
      var it = S.findItem(u);
      if (!it) return;
      var snap = S.snapshot();
      var food = E.byId.get(it.id);
      S.removeItem(u);
      fx.toast("Removed " + food.name, { icon: "trash", action: "Undo", onAction: function () { S.restore(snap); } });
    });

    // meta
    el.name.addEventListener("input", ui.debounce(function () { S.setName(el.name.value.trim() || "My plate"); }, 250));
    el.name.addEventListener("keydown", function (e) { if (e.key === "Enter") el.name.blur(); });
    el.name.addEventListener("blur", function () { if (!el.name.value.trim()) el.name.value = S.get().meal.name; });
    el.servDown.addEventListener("click", function () { S.setServings(S.get().meal.servings - 1); fx.pulse(el.servings, "is-bump"); });
    el.servUp.addEventListener("click", function () { S.setServings(S.get().meal.servings + 1); fx.pulse(el.servings, "is-bump"); });

    // drop target
    var zone = el.root;
    zone.addEventListener("dragover", function (e) {
      if (!e.dataTransfer || Array.prototype.indexOf.call(e.dataTransfer.types, "application/x-mise-food") < 0) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
      zone.classList.add("is-drop");
    });
    zone.addEventListener("dragleave", function (e) { if (!zone.contains(e.relatedTarget)) zone.classList.remove("is-drop"); });
    zone.addEventListener("drop", function (e) {
      var id = e.dataTransfer && e.dataTransfer.getData("application/x-mise-food");
      zone.classList.remove("is-drop");
      if (!id) return;
      e.preventDefault();
      Mise.app.addFood(id, null);
    });
  }

  function renderEmptyStarters(tips) {
    var wrap = document.getElementById("plate-starters");
    if (!wrap) return;
    ui.clear(wrap);
    tips.forEach(function (t) {
      wrap.appendChild(h("button", { class: "starter", type: "button", dataset: { tip: t.id } },
        h("span", { class: "starter-emoji", "aria-hidden": "true" }, Mise.tipsUI.menuEmojis(t, 3).join("")),
        h("span", null, t.menu.name)
      ));
    });
    wrap.addEventListener("click", function (e) {
      var b = e.target.closest(".starter");
      if (b) Mise.app.loadTip(b.dataset.tip, b);
    });
  }

  function init() {
    el.root = document.getElementById("plate");
    el.list = document.getElementById("plate-list");
    el.empty = document.getElementById("plate-empty");
    el.count = document.getElementById("plate-count");
    el.weight = document.getElementById("plate-weight");
    el.name = document.getElementById("plate-name");
    el.servings = document.getElementById("servings");
    el.servDown = document.getElementById("serv-down");
    el.servUp = document.getElementById("serv-up");
    bind();
  }

  Mise.plate = {
    init: init, render: render, parseQty: parseQty, renderEmptyStarters: renderEmptyStarters,
    rowEmoji: function (u) { var r = rows.get(u); return r ? r.refs.emoji : null; }
  };
})(window);
