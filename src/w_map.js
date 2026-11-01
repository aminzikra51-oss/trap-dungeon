/* =============== WORLD MAP ===============
   An endless winding path: worlds of 5 levels (the 16 themes repeat, "cycle 2" and on), a boss every 10th level. The map is as long as your progress plus two preview worlds,
   and only the worlds around the viewport are built (so level 400 costs the same as level 40).
   Progress is strictly sequential: level n+1 opens when you clear level n (S.best = the level you are on; only the frontier level moves it). Tapping an open level asks for the
   difficulty. Stars = the hardest difficulty a level was cleared on: normal 1, crazy 2, impossible 3 (S.cl[n], see w_ach.js). */
const WM={open:false,from:null,w0:0,w1:-1,raf:0};
const WMW=700, WM_BAN=62, WM_ROW=60, WM_PAD=26, WM_WH=WM_BAN+WM_PAD+5*WM_ROW+22, WM_MAXW=199;     // block width / banner / node row / world block height / levels stay below the 1001+ hero-trial pseudo levels
const wmWorlds=()=>Math.min(WM_MAXW,Math.max(4,Math.floor((Math.max(1,S.best)-1)/5)+3));          // the world you are in + 2 ahead (at least 4)
const wmU=()=>parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--u'))||1;
function wmPos(n){                                   // centre of level n (1-based), in map pixels
  const w=Math.floor((n-1)/5), k=(n-1)%5, i=n-1;
  return {x:Math.round(WMW*(.5+.31*Math.sin(i*1.07+.55))), y:Math.round(w*WM_WH+WM_BAN+WM_PAD+k*WM_ROW+WM_ROW*.45)};
}
function wmPath(a,b){                                // smooth (Catmull-Rom -> cubic) path through the level centres a..b
  const A=wmPos(a); let d='M'+A.x+' '+A.y;
  for(let i=a;i<b;i++){ const p0=wmPos(Math.max(1,i-1)), p1=wmPos(i), p2=wmPos(i+1), p3=wmPos(i+2);
    d+=' C'+(p1.x+(p2.x-p0.x)/6).toFixed(1)+' '+(p1.y+(p2.y-p0.y)/6).toFixed(1)+' '+(p2.x-(p3.x-p1.x)/6).toFixed(1)+' '+(p2.y-(p3.y-p1.y)/6).toFixed(1)+' '+p2.x+' '+p2.y }
  return d;
}
const svgEl=(tag,at)=>{ const e=document.createElementNS('http://www.w3.org/2000/svg',tag); for(const k in at)e.setAttribute(k,at[k]); return e };
function wmStart(n){
  closeMap(); G.cpX=null; G.lastLvl=-9; $('menu').classList.add('hide'); G.state='play'; startGame(n);
}
const WM_D=[['normal','عادي','🙂'],['crazy','مجنون','😈'],['hell','مستحيل','💀']];
function wmPick(n){                                  // difficulty chooser for one open level
  const box0=$('wmap').firstElementChild; let pk=$('wmPk'); if(!pk){ pk=el('div',null); pk.id='wmPk'; pk.onclick=e=>{ if(e.target===pk)pk.classList.add('hide') }; box0.appendChild(pk) }
  pk.innerHTML=''; pk.classList.remove('hide');
  const bx=el('div','pkb'), row=el('div','pkr'), got=starsOf(n);
  bx.append(el('b','pkt',(n%10===0?'👑 ':'')+'المرحلة '+n),el('div','pks','اختار الصعوبة — النجوم بتنحسب على أصعب صعوبة خلّصتها فيها'));
  for(const [k,nm,ic] of WM_D){
    const r=DRANK[k], b=el('button','pkd'+(S.diff===k?' on':'')+(got>=r?' got':'')), st=el('span','pst');
    for(let j=0;j<3;j++)st.appendChild(el('i',j<r?'on':'','★'));
    b.append(el('span','pi',ic),el('b',null,nm),st,el('span','pc',got>=r?'✓ خلّصتها':'')); b.onclick=()=>{ Snd.init(); Snd.ui&&Snd.ui(); setDiff(k); pk.classList.add('hide'); wmStart(n) }; row.appendChild(b);
  }
  bx.append(row,el('button','tg','✖ إلغاء',()=>pk.classList.add('hide'))); pk.appendChild(bx);
}
function wmRender(keepScroll,jump){
  const sc=$('wmScroll'), root=$('wmInner'), u=wmU(), NW=wmWorlds(), NL=NW*5, H=NW*WM_WH+200;
  root.style.height='calc(var(--u)*'+H+')';
  if(jump){ const f=Math.min(Math.max(1,S.best),NL+1); sc.scrollTop=Math.max(0,wmPos(f).y*u-sc.clientHeight*.45) }          // open where you are
  const top=sc.scrollTop, w0=clamp(Math.floor(top/u/WM_WH)-3,0,NW-1), w1=clamp(Math.floor((top+sc.clientHeight)/u/WM_WH)+3,0,NW-1), n0=w0*5+1, n1=w1*5+5; WM.w0=w0; WM.w1=w1; root.innerHTML='';
  for(let w=w0;w<=w1;w++){                                                              // world blocks (background + banner)
    const i=WORLD_ORDER[w%WORLD_ORDER.length], cyc=Math.floor(w/WORLD_ORDER.length)+1, th=THEMES[i], first=w*5+1, reached=S.best>=first, blk=el('div','wmw'+(reached?'':' lock')+(w%2?' odd':'')), cv2=document.createElement('canvas'); cv2.width=200; cv2.height=112; cv2.className='wmbg';
    blk.style.top='calc(var(--u)*'+(w*WM_WH)+')'; blk.style.height='calc(var(--u)*'+(WM_WH-4)+')'; blk.style.setProperty('--wc',th.top||'#444'); blk.style.setProperty('--wf',th.floor||'#222');
    const draw=()=>{ if(!WM.open||!cv2.isConnected)return; try{ cv2.getContext('2d').drawImage(worldThumb(i),0,0) }catch(e){} }; setTimeout(draw,40+(w-w0)*40);
    let st=0; for(let k=0;k<5;k++)st+=starsOf(first+k);
    const ban=el('div','wmb'); ban.append(el('b',null,'العالم '+(w+1)+' · '+th.nm+(cyc>1?' · الدورة '+cyc:'')), el('span','wmst','⭐ '+'\u2066'+st+'/15'+'\u2069'));
    if(!reached){ ban.append(el('span','wmlk','🔒 بتوصله بالمرحلة '+first)); if(w<WORLD_ORDER.length){ const bb=el('button','tg','🛒 خلفية',()=>openShop('w')); ban.appendChild(bb) } }
    else if(S.bgPick===i&&w<WORLD_ORDER.length)ban.append(el('span','wmlk','🎨 خلفيتك'));
    blk.append(cv2,ban); root.appendChild(blk);
  }
  const svg=svgEl('svg',{class:'wmsvg',viewBox:'0 0 '+WMW+' '+H,preserveAspectRatio:'none'});               // path
  svg.appendChild(svgEl('path',{d:wmPath(n0,Math.min(n1+1,NL+1)),class:'wmp0'}));
  const cur=Math.min(Math.max(1,S.best),NL+1), a1=Math.max(1,n0), b1=Math.min(cur,n1+1); if(b1>a1)svg.appendChild(svgEl('path',{d:wmPath(a1,b1),class:'wmp1'}));
  root.appendChild(svg);
  for(let n=n0;n<=Math.min(n1,NL);n++){                                                  // nodes
    const p=wmPos(n), boss=n%10===0, locked=n>S.best, isCur=n===S.best&&!S.cl[n], done=n<S.best||!!S.cl[n], sc3=starsOf(n);
    const b=el('button','wn'+(boss?' boss':'')+(locked?' lock':'')+(done?' done':'')+(isCur?' cur':''));
    b.style.left='calc(var(--u)*'+p.x+')'; b.style.top='calc(var(--u)*'+p.y+')';
    b.append(el('span','n',locked?'🔒':(boss?'👑':String(n))));
    if(!locked&&boss)b.appendChild(el('span','bn',String(n)));
    if(!locked){ const s=el('span','stars'); for(let k=0;k<3;k++)s.appendChild(el('i',k<sc3?'on':'','★')); b.appendChild(s) }
    b.title='المرحلة '+n+(boss?' — زعيم 👑':'');
    b.onclick=locked?()=>wmHint('🔒 لازم تخلّص المرحلة '+S.best+' أول'):()=>{ Snd.init(); Snd.ui&&Snd.ui(); wmPick(n) };
    root.appendChild(b);
    if(isCur){ const hc=document.createElement('canvas'); hc.width=64; hc.height=74; hc.className='wmhero'; hc.style.left='calc(var(--u)*'+(p.x+(p.x>WMW/2?-50:50))+')'; hc.style.top='calc(var(--u)*'+(p.y+6)+')'; paintHero(hc,S.hero||'falafel'); root.appendChild(hc) }
  }
  if(w1>=NW-1){                                                                          // the road goes on: a locked infinity node at the end
    const p=wmPos(NL+1), b=el('button','wn inf lock'); b.style.left='calc(var(--u)*'+p.x+')'; b.style.top='calc(var(--u)*'+p.y+')';
    b.append(el('span','n','∞'),el('span','infcap','المراحل ما بتخلص 😈')); b.onclick=()=>wmHint('♾ كل ما تتقدّم بتنفتح عوالم ومراحل جديدة'); root.appendChild(b);
  }
  wmTrials();
  $('wmSt').textContent='⭐ '+'\u2066'+starsTotal()+'/'+Math.max(3,(S.best-1)*3)+'\u2069  ·  🎖 '+titleText(); $('wmW').textContent='🪙 '+S.wallet;
}
function wmChk(){                                     // scrolled out of the built window? rebuild around the viewport
  WM.raf=0; if(!WM.open)return; const sc=$('wmScroll'), u=wmU(), v0=Math.floor(sc.scrollTop/u/WM_WH), v1=Math.floor((sc.scrollTop+sc.clientHeight)/u/WM_WH);
  if(v0<WM.w0||v1>WM.w1)wmRender(true);
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
function wmHint(t){ const h=$('wmHint'); if(h){ if(!h.dataset.d)h.dataset.d=h.textContent; h.textContent=t; h.classList.add('flash'); clearTimeout(WM.ht); WM.ht=setTimeout(()=>{ h.classList.remove('flash'); h.textContent=h.dataset.d },2200) } }      // flash a message, then back to the legend
function openMap(){
  WM.open=true; K.l=K.r=K.j=K.jp=false; $('wmap').classList.remove('hide'); Snd.init(); const pk=$('wmPk'); if(pk)pk.classList.add('hide'); wmRender(false,true);
}
function closeMap(){ WM.open=false; $('wmap').classList.add('hide'); hud() }
$('wmScroll').addEventListener('scroll',()=>{ if(WM.open&&!WM.raf)WM.raf=requestAnimationFrame(wmChk) },{passive:true});
$('wmX').onclick=closeMap; $('wmAch').onclick=openAch; $('wmShop').onclick=()=>openShop('w');
for(const id of ['bMapT','bMap'])$(id).onclick=openMap;
