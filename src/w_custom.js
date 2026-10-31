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
 {f:'cp',ic:'🚩',nm:'علم حفظ',mn:1,vs:[]}
];
const CF_BY=Object.fromEntries(CF.map((c,i)=>[c.f,i]));
const C_DIFF=['normal','crazy','hell'], C_MAXSEQ=250, C_MAXN=60;
const cNew=()=>({n:6,d:1,th:0,s:0,seq:[]});                       // seq items: [familyIndex, variantIndex+1 | 0 = let the generator choose]
const cNeed=c=>c.seq.reduce((m,[f,v])=>Math.max(m,v?CF[f].vs[v-1][2]:CF[f].mn),1);
const cTraps=c=>c.seq.filter(it=>CF[it[0]].f!=='cp').length;

/* ---- code: "HB1-" + base64url(bytes). bytes = [GENV, n, diff|theme<<2, salt, count, ...items(family*10+variant), checksum x2] ---- */
const b64u=u8=>btoa(String.fromCharCode.apply(null,u8)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const unb64u=s=>{ const t=atob(s.replace(/-/g,'+').replace(/_/g,'/')+'==='.slice((s.length+3)%4)); const u=new Uint8Array(t.length); for(let i=0;i<t.length;i++)u[i]=t.charCodeAt(i); return u };
const cSum=(u8,n)=>{ let h=2166136261>>>0; for(let i=0;i<n;i++){h^=u8[i];h=Math.imul(h,16777619)>>>0} return h&0xffff };
function encodeCustom(c){
  const b=[GENV,c.n,c.d|(c.th<<2),c.s,c.seq.length]; for(const [f,v] of c.seq)b.push(f*10+v);
  const u=new Uint8Array(b.length+2); u.set(b); const h=cSum(u,b.length); u[b.length]=h>>8; u[b.length+1]=h&255;
  return 'HB'+GENV+'-'+b64u(u);
}
/* returns {c} or {err}. Accepts a whole pasted message: the first HBn-xxxx token is used. */
function decodeCustom(txt){
  const m=/HB(\d+)-([A-Za-z0-9_-]{8,420})/.exec(String(txt||'')); if(!m)return{err:'ما لقيت كود (بيبدأ بـ HB1-)'};
  let u; try{ u=unb64u(m[2]) }catch(e){ return{err:'الكود مقصوص أو فيه غلط'} }
  if(u.length<7)return{err:'الكود قصير'};
  const n=u.length-2; if(cSum(u,n)!==((u[n]<<8)|u[n+1]))return{err:'الكود فيه حرف غلط (انسخه كامل)'};
  if(u[0]>GENV)return{err:'هالخريطة من نسخة أحدث من اللعبة — حدّث الصفحة'};
  const cnt=u[4]; if(cnt!==n-5||cnt>C_MAXSEQ)return{err:'الكود مو سليم'};
  const c={n:u[1],d:u[2]&3,th:u[2]>>2,s:u[3],seq:[],gv:u[0]};
  if(c.n<1||c.n>C_MAXN||c.d>2||c.th>=THEMES.length)return{err:'قيم الكود خارج الحدود'};
  for(let i=0;i<cnt;i++){ const x=u[5+i], f=(x/10)|0, v=x%10; if(f>=CF.length||v>CF[f].vs.length)return{err:'فيه فخ ما بعرفه (نسخة أحدث؟)'}; c.seq.push([f,v]) }
  if(!cTraps(c))return{err:'الخريطة فاضية'};
  return{c};
}
const cClone=c=>({n:c.n,d:c.d,th:c.th,s:c.s,seq:c.seq.map(x=>x.slice())});

/* ---- build: the recipe becomes a normal level object. W grows until every item really fits (deterministic, so every device agrees) ---- */
function buildCustom(c){
  const script=c.seq.map(([f,v])=>[CF[f].f,v?CF[f].vs[v-1][0]:null]);
  let W=26+script.reduce((a,it)=>a+((NEEDF[it[0]]||5)+9),0), L=null;
  for(let k=0;k<10;k++){
    L=buildLevel(c.n,{script,W,diff:C_DIFF[c.d],salt:c.s,theme:c.th,noChase:true});
    if((L.segs||[]).length>=script.length)break; W+=14;
  }
  L.name='خريطة مخصّصة'; L.custom=true; return L;
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
    const key=G.custom?encodeCustom(G.custom):String(G.level);
    const e=DLOG[key]||(DLOG[key]={n:0,b:{},c:{}}), b=Math.floor(Math.max(0,P.x)/TS/4);
    e.n++; e.b[b]=(e.b[b]||0)+1; e.c[cause]=(e.c[cause]||0)+1;
    const ks=Object.keys(DLOG); if(ks.length>150)delete DLOG[ks[0]];
    localStorage.setItem('td_dl',JSON.stringify(DLOG));
  }catch(e){}
}
