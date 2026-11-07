import { describe, it, expect } from "vitest";
import { loadBook, click, shown } from "./harness.js";

const open = () => loadBook("changes-that-never-clash", { reg: "m" });
const q = b => s => b.document.querySelector(s);
const pick = (b, id, v) => click(b.document.querySelector(`#${id} button[data-v="${v}"]`));
const make = (b, i) => click(b.document.querySelector(`#tmake button[data-i="${i}"]`));
const values = b => [...b.document.querySelectorAll("#tabs .ptab h5 b")].map(e => e.textContent);

describe("changes-that-never-clash: one entry each, take the maximum", () => {
  it("starts at zero everywhere", async () => {
    const b = await open(); expect(values(b)).toEqual(["0", "0", "0"]); b.close();
  });
  it("merging by maximum converges to the number of increments made, and repeating a merge changes nothing", async () => {
    const b = await open(); const $ = q(b);
    make(b, 0); make(b, 1); make(b, 1);
    for (const [f, t] of [[0, 1], [1, 2], [1, 0], [2, 1], [0, 2], [0, 2]]) { pick(b, "tfrom", f); pick(b, "tto", t); click($("#tsend")); }
    expect(values(b)).toEqual(["3", "3", "3"]);
    expect($("#tsay .bad")).toBeNull();
    pick(b, "tfrom", 0); pick(b, "tto", 1); click($("#tsend"));
    expect(shown($("#tsay"))).toMatch(/changes nothing/);
    b.close();
  });
  it("merging by addition counts increments twice", async () => {
    const b = await open(); const $ = q(b);
    pick(b, "trule", "add"); make(b, 0);
    pick(b, "tfrom", 0); pick(b, "tto", 1); click($("#tsend")); click($("#tsend"));
    expect(values(b)[1]).toBe("2");
    expect($("#tsay .bad")).not.toBeNull();
    b.close();
  });
  it("merging a replica with itself is refused", async () => {
    const b = await open(); const $ = q(b);
    pick(b, "tfrom", 1); pick(b, "tto", 1); click($("#tsend"));
    expect(shown($("#tsay"))).toMatch(/two different replicas/);
    b.close();
  });
  it("reset zeroes everything", async () => {
    const b = await open(); make(b, 2); click(b.document.querySelector("#treset"));
    expect(values(b)).toEqual(["0", "0", "0"]); b.close();
  });
});

describe("changes-that-never-clash: the whole state or an operation", () => {
  it("receiving the state again changes nothing; replaying the operation counts twice", async () => {
    const b = await open(); const $ = q(b);
    click($("#wtable")); expect($("#wshown").textContent).toBe("1");
    click($("#wtable")); expect($("#wshown").textContent).toBe("1"); expect($("#wsay .ok")).not.toBeNull();
    click($("#wreset"));
    click($("#wnote")); click($("#wnote"));
    expect($("#wshown").textContent).toBe("2"); expect($("#wsay .bad")).not.toBeNull();
    b.close();
  });
});

describe("changes-that-never-clash: decrements and a count that must not go below zero", () => {
  it("decrementing on what the local state shows can take the merged value below zero", async () => {
    const b = await open(); const $ = q(b);
    click($("#l1")); click($("#l2")); click($("#lmeet"));
    expect($("#lsay .bad")).not.toBeNull(); expect(shown($("#lsay"))).toMatch(/below zero/);
    b.close();
  });
  it("decrementing only up to one's own increments never goes below zero", async () => {
    const b = await open(); const $ = q(b);
    pick(b, "lrule", "own");
    click($("#l2")); expect(shown($("#lsay"))).toMatch(/may not decrement/);
    click($("#l1")); click($("#lrec")); click($("#l2")); click($("#lmeet"));
    expect($("#lsay .ok")).not.toBeNull(); expect($("#lsay .bad")).toBeNull();
    b.close();
  });
});

describe("changes-that-never-clash: later stands, or both are kept", () => {
  it.each([["later", 1], ["both", 2]])("rule %s keeps %i account(s) whichever order they arrive in", async (rule, n) => {
    const b = await open(); const $ = q(b);
    pick(b, "hrule", rule);
    for (const first of [0, 1]) {
      pick(b, "hord", first);
      const shelves = [...b.document.querySelectorAll("#hout .shelf")];
      expect(shelves.map(s => s.querySelectorAll(".it").length)).toEqual([n, n]);
    }
    expect(b.errors).toEqual([]); b.close();
  });
});

describe("changes-that-never-clash: the add-wins set", () => {
  const on = b => b.document.querySelector("#olibs").textContent.match(/The element is in the set/g)?.length ?? 0;
  it("an add that was concurrent with a removal survives the merge", async () => {
    const b = await open(); const $ = q(b);
    click($("#oa1")); click($("#oa2")); click($("#os1"));        // library 1 strikes only the tag it can see
    click($("#omeet"));
    expect(on(b)).toBe(2); expect($("#osay .ok")).not.toBeNull();
    b.close();
  });
  it("removing every seen tag, then merging, leaves the element out", async () => {
    const b = await open(); const $ = q(b);
    click($("#oa1")); click($("#omeet")); click($("#os1")); click($("#os2")); click($("#omeet"));
    expect(on(b)).toBe(0); expect(shown($("#osay"))).toMatch(/out of the set/);
    b.close();
  });
  it("removing something never added says there is nothing to remove", async () => {
    const b = await open(); click(b.document.querySelector("#os1"));
    expect(shown(b.document.querySelector("#osay"))).toMatch(/nothing for it to remove/); b.close();
  });
});

describe("changes-that-never-clash: a compendium from its parts", () => {
  it("both copies settle alike; a fresh tag keeps the removed key alive", async () => {
    const b = await open(); const $ = q(b);
    click($("#mmeet"));
    expect($("#msay .ok")).not.toBeNull(); expect(shown($("#msay"))).toMatch(/comets is present at both/);
    expect(b.errors).toEqual([]); b.close();
  });
  it("a removed key that a link points at is flagged", async () => {
    const b = await open(); const $ = q(b);
    pick(b, "mcase", "ref"); click($("#mmeet"));
    expect($("#msay .bad")).not.toBeNull(); expect(shown($("#msay"))).toMatch(/links to a removed key/);
    expect(b.errors).toEqual([]); b.close();
  });
});

describe("changes-that-never-clash: not the same as one order", () => {
  it("both elements stand, though none of the six single orders would leave both", async () => {
    const b = await open();
    expect(shown(b.document.querySelector("#ordsay"))).toMatch(/E and F.*Of the 6 single orders.*none end with both/);
    expect(b.errors).toEqual([]); b.close();
  });
});
