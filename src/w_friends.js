/* =============== FRIENDS: a code once, instead of a room code every time ===============
   Identity = a stable 8-character id kept in the save (S.fid, no accounts). Friends are {id,n,c} in S.fr (c=1 once both sides accepted).
   Everything lives in the SAME database the rooms use, under dhr/u<ID>/ (the project's rules only open dhr/*, so nothing has to be changed there):
     p  : presence  {n,h,r,ts}  written every 20 s with a SERVER timestamp; r = the room code while I'm hosting and waiting (a friend can join with one tap)
     in : inbox     <key>:{k:'req'|'ok'|'inv', f:<sender id>, n, c(room), m(mode), ts}  my own SSE stream; every item is deleted once read
   Cost: ONE open connection per player (the inbox stream), only while he has a friend or the panel is open (Spark allows ~100 at once).
   s  : stats card {n,h,s,a,f,st,cl,b,d,m,dy,wk,ti,ts}  (w_profile.js) - what the friends' ranking reads; stays when I go offline
   inbox kinds also: 'gift' {a:10|25|50 coins}  (queued in S.gq until the receiver taps "claim"), 'ack' {a} (he claimed it)
   Only works with the real database transport (not the same-browser loop). Invites count only from people already in my list; a stranger can
   only send a friend REQUEST, which I have to accept. Names are cut to 12 characters and always written with textContent. */
var FR={st:{},gf:'',giftHold:0,msgT:0,on:false,es:null,hb:0,poll:0,off:0,pres:{},pend:[],sig:'',msg:'',sleep:0,card:null,shown:false,rm:null};
const frOk=id=>/^[A-Z0-9]{8}$/.test(id||'');
const frClean=n=>String(n==null?'':n).replace(/[<>&"'`\u0000-\u001f]/g,'').trim().slice(0,12);
const frFmt=id=>id.slice(0,4)+'-'+id.slice(4);
const frNorm=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const frUrl=p=>netDb()+'/dhr/'+p+'.json';
const frAvail=()=>netKind()==='rtdb';
const frNow=()=>Date.now()+FR.off;
const frList=()=>Array.isArray(S.fr)?S.fr:(S.fr=[]);
function frId(){ if(!frOk(S.fid)){ S.fid=Array.from({length:8},()=>NET_AL[Math.random()*NET_AL.length|0]).join(''); save() } return S.fid }
const frName=()=>frClean(S.fname)||('لاعب '+frId().slice(0,3));
const frRoomNow=()=>NET.role==='h'&&NET.link==='wait'?NET.code:'';
const frSig=()=>frName()+'|'+S.hero+'|'+heroStage(S.hero)+'|'+frRoomNow()+'|'+pfSig();
const frIsOn=id=>{ const p=FR.pres[id]; return !!(p&&typeof p.ts==='number'&&frNow()-p.ts<65000) };
const frPanelOpen=()=>!$('co').classList.contains('hide')&&NET.tab&&$('frBox').open;

/* ---- database ---- */
function frSay(m){ FR.msg=m; FR.msgT=Date.now(); frRender(); if(PF.open)pfMsg() }
function frSend(to,obj){                                                                   // resolves true when the database took it
  if(!frAvail()||!frOk(to))return Promise.resolve(false);
  const key=Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  return fetch(frUrl('u'+to+'/in/'+key),{method:'PUT',body:JSON.stringify(Object.assign({f:frId(),n:frName(),ts:{'.sv':'timestamp'}},obj))}).then(r=>!!r.ok,()=>false);
}
function frBeat(){
  if(!FR.on||!frAvail())return; FR.sig=frSig();
  const pf=pfGet();
  fetch(frUrl('u'+frId()+'/p'),{method:'PUT',body:JSON.stringify({n:frName(),h:S.hero,s:heroStage(S.hero),a:pf.a,f:pf.f,r:frRoomNow(),ts:{'.sv':'timestamp'}})})
    .then(r=>r.json()).then(d=>{ if(d&&typeof d.ts==='number')FR.off=d.ts-Date.now() }).catch(()=>{});
  frStatsPut();
}
function frPoll(force){
  if(!FR.on||(!force&&!frPanelOpen()))return;
  for(const f of frList().slice())fetch(frUrl('u'+f.id+'/p')).then(r=>r.json()).then(p=>{
    FR.pres[f.id]=p&&typeof p==='object'?pfSan(p,1):null;
    const n=p&&frClean(p.n); if(n&&n!==f.n){ f.n=n; save() }
    frRender() }).catch(()=>{});
}
function frStart(){
  if(FR.on||!frAvail())return; FR.on=true;
  FR.es=new EventSource(frUrl('u'+frId()+'/in'));
  const ev=e=>{ let d=null; try{ d=JSON.parse(e.data) }catch(_){} if(!d||d.data==null||typeof d.data!=='object')return;
    const segs=String(d.path||'/').split('/').filter(Boolean);
    const items=segs.length===0?Object.entries(d.data):(segs.length===1?[[segs[0],d.data]]:[]);
    for(const [k,v] of items)if(v&&typeof v==='object')frGot(k,v) };
  FR.es.addEventListener('put',ev); FR.es.addEventListener('patch',ev);
  frBeat(); FR.hb=setInterval(frBeat,20000); frPoll(true); FR.poll=setInterval(frPoll,8000);
}
function frStop(){
  if(!FR.on)return; FR.on=false; clearInterval(FR.hb); clearInterval(FR.poll); FR.hb=FR.poll=0;
  if(FR.es){ FR.es.close(); FR.es=null }
  try{ fetch(frUrl('u'+frId()+'/p'),{method:'DELETE',keepalive:true}).catch(()=>{}) }catch(e){}
}

/* ---- incoming ---- */
function frGot(k,v){
  fetch(frUrl('u'+frId()+'/in/'+k),{method:'DELETE'}).catch(()=>{});                      // read once
  const from=String(v.f||''); if(!frOk(from)||from===frId())return;
  if(v.k==='inv'&&typeof v.ts==='number'&&frNow()-v.ts>120000)return;                      // an old invite is no invite (a request or a reply may wait in the inbox for days)
  const nm=frClean(v.n)||frFmt(from), fr=frList().find(f=>f.id===from);
  if(v.k==='gift'){                                                                         // a coin gift: only from a friend, once per inbox item, queued in the save until he taps claim
    const a=v.a|0; if(!fr||!(a>=1&&a<=50))return; if(!Array.isArray(S.gq))S.gq=[];
    const seen=Array.isArray(S.gk)?S.gk:(S.gk=[]); if(seen.includes(k))return; seen.push(k); if(seen.length>80)seen.shift();
    if(S.gq.length<100)S.gq.push({f:from,n:fr.n||nm,a,ts:Date.now()}); save(); frRender(); return }
  if(v.k==='ack'){ if(fr&&(v.a|0)>0){ const m='🎁 '+(fr.n||nm)+' استلم هديتك'; frSay(m); if(typeof econToast==='function')econToast(m) } return }
  if(v.k==='ok'){ if(fr){ fr.c=1; if(frClean(v.n))fr.n=frClean(v.n); save(); frRender() } return }
  if(v.k==='req'){
    if(fr){ fr.c=1; fr.n=nm; save(); frSend(from,{k:'ok'}); frRender(); return }          // I had added him too: both sides agree
    FR.pend=FR.pend.filter(x=>!(x.k==='req'&&x.f===from)); FR.pend.push({k:'req',f:from,n:nm,ts:Date.now()}); return
  }
  if(v.k==='inv'&&fr&&/^[A-Z0-9]{4,5}$/.test(String(v.c||''))){                          // invites only from people in my list
    FR.pend=FR.pend.filter(x=>!(x.k==='inv'&&x.f===from)); FR.pend.push({k:'inv',f:from,n:fr.n||nm,c:v.c,m:v.m==='race'?'race':'co',ts:Date.now()})
  }
}

/* ---- actions ---- */
function frAdd(raw,name){
  const id=frNorm(raw);
  if(!frAvail()){ frSay('الأصدقاء بدهم اتصال بالإنترنت (قاعدة البيانات)'); frRender(); return false }
  if(!frOk(id)){ frSay('الكود 8 خانات (حروف وأرقام)'); frRender(); return false }
  if(id===frId()){ frSay('هاد كودك أنت 😄'); frRender(); return false }
  if(frList().some(f=>f.id===id)){ frSay('مضاف من قبل'); frRender(); return false }
  if(frList().length>=40){ frSay('قائمتك ممتلئة (40)'); frRender(); return false }
  frList().push({id,n:frClean(name)||'',c:0}); save(); frSay('✅ انضاف — بانتظار قبوله');
  frStart(); frSend(id,{k:'req'}); frPoll(true); frRender(); return true
}
function frRemove(id){ S.fr=frList().filter(f=>f.id!==id); delete FR.pres[id]; save(); frRender() }
function frInvite(id){
  const fr=frList().find(f=>f.id===id); if(!fr||!fr.c)return false;
  if(NET.link!=='off'&&NET.role!=='h'){ frSay('انت ضيف بغرفة — اطلع أول'); frRender(); return false }
  if(NET.link==='conn'||NET.link==='play'){ frSay('غرفتك فيها لاعب'); frRender(); return false }
  if(NET.link==='off'){ Snd.init&&Snd.init(); netHost() }
  frSend(id,{k:'inv',c:NET.code,m:NET.mode==='race'?'race':'co'}); frBeat();
  frSay('📨 انبعتت الدعوة لـ'+(fr.n||frFmt(id))); frRender(); return true
}
function frJoinRoom(code){
  Snd.init&&Snd.init();
  if(NET.link!=='off')netLeave('',false);
  if(G.state!=='co')coOpen('');
  NET.tab=true; netJoin(code); coRender();
}
function frCopy(text,done){
  const ok=m=>{ frSay(m) };
  try{ navigator.clipboard.writeText(text).then(()=>ok(done),()=>ok('انسخ يدوياً: '+text)) }catch(e){ ok('انسخ يدوياً: '+text) }
}
function frLink(){ let base=SHARE_URL; try{ if(window.top===window&&/^https?:/.test(location.protocol))base=location.origin+location.pathname }catch(e){} return base+'?f='+frId() }
function frShare(){
  const url=frLink(), text='ضيفني بلعبة «لا تموت يا حبيبي» 😈 كودي: '+frFmt(frId());
  try{ if(navigator.share){ navigator.share({title:SHARE_TITLE,text,url}).catch(e=>{ if(!e||e.name!=='AbortError')frCopy(text+'\n'+url,'اننسخ — الصقه لصاحبك 📋') }); return } }catch(e){}
  frCopy(text+'\n'+url,'اننسخ — الصقه لصاحبك 📋')
}

/* ---- coin gifts (friends only; the sender pays first and is refunded if the database refuses; max 100 per day; the receiver claims from a card) ---- */
const GF_AMTS=[10,25,50], GF_CAP=100;
function frGiftLeft(){ const d=dayNum(); if(!S.gs||S.gs.d!==d)S.gs={d,n:0}; return Math.max(0,GF_CAP-(S.gs.n|0)) }
function frGift(id,amt){
  const fr=frList().find(f=>f.id===id);
  if(!frAvail()||!fr||!fr.c||!GF_AMTS.includes(amt))return false;
  if(!frIsOn(id)){ frSay('الهدية بتنبعت بس لصديق متصل هلأ'); return false }
  if(amt>frGiftLeft()){ frSay('وصلت حدّ الهدايا اليوم ('+GF_CAP+' 🪙) — بكرا بيتجدّد'); return false }
  if(amt>(S.wallet|0)){ frSay('ما معك كفاية كوينز'); return false }
  S.wallet-=amt; S.gs.n+=amt; save(); hud(); FR.gf='';
  frSend(id,{k:'gift',a:amt}).then(ok=>{
    if(ok){ frSay('🎁 انبعتت '+amt+' 🪙 لـ'+(fr.n||frFmt(id))); return }
    S.wallet+=amt; S.gs.n=Math.max(0,S.gs.n-amt); save(); hud(); frSay('ما وصلت الهدية — رجّعتلك كوينزك') });
  frSay('⏳ عم ببعت الهدية...'); return true
}
function frGiftClaim(g){
  const i=Array.isArray(S.gq)?S.gq.indexOf(g):-1; if(i<0)return; S.gq.splice(i,1);
  const a=Math.max(0,Math.min(50,g.a|0)); S.wallet+=a; save(); hud(); Snd.coin&&Snd.coin();
  if(typeof econToast==='function')econToast('🎁 +'+a+' 🪙 من '+g.n); frSend(g.f,{k:'ack',a}); frSay('🎁 استلمت '+a+' 🪙 من '+g.n)
}
function frGiftPicker(id){                                                                  // the 10 / 25 / 50 row under a friend
  const d=document.createElement('div'), left=frGiftLeft(); d.className='frg';
  const t=document.createElement('span'); t.textContent='🎁 كم كوين؟ (باقي اليوم '+left+')'; d.append(t);
  for(const a of GF_AMTS){ const b=document.createElement('button'); b.className='tg'; b.textContent=a+' 🪙'; b.disabled=a>left||a>(S.wallet|0); b.onclick=()=>frGift(id,a); d.append(b) }
  return d
}
const frGiftToggle=id=>{ FR.gf=FR.gf===id?'':id; frRender(); if(PF.open)pfRank() };

/* ---- the invite / request card ---- */
function frCardClose(){ FR.card=null; $('frCard').classList.add('hide'); $('frCard').textContent='' }
function frCardShow(c){
  FR.card=c; const el=$('frCard'); el.textContent='';
  const t=document.createElement('span'); const mk=(txt,fn,cls)=>{ const b=document.createElement('button'); b.className=cls||'tg'; b.textContent=txt; b.onclick=()=>{ frCardClose(); fn() }; return b };
  if(c.k==='inv'){ t.textContent='👥 '+c.n+' دعاك تلعبوا '+(c.m==='race'?'سباق 🏁':'تعاون 🤝'); el.append(t,mk('انضم ✅',()=>frJoinRoom(c.c),'tg fok'),mk('لا',()=>{})) }
  else if(c.k==='req'){ t.textContent='👥 '+c.n+' بدّه يضيفك صديق'; el.append(t,mk('قبول ✅',()=>{ if(!frList().some(f=>f.id===c.f)){ frList().push({id:c.f,n:c.n,c:1}); save() } frSend(c.f,{k:'ok'}); frStart(); frPoll(true); frRender() },'tg fok'),mk('تجاهل',()=>{})) }
  else if(c.k==='gift'){ t.textContent='🎁 '+c.n+' بعتلك '+c.a+' 🪙'; el.append(t,mk('استلم ✅',()=>frGiftClaim(c.g),'tg fok'),mk('لاحقاً',()=>{ FR.giftHold=Date.now()+300000 })) }
  else if(c.k==='link'){ t.textContent='➕ تضيف '+(c.n||frFmt(c.f))+' كصديق؟'; el.append(t,mk('أضِف ✅',()=>frAdd(c.f,c.n),'tg fok'),mk('لا',()=>{})) }
  el.classList.remove('hide'); Snd.ui&&Snd.ui();
}
function frCardTick(){
  if(FR.card){ if(Date.now()-FR.card.ts>90000){ if(FR.card.k==='gift')FR.giftHold=Date.now()+120000; frCardClose() } return }
  FR.pend=FR.pend.filter(x=>Date.now()-x.ts<110000);
  if(G.state==='play')return;                                                                // not in the middle of a run
  if(!FR.pend.length){ if(Array.isArray(S.gq)&&S.gq.length&&Date.now()>FR.giftHold){ const g=S.gq[0]; frCardShow({k:'gift',g,n:g.n,a:g.a,ts:Date.now()}) } return }
  frCardShow(FR.pend.shift())
}

/* ---- the panel ---- */
function frRender(){
  const box=$('frBox'); if(!box)return;
  $('frMyId').textContent=frFmt(frId());
  $('frName').placeholder=frName(); if(document.activeElement!==$('frName'))$('frName').value=S.fname||'';
  const el=$('frList'), L=frList().slice().sort((a,b)=>(frIsOn(b.id)-frIsOn(a.id))||String(a.n).localeCompare(String(b.n),'ar'));
  const src=f=>Object.assign({},FR.st[f.id]||{},FR.pres[f.id]||{});
  const rows=L.map(f=>{ const p=FR.pres[f.id], isOn=frIsOn(f.id); return [f.id,f.n,f.c,isOn,isOn&&p?String(p.r||''):'',pfSigOf(src(f))] });
  const key=JSON.stringify([rows,NET.link,FR.rm,frAvail(),FR.gf,S.wallet|0,frGiftLeft()]); let on=0; for(const r of rows)if(r[3])on++;
  $('frBadge').textContent=L.length?('('+on+'/'+L.length+' متصل)'):''; $('frMsg').textContent=FR.msg||'';
  if(key===FR.rkey)return;                                                                  // nothing changed: leave the buttons alone (a redraw between press and release would eat the click)
  FR.rkey=key; el.textContent=''; on=0;
  if(!frAvail()){ el.textContent='الأصدقاء بدهم اتصال بالإنترنت (قاعدة البيانات) — مش متوفر هون' }
  else if(!L.length){ el.textContent='لسا ما أضفت حدا — أعطِ كودك لصاحبك أو الصق كوده فوق' }
  for(const f of L){
    const p=FR.pres[f.id], isOn=frIsOn(f.id), room=isOn&&p&&/^[A-Z0-9]{4,5}$/.test(String(p.r||''))?p.r:''; if(isOn)on++;
    const row=document.createElement('div'); row.className='frr'; row.dataset.id=f.id;
    const d=document.createElement('span'); d.className='frd'; d.textContent=!f.c?'⏳':room?'🏠':isOn?'🟢':'⚫';
    const nm=document.createElement('b'); nm.textContent=f.n||frFmt(f.id);
    const sub=document.createElement('i'); sub.textContent=!f.c?'بانتظار قبوله':room?'عنده غرفة':isOn?'متصل':'غير متصل';
    row.append(pfAv(src(f),24),d,nm,sub);
    const btn=(txt,cls,fn,dis)=>{ const b=document.createElement('button'); b.className='tg '+cls; b.textContent=txt; b.disabled=!!dis; b.onclick=fn; row.append(b) };
    if(room&&NET.link==='off')btn('🚪 انضم','fjoin',()=>frJoinRoom(room));
    btn('📨 ادعُه','finv',()=>frInvite(f.id),!f.c||!isOn);
    btn('🎁','fgift'+(FR.gf===f.id?' on':''),()=>frGiftToggle(f.id),!f.c||!isOn);
    btn(FR.rm===f.id?'؟ متأكد':'✖','frm',()=>{ if(FR.rm===f.id){ FR.rm=null; frRemove(f.id) } else { FR.rm=f.id; frRender(); setTimeout(()=>{ if(FR.rm===f.id){ FR.rm=null; frRender() } },3000) } });
    el.append(row); if(FR.gf===f.id&&f.c)el.append(frGiftPicker(f.id))
  }
}
function frSync(){                                                                          // called whenever the lobby/net state is redrawn
  if(!$('frBox'))return;
  if($('frBox').open&&NET.tab&&!$('co').classList.contains('hide')&&!FR.on)frStart();
  if(FR.on&&frSig()!==FR.sig)frBeat();                                                       // my name, hero or open room changed
  if(!$('co').classList.contains('hide'))frRender();
}
$('frAdd').onclick=()=>{ const v=$('frAddIn').value; if(frAdd(v)){ $('frAddIn').value='' } };
$('frAddIn').addEventListener('keydown',e=>{ e.stopPropagation(); if(e.key==='Enter')$('frAdd').click() });
$('frAddIn').addEventListener('input',e=>{ const m=/[?&]f=([A-Za-z0-9]{8})/.exec(e.target.value); e.target.value=frNorm(m?m[1]:e.target.value).slice(0,8) });      // a pasted code (with a dash or spaces) or a whole friend link
$('frName').addEventListener('keydown',e=>e.stopPropagation());
$('frName').addEventListener('change',()=>{ S.fname=frClean($('frName').value); save(); if(FR.on)frBeat(); frRender() });
$('frCopy').onclick=()=>frCopy(frId(),'📋 اننسخ كودك');
$('frShare').onclick=frShare;
$('frBox').addEventListener('toggle',()=>{ if($('frBox').open&&frAvail())frStart(); frRender() });
document.addEventListener('visibilitychange',()=>{                                          // a tab left in the background gives its connection back after 2 minutes
  if(document.hidden){ clearTimeout(FR.sleep); FR.sleep=setTimeout(frStop,120000) }
  else { clearTimeout(FR.sleep); if(!FR.on&&frAvail()&&(frList().length||frPanelOpen()))frStart() } });
setInterval(frCardTick,500); setInterval(()=>{ if(FR.msg&&Date.now()-FR.msgT>6000){ FR.msg=''; frRender() } },1000);
/* a friend link  ?f=CODE  asks before adding; the parameter is removed from the address bar */
setTimeout(()=>{
  try{ const u=new URL(location.href), f=frNorm(u.searchParams.get('f')); if(u.searchParams.has('f')){ u.searchParams.delete('f'); history.replaceState(null,'',u.pathname+(u.search||'')+u.hash)
      if(frOk(f)&&f!==frId()&&!frList().some(x=>x.id===f)){
        const push=n=>FR.pend.push({k:'link',f,n:frClean(n),ts:Date.now()});
        if(frAvail())fetch(frUrl('u'+f+'/p')).then(r=>r.json()).then(p=>push(p&&p.n),()=>push('')); else push('') } } }catch(e){}
  if(frAvail()&&frList().length)frStart();
},1200);
