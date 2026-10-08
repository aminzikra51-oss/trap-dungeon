#!/usr/bin/env python3
"""raw/heroes/<id>.jpg (AI render on plain backdrop) -> assets/hero/<id>.webp (RGBA, cropped, 224px tall) + assets/hero/meta.json"""
import os, sys, json, cv2, numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cutout import cutout
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
H = 224
def deshadow(rgba, from_frac=.70):
    h = rgba.shape[0]; y0 = int(h * from_frac)
    px = rgba[y0:, :, :3].astype(int)
    spread = np.maximum(np.maximum(abs(px[..., 0] - px[..., 1]), abs(px[..., 1] - px[..., 2])), abs(px[..., 0] - px[..., 2]))
    lum = px.mean(-1)
    kill = (spread < 16) & (lum > 110) & (lum < 256)
    a = rgba[y0:, :, 3].copy(); a[kill] = 0; rgba[y0:, :, 3] = a
    # re-crop to the remaining alpha
    ys, xs = np.where(rgba[..., 3] > 6); return rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
def main():
    os.makedirs(f'{ROOT}/assets/hero', exist_ok=True); meta = {}
    for f in sorted(os.listdir(f'{ROOT}/raw/heroes')):
        if not f.endswith('.jpg') or '_' in f: continue
        hid = f[:-4]
        r = cutout(f'{ROOT}/raw/heroes/{f}')
        r = deshadow(r)
        s = H / r.shape[0]; r = cv2.resize(r, (max(1, round(r.shape[1] * s)), H), interpolation=cv2.INTER_AREA)
        # horizontal centre of mass of the body in the lower half (so a tail / arm doesn't shift the feet)
        a = r[..., 3].astype(float); ys, xs = np.mgrid[:a.shape[0], :a.shape[1]]
        lo = a.copy(); lo[:a.shape[0] // 3] = 0; cx = float((lo * xs).sum() / lo.sum()) / r.shape[1]
        out = f'{ROOT}/assets/hero/{hid}.webp'
        from PIL import Image
        Image.fromarray(cv2.cvtColor(r, cv2.COLOR_BGRA2RGBA)).save(out, 'WEBP', quality=88, method=6)
        meta[hid] = {'w': r.shape[1], 'h': r.shape[0], 'cx': round(cx, 3), 'kb': os.path.getsize(out) // 1024}
        print(hid, meta[hid])
    json.dump(meta, open(f'{ROOT}/assets/hero/meta.json', 'w'))
main()
