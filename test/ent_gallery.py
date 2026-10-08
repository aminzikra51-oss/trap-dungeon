"""ent_gallery.py — close-up gallery of entities in the current look. usage: ent_gallery.py out.png [look3d=1] 'fam:var,fam:var,...' [frames]"""
import sys, os
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw
out = sys.argv[1]; look = sys.argv[2] if len(sys.argv) > 2 else '1'
items = [x.split(':') for x in (sys.argv[3] if len(sys.argv) > 3 else 'spike:static,spike:hidden,spike:pulse,saw:floor,saw:vert,saw:orbit,crush:drop,crush:thwomp,arrow:lane,arrow:sniper,walk:walker,walk:spiky,walk:charger,walk:jumper,walk:bat,spike:hog,pit:fish,pit:spring,pit:mover,pit:stones,pit:ceil,saw:pend,bait:x,terrain:wall').split(',')]
FR = int(sys.argv[4]) if len(sys.argv) > 4 else 60
JS = """([fam,v,fr,look])=>{
  const T=TD; T.sim(false); T.S.look3d=!!look; window.NOLIGHT3=true; T.S.diff='normal'; T.loadLevel(25,false,{script:[[fam,v]],W:70,D:{}}); T.G.state='play'; T.G.bannerT=0;
  const L=T.L; const seg=L.segs[0]; const sx=seg[1];
  T.P.x=(sx-3)*32; T.G.camX=Math.max(0,T.P.x-120); T.K.r=false;
  for(let i=0;i<fr;i++){T.update(1/60); if(T.G.state!=='play')break}
  const e=L.ents.find(e=>!['coin','cp','fake','exitrun','shot'].includes(e.t))||L.ents[0]||{t:'none',x:sx*32+48};
  const ex=(e.cx!==undefined?e.cx:(e.px!==undefined?e.px:e.x))+((e.w&&e.t!=='walk'&&e.t!=='thw'&&e.t!=='tur')?e.w/2:0);
  T.G.camX=Math.max(0,ex-400); T.G.state='menu'; T.render();
  return {x:ex-T.G.camX, y:(e.y!=null?e.y:224), t:e.t, st:T.G.state};
}"""
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 800, 'height': 448}, device_scale_factor=3)
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(500)
    pg.evaluate("document.getElementById('title').classList.add('hide');document.getElementById('hud').classList.add('hide')")
    tiles = []
    for fam, v in items:
        info = pg.evaluate(JS, [fam, v, FR, look == '1']); pg.wait_for_timeout(80)
        f = f'/tmp/g_{fam}_{v}.png'; pg.locator('#stage').screenshot(path=f)
        im = Image.open(f).convert('RGB'); s = im.width / 800
        cx = int(info['x'] * s); yc = info['y'] if info['t'] in ('thw','anv','ceil','pend','saw') else 330
        yc = min(max(yc, 60), 330); W, H = int(110 * s), int(100 * s)
        x0 = max(0, cx - W // 2); y0 = max(0, int(yc * s) - H // 2 - int(14 * s)); box = (x0, y0, min(im.width, x0 + W), min(im.height, y0 + H))
        tiles.append((f'{fam}:{v} ({info["t"]})', im.crop(box)))
    print('ERRS', errs[:5]); b.close()
cols = 4; tw = max(t[1].width for t in tiles); th = max(t[1].height for t in tiles)
rows = (len(tiles) + cols - 1) // cols; sheet = Image.new('RGB', (cols * tw, rows * (th + 20)), '#111'); d = ImageDraw.Draw(sheet)
for i, (name, im) in enumerate(tiles):
    x, y = (i % cols) * tw, (i // cols) * (th + 20); sheet.paste(im, (x, y + 20)); d.text((x + 4, y + 4), name, fill='#ff0')
sheet.save(out); print('saved', out, sheet.size)
