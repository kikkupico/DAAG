# The Paxos books

One page per book, centred on the **allegorical devices**: each device, what it stands for in the paper, and where it meets the other books. Read with `settings.md`, `buildings.md` and `process.md`; where this file and those disagree, those are right until this file's decisions are taken back into them.

*The Part-Time Parliament* is not here: it is Lamport's own allegory, already a scroll. *One Leader at a Time* is a scroll too. The other five books below are still in the chapter layout; when one is converted to the scroll format (`process.md`, `art/scroll/BRIEF.md`), its **Chapters** list is the order of its spreads.

---

## One Leader at a Time

Written: `books/one-leader-at-a-time/`. The Tholos of Schedia, its council of five and the podium;
see `settings.md`.

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
| a work's home libraries: the same N libraries hold every copy of it | The replication factor N. |  |
| a new edition sent to all N home libraries, announced as done once W have acknowledged it | The write quorum W. |  |
| a reader who asks R home libraries and takes the newest copy handed over | The read quorum R. |  |
| the Chamber's rule: R + W > N, so the two groups always share a library | A strict quorum; intersection. | The Chamber's majorities; the camps' pledges, where two pledged and three needed to call the other gate exceed four (*Agreeing When Messages Run Late*) |
| the scholars' rule: R + W ≤ N, quicker, and the groups may miss | A partial quorum. |  |
| the edition still on its way to the other home libraries after it is announced | Expanding quorums; anti-entropy. | The festival (*Spreading by Word of Mouth*) |
| "one of the last k editions" | k-staleness. |  |
| "t hours after it was announced" | t-visibility. |  |
| the four legs: the edition out, the acknowledgement back, the reader's request out, the copy back | WARS: the four message delays. |  |
| the couriers' logbook of journey times | The latency distributions, measured in production. |  |
| the reader who is never handed an older copy than last time | Monotonic reads. |  |
| a promise with odds: "nine chances in ten it is current after a day" | PBS consistency: an expected bound, not a guarantee. | The promise of the span t (*Answering While Cut Off*): a bound held for certain |

**Chapters.**
1. A work and its home libraries.
2. How many to wait for.
3. When the groups miss each other.
4. How many editions behind.
5. How long until it shows.
6. The four legs.
7. Never going backwards.
8. What it does not say: a probability, not a promise.
9. In the Book, In the Paper.

**Must not exist:** any certainty that a copy is current; a reader who asks every home library; a store in the book (the paper is a model); an assembly.

**Open.**
1. **Clocks.** t-visibility is in hours. Paxos tells time by the sun (the Chamber's meridian), so the scholars can read an hour; confirm that the scholars' coast is not under Arche's cloud.
2. **Names.** Bailios and four others for five authors, or two names and the footnote.

---

## Changes That Never Clash

Written: `books/changes-that-never-clash/`.

**Shapiro, Preguiça, Baquero & Zawirski 2011 (both papers) · the compendium and its pebble boards, Paxos**

**The idea.** **Strong eventual consistency (SEC):** replicas that have received the same updates are in the same state, with no coordination. Two sufficient conditions. **State-based (CvRDT):** states form a join-semilattice, updates only move up, and merge is the least upper bound. **Op-based (CmRDT):** concurrent operations commute, and delivery is causal. Each kind can emulate the other. SEC is not sequential consistency. The comprehensive report adds the portfolio: counters, registers, sets, graphs, sequences, and a map built from them (the shopping cart).

**The setup, in three sentences.** Every library on the coast keeps its own copy of the compendium and changes it at once, and couriers carry copies of entries, or slips naming one change, between the libraries. The coast's plain rule keeps the version of an entry with the larger tally, which throws away one of two changes made in ignorance of each other even when they touch different parts. So an entry is made of parts, each merged by its own rule; the book follows the comet's entry: its count of sightings, its account of what the comet is, and its cross-references, under a heading that can be withdrawn.

**The devices.**

| Device | In the paper | Also in |
|---|---|---|
| the larger tally stands, for the whole entry | Last writer wins over a whole object. | *Spreading by Word of Mouth*, *Probably Up to Date* |
| the comet's count of sightings on a marble board, one column of pebbles per library | A counter as a vector, one entry per replica (G-Counter). | The column room (*Ordering Without Clocks*) |
| a board for every entry that counts something; the book watches the comet's | One counter per key, each behaving as the one shown. |  |
| a library adds pebbles only to its own column | An update touches only the replica's own entry. |  |
| merging two boards: take the larger pile in each column | Merge as join: commutative, associative, idempotent. |  |
| why not one pile: adding two boards counts a pebble twice, and again at every merge | Why a plain sum is not a CRDT. |  |
| the whole board, or a slip "one more sighting at Library 1" | State-based or op-based. |  |
| a slip must arrive once, and after those it follows | Op-based needs exactly-once, causal delivery. | *What You Can Promise Alone*: no reply before the letter it answers |
| white pebbles for sightings recorded, black for sightings struck at that library, whichever recorded them | Two counters, one up and one down (PN-Counter). |  |
| two libraries striking the one sighting, and the count at −1 | A global invariant cannot be kept locally (report §3.1.4: two replicas at 1 decrement and converge to −1). |  |
| a library strikes only sightings it recorded itself | The local invariant P[g] − N[g] ≥ 0; rights reserved in advance (escrow). |  |
| the account of the comet, the later by tally or both kept, "some say … others say …" | LWW-Register; MV-Register with version vectors. | The tally house (*Ordering Without Clocks*) |
| cross-references, only added; a struck-off list; a tag for every writing | G-Set; 2P-Set; OR-Set (add wins). |  |
| headings with a tag for every writing into the entry; a withdrawn heading written into stands | A map on an OR-Set of keys (the report's OR-Cart). |  |
| a reference to a withdrawn heading | An invariant across components; objects independent, no transactions. | *What You Can Promise Alone*: a new entry and the reference to it bound under one cord |
| two libraries each adding one reference and striking the other's, ending with both | SEC is not sequential consistency. | *Many Copies, Acting as One* |

**Chapters.**
1. The compendium.
2. Two changes to one entry.
3. The count of sightings.
4. One column each, and take the larger.
5. The whole board, or a slip.
6. Sightings struck, and the count below nothing.
7. Two accounts of one comet.
8. Cross-references added and struck.
9. One compendium from its parts.
10. Not the same as one order.
11. What it does not say; the result.

**Must not exist:** an assembly; a vote over a count; a pile that shrinks; any wait for another library before changing an entry; a name for any librarian; sources on an entry (they belong to *What You Can Promise Alone*).

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
5. Staying with one library.
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
| the door of the assemblies, facing north up the bay to the Chamber and the Tholos | Coordination. | *The Part-Time Parliament*; *One Leader at a Time* |
| a waiting chain: library A waits on B's copy, B on A's; once found, it stays found | Deadlock detection: monotone. |  |
| a work no one cites any more may be discarded, but only once all have been heard from | Garbage collection: non-monotone. |  |
| a librarian who knows neither how many libraries there are nor their names | An oblivious transducer. |  |
| every library already holding every copy, so nobody needs to read a letter | Ameloot's coordination-free: an ideal distribution on which no message is needed. |  |
| a reading list sent sealed with its count, so the receiver knows when he has it all | Sealing (the 2020 shopping-cart checkout). |  |
| the larger pile in each column of the pebble tables | A monotone merge. | *Changes That Never Clash* |
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

- **Shared vocabulary on the scholars' coast.** A *library* is a replica, the *compendium* the replicated data, an *entry* an item and its *heading* the key, a *version* a version, a *courier* a message and a stopped courier a partition, a *reader* a client. Every book uses these words the same way.
- **Versions carry tallies.** Which version is newer is settled by a tally, the device of *Ordering Without Clocks*; where causality matters, by columns, as in its column room.
- **Schedia is on the same island.** Its laws are its own, but the sun, the couriers and the scholars' roads reach it as they reach the rest of Paxos.
- **Paxos can read the sun.** Unlike Arche in the trading season, Paxos tells time by the sun; the Chamber has a meridian line.
- **Names follow papers**, with a footnote in every book.
- **Order.** *Spreading by Word of Mouth* first on the coast, since it sets the vocabulary; then *Probably Up to Date*, *Changes That Never Clash*, *What You Can Promise Alone*; *Knowing When to Wait* last, since it sorts all of them. *One Leader at a Time* can be written any time.
