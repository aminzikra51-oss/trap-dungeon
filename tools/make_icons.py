#!/usr/bin/env python3
"""Hero render -> app icons (any / maskable / apple-touch / favicon) in pwa/icons/. usage: python3 tools/make_icons.py [falafel]"""
import os, sys, cv2, numpy as np
from PIL import Image, ImageDraw, ImageFilter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cutout import cutout
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
hid = sys.argv[1] if len(sys.argv) > 1 else 'falafel'
S = 1024
def bg():
    y, x = np.mgrid[:S, :S].astype(np.float32)
    d = np.sqrt(((x - S / 2) / S) ** 2 + ((y - S * .42) / S) ** 2)
    t = np.clip(d * 1.55, 0, 1)[..., None]
    c0 = np.array([122, 77, 255], np.float32); c1 = np.array([28, 14, 56], np.float32); c2 = np.array([8, 4, 16], np.float32)
    col = np.where(t < .55, c0 + (c1 - c0) * (t / .55), c1 + (c2 - c1) * ((t - .55) / .45))
    return Image.fromarray(col.clip(0, 255).astype(np.uint8)).convert('RGBA')
def art():
    im = bg(); d = ImageDraw.Draw(im)
    # floor + spikes (the game's trademark) along the bottom
    d.rectangle([0, int(S * .86), S, S], fill=(40, 24, 70, 255))
    n = 9; w = S / n
    for i in range(n):
        x0 = i * w; d.polygon([(x0 + 4, S * .86), (x0 + w / 2, S * .70), (x0 + w - 4, S * .86)], fill=(214, 220, 232, 255), outline=(20, 12, 40, 255))
        d.polygon([(x0 + w / 2, S * .70), (x0 + w - 4, S * .86), (x0 + w / 2 + 6, S * .86)], fill=(150, 158, 178, 255))
    d.line([(0, S * .86), (S, S * .86)], fill=(255, 210, 63, 255), width=10)
    r = cutout(f'{ROOT}/raw/heroes/{hid}.jpg'); r = cv2.cvtColor(r, cv2.COLOR_BGRA2RGBA)
    h = int(S * .58); w2 = int(r.shape[1] * h / r.shape[0]); hero = Image.fromarray(cv2.resize(r, (w2, h), interpolation=cv2.INTER_AREA))
    sh = Image.new('RGBA', im.size, (0, 0, 0, 0)); a = hero.split()[3].point(lambda v: int(v * .55))
    blk = Image.new('RGBA', hero.size, (0, 0, 0, 255)); blk.putalpha(a); sh.paste(blk, ((S - w2) // 2 + 14, int(S * .20) + 16), blk); sh = sh.filter(ImageFilter.GaussianBlur(14))
    im.alpha_composite(sh); im.alpha_composite(hero, ((S - w2) // 2, int(S * .20)))
    return im.convert('RGB')
def rounded(im, rad):
    m = Image.new('L', im.size, 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, im.size[0] - 1, im.size[1] - 1], rad, fill=255)
    o = im.convert('RGBA'); o.putalpha(m); return o
out = f'{ROOT}/pwa/icons'; os.makedirs(out, exist_ok=True)
A = art()
rounded(A, int(S * .22)).resize((512, 512), Image.LANCZOS).save(f'{out}/icon-512.png')
rounded(A, int(S * .22)).resize((192, 192), Image.LANCZOS).save(f'{out}/icon-192.png')
A.resize((512, 512), Image.LANCZOS).save(f'{out}/icon-maskable-512.png')      # full bleed; hero sits inside the 80% safe zone
A.resize((180, 180), Image.LANCZOS).save(f'{out}/apple-touch-icon.png')
rounded(A, int(S * .22)).resize((48, 48), Image.LANCZOS).save(f'{out}/favicon-48.png')
A.save(f'{ROOT}/pwa/icon-source.png'); print('icons ok', os.listdir(out))
