import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { loadBook, click } from "./harness.js";

/* the shared helpers every book builds on (assets/js/book.js, assets/js/registers.js) */
describe("BOOK and REG helpers", () => {
  let b, BOOK, REG, d;
  beforeAll(async () => { b = await loadBook("knowing-when-to-wait"); ({ BOOK, REG } = b.window); d = b.document; });
  afterAll(() => b.close());

  it("$ and $$ query within a root", () => {
    expect(BOOK.$("body")).toBe(d.body);
    expect(Array.isArray(BOOK.$$("section"))).toBe(true);
  });
  it("el builds namespaced SVG with attributes and appends to a parent", () => {
    const svg = d.createElementNS(BOOK.NS, "svg");
    const c = BOOK.el("circle", { r: 5, fill: "red" }, svg);
    expect(c.namespaceURI).toBe(BOOK.NS);
    expect(c.getAttribute("r")).toBe("5");
    expect(c.parentNode).toBe(svg);
  });
  it("rnd stays in [0,n)", () => {
    for (let i = 0; i < 200; i++) { const v = BOOK.rnd(7); expect(Number.isInteger(v) && v >= 0 && v < 7).toBe(true); }
  });
  it("tween under reduced motion finishes at once with 1", async () => {
    const seen = []; await BOOK.tween(500, u => seen.push(u)); expect(seen).toEqual([1]);
  });
  it("sleep resolves at once under reduced motion", async () => {
    const t = Date.now(); await BOOK.sleep(5000); expect(Date.now() - t).toBeLessThan(500);
  });
  it("button makes an SVG element accessible and answers click, Enter and Space only", () => {
    const g = d.createElementNS(BOOK.NS, "g"); let n = 0;
    BOOK.button(g, "go", () => n++);
    expect(g.getAttribute("role")).toBe("button"); expect(g.getAttribute("aria-label")).toBe("go"); expect(g.getAttribute("tabindex")).toBe("0");
    click(g);
    for (const key of ["Enter", " ", "a"]) g.dispatchEvent(new b.window.KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
    expect(n).toBe(3);
  });
  it("REG.dual pairs both registers", () => {
    expect(REG.dual("a", "b")).toBe('<span class="i">a</span><span class="m">b</span>');
  });
  it("REG.vis reads the visible register", () => {
    const e = d.createElement("div"); e.innerHTML = REG.dual("allegory", "computing");
    d.body.setAttribute("data-reg", "i"); expect(REG.vis(e)).toBe("allegory");
    d.body.setAttribute("data-reg", "m"); expect(REG.vis(e)).toBe("computing");
  });
  it("REG.dtext adds one SVG text per register", () => {
    const g = d.createElementNS(BOOK.NS, "g"); const [i, m] = REG.dtext(g, { class: "lab" }, "x", "y");
    expect(i.getAttribute("class")).toBe("lab i"); expect(m.getAttribute("class")).toBe("lab m");
    expect([i.textContent, m.textContent]).toEqual(["x", "y"]);
  });
});
