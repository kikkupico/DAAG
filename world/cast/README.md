# Cast

Reference pictures of the people of both islands: what each kind of figure wears. They are image
references only; nobody is modelled from them. Image generation is used for people and nothing
else: props are modelled in 3D in the world model (`../src/blib/props.py`, `../src/blib/paxos_bld.py`
and the other builders), where counts, grooves and lettering come out exact.

- `cast.json`: every figure, with its prompt. Dress follows `../world-prompt.md` §2.3 (the ring
  road, the mercenaries and bandits, the students and the priestess) and §3.5 (Paxos), and
  `../settings.md` for Schedia's council and runners. Figures of one kind share one seed and differ
  only in the colours the canon gives them; each kind has its own seed, so kinds do not share a
  face. Arche's figures go by number, with no names.
- `gen.py`: makes the pictures locally with FLUX.2 klein 4B, the model behind `flux-gen`. On a
  24 GB Mac, run one figure to a process (`gen.py <id>`) so memory is freed between pictures;
  each takes about a minute. `--sheet` makes a contact sheet.
- `out/`: the pictures (not in git), `out/characters/`, `out/sheet.jpg`, the seconds each took in
  `out/times.json`, and the first pilot in `out/pilot/`.

One person to a picture, on a white ground, in a short prompt: the model drops the later clauses of
long prompts and does not keep counts or negations.
