/*@admin*/
/* =============== ADMIN CONSOLE (private / dev builds only) ===============
   build.py cuts everything between the two marker comments out of the PUBLIC site (and the artifact variant): the public game has no console at all.
   Open it with the ` key (the one under Esc), or by tapping the game title 5 times quickly on a phone. The game pauses while it is open.
   It is locked: the first time you choose a passphrase (setpass <word>), after that every session needs  auth <word>.  Only a hash of the word is kept (S.admh).
   It does nothing online: no co-op, no race. Any command that changes the save marks it with S.adm=1 (so a future leaderboard / coupons can ignore such saves).
   Honest limit: a single-file game that keeps its save in the browser cannot stop a determined cheater; this console is a convenience for the owner, not security. */
GEMS_SHOW=1; GEM_TEST=1;                                        // private build: always show 💎/🔰, and the gem packs are free test buttons (see w_gems.js)
{                                                  // ADMG itself ({on,god,speed}) lives in index.src.html so the public build keeps a harmless copy
  const box=document.createElement('div'); box.id='adm';
  box.style.cssText='position:absolute;left:0;right:0;top:0;height:60%;z-index:70;display:none;flex-direction:column;background:rgba(4,10,6,.94);color:#7cfc8a;border-bottom:calc(var(--u)*2) solid #7cfc8a;direction:ltr;text-align:left;font-weight:600;font-size:calc(var(--u)*12);line-height:1.35;font-family:ui-monospace,Menlo,Consolas,monospace';
  const out=document.createElement('div'); out.style.cssText='flex:1;overflow-y:auto;padding:calc(var(--u)*8) calc(var(--u)*10);white-space:pre-wrap;word-break:break-word;user-select:text';
  const row=document.createElement('div'); row.style.cssText='display:flex;gap:calc(var(--u)*6);align-items:center;border-top:1px solid #7cfc8a55;padding:calc(var(--u)*5) calc(var(--u)*10)';
  const pr=document.createElement('span'); pr.textContent='>';
  const inp=document.createElement('input'); inp.autocomplete='off'; inp.spellcheck=false; inp.autocapitalize='off'; inp.setAttribute('autocorrect','off'); inp.placeholder='help';
  inp.style.cssText='flex:1;min-width:0;background:transparent;border:0;outline:0;color:#c9ffd0;font:inherit;direction:ltr;text-align:left';
  row.append(pr,inp); box.append(out,row); $('stage').appendChild(box);

  const A={auth:false,hist:[],hi:0};
  const say2=(t,c)=>{ const d=document.createElement('div'); d.textContent=t; if(c)d.style.color=c; out.appendChild(d); while(out.childNodes.length>400)out.removeChild(out.firstChild); out.scrollTop=out.scrollHeight };
  const ok=t=>say2('✓ '+t,'#9dffb0'), bad=t=>say2('✗ '+t,'#ff8a8a'), info=t=>say2(t,'#8fd6ff');
  const online=()=>NET.link!=='off'||!!G.co||!!G.race;
  const isOpen=()=>box.style.display!=='none';
  const hasPass=()=>typeof S.admh==='number';
  const hashOf=w=>fnv('adm\u0001'+w);
  function setOpen(on){
    if(on===isOpen())return;
    box.style.display=on?'flex':'none'; ADMG.on=on?1:0;
    if(on){ for(const f of ['l','r','j','jp','a','ap'])K[f]=false; inp.value=''; if(!out.childNodes.length)banner(); setTimeout(()=>inp.focus(),30) } else inp.blur();
  }
  function banner(){
    say2("DON'T DIE, HABIBI  —  admin console",'#ffd23f');
    if(online())bad('أونلاين/تعاون/سباق: الكونسول مقفول (help فقط)');
    else if(!hasPass())info('أول مرة: اختار كلمة سر →  setpass <كلمة>'); else if(!A.auth)info('مقفول →  auth <كلمة السر>');
    else ok('جاهز. اكتب help');
  }
  const num=(v,d)=>{ const x=parseFloat(v); return isFinite(x)?x:d };
  const needGame=()=>{ if(G.state==='title'||G.state==='co'||G.state==='editor'||!L){ bad('لازم تكون داخل مرحلة'); return false } return true };
  const touch=()=>{ S.adm=1; save(); try{ hud() }catch(e){} try{ syncHeroes&&syncHeroes() }catch(e){} };
  const heroId=a=>{ const id=a&&HEROES[a]?a:(a==='.'||!a?(S.hero||'falafel'):null); return id };
  const maxSt=()=>(typeof HERO_MAXST==='number'?HERO_MAXST:3);
  const LIM=1e9, amt=(v,cur)=>{ if(v==null||v==='')return null; const x=num(v); if(x==null)return null; return clamp(Math.round(/^[+-]/.test(v)?cur+x:x),0,LIM) };   // "50" = set, "+50" / "-50" = relative
  /* undo: the save as it was BEFORE the last 3 console commands that changed it (kept in its own key, so it also survives the reload that wipe / reset / import do) */
  const UNDO_KEY='td_undo';
  const undoStack=()=>{ try{ const a=JSON.parse(localStorage.getItem(UNDO_KEY)||'[]'); return Array.isArray(a)?a.filter(x=>typeof x==='string'):[] }catch(e){ return [] } };
  const undoPush=snap=>{ const a=undoStack(); if(a[a.length-1]===snap)return; a.push(snap); while(a.length>3)a.shift(); try{ localStorage.setItem(UNDO_KEY,JSON.stringify(a)) }catch(e){ try{ localStorage.setItem(UNDO_KEY,JSON.stringify([snap])) }catch(e2){} } };
  function writeAndReload(o,msg){                                        // replace the whole save, then reload; save.fz stops the game's own autosave from overwriting it in between
    Object.assign(o,{adm:1,admh:S.admh}); try{ localStorage.setItem('td_s',JSON.stringify(o)) }catch(e){ return bad('ما قدرت أحفظ') }
    save.fz=1; ok(msg+' — عم أعيد التحميل...'); setTimeout(()=>location.reload(),300);
  }
  const WIPE={                                                           // group -> the save keys it clears (each module puts its defaults back on the reload)
    coins:['wallet'], gems:['gems'], xp:['pxp'], heroxp:['hx'], pickups:['cc'],
    progress:['best','cl','cc','nd','cs','bd','pb','fin'],
    heroes:['own','hero','hs','hx','hc','hq','hcl'],
    worlds:['ow','bgPick'],
    shop:['aq','hq','trail','dfx','hi','ep'],
    skins:['hsk','hso'],
    trials:['tr','trn'],
    ach:['ac','ti','st','deaths'],
    daily:['dy','wk'],
    gifts:['gs','gk','gq'],
    friends:['fr'],
    profile:['pf','fname'],
  };
  const WIPE_SAFE=new Set(['coins','gems','xp','heroxp','pickups','daily','gifts']);                // plain numbers / counters: no "yes" needed
  const dyCmd=key=>a=>{
    const nm=key==='d'?'اليوم':'الأسبوع', set0=dyTasks()[key];
    if(a[0]==='reset'){ if(key==='d')S.dy={d:-1,t:[],p:{},c:{},a:0}; else S.wk={w:-1,t:[],p:{},c:{},a:0}; dayRoll(); touch() }
    else if(a[0]==='done'){ for(const t of set0.t)if(!set0.c[t.k]){ set0.p[t.k]=t.n; set0.c[t.k]=1; dyPay(set0,key,t) } touch() }
    else if(a[0])return bad((key==='d'?'daily':'weekly')+' [done|reset]');
    const set=dyTasks()[key]; info('تحدّيات '+nm+': '+set.t.map(t=>DY_BY[t.k].ic+' '+(set.p[t.k]|0)+'/'+t.n+(set.c[t.k]?' ✓':'')).join('  ·  ')+(set.a?'   🎁 بونص انأخد':''));
  };

  const CMD={
    help(){ info([
      'status                        ملخّص السيف',
      '— فلوس وخبرة —',
      'coins <n|+n|-n>               🪙 كوينز (رقم = ضبط، +/- = زيادة/نقصان)   give <n> = زيادة',
      'gems <n|+n|-n>                💎 جواهر',
      'xp <n|+n|-n>                  🔰 خبرة اللاعب (المستوى بيتحسب منها)',
      'level <n|+n|-n>               مستوى اللاعب 1-100',
      'xp <id> <n>                   خبرة بطل (للتطوير، غير خبرة اللاعب)',
      '— تقدّم وأبطال —',
      'best <n>                      progress (earlier levels get 1 star)',
      'stars <1-3|max> [from] [to]   stars of cleared levels',
      'hero <id>                     select + own a hero',
      'stage <id|all> <1-'+(maxSt()+1)+'>        hero evolution stage',
      'unlock heroes|worlds|acc|skins|all  open everything',
      'skin <id> <0-2>               wear (and own) a hero skin; skin all = own them all; skin = list',
      '— داخل المرحلة —',
      'goto <n> | win | kill | tp <tile>',
      'god [on|off]                  no deaths (except falling out of the world)',
      'speed <0.1-4>                 game speed',
      'diff <normal|crazy|hell>      single-player difficulty',
      '— تحدّيات —',
      'daily|weekly [done|reset]     خلّصها (بتدفع) / صفّر تقدّمها',
      'date <±days|now>              زحّط تاريخ اللعبة (بتتصفّر بإعادة التحميل)',
      '— مسح وتراجع —',
      'wipe                          قائمة الأجزاء (wipe <جزء> [yes])',
      'undo                          رجّع السيف لما قبل آخر أمر (آخر 3)',
      'reset yes                     wipe the WHOLE save',
      'save export | save import <b64>',
      'setpass <word> | lock | clear | reload | echo <text>'].join('\n')) },
    clear(){ out.textContent='' },
    echo(a){ info(a.join(' ')) },
    lock(){ A.auth=false; ok('اتقفل'); },
    reload(){ location.reload() },
    setpass(a){ if(hasPass()&&!A.auth)return bad('اعمل auth أول'); if(!a[0]||a[0].length<3)return bad('3 حروف على الأقل'); S.admh=hashOf(a.join(' ')); A.auth=true; save(); ok('انحفظت كلمة السر (hash بس)') },
    auth(a){ if(!hasPass())return bad('ما في كلمة سر بعد → setpass <كلمة>'); if(hashOf(a.join(' '))===S.admh){ A.auth=true; ok('أهلاً أمين 👋') } else bad('غلط') },
    status(){
      const own=Object.keys(S.own||{}).length, ow=Object.keys(S.ow||{}).length, st=HERO_IDS.map(h=>h+':'+((S.hs&&S.hs[h])|0)).join(' ');
      const pg=plProg();
      info(['best='+S.best+'  coins='+(S.wallet|0)+'  gems='+(S.gems|0)+'  diff='+S.diff+'  hero='+S.hero,'player: level '+pg.n+'  xp='+(S.pxp|0)+(pg.need?'  ('+pg.cur+'/'+pg.need+' to next)':'  (MAX)'),'stars='+starsTotal()+'  heroes='+own+'/'+HERO_IDS.length+'  worlds opened='+ow,'stages(0-based) '+st,'adm='+(S.adm?1:0)+'  god='+ADMG.god+'  speed='+ADMG.speed+'  dateOffset='+(ADMG.doff|0)+'d  undo='+undoStack().length+'  state='+G.state+'  level='+G.level].join('\n')) },
    coins(a){ const n=amt(a[0],S.wallet|0); if(n==null)return bad('coins <n> | coins +n | coins -n'); S.wallet=n; touch(); ok('الكوينز = '+S.wallet) },
    give(a){ const n=num(a[0]); if(n==null)return bad('give <n>'); S.wallet=clamp((S.wallet|0)+Math.round(n),0,LIM); touch(); ok('الكوينز = '+S.wallet) },
    gems(a){ const n=amt(a[0],S.gems|0); if(n==null)return bad('gems <n> | gems +n | gems -n'); gemAdd(clamp(n,0,GEM_MAX)-(S.gems|0)); touch(); ok('الجواهر = '+(S.gems|0)) },
    level(a){
      const cur=plLevel(), t=/^[+-]/.test(a[0]||'')?cur+Math.round(num(a[0],0)):Math.round(num(a[0],NaN)); if(!(t>=1))return bad('level <1-'+PL_MAX+'> | level +n | level -n');
      plAdd(plNeed(clamp(t,1,PL_MAX))-(S.pxp|0)); touch(); ok('مستوى اللاعب = '+plLevel()+'  (xp='+(S.pxp|0)+')') },
    best(a){ const n=clamp(Math.round(num(a[0],0)),1,999); if(!a[0])return bad('best <n>'); S.best=n; for(let i=1;i<n;i++)if(!S.cl[i])S.cl[i]=1; touch(); ok('التقدّم = '+n) },
    stars(a){
      const v=a[0]==='max'?3:Math.round(num(a[0],0)); if(!(v>=1&&v<=3))return bad('stars <1-3|max> [من] [لـ]');
      const lo=clamp(Math.round(num(a[1],1)),1,999), hi=clamp(Math.round(num(a[2],S.best-1)),lo,999); let c=0;
      for(let i=lo;i<=hi;i++){ S.cl[i]=v; c++ } touch(); ok('ضبطت '+c+' مرحلة على '+v+' نجوم') },
    goto(a){ const n=clamp(Math.round(num(a[0],0)),1,999); if(!a[0])return bad('goto <n>'); $('menu').classList.add('hide'); G.state='play'; setOpen(false); startGame(n); ok('المرحلة '+n+(n>S.best?' (تجريبية: ما بتتحسب)':'')) },
    win(){ if(!needGame())return; if(G.state!=='play')return bad('مو بوضع اللعب'); setOpen(false); winLevel(); },
    kill(){ if(!needGame())return; setOpen(false); const g=ADMG.god; ADMG.god=0; die('spike',null); ADMG.god=g },
    god(a){ ADMG.god=a[0]==='off'?0:a[0]==='on'?1:(ADMG.god?0:1); ok('god = '+(ADMG.god?'ON':'OFF')) },
    speed(a){ const v=clamp(num(a[0],1),.1,4); ADMG.speed=v; ok('السرعة = '+v) },
    tp(a){ if(!needGame())return; const t=num(a[0]); if(t==null)return bad('tp <tile>'); P.x=clamp(t,1,L.w-2)*TS; P.vx=P.vy=0; G.camX=Math.max(0,P.x-VW/2); ok('على الخانة '+t) },
    diff(a){ if(!DIFFS[a[0]]||a[0]==='nightmare')return bad('normal | crazy | hell'); setDiff(a[0]); ok('الصعوبة = '+a[0]) },
    hero(a){ const id=heroId(a[0]); if(!id)return bad('بطل غير موجود: '+HERO_IDS.join(' ')); S.own[id]=1; S.hero=id; touch(); ok('البطل = '+id) },
    stage(a){
      const n=Math.round(num(a[1],0)); if(!(n>=1&&n<=maxSt()+1))return bad('stage <id|all> <1-'+(maxSt()+1)+'>');
      const ids=a[0]==='all'?HERO_IDS:[heroId(a[0])]; if(!ids[0])return bad('بطل غير موجود');
      for(const id of ids)S.hs[id]=n-1; touch(); ok('المرحلة '+n+' لـ '+ids.length+' بطل') },
    skin(a){
      if(!a[0]){ return info(Object.keys(SKINS).map(id=>id+': '+SKINS[id].map((x,k)=>(k===skinSaved(id)?'[':'')+k+'='+x[0]+(k&&!skinHas(id,k)?'🔒':'')+(k===skinSaved(id)?']':'')).join('  ')).join('\n')) }
      if(a[0]==='all'){ for(const id in SKINS)for(let k=1;k<SKINS[id].length;k++)S.hso[id+':'+k]=1; touch(); return ok('ملّكتك كل الأشكال') }
      const id=heroId(a[0]); if(!id||!SKINS[id])return bad('skin <id> <رقم> | skin all');
      const k=Math.round(num(a[1],NaN)); if(!(k>=0&&k<SKINS[id].length))return bad(id+': '+SKINS[id].map((x,i)=>i+'='+x[0]).join('  '));
      if(k)S.hso[id+':'+k]=1; skinWear(id,k); touch(); ok(id+' لابس «'+SKINS[id][k][0]+'»') },
    xp(a){
      if(a.length<=1){ const n=amt(a[0],S.pxp|0); if(n==null)return bad('xp <n|+n|-n>  (اللاعب)   أو   xp <id> <n>  (بطل)'); plAdd(clamp(n,0,PXP_MAX)-(S.pxp|0)); touch(); return ok('خبرة اللاعب = '+(S.pxp|0)+'  → مستوى '+plLevel()) }
      const id=heroId(a[0]), n=Math.round(num(a[1],-1)); if(!id||n<0)return bad('xp <id> <n>'); S.hx[id]=n; touch(); ok('xp '+id+' = '+n) },
    daily:dyCmd('d'), weekly:dyCmd('w'),
    date(a){
      if(a[0]==='now')ADMG.doff=0;
      else if(a[0]!=null){ const n=Math.round(num(a[0],NaN)); if(!isFinite(n)||Math.abs(n)>3650)return bad('date <±days|now>'); ADMG.doff=/^[+-]/.test(a[0])?ADMG.doff+n:n }
      dayRoll(); touch(); ok('تاريخ اللعبة = '+new Date(dyNow()).toISOString().slice(0,10)+'  (إزاحة '+(ADMG.doff|0)+' يوم، بتتصفّر بإعادة التحميل)') },
    wipe(a){
      const g=a[0]; if(!g||!WIPE[g]){ return info('wipe <جزء> [yes]\n'+Object.keys(WIPE).map(k=>k+(WIPE_SAFE.has(k)?'':' *')).join('  ')+'\n(* = لازم yes بالآخر)') }
      if(!WIPE_SAFE.has(g)&&a[1]!=='yes')return bad('هيدا بيمسح «'+g+'»! اكتب:  wipe '+g+' yes');
      undoPush(JSON.stringify(S)); let o; try{ o=JSON.parse(JSON.stringify(S)) }catch(e){ return bad('خطأ بالنسخ') }
      for(const k of WIPE[g])delete o[k]; writeAndReload(o,'مسحت «'+g+'» (undo بيرجّعها)') },
    undo(){
      const a=undoStack(), snap=a.pop(); if(!snap)return bad('ما في شي أرجّعه'); let o; try{ o=JSON.parse(snap); if(!o||typeof o!=='object')throw 0 }catch(e){ return bad('اللقطة تالفة') }
      try{ localStorage.setItem(UNDO_KEY,JSON.stringify(a)) }catch(e){} writeAndReload(o,'رجّعت السيف لما قبل آخر أمر ('+a.length+' باقية)') },
    unlock(a){
      const w=a[0]||'all', all=w==='all';
      if(all||w==='heroes'){ for(const id of HERO_IDS)S.own[id]=1 }
      if(all||w==='worlds'){ for(let i=0;i<THEMES.length;i++)S.ow[i]=1 }
      if(all||w==='acc'){ for(const id in ACCS)for(const q of ACCS[id])S.aq[id+':'+q[0]+':2']=1; S.trn=S.trn||{}; for(const id of HERO_IDS)S.trn[id]=1; for(const f of FACE)S.aq['f:'+f.k]=1; for(const t of TRAILS)S.aq['t:'+t.k]=1 }
      if(all||w==='skins'){ for(const id in SKINS)for(let k=1;k<SKINS[id].length;k++)S.hso[id+':'+k]=1 }
      if(!(all||w==='heroes'||w==='worlds'||w==='acc'||w==='skins'))return bad('unlock heroes|worlds|acc|skins|all');
      touch(); ok('فتحت: '+w) },
    save(a){
      if(a[0]==='export'){ const t=btoa(unescape(encodeURIComponent(JSON.stringify(S)))); info(t); try{ navigator.clipboard.writeText(t).then(()=>ok('انسخ للحافظة'),()=>{}) }catch(e){} return }
      if(a[0]==='import'&&a[1]){ try{ const o=JSON.parse(decodeURIComponent(escape(atob(a.slice(1).join(''))))); if(typeof o!=='object'||!o)throw 0; undoPush(JSON.stringify(S)); writeAndReload(o,'استوردت') }catch(e){ bad('نص غير صالح') } return }
      bad('save export | save import <نص>') },
    reset(a){ if(a[0]!=='yes')return bad('هيدا بيمسح كل شي! اكتب:  reset yes'); undoPush(JSON.stringify(S)); writeAndReload({},'انمسح كل شي (undo بيرجّعه)') },
  };
  const FREE=new Set(['help','clear','echo','lock','auth','setpass','reload']);          // work without the lock (auth / setpass check themselves)
  function run(line){
    line=line.trim(); if(!line)return; say2('> '+(/^(auth|setpass)\b/i.test(line)?line.split(/\s+/)[0]+' ****':line),'#c9ffd0');
    const parts=line.split(/\s+/), name=parts[0].toLowerCase(), args=parts.slice(1), fn=CMD[name];
    if(!fn)return bad('أمر غير معروف: '+name+' (help)');
    if(online()&&name!=='help'&&name!=='clear'&&name!=='lock')return bad('مقفول أونلاين');
    if(!FREE.has(name)&&!A.auth)return bad(hasPass()?'مقفول → auth <كلمة السر>':'اختار كلمة سر → setpass <كلمة>');
    const before=FREE.has(name)?null:JSON.stringify(S);
    try{ fn(args); if(before!==null){ const after=JSON.stringify(S); if(after!==before)undoPush(before) } }catch(e){ bad('خطأ: '+(e&&e.message||e)) }
  }
  inp.addEventListener('keydown',e=>{
    e.stopPropagation();
    if(e.key==='Enter'){ const v=inp.value; inp.value=''; if(v.trim()&&!/^(auth|setpass)\b/i.test(v.trim())){ A.hist.push(v); A.hi=A.hist.length } run(v) }
    else if(e.key==='ArrowUp'){ if(A.hi>0)A.hi--; inp.value=A.hist[A.hi]||''; e.preventDefault() }
    else if(e.key==='ArrowDown'){ if(A.hi<A.hist.length)A.hi++; inp.value=A.hist[A.hi]||''; e.preventDefault() }
    else if(e.key==='Tab'){ e.preventDefault(); const p=inp.value.trim().toLowerCase(); if(p&&!p.includes(' ')){ const m=Object.keys(CMD).filter(k=>k.startsWith(p)); if(m.length===1)inp.value=m[0]+' '; else if(m.length>1)info(m.join('  ')) } }
  });
  inp.addEventListener('keyup',e=>e.stopPropagation());
  addEventListener('keydown',e=>{
    if((e.code==='Backquote'||e.key==='`'||e.key==='~')&&(document.activeElement===inp||!/^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement||{}).tagName||''))){ e.preventDefault(); e.stopPropagation(); setOpen(!isOpen()); return }
    if(e.code==='Escape'&&isOpen()){ e.preventDefault(); e.stopPropagation(); setOpen(false) }
  },true);
  box.addEventListener('pointerdown',e=>e.stopPropagation());
  { let taps=[]; const h1=document.querySelector('#title h1');
    if(h1)h1.addEventListener('click',()=>{ const n=performance.now(); taps=taps.filter(t=>n-t<2200); taps.push(n); if(taps.length>=5){ taps=[]; setOpen(true) } }) }
  window.ADM_OPEN=setOpen;
}
/*@end*/
