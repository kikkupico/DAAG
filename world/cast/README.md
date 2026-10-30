# Cast

Reference pictures of the people of both islands, and sheets of each setting's people side by side.
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
- **In the book pictures** each person of a shot's cast goes in as a picture of their own, cropped
  to them, with their id printed below (`../panels/pipeline.py`), so each face keeps as much detail
  as the model's input allows; the shot's prompt names people by those ids.
- **Sheets** are for looking: the figures that work together, side by side in one row on white,
  each at the size it was made, so heights and colours compare, with its id printed below. A figure
  can be on more than one sheet.
- `out/` (not in git): `out/nb2/` the cast the book pictures use, with `out/nb2/sheets/`; `out/flux/`
  the FLUX version; `out/v1/` the first version; `out/trial/` the model comparisons. Job records are
  in `batches/` (not in git).

Every picture and sheet carries its record (`../provenance.py`): the commit it was made at, its id or
sheet in `cast.json`, the model and batch job, and for a sheet the pictures on it with their hashes.
`python3 world/provenance.py show <picture>` prints it with the prompt read back from git.

Prompts: Nano Banana 2 follows lengths and negations; FLUX drops the later clauses of long prompts,
ignores negations ("no hood" gave hoods) and stops "ankle-length" garments at mid-calf, so for FLUX
write in plain positive terms.
