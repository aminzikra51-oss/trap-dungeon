"""Share button: native share sheet when available, clipboard copy otherwise; abort is silent; text carries deaths + best level + the canonical URL."""
import sys
from playwright.sync_api import sync_playwright
bad = 0
def chk(n, ok, extra=''):
    global bad; print(('PASS ' if ok else 'FAIL ') + n, extra); bad += (not ok)
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    ctx = b.new_context(viewport={'width': 960, 'height': 540}, permissions=['clipboard-read', 'clipboard-write'])
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(600)
    # 1) native share (title button), fresh player
    pg.evaluate("()=>{window.__sh=[];navigator.share=async d=>{window.__sh.push(d)};TD.S.deaths=0;TD.S.best=1}")
    pg.click('#bShareT'); pg.wait_for_timeout(200)
    sh = pg.evaluate('window.__sh'); chk('native share called once', len(sh) == 1, sh)
    chk('url is the canonical independent site', sh and sh[0]['url'] == 'https://aminzikra51-oss.github.io/dont-die-habibi/', sh[0]['url'] if sh else '')
    chk('fresh-player text is an invite (no death count)', sh and 'متّ' not in sh[0]['text'], sh[0]['text'] if sh else '')
    # 2) with stats
    pg.evaluate("()=>{TD.S.deaths=7;TD.S.best=5;window.__sh=[]}"); pg.click('#bShareT'); pg.wait_for_timeout(200)
    t = pg.evaluate('window.__sh[0].text'); chk('text carries deaths and best level', 'متّ 7 مرة' in t and 'للمرحلة 5' in t, t)
    # 3) abort is silent: no clipboard fallback
    pg.evaluate("()=>{navigator.share=async()=>{const e=new Error('x');e.name='AbortError';throw e};navigator.clipboard.writeText('SENTINEL')}")
    pg.click('#bShareT'); pg.wait_for_timeout(300)
    chk('AbortError does not fall back to clipboard', pg.evaluate('navigator.clipboard.readText()') == 'SENTINEL')
    # 4) no native share -> clipboard + label flash, then restored
    pg.evaluate("()=>{navigator.share=undefined}"); lab = pg.inner_text('#bShareT')
    pg.click('#bShareT'); pg.wait_for_timeout(200)
    clip = pg.evaluate('navigator.clipboard.readText()'); chk('clipboard holds text + url', 'dont-die-habibi' in clip and 'متّ 7 مرة' in clip, clip.replace('\n', ' | '))
    chk('button shows the copied hint', 'اننسخ' in pg.inner_text('#bShareT'), pg.inner_text('#bShareT'))
    pg.wait_for_timeout(2500); chk('button label restored', pg.inner_text('#bShareT') == lab, pg.inner_text('#bShareT'))
    # 5) the pause-menu button works too
    pg.evaluate("TD.startGame(1)"); pg.wait_for_timeout(300); pg.keyboard.press('p'); pg.wait_for_timeout(300)
    chk('menu is open', pg.evaluate("!document.getElementById('menu').classList.contains('hide')"))
    pg.evaluate("()=>{window.__sh=[];navigator.share=async d=>{window.__sh.push(d)}}"); pg.click('#bShare'); pg.wait_for_timeout(200)
    chk('menu share button works', pg.evaluate('window.__sh.length') == 1)
    pg.screenshot(path='shots/s_menu_share.png')
    chk('no console errors', not errs, errs[:3]); b.close()
print('RESULT:', 'ALL PASS' if not bad else f'{bad} FAIL'); sys.exit(1 if bad else 0)
