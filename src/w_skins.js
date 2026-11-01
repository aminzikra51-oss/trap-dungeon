/* =============== SKINS: more evolution looks per hero ===============
   Every hero has his first evolution path (assets/hero/<id>_s1..s5.webp) and one more (the falafel two more): <id>_k1_s1..s5, <id>_k2_s1..s5. A skin is a COSMETIC: the same hero, the same
   abilities, the same five stages; only the five pictures differ. A hero wears one skin at a time and swaps for free between the ones he owns. A skin is bought once with coins (SKINS price).
   State: S.hsk[id] = the skin worn (0 / missing = first path), S.hso['<id>:<k>'] = owned. The picture is chosen by sprKeyOf in draw3d.js (skinOf), which also resolves the skin a co-op / race
   player started with (P.hsk). Skins show in the evolved look only: the classic look (the base picture + shop accessories) has no skins. Picking one switches the hero to the evolved look.
   The shop card shows a preview that walks through the five stages (SKV) before you buy. Nothing here touches the simulation. */
const SKINS={                                                  // [name, price in coins]; index 0 = the first path (free)
  falafel:[['المستكشف',0],['المحارب البلدي',300],['بركان الشطة',450]],
  uncle:[['الباشا',0],['القبضاي الشامي',300]],
  chicken:[['الفينيق',0],['الفالكيري المحاربة',300]],
  cat:[['البحّارة',0],['النينجا الشبح',300]],
  grandma:[['صانعة الحلويات',0],['المقاتلة الصارمة',300]],
  donkey:[['الروك',0],['بيغاسوس المجنّح',300]],
  robot:[['الزنبركي',0],['السايبورغ الليزري',300]],
  mushroom:[['حامي الغابة',0],['السام والأبواغ',300]],
};
S.hsk=(S.hsk&&typeof S.hsk==='object')?S.hsk:{}; S.hso=(S.hso&&typeof S.hso==='object')?S.hso:{};
const skinSan=(id,k)=>{ k=Math.floor(+k); return Object.prototype.hasOwnProperty.call(SKINS,id)&&isFinite(k)&&k>0&&k<SKINS[id].length?k:0 };         // anything from the network / a save -> a valid skin number
const skinHas=(id,k)=>k===0||!!(S.hso&&S.hso[id+':'+k]);
const skinLoaded=(id,k)=>k===0||!!(HSPR[id+'_k'+k+'_s1']&&HSPR[id+'_k'+k+'_s1'].ok);
const skinList=id=>{ const a=SKINS[id]||[], out=[]; for(let k=0;k<a.length;k++)if(skinLoaded(id,k))out.push(k); return out };
function skinPrice(id,k){ return SKINS[id]&&SKINS[id][k]?SKINS[id][k][1]:0 }
function skinWear(id,k){                                       // wear an owned skin (0 = the first path)
  k=skinSan(id,k); if(!skinHas(id,k))return false;
  if(k)S.hsk[id]=k; else delete S.hsk[id];
  if(S.hcl)delete S.hcl[id];                                   // skins are an evolved-look thing
  save(); try{ syncHeroes() }catch(e){} return true;
}
function skinBuy(id,k){                                        // 'ok' | 'owned' | 'poor' | 'none'
  k=skinSan(id,k); if(!k)return 'none'; if(skinHas(id,k))return 'owned'; if(!heroOwned(id))return 'none'; if(!skinLoaded(id,k))return 'none';
  const p=skinPrice(id,k); if((S.wallet|0)<p)return 'poor';
  S.wallet-=p; S.hso[id+':'+k]=1; save(); skinWear(id,k); hud(); return 'ok';
}
const SKP={};                                                  // shop: the skin being previewed per hero (not worn until you pick / buy it)
let skTimer=0;
function skinPvStop(){ if(skTimer){ clearInterval(skTimer); skTimer=0 } SKV.id=''; SKV.k=null; SKV.st=null }
function skinPvPaint(cv,id,k,st){ SKV.id=id; SKV.k=k; SKV.st=st; try{ paintHero(cv,id) }finally{ SKV.id=''; SKV.k=null; SKV.st=null } }
function skinPvStart(cv,id,k){                                 // walk the previewed skin through stages I..V on the card's thumbnail
  skinPvStop(); let st=Math.min(HERO_MAXST,heroStage(id)); skinPvPaint(cv,id,k,st);
  skTimer=setInterval(()=>{ if(!SHOP.open||SHOP.tab!=='u'||!document.body.contains(cv)){ skinPvStop(); return } st=(st+1)%(HERO_MAXST+1); skinPvPaint(cv,id,k,st) },1100);
}
function skinRow(id,cv){                                       // the chips + action under a hero's upgrade card; null when this hero has only one look
  const list=skinList(id); if(list.length<2)return null;
  const box=el('div','skr'), wear=skinSaved(id), pv=SKP[id]!=null&&list.includes(SKP[id])?SKP[id]:null, chips=el('div','skc');
  for(const k of list){ const own=skinHas(id,k), nm=SKINS[id][k][0];
    const b=el('button','tg sk'+(k===wear&&!classicOf(id)?' on':'')+(k===pv?' pv':'')+(own?'':' lock'),(own?'':'🔒 ')+nm,()=>{ for(const o in SKP)SKP[o]=null; SKP[id]=k===wear&&!classicOf(id)?null:k; Snd.ui&&Snd.ui(); shopRender() });
    b.dataset.k=k; chips.append(b) }
  box.append(el('div','skt','🎭 المظهر (بيتبدّل بحرّية)'),chips);
  if(pv!=null){
    const own=skinHas(id,pv), nm=SKINS[id][pv][0], p=skinPrice(id,pv);
    if(own)box.append(el('button','btn','✓ البس «'+nm+'»',()=>{ if(skinWear(id,pv)){ SKP[id]=null; Snd.coin&&Snd.coin(); shopMsg('لبس '+HEROES[id].name+' مظهر «'+nm+'»'); shopRender() } }));
    else{ const poor=(S.wallet|0)<p;
      box.append(el('button','btn'+(poor?' poor':''),'اشترِ «'+nm+'» 🪙 '+p+(poor?'  (ناقصك '+(p-(S.wallet|0))+')':''),()=>{
        const r=skinBuy(id,pv); if(r==='ok'){ SKP[id]=null; Snd.coin(); Snd.win(); shopMsg('اشتريت مظهر «'+nm+'» 🎉 — لابسه هلأ، وبتبدّل بحرّية'); shopRender() }
        else if(r==='poor'){ Snd.bonk&&Snd.bonk(); shopMsg('ناقصك '+(p-(S.wallet|0))+' 🪙') } })) }
    skinPvStart(cv,id,pv);
  }
  return box;
}
