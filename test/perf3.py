from playwright.sync_api import sync_playwright
import sys
lv=int(sys.argv[1]) if len(sys.argv)>1 else 20
with sync_playwright() as p:
    b=p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg=b.new_page(viewport={'width':844,'height':390},device_scale_factor=2); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(500)
    pg.evaluate("(lv)=>{TD.S.qm='3';TD.startGame(lv);TD.G.bannerT=0}",lv); pg.wait_for_timeout(600)
    for q in (3,2,1,0):
        r=pg.evaluate("(q)=>{TD.setQ(q);for(let i=0;i<20;i++)TD.render();const t=performance.now();for(let i=0;i<200;i++)TD.render();return (performance.now()-t)/200}",q)
        print('Q',q,round(r,2),'ms/frame (software canvas, DPR2 844x390)')
    print(errs)
    b.close()
