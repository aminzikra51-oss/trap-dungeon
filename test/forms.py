"""Hero evolution: 5 stages, 3 looks (I-II / III-IV / V), code-made effects when there is no picture, pictures take over when they exist.
usage: python3 test/forms.py [--shots DIR]"""
import sys, os
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = sys.argv[sys.argv.index('--shots') + 1] if '--shots' in sys.argv else None
res = []
def ok(name, cond, info=''):
    res.append(bool(cond)); print(('  ok   ' if cond else '  FAIL ') + name + (f'  [{info}]' if info != '' else ''))
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 960, 'height': 540}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto(f'file://{ROOT}/trap-dungeon.html'); pg.wait_for_timeout(1500)
    pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_timeout(1500)
    D = pg.evaluate("""() => { const T = window.TD, H = T.HAB; const bad = [];
      for (const id in H) { for (const k in H[id].v) if (H[id].v[k].length !== 5) bad.push(id + '.' + k); if (H[id].tx.length !== 5) bad.push(id + '.tx');
        for (const k in H[id].v) { const a = H[id].v[k]; if (k === 'cd') { for (let i = 1; i < 5; i++) if (a[i] > a[i - 1]) bad.push(id + '.cd.order') } else for (let i = 1; i < 5; i++) if (a[i] < a[i - 1]) bad.push(id + '.' + k + '.order') } }
      return {bad, maxst: T.HERO_MAXST, forms: [0, 1, 2, 3, 4].map(T.heroForm), xp: T.XP_NEED.length, cost: T.UP_COST.length, nm: T.STAGE_NM.length} }""")
    ok('every hero ability has 5 stage values, never getting worse', not D['bad'], D['bad'][:4])
    ok('stages I-V, forms 1,1,2,2,3, 4 upgrade steps', D['maxst'] == 4 and D['forms'] == [1, 1, 2, 2, 3] and D['xp'] == 4 and D['cost'] == 4 and D['nm'] == 5, D)
    # pictures: one per stage (<id>_s1..s5) unless the hero switched to his classic look; the old form rule is the fallback
    K = pg.evaluate("""() => { const T = window.TD, k = T.sprKeyOf, r = {}, S = T.S; delete S.hcl;
      r.evo = [0, 1, 2, 3, 4].map(s => k('falafel', s));
      S.hcl = {falafel: 1}; r.classic = [0, 2, 4].map(s => k('falafel', s)); delete S.hcl;
      const keep = T.HSPR.falafel_s3; T.HSPR.falafel_s3 = {im: keep.im, ok: false}; r.missing = k('falafel', 2); T.HSPR.falafel_s3 = keep;
      const cv = document.createElement('canvas'); cv.width = 40; cv.height = 60; S.hcl = {falafel: 1}; T.HSPR.falafel_f2 = {im: cv, ok: true};
      r.f2 = [0, 1, 2, 3, 4].map(s => k('falafel', s)); delete T.HSPR.falafel_f2; delete S.hcl;
      r.all = Object.keys(T.HAB).every(h => [1, 2, 3, 4, 5].every(n => T.HSPR[h + '_s' + n] && T.HSPR[h + '_s' + n].ok)); return r }""")
    ok('all 40 stage pictures are loaded', K['all'])
    ok('evolved look: stage n draws picture n', K['evo'] == [f'falafel_s{n}' for n in range(1, 6)], K['evo'])
    ok('classic look: the base picture (accessories are fitted to it), the old form rule decides the rest', K['classic'] == ['falafel'] * 3 and K['f2'] == ['falafel', 'falafel', 'falafel_f2', 'falafel_f2', 'falafel_f2'], [K['classic'], K['f2']])
    ok('a stage picture that is not loaded falls back to the base picture', K['missing'] == 'falafel', K['missing'])
    # looks differ visibly stage to stage (thumbnail pixels), for every hero
    L = pg.evaluate("""() => { const T = window.TD, out = {}; T.S.look3d = true; T.setQ(3);
      for (const h of Object.keys(T.HAB)) { T.S.own[h] = 1; const d = []; for (const s of [0, 1, 2, 3, 4]) { T.S.hs[h] = s; const c = document.createElement('canvas'); c.width = 64; c.height = 74; T.paintHero(c, h); d.push(c.toDataURL().length + ':' + c.toDataURL().slice(-60)) }
        out[h] = {steps: [0, 1, 2, 3].map(i => d[i] !== d[i + 1])} } return out }""")
    ok('every hero: the picture changes at every stage in the shop', all(all(v['steps']) for v in L.values()), L)
    # a real level render at every stage, every hero, no exceptions
    R = pg.evaluate("""() => { const T = window.TD, G = T.G, errs = []; T.S.best = 9; T.S.look3d = true;
      for (const h of Object.keys(T.HAB)) for (const s of [0, 2, 4]) { try { T.S.hero = h; T.S.own[h] = 1; T.S.hs[h] = s; T.startGame(3); G.state = 'play'; for (let i = 0; i < 20; i++) T.update(1 / 60); T.render() } catch (e) { errs.push(h + s + ':' + e.message) } } return errs }""")
    ok('rendering every hero at stages I, III, V in a level raises nothing', not R, R[:3])
    # co-op: a player carries the stage he started with (P.hst) and is drawn with that form
    C = pg.evaluate("""() => { const T = window.TD, G = T.G; T.S.best = 9; T.S.own.cat = 1; T.coStart({hero: ['falafel', 'cat'], stage: [4, 0], level: 3, local: true, me: 0}); G.state = 'play'; for (let i = 0; i < 10; i++) T.update(1 / 60); T.render(); return [T.PLY[0].hst, T.PLY[1].hst] }""")
    ok('co-op players keep their own stage', C == [4, 0], C)
    # shop: five pips, the "form changes" hint on the right steps
    U = pg.evaluate("""async () => { const T = window.TD, wait = ms => new Promise(r => setTimeout(r, ms)), o = {};
      T.S.hero = 'falafel'; T.S.hs.falafel = 1; T.openShop('u'); await wait(200); let card = document.querySelector('#shGrid .shc.up');
      o.pips = card.querySelectorAll('.pips2 i').length; o.hint = /بيتغيّر شكله/.test(card.textContent);
      T.S.hs.falafel = 3; T.openShop('u'); await wait(200); card = document.querySelector('#shGrid .shc.up'); o.hint3 = /بيتغيّر شكله/.test(card.textContent);
      T.S.hs.falafel = 2; T.openShop('u'); await wait(200); card = document.querySelector('#shGrid .shc.up'); o.noHint = /بيتغيّر شكله/.test(card.textContent);
      const tg = () => document.querySelector('#shGrid .shc.up button.look'); o.look1 = tg() && tg().textContent; tg().click(); await wait(100); o.look2 = tg() && tg().textContent; o.cl = !!(T.S.hcl && T.S.hcl.falafel); tg().click(); await wait(100); o.back = !(T.S.hcl && T.S.hcl.falafel);
      T.S.hs.falafel = 4; T.openShop('u'); await wait(200); card = document.querySelector('#shGrid .shc.up'); o.max = /أقصى مرحلة/.test(card.textContent); return o }""")
    ok('upgrade card: 5 pips; "the look changes" hint at every step (every stage has its own picture); max label', U['pips'] == 5 and U['hint'] and U['hint3'] and U['noHint'] and U['max'], U)
    ok('upgrade card: a button switches between the evolved and the classic look, and back', 'المتطوّر' in (U['look1'] or '') and 'كلاسيكي' in (U['look2'] or '') and U['cl'] and U['back'], [U['look1'], U['look2']])
    if SHOTS:
        os.makedirs(SHOTS, exist_ok=True)
        pg.evaluate("() => { const T = window.TD; T.S.hero = 'robot'; T.S.own.robot = 1; T.S.hs.robot = 4; T.S.best = 9; T.startGame(3); T.G.state = 'play' }"); pg.wait_for_timeout(900)
        pg.locator('#stage').screenshot(path=f'{SHOTS}/form5_robot.png')
    ok('no page errors', not errs, errs[:3])
    b.close()
print('RESULT:', 'ALL OK' if all(res) else 'FAILURES')
sys.exit(0 if all(res) else 1)
