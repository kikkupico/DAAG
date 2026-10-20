/* A Round of Your Own: a playground for every idea in the eighteen books.
   The reader sets the world (how long messengers take, what the road may do, what each place carries),
   the constraints (how many places, who may fall silent or lie) and the goals. The engine below says what
   that world allows, which walls stand in the way, which ideas are at work and where to read more;
   the round in the middle acts the world out, places on the rim and messengers crossing between them.
   The engine has no DOM, so it can be checked from the command line with node. */
"use strict";
(function (root) {

/* ================================================================ data */
const V = (i, m) => ({ i, m: m == null ? i : m });

const BK = {
  owc:  { slug: "ordering-without-clocks",        t: "Ordering Without Clocks",       s: "The ring road",              p: "Lamport 1978 · Fidge 1988 · Mattern 1988" },
  mc:   { slug: "many-copies-acting-as-one",      t: "Many Copies, Acting as One",    s: "The ring road",              p: "Herlihy & Wing 1990" },
  ts:   { slug: "taking-stock-without-stopping",  t: "Taking Stock Without Stopping", s: "The ring road",              p: "Chandy & Lamport 1985" },
  flp:  { slug: "the-limits-of-agreement",        t: "The Limits of Agreement",       s: "The foot of Mount Phyle",    p: "Fischer, Lynch & Paterson 1985" },
  dls:  { slug: "agreeing-when-messages-run-late",t: "Agreeing When Messages Run Late",s: "The foot of Mount Phyle",   p: "Dwork, Lynch & Stockmeyer 1988" },
  bo:   { slug: "agreeing-by-chance",             t: "Agreeing by Chance",            s: "The foot of Mount Phyle",    p: "Ben-Or 1983" },
  ct:   { slug: "telling-the-dead-from-the-slow", t: "Telling the Dead from the Slow",s: "The foot of Mount Phyle",    p: "Chandra & Toueg 1996" },
  cap:  { slug: "answering-while-cut-off",        t: "Answering While Cut Off",       s: "The foot of Mount Phyle",    p: "Brewer 2000 · Gilbert & Lynch 2002" },
  bgp:  { slug: "agreeing-among-liars",           t: "Agreeing Among Liars",          s: "The crown of Mount Phyle",   p: "Lamport, Shostak & Pease 1982" },
  ptp:  { slug: "the-part-time-parliament",       t: "The Part-Time Parliament",      s: "The Chamber, on Paxos",      p: "Lamport 1998 · 2001" },
  vr:   { slug: "one-leader-at-a-time",           t: "One Leader at a Time",          s: "The Tholos of Schedia",      p: "Oki & Liskov 1988" },
  kol:  { slug: "keeping-order-among-liars",      t: "Keeping Order Among Liars",     s: "The crown of Mount Phyle",   p: "Castro & Liskov 1999" },
  hs:   { slug: "changing-leaders-among-liars",   t: "Changing Leaders Among Liars",  s: "The crown of Mount Phyle",   p: "Yin, Malkhi, Reiter, Gueta & Abraham 2019" },
  gos:  { slug: "spreading-by-word-of-mouth",     t: "Spreading by Word of Mouth",    s: "The scholars' coast",        p: "Demers et al. 1987" },
  pbs:  { slug: "probably-up-to-date",            t: "Probably Up to Date",           s: "The scholars' coast",        p: "Bailis et al. 2012" },
  crdt: { slug: "changes-that-never-clash",       t: "Changes That Never Clash",      s: "The far terraces",           p: "Shapiro, Preguiça, Baquero & Zawirski 2011" },
  hat:  { slug: "what-you-can-promise-alone",     t: "What You Can Promise Alone",    s: "The reading rooms",          p: "Bailis et al. 2014" },
  calm: { slug: "knowing-when-to-wait",           t: "Knowing When to Wait",          s: "The hall of two doors",      p: "Hellerstein 2010 · Ameloot, Neven & Van den Bussche 2011" }
};

/* the choices, with their words in both registers */
const OPT = {
  timing: {
    name: V("How long a messenger may take", "Timing"),
    async: V("Any time at all", "Asynchronous"),
    wind:  V("Any time, until a wind drops", "Partially synchronous"),
    glass: V("Within one sandglass", "Synchronous rounds")
  },
  road: {
    name: V("What the road may do", "Channels"),
    arrive: V("Every messenger arrives", "Reliable"),
    lost:   V("Some are lost; resent ones arrive", "Fair-loss"),
    cut:    V("A place can be cut off", "Partitions")
  },
  come: {
    name: V("Members who come and go", "Crash-recovery"),
    none: V("Never", "No recovery"),
    ink:  V("And keep their word in ink", "With stable storage"),
    wax:  V("And keep it in wax, which forgets", "With volatile state")
  },
  slate: {
    name: V("A slate of suspects", "Failure detector"),
    none:  V("None", "None"),
    end:   V("Spares one living man in the end", "◇S"),
    never: V("Never chalks one living man", "S")
  },
  merge: { later: V("Keep the later edition", "Last writer wins"), merge: V("Merge the piles", "Merge by join") },
  question: { grows: V("Only grows (has any copy been made?)", "Monotone"), absence: V("Rests on an absence (are these all?)", "Non-monotone") }
};
const TOOLS = {
  coin:   V("A coin", "Local randomness"),
  seal:   V("A seal ring", "Signatures"),
  podium: V("A podium, one holder at a time", "A leader"),
  bundle: V("Votes tied into bundles", "Vote aggregation")
};
const GOALS = [
  ["order",    V("Agree on what came first", "Causal order")],
  ["asone",    V("Act as one copy", "Linearizability")],
  ["stock",    V("Take stock without stopping", "Consistent snapshot")],
  ["agree",    V("All decide one answer", "Consensus")],
  ["log",      V("Keep one log of commands", "State machine replication")],
  ["answer",   V("Answer at once, even cut off", "Availability")],
  ["converge", V("Copies agree in the end", "Eventual convergence")],
  ["fresh",    V("Read the newest, waiting for few", "Quorum reads")],
  ["visits",   V("Whole visits while cut off", "Transactions under partition")],
  ["query",    V("Answer a question as news arrives", "Coordination-free queries")]
];
const GOALNAME = Object.fromEntries(GOALS);

/* each book's world: what it assumes and what it asks. "any" leaves a choice open */
const WORLD = {
  owc:  { n: 3, timing: "async", road: "arrive", faults: "none", goals: ["order"] },
  mc:   { n: 3, timing: "async", road: "arrive", faults: "none", goals: ["asone"] },
  ts:   { n: 3, timing: "async", road: "arrive", faults: "none", fifo: true, goals: ["stock"] },
  flp:  { n: 4, timing: "async", road: "arrive", faults: "crash", goals: ["agree"] },
  dls:  { n: 4, timing: "wind",  road: "arrive", faults: ["crash", "liar"], seal: "any", goals: ["agree"] },
  bo:   { n: 4, timing: "async", road: "arrive", faults: "crash", coin: true, goals: ["agree"] },
  ct:   { n: 4, timing: "async", road: "arrive", faults: "crash", slate: ["end", "never"], goals: ["agree"] },
  cap:  { n: 4, timing: "any",   road: ["cut", "lost"], faults: "none", goals: ["asone", "answer"] },
  bgp:  { n: 4, timing: "glass", road: "arrive", faults: "liar", seal: "any", goals: ["agree"] },
  ptp:  { n: 5, timing: "async", road: "lost", faults: "crash", dead: 2, come: "ink", goals: ["log"] },
  vr:   { n: 5, timing: "async", road: "lost", faults: "crash", dead: 2, come: "wax", podium: true, goals: ["log"] },
  kol:  { n: 4, timing: "wind",  road: "lost", faults: "liar", seal: true, podium: true, goals: ["log"] },
  hs:   { n: 4, timing: "wind",  road: "lost", faults: "liar", seal: true, podium: true, bundle: true, goals: ["log"] },
  gos:  { n: 5, timing: "async", road: "lost", faults: "none", coin: true, merge: "later", goals: ["converge", "answer"] },
  pbs:  { n: 3, timing: "async", road: "arrive", faults: "none", goals: ["fresh"], R: 1, W: 1 },
  crdt: { n: 3, timing: "async", road: "cut", faults: "none", merge: "merge", goals: ["converge", "answer"] },
  hat:  { n: 3, timing: "async", road: "cut", faults: "none", goals: ["visits", "answer"] },
  calm: { n: 4, timing: "async", road: "cut", faults: "none", roster: false, goals: ["query"] }
};

/* the four walls, in the words of One Change Apart */
const WALLS = {
  flp: { k: V("Wall one", "Wall one"), t: V("No plan is sure to finish", "FLP"), a: "w1",
    b: V("When birds may take any time and one man may fall silent, no fixed plan can be sure that anyone ever commits. The night is never decided wrongly; it may simply never be decided, though no one dies.",
         "Deterministic consensus in an asynchronous system with one crash cannot guarantee termination, though safety is never lost."),
    see: V("From one tent, a dead man looks like a slow bird.", "At one process, a crashed process looks like a slow one.") },
  quorum: { k: V("Wall two", "Wall two"), t: V("Half cannot speak for all", "Quorum bounds"), a: "w2",
    b: V("If half the camp may fall silent, a wind can hold every bird between the halves until each half commits alone, so more than half must live. If men may lie, three cannot bear one liar: four can bear one, seven two. Seals lift that count only while silence can be timed.",
         "With crash faults, partial synchrony, randomization and eventually accurate detectors all need n ≥ 2t + 1. Byzantine agreement needs n ≥ 3m + 1 with oral messages; signatures remove the bound only in synchronous rounds; under partial synchrony n ≥ 3t + 1, signed or not."),
    see: V("From one post, a lying chief looks like a lying peer.", "At one process, a faulty commander looks like a faulty lieutenant.") },
  cap: { k: V("Wall three", "Wall three"), t: V("Answer, or be right", "CAP"), a: "w3",
    b: V("A place cut off from the rest cannot both answer every question and answer as one. With a known flight, waiting a glass keeps the copies as one on every night no bird is lost; when birds may also be late without limit, not even then.",
         "Under message loss, a register cannot be both linearizable and available; with bounded delays, consistency survives in loss-free runs; asynchronously, not even then."),
    see: V("From the cut-off place, a plan that moved looks like a plan that never moved.", "At the partitioned replica, a completed write looks like no write at all.") },
  calm: { k: V("Wall four", "Wall four"), t: V("An absence needs everyone", "CALM"), a: "w4",
    b: V("A question that only grows needs no waiting and no roster; a question that rests on none, every or only must hear from everyone first.",
         "Exactly the non-monotone computations, such as negation, aggregation, global invariants and garbage collection, need coordination; monotone ones run coordination-free, and so stay available under partition."),
    see: V("From one library, every name heard looks like one still on the road.", "At one node, all inputs seen looks like one still in flight.") }
};

const THREADS = {
  t1:  V("Number it", "Logical timestamps"),
  t2:  V("One moment inside each span", "Linearizability"),
  t3:  V("Wait for most, never all", "Intersecting quorums"),
  t4:  V("Carry the latest forward", "Value carry-over"),
  t5:  V("Safe in any wind, done once it drops", "Safety always, liveness eventually"),
  t6:  V("Echo before you trust", "Byzantine cross-checking"),
  t7:  V("Leave it to chance", "Randomization"),
  t8:  V("Only grow", "Monotonicity"),
  t9:  V("Write the absence down", "Make absence explicit"),
  t10: V("Hold back, never hold up", "Buffer, don't block")
};
const COSTS = {
  wait: { t: V("Waiting", "Coordination"), b: V("for most of the others", "quorum round trips") },
  men:  { t: V("More men", "Replicas"), b: V("than may fail", "n above the fault bound") },
  odds: { t: V("A little certainty", "Certainty"), b: V("odds instead of a promise", "probabilistic guarantees") },
  keep: { t: V("Bookkeeping", "Metadata"), b: V("columns, notices, seals, ink", "clocks, tombstones, logs, storage") }
};

const STATUS = {
  ok:   V("Within reach", "Achievable"),
  odds: V("Surely, by chance", "With probability 1"),
  likely: V("Probably", "Probabilistic bound"),
  safe: V("Always right, done in calm", "Safe; live after stabilization"),
  wait: V("Waits", "Blocks"),
  warn: V("Beyond the books", "Outside the papers' model"),
  wall: V("A wall", "Impossible")
};

/* ================================================================ the engine */
const clampInt = (v, a, b) => Math.max(a, Math.min(b, Math.round(+v || 0)));
const DEFAULT = () => ({
  n: 4, timing: "async", road: "arrive", cut: 1, fifo: true,
  coin: false, slate: "none", seal: false, podium: false, bundle: false,
  come: "none", roster: true, nodes: ["ok", "dead", "ok", "ok"],
  goals: ["agree"], merge: "later", R: 1, W: 1, sticky: false, question: "grows"
});
function norm(S) {
  S.n = clampInt(S.n, 2, 9);
  S.nodes = Array.from({ length: S.n }, (_, i) => (S.nodes && S.nodes[i]) || "ok");
  if (!S.nodes.some(x => x !== "dead")) S.nodes[0] = "ok";
  S.cut = clampInt(S.cut, 1, S.n - 1);
  S.R = clampInt(S.R, 1, S.n); S.W = clampInt(S.W, 1, S.n);
  if (S.bundle) S.seal = true;
  S.goals = GOALS.map(g => g[0]).filter(g => S.goals.includes(g));
  return S;
}
function counts(S) {
  const t = S.nodes.filter(x => x === "dead").length, m = S.nodes.filter(x => x === "liar").length;
  return { n: S.n, t, m, F: t + m, live: S.n - t, honest: S.n - t - m, maj: Math.floor(S.n / 2) + 1 };
}
const R = (slug, a, label) => ({ slug, a, label });
const pl = (k, one, many) => k === 1 ? one : many;
const word = k => ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen"][k] || String(k);
const Word = k => { const w = word(k); return w[0].toUpperCase() + w.slice(1); };

/* the two sides of a lasting cut: the last k places are cut off */
function sides(S) {
  const k = S.road === "cut" ? S.cut : 0, off = [], on = [];
  S.nodes.forEach((x, i) => (i >= S.n - k ? off : on).push(i));
  return { off, on, k };
}
const liveIn = (S, arr) => arr.filter(i => S.nodes[i] !== "dead").length;

/* deciding one answer: shared by "agree" and, with its own words, by "log" */
function consensus(S) {
  const c = counts(S), { n, t, m, F } = c;
  const r = { books: [], threads: [], costs: [], notes: [] };
  if (c.live === 0) return Object.assign(r, { st: "warn", h: V("Nobody is left", "No live process"), b: V("Every place has fallen silent.", "All processes have crashed.") });
  if (m > 0) {
    r.threads.push("t6", "t3"); r.costs.push("men", "wait");
    if (S.timing === "glass") {
      r.books.push("bgp");
      if (S.seal) return Object.assign(r, { st: "ok", q: null, threads: r.threads.concat("t9"), costs: r.costs.concat("keep"),
        h: V(`Seals: any number of liars`, `SM(${F}): any number of traitors`),
        b: V(`With seal rings no one can forge and rounds kept by a sandglass, the number of liars stops mattering: the honest ${word(c.honest)} agree whoever lies, relaying sealed orders and counting silence as hold.`,
             `With unforgeable signatures in synchronous rounds, SM(${F}) reaches Byzantine agreement for any number of traitors; a missing message is detected by the end of a round and replaced by a default.`) });
      if (n >= 3 * F + 1) return Object.assign(r, { st: "ok", threads: r.threads.concat("t9"),
        h: V(`${Word(n)} can bear ${word(F)} ${pl(F, "liar", "liars")}`, `n = ${n} ≥ 3m + 1 = ${3 * F + 1}`),
        b: V(`Relay every order and take the greater count, for ${word(F + 1)} ${pl(F + 1, "round", "rounds")} of rats; silence counts as hold.${t ? " A man who falls silent counts here as one more liar." : ""} Nobody need ever learn who lied.`,
             `OM(${F}) reaches agreement in ${F + 1} rounds of relaying and majority vote${t ? "; a crashed process counts as a traitor that sends nothing" : ""}. No traitor need be identified.`) });
      return Object.assign(r, { st: "wall", wall: "quorum", need: { n: 3 * F + 1 },
        h: V(`${Word(n)} cannot bear ${word(F)} ${pl(F, "liar", "liars")} by word alone`, `n = ${n} < 3m + 1 = ${3 * F + 1}`),
        b: V(`An honest guard cannot tell a lying chief from a lying peer, so it takes ${word(3 * F + 1)} men to bear ${word(F)}. Since rounds are timed here, seal rings would lift the count.`,
             `With oral messages Byzantine agreement needs n ≥ 3m + 1 = ${3 * F + 1}. In synchronous rounds, signatures remove the bound.`) });
    }
    if (S.timing === "wind") {
      r.books.push("dls"); r.threads.push("t5", "t4");
      if (n >= 3 * F + 1) return Object.assign(r, { st: "ok",
        h: V(`${Word(n)} can bear ${word(F)} ${pl(F, "liar", "liars")} in the wind`, `n = ${n} ≥ 3t + 1 = ${3 * F + 1}`),
        b: V(`Four to bear one liar, sealed or not: turns of glasses pass from tent to tent, never two answers in any wind, and every honest man commits soon after the wind drops.${t ? " A man who falls silent is counted with the liars." : ""}`,
             `Under partial synchrony Byzantine consensus needs n ≥ 3t + 1, with or without authentication; it is safe under any delay and decides within a bounded number of rounds after GST.`) });
      return Object.assign(r, { st: "wall", wall: "quorum", need: { n: 3 * F + 1 },
        h: V(`In the wind, ${word(n)} cannot bear ${word(F)} ${pl(F, "liar", "liars")}`, `n = ${n} < 3t + 1 = ${3 * F + 1}`),
        b: V(`While the wind blows, silence cannot be timed, so seals do not help: it takes ${word(3 * F + 1)} men to bear ${word(F)}, sealed or not.`,
             `Under partial synchrony n ≥ 3t + 1 = ${3 * F + 1} is necessary, signed or not.`) });
    }
    /* any time at all */
    if (S.coin) {
      r.books.push("bo"); r.threads.push("t7"); r.costs.push("odds");
      if (n > 5 * F) return Object.assign(r, { st: "odds",
        h: V(`Six men against one liar: ${word(n)} against ${word(F)}`, `n = ${n} > 5t = ${5 * F}`),
        b: V(`The coin's second method bears liars as well as the dead, if there are more than five men to each liar. Every honest man commits, with probability one.`,
             `Ben-Or's Byzantine protocol needs n > 5t and terminates with probability 1.`) });
      return Object.assign(r, { st: "warn", need: { n: 5 * F + 1 },
        h: V(`Too few for the coin against liars`, `n = ${n} ≤ 5t = ${5 * F}`),
        b: V(`The coin's method for liars asks for more than five men to each liar: ${word(5 * F + 1)} for ${word(F)}.`,
             `Ben-Or's Byzantine protocol needs n > 5t = ${5 * F}; this is that protocol's requirement, not a lower bound.`) });
    }
    r.books.push("flp");
    return Object.assign(r, { st: "wall", wall: "flp",
      h: V(`Liars, and no limit on the birds`, `Asynchronous, Byzantine`),
      b: V(`A liar can do anything a dead man can, and a dead man already looks exactly like a slow bird. No fixed plan is sure to finish.${S.slate !== "none" ? " Slates chalk the dead; the books use them against silence, never against lies." : ""}`,
           `Byzantine faults include crashes, so FLP applies: no deterministic protocol guarantees termination.${S.slate !== "none" ? " The failure detectors of Chandra and Toueg are defined for crash faults." : ""}`) });
  }
  if (t > 0) {
    r.threads.push("t3"); r.costs.push("men", "wait");
    if (S.timing === "glass") {
      r.books.push("bgp"); r.threads.push("t9");
      return Object.assign(r, { st: "ok",
        h: V(`Silence is news in timed rounds`, `Synchronous rounds detect crashes`),
        b: V(`When every bird lands within a sandglass, a missing bird is noticed by the end of the round and counts as a default, so the living can agree. The crown's rounds work this way.`,
             `In synchronous rounds a missing message is detected by the end of the round and replaced by a default value, the device both OM(m) and SM(m) rely on.`) });
    }
    if (S.timing === "wind") {
      r.books.push("dls"); r.threads.push("t5", "t4");
      if (n >= 2 * t + 1) return Object.assign(r, { st: "ok",
        h: V(`Call on ${word(n - t)}, commit on ${word(t + 1)}`, `n − t = ${n - t} to propose, t + 1 = ${t + 1} to decide`),
        b: V(`Turns of glasses pass from tent to tent: the turn's owner calls an answer ${word(n - t)} can accept and commits on ${word(t + 1)} ${pl(t + 1, "pledge", "pledges")}, which lock the other answer out. Safe in any wind; done soon after it drops.`,
             `A rotating coordinator proposes a value acceptable to n − t processes and decides on t + 1 acknowledgments; locks keep agreement under any delay, and every correct process decides within a bounded number of rounds after GST.`) });
      return Object.assign(r, { st: "wall", wall: "quorum", need: { n: 2 * t + 1 },
        h: V(`Half cannot speak for all`, `n = ${n} < 2t + 1 = ${2 * t + 1}`),
        b: V(`With ${word(t)} of ${word(n)} able to fall silent, the wind can hold every bird between two halves until each commits alone. More than half must live.`,
             `Under partial synchrony consensus with t crashes needs n ≥ 2t + 1.`) });
    }
    /* any time at all */
    if (S.slate === "never") {
      r.books.push("ct"); r.threads.push("t5");
      return Object.assign(r, { st: "ok",
        h: V(`One living man is never chalked`, `With S, up to n − 1 crashes`),
        b: V(`If one living man is never chalked on any slate, the camp agrees however many die: here up to ${word(n - 1)}.`,
             `With a strong detector S, consensus tolerates any number of crashes, here up to n − 1 = ${n - 1}.`) });
    }
    if (S.slate === "end") {
      r.books.push("ct"); r.threads.push("t5", "t4");
      if (n >= 2 * t + 1) return Object.assign(r, { st: "ok",
        h: V(`In the end, one man spared`, `◇S with a correct majority`),
        b: V(`Owners take turns as on windy nights, each wait ended by the slate's suspicions; more than half must live, here ${word(n - t)} of ${word(n)}. Bad slates can stall the camp, never split it.`,
             `With ◇S a rotating coordinator solves consensus when a majority is correct, and stays safe even if the detector misbehaves for ever.`) });
      return Object.assign(r, { st: "wall", wall: "quorum", need: { n: 2 * t + 1 },
        h: V(`Half cannot speak for all`, `n = ${n} < 2t + 1 = ${2 * t + 1}`),
        b: V(`A slate that spares one man only in the end needs more than half alive: ${word(2 * t + 1)} to bear ${word(t)} deaths.`, `◇S needs a correct majority: n ≥ 2t + 1 = ${2 * t + 1}.`) });
    }
    if (S.coin) {
      r.books.push("bo"); r.threads.push("t7"); r.costs.push("odds");
      if (n >= 2 * t + 1) return Object.assign(r, { st: "odds",
        h: V(`Wait for ${word(n - t)} birds, then toss`, `wait for n − t = ${n - t}; decide on t + 1 = ${t + 1}`),
        b: V(`In numbered rounds each man reports what he favours and waits for ${word(n - t)} reports; on ${word(t + 1)} sure birds he settles, on one he follows it, on none he tosses. Two sure answers never meet in one round, and sooner or later the coins land alike.`,
             `Each round a process waits for n − t reports, proposes a strict-majority value, decides on t + 1 proposals, adopts on one, and flips a local coin on none. Agreement on every run; termination with probability 1. The adversary schedules every message but cannot foresee a coin.`) });
      return Object.assign(r, { st: "wall", wall: "quorum", need: { n: 2 * t + 1 },
        h: V(`Half cannot speak for all`, `n = ${n} < 2t + 1 = ${2 * t + 1}`),
        b: V(`Coins or no coins, the birds can be held between two halves until each settles alone: ${word(2 * t + 1)} men are needed to bear ${word(t)} deaths.`, `Randomized consensus with t crashes still needs n ≥ 2t + 1.`) });
    }
    r.books.push("flp"); r.threads.push("t5");
    return Object.assign(r, { st: "wall", wall: "flp",
      h: V(`A dead man looks like a slow bird`, `FLP`),
      b: V(`No plan may wait for all ${word(n)}, and then the birds can always be timed to keep the night open. Never wrong, maybe never done, even on a night when nobody dies.`,
           `In an asynchronous system where one process may crash, no deterministic protocol guarantees termination: some initial configuration is bivalent, and a pending message can always be delayed to keep it so.`) });
  }
  return Object.assign(r, { st: "ok", books: ["flp"],
    h: V(`With no one able to fall silent, wait for all`, `No faults: wait for everyone`),
    b: V(`If nobody may fall silent, every place can wait to hear from every other and take the same rule over the same reports. One place able to fall silent is all the first wall needs.`,
         `With no crashes, every process can wait for all n inputs and apply a deterministic rule. FLP needs only the possibility of one crash.`) });
}

/* keeping one log: the same counts, with the Chamber's, the Tholos's and the crown's words */
function keepLog(S) {
  const c = counts(S), { n, t, m, F } = c;
  const r = { books: [], threads: ["t3", "t4", "t1"], costs: ["wait", "keep"], notes: [] };
  if (c.live === 0) return Object.assign(r, { st: "warn", h: V("Nobody is left", "No live process"), b: V("Every place has fallen silent.", "All processes have crashed.") });
  const calm = S.timing !== "async" || S.coin || S.slate !== "none";
  if (m > 0) {
    r.threads.push("t6", "t9", "t10"); r.costs.push("men");
    r.books.push(S.bundle ? "hs" : "kol");
    if (S.bundle) r.books.push("kol"); else r.books.push("hs");
    if (n < 3 * F + 1) return Object.assign(r, { st: "wall", wall: "quorum", need: { n: 3 * F + 1 },
      h: V(`${Word(n)} posts cannot keep one scroll against ${word(F)} ${pl(F, "liar", "liars")}`, `n = ${n} < 3f + 1 = ${3 * F + 1}`),
      b: V(`An entry stands on groups of ${word(n - F)}; two such groups of ${word(n)} share ${word(Math.max(0, 2 * (n - F) - n))}, which may all be liars, so one number could hold two entries. It takes ${word(3 * F + 1)} posts.`,
           `Quorums of n − f = ${n - F} intersect in ${Math.max(0, 2 * (n - F) - n)} replicas, which may all be faulty; PBFT needs n ≥ 3f + 1 = ${3 * F + 1}.`) });
    const q = 2 * F + 1;
    const out = { st: calm ? "ok" : "safe", wall: calm ? null : "flp",
      h: V(`Two echoes of ${word(q)} seals`, `quorums of 2f + 1 = ${q} of n = ${n}`),
      b: V(`An entry stands only after two echoes, each gathering ${word(q)} seals of ${word(n)}; any two groups of ${word(q)} share an honest man, so no number can hold two entries. A registrar who stalls loses the job to the next post, who must keep every entry readied before.${calm ? "" : " With no limit on the birds, the scroll stays right but may stall: it goes on once the wind drops."}`,
           `Pre-prepare, prepare and commit each need 2f + 1 matching signed messages, and any two such quorums share a correct replica; a view change carries prepared certificates.${calm ? "" : " Asynchronously PBFT is always safe, but live only once delays stop growing."}`) };
    if (!S.seal) r.notes.push(V("The crown's scroll seals every echo; carry seal rings to keep it as the books do.", "PBFT and HotStuff authenticate every vote; turn on signatures to match the papers."));
    if (!S.podium) r.notes.push(V("One registrar at a time numbers the entries; carry a podium to keep it as the books do.", "Both papers number requests through one primary; turn on a leader to match them."));
    if (S.bundle) out.b = V(`Each bandit sends a sealed vote to the registrar, who ties ${word(q)} into one bundle; a third stage of bundles lets a new registrar learn any lock from the first ${word(n - F)} replies and go at the rats' pace. A change of hands costs no more than an entry, so the job can pass at every entry.`,
        `Replicas vote only to the leader, which aggregates 2f + 1 = ${q} votes into a quorum certificate, so each phase is linear; a third phase makes the view change linear and optimistically responsive. Chained HotStuff rotates the leader every block.`);
    return Object.assign(r, out);
  }
  if (t > 0 || S.come !== "none") {
    r.threads.push("t5"); r.costs.push("men");
    r.books.push(S.podium ? "vr" : "ptp"); r.books.push(S.podium ? "ptp" : "vr");
    if (n < 2 * t + 1) return Object.assign(r, { st: "wall", wall: "quorum", need: { n: 2 * t + 1 },
      h: V(`Half cannot speak for all`, `n = ${n} < 2f + 1 = ${2 * t + 1}`),
      b: V(`Any two majorities share a member, but with ${word(t)} of ${word(n)} gone no majority is left to vote. More than half must stay.`, `Majority quorums need n ≥ 2f + 1 = ${2 * t + 1}.`) });
    const q = c.maj, out = { st: calm ? "ok" : "safe", wall: calm ? null : "flp" };
    if (S.podium) {
      out.h = V(`The holder and ${word(q - 1)} of the benches`, `primary + ${q - 1} backups`);
      out.b = V(`Only the legislator at the podium writes the law, and a line passes once the holder and ${word(q - 1)} of the ${word(n - 1)} benches hold it. When the podium falls silent, whoever answers with the latest board-and-line takes it and sends out the whole law; a holder left on the porch can write, never pass.`,
                `A primary orders operations and commits once a majority (${q} of ${n}) holds them; on a view change the member of a responding majority with the highest viewstamp becomes primary and sends its whole state; a deposed primary cannot commit.`);
    } else {
      out.h = V(`Any two majorities of ${word(n)} share a member`, `majority quorums of ${q} of ${n}`);
      out.b = V(`Each numbered ballot first asks ${word(q)} legislators for their latest votes and a promise to ignore lower ballots, then proposes the decree of the latest vote among them. Two presidents only slow things down.`,
                `Phase 1 (prepare, promise) learns the highest-numbered accepted value from a majority; phase 2 (accept) proposes it. Safe under any delay, loss, duplication, crash or recovery; live when one leader and a majority stay up long enough.`);
    }
    if (!calm) out.b = V(out.b.i + " With no limit on the birds, the law is never wrong but may wait: it moves once one president keeps the job long enough.",
                        out.b.m + " FLP still applies to termination: progress needs a stable leader after stabilization.");
    if (S.come === "wax") { out.st = out.st === "ok" ? "ok" : out.st; r.notes.push(V(`Wax is fast but forgets: if ${word(q)} or more go home at once, the council can stop for good, never wrong.`, `State is volatile: a simultaneous crash of a majority (${q}) halts the group rather than losing a commit.`)); }
    if (S.come === "ink") r.notes.push(V("Every promise goes into a scroll in indelible ink, so a legislator who comes back keeps every word.", "Promises and votes are on stable storage, so recovery is safe."));
    return Object.assign(r, out);
  }
  return Object.assign(r, { st: "ok", books: ["ptp", "vr"], threads: ["t1"],
    h: V(`One keeper, everyone copies`, `No faults: a single sequencer`),
    b: V(`If nobody may fall silent, one place can number the commands and the rest copy them in order. Let a place fall silent to see why the Chamber needs ballots.`,
         `With no failures a single sequencer suffices; consensus is needed once a process may crash.`) });
}

function judge(S0) {
  const S = norm(JSON.parse(JSON.stringify(S0))), c = counts(S), G = new Set(S.goals), sd = sides(S);
  const out = { S, c, goals: [], walls: [], threads: new Set(), costs: new Set(), ideas: [], books: [] };
  const add = (g, v) => { v.g = g; out.goals.push(v); (v.threads || []).forEach(x => out.threads.add(x)); (v.costs || []).forEach(x => out.costs.add(x)); if (v.wall) wall(v.wall, g); };
  const wall = (w, g) => { let x = out.walls.find(y => y.id === w); if (!x) out.walls.push(x = { id: w, goals: [] }); if (!x.goals.includes(g)) x.goals.push(g); };
  const cutBoth = S.road === "cut" && sd.off.length && sd.on.length;
  const answerAnd = G.has("answer");
  const lossy = S.road !== "arrive";

  /* ---- order ---- */
  if (G.has("order")) add("order", { st: c.m ? "warn" : "ok", books: ["owc"], threads: ["t1"], costs: ["keep"],
    h: V(`A tally at each place, a column of ${word(S.n)}`, `Lamport clocks; vector clocks of length ${S.n}`),
    b: c.m ? V(`Tallies order what honest places tell each other. A liar can write any number on a slip, and the ring road's houses never lie.`, `Logical clocks assume correct processes; a Byzantine process can stamp any value.`)
           : V(`Each place keeps a tally that rises with every entry and jumps past any number a slip brings, so a cause always carries the smaller number; ties go to the lower place. A column of ${word(S.n)} tallies tells cause from coincidence.`,
               `Lamport clocks make a → b imply C(a) < C(b); ties broken by process id give one total order. Vector clocks of length ${S.n} capture causality exactly.`) });

  /* ---- answer at once ---- */
  if (G.has("answer")) {
    const v = { books: ["cap"], threads: [], costs: [], st: "ok",
      h: V(`Every place answers from its own copy`, `Every request at a live replica gets a response`),
      b: V(`A place can always answer from what it holds. What it cannot also promise is said beside the other goals.`, `Availability alone is trivial; the question is which consistency it can be combined with.`) };
    add("answer", v);
  }

  /* ---- act as one copy ---- */
  if (G.has("asone")) {
    const v = { books: ["mc"], threads: ["t2"], costs: [] };
    if (answerAnd && (lossy || S.timing !== "glass")) {
      Object.assign(v, { st: "wall", wall: "cap", books: ["cap", "mc"], costs: [],
        h: V(`Cannot both answer at once and answer as one`, `Linearizable and available: impossible here`),
        b: S.road === "arrive"
          ? V(`With birds that may be late without limit, a place that must answer at once cannot tell a night when the plan moved from one when it did not, even if no bird is ever lost.`, `In an asynchronous network a register cannot be both linearizable and available, even in loss-free runs.`)
          : V(`A place cut off by lost birds that must answer cannot also answer as one, for it cannot tell a night when the plan was moved from one when it was not.`, `Under message loss, a read/write register cannot be both linearizable and available.`) });
    } else if (answerAnd) {
      Object.assign(v, { st: "ok", books: ["cap", "mc"], costs: ["wait"],
        h: V(`Wait one glass, then answer`, `Bounded delay, no loss: wait out the bound`),
        b: V(`With every bird landing within a glass and none lost, a place waits one glass before it answers, and so answers everyone and answers as one.`, `With known delay bounds and no loss, timeouts give an available, linearizable register.`) });
    } else if (c.F > 0) {
      const lg = keepLog(S);
      Object.assign(v, { st: lg.st, wall: lg.wall, books: ["mc"].concat(lg.books), threads: ["t2", "t3"], costs: ["wait", "men"], need: lg.need,
        h: V(`Copies that may fall silent keep one log`, `Linearizable replication via consensus`),
        b: V(`To seem like one board while some copies may fall silent or lie, the copies must agree on one order of requests: the counts of “Keep one log” apply. ${lg.h.i}.`, `A fault-tolerant linearizable object is a replicated state machine; the bounds for consensus apply (${lg.h.m}).`) });
    } else if (S.road === "cut" || S.road === "lost") {
      Object.assign(v, { st: "wait", books: ["cap", "mc"], costs: ["wait"],
        h: V(`A muster-master; the cut-off place waits`, `A single primary: consistent, not available`),
        b: V(`A muster-master keeps the copies as one and leaves a cut-off man waiting; resending heals the camp within a span.`, `A single primary gives consistency without availability.`) });
    } else Object.assign(v, { st: "ok",
      h: V(`One moment inside each span`, `Linearizability`),
      b: V(`Every request and every serving seems to take effect at one moment inside its span, as if one steward kept one board; then nobody can tell one board from ${word(S.n)} copies. The rule can be checked board by board, and never makes one place wait on another's business.`,
           `Every operation appears to take effect at one instant between invocation and response. Linearizability is local and nonblocking; sequential consistency is not local.`) });
    add("asone", v);
  }

  /* ---- take stock ---- */
  if (G.has("stock")) {
    const v = { books: ["ts"], threads: ["t8", "t9", "t10"], costs: ["keep"] };
    if (!S.fifo) Object.assign(v, { st: "warn", h: V(`The sash needs carts kept in order`, `Chandy–Lamport needs FIFO channels`),
      b: V(`The red sash works because no cart behind it can reach the next house first. If later carts may pass earlier ones, a cart sent after the count could be counted as if before it.`, `The marker algorithm assumes FIFO channels: a message sent after the marker must not arrive before it.`) });
    else if (c.F > 0 || lossy) Object.assign(v, { st: "warn", h: V(`Every sash must arrive`, `Every marker must be delivered`),
      b: V(`The count closes only when every track's sash has come. A place that falls silent, or a sash lost on the road, leaves a count open for ever; the ring road's houses never fall silent.`, `The algorithm assumes reliable channels and no failures; a lost marker or a crashed process leaves the snapshot incomplete.`) });
    else Object.assign(v, { st: "ok", h: V(`A red sash down every track`, `Markers on every channel`),
      b: V(`A place counts its storehouse and sends a messenger in a red sash down each of its ${word(S.n - 1)} tracks before any more carts; a place that meets a sash counts at once if it has not; each logs the carts arriving on a track until that track's sash comes. The total describes a morning nobody lived, yet one the island could have passed through.`,
           `Record local state and send a marker on all ${S.n - 1} outgoing FIFO channels; record each incoming channel until its marker arrives. The result is a consistent cut, enough to decide stable properties.`) });
    add("stock", v);
  }

  /* ---- decide one answer ---- */
  if (G.has("agree")) {
    const v = consensus(S);
    if (answerAnd && cutBoth) Object.assign(v, { st: "wall", wall: "cap",
      h: V(`A cut-off place cannot decide alone`, `Consensus is unavailable under partition`),
      b: V(`Deciding waits for most of the others; a place cut off from them that must answer at once cannot also answer as they do.`, `Consensus needs a quorum; a partitioned minority that must respond cannot stay consistent with the majority.`) });
    else cutNote(S, v, sd, c);
    if (S.road === "lost" && v.st !== "wall") (v.notes = v.notes || []).push(V("The foot's books assume every bird arrives; resending turns a lost bird into a slow one.", "The papers assume reliable channels; retransmission turns fair loss into delay."));
    add("agree", v);
  }

  /* ---- keep one log ---- */
  if (G.has("log")) {
    const v = keepLog(S);
    if (answerAnd && cutBoth) Object.assign(v, { st: "wall", wall: "cap",
      h: V(`A cut-off place cannot pass a line alone`, `Replication is unavailable under partition`),
      b: V(`A line passes only once most hold it; a place cut off from most cannot pass anything, and if it must answer at once it cannot answer as the law stands.`, `Commit needs a quorum; a partitioned minority cannot commit, so it cannot be both available and linearizable.`) });
    else cutNote(S, v, sd, c);
    add("log", v);
  }

  /* ---- copies agree in the end ---- */
  if (G.has("converge")) {
    const v = { books: S.merge === "merge" ? ["crdt", "gos"] : ["gos", "crdt"], threads: ["t8", "t9"], costs: ["odds", "keep"] };
    if (S.merge === "merge") Object.assign(v, { st: "ok", threads: v.threads.concat("t10"),
      h: V(`The larger pile in each column`, `State-based CRDT: merge by join`),
      b: V(`Each place counts in pebbles, one column per place, each column written only by its own scribe. Merging two tables keeps the larger pile in each column, so tables can meet in any order, any number of times, and always agree. No table alone can keep a count from falling below zero.`,
           `Merge is a least upper bound: commutative, associative and idempotent, so replicas converge (strong eventual consistency). Global invariants still need coordination.`) });
    else Object.assign(v, { st: "ok", threads: v.threads.concat("t1", S.coin ? "t7" : "t1"),
      h: V(`Of two editions, the larger tally wins`, `Last writer wins, spread by gossip`),
      b: V(`Places answer from their own shelves and agree only in the end. News passes on until most of those met already know it, which leaves a few unheard; then partners drawn by lot compare whole collections and catch the rest. A withdrawal must travel as a notice, or an old copy brings the work back.`,
           `Rumor mongering leaves a residue of about e^−m sites for m messages per site; anti-entropy with random partners reaches every site, and pull beats push in the tail. Deletions spread as death certificates.`) });
    if (S.road === "cut") (v.notes = v.notes || []).push(V("Across a lasting cut the two sides drift apart; they agree once the road opens again. Heal the cut to watch them meet.", "Convergence assumes the partition eventually heals."));
    if (c.m) { v.st = "warn"; (v.notes = v.notes || []).push(V("The coast's libraries and the terraces' scribes never lie; a liar's table could carry any pile.", "CRDTs and epidemic replication assume non-Byzantine replicas.")); }
    add("converge", v);
  }

  /* ---- read the newest ---- */
  if (G.has("fresh")) {
    const strict = S.R + S.W > S.n, v = { books: ["pbs"], threads: ["t3"], costs: strict ? ["wait"] : ["odds"] };
    const live = c.live;
    Object.assign(v, { st: strict ? "ok" : "likely",
      h: strict ? V(`${Word(S.W)} hold it, ${word(S.R)} are asked: the groups must share a place`, `R + W = ${S.R + S.W} > N = ${S.n}`)
                : V(`${Word(S.W)} hold it, ${word(S.R)} are asked: the groups can miss`, `R + W = ${S.R + S.W} ≤ N = ${S.n}`),
      b: strict ? V(`The writer announces an edition once ${word(S.W)} of the ${word(S.n)} hold it, and a reader takes the newest of the first ${word(S.R)} replies. Since the two counts add to more than ${word(S.n)}, the groups must share a place.`,
                    `Write quorum W = ${S.W}, read quorum R = ${S.R} over N = ${S.n}: R + W > N guarantees intersection.`)
                : V(`The writer announces once ${word(S.W)} hold an edition and a reader takes the newest of ${word(S.R)} replies; the groups need not meet. The odds of an old copy fall with every edition the reader will accept and every moment after the announcement. Many choose one and one, for speed.`,
                    `Partial quorums (R + W ≤ N) may read stale data. PBS: within k versions staleness falls as p^k; t-visibility comes from the WARS latency model by Monte Carlo.`) });
    if (Math.max(S.R, S.W) > live) { v.st = "wait"; v.h = V(`Only ${word(live)} can answer`, `only ${live} replicas are up`); v.notes = [V(`Waiting for ${word(Math.max(S.R, S.W))} replies when only ${word(live)} places can answer, the writer or reader waits for ever.`, `A quorum of ${Math.max(S.R, S.W)} cannot be gathered from ${live} live replicas.`)]; }
    if (c.m) v.st = "warn";
    add("fresh", v);
  }

  /* ---- whole visits ---- */
  if (G.has("visits")) {
    const alone = S.road === "cut" || answerAnd;
    const v = { books: ["hat"], threads: ["t10", "t8"], costs: [] };
    if (alone) Object.assign(v, { st: "ok", wall: "cap", partial: 1,
      h: V(`Some promises alone, never all`, `Some HAT guarantees; never serializability`),
      b: V(`A librarian cut off from every other library can still hide unfinished corrections, show a visit's corrections all or none, give the same answer twice, never go backwards, and hold a reply until its letter arrives.${S.sticky ? " Since each reader keeps to one library, readers also see their own corrections." : " If each reader kept to one library, readers would also see their own corrections."} No librarian alone can stop two readers taking the last copy, or promise the newest edition.`,
           `Read committed, monotonic atomic view, item and predicate cut isolation, monotonic reads and writes-follow-reads are highly available.${S.sticky ? " With sticky clients, read-your-writes, PRAM and causal consistency too." : " Read-your-writes, PRAM and causal need sticky clients."} Preventing lost update or write skew, and so snapshot isolation and serializability, is unavailable, as is any recency bound.`) });
    else Object.assign(v, { st: "ok", books: ["hat", "ptp"], costs: ["wait"],
      h: V(`With couriers running, a librarian can wait`, `Without partitions, coordinate`),
      b: V(`When nobody need answer while cut off, a librarian can wait to hear from the others and promise more, up to one order for all visits, which is keeping one log.`, `Without the availability requirement, serializability is reachable by coordination (consensus on one order).`) });
    add("visits", v);
  }

  /* ---- a question as news arrives ---- */
  if (G.has("query")) {
    const v = { books: ["calm"], threads: ["t8"], costs: [] };
    if (S.question === "grows") Object.assign(v, { st: "ok",
      h: V(`A question that only grows`, `Monotone: coordination-free`),
      b: V(`A question that only grows, such as whether any copy has been made, can be answered as news comes in and is never taken back. No waiting, no roster: it leaves by the scholars' door.`, `A monotone program has a consistent, coordination-free distributed implementation; it need not know the membership.`) });
    else if (!S.roster || answerAnd) Object.assign(v, { st: "wall", wall: "calm", threads: ["t8", "t9"],
      h: !S.roster ? V(`No roster: never sure it heard everyone`, `Non-monotone without membership`) : V(`An absence cannot be answered at once`, `Non-monotone and available: impossible`),
      b: V(`A question that rests on an absence, such as whether these are all the copies, must hear from everyone${!S.roster ? ", which a librarian with no roster never can" : ", so a place that must answer at once cannot answer it"}. A manifest of what came before would turn the absence into something that can travel.`,
           `CALM: a program is coordination-free iff it is monotone, equivalently iff it can be computed without knowing the membership. A non-monotone step can be sealed with a manifest, moved off the critical path, or compensated afterwards.`) });
    else Object.assign(v, { st: c.t ? "wait" : "wait", costs: ["wait"], threads: ["t8", "t9", "t10"],
      h: V(`An absence must hear from all ${word(S.n)}`, `Non-monotone: wait for every member`),
      b: V(`A question that rests on an absence must hear from every place on the roster first, and it goes north to the assemblies.${c.t ? ` With ${word(c.t)} fallen silent, the answer waits for ever, since a dead man looks like a slow bird.` : ""}`,
           `Non-monotone queries need coordination: every member must be heard.${c.t ? " A crashed member blocks it indefinitely." : ""}`) });
    add("query", v);
  }

  /* walls that bind combinations: CAP for visits' recency, CALM for absence */
  out.goals.forEach(g => { if (g.need) g.fix = g.need; });
  out.ideas = ideas(S, c, G);
  out.ideas.forEach(x => (x.threads || []).forEach(t => out.threads.add(t)));
  out.books = rank(S, c);
  return out;
}

function cutNote(S, v, sd, c) {
  v.notes = v.notes || [];
  if (S.road !== "cut" || v.st === "wall") return;
  const lo = liveIn(S, sd.off), hi = liveIn(S, sd.on), need = c.m ? S.n - c.F : c.maj;
  const big = Math.max(lo, hi);
  if (big >= need) {
    (v.notes = v.notes || []).push(V(`The cut leaves ${word(hi)} on one side and ${word(lo)} on the other: the side of ${word(big)} goes on, the other waits until the road opens.`, `The partition splits ${hi} | ${lo}: the side with a quorum (${need}) proceeds; the other blocks.`));
  } else {
    v.st = "wait";
    (v.notes = v.notes || []).push(V(`The cut leaves no side with ${word(need)} living places: nobody decides until the road opens, and nobody decides wrongly.`, `No side of the partition holds a quorum of ${need}: progress blocks until it heals; safety holds.`));
  }
}

/* ================================================================ the ideas at work, each with where to read more */
function ideas(S, c, G) {
  const L = [], add = (o) => L.push(o);
  const on = g => G.has(g);
  if (on("order")) {
    add({ id: "tally", t: V("The tally", "Lamport clocks"), b: V("A tally rises with every entry and jumps past any number a slip brings. If one entry could have led to another, it carries the smaller number; two entries with no slip between them can carry any numbers.", "C(a) < C(b) whenever a → b; the converse fails for concurrent events."), read: [R("owc", "tallysec", "The tally"), R("owc", "ties", "Breaking ties")] });
    add({ id: "column", t: V("A column for every place", "Vector clocks"), b: V(`With a column of ${word(S.n)} numbers, one per place, a slip tells exactly what could have led to what: cause from coincidence. News a goatherd carries over the mountain, outside the slips, is never seen.`, `V(a) < V(b) iff a → b; incomparable vectors mark concurrent events. Causality outside the messages is invisible.`), read: [R("owc", "column", "One number for each house"), R("owc", "mountain", "Shortcut over the mountain")] });
    add({ id: "store", t: V("One storehouse, no gatekeeper", "Mutual exclusion"), b: V("With one order every place agrees on, the places can share one storehouse with nobody in charge: requests are served in tally order.", "A total order of requests gives mutual exclusion without a coordinator."), read: [R("owc", "storesec", "One storehouse, no gatekeeper")] });
  }
  if (on("asone")) {
    add({ id: "board", t: V("The rule of the board", "Linearizability"), b: V("A request confirmed before another was even sent must be filled first: first by the sun, which no tally can see. The rule asks that each request seem to happen at one moment inside its span.", "Real-time order is respected; real-time and causal order are incomparable."), read: [R("mc", "rulesec", "The rule of the board"), R("mc", "firsts", "The tallies' first, and the sun's first")] });
    add({ id: "local", t: V("Board by board", "Locality"), b: V("If each board keeps the rule, all of them together keep it, so the rule can be checked one board at a time, and it never makes one place wait on another's business.", "Linearizability is local and nonblocking; sequential consistency is not local."), read: [R("mc", "locality", "Grain and oil"), R("mc", "nowait", "Nobody made to wait")] });
  }
  if (on("stock")) {
    add({ id: "sash", t: V("The red sash", "Markers"), b: V("A sash on a track says: no more carts behind me count. It turns the absence of carts into something that can travel.", "A marker delimits the channel's recorded messages."), read: [R("ts", "sashsec", "The red sash"), R("ts", "cuts", "Cuts that hold and cuts that do not")], threads: ["t9"] });
    add({ id: "morning", t: V("A morning nobody lived", "Consistent cuts"), b: V("The total may describe no single moment, yet one the island could have passed through, so whatever stays true once true, such as a deficit, can be read from it.", "The snapshot is reachable from the start and leads to the end, so it decides stable properties."), read: [R("ts", "morning", "A morning nobody lived through"), R("ts", "good", "What such a total is good for")] });
  }
  if (on("agree") || on("log")) {
    if (c.t > 0 || c.m > 0) add({ id: "most", t: V("Wait for most, never all", "Intersecting quorums"), b: V(`A silent place may be dead, so never wait for all ${word(S.n)}; wait for most, since any two majorities share someone who carries what the first one did.${c.m ? ` With liars, the shared part must hold an honest one: groups of ${word(S.n - c.F)} share ${word(Math.max(0, 2 * (S.n - c.F) - S.n))}.` : ` Here, groups of ${word(c.maj)} share at least ${word(2 * c.maj - S.n)}.`}`,
        `Wait for n − f replies; two quorums of q intersect in 2q − n processes${c.m ? `; with Byzantine faults the intersection must exceed f (n ≥ 3f + 1)` : ` (here q = ${c.maj}, intersection ≥ ${2 * c.maj - S.n})`}.`), read: [R("ptp", "majorities", "Any two majorities share a member"), R("flp", "silent", "A dead man, or a slow bird?")] });
  }
  if (on("agree")) {
    if (S.timing === "async" && !S.coin && S.slate === "none" && c.F > 0) add({ id: "bivalent", t: V("The raven that would settle it", "Bivalence"), b: V("Some night begins with both answers still possible, and whichever raven would settle it can always be held back a little longer. Nobody need die for the night to stay open.", "Some initial configuration is bivalent, and any pending event can be delayed to preserve bivalence."), read: [R("flp", "dusksec", "The dusk that settles nothing"), R("flp", "defersec", "The raven that would settle it can always be held back"), R("flp", "change", "What would have to change")] });
    if (S.timing === "wind") add({ id: "wind", t: V("Glasses and turns", "Rounds after GST"), b: V("The wind always drops, at a moment no one sees, and a bird let go in still air arrives within a glass. Turns of glasses pass from tent to tent; pledges lock an answer, and only later pledges unlock it.", "Delays are unbounded until an unknown GST and bounded after; locks released only for later locks keep agreement."), read: [R("dls", "windsec", "The wind keeps the ravens in the folds"), R("dls", "turnsec", "Turns and pledges"), R("dls", "commitsec", "Committing once the wind drops")].concat(c.m ? [R("dls", "liarsec", "Liars and seals")] : []) });
    if (S.coin) add({ id: "coin", t: V("A coin in each tent", "Local coins"), b: V("Where no plan can be sure, chance can come close: whoever times the birds cannot foresee a coin. It costs a little certainty, since every man commits only with probability one.", "Randomization defeats the adversarial scheduler at the price of probabilistic termination."), read: [R("bo", "coin", "A coin in each tent"), R("bo", "toss", "The toss"), R("bo", "prob", "With probability one")].concat(c.m ? [R("bo", "limits", "What chance does not buy")] : []), threads: ["t7"] });
    if (S.slate !== "none") add({ id: "slate", t: V("A slate at every tent", "Failure detectors"), b: V("Each tent chalks the men it thinks dead and rubs a man out when his bird comes. Slates are often wrong; what matters is how they chalk the dead and spare the living. Bad slates can stall the camp, never split it.", "Detectors are classified by completeness and accuracy; ◇W is the weakest that solves consensus, and consensus is equivalent to atomic broadcast."), read: [R("ct", "slatesec", "A slate at every tent"), R("ct", "kindssec", "Eight kinds of slate"), R(S.slate === "never" ? "ct" : "ct", S.slate === "never" ? "strongsec" : "turnsec", S.slate === "never" ? "One man never chalked" : "In the end, one man spared")] });
    if (c.m) add({ id: "liars", t: V("Three cannot bear one liar", "n ≥ 3m + 1"), b: V("An honest guard cannot tell a lying chief from a lying peer. Four can bear one, by relaying every order and taking the greater count; with seal rings no one can forge, the number of liars stops mattering, while rounds are timed.", "OM(m) needs n ≥ 3m + 1; SM(m) works for any m in synchronous rounds."), read: [R("bgp", "threesec", "Three cannot be brought to agree"), R("bgp", "fewsec", "Four men to a liar"), R("bgp", "sealsec", "The seal rings")], threads: ["t6"] });
  }
  if (on("log")) {
    if (!c.m) {
      add({ id: "ballot", t: V("One ballot, step by step", "Prepare and accept"), b: V("Each numbered ballot first asks most legislators for their latest votes, then proposes the decree of the latest vote among them, so whatever may have passed survives. Leading is a job, not a rank.", "Phase 1 learns the highest accepted value; phase 2 proposes it; leaders help liveness, never safety."), read: [R("ptp", "ballot", "One ballot, step by step"), R("ptp", "progress", "Too many ballots block everything"), R("ptp", "parliament", "A separate Synod for every number")], threads: ["t4"] });
      if (S.podium) add({ id: "podium", t: V("The podium", "Primary and view change"), b: V("One legislator at a time writes the law. When the podium falls silent, a caller raises a higher board, and whoever answers with the latest board-and-line takes the podium.", "The member of a view-change majority with the highest viewstamp becomes primary and sends its state."), read: [R("vr", "podium", "The podium"), R("vr", "takes", "Who takes the podium"), R("vr", "porch", "The holder who has not noticed")].concat(S.come === "wax" ? [R("vr", "wax", "Wax, not ink")] : []) });
      if (S.come === "ink") add({ id: "ink", t: V("Indelible ink", "Stable storage"), b: V("Legislators wander in and out; every promise goes into a scroll in indelible ink, so a returning member never breaks one.", "Promises are logged to stable storage before they are sent."), read: [R("ptp", "rules", "Everyone is honest, and anyone may be absent")], threads: ["t9"] });
    } else {
      add({ id: "echoes", t: V("Two echoes", "Prepare and commit"), b: V("A liar's word counts only when enough men echo it, so two stories can never both stand. Blank entries fill the numbering, and settled checkpoints keep the scroll short.", "2f + 1 matching messages per phase; null requests fill gaps; stable checkpoints bound the log."), read: [R("kol", "echoes", "Two echoes"), R("kol", "changesec", "Changing the job"), R("kol", "settlesec", "Settling checkpoints")], threads: ["t6", "t9"] });
      add({ id: "bundles", t: V("Votes to one man, bundles to all", "Quorum certificates"), b: V("Instead of every man writing to every other, each sends a sealed vote to the registrar, who ties them into one bundle; a third stage lets the job pass at every entry.", "Linear phases by aggregation; a third phase makes view change linear and responsive."), read: [R("hs", "votes", "Votes to one man, bundles to all"), R("hs", "stages", "Three stages and a lock"), R("hs", "chain", "A new registrar every entry")] });
    }
  }
  if (on("answer") || S.road === "cut") add({ id: "cutoff", t: V("The cut-off place", "Partitions"), b: V("A place cut off by lost birds cannot tell a night when the plan moved from one when it did not. A muster-master keeps the copies as one and leaves the cut-off man waiting; answering from one's own copy keeps everyone answered and nobody sure.", "Primary-copy gives C without A; local answers give A without C; timeouts help only with known delay bounds."), read: [R("cap", "cutsec", "The cut-off tent"), R("cap", "mustersec", "The muster-master's arrangement"), R("cap", "glasssec", "Waiting a glass"), R("cap", "windsec", "When the flight has no bound")] });
  if (on("converge")) {
    if (S.merge === "later") add({ id: "gossip", t: V("Word of mouth and the festival", "Rumor mongering and anti-entropy"), b: V("Fresh news passes on until most of those met already know it, which leaves a few unheard; at the festival, partners drawn by lot compare whole collections and catch the rest.", "Rumors leave a residue; anti-entropy reaches every site; pull beats push in the tail."), read: [R("gos", "word", "Word of mouth"), R("gos", "residue", "Who never hears"), R("gos", "festival", "The festival"), R("gos", "withdraw", "Withdrawing a work")], threads: ["t7", "t9"] });
    else add({ id: "pebbles", t: V("One column each", "G-counters and PN-counters"), b: V("Each column is written only by its own scribe and only grows, so the larger pile is always the newer. Losses go in black pebbles; a struck title loses only the tags its striker saw.", "Join-semilattice state; PN-counters, OR-sets with tombstones."), read: [R("crdt", "column", "One column each"), R("crdt", "lost", "Made and lost"), R("crdt", "titles", "Titles added and struck"), R("crdt", "nots", "What it does not say")], threads: ["t8", "t9"] });
  }
  if (on("fresh")) add({ id: "groups", t: V("How many to wait for", "Quorum sizes"), b: V(`Waiting for more holders before announcing, or more replies before reading, makes an old copy rarer and every visit slower. With ${word(S.n)} places, ${word(S.W)} and ${word(S.R)} ${S.R + S.W > S.n ? "must meet" : "can miss each other"}.`, `Latency against staleness: R = ${S.R}, W = ${S.W}, N = ${S.n}.`), read: [R("pbs", "wait", "How many to wait for"), R("pbs", "miss", "When the groups miss each other"), R("pbs", "behind", "How many editions behind"), R("pbs", "shows", "How long until it shows")] });
  if (on("visits")) add({ id: "visit", t: V("What a librarian can promise alone", "Highly available transactions"), b: V("Hold back, never hold up: show only what is whole, and answer at once from what already is. A cord binds a visit's corrections together; a reply is held until its letter arrives.", "Delay visibility, never the response: MAV, writes-follow-reads, cut isolation."), read: [R("hat", "half", "No half-made corrections"), R("hat", "cord", "Corrections bound together"), R("hat", "one", "Staying with one library"), R("hat", "last", "The last copy"), R("hat", "latest", "The latest edition")], threads: ["t10"] });
  if (on("query")) add({ id: "doors", t: V("Two doors", "Monotone and non-monotone"), b: V("The hall sends each question out by the door its shape decides: south to the coast if it only grows, north to the assemblies if it rests on an absence.", "CALM sorts programs by monotonicity; non-monotone steps can be sealed with a manifest."), read: [R("calm", "grow", "Questions that only grow"), R("calm", "absence", "Questions that rest on absence"), R("calm", "roster", "The librarian without a roster"), R("calm", "once", "Waiting only once")], threads: S.question === "absence" ? ["t9", "t10"] : ["t8"] });
  return L;
}

/* ================================================================ which books answer this world, and what one change would bring */
function kindOf(S) { const c = counts(S); return c.m ? "liar" : c.t ? "crash" : "none"; }
const DIMS = [
  { k: "timing", get: S => S.timing, name: OPT.timing.name, lab: v => OPT.timing[v] },
  { k: "road", get: S => S.road, name: OPT.road.name, lab: v => OPT.road[v] },
  { k: "faults", get: kindOf, name: V("Who may fail", "Faults"), lab: v => ({ none: V("Nobody fails", "No faults"), crash: V("One may fall silent", "Crash faults"), liar: V("One may lie", "Byzantine faults") })[v] },
  { k: "coin", get: S => S.coin, name: TOOLS.coin, lab: v => v ? V("Carry a coin", "Randomize") : V("No coin", "Deterministic") },
  { k: "slate", get: S => S.slate, name: OPT.slate.name, lab: v => OPT.slate[v] },
  { k: "seal", get: S => S.seal, name: TOOLS.seal, lab: v => v ? V("Carry seal rings", "Sign messages") : V("No seals", "Oral messages") },
  { k: "podium", get: S => S.podium, name: TOOLS.podium, lab: v => v ? V("A podium", "A leader") : V("No podium", "Leaderless") },
  { k: "bundle", get: S => S.bundle, name: TOOLS.bundle, lab: v => v ? V("Bundle the votes", "Aggregate votes") : V("Loose votes", "All-to-all votes") },
  { k: "come", get: S => S.come, name: OPT.come.name, lab: v => OPT.come[v] },
  { k: "roster", get: S => S.roster, name: V("A roster", "Membership"), lab: v => v ? V("Every place knows the roster", "Known membership") : V("No roster", "Unknown membership"), only: 1 },
  { k: "fifo", get: S => S.fifo, name: V("Carts kept in order", "FIFO"), lab: v => v ? V("Keep carts in order", "FIFO channels") : V("Carts may pass", "Non-FIFO"), only: 1 },
  { k: "merge", get: S => S.merge, name: V("How copies meet", "Merge"), lab: v => OPT.merge[v], only: 1, goal: "converge" }
];
const DEFTOOL = { coin: false, slate: "none", seal: false, podium: false, bundle: false, come: "none" };
function rank(S, c) {
  const G = new Set(S.goals);
  const list = Object.keys(WORLD).map(id => {
    const W = WORLD[id], diffs = [];
    W.goals.forEach(g => { if (!G.has(g)) diffs.push({ k: "goal", g, t: V(`Ask: ${GOALNAME[g].i.toLowerCase()}`, `Require ${GOALNAME[g].m.toLowerCase()}`) }); });
    DIMS.forEach(d => {
      let want = W[d.k];
      if (want === undefined) { if (d.only) return; want = DEFTOOL[d.k]; if (want === undefined) return; }
      if (want === "any") return;
      if (d.goal && !G.has(d.goal)) return;
      const arr = Array.isArray(want) ? want : [want], have = d.get(S);
      if (!arr.includes(have)) diffs.push({ k: d.k, v: arr[0], t: V(`${d.lab(arr[0]).i}`, `${d.lab(arr[0]).m}`) });
    });
    const hit = W.goals.filter(g => G.has(g)).length;
    return { id, diffs, hit };
  });
  return list.filter(b => b.hit > 0 || b.diffs.length <= 1).sort((a, b) => a.diffs.length - b.diffs.length || b.hit - a.hit || Object.keys(WORLD).indexOf(a.id) - Object.keys(WORLD).indexOf(b.id));
}
/* apply one difference to a world, the way a book would have it */
function applyDiff(S, d) {
  S = JSON.parse(JSON.stringify(S));
  if (d.k === "goal") { if (!S.goals.includes(d.g)) S.goals.push(d.g); }
  else if (d.k === "faults") {
    const keep = S.nodes.map(x => (x === "dead" || x === "liar") ? "ok" : x);
    if (d.v === "crash") keep[Math.min(1, S.n - 1)] = "dead";
    if (d.v === "liar") keep[0] = "liar";
    S.nodes = keep;
  } else S[d.k] = d.v;
  if (d.k === "bundle" && d.v) S.seal = true;
  return norm(S);
}
function preset(id) {
  const W = WORLD[id], S = DEFAULT();
  S.n = W.n; S.timing = W.timing === "any" ? "async" : W.timing; S.road = Array.isArray(W.road) ? W.road[0] : W.road;
  S.fifo = W.fifo !== undefined ? W.fifo : true;
  Object.keys(DEFTOOL).forEach(k => { const v = W[k]; S[k] = v === undefined || v === "any" ? DEFTOOL[k] : Array.isArray(v) ? v[0] : v; });
  S.roster = W.roster !== undefined ? W.roster : true;
  S.merge = W.merge || "later"; S.R = W.R || 1; S.W = W.W || 1;
  const k = Array.isArray(W.faults) ? W.faults[0] : W.faults;
  S.nodes = Array.from({ length: W.n }, () => "ok");
  if (k === "crash") { const d = W.dead || 1; for (let i = 0; i < d; i++) S.nodes[(1 + i * 2) % W.n] = "dead"; }
  if (k === "liar") S.nodes[0] = "liar";
  S.goals = W.goals.slice(); S.cut = 1;
  return norm(S);
}

const ENGINE = { V, BK, OPT, TOOLS, GOALS, WORLD, WALLS, THREADS, COSTS, STATUS, DEFAULT, norm, counts, judge, rank, applyDiff, preset, sides };
if (typeof module !== "undefined" && module.exports) module.exports = ENGINE;
root.ROUND_ENGINE = ENGINE;
})(typeof window !== "undefined" ? window : globalThis);


/* ================================================================ the page */
(function () {
if (typeof document === "undefined") return;
const E = window.ROUND_ENGINE, { V, BK, OPT, TOOLS, GOALS, WALLS, THREADS, COSTS, STATUS } = E;
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const NS = "http://www.w3.org/2000/svg";
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
function el(tag, at, p) { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); if (p) p.appendChild(e); return e; }
const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
const two = v => `<span class="i">${esc(v.i)}</span><span class="m">${esc(v.m)}</span>`;
const f = v => (Math.round(v * 10) / 10).toString();

/* ---------- state, kept in the address so a world can be shared ---------- */
let S = E.DEFAULT();
function fromHash() {
  try {
    const q = new URLSearchParams(location.hash.slice(1));
    if (q.has("book") && E.WORLD[q.get("book")]) { S = E.preset(q.get("book")); return; }
    if (!q.has("n")) return;
    const T = E.DEFAULT();
    T.n = +q.get("n"); T.timing = q.get("timing") || T.timing; T.road = q.get("road") || T.road; T.cut = +q.get("cut") || 1;
    T.fifo = q.get("fifo") !== "0"; T.coin = q.get("coin") === "1"; T.slate = q.get("slate") || "none"; T.seal = q.get("seal") === "1";
    T.podium = q.get("podium") === "1"; T.bundle = q.get("bundle") === "1"; T.come = q.get("come") || "none"; T.roster = q.get("roster") !== "0";
    T.nodes = (q.get("nodes") || "").split("").map(ch => ({ o: "ok", d: "dead", l: "liar" })[ch] || "ok");
    T.goals = (q.get("goals") || "").split(",").filter(Boolean); T.merge = q.get("merge") || "later";
    T.R = +q.get("R") || 1; T.W = +q.get("W") || 1; T.sticky = q.get("sticky") === "1"; T.question = q.get("q") || "grows";
    if (!["async", "wind", "glass"].includes(T.timing)) T.timing = "async";
    if (!["arrive", "lost", "cut"].includes(T.road)) T.road = "arrive";
    if (!["none", "end", "never"].includes(T.slate)) T.slate = "none";
    if (!["none", "ink", "wax"].includes(T.come)) T.come = "none";
    S = E.norm(T);
  } catch (e) { S = E.DEFAULT(); }
}
function toHash() {
  const q = new URLSearchParams({ n: S.n, timing: S.timing, road: S.road, cut: S.cut, fifo: S.fifo ? 1 : 0, coin: S.coin ? 1 : 0, slate: S.slate, seal: S.seal ? 1 : 0,
    podium: S.podium ? 1 : 0, bundle: S.bundle ? 1 : 0, come: S.come, roster: S.roster ? 1 : 0, nodes: S.nodes.map(x => x[0] === "o" ? "o" : x[0]).join(""),
    goals: S.goals.join(","), merge: S.merge, R: S.R, W: S.W, sticky: S.sticky ? 1 : 0, q: S.question });
  try { history.replaceState(null, "", "#" + q.toString()); } catch (e) {}
}

/* ---------- controls ---------- */
const reg = () => document.body.dataset.reg;
function chips(box, opts, get, set, multi) {
  box.innerHTML = "";
  opts.forEach(([v, lab, tip]) => {
    const b = h("button", "chip", two(lab)); b.type = "button"; b.dataset.v = v;
    if (tip) b.title = tip;
    b.addEventListener("click", () => { set(v); update(true); });
    box.appendChild(b);
  });
  box._sync = () => $$(".chip", box).forEach(b => b.setAttribute("aria-pressed", String(multi ? get().includes(b.dataset.v) : String(get()) === b.dataset.v)));
}
function stepper(box, get, set, lo, hi) {
  box.innerHTML = "";
  const minus = h("button", "stp", "−"), out = h("output", "stv"), plus = h("button", "stp", "+");
  minus.type = plus.type = "button"; minus.setAttribute("aria-label", "Fewer"); plus.setAttribute("aria-label", "More");
  minus.addEventListener("click", () => { set(get() - 1); update(true); });
  plus.addEventListener("click", () => { set(get() + 1); update(true); });
  box.append(minus, out, plus);
  box._sync = () => { const v = get(); out.textContent = v; minus.disabled = v <= lo(); plus.disabled = v >= hi(); };
}
const setCount = (kind, k) => {
  k = Math.max(0, k);
  const other = kind === "dead" ? "liar" : "dead";
  let cur = S.nodes.filter(x => x === kind).length;
  while (cur > k) { const i = S.nodes.lastIndexOf(kind); S.nodes[i] = "ok"; cur--; }
  while (cur < k) {
    const order = kind === "dead" ? [...S.nodes.keys()].map(i => (i * 2 + 1) % S.n) : [...S.nodes.keys()];
    const i = order.find(j => S.nodes[j] === "ok");
    if (i === undefined) break;
    S.nodes[i] = kind; cur++;
  }
  if (!S.nodes.some(x => x !== "dead")) S.nodes[S.nodes.indexOf(other) >= 0 ? S.nodes.indexOf(other) : 0] = "ok";
};
function buildControls() {
  stepper($("#c-n"), () => S.n, v => { S.n = v; }, () => 2, () => 9);
  chips($("#c-timing"), ["async", "wind", "glass"].map(v => [v, OPT.timing[v]]), () => S.timing, v => { S.timing = v; });
  chips($("#c-road"), ["arrive", "lost", "cut"].map(v => [v, OPT.road[v]]), () => S.road, v => { S.road = v; });
  stepper($("#c-cut"), () => S.cut, v => { S.cut = v; }, () => 1, () => S.n - 1);
  chips($("#c-fifo"), [["1", V("Carts keep their order on each track", "FIFO channels")]], () => S.fifo ? ["1"] : [], () => { S.fifo = !S.fifo; }, true);
  chips($("#c-tools"), Object.keys(TOOLS).map(k => [k, TOOLS[k]]), () => Object.keys(TOOLS).filter(k => S[k]), v => { S[v] = !S[v]; if (v === "seal" && !S.seal) S.bundle = false; }, true);
  chips($("#c-slate"), ["none", "end", "never"].map(v => [v, OPT.slate[v]]), () => S.slate, v => { S.slate = v; });
  stepper($("#c-dead"), () => S.nodes.filter(x => x === "dead").length, v => setCount("dead", v), () => 0, () => S.n - 1 - S.nodes.filter(x => x === "liar").length);
  stepper($("#c-liar"), () => S.nodes.filter(x => x === "liar").length, v => setCount("liar", v), () => 0, () => S.n - S.nodes.filter(x => x === "dead").length - 1);
  chips($("#c-come"), ["none", "ink", "wax"].map(v => [v, OPT.come[v]]), () => S.come, v => { S.come = v; });
  chips($("#c-roster"), [["1", V("Every place knows the whole roster", "Known membership")]], () => S.roster ? ["1"] : [], () => { S.roster = !S.roster; }, true);
  chips($("#c-goals"), GOALS.map(([k, lab]) => [k, lab]), () => S.goals, v => { const i = S.goals.indexOf(v); if (i >= 0) S.goals.splice(i, 1); else S.goals.push(v); }, true);
  chips($("#c-merge"), ["later", "merge"].map(v => [v, OPT.merge[v]]), () => S.merge, v => { S.merge = v; });
  stepper($("#c-W"), () => S.W, v => { S.W = v; }, () => 1, () => S.n);
  stepper($("#c-R"), () => S.R, v => { S.R = v; }, () => 1, () => S.n);
  chips($("#c-sticky"), [["1", V("Each reader keeps to one library", "Sticky clients")]], () => S.sticky ? ["1"] : [], () => { S.sticky = !S.sticky; }, true);
  chips($("#c-question"), ["grows", "absence"].map(v => [v, OPT.question[v]]), () => S.question, v => { S.question = v; });
  const sel = $("#c-book");
  Object.keys(E.WORLD).forEach(id => { const o = document.createElement("option"); o.value = id; o.textContent = BK[id].t; sel.appendChild(o); });
  sel.addEventListener("change", () => { if (sel.value) { S = E.preset(sel.value); update(true); sim.reset(); } });
  $("#c-reset").addEventListener("click", () => { S = E.DEFAULT(); sel.value = ""; update(true); sim.reset(); });
}
function syncControls() {
  $$("[id^='c-']").forEach(b => b._sync && b._sync());
  $("#row-cut").hidden = S.road !== "cut";
  $("#sub-merge").hidden = !S.goals.includes("converge");
  $("#sub-fresh").hidden = !S.goals.includes("fresh");
  $("#sub-visits").hidden = !S.goals.includes("visits");
  $("#sub-query").hidden = !S.goals.includes("query");
  $("#subs").hidden = !["converge", "fresh", "visits", "query"].some(g => S.goals.includes(g));
}

/* ---------- the reading of the world ---------- */
const bookLink = (r) => `<a class="rd" href="../${BK[r.slug].slug}/index.html#${r.a}"><i>${esc(BK[r.slug].t)}</i> · ${esc(r.label)}</a>`;
function renderReading(J) {
  /* verdicts */
  const vb = $("#verdicts"); vb.innerHTML = "";
  if (!J.goals.length) vb.appendChild(h("p", "empty", two(V("Choose a goal above, and the round says what this world allows.", "Select a guarantee to evaluate this model."))));
  J.goals.forEach(g => {
    const card = h("article", "vd st-" + g.st);
    const fix = g.need && g.need.n && g.need.n <= 9 && g.need.n > S.n ? `<button type="button" class="fixb" data-n="${g.need.n}">${two(V(`Make it ${g.need.n} places`, `Set n = ${g.need.n}`))}</button>` : "";
    card.innerHTML = `<div class="vd-top"><span class="goal">${two(Object.fromEntries(GOALS)[g.g])}</span><span class="pill">${two(STATUS[g.st])}</span></div>
      <h3>${two(g.h)}</h3><p>${two(g.b)}</p>${(g.notes || []).map(n => `<p class="note">${two(n)}</p>`).join("")}
      <p class="further"><span class="kick">${two(V("Read more", "Further reading"))}</span> ${[...new Set(g.books)].slice(0, 3).map(b => `<a href="../${BK[b].slug}/index.html"><i>${esc(BK[b].t)}</i></a>`).join(" · ")}</p>${fix}`;
    vb.appendChild(card);
  });
  /* walls */
  const wb = $("#walls"); wb.innerHTML = "";
  $("#walls-sec").hidden = !J.walls.length;
  J.walls.forEach(w => {
    const W = WALLS[w.id], card = h("article", "wall paper");
    const esc_ = WALL_ESC[w.id](S).filter(Boolean);
    const hard = w.goals.some(g => (J.goals.find(x => x.g === g) || {}).st === "wall");
    card.innerHTML = `<div class="kicker">${two(W.k)} · ${two(hard ? V("in the way of ", "blocks ") : V("stands beside ", "constrains "))}${w.goals.map(g => two(Object.fromEntries(GOALS)[g])).join(", ")}</div>
      <h3>${two(W.t)}</h3><p>${two(W.b)}</p><p class="see">${two(W.see)}</p>
      ${esc_.length ? `<div class="ways"><span class="kick">${two(V("What gets through", "Ways around"))}</span>${esc_.map((x, i) => `<button type="button" class="way" data-w="${w.id}" data-i="${i}">${two(x.t)}</button>`).join("")}</div>` : ""}
      <p class="further"><a href="../one-change-apart/index.html#${W.a}">${two(V("The wall in One Change Apart", "The bound in One Change Apart"))}</a></p>`;
    card._esc = esc_;
    wb.appendChild(card);
  });
  /* ideas */
  const ib = $("#ideas"); ib.innerHTML = "";
  $("#ideas-sec").hidden = !J.ideas.length;
  J.ideas.forEach(x => {
    const card = h("article", "idea");
    card.innerHTML = `<h3>${two(x.t)}</h3><p>${two(x.b)}</p><div class="reads">${x.read.map(bookLink).join("")}</div>`;
    ib.appendChild(card);
  });
  /* books */
  const bb = $("#books"); bb.innerHTML = "";
  J.books.slice(0, 6).forEach(b => {
    const B = BK[b.id], card = h("article", "bk" + (b.diffs.length ? "" : " exact"));
    const lead = b.diffs.length === 0 ? V("This is the book's own world", "This is the paper's model")
      : b.diffs.length === 1 ? V("One change away", "One assumption away") : V(`${b.diffs.length} changes away`, `${b.diffs.length} assumptions away`);
    card.innerHTML = `<div class="bk-k">${esc(B.s)} · <span class="m">${esc(B.p)}</span><span class="i">${esc(lead.i)}</span><span class="m"> · ${esc(lead.m)}</span></div>
      <h3><a href="../${B.slug}/index.html">${esc(B.t)}</a></h3>
      ${b.diffs.length ? `<div class="ways">${b.diffs.slice(0, 4).map((d, i) => `<button type="button" class="way" data-b="${b.id}" data-i="${i}">${two(d.t)}</button>`).join("")}</div>` : ""}`;
    card._diffs = b.diffs;
    bb.appendChild(card);
  });
  /* threads and costs */
  const tb = $("#threads"); tb.innerHTML = "";
  Object.keys(THREADS).forEach(k => { const on = J.threads.has(k), a = h("a", "th" + (on ? " on" : ""), two(THREADS[k])); a.href = "../one-change-apart/index.html#" + k; tb.appendChild(a); });
  const cb = $("#costs"); cb.innerHTML = "";
  Object.keys(COSTS).forEach(k => { const on = J.costs.has(k), d = h("div", "cost" + (on ? " on" : ""), `<b>${two(COSTS[k].t)}</b><span>${two(COSTS[k].b)}</span>`); cb.appendChild(d); });
}
/* the ways round each wall, as changes the reader can make with one click */
const WALL_ESC = {
  flp: S0 => [
    { t: V("A wind that drops", "Partial synchrony"), go: s => { s.timing = "wind"; } },
    { t: V("A coin in each tent", "Randomization"), go: s => { s.coin = true; } },
    !E.counts(S0).m && { t: V("A slate of suspects", "A failure detector ◇S"), go: s => { s.slate = "end"; } },
    { t: V("Every flight within a sandglass", "Synchronous rounds"), go: s => { s.timing = "glass"; } }
  ],
  quorum: S0 => {
    const c = E.counts(S0), need = c.m ? (S0.timing === "async" ? 5 * c.F + 1 : 3 * c.F + 1) : 2 * c.t + 1;
    return [
      need <= 9 && { t: V(`${need} places`, `n = ${need}`), go: s => { s.n = need; } },
      S0.timing === "glass" && c.m && !S0.seal && { t: V("Seal rings, while rounds are timed", "Signatures in synchronous rounds"), go: s => { s.seal = true; } },
      c.m && S0.timing !== "glass" && { t: V("Every flight within a sandglass, with seals", "Synchronous rounds with signatures"), go: s => { s.timing = "glass"; s.seal = true; } },
      !c.m && S0.slate !== "never" && S0.timing === "async" && { t: V("A slate that never chalks one living man", "A strong detector S"), go: s => { s.slate = "never"; s.coin = false; } },
      { t: V("One fewer to fail", "Tolerate one fewer fault"), go: s => { const i = s.nodes.lastIndexOf(c.m ? "liar" : "dead"); if (i >= 0) s.nodes[i] = "ok"; } }
    ];
  },
  cap: S0 => [
    { t: V("Let a place wait instead of answering at once", "Give up availability"), go: s => { s.goals = s.goals.filter(g => g !== "answer"); } },
    S0.goals.includes("asone") && { t: V("Agree only in the end", "Settle for convergence"), go: s => { s.goals = s.goals.filter(g => g !== "asone"); if (!s.goals.includes("converge")) s.goals.push("converge"); } },
    S0.goals.includes("asone") && { t: V("Every bird arrives, within a glass", "Reliable, bounded-delay channels"), go: s => { s.road = "arrive"; s.timing = "glass"; } }
  ],
  calm: S0 => [
    { t: V("Ask a question that only grows", "Make it monotone"), go: s => { s.question = "grows"; } },
    !S0.roster && { t: V("Give every place the roster", "Know the membership"), go: s => { s.roster = true; s.goals = s.goals.filter(g => g !== "answer"); } },
    S0.goals.includes("answer") && { t: V("Let it wait for everyone", "Give up availability"), go: s => { s.goals = s.goals.filter(g => g !== "answer"); } }
  ]
};
document.addEventListener("click", e => {
  const b = e.target.closest("button.way, button.fixb");
  if (!b) return;
  const card = b.closest("article");
  if (b.classList.contains("fixb")) S.n = +b.dataset.n;
  else if (b.dataset.w) { const x = card._esc[+b.dataset.i]; S = JSON.parse(JSON.stringify(S)); x.go(S); E.norm(S); }
  else if (b.dataset.b) S = E.applyDiff(S, card._diffs[+b.dataset.i]);
  update(true); flash();
});
function flash() { const st = $("#stage"); st.classList.remove("flash"); void st.offsetWidth; st.classList.add("flash"); }

/* ================================================================ the round */
const svg = $("#round");
const RIM = 192, VB = 300;
const COLS = ["#9cb648", "#e0b84a", "#5b9be0", "#a57fc0", "#e8964d", "#6fb3a8", "#8fa3b8", "#d9a7c7", "#b07a55"];
const VAL = { A: { c: "#bf4a26", i: "A", m: "1" }, H: { c: "#136f9e", i: "H", m: "0" } };
const ang = i => -90 + 360 * i / S.n;
const pol = (deg, r) => { const a = deg * Math.PI / 180; return [r * Math.cos(a), r * Math.sin(a)]; };
const defs = el("defs", {}, svg);
const hatch = el("pattern", { id: "cuthatch", patternUnits: "userSpaceOnUse", width: 8, height: 8, patternTransform: "rotate(45)" }, defs);
el("line", { x1: 0, y1: 0, x2: 0, y2: 8, stroke: "#bf4a26", "stroke-width": 2.2, "stroke-opacity": .28 }, hatch);
const gDisc = el("g", {}, svg), gBands = el("g", { class: "bands" }, svg), gCut = el("g", { class: "cutg" }, svg),
      gMsg = el("g", { class: "msgs" }, svg), gNodes = el("g", { class: "nodes" }, svg), gMid = el("g", { class: "mid" }, svg);
el("circle", { class: "disc", r: VB - 14 }, gDisc);
el("circle", { class: "road", r: RIM }, gDisc);
el("circle", { class: "road2", r: RIM }, gDisc);
const midT1 = el("text", { class: "mid1", y: -6 }, gMid), midT2 = el("text", { class: "mid2", y: 18 }, gMid), midT3 = el("text", { class: "mid3", y: 38 }, gMid);
const t2 = (node, v) => { node.textContent = v[reg()] || v.i; };

let NODES = [];
function drawStatic(J) {
  gNodes.innerHTML = ""; gBands.innerHTML = ""; gCut.innerHTML = "";
  const sd = E.sides(S), c = J.c;
  /* the cut: a shaded area inside a dashed loop round the places cut off */
  if (S.road === "cut") {
    const step = 360 / S.n, a0 = ang(sd.off[0]) - step / 2 + 3, a1 = ang(sd.off[sd.off.length - 1]) + step / 2 - 3, r0 = 112, r1 = VB - 22;
    const p = (a, r) => pol(a, r).map(f).join(",");
    const large = (a1 - a0) > 180 ? 1 : 0;
    el("path", { class: "cut", d: `M${p(a0, r0)} L${p(a0, r1)} A${r1},${r1} 0 ${large} 1 ${p(a1, r1)} L${p(a1, r0)} A${r0},${r0} 0 ${large} 0 ${p(a0, r0)}Z` }, gCut);
    const [lx, ly] = pol((a0 + a1) / 2, r0 - 14);
    const tl = el("text", { class: "cutlab", x: f(lx), y: f(ly) }, gCut); t2(tl, V("cut off", "partitioned"));
    CUT = { a0, a1, r0 };
  } else CUT = null;
  /* quorum bands: two groups and what they share */
  const G = S.goals, band = (idx, r, cls) => idx.forEach(i => { const a = ang(i), w = Math.min(15, 150 / S.n); el("path", { class: "band " + cls, d: arcD(a - w, a + w, r) }, gBands); });
  let q = null, share = [];
  if (G.includes("fresh")) {
    const Wg = [...Array(S.W).keys()], Rg = [...Array(S.R).keys()].map(i => S.n - 1 - i);
    band(Wg, 262, "bw"); band(Rg, 272, "br"); share = Wg.filter(i => Rg.includes(i));
  } else if (["agree", "log", "asone"].some(g => G.includes(g)) && (c.t || c.m || S.come !== "none")) {
    q = c.m ? Math.max(S.n - c.F, 1) : c.maj;
    const Q1 = [...Array(q).keys()], Q2 = [...Array(q).keys()].map(i => S.n - 1 - i);
    band(Q1, 262, "bw"); band(Q2, 272, "br"); share = Q1.filter(i => Q2.includes(i));
  }
  NODES = S.nodes.map((st, i) => {
    const a = ang(i), [x, y] = pol(a, RIM), g = el("g", { class: "node st-" + st + (share.includes(i) ? " shared" : ""), transform: `translate(${f(x)} ${f(y)})`, tabindex: 0, role: "button" }, gNodes);
    const lab = V(`Place ${i + 1}: ${st === "ok" ? "keeps going" : st === "dead" ? "falls silent" : "may lie"}. Press to change.`, `p${i + 1}: ${st === "ok" ? "correct" : st === "dead" ? "crashed" : "Byzantine"}. Press to change.`);
    g.setAttribute("aria-label", lab[reg()]);
    if (share.includes(i)) el("circle", { class: "halo-g", r: 30 }, g);
    if (st === "liar") el("circle", { class: "halo-r", r: 27 }, g);
    el("rect", { x: -19, y: -13, width: 38, height: 26, rx: 5, fill: st === "dead" ? "#d8cfb8" : COLS[i % COLS.length] }, g);
    const tx = el("text", { class: "nl" }, g); tx.textContent = reg() === "m" ? "p" + "₀₁₂₃₄₅₆₇₈₉"[i + 1] : String(i + 1);
    if (st === "dead") el("path", { class: "cross", d: "M-11,-11L11,11M11,-11L-11,11" }, g);
    /* what the place carries, on the inside of the road */
    const tools = [];
    if (S.podium && i === leader()) tools.push("podium");
    if (S.coin) tools.push("coin");
    if (S.slate !== "none") tools.push("slate");
    if (S.seal) tools.push("seal");
    const inward = pol(a, -1);
    tools.forEach((tl, k) => {
      const off = (k - (tools.length - 1) / 2) * 15, tx0 = inward[0] * 33 - inward[1] * off, ty0 = inward[1] * 33 + inward[0] * off;
      drawTool(g, tl, tx0, ty0);
    });
    /* the badge outside the road */
    const [bx, by] = pol(a, 36).map((v, j) => v);
    const badge = el("g", { class: "badge", transform: `translate(${f(bx)} ${f(by)})` }, g);
    const br = el("rect", { x: -14, y: -9, width: 28, height: 18, rx: 4 }, badge), bt = el("text", {}, badge);
    const toggle = () => { const order = ["ok", "dead", "liar"]; const nx = order[(order.indexOf(S.nodes[i]) + 1) % 3]; S.nodes[i] = nx; if (!S.nodes.some(z => z !== "dead")) S.nodes[i] = "ok"; update(true); const nn = $$(".node", gNodes)[i]; if (nn) nn.focus(); };
    g.addEventListener("click", toggle);
    g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
    return { i, x, y, a, st, g, badge, br, bt };
  });
  /* the middle: the world in a word */
  const worst = ["wall", "warn", "wait", "safe", "likely", "odds", "ok"].find(s => J.goals.some(g => g.st === s));
  const wl = J.walls.find(w => w.goals.some(g => (J.goals.find(x => x.g === g) || {}).st === "wall"));
  gMid.setAttribute("class", "mid st-" + (worst || "none"));
  if (wl) t2(midT1, WALLS[wl.id].t); else if (worst) t2(midT1, STATUS[worst]); else t2(midT1, V("Choose a goal", "Select a guarantee"));
  const sub = q ? V(`groups of ${q} share ${Math.max(0, 2 * q - S.n)}`, `|Q| = ${q}, |Q∩Q′| ≥ ${Math.max(0, 2 * q - S.n)}`)
    : S.goals.includes("fresh") ? V(`${S.W} hold it, ${S.R} asked`, `W = ${S.W}, R = ${S.R}, N = ${S.n}`) : V(`${S.n} places`, `n = ${S.n}`);
  t2(midT2, sub);
  midT3.textContent = "";
}
let CUT = null;
function arcD(a0, a1, r) { const p0 = pol(a0, r), p1 = pol(a1, r); return `M${f(p0[0])},${f(p0[1])} A${r},${r} 0 0 1 ${f(p1[0])},${f(p1[1])}`; }
function drawTool(g, kind, x, y) {
  const t = el("g", { class: "tool " + kind, transform: `translate(${f(x)} ${f(y)})` }, g);
  if (kind === "coin") { el("circle", { r: 5.5 }, t); el("circle", { r: 2.4, class: "in" }, t); }
  if (kind === "slate") el("rect", { x: -6, y: -4.5, width: 12, height: 9, rx: 1.5 }, t);
  if (kind === "seal") { el("circle", { r: 5.8 }, t); el("circle", { r: 2.6, class: "in" }, t); }
  if (kind === "podium") el("path", { d: "M-6,5 L-4,-3 L4,-3 L6,5Z M-7,-3 L7,-3 L7,-6 L-7,-6Z" }, t);
}
const leader = () => { const i = S.nodes.findIndex(x => x !== "dead"); return i < 0 ? 0 : i; };

/* ---------- the simulation: messengers, tallies, piles, answers ---------- */
const sim = (function () {
  let msgs = [], last = 0, nextSend = 0, t0 = 0, paused = false, roundNo = 0, raf = 0;
  let st = {};
  const live = i => S.nodes[i] !== "dead";
  function reset() {
    msgs.forEach(m => m.el.remove()); msgs = [];
    t0 = performance.now(); nextSend = 0; roundNo = 0;
    st = { tally: S.nodes.map(() => 0), ed: S.nodes.map(() => 0), cols: S.nodes.map(() => S.nodes.map(() => 0)),
      val: S.nodes.map(() => "H"), heard: S.nodes.map(() => new Set()), decided: S.nodes.map(() => null),
      log: S.nodes.map(() => 0), writes: 0, sash: S.nodes.map(() => false), jars: S.nodes.map(() => 8), lastSash: -1 };
    /* the living, honest places start split between the two answers */
    S.nodes.map((x, i) => x === "ok" ? i : -1).filter(i => i >= 0).forEach((i, k) => { st.val[i] = k % 2 ? "H" : "A"; });
    paint();
  }
  const primary = () => ["agree", "log", "order", "converge", "fresh", "stock"].find(g => S.goals.includes(g)) || "none";
  const insideCut = (x, y) => {
    if (!CUT) return false;
    const r = Math.hypot(x, y); if (r < CUT.r0) return false;
    let a = Math.atan2(y, x) * 180 / Math.PI; while (a < CUT.a0) a += 360; while (a > CUT.a0 + 360) a -= 360;
    return a <= CUT.a1;
  };
  const isOff = i => S.road === "cut" && i >= S.n - S.cut;
  function windy(now) { return S.timing === "wind" && ((now - t0) % 12000) < 7000; }
  function duration(now) {
    const base = 1250;
    if (S.timing === "glass") return base;
    if (S.timing === "wind" && !windy(now)) return base * (0.9 + Math.random() * 0.2);
    const r = Math.random();
    return base * (0.55 + r * r * r * 5.5);
  }
  function send(a, b, now, kind, data, lab) {
    if (a === b || !live(a)) return;
    const A = NODES[a], B = NODES[b]; if (!A || !B) return;
    const dur = duration(now);
    const m = { a, b, t: now, dur, kind, data, lost: null, stop: null, el: el("g", { class: "msg k-" + kind }, gMsg) };
    m.cx = (A.x + B.x) * .5 * .42; m.cy = (A.y + B.y) * .5 * .42;
    if (S.road === "lost" && Math.random() < .2) m.lost = .3 + Math.random() * .4;
    if (S.road === "cut" && isOff(a) !== isOff(b)) {
      for (let k = 1; k <= 40; k++) { const u = k / 40, p = bez(m, u); if (insideCut(p[0], p[1]) !== isOff(a)) { m.stop = u; break; } }
      if (m.stop == null) m.stop = .5;
    }
    const liarMsg = S.nodes[a] === "liar";
    let label = lab || "";
    if (!lab && (kind === "tally" || kind === "ed" || kind === "log")) label = String(data);
    if (kind === "val") label = VAL[data] ? VAL[data][reg()] : "";
    m.lab = label;
    m.dot = el("circle", { r: label ? 8.5 : 5.5, class: "dot" + (liarMsg ? " liar" : "") + (S.seal && !liarMsg ? " sealed" : ""), fill: kind === "val" && VAL[data] ? VAL[data].c : kind === "sash" ? "#bf4a26" : COLS[a % COLS.length] }, m.el);
    if (label) { m.tx = el("text", { class: "mt" + (kind === "val" ? " inv" : "") }, m.el); m.tx.textContent = label; }
    msgs.push(m);
  }
  function bez(m, u) { const A = NODES[m.a], B = NODES[m.b], v = 1 - u; return [v * v * A.x + 2 * v * u * m.cx + u * u * B.x, v * v * A.y + 2 * v * u * m.cy + u * u * B.y]; }
  function others(a) { return [...S.nodes.keys()].filter(j => j !== a); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function outgoing(now) {
    const g = primary(), n = S.n, liveIdx = [...S.nodes.keys()].filter(live);
    if (!liveIdx.length) return;
    /* the sandglass keeps everyone in step: all send at the start of a round */
    const glass = S.timing === "glass";
    if (glass && now < nextSend) return;
    const L0 = leader(), lead = S.podium && ["log", "agree"].includes(g) && S.nodes[L0] !== "dead";
    const senders = glass ? liveIdx : [lead && Math.random() < .5 ? L0 : pick(liveIdx)];
    if (glass) { nextSend = now + 1700; roundNo++; } else nextSend = now + (S.podium ? 420 : 300) * (5 / Math.max(3, n)) + Math.random() * 120;
    senders.forEach(a => {
      const fan = glass ? others(a).slice(0, n > 5 ? 3 : n) : [pick(others(a))];
      if (g === "order") fan.forEach(b => { st.tally[a]++; send(a, glass ? b : b, now, "tally", S.nodes[a] === "liar" ? Math.floor(Math.random() * 40) : st.tally[a]); });
      else if (g === "converge") {
        if (Math.random() < .35) { if (S.merge === "merge") st.cols[a][a] += 1 + Math.floor(Math.random() * 2); else st.ed[a]++; }
        const sum = st.cols[a].reduce((x, y) => x + y, 0);
        fan.forEach(b => send(a, b, now, "ed", { cols: st.cols[a].slice(), ed: st.ed[a] }, String(S.merge === "merge" ? sum : st.ed[a])));
      } else if (g === "log" || (S.podium && (g === "agree"))) {
        const L = leader();
        if (a === L || !S.podium) {
          if (g === "log" && a === L && Math.random() < (S.podium ? .8 : .5) && !blocked()) st.log[L]++;
          /* the holder of the podium writes to everyone at once; the others answer only the holder */
          (S.podium && a === L ? others(a) : fan).forEach(b => send(a, b, now, g === "log" ? "log" : "val", g === "log" ? st.log[a] : st.val[a]));
        } else send(a, L, now, g === "log" ? "log" : "val", g === "log" ? st.log[a] : st.val[a]);
      } else if (g === "agree") fan.forEach(b => send(a, b, now, "val", S.nodes[a] === "liar" ? (b % 2 ? "A" : "H") : st.val[a]));
      else if (g === "fresh") {
        if (a === 0 || !live(0)) { if (Math.random() < .4) st.ed[a]++; fan.forEach(b => send(a, b, now, "ed", st.ed[a])); }
        else send(a, pick(others(a)), now, "plain");
      } else if (g === "stock") {
        if ((now - t0) - st.lastSash * 9000 > 9000 && a === 0) { st.lastSash = Math.floor((now - t0) / 9000); st.sash = st.sash.map(() => false); st.sash[0] = true; others(0).forEach(b => send(0, b, now, "sash")); }
        else { const k = Math.min(st.jars[a], 1 + Math.floor(Math.random() * 2)); st.jars[a] -= k; fan.forEach(b => send(a, b, now, "cart", k)); }
      } else fan.forEach(b => send(a, b, now, "plain"));
    });
  }
  /* would the goal's verdict hold the round still? */
  let VERD = null;
  const blocked = () => VERD && VERD.goals.some(g => (g.g === "log" || g.g === "agree") && (g.st === "wall" || g.st === "wait"));
  function arrive(m, now) {
    const b = m.b; if (!live(b)) return;
    if (m.kind === "tally") st.tally[b] = Math.max(st.tally[b], +m.data) + 1;
    if (m.kind === "ed") {
      if (m.data && m.data.cols) { st.cols[b] = st.cols[b].map((v, k) => Math.max(v, m.data.cols[k])); st.ed[b] = Math.max(st.ed[b], m.data.ed); }
      else st.ed[b] = Math.max(st.ed[b], +m.data || 0);
    }
    if (m.kind === "log") { if (!isOff(b) || !isOff(leader())) st.log[b] = Math.max(st.log[b], +m.data); }
    if (m.kind === "val") st.heard[b].add(m.a);
    if (m.kind === "sash" && !st.sash[b]) { st.sash[b] = true; others(b).forEach(x => send(b, x, now, "sash")); }
    if (m.kind === "cart") st.jars[b] += +m.data;
  }
  function agreeStep(now) {
    const g = VERD && VERD.goals.find(x => x.g === "agree"); if (!g) return;
    const el_ = now - t0, c = E.counts(S);
    const honest = [...S.nodes.keys()].filter(i => S.nodes[i] === "ok");
    if (g.st === "ok" || g.st === "odds") {
      const when = S.timing === "wind" ? 8200 : S.timing === "glass" ? 1700 * (c.F + 2) : g.st === "odds" ? 7000 : 5200;
      if (g.st === "odds" && el_ < when) { if (Math.random() < .05) { const i = pick(honest); if (i != null && !st.decided[i]) st.val[i] = Math.random() < .5 ? "A" : "H"; } }
      if (el_ > when) {
        const pool = honest.filter(i => !(S.road === "cut" && isOff(i) && E.sides(S).off.filter(live).length < c.maj));
        const counts_ = { A: 0, H: 0 }; pool.forEach(i => counts_[st.val[i]]++);
        const v = counts_.A >= counts_.H ? "A" : "H";
        pool.forEach(i => { st.val[i] = v; st.decided[i] = v; });
      }
    } else if (g.st === "wall" && g.wall === "quorum" && el_ > 6500) {
      honest.forEach((i, k) => { st.decided[i] = k < honest.length / 2 ? "A" : "H"; st.val[i] = st.decided[i]; st.split = true; });
    } else if (g.st === "wall" || g.st === "warn") {
      if (Math.random() < .03) { const i = pick(honest); if (i != null) st.val[i] = st.val[i] === "A" ? "H" : "A"; }
    }
    S.nodes.forEach((x, i) => { if (x === "liar" && Math.random() < .04) st.val[i] = st.val[i] === "A" ? "H" : "A"; });
  }
  function paint() {
    const g = primary(), c = E.counts(S);
    NODES.forEach(N => {
      const i = N.i; let txt = "", show = true, fill = null, cls = "";
      if (S.nodes[i] === "dead") show = false;
      else if (g === "order") txt = String(st.tally[i]);
      else if (g === "converge") txt = S.merge === "merge" ? String(st.cols[i].reduce((x, y) => x + y, 0)) : (reg() === "m" ? "v" : "ed. ") + st.ed[i];
      else if (g === "agree") { txt = VAL[st.val[i]][reg()]; fill = VAL[st.val[i]].c; cls = st.decided[i] ? " decided" + (st.split ? " split" : "") : ""; }
      else if (g === "log") { txt = String(st.log[i]); }
      else if (g === "fresh") txt = (reg() === "m" ? "v" : "ed. ") + st.ed[i];
      else if (g === "stock") { txt = String(st.jars[i]); cls = st.sash[i] ? " sashed" : ""; }
      else show = false;
      N.badge.style.display = show ? "" : "none";
      N.bt.textContent = txt;
      N.badge.setAttribute("class", "badge" + cls + (fill ? " filled" : ""));
      N.br.style.fill = fill || "";
      const w = Math.max(26, txt.length * 7.6 + 10); N.br.setAttribute("width", w); N.br.setAttribute("x", -w / 2);
    });
    /* the third line in the middle: what the round shows now */
    const now = performance.now();
    let v3 = null;
    if (S.timing === "wind") v3 = windy(now) ? V("the wind blows", "before GST") : V("the wind has dropped", "after GST");
    else if (S.timing === "glass") v3 = V(`round ${roundNo}`, `round ${roundNo}`);
    if (g === "log") { const sorted = st.log.filter((_, i) => S.nodes[i] !== "dead").sort((x, y) => y - x); const q = c.m ? S.n - c.F : c.maj; const passed = sorted[q - 1] || 0; v3 = V(`${passed} lines passed`, `commit index ${passed}`); }
    if (g === "stock") { const tot = st.jars.reduce((x, y) => x + y, 0); v3 = V(`${st.sash.filter(Boolean).length} of ${S.n} counted`, `${st.sash.filter(Boolean).length}/${S.n} recorded`); }
    if (v3) t2(midT3, v3); else midT3.textContent = "";
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (paused) return;
    if (now - last < 16) return; last = now;
    if (now >= nextSend) outgoing(now);
    for (let k = msgs.length - 1; k >= 0; k--) {
      const m = msgs[k]; let u = (now - m.t) / m.dur;
      const end = m.lost != null ? m.lost : m.stop != null ? m.stop : 1;
      if (u >= end) {
        if (end === 1) { arrive(m, now); m.el.remove(); msgs.splice(k, 1); continue; }
        /* held by the cut, or taken on the road: linger, then fade */
        if (!m.dead) { m.dead = now; m.el.classList.add(m.lost != null ? "taken" : "held"); const p = bez(m, end); if (m.lost != null) el("path", { class: "hawkx", d: `M${f(p[0] - 6)},${f(p[1] - 6)}L${f(p[0] + 6)},${f(p[1] + 6)}M${f(p[0] + 6)},${f(p[1] - 6)}L${f(p[0] - 6)},${f(p[1] + 6)}` }, m.el); }
        if (now - m.dead > 900) { m.el.remove(); msgs.splice(k, 1); if (m.lost != null && S.road === "lost") send(m.a, m.b, now, m.kind, m.data, m.lab); }
        u = end;
      }
      const [x, y] = bez(m, Math.min(u, end));
      m.dot.setAttribute("cx", f(x)); m.dot.setAttribute("cy", f(y));
      if (m.tx) { m.tx.setAttribute("x", f(x)); m.tx.setAttribute("y", f(y)); }
    }
    agreeStep(now);
    paint();
  }
  function start() { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); }
  return { reset, start, setVerdict: J => { VERD = J; }, pause: p => { paused = p; }, get paused() { return paused; }, paint, resetRound: () => { roundNo = 0; } };
})();

/* ---------- one update draws everything from the state ---------- */
let lastShape = "";
function update(push) {
  E.norm(S);
  const J = E.judge(S);
  syncControls();
  renderReading(J);
  const shape = [S.n, S.nodes.join(""), S.road, S.cut, S.goals.join(), S.merge, S.R, S.W, S.podium, S.coin, S.slate, S.seal, S.timing].join("|");
  drawStatic(J);
  sim.setVerdict(J);
  if (shape !== lastShape) { sim.reset(); lastShape = shape; }
  sim.paint();
  if (push) toHash();
  $("#c-book").value = Object.keys(E.WORLD).find(id => JSON.stringify(E.preset(id)) === JSON.stringify(S)) || "";
}

/* ---------- registers ---------- */
const KEY = "daag-round-reg";
function setReg(r) {
  document.body.dataset.reg = r;
  $$(".segb").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.reg === r)));
  try { localStorage.setItem(KEY, r); } catch (e) {}
  update(false);
}
$$(".segb").forEach(b => b.addEventListener("click", () => setReg(b.dataset.reg)));
$("#pause").addEventListener("click", () => { sim.pause(!sim.paused); $("#pause").setAttribute("aria-pressed", String(sim.paused)); $("#pause").innerHTML = sim.paused ? two(V("Go on", "Resume")) : two(V("Hold the round", "Pause")); });
$("#replay").addEventListener("click", () => { sim.reset(); });

buildControls();
fromHash();
let r0 = "i"; try { r0 = localStorage.getItem(KEY) || "i"; } catch (e) {}
document.body.dataset.reg = r0 === "m" ? "m" : "i";
$$(".segb").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.reg === document.body.dataset.reg)));
update(false);
sim.start();
if (reduce) { sim.pause(true); $("#pause").setAttribute("aria-pressed", "true"); $("#pause").innerHTML = two(V("Go on", "Resume")); }
addEventListener("hashchange", () => { fromHash(); update(false); });
})();
