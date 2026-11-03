/* =============== CO-OP PUZZLES, part 5: communication ===============
   seer - a bridge of hidden stepping stones across a pit. Only a player standing on the WATCHTOWER sees where the stones are (they glow); the other one walks blind and has to be
          told where to jump (quick phrases: T, T, T, then 1-8). Stones he has stood on show up for good. Over the pit nobody may be more than CO_TETHER from the
          tower, so the whole path fits on one screen. The lever on the far bank raises a bridge so the watcher can cross too.
          sizes: 3 / 4 / 5 stones.  patterns: 0 two heights   1 three heights   2 two heights and the glow only blinks (remember what you saw)
   All state is in the entity and in L.blocks (hidden block = rev:false), the glow is draw-only (it depends on who is looking, never on the simulation). */
/* =============== drum - stomp on the beat ===============
   A drum in the middle of the hall, a ring shrinks onto the pad of each player; when it closes the drum beats. Everybody has to LAND (not jump: land) within a short window around the beat,
   once, and not at any other time (a stray landing breaks the streak, so hopping around does not work). N beats in a row open the door. The tempo rises with the streak.
   sizes: 4 / 5 / 7 beats, window +-0.30 / 0.26 / 0.22 s.   patterns: 0 both land on every beat   1 ping-pong (the ring tells who: one beat you, one beat him, faster)   2 irregular beats (watch the ring)
   Everything the simulation reads is plain numbers in the entity (time is the sum of dt), the picture only reads them. */
/* =============== simon - colour memory ===============
   Coloured pads on the floor, far apart. The pads light up in some order (and a note each); then the order has to be repeated by LANDING on the pads (a jump onto it; walking over a pad does
   nothing), every step within a time limit that is too short for one person to run from the far left pad to the far right one: so one stands at each end.
   A wrong pad or a timeout shows the order again. sizes: 4 / 5 / 7 steps.   patterns: 0 three pads   1 four pads, closer together   2 three pads and the order has to be repeated BACKWARDS.
   State is plain numbers in the entity (st 0 waiting, 1 showing, 2 your turn, 3 pause after a mistake, 4 done). */
const seerStones=(L,x,n,pt)=>{ const r=mulberry32((L.n|0)*131+x*7+(L.vs|0)*13+pt*5+n), rows=pt===1?[GR-1,GR-2,GR-3]:[GR-1,GR-3], K=rows.length, out=[]; let lane=Math.floor(r()*K);
  for(let i=0;i<n;i++){ if(pt===1)lane=clamp(lane+Math.floor(r()*3)-1,0,K-1); else lane=r()<.5?0:1; out.push([x+9+3*i,rows[lane],lane]) }
  if(out.every(s=>s[2]===out[0][2])){ const j=n-1, l2=(out[j][2]+1)%K; out[j][2]=l2; out[j][1]=rows[l2] }                  // never a straight line: there would be nothing to tell
  return out };
B.cseer={
 upd(e,dt){ for(const p of PLY){ if(!p||p.dead||!p.onGround||p.stand<0)continue; const tx=Math.floor((p.x+PW/2)/TS), ty=Math.round((p.y+PH)/TS), b=L.blocks[tx+','+ty]; if(b&&b.sk&&!b.rev){ b.rev=true; b.bump=.3 } } },      // a stone you stood on stays visible
 hit(){ return null },
 draw(e,c,th){
  const lp=G.co&&PLY[G.co.me]; if(!lp)return;
  const cx=lp.x+PW/2, on=lp.onGround&&lp.stand>=0&&Math.abs(lp.y+PH-e.top)<3&&cx>=e.tw0&&cx<=e.tw1, mid=(e.tw0+e.tw1)/2;
  c.save(); c.textAlign='center'; c.font='26px serif'; c.globalAlpha=.9; c.fillText('🔭',mid,e.top-30+Math.sin(G.t*3)*2);
  const vis=on&&(!e.bl||(G.t%2.4)<1.15);
  if(vis){ c.lineJoin='round'; for(const s of e.st){ const b=L.blocks[s[0]+','+s[1]]; if(b&&b.rev)continue; const x=s[0]*TS, y=s[1]*TS, a=.55+.25*Math.sin(G.t*6+s[0]);
    c.globalAlpha=a; c.fillStyle='#4dffa0'; c.fillRect(x,y,2*TS,TS); c.globalAlpha=1; c.strokeStyle='#baffd9'; c.lineWidth=2.4; c.strokeRect(x+1,y+1,2*TS-2,TS-2) } }
  else if(on){ c.globalAlpha=.8; c.fillStyle='#fff'; c.font='900 14px Tahoma'; c.fillText('👁 غمّضت... تذكّر!',mid,e.top-58) }
  c.restore() }};
Object.assign(COV,{
 seer(L,x,o){ const g=newId(L), sz=o.sz|0, pt=o.pt|0, n=[3,4,5][sz]||3, len=3*n, st=seerStones(L,x,n,pt);
  coCp(L,x);
  coSign(L,x+2,[ 'جسر الحجارة المخفية! 🔭 واحد على البرج بيشوف الحجارة (بتتوهّج)\nوالتاني يمشي عليها - احكيله وين يقفز (T)',
                 'ثلاث مستويات! 🔭 اللي على البرج بيشوف الحجارة\nواحكوا لبعض (T)',
                 'الحجارة بتغمّض! 🔭 التوهّج بيروح ويجي - تذكّروا الطريق\nواحكوا لبعض (T)' ][pt],6);
  for(let i=0;i<4;i++)for(let k=1;k<=Math.min(i+1,3);k++)blk(L,x+4+i,GR-k);                                           // the stairs up to the tower: heights 1, 2, 3, 3
  cutPit(L,x+8,len);
  for(const s of st){ for(let d=0;d<2;d++)L.blocks[(s[0]+d)+','+s[1]]={rev:false,bump:0,sk:1} }                         // hidden (but solid) stones, two blocks wide
  L.ents.push({t:'cseer',x:(x+6)*TS,tw0:(x+6)*TS,tw1:(x+8)*TS,top:(GR-3)*TS,st:st.map(s=>[s[0],s[1]]),bl:pt===2?1:0,always:1});
  L.ents.push(mkGate(g,x+8,len,GR,GR,'bridge',1), mkLever(g,(x+8+len+1)*TS+16,GY));
  coCpEnd(L,x+8+len+4); return len+14 },
});
COV_LIST.push(['seer',6,4,32]); CO_HW.seer=1.6;

const DRUM_T=[[1.8,1.7,1.6,1.5,1.4,1.3,1.25],[1.7,1.6,1.5,1.4,1.3,1.2,1.15],[1.5,1.4,1.3,1.2,1.1,1.05,1.0]];
const drumPer=e=>e.pt===2?e.sq[e.nb%e.sq.length]:DRUM_T[e.sz][Math.min(e.sc,6)]*(e.pt===1?.75:1);
const drumNeed=(e,i)=>e.pt!==1||(e.nb&1)===i;                                 // who has to land on the current beat
const drumTone=(f,bad)=>{ try{ Snd.tone&&Snd.tone(bad?{t:'sawtooth',f0:150,f1:70,dur:.2,v:.12}:{t:'triangle',f0:f,f1:f*.8,dur:.09,v:.16}) }catch(_){} };
B.cdrum={
 upd(e,dt){
  if(e.st===2)return;
  if(e.st===0){ for(const q of PLY){ if(!q.dead&&q.x+PW/2>e.trig){ e.st=1; e.tm=0; e.tb=2.4; e.nb=0; e.sc=0; e.pr=drumPer(e); break } } if(e.st===0)return }
  e.tm+=dt; if(e.okT>0)e.okT-=dt;
  if(e.tm>=e.tb&&e.tk!==e.nb){ e.tk=e.nb; drumTone(e.pt===1&&(e.nb&1)?440:330) }
  for(let i=0;i<2;i++){ const p=PLY[i], g=!!(p&&!p.dead&&p.onGround);
    if(g&&!e.pg[i]){ if(drumNeed(e,i)&&!e.hit[i]&&Math.abs(e.tm-e.tb)<=e.w)e.hit[i]=1; else if(e.sc>0||e.hit[i]||e.tm>e.tb-e.w){ e.vd=1; if(e.sc>0){ e.sc=0; e.okT=.5; e.okV=-1; drumTone(0,1) } } }      // a landing nobody asked for
    e.pg[i]=g?1:0 }
  if(e.tm>=e.tb+e.w){                                                          // the window of this beat is over
    const ok=!e.vd&&(!drumNeed(e,0)||e.hit[0])&&(!drumNeed(e,1)||e.hit[1]);
    if(ok){ e.sc++; e.okT=.5; e.okV=1; drumTone(660) } else if(e.sc>0){ e.sc=0; e.okT=.5; e.okV=-1; drumTone(0,1) } else { e.okT=.5; e.okV=-1 }
    e.hit=[0,0]; e.vd=0; e.nb++; e.tb+=e.pr; e.pr=drumPer(e);
    if(e.sc>=e.n){ e.st=2; e.okT=1.2; e.okV=1; if(L.cgS)L.cgS[e.gid]=(L.cgS[e.gid]|0)|1 } }
 },
 hit(){ return null },
 draw(e,c,th){
  const cx=e.cx, gy=GY, col=['#ffd23f','#4dd8ff'], me=G.co?G.co.me:0, run=e.st===1;
  c.save(); c.globalAlpha=1; c.textAlign='center'; c.lineJoin='round';
  const flash=run&&e.tm>=e.tb&&e.tm<e.tb+.12;
  c.font=(flash?'46px':'40px')+' serif'; c.fillText('🥁',cx,gy-86-(flash?4:0));
  for(let i=0;i<e.n;i++){ const x=cx+(i-(e.n-1)/2)*17; c.beginPath(); c.arc(x,gy-132,6,0,7); c.fillStyle=i<e.sc||e.st===2?'#5dff8a':'rgba(0,0,0,.35)'; c.fill(); c.lineWidth=2; c.strokeStyle='#000'; c.stroke() }
  for(let i=0;i<2;i++){ const px=cx+(i?70:-70), need=!run||drumNeed(e,i), lead=run?e.tb-e.tm:9;
    c.save(); c.translate(px,gy-5); c.scale(1,.32); c.globalAlpha=need?1:.35; c.lineWidth=5; c.strokeStyle=col[i]; c.fillStyle=col[i];
    c.beginPath(); c.arc(0,0,22,0,7); c.globalAlpha=(need?.35:.12); c.fill(); c.globalAlpha=need?1:.35; c.stroke();
    if(run&&need&&lead>-.12&&lead<1){ const r=22+Math.max(0,lead)*64; c.lineWidth=7; c.beginPath(); c.arc(0,0,r,0,7); c.stroke(); if(lead<=0){ c.globalAlpha=.8; c.beginPath(); c.arc(0,0,26,0,7); c.fill() } }
    c.restore();
    if(i===me){ c.font='900 12px Tahoma'; c.fillStyle='#fff'; c.strokeStyle='#000'; c.lineWidth=3; c.strokeText('أنت',px,gy+13); c.fillText('أنت',px,gy+13) } }
  if(e.st===0){ c.font='900 14px Tahoma'; c.fillStyle='#fff'; c.strokeStyle='#000'; c.lineWidth=4; c.strokeText('تقدّموا للساحة 🥁',cx,gy-150); c.fillText('تقدّموا للساحة 🥁',cx,gy-150) }
  else if(e.okT>0){ c.font='900 30px Arial'; c.fillStyle=e.okV>0?'#5dff8a':'#ff4d5e'; c.strokeStyle='#000'; c.lineWidth=5; const t=e.okV>0?(e.st===2?'👏':'✔'):'✖'; c.strokeText(t,cx,gy-158); c.fillText(t,cx,gy-158) }
  c.restore() }};
Object.assign(COV,{
 drum(L,x,o){ const g=newId(L), sz=o.sz|0, pt=o.pt|0, n=[4,5,7][sz]||4, w=[.30,.26,.22][sz]||.3, r=mulberry32((L.n|0)*97+x*11+(L.vs|0)*17+pt*3+sz), sq=[]; for(let i=0;i<8;i++)sq.push([1.15,1.4,1.7,2.0][Math.floor(r()*4)]);
  coCp(L,x);
  coSign(L,x+2,[ 'الطبّال! 🥁 انزلوا عالأرض (مش بس تقفزوا) مع الدقّة بنفس اللحظة'+'\n'+n+' دقّات ورا بعض بتفتح الباب',
                 'بينغ بونغ! 🥁 الدايرة بتقلّك مين دوره'+'\nانزل مع الدقّة بس إذا الدايرة إلك - '+n+' دقّات ورا بعض',
                 'إيقاع مخبّل! 🥁 الدقّات مش منتظمة'+'\nانزلوا مع الدقّة وراقبوا الدايرة - '+n+' دقّات' ][pt],6);
  L.ents.push({t:'cdrum',gid:g,x:(x+10)*TS,cx:(x+11)*TS,trig:(x+6)*TS,n,w,sz,pt,sq,st:0,tm:0,tb:0,pr:0,nb:0,sc:0,tk:-1,pg:[0,0],hit:[0,0],vd:0,okT:0,okV:0,always:1});
  L.ents.push(mkGate(g,x+17,1,0,GR-1,'door'));
  coCpEnd(L,x+20); return 24 },
});
COV_LIST.push(['drum',6,4,26]); CO_HW.drum=1.6;

const SIMON_COL=['#ff4d6d','#4dd8ff','#ffd23f','#7dff6b'], SIMON_F=[262,330,392,523];
const simonNeed=e=>e.rv?e.sq[e.n-1-e.ix]:e.sq[e.ix];
const simonLim=e=>e.lim+(e.ix===0?1.6:0);
const simonG=p=>!!(p&&!p.dead&&p.onGround&&p.stand>=0&&Math.abs(p.y+PH-GY)<4);      // standing on the floor itself (not on a partner's head)
B.csimon={
 upd(e,dt){
  if(e.st===4)return;
  if(e.okT>0)e.okT-=dt;
  if(e.st===0){ for(const q of PLY){ if(!q.dead&&q.x+PW/2>e.trig){ e.st=1; e.tm=-1.2; break } } if(e.st===0)return }
  if(e.st===1){                                                                // showing: pad sq[sh] lights for .55 s, then .25 s of dark
    e.tm+=dt; const k=Math.floor(e.tm/.8);
    if(e.tm>=0){ const cur=k<e.n?(e.tm-k*.8<.55?e.sq[k]:-1):-1; if(cur!==e.lit){ e.lit=cur; if(cur>=0)simonTone(cur) } }
    if(k>=e.n){ e.st=2; e.ix=0; e.tl=0; e.lit=-1 }
    for(let i=0;i<2;i++)e.pg[i]=simonG(PLY[i])?1:0; return }
  if(e.st===3){ e.tm+=dt; if(e.tm>=1.1){ e.st=1; e.tm=-.6; e.lit=-1 } for(let i=0;i<2;i++)e.pg[i]=simonG(PLY[i])?1:0; return }
  e.tl+=dt; let bad=0;
  for(let i=0;i<2;i++){ const p=PLY[i], g=simonG(p);
    if(g&&!e.pg[i]){ const cx=p.x+PW/2; let k=-1; for(let j=0;j<e.px.length;j++)if(Math.abs(cx-e.px[j])<=e.hw)k=j;
      if(k>=0){ if(k===simonNeed(e)){ e.ix++; e.tl=0; e.okK=k; e.okT=.35; simonTone(k); if(e.ix>=e.n){ e.st=4; e.okT=1.4; e.okK=-1; if(L.cgS)L.cgS[e.gid]=(L.cgS[e.gid]|0)|1; return } } else bad=1 } }
    e.pg[i]=g?1:0 }
  if(bad||e.tl>simonLim(e)){ e.st=3; e.tm=0; e.lit=-1; e.ix=0; e.okK=-2; e.okT=.8; drumTone(0,1) }
 },
 hit(){ return null },
 draw(e,c,th){
  c.save(); c.globalAlpha=1; c.textAlign='center'; c.lineJoin='round';
  for(let j=0;j<e.px.length;j++){ const x=e.px[j], on=e.lit===j||(e.okT>0&&e.okK===j);
    c.fillStyle=SIMON_COL[j]; c.strokeStyle='#000'; c.lineWidth=3; c.globalAlpha=on?1:.42;
    c.beginPath(); c.rect(x-e.hw,GY-8,e.hw*2,8); c.fill(); c.stroke();
    if(on){ c.globalAlpha=.45; c.beginPath(); c.moveTo(x-e.hw,GY-8); c.lineTo(x-e.hw-6,GY-70); c.lineTo(x+e.hw+6,GY-70); c.lineTo(x+e.hw,GY-8); c.closePath(); c.fill() }
    c.globalAlpha=1 }
  const mx=(e.px[0]+e.px[e.px.length-1])/2, ty=GY-150;
  for(let i=0;i<e.n;i++){ const x=mx+(i-(e.n-1)/2)*16; c.beginPath(); c.arc(x,ty,5.5,0,7); c.fillStyle=(e.st===4||i<e.ix)?'#5dff8a':'rgba(0,0,0,.35)'; c.fill(); c.lineWidth=2; c.strokeStyle='#000'; c.stroke() }
  c.font='900 14px Tahoma'; c.fillStyle='#fff'; c.strokeStyle='#000'; c.lineWidth=4;
  const msg=e.st===0?'تقدّموا 🎹':e.st===1?'👀 تفرّجوا':e.st===2?(e.rv?'⏪ بالعكس! انزلوا على الألواح':'انزلوا على الألواح (قفزة)'):e.st===3?'✖ مرّة تانية':'👏';
  c.strokeText(msg,mx,ty-16); c.fillText(msg,mx,ty-16);
  if(e.st===2){ const f=clamp(1-e.tl/simonLim(e),0,1), w=120; c.fillStyle='rgba(0,0,0,.5)'; c.fillRect(mx-w/2,ty+12,w,7); c.fillStyle=f>.35?'#5dff8a':'#ff4d5e'; c.fillRect(mx-w/2,ty+12,w*f,7) }
  c.restore() }};
const simonTone=k=>{ try{ Snd.tone&&Snd.tone({t:'triangle',f0:SIMON_F[k%4],f1:SIMON_F[k%4],dur:.16,v:.15}) }catch(_){} };
Object.assign(COV,{
 simon(L,x,o){ const g=newId(L), sz=o.sz|0, pt=o.pt|0, n=[4,5,7][sz]||4, m=pt===1?4:3, gap=pt===1?200:300, lim=pt===1?[3.0,2.7,2.4][sz]:[3.1,2.8,2.5][sz], r=mulberry32((L.n|0)*53+x*19+(L.vs|0)*7+pt*29+sz*3), sq=[];
  let last=-1; for(let i=0;i<n;i++){ let k; do{ k=Math.floor(r()*m) }while(k===last); sq.push(k); last=k }
  if(m===3&&!(sq.includes(0)&&sq.includes(2))){ sq[1]=0; sq[2]=2; if(sq[3]===2)sq[3]=1 }                              // the far pads must both be used (otherwise one person could do it from the middle)
  const px=[]; for(let j=0;j<m;j++)px.push((x+8)*TS+j*gap);
  coCp(L,x);
  coSign(L,x+2,[ 'ذاكرة الألوان! 🎹 تذكّروا ترتيب التوهّج وكرّروه بقفزة على كل لوح\nالألواح بعيدة: واحد عكل طرف!',
                 'أربع ألواح! 🎹 كرّروا الترتيب بقفزة على كل لوح\nوزّعوا الألواح بينكم',
                 'بالعكس! 🎹⏪ كرّروا الترتيب من الآخر للأول\nقفزة على كل لوح' ][pt],6);
  const span=Math.ceil(((m-1)*gap)/TS);
  L.ents.push({t:'csimon',gid:g,x:px[0],trig:(x+6)*TS,px,hw:34,n,m,rv:pt===2?1:0,lim,sq,st:0,tm:0,ix:0,tl:0,lit:-1,okT:0,okK:-1,pg:[0,0],always:1});
  L.ents.push(mkGate(g,x+8+span+4,1,0,GR-1,'door'));
  coCpEnd(L,x+8+span+7); return span+18 },
});
COV_LIST.push(['simon',6,5,40]); CO_HW.simon=1.6;
