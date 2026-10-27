/* =============== DEATH ANIMATIONS ===============
   Every trap family kills in its own way (spikes flip you, boulders bounce you like a ball, arrows pin you, fire chars you ...).
   drawDeath() (draw.js) asks deathKind(cause) and, for any kind found in DK, calls DK[kind](c, X) with the origin at the hero's feet.
   X = {t, k, p, H, st, pal, cx, by, killer}: t seconds since death, k = +1/-1 direction he is thrown (away from the killer / along its travel). */
const DEATH_MAP={
  spike:'flip', arrow:'pin', ghost:'xray', crush:'squash', bait:'squash', boulder:'bounce', wall:'flatten', saw:'pieces', fakedoor:'pieces',
  monster:['launch','ko'], ball:'launch', pit:['pitflag','pithat','pitcloud'], crumble:['pitflag','pithat','pitcloud'],
  fire:'burn', zap:'zap', disco:'disco', laser:'slice', train:'flatten', mole:'sky', chest:'hidden', frog:'hidden', ceilspike:'stick'
};
function deathKind(ca){ const v=DEATH_MAP[ca]; if(!v)return 'xray'; return Array.isArray(v)?v[Math.floor((G.dv||0)*v.length)%v.length]:v }
const DK={};

/* the hero painted with a colour wash (charred / electrified / disco) — through a small offscreen canvas so only his own pixels get tinted */
let _tc=null;
function heroTinted(c,H,st,col,a){
  if(!_tc){_tc=document.createElement('canvas');_tc.width=200;_tc.height=200}
  const g=_tc.getContext('2d'); g.setTransform(1,0,0,1,0,0); g.globalCompositeOperation='source-over'; g.globalAlpha=1; g.clearRect(0,0,200,200);
  g.setTransform(2,0,0,2,100,160); g.lineJoin='round'; g.lineCap='round'; g.strokeStyle='#000'; g.lineWidth=2.4;
  drawHero(g,H,st);
  g.setTransform(1,0,0,1,0,0); g.globalCompositeOperation='source-atop'; g.globalAlpha=a; g.fillStyle=col; g.fillRect(0,0,200,200); g.globalAlpha=1; g.globalCompositeOperation='source-over';
  c.drawImage(_tc,-50,-80,100,100);
}
function dStar(c,x,y,r,rot){ c.save();c.translate(x,y);c.rotate(rot||0);c.fillStyle='#ffd23f';c.strokeStyle='#000';c.lineWidth=1.3;c.beginPath();for(let i=0;i<10;i++){const a=i/10*Math.PI*2,rr=i%2?r*.45:r;c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}c.closePath();c.fill();c.stroke();c.restore() }
function dSkel(c){ c.fillStyle='#f3f1e8';c.strokeStyle='#000';c.lineWidth=2.2;
  c.beginPath();c.arc(0,-26,10,0,7);c.fill();c.stroke();c.fillStyle='#000';c.beginPath();c.arc(-4,-27,3.2,0,7);c.arc(4.5,-27,3.2,0,7);c.fill();
  c.beginPath();c.moveTo(-5,-20);c.lineTo(5,-20);c.stroke();for(let i=0;i<3;i++){c.beginPath();c.moveTo(-8,-13+i*4);c.lineTo(8,-13+i*4);c.stroke()}
  c.beginPath();c.moveTo(0,-17);c.lineTo(0,-2);c.stroke();hat(c,-30,.97) }
function dFlames(c,t,s){
  for(let i=0;i<7;i++){ const bx=-9+i*3, by=-6-((i*37)%5)*5.5, f=.72+.28*Math.sin(t*22+i*1.7), h=(9+((i*13)%5)*1.7)*f*s;
    c.fillStyle=i%2?'#ff8a1f':'#ff4a1a';c.beginPath();c.moveTo(bx-3.3,by);c.quadraticCurveTo(bx-3.6,by-h*.6,bx,by-h);c.quadraticCurveTo(bx+3.6,by-h*.6,bx+3.3,by);c.closePath();c.fill();
    c.fillStyle='#ffe27a';c.beginPath();c.moveTo(bx-1.6,by);c.quadraticCurveTo(bx-1.7,by-h*.35,bx,by-h*.55);c.quadraticCurveTo(bx+1.7,by-h*.35,bx+1.6,by);c.closePath();c.fill() } }
function dSmoke(c,t,n,x0,y0){ for(let i=0;i<n;i++){ const u=(t*.9+i/n)%1; c.globalAlpha=(1-u)*.55;c.fillStyle='#6e6678';c.beginPath();c.arc(x0+Math.sin(i*2.3+t*2.4)*6,y0-u*46,3.5+u*7,0,7);c.fill() } c.globalAlpha=1 }
function dBolt(c,t,seed,x0,y0,x1,y1){ const n=6; c.save();c.lineJoin='miter';
  for(const [w,col] of [[4,'#fff6a0'],[1.6,'#ffffff']]){ c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(x0,y0);
    for(let i=1;i<n;i++){ const u=i/n, j=Math.sin(seed*91+i*13.7+Math.floor(t*30)*5.3)*9; c.lineTo(x0+(x1-x0)*u+j,y0+(y1-y0)*u+j*.4) } c.lineTo(x1,y1);c.stroke() } c.restore() }
function dCharred(c,X,t){          // the sooty heap left after fire / lightning
  const u=Math.min(1,t*3); c.save();c.scale(1+.12*u,1-.5*u);heroTinted(c,X.H,Object.assign({},X.st,{scream:false}),'#15100d',.9);c.restore();
  if(X.t>0.2){ c.fillStyle='#fff';c.strokeStyle='#000';c.lineWidth=1.2;for(const sx of [-3.4,3.4]){c.beginPath();c.arc(sx,-14*(1-.5*u)-6,2.1,0,7);c.fill();c.stroke()} }
  dSmoke(c,X.t,4,0,-18) }

DK.flip=(c,X)=>{ const T=.74,u=Math.min(X.t,T),y=-(330*u-450*u*u)-Math.min(10,(u/T)*10),a=(u/T)*Math.PI*3*X.p.face;
  const w=X.t>T?Math.sin((X.t-T)*26)*.15*Math.exp(-(X.t-T)*2.2)*X.p.face:0;         // feet wiggle after landing upside-down on the spikes
  c.translate(0,-14+y);c.rotate(a+w);c.translate(0,14);drawHero(c,X.H,X.st) };

DK.bounce=(c,X)=>{ const t=X.t,k=X.k,x=k*85*(1-Math.exp(-t*1.9)),ph=t*6.8,s=Math.abs(Math.sin(ph)),y=-62*Math.exp(-t*1.6)*s,sq=s<.14&&t<2.2;
  c.translate(x,y-14);c.rotate(k*20.42*(1-Math.exp(-t*1.6)));c.scale(sq?1.22:1,sq?.8:1);c.translate(0,14);drawHero(c,X.H,X.st) };

DK.pin=(c,X)=>{ const t=X.t,k=X.k,hold=.55,fl=Math.max(0,t-hold),x=k*74*(1-Math.exp(-t*8));
  const y=Math.min(0,-14*Math.min(1,t*8)+.5*1100*fl*fl), r=k*(.35*Math.min(1,t*8)+Math.min(1,fl*4)*1.22);
  c.translate(x,y-14);c.rotate(r);c.translate(0,14);drawHero(c,X.H,X.st);
  c.strokeStyle='#000';c.lineWidth=3.4;c.beginPath();c.moveTo(-15*k,-18);c.lineTo(14*k,-18);c.stroke();c.strokeStyle='#9b6a36';c.lineWidth=1.8;c.beginPath();c.moveTo(-15*k,-18);c.lineTo(14*k,-18);c.stroke();
  c.fillStyle='#cfd5e6';c.strokeStyle='#000';c.lineWidth=1.4;c.beginPath();c.moveTo(13*k,-22);c.lineTo(20*k,-18);c.lineTo(13*k,-14);c.closePath();c.fill();c.stroke();
  c.fillStyle='#e0434f';for(const s of [-1,1]){c.beginPath();c.moveTo(-14*k,-18);c.lineTo(-20*k,-18+s*5);c.lineTo(-17*k,-18);c.closePath();c.fill();c.stroke()} };

DK.burn=(c,X)=>{ const t=X.t,k=X.k;
  if(t<1.1){ c.translate(Math.sin(t*17)*15,-Math.abs(Math.sin(t*13))*9);c.rotate(Math.sin(t*17)*.12);heroTinted(c,X.H,X.st,'#17100c',Math.min(.9,t/.7));dFlames(c,t,1);dSmoke(c,t,3,0,-40) }
  else{ dCharred(c,X,t-1.1);dFlames(c,t,Math.max(0,.9-(t-1.1)*1.1)) } };

DK.zap=(c,X)=>{ const t=X.t;
  if(t<1.0){ c.translate(Math.sin(t*90)*3,0); const on=Math.floor(t*16)%2===0;
    if(on)heroTinted(c,X.H,Object.assign({},X.st,{scream:false}),'#fff7a8',.55); else dSkel(c);
    dBolt(c,t,1,-18,-50,-6,-6);dBolt(c,t,2,18,-48,8,-4);dBolt(c,t,3,0,-62,-2,-30) }
  else{ dCharred(c,X,t-1.0); if(t<1.6&&Math.floor(t*14)%2===0)dBolt(c,t,4,-10,-30,10,-8) } };

DK.disco=(c,X)=>{ const t=X.t,k=X.k;
  if(t<1.5){ const s=Math.sin(t*14); c.translate(s*4,-Math.abs(s)*14);c.rotate(s*.25);c.scale(1+Math.sin(t*28)*.08,1);heroTinted(c,X.H,X.st,'hsl('+((t*520)%360|0)+',90%,58%)',.42);
    for(let i=0;i<6;i++){ const a=t*5+i*1.05; c.fillStyle='hsl('+((i*60+t*300)%360|0)+',95%,62%)';c.beginPath();c.arc(Math.cos(a)*22,-26+Math.sin(a)*20,2.4,0,7);c.fill() } }
  else{ const u=Math.min(1,(t-1.5)*4); c.translate(k*u*10,0);c.translate(0,-14);c.rotate(k*u*1.5);c.translate(0,14);drawHero(c,X.H,X.st);
    for(let i=0;i<3;i++)dStar(c,Math.cos(t*5+i*2.1)*15,-6-Math.abs(Math.sin(t*5+i*2.1))*4,3.4,t*4) } };

DK.flatten=(c,X)=>{ const t=X.t,k=X.k,st=Object.assign({},X.st,{scream:false});
  if(t<.3){ const sq=Math.max(.16,1-t*3.6); c.translate(k*(1-Math.exp(-t*14))*16,0);c.scale(sq,1);drawHero(c,X.H,st);return }      // squeezed paper-thin ...
  const u=Math.min(1,(t-.3)/1.15), fl=Math.abs(Math.cos(u*11))*(1-u);                                                  // ... then he flutters down like a leaf and lies flat
  c.translate(k*(16+Math.sin(u*7)*26*(1-u*.4)),-30*Math.sin(Math.min(1,u*1.35)*Math.PI)*(1-u*.2));c.translate(0,-14);c.rotate(Math.sin(u*9)*.5*(1-u)+k*1.5*u);c.translate(0,14);
  c.scale(.16+.7*fl+.14*u,1);drawHero(c,X.H,st) };

DK.sky=(c,X)=>{ const t=X.t,k=X.k;
  if(t<.12){ c.scale(1+t*2.2,1-t*5);drawHero(c,X.H,Object.assign({},X.st,{scream:false})); return }
  const u=t-.12,y=-(1000*u-750*u*u);
  if(y<0){ c.translate(0,y-14);c.rotate(u*14*k);c.translate(0,14);drawHero(c,X.H,X.st);
    for(let i=0;i<3;i++)dStar(c,Math.sin(u*9+i*2)*10,22+i*16+((u*80)%12),3,u*8+i);
    if(y<-300){ c.save();c.translate(0,-50);c.fillStyle='#fff';c.strokeStyle='#ffd23f';c.lineWidth=2;c.beginPath();for(let i=0;i<8;i++){const a=i/8*Math.PI*2,r=i%2?3:13;c.lineTo(Math.cos(a)*r,Math.sin(a)*r)}c.closePath();c.fill();c.stroke();c.restore() } }
  else{ const z=Math.min(1,(t-1.45)*5);c.translate(0,-14);c.rotate(k*1.5*z);c.scale(1,1-.12*z);c.translate(0,14);drawHero(c,X.H,X.st);
    for(let i=0;i<3;i++)dStar(c,Math.cos(t*5+i*2.1)*15,-8-Math.abs(Math.sin(t*5+i*2.1))*4,3.4,t*4) } };

DK.stick=(c,X)=>{ const t=X.t,fall=Math.max(0,t-1.5),y=Math.min(.5*1100*fall*fall,Math.max(0,GY-X.by));
  c.translate(0,-46+y);c.rotate(Math.sin(t*6)*.16*Math.exp(-t*.7));c.translate(0,46);drawHero(c,X.H,X.st) };

DK.slice=(c,X)=>{ const t=X.t,k=X.k,cut=-16,sl=.3,poly=up=>{c.beginPath();c.moveTo(-60,up?-120:120);c.lineTo(60,up?-120:120);c.lineTo(60,cut-sl*60);c.lineTo(-60,cut+sl*60);c.closePath()};
  c.save();c.rotate(t<.6?Math.sin(t*34)*.05:-k*Math.min(1,(t-.6)*3)*1.5);poly(false);c.clip();drawHero(c,X.H,X.st);c.restore();       // legs: wobble, then topple
  c.save();c.translate(k*30*(1-Math.exp(-t*3)),-9*Math.min(1,t*6)+Math.min(Math.max(0,t-.45)**2*450,28));c.rotate(k*(.5*Math.min(1,t*3)+Math.min(1,Math.max(0,t-.45)*2.2)*1.1));poly(true);c.clip();drawHero(c,X.H,X.st);c.restore();
  if(t<.3){ c.save();c.globalAlpha=1-t/.3;c.strokeStyle='#ff4a4a';c.lineWidth=5;c.beginPath();c.moveTo(-60,cut+sl*60);c.lineTo(60,cut-sl*60);c.stroke();c.strokeStyle='#fff';c.lineWidth=2;c.stroke();c.restore() } };

DK.ko=(c,X)=>{ const t=X.t,k=X.k,tp=Math.max(0,t-.9);
  c.rotate(Math.sin(t*9)*.1*(1-Math.min(1,t))+k*Math.min(1,tp*2.2)**2*1.53);drawHero(c,X.H,Object.assign({},X.st,{scream:false}));
  for(let i=0;i<3;i++){const a=t*6+i*2.09;dStar(c,Math.cos(a)*13,-52+Math.sin(a)*4,3.6,t*5)} };

DK.hidden=()=>{};         // chest / frog: the trap itself draws the meal

/* pit deaths happen below the screen, so show something funny at the bottom edge instead of an invisible fall */
DK.pitflag=(c,X)=>{ const t=X.t; c.translate(0,VH-X.by); if(t<.25)return; const u=Math.min(1,(t-.25)*3),y=-34*u;
  c.strokeStyle='#000';c.lineWidth=4;c.beginPath();c.moveTo(0,0);c.lineTo(0,y-8);c.stroke();c.strokeStyle='#8a5a2b';c.lineWidth=2;c.stroke();
  c.fillStyle='#fff';c.strokeStyle='#000';c.lineWidth=2;c.beginPath();c.moveTo(0,y-30);c.quadraticCurveTo(14,y-30+Math.sin(t*12)*4,28,y-26+Math.sin(t*12+1)*5);c.quadraticCurveTo(14,y-18+Math.sin(t*12)*3,0,y-14);c.closePath();c.fill();c.stroke();
  c.fillStyle='#fff';c.beginPath();c.arc(0,y-2,6,0,7);c.fill();c.stroke() };
DK.pithat=(c,X)=>{ const t=X.t; c.translate(0,VH-X.by); if(t<.2)return; const u=Math.min(1,(t-.2)*4),y=-30*u+(t>1.3?Math.min(40,(t-1.3)*90):0);
  c.translate(0,y);c.rotate(Math.sin(t*9)*.25);hat(c,0,.95);
  c.fillStyle='#7fd8ff';for(let i=0;i<3;i++){c.beginPath();c.ellipse(-18+i*18,-16+((t*3+i*.4)%1)*14,1.8,2.8,0,0,7);c.fill()} };
DK.pitcloud=(c,X)=>{ const t=X.t; c.translate(0,VH-X.by); if(t<.15)return; const u=Math.min(1,(t-.15)*3.5);
  for(let i=0;i<7;i++){ const a=i/7*Math.PI*2,r=(10+u*22)*(.7+(i%3)*.2);c.fillStyle=i%2?'#d9d2e8':'#bdb4d2';c.strokeStyle='#000';c.lineWidth=1.6;c.beginPath();c.arc(Math.cos(a)*r*1.2,-10-Math.abs(Math.sin(a))*r*.9,7+u*5,0,7);c.fill();c.stroke() }
  for(let i=0;i<3;i++)dStar(c,-22+i*22,-48-Math.sin(t*6+i*2)*5,5,t*5+i) };
