/* =============== HERO ABILITIES + UPGRADES ===============
   Every hero keeps the SAME running speed and base jump (so every level of the campaign stays beatable by anyone and the offline solver stays valid);
   what differs is one signature ability with limited charges / fuel / cooldown, which grows over 4 stages (I..IV).
   Abilities only exist in real levels and hero trials: never in the map editor / shared maps (everybody plays by the same rules there) and never inside the solver (SIM).
   Stage = S.hs[id]; it is bought with coins AND earned with XP (levels cleared with that hero + lessons learned from dying).
   Deterministic: nothing here uses Math.random in anything that moves the world; effects (particles, sound) are visual only. */
S.hs=S.hs||{}; S.hx=S.hx||{}; S.hc=S.hc||{}; S.hq=S.hq||{};
const STAGE_NM=['مبتدئ','متمرّس','خبير','أسطورة'], XP_NEED=[8,24,60], UP_COST=[40,100,220];
const heroStage=id=>Math.min(3,S.hs[id]|0);
const HAB={
 falafel:{ic:'🧲',nm:'المغناطيس',act:0,ds:'بيسحب العملات القريبة منّك',                          v:{mag:[34,50,68,90]},            tx:['مدى 34','مدى 50','مدى 68','مدى 90 — كل العملات إلك']},
 uncle:  {ic:'🛡',nm:'الدرع',     act:0,ds:'بيبلع ضربة بدل ما تموت (إلا الحفر والأرض اللي بتتفتّت)', v:{ch:[1,1,2,2],rg:[0,1,1,1]},     tx:['ضربة وحدة بالمرحلة','بيتجدّد عند علم الحفظ','ضربتين','ضربتين وبيتجدّد']},
 chicken:{ic:'🪶',nm:'التحويم',   act:0,ds:'امسك زر القفز وإنت نازل لتحوم',                      v:{st:[.55,.8,1.1,1.5]},           tx:['تحويم .55 ث','.8 ث','1.1 ث','1.5 ث']},
 cat:    {ic:'🐾',nm:'نطّة القطة',act:0,ds:'القفزة التانية أعلى بكتير',                           v:{j2:[1.15,1.25,1.35,1.5]},       tx:['+15%','+25%','+35%','+50%']},
 grandma:{ic:'🥄',nm:'الملعقة',   act:1,ds:'ضربة قدّامك: بتكسر السهام، بتقتل الماشيين، وبتكشف الفخاخ المخفية', v:{cd:[1.3,1.05,.85,.65],rg:[44,54,66,80],rv:[2.2,3,4,5.5]}, tx:['انتظار 1.3 ث','1.05 ث','.85 ث','.65 ث — مدى أكبر']},
 donkey: {ic:'🫏',nm:'الركلة',    act:1,ds:'اندفاعة بتكسر البلوكات وبتقتل الماشيين وبتكسر السهام',    v:{cd:[1.7,1.4,1.1,.85],len:[.2,.24,.28,.34]},  tx:['اندفاعة قصيرة','أطول','أطول وأسرع انتظار','أسطورية']},
 robot:  {ic:'🚀',nm:'الجيت',     act:0,ds:'امسك القفز بعد القفزة التانية لتعلّي، ومناعة كاملة من الكهربا', v:{st:[.5,.7,.95,1.3]},            tx:['وقود .5 ث','.7 ث','.95 ث','1.3 ث']},
 mushroom:{ic:'🍄',nm:'لحظة وعي', act:1,ds:'بطء زمن (كل شي بيتباطأ إلا إنت)، وبترى الفخاخ المخفية القريبة',    v:{en:[1.1,1.5,2,2.6],see:[120,150,180,220]}, tx:['1.1 ث','1.5 ث','2 ث','2.6 ث']},
};
const NOSHIELD=new Set(['pit','crumble']), ROBOT_IMM=new Set(['zap','laser','disco']);
const hv=(id,k)=>HAB[id].v[k][heroStage(id)];
const hOn=()=>!SIM&&!G.custom&&!(L&&L.nab)&&G.state==='play';        // abilities exist in real levels (and trials), never in editor / shared maps / solver
const actHero=()=>!!HAB[S.hero].act;

function abNew(){ const id=S.hero, A=HAB[id]; return {h:id, ch:id==='uncle'?hv(id,'ch'):0, inv:0, cd:0, t:0, dir:1, fuel:(id==='chicken'||id==='robot')?hv(id,'st'):0, en:id==='mushroom'?hv(id,'en'):0, slow:0, sw:0, rv:0, used:0, rch:0, tr:[]} }
const hab=()=>(P.ab&&P.ab.h===S.hero)?P.ab:(P.ab=abNew());
const fuelMax=()=>(S.hero==='chicken'||S.hero==='robot')?hv(S.hero,'st'):0;
const DASH_V=430, TS_SLOW=.45;

function heroPre(p,dt){                              // timers + activation. returns {dash:true} while the donkey is dashing
  const a=hab(), id=S.hero; let r=null;
  a.inv=Math.max(0,a.inv-dt); a.cd=Math.max(0,a.cd-dt); a.sw=Math.max(0,a.sw-dt); a.rv=Math.max(0,a.rv-dt);
  if(p.onGround){ a.used=0; a.fl=0; if(id==='chicken'||id==='robot')a.fuel=Math.min(fuelMax(),a.fuel+dt*3) }
  const ap=K.ap; K.ap=false;
  if(id==='donkey'){
    if(ap&&a.cd<=0&&a.t<=0&&!a.used){ a.t=hv(id,'len'); a.dir=p.face; a.cd=hv(id,'cd'); a.used=1; Snd.whoosh&&Snd.whoosh(); dayEv('ab',1) }
    if(a.t>0){ if(K.jp){a.t=0} else { a.t-=dt; p.vx=a.dir*DASH_V; p.vy*=.35; heroKick(p,a.dir,28,1); r={dash:true} } }
    if(!SIM&&a.t>0&&G.t%.03<dt)a.tr.push({x:p.x,y:p.y,t:.22}); }
  else if(id==='grandma'){
    if(ap&&a.cd<=0){ a.sw=.24; a.cd=hv(id,'cd'); a.rv=hv(id,'rv'); a.dir=p.face; Snd.whoosh&&Snd.whoosh(); dayEv('ab',1); heroSweep(p,hv(id,'rg')); }
    if(a.sw>0)heroKick(p,a.dir,hv(id,'rg'),0) }
  else if(id==='mushroom'){
    if(ap){ if(a.slow)a.slow=0; else if(a.en>.25){a.slow=1; dayEv('ab',1); Snd.tone&&Snd.tone({t:'sine',f0:520,f1:180,dur:.35,v:.18})} }
    if(a.slow){ a.en-=dt/TS_SLOW; if(a.en<=0){a.en=0;a.slow=0} } else a.en=Math.min(hv(id,'en'),a.en+dt*.32);
    G.ts=a.slow?TS_SLOW:1 }
  for(const q of a.tr)q.t-=dt; if(a.tr.length&&a.tr[0].t<=0)a.tr=a.tr.filter(q=>q.t>0);
  return r;
}
function heroKick(p,dir,reach,breakBlocks){          // the area in front of the hero (spoon swing / donkey kick)
  const x0=dir>0?p.x+PW-2:p.x-reach, R={x:x0,y:p.y-4,w:reach+2,h:PH+8};
  for(const e of L.ents){
    if(e.t==='shot'&&hitRect(R,{x:e.x-e.w/2,y:e.y-e.h/2,w:e.w,h:e.h})){ e.rm=1; if(!SIM)stars(e.x,e.y) }
    else if((e.t==='walk'||e.t==='hog')&&!e.dead&&hitRect(R,{x:e.x-(e.w||26)/2,y:(e.y||GY)-(e.h||24),w:e.w||26,h:e.h||24})&&e.v!=='charger'){ e.dead=.001; if(!SIM){stars(e.x,(e.y||GY)-12);Snd.bonk&&Snd.bonk()} }
  }
  if(breakBlocks){ const ty0=Math.floor(R.y/TS), ty1=Math.floor((R.y+R.h-1)/TS), tx0=Math.floor(R.x/TS), tx1=Math.floor((R.x+R.w)/TS);
    for(let ty=ty0;ty<=ty1;ty++)for(let tx=tx0;tx<=tx1;tx++){ const k=tx+','+ty, b=L.blocks[k]; if(b&&b.st!=='steel'){ delete L.blocks[k]; if(!SIM){debris(tx*TS,ty*TS+TS,THEMES[L.theme].floor);Snd.bonk&&Snd.bonk()} } } }
}
function heroSweep(p,rg){                             // the spoon also shows what is hidden nearby
  const cx=p.x+PW/2, cy=p.y+PH/2;
  for(const k in L.blocks){ const b=L.blocks[k]; if(b.rev)continue; const [tx,ty]=k.split(',').map(Number); if(Math.hypot(tx*TS+16-cx,ty*TS+16-cy)<rg*2.2){ b.rev=true; b.bump=.3 } }
}
function heroVert(p,dt){                              // after gravity: glide (chicken) and jet (robot)
  const a=hab(), id=S.hero; if(p.onGround)return;
  if(id==='chicken'&&K.j&&p.vy>50&&a.fuel>0&&p.air>.12){ if(!a.fl){a.fl=1;dayEv('ab',1)} p.vy=Math.min(p.vy,78); a.fuel-=dt; if(!SIM&&Math.random()<.25)puff(p.x+PW/2,p.y+PH,1,'#fff') }
  else if(id==='robot'&&K.j&&p.dj&&a.fuel>0&&p.vy>-150){ if(!a.fl){a.fl=1;dayEv('ab',1)} p.vy=lerp(p.vy,-120,Math.min(1,dt*30)); a.fuel-=dt; if(!SIM&&Math.random()<.5)parts.push({x:p.x+PW/2+(Math.random()-.5)*6,y:p.y+PH,vx:(Math.random()-.5)*30,vy:90+Math.random()*60,g:0,life:.3,max:.3,s:4+Math.random()*3,col:Math.random()<.5?'#ffb81f':'#ff6b35',sh:'c'}) }
}
function heroMag(){ return hOn()&&S.hero==='falafel'?hv('falafel','mag'):0 }
function heroJump2(){ return hOn()&&S.hero==='cat'?hv('cat','j2'):1 }
function heroGuard(c,e){                              // true = this hit does not kill
  if(!hOn())return false; const a=hab();
  if(a.inv>0)return true;
  if(S.hero==='robot'&&ROBOT_IMM.has(c))return true;
  if(S.hero==='uncle'&&a.ch>0&&!NOSHIELD.has(c)){ a.ch--; a.inv=1.4; P.vy=-260; P.onGround=false; dayEv('ab',1);
    if(!SIM){ stars(P.x+PW/2,P.y+PH/2); Snd.bonk&&Snd.bonk(); G.shake=6; say(rnd(['الدرع بلع الضربة! 🛡️','ما نفع الفخ هالمرة 😏','درع العم... أحسن من التأمين']),'any',1.8) }
    return true }
  if(!NOSHIELD.has(c)&&helpShieldHit()){ a.inv=1.4; P.vy=-260; P.onGround=false;
    if(!SIM){ stars(P.x+PW/2,P.y+PH/2); Snd.bonk&&Snd.bonk(); G.shake=6; say(rnd(['درع الحفظ بلع الضربة! 🛡️','نجوت... مرة وحدة بس 😏']),'any',1.8) }
    return true }
  return false;
}
function heroCheckpoint(){ if(!hOn())return; const a=hab(); if(S.hero==='uncle'&&hv('uncle','rg')&&a.ch<hv('uncle','ch')){ a.ch=hv('uncle','ch'); if(!SIM)econToast('🛡 الدرع تجدّد') } }

/* ---- XP + upgrades ---- */
function heroXpClear(first,noDeath){                  // called from econClear (real, legit levels only)
  const id=S.hero, c=S.hc[id]||(S.hc[id]={}), lv=G.level; let g=0;
  if(!c[lv]){ c[lv]=1; g+=L.boss?4:2; if(noDeath)g+=1 }
  if(L.trial&&!S.hc[id]['t'+L.trial]){ S.hc[id]['t'+L.trial]=1; g+=6 }
  if(g){ S.hx[id]=(S.hx[id]||0)+g; if(!SIM)econToast('+'+g+' خبرة '+HAB[id].ic) }
}
function heroXpDeath(){ if(SIM||G.custom||!legit()||G.lvDeaths>6)return; const id=S.hero; S.hx[id]=(S.hx[id]||0)+.5 }
const xpOf=id=>Math.floor(S.hx[id]||0);
const canUpgrade=id=>heroOwned(id)&&heroStage(id)<3&&xpOf(id)>=XP_NEED[heroStage(id)]&&S.wallet>=UP_COST[heroStage(id)];
function upgradeHero(id){
  const s=heroStage(id); if(!heroOwned(id)||s>=3)return 'max'; if(xpOf(id)<XP_NEED[s])return 'xp'; if(S.wallet<UP_COST[s])return 'poor';
  S.wallet-=UP_COST[s]; S.hs[id]=s+1; save(); hud(); achCheck(); return 'ok';
}

/* ---- drawing (visual only) ---- */
const SHIELD_COL='#7fe3ff';
function heroFxWorld(c){
  if(!P||P.dead||!P.ab||!hOn())return; const a=P.ab, id=S.hero, cx=P.x+PW/2, cy=P.y+PH/2;
  if(a.tr.length){ for(const q of a.tr){ c.globalAlpha=clamp(q.t/.22,0,1)*.35; c.fillStyle='#ffe9a8'; c.fillRect(q.x,q.y,PW,PH) } c.globalAlpha=1 }
  if(id==='uncle'&&(a.ch>0||a.inv>0)){ const pulse=1+Math.sin(G.t*6)*.05, fl=a.inv>0&&Math.floor(G.t*18)%2?.25:1; c.save(); c.globalAlpha=(a.inv>0?.55:.28)*fl; c.fillStyle=SHIELD_COL; c.strokeStyle='#fff'; c.lineWidth=2;
    c.beginPath(); c.ellipse(cx,cy,19*pulse,26*pulse,0,0,7); c.fill(); c.globalAlpha=.9*fl; c.stroke(); c.restore() }
  if(G.help&&G.help.shield>0&&!(id==='uncle'&&a.ch>0)){ const pulse=1+Math.sin(G.t*6)*.05; c.save(); c.globalAlpha=.26; c.fillStyle='#ffd23f'; c.strokeStyle='#fff'; c.lineWidth=2; c.beginPath(); c.ellipse(cx,cy,19*pulse,26*pulse,0,0,7); c.fill(); c.globalAlpha=.8; c.stroke(); c.restore() }
  if(G.help&&G.help.eye&&id!=='mushroom')heroMarks(c,cx,cy,175,1);
  if(id==='grandma'&&a.sw>0){ const t=1-a.sw/.24, d=a.dir, R=hv(id,'rg'); c.save(); c.translate(cx,cy); c.scale(d,1); c.strokeStyle='#ffe9a8'; c.lineWidth=5; c.lineCap='round'; c.globalAlpha=1-t;
    c.beginPath(); c.arc(0,0,R*.8,-1.1+t*1.4,-.1+t*1.4); c.stroke(); c.lineWidth=2; c.strokeStyle='#fff'; c.beginPath(); c.arc(0,0,R*.8,-1.1+t*1.4,-.1+t*1.4); c.stroke(); c.restore() }
  if((id==='grandma'&&a.rv>0)||id==='mushroom'){ const R=id==='mushroom'?hv(id,'see'):hv(id,'rg')*2.4; if(id==='grandma'||true) heroMarks(c,cx,cy,R,id==='grandma'?clamp(a.rv,0,1):1) }
  if(id==='robot'&&!P.onGround&&K.j&&P.dj&&a.fuel>0){ c.save(); c.globalAlpha=.8; c.fillStyle='#7fe3ff'; c.beginPath(); c.ellipse(cx,P.y+PH+6,6,10+Math.sin(G.t*40)*3,0,0,7); c.fill(); c.restore() }
}
const HID_T=new Set(['spk','ceil','mimic','mole','frog','fake','thw','anv','pend','tur','fish','jet','elec','beam']);
function heroMarks(c,cx,cy,R,al){                      // little ⚠ above the dangerous things nearby (hidden or not): information only
  c.save(); c.textAlign='center'; c.font='900 14px Arial'; c.lineJoin='round';
  for(const e of L.ents){ if(!HID_T.has(e.t)&&!(e.t==='walk'))continue; const x=entX(e)+(e.w&&e.t!=='walk'?(e.w>TS*3?0:e.w/2):0), y=(e.y!=null&&e.t==='walk'?e.y-30:GY-52); if(Math.hypot(x-cx,GY-cy)>R)continue;
    c.globalAlpha=al*(.55+.45*Math.sin(G.t*8+x)); c.fillStyle='#ff4d5e'; c.strokeStyle='#000'; c.lineWidth=3; c.strokeText('⚠',x,y); c.fillText('⚠',x,y) }
  for(const k in L.blocks){ const b=L.blocks[k]; if(b.rev)continue; const [tx,ty]=k.split(',').map(Number); if(Math.hypot(tx*TS+16-cx,ty*TS+16-cy)>R)continue;
    c.globalAlpha=al*.7; c.fillStyle='#ffd23f'; c.strokeStyle='#000'; c.lineWidth=3; c.strokeText('؟',tx*TS+16,ty*TS+22); c.fillText('؟',tx*TS+16,ty*TS+22) }
  c.restore();
}
function heroFxHud(c){                                  // screen space: slow-mo tint + the ability meter
  if(!P||G.state==='title'||G.custom||(L&&L.nab)||G.state==='menu')return; const id=S.hero, A=HAB[id], a=P.ab; if(!a)return;
  if(id==='mushroom'&&a.slow){ c.save(); c.globalAlpha=.16; c.fillStyle='#6fe0ff'; c.fillRect(0,0,VW,VH); const g=c.createRadialGradient(VW/2,VH/2,180,VW/2,VH/2,470); g.addColorStop(0,'#0000'); g.addColorStop(1,'rgba(120,60,220,.5)'); c.globalAlpha=1; c.fillStyle=g; c.fillRect(0,0,VW,VH); c.restore() }
  let frac=1, txt='', warm=false;
  if(id==='uncle'){ txt='×'+a.ch; frac=a.ch/Math.max(1,hv(id,'ch')) }
  else if(id==='chicken'||id==='robot'){ frac=a.fuel/hv(id,'st') }
  else if(id==='mushroom'){ frac=a.en/hv(id,'en') }
  else if(id==='grandma'||id==='donkey'){ const cd=hv(id,'cd'); frac=a.cd>0?1-a.cd/cd:1; warm=a.cd>0 }
  else return;
  c.save(); c.translate(10,50); c.globalAlpha=.92; c.fillStyle='#000a'; c.beginPath(); c.roundRect(0,0,112,26,10); c.fill(); c.font='16px Arial'; c.textAlign='left'; c.fillStyle='#fff'; c.fillText(A.ic,8,19);
  c.fillStyle='#0008'; c.beginPath(); c.roundRect(30,9,72,9,5); c.fill(); c.fillStyle=warm?'#8a84a8':(frac<.25?'#ff7a7a':'#ffd23f'); c.beginPath(); c.roundRect(30,9,Math.max(0,72*clamp(frac,0,1)),9,5); c.fill();
  if(txt){ c.font='900 12px Arial'; c.fillStyle='#fff'; c.fillText(txt,86,19) } c.restore();
}
