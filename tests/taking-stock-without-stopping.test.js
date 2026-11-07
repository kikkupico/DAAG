import { describe, it, expect } from "vitest";
import { loadBook, click, shown } from "./harness.js";

const open = () => loadBook("taking-stock-without-stopping", { reg: "m" });
const q = b => s => b.document.querySelector(s);
const all = (b, s) => [...b.document.querySelectorAll(s)];

describe("taking-stock-without-stopping: the nine places to count", () => {
  it("has six channels and three local states, and counts each looked-at place once", async () => {
    const b = await open(); const $ = q(b);
    const channels = all(b, '#nine [role=button][aria-label^="The channel from"]');
    const states = all(b, '#nine [role=button][aria-label$="local state"]');
    expect([channels.length, states.length]).toEqual([6, 3]);
    click(channels[0]); click(channels[0]);
    expect(shown($("#ninecount"))).toBe("1 of nine looked at");
    [...channels, ...states].forEach(click);
    expect(shown($("#ninecount"))).toBe("9 of nine looked at");
    expect(shown($("#ninesay"))).toMatch(/All nine looked at/);
    expect(b.errors).toEqual([]); b.close();
  });
  it("only the chosen place is highlighted", async () => {
    const b = await open();
    const [c1, c2] = all(b, '#nine [role=button][aria-label^="The channel from"]');
    click(c1); click(c2);
    expect(all(b, "#nine .pick")).toEqual([c2]);
    b.close();
  });
});

describe("taking-stock-without-stopping: a cut", () => {
  const carts = b => all(b, '#cutsvg [role=button][aria-label*="-unit message"]');
  it("markers at every process give a consistent cut: no message crosses it backward", async () => {
    const b = await open(); const $ = q(b);
    expect(shown($("#cutsay"))).toMatch(/Each process recorded when the marker reached it/);
    expect(carts(b).length).toBeGreaterThan(0);
    expect($("#cutsvg .hi")).toBeNull();
    for (const c of carts(b)) { click(c); expect(shown($("#cutsay"))).not.toMatch(/backward/); expect(shown($("#cutsay"))).toMatch(/units/); }
    b.close();
  });
  it("recording at arbitrary times can let one message cross backward, and its units are counted twice", async () => {
    const b = await open(); const $ = q(b);
    click($("#cutbad"));
    expect(all(b, "#cutsvg .hi")).toHaveLength(1);
    expect($("#cutsay .bad")).not.toBeNull(); expect(shown($("#cutsay"))).toMatch(/crosses the cut backward.*counted again/);
    click($("#cutok")); expect($("#cutsvg .hi")).toBeNull();
    expect(b.errors).toEqual([]); b.close();
  });
});

describe("taking-stock-without-stopping: a morning nobody lived through", () => {
  const events = (b, id) => all(b, `${id} .ev`);
  it("the recorded state never happened in the lived order, but does in a rearrangement that swaps independent events", async () => {
    const b = await open(); const $ = q(b);
    expect(events(b, "#mlived")).toHaveLength(4); expect($("#moback").disabled).toBe(true);
    expect(events(b, "#mlived").filter(e => e.classList.contains("hit"))).toHaveLength(0);
    click($("#moswap"));
    expect(events(b, "#mcens")).toHaveLength(4);
    expect(events(b, "#mcens").filter(e => e.classList.contains("hit")).length).toBeGreaterThan(0);
    expect(shown($("#mosay"))).toMatch(/as it happened never passed through the recorded state/);
    expect([$("#moswap").disabled, $("#moback").disabled]).toEqual([true, false]);
    click($("#moback")); expect([$("#moswap").disabled, $("#moback").disabled]).toEqual([false, true]);
    b.close();
  });
  it("the explanation of why the swap is always possible appears on request", async () => {
    const b = await open(); click(b.document.querySelector("#mojoin"));
    expect(shown(b.document.querySelector("#mosay"))).toMatch(/Could a message tie/); b.close();
  });
});

describe("taking-stock-without-stopping: what the total is good for", () => {
  const shortBy = b => shown(all(b, "#dtab tr")[2].children[1]);
  it("a shortfall found by the snapshot is real now, and says the loss happened before it began", async () => {
    const b = await open(); const $ = q(b);
    expect(shortBy(b)).toBe("30"); expect($("#decsay .bad")).not.toBeNull();
    expect(shown($("#decsay"))).toMatch(/snapshot is short/);
    b.close();
  });
  it("a whole total only says nothing was lost when it began; a later loss is flagged", async () => {
    const b = await open(); const $ = q(b);
    click($('#dec .btn[data-case="after"]'));
    expect(shortBy(b)).toBe("0"); expect(shown($("#decsay"))).toMatch(/snapshot is whole/);
    expect($("#decsay .bad")).not.toBeNull();
    click($('#dec .btn[data-case="none"]'));
    expect(shortBy(b)).toBe("0"); expect($("#decsay .bad")).toBeNull(); expect($("#decsay .ok")).not.toBeNull();
    expect(b.errors).toEqual([]); b.close();
  });
  it("exactly one case button is marked on", async () => {
    const b = await open();
    for (const c of ["before", "after", "none"]) { click(b.document.querySelector(`#dec .btn[data-case="${c}"]`)); expect(all(b, "#dec .btn.on")).toHaveLength(1); }
    b.close();
  });
});
