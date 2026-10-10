"""Render every scene in parallel with manim, join them, and write the .srt.

    .venv/bin/python build.py [preview]      # preview = 960x540 at 15 fps
"""
import json, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

HERE = Path(__file__).resolve().parent
FILMS = {
    "limits": ("limits-of-agreement", [("a", "S01Title"), ("a", "S02Synopsis"), ("a", "S03Hill"), ("a", "S04Demands"),
               ("b", "S05DeadOrSlow"), ("b", "S06Words"), ("b", "S07Folds"), ("b", "S08Dusk"),
               ("c", "S09Polar"), ("c", "S10Deferral"), ("c", "S11Forever"), ("c", "S12Change"), ("c", "S13Table")]),
    "parliament": ("part-time-parliament", [("p1", "P01Title"), ("p1", "P02Synopsis"), ("p1", "P03Island"), ("p1", "P04Requirements"),
                   ("p1", "P05Assumptions"), ("p2", "P06Majorities"), ("p2", "P07Manuscript"), ("p2", "P08Question"),
                   ("p2", "P09Ballot"), ("p3", "P10Progress"), ("p3", "P11Parliament"), ("p3", "P12Developments"), ("p3", "P13Relevance")]),
}
film = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] in FILMS else "limits"
out, SCENES = FILMS[film]
preview = "preview" in sys.argv
res, fps, q = ("960,540", "15", "540p15") if preview else ("1920,1080", "30", "1080p30")
out = out + ("-preview" if preview else "")


def render(item):
    f, s = item
    subprocess.run([str(HERE / ".venv/bin/manim"), "render", "-r", res, "--fps", fps, "--media_dir", "media", f"{f}.py", s],
                   cwd=HERE, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, check=True)
    print("rendered", s, flush=True)


with ThreadPoolExecutor(9) as ex:
    list(ex.map(render, SCENES))

files = [HERE / f"media/videos/{f}/{q}/{s}.mp4" for f, s in SCENES]
(HERE / "concat.txt").write_text("".join(f"file '{p}'\n" for p in files))
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(HERE / "concat.txt"), "-c", "copy", str(HERE / f"{out}.mp4")], check=True)


def dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)]))


def ts(t):
    ms = round(t * 1000)
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


rows, off, n = [], 0.0, 1
for (f, s), p in zip(SCENES, files):
    for a, b, text in json.load(open(HERE / "caps" / f"{s}.json")):
        rows.append(f"{n}\n{ts(off + a)} --> {ts(off + b)}\n{text}\n")
        n += 1
    off += dur(p)
(HERE / f"{out}.srt").write_text("\n".join(rows))
print("done", out, round(off, 1), "s")
