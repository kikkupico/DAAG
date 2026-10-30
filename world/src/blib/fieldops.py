import numpy as np

F32 = np.float32


def blur(a, r, passes=3):
    a = a.astype(F32)
    for _ in range(passes):
        for ax in (0, 1):
            pad = [(r + 1, r) if k == ax else (0, 0) for k in (0, 1)]
            c = np.cumsum(np.pad(a, pad, mode='edge'), axis=ax, dtype=np.float64)
            hi = np.take(c, np.arange(2 * r + 1, c.shape[ax]), axis=ax)
            lo = np.take(c, np.arange(0, c.shape[ax] - 2 * r - 1), axis=ax)
            a = ((hi - lo) / (2 * r + 1)).astype(F32)
    return a


def upsample(g, shape):
    """Smooth (smoothstep-bilinear) upsampling of a coarse grid to shape."""
    n0, n1 = g.shape
    u = np.linspace(0, n1 - 1.001, shape[1]); v = np.linspace(0, n0 - 1.001, shape[0])
    j = np.floor(u).astype(int); fu = u - j; fu = fu * fu * (3 - 2 * fu)
    i = np.floor(v).astype(int); fv = v - i; fv = fv * fv * (3 - 2 * fv)
    rows = g[:, j] * (1 - fu) + g[:, j + 1] * fu
    return (rows[i] * (1 - fv)[:, None] + rows[i + 1] * fv[:, None]).astype(F32)
