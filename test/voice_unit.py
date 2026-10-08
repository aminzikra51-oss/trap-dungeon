from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required']); pg=b.new_page()
    pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(300)
    r=pg.evaluate("""async()=>{const S=TD.Snd;S.init();await new Promise(r=>setTimeout(r,200));
      const K=k=>Object.keys(TD.VO).filter(x=>TD.VO[x].k===k&&A_has(x));
      function A_has(x){return !!(document.__aud&&document.__aud[x])}
      document.__aud=null;
      const have={}; for(const k of Object.keys(TD.VO)){ const b=await S.load(k); if(b)have[k]=1 } document.__aud=have;
      const tl=K('tlaugh')[0], tk=K('taunt')[0], tk2=K('taunt')[1], id=K('idle')[0], ms=K('milestone')[0];
      const res={}; const wait=ms=>new Promise(r=>setTimeout(r,ms));
      const snap=()=>S.vlog.map(e=>e.act+':'+e.key+'@'+e.t0.toFixed(2)+'-'+e.end.toFixed(2)).join(' | ');
      S.stopVoice();S.vlog.length=0; S.voice(id,{pri:1,wait:0}); await wait(400); S.voice(tk,{pri:4}); await wait(900); res.A_idle_then_taunt=snap();
      S.stopVoice();S.vlog.length=0; S.voice(tk,{pri:4}); await wait(300); S.voice(tk2,{pri:4,wait:1.0}); await wait(600); res.B_second_taunt_dropped=snap();
      S.stopVoice();S.vlog.length=0; S.voice(tl,{pri:2,delay:.1,max:1.0,wait:0}); S.voice(tk,{pri:4,delay:1.2}); await wait(1800); res.C_reaction_then_taunt=snap();
      S.stopVoice();S.vlog.length=0; S.voice(tk,{pri:4,delay:.9}); S.voice(tl,{pri:2,delay:.1,max:1.0,wait:0}); await wait(1500); res.D_late_reaction=snap();
      S.stopVoice();S.vlog.length=0; S.voice(ms,{pri:3}); S.stopVoice(); await wait(600); res.E_stop_cancels=snap()||'(nothing played)';
      S.stopVoice();
      return res}""")
    for k,v in r.items(): print(k,'→',v)
    b.close()
