/* =============== MAP EDITOR UI (v1: trap sequence) ===============
   Pick traps in order -> test-play -> the share code unlocks only after YOU cleared the map (the winning run's inputs are stored as proof). */
const ED={c:cNew(),sel:-1,fam:0,msg:'',src:'edit',imp:false};
try{ const d=MP.draft; if(d&&Array.isArray(d.seq)&&d.n>=1&&d.n<=C_MAXN&&d.d>=0&&d.d<=2&&d.th>=0&&d.th<THEMES.length&&d.seq.every(x=>CF[x[0]]&&x[1]>=0&&x[1]<=CF[x[0]].vs.length))ED.c=cClone(d) }catch(e){}
const edSave=()=>{ MP.draft=cClone(ED.c); saveMaps() };
const edCode=()=>cTraps(ED.c)?encodeCustom(ED.c):'';
const edClr=()=>{ const k=edCode(); return k?MP.cleared[k]:null };
function el(tag,cls,txt,fn){ const e=document.createElement(tag); if(cls)e.className=cls; if(txt!=null)e.textContent=txt; if(fn)e.onclick=fn; return e }
const chipTxt=([f,v])=>CF[f].ic+' '+(v?CF[f].vs[v-1][1]:CF[f].nm);

function edPreview(){            // the canvas behind the panel shows the chosen theme
  try{ const th=ED.c.th; L=buildLevel(1,{script:[['pit','plain']],theme:th,diff:'normal',salt:0}); P=newPlayer(L.spawnTx); themeBg=makeBg(THEMES[th],th*31+7); G.camX=0 }catch(e){}
}
function edRender(){
  const c=ED.c, cl=edClr(), nt=cTraps(c);
  $('edN').textContent=c.n; $('edD').value=c.d; $('edTh').value=c.th; $('edS').textContent=c.s;
  const seq=$('edSeq'); seq.innerHTML='';
  if(!c.seq.length)seq.appendChild(el('span','edhint','اضغط على فخ من تحت لتضيفه ↓'));
  c.seq.forEach((it,i)=>{ const b=el('button','ch'+(i===ED.sel?' on':''),chipTxt(it),()=>{ ED.sel=ED.sel===i?-1:i; edRender() }); seq.appendChild(b) });
  $('edTools').classList.toggle('hide',ED.sel<0);
  const fam=$('edFam'); fam.innerHTML='';
  CF.forEach((f,i)=>{ fam.appendChild(el('button','ch f'+(i===ED.fam?' on':''),f.ic+' '+f.nm,()=>{ ED.fam=i; if(!f.vs.length)edAdd(i,0); else edRender() })) });
  const vr=$('edVar'); vr.innerHTML=''; const F=CF[ED.fam];
  if(F.vs.length){
    vr.appendChild(el('button','ch v','🎲 تلقائي',()=>edAdd(ED.fam,0)));
    F.vs.forEach((v,j)=>vr.appendChild(el('button','ch v'+(c.n<v[2]?' lock':''),v[1]+(c.n<v[2]?' 🔒'+v[2]:''),()=>edAdd(ED.fam,j+1))));
  } else vr.appendChild(el('span','edhint',F.f==='cp'?'علم حفظ حقيقي: لما تموت بترجع منه':'هالفخ بلا أنواع — بينضاف مباشرة'));
  $('edSt').textContent=(nt?nt+' فخ · ':'')+(cl?'✅ خلّصتها بـ '+cl.t.toFixed(1)+' ث':(nt?'🔒 لسا ما خلّصتها':'خريطة فاضية'));
  $('edPlay').disabled=!nt; $('edCopy').disabled=!(nt&&cl);
  $('edCopy').textContent=cl?'📋 انسخ الكود':'🔒 خلّصها لتنشرها';
  $('edMsg').textContent=ED.msg||''; $('edImpBox').classList.toggle('hide',!ED.imp);
}
function edAdd(f,v){
  const c=ED.c; if(c.seq.length>=C_MAXSEQ){ED.msg='الحد الأقصى '+C_MAXSEQ+' عنصر';edRender();return}
  const at=ED.sel>=0?ED.sel+1:c.seq.length; c.seq.splice(at,0,[f,v]); ED.sel=at;
  const need=v?CF[f].vs[v-1][2]:CF[f].mn; ED.msg=''; if(c.n<need){c.n=need;ED.msg='رفعت القوة لـ '+need+' عشان هالفخ'}
  edSave(); edRender();
}
function edSetN(n){
  const need=cNeed(ED.c), v=clamp(n,1,C_MAXN); ED.msg='';
  if(v<need){ED.c.n=need;ED.msg='أقل قوة لهالفخاخ: '+need}else ED.c.n=v;
  edSave(); edRender();
}
function edOpen(c,msg,o){
  o=o||{}; if(c){ED.c=cClone(c);ED.sel=-1}
  ED.src=o.src||'edit'; ED.msg=msg||''; ED.imp=!!o.imp; if(o.code!=null)$('edIn').value=o.code;
  Snd.stopMusic(); K.l=K.r=K.j=K.jp=false;
  for(const id of ['title','menu','card','hud','touch'])$(id).classList.add('hide');
  $('sub').innerHTML=''; G.state='editor'; $('ed').classList.remove('hide'); edPreview(); edRender();
}
function edClose(){ $('ed').classList.add('hide'); goTitle() }
function startCustom(c,src){
  Snd.init(); Snd.resume(); for(const id of ['ed','title','menu','card'])$(id).classList.add('hide'); $('hud').classList.remove('hide');
  ED.src=src||'edit'; G.lastLvl=-9; G.cpX=null; G.bossProg=null; G.bossSeen=0; G.lvDeaths=0;
  loadLevel(c.n,false,{custom:cClone(c)}); G.state='play'; if(S.music)Snd.startMusic();
  if(touchMode){$('touch').classList.remove('hide');$('stage').classList.add('touch')}
}
/* the winning run is the proof: store it next to the code (a server will replay it later; for now it only unlocks sharing on this device) */
function customCleared(){
  const code=encodeCustom(G.custom); MP.cleared[code]={t:+G.t.toFixed(2),f:INREC.length,p:rleEnc(INREC),at:Date.now()}; saveMaps();
}
function customWon(){
  const c=G.custom, code=encodeCustom(c), cl=MP.cleared[code], t=cl?cl.t.toFixed(1):'?';
  if(ED.src==='code') edOpen(null,'🏆 خلّصت الخريطة بـ '+t+' ث',{src:'code',imp:true});
  else edOpen(c,'🏆 خلّصتها بـ '+t+' ث — هلأ بتقدر تنسخ الكود');
}
function edShareText(){
  const cl=edClr(), code=edCode();
  return '🛠 خريطتي بلعبة «لا تموت يا حبيبي» — أنا خلّصتها بـ '+cl.t.toFixed(1)+' ثانية. بتقدر؟ 😈\nالكود: '+code+'\n(باللعبة: 🛠 مصمّم المراحل ← 📥 كود جاهز)\n'+SHARE_URL;
}
async function edCopy(){
  if(!edClr())return; const txt=edShareText(); let ok=false;
  try{ await navigator.clipboard.writeText(txt); ok=true }catch(e){
    try{ const t=document.createElement('textarea'); t.value=txt; t.style.cssText='position:fixed;left:-999px;top:0;opacity:0'; document.body.appendChild(t); t.select(); ok=document.execCommand('copy'); t.remove() }catch(_){} }
  ED.msg=ok?'اننسخ! الصقه بأي قروب 📋':'انسخ الكود يدوياً: '+edCode(); edRender();
}
function edImport(play){
  const r=decodeCustom($('edIn').value);
  if(r.err){ED.msg='❌ '+r.err;edRender();return}
  if(play){ startCustom(r.c,'code'); return }          // receiver path: play it, do not touch the draft
  if(MP.draft&&cTraps(MP.draft)&&encodeCustom(MP.draft)!==encodeCustom(r.c)){ try{localStorage.setItem('td_mprev',JSON.stringify(MP.draft))}catch(e){} }
  ED.c=cClone(r.c); ED.sel=-1; ED.imp=false; ED.src='edit'; ED.msg='✅ انحمّلت الخريطة (' +cTraps(r.c)+' فخ)'; edSave(); edPreview(); edRender();
}
function goTitle(){ $('menu').classList.add('hide');$('hud').classList.add('hide');$('touch').classList.add('hide');$('title').classList.remove('hide');$('card').classList.add('hide');$('ed').classList.add('hide');G.state='title';$('sub').innerHTML='';Snd.stopMusic() }

/* ---- wiring ---- */
$('edNm').onclick=()=>edSetN(ED.c.n-1); $('edNp').onclick=()=>edSetN(ED.c.n+1);
$('edD').onchange=e=>{ED.c.d=+e.target.value;edSave();edRender()};
$('edTh').onchange=e=>{ED.c.th=+e.target.value;edSave();edPreview();edRender()};
$('edSalt').onclick=()=>{ED.c.s=(ED.c.s+1)%100;edSave();edRender()};
$('edEarly').onclick=()=>{ const i=ED.sel; if(i>0){const c=ED.c.seq;[c[i-1],c[i]]=[c[i],c[i-1]];ED.sel=i-1;edSave();edRender()} };
$('edLate').onclick=()=>{ const i=ED.sel, c=ED.c.seq; if(i>=0&&i<c.length-1){[c[i+1],c[i]]=[c[i],c[i+1]];ED.sel=i+1;edSave();edRender()} };
$('edDel').onclick=()=>{ if(ED.sel>=0){ED.c.seq.splice(ED.sel,1);ED.sel=-1;edSave();edRender()} };
$('edWipe').onclick=()=>{ if(ED.c.seq.length){ if(ED.armed){ED.c.seq=[];ED.sel=-1;ED.armed=0;ED.msg='';edSave();edRender()} else {ED.armed=1;ED.msg='اضغط مرة ثانية لمسح كل شي';edRender();setTimeout(()=>{ED.armed=0},2500)} } };
$('edPlay').onclick=()=>{ if(cTraps(ED.c))startCustom(ED.c,'edit') };
$('edCopy').onclick=edCopy;
$('edImp').onclick=()=>{ED.imp=!ED.imp;ED.msg='';edRender()};
$('edLoad').onclick=()=>edImport(false); $('edGo').onclick=()=>edImport(true);
$('edX').onclick=edClose;
$('bEdT').onclick=()=>{Snd.init();edOpen(null,'')};
$('bEdit').onclick=()=>{ if(ED.src==='code')edOpen(null,'',{src:'code',imp:true}); else edOpen(G.custom||ED.c,'') };
{ // theme + difficulty options
  const th=$('edTh'); ['🟣 القبو','🔴 الحمم','🔵 الجليد','🟢 الغابة'].forEach((n,i)=>th.appendChild(new Option(n,i)));
}
/* link: ...#m=HB1-xxxx opens the import box with the code filled in */
function edBootHash(){
  const m=/[#&]m=([^&]+)/.exec(location.hash||''); if(!m)return;
  const code=decodeURIComponent(m[1]); if(decodeCustom(code).err)return;
  edOpen(null,'وصلتك خريطة! اضغط «العب»',{src:'code',imp:true,code});
}
