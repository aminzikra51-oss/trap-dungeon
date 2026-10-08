"""voice_flow.py — real-time test of the voice director: deaths in a loop, optional finger-mashing.
   Checks: (1) no two voices overlap, (2) every death with a recorded taunt actually plays it (not cut off by retry),
   (3) reactions never delay a taunt by more than ~1.4 s.   python3 test/voice_flow.py [deaths] [mash]"""
import sys, json
from playwright.sync_api import sync_playwright
N = int(sys.argv[1]) if len(sys.argv) > 1 else 16
MASH = 'mash' in sys.argv[2:]
HERO = 'hero' in sys.argv[2:]     # stand-in recordings for every hero line (no real ones yet) so the audio path is exercised
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 844, 'height': 390}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(300)
    import os
    pg.evaluate(f"window.__dia='{os.environ.get('DIA','mix')}'; window.__lv={int(os.environ.get('LV','3'))}")
    pg.evaluate("""([N,MASH,HERO])=>{
      if(HERO){ const src=Object.keys(TD.A.audio).filter(k=>/^lb_taunt|^any_tlaugh/.test(k)); let i=0; for(const k of Object.keys(TD.VO)) if(TD.VO[k].h) TD.A.audio[k]=TD.A.audio[src[(i++)%src.length]]; TD.S.hero=['falafel','uncle','chicken','grandma','cat','donkey'][N%6] }
      TD.Snd.init(); TD.S.music=false; TD.S.dialect=(window.__dia||'mix'); TD.startGame(window.__lv||3);
      window.__log=[]; window.__done=false; let deaths=0, causes=['spike','crush','saw','arrow','pit','boulder','monster','wall','fakedoor','bait','ghost','ball','crumble'];
      let wasDead=false, tdead=0;
      setInterval(()=>{
        const G=TD.G;
        if(G.state==='play'){
          if(deaths>=N){window.__done=true;return}
          if(G.t>0.5+Math.random()*1.5){ const c=causes[deaths%causes.length]; const e=TD.L.ents[0]||null;
            window.__log.push({ev:'die',c,at:TD.Snd.ctx.currentTime,lv:G.level,taunt:null}); deaths++;
            TD.die(c, c==='pit'||c==='crumble'?null:e); const last=window.__log[window.__log.length-1]; last.hasAud=!!(G.taunt&&G.taunt.x.play); last.id=G.taunt&&G.taunt.x.id; last.ctx=G.taunt&&G.taunt.ctx; tdead=0 }
        } else if(G.state==='dead' && MASH && G.cardShown){ // a finger mashing the jump button
          tdead++; if(tdead%3===0){ const ev=new KeyboardEvent('keydown',{code:'Space'}); dispatchEvent(ev) } }
      },250);
    }""", [N, MASH, HERO])
    pg.wait_for_function("window.__done===true", timeout=60000 * 6)
    pg.wait_for_timeout(1500)
    r = pg.evaluate("({log:window.__log, v:TD.Snd.vlog})")
    b.close()

V = r['v']; deaths = [x for x in r['log'] if x['ev'] == 'die']
# effective intervals
iv = []
for e in V:
    if e['act'] in ('play', 'trim', 'queue', 'cut'): iv.append(dict(k=e['key'], pri=e['pri'], s=e['t0'], e=e['end'], stopped=None))
for e in V:
    if e['act'] in ('cutoff', 'stop'):
        for i in iv:
            if i['k'] == e['key'] and abs(i['s'] - e['t0']) < .01: i['e'] = min(i['e'], e['end']); i['stopped'] = e['act']
iv.sort(key=lambda i: i['s'])
over = [(a['k'], b['k'], round(a['e'] - b['s'], 2)) for a, b in zip(iv, iv[1:]) if a['e'] - b['s'] > .12]
print('voices played:', len(iv), '| drops:', sum(1 for e in V if e['act'] == 'drop'), '| stale:', sum(1 for e in V if e['act'] == 'stale'),
      '| cutoffs:', sum(1 for e in V if e['act'] == 'cutoff'), '| stops:', sum(1 for e in V if e['act'] == 'stop'))
print('OVERLAPS:', over if over else 'none')
withA = [d for d in deaths if d.get('hasAud')]
full = 0; part = 0; miss = []
for d in withA:
    t = [i for i in iv if i['k'] == d['id'] and i['s'] >= d['at'] - .1 and i['s'] < d['at'] + 4]
    if not t: miss.append(d['id']); continue
    t = t[0]; orig = next(e for e in V if e['key'] == t['k'] and abs(e['t0'] - t['s']) < .01 and e['act'] in ('play', 'trim', 'queue', 'cut'))
    dur_full = orig['end'] - orig['t0']; heard = t['e'] - t['s']
    lat = t['s'] - d['at']
    (full if heard >= dur_full - .25 else part).__class__
    if heard >= dur_full - .25: full += 1
    else: part += 1; print('  partial', d['id'], round(heard, 1), '/', round(dur_full, 1), t['stopped'])
    if lat > 1.6: print('  late start', d['id'], round(lat, 2))
print(f'deaths {len(deaths)} | taunts with audio {len(withA)} | heard fully {full} | partial {part} | missing {len(miss)} {miss}')
print('PAGE ERRORS', errs)
