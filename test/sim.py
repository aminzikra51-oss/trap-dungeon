import json, sys
from playwright.sync_api import sync_playwright
BOT = r"""
([maxLevel, tries]) => {
  const T = window.TD, K = T.K, res = {levels:[], gen:[]};
  const out = (l, a, v) => {};
  function botStep() {
    const P = T.P, L = T.L, G = T.G;
    K.l = false; K.r = true; let jump = false;
    const front = P.x + T.PW;
    // pits / gone floor
    const tx = Math.floor((front + window.__edge) / T.TS);
    if (tx < L.w && P.onGround) {
      const cr = L.cr[tx];
      if (L.ground[tx] < 0) jump = true;
    }
    for (const e of L.ents) {
      if (e.k === 'spike') { const d = e.x - front; if (d > -T.PW && d < window.__spJ && P.x < e.x + e.w) jump = true; }
      else if (e.k === 'saw') { const d = e.x - front; const fr = e.x0 - front; if (fr < 130 && fr > -10 && window.__wl > 0 && P.onGround) { window.__wl--; K.r = false; }  if (Math.abs(d) < window.__sawJt && P.x < e.x + 20) jump = true; }
      else if (e.k === 'turret') {
        for (const a of e.arrows) { const d = P.x - a.x; if (a.y > T.GY - 20 && d > -90 && d < 10) jump = true; }
        for (const a of e.arrows) { if (a.y < T.GY - 20 && a.x - P.x < 110 && a.x - P.x > -30) { jump = false; } }
      }
      else if (e.k === 'anvil') {
        const d = e.x - front;
        if (e.s === 1 || e.s === 2) { if (front <= e.x - 22 && d < 150) { K.r = false; } }
        else if (e.s === 0 && d > -40 && d < 160) { K.r = true; }
        else if (e.s === 3 && e.land < .3 && d > -10 && d < 40) { K.r = false; }
      }
      else if (e.k === 'fake') { }
    }
    if (jump && P.onGround) { K.jp = true; }
    K.j = jump || !P.onGround;
  }
  for (let n = 1; n <= maxLevel; n++) {
    let won = 0, deaths = {}, att = 0, steps = 0;
    for (; att < tries; att++) {
      window.__spJ = 6 + (att * 17) % 84; window.__wl = (att * 53) % 160; window.__edge = 1 + (att % 6) * 2; window.__sawJt = 30 + ((att * 37) % 110); T.startGame(n); T.G.state = 'play';
      let s = 0, ok = false;
      while (s++ < 60 * 100) {
        if (T.G.state === 'play') botStep();
        else if (T.G.state === 'dead') { deaths[T.G.cause] = (deaths[T.G.cause] || 0) + 1; (res.dx = res.dx || {})[n] = Math.round(T.P.x / 32); break; }
        else if (T.G.state === 'win') { ok = true; break; }
        T.update(1 / 60);
      }
      steps += s;
      if (ok) { won = 1; break; }
    }
    res.levels.push({n, won, att: att + (won ? 1 : 0), deaths, w: T.L.w});
  }
  return res;
}
"""
GEN = r"""
() => {
  const T = window.TD, bad = []; let t0 = performance.now();
  for (let n = 1; n <= 300; n++) {
    const L = T.buildLevel(n);
    const mg = n < 4 ? 2 : (n < 10 ? 3 : 4);
    // check pit lengths
    let run = 0, maxrun = 0;
    for (let x = 0; x < L.w; x++) { if (L.ground[x] < 0) { run++; maxrun = Math.max(maxrun, run);} else run = 0; }
    if (maxrun > mg + 0) bad.push([n, 'pitrun', maxrun, mg]);
    // exit area must be solid ground
    for (let x = L.w - 14; x < L.w; x++) if (L.ground[x] < 0) bad.push([n, 'exit-pit', x]);
    for (let x = 0; x < 8; x++) if (L.ground[x] < 0) bad.push([n, 'start-pit', x]);
    if (!Number.isFinite(L.w)) bad.push([n, 'nan']);
  }
  return {bad: bad.slice(0, 30), nbad: bad.length, ms: performance.now() - t0};
}
"""
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 1000, 'height': 560})
    errs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type in ('error', 'warning') else None)
    pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)))
    pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html')
    pg.wait_for_timeout(600)
    print('GEN', json.dumps(pg.evaluate(GEN)))
    ml = int(sys.argv[1]) if len(sys.argv) > 1 else 30
    tr = int(sys.argv[2]) if len(sys.argv) > 2 else 25
    r = pg.evaluate(BOT, [ml, tr])
    for l in r['levels']:
        print(l)
    print('ERRORS', errs[:10])
    b.close()
