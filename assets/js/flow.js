/* Time flowing outward through a round space-time diagram (svg.flow, built by art/diagrams/polar.py).
   A wavefront ring sweeps out from the houses at a steady pace, with echoes rippling behind it.
   Marks inside <g class="tflow"> appear as it passes; labels fade in beside them, and each event
   sends out a small ripple. The sweep plays once, then rests with a Replay button.
   Without JS, or with reduced motion, the whole diagram simply shows. */
(function () {
  var NS = "http://www.w3.org/2000/svg";
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SWEEP = 9000;                                   // ms
  var INK = "#1c1512";

  function mk(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    parent.appendChild(e);
    return e;
  }

  function setup(svg) {
    var panels = [];
    svg.querySelectorAll("clipPath > circle.tclip").forEach(function (clip) {
      var cx = +clip.getAttribute("cx"), cy = +clip.getAttribute("cy");
      var r0 = +clip.getAttribute("data-r0"), r1 = +clip.getAttribute("data-r1");
      var groups = svg.querySelectorAll('g.tflow[clip-path="url(#' + clip.parentNode.id + ')"]');
      var g = mk("g", { "pointer-events": "none", fill: "none" }, svg);
      var waves = [0, 1, 2].map(function (i) {
        return mk("circle", { cx: cx, cy: cy, r: r0, stroke: INK, "stroke-width": i ? 1 : 1.6,
                              "stroke-opacity": 0, "stroke-linecap": "round" }, g);
      });
      var events = [], labels = [];
      groups.forEach(function (gr) {
        gr.querySelectorAll("text").forEach(function (t) {     // labels fade in, unclipped
          var x = +t.getAttribute("x"), y = +t.getAttribute("y");
          var box = t.getBBox(), lx = box.x + box.width / 2, ly = box.y + box.height / 2;
          t.parentNode.removeChild(t);
          g.appendChild(t);
          labels.push({ d: Math.hypot(lx - cx, ly - cy) - 8, el: t, at: null });
        });
        gr.querySelectorAll("circle.d-ev, circle.d-ev-hi").forEach(function (c) {
          var d = Math.hypot(+c.getAttribute("cx") - cx, +c.getAttribute("cy") - cy);
          var p = mk("circle", { cx: c.getAttribute("cx"), cy: c.getAttribute("cy"), r: 0, "stroke-opacity": 0,
                                 stroke: c.classList.contains("d-ev-hi") ? "#bf4a26" : INK, "stroke-width": 1.4 }, g);
          events.push({ d: d, el: p, at: null });
        });
      });
      panels.push({ clip: clip, r0: r0, r1: r1, waves: waves, events: events, labels: labels, groups: groups });
    });
    return panels;
  }

  function frame(panels, elapsed) {
    var sweep = Math.min(elapsed / SWEEP, 1);
    panels.forEach(function (P) {
      var rr = P.r0 + (P.r1 - P.r0) * sweep;
      P.clip.setAttribute("r", rr);
      P.labels.forEach(function (lb) {
        if (lb.at === null && rr >= lb.d) lb.at = elapsed;
        lb.el.style.opacity = lb.at === null ? 0 : Math.min((elapsed - lb.at) / 500, 1);
      });
      var live = sweep < 1 ? 1 : 0;
      P.waves.forEach(function (w, i) {
        var lag = i * 9, r = Math.max(P.r0, rr - lag);
        var wob = Math.sin(elapsed / 140 - i * 1.4) * 1.2 * live;     // the ripple's shimmer
        w.setAttribute("r", r + wob);
        w.setAttribute("stroke-opacity", live * (0.75 - i * 0.28) * (1 - sweep * sweep));
      });
      P.events.forEach(function (ev) {
        if (ev.at === null && rr >= ev.d) ev.at = elapsed;
        var age = ev.at === null ? -1 : (elapsed - ev.at) / 1100;
        if (age < 0 || age > 1) { ev.el.setAttribute("stroke-opacity", 0); return; }
        ev.el.setAttribute("r", 4 + 22 * age);
        ev.el.setAttribute("stroke-opacity", 0.7 * (1 - age));
      });
    });
  }

  function reset(panels) {
    panels.forEach(function (P) {
      P.events.forEach(function (e) { e.at = null; });
      P.labels.forEach(function (l) { l.at = null; });
    });
  }

  function run(svg) {
    var panels = setup(svg), start = null, visible = false, raf = 0, played = false;
    var host = svg.parentNode;
    if (getComputedStyle(host).position === "static") host.style.position = "relative";
    var btn = document.createElement("button");
    btn.type = "button"; btn.className = "flow-replay"; btn.textContent = "\u21BB Replay";
    host.appendChild(btn);

    function tick(now) {
      raf = 0;
      if (start === null) start = now;
      var el = now - start;
      frame(panels, el);
      if (el < SWEEP) raf = requestAnimationFrame(tick);
      else btn.classList.add("ready");
    }
    function play() {
      if (raf) cancelAnimationFrame(raf);
      btn.classList.remove("ready");
      reset(panels); start = null; played = true;
      raf = requestAnimationFrame(tick);
    }
    btn.addEventListener("click", play);
    frame(panels, 0);
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting && !played) play();          // first time in view
    }, { threshold: 0.25 }).observe(svg);
  }

  if (reduce || !window.IntersectionObserver) return;
  document.querySelectorAll("svg.flow").forEach(run);
})();
