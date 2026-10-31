"""Map editor v1 checks: share-code codec, every trap builds inside a custom recipe, the golden recipe still builds the same world,
the full UI flow (edit -> play -> clear -> proof stored -> copy -> import), custom maps never touch real progress.
usage: python3 test/editor.py [--shots DIR]"""
import json, sys, os
from playwright.sync_api import sync_playwright

SHOTS = sys.argv[sys.argv.index('--shots') + 1] if '--shots' in sys.argv else None
GOLDEN = {'hash': None}   # filled below from GOLDEN_HASH

CODEC = r"""
() => {
  const T = window.TD, out = [];
  const ok = (name, cond, extra) => out.push([name, !!cond, extra === undefined ? '' : String(extra)]);
  let rs = 12345; const rnd = () => { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 4294967296 };
  // 1) roundtrip of random recipes
  let rt = 0, N = 300;
  for (let i = 0; i < N; i++) {
    const c = T.cNew(); c.n = 1 + Math.floor(rnd() * 60); c.d = Math.floor(rnd() * 3); c.th = Math.floor(rnd() * 4); c.s = Math.floor(rnd() * 100);
    const k = 1 + Math.floor(rnd() * 16);
    for (let j = 0; j < k; j++) { const f = Math.floor(rnd() * T.CF.length); c.seq.push([f, Math.floor(rnd() * (T.CF[f].vs.length + 1))]) }
    if (!T.cTraps(c)) continue;
    const code = T.encodeCustom(c), r = T.decodeCustom('hey look: ' + code + ' bye');
    if (r.c && JSON.stringify([r.c.n, r.c.d, r.c.th, r.c.s, r.c.seq]) === JSON.stringify([c.n, c.d, c.th, c.s, c.seq])) rt++;
  }
  ok('roundtrip of random recipes', rt > N * .9, rt + '/' + N);
  // 2) a single changed character is rejected (checksum), garbage is rejected
  const c0 = T.cNew(); c0.seq = [[0, 1], [1, 1], [5, 2]]; const code0 = T.encodeCustom(c0);
  let rej = 0, tried = 0, wrong = 0; const body = code0.slice(4), key = c => JSON.stringify([c.n, c.d, c.th, c.s, c.seq]);
  for (let i = 0; i < body.length; i++) { const ch = body[i] === 'A' ? 'B' : 'A'; const bad = code0.slice(0, 4) + body.slice(0, i) + ch + body.slice(i + 1); tried++; const r = T.decodeCustom(bad); if (r.err) rej++; else if (key(r.c) !== key(c0)) wrong++ }
  ok('a 1-character typo is rejected or harmless (never a different map)', wrong === 0, rej + ' rejected, ' + (tried - rej - wrong) + ' identical, ' + wrong + ' WRONG of ' + tried);
  ok('garbage rejected', !!T.decodeCustom('hello').err && !!T.decodeCustom('HB1-').err && !!T.decodeCustom('').err);
  ok('code is short', code0.length <= 40, code0.length + ' chars: ' + code0);
  const long = T.cNew(); for (let i = 0; i < 16; i++) long.seq.push([i % 8, 0]); ok('16-item code length', T.encodeCustom(long).length <= 60, T.encodeCustom(long).length);
  // 3) newer generator version is refused politely
  const u = atob(code0.slice(4).replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - code0.slice(4).length % 4) % 4)).split('').map(x => x.charCodeAt(0)); u[0] = 99;
  // recompute checksum like cSum
  let h = 2166136261 >>> 0; for (let i = 0; i < u.length - 2; i++) { h ^= u[i]; h = Math.imul(h, 16777619) >>> 0 } h &= 0xffff; u[u.length - 2] = h >> 8; u[u.length - 1] = h & 255;
  const fut = 'HB1-' + btoa(String.fromCharCode.apply(null, u)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const fr = T.decodeCustom(fut); ok('newer-version code refused', !!fr.err && /أحدث/.test(fr.err), fr.err);
  return out;
}
"""

BUILD = r"""
() => {
  const T = window.TD, out = [], bad = [];
  T.sim(true);
  let n = 0;
  for (let f = 0; f < T.CF.length; f++) {
    const F = T.CF[f], vs = F.vs.length ? F.vs.map((v, i) => [i + 1, v[2]]) : [[0, F.mn]];
    for (const [v, mn] of vs) for (const pw of [mn, Math.max(mn, 20)]) for (const d of [0, 2]) {
      const c = T.cNew(); c.n = pw; c.d = d; c.th = (f + v) % 4; c.seq = [[0, 1], [f, v], [1, 1]];
      try {
        const L = T.buildCustom(c); n++;
        const bad1 = [];
        if ((L.segs || []).length < c.seq.length) bad1.push('segs ' + (L.segs || []).length + '/' + c.seq.length);
        if (!(L.w > 20 && L.w < 700)) bad1.push('w=' + L.w);
        if (L.exitTx >= L.w) bad1.push('exit');
        if (JSON.stringify(L).includes('null,') && /NaN|Infinity/.test(JSON.stringify(L.ents))) bad1.push('NaN');
        if (L.chase) bad1.push('chase');
        if (bad1.length) bad.push(F.f + ':' + v + '@' + pw + '/d' + d + ' ' + bad1.join(','));
      } catch (e) { bad.push(F.f + ':' + v + '@' + pw + ' THROW ' + e.message) }
    }
  }
  out.push(['every family/variant builds (pit+X+spike, 2 powers, 2 difficulties)', bad.length === 0, n + ' builds' + (bad.length ? ' | ' + bad.slice(0, 6).join(' ; ') : '')]);
  // full 16-item mixed recipe
  const c = T.cNew(); c.n = 14; c.d = 1; for (let i = 0; i < 16; i++) { const f = i % 8; c.seq.push([f, 0]) }
  const L = T.buildCustom(c); out.push(['16-item recipe is fully placed', (L.segs || []).length === 16, (L.segs || []).length + ' segs, w=' + L.w]);
  // low power with a high family must not crash (codes can carry any power)
  let thrown = '';
  try { const c2 = T.cNew(); c2.n = 1; c2.seq = [[17, 0], [18, 0], [16, 0], [8, 0], [0, 8]]; T.buildCustom(c2) } catch (e) { thrown = e.message }
  out.push(['power 1 + late-game traps does not throw', !thrown, thrown]);
  return out;
}
"""

GOLD = r"""
() => {
  const T = window.TD; T.sim(true);
  const c = T.cNew(); c.n = 9; c.d = 1; c.th = 2; c.s = 7; c.seq = [[0, 2], [1, 3], [18, 0], [5, 4], [3, 2], [2, 0], [6, 1], [10, 0], [4, 3]];
  const L = T.buildCustom(c);
  const s = JSON.stringify({w: L.w, ground: L.ground, cr: L.cr, blocks: L.blocks, ents: L.ents, zones: L.zones, signs: L.signs.map(x => [x.tx, x.text]), exit: L.exitTx, theme: L.theme, segs: L.segs});
  let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0 }
  const L2 = T.buildCustom(c); const s2 = JSON.stringify({w: L2.w, ground: L2.ground, cr: L2.cr, blocks: L2.blocks, ents: L2.ents, zones: L2.zones, signs: L2.signs.map(x => [x.tx, x.text]), exit: L2.exitTx, theme: L2.theme, segs: L2.segs});
  return {hash: h, len: s.length, same: s === s2, code: T.encodeCustom(c)};
}
"""

# random-macro search (same idea as test/solver.py) that returns the exact input recording of a winning run
SOLVE = r"""
([c, maxSteps, seed]) => {
  const T = window.TD, G = T.G, K = T.K; T.sim(true);
  let rs = seed >>> 0; const rnd = () => { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 4294967296 }; const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  G.lastLvl = -9; G.cpX = null; T.loadLevel(c.n, false, {custom: c}); G.state = 'play';
  const path = [{s: T.snap(), inp: []}], fails = [0];
  for (let step = 0; step < maxSteps; step++) {
    const top = path.length - 1; T.restore(path[top].s);
    const r = rnd(); let m;
    if (r < .2) m = {k: 'run', len: ri(3, 26)};
    else if (r < .5) m = {k: 'jump', hold: rnd() < .5 ? 99 : ri(3, 42), len: ri(20, 60)};
    else if (r < .75) m = {k: 'jdj', hold: rnd() < .5 ? 99 : ri(6, 40), d: ri(8, 48), hold2: rnd() < .5 ? 99 : ri(4, 30), len: ri(40, 100)};
    else if (r < .85) m = {k: 'stop', len: ri(5, 40)};
    else if (r < .9) m = {k: 'back', len: ri(4, 26)};
    else m = {k: 'dj', hold: rnd() < .5 ? 99 : ri(4, 30), len: ri(20, 60)};
    const inp = []; let dead = false, won = false;
    for (let f = 0; f < m.len; f++) {
      let l = 0, rr = 0, j = 0, jp = 0;
      if (m.k === 'run') rr = 1;
      else if (m.k === 'jump') { rr = 1; if (f === 0) jp = 1; j = f < m.hold ? 1 : 0 }
      else if (m.k === 'jdj') { rr = 1; if (f === 0) jp = 1; if (f === m.d) jp = 1; j = (f < m.hold || (f >= m.d && f < m.d + m.hold2)) ? 1 : 0 }
      else if (m.k === 'back') l = 1;
      else if (m.k === 'dj') { rr = 1; if (f === 0) jp = 1; j = f < m.hold ? 1 : 0 }
      K.l = !!l; K.r = !!rr; K.j = !!j; K.jp = !!jp; inp.push(l | (rr << 1) | (j << 2) | (jp << 3));
      T.update(1 / 60);
      if (G.state === 'dead') { dead = true; break } if (G.state === 'win') { won = true; break }
    }
    if (won) { const all = []; for (const p of path) all.push(...p.inp); all.push(...inp); return {rec: all, steps: step} }
    if (!dead) { path.push({s: T.snap(), inp}); fails.push(0) }
    else { fails[top]++; if (fails[top] > 60 && path.length > 1) { path.pop(); fails.pop() } }
  }
  return null;
}
"""

FLOW = r"""
([c, rec]) => {
  const T = window.TD, G = T.G, K = T.K, S = T.S, out = [];
  const ok = (name, cond, extra) => out.push([name, !!cond, extra === undefined ? '' : String(extra)]);
  T.sim(false);
  const best0 = S.best, deaths0 = S.deaths;
  // seed the editor draft and open it
  T.ED.c = T.cClone(c); T.edOpen(T.ED.c, '');
  const code = T.encodeCustom(c);
  ok('editor open', G.state === 'editor' && !document.getElementById('ed').classList.contains('hide'));
  ok('share locked before a clear', document.getElementById('edCopy').disabled === true, document.getElementById('edCopy').textContent);
  // play it
  document.getElementById('edPlay').click();
  ok('custom play started', G.state === 'play' && G.custom && T.encodeCustom(G.custom) === code && document.getElementById('hLvl').textContent.includes('خريطتي'), G.state);
  document.getElementById('bMenu').click();      // pause menu shows the back-to-editor button
  const menuBtn = !document.getElementById('bEdit').classList.contains('hide'); document.getElementById('bResume').click();
  ok('pause menu offers back-to-editor', menuBtn);
  // a death in custom mode: real death counter untouched, local log written
  T.die('spike', null); ok('custom death does not touch saved deaths', S.deaths === deaths0, S.deaths + ' vs ' + deaths0);
  ok('death was logged locally', !!T.DLOG[code] && T.DLOG[code].n >= 1, JSON.stringify(T.DLOG[code]));
  T.retry();
  // play the winning inputs through the real update path
  let f = 0; for (; f < rec.length && G.state === 'play'; f++) { const b = rec[f]; K.l = !!(b & 1); K.r = !!(b & 2); K.j = !!(b & 4); K.jp = !!(b & 8); T.update(1 / 60) }
  K.l = K.r = K.j = K.jp = false;
  ok('recorded run wins in the live game', G.state === 'win', G.state + ' @frame ' + f + '/' + rec.length);
  // the live recorder captured the same inputs
  const live = T.INREC; let same = live.length >= f; for (let i = 0; i < f && same; i++) if (live[i] !== rec[i]) same = false;
  ok('live input recording equals the winning inputs', same, live.length + ' vs ' + f);
  for (let i = 0; i < 60 * 8 && G.state === 'win'; i++) T.update(1 / 60);
  ok('after the win the editor reopens', G.state === 'editor', G.state);
  const cl = T.MP.cleared[code];
  ok('clear stored with proof', !!cl && cl.t > 0 && cl.p.length > 0, cl && ('t=' + cl.t + ' frames=' + cl.f));
  ok('share unlocked after clearing', document.getElementById('edCopy').disabled === false && /✅/.test(document.getElementById('edSt').textContent), document.getElementById('edSt').textContent);
  // the stored proof replays to a win (what a server would do)
  const rr = T.replayCustom(T.cClone(c), T.rleDec(cl.p)); ok('stored proof replays to a win', rr.won, JSON.stringify(rr));
  // real progress untouched
  ok('saved best level untouched', S.best === best0, S.best + ' vs ' + best0);
  ok('saved deaths untouched', S.deaths === deaths0);
  // a code a friend pasted (whole message) plays directly and leaves the draft alone
  const msg = '🛠 خريطتي بلعبة... أنا خلّصتها بـ 12 ثانية\nالكود: ' + code + '\n(باللعبة: ...)\nhttps://x.y/';
  T.edOpen(null, '', {imp: true}); document.getElementById('edIn').value = msg;
  const draftBefore = JSON.stringify(T.MP.draft); document.getElementById('edGo').click();
  ok('pasted message plays directly', G.state === 'play' && G.custom && T.encodeCustom(G.custom) === code, G.state);
  ok('draft untouched by receiver path', JSON.stringify(T.MP.draft) === draftBefore);
  // leaving to the real game resets checkpoint state
  document.getElementById('bMenu').click(); document.getElementById('bHome').click();
  ok('home leaves custom mode screen', G.state === 'title');
  T.startGame(3); ok('real game after custom: level 3, no custom flag', G.level === 3 && !G.custom && G.cpX == null, G.level + ' ' + G.custom);
  return out;
}
"""

def report(rows, tag):
    bad = 0
    for name, good, extra in rows:
        print(('  ok  ' if good else '  FAIL') + ' ' + name + (('  [' + extra + ']') if extra else ''))
        bad += 0 if good else 1
    return bad

def main():
    bad = 0
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        pg = b.new_page(viewport={'width': 1000, 'height': 600}); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append('C:' + m.text) if m.type == 'error' else None)
        pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(500)
        print('codec'); bad += report(pg.evaluate(CODEC), 'codec')
        print('build'); bad += report(pg.evaluate(BUILD), 'build')
        g = pg.evaluate(GOLD); print('golden', g)
        gh = int(os.environ.get('GOLDEN_HASH', '1992253929')) or None   # pinned: a recipe must keep building the same world (bump GENV + re-pin only on purpose)
        bad += report([['same recipe builds the same world twice', g['same'], '']], 'g')
        if gh is not None: bad += report([['golden recipe still builds the pinned world', g['hash'] == gh, f"{g['hash']} vs pinned {gh}"]], 'g')
        else: print('  (no GOLDEN_HASH given: pin', g['hash'], ')')
        # a modest recipe the search can solve
        c = {'n': 4, 'd': 0, 'th': 1, 's': 0, 'seq': [[0, 1], [1, 1], [18, 0], [0, 1], [1, 1]]}
        sol = None
        for sd in range(1, 6):
            sol = pg.evaluate(SOLVE, [c, 3500, sd])
            if sol: break
        if not sol:
            print('  FAIL solver could not clear the test recipe'); bad += 1
        else:
            print('flow (solver found a winning run of', len(sol['rec']), 'frames in', sol['steps'], 'steps)')
            pg.reload(); pg.wait_for_timeout(500)
            bad += report(pg.evaluate(FLOW, [c, sol['rec']]), 'flow')
            if SHOTS:
                os.makedirs(SHOTS, exist_ok=True)
                pg.evaluate("TD.sim(false);TD.ED.c=TD.cClone(" + json.dumps(c) + ");TD.edOpen(TD.ED.c,'🏆 خلّصتها')")
                pg.locator('#stage').screenshot(path=f'{SHOTS}/editor_cleared.png')
        if errs: print('page errors:', errs[:4]); bad += 1
        b.close()
    print('RESULT:', 'ALL OK' if not bad else f'{bad} problem(s)')
    sys.exit(1 if bad else 0)

main()
