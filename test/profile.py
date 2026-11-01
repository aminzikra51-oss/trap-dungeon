"""Player profile (name, picture, frames, stats card, friends' ranking, backup code), coin gifts between friends, emoji / phrases between online players.
usage: python3 test/profile.py [--shots DIR]"""
import sys, os, time, json, threading, http.server, socketserver, functools
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fake_rtdb import FakeRtdb
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = sys.argv[sys.argv.index('--shots') + 1] if '--shots' in sys.argv else None
res = []
def ok(name, cond, info=''):
    res.append(bool(cond)); print(('  ok   ' if cond else '  FAIL ') + name + (f'  [{info}]' if info != '' else ''))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.TCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); srv.allow_reuse_address = True
threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = f'http://127.0.0.1:{srv.server_address[1]}/trap-dungeon.html'
db = FakeRtdb(0.0)
errs = []

def mk(b, nu=None, ctx=None):
    ctx = ctx or b.new_context(viewport={'width': 1000, 'height': 600}); pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text + ' @ ' + str(m.location.get('url', ''))[:90]) if m.type == 'error' else None)
    pg.goto(URL); pg.wait_for_timeout(500)
    if nu is not None: pg.evaluate("(nu) => { window.TD.S.nu = nu; localStorage.setItem('td_s', JSON.stringify(window.TD.S)) }", nu)
    return pg
def wait(pg, js, ms=6000, step=120):
    t = time.time()
    while time.time() - t < ms / 1000:
        if pg.evaluate(js): return True
        pg.wait_for_timeout(step)
    return False
def online_tab(pg):
    pg.evaluate("() => { window.TD.coOpen(''); document.getElementById('coTabN').click(); document.getElementById('frBox').open = true }"); pg.wait_for_timeout(150)
SHOWN = "() => { const c = document.getElementById('frCard'); return !c.classList.contains('hide') && c.textContent !== '' }"
CARD = "() => { const c = document.getElementById('frCard'); return c.classList.contains('hide') ? '' : c.textContent }"
def cardbtn(pg, label):
    return pg.evaluate("(l) => { for (const b of document.querySelectorAll('#frCard button')) if (b.textContent.includes(l)) { b.click(); return true } return false }", label)

with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    # ================= 1. the profile on its own (no network) =================
    print('profile')
    S1 = mk(b, nu='-')
    S1.evaluate("() => { const T = window.TD; T.S.cl = {}; T.S.best = 1 }")
    P = S1.evaluate("() => { const T = window.TD, p = T.pfGet(); return {a: p.a, f: p.f, n: T.PF_EMO.length, fr: T.PF_FR.length} }")
    ok('default picture = my hero, no frame; 24 emojis; 6 frames', P == {'a': 'h', 'f': 0, 'n': 24, 'fr': 6}, P)
    S1.evaluate("() => { window.TD.S.hero = 'falafel'; window.TD.S.hs.falafel = 3; window.TD.openPf() }"); S1.wait_for_timeout(400)
    U = S1.evaluate("""() => ({open: window.TD.PF.open, vis: !document.getElementById('pf').classList.contains('hide'), av: document.querySelectorAll('#pfHead .pfav canvas').length,
      emo: document.querySelectorAll('#pfPick .tg.em').length, stats: document.querySelectorAll('#pfStats .pfst').length, code: document.querySelector('.pfcode b').textContent})""")
    ok('the panel opens: picture (hero face drawn), 24 emoji buttons, 6 stat tiles, my code', U['open'] and U['vis'] and U['av'] == 1 and U['emo'] == 24 and U['stats'] == 6 and len(U['code']) == 9, U)
    ok('the game keys are ignored while it is open', S1.evaluate("() => { const T = window.TD; T.K.r = false; window.dispatchEvent(new KeyboardEvent('keydown', {code: 'ArrowRight'})); return !T.K.r }"))
    S1.fill('#pfName', 'أبو <b>فلافل</b> العظيم جدا'); S1.dispatch_event('#pfName', 'change'); S1.wait_for_timeout(200)
    N = S1.evaluate("() => ({s: window.TD.S.fname, v: document.getElementById('pfName').value})")
    ok('the name is cleaned and cut to 12 characters', 0 < len(N['s']) <= 12 and '<' not in N['s'] and '>' not in N['s'] and N['v'] == N['s'], N)
    S1.keyboard.press('Escape'); ok('Esc closes the panel', not S1.evaluate("() => window.TD.PF.open") and S1.evaluate("() => document.getElementById('pf').classList.contains('hide')")); S1.evaluate("() => window.TD.openPf()")
    S1.evaluate("() => { document.querySelectorAll('#pfPick .tg.em')[3].click() }"); S1.wait_for_timeout(100)
    ok('choosing an emoji sets the picture and draws it', S1.evaluate("() => window.TD.pfGet().a") == '👻' and S1.evaluate("() => document.querySelector('#pfHead .pfav').textContent") == '👻')
    S1.evaluate("() => { document.querySelector('#pfPick .tg').click() }"); S1.wait_for_timeout(100)
    ok('"my hero" brings the hero back', S1.evaluate("() => window.TD.pfGet().a") == 'h' and S1.evaluate("() => document.querySelectorAll('#pfHead .pfav canvas').length") == 1)
    fr = S1.evaluate("() => [...document.querySelectorAll('#pfPick .pfrow')[1].children].map(b => [b.textContent, b.disabled])")
    ok('frames: none + wood open, the others locked by levels cleared', [x[1] for x in fr] == [False, False, True, True, True, True], fr)
    S1.evaluate("() => { const T = window.TD; for (let i = 1; i <= 35; i++) T.S.cl[i] = 2 }")
    S1.evaluate("() => { window.TD.closePf(); window.TD.openPf() }"); S1.wait_for_timeout(200)
    S1.evaluate("() => { document.querySelectorAll('#pfPick .pfrow')[1].children[3].click() }"); S1.wait_for_timeout(100)
    ok('35 levels cleared: the gold frame (30) opens and can be chosen', S1.evaluate("() => window.TD.pfGet().f") == 3)
    S1.evaluate("() => { window.TD.S.cl = {}; }")
    ok('a frame whose levels are gone falls back to none', S1.evaluate("() => window.TD.pfGet().f") == 0)
    S1.evaluate("() => { window.TD.S.pf = {a: '<img src=x>', f: 99} }")
    ok('a broken saved profile is repaired', S1.evaluate("() => { const p = window.TD.pfGet(); return p.a + '|' + p.f }") == 'h|0')
    # hostile data from the database is cleaned
    H = S1.evaluate("""() => { const T = window.TD, o = T.pfSan({n: '<script>alert(1)</script>abcdefghijklmnop', h: '__proto__', s: 99, a: '💩<b>', f: -5, st: 1e12, cl: 'x', b: NaN, d: -3, m: 5.9, dy: 77, wk: {}, ti: 'x'.repeat(100)});
      return o }""")
    ok('hostile stats: name cut and tag-free, unknown hero / emoji -> defaults, numbers clamped', '<' not in H['n'] and len(H['n']) <= 12 and H['h'] == 'falafel' and H['s'] == 4 and H['a'] == 'h' and H['f'] == 0 and H['st'] == 9999 and H['cl'] == 0 and H['b'] == 0 and H['d'] == 0 and H['m'] == 5 and H['dy'] == 3 and H['wk'] == 0 and len(H['ti']) == 24, H)
    ok('pfSan of junk is null', S1.evaluate("() => [window.TD.pfSan(null), window.TD.pfSan('x'), window.TD.pfSan(5)].every(v => v === null)"))
    # backup code
    S1.evaluate("() => { const T = window.TD; T.S.best = 77; T.S.wallet = 1234; T.S.fname = 'سامي'; T.S.adm = 1; T.S.admh = 'secret'; T.S.nu = 'http://x.y' }")
    code = S1.evaluate("() => window.TD.pfExport()")
    S1.evaluate("() => { window.TD.S.nu = '-'; delete window.TD.S.adm; delete window.TD.S.admh }")
    ok('backup code: DDH1.<base64>.<checksum>, without admin / database fields', code.startswith('DDH1.') and code.count('.') == 2 and 'secret' not in __import__('base64').b64decode(code.split('.')[1]).decode('utf8', 'ignore') and 'x.y' not in __import__('base64').b64decode(code.split('.')[1]).decode('utf8', 'ignore'), len(code))
    ok('it reads back; a damaged one, a cut one and junk do not', S1.evaluate("(c) => { const T = window.TD, ok = T.pfParse(c); return [ok && ok.best, T.pfParse(c.slice(0, -3)), T.pfParse(c.replace('.', 'x')), T.pfParse('hello'), T.pfParse(c.slice(0, 40) + c.slice(41))] }", code) == [77, None, None, None, None])
    S1.evaluate("() => window.TD.openPf()"); S1.fill('#pfImp', 'DDH1.garbage.zz'); S1.click('#pfImpGo'); S1.wait_for_timeout(100)
    ok('importing a bad code says so and changes nothing', '❌' in S1.evaluate("() => document.getElementById('pfMsg').textContent") and S1.evaluate("() => window.TD.S.best") == 77)
    S2 = mk(b, nu='-')
    S2.evaluate("() => window.TD.openPf()"); S2.fill('#pfImp', code); S2.click('#pfImpGo'); S2.wait_for_timeout(150)
    ok('first tap on "restore" only asks for confirmation', '⚠' in S2.evaluate("() => document.getElementById('pfMsg').textContent") and S2.evaluate("() => window.TD.S.best") != 77)
    S2.click('#pfImpGo'); S2.wait_for_timeout(1500)
    R = S2.evaluate("() => ({best: window.TD.S.best, wallet: window.TD.S.wallet, fname: window.TD.S.fname, fid: window.TD.S.fid, adm: window.TD.S.adm})")
    ok('second tap restores the save and reloads (progress, name, wallet); no admin flag came along', R['best'] == 77 and R['wallet'] == 1234 and R['fname'] == 'سامي' and not R['adm'], R)
    ok('the friend id travels with the backup', R['fid'] == S1.evaluate("() => window.TD.S.fid"))
    S2.context.close()
    if SHOTS:
        os.makedirs(SHOTS, exist_ok=True); S1.evaluate("() => { const T = window.TD; T.S.best = 30; for (let i = 1; i <= 34; i++) T.S.cl[i] = 2; T.closePf(); T.openPf() }"); S1.wait_for_timeout(300); S1.screenshot(path=f'{SHOTS}/profile.png')
    S1.context.close()

    # ================= 2. two devices on the database: avatar, stats, ranking, gifts =================
    print('friends: avatar, stats, ranking')
    A = mk(b, nu=db.url); B = mk(b, nu=db.url)
    for pg, nm, hero in ((A, 'سمير', 'falafel'), (B, 'ليلى', 'cat')):
        pg.evaluate("([nm, hero]) => { const T = window.TD, S = T.S; S.fname = nm; S.hero = hero; S.own[hero] = 1; S.wallet = 200; S.cl = {1: 3, 2: 3, 3: 2}; S.best = 4 }", [nm, hero])
    A.evaluate("() => { window.TD.S.pf = {a: '🦊', f: 1}; localStorage.setItem('td_s', JSON.stringify(window.TD.S)) }")
    ia, ib = A.evaluate("() => window.TD.frId()"), B.evaluate("() => window.TD.frId()")
    online_tab(A); online_tab(B); A.wait_for_timeout(500)
    A.evaluate("(c) => window.TD.frAdd(c)", ib)
    ok('B gets the request and accepts', wait(B, SHOWN) and cardbtn(B, 'قبول'))
    ok('both confirmed', wait(A, "() => window.TD.S.fr[0] && window.TD.S.fr[0].c === 1") and wait(B, "() => window.TD.S.fr[0] && window.TD.S.fr[0].c === 1"))
    A.evaluate("() => window.TD.frPoll(true)"); B.evaluate("() => window.TD.frPoll(true)")
    pr = db.get(['dhr', 'u' + ia, 'p']) or {}
    ok('presence carries the picture (emoji + frame) and the hero stage', pr.get('a') == '🦊' and pr.get('f') == 1 and pr.get('s') == 0 and pr.get('h') == 'falafel', pr)
    ok('the stats card is written under the id (stars, levels, medals, tasks, title)', wait(A, "() => true") and (lambda s: s.get('st') == 8 and s.get('cl') == 3 and s.get('b') == 4 and s.get('n') == 'سمير' and 'ti' in s and isinstance(s.get('ts'), int))(db.get(['dhr', 'u' + ia, 's']) or {}), db.get(['dhr', 'u' + ia, 's']))
    ok("B's friend row shows A's picture (the emoji)", wait(B, "() => { const r = document.querySelector('#frList .frr .pfav'); return r && r.textContent === '🦊' }"))
    # ranking
    A.evaluate("() => { const S = window.TD.S; for (let i = 4; i <= 20; i++) S.cl[i] = 2; window.TD.frStatsPut(true) }"); A.wait_for_timeout(300)
    B.evaluate("() => window.TD.openPf()"); B.wait_for_timeout(700)
    R = B.evaluate("() => window.TD.pfRows().map(r => [r.n, r.st, r.me ? 1 : 0, r.id])")
    ok('the ranking lists me and my friend, best stars first', len(R) == 2 and R[0][0] == 'سمير' and R[0][1] > R[1][1] and R[1][2] == 1 and R[0][3] == ia, R)
    ok('the ranking is drawn: two rows, mine highlighted, medals', B.evaluate("() => [document.querySelectorAll('#pfRankList .pfr').length, document.querySelectorAll('#pfRankList .pfr.me').length, document.querySelector('#pfRankList .pfr .rk').textContent]") == [2, 1, '🥇'])
    if SHOTS: os.makedirs(SHOTS, exist_ok=True); B.evaluate("() => document.getElementById('pfRankList').scrollIntoView()"); B.wait_for_timeout(200); B.screenshot(path=f'{SHOTS}/profile_rank.png')
    B.evaluate("() => { document.querySelector('#pfMet .tg[data-m=dy]').click() }"); B.wait_for_timeout(100)
    ok('switching the metric re-sorts and shows today / this week', 'اليوم' in B.evaluate("() => document.querySelector('#pfRankList .pfr .v').textContent"))
    db.write(['dhr', 'u' + ia, 's'], {'n': '<img onerror=alert(1)>XXXXXXXXXXXXXXXXXXX', 'h': 'nope', 'a': '😈<b>', 'f': 99, 'st': 99999999, 'cl': -4, 'ti': '<script>'})
    B.evaluate("() => window.TD.pfPoll()"); B.wait_for_timeout(700)
    H = B.evaluate("() => ({html: document.getElementById('pfRankList').innerHTML, rows: window.TD.pfRows().map(r => [r.n, r.st, r.h, r.a, r.f])})")
    ok("a hostile stats card of a friend is inert text (no tags, numbers clamped)", '<img' not in H['html'] and '<script' not in H['html'] and any(r[1] == 9999 and r[2] == 'falafel' and r[3] == 'h' and r[4] == 5 for r in H['rows']), H['rows'])
    B.evaluate("() => window.TD.closePf()")

    # ---- gifts ----
    print('gifts')
    for pg in (A, B): pg.evaluate("() => { window.TD.S.wallet = 200; window.TD.S.gs = null; window.TD.S.gq = []; window.TD.S.gk = []; window.TD.frPoll(true) }")
    A.wait_for_timeout(600)
    ok('the friend row has a gift button, enabled while he is online', A.evaluate("() => { const b = document.querySelector('#frList .frr .fgift'); return !!b && !b.disabled }"))
    A.evaluate("() => document.querySelector('#frList .frr .fgift').click()"); A.wait_for_timeout(150)
    if SHOTS: os.makedirs(SHOTS, exist_ok=True); A.screenshot(path=f'{SHOTS}/friends_gift.png')
    ok('it opens the 10 / 25 / 50 picker', A.evaluate("() => [...document.querySelectorAll('#frList .frg .tg')].map(b => b.textContent)") == ['10 🪙', '25 🪙', '50 🪙'])
    A.evaluate("() => [...document.querySelectorAll('#frList .frg .tg')][1].click()"); A.wait_for_timeout(500)
    ok('sending 25: the sender pays at once (200 -> 175), 25 of the day used', A.evaluate("() => [window.TD.S.wallet, window.TD.S.gs.n, window.TD.frGiftLeft()]") == [175, 25, 75])
    ok('B gets the gift card; nothing is paid before he taps claim', wait(B, SHOWN) and 'بعتلك 25' in B.evaluate(CARD) and B.evaluate("() => window.TD.S.wallet") == 200 and B.evaluate("() => window.TD.S.gq.length") == 1, B.evaluate(CARD))
    ok('the inbox item was deleted', not (db.get(['dhr', 'u' + ib, 'in']) or {}))
    cardbtn(B, 'استلم'); B.wait_for_timeout(400)
    ok('claim: +25 for B, the queue is empty', B.evaluate("() => [window.TD.S.wallet, window.TD.S.gq.length]") == [225, 0])
    ok('A is told the gift was claimed', wait(A, "() => /استلم هديتك/.test(window.TD.FR.msg)", 4000))
    # the same inbox item delivered twice (two tabs): counted once
    B.evaluate("() => { window.TD.frGot('dupkey1', {k: 'gift', f: '" + ia + "', n: 'x', a: 10}); window.TD.frGot('dupkey1', {k: 'gift', f: '" + ia + "', n: 'x', a: 10}) }")
    ok('a gift item seen twice is queued once', B.evaluate("() => window.TD.S.gq.length") == 1, B.evaluate("() => window.TD.S.gq.length"))
    B.evaluate("() => { window.TD.S.gq = [] }")
    bad = B.evaluate("""(ia) => { const T = window.TD; for (const [i, a] of [[1, 0], [2, 51], [3, 'x'], [4, 1e9], [5, -10], [6, null], [7, 2.9]]) T.frGot('bad' + i, {k: 'gift', f: ia, n: 'x', a});
      T.frGot('stranger', {k: 'gift', f: 'ZZZZZZZZ', n: 'x', a: 50}); T.frGot('self', {k: 'gift', f: T.frId(), n: 'x', a: 50}); T.frGot('badfrom', {k: 'gift', f: 'x', n: 'x', a: 50}); return T.S.gq.map(g => g.a) }""", ia)
    ok('bogus amounts, a stranger, myself, a bad id: ignored (only the 2.9 -> 2 counts as a small real gift)', bad == [2], bad)
    B.evaluate("() => { window.TD.S.gq = []; window.TD.S.gk = [] }")
    # limits
    r = A.evaluate("""(ib) => { const T = window.TD; T.S.wallet = 500; T.S.gs = null; const o = []; o.push(T.frGift(ib, 50), T.frGift(ib, 50), T.frGift(ib, 10), T.frGift(ib, 7), T.frGift('ZZZZZZZZ', 10)); o.push(T.S.wallet, T.frGiftLeft()); return o }""", ib)
    ok('daily cap 100: 50 + 50 pass, a third is refused; 7 is not an allowed amount; a stranger is refused', r == [True, True, False, False, False, 400, 0], r)
    A.evaluate("() => { window.TD.S.gs = null; window.TD.S.wallet = 5 }")
    ok('not enough coins -> refused', A.evaluate("(ib) => window.TD.frGift(ib, 10)", ib) is False and A.evaluate("() => window.TD.S.wallet") == 5)
    A.evaluate("() => { window.TD.S.wallet = 100; window.TD.S.gs = null; const f = window.fetch; window.__f = f; window.fetch = (u, o) => (o && o.method === 'PUT' && /\\/in\\//.test(u)) ? Promise.resolve({ok: false}) : f(u, o) }")
    A.evaluate("(ib) => window.TD.frGift(ib, 25)", ib); A.wait_for_timeout(500)
    ok('the database refuses the gift -> the coins come back and the cap is not used', A.evaluate("() => [window.TD.S.wallet, window.TD.S.gs.n]") == [100, 0], A.evaluate("() => [window.TD.S.wallet, window.TD.S.gs.n, window.TD.FR.msg]"))
    A.evaluate("() => { window.fetch = window.__f }")
    # a friend that is offline gets nothing
    A.evaluate("() => { window.TD.FR.pres = {} }")
    ok('a friend who is not online gets no gift (the coins stay with me)', A.evaluate("(ib) => window.TD.frGift(ib, 10)", ib) is False and A.evaluate("() => window.TD.S.wallet") == 100)
    # the gift button in the ranking
    A.evaluate("() => { window.TD.frPoll(true); window.TD.openPf() }"); A.wait_for_timeout(900)
    ok('the ranking row of a friend has a gift button too', A.evaluate("() => { const b = document.querySelector('#pfRankList .pfr:not(.me) .fgift'); return !!b }"))
    A.evaluate("() => window.TD.closePf()")

    # ================= 3. emoji + phrases (same-browser loop, two tabs) =================
    print('emoji')
    ctx = b.new_context(viewport={'width': 1000, 'height': 600})
    X = mk(b, nu='-', ctx=ctx); Y = mk(b, nu='-', ctx=ctx)
    for pg, hero in ((X, 'falafel'), (Y, 'cat')):
        pg.evaluate("(h) => { const T = window.TD, S = T.S; T.sim(false); S.best = 9; S.hero = h; S.own[h] = 1; S.nu = '-'; S.q = 1 }", hero)
    X.evaluate("() => { window.TD.coOpen(''); document.getElementById('coTabN').click(); document.getElementById('nHost').click() }")
    code = X.evaluate("() => window.TD.NET.code")
    Y.evaluate("() => { window.TD.coOpen(''); document.getElementById('coTabN').click() }")
    Y.evaluate("(c) => { document.getElementById('nCode').value = c; document.getElementById('nJoin').click() }", code); Y.wait_for_timeout(900)
    ok('the emoji bar is not offered in the lobby', not X.evaluate("() => window.TD.rxOk()") and X.evaluate("() => document.getElementById('rxBtn').classList.contains('hide')"))
    X.evaluate("() => { window.TD.CO.sel.n = 3; window.TD.coRender(); document.getElementById('nGo').click() }"); X.wait_for_timeout(1200)
    ok('in the online co-op both can use it', X.evaluate("() => window.TD.rxOk()") and Y.evaluate("() => window.TD.rxOk()") and wait(X, "() => !document.getElementById('rxBtn').classList.contains('hide')", 2000))
    X.evaluate("() => window.TD.rxSend(2)"); Y.wait_for_timeout(400)
    ok('an emoji sent by X appears on both: mine (w0) at X, his (w1) at Y', X.evaluate("() => window.TD.RX.list.map(e => [e.w, e.i])") == [[0, 2]] and Y.evaluate("() => window.TD.RX.list.map(e => [e.w, e.i])") == [[1, 2]], (X.evaluate("() => window.TD.RX.list"), Y.evaluate("() => window.TD.RX.list")))
    ok('sending again within a second is refused (rate limit)', X.evaluate("() => window.TD.rxSend(3)") is False)
    X.wait_for_timeout(1000)
    ok('...and works after a second; out-of-range ones never', X.evaluate("() => [window.TD.rxSend(16), window.TD.rxSend(-1), window.TD.rxSend(3)]") == [False, False, True])
    Y.wait_for_timeout(300)
    Y.evaluate("() => { window.TD.RX.got = 0 }")
    h = Y.evaluate("() => { const T = window.TD, n = T.RX.list.length; T.RX.got = 0; T.rxGot({i: 99}); T.rxGot({i: 'x'}); T.rxGot({i: 1.5}); T.rxGot(null); T.rxGot({}); return T.RX.list.length - n }")
    ok('hostile / malformed emoji messages are ignored', h == 0, h)
    X.wait_for_timeout(1000)
    X.evaluate("() => window.TD.rxSend(9)"); Y.wait_for_timeout(300)
    ok('a phrase (index 8..15) arrives too', Y.evaluate("() => window.TD.RX.list.some(e => e.w === 1 && e.i === 9)"))
    rr = X.evaluate("() => { const T = window.TD; for (let k = 0; k < 20; k++) { T.update(1 / 60); T.render() } return T.RX.list.length }")
    ok('drawing the bubbles raises nothing', not errs, errs[:2])
    if SHOTS:
        os.makedirs(SHOTS, exist_ok=True); X.evaluate("() => { window.TD.RX.last = 0; window.TD.rxSend(1); window.TD.rxToggle() }"); Y.evaluate("() => { window.TD.RX.got = 0; window.TD.rxGot({i: 12}) }"); X.wait_for_timeout(500)
        X.locator('#stage').screenshot(path=f'{SHOTS}/emoji_X.png'); Y.locator('#stage').screenshot(path=f'{SHOTS}/emoji_Y.png')
    X.evaluate("() => { window.TD.RX.mode = 0 }")
    # keyboard: T opens the emoji row, T again the phrases, T again closes; digits send
    X.evaluate("() => { window.TD.RX.last = 0 }")
    X.keyboard.press('KeyT'); m1 = X.evaluate("() => [window.TD.RX.mode, !document.getElementById('rxBar').classList.contains('hide'), document.querySelectorAll('#rxBar .rxb').length]")
    X.keyboard.press('KeyT'); m2 = X.evaluate("() => [window.TD.RX.mode, document.querySelector('#rxBar .rxb').classList.contains('tx')]")
    X.keyboard.press('KeyT'); m3 = X.evaluate("() => window.TD.RX.mode")
    ok('key T: emojis (8 buttons) -> phrases -> closed', m1 == [1, True, 8] and m2 == [2, True] and m3 == 0, (m1, m2, m3))
    X.keyboard.press('KeyT'); n0 = X.evaluate("() => window.TD.RX.list.length"); X.keyboard.press('Digit4'); X.wait_for_timeout(200)
    ok('digit 4 sends the 4th emoji and closes the bar', X.evaluate("() => window.TD.RX.list.slice(-1)[0].i") == 3 and X.evaluate("() => window.TD.RX.mode") == 0)
    # a text field keeps its keys
    X.evaluate("() => { const i = document.createElement('input'); i.id = 'tmpIn'; document.body.appendChild(i); i.focus(); window.TD.RX.last = 0 }")
    X.keyboard.press('KeyT'); ok('typing T in a text field does not open the bar', X.evaluate("() => window.TD.RX.mode") == 0)
    # local co-op (same keyboard): no emoji
    L = mk(b, nu='-')
    L.evaluate("() => { const T = window.TD; T.S.best = 9; T.S.own.cat = 1; T.coStart({hero: ['falafel', 'cat'], level: 3, local: true, me: 0}); T.G.state = 'play' }"); L.wait_for_timeout(300)
    ok('local co-op (one keyboard) has no emoji bar', L.evaluate("() => window.TD.rxOk()") is False)
    L.context.close()
    # race: the ghost carries his emoji
    X.evaluate("() => { window.TD.netToLobby(''); }"); Y.wait_for_timeout(600)
    X.evaluate("() => { window.TD.CO.sel.df = 'crazy'; document.getElementById('nModeRace').click() }"); X.wait_for_timeout(300)
    X.evaluate("() => document.getElementById('nGo').click()"); X.wait_for_timeout(1500)
    ok('race: both can use the bar', X.evaluate("() => !!window.TD.G.race && window.TD.rxOk()") and Y.evaluate("() => !!window.TD.G.race && window.TD.rxOk()"))
    X.evaluate("() => { window.TD.RX.last = 0; window.TD.rxSend(5) }"); Y.wait_for_timeout(400)
    ok('race: it arrives and is drawn above the opponent', Y.evaluate("() => { const T = window.TD; T.update(1/60); T.render(); return T.RX.list.some(e => e.w === 1 && e.i === 5) }") and not errs, errs[:2])

    ok('no page errors', not [e for e in errs if 'ERR_TUNNEL' not in e and 'ERR_CONNECTION' not in e], errs[:3])
    b.close()
print('RESULT:', 'ALL OK' if all(res) else 'FAILURES')
sys.exit(0 if all(res) else 1)
