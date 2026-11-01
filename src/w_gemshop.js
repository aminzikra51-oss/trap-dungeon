/* =============== SHOP TAB 💎: buy gems, exchange them for coins / xp ===============
   The rates live in GEMX (w_gems.js). Three blocks: the packs ("buy gems": a free test button in the private build, 'soon' in the public one), gems -> coins, gems -> player xp.
   The tab only exists while plOn() (so in the public build only once somebody holds gems or xp). Skins can also be paid with gems: see w_skins.js. */
function gemCard(big,nm,sub,btnTxt,poor,fn){
  const c=el('div','shc'); c.append(el('div','shbig',big),el('div','nm',nm),el('div','sub',sub||' '),el('button','btn'+(poor?' poor':''),btnTxt,fn)); return c;
}
function gemSec(title,hint,cards){
  const w=el('div','gxs'); w.append(el('div','gxt',title)); if(hint)w.append(el('div','gxh',hint)); const r=el('div','gxr'); for(const c of cards)r.append(c); w.append(r); return w;
}
function gemRender(g){
  const gems=S.gems|0, q=plProg(), top=el('div','gxtop'), bar=el('span','pfxb'), f=el('i');
  f.style.width=Math.round(q.pct*100)+'%'; bar.append(f);
  top.append(el('b',null,'💎 '+gems),el('span',null,'🔰 مستوى '+q.n),bar,el('small',null,q.need?'\u2066'+q.cur+' / '+q.need+' XP\u2069':'MAX')); g.append(top);
  const msg=m=>{ shopMsg(m); shopRender() };
  g.append(gemSec('➕ اشحن جواهر'+(GEM_TEST?'  (تجريبي — مجاني بالنسخة الخاصة)':''),GEM_TEST?'':'الدفع بمصاري حقيقية لسا مش شغّال — قريباً',
    GEMX.packs.map((o,i)=>gemCard('💎',o[0]+' 💎','$'+o[1].toFixed(2),GEM_TEST?'جرّب':'🔒 قريباً',!GEM_TEST,()=>{
      const r=gemPack(i); if(r==='ok'){ Snd.coin(); msg('زادت '+o[0]+' 💎 (تجريبي)') } else { Snd.bonk&&Snd.bonk(); msg('شراء الجواهر بالمصاري قريباً') } }))));
  g.append(gemSec('🪙 بدّل جواهر بكوينز','',GEMX.coins.map((o,i)=>{ const poor=gems<o[0], b=gemBonus(GEMX.coins,i);
    return gemCard('🪙',o[1]+' 🪙',b>0?'بونص +'+b+'%':'',poor?'ناقصك '+(o[0]-gems)+' 💎':'بدّل '+o[0]+' 💎',poor,()=>{
      const r=gemBuyCoins(i); if(r==='ok'){ Snd.coin(); Snd.win&&Snd.win(); msg('اشتريت '+o[1]+' 🪙 بـ '+o[0]+' 💎') } else { Snd.bonk&&Snd.bonk(); msg('ناقصك '+(o[0]-(S.gems|0))+' 💎') } }) })));
  g.append(gemSec('🔰 بدّل جواهر بخبرة','الخبرة بتزيد مستواك (مستوى اللاعب، مش خبرة البطل)',GEMX.xp.map((o,i)=>{ const poor=gems<o[0], b=gemBonus(GEMX.xp,i), lv=plLevel((S.pxp|0)+o[1]);
    return gemCard('🔰','+'+o[1]+' XP',(b>0?'بونص +'+b+'% · ':'')+'بتوصل مستوى '+lv,poor?'ناقصك '+(o[0]-gems)+' 💎':'بدّل '+o[0]+' 💎',poor,()=>{
      const l0=plLevel(), r=gemBuyXp(i); if(r==='ok'){ Snd.coin(); Snd.win&&Snd.win(); msg('زادت خبرتك '+o[1]+' XP'+(plLevel()>l0?' — مستوى '+plLevel()+' 🎉':'')) } else { Snd.bonk&&Snd.bonk(); msg('ناقصك '+(o[0]-(S.gems|0))+' 💎') } }) })));
}
