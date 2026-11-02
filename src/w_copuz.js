/* =============== CO-OP PUZZLES: things one player cannot do alone ===============
   Pieces (all plain data in L.ents, so a snapshot is still just JSON; the only extra state is L.cgS / L.cgE):
   - cplate  : a pressure plate. Pressed while any living player stands on it (feet on its top).
   - clever  : a lever. Touching it latches its gate open for good (one way).
   - cgate   : geometry that is solid or not: a door (solid while shut), a bridge / steps (solid while OPEN, `inv`). Several pieces share one gid (the colour).
   - plat v:'colift' : a lift. Follows its plate (up while pressed); once the lever is pulled it shuttles up and down on its own.
   L.cgS[gid] = raw bits: 1 = latched (lever / both plates were once pressed), 2 = held (plates satisfied right now). L.cgE[gid] = 1 when the gate is open.
   cgTick() runs once per step before the players move; it never closes a door (or raises a bridge) on somebody who is standing in it.
   Written for N players: a plate counts anybody, 'all' plates (sync) means every plate of the group at the same time; nothing assumes two.
   Also: a player can stand on another one's head (w_core.js moveY / w_coop.js coPlayers) - that is the human ladder. */
const CGC=['#ffd23f','#4dd0ff','#ff6fa8','#7ee081','#ff9a3c','#b794ff'];
const cgCol=gid=>CGC[((L.cgc&&L.cgc[gid])|0)%CGC.length];
const mkPlate=(gid,x,y,w,o)=>Object.assign({t:'cplate',gid,x,y,w,on:0},o||{});
const mkLever=(gid,x,y)=>({t:'clever',gid,x,y,on:0});
const mkGate=(gid,tx,w,y0,y1,kind,inv)=>({t:'cgate',gid,x:tx*TS,tx,w,y0,y1,kind,inv:inv?1:0});

function cgBuild(L){                                          // static lookups from the entities (the entities themselves are the snapshot)
  const gs=L.ents.filter(e=>e.t==='cgate'); L.cg=null; L.cgS=undefined; L.cgE=undefined; L.cgd=null; L.cgG=null; L.cgc=null; cgV={};
  L.wt=L.ents.some(e=>e.t==='cwater'); L.fn=L.ents.some(e=>e.t==='cfan');            // the physics only looks for water / fans on levels that have them (w_copuz2.js)
  if(!gs.length)return;
  L.cg={}; L.cgS={}; L.cgE={}; L.cgd={}; L.cgG={}; L.cgc={}; let k=0;
  for(const e of gs){ if(L.cgc[e.gid]==null)L.cgc[e.gid]=k++; (L.cgG[e.gid]||(L.cgG[e.gid]=[])).push(e); L.cgS[e.gid]=0; L.cgE[e.gid]=0;
    for(let i=0;i<e.w;i++)(L.cg[e.tx+i]||(L.cg[e.tx+i]=[])).push({id:e.gid,y0:e.y0,y1:e.y1,inv:e.inv}) }
  for(const e of L.ents){ if(e.t!=='cplate')continue; const d=L.cgd[e.gid]||(L.cgd[e.gid]={n:0,all:0,lat:0}); d.n++; if(e.all)d.all=1; if(e.lat)d.lat=1 }
}
function cgBlocked(gid,want){                                  // would the change make a body solid on top of a player?
  let blocked=false;
  for(const g of L.cgG[gid]){ if((want===1)!==!!g.inv)continue;                      // this piece is about to become solid
    const x0=g.x,x1=g.x+g.w*TS,y0=g.y0*TS,y1=(g.y1+1)*TS;
    for(const q of PLY){ if(q.dead||!(q.x<x1&&q.x+PW>x0&&q.y<y1&&q.y+PH>y0))continue;
      if(g.inv){ q.y=y0-PH; q.vy=0; q.onGround=true; q.stand=0 }                    // steps / a bridge rising under his feet carry him up
      else blocked=true } }                                                         // a door never closes on somebody: it waits until he has left
  return blocked;
}
function cgTick(){
  if(!L.cg)return; const S1=L.cgS, E=L.cgE, cnt={};
  for(const e of L.ents){
    if(e.t==='cplate'){ let on=0;
      for(const q of PLY){ if(!q.dead&&Math.abs(q.y+PH-e.y)<=4&&q.x+PW>e.x+2&&q.x<e.x+e.w-2){ on=1; break } }
      if(on!==e.on){ e.on=on; Snd.plate(on) } if(on)cnt[e.gid]=(cnt[e.gid]|0)+1 }
    else if(e.t==='ckey')cgKey(e,S1);
    else if(e.t==='cwater'){ const tg=E[e.gid]===1?e.yHi:e.yLo; if(e.y!==tg)e.y+=clamp(tg-e.y,-CW_SP/60,CW_SP/60) }
    else if(e.t==='clever'&&!e.on){
      for(const q of PLY){ if(!q.dead&&q.x+PW>e.x-12&&q.x<e.x+12&&q.y+PH>e.y-36&&q.y<e.y+2){ e.on=1; S1[e.gid]=(S1[e.gid]|0)|1; Snd.lever(); break } } }
  }
  for(const k in L.cgG){ const d=L.cgd[k]||{n:0,all:0,lat:0}, held=d.n?(d.all?cnt[k]===d.n:(cnt[k]|0)>=1):false;
    let b=(S1[k]|0)&1; if(held&&d.lat)b=1; b|=held?2:0; S1[k]=b;
    const want=b?1:0; if(want!==(E[k]|0)&&!cgBlocked(k,want)){ E[k]=want; Snd.gate(want) } }
}

/* ---------------- drawing (visual easing lives OUTSIDE the entities: they are part of the hashed snapshot) ---------------- */
let cgV={};
function cgEase(key,tg){ const n=performance.now(), o=cgV[key]||(cgV[key]={v:tg,t:n}); const dt=Math.min(.05,(n-o.t)/1000); o.t=n; o.v+=clamp(tg-o.v,-dt*2.2,dt*2.2); return o.v }
B.cplate={ hit(){return null},
 draw(e,c,th){ const col=cgCol(e.gid), dn=e.on?4:0, y=e.y+dn;
  c.save(); c.lineJoin='round'; c.strokeStyle='#000'; c.lineWidth=2.4;
  c.fillStyle='#2c2540'; c.fillRect(e.x-3,e.y-2,e.w+6,7); c.strokeRect(e.x-3,e.y-2,e.w+6,7);
  c.fillStyle=e.on?'#35d07f':col; c.fillRect(e.x,y-6,e.w,7); c.strokeRect(e.x,y-6,e.w,7);
  c.fillStyle='#0003'; for(let i=6;i<e.w-4;i+=10)c.fillRect(e.x+i,y-5,4,5);
  if(!e.on){ const bob=Math.sin(G.t*5)*2; c.fillStyle=col; c.beginPath(); c.moveTo(e.x+e.w/2-6,y-22+bob); c.lineTo(e.x+e.w/2+6,y-22+bob); c.lineTo(e.x+e.w/2,y-13+bob); c.closePath(); c.fill(); c.stroke() }
  c.restore() }};
B.clever={ hit(){return null},
 draw(e,c,th){ const col=cgCol(e.gid), a=e.on?.62:-.62, kx=e.x+Math.sin(a)*22, ky=e.y-6-Math.cos(a)*22;
  c.save(); c.lineJoin='round'; c.lineCap='round'; c.strokeStyle='#000'; c.lineWidth=2.4;
  c.fillStyle='#2c2540'; c.fillRect(e.x-12,e.y-7,24,8); c.strokeRect(e.x-12,e.y-7,24,8);
  c.lineWidth=6; c.strokeStyle='#000'; c.beginPath(); c.moveTo(e.x,e.y-6); c.lineTo(kx,ky); c.stroke(); c.lineWidth=3; c.strokeStyle='#cfd4e6'; c.stroke();
  c.lineWidth=2.4; c.strokeStyle='#000'; c.fillStyle=e.on?'#35d07f':col; c.beginPath(); c.arc(kx,ky,6.5,0,7); c.fill(); c.stroke();
  if(!e.on){ c.globalAlpha=.55+.45*Math.sin(G.t*5); c.strokeStyle=col; c.lineWidth=2; c.beginPath(); c.arc(kx,ky,11,0,7); c.stroke() }
  c.restore() }};
B.cgate={ hit(){return null},
 draw(e,c,th){ const col=cgCol(e.gid), open=L.cgE&&L.cgE[e.gid]===1, vo=cgEase(e.gid+':'+e.tx, open?1:0), x=e.tx*TS, w=e.w*TS, top=e.y0*TS, h=(e.y1-e.y0+1)*TS;
  if(e.kind==='none')return;
  c.save(); c.lineJoin='round'; c.lineCap='round'; c.strokeStyle='#000'; c.lineWidth=2.4;
  if(e.kind==='bridge'){
    const n=Math.round(w/TS), shown=vo*n;
    for(let i=0;i<n;i++){ const a=clamp(shown-i,0,1); if(a<=0)continue; c.globalAlpha=a; c.fillStyle='#9a6b3a'; c.fillRect(x+i*TS+1,top,TS-2,9); c.strokeRect(x+i*TS+1,top,TS-2,9); c.fillStyle='#0003'; c.fillRect(x+i*TS+4,top+2,TS-8,2) }
    c.globalAlpha=1; if(vo<1){ c.globalAlpha=.4*(1-vo); c.setLineDash([6,6]); c.strokeStyle=col; c.beginPath(); c.moveTo(x,top+4); c.lineTo(x+w,top+4); c.stroke(); c.setLineDash([]) }
    c.globalAlpha=1; c.strokeStyle='#000'; c.fillStyle=col; for(const px of [x-4,x+w-2]){ c.fillRect(px,top-18,6,22); c.strokeRect(px,top-18,6,22) } }
  else if(e.kind==='steps'){
    for(let tx=0;tx<e.w;tx++)for(let ty=e.y0;ty<=e.y1;ty++){ const bx=x+tx*TS, by=ty*TS+(1-vo)*12;
      if(vo>.02){ c.globalAlpha=vo; c.fillStyle=th.floor; c.fillRect(bx,by,TS,TS); c.strokeStyle='#000'; c.strokeRect(bx+1,by+1,TS-2,TS-2); c.fillStyle='#ffffff14'; c.fillRect(bx+3,by+3,TS-6,4); if(ty===e.y0){ c.fillStyle=th.top; c.fillRect(bx,by-3,TS,6); c.strokeRect(bx,by-3,TS,6) } }
      if(vo<.98){ c.globalAlpha=.45*(1-vo); c.strokeStyle=col; c.lineWidth=2; c.setLineDash([5,5]); c.strokeRect(bx+2,ty*TS+2,TS-4,TS-4); c.setLineDash([]); c.lineWidth=2.4 } }
    c.globalAlpha=1 }
  else if(e.kind==='lock'){
    const bh=h*(1-vo);                                          // a wooden door with an iron lock: it slides up when the key is used
    if(bh>2){ c.fillStyle='#7a4a24'; c.fillRect(x+1,top,w-2,bh); c.strokeRect(x+1,top,w-2,bh); c.fillStyle='#0003'; for(let yy=top+16;yy<top+bh;yy+=32)c.fillRect(x+3,yy,w-6,3);
      c.fillStyle='#5b6178'; c.fillRect(x+1,top+bh*.3,w-2,6); c.strokeRect(x+1,top+bh*.3,w-2,6); c.fillRect(x+1,top+bh*.7,w-2,6); c.strokeRect(x+1,top+bh*.7,w-2,6);
      const ky=top+Math.min(bh-18,h*.55); c.fillStyle=col; c.beginPath(); c.arc(x+w/2,ky,9,0,7); c.fill(); c.stroke(); c.fillStyle='#000'; c.beginPath(); c.arc(x+w/2,ky-2,3,0,7); c.fill(); c.fillRect(x+w/2-1.5,ky,3,7);
      c.globalAlpha=.6+.4*Math.sin(G.t*5); c.fillStyle='#fff'; c.font='900 15px Arial'; c.textAlign='center'; c.fillText('🔑',x+w/2,ky-18); c.globalAlpha=1 }
    c.fillStyle=col; c.fillRect(x-3,top,w+6,8); c.strokeRect(x-3,top,w+6,8) }
  else {
    const bh=h*(1-vo);                                          // a portcullis: it slides up out of the way
    if(bh>2){ c.fillStyle='#4a5069'; for(let i=0;i<4;i++){ c.fillRect(x+3+i*8,top,4,bh); c.strokeRect(x+3+i*8,top,4,bh) }
      for(let yy=top+26;yy<top+bh-4;yy+=44){ c.fillRect(x,yy,w,5); c.strokeRect(x,yy,w,5) }
      c.fillStyle='#8d93aa'; for(let i=0;i<4;i++){ c.beginPath(); c.moveTo(x+3+i*8,top+bh); c.lineTo(x+7+i*8,top+bh); c.lineTo(x+5+i*8,top+bh+8); c.closePath(); c.fill(); c.stroke() } }
    c.fillStyle=col; c.fillRect(x-3,top,w+6,8); c.strokeRect(x-3,top,w+6,8);
    c.fillStyle=open?'#35d07f':'#ff4d5e'; c.beginPath(); c.arc(x+w/2,top+16,4.5,0,7); c.fill(); c.stroke() }
  c.restore() }};

/* little sounds (muted automatically during a rollback replay by Snd's HUSH checks) */
Snd.plate=function(on){ this.tone({t:'square',f0:on?260:190,f1:on?330:140,dur:.07,v:.14}) };
Snd.lever=function(){ this.tone({t:'square',f0:170,f1:110,dur:.09,v:.16}); this.tone({t:'triangle',f0:520,f1:780,dur:.16,v:.12,d:.07}) };
Snd.gate=function(open){ this.noise({dur:.28,v:.14,ft:'lowpass',f:open?500:300}); this.tone({t:'sawtooth',f0:open?90:150,f1:open?150:70,dur:.3,v:.1}) };

/* ---------------- level pieces: each returns the number of tiles it needs ---------------- */
const coSign=(L,tx,text,dur)=>L.signs.push({tx,text,tag:'any',lie:false,seen:false,dur:dur||0});      // dur = how long the bubble stays when a player walks up (long texts need longer)
const coCp=(L,tx)=>{ if(L.ground[tx]>=0&&!L.cr[tx])L.ents.push(mkCp(tx)) };
const coCpEnd=(L,tx)=>{ if(L.dk!=='nightmare')coCp(L,tx) };      // nightmare: no save flag after a puzzle, dying right behind it means doing it again
const COV={
 gate(L,x){ const g=newId(L);
  coCp(L,x); coSign(L,x+3,'واحد يوقف على الزر 🔘\nوالتاني يعبر ويشدّ الرافعة 🎚');
  L.ents.push(mkPlate(g,(x+4)*TS,GY,TS*1.8), mkGate(g,x+11,1,0,GR-1,'door'), mkLever(g,(x+15)*TS+16,GY));
  coCpEnd(L,x+19); return 21 },
 ladder(L,x){ const g=newId(L), wx=x+9;
  coCp(L,x); coSign(L,x+4,'الحيط عالي! 😅\nواحد يوقف... والتاني يطلع على راسه 🧍');
  for(let k=1;k<=3;k++){ blk(L,wx,GR-k); blk(L,wx+1,GR-k) }
  L.ents.push(mkPlat(newId(L),'static',wx*TS,GY-104,2*TS,{}));
  L.ents.push(mkGate(g,wx-2,1,GR-1,GR-1,'steps',1), mkGate(g,wx-1,1,GR-2,GR-1,'steps',1), mkLever(g,(wx+5)*TS+16,GY));
  coCpEnd(L,x+19); return 21 },
 bridge(L,x){ const g=newId(L), gap=11;
  coCp(L,x); coSign(L,x+3,'الجسر ما بيطلع لحاله 😈\nواحد يكبس الزر ويضل واقف عليه');
  L.ents.push(mkPlate(g,(x+4)*TS,GY,TS*1.8)); cutPit(L,x+8,gap); L.ents.push(mkGate(g,x+8,gap,GR,GR,'bridge',1), mkLever(g,(x+8+gap+2)*TS+16,GY));
  coCpEnd(L,x+8+gap+5); return gap+14 },
 sync(L,x){ const g=newId(L);
  coCp(L,x); coSign(L,x+3,'كبسوا الزرّين مع بعض! 👯\nواحد تحت وواحد فوق');
  L.ents.push(mkPlate(g,(x+4)*TS,GY,TS*1.8,{all:1,lat:1}));
  L.ents.push(mkPlat(newId(L),'static',(x+8)*TS,GY-72,3*TS,{})); L.ents.push(mkPlate(g,(x+9)*TS-4,GY-72,TS*1.8,{all:1,lat:1}));
  L.ents.push(mkGate(g,x+15,1,0,GR-1,'door'));
  coCpEnd(L,x+19); return 21 },
 lift(L,x){ const g=newId(L), H=6, top=GY-H*TS;
  coCp(L,x); coSign(L,x+3,'المصعد بدّو واحد يوقف على الزر 🛗\nوالتاني يطلع ويشدّ الرافعة');
  L.ents.push(mkPlate(g,(x+4)*TS,GY,TS*1.8));
  L.ents.push(mkPlat(newId(L),'colift',(x+8)*TS,GY-30,2*TS,{gid:g,y0:GY-30,y1:top,sp:84,lm:0}));
  for(let k=1;k<=H;k++)for(let c2=0;c2<5;c2++)blk(L,x+10+c2,GR-k);
  L.ents.push(mkGate(g,x+8,0,0,0,'none',0), mkLever(g,(x+12)*TS+16,top));
  coCpEnd(L,x+19); return 21 },
 relay(L,x){ const a=COV.gate(L,x); const b=COV.gate(L,x+a-2); return a+b-2 },
};
const CO_HW={relay:3,lift:1.8,sync:1.8,bridge:1.4};                 // impossible / nightmare lean on the puzzles that need the most teamwork (w_copuz2.js adds its own)
const COV_LIST=[['gate',10,1,22],['ladder',10,1,22],['bridge',8,2,26],['sync',8,2,22],['lift',8,3,22],['relay',6,4,44]];
FAM.co=function(L,r,x,n,D,room){
  const forced=D.force&&COV[D.force]?D.force:null, last=L.coLast;
  const list=COV_LIST.filter(v=>v[0]!==last||COV_LIST.length<2).map(v=>hellish(L.dk)?[v[0],v[1]*(CO_HW[v[0]]||.5),v[2],v[3]]:v);
  const v=forced||pv(r,n,list,room,D); if(!v)return 0;
  const used=COV[v](L,x); L.coLast=v; (L.coList=L.coList||[]).push([v,x,used]); return used;
};
NEEDF.co=22;

/* test / debug helper: a fresh local co-op game on a level that contains only this puzzle ('gate','ladder','bridge','sync','lift','relay') */
function coPuzTest(v,heroes){
  coStart({hero:heroes||['falafel','robot'],level:3,local:true,me:0});
  L=buildLevel(3,{script:[['co',v]],co:1,diff:'normal'}); G.cpX=null; G.deaths=0; G.lvDeaths=0; coSpawn(L.spawnTx); G.state='play'; G.camX=0; G.t=0;
  return L.coList;
}
