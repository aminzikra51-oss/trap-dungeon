"""Contact sheet of every animated world: python3 test/bgsheet.py OUTDIR [level] [AT seconds] [quality]
Renders each theme with real traps on screen and saves one PNG per world + a combined sheet."""
import sys, base64, os
from playwright.sync_api import sync_playwright
out = sys.argv[1]; lvl = int(sys.argv[2]) if len(sys.argv) > 2 else 8
at = float(sys.argv[3]) if len(sys.argv) > 3 else 3.0
q = int(sys.argv[4]) if len(sys.argv) > 4 else 3
os.makedirs(out, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 960, 'height': 540}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(500)
    n = pg.evaluate("window.TD.THEMES.length")
    for i in range(n):
        d = pg.evaluate("""([i,lvl,at,q])=>{const T=window.TD;T.setQ(q);T.FLAGS.noBoss=true;T.S.look3d=true;T.loadLevel(lvl);T.G.state='play';document.getElementById('title').classList.add('hide');
          T.setTheme(i);T.setAT(at);T.G.bannerT=0;T.G.camX=Math.max(0,T.P.x-200);T.render();
          return [T.THEMES[i].nm,document.querySelector('canvas').toDataURL('image/png')]}""", [i, lvl, at, q])
        open(f'{out}/w{i:02d}.png', 'wb').write(base64.b64decode(d[1].split(',')[1]))
    print('worlds', n, 'errors', errs[:5])
    b.close()
