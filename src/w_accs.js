/* =============== ACCESSORY SHOP: rarity, sets, shared items, trails ===============
   Everything here is cosmetic: no ability, physics, hit-box or level is touched, and custom / shared maps look exactly the same for everybody.
   - rarity: عادي (free, unlocks with the hero's upgrade stage) / نادر (coins) / أسطوري (coins or a challenge)
   - hero pieces: set 1 is the stage-unlocked one (w_acc.js), more sets come from ACCX; wearing a whole set gives a small glow in the set's colour
   - shared pieces (any hero): trails behind the runner (drawn with particles, no pictures)
   State: S.aq = {key:1} for everything bought ('cat:h:2' hero piece, 't:fire' trail); S.hq[id][slot] = set worn (0 = off); S.trail = the trail worn ('' = none) */
const RAR={c:{nm:'عادي',col:'#9fb0c8'},r:{nm:'نادر',col:'#4dc3ff'},e:{nm:'أسطوري',col:'#ffd23f'}};
S.aq=S.aq||{}; if(typeof S.trail!=='string')S.trail='';
SHOP.am=SHOP.am||'hero'; SHOP.rf=SHOP.rf||'all';

function accBuy(key,price){
  if(S.aq[key])return 'owned'; if(S.wallet<price)return 'poor';
  S.wallet-=price; S.aq[key]=1; save(); hud(); return 'ok';
}

/* ---------- trails ---------- */
const TRAILS=[
 {k:'stars',  nm:'غبار نجوم', ic:'✨',price:50, rar:'r',cols:['#ffd23f','#fff3b0','#ffb347']},
 {k:'hearts', nm:'قلوب',      ic:'💗',price:50, rar:'r',cols:['#ff5c8a','#ff9ac0','#ff3d6e']},
 {k:'bubbles',nm:'فقاعات',    ic:'🫧',price:70, rar:'r',cols:['#bfeaff','#7fd0ff','#e6f7ff']},
 {k:'fire',   nm:'نار',       ic:'🔥',price:100,rar:'e',cols:['#ff6b35','#ffb81f','#ff3d2e']},
 {k:'party',  nm:'حفلة',      ic:'🎉',price:140,rar:'e',cols:['#ff4d5e','#ffd23f','#35d07f','#4dc3ff','#b37cff']},
];
const trailOwned=k=>!!S.aq['t:'+k];
let trAcc=0;
function trailTick(dt){                                    // called every frame from update(): spawns cosmetic particles behind the runner, never in the solver
  if(SIM||!S.trail||G.state!=='play'||!P||P.dead)return; const T=TRAILS.find(t=>t.k===S.trail); if(!T||!trailOwned(T.k))return;
  if(!(Math.abs(P.vx)>25||!P.onGround))return; trAcc+=dt; const step=T.k==='fire'?.03:.05;
  while(trAcc>=step){ trAcc-=step; if(parts.length<240)trailSpawn(T) }
  if(trAcc>.2)trAcc=0;
}
function trailSpawn(T){
  const r=Math.random, f=P.face, bx=P.x+PW/2-f*7+(r()-.5)*5, col=T.cols[(r()*T.cols.length)|0], up=r()<.5;
  const mk=o=>parts.push(Object.assign({life:.8,max:.8,g:0,vx:0,vy:0,s:3,col,sh:'c'},o));
  switch(T.k){
    case 'stars':  mk({x:bx,y:P.y+PH*(.45+r()*.5),vx:-f*(15+r()*35)+(r()-.5)*20,vy:(r()-.6)*40,g:30,life:.55+r()*.4,max:.9,s:2.2+r()*2.4,sh:'t',rot:r()*6,vr:(r()-.5)*8}); break;
    case 'hearts': mk({x:bx,y:P.y+PH*(.35+r()*.4),vx:(r()-.5)*24-f*8,vy:-(34+r()*30),life:.9+r()*.4,max:1.3,s:2.6+r()*2,sh:'h'}); break;
    case 'bubbles':mk({x:bx,y:P.y+PH*(.5+r()*.45),vx:(r()-.5)*18-f*6,vy:-(20+r()*26),g:-14,life:1+r()*.5,max:1.5,s:2.5+r()*3.5,sh:'b'}); break;
    case 'fire':   mk({x:bx,y:P.y+PH*(.8+r()*.2),vx:-f*(10+r()*40)+(r()-.5)*16,vy:-(26+r()*44),g:-50,life:.3+r()*.25,max:.55,s:2.2+r()*2.6,sh:'c'}); break;
    default:       mk({x:bx,y:P.y+PH*(.3+r()*.6),vx:-f*(20+r()*50)+(r()-.5)*30,vy:(r()-.7)*50,g:200,life:.7+r()*.35,max:1.05,s:2.6+r()*2,sh:'r',rot:r()*6,vr:(r()-.5)*16});
  }
}

/* ---------- shop tab: «إكسسوارات» ---------- */
const rarOk=r=>SHOP.rf==='all'||SHOP.rf===r;
const rarBadge=r=>el('span','rar '+r,RAR[r].nm);
function accCard(cls,rar){ const c=el('div','shc'+cls); c.appendChild(rarBadge(rar)); return c }
function accRender(g){
  const bar=el('div','acchips');
  for(const [m,t] of [['hero','🧢 قطع البطل'],['shared','✨ مشترك (كل الأبطال)']])bar.appendChild(el('button','ch'+(SHOP.am===m?' on':''),t,()=>{ SHOP.am=m; shopRender() }));
  bar.appendChild(el('span','sep','│'));
  for(const [r,t] of [['all','الكل'],['c','عادي'],['r','نادر'],['e','أسطوري']])bar.appendChild(el('button','ch rf'+(SHOP.rf===r?' on':''),t,()=>{ SHOP.rf=r; shopRender() }));
  g.appendChild(bar);
  if(SHOP.am==='hero')accHeroMode(g); else accSharedMode(g);
}
function accHeroMode(g){
  const owned=HERO_IDS.filter(heroOwned); if(!SHOP.hero||!heroOwned(SHOP.hero))SHOP.hero=heroOwned(S.hero)?S.hero:owned[0];
  const id=SHOP.hero, st=heroStage(id), row=el('div','acchips');
  for(const h of owned)row.appendChild(el('button','ch'+(h===id?' on':''),HEROES[h].name,()=>{ SHOP.hero=h; shopRender() }));
  g.appendChild(row);
  const sl={h:'فوق الراس',n:'الرقبة',b:'الظهر',a:'هالة وميض'}, nSets=accSetMax(id), full=accSetFull(id);
  let shown=0;
  for(let s=1;s<=nSets;s++){
    const cards=[];
    for(const slot of ['h','n','b']){ const it=accItem(id,slot,s); if(it&&rarOk(ACC_SETRAR[s]))cards.push(accHeroCard(id,st,it,sl[slot])) }
    if(s===1&&rarOk('e'))cards.push(accAuraCard(id,st,sl.a));
    if(!cards.length)continue; shown++;
    const hd=el('div','achd'); hd.append(el('b',null,'الطقم '+ACC_SETNM[s]),rarBadge(ACC_SETRAR[s]));
    if(full===s)hd.appendChild(el('span','full','✓ طقم كامل: هالة بلون الطقم'));
    g.appendChild(hd); for(const c of cards)g.appendChild(c);
  }
  if(!shown)g.appendChild(el('div','edhint','ما في قطع بهالفئة لهالبطل'));
}
function accPreview(id,slot,set){
  const cv2=document.createElement('canvas'); cv2.width=208; cv2.height=200;       // drawn at 2x so it stays sharp on phones; each slot is zoomed to where the piece sits
  const cx=cv2.getContext('2d'), Z={h:[1.75,152],n:[1.7,104],b:[1.15,90],a:[1.25,94]}[slot]; cx.scale(2,2); cx.translate(52,Z[1]); cx.scale(Z[0],Z[0]);
  try{ heroThumb(cx,id,{only:slot,force:true,set}) }catch(e){} return cv2;
}
function accHeroCard(id,st,it,subTxt){
  const own=accOwn(id,it.slot,it.set), un=own&&st>=it.need, on=accSel(id,it.slot)===it.set, card=accCard((un&&on?' sel':'')+(un?'':' lock'),ACC_SETRAR[it.set]);
  card.append(accPreview(id,it.slot,it.set),el('div','nm',it.nm),el('div','sub',subTxt));
  if(!own){ const poor=S.wallet<it.price, need=st<it.need;
    card.appendChild(el('button','btn'+((poor||need)?' poor':''),'اشترِ 🪙 '+it.price+(poor?'  (ناقصك '+(it.price-S.wallet)+')':''),()=>{
      if(need){ shopMsg('لازم المرحلة '+ROMAN[it.need]+' ('+STAGE_NM[it.need]+') أول'); Snd.bonk&&Snd.bonk(); return }
      const r=accBuy(id+':'+it.slot+':'+it.set,it.price); if(r==='ok'){ const q=S.hq[id]||(S.hq[id]={}); q[it.slot]=it.set; save(); Snd.coin(); Snd.win(); shopMsg('اشتريت «'+it.nm+'» 🎉'); shopRender() } else if(r==='poor'){ Snd.bonk&&Snd.bonk(); shopMsg('ناقصك '+(it.price-S.wallet)+' 🪙') } })) }
  else if(un)card.appendChild(el('button','btn',on?'✓ لابسه':'ألبسه',()=>{ const q=S.hq[id]||(S.hq[id]={}); q[it.slot]=on?0:it.set; save(); Snd.ui&&Snd.ui(); shopRender() }));
  else card.appendChild(el('div','sub','🔒 بتنفتح بالمرحلة '+ROMAN[it.need]+' ('+STAGE_NM[it.need]+')'));
  return card;
}
function accAuraCard(id,st,subTxt){
  const un=st>=3, on=accOn(id,'a'), card=accCard((un&&on?' sel':'')+(un?'':' lock'),'e');
  card.append(accPreview(id,'a',1),el('div','nm','هالة '+HEROES[id].name),el('div','sub',subTxt));
  if(un)card.appendChild(el('button','btn',on?'✓ لابسه':'ألبسه',()=>{ const q=S.hq[id]||(S.hq[id]={}); q.a=on?0:1; save(); Snd.ui&&Snd.ui(); shopRender() }));
  else card.appendChild(el('div','sub','🔒 بتنفتح بالمرحلة '+ROMAN[3]+' ('+STAGE_NM[3]+')'));
  return card;
}
function accSharedMode(g){
  const hd=el('div','achd'); hd.append(el('b',null,'أثر وراه'),el('span','sub','بيمشي مع أي بطل — بس المنظر، ما بيأثر على اللعب'));
  const cards=[];
  if(rarOk('c')){ const none=accCard(!S.trail?' sel':'','c'); none.append(el('div','shbig','🚫'),el('div','nm','بدون أثر'),el('div','sub','عادي'),el('button','btn',!S.trail?'✓ مختار':'اختر',()=>{ S.trail=''; save(); Snd.ui&&Snd.ui(); shopRender() })); cards.push(none) }
  for(const T of TRAILS){ if(!rarOk(T.rar))continue; const own=trailOwned(T.k), on=S.trail===T.k, card=accCard(on?' sel':'',T.rar);
    card.append(el('div','shbig',T.ic),el('div','nm',T.nm));
    if(own)card.append(el('div','sub','اشتريته'),el('button','btn',on?'✓ لابسه':'ألبسه',()=>{ S.trail=on?'':T.k; save(); Snd.ui&&Snd.ui(); shopRender() }));
    else{ const poor=S.wallet<T.price; card.append(el('div','sub','أثر'),el('button','btn'+(poor?' poor':''),'اشترِ 🪙 '+T.price+(poor?'  (ناقصك '+(T.price-S.wallet)+')':''),()=>{
      const r=accBuy('t:'+T.k,T.price); if(r==='ok'){ S.trail=T.k; save(); Snd.coin(); Snd.win(); shopMsg('اشتريت أثر «'+T.nm+'» 🎉 — جرّبه بالمرحلة'); shopRender() } else if(r==='poor'){ Snd.bonk&&Snd.bonk(); shopMsg('ناقصك '+(T.price-S.wallet)+' 🪙') } })) }
    cards.push(card) }
  if(!cards.length){ g.appendChild(el('div','edhint','ما في قطع بهالفئة')); return }
  g.appendChild(hd); for(const c of cards)g.appendChild(c);
}
