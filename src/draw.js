/* =============== RENDER =============== */
/* ---------- heroes: all wear the yellow hard hat; feet at (0,0), ~20x28 ---------- */
const HAT='#f6c21a';
function hat(c,hy,w,ear){
  c.strokeStyle='#000';c.lineWidth=2.4;c.fillStyle=HAT;
  c.beginPath();c.arc(0,hy,11.5*w,Math.PI,0);c.closePath();c.fill();c.stroke();
  c.fillRect(-13.5*w,hy-.6,27*w,3.4);c.strokeRect(-13.5*w,hy-.6,27*w,3.4);
  c.fillStyle='#fff6b0';c.beginPath();c.arc(7*w,hy-8.5,3,0,7);c.fill();c.stroke();
  c.fillStyle='#fff7';c.fillRect(-7*w,hy-9,5,2.4);
}
function eyes(c,y,sp,r,st,o){
  o=o||{};
  for(const sx of [-1,1]){const x=sx*sp;
    if(st.dead){c.strokeStyle='#000';c.lineWidth=2;c.beginPath();c.moveTo(x-3,y-3);c.lineTo(x+3,y+3);c.moveTo(x+3,y-3);c.lineTo(x-3,y+3);c.stroke();continue}
    if(o.closed||st.blink){c.strokeStyle='#000';c.lineWidth=2;c.beginPath();c.moveTo(x-r*.8,y);c.quadraticCurveTo(x,y+(o.closed?r*.7:0),x+r*.8,y);c.stroke();continue}
    c.fillStyle='#fff';c.lineWidth=2;c.strokeStyle='#000';c.beginPath();c.arc(x,y,r,0,7);c.fill();c.stroke();
    c.fillStyle='#000';c.beginPath();c.arc(x+st.ex*.9,y+st.ey*.7,r*(st.scream?.28:.42),0,7);c.fill() }
}
function mouth(c,x,y,st,o){
  o=o||{};
  if(st.dead||st.scream||!st.onGround){c.fillStyle='#7a1d1d';c.strokeStyle='#000';c.lineWidth=1.6;c.beginPath();c.ellipse(x,y,st.scream?3.4:2.6,st.scream?4.6:3.2,0,0,7);c.fill();c.stroke();return}
  c.strokeStyle='#000';c.lineWidth=1.8;c.beginPath();
  if(o.frown)c.arc(x,y+3.4,3.6,Math.PI+.35,-.35);else c.arc(x,y-2,3.6,.15,Math.PI-.15);
  c.stroke();
}
const HEROES={
 falafel:{name:'فلافل المسكين',pal:{skin:'#b9772e',body:'#b9772e',feet:'#2a1a12'},
  draw(c,st){ c.strokeStyle='#000';c.lineWidth=2.4;c.lineJoin='round';c.lineCap='round';
   const fo=st.moving?st.rs*4:0;
   c.strokeStyle='#2a1a12';c.lineWidth=2.6;c.beginPath();c.moveTo(-4,-6);c.lineTo(-5+fo,-1);c.lineTo(-8+fo,-1);c.moveTo(4,-6);c.lineTo(5-fo,-1);c.lineTo(8-fo,-1);c.stroke();
   const ao=st.moving?-st.rs*3:(st.onGround?0:-5);
   c.beginPath();c.moveTo(-9,-13);c.lineTo(-13,-9+ao);c.moveTo(9,-13);c.lineTo(13,-9-ao);c.stroke();
   c.strokeStyle='#000';c.lineWidth=2.4;c.fillStyle='#b9772e';c.beginPath();c.ellipse(0,-14,10,12.5,0,0,7);c.fill();c.stroke();
   c.fillStyle='#f3dd9a';[[-5,-7],[5,-8],[0,-5],[-2,-10],[6,-4],[-7,-12],[7,-13]].forEach(([a,b])=>c.fillRect(a,b,1.8,1));
   eyes(c,-17.5,4.6,4.6,st);
   if(!st.dead&&st.moving){c.fillStyle='#7fd8ff';[-1,1].forEach(sx=>{c.beginPath();c.ellipse(sx*8,-12+((st.run*2)%1)*4,1.2,2,0,0,7);c.fill()})}
   mouth(c,0,-8.5,st,{frown:true});
   hat(c,-24.5,.93)}},
 uncle:{name:'العم بالبيجاما',pal:{skin:'#f0b890',body:'#9aa58a',feet:'#2a1a12'},
  draw(c,st){ c.strokeStyle='#000';c.lineWidth=2.4;c.lineJoin='round';const fo=st.moving?st.rs*4:0;
   c.fillStyle='#2a1a12';c.beginPath();c.ellipse(-5+fo,-2.5,5.8,3,0,0,7);c.ellipse(5-fo,-2.5,5.8,3,0,0,7);c.fill();c.stroke();
   c.fillStyle='#9aa58a';c.beginPath();c.roundRect(-9,-17,18,14.5,4);c.fill();c.stroke();
   c.strokeStyle='#6f7a62';c.lineWidth=1.2;for(let i=-6;i<=6;i+=4){c.beginPath();c.moveTo(i,-16);c.lineTo(i,-4);c.stroke()}
   const ao=st.moving?-st.rs*4:(st.onGround?0:-5); c.strokeStyle='#000';c.lineWidth=2.4;c.fillStyle='#f0b890';
   c.beginPath();c.arc(-10.5,-11+ao*.5,3.3,0,7);c.fill();c.stroke();c.beginPath();c.arc(10.5,-11-ao*.5,3.3,0,7);c.fill();c.stroke();
   c.fillStyle='#ffb347';c.fillRect(8,-19-ao*.5,5.5,7);c.strokeStyle='#000';c.lineWidth=1.4;c.strokeRect(8,-19-ao*.5,5.5,7);
   c.fillStyle='#f0b890';c.lineWidth=2.4;c.beginPath();c.arc(0,-21,10,0,7);c.fill();c.stroke();
   eyes(c,-22,4.4,3.7,st);
   c.fillStyle='#e0645a';c.beginPath();c.arc(0,-18.6,2.6,0,7);c.fill();c.stroke();
   c.fillStyle='#f4f1e6';c.lineWidth=1.6;c.beginPath();c.moveTo(-8,-17.4);c.quadraticCurveTo(-4,-20,0,-17.4);c.quadraticCurveTo(4,-20,8,-17.4);c.quadraticCurveTo(4,-14,0,-16);c.quadraticCurveTo(-4,-14,-8,-17.4);c.fill();c.stroke();
   if(!st.onGround||st.dead){c.fillStyle='#7a1d1d';c.beginPath();c.ellipse(0,-13.6,2.2,2.4,0,0,7);c.fill()}
   hat(c,-24.5,.95)}},
 chicken:{name:'الفرخة بالنظارة',pal:{skin:'#fbf1d0',body:'#fbf1d0',feet:'#f29b1d'},
  draw(c,st){ c.strokeStyle='#000';c.lineWidth=2.4;c.lineJoin='round';c.lineCap='round';const fo=st.moving?st.rs*4:0;
   c.strokeStyle='#f29b1d';c.lineWidth=2.6;c.beginPath();c.moveTo(-3.5,-7);c.lineTo(-4+fo,-1);c.lineTo(-8+fo,-.5);c.moveTo(3.5,-7);c.lineTo(4-fo,-1);c.lineTo(8-fo,-.5);c.stroke();
   c.strokeStyle='#000';c.lineWidth=2.4;c.fillStyle='#fbf1d0';c.beginPath();c.ellipse(0,-13,9.5,8.5,0,0,7);c.fill();c.stroke();
   const wf=st.onGround?0:-5+Math.sin(st.run*8)*2;c.beginPath();c.ellipse(-9,-13+wf*.4,4,6,.3+wf*.04,0,7);c.ellipse(9,-13+wf*.4,4,6,-.3-wf*.04,0,7);c.fill();c.stroke();
   c.beginPath();c.moveTo(-3,-6);c.lineTo(-5,-3);c.moveTo(3,-6);c.lineTo(5,-3);c.stroke();
   c.fillStyle='#fbf1d0';c.beginPath();c.arc(0,-21,9.6,0,7);c.fill();c.stroke();
   c.fillStyle='#e0364a';c.beginPath();c.arc(-3,-30,2.6,0,7);c.arc(1,-31.5,2.8,0,7);c.arc(5,-30,2.4,0,7);c.fill();c.stroke();
   eyes(c,-21.5,4,3.5,st);c.strokeStyle='#000';c.lineWidth=1.6;c.fillStyle='#0000';[-1,1].forEach(sx=>{c.beginPath();c.arc(sx*4,-21.5,5.2,0,7);c.stroke()});c.beginPath();c.moveTo(-1,-21.5);c.lineTo(1,-21.5);c.stroke();
   c.fillStyle='#f29b1d';c.strokeStyle='#000';c.lineWidth=1.8;c.beginPath();c.moveTo(-3.4,-17.6);c.lineTo(0,-13.4+(st.onGround?0:2));c.lineTo(3.4,-17.6);c.closePath();c.fill();c.stroke();
   c.fillStyle='#e0364a';c.beginPath();c.ellipse(0,-12.5,1.6,2.4,0,0,7);c.fill();
   hat(c,-25.5,.9)}},
 grandma:{name:'الجدّة الغاضبة',pal:{skin:'#f0b890',body:'#f4d6e0',feet:'#6b3a2a'},
  draw(c,st){ c.strokeStyle='#000';c.lineWidth=2.4;c.lineJoin='round';const fo=st.moving?st.rs*3.5:0;
   c.fillStyle='#6b3a2a';c.beginPath();c.ellipse(-4.5+fo,-2.5,5,3,0,0,7);c.ellipse(4.5-fo,-2.5,5,3,0,0,7);c.fill();c.stroke();
   c.fillStyle='#f6dfe6';c.beginPath();c.moveTo(-5,-18);c.lineTo(-10.5,-4);c.lineTo(10.5,-4);c.lineTo(5,-18);c.closePath();c.fill();c.stroke();
   c.fillStyle='#e0645a';[[-4,-10],[3,-8],[0,-13],[6,-5],[-7,-6]].forEach(([a,b])=>{c.beginPath();c.arc(a,b,1.5,0,7);c.fill()});
   const ao=st.moving?-st.rs*4:(st.onGround?0:-5);c.fillStyle='#f0b890';c.beginPath();c.arc(-8,-14+ao*.5,3.2,0,7);c.fill();c.stroke();c.beginPath();c.arc(8,-14-ao*.5,3.2,0,7);c.fill();c.stroke();
   c.strokeStyle='#8a5a2b';c.lineWidth=2.6;c.beginPath();c.moveTo(12,-6);c.lineTo(15,-22+0);c.stroke();c.strokeStyle='#000';
   c.fillStyle='#c7c9d4';c.lineWidth=2.2;[[-10,-21],[10,-21],[-8,-26],[8,-26]].forEach(([a,b])=>{c.beginPath();c.arc(a,b,4.4,0,7);c.fill();c.stroke()});
   c.fillStyle='#f0b890';c.lineWidth=2.4;c.beginPath();c.arc(0,-21,9.8,0,7);c.fill();c.stroke();
   eyes(c,-21.5,4.2,3.3,st);c.strokeStyle='#000';c.lineWidth=1.6;[-1,1].forEach(sx=>{c.beginPath();c.arc(sx*4.2,-21.5,4.8,0,7);c.stroke()});
   c.lineWidth=2.4;c.beginPath();c.moveTo(-8,-27.5);c.lineTo(-2,-25);c.moveTo(8,-27.5);c.lineTo(2,-25);c.stroke();
   c.fillStyle='#e0645a';c.beginPath();c.arc(0,-18,2.2,0,7);c.fill();c.stroke();
   mouth(c,0,-12.5,st,{frown:true});
   hat(c,-25,.97)}},
 cat:{name:'القط الكسلان',pal:{skin:'#f39b3d',body:'#f39b3d',feet:'#f39b3d'},
  draw(c,st){ c.strokeStyle='#000';c.lineWidth=2.4;c.lineJoin='round';c.lineCap='round';const fo=st.moving?st.rs*3:0;
   c.strokeStyle='#000';c.fillStyle='#f39b3d';c.beginPath();c.moveTo(-9,-8);c.quadraticCurveTo(-20,-10+Math.sin(G.t*5)*3,-17,-20);c.lineWidth=4.4;c.stroke();c.strokeStyle='#f39b3d';c.lineWidth=2.4;c.stroke();c.strokeStyle='#000';c.lineWidth=2.4;
   c.beginPath();c.ellipse(-4.5+fo,-2.6,4.8,3.2,0,0,7);c.ellipse(4.5-fo,-2.6,4.8,3.2,0,0,7);c.fill();c.stroke();
   c.beginPath();c.ellipse(0,-12,10,10,0,0,7);c.fill();c.stroke();c.fillStyle='#fbd7a0';c.beginPath();c.ellipse(0,-9,5.5,6.5,0,0,7);c.fill();
   const ao=st.moving?-st.rs*3:(st.onGround?0:-4);c.fillStyle='#f39b3d';c.beginPath();c.arc(-10,-12+ao*.5,3.2,0,7);c.fill();c.stroke();c.beginPath();c.arc(10,-12-ao*.5,3.2,0,7);c.fill();c.stroke();
   c.beginPath();c.ellipse(0,-21,10.5,9,0,0,7);c.fill();c.stroke();
   c.beginPath();c.moveTo(-10,-23);c.lineTo(-12,-33);c.lineTo(-4,-27);c.moveTo(10,-23);c.lineTo(12,-33);c.lineTo(4,-27);c.fill();c.stroke();
   c.strokeStyle='#c46a1a';c.lineWidth=1.6;[-5,0,5].forEach(a=>{c.beginPath();c.moveTo(a,-27);c.lineTo(a,-24)});c.stroke();c.strokeStyle='#000';
   eyes(c,-21,4.1,3.3,st,{closed:!st.moving&&!st.dead&&st.onGround&&!st.scream});
   c.fillStyle='#e0645a';c.beginPath();c.arc(0,-17.8,1.4,0,7);c.fill();
   c.lineWidth=1.2;c.beginPath();c.moveTo(-3,-17);c.lineTo(-11,-18);c.moveTo(-3,-16);c.lineTo(-11,-15);c.moveTo(3,-17);c.lineTo(11,-18);c.moveTo(3,-16);c.lineTo(11,-15);c.stroke();
   mouth(c,0,-14.6,st);
   hat(c,-26,.93)}},
 donkey:{name:'الحمار الكوول',pal:{skin:'#8d8aa0',body:'#8d8aa0',feet:'#1c1826'},
  draw(c,st){ c.strokeStyle='#000';c.lineWidth=2.4;c.lineJoin='round';const fo=st.moving?st.rs*4:0;
   c.fillStyle='#1c1826';c.beginPath();c.ellipse(-5+fo,-2.5,5.5,3.2,0,0,7);c.ellipse(5-fo,-2.5,5.5,3.2,0,0,7);c.fill();c.stroke();
   c.fillStyle='#8d8aa0';c.beginPath();c.roundRect(-8,-17,16,14.5,5);c.fill();c.stroke();c.fillStyle='#d7d4e0';c.beginPath();c.ellipse(0,-10,4.4,6,0,0,7);c.fill();
   const ao=st.moving?-st.rs*4:(st.onGround?0:-5);c.fillStyle='#8d8aa0';c.beginPath();c.arc(-9.5,-11+ao*.5,3.2,0,7);c.fill();c.stroke();c.beginPath();c.arc(9.5,-11-ao*.5,3.2,0,7);c.fill();c.stroke();
   c.fillStyle='#8d8aa0';c.beginPath();c.moveTo(-8,-26);c.lineTo(-18,-40+Math.sin(G.t*6)*1.6);c.lineTo(-2,-28);c.moveTo(8,-26);c.lineTo(18,-40+Math.sin(G.t*6+1)*1.6);c.lineTo(2,-28);c.fill();c.stroke();
   c.beginPath();c.ellipse(0,-20,9.4,10.5,0,0,7);c.fill();c.stroke();c.fillStyle='#d7d4e0';c.beginPath();c.ellipse(0,-15,6,5,0,0,7);c.fill();c.stroke();
   if(st.dead){eyes(c,-22,4.2,3.6,st)} else { c.fillStyle='#0b0a12';c.beginPath();c.roundRect(-9.5,-25,19,6.4,3);c.fill();c.stroke();c.fillStyle='#ffffff40';c.fillRect(-7,-24,4,2) }
   c.fillStyle='#000';c.beginPath();c.arc(-2,-15.5,.8,0,7);c.arc(2,-15.5,.8,0,7);c.fill();
   if(!st.dead&&st.onGround){c.fillStyle='#fff';c.lineWidth=1.4;c.beginPath();c.moveTo(-4,-12.4);c.quadraticCurveTo(0,-9.4,4,-12.4);c.lineTo(3.4,-11);c.quadraticCurveTo(0,-8,-3.4,-11);c.closePath();c.fill();c.stroke()} else mouth(c,0,-12,st);
   hat(c,-28,.9)}}
};
const HERO_IDS=Object.keys(HEROES);
const heroDef=()=>HEROES[S.hero]||HEROES.falafel;
function heroState(){
  const p=P; return {moving:Math.abs(p.vx)>20&&p.onGround,rs:Math.sin(p.run*3),run:p.run,onGround:p.onGround,blink:p.blink<0&&p.blink>-.12,
    ex:clamp(p.vx/RUN,-1,1)*1.6,ey:clamp(p.vy/700,-1,1)*1.6,dead:false,scream:false};
}
function drawPlayer(c){
  const p=P; if(p.dead)return;
  c.save();c.translate(p.x+PW/2,p.y+PH);
  let sx=1,sy=1; if(!p.onGround){const s=clamp(Math.abs(p.vy)/900,0,.3);sy=1+s*.9;sx=1-s*.5}
  sx*=1+p.land*.35; sy*=1-p.land*.28; c.scale(p.face*sx,sy);
  if(p.spin>0){c.translate(0,-14);c.rotate(-p.face*(1-p.spin/.32)*Math.PI*2);c.translate(0,14)}
  drawHero(c,heroDef(),heroState());
  c.restore();
}
const DEATH_KIND={spike:'xray',arrow:'xray',ghost:'xray',crush:'squash',bait:'squash',boulder:'squash',wall:'squash',saw:'pieces',fakedoor:'pieces',pit:'fall',crumble:'fall',monster:'launch',ball:'launch'};
function drawDeath(c){
  const p=P,t=G.deadT,cx=p.x+PW/2,by=p.y+PH,ca=G.cause,kind=DEATH_KIND[ca]||'xray',H=heroDef(),pal=H.pal;
  const st=Object.assign(heroState(),{dead:true,onGround:false,moving:false,scream:true,ex:0,ey:0,blink:false});
  c.save();c.translate(cx,by);c.strokeStyle='#000';c.lineWidth=2.4;c.lineJoin='round';
  if(kind==='fall'){ c.rotate(t*5); c.translate(0,-14); c.scale(p.face,1); c.translate(0,14); drawHero(c,H,st) }
  else if(kind==='launch'){ const k=G.killer?Math.sign(cx-(anchor(G.killer)[0]))||1:-p.face; c.translate(k*150*t,-330*t+620*t*t-14); c.rotate(t*11*k); c.translate(0,14); drawHero(c,H,st) }
  else if(kind==='squash'){ const s=clamp(t*9,0,1); c.scale(1+s*.9,1-s*.85); drawHero(c,H,Object.assign(st,{scream:false})) }
  else if(kind==='xray'){
    const fl=Math.floor(t*10)%2===0&&t<.6;
    if(fl){drawHero(c,H,Object.assign(st,{scream:false}))}
    else{ c.translate(0,-Math.min(t*20,10)+8); c.fillStyle='#f3f1e8';c.strokeStyle='#000';c.lineWidth=2.2;
      c.beginPath();c.arc(0,-26,10,0,7);c.fill();c.stroke(); c.fillStyle='#000';c.beginPath();c.arc(-4,-27,3.2,0,7);c.arc(4.5,-27,3.2,0,7);c.fill();
      c.beginPath();c.moveTo(-5,-20);c.lineTo(5,-20);c.stroke(); for(let i=0;i<3;i++){c.beginPath();c.moveTo(-8,-13+i*4);c.lineTo(8,-13+i*4);c.stroke()}
      c.beginPath();c.moveTo(0,-17);c.lineTo(0,-2);c.stroke();
      hat(c,-30,.97) } }
  else if(kind==='pieces'){
    const g=500,tt=t; const piece=(dx,dy,vx,vy,fn)=>{c.save();c.translate(dx+vx*tt,dy+vy*tt+.5*g*tt*tt);c.rotate(tt*(vx>0?8:-8));fn();c.restore()};
    if(!heroSlices(c,tt,piece)){
    piece(0,-28,40,-200,()=>{hat(c,0,.9)});
    piece(0,-14,-70,-260,()=>{c.fillStyle=pal.skin;c.beginPath();c.arc(0,0,10,0,7);c.fill();c.stroke();eyes(c,-1,4.6,4,{dead:true})});
    piece(0,-10,20,-120,()=>{c.fillStyle=pal.body;c.fillRect(-8,-6,16,12);c.strokeRect(-8,-6,16,12)});
    piece(0,-3,-30,-150,()=>{c.fillStyle=pal.feet;c.beginPath();c.ellipse(0,0,5.5,3,0,0,7);c.fill();c.stroke()}); } }
  c.restore();
  if(kind==='xray'){ if(t>.3){ // little ghost floating up
    const gt=t-.3; c.save();c.globalAlpha=clamp(1-gt/1.4,0,1);c.translate(cx,by-30-gt*60);c.fillStyle='#fff';c.strokeStyle='#000';c.lineWidth=2.4;
    c.beginPath();c.arc(0,0,11,Math.PI,0);c.lineTo(11,14);c.lineTo(5,10);c.lineTo(0,14);c.lineTo(-5,10);c.lineTo(-11,14);c.closePath();c.fill();c.stroke();
    c.fillStyle='#000';c.beginPath();c.arc(-4,-1,2.2,0,7);c.arc(4,-1,2.2,0,7);c.fill();c.beginPath();c.ellipse(0,6,2,3,0,0,7);c.fill();c.restore() } }
}

/* ---------- zones ---------- */
function drawZones(c,th,cam){
  for(const z of L.zones){ if(z.x1<cam-20||z.x0>cam+VW+20)continue;
    const a=Math.max(z.x0,cam-10),b=Math.min(z.x1,cam+VW+10);
    c.save();c.beginPath();c.rect(a,22,b-a,VH);c.clip();
    const k=z.tm!=null?clamp(z.tm,0,1):1;c.globalAlpha=k;
    if(z.type==='ice'){ c.fillStyle='rgba(160,225,255,.20)';c.fillRect(a,22,b-a,VH);c.fillStyle='rgba(220,248,255,.75)';c.fillRect(a,GY-4,b-a,7);
      c.strokeStyle='#fff9';c.lineWidth=1.6;for(let x=Math.floor(a/46)*46;x<b;x+=46){c.beginPath();c.moveTo(x+6,GY+10);c.lineTo(x+22,GY+4);c.stroke()}
      c.fillStyle='#e8fbff';for(let i=0;i<14;i++){const x=a+((i*97+G.t*14)%(b-a)),y=40+((i*61+G.t*30*(1+i%3))%300);c.fillRect(x,y,2,2)} }
    else if(z.type==='rev'){ c.fillStyle='rgba(190,90,255,.17)';c.fillRect(a,22,b-a,VH);c.strokeStyle='#d7a2ff';c.lineWidth=2.2;
      for(let i=0;i<5;i++){c.beginPath();for(let x=a;x<=b;x+=10){const y=70+i*55+Math.sin(x*.03+G.t*3+i)*14;x===a?c.moveTo(x,y):c.lineTo(x,y)}c.stroke()}
      c.fillStyle='#f1d4ff';c.font='900 22px Tahoma';c.textAlign='center';for(let x=Math.floor(a/120)*120+60;x<b;x+=120)c.fillText(Math.floor(G.t*2)%2?'؟':'?',x,150+Math.sin(G.t*4+x)*6) }
    else if(z.type==='wind'){ c.fillStyle='rgba(255,255,255,.07)';c.fillRect(a,22,b-a,VH);c.strokeStyle='#fffb';c.lineWidth=2;
      for(let i=0;i<16;i++){const y=50+((i*53)%330),x0=a+((i*131+G.t*z.dir*260+4000)%(b-a+160))-80;c.beginPath();c.moveTo(x0,y);c.lineTo(x0+z.dir*34,y);c.stroke()}
      c.fillStyle='#fff';c.font='900 20px Arial';c.textAlign='center';for(let x=Math.floor(a/160)*160+80;x<b;x+=160)c.fillText(z.dir>0?'»':'«',x,GY-100) }
    else if(z.type==='float'){ c.fillStyle='rgba(120,160,255,.15)';c.fillRect(a,22,b-a,VH);c.fillStyle='#cfe0ff';
      for(let i=0;i<12;i++){const x=a+((i*89)%(b-a)),y=VH-((i*47+G.t*(18+i%4*8))%420);c.beginPath();c.arc(x,y,2+i%3,0,7);c.fill()} }
    c.restore();
  }
}

function render(){
  const c=ctx; const th=THEMES[L.theme]; const sc=cv.width/VW; c.setTransform(sc,0,0,sc,0,0);
  const cam=Math.round(G.camX), shx=G.shake?(Math.random()-.5)*G.shake:0, shy=G.shake?(Math.random()-.5)*G.shake:0;
  if(look3())drawBg3(c,th,cam); else {
  c.fillStyle=th.bg;c.fillRect(0,0,VW,VH);
  const pw=256,off=-((cam*.5)%pw); for(let x=off-pw;x<VW+pw;x+=pw){c.drawImage(themeBg,x,0);c.drawImage(themeBg,x,224)}
  c.fillStyle='rgba(0,0,0,.35)';c.fillRect(0,0,VW,VH); }
  c.save();c.translate(-cam+shx,shy);
  const x0=Math.floor(cam/TS)-1,x1=Math.ceil((cam+VW)/TS)+1;
  // ceiling
  c.fillStyle='#07040d';c.fillRect(cam-10,0,VW+20,14);c.fillStyle=th.line;for(let tx=x0;tx<=x1;tx++){c.beginPath();c.moveTo(tx*TS,14);c.lineTo(tx*TS+16,24+((tx*7)%3)*5);c.lineTo(tx*TS+32,14);c.fill()}
  // torches
  for(const tx of L.torches){const x=tx*TS+16;if(x<cam-40||x>cam+VW+40)continue;
    const fl=Math.sin(G.t*14+tx)*2; const g=c.createRadialGradient(x,150,4,x,150,120);g.addColorStop(0,th.torch+'55');g.addColorStop(1,th.torch+'00');c.fillStyle=g;c.fillRect(x-120,30,240,240);
    if(look3()){drawTorch3(c,x,th);continue}
    c.fillStyle='#3b2a1a';c.strokeStyle='#000';c.lineWidth=2.4;c.fillRect(x-3,150,6,26);c.strokeRect(x-3,150,6,26);
    c.fillStyle=th.torch;c.beginPath();c.moveTo(x-8,150);c.quadraticCurveTo(x-6,132+fl,x,120+fl*2);c.quadraticCurveTo(x+6,132-fl,x+8,150);c.closePath();c.fill();c.stroke();
    c.fillStyle='#fff3b0';c.beginPath();c.ellipse(x,146,3.4,7,0,0,7);c.fill() }
  // pit eyes & glow
  const pitLaugh=G.state==='dead'&&(G.cause==='pit'||G.cause==='crumble')&&G.deadT>.25;
  for(const [px,pl] of L.pits){const cx=(px+pl/2)*TS; if(cx<cam-100||cx>cam+VW+100)continue;
    const g=c.createLinearGradient(0,VH-90,0,VH);g.addColorStop(0,'#0000');g.addColorStop(1,'#000c');c.fillStyle=g;c.fillRect(px*TS,VH-90,pl*TS,90);
    if(L.n>=2){ if(pitLaugh&&Math.abs(P.x-cx)<pl*TS/2+120){face(c,cx,VH-22,1.9,'laugh')} else {const ex=clamp((P.x-cx)/90,-1,1)*3,ey=clamp((P.y-VH)/300,-1,0)*2-1;c.fillStyle='#fff';[-11,11].forEach(o=>{c.beginPath();c.ellipse(cx+o,VH-24,7,10,0,0,7);c.fill();c.fillStyle='#000';c.beginPath();c.arc(cx+o+ex,VH-24+ey,3.2,0,7);c.fill();c.fillStyle='#fff'})} } }
  drawZones(c,th,cam);
  // signs
  for(const s of L.signs){ if(look3()){drawSign3(c,s,cam);continue} const x=s.tx*TS+16;if(x<cam-60||x>cam+VW+60)continue;
    c.fillStyle='#5b3a1a';c.strokeStyle='#000';c.lineWidth=2.4;c.fillRect(x-2.5,GY-30,5,30);c.strokeRect(x-2.5,GY-30,5,30);
    const ls=s.text.split('\n'),hh=ls.length>2?50:40; c.fillStyle='#d9a955';c.beginPath();c.roundRect(x-37,GY-28-hh,74,hh,5);c.fill();c.stroke();
    c.fillStyle='#2a1707';c.textAlign='center';c.direction='rtl';let fs=12;c.font='900 12px Tahoma,Arial';const mw=Math.max(...ls.map(t=>c.measureText(t).width));if(mw>64)fs=Math.max(7,12*64/mw);c.font='900 '+fs+'px Tahoma,Arial';
    ls.forEach((t,i)=>c.fillText(t,x,GY-28-hh+14+i*13));}
  // exit door
  const exX=exitPx();
  if(look3())doorDraw3(c,exX,false,false,true); else doorDraw(c,exX,false,false,true);
  const gl=c.createRadialGradient(exX+16,GY-30,4,exX+16,GY-30,70);gl.addColorStop(0,'#35d07f44');gl.addColorStop(1,'#35d07f00');c.fillStyle=gl;c.fillRect(exX-60,GY-110,150,130);
  // floor
  if(look3())drawFloor3(c,th,x0,x1); else for(let tx=x0;tx<=x1;tx++){ if(tx<0||tx>=L.w)continue; const cr=L.cr[tx]; if(L.ground[tx]<0||(cr&&cr.s===2))continue;
    let ox=0,oy=0; if(cr&&cr.s===1){ox=(Math.random()-.5)*2.4;oy=(Math.random()-.5)*1.6}
    const x=tx*TS+ox,y=GY+oy; c.fillStyle=tx%2?th.floor:th.floor2;c.fillRect(x,y,TS,VH-GY);
    c.strokeStyle=th.line;c.lineWidth=2;for(let r=0;r<3;r++)c.strokeRect(x+1,y+r*TS+1,TS-2,TS-2);
    c.fillStyle='#ffffff10';for(let r=0;r<3;r++)c.fillRect(x+3,y+r*TS+3,TS-6,3);
    const zz=zoneAt(tx*TS+16);
    c.fillStyle=(zz&&zz.type==='ice')?'#bfeaff':th.top;c.fillRect(x,y-3,TS,8);c.strokeStyle='#000';c.lineWidth=2;c.beginPath();c.moveTo(x,y-3);c.lineTo(x+TS,y-3);c.stroke();
    const h=(tx*2654435761>>>0)%5;if(h<2&&!(zz&&zz.type==='ice')){c.fillStyle=th.top;c.beginPath();c.moveTo(x+6+h*8,y-3);c.lineTo(x+9+h*8,y-9);c.lineTo(x+12+h*8,y-3);c.fill()}
    if(cr&&(cr.marked||cr.s===1)){c.strokeStyle='#000b';c.lineWidth=2;c.beginPath();c.moveTo(x+6,y-2);c.lineTo(x+14,y+9);c.lineTo(x+10,y+17);c.lineTo(x+20,y+30);c.moveTo(x+22,y-2);c.lineTo(x+18,y+8);c.stroke()} }
  // blocks (invisible-until-bumped "!" blocks and the dungeon's brick walls)
  for(const k in L.blocks){const b=L.blocks[k];if(!b.rev)continue;const [tx,ty]=k.split(',').map(Number);if(tx*TS<cam-40||tx*TS>cam+VW+40)continue;const oy=b.bump>0?-Math.sin(b.bump*10)*5:0; if(look3()){drawBlock3(c,th,tx,ty,oy,b.st);continue}
    if(b.st==='b'){ c.fillStyle=th.floor;c.fillRect(tx*TS,ty*TS+oy,TS,TS);c.strokeStyle=th.line;c.lineWidth=2;c.strokeRect(tx*TS+1,ty*TS+1+oy,TS-2,TS-2);c.fillStyle='#ffffff14';c.fillRect(tx*TS+3,ty*TS+3+oy,TS-6,4);c.strokeStyle='#000';c.lineWidth=2.4;c.strokeRect(tx*TS,ty*TS+oy,TS,TS);
      if(!L.blocks[tx+','+(ty-1)]){c.fillStyle=th.top;c.fillRect(tx*TS,ty*TS-3+oy,TS,6);c.strokeRect(tx*TS,ty*TS-3+oy,TS,6)} }
    else{ c.fillStyle='#e0a030';c.strokeStyle='#000';c.lineWidth=3;c.fillRect(tx*TS,ty*TS+oy,TS,TS);c.strokeRect(tx*TS+1.5,ty*TS+1.5+oy,TS-3,TS-3);c.fillStyle='#000';c.font='900 20px Arial';c.textAlign='center';c.fillText('!',tx*TS+16,ty*TS+24+oy)} }
  if(look3())drawShadows3(c);
  // entities
  const vis=e=>e.always||(Math.abs(entX(e)-(cam+VW/2))<VW/2+420);
  for(const e of L.ents){ if(e.t==='chase'||e.t==='ghost'||e.t==='coin'||!vis(e))continue; B[e.t].draw(e,c,th) }
  for(const e of L.ents){ if(e.t==='coin'&&vis(e))B.coin.draw(e,c,th) }
  // player
  if(G.state==='dead')drawDeath(c);else drawPlayer(c);
  for(const e of L.ents){ if(e.t==='chase'||e.t==='ghost')B[e.t].draw(e,c,th) }
  // particles
  for(const p of parts){const a=clamp(p.life/(p.max*.6),0,1);c.globalAlpha=a;c.fillStyle=p.col;
    if(p.sh==='c'){c.beginPath();c.arc(p.x,p.y,p.s*a+1,0,7);c.fill()}
    else if(p.sh==='o'){c.strokeStyle='#fff';c.lineWidth=2.4;c.beginPath();c.ellipse(p.x,p.y,6+(1-a)*18,2.5+(1-a)*5,0,0,7);c.stroke()}
    else if(p.sh==='r'){c.save();c.translate(p.x,p.y);c.rotate(p.rot||0);c.fillRect(-p.s/2,-p.s/3,p.s,p.s*.6);c.restore()}
    else{c.save();c.translate(p.x,p.y);c.rotate(p.rot);c.beginPath();for(let i=0;i<10;i++){const r=i%2?p.s*.45:p.s;const an=i/10*Math.PI*2;c.lineTo(Math.cos(an)*r,Math.sin(an)*r)}c.closePath();c.fill();c.strokeStyle='#000';c.lineWidth=1.5;c.stroke();c.restore()}
    c.globalAlpha=1}
  // the trap that just killed you laughs at you; traps snicker when they wake up
  if(G.state==='dead'&&G.killer&&G.deadT>.04&&G.deadT<2.2){const a=anchor(G.killer);bubble(c,a[0],a[1],G.laughTxt||'هههههه',G.deadT)}
  else if(G.snk&&G.snk.t>0&&G.state==='play'){const a=anchor(G.snk.e);bubble(c,a[0],a[1],G.snk.txt,.85-G.snk.t+.12)}
  // the hero talks (text bubble even when no recording exists yet)
  if(G.hsay&&G.state!=='title'){ const w=Math.max(34,G.hsay.txt.length*9+20), px=clamp(P.x+PW/2,cam+w/2+6,cam+VW-w/2-6); bubble(c,px,P.y-(G.state==='dead'?46:16),G.hsay.txt,G.hsay.t0-G.hsay.t,'#fff3c4') }
  // the boss talks
  if(G.bsay&&L.boss&&G.state!=='title'){ const w=Math.max(34,G.bsay.txt.length*9+20); bubble(c,clamp(BX-215,cam+w/2+6,cam+VW-w/2-6),122,G.bsay.txt,G.bsay.t0-G.bsay.t,'#e9d7ff') }
  // rear-arrow warnings at the screen edge
  for(const e of L.ents){ if(e.t==='tur'&&e.v==='rear'&&e.q.length){const s=e.q[0];if(s.at<e.tele+.2){const y=LANE_Y[s.lane];c.fillStyle=Math.floor(G.t*12)%2?'#ff3b3b':'#fff';c.strokeStyle='#000';c.lineWidth=2.4;c.beginPath();c.moveTo(cam+8,y);c.lineTo(cam+30,y-12);c.lineTo(cam+30,y+12);c.closePath();c.fill();c.stroke()}} }
  c.restore();
  // vignette light
  if(look3()){drawMotes3(c,cam);drawLight3(c,cam,th)} else {
  const px=P.x+PW/2-cam,py=P.y;const vg=c.createRadialGradient(px,py,90,px,py,460);vg.addColorStop(0,'#0000');vg.addColorStop(1,'#000a');c.fillStyle=vg;c.fillRect(0,0,VW,VH); }
  if(G.dark>.01)drawDark(c,cam);
  if(G.warn>0){const w=clamp(G.warn,0,1);const wg=c.createRadialGradient(VW/2,VH/2,150,VW/2,VH/2,460);wg.addColorStop(0,'#0000');wg.addColorStop(1,'rgba(255,40,70,'+(w*.5)+')');c.fillStyle=wg;c.fillRect(0,0,VW,VH)}
  if(L.boss&&!G.endCard)drawBossHud(c);
  // banner
  if(G.bannerT>0&&G.state!=='title'){const a=clamp(G.bannerT/.6,0,1)*clamp((2.4-G.bannerT)/.25,0,1);c.globalAlpha=a;c.textAlign='center';c.direction='rtl';c.lineJoin='round';
    c.font='900 54px Tahoma,Arial';c.strokeStyle='#000';c.lineWidth=9;c.fillStyle='#ffd23f';c.strokeText(G.bannerTxt[0],VW/2,150-(1-a)*18);c.fillText(G.bannerTxt[0],VW/2,150-(1-a)*18);
    c.font='900 28px Tahoma,Arial';c.lineWidth=7;c.fillStyle='#fff';c.strokeText(G.bannerTxt[1],VW/2,192);c.fillText(G.bannerTxt[1],VW/2,192);c.globalAlpha=1}
  if(G.state==='win'&&G.endCard)drawEndCard(c);
  if(G.state==='win'){c.fillStyle='rgba(53,208,127,'+clamp(.25-G.winT*.08,0,.25)+')';c.fillRect(0,0,VW,VH)}
}

/* lights-out prank: everything goes dark except a small flickering pool around the hero */
const exitPx=()=>L.exitX!=null?L.exitX:L.exitTx*TS;
function drawDark(c,cam){
  const a=G.dark; let k=a;
  if(G.darkT>0&&G.darkT>(G.darkMax||2)-.9&&Math.sin(G.t*37)*Math.sin(G.t*11.3)>.45)k*=.22;       // flicker as the lights die
  const px=P.x+PW/2-cam, py=P.y+PH/2, R=lerp(260,100,k), g=c.createRadialGradient(px,py,16,px,py,R);
  g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(.4,'rgba(0,0,8,'+(.5*k)+')'); g.addColorStop(1,'rgba(0,0,4,'+(.97*k)+')');
  c.fillStyle=g; c.fillRect(0,0,VW,VH);
}
