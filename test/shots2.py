from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    for name,vp in (('phone',{'width':740,'height':360}),('desk',{'width':1100,'height':620})):
        pg=b.new_page(viewport=vp,has_touch=(name=='phone')); errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.goto('file:///home/claude/trap-dungeon/test/fake.html'); pg.wait_for_timeout(500)
        pg.screenshot(path=f'shots/title_{name}.png')
        pg.evaluate("document.getElementById('bPlay').click()"); pg.wait_for_timeout(400)
        pg.evaluate("""()=>{TD.G.state='play';TD.G.lvDeaths=3;TD.die('pit');for(let f=0;f<50;f++)TD.update(1/60);
          TD.fillCard('📈 7 محاولات وما زلنا هون','card_pit_1',TD.VO.ps_c_pit_01.t,'ps')}""")
        pg.wait_for_timeout(500); pg.screenshot(path=f'shots/card_long_{name}.png')
        print(name,errs)
    b.close()
