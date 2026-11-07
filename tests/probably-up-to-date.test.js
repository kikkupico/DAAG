import { describe, it, expect } from "vitest";
import { loadBook, click, shown } from "./harness.js";

const open = () => loadBook("probably-up-to-date", { reg: "m" });
const q = b => s => b.document.querySelector(s);
const pick = (b, id, v) => click(b.document.querySelector(`#${id} button[data-v="${v}"]`));

describe("probably-up-to-date: how many to wait for", () => {
  it("groups that add up to more than three always share a replica", async () => {
    const b = await open(); const $ = q(b);
    pick(b, "ww", 2); pick(b, "wr", 2);
    expect(shown($("#waitsay"))).toMatch(/more than three/);
    for (let i = 0; i < 40; i++) { click($("#waitgo")); expect(shown($("#waitsay"))).toMatch(/handed the new version/); }
    expect(b.errors).toEqual([]); b.close();
  });
  it("groups of one and one can miss, and then the client is handed the old copy", async () => {
    const b = await open(); const $ = q(b);
    expect(shown($("#waitsay"))).toMatch(/do not add up to more than three/);
    const seen = new Set();
    for (let i = 0; i < 80; i++) { click($("#waitgo")); seen.add(!!$("#waitsay .bad")); }
    expect([...seen].sort()).toEqual([false, true]);
    b.close();
  });
});

describe("probably-up-to-date: the chance of a miss", () => {
  it("the table follows C(n-w,r)/C(n,r)", async () => {
    const b = await open(); const rows = [...b.document.querySelectorAll("#misstbl tr")].slice(1).map(r => [...r.children].map(shown).join(" | "));
    expect(rows[0]).toBe("3 | 1 and 1 | 67 in 100");
    expect(rows[1]).toBe("10 | 3 and 3 | 29 in 100");
    expect(rows[2]).toMatch(/^30 \| 9 and 9 \| about 1 in \d+$/);
    expect(rows[3]).toMatch(/^100 \| 30 and 30 \| about [\d.]+ in a million$/);
    b.close();
  });
  it("leeway: more versions allowed means a higher chance, and two replicas beat one", async () => {
    const b = await open(); const $ = q(b);
    const pcts = () => [...b.document.querySelectorAll("#kbars .v")].map(e => parseInt(e.textContent));
    const one = pcts();
    expect(one).toEqual([...one].sort((a, c) => a - c));
    pick(b, "kw", 2);
    expect(pcts()[0]).toBeGreaterThan(one[0]);
    b.close();
  });
});

describe("probably-up-to-date: the replay", () => {
  it("never behind when the groups must share a replica", async () => {
    const b = await open(); const $ = q(b);
    pick(b, "lw", 2); pick(b, "lr", 2);
    click($("#lgo"));
    expect(shown($("#lsay"))).toMatch(/Never behind/);
    expect(b.errors).toEqual([]); b.close();
  });
  it("the chance of the new version rises with the time since the commit", async () => {
    const b = await open(); const $ = q(b);
    expect(shown($("#lsay"))).toBe("Choose, then play.");
    click($("#lgo"));
    const v = [...b.document.querySelectorAll("#lbars .v")].map(e => e.querySelector("i").style.width).map(parseFloat);
    expect(v).toHaveLength(5);
    expect(v[4]).toBeGreaterThan(v[0]);
    pick(b, "lr", 2); expect(shown($("#lsay"))).toBe("Choose, then play.");  // a changed choice clears the result
    b.close();
  });
});

describe("probably-up-to-date: never going backwards", () => {
  it("allowing the newest k versions raises k, and the chance of a miss falls", async () => {
    const b = await open(); const $ = q(b);
    expect(shown($("#bk"))).toBe("2");
    pick(b, "bq", 0); expect(shown($("#bk"))).toBe("1"); expect(shown($("#bp"))).toBe("67 in 100");
    pick(b, "bq", 99); expect(shown($("#bk"))).toBe("100"); expect(shown($("#bp"))).toBe("less than 1 in a million");
    b.close();
  });
});
