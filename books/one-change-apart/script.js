/* One Change Apart: the eighteen books on one round.
   The round is space and time drawn as the books draw it: each place is a spoke running outward, later and later;
   each dashed ring is one moment everywhere; each arc is a messenger, travelling round and outward as it goes.
   Every book's scene is the scene of the book it grows from with one change, drawn in red; a wall shows its
   two nights in turn; a thread lights its move in gold. The steps beside the round are plain HTML. */
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
  libs5:   [["L1", LIB, -90], ["L2", LIB, -18], ["L3", LIB, 54], ["L4", LIB, 126], ["L5", LIB, 198]],
  scribes: [["S1", "#d9c48e", -90], ["S2", "#b9c79a", 30], ["S3", "#d8b39c", 150]]
};
const SUB = "₀₁₂₃₄₅₆₇₈₉";
for (const k in CASTS) {
  const n = CASTS[k];
  CASTS[k] = { n, ang: {}, col: {} };
  n.forEach(d => { CASTS[k].ang[d[0]] = d[2]; CASTS[k].col[d[0]] = d[1]; });
}
let CA = CASTS.houses;
const A = n => CA.ang[n];
const P = (n, t) => pol(A(n), rad(t));

/* the points of an arc from place a at time ta to place b at time tb; the short way round unless dir says */
function arc(a, ta, b, tb, dir) {
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
const clip = el("clipPath", { id: "sweep" }, defs), clipC = el("circle", { cx: 0, cy: 0, r: 999 }, clip);
const frame = el("g", { class: "frame" }, svg);
el("circle", { class: "disc", r: rad(TEND) + 24 }, frame);
for (let i = 1; i <= RINGS; i++) el("circle", { class: "rg", r: rad(i) }, frame);
const marksG = el("g", { class: "marks" }, svg);
const LY = {}; ["u", "s", "e", "t"].forEach(k => { LY[k] = el("g", { class: "ly-" + k }, marksG); });
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
  const [x1, y1] = pol(s.a, R0), [x2, y2] = pol(s.a, rad(TEND));
  s.sp.setAttribute("x1", f(x1)); s.sp.setAttribute("y1", f(y1)); s.sp.setAttribute("x2", f(x2)); s.sp.setAttribute("y2", f(y2));
  s.nd.setAttribute("transform", `translate(${f(x1)} ${f(y1)})`);
  s.sp.style.opacity = s.op; s.nd.style.opacity = s.op;
}
let castAnim = 0;
function setCast(key, ms) {
  const c = CASTS[key], from = slots.map(s => ({ a: s.a, op: s.op }));
  const to = slots.map((s, i) => i < c.n.length ? { a: c.n[i][2], op: 1 } : { a: s.a, op: 0 });
  slots.forEach((s, i) => {
    if (i >= c.n.length) return;
    const d = c.n[i];
    s.rc.style.fill = d[1]; s.ti.textContent = d[3] || d[0]; s.tm.textContent = "p" + SUB[i + 1];
    if (from[i].op < .5) { from[i].a = to[i].a; s.a = to[i].a; }
  });
  const id = ++castAnim;
  const step = e => slots.forEach((s, i) => {
    const d = ((to[i].a - from[i].a + 540) % 360) - 180;
    s.a = from[i].a + d * e; s.op = from[i].op + (to[i].op - from[i].op) * e; place(s);
  });
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
  if (m.x != null) return [m.x, m.y];
  if (m.n) { const [x, y] = P(m.n, m.at); return [x + (m.dx || 0), y + (m.dy || 0)]; }
  const [x, y] = pol(m.deg, rad(m.at)); return [x + (m.dx || 0), y + (m.dy || 0)];
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
  ["i", "m"].forEach(reg => {
    const g = el("g", { class: "tg " + (cls || "") + " " + reg, transform: `translate(${f(x)} ${f(y)})` }, p), b = box[reg];
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
    for (let t = 0; t <= TEND; t += .18) pts.push(pol(d[2], rad(t)));
    const [x, y] = pol(d[2], R0); rects.push([x - 19, y - 14, x + 19, y + 14]);
  });
  list.forEach(m => {
    if (m.t === "sl") {
      const full = arc(m.a, m.ta, m.b, m.tb, m.dir), pp = m.lost ? full.slice(0, Math.round(full.length * m.lost)) : full;
      pp.forEach(q => pts.push(q));
      if (m.lab && !VAL[m.lab]) { const q = full[Math.round((full.length - 1) * (m.la || .5))], b = tagBox(m.lab, "sm"); rects.push([q[0] + (m.ldx || 0) - b.W / 2, q[1] + (m.ldy || 0) - b.H / 2, q[0] + (m.ldx || 0) + b.W / 2, q[1] + (m.ldy || 0) + b.H / 2]); }
    } else if (m.t === "ev" || m.t === "coin" || m.t === "bun") {
      const [x, y] = P(m.n, m.at), r = (m.r || (m.v || m.num != null || m.t !== "ev" ? 11 : 6)) + (m.ring ? 6 : 2); rects.push([x - r, y - r, x + r, y + r]);
    } else if (m.t === "slate") {
      const [x, y] = P(m.n, m.at), a = (A(m.n) + 90 * (m.side || 1)) * Math.PI / 180, cx = x + 32 * Math.cos(a), cy = y + 32 * Math.sin(a); rects.push([cx - 21, cy - 14, cx + 21, cy + 14]);
    } else if (m.t === "sp" || m.t === "obs") line(P(m.n, m.t1), P(m.n, m.t2), 8);
    else if (m.t === "x") { const [x, y] = P(m.n, m.at); rects.push([x - 9, y - 9, x + 9, y + 9]); }
    else if (m.t === "hawk") { const [x, y] = where(m); rects.push([x - 13, y - 9, x + 13, y + 3]); }
    else if (m.t === "halo") { const [x, y] = pol(A(m.n), R0); rects.push([x - 26, y - 19, x + 26, y + 19]); }
  });
  return { pts, rects };
}
function placeTag(m, box, ob, taken) {
  const [x0, y0] = where(m), W = box.W + 6, H = box.H + 4, lim = VB / 2 - 3;
  if (m.fix) return [x0, y0];
  let best = null;
  const hit = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
  for (const rr of [0, 7, 14, 22, 31, 41, 52, 64, 78]) {
    for (let k = 0; k < (rr ? 16 : 1); k++) {
      const a = k * Math.PI / 8, x = x0 + rr * Math.cos(a), y = y0 + rr * Math.sin(a), R = [x - W / 2, y - H / 2, x + W / 2, y + H / 2];
      let sc = rr * .35;
      if (R[0] < -lim || R[2] > lim || R[1] < -lim || R[3] > lim) sc += 5000;
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
  /* a messenger: from a at ta to b at tb; lost ones stop part-way at a cross, held ones are dashed */
  sl(m) {
    const g = wrap("s", tone(m) + " sl" + (m.held ? " held" : "") + (m.lost ? " lost" : ""));
    const full = arc(m.a, m.ta, m.b, m.tb, m.dir);
    let pts = full.slice();
    if (m.lost) pts = pts.slice(0, Math.max(2, Math.round(pts.length * m.lost)));
    else { const end = pts[pts.length - 1], trim = m.trim || 10; while (pts.length > 2 && Math.hypot(pts[pts.length - 1][0] - end[0], pts[pts.length - 1][1] - end[1]) < trim) pts.pop(); }
    const mk = m.lost ? "" : (m.c ? "r" : m.hl ? "g" : "b");
    el("path", Object.assign({ class: "ln", d: dpath(pts) }, mk ? { "marker-end": `url(#ar-${mk})` } : {}), g);
    if (m.lost) { const q = pts[pts.length - 1]; cross(g, q[0], q[1]); if (m.hawk) hawk(g, q[0] + m.hawk[0], q[1] + m.hawk[1]); }
    if (m.lab) {
      const q = full[Math.round((full.length - 1) * (m.la || .5))];
      if (VAL[m.lab]) token(g, q[0], q[1], m.lab, 9);
      else tagAt(g, q[0] + (m.ldx || 0), q[1] + (m.ldy || 0), m.lab, "sm" + (m.c || m.labc ? " red" : m.hl ? " gold" : ""));
    }
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
    el("line", { x1: f(x1), y1: f(y1), x2: f(x2), y2: f(y2), stroke: m.col || CA.col[m.n] }, g);
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
    const g = wrap("u", tone(m) + " wedge"), a = A(m.n), w = m.w || 26, r1 = rad(m.t1 || 0), r2 = rad(m.t2 || TEND) + 8, n = 24, pts = [];
    for (let i = 0; i <= n; i++) pts.push(pol(a - w + 2 * w * i / n, r2));
    for (let i = n; i >= 0; i--) pts.push(pol(a - w + 2 * w * i / n, r1));
    el("path", { d: dpath(pts) + " Z" }, g);
    return g;
  },
  /* a whole span of time, everywhere at once */
  band(m) {
    const g = wrap("u", tone(m) + " band " + (m.cls || "")), r1 = Math.max(R0, rad(m.t1)), r2 = rad(m.t2);
    const ring = r => `M${f(r)},0 A${f(r)},${f(r)} 0 1 0 ${f(-r)},0 A${f(r)},${f(r)} 0 1 0 ${f(r)},0 Z`;
    el("path", { d: ring(r2) + " " + ring(r1), "fill-rule": "evenodd" }, g);
    return g;
  },
  /* one moment everywhere */
  ring(m) {
    const g = wrap("u", tone(m) + " ring " + (m.cls || ""));
    el("circle", { r: f(rad(m.at)) }, g);
    return g;
  },
  /* a cut: the past of every place up to its own moment, shaded inside a loop */
  cut(m) {
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
    const g = wrap("u", tone(m) + " halo " + (m.cls || "")), [x, y] = pol(A(m.n), R0), s = m.cls === "q2" ? 6 : 0;
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
    const g = wrap("e", tone(m) + " slate"), [x, y] = P(m.n, m.at), a = (A(m.n) + 90 * (m.side || 1)) * Math.PI / 180;
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
/* a thread shown on one book's scene: some of its marks lit in gold, and a word or two */
function thread(id, base, o) {
  const p = SC[base], hl = new Set(o.hl || []), drop = new Set(o.drop || []);
  const marks = p.marks.filter(m => !drop.has(m.k) && !m.own).map(m => X(m, { c: 0, labc: 0, hl: hl.has(m.k) ? 1 : 0, base: hl.has(m.k) ? 0 : 1 }));
  (o.add || []).forEach((m, i) => marks.push(X({ hl: 1 }, m, { k: id + "." + (m.id || "a" + i) })));
  SC[id] = { id, cast: p.cast, marks };
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
  { t: "sp", n: "H2", t1: 3.7, t2: 4.45, c: 1, id: "q2" }, { t: "sp", n: "H3", t1: 4.75, t2: 5.35, c: 1, id: "q3" },
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
  tg(on("T4", 1.6, 64, 18), V("dead, or a slow bird?", "crashed, or slow?"), { c: 1, own: 1, id: "t1" }),
  tg([0, 236], V("nobody ever commits", "no process decides"), { c: 1, own: 1, id: "t2" })
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

/* Telling the Dead from the Slow: a slate in each tent instead of the wind */
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

/* One Leader at a Time: a podium; a line passes on the holder and two benches; a silent podium is replaced */
def("vr", "tholos", [
  { t: "halo", n: "O", cls: "gold", c: 1, id: "pod" },
  { t: "gap", n: "Th", t1: .5, t2: 3.3, id: "away" },
  sl("O", .7, "L", 1.4, { c: 1, id: "o1" }), sl("O", .7, "K", 1.7, { c: 1, id: "o2" }), sl("O", .7, "M", 1.7, { c: 1, id: "o3" }),
  sl("L", 1.6, "O", 2.3, { id: "r1" }), sl("K", 1.9, "O", 2.6, { id: "r2" }),
  ev("O", 2.6, { num: "✓", big: 1, id: "pass" }),
  { t: "x", n: "O", at: 3.45, id: "sil" },
  sl("Th", 3.6, "L", 4.4, { dir: 1, lab: V("board 7?", "view 7?"), la: .26, id: "n1" }), sl("Th", 3.6, "M", 4.2, { id: "n2" }),
  sl("L", 4.55, "Th", 5.35, { dir: -1, lab: V("board 6, line 12", "viewstamp 6.12"), la: .3, id: "n3" }), sl("M", 4.4, "Th", 5.0, { id: "n4" }),
  ev("L", 5.8, { num: "", fill: "#e0b84a", big: 1, ring: 1, id: "newp" }),
  tg(on("O", 1.2, -100, -20), V("only the podium writes", "only the primary orders"), { c: 1, own: 1, id: "t1" }),
  tg(on("L", 5.8, 10, 34), V("the latest takes the podium", "highest viewstamp: primary"), { own: 1, id: "t2" })
]);

/* Keeping Order Among Liars: the registrar may lie, and an entry stands only on three seals of four */
def("pbft", "b4", [
  { t: "halo", n: "B1", cls: "red", c: 1, id: "liar" },
  sl("B1", .6, "B2", 1.4, { lab: "X", id: "o2" }), sl("B1", .6, "B3", 1.6, { lab: "X", dir: 1, la: .62, id: "o3" }), sl("B1", .6, "B4", 1.4, { lab: "Y", c: 1, id: "o4" }),
  sl("B2", 1.9, "B3", 2.7, { id: "e23" }), sl("B2", 1.9, "B4", 2.9, { dir: 1, id: "e24" }),
  sl("B3", 1.9, "B2", 2.7, { id: "e32" }), sl("B3", 1.9, "B4", 2.7, { id: "e34" }),
  sl("B4", 1.9, "B2", 2.9, { dir: 1, id: "e42" }), sl("B4", 1.9, "B3", 2.7, { id: "e43" }),
  ev("B2", 3.2, { v: "X", big: 1, id: "k2" }), ev("B3", 3.2, { v: "X", big: 1, id: "k3" }), ev("B4", 3.2, { hollow: 1, id: "k4" }),
  tg(on("B1", .8, 104, -30), V("the registrar may lie", "a Byzantine primary"), { c: 1, own: 1, id: "t1" }),
  tg([0, 222], V("echo: three seals of four", "prepare: 2f + 1 of 3f + 1"), { own: 1, id: "t2" })
]);

/* Changing Leaders Among Liars: votes go only to the registrar, tied into bundles of three */
grow("hs", "pbft", { drop: ["pbft.e23", "pbft.e24", "pbft.e32", "pbft.e34", "pbft.e42", "pbft.e43", "pbft.k2", "pbft.k3", "pbft.k4"], add: [
  sl("B2", 1.55, "B1", 2.05, { c: 1, id: "v12" }), sl("B3", 1.7, "B1", 2.2, { c: 1, dir: 1, id: "v13" }),
  { t: "bun", n: "B1", at: 2.35, c: 1, id: "q1" },
  sl("B1", 2.5, "B2", 3.0, { id: "u2" }), sl("B1", 2.5, "B3", 3.1, { dir: 1, id: "u3" }), sl("B1", 2.5, "B4", 3.0, { id: "u4" }),
  sl("B2", 3.1, "B1", 3.6, { c: 1, id: "v22" }), sl("B4", 3.1, "B1", 3.6, { c: 1, id: "v24" }), sl("B3", 3.15, "B1", 3.7, { c: 1, dir: 1, id: "v23" }),
  { t: "bun", n: "B1", at: 3.9, c: 1, id: "q2" },
  sl("B1", 4.05, "B2", 4.55, { id: "x2" }), sl("B1", 4.05, "B3", 4.65, { dir: 1, id: "x3" }), sl("B1", 4.05, "B4", 4.55, { id: "x4" }),
  sl("B2", 4.65, "B1", 5.15, { c: 1, id: "v32" }), sl("B4", 4.65, "B1", 5.15, { c: 1, id: "v34" }), sl("B3", 4.7, "B1", 5.25, { c: 1, dir: 1, id: "v33" }),
  { t: "bun", n: "B1", at: 5.45, c: 1, id: "q3" },
  tg(on("B1", 4.5, 110, 0), V("votes to the registrar only", "votes to the leader only"), { c: 1, own: 1, id: "t1" }),
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

/* Changes That Never Clash: one column per terrace, and merging keeps the larger pile */
def("crdt", "scribes", [
  ev("S1", 1.0, { id: "a1" }), ev("S1", 2.0, { id: "a2" }), ev("S2", 1.3, { id: "b1" }), ev("S3", 1.1, { id: "c1" }), ev("S3", 2.4, { id: "c2" }),
  sl("S1", 2.0, "S2", 3.0, { id: "m1" }), ev("S2", 3.0, { ring: 1, c: 1, id: "b2" }),
  sl("S3", 2.4, "S2", 3.9, { id: "m2" }), ev("S2", 3.9, { ring: 1, c: 1, id: "b3" }),
  sl("S2", 3.9, "S1", 5.0, { id: "m3" }), ev("S1", 5.0, { ring: 1, c: 1, id: "a3" }),
  sl("S2", 3.9, "S3", 5.0, { id: "m4" }), ev("S3", 5.0, { ring: 1, c: 1, id: "c3" }),
  tg(on("S1", 2.0, -40, 0), "2·0·0", { cls: "sm col", id: "l1" }),
  tg(on("S3", 2.4, -12, 28), "0·0·2", { cls: "sm col", id: "l2" }),
  tg(on("S2", 3.0, 18, -26), "2·1·0", { cls: "sm col", c: 1, id: "l3" }),
  tg(on("S2", 3.9, 46, 4), "2·1·2", { cls: "sm col", c: 1, id: "l4" }),
  tg(on("S1", 5.0, 44, 0), "2·1·2", { cls: "sm col", c: 1, id: "l5" }),
  tg(on("S3", 5.0, -22, 26), "2·1·2", { cls: "sm col", c: 1, id: "l6" }),
  tg([0, 236], V("merge: the larger pile in each column", "merge = element-wise max"), { c: 1, own: 1, id: "t1" })
]);

/* What You Can Promise Alone: a whole visit while cut off, and the last copy taken twice */
def("hat", "libs4", [
  { t: "wedge", n: "L3", w: 32, t1: 1.0, id: "cut" },
  sl("L3", 1.2, "L2", 2.2, { lost: .6, id: "x1" }), sl("L4", 1.4, "L3", 2.6, { lost: .7, id: "x2" }),
  { t: "sp", n: "L3", t1: 1.6, t2: 3.0, c: 1, id: "visit" }, ev("L3", 2.0, { r: 4.5, c: 1, id: "c1" }), ev("L3", 2.6, { r: 4.5, c: 1, id: "c2" }),
  ev("L1", 3.8, { num: 1, id: "lend1" }), ev("L3", 4.1, { num: 1, id: "lend3" }),
  tg(on("L3", 2.3, -76, 0), V("a whole visit: all or none", "atomic visibility"), { c: 1, own: 1, id: "t1" }),
  tg(on("L1", 3.8, 80, 0), V("both lend the last copy", "lost update: unavoidable"), { own: 1, id: "t2" }),
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

/* the part heads */
def("walls", "tents", [
  { t: "obs", n: "T1", t1: 0, t2: 4.4, id: "obs" },
  tg([0, 150], V("two nights, one view", "two runs, one view"), { cls: "night", id: "t" })
]);
def("threads", "houses", [tg([0, 150], V("ten moves, met again and again", "ten recurring techniques"), { cls: "gold", id: "t" })]);

/* ---------- the threads, each lit on one book ---------- */
thread("t1", "owc", { hl: ["owc.a1", "owc.a2", "owc.b1", "owc.b2", "owc.b3", "owc.c1", "owc.c2", "owc.c3"],
  add: [tg([0, 230], V("ties: the lower house first", "ties: the lower id first"), {})] });
thread("t2", "mc", { hl: ["mc.q2", "mc.q3", "owc.b3", "mc.c25"],
  add: [tg(on("H2", 4.1, 70, 60), V("one moment in each span", "a linearization point"), {})] });
def("t3", "priests", [
  sl("A", .7, "B", 1.4, { id: "a1" }), sl("A", .7, "G", 1.7, { dir: 1, id: "a2" }),
  sl("B", 1.6, "A", 2.3, { id: "v1" }), sl("G", 1.9, "A", 2.8, { dir: -1, id: "v2" }),
  ev("A", 3.0, { num: "✓", big: 1, id: "pass" }),
  sl("E", 3.4, "D", 4.1, { dir: -1, id: "b1" }), sl("E", 3.4, "G", 4.3, { dir: -1, id: "b2" }),
  sl("G", 4.5, "E", 5.4, { dir: 1, lab: V("voted: olive", "accepted v"), la: .45, id: "c2" }), sl("D", 4.4, "E", 5.1, { dir: 1, id: "c1" }),
  { t: "halo", n: "A", cls: "q1", hl: 1, id: "q1a" }, { t: "halo", n: "B", cls: "q1", hl: 1, id: "q1b" }, { t: "halo", n: "G", cls: "q1", hl: 1, id: "q1g" },
  { t: "halo", n: "G", cls: "q2", hl: 1, id: "q2g" }, { t: "halo", n: "D", cls: "q2", hl: 1, id: "q2d" }, { t: "halo", n: "E", cls: "q2", hl: 1, id: "q2e" },
  tg([150, -168], V("Γ sits in both majorities", "two quorums share p₃"), { hl: 1, own: 1, id: "t" })
]);
thread("t4", "t3", { drop: ["t3.q1a", "t3.q1b", "t3.q1g", "t3.q2g", "t3.q2d", "t3.q2e"], hl: ["t3.c2"],
  add: [tg([-150, 190], V("Ε proposes olive again", "the new leader adopts v"), {})] });
thread("t5", "dls", { hl: ["dls.band", "dls.ring", "dls.k1", "dls.k2", "dls.k3"],
  add: [tg([0, 100], V("in the wind: never wrong", "before GST: safe"), {}), tg([150, -205], V("after it: done", "after GST: live"), {})] });
thread("t6", "pbft", { hl: ["pbft.e23", "pbft.e24", "pbft.e32", "pbft.e34", "pbft.e42", "pbft.e43"],
  add: [tg([0, 222], V("echo before you trust", "cross-check: 2f + 1"), {})] });
thread("t7", "bo", { hl: ["bo.c11", "bo.c12", "bo.c13", "bo.c21", "bo.c22", "bo.c23"],
  add: [tg([-160, 100], V("a coin no schedule foresees", "randomness beats the scheduler"), {})] });
thread("t8", "crdt", { hl: ["crdt.b2", "crdt.b3", "crdt.a3", "crdt.c3"],
  add: [tg([0, 236], V("only grows: merge in any order", "monotone: merge in any order"), {})] });
thread("t9", "ts", { hl: ["ts.sa1", "ts.sa2", "ts.sa3"], drop: ["ts.t1", "ts.t2"],
  add: [tg([150, 150], V("a sash: no more carts behind", "a marker: the channel is done"), {})] });
def("t10", "libs3", [
  ev("L1", 1.0, { num: 1, id: "w1" }), ev("L1", 1.6, { num: 2, id: "w2" }),
  sl("L1", 1.0, "L3", 4.85, { held: 1, id: "s1" }), sl("L1", 1.6, "L3", 2.4, { id: "s2" }),
  { t: "obs", n: "L3", t1: 2.4, t2: 5.0, id: "hold" },
  ev("L3", 2.4, { num: 2, id: "r2" }), ev("L3", 5.0, { num: "1·2", r: 13, ring: 1, id: "both" }),
  ev("L3", 3.7, { num: "✓", id: "ans" }),
  tg(on("L3", 2.4, -70, 30), V("2 needs 1: hold it back", "buffer until causally ready"), { hl: 1, id: "t1" }),
  tg(on("L3", 3.7, -60, 30), V("but answer at once", "but respond immediately"), { hl: 1, id: "t2" })
]);

/* What it all costs */
def("end", "priests", [
  { t: "obs", n: "A", t1: .8, t2: 2.6, id: "wait" }, sl("B", 1.4, "A", 2.2, { id: "s1" }), sl("G", 1.6, "A", 2.6, { dir: -1, id: "s2" }),
  { t: "gap", n: "D", t1: 1.0, t2: 6.6, id: "gD" }, { t: "gap", n: "E", t1: 2.0, t2: 6.6, id: "gE" },
  { t: "coin", n: "G", at: 4.2, face: "H", id: "coin" }, ev("B", 4.6, { num: "2·0·1", r: 15, id: "col" }),
  tg([-165, -40], V("waiting", "coordination"), { cls: "gold", id: "t1" }),
  tg(on("D", 4.0, 50, 24), V("more men", "replicas"), { cls: "gold", id: "t2" }),
  tg([168, -150], V("a little certainty", "certainty"), { cls: "gold", id: "t3" }),
  tg([-60, -228], V("bookkeeping", "metadata"), { cls: "gold", id: "t4" })
]);

/* ---------- showing a scene: marks that stay, stay; the change sweeps outward ---------- */
const live = {};
let cur = { scene: null, cast: null, night: -1 }, seq = 0, sweep = null;
const sig = m => JSON.stringify(m, (k, v) => (k === "c" || k === "hl" || k === "own" || k === "base" ? undefined : v));
function remove(g, now) { if (now) { g.remove(); return; } g.classList.add("hid"); setTimeout(() => g.remove(), 360); }
function finishSweep() {
  if (!sweep) return;
  cancelAnimationFrame(sweep.raf);
  sweep.items.forEach(g => { g.removeAttribute("clip-path"); g.classList.remove("hid"); });
  clipC.setAttribute("r", 999); sweep = null;
}
function startSweep(items, delay) {
  const tags = items.filter(g => g.rr != null), rest = items.filter(g => g.rr == null);
  rest.forEach(g => g.setAttribute("clip-path", "url(#sweep)"));
  tags.forEach(g => g.classList.add("hid"));
  clipC.setAttribute("r", R0 - 8);
  const t0 = performance.now() + delay, dur = 1150, r1 = rad(TEND) + 60;
  sweep = { items, raf: 0 };
  const fr = now => {
    const u = Math.max(0, Math.min(1, (now - t0) / dur)), e = 1 - (1 - u) * (1 - u), rr = R0 - 8 + (r1 - R0 + 8) * e;
    clipC.setAttribute("r", f(rr));
    tags.forEach(g => { if (rr >= g.rr - 20) g.classList.remove("hid"); });
    if (u < 1) sweep.raf = requestAnimationFrame(fr); else finishSweep();
  };
  sweep.raf = requestAnimationFrame(fr);
}
function show(id, night, opt) {
  opt = opt || {};
  const S = SC[id]; if (!S) return;
  const my = ++seq;
  finishSweep();
  const list = S.marks.concat(S.nights ? S.nights[night || 0] : []);
  const castChange = cur.cast !== S.cast, instant = !!opt.instant || reduce || cur.cast === null;
  const keep = new Set();
  if (!castChange && !opt.redraw) list.forEach(m => { const o = live[m.k]; if (o && sig(o.m) === sig(m)) keep.add(m.k); });
  for (const k in live) if (!keep.has(k)) { remove(live[k].g, instant); delete live[k]; }
  cur = { scene: id, cast: S.cast, night: night || 0 };
  const go = () => {
    if (my !== seq) return;
    CA = CASTS[S.cast];
    const fade = [], sw = [], taken = [];
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
      if (instant) return;
      (m.c || m.hl ? sw : fade).push(g);
    };
    const tags = list.filter(m => m.t === "tg"), rest = list.filter(m => m.t !== "tg");
    rest.forEach(m => put(m));
    tags.forEach(m => { if (live[m.k] && live[m.k].g.rect) taken.push(live[m.k].g.rect); });
    const ob = obstacles(rest);
    tags.forEach(m => { if (live[m.k]) put(m); else put(m, placeTag(m, tagBox(m.txt, tagCls(m)), ob, taken)); });
    fade.forEach(g => g.classList.add("hid"));
    requestAnimationFrame(() => requestAnimationFrame(() => fade.forEach(g => g.classList.remove("hid"))));
    if (sw.length) startSweep(sw, fade.length ? 260 : 60);
  };
  if (castChange) { setCast(S.cast, instant ? 0 : 480); if (instant) go(); else setTimeout(go, 500); }
  else go();
}

/* ---------- following the scroll ---------- */
const steps = [...document.querySelectorAll(".step, .part-head")].filter(s => SC[s.dataset.scene]);
const fig = document.getElementById("fig");
let current = null, ticking = false, autoNight = -1, night = 0;
const prog = document.getElementById("prog");
const readLine = () => innerHeight * (narrow.matches ? .72 : .5);
const nightButtons = step => (step ? [...step.querySelectorAll(".nights b")] : []);
function markNight(step, n) { document.querySelectorAll(".nights b.on").forEach(b => { b.classList.remove("on"); b.removeAttribute("aria-pressed"); }); nightButtons(step).forEach((b, i) => { const mine = Math.floor(i / 2) === n; b.classList.toggle("on", mine); b.setAttribute("aria-pressed", String(mine)); }); }
function pick() {
  ticking = false;
  const L = readLine();
  let active = steps[0];
  for (const s of steps) { if (s.getBoundingClientRect().top <= L) active = s; else break; }
  let n = 0;
  if (SC[active.dataset.scene].nights) {
    const r = active.getBoundingClientRect(), nx = steps[steps.indexOf(active) + 1];
    const end = nx ? nx.getBoundingClientRect().top : r.bottom + innerHeight * .4;
    const a = (L - r.top) / Math.max(1, end - r.top) < .5 ? 0 : 1;
    if (active !== current || a !== autoNight) { autoNight = a; night = a; }
    n = night;
  }
  if (active !== current || n !== cur.night) {
    if (active !== current) {
      steps.forEach(s => s.classList.toggle("on", s === active));
      const part = active.closest(".part"); fig.dataset.part = part ? part.id : "walk";
    }
    current = active;
    show(active.dataset.scene, n);
    markNight(active, n);
  }
  const doc = document.documentElement, max = doc.scrollHeight - innerHeight;
  if (prog) prog.style.width = (max > 0 ? 100 * scrollY / max : 0) + "%";
}
function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(pick); } }
addEventListener("scroll", onScroll, { passive: true });

function goTo(el) {
  const y = el.getBoundingClientRect().top + scrollY - readLine() + 24;
  scrollTo({ top: Math.max(0, y), behavior: reduce ? "auto" : "smooth" });
}
/* a wall's two nights can also be picked by hand */
steps.forEach(s => nightButtons(s).forEach((b, i) => {
  b.setAttribute("role", "button"); b.setAttribute("tabindex", "0");
  const go = () => { if (current !== s) { goTo(s); return; } night = Math.floor(i / 2); show(s.dataset.scene, night); markNight(s, night); };
  b.addEventListener("click", go);
  b.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
}));
/* links inside the steps land their target on the reading line */
document.querySelector(".steps").addEventListener("click", ev => {
  const a = ev.target.closest('a[href^="#"]'); if (!a) return;
  const t = document.getElementById(a.getAttribute("href").slice(1)); if (!t) return;
  ev.preventDefault(); goTo(t);
  if (history.replaceState) history.replaceState(null, "", a.getAttribute("href"));
});

/* text keeps a readable size: larger in the round's own units when the round is drawn small */
function scaleText() {
  const w = svg.getBoundingClientRect().width || 500;
  const k = Math.max(.74, Math.min(1, .9 * VB / w));
  const old = parseFloat(svg.style.getPropertyValue("--k")) || 0;
  svg.style.setProperty("--k", k.toFixed(3));
  return Math.abs(old - k) > .01;
}
addEventListener("resize", () => { if (scaleText() && cur.scene) show(cur.scene, cur.night, { instant: true, redraw: true }); onScroll(); });

/* ---------- the two registers ---------- */
const KEY = "daag-apart-reg", buttons = document.querySelectorAll(".segb");
function setReg(r, keepPlace) {
  const anchor = current, before = anchor ? anchor.getBoundingClientRect().top : 0;
  document.body.setAttribute("data-reg", r);
  buttons.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.reg === r)));
  if (keepPlace && anchor) scrollBy(0, anchor.getBoundingClientRect().top - before);
}
buttons.forEach(b => b.addEventListener("click", () => { setReg(b.dataset.reg, true); try { localStorage.setItem(KEY, b.dataset.reg); } catch (e) {} }));
let saved = null;
try { saved = localStorage.getItem(KEY); } catch (e) {}
setReg(saved === "m" ? "m" : "i", false);
scaleText();
pick();
window.__round = { show, SC, steps };
})();
