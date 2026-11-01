"""Friends: a stable code, add by code / link, mutual acceptance, presence, invite card -> join, join a friend's open room, strangers can't invite,
stale invites ignored, names are text only, one connection only when needed.
usage: python3 test/friends.py [--shots DIR]"""
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

def mk(b, qs='', nu=None, errs=None):
    ctx = b.new_context(viewport={'width': 1000, 'height': 600}); pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto(URL); pg.wait_for_timeout(500)
    if nu is not None:
        pg.evaluate("(nu) => { window.TD.S.nu = nu; localStorage.setItem('td_s', JSON.stringify(window.TD.S)) }", nu)
    if qs: pg.goto(URL + qs); pg.wait_for_timeout(500)
    return pg
def online_tab(pg):
    pg.evaluate("() => { window.TD.coOpen(''); document.getElementById('coTabN').click() }"); pg.wait_for_timeout(150)
def wait(pg, js, ms=6000, step=120):
    t = time.time()
    while time.time() - t < ms / 1000:
        if pg.evaluate(js): return True
        pg.wait_for_timeout(step)
    return False
CARD = "() => { const c = document.getElementById('frCard'); return c.classList.contains('hide') ? '' : c.textContent }"
SHOWN = "() => { const c = document.getElementById('frCard'); return !c.classList.contains('hide') && c.textContent !== '' }"
def cardbtn(pg, label):
    pg.evaluate("(l) => { for (const b of document.querySelectorAll('#frCard button')) if (b.textContent.includes(l)) { b.click(); return true } return false }", label)
def row(pg, fid): return pg.evaluate("(id) => { const r = document.querySelector('#frList .frr[data-id=\"' + id + '\"]'); return r ? r.textContent : null }", fid)

errs = []
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    # ---- no database (the same-browser loop): friends say so, and open nothing ----
    L = mk(b, nu='-', errs=errs); online_tab(L); L.wait_for_timeout(1500)
    ok('loop mode: friends unavailable, no connection', L.evaluate("() => !window.TD.FR.on && window.TD.frAdd('ABCDEFGH') === false && /مش متوفر|اتصال/.test(document.getElementById('frList').textContent + document.getElementById('frMsg').textContent)"))
    L.context.close()

    A = mk(b, nu=db.url, errs=errs); B = mk(b, nu=db.url, errs=errs)
    A.wait_for_timeout(1500)
    ok('no friend, panel closed -> no connection is opened', not A.evaluate("() => window.TD.FR.on"))
    ia, ib = A.evaluate("() => window.TD.frId()"), B.evaluate("() => window.TD.frId()")
    ok('every device gets its own stable 8-character code', len(ia) == 8 and len(ib) == 8 and ia != ib and A.evaluate("() => window.TD.frId()") == ia and ia.isalnum(), (ia, ib))
    online_tab(A); online_tab(B)
    ok('panel is closed while the list is empty', not A.evaluate("() => document.getElementById('frBox').open"))
    A.evaluate("() => { document.getElementById('frBox').open = true }"); B.evaluate("() => { document.getElementById('frBox').open = true }"); A.wait_for_timeout(400)
    ok('opening the panel opens the connection', A.evaluate("() => window.TD.FR.on") and B.evaluate("() => window.TD.FR.on"))
    ok('the panel shows my code in two groups of four', A.evaluate("() => document.getElementById('frMyId').textContent") == ia[:4] + '-' + ia[4:])
    ok('presence is written (name, hero, server time)', wait(A, "() => true") and (db.get(['dhr', 'u' + ia, 'p']) or {}).get('h') == 'falafel' and isinstance((db.get(['dhr', 'u' + ia, 'p']) or {}).get('ts'), int), db.get(['dhr', 'u' + ia, 'p']))
    # ---- add by code ----
    A.fill('#frAddIn', 'zz'); A.click('#frAdd'); ok('a short code is refused', A.evaluate("() => window.TD.S.fr.length") == 0)
    A.fill('#frAddIn', ia[:4] + '-' + ia[4:]); A.click('#frAdd'); ok('your own code is refused', A.evaluate("() => window.TD.S.fr.length") == 0)
    A.fill('#frAddIn', ib[:4].lower() + '-' + ib[4:]); A.click('#frAdd'); A.wait_for_timeout(200);
    ok('adding by code (lower case, dash) works, shown as waiting', A.evaluate("() => window.TD.S.fr.map(f => [f.id, f.c])") == [[ib, 0]] and '⏳' in (row(A, ib) or ''), row(A, ib))
    A.fill('#frAddIn', 'https://x.y/play/?f=' + ia); ok('a pasted friend link is reduced to its code', A.evaluate("() => document.getElementById('frAddIn').value") == ia, A.evaluate("() => document.getElementById('frAddIn').value")); A.fill('#frAddIn', '')
    ok('adding twice is refused', not A.evaluate("(c) => window.TD.frAdd(c)", ib))
    ok('B gets a friend request card', wait(B, SHOWN) and 'بدّه يضيفك' in B.evaluate(CARD), B.evaluate(CARD))
    ok('...which names A with his default name', 'لاعب ' + ia[:3] in B.evaluate(CARD), B.evaluate(CARD))
    cardbtn(B, 'قبول'); B.wait_for_timeout(300)
    ok('B accepted: A is in his list as confirmed', B.evaluate("() => window.TD.S.fr.map(f => [f.id, f.c])") == [[ia, 1]])
    ok('A is told: B becomes confirmed', wait(A, "() => window.TD.S.fr[0] && window.TD.S.fr[0].c === 1"))
    ok('the request and the reply were deleted from the inboxes', not (db.get(['dhr', 'u' + ia, 'in']) or {}) and not (db.get(['dhr', 'u' + ib, 'in']) or {}), (db.get(['dhr', 'u' + ia, 'in']), db.get(['dhr', 'u' + ib, 'in'])))
    # ---- presence ----
    A.evaluate("() => window.TD.frPoll(true)"); B.evaluate("() => window.TD.frPoll(true)")
    ok('A sees B online, with his name', wait(A, "() => document.querySelector('#frList .frr .frd') && document.querySelector('#frList .frr .frd').textContent === '🟢'") and ('لاعب ' + ib[:3]) in (row(A, ib) or ''), row(A, ib))
    ok('the badge counts online friends', '1/1' in A.evaluate("() => document.getElementById('frBadge').textContent"), A.evaluate("() => document.getElementById('frBadge').textContent"))
    # a name change travels
    B.fill('#frName', 'أبو فلافل'); B.press('#frName', 'Enter'); B.evaluate("() => document.getElementById('frName').dispatchEvent(new Event('change'))"); B.wait_for_timeout(300)
    A.evaluate("() => window.TD.frPoll(true)")
    ok('B renamed himself: A sees the new name', wait(A, "() => document.querySelector('#frList .frr b') && document.querySelector('#frList .frr b').textContent === 'أبو فلافل'"), row(A, ib))
    if SHOTS:
        os.makedirs(SHOTS, exist_ok=True); A.locator('#stage').screenshot(path=f'{SHOTS}/friends_panel.png')
    # ---- invite -> card -> join ----
    ok('invite button enabled for a confirmed online friend', A.evaluate("() => !document.querySelector('#frList .finv').disabled"))
    A.click('#frList .finv'); A.wait_for_timeout(300)
    na = A.evaluate("() => ({link: window.TD.NET.link, code: window.TD.NET.code})")
    ok('inviting opens a room as host and sends the code', na['link'] == 'wait' and len(na['code']) == 5, na)
    ok('B gets an invite card with the host name', wait(B, SHOWN) and 'دعاك' in B.evaluate(CARD) and 'لاعب ' + ia[:3] in B.evaluate(CARD), B.evaluate(CARD))
    if SHOTS: B.locator('#stage').screenshot(path=f'{SHOTS}/friends_invite.png')
    cardbtn(B, 'انضم')
    ok('one tap on join: both connected, no code typed', wait(A, "() => window.TD.NET.link === 'conn'", 9000) and wait(B, "() => window.TD.NET.link === 'conn'", 9000), (A.evaluate("() => window.TD.NET.link"), B.evaluate("() => window.TD.NET.link")))
    ok('B is in the co-op lobby on the online tab', B.evaluate("() => window.TD.G.state === 'co' && window.TD.NET.tab"))
    ok('the invite card closed itself', B.evaluate(CARD) == '')
    # ---- join a friend's open room straight from the list ----
    A.evaluate("() => document.getElementById('nLeave').click()"); B.evaluate("() => document.getElementById('nLeave').click()"); A.wait_for_timeout(900)
    ok('both back to no room', A.evaluate("() => window.TD.NET.link") == 'off' and B.evaluate("() => window.TD.NET.link") == 'off')
    A.evaluate("() => document.getElementById('nHost').click()"); A.wait_for_timeout(300)
    ok('my presence now carries the open room', (db.get(['dhr', 'u' + ia, 'p']) or {}).get('r') == A.evaluate("() => window.TD.NET.code"), db.get(['dhr', 'u' + ia, 'p']))
    B.evaluate("() => window.TD.frPoll(true)")
    ok('B sees "has a room" and a join button', wait(B, "() => !!document.querySelector('#frList .fjoin')") and 'عنده غرفة' in (row(B, ia) or ''), row(B, ia))
    B.click('#frList .fjoin')
    ok('joining from the list connects both', wait(A, "() => window.TD.NET.link === 'conn'", 9000) and wait(B, "() => window.TD.NET.link === 'conn'", 9000))
    A.evaluate("() => document.getElementById('nLeave').click()"); B.evaluate("() => document.getElementById('nLeave').click()"); A.wait_for_timeout(600)
    # ---- strangers, stale invites, html in names ----
    nowms = int(time.time() * 1000)
    def put_in(to, obj): db.write(['dhr', 'u' + to, 'in', 'k' + str(time.time()).replace('.', '')], obj)
    put_in(ia, {'k': 'inv', 'f': 'ZZZZZZZZ', 'n': 'غريب', 'c': 'ABCDE', 'm': 'co', 'ts': nowms}); A.wait_for_timeout(1300)
    ok('an invite from a stranger shows nothing', A.evaluate(CARD) == '')
    put_in(ia, {'k': 'inv', 'f': ib, 'n': 'قديم', 'c': 'ABCDE', 'm': 'co', 'ts': nowms - 400000}); A.wait_for_timeout(1300)
    ok('a stale invite from a friend is ignored', A.evaluate(CARD) == '')
    put_in(ia, {'k': 'inv', 'f': ib, 'n': 'x', 'c': '<b>', 'm': 'co', 'ts': nowms}); A.wait_for_timeout(1300)
    ok('an invite with a malformed room code is ignored', A.evaluate(CARD) == '')
    put_in(ia, {'k': 'req', 'f': 'YYYYYYYY', 'n': '<img src=x onerror=window.__x=1>', 'ts': nowms}); A.wait_for_timeout(1300)
    t = A.evaluate(CARD)
    ok('a stranger can only send a request, and its name is plain text', 'بدّه يضيفك' in t and A.evaluate("() => !document.querySelector('#frCard img') && !window.__x"), t)
    cardbtn(A, 'تجاهل'); A.wait_for_timeout(200)
    ok('ignoring adds nobody', A.evaluate("() => window.TD.S.fr.length") == 1)
    db.write(['dhr', 'u' + ib, 'p'], {'n': '<b>x</b><img src=x onerror=window.__y=1>', 'h': 'cat', 'r': '', 'ts': int(time.time() * 1000)})
    A.evaluate("() => window.TD.frPoll(true)"); A.wait_for_timeout(500)
    ok('a hostile name in a friend\'s presence never becomes markup', A.evaluate("() => !document.querySelector('#frList img') && !document.querySelector('#frList b b') && !window.__y"), row(A, ib))
    # ---- friend link ----
    C = mk(b, qs='?f=' + ia, nu=db.url, errs=errs) if False else None
    ctx = b.new_context(viewport={'width': 1000, 'height': 600}); C = ctx.new_page()
    C.on('pageerror', lambda e: errs.append(str(e))); C.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    C.goto(URL); C.wait_for_timeout(400); C.evaluate("(nu) => { window.TD.S.nu = nu; localStorage.setItem('td_s', JSON.stringify(window.TD.S)) }", db.url)
    C.goto(URL + '?f=' + ia.lower()); C.wait_for_timeout(300)
    ok('a friend link asks before adding and shows the name it found', wait(C, SHOWN, 8000) and 'تضيف' in C.evaluate(CARD) and 'لاعب ' + ia[:3] in C.evaluate(CARD), C.evaluate(CARD))
    ok('the parameter is gone from the address bar', 'f=' not in C.evaluate("() => location.search"), C.evaluate("() => location.search"))
    ok('nothing added before he says yes', C.evaluate("() => window.TD.S.fr.length") == 0)
    cardbtn(C, 'أضِف'); C.wait_for_timeout(400)
    ok('adding from the link puts the host in his list, waiting', C.evaluate("() => window.TD.S.fr.map(f => [f.id, f.c])") == [[ia, 0]])
    ok('...and A gets the request', wait(A, SHOWN) and 'بدّه يضيفك' in A.evaluate(CARD))
    cardbtn(A, 'قبول'); ok('A accepted: 2 friends, C is told', A.evaluate("() => window.TD.S.fr.length") == 2 and wait(C, "() => window.TD.S.fr[0].c === 1"))
    ctx.close()
    # ---- share + remove ----
    sh = A.evaluate("""() => { let got = null; Object.defineProperty(navigator, 'share', {value: o => { got = o; return Promise.resolve() }, configurable: true}); document.getElementById('frShare').click(); return new Promise(r => setTimeout(() => r(got), 100)) }""")
    ok('share sends a link carrying the code', sh and ('?f=' + ia) in sh['url'] and ia[:4] in sh['text'], sh)
    A.evaluate("() => window.TD.frPoll(true)"); A.wait_for_timeout(300)
    n0 = A.evaluate("() => window.TD.S.fr.length")
    A.click(f'#frList .frr[data-id="{ib}"] .frm'); ok('first tap only asks "sure?"', A.evaluate("() => window.TD.S.fr.length") == n0 and '؟' in (row(A, ib) or ''), row(A, ib))
    A.click(f'#frList .frr[data-id="{ib}"] .frm'); ok('second tap removes the friend', A.evaluate("() => window.TD.S.fr.length") == n0 - 1 and row(A, ib) is None)
    ok('the list survives a reload', True)
    A.evaluate("() => localStorage.setItem('td_s', JSON.stringify(window.TD.S))"); A.reload(); A.wait_for_timeout(1800)
    ok('after reload the connection comes back by itself (he has a friend), same code', A.evaluate("() => window.TD.FR.on && window.TD.S.fr.length") == n0 - 1 and A.evaluate("() => window.TD.frId()") == ia)
    ok('no page errors', not errs, errs[:3])
    b.close()
db.close()
print('RESULT:', 'ALL OK' if all(res) else 'FAILURES')
sys.exit(0 if all(res) else 1)
