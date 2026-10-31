"""Readability check: each world with the nearest real traps in front. python3 test/bgtraps.py OUTDIR [level]"""
import sys, base64, os
from playwright.sync_api import sync_playwright
out = sys.argv[1]; lvl = int(sys.argv[2]) if len(sys.argv) > 2 else 14
os.makedirs(out, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 960, 'height': 540}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(500)
    n = pg.evaluate("window.TD.THEMES.length")
    for i in range(n):
        u = pg.evaluate("""([i,lvl])=>{const T=window.TD;T.setQ(3);T.S.look3d=true;T.FLAGS.noBoss=true;T.loadLevel(lvl);T.G.state='play';document.getElementById('title').classList.add('hide');
          T.setTheme(i);T.setAT(4+i*.37);T.G.bannerT=0;
          const es=T.L.ents.filter(e=>['spk','saw','tur','anv','walk','hog','thw','pend','fire','crush'].includes(e.t)&&(e.x||0)>500).sort((a,b)=>a.x-b.x);
          const x=es.length?es[Math.min(1,es.length-1)].x:900; T.P.x=x-170; T.G.camX=Math.max(0,x-330);T.render();
          return document.querySelector('canvas').toDataURL('image/png')}""", [i, lvl])
        open(f'{out}/t{i:02d}.png', 'wb').write(base64.b64decode(u.split(',')[1]))
    print('errors', errs[:3]); b.close()
