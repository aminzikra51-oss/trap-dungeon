// A puzzle-solving bot for ONE player (me = 0|1) of a co-op level that holds a single puzzle (see FLAGS.coScript). Returns () => keys, call it every frame/tick.
// It reads the shared world (T.PLY, T.L) like a player would see it; the two bots only coordinate through what the world shows (plates pressed, levers pulled...).
(me, v) => {
  const T = window.TD, TS = 32, GY = 352, PH = 28, PW = 20, st = {lx: -1, stuck: 0, hold: 0, ph: 0};
  const none = () => ({l: false, r: false, j: false, jp: false});
  const walk = (p, tx, tol) => { const d = tx - (p.x + PW / 2), k = none(), t = tol == null ? 3 : tol;
    if (d > t) k.r = true; else if (d < -t) k.l = true;
    if ((k.r || k.l) && p.onGround && Math.abs(p.x - st.lx) < .01) st.stuck++; else st.stuck = 0; st.lx = p.x;
    if (st.stuck >= 3) { st.hold = 22; st.stuck = 0; k.jp = true }
    if (st.hold > 0) { k.j = true; st.hold-- }
    return k };
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
    return walk(p, exit);
  };
}
