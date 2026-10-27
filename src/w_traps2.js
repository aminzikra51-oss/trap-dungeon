/* =============== TRAPS v2 — ten new families (plus belt / mud floors) ===============
   Same rules as the old ones: plain data entities + a behaviour table B[t] (upd / hit / draw / draw3), so snapshots stay JSON and the offline planner can solve them.
   Each one kills in its own way (see DEATH_MAP in draw_death.js).
   chest  : treasure chest that bites (mimic)           mole  : mound that follows you underground and pops up with a mallet
   elev   : "VIP" lift that does not stop at your floor  frog  : tongue at body height
   fire   : floor jets in a rhythm                       storm : cloud that zaps you if you stand still
   elec   : electrified floor tiles that blink first     laser : rotating beam on a post
   train  : minecart train with a horn warning           belt / mud : floor zones (conveyor / glue) */
const DEATH_SFX={};
Object.assign(Snd,{
 zap(){ this.noise({ft:'highpass',f0:4200,dur:.34,v:.3}); this.tone({t:'sawtooth',f0:1900,f1:110,dur:.42,v:.17}); for(let i=0;i<5;i++)this.tone({t:'square',f0:2400+i*310,f1:700,dur:.035,v:.07,d:i*.06}) },
 sizzle(){ this.noise({ft:'bandpass',f0:3200,f1:1100,dur:.9,v:.2,q:.8}); this.tone({t:'sine',f0:180,f1:70,dur:.7,v:.18}) },
 flame(){ this.noise({f0:1100,f1:260,dur:.7,v:.2}); this.tone({t:'sawtooth',f0:90,f1:60,dur:.6,v:.06}) },
 chomp(){ for(let i=0;i<2;i++){ this.tone({t:'triangle',f0:340,f1:80,dur:.12,v:.34,d:i*.17}); this.noise({f0:900,f1:200,dur:.09,v:.2,d:i*.17}) } },
 horn(){ this.tone({t:'sawtooth',f0:233,dur:.85,v:.13}); this.tone({t:'sawtooth',f0:311,dur:.85,v:.11}) },
 laserhit(){ this.tone({t:'sawtooth',f0:1500,f1:240,dur:.3,v:.16}); this.noise({ft:'highpass',f0:2500,dur:.2,v:.12}) },
 slurp(){ this.tone({t:'sine',f0:900,f1:180,dur:.3,v:.22}); this.tone({t:'square',f0:500,f1:140,dur:.2,v:.05,d:.1}) },
 thump(){ this.tone({t:'sine',f0:130,f1:48,dur:.22,v:.4}); this.noise({f0:400,f1:70,dur:.2,v:.22}) },
 hum(){ this.tone({t:'sine',f0:300,f1:520,dur:.5,v:.08}) }
});
Object.assign(DEATH_SFX,{
 fire(){Snd.sizzle();Snd.whistle()}, zap(){Snd.zap()}, disco(){Snd.zap();Snd.tlaugh()}, laser(){Snd.laserhit();Snd.splat()},
 train(){Snd.bonk();Snd.splat();Snd.horn()}, mole(){Snd.thump();Snd.boing()}, chest(){Snd.chomp()}, frog(){Snd.slurp();Snd.squeak()}, ceilspike(){Snd.squeak();Snd.bonk()}
});
MOCKT.mimic=1; MOCKT.frog=1;
Object.assign(DEATH_LINES,{
 fire:[['ههههه! شو هالشوّي؟ إنت اليوم طبق اليوم!','sy'],['ريحة شاورما... وين الخبز؟','lb'],['صرت فحمة! خلّي حدا يجيب الكبّة','ps'],['النار قالتلك: على مهلك يا حبيبي','sy'],['كبّاس! أكلة مشوية بالفخ','eg'],['الله يعينك... متحمّر من برّا بس!','any']],
 zap:[['البرق ما بيتعب منك! صعقة صعقة','sy'],['كهربا مجانية! بس ما حدا طلبها','lb'],['شعرك وقف... كان لازم تفكّر قبل!','ps'],['الغيمة قالتلك: ما تقف مكانك!','sy'],['إيش ده؟ صعقة كهربائية؟ يا لهوي!','eg'],['الله يرحم الكهربا... بس هي ما رحمتك','any']],
 disco:[['رقصت على الكهربا! نمرة ٩ من ١٠','sy'],['الأرض كلها كهربا يا حبيبي!','lb'],['كنت عم ترقص ولا تتصعق؟ ما بنعرف','ps'],['ديسكو بلا تذكرة! الله يعطيك العافية','any'],['كل البلاطات مشحونة إلا اللي وقفت عليها','sy']],
 laser:[['اتقسمت نصّين! شو عملت يا عيني؟','sy'],['الليزر ما بيفرّق: نص الك ونص للأرض','lb'],['قطعة من هون وقطعة من هناك','ps'],['الشعاع الأحمر كان مكتوب عليه: لا تلمس','any'],['اتقطّعت زي الجبنة بالسكين','eg']],
 train:[['القطار زمّر ثلاث مرات... وإنت ما سمعت!','sy'],['صرت ورقة! ورقة رفيعة خالص','lb'],['القطار مش واقف على أحد يا حبيبي','ps'],['اتفرش على القضبان زي الصاج!','eg'],['تشوو تشوو! وانتهت الرحلة','any']],
 mole:[['الخلد قالك: تفضّل... وأطلقك للسما! 🚀','sy'],['قبّعتك وصلت القمر بس إنت لسا نازل','lb'],['كان تحتك من بدري وما حسيت!','ps'],['مطرقة وطيران! عرض مجاني','sy'],['الخلد أقوى منك يا بطل','any']],
 chest:[['قلتلك الصندوق مش آمن... ما قلتلك؟','sy'],['الصندوق جعان! إنت الوجبة','lb'],['كل الكنوز ببطن الصندوق... وإنت كمان','ps'],['ما كنت متوقع إنو ينقلب عليك؟','any'],['صندوق بأسنان؟ هذا مش عادي','eg']],
 frog:[['الضفدع حبّك! بس بطريقته','sy'],['لسانه أسرع من إنك تقول يا ضفدع','lb'],['وجبة سريعة بدون انتظار','ps'],['اتبلعت وما رجعت! دقة عالدوا','sy'],['كان جعان من الصبح والله','any']],
 ceilspike:[['المصعد قالك: شو بدك ببقيّة الطوابق؟','sy'],['علّقت بالسقف زي الثريّا!','lb'],['اللافتة قالت VIP... وصرت VIP على السقف','ps'],['تنزّل وإلا بدك تقعد هناك؟','any'],['طلّع المصعد... وما نزّل أحد','sy']]
});

/* ---------------- floor zones: belt (conveyor) and mud (glue) are handled in updatePlayer / drawZones ---------------- */

/* ---------------- mimic chest ---------------- */
function mkMimic(tx,o){o=o||{};return{t:'mimic',x:tx*TS,w:30,h:24,y:GY-24,x0:(o.x0!=null?o.x0:tx-3)*TS,x1:(o.x1!=null?o.x1:tx+3)*TS,vx:0,vy:0,dir:-1,st:0,tm:0,trig:o.trig||86,tele:o.tele||.6,lv:o.lv||250,jv:o.jv||360,cd:o.cd||1}}
B.mimic={
 upd(e,dt){
  const mx=e.x+e.w/2;
  if(e.st===0){ if(Math.abs(pcx()-mx)<e.trig&&P.y+PH>GY-70){e.st=1;e.tm=e.tele;e.dir=pcx()>mx?1:-1;snick(e,'نياااام')} }
  else if(e.st===1){ e.tm-=dt; e.dir=pcx()>mx?1:-1; if(e.tm<=0){e.st=2;e.vx=e.dir*e.lv;e.vy=-e.jv;Snd.whoosh()} }
  else if(e.st===2){ e.vy+=1500*dt; e.x=clamp(e.x+e.vx*dt,e.x0,e.x1); e.y+=e.vy*dt; if(e.y>=GY-e.h){e.y=GY-e.h;e.vx=0;e.vy=0;e.st=3;e.tm=.9;Snd.land();puff(e.x+e.w/2,GY,5)} }
  else if(e.st===3){ e.tm-=dt; if(e.tm<=0){e.st=4;e.tm=e.cd} }
  else { e.tm-=dt; if(e.tm<=0)e.st=0 }
 },
 hit(e){ if(e.st===2||(e.st===3&&e.tm>.7))return hitRect(prect(),{x:e.x+2,y:e.y+3,w:e.w-4,h:e.h-3})?'chest':null; return null },
 draw(e,c,th){ flatBox(c,e.x,e.y,e.w,e.h,'#8b5a2b',e.st>=1?'angry':'sly') }
};

/* ---------------- mole ---------------- */
function mkMole(tx0,tx1,o){o=o||{};return{t:'mole',x:(tx0+tx1)/2*TS,x0:tx0*TS,x1:tx1*TS,st:0,tm:0,sp:o.sp||150,tele:o.tele||.5,rng:o.rng||320,vis:0,cdn:0,dir:1}}
B.mole={
 upd(e,dt){
  const cx=pcx(), inR=cx>e.x0-40&&cx<e.x1+40&&Math.abs(cx-e.x)<e.rng;
  if(e.st===0){ e.vis=Math.max(0,e.vis-dt*3); e.cdn-=dt; if(inR&&e.cdn<=0&&P.onGround)e.st=1 }
  else if(e.st===1){ e.vis=Math.min(1,e.vis+dt*5); const d=clamp(cx,e.x0,e.x1)-e.x; e.x+=clamp(d,-e.sp*dt,e.sp*dt); e.dir=d>=0?1:-1;
    if(Math.abs(cx-e.x)<16&&P.onGround){e.st=2;e.tm=e.tele;snick(e,'هيهي');Snd.rumble()} else if(!inR)e.st=0 }
  else if(e.st===2){ e.tm-=dt; if(e.tm<=0){e.st=3;e.tm=.85;e.dir=pcx()>=e.x?1:-1;Snd.thump();puff(e.x,GY,8,'#8a6a45')} }
  else { e.tm-=dt; if(e.tm<=0){e.st=0;e.cdn=1.2;e.tm=0} }
 },
 hit(e){ if(e.st===3&&e.tm>.4)return hitRect(prect(),{x:e.x-24,y:GY-42,w:48,h:42})?'mole':null; return null },
 draw(e,c,th){ if(e.vis>.02||e.st>=2)flatBox(c,e.x-14,GY-16*(e.st===3?2:e.vis),28,16*(e.st===3?2:e.vis),'#7a5a3a',e.st===3?'laugh':null) }
};

/* ---------------- frog: a tongue at body height ---------------- */
function mkFrog(tx,o){o=o||{};return{t:'frog',x:tx*TS+16,dir:-1,st:0,tm:o.cd0||.9,reach:o.reach||150,tele:o.tele||.6,cd:o.cd||1.5,tl:0,sp:o.sp||640}}
B.frog={
 upd(e,dt){
  const d=pcx()-e.x;
  if(e.st===0){ e.dir=d>=0?1:-1; e.tm-=dt; if(e.tm<=0&&Math.abs(d)<e.reach+90&&P.y+PH>GY-70){e.st=1;e.tm=e.tele;snick(e,'بربر')} }
  else if(e.st===1){ e.tm-=dt; if(e.tm<=0){e.st=2;e.tl=0;Snd.whoosh()} }
  else if(e.st===2){ e.tl+=e.sp*dt; if(e.tl>=e.reach){e.tl=e.reach;e.st=3;e.tm=.12} }
  else if(e.st===3){ e.tm-=dt; if(e.tm<=0)e.st=4 }
  else { e.tl-=e.sp*.7*dt; if(e.tl<=0){e.tl=0;e.st=0;e.tm=e.cd} }
 },
 hit(e){ if(e.st<2||e.tl<10)return null; const x0=e.dir>0?e.x+14:e.x-14-e.tl; return hitRect(prect(),{x:x0,y:GY-27,w:e.tl,h:13})?'frog':null },
 draw(e,c,th){ flatBox(c,e.x-17,GY-24,34,24,'#4caf50','sly'); if(e.tl>0){c.fillStyle='#ff7a9a';c.fillRect(e.dir>0?e.x+14:e.x-14-e.tl,GY-23,e.tl,6)} }
};

/* ---------------- fire jets ---------------- */
function mkJet(tx,o){o=o||{};return{t:'jet',x:tx*TS,per:o.per||2.6,warn:o.warn||.6,on:o.on||.75,h:o.h||160,tm:o.ph||0,f:0,w:0,lf:0}}
B.jet={
 upd(e,dt){ e.tm+=dt; const k=e.tm%e.per, w0=e.per-e.warn-e.on, f0=w0+e.warn; let f=0;
   if(k>=f0){ f=Math.min(1,(k-f0)/.14); if(k>e.per-.14)f=Math.max(0,(e.per-k)/.14) }
   e.f=f; e.w=(k>=w0&&k<f0)?1:0; const lit=f>.2?1:0; if(lit&&!e.lf&&Math.abs(pcx()-e.x)<520)Snd.flame(); e.lf=lit },
 hit(e){ if(e.f<.4)return null; const hh=e.h*e.f; return hitRect(prect(),{x:e.x+5,y:GY-hh,w:TS-10,h:hh})?'fire':null },
 draw(e,c,th){ drawJet(e,c) }
};

/* ---------------- storm cloud: stand still and it zaps you ---------------- */
function mkCloud(x0,x1,o){o=o||{};return{t:'cloud',x:x0,x0,x1,y:76,st:0,tm:0,sp:o.sp||150,lim:o.lim||1,tele:o.tele||.55,still:0,lx:0,cd:0}}
B.cloud={
 upd(e,dt){
  const cx=pcx(); if(e.st===0&&!(cx>e.x0&&cx<e.x1))return;
  if(e.st===0){ e.x+=clamp(cx-e.x,-e.sp*dt,e.sp*dt); const still=P.onGround&&Math.abs(P.vx)<22; e.still=still?e.still+dt:Math.max(0,e.still-dt*2); e.cd-=dt;
    if(e.still>e.lim&&e.cd<=0){e.st=1;e.tm=e.tele;e.lx=cx;Snd.rumble();snick(e,'⚡')} }
  else if(e.st===1){ e.x+=clamp(e.lx-e.x,-e.sp*1.6*dt,e.sp*1.6*dt); e.tm-=dt; if(e.tm<=0){e.st=2;e.tm=.32;Snd.zap();G.shake=Math.max(G.shake,5)} }
  else { e.tm-=dt; if(e.tm<=0){e.st=0;e.still=0;e.cd=1.2} }
 },
 hit(e){ if(e.st===2&&e.tm>.14)return hitRect(prect(),{x:e.lx-17,y:0,w:34,h:GY})?'zap':null; return null },
 draw(e,c,th){ drawCloud(e,c) }
};

/* ---------------- electric floor: tiles blink yellow, then charge ---------------- */
function mkElec(tx,len,o){o=o||{};return{t:'elec',x:tx*TS,n:len,per:o.per||2.4,warn:o.warn||.75,on:o.on||1.05,seed:o.seed||1,dens:o.dens||2,tm:o.tm||0,ax:0}}
function elecState(e,i){ const k=Math.floor(e.tm/e.per), s=e.tm-k*e.per; if(((i*7+k*3+e.seed)%5)>=e.dens)return 0; return s<e.warn?1:(s<e.warn+e.on?2:0) }
B.elec={
 upd(e,dt){ e.tm+=dt; e.ax=pcx(); e.ay=GY-26 },
 hit(e){ const pr=prect(); if(pr.y+pr.h<GY-8)return null; const a=Math.max(0,Math.floor((pr.x-e.x)/TS)),b=Math.min(e.n-1,Math.floor((pr.x+pr.w-e.x)/TS));
   for(let i=a;i<=b;i++)if(elecState(e,i)===2&&hitRect(pr,{x:e.x+i*TS+3,y:GY-8,w:TS-6,h:10}))return 'disco'; return null },
 draw(e,c,th){ drawElec(e,c) }
};

/* ---------------- rotating laser beam ---------------- */
function mkBeam(tx,o){o=o||{};return{t:'beam',x:tx*TS+16,y:GY-(o.py||48),R:o.R||84,a:o.a0||0,w:o.w||1.9,ph:0}}
B.beam={
 upd(e,dt){ e.a+=e.w*dt; e.ph+=dt },
 hit(e){ const pr=prect(),ca=Math.cos(e.a),sa=Math.sin(e.a); for(let r=-e.R;r<=e.R;r+=7){ const x=e.x+ca*r,y=e.y+sa*r; if(x>pr.x-3&&x<pr.x+pr.w+3&&y>pr.y-3&&y<pr.y+pr.h+3)return 'laser' } return null },
 draw(e,c,th){ drawBeam(e,c) }
};

/* ---------------- minecart train with a horn warning ---------------- */
function mkTrain(x0,x1,o){o=o||{};return{t:'train',x:x0*TS,x0:x0*TS,x1:x1*TS,per:o.per||3.4,warn:o.warn||.95,sp:o.sp||560,tm:o.ph||1,dir:1,st:0,w:196,h:38}}
B.train={
 upd(e,dt){
  const cx=pcx();
  if(e.st===0){ if(!(cx>e.x0-260&&cx<e.x1+260))return; e.tm-=dt; if(e.tm<=0){e.st=1;e.tm=e.warn;e.dir=rf()<.5?-1:1;Snd.horn();snick(e,'تشو تشو')} }
  else if(e.st===1){ e.tm-=dt; e.x=e.dir>0?e.x0-e.w:e.x1; if(e.tm<=0)e.st=2 }
  else { e.x+=e.dir*e.sp*dt; if((e.dir>0&&e.x>e.x1)||(e.dir<0&&e.x<e.x0-e.w)){e.st=0;e.tm=Math.max(.5,e.per-e.warn-1.1);e.x=e.x0} }
 },
 hit(e){ return e.st===2&&hitRect(prect(),{x:e.x+2,y:GY-e.h,w:e.w-4,h:e.h})?'train':null },
 draw(e,c,th){ drawTrain(e,c) }
};

/* ---------------- level generation ---------------- */
const sgn=(L,r,x,n,intro,lie,truth)=>{ if(r()>.75||x-3<5)return; const li=!intro&&n>=3&&r()<(L.lie||.5); L.signs.push({tx:x-3,text:li?lie:truth,tag:'any',lie:li,seen:false}) };
const subFam=(L,r,x,n,D,room,list)=>{ const a=list.filter(f=>n>=f[1]).map(f=>f[0]); if(!a.length)return 0; return FAM[a[ri(r,0,a.length-1)]](L,r,x,n,D,room)||0 };
Object.assign(FAM,{
 chest(L,r,x,n,D,room){
  const w=ri(r,9,11),cx=x+ri(r,4,5); sgn(L,r,x,n,n<9,'صندوق كنز مجاني!\nخذه، ما بيعضّ 😇','صندوق كنز 💰\n(مو مرتاح له)');
  L.ents.push(mkMimic(cx,{x0:x+1,x1:x+w-2,trig:D.v(80,100),tele:D.v(.72,.46),lv:D.v(230,275),jv:D.v(350,400)}));
  for(let i=0;i<3;i++)L.ents.push(mkCoin((cx+.5)*TS+(i-1)*24,GY-62-(i===1?10:0),false));
  return w+1 },
 mole(L,r,x,n,D,room){
  const w=ri(r,11,13); sgn(L,r,x,n,n<10,'الأرض هون\nمستقرة تماماً','شي بيتحرك\nتحت الأرض...');
  L.ents.push(mkMole(x+1,x+w-1,{sp:D.v(150,235),tele:D.v(.5,.34)}));
  L.ents.push(mkSpk('static',x+4,1)); L.ents.push(mkSpk('static',x+8,ri(r,1,2)));
  return w+1 },
 elev(L,r,x,n,D,room){
  const tx=x+1,Yw=(GR-6)*TS,sp=D.v(66,84),win=D.v(1.15,.65),Ytip=Yw-25-sp*win;
  sgn(L,r,x,n,n<9,'مصعد VIP ✨\nآمن 100%','مصعد... ما بيعرف\nيوقف عند طابقك');
  for(let i=0;i<2;i++)for(let k=1;k<=6;k++)blk(L,tx+3+i,GR-k);
  const sp2=mkCeil('static',tx,3,{len:Ytip-14}); sp2.cause='ceilspike'; L.ents.push(sp2);
  L.ents.push(mkPlat(newId(L),'elev',tx*TS,GY-12,3*TS,{y0:GY-12,y1:Ytip+22,sp,st:0,tm:0}));
  L.ents.push(mkCoin((tx+4)*TS,Yw-40,false));
  return 8 },
 frog(L,r,x,n,D,room){
  const w=ri(r,9,11),fx=x+ri(r,4,6); sgn(L,r,x,n,n<10,'ضفدع ظريف 🐸\nبحب الضيوف','ضفدع جوعان\nلسانه طويل');
  L.ents.push(mkFrog(fx,{reach:D.v(138,176),tele:D.v(.66,.42),cd:D.v(1.5,.9)})); L.ents.push(mkCoin((fx+.5)*TS,GY-52,false));
  return w+1 },
 fire(L,r,x,n,D,room){
  const c=n>=13?4:3,per=D.v(2.7,2.1),warn=D.v(.62,.44),on=D.v(.72,.95); sgn(L,r,x,n,n<10,'حرارة لطيفة 🌤','فتحات حرارة\nبإيقاع');
  for(let i=0;i<c;i++)L.ents.push(mkJet(x+2+i*3,{per,warn,on,h:ri(r,150,170),ph:i*per/c+r()*.2}));
  return 3+c*3 },
 storm(L,r,x,n,D,room){
  const used=subFam(L,r,x,n,D,room,[['spike',1],['saw',4],['walk',2],['crush',4]]); if(!used)return 0;
  sgn(L,r,x,n,n<11,'طقس مشمس ☀\nما في غيوم','غيمة عصبية\nما توقف مكانك');
  L.ents.push(mkCloud((x-4)*TS,(x+used+3)*TS,{sp:D.v(120,185),lim:D.v(1.1,.7),tele:D.v(.66,.46)})); return used },
 elec(L,r,x,n,D,room){
  const len=ri(r,8,10); sgn(L,r,x,n,n<11,'أرض مريحة\nللأقدام ⚡','بلاطات بتتشحن...\nانتبه للأصفر');
  L.ents.push(mkElec(x+1,len,{per:D.v(2.4,1.95),warn:D.v(.82,.58),on:D.v(1.0,1.2),dens:n>=14?3:2,seed:ri(r,0,4),tm:ri(r,0,9)*.2})); return len+2 },
 laser(L,r,x,n,D,room){
  const c=n>=16&&room>=24?2:1; sgn(L,r,x,n,n<12,'منارة ديكور\nلا تلمسها','شعاع يدور\nبكل اتجاه');
  for(let i=0;i<c;i++)L.ents.push(mkBeam(x+5+i*10,{py:ri(r,38,58),R:ri(r,80,90),w:D.v(1.5,2.3)*(r()<.5?-1:1),a0:r()*6.28}));
  return 11+(c-1)*10 },
 train(L,r,x,n,D,room){
  const w=ri(r,12,14); sgn(L,r,x,n,n<12,'محطة قطار\nمهجورة 🚉','أصغِ للزمّور...');
  L.ents.push(mkTrain(x+1,x+w-1,{per:D.v(3.7,2.8),warn:D.v(1.05,.78),sp:D.v(520,640),ph:ri(r,8,14)*.1})); return w+1 }
});
Object.assign(NEEDF,{chest:12,mole:14,elev:11,frog:12,fire:13,storm:15,elec:12,laser:14,train:14});
POOL.push(['chest',5,6],['mole',5,7],['elev',4,7],['frog',5,8],['fire',5,8],['storm',5,9],['elec',5,9],['laser',4,10],['train',4,11]);
const NOCHASE=new Set(['bait','crush','chest','mole','elev','frog','fire','storm','elec','laser','train']);   // chase levels keep to the classic traps (you can not wait for anything)
