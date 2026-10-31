/* =============== DAILY + WEEKLY CHALLENGES (local, no server, no ads) ===============
   Every day 3 small tasks (easy / medium / hard) and every week 3 bigger ones; the pick comes from the date (the same for everybody on the same day) and is stored the moment the day starts,
   so progress can never jump around. A finished task pays its coins at once (toast, like a medal) and finishing all 3 pays a bonus.
   State: S.dy = {d:dayNumber, t:[{k,n,r,c?}], p:{kind:progress}, c:{kind:1 paid}, a:1 bonus paid} and S.wk = same with w:weekNumber.
   Nothing here touches physics: dayEv() only counts what already happened (die / clear / coins / jumps / abilities / time) and never runs in the solver or in editor / shared maps.
   Dates are read from the device clock; it is a cosmetic goal, not anti-cheat. */
const DY_REW={d:[10,18,30],w:[40,70,120]}, DY_BONUS={d:15,w:50};
const DY_CAUSES=['spike','arrow','saw','pit','crumble','fire','boulder','monster','crush','ghost','wall','fakedoor','zap','laser','bait','ceilspike'];
const DY_POOL=[
 {k:'coin', ic:'🪙',tx:n=>'احفظ '+n+' عملة بعلم الحفظ أو بنهاية المرحلة', d:[12,25,45],   w:[70,140,240]},
 {k:'clear',ic:'🚩',tx:n=>'خلّص '+n+(n===1?' مرحلة':' مراحل'),            d:[1,2,4],      w:[6,12,20]},
 {k:'clean',ic:'🧼',tx:n=>'خلّص '+n+(n===1?' مرحلة':' مراحل')+' بدون ولا موتة', d:[1,2,3], w:[3,6,10]},
 {k:'die',  ic:'💀',tx:n=>'مُت '+n+' مرة (بالقصد أو بدون)',              d:[8,15,25],    w:[40,80,140]},
 {k:'cause',ic:'🎯',tx:(n,c)=>'مُت بـ«'+(CAUSE_NM[c]||c)+'» '+n+' مرات',   d:[2,3,5],      w:[6,10,16]},
 {k:'jump', ic:'🦘',tx:n=>'اقفز '+n+' مرة',                                d:[120,250,450],w:[800,1500,2500]},
 {k:'time', ic:'⏱',tx:n=>'العب '+n+' دقيقة',                              d:[4,8,15],     w:[30,60,100]},
 {k:'ab',   ic:'✨',tx:n=>'استعمل قدرة البطل '+n+' مرة',                   d:[6,12,24],    w:[40,80,150]},
 {k:'star', ic:'⭐',tx:n=>'اكسب '+n+' نجمة جديدة',                          d:[1,2,3],      w:[3,6,10], ok:()=>starsTotal()<Math.max(3,Object.keys(S.cl).length*3)},
];
const DY_BY={}; for(const p of DY_POOL)DY_BY[p.k]=p;
if(!S.dy||typeof S.dy!=='object')S.dy={d:-1,t:[],p:{},c:{},a:0};
if(!S.wk||typeof S.wk!=='object')S.wk={w:-1,t:[],p:{},c:{},a:0};

const DAY_MS=86400000, dyNow=()=>{ const d=new Date(); return d.getTime()-d.getTimezoneOffset()*60000 };       // "local clock" in ms
const dayNum=()=>Math.floor(dyNow()/DAY_MS), weekNum=()=>Math.floor((dayNum()-2)/7);                             // weeks start on Saturday (1 Jan 1970 was a Thursday)
function dyRng(seed){ let a=(seed^0x9e3779b9)>>>0; return ()=>{ a=(a+0x6D2B79F5)>>>0; let t=a; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296 } }
function dyGen(seed,key){                                       // 3 different kinds, tier 0..2 = easy..hard
  const R=dyRng(seed), pool=DY_POOL.filter(p=>!p.ok||p.ok());
  for(let i=pool.length-1;i>0;i--){ const j=Math.floor(R()*(i+1)); const t=pool[i]; pool[i]=pool[j]; pool[j]=t }
  return pool.slice(0,3).map((p,i)=>{ const o={k:p.k,n:p[key][i],r:DY_REW[key][i]}; if(p.k==='cause')o.c=DY_CAUSES[Math.floor(R()*DY_CAUSES.length)]; return o });
}
function dayRoll(){                                             // start a new day / week when the date changed
  const d=dayNum(), w=weekNum();
  if(S.dy.d!==d||!Array.isArray(S.dy.t)||!S.dy.t.length){ S.dy={d,t:dyGen(d*7919+11,'d'),p:{},c:{},a:0}; save() }
  if(S.wk.w!==w||!Array.isArray(S.wk.t)||!S.wk.t.length){ S.wk={w,t:dyGen(w*104729+3,'w'),p:{},c:{},a:0}; save() }
}
const dyTasks=()=>{ dayRoll(); return {d:S.dy,w:S.wk} };
function dyLeft(key){                                           // text: time left until the set renews
  const now=dyNow(), end=key==='d'?(dayNum()+1)*DAY_MS:(weekNum()*7+2+7)*DAY_MS, m=Math.max(1,Math.ceil((end-now)/60000)), h=Math.floor(m/60);
  return h>=48?Math.floor(h/24)+' أيام':h>=1?h+' ساعة':m+' دقيقة';
}
function dyPay(set,key,t){
  const tasks=set.t; let got=t.r, extra='';
  if(!set.a&&tasks.every(x=>set.c[x.k])){ set.a=1; got+=DY_BONUS[key]; extra='  🎁 خلّصت الكل: +'+DY_BONUS[key] }
  S.wallet+=got; save(); hud(); if(ACHUI.open)achRender();
  econToast('🎯 تحدّي '+(key==='d'?'اليوم':'الأسبوع')+' تمّ! +'+t.r+' 🪙'+extra);
  Snd.coin&&Snd.coin(); if(extra&&Snd.win)Snd.win();
}
function dayEv(kind,n,x){                                       // something happened: count it for the matching tasks
  if(SIM||G.custom||!(n>0))return; dayRoll(); let any=false;
  for(const [key,set] of [['d',S.dy],['w',S.wk]]){
    for(const t of set.t){
      if(t.k!==kind||set.c[t.k])continue; if(t.c&&t.c!==x)continue;
      set.p[t.k]=(set.p[t.k]||0)+n; any=true;
      if(set.p[t.k]>=t.n){ set.c[t.k]=1; dyPay(set,key,t) }
    }
  }
  if(any&&kind!=='time'&&kind!=='jump')save();
}
let dyAcc=0;
function dayTick(dt){ dyAcc+=dt; if(dyAcc>=1){ const m=dyAcc/60; dyAcc=0; dayEv('time',m) } }

/* ---- the screen: two blocks at the top of the achievements list ---- */
function dyRow(set,key,t){
  const p=DY_BY[t.k], done=!!set.c[t.k], v=Math.min(t.n,set.p[t.k]||0);
  const row=el('div','acr dyr'+(done?' done':'')), top=el('div','acrt');
  top.append(el('span','ic',p.ic),el('b','nm',p.tx(t.n,t.c)),el('span','dyrw',done?'✓':'🪙 +'+t.r));
  const bar=el('div','bar'), fill=el('div','fill'); fill.style.width=(done?100:clamp(v/t.n,0,1)*100)+'%'; fill.style.background=done?'#7dff9a':(key==='d'?'#4dc3ff':'#ffd23f'); bar.appendChild(fill);
  const num=el('div','num',done?'تمّ':ltr((t.k==='time'?Math.floor(v*10)/10:Math.floor(v))+' / '+t.n));
  row.append(top,bar,num); return row;
}
function dayRender(L2){
  const {d,w}=dyTasks();
  for(const [key,set,ttl] of [['d',d,'🌅 تحدّيات اليوم'],['w',w,'📅 تحدّيات الأسبوع']]){
    const left=set.t.filter(t=>!set.c[t.k]).length, hd=el('div','dyh');
    hd.append(el('b',null,ttl),el('span','sub',left?'باقي '+left+' · بيتجدّدوا بعد '+dyLeft(key):'✓ خلّصت الكل · بيتجدّدوا بعد '+dyLeft(key)),el('span','sub','🎁 +'+DY_BONUS[key]+' للكل'));
    L2.appendChild(hd); set.t.forEach((t,i)=>{ const r=dyRow(set,key,t); if(i===set.t.length-1&&set.t.length%2)r.style.gridColumn='1/-1'; L2.appendChild(r) });
  }
}
dayRoll();
