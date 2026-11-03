/* =============== ROUND MUTATORS (online co-op and race) ===============
   The host picks one in the lobby and it travels with the start message ('mu'). A mutator becomes ONE level-wide floor zone (L.zones), so physics, drawing,
   snapshots and rollbacks treat it like the zones that already exist (ice, float, mud...). 'chaos' picks another one for every level, from the level number and the
   match seed, so both machines get the same.
   Chase levels never get one (they are tuned to the plain running speed). A mutator only lives in G.co / G.race: single player is never touched.
     low    - the moon: low gravity (the existing 'float' zone)      oil    - everything is slippery, a little less than ice
     bounce - landing hard bounces you back up                         fast   - everybody runs 30 % faster */
const MUT_LIST=[['none','بدون طفرة','🚫'],['low','جاذبية القمر','🌙'],['oil','أرض زيت','🛢'],['bounce','أرض مطاطة','🏀'],['fast','سرعة البرق','⚡'],['chaos','فوضى (طفرة جديدة كل مرحلة)','🎲']];
const MUT_ZONE={low:'float',oil:'oil',bounce:'bounce',fast:'fast'}, MUT_POOL=['float','oil','bounce','fast'];
const MUT_NAME={float:'🌙 جاذبية القمر',oil:'🛢 أرض زيت',bounce:'🏀 أرض مطاطة',fast:'⚡ سرعة البرق'};
const MUT_SIGN={float:'جاذبية القمر 🌙\nالقفزة أعلى وأبطأ',oil:'الأرض كلها زيت! 🛢\nبتزلق',bounce:'الأرض مطاطة! 🏀\nكل هبوط بيرجّعك لفوق',fast:'سرعة البرق! ⚡\nانتبه للفرامل'};
const muSan=k=>MUT_LIST.some(m=>m[0]===k)?k:'none';
function muType(k,n,vs){ if(k==='chaos')return MUT_POOL[(((n|0)*7+(vs|0)*3)>>>0)%MUT_POOL.length]; return MUT_ZONE[k]||null }
/* the zone that covers the whole level (last in the list, so a local zone of the level wins where both are) */
function muZone(k,n,vs,W){ const t=muType(k,n,vs); return t?{x0:0,x1:W*TS,type:t,mut:1}:null }
const muNow=()=>G.co?G.co.mu:(G.race?G.race.mu:'none');
{ const box=document.getElementById('coMu'); if(box)for(const m of MUT_LIST){ const b=document.createElement('button'); b.className='tg'; b.dataset.cmu=m[0]; b.textContent=m[2]+' '+m[1]; box.appendChild(b) } }      // the lobby chips
