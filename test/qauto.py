"""Adaptive quality: throttle the CPU and check Q steps down by itself; and unthrottled it stays up."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    ctx=b.new_context(viewport={'width':844,'height':390},device_scale_factor=2); pg=ctx.new_page(); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(400)
    cdp=ctx.new_cdp_session(pg)
    pg.evaluate("()=>{TD.S.sfx=false;TD.S.music=false;TD.S.voice=false;TD.S.qm='auto';TD.S.q=null;TD.setQ(3);TD.startGame(12);TD.G.bannerT=0}")
    pg.wait_for_timeout(3500); print('free  : Q=',pg.evaluate("TD.Q.q"),'fps~',pg.evaluate("TD.Q.fps"))
    cdp.send('Emulation.setCPUThrottlingRate',{'rate':6})
    for i in range(8):
        pg.wait_for_timeout(2500); print('slow',i,': Q=',pg.evaluate("TD.Q.q"),'fps~',pg.evaluate("TD.Q.fps"),'saved q=',pg.evaluate("TD.S.q"))
    # manual mode must not auto-change
    cdp.send('Emulation.setCPUThrottlingRate',{'rate':1})
    pg.evaluate("()=>{TD.S.qm='3';TD.setQ(3)}"); cdp.send('Emulation.setCPUThrottlingRate',{'rate':6}); pg.wait_for_timeout(6000)
    print('manual: Q=',pg.evaluate("TD.Q.q"),'(must stay 3)'); print('errs',errs); b.close()
