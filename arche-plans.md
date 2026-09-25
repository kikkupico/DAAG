# The remaining Arche books

One page per book: the idea, the allegory, the chapters, and the decisions taken.
Read with `settings.md`, `buildings.md` and `process.md`; where this file and those disagree,
those are right until this file's decisions are taken back into them.

Four books remain: one on the ring road, three on Mount Phyle.

---

## Many Copies, Acting as One

Written: `books/many-copies-acting-as-one/`. The claims board at the Anchor, sharing the premise
of *Ordering Without Clocks*; see `settings.md`.

---

## Telling the Dead from the Slow

**Chandra & Toueg 1996 · the four camps, Mount Phyle**

Written: `books/telling-the-dead-from-the-slow/`. FLP's four men; see `settings.md`.

---

## Keeping Order Among Liars

**Castro & Liskov 1999 · the crown on a later night, Mount Phyle**

Written: `books/keeping-order-among-liars/`. The crown's four bandits; see `settings.md`.

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
- **The rotating turn** appears in three places: the DLS turns at the camps, the ◇S algorithm, and the
  crown's job. It is the same idea told three ways, which suits "later papers reuse existing rooms".
  Each book should name the others.
- **Sandglasses** are the only timers on the hill; water-clocks stay in the counting rooms.
- **Order.** *Many Copies* can be written any time. *Telling the Dead from the Slow* next on the
  hill, then *Keeping Order Among Liars*, then *Changing Leaders Among Liars*, which depends on it.
