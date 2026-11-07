import { describe, it, expect } from "vitest";
import { loadBook, click, shown } from "./harness.js";

const open = () => loadBook("one-writer-at-a-time", { reg: "m" });
const q = b => s => b.document.querySelector(s);
const until = async (f, ms = 5000) => { const t = Date.now(); while (!f()) { if (Date.now() - t > ms) throw new Error("timed out"); await new Promise(r => setTimeout(r, 2)); } };
const seats = (b, svg, label) => [...b.document.querySelectorAll(`${svg} [role=button][aria-label$="${label}"]`)];

describe("one-writer-at-a-time: when a record commits", () => {
  it("a record commits once a majority (primary + two backups) holds it", async () => {
    const b = await open(); const $ = q(b);
    expect([$("#pline").textContent, $("#ppass").textContent]).toEqual(["11", "11"]);
    click($("#pwrite")); expect($("#pline").textContent).toBe("12");
    expect($("#pwrite").disabled).toBe(true);                      // one record in flight at a time
    await until(() => !$("#pwrite").disabled);
    expect($("#ppass").textContent).toBe("12"); expect(shown($("#passsay"))).toMatch(/committed/);
    expect(b.errors).toEqual([]); b.close();
  });
  it("with every backup cut off a record is written but never commits; reconnecting two commits it", async () => {
    const b = await open(); const $ = q(b);
    const s = seats(b, "#passsvg", "step out or come back"); expect(s).toHaveLength(4);
    s.slice(0, 3).forEach(click);                                  // the fourth backup starts out of reach
    click($("#pwrite"));
    expect($("#pline").textContent).toBe("12");
    expect(shown($("#passsay"))).toMatch(/no backup is reachable/);
    await new Promise(r => setTimeout(r, 20));
    expect($("#ppass").textContent).toBe("11");
    click(s[0]); await until(() => !$("#pwrite").disabled);
    expect($("#ppass").textContent).toBe("11");                    // one backup is not enough
    click(s[1]); await until(() => $("#ppass").textContent === "12");
    expect(b.errors).toEqual([]); b.close();
  });
});

describe("one-writer-at-a-time: which mark is the later", () => {
  const marks = b => [...b.document.querySelectorAll("#marks button")];
  const say = b => shown(b.document.querySelector("#marksay"));
  it("the higher view wins whatever the record numbers", async () => {
    const b = await open(); const m = marks(b);
    click(m[1]); expect(say(b)).toMatch(/second viewstamp/);
    click(m[2]);
    expect(say(b)).toMatch(/view 7, R3 · record 3.*is the later/);
    expect(say(b)).toMatch(/Record 40 is a higher number than record 3, and still the older/);
    b.close();
  });
  it("within a view the identifier decides, then the record number", async () => {
    const b = await open(); const m = marks(b);
    click(m[3]); click(m[2]); expect(say(b)).toMatch(/R2 comes before R3/); expect(say(b)).toMatch(/view 7, R3/);
    click(m[0]); click(m[1]); expect(say(b)).toMatch(/view 6, R1 · record 40.*is the later/);
    expect(say(b)).toMatch(/higher timestamp/);
    b.close();
  });
  it("a third press starts a new pair", async () => {
    const b = await open(); const m = marks(b);
    click(m[0]); click(m[1]); click(m[2]); expect(say(b)).toMatch(/second viewstamp/);
    b.close();
  });
});

describe("one-writer-at-a-time: the rule for forming a view", () => {
  const ans = (b, k, v) => click(b.document.querySelector(`#formans button[data-k="${k}"][data-v="${v}"]`));
  const say = b => shown(b.document.querySelector("#formsay"));
  it("the example: three answered, but too few have intact state, so no view forms", async () => {
    const b = await open();
    expect(say(b)).toMatch(/No view forms.*A majority answered/);
    expect(b.document.querySelectorAll("#formchecks li")).toHaveLength(3);
    b.close();
  });
  it("a majority with intact state forms the view, and the freshest log leads", async () => {
    const b = await open();
    ans(b, "O", "with");
    expect(say(b)).toMatch(/View 7 forms/); expect(say(b)).toMatch(/was primary before/);
    b.close();
  });
  it("the old primary's own intact answer lets a view form over lost state elsewhere", async () => {
    const b = await open();
    ans(b, "O", "with"); ans(b, "M", "without"); ans(b, "T", "without");   // 1 with, 2 without: not a majority with intact state
    expect(say(b)).toMatch(/View 7 forms/);
    b.close();
  });
  it("without the old primary and with lost state, nothing forms", async () => {
    const b = await open();
    ans(b, "M", "without"); ans(b, "T", "without");
    expect(say(b)).toMatch(/No view forms/);
    b.close();
  });
  it("fewer than three answers never forms a view; reset restores the example", async () => {
    const b = await open();
    for (const k of ["O", "M", "T"]) ans(b, k, "none");
    expect(say(b)).toMatch(/Fewer than three have answered/);
    click(b.document.querySelector("#formreset"));
    expect(say(b)).toMatch(/A majority answered/);
    b.close();
  });
  it("no combination of answers forms a view that lacks the committed record", async () => {
    // the page itself checks all 243 combinations on load and throws otherwise
    const b = await open(); expect(b.errors).toEqual([]); b.close();
  });
});

describe("one-writer-at-a-time: the primary that has not noticed", () => {
  it("records in the old view reach one or two members and never commit", async () => {
    const b = await open(); const $ = q(b);
    click($("#porchwrite")); await until(() => !$("#porchwrite").disabled);
    expect($("#porchn").textContent).toBe("2");                    // R1 and R5, who never heard of view 7
    expect(shown($("#porchsay"))).toMatch(/cannot commit/);
    seats(b, "#porchsvg", "is he on seal 7?").forEach(click);
    click($("#porchwrite")); await until(() => !$("#porchwrite").disabled);
    expect($("#porchn").textContent).toBe("1");                    // R5 has joined view 7 and refuses
    expect(b.errors).toEqual([]); b.close();
  });
});

describe("one-writer-at-a-time: wax and stone", () => {
  const home = (b, k) => click(b.document.querySelectorAll('#waxsvg [role=button][aria-label$="go home or stay"]')[k]);
  const say = b => shown(b.document.querySelector("#waxsay"));
  it("with everyone's state intact a view forms", async () => {
    const b = await open(); expect(say(b)).toMatch(/View 7 forms/); b.close();
  });
  it("if the primary and enough others lose their state, no view ever forms", async () => {
    const b = await open();
    home(b, 0); home(b, 1); home(b, 2);                            // R1 and two more go home
    expect(say(b)).toMatch(/No view forms, now or ever/);
    click(b.document.querySelector("#waxreset")); expect(say(b)).toMatch(/View 7 forms/);
    b.close();
  });
  it("others losing state while the primary's is intact still lets a view form", async () => {
    const b = await open();
    home(b, 1); home(b, 2); home(b, 3); home(b, 4);
    expect(say(b)).toMatch(/View 7 forms/);
    expect(b.errors).toEqual([]); b.close();
  });
});
