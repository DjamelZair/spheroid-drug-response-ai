/* Time-lapse module for the console versions: one shared clock drives the hero film,
   the trajectory playhead and the simulated spheroids. Data: films.js (FILMS).
   Real time (hours) and simulation steps are not calibrated against each other, so both
   are shown as progress through their own run. */
var Film = (function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var LOOP = 12000, t = 0, playing = !reduce, last = null, sel = 0, subs = [], visible = true;
  var cache = {};
  function preload(f) { if (cache[f.id]) return; cache[f.id] = f.frames.map(function (src) { var i = new Image(); i.src = src; return i; }); }
  function tick(now) {
    if (last != null && playing && visible) t = (t + (now - last) / LOOP) % 1;
    last = now;
    subs.forEach(function (fn) { fn(t); });
    requestAnimationFrame(tick);
  }
  function setPlaying(p) { playing = p; document.querySelectorAll("[data-film-toggle]").forEach(function (b) { b.setAttribute("aria-pressed", p); b.innerHTML = p ? '<i class="ph ph-pause"></i><span>Pause</span>' : '<i class="ph ph-play"></i><span>Play</span>'; }); }
  function select(i) { sel = i; preload(FILMS.real[i]); document.querySelectorAll("[data-film-well]").forEach(function (b) { b.setAttribute("aria-pressed", +b.dataset.filmWell === i); }); subs.forEach(function (fn) { fn(t, true); }); }
  function realAt(f, tt) { var k = Math.round(tt * (f.frames.length - 1)); return { k: k, h: f.h[k], rel: f.rel[k] }; }

  /* Hero: circular film with a time ring. */
  function mountHero(el) {
    var R = 46, C = 2 * Math.PI * R;
    el.innerHTML = '<div class="film-stage"><div class="film-disc"><img alt="" id="hf-img"></div>' +
      '<svg class="film-ring" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="' + R + '" class="ring-bg"/><circle cx="50" cy="50" r="' + R + '" class="ring-fg" id="hf-ring" stroke-dasharray="' + C + '" stroke-dashoffset="' + C + '"/></svg>' +
      '<div class="film-read"><span class="fr-h" id="hf-h">0 h</span><span class="fr-a" id="hf-a"></span></div></div>' +
      '<div class="film-meta"><p class="film-cond" id="hf-cond"></p><div class="film-wells" role="group" aria-label="Choose a well">' + FILMS.real.map(function (f, i) { return '<button type="button" data-film-well="' + i + '" title="' + f.label + '">' + f.id + "</button>"; }).join("") +
      '</div><button type="button" class="film-play" data-film-toggle aria-pressed="true"></button></div>';
    el.querySelectorAll("[data-film-well]").forEach(function (b) { b.onclick = function () { select(+b.dataset.filmWell); }; });
    el.querySelector("[data-film-toggle]").onclick = function () { setPlaying(!playing); };
    var img = el.querySelector("#hf-img"), ring = el.querySelector("#hf-ring"), hh = el.querySelector("#hf-h"), aa = el.querySelector("#hf-a"), cond = el.querySelector("#hf-cond"), lastK = -1, lastSel = -1;
    subs.push(function (tt, force) {
      var f = FILMS.real[sel], r = realAt(f, tt);
      if (r.k !== lastK || sel !== lastSel || force) { img.src = f.frames[r.k]; img.alt = "Well " + f.id + ", " + f.label + ", hour " + r.h; hh.textContent = Math.round(r.h) + " h"; aa.textContent = "area " + r.rel.toFixed(2) + "× start"; lastK = r.k; }
      if (sel !== lastSel || force) { cond.innerHTML = '<span class="wid">' + f.id + "</span> " + f.label; lastSel = sel; }
      ring.setAttribute("stroke-dashoffset", C * (1 - tt));
    });
  }

  /* Panel: real area trajectories with playhead + three simulated spheroids in sync. */
  function mountPanel(chartEl, simEl, onSim) {
    var paths = [], head, dots = [], W = 0, H = 0, x, y;
    function draw() {
      chartEl.innerHTML = "";
      W = Math.max(260, chartEl.clientWidth); H = Math.round(Math.min(280, Math.max(200, W * 0.5)));
      var L = 40, B = 30, T = 12, s = E("svg", { width: W, height: H, role: "img", "aria-label": "Cluster area over 72 hours for four wells, relative to the first frame" }, chartEl);
      var ymax = Math.ceil(Math.max.apply(null, FILMS.real.map(function (q) { return Math.max.apply(null, q.rel); })) * 4) / 4 + 0.1; x = scale(0, 72, L, W - 34); y = scale(0, ymax, H - B, T);
      [0, 0.25, 0.5, 0.75, 1, 1.25].filter(function (v) { return v <= ymax; }).forEach(function (v) { E("line", { x1: L, x2: W - 34, y1: y(v), y2: y(v), class: v === 1 ? "c-zero" : "c-grid" }, s); E("text", { x: L - 8, y: y(v) + 4, "text-anchor": "end", class: "c-ax" }, s, v + "×"); });
      [0, 24, 48, 72].forEach(function (v) { E("text", { x: x(v), y: H - 10, "text-anchor": "middle", class: "c-ax" }, s, v + " h"); });
      paths = []; dots = []; var labs = [];
      FILMS.real.forEach(function (f, i) {
        var d = f.h.map(function (h, k) { return (k ? "L" : "M") + x(h).toFixed(1) + "," + y(f.rel[k]).toFixed(1); }).join("");
        var g = E("g", {}, s);
        E("path", { d: d, class: "c-hitline" }, g);
        var p = E("path", { d: d, class: "traj" + (i === sel ? " traj-on" : ""), pathLength: 1 }, g);
        labs.push({ y: y(f.rel[f.rel.length - 1]) + 4, el: E("text", { x: W - 30, "text-anchor": "start", class: "c-ax traj-lab" + (i === sel ? " c-strong" : "") }, g, f.id) });
        bindPick(g, function () { select(i); }, "Well " + f.id + ", " + f.label);
        paths.push(p); dots.push(E("circle", { r: i === sel ? 5 : 3, class: i === sel ? "c-acc-f" : "c-mute-f" }, s));
      });
      labs.sort(function (p, q) { return p.y - q.y; });
      for (var k = 1; k < labs.length; k++) if (labs[k].y - labs[k - 1].y < 13) labs[k].y = labs[k - 1].y + 13;
      labs.forEach(function (l) { l.el.setAttribute("y", l.y); });
      head = E("line", { y1: T, y2: H - B, class: "playhead" }, s);
    }
    draw();
    if (window.ResizeObserver) { var w0 = chartEl.clientWidth; new ResizeObserver(function () { if (Math.abs(chartEl.clientWidth - w0) > 8) { w0 = chartEl.clientWidth; draw(); } }).observe(chartEl); }
    simEl.innerHTML = FILMS.sim.map(function (f, i) {
      return '<button type="button" class="sim-film" data-sim="' + i + '"><span class="sim-disc"><img alt="" class="sa"><img alt="" class="sb"></span><span class="sim-lab">' + f.label + '</span><span class="sim-val"></span></button>';
    }).join("");
    simEl.querySelectorAll("[data-sim]").forEach(function (b) { b.onclick = function () { onSim(FILMS.sim[+b.dataset.sim]); }; });
    FILMS.sim.forEach(preload);
    var lastSel = -1;
    subs.push(function (tt, force) {
      var f = FILMS.real[sel], r = realAt(f, tt), hx = x(r.h);
      head.setAttribute("x1", hx); head.setAttribute("x2", hx);
      FILMS.real.forEach(function (g, i) { var q = realAt(g, tt); dots[i].setAttribute("cx", x(q.h)); dots[i].setAttribute("cy", y(q.rel)); });
      if (sel !== lastSel || force) { draw(); lastSel = sel; }
      FILMS.sim.forEach(function (g, i) {
        var pos = tt * (g.frames.length - 1), a = Math.floor(pos), b = Math.min(g.frames.length - 1, a + 1), fr = pos - a;
        var btn = simEl.children[i], ia = btn.querySelector(".sa"), ib = btn.querySelector(".sb");
        if (ia.dataset.k != a) { ia.src = g.frames[a]; ia.dataset.k = a; }
        if (ib.dataset.k != b) { ib.src = g.frames[b]; ib.dataset.k = b; }
        ib.style.opacity = fr.toFixed(2);
        var rel = g.rel[a] + (g.rel[b] - g.rel[a]) * fr;
        btn.querySelector(".sim-val").textContent = "diameter " + rel.toFixed(2) + "× start";
      });
    });
  }

  function start() {
    select(0); setPlaying(playing);
    document.addEventListener("visibilitychange", function () { visible = !document.hidden; });
    requestAnimationFrame(tick);
  }
  return { subscribe: function (fn) { subs.push(fn); }, mountHero: mountHero, mountPanel: mountPanel, start: start, setPlaying: setPlaying, isPlaying: function () { return playing; } };
})();
