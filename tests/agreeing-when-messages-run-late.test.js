import { describe, it, expect } from "vitest";
import { loadBook, click, shown } from "./harness.js";

const open = () => loadBook("agreeing-when-messages-run-late", { reg: "m" });
const q = b => s => b.document.querySelector(s);
const all = (b, s) => [...b.document.querySelectorAll(s)];
const pickBtn = (b, id, i) => click(all(b, `${id} button`)[i]);

describe("agreeing-when-messages-run-late: the wind", () => {
  it("spans pass one at a time; the tally counts those received in time", async () => {
    const b = await open(); const $ = q(b);
    expect(all(b, "#spans .sp")).toHaveLength(10);
    expect(all(b, "#spans .sp.empty")).toHaveLength(10);
    for (let i = 0; i < 10; i++) click($("#windnext"));
    expect($("#windnext").disabled).toBe(true);
    expect($("#wlet").textContent).toBe("10");
    const inTime = all(b, "#spans .sp").filter(r => r.querySelector(".ok")).length;
    expect($("#win").textContent).toBe(String(inTime));
    b.close();
  });
  it("showing when the network settled: every span after it was received in time", async () => {
    const b = await open(); const $ = q(b);
    for (let i = 0; i < 10; i++) click($("#windnext"));
    click($("#windshow"));
    const D = +shown($("#windsay")).match(/settled after span (\d+)/)[1];
    expect(D).toBeGreaterThanOrEqual(3); expect(D).toBeLessThanOrEqual(6);
    const rows = all(b, "#spans .sp");
    rows.forEach((r, i) => { if (i + 1 > D) expect(r.querySelector(".ok")).not.toBeNull(); });
    expect(rows[D - 1].classList.contains("cut")).toBe(true);
    expect($("#windshow").disabled).toBe(true);
    b.close();
  });
  it("asking before the settling has happened is refused", async () => {
    const b = await open(); const $ = q(b);
    click($("#windnext")); expect($("#windshow").disabled).toBe(false);
    click($("#windshow")); expect(shown($("#windsay"))).toMatch(/has not settled yet/);
    click($("#windreset")); expect($("#wlet").textContent).toBe("0"); expect($("#windshow").disabled).toBe(true);
    b.close();
  });
});

describe("agreeing-when-messages-run-late: a message arrives", () => {
  it("every message is either counted or set aside, and only the last five are listed", async () => {
    const b = await open(); const $ = q(b);
    for (let i = 0; i < 40; i++) click($("#polenext"));
    expect(+$("#pcount").textContent + +$("#paside").textContent).toBe(40);
    expect(all(b, "#pole .e")).toHaveLength(5);
    expect(all(b, "#pole .e.ok2").length + all(b, "#pole .e.late").length).toBe(5);
    click($("#poler")); expect([$("#pcount").textContent, $("#paside").textContent, all(b, "#pole .e").length]).toEqual(["0", "0", 0]);
    b.close();
  });
  it("a message sent in an earlier round is set aside; one from the same round counts", async () => {
    const b = await open(); const $ = q(b);
    for (let i = 0; i < 60; i++) click($("#polenext"));
    expect(+$("#pcount").textContent).toBeGreaterThan(0); expect(+$("#paside").textContent).toBeGreaterThan(0);
    b.close();
  });
});

describe("agreeing-when-messages-run-late: one phase, round by round", () => {
  it("works the four rounds out from the starting locks", async () => {
    const b = await open(); const $ = q(b);
    expect(shown($("#turnc2"))).toMatch(/Names sent to P1: 3 for 0, 4 for 1/);
    expect(shown($("#turnc3"))).toMatch(/may propose either.*P1 proposes 0/);
    expect(shown($("#turnc4"))).toMatch(/decides 0/);
    expect(shown($("#turnc5"))).toMatch(/releases 1, phase 2/);
    b.close();
  });
});

describe("agreeing-when-messages-run-late: a lock in phase five", () => {
  it("asks for both choices before judging", async () => {
    const b = await open(); const $ = q(b);
    expect(shown($("#verdict"))).toMatch(/Choose how many/);
    pickBtn(b, "#pickk", 2); expect(shown($("#verdict"))).toMatch(/Now choose how many/);
    b.close();
  });
  it("a value can be decided only if acks reach the coordinator in time; the locks then forbid proposing the other value", async () => {
    const b = await open(); const $ = q(b);
    pickBtn(b, "#pickk", 2); pickBtn(b, "#pickm", 2);            // 3 locks, 2 acks
    expect(shown($("#verdict"))).toMatch(/decides 0/); expect(shown($("#verdict"))).toMatch(/1 can never be proposed/);
    pickBtn(b, "#pickm", 1);
    expect(shown($("#verdict"))).toMatch(/does not decide/); expect(shown($("#verdict"))).toMatch(/1 can never be proposed/);
    b.close();
  });
  it("with at most one lock, the other value can still be proposed", async () => {
    const b = await open(); const $ = q(b);
    pickBtn(b, "#pickk", 0); pickBtn(b, "#pickm", 1);
    expect(shown($("#verdict"))).toMatch(/1 can be proposed/);
    b.close();
  });
  it("you cannot claim more acks than there are locks", async () => {
    const b = await open();
    pickBtn(b, "#pickk", 0);                                      // one lock
    const m = all(b, "#pickm button");
    expect(m.map(x => x.disabled)).toEqual([false, false, true, true, true]);
    b.close();
  });
});

describe("agreeing-when-messages-run-late: when the network settles", () => {
  it("counts rounds from the settling to the decision", async () => {
    const b = await open(); const $ = q(b);
    expect(shown($("#nightsay2"))).toMatch(/Choose when the network settles/);
    pickBtn(b, "#pickt", 1); pickBtn(b, "#pickg", 2);              // phase 2, round 3 of it
    expect(shown($("#nightsay2"))).toMatch(/settles in round 7, during phase 2/);
    expect(shown($("#nightsay2"))).toMatch(/8 rounds after the settling/);
    expect(all(b, "#nightrow .nt")).toHaveLength(7);
    expect(all(b, "#nightrow .nt")[3].classList.contains("own1")).toBe(true);
    expect(all(b, "#nightrow .nt")[4].classList.contains("own2")).toBe(true);
    expect(all(b, "#nightrow i.drop")).toHaveLength(1);
    b.close();
  });
});

describe("agreeing-when-messages-run-late: two against two", () => {
  it("no one can give up waiting before any round has passed", async () => {
    const b = await open(); const $ = q(b);
    expect([$("#twoa").disabled, $("#twob").disabled]).toEqual([true, true]);
    click($("#twoglass")); expect([$("#twoa").disabled, $("#twob").disabled]).toEqual([false, false]);
    b.close();
  });
  it("once both pairs have given up, the network can hold messages longer and the pairs decide differently", async () => {
    const b = await open(); const $ = q(b);
    click($("#twoglass")); click($("#twoglass")); click($("#twoa"));
    expect(shown($("#twosay"))).toMatch(/Now say when P3 and P4 give up/);
    click($("#twoglass")); click($("#twob"));
    expect(shown($("#twosay"))).toMatch(/cannot tell the third execution from their own/);
    expect($("#twoglass").disabled).toBe(true);
    expect(all(b, "#nights .nightc")).toHaveLength(3);
    expect(shown(all(b, "#nights .nightc")[2])).toMatch(/Two values: the first property is broken/);
    click($("#twor")); expect($("#twoglass").disabled).toBe(false);
    expect(b.errors).toEqual([]); b.close();
  });
  it("the round counter stops at twelve", async () => {
    const b = await open(); const $ = q(b);
    for (let i = 0; i < 20; i++) click($("#twoglass"));
    expect($("#twoglass").disabled).toBe(true);
    expect(all(b, "#nights .nightc")[0].querySelectorAll(".gbar i.on")).toHaveLength(12);
    b.close();
  });
});

describe("agreeing-when-messages-run-late: how many processes are enough", () => {
  const set = (b, w, f, c) => { pickBtn(b, "#pickw", w); pickBtn(b, "#pickf", f); pickBtn(b, "#pickc", c); };
  const out = b => shown(b.document.querySelector("#need"));
  it("asks for all three choices", async () => {
    const b = await open(); expect(out(b)).toMatch(/Choose the network/);
    pickBtn(b, "#pickw", 1); expect(out(b)).toMatch(/Choose the network/); b.close();
  });
  it("asynchronous networks admit no protocol at all", async () => {
    const b = await open(); set(b, 2, 0, 0); expect(out(b)).toMatch(/No protocol/); b.close();
  });
  it("synchronous networks with crashes, omissions or signed lies bear any number", async () => {
    const b = await open();
    for (const f of [0, 1, 2]) { set(b, 0, f, 0); expect(out(b)).toMatch(/Any number/); }
    set(b, 0, 3, 0); expect(out(b)).toMatch(/4 processes/);      // unsigned lies still need 3f+1
    b.close();
  });
  it("partial synchrony: 2f+1 for crashes and omissions, 3f+1 for lies, signed or not", async () => {
    const b = await open();
    set(b, 1, 0, 0); expect(out(b)).toMatch(/3 processes are needed.*Four processes are enough/);
    set(b, 1, 1, 2); expect(out(b)).toMatch(/7 processes are needed.*Four processes are not enough/);  // crash/omit x3 -> 2*3+1
    set(b, 1, 2, 0); expect(out(b)).toMatch(/4 processes are needed.*Signatures change nothing/);
    set(b, 1, 3, 1); expect(out(b)).toMatch(/7 processes are needed.*not enough/);
    b.close();
  });
});
