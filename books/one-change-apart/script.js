/* One Change Apart: one chart of the two islands, walked by scrolling.
   Each book is a node in its setting; each line between two books names the one thing that changes.
   The steps beside the chart are plain HTML; this script draws the chart and lights it to match the step in view. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var svg = document.getElementById('chart');
  if (!svg) return;
  document.documentElement.classList.add('js');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var narrow = window.matchMedia('(max-width: 899px)');

  /* ---------- the chart's data ---------- */
  var C = { x: 460, y: 430 }, R_ROAD = 350, R_FOOT = 238, R_CROWN = 118, R_COAST = 395;
  var SET = { ring: '#b5602c', foot: '#5f6e28', crown: '#7a4fa0', chamber: '#136f9e', tholos: '#c8961c', coast: '#2a7b6f', hall: '#8a5a36' };

  var NODES = {
    owc:  { x: 521, y: 85,   s: 'ring',    i: 'Without Clocks',   m: 'Logical clocks',     t: 'Ordering Without Clocks' },
    ts:   { x: 192, y: 205,  s: 'ring',    i: 'Taking Stock',     m: 'Snapshots',          t: 'Taking Stock Without Stopping' },
    mc:   { x: 789, y: 310,  s: 'ring',    i: 'Many Copies',      m: 'Linearizability',    t: 'Many Copies, Acting as One' },
    flp:  { x: 419, y: 196,  s: 'foot',    i: 'The Limits',       m: 'FLP',                t: 'The Limits of Agreement' },
    bo:   { x: 278, y: 277,  s: 'foot',    i: 'By Chance',        m: 'Ben-Or',             t: 'Agreeing by Chance' },
    ct:   { x: 222, y: 430,  s: 'foot',    i: 'Dead or Slow',     m: 'Failure detectors',  t: 'Telling the Dead from the Slow' },
    dls:  { x: 278, y: 583,  s: 'foot',    i: 'Running Late',     m: 'Partial synchrony',  t: 'Agreeing When Messages Run Late' },
    cap:  { x: 501, y: 664,  s: 'foot',    i: 'Cut Off',          m: 'CAP',                t: 'Answering While Cut Off' },
    bgp:  { x: 460, y: 368,  s: 'crown',   i: 'Among Liars',      m: 'Byzantine generals', t: 'Agreeing Among Liars' },
    pbft: { x: 460, y: 430,  s: 'crown',   i: 'Keeping Order',    m: 'PBFT',               t: 'Keeping Order Among Liars' },
    hs:   { x: 460, y: 492,  s: 'crown',   i: 'Changing Leaders', m: 'HotStuff',           t: 'Changing Leaders Among Liars' },
    ptp:  { x: 300, y: 930,  s: 'chamber', i: 'Parliament',       m: 'Paxos',              t: 'The Part-Time Parliament' },
    vr:   { x: 800, y: 920,  s: 'tholos',  i: 'One Leader',       m: 'Viewstamped',        t: 'One Leader at a Time' },
    calm: { x: 550, y: 1060, s: 'hall',    i: 'When to Wait',     m: 'CALM',               t: 'Knowing When to Wait' },
    gos:  { x: 440, y: 1180, s: 'coast',   i: 'Word of Mouth',    m: 'Epidemics',          t: 'Spreading by Word of Mouth' },
    hat:  { x: 705, y: 1180, s: 'coast',   i: 'Promise Alone',    m: 'HATs',               t: 'What You Can Promise Alone' },
    pbs:  { x: 420, y: 1290, s: 'coast',   i: 'Up to Date',       m: 'PBS',                t: 'Probably Up to Date' },
    crdt: { x: 650, y: 1330, s: 'coast',   i: 'Never Clash',      m: 'CRDTs',              t: 'Changes That Never Clash' }
  };

  function onCircle(r, a) { return { x: C.x + r * Math.cos(a), y: C.y + r * Math.sin(a) }; }
  function arcPath(a, b, r, sweep) {
    var p = NODES[a], q = NODES[b];
    return 'M' + p.x + ',' + p.y + 'A' + r + ',' + r + ' 0 0 ' + sweep + ' ' + q.x + ',' + q.y;
  }
  function line(a, b) { var p = NODES[a], q = NODES[b]; return 'M' + p.x + ',' + p.y + 'L' + q.x + ',' + q.y; }
  function bend(a, b, k) {           // a gentle quadratic bend, k = offset as a share of length
    var p = NODES[a], q = NODES[b], mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2, dx = q.x - p.x, dy = q.y - p.y;
    return 'M' + p.x + ',' + p.y + 'Q' + (mx - dy * k) + ',' + (my + dx * k) + ' ' + q.x + ',' + q.y;
  }

  var EDGES = [
    { a: 'owc', b: 'mc',   d: function () { return arcPath('owc', 'mc', R_ROAD, 1); },  i: 'first by the sun',            m: 'real-time order' },
    { a: 'owc', b: 'ts',   d: function () { return arcPath('owc', 'ts', R_ROAD, 0); },  i: 'count the road as well',      m: 'record the channels', at: [318, 103] },
    { a: 'owc', b: 'flp',  d: function () { return line('owc', 'flp'); },               i: 'a man may fall silent',       m: 'one crash' },
    { a: 'flp', b: 'dls',  d: function () {
        var p = NODES.flp, q = NODES.dls, c1 = onCircle(160, -150 * Math.PI / 180), c2 = onCircle(160, 170 * Math.PI / 180);
        return 'M' + p.x + ',' + p.y + 'C' + c1.x + ',' + c1.y + ' ' + c2.x + ',' + c2.y + ' ' + q.x + ',' + q.y; },
                                                                                        i: 'a wind that drops',           m: 'partial synchrony', lt: 0.55 },
    { a: 'flp', b: 'bo',   d: function () { return arcPath('flp', 'bo', R_FOOT, 0); },  i: 'a coin in each tent',         m: 'local coins', at: [432, 312] },
    { a: 'dls', b: 'ct',   d: function () { return arcPath('dls', 'ct', R_FOOT, 1); },  i: 'a slate for the wind',        m: 'a failure detector' },
    { a: 'mc',  b: 'cap',  d: function () { return line('mc', 'cap'); },                i: 'hawks take birds',            m: 'message loss' },
    { a: 'flp', b: 'bgp',  d: function () { return line('flp', 'bgp'); },               i: 'liars, not the dead',        m: 'Byzantine faults', at: [452, 290] },
    { a: 'dls', b: 'ptp',  d: function () { return bend('dls', 'ptp', -0.08); },        i: 'members who come and go',     m: 'crash and recovery' },
    { a: 'ptp', b: 'vr',   d: function () { return bend('ptp', 'vr', 0.06); },          i: 'a podium',                    m: 'a primary' },
    { a: 'vr',  b: 'pbft', d: function () {
        var p = NODES.vr, q = NODES.pbft;
        return 'M' + p.x + ',' + p.y + 'C800,700 700,430 ' + q.x + ',' + q.y; },     i: 'the holder may lie',          m: 'a Byzantine primary', lt: 0.38 },
    { a: 'bgp', b: 'pbft', d: function () { return line('bgp', 'pbft'); },              i: 'wind, and one scroll',        m: 'partial synchrony; a log', hide: true },
    { a: 'pbft', b: 'hs',  d: function () { return line('pbft', 'hs'); },               i: 'votes tied into bundles',     m: 'quorum certificates', side: 1 },
    { a: 'cap', b: 'gos',  d: function () { return line('cap', 'gos'); },               i: 'copies may differ a while',   m: 'eventual consistency', lt: 0.4 },
    { a: 'gos', b: 'pbs',  d: function () { return line('gos', 'pbs'); },               i: 'ask only some copies',        m: 'partial quorums' },
    { a: 'gos', b: 'crdt', d: function () { return line('gos', 'crdt'); },              i: 'merge, not the later',        m: 'merge by join' },
    { a: 'cap', b: 'hat',  d: function () { return line('cap', 'hat'); },               i: 'whole visits, cut off',       m: 'transactions', lt: 0.62 },
    { a: 'crdt', b: 'calm', d: function () { return line('crdt', 'calm'); },            i: 'questions that only grow',    m: 'monotone programs', lt: 0.22 },
    { a: 'hat', b: 'calm', d: function () { return line('hat', 'calm'); },              i: 'which promises wait',         m: 'coordination' }
  ];
  var EDGE = {};
  EDGES.forEach(function (e) { e.id = e.a + '-' + e.b; EDGE[e.id] = e; });

  var WALLS = {
    w1: { x: 590, y: 196,  i: 'No plan is sure to finish', m: 'FLP' },
    w2: { x: 612, y: 362,  i: 'Half cannot speak for all', m: 'Quorum bounds' },
    w3: { x: 590, y: 664,  i: 'Answer, or be right',       m: 'CAP' },
    w4: { x: 550, y: 1004, i: 'An absence needs everyone', m: 'CALM' }
  };
  var FULL = { x: 30, y: 8, w: 940, h: 1392 };

  /* ---------- drawing ---------- */
  function mk(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    (parent || svg).appendChild(e);
    return e;
  }
  var reg = document.body.getAttribute('data-reg') || 'i';

  var defs = mk('defs', {});
  var pat = mk('pattern', { id: 'hatch', width: 9, height: 9, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(35)' }, defs);
  mk('line', { x1: 0, y1: 0, x2: 0, y2: 9, stroke: '#8a7350', 'stroke-width': 1.4, opacity: .35 }, pat);

  mk('rect', { x: -400, y: -400, width: 1800, height: 2300, class: 'sea' });
  var waves = mk('g', {});
  [[880, 520], [930, 610], [120, 880], [70, 960], [880, 1240], [930, 1320], [120, 1180], [180, 1360], [610, 800], [680, 850]].forEach(function (w) {
    mk('path', { d: 'M' + w[0] + ',' + w[1] + 'q12,-9 24,0t24,0', class: 'wave' }, waves);
  });

  // Arche: a round island; Mount Phyle hatched inside the road
  mk('circle', { cx: C.x, cy: C.y, r: R_COAST + 4, class: 'landline' });
  mk('circle', { cx: C.x, cy: C.y, r: R_COAST, class: 'land' });
  mk('circle', { cx: C.x, cy: C.y, r: R_FOOT + 40, class: 'hatch' });
  // Paxos: a Y, its arms open towards Arche, its stem widening into the scholars' coast
  var F = { x: 550, y: 1060 };
  var arms = [[F.x, F.y, NODES.ptp.x - 20, NODES.ptp.y - 6], [F.x, F.y, NODES.vr.x + 20, NODES.vr.y - 6], [F.x, F.y, F.x, F.y + 110]];
  var body = 'M300,1170C280,1110 420,1110 550,1110C690,1110 820,1100 820,1190C830,1300 790,1395 600,1395C430,1398 330,1380 305,1300C290,1255 312,1215 300,1170Z';
  arms.forEach(function (a) { mk('line', { x1: a[0], y1: a[1], x2: a[2], y2: a[3], stroke: '#1c1512', 'stroke-width': 128, 'stroke-linecap': 'round' }); });
  mk('path', { d: body, fill: '#1c1512', stroke: '#1c1512', 'stroke-width': 8, 'stroke-linejoin': 'round' });
  arms.forEach(function (a) { mk('line', { x1: a[0], y1: a[1], x2: a[2], y2: a[3], stroke: '#f1e4c0', 'stroke-width': 120, 'stroke-linecap': 'round' }); });
  mk('path', { d: body, class: 'land' });

  mk('circle', { cx: C.x, cy: C.y, r: R_ROAD, class: 'ring road' });
  mk('circle', { cx: C.x, cy: C.y, r: R_FOOT, class: 'ring foot' });
  mk('circle', { cx: C.x, cy: C.y, r: R_CROWN, class: 'ring crown' });

  // place names: along the rings where no book sits, and beside the halls
  function arcText(id, r, a0, a1, sweep, txt, dy) {
    var p = onCircle(r, a0 * Math.PI / 180), q = onCircle(r, a1 * Math.PI / 180);
    mk('path', { id: id, d: 'M' + p.x + ',' + p.y + 'A' + r + ',' + r + ' 0 0 ' + sweep + ' ' + q.x + ',' + q.y, fill: 'none' }, defs);
    var t = mk('text', { class: 'place', dy: dy || 0 });
    var tp = mk('textPath', { href: '#' + id, startOffset: '50%', 'text-anchor': 'middle' }, t);
    tp.textContent = txt;
  }
  arcText('arc-road', R_ROAD, 150, 30, 0, 'The ring road', -14);
  arcText('arc-foot', R_FOOT, -32, 58, 1, 'The foot of Mount Phyle', -12);
  arcText('arc-crown', R_CROWN, -160, -20, 1, 'The crown', -10);
  function place(x, y, txt, anchor) { var t = mk('text', { x: x, y: y, class: 'place', 'text-anchor': anchor || 'middle' }); t.textContent = txt; }
  place(NODES.ptp.x, NODES.ptp.y + 52, 'The Chamber');
  place(NODES.vr.x, NODES.vr.y + 52, 'Schedia');
  place(F.x + 92, F.y + 46, 'The hall of two doors', 'start');
  place(560, 1386, "The scholars' coast");
  var isA = mk('text', { x: 965, y: 66, class: 'isle', 'text-anchor': 'end' }); isA.textContent = 'ARCHE';
  var isP = mk('text', { x: 40, y: 1240, class: 'isle' }); isP.textContent = 'PAXOS';

  var gEdges = mk('g', {}), gStitch = mk('g', {}), gNodes = mk('g', {}), gWalls = mk('g', {}), gLabels = mk('g', {});

  EDGES.forEach(function (e) {
    e.glow = mk('path', { d: e.d(), class: 'edge-glow' }, gEdges);
    e.el = mk('path', { d: e.d(), class: 'edge future' }, gEdges);
    var L = e.el.getTotalLength(), pt = e.el.getPointAtLength(L * (e.lt || 0.5));
    e.lab = mk('g', { class: 'elab' }, gLabels);
    e.labRect = mk('rect', { rx: 8, ry: 8, height: 36 }, e.lab);
    e.labText = mk('text', { x: pt.x, y: pt.y }, e.lab);
    e.lx = pt.x; e.ly = pt.y;
    if (e.side) { e.lx = pt.x + 190; }
    if (e.at) { e.lx = e.at[0]; e.ly = e.at[1]; }
  });

  var nodeOrder = [];
  Object.keys(NODES).forEach(function (id) {
    var n = NODES[id];
    var g = mk('g', { class: 'node future', 'data-id': id }, gNodes);
    mk('title', {}, g).textContent = n.t;
    n.halo = mk('rect', { class: 'halo', rx: 16, ry: 16 }, g);
    n.shade = mk('rect', { class: 'shade', rx: 11, ry: 11, fill: SET[n.s] }, g);
    n.pill = mk('rect', { class: 'pill', rx: 11, ry: 11 }, g);
    n.text = mk('text', { x: n.x, y: n.y }, g);
    n.g = g;
    nodeOrder.push(id);
  });

  Object.keys(WALLS).forEach(function (id, k) {
    var w = WALLS[id];
    var g = mk('g', { class: 'wall-tag future', 'data-id': id }, gWalls);
    var r = 17, pts = [];
    for (var j = 0; j < 8; j++) { var a = (j * 45 + 22.5) * Math.PI / 180; pts.push((w.x + r * Math.cos(a)).toFixed(1) + ',' + (w.y + r * Math.sin(a)).toFixed(1)); }
    mk('polygon', { points: pts.join(' '), class: 'oct' }, g);
    mk('text', { x: w.x, y: w.y + 1, class: 'num' }, g).textContent = String(k + 1);
    w.name = mk('g', { class: 'wname' }, g);
    w.nameRect = mk('rect', { rx: 6, ry: 6, height: 32, y: w.y - 16, x: w.x + 22 }, w.name);
    w.nameText = mk('text', { x: w.x + 32, y: w.y + 1 }, w.name);
    w.g = g;
  });

  var stitch = mk('path', { class: 'stitch' }, gStitch);

  function setLabels() {
    nodeOrder.forEach(function (id) {
      var n = NODES[id];
      n.text.textContent = n[reg];
      var w = Math.max(n.text.getComputedTextLength() + 30, 92), h = 46;
      n.w = w; n.h = h;
      n.pill.setAttribute('x', n.x - w / 2); n.pill.setAttribute('y', n.y - h / 2);
      n.pill.setAttribute('width', w); n.pill.setAttribute('height', h);
      n.shade.setAttribute('x', n.x - w / 2 + 5); n.shade.setAttribute('y', n.y - h / 2 + 6);
      n.shade.setAttribute('width', w); n.shade.setAttribute('height', h);
      n.halo.setAttribute('x', n.x - w / 2 - 9); n.halo.setAttribute('y', n.y - h / 2 - 9);
      n.halo.setAttribute('width', w + 18); n.halo.setAttribute('height', h + 18);
    });
    EDGES.forEach(function (e) {
      e.labText.textContent = e[reg];
      e.labText.setAttribute('x', e.lx); e.labText.setAttribute('y', e.ly);
      var w = e.labText.getComputedTextLength() + 24;
      e.labRect.setAttribute('x', e.lx - w / 2); e.labRect.setAttribute('y', e.ly - 18); e.labRect.setAttribute('width', w);
    });
    Object.keys(WALLS).forEach(function (id) {
      var w = WALLS[id];
      w.nameText.textContent = w[reg];
      w.nameRect.setAttribute('width', w.nameText.getComputedTextLength() + 20);
    });
  }

  /* ---------- the steps, and what each one lights ---------- */
  var steps = Array.prototype.slice.call(document.querySelectorAll('.step, .part-head'));
  var walkIndex = {}, k = 0;
  steps.forEach(function (s) {
    if (s.dataset.kind === 'book') walkIndex[s.dataset.node] = k++;
    if (s.dataset.kind === 'thread') {
      var lis = s.querySelectorAll('.forms li[data-n]');
      s._nodes = Array.prototype.map.call(lis, function (li) { return li.getAttribute('data-n'); });
    } else if (s.dataset.nodes) s._nodes = s.dataset.nodes.split(/\s+/);
  });
  var wallAt = {};               // a wall shows from the step that raises it
  steps.forEach(function (s) { if (s.dataset.walls) s.dataset.walls.split(/\s+/).forEach(function (w) { if (!(w in wallAt)) wallAt[w] = walkIndex[s.dataset.node]; }); });

  function cls(el, on) { el.setAttribute('class', on); }

  function render(step) {
    var kind = step ? (step.dataset.kind || 'overview') : 'cover';
    var upto = kind === 'book' ? walkIndex[step.dataset.node] : (kind === 'intro' || kind === 'cover' ? -1 : 99);
    var onEdges = kind === 'book' && step.dataset.edges ? step.dataset.edges.split(/\s+/) : [];
    var members = step && step._nodes ? step._nodes : null;
    var focus = [];

    nodeOrder.forEach(function (id) {
      var n = NODES[id], seen = walkIndex[id] <= upto, c = 'node';
      if (!seen) c += ' future';
      if (kind === 'book' && id === step.dataset.node) { c += ' on'; focus.push(id); }
      if (members) {
        if (members.indexOf(id) >= 0) { c += kind === 'wall' ? ' wl' : ' hl'; focus.push(id); }
        else c += ' dim';
      }
      cls(n.g, c);
    });
    EDGES.forEach(function (e) {
      var seen = walkIndex[e.a] <= upto && walkIndex[e.b] <= upto, on = onEdges.indexOf(e.id) >= 0;
      var c = 'edge' + (seen ? '' : ' future') + (on ? ' on' : '') + (members && !on ? ' dim' : '');
      cls(e.el, c);
      cls(e.glow, 'edge-glow' + (on ? ' on' : ''));
      cls(e.lab, 'elab' + (on && !e.hide ? ' on' : ''));
      if (on) { focus.push(e.a); focus.push(e.b); }
    });
    Object.keys(WALLS).forEach(function (id) {
      var w = WALLS[id], shown = upto >= wallAt[id], c = 'wall-tag';
      if (!shown) c += ' future';
      var on = (kind === 'wall' && step.dataset.wall === id) ||
               (kind === 'book' && step.dataset.walls && step.dataset.walls.split(/\s+/).indexOf(id) >= 0);
      if (on) c += ' on'; else if (members) c += ' dim';
      cls(w.g, c);
    });
    if (kind === 'thread' && members && members.length > 1) {
      stitch.setAttribute('d', spline(members.slice().sort(function (a, b) { return walkIndex[a] - walkIndex[b]; })));
      cls(stitch, 'stitch on');
    } else cls(stitch, 'stitch');

    steps.forEach(function (s) { s.classList.toggle('on', s === step); });
    aim(kind === 'book' || members ? focus : null, kind === 'wall' ? WALLS[step.dataset.wall] : null);
  }

  function spline(ids) {             // a Catmull-Rom curve through the members, like a thread drawn through them
    var p = ids.map(function (id) { return NODES[id]; });
    var d = 'M' + p[0].x + ',' + p[0].y;
    for (var i = 0; i < p.length - 1; i++) {
      var p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
      d += 'C' + (p1.x + (p2.x - p0.x) / 6) + ',' + (p1.y + (p2.y - p0.y) / 6) + ' ' +
           (p2.x - (p3.x - p1.x) / 6) + ',' + (p2.y - (p3.y - p1.y) / 6) + ' ' + p2.x + ',' + p2.y;
    }
    return d;
  }

  /* ---------- the camera ---------- */
  var cam = { x: FULL.x, y: FULL.y, w: FULL.w, h: FULL.h }, anim = null;
  function aspect() { var r = svg.getBoundingClientRect(); return r.height ? r.width / r.height : 0.7; }
  function fit(box) {
    var a = aspect(), minW = narrow.matches ? 600 : 860;
    var w = Math.max(box.w, minW), h = Math.max(box.h, minW / a);
    if (w / h < a) w = h * a; else h = w / a;
    var cx = box.x + box.w / 2, cy = box.y + box.h / 2;
    var full = fitFull();
    if (w >= full.w || h >= full.h) return full;
    var x = Math.min(Math.max(cx - w / 2, full.x), full.x + full.w - w);
    var y = Math.min(Math.max(cy - h / 2, full.y), full.y + full.h - h);
    return { x: x, y: y, w: w, h: h };
  }
  function fitFull() {
    var a = aspect(), w = FULL.w, h = FULL.h;
    if (w / h < a) w = h * a; else h = w / a;
    return { x: FULL.x + FULL.w / 2 - w / 2, y: FULL.y + FULL.h / 2 - h / 2, w: w, h: h };
  }
  function aim(ids, wall) {
    var box;
    if (!ids || !ids.length) box = fitFull();
    else {
      var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      ids.forEach(function (id) { var n = NODES[id]; x0 = Math.min(x0, n.x - n.w / 2); x1 = Math.max(x1, n.x + n.w / 2); y0 = Math.min(y0, n.y - 30); y1 = Math.max(y1, n.y + 30); });
      if (wall) { x0 = Math.min(x0, wall.x - 24); x1 = Math.max(x1, wall.x + 230); }
      var pad = 46;
      box = fit({ x: x0 - pad, y: y0 - pad, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad });
    }
    go(box);
  }
  function go(box) {
    if (reduce) { cam = box; setVB(); return; }
    var from = { x: cam.x, y: cam.y, w: cam.w, h: cam.h }, t0 = performance.now(), dur = 700;
    if (anim) cancelAnimationFrame(anim);
    (function tick(now) {
      var t = Math.min((now - t0) / dur, 1), e = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      cam = { x: from.x + (box.x - from.x) * e, y: from.y + (box.y - from.y) * e, w: from.w + (box.w - from.w) * e, h: from.h + (box.h - from.h) * e };
      setVB();
      if (t < 1) anim = requestAnimationFrame(tick); else anim = null;
    })(t0);
  }
  function setVB() { svg.setAttribute('viewBox', cam.x.toFixed(1) + ' ' + cam.y.toFixed(1) + ' ' + cam.w.toFixed(1) + ' ' + cam.h.toFixed(1)); }

  /* ---------- following the scroll ---------- */
  var current = undefined, ticking = false, prog = document.getElementById('prog');
  function readLine() { return innerHeight * (narrow.matches ? 0.7 : 0.5); }
  function pick() {
    ticking = false;
    var L = readLine(), active = null;
    for (var i = 0; i < steps.length; i++) {
      if (steps[i].getBoundingClientRect().top <= L) active = steps[i]; else break;
    }
    if (active !== current) { current = active; render(active); }
    var doc = document.documentElement, max = doc.scrollHeight - innerHeight;
    if (prog) prog.style.width = (max > 0 ? 100 * scrollY / max : 0) + '%';
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(pick); } }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', function () { current = undefined; onScroll(); });

  function goTo(el) {
    var y = el.getBoundingClientRect().top + scrollY - readLine() + 24;
    scrollTo({ top: Math.max(0, y), behavior: reduce ? 'auto' : 'smooth' });
  }
  gNodes.addEventListener('click', function (ev) {
    var g = ev.target.closest('.node'); if (!g) return;
    var st = document.querySelector('.step[data-node="' + g.getAttribute('data-id') + '"]');
    if (st) goTo(st);
  });
  // links inside the steps (the "one change from" line) land the step on the reading line
  document.querySelector('.steps').addEventListener('click', function (ev) {
    var a = ev.target.closest('a[href^="#"]'); if (!a) return;
    var el = document.getElementById(a.getAttribute('href').slice(1)); if (!el) return;
    ev.preventDefault(); goTo(el);
    if (history.replaceState) history.replaceState(null, '', a.getAttribute('href'));
  });
  // a thread's list: pointing at a book lights it on the chart
  document.querySelectorAll('.forms li[data-n]').forEach(function (li) {
    li.addEventListener('mouseenter', function () { li.classList.add('hot'); var n = NODES[li.dataset.n]; if (n) n.g.classList.add('on'); });
    li.addEventListener('mouseleave', function () { li.classList.remove('hot'); var n = NODES[li.dataset.n]; if (n) n.g.classList.remove('on'); });
  });

  /* ---------- the two registers ---------- */
  var KEY = 'daag-apart-reg';
  var buttons = document.querySelectorAll('.segb');
  function setReg(r, keepPlace) {
    var anchor = current, before = anchor ? anchor.getBoundingClientRect().top : 0;
    reg = r; document.body.setAttribute('data-reg', r);
    buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.reg === r)); });
    setLabels();
    if (keepPlace && anchor) scrollBy(0, anchor.getBoundingClientRect().top - before);
    current = undefined; onScroll();
  }
  buttons.forEach(function (b) {
    b.addEventListener('click', function () { setReg(b.dataset.reg, true); try { localStorage.setItem(KEY, b.dataset.reg); } catch (e) {} });
  });

  // the book's short name beside each form in a thread's list
  document.querySelectorAll('.forms li[data-n]').forEach(function (li) {
    var n = NODES[li.dataset.n]; if (!n || li.querySelector('b')) return;
    var b = document.createElement('b');
    b.innerHTML = '<span class="i">' + n.i + '</span><span class="m">' + n.m + '</span>';
    li.insertBefore(b, li.firstChild);
  });

  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  setReg(saved === 'm' ? 'm' : 'i', false);
  cam = fitFull(); setVB();
  onScroll();
  if (narrow.addEventListener) narrow.addEventListener('change', function () { current = undefined; onScroll(); });
})();
