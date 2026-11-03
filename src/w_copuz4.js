/* =============== CO-OP PUZZLES 4: the BIG traps (a hazard that needs both players) ===============
   Every builder takes (L,x,o): o={sz,pt} = size 0..2 and pattern 0..2 (see coVar in w_copuz.js). 0/0 is the plain version.
   All hazards here are deterministic (they only look at PLY and at plain arithmetic - no Math.sin, no random), their state lives in the entity itself,
   and they are driven by the same gate state as the other puzzles (L.cgE[gid], see w_copuz.js): plates, levers, sync plates.
   boulder - a giant boulder bounces between two walls of a pen; a door at one end lets it out into a pit. Open the door: sync plates / a lever on a high ledge (human ladder) / a lever too high for anything but a toss
   ceil    - a spiked ceiling comes down over a long hall; it only goes back up while somebody holds a plate (or the lever at the end has been pulled)
   rsaw    - a huge saw in a low tunnel; a plate lifts it into its housing, the lever at the far end keeps it there
   catapult- a see-saw: one hops onto one end, the other (standing on the other end) is launched high; a lever / key on a ledge, or over a wall
   opm     - the operator machine: barriers across the hall, each one switched off only while somebody stands on the plate of ITS colour; one plays the operator, the other runs through */
const mkBould=(gid,o)=>Object.assign({t:'cbould',gid,x:0,y:GY-40,r:40,sp:95,dir:1,xB:0,xR:0,x1:0,trig:0,st:0,vy:0,rot:0,always:1},o);
B.cbould={
 upd(e,dt){
  if(e.st===0){ for(const q of PLY){ if(!q.dead&&q.x+PW/2>e.trig){ e.st=1; Snd.rumble&&Snd.rumble(); break } } if(e.st===0)return }
  if(e.st===1){
   const open=!!(L.cgE&&L.cgE[e.gid]===1); if(open&&e.dir<0)e.dir=1;                // the door opens: out through the pit it goes
   e.x+=e.dir*e.sp*dt; e.rot+=e.dir*dt*e.sp/e.r;
   if(e.dir>0){ if(open){ if(e.x>=e.x1){ e.st=2; e.vy=0 } } else if(e.x>=e.xR){ e.x=e.xR; e.dir=-1; Snd.thud&&Snd.thud() } }
   else if(e.x<=e.xB){ e.x=e.xB; e.dir=1 } }
  else { e.vy+=1500*dt; e.y+=e.vy*dt; e.x+=e.sp*.5*dt; e.rot+=dt*5; if(e.y>VH+e.r+40)e.rm=1 }
 },
 hit(e){ return e.st===1&&circHit(e.x,e.y,e.r-5,prect())?'boulder':null },
 draw(e,c,th){
  if(e.st===0)return; const r=e.r, k=r/40;
  if(e.st===1&&e.x+r<G.camX){ c.save(); c.globalAlpha=.55+.45*Math.sin(G.t*9); c.font='900 26px Arial'; c.textAlign='left'; c.fillStyle='#ff4d5e'; c.strokeStyle='#000'; c.lineWidth=4; c.strokeText('⚠ 🪨',G.camX+8,GY-70); c.fillText('⚠ 🪨',G.camX+8,GY-70); c.restore() }
  c.save(); c.translate(e.x,e.y); c.save(); c.rotate(e.rot); c.scale(k,k);
  c.fillStyle='#8c8498'; c.strokeStyle='#000'; c.lineWidth=4/k; c.lineJoin='round'; c.beginPath(); for(let i=0;i<16;i++){ const a=i/16*Math.PI*2, rr=40+(i%3)*2; c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr) } c.closePath(); c.fill(); c.stroke();
  c.strokeStyle='#5d566a'; c.lineWidth=3/k; c.beginPath(); c.moveTo(-20,-10); c.lineTo(5,0); c.lineTo(-5,22); c.moveTo(15,-25); c.lineTo(22,-5); c.moveTo(-26,16); c.lineTo(-14,26); c.stroke();
  c.restore(); c.scale(k,k);
  c.fillStyle='#fff'; c.strokeStyle='#000'; c.lineWidth=3/k; c.beginPath(); c.arc(-12,-6,9,0,7); c.fill(); c.stroke(); c.beginPath(); c.arc(14,-6,9,0,7); c.fill(); c.stroke();
  c.fillStyle='#000'; c.beginPath(); c.arc(e.dir>0?-8:-16,-5,3.5,0,7); c.fill(); c.beginPath(); c.arc(e.dir>0?18:10,-5,3.5,0,7); c.fill();
  c.lineWidth=5/k; c.beginPath(); c.moveTo(-24,-20); c.lineTo(-4,-13); c.moveTo(28,-20); c.lineTo(6,-13); c.stroke();
  c.fillStyle='#fff'; c.lineWidth=3/k; c.beginPath(); c.rect(-14,10,30,12); c.fill(); c.stroke(); c.restore() }};

const mkCeilP=(gid,o)=>Object.assign({t:'cceil',gid,x:0,w:0,trig:0,h:200,HO:200,vd:25,vu:140,st:0,always:1},o);
B.cceil={
 upd(e,dt){
  if(e.st===0){ for(const q of PLY){ if(!q.dead&&q.x+PW/2>e.trig&&q.x<e.x+e.w){ e.st=1; break } } if(e.st===0)return }
  if(L.cgE&&L.cgE[e.gid]===1)e.h=Math.min(e.HO,e.h+e.vu*dt); else e.h=Math.max(0,e.h-e.vd*dt) },
 hit(e){ if(e.st!==1)return null; const pr=prect(); return pr.x+pr.w>e.x&&pr.x<e.x+e.w&&pr.y<GY-e.h?'crush':null },
 draw(e,c,th){
  const yb=GY-e.h, x=e.x, w=e.w, low=e.st===1&&e.h<90;
  c.save(); c.lineJoin='round'; c.strokeStyle='#000'; c.lineWidth=3;
  c.fillStyle=low?'#5a2d3c':'#3a3350'; c.fillRect(x,-30,w,yb+30); c.strokeRect(x,-30,w,yb+30);
  c.fillStyle='#ffffff10'; for(let yy=-26;yy<yb-8;yy+=26)for(let xx=x+((yy/26|0)%2?0:22);xx<x+w-30;xx+=44)c.fillRect(xx+4,yy,36,18);
  c.fillStyle='#ffd23f'; for(let xx=x;xx<x+w-1;xx+=32){ c.beginPath(); c.moveTo(xx,yb-10); c.lineTo(Math.min(xx+16,x+w),yb-10); c.lineTo(Math.min(xx+8,x+w)+0,yb); c.lineTo(xx-8<x?x:xx-8,yb); c.closePath(); c.fill() }
  c.fillStyle='#d9dde8'; for(let xx=x+4;xx<x+w-14;xx+=20){ c.beginPath(); c.moveTo(xx,yb); c.lineTo(xx+14,yb); c.lineTo(xx+7,yb+15); c.closePath(); c.fill(); c.stroke() }
  c.fillStyle='#2c2540'; for(const px of [x-8,x+w-4]){ c.fillRect(px,-30,12,yb+30+20); c.strokeRect(px,-30,12,yb+30+20) }
  if(low){ c.globalAlpha=.5+.5*Math.sin(G.t*14); c.fillStyle='#ff4d5e'; c.font='900 22px Arial'; c.textAlign='center'; c.fillText('⚠',x+w/2,Math.max(24,yb-14)) }
  c.restore() }};

const mkRsaw=(gid,o)=>Object.assign({t:'crsaw',gid,x:0,y:0,r:40,x0:0,x1:0,sp:90,dir:1,ret:0,yd:0,yu:0,rot:0,cy:0,always:1},o);
B.crsaw={
 upd(e,dt){
  const tg=(L.cgE&&L.cgE[e.gid]===1)?1:0; e.ret+=clamp(tg-e.ret,-dt/.5,dt/.5);
  e.x+=e.dir*e.sp*dt; if(e.x>e.x1){ e.x=e.x1; e.dir=-1 } if(e.x<e.x0){ e.x=e.x0; e.dir=1 }
  e.y=e.yd+(e.yu-e.yd)*e.ret; e.rot+=dt*11*e.dir },
 hit(e){ return circHit(e.x,e.y,e.r-2,prect())?'saw':null },
 draw(e,c,th){
  const r=e.r;
  c.save(); c.lineJoin='round'; c.strokeStyle='#000'; c.lineWidth=2.6;
  c.fillStyle='#14101e'; c.fillRect(e.x0-r-6,e.cy-2*r-8,e.x1-e.x0+2*r+12,2*r+8); c.strokeRect(e.x0-r-6,e.cy-2*r-8,e.x1-e.x0+2*r+12,2*r+8);      // the housing in the ceiling
  c.translate(e.x,e.y); c.rotate(e.rot); c.fillStyle='#cfd5e0'; c.beginPath(); const R=r+5, r2=r-3;
  for(let i=0;i<20;i++){ const a=i/20*Math.PI*2, rr=i%2?r2:R; c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr) } c.closePath(); c.fill(); c.stroke();
  c.fillStyle='#e04b4b'; c.beginPath(); c.arc(0,0,r*.3,0,7); c.fill(); c.stroke(); c.restore();
  face(c,e.x,e.y+1,r/40,isK(e)?'laugh':'angry');
  if(e.ret<.05){ c.save(); c.fillStyle='#ff4d5e'; c.font='900 20px Arial'; c.textAlign='center'; c.globalAlpha=.6+.4*Math.sin(G.t*8); c.fillText('⚠',(e.x0+e.x1)/2,e.cy+6); c.restore() }
  c.restore() }};

const CAT_V=800, CAT_VX=140;
const mkCat=(x,o)=>Object.assign({t:'ccat',x,y:GY,pw:56,gap:12,pv:[0,0],cd:0,tl:0,always:1},o);
const catPad=(e,p)=>{ if(p.y+PH<e.y-3||p.y+PH>e.y+3)return -1; const cx=p.x+PW/2; if(cx>=e.x&&cx<=e.x+e.pw)return 0; if(cx>=e.x+e.pw+e.gap&&cx<=e.x+2*e.pw+e.gap)return 1; return -1 };
B.ccat={
 upd(e,dt){
  if(e.cd>0)e.cd-=dt; if(e.tl!==0)e.tl=Math.abs(e.tl)<=dt*3?0:e.tl-Math.sign(e.tl)*dt*3;
  for(let i=0;i<PLY.length;i++){ const a=PLY[i], v0=e.pv[i]||0; e.pv[i]=a&&!a.dead?a.vy:0;                           // v0 = how fast he was falling a frame ago
    if(!a||a.dead||e.cd>0||v0<200||!a.onGround||a.stand!==0)continue;                                               // he has just landed hard on the ground
    const pa=catPad(e,a); if(pa<0)continue;
    for(let j=0;j<PLY.length;j++){ const b=PLY[j]; if(j===i||!b||b.dead||!b.onGround||b.stand!==0||b.hb>=0||b.hold>=0||b.thr)continue;
      if(catPad(e,b)===1-pa){ b.vy=-CAT_V; b.vx=(pa===0?1:-1)*CAT_VX; b.onGround=false; b.stand=0; b.dj=false; b.coy=0; b.buf=0; b.air=0; b.thr=1; a.vy=0; e.cd=.7; e.tl=pa?-1:1; Snd.whoosh&&Snd.whoosh(); break } } }
 },
 hit(){ return null },
 draw(e,c,th){
  const x=e.x, w=2*e.pw+e.gap, y=e.y, cx=x+w/2;
  c.save(); c.lineJoin='round'; c.lineCap='round'; c.strokeStyle='#000'; c.lineWidth=2.6;
  c.fillStyle='#6b5a44'; c.beginPath(); c.moveTo(cx-12,y); c.lineTo(cx+12,y); c.lineTo(cx,y-14); c.closePath(); c.fill(); c.stroke();
  c.save(); c.translate(cx,y-14); c.rotate(e.tl*.16); c.fillStyle='#b9854a'; c.fillRect(-w/2,-6,w,9); c.strokeRect(-w/2,-6,w,9); c.fillStyle='#0003'; for(let i=-w/2+8;i<w/2-8;i+=14)c.fillRect(i,-4,2,5);
  for(const side of [-1,1]){ const px=side*(e.pw/2+e.gap/2); c.fillStyle='#ffd23f'; c.fillRect(px-e.pw/2+4,-12,e.pw-8,7); c.strokeRect(px-e.pw/2+4,-12,e.pw-8,7); }
  c.restore();
  const bob=Math.sin(G.t*5)*2; c.fillStyle='#ffd23f'; for(const px of [x+e.pw/2,x+e.pw*1.5+e.gap]){ c.beginPath(); c.moveTo(px-6,y-44+bob); c.lineTo(px+6,y-44+bob); c.lineTo(px,y-35+bob); c.closePath(); c.fill(); c.stroke() }
  c.restore() }};

const mkBar=(gid,o)=>Object.assign({t:'cbar',gid,g2:0,x:0,w:22,v:0,off:0,always:1},o);
B.cbar={
 upd(e,dt){ const E=L.cgE; if(E&&(E[e.gid]===1||(e.g2&&E[e.g2]===1)))e.off=.5; else if(e.off>0)e.off-=dt },      // after the plate is released the barrier stays off for half a second: a little slack for the lag of a link and for human reflexes
 hit(e){ if(e.off>0)return null; const pr=prect(); return pr.x+pr.w>e.x&&pr.x<e.x+e.w?['laser','zap','saw'][e.v|0]:null },
 draw(e,c,th){
  const on=!(e.off>0), a=cgEase('bar'+e.gid+':'+e.x,on?1:0), x=e.x, w=e.w, cx=x+w/2, col=cgCol(e.gid);
  c.save(); c.lineJoin='round'; c.lineCap='round'; c.strokeStyle='#000'; c.lineWidth=2.4;
  if(a>.03){ c.globalAlpha=a;
    if(e.v===0){ for(let i=0;i<5;i++){ const yy=22+i*((GY-30)/4.2)+Math.sin(G.t*6+i)*2; c.strokeStyle='#ff2d4d'; c.lineWidth=4; c.beginPath(); c.moveTo(cx-w/2-4,yy); c.lineTo(cx+w/2+4,yy); c.stroke(); c.strokeStyle='#ffd0d8'; c.lineWidth=1.4; c.stroke() } }
    else if(e.v===1){ for(let k=0;k<2;k++){ c.strokeStyle=k?'#d9f4ff':'#4dd0ff'; c.lineWidth=k?1.6:4; c.beginPath(); c.moveTo(cx,22); for(let yy=22;yy<GY-8;yy+=18)c.lineTo(cx+Math.sin(G.t*40+yy*.7+k)*w*.5,yy+9); c.lineTo(cx,GY-8); c.stroke() } }
    else { for(let yy=GY-24;yy>16;yy-=44){ c.save(); c.translate(cx,yy); c.rotate(G.t*9+yy); c.fillStyle='#cfd5e0'; c.strokeStyle='#000'; c.lineWidth=2.4; c.beginPath(); for(let i=0;i<14;i++){ const aa=i/14*Math.PI*2, rr=i%2?15:22; c.lineTo(Math.cos(aa)*rr,Math.sin(aa)*rr) } c.closePath(); c.fill(); c.stroke(); c.fillStyle='#e04b4b'; c.beginPath(); c.arc(0,0,6,0,7); c.fill(); c.stroke(); c.restore() } }
    c.globalAlpha=1 }
  c.fillStyle=col; for(const yy of [0,GY-6]){ c.fillRect(cx-16,yy,32,yy?14:20); c.strokeRect(cx-16,yy,32,yy?14:20) }
  c.fillStyle=on?'#ff4d5e':'#35d07f'; c.beginPath(); c.arc(cx,10,4.5,0,7); c.fill(); c.stroke();
  c.restore() }};

const tunnel=(L,tx0,tx1)=>{ for(let tx=tx0;tx<=tx1;tx++)for(let k=4;k<=7;k++)blk(L,tx,GR-k) };          // a low ceiling of four block rows: 96 px of headroom, so nobody can hop over what runs in it
const ledgeSync=(L,g,x)=>{ L.ents.push(mkPlat(newId(L),'static',(x+11)*TS,GY-72,3*TS,{})); L.ents.push(mkPlate(g,(x+12)*TS-4,GY-72,TS*1.8,{all:1,lat:1})) };     // the upper plate of a sync pair (reached with an ordinary jump)

Object.assign(COV,{
 catapult(L,x,o){ const g=newId(L), pt=o.pt|0, sz=o.sz|0, px=x+7, ex=px+5, H=([6,7,7][sz]||6), Hw=([5,6,7][sz]||5), wx=ex+3, lw=([3,3,2][sz]||3);
  coCp(L,x);
  coSign(L,x+2,[ 'منجنيق! 🎯\nواحد يوقف على طرف اللوح\nوالتاني يقفز على الطرف التاني فيطير رفيقه لفوق\nعلى الرف في رافعة',
                 'حيط عالي! 🧱 فيه باب من تحت\nواحد يوقف على طرف اللوح والتاني يقفز على الطرف التاني\nمين بيطير فوق الحيط بيشدّ الرافعة',
                 'المفتاح فوق الرف! 🔑\nواحد يوقف على طرف اللوح والتاني يقفز على الطرف التاني\nوالباب بيستنى المفتاح' ][pt],8);
  L.ents.push(mkCat(px*TS,{}));
  if(pt===0){ for(let c2=0;c2<lw;c2++)blk(L,ex+c2,GR-H); L.ents.push(mkLever(g,(ex+lw-1)*TS+16,(GR-H)*TS), mkGate(g,ex+9,1,0,GR-1,'door')) }
  else if(pt===1){ for(let k=3;k<=Hw;k++){ blk(L,wx,GR-k); blk(L,wx+1,GR-k) } L.ents.push(mkGate(g,wx,2,GR-2,GR-1,'door'), mkLever(g,(wx+4)*TS+16,GY)) }
  else { for(let c2=0;c2<lw;c2++)blk(L,ex+c2,GR-H); coKey(L,g,ex+lw/2,(GR-H)*TS-18); L.ents.push(mkGate(g,ex+9,1,0,GR-1,'lock',0)) }
  coCpEnd(L,ex+14); return 22 },
 boulder(L,x,o){ const g=newId(L), r=[40,52,64][o.sz]||40, sp=[95,115,135][o.sz]||95, pt=o.pt|0, T=[[9,8,7],[11,10,9],[12,11,10]][pt][o.sz|0]||9, gx=x+18, pit=gx+2, first=(x+(pt?9:8))*TS;
  coCp(L,x);
  coSign(L,x+2,[ 'صخرة عملاقة جاية! 😱\nكبسوا الزرّين مع بعض قبل ما توصل\nواحد تحت وواحد فوق\nبيفتح الباب وبتطلع الصخرة',
                 'الصخرة ما بتوقف! 🪨\nطلّع رفيقك على الرف العالي (واحد على راس التاني)\nوهو يشدّ الرافعة',
                 'الرف عالي كتير! 😱\nاحمل رفيقك (S أو ⬇ - 🤲 بالموبايل) وارميه فوق\nوهو يشدّ الرافعة' ][pt],8);
  if(pt===0){ L.ents.push(mkPlate(g,(x+8)*TS,GY,TS*1.8,{all:1,lat:1})); ledgeSync(L,g,x) }
  else if(pt===1){ for(let c2=0;c2<4;c2++)blk(L,x+10+c2,GR-5); L.ents.push(mkLever(g,(x+13)*TS+16,(GR-5)*TS)) }
  else { for(let c2=0;c2<3;c2++)blk(L,x+10+c2,GR-6); L.ents.push(mkLever(g,(x+12)*TS+16,(GR-6)*TS)) }
  L.ents.push(mkGate(g,gx,1,0,GR-1,'door'));
  cutPit(L,pit,3);
  L.ents.push(mkBould(g,{r,sp,y:GY-r,x:first-r-sp*T,xB:(x+2)*TS,xR:gx*TS-r,x1:(pit+1.5)*TS,trig:(x+4)*TS}));
  coCpEnd(L,pit+8); return 30 },
 ceil(L,x,o){ const g=newId(L), pt=o.pt|0, sz=o.sz|0, vd=[[140,125,110],[170,155,150],[45,55,65]][pt][sz]||100, s=[5,6,7][sz]||5, Z=pt===0?[12,14,16][sz]:(pt===1?3*s+2:12), zx=x+5;
  coCp(L,x);
  coSign(L,x+2,[ 'السقف رح ينزل! 😰\nواحد يوقف على الزر ويسنده\nوالتاني يمشي ويشدّ الرافعة اللي بآخر الممر',
                 'السقف بيرجع بينزل إذا ما في حدا واقف على زر!\nتناوبوا من زر لزر 🤝 وما تتركوه لحاله\nوبالآخر الرافعة',
                 'كبسوا الزرّين بسرعة! ⏱ السقف نازل\nواحد تحت وواحد على الرف' ][pt],8);
  L.ents.push(pt===2?mkGate(g,zx+Z,1,0,GR-1,'door'):mkGate(g,zx,0,0,0,'none',0));      // pattern 2 has a door at the end of the hall: the sync is the only way through
  if(pt===0){ L.ents.push(mkPlate(g,(x+6)*TS,GY,TS*1.8), mkLever(g,(zx+Z-1)*TS+16,GY)) }
  else if(pt===1){ for(let i=0;i<3;i++)L.ents.push(mkPlate(g,(x+6+i*s)*TS,GY,TS*1.8)); L.ents.push(mkLever(g,(x+6+3*s)*TS+16,GY)) }
  else { L.ents.push(mkPlate(g,(x+7)*TS,GY,TS*1.8,{all:1,lat:1})); ledgeSync(L,g,x) }
  L.ents.push(mkCeilP(g,{x:zx*TS,w:Z*TS,vd,vu:pt===1?60:140,trig:pt===2?zx*TS:(x+8)*TS}));
  coCpEnd(L,zx+Z+3); return Z+10 },
 rsaw(L,x,o){ const pt=o.pt|0, sz=o.sz|0, r=[40,44,48][sz]||40, sp=[80,100,120][sz]||80, ln=[7,8,9][sz]||7, cy=GY-96, yu=cy-r+2, yd=GY-r+2;      // cy = the underside of the ceiling
  coCp(L,x);
  coSign(L,x+2,[ 'منشار عملاق بالنفق! 🪚\nواحد يوقف على الزر فيرتفع المنشار\nوالتاني يعبر ويشدّ الرافعة',
                 'منشارين! 🪚🪚 الأول بيرتفع بمجرد الدعسة\nأما التاني فلازم حدا يضل واقف على زرّه\nوبعدين الرافعة',
                 'منشارين على نفس الزر! 🪚🪚\nواحد يوقف على الزر الأول وتاني يعبر للزر التاني\nناوبوا بعض لحد الرافعة 🤝' ][pt]||'منشار عملاق بالنفق! 🪚',8);
  const saw=(g,tx0)=>{ tunnel(L,tx0,tx0+ln-1); if(!L.ents.some(e=>e.t==='cgate'&&e.gid===g))L.ents.push(mkGate(g,tx0,0,0,0,'none',0)); L.ents.push( mkRsaw(g,{r,sp,x0:(tx0+1.6)*TS,x1:(tx0+ln-1.6)*TS,x:(tx0+ln/2)*TS,y:yd,yd,yu,cy})) };
  if(pt===2){ const g=newId(L), t2=x+7, t3=t2+ln+4;                                    // one gate for both saws: two plates, passed from hand to hand
    L.ents.push(mkPlate(g,(x+4)*TS,GY,TS*1.8)); saw(g,t2);
    L.ents.push(mkPlate(g,(t2+ln+1)*TS,GY,TS*1.8)); saw(g,t3);
    L.ents.push(mkLever(g,(t3+ln+2)*TS+16,GY)); coCpEnd(L,t3+ln+5); return t3+ln+7-x }
  if(pt===1){ const g1=newId(L), g2=newId(L), t1=x+7, t2=t1+ln+4;
    L.ents.push(mkPlate(g1,(x+4)*TS,GY,TS*1.8,{lat:1})); saw(g1,t1);
    L.ents.push(mkPlate(g2,(t1+ln+1)*TS,GY,TS*1.8)); saw(g2,t2);
    L.ents.push(mkLever(g2,(t2+ln+2)*TS+16,GY)); coCpEnd(L,t2+ln+5); return t2+ln+7-x }
  const g=newId(L), t1=x+7; L.ents.push(mkPlate(g,(x+4)*TS,GY,TS*1.8)); saw(g,t1);
  L.ents.push(mkLever(g,(t1+ln+2)*TS+16,GY)); coCpEnd(L,t1+ln+5); return t1+ln+7-x },

 opm(L,x,o){ const n=[2,3,3][o.sz|0]||2, sp=[6,4,3][o.sz|0]||6, pt=o.pt|0, gm=newId(L), gs=[], map=[...Array(n).keys()].map(i=>pt===0?i:(pt===1?n-1-i:(i+1)%n));
  coCp(L,x);
  coSign(L,x+2,[ 'آلة المشغّل! 🎛\nواحد يوقف على الزر اللي لونه مثل لون الحاجز\nوالتاني يعدّي... وبعدين غيّروا الأزرار بالدور',
                 'الأزرار معكوسة هالمرة! 🔀\nشوفوا الألوان: زر كل حاجز مو قدّامه',
                 'الأزرار مخلوطة! 🌀\nاتفقوا مين بيشغّل ومين بيعدّي' ][pt],8);
  for(let i=0;i<n;i++)gs.push(newId(L));
  for(let i=0;i<n;i++){ L.ents.push(mkPlate(gs[map[i]],(x+4+i*2)*TS,GY,TS*1.5)); L.ents.push(mkGate(gs[i],x+10+i*sp,0,0,0,'none',0)) }       // plate i (from the left) switches barrier map[i] off
  for(let i=0;i<n;i++)L.ents.push(mkBar(gs[i],{x:(x+10+i*sp)*TS+5,w:22,v:pt,g2:gm}));
  const lx=x+10+(n-1)*sp+3; L.ents.push(mkGate(gm,lx,0,0,0,'none',0), mkLever(gm,lx*TS+16,GY));
  coCpEnd(L,lx+4); return lx+7-x },
});
for(const v of [['ceil',7,3,34],['rsaw',7,4,38],['boulder',6,5,32],['opm',6,5,30],['catapult',7,3,26]])COV_LIST.push(v);
Object.assign(CO_HW,{ceil:1.8,rsaw:1.8,boulder:2,opm:1.8,catapult:1.6});