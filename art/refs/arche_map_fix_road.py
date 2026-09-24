"""Redraw the ring road on a Gemini-made top-down map of Arche so that it hugs the coast.

    python3 art/refs/arche_map_fix_road.py in.png out.png

Gemini draws the road as an inland loop and will not move it in an edit. This erases the old
double line, finds the coastline from the sea colour, and draws a new double line a short, even
distance inside the smoothed coast. At the ports, where the buildings come down to the water,
it keeps the old line behind the waterfront, so it never cuts through a village. It removes
stray blocks outside the ports, adds the rock-cut granary and the sundial platform, and checks
that the road crosses no building and that every quay meets it.
"""
import math, sys
import numpy as np
from PIL import Image, ImageDraw

src, dst = sys.argv[1], sys.argv[2]
im = np.asarray(Image.open(src).convert('RGB')).astype(int)
Hh, Ww, _ = im.shape
r, g, b = im[..., 0], im[..., 1], im[..., 2]
SEA_RGB = np.array([194, 220, 235])
sea = (np.abs(im - SEA_RGB).sum(-1) < 40)
road = (r - g > 18) & (b >= g - 6)                         # dark red edges and their pink fill
building = (r > 140) & (r - g > 60) & (b < g - 10)         # terracotta blocks
quay = (np.abs(r - g) < 8) & (np.abs(g - b) < 10) & (r > 140) & (r < 190) & ~sea
land = ~sea

def dilate(m, n=1):
    for _ in range(n):
        m = m | np.roll(m, 1, 0) | np.roll(m, -1, 0) | np.roll(m, 1, 1) | np.roll(m, -1, 1)
    return m

# ---- polar frame about the island's centre
ys, xs = np.nonzero(land); CX, CY = xs.mean(), ys.mean()
AZS = np.arange(0, 360, 0.5)
def ray(az, rmax=700):
    a = math.radians(az); rr = np.arange(0, rmax)
    x = (CX + rr * math.sin(a)).astype(int); y = (CY - rr * math.cos(a)).astype(int)
    ok = (x >= 0) & (x < Ww) & (y >= 0) & (y < Hh)
    return rr[ok], x[ok], y[ok]

def circ_smooth(v, sigma_deg):
    n = len(v); k = np.arange(-n // 2, n // 2) * 0.5
    w = np.exp(-0.5 * (k / sigma_deg) ** 2); w /= w.sum()
    return np.real(np.fft.ifft(np.fft.fft(v) * np.fft.fft(np.fft.ifftshift(w))))

from collections import deque
def components(mask, min_area):
    seen = np.zeros_like(mask); comps = []
    for sy, sx in zip(*np.nonzero(mask)):
        if seen[sy, sx]: continue
        comp = []; dq = deque([(sy, sx)]); seen[sy, sx] = True
        while dq:
            y, x = dq.popleft(); comp.append((y, x))
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < Hh and 0 <= nx < Ww and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True; dq.append((ny, nx))
        if len(comp) >= min_area: comps.append(np.array(comp))
    return comps

def az_of(x, y): return math.degrees(math.atan2(x - CX, CY - y)) % 360
def rad_of(x, y): return math.hypot(x - CX, y - CY)

coast, old = [], []
for az in AZS:
    rr, x, y = ray(az)
    s_ = np.nonzero(sea[y, x] & (rr > 60))[0]; coast.append(rr[s_[0]] if len(s_) else rr[-1])
    rd = rr[road[y, x]]; old.append(np.median(rd) if len(rd) else np.nan)
coast = np.array(coast, float); old = np.array(old, float)
old = np.interp(AZS, AZS[~np.isnan(old)], old[~np.isnan(old)], period=360)
coast_s = circ_smooth(coast, 6.0)

# the three ports: the big grey quays away from the summit, and the buildings clustered round them
quays = [c for c in components(quay, 1500) if rad_of(c[:, 1].mean(), c[:, 0].mean()) > 200]
bcomps = components(building, 30)
port = np.zeros(len(AZS), bool); port_members = set()
for qc in quays:
    qx, qy = qc[:, 1].mean(), qc[:, 0].mean()
    azs = [az_of(x, y) for y, x in qc[::20]]
    for k, bc in enumerate(bcomps):
        bx, by = bc[:, 1].mean(), bc[:, 0].mean()
        if math.hypot(bx - qx, by - qy) < 190 and rad_of(bx, by) > 0.55 * np.interp(az_of(bx, by), AZS, coast, period=360):
            azs += [az_of(x, y) for y, x in bc[::5]]; port_members.add(k)
    c = azs[0]; rel = [((a - c + 180) % 360) - 180 for a in azs]
    lo, hi = c + min(rel) - 3, c + max(rel) + 3
    for i2, a in enumerate(AZS):
        if ((a - lo) % 360) <= ((hi - lo) % 360): port[i2] = True
print('ports found:', len(quays), '; port arc covers', round(port.mean() * 360), 'deg')

D = 24.0
target = np.where(port, old, np.minimum(coast_s - D, coast - 14))
new = circ_smooth(target, 2.5)

# stray blocks: coastal buildings outside the ports
stray = np.zeros((Hh, Ww), bool)
for k, bc in enumerate(bcomps):
    bx, by = bc[:, 1].mean(), bc[:, 0].mean()
    if k in port_members: continue
    a = az_of(bx, by); idx = int(a / 0.5) % len(AZS)
    if not port[idx] and rad_of(bx, by) > 0.6 * coast[idx]:
        stray[bc[:, 0], bc[:, 1]] = True
kept_buildings = building & ~dilate(stray, 1)

# erase the old road and the strays; buildings and quays are protected and restored afterwards
erase = (dilate(road, 2) & ~dilate(kept_buildings | quay, 1)) | dilate(stray, 2)
out = im.astype(float).copy()
known = ~erase
for _ in range(60):
    acc = np.zeros_like(out); cnt = np.zeros(known.shape)
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        k = np.roll(known, (dy, dx), (0, 1)); v = np.roll(out, (dy, dx), (0, 1))
        acc += v * k[..., None]; cnt += k
    fill = ~known & (cnt > 0)
    out[fill] = acc[fill] / cnt[fill][:, None]; known = known | fill
keep = dilate(kept_buildings, 1) | quay
out[keep] = im[keep]
out[dilate(stray, 3) & ~keep] = (254, 254, 252)               # stray blocks sat on bare coastal land

# push the new road inland wherever it would touch a kept building, then re-smooth
bld_r = {}
for bc in bcomps:
    for y, x in bc[::3]:
        idx = int(az_of(x, y) / 0.5) % len(AZS); bld_r.setdefault(idx, []).append(rad_of(x, y))
for _ in range(12):
    moved = False
    for idx, rs in bld_r.items():
        if port[idx]: continue
        for rv in rs:
            if abs(new[idx] - rv) < 8 and not stray[int(CY - rv * math.cos(math.radians(AZS[idx]))), int(CX + rv * math.sin(math.radians(AZS[idx])))]:
                target[idx] = rv - 12; moved = True
    if not moved: break
    new = circ_smooth(target, 2.5)
img = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))

# ---- draw the new double line in the map's own road style
d = ImageDraw.Draw(img)
def line_at(off):
    return [(CX + (rv + off) * math.sin(math.radians(a)), CY - (rv + off) * math.cos(math.radians(a)))
            for a, rv in zip(np.r_[AZS, AZS[:1]], np.r_[new, new[:1]])]
d.line(line_at(0), fill=(255, 231, 230), width=7)
for off in (-4.0, 4.0):
    d.line(line_at(off), fill=(40, 11, 13), width=3)

# ---- the rock-cut granary (just east of the northern port, inland of the road) and the sundial
def block_at(az, r_off, size):
    a = math.radians(az); rv = float(np.interp(az, AZS, new, period=360)) + r_off
    x, y = CX + rv * math.sin(a), CY - rv * math.cos(a)
    d.rectangle([x - size, y - size * 0.7, x + size, y + size * 0.7], fill=(185, 90, 70))
    print(f'block at az {az:.0f}: ({x:.0f}, {y:.0f}), on land: {bool(land[int(y), int(x)])}')
    return x, y
north_port = AZS[port & ((AZS < 60) | (AZS > 300))]
east_edge = max((a if a < 180 else a - 360) for a in north_port) if len(north_port) else 30
block_at(east_edge + 6, -10, 7)                           # granary, against the hillside
# the sundial platform: on the southern cape, the outermost point of the coast on the long
# arc between the western and the south-eastern port, seaward of the road
qaz = sorted(az_of(c[:, 1].mean(), c[:, 0].mean()) for c in quays)
west = max(qaz, key=lambda a: -abs(((a - 250 + 180) % 360) - 180))
southeast = max(qaz, key=lambda a: -abs(((a - 135 + 180) % 360) - 180))
arc = [(i, a) for i, a in enumerate(AZS) if southeast + 8 < a < west - 8 and not port[i]]
cape_i, cape_az = max(arc, key=lambda t: coast_s[t[0]])
block_at(cape_az, 11, 6)
img.save(dst)

# ---- checks
new_road = np.zeros((Hh, Ww), bool)
nr = np.asarray(img).astype(int)
new_road = (nr[..., 0] - nr[..., 1] > 18) & (nr[..., 2] >= nr[..., 1] - 6)
az_px = np.degrees(np.arctan2(np.arange(Ww)[None, :] - CX, CY - np.arange(Hh)[:, None])) % 360
hit = (new_road & dilate(kept_buildings, 1) & ~port[(az_px / 0.5).astype(int) % len(AZS)]).sum()
print(f'road pixels touching a building outside the ports: {hit}' + (' (PASS)' if hit < 20 else ' (FAIL)'))
on_land = land[np.clip(new_road.nonzero()[0], 0, Hh - 1), np.clip(new_road.nonzero()[1], 0, Ww - 1)].mean()
print(f'road on land: {on_land:.1%}' + (' (PASS)' if on_land > 0.99 else ' (FAIL)'))
q_left = quay
seen = np.zeros_like(q_left); comps = []
for sy, sx in zip(*np.nonzero(q_left)):
    if seen[sy, sx]: continue
    comp = []; dq = deque([(sy, sx)]); seen[sy, sx] = True
    while dq:
        y, x = dq.popleft(); comp.append((y, x))
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < Hh and 0 <= nx < Ww and q_left[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True; dq.append((ny, nx))
    if len(comp) > 150 and rad_of(np.array(comp)[:, 1].mean(), np.array(comp)[:, 0].mean()) > 200: comps.append(np.array(comp))
road_pts = np.argwhere(new_road)
for c in comps:
    cy, cx = c.mean(0)
    dmin = np.min(np.hypot(*(road_pts[:, None, :] - c[::max(1, len(c) // 200)][None, :, :]).transpose(2, 0, 1)))
    print(f'quay at ({cx:.0f}, {cy:.0f}): nearest road {dmin:.0f} px' + (' (PASS)' if dmin <= 12 else ' (FAIL)'))
