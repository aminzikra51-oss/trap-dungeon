"""Accessory shop v2: rarity filters, shared trails (buy / equip / particles), extra sets (buy / wear / full-set glow), cosmetic-only guarantees.
usage: python3 test/accshop.py [--shots DIR]"""
import sys, json, os
from playwright.sync_api import sync_playwright
shots = sys.argv[sys.argv.index('--shots') + 1] if '--shots' in sys.argv else None
res = []
def ok(name, cond, info=''):
    res.append(bool(cond)); print(('  ok   ' if cond else '  FAIL ') + name + (f'  [{info}]' if info != '' else ''))
SETUP = r"""() => { const T=window.TD, S=T.S; S.best=30; S.wallet=500; S.own={falafel:1,cat:1,uncle:1,robot:1}; S.hero='cat'; S.hs={cat:1,uncle:3}; S.hx={}; S.hq={}; S.aq={}; S.trail=''; S.look3d=true; T.Q.q=Math.max(T.Q.q,2) }"""
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    for vp, tag in (({'width': 960, 'height': 540}, 'desk'), ({'width': 844, 'height': 390}, 'phone')):
        pg = b.new_page(viewport=vp); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(1800)
        pg.evaluate(SETUP); pg.evaluate("TD.openShop('a')"); pg.wait_for_timeout(500)
        # ---- hero mode: rarity badges + set header
        H = pg.evaluate("""() => ({cards:document.querySelectorAll('#shGrid .shc').length, badges:[...document.querySelectorAll('#shGrid .shc .rar')].map(r=>r.textContent), hd:[...document.querySelectorAll('#shGrid .achd')].map(h=>h.textContent)})""")
        ok(f'{tag}: hero mode shows set 1 (3 pieces + aura) with rarity badges', H['cards'] == 4 and H['badges'].count('عادي') == 3 and H['badges'].count('أسطوري') == 1 and len(H['hd']) == 1 and 'الطقم الأول' in H['hd'][0], H)
        pg.evaluate("[...document.querySelectorAll('.acchips .rf')].find(b=>b.textContent==='نادر').click()"); pg.wait_for_timeout(200)
        ok(f'{tag}: the rare filter hides everything of set 1 (nothing rare for a hero yet)', pg.evaluate("document.querySelectorAll('#shGrid .shc').length") == 0)
        pg.evaluate("[...document.querySelectorAll('.acchips .rf')].find(b=>b.textContent==='الكل').click()")
        # ---- shared mode / trails
        pg.evaluate("[...document.querySelectorAll('.acchips .ch')].find(b=>b.textContent.includes('مشترك')).click()"); pg.wait_for_timeout(300)
        Tn = pg.evaluate("({cards:document.querySelectorAll('#shGrid .shc').length, names:[...document.querySelectorAll('#shGrid .shc .nm')].map(n=>n.textContent)})")
        ok(f'{tag}: shared mode lists "no trail" + 5 trails', Tn['cards'] == 6, Tn)
        if shots: pg.screenshot(path=os.path.join(shots, f'acc_shared_{tag}.png'))
        pg.evaluate("[...document.querySelectorAll('.acchips .rf')].find(b=>b.textContent==='أسطوري').click()"); pg.wait_for_timeout(200)
        ok(f'{tag}: the legendary filter keeps the 2 legendary trails (fire, party)', pg.evaluate("[...document.querySelectorAll('#shGrid .shc .nm')].map(n=>n.textContent)") == ['نار', 'حفلة'])
        pg.evaluate("[...document.querySelectorAll('.acchips .rf')].find(b=>b.textContent==='الكل').click()"); pg.wait_for_timeout(200)
        # buy: too poor first
        pg.evaluate("TD.S.wallet=10"); pg.evaluate("TD.openShop('a')")
        r = pg.evaluate("TD.accBuy('t:hearts',50)"); ok(f'{tag}: buying without enough coins is refused and costs nothing', r == 'poor' and pg.evaluate("TD.S.wallet") == 10 and not pg.evaluate("!!TD.S.aq['t:hearts']"), r)
        pg.evaluate("TD.S.wallet=500")
        r = pg.evaluate("TD.accBuy('t:hearts',50)"); ok(f'{tag}: buying costs the price once', r == 'ok' and pg.evaluate("TD.S.wallet") == 450 and pg.evaluate("TD.accBuy('t:hearts',50)") == 'owned' and pg.evaluate("TD.S.wallet") == 450, r)
        # UI buy path for another trail
        pg.evaluate("TD.openShop('a')"); pg.wait_for_timeout(200)
        pg.evaluate("[...document.querySelectorAll('.acchips .ch')].find(b=>b.textContent.includes('مشترك')).click()"); pg.wait_for_timeout(200)
        pg.evaluate("[...document.querySelectorAll('#shGrid .shc')].find(c=>c.textContent.includes('نار')).querySelector('.btn').click()"); pg.wait_for_timeout(200)
        S1 = pg.evaluate("({w:TD.S.wallet, tr:TD.S.trail, own:!!TD.S.aq['t:fire']})")
        ok(f'{tag}: buying a trail from the card pays 100, owns it and wears it', S1 == {'w': 350, 'tr': 'fire', 'own': True}, S1)
        pg.evaluate("[...document.querySelectorAll('#shGrid .shc')].find(c=>c.textContent.includes('نار')).querySelector('.btn').click()"); pg.wait_for_timeout(100)
        ok(f'{tag}: pressing the worn trail takes it off', pg.evaluate("TD.S.trail") == '')
        pg.evaluate("TD.S.trail='hearts'; TD.S.save&&0")
        # ---- trails in a real run: particles appear while moving, none in the solver, none when not owned / not worn
        R = pg.evaluate("""() => { const T=window.TD, S=T.S; S.best=30; document.getElementById('shop').classList.add('hide'); document.getElementById('menu').classList.add('hide'); T.G.state='play'; T.startGame(1);
           for(let i=0;i<30;i++)T.update(1/60);
           const out={}; const run=(trail)=>{ S.trail=trail; T.K.r=true; const n0=T.parts().length; for(let i=0;i<40;i++)T.update(1/60); T.K.r=false; return T.parts().filter(p=>p.sh==='h'||p.sh==='t'||p.sh==='b'||p.sh==='r').length };
           T.parts().length=0; out.hearts=run('hearts'); T.parts().length=0; out.none=run(''); T.parts().length=0; out.unowned=run('party');
           T.parts().length=0; T.sim(true); S.trail='hearts'; T.K.r=true; for(let i=0;i<40;i++)T.update(1/60); T.K.r=false; T.sim(false); out.sim=T.parts().filter(p=>p.sh==='h').length; return out }""")
        ok(f'{tag}: a worn + owned trail spawns particles while running', R['hearts'] > 3, R)
        ok(f'{tag}: nothing spawns with no trail / an unowned trail / inside the solver', R['none'] == 0 and R['unowned'] == 0 and R['sim'] == 0, R)
        # ---- sets (injected data: set 2 of the cat head slot) + full-set glow
        Q = pg.evaluate("""() => { const T=window.TD, S=T.S; S.wallet=500; S.aq={}; S.hq={}; S.hs={cat:1,uncle:3};
           T.ACCX.cat=[['h','cat_h',2,1,'قبعة تجريبية',60]];
           const o={}; o.max=T.accItem('cat','h',2)&&T.accItem('cat','h',2).price; o.own0=T.accOwn('cat','h',2); o.buy=T.accBuy('cat:h:2',60); o.own1=T.accOwn('cat','h',2); S.hq.cat={h:2}; o.sel=T.accSel('cat','h'); o.w=S.wallet;
           o.fullCat=T.accSetFull('cat'); o.fullUncle=T.accSetFull('uncle'); S.hq.uncle={h:0}; o.fullUncleOff=T.accSetFull('uncle'); delete T.ACCX.cat; return o }""")
        ok(f'{tag}: an extra set item is bought once, then wearable (sel = 2)', Q['max'] == 60 and Q['own0'] is False and Q['buy'] == 'ok' and Q['own1'] is True and Q['sel'] == 2 and Q['w'] == 440, Q)
        ok(f'{tag}: the full-set glow needs all three pieces unlocked and worn (uncle yes, cat stage I no, uncle with a piece off no)', Q['fullUncle'] == 1 and Q['fullCat'] == 0 and Q['fullUncleOff'] == 0, Q)
        ok(f'{tag}: no page errors', not errs, errs[:3])
        pg.close()
    b.close()
print('RESULT:', 'ALL OK' if all(res) else 'FAILURES'); sys.exit(0 if all(res) else 1)
