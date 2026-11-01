#!/usr/bin/env python3
"""Evolution pictures: five per hero (one per upgrade stage I..V).
   raw/heroes/stages/<id>_lvl<n>.png        the cut-out pictures (RGBA, any size)            n = 1..5
   raw/heroes/stages_orig/<id>_lvl<n>.png   (optional) the same pictures on their plain backdrop; used to repair a cut-out that ate parts of the
                                            character (an orange cat on an orange backdrop) or kept leftovers of the backdrop (green pockets)
   -> assets/hero/<id>_s<n>.webp (RGBA, 224 px tall) + entries in assets/hero/meta.json  {w,h,cx,hk,[rim]}
   hk = height factor against stage II (the in-game look), clamped, so a beginner is a little smaller and a legend a little bigger.
   SKINS: a second (third) evolution look per hero lives next to the first one as  raw/heroes/stages/<id>_k<k>_lvl<n>.png  (k = 1, 2) -> assets/hero/<id>_k<k>_s<n>.webp.
   Those arrive as clean cut-outs without the plain backdrop, so a few leftovers (green / blue pockets between an arm and the body, a puddle under the feet) are removed by POCKETS below.
usage: python3 tools/make_stages.py [id | id_k1 ...]"""
import os, sys, json, glob, re
import numpy as np, cv2
from PIL import Image
from scipy import ndimage as ndi
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cutout import cutout
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = f'{ROOT}/raw/heroes/stages'; ORIG = f'{ROOT}/raw/heroes/stages_orig'
H = 224
RIM = {'robot': '#8fdcff'}     # dark sprites get a thin light rim in game so they don't vanish into the dungeon

def load(path): return np.array(Image.open(path).convert('RGBA'))

MINE = {'cat_lvl1', 'cat_lvl2', 'cat_lvl3', 'cat_lvl4'}          # the backdrop is the colour of the character (orange cat on orange): the colour-keyed cut-out has holes in the fur, use the grab-cut mask instead
BGKEY = {'grandma_lvl3': 55, 'mushroom_lvl4': 75, 'mushroom_lvl5': 85, 'falafel_lvl2': 60, 'falafel_lvl4': 60}   # kill pixels this close to the backdrop colour (glow / pockets tinted by the backdrop)

def repair(rgba, orig_path, name=''):
    """his cut-out + my cut-out of the original: (1) refill enclosed holes the other cut says are character, (2) drop leftovers of the backdrop colour."""
    a = rgba[..., 3].copy(); rgb = rgba[..., :3].copy()
    if not os.path.exists(orig_path): return rgba
    mine = cutout(orig_path, pockets=True, full_canvas=True)               # BGRA, same size
    if mine.shape[:2] != a.shape: return rgba
    ma = mine[..., 3]; orgb = np.array(Image.open(orig_path).convert('RGB'))
    if name in MINE:
        a = ma.copy(); rgb = orgb.copy()
        hol = ndi.binary_fill_holes(a > 128) & ~(a > 128); lab, n = ndi.label(hol)           # small enclosed specks inside the fur (not the gaps between arms and body)
        for i in range(1, n + 1):
            if (lab == i).sum() < 1800: a[lab == i] = 255
        return np.dstack([rgb, a])
    solid = a > 128; body = ndi.binary_fill_holes(solid); holes = body & ~solid
    fix = holes & (ma > 128)                                                 # the colour key ate fur that is character
    a[fix] = ma[fix]; rgb[fix] = orgb[fix]
    # backdrop colour (median of the border of the original)
    brd = np.concatenate([orgb[:6].reshape(-1, 3), orgb[-6:].reshape(-1, 3), orgb[:, :6].reshape(-1, 3), orgb[:, -6:].reshape(-1, 3)])
    bgc = np.median(brd, 0)
    dist = np.abs(rgb.astype(int) - bgc).max(-1)
    junk = (a > 0) & (ma < 40) & (dist < 70)                                 # kept by the first cut, rejected by mine, and coloured like the backdrop
    a[junk] = 0
    if name in BGKEY: a[(a > 0) & (dist < BGKEY[name])] = 0
    out = np.dstack([rgb, a]); return out

def _comps(rgba, cond, minsize, ymin=0, grow=3):
    """delete the connected blobs of `cond` that are at least minsize pixels big and lie below row ymin (a pocket of backdrop colour), a few pixels of fringe with them"""
    a = rgba[..., 3]; m = cond & (a > 10); m[:ymin] = False
    lab, k = ndi.label(m)
    if not k: return rgba
    sizes = ndi.sum(m, lab, range(1, k + 1)); big = np.isin(lab, [i + 1 for i, sz in enumerate(sizes) if sz >= minsize])
    big = ndi.binary_dilation(big, iterations=grow); out = rgba.copy(); out[..., 3][big] = 0; return out

def _green(rgba, maxg=999, maxr=999):
    r, g, b = [rgba[..., i].astype(int) for i in range(3)]; return (g > r + 30) & (g > b + 30) & (g < maxg) & (r < maxr)
def _pure(rgba):
    r, g, b = [rgba[..., i].astype(int) for i in range(3)]; return (r < 45) & (g > 140) & (b < 75)
def _blue(rgba):
    r, g, b = [rgba[..., i].astype(int) for i in range(3)]; return (b > r + 60) & (g > r + 40) & (b >= g - 10)

# skin pictures: {picture: [(colour test, min blob size, only below this row)]}. The glow / spores / goggles that belong to the character are lighter or smaller and stay.
POCKETS = {
    'mushroom_k1_lvl4': [(lambda x: _green(x, 190), 5000, 380)],
    'mushroom_k1_lvl5': [(_pure, 2000, 0)],
    'falafel_k2_lvl2': [(lambda x: _green(x, 200, 130), 500, 500)], 'falafel_k2_lvl3': [(lambda x: _green(x, 200, 130), 500, 500)], 'falafel_k2_lvl4': [(lambda x: _green(x, 200, 130), 500, 500)],
    'falafel_k1_lvl4': [(lambda x: _green(x, 200, 130), 500, 500)],
    'grandma_k1_lvl2': [(_blue, 600, 600)], 'grandma_k1_lvl4': [(_blue, 3000, 840)],
}
def pockets(rgba, name):
    for cond, mn, y0 in POCKETS.get(name, []): rgba = _comps(rgba, cond(rgba), mn, y0)
    return rgba

def clean(rgba):
    a = rgba[..., 3]; m = a > 24
    lab, n = ndi.label(m)
    if n > 1:
        sizes = ndi.sum(m, lab, range(1, n + 1)); big = sizes.max()
        keep = np.zeros(n + 1, bool)
        for i, s in enumerate(sizes):
            if s >= big * .012: keep[i + 1] = True                         # the body and detached parts that matter (a fish, a staff), not specks
        a2 = a.copy(); a2[~keep[lab]] = 0; rgba = rgba.copy(); rgba[..., 3] = a2
    return rgba

def bleed(rgba):
    # colour of fully transparent / faint pixels = nearest solid colour (no dark or backdrop-coloured fringe after resizing and in the game's glow outline)
    a = rgba[..., 3]; inner = a > 200
    idx = ndi.distance_transform_edt(~inner, return_distances=False, return_indices=True)
    out = rgba.copy(); soft = a <= 200
    out[..., :3][soft] = rgba[..., :3][idx[0][soft], idx[1][soft]]
    return out

def bbox(a, thr=24):
    ys, xs = np.where(a > thr); return ys.min(), ys.max() + 1, xs.min(), xs.max() + 1

def main():
    args = [x for x in sys.argv[1:] if not x.startswith('--')]
    mp = f'{ROOT}/assets/hero/meta.json'; meta = json.load(open(mp)) if os.path.exists(mp) else {}
    ids = sorted({re.match(r'([a-z]+(?:_k\d)?)_lvl\d\.png', os.path.basename(f)).group(1) for f in glob.glob(f'{RAW}/*_lvl?.png')})
    for hid in ids:
        if args and hid not in args: continue
        pics = {}
        for n in range(1, 6):
            f = f'{RAW}/{hid}_lvl{n}.png'
            if not os.path.exists(f): continue
            r = bleed(clean(pockets(repair(load(f), f'{ORIG}/{hid}_lvl{n}.png', f'{hid}_lvl{n}'), f'{hid}_lvl{n}')))
            y0, y1, x0, x1 = bbox(r[..., 3]); pics[n] = r[y0:y1, x0:x1]
        ref = pics[2].shape[0] if 2 in pics else max(p.shape[0] for p in pics.values())
        for n, r in pics.items():
            hk = float(np.clip(r.shape[0] / ref, .88, 1.12))
            s = H / r.shape[0]; r2 = cv2.resize(r, (max(1, round(r.shape[1] * s)), H), interpolation=cv2.INTER_AREA)
            a = r2[..., 3].astype(float); ys, xs = np.mgrid[:a.shape[0], :a.shape[1]]
            lo = a.copy(); lo[:a.shape[0] // 3] = 0; cx = float((lo * xs).sum() / lo.sum()) / r2.shape[1]       # centre of the lower body: where the feet are, not a wing or a tail
            key = f'{hid}_s{n}'; out = f'{ROOT}/assets/hero/{key}.webp'
            Image.fromarray(r2).save(out, 'WEBP', quality=86, method=6)
            meta[key] = {'w': r2.shape[1], 'h': r2.shape[0], 'cx': round(cx, 3), 'hk': round(hk, 3), 'kb': os.path.getsize(out) // 1024}
            if hid.split('_k')[0] in RIM: meta[key]['rim'] = RIM[hid.split('_k')[0]]
            print(key, meta[key])
    json.dump(meta, open(mp, 'w'))
main()
