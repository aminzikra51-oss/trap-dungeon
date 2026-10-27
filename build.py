import base64, json, glob, os
root = os.path.dirname(os.path.abspath(__file__))
def b64(p): return base64.b64encode(open(p,'rb').read()).decode()
assets = {'audio':{}, 'img':{}, 'hero':{}, 'heroMeta':{}}
for p in sorted(glob.glob(f'{root}/assets/audio/*.mp3')):
    assets['audio'][os.path.basename(p)[:-4]] = 'data:audio/mpeg;base64,' + b64(p)
for p in sorted(glob.glob(f'{root}/assets/img/*.jpg')):
    assets['img'][os.path.basename(p)[:-4]] = 'data:image/jpeg;base64,' + b64(p)
for p in sorted(glob.glob(f'{root}/assets/hero/*.webp')):
    assets['hero'][os.path.basename(p)[:-5]] = 'data:image/webp;base64,' + b64(p)
if os.path.exists(f'{root}/assets/hero/meta.json'): assets['heroMeta'] = json.load(open(f'{root}/assets/hero/meta.json'))
src = open(f'{root}/src/index.src.html', encoding='utf-8').read()
import re as _re
src = _re.sub(r'/\*@include ([\w.]+)\*/', lambda m: open(f'{root}/src/{m.group(1)}', encoding='utf-8').read(), src)
assets['voices'] = json.load(open(f'{root}/assets/voices.json', encoding='utf-8'))
SHARE_URL = os.environ.get('SHARE_URL', 'https://aminzikra51-oss.github.io/dont-die-habibi/play/')  # canonical link every build shares (tiny preview page that redirects to the game)
out = src.replace('__ASSETS_JSON__', json.dumps(assets, ensure_ascii=False)).replace('__SHARE_URL__', SHARE_URL)
open(f'{root}/trap-dungeon.html', 'w', encoding='utf-8').write(out)
print('built', round(len(out)/1024), 'KB; audio:', len(assets['audio']), 'img:', len(assets['img']))

# --- artifact variant: the host adds doctype/html/head/body, so strip ours ---
import re
a = out
a = re.sub(r'<!DOCTYPE html>\s*<html[^>]*>\s*<head>\s*', '', a, count=1)
a = re.sub(r'<meta charset[^>]*>\s*', '', a, count=1)
a = re.sub(r'<meta name="viewport"[^>]*>\s*', '', a, count=1)
a = re.sub(r'<meta name="theme-color"[^>]*>\s*', '', a, count=1)
a = a.replace('</head>\n<body>\n', '\n', 1).replace('</body>\n</html>', '', 1)
assert '<html' not in a and '<body' not in a and '<title>' in a[:8192]
open(f'{root}/trap-dungeon.artifact.html', 'w', encoding='utf-8').write(a)
print('artifact variant', round(len(a)/1024), 'KB')

# --- PWA sites: the same game + manifest + service worker + icons + link-preview image.
#     docs/ = dev site (GitHub Pages of this repo); site/ = the independent public repo (dont-die-habibi), synced by tools/sync_site.sh
import hashlib, shutil
SITES = [('docs', 'https://aminzikra51-oss.github.io/trap-dungeon/'), ('site', 'https://aminzikra51-oss.github.io/dont-die-habibi/')]
TITLE = "Don't Die, Habibi | \u0644\u0627 \u062a\u0645\u0648\u062a \u064a\u0627 \u062d\u0628\u064a\u0628\u064a"
reg = """<script>
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost')){
  const had=!!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js').catch(()=>{});
  navigator.serviceWorker.addEventListener('controllerchange',()=>{ if(!had)return; try{ const g=window.TD&&TD.G; if(!g||g.state==='title'||g.state==='menu')location.reload() }catch(e){} });
}
</script>
"""
for d, url in SITES:
    site = f'{root}/{d}'; os.makedirs(f'{site}/icons', exist_ok=True)
    for f in glob.glob(f'{root}/pwa/icons/*.png'): shutil.copy(f, f'{site}/icons/')
    if os.path.exists(f'{root}/pwa/og.jpg'): shutil.copy(f'{root}/pwa/og.jpg', f'{site}/og.jpg')
    desc = '\u0644\u0639\u0628\u0629 \u0645\u0646\u0635\u0651\u0627\u062a \u0639\u0631\u0628\u064a\u0629 \u0633\u0627\u062e\u0631\u0629: \u0641\u062e\u0627\u062e\u060c \u0634\u0645\u0627\u062a\u0629 \u0628\u0623\u0635\u0648\u0627\u062a \u0644\u0628\u0646\u0627\u0646\u064a\u0629 \u0648\u0645\u0635\u0631\u064a\u0629 \u0648\u0641\u0644\u0633\u0637\u064a\u0646\u064a\u0629\u060c \u0648\u0645\u0631\u0627\u062d\u0644 \u0644\u0627 \u0646\u0647\u0627\u0626\u064a\u0629. A trap platformer where the signs lie and the traps laugh at you.'
    ogd = '\u0643\u0644 \u0634\u064a \u0622\u0645\u0646 \u0647\u0648\u0646... \u0648\u0643\u0644\u0647 \u0643\u0630\u0628 \U0001F607  Totally safe here. (It is not.)'
    head = ('<link rel="manifest" href="manifest.webmanifest">\n'
            '<link rel="icon" type="image/png" sizes="48x48" href="icons/favicon-48.png">\n'
            '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">\n'
            '<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="mobile-web-app-capable" content="yes">\n'
            '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n<meta name="apple-mobile-web-app-title" content="Don\'t Die">\n'
            f'<meta name="description" content="{desc}">\n'
            f'<meta property="og:type" content="website"><meta property="og:site_name" content="Don\'t Die, Habibi">\n'
            f'<meta property="og:title" content="{TITLE}"><meta property="og:description" content="{ogd}">\n'
            f'<meta property="og:url" content="{url}"><meta property="og:image" content="{url}og.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">\n'
            f'<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{TITLE}"><meta name="twitter:description" content="{ogd}"><meta name="twitter:image" content="{url}og.jpg">\n')
    page = out.replace('</head>', head + '</head>', 1).replace('</body>', reg + '</body>', 1)
    assert 'rel="manifest"' in page and 'serviceWorker' in page and 'og:image' in page
    h = hashlib.sha1(page.encode('utf-8')).hexdigest()[:10]
    open(f'{site}/index.html', 'w', encoding='utf-8').write(page)
    shutil.copy(f'{root}/pwa/manifest.webmanifest', f'{site}/manifest.webmanifest')
    open(f'{site}/sw.js', 'w', encoding='utf-8').write(open(f'{root}/pwa/sw.template.js', encoding='utf-8').read().replace('__HASH__', h))
    open(f'{site}/.nojekyll', 'w').write('')
    # tiny link-preview page (og tags + instant redirect): chat apps' crawlers fetch a few KB instead of the 7 MB game, and a fresh URL dodges stale preview caches
    os.makedirs(f'{site}/play', exist_ok=True)
    open(f'{site}/play/index.html', 'w', encoding='utf-8').write(f'''<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{TITLE}</title>
<meta name="description" content="{desc}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Don't Die, Habibi"><meta property="og:title" content="{TITLE}"><meta property="og:description" content="{ogd}"><meta property="og:url" content="{url}play/"><meta property="og:image" content="{url}og.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{TITLE}"><meta name="twitter:description" content="{ogd}"><meta name="twitter:image" content="{url}og.jpg">
<meta http-equiv="refresh" content="0;url=../"><style>body{{background:#0b0714;color:#ffd23f;font:700 22px sans-serif;display:grid;place-items:center;height:100vh;margin:0}}a{{color:#ffd23f}}</style></head>
<body><a href="../">&#9654; Don't Die, Habibi</a><script>location.replace('../'+location.search+location.hash)</script></body></html>''')
    print(f'pwa site {d}/ ->', round(len(page)/1024), 'KB, sw hash', h)
