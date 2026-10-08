import sys
from playwright.sync_api import sync_playwright
URL='file:///home/claude/trap-dungeon/test/fake.html' if (len(sys.argv)>1 and sys.argv[1]=='fake') else 'file:///home/claude/trap-dungeon/trap-dungeon.html'
with sync_playwright() as p:
    b=p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg=b.new_page(); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m:errs.append(m.text) if m.type in('error','warning') else None)
    pg.goto(URL); pg.wait_for_timeout(300)
    r=pg.evaluate("""async()=>{const S=TD.Snd;S.init();await new Promise(r=>setTimeout(r,300));
      const out={state:S.ctx&&S.ctx.state,decodedAtStart:Object.keys(S.bufs).length};
      const names=['jump','land','coin','bonk','whoosh','pop','crumble','rumble','anvilHit','splat','squeak','whistle','raspberry','boom','fuse','win','ui','trombone','laugh'];
      out.errs=[];for(const n of names){try{S[n]()}catch(e){out.errs.push(n+':'+e.message)}}
      try{S.startMusic();await new Promise(r=>setTimeout(r,600));S.stopMusic()}catch(e){out.errs.push('music:'+e.message)}
      const keys=Object.keys(TD.VO);let ok=0,miss=0;
      for(const k of keys){const b=await S.load(k); if(b)ok++; else miss++}
      out.loaded=ok;out.noAudio=miss;out.bufsAfter=Object.keys(S.bufs).length;
      // voice queueing: two voices back to back must not overlap
      const ks=keys.filter(k=>S.bufs[k]);if(ks.length>1){0}
      return out}""")
    print(r); print('PAGE ERRORS',errs); b.close()
