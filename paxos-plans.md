# The Paxos books

One page per book, centred on the **allegorical devices**: each device, what it stands for in the paper, and where it meets the other books. Read with `settings.md`, `buildings.md` and `process.md`; where this file and those disagree, those are right until this file's decisions are taken back into them.

*The Part-Time Parliament* is not here: it is Lamport's paper, not retold.

---

## One Leader at a Time

**Oki & Liskov 1988 · the Odeon, Schedia, Paxos**

**The idea.** Primary-copy replication that survives crashes and partitions. One cohort, the **primary**, does all the work and passes every event to the **backups** in order; an event is safe once a majority of cohorts know it. When the primary is lost, a **view change** forms a new view from a majority and starts it from the most complete record, so everything a majority knew survives. The paper builds this for **transactions**: one-copy serializability, with two-phase commit across groups.

**The devices.**

| Device | In the paper | Also in |
|---|---|---|
| the front row (*proedria*): one throne per legislator, each with a law book | The module group's cohorts; the fixed set of thrones is the configuration. | The Chamber, where every legislator keeps a ledger |
| the speaker on the stage | The primary: runs every call and settles every measure. | The crown's chief's job in *Keeping Order Among Liars*, which borrows VR's views |
| the rest of the front row, writing down what the speaker says | Backups, passive: they only record. |  |
| the public in the seats behind | Clients, who deal only with the speaker. | The houses ordering at Arche's order board |
| the board on the stage wall: a count and the name of the legislator who raised it | The viewid ⟨cnt, mid⟩, totally ordered, unique to its caller. | Ties broken by name, as the tally house's middle room breaks them by house number (*Ordering Without Clocks*); the Chamber's ballot numbers |
| the line number in the speaker's record, starting again at each new board | A timestamp, meaningful only within its view. |  |
| "board 7, line 12" | A viewstamp ⟨viewid, ts⟩. |  |
| each legislator's note of the last line he holds under each board | The cohort's history. |  |
| the dictation: the speaker's record read out line by line, taken down in order | The communication buffer: event records delivered to the backups in timestamp order. | The one-way roads of Arche, where nothing overtakes |
| the speaker's pause until enough of the row has written up to a line that, with him, they are a majority | force-to: waiting for a sub-majority of backups. | Majorities that must overlap, as in the Chamber; at the camps a pledge and a call cannot both miss, 2 + 3 > 4 (*Agreeing When Messages Run Late*) |
| the roll: legislators glance along the row for someone gone, or someone back | "I'm alive" messages, and the events that start a view change. | The slate of *Telling the Dead from the Slow*: an empty throne is a man gone or a man slow |
| the caller: any legislator who notices, raising a higher board | The view manager, sending invitations; the others are underlings. |  |
| the answer to a call: "I hold up to board 6, line 40", or "I have lost my book" | A normal acceptance with its viewstamp, or a crash-accept. |  |
| the rule for a new board: a majority answered, and among them someone sure to hold every settled line | The view-formation conditions (1)–(3). |  |
| the new speaker: whoever holds the latest line, the old speaker if he can | New primary = the cohort with the highest viewstamp. |  |
| the old speaker who has not noticed | Several active primaries: the old one cannot force, so settles nothing. |  |
| a legislator who returns without his book; a majority who lose theirs at once | A crashed cohort's volatile state; a catastrophe, after which no new view can ever form. |  |

**Chapters.**
1. The Odeon and its front row.
2. The dictation.
3. Board and line: viewstamps.
4. When a line is settled.
5. An empty throne: calling a new board.
6. Who takes the stage.
7. The speaker who has not noticed.
8. Measures that touch several rows (transactions), if kept.
9. Against the Chamber: one voice, or anyone may propose.
10. In the Book, In the Paper.

**Must not exist:** a law settled without a majority of the front row; a speaker chosen for his views; a Paxon decree that binds Schedia; anything named after the algorithm; oratory used as a broadcast that no one can miss.

**Open.**
1. **Transactions.** The paper's case is transactions that call several module groups, with psets and two-phase commit. Carry it (several committees in the Odeon, each with its own front row and speaker, and a measure that touches more than one), or keep to one group and leave transactions to the paper column?
2. **Partitions in a theatre.** A voice reaches every seat, so how is the row split? Proposal: legislators come and go by the side doors, as on Paxos, and those out on the porch cannot hear.
3. **Two on the stage.** `settings.md` says nothing proceeds if two claim the stage. The paper says the old speaker may still answer but cannot settle anything. Reword the settings to match.
4. **Names.** Okios and Liskovia. Liskov is credited, not named, on the crown, where the bandits go by number.

---

## Spreading by Word of Mouth

**Demers et al. 1987 · the stoa and the festival ground, Paxos**

**The idea.** Keeping many replicas of a database consistent by random exchange, analysed as epidemics. **Direct mail** sends each update to every site at once and is unreliable. **Anti-entropy**, sites comparing whole databases with a random partner, is a simple epidemic that reaches everyone, slowly. **Rumour mongering** spreads a hot update until the carrier loses interest: cheaper, but it leaves a **residue** who never hear. Deleting needs **death certificates**. **Spatial distributions**, preferring near partners, cut the traffic on long links. The measures are residue, traffic and delay.

**The devices.**

| Device | In the paper | Also in |
|---|---|---|
| the libraries along the coast, each holding copies of the works | Sites, each with a replica of the database. |  |
| a work's text, carrying the tally of its edition; the newer edition wins | A database entry with its timestamp. | The tallies of the tally house (*Ordering Without Clocks*) |
| a scrap of papyrus with a new learning | An update. |  |
| letters to every library at once | Direct mail: n messages, some lost, and the sender may not know every site. | Slips on Arche's road |
| the scholar in the stoa telling whoever he meets while the news is fresh | Rumour mongering: an infective site. |  |
| losing interest: after meeting k who already knew, or at a toss | Loss of interest: feedback or blind, counter or coin. | The coin of *Agreeing by Chance*, used differently |
| telling, asking, or both | Push, pull, push-pull. |  |
| the libraries the news never reached | The residue. |  |
| the festival: pairs of copyists compare whole collections and keep the newer edition of each work | Anti-entropy, a simple epidemic that reaches everyone. |  |
| comparing catalogues first, and the list of recent editions | Checksums and recent-update lists, which make anti-entropy cheap. |  |
| a notice of withdrawal: "this work is withdrawn, as of tally t" | A death certificate: a deletion must travel like an update, or an old copy brings the work back. |  |
| the old notice kept by only a few libraries, woken when a stale copy turns up | Dormant death certificates and reactivation. |  |
| preferring partners close by | Spatial distributions. | The courier routes of differing length, which the ground provides |
| the traffic on the one long route | Traffic on critical links. |  |

**Chapters.**
1. The libraries and the news.
2. Letters to everyone.
3. The festival: comparing whole collections.
4. Word of mouth, and losing interest.
5. Who never hears.
6. Withdrawing a work.
7. Near partners and the long route.
8. In the Book, In the Paper.

**Must not exist:** anyone organising the spread; an assembly or a vote; a register of who knows what; a promise that word of mouth alone reaches everyone.

**Open.**
1. **How often the festival meets.** `settings.md` makes it yearly; the paper runs anti-entropy regularly, as the backstop to rumour. Keep it yearly (slow and sure), or make it a regular meeting?
2. **What a scrap carries.** "The Earth goes round the Sun" is a rumour, but the paper's updates are entries in a database. Proposal: a scrap carries a new edition of an entry in the shared catalogue, and the Sun is the first example.
3. **Names.** Nine authors. Demerios and two or three others; the footnote credits all nine.

---

## Probably Up to Date

**Bailis et al. 2012 · the libraries, Paxos**

**The idea.** In a Dynamo-style store each item lives on N replicas; a write waits for W acknowledgements and a read for R replies. With R + W ≤ N the two sets may not overlap, so a read can miss the latest write. **PBS** measures how often and by how much: **k-staleness**, the chance of reading one of the last k versions, falls exponentially in k; **t-visibility**, the chance of reading a write t seconds after it returns, is modelled by **WARS** and evaluated with measured latencies; **monotonic reads** follows from k-staleness. Writes keep spreading to all N after they return (expanding quorums).

**The devices.**

| Device | In the paper | Also in |
|---|---|---|
| a work's keepers: the same N libraries hold every copy of it | The replication factor N. |  |
| a new edition sent to all N keepers, announced as done once W have acknowledged it | The write quorum W. |  |
| a reader who asks R keepers and takes the newest copy handed over | The read quorum R. |  |
| the Chamber's rule: R + W > N, so the two groups always share a library | A strict quorum; intersection. | The Chamber's majorities; the camps' pledges, where two pledged and three needed to call the other gate exceed four (*Agreeing When Messages Run Late*) |
| the scholars' rule: R + W ≤ N, quicker, and the groups may miss | A partial quorum. |  |
| the edition still on its way to the other keepers after it is announced | Expanding quorums; anti-entropy. | The festival (*Spreading by Word of Mouth*) |
| "one of the last k editions" | k-staleness. |  |
| "t hours after it was announced" | t-visibility. |  |
| the four legs: the edition out, the acknowledgement back, the reader's request out, the copy back | WARS: the four message delays. |  |
| the couriers' logbook of journey times | The latency distributions, measured in production. |  |
| the reader who is never handed an older copy than last time | Monotonic reads. |  |
| a promise with odds: "nine chances in ten it is current after a day" | PBS consistency: an expected bound, not a guarantee. | The promise of the span t (*Answering While Cut Off*): a bound held for certain |

**Chapters.**
1. A work and its keepers.
2. How many to wait for.
3. When the groups miss each other.
4. How many editions behind.
5. How long until it shows.
6. The four legs.
7. Never going backwards.
8. What it does not say: a probability, not a promise.
9. In the Book, In the Paper.

**Must not exist:** any certainty that a copy is current; a reader who asks every keeper; a store in the book (the paper is a model); an assembly.

**Open.**
1. **Clocks.** t-visibility is in hours. Paxos tells time by the sun (the Chamber's meridian), so the scholars can read an hour; confirm that the scholars' coast is not under Arche's cloud.
2. **Names.** Bailios and four others for five authors, or two names and the footnote.

---

## Changes That Never Clash

**Shapiro, Preguiça, Baquero & Zawirski 2011 (both papers) · the far terraces, Paxos**

**The idea.** **Strong eventual consistency (SEC):** replicas that have received the same updates are in the same state, with no coordination. Two sufficient conditions. **State-based (CvRDT):** states form a join-semilattice, updates only move up, and merge is the least upper bound. **Op-based (CmRDT):** concurrent operations commute, and delivery is causal. Each kind can emulate the other. SEC is not sequential consistency. The comprehensive report adds the portfolio: counters, registers, sets, graphs, sequences.

**The devices.**

| Device | In the paper | Also in |
|---|---|---|
| the terrace tables: for each work, one column of pebbles per library | A counter as a vector, one entry per replica (G-Counter). | The column room (*Ordering Without Clocks*) |
| a library adds pebbles only to its own column | An update touches only the replica's own entry. |  |
| merging two tables: take the larger pile in each column | Merge as join: commutative, associative, idempotent. |  |
| why not one pile: two terraces adding each other's totals count twice, and again at every merge | Why a plain sum is not a CRDT. |  |
| white pebbles for copies made, black for copies lost | Two counters, one up and one down (PN-Counter). |  |
| sending the whole table, or a notice "one more copy at library X" | State-based or op-based. |  |
| a notice must arrive once, and after those it follows | Op-based needs exactly-once, causal delivery. | *What You Can Promise Alone*: no reply before the letter it answers |
| two terraces that have taken in the same notices show the same piles | SEC. |  |
| the catalogue of titles, only ever added to | G-Set. |  |
| the struck-off list: once struck, never restored | 2P-Set. |  |
| each entry carries its own mark; striking out removes only the marks you have seen | OR-Set (add wins). |  |
| two libraries each adding one title and striking the other's, ending with both | SEC is not sequential consistency. | *Many Copies, Acting as One* |
| the latest edition wins by its tally | LWW-Register. | The tally house (*Ordering Without Clocks*) |
| the register of which work cites which | The graph CRDT (the paper's web-crawler example). |  |
| Arche's count of jars | The contrast: ordered and snapshotted, never merged. | *Taking Stock Without Stopping* |

**Chapters.**
1. The count no one settles.
2. One column each.
3. Take the larger: why merging never clashes.
4. Sending the table or sending the change.
5. Made and lost: counting down.
6. Lists of titles: adding, striking, adding back.
7. Not the same as one order.
8. In the Book, In the Paper.

**Must not exist:** an assembly; a vote over a count; a pile that shrinks; any wait for another library before adding a pebble.

**Open.**
1. **Black pebbles.** `settings.md` counts copies made only, which is a G-Counter; the terrace prompt already shows black and white. Use black for copies lost (PN-Counter)?
2. **The graph** is the short paper's worked example. Keep it (cross-references between works) or leave it to the paper column?
3. **Names.** Four authors at four terraces: Shapirios, Preguiçaia, Baqueros, Zawirskios.

---

## What You Can Promise Alone

**Bailis et al. 2014 · the reading room, Paxos**

**The idea.** Which transactional isolation levels and consistency guarantees can a system give while every replica stays available through a partition? **Achievable (HAT):** read uncommitted, read committed, **monotonic atomic view**, item and predicate cut isolation. **With sticky availability** (a client keeps to one replica): read your writes, monotonic reads and writes, writes follow reads, **causal consistency**. **Not achievable:** preventing **lost update** or **write skew**, hence snapshot isolation, repeatable read and serializability; and any **recency** guarantee.

**The devices.**

| Device | In the paper | Also in |
|---|---|---|
| a reader's business at one visit: several works asked for, or several corrections made | A transaction. |  |
| the couriers stopped | A partition. | Lost birds at the camps (*Answering While Cut Off*) |
| the librarian who answers from his own shelves | High availability. | The gate-glass: answering from one's own book |
| a reader who keeps to his own library | Sticky availability. |  |
| never shown a correction abandoned or half written | Read committed. |  |
| corrections to several works bound under one seal: seen all together or not at all | Monotonic atomic view. |  |
| asking twice in one visit, and getting the same answer | Item cut isolation; predicate cut for "every work on the stars". |  |
| a reader who always finds his own corrections | Read your writes. |  |
| never a reply read before the letter it answers | Causal consistency. | The column room (*Ordering Without Clocks*) |
| two readers borrowing the last copy at two libraries | Lost update: cannot be prevented. | Two men told different gates (*Answering While Cut Off*) |
| two readers each borrowing one of the last two copies, when one must stay on the shelf | Write skew. |  |
| "this is the latest edition" | Recency: cannot be promised. | *Probably Up to Date*: only probably |

**Chapters.**
1. The couriers stop.
2. A reader's visit.
3. No half-made corrections.
4. The same answer twice.
5. Keeping to one library.
6. Letters and replies.
7. The last copy.
8. What no librarian can promise alone.
9. In the Book, In the Paper.

**Must not exist:** an assembly; a librarian waiting on a courier before answering; a promise that needs another library; a lost copy that anyone is blamed for.

**Open.**
1. **Lending.** The last-copy example needs libraries that lend. `settings.md` already says "two readers never take the last copy"; confirm lending is part of the coast's practice.
2. **Names.** Bailios again, with Davidsonia, Feketeos and others for the seven authors; the footnote says names follow papers.

---

## Knowing When to Wait

**Hellerstein 2010 · Ameloot, Neven & Van den Bussche 2011 · Hellerstein & Alvaro 2020 · the hall of two doors, Paxos**

**The idea.** **CALM:** a program has a consistent, coordination-free distributed implementation if and only if it is **monotonic**: more input never retracts an output. Conjectured by Hellerstein (2010); proved by Ameloot, Neven and Van den Bussche (2011) for networks of relational transducers, where coordination-free programs compute exactly the monotone queries, as do **oblivious** ones that know neither the other nodes nor how many there are; restated by Hellerstein and Alvaro (2020), who show how to **seal** a non-monotone step so that only it needs coordination.

**The devices.**

| Device | In the paper | Also in |
|---|---|---|
| a question brought to the hall | A program or query. |  |
| "has at least one copy of this work been made?": once yes, yes for ever | A monotone query. |  |
| "is this every copy?", "no one has claimed this" | A non-monotone query: it rests on absence. |  |
| the scholars' door | Coordination-free. | The scholars' coast |
| the door of the assemblies, facing north up the bay to the Chamber and the Odeon | Coordination. | *The Part-Time Parliament*; *One Leader at a Time* |
| a waiting chain: library A waits on B's copy, B on A's; once found, it stays found | Deadlock detection: monotone. |  |
| a work no one cites any more may be discarded, but only once all have been heard from | Garbage collection: non-monotone. |  |
| a librarian who knows neither how many libraries there are nor their names | An oblivious transducer. |  |
| every library already holding every copy, so nobody needs to read a letter | Ameloot's coordination-free: an ideal distribution on which no message is needed. |  |
| a reading list sent sealed with its count, so the receiver knows when he has it all | Sealing (the 2020 shopping-cart checkout). |  |
| the terrace merge | A monotone merge. | *Changes That Never Clash* |
| the last copy on loan | Lost update needs coordination because it is non-monotone. | *What You Can Promise Alone* |
| a stable property: once true, true for ever | Detectable from a partial view. | *Taking Stock Without Stopping* |

**Chapters.**
1. Two doors.
2. Questions that only grow.
3. Questions that rest on absence.
4. The waiting chain and the unwanted work.
5. The librarian without a roster.
6. The proof, in outline.
7. Sealing: waiting only once.
8. What goes out by each door, across the series.
9. In the Book, In the Paper.

**Must not exist:** the hall ruling on anything; a question it cannot sort; a third door; an assembly inside the hall.

**Open.**
1. **The proof.** Ameloot's definition of coordination-free (an ideal distribution on which no message is needed) is subtle. How much of it goes in the prose, and how much in closed proofs?
2. **The 2010 paper's other conjectures** (CRON, Fateful Time) are left out.
3. **Names.** Hellersteinos and Alvaria, with Ameloot, Neven and Van den Bussche as three of the questioners; the footnote credits all five.

---

## Across the six

- **Shared vocabulary on the scholars' coast.** A *library* is a replica, a *work* an item, an *edition* a version, a *courier* a message and a stopped courier a partition, a *reader* a client. Every book uses these words the same way.
- **Editions carry tallies.** Which edition is newer is settled by a tally, the device of *Ordering Without Clocks*; where causality matters, by columns, as in its column room.
- **Schedia is on the same island.** Its laws are its own, but the sun, the couriers and the scholars' roads reach it as they reach the rest of Paxos.
- **Paxos can read the sun.** Unlike Arche in the trading season, Paxos tells time by the sun; the Chamber has a meridian line.
- **Names follow papers**, with a footnote in every book.
- **Order.** *Spreading by Word of Mouth* first on the coast, since it sets the vocabulary; then *Probably Up to Date*, *Changes That Never Clash*, *What You Can Promise Alone*; *Knowing When to Wait* last, since it sorts all of them. *One Leader at a Time* can be written any time.
