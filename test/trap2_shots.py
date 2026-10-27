"""Contact sheets of every new trap in action (hero runs into it; the death plays out). usage: python3 test/trap2_shots.py [type ...]  -> shots/t2_<type>.png"""
import sys
from playwright.sync_api import sync_playwright
from PIL import Image
URL='file:///home/claude/trap-dungeon/trap-dungeon.html'
FIND="""([t,v])=>{for(let n=3;n<60;n++){if(n%10===0)continue;const L=TD.buildLevel(n,{diff:'crazy'});const e=L.ents.find(e=>e.t===t&&(!v||e.v===v));if(e)return n}return 0}"""
SETUP="""([t,v,back])=>{const e=TD.L.ents.find(e=>e.t===t&&(!v||e.v===v));const ex=e.x0!==undefined?e.x0:e.x;TD.L.ents=TD.L.ents.filter(q=>q.t===t||q.t==='ceil'||(t==='plat'&&q.t==='plat')||q.t==='coin');TD.G.bannerT=0;TD.P.x=ex-back;TD.P.y=TD.GY-TD.PH;TD.G.camX=ex-back-120;TD.K.r=false;return ex}"""
JOBS={'mimic':(None,150,1500,'r'),'mole':(None,-220,3000,''),'frog':(None,230,1800,'r'),'jet':(None,150,2400,'r'),'cloud':(None,-120,3600,''),'elec':(None,100,2600,'r'),
      'beam':(None,150,2200,'r'),'train':(None,60,3200,''),'elev':('plat','elev',150,3600,'')}
want=sys.argv[1:] or list(JOBS)
with sync_playwright() as p:
    b=p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg=b.new_page(viewport={'width':960,'height':540}); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    pg.goto(URL); pg.wait_for_timeout(500)
    for k in want:
        job=JOBS[k]; t,v=(k,None) if job[0] is None else (job[0],job[1]); back,dur,keys=(job[1],job[2],job[3]) if job[0] is None else (job[2],job[3],job[4])
        n=pg.evaluate(FIND,[t,v])
        if not n: print('no level for',k); continue
        pg.evaluate("(n)=>TD.startGame(n)",n); pg.wait_for_timeout(150); pg.evaluate(SETUP,[t,v,back]); pg.wait_for_timeout(100)
        if keys: pg.keyboard.down('ArrowRight')
        frames=[]; step=dur/9
        for i in range(9):
            pg.wait_for_timeout(int(step)); fn=f'shots/_t2_{k}_{i}.png'
            fx=pg.evaluate("([t,v])=>{const e=TD.L.ents.find(e=>e.t===t&&(!v||e.v===v));const px=TD.P.x+10;if(t==='cloud')return [TD.G.camX,px];if(t==='elec')return [TD.G.camX,e.x+e.n*16];if(t==='train')return [TD.G.camX,(e.x0+e.x1)/2];if(t==='plat')return [TD.G.camX,e.x+48];return [TD.G.camX,(e.x+px)/2+8]}",[t,v])
            cx=int((fx[1]-fx[0])*1.2)
            if k=='cloud':
                x0=max(0,min(960-672,cx-336)); pg.screenshot(path=fn,clip={'x':x0,'y':60,'width':672,'height':420}); Image.open(fn).convert('RGB').resize((480,300)).save(fn)
            else:
                x0=max(0,min(960-480,cx-240)); pg.screenshot(path=fn,clip={'x':x0,'y':180,'width':480,'height':300})
            frames.append(fn)
        if keys: pg.keyboard.up('ArrowRight')
        W=Image.new('RGB',(480*3,300*3))
        for i,f in enumerate(frames): W.paste(Image.open(f).convert('RGB'),((i%3)*480,(i//3)*300))
        W.resize((1200,750)).save(f'shots/t2_{k}.png'); print('ok',k,'level',n)
    print('errs',errs[:4]); b.close()
