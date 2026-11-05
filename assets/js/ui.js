/*!
 * Mise — tiny DOM helpers and the icon set.
 */
(function (root) {
  "use strict";

  var Mise = root.Mise;
  var doc = root.document;

  /** h("div", { class: "x", onclick: fn }, "text", childNode, [more]) */
  function h(tag, attrs) {
    var el = doc.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, k)) continue;
        var v = attrs[k];
        if (v == null || v === false) continue;
        if (k === "class") el.className = v;
        else if (k === "style" && typeof v === "object") { for (var s in v) el.style.setProperty(s, v[s]); }
        else if (k === "dataset") { for (var d in v) el.dataset[d] = v[d]; }
        else if (k === "html") el.innerHTML = v; // trusted constants only (icons)
        else if (k.slice(0, 2) === "on" && typeof v === "function") el.addEventListener(k.slice(2), v);
        else if (v === true) el.setAttribute(k, "");
        else el.setAttribute(k, v);
      }
    }
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }

  function append(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { append(el, x); }); return; }
    el.appendChild(c.nodeType ? c : doc.createTextNode(String(c)));
  }

  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }

  /* 24×24 stroke icons */
  var P = {
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    x: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
    sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/>',
    moon: '<path d="M20 14.6A8.2 8.2 0 1 1 9.4 4a6.6 6.6 0 0 0 10.6 10.6Z"/>',
    share: '<path d="M12 3.5v11M8 7.5l4-4 4 4"/><path d="M6 11.5v7a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-7"/>',
    bookmark: '<path d="M7 3.5h10a1 1 0 0 1 1 1v16l-6-4-6 4v-16a1 1 0 0 1 1-1Z"/>',
    trash: '<path d="M4.5 7h15M10 11v6M14 11v6M6.5 7l.9 11.6a2 2 0 0 0 2 1.9h5.2a2 2 0 0 0 2-1.9L17.5 7M9.5 7V4.5h5V7"/>',
    sparkle: '<path d="M11 3.5l1.7 4.8 4.8 1.7-4.8 1.7L11 16.5l-1.7-4.8L4.5 10l4.8-1.7z"/><path d="M18 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
    chevronDown: '<path d="m6.5 9.5 5.5 5.5 5.5-5.5"/>',
    chevronRight: '<path d="m9.5 6.5 5.5 5.5-5.5 5.5"/>',
    arrowRight: '<path d="M5 12h14M13.5 6.5 19 12l-5.5 5.5"/>',
    arrowUpRight: '<path d="M7 17 17 7M8.5 7H17v8.5"/>',
    undo: '<path d="M9 14.5 4.5 10 9 5.5"/><path d="M4.5 10H15a5 5 0 0 1 0 10h-3.5"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    next: '<path d="M5 12h11M12 7l5 5-5 5"/><path d="M20 6v12"/>',
    pause: '<path d="M8.5 5.5v13M15.5 5.5v13"/>',
    play: '<path d="M8 5.5v13l10-6.5z"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.6v.2"/>',
    warn: '<path d="M10.3 4.2 2.9 17.5A2 2 0 0 0 4.6 20.5h14.8a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z"/><path d="M12 9.5v4.5M12 17v.2"/>',
    good: '<circle cx="12" cy="12" r="8.5"/><path d="m8.3 12.2 2.6 2.6 4.9-5.4"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7L11.5 6.8"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5"/>',
    copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M15.5 8.5v-2a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/>',
    grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.8"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.8"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.8"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.8"/>',
    swap: '<path d="M7 4.5 3.5 8 7 11.5M3.5 8H17M17 12.5l3.5 3.5-3.5 3.5M20.5 16H7"/>',
    scale: '<path d="M5 20h14l-1.6-9.3a2 2 0 0 0-2-1.7H8.6a2 2 0 0 0-2 1.7z"/><circle cx="12" cy="5.5" r="2.2"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    // food groups
    all: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.8"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.8"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.8"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.8"/>',
    protein: '<path d="M12 3.5c3.4 0 6.5 5.4 6.5 9.6a6.5 6.5 0 0 1-13 0c0-4.2 3.1-9.6 6.5-9.6Z"/>',
    veg: '<path d="M4.5 19.5C5 11 10 5 19.5 4.5 19 14 13 19 4.5 19.5Z"/><path d="M4.5 19.5 14 10"/>',
    carb: '<path d="M12 21V9.5"/><path d="M12 9.5C9.8 9.5 8.5 7.8 8.5 5.5c2.2 0 3.5 1.7 3.5 4ZM12 9.5c2.2 0 3.5-1.7 3.5-4-2.2 0-3.5 1.7-3.5 4ZM12 14.5c-2.2 0-3.5-1.7-3.5-4 2.2 0 3.5 1.7 3.5 4ZM12 14.5c2.2 0 3.5-1.7 3.5-4-2.2 0-3.5 1.7-3.5 4Z"/><path d="M12 5.5V3"/>',
    legume: '<path d="M9 4.5c3.2-1.3 6.8 0 8 3s.2 5.3-2.3 6.2-3 2.2-3.4 4.4-3.8 3.6-6 1.6-1.4-5.2.4-7.1-.4-6.6 3.3-8.1Z"/>',
    fruit: '<path d="M12 7.5c-1-1.6-2.8-2.4-4.6-2C4.6 6 3.5 9.3 4.3 12.6 5.1 16 7.8 20 10 20c.9 0 1.2-.5 2-.5s1.1.5 2 .5c2.2 0 4.9-4 5.7-7.4.8-3.3-.3-6.6-3.1-7.1-1.8-.4-3.6.4-4.6 2Z"/><path d="M12 7.5c0-1.9.9-3.3 2.8-4"/>',
    dairy: '<path d="M8.5 3.5h7v3l2 3v11h-11v-11l2-3Z"/><path d="M6.5 9.5h11"/><path d="M10 14h4"/>',
    fat: '<path d="M12 3.5c2.9 4.1 6 7.7 6 10.9a6 6 0 0 1-12 0c0-3.2 3.1-6.8 6-10.9Z"/><path d="M9.3 14.8a2.8 2.8 0 0 0 2.4 2.6"/>',
    nut: '<path d="M12 3.5c3.8 2 6.6 6.4 5.8 10.4-.7 3.3-3.3 5.6-5.8 6.6-2.5-1-5.1-3.3-5.8-6.6C5.4 9.9 8.2 5.5 12 3.5Z"/><path d="M12 8.5v8"/>',
    spice: '<path d="M8.5 10h7l.9 10.5H7.6Z"/><path d="M9.8 10V7a2.2 2.2 0 0 1 4.4 0v3"/><path d="M11 13.6h.01M13 15.4h.01M11 17.2h.01"/>',
    sauce: '<path d="M10 2.5h4v3.6l2 2.9v11a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 8 20V9l2-2.9Z"/><path d="M8 13.5h8"/>',
    sweet: '<path d="M4.5 8 12 4l7.5 4v8L12 20l-7.5-4Z"/><path d="M4.5 8 12 12l7.5-4M12 12v8"/>',
    drink: '<path d="M6.5 8.5h11l-1.4 11a1.8 1.8 0 0 1-1.8 1.5H9.7a1.8 1.8 0 0 1-1.8-1.5Z"/><path d="M5.5 8.5h13M10 8.5l1.3-5.5h3.2"/>'
  };

  function icon(name, cls) {
    var span = doc.createElement("span");
    span.className = "ico" + (cls ? " " + cls : "");
    span.setAttribute("aria-hidden", "true");
    span.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (P[name] || "") + "</svg>";
    return span;
  }

  function iconSVG(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[name] || "") + "</svg>";
  }

  function debounce(fn, ms) {
    var t;
    return function () {
      var args = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, ms);
    };
  }

  function isTyping() {
    var a = doc.activeElement;
    return !!a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA" || a.tagName === "SELECT" || a.isContentEditable);
  }

  /** Thin segmented macro bar: three <i> children (protein, carbs, fat). */
  function setBar(bar, split) {
    if (!bar) return;
    var parts = [split.protein || 0, split.carbs || 0, split.fat || 0];
    var any = parts[0] + parts[1] + parts[2] > 0;
    for (var i = 0; i < 3; i++) {
      var seg = bar.children[i];
      if (!seg) continue;
      seg.style.flexGrow = parts[i].toFixed(4);
      seg.classList.toggle("is-zero", any && parts[i] < 0.004);
    }
    bar.classList.toggle("is-empty", !any);
  }

  Mise.ui = { h: h, $: $, $$: $$, clear: clear, icon: icon, iconSVG: iconSVG, debounce: debounce, isTyping: isTyping, setBar: setBar };
})(window);
