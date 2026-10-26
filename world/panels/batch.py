#!/usr/bin/env python3
"""Book pictures from previs images through the Gemini Batch API: the usual route (half price, not immediate).

    python3 world/panels/batch.py submit <previs.png | folder ...|all>   build, upload and start one job
    python3 world/panels/batch.py status [job]                          state of every job, or one
    python3 world/panels/batch.py fetch [job] [--force]                 save the pictures of finished jobs
    python3 world/panels/batch.py cancel <job>

The inputs are previs images made by previs.py, as for pipeline.py: a file is one previs, a folder the
newest previs of every shot under it (world/panels/<book> is a book), and "all" every book's but the
examples. Each previs becomes one request, built by pipeline.request exactly as pipeline.py builds it:
the previs as image 1, the cast sheets after it, the prompts, all from the shot at the previs's commit.
It runs on Nano Banana 2 at 1K (IMAGE_MODEL and IMAGE_SIZE, world/gemini.py), and usually finishes
well within its 24-hour target; a job not done in 48 hours expires.

Every job is recorded in world/panels/batches/<id>.json (not in git), so status and fetch work from any
later session. fetch saves each picture where pipeline.py would, scene-<version>.png beside its previs,
with the same record, its model marked as run in this batch job; it keeps a picture already fetched
from that job unless --force, and lists the requests that failed.
"""
import sys

import pipeline
from pipeline import gemini

BATCH = gemini.Batch(pipeline.HERE / "batches", "daag-panels")


def submit(args):
    if args == ["all"]:
        args = [p for p in pipeline.HERE.iterdir() if p.is_dir() and p.name not in ("examples", "batches")]
    requests = []
    for previs in pipeline.previs_inputs(args):
        prompt, images, aspect, dest, scene = pipeline.request(previs)
        requests.append({"key": str(previs.relative_to(pipeline.HERE)), "prompt": prompt, "images": images,
                         "aspect": aspect, "meta": {"dest": str(dest.relative_to(pipeline.HERE)), "scene": scene}})
    stamp = BATCH.submit(requests)
    print(f"python3 world/panels/batch.py status {stamp}")


def save(key, meta, data, where):
    scene = meta["scene"]
    pipeline.save(data, pipeline.HERE / meta["dest"], dict(scene, model=dict(scene["model"], where=where)))


def status(args):
    BATCH.status(args[0] if args else None)


def fetch(args):
    force = "--force" in args
    args = [a for a in args if not a.startswith("--")]
    BATCH.fetch(save, args[0] if args else None, force)


def cancel(args):
    BATCH.cancel(args[0])


if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] not in ("submit", "status", "fetch", "cancel"):
        sys.exit(__doc__)
    globals()[sys.argv[1]](sys.argv[2:])
