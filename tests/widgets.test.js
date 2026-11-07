import { describe, it, expect } from "vitest";
import { BOOKS, loadBook, click, text } from "./harness.js";

/* Every control a reader can press, pressed in turn, in each register: nothing may throw. */
describe.each(BOOKS)("%s widgets", slug => {
  it.each(["i", "m"])("survive every button press in register %s", async reg => {
    const b = await loadBook(slug, { reg });
    const { document: d } = b;
    expect(d.body.getAttribute("data-reg")).toBe(reg);
    const controls = [...d.querySelectorAll("button:not(.segb), [role=button]")];
    for (const c of controls) { click(c); await new Promise(r => setTimeout(r, 0)); }
    for (const s of d.querySelectorAll(".segb")) click(s);
    expect(b.errors).toEqual([]);
    b.close();
  });
});

describe("register switch", () => {
  it("flips data-reg, aria-pressed and remembers the choice", async () => {
    const b = await loadBook("what-you-can-promise-alone");
    const m = b.document.querySelector('.segb[data-reg="m"]');
    click(m);
    expect(b.document.body.getAttribute("data-reg")).toBe("m");
    expect(m.getAttribute("aria-pressed")).toBe("true");
    expect(b.document.querySelector('.segb[data-reg="i"]').getAttribute("aria-pressed")).toBe("false");
    expect(b.window.localStorage.getItem("daag-apart-reg")).toBe("m");
    b.close();
  });
});

const open = () => loadBook("what-you-can-promise-alone", { reg: "m" });
const q = b => s => b.document.querySelector(s);

describe("what-you-can-promise-alone: the cord", () => {
  it("starts with nothing read", async () => {
    const b = await open();
    expect(text(q(b)("#csay"))).toMatch(/nothing yet/);
    b.close();
  });
  it("with a manifest, X is held back until Y has arrived, then both are shown as written", async () => {
    const b = await open(); const $ = q(b);
    click($("#cx")); expect(text($("#csay"))).toMatch(/old X/);
    click($("#carr")); click($("#cx")); click($("#cy"));
    expect(text($("#csay"))).toMatch(/never between/);
    b.close();
  });
  it("without a manifest, X as written with Y old is flagged as half a transaction", async () => {
    const b = await open(); const $ = q(b);
    click($('#cmode button[data-v="0"]'));
    click($("#cx")); click($("#cy"));
    expect(text($("#csay"))).toMatch(/half of what was written together/);
    b.close();
  });
});

describe("what-you-can-promise-alone: the floor", () => {
  it("the stable version rises only when every replica has the write", async () => {
    const b = await open(); const $ = q(b);
    expect(text($("#ffloor"))).toBe("1");
    click($("#fwrite")); expect(text($("#fnew"))).toBe("2"); expect(text($("#ffloor"))).toBe("1");
    click($("#fc2")); expect(text($("#ffloor"))).toBe("1");
    click($("#fc3")); expect(text($("#ffloor"))).toBe("2");
    expect(b.errors).toEqual([]);
    b.close();
  });
});

describe("what-you-can-promise-alone: lost update", () => {
  it("concurrent increments lose one update when the messages are stopped", async () => {
    const b = await open(); const $ = q(b);
    click($("#b1")); click($("#b2")); click($("#bmeet"));
    expect(text($("#bsay"))).toMatch(/rose by 1/);
    b.close();
  });
  it("with messages running, every increment counts", async () => {
    const b = await open(); const $ = q(b);
    click($('#bmode button[data-v="0"]'));
    click($("#b1")); click($("#b2")); click($("#bmeet"));
    expect(text($("#bsay"))).toMatch(/one higher for every increment/);
    b.close();
  });
  it("meeting before any write says so", async () => {
    const b = await open(); const $ = q(b);
    click($("#bmeet"));
    expect(text($("#bsay"))).toMatch(/Nothing has been written/);
    b.close();
  });
});

describe("what-you-can-promise-alone: the latest version", () => {
  it("a stoppage longer than the bound breaks the promise", async () => {
    const b = await open(); const $ = q(b);
    click($('#tbound button[data-v="day"]')); click($('#tstop button[data-v="month"]'));
    expect(text($("#tsay"))).toMatch(/promise is broken/);
    click($('#tbound button[data-v="month"]')); click($('#tstop button[data-v="day"]'));
    expect(text($("#tsay"))).not.toMatch(/promise is broken/);
    b.close();
  });
});
