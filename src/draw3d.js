/* =============== 2.5D LOOK (switch: S.look3d) ===============
   Pure presentation: physics, hit-boxes and level generation are untouched.
   - heroes can be AI-rendered "clay 3D" sprites animated as paper-dolls (squash, lean, bob, break into slices)
   - ground tiles get a visible top plane, bevelled front faces and ambient occlusion
   - 3 background depth layers + fog + dust motes
   - dark ambient light with a lamp on the hero's hard hat and torch pools (kept bright enough to read traps)
   - blob shadow under the hero */
const HSPR={}, HMETA=A.heroMeta||{}, SPR_H=46;
for(const k in (A.hero||{})){ const im=new Image(),o={im,ok:false}; HSPR[k]=o; im.onload=()=>{o.ok=true;try{syncHeroes()}catch(e){}}; im.src=A.hero[k] }
const look3=()=>!!S.look3d&&Q.q>0;
const sprOf=id=>{const o=HSPR[id||S.hero];return o&&o.ok?o:null};
const hexRGB=h=>{h=h.replace('#','');return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]};
const mixc=(a,b,t,al)=>{const A1=hexRGB(a),B1=hexRGB(b);return 'rgba('+A1.map((v,i)=>Math.round(v+(B1[i]-v)*t)).join(',')+','+(al==null?1:al)+')'};

/* ---------- hero sprite ---------- */
function drawHeroSprite(c,st,id){
  const o=sprOf(id); if(!o)return false; id=id||S.hero; const m=HMETA[id]||{w:o.im.width,h:o.im.height,cx:.5};
  const h=SPR_H,w=h*m.w/m.h; let bob=0,lean=0,sx=1,sy=1;
  if(!st.dead){
    if(st.moving){bob=-Math.abs(st.rs)*2.8;lean=.11+st.rs*.07}
    else if(st.onGround){const b=Math.sin(G.t*3.2);sy=1+b*.02;sx=1-b*.014}
    else lean=clamp(-st.ey*.06,-.14,.14)-.04;
  }
  c.save();c.translate(0,bob);c.rotate(lean);c.scale(sx,sy);
  c.drawImage(o.im,-w*m.cx,-h,w,h);
  c.restore();
  if(st.dead){ // dizzy stars
    c.save();c.fillStyle='#ffd23f';c.strokeStyle='#000';c.lineWidth=1.2;
    for(let i=0;i<3;i++){const a=G.t*6+i*2.1,x=Math.cos(a)*9,y=-h-3+Math.sin(a)*2.5;c.beginPath();for(let k=0;k<10;k++){const r=k%2?1.6:3.6,an=k/10*Math.PI*2;c.lineTo(x+Math.cos(an)*r,y+Math.sin(an)*r)}c.closePath();c.fill();c.stroke()}
    c.restore() }
  return true;
}
function drawHero(c,H,st){ if(look3()&&drawHeroSprite(c,st))return; H.draw(c,st) }
function heroSlices(c,tt,piece){ // sprite broken in 4 bands (hat / face / belly / feet) for the saw & fake-door deaths
  const o=sprOf(); if(!o||!look3())return false; const m=HMETA[S.hero]||{w:o.im.width,h:o.im.height,cx:.5},h=SPR_H,w=h*m.w/m.h,iw=o.im.width,ih=o.im.height;
  const cuts=[[0,.32,40,-210],[.32,.66,-70,-260],[.66,.88,25,-130],[.88,1,-35,-160]];
  for(const [f0,f1,vx,vy] of cuts){ const yc=-h*(1-(f0+f1)/2); piece(0,yc,vx,vy,()=>c.drawImage(o.im,0,ih*f0,iw,ih*(f1-f0),-w*m.cx,-h*(f1-f0)/2,w,h*(f1-f0))) }
  return true;
}
function heroThumb(cx,id){
  const o=sprOf(id); if(!o||!look3())return false; const m=HMETA[id]||{w:o.im.width,h:o.im.height,cx:.5},h=62,w=h*m.w/m.h;
  cx.drawImage(o.im,-w*m.cx,-h-1,w,h); return true;
}

/* ---------- palette cache ---------- */
const PAL3={};
function pal3(th){
  const k=th.bg; if(PAL3[k])return PAL3[k];
  return PAL3[k]={
    bgTop:mixc(th.bg,'#000000',.6),bgMid:mixc(th.bg,'#000000',.15),bgBot:mixc(th.bg,th.brick,.4),
    far:mixc(th.bg,th.brick,.7),farDark:mixc(th.bg,'#000000',.55),farEdge:mixc(th.brick2,'#ffffff',.18,.35),
    fTop:mixc(th.floor,'#ffffff',.22),fBot:mixc(th.floor,'#000000',.55),fTop2:mixc(th.floor2,'#ffffff',.22),fBot2:mixc(th.floor2,'#000000',.55),
    topFar:mixc(th.top,'#000000',.38),topNear:th.top,lip:mixc(th.top,'#ffffff',.38),
    fog:mixc(th.brick2,th.torch,.18,.16)};
}
const FAR3={};
function farLayer(th,seed){
  const key=th.bg+seed; if(FAR3[key])return FAR3[key]; const P3=pal3(th),r=mulberry32(seed+77);
  const w=1024,h=VH,cvs=document.createElement('canvas');cvs.width=w;cvs.height=h;const x=cvs.getContext('2d');
  const n=4,bw=w/n;
  x.fillStyle=P3.far;x.fillRect(0,0,w,h);
  for(let i=0;i<n;i++){ const x0=i*bw,ax=x0+30,aw=bw-60,top=50+Math.floor(r()*26);
    // deep hall seen through the arch: lit warm at the bottom, black at the top
    const g=x.createLinearGradient(0,top,0,h);g.addColorStop(0,mixc(th.bg,'#000000',.7));g.addColorStop(.6,mixc(th.bg,th.torch,.10));g.addColorStop(1,mixc(th.bg,th.torch,.30));
    x.fillStyle=g;x.beginPath();x.moveTo(ax,h);x.lineTo(ax,top+aw/2);x.arc(ax+aw/2,top+aw/2,aw/2,Math.PI,0);x.lineTo(ax+aw,h);x.closePath();x.fill();
    // inner far pillars (even deeper)
    x.fillStyle=mixc(th.bg,'#000000',.45);x.fillRect(ax+aw*.3,top+aw/2+30,10,h);x.fillRect(ax+aw*.66,top+aw/2+30,10,h);
    x.strokeStyle=mixc(th.brick2,'#ffffff',.28,.6);x.lineWidth=4;x.beginPath();x.moveTo(ax,h);x.lineTo(ax,top+aw/2);x.arc(ax+aw/2,top+aw/2,aw/2,Math.PI,0);x.lineTo(ax+aw,h);x.stroke();
    // pillar between bays (lit from the left)
    const px=x0+bw-30,pg=x.createLinearGradient(px,0,px+60,0);pg.addColorStop(0,mixc(th.brick2,'#ffffff',.2));pg.addColorStop(.35,P3.far);pg.addColorStop(1,mixc(th.bg,'#000000',.5));
    x.fillStyle=pg;x.fillRect(px,top+aw/2-14,60,h);x.fillStyle=mixc(th.brick2,'#ffffff',.15);x.fillRect(px-6,top+aw/2-22,72,14);
    if(r()<.6){const cx=ax+aw*(.25+r()*.5);x.strokeStyle=mixc(th.brick2,'#ffffff',.3,.7);x.lineWidth=3;x.setLineDash([6,5]);x.beginPath();x.moveTo(cx,0);x.lineTo(cx,top+40+r()*60);x.stroke();x.setLineDash([])}
  }
  const mv=x.createLinearGradient(0,0,0,h);mv.addColorStop(0,'rgba(0,0,0,.6)');mv.addColorStop(.5,'rgba(0,0,0,.1)');mv.addColorStop(1,'rgba(0,0,0,.28)');x.fillStyle=mv;x.fillRect(0,0,w,h);
  const fg=x.createLinearGradient(0,GY-120,0,GY);fg.addColorStop(0,'#0000');fg.addColorStop(1,P3.fog);x.fillStyle=fg;x.fillRect(0,GY-120,w,120);
  return FAR3[key]=cvs;
}
function drawBg3(c,th,cam){
  const P3=pal3(th);
  const far=farLayer(th,(L.n||1)*31+7),fo=-((cam*.18)%1024);for(let x=fo-1024;x<VW+1024;x+=1024)c.drawImage(far,x,0);
  // wall bricks: only a texture on top of the hall, so the arches still read as openings
  if(Q.q>=2){const pw=256,off=-((cam*.45)%pw);c.globalAlpha=.22;for(let x=off-pw;x<VW+pw;x+=pw){c.drawImage(themeBg,x,0);c.drawImage(themeBg,x,224)}c.globalAlpha=1}
}

/* ---------- ground: top plane + bevelled faces ---------- */
function drawFloor3(c,th,x0,x1){
  const P3=pal3(th),H=VH-GY;
  const gA=c.createLinearGradient(0,GY,0,VH);gA.addColorStop(0,P3.fTop);gA.addColorStop(.35,th.floor);gA.addColorStop(1,P3.fBot);
  const gB=c.createLinearGradient(0,GY,0,VH);gB.addColorStop(0,P3.fTop2);gB.addColorStop(.35,th.floor2);gB.addColorStop(1,P3.fBot2);
  const gTop=c.createLinearGradient(0,GY-9,0,GY);gTop.addColorStop(0,P3.topFar);gTop.addColorStop(1,P3.topNear);
  const gAO=c.createLinearGradient(0,GY+4,0,GY+22);gAO.addColorStop(0,'rgba(0,0,0,.5)');gAO.addColorStop(1,'rgba(0,0,0,0)');
  for(let tx=x0;tx<=x1;tx++){ if(tx<0||tx>=L.w)continue; const cr=L.cr[tx]; if(L.ground[tx]<0||(cr&&cr.s===2))continue;
    let ox=0,oy=0; if(cr&&cr.s===1){ox=(Math.random()-.5)*2.4;oy=(Math.random()-.5)*1.6}
    const x=tx*TS+ox,y=GY+oy,zz=zoneAt(tx*TS+16),ice=zz&&zz.type==='ice';
    // front face
    c.fillStyle=tx%2?gA:gB;c.fillRect(x,y,TS,H);
    for(let r=0;r<3;r++){const by=y+r*TS; c.fillStyle='rgba(255,255,255,.09)';c.fillRect(x+1,by+1,TS-2,2);c.fillRect(x+1,by+1,2,TS-2);
      c.fillStyle='rgba(0,0,0,.22)';c.fillRect(x+1,by+TS-3,TS-2,2);c.fillRect(x+TS-3,by+1,2,TS-2);
      c.strokeStyle=th.line;c.lineWidth=1.6;c.strokeRect(x+.8,by+.8,TS-1.6,TS-1.6)}
    c.fillStyle=gAO;c.fillRect(x,y+4,TS,18);
    // top plane (the ground you walk on, seen slightly from above)
    c.fillStyle=ice?'#bfeaff':gTop;c.fillRect(x,y-9,TS,9);
    c.fillStyle='rgba(0,0,0,.28)';c.fillRect(x,y-9,TS,1.6);
    c.fillStyle=ice?'#ffffff':P3.lip;c.fillRect(x,y-1.5,TS,4.5);
    c.fillStyle='rgba(0,0,0,.75)';c.fillRect(x,y+3,TS,1.6);
    const h=(tx*2654435761>>>0)%7;if(!ice){ // grass tufts / pebbles on the plane
      if(h<3){c.fillStyle=th.top;c.beginPath();c.moveTo(x+5+h*8,y-4);c.lineTo(x+7.5+h*8,y-11);c.lineTo(x+10+h*8,y-4);c.fill();}
      else if(h<5){c.fillStyle='rgba(255,255,255,.18)';c.beginPath();c.ellipse(x+10+h*3,y-5,3,1.6,0,0,7);c.fill()} }
    if(cr&&(cr.marked||cr.s===1)){c.strokeStyle='#000b';c.lineWidth=2;c.beginPath();c.moveTo(x+6,y-2);c.lineTo(x+14,y+9);c.lineTo(x+10,y+17);c.lineTo(x+20,y+30);c.moveTo(x+22,y-2);c.lineTo(x+18,y+8);c.stroke()}
    // slab edges next to a gap: darker bevel so the pit reads as a hole with depth
    if(tx>0&&(L.ground[tx-1]<0||(L.cr[tx-1]&&L.cr[tx-1].s===2))){c.fillStyle='rgba(0,0,0,.35)';c.fillRect(x,y-9,3,9+H)}
    if(tx<L.w-1&&(L.ground[tx+1]<0||(L.cr[tx+1]&&L.cr[tx+1].s===2))){c.fillStyle='rgba(0,0,0,.35)';c.fillRect(x+TS-3,y-9,3,9+H)}
  }
}

/* ---------- shadows + light ---------- */
function drawShadows3(c){
  if(G.state==='dead'&&['pit','crumble'].includes(G.cause))return;
  const px=P.x+PW/2,tx=Math.floor(px/TS); if(!(tx>=0&&tx<L.w&&solidFloor(L,tx)))return;
  const hgt=Math.max(0,GY-(P.y+PH)),k=clamp(1-hgt/230,.25,1);
  c.save();c.fillStyle='rgba(0,0,0,'+(.42*k)+')';c.beginPath();c.ellipse(px,GY-4,13*k,3.4*k,0,0,7);c.fill();
  c.fillStyle='rgba(0,0,0,'+(.2*k)+')';c.beginPath();c.ellipse(px,GY-4,19*k,5*k,0,0,7);c.fill();c.restore();
}
let LC3=null;
function drawLight3(c,cam,th){
  if(window.NOLIGHT3)return;
  if(Q.q<=1){drawVig3(c);return}
  const kk=Q.q>=3?2:3; if(!LC3||LC3.k!==kk){LC3=document.createElement('canvas');LC3.width=Math.round(VW/kk);LC3.height=Math.round(VH/kk);LC3.k=kk}
  const l=LC3.getContext('2d');l.setTransform(1,0,0,1,0,0);l.globalCompositeOperation='source-over';l.clearRect(0,0,LC3.width,LC3.height);
  const dark=G.state==='title'?.4:.5;l.fillStyle='rgba(5,2,14,'+dark+')';l.fillRect(0,0,LC3.width,LC3.height);
  const vg=l.createRadialGradient(LC3.width/2,LC3.height*.52,LC3.height*.45,LC3.width/2,LC3.height*.52,LC3.width*.62);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.4)');l.fillStyle=vg;l.fillRect(0,0,LC3.width,LC3.height);
  l.globalCompositeOperation='destination-out';l.setTransform(1/kk,0,0,1/kk,0,0);
  const pool=(x,y,r,a)=>{const g=l.createRadialGradient(x,y,r*.08,x,y,r);g.addColorStop(0,'rgba(0,0,0,'+a+')');g.addColorStop(.55,'rgba(0,0,0,'+a*.62+')');g.addColorStop(1,'rgba(0,0,0,0)');l.fillStyle=g;l.fillRect(x-r,y-r,r*2,r*2)};
  const hx=P.x+PW/2-cam,hy=P.y+4; if(G.state!=='dead'||G.deadT<.5)pool(hx,hy,250,1);
  for(const tx of L.torches){const x=tx*TS+16-cam;if(x<-170||x>VW+170)continue;pool(x,150,170,.9)}
  pool(exitPx()+16-cam,GY-30,120,.7);
  l.globalCompositeOperation='source-over';
  c.drawImage(LC3,0,0,VW,VH);
  // warm lamp bloom
  if(G.state!=='dead'){c.save();c.globalCompositeOperation='lighter';const g=c.createRadialGradient(hx,hy,2,hx,hy,120);g.addColorStop(0,'rgba(255,214,120,.26)');g.addColorStop(1,'rgba(255,214,120,0)');c.fillStyle=g;c.fillRect(hx-120,hy-120,240,240);c.restore()}
}
function drawMotes3(c,cam){ // near-camera dust: moves faster than the world → depth
  if(Q.q<=1)return; c.save();c.fillStyle='rgba(255,240,210,.22)';
  for(let i=0;i<(Q.q>=3?26:10);i++){const sp=1.25+(i%4)*.22,x=(((i*173.7)-cam*sp+G.t*(6+i%5))%(VW+60)+(VW+60))%(VW+60)-30,y=30+((i*91.3+Math.sin(G.t*.6+i)*14)%(VH-90)),r=.9+(i%3)*.55;c.beginPath();c.arc(x,y,r,0,7);c.fill()}
  c.restore();
}

/* cheapest "light": one pre-baked vignette (used on weak phones) */
let VIG3=null;
function drawVig3(c){
  if(!VIG3){VIG3=document.createElement('canvas');VIG3.width=VW/2;VIG3.height=VH/2;const g=VIG3.getContext('2d'),r=g.createRadialGradient(VW/4,VH*.26,VH*.2,VW/4,VH*.26,VW*.4);r.addColorStop(0,'rgba(5,2,14,.08)');r.addColorStop(1,'rgba(5,2,14,.6)');g.fillStyle=r;g.fillRect(0,0,VW/2,VH/2)}
  c.drawImage(VIG3,0,0,VW,VH);
}
