"""Online co-op under bad networks: two pages play the same co-op level (random key mashing on both) through the fake Firebase relay while the relay
behaves like a mobile connection (delay, jitter, retransmission stalls, reordered PUTs, periodic bursts). Prints what the player would feel:
  freeze   = time the simulation did not advance at all for > 100 ms (the hitches), longest and total
  pops     = corrections of a character's position after a rollback (count above 6 px, biggest, sum); shown = what was actually drawn jumping in ONE frame
  rb       = rollbacks and re-simulated frames,  stall = the hard "waiting for your friend" waits,  bad/fix = state hash mismatches / host snapshots
usage: python3 test/netsim.py [--secs 20] [--lvl 3 | --lvls 1,2,5,...] [--relay] [--strict] [profile ...]      profiles: good mobile bad (default: all three)
  --cpu N  : slow both pages down N times (Chrome devtools throttling) to see what a phone would feel
  --calm   : human-like key changes instead of the harsh 90 ms mash
  --relay  : never use WebRTC, only the database relay (the fallback path);  --strict : fail (exit 1) when the numbers are worse than a human tolerates"""
import sys, os, threading, http.server, socketserver, functools
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fake_rtdb import FakeRtdb
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARGV = sys.argv[1:]
SECS = float(ARGV[ARGV.index('--secs') + 1]) if '--secs' in ARGV else 20
LVL = int(ARGV[ARGV.index('--lvl') + 1]) if '--lvl' in ARGV else 3
LVLS = [int(x) for x in ARGV[ARGV.index('--lvls') + 1].split(',')] if '--lvls' in ARGV else []        # desync fuzz: the same fast network, many levels, state hashes must agree everywhere
RELAY = '--relay' in ARGV
PUZS = ARGV[ARGV.index('--puz') + 1].split(',') if '--puz' in ARGV else []        # force this co-op puzzle (FLAGS.coScript) on every level: desync fuzz for puzzle pieces
CPU = float(ARGV[ARGV.index('--cpu') + 1]) if '--cpu' in ARGV else 1                      # CPU slowdown factor (4 = roughly a mid-range phone)
STRICT = '--strict' in ARGV
CALM = '--calm' in ARGV                                                   # people hold a direction for 0.3-1 s; the default mash changes keys every 90 ms (a harsh stress test)
PROFILES = {
    'good':   dict(lat=.03, jit=.01),
    'mobile': dict(lat=.15, jit=.08, loss=.01, rto=.25, wjit=.06),
    'bad':    dict(lat=.25, jit=.15, loss=.03, rto=.40, wjit=.12, spike=(8, 1.2, .5)),
}
names = [a for a in ARGV if a in PROFILES] or list(PROFILES)
# what a person tolerates on each profile: (longest freeze ms, total freeze ms, biggest drawn jump px)
LIMITS = {'good': (150, 400, 14), 'mobile': (350, 1500, 40), 'bad': (800, 4000, 70)}

class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def serve():
    h = functools.partial(Q, directory=ROOT); srv = socketserver.TCPServer(('127.0.0.1', 0), h); srv.allow_reuse_address = True
    threading.Thread(target=srv.serve_forever, daemon=True).start(); return srv, srv.server_address[1]

SETUP = """(cfg) => { const T = window.TD, S = T.S; T.sim(false); S.best = 14; S.diff = 'hell'; S.hero = cfg.hero; S.own[cfg.hero] = 1; S.nu = cfg.nu; S.q = 1; if (cfg.relay) S.nt = 'relay'; return true }"""
MASH = """([seed, q]) => { let s = seed; const r = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; const KR = window.TD.KR;
  window.__mash = setInterval(() => { if (r() > q) return; KR.r = r() < .7; KR.l = r() < .08; const j = r() < .35; if (j && !KR.j) KR.jp = true; KR.j = j; const a = r() < .1; if (a && !KR.a) KR.ap = true; KR.a = a }, 90) }"""
INSTR = """() => { const T = window.TD, N = T.NET; const v = window.__v = {fzN: 0, fzTot: 0, fzMax: 0, jump: 0, jn: 0, gap: 0, lastF: N.f, lastT: performance.now(), px: null, dc: -1, skip: 0, raf: performance.now(), t0: performance.now(), f0: N.f};
  (function tick() { const now = performance.now(); v.gap = Math.max(v.gap, now - v.raf); v.raf = now;
    if (N.f !== v.lastF) { const g = now - v.lastT; if (g > 100) { v.fzN++; v.fzTot += g; if (g > v.fzMax) v.fzMax = g } v.lastF = N.f; v.lastT = now }
    const dc = T.G.deaths; if (dc !== v.dc) { v.dc = dc; v.skip = 30 } if (v.skip > 0) { v.skip--; v.px = null }       // a respawn is a real teleport, not a network artefact
    const r = T.PLY && T.PLY[1 - N.me]; if (r && T.G.state === 'play' && v.skip <= 0) { const o = N.vo && N.vo[r.idx], x = r.x + (o ? o.x : 0), y = r.y + (o ? o.y : 0);
      if (v.px != null) { const d = Math.hypot(x - v.px, y - v.py); if (d > v.jump) v.jump = d; if (d > 12) v.jn++ } v.px = x; v.py = y } else v.px = null;
    requestAnimationFrame(tick) })() }"""
GET = """() => { const N = window.TD.NET, v = window.__v; return {f: N.f, c: N.c, rb: N.nrb, rbFr: N.rbFr, maxRb: N.maxRb, stN: N.stallN, stTot: Math.round(N.stallTot || 0), stMax: Math.round(N.stallMax || 0),
  popN: N.popN, popMax: Math.round(N.popMax), popTot: Math.round(N.popTot), bad: N.bad, fix: N.fixes, rtt: Math.round(N.rtt), tp: N.tpk || N.kind, fz: v.fzN, fzTot: Math.round(v.fzTot), fzMax: Math.round(v.fzMax),
  jump: Math.round(v.jump), jn: v.jn, gap: Math.round(v.gap), fps: Math.round((N.f - v.f0) / ((performance.now() - v.t0) / 1000)), dl: N.dl, rbT: Math.round(N.rbT || 0), rbMax: Math.round((N.rbTmax || 0) * 10) / 10, spec: N.spec} }"""

bad = 0
def ok(name, cond, extra=''):
    global bad
    print(('  ok   ' if cond else '  FAIL ') + name + (('  [' + str(extra) + ']') if extra != '' else ''))
    if not cond: bad += 1

def play(p, port, name, lvl, puz=None):
    prof = PROFILES[name]; db = FakeRtdb(**prof); url = f'http://127.0.0.1:{port}/trap-dungeon.html'
    ctx = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required', '--disable-features=WebRtcHideLocalIpsWithMdns']).new_context(viewport={'width': 900, 'height': 520})
    A = ctx.new_page(); B = ctx.new_page(); errs = []
    if CPU > 1:
        for pg in (A, B): pg.context.new_cdp_session(pg).send('Emulation.setCPUThrottlingRate', {'rate': CPU})
    for nm, pg in (('A', A), ('B', B)):
        pg.on('pageerror', lambda e, nm=nm: errs.append(nm + ':' + str(e)))
        pg.goto(url); pg.wait_for_function('() => window.TD && window.TD.S', timeout=30000); pg.wait_for_timeout(500)
    A.evaluate(SETUP, {'hero': 'falafel', 'nu': db.url, 'relay': RELAY}); B.evaluate(SETUP, {'hero': 'cat', 'nu': db.url, 'relay': RELAY})
    if puz:
        for pg in (A, B): pg.evaluate("(v) => { window.TD.FLAGS.coScript = [['co', v]] }", puz)
    A.evaluate("() => { window.TD.coOpen(''); document.getElementById('coTabN').click(); document.getElementById('nHost').click() }")
    code = A.evaluate("() => window.TD.NET.code")
    B.evaluate("() => { window.TD.coOpen(''); document.getElementById('coTabN').click() }")
    B.evaluate("(c) => { document.getElementById('nCode').value = c; document.getElementById('nJoin').click() }", code)
    for _ in range(60):
        B.wait_for_timeout(250)
        if A.evaluate("() => window.TD.NET.link") == 'conn' and B.evaluate("() => window.TD.NET.link") == 'conn': break
    B.wait_for_timeout(2500)                                   # a few pings first, like a lobby does
    A.evaluate("(n) => { window.TD.CO.sel.n = n; window.TD.coRender() }", lvl); A.wait_for_timeout(400)
    A.evaluate("() => document.getElementById('nGo').click()"); A.wait_for_timeout(1500)
    for pg in (A, B): pg.evaluate(INSTR)
    A.evaluate(MASH, [11, .2 if CALM else 1]); B.evaluate(MASH, [99, .2 if CALM else 1])
    A.wait_for_timeout(int(SECS * 1000))
    ra, rb = A.evaluate(GET), B.evaluate(GET)
    out = (ra, rb, errs, db.nput)
    ctx.browser.close(); db.close()
    return out

def p_ok(p, port, lv):
    b = p.chromium.launch(); pg = b.new_page(); pg.goto(f'http://127.0.0.1:{port}/trap-dungeon.html'); pg.wait_for_function('() => window.TD && window.TD.S', timeout=30000)
    r = pg.evaluate("(n) => window.TD.coPlayable(n)", lv); b.close(); return r

def row(who, r):
    return (f"  {who} fps {r['fps']:>3} dl {r['dl']} rtt {r['rtt']:>4} | freeze {r['fz']:>2}x max {r['fzMax']:>4} tot {r['fzTot']:>5} ms | stall {r['stN']:>2}x max {r['stMax']:>4} tot {r['stTot']:>5} | "
            f"rb {r['rb']:>4} ({r['rbFr']:>5} fr, max {r['maxRb']:>2}) | pops>6px {r['popN']:>3} max {r['popMax']:>3} sum {r['popTot']:>5} | shown jumps>12px {r['jn']:>3} max {r['jump']:>3} | rb cost max {r['rbMax']} ms tot {r['rbT']} | bad {r['bad']} fix {r['fix']} | {r['tp']}")

def main():
    srv, port = serve()
    with sync_playwright() as p:
        if PUZS:
            print(f'desync fuzz of single puzzles (mashing on both, {SECS:.0f} s each, profile {names[0]})')
            for v in PUZS:
                ra, rb, errs, nput = play(p, port, names[0], 1, v)
                ok(f'puzzle {v}: hashes agree and nobody crashed', ra['bad'] == 0 and rb['bad'] == 0 and not errs, (ra['bad'], rb['bad'], 'fixes', ra['fix'], rb['fix'], 'frames', ra['f'], rb['f'], 'rb', ra['rb'], rb['rb'], errs[:2]))
                ok(f'puzzle {v}: it actually ran', ra['f'] > SECS * 25 and rb['f'] > SECS * 25, (ra['f'], rb['f']))
            srv.shutdown(); return
        if LVLS:
            print(f'desync fuzz on the good profile, {SECS:.0f} s per level')
            for lv in LVLS:
                if not p_ok(p, port, lv): print(f'  skip level {lv}: not playable in co-op'); continue
                ra, rb, errs, nput = play(p, port, 'good', lv)
                ok(f'level {lv}: the two machines agree on the state of every confirmed frame (hashes)', ra['bad'] == 0 and rb['bad'] == 0 and not errs, (ra['bad'], rb['bad'], 'fixes', ra['fix'], rb['fix'], 'frames', ra['f'], errs[:2]))
            srv.shutdown(); return
        for name in names:
            print(f'\n== {name} {PROFILES[name]}  ({SECS:.0f} s, level {LVL}{", relay only" if RELAY else ""})')
            ra, rb, errs, nput = play(p, port, name, LVL)
            print(row('A', ra)); print(row('B', rb)); print(f'  database writes: {nput} ({nput / SECS:.0f}/s)')
            lim = LIMITS[name]
            if STRICT:
                ok(f'{name}: no long freeze', max(ra['fzMax'], rb['fzMax']) <= lim[0], (ra['fzMax'], rb['fzMax']))
                ok(f'{name}: little total freezing', max(ra['fzTot'], rb['fzTot']) <= lim[1], (ra['fzTot'], rb['fzTot']))
                ok(f'{name}: nothing is drawn jumping far in one frame', max(ra['jump'], rb['jump']) <= lim[2], (ra['jump'], rb['jump']))
                ok(f'{name}: the machines never disagree about the state', ra['bad'] == 0 and rb['bad'] == 0, (ra['bad'], rb['bad']))
            ok(f'{name}: no page errors', not errs, errs[:3])
    srv.shutdown()

main()
print('RESULT:', 'ALL OK' if bad == 0 else f'{bad} FAILED'); sys.exit(1 if bad else 0)
