/* =============== GEMS 💎 + PLAYER LEVEL 🔰 (player XP) ===============
   Two numbers that live NEXT TO the coins (S.wallet), not instead of them:
     S.gems = gems. The "hard" currency. Later: bought for real money and exchanged for coins. Today NOTHING in the game gives or spends them - only the admin console (w_admin.js).
     S.pxp  = player experience (total). The player level is derived from it (plLevel). It is NOT the hero xp (S.hx[id], which upgrades a hero): this one belongs to the player and shows on
              the profile, the ranking and the HUD. Level n needs plNeed(n) = 50*(n-1)*n xp in total (1:0, 2:100, 3:300, 4:600, 5:1000 ...), capped at level 100.
   In the PUBLIC build nothing is shown while both are 0 (plOn()), so a player who never got any sees exactly the old screens; the private build always shows them. gemAdd / plAdd are the ONE way to change them (clamped, saved, toast), so the later
   "buy gems" / "earn xp" code has a single door. Honest limit: the save lives in the browser, so these numbers are not secure; real money needs an account + a server wallet first. */
const GEM_MAX=999999, PL_MAX=100, PXP_MAX=9999999;
S.gems=Math.max(0,Math.min(GEM_MAX,S.gems|0)); S.pxp=Math.max(0,Math.min(PXP_MAX,S.pxp|0));
const plNeed=n=>50*(n-1)*n;                                                   // total xp needed to REACH level n
function plLevel(xp){ xp=xp==null?S.pxp|0:xp; let n=1; while(n<PL_MAX&&xp>=plNeed(n+1))n++; return n }
function plProg(){                                                            // {n, cur, need, pct} for the bar; at the top level the bar is full
  const xp=S.pxp|0, n=plLevel(xp); if(n>=PL_MAX)return {n,cur:0,need:0,pct:1};
  const a=plNeed(n), b=plNeed(n+1); return {n,cur:xp-a,need:b-a,pct:(xp-a)/(b-a)};
}
let GEMS_SHOW=0;                                                                // the private build (w_admin.js, which the public build cuts out) sets this to 1: it always shows 💎/🔰 so the owner can see and test them; the public build only once somebody has some
let GEM_TEST=0;                                                                 // private build: the "buy gems" packs are free test buttons. Public build: 'soon' (real money needs accounts + a server wallet + a payment provider first)
const plOn=()=>GEMS_SHOW||(S.gems|0)>0||(S.pxp|0)>0;
function gemAdd(n){                                                           // +/- gems; returns the change really applied
  n=Math.round(+n); if(!isFinite(n)||!n)return 0;
  const was=S.gems|0; S.gems=Math.max(0,Math.min(GEM_MAX,was+n)); const d=S.gems-was; save(); hud();
  if(d)econToast('\u2066'+(d>0?'+':'')+d+'\u2069 💎',d<0); return d;
}
function plAdd(n){                                                            // +/- player xp; says so when the level changes
  n=Math.round(+n); if(!isFinite(n)||!n)return 0;
  const was=S.pxp|0, lv0=plLevel(); S.pxp=Math.max(0,Math.min(PXP_MAX,was+n)); const d=S.pxp-was, lv1=plLevel(); save(); hud();
  if(d)econToast('\u2066'+(d>0?'+':'')+d+' XP\u2069'+(lv1>lv0?'  🔰 مستوى '+lv1+'!':lv1<lv0?'  🔰 مستوى '+lv1:''),d<0); return d;      // \u2066..\u2069 keeps "+1730 XP" in one piece inside the right-to-left toast
}

/* ---------- the gem exchange (shop tab 💎) ----------
   GEMX is the ONE table of rates; change a number here and the shop, the skins and the tests follow.
     coins / xp : [gems paid, what you get]; the bigger packs carry a bonus (+10% / +20%).  xp = player xp (plAdd), not hero xp.
     packs      : [gems, USD] - the "buy gems" packs. PLACEHOLDER prices, nothing sells them yet (gemPack says 'soon' in the public build).
     skin       : coins per gem when a skin is paid with gems (price in gems = ceil(coins / skin)). */
const GEMX={ coins:[[10,100],[50,550],[100,1200]], xp:[[10,100],[50,550],[100,1200]], packs:[[80,0.99],[450,4.99],[1000,9.99],[2200,19.99]], skin:10 };
const gemBonus=(list,i)=>{ const r0=list[0][1]/list[0][0], r=list[i][1]/list[i][0]; return Math.round((r/r0-1)*100) };       // % extra compared with the smallest pack
function gemSpend(n){ n=Math.round(+n); if(!(n>0)||(S.gems|0)<n)return false; S.gems=(S.gems|0)-n; save(); hud(); return true }          // pay gems (no toast: the caller toasts what you got)
function gemBuyCoins(i){                                       // 'ok' | 'poor' | 'none'
  const o=GEMX.coins[i]; if(!o)return 'none'; if(!gemSpend(o[0]))return 'poor';
  S.wallet=Math.min(999999999,(S.wallet|0)+o[1]); save(); hud(); econToast('\u2066+'+o[1]+'\u2069 🪙'); return 'ok';
}
function gemBuyXp(i){                                          // 'ok' | 'poor' | 'none'
  const o=GEMX.xp[i]; if(!o)return 'none'; if(!gemSpend(o[0]))return 'poor'; plAdd(o[1]); return 'ok';
}
function gemPack(i){                                           // 'ok' (private test build: free) | 'soon' (public) | 'none'
  const o=GEMX.packs[i]; if(!o)return 'none'; if(!GEM_TEST)return 'soon'; gemAdd(o[0]); return 'ok';
}
