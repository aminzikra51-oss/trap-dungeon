"""World map: renders, scrolls to the current level, locks unreached levels, starts a replayed level, stars, shop/ach round trip.
usage: python3 test/map.py [--shots DIR]"""
import sys, json, os
from playwright.sync_api import sync_playwright
shots = sys.argv[sys.argv.index('--shots') + 1] if '--shots' in sys.argv else None
res = []
def ok(name, cond, info=''):
    res.append(bool(cond)); print(('  ok   ' if cond else '  FAIL ') + name + (f'  [{info}]' if info != '' else ''))

SETUP = r"""() => { const T=window.TD, S=T.S; S.best=23; S.cl={}; S.nd={}; S.cs={}; S.bd={}; S.wallet=77; S.own={falafel:1,cat:1}; S.hero='cat'; S.ow={};
  for(let n=1;n<=22;n++){ S.cl[n]=1; if(n%2===0)S.nd[n]=1; if(n%3===0)S.cs[n]=1 } T.G.state='title'; T.openMap(); return true }
"""
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    for vp, tag in (({'width': 960, 'height': 540}, 'desk'), ({'width': 844, 'height': 390}, 'phone')):
        pg = b.new_page(viewport=vp); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(500); pg.evaluate("localStorage.clear()")
        pg.evaluate(SETUP); pg.wait_for_timeout(1500)
        I = pg.evaluate("""() => { const q=s=>document.querySelectorAll(s); const sc=document.getElementById('wmScroll');
          const cur=document.querySelector('.wn.cur'); const r=cur&&cur.getBoundingClientRect(), s=sc.getBoundingClientRect();
          return {nodes:q('.wn').length, locked:q('.wn.lock').length, done:q('.wn.done').length, cur:q('.wn.cur').length, boss:q('.wn.boss').length, worlds:q('.wmw').length, lockedWorlds:q('.wmw.lock').length,
            curVisible:!!r&&r.top>=s.top-2&&r.bottom<=s.bottom+2, scrollTop:sc.scrollTop, hero:q('.wmhero').length, stars:q('.wn .stars i.on').length, hdr:document.getElementById('wmSt').textContent,
            bg:[...q('.wmbg')].filter(c=>{const d=c.getContext('2d').getImageData(0,0,200,112).data; let s=0; for(let i=0;i<d.length;i+=400)s+=d[i]+d[i+1]+d[i+2]; return s>200}).length } }""")
        print(f'  [{tag}]', json.dumps(I, ensure_ascii=False))
        ok(f'{tag}: 80 levels + the endless node, 16 world blocks', I['nodes'] == 81 and I['worlds'] == 16, I['nodes'])
        ok(f'{tag}: levels past progress are locked', I['locked'] == 81 - 23 and I['done'] == 22 and I['cur'] == 1, [I['locked'], I['done'], I['cur']])
        ok(f'{tag}: bosses every 10th level', I['boss'] == 8, I['boss'])
        ok(f'{tag}: unreached worlds are dimmed', I['lockedWorlds'] == 16 - 5, I['lockedWorlds'])
        ok(f'{tag}: the map opens on the current level', I['curVisible'] and I['scrollTop'] > 100, I['scrollTop'])
        ok(f'{tag}: hero marker on the current node, stars drawn', I['hero'] == 1 and I['stars'] > 20, [I['hero'], I['stars']])
        ok(f'{tag}: world backdrops painted', I['bg'] >= 8, I['bg'])
        if shots:
            os.makedirs(shots, exist_ok=True); pg.screenshot(path=os.path.join(shots, f'map_{tag}.png'))
            pg.evaluate("document.getElementById('wmScroll').scrollTop=0"); pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(shots, f'map_{tag}_top.png'))
            pg.evaluate("document.getElementById('wmScroll').scrollTop=99999"); pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(shots, f'map_{tag}_end.png'))
        if tag == 'desk':
            # locked node: clicking does nothing
            lv0 = pg.evaluate("TD.G.level")
            pg.evaluate("document.querySelector('.wn.lock').click()"); pg.wait_for_timeout(100)
            ok('desk: clicking a locked node does nothing', pg.evaluate("TD.WM.open") is True)
            # replay level 7
            pg.evaluate("document.getElementById('wmScroll').scrollTop=0")
            pg.evaluate("[...document.querySelectorAll('.wn')].find(b=>b.querySelector('.n').textContent==='7').click()"); pg.wait_for_timeout(300)
            st = pg.evaluate("({open:TD.WM.open, level:TD.G.level, state:TD.G.state, title:document.getElementById('title').classList.contains('hide'), best:TD.S.best, cp:TD.G.cpX})")
            ok('desk: tapping a cleared level starts it fresh', (not st['open']) and st['level'] == 7 and st['state'] == 'play' and st['title'] and st['best'] == 23 and st['cp'] is None, st)
            # keys ignored while the map is open (Enter must not start the game from the title)
            pg.evaluate("TD.G.state='title'; document.getElementById('title').classList.remove('hide'); document.getElementById('hud').classList.add('hide'); TD.openMap()")
            pg.keyboard.press('Enter'); pg.wait_for_timeout(120)
            ok('desk: keys ignored while the map is open', pg.evaluate("TD.G.state") == 'title')
            # shop and achievements open on top and refresh the map on return
            pg.evaluate("document.getElementById('wmShop').click()"); pg.wait_for_timeout(150)
            both = pg.evaluate("({shop:!document.getElementById('shop').classList.contains('hide'), map:TD.WM.open})")
            pg.evaluate("TD.closeShop()"); pg.wait_for_timeout(100)
            pg.evaluate("document.getElementById('wmAch').click()"); pg.wait_for_timeout(150)
            both2 = pg.evaluate("({ach:!document.getElementById('ach').classList.contains('hide')})")
            pg.evaluate("TD.closeAch()")
            ok('desk: shop + achievements stack over the map', both['shop'] and both['map'] and both2['ach'] and pg.evaluate("TD.WM.open"))
            # endless node after the last level
            pg.evaluate("TD.S.best=120; TD.wmRender()")
            ok('desk: endless node opens past level 80', pg.evaluate("document.querySelectorAll('.wn.lock').length") == 0)
            pg.evaluate("document.querySelector('.wn.inf').click()"); pg.wait_for_timeout(300)
            ok('desk: endless node starts the real progress level', pg.evaluate("TD.G.level") == 120, pg.evaluate("TD.G.level"))
        ok(f'{tag}: no page errors', not errs, errs[:3])
        pg.close()
    b.close()
print('RESULT:', 'ALL OK' if all(res) else 'FAILURES')
sys.exit(0 if all(res) else 1)
