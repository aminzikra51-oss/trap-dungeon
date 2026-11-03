"""Co-op carry / throw (local engine path: K = player 1, K2 = player 2).  usage: python3 test/carry.py"""
import sys
from playwright.sync_api import sync_playwright
JS = r"""
() => {
  const T = window.TD, G = T.G, K = T.K, K2 = T.K2, out = []; const ok = (n, c, x) => out.push([n, !!c, x === undefined ? '' : String(x)]);
  T.sim(false); T.FLAGS.coScript = [['co', 'gate']]; T.coPuzTest('gate'); G.state = 'play';
  const A = T.PLY[0], B = T.PLY[1], step = n => { for (let i = 0; i < n; i++) T.update(1 / 60) };
  const place = (ax, bx) => { A.x = ax; B.x = bx; A.y = B.y = 352 - 28; A.vx = A.vy = B.vx = B.vy = 0; A.hold = B.hold = A.hb = B.hb = -1; A.gcd = B.gcd = 0; A.stand = B.stand = 0; step(20) };
  const gp = (k) => { k.g = true; k.gp = true; step(1); k.g = false; k.gp = false };
  place(120, 150);
  ok('setup: both standing on the ground', A.onGround && B.onGround && A.hold === -1 && B.hb === -1, A.x + ',' + B.x);
  gp(K); ok('grab: player 1 now carries player 2', A.hold === 1 && B.hb === 0);
  step(2); ok('the carried player sits on the carrier\'s head', Math.abs(B.x - A.x) < 1 && Math.abs(B.y - (A.y - 28 - 2)) < 6, B.y + ' vs ' + A.y);
  const x0 = A.x; K.r = true; step(60); K.r = false; const sp = (A.x - x0) / 1;
  ok('carrier walks slower than RUN (<= 72%)', A.x - x0 > 60 && A.x - x0 < 205 * .75 * 1.02 * 1, (A.x - x0).toFixed(1) + ' px/s');
  ok('the carried player rides along', Math.abs(B.x - A.x) < 1.5, B.x - A.x);
  K2.l = true; step(10); K2.l = false; ok('a carried player cannot walk away on his own', Math.abs(B.x - A.x) < 1.5);
  // wriggle free
  place(120, 150); gp(K); K2.j = true; K2.jp = true; step(1); K2.jp = false; K2.j = false; ok('jump straight after the grab does not free him (0.3 s lock)', B.hb === 0);
  step(20); K2.j = true; K2.jp = true; step(1); K2.jp = false; K2.j = false; ok('after the lock a jump wriggles him free', B.hb === -1 && A.hold === -1);
  // throw forward
  place(120, 150); gp(K); step(25); K.r = true; step(2); const ax = A.x; gp(K); K.r = false; ok('throw: released with forward + upward speed', B.hb === -1 && A.hold === -1 && B.vx > 250 && B.vy < -500, B.vx + ',' + B.vy);
  let maxd = 0, top = B.y; for (let i = 0; i < 90; i++) { step(1); maxd = Math.max(maxd, B.x - ax); top = Math.min(top, B.y); if (B.onGround && i > 10) break }
  ok('a forward throw carries at least 7 tiles', maxd > 224, maxd.toFixed(0) + ' px');
  ok('and it lands him on his feet, free to move', B.onGround && B.hb === -1);
  // toss straight up
  place(120, 150); gp(K); step(30); const yb = B.y; gp(K); let apex = B.y; for (let i = 0; i < 80; i++) { step(1); apex = Math.min(apex, B.y) } ok('toss without direction goes straight up (>= 4.5 tiles above the head)', yb - apex > 140, (yb - apex).toFixed(0));
  // double jump after a throw
  place(120, 150); gp(K); step(30); gp(K); step(45); const vy1 = B.vy; K2.jp = true; K2.j = true; step(1); K2.jp = false; K2.j = false; ok('the thrown player still has his double jump', B.dj === true && vy1 > 0 && B.vy < -380, vy1 + ' -> ' + B.vy);
  // far apart / airborne
  place(120, 300); gp(K); ok('no grab when the partner is far', A.hold === -1);
  place(120, 150); B.onGround = false; B.vy = -100; B.y -= 40; gp(K); ok('no grab while the partner is in the air', A.hold === -1);
  // cooldown / double press
  place(120, 150); gp(K); step(1); const h1 = A.hold; gp(K); ok('a second press right after the grab does not throw (cooldown)', h1 === 1 && A.hold === 1);
  // carrier jumps lower
  place(120, 150); gp(K); step(30); K.j = true; K.jp = true; step(1); K.jp = false; let ap2 = A.y; for (let i = 0; i < 40; i++) { step(1); ap2 = Math.min(ap2, A.y) } K.j = false; const jh = 324 - ap2;
  place(120, 150); K.j = true; K.jp = true; step(1); K.jp = false; let ap1 = A.y; for (let i = 0; i < 40; i++) { step(1); ap1 = Math.min(ap1, A.y) } K.j = false; const jf = 324 - ap1; ok('carrying lowers the jump', jh < jf - 3 && jh > 40, jh.toFixed(0) + ' < ' + jf.toFixed(0));
  // the carried one cannot block the exit: put both at the door while carried
  place(120, 150); gp(K); step(2); ok('carried player counts as standing (onGround)', B.onGround === true);
  // snapshot round trip keeps the carry state
  const sn = T.snap(); T.restore(sn); ok('snapshot keeps hold / hb', T.PLY[0].hold === 1 && T.PLY[1].hb === 0);
  return out;
}
"""
def main():
    bad = 0
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(400)
        for name, good, extra in pg.evaluate(JS):
            print(('  ok  ' if good else '  FAIL') + ' ' + name + (('  [' + extra + ']') if extra else '')); bad += 0 if good else 1
        print('PAGE ERRORS', errs[:3]); bad += len(errs); b.close()
    print('RESULT:', 'ALL OK' if not bad else f'{bad} FAILED'); sys.exit(1 if bad else 0)
main()
