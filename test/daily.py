"""Daily + weekly challenges: date-seeded picks, event counting (die / clear / coins / jumps / abilities / time), payout once + all-three bonus, day roll-over, sandbox / SIM / custom maps do not count, UI.
usage: python3 test/daily.py [--shots DIR]"""
import sys, os
from playwright.sync_api import sync_playwright
shots = sys.argv[sys.argv.index('--shots') + 1] if '--shots' in sys.argv else None
res = []
def ok(name, cond, info=''):
    res.append(bool(cond)); print(('  ok   ' if cond else '  FAIL ') + name + (f'  [{info}]' if info != '' else ''))

GEN = r"""() => { const T=window.TD, S=T.S, R={};
  const a=T.dyGen(20000*7919+11,'d'), b=T.dyGen(20000*7919+11,'d'), c=T.dyGen(20001*7919+11,'d');
  R.same=JSON.stringify(a)===JSON.stringify(b); R.differs=JSON.stringify(a)!==JSON.stringify(c);
  R.kindsOk=true; R.rewOk=true; R.causeOk=true; R.starNever=true;
  S.cl={1:1}; S.nd={1:1}; S.cs={1:1};                                         // every star of the only cleared level is taken: a star task would be impossible
  for(let d=0;d<400;d++){ for(const key of ['d','w']){ const t=T.dyGen(d*7919+11,key); if(new Set(t.map(x=>x.k)).size!==3)R.kindsOk=false; if(t.map(x=>x.r).join()!==T.DY_REW[key].join())R.rewOk=false;
      for(const x of t){ if(x.k==='cause'&&!x.c)R.causeOk=false; if(x.k==='star')R.starNever=false } } }
  S.cl={}; S.nd={}; S.cs={}; R.pool=T.DY_POOL.length;
  const kinds=new Set(); for(let d=0;d<200;d++)for(const x of T.dyGen(d*7919+11,'d'))kinds.add(x.k); R.kindsSeen=kinds.size;
  R.num=[T.dayNum(),T.weekNum()]; return R }"""
SET = r"""(tasks) => { const T=window.TD, S=T.S; S.wallet=0; S.dy={d:T.dayNum(),t:tasks.d,p:{},c:{},a:0}; S.wk={w:T.weekNum(),t:tasks.w,p:{},c:{},a:0}; T.G.custom=null }"""
TD_ = [{'k': 'coin', 'n': 5, 'r': 10}, {'k': 'die', 'n': 2, 'r': 18}, {'k': 'cause', 'n': 2, 'r': 30, 'c': 'spike'}]
TW_ = [{'k': 'jump', 'n': 4, 'r': 40}, {'k': 'time', 'n': 1, 'r': 70}, {'k': 'ab', 'n': 3, 'r': 120}]

with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    for vp, tag in (({'width': 960, 'height': 540}, 'desk'), ({'width': 844, 'height': 390}, 'phone')):
        pg = b.new_page(viewport=vp); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(1800)
        G = pg.evaluate(GEN)
        ok(f'{tag}: the same date always gives the same tasks, another date gives others', G['same'] and G['differs'], G)
        ok(f'{tag}: always 3 different kinds, rewards 10/18/30 daily and 40/70/120 weekly, cause tasks name a cause', G['kindsOk'] and G['rewOk'] and G['causeOk'], G)
        ok(f'{tag}: a star task is never offered when no star is left to win; all kinds show up over time', G['starNever'] and G['kindsSeen'] == G['pool'], G)
        # ---- payout: once, then the bonus for all three
        pg.evaluate(SET, {'d': TD_, 'w': TW_})
        R = pg.evaluate("""() => { const T=window.TD, S=T.S, o={}; T.dayEv('coin',3); o.p1=S.dy.p.coin; o.w1=S.wallet; T.dayEv('coin',2); o.w2=S.wallet; o.paid=S.dy.c.coin; T.dayEv('coin',50); o.w3=S.wallet;
           T.dayEv('cause',1,'arrow'); o.wrongCause=S.dy.p.cause||0; T.dayEv('cause',1,'spike'); T.dayEv('cause',1,'spike'); o.w4=S.wallet; o.cOk=S.dy.c.cause;
           T.dayEv('die',2); o.w5=S.wallet; o.bonus=S.dy.a; T.dayEv('die',5); o.w6=S.wallet; return o }""")
        ok(f'{tag}: progress counts, the reward arrives on completion and only once', R['p1'] == 3 and R['w1'] == 0 and R['w2'] == 10 and R['paid'] == 1 and R['w3'] == 10, R)
        ok(f'{tag}: a cause task only counts that cause', R['wrongCause'] == 0 and R['cOk'] == 1 and R['w4'] == 40, R)
        ok(f'{tag}: finishing all three pays the bonus (10+30+18+15) once', R['w5'] == 73 and R['bonus'] == 1 and R['w6'] == 73, R)
        # ---- SIM / custom maps / sandbox do not count
        pg.evaluate(SET, {'d': TD_, 'w': TW_})
        N = pg.evaluate("""() => { const T=window.TD, S=T.S, G=T.G, o={}; T.sim(true); T.dayEv('coin',99); T.dayEv('die',9); T.sim(false); o.sim=(S.dy.p.coin||0)+(S.dy.p.die||0)+S.wallet;
           const c=T.cNew(); c.seq=[[0,1],[1,1]]; c.n=4; T.startCustom(c,'edit'); G.state='play'; T.dayEv('coin',99); T.dayEv('jump',3); o.custom=(S.dy.p.coin||0)+(S.wk.p.jump||0)+S.wallet;
           G.custom=null; T.dayEv('coin',0); T.dayEv('coin',-4); o.zero=S.dy.p.coin||0; return o }""")
        ok(f'{tag}: nothing counts inside the solver, in editor / shared maps, or for zero / negative amounts', N['sim'] == 0 and N['custom'] == 0 and N['zero'] == 0, N)
        # ---- real game hooks: die, jump, clear, coins
        pg.evaluate(SET, {'d': [{'k': 'die', 'n': 50, 'r': 10}, {'k': 'jump', 'n': 50, 'r': 18}, {'k': 'clear', 'n': 50, 'r': 30}], 'w': [{'k': 'cause', 'n': 50, 'r': 40, 'c': 'spike'}, {'k': 'clean', 'n': 50, 'r': 70}, {'k': 'coin', 'n': 50, 'r': 120}]})
        H = pg.evaluate("""() => { const T=window.TD, S=T.S, G=T.G, K=T.K, o={}; T.FLAGS.noBoss=true; S.best=3; S.wallet=0; G.lastLvl=-1; T.startGame(3); G.bannerT=0; G.state='play'; for(let i=0;i<20;i++)T.update(1/60);
           T.die('spike',null); o.die=S.dy.p.die; o.cause=S.wk.p.cause; T.retry(); G.state='play'; for(let i=0;i<20;i++)T.update(1/60);
           K.j=true; K.jp=true; for(let i=0;i<4;i++)T.update(1/60); K.j=false; K.jp=false; o.jump=S.dy.p.jump||0;
           const cs=T.L.ents.filter(e=>e.t==='coin'&&!e.bait); for(const c of cs.slice(0,3)){ T.P.x=c.x-10; T.P.y=c.y-14; T.P.vx=0; T.P.vy=0; c.got=0; T.update(1/60) } T.econBank(); o.coin=S.wk.p.coin||0;
           G.lvDeaths=0; T.econClear(); o.clear=S.dy.p.clear; o.clean=S.wk.p.clean; return o }""")
        ok(f'{tag}: a real death counts (die + cause), a jump counts, banked coins count, a clean clear counts for clear and clean',
           H['die'] == 1 and H['cause'] == 1 and H['jump'] >= 1 and H['coin'] >= 1 and H['clear'] == 1 and H['clean'] == 1, H)
        # sandbox level (beyond real progress) pays no clear / coins
        Sb = pg.evaluate("""() => { const T=window.TD, S=T.S, G=T.G, o={}; S.dy.p={}; S.wk.p={}; S.best=3; G.lastLvl=-1; T.startGame(10); G.bannerT=0; G.state='play'; const cs=T.L.ents.filter(e=>e.t==='coin'&&!e.bait); for(const c of cs.slice(0,2)){ T.P.x=c.x-10; T.P.y=c.y-14; c.got=0; T.update(1/60) } T.econBank(); T.econClear(); o.clear=S.dy.p.clear||0; o.coin=S.wk.p.coin||0; return o }""")
        ok(f'{tag}: a sandbox level (jumped beyond real progress) counts no clear and no coins', Sb['clear'] == 0 and Sb['coin'] == 0, Sb)
        # ---- abilities: donkey dash + cat second jump + falafel magnet
        pg.evaluate(SET, {'d': [{'k': 'ab', 'n': 99, 'r': 10}, {'k': 'time', 'n': 99, 'r': 18}, {'k': 'jump', 'n': 999, 'r': 30}], 'w': TW_})
        Ab = pg.evaluate("""() => { const T=window.TD, S=T.S, G=T.G, K=T.K, o={}; S.own.donkey=1; S.own.cat=1; S.own.falafel=1; T.FLAGS.noBoss=true; S.best=3;
           S.hero='donkey'; G.lastLvl=-1; T.startGame(2); G.bannerT=0; G.state='play'; for(let i=0;i<30;i++)T.update(1/60); K.ap=true; T.update(1/60); K.ap=false; o.dash=S.dy.p.ab||0;
           S.hero='cat'; G.lastLvl=-1; T.startGame(2); G.bannerT=0; G.state='play'; for(let i=0;i<30;i++)T.update(1/60); const a0=S.dy.p.ab||0; K.j=true; K.jp=true; T.update(1/60); K.jp=false; for(let i=0;i<14;i++)T.update(1/60); K.j=true; K.jp=true; T.update(1/60); K.jp=false; K.j=false; o.catAb=(S.dy.p.ab||0)-a0;
           T.dayTick(30); o.t1=S.dy.p.time||0; T.dayTick(40); o.t2=Math.round((S.dy.p.time||0)*100)/100; return o }""")
        ok(f'{tag}: the donkey dash counts as an ability use; the cat double jump counts once', Ab['dash'] == 1 and Ab['catAb'] == 1, Ab)
        ok(f'{tag}: play time is counted in minutes', Ab['t1'] > 0.45 and abs(Ab['t2'] - 70 / 60) < .05, Ab)
        # ---- roll-over: a new day wipes today's progress, keeps this week's
        Rl = pg.evaluate("""() => { const T=window.TD, S=T.S, o={}; S.dy={d:T.dayNum()-1,t:[{k:'coin',n:5,r:10}],p:{coin:4},c:{},a:0}; S.wk={w:T.weekNum(),t:[{k:'jump',n:9,r:40},{k:'time',n:9,r:70},{k:'ab',n:9,r:120}],p:{jump:3},c:{},a:0};
           const t=T.dyTasks(); o.d=t.d.d===T.dayNum(); o.n=t.d.t.length; o.p=Object.keys(t.d.p).length; o.wkKept=t.w.p.jump; S.wk.w=T.weekNum()-1; const t2=T.dyTasks(); o.wkNew=t2.w.w===T.weekNum()&&Object.keys(t2.w.p).length===0&&t2.w.t.length===3; return o }""")
        ok(f'{tag}: a new day starts fresh with 3 tasks; the week stays until it ends, then renews too', Rl['d'] and Rl['n'] == 3 and Rl['p'] == 0 and Rl['wkKept'] == 3 and Rl['wkNew'], Rl)
        # ---- UI
        pg.evaluate("TD.S.wallet=0; TD.S.dy={d:0,t:[],p:{},c:{},a:0}; TD.S.wk={w:0,t:[],p:{},c:{},a:0}; TD.dayRoll(); TD.S.dy.p[TD.S.dy.t[0].k]=1; TD.openAch()"); pg.wait_for_timeout(400)
        U = pg.evaluate("({hd:[...document.querySelectorAll('#acList .dyh')].map(h=>h.textContent).slice(0,2), rows:document.querySelectorAll('#acList .dyr').length, first:document.querySelector('#acList .dyh')&&document.querySelector('#acList').firstElementChild.className})")
        ok(f'{tag}: the achievements screen starts with today (3 rows) and this week (3 rows)', U['rows'] == 6 and len(U['hd']) == 2 and 'اليوم' in U['hd'][0] and 'الأسبوع' in U['hd'][1] and U['first'] == 'dyh', U)
        if shots: pg.screenshot(path=os.path.join(shots, f'daily_{tag}.png'))
        ok(f'{tag}: no page errors', not errs, errs[:3])
        pg.close()
    b.close()
print('RESULT:', 'ALL OK' if all(res) else 'FAILURES'); sys.exit(0 if all(res) else 1)
