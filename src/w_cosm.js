/* =============== DEATH EFFECTS + HELPER ITEMS ===============
   Death effects: pure cosmetics. A burst of particles at the moment you die (never in the solver); bought with coins, or opened for free by the death museum (discover N different deaths).
     State: S.dfx = the effect worn ('' = none), S.aq['d:<key>'] = owned.
   Helper items: one-shot consumables for the REAL levels only (never trials, editor or shared maps). Buy them, "arm" them in the shop, and the next real level you enter uses them up.
     A level played with a helper is a helped level: it still counts as cleared (you move on) but it pays no no-death bonus, no mastery star and no "clean" challenge, so nobody can buy stars.
     State: S.hi = {n:{key:count}, arm:{key:1}}; during a level G.help = {key:1}, G.helped = true. The effects are a shield for one hit and a ⚠ overlay (information only); the solver never sees them (hOn() is false in SIM). */
const DFX=[
 {k:'confetti',nm:'قصاصات حفلة', ic:'🎉',price:40, rar:'r'},
 {k:'hearts',  nm:'قلوب طايرة',  ic:'💗',price:50, rar:'r'},
 {k:'bubbles', nm:'فقاعات',      ic:'🫧',price:60, rar:'r'},
 {k:'skulls',  nm:'جماجم',       ic:'💀',mus:8,    rar:'r'},
 {k:'coins',   nm:'مطر الذهب',   ic:'🪙',price:100,rar:'e'},
 {k:'rainbow', nm:'قوس قزح',     ic:'🌈',mus:15,   rar:'e'},
 {k:'ghosts',  nm:'أشباح طايرة', ic:'👻',mus:22,   rar:'e'},
];
const dfxItem=k=>DFX.find(d=>d.k===k)||null;
const dfxOwn=k=>!!S.aq['d:'+k];
if(typeof S.dfx!=='string')S.dfx='';
const HELP=[
 {k:'shield',nm:'درع حفظ',   ic:'🛡',price:30,ds:'بيبلع ضربة وحدة بالمرحلة (إلا الحفر والأرض اللي بتتفتّت)'},
 {k:'eye',   nm:'عين الفخاخ',ic:'👁',price:25,ds:'علامة ⚠ فوق الفخاخ القريبة طول المرحلة'},
];
const HELP_MAX=9;
if(!S.hi||typeof S.hi!=='object')S.hi={n:{},arm:{}}; S.hi.n=S.hi.n||{}; S.hi.arm=S.hi.arm||{};
const helpN=k=>S.hi.n[k]|0;

/* ---------- death effect: spawned once from die() ---------- */
function deathFx(){
  if(SIM||!S.dfx||!dfxOwn(S.dfx)||!P)return; const r=Math.random, x=P.x+PW/2, y=P.y+PH*.55, add=o=>{ if(parts.length<260)parts.push(Object.assign({life:1.6,max:1.6,g:0,vx:0,vy:0,s:3,col:'#fff',sh:'c',rot:0,vr:0},o)) };
  const pick=a=>a[(r()*a.length)|0];
  switch(S.dfx){
    case 'confetti': for(let i=0;i<40;i++)add({x,y,vx:(r()-.5)*300,vy:-(60+r()*260),g:430,life:1.3+r()*1,max:2,s:3+r()*3.5,col:pick(['#ff4d5e','#ffd23f','#35d07f','#4dc3ff','#b37cff','#ff9a3d']),sh:'r',rot:r()*6,vr:(r()-.5)*18}); break;
    case 'hearts':   for(let i=0;i<16;i++)add({x:x+(r()-.5)*16,y,vx:(r()-.5)*70,vy:-(40+r()*90),g:-8,life:1.5+r()*.9,max:2.2,s:3.2+r()*2.6,col:pick(['#ff5c8a','#ff9ac0','#ff3d6e']),sh:'h'}); break;
    case 'bubbles':  for(let i=0;i<20;i++)add({x:x+(r()-.5)*20,y:y+(r()-.5)*14,vx:(r()-.5)*40,vy:-(20+r()*70),g:-12,life:1.5+r()*1,max:2.3,s:3+r()*5,col:pick(['#bfeaff','#7fd0ff','#e6f7ff']),sh:'b'}); break;
    case 'coins':    for(let i=0;i<16;i++)add({x:x+(r()-.5)*70,y:y-50-r()*30,vx:(r()-.5)*40,vy:20+r()*60,g:300,life:1.5+r()*.8,max:2.2,s:5+r()*2,sh:'e',ch:'🪙',rot:0,vr:(r()-.5)*6}); break;
    case 'skulls':   for(let i=0;i<9;i++)add({x,y,vx:(r()-.5)*200,vy:-(100+r()*240),g:520,life:1.4+r()*.8,max:2.1,s:4.5+r()*2,sh:'e',ch:'💀',rot:0,vr:(r()-.5)*9}); break;
    case 'rainbow':  { const C=['#ff3d3d','#ff9a3d','#ffd23f','#35d07f','#4dc3ff','#6b5cff','#c75cff']; for(let i=0;i<7;i++)for(let j=0;j<6;j++){ const a=-Math.PI*(.1+.8*(j/5)), sp=130+i*14; add({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,g:260,life:1.1+r()*.5,max:1.8,s:2.6,col:C[i],sh:'c'}) } } break;
    case 'ghosts':   for(let i=0;i<6;i++)add({x:x+(r()-.5)*40,y,vx:(r()-.5)*36,vy:-(34+r()*40),g:-4,life:2+r()*.8,max:3,s:6.5+r()*2,sh:'e',ch:'👻',rot:0,vr:0}); break;
  }
}

/* ---------- helpers: used by the engine ---------- */
function helpApply(){                                   // a real level has just been entered: use up what is armed
  if(!legit())return; const used=[];
  for(const h of HELP){ if(S.hi.arm[h.k]&&helpN(h.k)>0){ S.hi.n[h.k]--; if(!S.hi.n[h.k])S.hi.arm[h.k]=0; (G.help||(G.help={}))[h.k]=1; G.helped=true; used.push(h) } }
  if(used.length){ save(); say('🎒 '+used.map(h=>h.ic+' '+h.nm).join(' + ')+' — بدون نجمة الإتقان بهالمرحلة','any',3.6) }
}
function helpShieldHit(){                               // called from heroGuard(): true = the helper shield swallowed this hit
  if(!G.help||!(G.help.shield>0))return false; G.help.shield--; return true;
}

/* ---------- shop: death effects (inside the "shared" mode) + helper items (their own mode) ---------- */
function accDfxCard(D){
  const own=dfxOwn(D.k), on=S.dfx===D.k&&own, card=accCard(on?' sel':'',D.rar);
  card.append(el('div','shbig',D.ic),el('div','nm',D.nm));
  if(own)card.append(el('div','sub',D.mus?'من المتحف 🏛':'اشتريته'),el('button','btn',on?'✓ لابسه':'ألبسه',()=>{ S.dfx=on?'':D.k; save(); Snd.ui&&Snd.ui(); shopRender() }));
  else if(D.mus){ const have=museumCount(), ok=have>=D.mus;
    card.append(el('div','sub','🏛 مُت بـ '+D.mus+' أنواع مختلفة ('+have+' عندك)'),el('button','btn'+(ok?'':' poor'),ok?'استلم 🎁':'🔒 لسا',()=>{
      if(!ok){ Snd.bonk&&Snd.bonk(); shopMsg('ناقصك '+(D.mus-have)+' نوع موت من المتحف'); return }
      S.aq['d:'+D.k]=1; S.dfx=D.k; save(); Snd.coin(); Snd.win(); shopMsg('استلمت «'+D.nm+'» من المتحف 🎉'); shopRender() })) }
  else{ const poor=S.wallet<D.price; card.append(el('div','sub','تأثير موت'),el('button','btn'+(poor?' poor':''),'اشترِ 🪙 '+D.price+(poor?'  (ناقصك '+(D.price-S.wallet)+')':''),()=>{
      const r=accBuy('d:'+D.k,D.price); if(r==='ok'){ S.dfx=D.k; save(); Snd.coin(); Snd.win(); shopMsg('اشتريت «'+D.nm+'» 🎉 — بتشوفه لما تموت'); shopRender() } else if(r==='poor'){ Snd.bonk&&Snd.bonk(); shopMsg('ناقصك '+(D.price-S.wallet)+' 🪙') } })) }
  return card;
}
function accDfxMode(g){
  const list=DFX.filter(D=>rarOk(D.rar)), none=rarOk('c'); if(!list.length&&!none)return;
  const hd=el('div','achd'); hd.append(el('b',null,'تأثير الموت'),el('span','sub','بيطلع لما تموت — بس المنظر'));
  g.appendChild(hd);
  if(none){ const c0=accCard(!S.dfx?' sel':'','c'); c0.append(el('div','shbig','🚫'),el('div','nm','بدون تأثير'),el('div','sub','عادي'),el('button','btn',!S.dfx?'✓ مختار':'اختر',()=>{ S.dfx=''; save(); Snd.ui&&Snd.ui(); shopMsg(''); shopRender() })); g.appendChild(c0) }
  for(const D of list)g.appendChild(accDfxCard(D));
}
function accHelpMode(g){
  const hd=el('div','achd'); hd.append(el('b',null,'مساعدات (مرة وحدة)'),el('span','sub','بالمراحل العادية بس · المرحلة اللي بتستعملها فيها بتنحسب خلصانة بس بدون نجمة الإتقان ولا بونص "بدون موت"'));
  g.appendChild(hd);
  for(const h of HELP){ const n=helpN(h.k), armed=!!S.hi.arm[h.k]&&n>0, card=el('div','shc'+(armed?' sel':'')), poor=S.wallet<h.price;
    card.append(el('div','shbig',h.ic),el('div','nm',h.nm),el('div','sub',h.ds),el('div','sub','عندك: '+n));
    card.appendChild(el('button','btn'+((poor||n>=HELP_MAX)?' poor':''),n>=HELP_MAX?'مليان':'اشترِ 🪙 '+h.price+(poor?'  (ناقصك '+(h.price-S.wallet)+')':''),()=>{
      if(n>=HELP_MAX){ shopMsg('أقصى مخزون '+HELP_MAX); return } if(S.wallet<h.price){ Snd.bonk&&Snd.bonk(); shopMsg('ناقصك '+(h.price-S.wallet)+' 🪙'); return }
      S.wallet-=h.price; S.hi.n[h.k]=n+1; save(); hud(); Snd.coin(); shopMsg('اشتريت «'+h.nm+'»'); shopRender() }));
    if(n>0)card.appendChild(el('button','btn'+(armed?'':' alt'),armed?'✓ مجهّز للمرحلة الجاية':'جهّزه للمرحلة الجاية',()=>{ S.hi.arm[h.k]=armed?0:1; save(); Snd.ui&&Snd.ui(); shopRender() }));
    g.appendChild(card) }
}
