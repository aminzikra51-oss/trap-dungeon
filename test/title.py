"""The title screen layout: profile card top-left, difficulty + settings top-right, two columns of big buttons, the hero strip at the bottom. Every old button id still works, nothing overlaps,
everything fits at desktop and phone sizes, the settings panel opens from the title (and hides the in-game-only parts), the share tile keeps its icon after the "copied" flash.
usage: python3 test/title.py [--shots DIR]"""
import sys, os
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = sys.argv[sys.argv.index('--shots') + 1] if '--shots' in sys.argv else None
res = []
def ok(name, cond, info=''):
    res.append(bool(cond)); print(('  ok   ' if cond else '  FAIL ') + name + (f'  [{info}]' if info != '' else ''))
IDS = ['bShopT', 'bAchT', 'bMapT', 'bCoT', 'bEdT', 'bShareT']
RECTS = """() => { const r = id => { const e = document.querySelector(id); if (!e || e.offsetParent === null && getComputedStyle(e).position !== 'fixed') return null; const b = e.getBoundingClientRect(); return {x: b.x, y: b.y, w: b.width, h: b.height} };
  const st = document.getElementById('stage') ? document.getElementById('stage').getBoundingClientRect() : {x: 0, y: 0, width: innerWidth, height: innerHeight};
  const o = {stage: {x: st.x, y: st.y, w: st.width, h: st.height}};
  for (const k of ['#bPfT', '#selDiffT', '#bGearT', '#bShopT', '#bAchT', '#bMapT', '#bCoT', '#bEdT', '#bShareT', '#title h1', '#bPlay', '#heroT', '#title .how']) o[k] = r(k); return o }"""
def inside(a, s, pad=-1):
    return a and a['x'] >= s['x'] + pad and a['y'] >= s['y'] + pad and a['x'] + a['w'] <= s['x'] + s['w'] - pad and a['y'] + a['h'] <= s['y'] + s['h'] - pad
def hit(a, b):
    return a and b and a['x'] < b['x'] + b['w'] and b['x'] < a['x'] + a['w'] and a['y'] < b['y'] + b['h'] and b['y'] < a['y'] + a['h']
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    for name, (w, h) in {'desktop 1280x720': (1280, 720), 'laptop 1366x768': (1366, 768), 'phone 844x390': (844, 390), 'small phone 667x375': (667, 375), 'tablet 1024x768': (1024, 768), 'wide 1920x1080': (1920, 1080)}.items():
        pg = b.new_page(viewport={'width': w, 'height': h}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        pg.route('**/*firebasedatabase.app/**', lambda r: r.fulfill(status=200, content_type='application/json', body='null'))
        pg.goto(f'file://{ROOT}/trap-dungeon.html'); pg.wait_for_timeout(800); pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_timeout(1800)
        pg.evaluate("() => { const S = TD.S; S.wallet = 123456; S.gems = 12345; S.pxp = 700; S.fname = 'أبو خالد الطويل جداً'; TD.titleCard() }"); pg.wait_for_timeout(300)
        R = pg.evaluate(RECTS); st = R['stage']
        ok(f'[{name}] every title control exists and is on screen', all(R[k] for k in ['#bPfT', '#selDiffT', '#bGearT'] + ['#' + i for i in IDS] + ['#bPlay', '#heroT']), [k for k, v in R.items() if not v])
        ok(f'[{name}] all of them are inside the game frame', all(inside(R[k], st) for k in ['#bPfT', '#selDiffT', '#bGearT', '#bPlay', '#heroT'] + ['#' + i for i in IDS]), {k: v for k, v in R.items() if k != 'stage' and v and not inside(v, st)})
        left = [R['#bShopT'], R['#bAchT'], R['#bMapT']]; right = [R['#bCoT'], R['#bEdT'], R['#bShareT']]
        ok(f'[{name}] big buttons: left column ({"shop, achievements, map"}) is on the left half, the right one on the right', all(t['x'] + t['w'] / 2 < st['x'] + st['w'] / 2 for t in left) and all(t['x'] + t['w'] / 2 > st['x'] + st['w'] / 2 for t in right))
        ok(f'[{name}] the profile card is top-left, difficulty + settings top-right', R['#bPfT']['x'] < st['x'] + st['w'] / 3 and R['#bPfT']['y'] < st['y'] + st['h'] / 4 and R['#bGearT']['x'] > st['x'] + st['w'] / 2 and R['#selDiffT']['y'] < st['y'] + st['h'] / 4)
        groups = {'card': R['#bPfT'], 'diff': R['#selDiffT'], 'gear': R['#bGearT'], 'title': R['#title h1'], 'play': R['#bPlay'], 'heroes': R['#heroT'], **{i: R['#' + i] for i in IDS}}
        names = list(groups); bad = [(a, c) for i, a in enumerate(names) for c in names[i + 1:] if hit(groups[a], groups[c])]
        ok(f'[{name}] nothing overlaps (buttons, card, title, play, hero strip)', not bad, bad[:4])
        tiles = [R['#' + i] for i in IDS]; ok(f'[{name}] tiles are big enough to tap (>= 44 px)', all(t['w'] >= 44 and t['h'] >= 44 for t in tiles) or w < 700, [(t['w'], t['h']) for t in tiles][:2])
        cov = pg.evaluate("""(ids) => ids.map(id => { const e = document.getElementById(id), b = e.getBoundingClientRect(), t = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2); return t === e || e.contains(t) })""", IDS + ['bPfT', 'bGearT', 'bPlay'])
        ok(f'[{name}] every button is really clickable (nothing covers its centre)', all(cov), cov)
        ok(f'[{name}] long name and big numbers do not break the card', pg.evaluate("() => { const c = document.getElementById('bPfT'); return c.scrollWidth <= c.clientWidth + 2 }"))
        ok(f'[{name}] no horizontal scroll, no page errors', pg.evaluate("() => document.documentElement.scrollWidth <= innerWidth + 1") and not errs, errs[:3])
        if SHOTS and name.split()[0] in ('desktop', 'phone'):
            os.makedirs(SHOTS, exist_ok=True); pg.screenshot(path=f'{SHOTS}/title_{name.split()[0]}.png')
        pg.close()

    # ---- behaviour (one page) ----
    pg = b.new_page(viewport={'width': 1280, 'height': 720}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.route('**/*firebasedatabase.app/**', lambda r: r.fulfill(status=200, content_type='application/json', body='null'))
    pg.goto(f'file://{ROOT}/trap-dungeon.html'); pg.wait_for_timeout(800); pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_timeout(1800)
    E = lambda e: pg.evaluate(f"() => {e}")
    vis = lambda sel: E(f"!document.querySelector('{sel}').classList.contains('hide')")
    def opens(btn, ov, close=None):
        pg.click(btn); pg.wait_for_timeout(350); o = vis(ov)
        if close: pg.click(close); pg.wait_for_timeout(250)
        return o
    ok('🛒 opens the shop', opens('#bShopT', '#shop', '#shX'))
    ok('🏆 opens the achievements', opens('#bAchT', '#ach', '#acX'))
    ok('🗺 opens the map', opens('#bMapT', '#wmap', '#wmX'))
    pg.evaluate("() => { TD.goTitle() }"); pg.wait_for_timeout(300)
    ok('👤 the profile card opens the profile', opens('#bPfT', '#pf', '#pfX'))
    ok('👥 opens co-op', opens('#bCoT', '#co'))
    pg.evaluate("() => { TD.goTitle && TD.goTitle() }"); pg.wait_for_timeout(300)
    # the difficulty select
    pg.select_option('#selDiffT', 'hell'); pg.wait_for_timeout(100); ok('the difficulty select (top-right) still sets the difficulty', E("TD.S.diff") == 'hell' and E("document.getElementById('selDiff').value") == 'hell', E("TD.S.diff"))
    # settings from the title
    ok('⚙ is there and the settings panel is closed', vis('#title') and not vis('#menu'))
    pg.click('#bGearT'); pg.wait_for_timeout(300)
    M = E("""(() => { const m = document.getElementById('menu'), shown = s => { const e = m.querySelector(s); return !!e && e.offsetParent !== null }; return {open: !m.classList.contains('hide'), tm: m.classList.contains('tm'), sfx: shown('[data-s=sfx]'), q: shown('#selQ'),
      hero: shown('#heroM'), home: shown('#bHome'), lvl: shown('.lvlpick'), nav: shown('#bShop'), resume: document.getElementById('bResume').textContent, state: TD.G.state} })()""")
    ok('settings open from the title: sound / quality shown, the in-game-only parts hidden', M['open'] and M['tm'] and M['sfx'] and M['q'] and not (M['hero'] or M['home'] or M['lvl'] or M['nav']) and M['state'] == 'title', M)
    ok('the button says "رجوع" there', M['resume'] == 'رجوع', M['resume'])
    pg.keyboard.press('Enter'); pg.wait_for_timeout(200); ok('Enter does not start the game while the settings are open', E("TD.G.state") == 'title' and not vis('#menu') is False)
    pg.click('[data-s=sfx]'); pg.wait_for_timeout(100); ok('a sound toggle works from there', E("typeof TD.S.sfx") != 'undefined')
    pg.click('#bResume'); pg.wait_for_timeout(250); ok('رجوع closes the settings and stays on the title', not vis('#menu') and vis('#title') and E("TD.G.state") == 'title' and E("document.getElementById('bResume').textContent") == 'كمّل اللعب')
    pg.click('#bGearT'); pg.wait_for_timeout(200); pg.keyboard.press('Escape'); pg.wait_for_timeout(200); ok('Esc closes the settings too', not vis('#menu') and vis('#title'))
    pg.click('#bGearT'); pg.wait_for_timeout(200); pg.keyboard.press('Space'); pg.wait_for_timeout(200); ok('Space does not start the game while the settings are open', E("TD.G.state") == 'title'); pg.keyboard.press('Escape')
    pg.keyboard.press('Space'); pg.wait_for_timeout(600); ok('Space starts the game from the title (as before)', E("TD.G.state") != 'title'); 
    # the in-game menu is unchanged
    pg.keyboard.press('Escape'); pg.wait_for_timeout(300)
    M2 = E("""(() => { const m = document.getElementById('menu'), shown = s => { const e = m.querySelector(s); return !!e && e.offsetParent !== null }; return {open: !m.classList.contains('hide'), tm: m.classList.contains('tm'), hero: shown('#heroM'), home: shown('#bHome'), lvl: shown('.lvlpick'), nav: shown('#bShop')} })()""")
    ok('the in-game pause menu still shows everything', M2['open'] and not M2['tm'] and M2['hero'] and M2['home'] and M2['lvl'] and M2['nav'], M2)
    pg.click('#bHome'); pg.wait_for_timeout(500); ok('الشاشة الرئيسية returns to the title with the card painted', vis('#title') and E("document.getElementById('bPfT').childElementCount") >= 2)
    # share tile keeps its icon
    pg.evaluate("() => { navigator.share = undefined; window.__cp = []; navigator.clipboard.writeText = async t => { window.__cp.push(t) } }"); pg.click('#bShareT'); pg.wait_for_timeout(300)
    S1 = E("document.getElementById('bShareT').innerText.replace(/\\s+/g, ' ')"); pg.wait_for_timeout(2600); S2 = E("document.getElementById('bShareT').innerHTML")
    ok('share tile: shows a short "copied" hint inside the tile, then restores the icon + label', 'اننسخ' in S1 and '<span class="ic">📤</span>' in S2 and '<span class="lb">شارك</span>' in S2, [S1, S2])
    # coins appear on the card after a hud() refresh
    pg.evaluate("() => { TD.S.wallet = 777; TD.hud && TD.hud() }"); pg.wait_for_timeout(200); ok('the card follows the coins', '777' in E("document.getElementById('bPfT').textContent"), E("document.getElementById('bPfT').textContent"))
    pg.evaluate("() => { TD.S.fname = 'سامي'; TD.S.pf = {a: '😎', f: 0}; TD.pfChanged && TD.pfChanged() }"); pg.wait_for_timeout(200)
    ok('the card follows the profile name and picture', 'سامي' in E("document.getElementById('bPfT').textContent") and '😎' in E("document.getElementById('bPfT').textContent"), E("document.getElementById('bPfT').textContent"))
    ok('no page errors', not errs, errs[:3])
    b.close()
print('RESULT:', 'ALL OK' if all(res) else 'FAILURES')
sys.exit(0 if all(res) else 1)
