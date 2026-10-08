from playwright.sync_api import sync_playwright
URL='file:///home/claude/trap-dungeon/trap-dungeon.html'
FIND="""(kind)=>{for(let n=1;n<60;n++){const L=TD.buildLevel(n);if(L.ents.some(e=>e.k===kind))return n}return 1}"""
SETUP="""([kind,back,warm,cam])=>{const e=TD.L.ents.find(e=>e.k===kind);const ex=(e.x0!==undefined?e.x0:e.x);TD.G.bannerT=0;TD.P.x=ex-back;TD.P.y=TD.GY-TD.PH;TD.G.camX=ex-cam;for(let i=0;i<warm;i++){TD.K.r=false;TD.update(1/60)}}"""
with sync_playwright() as p:
    b=p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg=b.new_page(viewport={'width':1000,'height':560})
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    pg.goto(URL); pg.wait_for_timeout(500)
    pg.screenshot(path='shots/01_title.png')
    pg.evaluate("TD.startGame(1)"); pg.wait_for_timeout(300)
    pg.evaluate("for(let i=0;i<20;i++)TD.update(1/60)"); pg.wait_for_timeout(100)
    pg.screenshot(path='shots/02_L1_start.png')
    n=pg.evaluate(FIND,'spike'); pg.evaluate("(n)=>TD.startGame(n)",n)
    pg.evaluate(SETUP,['spike',90,3,300]); pg.wait_for_timeout(150); pg.screenshot(path='shots/03_spike.png')
    pg.evaluate("TD.die('spike')"); pg.evaluate("for(let i=0;i<50;i++)TD.update(1/60)"); pg.wait_for_timeout(200)
    pg.screenshot(path='shots/04_death_card.png')
    for kind,back,warm,cam,name in [('anvil',70,20,300,'05_anvil'),('turret',230,170,420,'06_turret'),('boulder',0,1,0,'07_boulder'),('saw',130,20,300,'08_saw'),('fake',70,3,300,'09_fake')]:
        n=pg.evaluate(FIND,kind); pg.evaluate("(n)=>TD.startGame(n)",n)
        if kind=='boulder': pg.evaluate("""()=>{TD.G.bannerT=0;TD.P.x=700;TD.G.camX=420;for(let i=0;i<160;i++){TD.K.r=false;TD.update(1/60);if(TD.G.state!=='play')break}}""")
        else: pg.evaluate(SETUP,[kind,back,warm,cam])
        pg.wait_for_timeout(150); pg.screenshot(path=f'shots/{name}_L{n}.png')
    print('ERR',errs)
    b.close()
    b=p.chromium.launch()
    ctx=b.new_context(viewport={'width':844,'height':390},has_touch=True,is_mobile=True,device_scale_factor=2)
    pg=ctx.new_page(); pg.goto(URL); pg.wait_for_timeout(500)
    pg.tap('#bPlay'); pg.wait_for_timeout(1500)
    pg.screenshot(path='shots/10_mobile.png')
    b.close()
