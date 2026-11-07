import { describe, it, expect } from "vitest";
import { loadBook, click, shown } from "./harness.js";

const open = () => loadBook("agreeing-by-chance", { reg: "m" });
const q = b => s => b.document.querySelector(s);
const until = async (f, ms = 5000) => { const t = Date.now(); while (!f()) { if (Date.now() - t > ms) throw new Error("timed out"); await new Promise(r => setTimeout(r, 2)); } };

describe("agreeing-by-chance: a coin in each tent", () => {
  const counts = b => [...b.document.querySelectorAll("#cointally > div")].map(d => d.textContent.match(/0: (\d+) · 1: (\d+)/).slice(1).map(Number));
  const flip = async (b, id) => { click(b.document.querySelector(id)); await until(() => !b.document.querySelector("#coin1").disabled); };

  it("a flip at one process counts once, at that process only", async () => {
    const b = await open();
    await flip(b, "#coin2");
    const c = counts(b);
    expect(c.map(([x, y]) => x + y)).toEqual([0, 1, 0, 0]);
    b.close();
  });
  it("flipping at all four counts one each; clearing zeroes them", async () => {
    const b = await open();
    await flip(b, "#coinall"); await flip(b, "#coinall");
    expect(counts(b).map(([x, y]) => x + y)).toEqual([2, 2, 2, 2]);
    click(b.document.querySelector("#coinr"));
    expect(counts(b).flat()).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    expect(b.errors).toEqual([]); b.close();
  });
  it("the buttons are disabled while the coins are in the air", async () => {
    const b = await open();
    click(b.document.querySelector("#coin1"));
    expect(b.document.querySelector("#coinall").disabled).toBe(true);
    await until(() => !b.document.querySelector("#coinall").disabled);
    b.close();
  });
});

describe("agreeing-by-chance: one round at one process", () => {
  const reports = b => [...b.document.querySelectorAll("#rrep button")];
  const props = b => [...b.document.querySelectorAll("#rsec button")];
  it("three alike reports let P1 decide on a D-message", async () => {
    const b = await open();
    expect(shown(b.document.querySelector("#rout"))).toMatch(/P1 sends D\(/);
    b.close();
  });
  it("unlike reports give an unsure proposal; the proposals then decide whether P1 flips, favours or decides", async () => {
    const b = await open(); const $ = q(b);
    click(reports(b)[0]);
    expect(shown($("#rout"))).toMatch(/P1 sends \?/);
    expect(shown($("#rout"))).toMatch(/flips its coin/);
    click(props(b)[0]); expect(shown($("#rout"))).toMatch(/favours/);
    click(props(b)[1]); expect(shown($("#rout"))).toMatch(/decides/);
    click(props(b)[0]); click(props(b)[1]); expect(shown($("#rout"))).toMatch(/flips its coin/);
    expect(b.errors).toEqual([]); b.close();
  });
  it("the same rule holds in the allegory register", async () => {
    const b = await loadBook("agreeing-by-chance", { reg: "i" }); const $ = q(b);
    click(reports(b)[0]); click(props(b)[0]); click(props(b)[1]);
    expect(shown($("#rout"))).toMatch(/settled on/);
    b.close();
  });
});

describe("agreeing-by-chance: the night in the story", () => {
  it("steps through every round, then explains why round 3 could not fail", async () => {
    const b = await open(); const $ = q(b);
    let n = 0; while (!$("#storynext").disabled && n < 20) { click($("#storynext")); n++; }
    expect(n).toBeGreaterThanOrEqual(2); expect($("#storynext").disabled).toBe(true);
    expect(shown($("#storysay"))).toMatch(/flips of round 2 happened to agree/);
    click($("#storyr")); expect($("#storynext").disabled).toBe(false);
    expect(shown($("#storysay"))).toMatch(/P4 has crashed/);
    expect(b.errors).toEqual([]); b.close();
  });
});

describe("agreeing-by-chance: fresh executions", () => {
  it("every run ends with all processes that ran deciding one value", async () => {
    const b = await open(); const $ = q(b);
    for (let k = 0; k < 30; k++) { click($("#nightgo")); expect(shown($("#nightsay"))).toMatch(/Every process that ran decided [01], and no two differed/); }
    expect(b.errors).toEqual([]); b.close();
  });
  it("works with any inputs and a crashed process", async () => {
    const b = await open(); const $ = q(b);
    click($("#nightsilent")); expect(shown($("#nightsilent"))).toBe("P4 is crashed");
    for (const x of b.document.querySelectorAll("#nightsight button")) click(x);
    for (let k = 0; k < 20; k++) click($("#nightgo"));
    expect(shown($("#nightsay"))).toMatch(/no two differed/);
    click($("#nightsilent")); expect(shown($("#nightsilent"))).toBe("All four processes run");
    b.close();
  });
  it("identical inputs need no flip", async () => {
    const b = await open(); const $ = q(b);
    const sights = [...b.document.querySelectorAll("#nightsight button")];
    // the defaults alternate; flip the 2nd and 4th to make all four alike
    click(sights[1]); click($("#nightsight button:nth-child(4)"));
    click($("#nightgo"));
    expect(shown($("#nightsay"))).toMatch(/Nobody flipped/);
    b.close();
  });
});

describe("agreeing-by-chance: half is too many", () => {
  it("each half decides on its own, and then the late messages show disagreement", async () => {
    const b = await open(); const $ = q(b);
    expect($("#half3").disabled).toBe(true);
    click($("#half1")); expect($("#half3").disabled).toBe(true);
    click($("#half2")); expect($("#half3").disabled).toBe(false);
    click($("#half3"));
    await until(() => $("#halfsay .bad"));
    expect(shown($("#halfsay"))).toMatch(/decided different values/);
    click($("#halfr")); expect([$("#half1").disabled, $("#half3").disabled]).toEqual([false, true]);
    expect(b.errors).toEqual([]); b.close();
  });
});
