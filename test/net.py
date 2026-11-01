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
STATE = "() => { const T = window.TD, N = T.NET; return {link: N.link, f: N.f, bad: N.bad, fixes: N.fixes, st: T.G.state, co: !!T.G.co, race: !!T.G.race, mode: N.mode, peer: N.peer, rtt: Math.round(N.rtt), D: N.dl, c: N.c, nrb: N.nrb, rbFr: N.rbFr, maxRb: N.maxRb, lvl: T.G.level, msg: N.msg, code: N.code} }"

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
        A.evaluate(SETUP, {'best': 14, 'diff': 'crazy', 'hero': 'falafel', 'own': ['falafel'], 'coins': 5, 'q': 1, 'nu': nu})
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
        ok('level choice is free online: progress of either player does not limit it', A.evaluate("() => window.TD.coMax()") == 999 and B.evaluate("() => window.TD.coMax()") == 999)
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
        A.evaluate("() => { window.TD.CO.sel.n = 140; window.TD.coRender() }"); A.wait_for_timeout(int(300 * SLOW))
        ok('a level far beyond both players\' progress (best 14 / 9) is accepted', B.evaluate("() => window.TD.CO.sel.n") == 140)
        ok('co-op default difficulty is impossible on both lobbies', A.evaluate("() => window.TD.coDf()") == 'hell' and B.evaluate("() => window.TD.coDf()") == 'hell')
        A.evaluate("() => { window.TD.CO.sel.df = 'nightmare'; window.TD.CO.sel.n = 3; window.TD.coRender() }"); A.wait_for_timeout(int(300 * SLOW))
        ok('the guest follows the host difficulty choice (nightmare)', B.evaluate("() => window.TD.coDf()") == 'nightmare' and B.evaluate("() => window.TD.CO.sel.n") == 3)
        ok('guest cannot change the level or the difficulty himself', B.evaluate("() => [document.getElementById('coNext10').disabled, document.getElementById('coLvIn').disabled, document.querySelector('#co [data-cdf=hell]').disabled]") == [True, True, True])
        A.evaluate("() => document.getElementById('nGo').click()"); A.wait_for_timeout(int(700 * SLOW))
        sa, sb = A.evaluate(STATE), B.evaluate(STATE)
        ok('both in a lockstep game', sa['co'] and sb['co'] and sa['link'] == 'play' and sb['link'] == 'play', (sa, sb))
        ok('same level, heroes in host/guest order', sa['lvl'] == 3 and sb['lvl'] == 3 and A.evaluate("() => window.TD.PLY.map(p => p.hid).join()") == 'falafel,cat' and B.evaluate("() => window.TD.PLY.map(p => p.hid).join()") == 'falafel,cat')
        ok('each controls his own player', A.evaluate("() => window.TD.G.co.me") == 0 and B.evaluate("() => window.TD.G.co.me") == 1)
        A.evaluate(MASH, [11, 'KR']); B.evaluate(MASH, [99, 'KR'])
        A.wait_for_timeout(6000)
        sa, sb = A.evaluate(STATE), B.evaluate(STATE)
        st = A.evaluate("() => Math.round(window.TD.NET.stallTot || 0)"), B.evaluate("() => Math.round(window.TD.NET.stallTot || 0)")
        ok('waiting for the other player is (almost) never needed', max(st) < 1200, ('stalled ms', st, 'dl', sa['D'], 'rtt', sa['rtt']))
        ok('wrong guesses were repaired by rollbacks, and they stay short', (sa['nrb'] + sb['nrb'] >= 1 or not RTDB) and max(sa['maxRb'], sb['maxRb']) <= 24 + 10, (sa['nrb'], sb['nrb'], 'frames', sa['rbFr'], sb['rbFr'], 'max', sa['maxRb'], sb['maxRb']))
        ok('frames advance on both', sa['f'] > 200 and sb['f'] > 200, (sa['f'], sb['f']))
        ok('the machines run side by side (within the allowed lead)', abs(sa['f'] - sb['f']) <= 24 + 8 + int(sa['rtt'] / 16.7), (sa['f'], sb['f'], 'rtt', sa['rtt']))
        ok('confirmed frames trail the head only a little', sa['f'] - sa['c'] <= 24 and sb['f'] - sb['c'] <= 24, (sa['f'] - sa['c'], sb['f'] - sb['c']))
        ha, hb = A.evaluate("() => window.TD.NET.hh"), B.evaluate("() => window.TD.NET.hh")
        common = [k for k in ha if k in hb]
        ok('state hashes were compared', len(common) >= 5, len(common))
        ok('hashes identical on both machines despite different local profiles', all(ha[k] == hb[k] for k in common) and sb['bad'] == 0 and sa['bad'] == 0, (len(common), sa['bad'], sb['bad']))
        ok('a different local difficulty did not leak into the match', A.evaluate("() => window.TD.G.co.df") == 'nightmare' and B.evaluate("() => window.TD.G.co.df") == 'nightmare' and A.evaluate("() => window.TD.L.dk") == 'nightmare' and B.evaluate("() => window.TD.S.diff") == 'hell' and A.evaluate("() => window.TD.S.diff") == 'crazy')
        if SHOTS:
            os.makedirs(SHOTS, exist_ok=True); A.locator('#stage').screenshot(path=f'{SHOTS}/net_co_A.png'); B.locator('#stage').screenshot(path=f'{SHOTS}/net_co_B.png')

        print('forced drift and resync')
        A.evaluate(STOP); B.evaluate(STOP); A.wait_for_timeout(int(900 * SLOW))        # let the last key changes still on the wire land first (a rollback would erase the nudge)
        for _ in range(40):                                    # wait until both are alive in a play state, then nudge only the guest's copy
            if A.evaluate("() => window.TD.G.state") == 'play' and B.evaluate("() => window.TD.G.state") == 'play': break
            A.wait_for_timeout(250)
        # my own key must move my own character at once, whatever the connection (this is the whole point of the rollback)
        imm = {'frames': 99}
        for key in ('r', 'l', 'r'):
            imm = A.evaluate("""(key) => new Promise(res => { const T = window.TD, N = T.NET, f0 = N.f, x0 = T.PLY[0].x; T.KR[key] = true; const t0 = performance.now();
              const iv = setInterval(() => { if (Math.abs(T.PLY[0].x - x0) > 0.01 || N.f - f0 > 40) { clearInterval(iv); T.KR[key] = false; res({frames: N.f - f0, ms: Math.round(performance.now() - t0)}) } }, 2) })""", key)
            if imm['frames'] <= 6: break
            A.wait_for_timeout(int(500 * SLOW))
        ok('my key moves my character within a few frames, not after the round trip', imm['frames'] <= 6, (imm, 'rtt', A.evaluate(STATE)['rtt']))
        A.wait_for_timeout(int(900 * SLOW))
        fa, fb = A.evaluate("() => window.TD.NET.fxN"), B.evaluate("() => window.TD.NET.fxN")
        da, db_ = A.evaluate("() => window.TD.G.deaths"), B.evaluate("() => window.TD.G.deaths")
        ok('every death / effect ran exactly once, on both machines, only when confirmed', fa.get('d', 0) == fb.get('d', 0) == da == db_, (fa, fb, da, db_))
        for _try in range(4):
            for _ in range(40):
                if A.evaluate("() => window.TD.G.state") == 'play' and B.evaluate("() => window.TD.G.state") == 'play': break
                A.wait_for_timeout(250)
            B.evaluate("() => { const T = window.TD; T.PLY[0].x += 0.37; T.PLY[1].vy -= 3 }")
            A.wait_for_timeout(int(2400 * SLOW))
            sa, sb = A.evaluate(STATE), B.evaluate(STATE)
            if sb['bad'] >= 1: break
        A.wait_for_timeout(int(2000 * SLOW))
        sa, sb = A.evaluate(STATE), B.evaluate(STATE)
        ok('guest noticed the divergence', sb['bad'] >= 1, (sb['bad'], sa['bad'], sb['st'], sa['st'], sb['f'], sb['c']))
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
        seen = False
        for _ in range(16):   # the guest trails the confirmed frame by about a round trip (more on the slow relay)
            B.wait_for_timeout(250)
            if B.evaluate("() => window.TD.G.state") in ('win', 'co'): seen = True; break
        ok('guest sees the win too', seen, B.evaluate("() => window.TD.G.state"))
        for _ in range(20):
            A.wait_for_timeout(500)
            if A.evaluate("() => window.TD.G.state") == 'co': break
        B.wait_for_timeout(500)
        ok('after the win both land in the lobby, still connected', A.evaluate("() => window.TD.G.state") == 'co' and B.evaluate("() => window.TD.G.state") == 'co' and A.evaluate(STATE)['link'] == 'conn' and B.evaluate(STATE)['link'] == 'conn', (A.evaluate(STATE)['link'], B.evaluate(STATE)['link']))
        A.evaluate(STOP); B.evaluate(STOP)

        print('online puzzles: one bot per machine, each controls only his own player')
        BOT = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'puzbot.js'), encoding='utf-8').read()
        for v in ([x for x in os.environ['PUZ'].split(',')] if os.environ.get('PUZ') else (['gate', 'ladder', 'lift'] if RTDB else ['gate', 'ladder', 'bridge', 'sync', 'lift'])):
            for pg in (A, B): pg.evaluate("(v) => { window.TD.FLAGS.coScript = [['co', v]] }", v)
            A.evaluate("() => { window.TD.CO.sel.custom = null; window.TD.CO.sel.n = 1; window.TD.coRender() }"); A.wait_for_timeout(int(500 * SLOW))
            A.evaluate("() => document.getElementById('nGo').click()"); A.wait_for_timeout(int(900 * SLOW))
            for pg, me in ((A, 0), (B, 1)):
                pg.evaluate("""([src, me, v]) => { const bot = eval(src)(me, v); window.__bot = setInterval(() => { const k = bot(), KR = window.TD.KR; KR.l = k.l; KR.r = k.r; KR.j = k.j; if (k.jp) KR.jp = true }, 16) }""", [BOT, me, v])
            done = False
            for _ in range(int(240 / 0.5)):
                A.wait_for_timeout(500)
                fa, fb = A.evaluate("() => window.TD.NET.fxN"), B.evaluate("() => window.TD.NET.fxN")
                if fa.get('w') and fb.get('w'): done = True; break
            sa, sb = A.evaluate(STATE), B.evaluate(STATE)
            ok(f'puzzle {v}: both bots solved it together and the level was won on both machines', done, (fa, fb, 'f', sa['f'], 'deaths', A.evaluate("() => window.TD.G.deaths"), B.evaluate("() => window.TD.G.deaths")))
            ok(f'puzzle {v}: no desync (hash mismatches) on either machine', sa['bad'] == 0 and sb['bad'] == 0, (sa['bad'], sb['bad'], 'fixes', sa['fixes'], sb['fixes'], 'rollbacks', sa['nrb'], sb['nrb']))
            for pg in (A, B): pg.evaluate("() => { clearInterval(window.__bot); for (const o of [window.TD.KR, window.TD.K]) o.l = o.r = o.j = o.a = false }")
            for _ in range(20):
                A.wait_for_timeout(500)
                if A.evaluate("() => window.TD.G.state") == 'co' and B.evaluate("() => window.TD.G.state") == 'co': break
            ok(f'puzzle {v}: both are back in the lobby afterwards', A.evaluate("() => window.TD.G.state") == 'co' and B.evaluate("() => window.TD.G.state") == 'co', (A.evaluate("() => window.TD.G.state"), B.evaluate("() => window.TD.G.state")))
        for pg in (A, B): pg.evaluate("() => { window.TD.FLAGS.coScript = null }")

        print('race')
        A.evaluate("() => { window.TD.CO.sel.df = 'crazy'; document.getElementById('nModeRace').click() }"); A.wait_for_timeout(400)
        ok('guest follows the mode switch', B.evaluate("() => window.TD.NET.mode") == 'race')
        A.evaluate("() => document.getElementById('nGo').click()"); A.wait_for_timeout(600)
        sa, sb = A.evaluate(STATE), B.evaluate(STATE)
        ok('both in a race (single-player engine, no co)', sa['race'] and sb['race'] and not sa['co'] and not sb['co'], (sa['race'], sb['race']))
        ok('countdown is showing and the world is frozen', A.evaluate("() => !document.getElementById('raceCd').classList.contains('hide') && window.TD.G.race.hold > 0") and A.evaluate("() => window.TD.G.t") < 0.05)
        B.evaluate("() => { window.TD.KR.r = false }")
        A.wait_for_timeout(3800)
        ok('countdown finished', not A.evaluate("() => window.TD.G.race.hold > 0") and not B.evaluate("() => window.TD.G.race.hold > 0"))
        # only the guest runs: it holds "right" for a while (deterministic; a random mash through a crazy level made this check depend on timing)
        B.evaluate("() => { window.TD.K.r = true; window.TD.KR.r = true }")
        B.wait_for_timeout(1500)
        ghost = A.evaluate("() => { const r = window.TD.G.race; return [r.seen, Math.round(r.opp.x), Math.round(window.TD.P.x)] }")
        ok('the host sees the guest ghost moving ahead', ghost[0] and ghost[1] > ghost[2] + 40, ghost + [A.evaluate("() => [window.TD.G.level, window.TD.L.dk, window.TD.G.state]"), B.evaluate("() => [window.TD.G.level, window.TD.L.dk, Math.round(window.TD.P.x), window.TD.G.state]")])
        ok('race bar shows progress', B.evaluate("() => parseFloat(document.getElementById('rbMe').style.left) > 0"))
        if SHOTS: A.locator('#stage').screenshot(path=f'{SHOTS}/net_race_A.png')
        B.evaluate(STOP); B.evaluate("() => { window.TD.G.state = 'play'; window.TD.winLevel() }")        # the guest crosses the finish (the result has to travel to the host)
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
        ok('verdict carries the finish time of the winner, measured from go (not from the last respawn)', rb['tm'][1] is not None and 1.0 < rb['tm'][1] < 12 and rb['tm'][0] is None, rb)
        # round 2: the HOST finishes first, the guest never does -> the host waits only a moment (for a possible earlier guest time), then wins
        A.evaluate("() => { window.TD.CO.sel.n = 3; window.TD.coRender() }"); A.wait_for_timeout(int(400 * SLOW))
        A.evaluate("() => document.getElementById('nGo').click()"); A.wait_for_timeout(int(4600 * SLOW))
        A.evaluate(STOP); B.evaluate(STOP); A.wait_for_timeout(1200)
        t0 = A.evaluate("() => { const T = window.TD; T.G.state = 'play'; T.winLevel(); return performance.now() }")
        fin = False
        for _ in range(80):
            A.wait_for_timeout(100)
            if A.evaluate("() => !!(window.TD.G.race && window.TD.G.race.res)") and B.evaluate("() => !!(window.TD.G.race && window.TD.G.race.res)"): fin = True; break
        ra, rb = A.evaluate("() => window.TD.G.race.res"), B.evaluate("() => window.TD.G.race.res")
        ok('host finishes first: verdict reaches both', fin and ra and rb and ra['w'] == 0 and rb['w'] == 0, (ra, rb))
        ok('...with his time measured from go, and the guest has none', ra and ra['tm'][0] is not None and 0.5 < ra['tm'][0] < 12 and ra['tm'][1] is None, ra)
        ok('the host waited a grace moment, not forever', A.evaluate("() => window.TD.G.race.res !== null") and (A.evaluate("() => performance.now()") - t0) < 3000)
        ok('the finished player saw a waiting message / the result overlay', A.evaluate("() => !document.getElementById('raceRes').classList.contains('hide')"))
        B.evaluate("() => document.getElementById('rrBack').click()"); A.wait_for_timeout(700)
        ok('back in the lobby after round 2', A.evaluate("() => window.TD.G.state") == 'co' and B.evaluate("() => window.TD.G.state") == 'co')
        # the clerk's maths (host side): draw within 80 ms, earlier time wins, waits for a late message but not forever
        J = A.evaluate("""() => { const j = window.TD.raceJudge; return [j(10, 10.05, 12, 100), j(10, 10.5, 12, 100), j(10.5, 10, 12, 100), j(null, 12, 12.0, 100), j(null, 12, 12.1, 100), j(12, null, 12.05, 100), j(12, null, 12.5, 100), j(12, null, 12.5, 2000), j(12, null, 13.1, 2000), j(10, 10.07, 12, 0), j(10, 10.09, 12, 0)] }""")
        ok('raceJudge: draw / earlier wins / waits for the guest message / grace is bounded', J == [-1, 0, 1, None, 1, None, 0, None, 0, -1, 0], J)

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
