"""Store cover art (630x500 @2x) built from the live game: background screenshot + hero cutouts + title.
usage: python3 tools/make_cover.py  -> dist/cover.png"""
import os
from playwright.sync_api import sync_playwright
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); d = f'{root}/dist'; os.makedirs(d, exist_ok=True)
SETUP = """()=>{const e=TD.L.ents.find(e=>e.t==='saw');const ex=(e.x0!==undefined?e.x0:e.x);TD.G.bannerT=0;TD.P.x=ex-130;TD.P.y=TD.GY-TD.PH;TD.G.camX=ex-300;for(let i=0;i<20;i++){TD.K.r=false;TD.update(1/60)}}"""
HTML = """<!doctype html><meta charset=utf-8><style>
html,body{margin:0;background:#000}#c{position:relative;width:630px;height:500px;overflow:hidden;font-family:'Inter','Noto Sans Arabic','DejaVu Sans',sans-serif}
#bg{position:absolute;inset:0;background:url(_bg.png) 38% 60%/auto 118% no-repeat;filter:brightness(.78) saturate(1.15)}
#vg{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 55%,#0000 35%,#07030dcc 100%),linear-gradient(#07030d99,#0000 38%,#0000 62%,#07030dcc)}
.t1,.t2{position:absolute;left:0;right:0;text-align:center;font-weight:900;line-height:.9;letter-spacing:-1px;-webkit-text-stroke:7px #000;paint-order:stroke fill;text-shadow:0 6px 0 #000,0 10px 18px #000a}
.t1{top:22px;font-size:68px;color:#ffd23f}.t2{top:84px;font-size:100px;color:#ff5d7a;letter-spacing:1px}
.ar{position:absolute;left:50%;top:196px;transform:translateX(-50%) rotate(-2deg);background:linear-gradient(#ffe36b,#ffb81f);color:#1b1230;font-weight:900;font-size:38px;padding:0 26px 7px;border:5px solid #000;border-radius:18px;box-shadow:0 7px 0 #000;white-space:nowrap;line-height:1.35}
.ground{position:absolute;left:0;right:0;bottom:0;height:62px;background:linear-gradient(#3b8f3e 0 9px,#1c1633 9px);border-top:4px solid #000}
.tag{position:absolute;left:0;right:0;bottom:7px;text-align:center;color:#ffe9a8;font-weight:800;font-size:16px;letter-spacing:.3px}
.row{position:absolute;left:0;right:0;bottom:44px;display:flex;justify-content:center;align-items:flex-end;gap:0}
.row img{filter:drop-shadow(0 6px 0 #000a)}
.sk{position:absolute;right:20px;top:34px;transform:rotate(12deg);font-size:50px;filter:drop-shadow(0 4px 0 #000a)}
</style><div id=c><div id=bg></div><div id=vg></div>
<div class=t1>DON'T DIE,</div><div class=t2>HABIBI</div><div class=sk>\U0001F480</div>
<div class=ar>\u0644\u0627 \u062a\u0645\u0648\u062a \u064a\u0627 \u062d\u0628\u064a\u0628\u064a</div>
<div class=ground></div><div class=tag>Totally safe here. (It is not.) \U0001F607</div>
<div class=row><img style="height:132px" src="../assets/hero/donkey.webp"><img style="height:148px" src="../assets/hero/cat.webp"><img style="height:162px" src="../assets/hero/grandma.webp"><img style="height:198px" src="../assets/hero/falafel.webp"><img style="height:162px" src="../assets/hero/uncle.webp"><img style="height:148px" src="../assets/hero/chicken.webp"></div></div>"""
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 960, 'height': 540}); pg.goto(f'file://{root}/trap-dungeon.html'); pg.wait_for_timeout(500)
    pg.evaluate('TD.startGame(3)'); pg.wait_for_timeout(300); pg.evaluate(SETUP); pg.wait_for_timeout(300); pg.screenshot(path=f'{d}/_bg.png'); pg.close()
    open(f'{d}/_cover.html', 'w', encoding='utf-8').write(HTML)
    pg = b.new_page(viewport={'width': 630, 'height': 500}, device_scale_factor=2); pg.goto(f'file://{d}/_cover.html'); pg.wait_for_timeout(600)
    pg.locator('#c').screenshot(path=f'{d}/cover.png'); b.close()
print('dist/cover.png', os.path.getsize(f'{d}/cover.png') // 1024, 'KB')
