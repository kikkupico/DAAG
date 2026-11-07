import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadBook, click, shown, ROOT, BOOKS } from "./harness.js";

const open = (reg = "m") => loadBook("eighteen-books-in-one-scroll", { reg });
const q = b => s => b.document.querySelector(s);
const all = (b, s) => [...b.document.querySelectorAll(s)];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const until = async (f, ms = 6000) => { const t = Date.now(); while (!f()) { if (Date.now() - t > ms) throw new Error("timed out"); await sleep(5); } };
const set = (b, sel, on) => { const e = b.document.querySelector(sel); if (e.checked !== on) click(e); };

describe("eighteen-books-in-one-scroll: the register switch", () => {
  it("starts in the saved register and flips with the buttons", async () => {
    const b = await open("i");
    expect(b.document.body.getAttribute("data-reg")).toBe("i");
    click(b.document.querySelector('.segb[data-reg="m"]'));
    expect(b.document.body.getAttribute("data-reg")).toBe("m");
    expect(b.document.querySelector('.segb[data-reg="m"]').getAttribute("aria-pressed")).toBe("true");
    expect(b.window.localStorage.getItem("daag-apart-reg")).toBe("m");
    b.close();
  });
});

describe("eighteen-books-in-one-scroll: the tallies", () => {
  const num = (b, h) => +all(b, "#tally .th")[h].querySelector(".num").textContent;
  const entry = (b, h) => click(all(b, "#tally .th")[h].querySelector(".entry"));
  const send = (b, h, to) => click(all(b, "#tally .th")[h].querySelector(`[data-to="${to}"]`));
  it("a local event adds one", async () => {
    const b = await open(); entry(b, 0); entry(b, 0); entry(b, 1);
    expect([num(b, 0), num(b, 1), num(b, 2)]).toEqual([2, 1, 0]); b.close();
  });
  it("a message carries the sender's count and the receiver jumps past it", async () => {
    const b = await open();
    entry(b, 0); entry(b, 0); entry(b, 0); send(b, 0, 1);          // house 1 is at 4 and sends 4
    expect(num(b, 0)).toBe(4);
    await until(() => num(b, 1) > 0);
    expect(num(b, 1)).toBe(5);
    expect(shown(all(b, "#tally .th")[1].querySelector(".note"))).toBe("max(0, 4) + 1 = 5");
    b.close();
  });
  it("a receiver already ahead only advances by one", async () => {
    const b = await open();
    for (let i = 0; i < 6; i++) entry(b, 1);                       // house 2 at 6
    entry(b, 0); send(b, 0, 1);                                    // carries 2
    await until(() => num(b, 1) > 6);
    expect(num(b, 1)).toBe(7); expect(shown(all(b, "#tally .th")[1].querySelector(".note"))).toBe("max(6, 2) + 1 = 7");
    b.close();
  });
  it("the order list sorts events by count, then by house, and reset clears everything", async () => {
    const b = await open();
    entry(b, 2); entry(b, 0); entry(b, 1); entry(b, 0);
    const items = all(b, "#tallyOrder li").map(shown);
    expect(items.map(s => s.match(/\((\d+), p(.)\)/).slice(1).join(","))).toEqual(["1,₁", "1,₂", "1,₃", "2,₁"]);
    click(b.document.querySelector("#tallyReset"));
    expect([0, 1, 2].map(h => num(b, h))).toEqual([0, 0, 0]);
    expect(shown(b.document.querySelector("#tallyOrder"))).toMatch(/Make an event, or send a message/);
    expect(b.errors).toEqual([]); b.close();
  });
});

describe("eighteen-books-in-one-scroll: the coins", () => {
  it("starts as a 2-2 split with nobody sure", async () => {
    const b = await open();
    expect(shown(b.document.querySelector("#coinStatus"))).toMatch(/2–2 split/);
    expect(all(b, "#coins .bcoin.sure")).toHaveLength(0); b.close();
  });
  it("flipping until the split breaks always ends with a strict majority deciding", async () => {
    const b = await open(); const $ = q(b);
    for (let trial = 0; trial < 10; trial++) {
      let n = 0;
      while (!/decides/.test(shown($("#coinStatus"))) && n++ < 200) { click($("#coinGo")); await sleep(3); }
      expect(shown($("#coinStatus"))).toMatch(/strict majority for ([01]).*decides \1/);
      const sure = all(b, "#coins .bcoin.sure").length;
      expect(sure === 3 || sure === 4).toBe(true);
      click($("#coinGo")); await sleep(3);                         // "New trial"
      expect(shown($("#coinStatus"))).toMatch(/2–2 split/);
    }
    expect(b.errors).toEqual([]); b.close();
  });
  it("a thousand trials all terminate, with the geometric mean near 1.6 flips", async () => {
    const b = await open(); click(b.document.querySelector("#coinMany"));
    const bars = all(b, "#coinHist .bar2"); expect(bars).toHaveLength(5);
    const pct = all(b, "#coinHist > span").filter((_, i) => i % 2 === 1).map(s => parseFloat(s.textContent));
    expect(pct.reduce((a, c) => a + c, 0)).toBeGreaterThan(99.5); expect(pct[0]).toBeGreaterThan(50);
    const mean = +shown(b.document.querySelector("#coinHist .hcap")).match(/mean ([\d.]+)/)[1];
    expect(mean).toBeGreaterThan(1.3); expect(mean).toBeLessThan(2.0);
    b.close();
  });
});

describe("eighteen-books-in-one-scroll: answer, or answer as one", () => {
  const say = b => shown(b.document.querySelector("#capStatus"));
  it("without a cut-off both are possible", async () => {
    const b = await open(); set(b, "#capCut", false); set(b, "#capAvail", true); set(b, "#capCons", true);
    expect(say(b)).toMatch(/available and linearizable/); b.close();
  });
  it("cut off, answering locally is available but not consistent", async () => {
    const b = await open(); set(b, "#capCut", true); set(b, "#capCons", false); set(b, "#capAvail", true);
    expect(say(b)).toMatch(/available, not consistent/); b.close();
  });
  it("cut off, keeping one copy is consistent but not available", async () => {
    const b = await open(); set(b, "#capCut", true); set(b, "#capAvail", false); set(b, "#capCons", true);
    expect(say(b)).toMatch(/consistent, not available/); b.close();
  });
  it("cut off, neither switch gives neither", async () => {
    const b = await open(); set(b, "#capCut", true); set(b, "#capAvail", false); set(b, "#capCons", false);
    expect(say(b)).toMatch(/Neither available nor consistent/); b.close();
  });
  it("cut off, turning on the second switch turns the first one off, with an explanation", async () => {
    const b = await open(); const $ = q(b);
    set(b, "#capCut", true); set(b, "#capCons", false); set(b, "#capAvail", true);
    click($("#capCons"));
    expect([$("#capAvail").checked, $("#capCons").checked]).toEqual([false, true]);
    expect(say(b)).toMatch(/Not under partition/);
    set(b, "#capCut", false); click($("#capAvail"));               // with no cut both may stay on
    expect([$("#capAvail").checked, $("#capCons").checked]).toEqual([true, true]);
    b.close();
  });
});

describe("eighteen-books-in-one-scroll: two majorities", () => {
  it("every sampled pair of majorities shares someone", async () => {
    const b = await open(); const $ = q(b);
    for (let i = 1; i <= 30; i++) {
      click($("#majGo"));
      expect(shown($("#majCount"))).toBe(`${i} sampled · disjoint pairs: 0`);
      expect(shown($("#majStatus"))).toMatch(/^Shared: .+\.$/);
      expect(all(b, "#majSvg .leg.both").length).toBeGreaterThanOrEqual(1);
    }
    b.close();
  });
  it("all 256 ordered pairs of the 16 majorities of five are checked: none are disjoint", async () => {
    const b = await open(); click(b.document.querySelector("#majAll"));
    expect(shown(b.document.querySelector("#majCount"))).toBe("All 256 ordered pairs of majorities: 0 disjoint.");
    b.close();
  });
});

describe("eighteen-books-in-one-scroll: the price of a liar", () => {
  const f = (b, n) => click(b.document.querySelector(`#liarSeg button[data-f="${n}"]`));
  it("m liars need 3m+1 processes with oral messages", async () => {
    const b = await open(); const $ = q(b);
    for (const [m, n] of [[1, 4], [2, 7], [3, 10]]) {
      f(b, m);
      expect(shown($("#liarNum"))).toMatch(new RegExp(`^n ≥ ${n}`));
      expect(all(b, "#liarMen i")).toHaveLength(n); expect(all(b, "#liarMen i.liar")).toHaveLength(m);
      expect($(`#liarSeg button[data-f="${m}"]`).getAttribute("aria-pressed")).toBe("true");
    }
    b.close();
  });
  it("with unforgeable signatures any number of liars can be borne", async () => {
    const b = await open(); const $ = q(b);
    click($("#liarSeals")); expect(shown($("#liarNum"))).toMatch(/^Any number/);
    click($("#liarSeals")); expect(shown($("#liarNum"))).toMatch(/^n ≥ 4/);
    b.close();
  });
});

describe("eighteen-books-in-one-scroll: bundles", () => {
  const counts = b => [+b.document.querySelector("#bunA").textContent, +b.document.querySelector("#bunB").textContent];
  it("all-to-all costs n(n-1), through one leader 2(n-1)", async () => {
    const b = await open();
    for (const n of [4, 7, 10, 13]) {
      click(b.document.querySelector(`#bunSeg button[data-n="${n}"]`));
      await until(() => counts(b)[0] === n * (n - 1) && counts(b)[1] === 2 * (n - 1));
    }
    b.close();
  });
  it("the flip button toggles the picture's mode", async () => {
    const b = await open(); const $ = q(b);
    const mode = () => b.document.querySelector(".bundle").dataset.mode;
    const first = mode(); click($("#bunFlip")); expect(mode()).not.toBe(first); click($("#bunFlip")); expect(mode()).toBe(first);
    b.close();
  });
});

describe("eighteen-books-in-one-scroll: word of mouth on a coast", () => {
  const val = (b, id) => +b.document.querySelector(id).textContent;
  it("a rumour dies out leaving some unheard, then the festival reaches everyone", async () => {
    const b = await open(); const $ = q(b);
    for (let trial = 0; trial < 4; trial++) {
      click($("#gosGo"));
      await until(() => /Rumor over/.test(shown($("#gosStatus"))));
      expect(val(b, "#gosHeard") + val(b, "#gosLeft")).toBe(400);
      expect(val(b, "#gosHeard")).toBeGreaterThan(100); expect(val(b, "#gosLeft")).toBeGreaterThan(0);
      expect($("#gosFest").disabled).toBe(false);
      const sentBefore = val(b, "#gosSent");
      click($("#gosFest"));
      await until(() => !$("#gosGo").disabled && /every site|reach/i.test(shown($("#gosStatus"))) || val(b, "#gosLeft") === 0 && !$("#gosGo").disabled);
      expect(val(b, "#gosLeft")).toBe(0); expect(val(b, "#gosHeard")).toBe(400); expect(val(b, "#gosSent")).toBeGreaterThan(sentBefore);
    }
    expect(b.errors).toEqual([]); b.close();
  });
  it("nothing is heard, and the festival does nothing, before a rumour has started (it starts when the coast scrolls into view)", async () => {
    const b = await open(); click(b.document.querySelector("#gosFest"));
    expect([val(b, "#gosHeard"), val(b, "#gosSent")]).toEqual([0, 0]); b.close();
  });
});

describe("eighteen-books-in-one-scroll: how many to write, how many to ask", () => {
  it("the quorums intersect in exactly max(0, W+R-3) libraries", async () => {
    const b = await open(); const $ = q(b);
    for (const W of [1, 2, 3]) for (const R of [1, 2, 3]) {
      click($(`#qW button[data-v="${W}"]`)); click($(`#qR button[data-v="${R}"]`));
      expect(all(b, "#qLibs .lib.hit")).toHaveLength(Math.max(0, W + R - 3));
      expect(all(b, "#qLibs .lib.w")).toHaveLength(W); expect(all(b, "#qLibs .lib.r")).toHaveLength(R);
      expect(/read is fresh/.test(shown($("#qStatus")))).toBe(W + R > 3);
    }
    expect(b.errors).toEqual([]); b.close();
  });
});

describe("eighteen-books-in-one-scroll: the pebble boards", () => {
  const totals = b => all(b, "#merge .tbl .tot").map(e => parseInt(e.textContent));
  const merge = (b, m) => click(b.document.querySelector(`.merge-btns button[data-m="${m}"]`));
  it("each library can add only to its own column", async () => {
    const b = await open();
    expect(totals(b)).toEqual([2, 1, 2]);
    click(all(b, "#merge .tbl button")[1]); expect(totals(b)).toEqual([2, 2, 2]);
    b.close();
  });
  it("merging by maximum, in any order, reaches the same total once every pair has met", async () => {
    const b = await open(); const $ = q(b);
    merge(b, "0,1"); expect(totals(b)).toEqual([3, 3, 2]); expect(shown($("#mergeStatus"))).toMatch(/At the join: none\. Behind: 1, 2, 3/);   // nobody holds all the news yet
    merge(b, "1,2"); merge(b, "0,2");
    expect(totals(b)).toEqual([5, 5, 5]); expect(shown($("#mergeStatus"))).toMatch(/Converged: value 5 on every replica/);
    merge(b, "0,1"); expect(totals(b)).toEqual([5, 5, 5]);          // repeating a merge changes nothing
    b.close();
  });
  it("merging gives the same result in a different order", async () => {
    const b = await open();
    merge(b, "0,2"); merge(b, "1,2"); merge(b, "0,1");
    expect(totals(b)).toEqual([5, 5, 5]); b.close();
  });
});

describe("eighteen-books-in-one-scroll: the two doors", () => {
  it("a question pressed in the pile goes through the door it belongs to", async () => {
    const b = await open(); const $ = q(b);
    const qs = all(b, "#doors .q");
    expect(qs.length).toBeGreaterThanOrEqual(5);
    qs.forEach(x => { expect(x.parentElement.classList.contains("pile")).toBe(true); });
    qs.forEach(click);
    qs.forEach(x => expect(x.parentElement).toBe($(`#doors .${x.dataset.door} .slot`)));
    expect(all(b, "#doors .south .slot .q").length + all(b, "#doors .north .slot .q").length).toBe(qs.length);
    b.close();
  });
});

describe("eighteen-books-in-one-scroll: the family tree", () => {
  it("has a node for each of the eighteen books, each linking to a book that exists", async () => {
    const b = await open();
    const links = all(b, "#tree a.tnode").map(a => a.getAttribute("href"));
    expect(links).toHaveLength(18);
    const slugs = links.map(h => h.match(/^\.\.\/([^/]+)\/index\.html$/)[1]);
    expect(new Set(slugs).size).toBe(18);
    for (const s of slugs) { expect(existsSync(resolve(ROOT, "books", s, "index.html"))).toBe(true); expect(BOOKS).toContain(s); }
    b.close();
  });
  it("every other book than the overview is in the tree", async () => {
    const b = await open();
    const slugs = all(b, "#tree a.tnode").map(a => a.getAttribute("href").split("/")[1]);
    expect(BOOKS.filter(s => s !== "eighteen-books-in-one-scroll").sort()).toEqual([...slugs].sort());
    b.close();
  });
  it("pointing at a book names the change that grows it from its parent", async () => {
    const b = await open(); const $ = q(b);
    const node = all(b, "#tree a.tnode").find(a => /many-copies/.test(a.getAttribute("href")));
    node.dispatchEvent(new b.window.Event("mouseenter"));
    expect(shown($("#famCap"))).toMatch(/with one change/); expect(shown($("#famCap"))).toMatch(/→/);
    const root = all(b, "#tree a.tnode").find(a => /ordering-without-clocks/.test(a.getAttribute("href")));
    root.dispatchEvent(new b.window.Event("focus")); expect(shown($("#famCap"))).toMatch(/the root/);
    b.close();
  });
});
