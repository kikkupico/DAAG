import { describe, it, expect } from "vitest";
import { loadBook, click, shown } from "./harness.js";

const open = () => loadBook("keeping-order-among-liars", { reg: "m" });
const q = b => s => b.document.querySelector(s);
const all = (b, s) => [...b.document.querySelectorAll(s)];
const until = async (f, ms = 5000) => { const t = Date.now(); while (!f()) { if (Date.now() - t > ms) throw new Error("timed out"); await new Promise(r => setTimeout(r, 2)); } };
/* a picker rebuilds its buttons when pressed, so each press finds them afresh */
const pick = (b, id, i) => click(all(b, `#${id} button`)[i]);
const pickText = (b, id, re) => click(all(b, `#${id} button`).find(x => re.test(x.textContent)));
const pressed = (b, id) => all(b, `#${id} button`).findIndex(x => x.getAttribute("aria-pressed") === "true");

describe("keeping-order-among-liars: why three signatures, and four replicas", () => {
  it("with four replicas, two groups of three always share an honest replica", async () => {
    const b = await open(); const $ = q(b);
    for (const x of [0, 1, 2, 3]) for (const y of [0, 1, 2, 3]) for (const liar of [0, 1, 2, 3]) {
      pick(b, "sealp3", x); pick(b, "sealp4", y); pick(b, "sealp2", liar);
      expect($("#sealsay .bad")).toBeNull();
      expect(shown($("#sealsay"))).toMatch(/fewest honest replicas two groups can share is 1/);
    }
    b.close();
  });
  it("with three replicas, the only replica in both groups can be the faulty one", async () => {
    const b = await open(); const $ = q(b);
    pick(b, "sealp1", 0);                                           // three replicas
    expect(pressed(b, "sealp1")).toBe(0);
    pick(b, "sealp3", 0); pick(b, "sealp4", 2); pick(b, "sealp2", 1);   // groups {R2,R3} and {R1,R2}, R2 faulty
    expect($("#sealsay .bad")).not.toBeNull(); expect(shown($("#sealsay"))).toMatch(/three replicas are too few/);
    expect(shown($("#sealsay"))).toMatch(/fewest honest replicas two groups can share is 0/);
    b.close();
  });
  it("shrinking to three replicas drops a chosen replica that no longer exists", async () => {
    const b = await open();
    pick(b, "sealp2", 3);                                           // R4 faulty
    pick(b, "sealp1", 0);
    expect(all(b, "#sealp2 button")).toHaveLength(3);
    expect(b.errors).toEqual([]); b.close();
  });
});

describe("keeping-order-among-liars: changing the office", () => {
  const term = b => b.document.querySelector("#jobterm").textContent;
  /* a view change finishes some time after the press: wait for the term to move on, and for the controls to come back */
  const settle = async (b, to) => { await until(() => term(b) === String(to)); await until(() => !b.document.querySelector("#jobreset").disabled); };
  it("starts in term 1 with delays on", async () => {
    const b = await open(); const $ = q(b);
    expect([term(b), $("#jobstood").textContent]).toEqual(["1", "0"]);
    expect([$("#jobfile").disabled, $("#jobnum").disabled, $("#jobsilent").disabled]).toEqual([false, true, true]);
    expect($("#jobwind").getAttribute("aria-pressed")).toBe("true");
    b.close();
  });
  it("with delayed messages, the timer expires before a request commits and the primary changes", async () => {
    const b = await open(); const $ = q(b);
    click($("#jobfile")); click($("#jobnum")); await settle(b, 2);
    expect(term(b)).toBe("2"); expect($("#jobstood").textContent).toBe("0");
    expect(shown($("#jobinfo"))).toBe("view 2, primary R2");
    expect(shown($("#jobsay"))).toMatch(/Nobody judged whether R1 stalled or the network dawdled|Nobody judged/);
    b.close();
  });
  it("with short delays the request commits and the primary stays", async () => {
    const b = await open(); const $ = q(b);
    click($("#jobwind")); expect($("#jobwind").getAttribute("aria-pressed")).toBe("false");
    click($("#jobfile")); click($("#jobnum"));
    expect(term(b)).toBe("1"); expect($("#jobstood").textContent).toBe("1");
    expect($("#jobsay .ok")).not.toBeNull();
    b.close();
  });
  it("a silent primary is replaced even when delays are short", async () => {
    const b = await open(); const $ = q(b);
    click($("#jobwind")); click($("#jobfile")); click($("#jobsilent")); await settle(b, 2);
    expect(term(b)).toBe("2");
    b.close();
  });
  it("the primary rotates, and reset starts over", async () => {
    const b = await open(); const $ = q(b);
    for (let i = 0; i < 4; i++) { click($("#jobfile")); click($("#jobnum")); await settle(b, i + 2); }
    expect(term(b)).toBe("5"); expect(shown($("#jobinfo"))).toBe("view 5, primary R1");
    click($("#jobreset")); expect([term(b), $("#jobstood").textContent]).toEqual(["1", "0"]);
    expect(b.errors).toEqual([]); b.close();
  });
});

describe("keeping-order-among-liars: three requests always meet the replicas that hold the request", () => {
  it("whichever replica is left out, whichever is faulty, at least one request shows the prepared request", async () => {
    const b = await open(); const $ = q(b);
    let n = 0;
    for (const out of [0, 1, 2, 3]) for (const liar of [0, 1, 2, 3, 4]) for (const left of [0, 1, 2]) {
      pick(b, "reqp1", out); pick(b, "reqp2", liar); pick(b, "reqp3", left);
      expect($("#reqsay .bad")).toBeNull(); expect($("#reqsay .ok")).not.toBeNull(); n++;
    }
    expect(n).toBe(60); expect(b.errors).toEqual([]); b.close();
  });
});

describe("keeping-order-among-liars: a doubling timer against a fixed one", () => {
  const run = async b => { click(b.document.querySelector("#gotrun")); await until(() => !b.document.querySelector("#gotrun").disabled || b.document.querySelector("#gotsay .ok")); };
  const rows = b => all(b, "#gotlist .trow");
  it("with a doubling timer and delays that end soon, a view commits by view 3", async () => {
    const b = await open(); const $ = q(b);
    await run(b);
    expect(rows(b).map(r => r.className.replace("trow ", ""))).toEqual(["delayed", "delayed", "ok"]);
    expect($("#gotsay .ok")).not.toBeNull(); expect(shown($("#gotsay"))).toMatch(/commit at view 3|view 3/);
    b.close();
  });
  it("a longer delay costs more views, but a doubling timer still gets there", async () => {
    const b = await open(); const $ = q(b);
    pick(b, "gotp2", 1); await run(b);
    const r = rows(b); expect(r).toHaveLength(6); expect(r.at(-1).className).toMatch(/ok/);
    expect(r.slice(0, -1).every(x => /delayed/.test(x.className))).toBe(true);
    b.close();
  });
  it("a fixed timer never gets there even when delays end soon: it expires before three short runs finish", async () => {
    const b = await open(); const $ = q(b);
    pick(b, "gotp1", 1); await run(b);
    expect(rows(b).filter(x => /\bok\b/.test(x.className))).toHaveLength(0);
    expect(rows(b).some(x => /short/.test(x.className))).toBe(true);
    expect(all(b, "#gotlist .more")).toHaveLength(1);
    expect($("#gotsay .bad")).not.toBeNull();
    b.close();
  });
  it("if delays never end, nothing commits, wrongly or rightly", async () => {
    const b = await open(); const $ = q(b);
    pick(b, "gotp2", 2); await run(b);
    expect(shown($("#gotsay"))).toMatch(/Nothing ever commits, and nothing wrong commits either/);
    b.close();
  });
});

describe("keeping-order-among-liars: settling checkpoints", () => {
  const nums = b => ["#setN", "#setS", "#setK"].map(s => b.document.querySelector(s).textContent);
  it("fifty requests at a time use up the allowed numbers until a checkpoint settles", async () => {
    const b = await open(); const $ = q(b);
    expect(nums(b)).toEqual(["0", "0", "0"]);
    for (let i = 0; i < 4; i++) click($("#setfile"));
    expect(nums(b)).toEqual(["200", "0", "200"]);
    expect($("#setfile").disabled).toBe(true); expect($("#setgood").disabled).toBe(true);
    expect(shown($("#setsay"))).toMatch(/No more numbers are allowed/);
    expect($("#setbar").parentNode.classList.contains("full")).toBe(true);
    click($("#setsettle"));
    expect(nums(b)).toEqual(["200", "200", "0"]);
    expect(shown($("#setrange"))).toMatch(/201 to 400/);
    expect($("#setfile").disabled).toBe(false); expect($("#setsettle").disabled).toBe(true);
    b.close();
  });
  it("a primary that jumps ahead to an enormous number is refused", async () => {
    const b = await open(); const $ = q(b);
    click($("#setbad")); expect(shown($("#setsay"))).toMatch(/Refused/); expect($("#setN").textContent).toBe("0");
    b.close();
  });
  it("single numbers are allowed up to the end of the range, no further", async () => {
    const b = await open(); const $ = q(b);
    for (let i = 0; i < 300; i++) click($("#setgood"));
    expect($("#setN").textContent).toBe("200"); expect($("#setgood").disabled).toBe(true);
    click($("#setreset")); expect(nums(b)).toEqual(["0", "0", "0"]);
    b.close();
  });
  it("a checkpoint settles only at a multiple of one hundred beyond the last", async () => {
    const b = await open(); const $ = q(b);
    click($("#setfile")); expect($("#setsettle").disabled).toBe(true);   // N=50: no multiple of 100 yet
    click($("#setfile")); expect($("#setsettle").disabled).toBe(false);  // N=100
    click($("#setsettle")); expect($("#setS").textContent).toBe("100");
    b.close();
  });
});
