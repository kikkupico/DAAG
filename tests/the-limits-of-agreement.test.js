import { describe, it, expect } from "vitest";
import { loadBook, click, shown } from "./harness.js";

const open = () => loadBook("the-limits-of-agreement", { reg: "m" });
const q = b => s => b.document.querySelector(s);
const all = (b, s) => [...b.document.querySelectorAll(s)];
const until = async (f, ms = 5000) => { const t = Date.now(); while (!f()) { if (Date.now() - t > ms) throw new Error("timed out"); await new Promise(r => setTimeout(r, 2)); } };
/* which of the three properties a checks panel marks as kept (true), lost (false) or leaves blank (null) */
const verdicts = (b, ids) => ids.map(id => { const e = b.document.querySelector(id); return e.querySelector(".ok") ? true : e.querySelector(".bad") ? false : null; });
const done = (b, ids) => until(() => verdicts(b, ids).every(v => v !== null));

describe("the-limits-of-agreement: the first rules", () => {
  const ids = ["#d1", "#d2", "#d3"];
  it("starts with nothing judged", async () => {
    const b = await open(); expect(verdicts(b, ids)).toEqual([null, null, null]); b.close();
  });
  it("always deciding 0 keeps agreement and termination, and gives up validity", async () => {
    const b = await open(); click(b.document.querySelector("#plan1"));
    expect(verdicts(b, ids)).toEqual([true, false, true]); b.close();
  });
  it("waiting for every input keeps all three when nobody crashes", async () => {
    const b = await open(); click(b.document.querySelector("#plan2")); await done(b, ids);
    expect(verdicts(b, ids)).toEqual([true, true, true]); b.close();
  });
  it("waiting for every input gives up termination when one process has crashed", async () => {
    const b = await open(); click(b.document.querySelector("#plan3")); await done(b, ids);
    expect(verdicts(b, ids)).toEqual([true, true, false]); b.close();
  });
  it("a new deal clears the verdicts", async () => {
    const b = await open(); click(b.document.querySelector("#plan1")); click(b.document.querySelector("#plannew"));
    expect(verdicts(b, ids)).toEqual([null, null, null]); b.close();
  });
  it("the agreement rule's result does not depend on the random inputs", async () => {
    const b = await open();
    for (let i = 0; i < 8; i++) { click(b.document.querySelector("#plannew")); click(b.document.querySelector("#plan2")); await done(b, ids); expect(verdicts(b, ids)).toEqual([true, true, true]); }
    expect(b.errors).toEqual([]); b.close();
  });
});

describe("the-limits-of-agreement: rules that go on without one process", () => {
  const ids = ["#t1", "#t2", "#t3"];
  it("deciding on the first three inputs loses agreement", async () => {
    const b = await open(); click(b.document.querySelector("#three1")); await done(b, ids);
    expect(verdicts(b, ids)).toEqual([false, true, true]); b.close();
  });
  it("waiting for a single chooser loses termination when the chooser crashes", async () => {
    const b = await open(); click(b.document.querySelector("#three2")); await done(b, ids);
    expect(verdicts(b, ids)).toEqual([true, true, false]); b.close();
  });
  it("taking over on a timeout loses agreement when the chooser was only slow", async () => {
    const b = await open(); click(b.document.querySelector("#three3")); await done(b, ids);
    expect(verdicts(b, ids)).toEqual([false, true, true]);
    expect(b.errors).toEqual([]); b.close();
  });
});

describe("the-limits-of-agreement: two executions that look the same", () => {
  it("each hour of waiting changes nothing P2 can see", async () => {
    const b = await open(); const $ = q(b);
    for (let h = 1; h <= 5; h++) {
      click($("#worldb"));
      expect(shown($("#worldsay"))).toMatch(new RegExp(`^${h} hours? of waiting`));
      expect(/Since no message has a guaranteed deadline|never turns one/.test(shown($("#worldsay")))).toBe(h >= 4);
    }
    b.close();
  });
});

describe("the-limits-of-agreement: separate processes commute", () => {
  const rows = b => all(b, "#foldstand > div").map(shown);
  it("a trade between P1 and P2 touches nobody else", async () => {
    const b = await open(); const $ = q(b);
    click($("#fold12"));
    expect(rows(b)).toEqual(["P1 has received the message from P2", "P2 has received the message from P1", "P3 has received nothing yet", "P4 has received nothing yet"]);
    expect([$("#fold12").disabled, $("#fold34").disabled]).toEqual([true, false]);
    b.close();
  });
  it("either order of the two trades reaches the same configuration", async () => {
    const b = await open(); const $ = q(b);
    click($("#fold12")); click($("#fold34"));
    const first = rows(b);
    expect(shown($("#foldsay"))).toMatch(/Start over, and let the other pair go first/);
    click($("#foldr")); click($("#fold34")); click($("#fold12"));
    expect(rows(b)).toEqual(first);
    expect(shown($("#foldsay"))).toMatch(/same configuration as last time/); expect($("#foldsay .ok")).not.toBeNull();
    expect(b.errors).toEqual([]); b.close();
  });
});

describe("the-limits-of-agreement: the row of beginnings", () => {
  const NEXT = { hold: "att", att: "open", open: "hold" };
  const state = (b, j) => ["hold", "att", "open"].find(c => b.document.querySelector(`#dusk button[data-j="${j}"]`).classList.contains(c));
  const set = (b, j, want) => { for (let n = 0; n < 3 && state(b, j) !== want; n++) click(b.document.querySelector(`#dusk button[data-j="${j}"]`)); };
  it("only the three middle beginnings can be changed; the ends are fixed by validity", async () => {
    const b = await open();
    expect(all(b, "#dusk button[data-j]").map(x => x.dataset.j)).toEqual(["1", "2", "3"]);
    expect(all(b, "#dusk .vb").map(x => x.tagName)).toEqual(["DIV", "BUTTON", "BUTTON", "BUTTON", "DIV"]);
    b.close();
  });
  it("each press cycles settled-0, settled-1, bivalent", async () => {
    const b = await open();
    const seq = [state(b, 2)]; for (let i = 0; i < 3; i++) { click(b.document.querySelector('#dusk button[data-j="2"]')); seq.push(state(b, 2)); }
    expect(seq).toEqual(["hold", NEXT.hold, NEXT[NEXT.hold], "hold"]);
    b.close();
  });
  it("however the row is marked, either neighbours settle opposite ways or some beginning is bivalent", async () => {
    const b = await open(); const $ = q(b);
    const opts = ["hold", "att", "open"]; let combos = 0;
    for (const a of opts) for (const c of opts) for (const d of opts) {
      set(b, 1, a); set(b, 2, c); set(b, 3, d); combos++;
      const f = ["hold", a, c, d, "att"];
      const split = f.some((x, j) => j < 4 && x !== "open" && f[j + 1] !== "open" && x !== f[j + 1]);
      expect(!!$("#dusksay .bad")).toBe(split);
      expect(!!$("#dusksay .ok")).toBe(!split);
      if (!split) expect(f.includes("open")).toBe(true);
      expect(all(b, "#dusk .split").length).toBe(split ? 12 : 0);
    }
    expect(combos).toBe(27); expect(b.errors).toEqual([]); b.close();
  });
});

describe("the-limits-of-agreement: a fair execution in which nothing is settled", () => {
  it("while turns pass the configuration stays bivalent; with a message deadline it closes and all four decide", async () => {
    const b = await open(); const $ = q(b);
    expect(shown($("#nightmode"))).toBe("not yet started");
    click($("#nightrun")); expect(shown($("#nightmode"))).toBe("bivalent, and staying bivalent");
    expect($("#nightrun").disabled).toBe(true);
    click($("#nightbound")); await until(() => $("#ncom").textContent === "4");
    expect(shown($("#nightmode"))).toBe("univalent"); expect($("#naloft").textContent).toBe("0");
    expect(shown($("#nightsay"))).toMatch(/All four can apply one rule to the same/);
    click($("#nightreset")); expect([$("#ncom").textContent, shown($("#nightmode"))]).toEqual(["0", "not yet started"]);
    expect(b.errors).toEqual([]); b.close();
  });
  it("at the start four messages are in the air and none have arrived", async () => {
    const b = await open();
    expect([b.document.querySelector("#narr").textContent, b.document.querySelector("#naloft").textContent]).toEqual(["0", "4"]);
    b.close();
  });
});
