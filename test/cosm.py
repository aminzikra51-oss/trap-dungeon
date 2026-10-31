"""Death effects + helper items: buy / wear / museum unlock, particles only when worn (never in the solver), helpers consumed on entering a real level,
the shield swallows one hit (not pits), helped levels pay no mastery bonuses, helpers never apply in trials / editor / sandbox levels, shop UI.
usage: python3 test/cosm.py [--shots DIR]"""
import sys, os
from playwright.sync_api import sync_playwright
shots = sys.argv[sys.argv.index('--shots') + 1] if '--shots' in sys.argv else None
res = []
def ok(name, cond, info=''):
    res.append(bool(cond)); print(('  ok   ' if cond else '  FAIL ') + name + (f'  [{info}]' if info != '' else ''))

with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    for vp, tag in (({'width': 960, 'height': 540}, 'desk'), ({'width': 844, 'height': 390}, 'phone')):
        pg = b.new_page(viewport=vp); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(1800)
        # ---------- death effects
        D = pg.evaluate("""() => { const T=window.TD, S=T.S, G=T.G, o={}; T.FLAGS.noBoss=true; S.best=5; S.wallet=500; S.aq={}; S.dfx=''; S.st.dc={};
           const play=()=>{ G.lastLvl=-1; T.startGame(2); G.bannerT=0; G.state='play'; for(let i=0;i<10;i++)T.update(1/60) };
           const dieCount=()=>{ play(); T.parts().length=0; T.die('spike',null); return T.parts().length };
           o.n=T.DFX.length; o.base=dieCount();                                        // the normal death burst (stars)
           S.dfx='confetti'; o.unowned=dieCount();                                       // worn but not owned: nothing extra
           o.buyPoor=(S.wallet=5,T.accBuy('d:confetti',40)); S.wallet=500; o.buy=T.accBuy('d:confetti',40); o.w=S.wallet; o.again=T.accBuy('d:confetti',40);
           o.confetti=dieCount(); S.dfx=''; o.off=dieCount();
           o.kinds={}; for(const d of T.DFX){ S.aq['d:'+d.k]=1; S.dfx=d.k; const c=dieCount(); o.kinds[d.k]=c-o.base; }
           S.dfx='ghosts'; play(); T.parts().length=0; T.sim(true); T.die('spike',null); o.sim=T.parts().length; T.sim(false);
           S.dfx='skulls'; play(); T.parts().length=0; T.die('pit',null); o.emoji=T.parts().filter(p=>p.sh==='e'&&p.ch==='💀').length;
           // museum unlock: needs N different kinds of death
           S.aq={}; S.st.dc={}; const causes=T.museumCauses(); o.mus0=T.museumCount(); for(let i=0;i<8;i++)S.st.dc[causes[i]]=1; o.mus8=T.museumCount();
           return o }""")
        ok(f'{tag}: 7 death effects (4 bought, 3 from the museum)', D['n'] == 7)
        ok(f'{tag}: an unowned / unworn effect adds nothing; a bought one is bought once for 40', D['unowned'] == D['base'] and D['off'] == D['base'] and D['buyPoor'] == 'poor' and D['buy'] == 'ok' and D['w'] == 460 and D['again'] == 'owned' and D['confetti'] > D['base'] + 20, D)
        ok(f'{tag}: every effect spawns its particles on death', all(v > 3 for v in D['kinds'].values()), D['kinds'])
        ok(f'{tag}: no effect in the solver; emoji effects also work on falling deaths', D['sim'] == 0 and D['emoji'] >= 5, D)
        ok(f'{tag}: the museum counts the different deaths', D['mus0'] == 0 and D['mus8'] == 8, D)
        # ---------- helpers: consumption + shield + no bonuses
        H = pg.evaluate("""() => { const T=window.TD, S=T.S, G=T.G, o={}; T.FLAGS.noBoss=true; S.best=4; S.wallet=0; S.cl={}; S.nd={}; S.cs={}; S.bd={}; S.cc={}; S.hi={n:{shield:2,eye:1},arm:{shield:1,eye:1}}; S.own={falafel:1}; S.hero='falafel';
           const enter=n=>{ G.lastLvl=-1; G.custom=null; T.startGame(n); G.bannerT=0; G.state='play'; for(let i=0;i<10;i++)T.update(1/60) };
           enter(3); o.cnt=[S.hi.n.shield,S.hi.n.eye]; o.arm=[S.hi.arm.shield,S.hi.arm.eye]; o.help=JSON.stringify(G.help); o.helped=G.helped;
           T.retry(); G.state='play'; o.keptOnRetry=JSON.stringify(G.help); o.cntRetry=S.hi.n.shield;
           // the shield swallows one non-pit hit
           const g1=T.heroGuard('spike',null), inv=T.hab().inv; T.hab().inv=0; const g2=T.heroGuard('spike',null); o.shield=[g1,g2]; o.inv=inv;      // after a swallowed hit you are invulnerable for a moment (like the uncle's shield)
           enter(3); o.armLeft=S.hi.arm.shield; enter(3); o.cnt2=[S.hi.n.shield,S.hi.n.eye];                                                   // second helper use: shield 1 -> 0
           // pits are never absorbed
           S.hi.n.shield=1; S.hi.arm.shield=1; enter(3); T.hab().inv=0; o.pit=T.heroGuard('pit',null); o.spikeAfterPit=T.heroGuard('spike',null);
           // a helped level still counts as cleared but pays no mastery
           S.cl={}; S.nd={}; S.cs={}; S.bd={}; S.cc={}; S.hi={n:{shield:1},arm:{shield:1}}; enter(3); G.lvDeaths=0; T.econClear(); o.clHelped=!!S.cl[3]; o.ndHelped=!!S.nd[3]; o.csHelped=!!S.cs[3]; o.bdHelped=S.bd[3];
           S.cl={}; S.nd={}; S.cs={}; S.bd={}; S.hi={n:{},arm:{}}; enter(3); G.lvDeaths=0; o.helpedPlain=!!G.helped; T.econClear(); o.ndPlain=!!S.nd[3]; return o }""")
        ok(f'{tag}: entering a real level uses up what is armed (shield 2->1, eye 1->0), disarms an empty stack and sets the level as helped', H['cnt'] == [1, 0] and H['arm'] == [1, 0] and '"shield":1' in H['help'] and '"eye":1' in H['help'] and H['helped'] is True, H)
        ok(f'{tag}: retrying the same level keeps the helpers and does not use more', H['keptOnRetry'] == H['help'] and H['cntRetry'] == 1, H)
        ok(f'{tag}: the shield swallows exactly one hit, never a pit', H['shield'] == [True, False] and H['pit'] is False, H)
        ok(f'{tag}: the last shield is used on entering the next attempt and then the stack is empty', H['armLeft'] == 0 and H['cnt2'] == [0, 0], H)
        ok(f'{tag}: a helped level counts as cleared but pays no no-death bonus and no mastery star', H['clHelped'] and not H['ndHelped'] and not H['csHelped'] and H['bdHelped'] is None, H)
        ok(f'{tag}: the same clear without helpers still earns the no-death bonus', H['helpedPlain'] is False and H['ndPlain'] is True, H)
        # trials / editor / sandbox never use helpers
        X = pg.evaluate("""() => { const T=window.TD, S=T.S, G=T.G, o={}; T.FLAGS.noBoss=true; S.best=3; S.hi={n:{shield:3,eye:3},arm:{shield:1,eye:1}};
           G.lastLvl=-1; T.startGame(10); G.bannerT=0; G.state='play'; o.sandbox=[S.hi.n.shield,S.hi.n.eye,!!G.helped];                                       // beyond real progress
           const c=T.cNew(); c.seq=[[0,1],[1,1]]; c.n=4; T.startCustom(c,'edit'); G.state='play'; o.custom=[S.hi.n.shield,!!G.helped,JSON.stringify(G.help)];
           T.sim(true); G.lastLvl=-1; T.startGame(2); T.sim(false); o.sim=[S.hi.n.shield,!!G.helped]; return o }""")
        ok(f'{tag}: sandbox levels, editor maps and the solver keep the helpers and use none', X['sandbox'] == [3, 3, False] and X['custom'][0] == 3 and X['custom'][1] is False and X['sim'] == [3, False], X)
        # ---------- shop UI
        pg.evaluate("TD.S.wallet=500; TD.S.aq={}; TD.S.dfx=''; TD.S.hi={n:{},arm:{}}; TD.S.st.dc={}; TD.SHOP.am='shared'; TD.openShop('a')"); pg.wait_for_timeout(300)
        U = pg.evaluate("[...document.querySelectorAll('#shGrid .shc .nm')].map(n=>n.textContent)")
        ok(f'{tag}: shared mode lists the 7 death effects (+ the "no effect" card)', all(x in U for x in ['قصاصات حفلة', 'قلوب طايرة', 'فقاعات', 'جماجم', 'مطر الذهب', 'قوس قزح', 'أشباح طايرة', 'بدون تأثير']), U)
        pg.evaluate("[...document.querySelectorAll('#shGrid .shc')].find(c=>c.textContent.includes('قلوب طايرة')).querySelector('.btn').click()"); pg.wait_for_timeout(200)
        W = pg.evaluate("({w:TD.S.wallet, d:TD.S.dfx, own:!!TD.S.aq['d:hearts']})")
        ok(f'{tag}: the card buys an effect for 50 and wears it', W == {'w': 450, 'd': 'hearts', 'own': True}, W)
        pg.evaluate("[...document.querySelectorAll('#shGrid .shc')].find(c=>c.textContent.includes('جماجم')).querySelector('.btn').click()"); pg.wait_for_timeout(150)
        ok(f'{tag}: a museum effect stays locked until you discovered enough deaths', pg.evaluate("!TD.S.aq['d:skulls']"))
        pg.evaluate("{ const cs=TD.museumCauses(); for(let i=0;i<8;i++)TD.S.st.dc[cs[i]]=1 } TD.shopRender()"); pg.wait_for_timeout(200)
        pg.evaluate("[...document.querySelectorAll('#shGrid .shc')].find(c=>c.textContent.includes('جماجم')).querySelector('.btn').click()"); pg.wait_for_timeout(200)
        ok(f'{tag}: …and then it is claimed for free', pg.evaluate("TD.S.aq['d:skulls']===1&&TD.S.dfx==='skulls'&&TD.S.wallet===450"))
        if shots: pg.screenshot(path=os.path.join(shots, f'cosm_dfx_{tag}.png'))
        pg.evaluate("[...document.querySelectorAll('.acchips .ch')].find(b=>b.textContent.includes('مساعدات')).click()"); pg.wait_for_timeout(250)
        Hs = pg.evaluate("({n:document.querySelectorAll('#shGrid .shc').length, rf:document.querySelectorAll('.acchips .rf').length})")
        ok(f'{tag}: the helpers mode shows 2 cards and no rarity filter', Hs['n'] == 2 and Hs['rf'] == 0, Hs)
        pg.evaluate("[...document.querySelectorAll('#shGrid .shc')].find(c=>c.textContent.includes('درع حفظ')).querySelector('.btn').click()"); pg.wait_for_timeout(200)
        pg.evaluate("[...document.querySelectorAll('#shGrid .shc')].find(c=>c.textContent.includes('درع حفظ')).querySelectorAll('.btn')[1].click()"); pg.wait_for_timeout(200)
        B = pg.evaluate("({w:TD.S.wallet, n:TD.S.hi.n.shield, arm:TD.S.hi.arm.shield})")
        ok(f'{tag}: buying a shield costs 30, then the second button arms it for the next level', B == {'w': 420, 'n': 1, 'arm': 1}, B)
        if shots: pg.screenshot(path=os.path.join(shots, f'cosm_help_{tag}.png'))
        # a real run with the eye helper draws without errors
        pg.evaluate("""() => { const T=window.TD, G=T.G; document.getElementById('shop').classList.add('hide'); T.S.hi={n:{eye:2},arm:{eye:1}}; T.S.best=3; G.lastLvl=-1; T.startGame(3); G.bannerT=0; G.state='play'; for(let i=0;i<30;i++){T.update(1/60)} T.render() }""")
        ok(f'{tag}: no page errors', not errs, errs[:3])
        pg.close()
    b.close()
print('RESULT:', 'ALL OK' if all(res) else 'FAILURES'); sys.exit(0 if all(res) else 1)
