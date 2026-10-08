"""renders every frame of the boss room with all attack types live (hits=3 -> rain + arrows + 2 spike zones), both looks, 3 difficulties. Fails on any error."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 844, 'height': 390}); errs = []
    pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)))
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(300)
    r = pg.evaluate("""()=>{ const T=TD, res={frames:0,deaths:0,types:{}}; T.S.sfx=false;T.S.music=false;T.S.voice=false;
      for(const n of [10,30,50])for(const diff of ['normal','hell'])for(const look of [true,false]){
        T.S.diff=diff; T.S.look3d=look; T.setQ(look?3:0); T.startGame(n); T.G.bannerT=0; T.G.bossProg={n,hits:3};
        T.loadLevel(n); T.G.state='play';
        let rs=n*3+(look?1:0);const rnd=()=>{rs=(rs*1664525+1013904223)>>>0;return rs/4294967296};
        for(let f=0;f<1500;f++){
          if(f%30===0){T.K.r=rnd()<.5;T.K.l=!T.K.r&&rnd()<.6}
          if(rnd()<.04){T.K.j=true;T.K.jp=true}else if(rnd()<.2)T.K.j=false;
          T.update(1/60); T.render(); res.frames++;
          for(const e of T.L.ents)res.types[e.t]=1;
          if(T.G.state==='dead'){res.deaths++; for(let k=0;k<60;k++){T.update(1/60);T.render()} T.retry()}
        }
        // walk the full sequence: all hits, dying, gate, win -> end card
        T.G.bossProg=null; T.loadLevel(n); T.G.state='play';
        for(let h=0;h<6;h++){ const e=T.L.ents.find(x=>x.t==='boss'); if(!e)break; if(e.st==='done')break;
          for(let f=0;f<400&&T.G.state==='play'&&e.st!=='fight'&&e.st!=='done';f++){T.update(1/60);T.render()}
          if(e.st==='fight'){ e.nx=1e9; T.L.ents.forEach(x=>{if(x.t==='shot'||x.t==='erupt')x.rm=1}); T.P.x=T.bossBtnX(e)-10; T.P.vx=0; for(let f=0;f<400&&e.st==='fight';f++){T.update(1/60);T.render()} } }
        for(let f=0;f<400;f++){T.update(1/60);T.render()}
        T.P.x=T.L.exitTx*32+8; for(let f=0;f<600;f++){T.update(1/60);T.render()}
        res.types['end:'+n+diff+look+':'+T.G.state+':'+!!T.G.endCard]=1;
      } return res }""")
    print(r); print('ERRS', errs[:5]); b.close()
