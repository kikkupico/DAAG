import { describe, it, expect } from "vitest";
import { loadBook, click, shown } from "./harness.js";

const open = () => loadBook("ordering-without-clocks", { reg: "m" });
const q = b => s => b.document.querySelector(s);
const until = async (f, ms = 5000) => { const t = Date.now(); while (!f()) { if (Date.now() - t > ms) throw new Error("timed out"); await new Promise(r => setTimeout(r, 2)); } };
const ev = (b, svg, label) => b.document.querySelector(`${svg} [role=button][aria-label="${label}"]`);
const pickPair = (b, svg, x, y) => { click(ev(b, svg, x)); click(ev(b, svg, y)); };
const E = {
  a: "P1’s first event", b: "P1 sends a message to P2", c: "P2’s first event", d: "P2 receives P1’s message",
  e: "P2 sends a message to P3", g: "P3’s second event", l: "P1 receives P3’s message",
};

describe("ordering-without-clocks: the gate (arrival is not the test)", () => {
  it("either message can win, and after both have the page says arrival cannot be the test", async () => {
    const b = await open(); const $ = q(b);
    click($("#race1")); expect($("#race2").disabled).toBe(true);
    await until(() => !$("#race1").disabled);
    expect(shown($("#racesay"))).toMatch(/P1's message reaches P3 first/);
    expect(shown($("#racesay"))).not.toMatch(/cannot be the test/);
    click($("#race2")); await until(() => !$("#race2").disabled);
    expect(shown($("#racesay"))).toMatch(/P2's message reaches P3 first.*Order of arrival cannot be the test/);
    expect(b.errors).toEqual([]); b.close();
  });
});

describe("ordering-without-clocks: coming-before", () => {
  it("draws all ten events as buttons", async () => {
    const b = await open();
    expect(b.document.querySelectorAll("#cbsvg [role=button]").length).toBe(10); b.close();
  });
  it("follows a chain of log steps and messages from send to receive", async () => {
    const b = await open(); const $ = q(b);
    pickPair(b, "#cbsvg", E.b, E.d);
    expect(shown($("#cbsay"))).toMatch(/happened before/);
    pickPair(b, "#cbsvg", E.c, E.l);                       // c → d → e → … → l
    expect(shown($("#cbsay"))).toMatch(/P2’s first event.* happened before .*P1 receives P3’s message/);
    expect($("#cbsvg .hi")).not.toBeNull();
    b.close();
  });
  it("the order of the choice does not matter", async () => {
    const b = await open(); const $ = q(b);
    pickPair(b, "#cbsvg", E.l, E.a);
    expect(shown($("#cbsay"))).toMatch(/P1’s first event.* happened before .*P1 receives P3’s message/);
    b.close();
  });
  it("events with no chain between them are concurrent, whatever the clock says", async () => {
    const b = await open(); const $ = q(b);
    pickPair(b, "#cbsvg", E.a, E.c);
    expect($("#cbsay .bad")).not.toBeNull(); expect(shown($("#cbsay"))).toMatch(/concurrent/);
    expect($("#cbsvg .hi")).toBeNull();
    pickPair(b, "#cbsvg", E.g, E.d); expect(shown($("#cbsay"))).toMatch(/concurrent/);
    b.close();
  });
  it("one choice asks for a second", async () => {
    const b = await open(); click(ev(b, "#cbsvg", E.a));
    expect(shown(b.document.querySelector("#cbsay"))).toMatch(/Now choose a second event/); b.close();
  });
});

describe("ordering-without-clocks: precedence", () => {
  const cols = b => [1, 2, 3].map(h => [...b.document.querySelectorAll(`#pq${h} .e`)].map(e => e.textContent.trim()));
  it("three differing lists of six become one list on sorting", async () => {
    const b = await open(); const $ = q(b);
    const before = cols(b);
    expect(before.every(c => c.length === 6)).toBe(true);
    expect(new Set(before.map(String)).size).toBe(3);
    click($("#pqsort"));
    const after = cols(b);
    expect(new Set(after.map(String)).size).toBe(1);
    expect($("#pqsort").disabled).toBe(true);
    expect(shown($("#pqsay"))).toMatch(/none of them needed a clock/);
    click($("#pqmix")); expect($("#pqsort").disabled).toBe(false);
    b.close();
  });
  it("each mix keeps the same six entries", async () => {
    const b = await open(); const $ = q(b);
    const sorted = () => cols(b).map(c => [...c].sort().join("|"));
    for (let i = 0; i < 15; i++) { click($("#pqmix")); expect(new Set(sorted()).size).toBe(1); }
    b.close();
  });
});

describe("ordering-without-clocks: the column", () => {
  const rows = b => [...b.document.querySelectorAll("#colout tbody tr")].map(r => [...r.children].map(shown));
  it("a chain shows no row going the other way", async () => {
    const b = await open(); const $ = q(b);
    pickPair(b, "#colsvg", E.b, E.d);
    expect(rows(b)).toEqual([["P1", "2", "=", "2"], ["P2", "0", "<", "2"], ["P3", "0", "=", "0"]]);
    expect(shown($("#colsay"))).toMatch(/happened before/);
    b.close();
  });
  it("concurrent events have rows going both ways", async () => {
    const b = await open(); const $ = q(b);
    pickPair(b, "#colsvg", E.a, E.c);
    const syms = rows(b).map(r => r[2]);
    expect(syms).toContain(">"); expect(syms).toContain("<");
    expect(shown($("#colsay"))).toMatch(/concurrent/);
    b.close();
  });
  it("the clock can rank concurrent events as if they were ordered", async () => {
    const b = await open(); const $ = q(b);
    pickPair(b, "#colsvg", E.g, E.d);                      // timestamps 2 and 3, yet concurrent
    expect(shown($("#colsay"))).toMatch(/would have suggested a sequence that was never there/);
    b.close();
  });
});

describe("ordering-without-clocks: the goatherd", () => {
  it("the outside channel makes a request look earlier than its cause", async () => {
    const b = await open(); const $ = q(b);
    click($("#goatgo")); await until(() => !$("#goatgo").disabled);
    expect($("#goatgo").textContent).toBe("Again");
    expect($("#goatsay .bad")).not.toBeNull();
    expect(shown($("#goatsay"))).toMatch(/4.*9/);
    click($("#goatgo")); await until(() => !$("#goatgo").disabled);
    expect(b.errors).toEqual([]); b.close();
  });
});
