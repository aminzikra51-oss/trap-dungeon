/* =============== WORLD MAP ===============
   A winding path through the 16 worlds (5 levels each, a boss every 10th level), then an endless node.
   Every level you reached is replayable from here; each cleared level shows up to 3 stars (clear / no death / every coin banked, see w_econ.js).
   Levels beyond your real progress (S.best) are locked: the map is also the honest way to see how far you are. */
const WM={open:false,from:null};
const WMW=700, WM_BAN=62, WM_ROW=60, WM_PAD=26, WM_WH=WM_BAN+WM_PAD+5*WM_ROW+22;     // block width / banner / node row / world block height
function wmPos(n){                                   // centre of level n (1-based), in map pixels
  const w=Math.floor((n-1)/5), k=(n-1)%5, i=n-1;
  return {x:Math.round(WMW*(.5+.31*Math.sin(i*1.07+.55))), y:Math.round(w*WM_WH+WM_BAN+WM_PAD+k*WM_ROW+WM_ROW*.45)};
}
function wmPath(a,b,pts){                            // smooth (Catmull-Rom -> cubic) path through pts[a..b]
  let d='M'+pts[a].x+' '+pts[a].y;
  for(let i=a;i<b;i++){ const p0=pts[Math.max(0,i-1)], p1=pts[i], p2=pts[i+1], p3=pts[Math.min(pts.length-1,i+2)];
    d+=' C'+(p1.x+(p2.x-p0.x)/6).toFixed(1)+' '+(p1.y+(p2.y-p0.y)/6).toFixed(1)+' '+(p2.x-(p3.x-p1.x)/6).toFixed(1)+' '+(p2.y-(p3.y-p1.y)/6).toFixed(1)+' '+p2.x+' '+p2.y }
  return d;
}
const svgEl=(tag,at)=>{ const e=document.createElementNS('http://www.w3.org/2000/svg',tag); for(const k in at)e.setAttribute(k,at[k]); return e };
function wmStart(n){
  closeMap(); G.cpX=null; G.lastLvl=-9; $('menu').classList.add('hide'); G.state='play'; startGame(n);
}
function wmRender(keepScroll){
  const sc=$('wmScroll'), top=sc.scrollTop, root=$('wmInner'); root.innerHTML='';
  const NW=WORLD_ORDER.length, NL=NW*5, H=NW*WM_WH+120; root.style.height='calc(var(--u)*'+H+')';
  const pts=[]; for(let n=1;n<=NL+1;n++)pts.push(wmPos(n));
  // world blocks (background + banner)
  for(let w=0;w<NW;w++){
    const i=WORLD_ORDER[w], th=THEMES[i], first=w*5+1, reached=S.best>=first, blk=el('div','wmw'+(reached?'':' lock')+(w%2?' odd':'')), cv2=document.createElement('canvas'); cv2.width=200; cv2.height=112; cv2.className='wmbg';
    blk.style.top='calc(var(--u)*'+(w*WM_WH)+')'; blk.style.height='calc(var(--u)*'+(WM_WH-4)+')'; blk.style.setProperty('--wc',th.top||'#444'); blk.style.setProperty('--wf',th.floor||'#222');
    const draw=()=>{ if(!WM.open||!cv2.isConnected)return; try{ cv2.getContext('2d').drawImage(worldThumb(i),0,0) }catch(e){} }; setTimeout(draw,40+w*45);
    let st=0; for(let k=0;k<5;k++)st+=starsOf(first+k);
    const ban=el('div','wmb'); ban.append(el('b',null,'العالم '+(w+1)+' · '+th.nm), el('span','wmst','⭐ '+'⁦'+st+'/15'+'⁩'));
    if(!reached){ ban.append(el('span','wmlk','🔒 بتوصله بالمرحلة '+first)); const bb=el('button','tg','🛒 خلفية',()=>openShop('w')); ban.appendChild(bb) }
    else if(S.bgPick===i)ban.append(el('span','wmlk','🎨 خلفيتك'));
    blk.append(cv2,ban); root.appendChild(blk);
  }
  // path
  const svg=svgEl('svg',{class:'wmsvg',viewBox:'0 0 '+WMW+' '+H,preserveAspectRatio:'none'});
  svg.appendChild(svgEl('path',{d:wmPath(0,NL,pts),class:'wmp0'}));
  const cur=Math.min(Math.max(1,S.best),NL+1); if(cur>1)svg.appendChild(svgEl('path',{d:wmPath(0,cur-1,pts),class:'wmp1'}));
  root.appendChild(svg);
  // nodes
  for(let n=1;n<=NL+1;n++){
    const p=pts[n-1], inf=n>NL, boss=!inf&&n%10===0, locked=n>S.best, isCur=n===S.best&&!(S.cl[n]), done=n<S.best||!!S.cl[n], sc3=starsOf(n);
    const b=el('button','wn'+(boss?' boss':'')+(inf?' inf':'')+(locked?' lock':'')+(done?' done':'')+(isCur?' cur':''));
    b.style.left='calc(var(--u)*'+p.x+')'; b.style.top='calc(var(--u)*'+p.y+')';
    b.append(el('span','n',inf?'∞':(locked?'🔒':(boss?'👑':String(n)))));
    if(!locked&&boss)b.appendChild(el('span','bn',String(n)));
    if(inf)b.appendChild(el('span','infcap',S.best>NL?'كمّل '+S.best:'ما بتخلص 😈'));
    if(!locked&&!inf){ const s=el('span','stars'); for(let k=0;k<3;k++)s.appendChild(el('i',k<sc3?'on':'','★')); b.appendChild(s) }
    b.title=inf?'مراحل لا نهائية':'المرحلة '+n+(boss?' — زعيم 👑':'');
    if(!locked)b.onclick=()=>{ Snd.init(); Snd.ui&&Snd.ui(); wmStart(inf?Math.max(S.best,NL+1):n) };
    root.appendChild(b);
    if(isCur){ const hc=document.createElement('canvas'); hc.width=64; hc.height=74; hc.className='wmhero'; hc.style.left='calc(var(--u)*'+(p.x+(p.x>WMW/2?-50:50))+')'; hc.style.top='calc(var(--u)*'+(p.y+6)+')'; paintHero(hc,S.hero||'falafel'); root.appendChild(hc) }
  }
  wmTrials();
  let tot=0; for(const k in S.cl)tot+=starsOf(+k);
  $('wmSt').textContent='⭐ '+'⁦'+tot+'/'+Math.max(3,(S.best-1)*3)+'⁩  ·  🎖 '+titleText(); $('wmW').textContent='🪙 '+S.wallet;
  if(keepScroll)sc.scrollTop=top;
}
function wmTrials(){                                  // the 8 hero trials: always visible above the scrolling map
  const box=$('wmTr'); box.innerHTML=''; box.className='wmtr'; box.appendChild(el('span','lb','🦸 تحدّيات الأبطال'));
  TRIALS.forEach((T,k)=>{
    const own=heroOwned(T.id), open=own&&S.best>=TR_UNLOCK, done=!!S.tr[T.id], b=el('button','tb'+(open?(done?' done':' on'):' lock')), cv2=document.createElement('canvas'); cv2.width=36; cv2.height=42; paintHero(cv2,T.id);
    b.appendChild(cv2); if(done||!open)b.appendChild(el('i',null,done?'✅':'🔒'));
    b.title=T.nm+' — '+T.ds; b.onclick=()=>{ if(!open){ wmHint(S.best<TR_UNLOCK?'🔒 التحدّيات بتنفتح لما توصل للمرحلة '+TR_UNLOCK:'🔒 '+T.nm+': لازم تملك '+HEROES[T.id].name+' (من المتجر)'); return } Snd.init(); Snd.ui&&Snd.ui(); trialStart(k) };
    box.appendChild(b);
  });
}
function wmHint(t){ const h=$('wmHint'); if(h){ h.textContent=t; h.classList.add('flash'); setTimeout(()=>h.classList.remove('flash'),1400) } }
function openMap(){
  WM.open=true; K.l=K.r=K.j=K.jp=false; $('wmap').classList.remove('hide'); Snd.init(); wmRender();
  const sc=$('wmScroll'), u=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--u'))||1, y=wmPos(Math.min(Math.max(1,S.best),WORLD_ORDER.length*5+1)).y*u; sc.scrollTop=Math.max(0,y-sc.clientHeight*.45);
}
function closeMap(){ WM.open=false; $('wmap').classList.add('hide'); hud() }
$('wmX').onclick=closeMap; $('wmAch').onclick=openAch; $('wmShop').onclick=()=>openShop('w');
for(const id of ['bMapT','bMap'])$(id).onclick=openMap;
