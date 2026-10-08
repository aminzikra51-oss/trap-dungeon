from playwright.sync_api import sync_playwright
from PIL import Image
import sys
out='/home/claude/trap-dungeon/shots/'
shots=[]
with sync_playwright() as p:
    b=p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg=b.new_page(viewport={'width':844,'height':390},device_scale_factor=2); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(500)
    pg.screenshot(path=out+'d_title.png')
    for cause,t in [('spike',.5),('saw',.35),('crush',.4),('pit',.4),('monster',.3)]:
        pg.evaluate("()=>{TD.startGame(5);TD.G.bannerT=0}"); pg.wait_for_timeout(300)
        pg.evaluate("([c])=>{TD.P.x=22*32;TD.P.dead=true;TD.G.state='dead';TD.G.cause=c;TD.G.deadT=0;TD.G.cardShown=true;TD.G.killer=null}",[cause]); pg.wait_for_timeout(int(t*1000))
        pg.screenshot(path=out+f'd_{cause}.png',clip={'x':200,'y':150,'width':420,'height':240}); shots.append(out+f'd_{cause}.png')
    print('errs',errs)
    b.close()
ims=[Image.open(f) for f in shots]; w,h=ims[0].size
sh=Image.new('RGB',(w*3,h*2))
for i,im in enumerate(ims): sh.paste(im,((i%3)*w,(i//3)*h))
sh.save(out+'d_sheet.png')
