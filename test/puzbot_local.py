"""The puzzle bots (test/puzbot.js) on ONE page, local co-op: bot 0 drives K, bot 1 drives K2. usage: python3 test/puzbot_local.py [variant ...]"""
import sys, os, threading, http.server, socketserver, functools
from playwright.sync_api import sync_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = socketserver.TCPServer(('127.0.0.1', 0), functools.partial(Q, directory=ROOT)); threading.Thread(target=srv.serve_forever, daemon=True).start(); port = srv.server_address[1]
BOT = open(os.path.join(ROOT, 'test', 'puzbot.js'), encoding='utf-8').read()
JS = """([src, v]) => { const T = window.TD, G = T.G, K = T.K, K2 = T.K2; T.coPuzTest(v); const mk = eval(src), b0 = mk(0, v), b1 = mk(1, v); let trace = [];
  for (let i = 0; i < 4000 && G.state === 'play'; i++) { const k0 = b0(), k1 = b1(); Object.assign(K, {l: false, r: false, j: false, jp: false, a: false, ap: false}, k0); Object.assign(K2, {l: false, r: false, j: false, jp: false, a: false, ap: false}, k1); T.update(1 / 60);
    if (i % 150 === 0) trace.push([i, T.PLY.map(p => Math.round(p.x) + ',' + Math.round(p.y) + (p.stand ? 's' + p.stand : '')).join(' | '), JSON.stringify(T.L.cgS), T.L.ents.filter(e => e.t === 'colift').map(e => Math.round(e.y)).join()]);
    if (G.state !== 'play') return {v, frames: i, state: G.state, trace} }
  return {v, frames: 4000, state: G.state, trace} }"""
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1000, 'height': 600}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.goto(f'http://127.0.0.1:{port}/trap-dungeon.html'); pg.wait_for_timeout(500)
    pg.evaluate("() => { const T = window.TD; T.sim(false); T.S.best = 14; T.S.own.robot = 1; T.S.diff = 'normal' }")
    for v in (sys.argv[1:] or ['gate', 'ladder', 'bridge', 'sync', 'lift', 'flood', 'fan', 'chain', 'keyshelf', 'floors']):
        r = pg.evaluate(JS, [BOT, v]); print(v, r['state'], 'frames', r['frames'])
        if r['state'] != 'win' or len(sys.argv) > 1:
            for t in r['trace'][:30]: print('   ', t)
    print('errors', errs)
