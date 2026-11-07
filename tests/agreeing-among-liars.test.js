import { describe, it, expect } from "vitest";
import { loadBook, click, shown } from "./harness.js";

const open = () => loadBook("agreeing-among-liars", { reg: "m" });
const q = b => s => b.document.querySelector(s);
const all = (b, s) => [...b.document.querySelectorAll(s)];
const until = async (f, ms = 5000) => { const t = Date.now(); while (!f()) { if (Date.now() - t > ms) throw new Error("timed out"); await new Promise(r => setTimeout(r, 2)); } };

describe("agreeing-among-liars: the two conditions", () => {
  const ctl = b => all(b, "#condctl button");            // [commander, faulty, value]
  const guards = b => all(b, "#condguards button");      // one per process; the commander's is hidden
  const visible = b => guards(b).filter(g => g.style.display !== "none");

  it("with nobody faulty and everyone obeying the commander, both conditions hold", async () => {
    const b = await open(); const $ = q(b);
    expect(shown($("#condsay"))).toMatch(/Both conditions hold/);
    expect(visible(b)).toHaveLength(3);
    b.close();
  });
  it("two lieutenants obeying different values fail the first condition", async () => {
    const b = await open(); const $ = q(b);
    click(visible(b)[0]);
    expect($("#condsay .bad")).not.toBeNull(); expect(shown($("#condsay"))).toMatch(/obey different values.*first condition fails/);
    expect($("#c1 .bad")).not.toBeNull();
    b.close();
  });
  it("all lieutenants agreeing on a value other than the commander's fails the second", async () => {
    const b = await open(); const $ = q(b);
    visible(b).forEach(click);
    expect(shown($("#condsay"))).toMatch(/not with the commander's value.*second condition fails/);
    expect($("#c1 .bad")).toBeNull(); expect($("#c2 .bad")).not.toBeNull();
    b.close();
  });
  it("changing the commander's value restores the second condition", async () => {
    const b = await open(); const $ = q(b);
    visible(b).forEach(click); click(ctl(b)[2]);
    expect(shown($("#condsay"))).toMatch(/Both conditions hold/);
    b.close();
  });
  it("a faulty commander promises nothing, and its value button is disabled", async () => {
    const b = await open(); const $ = q(b);
    click(ctl(b)[1]);                                    // P1 is faulty, and P1 is the commander
    expect(shown($("#condsay"))).toMatch(/commander is faulty/);
    expect(ctl(b)[2].disabled).toBe(true);
    expect(shown($("#c2"))).toMatch(/promises nothing/);
    b.close();
  });
  it("moving the commander moves the hidden button", async () => {
    const b = await open();
    click(ctl(b)[0]);
    expect(guards(b)[0].style.display).toBe(""); expect(guards(b)[1].style.display).toBe("none");
    b.close();
  });
});

describe("agreeing-among-liars: a round of messages", () => {
  const acc = b => all(b, "#ratacc > div");
  const run = async (b, i) => { click(b.document.querySelector(`#rat${i}`)); await until(() => !b.document.querySelector("#rat1").disabled); };
  it("every message arrives, and each lieutenant holds the commander's value", async () => {
    const b = await open();
    click(b.document.querySelector("#rat1"));
    expect(b.document.querySelector("#rat2").disabled).toBe(true);
    await until(() => !b.document.querySelector("#rat1").disabled);
    expect(acc(b)).toHaveLength(3);
    expect(acc(b).every(a => !/nothing arrived/.test(shown(a)))).toBe(true);
    b.close();
  });
  it("a message that does not arrive in the round counts as the default value", async () => {
    const b = await open(); await run(b, 2);
    expect(acc(b).filter(a => /nothing arrived within the round/.test(shown(a)))).toHaveLength(1);
    expect(shown(b.document.querySelector("#ratsay"))).toMatch(/missing message counts as 0/);
    b.close();
  });
  it("in a second round a faulty lieutenant's relayed value cannot be checked", async () => {
    const b = await open(); await run(b, 3);
    expect(acc(b).every(a => a.querySelectorAll(".e").length === 3)).toBe(true);   // 1 from the commander + 2 relays
    expect(b.errors).toEqual([]); b.close();
  });
});

describe("agreeing-among-liars: two executions that look the same", () => {
  const step = (b, i) => click(b.document.querySelector(`#wb${i}`));
  it("buttons unlock one at a time", async () => {
    const b = await open();
    const en = () => [1, 2, 3, 4].map(i => !b.document.querySelector(`#wb${i}`).disabled);
    expect(en()).toEqual([true, false, false, false]);
    step(b, 2); expect(en()).toEqual([true, false, false, false]);   // out of turn does nothing
    step(b, 1); expect(en()).toEqual([false, true, false, false]);
    b.close();
  });
  it("P2 holds exactly the same two messages in both executions, so cannot tell them apart", async () => {
    const b = await open(); const $ = q(b);
    [1, 2, 3].forEach(i => step(b, i));
    expect(shown($("#evA"))).toBe(shown($("#evB")));
    expect(shown($("#evA"))).toMatch(/^P2: from the commander/);
    expect($("#evA").classList.contains("same")).toBe(true); expect($("#evB").classList.contains("same")).toBe(true);
    step(b, 4); expect(shown($("#worldsay"))).toMatch(/P3/);
    expect(b.errors).toEqual([]); b.close();
  });
  it("starting again clears it", async () => {
    const b = await open(); const $ = q(b);
    [1, 2, 3].forEach(i => step(b, i)); click($("#wbr"));
    expect(shown($("#evA"))).toBe("P2 holds: nothing yet"); expect($("#evA").classList.contains("same")).toBe(false);
    expect($("#wb1").disabled).toBe(false);
    b.close();
  });
});

describe("agreeing-among-liars: the price of a liar", () => {
  it("m liars need 3m+1 processes and m+1 rounds", async () => {
    const b = await open(); const $ = q(b);
    for (let m = 1; m <= 6; m++) {
      expect([$("#pm").textContent, $("#pn").textContent, $("#pr").textContent]).toEqual([String(m), String(3 * m + 1), String(m + 1)]);
      if (m < 6) click($("#pup"));
    }
    expect($("#pup").disabled).toBe(true);
    for (let m = 6; m > 1; m--) click($("#pdown"));
    expect($("#pdown").disabled).toBe(true);
    b.close();
  });
  it("four processes are enough only for a single faulty one", async () => {
    const b = await open(); const $ = q(b);
    expect(shown($("#pricesay"))).toMatch(/are enough/);
    click($("#pup")); expect(shown($("#pricesay"))).toMatch(/are too few/);
    b.close();
  });
});

describe("agreeing-among-liars: signed messages", () => {
  const press = b => all(b, "#sealctl button");                 // P1..P4 faulty, then the signing choice
  const setLiars = (b, set) => press(b).slice(0, 4).forEach((x, i) => { if ((x.getAttribute("aria-pressed") === "true") !== set.has(i + 1)) click(x); });
  const ok = (b, id) => !b.document.querySelector(`${id} .bad`);

  it("with a single faulty process, the honest ones agree and obey an honest commander", async () => {
    const b = await open();
    for (const liar of [1, 2, 3, 4]) {
      setLiars(b, new Set([liar]));
      const splits = liar === 1 ? 3 : 1;
      for (let s = 0; s < splits; s++) {
        expect(ok(b, "#k1")).toBe(true); expect(ok(b, "#k2")).toBe(true);
        if (liar === 1) click(press(b)[4]);
      }
    }
    expect(b.errors).toEqual([]); b.close();
  });
  it("the faulty commander's signing choice button shows only when the commander is faulty", async () => {
    const b = await open();
    expect(press(b)[4].style.display).toBe("");
    setLiars(b, new Set([2])); expect(press(b)[4].style.display).toBe("none");
    b.close();
  });
  it("a faulty relay passes nothing on", async () => {
    const b = await open(); const $ = q(b);
    setLiars(b, new Set([2]));
    expect(shown($("#sealtab"))).toMatch(/faulty: passes nothing on/);
    b.close();
  });
  it("with more faulty processes than the party is built for, the page still runs", async () => {
    const b = await open();
    for (const set of [[1, 2], [2, 3], [1, 2, 3], [1, 2, 3, 4], []]) setLiars(b, new Set(set));
    expect(b.errors).toEqual([]); b.close();
  });
});
