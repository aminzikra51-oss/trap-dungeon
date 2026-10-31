/* =============== CUSTOM LEVELS (map editor v1) ===============
   A custom level is a small RECIPE, not a drawing: power n, difficulty, theme, salt and an ordered list of trap families/variants.
   buildLevel(n,{script,...}) turns the recipe into a real level, so a share code is ~30 characters and carries only numbers.
   The recipe -> world mapping must stay stable, otherwise old codes change meaning: bump GENV when the generator or a trap family
   changes what an existing recipe builds (test/editor.py keeps a golden hash that fails when that happens by accident).
   Registry order below is part of the code format: APPEND ONLY. */
const GENV=1;
const CF=[ // id, icon, Arabic name, unlock power, variants [[id, name, unlock]]
 {f:'pit',ic:'🕳',nm:'حفرة',mn:1,vs:[['plain','عادية',1],['wide','واسعة',3],['invis','بلاطة خفية',5],['mover','منصة متحركة',4],['stones','حجارة',5],['fish','سمكة',5],['ceil','سقف',7],['spring','نطّاطة',8]]},
 {f:'spike',ic:'🔺',nm:'أشواك',mn:1,vs:[['static','ثابتة',1],['hidden','مخفية',3],['pulse','نابضة',3],['slide','منزلقة',4],['hog','قنفذ',5],['sneak','متسللة',6],['check','رقعة',6],['rainspk','مطر أشواك',7]]},
 {f:'crumble',ic:'🧱',nm:'أرض تتفتت',mn:2,vs:[['plain','عادية',2],['trap','مفخخة',6],['wave','موجة',5],['rev','موجة معكوسة',7]]},
 {f:'arrow',ic:'🏹',nm:'سهام',mn:2,vs:[['lane','ممر',2],['volley','رشقة',5],['rain','مطر',6],['sniper','قنّاص',8],['rear','من الخلف',9]]},
 {f:'crush',ic:'🔨',nm:'سحق',mn:4,vs:[['drop','سقوط',4],['thwomp','دعّاس',4],['double','مزدوج',6]]},
 {f:'saw',ic:'⚙',nm:'منشار',mn:4,vs:[['floor','أرضي',4],['vert','عمودي',5],['pend','بندول',6],['orbit','مدار',7],['roll','متدحرج',8],['hi','عالي',10]]},
 {f:'walk',ic:'👾',nm:'كائن',mn:2,vs:[['walker','ماشي',2],['spiky','شوكي',4],['jumper','نطّاط',5],['charger','ثور',6],['bat','خفّاش',6]]},
 {f:'terrain',ic:'⛰',nm:'تضاريس',mn:5,vs:[['wall','جدار',5],['stair','درج',5],['tunnel','نفق',7],['highroad','طريق عالي',6]]},
 {f:'bait',ic:'🪙',nm:'طُعم',mn:5,vs:[]},
 {f:'chest',ic:'🎁',nm:'صندوق',mn:6,vs:[]},
 {f:'mole',ic:'🦔',nm:'خلد',mn:7,vs:[]},
 {f:'elev',ic:'🛗',nm:'مصعد',mn:7,vs:[]},
 {f:'frog',ic:'🐸',nm:'ضفدع',mn:8,vs:[]},
 {f:'fire',ic:'🔥',nm:'نار',mn:8,vs:[]},
 {f:'storm',ic:'⛈',nm:'عاصفة',mn:9,vs:[]},
 {f:'elec',ic:'⚡',nm:'كهربا',mn:9,vs:[]},
 {f:'laser',ic:'🔦',nm:'ليزر',mn:10,vs:[]},
 {f:'train',ic:'🚂',nm:'قطار',mn:11,vs:[]},
 {f:'cp',ic:'🚩',nm:'علم حفظ',mn:1,vs:[]},
 /* cosmetic families (editor perks): they NEVER reach the generator, so the world, the physics and the solver proof are identical with or without them */
 {f:'deco',ic:'🌳',nm:'زخرفة',mn:1,cosm:1,vs:[['tree','شجرة',1],['flowers','زهور',1],['skull','جمجمة',1],['barrel','برميل',1],['rock','صخرة',1],['mush','فطر',1],['statue','تمثال',1],['cactus','صبّار',1],['grave','قبر',1]]},
 {f:'sign',ic:'🪧',nm:'يافطة تريّق',mn:1,cosm:1,vs:[['s1','آمن 100%',1],['s2','أرض متينة',1],['s3','ما في شي',1],['s4','طريق سالك',1],['s5','فخ مجاني',1],['s6','مو ذنبي',1],['s7','أنت شاطر',1],['s8','شوي وبتفرح',1],['custom','نص من عندك ✍',1]]}
];
const CF_BY=Object.fromEntries(CF.map((c,i)=>[c.f,i]));
const DECO_I=CF_BY.deco, SIGN_I=CF_BY.sign, SIGN_CUSTOM=9;      // variant 9 of 'sign' carries user text (item[2])
const SIGN_TXT=['آمن 100%\nثق فيني ✔','الأرض قدامك\nمتينة جداً 🙂','ما تخاف\nما في شي هون','الطريق سالك\nوأنا ما بكذب','الفخ الجاي\nمجاني 🎁','لو متّ هلأ\nمو ذنبي 🤷','أنت شاطر!\n(لسا) 😏','شوي وبتفرح\nبس مو هلأ 😈'];
const DECO_EM=['🌳','🌼','💀','🛢','🪨','🍄','🗿','🌵','🪦'], DECO_SZ=[46,24,24,30,28,28,42,38,32];
const C_DIFF=['normal','crazy','hell'], C_MAXSEQ=330, C_MAXN=60, C_TXMAX=60;       // C_MAXSEQ = hard ceiling on all items; the real per-player caps are the editor perks (w_edperk.js)
const cNew=()=>({n:6,d:1,th:0,s:0,seq:[]});                       // seq items: [familyIndex, variantIndex+1 | 0 = let the generator choose, (custom sign only) text]
const cNeed=c=>c.seq.reduce((m,[f,v])=>Math.max(m,v?CF[f].vs[v-1][2]:CF[f].mn),1);
const cReal=c=>c.seq.filter(it=>!CF[it[0]].cosm);                  // the items that shape the world
const cTraps=c=>cReal(c).filter(it=>CF[it[0]].f!=='cp').length;
const cCount=(c,fam)=>c.seq.filter(it=>it[0]===CF_BY[fam]).length;
/* one sign text: no control chars / angle brackets, single spaces, at most C_TXMAX utf-8 bytes (cut on a whole character) */
function cText(s){ let a=Array.from(String(s==null?'':s).replace(/[\u0000-\u001f\u007f<>]/g,' ').replace(/\s+/g,' ').trim()); const E=new TextEncoder(); while(a.length&&E.encode(a.join('')).length>C_TXMAX)a.pop(); return a.join('').trim() }
/* a sign shows at most 3 short lines: break on spaces near 12 characters */
function signWrap(t){ if(t.includes('\n'))return t; const w=t.split(' '), out=[]; let cur=''; for(let x of w){ while(x.length>12){ if(cur){out.push(cur);cur=''} out.push(x.slice(0,12)); x=x.slice(12) } if(cur&&(cur+' '+x).length>12){out.push(cur);cur=x}else cur=cur?cur+' '+x:x } if(cur)out.push(cur); return out.slice(0,3).join('\n') }

/* ---- code: "HB1-" + base64url(bytes). bytes = [GENV, n, diff|theme<<2, salt, count, ...items(family*10+variant), checksum x2] ---- */
const b64u=u8=>btoa(String.fromCharCode.apply(null,u8)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const unb64u=s=>{ const t=atob(s.replace(/-/g,'+').replace(/_/g,'/')+'==='.slice((s.length+3)%4)); const u=new Uint8Array(t.length); for(let i=0;i<t.length;i++)u[i]=t.charCodeAt(i); return u };
const cSum=(u8,n)=>{ let h=2166136261>>>0; for(let i=0;i<n;i++){h^=u8[i];h=Math.imul(h,16777619)>>>0} return h&0xffff };
function encodeCustom(c){
  const tx=c.seq.filter(it=>it[0]===SIGN_I&&it[1]===SIGN_CUSTOM).map(it=>cText(it[2])||'يافطة');
  const b=[GENV,c.n,c.d|(c.th<<2),(c.s&127)|(tx.length?128:0),c.seq.length]; for(const [f,v] of c.seq)b.push(f*10+v);          // salt < 100, so bit 7 of that byte says "text trailer follows"
  if(tx.length){ const E=new TextEncoder(); b.push(tx.length); for(const t of tx){ const u=E.encode(t); b.push(u.length); for(const x of u)b.push(x) } }
  const u=new Uint8Array(b.length+2); u.set(b); const h=cSum(u,b.length); u[b.length]=h>>8; u[b.length+1]=h&255;
  return 'HB'+GENV+'-'+b64u(u);
}
/* returns {c} or {err}. Accepts a whole pasted message: the first HBn-xxxx token is used. */
function decodeCustom(txt){
  const m=/HB(\d+)-([A-Za-z0-9_-]{8,1400})/.exec(String(txt||'')); if(!m)return{err:'ما لقيت كود (بيبدأ بـ HB1-)'};
  let u; try{ u=unb64u(m[2]) }catch(e){ return{err:'الكود مقصوص أو فيه غلط'} }
  if(u.length<7)return{err:'الكود قصير'};
  const n=u.length-2; if(cSum(u,n)!==((u[n]<<8)|u[n+1]))return{err:'الكود فيه حرف غلط (انسخه كامل)'};
  if(u[0]>GENV)return{err:'هالخريطة من نسخة أحدث من اللعبة — حدّث الصفحة'};
  const cnt=u[4], hasT=!!(u[3]&128); if(cnt>C_MAXSEQ)return{err:'الكود مو سليم'};
  const c={n:u[1],d:u[2]&3,th:u[2]>>2,s:u[3]&127,seq:[],gv:u[0]};
  let txs=[];
  if(!hasT){ if(cnt!==n-5)return{err:'الكود مو سليم'} }
  else{ let p=5+cnt; if(p>=n)return{err:'الكود مو سليم'}; const tc=u[p++], D=new TextDecoder('utf-8',{fatal:false});
    for(let i=0;i<tc;i++){ if(p>=n)return{err:'الكود مو سليم'}; const len=u[p++]; if(len>C_TXMAX||p+len>n)return{err:'الكود مو سليم'}; txs.push(cText(D.decode(u.slice(p,p+len)))); p+=len }
    if(p!==n)return{err:'الكود مو سليم'} }
  if(c.n<1||c.n>C_MAXN||c.d>2||c.th>=THEMES.length)return{err:'قيم الكود خارج الحدود'};
  let ti=0;
  for(let i=0;i<cnt;i++){ const x=u[5+i], f=(x/10)|0, v=x%10; if(f>=CF.length||v>CF[f].vs.length)return{err:'فيه فخ ما بعرفه (نسخة أحدث؟)'};
    if(f===SIGN_I&&v===SIGN_CUSTOM){ if(ti>=txs.length)return{err:'الكود مو سليم'}; c.seq.push([f,v,txs[ti++]||'يافطة']) } else c.seq.push([f,v]) }
  if(ti!==txs.length)return{err:'الكود مو سليم'};
  if(!cTraps(c))return{err:'الخريطة فاضية'};
  return{c};
}
const cClone=c=>({n:c.n,d:c.d,th:c.th,s:c.s,seq:c.seq.map(x=>x.slice())});
/* the proof of clearing belongs to the WORLD, not to its decoration: the same map with other flowers/signs is still a cleared map */
const cCore=c=>({n:c.n,d:c.d,th:c.th,s:c.s,seq:cReal(c).map(it=>[it[0],it[1]])});
const coreCode=c=>encodeCustom(cCore(c));

/* ---- build: the recipe becomes a normal level object. W grows until every item really fits (deterministic, so every device agrees) ---- */
function buildCustom(c){
  const script=cReal(c).map(([f,v])=>[CF[f].f,v?CF[f].vs[v-1][0]:null]);
  let W=26+script.reduce((a,it)=>a+((NEEDF[it[0]]||5)+9),0), L=null;
  for(let k=0;k<10;k++){
    L=buildLevel(c.n,{script,W,diff:C_DIFF[c.d],salt:c.s,theme:c.th,noChase:true});
    if((L.segs||[]).length>=script.length)break; W+=14;
  }
  L.name='خريطة مخصّصة'; L.custom=true; cosmPlace(L,c); return L;
}
/* decorations + troll signs: placed AFTER the world exists, only on plain safe ground inside the gap where the item sits in the sequence.
   They add nothing to L.ents / ground / blocks, so physics, the solver and the cleared-run proof cannot tell them apart from an empty gap. */
function cosmPlace(L,c){
  L.deco=[]; const items=[]; let r=0;
  c.seq.forEach((it,i)=>{ if(CF[it[0]].cosm)items.push({it,i,r}); else r++ });
  if(!items.length)return;
  const segs=L.segs||[], w=L.w, bad=new Uint8Array(w+14), mark=(a,b)=>{ for(let t=Math.max(0,a);t<=Math.min(w+13,b);t++)bad[t]=1 };
  for(let t=0;t<w;t++){ if(L.ground[t]<0)mark(t-1,t+1); if(L.ground[t]!==GR||L.cr[t])bad[t]=1 }
  for(const e of L.ents){ if(e.t==='coin')continue; const x=entX(e); if(typeof x==='number'&&isFinite(x)){ const t=Math.floor(x/TS); mark(t-1,t+1) }
    if(e.x0!=null&&e.x1!=null)mark(Math.floor(Math.min(e.x0,e.x1)/TS)-1,Math.floor(Math.max(e.x0,e.x1)/TS)+1) }
  for(const k in L.blocks){ const t=+k.split(',')[0]; mark(t-1,t+1) }
  for(const z of L.zones)mark(Math.floor(z.x0/TS),Math.floor(z.x1/TS));
  for(const s of L.signs)mark(s.tx-2,s.tx+2);
  mark(0,4); mark(L.exitTx-2,w+13);
  const lo=k=>(k>0&&segs[Math.min(k,segs.length)-1])?segs[Math.min(k,segs.length)-1][1]+segs[Math.min(k,segs.length)-1][2]+1:5;
  const hi=k=>segs[k]?segs[k][1]-1:L.exitTx-3, taken=[];
  /* look inside the gap first; if the gap is too tight (traps often sit 3 tiles apart) widen to +-14 tiles around it, left side first so a sign is read BEFORE its trap */
  const find=(want,a,b,gap)=>{ const wide=[Math.max(5,want-14),Math.min(L.exitTx-3,want+14)];
    for(const [A,B] of [[a,b],wide]){ for(let d=0;d<=B-A;d++)for(const t of d?[want-d,want+d]:[want]){ if(t<A||t>B||bad[t])continue; if(taken.some(q=>Math.abs(q-t)<gap))continue; return t } }
    return -1 };
  let dropped=0;
  const groups={}; for(const q of items)(groups[q.r]||(groups[q.r]=[])).push(q);
  for(const k in groups){
    const g=groups[k], a=lo(+k), b=hi(+k), m=g.length;
    g.forEach((q,j)=>{
      const [f,v]=q.it;
      if(f===SIGN_I){
        const t=find(Math.max(a,b-2),a,b,4); if(t<0){dropped++;return} taken.push(t);
        const vv=v||(1+((q.i*5+c.s*3+c.n)%8)), text=vv===SIGN_CUSTOM?signWrap(cText(q.it[2])||'يافطة'):SIGN_TXT[vv-1];
        L.signs.push({tx:t,text,tag:'any',lie:false,seen:false,cu:1});
      } else {
        const want=a+Math.round((b-a)*(j+1)/(m+1)), t=find(want,a,b,2); if(t<0){dropped++;return} taken.push(t);
        L.deco.push({tx:t,k:(v||1+((q.i*7+c.s*13+c.n*3)%9))-1,dx:((q.i*37+t*11)%13)-6});
      }
    });
  }
  L.deco.sort((x,y)=>x.tx-y.tx); L.cosmDrop=dropped;
}

/* ---- local storage: draft, cleared maps (with the input recording of the winning run = the proof), death log ---- */
const MP={draft:null,cleared:{}};
try{ const j=JSON.parse(localStorage.getItem('td_m')||'null'); if(j){ MP.draft=j.draft||null; MP.cleared=j.cleared||{} } }catch(e){}
const saveMaps=()=>{ try{ const ks=Object.keys(MP.cleared); if(ks.length>12){ ks.sort((a,b)=>MP.cleared[a].at-MP.cleared[b].at); for(const k of ks.slice(0,ks.length-12))delete MP.cleared[k] } localStorage.setItem('td_m',JSON.stringify(MP)) }catch(e){} };
/* input recording: one byte per fixed 1/60 s step (bit0 left, bit1 right, bit2 jump held, bit3 jump pressed) */
let INREC=[];
const recStep=()=>INREC.push((K.l?1:0)|(K.r?2:0)|(K.j?4:0)|(K.jp?8:0));
const rleEnc=a=>{ const o=[]; let i=0; while(i<a.length){ let j=i; while(j<a.length&&a[j]===a[i])j++; o.push(a[i].toString(16)+(j-i).toString(36)); i=j } return o.join('.') };
const rleDec=s=>{ const a=[]; if(!s)return a; for(const t of s.split('.')){ const v=parseInt(t[0],16), c=parseInt(t.slice(1),36); for(let i=0;i<c;i++)a.push(v) } return a };
/* replay a recording on a fresh copy of the level in simulation mode; true when it ends in a win. Used by tests now, by the server check later. */
function replayCustom(c,rec,maxFrames){
  const was=SIM, sv=G.custom; SIM=true; let won=false, f=0;
  try{
    G.lastLvl=-9; G.cpX=null; G.custom=c; loadLevel(c.n,false,{custom:c}); G.state='play';
    for(;f<rec.length&&f<(maxFrames||99999);f++){ const b=rec[f]; K.l=!!(b&1);K.r=!!(b&2);K.j=!!(b&4);K.jp=!!(b&8); update(1/60); if(G.state==='dead'){break} if(G.state==='win'){won=true;f++;break} }
  } finally { SIM=was; G.custom=sv; K.l=K.r=K.j=K.jp=false }
  return{won,frames:f};
}
/* local death log (step 1 of the roadmap): per level, deaths bucketed by 4 tiles + by cause. Tiny, never leaves the device. */
let DLOG={}; try{ DLOG=JSON.parse(localStorage.getItem('td_dl')||'{}') }catch(e){}
function logDeath(cause){
  try{
    const key=G.custom?coreCode(G.custom):String(G.level);
    const e=DLOG[key]||(DLOG[key]={n:0,b:{},c:{}}), b=Math.floor(Math.max(0,P.x)/TS/4);
    e.n++; e.b[b]=(e.b[b]||0)+1; e.c[cause]=(e.c[cause]||0)+1;
    const ks=Object.keys(DLOG); if(ks.length>150)delete DLOG[ks[0]];
    localStorage.setItem('td_dl',JSON.stringify(DLOG));
  }catch(e){}
}
