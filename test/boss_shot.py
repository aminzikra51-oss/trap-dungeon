"""screenshots of the boss room in its states (attacks frozen so the hero survives). usage: python3 test/boss_shot.py [look3 0|1]"""
import sys
from playwright.sync_api import sync_playwright
look = sys.argv[1] if len(sys.argv) > 1 else '1'
FREEZE = "()=>{const e=TD.L.ents.find(x=>x.t==='boss'); e.nx=1e9}"
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 1000, 'height': 560})
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
    pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(500)
    pg.evaluate("(l)=>{TD.S.look3d=l==='1'; TD.setQ(l==='1'?3:0)}", look)
    pg.evaluate("()=>{TD.startGame(10)}"); pg.wait_for_timeout(1300)
    pg.screenshot(path=f'shots/boss_intro{look}.png')
    pg.wait_for_timeout(2600); pg.evaluate(FREEZE)
    pg.evaluate("()=>{const e=TD.L.ents.find(x=>x.t==='boss'); e.hits=2}"); pg.wait_for_timeout(300)
    pg.screenshot(path=f'shots/boss_fight{look}.png')
    pg.evaluate("()=>{const e=TD.L.ents.find(x=>x.t==='boss'); e.st='hurt'; e.tm=5; TD.bossSay('hit',{force:1,dur:4})}"); pg.wait_for_timeout(500)
    pg.screenshot(path=f'shots/boss_hurt{look}.png')
    pg.evaluate("()=>{const e=TD.L.ents.find(x=>x.t==='boss'); e.st='dying'; e.tm=2.4; TD.bossSay('defeat',{force:1,dur:4})}"); pg.wait_for_timeout(1000)
    pg.screenshot(path=f'shots/boss_dying{look}.png')
    pg.wait_for_timeout(2300)
    pg.screenshot(path=f'shots/boss_done{look}.png')
    print('after defeat: boss.st', pg.evaluate("()=>TD.L.ents.find(x=>x.t==='boss').st"), 'gate', pg.evaluate("()=>TD.L.gate"))
    pg.evaluate("()=>{TD.P.x=TD.L.exitTx*32+10}"); pg.wait_for_timeout(2600)
    pg.screenshot(path=f'shots/boss_end{look}.png')
    print('errors:', errs[:5], 'state', pg.evaluate("()=>TD.G.state"))
    b.close()
