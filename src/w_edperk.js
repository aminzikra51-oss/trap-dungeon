/* =============== MAP-EDITOR PERKS (bought with coins, local) ===============
   Four upgrades for the map editor. Two are plain limits (more traps, more checkpoint flags), two are cosmetic (decorations, troll signs).
   The cosmetic ones never reach the generator (see cosmPlace in w_custom.js), so they cannot change physics, the solver, or the proof of a cleared run.
   Limits only bind when ADDING: opening or playing a longer map somebody shared always works. S.ep[k] = tiers bought (0 = free level). */
S.ep=S.ep||{}; for(const k of ['len','cp','deco','sign'])S.ep[k]=S.ep[k]|0;
const EPERK=[
 {k:'len', ic:'📏',nm:'مرحلة أطول',      base:20,unit:'فخ',   desc:'عدد الفخاخ اللي بتحطها بخريطتك',                       tiers:[[40,90],[80,180],[250,350]]},
 {k:'cp',  ic:'🚩',nm:'نقاط حفظ إضافية',  base:2, unit:'علم',  desc:'أعلام الحفظ بالخريطة — اللاعب بيرجع منها لما يموت',     tiers:[[4,60],[7,120],[12,200]]},
 {k:'deco',ic:'🌳',nm:'زخارف',            base:0, unit:'زخرفة',desc:'شجر وزهور وقبور وتماثيل — شكل بس، ما بتأثر على اللعب',   tiers:[[8,70],[24,130]]},
 {k:'sign',ic:'🪧',nm:'يافطات تريّق',     base:0, unit:'يافطة',desc:'يافطات بتكذب على اللاعب. الدرجة الثانية: اكتب نصك بإيدك',tiers:[[3,50],[8,120]]}
];
const EP_BY=Object.fromEntries(EPERK.map(p=>[p.k,p]));
const epTier=k=>Math.min(S.ep[k]|0,EP_BY[k].tiers.length);
const epCap=k=>{ const t=epTier(k); return t?EP_BY[k].tiers[t-1][0]:EP_BY[k].base };
const epCustomText=()=>epTier('sign')>=2;
function epNext(k){ const t=epTier(k), tr=EP_BY[k].tiers; return t<tr.length?{cap:tr[t][0],price:tr[t][1],tier:t+1}:null }
function epBuy(k){
  const nx=epNext(k); if(!nx)return 'max'; if(S.wallet<nx.price)return 'poor';
  S.wallet-=nx.price; S.ep[k]=nx.tier; save(); hud(); return 'ok';
}
/* what is the editor allowed to add right now? '' = fine, otherwise the Arabic reason (also names the perk that lifts the limit) */
function epWhy(c,f,v){
  const F=CF[f], up=' — زوّد من 🛒 ترقيات';
  if(c.seq.length>=C_MAXSEQ)return 'الحد الأقصى '+C_MAXSEQ+' عنصر';
  if(F.f==='deco'){ const cap=epCap('deco'); if(!cap)return '🔒 الزخارف مقفلة'+up; if(cCount(c,'deco')>=cap)return 'وصلت حد الزخارف ('+cap+')'+up }
  else if(F.f==='sign'){ const cap=epCap('sign'); if(!cap)return '🔒 اليافطات مقفلة'+up; if(cCount(c,'sign')>=cap)return 'وصلت حد اليافطات ('+cap+')'+up; if(v===SIGN_CUSTOM&&!epCustomText())return '🔒 النص الخاص من الدرجة الثانية'+up }
  else if(F.f==='cp'){ const cap=epCap('cp'); if(cCount(c,'cp')>=cap)return 'وصلت حد أعلام الحفظ ('+cap+')'+up }
  else { const cap=epCap('len'); if(cTraps(c)>=cap)return 'وصلت حد الفخاخ ('+cap+')'+up }
  return '';
}
function epLimits(c){ return '📏 '+cTraps(c)+'/'+epCap('len')+'  ·  🚩 '+cCount(c,'cp')+'/'+epCap('cp')+'  ·  🌳 '+cCount(c,'deco')+'/'+epCap('deco')+'  ·  🪧 '+cCount(c,'sign')+'/'+epCap('sign') }

/* ---- shop tab ---- */
function epRender(g){
  for(const p of EPERK){
    const t=epTier(p.k), nx=epNext(p.k), card=el('div','shc'+(t?' sel':'')), poor=nx&&S.wallet<nx.price;
    const now=epCap(p.k);
    card.append(el('div','shbig',p.ic),el('div','nm',p.nm),el('div','sub',p.desc),
      el('div','sub',now?('الحد هلأ: '+now+' '+p.unit):'🔒 مقفل'),
      el('div','sub','●'.repeat(t)+'○'.repeat(p.tiers.length-t)));
    if(!nx)card.appendChild(el('button','btn','✓ الأقصى',null));
    else card.appendChild(el('button','btn'+(poor?' poor':''),'🪙 '+nx.price+' ← '+nx.cap+' '+p.unit+(poor?'  (ناقصك '+(nx.price-S.wallet)+')':''),()=>{
      const r=epBuy(p.k); if(r==='ok'){ Snd.coin(); Snd.win(); shopMsg('اشتريت «'+p.nm+'» 🎉 — الحد صار '+epCap(p.k)+' '+p.unit) } else if(r==='poor'){ Snd.bonk&&Snd.bonk(); shopMsg('ناقصك '+(nx.price-S.wallet)+' 🪙 — خلّص مراحل واجمع عملات') } shopRender() }));
    g.appendChild(card);
  }
}

/* ---- drawing: decorations are emoji sprites standing on the floor line, behind every trap (no gameplay, no randomness) ---- */
function decoDraw(c,cam){
  c.save(); c.textAlign='center'; c.textBaseline='alphabetic'; c.direction='ltr';
  for(const d of L.deco){
    const x=d.tx*TS+16+d.dx; if(x<cam-60||x>cam+VW+60)continue; const k=d.k, sz=DECO_SZ[k];
    c.fillStyle='rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(x,GY+1,sz*.36,3,0,0,7); c.fill();
    c.font=sz+'px "Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji",sans-serif'; c.fillStyle='#fff';
    const sw=(k===0||k===1||k===7)?Math.sin(AT*1.3+d.tx*.7)*.04:0;
    c.save(); c.translate(x,GY-2); c.rotate(sw);
    c.fillText(DECO_EM[k],0,0);
    if(k===1){ c.font='18px "Noto Color Emoji","Apple Color Emoji",sans-serif'; c.fillText('🌷',-13,0); c.fillText('🌸',13,0) }
    if(k===2){ c.font='18px "Noto Color Emoji","Apple Color Emoji",sans-serif'; c.fillText('🦴',15,0) }
    c.restore();
  }
  c.restore();
}
