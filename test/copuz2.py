"""Co-op puzzles, part 2: keys + locked doors on shelves, water + swimming, fans, chained bridges, two floors.
Each is solved by two scripted players and CANNOT be solved by one. Also swimming physics, fan lift, key pick-up, snapshot round trip.
usage: python3 test/copuz2.py [--shots DIR] [only,these,names]"""
import sys, os, threading, http.server, socketserver, functools
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = sys.argv[sys.argv.index('--shots') + 1] if '--shots' in sys.argv else None
ONLY = [a for a in sys.argv[1:] if a and not a.startswith('--') and a != SHOTS]

class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

LOGIC = r"""
(args) => {
  const [shotsDir, only] = args;
  window.__trace = !!window.__TR; const T = window.TD, G = T.G, K = T.K, K2 = T.K2, S = T.S, out = [];
  const want = n => !only.length || only.includes(n);
  const ok = (name, cond, extra) => out.push([name, !!cond, extra === undefined ? '' : String(extra)]);
  T.sim(false); S.own.robot = 1; S.best = 14; S.diff = 'normal';
  const none = () => ({l: false, r: false, j: false, jp: false, a: false, ap: false});
  const TS = 32, GY = 11 * 32, PH = 28, PW = 20, VH = 448;
  const bot = () => ({lx: -1, stuck: 0, hold: 0});
  const walk = (p, tx, st, tol) => { const d = tx - (p.x + PW / 2), k = none(), t = tol == null ? 3 : tol;
    if (d > t) k.r = true; else if (d < -t) k.l = true;
    if ((k.r || k.l) && p.onGround && Math.abs(p.x - st.lx) < .01) st.stuck++; else st.stuck = 0; st.lx = p.x;
    if (st.stuck >= 3) { st.hold = 22; st.stuck = 0; k.jp = true }
    if (st.hold > 0) { k.j = true; st.hold-- }
    return k };
  // swimming: keep the body centre a little under the surface and head for tx
  const swim = (p, tx, st, tol) => { const wt = T.waterAt(p), k = walk(p, tx, st, tol == null ? 3 : tol); k.jp = false; k.j = false; st.hold = 0;
    const surf = T.L.ents.find(e => e.t === 'cwater'); const cy = p.y + PH * .55;
    if (surf && cy > surf.y + 4) { k.j = true; if (p.vy > -60 && (st.n = (st.n | 0) + 1) % 7 === 0) k.jp = true }
    if (surf && cy <= surf.y + 18 && Math.abs(tx - (p.x + PW / 2)) > 8) { st.n2 = (st.n2 | 0) + 1; if (st.n2 % 9 === 0) k.jp = true }
    return k };
  const idle = () => none();
  const run = (n, f0, f1, until) => { for (let i = 0; i < n; i++) { Object.assign(K, f0(i)); Object.assign(K2, f1(i)); T.update(1 / 60); if (G.state !== 'play') return false; if (until && until()) return true } return !!(until && until()) };
  const fresh = v => { const l = T.coPuzTest(v); Object.assign(K, none()); Object.assign(K2, none()); const x0 = l[0][1], ents = T.L.ents;
    return {x0, l, plate: ents.find(e => e.t === 'cplate'), plates: ents.filter(e => e.t === 'cplate'), levers: ents.filter(e => e.t === 'clever'), lever: ents.find(e => e.t === 'clever'),
      gates: ents.filter(e => e.t === 'cgate' && e.kind !== 'none'), gate: ents.find(e => e.t === 'cgate' && e.kind !== 'none'), key: ents.find(e => e.t === 'ckey'), water: ents.find(e => e.t === 'cwater'), fan: ents.find(e => e.t === 'cfan'),
      lift: ents.find(e => e.v === 'colift'), plats: ents.filter(e => e.t === 'plat')} };
  const E = f => (T.L.cgE ? T.L.cgE[f] : -1);
  const standOn = id => T.PLY.some(q => !q.dead && q.stand === id);
  const px = e => e.x + (e.w || 0) / 2;
  const P0 = () => T.PLY[0], P1 = () => T.PLY[1];

  // ---------- generator ----------
  if (want('gen')) {
    const kinds = new Set(); for (let n = 1; n < 60; n++) for (const d of ['normal', 'crazy', 'hell', 'nightmare']) { const l = T.buildLevel(n, {co: 1, diff: d}); for (const c of (l.coList || [])) kinds.add(c[0]) }
    ok('every new puzzle kind shows up in the generated co-op levels', ['keyshelf', 'flood', 'fan', 'chain', 'floors'].every(k => kinds.has(k)), [...kinds].join());
    const l = T.buildLevel(8, {co: 1, diff: 'normal', script: [['co', 'flood']]}); ok('a flood level has water, a pit and the water flag', l.ents.some(e => e.t === 'cwater') && l.wt === true && l.pits.length >= 1);
    const m = T.buildLevel(8, {diff: 'normal'}); ok('single-player levels never have water / fans / keys', !m.wt && !m.fn && !m.ents.some(e => e.t === 'cwater' || e.t === 'cfan' || e.t === 'ckey')); }

  // ---------- water: physics ----------
  if (want('water')) {
    // the partner stands on the left bank (the tether keeps the two within 600 px of each other, so a lone teleport would be refused)
    const put = (p, x, y) => { p.x = x; p.y = y; p.vx = 0; p.vy = 0; p.onGround = false; p.stand = 0 };
    const f = fresh('flood'), w = f.water; ok('flood: the pool starts empty (surface below the screen)', w.y >= VH + 20);
    T.L.cgS[w.gid] = 1; for (let i = 0; i < 150; i++) T.update(1 / 60);
    ok('flood: when its gate opens the surface rises to the top of the pit', Math.abs(w.y - w.yHi) < 1, w.y + ' -> ' + w.yHi);
    put(P1(), w.x - 40, GY - PH); put(P0(), w.x + 120, GY - PH); Object.assign(K, none()); Object.assign(K2, none());
    for (let i = 0; i < 40; i++) T.update(1 / 60);
    ok('swim: a player who falls in is in the water, not dead', G.state === 'play' && !!T.waterAt(P0()) && P0().wet === true, G.state + ' y ' + Math.round(P0().y));
    for (let i = 0; i < 30; i++) T.update(1 / 60);
    ok('swim: with no key pressed he sinks slowly (terminal speed ~70 px/s)', P0().vy <= 71 && P0().vy > 0, 'vy ' + Math.round(P0().vy));
    const y1 = P0().y; Object.assign(K, {j: true, jp: true}); T.update(1 / 60); Object.assign(K, {j: true}); for (let i = 0; i < 30; i++) T.update(1 / 60); Object.assign(K, none());
    ok('swim: pressing and holding jump swims up', P0().y < y1 - 20, Math.round(y1 - P0().y) + ' px up');
    const sx = P0().x; Object.assign(K, {r: true}); for (let i = 0; i < 60; i++) T.update(1 / 60); Object.assign(K, none());
    ok('swim: sideways speed is slower than running (125 vs 205 px/s)', P0().x - sx > 60 && P0().x - sx < 140, Math.round(P0().x - sx) + ' px in 1 s');
    // the leap onto the bank
    const f2 = fresh('flood'), w2 = f2.water; T.L.cgS[w2.gid] = 1; for (let i = 0; i < 150; i++) T.update(1 / 60);
    const bankX = w2.x + w2.w; put(P1(), w2.x - 40, GY - PH); put(P0(), bankX - 40, w2.y - 14); const st = bot(); let out2 = false;
    for (let i = 0; i < 300 && G.state === 'play'; i++) { Object.assign(K, swim(P0(), bankX + 60, st, 4)); T.update(1 / 60); if (P0().onGround && P0().x > bankX + 10 && P0().y + PH <= GY + 1) { out2 = true; break } }
    ok('swim: from the surface he can leap out onto the bank', out2, 'x ' + Math.round(P0().x) + ' y ' + Math.round(P0().y) + ' ' + G.state);
    // single player never feels water
    const sp = T.buildLevel(3, {diff: 'normal'}); ok('swim: no water on a level without it (no slow-down)', !sp.wt); }

  // ---------- flood puzzle ----------
  if (want('flood')) {
    let f = fresh('flood'), sA = bot(), sB = bot(); const w = f.water, end = w.x + w.w;
    run(900, () => swim(P0(), f.lever.x, sA), idle);
    ok('flood: alone you cannot cross (the pit kills, the water is closed)', G.state === 'dead' || P0().x < end, G.state + ' x ' + Math.round(P0().x));
    f = fresh('flood'); sA = bot(); sB = bot(); const w2 = f.water, end2 = w2.x + w2.w; let ph = 0;
    for (let i = 0; i < 2400 && G.state === 'play' && f.lever.on !== 1; i++) {
      const k0 = walk(P0(), px(f.plate), sA, 4), p1 = P1();
      const k1 = f.plate.on === 1 && Math.abs(w2.y - w2.yHi) < 1 ? swim(p1, f.lever.x, sB, 4) : walk(p1, px(f.plate) + 14, sB, 4);
      Object.assign(K, k0); Object.assign(K2, k1); T.update(1 / 60) }
    ok('flood: one holds the plate, the water rises, the other swims across and pulls the lever', f.lever.on === 1 && P1().x > end2 - 40 && G.state === 'play', 'lever ' + f.lever.on + ' x ' + Math.round(P1().x) + ' ' + G.state);
    run(60, idle, idle); ok('flood: the lever keeps the water up', E(w2.gid) === 1 && Math.abs(w2.y - w2.yHi) < 1);
    run(1500, () => swim(P0(), f.lever.x + 50, sA, 4), idle, () => P0().x > end2 + 20 && P0().onGround);
    ok('flood: then the plate holder swims over too', P0().x > end2 + 10 && G.state === 'play', 'x ' + Math.round(P0().x) + ' ' + G.state); }

  // ---------- fan ----------
  if (want('fan')) {
    let f = fresh('fan'), sA = bot(), sB = bot(); const fan = f.fan, wallX = (f.x0 + 11) * TS, wallTop = (11 - 6) * TS; let best = 1e9;
    for (let i = 0; i < 900 && G.state === 'play'; i++) { const p = P0(), k = walk(p, wallX - 30, sA); k.j = true; if (p.onGround) k.jp = true; Object.assign(K, k); Object.assign(K2, idle()); T.update(1 / 60); best = Math.min(best, p.y + PH) }
    ok('fan: alone (fan off) you cannot get over the wall', P0().x < wallX && best > wallTop + 20, 'highest foot ' + Math.round(GY - best));
    f = fresh('fan'); sA = bot(); sB = bot(); const wallEnd = (f.x0 + 13) * TS;
    // into the column, up with the wind, then right as soon as the feet are above the wall top
    const fly = (p, st) => { if (p.y + PH < wallTop - 6 || p.x + PW > wallX + 2) { const k = none(); k.r = true; return k } return walk(p, px(fan), st, 3) };
    for (let i = 0; i < 1500 && G.state === 'play' && f.lever.on !== 1; i++) {
      const p1 = P1(), k0 = walk(P0(), px(f.plate), sA, 4); let k1;
      if (f.plate.on !== 1) k1 = walk(p1, px(f.plate) + 14, sB, 4);
      else if (p1.x + PW / 2 < wallEnd) k1 = fly(p1, sB);
      else k1 = walk(p1, f.lever.x, sB, 3);
      Object.assign(K, k0); Object.assign(K2, k1); T.update(1 / 60) }
    ok('fan: one holds the plate, the other is blown over the wall and pulls the lever', f.lever.on === 1 && P1().x > wallEnd && G.state === 'play', 'lever ' + f.lever.on + ' x ' + Math.round(P1().x) + ' y ' + Math.round(P1().y) + ' ' + G.state);
    run(60, idle, idle); ok('fan: the lever keeps it blowing', E(fan.gid) === 1);
    for (let i = 0; i < 700 && G.state === 'play' && !(P0().x > wallEnd + 10 && P0().onGround); i++) { const p = P0(); const k = p.x + PW / 2 < wallEnd ? fly(p, sA) : none();
      Object.assign(K, k); Object.assign(K2, idle()); T.update(1 / 60) }
    ok('fan: then the plate holder flies over as well', P0().x > wallEnd && G.state === 'play', 'x ' + Math.round(P0().x) + ' ' + G.state); }

  // ---------- chain of bridges ----------
  if (want('chain')) {
    let f = fresh('chain'); const [pl1, pl2] = f.plates, [lv1, lv2] = f.levers, [b1, b2] = f.gates, endX = b2.x + b2.w * TS;
    let sA = bot(); run(900, () => walk(P0(), lv1.x, sA), idle);
    ok('chain: alone you cannot cross the first gap', G.state === 'dead' || P0().x < b1.x + b1.w * TS, G.state + ' x ' + Math.round(P0().x));
    f = fresh('chain'); const [q1, q2] = f.plates, [m1, m2] = f.levers, [c1, c2] = f.gates, end = c2.x + c2.w * TS + 20; sA = bot(); let sB = bot();
    for (let i = 0; i < 3500 && G.state === 'play' && P0().x < end; i++) {
      const p0 = P0(), p1 = P1(); let k0, k1;
      // player 0 holds plate 1 until lever 1 is pulled, then crosses to the island, holds plate 2 until lever 2 is pulled, then goes on
      if (m2.on === 1) k0 = walk(p0, end + 10, sA, 3); else if (m1.on === 1) k0 = walk(p0, px(q2), sA, 4); else k0 = walk(p0, px(q1), sA, 4);
      // player 1 waits for plate 1, runs to lever 1, then waits for plate 2, runs to lever 2
      if (m1.on !== 1) k1 = q1.on === 1 ? walk(p1, m1.x, sB, 3) : walk(p1, px(q1) + 14, sB, 4); else if (m2.on !== 1) k1 = q2.on === 1 ? walk(p1, m2.x, sB, 3) : walk(p1, px(q2) + 14, sB, 4); else k1 = walk(p1, end + 30, sB, 3);
      Object.assign(K, k0); Object.assign(K2, k1); T.update(1 / 60) }
    ok('chain: two helpers in turn get both across', m1.on === 1 && m2.on === 1 && P0().x >= end - 10 && P1().x > c2.x + c2.w * TS && G.state === 'play', 'levers ' + m1.on + m2.on + ' p0 ' + Math.round(P0().x) + ' p1 ' + Math.round(P1().x) + ' ' + G.state); }

  // ---------- key on the shelf ----------
  if (want('keyshelf')) {
    let f = fresh('keyshelf'); const sh1 = f.plats[0], sh2 = f.plats[1], key = f.key, lock = f.gate; let sA = bot();
    let best = 1e9; for (let i = 0; i < 900 && G.state === 'play'; i++) { const p = P0(), k = walk(p, sh1.x - 14, sA); k.j = true; if (p.onGround) k.jp = true; Object.assign(K, k); Object.assign(K2, idle()); T.update(1 / 60); best = Math.min(best, p.y + PH) }
    ok('keyshelf: alone you cannot reach the first shelf', key.h === -1 && best > sh1.y + 8, 'highest foot ' + Math.round(GY - best) + ' shelf ' + Math.round(GY - sh1.y));
    ok('keyshelf: the lock door is shut without the key', E(lock.gid) === 0);
    f = fresh('keyshelf'); const s1 = f.plats[0], s2 = f.plats[1], key2 = f.key, lk = f.gate; sA = bot(); const sB = bot(); const face = s1.x - PW - 6;
    let ph = 0;      // player 0 = booster waits at the foot of the shelf, player 1 climbs: head, shelf 1, shelf 2, key, down, lock
    for (let i = 0; i < 2500 && G.state === 'play'; i++) {
      const p0 = P0(), p1 = P1(); let k0 = none(), k1 = none();
      if (ph === 0) { k0 = walk(p0, face + PW / 2, sA, 2); k1 = walk(p1, face + PW / 2, sB, 2); if (Math.abs(p0.x - face) < 3 && Math.abs(p1.x - face) < 3 && Math.abs(p0.vx) < 15 && Math.abs(p1.vx) < 15) ph = 1 }
      else if (ph === 1) { k1.j = true; k1.jp = p1.onGround; k1.r = false; if (p1.stand < 0) ph = 2 }
      else if (ph === 2) { k1.j = true; k1.jp = p1.onGround; if (p1.y + PH < s1.y - 3 || (p1.vy > 0 && p1.y + PH < s1.y + 20)) k1.r = true; if (p1.onGround && p1.stand === s1.id) ph = 3 }
      else if (ph === 3) { k1 = walk(p1, s1.x + s1.w - 8, sB, 3); if (p1.onGround && Math.abs(p1.x + PW / 2 - (s1.x + s1.w - 8)) < 6) ph = 4 }
      else if (ph === 4) { k1.r = true; k1.j = true; k1.jp = p1.onGround; if (p1.stand === s2.id && p1.onGround) ph = 5; if (p1.onGround && p1.y + PH > s1.y + 20) ph = 3 }
      else if (ph === 5) { k1 = walk(p1, key2.x, sB, 4); if (key2.h === 1) ph = 6 }
      else if (ph === 6) { k1 = walk(p1, lk.x - 8, sB, 3); if (E(lk.gid) === 1) ph = 7 }
      else if (ph === 7) { k1 = walk(p1, (T.L.exitTx + 1) * TS, sB, 3); k0 = walk(p0, (T.L.exitTx + 1) * TS, sA, 3) }
      Object.assign(K, k0); Object.assign(K2, k1); T.update(1 / 60); if (ph === 7 && P0().x > lk.x + 30) break }
    ok('keyshelf: the booster lifts him, he fetches the key from the top shelf', key2.h === 1 || key2.h === 2, 'phase ' + ph + ' key ' + key2.h + ' p1 ' + Math.round(P1().x) + ',' + Math.round(P1().y));
    ok('keyshelf: the key opens the lock (and is used up)', E(lk.gid) === 1 && key2.h === 2, 'E ' + E(lk.gid) + ' key ' + key2.h);
    ok('keyshelf: the booster walks through the open door too', P0().x > lk.x + 20 && G.state === 'play', 'x ' + Math.round(P0().x)); }

  // ---------- two floors ----------
  if (want('floors')) {
    let f = fresh('floors'); const lift0 = f.lift, UY = 7 * TS; let sA = bot();
    let best = 1e9; for (let i = 0; i < 900 && G.state === 'play'; i++) { const p = P0(), k = walk(p, lift0.x + lift0.w / 2, sA, 4); if (p.onGround && i % 30 === 0) { k.j = true; k.jp = true } Object.assign(K, k); Object.assign(K2, idle()); T.update(1 / 60); best = Math.min(best, p.y + PH) }
    ok('floors: alone you cannot reach the upper floor', best > UY + 20, 'highest foot ' + Math.round(GY - best) + ' floor ' + Math.round(GY - UY));
    f = fresh('floors'); const [r0, r1, r2] = f.plates, [L0, L2] = f.levers, lf = f.lift, br = f.gates.find(g => g.kind === 'bridge'), dr = f.gates.find(g => g.kind === 'door'); sA = bot(); const sB = bot();
    const gapL = br.x, exitX = (T.L.exitTx + 1) * TS; let ph = 0, at = {};
    // P1 = the one who goes up: hops onto the lift, rides it, pulls lever 0, waits for the bridge, crosses, stands on the upper plate; later walks to the exit along the slab
    // P0 = the one below: holds plate 0 (lift), then plate 1 (bridge), passes the door when it opens, pulls lever 2
    for (let i = 0; i < 5000 && G.state === 'play'; i++) {
      const p0 = P0(), p1 = P1(); let k0 = none(), k1 = none();
      if (ph === 0) { k0 = walk(p0, r0.x - 18, sA, 5); k1 = walk(p1, lf.x + lf.w / 2, sB, 6); if (Math.abs(p1.x + PW / 2 - (lf.x + lf.w / 2)) < 8 && (Math.abs(p1.vx) < 40 || !p1.onGround)) { k1 = none(); k1.j = true; k1.jp = p1.onGround } if (standOn(lf.id)) { ph = 1; at.p0 = i } }
      else if (ph === 1) { k0 = walk(p0, px(r0), sA, 4); if (p1.y + PH <= UY + 2) { ph = 2; at.p1 = i } }
      else if (ph === 2) { k0 = walk(p0, px(r0), sA, 4); if (p1.onGround && p1.x >= 668 && p1.y + PH <= UY + 2) k1 = walk(p1, L0.x, sB, 3); else { k1.r = true; k1.j = true; k1.jp = p1.onGround && standOn(lf.id) && p1.x + PW > lf.x + lf.w - 14 } if (L0.on === 1) { ph = 3; at.p2 = i } }
      else if (ph === 3) { k0 = walk(p0, px(r1), sA, 4); k1 = E(br.gid) === 1 || p1.x > br.x + 20 ? walk(p1, px(r2), sB, 4) : walk(p1, gapL - 24, sB, 5); if (r2.on === 1) { ph = 4; at.p3 = i } }
      else if (ph === 4) { k0 = walk(p0, E(dr.gid) === 1 ? L2.x : dr.x - 34, sA, 4); k1 = walk(p1, px(r2), sB, 4); if (L2.on === 1) { ph = 5; at.p4 = i } }
      else if (ph === 5) { k0 = walk(p0, exitX, sA, 3); k1 = walk(p1, exitX, sB, 3); if (P0().x > exitX - 10 && P1().x > exitX - 10) { at.p5 = i; break } }
      if (window.__trace && i % 8 === 0 && i < 400) out.push(['t' + i, true, 'ph ' + ph + ' p0 ' + p0.x.toFixed(0) + ',' + p0.y.toFixed(0) + ' p1 ' + p1.x.toFixed(1) + ',' + p1.y.toFixed(1) + ' vx ' + p1.vx.toFixed(0) + ' gnd ' + p1.onGround + ' st ' + p1.stand + ' k1 ' + JSON.stringify(k1).replace(/"|false/g, '') + ' lift ' + lf.y]);
      Object.assign(K, k0); Object.assign(K2, k1); T.update(1 / 60) }
    const info = 'phase ' + ph + ' ' + JSON.stringify(at) + ' lever0 ' + L0.on + ' plate2 ' + r2.on + ' lever2 ' + L2.on + ' p0 ' + Math.round(P0().x) + ',' + Math.round(P0().y) + ' p1 ' + Math.round(P1().x) + ',' + Math.round(P1().y) + ' ' + G.state;
    ok('floors: one rides the lift up (the other holds its plate) and pulls the upper lever', L0.on === 1, info);
    ok('floors: the lower one holds the bridge plate so the upper one crosses the hole and stands on the upper plate', r2.on === 1 || L2.on === 1, info);
    ok('floors: the upper plate opens the door below and the lower one latches it', L2.on === 1, info);
    ok('floors: both reach the end together (level won)', G.state === 'win' || (P0().x > exitX - 40 && P1().x > exitX - 40 && G.state === 'play'), info); }

  // ---------- snapshots keep the new state ----------
  if (want('snap')) {
    for (const v of ['flood', 'fan', 'keyshelf']) { const f = fresh(v); if (f.water) T.L.cgS[f.water.gid] = 1; if (f.fan) T.L.cgS[f.fan.gid] = 1; for (let i = 0; i < 30; i++) T.update(1 / 60);
      if (f.key) f.key.h = 0;
      const s1 = T.snap(true); for (let i = 0; i < 30; i++) T.update(1 / 60); const s2 = T.snap(true); T.restore(s1); const s3 = T.snap(true);
      ok('snapshot (' + v + '): restore gives back exactly the same world', s1 === s3 && s1 !== s2, s1.length + ' bytes');
      const rep = n => { for (let i = 0; i < n; i++) { Object.assign(K, {r: i % 40 < 20}); Object.assign(K2, idle()); T.update(1 / 60) } return T.snap(true) };
      T.restore(s1); const a = rep(80); T.restore(s1); const b = rep(80); ok('snapshot (' + v + '): replaying from it is deterministic', a === b) } }
  return out;
}
"""

def main():
    h = functools.partial(Q, directory=ROOT); srv = socketserver.TCPServer(('127.0.0.1', 0), h); srv.allow_reuse_address = True
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    bad = 0
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1000, 'height': 600}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.add_init_script('window.__TR=' + ('true' if os.environ.get('TRACE') else 'false')); pg.goto(f'http://127.0.0.1:{srv.server_address[1]}/trap-dungeon.html'); pg.wait_for_function('() => window.TD && window.TD.S', timeout=30000); pg.wait_for_timeout(400)
        for name, cond, extra in pg.evaluate(LOGIC, [SHOTS, ONLY]):
            print(('  ok   ' if cond else '  FAIL ') + name + (('  [' + extra + ']') if extra else ''))
            if not cond: bad += 1
        print('errors', errs[:3]); bad += len(errs); b.close()
    srv.shutdown()
    print('RESULT:', 'ALL OK' if bad == 0 else f'{bad} FAILED'); sys.exit(1 if bad else 0)
main()
