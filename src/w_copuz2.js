/* =============== CO-OP PUZZLES 2: keys, locked doors, water + swimming, fans, shelves, two floors, chained bridges ===============
   Everything hangs on the gate system of w_copuz.js: a puzzle has a colour / group id `gid`, plates and levers decide L.cgE[gid] (1 = open) and every new piece just
   READS that: a lock door is a cgate of kind 'lock' (a key latches it), the water level rises while its gid is open, a fan blows while its gid is open.
   Entities (all plain data, so a rollback snapshot stays plain JSON):
     ckey   {gid,x,y,h}                h = -1 lying there, 0|1 = carried by that player, 2 = used up.  Touch it to pick it up; walk into the lock of the same gid to use it.
     cwater {gid,x,w,y,yLo,yHi}        a pool over a pit. y = surface now (moves towards yHi while open, yLo while closed). Inside: slow, light, you swim.
     cfan   {gid,x,w,y0,y1}            an updraft column from y0 up to y1 while open.
   Swimming (only on levels with water, L.wt): jump = a stroke up, hold jump = rise slowly, nothing = sink slowly; a stroke near the surface leaps out onto the bank. No drowning. */
const CW_SP=80, WT_G=420, WT_SINK=70, WT_MX=125, WT_ACC=900, WT_FR=700, WT_STROKE=-235, WT_LEAP=-410, WT_HOLD=1100, WT_RISE=-150;
function waterAt(p){ const cx=p.x+PW/2, cy=p.y+PH*.55; for(const e of L.ents){ if(e.t==='cwater'&&cx>e.x&&cx<e.x+e.w&&cy>e.y)return e } return null }
function waterSwim(p,wt,dt){
  p.dj=false; p.air=0; p.coy=0;
  if(p.buf>0){ p.buf=0; const out=p.y+PH*.55<wt.y+16; p.vy=out?WT_LEAP:WT_STROKE; p.stand=0; p.onGround=false; Snd.stroke(); if(!SIM)for(let i=0;i<(out?5:2);i++)parts.push({x:p.x+PW/2+(Math.random()-.5)*12,y:p.y+PH*.6,vx:(Math.random()-.5)*50,vy:-30-Math.random()*40,g:-40,life:.7,max:.7,s:2+Math.random()*2.5,col:'#bfeaff',sh:'b'}) }
  else if(K.j&&p.vy>WT_RISE)p.vy=Math.max(WT_RISE,p.vy-WT_HOLD*dt);
}
function waterSplash(p,into){
  if(SIM||HUSH)return; Snd.splash();
  const wt=into?waterAt(p):null, y=wt?wt.y:p.y+PH*.55;
  for(let i=0;i<10;i++)parts.push({x:p.x+PW/2+(Math.random()-.5)*16,y,vx:(Math.random()-.5)*150,vy:-90-Math.random()*130,g:620,life:.55+Math.random()*.3,max:.8,s:2.5+Math.random()*3,col:'#9fdcff',sh:'c'});
}
function fanLift(p,dt){
  const cx=p.x+PW/2;
  for(const e of L.ents){ if(e.t!=='cfan'||L.cgE[e.gid]!==1||cx<=e.x||cx>=e.x+e.w||p.y+PH<=e.y1||p.y>=e.y0)continue;
    p.vy=Math.max(p.vy-2900*dt,-215); p.onGround=false; p.stand=0; p.dj=false; return }
}
function cgKey(e,S1){
  if(e.h===2)return;
  if(e.h<0){ for(const q of PLY){ if(!q.dead&&Math.abs(q.x+PW/2-e.x)<20&&Math.abs(q.y+PH*.5-e.y)<30){ e.h=q.idx; Snd.key(); break } } return }
  const q=PLY[e.h]; if(!q||q.dead)return;
  e.x=q.x+PW/2; e.y=q.y-12;                                                                    // floats above his head
  for(const g of (L.cgG&&L.cgG[e.gid])||[]){ if(g.kind!=='lock')continue;
    if(q.x+PW>g.x-14&&q.x<g.x+g.w*TS+14&&q.y+PH>g.y0*TS&&q.y<(g.y1+1)*TS){ e.h=2; S1[e.gid]=(S1[e.gid]|0)|1; Snd.unlock(); break } }
}

/* ---------------- drawing ---------------- */
B.ckey={ hit(){return null},
 draw(e,c){ if(e.h===2)return; const col=cgCol(e.gid), bob=e.h<0?Math.sin(G.t*4)*2.5:Math.sin(G.t*6)*1.2;
  c.save(); c.translate(e.x,e.y+bob); c.lineJoin='round'; c.lineCap='round';
  if(e.h<0){ c.globalAlpha=.35+.2*Math.sin(G.t*5); c.fillStyle=col; c.beginPath(); c.arc(0,0,17,0,7); c.fill(); c.globalAlpha=1 }
  c.scale(e.h<0?1.15:.95,e.h<0?1.15:.95); c.rotate(-.6); c.strokeStyle='#000'; c.lineWidth=2.4; c.fillStyle='#ffd23f';
  c.beginPath(); c.arc(-8,0,6.5,0,7); c.fill(); c.stroke(); c.fillStyle=col; c.beginPath(); c.arc(-8,0,2.6,0,7); c.fill();
  c.fillStyle='#ffd23f'; c.fillRect(-2,-2,16,4); c.strokeRect(-2,-2,16,4); c.fillRect(8,2,3,6); c.strokeRect(8,2,3,6); c.fillRect(12,2,3,5); c.strokeRect(12,2,3,5);
  c.restore() }};
function waterBody(c,e,a1,a2){
  if(e.y>=VH+20)return; const x=e.x, y=e.y, w=e.w, t=G.t;
  const g=c.createLinearGradient(0,y,0,VH); g.addColorStop(0,'rgba(60,190,240,'+a1+')'); g.addColorStop(1,'rgba(10,80,130,'+a2+')');
  c.fillStyle=g; c.beginPath(); c.moveTo(x,VH+4); c.lineTo(x,y);
  for(let px=0;px<=w;px+=8)c.lineTo(x+px,y+Math.sin(t*3+(x+px)*.045)*2.2+Math.sin(t*1.7+(x+px)*.11)*1.2);
  c.lineTo(x+w,VH+4); c.closePath(); c.fill();
}
B.cwater={ hit(){return null},
 draw(e,c){ if(e.y>=VH+20)return; waterBody(c,e,.55,.8); c.save(); c.strokeStyle='#ffffffaa'; c.lineWidth=2; c.beginPath();
  for(let px=0;px<=e.w;px+=8){ const yy=e.y+Math.sin(G.t*3+(e.x+px)*.045)*2.2+Math.sin(G.t*1.7+(e.x+px)*.11)*1.2; px?c.lineTo(e.x+px,yy):c.moveTo(e.x,yy) } c.stroke();
  c.fillStyle='#ffffff40'; for(let i=0;i<6;i++){ const k=((G.t*.25+i/6)%1), bx=e.x+((i*37+13)%100)/100*e.w; c.beginPath(); c.arc(bx+Math.sin(G.t*2+i)*4,VH-k*(VH-e.y),1.6+(i%3),0,7); c.fill() }
  c.restore() }};
function waterOver(c){ for(const e of L.ents)if(e.t==='cwater'&&e.y<VH+20)waterBody(c,e,.22,.3) }
B.cfan={ hit(){return null},
 draw(e,c){ const on=L.cgE&&L.cgE[e.gid]===1, col=cgCol(e.gid), x=e.x, w=e.w, y=e.y0;
  c.save(); c.lineJoin='round'; c.strokeStyle='#000'; c.lineWidth=2.4;
  if(on){ c.strokeStyle=col; c.lineWidth=2; c.globalAlpha=.55; for(let i=0;i<5;i++){ const k=((G.t*1.4+i*.21)%1), xx=x+(i+.5)/5*w, h=(y-e.y1)*(1-k); c.beginPath(); c.moveTo(xx,y-6-k*(y-e.y1)); c.lineTo(xx,y-6-k*(y-e.y1)-18); c.stroke() } c.globalAlpha=1; c.strokeStyle='#000'; c.lineWidth=2.4 }
  c.fillStyle='#4a5069'; c.fillRect(x,y-10,w,10); c.strokeRect(x,y-10,w,10);
  c.fillStyle=on?'#9fe0ff':'#7d84a0'; const n=4, ang=on?G.t*14:0;
  for(let i=0;i<n;i++){ const a=ang+i*Math.PI/2, bx=x+w/2+Math.cos(a)*w*.36; c.beginPath(); c.ellipse(bx,y-14,w*.14+2,3,0,0,7); c.fill(); c.stroke() }
  c.fillStyle=on?'#35d07f':col; c.beginPath(); c.arc(x+w/2,y-5,3.5,0,7); c.fill(); c.stroke();
  c.restore() }};
Snd.key=function(){ this.tone({t:'square',f0:700,f1:1100,dur:.09,v:.14}); this.tone({t:'triangle',f0:1400,f1:1800,dur:.12,v:.1,d:.07}) };
Snd.unlock=function(){ this.tone({t:'square',f0:300,f1:200,dur:.08,v:.16}); this.tone({t:'triangle',f0:600,f1:900,dur:.2,v:.12,d:.08}); this.noise({dur:.25,v:.1,ft:'lowpass',f:420,d:.1}) };
Snd.splash=function(){ this.noise({dur:.22,v:.16,ft:'bandpass',f:900}) };
Snd.stroke=function(){ this.noise({dur:.09,v:.07,ft:'bandpass',f:1200}) };

/* ---------------- level pieces (same contract as COV in w_copuz.js: build into L at tile x, return the tiles used) ---------------- */
const coKey=(L,g,tx,y)=>L.ents.push({t:'ckey',gid:g,x:tx*TS,y,h:-1});
Object.assign(COV,{
 keyshelf(L,x){ const g=newId(L), s1=GY-104, s2=s1-84;                       // the key is on a shelf too high to reach alone: one lifts the other
  coCp(L,x); coSign(L,x+3,'المفتاح فوق الرف! 🔑\nواحد يرفع التاني... والباب بيستنى المفتاح',3.6);
  L.ents.push(mkPlat(newId(L),'static',(x+8)*TS,s1,3*TS,{}), mkPlat(newId(L),'static',(x+11)*TS,s2,3*TS,{}));
  coKey(L,g,x+12.5,s2-18); L.ents.push(mkGate(g,x+19,1,0,GR-1,'lock',0));
  coCpEnd(L,x+22); return 24 },
 flood(L,x){ const g=newId(L), gap=12;                                      // a deep pit: one opens the water gates, the other swims over
  coCp(L,x); coSign(L,x+3,'حفرة عميقة 💀\nواحد يكبس الزر وتنفتح المياه\nوالتاني يسبح (اضغط قفز)',4);
  L.ents.push(mkPlate(g,(x+6)*TS,GY,TS*1.8)); cutPit(L,x+8,gap);
  L.ents.push({t:'cwater',gid:g,x:(x+8)*TS,w:gap*TS,y:VH+40,yLo:VH+40,yHi:GY+8});
  L.ents.push(mkGate(g,x+8,0,0,0,'none',0), mkLever(g,(x+8+gap+2)*TS+16,GY));
  coCpEnd(L,x+8+gap+5); return gap+14 },
 fan(L,x){ const g=newId(L), H=6, wx=x+11;                                   // a wall too high to jump: one powers the fan, the other flies over
  coCp(L,x); coSign(L,x+3,'الحيط عالي! 🧱\nواحد يكبس الزر يشغّل المروحة\nوالتاني بيطير فوق الحيط 🌬',3.8);
  L.ents.push(mkPlate(g,(x+4)*TS,GY,TS*1.8));
  for(let k=1;k<=H;k++){ blk(L,wx,GR-k); blk(L,wx+1,GR-k) }
  L.ents.push({t:'cfan',gid:g,x:(wx-3)*TS,w:2.6*TS,y0:GY,y1:(GR-H-1)*TS-6});
  L.ents.push(mkGate(g,x+8,0,0,0,'none',0), mkLever(g,(wx+6)*TS+16,GY));
  coCpEnd(L,x+20); return 22 },
 chain(L,x){ const g1=newId(L), g2=newId(L), gap=8;                           // two gaps with an island between: each bridge needs its own helper, each lever latches one
  coCp(L,x); coSign(L,x+3,'جسرين ورا بعض 🌉🌉\nكل جسر بدّه حدا يكبس زرّه',3.2);
  L.ents.push(mkPlate(g1,(x+4)*TS,GY,TS*1.8)); cutPit(L,x+8,gap); L.ents.push(mkGate(g1,x+8,gap,GR,GR,'bridge',1), mkLever(g1,(x+8+gap+1)*TS+16,GY));
  L.ents.push(mkPlate(g2,(x+8+gap+3)*TS,GY,TS*1.8)); cutPit(L,x+8+gap+6,gap); L.ents.push(mkGate(g2,x+8+gap+6,gap,GR,GR,'bridge',1), mkLever(g2,(x+8+2*gap+7)*TS+16,GY));
  coCpEnd(L,x+8+2*gap+10); return 2*gap+16+8 },
 floors(L,x){ const g0=newId(L), g1=newId(L), g2=newId(L), UR=7, UY=UR*TS;     // two storeys: lift up, a bridge on the top floor held from the floor below, a door below held from above
  coCp(L,x); coSign(L,x+3,'طابقين! 🏢\nواحد فوق وواحد تحت...\nكل واحد بيفتح الطريق للتاني',3.8);
  L.ents.push(mkPlate(g0,(x+4)*TS,GY,TS*1.8));
  L.ents.push(mkPlat(newId(L),'colift',(x+8)*TS,GY-30,2*TS,{gid:g0,y0:GY-30,y1:UY,sp:84,lm:0}), mkGate(g0,x+8,0,0,0,'none',0), mkLever(g0,(x+12.5)*TS,UY));
  for(let tx=x+11;tx<=x+28;tx++){ if(tx>=x+16&&tx<=x+19)continue; blk(L,tx,UR) }          // the slab = the upper floor, with a hole in it
  L.ents.push(mkPlate(g1,(x+17)*TS,GY,TS*1.8), mkGate(g1,x+16,4,UR,UR,'bridge',1));         // lower plate -> bridge over the hole
  L.ents.push(mkPlate(g2,(x+22)*TS,UY,TS*1.8), mkGate(g2,x+20,1,UR+1,GR-1,'door',0), mkLever(g2,(x+25)*TS+16,GY));       // upper plate -> door below, its lever latches it
  coCpEnd(L,x+31); return 33 },
});
for(const v of [['keyshelf',8,2,26],['flood',7,3,28],['fan',7,3,24],['chain',6,4,42],['floors',6,5,36]])COV_LIST.push(v);
Object.assign(CO_HW,{keyshelf:1.2,flood:1.6,fan:1.4,chain:3,floors:3});
