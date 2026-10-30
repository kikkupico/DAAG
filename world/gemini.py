"""Gemini image generation, at once or through the Batch API, shared by world/cast and world/panels.

The model and size come from IMAGE_MODEL (nb2, lite, pro; Nano Banana 2 by default) and IMAGE_SIZE
(1K by default). An image to send is a part made by part(); a request is a prompt, its parts and an
aspect. generate() makes one picture at once; Batch submits many through the Batch API at half the
price and fetches them later, keeping each job's record in a folder so a later session can fetch it.
GEMINI_API_KEY is read from the environment.
"""
import base64
import io
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

from PIL import Image

API = "https://generativelanguage.googleapis.com"
MODELS = {"lite": "gemini-3.1-flash-lite-image", "nb2": "gemini-3.1-flash-image", "pro": "gemini-3-pro-image"}
MODEL = MODELS[os.environ.get("IMAGE_MODEL", "nb2")]
SIZE = os.environ.get("IMAGE_SIZE", "1K")  # 2K draws small faces better, at a higher price; Lite stops at 1K
ENDS = ("_SUCCEEDED", "_FAILED", "_CANCELLED", "_EXPIRED")  # the API says BATCH_STATE_*, the docs JOB_STATE_*


def part(path, longest):
    """An image to send: JPEG, no longer than longest."""
    im = Image.open(path).convert("RGB")
    im.thumbnail((longest, longest))
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=92)
    return {"type": "image", "mime_type": "image/jpeg", "data": base64.b64encode(buf.getvalue()).decode()}


def call(method, url, body=None, headers=None, raw=False):
    req = urllib.request.Request(url, method=method, data=body,
                                 headers={"x-goog-api-key": os.environ["GEMINI_API_KEY"], **(headers or {})})
    try:
        with urllib.request.urlopen(req, timeout=600) as r:
            return (r.read(), r.headers) if raw else json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f"{method} {url.split('?')[0]}: {e.code} {e.read().decode()[:600]}")


def generate(prompt, images, aspect, size=None, model=None):
    """One picture at once, through the Interactions API; returns its bytes, base64."""
    body = {"model": model or MODEL, "input": [{"type": "text", "text": prompt}] + images,
            "response_format": {"type": "image", "aspect_ratio": aspect, "image_size": size or SIZE}}
    res = call("POST", f"{API}/v1beta/interactions", json.dumps(body).encode(),
               {"Api-Revision": "2026-05-20", "Content-Type": "application/json"})
    for step in res.get("steps", []):
        for c in step.get("content", []):
            if c.get("type") == "image":
                return c["data"]
    sys.exit(f"{model or MODEL} returned no image: {json.dumps(res)[:600]}")


class Batch:
    """Batch jobs of one kind, recorded in jobs/<stamp>.json: the job's name, model, and for each request
    its key and whatever the caller needs to save its picture (meta)."""

    def __init__(self, jobs, label):
        self.jobs, self.label = Path(jobs), label

    def submit(self, requests, size=None, model=None):
        """requests: [{"key", "prompt", "images", "aspect", "meta"}]. Uploads them as a JSONL file through
        the Files API (images inline, up to 2 GB) and starts the job."""
        model, size = model or MODEL, size or SIZE
        stamp = time.strftime("%Y%m%d-%H%M%S")
        self.jobs.mkdir(parents=True, exist_ok=True)
        jsonl = self.jobs / f"{stamp}.jsonl"
        with jsonl.open("w") as f:
            for r in requests:
                parts = [{"text": r["prompt"]}] + [{"inlineData": {"mimeType": i["mime_type"], "data": i["data"]}}
                                                   for i in r["images"]]
                f.write(json.dumps({"key": r["key"], "request": {
                    "contents": [{"role": "user", "parts": parts}],
                    "generationConfig": {"responseModalities": ["IMAGE"],
                                         "imageConfig": {"aspectRatio": r["aspect"], "imageSize": size}}}}) + "\n")
        print(f"{len(requests)} requests, {jsonl.stat().st_size / 1e6:.1f} MB", flush=True)
        file_name = self._upload(jsonl, f"{self.label}-{stamp}")
        job = call("POST", f"{API}/v1beta/models/{model}:batchGenerateContent",
                   json.dumps({"batch": {"display_name": f"{self.label}-{stamp}",
                                         "input_config": {"file_name": file_name}}}).encode(),
                   {"Content-Type": "application/json"})
        rec = {"name": job["name"], "model": model, "size": size, "created": stamp, "input": file_name,
               "keys": {r["key"]: r["meta"] for r in requests}}
        (self.jobs / f"{stamp}.json").write_text(json.dumps(rec, indent=1, ensure_ascii=False) + "\n")
        jsonl.unlink()  # the uploaded copy is the one that counts
        print(f"started {job['name']} ({stamp})")
        return stamp

    def _upload(self, path, display):
        size = path.stat().st_size
        _, h = call("POST", f"{API}/upload/v1beta/files", json.dumps({"file": {"display_name": display}}).encode(),
                    {"X-Goog-Upload-Protocol": "resumable", "X-Goog-Upload-Command": "start",
                     "X-Goog-Upload-Header-Content-Length": str(size),
                     "X-Goog-Upload-Header-Content-Type": "application/jsonl", "Content-Type": "application/json"},
                    raw=True)
        info = call("POST", h["X-Goog-Upload-URL"], path.read_bytes(),
                    {"Content-Length": str(size), "X-Goog-Upload-Offset": "0",
                     "X-Goog-Upload-Command": "upload, finalize"})
        return info["file"]["name"]

    def records(self, which=None):
        paths = [self.jobs / f"{which}.json"] if which else sorted(self.jobs.glob("*.json"))
        return [(p, json.loads(p.read_text())) for p in paths if p.exists()]

    def state(self, rec):
        job = call("GET", f"{API}/v1beta/{rec['name']}")
        meta = job.get("metadata", job)
        return job, meta.get("state", "?"), meta.get("batchStats", {})

    def status(self, which=None):
        out = []
        for path, rec in self.records(which):
            _, st, stats = self.state(rec)
            counts = ", ".join(f"{k} {v}" for k, v in stats.items())
            print(f"{path.stem}  {rec['name']}  {st}  {len(rec['keys'])} requests  {counts}")
            out.append(st)
        return out

    def fetch(self, save, which=None, force=False):
        """Calls save(key, meta, image_base64, where) for every picture of every finished job not yet fetched;
        where is "gemini-batch <job name>"."""
        for path, rec in self.records(which):
            job, st, _ = self.state(rec)
            if not st.endswith("_SUCCEEDED"):
                print(f"{path.stem}: {st}" + (f" {job.get('error')}" if st.endswith(ENDS) else ", not finished"))
                continue
            out = job.get("response") or job.get("dest") or {}
            result = out.get("responsesFile") or out.get("fileName")
            if result:
                data, _ = call("GET", f"{API}/download/v1beta/{result}:download?alt=media", raw=True)
                lines = [json.loads(l) for l in data.decode().splitlines() if l.strip()]
            else:  # inline results carry no key, only their order
                keys = list(rec["keys"])
                lines = [{"key": keys[i], **r}
                         for i, r in enumerate(out.get("inlinedResponses", {}).get("inlinedResponses", []))]
            saved, failed = 0, []
            for line in lines:
                key = line.get("key")
                if key not in rec["keys"]:
                    failed.append(f"{key}: not a request of this job")
                    continue
                if rec.get("fetched", {}).get(key) and not force:
                    continue
                image = next((p["inlineData"]["data"] for c in line.get("response", {}).get("candidates", [])
                              for p in c.get("content", {}).get("parts", []) if "inlineData" in p), None)
                if not image:
                    failed.append(f"{key}: {json.dumps(line.get('status') or line.get('error') or line.get('response', {}))[:200]}")
                    continue
                save(key, rec["keys"][key], image, f"gemini-batch {rec['name']}")
                rec.setdefault("fetched", {})[key] = True
                saved += 1
            path.write_text(json.dumps(rec, indent=1, ensure_ascii=False) + "\n")
            print(f"{path.stem}: saved {saved} pictures, {len(failed)} failed")
            for f in failed:
                print("   ", f)

    def cancel(self, which):
        for path, rec in self.records(which):
            call("POST", f"{API}/v1beta/{rec['name']}:cancel", b"", {"Content-Type": "application/json"})
            print(f"cancelled {rec['name']}")
