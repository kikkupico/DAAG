#!/usr/bin/env python3
"""Book pictures from previs images through the Gemini Batch API: the usual route (half price, not immediate).

    python3 world/panels/batch.py submit <previs.png | folder ...|all>   build, upload and start one job
    python3 world/panels/batch.py status [job]                          state of every job, or one
    python3 world/panels/batch.py fetch [job] [--force]                 save the pictures of finished jobs
    python3 world/panels/batch.py cancel <job>

The inputs are previs images made by previs.py, as for pipeline.py: a file is one previs, a folder the
newest previs of every shot under it (world/panels/<book> is a book), and "all" every book's but the
examples. Each previs becomes one request, built by pipeline.request exactly as pipeline.py builds it:
the previs as image 1, the cast pictures after it, the KEEP prompt and the shot's own, all read from
the shot record the previs carries. The requests go as a JSONL file, images inline, uploaded through
the Files API (up to 2 GB a file), and run on Nano Banana 2 at 1K (IMAGE_MODEL and IMAGE_SIZE as in
pipeline.py). A job
usually finishes well within its 24-hour target; one not done in 48 hours expires.

Every job is recorded in world/panels/batches/<id>.json (its name, model, and which previs each request
is, with the record its picture will carry), so status and fetch work from any later session. fetch
saves each picture where pipeline.py would, scene-<version>.png beside its previs, with the same
record, its model marked as run in this batch job; it keeps a picture already fetched from that job unless --force, and lists the requests
that failed.
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

import pipeline

HERE = pipeline.HERE
JOBS = HERE / "batches"
API = "https://generativelanguage.googleapis.com"
ENDS = ("_SUCCEEDED", "_FAILED", "_CANCELLED", "_EXPIRED")  # the API says BATCH_STATE_*, the docs JOB_STATE_*


def call(method, url, body=None, headers=None, raw=False):
    req = urllib.request.Request(url, method=method, data=body,
                                 headers={"x-goog-api-key": os.environ["GEMINI_API_KEY"], **(headers or {})})
    try:
        with urllib.request.urlopen(req, timeout=600) as r:
            return (r.read(), r.headers) if raw else json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f"{method} {url.split('?')[0]}: {e.code} {e.read().decode()[:600]}")


def upload(path, display):
    """The Files API's resumable upload; returns the file's name, files/..."""
    size = path.stat().st_size
    _, h = call("POST", f"{API}/upload/v1beta/files",
                json.dumps({"file": {"display_name": display}}).encode(),
                {"X-Goog-Upload-Protocol": "resumable", "X-Goog-Upload-Command": "start",
                 "X-Goog-Upload-Header-Content-Length": str(size),
                 "X-Goog-Upload-Header-Content-Type": "application/jsonl", "Content-Type": "application/json"},
                raw=True)
    info = call("POST", h["X-Goog-Upload-URL"], path.read_bytes(),
                {"Content-Length": str(size), "X-Goog-Upload-Offset": "0",
                 "X-Goog-Upload-Command": "upload, finalize"})
    return info["file"]["name"]


def previses(args):
    if args == ["all"]:
        return pipeline.previs_inputs([p for p in HERE.iterdir() if p.is_dir() and p.name not in ("examples", "batches")])
    return pipeline.previs_inputs(args)


def submit(args):
    inputs = previses(args)
    stamp = time.strftime("%Y%m%d-%H%M%S")
    JOBS.mkdir(exist_ok=True)
    jsonl = JOBS / f"{stamp}.jsonl"
    keys = {}
    with jsonl.open("w") as f:
        for previs in inputs:
            prompt, images, aspect, dest, scene = pipeline.request(previs)
            key = str(previs.relative_to(HERE))
            parts = [{"text": prompt}] + [{"inlineData": {"mimeType": i["mime_type"], "data": i["data"]}}
                                          for i in images]
            f.write(json.dumps({"key": key, "request": {
                "contents": [{"role": "user", "parts": parts}],
                "generationConfig": {"responseModalities": ["IMAGE"],
                                     "imageConfig": {"aspectRatio": aspect, "imageSize": pipeline.SIZE}}}}) + "\n")
            keys[key] = {"dest": str(dest.relative_to(HERE)), "scene": scene}
    print(f"{len(keys)} requests, {jsonl.stat().st_size / 1e6:.1f} MB", flush=True)
    file_name = upload(jsonl, f"daag-panels-{stamp}")
    job = call("POST", f"{API}/v1beta/models/{pipeline.MODEL}:batchGenerateContent",
               json.dumps({"batch": {"display_name": f"daag-panels-{stamp}",
                                     "input_config": {"file_name": file_name}}}).encode(),
               {"Content-Type": "application/json"})
    record = {"name": job["name"], "model": pipeline.MODEL, "created": stamp, "input": file_name, "keys": keys}
    (JOBS / f"{stamp}.json").write_text(json.dumps(record, indent=1, ensure_ascii=False) + "\n")
    jsonl.unlink()  # the uploaded copy is the one that counts; it is rebuilt from the previs images if needed
    print(f"started {job['name']} ({stamp}); python3 world/panels/batch.py status {stamp}")


def records(which):
    paths = [JOBS / f"{which}.json"] if which else sorted(JOBS.glob("*.json"))
    return [(p, json.loads(p.read_text())) for p in paths if p.exists()]


def state(rec):
    job = call("GET", f"{API}/v1beta/{rec['name']}")
    meta = job.get("metadata", job)
    return job, meta.get("state", "?"), meta.get("batchStats", {})


def status(args):
    for path, rec in records(args[0] if args else None):
        _, st, stats = state(rec)
        counts = ", ".join(f"{k} {v}" for k, v in stats.items())
        print(f"{path.stem}  {rec['name']}  {st}  {len(rec['keys'])} requests  {counts}")


def fetch(args):
    force = "--force" in args
    args = [a for a in args if a != "--force"]
    for path, rec in records(args[0] if args else None):
        job, st, _ = state(rec)
        if not st.endswith("_SUCCEEDED"):
            print(f"{path.stem}: {st}" + (f" {job.get('error')}" if st.endswith(ENDS) else ", not finished"))
            continue
        out = (job.get("response") or job.get("dest") or {})
        result = out.get("responsesFile") or out.get("fileName")
        lines = []
        if result:
            data, _ = call("GET", f"{API}/download/v1beta/{result}:download?alt=media", raw=True)
            lines = [json.loads(l) for l in data.decode().splitlines() if l.strip()]
        else:  # inline results carry no key, only their order
            keys = list(rec["keys"])
            lines = [{"key": keys[i], **r} for i, r in enumerate(out.get("inlinedResponses", {}).get("inlinedResponses", []))]
        saved, failed = 0, []
        for line in lines:
            key = line.get("key")
            if key not in rec["keys"]:
                failed.append(f"{key}: not a request of this job")
                continue
            dest = HERE / rec["keys"][key]["dest"]
            if dest.exists() and not force and rec.get("fetched", {}).get(key):
                continue
            image = next((p["inlineData"]["data"] for c in line.get("response", {}).get("candidates", [])
                          for p in c.get("content", {}).get("parts", []) if "inlineData" in p), None)
            if not image:
                failed.append(f"{key}: {json.dumps(line.get('status') or line.get('error') or line.get('response', {}))[:200]}")
                continue
            scene = rec["keys"][key]["scene"]
            pipeline.save(image, dest, dict(scene, model=dict(scene["model"], where=f"gemini-batch {rec['name']}")))
            rec.setdefault("fetched", {})[key] = True
            saved += 1
        path.write_text(json.dumps(rec, indent=1) + "\n")
        print(f"{path.stem}: saved {saved} pictures, {len(failed)} failed")
        for f in failed:
            print("   ", f)


def cancel(args):
    for path, rec in records(args[0]):
        call("POST", f"{API}/v1beta/{rec['name']}:cancel", b"", {"Content-Type": "application/json"})
        print(f"cancelled {rec['name']}")


if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] not in ("submit", "status", "fetch", "cancel"):
        sys.exit(__doc__)
    globals()[sys.argv[1]](sys.argv[2:])
