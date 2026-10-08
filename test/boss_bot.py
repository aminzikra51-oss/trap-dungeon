"""Boss fairness bot: plays the boss room with a lookahead over world snapshots (like a very alert human).
usage: python3 test/boss_bot.py [levels=10,20,30,50] [diffs=normal,crazy,hell] [seeds=3] [maxDeaths=25]
Reports per run: won?, deaths before the win, game seconds. A boss the bot cannot beat in 25 deaths is a design bug."""
import json, sys
from playwright.sync_api import sync_playwright
levels = [int(x) for x in (sys.argv[1] if len(sys.argv) > 1 else '10,20,30,50').split(',')]
diffs = (sys.argv[2] if len(sys.argv) > 2 else 'normal,crazy,hell').split(',')
seeds = int(sys.argv[3]) if len(sys.argv) > 3 else 3
maxd = int(sys.argv[4]) if len(sys.argv) > 4 else 25
lapse = float(sys.argv[5]) if len(sys.argv) > 5 else 0.0     # chance per decision that the "player" is not paying attention (repeats the last move blindly for ~10 frames)
BOT = r"""
([n, diff, seed, maxDeaths, lapse]) => {
  const T = window.TD, G = T.G, K = T.K, S = T.S; T.sim(true); S.diff = diff; G.bossProg = null; G.lastLvl = 0; G.deaths = 0;
  T.loadLevel(n); G.state = 'play'; T.RG.s = (T.RG.s + seed * 7919) | 0;
  const causes = []; let deaths = 0, frames = 0, won = false, maxF = 60 * 60 * 6, prevA = null, rs = (seed * 2654435761) >>> 0;
  const rnd = () => { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 4294967296 };
  const actions = [
    {l:0,r:0,j:0,len:30}, {l:1,r:0,j:0,len:30}, {l:0,r:1,j:0,len:30},
    {l:0,r:0,j:1,len:44}, {l:1,r:0,j:1,len:44}, {l:0,r:1,j:1,len:44},
    {l:0,r:1,j:0,len:12}, {l:1,r:0,j:0,len:12}];
  const run = (a, f) => { K.l = !!a.l; K.r = !!a.r; K.j = !!a.j && f < 40; K.jp = !!a.j && f === 0; };
  const goal = () => { const e = T.L.ents.find(x => x.t === 'boss'); return T.bossBtnX(e); };
  const score = (gx0) => { // run one candidate from the current snapshot; returns {alive, t, dist}
    return null; };
  while (frames < maxF && !won) {
    if (G.state === 'dead') { deaths++; const eb = T.L.ents.find(x => x.t === 'boss'); causes.push(G.cause + '@h' + eb.hits + 'x' + Math.round(T.P.x/32) + (G.killer && G.killer.lane ? ':' + G.killer.lane : '') + ' t' + Math.round(frames/60)); if (deaths > maxDeaths) break; T.retry(); G.state = 'play'; continue; }
    if (G.state === 'win') { won = true; break; }
    const e0 = T.L.ents.find(x => x.t === 'boss');
    if (e0.st === 'done') { // walk to the exit
      K.l = false; K.r = true; K.j = false; K.jp = false; T.update(1/60); frames++; continue; }
    if (e0.st === 'intro' || e0.st === 'hurt' || e0.st === 'dying') { // nothing dangerous: just walk toward the next button
      const gx = goal(), px = T.P.x + 10; K.l = px > gx + 8; K.r = px < gx - 8; K.j = false; K.jp = false; T.update(1/60); frames++; continue; }
    if (prevA && rnd() < lapse) { let f = 0; for (f = 0; f < 10; f++) { run(prevA, f + 30); T.update(1/60); frames++; if (G.state !== 'play') break } continue }
    const base = T.snap(), gx = goal(); let best = null;
    for (const a of actions) {
      T.restore(base); T.RG.s = (rnd() * 2147483647) | 0; let dead = false, f = 0, hit0 = e0.hits;      // the future spawns are unknown to a human: re-roll them for the what-if run
      for (f = 0; f < a.len; f++) { run(a, f); T.update(1/60); if (G.state === 'dead') { dead = true; break } const eb = T.L.ents.find(x => x.t === 'boss'); if (eb.hits > hit0) break; }
      // after the macro, coast 8 frames with no input to be sure we don't end mid-air over a spike
      let dead2 = dead;
      if (!dead) { for (let k = 0; k < 14 && !dead2; k++) { K.l = K.r = K.j = false; K.jp = false; T.update(1/60); if (G.state === 'dead') dead2 = true } }
      const eb = T.L.ents.find(x => x.t === 'boss'), px = T.P.x + 10;
      const sc = (dead2 ? -1000 + f : 0) + (eb.hits > hit0 ? 500 : 0) - Math.abs(px - gx) * .5 + (T.P.onGround ? 4 : 0) + eb.chg * 260;
      if (!best || sc > best.sc) best = {sc, a};
    }
    T.restore(base);
    const a = best.a; prevA = a; let f = 0; const hit0 = e0.hits;
    for (f = 0; f < Math.min(a.len, 8); f++) { run(a, f); T.update(1/60); frames++; if (G.state !== 'play') break; }
  }
  return {n, diff, seed, won, deaths, causes, sec: Math.round(frames / 60), hits: (T.L.ents.find(x => x.t === 'boss') || {}).hits};
}
"""
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 800, 'height': 450}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(400)
    for n in levels:
        for d in diffs:
            for sd in range(1, seeds + 1):
                r = pg.evaluate(BOT, [n, d, sd, maxd, lapse]); print(json.dumps(r), flush=True)
    print('errors:', errs[:3]); b.close()
