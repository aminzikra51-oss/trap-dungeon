# Round mutators (src/w_mut.js): the zone is there, it changes the physics the way it says, and two runs with the same keys end up in the same place.
import os, sys, json
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
bad = 0
def ok(name, cond, extra=''):
    global bad
    print(('  ok   ' if cond else '  FAIL ') + name + ('  ' + json.dumps(extra) if extra != '' else ''))
    if not cond: bad += 1
JS = """([mu, script]) => { const T = window.TD, G = T.G, K = T.K, K2 = T.K2;
  T.coStart({hero: ['falafel', 'cat'], level: 3, local: true, me: 0, df: 'normal', vs: 321, mu}); G.state = 'play';
  const Lz = T.L.zones.slice(), top = Lz.length ? Lz[Lz.length - 1].type : null, out = {top, mut: T.L.mut, n: Lz.length, name: T.L.name};
  const set = (o, k) => Object.assign(o, {l: false, r: false, j: false, jp: false, a: false, ap: false, g: false, gp: false}, k);
  const log = [];
  for (let i = 0; i < script.length; i++) { const k = script[i]; set(K, k); set(K2, {}); T.update(1 / 60); const p = T.PLY[0]; log.push([Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10, Math.round(p.vy)]) }
  out.log = log; out.f = T.PLY.map(p => [Math.round(p.x * 100) / 100, Math.round(p.y * 100) / 100]); return out }"""
def run(pg, mu, script): return pg.evaluate(JS, [mu, script])
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(); pg.goto('file://' + ROOT + '/trap-dungeon.html'); pg.wait_for_timeout(400)
    pg.evaluate("() => { const T = window.TD; T.sim(false); T.S.best = 14; T.S.own.robot = 1; T.S.diff = 'normal' }")
    runR = [{'r': True}] * 60 + [{}] * 90                     # run for a second, then let go and slide
    base = run(pg, 'none', runR); xr = base['log'][59][0] - base['log'][20][0]; sl0 = base['log'][-1][0] - base['log'][60][0]
    ok('no mutator: no extra zone', base['top'] in (None, 'ice', 'wind', 'rev', 'float', 'belt', 'mud') and base['mut'] is None)
    fast = run(pg, 'fast', runR); xf = fast['log'][59][0] - fast['log'][20][0]
    ok('fast: the zone is there and everybody runs about 30 % faster', fast['top'] == 'fast' and fast['mut'] == 'fast' and xf > xr * 1.2, (xr, xf))
    oil = run(pg, 'oil', runR); sl1 = oil['log'][-1][0] - oil['log'][60][0]
    ok('oil: the zone is there and he slides much further after letting go', oil['top'] == 'oil' and sl1 > sl0 * 2 + 10, (sl0, sl1))
    jmp = [{}] * 20 + [{'j': True, 'jp': True}] + [{'j': True}] * 40 + [{}] * 60
    jb = run(pg, 'none', jmp); jl = run(pg, 'low', jmp)
    apx = lambda r: min(l[1] for l in r['log'])
    ok('low: the zone is there and the jump goes higher', jl['top'] == 'float' and apx(jl) < apx(jb) - 10, (apx(jb), apx(jl)))
    # bounce: a long fall; after landing he must go up again
    drop = [{}] * 150
    bo = run(pg, 'bounce', [{}] * 5 + [{'j': True, 'jp': True}] + [{'j': True}] * 20 + [{}] * 120)
    vys = [l[2] for l in bo['log']]; ups = [i for i in range(10, len(vys)) if vys[i] < -120 and vys[i-1] > 250]      # a fresh upward kick after the jump is over
    ok('bounce: the zone is there and landing hard throws him back up', bo['top'] == 'bounce' and len(ups) > 0, (bo['top'], ups[:5]))
    ch = [run(pg, 'chaos', [{}] * 2)['top']]
    ok('chaos gives one of the four zones', ch[0] in ('float', 'oil', 'bounce', 'fast'), ch)
    # determinism: the same keys twice end in exactly the same place (all four)
    mix = [{'r': True}] * 40 + [{'r': True, 'j': True, 'jp': True}] + [{'r': True, 'j': True}] * 20 + [{'l': True}] * 50 + [{}] * 40 + [{'r': True, 'j': True, 'jp': True}] + [{}] * 80
    for mu in ['low', 'oil', 'bounce', 'fast']:
        a, c = run(pg, mu, mix), run(pg, mu, mix)
        ok('same keys -> same place, ' + mu, a['f'] == c['f'] and a['log'] == c['log'], (a['f'], c['f']))
    names = [run(pg, 'chaos', [{}])['name']]
    ok('the level name tells which mutator is on', any(s in names[0] for s in ('🌙', '🛢', '🏀', '⚡')), names)
    # single player is never touched
    r = pg.evaluate("() => { const T = window.TD; T.G.co = null; T.G.race = null; T.startGame(3); return [T.L.mut || null, T.L.zones.some(z => z.mut)] }")
    ok('single player never gets a mutator', r == [None, False], r)
    # a chase level (every third from 6) never gets one
    r = pg.evaluate("() => { const T = window.TD; T.coStart({hero: ['falafel', 'cat'], level: 6, local: true, me: 0, df: 'normal', vs: 321, mu: 'oil'}); return [T.L.chase || null, T.L.mut || null] }")
    ok('a chase level is left alone', r[0] is not None and r[1] is None, r)
    b.close()
print('RESULT:', bad, 'FAILED' if bad else 'all fine'); sys.exit(1 if bad else 0)
