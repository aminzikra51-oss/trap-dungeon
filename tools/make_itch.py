"""Pack the single-file build as an itch.io HTML5 zip (index.html at the zip root, no service worker).
usage: python3 tools/make_itch.py [slug]   -> dist/<slug>-itch.zip"""
import sys, os, zipfile, re
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
slug = sys.argv[1] if len(sys.argv) > 1 else 'trap-dungeon'
src = open(f'{root}/trap-dungeon.html', encoding='utf-8').read()
assert 'serviceWorker' not in src and 'rel="manifest"' not in src, 'itch build must be the plain single-file page'
os.makedirs(f'{root}/dist', exist_ok=True)
out = f'{root}/dist/{slug}-itch.zip'
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    z.writestr('index.html', src.encode('utf-8'))
print(out, round(os.path.getsize(out) / 1024), 'KB zip;', round(len(src.encode('utf-8')) / 1024), 'KB extracted')
