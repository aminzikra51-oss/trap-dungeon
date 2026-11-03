"""Co-op foundation: two players, one level (local, one keyboard) -- spawn, per-player input and hero abilities, tether, shared fate, exit rule,
no rewards, determinism + snapshot round trip (what lockstep networking will rely on), lobby UI, single player untouched.
usage: python3 test/coop.py [--shots DIR]"""
import json, sys, os
from playwright.sync_api import sync_playwright

SHOTS = sys.argv[sys.argv.index('--shots') + 1] if '--shots' in sys.argv else None

LOGIC = r"""
() => {
  const T = window.TD, G = T.G, K = T.K, K2 = T.K2, S = T.S, out = [];
  const ok = (name, cond, extra) => out.push([name, !!cond, extra === undefined ? '' : String(extra)]);
  T.sim(false); S.own.cat = 1; S.own.robot = 1; S.best = Math.max(S.best, 14); S.diff = 'normal';
  const frames = (n, a, b) => { for (let i = 0; i < n; i++) { Object.assign(K, a(i)); Object.assign(K2, b(i)); T.update(1 / 60); if (G.state !== 'play') return i + 1 } return n };
  const none = () => ({l: false, r: false, j: false, jp: false, a: false, ap: false});
  const start = (lv, h) => { T.coStart({hero: h || ['falafel', 'cat'], level: lv, local: true, me: 0}); Object.assign(K, none()); Object.assign(K2, none()) };

  // ---- spawn ----
  start(3); const P0 = T.PLY;
  ok('co-op starts with two players of the chosen heroes', G.co && P0.length === 2 && P0[0].hid === 'falafel' && P0[1].hid === 'cat' && G.state === 'play', P0.map(p => p.hid + '@' + Math.round(p.x)).join(' '));
  ok('players start on different tiles, same height', P0[0].x !== P0[1].x && P0[0].y === P0[1].y);
  ok('P points at the local player', T.P === P0[0]);
  // ---- input isolation ----
  const a0 = [P0[0].x, P0[1].x];
  frames(30, () => ({r: true}), () => ({}));
  ok('K moves only player 1', T.PLY[0].x > a0[0] + 40 && T.PLY[1].x === a0[1], T.PLY.map(p => Math.round(p.x)).join(','));
  const b0 = T.PLY[0].x; frames(30, () => ({r: false}), () => ({r: true}));
  ok('K2 moves only player 2', T.PLY[1].x > a0[1] + 40 && Math.abs(T.PLY[0].x - b0) < 60, T.PLY.map(p => Math.round(p.x)).join(','));
  // ---- tether ----
  start(3); let maxGap = 0, st = ''; T.L.ents = []; T.L.pits = []; T.L.ground.fill(11); T.L.cr = {}; T.L.blocks = {};
  for (let i = 0; i < 600 && G.state === 'play'; i++) { K.r = true; K2.r = false; T.update(1 / 60); maxGap = Math.max(maxGap, Math.abs(T.PLY[0].x - T.PLY[1].x)) }
  const gapAfter = Math.abs(T.PLY[0].x - T.PLY[1].x); K.r = false;
  for (let i = 0; i < 400 && G.state === 'play'; i++) { K2.r = true; T.update(1 / 60) } K2.r = false;
  ok('the leader cannot pull away from the other player (tether 600)', maxGap <= 600.01 && maxGap > 560, 'max gap ' + Math.round(maxGap) + ' state ' + G.state);
  ok('the trailing player can catch up and then both move on', Math.abs(T.PLY[0].x - T.PLY[1].x) < 20 || T.PLY[1].x > T.PLY[0].x - 5, Math.round(T.PLY[0].x) + ',' + Math.round(T.PLY[1].x));
  // ---- per-player hero ability: the cat double-jumps higher than falafel ----
  start(3, ['falafel', 'cat']); G.cpX = null;
  { let top = [1e9, 1e9]; const y0 = T.PLY[0].y;
    for (let i = 0; i < 90; i++) { const jp = i === 2 || i === 24; K.j = i < 40; K.jp = jp; K2.j = i < 40; K2.jp = jp; T.update(1 / 60); top[0] = Math.min(top[0], T.PLY[0].y); top[1] = Math.min(top[1], T.PLY[1].y) }
    ok('each player uses his own hero ability (cat double jump is higher)', G.state === 'play' && (y0 - top[1]) > (y0 - top[0]) + 8, 'falafel ' + Math.round(y0 - top[0]) + ' cat ' + Math.round(y0 - top[1])); }
  // ---- shared fate ----
  start(3); const s0 = S.deaths, w0 = S.wallet, best0 = S.best, d0 = G.deaths;
  frames(5, () => ({}), () => ({})); T.PLY[0].y = 900; T.update(1 / 60);
  ok('one player falling kills the team (single death card)', G.state === 'dead' && G.deaths === d0 + 1, G.state + ' deaths ' + G.deaths);
  ok('both players are respawned together by retry()', (() => { T.retry(); return G.state === 'play' && T.PLY.length === 2 && !T.PLY[0].dead && !T.PLY[1].dead })());
  ok('co-op deaths never touch the saved death counter', S.deaths === s0, S.deaths + ' vs ' + s0);
  // ---- checkpoint is shared (custom map with a real flag) ----
  { const cc = T.cNew(); cc.n = 3; cc.d = 0; cc.seq = [[0, 1], [T.CF.findIndex(f => f.f === 'cp'), 0], [1, 1]];
    T.coStart({hero: ['falafel', 'cat'], level: 3, custom: cc, local: true, me: 0}); Object.assign(K, none()); Object.assign(K2, none());
    const cp = T.L.ents.find(e => e.t === 'cp' && !e.fake);
    if (!cp) ok('custom level has a checkpoint to test', false); else {
      T.PLY[0].x = cp.x + 8; T.PLY[0].y = 352 - 28; T.PLY[0].onGround = true; T.PLY[1].x = cp.x - 200; T.update(1 / 60); T.update(1 / 60);
      ok('either player touching a flag saves it for the team', G.cpX === cp.x, G.cpX + ' vs ' + cp.x);
      T.PLY[0].y = 900; T.update(1 / 60); T.retry();
      ok('after dying both respawn at that flag', Math.abs(T.PLY[0].x - Math.floor(cp.x / T.TS) * T.TS) < 1 && Math.abs(T.PLY[1].x - (Math.floor(cp.x / T.TS) + 1) * T.TS) < 1, T.PLY.map(p => Math.round(p.x)).join(',') + ' flag ' + cp.x) } }
  // ---- exit rule + no rewards ----
  start(3); G.cpX = null; { const ex = T.L.exitTx * T.TS; const wallet = S.wallet, best = S.best, cl = JSON.stringify(S.cl);
    T.PLY[0].x = ex + 20; T.PLY[1].x = ex - 200; for (const p of T.PLY) { p.y = 352 - 28; p.vy = 0 } T.update(1 / 60);
    ok('one player at the door is not enough', G.state === 'play', G.state);
    T.PLY[1].x = ex + 24; T.PLY[0].x = ex + 20 - 0; for (const p of T.PLY) { p.y = 352 - 28; p.vy = 0; p.onGround = true } T.update(1 / 60); T.update(1 / 60);
    ok('both at the door wins', G.state === 'win', G.state);
    ok('no coins / progress / medals from co-op', S.wallet === wallet && S.best === best && JSON.stringify(S.cl) === cl, S.wallet + '/' + wallet); }
  // after the win the lobby opens with the next level selected
  for (let i = 0; i < 60 * 9 && G.state === 'win'; i++) T.update(1 / 60);
  ok('after a win the lobby opens with a result message', G.state === 'co' && !document.getElementById('co').classList.contains('hide') && /خلّصتوها/.test(document.getElementById('coMsg').textContent) && G.co === null, G.state + ' ' + document.getElementById('coMsg').textContent);
  ok('lobby moved on to the next level', T.CO.sel.n === 4, T.CO.sel.n);
  // boss levels are skipped
  T.CO.sel.n = 9; T.coStep(1); ok('boss levels are skipped by the level picker (9 -> 11)', T.CO.sel.n === 11, T.CO.sel.n);

  // ---- determinism: same inputs => same world, twice ----
  const script = i => [{r: i % 90 < 70, j: i % 50 < 18, jp: i % 50 === 0, l: false}, {r: i % 110 < 80, j: i % 60 < 14, jp: i % 60 === 3, l: i % 200 > 185}];
  const run = lv => { start(lv); G.cpX = null; for (let i = 0; i < 480; i++) { const [a, b] = script(i); Object.assign(K, a); Object.assign(K2, b); T.update(1 / 60); if (G.state !== 'play') { T.retry(); G.state = 'play' } } return T.snap() };
  const A = run(4), B = run(4); ok('two runs with identical inputs end in the identical state (lockstep needs this)', A === B, A.length + ' chars');
  const A2 = run(7), B2 = run(7); ok('...on another level too', A2 === B2);
  // snapshot round trip: take the snapshot while alive, then compare live continuation with restore + same continuation, frame by frame
  { let mism = 0, frames = 0, died = 0, snapAt = 0; const hz = (lv) => {
      start(lv); G.cpX = null; let i = 0; for (; i < 600; i++) { if (G.state !== 'play') { T.retry(); G.state = 'play' } if (i >= 120 && G.state === 'play') break; const [a, b] = script(i); Object.assign(K, a); Object.assign(K2, b); T.update(1 / 60) }
      const snap = T.snap(), A = [], B = [];
      for (let k = 0; k < 120 && G.state === 'play'; k++) { const [a, b] = script(i + k); Object.assign(K, a); Object.assign(K2, b); T.update(1 / 60); A.push(T.snap()) }
      T.restore(snap); G.state = 'play';
      for (let k = 0; k < A.length && G.state === 'play'; k++) { const [a, b] = script(i + k); Object.assign(K, a); Object.assign(K2, b); T.update(1 / 60); B.push(T.snap()) }
      for (let k = 0; k < A.length; k++) { frames++; if (A[k] !== B[k]) mism++ } if (A.length < 120) died++ };
    for (const lv of [2, 3, 4, 6, 7, 9, 11, 12, 13]) hz(lv);
    ok('snapshot/restore round trip continues identically, frame by frame (rollback / resync need this)', mism === 0 && frames > 400 && T.PLY.length === 2 && T.P === T.PLY[0], mism + ' differing frames of ' + frames + ' (' + died + ' runs ended by a death)'); }
  // ---- entities aim at the nearest player ----
  start(3); T.PLY[0].x = 100; T.PLY[1].x = 500; const fake = {x: 480, t: 'x'}; T.coAim(fake); ok('an entity near player 2 talks to player 2', T.P === T.PLY[1]); T.coAim({x: 90, t: 'x'}); ok('...and one near player 1 to player 1', T.P === T.PLY[0]);
  // ---- single player untouched ----
  T.startGame(1); ok('single player after co-op: no co, one player, own hero', G.co === null && T.P && T.PLY.length === 2 && T.P.hid === undefined, String(G.co));
  { const before = T.snap(); const o = JSON.parse(before); ok('single-player snapshot has no co fields', o.pl === undefined) }
  return out;
}
"""

UI = r"""
async () => {
  const T = window.TD, G = T.G, S = T.S, K = T.K, K2 = T.K2, out = [];
  const ok = (name, cond, extra) => out.push([name, !!cond, extra === undefined ? '' : String(extra)]);
  const $ = id => document.getElementById(id), wait = ms => new Promise(r => setTimeout(r, ms));
  T.sim(false); S.own.cat = 1; S.own.uncle = 1; S.best = 12; S.hero = 'falafel';
  ok('title has a co-op button', !!$('bCoT') && $('title').contains($('bCoT')));
  $('bCoT').click(); await wait(50);
  ok('the lobby opens on the online tab (same-device play is gone from the UI)', T.NET.tab === true && $('cotabs') === null && document.querySelector('.cotabs').classList.contains('hide') && !$('coNet').classList.contains('hide') && $('coGo').classList.contains('hide'));
  $('coTabL').click(); await wait(20);          // test-only: the local engine path still exists for the bots
  ok('lobby opens (state co, overlay visible, title hidden)', G.state === 'co' && !$('co').classList.contains('hide') && $('title').classList.contains('hide'));
  ok('lobby shows level 1 and both heroes', /المرحلة 1/.test($('coLv').textContent) && $('coH1n').textContent.length > 0 && $('coH2n').textContent.length > 0, $('coLv').textContent + ' | ' + $('coH1n').textContent + ' | ' + $('coH2n').textContent);
  $('coNext').click(); $('coNext').click(); ok('+ goes to level 3', /المرحلة 3/.test($('coLv').textContent), $('coLv').textContent);
  for (let i = 0; i < 8; i++) $('coNext').click(); ok('level picker skips the boss at 10 (3 + 8 clicks = 12)', /المرحلة 12/.test($('coLv').textContent) && T.CO.sel.n === 12, T.CO.sel.n);
  $('coPrev').click(); ok('− goes back', T.CO.sel.n === 11);
  // ---- free level choice: progress does not limit co-op / race levels ----
  $('coNext').click(); $('coNext').click(); ok('level choice is free: past progress (best 12) works', T.CO.sel.n === 13 && S.best === 12, T.CO.sel.n);
  $('coNext10').click(); ok('+10 jumps ten levels', T.CO.sel.n === 23, T.CO.sel.n);
  $('coPrev10').click(); $('coPrev10').click(); ok('-10 twice (23 -> 3)', T.CO.sel.n === 3, T.CO.sel.n);
  $('coLvIn').value = '257'; $('coLvIn').dispatchEvent(new Event('change')); ok('typing a level number jumps there', T.CO.sel.n === 257 && /المرحلة 257/.test($('coLv').textContent), T.CO.sel.n);
  $('coLvIn').value = '20'; $('coLvIn').dispatchEvent(new Event('change')); ok('a boss level typed in moves to the next playable one', T.CO.sel.n === 21, T.CO.sel.n);
  $('coLvIn').value = '5000'; $('coLvIn').dispatchEvent(new Event('change')); ok('the top is 999 (hero trials start at 1001)', T.CO.sel.n === 999, T.CO.sel.n);
  $('coLvIn').value = '0'; $('coLvIn').dispatchEvent(new Event('change')); ok('0 is ignored', T.CO.sel.n === 999, T.CO.sel.n);
  ok('co-op default difficulty is impossible', T.coDf() === 'hell' && $('coH2n').parentNode.parentNode.parentNode.querySelector('[data-cdf="hell"]').classList.contains('on'));
  document.querySelector('#co [data-cdf="nightmare"]').click(); ok('difficulty chooser picks nightmare', T.CO.sel.df === 'nightmare' && T.coDf() === 'nightmare' && document.querySelector('#co [data-cdf="nightmare"]').classList.contains('on'));
  ok('the player\'s own single-player difficulty is untouched', S.diff !== 'nightmare');
  T.CO.sel.n = 11;
  const h2 = $('coH2n').textContent; $('coH2L').click(); ok('player 2 hero can be cycled among owned heroes', $('coH2n').textContent !== h2, h2 + ' -> ' + $('coH2n').textContent);
  $('coLvIn').value = '3'; $('coLvIn').dispatchEvent(new Event('change'));
  $('coGo').click(); await wait(80);
  ok('the chosen difficulty reaches the level (nightmare)', G.co && G.co.df === 'nightmare' && T.L.dk === 'nightmare', G.co && G.co.df + ' ' + T.L.dk);
  ok('start button launches co-op on the chosen level', G.state === 'play' && G.co && G.level === 3 && T.PLY.length === 2 && T.PLY[0].hid === 'falafel' && T.PLY[1].hid === T.CO.sel.h2, G.state + ' L' + G.level + ' ' + T.PLY.map(p => p.hid));
  ok('hud and overlay state are right', !$('hud').classList.contains('hide') && $('co').classList.contains('hide'));
  // keyboard: WASD for player 1, arrows for player 2
  const key = (code, down) => window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', {code, bubbles: true}));
  const x0 = T.PLY.map(p => p.x);
  key('KeyD', true); for (let i = 0; i < 40; i++) T.update(1 / 60); key('KeyD', false);
  ok('D moves player 1 only', T.PLY[0].x > x0[0] + 30 && T.PLY[1].x === x0[1], T.PLY.map(p => Math.round(p.x)).join(','));
  const x1 = T.PLY.map(p => p.x); key('ArrowRight', true); for (let i = 0; i < 40; i++) T.update(1 / 60); key('ArrowRight', false);
  ok('→ moves player 2 only', T.PLY[1].x > x1[1] + 30 && Math.abs(T.PLY[0].x - x1[0]) < 30, T.PLY.map(p => Math.round(p.x)).join(','));
  key('KeyW', true); T.update(1 / 60); key('KeyW', false); const vy0 = T.PLY[0].vy; ok('W jumps player 1', vy0 < 0 || !T.PLY[0].onGround);
  key('ArrowUp', true); T.update(1 / 60); key('ArrowUp', false); ok('↑ jumps player 2', T.PLY[1].vy < 0 || !T.PLY[1].onGround);
  // render a few frames with both players
  const errs = []; const oe = window.onerror; window.onerror = m => { errs.push(m) };
  for (let i = 0; i < 60; i++) { T.update(1 / 60); T.render() } window.onerror = oe; ok('60 frames of update+render raise nothing', errs.length === 0, errs.join(';'));
  // pause -> home -> single player works and keys are back to normal
  $('bMenu').click(); $('bHome').click(); await wait(30);
  ok('home resets co-op', G.co === null && G.state === 'title');
  T.startGame(1); ok('single-player game starts normally afterwards', G.co === null && G.state === 'play');
  const px = T.P.x; key('KeyD', true); for (let i = 0; i < 20; i++) T.update(1 / 60); key('KeyD', false); const moved1 = T.P.x - px; key('ArrowRight', true); for (let i = 0; i < 20; i++) T.update(1 / 60); key('ArrowRight', false);
  ok('single player: D and arrows both move you (old key map)', moved1 > 10 && T.P.x > px + moved1 + 5, Math.round(moved1) + ' / ' + Math.round(T.P.x - px));
  // custom map in co-op through the lobby code box
  const c = T.cNew(); c.n = 3; c.d = 0; c.seq = [[0, 1], [1, 1], [0, 1]]; const code = T.encodeCustom(c);
  T.coOpen(''); $('coTabL').click(); $('coCodeBtn').click(); $('coCode').value = 'hey ' + code + ' bye'; $('coCodeGo').click(); await wait(20);
  ok('lobby accepts a map code and shows it', /خريطة مخصّصة/.test($('coLv').textContent) && $('coPrev').disabled, $('coLv').textContent);
  $('coGo').click(); await wait(80);
  ok('co-op on a custom map: two players, custom level, no proof stored', G.state === 'play' && G.co && G.custom && T.PLY.length === 2 && !Object.keys(T.MP.cleared).length, G.state + ' ' + !!G.custom);
  $('bMenu').click(); $('bHome').click(); await wait(20);
  return out;
}
"""

def report(rows):
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
        print('logic'); bad += report(pg.evaluate(LOGIC))
        pg.reload(); pg.wait_for_timeout(500)
        print('ui'); bad += report(pg.evaluate(UI))
        if SHOTS:
            os.makedirs(SHOTS, exist_ok=True)
            pg.evaluate("() => { const T = window.TD; T.S.own.cat = 1; T.S.own.robot = 1; T.S.best = 12; T.coOpen('🎉 خلّصتوها بـ 31.2 ث وبـ 3 موتة'); T.CO.sel.h2 = 'cat'; T.coStep(1); T.coStep(1); T.coOpen('🎉 خلّصتوها بـ 31.2 ث وبـ 3 موتة') }")
            pg.wait_for_timeout(200); pg.locator('#stage').screenshot(path=f'{SHOTS}/co_lobby.png')
            pg.evaluate("""() => { const T = window.TD, G = T.G, K = T.K, K2 = T.K2; T.sim(false); T.coStart({hero: ['falafel', 'cat'], level: 5, local: true, me: 0}); G.cpX = null;
              for (let i = 0; i < 200; i++) { K.r = i % 80 < 60; K2.r = true; K.j = i % 50 < 16; K.jp = i % 50 === 0; T.update(1 / 60); if (G.state !== 'play') break } T.render() }""")
            pg.wait_for_timeout(200); pg.locator('#stage').screenshot(path=f'{SHOTS}/co_play.png')
        if errs: print('page errors:', errs[:4]); bad += 1
        b.close()
    print('RESULT:', 'ALL OK' if not bad else f'{bad} problem(s)')
    sys.exit(1 if bad else 0)

main()
