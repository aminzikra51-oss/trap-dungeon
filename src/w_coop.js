/* =============== CO-OP: two players, one level (foundation) ===============
   Rules (kept deliberately simple so two screens can run the SAME simulation later):
   - shared fate: if either player dies, both go back to the last checkpoint (the death card names who did it)
   - the two players cannot pull further apart than CO_TETHER pixels (a move that would widen the gap past it is simply refused), so one camera always shows both
   - the level ends when BOTH stand at the door; players do not collide with each other
   - no coins, stars, XP or medals are earned (it is a sandbox like jumping ahead): progress stays honest
   Everything single-player is untouched: G.co is null there and none of these functions run.
   Engine trick: the whole game reads the global P (current player) and K (current input). coEach() runs a function once per living player with P/K pointing at that player.
   A player's input lives in K when it is the local one (G.co.me) and in K2 otherwise (second player on the same keyboard, or the remote player over the net). */
const CO_TETHER=600, CO_COL=['#ffd23f','#4dd0ff'], KF=['l','r','j','jp','a','ap','g','gp'];
function coSpawn(tx){
  const co=G.co; PLY=[0,1].map(i=>{ const p=newPlayer(tx+i); p.hid=co.hero[i]; p.hst=co.stage[i]; p.hsk=skinSan(co.hero[i],co.skin&&co.skin[i]); p.idx=i; return p }); P=PLY[co.me];
  for(const f of KF)K2[f]=false;
}
function kSwap(){ for(const f of KF){ const t=K[f]; K[f]=K2[f]; K2[f]=t } }
function coEach(fn,order){                        // fn runs once per living player, with P and K pointing at him (order = optional list of player indexes)
  const keep=P, me=G.co.me, ord=order||PLY.map((_,i)=>i);
  for(const i of ord){ const q=PLY[i]; if(q.dead||G.state!=='play')continue; P=q;
    if(i===me)fn(); else { kSwap(); try{ fn() } finally { kSwap() } } }
  P=keep;
}
function coAim(e){                                // an entity talks to the NEAREST living player
  const x=entX(e); let best=null, bd=1e9;
  for(const q of PLY){ if(q.dead)continue; const d=Math.abs(q.x+PW/2-x); if(d<bd){ bd=d; best=q } }
  P=best||PLY[G.co.me];
}
const coHome=()=>{ P=PLY[G.co.me] };
const coMid=()=>PLY.length?(PLY[0].x+PLY[1].x)/2+PW/2:(P?P.x+PW/2:0);
const coAtExit=()=>PLY.every(q=>q.x+PW/2>L.exitTx*TS+4&&q.onGround);

/* ---- carrying (co-op) ----
   G / S / down: stand next to your partner and press it to pick him up (he rides on your head and cannot move; he can wriggle free with jump after a moment).
   Press it again to throw him: holding left/right throws him forward and up, holding nothing tosses him straight up. He gets his own double jump back.
   While you carry him you are slower and jump lower. Everything here is part of the shared simulation (inputs only travel over the net). */
const CARRY_R=34, THROW_VX=320, THROW_VY=-600, TOSS_VY=-720;
function carryDrop(h,q){ if(h)h.hold=-1; if(q){ q.hb=-1; q.hbt=0; q.vx=h?h.vx:0 } }
function carryStep(dt){                                   // runs inside coEach for the current player P (K = his input); true = P is carried and does not move on his own
  const p=P, o=PLY[1-p.idx], gp=K.gp; K.gp=false; if(p.gcd>0)p.gcd-=dt;
  if(p.hb>=0){                                            // somebody carries me
    const h=PLY[p.hb]; K.ap=false;
    if(!h||h.dead||h.hold!==p.idx){ p.hb=-1; p.hbt=0; return false }
    if(K.jp&&p.hbt>.3){ K.jp=false; carryDrop(h,p); p.vy=-260; p.onGround=false; return false }
    K.jp=false; p.hbt+=dt; p.x=h.x; p.y=h.y-PH-2; p.vx=0; p.vy=0; p.onGround=true; p.stand=0; p.dj=false; p.coy=.1; return true }
  if(p.hold>=0){                                          // I carry him
    const q=PLY[p.hold];
    if(!q||q.dead||q.hb!==p.idx||(L.wt&&waterAt(p))){ carryDrop(p,q); return false }
    if(gp&&p.gcd<=0){ const dir=(K.r?1:0)-(K.l?1:0); carryDrop(p,q); q.onGround=false; q.stand=0; q.coy=0; q.dj=false; q.air=0; q.buf=0; q.thr=1;
      if(dir){ q.vx=dir*THROW_VX+p.vx*.25; q.vy=THROW_VY; q.face=dir } else { q.vx=p.vx*.25; q.vy=TOSS_VY }
      p.gcd=.35; q.gcd=.35; if(!HUSH_FX())Snd.whoosh&&Snd.whoosh(); if(!SIM)puff(q.x+PW/2,q.y+PH,6) }
    return false }
  if(gp&&p.gcd<=0&&o&&!o.dead&&o.hb<0&&o.hold<0&&p.onGround&&o.onGround&&p.stand>=0&&o.stand>=0&&!(L.wt&&waterAt(p))
     &&Math.abs(p.x-o.x)<=CARRY_R&&Math.abs(p.y-o.y)<=20){ p.hold=o.idx; o.hb=p.idx; o.hbt=0; o.vx=0; o.vy=0; p.gcd=.3; if(!HUSH_FX())Snd.land&&Snd.land() }
  return false;
}
const HUSH_FX=()=>(typeof HUSH!=='undefined'&&HUSH);
function coPlayers(dt){
  platsMove(dt);
  const x0=PLY.map(q=>q.x), y0=PLY.map(q=>q.y);
  const ord=PLY.map((_,i)=>i).sort((a,b)=>((PLY[a].stand<0||PLY[a].hb>=0)?1:0)-((PLY[b].stand<0||PLY[b].hb>=0)?1:0)||a-b);       // whoever stands on somebody's head is moved AFTER him
  coEach(()=>{ if(carryStep(dt))return; if(P.stand<0){ const o=PLY[-P.stand-1]; if(o&&!o.dead){ P.x+=o.x-x0[o.idx]; P.y+=o.y-y0[o.idx] } else P.stand=0 } platRide(); updatePlayer(dt) },ord);
  if(G.state==='play'&&PLY.length===2){                 // tether: never let a move widen the gap past CO_TETHER
    for(let i=0;i<2;i++){ const q=PLY[i], o=PLY[1-i], gap=Math.abs(q.x-o.x); if(gap>CO_TETHER&&gap>Math.abs(x0[i]-o.x)){ q.x=x0[i]; q.vx=0 } }
  }
  coHome();
}
function coDraw(c){
  const vo=G.co&&!G.co.local?(netVis(),NET.vo):null;                     // online: what a rollback corrected is not shown as a jump, it glides (netVis)
  for(const q of PLY){ P=q; const o=vo&&vo[q.idx], sh=o&&(o.x||o.y); if(sh){ c.save(); c.translate(o.x,o.y) }
    if(q.dead)drawDeath(c); else { drawPlayer(c); heroFxWorld(c) }
    if(sh)c.restore() }
  coHome();
  c.save(); c.textAlign='center'; c.lineJoin='round';
  PLY.forEach((q,i)=>{ if(q.dead)return; const o=vo&&vo[i], x=q.x+PW/2+(o?o.x:0), y=q.y+PH-(typeof SPR_H==='number'&&look3()?SPR_H:44)-4+(o?o.y:0);
    c.fillStyle=CO_COL[i]; c.strokeStyle='#000'; c.lineWidth=2; c.beginPath(); c.moveTo(x-6,y-8); c.lineTo(x+6,y-8); c.lineTo(x,y); c.closePath(); c.fill(); c.stroke();
    c.font='900 11px Tahoma,Arial'; c.lineWidth=3; c.strokeText(String(i+1),x,y-11); c.fillStyle='#fff'; c.fillText(String(i+1),x,y-11) });
  c.restore();
}

/* ---- start / finish ---- */
const CO={sel:{n:1,h2:null,code:'',custom:null,mu:'none'},msg:''};
function coOwnedHeroes(){ return HERO_IDS.filter(heroOwned) }
function coStart(o){
  const co={mode:'co',local:o.local!==false,me:o.me|0,hero:o.hero,stage:o.stage||o.hero.map(h=>heroStage(h)),skin:o.skin||o.hero.map(h=>skinSaved(h)),level:o.level||1,custom:o.custom||null,df:o.df||null,vs:vsSan(o.vs),mu:muSan(o.mu)};
  Snd.init(); Snd.resume(); for(const id of ['co','title','menu','card','ed'])$(id).classList.add('hide'); $('hud').classList.remove('hide');
  if(co.custom)startCustom(co.custom,'co',co); else startGame(co.level,co);
}
function coWon(){ CO.msg='🎉 خلّصتوها بـ '+(G.winTime!=null?G.winTime:G.t).toFixed(1)+' ث'+(G.lvDeaths?' وبـ '+G.lvDeaths+' موتة':' بدون ولا موتة! 😎') }
function coNext(){                                 // after a win: back to the lobby with the next playable level selected
  const was=G.co; if(was&&!was.local){ G.co=null; if(!CO.sel.custom)CO.sel.n=coGoto(G.level+1,1); netToLobby(CO.msg); netLobbySend(); return } G.co=null; if(!CO.sel.custom)CO.sel.n=coGoto(G.level+1,1);
  coOpen(CO.msg,was);
}

/* ---- lobby ---- */
/* The level is a FREE choice in co-op and race (nothing is earned there, so progress does not matter): any level up to CO_TOP except boss levels.
   CO_TOP stays below 1001, the hero trial pseudo levels. */
const CO_TOP=999, CO_DFS=['normal','crazy','hell','nightmare'];
const coMax=()=>CO_TOP;
function coPlayable(n){ return n>=1&&n<=CO_TOP&&!isBossLevel(n) }
function coGoto(n,dir){ n=clamp(Math.round(+n)||1,1,CO_TOP); if(isBossLevel(n))n+=dir<0?-1:1; return clamp(n,1,CO_TOP) }      // returns a playable level near n (a boss level moves one step in the direction of travel)
function coStep(d){ CO.sel.n=coGoto(CO.sel.n+d,d) }
const coDf=()=>CO.sel.df||(NET.mode==='race'?'crazy':'hell');                  // co-op defaults to impossible, a race to crazy; the host's choice travels with the start message
function coPreview(){ try{ const th=CO.sel.custom?CO.sel.custom.th:themeOf(CO.sel.n); L=buildLevel(1,{script:[['pit','plain']],theme:th,diff:'normal',salt:0}); P=newPlayer(L.spawnTx); themeBg=makeBg(THEMES[th],th*31+7); G.camX=0 }catch(e){} }
function coOpen(msg,was){
  if(CO.sel.h2==null||!heroOwned(CO.sel.h2))CO.sel.h2=coOwnedHeroes().find(h=>h!==S.hero)||S.hero;
  CO.msg=msg||''; NET.tab=true; if(!FR.shown){ FR.shown=true; $('frBox').open=frList().length>0 }          // same-device play is gone from the UI: the lobby is always the online one (the local path stays for tests: click #coTabL)
  Snd.stopMusic(); K.l=K.r=K.j=K.jp=false; K2.l=K2.r=K2.j=K2.jp=false; G.co=null;
  for(const id of ['title','menu','card','hud','touch','ed'])$(id).classList.add('hide'); $('sub').innerHTML='';
  G.state='co'; $('co').classList.remove('hide'); coPreview(); coRender();
}
function coClose(){ if(NET.link!=='off')netLeave('',false); $('co').classList.add('hide'); goTitle() }
function coRender(){
  const s=CO.sel, cu=s.custom;
  $('coLv').textContent=cu?'🛠 خريطة مخصّصة ('+cTraps(cu)+' فخ)':'المرحلة '+s.n;
  $('coPrev').disabled=!!cu; $('coNext').disabled=!!cu; $('coPrev10').disabled=!!cu; $('coNext10').disabled=!!cu; $('coLvIn').disabled=!!cu;
  if(document.activeElement!==$('coLvIn'))$('coLvIn').value=cu?'':s.n;
  for(const b of document.querySelectorAll('#co [data-cdf]')){ b.classList.toggle('on',!cu&&b.dataset.cdf===coDf()); b.disabled=!!cu }
  for(const b of document.querySelectorAll('#co [data-cmu]'))b.classList.toggle('on',!cu&&b.dataset.cmu===muSan(s.mu));
  const online=NET.tab&&NET.link!=='off'&&NET.peer, mine=online?S.hero:S.hero, theirs=online?NET.peer.hero:s.h2;
  for(const [id,h] of [['coH1',mine],['coH2',theirs]]){ const cv2=$(id+'c'); cv2.width=64; cv2.height=74; paintHero(cv2,h); $(id+'n').textContent=HEROES[h].name }
  $('coMsg').textContent=CO.msg||''; $('coCodeBtn').textContent=cu?'✖ شيل الخريطة المخصّصة':'📥 خريطة بكود';
  $('coCodeBox').classList.toggle('hide',!s.codeOpen||!!cu);
  netRender(); if(NET.tab&&NET.role==='h'&&NET.link==='conn')netLobbySend();
}
function coStartFromLobby(){
  if(NET.tab)return; const s=CO.sel; if(!s.custom&&!coPlayable(s.n)){ CO.msg='هالمرحلة مو متاحة للتعاون'; coRender(); return }
  coStart({hero:[S.hero,s.h2],level:s.n,custom:s.custom?cClone(s.custom):null,local:true,me:0,df:s.custom?null:coDf()});
}
function coCycle2(d){ const o=coOwnedHeroes(); const i=o.indexOf(CO.sel.h2); CO.sel.h2=o[(i+d+o.length)%o.length]; Snd.ui&&Snd.ui(); coRender() }
$('bCoT').onclick=()=>{ Snd.init(); coOpen('') };
$('coX').onclick=coClose; $('coGo').onclick=coStartFromLobby;
const coMove=d=>{ coStep(d); coPreview(); coRender() };
$('coPrev').onclick=()=>coMove(-1); $('coNext').onclick=()=>coMove(1); $('coPrev10').onclick=()=>coMove(-10); $('coNext10').onclick=()=>coMove(10);
$('coLvIn').addEventListener('keydown',e=>{ e.stopPropagation(); if(e.key==='Enter')$('coLvIn').blur() });
$('coLvIn').addEventListener('change',()=>{ const v=parseInt($('coLvIn').value,10); if(v>0){ CO.sel.n=coGoto(v,1); coPreview() } coRender() });
for(const b of document.querySelectorAll('#co [data-cdf]'))b.onclick=()=>{ CO.sel.df=b.dataset.cdf; Snd.ui&&Snd.ui(); coRender() };
for(const b of document.querySelectorAll('#co [data-cmu]'))b.onclick=()=>{ CO.sel.mu=b.dataset.cmu; Snd.ui&&Snd.ui(); coRender() };
$('coH2L').onclick=()=>coCycle2(-1); $('coH2R').onclick=()=>coCycle2(1);
$('coCodeBtn').onclick=()=>{ const s=CO.sel; if(s.custom){ s.custom=null; CO.msg=''; coPreview() } else { s.codeOpen=!s.codeOpen } coRender() };
$('coCodeGo').onclick=()=>{ const r=decodeCustom($('coCode').value); if(r.err){ CO.msg='❌ '+r.err; coRender(); return } CO.sel.custom=r.c; CO.sel.codeOpen=false; CO.msg='✅ انحمّلت الخريطة'; coPreview(); coRender() };

/* FLAGS.coScript: tests build levels that hold only one puzzle */
const vsSan=v=>{ v=v|0; return v>0&&v<10000?v:0 };
/* variety seed: online the host picks one per match (both machines build the same level); alone it is G.vs (varySeed) */
const coOpt=o=>{ const d=(G.co&&G.co.df)||(G.race&&G.race.df); if(G.co&&!G.co.custom)o=Object.assign({},o,{co:1},FLAGS.coScript?{script:FLAGS.coScript}:null);
  const vs=G.co?G.co.vs:(G.race?G.race.vs:G.vs); if(vs&&!(o&&(o.vs!=null||o.salt!=null)))o=Object.assign({},o,{vs});
  const mu=muNow(); if(mu&&mu!=='none'&&!(o&&o.mu!=null))o=Object.assign({},o,{mu});
  return d&&!(o&&o.diff)?Object.assign({},o,{diff:d}):o };      // the host's difficulty for an online match (never written to the player's own settings)
