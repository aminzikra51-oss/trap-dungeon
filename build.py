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
out = src.replace('__ASSETS_JSON__', json.dumps(assets, ensure_ascii=False))
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

# --- PWA site (GitHub Pages serves /docs): the same game + manifest + service worker + icons ---
import hashlib, shutil
site = f'{root}/docs'; os.makedirs(f'{site}/icons', exist_ok=True)
for f in glob.glob(f'{root}/pwa/icons/*.png'): shutil.copy(f, f'{site}/icons/')
head = ('<link rel="manifest" href="manifest.webmanifest">\n'
        '<link rel="icon" type="image/png" sizes="48x48" href="icons/favicon-48.png">\n'
        '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">\n'
        '<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="mobile-web-app-capable" content="yes">\n'
        '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n<meta name="apple-mobile-web-app-title" content="زنزانة الفخاخ">\n'
        '<meta name="description" content="لعبة منصّات عربية ساخرة: فخاخ، شماتة بأصوات لبنانية ومصرية وفلسطينية، ومراحل لا نهائية.">\n'
        '<meta property="og:title" content="زنزانة الفخاخ"><meta property="og:description" content="كل شي آمن هون... وكله كذب 😇">\n')
reg = """<script>
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost')){
  const had=!!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js').catch(()=>{});
  navigator.serviceWorker.addEventListener('controllerchange',()=>{ if(!had)return; try{ const g=window.TD&&TD.G; if(!g||g.state==='title'||g.state==='menu')location.reload() }catch(e){} });
}
</script>
"""
page = out.replace('</head>', head + '</head>', 1).replace('</body>', reg + '</body>', 1)
assert 'rel="manifest"' in page and 'serviceWorker' in page
h = hashlib.sha1(page.encode('utf-8')).hexdigest()[:10]
open(f'{site}/index.html', 'w', encoding='utf-8').write(page)
shutil.copy(f'{root}/pwa/manifest.webmanifest', f'{site}/manifest.webmanifest')
open(f'{site}/sw.js', 'w', encoding='utf-8').write(open(f'{root}/pwa/sw.template.js', encoding='utf-8').read().replace('__HASH__', h))
open(f'{site}/.nojekyll', 'w').write('')
print('pwa site docs/ ->', round(len(page)/1024), 'KB, sw hash', h)
