"""Gems: the exchange (gems -> coins, gems -> player xp), the "buy gems" packs (free test buttons in the private build, 'soon' in the public one), skins paid with gems,
the shop tab 💎, the profile card on the title screen, and the difference between the private build (always shows 💎/🔰) and the public build (only once you have some).
usage: python3 test/gemshop.py [--shots DIR]"""
import sys, os
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = sys.argv[sys.argv.index('--shots') + 1] if '--shots' in sys.argv else None
res = []
def ok(name, cond, info=''):
    res.append(bool(cond)); print(('  ok   ' if cond else '  FAIL ') + name + (f'  [{info}]' if info != '' else ''))

def fresh(b, page, w=960, h=540):
    pg = b.new_page(viewport={'width': w, 'height': h}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.route('**/*firebasedatabase.app/**', lambda r: r.fulfill(status=200, content_type='application/json', body='null'))
    pg.goto(f'file://{ROOT}/{page}'); pg.wait_for_timeout(1200); pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_timeout(1500)
    return pg, errs

with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])

    # ================= private build =================
    pg, errs = fresh(b, 'trap-dungeon.html')
    E = lambda e: pg.evaluate(f"() => {e}")
    X = E("(() => { const G = TD.GEMX; return {c: G.coins, x: G.xp, p: G.packs.map(a => a[0]), skin: G.skin, b: [0, 1, 2].map(i => TD.gemBonus(G.coins, i)), bx: [0, 1, 2].map(i => TD.gemBonus(G.xp, i))} })()")
    ok('rates table: 3 coin packs, 3 xp packs, 4 gem packs, 10 coins per gem for skins', len(X['c']) == 3 and len(X['x']) == 3 and len(X['p']) == 4 and X['skin'] == 10, X)
    ok('bigger packs carry a bonus (0 / +10 / +20 %)', X['b'] == [0, 10, 20] and X['bx'] == [0, 10, 20], [X['b'], X['bx']])

    L = E("""(() => { const T = TD, S = T.S, r = {}; S.gems = 0; S.pxp = 0; S.wallet = 50; T.gemAdd(0);
      r.poorC = [T.gemBuyCoins(0), S.gems, S.wallet];                                    // no gems: refused, nothing changes
      S.gems = 120; r.c0 = [T.gemBuyCoins(0), S.gems, S.wallet];                        // 10 gems -> 100 coins
      r.c2 = [T.gemBuyCoins(2), S.gems, S.wallet];                                      // 100 gems -> 1200 coins
      r.poor2 = [T.gemBuyCoins(1), S.gems, S.wallet];                                   // 10 gems left, needs 50
      r.badIdx = [T.gemBuyCoins(9), T.gemBuyCoins(-1), T.gemBuyXp(7), T.gemPack(9), T.gemBuyCoins('x')];
      S.gems = 60; S.pxp = 0; const l0 = T.plLevel(); r.x0 = [T.gemBuyXp(0), S.gems, S.pxp, T.plLevel()];   // 10 gems -> 100 xp -> level 2
      r.x1 = [T.gemBuyXp(1), S.gems, S.pxp, T.plLevel()];                              // 50 gems -> 550 xp
      r.poorX = [T.gemBuyXp(2), S.gems, S.pxp];
      S.gems = 5; r.spend = [T.gemSpend(-5), T.gemSpend(NaN), T.gemSpend(0), T.gemSpend(1e9), T.gemSpend('3'), S.gems];
      r.l0 = l0; return r })()""")
    ok('no gems: buying coins is refused and nothing changes', L['poorC'] == ['poor', 0, 50], L['poorC'])
    ok('10 💎 -> 100 🪙', L['c0'] == ['ok', 110, 150], L['c0'])
    ok('100 💎 -> 1200 🪙 (the +20% pack)', L['c2'] == ['ok', 10, 1350], L['c2'])
    ok('not enough gems for the 50 pack: refused, nothing changes', L['poor2'] == ['poor', 10, 1350], L['poor2'])
    ok('a pack number that does not exist is refused', L['badIdx'] == ['none', 'none', 'none', 'none', 'none'], L['badIdx'])
    ok('10 💎 -> 100 XP -> level 2', L['x0'] == ['ok', 50, 100, 2] and L['l0'] == 1, L['x0'])
    ok('50 💎 -> 550 XP', L['x1'] == ['ok', 0, 650, 4], L['x1'])
    ok('xp for gems: refused when poor', L['poorX'] == ['poor', 0, 650], L['poorX'])
    ok('gemSpend refuses negatives, NaN, zero, too much; accepts a numeric string', L['spend'] == [False, False, False, False, True, 2], L['spend'])

    G = E("""(() => { const T = TD, S = T.S, r = {}; S.gems = 5; S.wallet = 10;
      r.pack = [T.gemPack(0), S.gems]; r.packBig = [T.gemPack(3), S.gems]; S.gems = 999990; r.cap = [T.gemPack(3), S.gems]; return r })()""")
    ok('private build: a pack is a free test purchase (+80 💎)', G['pack'] == ['ok', 85] and G['packBig'] == ['ok', 2285], G)
    ok('gems stop at the cap', G['cap'][1] == 999999, G['cap'])

    # ---- skins with gems ----
    K = E("""(() => { const T = TD, S = T.S, r = {}; S.own.falafel = 1; S.own.cat = 1; S.hso = {}; S.hsk = {}; S.gems = 100; S.wallet = 5;
      r.price = [T.skinGemPrice('falafel', 1), T.skinGemPrice('falafel', 2), T.skinGemPrice('cat', 1)];
      S.gems = 10; r.poor = [T.skinBuy('falafel', 2, 'gem'), S.gems, S.hso['falafel:2'] | 0]; S.gems = 100;
      r.buy = [T.skinBuy('falafel', 2, 'gem'), S.gems, S.wallet, S.hso['falafel:2'], T.skinSaved('falafel')];       // 45 gems; coins untouched; worn
      r.again = [T.skinBuy('falafel', 2, 'gem'), S.gems];
      r.coin = [T.skinBuy('cat', 1), S.wallet, S.gems];                                                          // default is still coins: poor (5 coins)
      S.own.uncle = 0; r.notOwned = T.skinBuy('uncle', 1, 'gem'); r.k0 = T.skinBuy('falafel', 0, 'gem'); return r })()""")
    ok('skin price in gems = coins / 10 (300 -> 30, 450 -> 45)', K['price'] == [30, 45, 30], K['price'])
    ok('skin with gems: poor -> nothing happens', K['poor'] == ['poor', 10, 0], K['poor'])
    ok('skin with gems: paid in gems, coins untouched, owned and worn', K['buy'] == ['ok', 55, 5, 1, 2], K['buy'])
    ok('already owned: no second charge', K['again'] == ['owned', 55], K['again'])
    ok('the default currency is still coins', K['coin'] == ['poor', 5, 55], K['coin'])
    ok('a hero you do not own / skin 0 cannot be bought', K['notOwned'] == 'none' and K['k0'] == 'none', [K['notOwned'], K['k0']])

    # ---- the shop tab ----
    pg.evaluate("() => { const T = TD, S = T.S; S.gems = 0; S.pxp = 0; S.wallet = 300; S.hso = {}; S.hsk = {}; S.look3d = true; T.openShop('h') }"); pg.wait_for_timeout(300)
    ok('private build: the 💎 tab is there even with 0 gems', E("!document.querySelector('#shTabs [data-t=g]').classList.contains('hide')"))
    ok('the header shows the gems next to the coins', E("document.getElementById('shW').textContent.includes('💎')"), E("document.getElementById('shW').textContent"))
    pg.click('#shTabs [data-t=g]'); pg.wait_for_timeout(400)
    T = E("""(() => { const q = s => [...document.querySelectorAll(s)]; return {secs: q('#shGrid .gxs').length, cards: q('#shGrid .gxs').map(s => s.querySelectorAll('.shc').length),
      poor: q('#shGrid .gxs:nth-of-type(n+3) .btn.poor').length, over: document.getElementById('shGrid').scrollWidth > document.getElementById('shGrid').clientWidth + 2,
      packBtns: q('#shGrid .gxs:nth-of-type(2) .btn').map(b => b.textContent), top: document.querySelector('#shGrid .gxtop').textContent} })()""")
    ok('three blocks: 4 packs + 3 coin offers + 3 xp offers', T['secs'] == 3 and T['cards'] == [4, 3, 3], T)
    ok('with 0 gems every exchange button is greyed (poor) and says how many are missing', T['poor'] == 6, T['poor'])
    ok('test packs say "جرّب" in the private build', all('جرّب' in t for t in T['packBtns']), T['packBtns'])
    ok('no horizontal overflow in the tab', not T['over'])
    pg.click('#shGrid .gxs:nth-of-type(2) .shc:nth-child(1) .btn'); pg.wait_for_timeout(300)
    ok('clicking the first pack adds 80 💎', E("TD.S.gems") == 80, E("TD.S.gems"))
    pg.click('#shGrid .gxs:nth-of-type(3) .shc:nth-child(1) .btn'); pg.wait_for_timeout(300)
    ok('clicking the 10 💎 offer: 100 🪙 more, 70 💎 left', E("TD.S.wallet") == 400 and E("TD.S.gems") == 70, [E("TD.S.wallet"), E("TD.S.gems")])
    pg.click('#shGrid .gxs:nth-of-type(4) .shc:nth-child(1) .btn'); pg.wait_for_timeout(300)
    ok('clicking the xp offer: +100 XP -> level 2, 60 💎 left', E("TD.S.pxp") == 100 and E("TD.plLevel()") == 2 and E("TD.S.gems") == 60, [E("TD.S.pxp"), E("TD.S.gems")])
    ok('the message line says what happened', E("document.getElementById('shMsg').textContent").strip() != '', E("document.getElementById('shMsg').textContent"))
    if SHOTS:
        os.makedirs(SHOTS, exist_ok=True); pg.screenshot(path=f'{SHOTS}/gem_tab.png')

    # ---- the skin card in the shop: the gems button ----
    pg.evaluate("() => { const T = TD, S = T.S; S.gems = 100; S.wallet = 5; S.hso = {}; S.hsk = {}; T.openShop('u') }"); pg.wait_for_timeout(300)
    pg.evaluate("() => document.querySelector('#shGrid .shc.up .skc .tg.sk[data-k=\"1\"]').click()"); pg.wait_for_timeout(500)
    S1 = E("""(() => { const c = document.querySelector('#shGrid .shc.up'), bs = [...c.querySelectorAll('.skr .btn')]; return {n: bs.length, txt: bs.map(x => x.textContent), gem: !!c.querySelector('.skr .btn[data-cur=gem]')} })()""")
    ok('a locked skin shows two buy buttons: coins and gems', S1['n'] == 2 and S1['gem'] and '💎 30' in S1['txt'][1] and '🪙 300' in S1['txt'][0], S1)
    pg.click('#shGrid .shc.up .skr .btn[data-cur=gem]'); pg.wait_for_timeout(400)
    ok('the gems button buys it: 70 💎 left, coins 5, worn', E("TD.S.gems") == 70 and E("TD.S.wallet") == 5 and E("TD.skinSaved('falafel')") == 1, [E("TD.S.gems"), E("TD.S.wallet"), E("TD.skinSaved('falafel')")])
    pg.evaluate("() => { document.getElementById('shX').click() }"); pg.wait_for_timeout(200)

    # ---- the profile card on the title screen ----
    pg.evaluate("() => { const S = TD.S; S.wallet = 666; S.gems = 120; S.pxp = 700; TD.titleCard() }"); pg.wait_for_timeout(300)
    C = E("""(() => { const c = document.getElementById('bPfT'); return {t: c.textContent, bar: c.querySelector('.pfxb i') && c.querySelector('.pfxb i').style.width, av: !!c.querySelector('.pfav')} })()""")
    ok('the title card shows coins, gems, level and the xp bar (700 xp = level 4, 25%)', '666' in C['t'] and '120' in C['t'] and 'مستوى 4' in C['t'] and C['bar'] == '25%' and C['av'], C)
    ok('the card is the profile button', E("(() => { document.getElementById('bPfT').click(); const o = !document.getElementById('pf').classList.contains('hide'); document.getElementById('pfX').click(); return o })()"))
    ok('private build: no page errors', not errs, errs[:3])
    pg.close()

    # ================= public build =================
    pg, errs = fresh(b, 'site/index.html')
    E = lambda e: pg.evaluate(f"() => {e}")
    ok('public build: no admin console, flags off', E("typeof TD.S === 'object'") and not E("!!document.getElementById('adm')"))
    P0 = E("""(() => { const S = TD.S; S.gems = 0; S.pxp = 0; S.wallet = 40; TD.openShop('h'); const t = document.querySelector('#shTabs [data-t=g]').classList.contains('hide');
      const c = document.getElementById('bPfT').textContent; TD.openShop('g'); return {tabHidden: t, card: c, tab: document.querySelector('#shTabs .ch.on').dataset.t, header: document.getElementById('shW').textContent} })()""")
    ok('public build, no gems: the 💎 tab is hidden, the card shows no gems / level', P0['tabHidden'] and '💎' not in P0['card'] and '🔰' not in P0['card'], P0)
    ok('public build, no gems: the in-level HUD shows neither 💎 nor 🔰', E("document.getElementById('hGem').classList.contains('hide') && document.getElementById('hPl').classList.contains('hide') && !TD.plOn()"))
    ok('public build: asking for the gems tab with none falls back to the heroes tab', P0['tab'] == 'h' and '💎' not in P0['header'], P0)
    pg.evaluate("() => { TD.S.gems = 50; TD.S.wallet = 0; TD.openShop('g') }"); pg.wait_for_timeout(300)
    Q = E("""(() => { return {tab: !document.querySelector('#shTabs [data-t=g]').classList.contains('hide'), packs: [...document.querySelectorAll('#shGrid .gxs:nth-of-type(2) .btn')].map(b => b.textContent),
      pack: [TD.gemPack(0), TD.S.gems], hint: document.querySelector('#shGrid .gxs .gxh') ? document.querySelector('#shGrid .gxs .gxh').textContent : ''} })()""")
    ok('public build with gems: the tab shows, packs say "قريباً" and cannot be bought', Q['tab'] and all('قريباً' in t for t in Q['packs']) and Q['pack'] == ['soon', 50], Q)
    ok('public build: the packs block says real payment is not live yet', 'قريباً' in Q['hint'], Q['hint'])
    pg.click('#shGrid .gxs:nth-of-type(3) .shc:nth-child(1) .btn'); pg.wait_for_timeout(300)
    ok('public build: the exchange itself works (10 💎 -> 100 🪙)', E("TD.S.gems") == 40 and E("TD.S.wallet") == 100, [E("TD.S.gems"), E("TD.S.wallet")])
    ok('public build: no page errors', not errs, errs[:3])
    pg.close()
    b.close()
print('RESULT:', 'ALL OK' if all(res) else 'FAILURES')
sys.exit(0 if all(res) else 1)
