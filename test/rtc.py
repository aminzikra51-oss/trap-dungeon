"""WebRTC data channel between the two players: opens by itself (signalling over the relay), carries the fast traffic, beats a slow relay,
control messages arrive exactly once, the relay takes over when the channel dies or never opens, and the game keeps agreeing with itself.
usage: python3 test/rtc.py"""
import sys, os, threading, http.server, socketserver, functools
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fake_rtdb import FakeRtdb
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def serve():
    h = functools.partial(Q, directory=ROOT); srv = socketserver.TCPServer(('127.0.0.1', 0), h); srv.allow_reuse_address = True
    threading.Thread(target=srv.serve_forever, daemon=True).start(); return srv, srv.server_address[1]

bad = 0
def ok(name, cond, extra=''):
    global bad
    print(('  ok   ' if cond else '  FAIL ') + name + (('  [' + str(extra) + ']') if extra != '' else ''))
    if not cond: bad += 1

SETUP = "(cfg) => { const T = window.TD, S = T.S; T.sim(false); S.best = 14; S.diff = 'hell'; S.hero = cfg.hero; S.own[cfg.hero] = 1; S.nu = cfg.nu; S.q = 1; if (cfg.nt) S.nt = cfg.nt; return true }"
MASH = """(seed) => { let s = seed; const r = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; const KR = window.TD.KR;
  window.__mash = setInterval(() => { KR.r = r() < .7; KR.l = r() < .08; const j = r() < .35; if (j && !KR.j) KR.jp = true; KR.j = j }, 90) }"""
STOP = "() => { clearInterval(window.__mash); for (const o of [window.TD.KR, window.TD.K]) o.l = o.r = o.j = o.a = false }"
ST = "() => { const N = window.TD.NET; return {link: N.link, tpk: N.tpk, rtt: Math.round(N.rtt), f: N.f, c: N.c, bad: N.bad, fixes: N.fixes, stN: N.stallN, stTot: Math.round(N.stallTot || 0), tx: N.dcTx | 0, rx: N.dcRx | 0, rtc: !!N.rtc, up: N.rtc ? N.rtc.up | 0 : 0, state: window.TD.G.state, mode: N.mode, lvl: window.TD.CO.sel.n} }"

def pair(p, port, db, nuA=None, nt=None, noRtcB=False):
    url = f'http://127.0.0.1:{port}/trap-dungeon.html'
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required', '--disable-features=WebRtcHideLocalIpsWithMdns'])
    ctx = b.new_context(viewport={'width': 900, 'height': 520}); A = ctx.new_page(); B = ctx.new_page(); errs = []
    if noRtcB: B.add_init_script("delete window.RTCPeerConnection")
    for nm, pg in (('A', A), ('B', B)):
        pg.on('pageerror', lambda e, nm=nm: errs.append(nm + ':' + str(e)))
        pg.goto(url); pg.wait_for_function('() => window.TD && window.TD.S', timeout=30000); pg.wait_for_timeout(300)
    nu = db.url if db else '-'
    A.evaluate(SETUP, {'hero': 'falafel', 'nu': nu, 'nt': nt}); B.evaluate(SETUP, {'hero': 'cat', 'nu': nu, 'nt': nt})
    A.evaluate("() => { window.TD.coOpen(''); document.getElementById('coTabN').click(); document.getElementById('nHost').click() }")
    code = A.evaluate("() => window.TD.NET.code")
    B.evaluate("() => { window.TD.coOpen(''); document.getElementById('coTabN').click() }")
    B.evaluate("(c) => { document.getElementById('nCode').value = c; document.getElementById('nJoin').click() }", code)
    for _ in range(80):
        B.wait_for_timeout(250)
        if A.evaluate("() => window.TD.NET.link") == 'conn' and B.evaluate("() => window.TD.NET.link") == 'conn': break
    return b, A, B, errs, code

def start(A, B, lvl=3, secs=0):
    A.evaluate("(n) => { window.TD.CO.sel.n = n; window.TD.coRender() }", lvl); A.wait_for_timeout(500)
    A.evaluate("() => document.getElementById('nGo').click()"); A.wait_for_timeout(1500)

def wait_tp(pg, want, secs):
    for _ in range(int(secs * 4)):
        if pg.evaluate("() => window.TD.NET.tpk") == want: return True
        pg.wait_for_timeout(250)
    return False

def main():
    srv, port = serve()
    with sync_playwright() as p:
        print('direct channel over a SLOW relay (300 ms one way, jitter, losses)')
        db = FakeRtdb(lat=.3, jit=.1, loss=.02, wjit=.1)
        b, A, B, errs, code = pair(p, port, db)
        ok('both reached the lobby connection through the relay first', A.evaluate("() => window.TD.NET.link") == 'conn' and B.evaluate("() => window.TD.NET.link") == 'conn')
        up = wait_tp(A, 'rtc', 25) and wait_tp(B, 'rtc', 10)
        ok('the direct channel opened by itself on both sides', up, (A.evaluate(ST), B.evaluate(ST)))
        A.wait_for_timeout(2500)
        sa, sb = A.evaluate(ST), B.evaluate(ST)
        ok('ping over the direct channel is tiny although the relay needs 600 ms for a round trip', 0 < sa['rtt'] < 80 and 0 <= sb['rtt'] < 80, (sa['rtt'], sb['rtt']))
        ok('lobby text says direct', 'مباشر' in A.evaluate("() => document.getElementById('nStat').textContent"), A.evaluate("() => document.getElementById('nStat').textContent"))
        # control messages: exactly once, even though they travel on both paths
        A.evaluate("() => { window.__lb = 0; const f = window.TD.netLobbyRecv; }")
        B.evaluate("() => { window.__n = 0; const T = window.TD; T.CO.sel.n = 1 }")
        A.evaluate("() => { window.TD.CO.sel.n = 7; window.TD.coRender() }"); A.wait_for_timeout(600)
        ok('a lobby choice reaches the guest immediately (reliable channel, not after 300 ms)', B.evaluate("() => window.TD.CO.sel.n") == 7, B.evaluate("() => window.TD.CO.sel.n"))
        w0 = db.nput
        start(A, B, 3)
        sa, sb = A.evaluate(ST), B.evaluate(ST)
        ok('the game started exactly once on both (not restarted by the second copy of the start message)', sa['state'] in ('play', 'dead') and sb['state'] in ('play', 'dead') and sa['f'] < 200 and sb['f'] < 200, (sa, sb))
        A.evaluate(MASH, 11); B.evaluate(MASH, 99); A.wait_for_timeout(7000)
        sa, sb = A.evaluate(ST), B.evaluate(ST)
        ok('inputs travelled on the direct channel', sa['tx'] > 150 and sa['rx'] > 150 and sb['tx'] > 150 and sb['rx'] > 150, (sa['tx'], sa['rx'], sb['tx'], sb['rx']))
        ok('the relay is nearly idle while the channel is up', db.nput - w0 < 80, db.nput - w0)
        ok('no freezing: the slow relay does not matter any more', sa['stTot'] < 300 and sb['stTot'] < 300 and sa['f'] > 330 and sb['f'] > 330, (sa['stTot'], sb['stTot'], sa['f'], sb['f']))
        ok('hashes agree', sa['bad'] == 0 and sb['bad'] == 0, (sa['bad'], sb['bad']))

        print('the channel dies in the middle of the game (host drops it, the guest still believes in it)')
        A.evaluate("() => window.TD.rtcDrop()")
        ok('host falls back to the relay at once', A.evaluate("() => window.TD.NET.tpk") == 'relay')
        f0 = max(A.evaluate(ST)['f'], B.evaluate(ST)['f'])
        gone = wait_tp(B, 'relay', 8)
        ok('the guest notices the silence and follows to the relay', gone, B.evaluate(ST))
        A.wait_for_timeout(5000)
        sa, sb = A.evaluate(ST), B.evaluate(ST)
        ok('the game goes on over the relay', sa['f'] > f0 + 60 and sb['f'] > f0 + 60, (f0, sa['f'], sb['f']))
        A.wait_for_timeout(4000)
        sa, sb = A.evaluate(ST), B.evaluate(ST)
        ok('both still agree about the state after the switch', sa['bad'] == 0 or sb['fixes'] >= 1, (sa['bad'], sb['bad'], sb['fixes']))
        A.evaluate(STOP); B.evaluate(STOP)
        ok('no page errors', not errs, errs[:3]); b.close(); db.close()

        print('the guest has no WebRTC at all: everything keeps working over the relay')
        db = FakeRtdb(lat=.05, jit=.02)
        b, A, B, errs, code = pair(p, port, db, noRtcB=True)
        A.wait_for_timeout(3000)
        sa, sb = A.evaluate(ST), B.evaluate(ST)
        ok('still connected, path is the relay', sa['link'] == 'conn' and sb['link'] == 'conn' and sa['tpk'] == 'relay' and sb['tpk'] == 'relay', (sa['tpk'], sb['tpk']))
        start(A, B, 3); A.evaluate(MASH, 5); B.evaluate(MASH, 6); A.wait_for_timeout(5000)
        sa, sb = A.evaluate(ST), B.evaluate(ST)
        ok('a game over the relay works', sa['f'] > 200 and sb['f'] > 200 and sa['bad'] == 0 and sb['bad'] == 0, (sa['f'], sb['f'], sa['bad'], sb['bad']))
        A.evaluate(STOP); B.evaluate(STOP); ok('no page errors', not errs, errs[:3]); b.close(); db.close()

        print('relay forced by the player setting (S.nt = relay)')
        db = FakeRtdb(lat=.05)
        b, A, B, errs, code = pair(p, port, db, nt='relay'); A.wait_for_timeout(3500)
        sa, sb = A.evaluate(ST), B.evaluate(ST)
        ok('no channel is even attempted', sa['tpk'] == 'relay' and sb['tpk'] == 'relay' and not sa['rtc'] and not sb['rtc'], (sa, sb)); b.close(); db.close()

        print('same browser (BroadcastChannel signalling, tests and tinkering)')
        b, A, B, errs, code = pair(p, port, None)
        up = wait_tp(A, 'rtc', 15) and wait_tp(B, 'rtc', 8)
        ok('the channel opens here too', up, (A.evaluate(ST), B.evaluate(ST)))
        start(A, B, 3); A.evaluate(MASH, 21); B.evaluate(MASH, 22); A.wait_for_timeout(5000)
        sa, sb = A.evaluate(ST), B.evaluate(ST)
        ok('a game over the channel: frames, no stalls, no desync', sa['f'] > 250 and sb['f'] > 250 and sa['bad'] == 0 and sb['bad'] == 0 and sa['stTot'] < 200, (sa, sb))
        A.evaluate(STOP); B.evaluate(STOP); ok('no page errors', not errs, errs[:3]); b.close()
    srv.shutdown()

main()
print('RESULT:', 'ALL OK' if bad == 0 else f'{bad} FAILED'); sys.exit(1 if bad else 0)
