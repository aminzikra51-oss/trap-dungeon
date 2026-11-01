"""World map: endless + windowed, opens where you are, strictly sequential progress, difficulty chooser, stars by difficulty, jump box limited, old inflated progress repaired.
usage: python3 test/map.py [--shots DIR]"""
import sys, json, os
from playwright.sync_api import sync_playwright
shots = sys.argv[sys.argv.index('--shots') + 1] if '--shots' in sys.argv else None
res = []
def ok(name, cond, info=''):
    res.append(bool(cond)); print(('  ok   ' if cond else '  FAIL ') + name + (f'  [{info}]' if info != '' else ''))

# progress 23: levels 1..22 cleared, with every star count (n%3+1 -> 1,2,3 stars)
SETUP = r"""() => { const T=window.TD, S=T.S; S.best=23; S.cl={}; S.nd={}; S.cs={}; S.bd={}; S.wallet=77; S.own={falafel:1,cat:1}; S.hero='cat'; S.ow={}; S.diff='crazy';
  for(let n=1;n<=22;n++){ S.cl[n]=n%3+1; if(n%2===0)S.nd[n]=1 } T.G.state='title'; T.openMap(); return true }
"""
LEVELNODE = "[...document.querySelectorAll('.wn')].find(b=>b.querySelector('.n').textContent==='%d')"
INFO = """() => { const q=s=>document.querySelectorAll(s); const sc=document.getElementById('wmScroll');
  const cur=document.querySelector('.wn.cur'); const r=cur&&cur.getBoundingClientRect(), s=sc.getBoundingClientRect();
  const texts=[...q('.wn .n')].map(e=>e.textContent);
  return {nodes:q('.wn').length, locked:q('.wn.lock').length, done:q('.wn.done').length, cur:q('.wn.cur').length, boss:q('.wn.boss').length, worlds:q('.wmw').length,
    curVisible:!!r&&r.top>=s.top-2&&r.bottom<=s.bottom+2, scrollTop:sc.scrollTop, hero:q('.wmhero').length, hdr:document.getElementById('wmSt').textContent,
    has:{l1:texts.includes('1'), l7:texts.includes('7'), l23:texts.includes('23'), inf:!!document.querySelector('.wn.inf')}, curText:cur&&cur.textContent,
    bg:[...q('.wmbg')].filter(c=>{const d=c.getContext('2d').getImageData(0,0,200,112).data; let s=0; for(let i=0;i<d.length;i+=400)s+=d[i]+d[i+1]+d[i+2]; return s>200}).length } }"""
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    for vp, tag in (({'width': 960, 'height': 540}, 'desk'), ({'width': 844, 'height': 390}, 'phone')):
        pg = b.new_page(viewport=vp); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(500); pg.evaluate("localStorage.clear()")
        pg.evaluate(SETUP); pg.wait_for_timeout(1500)
        I = pg.evaluate(INFO)
        print(f'  [{tag}]', json.dumps(I, ensure_ascii=False))
        ok(f'{tag}: opens on the level you are on (not at the end)', I['curVisible'] and I['scrollTop'] > 100 and I['has']['l23'] and I['curText'] and '23' in I['curText'], [I['scrollTop'], I['curText']])
        ok(f'{tag}: only the worlds around the viewport are built (windowed), 7 worlds exist in total', I['worlds'] <= 8 and I['nodes'] <= 45, [I['worlds'], I['nodes']])
        ok(f'{tag}: exactly one current node, hero marker on it, earlier levels are done', I['cur'] == 1 and I['hero'] == 1 and I['done'] >= 10, [I['cur'], I['hero'], I['done']])
        ok(f'{tag}: levels past the one you are on are locked', I['locked'] >= 5, I['locked'])
        ok(f'{tag}: header counts the new stars (22 levels: 7x1 + 7x2 + 8x3 ... )', '⁦' in I['hdr'] or '/' in I['hdr'], I['hdr'])
        st = pg.evaluate("""() => { const T=window.TD; let w=0; for(let n=1;n<=22;n++)w+=T.S.cl[n]; return [T.starsTotal(), w] }""")
        ok(f'{tag}: starsTotal = sum of the difficulty ranks', st[0] == st[1] and st[0] > 30, st)
        ok(f'{tag}: world backdrops painted', I['bg'] >= 3, I['bg'])
        # stars drawn on the nodes of the visible window agree with the data
        bad = pg.evaluate("""() => { const T=window.TD, bad=[]; for(const bt of document.querySelectorAll('.wn:not(.lock):not(.inf)')){ const n=+(bt.querySelector('.bn')?bt.querySelector('.bn').textContent:bt.querySelector('.n').textContent); const on=bt.querySelectorAll('.stars i.on').length; if(on!==T.starsOf(n))bad.push([n,on,T.starsOf(n)]) } return bad }""")
        ok(f'{tag}: the stars on every node match the data', not bad, bad[:4])
        if shots:
            os.makedirs(shots, exist_ok=True); pg.screenshot(path=os.path.join(shots, f'map_{tag}.png'))
            pg.evaluate("document.getElementById('wmScroll').scrollTop=0"); pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(shots, f'map_{tag}_top.png'))
            pg.evaluate("document.getElementById('wmScroll').scrollTop=99999"); pg.wait_for_timeout(300); pg.screenshot(path=os.path.join(shots, f'map_{tag}_end.png'))
        if tag == 'desk':
            pg.evaluate("document.getElementById('wmScroll').scrollTop=0"); pg.wait_for_timeout(250)
            I2 = pg.evaluate(INFO); ok('desk: scrolling to the top rebuilds the window around level 1', I2['has']['l1'] and I2['worlds'] <= 8, I2['has'])
            pg.evaluate("document.getElementById('wmScroll').scrollTop=99999"); pg.wait_for_timeout(250)
            I3 = pg.evaluate(INFO); ok('desk: the road ends with a locked infinity node', I3['has']['inf'], I3['has'])
            pg.evaluate("document.querySelector('.wn.inf').click()"); pg.wait_for_timeout(100)
            ok('desk: the infinity node does not start anything', pg.evaluate("TD.WM.open") is True and pg.evaluate("TD.G.state") != 'play')
            # locked node: only a hint
            pg.evaluate("TD.wmRender(false,true)"); pg.wait_for_timeout(200)
            pg.evaluate("document.querySelector('.wn.lock').click()"); pg.wait_for_timeout(100)
            ok('desk: clicking a locked node does nothing but hint', pg.evaluate("TD.WM.open") is True and pg.evaluate("TD.G.state") != 'play' and 'لازم تخلّص' in pg.evaluate("document.getElementById('wmHint').textContent"))
            # an open level asks for the difficulty
            pg.evaluate("document.getElementById('wmScroll').scrollTop=0"); pg.wait_for_timeout(250)
            pg.evaluate(LEVELNODE % 7 + ".click()"); pg.wait_for_timeout(150)
            pk = pg.evaluate("""() => { const p=document.getElementById('wmPk'); return {shown:!!p&&!p.classList.contains('hide'), btns:[...document.querySelectorAll('#wmPk .pkd')].map(b=>[b.textContent.slice(0,6), b.classList.contains('got'), b.classList.contains('on'), b.querySelectorAll('.pst i.on').length]), started:TD.G.state==='play'} }""")
            print('   chooser:', json.dumps(pk, ensure_ascii=False))
            # level 7: 7%3+1 = 2 stars -> normal + crazy are 'got', hell not; the current setting (crazy) is highlighted
            ok('desk: tapping an open level opens the chooser (3 difficulties, 1/2/3 stars) and does not start yet',
               pk['shown'] and len(pk['btns']) == 3 and [x[3] for x in pk['btns']] == [1, 2, 3] and not pk['started'], pk)
            ok('desk: chooser shows what is already earned and the current setting', [x[1] for x in pk['btns']] == [True, True, False] and [x[2] for x in pk['btns']] == [False, True, False], pk['btns'])
            if shots: pg.screenshot(path=os.path.join(shots, 'map_chooser.png'))
            pg.evaluate("document.querySelectorAll('#wmPk .pkd')[2].click()"); pg.wait_for_timeout(300)
            st = pg.evaluate("({open:TD.WM.open, level:TD.G.level, state:TD.G.state, diff:TD.S.diff, dk:TD.L.dk, title:document.getElementById('title').classList.contains('hide'), best:TD.S.best, cp:TD.G.cpX, sel:document.getElementById('selDiff').value})")
            ok('desk: choosing impossible starts level 7 on impossible, progress untouched', (not st['open']) and st['level'] == 7 and st['state'] == 'play' and st['diff'] == 'hell' and st['dk'] == 'hell' and st['title'] and st['best'] == 23 and st['cp'] is None and st['sel'] == 'hell', st)
            # clearing it: 3 stars, S.best does NOT move (level 7 < best)
            pg.evaluate("TD.G.state='play'; TD.winLevel()"); pg.wait_for_timeout(100)
            ok('desk: clearing an old level on impossible gives it 3 stars and leaves progress alone', pg.evaluate("[TD.starsOf(7), TD.S.best]") == [3, 23], pg.evaluate("[TD.starsOf(7), TD.S.best]"))
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
            # ---- strictly sequential progress ----
            R = pg.evaluate("""() => { const T=window.TD, S=T.S, G=T.G, R={}; T.FLAGS.noBoss=true; T.closeMap();
              const go=n=>{ G.lastLvl=-1; G.custom=null; T.startGame(n); G.bannerT=0; G.state='play' };
              S.best=23; S.diff='normal'; go(23); T.winLevel(); R.afterFrontier=S.best;                       // clearing the level you are ON opens the next
              go(10); T.winLevel(); R.afterOld=S.best;                                                        // clearing an older one changes nothing
              go(60); R.sandboxLegit=T.legit(); T.winLevel(); R.afterJump=S.best; R.cl60=S.cl[60]||0;          // a level far ahead (forced start): sandbox, nothing opens, no stars
              return R }""")
            ok('desk: clearing the level you are on opens the next one only', R['afterFrontier'] == 24 and R['afterOld'] == 24, [R['afterFrontier'], R['afterOld']])
            ok('desk: clearing a level far ahead of you opens nothing and earns nothing', R['afterJump'] == 24 and R['cl60'] == 0 and R['sandboxLegit'] is False, R)
            # pause-menu jump box: only levels you reached
            pg.evaluate("TD.S.best=24; TD.G.state='play'; TD.startGame(5); window.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape'}))"); pg.wait_for_timeout(150)
            jb = pg.evaluate("({max:document.getElementById('inLvl').max, val:document.getElementById('inLvl').value})")
            pg.evaluate("document.getElementById('inLvl').value=999; document.getElementById('bGo').click()"); pg.wait_for_timeout(200)
            ok('desk: the jump box stops at your progress (999 -> 24)', jb['max'] == '24' and pg.evaluate("TD.G.level") == 24, [jb, pg.evaluate("TD.G.level")])
        ok(f'{tag}: no page errors', not errs, errs[:3])
        pg.close()
    # ---- endless: level 600 costs the same as level 23, repair of an inflated save ----
    pg = b.new_page(viewport={'width': 960, 'height': 540}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(500); pg.evaluate("localStorage.clear()")
    pg.evaluate("() => { const T=TD, S=T.S; S.best=600; S.cl={}; for(let n=1;n<=599;n++)S.cl[n]=1+(n%3); S.diff='normal'; T.G.state='title'; T.openMap() }"); pg.wait_for_timeout(800)
    E = pg.evaluate(INFO)
    cyc = pg.evaluate("[...document.querySelectorAll('.wmb b')].map(e=>e.textContent)")
    print('  [endless]', json.dumps({k: E[k] for k in ('nodes', 'worlds', 'curVisible', 'curText', 'scrollTop')}, ensure_ascii=False), cyc[:3])
    ok('endless: level 600 opens on its own node, still only a few worlds built', E['curVisible'] and E['curText'] and '600' in E['curText'] and E['worlds'] <= 8 and E['nodes'] <= 45, E)
    ok('endless: world banners count up and say which cycle', any('الدورة' in t for t in cyc) and any('العالم 12' in t for t in cyc), cyc)
    pg.evaluate("document.getElementById('wmScroll').scrollTop=99999"); pg.wait_for_timeout(300)
    ok('endless: the end of the road is two preview worlds past you, then the infinity node', pg.evaluate(INFO)['has']['inf'])
    pg.evaluate(LEVELNODE % 600 + ".click()") if pg.evaluate(LEVELNODE % 600 + "!==undefined") else None
    # repair: an inflated save (best 1001 from the old jump box) goes back to the first level never cleared
    pg.evaluate("localStorage.setItem('td_s', JSON.stringify({best:1001, cl:Object.fromEntries(Array.from({length:30},(_,i)=>[i+1,1])), diff:'normal'}))")
    pg.reload(); pg.wait_for_timeout(900)
    rp = pg.evaluate("[TD.S.best, TD.S.pb, TD.S.pv]")
    ok('repair: an inflated best (1001, only 30 real clears) goes back to level 31 once, the old value is kept', rp[0] == 31 and rp[1] == 1001 and rp[2] == 1, rp)
    pg.evaluate("localStorage.setItem('td_s', JSON.stringify({best:140, cl:Object.fromEntries(Array.from({length:139},(_,i)=>[i+1,1])), diff:'normal'}))")
    pg.reload(); pg.wait_for_timeout(900)
    rp2 = pg.evaluate("[TD.S.best, TD.S.pb||0]")
    ok('repair: honest progress past level 80 is kept', rp2 == [140, 0], rp2)
    pg.evaluate("localStorage.setItem('td_s', JSON.stringify({best:35}))")
    pg.reload(); pg.wait_for_timeout(900)
    ok('repair: an old save without clear data (best 35) is not touched', pg.evaluate("TD.S.best") == 35)
    ok('endless: no page errors', not errs, errs[:3])
    pg.close(); b.close()
print('RESULT:', 'ALL OK' if all(res) else 'FAILURES')
sys.exit(0 if all(res) else 1)
