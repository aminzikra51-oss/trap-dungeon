"""Stats + achievements + stars: data sanity, tier payout (once), event counters, sandbox levels, streaks, UI.
usage: python3 test/ach.py [--shots DIR]"""
import sys, json, os
from playwright.sync_api import sync_playwright
shots = sys.argv[sys.argv.index('--shots') + 1] if '--shots' in sys.argv else None
res = []
def ok(name, cond, info=''):
    res.append(bool(cond)); print(('  ok   ' if cond else '  FAIL ') + name + (f'  [{info}]' if info != '' else ''))

DATA = r"""() => { const T=window.TD, A=T.ACH, ids=A.map(a=>a.id);
  const bad=[]; for(const a of A){ if(a.T.length!==4||a.ti.length!==4)bad.push(a.id+':len'); for(let i=1;i<a.T.length;i++)if(!(a.T[i]>a.T[i-1]))bad.push(a.id+':order');
    for(const t of a.T)if(typeof a.ds(t)!=='string'||!a.ds(t))bad.push(a.id+':ds'); if(typeof a.v()!=='number'||!isFinite(a.v()))bad.push(a.id+':val') }
  const cs=T.museumCauses();
  return {n:A.length, uniq:new Set(ids).size, bad, museum:cs.length, causes:cs} }
"""
FLOW = r"""() => { const T=window.TD, S=T.S, G=T.G, R={};
  const fresh=()=>{ S.wallet=0; S.cc={}; S.cl={}; S.nd={}; S.cs={}; S.bd={}; S.own={falafel:1}; S.ow={}; S.ac={}; S.ti=''; S.best=1; S.deaths=0;
    S.st={d:0,dc:{},j:0,pt:0,c:0,ns:0,nm:0,bw:0,gr:0,fa:0,mk:{},sk:{}}; };
  const lvl=n=>{ G.lastLvl=-1; G.custom=null; T.startGame(n); G.bannerT=0; G.state='play' };
  const coinsOf=()=>T.L.ents.filter(e=>e.t==='coin'&&!e.bait);
  const grab=c=>{ T.P.x=c.x-10; T.P.y=c.y-14; T.P.vx=0;T.P.vy=0; c.got=0; T.update(1/60) };
  T.FLAGS.noBoss=true; fresh();
  // 1) tier payout happens once
  S.st.d=10; T.achCheck(); R.pay1=S.wallet; R.tier1=S.ac.die; T.achCheck(); T.achCheck(); R.pay1b=S.wallet;
  S.st.d=60; T.achCheck(); R.pay2=S.wallet; R.tier2=S.ac.die;               // jumps over two thresholds at once pays both missing tiers? (10->bronze already, 50->silver)
  S.st.d=5000; T.achCheck(); R.pay3=S.wallet; R.tier3=S.ac.die;
  S.st.d=0; T.achCheck(); R.payAfterDrop=S.wallet;                          // lowering a stat never takes anything away nor pays again
  // 2) multi-tier jump from nothing pays every tier
  fresh(); S.st.d=1000; T.achCheck(); R.allTiers=S.wallet; R.allTiersN=S.ac.die;
  // 3) die() counters
  fresh(); lvl(2); const w0=S.wallet; T.die('spike',null); R.dAfter1=S.st.d; R.dcSpike=S.st.dc.spike; R.fast=S.st.fa;
  T.retry(); G.state='play'; G.t=5; T.die('pit',null); R.dAfter2=S.st.d; R.fastAfter=S.st.fa; R.museum=T.museumCount();
  // custom maps do not count
  const c=T.cNew(); c.seq=[[0,1],[1,1]]; c.n=4; T.startCustom(c,'edit'); G.state='play'; const d0=S.st.d; T.die('spike',null); R.customDie=S.st.d-d0;
  // SIM (solver/replay) does not count
  lvl(2); T.sim(true); const d1=S.st.d, j1=S.st.j; T.die('spike',null); R.simDie=S.st.d-d1; T.sim(false);
  // 4) sandbox: levels beyond real progress pay nothing and do not advance progress
  fresh(); S.best=3; lvl(10); R.bestAfterJump=S.best; let cs=coinsOf(); grab(cs[0]); grab(cs[1]); T.econClear(); R.sandboxWallet=S.wallet; R.sandboxCl=Object.keys(S.cl).length;
  // legit level == best advances progress
  fresh(); S.best=3; lvl(3); G.lvDeaths=0; T.winLevel&&0; T.econClear(); R.legitCl=!!S.cl[3];
  // 5) stars: clear, no-death, all coins
  fresh(); S.best=99; lvl(4); G.lvDeaths=0; cs=coinsOf(); R.coinN=cs.length; T.econClear(); R.starsNoCoins=T.starsOf(4);     // cleared + no-death, coins missing
  lvl(4); cs=coinsOf(); for(const c of cs)grab(c); T.econClear(); R.starsAll=T.starsOf(4);
  fresh(); S.best=99; lvl(4); G.lvDeaths=3; cs=coinsOf(); for(const c of cs)grab(c); T.econClear(); R.starsDeaths=T.starsOf(4);   // cleared + coins, no no-death star
  // 6) streak: new no-death clears extend, a death resets
  fresh(); S.best=99; for(const n of [2,3,4]){ lvl(n); G.lvDeaths=0; T.econClear() } R.streak3=S.st.ns; R.nm3=S.st.nm;
  lvl(5); T.die('spike',null); R.streakAfterDeath=S.st.ns; R.nmKeeps=S.st.nm;
  lvl(2); G.lvDeaths=0; T.econClear(); R.replaySameLevel=S.st.ns;          // replaying an already-clean level neither extends nor resets the streak
  // 7) editor medals are unique per map
  fresh(); T.achMapCleared('HB1-aaa'); T.achMapCleared('HB1-aaa'); T.achMapCleared('HB1-bbb'); R.mk=Object.keys(S.st.mk).length; T.achMapShared('HB1-aaa'); T.achMapShared('HB1-aaa'); R.sk=Object.keys(S.st.sk).length;
  // 8) title + rank
  fresh(); R.rank0=T.rankName(); R.title0=T.titleText(); S.st.d=60; T.achCheck(); S.ti='die:1'; R.titleWear=T.titleText(); S.ti='die:3'; R.titleNotEarned=T.titleText(); S.ti='';
  R.medals=T.medalsTotal();
  return R }
"""
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 960, 'height': 540}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(500)
    pg.evaluate("localStorage.clear()")
    D = pg.evaluate(DATA); print('  data:', json.dumps({k: D[k] for k in ('n', 'uniq', 'museum')}))
    ok('achievement table is well-formed', D['n'] >= 16 and D['uniq'] == D['n'] and not D['bad'], D['bad'][:5])
    ok('museum covers 20+ death types', D['museum'] >= 20, D['museum'])
    R = pg.evaluate(FLOW); print('  flow:', json.dumps(R, ensure_ascii=False))
    ok('bronze pays 5 once, never twice', R['pay1'] == 5 and R['tier1'] == 1 and R['pay1b'] == 5, R['pay1'])
    ok('silver adds 12, then diamond adds the rest', R['pay2'] == 17 and R['tier2'] == 2 and R['pay3'] == 127 and R['tier3'] == 4, [R['pay2'], R['pay3']])
    ok('lowering a stat neither pays nor takes back', R['payAfterDrop'] == 127)
    ok('crossing several thresholds at once pays every tier', R['allTiers'] == 127 and R['allTiersN'] == 4, R['allTiers'])
    ok('die() counts deaths, causes, fast deaths', R['dAfter1'] == 1 and R['dcSpike'] == 1 and R['fast'] == 1 and R['dAfter2'] == 2 and R['fastAfter'] == 1 and R['museum'] == 2, [R['dAfter1'], R['fast'], R['fastAfter'], R['museum']])
    ok('custom maps and simulations are not counted', R['customDie'] == 0 and R['simDie'] == 0, [R['customDie'], R['simDie']])
    ok('jumping to a far level does not move real progress', R['bestAfterJump'] == 3, R['bestAfterJump'])
    ok('sandbox levels pay nothing and record nothing', R['sandboxWallet'] == 0 and R['sandboxCl'] == 0, [R['sandboxWallet'], R['sandboxCl']])
    ok('a level within progress counts', R['legitCl'])
    ok('stars: clear + no-death (no coins) = 2', R['coinN'] > 0 and R['starsNoCoins'] == 2, R['starsNoCoins'])
    ok('stars: all coins banked = 3', R['starsAll'] == 3, R['starsAll'])
    ok('stars: with deaths but all coins = 2', R['starsDeaths'] == 2, R['starsDeaths'])
    ok('streak grows on new clean clears, resets on death, best is kept', R['streak3'] == 3 and R['nm3'] == 3 and R['streakAfterDeath'] == 0 and R['nmKeeps'] == 3, [R['streak3'], R['streakAfterDeath'], R['nmKeeps']])
    ok('replaying a clean level does not touch the streak', R['replaySameLevel'] == 0, R['replaySameLevel'])
    ok('editor medals count unique maps', R['mk'] == 2 and R['sk'] == 1, [R['mk'], R['sk']])
    ok('title: default rank, wear an earned one, unearned ignored', R['rank0'] and R['titleWear'] != R['rank0'] and R['titleNotEarned'] == R['rank0'], [R['rank0'], R['titleWear'], R['titleNotEarned']])
    # UI
    pg.evaluate("localStorage.clear(); const T=TD; T.S.st.d=60; T.S.ac={}; T.achCheck(); T.openAch()"); pg.wait_for_timeout(300)
    ui = pg.evaluate("() => ({rows:document.querySelectorAll('#acList .acr:not(.dyr)').length, mus:document.querySelectorAll('#acList .mc').length, shown:!document.getElementById('ach').classList.contains('hide'), sum:document.getElementById('acSum').textContent.length, toast:document.getElementById('achT').textContent.length, open:TD.ACHUI.open})")
    ok('achievement screen lists every family + museum', ui['shown'] and ui['rows'] == D['n'] and ui['mus'] == D['museum'] and ui['sum'] > 10, ui)
    ok('unlock toast was shown', ui['toast'] > 5)
    if shots:
        os.makedirs(shots, exist_ok=True); pg.screenshot(path=os.path.join(shots, 'ach.png'))
    pg.keyboard.press('ArrowRight')
    pg.evaluate("TD.closeAch()")
    ok('closes cleanly', pg.evaluate("document.getElementById('ach').classList.contains('hide')&&!TD.ACHUI.open"))
    ok('no page errors', not errs, errs[:3])
    b.close()
print('RESULT:', 'ALL OK' if all(res) else 'FAILURES')
sys.exit(0 if all(res) else 1)
