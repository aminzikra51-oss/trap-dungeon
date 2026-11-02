// A puzzle-solving bot for ONE player (me = 0|1) of a co-op level that holds a single puzzle (see FLAGS.coScript). Returns () => keys, call it every frame/tick.
// It reads the shared world (T.PLY, T.L) like a player would see it; the two bots only coordinate through what the world shows (plates pressed, levers pulled...).
(me, v) => {
  const T = window.TD, TS = 32, GY = 352, PH = 28, PW = 20, st = {lx: -1, stuck: 0, hold: 0, ph: 0};
  const none = () => ({l: false, r: false, j: false, jp: false});
  const walk = (p, tx, tol) => { const d = tx - (p.x + PW / 2) - (p.onGround ? p.vx * .1 : 0), k = none(), t = tol == null ? 3 : tol;      // look ahead: the inputs arrive a few frames late online, aiming at the plain position would overshoot and oscillate
    if (d > t) k.r = true; else if (d < -t) k.l = true;
    if ((k.r || k.l) && p.onGround && Math.abs(p.x - st.lx) < .01) st.stuck++; else st.stuck = 0; st.lx = p.x;
    if (st.stuck >= 3) { st.hold = 22; st.stuck = 0; k.jp = true }
    if (st.hold > 0) { k.j = true; st.hold-- }
    return k };
  window.__bst = st; (window.__bsts = window.__bsts || {})[me] = st;
  return () => {
    const G = T.G, L = T.L, p = T.PLY[me], q = T.PLY[1 - me]; if (G.state !== 'play' || !p || p.dead || !L.coList) return none();
    const ents = L.ents, plates = ents.filter(e => e.t === 'cplate'), plate = plates[0], lever = ents.find(e => e.t === 'clever'), gate = ents.find(e => e.t === 'cgate' && e.kind !== 'none'), lift = ents.find(e => e.v === 'colift');
    const pc = e => e.x + e.w / 2, exit = L.exitTx * TS + 8, x0 = L.coList[0][1], E = L.cgE ? L.cgE[(gate || lift || {}).gid] : 0;
    if (v === 'gate' || v === 'bridge') {
      if (me === 0) return lever.on ? walk(p, exit) : walk(p, pc(plate), 4);
      return lever.on ? walk(p, exit) : (plate.on ? walk(p, lever.x) : walk(p, pc(plate) + 12, 4)); }
    if (v === 'sync') {
      if (me === 0) return E === 1 ? walk(p, exit) : walk(p, pc(plates[0]), 4);
      const ledge = (x0 + 8) * TS - 20;
      if (E === 1) return walk(p, exit);
      if (st.ph === 0) { const k = walk(p, ledge, 3); if (Math.abs(p.x + PW / 2 - ledge) < 6 && p.onGround) st.ph = 1; return k }
      if (st.ph === 1) { if (p.onGround && p.y + PH > GY - 10 && p.x + PW / 2 > ledge + 40) { st.ph = 0; return none() }      // missed the ledge / ran past it: back to the run-up spot
        const k = none(); k.r = true; k.j = true; k.jp = p.onGround; if (p.onGround && p.y + PH < GY - 40) st.ph = 2; return k }
      if (p.onGround && p.y + PH > GY - 10) { st.ph = 0; return none() }                                                       // fell off the ledge: try again
      return walk(p, pc(plates[1]), 3); }
    if (v === 'ladder') {
      const wx = x0 + 9, top = GY - 104, face = wx * TS - PW, up = p.onGround && p.x > wx * TS - 4 && p.y + PH <= top + 1;
      if (me === 1) return E === 1 ? walk(p, exit) : walk(p, face + PW / 2, 2);
      if (lever.on) return walk(p, exit);
      if (st.ph === 0) { const k = walk(p, face + PW / 2, 2); if (Math.abs(p.x - face) < 2 && Math.abs(q.x - face) < 2) st.ph = 1; return k }
      if (st.ph === 1) { const k = none(); k.j = true; k.jp = p.onGround; if (p.stand < 0) st.ph = 2; return k }
      if (st.ph === 2) { const k = none(); k.j = true; k.jp = p.onGround; if (p.y + PH < top - 3 || (p.vy > 0 && p.y + PH < top + 20)) k.r = true; if (up) { st.ph = 3; return none() } return k }
      return walk(p, lever.x); }
    if (v === 'lift') {
      const top = lift.y1, cen = lift.x + lift.w / 2;
      if (me === 1) {
        if (lever.on) return walk(p, exit);
        if (st.ph === 0) { const k = walk(p, cen, 4); if (p.onGround && p.stand !== lift.id && Math.abs(p.x + PW / 2 - cen) < 30) { k.j = true; k.jp = true; st.hold = 22 } if (p.stand === lift.id) st.ph = 1; return k }
        if (st.ph === 1) { if (lift.y <= top + 2) st.ph = 2; return none() }
        return walk(p, lever.x, 3); }
      if (!lever.on) return q.stand === lift.id || plate.on ? walk(p, pc(plate), 4) : none();      // wait until he is on the lift, then hold the plate
      if (p.y + PH <= top + 1) st.up = 1;
      if (st.up) return walk(p, exit);                                                                 // he has been on the ledge: nothing left to do but go on
      if (p.stand === lift.id) return none();                                                          // riding up
      const k = walk(p, cen, 3); if (p.onGround && lift.y > GY - 36 && Math.abs(p.x + PW / 2 - cen) < 70) { k.j = true; k.jp = true; st.hold = 22 } return k; }
    // ---- part 2 (w_copuz2.js): water, fan, chained bridges, key on a shelf, two floors ----
    const E1 = g => (L.cgE ? L.cgE[g] : 0), standOn = id => T.PLY.some(o => !o.dead && o.stand === id), px = e => e.x + (e.w || 0) / 2;
    const swim = (tx, tol) => { const w = ents.find(e => e.t === 'cwater'), k = walk(p, tx, tol == null ? 4 : tol); k.jp = false; k.j = false; st.hold = 0; const cy = p.y + PH * .55;
      if (w && cy > w.y + 4) { k.j = true; if (p.vy > -60 && (st.n = (st.n | 0) + 1) % 7 === 0) k.jp = true }
      if (w && cy <= w.y + 18 && Math.abs(tx - (p.x + PW / 2)) > 8) { st.n2 = (st.n2 | 0) + 1; if (st.n2 % 9 === 0) k.jp = true }
      return k };
    const wet = () => T.waterAt && T.waterAt(p);
    if (v === 'flood') {
      const w = ents.find(e => e.t === 'cwater'), end = w.x + w.w;
      if (me === 0) { if (lever.on) return wet() || p.x + PW / 2 > w.x - 6 ? swim(exit, 4) : walk(p, exit); return walk(p, pc(plate), 4) }
      if (lever.on) return wet() || p.x + PW / 2 > w.x - 6 ? swim(exit, 4) : walk(p, exit);
      return plate.on && Math.abs(w.y - w.yHi) < 1 ? swim(lever.x, 4) : walk(p, pc(plate) + 14, 4) }
    if (v === 'fan') {
      const fan = ents.find(e => e.t === 'cfan'), wallX = (x0 + 11) * TS, wallEnd = (x0 + 13) * TS, wallTop = (11 - 6) * TS;
      const fly = () => (p.y + PH < wallTop - 6 || p.x + PW > wallX + 2) ? { l: false, r: true, j: false, jp: false } : walk(p, pc(fan), 3);
      if (me === 0) { if (lever.on) return p.x + PW / 2 < wallEnd ? fly() : walk(p, exit); return walk(p, pc(plate), 4) }
      if (lever.on) return p.x + PW / 2 < wallEnd ? fly() : walk(p, exit);
      if (!plate.on) return walk(p, pc(plate) + 14, 4);
      return p.x + PW / 2 < wallEnd ? fly() : walk(p, lever.x, 3) }
    if (v === 'chain') {
      const [q1, q2] = plates, [m1, m2] = ents.filter(e => e.t === 'clever');
      if (me === 0) return m2.on ? walk(p, exit) : m1.on ? walk(p, pc(q2), 4) : walk(p, pc(q1), 4);
      if (!m1.on) return q1.on ? walk(p, m1.x, 3) : walk(p, pc(q1) + 14, 4);
      if (!m2.on) return q2.on ? walk(p, m2.x, 3) : walk(p, pc(q2) + 14, 4);
      return walk(p, exit) }
    if (v === 'keyshelf') {
      const [s1, s2] = ents.filter(e => e.t === 'plat'), key = ents.find(e => e.t === 'ckey'), lk = gate, face = s1.x - PW - 6;
      if (E1(lk.gid) === 1) return walk(p, exit);
      if (me === 1) return walk(p, face + PW / 2, 2);                                                  // the booster waits at the foot of the shelf and lets himself be climbed
      if (st.ph === 0) { const k = walk(p, face + PW / 2, 2); if (Math.abs(p.x - face) < 3 && Math.abs(q.x - face) < 3 && Math.abs(p.vx) < 15 && Math.abs(q.vx) < 15) st.ph = 1; return k }
      if (st.ph === 1) { const k = none(); k.j = true; k.jp = p.onGround; if (p.stand < 0) st.ph = 2; return k }
      if (st.ph === 2) { const k = none(); k.j = true; k.jp = p.onGround; if (p.y + PH < s1.y - 3 || (p.vy > 0 && p.y + PH < s1.y + 20)) k.r = true; if (p.onGround && p.stand === s1.id) st.ph = 3; return k }
      if (key.h >= 0 && st.ph < 6) st.ph = 6;                                                                       // he has the key (maybe picked up in mid-air): go to the lock
      if (st.ph >= 3 && st.ph <= 5 && p.onGround && p.stand >= 0 && p.y + PH > GY - 10) { st.ph = 0; return none() }                  // fell off a shelf (the inputs arrive late online: he can overshoot the edge): start again at the booster
      if (st.ph === 3) { const k = walk(p, s1.x + s1.w - 10, 4); if (p.onGround && Math.abs(p.x + PW / 2 - (s1.x + s1.w - 10)) < 8) st.ph = 4; return k }
      if (st.ph === 4) { const k = none(), cx = p.x + PW / 2; k.r = true; k.j = true; k.jp = p.onGround;
        if (p.y + PH <= s2.y - 2 && cx >= s2.x + 24) { k.r = false; if (cx > s2.x + s2.w - 24) k.l = true }          // above the second shelf: stop pushing, or he flies over it
        if (p.stand === s2.id && p.onGround) st.ph = 5; else if (p.onGround && p.stand === s1.id && p.x + PW / 2 < s1.x + s1.w - 20) st.ph = 3; return k }
      if (st.ph === 5) { const k = walk(p, key.x, 4); if (key.h >= 0) st.ph = 6; return k }
      return walk(p, lk.x - 8, 3) }
    if (v === 'floors') {
      const [r0, r1, r2] = plates, [L0, L2] = ents.filter(e => e.t === 'clever'), lf = lift, br = ents.find(e => e.t === 'cgate' && e.kind === 'bridge'), dr = ents.find(e => e.t === 'cgate' && e.kind === 'door'), UY = 7 * TS;
      if (L2.on) return walk(p, exit);
      if (me === 0) {                                                                                 // below: lift plate -> bridge plate -> through the door -> latch
        if (E1(dr.gid) === 1) return walk(p, L2.x, 3);
        if (L0.on) return walk(p, pc(r1), 4);
        if (T.PLY[1].stand === lf.id || T.PLY[1].y + PH <= UY + 6) return walk(p, pc(r0), 4);        // hold it while he rides the lift or stands on the upper floor (he may have crossed it on his way, so the lift height alone says nothing)
        return walk(p, r0.x - 18, 5) }
      if (st.ph === 0) { const c = lf.x + lf.w / 2, k = walk(p, c, 6); if (Math.abs(p.x + PW / 2 - c) < 8 && (Math.abs(p.vx) < 40 || !p.onGround)) { const h = none(); h.j = true; h.jp = p.onGround; if (standOn(lf.id)) st.ph = 1; return h } if (standOn(lf.id)) st.ph = 1; return k }
      if (st.ph === 1) { if (p.y + PH <= UY + 2) st.ph = 2; return none() }
      if (st.ph === 2) { if (L0.on) { st.ph = 3; return none() } if (p.onGround && p.x >= 668 && p.y + PH <= UY + 2) return walk(p, L0.x, 3);
        const k = none(); k.r = true; k.j = true; k.jp = p.onGround && standOn(lf.id) && p.x + PW > lf.x + lf.w - 14; return k }
      if (st.ph === 3) { if (r2.on) st.ph = 4; return E1(br.gid) === 1 || p.x > br.x + 20 ? walk(p, pc(r2), 4) : walk(p, br.x - 24, 5) }
      return walk(p, pc(r2), 4) }
    return walk(p, exit);
  };
}
