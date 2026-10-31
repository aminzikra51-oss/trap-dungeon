"""Online play: handshake, lockstep co-op with different local profiles, hash agreement, forced drift -> host snapshot resync, win -> lobby,
race (ghost, countdown, arbitration), leaving.
usage: python3 test/net.py [--shots DIR] [--rtdb [--lat MS]]
  default : same-browser BroadcastChannel transport
  --rtdb  : the Firebase REST/SSE transport against test/fake_rtdb.py (cross-origin, CORS, optional one-way latency)"""
import sys, os, threading, http.server, socketserver, functools, json, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fake_rtdb import FakeRtdb
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = sys.argv[sys.argv.index('--shots') + 1] if '--shots' in sys.argv else None
RTDB = '--rtdb' in sys.argv
LAT = float(sys.argv[sys.argv.index('--lat') + 1]) / 1000 if '--lat' in sys.argv else 0.0

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

SETUP = """(cfg) => { const T = window.TD, S = T.S; T.sim(false); S.best = cfg.best; S.diff = cfg.diff; S.hero = cfg.hero; S.nu = cfg.nu || '';
  for (const h of cfg.own) S.own[h] = 1; S.coins = cfg.coins; S.hi = cfg.hi || S.hi; S.q = cfg.q; return true }"""
# random keyboard on the raw store, like a person mashing keys
MASH = """([seed, which]) => { let s = seed; const r = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; const KR = window.TD[which || 'KR'];
  window.__mash = setInterval(() => { KR.r = r() < .7; KR.l = r() < .08; const j = r() < .35; if (j && !KR.j) KR.jp = true; KR.j = j; const a = r() < .1; if (a && !KR.a) KR.ap = true; KR.a = a }, 90) }"""
STOP = "() => { clearInterval(window.__mash); for (const o of [window.TD.KR, window.TD.K]) o.l = o.r = o.j = o.a = false }"
STATE = "() => { const T = window.TD, N = T.NET; return {link: N.link, f: N.f, bad: N.bad, fixes: N.fixes, st: T.G.state, co: !!T.G.co, race: !!T.G.race, mode: N.mode, peer: N.peer, rtt: Math.round(N.rtt), D: N.D, lvl: T.G.level, msg: N.msg, code: N.code} }"

def run():
    srv, port = serve(); db = FakeRtdb(LAT) if RTDB else None; nu = db.url if db else '-'
    SLOW = 1 + LAT * 8                                          # waits scale with the simulated latency
    url = f'http://127.0.0.1:{port}/trap-dungeon.html'
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        ctx = b.new_context(viewport={'width': 1000, 'height': 600})
        A = ctx.new_page(); B = ctx.new_page(); errs = []
        for nm, pg in (('A', A), ('B', B)):
            pg.on('pageerror', lambda e, nm=nm: errs.append(nm + ':' + str(e)))
            pg.on('console', lambda m, nm=nm: errs.append(nm + ' C:' + m.text) if m.type == 'error' else None)
            pg.goto(url); pg.wait_for_timeout(500)
        A.evaluate(SETUP, {'best': 14, 'diff': 'normal', 'hero': 'falafel', 'own': ['falafel'], 'coins': 5, 'q': 1, 'nu': nu})
        B.evaluate(SETUP, {'best': 9, 'diff': 'hell', 'hero': 'cat', 'own': ['cat', 'robot'], 'coins': 777, 'q': 2, 'nu': nu})

        print('handshake')
        A.evaluate("() => { window.TD.coOpen(''); document.getElementById('coTabN').click(); document.getElementById('nHost').click() }")
        sa = A.evaluate(STATE); ok('host waits with a 5 character code', sa['link'] == 'wait' and len(sa['code']) == 5, sa['code'])
        B.evaluate("() => { window.TD.coOpen(''); document.getElementById('coTabN').click() }")
        B.evaluate("(c) => { document.getElementById('nCode').value = c; document.getElementById('nJoin').click() }", sa['code'])
        B.wait_for_timeout(int(900 * SLOW))
        sa, sb = A.evaluate(STATE), B.evaluate(STATE)
        ok('transport in use is the expected one', A.evaluate("() => window.TD.NET.kind") == ('rtdb' if RTDB else 'loop'), A.evaluate("() => window.TD.NET.kind"))
        ok('both connected', sa['link'] == 'conn' and sb['link'] == 'conn', (sa['link'], sb['link']))
        ok('each knows the other hero', sa['peer'] and sa['peer']['hero'] == 'cat' and sb['peer'] and sb['peer']['hero'] == 'falafel')
        ok('playable levels limited to what BOTH reached', A.evaluate("() => window.TD.coMax()") == 9 and B.evaluate("() => window.TD.coMax()") == 9)
        B.wait_for_timeout(int(1500 * SLOW))
        ok('ping measured', A.evaluate(STATE)['rtt'] >= 0 and len(A.evaluate("() => window.TD.NET.pings")) >= 1)
        ok('guest sees host-only controls hidden', B.evaluate("() => [document.getElementById('nGo').classList.contains('hide'), !document.getElementById('nGuestWait').classList.contains('hide')]") == [True, True])
        ok('host sees start button', A.evaluate("() => !document.getElementById('nGo').classList.contains('hide')"))
        # a wrong code never connects
        C = ctx.new_page(); C.goto(url); C.wait_for_timeout(400)
        C.evaluate("() => { window.TD.S.best = 5; window.TD.coOpen(''); document.getElementById('coTabN').click() }")
        C.evaluate("() => { document.getElementById('nCode').value = 'ZZZZZ'; document.getElementById('nJoin').click() }"); C.wait_for_timeout(600)
        ok('unknown room stays unconnected', C.evaluate(STATE)['link'] == 'join'); C.evaluate("() => window.TD.netLeave('')"); C.wait_for_timeout(1000); C.close()

        print('lockstep co-op')
        A.evaluate("() => { window.TD.CO.sel.n = 3; window.TD.coRender() }"); A.wait_for_timeout(int(300 * SLOW))
        ok('guest follows the host level choice', B.evaluate("() => window.TD.CO.sel.n") == 3)
        A.evaluate("() => document.getElementById('nGo').click()"); A.wait_for_timeout(int(700 * SLOW))
        sa, sb = A.evaluate(STATE), B.evaluate(STATE)
        ok('both in a lockstep game', sa['co'] and sb['co'] and sa['link'] == 'play' and sb['link'] == 'play', (sa, sb))
        ok('same level, heroes in host/guest order', sa['lvl'] == 3 and sb['lvl'] == 3 and A.evaluate("() => window.TD.PLY.map(p => p.hid).join()") == 'falafel,cat' and B.evaluate("() => window.TD.PLY.map(p => p.hid).join()") == 'falafel,cat')
        ok('each controls his own player', A.evaluate("() => window.TD.G.co.me") == 0 and B.evaluate("() => window.TD.G.co.me") == 1)
        A.evaluate(MASH, [11, 'KR']); B.evaluate(MASH, [99, 'KR'])
        A.wait_for_timeout(6000)
        sa, sb = A.evaluate(STATE), B.evaluate(STATE)
        st = A.evaluate("() => Math.round(window.TD.NET.stallTot || 0)"), B.evaluate("() => Math.round(window.TD.NET.stallTot || 0)")
        ok('waiting for the other player is a small share of the time', max(st) < 2500, ('stalled ms', st, 'D', sa['D'], 'rtt', sa['rtt']))
        ok('frames advance on both', sa['f'] > 200 and sb['f'] > 200, (sa['f'], sb['f']))
        ok('frames stay within the input delay', abs(sa['f'] - sb['f']) <= sa['D'] + 6, (sa['f'], sb['f'], 'D', sa['D']))
        ha, hb = A.evaluate("() => window.TD.NET.hh"), B.evaluate("() => window.TD.NET.hh")
        common = [k for k in ha if k in hb]
        ok('state hashes were compared', len(common) >= 5, len(common))
        ok('hashes identical on both machines despite different local profiles', all(ha[k] == hb[k] for k in common) and sb['bad'] == 0 and sa['bad'] == 0, (len(common), sa['bad'], sb['bad']))
        ok('a different local difficulty did not leak into the match', A.evaluate("() => window.TD.G.co.df") == 'normal' and B.evaluate("() => window.TD.G.co.df") == 'normal' and B.evaluate("() => window.TD.S.diff") == 'hell')
        if SHOTS:
            os.makedirs(SHOTS, exist_ok=True); A.locator('#stage').screenshot(path=f'{SHOTS}/net_co_A.png'); B.locator('#stage').screenshot(path=f'{SHOTS}/net_co_B.png')

        print('forced drift and resync')
        A.evaluate(STOP); B.evaluate(STOP)
        for _ in range(40):                                    # wait until both are alive in a play state, then nudge only the guest's copy
            if A.evaluate("() => window.TD.G.state") == 'play' and B.evaluate("() => window.TD.G.state") == 'play': break
            A.wait_for_timeout(250)
        B.evaluate("() => { const T = window.TD; T.PLY[0].x += 0.37; T.PLY[1].vy -= 3 }")
        A.wait_for_timeout(4500)
        sa, sb = A.evaluate(STATE), B.evaluate(STATE)
        ok('guest noticed the divergence', sb['bad'] >= 1, sb['bad'])
        ok('guest was repaired from the host snapshot', sb['fixes'] >= 1, sb['fixes'])
        A.wait_for_timeout(2500)
        ha, hb = A.evaluate("() => window.TD.NET.hh"), B.evaluate("() => window.TD.NET.hh")
        last = sorted(int(k) for k in ha if k in hb)[-4:]
        ok('hashes agree again after the repair', all(ha[str(k)] == hb[str(k)] for k in last) and len(last) >= 3, last)

        print('win and return to the lobby')
        A.evaluate("() => { window.TD.NET.tr.send({t:'ab'}); window.TD.netToLobby('') }"); A.wait_for_timeout(900)
        ok('Esc-style leave sends both to the lobby', A.evaluate(STATE)['link'] == 'conn' and B.evaluate(STATE)['link'] == 'conn' and B.evaluate("() => window.TD.G.state") == 'co', (A.evaluate(STATE)['link'], B.evaluate(STATE)['link'], B.evaluate("() => window.TD.G.state"), errs[-2:]))
        A.evaluate("""() => { const T = window.TD, c = T.cNew(); c.n = 3; c.d = 0; c.seq = [[0, 1]]; T.CO.sel.custom = c; T.coRender() }"""); A.wait_for_timeout(400)
        ok('custom map reaches the guest through the host choice', B.evaluate("() => !!window.TD.CO.sel.custom"))
        A.evaluate("() => document.getElementById('nGo').click()"); A.wait_for_timeout(500)
        A.evaluate(MASH, [5, 'KR']); B.evaluate(MASH, [6, 'KR'])
        won = False
        for _ in range(120):
            A.wait_for_timeout(500)
            if A.evaluate("() => window.TD.G.state") == 'win': won = True; break
        ok('both players reached the door and the level was won', won, A.evaluate(STATE))
        B.wait_for_timeout(300)
        ok('guest sees the win too', B.evaluate("() => window.TD.G.state") in ('win', 'co'), B.evaluate("() => window.TD.G.state"))
        for _ in range(20):
            A.wait_for_timeout(500)
            if A.evaluate("() => window.TD.G.state") == 'co': break
        B.wait_for_timeout(500)
        ok('after the win both land in the lobby, still connected', A.evaluate("() => window.TD.G.state") == 'co' and B.evaluate("() => window.TD.G.state") == 'co' and A.evaluate(STATE)['link'] == 'conn' and B.evaluate(STATE)['link'] == 'conn', (A.evaluate(STATE)['link'], B.evaluate(STATE)['link']))
        A.evaluate(STOP); B.evaluate(STOP)

        print('race')
        A.evaluate("() => document.getElementById('nModeRace').click()"); A.wait_for_timeout(400)
        ok('guest follows the mode switch', B.evaluate("() => window.TD.NET.mode") == 'race')
        A.evaluate("() => document.getElementById('nGo').click()"); A.wait_for_timeout(600)
        sa, sb = A.evaluate(STATE), B.evaluate(STATE)
        ok('both in a race (single-player engine, no co)', sa['race'] and sb['race'] and not sa['co'] and not sb['co'], (sa['race'], sb['race']))
        ok('countdown is showing and the world is frozen', A.evaluate("() => !document.getElementById('raceCd').classList.contains('hide') && window.TD.G.race.hold > 0") and A.evaluate("() => window.TD.G.t") < 0.05)
        B.evaluate("() => { window.TD.KR.r = false }")
        A.wait_for_timeout(3800)
        ok('countdown finished', not A.evaluate("() => window.TD.G.race.hold > 0") and not B.evaluate("() => window.TD.G.race.hold > 0"))
        # only the guest runs
        B.evaluate(MASH, [8, 'K'])
        B.wait_for_timeout(1500)
        ghost = A.evaluate("() => { const r = window.TD.G.race; return [r.seen, Math.round(r.opp.x), Math.round(window.TD.P.x)] }")
        ok('the host sees the guest ghost moving ahead', ghost[0] and ghost[1] > ghost[2] + 40, ghost)
        ok('race bar shows progress', B.evaluate("() => parseFloat(document.getElementById('rbMe').style.left) > 0"))
        if SHOTS: A.locator('#stage').screenshot(path=f'{SHOTS}/net_race_A.png')
        fin = False
        for _ in range(160):
            B.wait_for_timeout(500)
            if B.evaluate("() => !!(window.TD.G.race && window.TD.G.race.res)"): fin = True; break
        ok('the race finished with a result on the guest', fin)
        A.wait_for_timeout(400)
        ra, rb = A.evaluate("() => window.TD.G.race.res"), B.evaluate("() => window.TD.G.race.res")
        ok('host and guest agree: the guest won', ra and rb and ra['w'] == 1 and rb['w'] == 1, (ra, rb))
        ok('result overlay shown on both', A.evaluate("() => !document.getElementById('raceRes').classList.contains('hide')") and B.evaluate("() => !document.getElementById('raceRes').classList.contains('hide')"))
        if SHOTS: A.locator('#stage').screenshot(path=f'{SHOTS}/net_race_res_A.png'); B.locator('#stage').screenshot(path=f'{SHOTS}/net_race_res_B.png')
        ok('no rewards in a race', A.evaluate("() => window.TD.S.coins") == 5 and B.evaluate("() => window.TD.S.coins") == 777)
        B.evaluate("() => document.getElementById('rrBack').click()"); A.wait_for_timeout(600)
        ok('race over -> both back in the lobby', A.evaluate("() => window.TD.G.state") == 'co' and B.evaluate("() => window.TD.G.state") == 'co' and not A.evaluate("() => !!window.TD.G.race"))

        print('leaving')
        B.evaluate("() => window.TD.netLeave('')"); A.wait_for_timeout(500)
        ok('host is told the guest left', A.evaluate(STATE)['link'] == 'off', A.evaluate(STATE)['link'])
        ok('guest is back on the title screen', B.evaluate("() => window.TD.G.state") != 'play')

        A.wait_for_timeout(1300)
        if db: ok('the room is removed from the database when everybody left', db.get(['dhr', sa['code']]) is None, list((db.get(['dhr']) or {}).keys()))
        print('errors', errs[:5]); ok('no page errors', not errs, errs[:3])
        b.close()
    srv.shutdown()
    if db: db.close()

run()
print('RESULT:', 'ALL OK' if bad == 0 else f'{bad} FAILED'); sys.exit(1 if bad else 0)
