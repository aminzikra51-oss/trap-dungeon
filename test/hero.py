"""Hero abilities: every ability does what it says, only in real levels, upgrades and XP work.
usage: python3 test/hero.py"""
import sys, json
from playwright.sync_api import sync_playwright
res = []
def ok(name, cond, info=''):
    res.append(bool(cond)); print(('  ok   ' if cond else '  FAIL ') + name + (f'  [{info}]' if info != '' else ''))

FLOW = r"""() => { const T=window.TD, S=T.S, G=T.G, K=T.K, R={}; T.FLAGS.noBoss=true;
  S.best=99; S.own={falafel:1,uncle:1,chicken:1,cat:1,grandma:1,donkey:1,robot:1,mushroom:1}; S.wallet=5000; S.hs={}; S.hx={}; S.hc={}; S.ac={}; for(const a of T.ACH)S.ac[a.id]=a.T.length;
  const lvl=(hero,stage)=>{ S.hero=hero; S.hs[hero]=stage||0; G.lastLvl=-1; G.custom=null; T.startGame(30); G.bannerT=0; G.state='play'; T.L.ents=T.L.ents.filter(e=>e.t==='coin'&&!e.bait?false:true).filter(e=>['cp','coin'].includes(e.t)); T.L.zones=[]; T.L.blocks={}; T.L.cr={}; T.L.dark=null;
     for(let i=0;i<T.L.w;i++)T.L.ground[i]=11; T.P.x=300;T.P.y=T.GY-T.PH;T.P.vx=0;T.P.vy=0;T.P.onGround=true; T.P.ab=null; K.l=K.r=K.j=K.jp=K.a=K.ap=false; G.ts=1; G.cpX=null };
  const step=(n)=>{ for(let i=0;i<n&&G.state==='play';i++)T.update(1/60) };
  const press=()=>{ K.a=true; K.ap=true };
  // double jump apex height: jump, then double-jump at the top
  const apex=(hero,stage)=>{ lvl(hero,stage); let min=T.P.y; K.j=true; K.jp=true; step(1); K.jp=false; for(let i=0;i<60;i++){ step(1); if(T.P.vy>=0)break } K.j=false; K.jp=false; step(1); K.j=true; K.jp=true; step(1); K.jp=false; for(let i=0;i<160;i++){ step(1); min=Math.min(min,T.P.y); if(T.P.vy>200)break } K.j=false; return Math.round(T.GY-T.PH-min) };
  R.apex={falafel:apex('falafel',0),cat0:apex('cat',0),cat3:apex('cat',3),uncle:apex('uncle',0)};
  // glide: jump, double jump, then fall holding jump
  const fall=(hero,stage,hold)=>{ lvl(hero,stage); T.P.y=T.GY-T.PH-2500; T.P.onGround=false; T.P.air=.5; T.P.vy=0; K.j=hold; step(18); const v=T.P.vy; K.j=false; return Math.round(v) };
  R.fall={chicken_hold:fall('chicken',0,true),chicken_free:fall('chicken',0,false),falafel_hold:fall('falafel',0,true)};
  // glide stamina runs out
  lvl('chicken',0); T.P.y=T.GY-T.PH-3000; T.P.onGround=false; T.P.air=.5; T.P.vy=0; K.j=true; step(20); const f1=T.hab().fuel; step(60); R.glideEmpty=T.hab().fuel<=0; R.glideV=Math.round(T.P.vy); K.j=false;
  // robot hover: needs the double jump first
  lvl('robot',0); K.j=true; K.jp=true; step(1); K.jp=false; for(let i=0;i<60;i++){ step(1); if(T.P.vy>=0)break } K.j=false; step(1); K.j=true; K.jp=true; step(1); K.jp=false; for(let i=0;i<12;i++)step(1); let pk1=T.P.y; for(let i=0;i<40;i++){ step(1); pk1=Math.min(pk1,T.P.y) } R.hoverPeak=Math.round(T.GY-T.PH-pk1); R.hoverFuel=T.hab().fuel; K.j=false;
  lvl('falafel',0); K.j=true; K.jp=true; step(1); K.jp=false; for(let i=0;i<60;i++){ step(1); if(T.P.vy>=0)break } K.j=false; step(1); K.j=true; K.jp=true; step(1); K.jp=false; for(let i=0;i<12;i++)step(1); let pk2=T.P.y; for(let i=0;i<40;i++){ step(1); pk2=Math.min(pk2,T.P.y) } R.noHover=Math.round(T.GY-T.PH-pk2); K.j=false;
  // shield
  lvl('uncle',0); R.sh0=T.hab().ch; R.g1=T.heroGuard('spike',null); R.shAfter=T.hab().ch; R.gInv=T.heroGuard('saw',null); T.hab().inv=0; R.g2=T.heroGuard('spike',null); R.pitNo=(()=>{ lvl('uncle',0); return T.heroGuard('pit',null) })();
  lvl('uncle',2); R.shStage2=T.hab().ch; lvl('uncle',1); T.hab().ch=0; T.econCheckpoint(); R.shRegen=T.hab().ch;
  // robot immunity + non-robot not immune
  lvl('robot',0); R.robotZap=T.heroGuard('zap',null); R.robotSpike=T.heroGuard('spike',null); lvl('falafel',0); R.falafelZap=T.heroGuard('zap',null);
  // donkey dash: breaks blocks, has a cooldown
  lvl('donkey',0); T.P.face=1; for(let ty=9;ty<=10;ty++)T.L.blocks[(Math.floor(T.P.x/32)+2)+','+ty]={rev:true,bump:0,st:'b'}; const nb0=Object.keys(T.L.blocks).length; press(); const x0=T.P.x; step(1); K.a=false; R.dashV=Math.round(T.P.vx); step(14); R.dashBlocks=[nb0,Object.keys(T.L.blocks).length]; R.dashMoved=Math.round(T.P.x-x0);
  press(); step(1); K.a=false; R.dashCd=T.hab().cd>0;
  // grandma: kills an arrow in front, reveals hidden blocks
  lvl('grandma',0); T.P.face=1; T.L.ents.push({t:'shot',x:T.P.x+40,y:T.P.y+10,vx:0,vy:0,w:26,h:6,tele:0,life:9,fall:0}); T.L.blocks[(Math.floor(T.P.x/32)+2)+',9']={rev:false,bump:0}; press(); step(2); K.a=false; R.spoonShot=T.L.ents.filter(e=>e.t==='shot'&&!e.rm).length; R.spoonReveal=T.L.blocks[(Math.floor(T.P.x/32)+2)+',9'].rev; R.spoonCd=T.hab().cd>0;
  // mushroom: slow motion
  lvl('mushroom',0); const en0=T.hab().en; press(); step(1); K.a=false; R.slowTs=G.ts; step(30); R.slowDrain=en0-T.hab().en>.3; step(600); R.slowEnds=G.ts===1&&T.hab().slow===0;
  // falafel magnet: coin 40 px away is picked, 80 px away is not (stage 0), stage 3 picks 80
  const magnet=(stage,dist)=>{ lvl('falafel',stage); const c={t:'coin',x:T.P.x+10+dist,y:T.P.y+14,bait:false,fx:'anvil',got:0,ph:0}; T.L.ents.push(c); step(2); return !!c.got };
  R.mag={s0_40:magnet(0,40),s0_90:magnet(0,90),s3_80:magnet(3,80)};
  // disabled where everyone must play equal
  lvl('uncle',0); G.custom={}; R.offCustom=T.hOn(); G.custom=null; T.sim(true); R.offSim=T.hOn(); T.sim(false); R.on=T.hOn();
  // xp + upgrade
  S.hero='cat'; S.hs.cat=0; S.hx.cat=0; S.wallet=500; R.up0=T.upgradeHero('cat'); S.hx.cat=8; S.wallet=10; R.up1=T.upgradeHero('cat'); S.wallet=500; R.up2=T.upgradeHero('cat'); R.stage=S.hs.cat; R.walletAfter=S.wallet; R.up3=T.upgradeHero('cat');
  S.hx.cat=24; S.wallet=500; T.upgradeHero('cat'); S.hx.cat=60; T.upgradeHero('cat'); R.upMax=T.upgradeHero('cat'); R.stageMax=S.hs.cat;
  // xp from a first clear with this hero (once per level), and from deaths (capped)
  S.hero='falafel'; S.hx={}; S.hc={}; S.cl={}; S.nd={}; S.best=99; lvl('falafel',0); G.lvDeaths=0; T.econClear(); R.xpClear=S.hx.falafel; G.state='play'; T.econClear(); R.xpTwice=S.hx.falafel;
  lvl('falafel',0); S.hx.falafel=0; for(let i=0;i<10;i++){ G.state='play'; T.P.dead=false; T.die('spike',null); G.lvDeaths=i+1 } R.xpDeaths=S.hx.falafel;
  return R }
"""
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 960, 'height': 540}); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(500); pg.evaluate("localStorage.clear()")
    R = pg.evaluate(FLOW); print('  flow:', json.dumps(R, ensure_ascii=False))
    ok('every hero has the same base double-jump (uncle == falafel)', R['apex']['uncle'] == R['apex']['falafel'], R['apex'])
    ok('cat: second jump is higher, and grows with the stage', R['apex']['cat0'] > R['apex']['falafel'] + 8 and R['apex']['cat3'] > R['apex']['cat0'] + 15, R['apex'])
    ok('chicken: holding jump slows the fall, others do not', R['fall']['chicken_hold'] < 90 and R['fall']['chicken_free'] > 300 and R['fall']['falafel_hold'] > 300, R['fall'])
    ok('chicken: glide stamina runs out and she drops again', R['glideEmpty'] and R['glideV'] > 150, [R['glideEmpty'], R['glideV']])
    ok('robot: hovers upward after the double jump, others do not', R['hoverPeak'] > R['noHover'] + 25 and R['hoverFuel'] < .5, [R['hoverPeak'], R['noHover'], R['hoverFuel']])
    ok('uncle: shield eats one hit, then i-frames, then none left', R['sh0'] == 1 and R['g1'] and R['shAfter'] == 0 and R['gInv'] and not R['g2'], [R['sh0'], R['g1'], R['shAfter'], R['gInv'], R['g2']])
    ok('uncle: pits are never shielded, stage II+ regenerates at a checkpoint, stage III has 2', (not R['pitNo']) and R['shStage2'] == 2 and R['shRegen'] == 1, [R['pitNo'], R['shStage2'], R['shRegen']])
    ok('robot: immune to electricity only', R['robotZap'] and not R['robotSpike'] and not R['falafelZap'])
    ok('donkey: dash moves fast, breaks the blocks in front, then cools down', R['dashV'] >= 400 and R['dashBlocks'][1] < R['dashBlocks'][0] and R['dashMoved'] > 40 and R['dashCd'], [R['dashV'], R['dashBlocks'], R['dashMoved']])
    ok('grandma: spoon kills the arrow, reveals hidden blocks, cools down', R['spoonShot'] == 0 and R['spoonReveal'] and R['spoonCd'], [R['spoonShot'], R['spoonReveal']])
    ok('mushroom: slow motion starts, drains, and ends by itself', abs(R['slowTs'] - .45) < .01 and R['slowDrain'] and R['slowEnds'], [R['slowTs'], R['slowDrain'], R['slowEnds']])
    ok('falafel: magnet radius grows with the stage', R['mag']['s0_40'] and not R['mag']['s0_90'] and R['mag']['s3_80'], R['mag'])
    ok('abilities are off in custom maps and in the solver, on in real levels', (not R['offCustom']) and (not R['offSim']) and R['on'], [R['offCustom'], R['offSim'], R['on']])
    ok('upgrade needs XP and coins, then costs coins, stops at stage IV', R['up0'] == 'xp' and R['up1'] == 'poor' and R['up2'] == 'ok' and R['stage'] == 1 and R['walletAfter'] == 460 and R['upMax'] == 'max' and R['stageMax'] == 3, [R['up0'], R['up1'], R['up2'], R['walletAfter'], R['upMax']])
    ok('XP: first clear with a hero pays once; deaths teach a little (capped)', R['xpClear'] >= 2 and R['xpTwice'] == R['xpClear'] and 2.5 <= R['xpDeaths'] <= 3.5, [R['xpClear'], R['xpTwice'], R['xpDeaths']])
    ok('no page errors', not errs, errs[:3])
    b.close()
print('RESULT:', 'ALL OK' if all(res) else 'FAILURES')
sys.exit(0 if all(res) else 1)
