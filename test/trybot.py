import sys, json
from playwright.sync_api import sync_playwright
JS=r"""([n,jt,script])=>{
 const T=TD,G=T.G,K=T.K;T.sim(true);T.loadLevel(n,false,script?{script:script,W:70}:undefined);G.state='play';
 let jumped=false,log=[];K.r=true;
 for(let f=0;f<60*20;f++){K.jp=false;
   const tx=T.P.x/32;
   if(!jumped&&tx>=jt&&T.P.onGround){K.jp=true;K.j=true;jumped=true}
   if(jumped&&!T.P.onGround&&T.P.vy>-100)K.j=false;
   T.update(1/60); if(f%20===0)log.push([f,Math.round(tx*10)/10,Math.round(T.P.y)]);
   if(G.state!=='play')return {state:G.state,cause:G.cause,at:tx,f,log:log.slice(-6)}
 } return {state:'timeout',at:T.P.x/32,log:log.slice(-6)}}"""
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(); pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(300)
    n=int(sys.argv[1]); jt=float(sys.argv[2]); script=json.loads(sys.argv[3]) if len(sys.argv)>3 else None
    print(json.dumps(pg.evaluate(JS,[n,jt,script])))
    b.close()
