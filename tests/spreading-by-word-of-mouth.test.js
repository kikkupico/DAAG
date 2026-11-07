import { describe, it, expect } from "vitest";
import { loadBook, click, shown } from "./harness.js";

const open = () => loadBook("spreading-by-word-of-mouth", { reg: "m" });
const q = b => s => b.document.querySelector(s);
const pick = (b, id, v) => click(b.document.querySelector(`#${id} button[data-v="${v}"]`));
const until = async (f, ms = 8000) => { const t = Date.now(); while (!f()) { if (Date.now() - t > ms) throw new Error("timed out"); await new Promise(r => setTimeout(r, 5)); } };

describe("spreading-by-word-of-mouth: the festival", () => {
  it.each(["give", "ask", "both"])("in mode %s the new value only spreads, and reaches all 100 sites", async mode => {
    const b = await open(); const $ = q(b);
    pick(b, "fmode", mode);
    expect(shown($("#fhave"))).toBe("1"); expect(shown($("#fyear"))).toBe("0");
    let last = 1;
    for (let i = 0; i < 400 && !$("#fgo").disabled; i++) {
      click($("#fgo")); const n = +$("#fhave").textContent;
      expect(n).toBeGreaterThanOrEqual(last); expect(n).toBeLessThanOrEqual(100); last = n;
      expect($("#fcells").querySelectorAll("i.h").length).toBe(n);
    }
    expect(last).toBe(100); expect($("#fgo").disabled).toBe(true);
    expect(shown($("#fsay"))).toMatch(/every site holds the new value/);
    b.close();
  });
  it("reset starts again from one site", async () => {
    const b = await open(); const $ = q(b);
    click($("#fgo")); click($("#fgo")); click($("#freset"));
    expect([$("#fhave").textContent, $("#fyear").textContent, $("#fgo").disabled]).toEqual(["1", "0", false]);
    b.close();
  });
  it("the table of the last stragglers squares the pull and shrinks the push more slowly", async () => {
    const b = await open();
    const rows = [...b.document.querySelectorAll("#ftbl tr")].slice(1).map(r => [...r.children].map(shown));
    expect(rows).toHaveLength(6);
    expect(rows[0]).toEqual(["at the start", "1 in 10", "1 in 10"]);
    expect(rows[1][1]).toBe("1 in 100");      // pull: 0.1 squared
    expect(rows[2][1]).toBe("none in a system of a thousand");   // 1 in 10,000 of a thousand is under half a site
    expect(rows[5][2]).toMatch(/^1 in /);                           // push never reaches none
    b.close();
  });
});

describe("spreading-by-word-of-mouth: gossip among a thousand", () => {
  const run = async (b, go, say) => { click(b.document.querySelector(go)); await until(() => /stopped|ended/.test(shown(b.document.querySelector(say)))); };

  it("telling runs to the end and leaves a count that matches the cells", async () => {
    const b = await open(); const $ = q(b);
    await run(b, "#ggo", "#gsay");
    const left = +$("#gres").textContent;
    expect(left).toBeGreaterThanOrEqual(0); expect(left).toBeLessThan(1000);
    expect($("#gcells").querySelectorAll("i").length).toBe(1000);
    expect($("#gcells").querySelectorAll("i.t").length).toBe(0);          // nobody still spreading at the end
    expect($("#gcells").querySelectorAll("i.d").length).toBe(1000 - left);
    expect(+$("#gday").textContent).toBeGreaterThan(0);
    expect($("#ggo").textContent).toBe("Start again");
    expect(b.errors).toEqual([]); b.close();
  });
  it("a larger allowance by count leaves fewer sites without it than a blind toss at one", async () => {
    const b = await open(); const $ = q(b);
    pick(b, "gfb", 0); pick(b, "gct", 0);                                  // blind, on a toss
    await run(b, "#ggo", "#gsay"); const blind = +$("#gres").textContent;
    pick(b, "gfb", 1); pick(b, "gct", 1); click(b.document.querySelector('#gk button[data-v="5"]'));
    await run(b, "#ggo", "#gsay"); const careful = +$("#gres").textContent;
    expect(careful).toBeLessThan(blind);
    b.close();
  });
  it("changing a choice clears the run", async () => {
    const b = await open(); const $ = q(b);
    await run(b, "#ggo", "#gsay");
    pick(b, "gk", 3);
    expect([$("#gres").textContent, $("#gday").textContent, $("#gm").textContent]).toEqual(["0", "0", "0"]);
    expect($("#gcells").querySelectorAll("i.d, i.t").length).toBe(0);
    b.close();
  });
  it("pull gossip runs to the end as well", async () => {
    const b = await open(); const $ = q(b);
    pick(b, "amode", "ask"); click(b.document.querySelector('#ak button[data-v="3"]'));
    await run(b, "#ago", "#asay");
    expect(+$("#ares").textContent).toBeLessThan(1000);
    expect(shown($("#asay"))).toMatch(/It ended in cycle/);
    expect(b.errors).toEqual([]); b.close();
  });
});

describe("spreading-by-word-of-mouth: withdrawing", () => {
  it("only deleting the key lets the old value bring it back", async () => {
    const b = await open(); const $ = q(b);
    expect(shown($("#wsay"))).toMatch(/deleted the key/);
    click($("#wgo"));
    expect($("#wsay .bad")).not.toBeNull(); expect(shown($("#wsay"))).toMatch(/key is back/);
    expect($("#wgo").disabled).toBe(true);
    b.close();
  });
  it("a death certificate with the later timestamp deletes the key at both sites", async () => {
    const b = await open(); const $ = q(b);
    pick(b, "wmode", "notice"); click($("#wgo"));
    expect($("#wsay .ok")).not.toBeNull(); expect(shown($("#wsay"))).toMatch(/deleted at both/);
    pick(b, "wmode", "strike"); expect($("#wgo").disabled).toBe(false);
    b.close();
  });
  it("a freshly stamped certificate also strikes the value written after the deletion; a woken one spares it", async () => {
    const b = await open(); const $ = q(b);
    click($("#tone")); expect($("#tsay .bad")).not.toBeNull(); expect(shown($("#tsay"))).toMatch(/replaces the value of day 8 as well/);
    click($("#ttwo")); expect($("#tsay .ok")).not.toBeNull(); expect(shown($("#tsay"))).toMatch(/value of day 8 stands/);
    b.close();
  });
});

describe("spreading-by-word-of-mouth: near partners", () => {
  it("draws three pairs of bars, the larger one longest", async () => {
    const b = await open();
    const bars = [...b.document.querySelectorAll("#fbars .b i")].map(i => parseFloat(i.style.width));
    expect(bars).toHaveLength(6);
    for (let k = 0; k < 6; k += 2) expect(Math.max(bars[k], bars[k + 1])).toBeCloseTo(78, 0);
    b.close();
  });
});
