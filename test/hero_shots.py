"""Screenshots of the hero picker + every hero in game, sprite (look3d) and procedural fallback. usage: python3 test/hero_shots.py [id ...]"""
import sys
from playwright.sync_api import sync_playwright
URL='file:///home/claude/trap-dungeon/trap-dungeon.html'
ids=sys.argv[1:]
with sync_playwright() as p:
    b=p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg=b.new_page(viewport={'width':960,'height':540}); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    pg.goto(URL); pg.wait_for_timeout(900)
    pg.screenshot(path='shots/h_title.png')
    ids=ids or pg.evaluate("()=>Object.keys(TD.S).length?[...document.querySelectorAll('#heroT .hb')].map(b=>b.dataset.h):[]")
    print('heroes in picker:',ids)
    for h in ids:
        for look in (1,0):
            pg.evaluate("([h,l])=>{TD.S.hero=h;TD.S.look3d=!!l}",[h,look]); pg.evaluate("()=>TD.startGame(3)"); pg.wait_for_timeout(350)
            pg.evaluate("()=>{TD.G.bannerT=0}"); pg.keyboard.down('ArrowRight'); pg.wait_for_timeout(260); pg.keyboard.up('ArrowRight'); pg.wait_for_timeout(120)
            pg.screenshot(path=f'shots/h_{h}_{look}.png',clip={'x':0,'y':0,'width':960,'height':540})
    print('errs',errs[:4]); b.close()
