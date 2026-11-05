/*!
 * Mise — motion & atmosphere
 * Number tweens, fly-to animations, scroll reveals, the aurora background,
 * pointer spotlight / tilt, theme transition and toasts.
 */
(function (root) {
  "use strict";

  var Mise = root.Mise;
  var doc = root.document;
  var h = Mise.ui.h;
  var mq = root.matchMedia ? root.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  function reduced() { return mq.matches; }

  var easeOutExpo = function (t) { return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); };
  var easeInOut = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

  /* ---------------- number tween ---------------- */

  var tweens = new WeakMap();
  /** Animate el's text from its current value to `to`. format(v) → string */
  function tween(el, to, format, duration) {
    if (!el) return;
    var from = typeof el._v === "number" ? el._v : 0;
    el._v = to;
    var prev = tweens.get(el);
    if (prev) cancelAnimationFrame(prev);
    if (reduced() || from === to || !isFinite(from) || !isFinite(to)) { el.textContent = format(to); return; }
    var d = duration || 700;
    var start = performance.now();
    var step = function (now) {
      var t = Math.min(1, (now - start) / d);
      var v = from + (to - from) * easeOutExpo(t);
      el.textContent = format(t >= 1 ? to : v);
      if (t < 1) tweens.set(el, requestAnimationFrame(step)); else tweens.delete(el);
    };
    tweens.set(el, requestAnimationFrame(step));
  }

  /* ---------------- fly-to (add to plate) ---------------- */

  function fly(fromEl, toEl, content) {
    if (reduced() || !fromEl || !toEl || !fromEl.animate) return;
    var a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
    if (!a.width || !b.width) return;
    var vh = root.innerHeight;
    if (b.bottom < 0 || b.top > vh) return;
    var ghost = h("div", { class: "fly-ghost", "aria-hidden": "true" }, content);
    doc.body.appendChild(ghost);
    var x0 = a.left + a.width / 2, y0 = a.top + a.height / 2;
    var x1 = b.left + b.width / 2, y1 = b.top + b.height / 2;
    ghost.style.left = x0 + "px";
    ghost.style.top = y0 + "px";
    var dx = x1 - x0, dy = y1 - y0;
    var lift = Math.min(140, 60 + Math.abs(dx) * 0.15);
    var anim = ghost.animate([
      { transform: "translate(-50%,-50%) translate(0,0) scale(1)", opacity: 0.0 },
      { transform: "translate(-50%,-50%) translate(0,-8px) scale(1.15)", opacity: 1, offset: 0.12 },
      { transform: "translate(-50%,-50%) translate(" + dx * 0.55 + "px," + (dy * 0.55 - lift) + "px) scale(1.35) rotate(-8deg)", opacity: 1, offset: 0.55 },
      { transform: "translate(-50%,-50%) translate(" + dx + "px," + dy + "px) scale(.55) rotate(0deg)", opacity: 0.2 }
    ], { duration: 820, easing: "cubic-bezier(.45,.05,.35,1)" });
    anim.onfinish = function () { ghost.remove(); };
  }

  /* ---------------- scroll reveal ---------------- */

  var revealObserver = null;
  function reveal(scope) {
    var els = Mise.ui.$$("[data-reveal]:not(.is-in)", scope);
    if (reduced() || !("IntersectionObserver" in root)) { els.forEach(function (el) { el.classList.add("is-in"); }); return; }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("is-in"); revealObserver.unobserve(e.target); }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    }
    els.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------------- spotlight & tilt ---------------- */

  function spotlight(el) {
    if (!el) return;
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty("--mx", (e.clientX - r.left) + "px");
      el.style.setProperty("--my", (e.clientY - r.top) + "px");
    }, { passive: true });
  }

  function tilt(el, max) {
    if (!el || reduced()) return;
    max = max || 8;
    var raf = 0, tx = 0, ty = 0;
    el.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      var r = el.getBoundingClientRect();
      tx = ((e.clientY - r.top) / r.height - 0.5) * -2 * max;
      ty = ((e.clientX - r.left) / r.width - 0.5) * 2 * max;
      if (!raf) raf = requestAnimationFrame(function () {
        raf = 0;
        el.style.setProperty("--rx", tx.toFixed(2) + "deg");
        el.style.setProperty("--ry", ty.toFixed(2) + "deg");
      });
    }, { passive: true });
    el.addEventListener("pointerleave", function () {
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    });
  }

  /* ---------------- aurora background ---------------- */

  var PALETTES = {
    light: {
      bg: [245, 245, 247],
      blobs: [[255, 190, 150], [150, 225, 200], [196, 181, 253], [255, 214, 140], [140, 200, 255]],
      alpha: 0.62, mode: "source-over"
    },
    dark: {
      bg: [0, 0, 0],
      blobs: [[24, 120, 86], [74, 52, 160], [150, 60, 40], [28, 84, 150], [120, 90, 20]],
      alpha: 0.55, mode: "lighter"
    }
  };
  var MACRO_TINT = {
    light: { protein: [130, 180, 255], carbs: [255, 170, 120], fat: [130, 230, 190] },
    dark: { protein: [30, 90, 200], carbs: [190, 70, 25], fat: [15, 130, 90] }
  };

  function Aurora(canvas) {
    var ctx = canvas.getContext("2d");
    var W = 0, H = 0, scale = 0.33;
    var theme = "light";
    var pal = PALETTES.light;
    var mood = { protein: 1 / 3, carbs: 1 / 3, fat: 1 / 3, energy: 0 };
    var moodCur = { protein: 1 / 3, carbs: 1 / 3, fat: 1 / 3, energy: 0 };
    var mouse = { x: 0.5, y: 0.35 }, mouseCur = { x: 0.5, y: 0.35 };
    var scrollY = 0;
    var t0 = performance.now();
    var running = false, last = 0, raf = 0;

    var blobs = [
      { cx: 0.18, cy: 0.18, ax: 0.10, ay: 0.08, r: 0.55, sp: 0.07, ph: 0.0, depth: 0.05 },
      { cx: 0.82, cy: 0.12, ax: 0.08, ay: 0.10, r: 0.50, sp: 0.06, ph: 1.7, depth: 0.08 },
      { cx: 0.62, cy: 0.62, ax: 0.14, ay: 0.08, r: 0.60, sp: 0.05, ph: 3.1, depth: 0.04 },
      { cx: 0.10, cy: 0.80, ax: 0.08, ay: 0.06, r: 0.45, sp: 0.08, ph: 4.4, depth: 0.10 },
      { cx: 0.92, cy: 0.88, ax: 0.07, ay: 0.07, r: 0.48, sp: 0.065, ph: 5.6, depth: 0.06 }
    ];

    function resize() {
      var vw = root.innerWidth, vh = root.innerHeight;
      W = Math.max(64, Math.round(vw * scale));
      H = Math.max(64, Math.round(vh * scale));
      canvas.width = W; canvas.height = H;
      draw(performance.now());
    }

    function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }

    function draw(now) {
      var t = (now - t0) / 1000;
      var k = 0.04;
      mouseCur.x += (mouse.x - mouseCur.x) * k;
      mouseCur.y += (mouse.y - mouseCur.y) * k;
      ["protein", "carbs", "fat", "energy"].forEach(function (m) { moodCur[m] += (mood[m] - moodCur[m]) * 0.03; });

      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgb(" + pal.bg.join(",") + ")";
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = pal.mode;

      var tint = MACRO_TINT[theme];
      var moodColor = [0, 0, 0];
      ["protein", "carbs", "fat"].forEach(function (m) {
        for (var i = 0; i < 3; i++) moodColor[i] += tint[m][i] * moodCur[m];
      });
      var span = Math.max(W, H);
      var sy = scrollY / Math.max(1, root.innerHeight);

      for (var i = 0; i < blobs.length; i++) {
        var b = blobs[i];
        var x = (b.cx + Math.sin(t * b.sp * 6.283 + b.ph) * b.ax + (mouseCur.x - 0.5) * b.depth * 2) * W;
        var y = (b.cy + Math.cos(t * b.sp * 5.1 + b.ph) * b.ay + (mouseCur.y - 0.5) * b.depth * 2 - sy * b.depth * 0.6) * H;
        var r = b.r * span * (1 + Math.sin(t * b.sp * 3 + b.ph) * 0.06);
        var c = pal.blobs[i];
        if (i === 2) { c = mix(c, moodColor, Math.min(0.85, 0.35 + moodCur.energy * 0.5)); r *= 1 + moodCur.energy * 0.25; }
        var g = ctx.createRadialGradient(x, y, 0, x, y, r);
        var rgb = Math.round(c[0]) + "," + Math.round(c[1]) + "," + Math.round(c[2]);
        g.addColorStop(0, "rgba(" + rgb + "," + pal.alpha + ")");
        g.addColorStop(0.55, "rgba(" + rgb + "," + (pal.alpha * 0.35) + ")");
        g.addColorStop(1, "rgba(" + rgb + ",0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
      ctx.globalCompositeOperation = "source-over";
    }

    function loop(now) {
      raf = 0;
      if (!running) return;
      if (now - last > 33) { last = now; draw(now); }
      raf = requestAnimationFrame(loop);
    }

    function start() {
      if (reduced()) { draw(performance.now()); return; }
      if (running) return;
      running = true;
      raf = requestAnimationFrame(loop);
    }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }

    root.addEventListener("resize", Mise.ui.debounce(resize, 120));
    root.addEventListener("pointermove", function (e) {
      mouse.x = e.clientX / root.innerWidth;
      mouse.y = e.clientY / root.innerHeight;
    }, { passive: true });
    root.addEventListener("scroll", function () { scrollY = root.scrollY; if (reduced()) draw(performance.now()); }, { passive: true });
    doc.addEventListener("visibilitychange", function () { if (doc.hidden) stop(); else start(); });
    if (mq.addEventListener) mq.addEventListener("change", function () { if (reduced()) { stop(); draw(performance.now()); } else start(); });

    resize();
    start();

    return {
      setTheme: function (name) {
        theme = name === "dark" ? "dark" : "light";
        pal = PALETTES[theme];
        draw(performance.now());
      },
      setMood: function (split, energy) {
        mood.protein = split.protein || 1 / 3;
        mood.carbs = split.carbs || 1 / 3;
        mood.fat = split.fat || 1 / 3;
        if (!split.protein && !split.carbs && !split.fat) mood.protein = mood.carbs = mood.fat = 1 / 3;
        mood.energy = Math.max(0, Math.min(1, energy || 0));
        if (reduced()) { moodCur = Object.assign({}, mood); draw(performance.now()); }
      }
    };
  }

  /* ---------------- theme ---------------- */

  function applyTheme(name) {
    doc.documentElement.setAttribute("data-theme", name);
    doc.documentElement.style.colorScheme = name;
    var meta = doc.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", name === "dark" ? "#000000" : "#f5f5f7");
  }

  /** Circular reveal from (x, y) using the View Transitions API when available. */
  function switchTheme(name, x, y, after) {
    var done = function () { applyTheme(name); if (after) after(name); };
    if (reduced() || !doc.startViewTransition) {
      doc.documentElement.classList.add("theme-fade");
      done();
      setTimeout(function () { doc.documentElement.classList.remove("theme-fade"); }, 450);
      return;
    }
    var vt = doc.startViewTransition(done);
    vt.ready.then(function () {
      var r = Math.hypot(Math.max(x, root.innerWidth - x), Math.max(y, root.innerHeight - y));
      doc.documentElement.animate(
        { clipPath: ["circle(0px at " + x + "px " + y + "px)", "circle(" + r + "px at " + x + "px " + y + "px)"] },
        { duration: 720, easing: "cubic-bezier(.65,0,.25,1)", pseudoElement: "::view-transition-new(root)" }
      );
    }).catch(function () {});
  }

  /* ---------------- toasts ---------------- */

  function toast(message, opts) {
    opts = opts || {};
    var region = doc.getElementById("toasts");
    if (!region) return;
    var el = h("div", { class: "toast", role: "status" },
      opts.icon ? Mise.ui.icon(opts.icon) : null,
      h("span", { class: "toast-msg" }, message)
    );
    var timer;
    var close = function () {
      clearTimeout(timer);
      el.classList.add("is-out");
      setTimeout(function () { el.remove(); }, 320);
    };
    if (opts.action) {
      el.appendChild(h("button", {
        class: "toast-btn", type: "button",
        onclick: function () { close(); opts.onAction && opts.onAction(); }
      }, opts.action));
    }
    region.appendChild(el);
    while (region.children.length > 3) region.firstChild.remove();
    requestAnimationFrame(function () { el.classList.add("is-in"); });
    timer = setTimeout(close, opts.duration || 4200);
    return close;
  }

  /* ---------------- misc ---------------- */

  function pulse(el, cls) {
    if (!el) return;
    cls = cls || "is-pulse";
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  Mise.fx = {
    reduced: reduced, easeOutExpo: easeOutExpo, easeInOut: easeInOut,
    tween: tween, fly: fly, reveal: reveal, spotlight: spotlight, tilt: tilt,
    Aurora: Aurora, applyTheme: applyTheme, switchTheme: switchTheme, toast: toast, pulse: pulse
  };
})(window);
