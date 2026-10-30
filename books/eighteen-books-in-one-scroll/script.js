/* Eighteen Books in One Scroll: the eighteen books as one long scroll across two islands, one change at a time.
   The round behind the walk: each place a spoke running outward, later and later; each dashed
   ring one moment everywhere; each arc a messenger. Every book's scene is the scene of the book it grows from with one
   change, drawn in red; a wall shows its two nights in turn. Each scene plays through time, outward from the centre,
   and the reader can pause it, drag the slider, or drag on the round itself. The page code after it drives the
   scroll, the hero, the widgets and the family tree. */
"use strict";
(function () {
const NS = "http://www.w3.org/2000/svg";
const svg = document.getElementById("round");
if (!svg) return;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const narrow = matchMedia("(max-width: 899px)");
const X = (...a) => Object.assign({}, ...a);
const f = v => (Math.round(v * 10) / 10).toString();
function el(tag, at, p) { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); if (p) p.appendChild(e); return e; }

/* ---------- geometry: radius grows with time ---------- */
const R0 = 46, ST = 28, TEND = 6.4, RINGS = 6, VB = 524;
const rad = t => R0 + ST * t;
const pol = (deg, rr) => { const a = deg * Math.PI / 180; return [rr * Math.cos(a), rr * Math.sin(a)]; };

/* ---------- the casts, with the books' own colours and places round the circle ---------- */
const LIB = "#efe6cf";
const CASTS = {
  houses:  [["H1", "#9cb648", -90], ["H2", "#e0b84a", 30], ["H3", "#5b9be0", 150]],
  tents:   [["T1", "#e0b84a", 225], ["T2", "#6583d6", 135], ["T3", "#c45448", 315], ["T4", "#9cb648", 45]],
  b4:      [["B1", "#a57fc0", -90], ["B2", "#9aa0a8", 0], ["B3", "#e8964d", 90], ["B4", "#b07a55", 180]],
  b3:      [["B1", "#a57fc0", -90], ["B2", "#9aa0a8", 150], ["B3", "#e8964d", 30]],
  priests: [["A", "#e0b84a", 200, "Α"], ["B", "#5b9be0", 270, "Β"], ["G", "#e2564e", 340, "Γ"], ["D", "#9cb648", 40, "Δ"], ["E", "#b58be0", 140, "Ε"]],
  tholos:  [["O", "#8fa3b8", -90, "Ο"], ["L", "#e8b03a", -18, "Λ"], ["K", "#8fb35a", 54, "Κ"], ["M", "#cf5a4a", 126, "Μ"], ["Th", "#b3aea4", 198, "Θ"]],
  libs3:   [["L1", LIB, -90], ["L2", LIB, 30], ["L3", LIB, 150]],
  libs4:   [["L1", LIB, -90], ["L2", LIB, 0], ["L3", LIB, 90], ["L4", LIB, 180]],
  libs5:   [["L1", LIB, -90], ["L2", LIB, -18], ["L3", LIB, 54], ["L4", LIB, 126], ["L5", LIB, 198]]
};
const SUB = "₀₁₂₃₄₅₆₇₈₉";
for (const k in CASTS) {
  const n = CASTS[k];
  CASTS[k] = { n, ang: {}, col: {} };
  n.forEach(d => { CASTS[k].ang[d[0]] = d[2]; CASTS[k].col[d[0]] = d[1]; });
}
let CA = CASTS.houses;
const A = n => CA.ang[n];

/* ---------- computing draws the same scenes on lanes: one per place from top to bottom, real time left to right,
   on the same 524-unit square, so the stage around it does not change. LN says which way the scene is drawn. ---------- */
let LN = false;
const LX0 = -186, LX1 = 244;
const lx = t => LX0 + (LX1 - LX0) * t / TEND;
const lyN = (i, c) => (i - (c - 1) / 2) * (c <= 3 ? 120 : c === 4 ? 96 : 78);
const laneIx = n => CA.n.findIndex(d => d[0] === n);
const ly = n => lyN(laneIx(n), CA.n.length);
const nodeXY = n => LN ? [LX0 - 40, ly(n)] : pol(A(n), R0);
/* how far the grid reaches above and below the middle for c lanes, and the card's half-height round it:
   three lanes make a short card, five nearly the round's square */
const GHc = c => lyN(c - 1, c) + 34, CHc = c => GHc(c) + 42;
let GH = GHc(3), CH = CHc(3);
/* a point given in the round's own terms, on the lanes: its time, on the lane nearest its angle */
function toLane(x, y) {
  const t = Math.max(0, Math.min(TEND, (Math.hypot(x, y) - R0) / ST)), deg = Math.atan2(y, x) * 180 / Math.PI;
  let best = CA.n[0][0], w = 1e9;
  CA.n.forEach(d => { const dd = ((deg - d[2]) % 360 + 540) % 360 - 180; if (Math.abs(dd) < Math.abs(w)) { w = dd; best = d[0]; } });
  return [lx(t), ly(best) + Math.max(-40, Math.min(40, w * 1.1))];
}
const P = (n, t) => LN ? [lx(t), ly(n)] : pol(A(n), rad(t));

/* the points of an arc from place a at time ta to place b at time tb; the short way round unless dir says */
function arc(a, ta, b, tb, dir) {
  if (LN) { const [x1, y1] = P(a, ta), [x2, y2] = P(b, tb), pts = []; for (let i = 0; i <= 12; i++) pts.push([x1 + (x2 - x1) * i / 12, y1 + (y2 - y1) * i / 12]); return pts; }
  const a0 = A(a);
  let d = ((A(b) - a0 + 540) % 360) - 180;
  if (dir === 1 && d < 0) d += 360;
  if (dir === -1 && d > 0) d -= 360;
  const n = Math.max(10, Math.round(Math.abs(d) / 3)), pts = [];
  for (let i = 0; i <= n; i++) pts.push(pol(a0 + d * i / n, rad(ta + (tb - ta) * i / n)));
  return pts;
}
const dpath = pts => "M" + pts.map(p => f(p[0]) + "," + f(p[1])).join(" L");

/* ---------- the frame: a disc, rings for later moments, a spoke for each place ---------- */
const defs = el("defs", {}, svg);
[["b", "#136f9e"], ["r", "#bf4a26"], ["g", "#b8891a"], ["k", "#1c1512"]].forEach(([k, c]) => {
  const m = el("marker", { id: "ar-" + k, markerUnits: "userSpaceOnUse", markerWidth: 12, markerHeight: 11, refX: 10, refY: 4.5, orient: "auto" }, defs);
  el("path", { d: "M0,0 L10,4.5 L0,9 z", fill: c }, m);
});
const hatch = el("pattern", { id: "hatch", patternUnits: "userSpaceOnUse", width: 8, height: 8, patternTransform: "rotate(45)" }, defs);
el("line", { x1: 0, y1: 0, x2: 0, y2: 8, stroke: "#bf4a26", "stroke-width": 2.2, "stroke-opacity": .35 }, hatch);
/* everything that has happened by now lies inside one circle: marks drawn over time are clipped to it */
const clip = el("clipPath", { id: "upto" }, defs), clipC = el("circle", { cx: 0, cy: 0, r: 999 }, clip);
const frame = el("g", { class: "frame" }, svg);
const roundBg = [el("circle", { class: "disc", r: rad(TEND) + 24 }, frame)];
for (let i = 1; i <= RINGS; i++) roundBg.push(el("circle", { class: "rg", r: rad(i) }, frame));
let laneBg = [], clipR = null, nowL = null;
/* swap the frame, the clip and the moment's mark between the round and the lanes */
function setMode(lanes) {
  LN = lanes;
  if (LN) {
    roundBg.forEach(e => e.remove());
    laneBg = [el("rect", { class: "disc lanes", x: -252, width: 504, rx: 22 })];
    for (let t = 0; t <= Math.floor(TEND); t++) laneBg.push(el("line", { class: "rg", x1: f(lx(t)), x2: f(lx(t)) }));
    const n = el("text", { class: "lnote", x: LX1 }); n.textContent = "real time →"; laneBg.push(n);
    laneBg.slice().reverse().forEach(e => frame.insertBefore(e, frame.firstChild));
    clipR = el("rect", { x: -600, y: -600, width: 0, height: 1200 }, clip);
    nowL = el("line", {}, nowG);
    laneFrame(GH);
  } else {
    laneBg.forEach(e => e.remove()); laneBg = [];
    if (clipR) { clipR.remove(); clipR = null; } if (nowL) { nowL.remove(); nowL = null; }
    roundBg.slice().reverse().forEach(e => frame.insertBefore(e, frame.firstChild));
    svg.setAttribute("viewBox", "-262 -262 524 524");
  }
}
/* size the lanes' card, grid and picture for a grid reaching g above and below the middle */
function laneFrame(g) {
  GH = g; CH = g + 42;
  svg.setAttribute("viewBox", `-262 ${f(-CH - 10)} 524 ${f(2 * CH + 20)}`);
  laneBg.forEach(e => {
    if (e.tagName === "rect") { e.setAttribute("y", f(-CH)); e.setAttribute("height", f(2 * CH)); }
    else if (e.tagName === "line") { e.setAttribute("y1", f(-GH)); e.setAttribute("y2", f(GH)); }
    else e.setAttribute("y", f(-CH + 26));
  });
  if (nowL) { nowL.setAttribute("y1", f(-GH)); nowL.setAttribute("y2", f(GH)); }
}
const marksG = el("g", { class: "marks" }, svg);
const LY = {}; ["u", "s", "e", "t"].forEach(k => { LY[k] = el("g", { class: "ly-" + k }, marksG); });
const nowG = el("g", { class: "now off" }, svg), nowC = el("circle", { r: R0 }, nowG);
const nodesG = el("g", { class: "nodes" }, svg);
const meas = el("text", { class: "tgt meas", x: 0, y: -2000 }, svg);

const slots = [0, 1, 2, 3, 4].map(() => {
  const sp = el("line", { class: "spoke" }, frame);
  const nd = el("g", { class: "node" }, nodesG);
  const rc = el("rect", { x: -17, y: -12, width: 34, height: 24, rx: 4 }, nd);
  const ti = el("text", { class: "i" }, nd), tm = el("text", { class: "m" }, nd);
  return { sp, nd, rc, ti, tm, a: -90, op: 0 };
});
function place(s) {
  const [x1, y1] = LN ? [LX0 - 16, s.y] : pol(s.a, R0), [x2, y2] = LN ? [LX1 + 6, y1] : pol(s.a, rad(TEND));
  s.sp.setAttribute("x1", f(x1)); s.sp.setAttribute("y1", f(y1)); s.sp.setAttribute("x2", f(x2)); s.sp.setAttribute("y2", f(y2));
  s.nd.setAttribute("transform", `translate(${f(LN ? LX0 - 40 : x1)} ${f(y1)})`);
  s.sp.style.opacity = s.op; s.nd.style.opacity = s.op;
}
let castAnim = 0;
function setCast(key, ms) {
  const c = CASTS[key], from = slots.map(s => ({ a: s.a, op: s.op }));
  const to = slots.map((s, i) => i < c.n.length ? { a: c.n[i][2], op: 1 } : { a: s.a, op: 0 });
  const g0 = GH, g1 = GHc(c.n.length);
  slots.forEach((s, i) => {
    const y1 = i < c.n.length ? lyN(i, c.n.length) : (s.y != null ? s.y : 0);
    s.y0 = s.y != null && s.op >= .5 ? s.y : y1; s.y1 = y1;
    if (i >= c.n.length) return;
    const d = c.n[i];
    s.rc.style.fill = d[1]; s.ti.textContent = d[3] || d[0]; s.tm.textContent = "p" + SUB[i + 1];
    if (from[i].op < .5) { from[i].a = to[i].a; s.a = to[i].a; }
  });
  const id = ++castAnim;
  const step = e => {
    if (LN) laneFrame(g0 + (g1 - g0) * e);
    slots.forEach((s, i) => {
      const d = ((to[i].a - from[i].a + 540) % 360) - 180;
      s.a = from[i].a + d * e; s.op = from[i].op + (to[i].op - from[i].op) * e; s.y = s.y0 + (s.y1 - s.y0) * e; place(s);
    });
  };
  if (ms <= 0) { step(1); return; }
  const t0 = performance.now();
  (function fr(now) {
    if (id !== castAnim) return;
    const u = Math.min(1, (now - t0) / ms), e = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
    step(e);
    if (u < 1) requestAnimationFrame(fr);
  })(t0);
}

/* ---------- drawing one mark ---------- */
/* text comes as a string (the same in both registers) or {i, m}; values A and H are the camp's two plans */
const T = s => (s && typeof s === "object" ? s : { i: String(s), m: String(s) });
const VAL = {
  A: { i: "A", m: "1", c: "#bf4a26" }, H: { i: "H", m: "0", c: "#136f9e" },
  X: { i: "X", m: "x", c: "#e0b84a", ink: 1 }, Y: { i: "Y", m: "y", c: "#e8964d", ink: 1 }
};
const tone = m => (m.c ? "chg" : m.hl ? "hl" : "");
const kNow = () => parseFloat(svg.style.getPropertyValue("--k")) || 1;
function wrap(layer, cls) { return el("g", { class: "mk " + (cls || "") }, LY[layer]); }
function text2(p, x, y, s, cls) {
  const t = T(s);
  el("text", { x: f(x), y: f(y), class: (cls || "") + " i" }, p).textContent = t.i;
  el("text", { x: f(x), y: f(y), class: (cls || "") + " m" }, p).textContent = t.m;
}
function token(p, x, y, v, r) {
  const V = VAL[v], g = el("g", { class: "tok", transform: `translate(${f(x)} ${f(y)})` }, p);
  el("circle", { r: r, fill: V.c }, g);
  text2(g, 0, 0, V, "tokt" + (V.ink ? " ink" : "") + (r < 10 ? " sm" : ""));
  return g;
}
function cross(p, x, y, s) { s = s || 6.5; return el("path", { class: "cross", d: `M${f(x - s)},${f(y - s)}L${f(x + s)},${f(y + s)}M${f(x + s)},${f(y - s)}L${f(x - s)},${f(y + s)}` }, p); }
function hawk(p, x, y) { return el("path", { class: "hawk", d: `M${f(x - 12)},${f(y)} Q${f(x - 6)},${f(y - 9)} ${f(x)},${f(y)} Q${f(x + 6)},${f(y - 9)} ${f(x + 12)},${f(y)}` }, p); }
function where(m) {
  /* on lanes a point inside the round finds its lane and time; a caption above or below the round stays put */
  if (m.x != null) return !LN ? [m.x, m.y] : Math.abs(m.y) < 200 ? toLane(m.x, m.y) : [m.x, Math.sign(m.y) * (CH - 20)];
  if (m.n) { const [x, y] = P(m.n, m.at); return [x + (m.dx || 0), y + (m.dy || 0)]; }
  const [x, y] = LN ? toLane(...pol(m.deg, rad(m.at))) : pol(m.deg, rad(m.at)); return [x + (m.dx || 0), y + (m.dy || 0)];
}
function measure(s, cls) { meas.setAttribute("class", "tgt meas " + cls); meas.textContent = s; let w = 0; try { w = meas.getComputedTextLength(); } catch (e) {} return w || s.length * 8; }
/* a label in a box sized to what it says; "|" breaks a line */
function tagBox(s, cls) {
  const t = T(s), k = kNow(), sm = /\bsm\b/.test(cls || ""), bold = /red|gold|ok|blue|night/.test(cls || ""), lh = (sm ? 15.5 : 17) * k, out = {};
  ["i", "m"].forEach(reg => {
    const lines = t[reg].split("|"), w = Math.max(...lines.map(l => measure(l, (sm ? "sm " : "") + (bold ? "b" : ""))));
    out[reg] = { lines, W: w + 13 * k, H: lh * lines.length + 8 * k };
  });
  out.lh = lh; out.W = Math.max(out.i.W, out.m.W); out.H = Math.max(out.i.H, out.m.H);
  return out;
}
function tagAt(p, x, y, s, cls, box) {
  box = box || tagBox(s, cls);
  box.els = [];
  ["i", "m"].forEach(reg => {
    const g = el("g", { class: "tg " + (cls || "") + " " + reg, transform: `translate(${f(x)} ${f(y)})` }, p), b = box[reg];
    box.els.push(g);
    el("rect", { x: f(-b.W / 2), y: f(-b.H / 2), width: f(b.W), height: f(b.H), rx: 5 }, g);
    b.lines.forEach((l, i) => { el("text", { class: "tgt", x: 0, y: f((i - (b.lines.length - 1) / 2) * box.lh) }, g).textContent = l; });
  });
  return box;
}
const tagCls = m => (m.cls || "") + (m.c && !/red|gold|ok|blue|night/.test(m.cls || "") ? " red" : "") + (m.hl && !/red|gold|ok|blue|night/.test(m.cls || "") ? " gold" : "");

/* where a label can sit: near where it was asked for, off every line, dot and other label */
function obstacles(list) {
  const pts = [], rects = [], line = (a, b, n) => { for (let i = 0; i <= n; i++) pts.push([a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]); };
  CA.n.forEach(d => {
    for (let t = 0; t <= TEND; t += .18) pts.push(P(d[0], t));
    const [x, y] = nodeXY(d[0]); rects.push([x - 19, y - 14, x + 19, y + 14]);
  });
  list.forEach(m => {
    if (m.t === "sl") {
      const full = arc(m.a, m.ta, m.b, m.tb, m.dir), pp = m.lost ? full.slice(0, Math.round(full.length * m.lost)) : full;
      pp.forEach(q => pts.push(q));
      if (m.lab && !VAL[m.lab]) { const q = full[Math.round((full.length - 1) * (m.la || .5))], b = tagBox(m.lab, "sm"); rects.push([q[0] + (m.ldx || 0) - b.W / 2, q[1] + (m.ldy || 0) - b.H / 2, q[0] + (m.ldx || 0) + b.W / 2, q[1] + (m.ldy || 0) + b.H / 2]); }
    } else if (m.t === "ev" || m.t === "coin" || m.t === "bun") {
      const [x, y] = P(m.n, m.at), r = (m.r || (m.v || m.num != null || m.t !== "ev" ? 11 : 6)) + (m.ring ? 6 : 2); rects.push([x - r, y - r, x + r, y + r]);
    } else if (m.t === "slate") {
      const [x, y] = P(m.n, m.at), a = (LN ? -90 * (m.side || 1) : A(m.n) + 90 * (m.side || 1)) * Math.PI / 180, cx = x + 32 * Math.cos(a), cy = y + 32 * Math.sin(a); rects.push([cx - 21, cy - 14, cx + 21, cy + 14]);
    } else if (m.t === "sp" || m.t === "obs") line(P(m.n, m.t1), P(m.n, m.t2), 8);
    else if (m.t === "x") { const [x, y] = P(m.n, m.at); rects.push([x - 9, y - 9, x + 9, y + 9]); }
    else if (m.t === "hawk") { const [x, y] = where(m); rects.push([x - 13, y - 9, x + 13, y + 3]); }
    else if (m.t === "halo") { const [x, y] = nodeXY(m.n); rects.push([x - 26, y - 19, x + 26, y + 19]); }
  });
  return { pts, rects };
}
function placeTag(m, box, ob, taken) {
  let [x0, y0] = where(m);
  const W = box.W + 6, H = box.H + 4, lim = VB / 2 - 3;
  if (m.fix) return [x0, y0];
  /* on lanes a label asked for past the edge starts its search just inside the card */
  if (LN) { x0 = Math.max(-246 + W / 2, Math.min(246 - W / 2, x0)); y0 = Math.max(-CH + 8 + H / 2, Math.min(CH - 8 - H / 2, y0)); }
  let best = null;
  const hit = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
  for (const rr of [0, 7, 14, 22, 31, 41, 52, 64, 78]) {
    for (let k = 0; k < (rr ? 16 : 1); k++) {
      const a = k * Math.PI / 8, x = x0 + rr * Math.cos(a), y = y0 + rr * Math.sin(a), R = [x - W / 2, y - H / 2, x + W / 2, y + H / 2];
      let sc = rr * .35;
      if (R[0] < -lim || R[2] > lim || R[1] < -lim || R[3] > lim || (LN && (R[1] < -CH + 4 || R[3] > CH - 4))) sc += 5000;
      for (const q of ob.pts) if (q[0] > R[0] && q[0] < R[2] && q[1] > R[1] && q[1] < R[3]) sc += 12;
      for (const o of ob.rects) sc += hit(R, o) * .6;
      for (const o of taken) sc += hit(R, o) * 4;
      if (!best || sc < best[0]) best = [sc, x, y, R];
    }
    if (best && best[0] < rr * .35 + 1) break;
  }
  taken.push(best[3]);
  return [best[1], best[2]];
}

const DRAW = {
  /* a messenger: from a at ta to b at tb; lost ones stop part-way at a cross, held ones are dashed.
     While the round plays, the line is clipped to now, a head rides its tip, and the cross and label wait their moment. */
  sl(m) {
    const g = wrap("s", tone(m) + " sl" + (m.held ? " held" : "") + (m.lost ? " lost" : ""));
    const full = arc(m.a, m.ta, m.b, m.tb, m.dir), when = u => m.ta + (m.tb - m.ta) * u;
    let pts = full.slice();
    if (m.lost) pts = pts.slice(0, Math.max(2, Math.round(pts.length * m.lost)));
    else { const end = pts[pts.length - 1], trim = m.trim || 10; while (pts.length > 2 && Math.hypot(pts[pts.length - 1][0] - end[0], pts[pts.length - 1][1] - end[1]) < trim) pts.pop(); }
    const mk = m.lost ? "" : (m.c ? "r" : m.hl ? "g" : "b");
    el("path", Object.assign({ class: "ln", d: dpath(pts) }, mk ? { "marker-end": `url(#ar-${mk})` } : {}), g)._clip = 1;
    if (m.lost) {
      const q = pts[pts.length - 1];
      cross(g, q[0], q[1])._at = when(m.lost);
      if (m.hawk) hawk(g, q[0] + m.hawk[0], q[1] + m.hawk[1])._at = when(m.lost);
    }
    if (m.lab) {
      const la = m.la || .5, q = full[Math.round((full.length - 1) * la)];
      if (VAL[m.lab]) token(g, q[0], q[1], m.lab, 9)._at = when(la);
      else tagAt(g, q[0] + (m.ldx || 0), q[1] + (m.ldy || 0), m.lab, "sm" + (m.c || m.labc ? " red" : m.hl ? " gold" : "")).els.forEach(e => { e._at = when(la); });
    }
    g._head = { c: el("circle", { class: "head", r: 4.6 }, g), full, ta: m.ta, tb: m.tb, end: m.lost || 1 };
    return g;
  },
  /* an event on a place's spoke: a dot, a hollow dot, a number, or a plan */
  ev(m) {
    const g = wrap("e", tone(m) + " ev"), [x, y] = P(m.n, m.at);
    const gg = el("g", { transform: `translate(${f(x)} ${f(y)})` }, g);
    if (m.ring) el("circle", { class: "evring", r: (m.r || (m.v || m.num != null ? 11 : 5.5)) + 5 }, gg);
    if (m.v) { const t = token(gg, 0, 0, m.v, m.big ? 11.5 : 10); if (m.big) t.classList.add("big"); }
    else if (m.num != null) { const c = el("circle", { class: "num" + (m.big ? " big" : ""), r: m.r || 10.5 }, gg); if (m.fill) c.style.fill = m.fill; text2(gg, 0, 0, m.num, "numt" + (m.r > 12 ? " sm" : "")); }
    else el("circle", { class: m.hollow ? "hollow" : "dot", r: m.r || 5.5 }, gg);
    return g;
  },
  /* a man who has died: his spoke stops here */
  x(m) {
    const g = wrap("u", tone(m) + " dead"), [x1, y1] = P(m.n, m.at), [x2, y2] = P(m.n, TEND + .2);
    el("line", { class: "cover", x1: f(x1), y1: f(y1), x2: f(x2), y2: f(y2) }, g);
    el("line", { class: "after", x1: f(x1), y1: f(y1), x2: f(x2), y2: f(y2) }, g);
    cross(g, x1, y1, 8);
    return g;
  },
  /* a place away for a while: its spoke breaks */
  gap(m) {
    const g = wrap("u", tone(m) + " gap"), [x1, y1] = P(m.n, m.t1), [x2, y2] = P(m.n, Math.min(m.t2, TEND + .2));
    el("line", { class: "cover", x1: f(x1), y1: f(y1), x2: f(x2), y2: f(y2) }, g);
    el("line", { class: "after", x1: f(x1), y1: f(y1), x2: f(x2), y2: f(y2) }, g);
    return g;
  },
  /* a stretch of a place's spoke: a piece of business from start to finish */
  sp(m) {
    const g = wrap("u", tone(m) + " span"), [x1, y1] = P(m.n, m.t1), [x2, y2] = P(m.n, m.t2);
    /* with "around", a faint ring carries the same stretch of time round the whole round, so spans on
       different spokes can be compared: where two rings overlap, so do their spans */
    if (m.around && LN) el("path", { class: "around", d: `M${f(lx(m.t1))},${f(-GH)} H${f(lx(m.t2))} V${f(GH)} H${f(lx(m.t1))} Z`, fill: m.col || CA.col[m.n], stroke: m.col || CA.col[m.n] }, g);
    else if (m.around) {
      const ring = r => `M${f(r)},0 A${f(r)},${f(r)} 0 1 0 ${f(-r)},0 A${f(r)},${f(r)} 0 1 0 ${f(r)},0 Z`;
      el("path", { class: "around", d: ring(rad(m.t2)) + " " + ring(rad(m.t1)), "fill-rule": "evenodd", fill: m.col || CA.col[m.n], stroke: m.col || CA.col[m.n] }, g);
    }
    el("line",{ x1: f(x1), y1: f(y1), x2: f(x2), y2: f(y2), stroke: m.col || CA.col[m.n] }, g);
    return g;
  },
  /* what one post sees: a gold stretch of its spoke */
  obs(m) {
    const g = wrap("u", "obs"), [x1, y1] = P(m.n, m.t1), [x2, y2] = P(m.n, m.t2);
    el("line", { x1: f(x1), y1: f(y1), x2: f(x2), y2: f(y2) }, g);
    return g;
  },
  /* a place cut off: a hatched wedge round its spoke */
  wedge(m) {
    if (LN) { const g = wrap("u", tone(m) + " wedge"), y = ly(m.n), h = (m.w || 26) * 1.15, x1 = lx(m.t1 || 0), x2 = lx(m.t2 || TEND) + 8;
      el("path", { d: `M${f(x1)},${f(y - h)} H${f(x2)} V${f(y + h)} H${f(x1)} Z` }, g); return g; }
    const g = wrap("u", tone(m) + " wedge"), a = A(m.n), w = m.w || 26, r1 = rad(m.t1 || 0), r2 = rad(m.t2 || TEND) + 8, n = 24, pts = [];
    for (let i = 0; i <= n; i++) pts.push(pol(a - w + 2 * w * i / n, r2));
    for (let i = n; i >= 0; i--) pts.push(pol(a - w + 2 * w * i / n, r1));
    el("path", { d: dpath(pts) + " Z" }, g);
    return g;
  },
  /* a whole span of time, everywhere at once */
  band(m) {
    if (LN) { const g = wrap("u", tone(m) + " band " + (m.cls || ""));
      el("path", { d: `M${f(lx(Math.max(0, m.t1)))},${f(-GH)} H${f(lx(m.t2))} V${f(GH)} H${f(lx(Math.max(0, m.t1)))} Z` }, g); return g; }
    const g = wrap("u", tone(m) + " band " + (m.cls || "")), r1 = Math.max(R0, rad(m.t1)), r2 = rad(m.t2);
    const ring = r => `M${f(r)},0 A${f(r)},${f(r)} 0 1 0 ${f(-r)},0 A${f(r)},${f(r)} 0 1 0 ${f(r)},0 Z`;
    el("path", { d: ring(r2) + " " + ring(r1), "fill-rule": "evenodd" }, g);
    return g;
  },
  /* one moment everywhere */
  ring(m) {
    const g = wrap("u", tone(m) + " ring " + (m.cls || ""));
    if (LN) el("line", { x1: f(lx(m.at)), x2: f(lx(m.at)), y1: f(-GH), y2: f(GH) }, g);
    else el("circle", { r: f(rad(m.at)) }, g);
    return g;
  },
  /* a cut: the past of every place up to its own moment, shaded inside a loop */
  cut(m) {
    if (LN) {
      /* on lanes: a line down through each place's moment, the past shaded to its left */
      const g = wrap("u", tone(m) + " cut"), ks = Object.keys(m.at).sort((a, b) => laneIx(a) - laneIx(b));
      const line = [[lx(m.at[ks[0]]), -GH], ...ks.map(k => P(k, m.at[k])), [lx(m.at[ks[ks.length - 1]]), GH]];
      el("path", { class: "fillc", d: dpath([[LX0 - 14, -GH], ...line, [LX0 - 14, GH]]) + " Z" }, g);
      el("path", { class: "edge", d: dpath(line) }, g);
      return g;
    }
    const g = wrap("u", tone(m) + " cut"), norm = a => ((a % 360) + 360) % 360;
    const ks = Object.keys(m.at).sort((a, b) => norm(A(a)) - norm(A(b))), angs = ks.map(k => norm(A(k))), pts = [];
    for (let i = 0; i < ks.length; i++) {
      const j = (i + 1) % ks.length, span = norm(angs[j] - angs[i]) || 360;
      for (let s = 0; s < span; s += 3) {
        const w = (1 - Math.cos(Math.PI * s / span)) / 2;
        pts.push(pol(angs[i] + s, rad(m.at[ks[i]] + (m.at[ks[j]] - m.at[ks[i]]) * w)));
      }
    }
    el("path", { class: "fillc", d: dpath(pts) + " Z " + `M${R0},0 A${R0},${R0} 0 1 0 ${-R0},0 A${R0},${R0} 0 1 0 ${R0},0 Z`, "fill-rule": "evenodd" }, g);
    el("path", { class: "edge", d: dpath(pts) + " Z" }, g);
    return g;
  },
  /* a ring round a place's box: the podium, a liar, one group or another */
  halo(m) {
    const g = wrap("u", tone(m) + " halo " + (m.cls || "")), [x, y] = nodeXY(m.n), s = m.cls === "q2" ? 6 : 0;
    el("rect", { x: f(x - 24 - s), y: f(y - 17 - s), width: 48 + 2 * s, height: 34 + 2 * s, rx: 9 + s }, g);
    return g;
  },
  coin(m) {
    const g = wrap("e", tone(m) + " coin"), [x, y] = P(m.n, m.at), gg = el("g", { transform: `translate(${f(x)} ${f(y)})` }, g);
    el("circle", { class: "c1", r: 10.5 }, gg); el("circle", { class: "c2", r: 7 }, gg);
    text2(gg, 0, 0, VAL[m.face], "coint");
    return g;
  },
  /* a slate chalked with the man its tent thinks dead */
  slate(m) {
    const g = wrap("e", tone(m) + " slate"), [x, y] = P(m.n, m.at), a = (LN ? -90 * (m.side || 1) : A(m.n) + 90 * (m.side || 1)) * Math.PI / 180;
    const cx = x + 32 * Math.cos(a), cy = y + 32 * Math.sin(a), gg = el("g", { transform: `translate(${f(cx)} ${f(cy)})` }, g);
    el("line", { class: "tie", x1: f(x - cx), y1: f(y - cy), x2: 0, y2: 0 }, gg);
    el("rect", { x: -19, y: -12, width: 38, height: 24, rx: 3 }, gg);
    text2(gg, 0, 0, m.txt, "chalk");
    if (m.struck) el("path", { class: "rub", d: "M-15,7 L15,-7" }, gg);
    return g;
  },
  /* a bundle of three sealed votes, tied */
  bun(m) {
    const g = wrap("e", tone(m) + " bun"), [x, y] = P(m.n, m.at), gg = el("g", { transform: `translate(${f(x)} ${f(y)})` }, g);
    el("rect", { x: -9, y: -9, width: 18, height: 18, rx: 3, transform: "rotate(45)" }, gg);
    text2(gg, 0, 0, "3", "bunt");
    return g;
  },
  hawk(m) { const g = wrap("e", tone(m)), [x, y] = where(m); hawk(g, x, y); return g; },
  tg(m, at) {
    const g = wrap("t", tone(m)), [x, y] = at || where(m), box = tagAt(g, x, y, m.txt, tagCls(m));
    g.rr = Math.hypot(x, y); g.rect = [x - box.W / 2 - 3, y - box.H / 2 - 2, x + box.W / 2 + 3, y + box.H / 2 + 2];
    return g;
  }
};

/* ---------- the scenes ---------- */
const V = (i, m) => ({ i, m });
const sl = (a, ta, b, tb, o) => X({ t: "sl", a, ta, b, tb }, o);
const ev = (n, at, o) => X({ t: "ev", n, at }, o);
const tg = (pos, txt, o) => X({ t: "tg", txt }, Array.isArray(pos) ? { x: pos[0], y: pos[1] } : pos, o);
const on = (n, at, dx, dy) => ({ n, at, dx: dx || 0, dy: dy || 0 });
const SC = {};
function def(id, cast, marks, o) { marks.forEach((m, i) => { m.k = m.k || id + "." + (m.id || i); }); SC[id] = X({ id, cast, marks }, o); }
/* a book grown from another: the parent's marks, less any dropped, plus the change */
function grow(id, parent, o) {
  const p = SC[parent], drop = new Set(o.drop || []);
  const lit = new Set(o.lit || []);
  const base = p.marks.filter(m => !m.own && !drop.has(m.k)).map(m => X(m, { c: 0, hl: 0, base: lit.has(m.k) ? 0 : 1 }));
  const add = (o.add || []).map((m, i) => X(m, { k: m.k || id + "." + (m.id || "a" + i) }));
  SC[id] = { id, cast: o.cast || p.cast, marks: base.concat(add) };
}
/* How to read the round */
def("start", "houses", [
  ev("H1", 1.2, { id: "e1" }), sl("H1", 1.2, "H2", 2.6, { id: "s1" }), ev("H2", 2.6, { id: "e2" }),
  { t: "ring", at: 4.4, cls: "moment", id: "now" },
  tg([-104, -150], V("House 1, later outward", "p₁, as time passes"), { id: "t1" }),
  tg([150, -92], V("a slip, carried", "a message"), { id: "t2" }),
  tg([0, 168], V("one moment, everywhere", "one instant, everywhere"), { id: "t3" })
]);

/* Ordering Without Clocks: a tally on every entry, jumping past any number a slip brings */
def("owc", "houses", [
  ev("H1", 1.0, { num: 1, id: "a1" }), ev("H1", 1.9, { num: 2, id: "a2" }),
  ev("H2", 1.3, { num: 1, id: "b1" }), ev("H2", 2.7, { num: 3, id: "b2" }), ev("H2", 4.2, { num: 4, id: "b3" }),
  ev("H3", 1.1, { num: 1, id: "c1" }), ev("H3", 2.3, { num: 2, id: "c2" }), ev("H3", 5.9, { num: 5, id: "c3" }),
  sl("H1", 1.9, "H2", 2.7, { id: "s1", trim: 13 }), sl("H2", 4.2, "H3", 5.9, { id: "s2", trim: 13 }),
  tg(on("H2", 2.7, 66, -28), V("2 arrives: jump to 3", "max(1, 2) + 1 = 3"), { id: "t1", own: 1 }),
  tg([0, 230], V("a cause always carries less", "a → b ⇒ C(a) < C(b)"), { id: "t2", own: 1 })
]);

/* Many Copies: first by the sun, which no tally sees */
grow("mc", "owc", { lit: ["owc.b3"], add: [
  ev("H3", 5.05, { num: 3, id: "c25" }),
  { t: "sp", n: "H2", t1: 3.7, t2: 4.45, c: 1, around: 1, id: "q2" }, { t: "sp", n: "H3", t1: 4.75, t2: 5.35, c: 1, around: 1, id: "q3" },
  { t: "ring", at: 4.6, cls: "sun", c: 1, id: "sun" },
  tg(on("H2", 4.1, 62, 34), V("tally 4, first by the sun", "C = 4, first in real time"), { c: 1, id: "t1" }),
  tg(on("H3", 5.05, -6, 34), V("tally 3, yet later", "C = 3, yet later"), { c: 1, id: "t2" })
] });

/* Taking Stock: red sashes, a count that is a cut, and the cart on the road counted */
grow("ts", "owc", { add: [
  { t: "cut", at: { H1: 2.55, H2: 3.45, H3: 4.0 }, id: "cut" },
  sl("H3", 1.3, "H1", 3.4, { id: "cart", trim: 9, lab: V("a cart on the road: counted", "in the channel: recorded"), labc: 1, la: .42 }), ev("H1", 3.4, { id: "carte" }),
  sl("H1", 2.55, "H2", 3.45, { c: 1, id: "sa1" }), sl("H1", 2.55, "H3", 4.0, { c: 1, id: "sa2" }), sl("H3", 4.0, "H1", 5.0, { c: 1, id: "sa3" }),
  ev("H1", 2.55, { ring: 1, c: 1, id: "r1" }), ev("H2", 3.45, { ring: 1, c: 1, id: "r2" }), ev("H3", 4.0, { ring: 1, c: 1, id: "r3" }),
  tg({ deg: -25, at: 3.0, dx: 60, dy: -20 }, V("red sashes: count now", "markers: record now"), { c: 1, id: "t2" })
] });

/* The Limits of Agreement: four tents, ravens timed to keep the night open, a man who falls silent */
def("flp", "tents", [
  ev("T1", .9, { v: "H", id: "p1" }), ev("T2", .9, { v: "A", id: "p2" }), ev("T3", .9, { v: "H", id: "p3" }), ev("T4", .9, { v: "A", id: "p4" }),
  sl("T2", 1.15, "T1", 1.9, { id: "h1" }), ev("T1", 1.9, { hollow: 1, id: "r1" }),
  sl("T1", 2.0, "T3", 2.9, { id: "h2" }), ev("T3", 2.9, { hollow: 1, id: "r2" }),
  sl("T3", 3.0, "T1", 3.9, { id: "h3" }), ev("T1", 3.9, { hollow: 1, id: "r3" }),
  sl("T1", 4.0, "T2", 4.9, { id: "h4" }), ev("T2", 4.9, { hollow: 1, id: "r4" }),
  sl("T2", 5.0, "T1", 5.9, { id: "h5" }), ev("T1", 5.9, { hollow: 1, id: "r5" }),
  { t: "x", n: "T4", at: 1.6, c: 1, id: "dead" },
  tg(on("T4", 1.6, 64, 18), V("absent, or a slow runner?", "crashed, or slow?"), { c: 1, own: 1, id: "t1" }),
  tg([0, 236], V("no decree ever passes", "no process decides"), { c: 1, own: 1, id: "t2" })
]);
const LATE = ["flp.h4", "flp.r4", "flp.h5", "flp.r5"];

/* Running Late: the wind drops, unseen, and a turn commits on two pledges */
grow("dls", "flp", { drop: ["flp.h3", "flp.r3"].concat(LATE), add: [
  { t: "band", t1: 0, t2: 3.2, cls: "wind", c: 1, id: "band" }, { t: "ring", at: 3.2, cls: "drop", c: 1, id: "ring" },
  tg({ deg: 90, at: 3.2 }, V("the wind drops, unseen", "GST, known to no one"), { c: 1, own: 1, id: "t1" }),
  sl("T1", 3.5, "T2", 4.1, { lab: "H", id: "c1" }), sl("T1", 3.5, "T3", 4.1, { lab: "H", id: "c2" }),
  sl("T2", 4.2, "T1", 4.8, { id: "q1" }), sl("T3", 4.2, "T1", 4.8, { id: "q2" }),
  ev("T1", 4.95, { v: "H", big: 1, id: "k1" }),
  sl("T1", 5.1, "T2", 5.7, { id: "d1" }), sl("T1", 5.1, "T3", 5.7, { id: "d2" }),
  ev("T2", 5.85, { v: "H", big: 1, id: "k2" }), ev("T3", 5.85, { v: "H", big: 1, id: "k3" }),
  tg(on("T1", 4.95, -30, -34), V("two pledges: commit", "t + 1 acks: decide"), { own: 1, id: "t2" })
] });

/* By Chance: a coin in each tent, tossed until they land alike */
grow("bo", "flp", { drop: LATE, add: [
  { t: "coin", n: "T1", at: 4.3, face: "H", c: 1, id: "c11" }, { t: "coin", n: "T2", at: 4.3, face: "A", c: 1, id: "c12" }, { t: "coin", n: "T3", at: 4.3, face: "H", c: 1, id: "c13" },
  { t: "coin", n: "T1", at: 5.2, face: "H", c: 1, id: "c21" }, { t: "coin", n: "T2", at: 5.2, face: "H", c: 1, id: "c22" }, { t: "coin", n: "T3", at: 5.2, face: "H", c: 1, id: "c23" },
  ev("T1", 6.1, { v: "H", big: 1, id: "k1" }), ev("T2", 6.1, { v: "H", big: 1, id: "k2" }), ev("T3", 6.1, { v: "H", big: 1, id: "k3" }),
  tg(on("T2", 4.3, -40, 34), V("unsure: toss a coin", "no majority: flip"), { c: 1, own: 1, id: "t1" }),
  tg(on("T3", 6.1, 0, -30), V("alike at last: all commit", "decide, with probability 1"), { own: 1, id: "t2" })
] });

/* Telling the Absent from the Slow: attendance slates chalked at the chamber door */
grow("ct", "dls", { drop: ["dls.band", "dls.ring"], add: [
  { t: "slate", n: "T3", at: 1.6, txt: "T1", struck: 1, side: -1, c: 1, id: "w" },
  { t: "slate", n: "T1", at: 2.7, txt: "T4", side: -1, c: 1, id: "s1" },
  { t: "slate", n: "T2", at: 2.7, txt: "T4", side: 1, c: 1, id: "s2" },
  tg(on("T3", 1.6, 70, 10), V("wrong, rubbed out", "false suspicion, revoked"), { c: 1, own: 1, id: "t1" }),
  tg({ deg: 90, at: 3.6 }, V("slates, not the wind, end the wait", "◇S ends the wait, not GST"), { c: 1, own: 1, id: "t3" })
] });

/* Answering While Cut Off: hawks take a bird, and the cut-off tent cannot answer as one */
def("cap", "tents", [
  { t: "wedge", n: "T4", w: 30, t1: 1.2, c: 1, id: "cut" },
  { t: "sp", n: "T2", t1: 1.0, t2: 1.9, id: "mv" }, ev("T2", 1.45, { v: "A", id: "mv1" }),
  sl("T2", 1.5, "T1", 2.4, { id: "b1" }), ev("T1", 2.4, { id: "b1e" }),
  sl("T2", 1.5, "T4", 2.7, { lost: .62, hawk: [14, 16], c: 1, id: "lost" }),
  { t: "hawk", x: 168, y: 62, c: 1, id: "hk1" }, { t: "hawk", x: 64, y: 168, c: 1, id: "hk2" },
  { t: "sp", n: "T4", t1: 3.4, t2: 4.3, id: "ask" }, ev("T4", 4.3, { v: "H", id: "ans" }),
  tg(on("T2", 1.45, -64, 6), V("moves the plan: attack", "write(1)"), { own: 1, id: "t1" }),
  tg(on("T4", 4.3, 30, 36), V("answers hold: not as one", "returns 0: stale"), { c: 1, own: 1, id: "t2" })
]);

/* Agreeing Among Liars: on the crown, rounds by rat, and a liar in place of the dead */
def("bgp", "b4", [
  { t: "halo", n: "B1", cls: "red", c: 1, id: "liar" },
  sl("B1", .6, "B2", 1.6, { lab: "A", id: "o2" }), sl("B1", .6, "B3", 1.6, { lab: "A", dir: 1, la: .62, id: "o3" }), sl("B1", .6, "B4", 1.6, { lab: "H", c: 1, id: "o4" }),
  sl("B2", 2.0, "B3", 3.0, { id: "r23" }), sl("B2", 2.0, "B4", 3.0, { dir: 1, id: "r24" }),
  sl("B3", 2.0, "B2", 3.0, { id: "r32" }), sl("B3", 2.0, "B4", 3.0, { id: "r34" }),
  sl("B4", 2.0, "B2", 3.0, { dir: 1, lab: "H", la: .5, id: "r42" }), sl("B4", 2.0, "B3", 3.0, { lab: "H", la: .55, id: "r43" }),
  ev("B2", 3.6, { v: "A", big: 1, id: "k2" }), ev("B3", 3.6, { v: "A", big: 1, id: "k3" }), ev("B4", 3.6, { v: "A", big: 1, id: "k4" }),
  tg(on("B1", .8, 96, -30), V("the chief may lie", "a traitorous commander"), { c: 1, own: 1, id: "t1" }),
  tg([0, 222], V("relay, take the greater count", "relay, then majority vote"), { own: 1, id: "t2" })
]);

/* The Part-Time Parliament: a ballot asks a majority, proposes the latest vote, and members come and go */
def("ptp", "priests", [
  sl("A", .8, "B", 1.5, { id: "a1" }), sl("A", .8, "G", 1.8, { dir: 1, id: "a2" }),
  sl("B", 1.7, "A", 2.4, { id: "p1" }), sl("G", 2.0, "A", 2.9, { dir: -1, lab: V("voted: olive", "accepted v"), la: .5, id: "p2" }),
  sl("A", 3.0, "B", 3.7, { id: "v1" }), sl("A", 3.0, "G", 4.0, { dir: 1, id: "v2" }),
  sl("B", 3.9, "A", 4.6, { id: "w1" }), sl("G", 4.2, "A", 5.1, { dir: -1, id: "w2" }),
  ev("A", 5.3, { num: "✓", big: 1, id: "pass" }),
  { t: "gap", n: "D", t1: .4, t2: 6.6, c: 1, id: "gD" }, { t: "gap", n: "E", t1: 1.2, t2: 4.3, c: 1, id: "gE" }, { t: "gap", n: "G", t1: 4.4, t2: 5.6, c: 1, id: "gG" },
  tg(on("D", 3.2, 56, 26), V("away, and back again", "crash and recovery"), { c: 1, own: 1, id: "t1" }),
  tg(on("B", 5.2, -96, 0), V("ask most, propose the latest", "phase 1, then phase 2"), { own: 1, id: "t2" })
]);

/* One Leader at a Time: one holder wears the wreath; a line passes on the holder and two benches; a silent holder is replaced */
def("vr", "tholos", [
  { t: "halo", n: "O", cls: "gold", c: 1, id: "pod" },
  { t: "gap", n: "Th", t1: .5, t2: 3.3, id: "away" },
  sl("O", .7, "L", 1.4, { c: 1, id: "o1" }), sl("O", .7, "K", 1.7, { c: 1, id: "o2" }), sl("O", .7, "M", 1.7, { c: 1, id: "o3" }),
  sl("L", 1.6, "O", 2.3, { id: "r1" }), sl("K", 1.9, "O", 2.6, { id: "r2" }),
  ev("O", 2.6, { num: "✓", big: 1, id: "pass" }),
  { t: "x", n: "O", at: 3.45, id: "sil" },
  sl("Th", 3.6, "L", 4.4, { dir: 1, lab: V("seal 7?", "view 7?"), la: .26, id: "n1" }), sl("Th", 3.6, "M", 4.2, { id: "n2" }),
  sl("L", 4.55, "Th", 5.35, { dir: -1, lab: V("seal 6, line 12", "viewstamp 6.12"), la: .3, id: "n3" }), sl("M", 4.4, "Th", 5.0, { id: "n4" }),
  ev("L", 5.8, { num: "", fill: "#e0b84a", big: 1, ring: 1, id: "newp" }),
  tg(on("O", 1.2, -100, -20), V("only the holder writes", "only the primary orders"), { c: 1, own: 1, id: "t1" }),
  tg(on("L", 5.8, 10, 34), V("the latest takes the wreath", "highest viewstamp: primary"), { own: 1, id: "t2" })
]);

/* Keeping Order Among Liars: the writer may lie, and a line stands only on three seals of four */
def("pbft", "b4", [
  { t: "halo", n: "B1", cls: "red", c: 1, id: "liar" },
  sl("B1", .6, "B2", 1.4, { lab: "X", id: "o2" }), sl("B1", .6, "B3", 1.6, { lab: "X", dir: 1, la: .62, id: "o3" }), sl("B1", .6, "B4", 1.4, { lab: "Y", c: 1, id: "o4" }),
  sl("B2", 1.9, "B3", 2.7, { id: "e23" }), sl("B2", 1.9, "B4", 2.9, { dir: 1, id: "e24" }),
  sl("B3", 1.9, "B2", 2.7, { id: "e32" }), sl("B3", 1.9, "B4", 2.7, { id: "e34" }),
  sl("B4", 1.9, "B2", 2.9, { dir: 1, id: "e42" }), sl("B4", 1.9, "B3", 2.7, { id: "e43" }),
  ev("B2", 3.2, { v: "X", big: 1, id: "k2" }), ev("B3", 3.2, { v: "X", big: 1, id: "k3" }), ev("B4", 3.2, { hollow: 1, id: "k4" }),
  tg(on("B1", .8, 104, -30), V("the writer may lie", "a Byzantine primary"), { c: 1, own: 1, id: "t1" }),
  tg([0, 222], V("echo: three seals of four", "prepare: 2f + 1 of 3f + 1"), { own: 1, id: "t2" })
]);

/* Changing Leaders Among Liars: votes go only to the writer, tied into bundles of three */
grow("hs", "pbft", { drop: ["pbft.e23", "pbft.e24", "pbft.e32", "pbft.e34", "pbft.e42", "pbft.e43", "pbft.k2", "pbft.k3", "pbft.k4"], add: [
  sl("B2", 1.55, "B1", 2.05, { c: 1, id: "v12" }), sl("B3", 1.7, "B1", 2.2, { c: 1, dir: 1, id: "v13" }),
  { t: "bun", n: "B1", at: 2.35, c: 1, id: "q1" },
  sl("B1", 2.5, "B2", 3.0, { id: "u2" }), sl("B1", 2.5, "B3", 3.1, { dir: 1, id: "u3" }), sl("B1", 2.5, "B4", 3.0, { id: "u4" }),
  sl("B2", 3.1, "B1", 3.6, { c: 1, id: "v22" }), sl("B4", 3.1, "B1", 3.6, { c: 1, id: "v24" }), sl("B3", 3.15, "B1", 3.7, { c: 1, dir: 1, id: "v23" }),
  { t: "bun", n: "B1", at: 3.9, c: 1, id: "q2" },
  sl("B1", 4.05, "B2", 4.55, { id: "x2" }), sl("B1", 4.05, "B3", 4.65, { dir: 1, id: "x3" }), sl("B1", 4.05, "B4", 4.55, { id: "x4" }),
  sl("B2", 4.65, "B1", 5.15, { c: 1, id: "v32" }), sl("B4", 4.65, "B1", 5.15, { c: 1, id: "v34" }), sl("B3", 4.7, "B1", 5.25, { c: 1, dir: 1, id: "v33" }),
  { t: "bun", n: "B1", at: 5.45, c: 1, id: "q3" },
  tg(on("B1", 4.5, 110, 0), V("votes to the writer only", "votes to the leader only"), { c: 1, own: 1, id: "t1" }),
  tg([0, 236], V("tied in bundles of three", "quorum certificates"), { c: 1, own: 1, id: "t2" })
] });

/* Spreading by Word of Mouth: copies differ for a while; rumour, then the festival */
def("gos", "libs5", [
  ev("L1", 1.0, { num: 2, id: "n1" }), ev("L2", 1.0, { num: 1, id: "o2" }), ev("L3", 1.0, { num: 1, id: "o3" }), ev("L4", 1.0, { num: 1, id: "o4" }), ev("L5", 1.0, { num: 1, id: "o5" }),
  sl("L1", 1.25, "L2", 1.95, { id: "r1" }), ev("L2", 2.1, { num: 2, id: "n2" }),
  sl("L1", 1.25, "L5", 2.05, { id: "r2" }), ev("L5", 2.2, { num: 2, id: "n5" }),
  sl("L2", 2.3, "L3", 3.0, { id: "r3" }), ev("L3", 3.15, { num: 2, id: "n3" }),
  sl("L3", 3.35, "L2", 4.1, { lab: V("knew it", "already known"), id: "r4" }),
  ev("L4", 3.5, { num: 1, c: 1, id: "stale" }),
  sl("L5", 4.5, "L4", 5.2, { id: "f1" }), sl("L4", 4.5, "L5", 5.2, { id: "f2" }), ev("L4", 5.4, { num: 2, id: "n4" }),
  tg(on("L4", 3.5, -50, 26), V("unheard: differs a while", "stale until anti-entropy"), { c: 1, own: 1, id: "t1" }),
  tg({ deg: 162, at: 4.9, dx: -20, dy: -40 }, V("the festival: compare all", "anti-entropy"), { own: 1, id: "t2" })
]);

/* Probably Up to Date: write to one, read from one, and the two may miss */
def("pbs", "libs3", [
  ev("L1", .9, { num: 2, id: "w" }),
  sl("L1", 1.0, "L2", 3.4, { id: "s2" }), ev("L2", 3.55, { num: 2, id: "n2" }),
  sl("L1", 1.0, "L3", 4.6, { id: "s3" }), ev("L3", 4.75, { num: 2, id: "n3" }),
  { t: "halo", n: "L1", cls: "gold", c: 1, id: "W" }, { t: "halo", n: "L3", cls: "blue", c: 1, id: "R" },
  ev("L3", 2.3, { num: 1, c: 1, ring: 1, id: "old" }), ev("L3", 5.6, { num: 2, ring: 1, id: "new" }),
  tg([0, -235], V("one holds it, one is asked", "W = 1, R = 1, N = 3"), { c: 1, own: 1, id: "t1" }),
  tg([-170, 20], V("an old copy", "stale read"), { c: 1, own: 1, id: "t2" }),
  tg(on("L3", 5.6, -10, 34), V("later, the odds are better", "t-visibility"), { own: 1, id: "t3" })
]);

/* Changes That Never Clash: one column per library, and merging keeps the larger pile */
def("crdt", "libs3", [
  ev("L1", 1.0, { id: "a1" }), ev("L1", 2.0, { id: "a2" }), ev("L2", 1.3, { id: "b1" }), ev("L3", 1.1, { id: "c1" }), ev("L3", 2.4, { id: "c2" }),
  sl("L1", 2.0, "L2", 3.0, { id: "m1" }), ev("L2", 3.0, { ring: 1, c: 1, id: "b2" }),
  sl("L3", 2.4, "L2", 3.9, { id: "m2" }), ev("L2", 3.9, { ring: 1, c: 1, id: "b3" }),
  sl("L2", 3.9, "L1", 5.0, { id: "m3" }), ev("L1", 5.0, { ring: 1, c: 1, id: "a3" }),
  sl("L2", 3.9, "L3", 5.0, { id: "m4" }), ev("L3", 5.0, { ring: 1, c: 1, id: "c3" }),
  tg(on("L1", 2.0, -40, 0), "2·0·0", { cls: "sm col", id: "l1" }),
  tg(on("L3", 2.4, -12, 28), "0·0·2", { cls: "sm col", id: "l2" }),
  tg(on("L2", 3.0, 18, -26), "2·1·0", { cls: "sm col", c: 1, id: "l3" }),
  tg(on("L2", 3.9, 46, 4), "2·1·2", { cls: "sm col", c: 1, id: "l4" }),
  tg(on("L1", 5.0, 44, 0), "2·1·2", { cls: "sm col", c: 1, id: "l5" }),
  tg(on("L3", 5.0, -22, 26), "2·1·2", { cls: "sm col", c: 1, id: "l6" }),
  tg([0, 236], V("merge: the larger pile in each column", "merge = element-wise max"), { c: 1, own: 1, id: "t1" })
]);

/* What You Can Promise Alone: a whole visit while cut off, and a count written over twice */
def("hat", "libs4", [
  { t: "wedge", n: "L3", w: 32, t1: 1.0, id: "cut" },
  sl("L3", 1.2, "L2", 2.2, { lost: .6, id: "x1" }), sl("L4", 1.4, "L3", 2.6, { lost: .7, id: "x2" }),
  { t: "sp", n: "L3", t1: 1.6, t2: 3.0, c: 1, id: "visit" }, ev("L3", 2.0, { r: 4.5, c: 1, id: "c1" }), ev("L3", 2.6, { r: 4.5, c: 1, id: "c2" }),
  ev("L1", 3.8, { num: 1, id: "add1" }), ev("L3", 4.1, { num: 1, id: "add3" }),
  tg(on("L3", 2.3, -76, 0), V("a whole visit: all or none", "atomic visibility"), { c: 1, own: 1, id: "t1" }),
  tg(on("L1", 3.8, 80, 0), V("both write 851 over 850", "lost update: unavoidable"), { own: 1, id: "t2" }),
  tg(on("L3", 5.2, 60, 10), V("cut off", "partitioned"), { own: 1, id: "t3" })
]);

/* Knowing When to Wait: a question that only grows answers at once; one that rests on an absence waits for all */
def("calm", "libs3", [
  sl("L2", 1.0, "L1", 2.0, { lab: V("a copy", "a fact"), la: .55, id: "s2" }), ev("L1", 2.0, { id: "e2" }),
  sl("L3", 1.2, "L1", 5.0, { held: 1, id: "s3" }), ev("L1", 5.0, { id: "e3" }),
  ev("L1", 2.2, { num: "✓", c: 1, ring: 1, id: "yes" }),
  { t: "obs", n: "L1", t1: 2.3, t2: 5.1, id: "wait" }, ev("L1", 5.3, { num: "✓", ring: 1, id: "all" }),
  tg(on("L1", 2.2, 86, 0), V("any copy? yes, at once", "∃: answer now"), { c: 1, own: 1, id: "t1" }),
  tg(on("L1", 5.3, 96, -6), V("all of them? wait for all", "∀: wait for everyone"), { c: 1, own: 1, id: "t2" }),
  tg({ deg: 205, at: 3.3, dx: -50 }, V("one still on the road", "one still in flight"), { own: 1, id: "t3" })
]);

/* ---------- the walls: two nights, the same from one post ---------- */
const nightTag = n => tg([-190, -236], n ? V("second night", "second run") : V("first night", "first run"), { cls: "night", k: "night" + n });
def("w1", "tents", [
  { t: "obs", n: "T1", t1: 0, t2: 4.4, id: "obs" },
  sl("T3", 1.0, "T1", 2.0, { id: "s3" }), ev("T1", 2.0, { id: "e3" }),
  sl("T4", 1.2, "T1", 2.9, { dir: -1, id: "s4" }), ev("T1", 2.9, { id: "e4" }),
  tg(on("T1", 4.4, 10, -30), V("the same, up to here", "identical so far"), { cls: "gold", id: "t" })
], { nights: [
  [nightTag(0), { t: "x", n: "T2", at: 1.0, c: 1, k: "w1.n0x" }, tg(on("T2", 2.6, -30, 30), V("T2 dies", "p₂ crashes"), { c: 1, k: "w1.n0t" })],
  [nightTag(1), sl("T2", 1.0, "T1", 5.6, { held: 1, c: 1, k: "w1.n1s" }), tg(on("T2", 2.6, -30, 30), V("T2's bird sits in a pine", "p₂'s message is slow"), { c: 1, k: "w1.n1t" })]
] });
def("w2", "b3", [
  { t: "obs", n: "B2", t1: 0, t2: 4.0, id: "obs" },
  sl("B1", .7, "B2", 1.8, { lab: "A", id: "o2" }),
  sl("B3", 2.3, "B2", 3.4, { lab: V("“H”", "“0”"), id: "r32" }),
  tg(on("B2", 4.0, -20, 30), V("the same, up to here", "identical so far"), { cls: "gold", id: "t" })
], { nights: [
  [nightTag(0), sl("B1", .7, "B3", 1.8, { lab: "H", c: 1, k: "w2.n0o" }), { t: "halo", n: "B1", cls: "red", c: 1, k: "w2.n0h" }, tg(on("B1", 2.4, 70, -10), V("the chief lies", "the commander is faulty"), { c: 1, k: "w2.n0t" })],
  [nightTag(1), sl("B1", .7, "B3", 1.8, { lab: "A", k: "w2.n1o" }), { t: "halo", n: "B3", cls: "red", c: 1, k: "w2.n1h" }, tg(on("B3", 2.5, 40, -20), V("B3 lies", "p₃ is faulty"), { c: 1, k: "w2.n1t" })]
] });
def("w3", "tents", [
  { t: "wedge", n: "T4", w: 30, t1: 1.2, id: "cut" },
  { t: "obs", n: "T4", t1: 0, t2: 4.5, id: "obs" },
  { t: "hawk", x: 168, y: 62, id: "hk1" }, { t: "hawk", x: 64, y: 168, id: "hk2" },
  { t: "sp", n: "T4", t1: 3.5, t2: 4.3, id: "ask" }, ev("T4", 4.3, { v: "H", id: "ans" }),
  tg(on("T4", 2.4, 60, -36), V("nothing comes in", "no message arrives"), { cls: "gold", id: "t" })
], { nights: [
  [nightTag(0), { t: "sp", n: "T2", t1: 1.0, t2: 1.9, c: 1, k: "w3.n0m" }, ev("T2", 1.45, { v: "A", c: 1, k: "w3.n0v" }),
   sl("T2", 1.5, "T4", 2.7, { lost: .62, c: 1, k: "w3.n0s" }), tg(on("T4", 4.3, 20, 36), V("hold is wrong: it moved", "0 is stale"), { c: 1, k: "w3.n0t" })],
  [nightTag(1), tg(on("T4", 4.3, 20, 36), V("hold is right", "0 is correct"), { cls: "ok", k: "w3.n1t" })]
] });
def("w4", "libs4", [
  { t: "obs", n: "L1", t1: 0, t2: 4.2, id: "obs" },
  sl("L2", 1.0, "L1", 2.0, { id: "s2" }), ev("L1", 2.0, { id: "e2" }),
  sl("L4", 1.3, "L1", 2.6, { id: "s4" }), ev("L1", 2.6, { id: "e4" }),
  tg(on("L1", 3.4, 74, 0), V("two copies heard", "two facts seen"), { cls: "gold", id: "t" })
], { nights: [
  [nightTag(0), tg(on("L3", 3.4, 0, 0), V("and that is all", "and no more exist"), { c: 1, k: "w4.n0t" })],
  [nightTag(1), ev("L3", 1.4, { c: 1, k: "w4.n1e" }), sl("L3", 1.5, "L1", 5.8, { held: 1, dir: 1, c: 1, k: "w4.n1s" }), tg({ deg: 160, at: 4.2, dx: -10, dy: 10 }, V("a third, still on the road", "a third, still in flight"), { c: 1, k: "w4.n1t" })]
] });


/* ---------- time: a moment runs outward, and what lies inside its ring has happened ----------
   Lines and stretches are clipped to the ring; dots, coins, slates and labels appear as it reaches them; a head rides
   each messenger in flight. Arriving at a scene, marks carried over from the last one stay drawn ("forced") and only
   what is new plays in; once the reader seeks or plays it again, everything keeps time alike. */
const TL = { T: TEND, play: false, raf: 0, last: 0, items: [], heads: [], forced: new Set(), onEnd: null };
const SPEED = 1.15; /* moments of the round per second: a whole scene in under six seconds */
const CLIPPED = new Set(["x", "gap", "sp", "obs", "wedge", "band", "ring", "cut", "hawk"]);
const tagTime = m => /\bnight\b/.test(m.cls || "") ? 0 : m.at != null ? m.at : m.x != null ? (Math.hypot(m.x, m.y) - R0) / ST : TEND;
const POPS = { ev: m => m.at, coin: m => m.at, bun: m => m.at, slate: m => m.at, tg: tagTime };
const btns = [...document.querySelectorAll(".tplay")], seeks = [...document.querySelectorAll(".tseek")];
function unclip(g) { g.removeAttribute("clip-path"); g.querySelectorAll("[clip-path]").forEach(e => e.removeAttribute("clip-path")); }
function build() {
  TL.items = []; TL.heads = [];
  for (const k in live) {
    const { m, g } = live[k], forced = TL.forced.has(k);
    const clipIt = e => { if (forced) e.removeAttribute("clip-path"); else e.setAttribute("clip-path", "url(#upto)"); };
    const pop = (e, at, cls) => { e.classList.add(cls); TL.items.push({ e, at: Math.min(Math.max(at, 0), TEND - .02), forced, pre: null }); };
    if (CLIPPED.has(m.t)) clipIt(g);
    else if (POPS[m.t]) pop(g, POPS[m.t](m), "tlp");
    if (m.t === "sl") {
      g.querySelectorAll("*").forEach(e => { if (e._clip) clipIt(e); if (e._at != null) pop(e, e._at, "tlf"); });
      TL.heads.push(X(g._head, { forced }));
    }
  }
  apply();
}
function apply() {
  const T = TL.T, end = T >= TEND - 1e-3;
  clipC.setAttribute("r", LN ? 0 : end ? 999 : f(rad(T) + 1.5));
  if (LN) clipR.setAttribute("width", end ? 1200 : f(lx(T) + 1.5 + 600));
  for (const it of TL.items) {
    const pre = !it.forced && T < it.at;
    if (pre !== it.pre) { it.pre = pre; it.e.classList.toggle("pre", pre); }
  }
  for (const h of TL.heads) {
    const u = (T - h.ta) / (h.tb - h.ta), on = !h.forced && u > 0 && u < h.end;
    if (on) {
      const n = h.full.length - 1, k = u * n, i = Math.min(n - 1, Math.floor(k)), w = k - i, a = h.full[i], b = h.full[i + 1];
      h.c.setAttribute("cx", f(a[0] + (b[0] - a[0]) * w)); h.c.setAttribute("cy", f(a[1] + (b[1] - a[1]) * w));
    }
    h.c.style.display = on ? "" : "none";
  }
  nowC.setAttribute("r", LN ? 0 : f(rad(T)));
  if (LN) { nowL.setAttribute("x1", f(lx(T))); nowL.setAttribute("x2", f(lx(T))); }
  nowG.classList.toggle("off", end || T <= 0);
  const v = Math.round(1000 * T / TEND);
  seeks.forEach(s => { s.value = v; s.style.setProperty("--v", v / 10 + "%"); });
}
function state() {
  const s = TL.play ? "pause" : TL.T >= TEND - 1e-3 ? "again" : "play";
  btns.forEach(b => { b.dataset.state = s; b.setAttribute("aria-label", s === "pause" ? "Pause" : s === "again" ? "Play again" : "Play"); });
}
function unforce() { if (TL.forced.size) { TL.forced = new Set(); build(); } }
function tick(now) {
  TL.T = Math.min(TEND, TL.T + Math.min(.1, (now - TL.last) / 1000) * SPEED); TL.last = now;
  apply();
  if (TL.T < TEND) { TL.raf = requestAnimationFrame(tick); return; }
  TL.play = false; TL.raf = 0; unforce(); state();
  if (TL.onEnd) TL.onEnd();
}
function play() {
  if (TL.T >= TEND - 1e-3) { TL.T = 0; unforce(); }
  TL.play = true; TL.last = performance.now();
  cancelAnimationFrame(TL.raf); TL.raf = requestAnimationFrame(tick); state();
}
function pause() { TL.play = false; cancelAnimationFrame(TL.raf); TL.raf = 0; state(); }
function seek(T) { pause(); unforce(); TL.T = Math.max(0, Math.min(TEND, T)); apply(); state(); }

/* the controls under the round, and dragging on the round itself: further out is later */
btns.forEach(b => b.addEventListener("click", () => (TL.play ? pause() : play())));
seeks.forEach(s => {
  s.addEventListener("input", () => { svg.classList.add("scrub"); seek(s.value / 1000 * TEND); });
  s.addEventListener("change", () => svg.classList.remove("scrub"));
});
let drag = null;
const ptAt = e => new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM().inverse());
const distAt = e => { const q = ptAt(e); return Math.hypot(q.x, q.y); };
const timeAt = e => LN ? (ptAt(e).x - LX0) / (LX1 - LX0) * TEND : (distAt(e) - R0) / ST;
svg.addEventListener("pointerdown", e => {
  /* touch keeps scrolling the page; the slider is there for fingers */
  if (e.pointerType === "touch" || e.button !== 0 || cur.scene === null) return;
  if (LN ? Math.abs(ptAt(e).y) > CH : distAt(e) > rad(TEND) + 24) return;
  drag = e.pointerId; svg.setPointerCapture(drag); svg.classList.add("scrub"); seek(timeAt(e)); e.preventDefault();
});
svg.addEventListener("pointermove", e => { if (drag === e.pointerId) seek(timeAt(e)); });
const endDrag = e => { if (drag === e.pointerId) { drag = null; svg.classList.remove("scrub"); } };
svg.addEventListener("pointerup", endDrag); svg.addEventListener("pointercancel", endDrag);

/* ---------- showing a scene: marks that stay, stay; what is new plays in through time ----------
   opt.keep holds the time and the play state (a night chosen by hand); opt.redraw draws everything afresh in place */
const live = {};
let cur = { scene: null, cast: null, night: -1 }, seq = 0;
const sig = m => JSON.stringify(m, (k, v) => (k === "c" || k === "hl" || k === "own" || k === "base" ? undefined : v));
function remove(g, now) {
  if (now) { g.remove(); return; }
  if (TL.T >= TEND - 1e-3) unclip(g);
  g.classList.add("hid"); setTimeout(() => g.remove(), 360);
}
function show(id, night, opt) {
  opt = opt || {};
  const S = SC[id]; if (!S) return;
  night = night || 0;
  const arrive = !opt.keep && !opt.redraw;
  if (arrive && id === cur.scene && night === cur.night) return;
  const my = ++seq;
  const list = S.marks.concat(S.nights ? S.nights[night] : []);
  const lanes = document.body.dataset.reg === "m", modeChange = lanes !== LN;
  if (modeChange) setMode(lanes);
  const castChange = cur.cast !== S.cast || modeChange, instant = !!opt.instant || reduce || cur.cast === null;
  const keep = new Set();
  if (!castChange && !opt.redraw) list.forEach(m => { const o = live[m.k]; if (o && sig(o.m) === sig(m)) keep.add(m.k); });
  for (const k in live) if (!keep.has(k)) { remove(live[k].g, instant); delete live[k]; }
  if (arrive) { pause(); TL.forced = keep; }
  else if (!opt.redraw) TL.forced = new Set([...TL.forced].filter(k => keep.has(k)));
  cur = { scene: id, cast: S.cast, night };
  const go = () => {
    if (my !== seq) return;
    CA = CASTS[S.cast];
    const fade = [], taken = [];
    const put = (m, at) => {
      const o = live[m.k];
      if (o) {
        if (tone(o.m) !== tone(m)) { o.g.remove(); o.g = DRAW[m.t](m, at); }
        o.g.classList.toggle("base", !!m.base && m.t !== "tg"); o.m = m;
        if (o.g.rect) taken.push(o.g.rect);
        return;
      }
      let g;
      try { g = DRAW[m.t](m, at); } catch (e) { console.error("mark", m.k, e); return; }
      if (m.base && m.t !== "tg") g.classList.add("base");
      live[m.k] = { m, g };
      if (!instant) fade.push(g);
    };
    const tags = list.filter(m => m.t === "tg"), rest = list.filter(m => m.t !== "tg");
    rest.forEach(m => put(m));
    tags.forEach(m => { if (live[m.k] && live[m.k].g.rect) taken.push(live[m.k].g.rect); });
    const ob = obstacles(rest);
    tags.forEach(m => { if (live[m.k]) put(m); else put(m, placeTag(m, tagBox(m.txt, tagCls(m)), ob, taken)); });
    fade.forEach(g => g.classList.add("hid"));
    requestAnimationFrame(() => requestAnimationFrame(() => fade.forEach(g => g.classList.remove("hid"))));
    if (!arrive) { build(); return; }
    /* something new to show plays in from the start; with motion reduced, or nothing new, the scene stands whole */
    const fresh = Object.keys(live).some(k => !TL.forced.has(k));
    TL.T = fresh && !reduce ? 0 : TEND;
    build();
    if (TL.T < TEND) play(); else { unforce(); state(); }
  };
  if (castChange) { setCast(S.cast, instant ? 0 : 480); if (instant) go(); else setTimeout(go, 500); }
  else go();
}


/* text keeps a readable size: larger in the round's own units when the round is drawn small */
function scaleText() {
  const w = svg.getBoundingClientRect().width || 500;
  const k = Math.max(.74, Math.min(1, .9 * VB / w));
  const old = parseFloat(svg.style.getPropertyValue("--k")) || 0;
  svg.style.setProperty("--k", k.toFixed(3));
  return Math.abs(old - k) > .01;
}
window.__ROUND = { show, scaleText, SC, onEnd: fn => { TL.onEnd = fn; } };
})();

/* ====================================================================== THE PAGE */
(function () {
const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => [...(r || document).querySelectorAll(s)];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const narrowQ = matchMedia("(max-width: 899px)");
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = n => Math.floor(Math.random() * n);
const T2 = (i, m) => `<span class="i">${i}</span><span class="m">${m}</span>`;
const NS = "http://www.w3.org/2000/svg";
const sv = (tag, at, p) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); if (p) p.appendChild(e); return e; };
const WORD = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const SUBS = "₀₁₂₃₄₅₆₇₈₉";
const sub = n => String(n).split("").map(d => SUBS[+d]).join("");
const R = window.__ROUND;

/* pictures served from the bucket fall back to the local copies */
$$("img[data-local]").forEach(im => im.addEventListener("error", () => { if (im.dataset.fell) return; im.dataset.fell = 1; im.removeAttribute("srcset"); im.src = im.dataset.local; }));

/* ---------------------------------------------------------------- the two registers */
const KEY = "daag-apart-reg", segbs = $$(".segb"), onReg = [];
function anchorEl() {
  const y = innerHeight * .5;
  const all = $$(".card, .tcard, main > section, main > header, main > footer");
  let best = null;
  for (const e of all) { const r = e.getBoundingClientRect(); if (r.top <= y && r.bottom >= y) best = e; }
  return best;
}
function setReg(r, keep) {
  const a = keep ? anchorEl() : null, before = a ? a.getBoundingClientRect().top : 0;
  document.body.setAttribute("data-reg", r);
  segbs.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.reg === r)));
  onReg.forEach(f => f(r));
  if (a) scrollBy(0, a.getBoundingClientRect().top - before);
}
segbs.forEach(b => b.addEventListener("click", () => { setReg(b.dataset.reg, true); try { localStorage.setItem(KEY, b.dataset.reg); } catch (e) {} }));
let saved = null;
try { saved = localStorage.getItem(KEY); } catch (e) {}
setReg(saved === "m" ? "m" : "i", false);
const isM = () => document.body.getAttribute("data-reg") === "m";

/* ---------------------------------------------------------------- reveal on arrival */
const io = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
}), { threshold: .12, rootMargin: "0px 0px -6% 0px" }) : null;
$$(".rv").forEach(el => {
  const sib = [...el.parentElement.children].filter(c => c.classList.contains("rv"));
  el.style.transitionDelay = Math.min(sib.indexOf(el), 6) * 70 + "ms";
  if (io && !reduce) io.observe(el); else el.classList.add("in");
});
function whenSeen(el, fn, th) {
  if (!el) return;
  if (!("IntersectionObserver" in window)) { fn(); return; }
  const o = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { o.disconnect(); fn(); } }, { threshold: th || .35 });
  o.observe(el);
}

/* ---------------------------------------------------------------- words that light as you scroll */
$$("[data-words]").forEach(p => {
  const words = p.textContent.trim().split(/\s+/);
  p.textContent = "";
  words.forEach((w, i) => { const s = document.createElement("span"); s.className = "w"; s.textContent = w; p.appendChild(s); if (i < words.length - 1) p.appendChild(document.createTextNode(" ")); });
  /* the closing words of the opening line are the promise: they light in gold */
  if (p.closest(".manifesto")) { const ws = $$(".w", p); ws.slice(-3).forEach(s => s.classList.add("hot")); }
});
function lightWords(sec, p) {
  $$("[data-words]", sec).forEach(par => {
    const ws = par.querySelectorAll(".w"), n = reduce ? ws.length : Math.round(clamp(p / .78, 0, 1) * ws.length);
    ws.forEach((w, i) => w.classList.toggle("lit", i < n));
  });
}

/* ---------------------------------------------------------------- pinned sections: --p runs 0 → 1 */
const pins = $$("[data-pin]");
function pinFrame() {
  const vh = innerHeight;
  for (const s of pins) {
    const r = s.getBoundingClientRect();
    if (r.bottom < -vh * .2 || r.top > vh * 1.2) continue;
    const p = clamp(-r.top / Math.max(1, r.height - vh), 0, 1);
    s.style.setProperty("--p", p.toFixed(4));
    if (s.querySelector("[data-words]")) lightWords(s, p);
  }
}

/* ---------------------------------------------------------------- the walk: cards over the round */
const stage = $("#stage"), walks = $$(".walk"), where = $("#where");
const bookCards = $$(".card[data-book]"), BOOKS = bookCards.length;
const bookIndex = {}; bookCards.forEach((c, i) => { bookIndex[c.id] = i + 1; });
let activeCard = null, night = 0, nightTimer = 0, manualNight = false;
const nightBtns = c => (c ? $$(".nights b", c) : []);
function markNight(c, n) {
  $$(".nights b.on").forEach(b => { b.classList.remove("on"); b.setAttribute("aria-pressed", "false"); });
  nightBtns(c).forEach((b, i) => { const mine = Math.floor(i / 2) === n; b.classList.toggle("on", mine); b.setAttribute("aria-pressed", String(mine)); });
}
function showCard(c, opt) {
  if (!R) return;
  const wall = c.classList.contains("wall");
  R.show(c.dataset.scene, wall ? night : 0, opt);
  if (wall) markNight(c, night);
}
function activate(c, w) {
  activeCard = c;
  $$(".card.on").forEach(x => { x.classList.remove("on"); x.removeAttribute("aria-current"); });
  /* the card being read is the current step of the walk; the tutor's panel takes it as "here" */
  c.classList.add("on"); c.setAttribute("aria-current", "step");
  stage.dataset.setting = w.dataset.setting;
  stage.dataset.mode = c.classList.contains("wall") ? "wall" : "walk";
  night = 0; manualNight = false; clearTimeout(nightTimer);
  showCard(c);
}
/* a wall plays one night, rests, then plays the other, for as long as it is on screen and nobody picks a night */
if (R) R.onEnd(() => {
  const c = activeCard;
  if (!c || !c.classList.contains("wall") || manualNight || reduce) return;
  clearTimeout(nightTimer);
  nightTimer = setTimeout(() => {
    const r = c.closest(".walk").getBoundingClientRect();
    if (activeCard !== c || manualNight || r.bottom < 0 || r.top > innerHeight) return;
    night = 1 - night; showCard(c);
  }, 1800);
});
function pickCard() {
  const vh = innerHeight, L = vh * (narrowQ.matches ? .7 : .52);
  let best = null, bestA = 0;
  for (const w of walks) { const r = w.getBoundingClientRect(), a = Math.min(r.bottom, vh) - Math.max(r.top, 0); if (a > bestA) { bestA = a; best = w; } }
  if (!best) return;
  const cs = best._cards || (best._cards = $$(".card[data-scene]", best));
  let act = cs[0];
  for (const c of cs) { if (c.getBoundingClientRect().top <= L) act = c; else break; }
  if (act !== activeCard) activate(act, best);
}
walks.forEach(w => $$(".card", w).forEach(c => nightBtns(c).forEach((b, i) => {
  b.setAttribute("role", "button"); b.setAttribute("tabindex", "0");
  const go = () => { if (activeCard !== c) { c.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" }); return; } manualNight = true; clearTimeout(nightTimer); night = Math.floor(i / 2); showCard(c, { keep: true }); };
  b.addEventListener("click", go);
  b.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
})));

/* ---------------------------------------------------------------- where you are, and how far */
const prog = $("#prog");
const secs = $$("main > section, main > header, main > footer");
let lastWhere = "";
function whereFrame() {
  const y = innerHeight * .45;
  let sec = null;
  for (const s of secs) { const r = s.getBoundingClientRect(); if (r.top <= y && r.bottom > y) { sec = s; break; } }
  let html = T2("<b>Eighteen Books in One Scroll</b>", "<b>Eighteen Books in One Scroll</b>");
  if (sec) {
    if (sec.classList.contains("walk") && activeCard) {
      const c = activeCard, b = c.dataset.book ? c : (c.nextElementSibling && c.nextElementSibling.dataset.book ? c.nextElementSibling : null);
      const n = b ? bookIndex[b.id] : 0;
      html = `<b>${isM() ? "Eighteen Books in One Scroll" : sec.dataset.label}</b>` + (n ? `<span class="ct">${T2(`Book ${n} of ${BOOKS}`, `Book ${n} of ${BOOKS}`)}</span>` : (c.classList.contains("wall") ? `<span class="ct">${T2("A wall", "An impossibility")}</span>` : ""));
    } else if (sec.classList.contains("interlude")) { if (!isM()) html = `<b>${$(".place", sec).textContent}</b>`; }
    else if (sec.classList.contains("feature")) { let p = sec.previousElementSibling; while (p && !p.dataset.label) p = p.previousElementSibling; html = p ? `<b>${isM() ? "Eighteen Books in One Scroll" : p.dataset.label}</b><span class="ct">${T2("Try it", "Try it")}</span>` : html; }
    else if (sec.id === "threads") html = `<b>${T2("The whole family", "The whole family")}</b><span class="ct">${T2("ten threads", "ten techniques")}</span>`;
    else if (sec.id === "costs") html = `<b>${T2("Four prices", "Four costs")}</b>`;
    else if (sec.id === "finale") html = `<b>${T2("In one breath", "In one breath")}</b>`;
  }
  if (html !== lastWhere) { where.innerHTML = html; lastWhere = html; }
  document.body.classList.toggle("in-walk", !!sec && sec.classList.contains("walk"));
  const max = document.documentElement.scrollHeight - innerHeight;
  prog.style.width = (max > 0 ? 100 * scrollY / max : 0) + "%";
}

/* ---------------------------------------------------------------- one loop for everything the scroll drives */
let ticking = false;
function frame() { ticking = false; pinFrame(); pickCard(); whereFrame(); treeFrame(); }
function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
addEventListener("scroll", onScroll, { passive: true });
addEventListener("resize", () => { if (R && R.scaleText() && activeCard) R.show(activeCard.dataset.scene, activeCard.classList.contains("wall") ? night : 0, { instant: true, redraw: true }); onScroll(); });
onReg.push(() => { lastWhere = ""; if (R && activeCard) R.show(activeCard.dataset.scene, activeCard.classList.contains("wall") ? night : 0, { instant: true, redraw: true }); onScroll(); });

/* ====================================================================== THE HERO: a living round */
(function hero() {
  const cv = $("#heroCanvas"); if (!cv) return;
  const cx = cv.getContext("2d"); let W = 0, H = 0, dpr = 1, on = true, raf = 0, t0 = performance.now();
  const COL = ["#9cb648", "#e0b84a", "#5b9be0", "#c45448", "#a57fc0", "#e8964d", "#6583d6"], N = 7, D = 9000;
  let msgs = [], cycle = -1;
  function size() { dpr = Math.min(2, devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; }
  function newCycle() {
    msgs = [];
    const k = 14 + rnd(5), red = rnd(k);
    for (let i = 0; i < k; i++) {
      const a = rnd(N); let b = rnd(N - 1); if (b >= a) b++;
      const t1 = Math.random() * .8, t2 = Math.min(.98, t1 + .07 + Math.random() * .2);
      msgs.push({ a, b, t1, t2, red: i === red });
    }
  }
  function draw(now) {
    raf = 0; if (!on) return;
    const el = now - t0, c = Math.floor(el / D), u = (el % D) / D;
    if (c !== cycle) { cycle = c; newCycle(); }
    const S = Math.min(W, H), R0 = S * .06, R1 = Math.max(W, H) * .62, rot = el * .000012, rad = t => R0 + (R1 - R0) * t;
    const ang = i => rot + i * 2 * Math.PI / N - Math.PI / 2;
    const fade = u > .9 ? (1 - u) / .1 : u < .04 ? u / .04 : 1;
    /* the allegory draws it like a black-figure vase: terracotta on black; computing in cool light */
    const gr = isM() ? { ring: "rgba(255,255,255,.07)", spoke: "rgba(255,255,255,.16)", now: "224,184,74", msg: "58,160,255", tip: "160,210,255", red: "239,106,63" }
      : { ring: "rgba(200,105,58,.16)", spoke: "rgba(224,138,85,.32)", now: "224,184,74", msg: "240,230,204", tip: "246,238,214", red: "224,138,85" };
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H);
    /* computing: the same messages on lanes, one per process, with a moment sweeping left to right */
    if (isM()) {
      const top = H * .16, bot = H * .84, L = W * .05, Rr = W * .95, yy = i => top + (bot - top) * i / (N - 1), xx = t => L + (Rr - L) * t;
      cx.setLineDash([2, 6]); cx.strokeStyle = gr.ring; cx.lineWidth = 1;
      for (let i = 1; i <= 7; i++) { cx.beginPath(); cx.moveTo(xx(i / 7), top - 20); cx.lineTo(xx(i / 7), bot + 20); cx.stroke(); }
      cx.setLineDash([]);
      for (let i = 0; i < N; i++) {
        cx.strokeStyle = gr.spoke; cx.lineWidth = 1.5; cx.beginPath(); cx.moveTo(L, yy(i)); cx.lineTo(Rr, yy(i)); cx.stroke();
        cx.fillStyle = COL[i]; cx.globalAlpha = .85; cx.beginPath(); cx.arc(L, yy(i), Math.max(3, S * .007), 0, 7); cx.fill(); cx.globalAlpha = 1;
      }
      cx.strokeStyle = `rgba(${gr.now},${.22 * fade})`; cx.lineWidth = 1.5; cx.beginPath(); cx.moveTo(xx(u), top - 20); cx.lineTo(xx(u), bot + 20); cx.stroke();
      for (const m of msgs) {
        if (u < m.t1) continue;
        const end = Math.min(1, (u - m.t1) / (m.t2 - m.t1)), x1 = xx(m.t1), y1 = yy(m.a), x2 = x1 + (xx(m.t2) - x1) * end, y2 = y1 + (yy(m.b) - y1) * end;
        cx.strokeStyle = m.red ? `rgba(${gr.red},${.95 * fade})` : `rgba(${gr.msg},${.6 * fade})`; cx.lineWidth = m.red ? 2.6 : 1.6;
        cx.beginPath(); cx.moveTo(x1, y1); cx.lineTo(x2, y2); cx.stroke();
        cx.fillStyle = m.red ? `rgba(${gr.red},${fade})` : `rgba(${gr.tip},${.9 * fade})`;
        cx.beginPath(); cx.arc(x2, y2, end < 1 ? 2.6 : 2, 0, 7); cx.fill();
      }
      if (!reduce) raf = requestAnimationFrame(draw);
      return;
    }
    cx.translate(W / 2, H / 2);
    cx.setLineDash([2, 6]); cx.strokeStyle = gr.ring; cx.lineWidth = 1;
    for (let i = 1; i <= 7; i++) { cx.beginPath(); cx.arc(0, 0, rad(i / 7), 0, 7); cx.stroke(); }
    cx.setLineDash([]);
    for (let i = 0; i < N; i++) {
      const a = ang(i);
      cx.strokeStyle = gr.spoke; cx.lineWidth = 1.5;
      cx.beginPath(); cx.moveTo(R0 * Math.cos(a), R0 * Math.sin(a)); cx.lineTo(R1 * Math.cos(a), R1 * Math.sin(a)); cx.stroke();
      cx.fillStyle = COL[i]; cx.globalAlpha = .85;
      cx.beginPath(); cx.arc(R0 * Math.cos(a), R0 * Math.sin(a), Math.max(3, S * .007), 0, 7); cx.fill(); cx.globalAlpha = 1;
    }
    /* now: one moment everywhere, sweeping outward */
    cx.strokeStyle = `rgba(${gr.now},${.22 * fade})`; cx.lineWidth = 1.5; cx.beginPath(); cx.arc(0, 0, rad(u), 0, 7); cx.stroke();
    for (const m of msgs) {
      if (u < m.t1) continue;
      const a0 = ang(m.a); let d = ang(m.b) - a0; d = Math.atan2(Math.sin(d), Math.cos(d));
      const end = Math.min(1, (u - m.t1) / (m.t2 - m.t1)), steps = 26;
      cx.strokeStyle = m.red ? `rgba(${gr.red},${.95 * fade})` : `rgba(${gr.msg},${.6 * fade})`; cx.lineWidth = m.red ? 2.6 : 1.6;
      cx.beginPath();
      for (let s = 0; s <= steps; s++) {
        const q = end * s / steps, r = rad(m.t1 + (m.t2 - m.t1) * q), a = a0 + d * q;
        s ? cx.lineTo(r * Math.cos(a), r * Math.sin(a)) : cx.moveTo(r * Math.cos(a), r * Math.sin(a));
      }
      cx.stroke();
      const rr = rad(m.t1 + (m.t2 - m.t1) * end), aa = a0 + d * end;
      cx.fillStyle = m.red ? `rgba(${gr.red},${fade})` : `rgba(${gr.tip},${.9 * fade})`;
      cx.beginPath(); cx.arc(rr * Math.cos(aa), rr * Math.sin(aa), end < 1 ? 2.6 : 2, 0, 7); cx.fill();
    }
    if (!reduce) raf = requestAnimationFrame(draw);
  }
  size(); addEventListener("resize", size);
  if ("IntersectionObserver" in window) new IntersectionObserver(es => { on = es[0].isIntersecting; if (on && !raf) raf = requestAnimationFrame(draw); }).observe(cv);
  raf = requestAnimationFrame(draw);
})();

/* ====================================================================== THE TALLIES */
(function tallies() {
  const box = $("#tally"); if (!box) return;
  const HC = ["#9cb648", "#e0b84a", "#5b9be0"], road = $(".road", box), list = $("#tallyOrder");
  let C = [0, 0, 0], log = [], lastArr = {}, busy = 0;
  const cards = $$(".th", box);
  cards.forEach((el, h) => {
    const others = [0, 1, 2].filter(x => x !== h);
    el.innerHTML = `<span class="hn" style="background:${HC[h]}">${T2("House " + (h + 1), "p" + sub(h + 1))}</span>
      <div class="num">0</div><div class="note"></div>
      <div class="acts"><button type="button" class="entry">${T2("Write an entry", "Local event")}</button>
      ${others.map(o => `<button type="button" data-to="${o}">${T2("Slip to House " + (o + 1) + " ›", "Send to p" + sub(o + 1) + " ›")}</button>`).join("")}</div>`;
    $(".entry", el).addEventListener("click", () => entry(h));
    $$("[data-to]", el).forEach(b => b.addEventListener("click", () => send(h, +b.dataset.to)));
  });
  const numEl = h => $(".num", cards[h]), noteEl = h => $(".note", cards[h]);
  function paint(h, jumped) {
    const n = numEl(h); n.textContent = C[h];
    n.classList.toggle("jump", !!jumped);
    if (jumped) setTimeout(() => n.classList.remove("jump"), 1400);
  }
  function record(h, kind) {
    log.push({ h, c: C[h], kind, k: log.length });
    if (log.length > 36) log.shift();
    const sorted = log.slice().sort((a, b) => a.c - b.c || a.h - b.h);
    const KIND = { e: ["entry", "event"], s: ["slip out", "send"], r: ["slip in", "receive"] };
    list.innerHTML = sorted.map(x => `<li class="${x.k === log.length - 1 ? "new" : ""}" style="background:${HC[x.h]}22">${T2("H" + (x.h + 1) + " · " + x.c, "(" + x.c + ", p" + sub(x.h + 1) + ")")}<i>${T2(KIND[x.kind][0], KIND[x.kind][1])}</i></li>`).join("");
  }
  function entry(h) { C[h]++; paint(h); noteEl(h).innerHTML = ""; record(h, "e"); }
  function center(el) { const a = el.getBoundingClientRect(), b = box.getBoundingClientRect(); return [a.left - b.left + a.width / 2, a.top - b.top + 34]; }
  function send(h, to) {
    C[h]++; paint(h); noteEl(h).innerHTML = ""; record(h, "s");
    const carried = C[h], key = h + ">" + to, now = performance.now();
    const arrive = Math.max(now + 1100 + Math.random() * 1700, (lastArr[key] || 0) + 260);
    lastArr[key] = arrive;
    const s = document.createElement("div"); s.className = "slip"; s.textContent = carried; road.appendChild(s);
    const [x0, y0] = center(cards[h]), [x1, y1] = center(cards[to]), w = s.offsetWidth, hh = s.offsetHeight;
    const tr = (x, y) => `translate(${x - w / 2}px,${y - hh / 2}px)`;
    const dur = arrive - now; busy++;
    const fin = () => { s.remove(); busy--; receive(to, carried); };
    if (reduce || !s.animate) { setTimeout(fin, 400); return; }
    s.animate([{ transform: tr(x0, y0), opacity: 0 }, { transform: tr(x0 + (x1 - x0) * .1, y0 - 30), opacity: 1, offset: .1 }, { transform: tr((x0 + x1) / 2, Math.min(y0, y1) - 70), offset: .5 }, { transform: tr(x1, y1 - 10), opacity: 1, offset: .95 }, { transform: tr(x1, y1), opacity: 0 }], { duration: dur, easing: "ease-in-out" }).onfinish = fin;
  }
  function receive(h, t) {
    const old = C[h]; C[h] = Math.max(C[h], t) + 1;
    const jumped = t >= old;
    paint(h, jumped);
    noteEl(h).innerHTML = jumped ? T2(t + " arrives: jump to " + C[h], "max(" + old + ", " + t + ") + 1 = " + C[h]) : T2(t + " arrives: just one more", "max(" + old + ", " + t + ") + 1 = " + C[h]);
    record(h, "r");
  }
  function reset() { C = [0, 0, 0]; log = []; lastArr = {}; [0, 1, 2].forEach(h => { paint(h); noteEl(h).innerHTML = ""; }); list.innerHTML = `<li style="background:transparent;box-shadow:none;color:#6e6e73;font-weight:500">${T2("Write an entry, or send a slip.", "Make an event, or send a message.")}</li>`; }
  $("#tallyReset").addEventListener("click", reset);
  reset();
  /* a first exchange plays by itself when the houses come into view */
  whenSeen(box, () => { if (log.length) return; const seq = [() => entry(0), () => entry(0), () => entry(0), () => send(0, 1), () => entry(1)]; seq.forEach((f, i) => setTimeout(f, 300 + i * 450)); }, .5);
})();

/* ====================================================================== THE COINS */
(function coins() {
  const wrap = $("#coins"); if (!wrap) return;
  const els = $$(".bcoin", wrap), st = $("#coinStatus"), go = $("#coinGo"), many = $("#coinMany"), hist = $("#coinHist");
  els.forEach(c => {
    $(".fa", c).innerHTML = T2("<b>H</b><small>owl</small><small>hold</small>", "<b>0</b><small>hold</small>");
    $(".fb", c).innerHTML = T2("<b>A</b><small>goddess</small><small>attack</small>", "<b>1</b><small>attack</small>");
    $(".who", c).innerHTML = T2("Tent " + c.querySelector(".who").textContent, "p" + sub(+c.querySelector(".who").textContent));
  });
  let pref = [0, 1, 0, 1], spins = [0, 0, 0, 0], round = 1, done = false, rolling = false;
  function set(i, v, turn) { pref[i] = v; if (turn) spins[i] += 3 + rnd(2); els[i].querySelector(".face").style.setProperty("--rot", (spins[i] * 360 + (v ? 180 : 0)) + "deg"); }
  function judge() {
    const ones = pref.filter(Boolean).length, v = ones >= 3 ? 1 : ones <= 1 ? 0 : -1;
    els.forEach((c, i) => c.classList.toggle("sure", v >= 0 && pref[i] === v));
    if (v >= 0) {
      done = true;
      st.innerHTML = T2(`Round ${round}: three or more favour ${v ? "attack" : "hold"}. Every mercenary is sure, and <span class="g">the whole camp commits to ${v ? "attack" : "hold"}</span>.`, `Round ${round}: a strict majority for ${v}. Every process proposes ${v} and <span class="g">decides ${v}</span>.`);
      go.innerHTML = T2("Another night", "New trial");
    } else {
      st.innerHTML = round === 1 ? T2("Round 1: two favour hold, two favour attack. <b>Nobody is sure.</b>", "Round 1: a 2–2 split. <b>No proposal anywhere.</b>")
        : T2(`Round ${round}: two against two again. <b>Nobody is sure</b>; toss again.`, `Round ${round}: 2–2 again. <b>No proposal</b>; flip again.`);
      go.innerHTML = T2("Toss", "Flip");
    }
  }
  function toss() {
    if (rolling) return;
    if (done) { done = false; round = 1; els.forEach(c => c.classList.remove("sure")); [0, 1, 0, 1].forEach((v, i) => set(i, v, true)); setTimeout(judge, reduce ? 0 : 900); return; }
    rolling = true; round++;
    pref.forEach((_, i) => set(i, rnd(2), true));
    st.innerHTML = T2("Every mercenary tosses…", "Every process flips…");
    setTimeout(() => { rolling = false; judge(); }, reduce ? 0 : 1450);
  }
  go.addEventListener("click", toss);
  many.addEventListener("click", () => {
    const cnt = {}, T = 1000; let max = 0, sum = 0;
    for (let n = 0; n < T; n++) {
      let k = 0;
      for (;;) { k++; let a = 0; for (let j = 0; j < 4; j++) a += rnd(2); if (a !== 2) break; }
      cnt[k] = (cnt[k] || 0) + 1; max = Math.max(max, k); sum += k;
    }
    const rows = [1, 2, 3, 4].map(k => [String(k), cnt[k] || 0]);
    let rest = 0; for (const k in cnt) if (+k > 4) rest += cnt[k];
    rows.push(["5+", rest]);
    const top = Math.max(...rows.map(r => r[1]));
    hist.innerHTML = rows.map(([k, v]) => `<span>${T2(k === "1" ? "1 toss" : k + " tosses", k === "1" ? "1 flip" : k + " flips")}</span><div class="bar2" style="width:${Math.max(2, 100 * v / top)}%"></div><span>${(100 * v / T).toFixed(1)}%</span>`).join("")
      + `<p class="hcap">${T2(`Every one of the thousand nights committed. Most needed a single toss; the longest needed ${WORD[max] || max}.`, `All 1,000 trials terminated: mean ${(sum / T).toFixed(2)} flips, longest ${max}. Each flip ends the split with probability 10/16.`)}</p>`;
  });
  pref.forEach((v, i) => set(i, v, false));
  judge();
})();

/* ====================================================================== ANSWER, OR ANSWER AS ONE */
(function capSwitches() {
  const svg = $("#capSvg"); if (!svg) return;
  const cut = $("#capCut"), av = $("#capAvail"), co = $("#capCons"), st = $("#capStatus");
  const TENTS = [["1", "#e0b84a", 225], ["2", "#6583d6", 135], ["3", "#c45448", 315], ["4", "#9cb648", 45]];
  const P = (deg, r) => [r * Math.cos(deg * Math.PI / 180), r * Math.sin(deg * Math.PI / 180)];
  const lines = sv("g", {}, svg), nodes = sv("g", {}, svg), extra = sv("g", {}, svg);
  const pos = TENTS.map(t => P(t[2], 82));
  const L = {};
  for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) L[a + "" + b] = sv("line", { x1: pos[a][0], y1: pos[a][1], x2: pos[b][0], y2: pos[b][1], class: "fig-line" }, lines);
  const plan = [];
  TENTS.forEach((t, i) => {
    const g = sv("g", { class: "fig-node", transform: `translate(${pos[i][0]} ${pos[i][1]})` }, nodes);
    sv("rect", { x: -22, y: -16, width: 44, height: 32, rx: 8, fill: t[1] }, g);
    const tx = sv("text", { y: 0 }, g); tx.textContent = (isM() ? "p" + sub(i + 1) : "T" + t[0]);
    const pc = sv("g", { transform: "translate(0 32)" }, g);
    sv("circle", { r: 12, fill: "#bf4a26", stroke: "#1d1d1f", "stroke-width": 2 }, pc);
    const pt = sv("text", { y: 0, fill: "#fff", style: "fill:#fff;font-size:12px" }, pc);
    plan.push({ tx, pc, pt, c: pc.querySelector("circle") });
  });
  const hawk = sv("path", { d: "M-14,0 Q-7,-11 0,0 Q7,-11 14,0", fill: "none", stroke: "#1d1d1f", "stroke-width": 3, "stroke-linecap": "round", transform: "translate(70 -6)" }, extra);
  const hawk2 = sv("path", { d: "M-12,0 Q-6,-9 0,0 Q6,-9 12,0", fill: "none", stroke: "#1d1d1f", "stroke-width": 2.6, "stroke-linecap": "round", transform: "translate(-4 64)" }, extra);
  let flash = 0;
  function paint(msg) {
    const c = cut.checked, A = av.checked, K = co.checked;
    ["03", "13", "23"].forEach(k => { L[k].setAttribute("stroke-dasharray", c ? "5 5" : ""); L[k].style.stroke = c ? "#bf4a26" : ""; L[k].style.opacity = c ? .5 : 1; });
    hawk.style.display = hawk2.style.display = c ? "" : "none";
    const lbl = (v, col) => ({ v, col });
    const four = !c ? lbl(isM() ? "1" : "A", "#bf4a26") : A && !K ? lbl(isM() ? "0" : "H", "#136f9e") : K && !A ? lbl("⧗", "#8e8e93") : lbl("–", "#c7c7cc");
    plan.forEach((p, i) => {
      p.tx.textContent = isM() ? "p" + sub(i + 1) : "T" + (i + 1);
      const f = i === 3 ? four : lbl(isM() ? "1" : "A", "#bf4a26");
      p.pt.textContent = f.v; p.c.setAttribute("fill", f.col);
    });
    if (msg) { st.innerHTML = msg; return; }
    st.innerHTML = !c ? (A && K ? T2("The birds get through: <span class=\"g\">tent 4 answers every question, and answers as one.</span>", "No partition: <span class=\"g\">available and linearizable.</span>") : T2("The birds get through, so tent 4 could have both. Turn both on.", "No partition: both are possible. Turn both on."))
      : A && !K ? T2("Tent 4 answers from what it last heard: <b>hold, though the plan has moved to attack.</b>", "Answering locally: available, <b>not consistent</b>; the read returns 0 after write(1).")
      : K && !A ? T2("A muster-master keeps the camp as one and <b>leaves the cut-off mercenary waiting.</b>", "A single primary: consistent, <b>not available</b>; the request never returns.")
      : T2("Tent 4 neither answers nor keeps the camp as one.", "Neither available nor consistent.");
  }
  const conflict = T2("<b>Not while cut off.</b> Tent 4 cannot tell a night when the plan was moved from one when it was not.", "<b>Not under partition.</b> The replica cannot tell a run with a completed write from one without.");
  function shake(input) { const l = input.closest(".sw"); l.classList.remove("shake"); void l.offsetWidth; l.classList.add("shake"); }
  av.addEventListener("change", () => { if (av.checked && cut.checked && co.checked) { co.checked = false; shake(co); clearTimeout(flash); paint(conflict); flash = setTimeout(() => paint(), 2600); } else paint(); });
  co.addEventListener("change", () => { if (co.checked && cut.checked && av.checked) { av.checked = false; shake(av); clearTimeout(flash); paint(conflict); flash = setTimeout(() => paint(), 2600); } else paint(); });
  cut.addEventListener("change", () => { if (cut.checked && av.checked && co.checked) { av.checked = false; shake(av); } paint(); });
  onReg.push(() => paint());
  paint();
})();

/* ====================================================================== TWO MAJORITIES */
(function majorities() {
  const svg = $("#majSvg"); if (!svg) return;
  const st = $("#majStatus"), cnt = $("#majCount");
  const PR = [["Α", "#e0b84a"], ["Β", "#5b9be0"], ["Γ", "#e2564e"], ["Δ", "#9cb648"], ["Ε", "#b58be0"]];
  const pos = PR.map((_, i) => { const a = (-90 + 72 * i) * Math.PI / 180; return [92 * Math.cos(a), 92 * Math.sin(a)]; });
  const hullB = sv("path", { class: "hullB" }, svg), hullA = sv("path", { class: "hullA" }, svg);
  const legs = PR.map((p, i) => {
    const g = sv("g", { class: "leg fig-node", transform: `translate(${pos[i][0]} ${pos[i][1]})` }, svg);
    sv("circle", { class: "glow", r: 26 }, g);
    sv("circle", { r: 21, fill: p[1] }, g);
    const t = sv("text", { style: "font-size:17px" }, g);
    return { g, t };
  });
  const name = i => isM() ? "p" + sub(i + 1) : PR[i][0];
  function label() { legs.forEach((l, i) => { l.t.textContent = name(i); }); }
  /* a closed loop round the chosen places, pushed out from their centre */
  function hull(set, pad) {
    const pts = set.map(i => pos[i]), cxy = [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
    const ord = set.slice().sort((a, b) => Math.atan2(pos[a][1], pos[a][0]) - Math.atan2(pos[b][1], pos[b][0]));
    const out = ord.map(i => { const p = pos[i], d = Math.hypot(p[0] - cxy[0], p[1] - cxy[1]) || 1; return [p[0] + (p[0] - cxy[0]) / d * pad, p[1] + (p[1] - cxy[1]) / d * pad]; });
    return "M" + out.map(p => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" L") + " Z";
  }
  const MAJ = []; for (let m = 0; m < 32; m++) { const s = [0, 1, 2, 3, 4].filter(i => m >> i & 1); if (s.length >= 3) MAJ.push(s); }
  let tried = 0, A = [0, 1, 2], B = [2, 3, 4];
  function show(a, b) {
    A = a; B = b;
    hullA.setAttribute("d", hull(a, 34)); hullB.setAttribute("d", hull(b, 44));
    const both = a.filter(i => b.includes(i));
    legs.forEach((l, i) => l.g.classList.toggle("both", both.includes(i)));
    const names = both.map(name), list = names.length === 1 ? names[0] : names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
    st.innerHTML = T2(`<span class="g">${list}</span> ${both.length === 1 ? "sits" : "sit"} in both majorities.`, `Shared: <span class="g">${list}</span>.`);
    cnt.innerHTML = tried ? T2(`${tried} ${tried === 1 ? "pair" : "pairs"} tried · pairs with no one in common: 0`, `${tried} sampled · disjoint pairs: 0`) : T2("Blue is one majority, red the other.", "Blue: quorum one. Red: quorum two.");
  }
  $("#majGo").addEventListener("click", () => { tried++; show(MAJ[rnd(MAJ.length)], MAJ[rnd(MAJ.length)]); });
  $("#majAll").addEventListener("click", () => {
    let k = 0, disjoint = 0;
    for (const a of MAJ) for (const b of MAJ) { k++; if (!a.some(i => b.includes(i))) disjoint++; }
    const run = (n) => { if (n <= 0 || reduce) { show([0, 1, 2], [2, 3, 4]); cnt.innerHTML = T2(`All ${k} pairs of majorities checked: <b>${disjoint}</b> share no one.`, `All ${k} ordered pairs of majorities: <b>${disjoint}</b> disjoint.`); return; } show(MAJ[rnd(MAJ.length)], MAJ[rnd(MAJ.length)]); setTimeout(() => run(n - 1), 120); };
    tried = 0; run(14);
  });
  label(); show(A, B);
  onReg.push(() => { label(); show(A, B); });
})();

/* ====================================================================== THE PRICE OF A LIAR */
(function liarsCount() {
  const seg = $("#liarSeg"); if (!seg) return;
  const num = $("#liarNum"), men = $("#liarMen"), seals = $("#liarSeals"), note = $("#liarNote");
  let f = 1;
  const cap = s => s[0].toUpperCase() + s.slice(1);
  function paint() {
    $$("button", seg).forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.f === f)));
    const n = 3 * f + 1;
    if (!seals.checked) {
      num.innerHTML = T2(`${cap(WORD[n])} bandits<small>to bear ${WORD[f]} ${f === 1 ? "liar" : "liars"}. ${cap(WORD[n - 1])} cannot.</small>`, `n ≥ ${n}<small>for m = ${f}: n ≥ 3m + 1, with oral messages</small>`);
      men.innerHTML = Array.from({ length: n }, (_, i) => `<i class="${i < f ? "liar" : ""}" style="animation-delay:${i * 40}ms"></i>`).join("");
      note.innerHTML = T2("Relay every order and take the greater count. An honest guard cannot tell a lying chief from a lying peer, so the liars must be fewer than a third of the posts.", "OM(m): m + 1 rounds of relaying and majority vote. A loyal lieutenant cannot tell a faulty commander from a faulty peer.");
    } else {
      num.innerHTML = T2(`Any number<small>of liars, with seal rings, while time can be kept</small>`, `Any number<small>of traitors: SM(m), in synchronous rounds</small>`);
      men.innerHTML = Array.from({ length: f + 2 }, (_, i) => `<i class="${i < f ? "liar" : ""}" style="animation-delay:${i * 40}ms"></i>`).join("") + `<i class="more">${T2("and any more", "any n")}</i>`;
      note.innerHTML = T2("A forged order is impossible, so a liar can only send different sealed orders, and those expose the liar. <b>In the wind, it takes four to bear one liar, sealed or not.</b>", "Signatures stop relayed orders being altered. <b>Under partial synchrony, n ≥ 3t + 1, signed or not.</b>");
    }
  }
  $$("button", seg).forEach(b => b.addEventListener("click", () => { f = +b.dataset.f; paint(); }));
  seals.addEventListener("change", paint);
  paint();
})();

/* ====================================================================== BUNDLES */
(function bundles() {
  const svg = $("#bunSvg"); if (!svg) return;
  const wrap = $(".bundle"), seg = $("#bunSeg"), flip = $("#bunFlip"), A = $("#bunA"), B = $("#bunB");
  let n = 4, mode = "all";
  const gAll = sv("g", {}, svg), gStar = sv("g", {}, svg), gNode = sv("g", {}, svg);
  const COL = ["#a57fc0", "#9aa0a8", "#e8964d", "#b07a55"];
  function count(el, to) {
    const from = +el.textContent || 0, t0 = performance.now(), d = reduce ? 0 : 600;
    const fr = now => { const u = d ? Math.min(1, (now - t0) / d) : 1; el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - u, 3))); if (u < 1) requestAnimationFrame(fr); };
    requestAnimationFrame(fr);
  }
  function draw() {
    gAll.innerHTML = gStar.innerHTML = gNode.innerHTML = "";
    const pos = Array.from({ length: n }, (_, i) => { const a = (-90 + 360 * i / n) * Math.PI / 180; return [100 * Math.cos(a), 100 * Math.sin(a)]; });
    for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) sv("line", { class: "bun-e", x1: pos[a][0], y1: pos[a][1], x2: pos[b][0], y2: pos[b][1] }, gAll);
    for (let a = 1; a < n; a++) sv("line", { class: "bun-s", x1: pos[a][0], y1: pos[a][1], x2: pos[0][0], y2: pos[0][1] }, gStar);
    pos.forEach((p, i) => {
      const c = sv("circle", { class: "bun-n" + (i ? "" : " reg"), cx: p[0], cy: p[1], r: n > 10 ? 8 : 11 }, gNode);
      if (n === 4 && i) c.style.fill = COL[i];
    });
    const k = sv("rect", { class: "bun-k", x: -9, y: -9, width: 18, height: 18, rx: 3, transform: `translate(${pos[0][0]} ${pos[0][1] - 24}) rotate(45)` }, gNode);
    k.style.opacity = mode === "star" ? 1 : 0;
    const lb = sv("text", { x: pos[0][0] + 18, y: pos[0][1] + 4, "text-anchor": "start", style: "font:600 12px var(--sans);fill:#f5f5f7" }, gNode);
    lb.textContent = isM() ? "leader" : "writer";
    paint();
  }
  function paint() {
    wrap.dataset.mode = mode;
    gAll.style.opacity = mode === "all" ? 1 : .07; gStar.style.opacity = mode === "star" ? 1 : 0;
    const k = $(".bun-k", gNode); if (k) k.style.opacity = mode === "star" ? 1 : 0;
    $$("button", seg).forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.n === n)));
    count(A, n * (n - 1)); count(B, 2 * (n - 1));
    flip.innerHTML = mode === "all" ? T2("Tie the bundles", "Aggregate") : T2("Every legislator to every other", "All-to-all");
  }
  $$("button", seg).forEach(b => b.addEventListener("click", () => { n = +b.dataset.n; draw(); }));
  flip.addEventListener("click", () => { mode = mode === "all" ? "star" : "all"; paint(); });
  onReg.push(draw);
  draw();
  whenSeen(svg, () => setTimeout(() => { if (mode === "all") { mode = "star"; paint(); } }, 1600), .5);
})();

/* ====================================================================== WORD OF MOUTH, ON A WHOLE COAST */
(function gossip() {
  const cv = $("#gosCanvas"); if (!cv) return;
  const cx = cv.getContext("2d"), N = 400, G = 20, go = $("#gosGo"), fest = $("#gosFest"), st = $("#gosStatus");
  const eH = $("#gosHeard"), eL = $("#gosLeft"), eS = $("#gosSent");
  /* 0 unheard · 1 telling · 2 heard, quiet · 3 reached at the festival */
  let S = new Uint8Array(N), flashAt = new Float64Array(N), sent = 0, timer = 0, phase = "idle", firstLeft = 0, rounds = 0, lastM = 0;
  function size() { const d = Math.min(2, devicePixelRatio || 1); cv.width = 600 * d; cv.height = 600 * d; cx.setTransform(d, 0, 0, d, 0, 0); }
  function paint(now) {
    cx.clearRect(0, 0, 600, 600);
    const c = 30, r = 9.5;
    for (let i = 0; i < N; i++) {
      const x = (i % G) * c + c / 2, y = Math.floor(i / G) * c + c / 2, s = S[i];
      const age = (now - flashAt[i]) / 500;
      cx.beginPath(); cx.arc(x, y, r + (age < 1 ? 4 * (1 - age) : 0), 0, 7);
      cx.fillStyle = s === 1 ? "#0a6fc2" : s === 2 ? "#8cc0e6" : s === 3 ? "#e0b84a" : (phase === "after" || phase === "fest") ? "#ef6a3f" : "#d1d1d6";
      cx.fill();
    }
  }
  function stats() {
    let heard = 0; for (let i = 0; i < N; i++) if (S[i]) heard++;
    eH.textContent = heard; eL.textContent = N - heard; eS.textContent = sent;
    return N - heard;
  }
  let raf = 0;
  function kick() { if (!raf) raf = requestAnimationFrame(function l(now) { paint(now); raf = (phase === "rumour" || phase === "fest") ? requestAnimationFrame(l) : 0; if (!raf) setTimeout(() => paint(performance.now() + 1000), 520); }); }
  function rumourStep() {
    const now = performance.now(), act = [];
    for (let i = 0; i < N; i++) if (S[i] === 1) act.push(i);
    if (!act.length) {
      phase = "after"; firstLeft = stats(); lastM = sent / N; fest.disabled = firstLeft === 0; go.disabled = false;
      const pct = (100 * firstLeft / N).toFixed(1);
      st.innerHTML = T2(`The rumour has died out with <b>${firstLeft} of ${N} unheard</b> (${pct}%). The festival catches the rest.`, `Rumor over: residue <b>${firstLeft}/${N}</b> (${pct}%) after ${lastM.toFixed(2)} messages per site; e<sup>−m</sup> = ${(100 * Math.exp(-lastM)).toFixed(1)}%.`);
      kick(); return;
    }
    for (const i of act) {
      let j = rnd(N - 1); if (j >= i) j++;
      sent++;
      if (S[j] === 0) { S[j] = 1; flashAt[j] = now; }
      else if (Math.random() < .5) S[i] = 2;
    }
    stats(); timer = setTimeout(rumourStep, reduce ? 0 : 150);
  }
  function start() {
    clearTimeout(timer); S = new Uint8Array(N); flashAt = new Float64Array(N); sent = 0; rounds = 0;
    const s0 = rnd(N); S[s0] = 1; flashAt[s0] = performance.now();
    phase = "rumour"; go.disabled = true; fest.disabled = true;
    st.innerHTML = T2("Scholars pass the news on, each to one library drawn at random…", "Infective sites push to random partners…");
    stats(); kick(); rumourStep();
  }
  function festival() {
    if (phase !== "after") return;
    phase = "fest"; fest.disabled = true; go.disabled = true; rounds = 0; kick();
    const roundStep = () => {
      rounds++;
      const now = performance.now(), had = S.map(v => v ? 1 : 0);
      for (let i = 0; i < N; i++) { let j = rnd(N - 1); if (j >= i) j++; sent++; if (had[i] && !S[j]) { S[j] = 3; flashAt[j] = now; } if (had[j] && !S[i]) { S[i] = 3; flashAt[i] = now; } }
      const left = stats();
      if (left > 0) { st.innerHTML = T2(`Festival round ${rounds}: ${left} still unheard.`, `Anti-entropy round ${rounds}: ${left} susceptible.`); timer = setTimeout(roundStep, reduce ? 0 : 650); }
      else { phase = "done"; go.disabled = false; go.innerHTML = T2("Spread another version", "Run again"); st.innerHTML = T2(`After ${WORD[rounds] || rounds} festival ${rounds === 1 ? "round" : "rounds"}, <span class="g">every library has the new version.</span>`, `<span class="g">Anti-entropy reached every site</span> in ${rounds} ${rounds === 1 ? "round" : "rounds"}.`); kick(); }
    };
    roundStep();
  }
  go.addEventListener("click", start); fest.addEventListener("click", festival);
  size(); stats(); paint(performance.now());
  st.innerHTML = T2("One library has a new version.", "One site holds an update.");
  whenSeen(cv, () => { if (phase === "idle") setTimeout(start, 500); }, .5);
})();

/* ====================================================================== HOW MANY TO WRITE, HOW MANY TO ASK */
(function quorum() {
  const libs = $("#qLibs"); if (!libs) return;
  const st = $("#qStatus"), segW = $("#qW"), segR = $("#qR");
  let W = 2, Rr = 1;
  libs.innerHTML = [0, 1, 2].map(i => `<div class="lib"><div class="ln">${T2("Library " + (i + 1), "Replica " + (i + 1))}</div><div class="ed"></div><div class="tags"></div></div>`).join("");
  const L = $$(".lib", libs);
  function paint() {
    $$("button", segW).forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.v === W)));
    $$("button", segR).forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.v === Rr)));
    L.forEach((el, i) => {
      const w = i < W, r = i >= 3 - Rr;
      el.classList.toggle("w", w); el.classList.toggle("r", r); el.classList.toggle("hit", w && r);
      $(".ed", el).innerHTML = w ? T2("new", "v2") : T2("old", "v1");
      $(".tags", el).innerHTML = (w ? `<span class="tw">${T2("holds the new version", "in W")}</span>` : "") + (r ? `<span class="tr">${T2("asked by the reader", "in R")}</span>` : "");
    });
    const ok = W + Rr > 3;
    st.innerHTML = ok ? T2(`${WORD[W][0].toUpperCase() + WORD[W].slice(1)} and ${WORD[Rr]}: more than three. The groups must share a library, so <span class="g">the reader gets the newest version.</span>`, `R + W = ${W + Rr} &gt; N = 3: the quorums intersect, so <span class="g">every read is fresh.</span>`)
      : T2(`${WORD[W][0].toUpperCase() + WORD[W].slice(1)} and ${WORD[Rr]}: not more than three. The groups can miss each other, and <b>the reader may get an old copy</b>, though the odds fall with every moment after the announcement.${W === 1 && Rr === 1 ? " Many choose this, for speed." : ""}`, `R + W = ${W + Rr} ≤ N = 3: partial quorums; <b>a read may be stale</b>, and PBS gives the odds.`);
  }
  $$("button", segW).forEach(b => b.addEventListener("click", () => { W = +b.dataset.v; paint(); }));
  $$("button", segR).forEach(b => b.addEventListener("click", () => { Rr = +b.dataset.v; paint(); }));
  paint();
})();

/* ====================================================================== THE PEBBLE BOARDS */
(function pebbles() {
  const box = $("#merge"); if (!box) return;
  const st = $("#mergeStatus"), COL = ["#d9a441", "#7fa34a", "#c8735a"];
  let T = [[2, 0, 0], [0, 1, 0], [0, 0, 2]], merges = 0;
  box.innerHTML = [0, 1, 2].map(t => `<div class="tbl"><div class="tn">${T2("Library " + (t + 1), "Replica " + (t + 1))}</div><div class="cols">${[0, 1, 2].map(s => `<div class="pcol${s === t ? " own" : ""}" style="--c:${COL[s]}"></div>`).join("")}</div><div class="tot"></div><button type="button">${T2("+ a sighting", "increment")}</button></div>`).join("");
  const tbls = $$(".tbl", box);
  tbls.forEach((el, t) => $("button", el).addEventListener("click", () => { T[t][t]++; paint(); }));
  function paint(flash) {
    tbls.forEach((el, t) => {
      $$(".pcol", el).forEach((c, s) => {
        const have = c.children.length, want = T[t][s];
        for (let k = have; k < want; k++) { const i = document.createElement("i"); i.style.animationDelay = (k - have) * 60 + "ms"; c.appendChild(i); }
        while (c.children.length > want) c.lastChild.remove();
      });
      const sum = T[t].reduce((a, b) => a + b, 0);
      $(".tot", el).innerHTML = sum + `<small>${T2(sum === 1 ? "sighting" : "sightings", "value")}</small>`;
      el.classList.toggle("flash", !!flash && flash.includes(t));
    });
    if (flash) setTimeout(() => tbls.forEach(el => el.classList.remove("flash")), 700);
    const J = [0, 1, 2].map(s => Math.max(T[0][s], T[1][s], T[2][s]));
    const up = [0, 1, 2].filter(t => T[t].every((v, s) => v === J[s])), lag = [0, 1, 2].filter(t => !up.includes(t));
    const names = a => a.map(t => t + 1).join(a.length === 2 ? " and " : ", ");
    const total = J.reduce((a, b) => a + b, 0);
    st.innerHTML = !lag.length ? T2(`All three libraries agree: <span class="g">${total} ${total === 1 ? "sighting" : "sightings"}</span>${merges ? `, after ${merges} ${merges === 1 ? "merge" : "merges"} in the order you chose` : ""}.`, `Converged: <span class="g">value ${total} on every replica</span>${merges ? ` after ${merges} merges, in your order` : ""}.`)
      : T2(`Up to date: ${up.length ? "library" + (up.length > 1 ? "s " : " ") + names(up) : "none yet"}. <b>Still to meet the news: librar${lag.length > 1 ? "ies" : "y"} ${names(lag)}.</b>`, `At the join: ${up.length ? names(up) : "none"}. <b>Behind: ${names(lag)}.</b>`);
  }
  $$(".merge-btns button").forEach(b => b.addEventListener("click", () => {
    const [a, c] = b.dataset.m.split(",").map(Number);
    for (let s = 0; s < 3; s++) { const m = Math.max(T[a][s], T[c][s]); T[a][s] = T[c][s] = m; }
    merges++; paint([a, c]);
  }));
  paint();
})();

/* ====================================================================== THE TWO DOORS */
(function doors() {
  const box = $("#doors"); if (!box) return;
  const pile = $(".pile", box), slots = { south: $(".south .slot", box), north: $(".north .slot", box) };
  const qs = $$(".q", box);
  function move(el, to) {
    const a = el.getBoundingClientRect(); to.appendChild(el); const b = el.getBoundingClientRect();
    if (reduce || !el.animate) return;
    el.animate([{ transform: `translate(${a.left - b.left}px,${a.top - b.top}px) scale(1.04)` }, { transform: "none" }], { duration: 700, easing: "cubic-bezier(.2,.7,.2,1)" });
  }
  let timers = [];
  function sort() {
    timers.forEach(clearTimeout); timers = [];
    qs.forEach(q => move(q, pile));
    qs.forEach((q, i) => timers.push(setTimeout(() => move(q, slots[q.dataset.door]), 500 + i * 420)));
  }
  qs.forEach(q => q.addEventListener("click", () => { if (q.parentElement === pile) move(q, slots[q.dataset.door]); }));
  $("#doorsGo").addEventListener("click", sort);
  whenSeen(box, sort, .3);
})();

/* ====================================================================== THE FAMILY, AND ITS THREADS */
const treeFrame = (function family() {
  const svg = $("#tree"), sec = $("#threads"); if (!svg) return () => {};
  const cap = $("#famCap"), cards = $$(".tcard", sec);
  /* each book, the book it grows from, and the names the threads use for it */
  const B = {
    owc: ["ordering-without-clocks", "Without Clocks", "Logical clocks", null],
    mc: ["many-copies-acting-as-one", "Many Copies", "Linearizability", "owc"],
    ts: ["taking-stock-without-stopping", "Taking Stock", "Snapshots", "owc"],
    flp: ["the-limits-of-agreement", "The Limits", "FLP", "owc"],
    dls: ["agreeing-when-messages-run-late", "Running Late", "Partial synchrony", "flp"],
    bo: ["agreeing-by-chance", "By Chance", "Ben-Or", "flp"],
    ct: ["telling-the-absent-from-the-slow", "Absent or Slow", "Failure detectors", "dls"],
    cap: ["answering-while-cut-off", "Cut Off", "CAP", "mc"],
    bgp: ["agreeing-among-liars", "Among Liars", "Byzantine generals", "flp"],
    ptp: ["the-part-time-parliament", "Parliament", "Paxos", "dls"],
    vr: ["one-writer-at-a-time", "One Writer", "Viewstamped", "ptp"],
    pbft: ["keeping-order-among-liars", "Keeping Order", "PBFT", "vr"],
    hs: ["changing-leaders-among-liars", "Changing Leaders", "HotStuff", "pbft"],
    gos: ["spreading-by-word-of-mouth", "Word of Mouth", "Epidemics", "cap"],
    pbs: ["probably-up-to-date", "Up to Date", "PBS", "gos"],
    crdt: ["changes-that-never-clash", "Never Clash", "CRDTs", "gos"],
    hat: ["what-you-can-promise-alone", "Promise Alone", "HATs", "cap"],
    calm: ["knowing-when-to-wait", "When to Wait", "CALM", "crdt"]
  };
  const KIDS = { owc: ["ts", "mc", "flp"], mc: ["cap"], cap: ["hat", "gos"], gos: ["pbs", "crdt"], crdt: ["calm"], flp: ["bo", "dls", "bgp"], dls: ["ct", "ptp"], ptp: ["vr"], vr: ["pbft"], pbft: ["hs"] };
  const order = [], depth = { owc: 0 };
  (function walk(k) { (KIDS[k] || []).forEach(c => { depth[c] = depth[k] + 1; order.push(c); walk(c); }); })("owc");
  /* angle (0 is east, clockwise), distance from the centre, and the side the name sits on */
  const LAY = {
    owc: [0, 0, "t"], ts: [-105, 90, "t"], mc: [-45, 90, "r"], cap: [-15, 140, "b"], hat: [-50, 215, "r"], pbs: [-25, 245, "r"],
    gos: [12, 190, "r"], crdt: [35, 235, "r"], calm: [60, 250, "r"],
    flp: [135, 90, "l"], bo: [100, 160, "b"], bgp: [190, 140, "l"], dls: [145, 170, "l"], ct: [120, 240, "l"],
    ptp: [165, 225, "l"], vr: [200, 240, "l"], pbft: [230, 240, "l"], hs: [255, 245, "t"]
  };
  const ang = {}, rr = {}, side = {};
  Object.keys(LAY).forEach(k => { ang[k] = LAY[k][0]; rr[k] = LAY[k][1]; side[k] = LAY[k][2]; });
  const P = (a, r) => [r * Math.cos(a * Math.PI / 180), r * Math.sin(a * Math.PI / 180)];
  /* the books' own names for each change, read from the walk */
  const change = k => { const e = $("#e-" + k + " .eq-change"); return e ? [$(".i", e).textContent, $(".m", e).textContent] : ["", ""]; };
  const title = k => { const c = $("#s-" + k + " .title"); return c ? c.textContent : B[k][1]; };
  sv("circle", { class: "rim", r: 262 }, svg);
  const gE = sv("g", {}, svg), gN = sv("g", {}, svg), edges = {}, nodes = {};
  order.forEach(k => {
    const p = B[k][3], a0 = ang[p], r0 = rr[p], a1 = ang[k], r1 = rr[k], pts = [];
    const from = p === "owc" ? a1 : a0;
    let d = a1 - from; d = ((d + 540) % 360) - 180;
    for (let s = 0; s <= 24; s++) { const q = s / 24; pts.push(P(from + d * q, r0 + (r1 - r0) * q)); }
    const path = sv("path", { class: "tedge", d: "M" + pts.map(q => q[0].toFixed(1) + "," + q[1].toFixed(1)).join(" L") }, gE);
    edges[k] = path;
  });
  Object.keys(B).forEach(k => {
    const a = sv("a", { href: "../" + B[k][0] + "/index.html", class: "tnode" + (k === "owc" ? " root" : "") }, gN);
    const [x, y] = P(ang[k], rr[k]);
    sv("circle", { cx: x, cy: y, r: k === "owc" ? 10 : 7 }, a);
    const sd = side[k], gap = k === "owc" ? 20 : 13;
    const tx = sd === "l" ? x - gap : sd === "r" ? x + gap : x, ty = sd === "t" ? y - gap - 4 : sd === "b" ? y + gap + 5 : y;
    const anchor = sd === "l" ? "end" : sd === "r" ? "start" : "middle";
    const ti = sv("text", { x: tx, y: ty, "text-anchor": anchor, class: "i" }, a); ti.textContent = B[k][1];
    const tm = sv("text", { x: tx, y: ty, "text-anchor": anchor, class: "m" }, a); tm.textContent = B[k][2];
    const tt = sv("title", {}, a); tt.textContent = title(k);
    nodes[k] = a;
    const tell = () => {
      if (!B[k][3]) { cap.innerHTML = T2(`<b>${title(k)}</b>: where the walk starts.`, `<b>${title(k)}</b>: the root.`); return; }
      const [ci, cm] = change(k);
      cap.innerHTML = `${title(B[k][3])}, ${T2("with one change", "with one change")}: <b>${T2(ci, cm)}</b> → ${title(k)}`;
    };
    a.addEventListener("mouseenter", tell); a.addEventListener("focus", tell);
  });
  /* the arcs draw themselves the first time the family comes into view */
  order.forEach(k => { const L = edges[k].getTotalLength ? edges[k].getTotalLength() : 200; edges[k].style.strokeDasharray = L; edges[k].style.strokeDashoffset = reduce ? 0 : L; });
  whenSeen(svg, () => order.forEach((k, i) => { const e = edges[k]; e.style.transition = "stroke-dashoffset .9s cubic-bezier(.2,.7,.2,1) " + (depth[k] * 220 + i * 25) + "ms, stroke .5s, opacity .5s"; e.style.strokeDashoffset = 0; }), .3);
  const THREAD = {
    t1: ["owc", "dls", "bo", "cap", "ptp", "vr", "pbft", "gos", "hat"], t2: ["mc", "cap", "ptp", "vr", "pbft", "pbs", "hat"],
    t3: ["flp", "dls", "bo", "ct", "ptp", "vr", "pbft", "hs", "pbs"], t4: ["dls", "ct", "bgp", "ptp", "vr", "pbft", "hs"],
    t5: ["flp", "dls", "bo", "ct", "ptp", "vr", "pbft", "hs"], t6: ["bgp", "dls", "pbft", "hs"], t7: ["bo", "gos", "pbs"],
    t8: ["ts", "gos", "crdt", "hat", "calm"], t9: ["ts", "bgp", "ptp", "pbft", "gos", "crdt", "calm"], t10: ["ts", "pbft", "crdt", "hat", "calm"]
  };
  let cur = null;
  function setThread(id) {
    if (id === cur) return; cur = id;
    const lit = THREAD[id] || [];
    svg.dataset.mode = lit.length ? "thread" : "all";
    Object.keys(nodes).forEach(k => nodes[k].classList.toggle("lit", lit.includes(k)));
    const c = cards.find(x => x.dataset.thread === id);
    cards.forEach(x => x.classList.toggle("on", x === c));
    if (lit.length) { const h = $("h3", c); cap.innerHTML = `${T2("Thread", "Technique")}: <b>${T2($(".i", h).textContent, $(".m", h).textContent)}</b> · ${T2(lit.length + " books", lit.length + " books")}`; }
    else cap.innerHTML = narrowQ.matches ? T2("Each red arc is one change. Tap a book to read it.", "Each red arc is one changed assumption. Tap a node to read its book.") : T2("Each red arc is one change. Point at a book to see which.", "Each red arc is one changed assumption. Point at a node to see it.");
  }
  setThread("all");
  return function () {
    const r = sec.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    const L = innerHeight * (narrowQ.matches ? .72 : .52);
    let act = cards[0];
    for (const c of cards) { if (c.getBoundingClientRect().top <= L) act = c; else break; }
    setThread(act.dataset.thread);
  };
})();

/* go */
if (R) R.scaleText();
frame();
setTimeout(frame, 200);
})();
