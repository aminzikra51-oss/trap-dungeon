from playwright.sync_api import sync_playwright
out='/home/claude/trap-dungeon/shots/'
with sync_playwright() as p:
    b=p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg=b.new_page(viewport={'width':844,'height':390}); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m:errs.append('C:'+m.text) if m.type=='error' else None)
    pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(600)
    pg.screenshot(path=out+'v4_title.png')
    pg.evaluate("()=>{TD.startGame&&TD.startGame(1)}"); pg.wait_for_timeout(300)
    for i,(cause,ctx) in enumerate([('spike',None),('boulder',None),('pit',None),('fakedoor','near'),('saw','streak'),('ghost','quick')]):
        pg.evaluate("([c,x])=>{TD.G.cause=c;TD.G.lvDeaths=7;TD.G.deaths=12;TD.G.level=9; const im=TD.cardImage(x||'c_'+c); TD.fillCard('test '+c,im,'نص تجريبي للكرت','any'); window.__im=im}",[cause,ctx])
        pg.wait_for_timeout(200)
        print(cause,ctx,pg.evaluate("()=>window.__im"))
        pg.screenshot(path=out+f'v4_card_{i}.png')
    print('errs',errs[:5])
    b.close()
