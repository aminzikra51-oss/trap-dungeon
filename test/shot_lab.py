import sys, json, os
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw
LAB = json.loads(sys.argv[1]) if len(sys.argv) > 1 else [["spike","static"]]
N = int(sys.argv[2]) if len(sys.argv) > 2 else 20
FR = int(sys.argv[3]) if len(sys.argv) > 3 else 80
out = sys.argv[4] if len(sys.argv) > 4 else 'shots/lab.png'
os.makedirs('shots', exist_ok=True)
JS = """([fam,v,n,fr])=>{
  const T=TD; T.sim(false); T.loadLevel(n,false,{script:[[fam,v]],W:70,D:{}}); T.G.state='play'; T.G.bannerT=0;
  const L=T.L; const seg=L.segs[0]; const sx=seg[1];
  T.P.x=(sx-5)*32; T.G.camX=Math.max(0,T.P.x-300); T.K.r=false;
  for(let i=0;i<fr;i++){T.update(1/60); if(T.G.state!=='play')break}
  T.render(); return [sx, seg[2], T.G.state];
}"""
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 880, 'height': 500})
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(400)
    pg.evaluate("document.getElementById('title').classList.add('hide');document.getElementById('hud').classList.remove('hide')")
    imgs = []
    for fam, v in LAB:
        info = pg.evaluate(JS, [fam, v, N, FR])
        pg.wait_for_timeout(60)
        f = f'/tmp/lab_{fam}_{v}.png'
        pg.locator('#stage').screenshot(path=f)
        imgs.append((fam + ':' + v, f, info))
    print('ERRS', errs[:5])
    b.close()
# contact sheet
cols = 2; tw, th = 560, 314
rows = (len(imgs) + cols - 1) // cols
sheet = Image.new('RGB', (cols * tw, rows * (th + 18)), '#111')
d = ImageDraw.Draw(sheet)
for i, (name, f, info) in enumerate(imgs):
    im = Image.open(f).convert('RGB').resize((tw, th))
    x, y = (i % cols) * tw, (i // cols) * (th + 18)
    sheet.paste(im, (x, y + 18)); d.text((x + 4, y + 3), f'{name}  {info}', fill='#ff0')
sheet.save(out); print('saved', out)
