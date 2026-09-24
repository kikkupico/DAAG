# The remaining Arche books

One page per book: the idea, the allegory, the chapters, and the decisions taken.
Read with `settings.md`, `buildings.md` and `process.md`; where this file and those disagree,
those are right until this file's decisions are taken back into them.

Four books remain: one on the ring road, three on Mount Phyle.

---

## Many Copies, Acting as One

**Herlihy & Wing 1990 · the counters, Arche's ring road**

**The idea.** A correctness condition, not an algorithm. An object shared by many callers is
*linearizable* if every operation seems to take effect at one instant between its call and its
answer, so the answers fit one sequential order that respects real time. Two properties set it
apart. It is **local**: a system is linearizable exactly when each object in it is (Theorem 1).
It is **nonblocking**: a pending call on a total operation can always be completed (Theorem 2).
Sequential consistency and serializability have neither property. The second half of the paper is
a **proof method**: an abstraction function that maps a representation to a *set* of possible
abstract values, shown on a highly concurrent FIFO queue built from `INC` and `SWAP`.

**The allegory.**
- **The counters and the jar lines**, as *Answering While Cut Off* fixed them: a jar's line holds
  the buyer's name or nothing, a purchase writes it, a question reads it. The rule of the counters is
  already stated in that book; this one owns it.
- **Judged by the sun**, which no one can read in the trading season; **the goatherd** of
  *Ordering Without Clocks* Ch. VI is the witness who could catch the houses out.
- **Locality:** each jar's line keeps the rule on its own, so the whole trade does.
- **Sequential consistency is not enough:** two jar lines, each answered consistently with some
  order, whose orders cannot be joined. It is the paper's two-queue history (H8), redone with lines.
- **The keeper** of *Answering While Cut Off* as a linearizable implementation, with the moment the
  keeper handles a slip as each operation's instant.

**Chapters.**
1. The counters and what a buyer can see.
2. Calls and answers: a history.
3. The rule, made exact.
4. One line at a time: locality.
5. A call never waits on another: nonblocking.
6. Weaker rules and why they fail (sequential consistency, serializability).
7. Proving an arrangement keeps the rule.
8. What the rule does not say: it is judged by the sun, not checked by any clerk.
9. In the Book, In the Paper.

**Must not exist:** a readable hour in the trading season; any house that checks the rule; the
goatherd used as a channel; a way round the road.

**Decided.**
1. **The queue:** the Anchor's **loading berths** carry the paper's queue and Section 4. A board of
   numbered berths and a take-a-number peg (`INC`); a porter who takes a cargo empties its berth
   (`SWAP`). Several porters work at once at one house, which is shared memory, the paper's own
   model, and nothing crosses the road.
2. **The title stays.** The book says the rule holds whether the object is one board or three books.
3. **Names:** Herlios and Wingaia, at two houses.

---

## Telling the Dead from the Slow

**Chandra & Toueg 1996 · the four camps, Mount Phyle**

**The idea.** FLP fails because a dead process cannot be told from a slow one. Chandra and Toueg
add an **unreliable failure detector**, a module at each process that suspects others and can be
wrong, and ask how good it must be. They define eight classes by **completeness** (every crashed
process is eventually suspected, by some or by every correct process) and **accuracy** (correct
processes are not suspected: never, or eventually; all of them, or at least one). The results:
- Weak completeness can be turned into strong by gossiping suspicions, so four classes suffice.
- With **S** (some correct process is never suspected), consensus tolerates any number of crashes,
  n − 1, with an algorithm that has no coordinator.
- With **◇S** (eventually some correct process is never suspected), consensus needs a majority of
  correct processes and uses a **rotating coordinator**.
- Every "eventually" class needs a majority; that bound is tight.
- Consensus and **atomic broadcast** are equivalent. (That ◇W is the *weakest* detector is the
  companion paper, not this one.)

**The allegory.**
- **The camps**, as in *The Limits of Agreement* and *Agreeing by Chance*: ravens, no longest
  flight, one or more tents may fall silent, no one lies.
- **The slate:** in each tent, a slate with a row per other tent, where a man chalks a mark against
  a tent he suspects and rubs it out when a bird comes. Its guarantees are **granted, not earned**,
  as `settings.md` says: ravens with unbounded flights cannot build such a slate, and the paper
  treats the detector as given in the same way.
- **The eight classes** as ways a slate can be wrong, and the reduction as men copying each other's
  marks.
- **The two algorithms.** Relaying estimates round by round (S); a rotating turn to propose (◇S).

**Chapters.**
1. The camps again, and what they lack.
2. The slate, and how it may be wrong.
3. Eight kinds of slate.
4. Copying marks: weak completeness made strong.
5. One man never wrongly marked: agreement despite n − 1 dead.
6. Eventually one man: agreement with a majority alive.
7. Why a majority is needed then.
8. What the slate does not say: how it could be built; atomic broadcast.
9. In the Book, In the Paper.

**Must not exist:** a slate that is ever certain; a raven that is lost; a liar; any fact that makes
the slate reliable which the camps could observe; anything following from the decision.

**Decided.**
1. **A turn to propose**, passing round the tents in shield order and fixed by the round number,
   not by anyone's command. The book names the rotating coordinator of *Agreeing When Messages Run
   Late* as the same device.
2. **The prop is the slate**: a slate in each tent with a row per other tent, chalked against a tent
   he suspects and rubbed out when a bird comes. "Tally" stays with the ring road.
3. **The book stays on the detector** and points to the DLS book for the rotating turn.
4. **Names:** Chandraios and Touegos at two tents, two ordinary names at the others.

---

## Keeping Order Among Liars

**Castro & Liskov 1999 · the crown on a later night, Mount Phyle**

**The idea.** State machine replication that tolerates f Byzantine replicas out of 3f + 1, safe
with no timing assumptions and live once delays stop growing without bound. In each **view** one
replica is the **primary**. It assigns sequence numbers (pre-prepare), and the replicas echo twice:
*prepare*, until 2f + 1 agree, which fixes the order within the view, then *commit*, until 2f + 1
agree, which fixes it across views. A client accepts a result on f + 1 matching replies. A
suspected primary is replaced by a **view change** carrying proof of what was prepared.
**Checkpoints** let the logs be trimmed. MACs replace signatures in the fast version.

**The allegory.**
- **The crown** of *The Limits of Agreement*: the chief's hollow and three crag posts, out of sight
  of one another, with ravens and seal rings. It is a later night, so there is no synchronous
  glass.
- **Wind on the peak** pins the ravens down while it blows. Entries are safe in any wind, and
  progress returns once the wind drops for long enough.
- **The loot book**, a copy at each post: where each strongbox lies and whose share it is. An entry
  is a request.
- **The chief's job**, numbering entries, starts with the man on the peak and passes round the four
  in a fixed order when the others suspect its holder. *The Limits of Agreement* already says "the
  chief is a job, not a rank."
- **Each man's sandglass** is only a timer for suspecting the chief, doubling at each change.
- **Two echoes before an entry stands**, each needing three seals.

**Chapters.**
1. The crown on a windy night.
2. The loot book and its entries.
3. The chief's job.
4. Two echoes.
5. Why three seals, and why four men.
6. When the chief stalls or lies: the change of job.
7. Trimming the book: checkpoints.
8. What it does not say: no progress while the wind blows; a lying man can still file nonsense
   entries.
9. In the Book, In the Paper.

**Must not exist:** a shout, signal or meeting on the crown; any synchronous glass; a man leaving
his post; anyone learning who lies; any consequence of an entry; bandits from off the hill.

**Decided.**
1. **The client rule is stated** and the book shows it is redundant for an honest man, whose own copy
   already tells him an entry stands; it is what a client who is not one of the four would need.
2. **Names:** Kastros and Liskovia at two places, two ordinary names at the others. Whoever sits on
   the peak holds the job first.
3. **MACs** go in the mapping table only; the seal rings are signatures.

---

## Changing Leaders Among Liars

**Yin, Malkhi, Reiter, Gueta & Abraham 2019 (HotStuff) · the same crown and loot book**

**The idea.** A leader-based Byzantine protocol in the DLS partial-synchrony model, with n = 3f + 1.
Each vote goes to the leader, who combines n − f of them into one **quorum certificate** (a
threshold signature), so each phase costs a linear number of messages. Three phases (prepare,
pre-commit, commit) where earlier protocols used two, and that third phase is what buys:
- **Linear view change**, a new leader costing no more than an ordinary step;
- **Optimistic responsiveness**, moving at the pace of actual message delay after GST instead of
  waiting out a maximum.

Safety comes from **locks** (a replica locks on a certificate) and the **safeNode** rule: accept a
proposal that extends your lock, or that carries a certificate from a later view. A separate
**pacemaker** handles liveness. **Chained HotStuff** pipelines the phases, so every view proposes
a new entry and the leader rotates each view.

**The allegory.**
- **The same crown, loot book and wind** as *Keeping Order Among Liars*. It must not contradict it.
- **The job passes with every entry**, whether or not anyone suspects its holder.
- **The bundle:** the holder ties three sealed votes into one bundle and sends it on. A real
  threshold signature makes the bundle the size of one seal, and the book says so plainly.
- **A lock** is a bundle a man keeps and will not act against, unless shown a later bundle.
- **The pacemaker** is each man's sandglass, which moves the job on when a view runs long.

**Chapters.**
1. What the change of job cost in the earlier book.
2. Votes to one man, bundles to all.
3. Three stages, not two: the hidden lock.
4. The rule for accepting a proposal.
5. Safety in any wind.
6. Moving at the pace of the ravens.
7. The chain: every entry a new holder.
8. What it does not say: no progress before the wind drops; the bundle's size.
9. In the Book, In the Paper.

**Must not exist:** as for *Keeping Order Among Liars*, and any procedure that contradicts it.

**Decided.**
1. **Names:** four seats for five authors: Yinos, Malkhia, Reiteros and Guetaia; the footnote credits
   all five, Abraham included.
2. **The hidden lock is shown** on the crown: a two-stage procedure that must wait out a full glass
   after each change of holder, set against the three-stage one that need not.


---

## Across the four

- **Names follow papers**, with a footnote in every book. The crown's first-night men (Lamportos,
  Shostakos, Peasios, Dolevios) are not the men of the two crown books.
- **The rotating turn** appears in three places: the DLS price rounds, the ◇S algorithm, and the
  crown's job. It is the same idea told three ways, which suits "later papers reuse existing rooms".
  Each book should name the others.
- **Sandglasses** are the only timers on the hill; water-clocks stay in the counting rooms.
- **Order.** *Many Copies* can be written any time. *Telling the Dead from the Slow* next on the
  hill, then *Keeping Order Among Liars*, then *Changing Leaders Among Liars*, which depends on it.
