/* =============== EMOJI + QUICK PHRASES between two online players (co-op and race) ===============
   A fixed table, no free text (nothing to moderate): 8 emojis and 8 funny phrases, sent as {t:'em',i:0..15} over the SAME channel the game already uses (NET.tr).
   Keys: T opens the bar (emojis), T again = phrases, T again = closed; 1..8 send. A 💬 button does the same for touch. Rate limit 0.9 s on my side, 0.45 s on the receiving side.
   It is drawn above the sender's head for 2.6 s. Nothing here touches the simulation (it is not part of the lockstep state or the snapshots). Not available in local co-op (same keyboard). */
const RX={mode:0,list:[],last:0,got:0,hideT:0};
const RX_EMO=['😂','😭','😱','👍','🔥','💀','❤️','🙏'];
const RX_TXT=['يلّا حبيبي!','استنّاني!','شو هالفخ؟!','ما تموت!','تعا لهون','ارجع ورا','ضربة معلّم 👏','رحمة الله عليك 😂'];
const rxText=i=>i<8?RX_EMO[i]:RX_TXT[i-8];
const rxOk=()=>NET.link==='play'&&!!NET.tr&&(G.state==='play'||G.state==='dead'||G.state==='win');
function rxPush(w,i){ RX.list.push({w,i,t0:performance.now()}); if(RX.list.length>6)RX.list.shift() }
function rxSend(i){
  i=i|0; if(i<0||i>15||!rxOk())return false;
  const now=performance.now(); if(now-RX.last<900)return false; RX.last=now;
  rxPush(0,i); try{ NET.tr.send({t:'em',i}) }catch(e){} Snd.ui&&Snd.ui(); rxClose(); return true;
}
function rxGot(m){
  const i=m&&m.i; if(typeof i!=='number'||!Number.isInteger(i)||i<0||i>15)return;
  const now=performance.now(); if(now-RX.got<450)return; RX.got=now; rxPush(1,i); Snd.ui&&Snd.ui();
}
function rxRender(){
  const bar=$('rxBar'); if(!bar)return; bar.classList.toggle('hide',!RX.mode); bar.textContent='';
  if(!RX.mode)return; const base=RX.mode===1?0:8;
  for(let k=0;k<8;k++){ const b=el('button','rxb'+(RX.mode===2?' tx':''),rxText(base+k),()=>rxSend(base+k)); b.append(el('i',null,String(k+1))); bar.append(b) }
}
function rxMode(m){ RX.mode=m; clearTimeout(RX.hideT); if(m)RX.hideT=setTimeout(()=>rxMode(0),8000); rxRender() }
const rxClose=()=>rxMode(0);
function rxToggle(){ if(!rxOk())return; rxMode((RX.mode+1)%3) }
function rxDraw(c,cam){                                                                    // called inside the world transform, after the hero speech bubble
  const now=performance.now(); RX.list=RX.list.filter(e=>now-e.t0<2600); if(!RX.list.length)return;
  for(const e of RX.list){
    const o=e.w===0?P:(G.race?G.race.opp:(G.co&&PLY[1-G.co.me])); if(!o)continue;
    const age=(now-e.t0)/1000, x=o.x+PW/2, y=o.y-(e.w===0?46:32)-Math.min(age,1)*10, txt=rxText(e.i);
    if(e.i<8){
      const s=Math.min(1,age*7), a=age>2?Math.max(0,1-(age-2)/.6):1;
      c.save(); c.globalAlpha=a; c.translate(clamp(x,cam+20,cam+VW-20),y); c.scale(.4+.6*s,.4+.6*s); c.font='34px serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(txt,0,0); c.restore();
    } else { const w=Math.max(34,txt.length*9+20); bubble(c,clamp(x,cam+w/2+6,cam+VW-w/2-6),y+12,txt,age,e.w===0?'#fff3c4':'#d8f3ff') }
  }
}
addEventListener('keydown',e=>{
  if(e.repeat||!rxOk()||(e.target&&/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)))return;
  if(e.code==='KeyT'){ rxToggle(); e.preventDefault(); return }
  if(RX.mode){ const m=/^Digit([1-8])$/.exec(e.code); if(m){ rxSend((+m[1]-1)+(RX.mode===2?8:0)); e.preventDefault() } }
});
$('rxBtn').onclick=()=>{ Snd.init&&Snd.init(); rxToggle() };
setInterval(()=>{ const ok=rxOk(); $('rxBtn').classList.toggle('hide',!ok); if(!ok&&RX.mode)rxClose(); if(!ok&&RX.list.length&&NET.link!=='play')RX.list.length=0 },300);
