"""Fairness planner: random-macro search with backtracking over world snapshots.
usage: python3 test/solver.py LO HI [seeds] [maxSteps] [normal|crazy|hell]"""
import json, sys
from playwright.sync_api import sync_playwright
SOLVER = r"""
([levels, seeds, maxSteps, optJson]) => {
  const T = window.TD, G = T.G, K = T.K; T.sim(true); T.FLAGS.noBoss = true;
  const opt = JSON.parse(optJson || '{}');
  const res = [];
  for (const n of levels) {
    let won = false, info = null, bestAll = null;
    for (let sd = 1; sd <= seeds && !won; sd++) {
      let rs = (sd * 2654435761 + n * 97) >>> 0; const rnd = () => { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 4294967296; };
      const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
      if (opt.lab) T.loadLevel(opt.lab.n, false, opt.lab); else T.loadLevel(n); G.state = 'play';
      const L = T.L;
      const path = [T.snap()], fails = [0]; let frames = 0, steps = 0, maxX = 0, deaths = {}, pathFrames = [0];
      const lim = 60;
      while (steps++ < maxSteps) {
        const top = path.length - 1;
        T.restore(path[top]);
        // pick a macro
        const pxp = T.P.x;
        const rush = Object.values(T.L.cr).some(c => c && c.s === 1 && Math.abs(c.lo * 32 - pxp) < 420) || T.L.ents.some(e => e.t === 'chase' && e.go);
        const nearRev = T.L.zones.some(z => z.type === 'rev' && pxp >= z.x0 - 128 && pxp <= z.x1 + 32);
        let r = rnd(); if (rush) r *= .8; let m; const full = () => rnd() < .55;
        if (r < .16) m = {k: 'run', len: ri(3, 26)};
        else if (r < .30) m = {k: 'runto', dx: ri(2, 140), len: 60};
        else if (r < .46) { const h = full() ? 99 : ri(3, 42); m = {k: 'jump', hold: h, len: ri(20, 60)}; }
        else if (r < .72) m = {k: 'jdj', hold: full() ? 99 : ri(6, 40), d: ri(8, 48), hold2: full() ? 99 : ri(4, 30), len: ri(40, 100)};
        else if (r < .82) m = {k: 'stop', len: ri(5, 40)};
        else if (r < .87) m = {k: 'back', len: ri(4, 26)};
        else if (r < .94) m = {k: 'dj', hold: full() ? 99 : ri(4, 30), len: ri(20, 60)};
        else m = {k: 'jumpstop', hold: ri(3, 30), len: ri(18, 60)};
        const x0 = T.P.x; const mir = nearRev && rnd() < .4;
        let dead = false, f = 0, won1 = false;
        K.l = K.r = K.j = K.jp = false;
        for (f = 0; f < m.len; f++) {
          K.jp = false;
          if (m.k === 'run') { K.r = true; K.l = false; K.j = false; }
          else if (m.k === 'jump') { K.r = true; K.l = false; if (f === 0) K.jp = true; K.j = f < m.hold; }
          else if (m.k === 'jdj') { K.r = true; K.l = false; if (f === 0) K.jp = true; if (f === m.d) K.jp = true; K.j = f < m.hold || (f >= m.d && f < m.d + m.hold2); }
          else if (m.k === 'runto') { K.r = T.P.x < x0 + m.dx; K.l = false; K.j = false; }
          else if (m.k === 'stop') { K.r = false; K.l = false; K.j = false; }
          else if (m.k === 'back') { K.r = false; K.l = true; K.j = false; }
          else if (m.k === 'dj') { K.r = true; K.l = false; if (f === 0) K.jp = true; K.j = f < m.hold; }
          else if (m.k === 'jumpstop') { K.r = false; K.l = false; if (f === 0) K.jp = true; K.j = f < m.hold; }
          if (mir) { const a = K.l; K.l = K.r; K.r = a; }
          T.update(1 / 60);
          if (G.state === 'dead') { dead = true; break; }
          if (G.state === 'win') { won1 = true; f++; break; }
        }
        if (won1) { won = true; info = {n, seed: sd, steps, t: (pathFrames[top] + f) / 60, maxX}; break; }
        if (!dead) {
          const px = T.P.x; if (px > maxX) maxX = px;
          path.push(T.snap()); fails.push(0); pathFrames.push(pathFrames[top] + f);
        } else {
          const key = G.cause + '@' + Math.round(T.P.x / 32); deaths[key] = (deaths[key] || 0) + 1;
          fails[top]++;
          if (fails[top] > lim || (rnd() < .004)) {
            const k = Math.min(path.length - 1, rnd() < .25 ? ri(6, 30) : ri(1, 4));
            if (k > 0) { for (let q = 0; q < k; q++) { path.pop(); fails.pop(); pathFrames.pop(); } fails[fails.length - 1] += 20 } else { fails[0] = 0 }
          }
        }
      }
      if (!won && opt.dbg) { T.restore(path[path.length - 1]); T.render(); }
      if (!won) { const top5 = Object.entries(deaths).sort((a, b) => b[1] - a[1]).slice(0, 6); bestAll = {n, seed: sd, steps, maxXtile: Math.round(maxX / 32), w: L.w, top5}; }
    }
    res.push(won ? {ok: 1, ...info} : {ok: 0, ...bestAll});
  }
  return res;
}
"""
if __name__ == '__main__':
    lo, hi = int(sys.argv[1]), int(sys.argv[2])
    seeds = int(sys.argv[3]) if len(sys.argv) > 3 else 2
    ms = int(sys.argv[4]) if len(sys.argv) > 4 else 4000
    diff = sys.argv[5] if len(sys.argv) > 5 else 'normal'
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        pg = b.new_page(viewport={'width': 1000, 'height': 560})
        errs = []
        pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)))
        pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(400)
        pg.evaluate("d=>{TD.S.diff=d}", diff)
        for n in range(lo, hi + 1):
            r = pg.evaluate(SOLVER, [[n], seeds, ms, '{}'])[0]
            print(json.dumps(r, ensure_ascii=False), flush=True)
        print('ERRS', errs[:5])
        b.close()
