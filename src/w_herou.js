/* =============== SHOP TABS: hero upgrades + accessories =============== */
SHOP.hero=null;
const ROMAN=['I','II','III','IV'];
function heroUpRender(g){
  for(const id of HERO_IDS){
    if(!heroOwned(id))continue;
    const st=heroStage(id), A=HAB[id], need=st<3?XP_NEED[st]:0, xp=xpOf(id), card=el('div','shc up'+(S.hero===id?' sel':'')), cv2=document.createElement('canvas'); cv2.width=64; cv2.height=84; paintHero(cv2,id);
    const info=el('div','upi');
    const top=el('div','upt'); top.append(el('b','nm',HEROES[id].name),el('span','stg',ROMAN[st]+' · '+STAGE_NM[st]));
    const pips=el('div','pips2'); for(let k=0;k<4;k++)pips.appendChild(el('i',k<=st?'on':'',ROMAN[k]));
    const abl=el('div','abl'); abl.append(el('span','ic',A.ic),el('b',null,A.nm),el('span','ds',A.ds));
    const nxt=el('div','nxt',st<3?'التالي: '+A.tx[st+1]:'✓ '+A.tx[3]);
    const bar=el('div','bar'), fill=el('div','fill'); fill.style.width=(st<3?clamp(xp/need,0,1)*100:100)+'%'; fill.style.background=st<3&&xp<need?'#7c4dff':'#ffd23f'; bar.appendChild(fill);
    const xt=el('div','xpt',st<3?'الخبرة '+'⁦'+xp+' / '+need+'⁩  ·  بتجيبها من مراحل تخلّصها فيه ومن موتاته':'مستوى أسطوري 👑');
    let btn;
    if(st>=3)btn=el('button','btn poor','أقصى مرحلة');
    else{ const c=UP_COST[st], poorXp=xp<need, poorC=S.wallet<c;
      btn=el('button','btn'+((poorXp||poorC)?' poor':''),poorXp?'ناقصك '+(need-xp)+' خبرة':'⬆ ترقية 🪙 '+c+(poorC?'  (ناقصك '+(c-S.wallet)+')':''),()=>{
        const r=upgradeHero(id); if(r==='ok'){ Snd.coin(); Snd.win(); shopMsg('ترقّى '+HEROES[id].name+' للمرحلة '+ROMAN[heroStage(id)]+' 🎉'+(ACCS[id][heroStage(id)-1]?' — اكسسوار جديد: '+ACCS[id][heroStage(id)-1][4]:'')) } else if(r==='xp')shopMsg('بدك خبرة أكتر بهالبطل — العب فيه'); else if(r==='poor')shopMsg('ناقصك عملات 🪙'); shopRender() }) }
    info.append(top,pips,abl,nxt,bar,xt,btn); card.append(cv2,info); g.appendChild(card);
  }
  if(!g.children.length)g.appendChild(el('div','edhint','اشترِ بطل من تبويب الأبطال أولاً'));
}
