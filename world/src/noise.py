"""Numpy-only gradient noise for terrain (no scipy)."""
import numpy as np

F32 = np.float32


class Perlin:
    """2D gradient noise on a hashed lattice, evaluated at arbitrary coordinates."""

    def __init__(self, seed, size=512):
        rng = np.random.default_rng(seed)
        a = rng.random((size, size), dtype=np.float64) * 2 * np.pi
        self.gx = np.cos(a).astype(F32)
        self.gy = np.sin(a).astype(F32)
        self.m = size - 1

    def __call__(self, x, y):
        x = np.asarray(x, F32); y = np.asarray(y, F32)
        x0 = np.floor(x); y0 = np.floor(y)
        fx = x - x0; fy = y - y0
        i0 = (x0.astype(np.int64) & self.m); j0 = (y0.astype(np.int64) & self.m)
        i1 = (i0 + 1) & self.m; j1 = (j0 + 1) & self.m
        gx, gy = self.gx, self.gy

        def dot(j, i, dx, dy):
            return gx[j, i] * dx + gy[j, i] * dy

        n00 = dot(j0, i0, fx, fy)
        n10 = dot(j0, i1, fx - 1, fy)
        n01 = dot(j1, i0, fx, fy - 1)
        n11 = dot(j1, i1, fx - 1, fy - 1)
        u = fx * fx * fx * (fx * (fx * 6 - 15) + 10)
        v = fy * fy * fy * (fy * (fy * 6 - 15) + 10)
        nx0 = n00 + u * (n10 - n00)
        nx1 = n01 + u * (n11 - n01)
        return (nx0 + v * (nx1 - nx0)) * F32(1.41)


def fbm(p, x, y, scale, octaves=6, lac=2.03, gain=0.5, ridged=False, rot=0.61):
    """Fractal sum; x, y in metres, scale = wavelength of the first octave in metres."""
    out = np.zeros(np.shape(x), F32)
    amp = F32(1.0); norm = 0.0
    c, s = np.cos(rot), np.sin(rot)
    xs = np.asarray(x, F32) / F32(scale); ys = np.asarray(y, F32) / F32(scale)
    for o in range(octaves):
        n = p(xs + 17.3 * o, ys - 9.1 * o)
        if ridged:
            n = F32(1) - np.abs(n)
            n = n * n
        out += amp * n
        norm += amp
        amp *= F32(gain)
        xs, ys = (xs * c - ys * s) * F32(lac), (xs * s + ys * c) * F32(lac)
    return out / F32(norm)


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def smin(a, b, k):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0, 1)
    return b + (a - b) * h - k * h * (1 - h)


def smax(a, b, k):
    return -smin(-a, -b, k)


def bilinear(H, px, x0, y0, X, Y):
    """Sample grid H (row 0 = north) at world X, Y. x0, y0 = world coords of pixel centre [0,0]."""
    N = H.shape[0]
    u = (np.asarray(X) - x0) / px
    v = (y0 - np.asarray(Y)) / px
    u = np.clip(u, 0, N - 1.001); v = np.clip(v, 0, N - 1.001)
    i = np.floor(v).astype(np.int64); j = np.floor(u).astype(np.int64)
    fu = u - j; fv = v - i
    return (H[i, j] * (1 - fu) * (1 - fv) + H[i, j + 1] * fu * (1 - fv)
            + H[i + 1, j] * (1 - fu) * fv + H[i + 1, j + 1] * fu * fv)


def blur(a, r, passes=3):
    """Box blur (repeated = ~gaussian) via cumulative sums, separable."""
    a = a.astype(F32)
    for _ in range(passes):
        for ax in (0, 1):
            c = np.cumsum(np.pad(a, [(r + 1, r) if k == ax else (0, 0) for k in (0, 1)], mode='edge'), axis=ax, dtype=np.float64)
            hi = np.take(c, np.arange(2 * r + 1, c.shape[ax]), axis=ax)
            lo = np.take(c, np.arange(0, c.shape[ax] - 2 * r - 1), axis=ax)
            a = ((hi - lo) / (2 * r + 1)).astype(F32)
    return a
