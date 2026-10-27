"""Smoke test for traps v2: every new family appears somewhere, runs for a few seconds in the real loop without errors, and every death kind draws.
usage: python3 test/trap2_smoke.py"""
from playwright.sync_api import sync_playwright
URL='file:///home/claude/trap-dungeon/trap-dungeon.html'
NEW=['mimic','mole','frog','jet','cloud','elec','beam','train']
with sync_playwright() as p:
    b=p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg=b.new_page(viewport={'width':960,'height':540}); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    pg.goto(URL); pg.wait_for_timeout(600)
    seen=pg.evaluate("""()=>{const o={},z={},pl={};for(const d of ['normal','crazy','hell'])for(let n=1;n<=60;n++){if(n%10===0)continue;const L=TD.buildLevel(n,{diff:d});for(const e of L.ents){o[e.t]=(o[e.t]||0)+1;if(e.t==='plat'&&e.v==='elev')pl.elev=(pl.elev||0)+1}for(const q of L.zones)z[q.type]=(z[q.type]||0)+1}return {ents:o,zones:z,pl}}""")
    print('entity counts over levels 1-60 x 3 diffs:',seen)
    for t in NEW: assert seen['ents'].get(t),'missing '+t
    assert seen['pl'].get('elev'),'missing elev'; assert seen['zones'].get('belt') and seen['zones'].get('mud'),'missing belt/mud'
    # run each level for ~3 s with a bot that just runs right (draws every entity, updates every behaviour)
    for n in range(6,40):
        if n%10==0: continue
        pg.evaluate("(n)=>TD.startGame(n)",n); pg.wait_for_timeout(120)
        pg.evaluate("()=>{TD.G.bannerT=0}"); pg.keyboard.down('ArrowRight'); pg.wait_for_timeout(1400); pg.keyboard.up('ArrowRight')
    print('errors after level runs:',errs[:5])
    # every death cause draws at several times
    causes=['spike','arrow','ghost','crush','bait','boulder','wall','saw','fakedoor','monster','ball','pit','crumble','fire','zap','disco','laser','train','mole','chest','frog','ceilspike']
    for ca in causes:
        for dv in (0.05,0.5,0.95):
            pg.evaluate("()=>TD.startGame(5)"); pg.wait_for_timeout(80)
            pg.evaluate("([ca,dv])=>{TD.G.bannerT=0;TD.P.dead=true;TD.G.state='dead';TD.G.cause=ca;TD.G.deadT=0;TD.G.dv=dv;TD.G.cardShown=true;TD.G.killer=null}",[ca,dv])
            for _ in range(5): pg.wait_for_timeout(260)
    print('errors after death kinds:',errs[:5]); b.close()
    assert not errs, errs[:3]
    print('PASS')
