"""Death heatmap (end of the achievements screen): deadliest levels, one bar per 4 tiles, worst spots, cause percentages, no ghost UI left.
usage: python3 test/heat.py [--shots DIR]"""
import sys, os
from playwright.sync_api import sync_playwright
shots = sys.argv[sys.argv.index('--shots') + 1] if '--shots' in sys.argv else None
res = []
def ok(name, cond, info=''):
    res.append(bool(cond)); print(('  ok   ' if cond else '  FAIL ') + name + (f'  [{info}]' if info != '' else ''))

with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    for vp, tag in (({'width': 960, 'height': 540}, 'desk'), ({'width': 844, 'height': 390}, 'phone')):
        pg = b.new_page(viewport=vp); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(1800)
        # ---------- heatmap UI
        pg.evaluate("""() => { const T=window.TD; for(const k of Object.keys(T.DLOG))delete T.DLOG[k]; T.DLOG['2']={n:14,b:{0:1,1:2,2:7,3:1,4:0,6:3},c:{spike:9,arrow:4,pit:1}}; T.DLOG['5']={n:5,b:{3:5},c:{saw:5}}; T.DLOG['HB1-abc']={n:99,b:{0:99},c:{spike:99}};
           T.HEAT.sel=''; T.openAch() }"""); pg.wait_for_timeout(400)
        Hm = pg.evaluate("""() => ({chips:[...document.querySelectorAll('#acList .heat .acchips .ch')].map(c=>c.textContent), bars:document.querySelectorAll('#acList .hstrip i').length, spots:document.querySelector('#acList .hline')&&document.querySelector('#acList .hline').textContent, causes:[...document.querySelectorAll('#acList .hc .nm')].map(n=>n.textContent), tops:[...document.querySelectorAll('#acList .hc .num')].map(n=>n.textContent)})""")
        ok(f'{tag}: the heatmap lists the deadliest levels (custom maps excluded), draws one bar per 4 tiles and names the worst spot', Hm['chips'][0].startswith('مرحلة 2 ×14') and 'مرحلة 5 ×5' in Hm['chips'][1] and not any('HB1' in c for c in Hm['chips']) and Hm['bars'] == 10 and 'البلاطة 8–11 (7)' in Hm['spots'], Hm)
        ok(f'{tag}: causes are shown with percentages (spike 64%)', Hm['causes'][0] == 'شوك' and Hm['tops'][0] == '64%', Hm)
        if shots: pg.evaluate("document.querySelector('#acList').scrollTop=99999"); pg.screenshot(path=os.path.join(shots, f'heat_{tag}.png'))
        pg.evaluate("[...document.querySelectorAll('#acList .heat .acchips .ch')].find(b=>b.textContent.includes('مرحلة 5')).click()"); pg.wait_for_timeout(200)
        H2 = pg.evaluate("document.querySelector('#acList .hline').textContent")
        ok(f'{tag}: picking another level redraws the strip', 'البلاطة 12–15 (5)' in H2, H2)
        ok(f'{tag}: the ghost replay is gone (no engine hooks, no toggle, no stored runs)', pg.evaluate("typeof TD.GH==='undefined'&&typeof TD.GHS==='undefined'&&!document.querySelector('#acList .heat').textContent.includes('شبح')&&localStorage.getItem('td_gh')===null"))
        pg.evaluate("[...document.querySelectorAll('#acList .heat .acchips .ch')].find(b=>b.textContent.includes('مرحلة 5')).click()")
        ok(f'{tag}: no page errors', not errs, errs[:3])
        pg.close()
    b.close()
print('RESULT:', 'ALL OK' if all(res) else 'FAILURES'); sys.exit(0 if all(res) else 1)
