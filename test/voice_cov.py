"""Voice coverage per dialect setting: how often does a death pick a taunt that HAS a recording? (statistical, no audio playback)"""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg=b.new_page(viewport={'width':844,'height':390}); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(300)
    r=pg.evaluate("""()=>{ const out={}; TD.S.voice=true; TD.startGame(3); TD.G.state='play';
      const causes=['spike','pit','arrow','crush','boulder','saw','fakedoor','crumble','bait','monster','ball','ghost','wall','any'];
      for(const d of ['mix','all','lb','eg','ps','sy','gulf','iq','ma']){ TD.S.dialect=d; let n=0,a=0; const seen=new Set();
        for(let i=0;i<600;i++){ TD.G.cause=causes[i%causes.length]; TD.G.lvDeaths=i%9; TD.G.deathAt=3+(i%4); TD.P.x=64+(i%7)*500; const t=TD.chooseTaunt(); n++; if(t.x.play){a++; seen.add(t.x.id)} }
        out[d]={audioPct:Math.round(100*a/n),distinctRecorded:seen.size} }
      return out}""")
    for d,v in r.items(): print(f'{d:5s} audio {v["audioPct"]:3d}%  distinct recorded lines used: {v["distinctRecorded"]}')
    print('errs',errs); b.close()
