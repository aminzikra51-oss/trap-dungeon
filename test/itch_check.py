"""Simulate itch.io: game served from origin A inside a sandboxed iframe on origin B.
usage: python3 test/itch_check.py [zip]  -> checks load, start, storage, audio unlock, fullscreen support, console errors; saves shots/itch_*.png"""
import sys, os, zipfile, tempfile, subprocess, time, shutil
from playwright.sync_api import sync_playwright
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
zp = sys.argv[1] if len(sys.argv) > 1 else f'{root}/dist/trap-dungeon-itch.zip'
tmp = tempfile.mkdtemp(prefix='itchsim_'); gdir = f'{tmp}/game'; hdir = f'{tmp}/host'; os.makedirs(gdir); os.makedirs(hdir)
zipfile.ZipFile(zp).extractall(gdir)
assert os.path.exists(f'{gdir}/index.html'), 'index.html missing at zip root'
SB = 'allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock allow-modals allow-downloads'
def host(w, h): return f'<!doctype html><body style="margin:0;background:#222"><iframe id=f src="http://localhost:8801/index.html" width={w} height={h} frameborder=0 allowfullscreen sandbox="{SB}" allow="autoplay; fullscreen; gamepad; accelerometer; gyroscope"></iframe></body>'
open(f'{hdir}/d.html', 'w').write(host(960, 540)); open(f'{hdir}/m.html', 'w').write(host(844, 390))
s1 = subprocess.Popen([sys.executable, '-m', 'http.server', '8801', '--directory', gdir], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
s2 = subprocess.Popen([sys.executable, '-m', 'http.server', '8802', '--directory', hdir], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
bad = 0
def chk(name, ok, extra=''):
    global bad; print(('PASS ' if ok else 'FAIL ') + name, extra); bad += (not ok)
try:
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--autoplay-policy=document-user-activation-required'])
        for tag, w, h, page, mobile in (('desk', 960, 540, 'd.html', False), ('phone', 844, 390, 'm.html', True)):
            ctx = b.new_context(viewport={'width': w, 'height': h}, has_touch=mobile, is_mobile=mobile)
            pg = ctx.new_page(); errs = []; reqs = []
            pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
            pg.on('request', lambda r: reqs.append(r.url) if not r.url.startswith(('data:', 'blob:', 'http://localhost')) else None)
            pg.goto(f'http://localhost:8802/{page}'); pg.wait_for_timeout(1500)
            fr = pg.frame_locator('#f'); frame = [f for f in pg.frames if f != pg.main_frame][0]
            chk(f'[{tag}] TD global present', frame.evaluate('typeof TD!=="undefined"'))
            chk(f'[{tag}] title visible', frame.evaluate('getComputedStyle(document.getElementById("title")).display!=="none"'))
            pg.screenshot(path=f'{root}/shots/itch_{tag}_title.png')
            fr.locator('#bPlay').click(); pg.wait_for_timeout(1800)
            st = frame.evaluate('TD.G.state'); chk(f'[{tag}] play starts via click', st in ('play', 'playing', 'intro'), st)
            ac = frame.evaluate('(()=>{const S=(typeof Snd!=="undefined"&&Snd)||(TD&&TD.Snd);return S&&S.ctx?S.ctx.state:"n/a"})()')
            chk(f'[{tag}] audio context running after the click (autoplay policy strict)', ac == 'running', ac)
            pg.keyboard.down('ArrowRight'); pg.wait_for_timeout(700); pg.keyboard.up('ArrowRight')
            chk(f'[{tag}] hero moved', frame.evaluate('TD.P.x')>0, frame.evaluate('Math.round(TD.P.x)'))
            pg.screenshot(path=f'{root}/shots/itch_{tag}_play.png')
            frame.evaluate('TD.S.look3d=TD.S.look3d; localStorage.setItem("td_probe","1")')
            chk(f'[{tag}] localStorage works in iframe', frame.evaluate('localStorage.getItem("td_probe")')=='1')
            chk(f'[{tag}] td_s saved', frame.evaluate('!!localStorage.getItem("td_s")'))
            chk(f'[{tag}] fullscreen API available', frame.evaluate('!!(document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen)'))
            chk(f'[{tag}] no SW/manifest requests', not any('sw.js' in r or 'manifest' in r for r in reqs), reqs[:3])
            chk(f'[{tag}] no external requests', not reqs, reqs[:3])
            chk(f'[{tag}] no console errors', not errs, errs[:3])
            ctx.close()
        b.close()
finally:
    s1.terminate(); s2.terminate(); shutil.rmtree(tmp, ignore_errors=True)
print('RESULT:', 'ALL PASS' if not bad else f'{bad} FAIL'); sys.exit(1 if bad else 0)
