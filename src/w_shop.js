/* =============== SHOP (heroes + worlds) ===============
   Opens from the title screen, the pause menu and the map editor. Heroes cost coins; worlds unlock by reaching them in the campaign or can be bought early.
   Owning a world lets you pick it as your own background for the normal levels and use it in the map editor. */
function paintHero(cv2,id){
  const cx=cv2.getContext('2d'); cx.setTransform(1,0,0,1,0,0); cx.clearRect(0,0,cv2.width,cv2.height); cx.translate(cv2.width/2,cv2.height-5);
  if(heroThumb(cx,id))return; cx.scale(1.5,1.5);
  try{HEROES[id].draw(cx,{moving:false,rs:0,run:0,onGround:true,blink:false,ex:0,ey:0,dead:false,scream:false})}catch(e){}
}
const SHT={};                                                  // world thumbnails, painted once
function worldThumb(i){
  if(SHT[i])return SHT[i]; const th=THEMES[i], out=document.createElement('canvas'); out.width=200; out.height=112;
  try{
    const big=document.createElement('canvas'); big.width=VW; big.height=VH; const b=big.getContext('2d'), at0=AT; AT=3+i*.7;
    if(th.sc)drawScene(b,th,0);
    else{ b.fillStyle=th.bg; b.fillRect(0,0,VW,VH); const t=makeBg(th,i*31+7); for(let x=0;x<VW;x+=256){b.drawImage(t,x,0);b.drawImage(t,x,224)} b.fillStyle='rgba(0,0,0,.35)'; b.fillRect(0,0,VW,VH) }
    b.fillStyle=th.floor; b.fillRect(0,GY,VW,VH-GY); b.fillStyle=th.top; b.fillRect(0,GY-4,VW,8);
    AT=at0; out.getContext('2d').drawImage(big,0,0,200,112);
  }catch(e){}
  return SHT[i]=out;
}
function shopMsg(t){ $('shMsg').textContent=t||'' }
function shopRender(){
  $('shW').textContent='🪙 '+S.wallet; document.querySelectorAll('#shTabs .ch').forEach(b=>b.classList.toggle('on',b.dataset.t===SHOP.tab));
  const g=$('shGrid'); g.innerHTML=''; g.className='shgrid '+SHOP.tab;
  if(SHOP.tab==='h'){
    for(const id of HERO_IDS){
      const own=heroOwned(id), sel=S.hero===id, card=el('div','shc'+(sel?' sel':'')), cv2=document.createElement('canvas'); cv2.width=64; cv2.height=74; paintHero(cv2,id);
      const nm=el('div','nm',HEROES[id].name), p=HERO_PRICE[id];
      let btn; if(own) btn=el('button','btn',sel?'✓ مختار':'اختر',()=>{ if(sel)return; S.hero=id; save(); syncHeroes(); Snd.ui(); heroSelectSay(); shopRender() });
      else{ const poor=S.wallet<p; btn=el('button','btn'+(poor?' poor':''),'🪙 '+p+(poor?'  (ناقصك '+(p-S.wallet)+')':''),()=>{
        const r=econBuyHero(id); if(r==='ok'){ S.hero=id; save(); syncHeroes(); Snd.coin(); Snd.win(); shopMsg('مبروك! صار '+HEROES[id].name+' إلك 🎉'); heroSelectSay() } else if(r==='poor'){ Snd.bonk&&Snd.bonk(); shopMsg('ناقصك '+(p-S.wallet)+' 🪙 — كمّل العب واجمع عملات') } shopRender() }) }
      card.append(cv2,nm,btn); g.appendChild(card);
    }
  } else {
    const auto=el('div','shc'+(S.bgPick<0?' sel':'')), ab=el('button','btn',S.bgPick<0?'✓ تلقائي':'تلقائي',()=>{ S.bgPick=-1; save(); Snd.ui(); shopRender() });
    auto.append(el('div','shbig','🎲'),el('div','nm','تلقائي'),el('div','sub','العالم حسب المرحلة'),ab); g.appendChild(auto);
    const order=WORLD_ORDER.slice(); let k=0;
    for(const i of order){
      const th=THEMES[i], open=worldOpen(i), sel=S.bgPick===i, card=el('div','shc'+(sel?' sel':'')+(open?'':' lock')), cv2=document.createElement('canvas'); cv2.width=200; cv2.height=112;
      const draw=()=>{ if(!SHOP.open||SHOP.tab!=='w'||!cv2.isConnected)return; const t=worldThumb(i); cv2.getContext('2d').drawImage(t,0,0) }; setTimeout(draw,30+(k++)*22);
      const nm=el('div','nm',th.nm), p=worldPrice(i);
      let sub, btn;
      if(open){ sub=el('div','sub',worldPos(i)===0?'أول عالم':(S.ow[i]?'اشتريته':'وصلت له بالتقدم')); btn=el('button','btn',sel?'✓ مستخدمة':'استخدمها كخلفية',()=>{ S.bgPick=sel?-1:i; save(); Snd.ui(); shopRender() }) }
      else{ const poor=S.wallet<p; sub=el('div','sub','🔒 بتوصله بالمرحلة '+worldFirstLevel(i)); btn=el('button','btn'+(poor?' poor':''),'اشترِ 🪙 '+p+(poor?'  (ناقصك '+(p-S.wallet)+')':''),()=>{
        const r=econBuyWorld(i); if(r==='ok'){ Snd.coin(); Snd.win(); shopMsg('انفتح عالم «'+th.nm+'» 🎉 — صار متاح بالمحرّر وكخلفية') } else if(r==='poor'){ shopMsg('ناقصك '+(p-S.wallet)+' 🪙') } shopRender() }) }
      card.append(cv2,nm,sub,btn); g.appendChild(card);
    }
  }
}
function openShop(tab){
  if(tab)SHOP.tab=tab; SHOP.open=true; K.l=K.r=K.j=K.jp=false; shopMsg(''); $('shop').classList.remove('hide'); Snd.init(); shopRender();
}
function closeShop(){
  SHOP.open=false; $('shop').classList.add('hide'); syncHeroes(); hud(); if(G.state==='editor')edRender();
}
$('shX').onclick=closeShop;
document.querySelectorAll('#shTabs .ch').forEach(b=>b.onclick=()=>{ SHOP.tab=b.dataset.t; shopMsg(''); shopRender() });
$('bShopT').onclick=()=>openShop('h'); $('bShop').onclick=()=>openShop('h'); $('edShop').onclick=()=>openShop('w');
