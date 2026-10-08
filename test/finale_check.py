"""the real ending at level 50: shows once (S.fin), second time falls back to the normal tier-5 card. usage: python3 test/finale_check.py"""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 1000, 'height': 560}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
    pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(500)
    pg.evaluate("()=>{TD.S.fin=0; TD.S.look3d=true; TD.setQ(3)}")
    for rnd, shot in ((1, 'fin_1'), (2, 'fin_2')):
        pg.evaluate("()=>{TD.startGame(50)}"); pg.wait_for_timeout(900)
        pg.evaluate("()=>{const e=TD.L.ents.find(x=>x.t==='boss'); e.nx=1e9; e.st='done'; TD.G.deaths=77; TD.P.x=TD.L.exitTx*32+10}")
        pg.wait_for_timeout(1800)
        print(rnd, 'state', pg.evaluate("()=>TD.G.state"), 'fin', pg.evaluate("()=>TD.G.endCard&&TD.G.endCard.fin"), 'S.fin', pg.evaluate("()=>TD.S.fin"), 't1', pg.evaluate("()=>TD.G.endCard&&TD.G.endCard.t1"), 'l1', pg.evaluate("()=>TD.G.endCard&&TD.G.endCard.l1"), 'winLen', pg.evaluate("()=>TD.G.winLen"))
        pg.screenshot(path=f'shots/{shot}.png')
    print('errors:', errs[:5])
    b.close()
