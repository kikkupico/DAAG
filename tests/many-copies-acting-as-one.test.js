import { describe, it, expect } from "vitest";
import { loadBook, click, shown } from "./harness.js";

const open = () => loadBook("many-copies-acting-as-one", { reg: "m" });
const q = b => s => b.document.querySelector(s);
const all = (b, s) => [...b.document.querySelectorAll(s)];
const rows = (b, id) => all(b, `${id} tr`).map(r => [...r.children].map(shown));

describe("many-copies-acting-as-one: before, or overlap", () => {
  const req = (b, label) => b.document.querySelector(`#spansvg [role=button][aria-label="${label}"]`);
  const pair = (b, x, y) => { click(req(b, x)); click(req(b, y)); return shown(b.document.querySelector("#spansay")); };
  it("two requests that overlap in time have no first", async () => {
    const b = await open();
    expect(pair(b, "P1's request", "P2's first request")).toMatch(/overlap/);
    expect(b.document.querySelector("#spansay .bad")).not.toBeNull();
    b.close();
  });
  it("a request that was over before another began came before it, whichever order you choose them in", async () => {
    const b = await open();
    expect(pair(b, "P1's request", "P2's second request")).toMatch(/P1's request.*was over before.*P2's second request.*before/);
    expect(pair(b, "P2's second request", "P2's first request")).toMatch(/P2's first request.*was over before.*P2's second request/);
    b.close();
  });
  it("one choice asks for a second", async () => {
    const b = await open(); click(req(b, "P1's request"));
    expect(shown(b.document.querySelector("#spansay"))).toMatch(/Now choose a second request/); b.close();
  });
});

describe("many-copies-acting-as-one: four executions, put to the rule", () => {
  const show = (b, i) => click(all(b, "button[data-m]")[i]);
  it("simultaneous requests may be served in either order", async () => {
    const b = await open(); const $ = q(b);
    show(b, 0); expect($("#fmverd .ok")).not.toBeNull(); expect($("#fmverd .bad")).toBeNull();
    expect(all(b, "#fmverd .seqline .chip, #fmverd .seqline > *").length).toBeGreaterThanOrEqual(4);
    b.close();
  });
  it("serving a request before its confirmation arrives is allowed", async () => {
    const b = await open(); show(b, 2); expect(b.document.querySelector("#fmverd .ok")).not.toBeNull(); b.close();
  });
  it("a request that finished earlier, served later, breaks the third demand", async () => {
    const b = await open(); show(b, 1);
    expect(b.document.querySelector("#fmverd .bad")).not.toBeNull(); expect(shown(b.document.querySelector("#fmverd"))).toMatch(/third demand/); b.close();
  });
  it("serving one request twice breaks the first demand", async () => {
    const b = await open(); show(b, 3);
    expect(shown(b.document.querySelector("#fmverd"))).toMatch(/Forbidden.*first demand/); b.close();
  });
  it("only the chosen execution is marked on", async () => {
    const b = await open();
    for (let i = 0; i < 4; i++) { show(b, i); expect(all(b, "button[data-m].on")).toHaveLength(1); expect(all(b, "button[data-m]")[i].classList.contains("on")).toBe(true); }
    expect(b.errors).toEqual([]); b.close();
  });
});

describe("many-copies-acting-as-one: two kinds of first", () => {
  const show = (b, i) => click(all(b, "button[data-k]")[i]);
  it("with no message joining the requests, timestamps may put the later one first", async () => {
    const b = await open(); show(b, 0);
    const r = rows(b, "#fktab");
    expect(r[0][1]).toBe("no"); expect(r[1][1]).toBe("P2 first (arbitrary)"); expect(r[2][1]).toBe("P1 first"); expect(r[3][1]).toBe("no");
    expect(b.document.querySelector("#fksay .bad")).not.toBeNull();
    b.close();
  });
  it("with a message chain, timestamps put P1 first, though in real time the requests overlap", async () => {
    const b = await open(); show(b, 1);
    const r = rows(b, "#fktab");
    expect(r[0][1]).toBe("yes"); expect(r[1][1]).toBe("P1 first"); expect(r[2][1]).toBe("overlap"); expect(r[3][1]).toBe("yes");
    b.close();
  });
});

describe("many-copies-acting-as-one: two queues", () => {
  const cells = b => rows(b, "#loctab").map(r => r[1]);
  it("under sequential consistency each queue passes alone and both together fail, through a loop", async () => {
    const b = await open();
    click(b.document.querySelector("#locLoose"));
    expect(cells(b)).toEqual(["passes", "passes", "fails"]);
    expect(shown(b.document.querySelector("#locsay"))).toMatch(/a loop/);
    b.close();
  });
  it("under linearizability the fault shows in the first queue by itself", async () => {
    const b = await open();
    click(b.document.querySelector("#locSun"));
    expect(cells(b)).toEqual(["fails", "passes", "fails"]);
    expect(shown(b.document.querySelector("#locname"))).toBe("linearizability");
    b.close();
  });
});

describe("many-copies-acting-as-one: nobody made to wait", () => {
  const show = (b, i) => click(all(b, "button[data-w]")[i]);
  it("a pending request can always be entered", async () => {
    const b = await open(); show(b, 0);
    expect(b.document.querySelector("#wtsay .ok")).not.toBeNull(); expect(b.document.querySelector("#wtlog .bad")).toBeNull(); b.close();
  });
  it("a dequeue from an empty queue has no answer (the wait is asked for, not forced)", async () => {
    const b = await open(); show(b, 1);
    expect(b.document.querySelector("#wtsay .bad")).not.toBeNull(); expect(shown(b.document.querySelector("#wtsay"))).toMatch(/nothing to answer/); b.close();
  });
  it("two groups of reads then writes cannot both be as-if-sequential", async () => {
    const b = await open(); show(b, 2);
    expect(shown(b.document.querySelector("#wtsay"))).toMatch(/One of the two has to be aborted/);
    expect(b.errors).toEqual([]); b.close();
  });
});

describe("many-copies-acting-as-one: what the array could mean", () => {
  const slots = b => all(b, "#mnslots .e").map(shown);
  const seqs = b => all(b, "#mnseqs .e").map(shown);
  it("two enqueuers racing leave two possible sequences", async () => {
    const b = await open();
    click(all(b, "button[data-n]")[0]);
    expect(slots(b)).toEqual(["slot 1: P1's request", "slot 2: P2's request", "slot 3: empty", "slot 4: empty"]);
    expect(seqs(b)).toHaveLength(2);
    expect(shown(b.document.querySelector("#mnsay"))).toMatch(/Both enqueuers|either sequence|overlapped/);
    b.close();
  });
  it("when one was stored before the other began, one sequence only", async () => {
    const b = await open();
    click(all(b, "button[data-n]")[1]);
    expect(seqs(b)).toHaveLength(1);
    b.close();
  });
  it("each dequeue takes the first slot and narrows the sequences", async () => {
    const b = await open(); const $ = q(b);
    click(all(b, "button[data-n]")[0]);
    click($("#mnload")); expect(slots(b).filter(s => !/empty/.test(s))).toHaveLength(1); expect(seqs(b)).toHaveLength(1);
    expect($("#mnload").disabled).toBe(false);
    click($("#mnload")); expect(slots(b).every(s => /empty/.test(s))).toBe(true);
    expect($("#mnload").disabled).toBe(true); expect(seqs(b)).toEqual(["nothing waiting"]);
    expect(b.errors).toEqual([]); b.close();
  });
});
