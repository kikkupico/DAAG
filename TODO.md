# To do

## One Leader at a Time and the Tholos

The seal, the wreath and the remodelled Tholos (October 2026) are in the book, the Schedia page, the
shared docs and the 3D model. What is left:

- [ ] **Home page cover.** The book's card on `index.html` still shows the old cover from R2: people,
      the board on its post, the old podium. Swap in the local plain render
      (`books/one-leader-at-a-time/img/cover.jpg`) or a new photoreal cover.
- [ ] **Setting pictures.** The Schedia page and the home page's Schedia card show the old Tholos
      interior (plain columns, block benches, the podium). Re-render `tholos_interior`,
      `tholos_exterior` and `tholos_court`, and update the alt texts.
- [ ] **Showcase.** `world/showcase` still has the old Tholos renders. Run
      `render.py -- shots_paxos` for the Tholos shots, then `gen_showcase.py final`. The captions are
      already updated.
- [ ] **Scroll copy.** `scroll/parts/one-leader-at-a-time/` is far behind the built book: board,
      podium, old pictures. Bring it up to date or retire it.
- [ ] **Other shot variants.** Only variant `a` of each book shot was reframed and rendered. Variants
      `b`, `c`, `r` and `g1` in `world/panels/one-leader-at-a-time/shots.json` still frame the old
      podium and chair.
- [ ] **Photoreal pass with people.** The book now uses empty-hall renders. A pass with the council
      needs a wreath on the holder's head in the cast references and prompts, and the prompts should
      say who sits at the table as manager.
- [ ] **A seal where manager and holder differ.** Seals 6, 7 and 8 in the book have the same person in
      the middle and under the wreath. One example where they differ (Kleon calls, Liskovia takes the
      wreath) would show why the wreath is a separate piece.
- [ ] **Check the † citations.** Each is in `reality.md` and on the Schedia page: the Athenian public
      seal (Constitution of Athens 44), the six-witness contract from Elephantine, the myrtle wreath
      of office, and the painted dados of Delos and Olynthus.
