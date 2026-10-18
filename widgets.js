/* Image widgets shared by the portfolio pages. Data comes from data.js (IMG, AUG, N). */
function h(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }

/* Drag (or arrow-key) to compare the raw frame with the AI outline. */
function compareSlider(el, raw, over, alt) {
  el.classList.add("cmp");
  el.innerHTML = '<img src="' + raw + '" alt="' + alt + ', raw brightfield frame"><div class="cmp-top"><img src="' + over + '" alt="' + alt + ', with AI outline"></div>' +
    '<input type="range" min="0" max="100" value="50" aria-label="Slide between raw frame and AI outline"><span class="cmp-bar" aria-hidden="true"></span>';
  var r = el.querySelector("input"), top = el.querySelector(".cmp-top"), bar = el.querySelector(".cmp-bar");
  function set() { top.style.clipPath = "inset(0 0 0 " + r.value + "%)"; bar.style.left = r.value + "%"; }
  r.addEventListener("input", set); set();
}

/* Five real frames with a raw/outline toggle. */
function frameViewer(el) {
  var i = 0, outline = true;
  el.innerHTML = '<div class="fv-img"><img alt=""></div><div class="fv-side"><div class="fv-tabs" role="tablist"></div><p class="fv-note"></p>' +
    '<label class="fv-sw"><input type="checkbox" checked> Show the AI outline</label></div>';
  var img = el.querySelector("img"), note = el.querySelector(".fv-note"), tabs = el.querySelector(".fv-tabs");
  IMG.frames.forEach(function (f, k) {
    var b = h("button", "", f.label); b.type = "button"; b.setAttribute("role", "tab");
    b.onclick = function () { i = k; draw(); }; tabs.appendChild(b);
  });
  el.querySelector("input").onchange = function (e) { outline = e.target.checked; draw(); };
  function draw() {
    var f = IMG.frames[i]; img.src = outline ? f.img : f.raw; img.alt = f.label + (outline ? " with AI outline" : ", raw frame");
    note.textContent = f.note;
    [].forEach.call(tabs.children, function (b, k) { b.setAttribute("aria-selected", k === i); });
  }
  draw();
}

/* Original frame plus eight draws from the heavy augmentation policy. Click a draw to enlarge it. */
function augGrid(el) {
  el.innerHTML = '<figure class="ag-big"><img alt="Original training frame"><figcaption></figcaption></figure><div class="ag-grid"></div>';
  var big = el.querySelector(".ag-big img"), cap = el.querySelector("figcaption"), grid = el.querySelector(".ag-grid");
  AUG.forEach(function (p, k) {
    var b = h("button", "", '<img src="' + p + '" alt="">'); b.type = "button";
    b.setAttribute("aria-label", k ? "Augmented draw " + k : "Original frame");
    b.onclick = function () { show(k); }; grid.appendChild(b);
  });
  function show(k) {
    big.src = AUG[k]; cap.textContent = k ? "Random draw " + k + " of the heavy policy, same frame" : "The original traced frame";
    [].forEach.call(grid.children, function (b, j) { b.setAttribute("aria-pressed", j === k); });
  }
  show(0);
}

/* One treated well, day 1 / 3 / 5, AI outline and the area read off the mask. */
function dayStepper(el, which) {
  var d = IMG.overlay[which || 0], i = 0;
  el.innerHTML = '<div class="ds-img"><img alt=""></div><div class="ds-bar"><div class="ds-days" role="group" aria-label="Day"></div><p class="ds-read"></p></div>';
  var img = el.querySelector("img"), days = el.querySelector(".ds-days"), read = el.querySelector(".ds-read");
  d.panels.forEach(function (p, k) { var b = h("button", "", "Day " + p.day); b.type = "button"; b.onclick = function () { i = k; draw(); }; days.appendChild(b); });
  function draw() {
    var p = d.panels[i]; img.src = p.img; img.alt = d.label + ", day " + p.day + ", AI outline";
    read.innerHTML = "<b>" + p.area.toLocaleString("en-US") + "</b> px area &nbsp; roundness <b>" + p.round + "</b> &nbsp; solidity <b>" + p.solid + "</b>";
    [].forEach.call(days.children, function (b, k) { b.setAttribute("aria-pressed", k === i); });
  }
  draw();
  return d.label;
}

/* Simulated spheroids from the 1,105-run library. */
function simGallery(el, n) {
  IMG.sims.slice(0, n || IMG.sims.length).forEach(function (s) {
    var f = h("figure", "sg", '<img src="' + s.img + '" alt="Simulated spheroid, run ' + s.id + '"><figcaption>run ' + s.id + "<br>roundness " + (+s.circ).toFixed(2) + "</figcaption>");
    el.appendChild(f);
  });
}

/* Model picker: scatter + feature bars that follow the selection. */
function modelExplorer(scatterEl, featEl, titleEl) {
  var sel = N.models.find(function (m) { return m.winner; }).label;
  function pick(l) { sel = l; chartModels(scatterEl, sel, pick); chartFeatures(featEl, sel); if (titleEl) titleEl.textContent = sel; }
  pick(sel);
}
