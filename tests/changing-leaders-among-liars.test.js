import { describe, it, expect } from "vitest";
import { loadBook, click, shown } from "./harness.js";

const open = () => loadBook("changing-leaders-among-liars", { reg: "m" });
const q = b => s => b.document.querySelector(s);
const all = (b, s) => [...b.document.querySelectorAll(s)];
const until = async (f, ms = 5000) => { const t = Date.now(); while (!f()) { if (Date.now() - t > ms) throw new Error("timed out"); await new Promise(r => setTimeout(r, 2)); } };

describe("changing-leaders-among-liars: one phase, counted both ways", () => {
  it("all-to-all costs 12 messages for four replicas", async () => {
    const b = await open(); const $ = q(b);
    click($("#voteall")); expect([$("#voteall").disabled, $("#voteone").disabled]).toEqual([true, true]);
    await until(() => !$("#voteall").disabled);
    expect($("#votecount").textContent).toBe("12"); expect(shown($("#votesay"))).toMatch(/12 messages/);
    b.close();
  });
  it("through a leader it costs 6: three votes in, three certificates out", async () => {
    const b = await open(); const $ = q(b);
    click($("#voteone")); await until(() => !$("#voteone").disabled);
    expect($("#votecount").textContent).toBe("6"); expect(shown($("#votesay"))).toMatch(/6 messages.*3 votes in, 3 certificates out/);
    expect(b.errors).toEqual([]); b.close();
  });
});

describe("changing-leaders-among-liars: the rule for the first vote", () => {
  const opts = b => all(b, "#ruleopts button");
  it("offers four proposals; the checks stay hidden until one is chosen", async () => {
    const b = await open();
    expect(opts(b)).toHaveLength(4); expect(b.document.querySelector("ul.checks").hidden).toBe(true);
    b.close();
  });
  it("a proposal on top of the locked block is voted for", async () => {
    const b = await open(); const $ = q(b);
    click(opts(b)[0]);
    expect($("#rule3 .ok")).not.toBeNull(); expect(shown($("#rulesay"))).toMatch(/first half holds/);
    expect(b.document.querySelector("ul.checks").hidden).toBe(false);
    b.close();
  });
  it("a rival block is voted for only with a certificate from a later view than the lock", async () => {
    const b = await open(); const $ = q(b);
    click(opts(b)[1]); expect($("#rule3 .bad")).not.toBeNull(); expect(shown($("#rulesay"))).toMatch(/Neither half holds/);     // view 2 < 4
    click(opts(b)[2]); expect($("#rule3 .bad")).not.toBeNull();                                                                 // view 3 < 4
    click(opts(b)[3]); expect($("#rule3 .ok")).not.toBeNull(); expect(shown($("#rulesay"))).toMatch(/second half holds/);       // view 6 > 4
    expect(all(b, "#ruleopts .on")).toHaveLength(1);
    b.close();
  });
});

describe("changing-leaders-among-liars: two certificates share an honest replica", () => {
  const pick = (b, box, k) => click(b.document.querySelector(`#${box} button[data-k="${k}"]`));
  const sharedCount = b => (shown(b.document.querySelectorAll("#lackstand > div")[2]).match(/R\d/g) || []).length;
  it("asks for both choices first", async () => {
    const b = await open(); expect(shown(b.document.querySelector("#lacksay"))).toMatch(/Pick one replica for each certificate/); b.close();
  });
  it("any two quorums of three out of four overlap in at least two replicas", async () => {
    const b = await open();
    for (const x of [1, 2, 3, 4]) for (const y of [1, 2, 3, 4]) {
      pick(b, "lackA", x); pick(b, "lackB", y);
      expect(sharedCount(b)).toBe(x === y ? 3 : 2);
    }
    b.close();
  });
});

describe("changing-leaders-among-liars: the hidden lock", () => {
  const slow = (b, k) => click(all(b, "#hidslow button")[k - 1]);
  it("with two phases, a leader can miss the only replica that holds the lock", async () => {
    const b = await open(); const $ = q(b);
    expect(shown($("#hidsay"))).toMatch(/Pick the slowest replica/);
    slow(b, 3); expect($("#hidsay .bad")).not.toBeNull(); expect(shown($("#hidsay"))).toMatch(/lock stayed hidden/);
    slow(b, 1); expect($("#hidsay .bad")).toBeNull(); expect(shown($("#hidsay"))).toMatch(/need not include R3/);
    b.close();
  });
  it("with three phases, whichever replica answers last, the lock cannot hide", async () => {
    const b = await open(); const $ = q(b);
    click($("#hid3"));
    for (const k of [1, 2, 3, 4]) { slow(b, k); expect($("#hidsay .bad")).toBeNull(); expect(shown($("#hidsay"))).toMatch(/cannot hide/); }
    expect(all(b, "#hidmen .pm.has")).toHaveLength(3);
    click($("#hid2")); expect(all(b, "#hidmen .pm.has")).toHaveLength(1);
    b.close();
  });
});

describe("changing-leaders-among-liars: a new leader every block", () => {
  const next = b => click(b.document.querySelector("#chainnext"));
  const stats = b => all(b, "#chainlist .stat").map(shown);
  it("a block is proposed, then has a first certificate, then locks, then commits", async () => {
    const b = await open(); const $ = q(b);
    for (let i = 0; i < 4; i++) next(b);
    expect(shown($("#chainterm"))).toBe("view 4");
    expect(stats(b)).toEqual(["new proposal", "first certificate", "locked on", "committed"]);
    b.close();
  });
  it("the leader rotates through the four replicas", async () => {
    const b = await open(); const $ = q(b);
    const who = [];
    for (let i = 0; i < 5; i++) { next(b); who.push(shown($("#chainsay")).match(/R(\d) proposes/)[1]); }
    expect(who).toEqual(["1", "2", "3", "4", "1"]);
    b.close();
  });
  it("after seven views the button stops and every block behind commits", async () => {
    const b = await open(); const $ = q(b);
    for (let i = 0; i < 9; i++) next(b);
    expect($("#chainnext").disabled).toBe(true); expect(shown($("#chainterm"))).toBe("view 7");
    expect(shown($("#chainlist"))).toMatch(/Every block behind them is committed/);
    click($("#chainreset")); expect($("#chainnext").disabled).toBe(false); expect(shown($("#chainterm"))).toBe("no view yet");
    expect(b.errors).toEqual([]); b.close();
  });
});
