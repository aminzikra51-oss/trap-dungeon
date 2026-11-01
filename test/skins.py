"""Hero skins: the 45 extra evolution pictures load, the picture choice (sprKeyOf), buying / wearing / swapping, the shop card (chips, preview that walks through the stages, buy button),
rendering in levels and co-op, sanitising of anything that comes from a save or the network, the friends' avatar, and the admin console command.
usage: python3 test/skins.py [--shots DIR]"""
import sys, os, json
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
    pg.route('**/*firebasedatabase.app/**', lambda r: r.fulfill(status=200, content_type='application/json', body='null'))
    pg.goto(f'file://{ROOT}/trap-dungeon.html'); pg.wait_for_timeout(1500)
    pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_timeout(1500)
    E = lambda e: pg.evaluate(f"() => {e}")

    # ---- pictures ----
    P = E("""(() => { const T = TD, miss = [], tot = [0, 0]; for (const id in T.SKINS) for (let k = 1; k < T.SKINS[id].length; k++) for (let n = 1; n <= 5; n++) { tot[0]++; const o = T.HSPR[id + '_k' + k + '_s' + n]; if (o && o.ok) tot[1]++; else miss.push(id + '_k' + k + '_s' + n) }
      return {tot, miss: miss.slice(0, 5), heroes: Object.keys(T.SKINS).length, counts: Object.keys(T.SKINS).map(id => T.SKINS[id].length)} })()""")
    ok('every skin has its five pictures loaded (45)', P['tot'] == [45, 45], P)
    ok('8 heroes, one extra look each, the falafel two', P['heroes'] == 8 and P['counts'] == [3, 2, 2, 2, 2, 2, 2, 2], P['counts'])

    # ---- picture choice ----
    K = E("""(() => { const T = TD, S = T.S, k = T.sprKeyOf, r = {}; S.hsk = {}; S.hso = {}; S.hcl = {};
      r.def = [0, 2, 4].map(s => k('falafel', s));
      S.hsk.falafel = 1; r.notOwned = k('falafel', 2);                                   // chosen but not owned (a tampered save): the first path
      S.hso['falafel:1'] = 1; r.k1 = [0, 1, 2, 3, 4].map(s => k('falafel', s));
      S.hsk.falafel = 2; S.hso['falafel:2'] = 1; r.k2 = k('falafel', 4);
      S.hcl = {falafel: 1}; r.classic = k('falafel', 3); S.hcl = {};
      const keep = T.HSPR.falafel_k2_s5; T.HSPR.falafel_k2_s5 = {im: keep.im, ok: false}; r.missing = k('falafel', 4); T.HSPR.falafel_k2_s5 = keep;
      S.hsk = {falafel: 99}; S.hso['falafel:99'] = 1; r.garbage = k('falafel', 1); S.hsk = {}; S.hso = {};
      r.san = [T.skinSan('falafel', 2), T.skinSan('falafel', '2'), T.skinSan('falafel', 3), T.skinSan('falafel', -1), T.skinSan('falafel', 1.7), T.skinSan('falafel', NaN), T.skinSan('falafel', 'x'), T.skinSan('__proto__', 1), T.skinSan('uncle', 2), T.skinSan('cat', null), T.skinSan('cat', {}), T.skinSan('cat', [1])];
      return r })()""")
    ok('default: the first path pictures', K['def'] == ['falafel_s1', 'falafel_s3', 'falafel_s5'], K['def'])
    ok('a skin that is not owned is ignored', K['notOwned'] == 'falafel_s3', K['notOwned'])
    ok('an owned skin: stage n draws picture n of that skin', K['k1'] == [f'falafel_k1_s{n}' for n in range(1, 6)] and K['k2'] == 'falafel_k2_s5', [K['k1'], K['k2']])
    ok('the classic look has no skins (the accessories are fitted to the base picture)', K['classic'] == 'falafel', K['classic'])
    ok('a skin picture that is not loaded falls back to the first path', K['missing'] == 'falafel_s5', K['missing'])
    ok('an out-of-range skin in a save is ignored', K['garbage'] == 'falafel_s2', K['garbage'])
    ok('skinSan accepts only real skin numbers (strings of digits too), nothing else', K['san'] == [2, 2, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1], K['san'])

    # ---- buy / wear / swap ----
    B = E("""(() => { const T = TD, S = T.S, r = {}; S.own = {falafel: 1}; S.hero = 'falafel'; S.wallet = 100; S.hsk = {}; S.hso = {}; S.hcl = {falafel: 1};
      r.poor = T.skinBuy('falafel', 1); r.w1 = S.wallet; r.zero = T.skinBuy('falafel', 0); r.bad = T.skinBuy('falafel', 7); r.notOwnedHero = T.skinBuy('cat', 1);
      S.wallet = 1000; r.buy = T.skinBuy('falafel', 1); r.w2 = S.wallet; r.worn = T.skinSaved('falafel'); r.hclCleared = !S.hcl.falafel; r.again = T.skinBuy('falafel', 1); r.w3 = S.wallet;
      r.buy2 = T.skinBuy('falafel', 2); r.w4 = S.wallet; r.worn2 = T.skinSaved('falafel');
      r.back0 = T.skinWear('falafel', 0); r.worn0 = T.skinSaved('falafel'); r.back1 = T.skinWear('falafel', 1); r.worn1 = T.skinSaved('falafel');
      r.notOwnedWear = T.skinWear('cat', 1); r.owned = Object.keys(S.hso).sort().join(); return r })()""")
    ok('too poor: nothing is taken, nothing is owned', B['poor'] == 'poor' and B['w1'] == 100)
    ok('skin 0, a skin that does not exist and a hero you do not own are refused', B['zero'] == 'none' and B['bad'] == 'none' and B['notOwnedHero'] == 'none', [B['zero'], B['bad'], B['notOwnedHero']])
    ok('buying pays 300, owns it, wears it and leaves the classic look', B['buy'] == 'ok' and B['w2'] == 700 and B['worn'] == 1 and B['hclCleared'], B)
    ok('buying twice is refused and free', B['again'] == 'owned' and B['w3'] == 700)
    ok('the falafel third look costs 450', B['buy2'] == 'ok' and B['w4'] == 250 and B['worn2'] == 2, [B['w4'], B['worn2']])
    ok('swapping between owned looks is free, in any order, back to the first path too', B['back0'] and B['worn0'] == 0 and B['back1'] and B['worn1'] == 1 and B['w4'] == 250)
    ok('wearing a look you do not own is refused', not B['notOwnedWear'] and B['owned'] == 'falafel:1,falafel:2', B['owned'])

    # ---- the shop card ----
    SH = pg.evaluate("""async () => { const T = TD, S = T.S, wait = ms => new Promise(r => setTimeout(r, ms)), o = {}; S.best = 30; S.wallet = 200; S.own = {falafel: 1, cat: 1}; S.hero = 'falafel'; S.hsk = {}; S.hso = {}; S.hcl = {}; S.hs = {falafel: 2}; S.look3d = true; T.setQ(3);
      T.openShop('u'); await wait(300);
      const card = id => [...document.querySelectorAll('#shGrid .shc.up')].find(c => c.textContent.includes(T.HEROES ? T.HEROES[id].name : id));
      let c = document.querySelectorAll('#shGrid .shc.up')[0]; o.cards = document.querySelectorAll('#shGrid .shc.up').length;
      o.chips = [...c.querySelectorAll('.skc .tg.sk')].map(b => b.textContent); o.locked = [...c.querySelectorAll('.skc .tg.sk.lock')].length; o.noAction = !c.querySelector('.skr > .btn');
      const falafelCard = () => [...document.querySelectorAll('#shGrid .shc.up')].find(x => x.querySelector('.nm').textContent === T.HEROES.falafel.name);
      falafelCard().querySelector('.skc .tg.sk[data-k="1"]').click(); await wait(250);
      c = falafelCard(); o.pv = c.querySelector('.skc .tg.sk.pv') && c.querySelector('.skc .tg.sk.pv').dataset.k; o.buyTxt = c.querySelector('.skr > .btn').textContent; o.buyPoor = c.querySelector('.skr > .btn').classList.contains('poor');
      const cv = c.querySelector('canvas'); const a1 = cv.toDataURL(); await wait(1500); const a2 = cv.toDataURL(); o.previewMoves = a1 !== a2; await wait(1200); o.previewMoves2 = cv.toDataURL() !== a2;
      c.querySelector('.skr > .btn').click(); await wait(200); o.poorBought = Object.keys(S.hso).length; o.wallet1 = S.wallet;
      S.wallet = 500; T.openShop('u'); await wait(250); falafelCard().querySelector('.skc .tg.sk[data-k="1"]').click(); await wait(200);
      falafelCard().querySelector('.skr > .btn').click(); await wait(250);
      o.bought = Object.keys(S.hso).join(); o.wallet2 = S.wallet; o.worn = T.skinSaved('falafel'); c = falafelCard(); o.onChip = c.querySelector('.skc .tg.sk.on') && c.querySelector('.skc .tg.sk.on').dataset.k;
      c.querySelector('.skc .tg.sk[data-k="0"]').click(); await wait(200); c = falafelCard(); o.swapTxt = c.querySelector('.skr > .btn') && c.querySelector('.skr > .btn').textContent;
      c.querySelector('.skr > .btn').click(); await wait(200); o.worn0 = T.skinSaved('falafel'); o.wallet3 = S.wallet;
      const catCard = [...document.querySelectorAll('#shGrid .shc.up')].find(x => x.querySelector('.nm').textContent === T.HEROES.cat.name); o.catChips = catCard.querySelectorAll('.skc .tg.sk').length;
      o.overflowX = document.getElementById('shGrid').scrollWidth > document.getElementById('shGrid').clientWidth + 2; return o }""")
    ok('the upgrade cards show one chip per look (falafel 3), the locked ones marked 🔒', SH['chips'] and len(SH['chips']) == 3 and SH['locked'] == 2 and SH['noAction'], SH['chips'])
    ok('tapping a locked look previews it and offers to buy it with its price (and says how many coins are missing)', SH['pv'] == '1' and 'اشترِ' in SH['buyTxt'] and '300' in SH['buyTxt'] and SH['buyPoor'] and 'ناقصك 100' in SH['buyTxt'], [SH['pv'], SH['buyTxt']])
    ok('the preview thumbnail walks through the stages on its own', SH['previewMoves'] and SH['previewMoves2'])
    ok('pressing buy while poor buys nothing', SH['poorBought'] == 0 and SH['wallet1'] == 200, [SH['poorBought'], SH['wallet1']])
    ok('with enough coins: bought, worn, chip marked', SH['bought'] == 'falafel:1' and SH['wallet2'] == 200 and SH['worn'] == 1 and SH['onChip'] == '1', SH)
    ok('going back to the first path is a free "wear" button', 'البس' in (SH['swapTxt'] or '') and SH['worn0'] == 0 and SH['wallet3'] == 200, [SH['swapTxt'], SH['worn0']])
    ok('a hero with two looks has two chips', SH['catChips'] == 2, SH['catChips'])
    ok('no horizontal overflow', not SH['overflowX'])
    if SHOTS:
        os.makedirs(SHOTS, exist_ok=True)
        pg.evaluate("() => { const T = TD; T.S.wallet = 900; T.S.hs = {falafel: 3, cat: 4}; T.openShop('u') }"); pg.wait_for_timeout(300)
        pg.evaluate("() => document.querySelector('#shGrid .shc.up .skc .tg.sk[data-k=\"2\"]').click()"); pg.wait_for_timeout(1400)
        pg.screenshot(path=f'{SHOTS}/skins_shop.png')

    # ---- levels and co-op, every skin of every hero ----
    R = pg.evaluate("""() => { const T = TD, G = T.G, S = T.S, errs = []; S.best = 9; S.look3d = true; T.setQ(3); S.hcl = {};
      for (const id of Object.keys(T.SKINS)) for (let k = 0; k < T.SKINS[id].length; k++) for (const st of [0, 4]) { try { S.own[id] = 1; S.hero = id; S.hs[id] = st; S.hso[id + ':' + k] = 1; S.hsk[id] = k; T.startGame(3); G.state = 'play'; for (let i = 0; i < 6; i++) T.update(1 / 60); T.render() } catch (e) { errs.push(id + k + ':' + e.message) } }
      return errs }""")
    ok('rendering every skin of every hero at stages I and V in a level raises nothing', not R, R[:3])
    C = pg.evaluate("""() => { const T = TD, G = T.G, S = T.S; S.best = 9; S.own.cat = 1; S.own.falafel = 1; S.hso = {'falafel:1': 1, 'cat:1': 1}; S.hsk = {falafel: 1, cat: 1}; S.hcl = {};
      T.coStart({hero: ['falafel', 'cat'], stage: [2, 3], level: 3, local: true, me: 0}); G.state = 'play'; for (let i = 0; i < 10; i++) T.update(1 / 60); T.render(); const a = T.PLY.map(p => p.hsk).join(), ks = [T.sprKeyOf('falafel', 2), T.sprKeyOf('cat', 3)];
      T.coStart({hero: ['falafel', 'cat'], stage: [2, 3], skin: [5, 99], level: 3, local: false, me: 0}); G.state = 'play'; for (let i = 0; i < 10; i++) T.update(1 / 60); T.render(); const b = T.PLY.map(p => p.hsk).join();
      T.coStart({hero: ['falafel', 'cat'], stage: [2, 3], skin: ['x', null], level: 3, local: false, me: 0}); const c = T.PLY.map(p => p.hsk).join(); return {a, ks, b, c} }""")
    ok('co-op: each player starts with his own skin (local co-op uses the saved ones)', C['a'] == '1,1' and C['ks'] == ['falafel_k1_s3', 'cat_k1_s4'], C)
    ok('co-op: a skin sent by the other machine is checked (5 or 99 -> 0, text -> 0)', C['b'] == '0,0' and C['c'] == '0,0', [C['b'], C['c']])

    # ---- profile / friends ----
    F = pg.evaluate("""() => { const T = TD, S = T.S; S.hso = {'falafel:1': 1}; S.hsk = {falafel: 1}; S.hero = 'falafel'; S.hs = {falafel: 2};
      const own = T.pfOwn(), san = T.pfSan({n: 'x', h: 'falafel', s: 2, k: 1}), bad = T.pfSan({n: 'x', h: 'falafel', s: 2, k: 77}), bad2 = T.pfSan({n: 'x', h: 'uncle', s: 2, k: 2}), none = T.pfSan({n: 'x', h: 'falafel'});
      const a = T.pfAv({h: 'falafel', s: 2, k: 1, a: 'h', f: 0}, 40), b = T.pfAv({h: 'falafel', s: 2, k: 0, a: 'h', f: 0}, 40);
      return {own: own.k, san: san.k, bad: bad.k, bad2: bad2.k, none: none.k, same: a.querySelector('canvas') && b.querySelector('canvas') && a.querySelector('canvas').toDataURL() !== b.querySelector('canvas').toDataURL()} }""")
    ok('my stats card and presence carry my skin; what comes from the database is checked', F['own'] == 1 and F['san'] == 1 and F['bad'] == 0 and F['bad2'] == 0 and F['none'] == 0, F)
    ok('a friend\'s avatar shows his skin (different picture from the first path)', F['same'])

    # ---- the admin console ----
    pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_timeout(1200)
    def cmd(line): pg.fill('#adm input', line); pg.press('#adm input', 'Enter'); pg.wait_for_timeout(80)
    pg.keyboard.press('Backquote'); pg.wait_for_timeout(150); cmd('setpass secret1')
    cmd('skin cat 1'); ok('console: skin <id> <k> owns and wears it', E("TD.S.hso['cat:1'] === 1 && TD.S.hsk.cat === 1"))
    cmd('skin cat 0'); ok('console: skin <id> 0 goes back to the first path', E("TD.skinSaved('cat') === 0"))
    cmd('skin cat 9'); ok('console: a skin number that does not exist is refused', E("TD.skinSaved('cat') === 0 && !TD.S.hso['cat:9']"))
    cmd('skin all'); ok('console: skin all owns every skin', E("Object.keys(TD.S.hso).length === 9"))
    cmd('wipe skins yes'); pg.wait_for_timeout(1800); pg.keyboard.press('Backquote'); pg.wait_for_timeout(150); cmd('auth secret1')
    ok('console: wipe skins yes empties them (after the reload)', E("Object.keys(TD.S.hso || {}).length === 0 && Object.keys(TD.S.hsk || {}).length === 0"))
    cmd('unlock skins'); ok('console: unlock skins', E("Object.keys(TD.S.hso).length === 9"))
    ok('no page errors', not errs, errs[:3])
    b.close()
print('RESULT:', 'ALL OK' if all(res) else 'FAILURES')
sys.exit(0 if all(res) else 1)
