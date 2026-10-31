"""Map-editor perks (decorations, troll signs, longer maps, extra checkpoint flags) -- codec, placement, world invariance, caps, shop, UI.
usage: python3 test/edperk.py [--shots DIR]"""
import json, sys, os
from playwright.sync_api import sync_playwright

SHOTS = sys.argv[sys.argv.index('--shots') + 1] if '--shots' in sys.argv else None

LOGIC = r"""
() => {
  const T = window.TD, S = T.S, out = [];
  const ok = (name, cond, extra) => out.push([name, !!cond, extra === undefined ? '' : String(extra)]);
  T.sim(true);
  const DE = T.DECO_I, SG = T.SIGN_I, CU = T.SIGN_CUSTOM;
  const base = () => { const c = T.cNew(); c.n = 9; c.d = 1; c.th = 2; c.s = 7; c.seq = [[0, 2], [1, 3], [18, 0], [5, 4], [3, 2], [2, 0], [6, 1], [10, 0], [4, 3]]; return c };
  // ---- codec ----
  const plain = base(); ok('a map without cosmetics keeps the old v1 code byte for byte', T.encodeCustom(plain) === 'HB1-AQkJBwkCDbQ2IBQ9ZCtOGQ', T.encodeCustom(plain));
  const key = c => JSON.stringify([c.n, c.d, c.th, c.s, c.seq]);
  const fancy = base(); fancy.seq.splice(2, 0, [DE, 1], [SG, CU, 'ما في شي هون يا حبيبي'], [DE, 0]); fancy.seq.push([SG, CU, 'نهاية 😈'], [SG, 3]); fancy.seq.splice(6, 0, [DE, 9]);
  const fc = T.encodeCustom(fancy), fr = T.decodeCustom('شوف: ' + fc + ' يلا');
  ok('decorations + signs + two custom texts roundtrip', fr.c && key(fr.c) === key(fancy), fc.length + ' chars');
  ok('code with text still starts HB1- and decodes through a whole pasted message', /^HB1-/.test(fc));
  ok('cosmetic-only map is refused as empty', !!T.decodeCustom(T.encodeCustom({n: 3, d: 0, th: 0, s: 0, seq: [[DE, 1], [SG, 1]]})).err);
  let wrong = 0, tried = 0, rej = 0; const body = fc.slice(4);
  for (let i = 0; i < body.length; i++) { const bad = fc.slice(0, 4) + body.slice(0, i) + (body[i] === 'A' ? 'B' : 'A') + body.slice(i + 1); tried++; const r = T.decodeCustom(bad); if (r.err) rej++; else if (key(r.c) !== key(fancy)) wrong++ }
  ok('a 1-character typo inside a code with text never becomes a different map', wrong === 0, rej + '/' + tried + ' rejected');
  ok('truncated code with text is refused', !!T.decodeCustom(fc.slice(0, fc.length - 9)).err);
  const inj = base(); inj.seq.push([SG, CU, '<img src=x onerror=alert(1)>\n\u0007  hi   there']);
  const ir = T.decodeCustom(T.encodeCustom(inj)), itx = ir.c.seq[ir.c.seq.length - 1][2];
  ok('angle brackets and control characters are stripped from sign text', !/[<>\u0000-\u001f]/.test(itx) && /hi there/.test(itx), JSON.stringify(itx));
  const long = base(); long.seq.push([SG, CU, 'ك'.repeat(80)]); const lr = T.decodeCustom(T.encodeCustom(long)), ltx = lr.c.seq[lr.c.seq.length - 1][2];
  ok('sign text is cut at 60 utf-8 bytes', new TextEncoder().encode(ltx).length <= 60 && ltx.length >= 25, ltx.length + ' chars');
  const emo = base(); emo.seq.push([SG, CU, '😈'.repeat(30)]); const er = T.decodeCustom(T.encodeCustom(emo)); ok('emoji text is cut on a whole character', er.c && !/�/.test(er.c.seq[er.c.seq.length - 1][2]) && new TextEncoder().encode(er.c.seq[er.c.seq.length - 1][2]).length <= 60);
  const emp = base(); emp.seq.push([SG, CU, '   ']); const mr = T.decodeCustom(T.encodeCustom(emp)); ok('empty sign text falls back to a default', mr.c && mr.c.seq[mr.c.seq.length - 1][2] === 'يافطة', mr.c && mr.c.seq[mr.c.seq.length - 1][2]);
  const salty = base(); salty.s = 99; salty.seq.push([SG, CU, 'x']); const sr = T.decodeCustom(T.encodeCustom(salty)); ok('salt 99 survives the trailer flag', sr.c && sr.c.s === 99, sr.c && sr.c.s);
  ok('coreCode ignores decorations and signs', T.coreCode(fancy) === T.encodeCustom(plain) && T.coreCode(fancy) === T.coreCode(plain));
  ok('wrapping long sign text gives <=3 short lines', (() => { const w = T.signWrap('هذا نص طويل جدا جدا جدا لازم ينقسم لسطور قصيرة ومرتبة'); return w.split('\n').length <= 3 && w.split('\n').every(l => l.length <= 12) })(), JSON.stringify(T.signWrap('هذا نص طويل جدا جدا جدا لازم ينقسم لسطور قصيرة ومرتبة')));

  // ---- world invariance ----
  const hashOf = L => { const s = JSON.stringify({w: L.w, ground: L.ground, cr: L.cr, blocks: L.blocks, ents: L.ents, zones: L.zones, exit: L.exitTx, theme: L.theme, segs: L.segs}); let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0 } return h };
  ok('decorating a map leaves ents/ground/blocks/zones/segs exactly the same', hashOf(T.buildCustom(plain)) === hashOf(T.buildCustom(fancy)));
  const L1 = T.buildCustom(fancy), L1b = T.buildCustom(fancy);
  ok('placement is deterministic', JSON.stringify([L1.deco, L1.signs]) === JSON.stringify([L1b.deco, L1b.signs]));
  const added = L1.signs.filter(s => s.cu); ok('custom + preset signs were placed', added.length === 3 && added.some(s => /ما في شي هون يا حبيبي/.test(s.text.replace(/\n/g, ' '))) && added.some(s => /نهاية/.test(s.text)), added.map(s => s.tx + ':' + s.text.replace(/\n/g, '|')).join(' ; '));
  ok('decorations were placed', L1.deco.length >= 2, L1.deco.length);
  // random recipes: placement safety
  let rs = 777; const rnd = () => { rs = (Math.imul(rs, 1664525) + 1013904223) >>> 0; return rs / 4294967296 };
  const real = []; T.CF.forEach((f, i) => { if (!f.cosm) real.push(i) });
  let nb = 0, bad = [], placedD = 0, wantedD = 0, placedS = 0, wantedS = 0, diffPhys = 0;
  for (let r = 0; r < 120; r++) {
    const c = T.cNew(); c.n = 14; c.d = r % 3; c.th = r % 5; c.s = r % 50;
    const nr = 4 + Math.floor(rnd() * 8); for (let k = 0; k < nr; k++) { const f = real[Math.floor(rnd() * real.length)]; c.seq.push([f, Math.floor(rnd() * (T.CF[f].vs.length + 1))]) }
    const c0 = T.cClone(c); const nc = 2 + Math.floor(rnd() * 8);
    for (let k = 0; k < nc; k++) { const at = Math.floor(rnd() * (c.seq.length + 1)); c.seq.splice(at, 0, rnd() < .5 ? [DE, Math.floor(rnd() * 10)] : (rnd() < .5 ? [SG, Math.floor(rnd() * 9)] : [SG, CU, 'تجربة ' + k])); }
    let L; try { L = T.buildCustom(c) } catch (e) { bad.push('THROW ' + e.message); continue } nb++;
    const L0 = T.buildCustom(c0); if (hashOf(L) !== hashOf(L0)) bad.push('world changed r=' + r);
    const gen = L0.signs.map(s => s.tx), mine = L.signs.filter(s => s.cu).map(s => s.tx), allS = mine.slice().sort((a, b) => a - b);
    wantedD += c.seq.filter(it => it[0] === DE).length; wantedS += c.seq.filter(it => it[0] === SG).length; placedD += L.deco.length; placedS += mine.length;
    const xs = L.ents.filter(e => e.t !== 'coin').map(e => e.cx !== undefined ? e.cx : (e.px !== undefined ? e.px : e.x)).filter(x => typeof x === 'number' && isFinite(x)).map(x => Math.floor(x / T.TS));
    const tiles = L.deco.map(d => d.tx).concat(mine);
    for (const t of tiles) {
      if (!(L.ground[t] === 11 && !L.cr[t] && L.ground[t - 1] >= 0 && L.ground[t + 1] >= 0)) bad.push('r' + r + ' tile ' + t + ' not plain ground');
      if (t < 5 || t > L.exitTx - 3) bad.push('r' + r + ' tile ' + t + ' near spawn/exit');
      if (xs.some(x => Math.abs(x - t) < 2)) bad.push('r' + r + ' tile ' + t + ' on an entity');
      if (Object.keys(L.blocks).some(k => Math.abs(+k.split(',')[0] - t) < 2)) bad.push('r' + r + ' tile ' + t + ' on a block');
    }
    for (let i = 1; i < allS.length; i++) if (allS[i] - allS[i - 1] < 4) bad.push('r' + r + ' signs too close');
    for (const g of gen) for (const m of mine) if (Math.abs(g - m) < 3) bad.push('r' + r + ' sign on generator sign');
    for (const d of L.deco) if (L.deco.filter(e => e !== d && Math.abs(e.tx - d.tx) < 2).length) { bad.push('r' + r + ' decos overlap'); break }
    // the same inputs give the same physics with and without decoration
    const run = LL => { T.G.lastLvl = -9; T.G.cpX = null; T.loadLevel(c.n, false, {custom: LL === L ? c : c0}); T.G.state = 'play'; let h = 0; for (let f = 0; f < 240; f++) { T.K.r = true; T.K.j = f % 50 < 20; T.K.jp = f % 50 === 0; T.update(1 / 60); if (T.G.state !== 'play') break } T.K.l = T.K.r = T.K.j = T.K.jp = false; return [T.P.x, T.P.y, T.G.state, T.G.t].join(',') };
    if (r % 6 === 0 && run(L) !== run(L0)) diffPhys++;
  }
  ok('120 random decorated recipes build, keep the world identical, and place only on plain safe ground', bad.length === 0 && nb === 120, nb + ' built | ' + bad.slice(0, 5).join(' ; '));
  ok('most requested decorations/signs find a spot', placedD >= wantedD * .8 && placedS >= wantedS * .8, 'deco ' + placedD + '/' + wantedD + ' signs ' + placedS + '/' + wantedS);
  ok('same inputs -> same player state with or without decoration', diffPhys === 0, diffPhys + ' differences');

  // ---- perks ----
  S.wallet = 0; S.ep = {len: 0, cp: 0, deco: 0, sign: 0};
  ok('free caps: 20 traps, 2 flags, no decorations, no signs', T.epCap('len') === 20 && T.epCap('cp') === 2 && T.epCap('deco') === 0 && T.epCap('sign') === 0, [T.epCap('len'), T.epCap('cp'), T.epCap('deco'), T.epCap('sign')].join('/'));
  const c20 = T.cNew(); for (let i = 0; i < 20; i++) c20.seq.push([0, 1]);
  ok('21st trap refused (names the perk)', /حد الفخاخ \(20\)/.test(T.epWhy(c20, 0, 1)) && /ترقيات/.test(T.epWhy(c20, 0, 1)), T.epWhy(c20, 0, 1));
  ok('a flag is still fine at 20 traps, the 3rd flag is not', T.epWhy(c20, CFI('cp'), 0) === '' && /حد أعلام الحفظ \(2\)/.test(T.epWhy({seq: [[CFI('cp'), 0], [CFI('cp'), 0]]}, CFI('cp'), 0)));
  function CFI(n) { return T.CF.findIndex(f => f.f === n) }
  ok('decorations and signs locked by default', /مقفلة/.test(T.epWhy(T.cNew(), DE, 1)) && /مقفلة/.test(T.epWhy(T.cNew(), SG, 1)));
  ok('buying with no coins is refused and costs nothing', T.epBuy('len') === 'poor' && S.wallet === 0 && T.epCap('len') === 20);
  S.wallet = 5000; const w0 = S.wallet;
  ok('len tier 1 -> 40 traps for 90 coins', T.epBuy('len') === 'ok' && T.epCap('len') === 40 && S.wallet === w0 - 90, T.epCap('len') + ' / ' + (w0 - S.wallet));
  ok('len tier 2 -> 80, tier 3 -> 250, then maxed', T.epBuy('len') === 'ok' && T.epCap('len') === 80 && T.epBuy('len') === 'ok' && T.epCap('len') === 250 && T.epBuy('len') === 'max' && T.epNext('len') === null);
  ok('21st trap is fine after the upgrade', T.epWhy(c20, 0, 1) === '');
  ok('flags: 2 -> 4 -> 7 -> 12', (() => { const a = [T.epCap('cp')]; for (let i = 0; i < 3; i++) { T.epBuy('cp'); a.push(T.epCap('cp')) } return a.join() === '2,4,7,12' })());
  ok('deco tier 1 unlocks 8, tier 2 24', T.epBuy('deco') === 'ok' && T.epCap('deco') === 8 && T.epBuy('deco') === 'ok' && T.epCap('deco') === 24);
  ok('signs: tier 1 = 3 preset signs, custom text still locked', T.epBuy('sign') === 'ok' && T.epCap('sign') === 3 && !T.epCustomText() && /النص الخاص/.test(T.epWhy(T.cNew(), SG, CU)) && T.epWhy(T.cNew(), SG, 1) === '');
  ok('signs tier 2 = 8 signs + custom text', T.epBuy('sign') === 'ok' && T.epCap('sign') === 8 && T.epCustomText() && T.epWhy(T.cNew(), SG, CU) === '');
  ok('sign cap enforced', /حد اليافطات \(8\)/.test(T.epWhy({seq: Array.from({length: 8}, () => [SG, 1])}, SG, 1)));
  const total = T.EPERK.reduce((a, p) => a + p.tiers.reduce((b, t) => b + t[1], 0), 0); ok('all perks together cost a sane amount', total >= 1000 && total <= 2000, total + ' coins');
  // limits bind only when adding: a shared 100-trap map still decodes / builds under free caps
  S.ep = {len: 0, cp: 0, deco: 0, sign: 0};
  const big = T.cNew(); big.n = 14; for (let i = 0; i < 100; i++) big.seq.push([i % 6, 0]);
  const br = T.decodeCustom(T.encodeCustom(big)); ok('a 100-trap shared map decodes and builds with free caps', br.c && T.buildCustom(br.c).segs.length === 100);
  return out;
}
"""

UI = r"""
async () => {
  const T = window.TD, S = T.S, G = T.G, out = [];
  const ok = (name, cond, extra) => out.push([name, !!cond, extra === undefined ? '' : String(extra)]);
  const $ = id => document.getElementById(id), wait = ms => new Promise(r => setTimeout(r, ms));
  T.sim(false); S.wallet = 0; S.ep = {len: 0, cp: 0, deco: 0, sign: 0};
  T.ED.c = T.cNew(); T.ED.c.seq = [[0, 1], [1, 1]]; T.edOpen(T.ED.c, '');
  const chips = () => [...$('edFam').querySelectorAll('.ch')];
  const fam = n => chips().find(b => b.textContent.includes(n));
  ok('decoration + sign family chips show a lock', /🔒/.test(fam('زخرفة').textContent) && /🔒/.test(fam('يافطة').textContent));
  ok('limits line shows 2/20 traps, 0/2 flags', /2\/20/.test($('edCaps').textContent) && /0\/2/.test($('edCaps').textContent), $('edCaps').textContent);
  fam('زخرفة').click(); [...$('edVar').querySelectorAll('.ch.v')].find(b => b.textContent.includes('شجرة')).click();
  ok('adding a decoration while locked is refused with a hint', /مقفلة/.test($('edMsg').textContent) && T.ED.c.seq.length === 2, $('edMsg').textContent);
  // fill to 20 and try one more through the real chips
  T.ED.c.seq = []; for (let i = 0; i < 20; i++) T.ED.c.seq.push([0, 1]); T.edOpen(T.ED.c, '');
  fam('حفرة').click(); [...$('edVar').querySelectorAll('.ch.v')][0].click();
  ok('21st trap through the UI is refused', T.ED.c.seq.length === 20 && /حد الفخاخ \(20\)/.test($('edMsg').textContent), $('edMsg').textContent);
  // open the perk shop from the editor
  $('edPerk').click(); await wait(50);
  ok('perk shop opens on its own tab', !$('shop').classList.contains('hide') && document.querySelector('#shTabs .ch.on').dataset.t === 'e');
  const cards = () => [...$('shGrid').querySelectorAll('.shc')];
  ok('four perk cards', cards().length === 4, cards().map(c => c.querySelector('.nm').textContent).join(' | '));
  const buy = i => cards()[i].querySelector('.btn');
  ok('buy button of the first card is greyed (no coins)', buy(0).classList.contains('poor'), buy(0).textContent);
  buy(0).click(); await wait(30); ok('clicking it with no coins buys nothing', T.epCap('len') === 20 && /ناقصك/.test($('shMsg').textContent), $('shMsg').textContent);
  S.wallet = 600; T.shopRender ? 0 : 0; $('shTabs').querySelector('[data-t="e"]').click(); await wait(20);
  buy(0).click(); await wait(30);
  ok('buying "longer map" via the card: cap 40, 90 coins gone, shop text updates', T.epCap('len') === 40 && S.wallet === 510 && $('shW').textContent.includes('510') && /الحد هلأ: 40/.test(cards()[0].textContent), $('shW').textContent + ' / ' + cards()[0].textContent);
  buy(2).click(); await wait(20); buy(3).click(); await wait(20); buy(3).click(); await wait(20);
  ok('bought decorations (8) and signs tier 2 (8, custom text)', T.epCap('deco') === 8 && T.epCap('sign') === 8 && T.epCustomText(), T.epCap('deco') + '/' + T.epCap('sign'));
  ok('purchases persisted in the save', JSON.parse(localStorage.getItem('td_s')).ep.sign === 2);
  $('shX').click(); await wait(30);
  ok('closing the shop returns to the editor with the new limits', G.state === 'editor' && /20\/40/.test($('edCaps').textContent) && !/🔒/.test(fam('زخرفة').textContent), $('edCaps').textContent);
  // now add a decoration, a preset sign and a custom sign through the UI
  T.ED.c.seq = [[0, 1], [1, 1], [0, 1]]; T.ED.sel = -1; T.edOpen(T.ED.c, '');
  fam('زخرفة').click(); [...$('edVar').querySelectorAll('.ch.v')].find(b => b.textContent.includes('شجرة')).click();
  fam('يافطة').click(); [...$('edVar').querySelectorAll('.ch.v')].find(b => b.textContent.includes('نص من عندك')).click();
  const tx = $('edTx'); ok('text box appears for the custom sign and has focus', !tx.classList.contains('hide') && document.activeElement === tx, tx.className);
  tx.value = 'ولا تخاف يا حبيبي'; tx.dispatchEvent(new Event('input'));
  const last = T.ED.c.seq[T.ED.c.seq.length - 1];
  ok('typing updates the item and its chip', last[2] === 'ولا تخاف يا حبيبي' && $('edSeq').querySelector('.ch.on').textContent.includes('ولا تخاف'), JSON.stringify(last) + ' | ' + $('edSeq').querySelector('.ch.on').textContent);
  ok('draft saved with the text', JSON.stringify(T.MP.draft.seq).includes('ولا تخاف يا حبيبي'));
  ok('limits line counts them', /1\/8/.test($('edCaps').textContent.split('🌳')[1] || '') || /🌳 1\/8/.test($('edCaps').textContent), $('edCaps').textContent);
  // cleared-proof survives decorating
  const core = T.coreCode(T.ED.c); T.MP.cleared[core] = {t: 9.9, f: 1, p: '', at: Date.now()}; T.edOpen(T.ED.c, ''); await wait(10);
  ok('share is unlocked for the decorated map once its world is cleared', $('edCopy').disabled === false, $('edCopy').textContent);
  fam('زخرفة').click(); [...$('edVar').querySelectorAll('.ch.v')].find(b => b.textContent.includes('قبر')).click();
  ok('adding another decoration does NOT cost the clear', $('edCopy').disabled === false);
  const nTraps = T.cTraps(T.ED.c); fam('حفرة').click(); [...$('edVar').querySelectorAll('.ch.v')][0].click();
  ok('adding a real trap DOES (new world, must clear again)', T.cTraps(T.ED.c) === nTraps + 1 && $('edCopy').disabled === true);
  // shared text carries everything and decodes back
  T.MP.cleared[T.coreCode(T.ED.c)] = {t: 8.8, f: 1, p: '', at: Date.now()}; T.edOpen(T.ED.c, '');
  const dec = T.decodeCustom(T.edShareText()); ok('share text decodes back to the same decorated map', dec.c && JSON.stringify(dec.c.seq) === JSON.stringify(T.ED.c.seq));
  // play it and render
  const errs = []; const oe = window.onerror; window.onerror = (m) => { errs.push(m) };
  T.startCustom(T.ED.c, 'edit'); await wait(50);
  ok('decorated map plays', G.state === 'play' && T.L.deco.length >= 1, G.state + ' deco=' + T.L.deco.length + ' signs=' + T.L.signs.filter(s => s.cu).length);
  for (let i = 0; i < 90; i++) { T.K.r = true; T.update(1 / 60); T.render() } T.K.r = false;
  window.onerror = oe; ok('90 frames of update+render with decorations raise nothing', errs.length === 0, errs.join(';'));
  // passing a custom sign shows its text
  const sg = T.L.signs.find(s => s.cu && /ولا تخاف/.test(s.text)); let said = '';
  if (sg) { T.G.lastLvl = -9; T.loadLevel(T.ED.c.n, false, {custom: T.ED.c}); G.state = 'play'; T.P.x = sg.tx * T.TS + 16 - T.PW / 2; T.update(1 / 60); said = document.querySelector('#sub .b') ? document.querySelector('#sub .b').textContent : '' }
  ok('walking past the custom sign speaks its text', /ولا تخاف يا حبيبي/.test(said), said);
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
            pg.evaluate("""() => { const T = window.TD; T.sim(false); T.S.wallet = 300; T.openShop('e') }""")
            pg.wait_for_timeout(200); pg.locator('#stage').screenshot(path=f'{SHOTS}/perk_shop.png')
            pg.evaluate("""() => { const T = window.TD; T.closeShop(); T.S.ep = {len: 2, cp: 1, deco: 2, sign: 2}; const c = T.cNew(); c.n = 5; c.th = 0; const D = T.DECO_I, S = T.SIGN_I;
              c.seq = [[D,1],[0,1],[D,2],[D,3],[1,1],[S,3],[D,4],[S,9,'ولا تخاف يا حبيبي'],[0,1],[D,6],[D,7],[D,8],[D,9],[2,1],[S,0]]; T.ED.c = c; T.edOpen(c, ''); }""")
            pg.wait_for_timeout(200); pg.locator('#stage').screenshot(path=f'{SHOTS}/perk_editor.png')
            for name, x in (('a', 0), ('b', 1)):
                pg.evaluate("""(x) => { const T = window.TD; T.startCustom(T.ED.c, 'edit'); T.G.cpX = null; for (let i = 0; i < 20; i++) T.update(1 / 60); T.G.camX = x; T.P.x = x + 380; for (let i = 0; i < 4; i++) T.update(1 / 60); T.render() }""", x * 600)
                pg.wait_for_timeout(150); pg.locator('#stage').screenshot(path=f'{SHOTS}/perk_play_{name}.png')
        if errs: print('page errors:', errs[:4]); bad += 1
        b.close()
    print('RESULT:', 'ALL OK' if not bad else f'{bad} problem(s)')
    sys.exit(1 if bad else 0)

main()
