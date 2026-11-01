/* =============== NET: two players over the internet ===============
   No server of our own. Two interchangeable transports share one tiny interface  open(code, role, onmsg, onstate) -> {send(msg), close()}:
     'loop' : BroadcastChannel (two tabs of the same browser: tests and local tinkering)
     'rtdb' : Firebase Realtime Database through plain REST + Server-Sent Events (no SDK). Each side PUTs messages into a ring of 128 slots under
              /dhr/<code>/<h|g>/s<n> and listens to the OTHER side's folder. NET_CFG.url (or the player's own paste in the lobby, S.nu) is the database URL.
   CO-OP = lockstep with input delay: both machines run the SAME deterministic simulation (the one the local co-op already uses) and only exchange inputs.
     frame f is simulated only when both players' input for f is known; our own input is sampled D frames ahead (D from the measured ping), so the
     local player never waits unless the network is slower than D. Every 30 frames both sides hash the state; if the guest's differs (different float
     rounding in another browser, a lost packet...) it asks the host for a snapshot of that frame, restores it and re-simulates up to now.
   RACE = both run their own ordinary single-player engine on the same level; only positions (10 Hz) and the finish are exchanged; the host arbitrates.
   Nothing here touches the simulation: with G.co null and G.race null every function below is idle. */
const NET_V='__BUILD__';
const NET_CFG={url:'https://don-t-die-habibi-default-rtdb.europe-west1.firebasedatabase.app'};      // the project's Realtime Database (Belgium); S.nu overrides it, S.nu='-' forces the same-browser loopback (tests)
const NET={link:'off',role:null,code:'',kind:'',tr:null,peer:null,rtt:0,D:8,mode:'co',tab:false,me:0,f:0,msg:'',st:'',lastRx:0};
const KR={l:false,r:false,j:false,jp:false,a:false,ap:false};      // raw keys while a lockstep game runs (the simulation reads K/K2, filled from the agreed per-frame input)
const netLock=()=>!!(G.co&&!G.co.local);
const NET_AL='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function fnv(s){ let h=0x811c9dc5; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,0x01000193) } return h>>>0 }
const netDb=()=>S.nu==='-'?'':String(S.nu||NET_CFG.url||'').trim().replace(/\/+$/,'');
const netKind=()=>netDb()?'rtdb':'loop';

/* ---- transports ---- */
function tpLoop(code,role,onmsg){
  const bc=new BroadcastChannel('dhr-'+code);
  bc.onmessage=e=>{ const d=e.data; if(d&&d.r!==role)onmsg(d.m) };
  return {send:m=>{ bc.postMessage({r:role,m}) }, close:()=>bc.close()};
}
function tpRtdb(code,role,onmsg,onstate){
  const base=netDb()+'/dhr/'+code, other=role==='h'?'g':'h', seen=new Set(); let seq=Date.now()*1000, es=null, closed=false;
  const take=(q,m)=>{ if(seen.has(q))return; seen.add(q); if(seen.size>800)seen.delete(seen.values().next().value); let o=null; try{ o=JSON.parse(m) }catch(e){} if(o)onmsg(o) };
  const ev=e=>{ let d=null; try{ d=JSON.parse(e.data) }catch(_){} if(!d||d.data==null)return;
    const segs=String(d.path||'/').split('/').filter(Boolean), v=d.data;
    const slots=segs.length===0?Object.values(v):(segs.length===1?[v]:[]);
    slots.filter(s=>s&&typeof s.q==='number'&&typeof s.m==='string').sort((a,b)=>a.q-b.q).forEach(s=>take(s.q,s.m)) };
  const start=()=>{ if(closed)return; es=new EventSource(base+'/'+other+'.json');
    es.addEventListener('put',ev); es.addEventListener('patch',ev);
    es.onopen=()=>onstate&&onstate('open'); es.onerror=()=>onstate&&onstate('err') };
  if(role==='h')fetch(base+'.json',{method:'DELETE'}).catch(()=>{}).then(start); else start();
  return {
    send(m){ const q=++seq; fetch(base+'/'+role+'/s'+(q%128)+'.json?print=silent',{method:'PUT',body:JSON.stringify({q,m:JSON.stringify(m)})}).catch(()=>{}) },
    close(){ closed=true; if(es)es.close(); fetch(base+(role==='h'?'':'/g')+'.json',{method:'DELETE'}).catch(()=>{}) }       // the host removes the whole room, a guest only its own folder
  };
}

/* ---- session: rooms, handshake, ping ---- */
const netNow=()=>performance.now();
function netOpen(role,code){
  netClose();
  const kind=netKind();
  Object.assign(NET,{role,code,kind,link:role==='h'?'wait':'join',peer:null,rtt:0,pings:[],lastRx:netNow(),joinAt:netNow(),msg:'',st:'',me:role==='h'?0:1,bye:false});
  NET.tr=(kind==='rtdb'?tpRtdb:tpLoop)(code,role,netRecv,s=>{ NET.st=s; netRender() });
  NET.timer=setInterval(netTimer,250);
  netRender();
}
function netClose(){
  const N=NET; if(N.timer){ clearInterval(N.timer); N.timer=0 } if(N.gtimer){ clearInterval(N.gtimer); N.gtimer=0 }
  if(N.tr){ const t=N.tr; N.tr=null; setTimeout(()=>t.close(),700) }                                    // keep the folder a moment so the 'bye' can still be read
}
function netHost(){
  const code=Array.from({length:5},()=>NET_AL[Math.random()*NET_AL.length|0]).join('');
  netOpen('h',code); Snd.ui&&Snd.ui();
}
function netJoin(code){
  code=String(code||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(code.length<4){ NET.msg='اكتب كود الغرفة (5 خانات)'; netRender(); return }
  netOpen('g',code); netSendJoin();
}
const netHello=()=>({v:NET_V,h:S.hero,s:heroStage(S.hero),b:Math.max(1,S.best)});
function netSendJoin(){ if(NET.tr)NET.tr.send(Object.assign({t:'jn'},netHello())) }
function netTimer(){
  const N=NET, now=netNow(); if(!N.tr)return;
  if(N.link==='join'){ if(now-N.joinAt>15000){ netLeave('ما لقيت الغرفة 🤷 تأكد من الكود'); return } if(!N.jr||now-N.jr>1500){ N.jr=now; netSendJoin() } return }
  if(N.link==='wait')return;
  if(now-N.lastRx>20000){ netLeave('انقطع الاتصال 📡'); return }
  if(!N.pgAt||now-N.pgAt>2000){ N.pgAt=now; N.tr.send({t:'pg',ts:now}) }
  if(N.link==='play'&&N.lock){ netSend(); netStallUi() }
}
function netRecv(m){
  const N=NET; if(!m||!N.tr&&m.t!=='bye')return; N.lastRx=netNow();
  switch(m.t){
    case 'jn':
      if(N.role!=='h')return;
      if(m.v!==NET_V){ N.tr.send({t:'no',w:'v'}); return }
      N.peer={hero:m.h,stage:m.s,best:m.b}; if(N.link==='wait')N.link='conn';
      N.tr.send(Object.assign({t:'wl'},netHello())); netLobbySend(); netRender(); break;
    case 'wl':
      if(N.role!=='g')return; N.peer={hero:m.h,stage:m.s,best:m.b}; if(N.link==='join'){ N.link='conn'; N.msg='' } netRender(); break;
    case 'no': netLeave(m.w==='v'?'نسخة اللعبة مختلفة عن صاحبك — حدّثوا الصفحة الاتنين 🔄':'ما قدرت أدخل الغرفة'); break;
    case 'pg': N.tr.send({t:'pn',ts:m.ts}); break;
    case 'pn': { const r=netNow()-m.ts; N.rtt=N.rtt?N.rtt*.7+r*.3:r; N.pings.push(r); if(N.pings.length>7)N.pings.shift(); netRender() } break;
    case 'lb': if(N.role==='g'&&N.link!=='play')netLobbyRecv(m); break;
    case 'st': if(N.role==='g')netBegin(m); break;
    case 'i': netGotInput(m); break;
    case 'h': netGotHash(m); break;
    case 'rs': if(N.role==='h'&&N.snaps&&N.snaps[m.f])N.tr.send({t:'sn',f:m.f,s:N.snaps[m.f]}); break;
    case 'sn': if(N.role==='g'&&N.link==='play'&&N.lock)netApply(m.f,m.s); break;
    case 'g': raceGot(m); break;
    case 'fn': raceFin(m); break;
    case 'rr': raceResult(m); break;
    case 'em': if(N.link==='play')rxGot(m); break;
    case 'ab': if(N.link==='play')netToLobby(m.w?CO.msg:'صاحبك رجع للغرفة 👋'); break;
    case 'bye': netLeave('صاحبك طلع من الغرفة 👋',true); break;
  }
}
function netLeave(msg,quiet){
  const N=NET, was=N.link!=='off'; if(!was&&!N.tr)return;
  if(!quiet&&N.tr)try{ N.tr.send({t:'bye'}) }catch(e){}
  netClose(); raceStop(); N.link='off'; N.peer=null; N.lock=false; N.msg=msg||'';
  for(const f of ['l','r','j','jp','a','ap'])KR[f]=false;
  $('netSt').classList.add('hide');
  if(G.co||G.race||G.state==='play'||G.state==='dead'||G.state==='win'){ const m=msg; goTitle(); if(m){ setTimeout(()=>say(m,'any',3.2),50) } return }
  if(G.state==='co'){ N.tab=true; coRender() }
}
function netToLobby(msg){                                  // back to the online lobby, the connection stays
  const N=NET; if(N.link==='off')return; raceStop(); N.lock=false; N.link='conn'; G.co=null;
  for(const f of ['l','r','j','jp','a','ap'])KR[f]=false;
  $('netSt').classList.add('hide'); $('raceBar').classList.add('hide'); $('raceCd').classList.add('hide'); $('raceRes').classList.add('hide');
  N.tab=true; coOpen(msg||'');
}

/* ---- lobby sync (host chooses) ---- */
function netLobbySend(){ const N=NET; if(N.role!=='h'||!N.tr||N.link==='off')return; N.tr.send({t:'lb',mode:N.mode,n:CO.sel.n,df:coDf(),cu:CO.sel.custom?encodeCustom(CO.sel.custom):''}) }
function netLobbyRecv(m){
  NET.mode=m.mode==='race'?'race':'co'; CO.sel.n=m.n|0||1; CO.sel.df=CO_DFS.includes(m.df)?m.df:null;
  if(m.cu){ const r=decodeCustom(m.cu); CO.sel.custom=r.err?null:r.c } else CO.sel.custom=null;
  if(G.state==='co')coRender();
}
const netHeroes=()=>NET.role==='h'?[S.hero,NET.peer.hero]:[NET.peer.hero,S.hero];
const netStages=()=>NET.role==='h'?[heroStage(S.hero),NET.peer.stage]:[NET.peer.stage,heroStage(S.hero)];
function netD(){ const r=NET.pings.length>=2?NET.pings.slice().sort((a,b)=>a-b)[NET.pings.length>>1]:(NET.rtt||120); return clamp(Math.ceil(r/2/16.7)+3,4,16) }
function netStartHost(){                                       // host presses start
  const N=NET; if(N.role!=='h'||N.link!=='conn'||!N.peer)return;
  const s=CO.sel;
  if(!s.custom&&!coPlayable(s.n)){ CO.msg='هالمرحلة مو متاحة'; coRender(); return }
  const o={t:'st',mode:N.mode,lv:s.n,cu:s.custom?encodeCustom(s.custom):'',df:coDf(),D:netD(),hero:netHeroes(),stage:netStages(),rtt:N.rtt|0};
  N.tr.send(o); netBegin(o);
}
function netBegin(o){
  const N=NET; if(N.link==='off'||!N.peer)return;
  N.mode=o.mode; N.D=o.D; N.link='play'; N.msg='';
  for(const id of ['co','title','menu','card','ed'])$(id).classList.add('hide');
  const cu=o.cu?(()=>{ const r=decodeCustom(o.cu); return r.err?null:r.c })():null;
  if(o.mode==='race'){ raceBegin(o,cu); return }
  N.lock=true; N.dl=NET_DL; N.D=N.dl; N.f=0; N.c=0; N.smp=-1; N.loc={}; N.rem={}; N.used={}; N.snp={}; N.pl={}; N.snaps={}; N.fx=[]; N.rb=null; N.hh={}; N.rh={}; N.ackR=N.dl-1; N.remHi=N.dl-1; N.remLast=0; N.lm=-1; N.stallT=0; N.stallTot=0; N.bad=0; N.rsAt=0; N.fixes=0; N.nrb=0; N.rbFr=0; N.fxN={}; N.maxRb=0; N.adv=0; N.adj=-1;
  N.startAt=netNow()+(N.role==='h'?clamp((N.rtt||0)/2,0,400):0);       // the host waits half a ping so both machines start the same frame at about the same moment
  for(let i=0;i<N.dl;i++){ N.loc[i]=0; N.rem[i]=0 }
  for(const f of ['l','r','j','jp','a','ap'])KR[f]=false;
  coStart({hero:o.hero,stage:o.stage,level:o.lv,custom:cu,local:false,me:N.me,df:o.df});
}

/* ---- co-op netcode: prediction + rollback ----
   Our own key presses go straight into the simulation (after NET_DL frames ~ 33 ms). The other player's keys are PREDICTED (whatever he was holding, no new
   presses) until the real ones arrive; if a prediction turns out wrong we restore the snapshot of that frame and re-simulate up to now with the truth.
   Snapshots are ~2 KB and a step costs ~0.04 ms, so even a 20 frame rollback is invisible. 'Confirmed' = every frame before N.c was simulated with the other
   side's real input: only those are hashed (cross-checked with the other machine) and only then do deaths/wins make their sounds and cards (a rolled back
   death must never be heard). During a re-simulation the audio is hushed (HUSH). */
const NET_DL=2, NET_MAXSPEC=24;
const IN_B={l:1,r:2,j:4,jp:8,a:16,ap:32};
function netSample(){ let m=0; for(const k in IN_B)if(KR[k])m|=IN_B[k]; KR.jp=false; KR.ap=false; return m }
function setIn(o,m){ o.l=!!(m&1); o.r=!!(m&2); o.j=!!(m&4); o.jp=!!(m&8); o.a=!!(m&16); o.ap=!!(m&32) }
function netSend(){
  const N=NET; if(!N.tr||!N.lock)return;
  const hi=N.smp+N.dl, from=Math.max(N.ackR+1,hi-90); if(hi<from)return; let a='';          // only frames we really sampled (smp = the newest sampled frame)
  for(let f=from;f<=hi;f++)a+=String.fromCharCode(48+(N.loc[f]|0));
  N.tr.send({t:'i',f:from,a,k:N.remHi,cf:N.f});
}
function netGotInput(m){
  const N=NET; if(!N.lock||typeof m.a!=='string')return; const ri=1-N.me;
  for(let i=0;i<m.a.length;i++){ const fr=m.f+i, v=m.a.charCodeAt(i)-48; if(fr<N.c||N.rem[fr]!==undefined)continue; N.rem[fr]=v;
    if(fr<N.f){ const u=N.used[fr]; if(u&&u[ri]!==v){ if(N.rb==null||fr<N.rb)N.rb=fr; if((v&8)&&!(u[ri]&8)&&!HUSH&&Snd.jump)Snd.jump() } } }      // late news: he jumped a moment ago
  while(N.rem[N.remHi+1]!==undefined)N.remHi++; if(N.rem[N.remHi]!==undefined)N.remLast=N.rem[N.remHi];
  if(m.k>N.ackR)N.ackR=m.k;
  if(typeof m.cf==='number'&&N.rtt)N.adv=N.adv*.9+((N.f-m.cf)-N.rtt/2/16.7)*.1;                 // how many frames we run ahead of the other machine
}
const netFx=x=>{ const N=NET; if((x.k==='c'||x.k==='n')&&N.fx.some(y=>y.k===x.k))return; x.f=N.f; N.fx.push(x) };                                          // called by die()/winLevel() while online
function netRunFx(x){
  const keep=P; NET.fxN[x.k]=(NET.fxN[x.k]||0)+1;
  if(NET.keep)(NET.fxLog||(NET.fxLog=[])).push([x.k,x.f,NET.f,NET.c,G.state,G.cardShown,+G.deadT.toFixed(2)]);
  if(x.k==='d'){ const q=PLY[x.pi]; if(q)P=q; try{ dieFx(x.c,x.e) } finally{ P=keep } } else if(x.k==='w')winFx(); else if(x.k==='c'){ if(G.state==='dead'&&!G.cardShown)showCard() } else if(x.k==='n'){ if(G.state==='win'){ if(NET.tr)NET.tr.send({t:'ab',w:1}); nextLevel() } }          // tell him too: he may be missing our last few inputs (we stop sending now)
}
function netFrame(f){                                       // fill K (ours) and K2 (his) for frame f, known or predicted
  const N=NET, l=N.loc[f]|0, r=N.rem[f]!==undefined?N.rem[f]:(N.remLast&~40);
  N.used[f]=N.me===0?[l,r]:[r,l]; setIn(K,l); setIn(K2,r);
}
function netPre(){                                          // true = the next frame may run now
  const N=NET; if(N.link!=='play'||!N.lock)return false;
  if(netNow()<N.startAt)return false;
  if(N.rb!=null)netRollback();
  netConfirm();
  if(!N.lock||N.link!=='play')return false;
  if(N.f-N.c>=NET_MAXSPEC){ if(!N.stallT)N.stallT=netNow(); netStallUi(); return false }      // too far ahead of what we know: wait
  if(N.stallT){ N.stallTot+=netNow()-N.stallT; N.stallT=0; netStallUi() }
  if(N.adv>3&&N.f%30===0&&N.adj!==N.f){ N.adj=N.f; N.adv-=1; return false }                  // we run ahead of the other machine: give up a step now and then
  if(N.smp!==N.f){ N.smp=N.f; const m=netSample(); N.loc[N.f+N.dl]=m; if(m!==N.lm||N.f%4===0){ N.lm=m; netSend() } }
  netFrame(N.f); N.snp[N.f]=snap(true); N.pl[N.f]=G.state==='play';
  return true;
}
function netPost(){ NET.f++ }
function netRollback(){
  const N=NET, r=N.rb, head=N.f; N.rb=null;
  const s=N.snp[r]; if(s===undefined){ N.bad++; return }
  restore(s); N.fx=N.fx.filter(x=>x.f<r); N.nrb++; N.rbFr+=head-r; if(head-r>N.maxRb)N.maxRb=head-r;
  HUSH=true;
  try{ for(N.f=r;N.f<head;N.f++){ if(!N.lock||G.state==='co')break; if(N.f>r){ N.snp[N.f]=snap(true); N.pl[N.f]=G.state==='play' } netFrame(N.f); update(1/60) } }
  finally{ HUSH=false }
  if(N.lock)N.f=head;
}
function netConfirm(){
  const N=NET;
  while(N.c<N.f&&N.rem[N.c]!==undefined){
    const f=N.c;
    if(f%30===0&&N.pl[f]&&N.snp[f]!==undefined){                 // hash of the now final state at the start of frame f
      const h=fnv(N.snp[f]); N.hh[f]=h; delete N.hh[f-900];
      if(N.role==='h'||N.keep){ N.snaps[f]=N.snp[f]; delete N.snaps[f-(N.keep?3000:300)] }
      N.tr.send({t:'h',f,h});
      if(N.rh[f]!==undefined){ netCmp(f,N.rh[f]); delete N.rh[f] }
    }
    N.c++; const o=f-1; delete N.snp[o]; delete N.used[o]; delete N.loc[o]; delete N.rem[o]; delete N.pl[o];
  }
  while(N.fx.length&&N.fx[0].f<N.c)netRunFx(N.fx.shift());
}
function netGotHash(m){ const N=NET; if(!N.lock)return; if(N.hh[m.f]!==undefined)netCmp(m.f,m.h); else N.rh[m.f]=m.h }
function netCmp(f,h){
  const N=NET; if(N.hh[f]===h)return; N.bad++;
  if(N.role==='g'&&netNow()-N.rsAt>1500){ N.rsAt=netNow(); N.tr.send({t:'rs',f}) }
}
function netApply(f,s){                                     // guest: adopt the host's state of frame f, then replay up to now
  const N=NET; N.fixes++; N.snp[f]=s; N.pl[f]=true;
  if(f<N.f){ N.rb=f; netRollback() }
  else { restore(s); const old=N.f; N.f=f; N.c=Math.max(N.c,f); N.remHi=Math.max(N.remHi,f-1); for(let g=old+N.dl;g<f+N.dl;g++)if(N.loc[g]===undefined)N.loc[g]=0; N.smp=-1 }
  netSend();
}
function netStallUi(){
  const N=NET, el=$('netSt'), w=N.stallT?netNow()-N.stallT:0;
  if(w>500){ el.textContent=w>5000?'📡 الاتصال ضعيف... بستنى صاحبك':'⏳ بستنى صاحبك...'; el.classList.remove('hide') } else el.classList.add('hide');
}
const netEscRace=()=>netEsc();
function netEsc(){                                          // Esc while online: first press warns, second leaves to the lobby
  const N=NET, now=netNow();
  if(N.escAt&&now-N.escAt<2500){ N.escAt=0; try{ N.tr.send({t:'ab'}) }catch(e){} netToLobby('رجعتوا للغرفة'); return }
  N.escAt=now; say('اضغط Esc مرة تانية لترجعوا للغرفة','any',2.4);
}

/* ---- race: two single-player engines, positions exchanged ----
   Fairness: both machines time themselves from "go" with the WALL clock (not the level timer, which restarts at every respawn). The host's countdown is
   half a ping longer, so the two "go" moments are about the same real moment. Whoever's own finish time is lower wins; the host is only the clerk:
   - both times known -> compare (closer than RACE_TIE = a draw)
   - only the guest finished -> the host must not have finished before him: once the host's own clock passed his time + RACE_TIE he wins at once
   - only the host finished -> wait a moment (RACE_TIE + one way delay + 0.1 s) in case the guest's message is still on its way
   The opponent's ghost is drawn where he should be NOW: his last report advanced by its age (our clock - his clock at the moment he sent it). */
const RACE_CD=3.2, RACE_TIE=.08;
const raceT=r=>(netNow()-r.goAt)/1000;                       // seconds since "go" on this machine (negative while counting down)
function raceJudge(tm0,tm1,now,rtt){                          // the host's view, all in seconds since go; null = has not finished; returns 0 host / 1 guest / -1 draw / undefined = not decided yet
  if(tm0!=null&&tm1!=null)return Math.abs(tm0-tm1)<=RACE_TIE?-1:(tm0<tm1?0:1);
  if(tm1!=null)return now>=tm1+RACE_TIE?1:undefined;
  if(tm0!=null)return now>=tm0+clamp((rtt||0)/2000+.18,.18,1)?0:undefined;
}
function raceBegin(o,cu){
  const N=NET;
  G.race={df:o.df,hold:0,goAt:0,opp:newPlayer(0),tx:null,over:false,done:false,res:null,seen:false,fn:null,tm1:null,fnAt:0};
  const op=G.race.opp; op.hid=N.peer.hero; op.hst=N.peer.stage; op.run=0;
  if(cu)startCustom(cu,'race'); else startGame(o.lv);
  const r=G.race; r.hold=RACE_CD+(N.role==='h'?(N.rtt||0)/2000:0); r.goAt=netNow()+r.hold*1000;
  $('raceBar').classList.remove('hide'); $('raceRes').classList.add('hide'); raceCdUi();
  N.gtimer=setInterval(raceSend,50);
}
function raceStop(){ if(NET.gtimer){ clearInterval(NET.gtimer); NET.gtimer=0 } if(G.race){ G.race=null } const e=$('raceBar'); if(e)e.classList.add('hide'); const c=$('raceCd'); if(c)c.classList.add('hide') }
function raceSend(){
  const r=G.race; if(!r||!NET.tr||!P)return;
  NET.tr.send({t:'g',x:Math.round(P.x*10)/10,y:Math.round(P.y*10)/10,vx:Math.round(P.vx),vy:Math.round(P.vy),fc:P.face,og:P.onGround?1:0,dd:P.dead?1:0,ex:L.exitTx*TS,rt:+raceT(r).toFixed(3)});
}
function raceGot(m){
  const r=G.race; if(!r)return; r.tx={x:m.x,y:m.y,vx:m.vx,vy:m.vy,fc:m.fc,og:m.og,dd:m.dd,ex:m.ex,rt:m.rt}; r.seen=true;
}
function raceTick(dt){                                       // every animation frame: ease the ghost toward where he should be now, keep the HUD bar, judge (host)
  const r=G.race; if(!r)return;
  if(r.hold>0){ r.hold=Math.max(0,(r.goAt-netNow())/1000); raceCdUi() }
  const o=r.opp, t=r.tx;
  if(t){ const now=raceT(r), age=t.rt!=null?clamp(now-t.rt,0,.4):.1, live=!t.dd, k=Math.min(1,dt*14);
    const tx=t.x+(live?t.vx*age:0), ty=t.og||!live?t.y:Math.min(t.y+120,t.y+t.vy*age+GRAV*.5*age*age);
    o.x+=(tx-o.x)*k; o.y+=(ty-o.y)*k; o.vx=t.vx; o.vy=t.vy; o.face=t.fc; o.onGround=!!t.og; o.dead=!!t.dd }
  o.run=(o.run||0)+Math.abs(o.vx)*dt*.03; o.blink=(o.blink||0);
  const ex=Math.max(1,L.exitTx*TS), me=clamp(P.x/ex,0,1), op=t?clamp(o.x/ex,0,1):0;
  $('rbMe').style.left=(me*92)+'%'; $('rbOp').style.left=(op*92)+'%'; $('rbOp').style.opacity=t?1:.25;
  if(!r.res){
    if(NET.role==='h'){ if(r.fn!=null||r.tm1!=null)raceJudgeNow() }
    else if(r.done&&netNow()-r.fnAt>1500){ r.fnAt=netNow(); NET.tr.send({t:'fn',tm:r.fn}) }       // the guest repeats his time until the verdict arrives
  }
}
function raceCdUi(){
  const r=G.race, e=$('raceCd'); if(!r||r.hold<=0){ e.classList.add('hide'); return }
  const n=Math.ceil(r.hold-.2); e.textContent=n>0?String(n):'يلّا!'; e.classList.remove('hide');
}
function raceDraw(c){
  const r=G.race; if(!r||!r.seen)return;
  const keep=P; P=r.opp; c.save(); c.globalAlpha=.6;
  if(!P.dead)drawPlayer(c);
  c.restore(); P=keep;
  const x=r.opp.x+PW/2, y=r.opp.y+PH-(typeof SPR_H==='number'&&look3()?SPR_H:44)-4;
  c.save(); c.textAlign='center'; c.lineJoin='round'; c.fillStyle=CO_COL[1]; c.strokeStyle='#000'; c.lineWidth=2;
  c.beginPath(); c.moveTo(x-6,y-8); c.lineTo(x+6,y-8); c.lineTo(x,y); c.closePath(); c.fill(); c.stroke(); c.restore();
}
function raceFinish(){                                       // I reached the door
  const r=G.race; if(!r||r.done)return; r.done=true; r.fn=+raceT(r).toFixed(3);
  if(NET.role==='g'){ r.fnAt=netNow(); NET.tr.send({t:'fn',tm:r.fn}) } else raceJudgeNow();
  if(!r.res){ $('raceCd').classList.add('hide'); $('raceRes').innerHTML='<div class="rr2">🚪 وصلت! بستنى النتيجة...</div>'; $('raceRes').classList.remove('hide') }
}
function raceFin(m){ if(NET.role==='h'&&G.race&&!G.race.res&&typeof m.tm==='number'){ G.race.tm1=m.tm; raceJudgeNow() } }
function raceJudgeNow(){ const r=G.race; if(!r||r.res||NET.role!=='h')return; const w=raceJudge(r.fn,r.tm1,raceT(r),NET.rtt); if(w!==undefined)raceDecide(w) }
function raceDecide(w){
  const r=G.race; if(!r||r.res)return;
  const m={t:'rr',w,tm:[r.fn,r.tm1]}; NET.tr.send(m); raceResult(m);
}
function raceResult(m){
  const r=G.race; if(!r||r.res)return; r.res=m; r.over=true;
  const mine=NET.role==='h'?0:1, tie=m.w<0, won=m.w===mine, my=m.tm[mine], th=m.tm[1-mine], parts=[];
  if(my!=null)parts.push('وقتك '+my.toFixed(2)+' ث'); if(th!=null)parts.push('وقت صاحبك '+th.toFixed(2)+' ث');
  if(my!=null&&th!=null)parts.push('الفرق '+Math.abs(my-th).toFixed(2)+' ث');
  $('raceCd').classList.add('hide');
  $('raceRes').innerHTML='<div class="rr1">'+(tie?'🤝 تعادل!':won?'🏆 كسبت!':'😭 خسرت')+'</div><div class="rr2">'+parts.join(' · ')+'</div><button class="btn" id="rrBack">↩ ارجعوا للغرفة</button>';
  $('raceRes').classList.remove('hide');
  $('rrBack').onclick=()=>{ try{ NET.tr.send({t:'ab'}) }catch(e){} netToLobby('') };
  Snd.stopMusic&&Snd.stopMusic();
}

/* ---- lobby UI (the online half of the co-op lobby) ---- */
const CO_BLURB_L='الاتنين لازم يوصلوا الباب مع بعض · إذا واحد مات بيرجعوا الاتنين · ما بتقدروا تبعدوا عن بعض أكتر من شاشة';
function netRender(){
  const N=NET, on=N.tab, conn=N.link==='conn'||N.link==='play';
  if(!$('coNet'))return;
  $('coTabL').classList.toggle('on',!on); $('coTabN').classList.toggle('on',on);
  $('coNet').classList.toggle('hide',!on); $('coGo').classList.toggle('hide',on); $('coH2L').classList.toggle('hide',on); $('coH2R').classList.toggle('hide',on);
  $('nMsg').textContent=on?(N.msg||''):'';
  if(!on){ $('nGo').classList.add('hide'); $('nGuestWait').classList.add('hide'); $('coBlurb').textContent=CO_BLURB_L; return }
  const off=N.link==='off';
  $('nHostBox').classList.toggle('hide',!off); $('nRoom').classList.toggle('hide',off);
  $('nCodeBig').textContent=N.code||'';
  const st=N.link==='wait'?'⏳ بستنى صاحبك يدخل بالكود':N.link==='join'?'🔌 عم أتصل...':conn?('✅ متصلين'+(N.rtt?' · '+Math.round(N.rtt)+' ms':'')):'';
  $('nStat').textContent=st+(N.kind==='loop'&&N.link!=='off'?' (نفس المتصفح فقط — حط رابط القاعدة للعب عن بعد)':'');
  $('nModeCo').classList.toggle('on',N.mode==='co'); $('nModeRace').classList.toggle('on',N.mode==='race');
  for(const id of ['nModeCo','nModeRace'])$(id).disabled=!(N.role==='h'||off);
  $('nDb').value=document.activeElement===$('nDb')?$('nDb').value:(S.nu&&S.nu!=='-'?S.nu:'');
  $('nGo').classList.toggle('hide',!(N.role==='h'&&N.link==='conn'));
  $('nGuestWait').classList.toggle('hide',!(N.role==='g'&&conn));
  $('coPrev').disabled=!(N.role==='h'&&conn)||!!CO.sel.custom; $('coNext').disabled=$('coPrev').disabled; $('coCodeBtn').disabled=!(N.role==='h'&&conn);
  for(const id of ['coPrev10','coNext10','coLvIn'])$(id).disabled=$('coPrev').disabled; for(const b of document.querySelectorAll('#co [data-cdf]'))b.disabled=!(N.role==='h'&&conn)||!!CO.sel.custom;
  $('coBlurb').textContent=N.mode==='race'?'سباق: نفس المرحلة، أول واحد يوصل الباب بيكسب · كل واحد بيشوف شبح التاني · بلا مكافآت':'تعاون: الاتنين لازم يوصلوا الباب مع بعض · إذا واحد مات بيرجعوا الاتنين · بلا مكافآت';
  frSync();
}
function netTab(on){
  NET.tab=!!on; if(on&&NET.link==='off'){ NET.msg='' } if(on&&!FR.shown){ FR.shown=true; $('frBox').open=frList().length>0 } coRender();
}
$('coTabL').onclick=()=>netTab(false); $('coTabN').onclick=()=>netTab(true);
$('nHost').onclick=()=>{ Snd.init(); netHost() };
$('nJoin').onclick=()=>{ Snd.init(); netJoin($('nCode').value) };
$('nCode').addEventListener('keydown',e=>{ e.stopPropagation(); if(e.key==='Enter')netJoin($('nCode').value) });
$('nCode').addEventListener('input',e=>{ e.target.value=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'') });
$('nDb').addEventListener('keydown',e=>e.stopPropagation());
$('nDb').addEventListener('change',()=>{ const v=$('nDb').value.trim(); S.nu=/^https?:\/\//i.test(v)?v.replace(/\/+$/,''):''; save(); NET.msg=S.nu?'✅ انحفظ رابط القاعدة':''; netRender() });
$('nGo').onclick=netStartHost;
$('nLeave').onclick=()=>netLeave('');
$('nCopy').onclick=()=>{ const t=NET.code; try{ navigator.clipboard.writeText(t).then(()=>{ NET.msg='📋 اننسخ الكود'; netRender() },()=>{}) }catch(e){} };
$('nModeCo').onclick=()=>{ NET.mode='co'; netLobbySend(); netRender() };
$('nModeRace').onclick=()=>{ NET.mode='race'; netLobbySend(); netRender() };
