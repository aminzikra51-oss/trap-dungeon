import sys, json, collections
from playwright.sync_api import sync_playwright
URL='file:///home/claude/trap-dungeon/test/fake.html' if (len(sys.argv)>1 and sys.argv[1]=='fake') else 'file:///home/claude/trap-dungeon/trap-dungeon.html'
with sync_playwright() as p:
    b=p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg=b.new_page(viewport={'width':900,'height':520}); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m:errs.append(m.text) if m.type in('error',) else None)
    pg.goto(URL); pg.wait_for_timeout(300)
    pg.keyboard.press('Enter'); pg.wait_for_timeout(300)
    # 1) pick() distribution per kind
    r=pg.evaluate("""()=>{const out={};
      for(const kind of ['taunt','c_spike','c_pit','c_arrow','c_crush','c_boulder','c_saw','c_fakedoor','c_crumble','c_bait','streak','quick','near','win','intro','level','milestone','idle','fake','bait']){
        const seen=new Set();let play=0,n=0,nul=0;for(let i=0;i<300;i++){const x=TD.pick(kind,{});if(!x){nul++;continue}n++;seen.add(x.t);if(x.play)play++}
        out[kind]={distinct:seen.size,play,n,nul,pool:(TD.byKind[kind]||[]).length}}
      return out}""")
    for k,v in r.items(): print(f'{k:11s}',v)
    # 2) dialect filter
    d=pg.evaluate("""()=>{TD.S.dialect='ma';const ds=new Set();for(let i=0;i<200;i++){const x=TD.pick('taunt',{});ds.add(x.d)}for(let i=0;i<100;i++){const x=TD.pick('c_spike',{});ds.add(x.d)}TD.S.dialect='all';return [...ds]}""")
    print('dialect ma ->',d)
    # 3) deaths: collect captions/images/labels across all causes
    res=pg.evaluate("""async()=>{const rows=[];const causes=['spike','pit','arrow','crush','boulder','saw','fakedoor','crumble','bait'];
      let voiceCalls=0;const orig=TD.Snd.voice.bind(TD.Snd);TD.Snd.voice=(k,d)=>{voiceCalls++;return orig(k,d)};
      for(let i=0;i<54;i++){TD.loadLevel(1+(i%12),true);TD.G.state='play';TD.P.x=40+Math.random()*900;
        TD.die(causes[i%9]);for(let f=0;f<60;f++)TD.update(1/60);
        rows.push({c:causes[i%9],cap:document.getElementById('ccap').textContent,top:document.getElementById('ctop').textContent,img:document.getElementById('cimg').src.length,shown:!document.getElementById('card').classList.contains('hide')});
        await new Promise(r=>setTimeout(r,30))}
      await new Promise(r=>setTimeout(r,1200));return {rows,voiceCalls,bufs:Object.keys(TD.Snd.bufs).length}}""")
    print('voiceCalls',res['voiceCalls'],'bufs',res['bufs'],'shown all',all(x['shown'] for x in res['rows']))
    for x in res['rows'][:9]: print(x['c'],'|',x['top'],'|',x['cap'][:60])
    print('distinct captions',len({x['cap'] for x in res['rows']}),'/54')
    # 4) streak context
    s=pg.evaluate("""()=>{TD.loadLevel(3,true);TD.G.state='play';TD.G.lvDeaths=7;TD.G.t=5;TD.P.x=100;TD.G.cause='spike';const c=collections={};const m={};for(let i=0;i<200;i++){const k=TD.tauntCtx();m[k]=(m[k]||0)+1}return m}""")
    print('ctx streak',s)
    q=pg.evaluate("""()=>{TD.loadLevel(3,true);TD.G.state='play';TD.G.lvDeaths=0;TD.G.deathAt=1;TD.G.cause='pit';const m={};for(let i=0;i<200;i++){const k=TD.tauntCtx();m[k]=(m[k]||0)+1}return m}""")
    print('ctx quick',q)
    n=pg.evaluate("""()=>{TD.loadLevel(3,true);TD.G.state='play';TD.G.lvDeaths=0;TD.G.deathAt=9;TD.P.x=TD.L.exitTx*32-30;TD.G.cause='arrow';const m={};for(let i=0;i<200;i++){const k=TD.tauntCtx();m[k]=(m[k]||0)+1}return m}""")
    print('ctx near',n)
    # 5) screenshots
    pg.evaluate("""()=>{TD.loadLevel(2,true);TD.G.state='play';TD.G.lvDeaths=8;TD.G.deathAt=9;TD.P.x=300;TD.die('pit');for(let f=0;f<60;f++)TD.update(1/60)}""")
    pg.wait_for_timeout(500); pg.screenshot(path='shots/card_new1.png')
    pg.evaluate("""()=>{TD.loadLevel(5,true);TD.G.state='play';TD.P.x=TD.L.exitTx*32;for(let i=0;i<5;i++)TD.update(1/60);for(let i=0;i<60;i++)TD.update(1/60)}""")
    pg.wait_for_timeout(300); pg.screenshot(path='shots/card_win.png'); print('win state',pg.evaluate("[TD.G.state,!document.getElementById('card').classList.contains('hide')]"))
    # 6) milestone announce
    pg.evaluate("()=>{TD.loadLevel(10,true);TD.G.state='play'}"); pg.wait_for_timeout(1500); print('milestone sub:',pg.evaluate("document.getElementById('sub').textContent"))
    print('ERRORS',errs); b.close()
