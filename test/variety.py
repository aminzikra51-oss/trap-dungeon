"""Variety system: seeded replays, new patterns, fairness of every new pattern.
usage: python3 test/variety.py struct            fast structural checks
       python3 test/variety.py fair [steps] [seeds]   solver sweep of each new pattern on small test strips"""
import sys, json
sys.path.insert(0, 'test')
from solver import SOLVER
from playwright.sync_api import sync_playwright

STRUCT = r"""
() => {
  const T = window.TD, G = T.G, S = T.S, out = []; const ok = (n, c, x) => out.push([n, !!c, x === undefined ? '' : String(x)]);
  T.sim(true); T.FLAGS.noBoss = true;
  const sig = L => JSON.stringify([L.w, L.segs, L.ents.map(e => [e.t, e.v, Math.round(e.x || 0), Math.round(e.y || 0), e.r || 0]), Object.keys(L.cr).length, Object.keys(L.blocks).length]);
  // 1) determinism: same (n, vs, diff) -> same level; different vs -> different level
  let same = 0, diff = 0, tot = 0;
  for (const n of [5, 9, 14, 23, 40, 77]) for (const dk of ['normal', 'crazy', 'hell']) { const a = sig(T.buildLevel(n, {diff: dk, vs: 123})), b = sig(T.buildLevel(n, {diff: dk, vs: 123})), c = sig(T.buildLevel(n, {diff: dk, vs: 124})); tot++; if (a === b) same++; if (a !== c) diff++ }
  ok('same seed -> identical level', same === tot, same + '/' + tot); ok('another seed -> another level', diff >= tot - 1, diff + '/' + tot);
  // 2) new patterns do show up, and nothing throws, over many seeds
  const seen = {}, errs = []; let built = 0;
  for (const dk of ['normal', 'crazy', 'hell']) for (let n = 3; n <= 60; n += 1) for (let vs = 1; vs <= 6; vs++) { try { const L = T.buildLevel(n, {diff: dk, vs: vs * 1531 + n}); built++;
      if (L.segs.some(q => !(q[1] >= 0 && q[2] > 0 && q[1] + q[2] <= L.w))) errs.push('seg out of range ' + dk + n);
      const D = L.D; for (const k of Object.keys(D.useV || {})) seen[k] = (seen[k] || 0) + D.useV[k] } catch (e) { errs.push(dk + n + ' ' + e.message) } }
  const wanted = Object.values(T.XV).flat().map(e => e[0]); const miss = wanted.filter(w => !seen[w]);
  ok('no exceptions over ' + built + ' built levels', errs.length === 0, errs.slice(0, 3).join(' | '));
  ok('every new pattern appears somewhere', miss.length === 0, 'missing: ' + miss.join(',') + ' | ' + JSON.stringify(seen));
  // 3) no pattern repeats back-to-back more than before: within one level a variant is rarely used >3 times
  let worst = 0; for (let n = 12; n <= 40; n++) { const L = T.buildLevel(n, {diff: 'crazy', vs: 77 + n}); worst = Math.max(worst, ...Object.values(L.D.useV)) } ok('a pattern is not spammed inside one level (max uses ' + worst + ')', worst <= 5);
  // 4) the fixed levels (vs 0) never use the new patterns
  let leak = 0; for (const dk of ['normal', 'crazy', 'hell']) for (let n = 3; n <= 60; n++) { const L = T.buildLevel(n, {diff: dk}); for (const k of Object.keys(L.D.useV || {})) if (wanted.includes(k)) leak++ } ok('canonical levels never contain new patterns', leak === 0, leak);
  // 5) solo flow: seed kept on retry, new after a win, none for tutorials / bosses / when FLAGS.vary is off
  T.FLAGS.vary = true; delete S.vsl; G.lastLvl = -9; T.startGame(7); const s1 = G.vs, a1 = sig(T.L); T.retry(); ok('solo: a seed is assigned from level 3 on', s1 > 0, s1); ok('retry keeps the same arrangement', G.vs === s1 && sig(T.L) === a1);
  G.lastLvl = -9; T.startGame(7); ok('re-entering an uncleared level keeps its seed (S.vsl)', G.vs === s1);
  G.state = 'win'; T.nextLevel(); ok('winning moves on with a different level', G.level === 8 && G.vs !== 0 && (!S.vsl || S.vsl.n !== 7));
  G.lastLvl = -9; T.startGame(7); ok('after clearing, level 7 comes back as a NEW arrangement', G.vs !== s1 || sig(T.L) !== a1, s1 + ' -> ' + G.vs);
  G.lastLvl = -9; T.startGame(2); ok('tutorial levels stay fixed', G.vs === 0); G.lastLvl = -9; T.startGame(1); ok('level 1 fixed', G.vs === 0);
  T.FLAGS.vary = false; G.lastLvl = -9; T.startGame(9); ok('FLAGS.vary off -> canonical', G.vs === 0);
  // 6) online: the host seed is sanitised and travels
  ok('vsSan keeps 1..9999 only', T.vsSan(5) === 5 && T.vsSan(0) === 0 && T.vsSan(10000) === 0 && T.vsSan('x') === 0 && T.vsSan(-3) === 0);
  return out;
}
"""

# one strip per pattern: [family, variant, extra script entries, levels to try]
STRIPS = [('pit', 'island'), ('pit', 'steps'), ('spike', 'wide'), ('spike', 'hurdles'), ('saw', 'big'), ('saw', 'bigvert'), ('walk', 'pack'), ('crush', 'rows'), ('crush', 'drop'), ('arrow', 'cross'), ('terrain', 'zig')]

def report(rows):
    bad = 0
    for name, good, extra in rows:
        print(('  ok  ' if good else '  FAIL') + ' ' + name + (('  [' + extra + ']') if extra else ''))
        bad += 0 if good else 1
    return bad

def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else 'struct'
    steps = int(sys.argv[2]) if len(sys.argv) > 2 else 2500
    seeds = int(sys.argv[3]) if len(sys.argv) > 3 else 2
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        pg = b.new_page(viewport={'width': 1000, 'height': 560}); errs = []
        pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)))
        pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(400)
        bad = 0
        if mode == 'struct':
            bad += report(pg.evaluate(STRUCT))
        elif mode == 'levels':          # whole generated levels with a variety seed: can the solver finish them?
            pg.evaluate("()=>{TD.sim(true);TD.FLAGS.noBoss=true}")
            fails = []; dk = sys.argv[4] if len(sys.argv) > 4 else 'crazy'
            for n in [4, 6, 8, 11, 13, 16, 19, 23, 27, 33, 41, 55]:
                for vs in (321, 4321):
                    lab = {'n': n, 'diff': dk, 'vs': vs + n}
                    r = pg.evaluate("([lab, steps, seeds]) => { const SO = (" + SOLVER + "); return SO([[lab.n], seeds, steps, JSON.stringify({lab})]) }", [lab, steps, seeds])[0]
                    tag = f'level {n} vs{vs + n} {dk}'
                    print(('  ok  ' if r.get('ok') else '  FAIL') + ' ' + tag + '  ' + (f"t={r.get('t', 0):.1f}s" if r.get('ok') else json.dumps(r, ensure_ascii=False)[:200]), flush=True)
                    if not r.get('ok'): fails.append(tag)
            bad += len(fails)
        else:
            pg.evaluate("()=>{TD.sim(true);TD.FLAGS.noBoss=true}")
            fails = []
            import os
            only = [x for x in os.environ.get('ONLY', '').split(',') if x]      # ONLY=crush/drop,arrow/cross : just these strips
            for fam, var in STRIPS:
                if only and f'{fam}/{var}' not in only: continue
                for n in (6, 14, 30):
                    for vs in (11, 12):
                        lab = {'n': n, 'script': [[fam, 'plain' if False else var]] * 1, 'W': 46, 'diff': 'normal', 'noChase': True, 'vs': vs}
                        r = pg.evaluate("([lab, steps, seeds]) => { const T = TD; const SO = (" + SOLVER + "); return SO([[lab.n], seeds, steps, JSON.stringify({lab})]) }", [lab, steps, seeds])[0]
                        tag = f'{fam}/{var} n{n} vs{vs}'
                        print(('  ok  ' if r.get('ok') else '  FAIL') + ' ' + tag + '  ' + (f"t={r.get('t', 0):.1f}s" if r.get('ok') else json.dumps(r, ensure_ascii=False)[:160]), flush=True)
                        if not r.get('ok'): fails.append(tag)
            bad += len(fails)
        print('PAGE ERRORS', errs[:3]); bad += len(errs)
        b.close()
    print('RESULT:', 'ALL OK' if not bad else f'{bad} FAILED'); sys.exit(1 if bad else 0)
main()
