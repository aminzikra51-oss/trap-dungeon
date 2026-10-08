/* =============== 2.5D LOOK — ENTITIES ===============
   Every trap / monster / prop gets a "clay" version (B[t].draw3). Same geometry and hit-boxes as the flat draw(); only the paint differs.
   Bodies are painted ONCE into small offscreen sprites (spr3) and then blitted, so phones pay almost nothing per frame.
   Light comes from the upper left: lit face on the left / top, shaded face on the right / bottom, dark soft outline, specular dot. */
const SC3=2, SPR3={};
function spr3(key,w,h,fn){ let s=SPR3[key]; if(s)return s;
  const cv=document.createElement('canvas'); cv.width=Math.ceil(w*SC3); cv.height=Math.ceil(h*SC3); const g=cv.getContext('2d'); g.scale(SC3,SC3); g.lineJoin='round'; g.lineCap='round';
  fn(g,w,h); return SPR3[key]={cv,w,h} }
const blit3=(c,s,x,y,w,h)=>c.drawImage(s.cv,x,y,w==null?s.w:w,h==null?s.h:h);
const dk3=(c,t)=>mixc(c,'#000000',t), lt3=(c,t)=>mixc(c,'#ffffff',t), INK='#1a1226';
const fillTri=(g,a,b,d,col)=>{g.fillStyle=col;g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.lineTo(d[0],d[1]);g.closePath();g.fill()};
function lin3(g,x0,y0,x1,y1,stops){const r=g.createLinearGradient(x0,y0,x1,y1);stops.forEach(([o,c])=>r.addColorStop(o,c));return r}

/* clay sphere */
function ball3(g,cx,cy,r,col,lw){
  const gr=g.createRadialGradient(cx-r*.38,cy-r*.42,r*.08,cx,cy,r*1.08); gr.addColorStop(0,lt3(col,.6)); gr.addColorStop(.42,col); gr.addColorStop(1,dk3(col,.55));
  g.fillStyle=gr; g.beginPath(); g.arc(cx,cy,r,0,7); g.fill(); g.lineWidth=lw==null?1.8:lw; g.strokeStyle=dk3(col,.78); if(g.lineWidth)g.stroke();
  g.fillStyle='rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(cx-r*.4,cy-r*.46,r*.26,r*.15,-.65,0,7); g.fill();
}
/* clay ellipse (dome, belly, blob) */
function blob3(g,cx,cy,rx,ry,col,lw,a0,a1){
  const gr=g.createRadialGradient(cx-rx*.35,cy-ry*.45,Math.min(rx,ry)*.1,cx,cy,Math.max(rx,ry)*1.05); gr.addColorStop(0,lt3(col,.55)); gr.addColorStop(.45,col); gr.addColorStop(1,dk3(col,.55));
  g.fillStyle=gr; g.beginPath(); g.ellipse(cx,cy,rx,ry,0,a0||0,a1==null?7:a1); g.closePath(); g.fill(); g.lineWidth=lw==null?1.8:lw; g.strokeStyle=dk3(col,.78); if(g.lineWidth)g.stroke();
  g.fillStyle='rgba(255,255,255,.42)'; g.beginPath(); g.ellipse(cx-rx*.4,cy-ry*.5,rx*.26,ry*.14,-.5,0,7); g.fill();
}
/* bevelled clay slab */
function box3(g,x,y,w,h,r,col,lw){
  g.fillStyle=lin3(g,0,y,0,y+h,[[0,lt3(col,.38)],[.16,lt3(col,.1)],[.65,col],[1,dk3(col,.5)]]); g.beginPath(); g.roundRect(x,y,w,h,r); g.fill();
  g.lineWidth=lw==null?1.8:lw; g.strokeStyle=dk3(col,.78); g.stroke();
  g.strokeStyle='rgba(255,255,255,.38)'; g.lineWidth=1.3; g.beginPath(); g.moveTo(x+r+.5,y+1.5); g.lineTo(x+w-r-.5,y+1.5); g.stroke();
  g.strokeStyle='rgba(0,0,0,.18)'; g.beginPath(); g.moveTo(x+r+.5,y+h-1.6); g.lineTo(x+w-r-.5,y+h-1.6); g.stroke();
}
/* metal spike / cone: left face lit, right face shaded (reads as a pyramid) */
function cone3(g,bl,tip,br,col){
  const bm=[(bl[0]+br[0])/2,(bl[1]+br[1])/2];
  fillTri(g,bl,tip,bm,lt3(col,.32)); fillTri(g,bm,tip,br,dk3(col,.32));
  g.strokeStyle=dk3(col,.8); g.lineWidth=1.6; g.beginPath(); g.moveTo(bl[0],bl[1]); g.lineTo(tip[0],tip[1]); g.lineTo(br[0],br[1]); g.closePath(); g.stroke();
  g.strokeStyle='rgba(255,255,255,.55)'; g.lineWidth=1; g.beginPath(); g.moveTo(bl[0]+(tip[0]-bl[0])*.2,bl[1]+(tip[1]-bl[1])*.2); g.lineTo(bl[0]+(tip[0]-bl[0])*.7,bl[1]+(tip[1]-bl[1])*.7); g.stroke();
}
const gsh3=(c,x,w,a)=>{c.fillStyle='rgba(0,0,0,'+(a||.3)+')';c.beginPath();c.ellipse(x,GY-1.5,w,3.2,0,0,7);c.fill()};

/* ---------- the soft face (every entity uses it when the 2.5D look is on) ---------- */
function face3(c,x,y,s,mood){
  const lx=clamp((pcx()-x)/70,-1,1), ly=clamp((P.y+PH/2-y)/70,-1,1), lg=mood==='laugh', ink='#2a1210';
  c.save();c.translate(x,y);c.scale(s,s);c.lineJoin='round';c.lineCap='round';c.strokeStyle=ink;c.lineWidth=1.8;
  if(lg)c.translate(0,Math.sin(G.t*40)*.9);
  c.fillStyle='rgba(255,110,130,.30)';c.beginPath();c.ellipse(-10.6,3.6,3.1,1.9,0,0,7);c.ellipse(10.6,3.6,3.1,1.9,0,0,7);c.fill();
  for(const sx of [-1,1]){
    const ex=sx*5.6;
    if(lg){c.lineWidth=2.2;c.beginPath();c.moveTo(ex-3.6,-2.2);c.quadraticCurveTo(ex,-8.2,ex+3.6,-2.2);c.stroke();c.lineWidth=1.8}
    else{
      const rx=mood==='wide'?4.7:4.1, ry=mood==='sly'?3.3:4.5;
      c.fillStyle='#fff';c.beginPath();c.ellipse(ex,-3,rx,ry,0,0,7);c.fill();c.stroke();
      c.fillStyle='rgba(60,30,30,.16)';c.beginPath();c.ellipse(ex,-3+ry*.55,rx*.8,ry*.4,0,0,Math.PI);c.fill();
      const px=ex+lx*1.7, py=-3+ly*1.4, pr=mood==='wide'?1.25:2;
      c.fillStyle='#120808';c.beginPath();c.arc(px,py,pr,0,7);c.fill();
      c.fillStyle='#fff';c.beginPath();c.arc(px-.55,py-.7,.62,0,7);c.fill();
      if(mood==='sly'){c.fillStyle=ink;c.beginPath();c.roundRect(ex-4.4,-7.7,8.8,3.5,1.2);c.fill()}
      if(mood==='angry'){c.lineWidth=2.8;c.beginPath();c.moveTo(ex+sx*4.4,-9.8);c.lineTo(ex-sx*4.2,-5.6);c.stroke();c.lineWidth=1.8}
    }
  }
  if(lg){c.fillStyle=lin3(c,0,2,0,11,[[0,'#4a0c16'],[1,'#240509']]);c.beginPath();c.moveTo(-6.6,2);c.quadraticCurveTo(0,13.5,6.6,2);c.closePath();c.fill();c.stroke();
    c.fillStyle='#fff';c.beginPath();c.moveTo(-5.4,2.4);c.quadraticCurveTo(0,4.6,5.4,2.4);c.lineTo(5,3.8);c.quadraticCurveTo(0,5.8,-5,3.8);c.fill();
    c.fillStyle='#ff6b84';c.beginPath();c.ellipse(0,8,3.2,2.1,0,0,7);c.fill();
    c.fillStyle='#8fe0ff';[-1,1].forEach(sx=>{c.beginPath();c.ellipse(sx*9.4,1.6+((G.t*9)%1)*4,1.4,2.2,0,0,7);c.fill()})}
  else if(mood==='wide'){c.fillStyle='#3a0a10';c.beginPath();c.ellipse(0,5.4,2.4,3.1,0,0,7);c.fill();c.stroke()}
  else if(mood==='angry'){c.fillStyle='#fff';c.beginPath();c.roundRect(-5,3.2,10,4.6,1);c.fill();c.stroke();c.beginPath();c.moveTo(-1.7,3.2);c.lineTo(-1.7,7.8);c.moveTo(1.7,3.2);c.lineTo(1.7,7.8);c.stroke()}
  else{c.lineWidth=2;c.beginPath();c.moveTo(-5,3.6);c.quadraticCurveTo(0,9,6.2,2);c.stroke()}
  c.restore();
}

/* ---------- floor spikes ---------- */
B.spk.draw3=function(e,c,th){
  const wob=e.up>0&&e.up<.5?Math.sin(G.t*60)*1.2:0, h=14*e.up, n=e.w/16;
  if(e.up<=.01){ if(e.v!=='hidden'||L.n<8){c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=1.6;for(let i=0;i<e.w/TS;i++){c.beginPath();c.moveTo(e.x+i*TS+6,e.by+2.5);c.lineTo(e.x+i*TS+TS-6,e.by+2.5);c.stroke()}} return }
  c.fillStyle='rgba(0,0,0,.35)';c.fillRect(e.x-1,e.by+1,e.w+2,3);
  c.fillStyle=lin3(c,0,e.by-3,0,e.by+3,[[0,'#4a4260'],[1,'#1a1426']]);c.beginPath();c.roundRect(e.x,e.by-3,e.w,6,1.5);c.fill();c.strokeStyle=INK;c.lineWidth=1.4;c.stroke();
  const sp=spr3('spike',16,19,(g)=>cone3(g,[1,18],[8,1],[15,18],'#b9c3d9'));
  for(let i=0;i<n;i++)c.drawImage(sp.cv,e.x+i*16+wob,e.by-h-4,16,h+5);
  if(e.up>.4){ const fx=e.x+e.w/2; face3(c,fx,e.by-6.5,.62,isK(e)?'laugh':(Math.abs(pcx()-fx)<110?'wide':'sly')) }
};

/* ---------- spiky hopper ---------- */
B.hog.draw3=function(e,c,th){
  const sq=e.st===1?.78+.22*(e.tm/e.tele):1; gsh3(c,e.x,12,e.y<e.by-14?.15:.3);
  c.save();c.translate(e.x,e.y+13);c.scale(1/sq*(e.st===1?1.12:1),sq);c.translate(0,-13);
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2+(e.st===2?G.t*6:0),ca=Math.cos(a),sa=Math.sin(a);
    cone3(c,[ca*10-sa*2.4,sa*10+ca*2.4],[ca*19.5,sa*19.5],[ca*10+sa*2.4,sa*10-ca*2.4],'#d3d9e8')}
  ball3(c,0,0,11.5,'#6a58a8',1.8);
  face3(c,0,1,.9,isK(e)?'laugh':(e.st===1?'angry':'sly')); c.restore();
};

/* ---------- ceiling spikes ---------- */
B.ceil.draw3=function(e,c,th){
  const n=Math.max(1,Math.round(e.w/22)),sw=e.w/n,sh=e.st===1?Math.sin(G.t*70)*1.6:0, ys=e.v==='static'?16:0;
  if(e.v==='static'){ c.save();c.translate(e.x,14);box3(c,0,0,e.w,19,3,'#3b3157');c.fillStyle='rgba(0,0,0,.35)';c.fillRect(2,19,e.w-4,3);c.restore() }
  const sp=spr3('spikeD',22,40,(g)=>cone3(g,[1,2],[11,39],[21,2],'#b4aed0'));
  for(let i=0;i<n;i++){const x0=e.x+i*sw+sh,L0=e.v==='static'?e.len*(.78+.22*((i*7)%3)/2):e.len; c.drawImage(sp.cv,x0,e.y+ys-1,sw,L0-ys+2)}
  if(e.v==='static'||e.st>=1){ const fx=e.x+e.w/2,fy=e.y+(e.v==='static'?44:Math.min(e.len*.4,18)); face3(c,fx,fy,e.v==='static'?1:.7,isK(e)?'laugh':(e.st===1?'angry':'sly')) }
};

/* ---------- arrows ---------- */
B.shot.draw3=function(e,c,th){
  if(e.tele>0){ if(e.lane){ const a=Math.floor(G.t*14)%2?.95:.45; c.globalAlpha=a;c.strokeStyle='rgba(255,59,59,.9)';c.lineWidth=2;c.setLineDash([8,7]);c.beginPath();c.moveTo(e.x-14,e.y);c.lineTo(0,e.y);c.stroke();c.setLineDash([]);
      c.save();c.translate(e.x-4,e.y);ball3(c,0,0,10,'#ff4a4a',1.6);c.fillStyle='#fff';c.font='900 13px Arial';c.textAlign='center';c.fillText('!',0,4.5);c.restore();c.globalAlpha=1;return}
    if(!e.fall)return; const a=Math.floor(G.t*14)%2?1:.5; c.globalAlpha=a*.55;{const hw=e.boss?15:11;c.fillStyle=lin3(c,e.x-hw,0,e.x+hw,0,[[0,'rgba(255,60,60,0)'],[.5,'#ff3b3b'],[1,'rgba(255,60,60,0)']]);c.fillRect(e.x-hw,14,hw*2,GY-14)}c.globalAlpha=1;
    c.save();c.translate(e.x,34);ball3(c,0,0,10,'#ff4a4a',1.6);c.fillStyle='#fff';c.font='900 14px Arial';c.textAlign='center';c.fillText('!',0,5);c.restore();return}
  c.save();c.translate(e.x,e.y);
  if(e.fall){c.rotate(Math.PI/2)} else if(e.vx>0)c.scale(-1,1);
  c.fillStyle=lin3(c,0,0,30,0,[[0,'rgba(255,255,255,.0)'],[1,'rgba(255,255,255,.22)']]);c.fillRect(0,-1.5,38,3);       // motion streak
  c.fillStyle=lin3(c,0,-2,0,2.5,[[0,'#c99358'],[1,'#6e4521']]);c.beginPath();c.roundRect(-3,-1.8,25,3.6,1.6);c.fill();c.strokeStyle=INK;c.lineWidth=1.2;c.stroke();
  cone3(c,[-3,-5.5],[-15,0],[-3,5.5],'#d6dbe6');
  c.save();c.translate(15,-9.5);c.rotate(-.08);c.fillStyle='#fffdf3';c.beginPath();c.roundRect(0,0,17,9,1.4);c.fill();c.strokeStyle=INK;c.lineWidth=1.2;c.stroke();c.fillStyle='#c00';c.font='bold 7px Tahoma';c.textAlign='center';c.direction='rtl';c.fillText('آسف',8.5,6.8);c.restore();
  c.restore();
};

/* ---------- turrets ---------- */
B.tur.draw3=function(e,c,th){
  const x=e.x; gsh3(c,x,17,.35);
  const sp=spr3('tur',28,62,(g)=>{box3(g,1,1,26,60,4,'#463a63');g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=1.3;for(let y=12;y<58;y+=12){g.beginPath();g.moveTo(2,y);g.lineTo(26,y);g.stroke()}
    g.fillStyle='#0b0612';g.beginPath();g.roundRect(8,3,12,5,2);g.fill()});
  blit3(c,sp,x-14,GY-63);
  const tl=e.q.some(s=>s.at>0&&s.at<e.tele+.01), lane=e.q[0]&&e.q[0].lane;
  const lamp=(y,on)=>{ if(on){const f=Math.floor(G.t*14)%2,cc=f?'#ff3b3b':'#ffffff';const g=c.createRadialGradient(x,y,1,x,y,15);g.addColorStop(0,cc);g.addColorStop(1,'rgba(255,60,60,0)');c.fillStyle=g;c.fillRect(x-15,y-15,30,30);ball3(c,x,y,5,cc,1.2)} else ball3(c,x,y,5,'#4a3a66',1.2) };
  if(e.v==='rain'){ lamp(GY-40,tl);lamp(GY-10,tl) } else if(e.v==='sniper'){ lamp(GY-25,e.aim) } else {lamp(GY-40,tl&&lane==='hi');lamp(GY-10,tl&&lane!=='hi')}
  face3(c,x,GY-52,.8,isK(e)?'laugh':(tl?'angry':'sly'));
  if(e.aim){ const s=e.q[0]; if(s&&s.ly!=null){c.strokeStyle='rgba(255,59,59,.85)';c.lineWidth=1.6;c.setLineDash([6,5]);c.beginPath();c.moveTo(x-14,s.ly);c.lineTo(x-e.range,s.ly);c.stroke();c.setLineDash([])} }
};

/* ---------- thwomp ---------- */
B.thw.draw3=function(e,c,th){
  const sh=e.st===1?Math.sin(G.t*80)*1.8:0, x=e.x+sh, y=e.y;
  c.strokeStyle=INK;c.lineWidth=5.6;c.beginPath();c.moveTo(x,0);c.lineTo(x,y+2);c.stroke();c.strokeStyle='#6d6683';c.lineWidth=3.6;c.setLineDash([5,3]);c.beginPath();c.moveTo(x,0);c.lineTo(x,y+2);c.stroke();c.setLineDash([]);
  const sp=spr3('thw',48,48,(g)=>{box3(g,1,1,46,46,5,'#6b6585');box3(g,6,6,36,36,3,'#5a5473',1.2);
    [[6,6],[42,6],[6,42],[42,42]].forEach(([a,b])=>ball3(g,a,b,2.8,'#9a93b4',1))});
  blit3(c,sp,x-24,y-1);
  const mood=isK(e)?'laugh':(e.st===0?'sly':(e.st===3||e.st===4?'sly':'angry')); face3(c,x,y+e.h*.46,1.25,mood);
  if(e.st===3||e.st===4){c.fillStyle='rgba(255,255,255,.55)';for(let i=0;i<3;i++){c.fillRect(x-20+i*14,y+e.h-2,8,3)}}
  if(e.st===1){c.fillStyle='rgba(255,59,59,.85)';for(let i=0;i<3;i++){c.fillRect(x-14+i*12,GY-3,8,3)}}
};

/* ---------- falling cargo ---------- */
function cargoSpr(k){
  switch(k){
   case 'anvil': return spr3('cg_anvil',40,34,(g)=>{ const col='#4a5066';
      g.fillStyle=lin3(g,0,2,0,32,[[0,lt3(col,.4)],[.4,col],[1,dk3(col,.55)]]);g.beginPath();g.moveTo(4,2);g.lineTo(32,2);g.lineTo(36,12);g.lineTo(24,15);g.lineTo(27,24);g.lineTo(33,24);g.lineTo(33,32);g.lineTo(3,32);g.lineTo(3,24);g.lineTo(9,24);g.lineTo(12,15);g.lineTo(0,12);g.closePath();g.fill();g.strokeStyle=INK;g.lineWidth=1.8;g.stroke();
      g.fillStyle='rgba(255,255,255,.4)';g.fillRect(6,3.5,24,2.2);g.fillStyle='#e8ecf6';g.font='900 9px Tahoma';g.textAlign='center';g.fillText('16T',18,28.5)});
   case 'piano': return spr3('cg_piano',62,40,(g)=>{ box3(g,1,1,60,30,4,'#2a2338');box3(g,3,19,56,11,2,'#f6f4ee',1.2);g.fillStyle='#17121f';for(let i=0;i<9;i++)g.fillRect(7+i*6,19,3,6.5);box3(g,4,31,6,7,2,'#2a2338',1.2);box3(g,52,31,6,7,2,'#2a2338',1.2)});
   case 'fridge': return spr3('cg_fridge',36,56,(g)=>{ box3(g,1,1,34,54,5,'#e9eef7');g.strokeStyle='rgba(0,0,0,.4)';g.lineWidth=1.5;g.beginPath();g.moveTo(2,21);g.lineTo(34,21);g.stroke();box3(g,26,6,4,11,1.5,'#8a97ab',1);box3(g,26,26,4,16,1.5,'#8a97ab',1)});
   case 'safe': return spr3('cg_safe',42,42,(g)=>{ box3(g,1,1,40,40,4,'#58795a');box3(g,5,5,32,32,3,'#4a6a4c',1.2);ball3(g,21,20,9,'#ffd23f',1.4);g.strokeStyle=INK;g.lineWidth=1.8;g.beginPath();g.moveTo(21,20);g.lineTo(21,13);g.stroke();g.fillStyle='#f4ffe8';g.font='900 8px Tahoma';g.textAlign='center';g.fillText('$$$',21,36)});
   default: return spr3('cg_cactus',32,42,(g)=>{ box3(g,5,26,20,14,3,'#bf5f33');blob3(g,15,14,7,14,'#3fb052',1.6);blob3(g,5,13,4.5,3,'#3fb052',1.4);blob3(g,25,9,4.5,3,'#3fb052',1.4);g.strokeStyle='rgba(255,255,255,.7)';g.lineWidth=.9;for(let i=0;i<5;i++){g.beginPath();g.moveTo(10+i*2.5,6+i*2);g.lineTo(10+i*2.5,9+i*2);g.stroke()}});
  }
}
B.anv.draw3=function(e,c,th){ if(e.s>=4)return; const a=e.s===3?clamp(1-(e.land-.5)/.4,0,1):1; c.globalAlpha=a;
  if(e.s<=2&&(e.show||e.s>=1)){ const k=e.s===0?0.15:(e.s===1?.3+.5*e.tm/e.warn:1); c.fillStyle='rgba(0,0,0,'+(.35*k)+')';c.beginPath();c.ellipse(e.x+e.w/2,GY+1.5,e.w*.7*k+6,5,0,0,7);c.fill() }
  const ox=e.s===1?Math.sin(G.t*90)*2:0, x=e.x+ox, y=e.y;
  if(e.s<3){c.strokeStyle=INK;c.lineWidth=5;c.beginPath();c.moveTo(x+e.w/2,0);c.lineTo(x+e.w/2,y+2);c.stroke();c.strokeStyle='#8a8aa0';c.lineWidth=2.6;c.setLineDash([4,3]);c.beginPath();c.moveTo(x+e.w/2,0);c.lineTo(x+e.w/2,y+2);c.stroke();c.setLineDash([])}
  const sp=cargoSpr(e.c), off=e.c==='piano'?-1:(e.c==='cactus'?-1:-2); blit3(c,sp,x+off+(e.c==='anvil'?-2:0),y+off+(e.c==='anvil'?0:0));
  if(e.s>=1){ face3(c,x+e.w/2,y+e.h*(e.c==='anvil'?.38:.45),.85,isK(e)?'laugh':(e.s===2?'angry':'wide')) }
  c.globalAlpha=1};

/* ---------- saws ---------- */
function sawSpr(r){
  return spr3('saw'+r,(r+8)*2,(r+8)*2,(g,w,h)=>{ const cx=w/2,cy=h/2,R=r+4,r2=r-2;
    g.beginPath();for(let i=0;i<16;i++){const a=i/16*Math.PI*2,rr=i%2?r2:R;g.lineTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr)}g.closePath();
    const gr=g.createRadialGradient(cx-r*.4,cy-r*.45,1,cx,cy,R);gr.addColorStop(0,'#f4f7fd');gr.addColorStop(.5,'#c3cbdb');gr.addColorStop(1,'#7c859b');g.fillStyle=gr;g.fill();g.strokeStyle=INK;g.lineWidth=1.8;g.stroke();
    g.strokeStyle='rgba(60,70,90,.55)';g.lineWidth=1.2;g.beginPath();g.arc(cx,cy,r*.72,0,7);g.stroke();
    ball3(g,cx,cy,r*.36,'#e04b4b',1.4)});
}
B.saw.draw3=function(e,c,th){
  const rail=(x0,y0,x1,y1,w)=>{c.strokeStyle=INK;c.lineWidth=w+2;c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke();c.strokeStyle='#4a4660';c.lineWidth=w;c.stroke();c.strokeStyle='rgba(255,255,255,.25)';c.lineWidth=1;c.beginPath();c.moveTo(x0,y0-w/2+.5);c.lineTo(x1,y1-w/2+.5);c.stroke()};
  if(e.v==='floor'||e.v==='hi')rail(e.x0-14,e.y+12.5,e.x1+14,e.y+12.5,3.4);
  else if(e.v==='vert')rail(e.x,14,e.x,GY,3.4);
  else if(e.v==='orbit'){c.strokeStyle='rgba(0,0,0,.45)';c.lineWidth=3.4;c.beginPath();c.arc(e.cx,e.cy,e.R,0,7);c.stroke();c.strokeStyle='rgba(255,255,255,.12)';c.lineWidth=1;c.stroke();ball3(c,e.cx,e.cy,6.4,'#3d4150',1.6)}
  if(e.v==='roll'&&!e.on){ c.save();c.translate(e.x+40,GY-30);c.fillStyle='#ffd23f';c.strokeStyle=INK;c.lineWidth=1.8;c.beginPath();c.moveTo(0,-11);c.lineTo(11,8);c.lineTo(-11,8);c.closePath();c.fill();c.stroke();c.fillStyle=INK;c.font='900 12px Arial';c.textAlign='center';c.fillText('!',0,6);c.restore() }
  if(e.v==='floor'||e.v==='hi'||e.v==='roll')gsh3(c,e.x,e.r+2,.22);
  const s=sawSpr(e.r); c.save();c.translate(e.x,e.y);c.rotate(e.rot);blit3(c,s,-s.w/2,-s.h/2);c.restore();
  face3(c,e.x,e.y+1,.62,isK(e)?'laugh':'angry');
};

/* ---------- pendulum ---------- */
B.pend.draw3=function(e,c,th){ const p=pendPos(e), dx=p[0]-e.px, dy=p[1]-14, len=Math.hypot(dx,dy), n=Math.max(2,Math.round(len/9)), ang=Math.atan2(dy,dx);
  c.save();c.translate(e.px,14);c.rotate(ang);
  for(let i=0;i<n;i++){const x=(i+.5)*len/n;c.fillStyle=i%2?'#9aa0b6':'#6e7590';c.strokeStyle=INK;c.lineWidth=1.3;c.beginPath();c.roundRect(x-5,i%2?-1.6:-2.8,10,i%2?3.2:5.6,2);c.fill();c.stroke()}
  c.restore();
  ball3(c,e.px,14,7,'#3a3252',1.6);
  const bs=spr3('pball',42,42,(g)=>ball3(g,21,21,18,'#59557a',2)); blit3(c,bs,p[0]-21,p[1]-21);
  face3(c,p[0],p[1]+1,1.1,isK(e)?'laugh':'angry');
};

/* ---------- monsters ---------- */
function walkSpr(v,off){
  switch(v){
   case 'walker': return spr3('w_walker',34,28,(g)=>{blob3(g,17,15,13.5,13,'#b86a2e',1.8,Math.PI,0);g.fillStyle=lin3(g,0,15,0,24,[[0,'#b86a2e'],[1,'#7d4620']]);g.fillRect(3.5,14,27,8);g.strokeStyle=dk3('#b86a2e',.78);g.lineWidth=1.8;g.beginPath();g.moveTo(3.5,15);g.lineTo(3.5,22);g.lineTo(30.5,22);g.lineTo(30.5,15);g.stroke()});
   case 'spiky': return spr3('w_spiky',46,40,(g)=>{ const cx=23,cy=21; for(let i=0;i<5;i++){const a=-Math.PI+.35+i*(Math.PI-.7)/4,ca=Math.cos(a),sa=Math.sin(a);cone3(g,[cx+ca*10-sa*2.6,cy+sa*9+ca*2.6],[cx+ca*20,cy+sa*19],[cx+ca*10+sa*2.6,cy+sa*9-ca*2.6],'#d3d9e8')} blob3(g,cx,cy,13,11,'#3fa85e',1.8)});
   case 'charger': return spr3('w_charger'+off,40,40,(g)=>{ const col=off?'#8d8da0':'#d0402f'; cone3(g,[7,12],[12,2],[17,12],'#f4f1e6');cone3(g,[23,12],[28,2],[33,12],'#f4f1e6'); box3(g,4,10,32,25,10,col)});
   case 'jumper': return spr3('w_jumper',34,26,(g)=>{blob3(g,17,14,14,10.5,'#4fb641',1.8);g.fillStyle='rgba(235,250,220,.92)';g.beginPath();g.ellipse(17,19,9,5.5,0,0,Math.PI);g.fill()});
   default: return spr3('w_bat',24,24,(g)=>{ ball3(g,12,13,9,'#5a4784',1.7);cone3(g,[3,7],[5,0],[8,6],'#5a4784');cone3(g,[16,6],[19,0],[21,7],'#5a4784')});
  }
}
B.walk.draw3=function(e,c,th){
  const x=e.x,by=e.y; if(!e.dead&&(e.v==='walker'||e.v==='spiky'||e.v==='charger'||e.v==='jumper'))gsh3(c,x,13,e.v==='jumper'&&e.y<e.by-6?.15:.3);
  c.save();c.translate(x,by);c.lineJoin='round';
  if(e.dead){ c.scale(1.4,.25*(1-Math.min(e.dead,.6)/.9)) }
  const bob=(e.v==='walker'||e.v==='spiky')?Math.abs(Math.sin(e.tm*7))*2.5:0;
  const foot=(fx,fy)=>{c.fillStyle='#4a2c18';c.beginPath();c.ellipse(fx,fy,6,3.4,0,0,7);c.fill();c.strokeStyle=INK;c.lineWidth=1.6;c.stroke();c.fillStyle='rgba(255,255,255,.22)';c.beginPath();c.ellipse(fx-1.5,fy-1.2,3,1,0,0,7);c.fill()};
  if(e.v==='walker'){ foot(-6+Math.sin(e.tm*7)*3,-2.6);foot(6-Math.sin(e.tm*7)*3,-2.6); const s=walkSpr('walker'); blit3(c,s,-17,-26-bob); if(!e.dead)face3(c,0,-13-bob,1,isK(e)?'laugh':'angry') }
  else if(e.v==='spiky'){ foot(-6+Math.sin(e.tm*7)*3,-2.6);foot(6-Math.sin(e.tm*7)*3,-2.6); const s=walkSpr('spiky'); blit3(c,s,-23,-33-bob); face3(c,0,-9-bob,.9,isK(e)?'laugh':'angry') }
  else if(e.v==='charger'){ const sh=e.st===1?Math.sin(G.t*70)*2:0; c.translate(sh,0); foot(-8,-2.4);foot(8,-2.4);
    const s=walkSpr('charger',e.st===3?1:0); blit3(c,s,-20,-37);
    if(e.st===0){c.fillStyle='#fff';c.font='900 13px Arial';c.textAlign='center';c.fillText('z z',4,-37-Math.sin(G.t*3)*3);c.strokeStyle='#2a1210';c.lineWidth=2.2;c.beginPath();c.moveTo(-9,-15);c.lineTo(-3,-15);c.moveTo(3,-15);c.lineTo(9,-15);c.stroke()}
    else face3(c,0,-16,1.05,isK(e)?'laugh':'angry');
    if(e.st===3){c.fillStyle='#ffd23f';for(let i=0;i<3;i++){const a=G.t*5+i*2.1;c.beginPath();c.arc(Math.cos(a)*12,-38+Math.sin(a)*3,2.6,0,7);c.fill()}} }
  else if(e.v==='jumper'){ const sq=e.st===1?.7:1; c.scale(1/sq,sq); const s=walkSpr('jumper'); blit3(c,s,-17,-24); face3(c,0,-15,.95,isK(e)?'laugh':(e.st===2?'wide':'sly')) }
  else if(e.v==='bat'){ const fl=Math.sin(G.t*22)*.6;
    for(const sd of [-1,1]){ c.save();c.scale(sd,1);c.fillStyle=lin3(c,0,-12,0,2,[[0,'#6b55a0'],[1,'#3b2d5c']]);c.beginPath();c.moveTo(6,-8);c.quadraticCurveTo(24,-20+fl*10,26,-4);c.quadraticCurveTo(18,-8,14,-2);c.quadraticCurveTo(9,-6,4,0);c.lineTo(0,0);c.lineTo(0,-8);c.closePath();c.fill();c.strokeStyle=INK;c.lineWidth=1.8;c.stroke();
      c.strokeStyle='rgba(255,255,255,.2)';c.lineWidth=1;c.beginPath();c.moveTo(7,-8);c.quadraticCurveTo(18,-14+fl*8,24,-5);c.stroke();c.restore() }
    const s=walkSpr('bat'); blit3(c,s,-12,-19); face3(c,0,-5,.8,isK(e)?'laugh':'angry') }
  c.restore();
};

/* ---------- skull fish ---------- */
B.fish.draw3=function(e,c,th){
  if(e.st===1){ for(let i=0;i<4;i++){const k=((G.t*2.2+i*.27)%1);ball3(c,e.x+Math.sin(G.t*9+i*2)*5,VH-6-k*70,2.6+i%2*1.8,'#bff3ff',1)} return }
  if(e.st!==2)return;
  c.save();c.translate(e.x,e.y);if(e.vy>0)c.scale(1,-1);
  const s=spr3('skull',30,38,(g)=>{ blob3(g,15,15,12.5,14,'#efe9d4',1.8); cone3(g,[10,26],[15,37],[20,26],'#efe9d4') }); blit3(c,s,-15,-15);
  c.restore();
  c.save();c.translate(e.x,e.y);face3(c,0,e.vy>0?4:-1,1.1,isK(e)?'laugh':'angry');
  c.fillStyle='#fff';c.strokeStyle='#2a1210';c.lineWidth=1.4;for(let i=-2;i<=2;i++){c.beginPath();c.moveTo(i*3.4-1.6,e.vy>0?-8:9);c.lineTo(i*3.4,e.vy>0?-12:13);c.lineTo(i*3.4+1.6,e.vy>0?-8:9);c.fill();c.stroke()}
  c.restore();
};

/* ---------- springs ---------- */
B.spring.draw3=function(e,c,th){ const k=e.st?.5+.5*(1-e.tm/.3):1, h=16*k; gsh3(c,e.x+16,15,.3);
  c.save();c.translate(e.x,0);box3(c,3,GY-6,26,7,2,'#3f3a4a',1.5);
  c.strokeStyle=INK;c.lineWidth=5.4;c.beginPath();for(let i=0;i<=6;i++){const y=GY-5-h*i/6,x=i%2?24:8;i?c.lineTo(x,y):c.moveTo(x,y)}c.stroke();
  c.strokeStyle='#e8504f';c.lineWidth=3.4;c.stroke();c.strokeStyle='rgba(255,255,255,.4)';c.lineWidth=1;c.stroke();
  box3(c,1,GY-5-h-6,30,7,3,'#ffd23f',1.6);c.restore();
  if(e.kind==='troll'||e.st)face3(c,e.x+16,GY-5-h-17,.7,isK(e)||e.st?'laugh':'sly') };

/* ---------- platforms ---------- */
B.plat.draw3=function(e,c,th){ if(!e.on)return; const sh=e.st===1?Math.sin(G.t*70)*1.5:0, x=e.x+sh, y=e.y, col=e.v==='vanish'?'#a9854f':'#62789c';
  c.fillStyle='rgba(0,0,0,.28)';c.beginPath();c.ellipse(x+e.w/2,y+e.h+5,e.w*.45,3,0,0,7);c.fill();
  c.save();c.translate(x,y);box3(c,0,0,e.w,e.h,3,col,1.8);
  c.fillStyle=th.top;c.beginPath();c.roundRect(0,-5,e.w,6.5,2.5);c.fill();c.strokeStyle=INK;c.lineWidth=1.6;c.stroke();c.fillStyle='rgba(255,255,255,.35)';c.fillRect(2,-4.2,e.w-4,1.5);
  c.fillStyle='rgba(0,0,0,.28)';for(let i=9;i<e.w-4;i+=16){c.beginPath();c.roundRect(i,4,2.4,6,1);c.fill()}
  if(e.v==='vanish'&&e.st===1){c.strokeStyle='rgba(0,0,0,.7)';c.lineWidth=1.6;c.beginPath();c.moveTo(8,0);c.lineTo(14,8);c.lineTo(11,12);c.stroke()}
  c.restore() };

/* ---------- coins (honest or bait: identical on purpose) ---------- */
function coinSpr(i){ return spr3('coin'+i,24,24,(g)=>{ const k=Math.max(.16,Math.abs(Math.cos(i/12*Math.PI))), rx=10*k;
  g.fillStyle='#8a5c0a';g.beginPath();g.ellipse(12+1.1*(1-k),12.8,rx,10.4,0,0,7);g.fill();                        // rim thickness
  const gr=g.createRadialGradient(12-rx*.4,9,1,12,12,11);gr.addColorStop(0,'#fff0a0');gr.addColorStop(.5,'#ffd23f');gr.addColorStop(1,'#d89a12');g.fillStyle=gr;g.beginPath();g.ellipse(12,12,rx,10.4,0,0,7);g.fill();g.strokeStyle='#6f4706';g.lineWidth=1.5;g.stroke();
  if(k>.45){g.strokeStyle='rgba(180,120,10,.7)';g.lineWidth=1;g.beginPath();g.ellipse(12,12,rx*.72,7.4,0,0,7);g.stroke();g.fillStyle='#a8700a';g.font='900 11px Tahoma';g.textAlign='center';g.fillText('$',12,16.2)}
  g.fillStyle='rgba(255,255,255,.55)';g.beginPath();g.ellipse(12-rx*.45,7,rx*.22,2.6,-.6,0,7);g.fill() }) }
B.coin.draw3=function(e,c,th){ if(e.got)return; const yy=e.y+Math.sin(e.ph*.7)*2, i=Math.round((Math.abs(Math.cos(e.ph))*11))%12, s=coinSpr(Math.min(11,Math.round(Math.acos(Math.abs(Math.cos(e.ph)))/Math.PI*2*6)));
  c.fillStyle='rgba(0,0,0,.18)';c.beginPath();c.ellipse(e.x,GY-2,6,2,0,0,7);c.fill();
  blit3(c,s,e.x-12,yy-12) };

/* ---------- doors ---------- */
function doorSpr(real,fake){
  return spr3('door'+(real?'R':'F'),48,96,(g)=>{ const ox=8,oy=24, th=6;
    // stone frame (arch)
    const arch=(x0,w,top,r)=>{g.beginPath();g.moveTo(x0,95);g.lineTo(x0,top+r);g.arc(x0+w/2,top+r,w/2,Math.PI,0);g.lineTo(x0+w,95);g.closePath()};
    arch(ox-5,42,oy-4,21);g.fillStyle=lin3(g,ox-5,0,ox+37,0,[[0,'#7d7390'],[.5,'#5d5473'],[1,'#3f3852']]);g.fill();g.strokeStyle=INK;g.lineWidth=2;g.stroke();
    g.strokeStyle='rgba(255,255,255,.22)';g.lineWidth=1.2;g.beginPath();g.moveTo(ox-3.5,95);g.lineTo(ox-3.5,oy+17);g.arc(ox+16,oy+17,19.5,Math.PI,Math.PI*1.5);g.stroke();
    // dark recess
    arch(ox-1,34,oy+1,17);g.fillStyle='#120b0a';g.fill();
    // door leaf
    arch(ox+1.5,29,oy+3.5,14.5);const col=real?'#35cf7e':'#46bf72';g.fillStyle=lin3(g,ox+1,0,ox+31,0,[[0,lt3(col,.3)],[.55,col],[1,dk3(col,.5)]]);g.fill();g.strokeStyle=INK;g.lineWidth=1.8;g.stroke();
    g.strokeStyle='rgba(0,0,0,.28)';g.lineWidth=1.4;for(const x of [ox+9,ox+17,ox+24]){g.beginPath();g.moveTo(x,95);g.lineTo(x,oy+16);g.stroke()}
    g.strokeStyle='rgba(255,255,255,.3)';g.lineWidth=1.2;g.beginPath();g.moveTo(ox+4,95);g.lineTo(ox+4,oy+18);g.stroke();
    ball3(g,ox+25,oy+49,3.4,'#ffd23f',1.2);
    if(!real){g.strokeStyle='rgba(8,70,40,.75)';g.lineWidth=1.5;g.beginPath();g.moveTo(ox+6,oy+34);g.lineTo(ox+10,oy+42);g.lineTo(ox+7,oy+47);g.stroke()}
    // sign
    g.fillStyle=real?'#1c8a52':'#1c8a52';g.beginPath();g.roundRect(ox+2,oy-17,28,11,3);g.fill();g.strokeStyle=INK;g.lineWidth=1.4;g.stroke();
    g.fillStyle='#fff';g.font='900 9px Tahoma';g.textAlign='center';g.direction='rtl';g.fillText('خروج',ox+16,oy-8.5);
  }) }
function doorDraw3(c,x,open,boom,real){
  const s=doorSpr(real,!real); blit3(c,s,x-8-0,GY-96+0);
  if(open){ c.save();c.translate(x,GY);
    for(const a of [10,22]){ball3(c,a,-38,5.3,'#ffffff',1.3);c.fillStyle='#120808';c.beginPath();c.arc(a,-37,2.2,0,7);c.fill()}
    c.fillStyle=lin3(c,0,-28,0,-14,[[0,'#4a0c16'],[1,'#240509']]);c.beginPath();c.ellipse(16,-22,10,7,0,0,Math.PI);c.fill();c.strokeStyle=INK;c.lineWidth=1.6;c.stroke();
    c.fillStyle='#ff4d6a';c.beginPath();c.ellipse(16,-14+Math.sin(G.t*20)*2,5,8,0,0,7);c.fill();c.stroke();c.restore() }
}
B.fake.draw3=function(e,c,th){ if(e.s===2){ c.fillStyle='rgba(0,0,0,.65)';c.fillRect(e.x-4,GY-64,40,64); return } doorDraw3(c,e.x,e.s===1,e.boom,false) };

/* ---------- checkpoint flag ---------- */
B.cp.draw3=function(e,c,th){ const x=e.x;
  c.fillStyle=lin3(c,x-2,0,x+2,0,[[0,'#f2f5fb'],[1,'#8e97ab']]);c.fillRect(x-2,GY-64,4,64);c.strokeStyle=INK;c.lineWidth=1.6;c.strokeRect(x-2,GY-64,4,64);
  ball3(c,x,GY-66,3.6,'#ffd23f',1.2);
  const w=Math.sin(G.t*6)*3, col=e.on?'#35cf7e':'#f2475a';
  c.fillStyle=col;c.beginPath();c.moveTo(x+2,GY-62);c.quadraticCurveTo(x+16,GY-66+w,x+30,GY-58);c.quadraticCurveTo(x+16,GY-52-w,x+30,GY-44);c.lineTo(x+2,GY-44);c.closePath();c.fill();
  c.fillStyle='rgba(255,255,255,.28)';c.beginPath();c.moveTo(x+2,GY-62);c.quadraticCurveTo(x+16,GY-66+w,x+30,GY-58);c.quadraticCurveTo(x+16,GY-59+w,x+2,GY-55);c.fill();
  c.fillStyle='rgba(0,0,0,.2)';c.beginPath();c.moveTo(x+2,GY-50);c.quadraticCurveTo(x+16,GY-53-w,x+30,GY-44);c.lineTo(x+2,GY-44);c.fill();
  c.strokeStyle=INK;c.lineWidth=1.8;c.beginPath();c.moveTo(x+2,GY-62);c.quadraticCurveTo(x+16,GY-66+w,x+30,GY-58);c.quadraticCurveTo(x+16,GY-52-w,x+30,GY-44);c.lineTo(x+2,GY-44);c.closePath();c.stroke();
  face3(c,x+14,GY-53,.55,e.on?'laugh':'sly') };

/* ---------- chasers ---------- */
B.chase.draw3=function(e,c,th){ if(!e.on)return;
  if(e.v==='wall'){ const x=e.x;
    c.fillStyle=lin3(c,x-420,0,x,0,[[0,'#17122a'],[1,'#3a3054']]);c.fillRect(x-420,0,420,VH);
    for(let r=0;r<14;r++){for(let k=0;k<3;k++){const bx=x-410+(r%2)*40+k*150,by=r*34+3; if(bx>x-12)continue; c.fillStyle=lin3(c,0,by,0,by+28,[[0,'#52467a'],[1,'#2e2646']]);c.beginPath();c.roundRect(bx,by,146,28,4);c.fill();c.strokeStyle='rgba(0,0,0,.6)';c.lineWidth=2;c.stroke();c.fillStyle='rgba(255,255,255,.12)';c.fillRect(bx+4,by+2,138,2)}}
    c.fillStyle=lin3(c,x-20,0,x,0,[[0,'rgba(0,0,0,0)'],[1,'rgba(0,0,0,.55)']]);c.fillRect(x-20,0,20,VH);
    for(let i=0;i<13;i++){const y=i*36; cone3(c,[x,y],[x+26,y+18],[x,y+36],'#dfe3ee')}
    face3(c,x-110,GY-120,4.6,isK(e)?'laugh':'angry'); return }
  if(e.v==='wheel'){ c.save();c.translate(e.x,e.y);c.rotate(e.rot);const sp=spr3('bigwheel',116,116,(g)=>{const cx=58,cy=58; g.beginPath();for(let i=0;i<20;i++){const a=i/20*Math.PI*2,r=i%2?34:50;g.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r)}g.closePath();
      const gr=g.createRadialGradient(cx-18,cy-20,2,cx,cy,52);gr.addColorStop(0,'#f6f8fd');gr.addColorStop(.55,'#c3cbdb');gr.addColorStop(1,'#727b92');g.fillStyle=gr;g.fill();g.strokeStyle=INK;g.lineWidth=3;g.stroke();ball3(g,cx,cy,13,'#e04b4b',2)}); blit3(c,sp,-58,-58);c.restore() }
  else{ const bs=spr3('boulder',92,92,(g)=>{ball3(g,46,46,41,'#8f879f',3)}); gsh3(c,e.x,e.r*.9,.3); blit3(c,bs,e.x-46,e.y-46);
    c.save();c.translate(e.x,e.y);c.rotate(e.rot);c.strokeStyle='rgba(30,25,45,.6)';c.lineWidth=3;c.beginPath();c.moveTo(-20,-10);c.lineTo(5,0);c.lineTo(-5,22);c.moveTo(15,-25);c.lineTo(22,-5);c.moveTo(-28,14);c.lineTo(-14,20);c.stroke();c.restore() }
  c.save();c.translate(e.x,e.y);
  for(const sx of [-1,1]){ball3(c,sx*13,-6,9,'#ffffff',2);c.fillStyle='#120808';c.beginPath();c.arc(sx*13+(sx>0?3:3),-5,3.5,0,7);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(sx*13+2,-6.4,1.2,0,7);c.fill()}
  c.strokeStyle='#2a1210';c.lineWidth=5;c.beginPath();c.moveTo(-24,-20);c.lineTo(-4,-13);c.moveTo(28,-20);c.lineTo(6,-13);c.stroke();
  c.fillStyle='#fff';c.strokeStyle='#2a1210';c.lineWidth=2.4;c.beginPath();c.roundRect(-14,10,30,12,3);c.fill();c.stroke();c.lineWidth=1.4;for(let i=-9;i<14;i+=7){c.beginPath();c.moveTo(i,10);c.lineTo(i,22);c.stroke()}
  c.restore() };

/* ---------- ghost ---------- */
B.ghost.draw3=function(e,c,th){ if(!e.on)return; c.save();c.globalAlpha=e.al*.9;
  const gl=c.createRadialGradient(e.x,e.y,4,e.x,e.y,38);gl.addColorStop(0,'rgba(190,210,255,.45)');gl.addColorStop(1,'rgba(190,210,255,0)');c.fillStyle=gl;c.fillRect(e.x-40,e.y-40,80,80);
  c.fillStyle=lin3(c,e.x-14,e.y-14,e.x+16,e.y+22,[[0,'#ffffff'],[.6,'#dfe6ff'],[1,'#a9b6e6']]);c.strokeStyle='#4a5385';c.lineWidth=1.8;
  c.beginPath();c.arc(e.x,e.y,15,Math.PI,0);c.lineTo(e.x+15,e.y+20);for(let i=0;i<3;i++){c.lineTo(e.x+10-i*10,e.y+14+(i%2?0:6))}c.lineTo(e.x-15,e.y+20);c.closePath();c.fill();c.stroke();
  c.fillStyle='rgba(255,255,255,.55)';c.beginPath();c.ellipse(e.x-6,e.y-8,5,3,-.5,0,7);c.fill();
  face3(c,e.x,e.y+1,1.2,isK(e)?'laugh':'sly');c.restore() };

/* ---------- signs, torches, blocks (called from render) ---------- */
function drawSign3(c,s,cam){ const x=s.tx*TS+16; if(x<cam-60||x>cam+VW+60)return;
  const ls=s.text.split('\n'),hh=ls.length>2?50:40;
  c.fillStyle='rgba(0,0,0,.3)';c.beginPath();c.ellipse(x,GY-1.5,12,2.8,0,0,7);c.fill();
  c.fillStyle=lin3(c,x-2.5,0,x+2.5,0,[[0,'#8a5a2a'],[1,'#4b2f14']]);c.fillRect(x-2.5,GY-30,5,30);c.strokeStyle=INK;c.lineWidth=1.6;c.strokeRect(x-2.5,GY-30,5,30);
  c.save();c.translate(x-37,GY-28-hh);box3(c,0,0,74,hh,5,'#d9a955',1.8);
  [[5,5],[69,5],[5,hh-5],[69,hh-5]].forEach(([a,b])=>{c.fillStyle='#6b4a1a';c.beginPath();c.arc(a,b,1.6,0,7);c.fill()});c.restore();
  c.fillStyle='#2a1707';c.textAlign='center';c.direction='rtl';let fs=12;c.font='900 12px Tahoma,Arial';const mw=Math.max(...ls.map(t=>c.measureText(t).width));if(mw>64)fs=Math.max(7,12*64/mw);c.font='900 '+fs+'px Tahoma,Arial';
  ls.forEach((t,i)=>c.fillText(t,x,GY-28-hh+14+i*13));
}
function drawTorch3(c,x,th){
  const fl=Math.sin(G.t*9+x)*2;
  c.fillStyle=lin3(c,x-3,0,x+3,0,[[0,'#6b4524'],[1,'#33200e']]);c.fillRect(x-3,150,6,26);c.strokeStyle=INK;c.lineWidth=1.6;c.strokeRect(x-3,150,6,26);
  box3(c,x-6,146,12,6,2,'#58595f',1.4);
  const g=c.createRadialGradient(x,138,2,x,138,26);g.addColorStop(0,'rgba(255,200,90,.5)');g.addColorStop(1,'rgba(255,150,40,0)');c.fillStyle=g;c.fillRect(x-26,112,52,52);
  c.fillStyle=th.torch;c.beginPath();c.moveTo(x-8,148);c.quadraticCurveTo(x-6,132+fl,x,120+fl*2);c.quadraticCurveTo(x+6,132-fl,x+8,148);c.closePath();c.fill();c.strokeStyle=dk3(th.torch,.7);c.lineWidth=1.4;c.stroke();
  c.fillStyle='#fff3b0';c.beginPath();c.ellipse(x,143,3.4,7,0,0,7);c.fill();
}
function drawBlock3(c,th,tx,ty,oy,st){
  c.save();c.translate(tx*TS,ty*TS+oy);
  if(st==='b'){ box3(c,0,0,TS,TS,3,th.floor,2); c.fillStyle='rgba(255,255,255,.1)';c.fillRect(4,5,TS-8,3);
    if(!L.blocks[tx+','+(ty-1)]){c.fillStyle=th.top;c.beginPath();c.roundRect(-1,-5,TS+2,7,2.5);c.fill();c.strokeStyle=INK;c.lineWidth=1.6;c.stroke();c.fillStyle='rgba(255,255,255,.35)';c.fillRect(2,-4,TS-4,1.5)} }
  else{ box3(c,0,0,TS,TS,4,'#e8a838',2.2); c.fillStyle='#fff7da';c.font='900 20px Arial';c.textAlign='center';c.fillText('!',16,25);c.fillStyle='#8a5a10';c.fillText('!',16,24) }
  c.restore();
}

/* hook the renderer: the faces and every entity pick the 2.5D painter when the look is on */
(()=>{ for(const k in B){ const b=B[k]; if(!b.draw3)continue; const flat=b.draw, d3=b.draw3; b.draw=function(e,c,th){ return look3()?d3(e,c,th):flat(e,c,th) } } })();
