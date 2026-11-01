"""Admin console: opens with the backquote key, is locked until a passphrase is set / given, refuses online, edits the save; and the PUBLIC build has none of it.
usage: python3 test/admin.py [--shots DIR]"""
import sys, os, re
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = sys.argv[sys.argv.index('--shots') + 1] if '--shots' in sys.argv else None
res = []
def ok(name, cond, info=''):
    res.append(bool(cond)); print(('  ok   ' if cond else '  FAIL ') + name + (f'  [{info}]' if info != '' else ''))

# ---- static: what players get has no console ----
for f in ('site/index.html', 'trap-dungeon.artifact.html'):
    t = open(f'{ROOT}/{f}', encoding='utf-8').read()
    ok(f'{f}: no console code at all', 'setpass' not in t and 'ADM_OPEN' not in t and "box.id='adm'" not in t)
for f in ('trap-dungeon.html', 'docs/index.html'):
    t = open(f'{ROOT}/{f}', encoding='utf-8').read()
    ok(f'{f}: private builds keep the console', 'setpass' in t and 'ADM_OPEN' in t)

LOG = "() => document.getElementById('adm').innerText"
def cmd(pg, line):
    pg.fill('#adm input', line); pg.press('#adm input', 'Enter'); pg.wait_for_timeout(60)

with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    # ---- the public site: Backquote does nothing ----
    pg = b.new_page(viewport={'width': 960, 'height': 540}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(f'file://{ROOT}/site/index.html'); pg.wait_for_timeout(500)
    pg.keyboard.press('Backquote'); pg.wait_for_timeout(100)
    ok('public build: backquote opens nothing', pg.evaluate("() => !document.getElementById('adm') && !window.ADM_OPEN"))
    pg.close()

    pg = b.new_page(viewport={'width': 960, 'height': 540}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto(f'file://{ROOT}/trap-dungeon.html'); pg.wait_for_timeout(500)
    pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_timeout(500)
    T = "window.TD"
    ok('console starts closed', pg.evaluate("() => document.getElementById('adm').style.display") == 'none')
    pg.keyboard.press('Backquote'); pg.wait_for_timeout(120)
    ok('backquote opens it and focuses the input', pg.evaluate("() => document.getElementById('adm').style.display === 'flex' && document.activeElement === document.querySelector('#adm input')"))
    cmd(pg, 'coins 999')
    ok('locked: nothing works before a passphrase exists', pg.evaluate("() => TD.S.wallet|0") == 0 and 'setpass' in pg.evaluate(LOG))
    cmd(pg, 'setpass ab'); ok('a passphrase shorter than 3 is refused', pg.evaluate("() => typeof TD.S.admh") == 'undefined')
    cmd(pg, 'setpass secret1'); ok('setpass stores a number (hash), not the word', pg.evaluate("() => typeof TD.S.admh") == 'number' and 'secret1' not in pg.evaluate("() => localStorage.getItem('td_s')"))
    ok('the typed word is not echoed in the log', 'secret1' not in pg.evaluate(LOG))
    pg.evaluate("() => { window.__lock = 1 }")
    cmd(pg, 'lock'); cmd(pg, 'coins 5'); ok('lock locks again', pg.evaluate("() => TD.S.wallet|0") == 0)
    cmd(pg, 'auth wrong'); cmd(pg, 'coins 5'); ok('a wrong word does not unlock', pg.evaluate("() => TD.S.wallet|0") == 0)
    cmd(pg, 'auth secret1'); cmd(pg, 'coins 250'); ok('auth with the right word, then coins', pg.evaluate("() => TD.S.wallet") == 250 and pg.evaluate("() => TD.S.adm") == 1)
    cmd(pg, 'give -50'); ok('give adds (and can subtract)', pg.evaluate("() => TD.S.wallet") == 200)
    cmd(pg, 'best 12'); ok('best sets progress and fills 1-star for earlier levels', pg.evaluate("() => [TD.S.best, TD.S.cl[11], TD.S.cl[1], TD.S.cl[12]||0]") == [12, 1, 1, 0])
    cmd(pg, 'stars 3 1 5'); ok('stars sets a range', pg.evaluate("() => [1,2,3,4,5,6].map(n => TD.S.cl[n])") == [3, 3, 3, 3, 3, 1])
    cmd(pg, 'stars max'); ok('stars max covers every cleared level', pg.evaluate("() => Object.keys(TD.S.cl).filter(k => +k < TD.S.best).every(k => TD.S.cl[k] === 3)"))
    cmd(pg, 'diff hell'); ok('diff changes the setting', pg.evaluate("() => TD.S.diff") == 'hell')
    cmd(pg, 'diff nightmare'); ok('nightmare is never selectable in single player', pg.evaluate("() => TD.S.diff") == 'hell')
    cmd(pg, 'unlock heroes'); ok('unlock heroes', pg.evaluate("() => Object.keys(TD.S.own).length") >= 8)
    cmd(pg, 'unlock worlds'); ok('unlock worlds', pg.evaluate("() => Object.keys(TD.S.ow).length") >= 10)
    cmd(pg, 'unlock acc'); ok('unlock acc', pg.evaluate("() => Object.keys(TD.S.aq).length") > 10)
    cmd(pg, 'hero robot'); ok('hero selects and owns', pg.evaluate("() => TD.S.hero") == 'robot')
    cmd(pg, 'stage robot 3'); ok('stage is 1-based on the command line, 0-based in the save', pg.evaluate("() => TD.S.hs.robot") == 2)
    cmd(pg, 'stage all 1'); ok('stage all', pg.evaluate("() => Object.values(TD.S.hs).every(v => v === 0)"))
    cmd(pg, 'xp robot 30'); ok('xp', pg.evaluate("() => TD.S.hx.robot") == 30)
    cmd(pg, 'goto 3'); pg.wait_for_timeout(300)
    ok('goto starts the level and closes the console', pg.evaluate("() => TD.G.level === 3 && TD.G.state === 'play'") and pg.evaluate("() => document.getElementById('adm').style.display") == 'none')
    # god / speed / kill / win
    pg.keyboard.press('Backquote'); pg.wait_for_timeout(100)
    ok('the game is frozen while the console is open', pg.evaluate("() => { const t0 = TD.G.t; return new Promise(r => setTimeout(() => r(TD.G.t === t0), 400)) }"))
    cmd(pg, 'god on'); pg.keyboard.press('Backquote'); pg.wait_for_timeout(100)
    pg.evaluate("() => TD.die('spike', null)"); ok('god: a spike does nothing', pg.evaluate("() => TD.G.state") == 'play')
    pg.keyboard.press('Backquote'); pg.wait_for_timeout(100); cmd(pg, 'god off'); pg.keyboard.press('Backquote'); pg.wait_for_timeout(100)
    pg.keyboard.press('Backquote'); pg.wait_for_timeout(100); cmd(pg, 'kill'); ok('kill', pg.evaluate("() => TD.G.state") == 'dead')
    pg.evaluate("() => { TD.retry(); TD.G.state = 'play' }"); pg.wait_for_timeout(100)
    pg.keyboard.press('Backquote'); pg.wait_for_timeout(100); cmd(pg, 'speed 2'); pg.keyboard.press('Backquote'); pg.wait_for_timeout(100)
    ok('speed 2 runs the game faster', pg.evaluate("() => { const t0 = TD.G.t; return new Promise(r => setTimeout(() => r(TD.G.t - t0), 1000)) }") > 1.5)
    pg.keyboard.press('Backquote'); pg.wait_for_timeout(100); cmd(pg, 'speed 1')
    cmd(pg, 'tp 20'); ok('tp moves the player', abs(pg.evaluate("() => TD.P.x") - 640) < 2)
    cmd(pg, 'win'); pg.wait_for_timeout(200); ok('win finishes the level', pg.evaluate("() => TD.G.state") == 'win')
    if SHOTS:
        os.makedirs(SHOTS, exist_ok=True); pg.keyboard.press('Backquote'); pg.wait_for_timeout(100); cmd(pg, 'help'); pg.locator('#stage').screenshot(path=f'{SHOTS}/admin.png')
    # export / import round trip
    pg.evaluate("() => { document.getElementById('adm').style.display === 'none' && window.ADM_OPEN(true) }")
    cmd(pg, 'save export'); txt = pg.evaluate("() => { const d = document.getElementById('adm').lastChild; return [...document.getElementById('adm').firstChild.childNodes].map(n => n.textContent).filter(t => /^[A-Za-z0-9+/=]{80,}$/.test(t)).pop() || '' }")
    ok('save export prints a base64 blob', len(txt) > 80, len(txt))
    # online: refused
    w0 = pg.evaluate("() => TD.S.wallet"); pg.evaluate("() => { TD.NET.link = 'conn' }"); cmd(pg, 'coins 1'); ok('refused while online', pg.evaluate("() => TD.S.wallet") == w0 and 'أونلاين' in pg.evaluate(LOG))
    pg.evaluate("() => { TD.NET.link = 'off' }")
    cmd(pg, 'nonsense'); ok('unknown command is reported', 'غير معروف' in pg.evaluate(LOG))
    ok('no page errors', not errs, errs[:3])
    b.close()
print('RESULT:', 'ALL OK' if all(res) else 'FAILURES')
sys.exit(0 if all(res) else 1)
