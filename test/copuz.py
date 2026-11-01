"""Co-op puzzles: each one is solved by two scripted players and CANNOT be solved by one (the other stays idle).
Also: human ladder physics (standing on a head, riding it), snapshot round trip of puzzle state, doors never close on somebody.
usage: python3 test/copuz.py [--shots DIR]"""
import sys, os, threading, http.server, socketserver, functools
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = sys.argv[sys.argv.index('--shots') + 1] if '--shots' in sys.argv else None

class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

LOGIC = r"""
(shotsDir) => {
  const T = window.TD, G = T.G, K = T.K, K2 = T.K2, S = T.S, out = [];
  const ok = (name, cond, extra) => out.push([name, !!cond, extra === undefined ? '' : String(extra)]);
  T.sim(false); S.own.robot = 1; S.best = 14; S.diff = 'normal';
  const none = () => ({l: false, r: false, j: false, jp: false, a: false, ap: false});
  const TS = 32, GY = 11 * 32, PH = 28, PW = 20;
  // ---- a tiny bot: walks to a tile column, hops over whatever blocks it ----
  const bot = () => ({lx: -1, stuck: 0, hold: 0, wait: 0});
  const walk = (p, tx, st, tol) => { const d = tx - (p.x + PW / 2), k = none(), t = tol == null ? 3 : tol;
    if (d > t) k.r = true; else if (d < -t) k.l = true;
    if ((k.r || k.l) && p.onGround && Math.abs(p.x - st.lx) < .01) st.stuck++; else st.stuck = 0; st.lx = p.x;
    if (st.stuck >= 3) { st.hold = 22; st.stuck = 0; k.jp = true }
    if (st.hold > 0) { k.j = true; st.hold-- }
    return k };
  const idle = () => none();
  let frameCount = 0;
  const run = (n, f0, f1, until) => { for (let i = 0; i < n; i++) { Object.assign(K, f0(i)); Object.assign(K2, f1(i)); T.update(1 / 60); frameCount++; if (G.state !== 'play') return false; if (until && until()) return true } return !!(until && until()) };
  const fresh = v => { const l = T.coPuzTest(v); Object.assign(K, none()); Object.assign(K2, none()); const x0 = l[0][1], ents = T.L.ents;
    return {x0, l, plate: ents.find(e => e.t === 'cplate'), plates: ents.filter(e => e.t === 'cplate'), lever: ents.find(e => e.t === 'clever'), gate: ents.find(e => e.t === 'cgate' && e.kind !== 'none'), gates: ents.filter(e => e.t === 'cgate'), lift: ents.find(e => e.v === 'colift')} };
  const E = f => (T.L.cgE ? T.L.cgE[f] : -1);
  const px = (f, e) => e.x + (e.w || 0) / 2;           // centre of a plate

  // ---------- generator: co-op levels carry puzzles, single player never does ----------
  { const a = T.buildLevel(5, {co: 1, diff: 'normal'}), b = T.buildLevel(5, {diff: 'normal'});
    ok('a co-op level contains at least one puzzle', (a.coList || []).length >= 1 && a.ents.some(e => e.t === 'cgate'), JSON.stringify(a.coList));
    ok('a single-player level of the same number has none', !b.ents.some(e => e.t === 'cgate' || e.t === 'cplate' || e.t === 'clever') && !b.cg);
    const big = T.buildLevel(12, {co: 1, diff: 'normal'}); ok('long levels carry more puzzles', (big.coList || []).length >= 2, JSON.stringify(big.coList));
    const kinds = new Set(); for (let n = 1; n < 40; n++) for (const d of ['normal', 'crazy', 'hell']) { const l = T.buildLevel(n, {co: 1, diff: d}); for (const c of (l.coList || [])) kinds.add(c[0]) }
    ok('every puzzle kind shows up somewhere in the first 40 levels', ['gate', 'ladder', 'bridge', 'sync', 'lift'].every(k => kinds.has(k)), [...kinds].join());
    const t1 = T.buildLevel(1, {co: 1, diff: 'normal'}), t2 = T.buildLevel(2, {co: 1, diff: 'normal'});
    ok('even the two tutorial levels get one', (t1.coList || []).length === 1 && (t2.coList || []).length === 1); }

  // ---------- gate + plate + lever ----------
  { let f = fresh('gate'), sA = bot(), sB = bot();
    // alone: player 1 tries everything, player 2 sleeps
    run(700, () => walk(T.PLY[0], f.lever.x, sA), idle);
    ok('gate: one player alone cannot pass the door', T.PLY[0].x < f.gate.x && !f.lever.on && E(f.gate.gid) === 0, 'x ' + Math.round(T.PLY[0].x) + ' door ' + f.gate.x);
    f = fresh('gate'); sA = bot(); sB = bot();
    run(700, idle, () => walk(T.PLY[1], f.lever.x, sB));
    ok('gate: the other player alone cannot either', T.PLY[1].x < f.gate.x && !f.lever.on);
    // together: 0 stands on the plate, 1 goes through and pulls the lever
    f = fresh('gate'); sA = bot(); sB = bot();
    const onPlate = () => f.plate.on === 1;
    run(400, () => walk(T.PLY[0], px(0, f.plate), sA, 4), () => onPlate() ? walk(T.PLY[1], f.lever.x, sB) : walk(T.PLY[1], px(0, f.plate) + 10, sB, 4), () => f.lever.on === 1);
    ok('gate: with one on the plate the other gets through and pulls the lever', f.lever.on === 1 && T.PLY[1].x > f.gate.x && E(f.gate.gid) === 1, 'lever ' + f.lever.on + ' p2 ' + Math.round(T.PLY[1].x));
    ok('gate: while he stands on the plate the door is open', f.plate.on === 1);
    run(200, () => walk(T.PLY[0], f.lever.x + 40, sA), idle, () => T.PLY[0].x > f.gate.x + 20);
    ok('gate: after the lever the door stays open and the plate holder follows', T.PLY[0].x > f.gate.x + 20 && E(f.gate.gid) === 1 && f.plate.on === 0 && G.state === 'play', 'p1 ' + Math.round(T.PLY[0].x));
    // a closing door waits for somebody standing in it
    f = fresh('gate'); const g = f.gate.gid; T.L.cgS[g] = 2; E(g); T.L.cgE[g] = 1; T.PLY[0].x = f.gate.x + 6; T.PLY[0].y = GY - PH; T.PLY[1].x = f.gate.x - 60; T.PLY[1].y = GY - PH;
    T.L.cgS[g] = 0; T.update(1 / 60); T.update(1 / 60);
    ok('gate: a door never closes on a player standing in it', E(g) === 1);
    T.PLY[0].x = f.gate.x + 80; T.update(1 / 60); T.update(1 / 60);
    ok('gate: ... and closes as soon as he has left', E(g) === 0); }

  // ---------- human ladder ----------
  { let f = fresh('ladder'), sA = bot(), sB = bot(); const wall = T.L.blocks, wx = f.x0 + 9, top = GY - 104, wallFace = wx * TS - PW;
    const upOnWall = p => p.onGround && p.x > wx * TS - 4 && p.y + PH <= top + 1;
    // alone: runs at the wall and jumps all day
    let best = 1e9; const jumper = (p, st) => { const k = walk(p, (wx + 4) * TS, st); k.j = true; if (p.onGround) k.jp = true; return k };
    for (let i = 0; i < 900 && G.state === 'play'; i++) { Object.assign(K, jumper(T.PLY[0], sA)); Object.assign(K2, idle()); T.update(1 / 60); best = Math.min(best, T.PLY[0].y + PH) }
    ok('ladder: alone you cannot get on top of the wall', !upOnWall(T.PLY[0]) && T.PLY[0].x < wx * TS, 'best foot height ' + Math.round(GY - best) + ' (needs 104)');
    // together: 1 waits at the wall, 0 jumps onto his head, then onto the wall
    f = fresh('ladder'); sA = bot(); sB = bot();
    run(400, () => walk(T.PLY[0], wallFace + PW / 2, sA, 2), () => walk(T.PLY[1], wallFace + PW / 2, sB, 2), () => Math.abs(T.PLY[0].x - wallFace) < 2 && Math.abs(T.PLY[1].x - wallFace) < 2);
    ok('ladder: both stand at the foot of the wall', Math.abs(T.PLY[0].x - T.PLY[1].x) < 3, Math.round(T.PLY[0].x) + ',' + Math.round(T.PLY[1].x));
    let step = 0, onHead = false, rode = false;
    for (let i = 0; i < 320 && G.state === 'play' && step < 2; i++) {                              // 0 jumps: first onto 1's head
      const p = T.PLY[0], q = T.PLY[1], k0 = none();
      if (step === 0) { k0.j = true; k0.jp = i === 0; if (p.stand < 0) { step = 1; onHead = true } }
      else if (step === 1) { k0.j = true; k0.jp = p.onGround; if (p.y + PH < top - 3 || (p.vy > 0 && p.y + PH < top + 20)) k0.r = true; if (upOnWall(p)) { step = 2; Object.assign(k0, none()) } }
      Object.assign(K, k0); Object.assign(K2, idle()); T.update(1 / 60);
      if (step === 1 && !rode && T.PLY[0].stand < 0) { const x1 = T.PLY[1].x, y1 = T.PLY[1].y; rode = true; ok('ladder: standing on a head sets the stand link', T.PLY[0].stand === -2 && T.PLY[0].onGround) } }
    ok('ladder: 0 landed on 1\'s head', onHead, 'step ' + step);
    ok('ladder: from the head he reaches the top of the wall', upOnWall(T.PLY[0]), 'y ' + Math.round(T.PLY[0].y) + ' x ' + Math.round(T.PLY[0].x));
    // he goes round to the lever, the steps appear, 1 climbs
    run(500, () => walk(T.PLY[0], f.lever.x, sA), idle, () => f.lever.on === 1);
    ok('ladder: the one on top reaches the lever on the far side', f.lever.on === 1, 'lever ' + f.lever.on);
    run(40, idle, idle);
    ok('ladder: the lever raises the steps', E(f.gate.gid) === 1);
    run(700, idle, () => walk(T.PLY[1], f.lever.x + 40, sB), () => T.PLY[1].x > (wx + 2) * TS + 20 && T.PLY[1].onGround);
    ok('ladder: the steps get the second player over the wall too', T.PLY[1].x > (wx + 2) * TS && G.state === 'play', 'x ' + Math.round(T.PLY[1].x)); }

  // ---------- riding on a head ----------
  { const l = T.coPuzTest('gate'); T.L.ents = []; T.L.cg = null; T.L.cgS = undefined; T.L.cgE = undefined; T.L.pits = []; T.L.ground.fill(11); T.L.blocks = {}; T.L.cr = {}; T.L.zones = [];
    T.PLY[0].x = 300; T.PLY[1].x = 300; T.PLY[0].y = GY - PH - 60; T.PLY[1].y = GY - PH; Object.assign(K, none()); Object.assign(K2, none());
    for (let i = 0; i < 40; i++) T.update(1 / 60);
    ok('head: a player dropped on the other one lands on his head', T.PLY[0].stand === -2 && Math.abs((T.PLY[0].y + PH) - T.PLY[1].y) < 1.5, T.PLY[0].stand + ' ' + Math.round(T.PLY[0].y + PH) + ' vs ' + Math.round(T.PLY[1].y));
    const rx = T.PLY[0].x, bx = T.PLY[1].x;
    for (let i = 0; i < 60; i++) { Object.assign(K2, {r: true}); T.update(1 / 60) } Object.assign(K2, none());
    ok('head: he rides along when the one below walks', Math.abs((T.PLY[0].x - rx) - (T.PLY[1].x - bx)) < 2 && T.PLY[0].stand === -2, (T.PLY[0].x - rx).toFixed(1) + ' / ' + (T.PLY[1].x - bx).toFixed(1));
    for (let i = 0; i < 4; i++) { Object.assign(K2, {j: true, jp: i === 0}); T.update(1 / 60) } Object.assign(K2, none());
    for (let i = 0; i < 25; i++) T.update(1 / 60);
    ok('head: and keeps standing on him when he jumps', T.PLY[0].stand === -2 && Math.abs((T.PLY[0].y + PH) - T.PLY[1].y) < 1.5, T.PLY[0].stand + ' ' + Math.round(T.PLY[0].y + PH) + ' vs ' + Math.round(T.PLY[1].y));
    Object.assign(K, {j: true, jp: true}); T.update(1 / 60); Object.assign(K, none()); for (let i = 0; i < 10; i++) T.update(1 / 60);
    ok('head: he can jump off again', T.PLY[0].stand >= 0 && T.PLY[0].y + PH < T.PLY[1].y - 5, T.PLY[0].stand); }

  // ---------- bridge ----------
  { let f = fresh('bridge'), sA = bot(), sB = bot(); const pit = T.L.pits[0], end = (pit[0] + pit[1]) * TS;
    run(700, () => walk(T.PLY[0], f.lever.x, sA), idle);
    ok('bridge: alone you cannot cross the gap (you fall)', G.state === 'dead' || T.PLY[0].x < end, G.state + ' x ' + Math.round(T.PLY[0].x));
    f = fresh('bridge'); sA = bot(); sB = bot();
    run(600, () => walk(T.PLY[0], px(0, f.plate), sA, 4), () => f.plate.on === 1 ? walk(T.PLY[1], f.lever.x, sB) : walk(T.PLY[1], px(0, f.plate) + 12, sB, 4), () => f.lever.on === 1);
    ok('bridge: with the plate held, the other one crosses and pulls the lever', f.lever.on === 1 && T.PLY[1].x > end && G.state === 'play', 'x ' + Math.round(T.PLY[1].x) + ' ' + G.state);
    run(400, () => walk(T.PLY[0], f.lever.x + 30, sA), idle, () => T.PLY[0].x > end + 20);
    ok('bridge: the lever keeps it up, the plate holder walks over', T.PLY[0].x > end + 20 && G.state === 'play', 'x ' + Math.round(T.PLY[0].x) + ' ' + G.state);
    // the bridge is gone again if nobody stands on the plate and the lever was not pulled
    f = fresh('bridge'); T.L.cgS[f.gate.gid] = 2; T.L.cgE[f.gate.gid] = 1; T.PLY[0].x = (f.x0 + 1) * TS; T.PLY[1].x = (f.x0 + 2) * TS; T.L.cgS[f.gate.gid] = 0; T.update(1 / 60);
    ok('bridge: it retracts when the plate is released', E(f.gate.gid) === 0); }

  // ---------- two plates at once ----------
  { let f = fresh('sync'), sA = bot(), sB = bot(); const [pl1, pl2] = f.plates, ledgeX = (f.x0 + 8) * TS;
    run(500, () => walk(T.PLY[0], px(0, pl1), sA, 4), idle, () => pl1.on === 1);
    run(200, () => walk(T.PLY[0], px(0, pl1), sA, 4), () => walk(T.PLY[1], f.gate.x - 40, sB));
    ok('sync: one plate alone does not open the door', E(f.gate.gid) === 0 && T.PLY[1].x < f.gate.x);
    f = fresh('sync'); sA = bot(); sB = bot(); const [q1, q2] = f.plates; let phase = 0;
    for (let i = 0; i < 900 && G.state === 'play' && !(E(f.gate.gid) === 1); i++) {
      const p0 = T.PLY[0], p1 = T.PLY[1], k1 = none();
      if (phase === 0) { Object.assign(k1, walk(p1, ledgeX - 20, sB, 3)); if (Math.abs(p1.x + PW / 2 - (ledgeX - 20)) < 6 && p1.onGround) phase = 1 }
      else if (phase === 1) { k1.r = true; k1.j = true; k1.jp = p1.onGround; if (p1.onGround && p1.y + PH < GY - 40) phase = 2 }
      else k1.r = false;
      if (phase === 2) Object.assign(k1, walk(p1, px(0, q2), sB, 3));
      Object.assign(K, walk(p0, px(0, q1), sA, 4)); Object.assign(K2, k1); T.update(1 / 60) }
    ok('sync: both plates pressed at the same time open the door', E(f.gate.gid) === 1 && q1.on === 1 && q2.on === 1, 'E ' + E(f.gate.gid) + ' plates ' + q1.on + q2.on);
    run(40, idle, idle); ok('sync: the door stays open (latched) after they step off', (T.L.cgS[f.gate.gid] & 1) === 1);
    T.PLY[0].x = q1.x + 100; T.PLY[1].x = q1.x + 100; T.update(1 / 60); T.update(1 / 60);
    ok('sync: ...even when no plate is pressed any more', E(f.gate.gid) === 1); }

  // ---------- lift ----------
  { let f = fresh('lift'), sA = bot(), sB = bot(); const lift = f.lift, top = lift.y1, ledgeX = (f.x0 + 10) * TS; let best = 1e9;
    for (let i = 0; i < 900 && G.state === 'play'; i++) {                                    // alone: hop on the lift, jump
      const p = T.PLY[0], k = walk(p, lift.x + lift.w / 2, sA, 4); if (p.onGround && Math.abs(p.x + PW / 2 - lift.x - lift.w / 2) < 8 && i % 30 === 0) { k.j = true; k.jp = true }
      Object.assign(K, k); Object.assign(K2, idle()); T.update(1 / 60); best = Math.min(best, p.y + PH) }
    ok('lift: alone you cannot get up to the ledge', best > top + 20, 'highest foot ' + Math.round(GY - best) + ' ledge ' + Math.round(GY - top));
    f = fresh('lift'); sA = bot(); sB = bot(); const L2 = f.lift; let ph = 0, rode = 0;
    for (let i = 0; i < 1500 && G.state === 'play'; i++) {
      const p0 = T.PLY[0], p1 = T.PLY[1]; let k0 = none(), k1 = none();
      k0 = ph === 0 ? (p1.stand === L2.id ? walk(p0, px(0, f.plate), sA, 4) : none()) : (ph < 2 ? walk(p0, px(0, f.plate), sA, 4) : none());          // 0 waits until 1 is on the lift, then holds the plate
      if (ph === 0) { k1 = walk(p1, L2.x + L2.w / 2, sB, 4); if (p1.onGround && p1.stand !== L2.id && Math.abs(p1.x + PW / 2 - L2.x - L2.w / 2) < 30) { k1.j = true; k1.jp = true; sB.hold = 22 } if (p1.onGround && p1.stand === L2.id && Math.abs(p1.x + PW / 2 - L2.x - L2.w / 2) < 14) ph = 1 }
      else if (ph === 1) { if (L2.y <= top + 2) { ph = 2 } }
      else if (ph === 2) { k1 = walk(p1, f.lever.x, sB, 3); if (f.lever.on === 1) { ph = 3 } }
      else if (ph === 3) { k0 = walk(p0, L2.x + L2.w / 2 - 6, sA, 3); if (L2.y > GY - 36 && Math.abs(p0.x - L2.x) < 40) ph = 4 }
      else if (ph === 4) { k0 = walk(p0, L2.x + L2.w / 2, sA, 3); if (p0.onGround && p0.stand !== L2.id && L2.y > GY - 34 && Math.abs(p0.x + PW / 2 - L2.x) < 70) { k0.j = true; k0.jp = true; sA.hold = 22 } if (p0.stand === L2.id) { ph = 5 } }
      else if (ph === 5) { if (L2.y <= top + 2) ph = 6 }
      else if (ph === 6) { k0 = walk(p0, f.lever.x + 60, sA, 3) }
      Object.assign(K, k0); Object.assign(K2, k1); T.update(1 / 60);
      if (ph === 6 && p0.x > f.lever.x + 40 && p0.y + PH <= top + 1) break }
    ok('lift: the plate holder raises the lift for the other one', f.lever.on === 1 && T.PLY[1].y + PH <= top + 1, 'phase ' + ph + ' lever ' + f.lever.on + ' p1 ' + Math.round(T.PLY[1].x) + ',' + Math.round(T.PLY[1].y) + ' st ' + T.PLY[1].stand + ' lift ' + Math.round(L2.y) + ' plate ' + f.plate.on);
    ok('lift: after the lever it shuttles and brings the plate holder up too', ph === 6 && T.PLY[0].y + PH <= top + 1 && T.PLY[0].x > ledgeX, 'phase ' + ph + ' p0 ' + Math.round(T.PLY[0].x) + ',' + Math.round(T.PLY[0].y)); }

  // ---------- relay ----------
  { const f = fresh('relay'); ok('relay: two doors, two plates, two levers', f.gates.length === 2 && f.plates.length === 2 && T.L.ents.filter(e => e.t === 'clever').length === 2); }

  // ---------- snapshot round trip with puzzle state ----------
  { const f = fresh('gate'), sA = bot(), sB = bot();
    run(300, () => walk(T.PLY[0], px(0, f.plate), sA, 4), () => f.plate.on === 1 ? walk(T.PLY[1], f.lever.x, sB) : walk(T.PLY[1], px(0, f.plate) + 10, sB, 4), () => f.lever.on === 1);
    const s1 = T.snap(true); run(30, idle, idle); const s2 = T.snap(true); T.restore(s1); const s3 = T.snap(true);
    ok('snapshot: restore gives back exactly the same world incl. puzzle state', s1 === s3 && s1 !== s2 && s1.includes('"cs"'), s1.length + ' bytes');
    const rep = n => { for (let i = 0; i < n; i++) { Object.assign(K, walk(T.PLY[0], f.lever.x + 70, sA)); Object.assign(K2, idle()); T.update(1 / 60) } return T.snap(true) };
    T.restore(s1); const a = rep(60); T.restore(s1); const b = rep(60);
    ok('snapshot: replaying from it is deterministic', a === b); }

  return out;
}
"""

def main():
    h = functools.partial(Q, directory=ROOT); srv = socketserver.TCPServer(('127.0.0.1', 0), h); srv.allow_reuse_address = True
    threading.Thread(target=srv.serve_forever, daemon=True).start(); port = srv.server_address[1]
    bad = 0
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1000, 'height': 600}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        pg.goto(f'http://127.0.0.1:{port}/trap-dungeon.html'); pg.wait_for_timeout(500)
        res = pg.evaluate(LOGIC, SHOTS)
        for name, cond, extra in res:
            print(('  ok   ' if cond else '  FAIL ') + name + (('  [' + extra + ']') if extra else ''))
            if not cond: bad += 1
        print('errors', errs); bad += len(errs)
    print('RESULT:', 'ALL OK' if not bad else f'{bad} FAILED'); sys.exit(1 if bad else 0)

main()
