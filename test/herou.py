"""Shop tabs: hero upgrades + accessories (render, unlock rules, equip toggles, upgrade flow).
usage: python3 test/herou.py [--shots DIR]"""
import sys, json, os
from playwright.sync_api import sync_playwright
shots = sys.argv[sys.argv.index('--shots') + 1] if '--shots' in sys.argv else None
res = []
def ok(name, cond, info=''):
    res.append(bool(cond)); print(('  ok   ' if cond else '  FAIL ') + name + (f'  [{info}]' if info != '' else ''))
SETUP = r"""() => { const T=window.TD, S=T.S; S.best=30; S.wallet=500; S.own={falafel:1,cat:1,uncle:1,robot:1}; S.hero='cat'; S.hs={cat:1,uncle:3}; S.hx={cat:30,falafel:3}; S.hq={}; S.look3d=true; T.Q.q=Math.max(T.Q.q,2); T.G.state='title'; return true }"""
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    for vp, tag in (({'width': 960, 'height': 540}, 'desk'), ({'width': 844, 'height': 390}, 'phone')):
        pg = b.new_page(viewport=vp); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(600); pg.evaluate("localStorage.clear()")
        pg.evaluate(SETUP); pg.evaluate("TD.openShop('u')"); pg.wait_for_timeout(500)
        I = pg.evaluate("""() => ({cards:document.querySelectorAll('#shGrid .shc.up').length, tab:TD.SHOP.tab, btns:[...document.querySelectorAll('#shGrid .shc.up .btn')].map(b=>b.textContent), pips:document.querySelectorAll('#shGrid .pips2 i.on').length,
            tabs:[...document.querySelectorAll('#shTabs .ch')].map(b=>b.dataset.t), overflowX:document.getElementById('shGrid').scrollWidth>document.getElementById('shGrid').clientWidth+2})""")
        print(f'  [{tag}]', json.dumps(I, ensure_ascii=False))
        ok(f'{tag}: upgrade tab lists the 4 owned heroes', I['cards'] == 4 and I['tab'] == 'u', I['cards'])
        ok(f'{tag}: stage pips match (I+II+IV+I = 1+2+4+1... falafel 0, cat 1, uncle 3, robot 0)', I['pips'] == 1 + 2 + 4 + 1, I['pips'])
        ok(f'{tag}: no horizontal overflow in the grid', not I['overflowX'])
        if shots: os.makedirs(shots, exist_ok=True); pg.screenshot(path=os.path.join(shots, f'shop_up_{tag}.png'))
        if tag == 'desk':
            # falafel has 3 xp: needs 8 -> button says how many are missing; cat has 30 xp and stage 1 needs 24: upgrade works and pays 100
            txt = I['btns']
            ok('desk: a hero short on xp shows how many are missing', any('ناقصك 5 خبرة' in t for t in txt), txt)
            w0 = pg.evaluate("TD.S.wallet")
            pg.evaluate("[...document.querySelectorAll('#shGrid .shc.up')].find(c=>c.textContent.includes('القطة')).querySelector('.btn').click()"); pg.wait_for_timeout(100)
            st = pg.evaluate("({stage:TD.heroStage('cat'), w:TD.S.wallet, xp:TD.xpOf('cat')})")
            ok('desk: upgrading a hero costs 100 and moves the stage up (the "upgrader" medals may pay a little back)', st['stage'] == 2 and w0 - 100 <= st['w'] <= w0 - 100 + 60, [st, w0])
            ok('desk: xp is cumulative: the next stage (III) asks for 60 in total', st['xp'] == 30 and any('ناقصك 30 خبرة' in t for t in pg.evaluate("[...document.querySelectorAll('#shGrid .shc.up .btn')].map(b=>b.textContent)")), st['xp'])
            # accessories tab
            pg.evaluate("document.querySelector('#shTabs .ch[data-t=a]').click()"); pg.wait_for_timeout(400)
            A = pg.evaluate("""() => ({chips:[...document.querySelectorAll('.acchips')].pop().querySelectorAll('.ch').length, cards:document.querySelectorAll('#shGrid .shc').length, locked:document.querySelectorAll('#shGrid .shc.lock').length, worn:document.querySelectorAll('#shGrid .shc.sel').length,
               cvs:[...document.querySelectorAll('#shGrid .shc canvas')].map(c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data; let n=0; for(let i=3;i<d.length;i+=4)if(d[i]>20)n++; return n})})""")
            print('  acc:', json.dumps(A))
            ok('desk: accessories tab: 4 hero chips and 4 items (3 pieces + aura)', A['chips'] == 4 and A['cards'] == 4, A)
            ok('desk: cat is stage II so the aura and the back piece stay locked', A['locked'] == 2 and A['worn'] == 2, A)
            ok('desk: every preview canvas shows something', all(n > 150 for n in A['cvs']), A['cvs'])
            if shots: pg.screenshot(path=os.path.join(shots, f'shop_acc_{tag}.png'))
            pg.evaluate("[...document.querySelectorAll('#shGrid .shc')][0].querySelector('.btn').click()"); pg.wait_for_timeout(100)
            ok('desk: toggling a worn piece switches it off and remembers it', pg.evaluate("TD.S.hq.cat&&TD.S.hq.cat.h") == 0 and pg.evaluate("TD.accOn('cat','h')") is False)
            pg.evaluate("[...document.querySelectorAll('#shGrid .shc')][0].querySelector('.btn').click()"); pg.wait_for_timeout(100)
            ok('desk: and back on', pg.evaluate("TD.accOn('cat','h')") is True)
            pg.evaluate("[...document.querySelectorAll('.acchips .ch')].find(b=>b.textContent.includes('العم')).click()"); pg.wait_for_timeout(300)
            B = pg.evaluate("({locked:document.querySelectorAll('#shGrid .shc.lock').length, cards:document.querySelectorAll('#shGrid .shc').length})")
            ok('desk: uncle is at stage IV: nothing is locked', B['locked'] == 0 and B['cards'] == 4, B)
            if shots: pg.screenshot(path=os.path.join(shots, f'shop_acc2_{tag}.png'))
        else:
            pg.evaluate("document.querySelector('#shTabs .ch[data-t=a]').click()"); pg.wait_for_timeout(400)
            if shots: pg.screenshot(path=os.path.join(shots, f'shop_acc_{tag}.png'))
            ok('phone: accessories grid does not overflow horizontally', not pg.evaluate("document.getElementById('shGrid').scrollWidth>document.getElementById('shGrid').clientWidth+2"))
        ok(f'{tag}: no page errors', not errs, errs[:3])
        pg.close()
    b.close()
print('RESULT:', 'ALL OK' if all(res) else 'FAILURES')
sys.exit(0 if all(res) else 1)
