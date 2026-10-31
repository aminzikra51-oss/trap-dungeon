"""Hero trials: every trial is cleared by a scripted bot with its own hero and (where the gate is physical) NOT by the others.
The bots press the same inputs for every hero: only the hero's ability differs. usage: python3 test/trials.py [--matrix]"""
import sys, json
from playwright.sync_api import sync_playwright
res = []
def ok(name, cond, info=''):
    res.append(bool(cond)); print(('  ok   ' if cond else '  FAIL ') + name + (f'  [{info}]' if info != '' else ''))

BOT = r"""
window.RUNT = (k, hero, stage, maxF) => {
  const T = window.TD, S = T.S, G = T.G, K = T.K, PW = T.PW, PH = T.PH, GY = T.GY, GR = 11, TS = 32;
  S.best = 99; S.own[hero] = 1; S.hero = hero; S.hs = {}; if (stage) S.hs[hero] = stage; S.hx = {}; S.hq = {}; S.tr = {}; S.trn = {}; T.FLAGS.noBoss = true;
  G.cpX = null; G.lastLvl = -9; T.startGame(1001 + k); G.bannerT = 0; G.state = 'play';
  const reset = () => { K.l = false; K.r = true; K.j = false; K.jp = false; K.a = false; K.ap = false };
  const climber = (walls) => { let i = 0, ph = 0; return () => { const p = T.P, w = walls[i]; window.__ph = [i, ph]; if (!w) return;
      const face = w.tx * TS - PW, topY = GY - w.h * TS;
      if (ph === 0) { if (p.onGround && p.x >= face - 2) { K.jp = true; K.j = true; ph = 1 } }
      else if (ph === 1) { K.j = true; if (!p.onGround && p.vy > -40 && !p.dj) { K.jp = true; ph = 2 } }
      else if (ph === 2) { K.j = true; if (p.onGround) { if (p.y + PH < GY - 5) ph = 3; else if (p.x > (w.tx + (w.t || 3)) * TS) ph = 4 } }
      else if (ph === 3) { if (p.onGround && p.y + PH > GY - 2) ph = 4 }
      else if (ph === 4) { if (w.spk != null) { if (p.onGround && p.x >= w.spk * TS - 60) { K.jp = true; K.j = true; ph = 5 } } else { i++; ph = 0 } }
      else if (ph === 5) { K.j = true; if (p.onGround) { i++; ph = 0 } } } };
  const gapper = (gaps) => { let i = 0, ph = 0; return () => { const p = T.P, g = gaps[i]; if (!g) return;
      if (ph === 0) { if (p.onGround && p.x >= g.x0 * TS - PW - 4) { K.jp = true; K.j = true; ph = 1 } }
      else if (ph === 1) { K.j = true; if (!p.onGround && p.vy > -30 && !p.dj) { K.jp = true; ph = 2 } }
      else if (ph === 2) { K.j = true; if (p.onGround && p.x > g.x1 * TS) { i++; ph = 0 } } } };
  const smasher = () => { let hop = 0; return () => { const p = T.P, L = T.L; const tx = Math.floor((p.x + PW + 26) / TS);
      if (p.onGround && L.blocks[tx + ',' + (GR - 1)]) { K.a = true; K.ap = true }
      else if (hop === 0 && p.onGround && p.x >= 32 * TS - 62 && p.x < 32 * TS - 20 && !L.blocks[Math.floor((p.x + PW + 8) / TS) + ',' + (GR - 1)]) { K.jp = true; K.j = true; hop = 1 }
      else if (hop === 1) { K.j = true; if (p.onGround) hop = 2 } } };
  const spooner = () => () => { const p = T.P, L = T.L; for (const e of L.ents) if (e.t === 'walk' && !e.dead && e.x > p.x && e.x - p.x < 66) { K.a = true; K.ap = true; break } };
  const hopper = () => { const sp = [16, 22, 29, 36, 43, 49]; let i = 0, air = false; return () => { const p = T.P; if (air) { K.j = true; if (p.onGround) { air = false; i++ } return }
      if (i < sp.length && p.onGround && p.x + PW / 2 >= sp[i] * TS - 60) { K.jp = true; K.j = true; air = true } } };
  const plan = [
    () => climber([{ tx: 14, h: 5, spk: 22 }, { tx: 28, h: 5, spk: 36 }, { tx: 42, h: 5, spk: 50 }]),                                  // cat
    () => gapper([{ x0: 18, x1: 27 }, { x0: 38, x1: 47 }]),                                                                          // chicken
    () => () => {},                                                                                                                 // robot (electric tunnel): just run
    smasher, spooner, () => () => {},                                                                                                // donkey, grandma, uncle: just run
    () => climber([{ tx: 8, h: 3, t: 2 }, { tx: 12, h: 4, t: 2 }, { tx: 16, h: 3, t: 2 }, { tx: 20, h: 4, t: 2 }, { tx: 24, h: 3, t: 2 }]),                           // falafel
    hopper];                                                                                                                         // mushroom
  const drive = plan[k]();
  let f = 0, maxx = 0;
  window.__tr = []; for (; f < (maxF || 3600); f++) { reset(); drive(); if (maxF && f % 4 === 0 && f > 60) window.__tr.push([f, Math.round(T.P.x), Math.round(T.P.y), Math.round(T.P.vy), T.P.onGround, T.P.dj, (window.__ph||[]).join('/')]); if (T.G.state !== 'play') break; T.update(1 / 60); K.jp = false; K.ap = false; maxx = Math.max(maxx, T.P.x); if (T.G.state === 'win') break; if (T.G.state === 'dead') break }
  return { k, hero, state: T.G.state, cause: T.G.cause, frames: f, x: Math.round(T.P.x / TS * 10) / 10, maxx: Math.round(maxx / TS * 10) / 10, coins: T.trialCoins() };
};
"""
IDS = ['cat', 'chicken', 'robot', 'donkey', 'grandma', 'uncle', 'falafel', 'mushroom']
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 960, 'height': 540}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(600); pg.evaluate("localStorage.clear()"); pg.evaluate("() => {" + BOT + "; return 1}")
    M = {}
    for k, owner in enumerate(IDS):
        for h in IDS:
            r = pg.evaluate(f"RUNT({k},'{h}',0)"); M[(owner, h)] = r
    print('  matrix (rows = trial, cols = hero)  W=won  .=stuck/dead  [x tiles reached]')
    print('  ' + ' ' * 10 + ''.join(f'{h[:7]:>9}' for h in IDS))
    for owner in IDS:
        print('  ' + f'{owner:<10}' + ''.join(f"{('W' if M[(owner,h)]['state']=='win' else '.')+str(int(M[(owner,h)]['maxx'])):>9}" for h in IDS))
    for owner in IDS:
        r = M[(owner, owner)]; ok(f'{owner}: the trial hero clears his own trial', r['state'] == 'win', r)
    # physical gates: these heroes must NOT clear (known cross-overs are listed in the matrix above and tested separately)
    NOT = {'cat': ['falafel', 'uncle', 'grandma', 'donkey', 'chicken', 'mushroom'], 'chicken': ['cat', 'falafel', 'uncle', 'grandma', 'donkey', 'mushroom'],
           'robot': ['cat', 'chicken', 'falafel', 'uncle', 'grandma', 'donkey', 'mushroom'], 'donkey': ['cat', 'chicken', 'robot', 'falafel', 'uncle', 'grandma', 'mushroom'],
           'grandma': ['cat', 'chicken', 'robot', 'falafel', 'uncle', 'mushroom'], 'uncle': ['cat', 'chicken', 'robot', 'falafel', 'donkey', 'grandma', 'mushroom'],
           'falafel': ['cat', 'chicken', 'robot', 'uncle', 'grandma', 'donkey', 'mushroom']}
    for owner, others in NOT.items():
        bad = [h for h in others if M[(owner, h)]['state'] == 'win']
        ok(f'{owner}: nobody else without the ability gets through ({len(others)} heroes tried)', not bad, bad)

    # --- the soft gate: a mushroom WITHOUT any knowledge of the hidden spikes (just runs) dies
    blind = pg.evaluate("""() => { const T=TD,K=T.K,S=T.S,G=T.G; S.best=99; S.own.mushroom=1; S.hero='mushroom'; S.hs={}; G.cpX=null; G.lastLvl=-9; T.startGame(1008); G.bannerT=0; G.state='play';
        for(let f=0;f<1500;f++){ K.l=false;K.r=true;K.j=false;K.jp=false; T.update(1/60); if(T.G.state!=='play')break } return {st:T.G.state,cause:T.G.cause,x:Math.round(T.P.x/32)} }""")
    ok('mushroom trial: running blind into the hidden spikes kills', blind['st'] == 'dead' and blind['cause'] == 'spike', blind)
    # --- rewards: pseudo level, wallet, xp, no campaign progress
    R = pg.evaluate("""() => { const T=TD,K=T.K,S=T.S,G=T.G; S.best=12; S.wallet=0; S.cl={}; S.nd={}; S.cs={}; S.tr={}; S.trn={}; S.hx={}; S.hc={}; S.hs={}; S.own={cat:1}; S.hero='cat'; S.st.c=0;
        G.cpX=null; G.lastLvl=-9; T.startGame(1001); G.bannerT=0; G.state='play'; const o={};
        o.n=T.G.level; o.trial=T.L.trial; o.legit=T.legit(); o.theme=T.L.theme; o.coinsInLevel=T.L.ents.filter(e=>e.t==='coin').length;
        G.lvDeaths=0; T.winLevel?T.winLevel():null; return o }""")
    ok('trial: pseudo level 1001, trial id set, not a legit campaign level', R['n'] == 1001 and R['trial'] == 'cat' and R['legit'] is False and R['coinsInLevel'] == 0, R)
    W = pg.evaluate("""() => { const T=TD,K=T.K,S=T.S,G=T.G; const o={}; S.best=12; S.wallet=0; S.tr={}; S.trn={}; S.hx={}; S.hc={}; S.cl={};
        G.cpX=null; G.lastLvl=-9; T.startGame(1001); G.bannerT=0; G.state='play'; G.lvDeaths=0; T.P.x=(T.L.exitTx+1)*32; T.P.onGround=true; T.update(1/60);
        o.state1=G.state; o.wallet1=S.wallet; o.tr1=S.tr.cat; o.trn1=S.trn.cat; o.xp1=T.xpOf('cat'); o.best1=S.best; o.cl1=Object.keys(S.cl).length;
        G.cpX=null; G.lastLvl=-9; T.startGame(1001); G.bannerT=0; G.state='play'; G.lvDeaths=3; T.P.x=(T.L.exitTx+1)*32; T.P.onGround=true; T.update(1/60); o.wallet2=S.wallet; o.xp2=T.xpOf('cat'); return o }""")
    print('  rewards:', json.dumps(W))
    ok('trial: first clean clear pays 40 + 15, gives the hero 9 xp, never touches S.best or the stars', W['state1'] == 'win' and W['wallet1'] == 55 and W['xp1'] == 9 and W['best1'] == 12 and W['cl1'] == 0 and W['tr1'] == 1 and W['trn1'] == 1, W)
    ok('trial: replaying it pays nothing more and gives no more xp', W['wallet2'] == 55 and W['xp2'] == 9, W)
    # --- the vault gate (falafel): opens at 4 coins, the counter follows
    V = pg.evaluate("""() => { const T=TD,K=T.K,S=T.S,G=T.G; S.best=12; S.own.falafel=1; S.hero='falafel'; S.hs={}; G.cpX=null; G.lastLvl=-9; T.startGame(1007); G.bannerT=0; G.state='play'; const o={};
        const gate=T.L.trialGate.slice(); o.gateN=gate.length; o.closed=gate.every(k=>T.L.blocks[k]); const cs=T.L.ents.filter(e=>e.t==='coin');
        o.coins=cs.length; cs[0].got=1; cs[1].got=1; cs[2].got=1; T.update(1/60); o.still=gate.every(k=>T.L.blocks[k]); cs[3].got=1; T.update(1/60); o.opened=gate.every(k=>!T.L.blocks[k]); o.cnt=T.trialCoins(); return o }""")
    ok('falafel vault: 5 buried coins, the gate stays shut at 3 and opens at 4', V['coins'] == 5 and V['closed'] and V['still'] and V['opened'] and V['cnt'] == 4, V)
    # --- map strip
    pg.evaluate("() => { const T=TD,S=T.S; S.best=12; S.own={falafel:1,cat:1}; S.hero='falafel'; S.tr={cat:1}; T.G.state='title'; T.openMap() }"); pg.wait_for_timeout(500)
    M2 = pg.evaluate("""() => ({btns:document.querySelectorAll('#wmTr .tb').length, open:document.querySelectorAll('#wmTr .tb.on').length, done:document.querySelectorAll('#wmTr .tb.done').length, lock:document.querySelectorAll('#wmTr .tb.lock').length})""")
    ok('map strip: 8 trial buttons: 1 cleared, 1 open, 6 locked (hero not owned)', M2 == {'btns': 8, 'open': 1, 'done': 1, 'lock': 6}, M2)
    pg.evaluate("document.querySelectorAll('#wmTr .tb.lock')[0].click()"); pg.wait_for_timeout(100)
    ok('map strip: a locked trial explains itself and does not start', pg.evaluate("TD.WM.open") is True and 'لازم تملك' in pg.evaluate("document.getElementById('wmHint').textContent"))
    pg.evaluate("TD.S.best=3; TD.wmRender()"); pg.wait_for_timeout(100)
    pg.evaluate("document.querySelector('#wmTr .tb').click()"); pg.wait_for_timeout(100)
    ok('map strip: before level 6 nothing starts', pg.evaluate("TD.WM.open") is True and 'مرحلة 6' in pg.evaluate("document.getElementById('wmHint').textContent"))
    pg.evaluate("TD.S.best=12; TD.wmRender()"); pg.wait_for_timeout(100)
    pg.evaluate("document.querySelector('#wmTr .tb.on').click()"); pg.wait_for_timeout(300)
    ST = pg.evaluate("({open:TD.WM.open, level:TD.G.level, state:TD.G.state, hero:TD.S.hero, trial:TD.L.trial, best:TD.S.best})")
    ok('map strip: tapping an open trial equips its hero and starts it', (not ST['open']) and ST['level'] == 1007 and ST['state'] == 'play' and ST['hero'] == 'falafel' and ST['trial'] == 'falafel' and ST['best'] == 12, ST)
    # after the win the player lands back on the map
    pg.evaluate("() => { const T=TD,G=T.G; G.state='play'; G.lvDeaths=0; T.P.x=(T.L.exitTx+1)*32; T.P.onGround=true; T.update(1/60); G.winT=5; }"); pg.wait_for_timeout(50)
    pg.evaluate("TD.trialExit()"); pg.wait_for_timeout(300)
    ok('after a trial the map opens again', pg.evaluate("TD.WM.open") is True and pg.evaluate("TD.G.state") == 'title')
    ok('no page errors', not errs, errs[:3])
    b.close()
print('RESULT:', 'ALL OK' if all(res) else 'FAILURES')
sys.exit(0 if all(res) else 1)
