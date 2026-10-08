#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
slice_sheet.py — يقصّ شبكات الصور المولَّدة (sheet_all / sheet_1..4) إلى صور منفصلة باسم كل مفتاح.

الاستخدام:
    python3 tools/slice_sheet.py                       # كل ملفات incoming/img/sheet_*
    python3 tools/slice_sheet.py my.png --cols 3 --rows 3 --start 10
    python3 tools/slice_sheet.py --dry                 # يعرض التقسيم فقط ويحفظ معاينة بدون كتابة الصور
    python3 tools/slice_sheet.py --equal               # تجاهل كشف الخطوط واستعمل تقسيم متساوٍ

التسمية التلقائية:  sheet_all.* = شبكة 6×6 تبدأ من الصورة 1   |   sheet_N.* = شبكة 3×3 تبدأ من (N-1)*9+1
الخلايا مرتبة يسار→يمين ثم أعلى→أسفل، وأسماؤها من content/images.json.
يحاول كشف خطوط الفصل السوداء بين الخلايا (أدق)، وإن لم يجدها يقسّم بالتساوي.
يحفظ معاينة مرقّمة في incoming/img/_preview_*.jpg لتتأكد بعينك.
"""
import argparse, glob, json, os, re, sys
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXT = ('.png', '.jpg', '.jpeg', '.webp')

def runs(mask):
    out, i, n = [], 0, len(mask)
    while i < n:
        if mask[i]:
            j = i
            while j < n and mask[j]: j += 1
            out.append((i, j)); i = j
        else: i += 1
    return out

def find_edges(gray, axis, n, dark_thr=70, frac_thr=0.72, tol=0.32):
    """يرجع قائمة n خلية (start,end) على المحور، ومنهج الكشف."""
    L = gray.shape[1] if axis == 'x' else gray.shape[0]
    dark = gray < dark_thr
    frac = dark.mean(axis=0) if axis == 'x' else dark.mean(axis=1)
    rs = runs(frac > frac_thr)
    cell = L / n; seps = []; found = 0
    for k in range(1, n):
        exp = k * cell
        best = min(rs, key=lambda r: abs((r[0] + r[1]) / 2 - exp), default=None)
        if best and abs((best[0] + best[1]) / 2 - exp) < tol * cell and (best[1] - best[0]) < 0.12 * cell:
            seps.append(best); found += 1
        else:
            seps.append((int(exp - 2), int(exp + 2)))
    # الإطار الخارجي
    first = rs[0] if rs and rs[0][0] < 0.04 * cell else None
    last = rs[-1] if rs and rs[-1][1] > L - 0.04 * cell else None
    starts = [first[1] if first else 0] + [s[1] for s in seps]
    ends = [s[0] for s in seps] + [last[0] if last else L]
    return list(zip(starts, ends)), found

def trim_dark_edges(im, max_frac=0.06):
    a = np.asarray(im.convert('L')); h, w = a.shape; d = a < 38
    t = b = l = r = 0
    while t < h * max_frac and d[t].mean() > 0.85: t += 1
    while b < h * max_frac and d[h - 1 - b].mean() > 0.85: b += 1
    while l < w * max_frac and d[:, l].mean() > 0.85: l += 1
    while r < w * max_frac and d[:, w - 1 - r].mean() > 0.85: r += 1
    return im.crop((l, t, w - r, h - b))

def config_for(path, args):
    name = os.path.splitext(os.path.basename(path))[0].lower()
    if args.cols and args.rows: return args.cols, args.rows, args.start or 1
    if name.startswith('sheet_all'): return 6, 6, 1
    m = re.match(r'sheet_(\d+)', name)
    if m: return 3, 3, (int(m.group(1)) - 1) * 9 + 1
    return None

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('files', nargs='*')
    ap.add_argument('--cols', type=int); ap.add_argument('--rows', type=int); ap.add_argument('--start', type=int)
    ap.add_argument('--out', default=os.path.join(ROOT, 'assets', 'img'))
    ap.add_argument('--size', type=int, default=360); ap.add_argument('--margin', type=float, default=0.025)
    ap.add_argument('--equal', action='store_true'); ap.add_argument('--dry', action='store_true'); ap.add_argument('--force', action='store_true')
    ap.add_argument('--quality', type=int, default=84)
    args = ap.parse_args()
    items = {r['n']: r['key'] for r in json.load(open(os.path.join(ROOT, 'content', 'images.json'), encoding='utf-8'))}
    inc = os.path.join(ROOT, 'incoming', 'img')
    files = args.files or sorted(f for f in glob.glob(os.path.join(inc, 'sheet_*')) if f.lower().endswith(EXT))
    if not files: sys.exit(f'ما لقيت شبكات في {inc} (الأسماء المتوقعة: sheet_all.png أو sheet_1.png ... sheet_4.png)')
    os.makedirs(args.out, exist_ok=True); os.makedirs(inc, exist_ok=True)
    total = 0; warns = []
    for f in files:
        cfg = config_for(f, args)
        if not cfg: print(f'تجاهلت {os.path.basename(f)}: حدد --cols --rows --start'); continue
        cols, rows, start = cfg
        im = Image.open(f).convert('RGB'); W, H = im.size
        gray = np.asarray(im.convert('L'))
        if args.equal: xs = [(int(i * W / cols), int((i + 1) * W / cols)) for i in range(cols)]; fx = -1; ys = [(int(i * H / rows), int((i + 1) * H / rows)) for i in range(rows)]; fy = -1
        else: xs, fx = find_edges(gray, 'x', cols); ys, fy = find_edges(gray, 'y', rows)
        meth = 'متساوٍ' if args.equal else f'كشف الخطوط (أعمدة {fx}/{cols-1}، صفوف {fy}/{rows-1})'
        print(f'\n== {os.path.basename(f)}  {W}×{H}  شبكة {cols}×{rows} تبدأ من {start} | {meth}')
        if not args.equal and (fx < cols - 1 or fy < rows - 1): warns.append(f'{os.path.basename(f)}: لم تُكتشف كل خطوط الفصل، استعملت التقسيم المتساوي للناقص — راجع المعاينة')
        prev = []
        for r in range(rows):
            for c in range(cols):
                n = start + r * cols + c
                key = items.get(n)
                if key is None: continue
                x0, x1 = xs[c]; y0, y1 = ys[r]
                mx = int((x1 - x0) * args.margin); my = int((y1 - y0) * args.margin)
                cell = im.crop((x0 + mx, y0 + my, x1 - mx, y1 - my))
                cell = trim_dark_edges(cell)
                w, h = cell.size; s = min(w, h)
                cell = cell.crop(((w - s) // 2, (h - s) // 2, (w - s) // 2 + s, (h - s) // 2 + s))
                sz = 640 if key == 'title_1' else args.size
                cell = cell.resize((sz, sz), Image.LANCZOS)
                # خلية فاضية؟
                a = np.asarray(cell.convert('L')); content = float((a < 235).mean())
                if content < 0.03: warns.append(f'{key}: الخلية شبه فاضية')
                prev.append((n, key, cell))
                dst = os.path.join(args.out, key + '.jpg')
                tag = ''
                if os.path.exists(dst) and not args.force: tag = ' (موجودة، تخطّيت)'
                elif not args.dry: cell.save(dst, 'JPEG', quality=args.quality, optimize=True); total += 1
                print(f'  {n:>2} {key:16s} {"محتوى %.0f%%" % (content*100):12s}{tag}')
        # معاينة مرقّمة
        th = 150; pw = cols * (th + 6) + 6; ph = rows * (th + 6) + 6
        pv = Image.new('RGB', (pw, ph), '#222'); d = ImageDraw.Draw(pv)
        for i, (n, key, cell) in enumerate(prev):
            x = 6 + (i % cols) * (th + 6); y = 6 + (i // cols) * (th + 6)
            pv.paste(cell.resize((th, th)), (x, y)); d.rectangle([x, y, x + 54, y + 16], fill='#000'); d.text((x + 3, y + 2), f'{n} {key.split("_",1)[1][:9]}', fill='#ff0')
        pp = os.path.join(inc, '_preview_' + os.path.splitext(os.path.basename(f))[0] + '.jpg'); pv.save(pp, quality=80)
        print('  معاينة:', pp)
    print(f"\n{'(بدون كتابة) ' if args.dry else ''}تم حفظ {total} صورة في {args.out}")
    for w in warns: print('⚠', w)
    if total and not args.dry: print('الآن شغّل:  python3 build.py')

if __name__ == '__main__':
    main()
