from playwright.sync_api import sync_playwright
from PIL import Image
with sync_playwright() as p:
    b=p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    out=[]
    for name,vw,vh in (('iphone',844,390),('pixel',915,412),('small',667,375)):
        ctx=b.new_context(viewport={'width':vw,'height':vh},device_scale_factor=2,is_mobile=True,has_touch=True)
        pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(500)
        pg.screenshot(path=f'/tmp/ph_{name}_title.png')
        pg.evaluate("()=>{TD.startGame(9);TD.G.bannerT=0}"); pg.wait_for_timeout(700)
        pg.screenshot(path=f'/tmp/ph_{name}_game.png')
        pg.evaluate("()=>{TD.G.state='play'}")
        pg.tap('#bMenu'); pg.wait_for_timeout(300); pg.screenshot(path=f'/tmp/ph_{name}_menu.png')
        print(name,'errs',errs,'Q',pg.evaluate("TD.Q.q"))
        ctx.close()
    b.close()
ims=[Image.open(f'/tmp/ph_{n}_{k}.png').convert('RGB') for n in ('iphone','pixel','small') for k in ('title','game','menu')]
w=700; ims=[i.resize((w,int(i.height*w/i.width))) for i in ims]
H=max(i.height for i in ims); s=Image.new('RGB',(w*3,H*3),'#000')
for i,im in enumerate(ims): s.paste(im,((i%3)*w,(i//3)*H))
s.save('shots/phones.png'); print(s.size)
