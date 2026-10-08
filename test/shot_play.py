from playwright.sync_api import sync_playwright
import sys
n=int(sys.argv[1]); x=float(sys.argv[2]); out=sys.argv[3]
with sync_playwright() as p:
    b=p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg=b.new_page(viewport={'width':1000,'height':560}); pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(500)
    pg.evaluate("([n,x])=>{TD.startGame(n);TD.sim(false)}",[n,x]); pg.wait_for_timeout(400)
    pg.evaluate("([x])=>{TD.P.x=x*32;TD.G.cpX=x*32}",[n,x][1:]) 
    pg.wait_for_timeout(700); pg.screenshot(path=out); b.close()
