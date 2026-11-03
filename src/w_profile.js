/* =============== PLAYER PROFILE: name, picture, stats card, friends' ranking, backup code ===============
   No accounts and no server of our own: the profile is a few fields of the save (S.fname = name, S.pf = {a:'h'|emoji, f:frame}) plus the stable friend id (S.fid).
   The picture is either the player's own hero at its current stage (follows the hero he plays) or one of 24 emojis; no photo upload (that would need storage and moderation).
   Frames unlock by levels cleared. Friends see the picture next to the name (presence node p, see w_friends.js) and the stats card (node s, written here: stars, levels, medals,
   today's and this week's tasks - the same tasks for everybody, they are seeded from the date) in the ranking. Everything read from the database is cleaned (pfSan) before use.
   Backup code = the whole save as "DDH1.<base64>.<checksum>" (minus admin and database-url fields): paste it on another device and the progress, the friend id and the friend list come along.
   Nothing here is secure: a client-only game cannot stop anybody from editing his own save; the ranking is for fun. */
const PF={open:false,metric:'st',poll:0,rt:0,rkey:'',sig:'',sigAt:0,putAt:0,imp:'',impT:0,msg:''};
const PF_EMO=['😎','😈','🤡','👻','💀','🦊','🐸','🐵','🐼','🦁','🐲','🦄','🤖','👽','🥷','🧙','🧆','🥙','☕','⚡','🔥','👑','🎃','😴'];
const PF_FR=[{n:'بدون إطار',c:'#000',need:0},{n:'خشب',c:'#b07a3c',need:0},{n:'فضّة',c:'#c3cbda',need:10},{n:'ذهب',c:'#ffd23f',need:30},{n:'ياقوت',c:'#ff4d6d',need:60},{n:'ألماس',c:'#7fe3ff',need:100}];
const PF_MET=[['st','⭐ النجوم'],['cl','🚩 المراحل'],['m','🏅 الميداليات'],['dy','🎯 التحدّيات'],['pl','🔰 المستوى']];
const pfHero=h=>typeof h==='string'&&Object.prototype.hasOwnProperty.call(HEROES,h);
const pfCleared=()=>Object.keys(S.cl||{}).length;
const pfNum=(v,mx)=>{ v=+v; return isFinite(v)?Math.max(0,Math.min(mx,Math.floor(v))):0 };
const pfClean=(s,n)=>String(s==null?'':s).replace(/[<>&"'`\u0000-\u001f]/g,'').trim().slice(0,n);
function pfGet(){
  let p=S.pf; if(!p||typeof p!=='object')p=S.pf={a:'h',f:0};
  if(p.a!=='h'&&!PF_EMO.includes(p.a))p.a='h';
  p.f=p.f|0; if(p.f<0||p.f>=PF_FR.length||PF_FR[p.f].need>pfCleared())p.f=0;
  return p;
}
const pfSig=()=>{ const p=pfGet(); return p.a+','+p.f };
const pfSigOf=o=>[o.a||'h',o.h||'',o.s|0,o.k|0,o.f|0].join(',');

/* ---- what comes from the database (or from the save) is cleaned before it is drawn ---- */
function pfSan(o,pres){
  if(!o||typeof o!=='object')return null;
  const r={n:frClean(o.n),h:pfHero(o.h)?o.h:'falafel',s:pfNum(o.s,HERO_MAXST),k:0,a:o.a==='h'||PF_EMO.includes(o.a)?o.a:'h',f:pfNum(o.f,PF_FR.length-1),
    st:pfNum(o.st,9999),cl:pfNum(o.cl,9999),b:pfNum(o.b,9999),d:pfNum(o.d,999999),m:pfNum(o.m,999),dy:pfNum(o.dy,3),wk:pfNum(o.wk,3),ti:pfClean(o.ti,24),pl:Math.max(1,pfNum(o.pl,PL_MAX))};
  r.k=skinSan(r.h,o.k);
  if(pres){ r.r=/^[A-Z0-9]{4,5}$/.test(String(o.r||''))?String(o.r):''; r.ts=typeof o.ts==='number'?o.ts:0 }
  return r;
}
function pfOwn(){
  dyTasks(); const p=pfGet(), cnt=o=>Object.keys(o||{}).filter(k=>o[k]).length;
  return {n:frName(),h:S.hero,s:heroStage(S.hero),k:skinSaved(S.hero),a:p.a,f:p.f,st:starsTotal(),cl:pfCleared(),b:S.best|0,d:S.deaths|0,m:medalsTotal(),dy:cnt(S.dy.c),wk:cnt(S.wk.c),ti:pfClean(titleText(),24),pl:plLevel()};
}
function frStatsPut(force){                                                                // my stats card, written when it changed (at most every 15 s) or every 5 minutes
  if(!frAvail())return; const o=pfOwn(), sig=JSON.stringify(o), now=Date.now();
  if(!force&&((sig===PF.sig&&now-PF.sigAt<300000)||now-PF.putAt<15000))return;
  PF.sig=sig; PF.sigAt=PF.putAt=now;
  fetch(frUrl('u'+frId()+'/s')+'?print=silent',{method:'PUT',body:JSON.stringify(Object.assign({},o,{ts:{'.sv':'timestamp'}}))}).catch(()=>{});
}

/* ---- the picture ---- */
function pfPaintHero(cv,hero,st,sk){                                                            // the face of a hero at a stage (upper part of its picture)
  if(!pfHero(hero))return false; st=clamp(st|0,0,HERO_MAXST);
  sk=skinSan(hero,sk); const ks=sk?hero+'_k'+sk+'_s'+(st+1):'', k=HSPR[ks]&&HSPR[ks].ok?ks:(HSPR[hero+'_s'+(st+1)]&&HSPR[hero+'_s'+(st+1)].ok?hero+'_s'+(st+1):hero), o=HSPR[k]; if(!o||!o.ok||!o.im||!o.im.width)return false;
  const iw=o.im.width, ih=o.im.height, m=HMETA[k]||{cx:.5}, sq=Math.min(iw,ih*.62), sx=clamp(iw*m.cx-sq/2,0,iw-sq);
  cv.width=cv.height=96; const c=cv.getContext('2d'); c.clearRect(0,0,96,96); c.drawImage(o.im,sx,0,sq,sq,0,0,96,96); return true;
}
function pfAv(src,size){                                                                      // src = {a,h,s,f}; size in --u units
  const w=el('span','pfav'); w.style.setProperty('--s',size||36);
  const f=PF_FR[clamp(src.f|0,0,PF_FR.length-1)]; w.style.borderColor=f.c==='#000'?'#000':f.c;
  if(src.a&&src.a!=='h'&&PF_EMO.includes(src.a)){ w.textContent=src.a; w.classList.add('em') }
  else { const cv=document.createElement('canvas'); w.appendChild(cv); if(!pfPaintHero(cv,src.h||S.hero,src.s|0,src.k|0)){ cv.remove(); w.textContent='🙂'; w.classList.add('em') } }
  return w;
}
const pfMine=()=>{ const p=pfGet(); return {a:p.a,f:p.f,h:S.hero,s:heroStage(S.hero),k:skinSaved(S.hero)} };
let tcSig='';
function titleCard(){                                          // the profile card on the title screen (top-left): face, name, level + xp bar, coins, gems. Rebuilt only when something it shows changed
  const b=$('bPfT'); if(!b)return; const m=pfMine(), q=plProg(), on=plOn();
  const sig=[S.fname||'',m.a,m.f,m.h,m.s,m.k,sprOf(m.h,m.s)?1:0,on?q.n+':'+Math.round(q.pct*100):'-',S.wallet|0,S.gems|0].join('|'); if(sig===tcSig&&b.firstChild)return; tcSig=sig;
  b.textContent=''; const info=el('span','pfi'), top=el('span','pft'), cu=el('span','pfcu');
  top.append(el('b',null,'👤 '+(S.fname||'ملفّي'))); if(on)top.append(el('i',null,'🔰 مستوى '+q.n)); info.append(top);
  if(on){ const bar=el('span','pfxb'), f=el('i'); f.style.width=Math.round(q.pct*100)+'%'; bar.append(f); info.append(bar) }
  cu.append(el('b',null,'🪙 '+(S.wallet|0))); if(on)cu.append(el('b',null,'💎 '+(S.gems|0))); info.append(cu);
  b.append(pfAv(m,44),info);
}

/* ---- the screen ---- */
function pfMsg(){ const e=$('pfMsg'); if(e)e.textContent=FR.msg||PF.msg||'' }
function pfChanged(){ try{ titleCard() }catch(e){} frStatsPut(true); if(FR.on)frBeat(); frRender(); if(PF.open){ pfHead(); pfPick(); pfStatsRender(); pfRank() } }
function pfHead(){
  const h=$('pfHead'); if(!h)return; h.textContent='';
  const col=el('div','pfcol');
  const nm=PF.nameEl||(PF.nameEl=(()=>{ const i=document.createElement('input'); i.id='pfName'; i.maxLength=12; i.type='text'; i.addEventListener('keydown',e=>e.stopPropagation());
    i.addEventListener('change',()=>{ S.fname=frClean(i.value); save(); pfChanged() }); return i })());
  nm.placeholder=frName(); if(document.activeElement!==nm)nm.value=S.fname||'';
  const code=el('div','pfcode'); code.append(el('span',null,'كودك كصديق: '),el('b',null,frFmt(frId())),el('button','tg','📋 نسخ',()=>frCopy(frId(),'📋 اننسخ كودك')));
  col.append(nm,el('div','pftitle','🎖 '+titleText()));
  if(plOn()){ const q=plProg(), x=el('div','pfxp'), bar=el('div','bar'), fill=el('i'); fill.style.width=Math.round(q.pct*100)+'%'; bar.append(fill);
    x.append(el('span',null,'🔰 مستوى '+q.n),bar,el('small',null,q.need?'\u2066'+q.cur+' / '+q.need+'\u2069':'MAX')); col.append(x) }
  col.append(code);
  h.append(pfAv(pfMine(),72),col); $('pfW').textContent='🪙 '+S.wallet+(plOn()?'  💎 '+(S.gems|0):'');
}
function pfPick(){
  const b=$('pfPick'); if(!b)return; b.textContent=''; const p=pfGet();
  b.append(el('div','pfl','صورتك'));
  const row=el('div','pfrow'); row.append(el('button','tg'+(p.a==='h'?' on':''),'🎭 بطلي',()=>{ pfGet().a='h'; save(); pfChanged() }));
  for(const e of PF_EMO)row.append(el('button','tg em'+(p.a===e?' on':''),e,()=>{ pfGet().a=e; save(); pfChanged() }));
  b.append(row,el('div','pfl','الإطار  ·  بيتفتح مع المراحل يلي بتخلّصها ('+pfCleared()+' هلأ)'));
  const fr=el('div','pfrow');
  PF_FR.forEach((f,i)=>{ const lock=f.need>pfCleared(), t=el('button','tg'+(p.f===i?' on':''),(lock?'🔒 ':'')+f.n+(f.need?' ('+f.need+')':''),()=>{ if(lock)return; pfGet().f=i; save(); pfChanged() }); t.disabled=lock; t.style.borderColor=f.c; fr.append(t) });
  b.append(fr);
}
function pfStatsRender(){
  const b=$('pfStats'); if(!b)return; b.textContent=''; const o=pfOwn();
  for(const [ic,t,v] of [['⭐','النجوم',o.st],['🚩','مراحل مخلّصة',o.cl],['🏅','ميداليات',o.m],['💀','موتات',o.d],['🪙','كوينز',S.wallet|0],['🎯','تحدّيات اليوم',ltr(o.dy+' / 3')]].concat(plOn()?[['💎','جواهر',S.gems|0],['🔰','مستوى اللاعب',o.pl]]:[])){
    const c=el('div','pfst'); c.append(el('i',null,ic),el('b',null,String(v)),el('span',null,t)); b.append(c) }
}
function pfRows(){
  const rows=[Object.assign(pfOwn(),{id:frId(),me:1})];
  for(const f of frList().filter(f=>f.c)){ const s=FR.st[f.id]; rows.push(Object.assign({id:f.id,f0:f},s||{n:f.n||frFmt(f.id),h:'falafel',s:0,a:'h',f:0,st:0,cl:0,b:0,d:0,m:0,dy:0,wk:0,ti:'',pl:1,nodata:1})) }
  const val=r=>PF.metric==='dy'?r.dy*10+r.wk:r[PF.metric];
  return rows.sort((a,b)=>(val(b)-val(a))||(b.st-a.st)||String(a.n).localeCompare(String(b.n),'ar'));
}
function pfRank(){
  const box=$('pfRankList'); if(!box)return; const rows=pfRows();
  const key=JSON.stringify([rows.map(r=>[r.id,r.n,r.st,r.cl,r.m,r.dy,r.wk,r.pl,r.ti,pfSigOf(r),!!r.nodata]),PF.metric,FR.gf,S.wallet|0,frGiftLeft(),frAvail(),(frList().filter(f=>f.c).map(f=>frIsOn(f.id)))]);
  if(PF.metric==='pl'&&!plOn())PF.metric='st';
  for(const b of document.querySelectorAll('#pfMet .tg')){ b.classList.toggle('on',b.dataset.m===PF.metric); if(b.dataset.m==='pl')b.classList.toggle('hide',!plOn()) }
  if(key===PF.rkey)return; PF.rkey=key; box.textContent='';
  if(!frAvail())box.append(el('div','pfhint','الترتيب والهدايا بدهم اتصال بالإنترنت (قاعدة البيانات) — مش متوفرين هون'));
  else if(rows.length===1)box.append(el('div','pfhint','لسا ما عندك أصدقاء — من 👥 تعاون ← أونلاين ضيف صاحبك بكوده وبتشوفوا ترتيبكم هون'));
  rows.forEach((r,i)=>{
    const row=el('div','pfr'+(r.me?' me':'')); row.dataset.id=r.id;
    const v=PF.metric==='dy'?'اليوم '+r.dy+'/3 · الأسبوع '+r.wk+'/3':PF.metric==='pl'?'مستوى '+r.pl:String(r[PF.metric]);
    const nm=el('b'); nm.append(document.createTextNode(r.me?r.n+' (أنت)':r.n)); if(r.ti||r.nodata)nm.append(el('small',null,r.nodata?'بعده ما نشر بياناته':'🎖 '+r.ti));
    row.append(el('span','rk',['🥇','🥈','🥉'][i]||String(i+1)),pfAv(r,30),nm,el('span','v',v));
    if(!r.me&&r.f0){ const on=frIsOn(r.id), g=el('button','tg fgift'+(FR.gf===r.id?' on':''),'🎁',()=>frGiftToggle(r.id)); g.disabled=!on||!frAvail(); g.title=on?'ابعتله هدية كوينز':'الهدية بتنبعت بس لصديق متصل'; row.append(g) }
    box.append(row); if(FR.gf===r.id&&r.f0)box.append(frGiftPicker(r.id));
  });
}
function pfBak(){
  const b=$('pfBak'); if(!b)return; b.textContent='';
  b.append(el('div','pfl','💾 نسخة احتياطية — لتنقل تقدّمك وأصدقاءك لجهاز تاني (استعمله على جهاز واحد بنفس الوقت)'));
  const row=el('div','pfrow'); row.append(el('button','tg','📋 انسخ كود نسختي',()=>{ const t=pfExport(); try{ navigator.clipboard.writeText(t).then(()=>{ PF.msg='📋 اننسخ كود النسخة — احتفظ فيه'; pfMsg() },()=>{ $('pfImp').value=t; PF.msg='انسخ الكود يدوياً من الخانة'; pfMsg() }) }catch(e){ $('pfImp').value=t; PF.msg='انسخ الكود يدوياً من الخانة'; pfMsg() } }));
  const ta=document.createElement('textarea'); ta.id='pfImp'; ta.rows=2; ta.placeholder='الصق كود نسخة هون (DDH1.…)'; ta.addEventListener('keydown',e=>e.stopPropagation());
  const go=el('button','tg','📥 استرجع',()=>pfImport(ta.value)); go.id='pfImpGo';
  b.append(row,ta,go);
}

/* ---- backup code ---- */
const pfB64=s=>btoa(unescape(encodeURIComponent(s)));
function pfExport(){ const o=Object.assign({},S); delete o.adm; delete o.admh; delete o.nu; delete o.turn; const b=pfB64(JSON.stringify(o)); return 'DDH1.'+b+'.'+fnv(b).toString(36) }
function pfParse(t){
  const m=/^DDH1\.([A-Za-z0-9+/=]+)\.([a-z0-9]+)$/.exec(String(t||'').replace(/\s+/g,''));
  if(!m||fnv(m[1]).toString(36)!==m[2])return null;
  try{ const o=JSON.parse(decodeURIComponent(escape(atob(m[1])))); return o&&typeof o==='object'&&!Array.isArray(o)&&typeof o.best==='number'&&typeof o.hero==='string'?o:null }catch(e){ return null }
}
function pfImport(text){
  const o=pfParse(text); if(!o){ PF.imp=''; PF.msg='❌ الكود مش صحيح أو ناقص'; pfMsg(); return false }
  if(PF.imp!==text.trim()||Date.now()-PF.impT>8000){ PF.imp=text.trim(); PF.impT=Date.now(); PF.msg='⚠ هيدا بيبدّل تقدّمك الحالي كله بالنسخة — اضغط «استرجع» مرة ثانية للتأكيد'; pfMsg(); return false }
  const keep={}; for(const k of ['adm','admh','nu','turn'])if(S[k]!==undefined)keep[k]=S[k];
  try{ localStorage.setItem('td_s',JSON.stringify(Object.assign({},o,keep))) }catch(e){ PF.msg='❌ ما قدرت أحفظ'; pfMsg(); return false }
  PF.msg='✅ انسترجعت النسخة — عم أعيد التحميل...'; pfMsg(); setTimeout(()=>location.reload(),300); return true;
}

/* ---- open / close ---- */
function pfPoll(){
  if(!frAvail())return;
  for(const f of frList().filter(f=>f.c))fetch(frUrl('u'+f.id+'/s')).then(r=>r.json()).then(o=>{
    const s=pfSan(o); if(s){ FR.st[f.id]=s; if(s.n&&s.n!==f.n){ f.n=s.n; save() } }
    clearTimeout(PF.rt); PF.rt=setTimeout(()=>{ if(PF.open)pfRank(); frRender() },120) }).catch(()=>{});
}
function pfBuild(){
  const B=$('pfBody'); if(B.dataset.built)return; B.dataset.built=1;
  const mk=(id,cls)=>{ const d=el('div',cls||'pfsec'); d.id=id; B.append(d); return d };
  mk('pfHead','pfsec pfheadc'); const m=el('div','pfmsg'); m.id='pfMsg'; B.append(m);
  mk('pfPick'); mk('pfStats','pfstats');
  const rk=el('div','pfsec'); rk.append(el('div','pfl','🏆 ترتيب الأصدقاء'));
  const met=el('div','pfrow'); met.id='pfMet'; for(const [k,t] of PF_MET){ const b=el('button','tg',t,()=>{ PF.metric=k; PF.rkey=''; pfRank() }); b.dataset.m=k; met.append(b) }
  const list=el('div','pflist'); list.id='pfRankList'; rk.append(met,list,el('div','pfhint','🎁 هدية الكوينز: لصديق متصل، 10 أو 25 أو 50، وحدّك 100 باليوم'));
  B.append(rk); mk('pfBak');
}
function pfRefresh(){ pfHead(); pfPick(); pfStatsRender(); PF.rkey=''; pfRank(); pfMsg() }
function openPf(){
  if(PF.open)return; PF.open=true; K.l=K.r=K.j=K.jp=false; $('pf').classList.remove('hide'); Snd.init&&Snd.init(); pfBuild(); pfBak(); PF.msg=''; pfRefresh();
  frStatsPut(true); pfPoll(); clearInterval(PF.poll); PF.poll=setInterval(()=>{ pfPoll(); if(PF.open){ pfStatsRender(); pfRank() } },12000); $('pfBody').scrollTop=0;
}
function closePf(){ PF.open=false; clearInterval(PF.poll); PF.poll=0; $('pf').classList.add('hide'); hud() }
$('pfX').onclick=closePf;
for(const id of ['bPfT','bPf'])$(id).onclick=openPf;
addEventListener('keydown',e=>{ if(PF.open&&e.code==='Escape'&&!(e.target&&/INPUT|TEXTAREA/.test(e.target.tagName))){ closePf(); e.preventDefault() } });

