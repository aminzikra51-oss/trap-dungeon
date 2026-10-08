import json, sys
from playwright.sync_api import sync_playwright
JS = r"""
() => {
  const T = window.TD, out = {errs: [], lv: []};
  T.sim(true);
  for (let n = 1; n <= 150; n++) {
    try {
      const L = T.buildLevel(n);
      const cnt = {}; for (const e of L.ents) cnt[e.t + (e.v ? ':' + e.v : '')] = (cnt[e.t + (e.v ? ':' + e.v : '')] || 0) + 1;
      if (n <= 12 || n % 25 === 0) out.lv.push([n, L.w, L.ents.length, JSON.stringify(cnt)]);
    } catch (e) { out.errs.push([n, String(e), (e.stack||'').split('\n')[1]]); }
  }
  // run a few frames of each of the first 30 levels with a naive "run right" input
  for (let n = 1; n <= 30; n++) {
    try {
      T.loadLevel(n); T.G.state = 'play'; T.K.r = true;
      for (let f = 0; f < 600; f++) { T.update(1/60); if (T.G.state !== 'play') break; }
    } catch (e) { out.errs.push(['run', n, String(e), (e.stack||'').split('\n').slice(0,3).join('|')]); }
  }
  return out;
}
"""
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 1000, 'height': 560})
    errs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type in ('error', 'warning') else None)
    pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)))
    pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html')
    pg.wait_for_timeout(500)
    r = pg.evaluate(JS)
    for l in r['lv']: print(l)
    print('ERRS', r['errs'][:8])
    print('PAGE ERRS', errs[:8])
    b.close()
