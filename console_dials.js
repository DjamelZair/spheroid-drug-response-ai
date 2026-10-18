/* Dial explorer: pick a simulator dial, slide its setting, watch the simulated spheroid and its
   trajectory (mean ± sd over six replicate seeds). Data: dials.js (DIALS). Playback follows the
   shared Film clock when present. */
var Dials = (function () {
  var METRIC = { c: ["Roundness", "× start"], s: ["Solidity", "× start"], d: ["Size", "× start"], n: ["Fragments", "pieces"] };
  var di = 0, li = 1, mk = "c", onInfo = null, chart, disc, readout, t = 0, x, y, head, dots = [];
  function series(lv, k) {
    var m = lv.m[k];
    if (k === "n") return { mean: m.mean, sd: m.sd };
    var b = m.mean[0];
    return { mean: m.mean.map(function (v) { return v / b; }), sd: m.sd ? m.sd.map(function (v) { return v / b; }) : null };
  }
  function draw() {
    var D = DIALS.dials[di], steps = DIALS.mcs;
    chart.innerHTML = "";
    var W = Math.max(260, chart.clientWidth), H = Math.round(Math.min(260, Math.max(200, W * 0.55))), L = 44, B = 28, T = 10;
    var all = [];
    D.levels.forEach(function (lv) { var s = series(lv, mk); s.mean.forEach(function (v, i) { var e = s.sd ? s.sd[i] : 0; all.push(v + e, v - e); }); });
    var lo = Math.min.apply(null, all), hi = Math.max.apply(null, all);
    if (mk !== "n") { lo = Math.min(lo, 0.9); hi = Math.max(hi, 1.1); } else { lo = 0; hi = Math.max(hi, 2); }
    var pad = (hi - lo) * 0.08; lo -= pad; hi += pad;
    var s = E("svg", { width: W, height: H, role: "img", "aria-label": METRIC[mk][0] + " over simulation steps for three settings of " + D.name }, chart);
    x = scale(0, steps[steps.length - 1], L, W - 54); y = scale(lo, hi, H - B, T);
    y.ticks = [];
    var step = (hi - lo) / 4;
    for (var k = 0; k <= 4; k++) { var v = lo + step * k; E("line", { x1: L, x2: W - 54, y1: y(v), y2: y(v), class: "c-grid" }, s); E("text", { x: L - 8, y: y(v) + 4, "text-anchor": "end", class: "c-ax" }, s, mk === "n" ? Math.round(v) : v.toFixed(2)); }
    if (mk !== "n" && lo < 1 && hi > 1) E("line", { x1: L, x2: W - 54, y1: y(1), y2: y(1), class: "c-zero" }, s);
    [0, 200, 400, 600, 800, 990].forEach(function (v) { E("text", { x: x(v), y: H - 8, "text-anchor": "middle", class: "c-ax" }, s, v); });
    dots = [];
    D.levels.forEach(function (lv, i) {
      var ser = series(lv, mk), on = i === li;
      var g = E("g", {}, s);
      if (ser.sd) { var band = steps.map(function (st, k) { return x(st) + "," + y(ser.mean[k] + ser.sd[k]); }).concat(steps.slice().reverse().map(function (st, k2) { var k = steps.length - 1 - k2; return x(st) + "," + y(ser.mean[k] - ser.sd[k]); })); E("polygon", { points: band.join(" "), class: "dial-band" + (on ? " on" : "") }, g); }
      E("path", { d: steps.map(function (st, k) { return (k ? "L" : "M") + x(st) + "," + y(ser.mean[k]); }).join(""), class: "c-hitline" }, g);
      E("path", { d: steps.map(function (st, k) { return (k ? "L" : "M") + x(st) + "," + y(ser.mean[k]); }).join(""), class: "traj" + (on ? " traj-on" : ""), pathLength: 1 }, g);
      E("text", { x: W - 48, y: y(ser.mean[ser.mean.length - 1]) + 4, class: "c-ax" + (on ? " c-strong" : "") }, g, lv.label);
      bindPick(g, function () { set(di, i); }, D.name + ", " + lv.label + " setting");
      dots.push({ el: E("circle", { r: on ? 5 : 3, class: on ? "c-acc-f" : "c-mute-f" }, s), ser: ser });
    });
    head = E("line", { y1: T, y2: H - B, class: "playhead" }, s);
    move(t);
  }
  function move(tt) {
    t = tt;
    var steps = DIALS.mcs, pos = tt * (steps.length - 1), a = Math.floor(pos), b = Math.min(steps.length - 1, a + 1), fr = pos - a;
    var st = steps[a] + (steps[b] - steps[a]) * fr;
    if (head) { head.setAttribute("x1", x(st)); head.setAttribute("x2", x(st)); }
    dots.forEach(function (d) { var v = d.ser.mean[a] + (d.ser.mean[b] - d.ser.mean[a]) * fr; d.el.setAttribute("cx", x(st)); d.el.setAttribute("cy", y(v)); });
    var lv = DIALS.dials[di].levels[li], ia = disc.querySelector(".sa"), ib = disc.querySelector(".sb");
    if (ia.dataset.src !== lv.frames[a]) { ia.src = lv.frames[a]; ia.dataset.src = lv.frames[a]; }
    if (ib.dataset.src !== lv.frames[b]) { ib.src = lv.frames[b]; ib.dataset.src = lv.frames[b]; }
    ib.style.opacity = fr.toFixed(2);
    var ser = series(lv, mk), v = ser.mean[a] + (ser.mean[b] - ser.mean[a]) * fr;
    readout.innerHTML = "<b>step " + Math.round(st) + "</b><span>" + METRIC[mk][0].toLowerCase() + " " + (mk === "n" ? Math.round(v) + " pieces" : v.toFixed(2) + "× start") + "</span>";
  }
  function set(d, l) {
    di = d; li = l;
    var D = DIALS.dials[di], lv = D.levels[li];
    var root = chart.closest(".dials");
    root.querySelectorAll("[data-dial]").forEach(function (b) { b.setAttribute("aria-pressed", +b.dataset.dial === di); });
    var rg = root.querySelector("#dial-range"); rg.max = D.levels.length - 1; rg.value = li;
    rg.setAttribute("aria-valuetext", lv.label + ", " + lv.value);
    root.querySelector("#dial-name").textContent = D.name;
    root.querySelector("#dial-desc").textContent = D.desc;
    root.querySelector("#dial-partial").textContent = D.partial ? "Pilot result, " + D.partial + "." : "";
    root.querySelector("#dial-val").innerHTML = "<b>" + (D.new ? lv.label : lv.label + " " + lv.value) + "</b>, " + lv.seeds + (lv.expected && lv.seeds < lv.expected ? " of " + lv.expected : "") + " replicate" + (lv.seeds === 1 ? "" : "s");
    root.querySelector(".dial-ticks").innerHTML = D.levels.map(function (q, i) { return '<span class="' + (i === li ? "on" : "") + '">' + (D.new ? q.label : q.label + " " + q.value) + "</span>"; }).join("");
    root.querySelector(".dial-ends").innerHTML = D.levels.map(function (q, i) { return '<button type="button" aria-pressed="' + (i === li) + '"><img alt="End state, ' + q.label + '" src="' + q.frames[q.frames.length - 1] + '"><span>' + q.label + "</span></button>"; }).join("");
    root.querySelector(".dial-ends").style.gridTemplateColumns = "repeat(" + D.levels.length + ",minmax(0,1fr))";
    root.querySelectorAll(".dial-ends button").forEach(function (b, i) { b.onclick = function () { set(di, i); }; });
    D.levels.forEach(function (q) { q.frames.forEach(function (f) { var im = new Image(); im.src = f; }); });
    draw();
  }
  function neutral(D) { var i = D.levels.findIndex(function (q) { return q.value === 0; }); return i > -1 ? i : (D.new ? 0 : 1); }
  function mount(el, info) {
    onInfo = info;
    el.innerHTML = '<div class="dials">' +
      '<div class="dial-left"><div class="dial-pick" role="group" aria-label="Simulator dial">' + DIALS.dials.map(function (d, i) { return '<button type="button" data-dial="' + i + '">' + d.name + (d.new ? '<span class="new">New</span>' : "") + "</button>"; }).join("") + "</div>" +
      '<div class="dial-head"><h3 id="dial-name"></h3><p id="dial-desc"></p><p class="dial-partial" id="dial-partial"></p></div>' +
      '<label class="dial-slider"><span class="sr">Setting</span><input type="range" id="dial-range" min="0" max="2" step="1" value="1"><span class="dial-ticks"></span></label>' +
      '<p class="dial-val" id="dial-val"></p>' +
      '<div class="dial-stage"><div class="sim-disc dial-disc"><img alt="" class="sa"><img alt="" class="sb"></div><div class="dial-read" id="dial-read"></div></div></div>' +
      '<div class="dial-right"><div class="seg-tabs dial-metric" role="tablist">' + Object.keys(METRIC).map(function (k) { return '<button type="button" role="tab" data-mk="' + k + '">' + METRIC[k][0] + "</button>"; }).join("") + "</div>" +
      '<div id="dial-chart"></div><p class="ph-sub">Simulation steps on the horizontal axis. Line is the mean of six replicate runs, band is one standard deviation. Click a line to switch setting.</p>' +
      '<div class="dial-ends" role="group" aria-label="End state per setting"></div></div></div>';
    chart = el.querySelector("#dial-chart"); disc = el.querySelector(".dial-disc"); readout = el.querySelector("#dial-read");
    el.querySelectorAll("[data-dial]").forEach(function (b) { b.onclick = function () { var nd = DIALS.dials[+b.dataset.dial]; if (nd.prefer) { mk = nd.prefer; el.querySelectorAll("[data-mk]").forEach(function (x2) { x2.setAttribute("aria-selected", x2.dataset.mk === mk); }); } set(+b.dataset.dial, neutral(nd)); }; });
    el.querySelector("#dial-range").addEventListener("input", function (e) { set(di, +e.target.value); });
    el.querySelectorAll("[data-mk]").forEach(function (b) { b.onclick = function () { mk = b.dataset.mk; el.querySelectorAll("[data-mk]").forEach(function (x2) { x2.setAttribute("aria-selected", x2 === b); }); draw(); }; });
    mk = DIALS.dials[0].prefer || "c";
    el.querySelector('[data-mk="' + mk + '"]').setAttribute("aria-selected", "true");
    disc.parentElement.addEventListener("click", function () { if (onInfo) onInfo(DIALS.dials[di], DIALS.dials[di].levels[li]); });
    if (window.ResizeObserver) { var w0 = chart.clientWidth; new ResizeObserver(function () { if (Math.abs(chart.clientWidth - w0) > 8) { w0 = chart.clientWidth; draw(); } }).observe(chart); }
    set(0, neutral(DIALS.dials[0]));
    if (window.Film && Film.subscribe) Film.subscribe(function (tt) { move(tt); });
  }
  return { mount: mount };
})();
