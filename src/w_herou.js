/* =============== SHOP TABS: hero upgrades + accessories =============== */
SHOP.hero=null;
const ROMAN=['I','II','III','IV','V'];
function heroUpRender(g){
  skinPvStop();
  for(const id of HERO_IDS){
    if(!heroOwned(id))continue;
    const st=heroStage(id), A=HAB[id], need=st<HERO_MAXST?XP_NEED[st]:0, xp=xpOf(id), card=el('div','shc up'+(S.hero===id?' sel':'')), cv2=document.createElement('canvas'); cv2.width=64; cv2.height=84; paintHero(cv2,id);
    const info=el('div','upi');
    const top=el('div','upt'); top.append(el('b','nm',HEROES[id].name),el('span','stg',ROMAN[st]+' · '+STAGE_NM[st]));
    const pips=el('div','pips2'); for(let k=0;k<=HERO_MAXST;k++)pips.appendChild(el('i',k<=st?'on':'',ROMAN[k]));
    const abl=el('div','abl'); abl.append(el('span','ic',A.ic),el('b',null,A.nm),el('span','ds',A.ds));
    const nxt=el('div','nxt',st<HERO_MAXST?'التالي: '+A.tx[st+1]+((heroForm(st+1)>heroForm(st)||sprKeyOf(id,st+1)!==sprKeyOf(id,st))?'  ·  🔥 بيتغيّر شكله!':''):'✓ '+A.tx[HERO_MAXST]);
    const bar=el('div','bar'), fill=el('div','fill'); fill.style.width=(st<HERO_MAXST?clamp(xp/need,0,1)*100:100)+'%'; fill.style.background=st<HERO_MAXST&&xp<need?'#7c4dff':'#ffd23f'; bar.appendChild(fill);
    const xt=el('div','xpt',st<HERO_MAXST?'الخبرة '+'⁦'+xp+' / '+need+'⁩  ·  بتجيبها من مراحل تخلّصها فيه ومن موتاته':'مستوى أسطوري 👑');
    let btn;
    if(st>=HERO_MAXST)btn=el('button','btn poor','أقصى مرحلة');
    else{ const c=UP_COST[st], poorXp=xp<need, poorC=S.wallet<c;
      btn=el('button','btn'+((poorXp||poorC)?' poor':''),poorXp?'ناقصك '+(need-xp)+' خبرة':'⬆ ترقية 🪙 '+c+(poorC?'  (ناقصك '+(c-S.wallet)+')':''),()=>{
        const r=upgradeHero(id); if(r==='ok'){ Snd.coin(); Snd.win(); shopMsg('ترقّى '+HEROES[id].name+' للمرحلة '+ROMAN[heroStage(id)]+' 🎉'+(ACCS[id][heroStage(id)-1]?' — اكسسوار جديد: '+ACCS[id][heroStage(id)-1][4]:'')) } else if(r==='xp')shopMsg('بدك خبرة أكتر بهالبطل — العب فيه'); else if(r==='poor')shopMsg('ناقصك عملات 🪙'); shopRender() }) }
    const hasEvo=!!(HSPR[id+'_s1']&&HSPR[id+'_s1'].ok), look=hasEvo?el('button','tg look',classicOf(id)?'🎩 كلاسيكي + إكسسوارات':'🎭 الشكل المتطوّر',()=>{
      S.hcl=S.hcl||{}; if(S.hcl[id])delete S.hcl[id]; else S.hcl[id]=1; save(); try{syncHeroes()}catch(e){} shopMsg(classicOf(id)?'الشكل الكلاسيكي: بتظهر الإكسسوارات اللي لبستها':'الشكل المتطوّر: كل مرحلة صورة جديدة (بلا إكسسوارات)'); shopRender() }):null;
    info.append(top,pips,abl,nxt,bar,xt,btn); if(look)info.append(look); const skr=hasEvo?skinRow(id,cv2):null; if(skr)info.append(skr); card.append(cv2,info); g.appendChild(card);
  }
  if(!g.children.length)g.appendChild(el('div','edhint','اشترِ بطل من تبويب الأبطال أولاً'));
}
