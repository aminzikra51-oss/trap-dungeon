/* =============== ECONOMY (local-first, no ads, no real money) ===============
   Coins picked up in a level are PENDING (G.pend). They reach the wallet (S.wallet) when you touch a real checkpoint or clear the level; die first and they are lost.
   Each coin pays only once per level (S.cc[level] = keys already paid) so replaying level 1 is not a money machine. Clearing a level the first time pays a bonus.
   Custom (editor) maps never pay. Nothing here touches physics: the coin rows added by seedCoins are deterministic (hash01, no RG) and honest coins have no effect on the world. */
const SHOP={open:false,tab:'h'};
if(!S.ecoV){ S.ecoV=1; S.own=S.own||{}; S.own[S.hero||'falafel']=1 }          // first run of the economy: keep the hero the player already uses
S.wallet=S.wallet||0; S.cc=S.cc||{}; S.cl=S.cl||{}; S.nd=S.nd||{}; S.own=S.own||{}; S.own.falafel=1; if(!S.own[S.hero])S.hero='falafel'; S.ow=S.ow||{}; if(S.bgPick==null)S.bgPick=-1;

const HERO_PRICE={falafel:0,uncle:60,chicken:100,cat:160,grandma:220,donkey:280,robot:340,mushroom:400};
const heroOwned=id=>!!S.own[id];
const worldPos=i=>WORLD_ORDER.indexOf(i);
const worldFirstLevel=i=>worldPos(i)*5+1;                                    // the level where the campaign enters this world
const worldPrice=i=>worldPos(i)<=0?0:40+worldPos(i)*20;                      // buy it early instead of reaching it
const worldOpen=i=>worldPos(i)<=0||S.best>=worldFirstLevel(i)||!!S.ow[i];

const coinKey=e=>Math.round(e.x/4)*1000+Math.round(e.y/4);
function econToast(txt,bad){
  if(SIM)return; const el=$('gain'); if(!el)return; el.textContent=txt; el.className=bad?'bad':'';
  el.style.animation='none'; void el.offsetWidth; el.style.animation='gainup 1.9s ease-out forwards';
}
function econPick(e){ G.pend.push(coinKey(e)); hud() }
function econBank(){                                  // pending -> wallet; returns what was really paid
  const pend=G.pend; G.pend=[]; if(SIM||G.custom||!pend.length)return 0;
  const paid=S.cc[G.level]||(S.cc[G.level]=[]); let g=0;
  for(const k of pend){ if(!paid.includes(k)){ paid.push(k); g++ } }
  if(g){ S.wallet+=g; save() }
  hud(); return g;
}
function econCheckpoint(){ const g=econBank(); if(g)econToast('+'+g+' 🪙 انحفظت 🚩') }
function econClear(){                                 // called once when a real level is cleared
  if(SIM||G.custom)return; const g=econBank(); let b=0;
  if(!S.cl[G.level]){ S.cl[G.level]=1; b+=L.boss?30:10 }
  if(G.lvDeaths===0&&!S.nd[G.level]){ S.nd[G.level]=1; b+=L.boss?15:5 }
  if(b){ S.wallet+=b; save() }
  G.gain=g+b; if(g+b){ econToast('+'+(g+b)+' 🪙'+(b?'  (بونص '+b+')':'')) }
  hud();
}
function econDeath(){                                 // un-banked coins are gone (the game teases you about it)
  const n=G.pend.length; G.pend=[]; if(SIM||G.custom||!n)return;
  econToast('ضاعت '+n+' 🪙 😭 (ما لحقت تحفظها)',1);
}
function econBuyHero(id){
  if(heroOwned(id))return 'owned'; const p=HERO_PRICE[id]; if(p==null)return 'none'; if(S.wallet<p)return 'poor';
  S.wallet-=p; S.own[id]=1; save(); hud(); return 'ok';
}
function econBuyWorld(i){
  if(worldOpen(i))return 'owned'; const p=worldPrice(i); if(S.wallet<p)return 'poor';
  S.wallet-=p; S.ow[i]=1; save(); hud(); return 'ok';
}
/* cosmetic: the chosen world replaces the level's own background (never the map itself) */
function econTheme(th){ return (S.bgPick>=0&&S.bgPick<THEMES.length&&worldOpen(S.bgPick))?S.bgPick:th }

/* ---- extra honest coins: rows on safe ground + arcs over pits (risk/reward). Deterministic: hash01 only. ---- */
function seedCoins(){
  if(G.custom||L.boss)return; const n=L.n, ex=L.exitTx, w=L.w, have=L.ents.filter(e=>e.t==='coin'&&!e.bait).length;
  if(have>=10)return;
  const bad=new Uint8Array(w+14), mark=(a,b)=>{ for(let t=Math.max(0,a);t<=Math.min(w+13,b);t++)bad[t]=1 };
  for(let t=0;t<w;t++){ if(L.ground[t]<0||L.cr[t])bad[t]=1 }
  for(const e of L.ents){
    if(e.t==='coin'||e.t==='cp'||e.t==='chase'||e.t==='ghost')continue;
    const x=entX(e); if(typeof x==='number'&&isFinite(x)){ const t=Math.floor(x/TS); mark(t-3,t+3) }
    if(e.x0!=null&&e.x1!=null){ mark(Math.floor(Math.min(e.x0,e.x1)/TS)-1,Math.floor(Math.max(e.x0,e.x1)/TS)+1) }
  }
  for(const k in L.blocks){ const t=+k.split(',')[0]; mark(t-1,t+1) }
  for(const s of L.signs)mark(s.tx-1,s.tx+1);
  for(const z of L.zones)mark(Math.floor(z.x0/TS),Math.floor(z.x1/TS));
  const near=(x,y)=>L.ents.some(e=>e.t==='coin'&&Math.abs(e.x-x)<26&&Math.abs(e.y-y)<26);
  const put=(x,y)=>{ if(!near(x,y))L.ents.push(mkCoin(x,y,false)) };
  // 1) rows of three on safe ground
  const rows=clamp(Math.round((ex-20)/10),4,12)-Math.floor(have/3);
  for(let k=0;k<rows;k++){
    const base=10+Math.floor((ex-24)*(k+.5)/rows)+Math.floor(hash01(n,k,11)*5)-2;
    let done=false;
    for(let d=0;d<=6&&!done;d++)for(const sg of [1,-1]){
      const t=base+d*sg; if(t<8||t+3>ex-4)continue;
      if(!bad[t]&&!bad[t+1]&&!bad[t+2]){ for(let i=0;i<3;i++)put((t+i)*TS+16,GY-26); mark(t-1,t+3); done=true; break }
    }
  }
  // 2) arcs over the widest pits: reachable with a normal jump, the reward for crossing
  const pits=(L.pits||[]).filter(p=>p[1]>=3&&p[0]>=9&&p[0]+p[1]<=ex-4).sort((a,b)=>hash01(n,a[0],5)-hash01(n,b[0],5)).slice(0,3);
  for(const [px,pl] of pits){ const cx=(px+pl/2)*TS; put(cx-34,GY-58); put(cx,GY-78); put(cx+34,GY-58) }
}
