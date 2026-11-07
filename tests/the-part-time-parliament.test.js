import { describe, it, expect } from "vitest";
import { loadBook, click, shown } from "./harness.js";

const open = () => loadBook("the-part-time-parliament", { reg: "m" });
const q = b => s => b.document.querySelector(s);
const all = (b, s) => [...b.document.querySelectorAll(s)];
const until = async (f, ms = 6000) => { const t = Date.now(); while (!f()) { if (Date.now() - t > ms) throw new Error("timed out"); await new Promise(r => setTimeout(r, 5)); } };

describe("the-part-time-parliament: consistency, two banquets", () => {
  it("two groups that each decide slot 37 without the other end with two values", async () => {
    const b = await open(); const $ = q(b);
    expect($("#bq2").disabled).toBe(true);
    click($("#bq1")); await until(() => !$("#bq2").disabled);
    expect(shown($("#scrsay"))).toMatch(/knows nothing of slot 37/);
    click($("#bq2")); await until(() => $("#scrsay .bad"));
    expect(shown($("#scrsay"))).toMatch(/Two logs, two different values in slot 37/);
    expect(all(b, "#banq .clash")).toHaveLength(6);
    b.close();
  });
  it("starting again puts the first group back and clears the clash", async () => {
    const b = await open(); const $ = q(b);
    click($("#bq1")); await until(() => !$("#bq2").disabled); click($("#bq2")); await until(() => $("#scrsay .bad"));
    click($("#bqr"));
    expect(all(b, "#banq .clash")).toHaveLength(0); expect($("#bq1").disabled).toBe(false);
    expect(shown($("#scrsay"))).toMatch(/Three processes are running/);
    expect(b.errors).toEqual([]); b.close();
  });
});

describe("the-part-time-parliament: the lottery", () => {
  it("every send ends delivered once, delivered twice or lost, and the tallies add up", async () => {
    const b = await open(); const $ = q(b);
    const total = () => ["#t-ok", "#t-two", "#t-lost"].reduce((n, s) => n + +$(s).textContent, 0);
    for (let i = 1; i <= 25; i++) { click($("#send")); await until(() => !$("#send").disabled); expect(total()).toBe(i); }
    expect(b.errors).toEqual([]); b.close();
  });
});

describe("the-part-time-parliament: majorities", () => {
  const seats = b => all(b, "#seats .seat");
  const countText = b => shown(b.document.querySelector("#count"));
  it("seven seats, all in; a majority needs four", async () => {
    const b = await open();
    expect(seats(b)).toHaveLength(7); expect(countText(b)).toBe("7 of 7 running · a majority");
    seats(b).slice(0, 3).forEach(click); expect(countText(b)).toBe("4 of 7 running · a majority");
    click(seats(b)[3]); expect(countText(b)).toBe("3 of 7 running · not a majority");
    b.close();
  });
  it("with fewer than four running, nothing can be decided", async () => {
    const b = await open(); const $ = q(b);
    seats(b).slice(0, 4).forEach(click);
    click($("#maj1"));
    expect(shown($("#majsay"))).toMatch(/not a majority, so nothing can/);
    expect(seats(b).filter(s => s.classList.contains("inA"))).toHaveLength(0);
    b.close();
  });
  it("any two majorities of seven share a member, who remembers the decision", async () => {
    const b = await open(); const $ = q(b);
    for (let i = 0; i < 40; i++) {
      click($("#maj1"));
      expect(seats(b).filter(s => s.classList.contains("inA"))).toHaveLength(4);
      click($("#maj2")); await until(() => !$("#maj1").disabled);
      const n = +shown($("#majsay")).match(/(\d+) of them (?:was|were) in the first majority/)[1];
      expect(n).toBeGreaterThanOrEqual(1);
    }
    expect(b.errors).toEqual([]); b.close();
  });
});

describe("the-part-time-parliament: the manuscript", () => {
  const row = (b, n) => b.document.querySelector(`#msrows tr[data-n="${n}"]`);
  it("lists five ballots", async () => {
    const b = await open(); expect(all(b, "#msrows tr").map(r => r.dataset.n)).toEqual(["2", "5", "14", "27", "29"]); b.close();
  });
  it("a ballot whose quorum never voted before may carry anything", async () => {
    const b = await open(); click(row(b, 2));
    expect(shown(b.document.querySelector("#msx"))).toMatch(/Ballot 2.*nobody in its quorum had voted before.*any value/); b.close();
  });
  it("later ballots must carry the value of the latest earlier vote in their quorum, and each does", async () => {
    const b = await open(); const $ = q(b);
    for (const n of [14, 27, 29]) {
      click(row(b, n));
      expect(shown($("#msx"))).toMatch(new RegExp(`Ballot ${n} looks back.*must carry`));
      expect($("#msx .bad")).toBeNull(); expect($("#msx .ok")).not.toBeNull();
      expect(all(b, "#msrows tr.sel")).toHaveLength(1);
    }
    expect(shown($("#msx"))).toMatch(/latest is ballot 27/);   // ballot 29's quorum: the latest earlier vote was in ballot 27
    expect(b.errors).toEqual([]); b.close();
  });
});

describe("the-part-time-parliament: rival leaders", () => {
  it("two rival leaders keep starting ballots and refusing each other's, so nothing is decided", async () => {
    const b = await open(); const $ = q(b);
    click($("#drun"));
    await until(() => +$("#dballot").textContent >= 5);
    expect($("#dpassed").textContent).toBe("0");
    expect(/is refused/.test(shown($("#dlog")))).toBe(true);
    click($("#dreset"));
    expect([$("#dballot").textContent, $("#dpassed").textContent]).toEqual(["0", "0"]);
    b.close();
  });
  it("with one appointed leader, ballots succeed", async () => {
    const b = await open(); const $ = q(b);
    click($("#drun")); click($("#dpres"));
    await until(() => +$("#dpassed").textContent >= 1);
    expect(shown($("#dlog"))).toMatch(/succeeded/);
    click($("#dreset")); expect(shown($("#dlog"))).toBe("");
    expect(b.errors).toEqual([]); b.close();
  });
});

describe("the-part-time-parliament: a new leader fills the gap", () => {
  const cls = (b, i) => all(b, "#parsvg .row rect")[i].getAttribute("class");
  it("learns of a decided slot 126 and an unvoted slot 125, fills the gap, then governs", async () => {
    const b = await open(); const $ = q(b);
    expect(all(b, "#parsvg .row")).toHaveLength(9);
    expect([cls(b, 2), cls(b, 3)]).toEqual(["r has", "r future"]);
    click($("#par1")); await until(() => cls(b, 3) === "r gap" && !$("#par2").disabled);
    expect(cls(b, 4)).toBe("r has");                               // 126 is already decided
    click($("#par2")); await until(() => cls(b, 3) === "r fill" && !$("#par3").disabled);
    click($("#par3")); await until(() => cls(b, 5) === "r has" && cls(b, 6) === "r has");     // slots 127 and 128
    expect(cls(b, 7)).toBe("r future");
    expect($("#parr").hidden).toBe(false);
    b.close();
  });
  it("starting over restores the starting log", async () => {
    const b = await open(); const $ = q(b);
    click($("#par1")); await until(() => cls(b, 3) === "r gap" && !$("#par2").disabled);
    click($("#par2")); await until(() => cls(b, 3) === "r fill" && !$("#par3").disabled);
    click($("#par3")); await until(() => !$("#parr").hidden);
    click($("#parr"));
    expect(all(b, "#parsvg .row rect").map(r => r.getAttribute("class")).slice(3)).toEqual(Array(6).fill("r future"));
    expect(b.errors).toEqual([]); b.close();
  });
});

describe("the-part-time-parliament: folding the log", () => {
  it("folds and unfolds the thirty entries", async () => {
    const b = await open(); const $ = q(b);
    expect(all(b, "#fold .e")).toHaveLength(30);
    click($("#foldb")); await until(() => all(b, "#fold .e.gone").length === 30);
    expect($("#fold").classList.contains("folded")).toBe(true); expect(shown($("#foldb"))).toBe("Unfold it again");
    click($("#foldb")); await until(() => all(b, "#fold .e.gone").length === 0);
    expect($("#fold").classList.contains("folded")).toBe(false);
    b.close();
  });
});
