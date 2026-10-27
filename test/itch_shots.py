"""Fresh gameplay screenshots (960x540) for the store page. usage: python3 test/itch_shots.py"""
from playwright.sync_api import sync_playwright
URL='file:///home/claude/trap-dungeon/trap-dungeon.html'
FIND="""(t)=>{for(let n=1;n<45;n++){if(n%10===0)continue;const L=TD.buildLevel(n);if(L.ents.some(e=>e.t===t))return n}return 0}"""
SETUP="""([t,back,warm,cam])=>{const e=TD.L.ents.find(e=>e.t===t);const ex=(e.x0!==undefined?e.x0:e.x!==undefined?e.x:(e.tx!==undefined?e.tx*TD.TS:NaN));if(!isFinite(ex))throw new Error('no x for '+t+' '+Object.keys(e));TD.G.bannerT=0;TD.P.x=ex-back;TD.P.y=TD.GY-TD.PH;TD.G.camX=ex-cam;for(let i=0;i<warm;i++){TD.K.r=false;TD.update(1/60)}}"""
with sync_playwright() as p:
    b=p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg=b.new_page(viewport={'width':960,'height':540}); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    pg.goto(URL); pg.wait_for_timeout(500)
    print('types seen:',pg.evaluate("()=>{const s=new Set();for(let n=1;n<45;n++){if(n%10===0)continue;TD.buildLevel(n).ents.forEach(e=>s.add(e.t))}return [...s]}"))
    for t,back,warm,cam in [('spk',90,3,300),('saw',130,20,300),('tur',230,170,420),('anv',70,20,300),('fake',70,3,300),('thw',120,10,300),('ghost',160,30,300),('pend',120,10,300)]:
        n=pg.evaluate(FIND,t)
        if not n: print('no level for',t); continue
        pg.evaluate("(n)=>TD.startGame(n)",n)
        try: pg.evaluate(SETUP,[t,back,warm,cam])
        except Exception as e: print('setup fail',t,str(e)[:80]); continue
        e0=len(errs); pg.wait_for_timeout(250); pg.screenshot(path=f'shots/s_{t}.png'); print('ok',t,'L',n,'errs+',len(errs)-e0)
    pg.evaluate("()=>TD.startGame(5)"); pg.wait_for_timeout(300)
    pg.evaluate("()=>{TD.G.bannerT=0;TD.P.x=22*32;TD.P.dead=true;TD.G.state='dead';TD.G.cause='spike';TD.G.deadT=0;TD.G.cardShown=true;TD.G.killer=null}"); pg.wait_for_timeout(700)
    pg.screenshot(path='shots/s_death.png')
    print('errs',errs[:3]); b.close()
