/* =============== STATS + ACHIEVEMENTS ===============
   Local-first. S.st holds lifetime counters (never reset by "new game"); S.ac[id] = how many tiers of that achievement were already paid.
   A tier pays its coins ONCE (the tier index is stored, so replaying can never pay it again) and gives a title the player can wear.
   Nothing here touches physics: it only listens (die / clear / coins / editor) and draws UI. Custom (editor) maps never count except the two editor medals. */
S.st=S.st||{};
{ const D={d:S.deaths||0,dc:{},j:0,pt:0,c:S.wallet||0,ns:0,nm:0,bw:0,gr:0,fa:0,mk:{},sk:{}}; for(const k in D)if(S.st[k]==null)S.st[k]=D[k] }
S.ac=S.ac||{}; S.ti=S.ti||'';

const TIER_NM=['برونزي','فضي','ذهبي','ماسي'], TIER_IC=['🥉','🥈','🥇','💎'], TIER_COL=['#cd7f32','#c3cbda','#ffd23f','#7fe3ff'], TIER_COINS=[5,12,30,80];
const starsOf=n=>S.cl[n]?1+(S.nd[n]?1:0)+(S.cs[n]?1:0):0;
const starsTotal=()=>{ let t=0; for(const k in S.cl)t+=starsOf(+k); return t };
const worldsReached=()=>Math.min(WORLD_ORDER.length,Math.floor((Math.max(1,S.best)-1)/5)+1);
const museumCauses=()=>Object.keys(DEATH_MAP);
const museumCount=()=>museumCauses().filter(c=>S.st.dc[c]>0).length;

/* id, icon, name, tiers (thresholds), titles per tier, value(), description(n) */
const ACH=[
 {id:'die',  ic:'💀',nm:'مدرسة الموت',      T:[10,50,200,1000],  ti:['طالب موت','خرّيج موت','أستاذ موت','عميد كلية الموت'],     v:()=>S.st.d,                         ds:n=>'مُت '+n+' مرة'},
 {id:'run',  ic:'🧭',nm:'المغامر',           T:[5,20,50,80],      ti:['مغامر مبتدئ','مغامر','قائد الزنزانة','ملك الزنزانة'],     v:()=>Object.keys(S.cl).length,       ds:n=>'خلّص '+n+' مرحلة مختلفة'},
 {id:'world',ic:'🌍',nm:'سائح العوالم',      T:[3,6,10,16],       ti:['سائح','رحّالة','كاشف عوالم','سيّد العوالم'],             v:worldsReached,                      ds:n=>'وصّل لـ '+n+' عالم'},
 {id:'clean',ic:'🧼',nm:'بدون ولا موتة',     T:[1,5,15,40],       ti:['حظ المبتدئين','نضيف','ما بيموت','شبح الزنزانة'],         v:()=>Object.keys(S.nd).length,       ds:n=>'خلّص '+n+' مرحلة بدون أي موتة'},
 {id:'strk', ic:'🔥',nm:'على نار',           T:[2,4,7,12],        ti:['سخنت','ماشي حاله','على نار','ما حدا بوقّفه'],            v:()=>S.st.nm,                        ds:n=>'خلّص '+n+' مراحل جديدة ورا بعض بدون موت'},
 {id:'coin', ic:'🪙',nm:'جامع العملات',      T:[50,200,600,1500], ti:['جيبه مثقوب','تاجر صغير','صرّاف','قارون الزنزانة'],         v:()=>S.st.c,                         ds:n=>'احفظ '+n+' عملة'},
 {id:'star', ic:'⭐',nm:'نجّام',             T:[10,40,100,200],   ti:['نجمة صغيرة','سماء مرصّعة','مجرّة','ملك النجوم'],           v:starsTotal,                         ds:n=>'اجمع '+n+' نجمة من الخريطة'},
 {id:'mus',  ic:'🏛',nm:'متحف الموت',        T:[5,10,16,22],      ti:['زائر المتحف','هاوي','أمين المتحف','جرّبت كل الميتات'],    v:museumCount,                        ds:n=>'مُت بـ '+n+' نوع مختلف من الفخاخ'},
 {id:'boss', ic:'👑',nm:'قاتل الزعماء',      T:[1,3,5,8],         ti:['كسرت زعيم','قاهر الزعماء','سفّاح الزعماء','رعب الزعماء'], v:()=>S.st.bw,                        ds:n=>'اهزم '+n+' زعيم'},
 {id:'grit', ic:'🪨',nm:'العنيد',            T:[1,3,8,20],        ti:['عنيد','راس يابس','ما بيستسلم','حجر الصوان'],             v:()=>S.st.gr,                        ds:n=>'خلّص '+n+' مرحلة بعد ما مُتّ فيها 10 مرات أو أكتر'},
 {id:'fast', ic:'💨',nm:'ما لحقت تشوف',      T:[3,10,30,80],      ti:['سريع','برق','سبق الفخ','أسرع ميّت بالتاريخ'],             v:()=>S.st.fa,                        ds:n=>'مُت خلال ثانيتين من بداية المحاولة '+n+' مرة'},
 {id:'pit',  ic:'🕳',nm:'حبيب الحفر',        T:[5,25,80,250],     ti:['زائر الحفر','ساكن الحفر','أخ الحفر','ملك الحفر'],         v:()=>(S.st.dc.pit||0)+(S.st.dc.crumble||0), ds:n=>'وقع بالحفر أو مع الأرض اللي بتتفتت '+n+' مرة'},
 {id:'hero', ic:'🦸',nm:'جامع الأبطال',      T:[2,4,6,8],         ti:['ثنائي','فرقة','جيش','كل الشلّة'],                        v:()=>Object.keys(S.own).length,      ds:n=>'امتلك '+n+' أبطال'},
 {id:'trl', ic:'🎯',nm:'سيّد التحدّيات',   T:[1,3,5,8],         ti:['جرّبت حظّك','متمرّس','نخبة التحدّيات','بطل الأبطال'],      v:()=>Object.keys(S.tr||{}).length,   ds:n=>'خلّص '+n+' تحدّي أبطال'},
 {id:'hup', ic:'⬆',nm:'المطوّر',           T:[1,5,12,24],       ti:['مطوّر','معلّم','خبير تطوير','أسطورة التطوير'],            v:()=>Object.values(S.hs||{}).reduce((a,b)=>a+b,0), ds:n=>'ارفع أبطالك '+n+' مرحلة تطوير'},
 {id:'jump', ic:'🦘',nm:'نطّاط',             T:[100,1000,5000,20000],ti:['نطّاط','كنغر','ما بيحطّ','بيمشي على الهوا'],          v:()=>S.st.j,                         ds:n=>'اقفز '+n+' مرة'},
 {id:'time', ic:'⏱',nm:'ساكن الزنزانة',     T:[10,60,180,600],   ti:['ضيف','زبون','مدمن','ساكن دائم'],                         v:()=>Math.floor(S.st.pt/60),         ds:n=>'العب '+n+' دقيقة'},
 {id:'edit', ic:'🛠',nm:'مهندس الفخاخ',      T:[1,3,8,20],        ti:['مهندس مبتدئ','مصمّم','مبدع','أستاذ الفخاخ'],             v:()=>Object.keys(S.st.mk).length,    ds:n=>'خلّص '+n+' خريطة من المحرّر'},
 {id:'shr',  ic:'📤',nm:'ناشر الفخاخ',       T:[1,3,10,25],       ti:['ناشر','مشهور','نجم','مؤثّر الفخاخ'],                     v:()=>Object.keys(S.st.sk).length,    ds:n=>'شارك '+n+' خريطة'},
];
const ACH_BY={}; for(const a of ACH)ACH_BY[a.id]=a;
const RANKS=[[0,'ضيف على الزنزانة'],[3,'ميّت مبتدئ'],[8,'ميّت متمرّس'],[16,'خبير فخاخ'],[28,'ناجي بالصدفة'],[42,'أسطورة الحفر'],[56,'ملك الميتين'],[ACH.length*4,'حبيبي الخالد']];
const medalsTotal=()=>ACH.reduce((s,a)=>s+Math.min(a.T.length,S.ac[a.id]|0),0);
const rankName=()=>{ const m=medalsTotal(); let r=RANKS[0][1]; for(const x of RANKS)if(m>=x[0])r=x[1]; return r };
const titleText=()=>{ if(S.ti){ const [id,k]=S.ti.split(':'), a=ACH_BY[id]; if(a&&(S.ac[id]|0)>+k)return a.ti[+k] } return rankName() };
const ltr=t=>'\u2066'+t+'\u2069';                                  // keep '60 / 200' in reading order inside RTL text
function hash32(str){ let h=2166136261; for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)} return (h>>>0).toString(36) }

/* ---- events ---- */
function achDie(cause){
  if(SIM||G.custom)return; const st=S.st;
  st.d++; st.dc[cause]=(st.dc[cause]||0)+1; st.ns=0; if(G.t<2)st.fa++;
  dayEv('die',1); dayEv('cause',1,cause);
  achCheck();
}
function achMapCleared(code){ if(SIM||!code)return; const k=hash32(code); if(!S.st.mk[k]){ S.st.mk[k]=1; save() } achCheck() }
function achMapShared(code){ if(SIM||!code)return; const k=hash32(code); if(!S.st.sk[k]){ S.st.sk[k]=1; save() } achCheck() }
const ACQ=[]; let acBusy=false;
function achNext(){
  const t=$('achT'); if(!t||!ACQ.length){ acBusy=false; return } acBusy=true; const q=ACQ.shift();
  t.innerHTML=''; t.className='k'+q.k; const i=el('span','ic',q.a.ic), b=el('span','tx'); b.append(el('b',null,'إنجاز: '+q.a.nm+' · '+TIER_NM[q.k]+' '+TIER_IC[q.k]),el('i',null,'لقب جديد «'+q.a.ti[q.k]+'» · +'+TIER_COINS[q.k]+' 🪙'));
  t.append(i,b); t.style.animation='none'; void t.offsetWidth; t.style.animation='achin 3.2s ease-out forwards';
  Snd.coin&&Snd.coin(); setTimeout(achNext,3300);
}
function achCheck(){
  if(SIM)return; let any=false;
  for(const a of ACH){
    const v=a.v(), have=S.ac[a.id]|0; let t=have; while(t<a.T.length&&v>=a.T[t])t++;
    if(t>have){ for(let k=have;k<t;k++){ S.wallet+=TIER_COINS[k]; if(!ACHUI.open)ACQ.push({a,k}) } S.ac[a.id]=t; any=true }
  }
  if(any){ save(); hud(); if(!acBusy&&ACQ.length)achNext(); if(ACHUI.open)achRender() }
}

/* ---- the screen ---- */
const ACHUI={open:false};
function achRow(a){
  const have=Math.min(a.T.length,S.ac[a.id]|0), v=a.v(), done=have>=a.T.length, nxt=done?a.T[a.T.length-1]:a.T[have], prev=have>0?a.T[have-1]:0;
  const row=el('div','acr'+(done?' done':'')), top=el('div','acrt'), pips=el('div','pips');
  for(let k=0;k<a.T.length;k++){ const p=el('span','pip'+(k<have?' on':''),TIER_IC[k]); p.title=TIER_NM[k]+' — '+a.ds(a.T[k])+' (+'+TIER_COINS[k]+' 🪙)'; pips.appendChild(p) }
  top.append(el('span','ic',a.ic),el('b','nm',a.nm),pips);
  const ds=el('div','ds',done?'✓ '+a.ds(a.T[a.T.length-1]):a.ds(nxt)+'  →  '+TIER_NM[have]+' '+TIER_IC[have]+'  +'+TIER_COINS[have]+' 🪙');
  const bar=el('div','bar'), fill=el('div','fill'); fill.style.width=(done?100:clamp((v-prev)/(nxt-prev),0,1)*100)+'%'; fill.style.background=TIER_COL[Math.min(have,3)]; bar.appendChild(fill);
  const num=el('div','num',done?String(v):ltr(Math.min(v,nxt)+' / '+nxt));
  row.append(top,ds,bar,num);
  if(have>0){ const tl=el('div','tl'); for(let k=0;k<have;k++){ const on=S.ti===a.id+':'+k, b=el('button','ch'+(on?' on':''),(on?'✓ ':'')+a.ti[k],()=>{ S.ti=on?'':a.id+':'+k; save(); Snd.ui&&Snd.ui(); achRender() }); tl.appendChild(b) } row.appendChild(tl) }
  return row;
}
function achRender(){
  $('acW').textContent='🪙 '+S.wallet;
  const m=medalsTotal(), tot=ACH.length*4, sum=$('acSum'); sum.innerHTML='';
  sum.append(el('div','rk','🎖 '+titleText()),el('div','sm','الميداليات '+ltr(m+' / '+tot)+'  ·  النجوم '+ltr(starsTotal()+' / '+Math.max(3,Object.keys(S.cl).length*3))+'  ·  المتحف '+ltr(museumCount()+' / '+museumCauses().length)+'  ·  رتبتك: '+rankName()));
  const L2=$('acList'); L2.innerHTML=''; dayRender(L2);
  const sorted=ACH.slice().sort((a,b)=>((S.ac[a.id]|0)>=a.T.length)-((S.ac[b.id]|0)>=b.T.length)); for(const a of sorted)L2.appendChild(achRow(a));
  const mus=el('div','mus'); mus.append(el('b',null,'🏛 متحف الموت: '));
  for(const c of museumCauses()){ const n=S.st.dc[c]|0, sp=el('span','mc'+(n?' on':''),n?(CAUSE_NM[c]||c)+' ×'+n:'؟'); mus.appendChild(sp) }
  L2.appendChild(mus); heatRender(L2);
}
const CAUSE_NM={spike:'شوك',arrow:'سهم',ghost:'شبح',crush:'سحق',bait:'عملة خدّاعة',boulder:'صخرة',wall:'جدار',saw:'منشار',fakedoor:'باب مزيّف',monster:'وحش',ball:'كرة',pit:'حفرة',crumble:'أرض تتفتّت',fire:'نار',zap:'كهربا',disco:'ديسكو',laser:'ليزر',train:'قطار',mole:'خلد',chest:'صندوق',frog:'ضفدع',ceilspike:'شوك سقف'};
function openAch(){ ACHUI.open=true; K.l=K.r=K.j=K.jp=false; $('ach').classList.remove('hide'); Snd.init(); achRender(); $('acList').scrollTop=0 }
function closeAch(){ ACHUI.open=false; $('ach').classList.add('hide'); hud(); if(typeof WM!=='undefined'&&WM.open)wmRender(true) }
$('acX').onclick=closeAch;
for(const id of ['bAchT','bAch'])$(id).onclick=openAch;
setTimeout(achCheck,900);
