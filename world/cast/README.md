# Cast

Reference pictures of the people of both islands: each person alone, full length, front view, on
white, wearing what the canon gives them. They are image references for the book pictures
(`../panels/`), which take them as images 2, 3, … after the previs; nobody is modelled from them.
Image generation is used for people and nothing else: props are modelled in 3D in the world model
(`../src/blib/props.py`, `../src/blib/paxos_bld.py` and the other builders), where counts, grooves
and lettering come out exact.

- `cast.json`: every figure, with its prompt. Dress follows `../world-prompt.md` §2.3 (the ring
  road, the mercenaries and bandits, the students and the priestess) and §3.5 (Paxos), and
  `../settings.md` for Schedia's council and runners; garments are as long as the canon makes
  them. Every figure has a face of its own (a seed from its id, or its own `seed`); figures of one
  kind are told apart by colour, and their faces are kept ordinary so that nothing else marks them.
  Arche's figures go by number, with no names.
- `gen.py`: makes the pictures. `gen.py flux <id>` runs FLUX.2 klein 4B locally, the model behind
  `flux-gen`, about a minute a picture; on a 24 GB Mac run one figure to a process so memory is
  freed between pictures. `gen.py nb2 <id>` uses Nano Banana 2 instead. `--sheet <maker>` makes a
  contact sheet.
- `out/` (not in git): `out/flux/` holds the cast the book pictures use (`CAST=flux`, the
  default in `../panels/pipeline.py`), with `sheet.jpg` and the seconds each took in `times.json`;
  `out/v1/` the first version, from before every figure had a face of its own; `out/trial/` the
  model comparisons.

Write prompts in plain positive terms: FLUX drops the later clauses of long prompts and ignores
counts and negations ("no hood" gave hoods; "a flat rectangle pinned at the right shoulder, his
neck and head bare" did not). It also tends to stop "ankle-length" garments at mid-calf.
