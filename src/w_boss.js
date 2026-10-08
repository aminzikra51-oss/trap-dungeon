/* =============== BOSS ROOM — every 10th level (10, 20, 30 ...) ===============
   One screen wide (25 tiles = 800 px, so the camera never moves). The boss hovers above a sealed gate.
   The hero has no weapon: a red button on the floor hurts the boss, and the boss guards it with telegraphed attacks:
     rain  — red column warns, then a rock falls          (from the start)
     lane  — arrow flies along the low / high lane        (after the 1st hit)
     erupt — floor spikes pop after a glowing warning     (after the 2nd hit)
   Hit the button 3 times (4-5 times for later bosses) -> the boss falls apart -> the gate opens -> the exit door.
   Progress survives a death (G.bossProg), so dying only costs you the current attempt at one button. */
const FLAGS={noBoss:false};
const BOSS_NAMES=['الملك فخ','الملكة مصيدة','الكاهن مسمار','التنين الكرتوني','جدّ الفخاخ'];
const BOSS_COL=['#8d7bc4','#c9799b','#5fae8c','#d19b52','#6f9fd1'];
const BTN_TX=[11,4,15,8,13];           // where the red button is for hit #1, #2, ...
const BX=668, BY=150, GATE_TX=19;      // boss centre and the tile column of the gate
const bossCd={};
const bossTier=n=>Math.floor(n/10);
const isBossLevel=n=>n>=10&&n%10===0;

function buildBoss(n,opt){
  const dk=DIFFS[opt.diff]?opt.diff:(DIFFS[S.diff]?S.diff:'crazy'), DF=DIFFS[dk], ne=n+DF.sh, tier=bossTier(n), W=25, D=mkD(ne);
  const hp=Math.min(5,3+(tier>=3?1:0)+(tier>=5?1:0)), f=clamp((ne-10)/60,0,1);
  const prog=(G.bossProg&&G.bossProg.n===n)?G.bossProg.hits:0;
  const L={n,dk,ne,lie:.5,w:W,D,df:clamp(D.f,0,1),ground:new Array(W).fill(GR),cr:{},blocks:{},ents:[],zones:[],signs:[],pits:[],torches:[4,14,24],
    theme:Math.floor((n-1)/5)%THEMES.length,crDelay:.3,exitTx:21,spawnTx:2,eid:0,segs:[],cpList:[],gate:GATE_TX,boss:1,tier};
  L.name='👑 '+BOSS_NAMES[(tier-1)%BOSS_NAMES.length];
  const i0=(prog||G.bossSeen===n)?1.1:2.6;
  const e={t:'boss',always:1,x:BX,y:BY,hp,hits:Math.min(prog,hp),tier,f,dk,col:BOSS_COL[(tier-1)%BOSS_COL.length],st:'intro',tm:i0,i0,nx:1,last:'',cdS:8,said:0,chg:0};
  if(e.hits>=hp){ e.st='done'; L.gate=null }
  L.ents.push(e);
  if(tier===1&&!prog)L.signs.push({tx:5,text:'اضغط الزر الأحمر\nعلى الأرض 🔴',tag:'any',lie:false,seen:false});
  return L;
}

/* what the boss throws right now (depends on how many hits it already took, the difficulty and how deep the run is).
   ONE scheduler: a single timer spaces every attack, so two telegraphs never pop at the same instant (that is what made some seeds unwinnable). */
function bossPlan(e){
  const k=Math.min(e.hits,4), f=e.f, s=lerp(1,.82,f)*(e.dk==='hell'?.86:e.dk==='crazy'?.94:1), calm=e.dk==='normal'?1.12:1;
  const W=[[1,0,0],[.55,.45,0],[.38,.34,.28],[.34,.33,.33],[.3,.34,.36]][k];         // weights: rain, lane, erupt
  return {
    gap:[1.45,1.25,1.1,1.0,.9][k]*s, w:W,
    rain:{n:[1,1,2,2,3][k], tele:clamp(.66-.05*k-f*.12,.44,.7)*calm},
    lane:k>=1?{spd:[0,245,270,290,310][k]+f*40, tele:clamp(.95-.06*k-f*.15,.6,.95)*calm}:null,
    chg:e.dk==='hell'?2.5:(e.dk==='crazy'?2.2:1.9),                     // seconds you must stand on the button (it drains at 60 % speed when you step off)
    erupt:k>=2?{tele:clamp(.9-.05*k-f*.1,.6,.9)*calm, up:.85, n:k>=3?2:1}:null
  };
}
const bossBtnX=e=>BTN_TX[Math.min(e.hits,BTN_TX.length-1)]*TS+16;

function bossSay(ev,o){
  o=o||{}; if(SIM||!L||!L.boss)return null;
  const tn=performance.now(); if(!o.force&&(bossCd[ev]||0)>tn)return null;
  const all=byKind['b_'+ev]||[]; if(!all.length)return null;
  const wA=S.voice?all.filter(hasAud):[], id=bagPick('b:'+ev,wA.length?wA:all,k=>k), aud=!!(S.voice&&hasAud(id));
  bossCd[ev]=tn+(o.cd||0)*1000;
  G.bsay={txt:VO[id].t,t:o.dur||2.4,t0:o.dur||2.4};
  if(aud)Snd.voice(id,{pri:o.pri==null?3:o.pri,delay:o.delay||0,max:o.max,wait:o.wait==null?.4:o.wait,ttl:o.ttl==null?1.4:o.ttl});
  return {id,t:VO[id].t,aud};
}

function bossHit(e){
  e.hits++; e.chg=0; G.bossProg={n:L.n,hits:e.hits};
  for(const x of L.ents)if(x.t==='shot'||x.t==='erupt')x.rm=1;            // a clean breather after every hit
  G.shake=Math.max(G.shake,11); Snd.bonk(); Snd.coin(); Snd.rumble(); stars(BX,BY); stars(pcx(),GY-20);
  if(e.hits>=e.hp){ e.st='dying'; e.tm=2.8; bossSay('defeat',{force:1,pri:4,delay:.1,max:2.4,dur:2.8}); }
  else{ e.st='hurt'; e.tm=2.6; bossSay('hit',{force:1,pri:4,delay:.1,max:1.8,dur:2.4}) }
}

B.boss={
 upd(e,dt){
  if(e.st==='intro'){
    if(!e.said){ e.said=1; if(G.bossSeen!==L.n&&e.hits===0){ G.bossSeen=L.n; bossSay('intro',{force:1,pri:3,delay:.7,max:2.4,dur:2.8}); if(e.tier===1&&!SIM)say('ادعس الزر الأحمر! 🔴 والملك بيتأذّى','any',3.6) } }
    e.tm-=dt; if(e.tm<=0){ e.st='fight'; e.nx=.6; e.cdS=7 } return }
  if(e.st==='hurt'){
    e.tm-=dt; if(e.tm<=0){ e.st='fight'; e.nx=1.0; if(e.hits===2)bossSay('rage',{force:1,pri:3,delay:.1,max:2,dur:2.4}) } return }
  if(e.st==='dying'){
    e.tm-=dt; G.shake=Math.max(G.shake,3.5); e.pt=(e.pt||0)-dt;
    if(e.pt<=0){ e.pt=.12; puff(BX+(rf()-.5)*110,BY+(rf()-.5)*90,5,e.col); debris(BX+(rf()-.5)*110,BY+30,e.col); if(rf()<.5)stars(BX+(rf()-.5)*90,BY) }
    if(e.tm<=0){ e.st='done'; L.gate=null; confetti(BX,BY); Snd.win(); G.shake=14;
      for(let i=0;i<8;i++)addE(mkCoin(120+i*58,GY-46-Math.sin(i/7*Math.PI)*34,false)) }
    return }
  if(e.st==='done')return;
  const pl=bossPlan(e);
  e.nx-=dt; if(e.nx<=0){
    let r=rf(), type='rain'; if(r>pl.w[0]){ type=(r<pl.w[0]+pl.w[1])?'lane':'erupt' }
    if(type===e.last&&type!=='rain'&&rf()<.7)type='rain';                       // no arrow-arrow or spikes-spikes streaks
    e.last=type; e.nx=pl.gap*(type==='rain'?1:1.15);
    if(type==='rain'){ for(let i=0;i<pl.rain.n;i++){ const x=i===0?clamp(pcx()+P.vx*.5+(rf()-.5)*(e.chg>.05?8:40),40,596):clamp(40+rf()*556,40,596);
        addE(mkShot({x,y:20,vy:640,w:16,h:26,tele:pl.rain.tele,fall:1,boss:1})) } }
    else if(type==='lane'){ const ln=rf()<.5?'lo':'hi';
      addE(mkShot({x:VW-26,y:LANE_Y[ln],vx:-pl.lane.spd,life:(VW+140)/pl.lane.spd+pl.lane.tele+.3,tele:pl.lane.tele,lane:ln,boss:1})); Snd.whoosh() }
    else{ for(let i=0;i<pl.erupt.n;i++){ const off=i?(rf()<.5?-1:1)*(80+rf()*90):(rf()-.5)*50, tx=clamp(Math.floor((pcx()+off)/TS)-1,1,16);
        addE({t:'erupt',x:tx*TS,w:TS*2,st:0,tm:pl.erupt.tele,up:pl.erupt.up,boss:1}) } }
  }
  e.cdS-=dt; if(e.cdS<=0){ e.cdS=8+rf()*5; bossSay('idle',{cd:6,pri:1,delay:0,max:1.8,dur:2.2,wait:0,ttl:.5}) }
  const onPad=P.onGround&&P.y+PH>=GY-2&&Math.abs(pcx()-bossBtnX(e))<14;
  e.chg=clamp((e.chg||0)+(onPad?dt/pl.chg:-dt/pl.chg*.6),0,1);
  if(e.chg>=1){ e.chg=0; bossHit(e) }
 },
 hit(){return null},
 draw(e,c,th){ bossFlat(e,c,th) }
};

/* floor spikes that erupt after a glowing warning */
B.erupt={
 upd(e,dt){
  e.tm-=dt;
  if(e.st===0){ if(e.tm<=0){ e.st=1; e.tm=e.up; Snd.noise({f0:900,f1:200,dur:.18,v:.16}); G.shake=Math.max(G.shake,3) } }
  else if(e.st===1){ if(e.tm<=0){ e.st=2; e.tm=.25 } }
  else if(e.tm<=0)e.rm=1;
 },
 hit(e){ return e.st===1&&hitRect(prect(),{x:e.x+3,y:GY-26,w:e.w-6,h:26})?'spike':null },
 draw(e,c,th){
  const k=e.st===1?1:(e.st===2?clamp(e.tm/.25,0,1):0);
  if(e.st===0){ const a=Math.floor(G.t*16)%2?.85:.4; c.globalAlpha=a; c.fillStyle='#ff3b3b'; c.fillRect(e.x,GY-4,e.w,4);
    c.strokeStyle='#ff3b3b';c.lineWidth=2;for(let i=0;i<=e.w;i+=8){c.beginPath();c.moveTo(e.x+i,GY);c.lineTo(e.x+i+3,GY-6-(i%16?0:4));c.stroke()}
    c.globalAlpha=1; return }
  const n=Math.round(e.w/16); c.fillStyle='#d9dde8'; c.strokeStyle='#000'; c.lineWidth=2;
  for(let i=0;i<n;i++){ const x=e.x+i*16+8, h=26*k; c.beginPath();c.moveTo(x-8,GY);c.lineTo(x,GY-h);c.lineTo(x+8,GY);c.closePath();c.fill();c.stroke() }
 }
};

/* gate + buttons are painted by the boss entity (so the snapshot stays one JSON object) */
function bossGateFlat(e,c){
  if(L.gate==null&&e.st!=='dying')return;
  const lift=e.st==='dying'?clamp(1-e.tm/2.8,0,1)*(GY-30):0, x=GATE_TX*TS;
  c.save(); c.beginPath(); c.rect(x-2,0,TS+4,GY); c.clip();
  c.fillStyle='#2a2238'; c.fillRect(x,14,TS,GY-14);
  c.strokeStyle='#000'; c.lineWidth=2.4; c.fillStyle='#8c8a99';
  for(let i=0;i<4;i++){ const bx=x+3+i*8.5; c.fillRect(bx,14-lift,4.6,GY-14); c.strokeRect(bx,14-lift,4.6,GY-14) }
  for(const y of [70,150,230]){ c.fillRect(x,y-lift,TS,7); c.strokeRect(x,y-lift,TS,7) }
  c.restore();
}
function bossBtnFlat(e,c){
  if(e.st==='done'||e.st==='dying')return;
  for(let i=0;i<e.hits;i++){ const x=BTN_TX[i]*TS+16; c.fillStyle='#2a2238'; c.beginPath(); c.ellipse(x,GY-2,24,6,0,0,7); c.fill(); c.fillStyle='#35cf7e'; c.beginPath(); c.ellipse(x,GY-4,17,4,0,0,7); c.fill() }
  const x=bossBtnX(e), pulse=.5+.5*Math.sin(G.t*8);
  const g=c.createRadialGradient(x,GY-6,2,x,GY-6,50); g.addColorStop(0,'rgba(255,60,60,'+(.35+.3*pulse)+')'); g.addColorStop(1,'rgba(255,60,60,0)'); c.fillStyle=g; c.fillRect(x-50,GY-56,100,56);
  c.fillStyle='#2a2238'; c.strokeStyle='#000'; c.lineWidth=2.4; c.beginPath(); c.ellipse(x,GY-3,25,7,0,0,7); c.fill(); c.stroke();
  c.fillStyle='#ff4a4a'; c.beginPath(); c.ellipse(x,GY-9,18,10,0,Math.PI,0); c.lineTo(x+18,GY-6); c.lineTo(x-18,GY-6); c.closePath(); c.fill(); c.stroke();
  if(e.chg>.01){ c.strokeStyle='#ffd23f'; c.lineWidth=4; c.beginPath(); c.ellipse(x,GY-4,30,10,0,-Math.PI/2,-Math.PI/2+e.chg*Math.PI*2); c.stroke() }
  c.fillStyle='#ffd23f'; c.strokeStyle='#000'; c.lineWidth=3; c.font='900 26px Arial'; c.textAlign='center'; const ay=GY-48+Math.sin(G.t*7)*5;
  c.strokeText('⬇',x,ay); c.fillText('⬇',x,ay);
}
/* pose shared by both looks */
function bossPose(e){
  let x=BX,y=BY,rot=0,mood='sly',a=1;
  const dead=G.state==='dead';
  if(e.st==='intro'){ const t=clamp((e.i0-e.tm)/(e.i0*.55),0,1), k=1-Math.pow(1-t,3); y=BY-(1-k)*260; mood=t<1?'wide':'sly' }
  else if(e.st==='hurt'){ x+=Math.sin(G.t*55)*4; rot=Math.sin(G.t*30)*.07; mood='wide'; y+=14 }
  else if(e.st==='dying'){ const k=1-e.tm/2.8; x+=Math.sin(G.t*70)*(3+8*k); y+=k*22; rot=Math.sin(G.t*40)*.1*k; mood='wide'; a=clamp(e.tm/.9,0,1) }
  else{ y+=Math.sin(G.t*1.7)*7; x+=Math.sin(G.t*.8)*8; const tele=L.ents.some(s=>(s.t==='shot'||s.t==='erupt')&&s.boss&&(s.t==='erupt'?s.st===0:s.tele>0)); mood=dead?'laugh':(tele||e.hits>=2?'angry':'sly') }
  return {x,y,rot,mood,a};
}
function bossFlat(e,c,th){
  bossGateFlat(e,c); bossBtnFlat(e,c);
  if(e.st==='done')return;
  const p=bossPose(e); c.save(); c.globalAlpha=p.a; c.translate(p.x,p.y); c.rotate(p.rot); c.lineJoin='round';
  c.fillStyle=e.col; c.strokeStyle='#000'; c.lineWidth=4; c.beginPath(); c.roundRect(-72,-60,144,118,30); c.fill(); c.stroke();
  c.fillStyle='#f1c232'; c.beginPath(); c.moveTo(-54,-58); c.lineTo(-54,-86); c.lineTo(-27,-66); c.lineTo(0,-96); c.lineTo(27,-66); c.lineTo(54,-86); c.lineTo(54,-58); c.closePath(); c.fill(); c.stroke();
  c.fillStyle='#ff4a4a'; for(const [gx,gy] of [[-54,-86],[0,-96],[54,-86]]){ c.beginPath(); c.arc(gx,gy,5,0,7); c.fill(); c.stroke() }
  face(c,0,2,3.4,p.mood);
  c.restore();
}

/* the HP bar (drawn in screen space) */
function drawBossHud(c){
  const e=L.ents.find(x=>x.t==='boss'); if(!e||G.state==='title')return;
  const w=300,x=VW/2-w/2,y=36,seg=w/e.hp,hp=e.hp-e.hits;
  c.save(); c.lineJoin='round'; c.fillStyle='rgba(8,4,16,.72)'; c.strokeStyle='#000'; c.lineWidth=3; c.beginPath(); c.roundRect(x-8,y-22,w+16,40,12); c.fill(); c.stroke();
  c.font='900 15px Tahoma,Arial'; c.textAlign='center'; c.direction='rtl'; c.fillStyle='#ffd23f'; c.fillText(L.name,VW/2,y-6);
  for(let i=0;i<e.hp;i++){ c.fillStyle=i<hp?'#ff4a4a':'#3a2d4f'; c.beginPath(); c.roundRect(x+i*seg+2,y+1,seg-4,10,4); c.fill(); c.strokeStyle='#000'; c.lineWidth=2; c.stroke() }
  c.restore();
}

/* the "ending" screen after a boss falls */
const END_TXT=[
 ['🏆 النهاية!','(مزحة... هاي أول مرحلة بوس بس)'],
 ['👑 سقط الحارس الثاني','بس في كمان... كتير'],
 ['💀 الحارس الثالث ركع','إنت مو طبيعي'],
 ['🔥 الحارس الرابع راح','الفخاخ بدها تحكي معك'],
 ['⚡ الحارس الخامس انتهى','اللعبة بتحترمك... شوي']];
function bossEnd(){
  const tier=bossTier(L.n), td=END_TXT[Math.min(tier,END_TXT.length)-1], d=G.lvDeaths;
  G.endCard={tier,t1:td[0],t2:td[1],l1:d===0?'من دون ولا موتة؟! أكيد غشّيت 🤨':'هزمت '+L.name.replace('👑 ','')+' بعد '+d+' موتة',l2:'مجموع موتاتك: '+G.deaths+' 💀',l3:'المرحلة '+(L.n+1)+' جاهزة... وأصعب 😈'};
  G.winLen=tier===1?9:7.5; G.winCard=null;
  confetti(VW*.3,GY-120); confetti(VW*.7,GY-140); stars(P.x+PW/2,P.y);
  bossSay('win',{force:1,pri:4,delay:.4,max:2.6,dur:3.2});
  if(Math.random()<.6)heroSay('win',{force:1,pri:3,delay:2.2,max:1.6,dur:2.2});
  S.best=Math.max(S.best,G.level+1); save();
}
function drawEndCard(c){
  const k=G.endCard; if(!k)return; const t=G.winT, a=clamp((t-.35)/.7,0,1); if(a<=0)return;
  c.save(); c.globalAlpha=a*.86; c.fillStyle='#07040d'; c.fillRect(0,0,VW,VH); c.globalAlpha=a;
  c.textAlign='center'; c.direction='rtl'; c.lineJoin='round';
  const row=(txt,y,sz,fill,lw)=>{ c.font='900 '+sz+'px Tahoma,Arial'; c.lineWidth=lw||7; c.strokeStyle='#000'; c.fillStyle=fill; c.strokeText(txt,VW/2,y); c.fillText(txt,VW/2,y) };
  const pop=1+Math.max(0,.5-t)*0.6; c.save(); c.translate(VW/2,128); c.scale(pop,pop); c.translate(-VW/2,-128); row(k.t1,128,60,'#ffd23f',10); c.restore();
  row(k.t2,176,26,'#fff'); row(k.l1,240,23,'#8fe0ff',6); row(k.l2,278,23,'#ff9bb0',6); row(k.l3,322,25,'#b8ff9b',6);
  if(t>2.4&&Math.floor(G.t*2.2)%2){ row('اضغط أي شي للمتابعة',392,18,'#fff',5) }
  c.restore();
}
