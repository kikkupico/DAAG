import { describe, it, expect } from "vitest";
import { loadBook, click, text } from "./harness.js";

const open = () => loadBook("knowing-when-to-wait", { reg: "m" });
const q = b => s => b.document.querySelector(s);

describe("knowing-when-to-wait: questions as rules on facts heard so far", () => {
  it("a yes to the 'no claim' question is taken back when a claim arrives; the growing question never is", async () => {
    const b = await open(); const $ = q(b);
    b.window.Math.random = () => .5;            // a stable sort: copy, note, claim, copy
    click($("#greset"));
    expect(text($("#gsay"))).toMatch(/guessing/);
    for (let i = 0; i < 3; i++) click($("#gnext"));
    expect(text($("#gtbl"))).toMatch(/Node 3 has claimed the item/);
    for (let i = 0; i < 2; i++) click($("#gnext"));  // a fifth press does nothing
    expect($("#gtbl").querySelectorAll("tr").length).toBe(1 + 5);  // header + start + 4 messages
    expect($("#gtbl").querySelectorAll("td.was").length).toBe(1);
    expect(text($("#gsay"))).toMatch(/All four messages are in.*in this order or any other/);
    expect(b.errors).toEqual([]); b.close();
  });
  it("in any order the growing question is never taken back", async () => {
    const b = await open(); const $ = q(b);
    for (let k = 0; k < 25; k++) { click($("#greset")); for (let i = 0; i < 4; i++) click($("#gnext")); }
    expect(b.errors).toEqual([]);
    expect(text($("#gsay"))).toMatch(/All four messages are in|taken back/);
    b.close();
  });
});

describe("knowing-when-to-wait: the waiting chain and the unwanted work", () => {
  it("a ring, once found, stays found", async () => {
    const b = await open(); const $ = q(b);
    expect(text($("#ringsay"))).toMatch(/No ring found yet/);
    click($("#tell1")); click($("#tell2")); expect(text($("#ringsay"))).toMatch(/No ring found yet/);
    click($("#tell3")); expect(text($("#ringsay"))).toMatch(/A ring/);
    expect(b.errors).toEqual([]); b.close();
  });
  it("a data set that looks unwanted is shown to be wanted once the chain is told", async () => {
    const b = await open(); const $ = q(b);
    expect(text($("#citesay"))).toMatch(/looks/);
    click($("#tell1")); click($("#tell2"));
    expect(text($("#citesay"))).toMatch(/root reaches Y after all/);
    click($("#tellreset")); expect(text($("#citesay"))).toMatch(/looks/);
    b.close();
  });
});

describe("knowing-when-to-wait: the roster", () => {
  it("with a roster, the answer comes once all four are heard, and the count stops at four", async () => {
    const b = await open(); const $ = q(b);
    expect([text($("#rn")), text($("#rof"))]).toEqual(["0", "4"]);
    for (let i = 0; i < 6; i++) click($("#rnext"));
    expect(text($("#rn"))).toBe("4"); expect(text($("#rsay"))).toMatch(/every data set is empty/);
    b.close();
  });
  it("with no roster, no answer can ever be given", async () => {
    const b = await open(); const $ = q(b);
    click($('#rmode button[data-v="0"]'));
    expect(text($("#rof"))).toBe("?");
    for (let i = 0; i < 4; i++) click($("#rnext"));
    expect(text($("#rsay"))).toMatch(/No answer can be given/);
    click($("#rreset")); expect(text($("#rn"))).toBe("0");
    b.close();
  });
});

describe("knowing-when-to-wait: waiting only once", () => {
  it("with a manifest, the checkout message is held until the three it names have come", async () => {
    const b = await open(); const $ = q(b);
    click($("#n3")); expect($("#nshelves .it.held")).not.toBeNull();
    expect(text($("#nsay"))).toMatch(/3 of them have not come/);
    click($("#n0")); click($("#n1")); expect(text($("#nsay"))).toMatch(/1 of them has not come/);
    click($("#n2"));
    expect($("#nsay .ok")).not.toBeNull(); expect(text($("#nsay"))).toMatch(/Only item B is fetched/);
    expect(b.errors).toEqual([]); b.close();
  });
  it("without a manifest, closing at once on a checkout message that outran the others is wrong", async () => {
    const b = await open(); const $ = q(b);
    click($('#nmode button[data-v="0"]'));
    click($("#n0")); click($("#n3"));
    expect($("#nsay .bad")).not.toBeNull();
    click($("#nreset")); expect($("#nshelves .it.held")).toBeNull();
    b.close();
  });
  it("a notice pressed twice is counted once", async () => {
    const b = await open(); const $ = q(b);
    click($("#n0")); click($("#n0"));
    expect($("#nshelves .shelf").querySelectorAll(".it").length).toBe(1);
    b.close();
  });
});
