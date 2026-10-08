/* =============== 2.5D LOOK — BOSS ROOM ===============
   Same clay style as draw3e.js: the big pieces are painted once into offscreen sprites; only the face, fists and glows are drawn per frame. */
function bossSpr3(col){
  return spr3('boss3'+col,200,214,(g)=>{
    g.translate(0,16);
    blob3(g,100,158,76,30,'#4a3d6b',2);                                                         // collar behind the head
    box3(g,28,42,144,118,38,col,2.6);                                                              // head
    g.fillStyle='rgba(255,255,255,.12)'; g.beginPath(); g.roundRect(46,50,108,24,12); g.fill();
    g.fillStyle='rgba(0,0,0,.10)'; g.beginPath(); g.roundRect(46,134,108,16,8); g.fill();
    ball3(g,37,104,9,'#9aa1b3',1.6); ball3(g,163,104,9,'#9aa1b3',1.6);                              // bolts
    box3(g,50,27,100,22,5,'#f1c232',2);                                                            // crown
    cone3(g,[50,29],[58,0],[78,29],'#f1c232'); cone3(g,[78,29],[100,-10],[122,29],'#f1c232'); cone3(g,[122,29],[142,0],[150,29],'#f1c232');
    ball3(g,58,2,5.2,'#ff4a4a',1.2); ball3(g,100,-8,6.2,'#4dc3ff',1.2); ball3(g,142,2,5.2,'#ff4a4a',1.2);
  });
}
function bossGateSpr3(){
  return spr3('bossgate',40,GY-14,(g,w,h)=>{
    box3(g,0,0,7,h,2,'#5d5473',1.6); box3(g,w-7,0,7,h,2,'#5d5473',1.6);
    for(let i=0;i<4;i++){ const x=8+i*6.6; box3(g,x,0,4.4,h,1.6,'#a3a9bb',1.2); cone3(g,[x,h],[x+2.2,h+8],[x+4.4,h],'#a3a9bb') }
    for(const y of [56,136,216]) box3(g,3,y,w-6,8,2,'#6e7388',1.4);
  });
}
function bossGate3(e,c){
  if(L.gate==null&&e.st!=='dying')return;
  const lift=e.st==='dying'?clamp(1-e.tm/2.8,0,1)*(GY-30):0, x=GATE_TX*TS;
  c.save(); c.beginPath(); c.rect(x-4,14,TS+8,GY-14); c.clip(); c.fillStyle='rgba(8,4,14,.85)'; c.fillRect(x,14,TS,GY-14);
  blit3(c,bossGateSpr3(),x-4,14-lift); c.restore();
}
function bossBtn3(e,c){
  if(e.st==='done'||e.st==='dying')return;
  for(let i=0;i<e.hits;i++){ const x=BTN_TX[i]*TS+16; blob3(c,x,GY-2.5,24,6,'#463a63',1.4); blob3(c,x,GY-4.5,15,4,'#35cf7e',1.2) }
  const x=bossBtnX(e), pulse=.5+.5*Math.sin(G.t*8);
  const g=c.createRadialGradient(x,GY-8,2,x,GY-8,56); g.addColorStop(0,'rgba(255,70,70,'+(.4+.3*pulse)+')'); g.addColorStop(1,'rgba(255,70,70,0)'); c.fillStyle=g; c.fillRect(x-56,GY-64,112,64);
  blob3(c,x,GY-3,26,7.5,'#463a63',1.6);
  blob3(c,x,GY-7,19,13,'#ff4a4a',1.6,Math.PI,0); blob3(c,x,GY-7,19,3.2,'#c92f3f',1.2);
  if(e.chg>.01){ c.lineCap='round'; c.strokeStyle='rgba(0,0,0,.55)'; c.lineWidth=7; c.beginPath(); c.ellipse(x,GY-4,31,10.5,0,-Math.PI/2,-Math.PI/2+e.chg*Math.PI*2); c.stroke(); c.strokeStyle='#ffd23f'; c.lineWidth=4; c.stroke() }
  const ay=GY-50+Math.sin(G.t*7)*5; c.fillStyle='#ffd23f'; c.strokeStyle=INK; c.lineWidth=3; c.lineJoin='round';
  c.beginPath(); c.moveTo(x-11,ay-9); c.lineTo(x+11,ay-9); c.lineTo(x,ay+9); c.closePath(); c.fill(); c.stroke();
}
B.boss.draw3=function(e,c,th){
  bossGate3(e,c); bossBtn3(e,c);
  if(e.st==='done')return;
  const p=bossPose(e); c.save(); c.globalAlpha=p.a; c.translate(p.x,p.y); c.rotate(p.rot);
  const sw=Math.sin(G.t*2.3);
  for(const sx of [-1,1]){ const fx=sx*(94+(e.st==='hurt'?-12:0))+sx*Math.sin(G.t*2.1+sx)*4, fy=34+Math.cos(G.t*2.6+sx)*6; ball3(c,fx,fy,17,e.col,2) }   // floating fists
  blit3(c,bossSpr3(e.col),-100,-117);
  face3(c,0,3,3.35,p.mood);
  if(e.st==='hurt'){ c.fillStyle='#ffd23f'; c.strokeStyle=INK; c.lineWidth=2; c.font='900 26px Arial'; c.textAlign='center';
    for(let i=0;i<3;i++){ const a=G.t*5+i*2.09; c.strokeText('★',Math.cos(a)*70,-100+Math.sin(a)*14); c.fillText('★',Math.cos(a)*70,-100+Math.sin(a)*14) } }
  c.restore();
};
B.erupt.draw3=function(e,c,th){
  if(e.st===0){ const a=Math.floor(G.t*16)%2?.95:.5; c.globalAlpha=a;
    c.fillStyle=lin3(c,0,GY-8,0,GY,[[0,'rgba(255,60,60,0)'],[1,'#ff3b3b']]); c.fillRect(e.x,GY-8,e.w,8);
    c.strokeStyle='#ff6a4a'; c.lineWidth=2; c.lineCap='round'; c.beginPath(); for(let i=0;i<=e.w;i+=8){ c.moveTo(e.x+i,GY-1); c.lineTo(e.x+i+3,GY-7-(i%16?0:5)) } c.stroke(); c.globalAlpha=1; return }
  const k=e.st===1?1:clamp(e.tm/.25,0,1), n=Math.round(e.w/16); gsh3(c,e.x+e.w/2,e.w/2,.3);
  for(let i=0;i<n;i++){ const x=e.x+i*16+8, h=26*k; cone3(c,[x-8,GY],[x,GY-h],[x+8,GY],'#d6dbe6') }
};
for(const k of ['boss','erupt']){ const b=B[k], flat=b.draw, d3=b.draw3; b.draw=function(e,c,th){ return look3()?d3(e,c,th):flat(e,c,th) } }
