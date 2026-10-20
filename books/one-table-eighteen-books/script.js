(function(){
'use strict';

const $ = (id) => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';

let reg = 'i'; // 'i' = On the islands, 'm' = In the machine room
let activePlace = 'all';
let activeRoad = 'all';
let activeFault = 'all';
let activeAsk = 'all';
let curBookIdx = 0;
let leftView = 'tiles'; // 'tiles' | 'map'

const PLACES = [
  { id:'ring', island:'Arche', c:'#b5602c',
    i:'Arche · The Ring Road', m:'Asynchronous Message-Passing Ring',
    short:{ i:'Ring Road', m:'Causal / Snapshots' } },
  { id:'foot', island:'Arche', c:'#5f6e28',
    i:'Arche · Foot of Mount Phyle', m:'Crash-Fault Consensus & Partition Bounds',
    short:{ i:'Foot of Phyle', m:'Crash Consensus' } },
  { id:'crown', island:'Arche', c:'#7a4fa0',
    i:'Arche · Crown of Mount Phyle', m:'Byzantine Consensus & State Machine Replication',
    short:{ i:'Crown of Phyle', m:'Byzantine SMR' } },
  { id:'chamber', island:'Paxos', c:'#136f9e',
    i:'Paxos · The Chamber', m:'State-Machine Replication via Numbered Ballots (Paxos)',
    short:{ i:'The Chamber', m:'Paxos Synod' } },
  { id:'tholos', island:'Paxos', c:'#c8961c',
    i:'Paxos · Schedia & The Tholos', m:'Primary-Backup Viewstamped Replication',
    short:{ i:'The Tholos', m:'Viewstamped Rep.' } },
  { id:'coast', island:'Paxos', c:'#2a7b6f',
    i:'Paxos · The Scholars\' Coast', m:'Weakly Consistent & Coordination-Free Replication',
    short:{ i:'Scholars\' Coast', m:'Gossip / CRDT / HAT' } },
  { id:'doors', island:'Paxos', c:'#8a5a36',
    i:'Paxos · The Hall of Two Doors', m:'Monotonic Logic & Coordination-Freeness (CALM)',
    short:{ i:'Hall of Two Doors', m:'CALM Theorem' } }
];

const PLACE_MAP = Object.fromEntries(PLACES.map(p => [p.id, p]));

const FILTERS = {
  road: [
    { id:'all', i:'Any road', m:'Any network' },
    { id:'async', i:'No sandglass (unbounded)', m:'Asynchronous' },
    { id:'partial', i:'Calms after a storm', m:'Partially synchronous' },
    { id:'sync', i:'Fixed rounds', m:'Synchronous rounds' },
    { id:'cut', i:'Road or bay cut in two', m:'Network partition' }
  ],
  fault: [
    { id:'all', i:'Any conduct', m:'Any fault model' },
    { id:'none', i:'All keep working', m:'Fault-free / reliable' },
    { id:'crash', i:'Silent or wandering off', m:'Crash / omission (f < N/2)' },
    { id:'byz', i:'Liars & two-faced seals', m:'Byzantine (N ≥ 3f + 1)' }
  ],
  ask: [
    { id:'all', i:'Every question', m:'All properties' },
    { id:'order', i:'Order & snapshots', m:'Causality / linearizability / cuts' },
    { id:'agree', i:'One irrevocable choice', m:'Consensus / SMR' },
    { id:'avail', i:'Answer without waiting', m:'High availability / convergence' },
    { id:'bound', i:'When waiting is required', m:'Impossibility / CALM boundary' }
  ]
};

const BOOKS = [
  {
    n: 1, slug: 'ordering-without-clocks', place: 'ring', c: '#b5602c',
    title: 'Ordering Without Clocks',
    cite: 'Lamport 1978 · Fidge 1988 · Mattern 1988',
    road: ['async'], fault: ['none'], ask: ['order'],
    mapPt: [108, 170],
    tag: { i: 'One tally per house, or a row of three', m: 'Scalar Lamport clocks vs. vector clocks' },
    sub: {
      i: 'Three houses on a ring road have no shared sundial, yet must tell which event came before which.',
      m: 'Processes without a physical clock track causal precedence (→) across asynchronous messages.'
    },
    trap: {
      i: 'A single tally advances along every road, so e < f when e caused f—but two unlinked mornings also get unequal numbers.',
      m: 'Lamport timestamps satisfy e → f ⇒ L(e) < L(f), but L(e) < L(f) does not imply e → f; concurrent events are falsely ordered.'
    },
    dev: {
      i: 'Each house keeps a row of three tallies—one slot per house—copying the whole row on every slip and taking the larger number slot by slot.',
      m: 'Each node maintains a vector V[1..N], sends V with every message, merges via componentwise max, and increments its own entry.'
    },
    res: {
      i: 'One row is at least as large in every slot and strictly larger in one if and only if a chain of riders links the two events.',
      m: 'V(e) < V(f) ⇔ e → f; incomparable vectors (V(e) ∥ V(f)) identify true concurrency.'
    },
    lim: {
      i: 'The row must carry one slot for every house on the road; no shorter stamp can separate chains from coincidence.',
      m: 'Charron-Bost theorem: exact causal characterization on N processes requires vector dimension at least N.'
    },
    q: { i: 'How can separated houses tell cause from coincidence without a shared clock?', m: 'How can processes capture exact causal precedence without synchronized clocks?' },
    spreads: [
      { id:'before', i:'Before', m:'Happens-before' },
      { id:'tallysec', i:'One tally', m:'Scalar clock' },
      { id:'column', i:'Row of three', m:'Vector clock' },
      { id:'why', i:'Why N slots', m:'Dimension bound' }
    ]
  },
  {
    n: 2, slug: 'many-copies-acting-as-one', place: 'ring', c: '#b5602c',
    title: 'Many Copies, Acting as One',
    cite: 'Herlihy & Wing 1990',
    road: ['async'], fault: ['none','crash'], ask: ['order'],
    mapPt: [145, 145],
    tag: { i: 'One moment inside each gate-to-gate span', m: 'Linearizability: single-copy illusion' },
    sub: {
      i: 'Visitors ask three storehouses to set or read a jar; each visit takes from arrival at the gate to the answer.',
      m: 'Clients invoke concurrent read/write operations with non-zero time intervals on a replicated object.'
    },
    trap: {
      i: 'Reading only the nearest storehouse can return a stale mark after a later visitor has already gone home with the new one.',
      m: 'Local-only reads violate real-time precedence: an operation starting after another returns can observe an older state.'
    },
    dev: {
      i: 'Pin one instant inside each visit\'s span so all visits fall into a single valid line of sets and reads.',
      m: 'Assign each operation a linearization point within its [invocation, response] interval forming a legal sequential history.'
    },
    res: {
      i: 'The rule is local: if every storehouse vessel obeys it on its own, the whole road obeys it together without extra locks.',
      m: 'Linearizability is compositional (local): a system of independent linearizable objects is itself linearizable.'
    },
    lim: {
      i: 'Neither sets nor reads can finish on one house alone while riders may still be on the road.',
      m: 'Strong consistency requires round-trip coordination; neither reads nor writes can be purely local.'
    },
    q: { i: 'When do many storehouses behave as if there were only one jar?', m: 'What correctness condition makes a concurrent or replicated object behave like a single atomic copy?' },
    spreads: [
      { id:'mornsec', i:'Gate spans', m:'Operation intervals' },
      { id:'rulesec', i:'The pin', m:'Linearization point' },
      { id:'locality', i:'Locality', m:'Compositionality' },
      { id:'nowait', i:'Cost of one copy', m:'Non-local cost' }
    ]
  },
  {
    n: 3, slug: 'taking-stock-without-stopping', place: 'ring', c: '#b5602c',
    title: 'Taking Stock Without Stopping',
    cite: 'Chandy & Lamport 1985',
    road: ['async'], fault: ['none'], ask: ['order'],
    mapPt: [176, 178],
    tag: { i: 'Red sashes on the road capture what is in flight', m: 'Marker rule for consistent global snapshots' },
    sub: {
      i: 'Nine amphorae move between three houses; count them all without halting a single cart.',
      m: 'Record a consistent global state (local states + in-transit channels) of a running distributed system without freezing execution.'
    },
    trap: {
      i: 'If one house writes its count before a cart leaves and another writes after it arrives, the same amphora is counted twice—or missed.',
      m: 'Uncoordinated local checkpoints include post-receive states without pre-send states, violating causal cut consistency.'
    },
    dev: {
      i: 'A house records its own store, sends a red sash down every road, and logs every cart arriving on a road until that road\'s sash arrives.',
      m: 'On recording state, send a Marker on all outgoing channels and record incoming messages on each channel until its Marker arrives.'
    },
    res: {
      i: 'The cut never includes an arrival without its departure; the sum of houses plus roads in flight is always nine.',
      m: 'The recorded cut is a frontier closed under happens-before, reachable from the initial state and leading to the final state.'
    },
    lim: {
      i: 'Requires roads where carts never overtake one another; the recorded state is one that could have occurred, not necessarily at one wall-clock instant.',
      m: 'Requires FIFO channels; yields a causally consistent state equivalent to a possible execution point, not a physical-time instant.'
    },
    q: { i: 'How do you count every amphora on the island without stopping the carts?', m: 'How can a distributed system record a consistent global checkpoint while messages are in flight?' },
    spreads: [
      { id:'stop', i:'Double count', m:'Inconsistent cut' },
      { id:'sashsec', i:'Red sash', m:'Marker algorithm' },
      { id:'cuts', i:'Clean cut', m:'Consistent cut' },
      { id:'good', i:'Stable truths', m:'Stable predicates' }
    ]
  },
  {
    n: 4, slug: 'the-limits-of-agreement', place: 'foot', c: '#5f6e28',
    title: 'The Limits of Agreement',
    cite: 'Fischer, Lynch & Paterson 1985',
    road: ['async'], fault: ['crash'], ask: ['agree','bound'],
    mapPt: [115, 290],
    tag: { i: 'An adversary delays one rider to keep both outcomes open', m: 'FLP impossibility: bivalent configurations' },
    sub: {
      i: 'Four tents at the foot of Mount Phyle must settle on Attack or Hold before dawn, though one tent may have fallen asleep.',
      m: 'Asynchronous processes must reach deterministic binary consensus despite at most one unannounced crash fault (f = 1).'
    },
    trap: {
      i: 'Without a sandglass, no tent can tell whether a quiet neighbor is dead or merely has a slow rider on the path.',
      m: 'In an asynchronous network, a crashed process is indistinguishable from a process whose messages are arbitrarily delayed.'
    },
    dev: {
      i: 'Start in a poised configuration where both orders are still reachable, and delay whichever rider would tip the camp into certainty.',
      m: 'From an initial bivalent configuration, the scheduler orders commute-free steps to hop from one bivalent state to another forever.'
    },
    res: {
      i: 'No deterministic rule can promise both that the tents never split and that every run finishes when one tent may sleep.',
      m: 'No deterministic consensus protocol can guarantee both safety (agreement + validity) and termination in asynchronous models with f ≥ 1.'
    },
    lim: {
      i: 'Applies only when you demand guaranteed termination on every path without sandglasses, coins, or failure detectors.',
      m: 'Circumvented by partial synchrony (DLS/Paxos), randomization (Ben-Or), or unreliable failure detectors (Chandra-Toueg).'
    },
    q: { i: 'Why can four tents never be sure to finish agreeing if even one may fall silent?', m: 'Why is deterministic consensus impossible in an asynchronous system with a single crash fault?' },
    spreads: [
      { id:'silent', i:'Silent or slow', m:'Indistinguishability' },
      { id:'standings', i:'Poised camp', m:'Bivalence' },
      { id:'defersec', i:'Holding the rider', m:'Adversarial schedule' },
      { id:'change', i:'Three ways out', m:'Circumventing FLP' }
    ]
  },
  {
    n: 5, slug: 'agreeing-when-messages-run-late', place: 'foot', c: '#5f6e28',
    title: 'Agreeing When Messages Run Late',
    cite: 'Dwork, Lynch & Stockmeyer 1988',
    road: ['partial'], fault: ['crash'], ask: ['agree'],
    mapPt: [152, 268],
    tag: { i: 'Never split while winds blow; finish once they calm', m: 'Partial synchrony (GST) & locking majority' },
    sub: {
      i: 'The tents bring back sandglasses—not to guard safety when riders run late, but to finish once the wind dies down.',
      m: 'Decouple safety from timing assumptions so agreement holds under arbitrary delay and liveness holds after Global Stabilization Time.'
    },
    trap: {
      i: 'If two leaders both act when a sandglass runs out during a storm, the camp splits into two orders.',
      m: 'Using timeouts to unilateral commit causes split-brain when network delays temporarily exceed timeout bounds.'
    },
    dev: {
      i: 'Turns rotate; a leader proposes only what the latest locked majority saw, and commits only when a majority answers inside the turn.',
      m: 'Rotating coordinators propose the highest-round locked value from a majority quorum and commit only upon receiving a majority of acks.'
    },
    res: {
      i: 'Majority overlap keeps the camp safe through any gale; once riders arrive on time for one clean turn, the order settles.',
      m: 'Safety holds unconditionally via quorum intersection (N ≥ 2f + 1); liveness holds once message delays stay within bounds after GST.'
    },
    lim: {
      i: 'Needs more than half the tents awake (N ≥ 2f + 1); while the wind keeps shifting, turns can pass without a commit.',
      m: 'Requires a strict majority of non-faulty processes (f < N/2) and cannot guarantee termination before GST.'
    },
    q: { i: 'How can sandglasses help the camp finish without ever splitting it when riders are late?', m: 'How can consensus preserve safety under arbitrary delays while achieving liveness under partial synchrony?' },
    spreads: [
      { id:'windsec', i:'Late riders', m:'Unknown Δ / GST' },
      { id:'turnsec', i:'Rotating turns', m:'Coordinator rotation' },
      { id:'commitsec', i:'Majority lock', m:'Quorum lock rule' },
      { id:'twosec', i:'Why 2f + 1', m:'Majority bound' }
    ]
  },
  {
    n: 6, slug: 'answering-while-cut-off', place: 'foot', c: '#5f6e28',
    title: 'Answering While Cut Off',
    cite: 'Brewer 2000 · Gilbert & Lynch 2002',
    road: ['cut','async'], fault: ['crash'], ask: ['avail','bound'],
    mapPt: [188, 294],
    tag: { i: 'When the gorge splits the road, wait or answer stale', m: 'CAP theorem: linearizability vs. availability' },
    sub: {
      i: 'A rockslide cuts the camp into West and East; one courier writes on the West while a second asks to read on the East.',
      m: 'A network partition severs communication between two nonempty subsets of replicas while clients issue reads and writes to both sides.'
    },
    trap: {
      i: 'East has heard nothing from West; it looks identical whether West updated the plan or stayed quiet.',
      m: 'To the East partition, an execution with a completed write on the West is indistinguishable from one with no write.'
    },
    dev: {
      i: 'Put the two runs side by side: if East answers immediately, it gives the old plan after the new one is already settled.',
      m: 'Construct a partitioned execution G1 (write on West, read on East) matching G2 (read only on East) at all East nodes.'
    },
    res: {
      i: 'While cut off, any service must either make the caller wait for the road to heal or risk returning an outdated answer.',
      m: 'No web service can simultaneously guarantee atomic (linearizable) consistency and total availability across network partitions.'
    },
    lim: {
      i: 'When the road is whole, you do not have to choose—and weaker promises can still answer on both sides of the cut.',
      m: 'Applies specifically to linearizability under partition; causal/eventual consistency and CRDTs/HATs remain available.'
    },
    q: { i: 'What must give when a rockslide cuts the camp in two and callers knock on both sides?', m: 'Why is it impossible to achieve both linearizability and availability during a network partition?' },
    spreads: [
      { id:'cutsec', i:'The gorge cut', m:'Partition model' },
      { id:'mustersec', i:'Two nights', m:'Proof construction' },
      { id:'spansec', i:'Wait or stale', m:'CP vs. AP tradeoff' },
      { id:'notsec', i:'What CAP is not', m:'Scope & nuances' }
    ]
  },
  {
    n: 7, slug: 'agreeing-by-chance', place: 'foot', c: '#5f6e28',
    title: 'Agreeing by Chance',
    cite: 'Ben-Or 1983',
    road: ['async'], fault: ['crash'], ask: ['agree'],
    mapPt: [130, 326],
    tag: { i: 'When no majority forms, toss a bronze coin', m: 'Randomized binary consensus (probability-1 termination)' },
    sub: {
      i: 'If no deterministic rule can break a poised tie, let each tent flip a coin when the tally of second-stage slips is split.',
      m: 'Break the FLP adversarial schedule in asynchronous crash-fault consensus by introducing local random coin tosses.'
    },
    trap: {
      i: 'The adversary can arrange riders so that some tents see a majority for one order while others see only "?" slips.',
      m: 'In Phase 2, some processes may observe a majority for v while others observe only "?" proposals.'
    },
    dev: {
      i: 'If even one tent sees a second-stage majority for v, all tents that adopt a fixed value adopt v; the rest toss a coin.',
      m: 'Two-phase rounds: Phase 1 broadcasts values (requiring > N/2 for a proposal); Phase 2 ratifies (> N/2 decides, ≥ 1 locks v, 0 tosses coin).'
    },
    res: {
      i: 'No two values can both have a majority, so a decided value is locked forever; when all coins match it, everyone finishes in the next round.',
      m: 'Safety is deterministic and unconditional; termination occurs with probability 1 as independent coins eventually align.'
    },
    lim: {
      i: 'Local coins align only by chance (exponentially small when camp is large), though a shared beacon finishes in constant rounds.',
      m: 'Local coins yield O(2^N) expected rounds against a strong adversary; shared cryptographic coins reduce this to O(1) rounds.'
    },
    q: { i: 'How does tossing a bronze coin break the endless tie without ever risking a split?', m: 'How can randomization achieve probability-1 termination in asynchronous consensus without sacrificing deterministic safety?' },
    spreads: [
      { id:'coin', i:'The bronze coin', m:'Randomization' },
      { id:'rounds', i:'Two stages', m:'Two-phase round' },
      { id:'neversec', i:'Never split', m:'Deterministic safety' },
      { id:'prob', i:'Sure in the end', m:'Probabilistic liveness' }
    ]
  },
  {
    n: 8, slug: 'telling-the-dead-from-the-slow', place: 'foot', c: '#5f6e28',
    title: 'Telling the Dead from the Slow',
    cite: 'Chandra & Toueg 1996',
    road: ['async','partial'], fault: ['crash'], ask: ['agree','bound'],
    mapPt: [172, 326],
    tag: { i: 'A watch-slate that may err now, so long as one awake tent is eventually trusted', m: 'Unreliable failure detectors (◊W / ◊S)' },
    sub: {
      i: 'Each tent keeps a slate of suspected sleepers—often wrong at first—and asks how little accuracy is needed to settle.',
      m: 'Equip each process with an unreliable failure detector module and identify the weakest detector class that solves consensus.'
    },
    trap: {
      i: 'If every awake tent keeps suspecting the current leader forever, no turn ever finishes.',
      m: 'Perpetual false suspicions cause every coordinator round to abort before collecting a majority.'
    },
    dev: {
      i: 'Rotate leaders: wait either for the leader\'s proposal or for the leader\'s name to appear on your watch-slate.',
      m: 'Rotating coordinator protocol using ◊S: wait for coordinator proposal or detector suspicion, then carry highest timestamped value forward.'
    },
    res: {
      i: 'Mistakes never cause two orders; once a single awake tent stops being suspected (◊W), its turn locks and finishes the camp.',
      m: 'Safety holds regardless of detector mistakes; eventual weak accuracy (◊W, equivalent to ◊S for f < N/2) suffices for liveness.'
    },
    lim: {
      i: '◊W is the weakest possible slate that works, and still needs more than half the tents awake (N ≥ 2f + 1).',
      m: 'Chandra-Hadzilacos-Toueg theorem: ◊W is the weakest failure detector for consensus with f < N/2.'
    },
    q: { i: 'How many mistakes can a watch-slate make and still let the camp finish agreeing?', m: 'What is the weakest failure detector needed to solve consensus in an asynchronous system?' },
    spreads: [
      { id:'slatesec', i:'The watch-slate', m:'Failure detector' },
      { id:'kindssec', i:'Completeness & accuracy', m:'Detector classes' },
      { id:'turnsec', i:'Rotating with ◊S', m:'◊S consensus' },
      { id:'halfsec', i:'Weakest slate', m:'◊W minimality' }
    ]
  },
  {
    n: 9, slug: 'agreeing-among-liars', place: 'crown', c: '#7a4fa0',
    title: 'Agreeing Among Liars',
    cite: 'Pease, Shostak & Lamport 1980 · Lamport, Shostak & Pease 1982',
    road: ['sync'], fault: ['byz'], ask: ['agree','bound'],
    mapPt: [126, 76],
    tag: { i: 'Three posts with one liar cannot tell who lies; four can', m: 'Byzantine Generals: N ≥ 3f + 1 & f + 1 rounds' },
    sub: {
      i: 'High on the Crown of Mount Phyle, a traitor may send "Attack" to one post and "Hold" to another.',
      m: 'Synchronous processes must agree on a commander\'s order when up to f Byzantine nodes may equivocate.'
    },
    trap: {
      i: 'With three posts and one liar, Post 2 hears "Attack" from 1 and "Hold" from 3—identical whether 1 or 3 is the traitor.',
      m: 'For N = 3, f = 1 with unauthenticated messages, a loyal lieutenant cannot distinguish a faulty commander from a faulty peer.'
    },
    dev: {
      i: 'Use four posts (N ≥ 3f + 1) so honest relays outvote the liar, or use unforgeable wax seals to expose any two-faced order.',
      m: 'Oral Messages OM(f) relays across N ≥ 3f + 1 nodes in f + 1 rounds and takes majority; Signed Messages SM(f) uses cryptographic signatures.'
    },
    res: {
      i: 'Every honest post computes the exact same majority from the relayed reports, whether the chief is honest or a liar.',
      m: 'Satisfies both interactive consistency (all honest nodes agree) and validity (if commander is honest, all decide commander\'s value).'
    },
    lim: {
      i: 'Without seals, N ≤ 3f is impossible; even with seals, synchronous rounds require at least f + 1 steps.',
      m: '3f + 1 lower bound for unauthenticated Byzantine agreement; Fischer-Lynch f + 1 round lower bound.'
    },
    q: { i: 'Why can three posts never unmask a single liar without wax seals, while four can?', m: 'Why does unauthenticated Byzantine agreement require at least 3f + 1 nodes?' },
    spreads: [
      { id:'threesec', i:'Why three fail', m:'3-node impossibility' },
      { id:'fewsec', i:'Four posts (3f+1)', m:'OM(1) with N=4' },
      { id:'sealsec', i:'Wax seals', m:'Signed messages SM(m)' },
      { id:'halvesec', i:'Why 3f + 1', m:'General bound' }
    ]
  },
  {
    n: 10, slug: 'keeping-order-among-liars', place: 'crown', c: '#7a4fa0',
    title: 'Keeping Order Among Liars',
    cite: 'Castro & Liskov 1999',
    road: ['partial'], fault: ['byz'], ask: ['agree','order'],
    mapPt: [164, 58],
    tag: { i: 'Two rounds of 2f+1 matching certificates across 3f+1 posts', m: 'PBFT: pre-prepare, prepare, commit & view change' },
    sub: {
      i: 'Four posts keep a shared scroll of slots without relying on synchronous rounds, while one post may lie and riders may lag.',
      m: 'Practical Byzantine Fault Tolerant state-machine replication (PBFT) under partial synchrony with N = 3f + 1.'
    },
    trap: {
      i: 'With 3f + 1 posts and f sleeping, you can wait for only 2f + 1 slips—and two groups of 2f + 1 overlap in 1f + 1, which includes only one honest post.',
      m: 'In N = 3f + 1, any two quorums of size 2f + 1 intersect in at least f + 1 nodes, guaranteeing at least 1 honest node in the intersection.'
    },
    dev: {
      i: 'First gather 2f + 1 Prepare slips to bar a split inside the view; then gather 2f + 1 Commit slips so that one honest post carries the certificate into any new view.',
      m: 'Three-phase normal case: Pre-Prepare assigns sequence number, Prepare (2f+1) ensures within-view uniqueness, Commit (2f+1) ensures cross-view persistence.'
    },
    res: {
      i: 'No two honest posts ever settle different entries in a slot, even if the chief lies and the view changes mid-flight.',
      m: 'Provides linearizable Byzantine state-machine replication with safety in asynchrony and liveness after GST.'
    },
    lim: {
      i: 'Every post talks to every other post (N² slips per slot), and changing leaders carries heavy bundles of certificates.',
      m: 'All-to-all communication costs O(N²) messages normal-case and O(N³) on view changes.'
    },
    q: { i: 'Why must posts among liars exchange two rounds of 2f + 1 certificates instead of one?', m: 'How does PBFT maintain linearizable state-machine replication with Byzantine faults and asynchronous delays?' },
    spreads: [
      { id:'echoes', i:'2f + 1 intersection', m:'Byzantine quorum' },
      { id:'sealsec', i:'Prepare vs Commit', m:'Three-phase pipeline' },
      { id:'changesec', i:'Changing the chief', m:'View-change protocol' },
      { id:'settlesec', i:'f + 1 to the caller', m:'Client reply quorum' }
    ]
  },
  {
    n: 11, slug: 'changing-leaders-among-liars', place: 'crown', c: '#7a4fa0',
    title: 'Changing Leaders Among Liars',
    cite: 'Yin et al. 2019',
    road: ['partial'], fault: ['byz'], ask: ['agree','order'],
    mapPt: [200, 82],
    tag: { i: 'Every vote goes through the chief; three links lock and settle a chain', m: 'HotStuff: linear O(N) view change & three-chain commit' },
    sub: {
      i: 'Replace the all-to-all storm of slips with a single combined seal through the chief and a uniform chain of three stages.',
      m: 'Reduce Byzantine consensus communication to linear O(N) per view—including view changes—via threshold signatures and a three-phase chain.'
    },
    trap: {
      i: 'With a two-stage rule, a new chief cannot switch at the speed of the fastest riders without risking a hidden lock.',
      m: 'Two-phase BFT protocols face a safety/liveness dilemma on view change unless they wait for maximum network delay or broadcast O(N²) proofs.'
    },
    dev: {
      i: 'Posts send votes only to the chief, who combines 2f + 1 into one compact Quorum Certificate (QC); three chained QCs (Prepare, Pre-Commit, Commit) settle a block.',
      m: 'Star topology with threshold/aggregate QCs and a uniform three-chain rule (grandparent commits when grandchild gets a QC).'
    },
    res: {
      i: 'A new chief need only pick the highest QC it hears from 2f + 1 posts—making a leader change as cheap as a normal step.',
      m: 'Achieves O(N) message complexity for both normal operation and view changes, plus optimistic responsiveness.'
    },
    lim: {
      i: 'Adds one extra hop of latency before a block settles unless the three stages are pipelined down a chain.',
      m: 'Requires three rounds of QCs per decision (mitigated by pipelining every phase into a single chained block header).'
    },
    q: { i: 'How can posts change a lying chief with only a handful of slips instead of a storm?', m: 'How does HotStuff achieve linear O(N) view changes and optimistic responsiveness in Byzantine consensus?' },
    spreads: [
      { id:'cost', i:'The N² storm', m:'Quadratic bottleneck' },
      { id:'votes', i:'Combined seal (QC)', m:'Threshold QC' },
      { id:'stages', i:'Why three stages', m:'Three-chain safety' },
      { id:'chain', i:'Pipelined chain', m:'Chained HotStuff' }
    ]
  },
  {
    n: 12, slug: 'the-part-time-parliament', place: 'chamber', c: '#136f9e',
    title: 'The Part-Time Parliament',
    cite: 'Lamport 1998 · Lamport 2001',
    road: ['partial','async'], fault: ['crash'], ask: ['agree','order'],
    mapPt: [406, 152],
    tag: { i: 'Numbered ballots, promises not to look back, and majority overlap', m: 'Paxos: Phase 1a/1b (Prepare) & Phase 2a/2b (Accept)' },
    sub: {
      i: 'Part-time priests wander in and out of the Chamber on Paxos, yet every numbered decree in the ledger must be permanent.',
      m: 'Proposers, acceptors, and learners reach consensus on a sequence of decrees despite crashes, message loss, and arbitrary delays.'
    },
    trap: {
      i: 'If a newly arrived president proposes a fresh decree without asking what earlier ballots already passed, two decrees could pass.',
      m: 'Without constraining new ballot values by prior acceptances, concurrent proposers can get different values chosen by different majorities.'
    },
    dev: {
      i: 'Phase 1: ask a majority to promise no smaller ballot and report their highest accepted ballot. Phase 2: propose the highest reported decree to a majority.',
      m: 'Prepare(b) collects promises + highest-numbered accepted (b_max, v_max) from a majority; Accept(b, v) proposes v_max (or a new value if none).'
    },
    res: {
      i: 'Because any two majorities share at least one priest, once a decree passes in ballot b, every higher ballot is forced to propose that same decree.',
      m: 'Invariant P2c ensures that any value chosen at ballot b is preserved by all proposals at ballots b\' > b.'
    },
    lim: {
      i: 'Two dueling presidents can keep outbidding each other\'s promises until one stable president leads for a full round.',
      m: 'Dueling proposers can livelock Phase 1/Phase 2; Multi-Paxos elects a stable distinguished leader to amortize Phase 1.'
    },
    q: { i: 'How can a Chamber of wandering priests pass one irrevocable law per slot?', m: 'How does Paxos guarantee safety across asynchronous ballots and achieve efficient state-machine replication?' },
    spreads: [
      { id:'majorities', i:'Majority overlap', m:'Quorum intersection' },
      { id:'synod', i:'Two phases', m:'Prepare & Accept' },
      { id:'ballot', i:'Highest ballot rule', m:'Invariant P2c' },
      { id:'parliament', i:'One leader for many decrees', m:'Multi-Paxos' }
    ]
  },
  {
    n: 13, slug: 'one-leader-at-a-time', place: 'tholos', c: '#c8961c',
    title: 'One Leader at a Time',
    cite: 'Oki & Liskov 1988',
    road: ['partial'], fault: ['crash'], ask: ['agree','order'],
    mapPt: [495, 132],
    tag: { i: 'One speaker at the podium; view change carries the longest log forward', m: 'Viewstamped Replication: primary-backup & view change' },
    sub: {
      i: 'In the round Tholos of Schedia, one speaker holds the podium for a numbered view while witnesses record every step in order.',
      m: 'Primary-backup state-machine replication where a designated primary orders operations within a numbered view.'
    },
    trap: {
      i: 'If a cut-off speaker keeps giving answers from the porch while a new view has already opened inside, callers see a false history.',
      m: 'A deposed primary in an old view can serve stale reads or accept split writes unless view transitions fence old primaries.'
    },
    dev: {
      i: 'During a view, the speaker logs each step to a majority. To change views, a majority seals the old view and hands the most up-to-date log to the new speaker.',
      m: 'Normal operations replicate to f + 1 backups; View Change collects DoViewChange from a majority and installs the log with highest (last-normal-view, op-number).'
    },
    res: {
      i: 'Normal steps take a single round-trip to the witnesses, and every committed entry survives into every later view—even across wiped wax tablets.',
      m: 'One-round-trip normal-case replication with majority-intersection view changes and state recovery without disk persistence.'
    },
    lim: {
      i: 'Even a read must check with a majority (or a valid lease), and the Tholos stalls whenever fewer than half the seats are reachable.',
      m: 'Linearizable reads require primary quorum verification or synchronized leases; unavailable in minority partitions.'
    },
    q: { i: 'How does a council run at full speed under one speaker and hand over the podium cleanly when they stall?', m: 'How does Viewstamped Replication combine fast primary-backup ordering with safe majority view changes?' },
    spreads: [
      { id:'podium', i:'The podium', m:'Primary normal case' },
      { id:'takes', i:'Changing the view', m:'View-change protocol' },
      { id:'porch', i:'The stale speaker', m:'Stale primary read' },
      { id:'wax', i:'Wiped tablets', m:'Recovery protocol' }
    ]
  },
  {
    n: 14, slug: 'spreading-by-word-of-mouth', place: 'coast', c: '#2a7b6f',
    title: 'Spreading by Word of Mouth',
    cite: 'Demers et al. 1987',
    road: ['async','cut'], fault: ['crash'], ask: ['avail'],
    mapPt: [435, 315],
    tag: { i: 'Rumors spread fast; nightly tablet comparisons catch the last stragglers', m: 'Epidemic protocols: rumor mongering + anti-entropy' },
    sub: {
      i: 'Thirty home libraries along the Scholars\' Coast trade additions and death notices by picking random neighbors.',
      m: 'Eventually consistent replicas propagate updates across arbitrary topologies via randomized epidemic gossip.'
    },
    trap: {
      i: 'Direct mail misses houses that were asleep; hot rumors spread quickly at first, then cool off before reaching the last few libraries.',
      m: 'Best-effort broadcast drops messages on faults; pure rumor mongering leaves an exponentially small fraction exp(-k) of uninformed nodes.'
    },
    dev: {
      i: 'Pair hot rumor mongering (pushing fresh news to random peers) with calm anti-entropy (comparing whole tablet checksums) and tombstones for deletions.',
      m: 'Combine push/pull rumor mongering for O(log N) dissemination with background anti-entropy (checksum/Merkle diff) and death certificates (tombstones).'
    },
    res: {
      i: 'News reaches nearly everyone in a handful of rounds, anti-entropy guarantees zero stragglers, and deleted entries never rise from the dead.',
      m: 'Achieves high-probability O(log N) convergence with 100% eventual completeness and resurrection-free deletion.'
    },
    lim: {
      i: 'Wait-free and resilient to any cut, but two readers at the same moment may see different shelves until the gossip settles.',
      m: 'Provides eventual consistency only; concurrent readers can observe divergent states and stale values before convergence.'
    },
    q: { i: 'How can thirty libraries come to hold the exact same catalogue without a central clerk?', m: 'How do epidemic gossip protocols guarantee eventual convergence across unreliable networks?' },
    spreads: [
      { id:'word', i:'Hot rumors', m:'Rumor mongering' },
      { id:'asking', i:'Push vs Pull', m:'Quadratic pull speedup' },
      { id:'sums', i:'Anti-entropy', m:'Checksum reconciliation' },
      { id:'withdraw', i:'Death notices', m:'Tombstones' }
    ]
  },
  {
    n: 15, slug: 'probably-up-to-date', place: 'coast', c: '#2a7b6f',
    title: 'Probably Up to Date',
    cite: 'Bailis et al. 2012',
    road: ['async'], fault: ['crash'], ask: ['avail'],
    mapPt: [488, 295],
    tag: { i: 'When W + R ≤ N, count the odds after k rounds or t moments', m: 'Probabilistically Bounded Staleness (PBS): (k, Δ)-semantics' },
    sub: {
      i: 'Three archive keepers let callers write to W and read from R without waiting for a full majority—then measure how often the answer is already fresh.',
      m: 'Quantify the probability of observing fresh data in partial-quorum systems (W + R ≤ N) as a function of version lag k and time lag t.'
    },
    trap: {
      i: 'Strict quorums (W + R > N) guarantee overlap on every call, but force every caller to wait for the slower keepers.',
      m: 'Strict quorum intersection (W + R > N) guarantees linearizable overlap but incurs higher tail latency and reduced availability.'
    },
    dev: {
      i: 'Even when W + R ≤ N, random keeper choices often overlap immediately—and once anti-entropy runs or the write wave lands, the miss chance drops near zero.',
      m: 'Compute hypergeometric quorum-overlap probabilities and compose Write-All-Respond-W with Read-R latency distributions (WARS).'
    },
    res: {
      i: 'Instead of a binary "consistent or not", keepers can promise that a read is within k versions after t milliseconds 99.9% of the time.',
      m: 'Yields closed-form and Monte Carlo (k, Δ)-regular semantics trading tunable latency against bounded staleness probability.'
    },
    lim: {
      i: 'A small chance of a stale read remains whenever W + R ≤ N and the caller asks before the background copies arrive.',
      m: 'Probabilistic guarantee only: cannot enforce zero-staleness invariants when W + R ≤ N.'
    },
    q: { i: 'If your write and read groups do not have to overlap, how often do they share the latest scroll anyway?', m: 'How Fresh are eventual-consistency reads when using partial quorums (W + R ≤ N)?' },
    spreads: [
      { id:'wait', i:'Strict vs partial', m:'W + R > N vs W + R ≤ N' },
      { id:'miss', i:'Chance of overlap', m:'Combinatorial overlap' },
      { id:'behind', i:'k versions behind', m:'k-staleness' },
      { id:'legs', i:'Four legs of flight', m:'WARS latency model' }
    ]
  },
  {
    n: 16, slug: 'changes-that-never-clash', place: 'coast', c: '#2a7b6f',
    title: 'Changes That Never Clash',
    cite: 'Shapiro et al. 2011',
    road: ['async','cut'], fault: ['crash'], ask: ['avail'],
    mapPt: [542, 315],
    tag: { i: 'Merge by least upper bound: commutative steps and join-semilattices', m: 'State-based (CvRDT) & op-based (CmRDT) CRDTs' },
    sub: {
      i: 'Three coastal libraries update census tablets, counters and shelves while cut off, yet merge into one state without ever rolling back.',
      m: 'Conflict-Free Replicated Data Types (CRDTs) guarantee strong eventual consistency without synchronization.'
    },
    trap: {
      i: 'Adding to a single shared number and copying the total overwrites concurrent additions; adding and removing the same scroll in parallel leaves shelves disagreed.',
      m: 'Naive state overwrite loses concurrent increments; concurrent add(x) and remove(x) on plain sets fail to commute.'
    },
    dev: {
      i: 'Give each library its own counter slot (P- and N-vectors) and tag each added scroll with a unique token so remove only crosses out tokens it has already seen.',
      m: 'Structure state as a join-semilattice with merge = LUB (⊔) that is associative, commutative, and idempotent (PN-Counter, Observed-Remove Set).'
    },
    res: {
      i: 'Any two libraries that have received the same set of updates—in any order, even duplicated—hold the exact same tablet immediately.',
      m: 'Strong Eventual Consistency (SEC): replicas that have delivered the same update set are in identical states with zero coordination.'
    },
    lim: {
      i: 'Every update must be able to merge without saying "no"; rules that forbid two houses from taking the last coin cannot be written this way.',
      m: 'Cannot enforce non-monotonic integrity constraints (e.g., non-negative shared account balance or unique naming) without coordination.'
    },
    q: { i: 'How can separated libraries accept every change immediately and still merge without a single clash?', m: 'What algebraic properties allow replicated data structures to converge automatically without coordination?' },
    spreads: [
      { id:'column', i:'Per-house slots', m:'G-Counter & PN-Counter' },
      { id:'ways', i:'Lattice rules', m:'Join-semilattice (LUB)' },
      { id:'titles', i:'Add vs withdraw', m:'Observed-Remove Set' },
      { id:'nots', i:'What cannot merge', m:'Non-monotonic limits' }
    ]
  },
  {
    n: 17, slug: 'what-you-can-promise-alone', place: 'coast', c: '#2a7b6f',
    title: 'What You Can Promise Alone',
    cite: 'Bailis et al. 2014',
    road: ['async','cut'], fault: ['crash'], ask: ['avail','bound'],
    mapPt: [488, 355],
    tag: { i: 'Group updates into sealed bundles; see all of a bundle or none', m: 'Highly Available Transactions (HATs): Read Committed, MAV, Causal+' },
    sub: {
      i: 'When a visitor updates several shelves in one visit, which multi-step promises can a cut-off library still keep on its own?',
      m: 'Characterize exactly which transactional isolation and consistency guarantees are achievable with High Availability (HATs).'
    },
    trap: {
      i: 'Half-written visits leak partial changes; trying to stop two cut-off callers from claiming the same unique title forces one to wait.',
      m: 'Unbundled writes expose dirty/fractured reads; preventing write-skew or lost updates across partitions requires blocking coordination.'
    },
    dev: {
      i: 'Stamp each visit as an atomic bundle and only reveal a bundle once every prior bundle the writer saw is also on the shelf.',
      m: 'Enforce Read Committed, Monotonic Atomic View (MAV), and Causal+ consistency via version-stamped atomic write sets and dependency tracking.'
    },
    res: {
      i: 'Callers never see an unsealed draft, never lose a bundle they already saw, and see every cause before its effect—even when the coast is cut in pieces.',
      m: 'Read Committed, Repeatable Read / MAV, and Causal+ transactions are achievable with 100% availability and low latency.'
    },
    lim: {
      i: 'No cut-off library can promise Serializability, Snapshot Isolation, or Read-Your-Own-Writes across different libraries without waiting.',
      m: 'Serializability, Snapshot Isolation, and recency/uniqueness invariants are provably impossible in Highly Available systems.'
    },
    q: { i: 'Which multi-shelf promises can a library keep while cut off, and which ones cross the line?', m: 'Which ACID transaction isolation levels can be achieved without sacrificing high availability during partitions?' },
    spreads: [
      { id:'half', i:'No half-visits', m:'Read Committed & MAV' },
      { id:'cord', i:'Cause before effect', m:'Causal+ bundles' },
      { id:'twice', i:'Two claims clash', m:'Uniqueness impossibility' },
      { id:'last', i:'The dividing line', m:'HATs taxonomy' }
    ]
  },
  {
    n: 18, slug: 'knowing-when-to-wait', place: 'doors', c: '#8a5a36',
    title: 'Knowing When to Wait',
    cite: 'Hellerstein 2010 · Ameloot, Neven & Van den Bussche 2011 · Hellerstein & Alvaro 2020',
    road: ['async','cut'], fault: ['crash'], ask: ['avail','bound'],
    mapPt: [565, 205],
    tag: { i: 'The Fast Door for answers that only grow; the Waiting Door for absence', m: 'CALM Theorem: Consistency As Logical Monotonicity' },
    sub: {
      i: 'In the Hall of Two Doors above Paxos, every question from all eighteen books is sorted into one of two doorways.',
      m: 'The CALM theorem proves that a program has a coordination-free, eventually consistent implementation if and only if it is logically monotonic.'
    },
    trap: {
      i: 'If an answer depends on what has NOT arrived ("no one objected", "nothing smaller is in flight"), a late rider can overturn a premature "yes".',
      m: 'Non-monotonic queries (negation, aggregation, universal quantification) can be invalidated by additional facts, requiring a coordination barrier.'
    },
    dev: {
      i: 'Separate monotonic steps (where new facts only add to the output) from non-monotonic steps (which must seal the input set before answering).',
      m: 'Compile monotonic Datalog/relational pipelines to run coordination-free, inserting consensus/snapshot barriers only at non-monotonic edges.'
    },
    res: {
      i: 'Questions that only grow pass straight through the Fast Door; only questions that ask about absence must pause at the Waiting Door.',
      m: 'Logical monotonicity is both necessary and sufficient for coordination-free distributed consistency (Ameloot et al. 2011).'
    },
    lim: {
      i: 'No clever trick can slip a question of absence through the Fast Door—to know nothing else is coming, you must coordinate.',
      m: 'Any non-monotonic specification provably requires coordination (consensus, quorums, or snapshots) to seal a domain.'
    },
    q: { i: 'Which questions can be answered as messages trickle in, and which ones must wait until all are heard?', m: 'What is the exact logical boundary between computations that require coordination and those that do not?' },
    spreads: [
      { id:'doors', i:'The Two Doors', m:'Fast vs. Waiting Door' },
      { id:'grow', i:'Answers that only grow', m:'Monotonicity' },
      { id:'absence', i:'Questions of absence', m:'Non-monotonicity & negation' },
      { id:'law', i:'The CALM law', m:'CALM equivalence' }
    ]
  }
];

/* ============================================================
   Mini-Glyphs for the 18 Stones (compact visual emblems)
   ============================================================ */
function stoneGlyphSVG(n, c){
  const ink = '#1c1512';
  switch(n){
    case 1: return `<svg class="stone-glyph" viewBox="0 0 120 44" aria-hidden="true">
      <line x1="14" y1="12" x2="106" y2="12" stroke="${ink}" stroke-width="1.8"/>
      <line x1="14" y1="24" x2="106" y2="24" stroke="${ink}" stroke-width="1.8"/>
      <line x1="14" y1="36" x2="106" y2="36" stroke="${ink}" stroke-width="1.8"/>
      <path d="M28 12 L58 24 L88 36" fill="none" stroke="${c}" stroke-width="2.4"/>
      <circle cx="28" cy="12" r="4" fill="#9cb648" stroke="${ink}" stroke-width="1.5"/>
      <circle cx="58" cy="24" r="4" fill="#e0b84a" stroke="${ink}" stroke-width="1.5"/>
      <circle cx="88" cy="36" r="4" fill="#5b9be0" stroke="${ink}" stroke-width="1.5"/>
    </svg>`;
    case 2: return `<svg class="stone-glyph" viewBox="0 0 120 44" aria-hidden="true">
      <line x1="18" y1="14" x2="74" y2="14" stroke="${ink}" stroke-width="3"/>
      <line x1="46" y1="30" x2="102" y2="30" stroke="${ink}" stroke-width="3"/>
      <line x1="54" y1="6" x2="54" y2="38" stroke="#bf4a26" stroke-width="2" stroke-dasharray="3 2"/>
      <circle cx="54" cy="14" r="4.5" fill="#e0b84a" stroke="${ink}" stroke-width="1.8"/>
      <circle cx="66" cy="30" r="4.5" fill="#9cb648" stroke="${ink}" stroke-width="1.8"/>
    </svg>`;
    case 3: return `<svg class="stone-glyph" viewBox="0 0 120 44" aria-hidden="true">
      <rect x="14" y="12" width="18" height="20" fill="#9cb648" stroke="${ink}" stroke-width="1.8"/>
      <rect x="88" y="12" width="18" height="20" fill="#5b9be0" stroke="${ink}" stroke-width="1.8"/>
      <line x1="32" y1="22" x2="88" y2="22" stroke="${ink}" stroke-width="1.8"/>
      <path d="M58 6 Q64 22 54 38" fill="none" stroke="#bf4a26" stroke-width="2.8" stroke-dasharray="4 2"/>
      <circle cx="46" cy="22" r="4" fill="#e0b84a" stroke="${ink}" stroke-width="1.5"/>
    </svg>`;
    case 4: return `<svg class="stone-glyph" viewBox="0 0 120 44" aria-hidden="true">
      <path d="M60 8 L32 34 M60 8 L88 34" stroke="${ink}" stroke-width="2.2"/>
      <circle cx="60" cy="10" r="6" fill="#e0b84a" stroke="${ink}" stroke-width="1.8"/>
      <circle cx="32" cy="34" r="5" fill="#5f6e28" stroke="${ink}" stroke-width="1.8"/>
      <circle cx="88" cy="34" r="5" fill="#bf4a26" stroke="${ink}" stroke-width="1.8"/>
    </svg>`;
    case 5: return `<svg class="stone-glyph" viewBox="0 0 120 44" aria-hidden="true">
      <path d="M10 24 Q24 10 38 24 T64 24" fill="none" stroke="#bf4a26" stroke-width="2"/>
      <line x1="66" y1="6" x2="66" y2="38" stroke="${ink}" stroke-width="2" stroke-dasharray="3 2"/>
      <line x1="68" y1="24" x2="110" y2="24" stroke="#5f6e28" stroke-width="3"/>
      <circle cx="94" cy="24" r="5" fill="#9cb648" stroke="${ink}" stroke-width="1.8"/>
    </svg>`;
    case 6: return `<svg class="stone-glyph" viewBox="0 0 120 44" aria-hidden="true">
      <circle cx="28" cy="22" r="8" fill="#e0b84a" stroke="${ink}" stroke-width="2"/>
      <circle cx="92" cy="22" r="8" fill="#6583d6" stroke="${ink}" stroke-width="2"/>
      <line x1="38" y1="22" x2="82" y2="22" stroke="${ink}" stroke-width="1.8" stroke-dasharray="3 3"/>
      <path d="M55 10 L65 34 M65 10 L55 34" stroke="#bf4a26" stroke-width="3"/>
    </svg>`;
    case 7: return `<svg class="stone-glyph" viewBox="0 0 120 44" aria-hidden="true">
      <circle cx="60" cy="22" r="14" fill="#e0b84a" stroke="${ink}" stroke-width="2.2"/>
      <circle cx="60" cy="22" r="10" fill="none" stroke="${ink}" stroke-width="1.2" stroke-dasharray="2 2"/>
      <text x="60" y="26" text-anchor="middle" font-size="12" font-weight="700" fill="${ink}">½</text>
    </svg>`;
    case 8: return `<svg class="stone-glyph" viewBox="0 0 120 44" aria-hidden="true">
      <rect x="28" y="8" width="64" height="28" rx="3" fill="#fffaf0" stroke="${ink}" stroke-width="2"/>
      <text x="46" y="26" text-anchor="middle" font-size="11" font-weight="700" fill="#bf4a26">T1?</text>
      <line x1="62" y1="12" x2="62" y2="32" stroke="${ink}" stroke-width="1.5"/>
      <text x="77" y="26" text-anchor="middle" font-size="11" font-weight="700" fill="#5f6e28">◊W</text>
    </svg>`;
    case 9: return `<svg class="stone-glyph" viewBox="0 0 120 44" aria-hidden="true">
      <circle cx="60" cy="10" r="6" fill="#a57fc0" stroke="${ink}" stroke-width="1.8"/>
      <circle cx="26" cy="34" r="5" fill="#9aa0a8" stroke="${ink}" stroke-width="1.8"/>
      <circle cx="60" cy="34" r="5" fill="#e8964d" stroke="${ink}" stroke-width="1.8"/>
      <circle cx="94" cy="34" r="5" fill="#b07a55" stroke="${ink}" stroke-width="1.8"/>
      <line x1="55" y1="14" x2="30" y2="30" stroke="#3f7a2a" stroke-width="2"/>
      <line x1="65" y1="14" x2="90" y2="30" stroke="#bf4a26" stroke-width="2" stroke-dasharray="3 2"/>
    </svg>`;
    case 10: return `<svg class="stone-glyph" viewBox="0 0 120 44" aria-hidden="true">
      <rect x="14" y="13" width="24" height="18" fill="#e9dcb6" stroke="${ink}" stroke-width="1.8"/>
      <rect x="48" y="13" width="24" height="18" fill="#e0b84a" stroke="${ink}" stroke-width="1.8"/>
      <rect x="82" y="13" width="24" height="18" fill="#9cb648" stroke="${ink}" stroke-width="1.8"/>
      <line x1="38" y1="22" x2="48" y2="22" stroke="${ink}" stroke-width="2"/>
      <line x1="72" y1="22" x2="82" y2="22" stroke="${ink}" stroke-width="2"/>
    </svg>`;
    case 11: return `<svg class="stone-glyph" viewBox="0 0 120 44" aria-hidden="true">
      <rect x="14" y="14" width="22" height="16" rx="2" fill="#d9c6ec" stroke="${ink}" stroke-width="1.8"/>
      <rect x="49" y="14" width="22" height="16" rx="2" fill="#b898dc" stroke="${ink}" stroke-width="1.8"/>
      <rect x="84" y="14" width="22" height="16" rx="2" fill="#7a4fa0" stroke="${ink}" stroke-width="1.8"/>
      <path d="M36 22 H49 M71 22 H84" stroke="${ink}" stroke-width="2.4"/>
    </svg>`;
    case 12: return `<svg class="stone-glyph" viewBox="0 0 120 44" aria-hidden="true">
      <ellipse cx="48" cy="22" rx="28" ry="13" fill="#2e88b5" fill-opacity=".22" stroke="#136f9e" stroke-width="2"/>
      <ellipse cx="72" cy="22" rx="28" ry="13" fill="#e0b84a" fill-opacity=".28" stroke="#b5602c" stroke-width="2"/>
      <circle cx="60" cy="22" r="5" fill="#e0b84a" stroke="${ink}" stroke-width="2"/>
    </svg>`;
    case 13: return `<svg class="stone-glyph" viewBox="0 0 120 44" aria-hidden="true">
      <circle cx="60" cy="22" r="16" fill="none" stroke="#c8961c" stroke-width="2.2" stroke-dasharray="3 2"/>
      <circle cx="60" cy="8" r="5.5" fill="#e8b03a" stroke="${ink}" stroke-width="1.8"/>
      <circle cx="44" cy="28" r="4.5" fill="#8fa3b8" stroke="${ink}" stroke-width="1.5"/>
      <circle cx="76" cy="28" r="4.5" fill="#8fb35a" stroke="${ink}" stroke-width="1.5"/>
    </svg>`;
    case 14: return `<svg class="stone-glyph" viewBox="0 0 120 44" aria-hidden="true">
      <circle cx="24" cy="22" r="5" fill="#2a7b6f" stroke="${ink}" stroke-width="1.6"/>
      <circle cx="54" cy="12" r="5" fill="#2a7b6f" stroke="${ink}" stroke-width="1.6"/>
      <circle cx="54" cy="32" r="5" fill="#2a7b6f" stroke="${ink}" stroke-width="1.6"/>
      <circle cx="88" cy="10" r="4.5" fill="#e0b84a" stroke="${ink}" stroke-width="1.5"/>
      <circle cx="88" cy="22" r="4.5" fill="#e0b84a" stroke="${ink}" stroke-width="1.5"/>
      <circle cx="88" cy="34" r="4.5" fill="#fffaf0" stroke="${ink}" stroke-width="1.5"/>
      <path d="M29 20 L49 13 M29 24 L49 31 M59 12 L83 10 M59 14 L83 21 M59 32 L83 23" stroke="${ink}" stroke-width="1.4"/>
    </svg>`;
    case 15: return `<svg class="stone-glyph" viewBox="0 0 120 44" aria-hidden="true">
      <rect x="20" y="26" width="14" height="12" fill="#e0b84a" stroke="${ink}" stroke-width="1.5"/>
      <rect x="42" y="18" width="14" height="20" fill="#8fb35a" stroke="${ink}" stroke-width="1.5"/>
      <rect x="64" y="11" width="14" height="27" fill="#2a7b6f" stroke="${ink}" stroke-width="1.5"/>
      <rect x="86" y="7" width="14" height="31" fill="#136f9e" stroke="${ink}" stroke-width="1.5"/>
    </svg>`;
    case 16: return `<svg class="stone-glyph" viewBox="0 0 120 44" aria-hidden="true">
      <path d="M36 22 L60 9 L84 22 L60 35 Z" fill="none" stroke="${ink}" stroke-width="2"/>
      <circle cx="60" cy="9" r="5" fill="#2a7b6f" stroke="${ink}" stroke-width="1.6"/>
      <circle cx="36" cy="22" r="4.5" fill="#e0b84a" stroke="${ink}" stroke-width="1.5"/>
      <circle cx="84" cy="22" r="4.5" fill="#5b9be0" stroke="${ink}" stroke-width="1.5"/>
      <circle cx="60" cy="35" r="4" fill="#fffaf0" stroke="${ink}" stroke-width="1.5"/>
    </svg>`;
    case 17: return `<svg class="stone-glyph" viewBox="0 0 120 44" aria-hidden="true">
      <rect x="28" y="9" width="64" height="26" rx="4" fill="#eef4d3" stroke="${ink}" stroke-width="2"/>
      <circle cx="44" cy="22" r="5" fill="#2a7b6f" stroke="${ink}" stroke-width="1.5"/>
      <circle cx="60" cy="22" r="5" fill="#e0b84a" stroke="${ink}" stroke-width="1.5"/>
      <circle cx="76" cy="22" r="5" fill="#5b9be0" stroke="${ink}" stroke-width="1.5"/>
    </svg>`;
    case 18: default: return `<svg class="stone-glyph" viewBox="0 0 120 44" aria-hidden="true">
      <path d="M26 38 V18 A12 12 0 0 1 50 18 V38 Z" fill="#eef4d3" stroke="${ink}" stroke-width="2"/>
      <path d="M70 38 V18 A12 12 0 0 1 94 18 V38 Z" fill="#fbe7de" stroke="${ink}" stroke-width="2"/>
      <line x1="70" y1="26" x2="94" y2="26" stroke="#bf4a26" stroke-width="2.5"/>
    </svg>`;
  }
}

/* ============================================================
   Filtering & Switchboard Logic
   ============================================================ */
function bookMatches(b){
  if(activePlace !== 'all' && b.place !== activePlace) return false;
  if(activeRoad !== 'all' && !b.road.includes(activeRoad)) return false;
  if(activeFault !== 'all' && !b.fault.includes(activeFault)) return false;
  if(activeAsk !== 'all' && !b.ask.includes(activeAsk)) return false;
  return true;
}

function buildSwitchboard(){
  // Top place pills
  const pp = $('place-pills');
  let h = `<button type="button" class="ppill" data-place="all" aria-pressed="${activePlace==='all'}"><i></i><span>${reg==='i'?'All 7 settings':'All 7 models'}</span></button>`;
  for(const p of PLACES){
    h += `<button type="button" class="ppill" data-place="${p.id}" style="--c:${p.c}" aria-pressed="${activePlace===p.id}"><i></i><span>${p.short[reg]}</span></button>`;
  }
  pp.innerHTML = h;
  pp.querySelectorAll('.ppill').forEach(btn => {
    btn.addEventListener('click', () => {
      activePlace = btn.dataset.place;
      syncAll();
    });
  });

  // Switchboard rows
  const bindRow = (elId, list, curVal, setter) => {
    const el = $(elId);
    el.innerHTML = list.map(item =>
      `<button type="button" class="chip" data-id="${item.id}" aria-pressed="${curVal===item.id}">${item[reg]}</button>`
    ).join('');
    el.querySelectorAll('.chip').forEach(btn => {
      btn.addEventListener('click', () => {
        setter(btn.dataset.id);
        syncAll();
      });
    });
  };
  bindRow('f-road', FILTERS.road, activeRoad, v => { activeRoad = v; });
  bindRow('f-fault', FILTERS.fault, activeFault, v => { activeFault = v; });
  bindRow('f-ask', FILTERS.ask, activeAsk, v => { activeAsk = v; });
}

function renderStonesAndMap(){
  const matched = BOOKS.filter(bookMatches);
  $('stat-match').textContent = matched.length;
  $('stat-match-lbl').textContent = reg === 'i' ? 'books matching' : 'protocols matching';
  $('stat-set-lbl').textContent = reg === 'i' ? 'settings on 2 islands' : 'system models';
  $('stat-pap-lbl').textContent = reg === 'i' ? 'landmark papers' : 'foundational papers';

  const anyFilter = activePlace !== 'all' || activeRoad !== 'all' || activeFault !== 'all' || activeAsk !== 'all';
  $('sb-reset').hidden = !anyFilter;
  if(!anyFilter){
    $('sb-verdict').textContent = reg === 'i'
      ? 'Showing all eighteen books across Arche and Paxos.'
      : 'Showing all eighteen protocols and impossibility results.';
  } else if(matched.length === 0){
    $('sb-verdict').textContent = reg === 'i'
      ? 'No single book matches that exact combination—click "Show all 18" or relax one condition.'
      : 'No single book matches that exact intersection of assumptions—relax one filter.';
  } else {
    $('sb-verdict').textContent = reg === 'i'
      ? `${matched.length} of 18 books match (${matched.map(b => '#' + b.n).join(', ')}).`
      : `${matched.length} of 18 books match (${matched.map(b => '#' + b.n).join(', ')}).`;
  }

  // Render 18 stones
  const grid = $('stones-grid');
  grid.innerHTML = BOOKS.map((b, idx) => {
    const isMatch = bookMatches(b);
    const isCur = idx === curBookIdx;
    const pl = PLACE_MAP[b.place];
    return `<button type="button" class="stone${isCur?' active':''}${isMatch?'':' dim'}" data-idx="${idx}" style="--c:${b.c}">
      <span class="stone-top"><span>${pl.short[reg]}</span><span class="stone-num">#${b.n}</span></span>
      ${stoneGlyphSVG(b.n, b.c)}
      <span class="stone-title">${b.title}</span>
      <span class="stone-tag">${b.tag[reg]}</span>
      <span class="stone-cite">${b.cite}</span>
    </button>`;
  }).join('');

  grid.querySelectorAll('.stone').forEach(btn => {
    btn.addEventListener('click', () => {
      selectBook( Number(btn.dataset.idx) );
    });
  });

  renderArchipelagoMap();
}

function renderArchipelagoMap(){
  const svg = $('map-svg');
  const ink = '#1c1512';
  let s = `
    <defs>
      <pattern id="waves" width="40" height="16" patternUnits="userSpaceOnUse">
        <path d="M4 10 Q12 5 20 10 T36 10" fill="none" stroke="#136f9e" stroke-opacity=".22" stroke-width="1.5"/>
      </pattern>
    </defs>
    <rect width="680" height="540" fill="url(#waves)"/>
    <!-- Compass & Sea Title -->
    <text x="340" y="28" text-anchor="middle" font-size="11" font-weight="700" letter-spacing="3" fill="#1c1512" opacity=".7">${reg==='i'?'THE AEGEAN ARCHIPELAGO · ARCHE & PAXOS':'THE TWO ISLANDS · 7 SETTINGS · 18 BOOKS'}</text>

    <!-- Island 1: ARCHE (North-West) -->
    <path d="M54 110 C50 62, 110 32, 175 40 C235 46, 268 88, 254 148 C244 195, 258 258, 232 325 C208 378, 128 386, 86 350 C48 318, 66 246, 52 195 Z"
      fill="#f6eed6" stroke="${ink}" stroke-width="3.5"/>
    <!-- Mount Phyle contour lines -->
    <path d="M110 95 L164 46 L218 95 Z" fill="#e3d5b2" stroke="${ink}" stroke-width="2"/>
    <path d="M135 82 L164 52 L195 82" fill="none" stroke="#7a4fa0" stroke-width="2"/>
    <!-- Ring road loop on Arche -->
    <ellipse cx="145" cy="168" rx="52" ry="32" fill="none" stroke="#b5602c" stroke-width="2.5" stroke-dasharray="5 3"/>
    <text x="152" y="398" text-anchor="middle" font-size="14" font-weight="700" letter-spacing="2" fill="${ink}">ARCHE</text>
    <text x="152" y="414" text-anchor="middle" font-size="11" class="serif" fill="#4a3d31">${reg==='i'?'Numbered houses, tents & mountain posts':'Crash & Byzantine agreement'}</text>

    <!-- Island 2: PAXOS (South-East) -->
    <path d="M356 140 C368 92, 445 78, 522 96 C596 112, 636 172, 622 252 C608 332, 576 398, 495 402 C412 406, 376 356, 384 282 C392 224, 344 188, 356 140 Z"
      fill="#f6eed6" stroke="${ink}" stroke-width="3.5"/>
    <!-- Scholars' Coast shoreline highlight -->
    <path d="M405 320 Q488 386 575 315" fill="none" stroke="#2a7b6f" stroke-width="3" stroke-dasharray="4 3"/>
    <text x="495" y="430" text-anchor="middle" font-size="14" font-weight="700" letter-spacing="2" fill="${ink}">PAXOS</text>
    <text x="495" y="446" text-anchor="middle" font-size="11" class="serif" fill="#4a3d31">${reg==='i'?'The Chamber, the Tholos, the Coast & Two Doors':'Paxos, VR, Gossip, CRDTs, HATs & CALM'}</text>

    <!-- Setting Labels -->
    <text x="164" y="34" text-anchor="middle" font-size="10.5" font-weight="700" fill="#7a4fa0">${reg==='i'?'CROWN OF PHYLE (9–11)':'BYZANTINE SMR (9–11)'}</text>
    <text x="145" y="216" text-anchor="middle" font-size="10.5" font-weight="700" fill="#b5602c">${reg==='i'?'THE RING ROAD (1–3)':'CAUSAL & CUTS (1–3)'}</text>
    <text x="152" y="252" text-anchor="middle" font-size="10.5" font-weight="700" fill="#5f6e28">${reg==='i'?'FOOT OF PHYLE (4–8)':'CRASH & PARTITIONS (4–8)'}</text>
    <text x="406" y="126" text-anchor="middle" font-size="10.5" font-weight="700" fill="#136f9e">${reg==='i'?'THE CHAMBER (12)':'PAXOS (12)'}</text>
    <text x="515" y="108" text-anchor="middle" font-size="10.5" font-weight="700" fill="#9e7210">${reg==='i'?'THE THOLOS (13)':'VIEWSTAMPED (13)'}</text>
    <text x="572" y="182" text-anchor="middle" font-size="10.5" font-weight="700" fill="#8a5a36">${reg==='i'?'TWO DOORS (18)':'CALM (18)'}</text>
    <text x="490" y="274" text-anchor="middle" font-size="10.5" font-weight="700" fill="#2a7b6f">${reg==='i'?'SCHOLARS\' COAST (14–17)':'WEAK / COORD-FREE (14–17)'}</text>
  `;

  BOOKS.forEach((b, idx) => {
    const [x, y] = b.mapPt;
    const isMatch = bookMatches(b);
    const isCur = idx === curBookIdx;
    s += `<g class="map-node${isMatch?'':' dim'}" data-idx="${idx}" transform="translate(${x},${y})">
      ${isCur ? `<circle r="19" fill="#e0b84a" stroke="${ink}" stroke-width="2.5"/>` : ''}
      <circle r="13.5" fill="${b.c}" stroke="${ink}" stroke-width="2.5"/>
      <text y="4" text-anchor="middle" font-size="11" font-weight="700" fill="#fffaf0">${b.n}</text>
      <title>#${b.n} ${b.title}</title>
    </g>`;
  });

  // Legend bar at bottom of map
  const cur = BOOKS[curBookIdx];
  s += `<g transform="translate(24, 474)">
    <rect width="632" height="46" rx="4" fill="#fffaf0" stroke="${ink}" stroke-width="2.5"/>
    <circle cx="24" cy="23" r="12" fill="${cur.c}" stroke="${ink}" stroke-width="2"/>
    <text x="24" y="27" text-anchor="middle" font-size="11" font-weight="700" fill="#fffaf0">${cur.n}</text>
    <text x="46" y="19" font-size="13" font-weight="700" fill="${ink}">${cur.title}</text>
    <text x="46" y="36" font-size="11.5" class="serif" fill="#4a3d31">${cur.tag[reg]}</text>
  </g>`;

  svg.innerHTML = s;
  svg.querySelectorAll('.map-node').forEach(g => {
    g.addEventListener('click', () => selectBook(Number(g.dataset.idx)));
  });
}

/* ============================================================
   18 Interactive Stage Simulations (One per Book)
   ============================================================ */
const stageState = {};

function renderStage(){
  const b = BOOKS[curBookIdx];
  const pl = PLACE_MAP[b.place];
  const st = $('wb-stage');
  st.style.setProperty('--c', b.c);

  $('st-kicker').textContent = `${pl[reg]} · Book ${b.n} of 18`;
  $('st-idx').textContent = `${b.n} / 18`;
  $('st-title').textContent = b.title;
  $('st-sub').textContent = b.sub[reg];

  $('bt-trap').textContent = reg === 'i' ? 'The trap' : 'The problem';
  $('bt-dev').textContent = reg === 'i' ? 'The device' : 'The mechanism';
  $('bt-res').textContent = reg === 'i' ? 'What holds' : 'The guarantee';
  $('bt-lim').textContent = reg === 'i' ? 'Where it stops' : 'The lower bound';

  $('bp-trap').textContent = b.trap[reg];
  $('bp-dev').textContent = b.dev[reg];
  $('bp-res').textContent = b.res[reg];
  $('bp-lim').textContent = b.lim[reg];

  $('st-open').href = `../${b.slug}/index.html`;
  $('st-open').textContent = reg === 'i' ? 'Open this book ↗' : 'Read full interactive book ↗';
  $('st-credit').textContent = b.cite;

  const spHtml = `<span class="st-spreads-lbl">${reg==='i'?'Jump to spread:':'Sections:'}</span>` +
    b.spreads.map(sp => `<a class="sp-pill" href="../${b.slug}/index.html#${sp.id}">${sp[reg]} ↗</a>`).join('');
  $('st-spreads').innerHTML = spHtml;

  // Dispatch to the chosen book's interactive figure
  STAGE_SIMS[b.n]($('stage-svg'), $('st-well-btns'), $('st-say'));
}

function setWellBtns(container, btns, onClick){
  container.innerHTML = btns.map(b =>
    `<button type="button" class="btn alt small${b.on?' on':''}" data-k="${b.k}">${b.label}</button>`
  ).join('');
  container.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => onClick(btn.dataset.k));
  });
}

const STAGE_SIMS = {
  // Book 1: Ordering Without Clocks (Scalar vs Vector Clocks)
  1: function(svg, btnsEl, sayEl){
    const s = stageState[1] || (stageState[1] = { mode: 'vec', sel: 'c' });
    setWellBtns(btnsEl, [
      { k:'scalar', label: reg==='i'?'Single tally':'Scalar clock L(e)', on: s.mode==='scalar' },
      { k:'vec', label: reg==='i'?'Row of three':'Vector clock V(e)', on: s.mode==='vec' },
      { k:'cmp', label: reg==='i'?'Compare b & d':'Test concurrency (b ∥ d)', on: s.sel==='bd' }
    ], k => {
      if(k==='scalar' || k==='vec') s.mode = k;
      if(k==='cmp') s.sel = (s.sel === 'bd' ? 'c' : 'bd');
      renderStage();
    });

    const isVec = s.mode === 'vec';
    const bHi = s.sel === 'bd';
    svg.innerHTML = `
      <rect width="520" height="340" fill="#fffaf0"/>
      <!-- 3 house timelines -->
      <g font-size="13" font-weight="700">
        <rect x="16" y="48" width="44" height="28" fill="#9cb648" stroke="#1c1512" stroke-width="2.5"/><text x="38" y="66" text-anchor="middle">H1</text>
        <rect x="16" y="154" width="44" height="28" fill="#e0b84a" stroke="#1c1512" stroke-width="2.5"/><text x="38" y="172" text-anchor="middle">H2</text>
        <rect x="16" y="260" width="44" height="28" fill="#5b9be0" stroke="#1c1512" stroke-width="2.5"/><text x="38" y="278" text-anchor="middle">H3</text>
      </g>
      <line x1="60" y1="62" x2="495" y2="62" stroke="#1c1512" stroke-width="2.5"/>
      <line x1="60" y1="168" x2="495" y2="168" stroke="#1c1512" stroke-width="2.5"/>
      <line x1="60" y1="274" x2="495" y2="274" stroke="#1c1512" stroke-width="2.5"/>

      <!-- Causal arrows: a(H1)->b(H2)->c(H3), while d(H1) is concurrent with b(H2) -->
      <defs>
        <marker id="arr1" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 1 L9 5 L0 9 z" fill="#136f9e"/>
        </marker>
      </defs>
      <line x1="125" y1="62" x2="232" y2="162" stroke="#136f9e" stroke-width="2.8" marker-end="url(#arr1)"/>
      <line x1="245" y1="168" x2="368" y2="268" stroke="#136f9e" stroke-width="2.8" marker-end="url(#arr1)"/>

      <!-- Events -->
      <g class="click" data-ev="a">
        <circle cx="125" cy="62" r="15" fill="#9cb648" stroke="#1c1512" stroke-width="3"/>
        <text x="125" y="67" text-anchor="middle" font-weight="700">a</text>
        <rect x="85" y="18" width="80" height="22" fill="#fffaf0" stroke="#1c1512" stroke-width="2"/>
        <text x="125" y="33" text-anchor="middle" font-size="12" font-weight="700">${isVec?'[1, 0, 0]':'L = 1'}</text>
      </g>

      <g class="click" data-ev="bd">
        ${bHi ? `<circle cx="242" cy="168" r="22" fill="none" stroke="#bf4a26" stroke-width="4"/>` : ''}
        <circle cx="242" cy="168" r="15" fill="#e0b84a" stroke="#1c1512" stroke-width="3"/>
        <text x="242" y="173" text-anchor="middle" font-weight="700">b</text>
        <rect x="198" y="190" width="88" height="22" fill="${bHi?'#f7e3a8':'#fffaf0'}" stroke="#1c1512" stroke-width="2"/>
        <text x="242" y="205" text-anchor="middle" font-size="12" font-weight="700">${isVec?'[1, 1, 0]':'L = 2'}</text>
      </g>

      <g class="click" data-ev="bd">
        ${bHi ? `<circle cx="330" cy="62" r="22" fill="none" stroke="#bf4a26" stroke-width="4"/>` : ''}
        <circle cx="330" cy="62" r="15" fill="#9cb648" stroke="#1c1512" stroke-width="3"/>
        <text x="330" y="67" text-anchor="middle" font-weight="700">d</text>
        <rect x="286" y="18" width="88" height="22" fill="${bHi?'#f7e3a8':'#fffaf0'}" stroke="#1c1512" stroke-width="2"/>
        <text x="330" y="33" text-anchor="middle" font-size="12" font-weight="700">${isVec?'[2, 0, 0]':'L = 2'}</text>
      </g>

      <g class="click" data-ev="c">
        <circle cx="380" cy="274" r="15" fill="#5b9be0" stroke="#1c1512" stroke-width="3"/>
        <text x="380" y="279" text-anchor="middle" font-weight="700">c</text>
        <rect x="336" y="296" width="88" height="22" fill="#eef4d3" stroke="#1c1512" stroke-width="2"/>
        <text x="380" y="311" text-anchor="middle" font-size="12" font-weight="700">${isVec?'[1, 1, 1]':'L = 3'}</text>
      </g>

      <rect x="74" y="226" width="186" height="24" rx="3" fill="#f6eed6" stroke="#1c1512" stroke-width="1.5"/>
      <text x="167" y="242" text-anchor="middle" font-size="11.5" font-weight="700" fill="#3b2e25">${isVec ? 'a=[1,0,0] < b=[1,1,0] < c=[1,1,1]' : 'a(1) < b(2) < c(3), but b(2) = d(2)'}</text>
    `;
    svg.querySelectorAll('.click').forEach(el => {
      el.addEventListener('click', () => { s.sel = el.dataset.ev; renderStage(); });
    });

    if(!isVec){
      sayEl.textContent = reg === 'i'
        ? 'Single tally: a (1) → b (2) → c (3) climbs along the chain, but unlinked events b and d cannot tell from their single numbers that neither caused the other.'
        : 'Scalar Lamport clock: L(a)=1 < L(b)=2 < L(c)=3 respects happens-before, but cannot distinguish causal order from concurrency between b and d.';
    } else if(bHi){
      sayEl.textContent = reg === 'i'
        ? 'Compare b = [1,1,0] and d = [2,0,0]: d is larger in H1\'s slot (2 > 1), while b is larger in H2\'s slot (1 > 0). Neither row dominates—no rider linked them!'
        : 'Vector comparison: V(b)=[1,1,0] and V(d)=[2,0,0] are incomparable (1 < 2 in slot 1, 1 > 0 in slot 2), proving b ∥ d.';
    } else {
      sayEl.textContent = reg === 'i'
        ? 'Row of three: c = [1,1,1] is at least as large in every slot as a = [1,0,0] and b = [1,1,0]. Click "Compare b & d" to see how unlinked events stand out.'
        : 'Vector clock: V(a)=[1,0,0] < V(b)=[1,1,0] < V(c)=[1,1,1] captures the exact causal chain. Click "Test concurrency (b ∥ d)" to inspect concurrent events.';
    }
  },

  // Book 2: Many Copies, Acting as One (Linearizability)
  2: function(svg, btnsEl, sayEl){
    const s = stageState[2] || (stageState[2] = { rule: 'lin' });
    setWellBtns(btnsEl, [
      { k:'lin', label: reg==='i'?'Pin in every span (Legal)':'Linearizable history', on: s.rule==='lin' },
      { k:'stale', label: reg==='i'?'Late stale read (Broken)':'Stale local read (Violation)', on: s.rule==='stale' }
    ], k => { s.rule = k; renderStage(); });

    const ok = s.rule === 'lin';
    svg.innerHTML = `
      <rect width="520" height="340" fill="#fffaf0"/>
      <text x="260" y="28" text-anchor="middle" font-size="12" font-weight="700" fill="#5b4c3e">${reg==='i'?'TIME FLOWS LEFT TO RIGHT · EACH BAR IS ONE VISITOR\'S GATE-TO-GATE SPAN':'REAL-TIME INVOCATION → RESPONSE INTERVALS'}</text>

      <!-- Write(x := Gold) -->
      <g transform="translate(0, 58)">
        <text x="22" y="24" font-size="12.5" font-weight="700">Visitor 1</text>
        <rect x="96" y="6" width="160" height="28" rx="4" fill="#e0b84a" fill-opacity=".35" stroke="#1c1512" stroke-width="2.5"/>
        <text x="176" y="25" text-anchor="middle" font-size="12.5" font-weight="700">${reg==='i'?'Set jar := OLIVE':'Write(x := OLIVE)'}</text>
        <line x1="185" y1="0" x2="185" y2="40" stroke="#bf4a26" stroke-width="3"/>
        <circle cx="185" cy="20" r="6" fill="#bf4a26" stroke="#1c1512" stroke-width="2"/>
      </g>

      <!-- Concurrent Read 1 -->
      <g transform="translate(0, 134)">
        <text x="22" y="24" font-size="12.5" font-weight="700">Visitor 2</text>
        <rect x="140" y="6" width="175" height="28" rx="4" fill="#9cb648" fill-opacity=".35" stroke="#1c1512" stroke-width="2.5"/>
        <text x="227" y="25" text-anchor="middle" font-size="12.5" font-weight="700">${reg==='i'?'Read → OLIVE':'Read(x) → OLIVE'}</text>
        <line x1="236" y1="0" x2="236" y2="40" stroke="#3f7a2a" stroke-width="3"/>
        <circle cx="236" cy="20" r="6" fill="#3f7a2a" stroke="#1c1512" stroke-width="2"/>
      </g>

      <!-- Later Read 2 -->
      <g transform="translate(0, 210)">
        <text x="22" y="24" font-size="12.5" font-weight="700">Visitor 3</text>
        <rect x="336" y="6" width="148" height="28" rx="4" fill="${ok?'#eef4d3':'#fbe7de'}" stroke="${ok?'#3f7a2a':'#bf4a26'}" stroke-width="3"/>
        <text x="410" y="25" text-anchor="middle" font-size="12.5" font-weight="700" fill="${ok?'#1c1512':'#bf4a26'}">${ok ? (reg==='i'?'Read → OLIVE ✓':'Read(x) → OLIVE ✓') : (reg==='i'?'Read → EMPTY ✗':'Read(x) → EMPTY ✗')}</text>
        ${ok
          ? `<line x1="395" y1="0" x2="395" y2="40" stroke="#3f7a2a" stroke-width="3"/><circle cx="395" cy="20" r="6" fill="#3f7a2a" stroke="#1c1512" stroke-width="2"/>`
          : `<path d="M360 6 L342 34 M342 6 L360 34" stroke="#bf4a26" stroke-width="3"/>`}
      </g>

      <!-- Single-copy timeline at bottom -->
      <line x1="80" y1="295" x2="488" y2="295" stroke="#1c1512" stroke-width="2.5"/>
      <text x="284" y="320" text-anchor="middle" font-size="12" font-weight="700" fill="${ok?'#3f7a2a':'#bf4a26'}">
        ${ok
          ? (reg==='i'?'All three pins drop in order: Set(OLIVE) → Read(OLIVE) → Read(OLIVE)':'Valid sequential order at linearization points: W(OLIVE) → R(OLIVE) → R(OLIVE)')
          : (reg==='i'?'Visitor 3 arrived after Visitor 2 left with OLIVE—no valid pin exists for EMPTY!':'Violates linearizability: Visitor 3 began after Visitor 2 observed OLIVE, so it cannot read EMPTY.')}
      </text>
    `;

    sayEl.textContent = ok
      ? (reg==='i'
          ? 'Every visit has one pin inside its gate-to-gate span so the three visits read like a single jar.'
          : 'Linearizable: every operation takes effect atomically at a single point between its invocation and response.')
      : (reg==='i'
          ? 'Broken illusion: Visitor 3 knocked at the gate after Visitor 2 already went home with OLIVE, yet a lagging house answered EMPTY.'
          : 'Non-linearizable: real-time order requires Visitor 3 to be ordered after Visitor 2, making EMPTY illegal.');
  },

  // Book 3: Taking Stock Without Stopping (Chandy-Lamport Snapshot)
  3: function(svg, btnsEl, sayEl){
    const s = stageState[3] || (stageState[3] = { step: 2 });
    setWellBtns(btnsEl, [
      { k:'0', label: reg==='i'?'1. Cart in flight':'1. Message in transit', on: s.step===0 },
      { k:'1', label: reg==='i'?'2. Naive double-count':'2. Inconsistent cut (10!)', on: s.step===1 },
      { k:'2', label: reg==='i'?'3. Red sash rule (9 ✓)':'3. Marker snapshot (9 ✓)', on: s.step===2 }
    ], k => { s.step = Number(k); renderStage(); });

    const st = s.step;
    const h1 = st===0 ? 4 : 3;
    const h2 = st===1 ? 4 : 3;
    const road = st===2 ? 1 : 0;
    const tot = h1 + h2 + 3 + road;

    svg.innerHTML = `
      <rect width="520" height="340" fill="#fffaf0"/>
      <!-- 3 houses with amphora counts -->
      <g transform="translate(55, 85)">
        <rect x="0" y="0" width="110" height="76" fill="#9cb648" stroke="#1c1512" stroke-width="3"/>
        <text x="55" y="24" text-anchor="middle" font-weight="700" font-size="14">House 1</text>
        <text x="55" y="54" text-anchor="middle" font-weight="700" font-size="22">${h1} jars</text>
      </g>
      <g transform="translate(355, 85)">
        <rect x="0" y="0" width="110" height="76" fill="#e0b84a" stroke="#1c1512" stroke-width="3"/>
        <text x="55" y="24" text-anchor="middle" font-weight="700" font-size="14">House 2</text>
        <text x="55" y="54" text-anchor="middle" font-weight="700" font-size="22">${h2} jars</text>
      </g>
      <g transform="translate(205, 220)">
        <rect x="0" y="0" width="110" height="68" fill="#5b9be0" stroke="#1c1512" stroke-width="3"/>
        <text x="55" y="24" text-anchor="middle" font-weight="700" font-size="14">House 3</text>
        <text x="55" y="50" text-anchor="middle" font-weight="700" font-size="20">3 jars</text>
      </g>

      <!-- Road from H1 to H2 -->
      <line x1="165" y1="123" x2="355" y2="123" stroke="#1c1512" stroke-width="3"/>
      <!-- Cart with 1 jar on the road -->
      <g transform="translate(${st===1 ? 320 : 255}, 105)">
        <rect x="-34" y="-12" width="68" height="26" rx="4" fill="#fffaf0" stroke="#1c1512" stroke-width="2.5"/>
        <text x="0" y="5" text-anchor="middle" font-size="12" font-weight="700">Cart: 1 jar</text>
      </g>
      ${st===2 ? `
        <!-- Red sash marker behind the cart -->
        <path d="M200 62 Q220 123 195 190" fill="none" stroke="#bf4a26" stroke-width="4" stroke-dasharray="6 4"/>
        <rect x="172" y="42" width="84" height="22" fill="#bf4a26" stroke="#1c1512" stroke-width="2"/>
        <text x="214" y="57" text-anchor="middle" font-size="11" font-weight="700" fill="#fffaf0">${reg==='i'?'RED SASH':'MARKER'}</text>
      ` : ''}

      <!-- Tally summary bar -->
      <rect x="70" y="18" width="380" height="34" rx="4" fill="${tot===9?'#eef4d3':'#fbe7de'}" stroke="#1c1512" stroke-width="2.5"/>
      <text x="260" y="40" text-anchor="middle" font-size="13.5" font-weight="700" fill="${tot===9?'#3f6a14':'#bf4a26'}">
        ${st===1
          ? (reg==='i'?'Naive count: 4 (H1 before) + 4 (H2 after) + 3 (H3) = 11 (Wrong!)':'Inconsistent cut: counts message after receive & before send!')
          : (reg==='i'?`Recorded cut: ${h1} + ${h2} + 3 + ${road} on road = 9 amphorae ✓`:`Consistent cut: ${h1} + ${h2} + 3 + ${road} in channel = 9 total ✓`)}
      </text>
    `;

    sayEl.textContent = st === 1
      ? (reg==='i'
          ? 'Without the sash rule, H1 counts before the cart leaves and H2 counts after it lands—the same jar is counted twice.'
          : 'An uncoordinated cut crosses a message backward (including receive without send), falsifying the global invariant.')
      : (reg==='i'
          ? 'H1 records 3 jars and sends a red sash behind the cart; H2 records 3 jars and logs the 1 cart that arrives ahead of the sash. Total: 9.'
          : 'Chandy-Lamport Marker rule: H1 snapshots 3, emits Marker; H2 snapshots 3 and logs the 1 in-flight message before the Marker arrives. Sum = 9.');
  },

  // Book 4: The Limits of Agreement (FLP Impossibility)
  4: function(svg, btnsEl, sayEl){
    const s = stageState[4] || (stageState[4] = { hop: 0 });
    setWellBtns(btnsEl, [
      { k:'delayA', label: reg==='i'?'Delay Attack rider':'Delay 1-tipping step', on: false },
      { k:'delayH', label: reg==='i'?'Delay Hold rider':'Delay 0-tipping step', on: false },
      { k:'reset', label: reg==='i'?'Reset camp':'Reset tree', on: false }
    ], k => {
      if(k==='reset') s.hop = 0;
      else s.hop = (s.hop + 1) % 4;
      renderStage();
    });

    const yOff = s.hop * 42;
    svg.innerHTML = `
      <rect width="520" height="340" fill="#fffaf0"/>
      <text x="260" y="26" text-anchor="middle" font-size="12" font-weight="700" fill="#5f6e28">${reg==='i'?'POISED CAMP: BOTH "ATTACK" AND "HOLD" ARE STILL REACHABLE':'BIVALENT CONFIGURATION TREE (FLP 1985)'}</text>

      <!-- Left = Univalent Hold (0), Center spine = Bivalent, Right = Univalent Attack (1) -->
      <rect x="26" y="54" width="120" height="250" fill="#e9f2f7" stroke="#1c1512" stroke-width="2" stroke-dasharray="4 3"/>
      <text x="86" y="76" text-anchor="middle" font-size="12" font-weight="700" fill="#136f9e">${reg==='i'?'Hold-only (0)':'0-Valent'}</text>

      <rect x="374" y="54" width="120" height="250" fill="#fbe7de" stroke="#1c1512" stroke-width="2" stroke-dasharray="4 3"/>
      <text x="434" y="76" text-anchor="middle" font-size="12" font-weight="700" fill="#bf4a26">${reg==='i'?'Attack-only (1)':'1-Valent'}</text>

      <rect x="170" y="54" width="180" height="250" fill="#f7e3a8" fill-opacity=".45" stroke="#1c1512" stroke-width="2.5"/>
      <text x="260" y="76" text-anchor="middle" font-size="12" font-weight="700">${reg==='i'?'Poised (Both open)':'Bivalent Spine'}</text>

      <!-- Spine nodes C0..C3 -->
      ${[0,1,2,3].map(i => {
        const y = 110 + i * 52;
        const active = i === s.hop;
        return `<g>
          <line x1="260" y1="${y}" x2="96" y2="${y+24}" stroke="#136f9e" stroke-width="2" stroke-dasharray="3 3"/>
          <line x1="260" y1="${y}" x2="424" y2="${y+24}" stroke="#bf4a26" stroke-width="2" stroke-dasharray="3 3"/>
          ${i<3 ? `<line x1="260" y1="${y}" x2="260" y2="${y+52}" stroke="#1c1512" stroke-width="3"/>` : ''}
          <circle cx="96" cy="${y+24}" r="10" fill="#5b9be0" stroke="#1c1512" stroke-width="2"/>
          <circle cx="424" cy="${y+24}" r="10" fill="#c45448" stroke="#1c1512" stroke-width="2"/>
          <circle cx="260" cy="${y}" r="${active?17:12}" fill="${active?'#e0b84a':'#fffaf0'}" stroke="#1c1512" stroke-width="3"/>
          <text x="260" y="${y+4}" text-anchor="middle" font-size="11.5" font-weight="700">C${i}</text>
        </g>`;
      }).join('')}
      <text x="260" y="324" text-anchor="middle" font-size="12" font-weight="700" fill="#bf4a26">${reg==='i'?`Step ${s.hop + 1}: adversary holds back the tipping rider → stays poised at C${s.hop}`:`Step ${s.hop + 1}: scheduler defers deciding message → remains bivalent at C${s.hop}`}</text>
    `;

    sayEl.textContent = reg === 'i'
      ? `At C${s.hop}, if delivering a rider would lock in Attack or Hold, the wind delays that rider (looks just like a sleeping tent) and steps to the next poised state.`
      : `At bivalent configuration C${s.hop}, the adversary schedules non-deciding events so the system transitions to another bivalent configuration forever.`;
  },

  // Book 5: Agreeing When Messages Run Late (DLS Partial Synchrony)
  5: function(svg, btnsEl, sayEl){
    const s = stageState[5] || (stageState[5] = { calm: false });
    setWellBtns(btnsEl, [
      { k:'storm', label: reg==='i'?'1. Gale blows (riders late)':'1. Before GST (delays > Δ)', on: !s.calm },
      { k:'calm', label: reg==='i'?'2. Wind calms (majority locks)':'2. After GST (commit in 1 turn)', on: s.calm }
    ], k => { s.calm = (k === 'calm'); renderStage(); });

    svg.innerHTML = `
      <rect width="520" height="340" fill="#fffaf0"/>
      <!-- Two zones: Gale vs Calm -->
      <rect x="20" y="42" width="225" height="230" fill="${!s.calm?'#fbe7de':'#f6eed6'}" stroke="#1c1512" stroke-width="${!s.calm?3:2}"/>
      <text x="132" y="66" text-anchor="middle" font-size="12.5" font-weight="700" fill="#bf4a26">${reg==='i'?'GALE: RIDERS RUN LATE':'BEFORE GST: ASYNCHRONOUS'}</text>
      <text x="132" y="92" text-anchor="middle" font-size="11.5" class="serif">${reg==='i'?'Turn 1 times out, but majority':'Timeouts fire early, yet quorum'}</text>
      <text x="132" y="108" text-anchor="middle" font-size="11.5" class="serif">${reg==='i'?'overlap prevents any split!':'intersection preserves safety!'}</text>
      <ellipse cx="110" cy="185" rx="52" ry="32" fill="#e0b84a" fill-opacity=".3" stroke="#1c1512" stroke-width="2"/>
      <ellipse cx="154" cy="185" rx="52" ry="32" fill="#9cb648" fill-opacity=".3" stroke="#1c1512" stroke-width="2"/>
      <circle cx="132" cy="185" r="14" fill="#e0b84a" stroke="#1c1512" stroke-width="2.5"/>
      <text x="132" y="189" text-anchor="middle" font-size="11" font-weight="700">T2</text>
      <text x="132" y="248" text-anchor="middle" font-size="12" font-weight="700" fill="#3f7a2a">${reg==='i'?'0 splits · Safe':'Safety: 100%'}</text>

      <!-- GST divider -->
      <line x1="260" y1="32" x2="260" y2="286" stroke="#bf4a26" stroke-width="3" stroke-dasharray="5 4"/>
      <rect x="220" y="16" width="80" height="22" fill="#bf4a26" stroke="#1c1512" stroke-width="2"/>
      <text x="260" y="31" text-anchor="middle" font-size="11" font-weight="700" fill="#fffaf0">${reg==='i'?'WIND CALMS':'GST'}</text>

      <rect x="275" y="42" width="225" height="230" fill="${s.calm?'#eef4d3':'#f6eed6'}" stroke="#1c1512" stroke-width="${s.calm?3:2}"/>
      <text x="387" y="66" text-anchor="middle" font-size="12.5" font-weight="700" fill="#3f6a14">${reg==='i'?'CALM: RIDERS ON TIME':'AFTER GST: SYNCHRONOUS WINDOW'}</text>
      <text x="387" y="92" text-anchor="middle" font-size="11.5" class="serif">${reg==='i'?'3 of 4 tents answer inside':'Coordinator collects 3/4 quorum'}</text>
      <text x="387" y="108" text-anchor="middle" font-size="11.5" class="serif">${reg==='i'?'the sandglass → ORDER SETTLED':'within timeout → DECIDES'}</text>
      <circle cx="387" cy="160" r="16" fill="#e0b84a" stroke="#1c1512" stroke-width="2.5"/><text x="387" y="165" text-anchor="middle" font-weight="700">T1</text>
      <circle cx="335" cy="215" r="14" fill="#6583d6" stroke="#1c1512" stroke-width="2.5"/><text x="335" y="220" text-anchor="middle" font-weight="700">T2</text>
      <circle cx="439" cy="215" r="14" fill="#9cb648" stroke="#1c1512" stroke-width="2.5"/><text x="439" y="220" text-anchor="middle" font-weight="700">T4</text>
      <line x1="375" y1="172" x2="345" y2="203" stroke="#3f7a2a" stroke-width="3"/>
      <line x1="399" y1="172" x2="429" y2="203" stroke="#3f7a2a" stroke-width="3"/>
      <text x="387" y="252" text-anchor="middle" font-size="12" font-weight="700" fill="#3f6a14">${reg==='i'?'3 of 4 locked & committed ✓':'Quorum 3/4 committed ✓'}</text>
    `;

    sayEl.textContent = !s.calm
      ? (reg==='i'
          ? 'During the gale, sandglasses run out early and turns abort—but because any two majorities of 3 out of 4 share a tent, two orders can never both lock.'
          : 'Before GST, premature timeouts may abort rounds, but majority quorum intersection (2Q > N) guarantees safety unconditionally.')
      : (reg==='i'
          ? 'Once the wind stays calm for one turn, T1 hears from 3 of 4 tents before the sand runs out and commits the order.'
          : 'After GST, message delays stay within Δ, allowing the current coordinator to collect a majority and terminate in one clean round.');
  },

  // Book 6: Answering While Cut Off (CAP Theorem)
  6: function(svg, btnsEl, sayEl){
    const s = stageState[6] || (stageState[6] = { pick: 'wait' });
    setWellBtns(btnsEl, [
      { k:'wait', label: reg==='i'?'Wait for the gorge (CP)':'Block until heal (CP / Linearizable)', on: s.pick==='wait' },
      { k:'now', label: reg==='i'?'Answer at once (AP)':'Return immediately (AP / Stale)', on: s.pick==='now' }
    ], k => { s.pick = k; renderStage(); });

    const isWait = s.pick === 'wait';
    svg.innerHTML = `
      <rect width="520" height="340" fill="#fffaf0"/>
      <!-- West Camp -->
      <rect x="28" y="68" width="180" height="175" fill="#f7e3a8" stroke="#1c1512" stroke-width="3"/>
      <text x="118" y="94" text-anchor="middle" font-weight="700" font-size="14">${reg==='i'?'West Side (T1, T2)':'West Partition'}</text>
      <rect x="48" y="114" width="140" height="34" fill="#fffaf0" stroke="#1c1512" stroke-width="2"/>
      <text x="118" y="136" text-anchor="middle" font-size="12" font-weight="700">${reg==='i'?'Caller sets: ATTACK':'Write(v := ATTACK) ✓'}</text>
      <text x="118" y="182" text-anchor="middle" font-size="12" class="serif">${reg==='i'?'Slate holds: ATTACK':'State: v = ATTACK'}</text>

      <!-- Gorge cut in middle -->
      <line x1="260" y1="45" x2="260" y2="265" stroke="#bf4a26" stroke-width="4" stroke-dasharray="7 5"/>
      <path d="M246 142 L274 170 M274 142 L246 170" stroke="#bf4a26" stroke-width="4"/>
      <text x="260" y="38" text-anchor="middle" font-size="11.5" font-weight="700" fill="#bf4a26">${reg==='i'?'ROCKSLIDE CUTS ROAD':'NETWORK PARTITION'}</text>

      <!-- East Camp -->
      <rect x="312" y="68" width="180" height="175" fill="#e9f2f7" stroke="#1c1512" stroke-width="3"/>
      <text x="402" y="94" text-anchor="middle" font-weight="700" font-size="14">${reg==='i'?'East Side (T3, T4)':'East Partition'}</text>
      <text x="402" y="130" text-anchor="middle" font-size="12" class="serif">${reg==='i'?'No rider from West has arrived':'Zero messages from West'}</text>
      <rect x="328" y="152" width="148" height="44" fill="${isWait?'#eef4d3':'#fbe7de'}" stroke="#1c1512" stroke-width="2.5"/>
      <text x="402" y="172" text-anchor="middle" font-size="12" font-weight="700" fill="${isWait?'#3f6a14':'#bf4a26'}">
        ${isWait ? (reg==='i'?'Reader waits at gate':'Read blocks (No response)') : (reg==='i'?'Answers "HOLD" (Stale!)':'Returns old v = HOLD ✗')}
      </text>
      <text x="402" y="188" text-anchor="middle" font-size="10.5" font-weight="700">
        ${isWait ? (reg==='i'?'One-copy law kept':'Preserves Linearizability') : (reg==='i'?'Breaks one-copy law':'Preserves Availability')}
      </text>
    `;

    sayEl.textContent = isWait
      ? (reg==='i'
          ? 'East refuses to guess while cut off: the one-copy promise holds, but the caller at the East gate must wait.'
          : 'CP choice: East blocks the read until it can reach a majority, preserving linearizability at the cost of availability.')
      : (reg==='i'
          ? 'East answers at once from its own slate ("HOLD"), even though West already settled "ATTACK"—breaking the single-jar illusion.'
          : 'AP choice: East responds immediately with HOLD after Write(ATTACK) completed on West, violating linearizability.');
  },

  // Book 7: Agreeing by Chance (Ben-Or Randomized Consensus)
  7: function(svg, btnsEl, sayEl){
    const s = stageState[7] || (stageState[7] = { mode: 'split', coins: [1,1,1] });
    setWellBtns(btnsEl, [
      { k:'split', label: reg==='i'?'Toss bronze coins':'Flip random coins', on: s.mode==='split' },
      { k:'lock', label: reg==='i'?'1 tent sees majority + coins match':'1 locked + coins align (Decide!)', on: s.mode==='lock' }
    ], k => {
      s.mode = k;
      if(k==='split') s.coins = [Math.round(Math.random()), Math.round(Math.random()), Math.round(Math.random())];
      else s.coins = [1, 1, 1];
      renderStage();
    });

    const allMatch = s.mode === 'lock' || (s.coins[0]===1 && s.coins[1]===1 && s.coins[2]===1);
    svg.innerHTML = `
      <rect width="520" height="340" fill="#fffaf0"/>
      <text x="260" y="28" text-anchor="middle" font-size="12" font-weight="700" fill="#5f6e28">${reg==='i'?'STAGE 2 OF THE ROUND: ONE TENT SEES A MAJORITY, OTHERS TOSS A COIN':'BEN-OR PHASE 2: LOCK PRESERVATION + RANDOM COIN TOSS'}</text>

      <!-- 4 tents -->
      <g transform="translate(42, 65)">
        <rect width="96" height="110" fill="#e0b84a" stroke="#1c1512" stroke-width="2.5"/>
        <text x="48" y="24" text-anchor="middle" font-weight="700">Tent 1</text>
        <text x="48" y="48" text-anchor="middle" font-size="11" class="serif">${reg==='i'?'Saw ≥1 "A" slip':'Saw report(1)'}</text>
        <rect x="12" y="64" width="72" height="30" fill="#eef4d3" stroke="#1c1512" stroke-width="2"/>
        <text x="48" y="84" text-anchor="middle" font-size="12" font-weight="700">${reg==='i'?'Locks A':'Locks 1'}</text>
      </g>

      ${[0,1].map(i => {
        const x = 166 + i * 124;
        const cVal = s.coins[i];
        return `<g transform="translate(${x}, 65)">
          <rect width="96" height="110" fill="#fffaf0" stroke="#1c1512" stroke-width="2.5"/>
          <text x="48" y="24" text-anchor="middle" font-weight="700">Tent ${i+2}</text>
          <text x="48" y="48" text-anchor="middle" font-size="11" class="serif">${reg==='i'?'Saw only "?"':'Saw only "?"'}</text>
          <circle cx="48" cy="79" r="18" fill="#e0b84a" stroke="#1c1512" stroke-width="2.5"/>
          <text x="48" y="84" text-anchor="middle" font-size="12" font-weight="700">${cVal===1?(reg==='i'?'Coin: A':'Coin: 1'):(reg==='i'?'Coin: H':'Coin: 0')}</text>
        </g>`;
      }).join('')}

      <g transform="translate(414, 65)" opacity=".45">
        <rect width="74" height="110" fill="#e9dcb6" stroke="#1c1512" stroke-width="2" stroke-dasharray="4 3"/>
        <text x="37" y="24" text-anchor="middle" font-weight="700">Tent 4</text>
        <text x="37" y="66" text-anchor="middle" font-size="11.5" class="serif">${reg==='i'?'Asleep':'Crashed'}</text>
      </g>

      <rect x="42" y="210" width="446" height="58" rx="4" fill="${allMatch?'#eef4d3':'#f7e3a8'}" stroke="#1c1512" stroke-width="2.5"/>
      <text x="265" y="235" text-anchor="middle" font-size="13" font-weight="700" fill="${allMatch?'#3f6a14':'#1c1512'}">
        ${allMatch
          ? (reg==='i'?'Coins matched Tent 1\'s lock! Next round: all 3 awake tents propose A and finish ✓':'Coins aligned with locked value 1! Next round achieves unanimous majority ✓')
          : (reg==='i'?'Coins split this round—no harm done! Toss again until the coins land on A.':'Coins diverged—safety holds because no opposite majority can form; repeat round.')}
      </text>
      <text x="265" y="255" text-anchor="middle" font-size="11.5" class="serif">
        ${reg==='i'?'Chance of matching in one round ≥ 1/2ⁿ → finishes with certainty (probability 1).':'Geometric convergence: terminates in finite expected rounds with probability 1.'}
      </text>
    `;

    sayEl.textContent = allMatch
      ? (reg==='i'
          ? 'Whenever the coin tosses land on the locked order, every awake tent starts the next round unanimous and settles at once.'
          : 'Once random coins align with the locked value, all non-faulty processes enter the next round with identical proposals and decide in one round.')
      : (reg==='i'
          ? 'Even when coins land different ways, no two orders can both win a majority. Click "1 tent sees majority + coins match" to see the round that finishes.'
          : 'Majority intersection prevents conflicting locks even when coin flips diverge. Click the right button to see coin alignment.');
  },

  // Book 8: Telling the Dead from the Slow (Chandra-Toueg Failure Detectors)
  8: function(svg, btnsEl, sayEl){
    const s = stageState[8] || (stageState[8] = { acc: false });
    setWellBtns(btnsEl, [
      { k:'noisy', label: reg==='i'?'1. Watch-slates suspect everyone':'1. False suspicions (Safe, stalls)', on: !s.acc },
      { k:'good', label: reg==='i'?'2. T2 trusted at last (◊W)':'2. Eventual accuracy ◊W (Decides!)', on: s.acc }
    ], k => { s.acc = (k === 'good'); renderStage(); });

    svg.innerHTML = `
      <rect width="520" height="340" fill="#fffaf0"/>
      <text x="260" y="26" text-anchor="middle" font-size="12" font-weight="700" fill="#5f6e28">${reg==='i'?'WATCH-SLATES MAY BE WRONG FOR MANY TURNS—SAFETY NEVER BREAKS':'UNRELIABLE FAILURE DETECTOR ◊S / ◊W (CHANDRA & TOUEG 1996)'}</text>

      <!-- 3 awake tents + 1 crashed -->
      <g transform="translate(36, 56)">
        <rect width="132" height="125" fill="#fffaf0" stroke="#1c1512" stroke-width="2.5"/>
        <text x="66" y="24" text-anchor="middle" font-weight="700">Tent 2 ${reg==='i'?'(Leader)':'(Coordinator)'}</text>
        <circle cx="66" cy="64" r="20" fill="#6583d6" stroke="#1c1512" stroke-width="2.5"/>
        <text x="66" y="69" text-anchor="middle" font-weight="700" fill="#fffaf0">T2</text>
        <text x="66" y="108" text-anchor="middle" font-size="11.5" font-weight="700" fill="#3f6a14">${reg==='i'?'Awake & proposing':'Alive coordinator'}</text>
      </g>

      <g transform="translate(194, 56)">
        <rect width="144" height="125" fill="${s.acc?'#eef4d3':'#fbe7de'}" stroke="#1c1512" stroke-width="2.5"/>
        <text x="72" y="24" text-anchor="middle" font-weight="700">${reg==='i'?'Watch-Slates at T3, T4':'Detector Modules'}</text>
        <text x="72" y="56" text-anchor="middle" font-size="12" font-weight="700" fill="#bf4a26">${reg==='i'?'Suspects T1 (asleep) ✓':'Suspects T1 (crashed) ✓'}</text>
        <text x="72" y="84" text-anchor="middle" font-size="12" font-weight="700" fill="${s.acc?'#3f6a14':'#bf4a26'}">
          ${s.acc ? (reg==='i'?'Trusts awake T2 ✓':'Stops suspecting T2 ✓') : (reg==='i'?'Falsely suspects T2 ✗':'Falsely suspects T2 ✗')}
        </text>
        <text x="72" y="110" text-anchor="middle" font-size="10.5" class="serif">${s.acc?'◊W accuracy holds':'Before accuracy stabilizes'}</text>
      </g>

      <g transform="translate(362, 56)" opacity=".5">
        <rect width="122" height="125" fill="#e9dcb6" stroke="#1c1512" stroke-width="2" stroke-dasharray="4 3"/>
        <text x="61" y="24" text-anchor="middle" font-weight="700">Tent 1</text>
        <text x="61" y="70" text-anchor="middle" font-size="12" class="serif">${reg==='i'?'Asleep forever':'Crashed'}</text>
      </g>

      <rect x="36" y="206" width="448" height="58" rx="4" fill="${s.acc?'#eef4d3':'#f6eed6'}" stroke="#1c1512" stroke-width="2.5"/>
      <text x="260" y="232" text-anchor="middle" font-size="13" font-weight="700" fill="${s.acc?'#3f6a14':'#1c1512'}">
        ${s.acc
          ? (reg==='i'?'T2\'s turn finishes without interruption → Majority of 3 locks and decides ✓':'Coordinator T2 completes all phases without suspicion → Consensus decided ✓')
          : (reg==='i'?'T3 & T4 move to the next turn early—majority rule still bars any split!':'False suspicion aborts Turn 2 early, but majority quorum preserves safety!')}
      </text>
      <text x="260" y="252" text-anchor="middle" font-size="11.5" class="serif">
        ${reg==='i'?'Weakest slate (◊W): eventually every sleeper is suspected, and at least one awake tent is trusted.':'◊W (Completeness + Eventual Weak Accuracy) is the weakest detector that solves consensus.'}
      </text>
    `;

    sayEl.textContent = s.acc
      ? (reg==='i'
          ? 'As soon as one awake tent (T2) stops being falsely suspected on the watch-slates, its turn collects 3 of 4 slips and settles.'
          : 'Once ◊S/◊W accuracy holds for one non-faulty coordinator, every alive process waits for its proposal and decides in that round.')
      : (reg==='i'
          ? 'Even if the watch-slates suspect every awake tent for a hundred turns, no tent ever commits without a majority.'
          : 'False suspicions can delay termination, but because decisions still require a majority of acks, safety is never compromised.');
  },

  // Book 9: Agreeing Among Liars (Byzantine Generals: 3 vs 4 posts & seals)
  9: function(svg, btnsEl, sayEl){
    const s = stageState[9] || (stageState[9] = { cfg: 'four' });
    setWellBtns(btnsEl, [
      { k:'three', label: reg==='i'?'3 posts, 1 liar (Trap!)':'N = 3, f = 1 (Impossible)', on: s.cfg==='three' },
      { k:'four', label: reg==='i'?'4 posts, 1 liar (3f+1 works)':'N = 4, f = 1 (Majority wins)', on: s.cfg==='four' },
      { k:'seal', label: reg==='i'?'Wax seals (SM works for 3)':'Signed messages SM(1)', on: s.cfg==='seal' }
    ], k => { s.cfg = k; renderStage(); });

    if(s.cfg === 'three'){
      svg.innerHTML = `
        <rect width="520" height="340" fill="#fffaf0"/>
        <text x="260" y="26" text-anchor="middle" font-size="12" font-weight="700" fill="#bf4a26">${reg==='i'?'THREE POSTS WITH ONE LIAR: POST 2 SEES ONE "ATTACK" AND ONE "HOLD"':'N = 3, f = 1 UNAUTHENTICATED: EQUIVOCATION IS UNDETECTABLE'}</text>
        <circle cx="260" cy="84" r="24" fill="#a57fc0" stroke="#1c1512" stroke-width="3"/>
        <text x="260" y="89" text-anchor="middle" font-weight="700">B1 (Liar)</text>
        <circle cx="135" cy="224" r="24" fill="#9aa0a8" stroke="#1c1512" stroke-width="3"/>
        <text x="135" y="229" text-anchor="middle" font-weight="700">B2</text>
        <circle cx="385" cy="224" r="24" fill="#e8964d" stroke="#1c1512" stroke-width="3"/>
        <text x="385" y="229" text-anchor="middle" font-weight="700">B3</text>

        <line x1="242" y1="102" x2="152" y2="204" stroke="#3f7a2a" stroke-width="3"/>
        <text x="172" y="148" text-anchor="middle" font-size="12" font-weight="700" fill="#3f6a14">"Attack"</text>

        <line x1="278" y1="102" x2="368" y2="204" stroke="#bf4a26" stroke-width="3" stroke-dasharray="5 3"/>
        <text x="348" y="148" text-anchor="middle" font-size="12" font-weight="700" fill="#bf4a26">"Hold"</text>

        <line x1="360" y1="224" x2="160" y2="224" stroke="#bf4a26" stroke-width="2.5"/>
        <text x="260" y="214" text-anchor="middle" font-size="11.5" font-weight="700">${reg==='i'?'B3 tells B2: "B1 said Hold"':'B3 relays "Hold" to B2'}</text>

        <rect x="64" y="268" width="392" height="40" fill="#fbe7de" stroke="#1c1512" stroke-width="2.5"/>
        <text x="260" y="293" text-anchor="middle" font-size="12.5" font-weight="700" fill="#bf4a26">${reg==='i'?'B2 hears {"Attack", "Hold"}—cannot tell if B1 or B3 is the liar!':'B2 receives {Attack, Hold}—indistinguishable whether B1 or B3 is Byzantine!'}</text>
      `;
      sayEl.textContent = reg === 'i'
        ? 'With 3 posts and 1 liar, B2 hears the exact same pair of reports whether Chief B1 lied or Lieutenant B3 lied.'
        : 'With N = 3 and f = 1, a loyal lieutenant sees {Attack, Hold} both when the commander equivocates and when the other lieutenant lies.';
    } else if(s.cfg === 'four'){
      svg.innerHTML = `
        <rect width="520" height="340" fill="#fffaf0"/>
        <text x="260" y="26" text-anchor="middle" font-size="12" font-weight="700" fill="#3f6a14">${reg==='i'?'FOUR POSTS (N = 3f + 1): TWO HONEST POSTS OUTVOTE THE SINGLE LIAR':'OM(1) WITH N = 4, f = 1: MAJORITY OF 3 REPORTS AGREES'}</text>
        <circle cx="260" cy="76" r="22" fill="#a57fc0" stroke="#1c1512" stroke-width="3"/><text x="260" y="81" text-anchor="middle" font-weight="700">B1</text>
        <circle cx="110" cy="215" r="22" fill="#9aa0a8" stroke="#1c1512" stroke-width="3"/><text x="110" y="220" text-anchor="middle" font-weight="700">B2</text>
        <circle cx="260" cy="215" r="22" fill="#e8964d" stroke="#1c1512" stroke-width="3"/><text x="260" y="220" text-anchor="middle" font-weight="700">B3</text>
        <circle cx="410" cy="215" r="22" fill="#b07a55" stroke="#1c1512" stroke-width="3"/><text x="410" y="220" text-anchor="middle" font-weight="700">B4 (Liar)</text>

        <line x1="242" y1="90" x2="125" y2="195" stroke="#3f7a2a" stroke-width="2.5"/>
        <line x1="260" y1="98" x2="260" y2="193" stroke="#3f7a2a" stroke-width="2.5"/>
        <line x1="278" y1="90" x2="395" y2="195" stroke="#3f7a2a" stroke-width="2.5"/>
        <line x1="132" y1="215" x2="238" y2="215" stroke="#3f7a2a" stroke-width="2.5"/>
        <line x1="388" y1="215" x2="282" y2="215" stroke="#bf4a26" stroke-width="2.5" stroke-dasharray="4 3"/>

        <rect x="52" y="262" width="416" height="46" fill="#eef4d3" stroke="#1c1512" stroke-width="2.5"/>
        <text x="260" y="284" text-anchor="middle" font-size="12.5" font-weight="700" fill="#3f6a14">${reg==='i'?'Honest B2 & B3 both compute majority("Attack", "Attack", "Hold") = ATTACK ✓':'All loyal nodes compute majority(Attack, Attack, Hold) = ATTACK ✓'}</text>
        <text x="260" y="300" text-anchor="middle" font-size="11" class="serif">${reg==='i'?'Even if Chief B1 is the liar, B2, B3, B4 exchange identical relay vectors!':'And if Commander B1 is Byzantine, loyal B2, B3, B4 receive the exact same relay multiset!'}</text>
      `;
      sayEl.textContent = reg === 'i'
        ? 'With 4 posts, every honest post collects 3 reports; the 2 honest reports always outvote the 1 liar.'
        : 'With N = 4 (3f + 1), each loyal lieutenant takes the majority of 3 values; at least 2 come from loyal nodes.';
    } else {
      svg.innerHTML = `
        <rect width="520" height="340" fill="#fffaf0"/>
        <text x="260" y="26" text-anchor="middle" font-size="12" font-weight="700" fill="#7a4fa0">${reg==='i'?'UNFORGEABLE WAX SEALS: TWO DIFFERENT SEALED ORDERS UNMASK A LYING CHIEF':'SIGNED MESSAGES SM(1): CRYPTOGRAPHIC SIGNATURES EXPOSE EQUIVOCATION'}</text>
        <rect x="82" y="88" width="156" height="90" fill="#fffaf0" stroke="#1c1512" stroke-width="2.5"/>
        <text x="160" y="114" text-anchor="middle" font-weight="700">"Attack"</text>
        <circle cx="160" cy="148" r="16" fill="#bf4a26" stroke="#1c1512" stroke-width="2"/><text x="160" y="152" text-anchor="middle" font-size="10" font-weight="700" fill="#fffaf0">SEAL B1</text>

        <rect x="282" y="88" width="156" height="90" fill="#fffaf0" stroke="#1c1512" stroke-width="2.5"/>
        <text x="360" y="114" text-anchor="middle" font-weight="700">"Hold"</text>
        <circle cx="360" cy="148" r="16" fill="#bf4a26" stroke="#1c1512" stroke-width="2"/><text x="360" y="152" text-anchor="middle" font-size="10" font-weight="700" fill="#fffaf0">SEAL B1</text>

        <rect x="56" y="218" width="408" height="62" fill="#eef4d3" stroke="#1c1512" stroke-width="2.5"/>
        <text x="260" y="244" text-anchor="middle" font-size="12.5" font-weight="700" fill="#3f6a14">${reg==='i'?'Honest posts relay every new sealed order → both B2 and B3 hold {Attack, Hold}':'Loyal nodes forward all valid signatures → both B2 and B3 obtain {Attack, Hold}'}</text>
        <text x="260" y="266" text-anchor="middle" font-size="11.5" class="serif">${reg==='i'?'Deterministic choice rule (e.g. pick first in alphabet) makes B2 and B3 agree even with 3 posts!':'Both apply deterministic choice({Attack, Hold}) and decide the exact same value!'}</text>
      `;
      sayEl.textContent = reg === 'i'
        ? 'With unforgeable wax seals, a lieutenant cannot forge the chief\'s seal, and a two-faced chief\'s two seals are shared among all honest posts.'
        : 'With digital signatures, lieutenants cannot forge the commander\'s signature, and any equivocation by the commander is relayed to all loyal nodes.';
    }
  }
};

// Book 10: Keeping Order Among Liars (PBFT)
STAGE_SIMS[10] = function(svg, btnsEl, sayEl){
  const s = stageState[10] || (stageState[10] = { ph: 2 });
  setWellBtns(btnsEl, [
    { k:'0', label: reg==='i'?'1. Pre-Prepare (Chief)':'1. Pre-Prepare', on: s.ph===0 },
    { k:'1', label: reg==='i'?'2. Prepare (2f+1 locks view)':'2. Prepare (2f+1 QC)', on: s.ph===1 },
    { k:'2', label: reg==='i'?'3. Commit (2f+1 across views)':'3. Commit (2f+1 settles)', on: s.ph===2 }
  ], k => { s.ph = Number(k); renderStage(); });

  const ph = s.ph;
  svg.innerHTML = `
    <rect width="520" height="340" fill="#fffaf0"/>
    <text x="260" y="26" text-anchor="middle" font-size="12" font-weight="700" fill="#7a4fa0">${reg==='i'?'PBFT ON 4 POSTS (N = 3f + 1, QUORUM = 2f + 1 = 3)':'PBFT THREE-PHASE PIPELINE (N = 4, f = 1, QUORUM = 3)'}</text>
    <!-- 3 phase columns -->
    <g transform="translate(24, 52)">
      <rect width="144" height="190" fill="${ph===0?'#f7e3a8':'#f8f1dc'}" stroke="#1c1512" stroke-width="${ph===0?3:2}"/>
      <text x="72" y="24" text-anchor="middle" font-weight="700" font-size="13">${reg==='i'?'1. Pre-Prepare':'1. Pre-Prepare'}</text>
      <circle cx="72" cy="72" r="18" fill="#a57fc0" stroke="#1c1512" stroke-width="2.5"/><text x="72" y="77" text-anchor="middle" font-weight="700">B1</text>
      <text x="72" y="118" text-anchor="middle" font-size="11.5" class="serif">${reg==='i'?'Chief proposes':'Primary assigns'}</text>
      <text x="72" y="135" text-anchor="middle" font-size="11.5" font-weight="700">${reg==='i'?'Slot #4 := OLIVE':'seq n = 4, v = OLIVE'}</text>
      <text x="72" y="168" text-anchor="middle" font-size="11" fill="#bf4a26">${reg==='i'?'Could still lie!':'Unverified proposal'}</text>
    </g>

    <g transform="translate(188, 52)">
      <rect width="144" height="190" fill="${ph===1?'#f7e3a8':'#f8f1dc'}" stroke="#1c1512" stroke-width="${ph===1?3:2}"/>
      <text x="72" y="24" text-anchor="middle" font-weight="700" font-size="13">${reg==='i'?'2. Prepare (2f+1)':'2. Prepare (2f+1)'}</text>
      <circle cx="42" cy="72" r="14" fill="#a57fc0" stroke="#1c1512" stroke-width="2"/>
      <circle cx="72" cy="72" r="14" fill="#9aa0a8" stroke="#1c1512" stroke-width="2"/>
      <circle cx="102" cy="72" r="14" fill="#e8964d" stroke="#1c1512" stroke-width="2"/>
      <text x="72" y="118" text-anchor="middle" font-size="11.5" class="serif">${reg==='i'?'Any two groups of 3':'Two quorums of 3'}</text>
      <text x="72" y="135" text-anchor="middle" font-size="11.5" font-weight="700">${reg==='i'?'share ≥1 honest post':'share ≥ f+1 = 2 nodes'}</text>
      <text x="72" y="168" text-anchor="middle" font-size="11" font-weight="700" fill="#3f6a14">${reg==='i'?'No split inside view':'Unique within view v'}</text>
    </g>

    <g transform="translate(352, 52)">
      <rect width="144" height="190" fill="${ph===2?'#eef4d3':'#f8f1dc'}" stroke="#1c1512" stroke-width="${ph===2?3:2}"/>
      <text x="72" y="24" text-anchor="middle" font-weight="700" font-size="13">${reg==='i'?'3. Commit (2f+1)':'3. Commit (2f+1)'}</text>
      <circle cx="42" cy="72" r="14" fill="#9aa0a8" stroke="#1c1512" stroke-width="2"/>
      <circle cx="72" cy="72" r="14" fill="#e8964d" stroke="#1c1512" stroke-width="2"/>
      <circle cx="102" cy="72" r="14" fill="#b07a55" stroke="#1c1512" stroke-width="2"/>
      <text x="72" y="118" text-anchor="middle" font-size="11.5" class="serif">${reg==='i'?'≥1 honest post holds':'≥1 honest node holds'}</text>
      <text x="72" y="135" text-anchor="middle" font-size="11.5" font-weight="700">${reg==='i'?'the Prepare bundle':'Prepared certificate'}</text>
      <text x="72" y="168" text-anchor="middle" font-size="11" font-weight="700" fill="#3f6a14">${reg==='i'?'Survives view change ✓':'Safe across views ✓'}</text>
    </g>

    <rect x="24" y="262" width="472" height="52" fill="#fffaf0" stroke="#1c1512" stroke-width="2.5"/>
    <text x="260" y="285" text-anchor="middle" font-size="12.5" font-weight="700">
      ${ph===0 ? (reg==='i'?'Step 1: Chief B1 proposes Slot #4, but a lying chief could send a second order to another post.':'Phase 1: Primary assigns sequence number; cannot be trusted alone.')
      : ph===1 ? (reg==='i'?'Step 2: Gathering 2f+1 = 3 Prepare slips proves no second order can also gather 3 in this view.':'Phase 2: 2f+1 Prepare messages guarantee uniqueness within the current view.')
      : (reg==='i'?'Step 3: Gathering 2f+1 = 3 Commit slips guarantees at least one honest post carries the lock into the next view!':'Phase 3: 2f+1 Commit messages ensure any future view-change quorum of 2f+1 intersects an honest prepared node.')}
    </text>
    <text x="260" y="303" text-anchor="middle" font-size="11" class="serif">${reg==='i'?'Caller waits for f + 1 = 2 matching replies so at least one comes from an honest post.':'Client waits for f + 1 = 2 matching replies.'}</text>
  `;

  sayEl.textContent = reg === 'i'
    ? 'Prepare bars two orders in the same view; Commit ensures that if anyone settles now, at least one honest post in every future 2f+1 view-change bundle already holds the Prepare certificate.'
    : 'Prepare ensures within-view agreement; Commit ensures cross-view persistence because any 2f+1 view-change quorum shares at least one honest node with the 2f+1 committers.';
};

// Book 11: Changing Leaders Among Liars (HotStuff)
STAGE_SIMS[11] = function(svg, btnsEl, sayEl){
  const s = stageState[11] || (stageState[11] = { topo: 'star' });
  setWellBtns(btnsEl, [
    { k:'mesh', label: reg==='i'?'All-to-all storm (N² slips)':'PBFT all-to-all O(N²)', on: s.topo==='mesh' },
    { k:'star', label: reg==='i'?'Star + 3-chain (Linear O(N))':'HotStuff star + 3-chain O(N)', on: s.topo==='star' }
  ], k => { s.topo = k; renderStage(); });

  const isStar = s.topo === 'star';
  svg.innerHTML = `
    <rect width="520" height="340" fill="#fffaf0"/>
    <!-- Left: Communication pattern -->
    <g transform="translate(20, 40)">
      <rect width="210" height="260" fill="#f8f1dc" stroke="#1c1512" stroke-width="2.5"/>
      <text x="105" y="24" text-anchor="middle" font-size="12" font-weight="700" fill="#7a4fa0">${isStar?(reg==='i'?'STAR: O(N) THROUGH CHIEF':'STAR TOPOLOGY: O(N) MSGS'):(reg==='i'?'MESH: N² SLIPS EVERY STEP':'ALL-TO-ALL MESH: O(N²) MSGS')}</text>
      ${!isStar ? `
        <line x1="105" y1="68" x2="48" y2="140" stroke="#bf4a26" stroke-width="2"/>
        <line x1="105" y1="68" x2="162" y2="140" stroke="#bf4a26" stroke-width="2"/>
        <line x1="105" y1="68" x2="105" y2="205" stroke="#bf4a26" stroke-width="2"/>
        <line x1="48" y1="140" x2="162" y2="140" stroke="#bf4a26" stroke-width="2"/>
        <line x1="48" y1="140" x2="105" y2="205" stroke="#bf4a26" stroke-width="2"/>
        <line x1="162" y1="140" x2="105" y2="205" stroke="#bf4a26" stroke-width="2"/>
      ` : `
        <line x1="105" y1="68" x2="48" y2="148" stroke="#3f7a2a" stroke-width="3"/>
        <line x1="105" y1="68" x2="105" y2="195" stroke="#3f7a2a" stroke-width="3"/>
        <line x1="105" y1="68" x2="162" y2="148" stroke="#3f7a2a" stroke-width="3"/>
      `}
      <circle cx="105" cy="68" r="17" fill="#a57fc0" stroke="#1c1512" stroke-width="2.5"/><text x="105" y="73" text-anchor="middle" font-weight="700" font-size="12">B1</text>
      <circle cx="48" cy="148" r="15" fill="#9aa0a8" stroke="#1c1512" stroke-width="2.5"/><text x="48" y="153" text-anchor="middle" font-weight="700" font-size="11">B2</text>
      <circle cx="162" cy="148" r="15" fill="#e8964d" stroke="#1c1512" stroke-width="2.5"/><text x="162" y="153" text-anchor="middle" font-weight="700" font-size="11">B3</text>
      <circle cx="105" cy="198" r="15" fill="#b07a55" stroke="#1c1512" stroke-width="2.5"/><text x="105" y="203" text-anchor="middle" font-weight="700" font-size="11">B4</text>
      <text x="105" y="242" text-anchor="middle" font-size="11.5" font-weight="700">${isStar?(reg==='i'?'1 combined seal (QC) per step':'1 threshold QC per phase'):(reg==='i'?'Every post mails every post':'Quadratic message broadcast')}</text>
    </g>

    <!-- Right: Three-Chain Pipeline -->
    <g transform="translate(248, 40)">
      <rect width="252" height="260" fill="#eef4d3" stroke="#1c1512" stroke-width="2.5"/>
      <text x="126" y="24" text-anchor="middle" font-size="12" font-weight="700" fill="#3f6a14">${reg==='i'?'THE THREE-LINK CHAIN (B1 SETTLED)':'THREE-CHAIN COMMIT RULE'}</text>
      <rect x="20" y="58" width="60" height="54" fill="#9cb648" stroke="#1c1512" stroke-width="2.5"/>
      <text x="50" y="82" text-anchor="middle" font-weight="700" font-size="12">Block 1</text>
      <text x="50" y="99" text-anchor="middle" font-size="10" font-weight="700">SETTLED</text>

      <rect x="96" y="58" width="60" height="54" fill="#e0b84a" stroke="#1c1512" stroke-width="2.5"/>
      <text x="126" y="82" text-anchor="middle" font-weight="700" font-size="12">Block 2</text>
      <text x="126" y="99" text-anchor="middle" font-size="10" font-weight="700">LOCKED</text>

      <rect x="172" y="58" width="60" height="54" fill="#d9c6ec" stroke="#1c1512" stroke-width="2.5"/>
      <text x="202" y="82" text-anchor="middle" font-weight="700" font-size="12">Block 3</text>
      <text x="202" y="99" text-anchor="middle" font-size="10" font-weight="700">PREP QC</text>

      <path d="M96 85 H80 M172 85 H156" stroke="#1c1512" stroke-width="3"/>
      <text x="126" y="148" text-anchor="middle" font-size="11.5" class="serif">${reg==='i'?'Each block carries the QC of':'Each block header carries a'}</text>
      <text x="126" y="165" text-anchor="middle" font-size="11.5" class="serif">${reg==='i'?'its parent → 3 links settle Block 1':'QC for its parent → 3-chain commits'}</text>
      <rect x="20" y="190" width="212" height="48" fill="#fffaf0" stroke="#1c1512" stroke-width="2"/>
      <text x="126" y="211" text-anchor="middle" font-size="11.5" font-weight="700">${reg==='i'?'New chief picks highest QC':'New leader picks highest QC'}</text>
      <text x="126" y="228" text-anchor="middle" font-size="11" fill="#3f6a14" font-weight="700">${reg==='i'?'View change costs only O(N) slips!':'Linear O(N) view change!'}</text>
    </g>
  `;

  sayEl.textContent = isStar
    ? (reg==='i'
        ? 'Instead of every post mailing every other post, votes go only to the chief, who bundles 2f+1 seals into one QC; three chained QCs lock and settle.'
        : 'HotStuff routes votes through the leader into a threshold QC and uses a uniform three-chain so view changes need only the highest QC in O(N) messages.')
    : (reg==='i'
        ? 'In classical two-stage BFT, every post broadcasts to every other post (N² slips), and changing chiefs requires heavy certificate bundles.'
        : 'In two-phase PBFT, all-to-all Prepare/Commit rounds cost O(N²) messages and view changes require broadcasting prepared certificates.');
};

// Book 12: The Part-Time Parliament (Paxos)
STAGE_SIMS[12] = function(svg, btnsEl, sayEl){
  const s = stageState[12] || (stageState[12] = { step: 1 });
  setWellBtns(btnsEl, [
    { k:'0', label: reg==='i'?'1. Ballot #2 passes "OLIVE"':'1. Ballot 2 chosen ({Α,Β,Γ})', on: s.step===0 },
    { k:'1', label: reg==='i'?'2. Ballot #5 prepares ({Γ,Δ,Ε})':'2. Ballot 5 Prepare ({Γ,Δ,Ε})', on: s.step===1 }
  ], k => { s.step = Number(k); renderStage(); });

  svg.innerHTML = `
    <rect width="520" height="340" fill="#fffaf0"/>
    <text x="260" y="26" text-anchor="middle" font-size="12" font-weight="700" fill="#136f9e">${reg==='i'?'THE CHAMBER OF 5 PRIESTS: ANY TWO MAJORITIES OF 3 SHARE AT LEAST ONE PRIEST':'PAXOS SYNOD (N = 5 ACCEPTORS): QUORUM INTERSECTION AT Γ'}</text>

    <!-- Quorum 1 ellipse (Alpha, Beta, Gamma) & Quorum 2 ellipse (Gamma, Delta, Epsilon) -->
    <ellipse cx="195" cy="145" rx="145" ry="62" fill="#2e88b5" fill-opacity=".18" stroke="#136f9e" stroke-width="2.5"/>
    <text x="115" y="74" text-anchor="middle" font-size="11.5" font-weight="700" fill="#136f9e">${reg==='i'?'Ballot #2 Majority {Α, Β, Γ}':'Ballot 2 Quorum Q₁ = {Α, Β, Γ}'}</text>

    <ellipse cx="325" cy="145" rx="145" ry="62" fill="#e0b84a" fill-opacity="${s.step===1?'.28':'.1'}" stroke="#b5602c" stroke-width="2.5" stroke-dasharray="${s.step===1?'none':'5 3'}"/>
    <text x="405" y="74" text-anchor="middle" font-size="11.5" font-weight="700" fill="#b5602c">${reg==='i'?'Ballot #5 Majority {Γ, Δ, Ε}':'Ballot 5 Quorum Q₂ = {Γ, Δ, Ε}'}</text>

    <!-- 5 Priests -->
    ${[
      { g:'Α', x:90, c:'#e0b84a', v:'#2: OLIVE' },
      { g:'Β', x:175, c:'#5b9be0', v:'#2: OLIVE' },
      { g:'Γ', x:260, c:'#e2564e', v:'#2: OLIVE', overlap:true },
      { g:'Δ', x:345, c:'#9cb648', v: s.step===1?'Promised #5':'—' },
      { g:'Ε', x:430, c:'#b58be0', v: s.step===1?'Promised #5':'—' }
    ].map(p => `
      <g transform="translate(${p.x}, 145)">
        ${p.overlap ? `<circle r="31" fill="none" stroke="#bf4a26" stroke-width="3.5"/>` : ''}
        <circle r="23" fill="${p.c}" stroke="#1c1512" stroke-width="3"/>
        <text y="6" text-anchor="middle" font-size="16" font-weight="700">${p.g}</text>
        <rect x="-38" y="30" width="76" height="22" fill="#fffaf0" stroke="#1c1512" stroke-width="1.8"/>
        <text y="45" text-anchor="middle" font-size="10.5" font-weight="700">${p.v}</text>
      </g>
    `).join('')}

    <rect x="34" y="238" width="452" height="72" rx="4" fill="#eef4d3" stroke="#1c1512" stroke-width="2.5"/>
    <text x="260" y="264" text-anchor="middle" font-size="13" font-weight="700" fill="#3f6a14">
      ${s.step===0
        ? (reg==='i'?'Ballot #2 writes "OLIVE" into the ledgers of Priests Α, Β, and Γ.':'Ballot 2 gets "OLIVE" accepted by majority Q₁ = {Α, Β, Γ}.')
        : (reg==='i'?'Priest Γ sits in BOTH majorities and reports "#2: OLIVE" → Ballot #5 MUST propose "OLIVE"!':'Acceptor Γ ∈ Q₁ ∩ Q₂ reports (#2, OLIVE) in Phase 1b → Ballot 5 is forced by P2c to propose OLIVE!')}
    </text>
    <text x="260" y="288" text-anchor="middle" font-size="11.5" class="serif">
      ${reg==='i'?'Rule of the highest ballot: a new president must propose the highest-numbered decree reported in Phase 1.':'Paxos Invariant P2c: if v is chosen at ballot b, every higher ballot proposes v.'}
    </text>
  `;

  sayEl.textContent = s.step === 0
    ? (reg==='i'
        ? 'Three of the five priests (Α, Β, Γ) accept Ballot #2 ("OLIVE"). Click step 2 to see what happens when a later president starts Ballot #5.'
        : 'Ballot 2 is accepted by a majority {Α, Β, Γ}. Click step 2 to see how Phase 1 of Ballot 5 discovers it.')
    : (reg==='i'
        ? 'Even though Α and Β have wandered out, Ballot #5\'s majority {Γ, Δ, Ε} shares Priest Γ, who reports Ballot #2 ("OLIVE") and locks Ballot #5 onto the same decree.'
        : 'Any majority Q₂ = {Γ, Δ, Ε} intersects Q₁ at Γ, whose Phase 1b promise carries (#2, OLIVE) forward into Ballot 5.');
};

// Book 13: One Leader at a Time (Viewstamped Replication)
STAGE_SIMS[13] = function(svg, btnsEl, sayEl){
  const s = stageState[13] || (stageState[13] = { view: 1 });
  setWellBtns(btnsEl, [
    { k:'1', label: reg==='i'?'View 1: Okios at podium':'View 1: Primary Okios', on: s.view===1 },
    { k:'2', label: reg==='i'?'View 2: Liskovia takes podium':'View 2: View Change to Liskovia', on: s.view===2 },
    { k:'stale', label: reg==='i'?'Why old speaker cannot answer alone':'Why deposed primary must check quorum', on: s.view===3 }
  ], k => { s.view = k==='stale' ? 3 : Number(k); renderStage(); });

  const v = s.view;
  svg.innerHTML = `
    <rect width="520" height="340" fill="#fffaf0"/>
    <text x="260" y="26" text-anchor="middle" font-size="12" font-weight="700" fill="#9e7210">${reg==='i'?'THE THOLOS OF 5 LEGISLATORS: ONE PODIUM, MAJORITY WITNESSES':'VIEWSTAMPED REPLICATION (OKI & LISKOV 1988)'}</text>

    <!-- Round Tholos ring -->
    <circle cx="170" cy="170" r="92" fill="#f8f1dc" stroke="#c8961c" stroke-width="3"/>
    ${[
      { nm:'Okios', a:-90, c:'#8fa3b8', log:'[1:A, 2:B]', lead: v===1 },
      { nm:'Liskovia', a:-18, c:'#e8b03a', log: v>=2?'[1:A, 2:B, 3:C]':'[1:A, 2:B]', lead: v>=2 },
      { nm:'Kleon', a:54, c:'#8fb35a', log: v>=2?'[1:A, 2:B, 3:C]':'[1:A, 2:B]' },
      { nm:'Melissa', a:126, c:'#cf5a4a', log: v>=2?'[1:A, 2:B, 3:C]':'[1:A]' },
      { nm:'Theron', a:198, c:'#b3aea4', log:'[1:A]' }
    ].map(p => {
      const rad = p.a * Math.PI / 180;
      const x = Math.round(170 + 82 * Math.cos(rad));
      const y = Math.round(170 + 82 * Math.sin(rad));
      return `<g transform="translate(${x},${y})">
        ${p.lead ? `<circle r="26" fill="none" stroke="#bf4a26" stroke-width="3.5"/>` : ''}
        <circle r="19" fill="${p.c}" stroke="#1c1512" stroke-width="2.5"/>
        <text y="4" text-anchor="middle" font-size="10" font-weight="700">${p.nm}</text>
      </g>`;
    }).join('')}
    <text x="170" y="166" text-anchor="middle" font-size="13" font-weight="700">${v===1?'VIEW 1':'VIEW 2'}</text>
    <text x="170" y="184" text-anchor="middle" font-size="11" class="serif">${v===1?(reg==='i'?'Speaker: Okios':'Primary: Okios'):(reg==='i'?'Speaker: Liskovia':'Primary: Liskovia')}</text>

    <!-- Right side explanation card -->
    <rect x="296" y="58" width="200" height="224" fill="${v===3?'#fbe7de':'#eef4d3'}" stroke="#1c1512" stroke-width="2.5"/>
    <text x="396" y="86" text-anchor="middle" font-weight="700" font-size="13">
      ${v===1 ? (reg==='i'?'Fast Normal Step':'1-RTT Normal Case')
      : v===2 ? (reg==='i'?'View Change Rule':'Majority View Change')
      : (reg==='i'?'The Porch Trap':'Deposed Primary Hazard')}
    </text>
    <text x="396" y="120" text-anchor="middle" font-size="11.5" class="serif">
      ${v===1 ? (reg==='i'?'Okios assigns slot #2 and':'Primary orders op #2 and')
      : v===2 ? (reg==='i'?'3 of 5 seal View 1; Liskovia':'3/5 DoViewChange quorum')
      : (reg==='i'?'Cut-off Okios still thinks':'Partitioned Okios still thinks')}
    </text>
    <text x="396" y="138" text-anchor="middle" font-size="11.5" class="serif">
      ${v===1 ? (reg==='i'?'commits once 3 seats witness it.':'commits after f+1 backup acks.')
      : v===2 ? (reg==='i'?'adopts the longest log [1:A,2:B].':'picks log with highest (v, op).')
      : (reg==='i'?'it is View 1 after View 2 opened!':'he is primary in View 1!')}
    </text>
    <rect x="314" y="168" width="164" height="52" fill="#fffaf0" stroke="#1c1512" stroke-width="2"/>
    <text x="396" y="191" text-anchor="middle" font-size="11.5" font-weight="700" fill="${v===3?'#bf4a26':'#3f6a14'}">
      ${v===1 ? 'Log: [1:A, 2:B] ✓' : v===2 ? 'Log: [1:A, 2:B, 3:C] ✓' : (reg==='i'?'Reads must check majority!':'Reads need quorum / lease!')}
    </text>
    <text x="396" y="209" text-anchor="middle" font-size="10.5">${v===3?(reg==='i'?'Local read misses 3:C':'Local read is stale'):(reg==='i'?'Overlap preserves every slot':'Prefix preserved across views')}</text>
  `;

  sayEl.textContent = v === 1
    ? (reg==='i'
        ? 'While Okios holds the podium in View 1, no prepare phase is needed: one round-trip to a majority of witnesses settles each entry.'
        : 'In View 1, Primary Okios orders operations directly in a single round-trip to a majority of replicas.')
    : v === 2
    ? (reg==='i'
        ? 'When Okios stalls, 3 of 5 legislators seal View 1 and hand the podium to Liskovia with the most up-to-date tablet.'
        : 'On view change, a majority of 3 replicas seals View 1 and transfers the longest latest-view log to Liskovia.')
    : (reg==='i'
        ? 'If cut-off Okios answers a reader from his own memory without checking a majority, he misses entry 3:C already passed in View 2.'
        : 'A partitioned old primary cannot serve linearizable reads locally because a majority may have already advanced to View 2.');
};

// Book 14: Spreading by Word of Mouth (Epidemic Gossip & Anti-Entropy)
STAGE_SIMS[14] = function(svg, btnsEl, sayEl){
  const s = stageState[14] || (stageState[14] = { r: 2, tomb: true });
  setWellBtns(btnsEl, [
    { k:'step', label: reg==='i'?'Gossip 1 round':'Run 1 gossip round', on: false },
    { k:'ae', label: reg==='i'?'Nightly anti-entropy (100%)':'Anti-entropy sweep (100%)', on: s.r===4 },
    { k:'tomb', label: reg==='i'?(s.tomb?'Death notice: ON':'Death notice: OFF (Zombie!)'):(s.tomb?'Tombstone: ON':'Tombstone: OFF (Resurrection!)'), on: s.tomb }
  ], k => {
    if(k==='step') s.r = (s.r % 3) + 1;
    if(k==='ae') s.r = 4;
    if(k==='tomb') s.tomb = !s.tomb;
    renderStage();
  });

  const counts = [1, 4, 10, 12, 12][s.r];
  svg.innerHTML = `
    <rect width="520" height="340" fill="#fffaf0"/>
    <text x="260" y="26" text-anchor="middle" font-size="12" font-weight="700" fill="#2a7b6f">${reg==='i'?`COASTAL LIBRARIES: ${counts} OF 12 HOLD THE NEW ENTRY (ROUND ${s.r})`:`EPIDEMIC DISSEMINATION: ${counts} / 12 REPLICAS INFORMED`}</text>

    <!-- 12 coastal libraries in 2 rows of 6 -->
    ${Array.from({length:12}, (_, i) => {
      const col = i % 6, row = Math.floor(i / 6);
      const x = 64 + col * 78, y = 86 + row * 82;
      const has = i < counts;
      return `<g transform="translate(${x},${y})">
        <circle r="22" fill="${has?'#2a7b6f':'#fffaf0'}" stroke="#1c1512" stroke-width="2.5"/>
        <text y="5" text-anchor="middle" font-size="11.5" font-weight="700" fill="${has?'#fffaf0':'#1c1512'}">L${i+1}</text>
      </g>`;
    }).join('')}

    <!-- Deletion / Death Notice Box -->
    <rect x="34" y="220" width="452" height="92" rx="4" fill="${s.tomb?'#eef4d3':'#fbe7de'}" stroke="#1c1512" stroke-width="2.5"/>
    <text x="260" y="246" text-anchor="middle" font-size="12.5" font-weight="700" fill="${s.tomb?'#3f6a14':'#bf4a26'}">
      ${s.tomb
        ? (reg==='i'?'Withdrawn scroll carries a dated Death Notice → never rises from the dead ✓':'Deletion recorded as timestamped Tombstone → prevents resurrection on merge ✓')
        : (reg==='i'?'Scroll erased without a Death Notice → an old copy from a neighbor brings it back to life! ✗':'Silent deletion without Tombstone → anti-entropy resurrects deleted item from lagging peer! ✗')}
    </text>
    <text x="260" y="270" text-anchor="middle" font-size="11.5" class="serif">
      ${s.r===4
        ? (reg==='i'?'Anti-entropy tablet comparison catches the last straggler (12 / 12).':'Anti-entropy checksum exchange guarantees 100% convergence.')
        : (reg==='i'?'Hot rumor mongering spreads in O(log N) steps; pull converges quadratically faster near the end.':'Rumor mongering reaches nearly all nodes in O(log N) rounds; pull achieves O(log log N) tail.')}
    </text>
    <text x="260" y="294" text-anchor="middle" font-size="11" font-weight="700">${reg==='i'?'Zero waiting · works across any cut · eventual convergence':'Wait-free · partition-tolerant · eventually consistent'}</text>
  `;

  sayEl.textContent = !s.tomb
    ? (reg==='i'
        ? 'If you simply scrape a title off your tablet, the next neighbor who hasn\'t heard will copy the old title right back onto your shelf!'
        : 'Deleting an entry without a tombstone causes anti-entropy to re-insert it from any replica that still holds the older version.')
    : (reg==='i'
        ? 'Rumor mongering spreads new scrolls rapidly by word of mouth, while background tablet comparisons (anti-entropy) catch every last library.'
        : 'Epidemic push/pull spreads updates rapidly while background anti-entropy reconciles any remaining stragglers.');
};

// Book 15: Probably Up to Date (PBS)
STAGE_SIMS[15] = function(svg, btnsEl, sayEl){
  const s = stageState[15] || (stageState[15] = { cfg: 'w1r1', rounds: 1 });
  setWellBtns(btnsEl, [
    { k:'w1r1', label: 'N=3, W=1, R=1', on: s.cfg==='w1r1' },
    { k:'w2r1', label: 'N=3, W=2, R=1', on: s.cfg==='w2r1' },
    { k:'w2r2', label: 'N=3, W=2, R=2 (Strict)', on: s.cfg==='w2r2' },
    { k:'tick', label: reg==='i'?`After ${s.rounds} gossip wave(s)`:`t = ${s.rounds} round(s)`, on: false }
  ], k => {
    if(k==='tick') s.rounds = (s.rounds % 3) + 1;
    else s.cfg = k;
    renderStage();
  });

  const baseP = s.cfg==='w2r2' ? 1.0 : (s.cfg==='w2r1' ? 0.667 : 0.333);
  const p0 = s.cfg==='w2r2' ? 100 : Math.round(baseP * 100);
  const p1 = s.cfg==='w2r2' ? 100 : Math.min(99, Math.round((1 - Math.pow(1 - baseP, s.rounds + 1)) * 100));
  const p2 = s.cfg==='w2r2' ? 100 : Math.min(100, Math.round((1 - Math.pow(1 - baseP, s.rounds + 3)) * 100));

  svg.innerHTML = `
    <rect width="520" height="340" fill="#fffaf0"/>
    <text x="260" y="26" text-anchor="middle" font-size="12" font-weight="700" fill="#2a7b6f">${reg==='i'?`CHANCE OF FRESHNESS FOR ${s.cfg.toUpperCase()} ON N = 3 KEEPERS`:`PROBABILISTICALLY BOUNDED STALENESS (${s.cfg.toUpperCase()}, N = 3)`}</text>

    <!-- 3 Bars showing probability at t=0, after 1 wave, after 2 waves -->
    ${[
      { lbl: reg==='i'?'Immediate (t = 0)':'Immediate (t = 0)', pct: p0, c:'#e0b84a' },
      { lbl: reg==='i'?`After ${s.rounds} wave(s)`:`After ${s.rounds} Δ`, pct: p1, c:'#8fb35a' },
      { lbl: reg==='i'?'Within k=2 versions':'k ≤ 2 versions', pct: p2, c:'#2a7b6f' }
    ].map((b, i) => {
      const x = 68 + i * 140;
      const h = Math.round(b.pct * 1.65);
      const y = 235 - h;
      return `<g>
        <rect x="${x}" y="${y}" width="84" height="${h}" fill="${b.c}" stroke="#1c1512" stroke-width="2.5"/>
        <text x="${x+42}" y="${y-10}" text-anchor="middle" font-size="16" font-weight="700">${b.pct}%</text>
        <text x="${x+42}" y="256" text-anchor="middle" font-size="11.5" font-weight="700">${b.lbl}</text>
      </g>`;
    }).join('')}
    <line x1="42" y1="235" x2="478" y2="235" stroke="#1c1512" stroke-width="2.5"/>

    <rect x="42" y="274" width="436" height="44" fill="#f8f1dc" stroke="#1c1512" stroke-width="2"/>
    <text x="260" y="301" text-anchor="middle" font-size="12" font-weight="700">
      ${s.cfg==='w2r2'
        ? (reg==='i'?'W + R = 4 > 3: Every read overlaps the write group immediately (100% fresh).':'Strict quorum W + R > N: zero staleness probability at t = 0.')
        : (reg==='i'?`W + R ≤ 3: ${p0}% fresh at t = 0, rising to ${p1}% once background copies land.`:`Partial quorum W + R ≤ N: ${p0}% immediate overlap, ${p1}% after background propagation.`)}
    </text>
  `;

  sayEl.textContent = reg === 'i'
    ? 'Even when W + R ≤ N cannot promise overlap on the first instant, counting how fast the remaining copies land tells you the exact odds of a fresh read.'
    : 'PBS replaces binary quorum intersection with a quantitative trade-off between tail latency (W, R) and bounded (k, Δ)-staleness probability.';
};

// Book 16: Changes That Never Clash (CRDTs)
STAGE_SIMS[16] = function(svg, btnsEl, sayEl){
  const s = stageState[16] || (stageState[16] = { a: 2, b: 1, rem: false });
  setWellBtns(btnsEl, [
    { k:'incA', label: reg==='i'?'Library A +1':'Increment A (+1)', on: false },
    { k:'incB', label: reg==='i'?'Library B +1':'Increment B (+1)', on: false },
    { k:'set', label: reg==='i'?(s.rem?'OR-Set: Add & Remove':'Counter Lattice'):(s.rem?'OR-Set: Concurrent Add/Remove':'G-Counter Lattice'), on: s.rem }
  ], k => {
    if(k==='incA') s.a = (s.a % 5) + 1;
    if(k==='incB') s.b = (s.b % 5) + 1;
    if(k==='set') s.rem = !s.rem;
    renderStage();
  });

  if(!s.rem){
    const tot = s.a + s.b + 1;
    svg.innerHTML = `
      <rect width="520" height="340" fill="#fffaf0"/>
      <text x="260" y="26" text-anchor="middle" font-size="12" font-weight="700" fill="#2a7b6f">${reg==='i'?'JOIN-SEMILATTICE MERGE: SLOT-BY-SLOT MAX NEVER LOSES AN ADDITION':'STATE-BASED G-COUNTER CRDT: MERGE VIA COMPONENTWISE MAX (LUB)'}</text>

      <!-- Replica A and Replica B at bottom, Merged at top -->
      <g transform="translate(54, 182)">
        <rect width="160" height="74" fill="#f7e3a8" stroke="#1c1512" stroke-width="2.5"/>
        <text x="80" y="24" text-anchor="middle" font-weight="700">Library A</text>
        <text x="80" y="52" text-anchor="middle" font-size="15" font-weight="700">[${s.a}, 0, 1]</text>
      </g>
      <g transform="translate(306, 182)">
        <rect width="160" height="74" fill="#e9f2f7" stroke="#1c1512" stroke-width="2.5"/>
        <text x="80" y="24" text-anchor="middle" font-weight="700">Library B</text>
        <text x="80" y="52" text-anchor="middle" font-size="15" font-weight="700">[1, ${s.b}, 1]</text>
      </g>

      <line x1="134" y1="182" x2="230" y2="124" stroke="#1c1512" stroke-width="3"/>
      <line x1="386" y1="182" x2="290" y2="124" stroke="#1c1512" stroke-width="3"/>

      <g transform="translate(155, 48)">
        <rect width="210" height="78" fill="#eef4d3" stroke="#1c1512" stroke-width="3"/>
        <text x="105" y="24" text-anchor="middle" font-weight="700" fill="#3f6a14">${reg==='i'?'Merged Tablet (max per slot)':'Least Upper Bound (A ⊔ B)'}</text>
        <text x="105" y="50" text-anchor="middle" font-size="16" font-weight="700">[${Math.max(s.a,1)}, ${s.b}, 1] → Sum = ${Math.max(s.a,1)+s.b+1}</text>
        <text x="105" y="68" text-anchor="middle" font-size="10.5" class="serif">A ⊔ B = B ⊔ A = (A ⊔ B) ⊔ B</text>
      </g>

      <text x="260" y="302" text-anchor="middle" font-size="12" font-weight="700">${reg==='i'?'Order does not matter, and receiving the same tablet twice changes nothing!':'Commutative, Associative, and Idempotent → Strong Eventual Consistency ✓'}</text>
    `;
    sayEl.textContent = reg === 'i'
      ? 'Because each library only raises its own slot and merges by taking the larger number per slot, concurrent counts never overwrite each other.'
      : 'Because updates are inflation-only on a join-semilattice and merge computes the Least Upper Bound, replicas converge without coordination.';
  } else {
    svg.innerHTML = `
      <rect width="520" height="340" fill="#fffaf0"/>
      <text x="260" y="26" text-anchor="middle" font-size="12" font-weight="700" fill="#2a7b6f">${reg==='i'?'OBSERVED-REMOVE SET: UNIQUE TOKENS LET CONCURRENT ADD BEAT REMOVE':'OR-SET (ADD-WINS): REMOVE ONLY TOMBSTONES OBSERVED TAGS'}</text>
      <rect x="34" y="62" width="205" height="115" fill="#f7e3a8" stroke="#1c1512" stroke-width="2.5"/>
      <text x="136" y="88" text-anchor="middle" font-weight="700">${reg==='i'?'Library A: Withdraws "Iliad"':'Replica A: Remove("Iliad")'}</text>
      <text x="136" y="116" text-anchor="middle" font-size="12">${reg==='i'?'Crosses out seen tag τ₁':'Tombstones observed tag τ₁'}</text>
      <text x="136" y="142" text-anchor="middle" font-size="11.5" font-weight="700" fill="#bf4a26">Tombstone: {τ₁}</text>

      <rect x="281" y="62" width="205" height="115" fill="#eef4d3" stroke="#1c1512" stroke-width="2.5"/>
      <text x="383" y="88" text-anchor="middle" font-weight="700">${reg==='i'?'Library B: Adds "Iliad"':'Replica B: Add("Iliad")'}</text>
      <text x="383" y="116" text-anchor="middle" font-size="12">${reg==='i'?'Stamps fresh token τ₂':'Generates fresh unique tag τ₂'}</text>
      <text x="383" y="142" text-anchor="middle" font-size="11.5" font-weight="700" fill="#3f6a14">Active: {("Iliad", τ₂)}</text>

      <rect x="70" y="206" width="380" height="82" fill="#eef4d3" stroke="#1c1512" stroke-width="3"/>
      <text x="260" y="234" text-anchor="middle" font-weight="700" font-size="13.5" fill="#3f6a14">${reg==='i'?'Merged Shelf: τ₁ is crossed out, but fresh τ₂ survives → "Iliad" stays!':'Merged State: Tags = {τ₁, τ₂} \\ {τ₁} = {τ₂} → "Iliad" present ✓'}</text>
      <text x="260" y="260" text-anchor="middle" font-size="11.5" class="serif">${reg==='i'?'Both libraries reach the exact same shelf regardless of message order.':'Add-wins semantics: concurrent add and remove commute deterministically.'}</text>
    `;
    sayEl.textContent = reg === 'i'
      ? 'Tagging each addition with a unique token means a withdrawal only cancels tokens it actually saw—so a concurrent addition with a fresh token survives everywhere.'
      : 'In an Observed-Remove Set (OR-Set), Remove(x) only removes unique tags observed at the source, allowing concurrent Add(x) with a new tag to win cleanly.';
  }
};

// Book 17: What You Can Promise Alone (HATs)
STAGE_SIMS[17] = function(svg, btnsEl, sayEl){
  const s = stageState[17] || (stageState[17] = { tab: 'hat' });
  setWellBtns(btnsEl, [
    { k:'hat', label: reg==='i'?'Can promise alone (HATs)':'Achievable with High Availability', on: s.tab==='hat' },
    { k:'no', label: reg==='i'?'Must wait across cuts':'Impossible without coordination', on: s.tab==='no' }
  ], k => { s.tab = k; renderStage(); });

  const isHat = s.tab === 'hat';
  svg.innerHTML = `
    <rect width="520" height="340" fill="#fffaf0"/>
    <text x="260" y="26" text-anchor="middle" font-size="12" font-weight="700" fill="#2a7b6f">${reg==='i'?'THE LINE BETWEEN BUNDLED VISITS THAT NEVER WAIT AND THOSE THAT MUST':'HIGHLY AVAILABLE TRANSACTIONS (BAILIS ET AL. 2014)'}</text>

    <!-- Left column: Achievable Alone -->
    <g transform="translate(22, 48)">
      <rect width="228" height="248" fill="${isHat?'#eef4d3':'#f8f1dc'}" stroke="#1c1512" stroke-width="${isHat?3.5:2}"/>
      <text x="114" y="26" text-anchor="middle" font-weight="700" font-size="13" fill="#3f6a14">${reg==='i'?'PROMISED ALONE (WAIT-FREE)':'HIGHLY AVAILABLE (HAT)'}</text>
      <rect x="16" y="44" width="196" height="52" fill="#fffaf0" stroke="#1c1512" stroke-width="2"/>
      <text x="114" y="65" text-anchor="middle" font-weight="700" font-size="12">${reg==='i'?'No Unsealed Drafts':'Read Committed'}</text>
      <text x="114" y="83" text-anchor="middle" font-size="11" class="serif">${reg==='i'?'Never read an uncommitted slip':'No dirty reads or dirty writes'}</text>

      <rect x="16" y="108" width="196" height="52" fill="#fffaf0" stroke="#1c1512" stroke-width="2"/>
      <text x="114" y="129" text-anchor="middle" font-weight="700" font-size="12">${reg==='i'?'All of a Bundle or None':'Monotonic Atomic View (MAV)'}</text>
      <text x="114" y="147" text-anchor="middle" font-size="11" class="serif">${reg==='i'?'Once seen, a bundle stays whole':'No fractured reads across keys'}</text>

      <rect x="16" y="172" width="196" height="56" fill="#fffaf0" stroke="#1c1512" stroke-width="2"/>
      <text x="114" y="193" text-anchor="middle" font-weight="700" font-size="12">${reg==='i'?'Cause Before Effect':'Causal+ Transactions'}</text>
      <text x="114" y="211" text-anchor="middle" font-size="11" class="serif">${reg==='i'?'Reveal bundle after its causes':'Causal dependencies + convergent merge'}</text>
    </g>

    <!-- Right column: Impossible Alone -->
    <g transform="translate(270, 48)">
      <rect width="228" height="248" fill="${!isHat?'#fbe7de':'#f8f1dc'}" stroke="#1c1512" stroke-width="${!isHat?3.5:2}"/>
      <text x="114" y="26" text-anchor="middle" font-weight="700" font-size="13" fill="#bf4a26">${reg==='i'?'CANNOT PROMISE ALONE':'REQUIRES COORDINATION'}</text>
      <rect x="16" y="44" width="196" height="52" fill="#fffaf0" stroke="#1c1512" stroke-width="2"/>
      <text x="114" y="65" text-anchor="middle" font-weight="700" font-size="12">${reg==='i'?'Unique Title / Last Coin':'Snapshot Isolation / Write Skew'}</text>
      <text x="114" y="83" text-anchor="middle" font-size="11" class="serif">${reg==='i'?'Two sides claim same name':'Preventing concurrent write conflicts'}</text>

      <rect x="16" y="108" width="196" height="52" fill="#fffaf0" stroke="#1c1512" stroke-width="2"/>
      <text x="114" y="129" text-anchor="middle" font-weight="700" font-size="12">${reg==='i'?'One Global Line of Visits':'Strict Serializability'}</text>
      <text x="114" y="147" text-anchor="middle" font-size="11" class="serif">${reg==='i'?'Total order across all shelves':'Global total order of transactions'}</text>

      <rect x="16" y="172" width="196" height="56" fill="#fffaf0" stroke="#1c1512" stroke-width="2"/>
      <text x="114" y="193" text-anchor="middle" font-weight="700" font-size="12">${reg==='i'?'Latest Across Every House':'Recency / External Consistency'}</text>
      <text x="114" y="211" text-anchor="middle" font-size="11" class="serif">${reg==='i'?'Seeing a write made on the far side':'Linearizable real-time reads'}</text>
    </g>
  `;

  sayEl.textContent = isHat
    ? (reg==='i'
        ? 'By sealing all changes of a visit into one atomic bundle and waiting only for prior bundles the writer already saw, a cut-off library keeps MAV and Causal+ without ever stalling.'
        : 'Read Committed, Monotonic Atomic View (MAV), and Causal+ isolation can all be implemented with zero blocking across network partitions.')
    : (reg==='i'
        ? 'The moment a rule forbids two cut-off callers from both taking an action (like claiming a unique title), no local bundle can save it—someone must wait.'
        : 'Preventing write-skew (Snapshot Isolation), lost updates, or enforcing Serializability requires cross-partition coordination.');
};

// Book 18: Knowing When to Wait (CALM Theorem)
STAGE_SIMS[18] = function(svg, btnsEl, sayEl){
  const s = stageState[18] || (stageState[18] = { q: 'reach' });
  setWellBtns(btnsEl, [
    { k:'reach', label: reg==='i'?'1. Reachable path (Monotonic)':'1. Transitive reachability (Monotonic)', on: s.q==='reach' },
    { k:'dead', label: reg==='i'?'2. Deadlock cycle (Monotonic)':'2. Wait-for cycle (Monotonic)', on: s.q==='dead' },
    { k:'min', label: reg==='i'?'3. "Is X the smallest?" (Absence!)':'3. Aggregation / Negation (Non-monotonic)', on: s.q==='min' },
    { k:'win', label: reg==='i'?'4. "Did NO ONE object?" (Absence!)':'4. Universal quantification (Non-monotonic)', on: s.q==='win' }
  ], k => { s.q = k; renderStage(); });

  const isMono = s.q === 'reach' || s.q === 'dead';
  svg.innerHTML = `
    <rect width="520" height="340" fill="#fffaf0"/>
    <text x="260" y="26" text-anchor="middle" font-size="12" font-weight="700" fill="#8a5a36">${reg==='i'?'THE HALL OF TWO DOORS: MONOTONIC GROWTH VS. QUESTIONS OF ABSENCE':'THE CALM THEOREM: LOGICAL MONOTONICITY ⇔ COORDINATION-FREE'}</text>

    <!-- Left Door: The Fast Door -->
    <g transform="translate(46, 52)">
      <path d="M0 206 V76 A86 72 0 0 1 172 76 V206 Z" fill="${isMono?'#eef4d3':'#f8f1dc'}" stroke="#1c1512" stroke-width="${isMono?3.5:2.5}"/>
      <text x="86" y="54" text-anchor="middle" font-weight="700" font-size="13.5" fill="#3f6a14">${reg==='i'?'THE FAST DOOR':'THE FAST DOOR'}</text>
      <text x="86" y="74" text-anchor="middle" font-size="11" class="serif">${reg==='i'?'Answers that only grow':'Monotonic (S ⊆ T ⇒ f(S) ⊆ f(T))'}</text>
      <text x="86" y="112" text-anchor="middle" font-size="11.5" font-weight="700">• ${reg==='i'?'Causal chains (Book 1)':'Reachability & Joins'}</text>
      <text x="86" y="134" text-anchor="middle" font-size="11.5" font-weight="700">• ${reg==='i'?'Gossip & OR-Sets (14, 16)':'CRDTs & Gossip (14, 16)'}</text>
      <text x="86" y="156" text-anchor="middle" font-size="11.5" font-weight="700">• ${reg==='i'?'Causal+ bundles (17)':'HATs & Stable Predicates'}</text>
      <rect x="20" y="170" width="132" height="24" fill="#3f6a14"/>
      <text x="86" y="186" text-anchor="middle" font-size="11" font-weight="700" fill="#fffaf0">${reg==='i'?'STREAM WITHOUT WAITING':'ZERO COORDINATION'}</text>
    </g>

    <!-- Right Door: The Waiting Door -->
    <g transform="translate(302, 52)">
      <path d="M0 206 V76 A86 72 0 0 1 172 76 V206 Z" fill="${!isMono?'#fbe7de':'#f8f1dc'}" stroke="#1c1512" stroke-width="${!isMono?3.5:2.5}"/>
      <!-- Wooden bar across the Waiting Door -->
      <rect x="-8" y="118" width="188" height="18" fill="#bf4a26" stroke="#1c1512" stroke-width="2"/>
      <text x="86" y="131" text-anchor="middle" font-size="10" font-weight="700" fill="#fffaf0">${reg==='i'?'SEAL INPUTS FIRST':'COORDINATION BARRIER'}</text>
      <text x="86" y="54" text-anchor="middle" font-weight="700" font-size="13.5" fill="#bf4a26">${reg==='i'?'THE WAITING DOOR':'THE WAITING DOOR'}</text>
      <text x="86" y="74" text-anchor="middle" font-size="11" class="serif">${reg==='i'?'Questions of absence (NOT)':'Non-Monotonic (Negation / Min)'}</text>
      <text x="86" y="104" text-anchor="middle" font-size="11.5" font-weight="700">• ${reg==='i'?'Consensus (4–13)':'Consensus & Paxos (4–13)'}</text>
      <text x="86" y="156" text-anchor="middle" font-size="11.5" font-weight="700">• ${reg==='i'?'Linearizable reads (2, 6)':'Linearizability & Serial. (2, 6, 17)'}</text>
      <rect x="20" y="170" width="132" height="24" fill="#bf4a26"/>
      <text x="86" y="186" text-anchor="middle" font-size="11" font-weight="700" fill="#fffaf0">${reg==='i'?'MUST WAIT / QUORUM':'REQUIRES QUORUM / CUT'}</text>
    </g>

    <rect x="34" y="274" width="452" height="46" rx="4" fill="${isMono?'#eef4d3':'#fbe7de'}" stroke="#1c1512" stroke-width="2.5"/>
    <text x="260" y="302" text-anchor="middle" font-size="12.5" font-weight="700" fill="${isMono?'#3f6a14':'#bf4a26'}">
      ${isMono
        ? (reg==='i'?'More messages can only ADD paths or cycles, never erase one → passes straight through the Fast Door ✓':'Monotonic query: arriving facts never retract a prior output → safe to stream without coordination ✓')
        : (reg==='i'?'A late rider could carry a smaller number or an objection → must wait at the Waiting Door until the set is sealed!':'Non-monotonic query: a late fact can invalidate a prior output → requires a snapshot or quorum barrier!')}
    </text>
  `;

  sayEl.textContent = isMono
    ? (reg==='i'
        ? 'Once a chain of riders or a cycle of waiting exists, learning about more riders can never un-make it—so any house can announce it the instant it sees the pieces.'
        : 'Monotonic logic (select, project, join, transitive closure) only grows as facts arrive, so replicas converge without waiting.')
    : (reg==='i'
        ? 'To know that NO smaller number or NO rival ballot exists, you are asking about what is absent—and absence can only be certified by sealing a cut or polling a quorum.'
        : 'Non-monotonic logic (negation, minimum, universal quantification) depends on the absence of facts, requiring quorums or snapshots to seal the domain.');
};

/* ============================================================
   Spread 2: The Abacus of Quorums & Bounds
   ============================================================ */
const AB_PRESETS = [
  { id:'pax5', n:5, fc:2, fb:0, q:3, books:[5,7,8,12,13],
    i:'Chamber / Tholos Majority (N=5, f=2, Q=3)', m:'Crash Majority Quorum (N=5, f_c=2, Q=3)' },
  { id:'camp4', n:4, fc:1, fb:0, q:3, books:[4,5,7,8],
    i:'Foot of Phyle Camp (N=4, f=1, Q=3)', m:'4-Node Crash Quorum (N=4, f_c=1, Q=3)' },
  { id:'byz4', n:4, fc:0, fb:1, q:3, books:[9,10,11],
    i:'Crown of Phyle (N=4, 1 liar, Q=3)', m:'Byzantine Quorum 3f+1 (N=4, f_b=1, Q=3)' },
  { id:'byz7', n:7, fc:0, fb:2, q:5, books:[9,10,11],
    i:'Seven Mountain Posts (N=7, 2 liars, Q=5)', m:'Byzantine Quorum 3f+1 (N=7, f_b=2, Q=5)' },
  { id:'pbs3', n:3, fc:1, fb:0, q:1, books:[14,15,16,17],
    i:'Scholars\' Coast Fast Call (N=3, Q=1)', m:'Partial Quorum W=R=1 (PBS / CRDT / HAT)' },
  { id:'split4', n:4, fc:2, fb:0, q:2, books:[4,5,6],
    i:'Half-Camp Split Trap (N=4, Q=2 ✗)', m:'Non-Intersecting Half Quorum (N=4, Q=2 ✗)' }
];

let curPreset = 'pax5';

function initAbacus(){
  ['ab-n','ab-fc','ab-fb','ab-q'].forEach(id => {
    $(id).addEventListener('input', () => {
      curPreset = '';
      const n = Number($('ab-n').value);
      if(Number($('ab-q').value) > n) $('ab-q').value = n;
      if(Number($('ab-fc').value) + Number($('ab-fb').value) >= n){
        $('ab-fc').value = Math.max(0, n - 1 - Number($('ab-fb').value));
      }
      renderAbacus();
    });
  });
}

function renderAbacus(){
  const n = Number($('ab-n').value);
  const fc = Number($('ab-fc').value);
  const fb = Number($('ab-fb').value);
  const q = Math.min(n, Number($('ab-q').value));
  $('ab-q').max = n;
  $('ab-q').value = q;

  $('ab-val-n').textContent = n;
  $('ab-val-fc').textContent = fc;
  $('ab-val-fb').textContent = fb;
  $('ab-val-q').textContent = q;

  $('ab-lbl-n').innerHTML = reg==='i' ? 'Total places (N)' : 'Total replicas (N)';
  $('ab-lbl-fc').innerHTML = reg==='i' ? 'May sleep or lag (f<sub>c</sub>)' : 'Crash / silent faults (f<sub>c</sub>)';
  $('ab-lbl-fb').innerHTML = reg==='i' ? 'May lie or forge (f<sub>b</sub>)' : 'Byzantine faults (f<sub>b</sub>)';
  $('ab-lbl-q').innerHTML = reg==='i' ? 'Group waited for (Q)' : 'Quorum size (Q)';

  // Presets bar
  const pEl = $('ab-presets');
  pEl.innerHTML = AB_PRESETS.map(p =>
    `<button type="button" class="btn alt small${curPreset===p.id?' on':''}" data-pid="${p.id}">${p[reg]}</button>`
  ).join('');
  pEl.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = AB_PRESETS.find(x => x.id === btn.dataset.pid);
      if(!p) return;
      curPreset = p.id;
      $('ab-n').value = p.n;
      $('ab-fc').value = p.fc;
      $('ab-fb').value = p.fb;
      $('ab-q').value = p.q;
      renderAbacus();
    });
  });

  // Core math:
  // 1. Liveness: max awake responders in worst case is N - fc - fb (since liars may also stay silent)
  const maxAvail = n - fc - fb;
  const canFinish = q <= maxAvail;
  // 2. Overlap of two worst-case quorums of size Q inside N: at least 2Q - N
  const minOverlap = Math.max(0, 2 * q - n);
  // 3. Honest overlap: up to fb members of the intersection may be liars!
  const honestOverlap = minOverlap - fb;
  const isSafe = honestOverlap >= 1;

  // Draw the circle of N members
  const svg = $('ab-svg');
  const cx = 240, cy = 205, R = 132;
  // Quorum 1 = indices [0 .. q-1], Quorum 2 = indices [n-q .. n-1]
  // Overlap = indices [n-q .. q-1] when 2q > n
  let nodesHtml = '';
  let arcsHtml = '';

  for(let i = 0; i < n; i++){
    const ang = (-90 + (360 * i) / n) * Math.PI / 180;
    const x = Math.round(cx + R * Math.cos(ang));
    const y = Math.round(cy + R * Math.sin(ang));
    const inQ1 = i < q;
    const inQ2 = i >= (n - q);
    const inBoth = inQ1 && inQ2;
    // Assign fault roles for visualization:
    // Put fb liars inside the overlap first (worst case for safety!), and fc sleepers outside Q1
    let role = 'honest';
    if(inBoth && i - (n - q) < fb) role = 'byz';
    else if(i >= n - fc) role = 'crash';

    if(inQ1){
      arcsHtml += `<line x1="${cx-35}" y1="${cy}" x2="${x}" y2="${y}" stroke="#136f9e" stroke-width="2.5" stroke-opacity=".45"/>`;
    }
    if(inQ2){
      arcsHtml += `<line x1="${cx+35}" y1="${cy}" x2="${x}" y2="${y}" stroke="#b5602c" stroke-width="2.5" stroke-opacity=".45" stroke-dasharray="4 3"/>`;
    }

    const fill = role==='byz' ? '#a57fc0' : (role==='crash' ? '#d8cba6' : (inBoth ? '#9cb648' : '#e0b84a'));
    nodesHtml += `
      <g transform="translate(${x},${y})">
        ${inBoth ? `<circle r="29" fill="none" stroke="${role==='byz'?'#bf4a26':'#3f6a14'}" stroke-width="3.5"/>` : ''}
        ${inQ1 ? `<circle r="25" fill="none" stroke="#136f9e" stroke-width="2.5"/>` : ''}
        ${inQ2 ? `<circle r="22" fill="none" stroke="#b5602c" stroke-width="2.5" stroke-dasharray="4 2"/>` : ''}
        <circle r="18" fill="${fill}" stroke="#1c1512" stroke-width="2.5" ${role==='crash'?'stroke-dasharray="3 3"':''}/>
        <text y="5" text-anchor="middle" font-size="12" font-weight="700">#${i+1}</text>
        <text y="37" text-anchor="middle" font-size="9.5" font-weight="700" fill="${role==='byz'?'#bf4a26':(role==='crash'?'#6b5a48':'#1c1512')}">
          ${role==='byz'?(reg==='i'?'LIAR':'BYZ'):(role==='crash'?(reg==='i'?'ASLEEP':'CRASH'):(inBoth?(reg==='i'?'WITNESS':'HONEST ∩'):''))}
        </text>
      </g>
    `;
  }

  svg.innerHTML = `
    <rect width="480" height="440" fill="#fffaf0"/>
    <text x="240" y="26" text-anchor="middle" font-size="12" font-weight="700" fill="#1c1512">
      ${reg==='i'?`N = ${n} PLACES · TWO GROUPS OF Q = ${q} · OVERLAP = ${minOverlap}`:`N = ${n} REPLICAS · QUORUMS Q₁, Q₂ OF SIZE ${q} · |Q₁ ∩ Q₂| ≥ ${minOverlap}`}
    </text>
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#d8cba6" stroke-width="2" stroke-dasharray="5 5"/>
    ${arcsHtml}
    ${nodesHtml}
    <!-- Legend at bottom -->
    <g transform="translate(20, 392)" font-size="11" font-weight="700">
      <circle cx="12" cy="12" r="8" fill="none" stroke="#136f9e" stroke-width="2.5"/><text x="26" y="16">${reg==='i'?'First group (Q₁)':'Quorum Q₁'}</text>
      <circle cx="142" cy="12" r="8" fill="none" stroke="#b5602c" stroke-width="2.5" stroke-dasharray="3 2"/><text x="156" y="16">${reg==='i'?'Second group (Q₂)':'Quorum Q₂'}</text>
      <circle cx="280" cy="12" r="8" fill="#9cb648" stroke="#3f6a14" stroke-width="2.5"/><text x="294" y="16">${reg==='i'?'Honest witness in both':'Honest overlap'}</text>
    </g>
  `;

  // Readout badges & explanation
  $('ab-readout').innerHTML = `
    <div class="ab-badges">
      <div class="ab-badge ${canFinish?'ok':'bad'}">
        <b>${reg==='i'?'Can a turn finish?':'Liveness (Q ≤ N − f_c − f_b)'}</b>
        ${canFinish
          ? (reg==='i'?`Yes: ${maxAvail} can answer, and you wait for ${q}.`:`Yes: Q = ${q} ≤ ${maxAvail} available replicas.`)
          : (reg==='i'?`Stalls! Only ${maxAvail} may answer, below Q = ${q}.`:`Deadlocks! Only ${maxAvail} replicas guaranteed responsive < Q = ${q}.`)}
      </div>
      <div class="ab-badge ${minOverlap>=1?'ok':'bad'}">
        <b>${reg==='i'?'Total overlap (2Q − N)':'Quorum Intersection'}</b>
        ${reg==='i'?`At least ${minOverlap} shared member(s)`:`|Q₁ ∩ Q₂| ≥ 2(${q}) − ${n} = ${minOverlap}`}
      </div>
      <div class="ab-badge ${isSafe?'ok':'bad'}">
        <b>${reg==='i'?'Honest overlap (2Q − N − f_b)':'Honest Witness Guaranteed?'}</b>
        ${isSafe
          ? (reg==='i'?`Safe: ≥ ${honestOverlap} honest witness in both groups ✓`:`Safe: ≥ ${honestOverlap} non-Byzantine node in Q₁ ∩ Q₂ ✓`)
          : (reg==='i'?`Unsafe (${honestOverlap}): groups can split or be fooled! ✗`:`Unsafe (${honestOverlap} < 1): equivocation / split-brain possible! ✗`)}
      </div>
    </div>
    <p class="ab-explain">
      ${isSafe && canFinish
        ? (reg==='i'
            ? `Both laws hold! You never wait for more than ${maxAvail} places, and any two groups of ${q} share at least ${honestOverlap} honest witness who remembers the first group's choice.`
            : `Both safety and liveness hold! Quorum size Q = ${q} ≤ N − f_c − f_b = ${maxAvail} avoids blocking, and 2Q − N − f_b = ${honestOverlap} ≥ 1 guarantees an honest witness in every intersection.`)
        : !canFinish && isSafe
        ? (reg==='i'
            ? `Safe against splits, but Q = ${q} is too large: if ${fc + fb} places stay quiet, the remaining ${maxAvail} can never reach ${q}.`
            : `Safe by intersection, but violates availability: if ${fc + fb} nodes fail to respond, only ${maxAvail} remain—fewer than Q = ${q}.`)
        : (reg==='i'
            ? `Because 2Q − N − f_b = ${honestOverlap} < 1, two groups of ${q} can act without a single honest witness between them (or a liar in the overlap can tell each group a different story).`
            : `With 2Q − N − f_b = ${honestOverlap} < 1, two quorums of size ${q} either fail to intersect (allowing split decisions, or requiring probabilistic/CRDT merge) or intersect only in Byzantine nodes.`)}
    </p>
  `;

  // Matching books pills
  const related = fb > 0 ? [9,10,11] : (minOverlap === 0 ? [6,14,15,16,17] : [2,5,7,8,12,13]);
  $('ab-books').innerHTML = `<span class="st-spreads-lbl">${reg==='i'?'Books governed by this number:':'Related books:'}</span>` +
    related.map(num => {
      const b = BOOKS[num - 1];
      return `<button type="button" class="sp-pill ab-jump" data-idx="${num-1}">#${b.n} ${b.title}</button>`;
    }).join('');
  $('ab-books').querySelectorAll('.ab-jump').forEach(btn => {
    btn.addEventListener('click', () => {
      selectBook(Number(btn.dataset.idx));
      $('cover').scrollIntoView({ behavior:'smooth' });
    });
  });
}

/* ============================================================
   Spread 3: Two Nights That Look the Same (7 Impossibility Proofs)
   ============================================================ */
const TWO_NIGHTS = [
  {
    id:'flp', bookIdx: 3, slug:'the-limits-of-agreement', sec:'silent',
    tab:{ i:'Dead vs. Slow (Book 4)', m:'FLP: Crash vs. Delay (Book 4)' },
    title:{ i:'Is Tent 4 asleep forever, or is its rider still on the path?', m:'Crashed process vs. arbitrarily delayed message (FLP 1985)' },
    obs:{ i:'Tents 1, 2, 3', m:'Processes p₁, p₂, p₃' },
    seen:{ i:'Hear nothing from Tent 4 so far', m:'Zero messages received from p₄ up to time t' },
    left:{
      name:{ i:'Night A: Tent 4 is asleep', m:'Run A: p₄ has crashed' },
      desc:{ i:'No rider will ever come from Tent 4.', m:'p₄ took no steps; waiting forever deadlocks.' },
      need:{ i:'Must eventually decide without Tent 4', m:'Must terminate without waiting for p₄' }
    },
    right:{
      name:{ i:'Night B: Tent 4\'s rider is delayed', m:'Run B: p₄\'s message is in flight' },
      desc:{ i:'Tent 4 is awake and holds the tipping vote.', m:'p₄ is alive and holds the deciding state.' },
      need:{ i:'Acting alone risks splitting from Tent 4', m:'Unilateral decision risks violating agreement' }
    },
    opts:[
      { k:'act', i:'Decide now without Tent 4', m:'Decide now without p₄',
        verdict:{
          i:'Works on Night A, but on Night B Tent 4 wakes up with the opposite poised path—and the adversary uses this to keep the camp poised forever!',
          m:'Terminates in Run A, but in Run B allows the scheduler to steer the delayed message into a conflicting or perpetually bivalent execution.'
        }
      },
      { k:'wait', i:'Keep waiting for Tent 4', m:'Wait for a message from p₄',
        verdict:{
          i:'Safe on Night B, but on Night A Tent 4 is asleep forever—so the camp never finishes before dawn!',
          m:'Safe in Run B, but violates termination in Run A where p₄ has crashed permanently.'
        }
      }
    ]
  },
  {
    id:'cap', bookIdx: 5, slug:'answering-while-cut-off', sec:'mustersec',
    tab:{ i:'Cut Gorge (Book 6)', m:'CAP Partition (Book 6)' },
    title:{ i:'Did a caller just update the West camp while the gorge was blocked?', m:'Completed write on West partition vs. quiet West partition (Gilbert & Lynch 2002)' },
    obs:{ i:'East Camp (T3, T4)', m:'East Subnetwork G_E' },
    seen:{ i:'No rider across the gorge; local slate says HOLD', m:'No cross-partition messages; local state = v₀ (HOLD)' },
    left:{
      name:{ i:'Night A: West was updated to ATTACK', m:'Run A: Write(ATTACK) completed on West' },
      desc:{ i:'Caller on West already went home with ATTACK settled.', m:'Client write returned before East read was invoked.' },
      need:{ i:'One-copy law demands East answer ATTACK', m:'Linearizability requires Read on East to return ATTACK' }
    },
    right:{
      name:{ i:'Night B: Nobody called West at all', m:'Run B: No Write occurred on West' },
      desc:{ i:'The order everywhere is still HOLD.', m:'Initial value v₀ = HOLD has never been modified.' },
      need:{ i:'One-copy law demands East answer HOLD', m:'Validity requires Read on East to return HOLD' }
    },
    opts:[
      { k:'hold', i:'Answer "HOLD" immediately', m:'Return HOLD immediately (Available)',
        verdict:{
          i:'Right on Night B, but on Night A East returns stale "HOLD" after "ATTACK" was already finished—breaking the one-copy law!',
          m:'Valid in Run B, but violates linearizability (real-time order) in Run A!'
        }
      },
      { k:'wait', i:'Refuse to answer until the road heals', m:'Block until partition heals (Consistent)',
        verdict:{
          i:'Never gives a wrong answer on Night A or Night B, but breaks the promise to answer every caller while cut off!',
          m:'Preserves linearizability in both runs, but sacrifices availability during the partition.'
        }
      }
    ]
  },
  {
    id:'byz3', bookIdx: 8, slug:'agreeing-among-liars', sec:'threesec',
    tab:{ i:'Three Posts, One Liar (Book 9)', m:'3-Node Byzantine (Book 9)' },
    title:{ i:'Who lied to Post 2: Chief B1 or Lieutenant B3?', m:'Equivocating Commander vs. Byzantine Lieutenant for N = 3, f = 1 (PSL 1980)' },
    obs:{ i:'Honest Post B2', m:'Loyal Lieutenant B2' },
    seen:{ i:'Hears "Attack" from B1 and "B1 said Hold" from B3', m:'Receives direct "Attack" from B1 and relayed "Hold" from B3' },
    left:{
      name:{ i:'Night A: Chief B1 is honest; B3 lies', m:'Run A: Commander B1 is loyal (sent Attack); B3 lies' },
      desc:{ i:'B1 told everyone Attack; B3 falsely claims B1 said Hold.', m:'Validity requires loyal B2 to decide the loyal commander\'s order: Attack.' },
      need:{ i:'Validity requires B2 to decide ATTACK', m:'Validity requires B2 to output ATTACK' }
    },
    right:{
      name:{ i:'Night B: Chief B1 is the liar; B3 is honest', m:'Run B: Commander B1 is Byzantine; B3 is loyal' },
      desc:{ i:'B1 told B2 "Attack" and told honest B3 "Hold".', m:'By symmetric argument at B3, if B3 obeys its commander when doubtful, B3 decides HOLD.' },
      need:{ i:'To match honest B3, B2 must not split from B3', m:'Agreement requires B2 and B3 to output the same decision' }
    },
    opts:[
      { k:'trust1', i:'Always trust Chief B1 ("ATTACK")', m:'Obey direct commander message (ATTACK)',
        verdict:{
          i:'Works on Night A, but on Night B honest B3 follows the same rule on what B1 told B3 ("HOLD")—so honest B2 and B3 split!',
          m:'Satisfies validity in Run A, but in Run B loyal B3 symmetrically decides HOLD—violating agreement!'
        }
      },
      { k:'hold', i:'Default to "HOLD" whenever reports clash', m:'Output default HOLD on conflict',
        verdict:{
          i:'Keeps B2 and B3 together on Night B, but on Night A a single lying lieutenant B3 forces honest B2 to disobey honest Chief B1!',
          m:'Violates validity in Run A: a single faulty lieutenant B3 vetoes a loyal commander\'s order!'
        }
      }
    ]
  },
  {
    id:'vec', bookIdx: 0, slug:'ordering-without-clocks', sec:'why',
    tab:{ i:'Too Few Tally Slots (Book 1)', m:'Vector Dimension < N (Book 1)' },
    title:{ i:'Can two tally slots ever tell cause from coincidence for three houses?', m:'Why N houses require N vector components (Charron-Bost 1991)' },
    obs:{ i:'Stamp Reader', m:'Causal Order Checker' },
    seen:{ i:'Only 2 numbers per stamp on a 3-house road', m:'Timestamps of dimension k < N across N = 3 processes' },
    left:{
      name:{ i:'Night A: A rider linked House 3 to House 1', m:'Run A: Causal chain e₃ → e₁' },
      desc:{ i:'One event genuinely happened before the other.', m:'True causal dependency exists.' },
      need:{ i:'Stamps must show e₃ < e₁', m:'Must report e₃ → e₁' }
    },
    right:{
      name:{ i:'Night B: Three houses acted alone', m:'Run B: Pairwise concurrent events e₁ ∥ e₂ ∥ e₃' },
      desc:{ i:'No riders rode between the three mornings.', m:'Antichain of size N = 3.' },
      need:{ i:'No stamp may dominate another', m:'Must report all pairs incomparable' }
    },
    opts:[
      { k:'short', i:'Use fewer than N slots', m:'Compress into k < N numbers',
        verdict:{
          i:'By pigeonhole, three independent mornings cannot all beat one another in only two slots—at least two look ordered when no rider rode!',
          m:'Pigeonhole bound on poset dimension: an antichain of N processes requires N coordinates so each process can lead in its own coordinate.'
        }
      },
      { k:'full', i:'Keep one slot per house (N slots)', m:'Keep full N-entry vector V[1..N]',
        verdict:{
          i:'With N slots, each house leads in its own slot when acting alone, and dominates in all slots only when a chain of riders links them ✓',
          m:'With N coordinates, V(e) < V(f) holds if and only if e → f ✓'
        }
      }
    ]
  },
  {
    id:'cut', bookIdx: 2, slug:'taking-stock-without-stopping', sec:'stop',
    tab:{ i:'Uncoordinated Count (Book 3)', m:'Inconsistent Cut (Book 3)' },
    title:{ i:'Where was the 9th amphora when the two houses wrote their counts?', m:'Why uncoordinated local checkpoints double-count or lose in-flight state' },
    obs:{ i:'Island Auditor', m:'Global State Collector' },
    seen:{ i:'House 1 reports 3 jars; House 2 reports 3 jars (no road log)', m:'Process states recorded without channel markers' },
    left:{
      name:{ i:'Night A: 1 jar was on the cart in flight', m:'Run A: 1 message in transit on channel c₁₂' },
      desc:{ i:'H1 counted after sending; H2 counted before arrival.', m:'Pre-receive checkpoint at H2, post-send at H1.' },
      need:{ i:'True island total is 9 jars', m:'True conserved sum is 9' }
    },
    right:{
      name:{ i:'Night B: Only 8 jars exist on the island', m:'Run B: No message in flight (1 jar lost)' },
      desc:{ i:'Both houses genuinely had 3 and H3 had 2.', m:'Channel is empty; total state is 8.' },
      need:{ i:'True island total is 8 jars', m:'True sum is 8' }
    },
    opts:[
      { k:'no_sash', i:'Record house stores without red sashes', m:'Record node states without channel logs',
        verdict:{
          i:'Night A and Night B produce the exact same house sheets—an auditor cannot tell whether the 9th jar is on the road or missing!',
          m:'Without Marker boundaries logging in-transit messages, Run A and Run B yield identical node checkpoints.'
        }
      },
      { k:'sash', i:'Send red sashes & log carts ahead of them', m:'Run Chandy-Lamport Marker rule',
        verdict:{
          i:'The red sash fences the road: any cart sent before H1\'s count and arriving after H2\'s count is caught ahead of the sash ✓',
          m:'Markers record exact channel state between pre-cut sends and post-cut receives, distinguishing Run A from Run B ✓'
        }
      }
    ]
  },
  {
    id:'hat', bookIdx: 16, slug:'what-you-can-promise-alone', sec:'twice',
    tab:{ i:'Unique Title Claim (Book 17)', m:'Uniqueness / Write-Skew (Book 17)' },
    title:{ i:'Did another scholar at the far library just claim the same unique title?', m:'Why Serializability & uniqueness constraints cannot be Highly Available (Bailis et al. 2014)' },
    obs:{ i:'Cut-off Library B', m:'Replica B under partition' },
    seen:{ i:'Local catalogue shows title "Athena" is still unclaimed', m:'Local state shows key "Athena" is free; no messages from A' },
    left:{
      name:{ i:'Night A: Library A just granted "Athena"', m:'Run A: Concurrent transaction T₁ claimed "Athena" at A' },
      desc:{ i:'A visitor at Library A already took the unique title.', m:'Granting "Athena" at B violates the global uniqueness invariant.' },
      need:{ i:'Library B must refuse or wait', m:'Must abort or block T₂ to preserve serializability' }
    },
    right:{
      name:{ i:'Night B: Nobody visited Library A', m:'Run B: No transaction ran at A' },
      desc:{ i:'The title is genuinely free everywhere.', m:'T₂ is the only transaction in the system.' },
      need:{ i:'Library B should grant "Athena" at once', m:'High availability requires T₂ to commit immediately' }
    },
    opts:[
      { k:'grant', i:'Grant the title immediately', m:'Commit immediately without waiting',
        verdict:{
          i:'Fast on Night B, but on Night A two scholars walk out with the same "unique" title—breaking uniqueness!',
          m:'Available in Run B, but produces non-serializable duplicate claims (write-skew / lost update) in Run A!'
        }
      },
      { k:'coord', i:'Wait to check a majority of libraries', m:'Coordinate across a quorum first',
        verdict:{
          i:'Protects uniqueness on Night A, which proves that uniqueness crosses the line out of what a library can promise alone!',
          m:'Preserves serializability, proving that uniqueness constraints are outside the HAT boundary.'
        }
      }
    ]
  },
  {
    id:'calm', bookIdx: 17, slug:'knowing-when-to-wait', sec:'absence',
    tab:{ i:'Question of Absence (Book 18)', m:'CALM Non-Monotonicity (Book 18)' },
    title:{ i:'Has every objection arrived, or is one more rider still on the road?', m:'Why non-monotonic queries (negation / min) require coordination (CALM Theorem)' },
    obs:{ i:'Clerk at the Door', m:'Streaming Query Node' },
    seen:{ i:'Has received {12, 19} so far; no smaller number seen', m:'Input stream prefix S = {12, 19}; no element < 12 observed' },
    left:{
      name:{ i:'Night A: A rider carrying "5" is still on the road', m:'Run A: Late tuple {5} is in transit (T = {5, 12, 19})' },
      desc:{ i:'True minimum of the whole set is 5, not 12.', m:'f(S) = 12 would be retracted when 5 arrives (f(T) = 5).' },
      need:{ i:'Must NOT announce "12 is the final minimum" yet', m:'Cannot emit final answer 12 before sealing input' }
    },
    right:{
      name:{ i:'Night B: {12, 19} is the whole set', m:'Run B: Stream is complete (T = S = {12, 19})' },
      desc:{ i:'No more riders are on the road.', m:'True final minimum is 12.' },
      need:{ i:'Answer is 12 once the set is sealed', m:'Output 12 after end-of-stream barrier' }
    },
    opts:[
      { k:'fast', i:'Send through the Fast Door (answer "12" now)', m:'Emit "12" immediately without coordination',
        verdict:{
          i:'Right on Night B, but on Night A the late rider with "5" arrives and forces you to take back your answer!',
          m:'In Run A, arrival of {5} invalidates output "12"—violating monotonic eventual consistency!'
        }
      },
      { k:'bar', i:'Wait at the Waiting Door until the road is sealed', m:'Wait for coordination barrier / snapshot mark',
        verdict:{
          i:'Only when a sash or quorum seals the set can you know that "5" is truly absent—that is the law of the Hall of Two Doors ✓',
          m:'Sealing the domain via coordination turns absence into a known fact—confirming the CALM theorem ✓'
        }
      }
    ]
  }
];

let curTN = 0;
let curTNChoice = 0;

function renderTwoNights(){
  const tabsEl = $('tn-tabs');
  tabsEl.innerHTML = TWO_NIGHTS.map((item, idx) =>
    `<button type="button" class="btn alt small${idx===curTN?' on':''}" data-idx="${idx}">${item.tab[reg]}</button>`
  ).join('');
  tabsEl.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      curTN = Number(btn.dataset.idx);
      curTNChoice = 0;
      renderTwoNights();
    });
  });

  const item = TWO_NIGHTS[curTN];
  const b = BOOKS[item.bookIdx];
  $('tn-book').textContent = `Book #${b.n} · ${b.title}`;
  $('tn-title').textContent = item.title[reg];
  $('tn-link').href = `../${item.slug}/index.html#${item.sec}`;
  $('tn-link').textContent = reg==='i' ? 'Read this trap in the book ↗' : 'Open proof in book ↗';
  $('tn-prompt').textContent = reg==='i' ? 'Choose the observer\'s rule when seeing this:' : 'Select the protocol rule at the observer:';

  const svg = $('tn-svg');
  svg.innerHTML = `
    <rect width="860" height="300" fill="#f8f1dc"/>
    <!-- Left Card: Night A -->
    <g transform="translate(22, 24)">
      <rect width="256" height="252" fill="#fbe7de" stroke="#1c1512" stroke-width="3"/>
      <rect width="256" height="34" fill="#bf4a26"/>
      <text x="128" y="22" text-anchor="middle" font-size="12.5" font-weight="700" fill="#fffaf0">${item.left.name[reg]}</text>
      <text x="128" y="88" text-anchor="middle" font-size="13" class="serif">${item.left.desc[reg]}</text>
      <rect x="18" y="156" width="220" height="72" fill="#fffaf0" stroke="#1c1512" stroke-width="2"/>
      <text x="128" y="182" text-anchor="middle" font-size="10.5" font-weight="700" fill="#bf4a26">${reg==='i'?'WHAT NIGHT A DEMANDS:':'REQUIRED IN RUN A:'}</text>
      <text x="128" y="206" text-anchor="middle" font-size="12" font-weight="700">${item.left.need[reg]}</text>
    </g>

    <!-- Arrows into Center Observer -->
    <path d="M278 150 H312" stroke="#1c1512" stroke-width="3.5"/>
    <path d="M548 150 H582" stroke="#1c1512" stroke-width="3.5"/>

    <!-- Center Card: The Observer (Identical Local View) -->
    <g transform="translate(312, 42)">
      <rect width="236" height="216" fill="#fffaf0" stroke="#1c1512" stroke-width="3.5"/>
      <rect x="28" y="-14" width="180" height="28" fill="#e0b84a" stroke="#1c1512" stroke-width="2.5"/>
      <text x="118" y="5" text-anchor="middle" font-size="11.5" font-weight="700">${reg==='i'?'SAME VIEW IN BOTH':'IDENTICAL LOCAL STATE'}</text>
      <circle cx="118" cy="64" r="24" fill="#136f9e" stroke="#1c1512" stroke-width="2.5"/>
      <text x="118" y="69" text-anchor="middle" font-size="12" font-weight="700" fill="#fffaf0">OBS</text>
      <text x="118" y="110" text-anchor="middle" font-size="13" font-weight="700">${item.obs[reg]}</text>
      <text x="118" y="146" text-anchor="middle" font-size="12" class="serif">${item.seen[reg]}</text>
      <text x="118" y="194" text-anchor="middle" font-size="11" font-weight="700" fill="#bf4a26">${reg==='i'?'Night A = Night B here!':'Indistinguishable (A ~ B)'}</text>
    </g>

    <!-- Right Card: Night B -->
    <g transform="translate(582, 24)">
      <rect width="256" height="252" fill="#e9f2f7" stroke="#1c1512" stroke-width="3"/>
      <rect width="256" height="34" fill="#136f9e"/>
      <text x="128" y="22" text-anchor="middle" font-size="12.5" font-weight="700" fill="#fffaf0">${item.right.name[reg]}</text>
      <text x="128" y="88" text-anchor="middle" font-size="13" class="serif">${item.right.desc[reg]}</text>
      <rect x="18" y="156" width="220" height="72" fill="#fffaf0" stroke="#1c1512" stroke-width="2"/>
      <text x="128" y="182" text-anchor="middle" font-size="10.5" font-weight="700" fill="#136f9e">${reg==='i'?'WHAT NIGHT B DEMANDS:':'REQUIRED IN RUN B:'}</text>
      <text x="128" y="206" text-anchor="middle" font-size="12" font-weight="700">${item.right.need[reg]}</text>
    </g>
  `;

  const btnsEl = $('tn-btns');
  btnsEl.innerHTML = item.opts.map((o, idx) =>
    `<button type="button" class="btn alt small${idx===curTNChoice?' on':''}" data-oi="${idx}">${o[reg]}</button>`
  ).join('');
  btnsEl.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      curTNChoice = Number(btn.dataset.oi);
      renderTwoNights();
    });
  });

  $('tn-verdict').textContent = item.opts[curTNChoice].verdict[reg];
}

/* ============================================================
   Spread 4: The Complete 18-Book Compendium Table
   ============================================================ */
function renderCatalogue(){
  $('th-book').textContent = reg==='i' ? 'Book & Setting' : 'Book & Model';
  $('th-q').textContent = reg==='i' ? 'The Question' : 'Problem Statement';
  $('th-dev').textContent = reg==='i' ? 'The Device' : 'Core Mechanism';
  $('th-safe').textContent = reg==='i' ? 'What Holds' : 'Guarantee';
  $('th-lim').textContent = reg==='i' ? 'Where It Stops' : 'Lower Bound / Limit';

  const qRaw = ($('cat-search').value || '').trim().toLowerCase();
  const tbody = $('cat-body');
  let html = '';
  let shown = 0;
  let lastPlace = '';

  BOOKS.forEach((b, idx) => {
    const pl = PLACE_MAP[b.place];
    const hay = `${b.n} ${b.title} ${b.cite} ${pl.i} ${pl.m} ${b.tag.i} ${b.tag.m} ${b.q.i} ${b.q.m} ${b.dev.i} ${b.dev.m} ${b.res.i} ${b.res.m} ${b.lim.i} ${b.lim.m}`.toLowerCase();
    if(qRaw && !hay.includes(qRaw)) return;
    shown++;
    if(b.place !== lastPlace){
      lastPlace = b.place;
      html += `<tr class="cat-group" style="--c:${pl.c}"><td colspan="5">${pl[reg]}</td></tr>`;
    }
    html += `<tr class="cat-row${idx===curBookIdx?' active':''}" data-idx="${idx}">
      <td data-label="Book"><span class="cat-btitle">#${b.n}. ${b.title}</span><span class="cat-bsub">${b.cite}</span></td>
      <td data-label="Question">${b.q[reg]}</td>
      <td data-label="Device">${b.dev[reg]}</td>
      <td data-label="Holds">${b.res[reg]}</td>
      <td data-label="Limit">${b.lim[reg]}</td>
    </tr>`;
  });

  tbody.innerHTML = html;
  $('cat-count').textContent = `${shown} of 18 books`;

  tbody.querySelectorAll('.cat-row').forEach(tr => {
    tr.addEventListener('click', () => {
      selectBook(Number(tr.dataset.idx));
      $('workbench').scrollIntoView({ behavior:'smooth' });
    });
  });
}

/* ============================================================
   Register Headings, Selection & Initialization
   ============================================================ */
function syncStaticCopy(){
  document.body.dataset.reg = reg;
  $('reg-i').setAttribute('aria-pressed', String(reg === 'i'));
  $('reg-m').setAttribute('aria-pressed', String(reg === 'm'));

  $('hero-lede').textContent = reg === 'i'
    ? 'Every book in the series asks how separated places joined only by messengers can act as one. Set the conditions of the world below to see which books answer, or choose any of the eighteen to work its arrangement by hand.'
    : 'Every book in the series studies how message-passing nodes coordinate across asynchronous delays, crashes, partitions, and Byzantine faults. Filter by model assumptions below, or inspect any of the eighteen protocols interactively.';

  $('sb-title').textContent = reg === 'i' ? 'Turn the conditions of the world' : 'Filter by system model & property';
  $('lbl-road').textContent = reg === 'i' ? 'What the road or birds may do' : 'Timing & network model';
  $('lbl-fault').textContent = reg === 'i' ? 'Who may fail' : 'Fault model';
  $('lbl-ask').textContent = reg === 'i' ? 'What is asked of the group' : 'Target property';

  $('tab-tiles').textContent = reg === 'i' ? 'The 18 stones' : 'All 18 protocols';
  $('tab-map').textContent = reg === 'i' ? 'The two islands' : 'Archipelago map';

  $('ab-kicker').textContent = reg === 'i' ? 'One geometry across the islands' : 'Unified quorum intersection calculator';
  $('ab-heading').textContent = reg === 'i' ? 'Why two groups must share an honest member' : 'Quorum intersection across crash, Byzantine & partial-quorum models';
  $('ab-lede').textContent = reg === 'i'
    ? 'From the Chamber and the Tholos to the camps, the mountain crown and the coastal libraries, safety rests on a single counting rule: when one group writes or votes and a second group reads or starts the next turn, how many honest members must they share?'
    : 'Across crash-tolerant consensus (2f + 1), Byzantine replication (3f + 1), and tunable coastal storage (W + R ≤ N), safety and availability reduce to two inequalities: Q ≤ N − f_c − f_b for liveness and 2Q − N − f_b ≥ 1 for honest intersection.';

  $('tn-kicker').textContent = reg === 'i' ? 'How every impossibility is proved' : 'Indistinguishability proofs across the series';
  $('tn-heading').textContent = reg === 'i' ? 'Two nights that look the same from one place' : 'Every lower bound is an indistinguishability argument';
  $('tn-lede').textContent = reg === 'i'
    ? 'Every limit in the eighteen books uses the same trap. Build two runs that call for different answers, then point to one observer who sees the exact same messages in both. Whatever rule that observer follows, one of the two runs breaks it.'
    : 'FLP, CAP, the 3f + 1 Byzantine bound, vector-clock dimension, Chandy-Lamport cuts, HATs, and CALM all share one proof template: construct two executions requiring different outputs that produce identical local histories at the deciding node.';

  $('cat-kicker').textContent = reg === 'i' ? 'The whole series in one table' : 'Complete 18-book reference matrix';
  $('cat-heading').textContent = reg === 'i' ? 'Every book, its device, its promise, and its limit' : 'All eighteen books: problem, mechanism, invariant, and bound';
  $('end-big').textContent = reg === 'i'
    ? 'Agree on what may go wrong, count how many must overlap, and wait only where an answer rests on absence.'
    : 'Specify your fault and timing assumptions, size quorums so honest witnesses intersect, and coordinate only at non-monotonic boundaries.';
}

function selectBook(idx){
  curBookIdx = (idx + BOOKS.length) % BOOKS.length;
  renderStonesAndMap();
  renderStage();
  renderCatalogue();
}

function syncAll(){
  syncStaticCopy();
  buildSwitchboard();
  renderStonesAndMap();
  renderStage();
  renderAbacus();
  renderTwoNights();
  renderCatalogue();
}

function init(){
  $('reg-i').addEventListener('click', () => { reg = 'i'; syncAll(); });
  $('reg-m').addEventListener('click', () => { reg = 'm'; syncAll(); });

  $('sb-reset').addEventListener('click', () => {
    activePlace = 'all'; activeRoad = 'all'; activeFault = 'all'; activeAsk = 'all';
    syncAll();
  });

  $('tab-tiles').addEventListener('click', () => {
    leftView = 'tiles';
    $('tab-tiles').setAttribute('aria-selected', 'true');
    $('tab-map').setAttribute('aria-selected', 'false');
    $('stones-grid').hidden = false;
    $('arch-map').hidden = true;
  });

  $('tab-map').addEventListener('click', () => {
    leftView = 'map';
    $('tab-tiles').setAttribute('aria-selected', 'false');
    $('tab-map').setAttribute('aria-selected', 'true');
    $('stones-grid').hidden = true;
    $('arch-map').hidden = false;
  });

  $('st-prev').addEventListener('click', () => selectBook(curBookIdx - 1));
  $('st-next').addEventListener('click', () => selectBook(curBookIdx + 1));

  $('cat-search').addEventListener('input', renderCatalogue);

  window.addEventListener('keydown', e => {
    if(e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if(e.key === 'ArrowRight') selectBook(curBookIdx + 1);
    else if(e.key === 'ArrowLeft') selectBook(curBookIdx - 1);
  });

  // Scroll progress bar & current section name
  const spreads = Array.from(document.querySelectorAll('.spread'));
  window.addEventListener('scroll', () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    const pct = h > 0 ? Math.min(100, Math.max(0, (window.scrollY / h) * 100)) : 0;
    $('prog').style.width = pct.toFixed(1) + '%';
    const mid = window.scrollY + window.innerHeight * 0.32;
    for(const s of spreads){
      if(s.offsetTop <= mid && s.offsetTop + s.offsetHeight > mid){
        $('now').textContent = s.dataset.name || 'One Table, Eighteen Books';
        break;
      }
    }
  }, { passive: true });

  const params = new URLSearchParams(window.location.search);
  if(params.get('reg') === 'm') reg = 'm';
  if(params.get('view') === 'map'){
    leftView = 'map';
    $('tab-tiles').setAttribute('aria-selected', 'false');
    $('tab-map').setAttribute('aria-selected', 'true');
    $('stones-grid').hidden = true;
    $('arch-map').hidden = false;
  }
  const bParam = Number(params.get('book'));
  if(bParam >= 1 && bParam <= 18) curBookIdx = bParam - 1;

  initAbacus();
  syncAll();
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

})();
