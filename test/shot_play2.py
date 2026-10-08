from playwright.sync_api import sync_playwright
import sys
n=int(sys.argv[1]); x=float(sys.argv[2]); out=sys.argv[3]; w=int(sys.argv[4]) if len(sys.argv)>4 else 1000; h=int(sys.argv[5]) if len(sys.argv)>5 else 560
with sync_playwright() as p:
    b=p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg=b.new_page(viewport={'width':w,'height':h},device_scale_factor=2 if w<1000 else 1); pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(500)
    pg.evaluate("([n,x])=>{TD.startGame(n)}",[n,x]); pg.wait_for_timeout(400)
    pg.evaluate("([x])=>{TD.P.x=x*32;TD.G.cpX=x*32;TD.G.bannerT=0}",[x]); pg.wait_for_timeout(900); pg.screenshot(path=out); b.close()
