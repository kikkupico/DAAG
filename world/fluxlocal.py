"""FLUX.2 klein 4B, run locally: the model behind flux-gen, shared by world/cast and world/panels.

Free and slow (about a minute a picture on the 24 GB Mac), and weaker than Nano Banana 2 at keeping a
reference image's camera and at following counts and negations. Load it with pipe(); one picture to
a process keeps memory in hand. model() describes it for a picture's record (world/provenance.py).
Run with ~/Projects/flux/.venv/bin/python.
"""
from pathlib import Path

WEIGHTS = Path.home() / "Projects/flux/models/FLUX.2-klein-4B"
PYTHON = Path.home() / "Projects/flux/.venv/bin/python"
STEPS, GUIDANCE = 4, 1.0


def model(**settings):
    """FLUX as it runs: the weights' Hugging Face revision (from their download record) and the library."""
    meta = sorted((WEIGHTS / ".cache/huggingface/download").rglob("*.metadata"))
    revision = meta[0].read_text().split()[0][:12] if meta else None
    try:
        import diffusers
        lib = f"diffusers {diffusers.__version__}"
    except ImportError:
        lib = None
    return {"name": "FLUX.2-klein-4B", "repo": "black-forest-labs/FLUX.2-klein-4B", "revision": revision,
            "library": lib, "where": "local", "settings": {"steps": STEPS, "guidance": GUIDANCE, **settings}}


def pipe():
    import torch
    from diffusers import Flux2KleinPipeline
    p = Flux2KleinPipeline.from_pretrained(WEIGHTS, torch_dtype=torch.bfloat16)
    p.enable_model_cpu_offload()  # what fits a 24 GB Mac
    return p


def generate(p, prompt, images, width, height, seed):
    """One picture; images are PIL images given as references, or none."""
    import torch
    return p(prompt=prompt, image=images or None, width=width, height=height, guidance_scale=GUIDANCE,
             num_inference_steps=STEPS, generator=torch.Generator("cpu").manual_seed(seed)).images[0]
