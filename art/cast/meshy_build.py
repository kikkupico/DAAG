#!/usr/bin/env python3
"""Build a cast model or a prop set from a reference image with the Meshy API.

    python3 art/cast/meshy_build.py character <name> <image> [height_m]
    python3 art/cast/meshy_build.py props <name> <image>

character: image-to-3D on Meshy T2 (smart topology, textured, A-pose), then
auto-rigging; saves art/cast/<name>.glb (rigged) and <name>-mesh.glb (unrigged).
props: image-to-3D only; saves art/cast/props/<name>.glb, one mesh holding every
object on the sheet, to be split into loose parts in Blender.
Task ids are logged in art/cast/meshy-tasks.json so a step can be resumed.
Needs MESHY_API_KEY.
"""
import base64, json, os, sys, time, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CAST = ROOT / "art/cast"
LOG = CAST / "meshy-tasks.json"
API = "https://api.meshy.ai/openapi/v1/"
HEAD = {"Authorization": f"Bearer {os.environ['MESHY_API_KEY']}", "Content-Type": "application/json"}


def call(method, path, body=None):
    req = urllib.request.Request(API + path, data=json.dumps(body).encode() if body else None,
                                 headers=HEAD, method=method)
    return json.load(urllib.request.urlopen(req))


def wait(kind, tid):
    while True:
        t = call("GET", f"{kind}/{tid}")
        if t["status"] in ("SUCCEEDED", "FAILED", "CANCELED"):
            break
        print(f"  {kind} {t['status']} {t.get('progress', 0)}%", flush=True)
        time.sleep(15)
    if t["status"] != "SUCCEEDED":
        sys.exit(f"{kind} {tid}: {t['status']} {t.get('task_error')}")
    return t


def log(name, **ids):
    data = json.load(open(LOG)) if LOG.exists() else {}
    data.setdefault(name, {}).update(ids)
    json.dump(data, open(LOG, "w"), indent=1)
    return data[name]


def mesh(name, image, rigged):
    done = json.load(open(LOG)).get(name, {}) if LOG.exists() else {}
    if "mesh_task" in done:
        return done["mesh_task"], wait("image-to-3d", done["mesh_task"])
    uri = "data:image/png;base64," + base64.b64encode(Path(image).read_bytes()).decode()
    body = {"image_url": uri, "ai_model": "meshy-t2", "model_type": "smart-topology",
            "should_texture": True, "texture_resolution": "2k", "target_formats": ["glb"]}
    if rigged:
        body["pose_mode"] = "a-pose"
    tid = call("POST", "image-to-3d", body)["result"]
    log(name, mesh_task=tid, image=str(image))
    print(f"  image-to-3d task {tid}", flush=True)
    return tid, wait("image-to-3d", tid)


def main():
    mode, name, image = sys.argv[1:4]
    if mode == "props":
        _, t = mesh(name, image, rigged=False)
        dest = CAST / "props" / f"{name}.glb"
        dest.parent.mkdir(exist_ok=True)
        urllib.request.urlretrieve(t["model_urls"]["glb"], dest)
        print(f"  {dest.relative_to(ROOT)}")
        return
    height = float(sys.argv[4]) if len(sys.argv) > 4 else 1.75
    tid, t = mesh(name, image, rigged=True)
    urllib.request.urlretrieve(t["model_urls"]["glb"], CAST / f"{name}-mesh.glb")
    done = json.load(open(LOG))[name]
    rid = done.get("rig_task") or call("POST", "rigging", {"input_task_id": tid, "height_meters": height})["result"]
    log(name, rig_task=rid)
    r = wait("rigging", rid)
    urllib.request.urlretrieve(r["result"]["rigged_character_glb_url"], CAST / f"{name}.glb")
    print(f"  art/cast/{name}.glb  (+ {name}-mesh.glb)")


if __name__ == "__main__":
    main()
