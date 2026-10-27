"""Contact sheets of every death animation (one row per cause/variant, 5 moments each). usage: python3 test/death_shots.py  -> shots/deaths_1.png, deaths_2.png"""
import base64, io, sys
from playwright.sync_api import sync_playwright
from PIL import Image, ImageDraw
URL='file:///home/claude/trap-dungeon/trap-dungeon.html'
# (label, cause, dv, hero y override or None)
ROWS=[('spike/flip','spike',.5,None),('arrow/pin','arrow',.5,None),('ghost/xray','ghost',.5,None),('crush/squash','crush',.5,None),('boulder/bounce','boulder',.5,None),
 ('wall/flatten','wall',.5,None),('saw/pieces','saw',.5,None),('monster/launch','monster',.2,None),('monster/ko','monster',.8,None),('ball/launch','ball',.5,None),
 ('pit/flag','pit',.1,460),('pit/hat','pit',.5,460),('pit/cloud','pit',.9,460),('fire/burn','fire',.5,None),('zap','zap',.5,None),('disco','disco',.5,None),
 ('laser/slice','laser',.5,None),('train/flatten','train',.5,None),('mole/sky','mole',.5,None),('ceilspike/stick','ceilspike',.5,90)]
TIMES=[.12,.4,.8,1.4,2.2]
GRAB="""([cause,dv,py,t])=>{ if(!TD.P.dead){TD.P.x=TD.P.x;} TD.G.deadT=t; TD.G.dv=dv; TD.render(); return document.querySelector('canvas').toDataURL('image/png') }"""
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':960,'height':540}); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(400)
    sheets=[[],[]]
    for i,(lab,cause,dv,py) in enumerate(ROWS):
        pg.evaluate("n=>TD.startGame(n)",1); pg.wait_for_timeout(120)
        pg.evaluate("([cause,py])=>{TD.L.ents=[];TD.L.zones=[];TD.G.bannerT=0;TD.P.x=300;TD.P.y=(py==null?TD.GY-TD.PH:py);TD.P.vx=0;TD.P.vy=0;TD.G.camX=180;TD.die(cause,null);TD.G.camX=180}",[cause,py])
        row=Image.new('RGB',(5*400,164),(20,20,24)); d=ImageDraw.Draw(row)
        for j,t in enumerate(TIMES):
            url=pg.evaluate(GRAB,[cause,dv,py,t]); im=Image.open(io.BytesIO(base64.b64decode(url.split(',')[1]))).convert('RGB')
            sc=im.width/800; cx=int((300+10+60-180)*sc); cw=int(560*sc); ch=int(230*sc); gy=int(430*sc)
            x0=max(0,min(im.width-cw,cx-cw//2)); y1=im.height-int(8*sc) if py!=90 else ch
            y0=y1-ch if py!=90 else 0
            crop=im.crop((x0,y0,x0+cw,y0+ch)).resize((400,164))
            row.paste(crop,(j*400,0)); d.text((j*400+4,4),f'{lab} t={t}',fill=(255,255,255))
        sheets[0 if i<10 else 1].append(row)
    for k,rows in enumerate(sheets):
        W=Image.new('RGB',(2000,164*len(rows)))
        for r,row in enumerate(rows): W.paste(row,(0,r*164))
        W.save(f'shots/deaths_{k+1}.png')
    print('errs',errs[:4]); b.close()
