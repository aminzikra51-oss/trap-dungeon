"""Economy checks: coin supply, deterministic seeding, banking rules (checkpoint/clear/death), pay-once, bonuses, custom maps pay nothing, shop purchases, locks.
usage: python3 test/wallet.py [--shots DIR]"""
import sys, base64, os, json
from playwright.sync_api import sync_playwright
shots = sys.argv[sys.argv.index('--shots') + 1] if '--shots' in sys.argv else None
res = []
def ok(name, cond, info=''):
    res.append(bool(cond)); print(('  ok   ' if cond else '  FAIL ') + name + (f'  [{info}]' if info != '' else ''))

SUPPLY = r"""() => { const T=window.TD, out=[]; T.FLAGS.noBoss=false;
  for(let n=1;n<=80;n++){ T.G.lastLvl=-1; T.G.custom=null; T.loadLevel(n); const L=T.L, cs=L.ents.filter(e=>e.t==='coin'&&!e.bait);
    const keys=new Set(cs.map(T.coinKey)); let inWall=0, overPit=0;
    for(const c of cs){ const tx=Math.floor(c.x/T.TS); if(L.blocks[tx+','+Math.floor(c.y/T.TS)])inWall++; if(c.y>T.GY-30&&L.ground[tx]<0)overPit++ }
    out.push({n,coins:cs.length,uniq:keys.size,inWall,overPit,boss:!!L.boss,sig:JSON.stringify(cs.map(c=>[c.x,c.y]))}) }
  // determinism: second build must give the same rows
  const again=[]; for(let n=1;n<=80;n++){ T.G.lastLvl=-1; T.loadLevel(n); again.push(JSON.stringify(T.L.ents.filter(e=>e.t==='coin'&&!e.bait).map(c=>[c.x,c.y]))) }
  return {out, same: out.every((o,i)=>o.sig===again[i])} }
"""
FLOW = r"""() => { const T=window.TD, S=T.S, G=T.G, R={}; const K=T.K;
  S.wallet=0; S.cc={}; S.cl={}; S.nd={}; S.own={falafel:1,cat:1}; S.hero='cat'; S.hs={}; S.hx={};   // cat: no coin magnet, so teleporting onto a coin picks exactly that coin
  S.ow={}; S.bgPick=-1; S.best=99; T.FLAGS.noBoss=true; for(const a of T.ACH)S.ac[a.id]=a.T.length;        // medals are tested in test/ach.py: here they must not pay into the wallet
  function level(n){ G.lastLvl=-1; G.custom=null; T.startGame(n); G.bannerT=0; G.state='play' }
  const coinsOf=()=>T.L.ents.filter(e=>e.t==='coin'&&!e.bait);
  const grab=(c)=>{ T.P.x=c.x-10; T.P.y=c.y-14; T.P.vx=0;T.P.vy=0; c.got=0; T.update(1/60) };
  let LV=2; for(let n=2;n<=30;n++){ G.lastLvl=-1; G.custom=null; T.loadLevel(n); if(T.L.ents.some(e=>e.t==='cp'&&!e.fake)&&!T.L.boss){LV=n;break} } R.lv=LV;
  level(LV); let cs=coinsOf(); R.n2=cs.length;
  grab(cs[0]); grab(cs[1]); grab(cs[2]); R.pend=G.pend.length; R.walletAfterPick=S.wallet;
  T.die('spike',null); R.walletAfterDie=S.wallet; R.pendAfterDie=G.pend.length;
  T.retry(); G.state='play'; cs=coinsOf(); grab(cs[0]); grab(cs[1]); const gotPend=G.pend.length;
  const cp=T.L.ents.find(e=>e.t==='cp'&&!e.fake); R.hasCp=!!cp;
  if(cp){ T.P.x=cp.x+8; T.P.y=T.GY-T.PH; T.P.onGround=true; T.update(1/60); T.update(1/60) }
  R.gotPend=gotPend; R.walletAfterCp=S.wallet; R.pendAfterCp=G.pend.length;
  // replay: same coins again must not pay twice
  const before=S.wallet; T.retry(); G.state='play'; cs=coinsOf(); grab(cs[0]); grab(cs[1]); T.econCheckpoint(); R.replayGain=S.wallet-before;
  // clear: first time pays bonus, no-death bonus; second time nothing
  const w0=S.wallet; G.lvDeaths=0; G.state='play'; T.econClear(); R.clear1=S.wallet-w0;
  const w1=S.wallet; G.lvDeaths=0; T.econClear(); R.clear2=S.wallet-w1;
  // with a death the no-death bonus is not paid (new level)
  level(3); G.lvDeaths=2; const w2=S.wallet; T.econClear(); R.clearDeath=S.wallet-w2;
  // custom map pays nothing
  const c=T.cNew(); c.seq=[[0,1],[1,1]]; c.n=4; T.startCustom(c,'edit'); G.state='play'; const w3=S.wallet; const cc=T.L.ents.filter(e=>e.t==='coin'&&!e.bait); R.customCoins=cc.length; if(cc.length){grab(cc[0])} T.econBank(); T.econClear(); R.customGain=S.wallet-w3;
  // shop
  S.best=1; S.wallet=10; R.buyPoor=T.econBuyHero('uncle'); R.walletPoor=S.wallet; S.wallet=500; R.buyOk=T.econBuyHero('uncle'); R.walletOk=S.wallet; R.owned=T.heroOwned('uncle'); R.buyAgain=T.econBuyHero('uncle');
  R.world5open=T.worldOpen(5); S.wallet=500; R.worldBuy=T.econBuyWorld(5); R.world5after=T.worldOpen(5); R.worldWallet=S.wallet;
  S.best=1; S.ow={}; R.worldPrice=[...Array(16).keys()].map(i=>T.worldPrice(i));
  S.bgPick=5; S.ow[5]=1; G.lastLvl=-1; T.loadLevel(2); R.themePick=T.L.theme; S.bgPick=-1; G.lastLvl=-1; T.loadLevel(2); R.themeAuto=T.L.theme; S.bgPick=9; S.ow={}; G.lastLvl=-1; T.loadLevel(2); R.themeLocked=T.L.theme;
  return R }
"""
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 960, 'height': 540}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(500)
    pg.evaluate("localStorage.clear()")
    s = pg.evaluate(SUPPLY); o = s['out']
    reg = [x for x in o if not x['boss']]; tot = sum(x['coins'] for x in reg)
    ok('coin supply levels 1-80 (non-boss)', len(reg) > 0, f"total {tot}, avg {tot/len(reg):.1f}, min {min(x['coins'] for x in reg)}, max {max(x['coins'] for x in reg)}")
    ok('every normal level has at least 4 coins', all(x['coins'] >= 4 for x in reg), [x['n'] for x in reg if x['coins'] < 4][:8])
    ok('boss levels have no coins', all(x['coins'] == 0 for x in o if x['boss']))
    ok('coin keys are unique per level', all(x['uniq'] == x['coins'] for x in o), [x['n'] for x in o if x['uniq'] != x['coins']][:5])
    ok('no coin inside a wall block', all(x['inWall'] == 0 for x in o), [x['n'] for x in o if x['inWall']][:5])
    ok('no ground-height coin over a pit', all(x['overPit'] == 0 for x in o), [x['n'] for x in o if x['overPit']][:5])
    ok('coin rows are identical on every build (deterministic)', s['same'])
    R = pg.evaluate(FLOW); print('  flow:', json.dumps(R, ensure_ascii=False))
    ok('picked coins stay pending (wallet unchanged)', R['pend'] == 3 and R['walletAfterPick'] == 0, f"pend {R['pend']}")
    ok('death loses the pending coins', R['walletAfterDie'] == 0 and R['pendAfterDie'] == 0)
    ok('checkpoint banks what you hold', R['hasCp'] and R['walletAfterCp'] == R['gotPend'] and R['pendAfterCp'] == 0, f"{R['gotPend']} -> {R['walletAfterCp']}")
    ok('the same coins pay only once per level', R['replayGain'] == 0, R['replayGain'])
    ok('first clear pays 10 + 5 no-death bonus', R['clear1'] == 15, R['clear1'])
    ok('second clear pays nothing', R['clear2'] == 0, R['clear2'])
    ok('clear after deaths pays the 10 only', R['clearDeath'] == 10, R['clearDeath'])
    ok('custom maps never pay', R['customGain'] == 0, R['customGain'])
    ok('hero: poor refused, rich buys, no double charge', R['buyPoor'] == 'poor' and R['walletPoor'] == 10 and R['buyOk'] == 'ok' and R['walletOk'] == 440 and R['owned'] and R['buyAgain'] == 'owned')
    ok('world: locked -> buy -> open', (not R['world5open']) and R['worldBuy'] == 'ok' and R['world5after'] and R['worldWallet'] == 500 - R['worldPrice'][5], R['worldPrice'])
    ok('chosen owned world replaces the level theme', R['themePick'] == 5 and R['themeAuto'] != 5, f"pick {R['themePick']} auto {R['themeAuto']}")
    ok('a locked world cannot be forced', R['themeLocked'] != 9, R['themeLocked'])
    # UI: title shop button, tabs, editor theme locks
    pg.evaluate("localStorage.clear(); const T=TD; T.S.wallet=130; T.S.own={falafel:1}; T.S.ow={}; T.S.best=1; T.hud(); T.openShop('h')")
    ok('shop opens', not pg.evaluate("document.getElementById('shop').classList.contains('hide')"))
    ok('keys are ignored while the shop is open', pg.evaluate("(()=>{const T=TD;T.G.state='title';dispatchEvent(new KeyboardEvent('keydown',{code:'Enter'}));return T.G.state})()") == 'title')
    if shots:
        os.makedirs(shots, exist_ok=True)
        pg.screenshot(path=f'{shots}/shop_h.png'); pg.evaluate("TD.openShop('w')"); pg.wait_for_timeout(1500); pg.screenshot(path=f'{shots}/shop_w.png')
    ok('hero cards = 8, world cards = 17 (16 + auto)', pg.evaluate("(()=>{TD.openShop('h');const h=document.querySelectorAll('#shGrid .shc').length;TD.openShop('w');const w=document.querySelectorAll('#shGrid .shc').length;return h+','+w})()") == '8,17')
    pg.evaluate("TD.closeShop()")
    pg.evaluate("TD.S.best=1;TD.S.ow={};TD.ED.c=TD.cNew();TD.edOpen(null,'')")
    ls = pg.evaluate("[...document.getElementById('edTh').options].map(o=>[o.disabled,o.text.startsWith('🔒')])")
    ok('editor: only the first world is open at level 1', ls[0] == [False, False] and all(x == [True, True] for x in ls[1:]), ls[:3])
    ok('no page errors', not errs, errs[:3]); b.close()
print('RESULT:', 'ALL OK' if all(res) else 'FAILURES'); sys.exit(0 if all(res) else 1)
