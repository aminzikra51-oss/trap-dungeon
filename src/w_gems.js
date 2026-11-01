/* =============== GEMS 💎 + PLAYER LEVEL 🔰 (player XP) ===============
   Two numbers that live NEXT TO the coins (S.wallet), not instead of them:
     S.gems = gems. The "hard" currency. Later: bought for real money and exchanged for coins. Today NOTHING in the game gives or spends them - only the admin console (w_admin.js).
     S.pxp  = player experience (total). The player level is derived from it (plLevel). It is NOT the hero xp (S.hx[id], which upgrades a hero): this one belongs to the player and shows on
              the profile, the ranking and the HUD. Level n needs plNeed(n) = 50*(n-1)*n xp in total (1:0, 2:100, 3:300, 4:600, 5:1000 ...), capped at level 100.
   Nothing is shown while both are 0 (plOn()), so a player who never got any sees exactly the old screens. gemAdd / plAdd are the ONE way to change them (clamped, saved, toast), so the later
   "buy gems" / "earn xp" code has a single door. Honest limit: the save lives in the browser, so these numbers are not secure; real money needs an account + a server wallet first. */
const GEM_MAX=999999, PL_MAX=100, PXP_MAX=9999999;
S.gems=Math.max(0,Math.min(GEM_MAX,S.gems|0)); S.pxp=Math.max(0,Math.min(PXP_MAX,S.pxp|0));
const plNeed=n=>50*(n-1)*n;                                                   // total xp needed to REACH level n
function plLevel(xp){ xp=xp==null?S.pxp|0:xp; let n=1; while(n<PL_MAX&&xp>=plNeed(n+1))n++; return n }
function plProg(){                                                            // {n, cur, need, pct} for the bar; at the top level the bar is full
  const xp=S.pxp|0, n=plLevel(xp); if(n>=PL_MAX)return {n,cur:0,need:0,pct:1};
  const a=plNeed(n), b=plNeed(n+1); return {n,cur:xp-a,need:b-a,pct:(xp-a)/(b-a)};
}
const plOn=()=>(S.gems|0)>0||(S.pxp|0)>0;
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
