from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg=b.new_page(viewport={'width':1000,'height':560}); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(400)
    pg.keyboard.press('Enter'); pg.wait_for_timeout(300)
    st=lambda: pg.evaluate("[TD.G.state,Math.round(TD.P.x),Math.round(TD.P.y),TD.P.onGround]")
    print('after enter',st())
    pg.keyboard.down('ArrowRight'); pg.wait_for_timeout(600); print('run',st())
    pg.keyboard.down('Space'); pg.wait_for_timeout(150); print('jump',st()); pg.keyboard.up('Space'); pg.keyboard.up('ArrowRight'); pg.wait_for_timeout(900)
    pg.evaluate("TD.die('spike')"); pg.wait_for_timeout(1400); print('dead',pg.evaluate("[TD.G.state,TD.G.cardShown]"))
    pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(300); print('after key',pg.evaluate("[TD.G.state,Math.round(TD.P.x)]"))
    pg.click('#bMenu'); pg.wait_for_timeout(150); print('menu',pg.evaluate("TD.G.state"), pg.is_visible('#menu'))
    pg.select_option('#selDia','eg'); pg.click('.tg[data-s=voice]'); print('settings',pg.evaluate("[TD.S.dialect,TD.S.voice]"))
    pg.click('#bResume'); pg.wait_for_timeout(150); print('resumed',pg.evaluate("TD.G.state"))
    pg.evaluate("TD.S.voice=true")
    # win path
    pg.evaluate("TD.startGame(1)"); pg.evaluate("()=>{TD.P.x=(TD.L.exitTx)*32;for(let i=0;i<5;i++)TD.update(1/60)}"); print('win',pg.evaluate("TD.G.state"))
    pg.evaluate("for(let i=0;i<160;i++)TD.update(1/60)"); print('next',pg.evaluate("[TD.G.state,TD.G.level]"))
    print('ERRORS',errs); b.close()
