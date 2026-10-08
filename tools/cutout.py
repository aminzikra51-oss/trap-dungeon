#!/usr/bin/env python3
"""Background removal for AI hero images that sit on a plain (softly shaded) backdrop.
floating-range flood fill from the border  ->  largest blob  ->  feathered alpha  ->  cropped RGBA png/webp
usage: python3 tools/cutout.py raw/heroes/falafel.jpg out.png [--h 192]"""
import sys, cv2, numpy as np
from scipy import ndimage as ndi

def cutout(path, tol=6, h=None, work=640):
    full = cv2.imread(path); H0, W0 = full.shape[:2]
    k = work / max(H0, W0); small = cv2.resize(full, (round(W0 * k), round(H0 * k)), interpolation=cv2.INTER_AREA)
    H, W = small.shape[:2]
    # sure background: fixed-range flood from the border (tight tolerance so shadows/gradients stay "probably")
    fm = np.zeros((H + 2, W + 2), np.uint8)
    for sx in range(2, W - 2, 24):
        for sy in (2, H - 3):
            if not fm[sy + 1, sx + 1]: cv2.floodFill(small.copy(), fm, (sx, sy), 0, (tol,) * 3, (tol,) * 3, 4 | cv2.FLOODFILL_FIXED_RANGE | cv2.FLOODFILL_MASK_ONLY | (255 << 8))
    for sy in range(2, H - 2, 24):
        for sx in (2, W - 3):
            if not fm[sy + 1, sx + 1]: cv2.floodFill(small.copy(), fm, (sx, sy), 0, (tol,) * 3, (tol,) * 3, 4 | cv2.FLOODFILL_FIXED_RANGE | cv2.FLOODFILL_MASK_ONLY | (255 << 8))
    sure_bg = fm[1:-1, 1:-1] > 0
    mask = np.full((H, W), cv2.GC_PR_FGD, np.uint8)
    mask[sure_bg] = cv2.GC_PR_BGD
    mask[:6, :] = cv2.GC_BGD; mask[-6:, :] = cv2.GC_BGD; mask[:, :6] = cv2.GC_BGD; mask[:, -6:] = cv2.GC_BGD
    # the centre of the frame is the character
    cy, cx = H // 2, W // 2; mask[cy - H // 6:cy + H // 6, cx - W // 10:cx + W // 10] = cv2.GC_FGD
    bg = np.zeros((1, 65)); fg = np.zeros((1, 65))
    cv2.grabCut(small, mask, None, bg, fg, 6, cv2.GC_INIT_WITH_MASK)
    m = ((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD)).astype(np.uint8)
    lab, n = ndi.label(m)
    if n > 1:
        sizes = ndi.sum(m, lab, range(1, n + 1)); m = (lab == (1 + int(np.argmax(sizes)))).astype(np.uint8)
    m = ndi.binary_fill_holes(m); m = ndi.binary_opening(m, iterations=1)
    a = cv2.resize(m.astype(np.float32), (W0, H0), interpolation=cv2.INTER_LINEAR)
    a = (a > .5)
    a = ndi.binary_erosion(a, iterations=2).astype(np.float32)
    a = cv2.GaussianBlur(a, (0, 0), 1.6)
    inner = ndi.binary_erosion(a > .5, iterations=4)
    idx = ndi.distance_transform_edt(~inner, return_distances=False, return_indices=True)
    col = full[idx[0], idx[1]]
    edge = (a > 0.02) & (a < 0.98)
    out = full.copy(); out[edge] = (0.2 * full[edge] + 0.8 * col[edge]).astype(np.uint8)
    rgba = np.dstack([out, (a * 255).astype(np.uint8)])
    ys, xs = np.where(a > .02); y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgba = rgba[y0:y1, x0:x1]
    if h: s2 = h / rgba.shape[0]; rgba = cv2.resize(rgba, (max(1, round(rgba.shape[1] * s2)), h), interpolation=cv2.INTER_AREA)
    return rgba

if __name__ == '__main__':
    h = int(sys.argv[sys.argv.index('--h') + 1]) if '--h' in sys.argv else None
    r = cutout(sys.argv[1], h=h); cv2.imwrite(sys.argv[2], r); print(sys.argv[2], r.shape)
