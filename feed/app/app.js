"use strict";
/* The feed. Cards arrive from /api/state, written by the agent of the session and checked by the server;
   this page only shows them. Every word of a card is set with textContent, every figure is drawn from its
   declarative marks (figures.js), and the only things sent back are the whitelisted events of /api/event. */
(function () {
const NS = "http://www.w3.org/2000/svg";
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const Q = new URLSearchParams(location.search);
const QUIET = Q.has("quiet") || Q.has("answer");     // test hooks: show things, report nothing
const feed = document.getElementById("feed");
const $ = (s, r = document) => r.querySelector(s);

const ICON = {
  heart: "M12 20.5s-7.5-4.8-9.6-9.4A5.4 5.4 0 0 1 12 6.4a5.4 5.4 0 0 1 9.6 4.7c-2.1 4.6-9.6 9.4-9.6 9.4z",
  save: "M6 3h12v18l-6-4.5L6 21z",
  less: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM6 6l12 12",
  arrow: "M5 12h14M13 6l6 6-6 6",
};
function icon(name) {
  const s = document.createElementNS(NS, "svg"), p = document.createElementNS(NS, "path");
  s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true"); p.setAttribute("d", ICON[name]); s.appendChild(p);
  return s;
}
function h(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

const S = {
  session: null, since: 0, books: {}, el: new Map(), cards: new Map(),
  listening: false, writing: false, waited: 0, offline: false,
  streak: 0, today: 0, met: 0, saved: new Set(),
  cur: null, last: performance.now(), dwell: new Map(), sent: new Map(), seen: new Set(), dirty: new Set(), shownAt: new Map(),
  onTail: false, firstLoad: true,
};
const Qe = [];                                        // events waiting to be sent
let flushTimer = 0;
function ev(e) { if (!QUIET) { Qe.push(e); } }
function scheduleFlush(ms) { if (!flushTimer) flushTimer = setTimeout(flush, ms); }
function post(events) {
  return fetch("/api/event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ events }), keepalive: true })
    .then(r => (r.ok ? r.json() : null)).catch(() => null);
}
function collect() {
  if (S.cur && S.cur.dataset.id) S.dirty.add(S.cur.dataset.id);
  for (const id of S.dirty) {
    const ms = Math.round(S.dwell.get(id) || 0), sent = S.sent.get(id);
    if (sent === undefined || ms > sent) { ev({ type: "seen", card: id, dwell_ms: ms }); S.sent.set(id, ms); }
  }
  S.dirty.clear();
}
function flush() {
  flushTimer = 0;
  collect();
  if (Qe.length && !QUIET) post(Qe.splice(0, 50));
}
setInterval(flush, 3000);
document.addEventListener("visibilitychange", () => { if (document.hidden) flush(); });
addEventListener("pagehide", flush);

/* ---------------------------------------------------------------- the status bar */

function paintBar() {
  $("#st-streak b").textContent = S.streak;
  $("#st-streak").classList.toggle("hot", S.streak >= 3);
  $("#st-today b").textContent = S.today;
  $("#st-met b").textContent = S.met;
  const state = S.offline || !S.listening ? "away" : S.writing ? "writing" : "listening";
  const live = $("#live");
  live.dataset.s = state;
  $("#live-t").textContent = state === "away" ? "not listening" : state;
  $("#savedbtn b").textContent = S.saved.size;
  paintTail();
}

/* ---------------------------------------------------------------- the card */

function railButton(cls, label, name, pressed, fn) {
  const b = h("button", cls);
  b.type = "button"; b.setAttribute("aria-label", label); b.setAttribute("aria-pressed", pressed ? "true" : "false");
  b.appendChild(icon(name)); b.addEventListener("click", fn);
  return b;
}
function chip(text, cls, dot) {
  const c = h("span", "chip" + (cls ? " " + cls : ""));
  if (dot) c.appendChild(h("i"));
  c.appendChild(document.createTextNode(text));
  return c;
}
function makeCard(c, opts) {
  opts = opts || {};
  const b = S.books[c.book] || { title: c.book, label: "", colour: "#6b5a48" };
  const mine = c.mine || {};
  const sec = h("section", "card k-" + c.kind + " r-" + c.register);
  sec.id = (opts.viewer ? "v-" : "card-") + c.id;
  sec.dataset.id = c.id; sec.dataset.seq = c.seq;
  sec.style.setProperty("--tint", /^#[0-9a-fA-F]{6}$/.test(b.colour) ? b.colour : "#6b5a48");
  sec.setAttribute("aria-label", c.hook.replace(/\n/g, " "));
  if (c.kind === "picture" && c.image) {
    const bg = h("div", "bg"), img = document.createElement("img");
    img.src = "/" + c.image.src.split("/").map(encodeURIComponent).join("/");
    img.alt = c.image.alt || ""; img.decoding = "async"; img.loading = opts.viewer || c.seq <= 3 ? "eager" : "lazy";
    bg.appendChild(img); sec.appendChild(bg);
  }
  const top = h("div", "top"), chips = h("div", "chips");
  chips.append(chip(b.label, "setting", true), chip(c.register === "story" ? "On the islands" : "In the machine room", "reg"));
  if (c.series) chips.appendChild(chip(c.series.part + " of " + c.series.of, "series"));
  chips.appendChild(chip(b.title, "title"));
  top.appendChild(chips); sec.appendChild(top);

  const main = h("div", "main");
  main.appendChild(h("h2", "hook", c.hook));
  if (c.kind === "fact" || c.kind === "quiz") main.appendChild(h("div", "meander"));
  if (c.kind === "figure" && c.figure) {
    const wrap = h("div", "fig-wrap"), node = window.Figures && Figures.draw(wrap, c.figure);
    if (node) { main.appendChild(wrap); sec.__fig = node; } else wrap.remove();
  }
  main.appendChild(h("p", "body", c.body));
  if (c.more) {
    const btn = h("button", "more-btn", "More"), more = h("p", "more", c.more);
    btn.type = "button"; btn.setAttribute("aria-expanded", "false"); more.hidden = true;
    btn.addEventListener("click", () => {
      const open = more.hidden; more.hidden = !open; btn.setAttribute("aria-expanded", open ? "true" : "false"); btn.textContent = open ? "Less" : "More";
      if (open) ev({ type: "more", card: c.id });
    });
    main.append(btn, more);
  }
  if (c.kind === "quiz" && c.quiz) main.appendChild(makeQuiz(c, sec, opts));
  sec.appendChild(main);

  const foot = h("div", "foot"), a = h("a", "read");
  a.href = "/books/" + encodeURIComponent(c.book) + "/index.html#" + encodeURIComponent(c.anchor);
  a.target = "_blank"; a.rel = "noopener";
  a.append(document.createTextNode("Read it in the book"), icon("arrow"));
  a.addEventListener("click", () => ev({ type: "open", card: c.id }));
  foot.appendChild(a); sec.appendChild(foot);

  if (!opts.viewer) {
    const rail = h("div", "rail");
    rail.append(
      railButton("like", "Like this card", "heart", mine.liked, e => setLike(c, sec, e.currentTarget.getAttribute("aria-pressed") !== "true")),
      railButton("save", "Save this card", "save", mine.saved, e => setSave(c, sec, e.currentTarget.getAttribute("aria-pressed") !== "true")),
      railButton("less", "Less like this", "less", mine.less, () => setLess(c, sec)));
    sec.appendChild(rail);
  }
  return sec;
}
function pressed(sec, cls, on) { const b = $("." + cls, sec); if (b) b.setAttribute("aria-pressed", on ? "true" : "false"); }
function setLike(c, sec, on, x, y) {
  pressed(sec, "like", on); ev({ type: "like", card: c.id, on });
  if (on && x !== undefined) burst(sec, x, y);
  sec.dataset.touched = "1";
}
function setSave(c, sec, on) {
  pressed(sec, "save", on); ev({ type: "save", card: c.id, on });
  if (on) S.saved.add(c.id); else S.saved.delete(c.id);
  paintBar(); sec.dataset.touched = "1";
  say(on ? "Saved." : "Removed from saved.");
}
function setLess(c, sec) { pressed(sec, "less", true); ev({ type: "less", card: c.id }); sec.dataset.touched = "1"; say("Noted. Fewer like this."); }
function say(t) { const a = $("#announce"); a.textContent = ""; setTimeout(() => { a.textContent = t; }, 30); }
function burst(sec, x, y) {
  if (reduce) return;
  const r = sec.getBoundingClientRect(), b = h("span", "burst");
  b.style.left = (x - r.left) + "px"; b.style.top = (y - r.top) + "px";
  b.appendChild(icon("heart")); sec.appendChild(b);
  setTimeout(() => b.remove(), 800);
}

/* a card whose words are taller than its box is compacted a step at a time, until it fits or there is nothing left to take */
function fit(sec) {
  const m = sec.querySelector(".main");
  if (!m || !sec.isConnected) return;
  sec.classList.remove("tight", "tighter", "tightest");
  for (const step of ["tight", "tighter", "tightest"]) {
    if (m.scrollHeight <= m.clientHeight + 1) break;
    sec.classList.add(step);
  }
}
let fitTimer = 0;
addEventListener("resize", () => { clearTimeout(fitTimer); fitTimer = setTimeout(() => { for (const el of S.el.values()) { fit(el); if (el.__fig) Figures.refit(el.__fig); } }, 150); });

/* a quiz: a tap marks right or wrong, shows the right one and the why, and moves the streak */
function makeQuiz(c, sec, opts) {
  const q = c.quiz, box = h("div", "quiz"), list = h("div", "opts");
  list.setAttribute("role", "group"); list.setAttribute("aria-label", "Answers");
  box.appendChild(h("p", "q", q.q));
  const res = h("div", "result"); res.hidden = true; res.setAttribute("aria-live", "polite");
  q.options.forEach((o, i) => {
    const b = h("button", "opt"); b.type = "button";
    b.append(h("b", "", "ABCD"[i]), document.createTextNode(o));
    b.addEventListener("click", () => answer(c, sec, i));
    list.appendChild(b);
  });
  box.append(list, res);
  sec.__quiz = { box, list, res };
  const done = opts.viewer ? q.answer : (c.mine ? c.mine.choice : null);
  if (done !== null && done !== undefined) setTimeout(() => showAnswer(c, sec, done, !!opts.viewer, false), 0);
  return box;
}
function showAnswer(c, sec, choice, review, fresh) {
  const { list, res } = sec.__quiz, q = c.quiz, right = choice === q.answer;
  sec.dataset.answered = "1";
  [...list.children].forEach((b, i) => {
    b.disabled = true;
    if (i === q.answer) b.classList.add("right");
    else if (i === choice && !right) b.classList.add("wrong");
    else b.classList.add("dim");
  });
  res.className = "result" + (right || review ? "" : " no");
  res.replaceChildren(h("strong", "", review ? "The answer" : right ? "Right" : "Not this time"), document.createTextNode(q.why));
  if (fresh) { const s = h("span", "streak", right ? "Streak: " + S.streak : "Streak back to 0. This one will come round again."); res.appendChild(s); }
  res.hidden = false;
  fit(sec);
}
function answer(c, sec, i) {
  const qz = sec.__quiz;
  if (!qz || sec.dataset.answered) return;
  sec.dataset.answered = "1"; sec.dataset.touched = "1";
  const right = i === c.quiz.answer, ms = Math.round(performance.now() - (S.shownAt.get(c.id) || performance.now()));
  S.streak = right ? S.streak + 1 : 0;
  showAnswer(c, sec, i, false, true); paintBar();
  if (!QUIET) post([{ type: "answer", card: c.id, choice: i, ms }]).then(r => { if (r && typeof r.streak === "number") { S.streak = r.streak; paintBar(); const s = $(".streak", qz.res); if (s && right) s.textContent = "Streak: " + S.streak; } });
}

/* ---------------------------------------------------------------- the end of the feed: writing, or away */

let tail = null;
function makeTail() {
  tail = h("section", "card tail"); tail.id = "tail"; tail.style.setProperty("--tint", "#6b5a48");
  const main = h("div", "main"); tail.dataset.s = "writing";
  const t = h("h2", "", "The writer is writing your next cards"), p = h("p", "", ""), code = h("p", "");
  t.id = "tail-t"; p.id = "tail-p";
  code.append(document.createTextNode("Type "), h("code", "", "/feed"), document.createTextNode(" in the terminal to carry on."));
  code.id = "tail-c";
  const sh = h("div", "shimmer"); sh.append(h("i"), h("i"), h("i")); sh.setAttribute("aria-hidden", "true");
  main.append(h("div", "meander"), t, p, code, sh);
  tail.append(main);
  feed.appendChild(tail);
  io.observe(tail);
}
function paintTail() {
  if (!tail) return;
  const away = S.offline || !S.listening;
  tail.dataset.s = away ? "away" : "writing";
  $("#tail-t").textContent = away ? "The writer has stepped out" : "The writer is writing your next cards";
  $("#tail-p").textContent = away ? "Your place is kept. The cards you have seen stay here." : S.waited > 60 ? "Still writing. A long batch takes a while." : "They land here the moment they are ready.";
  $("#tail-c").hidden = !away;
}

/* ---------------------------------------------------------------- what is on screen, and for how long */

const io = new IntersectionObserver(entries => {
  for (const e of entries) {
    if (e.isIntersecting && e.intersectionRatio >= .6) setCurrent(e.target);
    else if (e.target === S.cur && e.intersectionRatio < .45) setCurrent(null);
  }
}, { root: feed, threshold: [0, .45, .6, .8, 1] });

function setCurrent(el) {
  if (el === S.cur) return;
  const now = performance.now();
  if (S.cur && S.cur.dataset.id) { S.dirty.add(S.cur.dataset.id); }
  S.cur = el; S.last = now;
  S.onTail = !!(el && el === tail);
  if (el && el.dataset.id) {
    const id = el.dataset.id;
    if (!S.seen.has(id)) { S.seen.add(id); S.shownAt.set(id, now); S.dirty.add(id); scheduleFlush(350); }
    if (el.__fig && window.Figures) Figures.play(el.__fig);
  }
}
setInterval(() => {
  const now = performance.now();
  if (!document.hidden && S.cur && S.cur.dataset.id) S.dwell.set(S.cur.dataset.id, (S.dwell.get(S.cur.dataset.id) || 0) + (now - S.last));
  S.last = now;
}, 250);

/* a double tap is a like */
let lastTap = { t: 0, x: 0, y: 0 };
feed.addEventListener("pointerup", e => {
  if (e.target.closest("button, a, .more, .opt")) return;
  const sec = e.target.closest(".card");
  if (!sec || !sec.dataset.id) return;
  if (e.timeStamp - lastTap.t < 330 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 45) {
    const c = S.cards.get(sec.dataset.id);
    if (c) { const btn = $(".like", sec); if (btn && btn.getAttribute("aria-pressed") !== "true") setLike(c, sec, true, e.clientX, e.clientY); else burst(sec, e.clientX, e.clientY); }
    lastTap.t = 0;
  } else lastTap = { t: e.timeStamp, x: e.clientX, y: e.clientY };
});

/* the keys: arrows, j and k, and space move one card at a time */
function go(d) {
  const items = [...feed.children], i = Math.round(feed.scrollTop / Math.max(1, feed.clientHeight));
  const t = items[Math.max(0, Math.min(items.length - 1, i + d))];
  if (t) t.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}
document.addEventListener("keydown", e => {
  if (e.altKey || e.ctrlKey || e.metaKey || $("#drawer").classList.contains("open")) return;
  if (e.target.closest && e.target.closest("input, textarea, select")) return;
  const onButton = e.target.closest && e.target.closest("button, a");
  if (e.key === "ArrowDown" || e.key === "j" || e.key === "PageDown" || (e.key === " " && !e.shiftKey && !onButton)) { e.preventDefault(); go(1); }
  else if (e.key === "ArrowUp" || e.key === "k" || e.key === "PageUp" || (e.key === " " && e.shiftKey && !onButton)) { e.preventDefault(); go(-1); }
});

/* ---------------------------------------------------------------- the saved drawer */

const drawer = $("#drawer"), sbtn = $("#savedbtn");
function openDrawer(on) {
  drawer.classList.toggle("open", on); drawer.setAttribute("aria-hidden", on ? "false" : "true"); sbtn.setAttribute("aria-expanded", on ? "true" : "false");
  if (!on) { $("#viewer").hidden = true; return; }
  fetch("/api/saved").then(r => r.json()).then(list => {
    const ul = $("#saved-list"); ul.replaceChildren();
    $("#saved-none").hidden = list.length > 0;
    list.forEach(c => {
      const li = h("li"), b = h("button"), bk = S.books[c.book] || { title: c.book, colour: "#6b5a48" };
      b.type = "button"; b.style.setProperty("--tint", bk.colour);
      const m = h("span", "m"); m.append(h("i"), document.createTextNode(bk.title));
      b.append(h("span", "h", c.hook.replace(/\n/g, " ")), m);
      b.addEventListener("click", () => openViewer(c));
      li.appendChild(b); ul.appendChild(li);
    });
  }).catch(() => {});
}
function openViewer(c) {
  const v = $("#viewer"), x = h("button", "vx", "Close"); x.type = "button";
  x.addEventListener("click", () => { v.hidden = true; });
  v.replaceChildren(makeCard({ ...c, mine: {} }, { viewer: true }), x); v.hidden = false;
  const sec = v.firstChild; if (sec.__fig && window.Figures) { Figures.refit(sec.__fig); Figures.play(sec.__fig); }
  fit(sec);
}
sbtn.addEventListener("click", () => openDrawer(!drawer.classList.contains("open")));
$("#drawer-x").addEventListener("click", () => openDrawer(false));
document.addEventListener("keydown", e => { if (e.key === "Escape" && drawer.classList.contains("open")) openDrawer(false); });

/* ---------------------------------------------------------------- the state, every two seconds */

function addCards(list) {
  const added = [];
  for (const c of list) {
    if (S.cards.has(c.id)) continue;
    S.cards.set(c.id, c);
    const el = makeCard(c);
    feed.insertBefore(el, tail);
    S.el.set(c.id, el); io.observe(el);
    if (c.mine && c.mine.saved) S.saved.add(c.id);
    added.push(el);
  }
  for (const el of added) {                           // measured once they are all in, so each look costs one layout
    if (el.__fig) Figures.refit(el.__fig);
    fit(el);
  }
  return added;
}
function apply(d) {
  if (S.session && d.session !== S.session) { location.reload(); return; }
  S.session = d.session; S.offline = false;
  S.listening = d.listening; S.writing = d.writing; S.waited = d.waited;
  S.streak = d.streak; S.today = d.today; S.met = d.booksMet;
  d.saved.forEach(id => S.saved.add(id));
  const wasTail = S.onTail;
  const added = addCards(d.cards);
  if (d.cards.length) S.since = Math.max(S.since, ...d.cards.map(c => c.seq));
  paintBar();
  if (added.length && wasTail && !S.firstLoad) added[0].scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  if (S.firstLoad) { S.firstLoad = false; hooks(); }
}
function hooks() {                                       // test hooks, harmless and off by default
  const id = Q.get("card"), n = Q.get("answer");
  const el = id && S.el.get(id);
  if (el) el.scrollIntoView({ behavior: "auto", block: "start" });
  if (Q.has("tail") && tail) tail.scrollIntoView({ behavior: "auto", block: "start" });
  if (el && n !== null && S.cards.get(id).quiz) { const i = Math.max(0, Math.min(3, +n || 0)); el.dataset.answered = ""; answer(S.cards.get(id), el, i); }
  if (Q.has("saved")) openDrawer(true);
}
async function poll() {
  try {
    const r = await fetch("/api/state?since=" + S.since, { cache: "no-store" });
    if (!r.ok) throw new Error(String(r.status));
    apply(await r.json());
  } catch { S.offline = true; paintBar(); }
  setTimeout(poll, 2000);
}
async function start() {
  makeTail();
  try { const m = await (await fetch("/api/books")).json(); S.books = m.books || {}; } catch { /* the cards still show, without titles */ }
  poll();
}
start();
window.__feed = { S, go, flush, poll };                  // for the tests; nothing here is a way in
})();
