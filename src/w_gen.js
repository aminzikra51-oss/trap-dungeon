/* =============== LEVEL GENERATION =============== */
const BADSALT={};                       // filled by offline fairness sweeps: level -> reroll salt
const pv=(r,n,list,room,D)=>{                 // pick a variant: [name,weight,unlockLevel,tilesNeeded]
  if(D.force){const f=list.find(e=>e[0]===D.force); if(f){D.lastV=f[0];return f[0]}}
  const a=list.filter(e=>n>=e[2]&&(e[3]||0)<=room&&!(D.chase&&BADCH.has(e[0]))); const v=a.length?pickW(a.map(e=>[e[0],e[1]]),r):null; D.lastV=v; return v };
const BADCH=new Set(['thwomp','drop','mover','stones','fish','charger','sniper','roll','sneak','pulse','slide','spring','double','rainspk','bait','rev','stair']);
/* difficulty presets: sh = how many levels ahead the content already is (tutorial levels 1-2 stay gentle), combo = extra overlay chance,
   gap = tighter spacing between traps, cp = tiles between checkpoints, lie = chance that a sign lies, troll = provocation pranks per level */
const DIFFS={normal:{sh:0,combo:0,gap:0,cp:36,lie:.5,troll:0},crazy:{sh:3,combo:.1,gap:.4,cp:48,lie:.62,troll:1},hell:{sh:6,combo:.2,gap:.9,cp:66,lie:.78,troll:2}};
function mkD(n){
  const h=clamp((n-2)/5.5,0,1), x=Math.max(0,n-9), f=h+Math.min(.65,x/45);       // h: 0 (tutorial) -> 1 (level 9); f keeps growing slowly after that
  return {n,h,x,f,tut:n<=2,mg:n<3?2:(n<5?3:4),gap:Math.max(1.3,5.4-3.6*h-x*.035),combo:n<3?0:clamp(.3+(n-3)*.05,0,.9),
    v:(a,b)=>lerp(a,b,clamp(f,0,1.6)), force:null, chase:false};
}
function cutPit(L,x,len){for(let i=0;i<len;i++)L.ground[x+i]=-1; L.pits.push([x,len])}
function addSign(L,r,x,n,truthOnly,txt){
  const p=n<=1?0.8:0.5; if(r()>p||x-3<5)return;
  const lie=!truthOnly&&n>=3&&r()<(L.lie||0.5), d=txt?[txt,'any']:(lie?SIGN_LIE[ri(r,0,SIGN_LIE.length-1)]:SIGN_TRUE[ri(r,0,SIGN_TRUE.length-1)]);
  L.signs.push({tx:x-3,text:d[0],tag:d[1],lie:!txt&&lie,seen:false});
}
function coinArc(L,x,len,hi){
  const cx=(x+len/2)*TS, n=3; for(let i=0;i<n;i++){const k=i/(n-1);L.ents.push(mkCoin(cx+(k-.5)*(len+1.2)*TS*0.9,GY-(hi?70:48)-Math.sin(k*Math.PI)*(hi?70:46),false))}
}
const newId=L=>(L.eid=(L.eid||0)+1);
const blk=(L,tx,ty,st)=>{L.blocks[tx+','+ty]={rev:true,bump:0,st:st||'b'}};

/* ---- families: each returns the number of tiles used ---- */
const FAM={
 pit(L,r,x,n,D,room){
  const v=pv(r,n,[['plain',10,1,6],['wide',6,3,10],['invis',4,5,5],['mover',6,4,14],['stones',6,5,13],['fish',7,5,9],['ceil',5,7,8],['spring',4,8,13]],room,D)||'plain';
  if(v==='plain'){const len=ri(r,2,D.mg);addSign(L,r,x,n,n<3);cutPit(L,x,len);if(r()<.7)coinArc(L,x,len);return len}
  if(v==='wide'){const len=n<3?6:(r()<.7?6:(n<20?7:ri(r,7,8)));addSign(L,r,x,n,true,n<3?'قفزة مزدوجة!\nاضغط القفز\nمرتين بالهوا':(r()<.5?'قفزة ثانية\nبالهوا ⬆⬆':null));cutPit(L,x,len);coinArc(L,x,len,true);return len}
  if(v==='invis'){const len=ri(r,2,Math.min(4,D.mg));addSign(L,r,x,n,false);cutPit(L,x,len);L.blocks[(x+1)+','+(GR-4)]={rev:false,bump:0};return len}
  if(v==='mover'){const len=ri(r,7,9);addSign(L,r,x,n,false);cutPit(L,x,len);const pw=80;
    L.ents.push(mkPlat(newId(L),'move',x*TS+8,GY,pw,{x0:x*TS+8,x1:(x+len)*TS-pw-8,sp:D.v(62,108)}));
    L.ents.push(mkCoin((x+len/2)*TS,GY-62,false));return len}
  if(v==='stones'){const len=ri(r,6,9);addSign(L,r,x,n,false);cutPit(L,x,len);
    for(let k=1;k<=len-2;k+=2)L.ents.push(mkPlat(newId(L),'vanish',(x+k)*TS,GY,TS-2,{}));
    L.ents.push(mkCoin((x+len/2)*TS,GY-62,false));return len}
  if(v==='fish'){const len=ri(r,3,5);addSign(L,r,x,n,false);cutPit(L,x,len);L.ents.push(mkFish(x,x+len,{cd:D.v(2.1,1.2),tele:D.v(.7,.46),top:GY-ri(r,72,112)}));return len}
  if(v==='ceil'){const len=ri(r,3,4);addSign(L,r,x,n,false,r()<.6?'اقفز مرتين!\nسهل جداً':null);cutPit(L,x,len);L.ents.push(mkCeil('static',x-1,len+2,{len:210}));return len}
  if(v==='spring'){const len=ri(r,6,7),troll=r()<.6;addSign(L,r,x,n,false,troll?'زنبرك مجاني!\nجرّبه 😇':'زنبرك قفز');cutPit(L,x,len);
    L.ents.push(mkSpring(x-2,{kind:troll?'troll':'help'}));if(troll)L.ents.push(mkCeil('static',x-2,len+3,{len:148}));return len}
 },
 spike(L,r,x,n,D,room){
  const v=pv(r,n,[['static',10,1,4],['hidden',6,3,5],['pulse',6,3,7],['slide',5,4,10],['hog',6,5,8],['sneak',4,6,11],['check',4,6,13],['rainspk',5,7,10]],room,D)||'static';
  if(v==='static'){const len=ri(r,1,n<3?2:3);addSign(L,r,x,n,n<3);L.ents.push(mkSpk('static',x,len));return len}
  if(v==='hidden'){const len=ri(r,2,n>12?4:3);addSign(L,r,x,n,false);L.ents.push(mkSpk('hidden',x,len,{dl:D.v(.3,.1)}));return len}
  if(v==='pulse'){const len=ri(r,2,4),on=D.v(1.05,.8),dn=D.v(1.7,1.2)+len*.1;addSign(L,r,x,n,false);L.ents.push(mkSpk('pulse',x,len,{per:on+dn,on,ph:r()*(on+dn)}));return len}
  if(v==='slide'){const len=2,w=ri(r,5,7);addSign(L,r,x,n,false);L.ents.push(mkSpk('slide',x,len,{rng:[x,x+len+w],sp:D.v(72,135)}));return len+w}
  if(v==='hog'){const w=ri(r,5,6);addSign(L,r,x,n,false);L.ents.push(mkHog(x,x+w,{cd:D.v(1.2,.6),hv:D.v(80,120),jv:D.v(430,500),tele:D.v(.34,.22)}));return w}
  if(v==='sneak'){const len=ri(r,2,3);addSign(L,r,x,n,false);L.ents.push(mkSpk('sneak',x+1,len,{rng:[x,x+len+6],sp:Math.min(150,D.v(90,150)),rad:175}));return len+6}
  if(v==='check'){const safe=n<9?3:2,cnt=3;addSign(L,r,x,n,false);let t=x;for(let i=0;i<cnt;i++){L.ents.push(mkSpk('static',t,2));t+=2+safe}return t-x-safe+0}
  if(v==='rainspk'){const c=ri(r,3,4),g=D.v(.3,.2);addSign(L,r,x,n,false);for(let i=0;i<c;i++)L.ents.push(mkCeil('drop',x+1+i*2,1,{trig:112,warn:g,len:44}));return 2+c*2}
 },
 crumble(L,r,x,n,D,room){
  const v=pv(r,n,[['plain',8,2,8],['trap',3,6,8],['wave',5,5,13],['rev',4,7,12]],room,D)||'plain';
  const mkc=(i,o)=>{L.cr[x+i]=Object.assign({marked:true,s:0,t:0},o||{})};
  if(v==='plain'||v==='trap'){const len=ri(r,3,Math.min(7,3+Math.floor(n/2))),mk=v==='plain'&&(n<8||r()<.25);for(let i=0;i<len;i++)mkc(i,{marked:mk});addSign(L,r,x,n,false);return len}
  if(v==='wave'){const len=ri(r,10,13),sp=Math.min(5,D.v(3.9,4.8));addSign(L,r,x,n,false,r()<.5?'الأرض هون\nمو ثابتة ✨':null);for(let i=0;i<len;i++)mkc(i,{wave:sp,lo:x,hi:x+len-1});
    if(n>=6){const k=ri(r,4,len-5);L.ents.push(mkSpk('static',x+k,ri(r,1,2)))}return len}
  if(v==='rev'){const len=ri(r,9,11),sp=Math.min(5,D.v(3.8,4.8));addSign(L,r,x,n,false);for(let i=0;i<len;i++)mkc(i,{wave:sp,lo:x,hi:x+len-1,rev:1});return len}
 },
 arrow(L,r,x,n,D,room){
  const v=pv(r,n,[['lane',9,2,13],['volley',6,5,14],['rain',5,6,13],['sniper',4,8,14],['rear',4,9,15]],room,D)||'lane', cl=ri(r,8,11);
  if(v==='lane'){addSign(L,r,x,n,false);L.ents.push(mkTur(x+cl+1,{v:'lane',range:(cl+2)*TS,per:D.v(2.3,1.3),spd:D.v(195,300),tele:D.v(.55,.32),hi:n>=6}));return cl+2}
  if(v==='volley'){const cn=ri(r,2,n>12?4:3);addSign(L,r,x,n,false);L.ents.push(mkTur(x+cl+2,{v:'volley',range:(cl+3)*TS,per:D.v(3.6,2.6)+cn*.5,spd:D.v(200,255),tele:D.v(.55,.38),hi:true,n:cn,gapT:D.v(.82,.64)}));return cl+3}
  if(v==='rain'){addSign(L,r,x,n,false);L.ents.push(mkTur(x+cl+1,{v:'rain',range:(cl+2)*TS,per:D.v(2.6,1.7),n:ri(r,3,4),cd0:.5}));return cl+2}
  if(v==='sniper'){addSign(L,r,x,n,false);L.ents.push(mkTur(x+cl+1,{v:'sniper',range:(cl+2)*TS,per:D.v(2.9,2.1),spd:520,tele:D.v(.95,.65),hi:true}));return cl+2}
  if(v==='rear'){addSign(L,r,x,n,false);L.ents.push(mkTur(x-2,{v:'rear',side:1,range:(cl+4)*TS,per:D.v(2.8,1.9),spd:D.v(300,380),tele:D.v(.6,.42),hi:true}));return cl+2}
 },
 crush(L,r,x,n,D,room){
  const v=pv(r,n,[['drop',8,4,16],['thwomp',8,4,12],['double',5,6,17]],room,D)||'drop';
  const cargo=()=>n<6?'anvil':['anvil','piano','fridge','safe','cactus'][ri(r,0,4)];
  if(v==='drop'){const c=ri(r,1,Math.min(3,1+Math.floor(n/6)));addSign(L,r,x,n,false);for(let i=0;i<c;i++)L.ents.push(mkAnv(x+2+i*4,{c:cargo(),warn:D.v(.5,.2),trig:D.v(94,60),v0:D.v(0,450),g:D.v(1800,2300),show:n<9}));return c*4+3}
  if(v==='double'){addSign(L,r,x,n,false);L.ents.push(mkAnv(x+2,{c:cargo(),warn:D.v(.45,.2),trig:D.v(94,64),v0:D.v(0,450),g:2100}));L.ents.push(mkAnv(x+6,{c:cargo(),warn:D.v(.35,.16),trig:D.v(80,58),v0:D.v(0,450),g:2200}));L.ents.push(mkAnv(x+9,{c:cargo(),warn:.2,trig:D.v(70,56),v0:450,g:2300}));return 13}
  if(v==='thwomp'){const c=n>=8&&room>=14&&r()<.5?2:1;addSign(L,r,x,n,false);const wait=D.v(1.7,1.0);for(let i=0;i<c;i++)L.ents.push(mkThw(x+3+i*6,{t0:.9+i*.6,wait,warn:D.v(.4,.3),rest:D.v(.5,.34)}));return c>1?14:8}
 },
 saw(L,r,x,n,D,room){
  const v=pv(r,n,[['floor',8,4,9],['vert',6,5,6],['pend',6,6,10],['orbit',4,7,7],['roll',4,8,11],['hi',3,10,8]],room,D)||'floor';
  if(v==='floor'){const pw=ri(r,5,7);addSign(L,r,x,n,false);L.ents.push(mkSaw('floor',{x0:x*TS+14,x1:(x+pw)*TS-14,x:x*TS+14,sp:D.v(85,140),y:GY-14}));return pw+1}
  if(v==='vert'){const c=n>=11&&room>=9&&r()<.5?2:1;addSign(L,r,x,n,false);for(let i=0;i<c;i++){L.ents.push(mkSaw('vert',{x:(x+2+i*3)*TS+16,y0:GY-96,y1:GY-14,y:GY-96,sp:D.v(110,215),ph:i*Math.PI*.9,r:14}))}return 4+c*3-3+2}
  if(v==='pend'){const c=n>=10&&room>=15&&r()<.5?2:1;addSign(L,r,x,n,false);for(let i=0;i<c;i++)L.ents.push(mkPend(x+4+i*7,{w:D.v(1.6,2.5),ph:r()*6.28,amp:D.v(.44,.5)}));return 8+(c-1)*7}
  if(v==='orbit'){addSign(L,r,x,n,false);const cx=(x+3)*TS+16,cy=GY-58,R=D.v(40,54),w=D.v(1.7,2.7);for(let i=0;i<2;i++)L.ents.push(mkSaw('orbit',{cx,cy,R,x:cx,y:cy,sp:w,ph:i*Math.PI,r:13}));return 7}
  if(v==='roll'){addSign(L,r,x,n,false);const c=n>=12&&room>=13?2:1;for(let i=0;i<c;i++)L.ents.push(mkSaw('roll',{x:(x+9+i*3)*TS,y:GY-15,sp:D.v(170,255),trig:D.v(330,390),r:15}));return 10+c*3-3}
  if(v==='hi'){const pw=ri(r,5,6);addSign(L,r,x,n,false);L.ents.push(mkSaw('hi',{x0:x*TS+14,x1:(x+pw)*TS-14,x:x*TS+14,sp:D.v(90,140),y:GY-78}));return pw+1}
 },
 walk(L,r,x,n,D,room){
  const v=pv(r,n,[['walker',9,2,9],['spiky',5,4,9],['jumper',5,5,10],['charger',5,6,13],['bat',5,6,10]],room,D)||'walker';
  if(v==='walker'){const w=ri(r,5,7),c=n>=8&&r()<.4?2:1;addSign(L,r,x,n,n<3);for(let i=0;i<c;i++)L.ents.push(mkWalk('walker',{x:(x+3+i*2)*TS,x0:(x+1)*TS,x1:(x+w)*TS,sp:D.v(52,95),dir:i%2?1:-1}));return w+1}
  if(v==='spiky'){const w=ri(r,5,6);addSign(L,r,x,n,false);L.ents.push(mkWalk('spiky',{x:(x+3)*TS,x0:(x+1)*TS,x1:(x+w)*TS,sp:D.v(48,88)}));return w+1}
  if(v==='jumper'){const w=ri(r,6,8);addSign(L,r,x,n,false);L.ents.push(mkWalk('jumper',{x:(x+w-1)*TS,x0:(x+1)*TS,x1:(x+w)*TS,jv:D.v(400,470),hv:D.v(70,115),cd:D.v(1.4,.8),tm:.6}));return w+1}
  if(v==='charger'){const w=ri(r,10,12);addSign(L,r,x,n,false);L.ents.push(mkWalk('charger',{x:(x+w)*TS,x0:x*TS,x1:(x+w)*TS,sp:D.v(250,335),trig:D.v(300,360),h:30,w:32}));return w+2}
  if(v==='bat'){addSign(L,r,x,n,false);const cx=(x+4)*TS;L.ents.push(mkWalk('bat',{cx,cy:GY-62,x:cx,y:GY-62,R:D.v(70,115),om:D.v(1.6,2.4),h:20,w:30}));return 9}
 },
 terrain(L,r,x,n,D,room){
  const v=pv(r,n,[['wall',7,5,9],['stair',6,5,11],['tunnel',5,7,12],['highroad',5,6,12]],room,D)||'wall';
  if(v==='wall'){const h=ri(r,1,n>=8?3:2),w=ri(r,1,2);addSign(L,r,x,n,false);for(let i=0;i<w;i++)for(let k=1;k<=h;k++)blk(L,x+2+i,GR-k);
    if(n>=8&&r()<.5)L.ents.push(mkSpk('hidden',x+2+w+1,2,{dl:D.v(.3,.1)}));return 5+w+(n>=8?2:0)}
  if(v==='stair'){const h=ri(r,2,3);addSign(L,r,x,n,false);let t=x+1;for(let s=1;s<=h;s++){for(let k=1;k<=s;k++)blk(L,t,GR-k);t+=2}
    for(let s=h-1;s>=1;s--){for(let k=1;k<=s;k++)blk(L,t,GR-k);t+=2}if(n>=7)L.ents.push(mkSpk('static',x,1));return t-x+1}
  if(v==='tunnel'){const len=ri(r,6,9);addSign(L,r,x,n,false);for(let i=0;i<len;i++){blk(L,x+1+i,GR-3)}
    let t=x+3;while(t<x+len-1){L.ents.push(mkSpk(r()<.5&&n>=9?'hidden':'static',t,1,{dl:.12}));t+=ri(r,3,4)}return len+2}
  if(v==='highroad'){addSign(L,r,x,n,false);const len=6;L.ents.push(mkSpk('static',x+1,len));L.ents.push(mkPlat(newId(L),'static',(x+2)*TS,GY-74,4*TS,{}));L.ents.push(mkCoin((x+4)*TS,GY-100,false));return len+3}
 },
 bait(L,r,x,n,D,room){
  const fx=['anvil','floor','spikes','arrows','ghost','rev','saw'], mins=[5,5,6,7,8,8,9], ok=fx.filter((f,i)=>n>=mins[i]);
  addSign(L,r,x,n,false);L.ents.push(mkCoin((x+2)*TS+16,GY-68,true,ok[ri(r,0,ok.length-1)]));return 6
 },
 coin(L,r,x){for(let i=0;i<3;i++)L.ents.push(mkCoin((x+i+.5)*TS,GY-44,false));return 4}
};
const POOL=[['pit',10,1],['spike',10,1],['crumble',6,2],['arrow',7,2],['walk',7,2],['crush',7,4],['saw',7,4],['terrain',4,5],['bait',4,5],['coin',1,1]];
const NEEDF={pit:14,spike:13,crumble:13,arrow:15,walk:13,crush:17,saw:11,terrain:12,bait:6,coin:4};

/* overlays: a second trap placed over a finished segment (wind / ice / reverse / float zones, extra arrows, bats, ghosts) */
const OVER={
 pit:['wind','arrow','bat'],spike:['ice','wind','arrow','bat','rev','ghost'],crumble:['arrow','bat','wind'],arrow:['ice','wind'],crush:['ghost'],saw:['wind','ghost'],walk:['ice','float'],terrain:['wind','bat']
};
function overlay(L,r,fam,x,used,n,D,prevEnd){
  const list=OVER[fam]; if(!list)return; if(fam==='crumble'&&(D.lastV==='wave'||D.lastV==='rev'))return; const o=list[ri(r,0,list.length-1)];
  if(D.chase&&(o==='ice'||o==='rev'||o==='float'))return;
  if(o==='rev'&&x-prevEnd<7)return;
  if(n<4&&o!=='ice'&&o!=='arrow')return; if((o==='rev'||o==='float'||o==='ghost')&&n<8)return;
  const lead=o==='rev'?4:(o==='ice'||o==='float'?3:1),x0=Math.max(prevEnd,x-lead)*TS,x1=(x+used+1)*TS,dir=(D.chase&&o==='wind')?1:(r()<.5?-1:1);
  const tail=(o==='wind'&&((fam==='pit'&&used>=5)||D.lastV==='sneak'));       // a headwind over a wide pit would make it physically impossible -> tailwind only
  if(o==='ice'||o==='wind'||o==='rev'||o==='float'){ L.zones.push({x0,x1,type:o,dir:tail?1:dir}); L.zoneSigns=(L.zoneSigns||0)+1;
    const txt={ice:'⚠ أرض جليد\nانتبه تزلق',wind:'ريح قوية 💨',rev:'ما في شي غريب\nهون 🙃',float:'جاذبية القمر 🌙'}[o]; if(r()<.8)L.signs.push({tx:x-3,text:txt,tag:'any',lie:o==='rev',seen:false}) }
  else if(o==='arrow'){ L.ents.push(mkTur(x+used+2,{v:'lane',range:(used+6)*TS,per:D.v(2.8,1.7),spd:D.v(190,270),tele:D.v(.6,.4),hi:false,cd0:1.2})) }
  else if(o==='bat'){ const cx=(x+used/2)*TS; L.ents.push(mkWalk('bat',{cx,cy:GY-66,x:cx,y:GY-66,R:Math.max(60,used*TS*.45),om:D.v(1.5,2.2),h:20,w:30})) }
  else if(o==='ghost'){ L.ents.push(mkGhost(0,{zx0:x0-TS*2,zx1:x1+TS*2,sp:D.v(140,175)})) }
}

const LEVEL_NAMES=['تسخين خفيف','هلق بلّش الجد','مهلاً... هذا سهم!','سقف يحبّك','مقلب الأبواب','الصخرة العائلية','عملة بنص مليون','منشار ودود','أرض من ورق','العاشرة: حفلة الموت'];
const EXTRA_NAMES=['قسم الطوارئ','كل شي مسموح... للفخاخ','الرحمة ماتت هون','تذكرة ذهاب فقط','حمّام الدم الخفيف','مرحبا بك في الجحيم الودي','مو ذنبك... بس ذنبك','نزهة عائلية','المكان المناسب للبكاء','مدرسة الألم','يوم عادي في الدنجن','عرض خاص: موت مجاني','اللي يدخل يضيع','حظّ سعيد (ما راح تحتاجه)','تحدّي: لا تموت (مستحيل)','شغل نظيف يا فخاخ','بوفيه مفتوح للموت','المرحلة اللي ما حدا بيحكي عنها','سهلة... مزحة','أنت مين عشان تكمّل؟'];
function buildLevel(n,opt){
  opt=opt||{}; if(isBossLevel(n)&&!FLAGS.noBoss&&!(opt.script||opt.W||opt.D||opt.noBoss))return buildBoss(n,opt);
  const dk=DIFFS[opt.diff]?opt.diff:(DIFFS[S.diff]?S.diff:'crazy'), DF=DIFFS[dk], ne=n<=2?n:n+DF.sh;     // ne = the level number the CONTENT behaves like
  const salt=opt.salt!=null?opt.salt:(BADSALT[dk+':'+n]||0), r=mulberry32(n*7919+1337+salt*104729+(dk==='normal'?0:dk==='crazy'?9091:18181)), D=mkD(ne); if(opt.D)Object.assign(D,opt.D);
  if(ne>=3){D.combo=clamp(D.combo+DF.combo,0,.95);D.gap=Math.max(1.2,D.gap-DF.gap)}
  const W=opt.W||(n===1?80:n===2?84:clamp(66+6*n,84,138));
  const L={n,dk,ne,lie:DF.lie,w:W,D,df:clamp(D.f,0,1),ground:new Array(W).fill(GR),cr:{},blocks:{},ents:[],zones:[],signs:[],pits:[],torches:[],theme:Math.floor((n-1)/5)%THEMES.length,crDelay:lerp(.36,.23,clamp(D.f,0,1)),exitTx:W-5,spawnTx:2,eid:0};
  const chaseKind=n>=6&&n%3===0?['boulder','wall','wheel'][(n/3-2)%3|0]:null; D.chase=!!chaseKind;
  const pool=POOL.filter(p=>ne>=p[2]&&!(D.chase&&p[0]==='bait')&&!(D.chase&&p[0]==='crush'));
  const script=opt.script||(n===1?[['pit','plain'],['spike','static'],['pit','wide'],['spike','static'],['pit','plain']]:n===2?[['crumble','plain'],['spike','static'],['walk','walker'],['arrow','lane'],['pit','wide'],['spike','hidden']]:null);
  let x=8,guard=0,endX=8,trail=0,prev='',sinceCp=0,sinceOv=9,si=0,lastCpTx=-99,hist=[];
  const PITT={pit:1};
  while(guard++<90){
    let fam=null,force=null;
    if(script&&si<script.length){fam=script[si][0];force=script[si][1];si++}
    else if(opt.script&&opt.script.length)break;
    else{ for(let k=0;k<10;k++){let t=pickW(pool.map(p=>[p[0],p[1]*(hist.slice(-2).includes(p[0])?.35:1)]),r); if(x+NEEDF[t]<=W-14){fam=t;break}} }
    if(!fam||x+8>W-12)break;
    const minGap=trail>0?Math.max(7-trail,3):(PITT[fam]?4:(prev==='spike'?3:2));
    x=Math.max(x,endX+minGap);
    const room=W-14-x; if(room<4)break;
    D.force=force; D.room=room;
    const used=FAM[fam](L,r,x,ne,D,room); D.force=null; (L.segs=L.segs||[]).push([fam,x,used]);
    if(!used){x=endX+3;continue}
    if(!script&&!opt.script&&n>=3&&r()<D.combo&&sinceOv>=1&&fam!=='coin'&&fam!=='bait'){overlay(L,r,fam,x,used,ne,D,endX);sinceOv=0}else sinceOv++;
    prev=fam;hist.push(fam);endX=x+used;trail=0;for(let i=endX-1;i>=0&&L.ground[i]<0;i--)trail++;
    let g=Math.round(D.gap)+ri(r,0,2);
    sinceCp+=used+g;
    if(ne>=5&&sinceCp>=DF.cp&&endX+14<W-12&&!opt.script){g=Math.max(g,10);const cx=endX+3;if(L.ground[cx]>=0&&!L.cr[cx]){L.ents.push(mkCp(cx));lastCpTx=cx;sinceCp=0}}
    if(DF.troll&&!opt.script&&!L.fakeCp&&ne>=(dk==='hell'?4:6)&&sinceCp>=14&&sinceCp<DF.cp-6&&endX+16<W-12&&r()<.4){      // flag that looks exactly like a checkpoint but saves nothing
      const cx=endX+3; if(L.ground[cx]>=0&&!L.cr[cx]&&L.ground[cx+1]>=0&&!(L.pits.some(p=>cx>=p[0]-1&&cx<=p[0]+p[1]))){const e=mkCp(cx);e.fake=1;L.ents.push(e);L.fakeCp=1;g=Math.max(g,7)} }
    x=endX+Math.max(2,g);
  }
  if(ne>=4&&r()<.8&&!opt.script){L.ents.push(mkFake(W-12,ne>=10&&(ne%2===0||ne>=16)))}
  if(DF.troll&&!opt.script){
    // the exit door runs away when you get close, and pops spikes where it stood
    if(ne>=(dk==='hell'?4:6)&&r()<(dk==='hell'?.8:.5))L.ents.push({t:'exitrun',x:0,s:0,always:1});
    // lights go out for a moment before a trap segment
    const sg=(L.segs||[]).filter((q,i)=>i>=2&&q[0]!=='coin'&&q[0]!=='bait'&&q[1]>24), nb=ne>=(dk==='hell'?4:7)?DF.troll:0;
    L.dark=[]; for(let i=0;i<nb&&sg.length;i++){const q=sg.splice(ri(r,0,sg.length-1),1)[0]; L.dark.push({x0:(q[1]-9)*TS,x1:(q[1]+q[2])*TS,dur:dk==='hell'?2.7:1.9,fired:0})}
  }
  if(chaseKind){const sp=Math.min(176,D.v(112,160)+(n>30?8:0));L.chase=chaseKind;const e=mkChase(chaseKind,sp,chaseKind==='wall'?-60:-140);e.go=6*TS;L.ents.push(e)}
  for(let t=4;t<W;t+=10)L.torches.push(t);
  L.name=n<=LEVEL_NAMES.length?LEVEL_NAMES[n-1]:EXTRA_NAMES[(n*7+3)%EXTRA_NAMES.length];
  L.cpList=L.ents.filter(e=>e.t==='cp').map(e=>e.x);
  return L;
}
