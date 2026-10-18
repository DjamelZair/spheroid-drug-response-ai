/* Console core: content, layout and behaviour shared by the five console versions.
   Load order: data.js, seg_compare.js, console_charts.js, widgets.js, console_core.js.
   A version page calls Console.build({ nav, picker, kpiMini, theme, protocol }) and styles the result. */

/* Contact links. An empty value hides its button. */
var CONTACT = { email: "", linkedin: "https://www.linkedin.com/in/djamelzair/",
  cv: "https://drive.google.com/file/d/1MRPXPSRnkQyQRo3yn0rwEpP7ER6ZuOCj/view?usp=sharing",
  cv_nl: "https://drive.google.com/file/d/1IC9_O8TWYhG68WAgZmG5XVpCLur3S2JB/view?usp=sharing" };

var Console = (function () {
  var heavy = N.ablation.find(function (a) { return a.name === "3_heavy_aug"; });
  var base = N.ablation.find(function (a) { return a.name === "1_baseline"; });
  var unet = N.models.find(function (m) { return m.winner; });
  var cleanup = N.models.find(function (m) { return m.label === "nnU-Net + cleanup"; });
  var pd = N.forest.find(function (r) { return r.sig === "sig"; });
  var nWells = N.forest.reduce(function (a, r) { return a + r.n; }, 0);
  var segMean = function (m) { var v = SEG.dice[m].filter(function (d) { return d != null; }); return v.reduce(function (a, b) { return a + b; }, 0) / v.length; };

  var TEXT = {
    name: "Djamel Zair", role: "MSc Artificial Intelligence, University of Amsterdam, 2026",
    open: "Open to ML and data-science roles in pharma and healthcare",
    h1: "AI that measures how leukaemia patient cells respond to drugs",
    sub: "I built the pipeline end to end: from 99,055 microscope images to which cell forces a drug changes.",
    finding: "Of " + N.forest.length + " drugs screened on " + nWells + " patient wells, one (" + drugName(pd.label) + ", " + pd.n + " wells) shifted cell cohesion clear of zero. The method also reports which forces it cannot recover.",
    why: [["Label-free readout", "Shape is measured from routine brightfield films, without staining."],
          ["Named, physical effects", "Drug effects come out as cell-level forces, not a black-box score."],
          ["Stated limits", "Every result states which forces shape can and cannot reveal."]]
  };

  var KPIS = [
    { k: "data", v: "99,055", l: "microscope images linked to patient, drug and well", tip: "IncuCyte brightfield frames; 12,485 from 152 wells of 5 patients feed the growth analysis" },
    { k: "ablation", v: fmt(heavy.dice), l: "overlap with expert outlines on unseen images", tip: "Pixel Dice on 45 held-out test images, best of 13 U-Net runs", mini: "ablation", ml: "13 runs" },
    { k: "models", v: fmt(unet.feat.total_area, 2), l: "agreement with the expert on cluster size", tip: "Lin's concordance (CCC) for area, U-Net with heavy augmentation", mini: "features", ml: "6 measures" },
    { k: "sim", v: "1,105", l: "cell-physics simulations on a supercomputer", tip: "CompuCell3D Cellular Potts runs, SLURM job arrays on Snellius" },
    { k: "ident", v: fmt(N.ident[0].r2, 2), l: "best-recovered force (cell size), R² from shape alone", tip: "Leave-one-out R² across the 1,105 simulations; 0.7 is the bar for reliable", mini: "ident", ml: "7 forces" },
    { k: "drugs", v: String(N.forest.length), l: "drugs screened on " + nWells + " patient wells", tip: "Inferred shift in cell-cell adhesion per drug", mini: "forest", ml: "17 drugs" }
  ];

  var SKILLS = [
    { id: "dl", t: "Deep learning", d: "PyTorch, U-Net, nnU-Net, SAM2 fine-tuning", p: ["seg", "perf"] },
    { id: "aug", t: "Augmentation", d: "Albumentations, coverage checks against real data", p: ["more", "perf"] },
    { id: "cv", t: "Image analysis", d: "segmentation, shape measurements, quality control", p: ["seg", "perf"] },
    { id: "sim", t: "Simulation", d: "CompuCell3D Cellular Potts model, Saltelli design", p: ["more", "progress"] },
    { id: "hpc", t: "HPC", d: "SLURM job arrays on A100 GPUs (Snellius)", p: ["perf", "progress"] },
    { id: "stat", t: "Statistics", d: "Lin's CCC, leave-one-out validation, uncertainty intervals", p: ["perf", "more"] },
    { id: "data", t: "Data engineering", d: "pandas, metadata joins across 99,055 frames", p: ["kpis", "progress"] }
  ];

  var STATUS = { done: "Done", tested: "Tested, no gain", running: "Ready to run", planned: "Planned" };
  var PROGRESS = [
    { id: "d1", s: "done", ph: "Thesis", t: "Data pipeline", n: "99,055 frames", go: "data", d: "Matched every IncuCyte frame to plate, well, patient and drug from five metadata workbooks, and scored contrast, focus and brightness per frame." },
    { id: "d2", s: "done", ph: "Thesis", t: "Training set", n: "51 to 306 pairs", go: "aug", d: "51 hand-traced frames expanded offline to 306 image-mask pairs (216 train, 45 validation, 45 test)." },
    { id: "d3", s: "done", ph: "Thesis", t: "U-Net ablation", n: "13 runs", go: "ablation", d: "Thirteen configurations, one change each. Heavy augmentation won: test Dice " + fmt(heavy.dice) + " against " + fmt(base.dice) + " with standard augmentation." },
    { id: "d4", s: "done", ph: "Thesis", t: "Segmenter benchmark", n: "8 models", go: "models", d: "U-Net, nnU-Net, SAM2, pseudo-label and rule-based models ranked on pixel overlap and on whether their shape measurements agree with the expert." },
    { id: "d5", s: "done", ph: "Thesis", t: "Simulation library", n: "1,105 runs", go: "sim", d: "1,152 parameter sets from a Saltelli design, run in CompuCell3D as SLURM job arrays on the Snellius supercomputer; 1,105 completed." },
    { id: "d6", s: "done", ph: "Thesis", t: "Recoverability test", n: "7 parameters", go: "ident", d: "Leave-one-out inversion over the library: cell size and cell-medium adhesion come back moderately, four parameters not at all." },
    { id: "d7", s: "done", ph: "Thesis", t: "Drug panel", n: N.forest.length + " drugs", go: "drugs", d: "Inferred the shift in cell-cell adhesion per drug on " + nWells + " patient wells. Only " + drugName(pd.label) + " is clear of zero." },
    { id: "d8", s: "done", ph: "Thesis", t: "Thesis and analysis site", n: "MSc AI", go: null, d: "Thesis at the University of Amsterdam, with a public interactive analysis site covering every figure and notebook." },
    { id: "d9", s: "done", ph: "Paper", t: "Six settings re-run", n: "108 runs", go: "sim", d: "Six simulator settings at three levels with six seeds each, all complete. From one end snapshot, growth rate is recovered with R² " + N.recov_true_r2_990.size_change_rate + " and cell loss with " + N.recov_true_r2_990.removal_rate + "." },
    { id: "t1", s: "tested", ph: "Thesis", t: "Pseudo-label training", n: "better in 1 of 5 folds", go: "models", d: "Fine-tuning on machine-made labels reached Dice 0.811 against 0.826 for the rule-based labels it learned from. Not adopted." },
    { id: "t2", s: "tested", ph: "Thesis", t: "Mask cleanup", n: "+0.04 Dice, no better measurements", go: "models", d: "Removing small fragments lifted nnU-Net Dice from 0.757 to 0.799, but agreement with the expert fell from 0.305 to 0.285. Pixel gains alone were not kept." },
    { id: "t3", s: "tested", ph: "Thesis", t: "Perfect-mask ceiling", n: "no extra parameter", go: "ident", d: "Re-running inference on hand-traced masks made no extra parameter recoverable, so the limit sits in the simulator, not the segmenter." },
    { id: "r1", s: "done", ph: "Paper", t: "Chemical attraction", n: "42 runs, passes the bar", go: "dials", d: "Cells release a signal and move along its gradient. Size responds strongly and in order across the full range: strongest repulsion (−30) ends at 1.64× the start area and splits into about four pieces, no signal at 0.98×, strongest attraction (+30) at 0.48×. That is over 100 times the spread between replicates, far above the design's bar of 3. The strength range is still a placeholder." },
    { id: "r2", s: "done", ph: "Paper", t: "Growth-stopped core", n: "36 runs, small consistent effect", go: "dials", d: "Cells grow at the rim and stop below a set depth. The control that should change nothing (1.11× the start area) matches the mildest setting, as it should; a larger stopped core then slows growth step by step to 1.04×. Very consistent across replicates, so it clears the bar on size, but not on roundness or solidity." },
    { id: "r4", s: "done", ph: "Paper", t: "Cancelled runs recovered", n: "28 runs re-run", go: "dials", d: "28 runs were cancelled by the cluster within a second of starting, before any work was done. They were resubmitted, all 28 completed, and the results were merged after checking that overlapping runs were identical." },
    { id: "r3", s: "running", ph: "Paper", t: "Real growth rates", n: "152 wells", go: "data", d: "Measuring start size and growth directly from 152 real wells, to anchor the simulations to the films." },
    { id: "p1", s: "planned", ph: "Paper", t: "Time calibration", n: "steps to hours", go: "sim", d: "Map simulation steps to real hours using the IncuCyte timestamps stored with every frame." },
    { id: "p2", s: "planned", ph: "Paper", t: "Re-infer drug panel", n: "extended library", go: "drugs", d: "Repeat the drug-panel inference with the extended simulation library." },
    { id: "p4", s: "planned", ph: "Paper", t: "Full sweep of new dials", n: "Saltelli design", go: "dials", d: "Replace the three-setting, one-at-a-time runs with a Saltelli sweep over the new dials, so any combination of settings can be explored and ranked." },
    { id: "p3", s: "planned", ph: "Paper", t: "Paper submission", n: "journal", go: null, d: "Write up the method and its identifiability limits as a journal paper." }
  ];

  var TOPIC = {
    data: { crumb: "Data", t: "From films to a clean dataset", d: "IncuCyte brightfield films of patient cells. Every frame is linked to plate, well, patient and drug, and scored for contrast, focus and brightness. 12,485 frames from 152 wells of 5 patients feed the growth analysis; the drug panel uses " + nWells + " wells.", tools: ["pandas", "metadata joins", "image QC"], render: function (el) { el.innerHTML = '<div class="frames" id="ins-fv"></div>'; frameViewer(el.querySelector("#ins-fv")); } },
    aug: { crumb: "Model performance", t: "Augmentation", d: "Offline, 51 traced frames became 306 pairs. Online, the U-Net saw a fresh random distortion of every image each epoch. The coverage check shows brightness is the one condition the training set under-samples.", tools: ["Albumentations", "NumPy"], render: function (el) { el.innerHTML = '<div id="ins-cv"></div><ul class="recipe"><li>Flips, 90° turns<span>p 0.5</span></li><li>Shift, scale ±20%, rotate ±30°<span>p 0.7</span></li><li>Elastic warp<span>p 0.4</span></li><li>Grid distortion<span>p 0.3</span></li><li>Brightness, contrast ±30%<span>p 0.7</span></li><li>Gaussian noise<span>p 0.4</span></li><li>Gaussian blur<span>p 0.3</span></li><li>8 dropout holes of 32 px<span>p 0.3</span></li></ul>'; chartCoverage(el.querySelector("#ins-cv")); } },
    ablation: { crumb: "Model performance", t: "Why " + fmt(heavy.dice) + " Dice", d: "Thirteen U-Net runs, each changing one setting. The only change between the baseline (" + fmt(base.dice) + ") and the winner (" + fmt(heavy.dice) + ") is the heavy augmentation policy. Freezing the pretrained encoder hurt every time. Dice measures pixel overlap with the expert outline on 45 unseen test images.", tools: ["PyTorch", "segmentation_models_pytorch", "early stopping"] },
    models: { crumb: "Model performance", t: "Pixels are not measurements", d: "The simulator only sees shape numbers, so models were also ranked by Lin's concordance between their measurements and the expert's. nnU-Net with cleanup reaches " + fmt(cleanup.dice) + " Dice but only " + fmt(cleanup.ccc) + " agreement. Only the heavy-augmentation U-Net clears 0.85, on area and diameter.", tools: ["nnU-Net", "SAM2", "Lin's CCC", "ICC"], render: function (el) { el.innerHTML = '<p class="ins-sub">U-Net, heavy augmentation, per measurement</p><div id="ins-ft"></div>'; chartFeatures(el.querySelector("#ins-ft"), unet.label); } },
    dials: { crumb: "Simulation", t: "Turn a dial, watch the simulation", d: "The six original dials were re-run on the Snellius supercomputer at three settings with six replicate seeds, holding every other dial fixed: 108 runs. Two new mechanisms were added: chemical attraction (42 runs; the green glow is the signal the cells release) and a growth-stopped core (36 runs). Chemical attraction is the first dial that changes size strongly. The spheroid shows one replicate; the chart shows the mean and spread of all six. Step 0 is the pixelated starting blob, so most change happens in the first 200 steps. Most dials change roundness more than size; only cell-medium contact energy dissolves the cluster. A full Saltelli sweep over the new dials is planned, which will let every combination be explored.", tools: ["CompuCell3D", "SLURM job arrays", "one-at-a-time design"] },
    film: { crumb: "Time-lapse", t: "Real wells against simulated spheroids", d: "Hourly brightfield frames of four wells from one patient sample (VID1797), filmed for 72 hours: two untreated and two with entospletinib, with and without stimulation. These four were chosen for steady segmentation across all frames. Area comes from the segmentation, relative to the first frame. Next to them, three simulations from the re-run library play in step. Real hours and simulation steps are not calibrated against each other yet; that calibration is a planned work item.", tools: ["IncuCyte", "segmentation", "CompuCell3D"] },
    seg: { crumb: "Segmentation", t: "Reading the segmentation panel", d: "Green is the expert tracing, gold is the model. The matrix gives pixel Dice for each held-out well and model; click a cell to load it. F3 is a drug-fragmented well and the hardest case for every model.", tools: ["U-Net", "SAM2", "nnU-Net", "rule-based"] },
    sim: { crumb: "Simulation", t: "A library of virtual spheroids", d: "A Cellular Potts model treats each cell as a patch of pixels that pulls on its neighbours. 1,152 parameter sets over seven parameters; 1,105 runs completed on Snellius.", tools: ["CompuCell3D", "Saltelli design", "SLURM"], render: function (el) { el.innerHTML = '<div class="sims ins-sims" id="ins-sg"></div>'; simGallery(el.querySelector("#ins-sg"), 8); } },
    ident: { crumb: "Inference", t: "What shape can and cannot reveal", d: "Hide one simulation's parameters, match its shape over time against the other 1,104, and score the answer. 0.7 is the bar for reliable; none reach it. Cell size and cell-medium adhesion come back moderately, four parameters not at all.", tools: ["trajectory matching", "leave-one-out", "Sobol indices"] },
    drugs: { crumb: "Drug panel", t: "Drug panel on patient wells", d: "For each drug, the inferred shift in cell-cell adhesion against untreated controls, with its interval. Gold is clear of zero, dark is borderline, grey shows no shift.", tools: ["per-patient baselines", "uncertainty intervals"] }
  };
  var SIMTXT = { R0005: "All seven forces at their default values: the cluster keeps its size and shape.", R0003: "Cell-cell contact made costly (high J_cc): cells hold together less, the outline roughens, size barely changes.", R0004: "Cell-medium contact made cheap (low J_cm): cells prefer the surrounding medium and the cluster loosens into single cells." };
  var PARAM_TXT = { width: "Target size of each simulated cell.", cm_adhesion: "How costly it is for a cell's edge to touch the surrounding medium.", contact: "How costly it is for two cells to touch; lower means a more cohesive cluster.", contact_no: "How far apart pixels can be and still count as touching.", temp: "How much random movement cells make.", lambda: "How strictly cells keep their target size.", neighbor: "How many pixel rings count as neighbours in the energy." };

  var cfg, ins, mobile = window.matchMedia("(max-width: 900px)"), state = { well: 0, model: unet.label };
  var redraw = {};

  /* ---------- inspector ---------- */
  function setIns(crumb, html, after) {
    ins.querySelector(".ins-crumb").textContent = crumb;
    var b = ins.querySelector(".ins-body");
    b.classList.remove("in"); void b.offsetWidth; b.classList.add("in");
    b.innerHTML = html;
    if (after) after(b);
    ins.querySelector(".ins-home").hidden = false;
    if (mobile.matches) { ins.classList.add("open"); document.body.classList.add("sheet-open"); }
    var h = b.querySelector("h2"); if (h) { h.tabIndex = -1; h.focus({ preventScroll: !mobile.matches }); }
  }
  function tools(list) { return list && list.length ? '<ul class="ins-tools">' + list.map(function (t) { return "<li>" + t + "</li>"; }).join("") + "</ul>" : ""; }
  function dl(rows) { return '<dl class="ins-dl">' + rows.map(function (r) { return "<div><dt>" + r[0] + "</dt><dd>" + r[1] + "</dd></div>"; }).join("") + "</dl>"; }
  function home() {
    ins.querySelector(".ins-crumb").textContent = "Details";
    ins.querySelector(".ins-home").hidden = true;
    ins.querySelector(".ins-body").innerHTML = '<h2 class="ins-empty">Select a number, well, model or work item to see how it was measured.</h2><div class="starters">' +
      '<button type="button" data-start="ablation"><b>Why ' + fmt(heavy.dice) + ' Dice</b><span>13 training runs compared</span></button>' +
      '<button type="button" data-start="drug"><b>Best drug signal</b><span>' + drugName(pd.label) + ', ' + pd.n + ' wells</span></button>' +
      '<button type="button" data-start="failed"><b>What did not work</b><span>3 ideas tested and dropped</span></button></div>';
    ins.querySelector(".ins-body").querySelectorAll("[data-start]").forEach(function (b) {
      b.onclick = function () { var s = b.dataset.start; if (s === "ablation") topic("ablation"); if (s === "drug") { tab("drugs"); openDrug(pd); } if (s === "failed") openFailed(); };
    });
    highlight(null);
  }
  function topic(k) {
    var p = TOPIC[k]; if (!p) return;
    setIns(p.crumb, "<h2>" + p.t + "</h2><p>" + p.d + "</p>" + tools(p.tools) + '<div class="ins-extra"></div>', function (b) { if (p.render) p.render(b.querySelector(".ins-extra")); });
    highlight(k);
  }
  function openProgress(id) {
    var it = PROGRESS.find(function (x) { return x.id === id; });
    setIns("Progress / " + STATUS[it.s], "<h2>" + it.t + '</h2><p class="ins-n s-' + it.s + '">' + it.n + "</p><p>" + it.d + "</p>" + (it.go ? '<button type="button" class="ins-go" data-topic="' + it.go + '">Open the related result</button>' : ""));
  }
  function openFailed() {
    setIns("Progress / Tested, no gain", "<h2>Ideas tested and dropped</h2><p>Negative results are kept on purpose: each one narrowed down where the real limit is.</p>" +
      PROGRESS.filter(function (p) { return p.s === "tested"; }).map(function (it) { return '<button type="button" class="pi s-tested" data-pi="' + it.id + '"><span class="pi-t">' + it.t + '</span><span class="pi-n">' + it.n + "</span></button>"; }).join(""));
  }
  function openAblation(r) {
    setIns("Model performance / U-Net run", "<h2>" + ABL_NAME[r.name] + "</h2>" + dl([["Test Dice", fmt(r.dice)], ["Best validation Dice", fmt(r.val)], ["Encoder", r.encoder + (r.freeze ? ", frozen" : ", trained")], ["Augmentation", r.aug], ["Epochs before early stop", r.epochs]]) + "<p>" + (r.name === "3_heavy_aug" ? "The chosen model: identical to the baseline except for heavy augmentation." : (r.dice - heavy.dice).toFixed(3) + " Dice against the chosen model.") + "</p>");
  }
  function openModel(label) {
    var m = N.models.find(function (x) { return x.label === label; });
    setIns("Model performance / Segmenter", "<h2>" + label + "</h2>" + dl([["Pixel overlap (Dice)", fmt(m.dice)], ["Agreement with expert (CCC)", fmt(m.ccc)]]) + '<p class="ins-sub">Agreement per measurement; gold clears 0.85</p><div id="ins-ft"></div>', function (b) { chartFeatures(b.querySelector("#ins-ft"), label); });
  }
  function openSeg() {
    var e = SEG.examples[state.well], m = e.models[state.model];
    setIns("Segmentation / Well " + e.well, "<h2>" + state.model + "</h2>" + dl([["Dice on well " + e.well, m ? fmt(m.dice) : "n/a"], ["Mean over 45 test images", fmt(segMean(state.model))]]) + "<p>Recomputed at full image resolution against the cleaned expert masks" + (state.model === unet.label ? "; at training resolution this model scored " + fmt(heavy.dice) + "." : ".") + "</p>");
  }
  function openParam(r) { setIns("Inference / Parameter", "<h2>" + PARAM[r.param] + "</h2>" + dl([["Recovery (leave-one-out R²)", fmt(r.r2, 2)], ["Verdict", r.r2 >= 0.7 ? "reliable" : r.r2 >= 0.3 ? "weak" : "not recoverable"]]) + "<p>" + PARAM_TXT[r.param] + "</p>"); }
  function openDrug(r) { setIns("Drug panel / " + r.cls, "<h2>" + drugName(r.label) + "</h2>" + dl([["Wells", r.n], ["Shift in cell-cell adhesion", (r.est > 0 ? "+" : "") + fmt(r.est, 2)], ["Interval", fmt(r.lo, 2) + " to " + fmt(r.hi, 2)], ["Verdict", { sig: "clear of zero", borderline: "borderline", ns: "no shift" }[r.sig]]])); }
  function highlight(k) { document.querySelectorAll("[data-topic-host]").forEach(function (p) { p.classList.toggle("is-hl", p.dataset.topicHost === k); }); }

  /* ---------- builders ---------- */
  function contactBtns() {
    var c = [["CV", CONTACT.cv, "btn btn-primary", "Download CV (English)"], ["NL", CONTACT.cv_nl, "btn btn-sq", "CV in het Nederlands"], ["LinkedIn", CONTACT.linkedin, "btn", "LinkedIn profile"], ["Email", CONTACT.email ? "mailto:" + CONTACT.email : "", "btn", "Send an email"]];
    return c.filter(function (x) { return x[1]; }).map(function (x) { return '<a class="' + x[2] + '" href="' + x[1] + '" target="_blank" rel="noopener" title="' + x[3] + '">' + (x[0] === "LinkedIn" ? '<i class="ph ph-linkedin-logo" aria-hidden="true"></i>' : x[0] === "CV" ? '<i class="ph ph-file-text" aria-hidden="true"></i>' : "") + x[0] + "</a>"; }).join("");
  }
  function header() {
    return '<header class="hdr"><div class="id"><span class="mono-badge" aria-hidden="true">DZ</span><div><p class="nm">' + TEXT.name + '</p><p class="rl">' + TEXT.role + '</p></div></div>' +
      '<p class="open"><i class="ph ph-briefcase" aria-hidden="true"></i>' + TEXT.open + '</p><nav class="hdr-act" aria-label="Contact">' + contactBtns() +
      '<a class="lnk" href="https://djamelzair.github.io/EDA_SpheroidAnalysisforCPM_DDZair/">Analysis site</a><a class="lnk" href="https://github.com/DjamelZair/CPM-parameter-Posterior-Estimate-Generator">Code</a>' +
      '<button type="button" class="icon-btn" id="theme" aria-label="Switch light or dark"><i class="ph ph-circle-half"></i></button></nav></header>';
  }
  var NAV = [["overview", "Overview", "ph-house"], ["seg", "Segmentation", "ph-scan"], ["perf", "Model performance", "ph-chart-line-up"], ["more", "Drugs and inference", "ph-flask"], ["progress", "Progress", "ph-list-checks"]];
  var PROTOCOL = [["Data", "data"], ["Augment", "aug"], ["Train", "ablation"], ["Benchmark", "models"], ["Simulate", "dials"], ["Infer", "ident"], ["Drug panel", "drugs"]];
  function nav() {
    var c = counts(), done = c.done || 0, tot = PROGRESS.length;
    var prog = '<div class="nav-prog"><p class="nav-h">Progress</p>' + bar() + '<p class="nav-small">' + done + " of " + tot + ' items done</p><a href="#progress" class="nav-link-small">See all items</a></div>';
    var skills = '<div class="nav-skills"><p class="nav-h">Skills <span id="skill-count"></span></p><div class="skills" id="skills"></div><button type="button" class="clear" id="skill-clear" hidden>Clear filter</button></div>';
    if (cfg.nav === "rail") return '<nav class="nav rail" aria-label="Sections">' + NAV.map(function (n) { return '<a href="#' + n[0] + '" title="' + n[1] + '"><i class="ph ' + n[2] + '" aria-hidden="true"></i><span>' + n[1] + "</span></a>"; }).join("") + "</nav>";
    if (cfg.nav === "protocol") return '<nav class="nav protocol" aria-label="Method steps"><p class="nav-h">Method</p><ol>' + PROTOCOL.map(function (p) { return '<li><button type="button" data-topic="' + p[1] + '">' + p[0] + "</button></li>"; }).join("") + "</ol>" + prog + skills + "</nav>";
    if (cfg.nav === "tabs") return "";
    return '<nav class="nav side" aria-label="Sections"><ul class="nav-links">' + NAV.map(function (n) { return '<li><a href="#' + n[0] + '"><i class="ph ' + n[2] + '" aria-hidden="true"></i>' + n[1] + "</a></li>"; }).join("") + "</ul>" + prog + skills + "</nav>";
  }
  function tabsBar() { return cfg.nav === "tabs" ? '<nav class="topnav" aria-label="Sections">' + NAV.map(function (n) { return '<a href="#' + n[0] + '"><i class="ph ' + n[2] + '" aria-hidden="true"></i>' + n[1] + "</a>"; }).join("") + '<span class="topskills-h">Filter by skill</span><div class="skills topskills" id="skills"></div><button type="button" class="clear" id="skill-clear" hidden>Clear</button><span id="skill-count" hidden></span></nav>' : ""; }
  function bar() { var c = counts(); return '<div class="ps-bar" role="img" aria-label="' + Object.keys(STATUS).map(function (s) { return (c[s] || 0) + " " + STATUS[s]; }).join(", ") + '">' + Object.keys(STATUS).map(function (s) { return '<span class="s-' + s + '" style="flex:' + (c[s] || 0) + '"></span>'; }).join("") + "</div>"; }
  function counts() { var c = {}; PROGRESS.forEach(function (p) { c[p.s] = (c[p.s] || 0) + 1; }); return c; }
  function kpis() {
    return '<section class="kpis" id="kpis" data-topic-host="kpis" aria-label="Key results">' + KPIS.map(function (k) {
      return '<button type="button" class="kpi" data-kpi="' + k.k + '" title="' + k.tip + '"><span class="kpi-v">' + k.v + '</span><span class="kpi-l">' + k.l + "</span>" + (cfg.kpiMini && k.mini ? '<span class="kpi-mini"><span data-mini="' + k.mini + '"></span><span class="kpi-ml">' + k.ml + "</span></span>" : "") + "</button>";
    }).join("") + "</section>";
  }
  function hero() {
    return '<section class="hero" id="overview"><div class="hero-text"><h1>' + TEXT.h1 + '</h1><p class="lede">' + TEXT.sub + '</p>' +
      '<button type="button" class="finding" id="finding"><span class="finding-k">Key finding</span><span class="finding-t">' + TEXT.finding + "</span></button>" +
      "</div>" + (window.FILMS ? '<div class="hero-film" aria-label="Time-lapse of a real well">' + "</div>" : "") +
      '<div class="why" aria-label="Why this matters for drug discovery"><p class="why-h">Why this matters for drug discovery</p>' + TEXT.why.map(function (w) { return '<div class="why-i"><b>' + w[0] + "</b><span>" + w[1] + "</span></div>"; }).join("") + "</div></section>";
  }
  function picker() {
    if (cfg.picker === "plate") {
      var rows = ["D", "E", "F", "G", "H"], cols = [2, 3, 4, 5, 6, 7], wells = SEG.examples.map(function (e) { return e.well; });
      return '<div class="plate" role="group" aria-label="Held-out test wells on the plate"><span></span>' + cols.map(function (c) { return '<span class="pc">' + c + "</span>"; }).join("") +
        rows.map(function (r) { return '<span class="pr">' + r + "</span>" + cols.map(function (c) { var w = r + c, j = wells.indexOf(w); return j > -1 ? '<button type="button" class="pw" data-w="' + j + '" aria-label="Well ' + w + '">' + w + "</button>" : '<span class="pw-off" aria-hidden="true"></span>'; }).join(""); }).join("") + "</div>";
    }
    return '<div class="wellchips" role="group" aria-label="Test well">' + SEG.examples.map(function (e, j) { return '<button type="button" data-w="' + j + '">' + e.well + "</button>"; }).join("") + "</div>";
  }
  function filmPanel() {
    if (!window.FILMS) return "";
    return '<section class="panel film" id="film" data-topic-host="film"><header class="ph-h"><h2>Real wells against simulated spheroids</h2><div class="ph-act"><button type="button" class="btn-ghost film-play" data-film-toggle></button><button type="button" class="info" data-topic="film" aria-label="Explain"><i class="ph ph-info"></i></button></div></header>' +
      '<div class="film-grid"><div><p class="ph-sub">Cluster area over 72 hours, relative to the first frame. Click a line to play that well above.</p><div id="traj"></div></div>' +
      '<div><p class="ph-sub">Three simulated spheroids, same playback. Click one for details.</p><div class="sims-live" id="simfilms"></div></div></div></section>';
  }
  function dialPanel() {
    if (!window.DIALS) return "";
    return '<section class="panel" id="dials" data-topic-host="dials"><header class="ph-h"><h2>Turn a dial, watch the simulated spheroid</h2><div class="ph-act"><button type="button" class="btn-ghost film-play" data-film-toggle></button><button type="button" class="info" data-topic="dials" aria-label="Explain"><i class="ph ph-info"></i></button></div></header><div id="dialhost"></div></section>';
  }
  function segPanel() {
    return '<section class="panel seg" id="seg" data-topic-host="seg"><header class="ph-h"><h2>Model against expert on unseen test wells</h2><div class="legend"><span><i class="h"></i>expert</span><span><i class="m"></i>model</span><button type="button" class="info" data-topic="seg" aria-label="How to read this panel"><i class="ph ph-info"></i></button></div></header>' +
      '<div class="seg-grid"><div class="seg-left"><div class="seg-img" id="segimg"></div>' + picker() + '<div class="modelchips" id="modelchips" role="group" aria-label="Model"></div></div>' +
      '<div class="seg-right"><p class="ph-sub">Pixel overlap per well, click a cell</p><div id="segmx"></div><p class="ph-sub mt">All 45 test images, mean as bar</p><div id="strip"></div></div></div></section>';
  }
  function perfPanels() {
    return '<div class="perf" id="perf"><section class="panel" data-topic-host="models"><header class="ph-h"><h2>Good pixel overlap does not guarantee correct measurements</h2><button type="button" class="info" data-topic="models" aria-label="Explain"><i class="ph ph-info"></i></button></header><p class="ph-sub">Eight segmenters. Click a point for its measurements.</p><div id="models"></div></section>' +
      '<section class="panel" data-topic-host="ablation"><header class="ph-h"><h2>13 U-Net training runs</h2><button type="button" class="info" data-topic="ablation" aria-label="Explain"><i class="ph ph-info"></i></button></header><div class="ph-row"><label class="toggle"><input type="checkbox" id="pair"> Augmentation effect only</label><span class="key"><i class="f"></i>heavy aug.<i class="o"></i>standard</span></div><div id="abl"></div></section></div>';
  }
  var TABS = [["drugs", "Drug panel"], ["ident", "What shape reveals"], ["aug", "Augmentation"]];
  function morePanel() {
    return '<section class="panel more" id="more" data-topic-host="drugs"><header class="ph-h"><div class="seg-tabs" role="tablist">' + TABS.map(function (t) { return '<button type="button" role="tab" data-tab="' + t[0] + '">' + t[1] + "</button>"; }).join("") + '</div><button type="button" class="info" id="more-info" aria-label="Explain"><i class="ph ph-info"></i></button></header><div id="morebody"></div></section>';
  }
  function progressPanel() {
    var c = counts();
    return '<section class="panel progress" id="progress" data-topic-host="progress"><header class="ph-h"><h2>Progress</h2><button type="button" class="btn-ghost" id="prog-toggle" aria-expanded="false">Show all ' + PROGRESS.length + " items</button></header>" + bar() +
      '<div class="ps-key">' + Object.keys(STATUS).map(function (s) { return '<span><i class="s-' + s + '"></i>' + (c[s] || 0) + " " + STATUS[s].toLowerCase() + "</span>"; }).join("") + "</div>" +
      '<div class="kb" id="kb" hidden>' + Object.keys(STATUS).map(function (s) { var its = PROGRESS.filter(function (p) { return p.s === s; }); return '<div class="kb-col"><h3 class="s-' + s + '">' + STATUS[s] + " <span>" + its.length + "</span></h3>" + its.map(function (it) { return '<button type="button" class="pi s-' + it.s + '" data-pi="' + it.id + '"><span class="pi-t">' + it.t + '</span><span class="pi-n">' + it.n + "</span></button>"; }).join("") + "</div>"; }).join("") + "</div></section>";
  }

  /* ---------- wiring ---------- */
  function segSet(w, m) {
    state.well = w; state.model = m;
    var e = SEG.examples[w], mm = e.models[m];
    document.getElementById("segimg").innerHTML = '<div class="seg-frame"><img alt="Test well ' + e.well + ', expert outline in green, ' + m + ' outline in gold. Hover to magnify." src="' + (mm ? mm.img : e.gt) + '"></div><p class="seg-cap"><span class="wid">' + e.well + "</span> " + (SHORT[m] || m) + (mm ? '<b>Dice ' + fmt(mm.dice, 2) + "</b>" : "") + "</p>";
    document.querySelectorAll("[data-w]").forEach(function (b) { b.setAttribute("aria-pressed", +b.dataset.w === w); });
    document.getElementById("modelchips").innerHTML = SEG.models.map(function (x) { return '<button type="button" aria-pressed="' + (x === m) + '" data-m="' + x + '">' + (SHORT[x] || x) + "</button>"; }).join("");
    document.querySelectorAll("#modelchips button").forEach(function (b) { b.onclick = function () { segSet(state.well, b.dataset.m); openSeg(); }; });
    chartSegMatrix(document.getElementById("segmx"), function (j, mm2) { segSet(j, mm2); openSeg(); }, w, m);
    chartDiceStrip(document.getElementById("strip"), m);
  }
  var curTab = "drugs";
  function tab(t) {
    curTab = t;
    var host = document.getElementById("more"); host.dataset.topicHost = t;
    host.querySelectorAll("[data-tab]").forEach(function (b) { b.setAttribute("aria-selected", b.dataset.tab === t); });
    var body = document.getElementById("morebody");
    body.innerHTML = "";
    if (t === "drugs") { body.innerHTML = '<p class="ph-sub">Inferred shift in cell-cell adhesion against untreated controls. Gold is clear of zero. Click a drug.</p><div id="forest"></div>'; var sel = null; (function d() { chartForest(document.getElementById("forest"), function (r) { sel = r.label; d(); openDrug(r); }, sel); })(); }
    if (t === "ident") { body.innerHTML = '<p class="ph-sub">How well each simulator parameter comes back from shape alone, 1,105 runs. Click a parameter.</p><div id="ident"></div>'; var sp = null; (function d() { chartIdent(document.getElementById("ident"), function (r) { sp = r.param; d(); openParam(r); }, sp); })(); }
    if (t === "aug") { body.innerHTML = '<div class="aug-grid"><div id="ag" class="ag-side"></div><div><p class="ph-sub">Share of 12,485 real frames inside the training range</p><div id="cv"></div></div></div>'; augGrid(document.getElementById("ag")); chartCoverage(document.getElementById("cv")); }
  }

  function build(c) {
    cfg = c || {};
    document.documentElement.dataset.theme = cfg.theme || "dark";
    var app = document.getElementById("app");
    app.innerHTML = header() + tabsBar() + '<div class="shell nav-' + (cfg.nav || "side") + '">' + nav() + '<main class="center">' + hero() + kpis() + filmPanel() + dialPanel() + segPanel() + perfPanels() + morePanel() + progressPanel() + "</main>" +
      '<aside class="insp" id="insp" aria-label="Details" aria-live="polite"><div class="ins-head"><span class="ins-crumb"></span><button type="button" class="ins-home" aria-label="Back to start">Back to start</button><button type="button" class="ins-close" aria-label="Close details"><i class="ph ph-x"></i></button></div><div class="ins-body"></div></aside></div>';
    ins = document.getElementById("insp");
    ins.querySelector(".ins-home").onclick = home;
    ins.querySelector(".ins-close").onclick = function () { ins.classList.remove("open"); document.body.classList.remove("sheet-open"); };
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") { ins.classList.remove("open"); document.body.classList.remove("sheet-open"); } });
    home();

    document.querySelectorAll(".kpi").forEach(function (b) { b.onclick = function () { var k = b.dataset.kpi; if (k === "drugs") { tab("drugs"); topic("drugs"); } else if (k === "ident") { tab("ident"); topic("ident"); } else topic(k); }; });
    document.querySelectorAll("[data-mini]").forEach(function (m) { miniChart(m, m.dataset.mini); });
    document.getElementById("finding").onclick = function () { tab("drugs"); openDrug(pd); document.getElementById("more").scrollIntoView({ behavior: "smooth", block: "start" }); };
    document.querySelectorAll("[data-w]").forEach(function (b) { b.onclick = function () { segSet(+b.dataset.w, state.model); openSeg(); }; });
    segSet(0, unet.label);
    var simg = document.getElementById("segimg");
    simg.addEventListener("mousemove", function (e) { var im = simg.querySelector("img"); if (!im) return; var r = im.getBoundingClientRect(); im.style.transformOrigin = ((e.clientX - r.left) / r.width * 100) + "% " + ((e.clientY - r.top) / r.height * 100) + "%"; simg.classList.add("zoom"); });
    simg.addEventListener("mouseleave", function () { simg.classList.remove("zoom"); });
    if (window.FILMS && window.Film) {
      Film.mountHero(document.querySelector(".hero-film"));
      Film.mountPanel(document.getElementById("traj"), document.getElementById("simfilms"), function (f) { setIns("Time-lapse / Simulation", "<h2>" + f.label + "</h2>" + dl([["Run", f.id], ["Diameter at the end", f.rel[f.rel.length - 1].toFixed(2) + "× start"], ["Snapshots", f.mcs.length + ", steps 0 to " + f.mcs[f.mcs.length - 1]]]) + "<p>" + SIMTXT[f.id] + "</p>"); });
      if (window.DIALS && window.Dials) Dials.mount(document.getElementById("dialhost"), function (D, lv) { setIns("Simulation / " + D.name, "<h2>" + D.name + ", " + lv.label + "</h2>" + dl([["Setting", lv.value], ["Run", lv.vid], ["Replicates", lv.seeds], ["Roundness at the end", (lv.m.c.mean[lv.m.c.mean.length - 1] / lv.m.c.mean[0]).toFixed(2) + "× start"], ["Size at the end", (lv.m.d.mean[lv.m.d.mean.length - 1] / lv.m.d.mean[0]).toFixed(2) + "× start"], ["Fragments at the end", Math.round(lv.m.n.mean[lv.m.n.mean.length - 1])]]) + "<p>" + D.desc + "</p>"); });
      Film.start();
    }
    var selM = unet.label; (function d() { chartModels(document.getElementById("models"), selM, function (l) { selM = l; d(); openModel(l); }); })();
    var pair = false, selA = null; function dA() { chartAblation(document.getElementById("abl"), { pair: pair, sel: selA, onPick: function (r) { selA = r.name; dA(); openAblation(r); } }); } dA();
    document.getElementById("pair").onchange = function (e) { pair = e.target.checked; dA(); };
    document.querySelectorAll("[data-tab]").forEach(function (b) { b.onclick = function () { tab(b.dataset.tab); }; });
    document.getElementById("more-info").onclick = function () { topic(curTab); };
    tab("drugs");
    var pt = document.getElementById("prog-toggle"); pt.onclick = function () { var kb = document.getElementById("kb"), open = kb.hidden; kb.hidden = !open; pt.setAttribute("aria-expanded", open); pt.textContent = open ? "Hide items" : "Show all " + PROGRESS.length + " items"; };
    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-topic]"); if (t) { var k = t.dataset.topic; if (k === "drugs" || k === "ident" || k === "aug") tab(k); topic(k); if (t.closest(".nav")) { var MAP = { data: "kpis", aug: "more", ablation: "perf", models: "perf", dials: "dials", ident: "more", drugs: "more" }; var host = document.getElementById(MAP[k] || k); if (host) host.scrollIntoView({ behavior: "smooth", block: "start" }); } return; }
      var p = e.target.closest("[data-pi]"); if (p) { document.querySelectorAll("[data-pi]").forEach(function (x) { x.classList.toggle("on", x === p); }); openProgress(p.dataset.pi); return; }
      var u = e.target.closest("[data-unset]"); if (u) { e.preventDefault(); setIns("Contact", "<h2>Contact link not set yet</h2><p>Add the " + u.textContent + " link to CONTACT at the top of console_core.js before sharing this page.</p>"); }
    });
    var sk = document.getElementById("skills");
    if (sk) {
      sk.innerHTML = SKILLS.map(function (s) { return '<button type="button" class="skill" aria-pressed="false" data-skill="' + s.id + '" title="' + s.d + '">' + s.t + "</button>"; }).join("");
      var clr = document.getElementById("skill-clear"), cnt = document.getElementById("skill-count");
      function clear() { document.body.classList.remove("skill-on"); sk.querySelectorAll(".skill").forEach(function (x) { x.setAttribute("aria-pressed", "false"); }); document.querySelectorAll(".is-skill").forEach(function (x) { x.classList.remove("is-skill"); }); clr.hidden = true; cnt.textContent = ""; }
      clr.onclick = clear;
      sk.querySelectorAll(".skill").forEach(function (b) {
        b.onclick = function () {
          if (b.getAttribute("aria-pressed") === "true") { clear(); return; }
          clear();
          var s = SKILLS.find(function (x) { return x.id === b.dataset.skill; });
          b.setAttribute("aria-pressed", "true"); document.body.classList.add("skill-on");
          s.p.forEach(function (id) { var el = document.getElementById(id); if (el) el.classList.add("is-skill"); });
          clr.hidden = false; cnt.textContent = "(" + s.p.length + " sections)";
          setIns("Skill", "<h2>" + s.t + "</h2><p>" + s.d + ".</p><p>Highlighted on the page: " + s.p.map(function (id) { return NAV.find(function (n) { return n[0] === id; }) ? NAV.find(function (n) { return n[0] === id; })[1] : "Key results"; }).join(", ") + ".</p>");
        };
      });
    }
    var th = document.getElementById("theme"); th.onclick = function () { var r = document.documentElement; r.dataset.theme = r.dataset.theme === "dark" ? "light" : "dark"; segSet(state.well, state.model); };
    var links = [].slice.call(document.querySelectorAll(".nav a[href^='#'], .topnav a[href^='#']"));
    if (links.length && window.IntersectionObserver) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) links.forEach(function (a) { a.classList.toggle("on", a.getAttribute("href") === "#" + en.target.id); }); }); }, { rootMargin: "-35% 0px -60% 0px" });
      NAV.forEach(function (n) { var el = document.getElementById(n[0]); if (el) io.observe(el); });
    }
  }
  return { build: build };
})();
