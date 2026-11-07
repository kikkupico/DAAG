import { describe, it, expect } from "vitest";
import { loadBook, click, shown } from "./harness.js";

const open = () => loadBook("answering-while-cut-off", { reg: "m" });
const q = b => s => b.document.querySelector(s);
const all = (b, s) => [...b.document.querySelectorAll(s)];
const until = async (f, ms = 5000) => { const t = Date.now(); while (!f()) { if (Date.now() - t > ms) throw new Error("timed out"); await new Promise(r => setTimeout(r, 2)); } };
const idle = (b, sel) => until(() => !b.document.querySelector(sel).disabled);

describe("answering-while-cut-off: messages and failures", () => {
  it("a message to a reachable process arrives; nothing is left waiting", async () => {
    const b = await open(); const $ = q(b);
    click($("#bs21")); await idle(b, "#bhawk");
    expect(shown($("#bsay"))).toMatch(/arrives at P1/);
    expect($("#bflight").disabled).toBe(true);
    expect(shown($("#bstand"))).toMatch(/No node is waiting/);
    b.close();
  });
  it("a message lost to a cut-off process leaves the receiver unable to tell lost from slow, until a delivery time has passed", async () => {
    const b = await open(); const $ = q(b);
    click($("#bhawk")); expect(shown($("#bstand"))).toMatch(/P4 cut off: yes/);
    click($("#bs24")); await idle(b, "#bhawk");
    expect(shown($("#bsay"))).toMatch(/cannot yet say whether it is lost or only slow/);
    expect($("#bflight").disabled).toBe(false);
    click($("#bflight"));
    expect(shown($("#bsay"))).toMatch(/A whole delivery time has passed/);
    expect(shown($("#bstand"))).toMatch(/knows the message from P2 was lost, and not what it carried/);
    expect($("#bflight").disabled).toBe(true);
    expect(b.errors).toEqual([]); b.close();
  });
  it("a message between two reachable processes is not lost even while P4 is cut off", async () => {
    const b = await open(); const $ = q(b);
    click($("#bhawk")); click($("#bs21")); await idle(b, "#bhawk");
    expect(shown($("#bsay"))).toMatch(/arrives at P1/);
    click($("#bhawk")); expect(shown($("#bstand"))).toMatch(/P4 cut off: no/);
    b.close();
  });
});

describe("answering-while-cut-off: two ways to answer badly", () => {
  it("answering at once is wrong; waiting is not an answer", async () => {
    const b = await open(); const $ = q(b);
    click($("#owehold"));
    expect($("#ow1 .bad")).not.toBeNull(); expect($("#ow2 .ok")).not.toBeNull();
    expect([$("#owehold").disabled, $("#owewait").disabled]).toEqual([true, true]);
    click($("#owereset")); expect($("#ow1").querySelector(".bad, .ok")).toBeNull(); expect($("#owehold").disabled).toBe(false);
    click($("#owewait"));
    expect($("#ow1 .bad")).toBeNull(); expect($("#ow2 .bad")).not.toBeNull();
    expect(shown($("#owesay"))).toMatch(/not an answer/);
    b.close();
  });
});

describe("answering-while-cut-off: the primary-copy arrangement", () => {
  const run = async (b, id) => { click(b.document.querySelector(id)); await idle(b, "#kp1"); };
  it("no failure: consistent, and every request answered", async () => {
    const b = await open(); const $ = q(b);
    await run(b, "#kp1");
    expect($("#kd1 .ok")).not.toBeNull(); expect($("#kd2 .ok")).not.toBeNull(); expect($("#kd3 .ok")).toBeNull();
    b.close();
  });
  it("P4 cut off and waiting: nothing wrong is said, but P4 is not answered", async () => {
    const b = await open(); const $ = q(b);
    await run(b, "#kp2");
    expect($("#kd1 .ok")).not.toBeNull(); expect($("#kd2 .bad")).not.toBeNull(); expect($("#kd3 .ok")).not.toBeNull();
    b.close();
  });
  it("P4 cut off and answering from its own copy: answered, but not consistent", async () => {
    const b = await open(); const $ = q(b);
    await run(b, "#kp3");
    expect($("#kd1 .bad")).not.toBeNull(); expect($("#kd2 .ok")).not.toBeNull(); expect($("#kd3 .ok")).not.toBeNull();
    expect(b.errors).toEqual([]); b.close();
  });
});

describe("answering-while-cut-off: waiting a timer", () => {
  const go = async (b, id) => { click(b.document.querySelector(id)); await until(() => !b.document.querySelector("#gask").disabled); };
  const bad = b => b.document.querySelectorAll("#gstand .bad").length;
  it("with no failure, every read returns the latest write", async () => {
    const b = await open();
    await go(b, "#gask"); await go(b, "#gmove"); await go(b, "#gask2"); await go(b, "#gask");
    expect(bad(b)).toBe(0); expect(b.errors).toEqual([]); b.close();
  });
  it("a write made while cut off, read after recovery elsewhere, returns a stale value", async () => {
    const b = await open();
    click(b.document.querySelector("#ghawk"));
    await go(b, "#gmove");                                       // timer runs out; P4 told it took effect
    expect(shown(b.document.querySelector("#gsay"))).toMatch(/timer ran out/);
    click(b.document.querySelector("#ghawk"));                   // network restored
    await go(b, "#gask2");                                       // P2 reads the primary's copy, which never heard
    expect(bad(b)).toBeGreaterThan(0);
    expect(shown(b.document.querySelector("#gsay"))).toMatch(/message was lost earlier/);
    expect(b.errors).toEqual([]); b.close();
  });
  it("reset clears the answers", async () => {
    const b = await open();
    await go(b, "#gask"); click(b.document.querySelector("#greset"));
    expect(shown(b.document.querySelector("#gstand"))).toMatch(/Answers given: none/); b.close();
  });
});

describe("answering-while-cut-off: two writes during a loss", () => {
  const rows = b => all(b, "#twotab tr").slice(1).map(r => [...r.children].slice(1).map(shown));
  it("two clients are told different values took effect, then the later sequence number wins everywhere", async () => {
    const b = await open(); const $ = q(b);
    expect(new Set(rows(b).map(String)).size).toBe(1);
    click($("#twonext"));
    const mid = rows(b);
    expect(new Set(mid.map(String)).size).toBe(2);               // P4 disagrees with the rest
    expect(mid[3][1]).toMatch(/own write/);
    click($("#twonext")); click($("#twonext"));
    const end = rows(b);
    expect(new Set(end.map(String)).size).toBe(1);
    expect(end[0][1]).toBe("3");
    b.close();
  });
});

describe("answering-while-cut-off: two windy nights", () => {
  it("with unbounded delay a node cannot tell a lost message from a slow one, and answers wrongly either way", async () => {
    const b = await open(); const $ = q(b);
    click($("#windask")); await idle(b, "#windans");
    expect(shown($("#windsay"))).toMatch(/unbounded delay/);
    click($("#windans"));
    expect($("#windsay .bad")).not.toBeNull(); expect(shown($("#windsay"))).toMatch(/it is wrong/);
    await idle(b, "#windgo");
    click($("#windgo")); await until(() => $("#windsay").textContent.includes("only delayed") || /only delayed/.test(shown($("#windsay"))));
    expect(shown($("#windsay"))).toMatch(/no message was lost/);
    click($("#windreset")); expect($("#windask").disabled).toBe(false);
    expect(b.errors).toEqual([]); b.close();
  });
});
