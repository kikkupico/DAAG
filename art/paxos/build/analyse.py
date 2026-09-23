"""Turn the Meshy samples into a ground surface, placement masks and key positions.

    python3 art/paxos/build/analyse.py art/paxos/build/sample

Reads <in>-height.npy, <in>-albedo.png, <in>-grid.json; writes <in>-layout.npz with
  ground   ground height in metres above sea level (NaN = sea), objects stripped out
  land, woods, fields, stone, roofs, town, road   boolean masks on the same grid
and <in>-layout.json with the metres-per-cell scale, the Chamber centre, the road
centreline, farmstead positions and the harbour. Row 0 is +Y; +Y is east, +X is north.
"""
import sys, json
import numpy as np
from PIL import Image

IN = sys.argv[1]
LENGTH_M = 4800.0                      # canonical Paxos length (explorer.html)

g = json.load(open(IN + "-grid.json"))
h = np.load(IN + "-height.npy")
rgba = np.asarray(Image.open(IN + "-albedo.png").convert("RGBA")).astype(np.float32) / 255
H, W = h.shape
land = np.isfinite(h) & (rgba[..., 3] > 0.5)

# --- colour classes ------------------------------------------------------------------
r, gg, b = rgba[..., 0], rgba[..., 1], rgba[..., 2]
mx, mn = rgba[..., :3].max(-1), rgba[..., :3].min(-1)
val, sat = mx, np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
hue = np.zeros_like(mx)
m = (mx - mn) > 1e-6
rc = np.where(m, (mx - r) / np.maximum(mx - mn, 1e-6), 0)
gc = np.where(m, (mx - gg) / np.maximum(mx - mn, 1e-6), 0)
bc = np.where(m, (mx - b) / np.maximum(mx - mn, 1e-6), 0)
hue = np.where(r == mx, bc - gc, np.where(gg == mx, 2 + rc - bc, 4 + gc - rc))
hue = (hue / 6) % 1 * 360

woods = land & (hue > 38) & (hue < 65) & (sat > 0.75) & (val < 0.62)
fields = land & (hue > 30) & (hue < 60) & (sat > 0.4) & (sat <= 0.75) & (val > 0.5)
stone = land & (sat < 0.36) & (val > 0.68)
roofs = land & (hue > 8) & (hue < 32) & (sat > 0.5) & (val > 0.45) & (val < 0.9)

def filt(a, k, fn):
    """min/max/mean filter with a k x k window (edge-padded)."""
    p = k // 2
    ap = np.pad(a, p, mode="edge")
    v = np.lib.stride_tricks.sliding_window_view(ap, (k, k))
    return fn(v, axis=(-1, -2))

def dilate(mask, k): return filt(mask.astype(np.uint8), k, np.max).astype(bool)

# --- zones ---------------------------------------------------------------------------
def components(mask):
    lab = np.zeros(mask.shape, np.int32); n = 0
    for y0, x0 in zip(*np.nonzero(mask)):
        if lab[y0, x0]: continue
        n += 1; stack = [(y0, x0)]; lab[y0, x0] = n
        while stack:
            y, x = stack.pop()
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                yy, xx = y + dy, x + dx
                if 0 <= yy < H and 0 <= xx < W and mask[yy, xx] and not lab[yy, xx]:
                    lab[yy, xx] = n; stack.append((yy, xx))
    return lab, n

roof_zone = dilate(roofs, 41) & land
lab, n = components(roof_zone)
sizes = np.bincount(lab.ravel())[1:]
town_id = int(np.argmax(sizes)) + 1
town = dilate(lab == town_id, 9) & land
farms = []
for i in range(1, n + 1):
    if i == town_id or sizes[i - 1] < 400: continue
    ys, xs = np.nonzero((lab == i) & roofs)
    if len(xs) < 60 or dilate(town, 81)[int(ys.mean()), int(xs.mean())]: continue
    farms.append([float(xs.mean()), float(ys.mean())])

# --- the Chamber: the highest broad dome, found on a smoothed height field ------------
hh = np.where(land, h, np.nanmin(h))
sm = filt(hh, 31, np.mean)
cy, cx = np.unravel_index(np.argmax(np.where(town, -1, sm)), sm.shape)

# --- road centreline: per column, the stone pixels in the island's middle band --------
road_pts = []
for x in range(0, W, 8):
    col = stone[:, x] & ~town[:, x]
    ys = np.nonzero(col)[0]
    ys = ys[(ys > 0.3 * H) & (ys < 0.62 * H)]
    if abs(x - cx) < 110: ys = ys[ys < cy - 60]          # skip the Chamber's terrace
    if len(ys) >= 3: road_pts.append([float(x), float(np.median(ys))])
road_pts = np.array(road_pts)
road_pts = road_pts[(road_pts[:, 0] >= 170) & (road_pts[:, 0] <= 1340)]
cols = np.nonzero(land.any(0))[0]
road_pts = np.vstack([[cols.min() + 25, road_pts[0, 1]], road_pts, [cols.max() - 40, road_pts[-1, 1]]])
k = 15
smooth_y = np.convolve(np.pad(road_pts[:, 1], k // 2, mode="edge"), np.ones(k) / k, "valid")
road_pts[:, 1] = smooth_y
road = np.zeros_like(land)
for x, y in road_pts:
    x, y = int(x), int(y)
    road[max(0, y - 4):y + 5, max(0, x - 4):x + 5] = True
road &= land

# --- ground: strip trees and buildings, then smooth -----------------------------------
m_per_unit = LENGTH_M / (np.ptp(np.nonzero(land.any(0))[0]) * g["cell"])
m_per_cell = m_per_unit * g["cell"]
edge = land & ~filt(land.astype(np.uint8), 3, np.min).astype(bool)
sea_level = float(np.nanpercentile(h[edge], 5))
BIG = 1e3
base = np.where(land, h, BIG)                           # sea is ignored by the min filters
ground = filt(base, 15, np.min)                         # into the gaps between crowns
town_ground = filt(base, 61, np.min)                    # under whole houses
ground = np.where(town, town_ground, ground)
yy, xx = np.mgrid[0:H, 0:W]
dome = (xx - cx) ** 2 + (yy - cy) ** 2 < 95 ** 2         # the Meshy rotunda and its steps
ring = ((xx - cx) ** 2 + (yy - cy) ** 2 < 130 ** 2) & ~dome & land
ground = np.where(dome, np.median(ground[ring]), ground)
def land_mean(a, k):
    w = land.astype(np.float32)
    return filt(np.where(land, a, 0) * 1.0, k, np.sum) / np.maximum(filt(w, k, np.sum), 1)
ground = land_mean(land_mean(ground, 15), 15)
ground = np.minimum(ground, np.where(land, h, BIG))
ground_m = (ground - sea_level) * m_per_unit
TOP_M = 230.0                                           # Paxos's real high point is 248 m
ground_m *= TOP_M / np.nanpercentile(np.where(land, ground_m, np.nan), 99.5)
ground_m = np.where(land, np.maximum(ground_m, 1.5), np.nan).astype(np.float32)

np.savez_compressed(IN + "-layout.npz", ground=ground_m, land=land, woods=woods,
                    fields=fields, stone=stone, roofs=roofs, town=town, road=road)
json.dump({"W": W, "H": H, "m_per_cell": m_per_cell, "sea_level_model": sea_level,
           "chamber_px": [int(cx), int(cy)], "road_px": road_pts.tolist(), "farms_px": farms},
          open(IN + "-layout.json", "w"))
print(f"m/cell {m_per_cell:.2f}  island {W*m_per_cell:.0f} x {H*m_per_cell:.0f} m  "
      f"max ground {np.nanmax(ground_m):.0f} m  chamber px {cx},{cy}  "
      f"road pts {len(road_pts)}  farms {len(farms)}  town cells {int(town.sum())}")

# --- a preview of the classification ------------------------------------------------
prev = np.zeros((H, W, 3), np.uint8)
prev[land] = (60, 60, 60)
prev[fields] = (200, 180, 90); prev[woods] = (40, 110, 40); prev[stone] = (220, 220, 210)
prev[town] = prev[town] // 2 + np.array((120, 30, 30), np.uint8)
prev[roofs] = (200, 70, 40); prev[road] = (255, 255, 0)
prev[max(0, cy - 6):cy + 7, max(0, cx - 6):cx + 7] = (0, 120, 255)
for fx, fy in farms: prev[int(fy) - 5:int(fy) + 6, int(fx) - 5:int(fx) + 6] = (255, 0, 255)
Image.fromarray(prev).save(IN + "-classes.png")
gv = np.nan_to_num(ground_m, nan=0); gv = (gv / max(gv.max(), 1) * 255).astype(np.uint8)
Image.fromarray(gv).save(IN + "-ground.png")
