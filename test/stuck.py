import sys, json
sys.path.insert(0,'test')
from solver import SOLVER
from playwright.sync_api import sync_playwright
n=int(sys.argv[1]); ms=int(sys.argv[2]) if len(sys.argv)>2 else 3000
with sync_playwright() as p:
    b=p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required']); pg=b.new_page(viewport={'width':880,'height':500})
    pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(300)
    pg.evaluate("document.getElementById('title').classList.add('hide');document.getElementById('hud').classList.remove('hide')")
    r=pg.evaluate(SOLVER,[[n],1,ms,'{"dbg":1}'])
    print(json.dumps(r[0],ensure_ascii=False))
    pg.locator('#stage').screenshot(path=f'shots/stuck_{n}.png')
    print(pg.evaluate("()=>{const P=TD.P;return [Math.round(P.x/32*10)/10,Math.round(P.y),TD.G.state]}"))
    b.close()
