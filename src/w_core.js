/* =============== STATE =============== */
const K={l:false,r:false,j:false,jp:false};
const G={state:'title',level:1,deaths:0,coins:0,t:0,deadT:0,cause:'',cardShown:false,winT:0,shake:0,camX:0,idleT:8,bannerT:0,bannerTxt:'',pausedFrom:null,lastVoice:'',lastLine:'',lvDeaths:0,lastLvl:0,deathAt:0,screamed:false,tok:0,winCard:null,winLen:2.4,cpX:null,dark:0,darkT:0,darkMax:2,mockCd:5,fakeHit:0,killer:null,snk:null,snkCd:0,warn:0,dj:0};
let L=null, P=null, parts=[], themeBg=null, SIM=false;
/* adaptive quality: 3 = full 2.5D | 2 = cheaper light + DPR 1.5 | 1 = no dynamic light, no dust, DPR 1 | 0 = flat classic look */
const Q={q:3,acc:0,w:0,n:0,bad:0,fps:60,dprCap:[1,1,1.5,2]};
const cv=$('cv'), ctx=cv.getContext('2d');

/* deterministic gameplay RNG (so a snapshot of the world can be replayed by the test planner) */
const RG={s:1};
const rf=()=>{RG.s=(RG.s+0x6D2B79F5)|0;let t=Math.imul(RG.s^RG.s>>>15,1|RG.s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const rfi=(a,b)=>a+Math.floor(rf()*(b-a+1));

/* =============== GEOMETRY HELPERS =============== */
const pcx=()=>P.x+PW/2;
const entX=e=>e.cx!==undefined?e.cx:(e.px!==undefined?e.px:e.x);
const prect=()=>({x:P.x+3,y:P.y+3,w:PW-6,h:PH-4});
const hitRect=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function circHit(cx,cy,r,a){const nx=clamp(cx,a.x,a.x+a.w),ny=clamp(cy,a.y,a.y+a.h);return(cx-nx)**2+(cy-ny)**2<r*r}
const solidFloor=(L,tx)=>{const g=L.ground[tx]; if(g<0)return false; const cr=L.cr[tx]; return !(cr&&cr.s===2)};
function zoneAt(x){ if(!L.zones.length)return null; for(const z of L.zones)if(x>=z.x0&&x<=z.x1)return z; return null }

/* =============== PLAYER / PHYSICS =============== */
const JUMP2=-430, BOUNCE=-400;
function newPlayer(tx){return{x:(tx||2)*TS,y:GY-PH,vx:0,vy:0,face:1,onGround:true,coy:0,buf:0,land:0,run:0,dead:false,blink:0,lastCr:-9,air:0,dj:false,stand:0,spin:0}}
function solidTile(tx,ty){
  if(tx<0||tx>=L.w)return true; if(ty<0)return false;
  if(L.gate!=null&&tx===L.gate&&ty<GR)return true;                  // boss room: sealed gate until the boss falls
  if(ty>=GR&&solidFloor(L,tx))return true;
  const b=L.blocks[tx+','+ty]; return !!b;
}
function moveX(dx){
  P.x+=dx; const tx0=Math.floor(P.x/TS),tx1=Math.floor((P.x+PW-.01)/TS),ty0=Math.floor(P.y/TS),ty1=Math.floor((P.y+PH-.01)/TS);
  for(let ty=ty0;ty<=ty1;ty++)for(let tx=tx0;tx<=tx1;tx++)if(solidTile(tx,ty)){ if(dx>0)P.x=tx*TS-PW; else if(dx<0)P.x=(tx+1)*TS; P.vx=0; return }
}
function moveY(dy){
  const pb=P.y+PH; P.y+=dy; P.onGround=false; const tx0=Math.floor(P.x/TS),tx1=Math.floor((P.x+PW-.01)/TS),ty0=Math.floor(P.y/TS),ty1=Math.floor((P.y+PH-.01)/TS);
  for(let ty=ty0;ty<=ty1;ty++)for(let tx=tx0;tx<=tx1;tx++)if(solidTile(tx,ty)){
    if(dy>0){P.y=ty*TS-PH;P.onGround=true;P.stand=0; if(P.vy>260){P.land=1;Snd.land();puff(P.x+PW/2,P.y+PH,4)} }
    else if(dy<0){P.y=(ty+1)*TS; const b=L.blocks[tx+','+ty]; if(b&&!b.rev){b.rev=true;b.bump=.3;Snd.bonk();say(rnd(['بونك! 🧱 كان في بلوكة مخفيّة','ولا شي هون... إلا بلوكة!','فاجأتك؟ 😏']),'any',2);G.shake=5} else if(b){b.bump=.2;Snd.bonk()} }
    P.vy=0; return;
  }
  if(dy>=0){ // one-way platforms (land only when coming from above)
    for(const e of L.ents){ if(e.t!=='plat'||!e.on)continue; if(P.x+PW<=e.x+1||P.x>=e.x+e.w-1)continue;
      if(pb<=e.y+1.5&&P.y+PH>=e.y){ if(P.vy>260){P.land=1;Snd.land();puff(P.x+PW/2,e.y,4)} P.y=e.y-PH;P.vy=0;P.onGround=true;P.stand=e.id;return }
    }
  }
  P.stand=0;
}
function stepPlats(dt){
  for(const e of L.ents){ if(e.t!==('plat'))continue; B.plat.move(e,dt) }
  if(P.stand){ const s=L.ents.find(e=>e.t==='plat'&&e.id===P.stand&&e.on); if(s&&P.onGround){P.x+=s.dx;P.y+=s.dy}else P.stand=0 }
}
function updatePlayer(dt){
  const p=P, z=zoneAt(p.x+PW/2);
  let dir=(K.r?1:0)-(K.l?1:0); if(z&&z.type==='rev')dir=-dir;
  let acc=p.onGround?ACC:AIRACC, fr=p.onGround?FRIC:260, g=GRAV, jv=JUMP, ice=false, drift=0;
  if(z){ if(z.type==='ice'){ice=true;acc=p.onGround?300:650;fr=p.onGround?60:70} else if(z.type==='float'){g=GRAV*.42;jv=JUMP*.82} else if(z.type==='wind')drift=z.dir*88 }
  if(dir){ if(!ice&&dir*p.vx<0)p.vx+=dir*acc*dt; p.vx+=dir*acc*dt; p.vx=clamp(p.vx,-RUN,RUN); p.face=dir; }
  else{ const f=fr*dt; p.vx=Math.abs(p.vx)<=f?0:p.vx-Math.sign(p.vx)*f; }
  if(K.jp){p.buf=.12;K.jp=false}
  p.buf-=dt; p.coy-=dt; if(p.onGround){p.coy=.1;p.dj=false;p.air=0}else p.air+=dt;
  if(p.buf>0){
    if(p.coy>0){p.vy=jv;p.onGround=false;p.stand=0;p.coy=0;p.buf=0;Snd.jump();puff(p.x+PW/2,p.y+PH,3)}
    else if(!p.dj&&p.air>.05){p.vy=JUMP2*(z&&z.type==='float'?.85:1);p.dj=true;p.buf=0;p.spin=.32;Snd.dj();ring(p.x+PW/2,p.y+PH)}
  }
  if(!K.j&&p.vy<-240)p.vy=-240;
  p.vy=Math.min(p.vy+g*dt,900);
  moveX((p.vx+drift)*dt); moveY(p.vy*dt);
  p.land=Math.max(0,p.land-dt*5); p.spin=Math.max(0,p.spin-dt); p.run+=Math.abs(p.vx)*dt*.09; p.blink-=dt; if(p.blink<-2.5)p.blink=.12;
  // crumble trigger
  if(p.onGround&&!p.stand){ const a=Math.floor(p.x/TS),b=Math.floor((p.x+PW-.01)/TS); for(let tx=a;tx<=b;tx++){const cr=L.cr[tx]; if(cr&&cr.s===0){trigCrumble(tx);p.lastCr=G.t} } }
  for(const k in L.blocks){const b=L.blocks[k]; if(b.bump>0)b.bump-=dt}
  if(p.x<0)p.x=0;
  if(p.y>VH+30&&!p.dead)die(G.t-p.lastCr<1.6?'crumble':'pit');
}
/* crumble: cr.mode  0 = normal (this tile), 'w' = wave over cr.grp tiles (delay grows with distance from the stepped tile) */
function trigCrumble(tx){
  const cr=L.cr[tx]; if(!cr||cr.s!==0)return;
  if(cr.wave){ const sp=cr.wave, from=cr.rev?cr.hi:cr.lo; // wave starts at the far end when rev, otherwise at the stepped tile
    for(let i=cr.lo;i<=cr.hi;i++){const c2=L.cr[i]; if(c2&&c2.s===0){c2.s=1;c2.t=0;c2.force=L.crDelay+.45+Math.abs(i-(cr.rev?cr.hi:tx))/sp}} }
  else{cr.s=1;cr.t=0;cr.force=L.crDelay}
  Snd.crumble();
}

/* =============== PARTICLES =============== */
function puff(x,y,n,col){if(SIM)return;for(let i=0;i<n;i++)parts.push({x,y,vx:(Math.random()-.5)*160,vy:-Math.random()*120-20,g:300,life:.5+Math.random()*.4,max:.9,s:3+Math.random()*5,col:col||'#cfc6e0',sh:'c'})}
function ring(x,y){if(SIM)return;parts.push({x,y,vx:0,vy:0,g:0,life:.35,max:.35,s:4,col:'#fff',sh:'o',vr:0})}
function confetti(x,y){if(SIM)return;const cols=['#ff4d5e','#ffd23f','#35d07f','#4dc3ff','#b37cff','#fff'];for(let i=0;i<70;i++)parts.push({x,y,vx:(Math.random()-.5)*520,vy:-Math.random()*520-80,g:700,life:1.6+Math.random(),max:2.4,s:4+Math.random()*4,col:cols[i%6],sh:'r',rot:Math.random()*6,vr:(Math.random()-.5)*14})}
function stars(x,y){if(SIM)return;for(let i=0;i<8;i++)parts.push({x,y,vx:Math.cos(i)*90,vy:Math.sin(i)*90-60,g:200,life:.9,max:.9,s:7,col:'#ffd23f',sh:'s',rot:0,vr:6})}
function debris(x,y,col){if(SIM)return;for(let i=0;i<5;i++)parts.push({x:x+Math.random()*TS,y,vx:(Math.random()-.5)*60,vy:-Math.random()*60,g:900,life:1,max:1,s:6+Math.random()*6,col,sh:'r',rot:0,vr:(Math.random()-.5)*8})}
function updParts(dt){for(const p of parts){p.vy+=p.g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;if(p.vr)p.rot+=p.vr*dt}parts=parts.filter(p=>p.life>0)}

/* =============== SNAPSHOT (used by the offline fairness planner) =============== */
function snap(){return JSON.stringify({P,ents:L.ents,cr:L.cr,blocks:L.blocks,zones:L.zones,rs:RG.s,t:G.t,st:G.state,ca:G.cause,co:G.coins,cp:G.cpX,ex:L.exitTx,gt:L.gate,bp:G.bossProg})}
function restore(s){const o=JSON.parse(s);P=o.P;L.ents=o.ents;L.cr=o.cr;L.blocks=o.blocks;L.zones=o.zones;RG.s=o.rs;G.t=o.t;G.state=o.st;G.cause=o.ca;G.coins=o.co;G.cpX=o.cp;L.exitTx=o.ex;L.gate=o.gt;G.bossProg=o.bp}
