# Cast

Reference pictures of the people of both islands, and the sheets the book pictures take them from.
Each picture is one person alone, full length, facing the camera, on white, wearing what the canon
gives them. Image generation is used for people and nothing else: props are modelled in 3D in the
world model (`../src/blib/props.py`, `../src/blib/paxos_bld.py` and the other builders), where counts,
grooves and lettering come out exact.

- `cast.json`: every figure, with its prompt, and the sheets. Dress follows `../world-prompt.md` §2.3
  (the ring road, the mercenaries and bandits, the students and the priestess) and §3.5 (Paxos), and
  `../settings.md` for Schedia's council and runners; garments are as long as the canon makes them.
  Figures of one kind are told apart by colour, and their faces are kept ordinary so that nothing
  else marks them; every figure has a face of its own. Arche's figures go by number, with no names.
- `gen.py`: `submit`, `status` and `fetch` make the pictures with Nano Banana 2 through the Batch API
  (`../gemini.py`), at half the price; `now` makes one at once; `flux` runs FLUX.2 klein 4B locally
  instead (one figure to a process on a 24 GB Mac). `fetch` rebuilds the sheets; `sheets` does it by
  hand and `contact` puts every picture on one page.
- **Sheets.** A sheet is the figures that work together, side by side in one row on white, each at
  the size it was made, so heights compare, with its id printed below. A book picture sends the
  fewest sheets that hold its shot's cast as single images (`../panels/pipeline.py`) and names
  people by those ids. A figure can be on more than one sheet; keep a sheet to five people or fewer,
  since the model scales each sheet down to one input and every extra person makes each face smaller.
- `out/` (not in git): `out/nb2/` the cast the book pictures use, with `out/nb2/sheets/`; `out/flux/`
  the FLUX version; `out/v1/` the first version; `out/trial/` the model comparisons. Job records are
  in `batches/` (not in git).

Every picture and sheet carries its record (`../provenance.py`): the commit it was made at, its id or
sheet in `cast.json`, the model and batch job, and for a sheet the pictures on it with their hashes.
`python3 world/provenance.py show <picture>` prints it with the prompt read back from git.

Prompts: Nano Banana 2 follows lengths and negations; FLUX drops the later clauses of long prompts,
ignores negations ("no hood" gave hoods) and stops "ankle-length" garments at mid-calf, so for FLUX
write in plain positive terms.
