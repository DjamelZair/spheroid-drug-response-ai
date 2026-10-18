/* SVG charts for the console versions. Colours come from CSS custom properties on the page
   (--ink, --ink2, --grid, --acc, --target, --mute, --warn, --ramp0..--ramp3), so every version themes them.
   Each chart re-renders at its container width. */
var NS = "http://www.w3.org/2000/svg";
function E(tag, a, parent, text) {
  var n = document.createElementNS(NS, tag);
  for (var k in a) if (a[k] != null) n.setAttribute(k, a[k]);
  if (text != null) n.textContent = text;
  if (parent) parent.appendChild(n);
  return n;
}
function scale(d0, d1, r0, r1) { return function (v) { return r0 + (v - d0) / (d1 - d0) * (r1 - r0); }; }
function fmt(v, n) { return (+v).toFixed(n == null ? 3 : n); }
function live(el, draw) {
  function go() { el.innerHTML = ""; draw(Math.max(260, el.clientWidth)); }
  go();
  if (el._ro) el._ro.disconnect();
  if (window.ResizeObserver) { var w = el.clientWidth; el._ro = new ResizeObserver(function () { if (Math.abs(el.clientWidth - w) > 8) { w = el.clientWidth; go(); } }); el._ro.observe(el); }
}
function bindPick(g, fn, label) {
  g.setAttribute("class", (g.getAttribute("class") || "") + " pick");
  g.setAttribute("tabindex", 0); g.setAttribute("role", "button");
  if (label) g.setAttribute("aria-label", label);
  g.addEventListener("click", fn);
  g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); } });
}
/* Compound codes (contain a digit) in capitals, generic drug names as written. */
function drugName(s) { return /\d/.test(s) ? s.toUpperCase() : s; }
function cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
function hex2rgb(h) { h = h.replace("#", ""); return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
function ramp(v) {
  var stops = [0, 1, 2, 3].map(function (i) { return hex2rgb(cssVar("--ramp" + i) || "#888888"); });
  var t = Math.max(0, Math.min(1, v)) * 3, i = Math.min(2, Math.floor(t)), f = t - i, a = stops[i], b = stops[i + 1];
  var c = a.map(function (x, k) { return Math.round(x + (b[k] - x) * f); });
  return { fill: "rgb(" + c.join(",") + ")", dark: (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) < 140 };
}

var FEAT = { total_area: "Area", equivalent_diameter: "Diameter", perimeter: "Perimeter", solidity: "Solidity", circularity: "Roundness", eccentricity: "Elongation" };
var ABL_NAME = {
  "1_baseline": "Baseline, standard aug.", "2_freeze_encoder": "Frozen encoder", "3_heavy_aug": "Heavy augmentation",
  "4_freeze_heavy_aug": "Heavy aug., frozen encoder", "5_low_lr": "Lower learning rate", "6_freeze_lowlr_heavy": "Heavy aug., frozen, low LR",
  "7_focal_dice": "Focal-Dice loss", "8_high_wd": "Strong weight decay", "9_efficientnet_b0": "EfficientNet-B0, frozen",
  "10_resnet18": "ResNet-18, frozen", "11_edge_channel": "Edge-map input, frozen", "12_boundary_loss": "Boundary loss, frozen", "13_unetplusplus": "U-Net++, frozen"
};
var SHORT = { "U-Net (heavy aug.)": "U-Net heavy", "Pseudo-label + fine-tune": "Pseudo-label", "SAM2 (grayscale)": "SAM2", "SAM2 (multi-channel)": "SAM2 multi",
  "Rule-based baseline": "Rule-based", "nnU-Net (default)": "nnU-Net", "nnU-Net + cleanup": "nnU-Net + cleanup", "nnU-Net (multi-channel)": "nnU-Net multi" };
var PARAM = { width: "Cell size", cm_adhesion: "Cell-medium adhesion", contact: "Cell-cell adhesion", contact_no: "Contact range",
  temp: "Motility", lambda: "Volume stiffness", neighbor: "Neighbour order" };

/* 13 U-Net runs. Wide: fixed label column, 22 px rows, value column on the right. */
function chartAblation(el, opts) {
  opts = opts || {};
  live(el, function (W) {
    var rows = N.ablation.slice().sort(function (a, b) { return b.dice - a.dice; });
    var narrow = W < 460, lab = narrow ? 0 : 196, rh = narrow ? 34 : 24, top = 4, valW = 46, H = top + rows.length * rh + 26;
    var s = E("svg", { width: W, height: H, role: "img", "aria-label": "Test Dice of 13 U-Net configurations" }, el);
    var x = scale(0.70, 0.84, lab + 6, W - valW - 8);
    [0.70, 0.74, 0.78, 0.82].forEach(function (t) {
      E("line", { x1: x(t), x2: x(t), y1: top, y2: H - 22, class: "c-grid" }, s);
      E("text", { x: x(t), y: H - 6, "text-anchor": "middle", class: "c-ax" }, s, fmt(t, 2));
    });
    var pos = {};
    rows.forEach(function (r, i) {
      var y = top + i * rh + (narrow ? 24 : rh / 2), chosen = r.name === "3_heavy_aug", dim = opts.pair && !(r.name === "1_baseline" || chosen);
      pos[r.name] = y;
      var g = E("g", { opacity: dim ? 0.25 : 1 }, s);
      E("rect", { x: 0, y: y - (narrow ? 22 : rh / 2), width: W, height: rh, class: opts.sel === r.name ? "c-sel" : "c-hit" }, g);
      E("text", { x: narrow ? x(0.70) : lab, y: narrow ? y - 10 : y + 4, "text-anchor": narrow ? "start" : "end", class: "c-lab" + (chosen ? " c-strong" : "") }, g, ABL_NAME[r.name]);
      E("line", { x1: x(0.70), x2: x(r.dice), y1: y, y2: y, class: "c-stem" }, g);
      E("circle", { cx: x(r.dice), cy: y, r: chosen ? 6 : 4.5, class: r.aug === "heavy" ? "c-acc-f" : "c-hollow" }, g);
      E("text", { x: W - 2, y: y + 4, "text-anchor": "end", class: "c-num" + (chosen ? " c-strong" : "") }, g, fmt(r.dice));
      if (opts.onPick) bindPick(g, function () { opts.onPick(r); }, ABL_NAME[r.name] + ", test Dice " + r.dice);
    });
    if (opts.pair) {
      var a = N.ablation.find(function (r) { return r.name === "1_baseline"; }), b = N.ablation.find(function (r) { return r.name === "3_heavy_aug"; });
      var xm = x(b.dice) + 16;
      E("path", { d: "M" + (x(a.dice) + 8) + "," + pos["1_baseline"] + " H" + xm + " V" + pos["3_heavy_aug"] + " H" + (x(b.dice) + 9), class: "c-acc-l" }, s);
      E("text", { x: xm + 6, y: (pos["1_baseline"] + pos["3_heavy_aug"]) / 2 + 4, class: "c-acc-t c-strong" }, s, "+" + fmt(b.dice - a.dice));
    }
  });
}

/* Dice vs measurement agreement. Only the chosen model and the instructive outlier are labelled; others on hover/click. */
function chartModels(el, sel, onPick) {
  var LABELLED = ["U-Net (heavy aug.)", "nnU-Net + cleanup"];
  live(el, function (W) {
    var H = Math.round(Math.min(340, Math.max(250, W * 0.6))), L = 40, B = 34, T = 26;
    var s = E("svg", { width: W, height: H, role: "img", "aria-label": "Pixel Dice against measurement agreement for eight segmenters" }, el);
    var x = scale(0.745, 0.84, L, W - 12), y = scale(0, 0.9, H - B, T);
    E("text", { x: L - 30, y: 12, class: "c-ax" }, s, "Agreement with expert (CCC)");
    [0, 0.2, 0.4, 0.6, 0.8].forEach(function (t) { E("line", { x1: L, x2: W - 12, y1: y(t), y2: y(t), class: "c-grid" }, s); E("text", { x: L - 8, y: y(t) + 4, "text-anchor": "end", class: "c-ax" }, s, fmt(t, 1)); });
    [0.76, 0.78, 0.80, 0.82].forEach(function (t) { E("text", { x: x(t), y: H - B + 17, "text-anchor": "middle", class: "c-ax" }, s, fmt(t, 2)); });
    E("text", { x: W - 12, y: H - 3, "text-anchor": "end", class: "c-ax" }, s, "Pixel overlap with expert (Dice)");
    E("line", { x1: L, x2: W - 12, y1: y(N.bar), y2: y(N.bar), class: "c-target" }, s);
    E("text", { x: W - 12, y: y(N.bar) - 6, "text-anchor": "end", class: "c-target-t" }, s, "reliable from " + N.bar);
    N.models.forEach(function (m) {
      var on = m.label === sel, cx = x(m.dice), cy = y(m.ccc), show = on || LABELLED.indexOf(m.label) > -1;
      var g = E("g", {}, s);
      E("title", {}, g, m.label + ": Dice " + m.dice + ", agreement " + m.ccc);
      E("circle", { cx: cx, cy: cy, r: 14, class: "c-hit" }, g);
      E("circle", { cx: cx, cy: cy, r: on ? 7.5 : 5, class: "pt " + (on ? "c-acc-f" : (m.winner ? "c-ink-f" : "c-mute-f")) }, g);
      if (show) {
        var right = cx < W * 0.6, above = !m.winner;
        E("text", { x: above ? cx : cx + (right ? 12 : -12), y: above ? cy - 12 : cy + 4, "text-anchor": above ? "middle" : (right ? "start" : "end"), class: "c-lab" + (on ? " c-strong" : "") }, g, SHORT[m.label] || m.label);
      }
      bindPick(g, function () { onPick(m.label); }, m.label + ", Dice " + m.dice + ", agreement " + m.ccc);
    });
  });
}

/* Per-measurement agreement for one segmenter. */
function chartFeatures(el, label) {
  var m = N.models.find(function (p) { return p.label === label; });
  live(el, function (W) {
    var keys = Object.keys(FEAT), rh = 26, lab = 84, H = keys.length * rh + 24;
    var s = E("svg", { width: W, height: H, role: "img", "aria-label": "Per-measurement agreement for " + label }, el);
    var x = scale(-0.1, 1, lab, W - 8);
    E("rect", { x: x(N.bar), y: 0, width: x(1) - x(N.bar), height: H - 20, class: "c-band-good" }, s);
    E("line", { x1: x(0), x2: x(0), y1: 0, y2: H - 20, class: "c-grid" }, s);
    E("line", { x1: x(N.bar), x2: x(N.bar), y1: 0, y2: H - 20, class: "c-target" }, s);
    E("text", { x: x(N.bar), y: H - 5, "text-anchor": "middle", class: "c-target-t" }, s, N.bar);
    keys.forEach(function (k, i) {
      var v = m.feat[k], y = i * rh + 4, pass = v >= N.bar, w = Math.abs(x(v) - x(0));
      E("text", { x: lab - 8, y: y + 13, "text-anchor": "end", class: "c-lab" }, s, FEAT[k]);
      E("rect", { x: Math.min(x(0), x(v)), y: y + 2, width: Math.max(2, w), height: rh - 10, rx: 3, class: pass ? "c-acc-f" : "c-mute-f" }, s);
      var inside = w > 40 && v > 0;
      E("text", { x: inside ? x(v) - 6 : Math.max(x(0), x(v)) + 6, y: y + 13, "text-anchor": inside ? "end" : "start", class: inside ? "c-in" : "c-num" }, s, fmt(v, 2));
    });
  });
}

/* Share of real frames inside the augmented training range. */
function chartCoverage(el) {
  live(el, function (W) {
    var rh = 40, H = N.augcov.length * rh, lab = 92;
    var s = E("svg", { width: W, height: H, role: "img", "aria-label": "Coverage of real image conditions by the training set" }, el);
    var x = scale(0, 100, lab, W - 46);
    N.augcov.forEach(function (c, i) {
      var y = i * rh + 10, nm = { contrast: "Contrast", focus: "Focus", intensity: "Brightness" }[c.key];
      E("text", { x: lab - 10, y: y + 13, "text-anchor": "end", class: "c-lab" }, s, nm);
      E("rect", { x: x(0), y: y, width: x(100) - x(0), height: 18, rx: 3, class: "c-track" }, s);
      E("rect", { x: x(0), y: y, width: x(c.coverage) - x(0), height: 18, rx: 3, class: c.coverage < 50 ? "c-warn-f" : "c-acc-f" }, s);
      E("text", { x: W - 2, y: y + 14, "text-anchor": "end", class: "c-num c-strong" }, s, c.coverage + "%");
    });
  });
}

/* Leave-one-out recovery per simulator parameter, with weak / identifiable bands. */
function chartIdent(el, onPick, sel) {
  live(el, function (W) {
    var rows = N.ident, lab = W < 420 ? 112 : 150, rh = 28, H = rows.length * rh + 26;
    var s = E("svg", { width: W, height: H, role: "img", "aria-label": "Parameter recovery from shape" }, el);
    var x = scale(-0.1, 1, lab, W - 8);
    E("rect", { x: x(0.3), y: 0, width: x(0.7) - x(0.3), height: H - 22, class: "c-band-weak" }, s);
    E("rect", { x: x(0.7), y: 0, width: x(1) - x(0.7), height: H - 22, class: "c-band-good" }, s);
    E("text", { x: (x(0.3) + x(0.7)) / 2, y: H - 6, "text-anchor": "middle", class: "c-ax" }, s, "weak");
    E("text", { x: (x(0.7) + x(1)) / 2, y: H - 6, "text-anchor": "middle", class: "c-target-t" }, s, "reliable");
    E("line", { x1: x(0), x2: x(0), y1: 0, y2: H - 22, class: "c-grid" }, s);
    rows.forEach(function (r, i) {
      var y = i * rh + 4, w = Math.abs(x(r.r2) - x(0)), inside = w > 40 && r.r2 > 0;
      var g = E("g", {}, s);
      E("rect", { x: 0, y: y - 2, width: W, height: rh, class: sel === r.param ? "c-sel" : "c-hit" }, g);
      E("text", { x: lab - 10, y: y + 14, "text-anchor": "end", class: "c-lab" + (sel === r.param ? " c-strong" : "") }, g, PARAM[r.param]);
      E("rect", { x: Math.min(x(0), x(r.r2)), y: y + 2, width: Math.max(2, w), height: rh - 10, rx: 3, class: r.r2 >= 0.3 ? "c-acc-f" : "c-mute-f" }, g);
      E("text", { x: inside ? x(r.r2) - 6 : Math.max(x(0), x(r.r2)) + 6, y: y + 14, "text-anchor": inside ? "end" : "start", class: inside ? "c-in" : "c-num" }, g, fmt(r.r2, 2));
      if (onPick) bindPick(g, function () { onPick(r); }, PARAM[r.param] + ", recovery " + fmt(r.r2, 2));
    });
  });
}

/* Drug panel forest plot. */
function chartForest(el, onPick, sel) {
  live(el, function (W) {
    var rows = N.forest.slice().sort(function (a, b) { return a.est - b.est; });
    var lab = W < 420 ? 96 : 120, rh = 22, H = rows.length * rh + 30;
    var lo = Math.min.apply(null, rows.map(function (r) { return r.lo; })), hi = Math.max.apply(null, rows.map(function (r) { return r.hi; }));
    var s = E("svg", { width: W, height: H, role: "img", "aria-label": "Inferred change in cell-cell adhesion per drug" }, el);
    var x = scale(Math.floor(lo), Math.ceil(hi), lab, W - 10);
    [-10, -5, 0, 5].forEach(function (t) { if (t >= lo && t <= hi) { E("line", { x1: x(t), x2: x(t), y1: 0, y2: H - 24, class: t === 0 ? "c-zero" : "c-grid" }, s); E("text", { x: x(t), y: H - 7, "text-anchor": "middle", class: "c-ax" }, s, (t > 0 ? "+" : "") + t); } });
    rows.forEach(function (r, i) {
      var y = i * rh + 10, c = r.sig === "sig" ? "c-acc" : r.sig === "borderline" ? "c-ink" : "c-mute";
      var g = E("g", {}, s);
      E("rect", { x: 0, y: y - rh / 2, width: W, height: rh, class: sel === r.label ? "c-sel" : "c-hit" }, g);
      E("text", { x: lab - 8, y: y + 4, "text-anchor": "end", class: "c-lab" + (r.sig === "sig" ? " c-strong" : "") }, g, drugName(r.label));
      E("line", { x1: x(r.lo), x2: x(r.hi), y1: y, y2: y, class: c + "-l" }, g);
      E("circle", { cx: x(r.est), cy: y, r: r.sig === "sig" ? 5.5 : 3.8, class: c + "-f" }, g);
      if (onPick) bindPick(g, function () { onPick(r); }, drugName(r.label) + ", shift " + fmt(r.est, 2));
    });
  });
}

/* Test wells x segmenters, sequential ramp, 2 px gaps. */
function chartSegMatrix(el, onPick, selW, selM) {
  live(el, function (W) {
    var models = SEG.models, ex = SEG.examples, lab = W < 460 ? 96 : 140;
    var top = 24, ch = 32, cw = (W - lab) / ex.length, H = top + models.length * ch;
    var s = E("svg", { width: W, height: H, role: "img", "aria-label": "Dice per test well and segmenter" }, el);
    ex.forEach(function (e, j) { E("text", { x: lab + cw * j + cw / 2, y: 15, "text-anchor": "middle", class: "c-id" + (j === selW ? " c-strong" : "") }, s, e.well); });
    models.forEach(function (m, i) {
      var y = top + i * ch;
      E("text", { x: lab - 10, y: y + ch / 2 + 4, "text-anchor": "end", class: "c-lab" + (m === selM ? " c-strong" : "") }, s, SHORT[m] || m);
      ex.forEach(function (e, j) {
        var v = e.models[m] ? e.models[m].dice : null, on = j === selW && m === selM, c = ramp(v == null ? 0 : (v - 0.1) / 0.85);
        var g = E("g", { class: "cell" }, s);
        g.addEventListener("mouseenter", function () { s.appendChild(g); });
        E("rect", { x: lab + cw * j + 1, y: y + 1, width: cw - 2, height: ch - 2, rx: 3, fill: c.fill }, g);
        if (on) E("rect", { x: lab + cw * j + 1, y: y + 1, width: cw - 2, height: ch - 2, rx: 3, class: "c-ring" }, g);
        E("text", { x: lab + cw * j + cw / 2, y: y + ch / 2 + 4, "text-anchor": "middle", class: "c-cell" + (c.dark ? " on-dark" : " on-light") + (on ? " c-strong" : "") }, g, v == null ? "" : fmt(v, 2));
        bindPick(g, function () { onPick(j, m); }, "Well " + e.well + ", " + m + ", Dice " + v);
      });
    });
  });
}

/* 45 test images per segmenter as dots, mean as a bar. */
function chartDiceStrip(el, selM) {
  live(el, function (W) {
    var models = SEG.models, rh = 30, lab = W < 460 ? 96 : 140, H = models.length * rh + 22;
    var s = E("svg", { width: W, height: H, role: "img", "aria-label": "Dice on all 45 test images per segmenter" }, el);
    var x = scale(0, 1, lab, W - 8);
    [0, 0.25, 0.5, 0.75, 1].forEach(function (t) { E("line", { x1: x(t), x2: x(t), y1: 0, y2: H - 18, class: "c-grid" }, s); E("text", { x: x(t), y: H - 4, "text-anchor": "middle", class: "c-ax" }, s, t); });
    models.forEach(function (m, i) {
      var y = i * rh + rh / 2, v = SEG.dice[m].filter(function (d) { return d != null; }), mean = v.reduce(function (a, b) { return a + b; }, 0) / v.length, on = m === selM;
      E("text", { x: lab - 10, y: y + 4, "text-anchor": "end", class: "c-lab" + (on ? " c-strong" : "") }, s, SHORT[m] || m);
      v.forEach(function (d, k) { E("circle", { cx: x(d), cy: y + ((k * 7) % 11) - 5, r: 2.6, class: on ? "c-acc-f" : "c-mute-f", "fill-opacity": 0.75 }, s); });
      E("line", { x1: x(mean), x2: x(mean), y1: y - 11, y2: y + 11, class: on ? "c-acc-l" : "c-ink-l", "stroke-width": 2.5 }, s);
    });
  });
}

/* Tiny KPI charts drawn from the same real data. */
function miniChart(el, kind) {
  var W = 112, H = 34, s = E("svg", { width: W, height: H, "aria-hidden": "true", class: "mini" }, el), i;
  if (kind === "ablation") {
    var v = N.ablation.map(function (a) { return a.dice; }).sort(), x = scale(0.72, 0.83, 4, W - 4);
    E("line", { x1: 2, x2: W - 2, y1: H / 2, y2: H / 2, class: "c-grid" }, s);
    v.forEach(function (d) { E("circle", { cx: x(d), cy: H / 2, r: d === Math.max.apply(null, v) ? 4 : 2.5, class: d === Math.max.apply(null, v) ? "c-acc-f" : "c-mute-f" }, s); });
  } else if (kind === "features") {
    var m = N.models.find(function (p) { return p.winner; }), ks = Object.keys(FEAT), bw = (W - 4) / ks.length;
    ks.forEach(function (k, j) { var h = Math.max(1, m.feat[k]) * (H - 4); var hh = Math.max(2, m.feat[k] * (H - 4)); E("rect", { x: 2 + j * bw + 2, y: H - 2 - hh, width: bw - 4, height: hh, rx: 1.5, class: m.feat[k] >= N.bar ? "c-acc-f" : "c-mute-f" }, s); });
  } else if (kind === "ident") {
    var bw2 = (W - 4) / N.ident.length;
    N.ident.forEach(function (r, j) { var hh = Math.max(2, Math.max(0, r.r2) * (H - 4)); E("rect", { x: 2 + j * bw2 + 2, y: H - 2 - hh, width: bw2 - 4, height: hh, rx: 1.5, class: r.r2 >= 0.3 ? "c-acc-f" : "c-mute-f" }, s); });
    E("line", { x1: 2, x2: W - 2, y1: H - 2 - 0.7 * (H - 4), y2: H - 2 - 0.7 * (H - 4), class: "c-target" }, s);
  } else if (kind === "forest") {
    var rows = N.forest.slice().sort(function (a, b) { return a.est - b.est; }), xs = scale(-9, 7, 4, W - 4), rh = (H - 4) / rows.length;
    E("line", { x1: xs(0), x2: xs(0), y1: 0, y2: H, class: "c-zero" }, s);
    rows.forEach(function (r, j) { E("circle", { cx: xs(r.est), cy: 2 + j * rh + rh / 2, r: r.sig === "sig" ? 3 : 1.6, class: r.sig === "sig" ? "c-acc-f" : "c-mute-f" }, s); });
  } else if (kind === "frames") {
    for (i = 0; i < 24; i++) E("rect", { x: 2 + (i % 12) * 9, y: i < 12 ? 6 : 19, width: 7, height: 9, rx: 1.5, class: i % 5 === 0 ? "c-acc-f" : "c-mute-f" }, s);
  } else if (kind === "sims") {
    for (i = 0; i < 30; i++) E("circle", { cx: 6 + (i % 10) * 11, cy: i < 10 ? 7 : i < 20 ? 17 : 27, r: 3.6, class: i === 13 ? "c-acc-f" : "c-mute-f" }, s);
  }
  return s;
}
