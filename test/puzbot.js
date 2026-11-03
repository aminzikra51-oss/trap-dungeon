// A puzzle-solving bot for ONE player (me = 0|1) of a co-op level that holds a single puzzle (see FLAGS.coScript). Returns () => keys, call it every frame/tick.
// It reads the shared world (T.PLY, T.L) like a player would see it; the two bots only coordinate through what the world shows (plates pressed, levers pulled...).
(me, v) => {
  const T = window.TD, TS = 32, GY = 352, PH = 28, PW = 20, st = {lx: -1, stuck: 0, hold: 0, ph: 0};
  const none = () => ({l: false, r: false, j: false, jp: false, g: false, gp: false});
  const walk = (p, tx, tol) => { const d = tx - (p.x + PW / 2) - (p.onGround ? p.vx * .1 : 0), k = none(), t = tol == null ? 3 : tol;      // look ahead: the inputs arrive a few frames late online, aiming at the plain position would overshoot and oscillate
    if (d > t) k.r = true; else if (d < -t) k.l = true;
    if ((k.r || k.l) && p.onGround && Math.abs(p.x - st.lx) < .01) st.stuck++; else st.stuck = 0; st.lx = p.x;
    if (st.stuck >= 3) { st.hold = 22; st.stuck = 0; k.jp = true }
    if (st.hold > 0) { k.j = true; st.hold-- }
    return k };
  window.__bst = st; (window.__bsts = window.__bsts || {})[me] = st;
  return () => {
    st.n = (st.n || 0) + 1;      // frame counter (a jump press must not be repeated while the first one is still on its way online)
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
      if (st.ph === 0) { const k = walk(p, face + PW / 2, 2); if (Math.abs(p.x - face) < 3.5 && Math.abs(q.x - face) < 3.5) st.ph = 1; return k }
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
    const pt = ((T.FLAGS && T.FLAGS.coVar) || {}).pt | 0, bo = ents.find(e => e.t === 'cbould'), sawE = ents.filter(e => e.t === 'crsaw');
    const pitHop = k => { const pit = L.pits && L.pits[L.pits.length - 1]; if (!pit) return k; const ex = pit[0] * TS, w = pit[1] * TS;       // jump the pit behind the boulder pen
      if (p.onGround && p.x + PW > ex - 24 && p.x < ex && k.r) { k.j = true; k.jp = true } else if (!p.onGround && p.x + PW > ex - 60 && p.x < ex + w) { k.r = true; k.j = true } return k };
    const after = () => { if (v !== 'boulder') return walk(p, exit); if (p.y + PH < GY - 90 && bo && bo.st === 1) return none(); return pitHop(walk(p, exit)) };      // up on the ledge: wait until the boulder is gone
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
    // ---- part 3 (w_copuz3.js): carry and throw. me 0 carries, me 1 is carried and thrown ----
    if (v === 'tossgap' || v === 'tossup' || (v === 'boulder' && pt === 2)) {
      const gt = ents.find(e => e.t === 'cgate' && e.kind !== 'none'), open = E1(gt.gid) === 1;
      if (open) return after();
      st.cd = Math.max(0, (st.cd | 0) - 1);
      let stand, shelfTop = 0, shelfL = 0;
      if (v === 'tossgap') stand = L.pits[0][0] * TS - PW - 2;
      else { shelfTop = lever.y; const ty = Math.round(shelfTop / TS); shelfL = Math.min(...Object.keys(L.blocks).filter(k => +k.split(',')[1] === ty).map(k => +k.split(',')[0])); stand = shelfL * TS - PW - 8 }
      if (me === 0) {
        if (p.hold < 0) { const k = walk(p, stand + PW / 2, 2), near = Math.abs(p.x - stand) < 5 && Math.abs(p.x - q.x) < 22 && Math.abs(p.vx) < 12 && p.onGround && q.onGround && q.hb < 0;
          if (near && st.cd === 0) { k.g = k.gp = true; st.cd = 12; st.w = 0 } return k }
        st.w = (st.w | 0) + 1; const k = none(); if (st.w > 24 && p.gcd <= 0 && Math.abs(p.vx) < 10 && st.cd === 0) { if (v === 'tossgap') k.r = true; k.g = k.gp = true; st.cd = 20 } return k }
      if (p.hb >= 0) { st.fl = 1; return none() }
      if (p.onGround && st.fl) st.fl = 0;                                                                     // landed after the throw
      if (p.onGround && p.stand >= 0 && p.y + PH > GY - 40 && p.x + PW / 2 < (v === 'tossgap' ? L.pits[0][0] * TS + 4 : lever.x - 40)) return walk(p, q.x + PW / 2, 3);      // on the near bank: step up to the carrier
      if (!p.onGround && st.fl) { const k = none();
        if (v === 'tossgap') { k.r = true; k.j = true; if (!p.dj && p.vy > 300 && !(st.d1 > 0)) { k.jp = true; st.d1 = 20 } st.d1 = Math.max(0, (st.d1 | 0) - 1); return k }
        const fy = p.y + PH; if (fy <= shelfTop - 2) { const d = lever.x - (p.x + PW / 2) - p.vx * .12; if (d > 6) k.r = true; else if (d < -6) k.l = true } if (!p.dj && p.vy > -40 && fy > shelfTop - 10) { k.jp = true; k.j = true } else if (p.vy < 0) k.j = true; return k }
      return lever.on ? walk(p, exit) : walk(p, lever.x, 3) }
    // ---- part 4 (w_copuz4.js): the big traps ----
    const syncUp = () => {                                                                                  // me 1: climb the low ledge and stand on the upper plate (same moves as the sync puzzle)
      const plat = ents.find(e => e.t === 'plat'), ledge = plat.x - 20;
      if (st.ph === 0) { const k = walk(p, ledge, 3); if (Math.abs(p.x + PW / 2 - ledge) < 6 && p.onGround) st.ph = 1; return k }
      if (st.ph === 1) { if (p.onGround && p.y + PH > GY - 10 && p.x + PW / 2 > ledge + 40) { st.ph = 0; return none() }
        const k = none(); k.r = true; k.j = true; k.jp = p.onGround; if (p.onGround && p.y + PH < GY - 40) st.ph = 2; return k }
      if (p.onGround && p.y + PH > GY - 10) { st.ph = 0; return none() }
      return walk(p, pc(plates[1]), 3) };
    if (v === 'boulder' && pt === 0) {
      if (E1(gate.gid) === 1) return after();
      return me === 0 ? walk(p, pc(plates[0]), 4) : syncUp() }
    if (v === 'boulder' && pt === 1) {
      if (E1(gate.gid) === 1) return after();
      const top = lever.y, ty = Math.round(top / TS), shelfL = Math.min(...Object.keys(L.blocks).filter(k => +k.split(',')[1] === ty).map(k => +k.split(',')[0])), face = shelfL * TS - PW - 2, up = p.onGround && p.x > shelfL * TS - 4 && p.y + PH <= top + 1;
      if (me === 1) return walk(p, face + PW / 2, 2);                                                    // the booster waits at the foot of the ledge
      if (st.ph === 0) { const k = walk(p, face + PW / 2, 2); if (Math.abs(p.x - face) < 3.5 && Math.abs(q.x - face) < 3.5) st.ph = 1; return k }
      if (st.ph === 1) { if (Math.abs(p.x - face) > 10 || Math.abs(q.x - face) > 10) { st.ph = 0; return none() }      // (died / got pushed: go back to the foot of the ledge)
        const k = none(); k.j = true; if (p.onGround && st.n - (st.jf || -99) > 20) { k.jp = true; st.jf = st.n } if (p.stand < 0) st.ph = 2; return k }
      if (st.ph === 2 && p.onGround && p.stand === 0 && p.y + PH > GY - 10) { st.ph = 0; return none() }                 // fell back to the floor (or off the far end of the ledge): start the climb again
      if (st.ph === 2) { const k = none(); k.j = true; if (p.onGround && st.n - (st.jf || -99) > 20) { k.jp = true; st.jf = st.n } if (p.dj || p.y + PH < top - 3 || (p.vy > 0 && p.y + PH < top + 20)) k.r = true; if (!p.onGround && !p.dj && p.vy > -130 && p.y + PH > top - 12 && st.n - (st.jf || -99) > 6 && st.n - (st.df || -99) > 20) { k.jp = true; st.df = st.n } if (up) { st.ph = 3; return none() } return k }      // (right as soon as the double jump is spent: a lagging link must not wait for the very last frame)
      return walk(p, lever.x, 3) }
    if (v === 'ceil') {
      const ce = ents.find(e => e.t === 'cceil');
      if (pt === 0) { if (lever.on) return walk(p, exit); return me === 0 ? walk(p, pc(plate), 4) : walk(p, lever.x, 3) }
      if (pt === 2) { if (E1(ce.gid) === 1) return walk(p, exit); return me === 0 ? walk(p, pc(plates[0]), 4) : syncUp() }
      // pt 1: the baton - there is always somebody on a plate until the lever has been pulled
      const [a1, a2, a3] = plates;
      if (lever.on) return walk(p, exit);
      if (me === 0) { if (a3.on) st.ph = 1; if (st.ph) return walk(p, pc(a3), 4); return a2.on ? walk(p, pc(a3), 4) : walk(p, pc(a1), 4) }
      if (!a1.on && !st.ph) return none(); st.ph = 1;
      return a3.on ? walk(p, lever.x, 3) : walk(p, pc(a2), 4) }
    if (v === 'rsaw') {
      const done = L.cgS && Object.values(L.cgS).length && ents.filter(e => e.t === 'clever').every(e => e.on), up = e => e.ret > .85;
      if (lever.on) return walk(p, exit);
      if (pt === 0) { const s1 = sawE[0]; if (me === 0) return walk(p, pc(plate), 4); return plate.on && up(s1) ? walk(p, lever.x, 3) : walk(p, plate.x - 44, 6) }
      if (pt === 1) { const [s1, s2] = sawE, [p1, p2] = plates;
        if (me === 0) return up(s1) ? walk(p, pc(p2), 4) : walk(p, pc(p1), 4);
        if (!up(s1)) return walk(p, p1.x - 44, 6);
        return p2.on && up(s2) ? walk(p, lever.x, 3) : walk(p, p2.x - 44 - 0, 6) }
      // pt 2: two saws on one gate: me 0 holds plate 1 until me 1 stands on plate 2, then walks on; me 1 carries on to the lever and everybody follows
      const [p1, p2] = plates;
      if (me === 0) return p2.on ? walk(p, lever.x, 3) : walk(p, pc(p1), 4);
      if (!p1.on && !st.ph) return walk(p, p1.x - 44, 6); st.ph = 1;
      return walk(p, pc(p2), 4) }
    if (v === 'catapult') {                                                                                // me 0 hops on one end of the see-saw, me 1 stands on the other end and is launched
      const cat = ents.find(e => e.t === 'ccat'), padL = cat.x + cat.pw / 2, padR = cat.x + cat.pw * 1.5 + cat.gap, key = ents.find(e => e.t === 'ckey'), dr = ents.find(e => e.t === 'cgate' && e.kind !== 'none');
      if (E1(dr.gid) === 1) return walk(p, exit);
      const b = T.PLY[1], onPad = pp => pp.onGround && Math.abs(pp.x + PW / 2 - padR) < 10 && Math.abs(pp.vx) < 15;
      if (me === 0) {
        st.hop = Math.max(0, (st.hop | 0) - 1);
        if (b.y + PH < GY - 40 || b.stand < 0 || !b.onGround && b.vy < 0) return walk(p, padL, 3);        // he is up (or flying): stay put
        if (!(p.onGround && Math.abs(p.x + PW / 2 - padL) < 8 && Math.abs(p.vx) < 15)) { const k = walk(p, padL, 3); if (st.hop > 28) k.j = true; return k }
        const k = none(); if (st.hop > 28) k.j = true;
        if (st.hop === 0 && cat.cd <= 0 && onPad(b)) { k.j = true; k.jp = true; st.hop = 40 }
        return k }
      const cols = Object.keys(L.blocks).map(k => +k.split(',')[0]), rows = Object.keys(L.blocks).map(k => +k.split(',')[1]), top = Math.min(...rows) * TS, wallR = (Math.max(...cols) + 1) * TS;
      if (p.thr) st.fl = 1; else if (p.onGround) st.fl = 0;
      const fy = p.y + PH, cx = p.x + PW / 2;
      if (st.fl && !p.onGround) {
        const k = none(), tx = pt === 2 ? (key.h >= 0 ? dr.x : key.x) : lever.x; k.j = true;
        if (pt === 1) k.r = true; else if (fy <= top - 2) { const d = tx - cx - p.vx * .1; if (d > 6) k.r = true; else if (d < -6) k.l = true }
        if (!p.dj && p.vy > -40 && fy > top - 10) k.jp = true;
        return k }
      if (fy < GY - 40) return pt === 2 ? (key.h >= 0 ? walk(p, dr.x - 8, 3) : walk(p, key.x, 4)) : walk(p, lever.x, 3);              // up on the ledge
      if (pt === 2 && key.h >= 0) return walk(p, dr.x - 8, 3);
      if (pt === 1 && p.x > wallR) return walk(p, lever.x, 3);
      return walk(p, padR, 3) }
    if (v === 'opm') {                                                                                     // me 0 operates the plates, me 1 runs through the barriers one by one
      const bars = ents.filter(e => e.t === 'cbar').sort((a, b) => a.x - b.x), r = T.PLY[1], passed = (b, who) => who.x > b.x + b.w + 4;
      if (lever.on) return walk(p, exit);
      const cur = bars.findIndex(b => !passed(b, r));
      if (me === 0) { const b = bars[cur < 0 ? bars.length - 1 : cur], plate = plates.find(e => e.gid === b.gid); return walk(p, pc(plate), 4) }
      if (cur < 0) return walk(p, lever.x, 3);
      const b = bars[cur];
      if (E1(b.gid) === 1 || p.x + PW / 2 > b.x - 6) return walk(p, b.x + b.w + 40, 6);
      return walk(p, b.x - 36, 6) }
    if (v === 'drum') {                                                                                    // both stomp on the beat: jump so that the LANDING falls on it (air time of an ordinary jump = .693 s, plus the input delay online)
      const e = ents.find(x => x.t === 'cdrum'); if (E1(e.gid) === 1) return after();
      const pad = e.cx + (me ? 70 : -70);
      if (e.st === 0) return walk(p, pad, 5);
      const lat = T.NET && T.NET.link === 'play' ? (T.NET.D | 0) / 60 : 0, tgt = e.tm <= e.tb + .02 ? [e.tb, e.nb] : [e.tb + e.pr, e.nb + 1];      // after this beat's time the next one is the target
      const k = walk(p, pad, 12), mine = e.pt !== 1 || (tgt[1] & 1) === me, lead = tgt[0] - e.tm;
      if (mine && p.onGround && st.tt !== tgt[1] && lead <= .693 + lat + .02 && lead > .25 && st.n - (st.jf || -99) > 20) { st.tt = tgt[1]; st.jf = st.n; st.hold = 26; k.l = k.r = false; k.j = true; k.jp = true }      // (hold the key: a short press is a short hop, and the hop is what has to last .69 s)
      return k }
    if (v === 'simon') {                                                                                   // one waits at each end; whoever stands nearer to the pad that is asked for walks onto it and hops
      const e = ents.find(x => x.t === 'csimon'); if (E1(e.gid) === 1) return after();
      const cx = p.x + PW / 2, last = e.px[e.px.length - 1];
      if (e.st === 0) return walk(p, e.trig + 20 + me * 30, 6);
      if (e.st !== 2) return walk(p, me ? last - 20 : e.px[0] + 20, 5);                                       // watching the pads: take the place at my end
      const need = e.rv ? e.sq[e.n - 1 - e.ix] : e.sq[e.ix], tx = e.px[need], dm = Math.abs(cx - tx) - (me === 0 ? 20 : 0), dq = Math.abs(q.x + PW / 2 - tx) - (me === 1 ? 20 : 0);
      if (dm > dq) return none();                                                                              // the other one is nearer: his pad
      if (!p.onGround) return none();                                                                          // (in the air: no steering, the hop goes straight up)
      if (Math.abs(cx - tx) > 7) return walk(p, tx, 4);
      const k = none(); if (st.n - (st.jf || -99) > 40 && Math.abs(p.vx) < 30) { st.jf = st.n; st.hold = 26; k.j = true; k.jp = true } if (st.hold > 0) { k.j = true; st.hold-- } return k }
    if (v === 'seer') {                                                                                    // me 0 sits on the watchtower; me 1 hops over the stones he is told about (the bot reads the stone list)
      const sk = ents.find(e => e.t === 'cseer'), n = sk.st.length, cx = p.x + PW / 2, fy = p.y + PH, mid = (sk.tw0 + sk.tw1) / 2;
      if (lever.on) return walk(p, exit);
      const onTower = o => o.onGround && o.stand >= 0 && Math.abs(o.y + PH - sk.top) < 3 && o.x + PW / 2 >= sk.tw0 && o.x + PW / 2 <= sk.tw1;
      if (me === 0) return walk(p, sk.tw0 + 12, 4);                                                       // the watcher stays in the left half of the tower
      const plats = [{l: sk.tw0, r: sk.tw1, top: sk.top}].concat(sk.st.map(s => ({l: s[0] * TS, r: (s[0] + 2) * TS, top: s[1] * TS})));
      const cur = p.onGround && p.stand >= 0 ? plats.findIndex(pl => Math.abs(fy - pl.top) < 3 && cx >= pl.l && cx <= pl.r) : -1; if (cur >= 0) st.cur = cur;
      if (p.onGround) {
        if (cur < 0) { if (cx > plats[n].r - 24) { st.cur = n; return walk(p, lever.x, 3) } st.cur = -1; return walk(p, sk.tw1 - 14, 4) }
        if (!onTower(q) && cur === 0) return walk(p, sk.tw1 - 14, 3);                                      // wait on my own spot of the tower (not in the middle: the watcher needs room) until he is up there
        if (cur === n) return walk(p, lever.x, 3);
        const edge = plats[cur].r - 6, k = walk(p, edge, 2);
        if (cx >= edge - 3) { k.r = true; k.l = false; k.j = true; k.jp = true } return k }
      if ((st.cur | 0) >= n) { const k = none(); if (lever.x > cx + 4) k.r = true; return k }                 // off the last stone: just fall onto the far bank
      const T = plats[Math.min((st.cur | 0) + 1, n)], d = (T.l + T.r) / 2 - cx - p.vx * .1, k = none(); k.j = true;
      if (d > 6) k.r = true; else if (d < -6) k.l = true;
      if (!p.dj && p.vy > -60 && fy > T.top - 6 && !(cx >= T.l - 2 && cx <= T.r + 2)) k.jp = true;      // the second jump only when he would otherwise fall short
      return k }
    return walk(p, exit);
  };
}
