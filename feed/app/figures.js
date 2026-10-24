"use strict";
/* The figures of the feed, drawn from a small declarative schema.

   A figure is {kind, title?, marks:[...]}. Each kind draws one of the series' own pictures (the helpers
   below are copied from the books: Isle, Hill, Crown, Room, Coast and Polar) and each mark adds one thing
   to it. A mark is drawn inside its own try/catch, and a mark nothing here knows is skipped, so a figure
   never throws. Everything the writer sends reaches the page as text set with textContent or as a number
   or a name from a fixed list; no markup is ever built from it.

   Figures.draw(container, figure) -> the node it drew; Figures.refit(node) measures the tags once the
   node is on the page; Figures.play(node) plays the marks in once (two seconds at most). */
(function () {
const NS = "http://www.w3.org/2000/svg";
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const INK = "#1c1512", HOLD = "#136f9e", ATTACK = "#bf4a26";
const HC = { 1: "#9cb648", 2: "#e0b84a", 3: "#5b9be0" };                              // Arche's houses
const TC = { 1: "#e0b84a", 2: "#6583d6", 3: "#c45448", 4: "#9cb648" };                // the four tents
const BC = { 1: "#a57fc0", 2: "#9aa0a8", 3: "#e8964d", 4: "#b07a55" };                // the four bandits
const PC = { "Α": "#e0b84a", "Β": "#5b9be0", "Γ": "#e2564e", "Δ": "#9cb648", "Ε": "#b58be0", "Ζ": "#e89a4d", "Η": "#5fbfae" };
const WHO = { O: { g: "Ο", c: "#8fa3b8" }, L: { g: "Λ", c: "#e8b03a" }, K: { g: "Κ", c: "#8fb35a" }, M: { g: "Μ", c: "#cf5a4a" }, T: { g: "Θ", c: "#b3aea4" } };
const THA = { O: -90, L: -18, K: 54, M: 126, T: 198 };
const NAMED = { olive: "#7c8f3a", gold: "#e0b84a", blue: "#2e88b5", red: "#bf4a26", purple: "#7a4fa0", grey: "#9aa0a8", teal: "#2a9d8f" };
const colour = (c, d) => (/^#[0-9a-fA-F]{6}$/.test(c) ? c : NAMED[c] || d);
const GLYPHS = Object.keys(PC);
const LATIN = { A: "Α", B: "Β", G: "Γ", D: "Δ", E: "Ε", Z: "Ζ", H: "Η" };
const seatOf = s => LATIN[s] || s;

function el(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
const xy = (cx, cy, deg, r) => [cx + r * Math.cos(deg * Math.PI / 180), cy + r * Math.sin(deg * Math.PI / 180)];
const f1 = n => Math.round(n * 10) / 10;
const pts = a => "M" + a.map(p => f1(p[0]) + "," + f1(p[1])).join(" L");
const num = (v, d = 0) => (typeof v === "number" && isFinite(v) ? v : d);

/* ---------------------------------------------------------------- small drawing parts */

function newSvg(vb, label) {
  const svg = el("svg", { viewBox: vb, role: "img", "aria-label": label || "A figure" });
  svg.setAttribute("class", "fig" + (reduce ? "" : " pre"));
  const [x, y, w, h] = vb.split(" ").map(Number);
  svg.__c = { x, y, w, h, tags: [], n: 0, list: [], obs: [] };
  return svg;
}
function layer(svg) { return el("g", {}, svg); }
function mk(svg, parent) {                       // one group for each mark, so that play() can bring them in one by one
  return el("g", { class: "mk", style: "--i:" + Math.min(svg.__c.n++, 14) }, parent);
}
function txt(parent, x, y, s, cls) {
  const t = el("text", { x: f1(x), y: f1(y), class: cls || "lab" }, parent);
  t.textContent = s;
  return t;
}
/* something a label must keep off: a house, a seat, an icon (x, y its centre) */
function obs(svg, x, y, w, h) { svg.__c.obs.push({ b: [x - w / 2, y - h / 2, x + w / 2, y + h / 2] }); }
const HIT = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
const SHIFTS = [[0, 0], [0, 28], [0, -28], [0, 56], [0, -56], [44, 0], [-44, 0], [44, 28], [-44, 28], [44, -28], [-44, -28], [0, 84], [0, -84]];
/* a label that fits what it says, kept inside the picture and off the other labels and the things drawn */
function tag(svg, parent, x, y, s, cls) {
  const C = svg.__c, g = el("g", { class: "tag " + (cls || "") }, parent), r = el("rect", { rx: 5 }, g), t = el("text", {}, g);
  t.textContent = s;
  g.__fit = () => {
    let w = 0;
    try { w = t.getComputedTextLength(); } catch { /* not on the page yet */ }
    const W = (w || s.length * 8.6) + 18, H = 26;
    const clampX = v => Math.min(Math.max(v, C.x + W / 2 + 3), C.x + C.w - W / 2 - 3);
    let cx = clampX(x), cy = y;
    for (const [dx, dy] of SHIFTS) {
      const px = clampX(x + dx), py = y + dy, box = [px - W / 2, py - H / 2, px + W / 2, py + H / 2];
      if (box[1] < C.y + 2 || box[3] > C.y + C.h - 2) continue;
      if (C.tags.some(o => o.g !== g && HIT(box, o.b)) || C.obs.some(o => HIT(box, o.b))) continue;
      cx = px; cy = py; break;
    }
    C.tags = C.tags.filter(o => o.g !== g);
    C.tags.push({ g, b: [cx - W / 2, cy - H / 2, cx + W / 2, cy + H / 2] });
    r.setAttribute("x", f1(-W / 2)); r.setAttribute("y", -H / 2); r.setAttribute("width", f1(W)); r.setAttribute("height", H);
    g.setAttribute("transform", `translate(${f1(cx)} ${f1(cy)})`);
  };
  C.list.push(g);
  g.__fit();
  return g;
}
function cross(parent, x, y, s) {
  s = s || 8;
  return el("path", { class: "cross", d: `M${f1(x - s)},${f1(y - s)}L${f1(x + s)},${f1(y + s)}M${f1(x + s)},${f1(y - s)}L${f1(x - s)},${f1(y + s)}` }, parent);
}
function token(parent, x, y, fill, glyph, r) {
  const g = el("g", { class: "tok", transform: `translate(${f1(x)} ${f1(y)})` }, parent);
  el("circle", { r: r || 13, fill, stroke: INK, "stroke-width": 2.5 }, g);
  if (glyph) el("text", {}, g).textContent = glyph;
  return g;
}
function at(parent, x, y, k) { return el("g", { transform: `translate(${f1(x)} ${f1(y)})` + (k ? ` scale(${k})` : "") }, parent); }
function arrowDefs(svg) {
  const d = el("defs", {}, svg), m = (id, c) => {
    const k = el("marker", { id, markerUnits: "userSpaceOnUse", markerWidth: 14, markerHeight: 12, refX: 11, refY: 5, orient: "auto" }, d);
    el("path", { d: "M0,0 L11,5 L0,10 z", fill: c }, k);
  };
  svg.__uid = svg.__uid || "a" + Math.random().toString(36).slice(2, 7);
  m(svg.__uid + "b", HOLD); m(svg.__uid + "r", ATTACK); m(svg.__uid + "k", INK);
  return c => `url(#${svg.__uid}${c})`;
}
const envelope = (p, x, y) => { const g = at(p, x, y, 1.2); el("rect", { x: -12, y: -8, width: 24, height: 16, rx: 2, fill: "#fffaf0", stroke: INK, "stroke-width": 2.2 }, g); el("path", { d: "M-12,-8 L0,2 L12,-8", fill: "none", stroke: INK, "stroke-width": 2 }, g); return g; };
const cartIcon = (p, x, y, fill) => { const g = at(p, x, y, 1.25); el("rect", { x: -14, y: -10, width: 28, height: 15, rx: 3, fill, stroke: INK, "stroke-width": 2.4 }, g); [-7, 7].forEach(dx => el("circle", { cx: dx, cy: 8, r: 3.8, fill: INK }, g)); return g; };
const ravenIcon = (p, x, y) => { const g = at(p, x, y, 1.25); el("path", { d: "M-12,3 Q-6,-10 0,-1 Q6,-10 12,3 Q6,0 0,6 Q-6,0 -12,3Z", fill: INK }, g); return g; };
const sashIcon = (p, x, y) => {                  // a messenger in a red sash
  const g = at(p, x, y, 1.3);
  el("circle", { cy: -10, r: 6, fill: "#e8c9a0", stroke: INK, "stroke-width": 2.2 }, g);
  el("path", { d: "M0,-4 L-10,12 H10 Z", fill: "#fffaf0", stroke: INK, "stroke-width": 2.2, "stroke-linejoin": "round" }, g);
  el("path", { d: "M-6,-1 L7,9", stroke: ATTACK, "stroke-width": 5, "stroke-linecap": "round" }, g);
  return g;
};
const hawkIcon = (p, x, y) => { const g = at(p, x, y); el("path", { d: "M-13,0 Q-6.5,-10 0,0 Q6.5,-10 13,0", fill: "none", stroke: INK, "stroke-width": 3.2, "stroke-linecap": "round" }, g); return g; };
const lockIcon = (p, x, y) => { const g = at(p, x, y); el("path", { d: "M-5.5,-3 v-4.5 a5.5,5.5 0 0 1 11,0 v4.5", fill: "none", stroke: INK, "stroke-width": 2.6 }, g); el("rect", { x: -9, y: -3, width: 18, height: 14, rx: 2.5, fill: "#e0b84a", stroke: INK, "stroke-width": 2.4 }, g); return g; };
const glassIcon = (p, x, y) => { const g = at(p, x, y); el("path", { d: "M-8,-11 H8 L1.5,0 L8,11 H-8 L-1.5,0 Z", fill: "#f7e3a8", stroke: INK, "stroke-width": 2.4, "stroke-linejoin": "round" }, g); return g; };
const sealIcon = (p, x, y) => { const g = at(p, x, y); el("circle", { r: 12, fill: ATTACK, stroke: INK, "stroke-width": 2.4 }, g); el("circle", { r: 5.5, fill: "none", stroke: "#f6eed6", "stroke-width": 1.8 }, g); return g; };
const ratIcon = (p, x, y) => { const g = at(p, x, y); el("path", { d: "M-11,1 q-9,-4 -15,5", fill: "none", stroke: INK, "stroke-width": 2.4 }, g); el("ellipse", { rx: 12, ry: 7.5, fill: "#8a8f96", stroke: INK, "stroke-width": 2.4 }, g); el("circle", { cx: 8, cy: -6, r: 3.6, fill: "#8a8f96", stroke: INK, "stroke-width": 2 }, g); el("circle", { cx: 12, cy: -1, r: 1.6, fill: INK }, g); return g; };
const pineIcon = (p, x, y) => { const g = at(p, x, y); el("path", { d: "M0,-16 L10,-2 H5 L12,9 H-12 L-5,-2 H-10 Z", fill: "#5f6e28", stroke: INK, "stroke-width": 1.8, "stroke-linejoin": "round" }, g); el("rect", { x: -2, y: 9, width: 4, height: 6, fill: "#6b4a2a" }, g); return g; };
const couriers = (p, x, y, state) => {
  const g = at(p, x, y, 1.2);
  el("circle", { cy: -9, r: 5, fill: "#e8c9a0", stroke: INK, "stroke-width": 2 }, g);
  el("path", { d: "M0,-4 L-8,10 H8 Z", fill: "#6583d6", stroke: INK, "stroke-width": 2, "stroke-linejoin": "round" }, g);
  if (state === "stopped") { el("rect", { x: 13, y: -12, width: 4, height: 14, fill: ATTACK }, g); el("rect", { x: 20, y: -12, width: 4, height: 14, fill: ATTACK }, g); }
  return g;
};
const ferryIcon = (p, x, y) => { const g = at(p, x, y); el("path", { d: "M-18,2 H18 L11,12 H-11 Z", fill: "#d9cfb4", stroke: INK, "stroke-width": 2.4, "stroke-linejoin": "round" }, g); el("path", { d: "M0,2 V-18 M2,-16 L14,0 H2 Z", fill: "#fffaf0", stroke: INK, "stroke-width": 2.2, "stroke-linejoin": "round" }, g); return g; };
const wrap = (s, n) => { const out = []; let line = ""; for (const w of s.split(/\s+/)) { if (line && (line + " " + w).length > n) { out.push(line); line = w; } else line = line ? line + " " + w : w; } if (line) out.push(line); return out; };
const outward = (cx, cy, x, y, d) => { const dx = x - cx, dy = y - cy, n = Math.hypot(dx, dy) || 1; return [x + dx / n * d, y + dy / n * d]; };

/* run each mark through its handler; the first key the figure knows names the mark */
function each(marks, handlers) {
  (marks || []).forEach(m => {
    if (!m || typeof m !== "object") return;
    for (const k in m) if (Object.prototype.hasOwnProperty.call(handlers, k)) {
      try { handlers[k](m[k], m); } catch { /* a mark that cannot be drawn is skipped */ }
      break;
    }
  });
}
const alt = (fig, d) => (fig.title ? fig.title + ". " : "") + d;

/* ---------------------------------------------------------------- Arche's ring road (Isle) */

function ring(marks, fig) {
  const svg = newSvg("0 0 470 470", alt(fig, "Arche's ring road from above, with Houses 1, 2 and 3."));
  const cx = 235, cy = 235, R = 165, A = { 1: -90, 2: 30, 3: 150 }, head = arrowDefs(svg);
  el("circle", { cx, cy, r: 215, fill: "#efe6cf", stroke: INK, "stroke-width": 5 }, svg);
  el("circle", { cx, cy, r: 86, fill: "#d9cfb4", stroke: "#6b5a48", "stroke-width": 2.5, "stroke-dasharray": "2 6" }, svg);
  txt(svg, cx, cy - 4, "Mount Phyle");
  el("circle", { cx, cy, r: R, fill: "none", stroke: "#b5602c", "stroke-width": 3, "stroke-dasharray": "3 8" }, svg);
  const under = layer(svg), sites = layer(svg), over = layer(svg), H = {};
  const pos = (deg, r) => xy(cx, cy, deg, r === undefined ? R : r);
  const road = (a, b, u) => { const d = ((A[b] - A[a] + 540) % 360) - 180; return pos(A[a] + d * u, R + (d > 0 ? 10 : -10)); };
  const track = (a, b, u0, u1) => pts(Array.from({ length: 19 }, (_, i) => road(a, b, u0 + (u1 - u0) * i / 18)));
  const side = (a, b) => (((A[b] - A[a] + 540) % 360) - 180 > 0 ? 1 : -1);
  const used = {};                                   // marks between one pair of houses take turns along the road
  const slot = (a, b) => { const k = [a, b].sort().join("-"); used[k] = (used[k] || 0) + 1; return [.5, .3, .7, .2, .8][(used[k] - 1) % 5]; };
  for (const h of [1, 2, 3]) {
    const [x, y] = pos(A[h]), g = el("g", { class: "site", transform: `translate(${f1(x)} ${f1(y)})` }, sites);
    el("rect", { x: -27, y: -19, width: 54, height: 38, rx: 6, fill: HC[h] }, g);
    el("text", {}, g).textContent = "H" + h;
    H[h] = { x, y }; obs(svg, x, y, 60, 44);
  }
  const hh = h => H[h] || H[1];
  each(marks, {
    tag(v, m) {
      const g = mk(svg, over);
      if (v === "gate") { const [x, y] = pos(150, R - 64); tag(svg, g, x + 14, y, String(m.text)); return; }
      const p = hh(v), up = v === 1;
      tag(svg, g, p.x, p.y + (up ? -44 : 46), String(m.text));
    },
    slip(v, m) {
      const [a, b] = v, g = mk(svg, under), s = side(a, b), u = slot(a, b);
      el("path", { class: "st-slip", d: track(a, b, .17, .83), "marker-end": head("b") }, g);
      const [x, y] = road(a, b, u); envelope(g, x, y); obs(svg, x, y, 34, 26);
      if (m.label) { const [lx, ly] = outward(cx, cy, x, y, s > 0 ? 36 : -38); tag(svg, g, lx, ly, String(m.label)); }
    },
    cart(v, m) {
      const [a, b] = v, g = mk(svg, under), s = side(a, b), u = slot(a, b);
      el("path", { class: "st-slip grey", d: track(a, b, .17, .83), "marker-end": head("k") }, g);
      const [x, y] = road(a, b, u); cartIcon(g, x, y, HC[a]); obs(svg, x, y, 40, 34);
      if (m.label) { const [lx, ly] = outward(cx, cy, x, y, s > 0 ? 38 : -40); tag(svg, g, lx, ly, String(m.label)); }
    },
    sash(v) {
      const [a, b] = v, g = mk(svg, under), u = slot(a, b);
      el("path", { class: "st-slip red", d: track(a, b, .17, .83), "marker-end": head("r") }, g);
      const [x, y] = road(a, b, u);
      sashIcon(g, x, y); obs(svg, x, y, 34, 44);
    },
    goatherd(v) {
      const [a, b] = v, g = mk(svg, under), p = hh(a), q = hh(b);
      el("path", { d: `M${f1(p.x)},${f1(p.y)} L${f1(q.x)},${f1(q.y)}`, fill: "none", stroke: "#6b4a2a", "stroke-width": 3, "stroke-dasharray": "4 7" }, g);
      token(g, (p.x + q.x) / 2, (p.y + q.y) / 2, "#b07a55", "G", 14); obs(svg, (p.x + q.x) / 2, (p.y + q.y) / 2, 34, 34);
    },
    glow(v) { const p = hh(v), g = mk(svg, under); el("rect", { x: f1(p.x - 33), y: f1(p.y - 25), width: 66, height: 50, rx: 10, fill: "none", stroke: "#e0b84a", "stroke-width": 7 }, g); },
  });
  return svg;
}

/* ---------------------------------------------------------------- the foot of the hill (Hill) */

function hill(marks, fig) {
  const svg = newSvg("0 0 470 470", alt(fig, "The foot of Mount Phyle from above: four tents round the crown."));
  const cx = 235, cy = 235, R = 158, A = { 1: -90, 2: 0, 3: 90, 4: 180 }, head = arrowDefs(svg);
  el("circle", { cx, cy, r: 215, fill: "#efe6cf", stroke: INK, "stroke-width": 5 }, svg);
  el("circle", { cx, cy, r: 96, fill: "#d9cfb4", stroke: "#6b5a48", "stroke-width": 2.5, "stroke-dasharray": "2 6" }, svg);
  el("circle", { cx, cy, r: 24, fill: "#efe6cf", stroke: "#6b5a48", "stroke-width": 6 }, svg);
  txt(svg, cx, cy + 54, "the crown");
  const under = layer(svg), sites = layer(svg), over = layer(svg), T = {};
  const pos = (deg, r) => xy(cx, cy, deg, r === undefined ? R : r);
  const flyAt = (a, b, u) => { const d = ((A[b] - A[a] + 540) % 360) - 180; return pos(A[a] + d * u, R - (d > 0 ? 24 : 46) * Math.sin(Math.PI * u)); };
  const track = (a, b, u0, u1) => pts(Array.from({ length: 19 }, (_, i) => flyAt(a, b, u0 + (u1 - u0) * i / 18)));
  for (const k of [1, 2, 3, 4]) {
    const [x, y] = pos(A[k]), g = el("g", { class: "site", transform: `translate(${f1(x)} ${f1(y)})` }, sites);
    el("rect", { x: -24, y: -18, width: 48, height: 36, rx: 6, fill: TC[k] }, g);
    el("text", {}, g).textContent = "T" + k;
    T[k] = { x, y, g }; obs(svg, x, y, 54, 42);
  }
  const tt = k => T[k] || T[1], inward = (k, d) => pos(A[k], R - d);
  each(marks, {
    tag(v, m) { const p = tt(v), [x, y] = outward(cx, cy, p.x, p.y, 48); tag(svg, mk(svg, over), x, y, String(m.text)); },
    raven(v, m) {
      const [a, b] = v, g = mk(svg, under), state = m.state || "flying";
      const u = state === "flying" ? .55 : .48;
      el("path", { class: "st-slip grey" + (state === "flying" ? "" : " dashed"), d: track(a, b, .14, state === "flying" ? .86 : u), "marker-end": state === "flying" ? head("k") : "" }, g);
      const [x, y] = flyAt(a, b, u);
      if (state === "pine") { pineIcon(g, x, y - 6); obs(svg, x, y - 6, 30, 40); tag(svg, g, x, y + 30, "in a pine"); }
      else { ravenIcon(g, x, y); obs(svg, x, y, 36, 22); if (state === "lost") { cross(g, x + 16, y, 9); obs(svg, x + 16, y, 22, 22); } }
    },
    hawks(v) { const g = mk(svg, over), [x, y] = inward(v, 64); hawkIcon(g, x - 16, y - 8); hawkIcon(g, x + 14, y + 10); obs(svg, x, y, 56, 40); },
    wind() {
      const g = mk(svg, under);
      [[10, 26], [10, 46], [10, 66]].forEach(([x, y]) => el("path", { d: `M${x},${y} q14,-12 28,0 t28,0 t28,0`, fill: "none", stroke: "#6b5a48", "stroke-width": 3, "stroke-linecap": "round", opacity: .8 }, g));
      txt(g, 48, 92, "wind");
    },
    silent(v) { const p = tt(v), g = mk(svg, over); p.g.classList.add("out"); cross(g, p.x, p.y, 17); const [x, y] = outward(cx, cy, p.x, p.y, 48); txt(g, x, y, "silent", "lab ink"); },
    badge(v, m) {
      const p = tt(v), g = mk(svg, over), a = A[v] * Math.PI / 180;
      const b = at(g, p.x + 44 * Math.cos(a), p.y + 40 * Math.sin(a));
      el("circle", { r: 13, fill: "#fffaf0", stroke: INK, "stroke-width": 2.6 }, b); el("text", { class: "bd" }, b).textContent = String(m.text);
      obs(svg, p.x + 44 * Math.cos(a), p.y + 40 * Math.sin(a), 32, 32);
    },
    coin(v, m) { const g = mk(svg, over), [x, y] = inward(v, 58); token(g, x, y, "#e0b84a", m.face === "goddess" ? "Θ" : "Ο", 15); },
    slate(v, m) {
      /* a slate in a wooden frame, one chalk cross for each tent thought dead: unlike a tent's box, so it never reads as a fifth tent */
      const g = mk(svg, over), [x, y] = inward(v, 78), s = at(g, x, y), list = Array.isArray(m.chalked) ? m.chalked : [];
      el("rect", { x: -36, y: -19, width: 72, height: 38, rx: 3, fill: "#9a7650", stroke: INK, "stroke-width": 2 }, s);
      el("rect", { x: -30, y: -13, width: 60, height: 26, rx: 2, fill: "#3b3a38" }, s);
      el("text", { class: "chalk" }, s).textContent = list.length ? list.map(t => "\u2717" + t).join(" ") : "clear";
      txt(g, x, y + 36, "slate", "lab sm");
      obs(svg, x, y + 8, 80, 62);
    },
    glow(v) { const p = tt(v), g = mk(svg, under); el("rect", { x: f1(p.x - 31), y: f1(p.y - 25), width: 62, height: 50, rx: 10, fill: "none", stroke: "#e0b84a", "stroke-width": 7 }, g); },
  });
  return svg;
}

/* ---------------------------------------------------------------- the crown (Crown) */

function crown(marks, fig) {
  const svg = newSvg("0 0 470 470", alt(fig, "The crown of Mount Phyle from above: the ring wall with bandit 1, and posts 2, 3 and 4 on the slopes."));
  const cx = 235, cy = 235, R = 160, A = { 2: -90, 3: 30, 4: 150 }, head = arrowDefs(svg);
  el("circle", { cx, cy, r: 215, fill: "#efe6cf", stroke: INK, "stroke-width": 5 }, svg);
  el("circle", { cx, cy, r: 112, fill: "#d9cfb4", stroke: "#6b5a48", "stroke-width": 2.5, "stroke-dasharray": "2 6" }, svg);
  el("circle", { cx, cy, r: 56, fill: "#efe6cf", stroke: "#6b5a48", "stroke-width": 9 }, svg);
  txt(svg, cx - 96, cy - 84, "ring wall", "lab halo");
  const under = layer(svg), sites = layer(svg), over = layer(svg), P = {};
  const pos = k => (k === 1 ? [cx, cy] : xy(cx, cy, A[k], R));
  const bow = (a, b, u, k) => { const [x1, y1] = pos(a), [x2, y2] = pos(b), dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, w = k * Math.sin(Math.PI * u); return [x1 + dx * u - dy / L * w, y1 + dy * u + dx / L * w]; };
  const track = (a, b, u0, u1) => pts(Array.from({ length: 15 }, (_, i) => bow(a, b, u0 + (u1 - u0) * i / 14, 18)));
  for (const k of [1, 2, 3, 4]) {
    const [x, y] = pos(k), g = el("g", { class: "site", transform: `translate(${f1(x)} ${f1(y)})` }, sites);
    el("rect", { x: -24, y: -18, width: 48, height: 36, rx: 6, fill: BC[k] }, g);
    el("text", {}, g).textContent = "B" + k;
    P[k] = { x, y, g }; obs(svg, x, y, 54, 42);
  }
  const pp = k => P[k] || P[1];
  /* a place beside post k for a small thing: the seal toward the wall, the lock and the glass to either side */
  const nextTo = (k, what) => {
    if (k === 1) return { seal: [cx + 36, cy + 30], lock: [cx - 36, cy - 30], glass: [cx + 36, cy - 30], tag: [cx, cy + 86] }[what];
    const p = P[k], a = A[k] * Math.PI / 180, tx = -Math.sin(a), ty = Math.cos(a), ix = -Math.cos(a), iy = -Math.sin(a);
    return { seal: [p.x + ix * 44, p.y + iy * 44], lock: [p.x + tx * 42, p.y + ty * 42], glass: [p.x - tx * 42, p.y - ty * 42], tag: outward(cx, cy, p.x, p.y, 48) }[what];
  };
  each(marks, {
    tag(v, m) { const [x, y] = nextTo(v, "tag"); tag(svg, mk(svg, over), x, y, String(m.text)); },
    rat(v, m) {
      const [a, b] = v, g = mk(svg, under);
      el("path", { class: "st-slip", d: track(a, b, .2, .8), "marker-end": head("b") }, g);
      const [x, y] = bow(a, b, .5, 18); ratIcon(g, x, y); obs(svg, x, y, 44, 26);
      if (m.label) tag(svg, g, x, y + 30, String(m.label));
    },
    seal(v, m) { const g = mk(svg, over), [x, y] = nextTo(v, "seal"); sealIcon(g, x, y); obs(svg, x, y, 30, 30); if (m.text) tag(svg, g, x, y + 28, String(m.text)); },
    lock(v) { const g = mk(svg, over), [x, y] = nextTo(v, "lock"); lockIcon(g, x, y); obs(svg, x, y, 26, 32); },
    glass(v) { const g = mk(svg, over), [x, y] = nextTo(v, "glass"); glassIcon(g, x, y); obs(svg, x, y, 24, 32); },
    glow(v) { const p = pp(v), g = mk(svg, under); el("rect", { x: f1(p.x - 31), y: f1(p.y - 25), width: 62, height: 50, rx: 10, fill: "none", stroke: "#e0b84a", "stroke-width": 7 }, g); },
  });
  return svg;
}

/* ---------------------------------------------------------------- a round hall: the Chamber or the Tholos (Room) */

function room(kind, marks, fig) {
  const chamber = kind === "chamber";
  const svg = newSvg("-20 -6 480 490", alt(fig, chamber ? "The Chamber from above, with its one door." : "The Tholos from above: the podium at the centre, five benches, the porch below."));
  const cx = 220, cy = 215, rr = 204, R = 138;
  el("circle", { cx, cy, r: rr, fill: "#efe6cf", stroke: INK, "stroke-width": 5 }, svg);
  el("circle", { cx, cy, r: R + 36, fill: "none", stroke: "#b5602c", "stroke-width": 3, "stroke-dasharray": "3 8" }, svg);
  if (chamber) { el("rect", { x: cx - 24, y: cy + rr - 2, width: 48, height: 12, fill: "#6b4a2a", stroke: INK, "stroke-width": 3 }, svg); txt(svg, cx, cy + rr + 30, "the one door", "lab sm"); }
  else { el("rect", { x: cx - 26, y: cy + rr - 2, width: 52, height: 26, fill: "#d9cfb4", stroke: INK, "stroke-width": 3 }, svg); txt(svg, cx, cy + rr + 44, "the porch", "lab sm"); }
  const under = layer(svg), mid = layer(svg), seats = layer(svg), over = layer(svg), S = {};
  const pos = (deg, r) => xy(cx, cy, deg, r === undefined ? R : r);
  let order, glyph, fill, angle;
  if (chamber) {
    const m = (marks || []).find(x => x && Array.isArray(x.seats));
    order = (m ? m.seats.map(seatOf) : ["Α", "Β", "Γ", "Δ", "Ε"]).filter(s => GLYPHS.includes(s)).slice(0, 7);
    if (order.length < 3) order = ["Α", "Β", "Γ", "Δ", "Ε"];
    const n = order.length, base = -90 + (n % 2 ? 0 : 180 / n);
    angle = s => base + 360 * order.indexOf(s) / n; glyph = s => s; fill = s => PC[s];
  } else { order = Object.keys(THA); angle = s => THA[s]; glyph = s => WHO[s].g; fill = s => WHO[s].c; }
  const stat = { out: new Set(), wax: new Set(), ring: new Map() };
  each(marks, {
    out(v) { (v || []).forEach(s => stat.out.add(chamber ? seatOf(s) : s)); },
    wax(v) { (v || []).forEach(s => stat.wax.add(s)); },
    ring(v, m) { (v || []).forEach(s => stat.ring.set(chamber ? seatOf(s) : s, m.colour)); },
    porch(v) { stat.porch = v; },
    podium(v, m) { stat.podium = [String(v), m.holder]; },
  });
  let pod = null;
  if (!chamber) {
    const holder = stat.podium && WHO[stat.podium[1]];
    pod = el("g", { class: "podium" }, mid);
    el("circle", { cx, cy, r: 42, fill: holder ? holder.c : "#d9cfb4", stroke: INK, "stroke-width": 4 }, pod);
    if (stat.podium) txt(pod, cx, cy + 5, stat.podium[0], "lab ink sm");
    obs(svg, cx, cy, 90, 90);
  }
  const place = {};
  order.forEach(s => {
    let [x, y] = pos(angle(s));
    const away = !chamber && stat.porch === s;
    if (away) { place[s] = [cx, cy + rr + 12]; }
    const g = el("g", { class: "seat" + ((stat.out.has(s) || away) ? " out" : "") + (stat.wax.has(s) ? " wax" : ""), transform: `translate(${f1(x)} ${f1(y)})` }, seats);
    if (stat.ring.has(s)) { const rc = el("circle", { class: "ring", r: 32 }, g); rc.style.stroke = colour(stat.ring.get(s) === "blue" ? "#136f9e" : stat.ring.get(s) === "olive" ? "#7c8f3a" : stat.ring.get(s), "#e0b84a"); }
    el("circle", { class: "b", r: 25, fill: fill(s) }, g);
    el("text", { class: "g" }, g).textContent = glyph(s);
    S[s] = { x, y }; obs(svg, x, y, 66, 66);
    if (away) { token(over, cx, cy + rr + 14, fill(s), glyph(s), 16); obs(svg, cx, cy + rr + 14, 36, 36); }
  });
  each(marks, {
    tag(v, m) { const s = chamber ? seatOf(v) : v, q = S[s]; if (!q) return; const [x, y] = outward(cx, cy, q.x, q.y, 60); tag(svg, mk(svg, over), x, y, String(m.text)); },
    centre(v) { const g = mk(svg, over), lines = wrap(String(v), 16); lines.forEach((l, i) => txt(g, cx, cy + 5 + (i - (lines.length - 1) / 2) * 20, l, "lab ink")); },
    runner(v) {
      const q = S[v]; if (!q) return; const g = mk(svg, under);
      el("path", { d: `M${cx},${cy} L${f1(q.x)},${f1(q.y)}`, class: "st-slip", "marker-end": "" , "stroke-dasharray": "4 5" }, g);
      token(g, cx + (q.x - cx) * .55, cy + (q.y - cy) * .55, WHO[stat.podium && stat.podium[1] || "O"].c, "", 11); obs(svg, cx + (q.x - cx) * .55, cy + (q.y - cy) * .55, 28, 28);
    },
  });
  return svg;
}

/* ---------------------------------------------------------------- the scholars' coast (Coast) */

function coast(marks, fig) {
  let n = 5;
  (marks || []).forEach(m => { for (const k of ["tag", "glow"]) if (m && typeof m[k] === "number") n = Math.max(n, m[k]); if (m && Array.isArray(m.courier)) n = Math.max(n, ...m.courier); });
  n = Math.min(8, n);
  const svg = newSvg("0 0 440 340", alt(fig, "The scholars' coast from above: a few libraries among olive groves, and the stoa on the shore."));
  el("path", { d: "M52 86C70 40 150 22 214 34c40 8 56-14 104 0 52 16 86 60 76 112-6 34 14 52-4 96-20 50-92 72-150 62-36-6-50 14-96 2C86 292 40 262 40 204c0-34-8-70 12-118z", fill: "#efe6cf", stroke: INK, "stroke-width": 5 }, svg);
  const AT = [[150, 96], [262, 84], [330, 150], [306, 236], [214, 268], [112, 236], [96, 160], [212, 168]], STOA = [378, 196];
  el("rect", { x: STOA[0] - 9, y: STOA[1] - 26, width: 18, height: 52, fill: "#d9cfb4", stroke: INK, "stroke-width": 3 }, svg);
  txt(svg, STOA[0] - 6, STOA[1] + 46, "the stoa", "lab halo sm");
  const under = layer(svg), libs = layer(svg), over = layer(svg), L = {};
  for (let i = 0; i < n; i++) {
    const [x, y] = AT[i], g = el("g", { class: "lib", transform: `translate(${x} ${y})` }, libs);
    el("circle", { class: "b", r: 18, fill: "#fffaf0" }, g); el("text", {}, g).textContent = i + 1; L[i + 1] = { x, y, g }; obs(svg, x, y, 46, 46);
  }
  const head = arrowDefs(svg);
  each(marks, {
    tag(v, m) { const p = L[v]; if (p) tag(svg, mk(svg, over), p.x, p.y + 38, String(m.text)); },
    courier(v, m) {
      const [a, b] = v, p = L[a], q = L[b]; if (!p || !q) return; const g = mk(svg, under), state = m.state || "walking";
      const u = state === "walking" ? .55 : state === "stopped" ? .42 : .5, x = p.x + (q.x - p.x) * u, y = p.y + (q.y - p.y) * u;
      el("path", { class: "way", d: `M${p.x},${p.y} L${f1(state === "walking" ? q.x : x)},${f1(state === "walking" ? q.y : y)}`, "marker-end": state === "walking" ? head("k") : "" }, g);
      couriers(g, x, y - 4, state); obs(svg, x, y - 4, 38, 40);
      if (state === "lost") cross(g, x, y + 4, 11);
    },
    glow(v) { const p = L[v]; if (!p) return; el("circle", { cx: p.x, cy: p.y, r: 27, fill: "none", stroke: "#e0b84a", "stroke-width": 7 }, mk(svg, under)); },
    ferry() { const g = mk(svg, over); ferryIcon(g, 398, 284); obs(svg, 398, 284, 44, 40); tag(svg, g, 394, 314, "ferry"); },
  });
  return svg;
}

/* ---------------------------------------------------------------- the oracle at the fork */

function hall(marks, fig) {
  const svg = newSvg("0 0 440 440", alt(fig, "The oracle at the fork from above: a walled enclosure round an oak, with a small temple, its north gate on the road to the assemblies and its south gate on the road to the scholars' coast."));
  const head = arrowDefs(svg);
  txt(svg, 220, 24, "north · to live as legislators", "lab sm");
  txt(svg, 220, 424, "south · to live as scholars", "lab sm");
  el("path", { class: "way", d: "M220 126V86L130 40M220 86L310 40" }, svg);
  el("path", { class: "way", d: "M220 314V396" }, svg);
  el("circle", { cx: 220, cy: 220, r: 96, fill: "#efe6cf", stroke: INK, "stroke-width": 5 }, svg);
  el("circle", { cx: 166, cy: 270, r: 17, fill: "#8a9550", stroke: INK, "stroke-width": 2.4 }, svg);
  el("rect", { x: 250, y: 260, width: 26, height: 20, fill: "#d9cfb4", stroke: INK, "stroke-width": 2.4 }, svg);
  const dn = el("rect", { class: "door", x: 200, y: 114, width: 40, height: 22 }, svg), ds = el("rect", { class: "door", x: 200, y: 304, width: 40, height: 22 }, svg);
  txt(svg, 220, 160, "the oracle", "lab sm");
  const over = layer(svg), under = layer(svg);
  each(marks, {
    question(v) {
      const g = mk(svg, over), lines = wrap(String(v), 21), h = 34 + lines.length * 21, y0 = 220 - h / 2 + 12;
      el("rect", { x: 138, y: f1(y0), width: 164, height: f1(h - 14), rx: 6, fill: "#fffaf0", stroke: INK, "stroke-width": 2.4 }, g);
      lines.forEach((l, i) => txt(g, 220, y0 + 22 + i * 21, l, "lab ink sm"));
    },
    door(v) { this.road(v); },
    road(v) {
      const g = mk(svg, under), n = v === "north";
      (n ? dn : ds).classList.add("on");
      el("path", { d: n ? "M220 112V58" : "M220 328V390", fill: "none", stroke: ATTACK, "stroke-width": 4, "stroke-dasharray": "2 6", "stroke-linecap": "round", "marker-end": head("r") }, g);
    },
    north(v) { tag(svg, mk(svg, over), 334, 86, String(v)); },
    south(v) { tag(svg, mk(svg, over), 334, 354, String(v)); },
  });
  return svg;
}

/* ---------------------------------------------------------------- space-time in the round (Polar) */

function timeline(marks, fig) {
  const svg = newSvg("0 0 520 540", alt(fig, "Space and time drawn in the round: each place is a line running outward, and later moments are further out."));
  const placesMark = (marks || []).find(m => m && Array.isArray(m.places));
  const places = (placesMark ? placesMark.places : []).slice(0, 5), n = places.length || 1;
  const base = -90 + (n % 2 ? 0 : 180 / n), nodes = {};
  places.forEach((p, i) => { nodes[p.key] = { deg: base + 360 * i / n, label: String(p.label || p.key), fill: colour(p.colour, "#f6eed6") }; });
  let tmax = 3;
  (marks || []).forEach(m => {
    if (!m) return;
    if (m.event) tmax = Math.max(tmax, num(m.event.t));
    if (m.arc) tmax = Math.max(tmax, num(m.arc.t1), num(m.arc.t2));
    if (Array.isArray(m.loop)) m.loop.forEach(p => { tmax = Math.max(tmax, num(p.t)); });
  });
  const cx = 260, cy = 262, r0 = 44, step = Math.min(30, (205 - r0) / (tmax + .3)), rings = Math.ceil(tmax), head = arrowDefs(svg);
  const r = t => r0 + step * t, pt = (k, t) => xy(cx, cy, nodes[k].deg, r(t));
  const arc = (a, ta, b, tb) => {
    const a0 = nodes[a].deg, d = ((nodes[b].deg - a0 + 540) % 360) - 180, m = Math.max(14, Math.round(Math.abs(d) / 3));
    return Array.from({ length: m + 1 }, (_, i) => xy(cx, cy, a0 + d * i / m, r(ta + (tb - ta) * i / m)));
  };
  const frame = layer(svg), under = layer(svg), slips = layer(svg), evs = layer(svg);
  for (let i = 1; i <= rings; i++) el("circle", { class: "st-ring", cx, cy, r: f1(r(i)) }, frame);
  for (const k in nodes) { const [x1, y1] = pt(k, 0), [x2, y2] = pt(k, tmax + .4); el("line", { class: "st-spoke", x1: f1(x1), y1: f1(y1), x2: f1(x2), y2: f1(y2) }, frame); }
  for (const k in nodes) {
    const [x, y] = pt(k, 0), g = el("g", { class: "st-node", transform: `translate(${f1(x)} ${f1(y)})` }, frame);
    const w = Math.max(40, nodes[k].label.length * 10 + 14);
    el("rect", { x: -w / 2, y: -14, width: w, height: 28, rx: 5, fill: nodes[k].fill }, g); el("text", {}, g).textContent = nodes[k].label;
    obs(svg, x, y, w + 6, 34);
  }
  txt(frame, cx, 528, "later moments are further out", "st-note");
  const known = k => Object.prototype.hasOwnProperty.call(nodes, k);
  each(marks, {
    loop(v) {
      const p = v.filter(q => known(q.at)).map(q => pt(q.at, num(q.t))); if (p.length < 2) return;
      el("path", { class: "loop", d: pts(p) + " Z" }, mk(svg, under));
    },
    arc(v) {
      if (!known(v.from) || !known(v.to)) return;
      const g = mk(svg, slips), a = arc(v.from, num(v.t1), v.to, num(v.t2)), lost = v.lost === true, end = a[a.length - 1];
      let line = a.slice();
      if (lost) line = a.slice(0, Math.max(3, Math.round(a.length * .55)));
      else while (line.length > 2 && Math.hypot(line[line.length - 1][0] - end[0], line[line.length - 1][1] - end[1]) < 17) line.pop();
      el("path", { class: "st-slip" + (lost ? " lost" : ""), d: pts(line), "marker-end": lost ? "" : head("b") }, g);
      if (lost) { const e = line[line.length - 1]; cross(g, e[0], e[1], 8); }
      if (v.label) { const q = a[Math.floor(a.length / 2)], [lx, ly] = outward(cx, cy, q[0], q[1], 22); tag(svg, g, lx, ly, String(v.label)); }
    },
    event(v) {
      if (!known(v.at)) return;
      const g = mk(svg, evs), [x, y] = pt(v.at, num(v.t)), e = at(g, x, y), hollow = v.hollow === true; obs(svg, x, y, 28, 28);
      el("circle", { r: 12, fill: hollow ? "#fffaf0" : nodes[v.at].fill === "#f6eed6" ? "#e0b84a" : nodes[v.at].fill, stroke: INK, "stroke-width": 3, "stroke-dasharray": hollow ? "4 3" : "" }, e);
      if (v.label) { const [lx, ly] = outward(cx, cy, x, y, 30); tag(svg, g, lx, ly, String(v.label)); }
    },
  });
  return svg;
}

/* ---------------------------------------------------------------- the three that are plain boxes */

function box(cls, label) {
  const d = document.createElement("div");
  d.className = "fig fig-" + cls + (reduce ? "" : " pre");
  d.setAttribute("role", "img"); d.setAttribute("aria-label", label);
  return d;
}
function part(parent, tag, cls, text, i) {
  const e = document.createElement(tag); e.className = (cls || "") + " mk"; e.style.setProperty("--i", i || 0);
  if (text !== undefined) e.textContent = text;
  parent.appendChild(e); return e;
}
function stat(marks, fig) {
  let value = "", caption = "";
  (marks || []).forEach(m => { if (m && typeof m.value === "string") value = m.value; if (m && typeof m.caption === "string") caption = m.caption; });
  const d = box("stat", alt(fig, "The number " + value + ". " + caption));
  const v = part(d, "div", "big", value, 0); if (value.length > 9) v.classList.add("long");
  if (caption) part(d, "div", "cap", caption, 1);
  return d;
}
function versus(marks, fig) {
  const d = box("versus", alt(fig, "Two columns compared."));
  let i = 0;
  (marks || []).forEach(m => {
    if (!m) return;
    for (const k of ["left", "right"]) if (m[k] && typeof m[k] === "object") {
      const c = part(d, "div", "col " + k, undefined, i++);
      if (m[k].title) part(c, "h4", "", String(m[k].title));
      (Array.isArray(m[k].lines) ? m[k].lines : []).slice(0, 4).forEach(l => part(c, "p", "", String(l)));
    }
  });
  return d;
}
function pebbles(marks, fig) {
  const d = box("pebbles", alt(fig, "A library's pebble board: a pile of white and black pebbles in each column."));
  const m = (marks || []).find(x => x && Array.isArray(x.columns));
  (m ? m.columns : []).slice(0, 4).forEach((c, i) => {
    const col = part(d, "div", "pcol", undefined, i), stack = part(col, "div", "stack");
    const w = Math.max(0, Math.min(12, num(c.white))), b = Math.max(0, Math.min(12, num(c.black)));
    for (let j = 0; j < w; j++) part(stack, "i", "pb white");
    for (let j = 0; j < b; j++) part(stack, "i", "pb black");
    part(col, "div", "plab", String(c.label || ""));
    part(col, "div", "pn", w + (b ? " − " + b : ""));
  });
  return d;
}

/* ---------------------------------------------------------------- the entry points */

const KINDS = { ring, hill, crown, chamber: (m, f) => room("chamber", m, f), tholos: (m, f) => room("tholos", m, f), coast, hall, timeline, stat, versus, pebbles };

function refit(node) {
  const C = node && node.__c;
  if (!C) return;
  C.tags = [];
  C.list.forEach(g => g.__fit());
}
function draw(container, figure) {
  const f = figure && KINDS[figure.kind];
  if (!f) return null;
  let node = null;
  try { node = f(Array.isArray(figure.marks) ? figure.marks : [], figure); } catch { node = null; }
  if (!node) return null;
  container.appendChild(node);
  refit(node);
  return node;
}
function play(node) {
  if (!node || !node.classList.contains("pre")) return;
  node.classList.remove("pre");
  node.classList.add("on");
}
window.Figures = { draw, refit, play, KINDS: Object.keys(KINDS) };
})();
