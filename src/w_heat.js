/* =============== DEATH HEATMAP (all on this device) ===============
   The death log (DLOG, per level: deaths per 4 tiles + per cause) drawn as a strip, a top-3 of the deadliest spots and a cause breakdown, at the end of the achievements screen.
   Read-only: it never touches the game. (A "race yourself" ghost replay existed briefly and was removed on the owner's request.) */
try{ localStorage.removeItem('td_gh') }catch(e){}      // leftover of the removed ghost replay
const HEAT={sel:''};
function heatKeys(){ return Object.keys(DLOG).filter(k=>/^\d+$/.test(k)&&DLOG[k].n>0).sort((a,b)=>DLOG[b].n-DLOG[a].n) }
function heatStrip(e){
  const mx=Math.max(...Object.keys(e.b).map(Number),9), top=Math.max(...Object.values(e.b),1), st=el('div','hstrip');
  for(let i=0;i<=mx;i++){ const n=e.b[i]|0, t=n/top, b=el('i'); b.style.height=(n?Math.max(10,t*100):5)+'%'; b.style.background=n?'hsl('+Math.round(52-52*t)+',92%,'+Math.round(58-8*t)+'%)':'#ffffff1a'; b.title='البلاطة '+(i*4)+'–'+(i*4+3)+': '+n; st.appendChild(b) }
  return st;
}
function heatRender(L2){
  const box=el('div','heat'), keys=heatKeys(), total=Object.values(DLOG).reduce((s,e)=>s+(e.n|0),0);
  const hd=el('div','dyh'); hd.append(el('b',null,'📊 خريطة موتك'),el('span','sub','مجموع '+total+' موتة · بتنحفظ عندك بس'));
  box.appendChild(hd);
  if(!keys.length){ box.appendChild(el('div','edhint','لسا ما متّ ولا مرة بالمراحل... 😇')); L2.appendChild(box); return }
  if(!DLOG[HEAT.sel]||!keys.includes(HEAT.sel))HEAT.sel=keys[0];
  const chips=el('div','acchips'); for(const k of keys.slice(0,8))chips.appendChild(el('button','ch'+(k===HEAT.sel?' on':''),'مرحلة '+k+' ×'+DLOG[k].n,()=>{ HEAT.sel=k; achRender() }));
  box.appendChild(chips);
  const e=DLOG[HEAT.sel], spots=Object.entries(e.b).sort((a,b)=>b[1]-a[1]).slice(0,3), cs=Object.entries(e.c).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const strip=el('div','hwrap'); { const ax=el('div','hax'); ax.append(el('span',null,'البداية'),el('span',null,'كل عمود = 4 بلاطات'),el('span',null,'النهاية')); strip.append(heatStrip(e),ax) } box.appendChild(strip);
  box.appendChild(el('div','hline','📍 الأخطر: '+spots.map(([b,n])=>'البلاطة '+(b*4)+'–'+(b*4+3)+' ('+n+')').join(' · ')));
  const cl=el('div','hcs'); for(const [c,n] of cs){ const r=el('div','hc'), pc=Math.round(n/e.n*100); r.append(el('span','nm',CAUSE_NM[c]||c),(()=>{ const bar=el('div','bar'), f=el('div','fill'); f.style.width=pc+'%'; bar.appendChild(f); return bar })(),el('span','num',pc+'%')); cl.appendChild(r) }
  box.appendChild(cl);
  L2.appendChild(box);
}
