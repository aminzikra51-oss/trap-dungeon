"""Determinism check: same level + same recorded inputs => identical world state, every time.
usage: python3 test/determinism.py [LO] [HI] [runs] [frames]
Plays the SAME scripted input stream `runs` times per level (fresh loadLevel each time, SIM off = the real game path)
and compares a hash of snap() every 20 frames. Any mismatch is reported with the first differing frame."""
import json, sys
from playwright.sync_api import sync_playwright

JS = r"""
([levels, runs, frames, simOn]) => {
  const T = window.TD, K = T.K, G = T.G;
  T.sim(!!simOn); T.FLAGS.noBoss = !window.__boss;
  const hash = s => { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0 } return h };
  // fixed input script: a seeded macro stream (independent of the game)
  function script(seed, n) {
    let rs = seed >>> 0; const rnd = () => { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 4294967296 };
    const out = []; while (out.length < n) {
      const m = rnd(), len = 4 + Math.floor(rnd() * 30);
      for (let i = 0; i < len && out.length < n; i++) {
        let l = 0, r = 1, j = 0, jp = 0;
        if (m < .15) r = 0; else if (m < .22) { l = 1; r = 0 }
        if (m > .45 && m < .8) { j = i < 18 ? 1 : 0; jp = i === 0 ? 1 : 0 }
        out.push([l, r, j, jp]);
      }
    } return out;
  }
  const res = [];
  for (const n of levels) {
    const inp = script(n * 7 + 3, frames);
    const runsH = [];
    for (let k = 0; k < runs; k++) {
      G.lastLvl = -1; G.cpX = null; G.bossProg = null; G.bossSeen = 0; G.coins = 0;   // fresh start: no checkpoint carried over from the previous run
      T.loadLevel(n); G.state = 'play';
      const hs = []; let deadAt = -1;
      for (let f = 0; f < frames; f++) {
        const a = inp[f]; K.l = !!a[0]; K.r = !!a[1]; K.j = !!a[2]; K.jp = !!a[3];
        T.update(1 / 60);
        if (G.state !== 'play') { if (deadAt < 0) deadAt = f; T.loadLevel(n); G.state = 'play' }
        if (f % 20 === 0) hs.push(hash(JSON.stringify(JSON.parse(T.snap()), (k, v) => k === 'mocked' ? undefined : v)));   // 'mocked' = taunt-speech marker (Math.random on purpose), not world state
      }
      runsH.push({hs, deadAt});
    }
    let bad = -1;
    for (let k = 1; k < runs && bad < 0; k++) for (let i = 0; i < runsH[0].hs.length; i++) if (runsH[k].hs[i] !== runsH[0].hs[i]) { bad = i * 20; break }
    const which = []; if (bad >= 0) for (let k = 1; k < runs; k++) which.push(runsH[k].hs[bad / 20] === runsH[0].hs[bad / 20] ? '=' : '!');
    res.push({n, ok: bad < 0, firstDiffFrame: bad, deadAt: runsH[0].deadAt, runsVsFirst: which.join('')});
  }
  return res;
}
"""

def main():
    lo = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    hi = int(sys.argv[2]) if len(sys.argv) > 2 else 20
    runs = int(sys.argv[3]) if len(sys.argv) > 3 else 5
    frames = int(sys.argv[4]) if len(sys.argv) > 4 else 1500
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        pg = b.new_page()
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(500)
        if len(sys.argv) > 5 and sys.argv[5] == 'boss': pg.evaluate('window.__boss = true')
        bad = 0
        for simOn in (True, False):
            r = pg.evaluate(JS, [list(range(lo, hi + 1)), runs, frames, simOn])
            nb = [x for x in r if not x['ok']]
            print(f"SIM={'on ' if simOn else 'off'}: {len(r)-len(nb)}/{len(r)} levels identical over {runs} runs x {frames} frames")
            for x in nb: print('   DIFF level', x['n'], 'first differing frame', x['firstDiffFrame'], 'runs2..N vs run1:', x['runsVsFirst'], 'run1 first death at', x['deadAt'])
            bad += len(nb)
        if errs: print('page errors:', errs[:3])
        b.close()
        sys.exit(1 if bad else 0)

main()
