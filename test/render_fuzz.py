"""render_fuzz.py — plays random inputs through many levels in every difficulty/look/quality, rendering every frame, and forces a death by each cause.
   Fails on any page error / console error."""
import sys, json
from playwright.sync_api import sync_playwright
LEVELS = [1, 2, 3, 5, 7, 9, 10, 12, 15, 18, 20, 22, 27, 30, 33, 41]
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 844, 'height': 390}); errs = []
    pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)))
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(400)
    r = pg.evaluate("""async()=>{
      const T=TD, res={frames:0,deaths:0,types:{}}; T.S.sfx=false; T.S.music=false; T.S.voice=false;
      const causes=['spike','pit','crumble','arrow','crush','boulder','saw','fakedoor','bait','monster','ball','ghost','wall'];
      for(const diff of ['normal','crazy','hell'])for(const look of [true,false])for(const q of [3,1]){
        T.S.diff=diff;T.S.look3d=look;T.setQ(q);
        for(const n of ${LV}){
          T.startGame(n); T.G.bannerT=0; T.G.cpX=null;
          let rs=n*7+q;const rnd=()=>{rs=(rs*1664525+1013904223)>>>0;return rs/4294967296};
          for(let f=0;f<420;f++){
            if(f%25===0){T.K.r=rnd()<.8;T.K.l=!T.K.r&&rnd()<.3}
            if(rnd()<.05){T.K.j=true;T.K.jp=true}else if(rnd()<.2)T.K.j=false;
            T.update(1/60); T.render(); res.frames++;
            for(const e of T.L.ents)res.types[e.t]=1;
            if(T.G.state==='dead'){res.deaths++; for(let k=0;k<70;k++){T.update(1/60);T.render()} if(T.G.cardShown)T.retry(); }
            if(T.G.state==='win'){T.nextLevel()}
          }
          // force a death by each cause with the nearest trap as killer
          if(q===3&&look){ for(const c of causes){ T.G.state='play'; if(T.P.dead)T.P.dead=false; const e=T.L.ents.find(x=>x.t!=='coin'&&x.t!=='cp')||null; T.die(c,e); for(let k=0;k<40;k++){T.update(1/60);T.render()} T.retry() } }
        }
      }
      return res}""".replace('${LV}', json.dumps(LEVELS)))
    print(json.dumps(r)); print('ERRS', errs[:8]); b.close()
    sys.exit(1 if errs else 0)
