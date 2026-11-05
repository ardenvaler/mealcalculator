/*!
 * Mise — Sage, the tips assistant
 * A little sprout who rotates healthy-eating tips (each one loads a menu),
 * reacts to what's on your plate, and offers one-tap swaps.
 */
(function (root) {
  "use strict";

  var Mise = root.Mise;
  var E = Mise.engine, S = Mise.store, ui = Mise.ui, h = ui.h, fx = Mise.fx;
  var TIPS = root.MiseTips || [];

  var ROTATE_MS = 42000;   // time between automatic tips
  var LINGER_MS = 16000;   // how long an automatic message stays open
  var NOTE_GAP_MS = 22000; // minimum gap between plate remarks

  var el = {};
  var st = {
    open: false, hovering: false, current: null, queue: [], lastNoteAt: 0, said: {},
    rotateTimer: null, lingerTimer: null, typingTimer: null, dismissedAt: 0, lastInteract: Date.now()
  };

  /* ---------------- avatar ---------------- */

  var AVATAR =
    '<svg class="sage-svg" viewBox="0 0 120 120" aria-hidden="true">' +
    '<defs>' +
    '<radialGradient id="sgBody" cx="38%" cy="30%" r="80%"><stop offset="0" stop-color="#b9f3cf"/><stop offset=".55" stop-color="#4fcf8d"/><stop offset="1" stop-color="#1f8f5c"/></radialGradient>' +
    '<linearGradient id="sgLeaf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9ff0be"/><stop offset="1" stop-color="#2aa56b"/></linearGradient>' +
    '<radialGradient id="sgShine" cx="30%" cy="22%" r="40%"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
    '</defs>' +
    '<g class="sage-sprout">' +
    '<path d="M60 40 C60 32 60 26 61 20" stroke="#2a9a63" stroke-width="3.2" stroke-linecap="round" fill="none"/>' +
    '<path class="leaf-l" d="M60.5 25 C52 26 42 22 38 12 C49 9 58 14 60.5 25Z" fill="url(#sgLeaf)"/>' +
    '<path class="leaf-r" d="M61 22 C68 14 80 12 88 18 C81 27 70 28 61 22Z" fill="url(#sgLeaf)"/>' +
    '</g>' +
    '<g class="sage-body">' +
    '<ellipse cx="60" cy="74" rx="38" ry="35" fill="url(#sgBody)"/>' +
    '<ellipse cx="60" cy="74" rx="38" ry="35" fill="url(#sgShine)"/>' +
    '<ellipse class="cheek" cx="38" cy="84" rx="6" ry="3.6" fill="#ff8aa1" opacity=".55"/>' +
    '<ellipse class="cheek" cx="82" cy="84" rx="6" ry="3.6" fill="#ff8aa1" opacity=".55"/>' +
    '<g class="sage-eyes">' +
    '<g class="eye"><ellipse cx="46" cy="72" rx="6.6" ry="8" fill="#fff"/><circle class="pupil" cx="46" cy="73" r="3.9" fill="#14281d"/><circle class="glint" cx="47.6" cy="71" r="1.3" fill="#fff"/></g>' +
    '<g class="eye"><ellipse cx="74" cy="72" rx="6.6" ry="8" fill="#fff"/><circle class="pupil" cx="74" cy="73" r="3.9" fill="#14281d"/><circle class="glint" cx="75.6" cy="71" r="1.3" fill="#fff"/></g>' +
    '</g>' +
    '<path class="mouth" d="M52 88 Q60 95 68 88" stroke="#14402a" stroke-width="3" stroke-linecap="round" fill="none"/>' +
    '</g>' +
    '</svg>';

  function lookAt(x, y) {
    if (!el.avatar) return;
    var r = el.avatar.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height * 0.6;
    var dx = x - cx, dy = y - cy;
    var d = Math.hypot(dx, dy) || 1;
    var k = Math.min(1, d / 300);
    el.avatar.style.setProperty("--px", (dx / d * 2.4 * k).toFixed(2) + "px");
    el.avatar.style.setProperty("--py", (dy / d * 2.8 * k).toFixed(2) + "px");
  }

  function blinkLoop() {
    var wait = 2600 + Math.random() * 3800;
    setTimeout(function () {
      if (!fx.reduced() && el.root) {
        fx.pulse(el.root, "is-blink");
        if (Math.random() < 0.2) setTimeout(function () { fx.pulse(el.root, "is-blink"); }, 260);
      }
      blinkLoop();
    }, wait);
  }

  /* ---------------- messages ---------------- */

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  function nextTip() {
    if (!TIPS.length) return null;
    if (!st.queue.length) st.queue = shuffle(TIPS.slice());
    return st.queue.shift();
  }

  function tipMessage(tip) {
    var t = Mise.tipsUI.summary(tip);
    return {
      kind: "tip", tag: Mise.tipsUI.catOf(tip.cat).label, title: tip.title, text: tip.body, tip: tip,
      meta: tip.menu.name + " · " + E.fmt(t.per.kcal) + " kcal · " + E.fmt(t.per.protein) + " g protein",
      actions: [
        { label: "Calculate this menu", icon: "arrowRight", primary: true, run: function (btn) { Mise.app.loadTip(tip.id, btn); } },
        { label: "Next tip", icon: "next", run: function () { say(tipMessage(nextTip())); } }
      ]
    };
  }

  function render(msg) {
    ui.clear(el.body);
    el.tag.textContent = msg.tag || "Sage";
    el.root.dataset.kind = msg.kind;
    el.root.dataset.mood = msg.mood || (msg.kind === "note" && msg.tone === "warn" ? "think" : "happy");
    el.body.appendChild(h("h4", { class: "sage-title" }, msg.title));
    if (msg.text) el.body.appendChild(h("p", { class: "sage-text" }, msg.text));
    if (msg.meta) el.body.appendChild(h("p", { class: "sage-meta" }, ui.icon("sparkle"), msg.meta));
    ui.clear(el.actions);
    (msg.actions || []).forEach(function (a) {
      el.actions.appendChild(h("button", {
        class: a.primary ? "btn btn-primary btn-sm" : "btn btn-ghost btn-sm", type: "button",
        onclick: function (e) { st.lastInteract = Date.now(); a.run(e.currentTarget); }
      }, a.label, a.icon ? ui.icon(a.icon) : null));
    });
  }

  /** Show a message; typing dots first for a little life. */
  function say(msg, opts) {
    if (!msg || !el.root) return;
    opts = opts || {};
    st.current = msg;
    clearTimeout(st.typingTimer);
    clearTimeout(st.lingerTimer);
    var quiet = opts.auto && Date.now() - st.dismissedAt < 90000;
    if (quiet) { el.root.classList.add("has-news"); return; }
    open();
    el.root.classList.remove("has-news");
    if (fx.reduced() || opts.instant) { render(msg); el.root.classList.remove("is-typing"); }
    else {
      el.root.classList.add("is-typing");
      st.typingTimer = setTimeout(function () {
        el.root.classList.remove("is-typing");
        render(msg);
        fx.pulse(el.bubble, "is-pop");
      }, 520 + Math.random() * 380);
    }
    fx.pulse(el.root, "is-talk");
    if (opts.auto || opts.linger) scheduleLinger();
    scheduleRotate();
  }

  function scheduleLinger() {
    clearTimeout(st.lingerTimer);
    st.lingerTimer = setTimeout(function tryClose() {
      if (st.hovering || el.bubble.contains(document.activeElement)) { st.lingerTimer = setTimeout(tryClose, 4000); return; }
      close(false);
    }, LINGER_MS);
  }

  function scheduleRotate() {
    clearTimeout(st.rotateTimer);
    if (!S.get().sageAuto) return;
    st.rotateTimer = setTimeout(function tick() {
      if (document.hidden || st.hovering || ui.isTyping() || Date.now() - st.lastInteract < 8000) {
        st.rotateTimer = setTimeout(tick, 6000);
        return;
      }
      say(tipMessage(nextTip()), { auto: true });
    }, ROTATE_MS);
  }

  function open() {
    if (st.open) return;
    st.open = true;
    el.root.classList.add("is-open");
    el.avatar.setAttribute("aria-expanded", "true");
    el.bubble.setAttribute("aria-hidden", "false");
  }

  function close(byUser) {
    if (!st.open) return;
    st.open = false;
    el.root.classList.remove("is-open", "is-typing");
    el.avatar.setAttribute("aria-expanded", "false");
    el.bubble.setAttribute("aria-hidden", "true");
    if (byUser) st.dismissedAt = Date.now();
  }

  /* ---------------- plate remarks ---------------- */

  function has(calc, ids) {
    for (var i = 0; i < calc.rows.length; i++) {
      var r = calc.rows[i];
      if (r.food && ids.indexOf(r.food.id) !== -1) return r;
    }
    return null;
  }

  function hasGroup(calc, group) {
    return calc.rows.some(function (r) { return r.food && r.food.group === group; });
  }

  function swapAction(row, toId, label) {
    if (!E.byId.get(toId)) return null;
    return {
      label: label, icon: "swap", primary: true,
      run: function () {
        var snap = S.snapshot();
        S.updateItem(row.item.uid, { id: toId });
        fx.toast("Swapped in " + E.byId.get(toId).name + " (" + E.byId.get(toId).type + ")", { icon: "swap", action: "Undo", onAction: function () { S.restore(snap); } });
        close(false);
      }
    };
  }

  function addAction(id, qty, unit, label) {
    if (!E.byId.get(id)) return null;
    return {
      label: label, icon: "plus", primary: true,
      run: function () { Mise.app.addFood(id, el.avatar, qty, unit); close(false); }
    };
  }

  function remarkFor(calc) {
    var view = S.get().view, goal = S.get().goal;
    var list = E.insights(calc, view, goal);
    var by = {};
    list.forEach(function (i) { by[i.key] = i; });
    var n = view === "meal" ? calc.total : calc.per;

    var soy = has(calc, ["soy-sauce"]);
    var salt = has(calc, ["salt-table", "salt-sea", "salt-himalayan-pink"]);
    var butter = has(calc, ["butter-salted", "butter-unsalted"]);
    var whiteRice = has(calc, ["rice-white-cooked", "rice-jasmine-cooked"]);
    var whitePasta = has(calc, ["pasta-cooked"]);
    var sugar = has(calc, ["sugar-white", "sugar-brown"]);

    if (by["sodium-high"]) {
      var acts = [];
      if (soy) acts.push(swapAction(soy, "soy-sauce-low-sodium", "Swap to low-sodium soy"));
      if (salt) acts.push(swapAction(salt, "salt-low-sodium", "Try low-sodium salt"));
      return { key: "sodium-high", tone: "warn", tag: "Heads-up", title: "That's a salty plate", text: by["sodium-high"].detail + (soy ? " Soy sauce is a big contributor here." : " Sauces, stock and salt are the usual suspects — lime, garlic and herbs add flavour without sodium."), actions: acts.filter(Boolean) };
    }
    if (by["satfat-high"] && butter) {
      return { key: "satfat-high", tone: "warn", tag: "Swap idea", title: "Butter is doing a lot here", text: by["satfat-high"].detail + " Extra-virgin olive oil brings mostly unsaturated fat instead.", actions: [swapAction(butter, "olive-oil-extra-virgin", "Swap butter → olive oil")].filter(Boolean) };
    }
    if (by["fiber-low"] && (whiteRice || whitePasta)) {
      var row = whiteRice || whitePasta;
      var to = whiteRice ? "rice-brown-cooked" : "pasta-whole-wheat-cooked";
      return { key: "fiber-low", tone: "info", tag: "Swap idea", title: "Fiber is running low", text: "Whole grains carry several times the fiber of refined ones — and keep you full longer.", actions: [swapAction(row, to, whiteRice ? "Swap to brown rice" : "Swap to whole-wheat pasta")].filter(Boolean) };
    }
    if (by["protein-low"]) {
      return { key: "protein-low", tone: "info", tag: "Balance", title: "Could use some protein", text: by["protein-low"].detail, actions: [addAction("egg-whole-boiled", 1, "large", "Add a boiled egg"), addAction("tempeh-raw", 50, "g", "Add 50 g tempeh")].filter(Boolean) };
    }
    if (by["sugar-high"] && sugar) {
      return { key: "sugar-high", tone: "warn", tag: "Heads-up", title: "Sweet tooth detected", text: by["sugar-high"].detail + " Try halving the sugar — cinnamon or vanilla keep it tasting sweet." , actions: [] };
    }
    if (!hasGroup(calc, "veg") && !hasGroup(calc, "fruit") && calc.rows.length >= 2 && n.kcal > 250) {
      return { key: "no-veg", tone: "info", tag: "Balance", title: "No plants on the plate yet", text: "A couple of handfuls of veg add fiber, potassium and volume for very few calories.", actions: [addAction("spinach-raw", 60, "g", "Add 60 g spinach"), addAction("broccoli-steamed", 80, "g", "Add broccoli")].filter(Boolean) };
    }
    if (by["protein-high"] && by["fiber-high"]) {
      return { key: "great", tone: "good", tag: "Nice!", title: "This plate is a keeper", text: "Plenty of protein and fiber — that combo keeps you full for hours. Save it so you can cook it again.", actions: [{ label: "Save this meal", icon: "bookmark", primary: true, run: function () { Mise.app.saveMeal(); close(false); } }] };
    }
    if (by["micro-rich"] && calc.rows.length >= 3) {
      return { key: "micro-rich", tone: "good", tag: "Nice!", title: "Look at those micronutrients", text: by["micro-rich"].detail.replace(/ of daily value\.$/, "") + " of a day's needs — colourful plates tend to do that.", actions: [] };
    }
    return null;
  }

  var react = ui.debounce(function (calc) {
    if (!calc.rows.length) return;
    if (Date.now() - st.lastNoteAt < NOTE_GAP_MS) return;
    var r = remarkFor(calc);
    if (!r) return;
    var sig = r.key + ":" + S.get().meal.items.length;
    if (st.said[r.key] && Date.now() - st.said[r.key].at < 180000 && st.said[r.key].sig === sig) return;
    st.said[r.key] = { at: Date.now(), sig: sig };
    st.lastNoteAt = Date.now();
    say({ kind: "note", tone: r.tone, tag: r.tag, title: r.title, text: r.text, actions: r.actions, mood: r.tone === "good" ? "happy" : "think" }, { auto: true });
  }, 1700);

  /* ---------------- init ---------------- */

  function init() {
    el.root = document.getElementById("sage");
    if (!el.root) return;
    el.avatar = document.getElementById("sage-avatar");
    el.avatar.insertAdjacentHTML("afterbegin", AVATAR);
    el.bubble = document.getElementById("sage-bubble");
    el.body = document.getElementById("sage-body");
    el.actions = document.getElementById("sage-actions");
    el.tag = document.getElementById("sage-tag");
    el.auto = document.getElementById("sage-auto");

    el.avatar.addEventListener("click", function () {
      st.lastInteract = Date.now();
      if (st.open) { close(true); return; }
      say(st.current && el.root.classList.contains("has-news") ? st.current : tipMessage(nextTip()));
    });
    document.getElementById("sage-close").addEventListener("click", function () { close(true); });
    el.auto.addEventListener("click", function () {
      var on = !S.get().sageAuto;
      S.setSageAuto(on);
      syncAuto();
      fx.toast(on ? "Sage will share a tip every so often" : "Auto tips paused — tap Sage anytime", { icon: on ? "play" : "pause" });
      if (on) scheduleRotate(); else clearTimeout(st.rotateTimer);
    });
    el.root.addEventListener("pointerenter", function () { st.hovering = true; });
    el.root.addEventListener("pointerleave", function () { st.hovering = false; });
    el.root.addEventListener("keydown", function (e) { if (e.key === "Escape" && st.open) { close(true); el.avatar.focus(); } });
    root.addEventListener("pointermove", function (e) { lookAt(e.clientX, e.clientY); }, { passive: true });
    blinkLoop();
    syncAuto();

    S.subscribe(function (state, change) {
      if (change.type === "add" || change.type === "update" || change.type === "remove") react(Mise.app.calc());
    });

    // greet shortly after load
    setTimeout(function () {
      var meal = S.get().meal;
      var hasItems = meal.items.length > 0;
      say({
        kind: "greet", tag: "Hello", mood: "happy",
        title: "Hi, I'm Sage 🌿",
        text: meal.example
          ? "I've put an example on your plate: 100 g chicken breast, a tablespoon of extra-virgin olive oil and 150 g spinach. Change any amount or type and watch the numbers move, or tap a tip to load its menu."
          : hasItems
            ? "Welcome back — your plate is right where you left it. I'll pop in with tips now and then; each one comes with a menu you can calculate in one tap."
            : "I'll drop healthy-eating tips here every so often — tap one to load its menu and see the numbers. Or start adding ingredients from the library.",
        actions: [
          { label: "Show me a tip", icon: "sparkle", primary: true, run: function () { say(tipMessage(nextTip())); } },
          { label: "Browse all tips", icon: "arrowRight", run: function () { Mise.app.scrollTo("tips"); close(false); } }
        ]
      }, { auto: true });
    }, 2200);
  }

  function syncAuto() {
    var on = S.get().sageAuto;
    el.auto.setAttribute("aria-pressed", on ? "true" : "false");
    el.auto.title = on ? "Pause automatic tips" : "Resume automatic tips";
    ui.clear(el.auto).appendChild(ui.icon(on ? "pause" : "play"));
  }

  Mise.sage = {
    init: init, say: say, close: close,
    sayTip: function (tip) { say(tipMessage(tip)); },
    sayAfterMenu: function (tip, calc) {
      var n = calc.per;
      say({
        kind: "note", tag: Mise.tipsUI.catOf(tip.cat).label, mood: "happy",
        title: tip.menu.name,
        text: "Here's the breakdown: " + E.fmt(n.kcal) + " kcal, " + E.fmt(n.protein) + " g protein, " + E.fmtNutrient("fiber", n.fiber) + " g fiber per serving. Tweak any amount and I'll keep the numbers live.",
        actions: [{ label: "Next tip", icon: "next", run: function () { say(tipMessage(nextTip())); } }]
      }, { linger: true });
      st.lastNoteAt = Date.now();
    }
  };
})(window);
