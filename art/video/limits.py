"""The Limits of Agreement: explainer video, captions only.

    python3 art/video/limits.py still N T [scale]   # one frame of scene N at local time T -> stills/
    python3 art/video/limits.py video [scale]       # whole film -> limits-of-agreement.mp4 (+ .srt)

Scenes live in scenes.py; engine.py is the drawing layer. Captions are burned into the frames.
"""
import multiprocessing as mp
import subprocess
import sys
from pathlib import Path

from engine import Cv, W, H, WHITE, GREY, ph
import scenes

FPS = 30
HERE = Path(__file__).resolve().parent
SCENES = scenes.SCENES
GAP, FADE = 0.35, 0.4


def hold(s):
    return max(2.5, len(s.split()) / 3.0 + 0.5)


def layout():
    """Per scene: caption start times, caption end times, duration."""
    out, t0 = [], 0.0
    for sc in SCENES:
        t, starts, ends = sc["lead"], [], []
        for c in sc["caps"]:
            starts.append(t)
            t += hold(c)
            ends.append(t)
            t += GAP
        dur = ends[-1] + sc["pad"]
        out.append(dict(starts=starts, ends=ends, dur=dur, t0=t0))
        t0 += dur
    return out, t0


LAY, TOTAL = layout()


def caption(cv, t, sc, lay):
    for c, s, e in zip(sc["caps"], lay["starts"], lay["ends"]):
        a = min(ph(t, s, 0.3), 1 - ph(t, e - 0.3, 0.3))
        if a > 0:
            lines = cv.wrap(c, 40, 1560)
            y0 = 975 - (len(lines) - 1) * 26
            for i, ln in enumerate(lines):
                cv.text(W / 2, y0 + i * 52, ln, 40, WHITE, a)


def render(i, scale):
    idx, lay = 0, LAY[0]
    t = i / FPS
    for idx, lay in enumerate(LAY):
        if t < lay["t0"] + lay["dur"]:
            break
    lt = t - lay["t0"]
    g = min(ph(lt, 0, FADE), 1 - ph(lt, lay["dur"] - FADE, FADE))
    cv = Cv(scale, g)
    SCENES[idx]["fn"](cv, lt, lay["starts"], lay["dur"])
    cv.g = 1.0
    caption(cv, lt, SCENES[idx], lay)
    return cv.out()


def render_bytes(args):
    i, scale = args
    return render(i, scale).tobytes()


def srt_time(t):
    ms = round(t * 1000)
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


def write_srt(path):
    n, rows = 1, []
    for sc, lay in zip(SCENES, LAY):
        for c, s, e in zip(sc["caps"], lay["starts"], lay["ends"]):
            rows.append(f"{n}\n{srt_time(lay['t0'] + s)} --> {srt_time(lay['t0'] + e)}\n{c}\n")
            n += 1
    Path(path).write_text("\n".join(rows))


def main():
    cmd = sys.argv[1]
    if cmd == "still":
        idx, t = int(sys.argv[2]), float(sys.argv[3])
        scale = float(sys.argv[4]) if len(sys.argv) > 4 else 0.5
        lay = LAY[idx]
        out = HERE / "stills"
        out.mkdir(exist_ok=True)
        render(round((lay["t0"] + t) * FPS), scale).save(out / f"s{idx:02d}_{t:05.1f}.png")
    elif cmd == "info":
        for i, (sc, lay) in enumerate(zip(SCENES, LAY)):
            print(i, sc["fn"].__name__, f"start {lay['t0']:.1f} dur {lay['dur']:.1f}", [round(x, 1) for x in lay["starts"]])
        print("total", round(TOTAL, 1))
    elif cmd == "video":
        scale = float(sys.argv[2]) if len(sys.argv) > 2 else 1.0
        name = sys.argv[3] if len(sys.argv) > 3 else "limits-of-agreement.mp4"
        w, h = round(W * scale), round(H * scale)
        n = int(TOTAL * FPS)
        ff = subprocess.Popen(
            ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{w}x{h}",
             "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "medium",
             str(HERE / name)], stdin=subprocess.PIPE)
        with mp.Pool(10) as pool:
            for k, b in enumerate(pool.imap(render_bytes, ((i, scale) for i in range(n)), chunksize=6)):
                ff.stdin.write(b)
                if k % 300 == 0:
                    print(f"{k}/{n}", flush=True)
        ff.stdin.close()
        ff.wait()
        write_srt(HERE / name.replace(".mp4", ".srt"))
        print("done", HERE / name)


if __name__ == "__main__":
    main()
