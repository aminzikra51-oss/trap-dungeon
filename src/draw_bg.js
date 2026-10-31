/* =============== ANIMATED WORLD BACKGROUNDS ===============
   A world = a sky gradient + cached, seamlessly tiling parallax layers + a stateless animated fx pass.
   Every moving thing is a pure function of the animation clock AT (no per-frame state, no Math.random), so it is cheap and repeatable.
   Q.q scales the fx density; the cached layers are plain drawImage calls. Worlds with th.sc replace the dungeon wall; th.fx adds ambience to the dungeon-style worlds. */
let AT=0;                                       // animation clock: runs on the title screen, the editor and the pause menu too
const TW=1024, QN=()=>[0,.3,.65,1][Q.q|0];      // layer tile width, fx density 0..1
const hh=(i,s)=>{const k=Math.sin(i*127.1+(s||0)*311.7)*43758.5453;return k-Math.floor(k)};
function rngS(seed){let a=seed|0;const f=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};f.get=()=>a;f.set=v=>{a=v};return f}
let RR=null;                                    // the rng of the layer being baked
const wr=fn=>{const s0=RR.get();for(const d of [-TW,0,TW]){RR.set(s0);fn(d)}};   // draw 3 times with the SAME random stream -> the tile wraps with no seam
const mod=(a,b)=>((a%b)+b)%b;
function ridge(x,y0,amp,freqs,seed,col,to){     // tileable ridge: sum of sines with integer frequencies over TW
  x.fillStyle=col;x.beginPath();x.moveTo(0,to||VH);
  for(let px=0;px<=TW;px+=8){let h=0;for(let i=0;i<freqs.length;i++)h+=Math.sin(px/TW*Math.PI*2*freqs[i]+seed*(i+1.7))*(amp/(i*.8+1));x.lineTo(px,y0+h)}
  x.lineTo(TW,to||VH);x.closePath();x.fill();
}
const ridgeY=(px,y0,amp,freqs,seed)=>{let h=0;for(let i=0;i<freqs.length;i++)h+=Math.sin(px/TW*Math.PI*2*freqs[i]+seed*(i+1.7))*(amp/(i*.8+1));return y0+h};
function cloudP(x,cx,cy,w,col){x.fillStyle=col;x.beginPath();const n=5;for(let i=0;i<n;i++){const px=cx-w/2+w*(i/(n-1)),pr=w*(.15+.07*Math.sin(i*2.1+cx))+w*.05;x.moveTo(px+pr,cy-pr*(i%2?.5:.2));x.arc(px,cy-pr*(i%2?.5:.2),pr,0,7)}x.moveTo(cx+w*.56,cy+2);x.ellipse(cx,cy+2,w*.56,w*.11,0,0,7);x.fill()}
const GLC={};                                   // glow sprites are baked once per colour+radius, then just stamped
function glow(c,x,y,r,col,a){let s=GLC[col+'|'+r];if(!s){s=GLC[col+'|'+r]=document.createElement('canvas');s.width=s.height=r*2;const g=s.getContext('2d'),gr=g.createRadialGradient(r,r,0,r,r,r);gr.addColorStop(0,col);gr.addColorStop(1,col.replace(/[\d.]+\)$/,'0)'));g.fillStyle=gr;g.fillRect(0,0,r*2,r*2)}c.globalAlpha=a==null?1:a;c.drawImage(s,x-r,y-r);c.globalAlpha=1}
function bolt(c,x0,seed,col){c.strokeStyle=col;c.lineWidth=2.6;c.beginPath();let x=x0,y=0;c.moveTo(x,y);while(y<330){y+=22+hh(y,seed)*26;x+=(hh(y,seed+3)-.5)*48;c.lineTo(x,y)}c.stroke()}
function gear(c,cx,cy,R,teeth,rot,fill,edge){
  c.fillStyle=fill;c.strokeStyle=edge;c.lineWidth=3;c.beginPath();
  for(let i=0;i<teeth*4;i++){const a=rot+i/(teeth*4)*Math.PI*2,k=(i%4<2)?R:R*.84;c.lineTo(cx+Math.cos(a)*k,cy+Math.sin(a)*k)}
  c.closePath();c.fill();c.stroke();
  c.fillStyle=edge;c.beginPath();c.arc(cx,cy,R*.22,0,7);c.fill();
  c.strokeStyle=edge;c.lineWidth=R*.07;for(let i=0;i<5;i++){const a=rot+i/5*Math.PI*2;c.beginPath();c.moveTo(cx+Math.cos(a)*R*.22,cy+Math.sin(a)*R*.22);c.lineTo(cx+Math.cos(a)*R*.74,cy+Math.sin(a)*R*.74);c.stroke()}
}
function bird(c,x,y,s,f){c.beginPath();c.moveTo(x-s,y-Math.sin(f)*s*.7);c.quadraticCurveTo(x-s*.4,y-Math.sin(f)*s*.2-s*.35,x,y);c.quadraticCurveTo(x+s*.4,y-Math.sin(f)*s*.2-s*.35,x+s,y-Math.sin(f)*s*.7);c.stroke()}
function bat(c,x,y,s,f){const w=Math.sin(f)*s*.55;c.beginPath();c.moveTo(x,y-s*.2);c.quadraticCurveTo(x-s*.6,y-s*.7-w,x-s*1.2,y-w*1.2);c.quadraticCurveTo(x-s*.7,y+s*.1,x-s*.4,y+s*.15);c.lineTo(x,y+s*.35);c.lineTo(x+s*.4,y+s*.15);c.quadraticCurveTo(x+s*.7,y+s*.1,x+s*1.2,y-w*1.2);c.quadraticCurveTo(x+s*.6,y-s*.7-w,x,y-s*.2);c.fill()}
function crystal(x,cx,by,w,h,c1,c2,tilt){
  x.save();x.translate(cx,by);x.rotate(tilt||0);const g=x.createLinearGradient(-w,0,w,-h);g.addColorStop(0,c1);g.addColorStop(1,c2);
  x.fillStyle=g;x.beginPath();x.moveTo(-w/2,0);x.lineTo(-w/2,-h*.7);x.lineTo(0,-h);x.lineTo(w/2,-h*.7);x.lineTo(w/2,0);x.closePath();x.fill();
  x.fillStyle='rgba(255,255,255,.22)';x.beginPath();x.moveTo(-w/2,-h*.7);x.lineTo(0,-h);x.lineTo(-w*.05,-h*.1);x.lineTo(-w/2,0);x.closePath();x.fill();
  x.strokeStyle='rgba(255,255,255,.35)';x.lineWidth=1.2;x.stroke();x.restore();
}

/* ---------------- the worlds ---------------- */
const SCN={
/* مدينة الغروب */
oldcity:{ sky:[[0,'#2b1a4d'],[.35,'#8a3a6b'],[.62,'#e8705a'],[.86,'#ffb36b'],[1,'#ffd98a']],
 back(c,cam){const sx=560-cam*.02,k=1+Math.sin(AT*.6)*.025;glow(c,sx,250,170,'rgba(255,236,160,.85)',.8);c.fillStyle='#fff3c0';c.beginPath();c.arc(sx,250,44*k,0,7);c.fill()},
 L:[
 {k:.08,seed:3,mk(x,r){ridge(x,265,22,[2,5],1.3,'#8a3f72');ridge(x,300,16,[3,7],2.1,'#6e2f62');
   wr(dx=>{for(let i=0;i<9;i++){const bx=i*118+r()*40+dx,w=26+r()*18,h=34+r()*40,y=ridgeY(mod(bx,TW),300,16,[3,7],2.1);x.fillStyle='#63285a';x.fillRect(bx,y-h,w,h+8);x.beginPath();x.arc(bx+w/2,y-h,w/2,Math.PI,0);x.fill()}})}},
 {fx(c,cam,q){c.globalAlpha=.4;c.fillStyle='#ffc6a0';for(let i=0;i<5;i++){const cx=mod(hh(i,5)*1200-AT*(7+i*2.5),VW+420)-210;c.beginPath();c.ellipse(cx,58+i*34,130+i*14,6+i%2*3,0,0,7);c.fill()}c.globalAlpha=1}},
 {k:.22,seed:11,mk(x,r){let bx=0;while(bx<TW){const w=48+Math.floor(r()*56),h=70+Math.floor(r()*80),t=r();wr(dx=>{
   x.fillStyle='#4d2253';x.fillRect(bx+dx,360-h,w,h+4);
   if(t<.35){x.beginPath();x.arc(bx+dx+w/2,360-h,w*.38,Math.PI,0);x.fill();x.fillRect(bx+dx+w/2-1.5,360-h-w*.38-14,3,14)}
   else if(t<.55){const mx=bx+dx+w-12;x.fillRect(mx,360-h-70,10,72);x.beginPath();x.moveTo(mx-3,360-h-70);x.lineTo(mx+5,360-h-98);x.lineTo(mx+13,360-h-70);x.fill();x.fillRect(mx-4,360-h-40,18,5)}
   else{x.fillRect(bx+dx-2,360-h-6,w+4,6)}
   for(let wy=360-h+14;wy<350;wy+=26)for(let wx=bx+dx+8;wx<bx+dx+w-10;wx+=18)if(r()<.45){x.fillStyle=r()<.7?'#ffcf6b':'#ff9a5a';x.beginPath();x.arc(wx+4,wy+6,3.2,Math.PI,0);x.fillRect(wx+.8,wy+6,6.4,6);x.fill();x.fillStyle='#4d2253'}
   });bx+=w+Math.floor(r()*12)}}},
 {k:.46,seed:19,mk(x,r){let bx=0;while(bx<TW){const w=60+Math.floor(r()*70),h=34+Math.floor(r()*50);wr(dx=>{x.fillStyle='#2a1238';x.fillRect(bx+dx,372-h,w,h+8);x.fillRect(bx+dx-3,372-h-5,w+6,6);
   x.fillStyle='rgba(255,207,107,.85)';for(let i=0;i<2;i++){const ax=bx+dx+10+i*(w-34);x.beginPath();x.arc(ax+7,372-h+16,7,Math.PI,0);x.fillRect(ax,372-h+16,14,16);x.fill()}x.fillStyle='#2a1238'});bx+=w+Math.floor(r()*18)}}},
 {fx(c,cam,q){c.strokeStyle='#2a1238';c.lineWidth=2.2;c.lineCap='round';const n=Math.round(8*q);for(let i=0;i<n;i++){const x=mod(AT*(46+i%3*8)+i*86,VW+200)-100,y=70+i%4*26+Math.sin(AT*1.3+i)*9;bird(c,x,y,7+i%3*2,AT*9+i*1.7)}c.lineCap='butt'}}]},

/* أعماق البحر */
sea:{ sky:[[0,'#0c3d6e'],[.4,'#0a6c9a'],[.8,'#12a0b5'],[1,'#58d3c6']],
 back(c,cam,q){if(q<=0)return;c.save();c.globalCompositeOperation='lighter';for(let i=0;i<7;i++){const x0=i*150-40-cam*.03+Math.sin(AT*.4+i)*30,w=36+i%3*14;const g=c.createLinearGradient(0,0,0,300);g.addColorStop(0,'rgba(180,255,255,.20)');g.addColorStop(1,'rgba(180,255,255,0)');c.fillStyle=g;c.beginPath();c.moveTo(x0,0);c.lineTo(x0+w,0);c.lineTo(x0+w*2.6+Math.sin(AT*.4+i)*20,330);c.lineTo(x0-w*.8,330);c.closePath();c.fill()}c.restore()},
 L:[
 {k:.1,seed:5,mk(x,r){ridge(x,270,38,[1,3,6],.7,'#0a3a63');wr(dx=>{for(let i=0;i<7;i++){const bx=i*150+r()*60+dx,h=30+r()*50;x.fillStyle='#0b4470';x.beginPath();x.moveTo(bx,340);x.quadraticCurveTo(bx+6,340-h,bx+26,340-h*1.2);x.quadraticCurveTo(bx+30,340-h*.4,bx+48,340);x.fill()}})}},
 {fx(c,cam,q){c.fillStyle='rgba(255,210,120,.8)';const n=Math.max(1,Math.round(3*q));for(let s=0;s<n;s++){const dir=s%2?-1:1,bx=mod(AT*(34+s*13)+s*310,VW+360)-180,by=90+s*74+Math.sin(AT*.8+s)*10;
   for(let i=0;i<7;i++){const fx=(dir>0?bx:VW-bx)+((i%3)-1)*22-i*dir*9,fy=by+Math.sin(AT*2+i+s)*8+((i*37)%5)*6;c.save();c.translate(fx,fy);c.scale(dir,1);c.beginPath();c.ellipse(0,0,9,4,0,0,7);c.fill();c.beginPath();c.moveTo(-8,0);c.lineTo(-15,-5);c.lineTo(-15,5);c.fill();c.restore()}}}},
 {k:.26,seed:9,mk(x,r){wr(dx=>{for(let i=0;i<9;i++){const bx=i*118+r()*50+dx,h=40+r()*70,col=['#ff7aa8','#ff9a5a','#c86bff','#ffd24a'][i%4];x.strokeStyle=col;x.lineWidth=6;x.lineCap='round';
   for(let b=-1;b<=1;b++){x.beginPath();x.moveTo(bx,352);x.quadraticCurveTo(bx+b*12,352-h*.55,bx+b*22,352-h);x.stroke();x.fillStyle=col;x.beginPath();x.arc(bx+b*22,352-h,5,0,7);x.fill()}}});x.fillStyle='rgba(8,70,110,.35)';x.fillRect(0,0,TW,VH)}},
 {fx(c,cam,q){const off=cam*.5;c.lineCap='round';for(let i=0;i<9;i++){const bx=mod(i*131+hh(i,2)*50-off,VW+160)-80,h=80+hh(i,4)*90;c.strokeStyle=i%2?'#1fae6b':'#2ccf86';c.lineWidth=7;c.beginPath();for(let s=0;s<=8;s++){const yy=352-h*s/8,xx=bx+Math.sin(AT*1.1+s*.5+i)*s*2.4;s?c.lineTo(xx,yy):c.moveTo(xx,yy)}c.stroke()}c.lineCap='butt';
   const nb=Math.round(26*q);c.strokeStyle='rgba(220,255,255,.55)';c.lineWidth=1.3;for(let i=0;i<nb;i++){const x=hh(i,7)*VW+Math.sin(AT+i)*8,y=VH-mod(AT*(22+hh(i,8)*34)+hh(i,9)*VH,VH+30)+10;c.beginPath();c.arc(x,y,1.5+hh(i,6)*3,0,7);c.stroke()}
   for(let i=0;i<Math.max(1,Math.round(3*q));i++){const x=mod(hh(i,31)*VW-cam*.2,VW+100)-50,y=90+i*58+Math.sin(AT*.9+i*2)*14,p=1+Math.sin(AT*2+i)*.14;c.fillStyle='rgba(255,150,230,.5)';c.beginPath();c.ellipse(x,y,17*p,13/p,0,Math.PI,0);c.fill();c.strokeStyle='rgba(255,170,240,.5)';c.lineWidth=1.8;for(let t=-2;t<=2;t++){c.beginPath();c.moveTo(x+t*6,y);for(let s=1;s<=5;s++)c.lineTo(x+t*6+Math.sin(AT*2+s+t)*3,y+s*6);c.stroke()}}}}]},

/* ليل الصحراء */
desert:{ sky:[[0,'#070a24'],[.45,'#1b2a66'],[.8,'#5b4a86'],[1,'#e39a6e']],
 back(c,cam,q){const n=Math.round(80*Math.max(q,.35));c.fillStyle='#fff';for(let i=0;i<n;i++){c.globalAlpha=.35+.65*Math.abs(Math.sin(AT*(.8+hh(i,1)*2.4)+i));const x=mod(hh(i,2)*VW-cam*.02,VW),y=hh(i,3)*250,s=.7+hh(i,4)*1.2;c.fillRect(x,y,s,s)}c.globalAlpha=1;
   const mx=640-cam*.03;glow(c,mx,88,110,'rgba(255,240,200,.45)');c.save();c.beginPath();c.arc(mx,88,34,0,7);c.clip();c.fillStyle='#fff3cf';c.beginPath();c.arc(mx,88,34,0,7);c.arc(mx+15,80,31,0,7);c.fill('evenodd');c.restore();
   const t=mod(AT,9);if(t<.8){const p=t/.8,x0=120+hh(Math.floor(AT/9),5)*400,y0=30+hh(Math.floor(AT/9),6)*60,g=c.createLinearGradient(x0+p*260,y0+p*130,x0+p*260-90,y0+p*130-45);g.addColorStop(0,'rgba(255,255,255,'+(1-p)+')');g.addColorStop(1,'rgba(255,255,255,0)');c.strokeStyle=g;c.lineWidth=2;c.beginPath();c.moveTo(x0+p*260,y0+p*130);c.lineTo(x0+p*260-90,y0+p*130-45);c.stroke()}},
 L:[
 {k:.06,seed:2,mk(x,r){wr(dx=>{for(let i=0;i<4;i++){const bx=i*260+r()*80+dx,w=70+r()*50;x.fillStyle='#2b2152';x.beginPath();x.moveTo(bx,305);x.lineTo(bx+w/2,305-w*.75);x.lineTo(bx+w,305);x.fill();x.fillStyle='#231a46';x.beginPath();x.moveTo(bx+w/2,305-w*.75);x.lineTo(bx+w,305);x.lineTo(bx+w*.55,305);x.fill()}});ridge(x,305,10,[2,4],.4,'#3b2a5c')}},
 {k:.2,seed:4,mk(x,r){ridge(x,300,28,[1,2,4],1.1,'#4c3568')}},
 {fx(c,cam,q){const n=Math.round(7*q);c.fillStyle='rgba(235,190,140,.14)';for(let i=0;i<n;i++){const x=mod(AT*(60+i*9)+i*170,VW+300)-150,y=300+hh(i,3)*50;c.beginPath();c.ellipse(x,y,90+hh(i,4)*60,2.2,0,0,7);c.fill()}}},
 {k:.46,seed:6,mk(x,r){ridge(x,338,20,[2,3,5],.9,'#2e1f4a');wr(dx=>{for(let i=0;i<5;i++){const bx=i*205+r()*90+dx,h=36+r()*40;x.fillStyle='#1d1336';x.fillRect(bx,350-h,7,h+4);x.fillRect(bx-13,350-h*.62,6,h*.34);x.fillRect(bx-13,350-h*.34,20,5);x.fillRect(bx+14,350-h*.78,6,h*.38);x.fillRect(bx+6,350-h*.42,14,5)}})}}]},

/* المقبرة */
grave:{ sky:[[0,'#0a0720'],[.45,'#2a1f4d'],[.8,'#5b4585'],[1,'#8a6aa8']],
 back(c,cam,q){const mx=170-cam*.03;glow(c,mx,112,170,'rgba(190,200,255,.5)');c.fillStyle='#ece7ff';c.beginPath();c.arc(mx,112,52,0,7);c.fill();c.fillStyle='rgba(120,110,170,.35)';for(const [dx,dy,r] of [[-14,-10,11],[16,12,8],[-4,22,6],[22,-20,5]]){c.beginPath();c.arc(mx+dx,112+dy,r,0,7);c.fill()}
   const n=Math.round(40*Math.max(q,.3));c.fillStyle='#fff';for(let i=0;i<n;i++){c.globalAlpha=.25+.5*Math.abs(Math.sin(AT*1.3+i));c.fillRect(mod(hh(i,2)*VW-cam*.02,VW),hh(i,3)*200,1.2,1.2)}c.globalAlpha=1},
 L:[
 {k:.07,seed:3,mk(x,r){ridge(x,282,24,[2,3,6],2.2,'#3a2a5e');ridge(x,308,18,[3,5],.9,'#2a1d48')}},
 {k:.22,seed:8,mk(x,r){const tree=(bx,by,len,ang,d)=>{if(d>6||len<5)return;const ex=bx+Math.cos(ang)*len,ey=by+Math.sin(ang)*len;x.lineWidth=Math.max(1.2,(7-d)*1.5);x.beginPath();x.moveTo(bx,by);x.lineTo(ex,ey);x.stroke();tree(ex,ey,len*(.68+r()*.12),ang-.3-r()*.35,d+1);tree(ex,ey,len*(.66+r()*.12),ang+.3+r()*.35,d+1);if(r()<.35)tree(ex,ey,len*.55,ang+(r()-.5)*.4,d+2)};
   x.strokeStyle='#150c2a';x.lineCap='round';wr(dx=>{for(let i=0;i<4;i++)tree(i*256+60+r()*80+dx,356,52+r()*18,-Math.PI/2+(r()-.5)*.35,0)});x.lineCap='butt'}},
 {fx(c,cam,q){c.fillStyle='#0b0616';const n=Math.max(1,Math.round(5*q));for(let i=0;i<n;i++){const x=mod(AT*(52+i*10)+i*190,VW+260)-130,y=60+i*30+Math.sin(AT*1.6+i)*16;bat(c,x,y,7+i%2*3,AT*14+i)}
   for(let i=0;i<4;i++){const x=mod(hh(i,3)*VW*2-AT*(12+i*4),VW*2)-VW*.5,w=380+i*60,g=c.createLinearGradient(x,0,x+w,0);g.addColorStop(0,'rgba(200,210,255,0)');g.addColorStop(.5,'rgba(200,210,255,.13)');g.addColorStop(1,'rgba(200,210,255,0)');c.fillStyle=g;c.fillRect(x,255+i*22,w,34)}
   const ph=mod(AT,11),fl=ph<.5?Math.max(0,1-ph*2.2):0;if(fl>0){c.fillStyle='rgba(215,225,255,'+(.33*fl)+')';c.fillRect(0,0,VW,VH);if(ph<.2)bolt(c,200+hh(Math.floor(AT/11),4)*400,Math.floor(AT/11),'rgba(255,255,255,.9)')}}},
 {k:.46,seed:12,mk(x,r){wr(dx=>{for(let i=0;i<9;i++){const bx=i*118+r()*60+dx,h=26+r()*26,w=20+r()*10,cross=r()<.35;x.fillStyle='#0d0718';x.strokeStyle='#33275a';x.lineWidth=1.5;
   if(cross){x.fillRect(bx+w/2-3,372-h-12,6,h+16);x.fillRect(bx+w/2-12,372-h,24,6)}else{x.beginPath();x.moveTo(bx,372);x.lineTo(bx,372-h+w/2);x.arc(bx+w/2,372-h+w/2,w/2,Math.PI,0);x.lineTo(bx+w,372);x.closePath();x.fill();x.stroke()}}})}}]},

/* أرض الحلوى */
candy:{ sky:[[0,'#ffa6e0'],[.55,'#ffd9f0'],[1,'#fff0c4']],
 back(c,cam,q){const cx=400-cam*.03;c.globalAlpha=.6;c.lineWidth=9;['#ff5b6b','#ff9a4a','#ffd84a','#6bde7a','#4ab8ff','#8a6bff','#d46bff'].forEach((col,i)=>{c.strokeStyle=col;c.beginPath();c.arc(cx,350,330-i*9,Math.PI,0);c.stroke()});c.globalAlpha=1},
 L:[
 {k:.07,seed:3,mk(x,r){ridge(x,285,24,[2,3],.8,'#b8f2d6');ridge(x,315,20,[3,5],1.7,'#ffb5d8')}},
 {fx(c,cam,q){for(let i=0;i<5;i++){const cx=mod(hh(i,5)*1300-AT*(8+i*3),VW+360)-180;cloudP(c,cx,70+i*40,150+i*18,'rgba(255,255,255,.85)')}}},
 {k:.22,seed:11,mk(x,r){wr(dx=>{for(let i=0;i<6;i++){const bx=i*170+r()*70+dx,h=60+r()*55,col=['#ff6fb0','#6ad9ff','#ffd24a','#9a7bff','#7bea9a'][i%5];x.fillStyle='#fff';x.fillRect(bx-2.5,352-h,5,h+4);x.strokeStyle='#ff6fb0';x.lineWidth=2;for(let k=0;k<h;k+=10){x.beginPath();x.moveTo(bx-2.5,352-k);x.lineTo(bx+2.5,352-k-6);x.stroke()}
     x.fillStyle=col;x.beginPath();x.arc(bx,352-h-22,26,0,7);x.fill();x.strokeStyle='#fff';x.lineWidth=3.5;x.beginPath();for(let a=0;a<14;a+=.2){const rr=a*1.6;x.lineTo(bx+Math.cos(a)*rr,352-h-22+Math.sin(a)*rr)}x.stroke();
     x.fillStyle=['#ffb3d9','#a8f0d0'][i%2];x.beginPath();x.arc(bx+85,352,32,Math.PI,0);x.fill();x.fillStyle='#fff';for(let s=0;s<5;s++){x.beginPath();x.arc(bx+68+s*8,340-(s%2)*8,2,0,7);x.fill()}}})}},
 {k:.46,seed:19,mk(x,r){wr(dx=>{for(let i=0;i<6;i++){const bx=i*180+r()*80+dx,h=44+r()*26;x.strokeStyle='#fff';x.lineWidth=9;x.lineCap='round';x.beginPath();x.moveTo(bx,372);x.lineTo(bx,372-h);x.arc(bx+11,372-h,11,Math.PI,0);x.stroke();x.strokeStyle='#ff4f7a';x.lineWidth=9;x.setLineDash([7,7]);x.beginPath();x.moveTo(bx,372);x.lineTo(bx,372-h);x.arc(bx+11,372-h,11,Math.PI,0);x.stroke();x.setLineDash([])}});x.lineCap='butt'}},
 {fx(c,cam,q){const n=Math.round(34*q),cols=['#ff4f7a','#4ab8ff','#ffd24a','#6bde7a','#b46bff'];for(let i=0;i<n;i++){const x=hh(i,3)*VW+Math.sin(AT*.9+i)*16,y=mod(AT*(18+hh(i,2)*22)+hh(i,5)*VH,VH+20)-10;c.save();c.translate(x,y);c.rotate(AT*(1+hh(i,1))+i);c.fillStyle=cols[i%5];c.beginPath();c.roundRect(-4,-1.6,8,3.2,1.6);c.fill();c.restore()}
   const m=Math.round(12*Math.max(q,.3));c.fillStyle='#fff';for(let i=0;i<m;i++){const p=.5+.5*Math.sin(AT*2+i*1.7),x=hh(i,12)*VW,y=40+hh(i,13)*250;c.globalAlpha=p;c.fillRect(x-4,y-.8,8,1.6);c.fillRect(x-.8,y-4,1.6,8)}c.globalAlpha=1}}]},

/* مدينة النيون */
neon:{ sky:[[0,'#05020f'],[.55,'#1a0836'],[.85,'#4a0e55'],[1,'#ff3d8b']],
 back(c,cam,q){if(q<=0)return;c.save();c.globalCompositeOperation='lighter';for(let i=0;i<2;i++){const bx=i?640:170,a=-Math.PI/2+Math.sin(AT*.45+i*2.3)*.55,g=c.createLinearGradient(bx,330,bx+Math.cos(a)*380,330+Math.sin(a)*380);g.addColorStop(0,'rgba(120,255,255,.28)');g.addColorStop(1,'rgba(120,255,255,0)');c.fillStyle=g;c.beginPath();c.moveTo(bx-6,330);c.lineTo(bx+Math.cos(a-.09)*380,330+Math.sin(a-.09)*380);c.lineTo(bx+Math.cos(a+.09)*380,330+Math.sin(a+.09)*380);c.lineTo(bx+6,330);c.fill()}c.restore()},
 L:[
 {k:.07,seed:3,mk(x,r){let bx=0;while(bx<TW){const w=36+Math.floor(r()*40),h=70+Math.floor(r()*130);wr(dx=>{x.fillStyle='#14082e';x.fillRect(bx+dx,350-h,w,h+8);if(r()<.4)x.fillRect(bx+dx+w/2-1,350-h-24,2,24);x.fillStyle='#34196a';for(let wy=350-h+8;wy<344;wy+=12)for(let wx=bx+dx+5;wx<bx+dx+w-6;wx+=9)if(r()<.45)x.fillRect(wx,wy,4,6)});bx+=w+Math.floor(r()*8)}}},
 {k:.22,seed:7,mk(x,r){let bx=0;while(bx<TW){const w=44+Math.floor(r()*56),h=90+Math.floor(r()*120);wr(dx=>{x.fillStyle='#0a0320';x.fillRect(bx+dx,360-h,w,h+8);x.fillStyle='rgba(255,60,140,.7)';x.fillRect(bx+dx,360-h,w,2);const cols=['#37f0ff','#ff3d8b','#ffe14a','#9a6bff'];for(let wy=360-h+10;wy<350;wy+=13)for(let wx=bx+dx+6;wx<bx+dx+w-7;wx+=10)if(r()<.38){x.fillStyle=cols[Math.floor(r()*4)];x.globalAlpha=.85;x.fillRect(wx,wy,5,7);x.globalAlpha=1}});bx+=w+Math.floor(r()*14)}}},
 {fx(c,cam,q){const off=cam*.22;for(let i=0;i<3;i++){const x=mod(i*330+120-off,VW+300)-100,y=120+i%2*70,p=.55+.45*Math.sin(AT*(3+i)+i*2),col=['55,240,255','255,61,139','255,225,74'][i];c.strokeStyle='rgba('+col+','+(.25*p)+')';c.lineWidth=9;c.strokeRect(x,y,84,34);c.strokeStyle='rgba('+col+','+(.9*p)+')';c.lineWidth=3;c.strokeRect(x,y,84,34);c.fillStyle='rgba('+col+','+(.9*p)+')';c.fillRect(x+10,y+15,64,3)}
   for(let i=0;i<3;i++){const x=mod(AT*(90+i*40)+i*300,VW+200)-100,y=60+i*46;c.fillStyle='rgba(255,255,255,.9)';c.fillRect(x,y,3,3);const g=c.createLinearGradient(x,0,x-50,0);g.addColorStop(0,'rgba(255,61,139,.7)');g.addColorStop(1,'rgba(255,61,139,0)');c.fillStyle=g;c.fillRect(x-50,y,50,2.4)}
   const n=Math.round(46*q);c.strokeStyle='rgba(170,200,255,.38)';c.lineWidth=1;c.beginPath();for(let i=0;i<n;i++){const x=mod(hh(i,3)*VW+AT*40,VW+30),y=mod(AT*(420+hh(i,2)*160)+hh(i,5)*VH,VH+40)-20;c.moveTo(x,y);c.lineTo(x-4,y+13)}c.stroke()}},
 {k:.46,seed:9,mk(x,r){wr(dx=>{for(let i=0;i<6;i++){const bx=i*172+r()*60+dx,w=60+r()*50,h=26+r()*26;x.fillStyle='#07010f';x.fillRect(bx,372-h,w,h+8);x.fillRect(bx+8,372-h-14,16,14);x.fillRect(bx+w-14,372-h-30,2,30);x.fillStyle='rgba(55,240,255,.5)';x.fillRect(bx,372-h,w,1.6)}})}}]},

/* الفضاء */
space:{ sky:[[0,'#010006'],[.6,'#0a0620'],[1,'#1a0a38']],
 L:[
 {k:.03,seed:2,mk(x,r){x.fillStyle='#fff';for(let i=0;i<220;i++){x.globalAlpha=.25+r()*.5;x.fillRect(r()*TW,r()*VH,1,1)}x.globalAlpha=1}},
 {k:.06,seed:4,mk(x,r){const blob=(cx,cy,rr,col)=>{const g=x.createRadialGradient(cx,cy,0,cx,cy,rr);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(cx-rr,cy-rr,rr*2,rr*2)};
   wr(dx=>{blob(200+dx,150,200,'rgba(255,47,182,.28)');blob(420+dx,210,230,'rgba(90,60,255,.30)');blob(700+dx,120,190,'rgba(40,210,255,.22)');blob(900+dx,230,170,'rgba(255,47,182,.2)')})}},
 {k:.1,seed:5,mk(x,r){const px=700,py=150,R=66;x.save();x.translate(px,py);x.rotate(-.35);x.strokeStyle='rgba(255,200,140,.55)';x.lineWidth=10;x.beginPath();x.ellipse(0,0,R*1.7,R*.42,0,Math.PI,0);x.stroke();x.restore();
   const g=x.createRadialGradient(px-R*.35,py-R*.35,R*.1,px,py,R);g.addColorStop(0,'#ffd9a0');g.addColorStop(.6,'#d9773a');g.addColorStop(1,'#5a2410');x.fillStyle=g;x.beginPath();x.arc(px,py,R,0,7);x.fill();
   x.strokeStyle='rgba(120,40,10,.35)';x.lineWidth=5;for(let i=-2;i<=2;i++){x.beginPath();x.ellipse(px,py+i*17,R*.96,6,0,0,Math.PI);x.stroke()}
   x.save();x.translate(px,py);x.rotate(-.35);x.strokeStyle='rgba(255,200,140,.75)';x.lineWidth=10;x.beginPath();x.ellipse(0,0,R*1.7,R*.42,0,0,Math.PI);x.stroke();x.restore();
   const mg=x.createRadialGradient(140,95,2,150,100,22);mg.addColorStop(0,'#f2f2ff');mg.addColorStop(1,'#7a7aa8');x.fillStyle=mg;x.beginPath();x.arc(150,100,22,0,7);x.fill()}},
 {k:.14,seed:6,mk(x,r){x.fillStyle='#fff';for(let i=0;i<120;i++){x.globalAlpha=.35+r()*.6;const s=.8+r()*1.4;x.fillRect(r()*TW,r()*VH,s,s)}x.globalAlpha=1}},
 {fx(c,cam,q){const n=Math.round(40*Math.max(q,.3));c.fillStyle='#fff';for(let i=0;i<n;i++){c.globalAlpha=.2+.8*Math.abs(Math.sin(AT*(1+hh(i,2)*2.5)+i));const x=mod(hh(i,3)*VW-cam*.14,VW),y=hh(i,4)*340;c.fillRect(x-1,y,3,1);c.fillRect(x,y-1,1,3)}c.globalAlpha=1;
   const t=mod(AT,8);if(t<1.2){const p=t/1.2,x=-40+p*(VW+120),y=40+p*160,g=c.createLinearGradient(x,y,x-130,y-52);g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(1,'rgba(120,200,255,0)');c.strokeStyle=g;c.lineWidth=3;c.beginPath();c.moveTo(x,y);c.lineTo(x-130,y-52);c.stroke()}
   const sx=mod(AT*22,VW+100)-50,sy=70+Math.sin(AT*.3)*20;c.fillStyle='#cfd6ff';c.fillRect(sx-4,sy-1.5,8,3);c.fillStyle=Math.floor(AT*1.6)%2?'#ff4a4a':'#4aff9a';c.fillRect(sx-1,sy-3.5,2,2)}},
 {k:.34,seed:8,mk(x,r){wr(dx=>{for(let i=0;i<5;i++){const cx=i*210+r()*100+dx,cy=240+r()*90,rr=16+r()*26;x.fillStyle='#14102a';x.beginPath();for(let a=0;a<9;a++){const rad=rr*(.75+r()*.35),an=a/9*Math.PI*2;x.lineTo(cx+Math.cos(an)*rad,cy+Math.sin(an)*rad)}x.closePath();x.fill();x.strokeStyle='rgba(127,227,255,.35)';x.lineWidth=1.4;x.stroke()}})}}]},

/* فوق الغيوم */
sky:{ sky:[[0,'#3aa0ff'],[.6,'#8fd0ff'],[1,'#e8f8ff']],
 back(c,cam,q){const sx=620-cam*.02,sy=92;if(q<=0){glow(c,sx,sy,120,'rgba(255,250,200,.8)');c.fillStyle='#fffbd0';c.beginPath();c.arc(sx,sy,36,0,7);c.fill();return}c.save();c.translate(sx,sy);c.rotate(AT*.05);c.fillStyle='rgba(255,250,200,.14)';for(let i=0;i<12;i++){c.rotate(Math.PI/6);c.beginPath();c.moveTo(0,0);c.lineTo(400,-26);c.lineTo(400,26);c.fill()}c.restore();glow(c,sx,sy,120,'rgba(255,250,200,.8)');c.fillStyle='#fffbd0';c.beginPath();c.arc(sx,sy,36,0,7);c.fill()},
 L:[
 {k:.04,drift:7,seed:2,mk(x,r){wr(dx=>{for(let i=0;i<4;i++)cloudP(x,i*260+80+dx,90+r()*80,170+r()*60,'rgba(255,255,255,.55)')})}},
 {k:.1,seed:5,mk(x,r){wr(dx=>{for(let i=0;i<3;i++){const bx=i*340+80+r()*90+dx,w=110+r()*60,y=190+r()*70;x.fillStyle='#a9c9ea';x.beginPath();x.moveTo(bx,y);x.lineTo(bx+w,y);x.quadraticCurveTo(bx+w*.7,y+w*.35,bx+w/2,y+w*.55);x.quadraticCurveTo(bx+w*.3,y+w*.35,bx,y);x.fill();x.fillStyle='#8fd0a0';x.fillRect(bx,y-5,w,7);x.fillStyle='#78b98a';x.beginPath();x.arc(bx+w*.3,y-12,9,0,7);x.arc(bx+w*.45,y-15,11,0,7);x.fill()}})}},
 {k:.2,drift:14,seed:7,mk(x,r){wr(dx=>{for(let i=0;i<4;i++)cloudP(x,i*270+40+r()*80+dx,200+r()*110,210+r()*80,'rgba(255,255,255,.8)')})}},
 {fx(c,cam,q){c.strokeStyle='#fff';c.lineWidth=2.2;c.lineCap='round';const n=Math.round(7*q);for(let i=0;i<n;i++){bird(c,mod(AT*(40+i%3*7)+i*120,VW+200)-100,60+i%4*30+Math.sin(AT*1.2+i)*8,6+i%3*2,AT*8+i*2)}c.lineCap='butt';
   const bx=mod(AT*9+300-cam*.12,VW+300)-150,by=170+Math.sin(AT*.5)*8;c.fillStyle='#ff5b5b';c.beginPath();c.ellipse(bx,by,24,30,0,0,7);c.fill();c.fillStyle='#ffd24a';c.beginPath();c.ellipse(bx,by,8,30,0,0,7);c.fill();c.fillStyle='#6b3a1a';c.fillRect(bx-7,by+36,14,9);c.strokeStyle='#6b3a1a';c.lineWidth=1.2;c.beginPath();c.moveTo(bx-12,by+24);c.lineTo(bx-6,by+36);c.moveTo(bx+12,by+24);c.lineTo(bx+6,by+36);c.stroke()}},
 {k:.46,drift:22,seed:9,mk(x,r){wr(dx=>{for(let i=0;i<5;i++)cloudP(x,i*215+r()*60+dx,372,230+r()*70,'#ffffff')})}}]},

/* العاصفة */
storm:{ sky:[[0,'#10161d'],[.5,'#27323d'],[1,'#44565f']],
 L:[
 {k:.05,drift:12,seed:2,mk(x,r){wr(dx=>{for(let i=0;i<5;i++)cloudP(x,i*220+dx,80+r()*70,260+r()*90,'#18212a')})}},
 {k:.12,drift:26,seed:4,mk(x,r){wr(dx=>{for(let i=0;i<5;i++)cloudP(x,i*215+dx,170+r()*70,280+r()*80,'#2b3944')})}},
 {k:.3,seed:6,mk(x,r){ridge(x,300,26,[2,3,5],1.4,'#0f1d1a');wr(dx=>{for(let i=0;i<10;i++){const bx=i*104+r()*50+dx,y=ridgeY(mod(bx,TW),300,26,[2,3,5],1.4),h=20+r()*22;x.fillStyle='#0b1614';x.beginPath();x.moveTo(bx-10,y+2);x.lineTo(bx,y-h);x.lineTo(bx+10,y+2);x.fill()}})}},
 {fx(c,cam,q){const ph=mod(AT,7),fl=ph<.6?Math.max(0,Math.sin(ph*16)*(1-ph/.6)):0;if(fl>0){c.fillStyle='rgba(205,225,255,'+(.3*fl)+')';c.fillRect(0,0,VW,VH)}if(ph<.28)bolt(c,150+hh(Math.floor(AT/7),4)*500,Math.floor(AT/7),'rgba(255,255,255,'+(1-ph*2.5)+')');
   const n=Math.round(70*q);c.strokeStyle='rgba(175,205,235,.4)';c.lineWidth=1.1;c.beginPath();for(let i=0;i<n;i++){const x=mod(hh(i,3)*(VW+200)-AT*150,VW+60),y=mod(AT*(520+hh(i,2)*200)+hh(i,5)*VH,VH+50)-25;c.moveTo(x,y);c.lineTo(x+7,y+16)}c.stroke()}}]},

/* الخريف */
autumn:{ sky:[[0,'#ffd28a'],[.55,'#ffa760'],[1,'#e8704a']],
 back(c,cam,q){const sx=210-cam*.02;if(q>0){c.save();c.globalCompositeOperation='lighter';for(let i=0;i<4;i++){c.fillStyle='rgba(255,230,160,.07)';c.beginPath();const a=.55+i*.16+Math.sin(AT*.3+i)*.03;c.moveTo(sx,238);c.lineTo(sx+Math.cos(a)*700,238+Math.sin(a)*700);c.lineTo(sx+Math.cos(a+.07)*700,238+Math.sin(a+.07)*700);c.fill()}c.restore()}glow(c,sx,238,190,'rgba(255,240,170,.8)',.8);c.fillStyle='#fff1b0';c.beginPath();c.arc(sx,238,58,0,7);c.fill()},
 L:[
 {k:.07,seed:3,mk(x,r){ridge(x,282,24,[2,3,5],.6,'#c5573e');wr(dx=>{for(let i=0;i<14;i++){const bx=i*76+r()*30+dx,y=ridgeY(mod(bx,TW),282,24,[2,3,5],.6);x.fillStyle=['#d96a3c','#e08a3a','#b94a34'][i%3];x.beginPath();x.arc(bx,y-6,12+r()*8,0,7);x.fill()}})}},
 {k:.22,seed:9,mk(x,r){wr(dx=>{for(let i=0;i<7;i++){const bx=i*152+r()*60+dx,h=60+r()*50;x.fillStyle='#5a2b1a';x.fillRect(bx-5,352-h,10,h+4);const cols=['#e2552b','#f08a2e','#f5b73a','#c23b2b'];for(let k=0;k<6;k++){x.fillStyle=cols[(i+k)%4];x.beginPath();x.arc(bx+(k-2.5)*13+(r()-.5)*8,352-h-10-(k%2)*14-r()*10,18+r()*10,0,7);x.fill()}}})}},
 {k:.46,seed:11,mk(x,r){x.fillStyle='#6b2a1a';wr(dx=>{for(let i=0;i<9;i++){const bx=i*118+dx;x.fillRect(bx,350,5,26);x.fillRect(bx+60,350,5,26);x.fillRect(bx,356,65,4);x.fillRect(bx,366,65,4)}for(let i=0;i<70;i++){const bx=r()*TW+dx,h=10+r()*18;x.beginPath();x.moveTo(bx,376);x.lineTo(bx+2,376-h);x.lineTo(bx+4,376);x.fill()}})}},
 {fx(c,cam,q){const n=Math.round(30*q),cols=['#e2552b','#f08a2e','#f5b73a','#c23b2b','#d9792e'];for(let i=0;i<n;i++){const y=mod(AT*(34+hh(i,2)*30)+hh(i,5)*VH,VH+30)-15,x=mod(hh(i,3)*VW+Math.sin(AT*1.1+i)*34+AT*14,VW+40)-20;c.save();c.translate(x,y);c.rotate(AT*(1.4+hh(i,1))+i);c.fillStyle=cols[i%5];c.beginPath();c.ellipse(0,0,6,3,0,0,7);c.fill();c.strokeStyle='rgba(90,40,10,.6)';c.lineWidth=.8;c.beginPath();c.moveTo(-6,0);c.lineTo(6,0);c.stroke();c.restore()}}}]},

/* كهف الكريستال */
crystal:{ sky:[[0,'#031a24'],[.5,'#0a4a58'],[1,'#13808a']],
 back(c,cam,q){glow(c,300-cam*.04,300,190,'rgba(88,245,229,.4)');if(q>.6)glow(c,640-cam*.04,270,170,'rgba(255,79,216,.3)')},
 L:[
 {k:.07,seed:3,mk(x,r){wr(dx=>{for(let i=0;i<14;i++){const bx=i*76+r()*40+dx,h=40+r()*120,w=14+r()*22;x.fillStyle='#06303c';x.beginPath();x.moveTo(bx,0);x.lineTo(bx+w,0);x.lineTo(bx+w/2,h);x.fill()}});ridge(x,320,30,[2,3,6],2.5,'#08414d')}},
 {k:.22,seed:5,mk(x,r){wr(dx=>{for(let i=0;i<10;i++){const bx=i*105+r()*50+dx,pal=[['#1ad9ff','#0a6b9a'],['#ff4fd8','#7a1b7a'],['#8a6bff','#2a1b7a'],['#58f5e5','#0a6b6b']][i%4];for(let k=0;k<3;k++)crystal(x,bx+(k-1)*18,358,18+r()*14,50+r()*80,pal[0],pal[1],(k-1)*.18+(r()-.5)*.14)}})}},
 {fx(c,cam,q){c.save();c.globalCompositeOperation='lighter';const off=cam*.22;for(let i=0;i<10;i+=(q<.6?2:1)){const x=mod(i*105+hh(i,1)*50-off,VW+260)-130,p=.6+.4*Math.sin(AT*1.4+i*1.9);glow(c,x,300,105,['rgba(26,217,255,.5)','rgba(255,79,216,.45)','rgba(138,107,255,.45)','rgba(88,245,229,.5)'][i%4],p*.8)}c.restore();
   const n=Math.round(36*Math.max(q,.3));for(let i=0;i<n;i++){const p=.5+.5*Math.sin(AT*(1.5+hh(i,2)*2)+i*2.1),x=mod(hh(i,3)*VW-cam*.18,VW),y=40+hh(i,4)*290;c.fillStyle='rgba(200,255,255,'+(.8*p)+')';c.fillRect(x-3.5,y-.7,7,1.4);c.fillRect(x-.7,y-3.5,1.4,7)}}},
 {k:.34,seed:15,mk(x,r){wr(dx=>{for(let i=0;i<6;i++){const bx=i*172+r()*60+dx,h=60+r()*90,w=20+r()*18;const pal=[['#58f5e5','#0a6b6b'],['#ff4fd8','#7a1b7a'],['#8a6bff','#2a1b7a']][i%3];x.save();x.translate(bx,0);x.scale(1,-1);crystal(x,0,0,w,h,pal[0],pal[1],(r()-.5)*.25);x.restore()}})}},
 {k:.46,seed:7,mk(x,r){wr(dx=>{for(let i=0;i<6;i++){const bx=i*176+r()*70+dx;for(let k=0;k<2;k++)crystal(x,bx+k*20,384,24+r()*14,70+r()*70,'#052a33','#03161d',(k?1:-1)*(.14+r()*.1))}})}}]},

/* ورشة التروس */
clockwork:{ sky:[[0,'#1d130a'],[.5,'#3a2814'],[1,'#5c3f1c']],
 L:[
 {k:.05,seed:2,mk(x,r){x.fillStyle='rgba(0,0,0,.16)';for(let by=0;by<VH;by+=32)for(let bx=(by/32%2)*32;bx<TW;bx+=64){x.fillRect(bx+1,by+1,62,30)}x.strokeStyle='rgba(0,0,0,.35)';x.lineWidth=2;for(let by=0;by<VH;by+=32){x.beginPath();x.moveTo(0,by);x.lineTo(TW,by);x.stroke()}}},
 {fx(c,cam,q){const off=cam*.12;[[150,150,120,16,.22,1],[430,260,150,20,.17,-1],[760,130,95,13,.3,-1],[980,280,125,17,.2,1],[1250,150,140,18,.15,1]].forEach(([gx,gy,R,t,sp,d],i)=>{const x=mod(gx-off,1300)-150;gear(c,x,gy,R,t,AT*sp*d,['#6b4a1e','#8a6228','#4a3315'][i%3],'#1d130a')})}},
 {k:.25,seed:7,mk(x,r){x.strokeStyle='#2a1b0d';wr(dx=>{for(let i=0;i<3;i++){const y=70+i*110+r()*30;x.fillStyle='#6a4d26';x.fillRect(dx,y,TW,18);x.fillStyle='rgba(255,255,255,.12)';x.fillRect(dx,y,TW,4);x.fillStyle='#3b2a13';for(let fx=40;fx<TW;fx+=180){x.fillRect(fx+dx,y-5,12,28)}}for(let i=0;i<6;i++){const bx=i*172+r()*60+dx,gy=130+r()*120;x.fillStyle='#e8d9b0';x.beginPath();x.arc(bx,gy,17,0,7);x.fill();x.strokeStyle='#3b2a13';x.lineWidth=3;x.stroke();x.beginPath();x.moveTo(bx,gy);x.lineTo(bx+9,gy-8);x.stroke();for(let t=0;t<9;t++){const a=t/9*Math.PI*2;x.beginPath();x.moveTo(bx+Math.cos(a)*12,gy+Math.sin(a)*12);x.lineTo(bx+Math.cos(a)*15,gy+Math.sin(a)*15);x.stroke()}}})}},
 {fx(c,cam,q){const n=Math.round(16*Math.max(q,.3));for(let v=0;v<3;v++){const vx=mod(v*300+110-cam*.25,VW+300)-100;for(let i=0;i<n/3+1;i++){const t=mod(AT*.55+i*.31+v*.2,1.6),a=1-t/1.6;c.fillStyle='rgba(235,225,205,'+(.2*a)+')';c.beginPath();c.arc(vx+Math.sin(i*2+v)*10+t*14,330-t*150,6+t*26,0,7);c.fill()}}}},
 {fx(c,cam,q){c.strokeStyle='#2a1b0d';c.fillStyle='#8a6228';const off=cam*.46;for(let i=0;i<5;i++){const x=mod(i*190+60-off,VW+200)-60,ang=Math.sin(AT*1.2+i)*.12;c.save();c.translate(x,0);c.rotate(ang);c.lineWidth=3;c.beginPath();c.moveTo(0,0);c.lineTo(0,90+i%3*28);c.stroke();for(let k=8;k<90+i%3*28;k+=11){c.beginPath();c.ellipse(0,k,3.2,5,0,0,7);c.stroke()}c.beginPath();c.arc(0,98+i%3*28,7,0,7);c.fill();c.stroke();c.restore()}}}]}
};

/* ---------------- drawing ---------------- */
let SCC={};
function sceneLayers(id){
  if(SCC.id===id)return SCC.ls;
  const S_=SCN[id], ls=S_.L.map(l=>{ if(!l.mk)return {fx:l.fx}; const cv=document.createElement('canvas');cv.width=TW;cv.height=VH;RR=rngS(l.seed||7);l.mk(cv.getContext('2d'),RR);return {cv,k:l.k,drift:l.drift||0} });
  SCC={id,ls}; return ls;
}
function drawScene(c,th,cam){
  const S_=SCN[th.sc], ls=sceneLayers(th.sc), q=QN();
  const g=c.createLinearGradient(0,0,0,VH); for(const [p,col] of S_.sky)g.addColorStop(p,col); c.fillStyle=g; c.fillRect(0,0,VW,VH);
  if(S_.back)S_.back(c,cam,q);
  const cvs=ls.filter(l=>l.cv),first=cvs[0],last=cvs[cvs.length-1];
  for(const l of ls){
    if(l.fx){ if(q>0)l.fx(c,cam,q); continue }
    if(q<=0&&l!==first&&l!==last)continue;
    const off=mod(cam*l.k+AT*l.drift,TW); for(let x=-off;x<VW;x+=TW)c.drawImage(l.cv,x,0);
  }
  const cg=c.createLinearGradient(0,GY,0,VH);cg.addColorStop(0,'rgba(0,0,0,.4)');cg.addColorStop(1,'rgba(0,0,0,.93)');c.fillStyle=cg;c.fillRect(0,GY,VW,VH-GY);   // pits read as deep holes in every world
}
/* a few particles IN FRONT of the action (rain, leaves, bubbles...) for depth; only on good quality levels */
function drawSceneFg(c,th,cam){
  const S_=SCN[th.sc]; if(!S_||!S_.fg||Q.q<2)return; c.save(); S_.fg(c,cam,QN()); c.restore();
}
/* ambience for the dungeon-style worlds (the wall art stays, things move in front of it) */
function drawClassicFx(c,th,cam){
  const q=QN(); if(q<=0||!th.fx)return; c.save();
  if(th.fx==='dust'){ c.globalCompositeOperation='lighter';for(let i=0;i<3;i++){const x=mod(i*300+80-cam*.3+Math.sin(AT*.3+i)*40,VW+300)-100;const g=c.createLinearGradient(x,0,x+160,330);g.addColorStop(0,'rgba(255,214,140,.10)');g.addColorStop(1,'rgba(255,214,140,0)');c.fillStyle=g;c.beginPath();c.moveTo(x,0);c.lineTo(x+60,0);c.lineTo(x+220,330);c.lineTo(x+90,330);c.fill()} c.globalCompositeOperation='source-over'; c.fillStyle='rgba(255,236,200,.5)';const n=Math.round(24*q);for(let i=0;i<n;i++){c.globalAlpha=.25+.4*Math.abs(Math.sin(AT*.7+i));c.fillRect(mod(hh(i,3)*VW+Math.sin(AT*.4+i)*18-cam*.35,VW),mod(hh(i,5)*VH-AT*(4+hh(i,7)*8),VH),1.6,1.6)} }
  else if(th.fx==='embers'){ const n=Math.round(40*q);c.globalCompositeOperation='lighter';for(let i=0;i<n;i++){const life=mod(AT*(.18+hh(i,2)*.25)+hh(i,5),1),x=mod(hh(i,3)*VW*1.4-cam*.5+Math.sin(AT*1.3+i)*14,VW*1.4)-VW*.1,y=VH-life*(VH+20);c.fillStyle='rgba(255,'+(110+Math.floor(hh(i,8)*90))+',40,'+(.85*(1-life))+')';c.beginPath();c.arc(x,y,1.2+hh(i,6)*2.4*(1-life*.5),0,7);c.fill()}
    const p=.5+.5*Math.sin(AT*1.7);const g=c.createLinearGradient(0,VH-140,0,VH);g.addColorStop(0,'rgba(255,70,20,0)');g.addColorStop(1,'rgba(255,90,30,'+(.18+.1*p)+')');c.fillStyle=g;c.fillRect(0,VH-140,VW,140) }
  else if(th.fx==='snow'){ const n=Math.round(60*q);c.fillStyle='#fff';for(let i=0;i<n;i++){const s=.8+hh(i,6)*2.2,x=mod(hh(i,3)*VW+Math.sin(AT*.8+i)*22+AT*(8+s*3)-cam*(.2+s*.1),VW+20)-10,y=mod(AT*(16+s*14)+hh(i,5)*VH,VH+20)-10;c.globalAlpha=.45+.45*(s/3);c.beginPath();c.arc(x,y,s,0,7);c.fill()}c.globalAlpha=1;
    const m=Math.round(14*q);for(let i=0;i<m;i++){const p=.5+.5*Math.sin(AT*2.2+i*1.9),x=mod(hh(i,12)*VW-cam*.3,VW),y=40+hh(i,13)*280;c.fillStyle='rgba(200,240,255,'+(.8*p)+')';c.fillRect(x-4,y-.8,8,1.6);c.fillRect(x-.8,y-4,1.6,8)} }
  else if(th.fx==='fireflies'){ c.globalCompositeOperation='lighter';const n=Math.round(26*q);for(let i=0;i<n;i++){const x=mod(hh(i,3)*VW*1.3+Math.sin(AT*.5+i*3)*50-cam*.4,VW*1.3)-VW*.15,y=90+hh(i,5)*230+Math.sin(AT*.7+i*1.3)*26,p=.5+.5*Math.sin(AT*(1.4+hh(i,2)*1.6)+i*2.3);glow(c,x,y,14,'rgba(200,255,90,.9)',p*.85)} }
  c.restore();
}

/* ---- foreground passes ---- */
SCN.storm.fg=(c,cam,q)=>{c.strokeStyle='rgba(190,215,240,.5)';c.lineWidth=1.4;c.beginPath();const n=Math.round(22*q);for(let i=0;i<n;i++){const x=mod(hh(i,13)*(VW+200)-AT*190,VW+60),y=mod(AT*(760+hh(i,12)*260)+hh(i,15)*VH,VH+60)-30;c.moveTo(x,y);c.lineTo(x+9,y+24)}c.stroke()};
SCN.neon.fg=(c,cam,q)=>{c.strokeStyle='rgba(190,220,255,.45)';c.lineWidth=1.3;c.beginPath();const n=Math.round(16*q);for(let i=0;i<n;i++){const x=mod(hh(i,23)*(VW+100)+AT*50,VW+30),y=mod(AT*(640+hh(i,22)*220)+hh(i,25)*VH,VH+50)-25;c.moveTo(x,y);c.lineTo(x-5,y+20)}c.stroke()};
SCN.autumn.fg=(c,cam,q)=>{const cols=['#e2552b','#f08a2e','#f5b73a','#c23b2b'],n=Math.round(8*q);for(let i=0;i<n;i++){const y=mod(AT*(60+hh(i,32)*50)+hh(i,35)*VH,VH+40)-20,x=mod(hh(i,33)*VW*1.2+Math.sin(AT*1.5+i)*50+AT*40,VW+60)-30;c.save();c.translate(x,y);c.rotate(AT*(2+hh(i,31))+i);c.fillStyle=cols[i%4];c.beginPath();c.ellipse(0,0,9,4.5,0,0,7);c.fill();c.restore()}};
SCN.sea.fg=(c,cam,q)=>{c.strokeStyle='rgba(225,255,255,.6)';c.lineWidth=1.6;const n=Math.round(10*q);for(let i=0;i<n;i++){const x=hh(i,43)*VW+Math.sin(AT*1.3+i)*14,y=VH-mod(AT*(48+hh(i,42)*50)+hh(i,45)*VH,VH+40)+20,r=3+hh(i,46)*6;c.beginPath();c.arc(x,y,r,0,7);c.stroke();c.fillStyle='rgba(255,255,255,.5)';c.fillRect(x-r*.45,y-r*.5,1.8,1.8)}};
SCN.candy.fg=(c,cam,q)=>{const cols=['#ff4f7a','#4ab8ff','#ffd24a','#6bde7a','#b46bff'],n=Math.round(8*q);for(let i=0;i<n;i++){const y=mod(AT*(44+hh(i,52)*38)+hh(i,55)*VH,VH+30)-15,x=hh(i,53)*VW+Math.sin(AT*1.1+i)*24;c.save();c.translate(x,y);c.rotate(AT*(1.5+hh(i,51))+i);c.fillStyle=cols[i%5];c.beginPath();c.roundRect(-6,-2.4,12,4.8,2.4);c.fill();c.restore()}};
SCN.desert.fg=(c,cam,q)=>{c.fillStyle='rgba(240,200,150,.4)';const n=Math.round(14*q);for(let i=0;i<n;i++){const x=mod(AT*(130+hh(i,62)*90)+hh(i,63)*VW,VW+40)-20,y=250+hh(i,65)*100+Math.sin(AT*2+i)*5;c.fillRect(x,y,3.2,1.4)}};
SCN.crystal.fg=(c,cam,q)=>{const n=Math.round(10*q);for(let i=0;i<n;i++){const p=.5+.5*Math.sin(AT*(1.2+hh(i,72)*1.6)+i*2.7),x=mod(hh(i,73)*VW-cam*.7,VW),y=30+hh(i,74)*320;c.fillStyle='rgba(190,255,255,'+(.8*p)+')';c.fillRect(x-4.5,y-.8,9,1.6);c.fillRect(x-.8,y-4.5,1.6,9)}};
SCN.grave.fg=(c,cam,q)=>{for(let i=0;i<3;i++){const x=mod(hh(i,83)*VW*2-AT*(22+i*8)-cam*.6,VW*2)-VW*.5,w=300+i*70,g=c.createLinearGradient(x,0,x+w,0);g.addColorStop(0,'rgba(190,200,240,0)');g.addColorStop(.5,'rgba(190,200,240,.09)');g.addColorStop(1,'rgba(190,200,240,0)');c.fillStyle=g;c.fillRect(x,300+i*14,w,50)}};
SCN.clockwork.fg=(c,cam,q)=>{c.fillStyle='rgba(255,200,110,.7)';const n=Math.round(12*q);for(let i=0;i<n;i++){const life=mod(AT*(.4+hh(i,92)*.4)+hh(i,95),1),x=mod(hh(i,93)*VW+Math.sin(AT*2+i)*20,VW),y=VH-life*VH*.9;c.globalAlpha=1-life;c.fillRect(x,y,2,2)}c.globalAlpha=1};
