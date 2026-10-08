"""Hero voice lines: manifest coverage, heroSay() for every hero x event, bubble screenshots (text-only mode, no recordings yet)."""
from playwright.sync_api import sync_playwright
from PIL import Image
out='/home/claude/trap-dungeon/shots/'
with sync_playwright() as p:
    b=p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg=b.new_page(viewport={'width':844,'height':390},device_scale_factor=1); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(400)
    r=pg.evaluate("""()=>{ const res={}; TD.S.sfx=false;TD.S.music=false;
      for(const h of ['falafel','uncle','chicken','grandma','cat','donkey']){ TD.S.hero=h; res[h]={};
        for(const ev of ['pick','die','run','win','warn']){ const n=(TD.byKind['h_'+ev]||[]).filter(k=>TD.VO[k].h===h).length; const r=TD.heroSay(ev,{force:1}); res[h][ev]=[n,r&&r.t,!!(r&&r.aud)] } }
      return res}""")
    miss=[(h,e) for h,v in r.items() for e,x in v.items() if not x[0] or not x[1]]
    print('missing:',miss or 'none')
    for h,v in r.items(): print(h,{e:x[0] for e,x in v.items()},'| sample die:',v['die'][1],'| run:',v['run'][1])
    shots=[]
    for h,ev in [('falafel','pick'),('cat','run'),('uncle','die'),('chicken','win'),('grandma','warn'),('donkey','die')]:
        pg.evaluate("([h,ev])=>{TD.S.hero=h;TD.startGame(4);TD.G.bannerT=0;TD.G.state='play';for(let i=0;i<20;i++)TD.update(1/60);TD.heroSay(ev,{force:1,dur:5});if(ev==='die'){TD.die('spike',TD.L.ents.find(e=>e.t==='spk')||null)} for(let i=0;i<14;i++){TD.update(1/60)} TD.render()}",[h,ev])
        pg.wait_for_timeout(60); f=out+f'hv_{h}.png'; pg.screenshot(path=f); shots.append(f)
    print('errs',errs); b.close()
ims=[Image.open(f).crop((140,80,640,340)) for f in shots]; w,h=ims[0].size
sh=Image.new('RGB',(w*3,h*2))
for i,im in enumerate(ims): sh.paste(im,((i%3)*w,(i//3)*h))
sh.save(out+'hv_sheet.png'); print(sh.size)
