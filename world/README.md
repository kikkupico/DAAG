# World: the procedural 3D model of the whole setting

One 3D model of both islands, Arche and Paxos, with every building, made by script in Blender. How to rebuild it, what it checks and what each module holds are in `BUILD.md`.

## Sources

Arche's layout comes from the text alone; Paxos stands on the real ground of Leros, turned end to end (`world-prompt.md` §3.4). The coasts, harbours, roads, mountain and sites are placed to satisfy what the documents require, and the model checks the requirements it can measure (lines of sight on Arche, the bay and the ferry on Paxos).

- `settings.md`: the setting, geography, physics and constraints of each place. Where another document disagrees, this one wins.
- `buildings.md`: the building or room for each paper, what each is and how they relate.
- `arche-plans.md`, `paxos-plans.md`: further plans for each island's books.
- `reality.md`: the Greek precedents for each place and building, for architectural detail.
- `world-prompt.md`: the art prompts and world rules, including style, materials and light. Its pipeline sections (Meshy conversions of image plates, model scales, `explorer.html`) describe the separate image-to-3D island models in `archive/art/`, not this one.

These are copies of the documents at the root of the project and `archive/art/world-prompt.md`, and they differ from the root on these points: Paxos is three sections joined by two necks, after Leros; Arche's harbours sit at valley mouths, after Serifos, with no scarp behind the towns; the Chamber and the Tholos are painted; and `world-prompt.md` §3.4 carries the modelling defaults for both islands (Mount Phyle's proportions, the real references, the Paxos summits).
