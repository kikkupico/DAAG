"""Leros, the real island Paxos is modelled on: its coastline (OpenStreetMap, via Nominatim) and its
elevation (AWS Terrain Tiles, Terrarium encoding), saved in local metres east/north of the island's
centre -> assets/leros/{coast.npy, dem.npy, meta.json}.  python3 src/fetch_leros.py"""
import io, json, math, os, urllib.request
import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..')
OUT = os.path.join(ROOT, 'assets', 'leros')
UA = {'User-Agent': 'DAAG-world/1.0 (procedural model research)'}
Z = 14


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
        return r.read()


def main():
    os.makedirs(os.path.join(OUT, 'tiles'), exist_ok=True)
    res = json.loads(get('https://nominatim.openstreetmap.org/search?q=Leros&format=json&polygon_geojson=1&limit=5'))
    isl = [r for r in res if r.get('type') == 'island'][0]
    g = isl['geojson']
    polys = [g['coordinates']] if g['type'] == 'Polygon' else g['coordinates']
    ring = np.array(max((p[0] for p in polys), key=len), float)          # lon, lat
    lon0, lat0 = ring[:, 0].mean(), ring[:, 1].mean()
    kx = 111320.0 * math.cos(math.radians(lat0)); ky = 110574.0

    def tile(lon, lat):
        n = 2 ** Z
        return (lon + 180) / 360 * n, (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n

    pad = 0.01
    x0, y0 = tile(ring[:, 0].min() - pad, ring[:, 1].max() + pad)
    x1, y1 = tile(ring[:, 0].max() + pad, ring[:, 1].min() - pad)
    tx0, ty0, tx1, ty1 = int(x0), int(y0), int(x1), int(y1)
    W, H = (tx1 - tx0 + 1) * 256, (ty1 - ty0 + 1) * 256
    E = np.zeros((H, W), np.float32)
    for tx in range(tx0, tx1 + 1):
        for ty in range(ty0, ty1 + 1):
            p = os.path.join(OUT, 'tiles', f'{Z}_{tx}_{ty}.png')
            if not os.path.exists(p):
                open(p, 'wb').write(get(f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{Z}/{tx}/{ty}.png'))
            a = np.asarray(Image.open(p).convert('RGB')).astype(np.float32)
            E[(ty - ty0) * 256:(ty - ty0 + 1) * 256, (tx - tx0) * 256:(tx - tx0 + 1) * 256] = a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768
    # each DEM pixel centre in local metres
    jj = np.arange(W) + 0.5; ii = np.arange(H) + 0.5
    n = 2 ** Z
    lons = (tx0 + jj / 256) / n * 360 - 180
    lats = np.degrees(np.arctan(np.sinh(math.pi * (1 - 2 * (ty0 + ii / 256) / n))))
    xs = (lons - lon0) * kx; ys = (lats - lat0) * ky
    coast = np.column_stack([(ring[:, 0] - lon0) * kx, (ring[:, 1] - lat0) * ky]).astype(np.float32)
    np.save(os.path.join(OUT, 'coast.npy'), coast)
    np.save(os.path.join(OUT, 'dem.npy'), E)
    json.dump(dict(lon0=lon0, lat0=lat0, xs=[float(xs[0]), float(xs[-1])], ys=[float(ys[0]), float(ys[-1])], W=W, H=H, zoom=Z,
                   sources=['OpenStreetMap contributors (ODbL), coastline of Leros via Nominatim',
                            'AWS Terrain Tiles (Terrarium), compiled from SRTM, ETOPO1 and other open data']),
              open(os.path.join(OUT, 'meta.json'), 'w'), indent=1)
    print('coast', len(coast), 'points; dem', E.shape, 'max', float(E.max()))


if __name__ == '__main__':
    main()
