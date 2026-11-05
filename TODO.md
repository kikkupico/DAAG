# To do

## One Writer at a Time and the Tholos

The writer, the pegged seal and the remodelled Tholos (October 2026) are in the book, the Schedia
page, the shared docs and the 3D model. What is left:

- [ ] **Home page cover.** The book's card on `index.html` still shows the old cover from R2: people,
      the board on its post, the old podium. Swap in the local plain render
      (`books/one-writer-at-a-time/img/cover.jpg`) or a new photoreal cover.
- [ ] **Setting pictures.** The Schedia page and the home page's Schedia card show the old Tholos
      interior (plain columns, block benches, the podium). Re-render `tholos_interior`,
      `tholos_exterior` and `tholos_court`, and update the alt texts.
- [ ] **Showcase.** `world/showcase` still has the old Tholos renders. Run
      `render.py -- shots_paxos` for the Tholos shots, then `gen_showcase.py final`. The captions are
      already updated.
- [ ] **Other shot variants.** Only variant `a` of each book shot was reframed and rendered. Variants
      `b`, `c`, `r` and `g1` in `world/panels/one-writer-at-a-time/shots.json` still frame the old
      podium and chair.
- [ ] **Photoreal pass with people.** The book now uses empty-hall renders. A pass with the council
      needs prompts that say who is the writer and at which bench; the writer wears nothing to mark
      the office.
- [ ] **A seal where manager and writer differ.** Seals 6, 7 and 8 in the book have the manager's and
      the writer's pegs on the same spoke. One example where they differ (Kleon calls, Liskovia
      writes) would show why the two rings are separate.
- [ ] **Check the † citations.** Each is in `reality.md` and on the Schedia page: the Athenian public
      seal (Constitution of Athens 44), the six-witness contract from Elephantine, and the painted dados
      of Delos and Olynthus.
