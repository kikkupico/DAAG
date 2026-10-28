# Agent Instructions & Project Guidelines

## Temporary Reports and Scratch Artifacts
- **Always use `reports/` for temporary reports, test documents, and HTML evaluations.**
- **Always use `scratch/` for one-off debug scripts, temporary data files, and scratch experiments.**
- Both `reports/` and `scratch/` are gitignored. Never write temporary reports, ad-hoc test outputs, or experimental HTML files directly to the repository root or into tracked documentation folders (`books/`, `world/`, `places/`, etc.).

## 3D World & Blender Renders
- Renders use Blender with Cycles (Metal GPU on macOS) and the AgX view transform.
- Coordinate system: Blender coordinates have +Z elevation up, +X east, and +Y north.
- Lighting and skies:
  - Equirectangular HDRI sky maps live in `world/assets/polyhaven/hdri/`.
  - All HDRI lookups must resolve through `resolve_hdri_path()` to guarantee graceful fallbacks if an asset is missing.
  - Exposure is automatically governed by `adapt_exposure()` in `world/src/render.py` to prevent blown-out specular highlights on Aegean marble while preserving midtone and shadow contrast.
