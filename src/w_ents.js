/* =============== ENTITIES (plain data + behaviour table, so a world snapshot is just JSON) =============== */
const B={};
const addE=e=>{L.ents.push(e);return e};
const isK=e=>G.state==='dead'&&G.killer===e;               // this trap just killed the hero -> it laughs
const snick=(e,txt)=>{ if(SIM||G.snkCd>0)return; G.snkCd=2.6; G.snk={e,t:.85,txt:txt||rnd(['هههه','هيهي','بخخخ','😏','ههه!','هاي!'])}; if(G.state==='play'&&Math.random()<.22)heroSay('warn',{cd:12,pri:1,delay:.4,max:1.3,dur:1.7}) };

/* a laughing / sneering face, drawn at (x,y), scale s. mood: sly | wide | laugh | angry */
function face(c,x,y,s,mood){
  if(look3())return face3(c,x,y,s,mood);
  const lx=clamp((pcx()-x)/70,-1,1), ly=clamp((P.y+PH/2-y)/70,-1,1), lg=mood==='laugh';
  c.save();c.translate(x,y);c.scale(s,s);c.lineJoin='round';c.lineCap='round';c.strokeStyle='#000';c.lineWidth=2;
  if(lg)c.translate(0,Math.sin(G.t*40)*.9);
  for(const sx of [-1,1]){
    const ex=sx*5.6;
    if(lg){c.beginPath();c.moveTo(ex-3.6,-2.5);c.quadraticCurveTo(ex,-8,ex+3.6,-2.5);c.stroke()}
    else{
      c.fillStyle='#fff';c.beginPath();c.ellipse(ex,-3,mood==='wide'?4.6:4,mood==='sly'?3.2:4.4,0,0,7);c.fill();c.stroke();
      c.fillStyle='#000';c.beginPath();c.arc(ex+lx*1.7,-3+ly*1.4,mood==='wide'?1.2:1.9,0,7);c.fill();
      if(mood==='sly'){c.fillRect(ex-4.2,-7.6,8.4,3.4)}
      if(mood==='angry'){c.lineWidth=2.6;c.beginPath();c.moveTo(ex-sx*-4.5,-9.5+0);c.lineTo(ex+sx*-4.2,-5.4);c.moveTo(ex-4.4,-9.2+(sx>0?0:4.6));c.lineTo(ex+4.4,-9.2+(sx>0?4.6:0));c.stroke();c.lineWidth=2}
    }
  }
  if(lg){c.fillStyle='#3a0a10';c.beginPath();c.moveTo(-6.5,2);c.quadraticCurveTo(0,13,6.5,2);c.closePath();c.fill();c.stroke();c.fillStyle='#ff5d78';c.beginPath();c.ellipse(0,7.2,3.2,2.2,0,0,7);c.fill();
    c.fillStyle='#7fd8ff';[-1,1].forEach(sx=>{c.beginPath();c.ellipse(sx*9.3,1.6+((G.t*9)%1)*4,1.4,2.2,0,0,7);c.fill()})}
  else if(mood==='wide'){c.fillStyle='#3a0a10';c.beginPath();c.ellipse(0,5.2,2.3,3,0,0,7);c.fill();c.stroke()}
  else if(mood==='angry'){c.fillStyle='#fff';c.beginPath();c.rect(-5,3.2,10,4.4);c.fill();c.stroke();c.beginPath();c.moveTo(-1.7,3.2);c.lineTo(-1.7,7.6);c.moveTo(1.7,3.2);c.lineTo(1.7,7.6);c.stroke()}
  else{c.beginPath();c.moveTo(-5,3.6);c.quadraticCurveTo(0,9,6.2,2);c.stroke()}
  c.restore();
}
function bubble(c,x,y,txt,t,fill){
  const k=clamp(t*8,0,1),w=Math.max(34,txt.length*9+20),F=fill||'#fff';
  c.save();c.translate(x,y);c.scale(k,k);c.rotate(Math.sin(G.t*25)*.05);
  c.fillStyle=F;c.strokeStyle='#000';c.lineWidth=2.6;c.beginPath();c.roundRect(-w/2,-34,w,24,10);c.fill();c.stroke();
  c.beginPath();c.moveTo(-5,-11);c.lineTo(0,-2);c.lineTo(6,-11);c.fillStyle=F;c.fill();c.stroke();
  c.fillStyle=F;c.fillRect(-4,-12.5,9,3);
  c.fillStyle='#1b1230';c.font='900 15px Tahoma,Arial';c.textAlign='center';c.direction='rtl';c.fillText(txt,0,-17);c.restore();
}
const anchor=e=>{ switch(e.t){
  case'spk':return[e.x+e.w/2,e.by-24];case'hog':return[e.x,e.y-20];case'ceil':return[e.x+e.w/2,e.y+e.len+8];case'tur':return[e.x,GY-70];
  case'thw':return[e.x,e.y-6];case'anv':return[e.x+e.w/2,e.y-4];case'saw':return[e.x,e.y-26];case'pend':{const p=pendPos(e);return[p[0],p[1]-26]}
  case'walk':return[e.x,e.y-e.h-8];case'fish':return[e.x,e.y-22];case'spring':return[e.x+16,GY-30];case'shot':return[e.x,e.y-14];case'fake':return[e.x+16,GY-70];
  case'chase':return[e.x-(e.v==='wall'?70:0),e.y-(e.v==='wall'?110:60)];case'ghost':return[e.x,e.y-30];case'boss':return[e.x,e.y-100];case'erupt':return[e.x+e.w/2,GY-34];default:return[e.x||0,(e.y||GY)-20] } };

/* ---------------- floor spikes: static | hidden | pulse | slide | sneak ---------------- */
function mkSpk(v,tx,len,o){o=o||{};
  const e={t:'spk',v,x:tx*TS,w:len*TS,by:o.by||GY,up:(v==='static'||v==='slide'||v==='sneak')?1:0,arm:0,pop:0,tm:o.ph||0,dl:o.dl==null?.2:o.dl,per:o.per||2.2,on:o.on||.9,x0:0,x1:0,dir:1,sp:o.sp||0,rad:o.rad||150};
  if(o.rng){e.x0=o.rng[0]*TS;e.x1=o.rng[1]*TS-e.w} return e}
B.spk={
 upd(e,dt){
  if(e.v==='hidden'){
    if(!e.pop){ const cx=pcx();
      if(e.arm>0){e.arm-=dt;if(e.arm<=0){e.pop=1;Snd.pop();puff(e.x+e.w/2,e.by,6)}}
      else if(cx>e.x-42&&cx<e.x+e.w+8){e.arm=e.dl;snick(e)} }
    else if(e.up<1)e.up=Math.min(1,e.up+dt*14);
  } else if(e.v==='pulse'){
    e.tm+=dt; const k=e.tm%e.per, off=e.per-e.on-.3, tgt=k<off?0:(k<off+.3?.22:1);
    if(tgt>e.up)e.up=Math.min(tgt,e.up+dt*(tgt>.5?16:3)); else e.up=Math.max(tgt,e.up-dt*9);
    if(tgt===1&&e.lk!==1&&Math.abs(pcx()-e.x)<500){Snd.pop()} e.lk=tgt;
  } else if(e.v==='slide'){
    e.x+=e.dir*e.sp*dt; if(e.x>e.x1){e.x=e.x1;e.dir=-1} if(e.x<e.x0){e.x=e.x0;e.dir=1}
  } else if(e.v==='sneak'){
    if(!P.onGround&&P.vy>0&&Math.abs(pcx()-(e.x+e.w/2))<e.w/2+70){ const d=clamp(pcx()-e.w/2,e.x0,e.x1)-e.x; e.x+=clamp(d,-e.sp*dt,e.sp*dt) }
  }
 },
 hit(e){ if(e.up<.5)return null; return hitRect(prect(),{x:e.x+3,y:e.by-14*e.up,w:e.w-6,h:14*e.up})?'spike':null },
 draw(e,c,th){
  const wob=e.up>0&&e.up<.5?Math.sin(G.t*60)*1.2:0, h=14*e.up, n=e.w/16;
  if(e.up<=.01){ if(e.v!=='hidden'||L.n<8){c.strokeStyle='#0006';c.lineWidth=2;for(let i=0;i<e.w/TS;i++){c.beginPath();c.moveTo(e.x+i*TS+6,e.by+3);c.lineTo(e.x+i*TS+TS-6,e.by+3);c.stroke()}} return }
  c.fillStyle='#14101e';c.strokeStyle='#000';c.lineWidth=2;c.fillRect(e.x,e.by-2,e.w,5);
  c.fillStyle='#d9dde8';c.lineWidth=2.4;
  for(let i=0;i<n;i++){const x0=e.x+i*16+wob;c.beginPath();c.moveTo(x0+1,e.by-1);c.lineTo(x0+8,e.by-h-3);c.lineTo(x0+15,e.by-1);c.closePath();c.fill();c.stroke()}
  if(e.up>.4){ const fx=e.x+e.w/2; face(c,fx,e.by-6.5,.62,isK(e)?'laugh':(Math.abs(pcx()-fx)<110?'wide':'sly')) }
 }};

/* ---------------- spiky hopper ---------------- */
function mkHog(tx0,tx1,o){o=o||{};return{t:'hog',x:(tx0+tx1)/2*TS,x0:tx0*TS+14,x1:tx1*TS-14,by:GY,y:GY-13,vy:0,vx:0,dir:-1,st:0,tm:o.cd0||.5,cd:o.cd||1,hv:o.hv||95,jv:o.jv||460,tele:o.tele||.3}}
B.hog={
 upd(e,dt){
  if(e.st===0){e.tm-=dt;if(e.tm<=0){e.st=1;e.tm=e.tele;snick(e)}}
  else if(e.st===1){e.tm-=dt;if(e.tm<=0){e.st=2;e.vy=-e.jv;e.vx=e.dir*e.hv}}
  else{ e.vy+=1500*dt;e.y+=e.vy*dt;e.x+=e.vx*dt;
    if(e.x<e.x0){e.x=e.x0;e.dir=1;e.vx=Math.abs(e.vx)} if(e.x>e.x1){e.x=e.x1;e.dir=-1;e.vx=-Math.abs(e.vx)}
    if(e.y>=e.by-13){e.y=e.by-13;e.vy=0;e.st=0;e.tm=e.cd;puff(e.x,e.by,3)} }
 },
 hit(e){return circHit(e.x,e.y,12.5,prect())?'spike':null},
 draw(e,c,th){
  const sq=e.st===1?.78+.22*(e.tm/e.tele):1; c.save();c.translate(e.x,e.y+13);c.scale(1/sq*(e.st===1?1.12:1),sq);c.translate(0,-13);
  c.strokeStyle='#000';c.lineWidth=2.4;c.fillStyle='#5d4d86';c.beginPath();c.arc(0,0,11.5,0,7);c.fill();c.stroke();
  c.fillStyle='#d9dde8';for(let i=0;i<12;i++){const a=i/12*Math.PI*2+(e.st===2?G.t*6:0);c.beginPath();c.moveTo(Math.cos(a-.2)*10,Math.sin(a-.2)*10);c.lineTo(Math.cos(a)*19,Math.sin(a)*19);c.lineTo(Math.cos(a+.2)*10,Math.sin(a+.2)*10);c.closePath();c.fill();c.stroke()}
  c.fillStyle='#5d4d86';c.beginPath();c.arc(0,0,11,0,7);c.fill();
  face(c,0,1,.9,isK(e)?'laugh':(e.st===1?'angry':'sly')); c.restore();
 }};

/* ---------------- ceiling spikes: static (anti double-jump) | drop (falling icicles) ---------------- */
function mkCeil(v,tx,len,o){o=o||{};return{t:'ceil',v,x:tx*TS,w:len*TS,len:o.len||(v==='drop'?44:210),y:14,st:0,tm:0,vy:0,trig:o.trig||20,warn:o.warn||.34}}
B.ceil={
 upd(e,dt){ if(e.v!=='drop')return;
  if(e.st===0){ if(Math.abs(pcx()-(e.x+e.w/2))<e.w/2+e.trig){e.st=1;e.tm=e.warn;snick(e)} }
  else if(e.st===1){e.tm-=dt;if(e.tm<=0){e.st=2;e.vy=0}}
  else if(e.st===2){e.vy+=2300*dt;e.y+=e.vy*dt;if(e.y+e.len>=GY){e.y=GY-e.len;e.st=3;e.tm=.25;Snd.land();puff(e.x+e.w/2,GY,5)}}
  else if(e.st===3){e.tm-=dt;if(e.tm<=0)e.rm=1}
 },
 hit(e){ if(e.v==='drop'&&e.st<2)return null; return hitRect(prect(),{x:e.x+3,y:e.y,w:e.w-6,h:e.len})?'spike':null },
 draw(e,c,th){
  c.strokeStyle='#000';c.lineWidth=2.4;const n=Math.max(1,Math.round(e.w/22)),sw=e.w/n,sh=e.st===1?Math.sin(G.t*70)*1.6:0;
  if(e.v==='static'){ c.fillStyle='#2a2140';c.fillRect(e.x,14,e.w,18);c.strokeRect(e.x,14,e.w,18) }
  for(let i=0;i<n;i++){const x0=e.x+i*sw+sh,L0=e.v==='static'?e.len*(.78+.22*((i*7)%3)/2):e.len;
    c.fillStyle='#a9a2c4';c.beginPath();c.moveTo(x0+2,e.y+(e.v==='static'?16:0));c.lineTo(x0+sw/2,e.y+L0);c.lineTo(x0+sw-2,e.y+(e.v==='static'?16:0));c.closePath();c.fill();c.stroke();
    c.fillStyle='#ffffff30';c.beginPath();c.moveTo(x0+4,e.y+(e.v==='static'?16:0));c.lineTo(x0+sw/2-1,e.y+L0*.8);c.lineTo(x0+sw/2-3,e.y+(e.v==='static'?16:0));c.fill()}
  if(e.v==='static'||e.st>=1){ const fx=e.x+e.w/2,fy=e.y+(e.v==='static'?44:Math.min(e.len*.4,18)); face(c,fx,fy,e.v==='static'?1:.7,isK(e)?'laugh':(e.st===1?'angry':'sly')) }
 }};

/* ---------------- projectiles (arrows, falling arrows) ---------------- */
function mkShot(o){return Object.assign({t:'shot',x:0,y:0,vx:0,vy:0,w:26,h:6,tele:0,life:6,fall:0},o)}
B.shot={
 upd(e,dt){ if(e.tele>0){e.tele-=dt;if(e.tele<=0&&e.fall)Snd.whoosh();return} e.x+=e.vx*dt;e.y+=e.vy*dt;e.life-=dt;if(e.life<=0||e.y>GY+6||e.x<-80||e.x>L.w*TS+80)e.rm=1 },
 hit(e){ if(e.tele>0)return null; return hitRect(prect(),{x:e.x-e.w/2,y:e.y-e.h/2,w:e.w,h:e.h})?'arrow':null },
 draw(e,c,th){
  if(e.tele>0){ if(e.lane){ const a=Math.floor(G.t*14)%2?.9:.4; c.globalAlpha=a;c.strokeStyle='#ff3b3b';c.lineWidth=2;c.setLineDash([8,7]);c.beginPath();c.moveTo(e.x-12,e.y);c.lineTo(0,e.y);c.stroke();c.setLineDash([]);c.fillStyle='#ff3b3b';c.strokeStyle='#000';c.beginPath();c.moveTo(e.x+4,e.y);c.lineTo(e.x-12,e.y-11);c.lineTo(e.x-12,e.y+11);c.closePath();c.fill();c.stroke();c.fillStyle='#fff';c.font='900 12px Arial';c.textAlign='center';c.fillText('!',e.x-5,e.y+4);c.globalAlpha=1;return}
    if(!e.fall)return; const a=Math.floor(G.t*14)%2?1:.45; c.globalAlpha=a;c.fillStyle='#ff3b3b';{const hw=e.boss?15:11;c.fillRect(e.x-hw,14,hw*2,GY-14)}c.globalAlpha=.9;c.fillStyle='#ff3b3b';c.strokeStyle='#000';c.lineWidth=2.4;c.beginPath();c.arc(e.x,34,10,0,7);c.fill();c.stroke();c.fillStyle='#fff';c.font='900 14px Arial';c.textAlign='center';c.fillText('!',e.x,39);c.globalAlpha=1;return}
  c.save();c.translate(e.x,e.y);
  if(e.fall){c.rotate(Math.PI/2);c.scale(1,1)} else if(e.vx>0)c.scale(-1,1);
  c.strokeStyle='#000';c.lineWidth=2;c.beginPath();c.moveTo(-14,0);c.lineTo(-3,-5);c.lineTo(-3,5);c.closePath();c.fillStyle='#c8ccd4';c.fill();c.stroke();
  c.fillStyle='#8a5a2b';c.fillRect(-3,-1.5,24,3);c.strokeRect(-3,-1.5,24,3);
  c.fillStyle='#fff';c.fillRect(14,-10,17,9);c.strokeRect(14,-10,17,9);c.fillStyle='#c00';c.font='bold 7px Tahoma';c.textAlign='center';c.direction='rtl';c.fillText('آسف',22.5,-3);
  c.restore()
 }};

/* ---------------- turrets: lane | volley | sniper | rain | rear ---------------- */
const LANE_Y={lo:GY-10,hi:GY-44};
function mkTur(tx,o){o=o||{};return{t:'tur',v:o.v||'lane',x:tx*TS+16,side:o.side||-1,range:o.range||320,per:o.per||2,spd:o.spd||220,tele:o.tele||.5,cd:o.cd0==null?.7:o.cd0,hi:!!o.hi,q:[],n:o.n||3,gapT:o.gapT||.7,aim:0,lock:0}}
function turPlan(e){
  const L2=()=>(e.hi&&rf()<.5)?'hi':'lo';
  if(e.v==='lane'||e.v==='rear'||e.v==='sniper'){e.q.push({at:e.tele,lane:L2()})}
  else if(e.v==='volley'){ let ln=rf()<.5?'lo':'hi'; for(let i=0;i<e.n;i++){e.q.push({at:e.tele+i*e.gapT,lane:ln}); ln=ln==='lo'?'hi':'lo'} }
  else if(e.v==='rain'){ for(let i=0;i<e.n;i++)e.q.push({at:.15+i*.42,rain:1}) }
}
B.tur={
 upd(e,dt){
  const near=Math.abs(pcx()-e.x)<e.range+200 && (e.side<0?pcx()<e.x+30:pcx()>e.x-30);
  e.aim=0;
  if(!near&&!e.q.length)return;
  if(near){ e.cd-=dt; if(e.cd<=0&&!e.q.length){e.cd=e.per;turPlan(e)} }
  for(const s of e.q){ s.at-=dt;
    if(e.v==='sniper'&&s.at<e.tele&&s.at>0){ e.aim=1; if(s.at>.2||s.ly==null)s.ly=clamp(P.y+PH/2,60,GY-8) } }
  const keep=[]; for(const s of e.q){ if(s.at>0){keep.push(s);continue}
    if(s.rain){ const col=clamp(pcx()+P.vx*.55+(rf()-.5)*60,e.x-e.range,e.x+20); addE(mkShot({x:col,y:20,vy:640,w:6,h:26,tele:.5,fall:1})) }
    else{ const y=e.v==='sniper'?s.ly:LANE_Y[s.lane]; addE(mkShot({x:e.x,y,vx:e.side*e.spd,life:(e.range+300)/e.spd+.5})); Snd.whoosh() } }
  e.q=keep;
 },
 hit(){return null},
 draw(e,c,th){
  const x=e.x; c.fillStyle='#07040d';c.strokeStyle='#000';c.lineWidth=3;c.fillRect(x-13,GY-62,26,60);c.strokeRect(x-13,GY-62,26,60);
  const tl=e.q.some(s=>s.at>0&&s.at<e.tele+.01), lane=e.q[0]&&e.q[0].lane;
  const lamp=(y,on)=>{c.fillStyle=on?(Math.floor(G.t*14)%2?'#ff3b3b':'#fff'):'#3a2a50';c.beginPath();c.arc(x,y,5,0,7);c.fill();c.strokeStyle='#000';c.lineWidth=2;c.stroke()};
  if(e.v==='rain'){ lamp(GY-40,tl);lamp(GY-10,tl) } else if(e.v==='sniper'){ lamp(GY-25,e.aim) } else {lamp(GY-40,tl&&lane==='hi');lamp(GY-10,tl&&lane!=='hi')}
  face(c,x,GY-52,.8,isK(e)?'laugh':(tl?'angry':'sly'));
  if(e.aim){ const s=e.q[0]; if(s&&s.ly!=null){c.strokeStyle='#ff3b3bcc';c.lineWidth=1.6;c.setLineDash([6,5]);c.beginPath();c.moveTo(x-14,s.ly);c.lineTo(x-e.range,s.ly);c.stroke();c.setLineDash([])} }
 }};

/* ---------------- thwomp ---------------- */
function mkThw(tx,o){o=o||{};return{t:'thw',x:tx*TS+16,w:46,h:46,y:14,st:0,tm:o.t0==null?1:o.t0,vy:0,wait:o.wait||1.4,warn:o.warn||.34,rest:o.rest||.4,on:0,rise:o.rise||340}}
B.thw={
 upd(e,dt){
  if(!e.on){ if(Math.abs(pcx()-e.x)<460)e.on=1; else return }
  if(e.st===0){e.tm-=dt;if(e.tm<=0){e.st=1;e.tm=e.warn;snick(e)}}
  else if(e.st===1){e.tm-=dt;if(e.tm<=0){e.st=2;e.vy=0}}
  else if(e.st===2){e.vy+=3400*dt;e.y+=e.vy*dt;if(e.y+e.h>=GY){e.y=GY-e.h;e.st=3;e.tm=e.rest;Snd.anvilHit();G.shake=Math.max(G.shake,7);puff(e.x,GY,10)}}
  else if(e.st===3){e.tm-=dt;if(e.tm<=0)e.st=4}
  else{e.y-=e.rise*dt;if(e.y<=14){e.y=14;e.st=0;e.tm=e.wait*(.85+rf()*.3)}}
 },
 hit(e){ return hitRect(prect(),{x:e.x-e.w/2+3,y:e.y+2,w:e.w-6,h:e.h-2})?'crush':null },
 draw(e,c,th){
  const sh=e.st===1?Math.sin(G.t*80)*1.8:0, x=e.x+sh, y=e.y;
  c.strokeStyle='#000';c.lineWidth=3;
  c.strokeStyle='#4a4358';c.lineWidth=5;c.beginPath();c.moveTo(x,0);c.lineTo(x,y);c.stroke();
  c.strokeStyle='#000';c.lineWidth=3;c.fillStyle='#5b546e';c.fillRect(x-23,y,46,e.h);c.strokeRect(x-23,y,46,e.h);
  c.fillStyle='#6d6585';c.fillRect(x-20,y+3,40,5);c.fillStyle='#403a52';[[-18,e.h-9],[14,e.h-9],[-18,5],[14,5]].forEach(([a,b])=>{c.beginPath();c.arc(x+a+2,y+b+2,2.4,0,7);c.fill()});
  const mood=isK(e)?'laugh':(e.st===0?'sly':(e.st===3||e.st===4?'sly':'angry')); face(c,x,y+e.h*.46,1.25,mood);
  if(e.st===3||e.st===4){c.fillStyle='#fff8';for(let i=0;i<3;i++){c.fillRect(x-20+i*14,y+e.h-2,8,3)}}
  if(e.st===1){c.fillStyle='#ff3b3b';for(let i=0;i<3;i++){c.fillRect(x-14+i*12,GY-3,8,3)}}
 }};

/* ---------------- falling cargo (anvil, piano, fridge, safe, cactus) ---------------- */
const CARGO={anvil:{w:36,h:30},piano:{w:60,h:36},fridge:{w:34,h:54},safe:{w:40,h:40},cactus:{w:30,h:40}};
function mkAnv(tx,o){o=o||{};const cg=CARGO[o.c||'anvil'];return{t:'anv',c:o.c||'anvil',x:o.mx!==undefined?o.mx:tx*TS-2,w:cg.w,h:cg.h,y:14,vy:0,s:o.mx!==undefined?1:0,tm:0,warn:o.mx!==undefined?.4:(o.warn||.4),trig:o.trig||80,v0:o.v0||0,g:o.g||1900,show:!!o.show,land:0}}
B.anv={
 upd(e,dt){ const cx=pcx();
  if(e.s===0&&!P.dead&&cx>e.x-e.trig&&cx<e.x+e.w+8){e.s=1;e.tm=0;Snd.rumble();snick(e)}
  else if(e.s===1){e.tm+=dt;if(e.tm>=e.warn){e.s=2;e.vy=e.v0}}
  else if(e.s===2){e.vy+=e.g*dt;e.y+=e.vy*dt;if(e.y+e.h>=GY){e.y=GY-e.h;e.s=3;e.land=0;Snd.anvilHit();G.shake=10;puff(e.x+e.w/2,GY,12)}}
  else if(e.s===3){e.land+=dt;if(e.land>.9)e.s=4}
  if(e.s>=4)e.rm=1;
 },
 hit(e){ if(e.s!==2&&!(e.s===3&&e.land<.08))return null; return hitRect(prect(),{x:e.x+3,y:e.y+3,w:e.w-6,h:e.h-4})?'crush':null },
 draw(e,c,th){ if(e.s>=4)return; const a=e.s===3?clamp(1-(e.land-.5)/.4,0,1):1; c.globalAlpha=a;
  if(e.s<=2&&(e.show||e.s>=1)){ const k=e.s===0?0.15:(e.s===1?.3+.5*e.tm/e.warn:1); c.fillStyle='rgba(0,0,0,'+(.35*k)+')';c.beginPath();c.ellipse(e.x+e.w/2,GY+2,e.w*.7*k+6,5,0,0,7);c.fill() }
  const ox=e.s===1?Math.sin(G.t*90)*2:0, x=e.x+ox, y=e.y; c.strokeStyle='#000';c.lineWidth=3;
  if(e.s<3){c.beginPath();c.moveTo(x+e.w/2,0);c.lineTo(x+e.w/2,y);c.strokeStyle='#555';c.lineWidth=4;c.stroke()}
  c.strokeStyle='#000';c.lineWidth=3;
  if(e.c==='anvil'){c.fillStyle='#3d4150';c.beginPath();c.moveTo(x+4,y);c.lineTo(x+32,y);c.lineTo(x+36,y+10);c.lineTo(x+24,y+13);c.lineTo(x+27,y+22);c.lineTo(x+33,y+22);c.lineTo(x+33,y+30);c.lineTo(x+3,y+30);c.lineTo(x+3,y+22);c.lineTo(x+9,y+22);c.lineTo(x+12,y+13);c.lineTo(x,y+10);c.closePath();c.fill();c.stroke();c.fillStyle='#fff';c.font='900 9px Tahoma';c.textAlign='center';c.fillText('16T',x+18,y+25)}
  else if(e.c==='piano'){c.fillStyle='#1c1826';c.fillRect(x,y,60,30);c.strokeRect(x,y,60,30);c.fillStyle='#fff';c.fillRect(x+3,y+18,54,10);c.strokeRect(x+3,y+18,54,10);c.fillStyle='#000';for(let i=0;i<9;i++)c.fillRect(x+7+i*6,y+18,3,6);c.fillStyle='#1c1826';c.fillRect(x+4,y+30,5,6);c.fillRect(x+51,y+30,5,6)}
  else if(e.c==='fridge'){c.fillStyle='#e9eef5';c.fillRect(x,y,34,54);c.strokeRect(x,y,34,54);c.beginPath();c.moveTo(x,y+20);c.lineTo(x+34,y+20);c.stroke();c.fillStyle='#8a97ab';c.fillRect(x+26,y+6,3,10);c.fillRect(x+26,y+25,3,14)}
  else if(e.c==='safe'){c.fillStyle='#4f6b4a';c.fillRect(x,y,40,40);c.strokeRect(x,y,40,40);c.fillStyle='#ffd23f';c.beginPath();c.arc(x+20,y+20,9,0,7);c.fill();c.stroke();c.beginPath();c.moveTo(x+20,y+20);c.lineTo(x+20,y+13);c.stroke();c.fillStyle='#fff';c.font='900 8px Tahoma';c.textAlign='center';c.fillText('$$$',x+20,y+37)}
  else{c.fillStyle='#b3552b';c.fillRect(x+5,y+26,20,14);c.strokeRect(x+5,y+26,20,14);c.fillStyle='#3da34d';c.beginPath();c.roundRect(x+9,y,12,28,6);c.fill();c.stroke();c.beginPath();c.roundRect(x+1,y+8,9,5,3);c.roundRect(x+20,y+4,9,5,3);c.fill();c.stroke()}
  if(e.s>=1){ face(c,x+e.w/2,y+e.h*(e.c==='anvil'?.38:.45),.85,isK(e)?'laugh':(e.s===2?'angry':'wide')) }
  c.globalAlpha=1}};

/* ---------------- saws: floor | vert | orbit | roll | hi ---------------- */
function mkSaw(v,o){return Object.assign({t:'saw',v,x:0,y:GY-14,r:13,rot:0,dir:Math.random()<.5?1:-1,sp:100,ph:0,on:v!=='roll'},o)}
B.saw={
 upd(e,dt){
  e.rot+=dt*14*(e.dir||1);
  if(e.v==='floor'||e.v==='hi'){e.x+=e.dir*e.sp*dt;if(e.x>e.x1){e.x=e.x1;e.dir=-1}if(e.x<e.x0){e.x=e.x0;e.dir=1}}
  else if(e.v==='vert'){e.ph+=dt*e.sp/Math.max(1,e.y1-e.y0)*Math.PI;e.y=e.y0+(e.y1-e.y0)*(.5-.5*Math.cos(e.ph))}
  else if(e.v==='orbit'){e.ph+=dt*e.sp;e.x=e.cx+Math.cos(e.ph)*e.R;e.y=e.cy+Math.sin(e.ph)*e.R}
  else if(e.v==='roll'){ if(!e.on){ if(Math.abs(pcx()-e.x)<e.trig){e.on=1;Snd.rumble();snick(e)} return } e.x-=e.sp*dt; if(e.x<-60)e.rm=1 }
 },
 hit(e){ if(!e.on)return null; if(e.v==='orbit'){} return circHit(e.x,e.y,e.r,prect())?'saw':null },
 draw(e,c,th){
  if(e.v==='floor'||e.v==='hi'){c.fillStyle='#0008';c.fillRect(e.x0-14,e.y+11,e.x1-e.x0+28,3)}
  else if(e.v==='vert'){c.fillStyle='#0008';c.fillRect(e.x-2,14,4,GY-14)}
  else if(e.v==='orbit'){c.strokeStyle='#0005';c.lineWidth=3;c.beginPath();c.arc(e.cx,e.cy,e.R,0,7);c.stroke();c.fillStyle='#3d4150';c.beginPath();c.arc(e.cx,e.cy,6,0,7);c.fill();c.strokeStyle='#000';c.lineWidth=2;c.stroke()}
  if(e.v==='roll'&&!e.on){ c.fillStyle='#e04b4b';c.font='900 16px Arial';c.textAlign='center';c.fillText('⚠',e.x+40,GY-30); }
  c.save();c.translate(e.x,e.y);c.rotate(e.rot);c.fillStyle='#cfd5e0';c.strokeStyle='#000';c.lineWidth=2.6;c.beginPath();
  const R=e.r+4,r2=e.r-2;for(let i=0;i<16;i++){const a=i/16*Math.PI*2,r=i%2?r2:R;c.lineTo(Math.cos(a)*r,Math.sin(a)*r)}c.closePath();c.fill();c.stroke();
  c.fillStyle='#e04b4b';c.beginPath();c.arc(0,0,e.r*.34,0,7);c.fill();c.stroke();c.restore();
  face(c,e.x,e.y+1,.62,isK(e)?'laugh':'angry');
 }};

/* ---------------- pendulum ball ---------------- */
const pendPos=e=>{const a=e.amp*Math.sin(e.ph);return[e.px+Math.sin(a)*e.len,14+Math.cos(a)*e.len]};
function mkPend(tx,o){return{t:'pend',px:tx*TS+16,len:o.len||318,amp:o.amp||.46,w:o.w||1.7,ph:o.ph||0,r:17}}
B.pend={
 upd(e,dt){ e.ph+=dt*e.w },
 hit(e){const p=pendPos(e);return circHit(p[0],p[1],e.r-1,prect())?'ball':null},
 draw(e,c,th){ const p=pendPos(e);
  c.strokeStyle='#000';c.lineWidth=5;c.beginPath();c.moveTo(e.px,14);c.lineTo(p[0],p[1]);c.stroke();c.strokeStyle='#8c8498';c.lineWidth=2.4;c.setLineDash([5,3]);c.beginPath();c.moveTo(e.px,14);c.lineTo(p[0],p[1]);c.stroke();c.setLineDash([]);
  c.fillStyle='#2a2140';c.beginPath();c.arc(e.px,14,7,0,7);c.fill();c.strokeStyle='#000';c.lineWidth=2.4;c.stroke();
  c.fillStyle='#4b4660';c.strokeStyle='#000';c.lineWidth=3;c.beginPath();c.arc(p[0],p[1],e.r,0,7);c.fill();c.stroke();
  c.fillStyle='#fff3';c.beginPath();c.arc(p[0]-6,p[1]-7,4,0,7);c.fill();
  face(c,p[0],p[1]+1,1.1,isK(e)?'laugh':'angry') }};

/* ---------------- monsters: walker | spiky | charger | jumper | bat (stompable except spiky) ---------------- */
function mkWalk(v,o){return Object.assign({t:'walk',v,x:0,by:GY,y:GY,w:26,h:24,dir:-1,sp:60,st:0,tm:0,vy:0,dead:0,x0:0,x1:0},o)}
B.walk={
 upd(e,dt){
  if(e.dead){e.dead+=dt;if(e.dead>.7)e.rm=1;return}
  if(e.v==='walker'||e.v==='spiky'){ e.x+=e.dir*e.sp*dt; if(e.x>e.x1){e.x=e.x1;e.dir=-1} if(e.x<e.x0){e.x=e.x0;e.dir=1} e.tm+=dt }
  else if(e.v==='charger'){
    if(e.st===0){ if(Math.abs(pcx()-e.x)<e.trig&&P.x<e.x){e.st=1;e.tm=.6;Snd.squeak();snick(e,'ورااا')} }
    else if(e.st===1){e.tm-=dt;if(e.tm<=0){e.st=2}}
    else if(e.st===2){e.x+=e.dir*e.sp*dt;e.tm+=dt;if(e.x<e.x0){e.x=e.x0;e.st=3;e.tm=0}}
    else e.tm+=dt;
  } else if(e.v==='jumper'){
    if(e.st===0){e.tm-=dt;if(e.tm<=0){e.st=1;e.tm=.28}} else if(e.st===1){e.tm-=dt;if(e.tm<=0){e.st=2;e.vy=-e.jv;e.dir=(pcx()<e.x)?-1:1}}
    else{ e.vy+=1500*dt;e.y+=e.vy*dt;e.x=clamp(e.x+e.dir*e.hv*dt,e.x0,e.x1); if(e.y>=e.by){e.y=e.by;e.vy=0;e.st=0;e.tm=e.cd} }
  } else if(e.v==='bat'){ e.tm+=dt; e.x=e.cx+Math.sin(e.tm*e.om)*e.R; e.y=e.cy+Math.sin(e.tm*e.om*2.1)*14 }
 },
 hit(e){ if(e.dead)return null; const pr=prect(), r={x:e.x-e.w/2+2,y:e.y-e.h+2,w:e.w-4,h:e.h-2};
  if(!hitRect(pr,r))return null;
  if(e.v!=='spiky'&&P.vy>60&&pr.y+pr.h<e.y-e.h+13){ e.dead=.001;P.vy=BOUNCE;P.dj=false;P.stand=0;Snd.pop();Snd.squeak();puff(e.x,e.y-e.h,7,'#fff');stars(e.x,e.y-e.h);G.shake=3;if(!SIM)say(rnd(['دعسته! 👟','أنا الوحش هون!','ارحمني يا بطل 😭','نط ونط ونط!']),'any',1.4);return null}
  return 'monster' },
 draw(e,c,th){
  const x=e.x,by=e.y; c.save();c.translate(x,by);c.strokeStyle='#000';c.lineWidth=2.6;c.lineJoin='round';
  if(e.dead){ c.scale(1.4,.25*(1-Math.min(e.dead,.6)/.9));c.translate(0,0) }
  const bob=(e.v==='walker'||e.v==='spiky')?Math.abs(Math.sin(e.tm*7))*2.5:0;
  if(e.v==='walker'){ c.fillStyle='#a4602c';c.beginPath();c.ellipse(0,-12-bob,13.5,12,0,Math.PI,0);c.lineTo(13,-4);c.lineTo(-13,-4);c.closePath();c.fill();c.stroke();
    c.fillStyle='#3b2314';c.beginPath();c.ellipse(-6+Math.sin(e.tm*7)*3,-3,6,3.4,0,0,7);c.ellipse(6-Math.sin(e.tm*7)*3,-3,6,3.4,0,0,7);c.fill();c.stroke();
    if(!e.dead)face(c,0,-14-bob,1,isK(e)?'laugh':'angry') }
  else if(e.v==='spiky'){ c.fillStyle='#3b2314';c.beginPath();c.ellipse(-6+Math.sin(e.tm*7)*3,-3,6,3.4,0,0,7);c.ellipse(6-Math.sin(e.tm*7)*3,-3,6,3.4,0,0,7);c.fill();c.stroke();
    c.fillStyle='#3d9b57';c.beginPath();c.ellipse(0,-12-bob,13,11,0,0,7);c.fill();c.stroke();
    c.fillStyle='#d9dde8';for(let i=0;i<5;i++){const a=-Math.PI+.35+i*(Math.PI-.7)/4;c.beginPath();c.moveTo(Math.cos(a-.22)*10,-12-bob+Math.sin(a-.22)*9);c.lineTo(Math.cos(a)*19,-12-bob+Math.sin(a)*19);c.lineTo(Math.cos(a+.22)*10,-12-bob+Math.sin(a+.22)*9);c.closePath();c.fill();c.stroke()}
    face(c,0,-9-bob,.9,isK(e)?'laugh':'angry') }
  else if(e.v==='charger'){ const sh=e.st===1?Math.sin(G.t*70)*2:0; c.translate(sh,0); if(e.dir<0)c.scale(1,1);
    c.fillStyle=e.st===3?'#8a8a9a':'#c0392b';c.beginPath();c.roundRect(-16,-26,32,24,9);c.fill();c.stroke();
    c.fillStyle='#fff';c.beginPath();c.moveTo(-14,-26);c.lineTo(-8,-35);c.lineTo(-3,-26);c.moveTo(14,-26);c.lineTo(8,-35);c.lineTo(3,-26);c.fill();c.stroke();
    c.fillStyle='#3b2314';c.beginPath();c.ellipse(-8,-2,6,3,0,0,7);c.ellipse(8,-2,6,3,0,0,7);c.fill();c.stroke();
    if(e.st===0){c.fillStyle='#fff';c.font='900 13px Arial';c.textAlign='center';c.fillText('z z',4,-34-Math.sin(G.t*3)*3);c.fillStyle='#000';c.lineWidth=2.4;c.beginPath();c.moveTo(-9,-15);c.lineTo(-3,-15);c.moveTo(3,-15);c.lineTo(9,-15);c.stroke()}
    else face(c,0,-16,1.05,isK(e)?'laugh':'angry');
    if(e.st===3){c.fillStyle='#ffd23f';for(let i=0;i<3;i++){const a=G.t*5+i*2.1;c.beginPath();c.arc(Math.cos(a)*12,-38+Math.sin(a)*3,2.6,0,7);c.fill()}} }
  else if(e.v==='jumper'){ const sq=e.st===1?.7:1; c.scale(1/sq,sq);
    c.fillStyle='#4aa83c';c.beginPath();c.ellipse(0,-11,14,10.5,0,0,7);c.fill();c.stroke();c.fillStyle='#e8f7d8';c.beginPath();c.ellipse(0,-6,9,6,0,0,Math.PI);c.fill();
    face(c,0,-15,.95,isK(e)?'laugh':(e.st===2?'wide':'sly')) }
  else if(e.v==='bat'){ const fl=Math.sin(G.t*22)*.6; c.translate(0,0);
    c.fillStyle='#4a3a6b';c.beginPath();c.moveTo(-6,-8);c.quadraticCurveTo(-24,-20+fl*10,-26,-4);c.quadraticCurveTo(-18,-8,-14,-2);c.quadraticCurveTo(-9,-6,-4,0);c.lineTo(6,0);c.quadraticCurveTo(9,-6,14,-2);c.quadraticCurveTo(18,-8,26,-4);c.quadraticCurveTo(24,-20+fl*10,6,-8);c.closePath();c.fill();c.stroke();
    c.fillStyle='#4a3a6b';c.beginPath();c.arc(0,-6,9,0,7);c.fill();c.stroke();c.fillStyle='#fff';c.beginPath();c.moveTo(-6,-13);c.lineTo(-4,-19);c.lineTo(-1,-13);c.moveTo(6,-13);c.lineTo(4,-19);c.lineTo(1,-13);c.fill();c.stroke();
    face(c,0,-5,.8,isK(e)?'laugh':'angry') }
  c.restore();
 }};

/* ---------------- leaping skull-fish in the pits ---------------- */
function mkFish(tx0,tx1,o){o=o||{};return{t:'fish',x0:tx0*TS+16,x1:tx1*TS-16,x:(tx0+tx1)/2*TS,y:VH+30,vy:0,st:0,tm:o.cd0||1,cd:o.cd||1.8,tele:o.tele||.6,top:o.top||GY-96,gy:0}}
B.fish={
 upd(e,dt){
  if(e.st===0){ if(Math.abs(pcx()-e.x)>520)return; e.tm-=dt;if(e.tm<=0){e.st=1;e.tm=e.tele;e.x=e.x0+rf()*(e.x1-e.x0);snick(e,'بلب بلب')} }
  else if(e.st===1){e.tm-=dt;if(e.tm<=0){e.st=2;const d=e.y-e.top;e.vy=-Math.sqrt(2*1300*d);Snd.whoosh()}}
  else{e.vy+=1300*dt;e.y+=e.vy*dt;if(e.y>VH+30&&e.vy>0){e.y=VH+30;e.st=0;e.tm=e.cd*(.8+rf()*.4)}}
 },
 hit(e){ return e.st===2&&circHit(e.x,e.y,13,prect())?'ball':null },
 draw(e,c,th){
  if(e.st===1){ for(let i=0;i<4;i++){const k=((G.t*2.2+i*.27)%1);c.fillStyle='#bff3ffaa';c.strokeStyle='#000';c.lineWidth=1.4;c.beginPath();c.arc(e.x+Math.sin(G.t*9+i*2)*5,VH-6-k*70,3+i%2*2,0,7);c.fill();c.stroke()} return }
  if(e.st!==2)return;
  c.save();c.translate(e.x,e.y);c.rotate(Math.atan2(e.vy,40)*.0+(e.vy>0?Math.PI:0)*0);c.scale(1,e.vy>0?-1:1);
  c.strokeStyle='#000';c.lineWidth=2.6;c.fillStyle='#e9e3d0';c.beginPath();c.ellipse(0,0,12,14,0,0,7);c.fill();c.stroke();
  c.fillStyle='#e9e3d0';c.beginPath();c.moveTo(-5,13);c.lineTo(0,24);c.lineTo(5,13);c.fill();c.stroke();
  c.restore();
  c.save();c.translate(e.x,e.y);c.scale(1,1);face(c,0,e.vy>0?4:-1,1.1,isK(e)?'laugh':'angry');
  c.fillStyle='#fff';c.strokeStyle='#000';c.lineWidth=1.8;for(let i=-2;i<=2;i++){c.beginPath();c.moveTo(i*3.4-1.6,e.vy>0?-8:9);c.lineTo(i*3.4,e.vy>0?-12:13);c.lineTo(i*3.4+1.6,e.vy>0?-8:9);c.fill();c.stroke()}
  c.restore();
 }};

/* ---------------- springs: helpful ones and treacherous ones ---------------- */
function mkSpring(tx,o){o=o||{};return{t:'spring',x:tx*TS,w:TS,st:0,tm:0,str:o.str||760,kind:o.kind||'help'}}
B.spring={
 upd(e,dt){ if(e.st){e.tm-=dt;if(e.tm<=0)e.st=0} },
 hit(e){ const pr=prect(); if(P.vy>=0&&pr.x+pr.w>e.x+2&&pr.x<e.x+e.w-2&&P.y+PH>=GY-14&&P.y+PH<=GY+6&&P.y+PH-P.vy/60<=GY-6){P.vy=-e.str;P.y=GY-PH-1;P.onGround=false;P.dj=false;e.st=1;e.tm=.3;Snd.boing();puff(e.x+16,GY,5)} return null },
 draw(e,c,th){ const k=e.st?.5+.5*(1-e.tm/.3):1, h=16*k; c.strokeStyle='#000';c.lineWidth=2.4;
  c.fillStyle='#39343f';c.fillRect(e.x+3,GY-5,26,6);c.strokeRect(e.x+3,GY-5,26,6);
  c.strokeStyle='#e04b4b';c.lineWidth=4;c.beginPath();for(let i=0;i<=6;i++){const y=GY-5-h*i/6,x=e.x+(i%2?24:8);i?c.lineTo(x,y):c.moveTo(x,y)}c.stroke();
  c.fillStyle='#ffd23f';c.strokeStyle='#000';c.lineWidth=2.4;c.fillRect(e.x+1,GY-5-h-5,30,6);c.strokeRect(e.x+1,GY-5-h-5,30,6);
  if(e.kind==='troll'||e.st)face(c,e.x+16,GY-5-h-16,.7,isK(e)||e.st?'laugh':'sly') }};

/* ---------------- platforms: static | move | vanish ---------------- */
function mkPlat(id,v,x,y,w,o){return Object.assign({t:'plat',id,v,x,y,w,h:12,x0:x,x1:x,sp:70,ph:0,dx:0,dy:0,on:1,st:0,tm:0},o||{})}
B.plat={
 move(e,dt){ const ox=e.x,oy=e.y;
  if(e.v==='move'){ e.ph+=dt*e.sp/Math.max(1,e.x1-e.x0)*Math.PI; e.x=e.x0+(e.x1-e.x0)*(.5-.5*Math.cos(e.ph)) }
  else if(e.v==='lift'){ e.ph+=dt*e.sp/Math.max(1,e.y1-e.y0)*Math.PI; e.y=e.y0+(e.y1-e.y0)*(.5-.5*Math.cos(e.ph)) }
  else if(e.v==='vanish'){
    if(e.st===0){ if(P.stand===e.id){e.st=1;e.tm=.5;Snd.crumble()} }
    else if(e.st===1){e.tm-=dt;if(e.tm<=0){e.st=2;e.tm=2.2;e.on=0}}
    else if(e.st===2){e.tm-=dt;if(e.tm<=0){e.st=0;e.on=1}} }
  e.dx=e.x-ox;e.dy=e.y-oy },
 upd(){}, hit(){return null},
 draw(e,c,th){ if(!e.on)return; const sh=e.st===1?Math.sin(G.t*70)*1.5:0; c.strokeStyle='#000';c.lineWidth=2.6;
  c.fillStyle=e.v==='vanish'?'#9a7b4f':'#5b6f91';c.fillRect(e.x+sh,e.y,e.w,e.h);c.strokeRect(e.x+sh,e.y,e.w,e.h);
  c.fillStyle=th.top;c.fillRect(e.x+sh,e.y-3,e.w,5);c.strokeRect(e.x+sh,e.y-3,e.w,5);
  c.fillStyle='#0004';for(let i=8;i<e.w-4;i+=16){c.fillRect(e.x+sh+i,e.y+4,2,6)}
  if(e.v==='vanish'&&e.st===1){c.strokeStyle='#000b';c.beginPath();c.moveTo(e.x+8,e.y);c.lineTo(e.x+14,e.y+8);c.lineTo(e.x+11,e.y+12);c.stroke()} }};

/* ---------------- coins: honest or bait (effect fires when picked up) ---------------- */
function mkCoin(x,y,bait,fx){return{t:'coin',x,y,bait:!!bait,fx:fx||'anvil',got:0,ph:Math.random()*6}}
B.coin={
 upd(e,dt){e.ph+=dt*5},
 hit(e){ if(e.got||!circHit(e.x,e.y,10,prect()))return null; e.got=1; if(!e.bait){G.coins++;Snd.coin();return null} Snd.coin(); onBait(e); return null },
 draw(e,c,th){ if(e.got)return; const w=Math.abs(Math.cos(e.ph)),yy=e.y+Math.sin(e.ph*.7)*2;
  c.fillStyle='#ffd23f';c.strokeStyle='#000';c.lineWidth=2.4;c.beginPath();c.ellipse(e.x,yy,9*Math.max(.18,w),10,0,0,7);c.fill();c.stroke();
  if(w>.5){c.fillStyle='#b8860b';c.font='900 11px Tahoma';c.textAlign='center';c.fillText('$',e.x,yy+4)} }};
function onBait(coin){
  if(!SIM){ const x=pick('bait',{pAudio:.85}); if(x){ if(!x.play&&!Snd.voiceBusy())Snd.laugh(); sayVoice(x,2.6,{pri:3,ttl:.8,wait:.4}) } else {Snd.laugh();say('هههه الطُّعم!','any',1.6)} }
  const fx=coin.fx, px=pcx();
  if(fx==='anvil'){ addE(mkAnv(0,{mx:px-18,c:rfi(0,3)===0?'piano':'anvil'})); Snd.rumble() }
  else if(fx==='floor'){ const cx=Math.floor(coin.x/TS); for(let i=cx-2;i<=cx+2;i++){ if(i<0||i>=L.w||L.ground[i]<0)continue; const cr=L.cr[i]||(L.cr[i]={marked:false,s:0,t:0}); if(cr.s===0){cr.s=1;cr.t=0;cr.force=.32+Math.abs(i-cx)*.05} } Snd.rumble() }
  else if(fx==='spikes'){ const tx=Math.floor((px-28)/TS); const s=mkSpk('hidden',Math.max(2,tx),2,{dl:.3}); s.arm=.3; addE(s); Snd.rumble() }
  else if(fx==='arrows'){ addE(mkShot({x:px+360,y:LANE_Y.lo,vx:-300,tele:0,life:4})); addE(mkShot({x:px-360,y:LANE_Y.hi,vx:300,tele:0,life:4})); Snd.whoosh() }
  else if(fx==='ghost'){ addE(mkGhost(px-300,{sp:150,life:7,on:1})) }
  else if(fx==='rev'){ L.zones.push({x0:px-120,x1:px+420,type:'rev',tm:4.5}); Snd.squeak() }
  else if(fx==='saw'){ addE(mkSaw('roll',{x:px+330,y:GY-14,sp:210,trig:9999,on:1,r:15})); Snd.rumble() }
}

/* ---------------- fake door (the exit-lookalike that explodes / mocks) ---------------- */
function mkFake(tx,boom){return{t:'fake',x:tx*TS,boom,s:0,tm:0}}
B.fake={
 upd(e,dt){
  if(e.s===0&&!P.dead&&hitRect(prect(),{x:e.x-2,y:GY-64,w:36,h:64})){e.s=1;e.tm=0;Snd.raspberry();
    if(e.boom){Snd.fuse();say('هاد الباب... في شي بيدق جواته 😬','sy',1.6)}else if(!SIM)sayVoice(pick('fake',{legacy:FAKE_LINES,pAudio:.9}),2.6,{pri:3,ttl:.8,wait:.4})}
  else if(e.s===1){e.tm+=dt; if(e.boom&&e.tm>1.1){e.s=2;e.tm=0;Snd.boom();G.shake=16;puff(e.x+16,GY-30,26,'#ff8a2e');
      const cx=pcx(),cy=P.y+PH/2;if(!P.dead&&Math.hypot(cx-(e.x+16),cy-(GY-30))<82)die('fakedoor',e)}
    else if(!e.boom&&e.tm>1.6){e.s=3}}
  else if(e.s===2){e.tm+=dt}
 },
 hit(){return null},
 draw(e,c,th){ if(e.s===2){ c.fillStyle='#000a';c.fillRect(e.x-4,GY-64,40,64); return } doorDraw(c,e.x,e.s===1,e.boom,false) }};
function doorDraw(c,x,open,boom,real){
  c.strokeStyle='#000';c.lineWidth=3.2;
  c.fillStyle='#2b1a0e';c.beginPath();c.moveTo(x-4,GY);c.lineTo(x-4,GY-52);c.arc(x+16,GY-52,20,Math.PI,0);c.lineTo(x+36,GY);c.closePath();c.fill();c.stroke();
  c.fillStyle=real?'#35d07f':'#31c476';c.beginPath();c.moveTo(x,GY);c.lineTo(x,GY-52);c.arc(x+16,GY-52,16,Math.PI,0);c.lineTo(x+32,GY);c.closePath();c.fill();c.stroke();
  c.fillStyle='#fff';c.font='900 11px Tahoma';c.textAlign='center';c.direction='rtl';c.fillText('خروج',x+16,GY-66);
  if(open){
    c.fillStyle='#fff';[[10,-38],[22,-38]].forEach(([a,b])=>{c.beginPath();c.arc(x+a,GY+b,5,0,7);c.fill();c.stroke();c.fillStyle='#000';c.beginPath();c.arc(x+a,GY+b+1,2,0,7);c.fill();c.fillStyle='#fff'});
    c.fillStyle='#3a0a10';c.beginPath();c.ellipse(x+16,GY-22,10,7,0,0,Math.PI);c.fill();c.stroke();
    c.fillStyle='#ff4d6a';c.beginPath();c.ellipse(x+16,GY-14+Math.sin(G.t*20)*2,5,8,0,0,7);c.fill();c.stroke() }
  else{ c.fillStyle='#ffd23f';c.beginPath();c.arc(x+25,GY-24,2.8,0,7);c.fill();c.stroke(); if(!real){c.strokeStyle='#0a5a30';c.lineWidth=1.6;c.beginPath();c.moveTo(x+6,GY-40);c.lineTo(x+10,GY-33);c.lineTo(x+7,GY-28);c.stroke()} }
}

/* ---------------- chasers: boulder | wall | wheel ---------------- */
function mkChase(v,sp,x0){return{t:'chase',v,x:x0,y:v==='wall'?GY:GY-40,r:v==='wheel'?44:40,sp,on:0,rot:0,rt:0,always:1}}
B.chase={
 upd(e,dt){ if(!e.on){ if(P.x>e.go){e.on=1;Snd.rumble();if(!SIM)say(e.v==='wall'?'الجدار جاي!! 🧱':'اركض!! 🪨','sy',1.6);heroSay('run',{cd:15,pri:3,delay:.6,max:1.6,dur:2})} else return }
   e.x+=e.sp*dt;e.rot+=dt*e.sp/40;e.rt-=dt;if(e.rt<=0){e.rt=.28;Snd.noise({f0:180,f1:60,dur:.25,v:.1});G.shake=Math.max(G.shake,2.5)} },
 hit(e){ if(!e.on)return null; if(e.v==='wall')return P.x<e.x-6?'wall':null; return circHit(e.x,e.y,e.r-4,prect())?(e.v==='wheel'?'saw':'boulder'):null },
 draw(e,c,th){ if(!e.on)return;
  if(e.v==='wall'){ const x=e.x; c.fillStyle='#2e2640';c.strokeStyle='#000';c.lineWidth=4;c.fillRect(x-420,0,420,VH);c.fillStyle='#41375c';for(let r=0;r<14;r++){c.fillRect(x-410+(r%2)*40,r*34+3,150,28);c.strokeRect(x-410+(r%2)*40,r*34+3,150,28)}
    c.fillStyle='#d9dde8';for(let i=0;i<13;i++){const y=i*36;c.beginPath();c.moveTo(x,y);c.lineTo(x+24,y+18);c.lineTo(x,y+36);c.closePath();c.fill();c.stroke()}
    face(c,x-110,GY-120,4.6,isK(e)?'laugh':'angry'); return }
  c.save();c.translate(e.x,e.y);c.rotate(e.rot);
  if(e.v==='wheel'){ c.fillStyle='#cfd5e0';c.strokeStyle='#000';c.lineWidth=4;c.beginPath();for(let i=0;i<20;i++){const a=i/20*Math.PI*2,r=i%2?34:48;c.lineTo(Math.cos(a)*r,Math.sin(a)*r)}c.closePath();c.fill();c.stroke();c.fillStyle='#e04b4b';c.beginPath();c.arc(0,0,12,0,7);c.fill();c.stroke() }
  else{ c.fillStyle='#8c8498';c.strokeStyle='#000';c.lineWidth=4;c.beginPath();for(let i=0;i<14;i++){const a=i/14*Math.PI*2,r=40+(i%3)*2;c.lineTo(Math.cos(a)*r,Math.sin(a)*r)}c.closePath();c.fill();c.stroke();
    c.strokeStyle='#5d566a';c.lineWidth=3;c.beginPath();c.moveTo(-20,-10);c.lineTo(5,0);c.lineTo(-5,22);c.moveTo(15,-25);c.lineTo(22,-5);c.stroke() }
  c.restore();
  c.save();c.translate(e.x,e.y);c.fillStyle='#fff';c.strokeStyle='#000';c.lineWidth=3;
  c.beginPath();c.arc(-12,-6,9,0,7);c.fill();c.stroke();c.beginPath();c.arc(14,-6,9,0,7);c.fill();c.stroke();
  c.fillStyle='#000';c.beginPath();c.arc(-9,-5,3.5,0,7);c.fill();c.beginPath();c.arc(17,-5,3.5,0,7);c.fill();
  c.lineWidth=5;c.beginPath();c.moveTo(-24,-20);c.lineTo(-4,-13);c.moveTo(28,-20);c.lineTo(6,-13);c.stroke();
  c.fillStyle='#fff';c.lineWidth=3;c.beginPath();c.rect(-14,10,30,12);c.fill();c.stroke();c.restore() }};

/* ---------------- ghost: appears only when you linger ---------------- */
function mkGhost(x,o){o=o||{};return{t:'ghost',x,y:GY-30,sp:o.sp||150,on:o.on?1:0,life:o.life||7,zx0:o.zx0||0,zx1:o.zx1||0,lin:0,al:o.on?1:0,always:1}}
B.ghost={
 upd(e,dt){
  if(!e.on){ const cx=pcx(); if(cx>e.zx0&&cx<e.zx1&&P.onGround&&Math.abs(P.vx)<50){e.lin+=dt;G.warn=Math.max(G.warn,e.lin/1.4)} else e.lin=Math.max(0,e.lin-dt*2);
    if(e.lin>1.4){e.on=1;e.x=P.x-320;e.life=7;Snd.whistle();if(!SIM)say('👻 بووو! قلتلك لا توقف','lb',1.8);heroSay('run',{cd:15,pri:3,delay:.6,max:1.6,dur:2})} return }
  e.al=Math.min(1,e.al+dt*2);e.life-=dt; e.x+=Math.sign(pcx()-e.x)*e.sp*dt; e.y=GY-30+Math.sin(G.t*4)*8+(clamp(P.y+PH/2,0,GY)-(GY-14))*.35;
  if(e.life<=0)e.rm=1;
 },
 hit(e){ if(!e.on)return null; return circHit(e.x,e.y,12,prect())?'ghost':null },
 draw(e,c,th){ if(!e.on)return; c.globalAlpha=e.al*.88;c.fillStyle='#eef0ff';c.strokeStyle='#000';c.lineWidth=2.6;
  c.beginPath();c.arc(e.x,e.y,15,Math.PI,0);c.lineTo(e.x+15,e.y+20);for(let i=0;i<3;i++){c.lineTo(e.x+10-i*10,e.y+14+(i%2?0:6))}c.lineTo(e.x-15,e.y+20);c.closePath();c.fill();c.stroke();
  face(c,e.x,e.y+1,1.2,isK(e)?'laugh':'sly');c.globalAlpha=1 }};

/* ---------------- checkpoint flag (it laughs too, but it's honest) ---------------- */
function mkCp(tx){return{t:'cp',x:tx*TS+16,on:0,tm:0}}
B.cp={
 upd(e,dt){ if(!e.on&&pcx()>e.x&&P.onGround){e.on=1;e.tm=0;if(e.fake)G.fakeHit=1; else G.cpX=e.x;Snd.coin();if(!SIM)say(rnd(['نقطة حفظ! 🚩 (بس لا تعتمد عليّ)','علم الأمان! اطمّن ولو شوي','🚩 رجعتلك من هون إذا متّ']),'any',2)} if(e.on)e.tm+=dt },
 hit(){return null},
 draw(e,c,th){ const x=e.x; c.strokeStyle='#000';c.lineWidth=3;c.fillStyle='#d9dde8';c.fillRect(x-2,GY-64,4,64);c.strokeRect(x-2,GY-64,4,64);
  const w=Math.sin(G.t*6)*3;c.fillStyle=e.on?'#35d07f':'#ff4d5e';c.beginPath();c.moveTo(x+2,GY-62);c.quadraticCurveTo(x+16,GY-66+w,x+30,GY-58);c.quadraticCurveTo(x+16,GY-52-w,x+30,GY-44);c.lineTo(x+2,GY-44);c.closePath();c.fill();c.stroke();
  face(c,x+14,GY-53,.55,e.on?'laugh':'sly') }};

/* ---------------- provocation: the exit door runs away (and leaves spikes where it stood) ---------------- */
B.exitrun={
 upd(e,dt){
  if(e.s===0){ if(L.exitX==null)L.exitX=L.exitTx*TS;
   if(pcx()>L.exitTx*TS-165&&P.onGround){ e.s=1; const old=L.exitTx;
    const step=(L.dk==='hell'?4:3); L.exitTx=Math.min(L.w-2,old+step);
    const sp=mkSpk('hidden',old-1,2,{dl:.25}); sp.arm=.25; addE(sp);
    Snd.whoosh(); Snd.rumble(); if(!SIM){ G.exitSay=1.4; say(rnd(['الباب هرب منك! 🏃💨','هههه استنّى... لا تروح! (راح)','الباب قال: ما بدي أشوف وجهك','الخروج؟ مو هون... تعال لهناك 😈']),'any',2.4) } } }
  if(!SIM&&L.exitX!=null)L.exitX+=(L.exitTx*TS-L.exitX)*Math.min(1,dt*5);
 },
 hit(){return null}, draw(){}
};
