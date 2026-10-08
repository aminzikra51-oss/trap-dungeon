from playwright.sync_api import sync_playwright
JS=r"""
() => {
  const T=window.TD,G=T.G,K=T.K; T.sim(true);
  const out={};
  for (const gap of [4,5,6,7,8,9]) {
    T.loadLevel(1); G.state='play'; const L=T.L;
    // custom flat level: clear ents/pits then cut a pit
    L.ents=[];L.signs=[];L.cr={};L.blocks={};L.zones=[];L.pits=[];for(let i=0;i<L.w;i++)L.ground[i]=11; for(let i=0;i<gap;i++)L.ground[20+i]=-1;
    const s0=T.snap(); let best=null, cnt=0, tot=0;
    for(let d=6;d<=70;d+=2) for(let h1=40;h1<=40;h1+=1) for(let off=0;off<=30;off+=2){
      T.restore(s0); T.P.x=15*32; // run from tile 15
      K.l=false;K.r=true;K.j=false;K.jp=false; let f=0,jf=-1,dj=-1,ok=false;
      for(f=0;f<400;f++){
        K.jp=false;
        const front=T.P.x; // left edge
        if(jf<0 && front>=20*32+off-20){K.jp=true;K.j=true;jf=f}
        if(jf>=0 && f-jf===d){K.jp=true;K.j=true}
        T.update(1/60);
        if(G.state==='dead')break;
        if(T.P.x>(20+gap)*32+40&&T.P.onGround){ok=true;break}
      }
      tot++; if(ok){cnt++}
    }
    out[gap]=[cnt,tot];
  }
  return out;
}
"""
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(); pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(300)
    print(pg.evaluate(JS)); b.close()
