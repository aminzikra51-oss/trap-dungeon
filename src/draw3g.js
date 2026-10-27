/* =============== PAINTERS — traps v2 (clay look when look3(), flat boxes otherwise) =============== */
const flatBox=(c,x,y,w,h,col,mood)=>{c.fillStyle=col;c.strokeStyle='#000';c.lineWidth=2.4;c.fillRect(x,y,w,h);c.strokeRect(x,y,w,h);if(mood)face(c,x+w/2,y+h/2,.8,mood)};
const ease=t=>t<=0?0:t>=1?1:t*t*(3-2*t);
const camX=()=>Math.round(G.camX);
const heroDead=()=>Object.assign(heroState(),{dead:true,scream:true,onGround:false,moving:false,blink:false,ex:0,ey:0});
function hatFly(c,x,y,rot){ c.save();c.translate(x,y);c.rotate(rot);hat(c,0,.9);c.restore() }

/* ---------- mimic chest ---------- */
const mimicBase=()=>spr3('mimic_base',32,26,g=>{ box3(g,1,10,30,14,3,'#8b5a2b'); box3(g,6,10,4,14,1,'#e0b030',1); box3(g,22,10,4,14,1,'#e0b030',1); ball3(g,16,17,3.4,'#ffd23f',1.2) });
const mimicLid=()=>spr3('mimic_lid',32,14,g=>{ box3(g,1,1,30,12,5,'#9b6a36'); box3(g,6,1,4,12,1,'#e0b030',1); box3(g,22,1,4,12,1,'#e0b030',1) });
B.mimic.draw3=function(e,c,th){
  const kill=isK(e), t=G.deadT; let a=0,sh=0;
  if(kill) a=Math.max(0,.55*Math.abs(Math.sin(t*14))*Math.exp(-t*2.2));
  else if(e.st===1){a=.55*ease(1-e.tm/e.tele);sh=Math.sin(G.t*60)*1.4}
  else if(e.st===2)a=.95; else if(e.st===3)a=.95*Math.max(0,e.tm/.9);
  gsh3(c,e.x+15,17,.3);
  c.save();c.translate(e.x+15+sh,0); if(e.dir<0)c.scale(-1,1); c.translate(-15,0);       // local: chest faces right, top-left at (0,e.y)
  c.translate(0,e.y);
  blit3(c,mimicBase(),-1,0);
  if(a>.03){ c.fillStyle='#4a0f1a';c.fillRect(2,7,26,5);
    c.fillStyle='#ff7a9a';c.beginPath();c.ellipse(15,11,8,2.6,0,0,7);c.fill();
    c.fillStyle='#fff';c.strokeStyle='#000';c.lineWidth=1.1;for(let i=0;i<5;i++){c.beginPath();c.moveTo(4+i*5.2,10);c.lineTo(6.6+i*5.2,5.5);c.lineTo(9.2+i*5.2,10);c.closePath();c.fill();c.stroke()} }
  c.save();c.translate(2,10);c.rotate(-a);
  if(a>.03){ c.fillStyle='#fff';c.strokeStyle='#000';c.lineWidth=1.1;for(let i=0;i<5;i++){c.beginPath();c.moveTo(3+i*5.2,-1);c.lineTo(5.6+i*5.2,4.5);c.lineTo(8.2+i*5.2,-1);c.closePath();c.fill();c.stroke()} }
  blit3(c,mimicLid(),-3,-13);
  if(a>.25||kill){ c.fillStyle='#ffe14a';c.strokeStyle='#000';c.lineWidth=1.2;for(const ex of [10,21]){c.beginPath();c.ellipse(ex,-8,3.2,2.2,0,0,7);c.fill();c.stroke();c.fillStyle='#000';c.fillRect(ex-.6,-9.6,1.2,3.2);c.fillStyle='#ffe14a'} }
  c.restore();
  if(kill){                                    // the meal: two legs sticking out, then a burp and the hat flies off
    if(t<1.1){ const w=Math.sin(t*22)*.35, pal=heroDef().pal; c.lineWidth=2.2;c.strokeStyle='#000';
      for(const s of [-1,1]){ c.save();c.translate(28,6+s*3);c.rotate(-.6+w*s);c.fillStyle=pal.skin;c.fillRect(0,-1.6,12,3.2);c.strokeRect(0,-1.6,12,3.2);c.fillStyle=pal.feet;c.beginPath();c.ellipse(13,0,4.2,2.8,0,0,7);c.fill();c.stroke();c.restore() } }
    else { const u=t-1.1; hatFly(c,15+u*70,-10-(180*u-300*u*u),u*9); if(u<.5){ c.fillStyle='rgba(220,230,200,'+(1-u*2)+')';for(let i=0;i<3;i++){c.beginPath();c.arc(30+u*30+i*5,2-i*4-u*20,4+u*8,0,7);c.fill()} } } }
  c.restore();
};

/* ---------- mole ---------- */
B.mole.draw3=function(e,c,th){
  const v=e.st>=2?1:e.vis; if(v<.02)return;
  c.save();c.translate(e.x+(e.st===2?Math.sin(G.t*70)*1.3:0),GY);
  gsh3(c,0,16*v,.25*v);
  if(e.st<3||e.tm<.45){ const mv=e.st===3?Math.max(.4,e.tm/.45):1; blob3(c,0,1,(18*v+3)*mv,(10*v+1)*mv,'#7a5a3a',1.6,Math.PI,Math.PI*2);
    c.strokeStyle='rgba(30,16,8,.7)';c.lineWidth=1.5;c.beginPath();c.moveTo(-6,-2);c.lineTo(-3,-7*v);c.lineTo(1,-4*v);c.lineTo(5,-9*v);c.stroke();
    if(e.st===2){ c.fillStyle='#8a6a45';for(let i=0;i<6;i++){const k=((G.t*3.2+i*.19)%1);c.fillRect(-14+i*5.6+Math.sin(i*3)*3,-8-k*20,3,3)} } }
  if(e.st===3){ const d=e.dir||1, up=ease((.85-e.tm)/.12), sw=ease((.85-e.tm)/.16);
    c.save();c.translate(0,(1-up)*30);
    blob3(c,0,-15,13,17,'#5b3f2b',1.8); blob3(c,d*2,-12,8,10,'#8a6a52',0);
    ball3(c,d*10,-17,3.4,'#ff9bb0',1.2);
    c.fillStyle='#fff';c.strokeStyle='#000';c.lineWidth=1.4;for(const ex of [d*3,d*8]){c.beginPath();c.arc(ex,-24,3,0,7);c.fill();c.stroke();c.fillStyle='#000';c.beginPath();c.arc(ex+d*.9,-24,1.2,0,7);c.fill();c.fillStyle='#fff'}
    c.fillStyle='#fff';c.fillRect(d*8-2,-12,2,3.4);c.fillRect(d*8+.4,-12,2,3.4);
    hat(c,-31,.62);
    c.save();c.translate(d*9,-12);c.rotate(d*(-2.1+2.45*sw));c.strokeStyle='#000';c.lineWidth=3.6;c.beginPath();c.moveTo(0,0);c.lineTo(0,-22);c.stroke();c.strokeStyle='#9b6a36';c.lineWidth=1.8;c.stroke();
    c.translate(0,-22);box3(c,-9,-6,18,12,3,'#c98b45');c.restore();
    c.restore(); }
  c.restore();
};

/* ---------- frog ---------- */
B.frog.draw3=function(e,c,th){
  const kill=isK(e), t=G.deadT, u=kill?ease(t/.4):0, tl=kill?e.tl*(1-u):e.tl;
  const puffk=kill?(t<.4?0:.6+.4*Math.sin(t*10)*Math.exp(-(t-.4))):(e.st===1?ease(1-e.tm/e.tele):0);
  c.save();c.translate(e.x,GY);gsh3(c,0,19,.3); if(e.dir<0)c.scale(-1,1);
  blob3(c,-9,-5,10,7,'#3d9a42',1.4); blob3(c,0,-12,17,12,'#4caf50',1.8); blob3(c,4,-8,11,7,'#d9f0a8',0);
  const lk=clamp((pcx()-e.x)/60,-1,1)*(e.dir>0?1:-1);
  for(const ex of [2,9]){ ball3(c,ex,-24,5.4,'#4caf50',1.4); c.fillStyle='#ffe14a';c.beginPath();c.arc(ex,-24.5,3.4,0,7);c.fill();c.fillStyle='#000';c.beginPath();c.arc(ex+lk*1.3,-24.5,e.st>=1?1.1:1.7,0,7);c.fill() }
  blob3(c,13,-9,5+puffk*8,4+puffk*7,'#ffb3c1',1.4);
  c.strokeStyle='#1f5a24';c.lineWidth=1.8;c.beginPath();c.moveTo(6,-16);c.quadraticCurveTo(15,-13,20,-18);c.stroke();
  if(tl>1){ c.lineCap='round';c.strokeStyle='#000';c.lineWidth=11;c.beginPath();c.moveTo(14,-20);c.lineTo(14+tl,-20);c.stroke();c.strokeStyle='#ff7a9a';c.lineWidth=7;c.stroke();c.strokeStyle='#ffb3c1';c.lineWidth=2;c.beginPath();c.moveTo(16,-22);c.lineTo(12+tl,-22);c.stroke();ball3(c,14+tl,-20,6,'#ff7a9a',1.4) }
  if(kill&&t<.45){ c.save();c.translate(14+tl+3,-1);const s=1-.55*u;c.scale(s,s);drawHero(c,heroDef(),heroDead());c.restore() }
  if(kill&&t>1.1){ const w=t-1.1; hatFly(c,16+w*60,-26-(170*w-300*w*w),w*8) }
  c.restore();
};

/* ---------- fire jets (same painter in both looks) ---------- */
function drawJet(e,c){
  const x=e.x+16; c.save();
  if(look3()){ blit3(c,spr3('jet_grate',32,10,g=>{box3(g,1,2,30,8,2,'#4a4658');g.fillStyle='#16121e';for(let i=0;i<4;i++)g.fillRect(5+i*6,4,3.6,3.6)}),e.x,GY-8) }
  else { c.fillStyle='#4a4658';c.strokeStyle='#000';c.lineWidth=2.2;c.fillRect(e.x+1,GY-7,30,7);c.strokeRect(e.x+1,GY-7,30,7) }
  if(e.w){ c.fillStyle='rgba(255,70,40,'+(.35+.3*Math.abs(Math.sin(G.t*18)))+')';c.beginPath();c.ellipse(x,GY-7,15,4,0,0,7);c.fill();
    for(let i=0;i<3;i++){const k=((G.t*1.4+i*.33)%1);c.globalAlpha=(1-k)*.55;c.fillStyle='#6e6678';c.beginPath();c.arc(x+Math.sin(i*2+G.t*3)*5,GY-10-k*34,3+k*6,0,7);c.fill()} c.globalAlpha=1 }
  if(e.f>.02){ const hh=e.h*e.f;
    if(Q.q>=2){ const g=c.createRadialGradient(x,GY-hh*.45,6,x,GY-hh*.45,hh*.7);g.addColorStop(0,'rgba(255,150,40,.28)');g.addColorStop(1,'rgba(255,150,40,0)');c.fillStyle=g;c.fillRect(x-hh*.7,GY-hh*1.2,hh*1.4,hh*1.4) }
    for(const [w,col,k] of [[14,'#ff3d1a',1],[10.5,'#ff8a1f',.86],[6,'#ffe27a',.64]]){ const H=hh*k, wob=Math.sin(G.t*24+w)*3;
      c.fillStyle=col;c.beginPath();c.moveTo(x-w,GY-6);c.quadraticCurveTo(x-w-3+wob,GY-H*.45,x-w*.3,GY-H*.8);c.quadraticCurveTo(x+wob*.5,GY-H*1.05,x+wob*.3,GY-H);c.quadraticCurveTo(x+w+2-wob,GY-H*.55,x+w,GY-6);c.closePath();c.fill();
      if(w===14){c.strokeStyle='#000';c.lineWidth=2;c.stroke()} }
    c.fillStyle='#ffd23f';for(let i=0;i<4;i++){const k=((G.t*1.8+i*.25)%1);c.fillRect(x-12+i*8+Math.sin(i*5+G.t*4)*4,GY-k*hh*1.05,2.2,2.2)} }
  c.restore();
}
B.jet.draw3=B.jet.draw;

/* ---------- storm cloud ---------- */
function drawCloud(e,c){
  const cam=camX(), hot=e.st===1, strike=e.st===2&&e.tm>.14, wob=(e.st===0&&e.still>e.lim*.55)?Math.sin(G.t*60)*2:0, flash=hot&&Math.floor(G.t*14)%2===0;
  const x=e.x+wob, y=e.y; c.save();
  if(hot){ c.strokeStyle='rgba(255,70,50,'+(.5+.4*Math.sin(G.t*20))+')';c.lineWidth=2.6;c.beginPath();c.ellipse(e.lx,GY-2,26,6,0,0,7);c.stroke();c.setLineDash([5,5]);c.beginPath();c.moveTo(e.lx,y+20);c.lineTo(e.lx,GY-8);c.stroke();c.setLineDash([]) }
  const col=flash?'#9aa0c8':'#3b3a52';
  if(look3()){ for(const [dx,dy,rx,ry] of [[-30,4,24,15],[30,4,24,15],[0,-8,32,21],[0,8,38,12]])blob3(c,x+dx,y+dy,rx,ry,col,1.6); face3(c,x,y+3,1.5,hot||strike?'angry':'sly') }
  else { c.fillStyle=col;c.strokeStyle='#000';c.lineWidth=2.4;for(const [dx,dy,rx,ry] of [[-30,4,24,15],[30,4,24,15],[0,-8,32,21],[0,8,38,12]]){c.beginPath();c.ellipse(x+dx,y+dy,rx,ry,0,0,7);c.fill();c.stroke()} face(c,x,y+3,1.5,hot||strike?'angry':'sly') }
  if(e.st===0){ c.strokeStyle='rgba(120,180,255,.7)';c.lineWidth=2;for(let i=0;i<5;i++){const k=((G.t*1.6+i*.2)%1);c.beginPath();c.moveTo(x-30+i*15,y+22+k*60);c.lineTo(x-32+i*15,y+30+k*60);c.stroke()} }
  if(wob){ c.fillStyle='#ffe14a';for(let i=0;i<3;i++)c.fillRect(x-20+i*20+Math.sin(G.t*40+i)*4,y+24+((G.t*50+i*9)%14),2.6,2.6) }
  if(strike){ c.lineJoin='miter';const x1=e.lx,n=9;
    for(const [w,cl] of [[9,'rgba(255,240,120,.4)'],[4.4,'#fff6a0'],[1.8,'#fff']]){ c.strokeStyle=cl;c.lineWidth=w;c.beginPath();c.moveTo(x,y+20);
      for(let i=1;i<n;i++){const k=i/n,j=Math.sin(i*12.9+Math.floor(G.t*40)*5.1)*13;c.lineTo(x+(x1-x)*k+j,y+20+(GY-y-20)*k)}c.lineTo(x1,GY);c.stroke() }
    c.fillStyle='rgba(255,255,255,'+(.3*(e.tm-.14)/.18)+')';c.fillRect(cam-10,0,VW+20,VH) }
  c.restore();
}
B.cloud.draw3=B.cloud.draw;

/* ---------- electric floor ---------- */
function drawElec(e,c){
  c.save();
  for(const sx of [e.x-9,e.x+e.n*TS+1]){ if(look3()){box3(c,sx,GY-26,8,26,2,'#5b6178')}else{c.fillStyle='#5b6178';c.strokeStyle='#000';c.lineWidth=2;c.fillRect(sx,GY-26,8,26);c.strokeRect(sx,GY-26,8,26)}
    c.fillStyle=Math.floor(G.t*5)%2?'#7fe8ff':'#ffe14a';c.beginPath();c.arc(sx+4,GY-29,4,0,7);c.fill();c.strokeStyle='#000';c.lineWidth=1.4;c.stroke() }
  const cam=camX();
  for(let i=0;i<e.n;i++){ const x=e.x+i*TS; if(x<cam-40||x>cam+VW+40)continue; const s=elecState(e,i);
    c.fillStyle=s===2?'#bff4ff':(s===1?(Math.floor(G.t*11)%2?'#ffe14a':'#8a7a22'):'#2c2b3a');c.fillRect(x+2,GY-5,TS-4,5);
    c.strokeStyle='#000';c.lineWidth=1.6;c.strokeRect(x+2,GY-5,TS-4,5);
    if(s===0){c.fillStyle='#ffe14a66';for(let k=0;k<3;k++)c.fillRect(x+5+k*8,GY-4,4,3)}
    if(s===2){ c.fillStyle='rgba(120,230,255,.2)';c.fillRect(x+1,GY-34,TS-2,30);
      c.strokeStyle='#fff';c.lineWidth=1.8;c.lineJoin='miter';for(let q=0;q<2;q++){c.beginPath();c.moveTo(x+4,GY-5);for(let k=1;k<=5;k++)c.lineTo(x+4+k*4.8,GY-5-6-Math.sin((i*5+q*3+k*2.3)+Math.floor(G.t*30)*3.1)*8-q*8);c.stroke()}
      if(Q.q>=2){c.fillStyle='rgba(120,230,255,.18)';c.beginPath();c.ellipse(x+16,GY-3,26,7,0,0,7);c.fill()} }
    else if(s===1){ c.fillStyle='rgba(255,225,74,.16)';c.fillRect(x+2,GY-26,TS-4,21) } }
  c.restore();
}
B.elec.draw3=B.elec.draw;

/* ---------- rotating laser beam ---------- */
function drawBeam(e,c){
  const ca=Math.cos(e.a),sa=Math.sin(e.a); c.save();
  if(Q.q>=2){ c.strokeStyle='rgba(255,90,90,.12)';c.lineWidth=1.6;c.setLineDash([3,7]);c.beginPath();c.arc(e.x,e.y,e.R,0,7);c.stroke();c.setLineDash([]) }
  if(look3()) box3(c,e.x-6,e.y,12,GY-e.y,3,'#5b6178'); else {c.fillStyle='#5b6178';c.strokeStyle='#000';c.lineWidth=2.2;c.fillRect(e.x-6,e.y,12,GY-e.y);c.strokeRect(e.x-6,e.y,12,GY-e.y)}
  const x0=e.x-ca*e.R,y0=e.y-sa*e.R,x1=e.x+ca*e.R,y1=e.y+sa*e.R;
  c.lineCap='round';
  for(const [w,col] of [[9,'rgba(255,60,60,.26)'],[3.6,'#ff5a5a'],[1.4,'#ffffff']]){c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke()}
  c.fillStyle='#fff';for(const [x,y] of [[x0,y0],[x1,y1]]){c.beginPath();c.arc(x,y,2.6+Math.sin(G.t*30)*.7,0,7);c.fill()}
  if(look3())ball3(c,e.x,e.y,8.5,'#ff4a4a',1.6); else {c.fillStyle='#ff4a4a';c.strokeStyle='#000';c.lineWidth=2.2;c.beginPath();c.arc(e.x,e.y,8.5,0,7);c.fill();c.stroke()}
  c.fillStyle='#fff';c.beginPath();c.arc(e.x+ca*3,e.y+sa*3,2.2,0,7);c.fill();
  c.restore();
}
B.beam.draw3=B.beam.draw;

/* ---------- minecart train ---------- */
function drawTrain(e,c){
  const cam=camX();
  if(e.st===1){ const ex=clamp(e.dir>0?e.x0:e.x1,cam+28,cam+VW-28), bl=Math.floor(G.t*9)%2===0;
    c.save();c.translate(ex,GY-76);c.fillStyle=bl?'#ff4a4a':'#ffd23f';c.strokeStyle='#000';c.lineWidth=3;c.beginPath();c.moveTo(0,-24);c.lineTo(24,18);c.lineTo(-24,18);c.closePath();c.fill();c.stroke();
    c.fillStyle='#000';c.font='900 26px Arial';c.textAlign='center';c.fillText('!',0,13);
    c.fillStyle=bl?'#ff4a4a':'#ffd23f';c.beginPath();c.moveTo(e.dir*42,-2);c.lineTo(e.dir*26,-12);c.lineTo(e.dir*26,8);c.closePath();c.fill();c.stroke();c.restore();
    return }
  if(e.st!==2)return;
  const rot=e.x*.09; c.save();c.translate(e.x+e.w/2,0);c.scale(e.dir,1);c.translate(-e.w/2,0);
  const wheel=(wx)=>{ if(look3())ball3(c,wx,GY-7,7,'#3a3748',1.4); else {c.fillStyle='#3a3748';c.strokeStyle='#000';c.lineWidth=2;c.beginPath();c.arc(wx,GY-7,7,0,7);c.fill();c.stroke()}
    c.strokeStyle='#bbb';c.lineWidth=1.6;c.beginPath();c.moveTo(wx+Math.cos(rot)*5,GY-7+Math.sin(rot)*5);c.lineTo(wx-Math.cos(rot)*5,GY-7-Math.sin(rot)*5);c.stroke() };
  for(const cx0 of [0,66]){ if(look3())box3(c,cx0,GY-34,62,26,3,'#5b6178'); else flatBox(c,cx0,GY-34,62,26,'#5b6178');
    c.fillStyle='#1d1b27';for(let i=0;i<5;i++){c.beginPath();c.arc(cx0+8+i*11,GY-36-(i%2)*2,6,Math.PI,0);c.fill()}
    wheel(cx0+14);wheel(cx0+48) }
  c.fillStyle='#2a2733';c.fillRect(62,GY-18,4,4);
  if(look3())box3(c,132,GY-38,64,32,4,'#c0392b'); else flatBox(c,132,GY-38,64,32,'#c0392b');
  if(look3())box3(c,140,GY-52,12,16,2,'#3a3748'); else flatBox(c,140,GY-52,12,16,'#3a3748');
  for(let i=0;i<3;i++){c.globalAlpha=.5-.12*i;c.fillStyle='#8c8498';c.beginPath();c.arc(146-i*12,GY-58-i*10-((G.t*40)%8),5+i*3,0,7);c.fill()} c.globalAlpha=1;
  c.fillStyle='#ffd23f';c.strokeStyle='#000';c.lineWidth=2;c.beginPath();c.moveTo(196,GY-6);c.lineTo(210,GY-6);c.lineTo(196,GY-22);c.closePath();c.fill();c.stroke();
  if(look3())face3(c,176,GY-22,1.5,isK(e)?'laugh':'angry'); else face(c,176,GY-22,1.5,isK(e)?'laugh':'angry');
  wheel(148);wheel(178);
  c.restore();
}
B.train.draw3=B.train.draw;

/* ---------- lying lift: the platform of family 'elev' ---------- */
(()=>{ const old=B.plat.draw;
  B.plat.draw=function(e,c,th){ if(e.v!=='elev')return old(e,c,th);
    const x=e.x,y=e.y,w=e.w;
    c.strokeStyle='rgba(20,16,32,.8)';c.lineWidth=3;for(const rx of [x+3,x+w-3]){c.beginPath();c.moveTo(rx,e.y1-28);c.lineTo(rx,GY);c.stroke()}
    c.strokeStyle='#000';c.lineWidth=3;c.fillStyle='#4a4f66';for(const px of [x+10,x+w-16]){c.fillRect(px,y+12,6,Math.max(0,GY-y-12));}
    if(look3())box3(c,x,y,w,12,3,'#f0c030'); else flatBox(c,x,y,w,12,'#f0c030');
    c.fillStyle='#1a1226';for(let i=0;i<w/16;i++){c.beginPath();c.moveTo(x+i*16+3,y+11);c.lineTo(x+i*16+10,y+1);c.lineTo(x+i*16+13,y+1);c.lineTo(x+i*16+6,y+11);c.closePath();c.fill()}
    c.fillStyle='#fff';c.strokeStyle='#000';c.lineWidth=1.6;c.beginPath();c.roundRect(x+w/2-15,y-12,30,11,3);c.fill();c.stroke();c.fillStyle='#b8860b';c.font='900 10px Arial';c.textAlign='center';c.fillText('VIP ▲',x+w/2,y-3.5)
  } })();

/* ---------- floor zones painted on top of the ground: belt (conveyor) / mud (glue) ---------- */
function drawZoneFloor(c,cam){
  for(const z of L.zones){ if(z.type!=='belt'&&z.type!=='mud')continue; if(z.x1<cam-20||z.x0>cam+VW+20)continue;
    const a=Math.max(z.x0,cam-10),b=Math.min(z.x1,cam+VW+10); c.save();c.beginPath();c.rect(a,GY-12,b-a,18);c.clip();
    if(z.type==='belt'){ c.fillStyle='#26232f';c.fillRect(a,GY-8,b-a,9);c.fillStyle='rgba(255,255,255,.12)';c.fillRect(a,GY-8,b-a,2);
      c.strokeStyle='#ffd23f';c.lineWidth=2.2;const off=(G.t*z.dir*80)%24;for(let x=Math.floor(a/24)*24-24+off;x<b+24;x+=24){c.beginPath();c.moveTo(x,GY-7);c.lineTo(x+z.dir*6,GY-3.5);c.lineTo(x,GY-.5);c.stroke()}
      c.fillStyle='#3a3748';c.strokeStyle='#000';c.lineWidth=2;for(const rx of [z.x0+4,z.x1-4]){c.beginPath();c.arc(rx,GY-3.5,6,0,7);c.fill();c.stroke()} }
    else { c.fillStyle='#6b4423';c.beginPath();c.moveTo(a,GY+1);for(let x=Math.floor(a/9)*9;x<=b+9;x+=9)c.lineTo(x,GY-4-Math.abs(Math.sin(x*.37))*2.4);c.lineTo(b+9,GY+1);c.closePath();c.fill();
      c.fillStyle='#8a5a30';c.fillRect(a,GY-4,b-a,1.6);
      for(let i=0;i<7;i++){const x=z.x0+((i*47)%Math.max(60,z.x1-z.x0)),k=((G.t*.9+i*.31)%1);if(x<a||x>b)continue;c.strokeStyle='#4a2c14';c.lineWidth=1.4;c.fillStyle='rgba(160,110,60,'+(1-k)+')';c.beginPath();c.arc(x,GY-5-k*2,1.5+k*3.4,0,7);c.fill();c.stroke()} }
    c.restore() }
}

/* ---------- hook: pick clay / flat painter like the older entities ---------- */
for(const k of ['mimic','mole','frog']){ const b=B[k],flat=b.draw,d3=b.draw3; b.draw=function(e,c,th){ return look3()?d3(e,c,th):flat(e,c,th) } }
