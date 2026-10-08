"""Death-moment QA: kill the player with each real killer entity type and save a contact sheet of the death frame."""
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw
out='/home/claude/trap-dungeon/shots/'
shots=[]
CAUSE={'spk':'spike','saw':'saw','tur':'arrow','anv':'crush','thw':'crush','pend':'saw','walk':'monster','hog':'monster','ceil':'crush','fish':'monster','ghost':'ghost','chase':'boulder','shot':'arrow','fake':'fakedoor'}
with sync_playwright() as p:
    b=p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg=b.new_page(viewport={'width':844,'height':390},device_scale_factor=1); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(500)
    pg.evaluate("()=>{TD.S.sfx=false;TD.S.music=false;TD.S.voice=false;TD.S.diff='crazy';TD.S.look3d=true;TD.setQ(3)}")
    seen=set()
    for lv in (6,10,14,19,25,31,38):
        pg.evaluate("(n)=>{TD.startGame(n);TD.G.bannerT=0;TD.G.cpX=null}",lv); pg.wait_for_timeout(200)
        types=pg.evaluate("()=>[...new Set(TD.L.ents.map(e=>e.t))]")
        for t in types:
            if t in seen or t not in CAUSE: continue
            ok=pg.evaluate("""([t,c])=>{const e=TD.L.ents.find(x=>x.t===t); if(!e)return false;
              const ex=(typeof e.x==='number')?e.x:0; TD.P.x=Math.max(64,ex-20); TD.G.state='play'; TD.P.dead=false;
              TD.G.camX=Math.max(0,TD.P.x-300);
              for(let i=0;i<30;i++){TD.update(1/60);}
              TD.die(c,e); for(let i=0;i<22;i++){TD.update(1/60);TD.render()} return true}""",[t,CAUSE[t]])
            if not ok: continue
            seen.add(t); pg.wait_for_timeout(30)
            f=out+f'dd_{t}.png'; pg.screenshot(path=f); shots.append((t,f))
    print('errs',errs, 'types',sorted(seen))
    b.close()
ims=[(t,Image.open(f).crop((120,60,720,340))) for t,f in shots]
w,h=ims[0][1].size; cols=3; rows=(len(ims)+cols-1)//cols
sh=Image.new('RGB',(w*cols,h*rows))
d=ImageDraw.Draw(sh)
for i,(t,im) in enumerate(ims): sh.paste(im,((i%cols)*w,(i//cols)*h)); d.text(((i%cols)*w+6,(i//cols)*h+6),t,fill=(255,255,0))
sh=sh.resize((sh.width*2//3,sh.height*2//3)); sh.save(out+'dd_sheet.png'); print(sh.size)
