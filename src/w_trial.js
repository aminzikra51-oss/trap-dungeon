/* =============== HERO TRIALS ===============
   Eight bespoke levels, one per hero, each needing that hero's ability:
     cat     5-tile walls (only the boosted second jump reaches the top)      chicken  9-tile pits (only the glide crosses them)
     robot   6-tile walls (jet hover)                                         donkey   full-height block walls (the dash smashes them)
     grandma a 1-tile tunnel full of walkers (the spoon clears them)          uncle    a 1-tile tunnel lined with spikes (the shield eats one hit)
     falafel a vault gate that opens after 4 coins buried in steel pillars (only the magnet reaches them)
     mushroom a minefield of hidden spikes + a hidden block (his sight shows them; slow-mo helps) -> the only "soft" gate: perception, not physics
   They are pseudo levels 1001..1008: legit() is false there, so nothing pays except the one-time trial reward, S.best never moves, and the campaign stays beatable by anyone.
   Abilities are on (hOn()), the map editor / shared maps never see any of this. */
const TR_BASE=1001, TR_UNLOCK=6;                      // pseudo level numbers; trials show up on the map once the player reached level 6
S.tr=S.tr||{}; S.trn=S.trn||{};                       // cleared / cleared without dying
const isTrialN=n=>n>=TR_BASE&&n<TR_BASE+8;
const trCol=(L,tx,y0,y1,st)=>{ for(let ty=y0;ty<=y1;ty++)blk(L,tx,ty,st) };
const trWall=(L,tx,w,h,st)=>{ for(let i=0;i<w;i++)trCol(L,tx+i,GR-h,GR-1,st) };                         // h tiles tall, standing on the floor
const trRock=(L,tx0,tx1)=>{ for(let tx=tx0;tx<=tx1;tx++)trCol(L,tx,0,GR-2,'steel') };                  // solid mass above a 1-tile tunnel (nobody can hop over it)
const trSign=(L,tx,text)=>L.signs.push({tx,text,tag:'any',lie:false,seen:false});
const trPit=(L,tx,w)=>{ for(let i=0;i<w;i++)L.ground[tx+i]=-1; L.pits.push([tx,w]) };

const TRIALS=[
 {id:'cat',  th:0, W:60, nm:'قفزة القطة',    ds:'جدران 5 بلوكات: بس القفزة التانية المعزّزة بتوصل لفوق',
  build(L){ for(const x of [14,28,42]){ trWall(L,x,3,5); L.ents.push(mkSpk('static',x+8,2)) } L.ents.push(mkCp(33)); trSign(L,6,'جدار 5 بلوكات 🧱\nالقفزة العادية ما بتوصل 😼') }},
 {id:'chicken',th:1,W:64,nm:'عبور الفرخة',  ds:'حفر بعرض 9 بلوكات: ما بتنعبر إلا بالتحويم',
  build(L){ trPit(L,18,9); trPit(L,38,9); L.ents.push(mkCp(31)); trSign(L,8,'حفرة عريضة 🕳\nامسك القفز وإنت نازل 🪶'); trSign(L,29,'وحدة كمان 🙃') }},
 /* robot: always=1 because the strip is long: its far end must still bite and keep its timer */
 {id:'robot',th:2,W:60, nm:'نفق الكهربا',  ds:'نفق ضيّق أرضه مكهربة كلها: الروبوت بس مناعته بتعدّيه',
  build(L){ trRock(L,12,41); L.ents.push(Object.assign(mkElec(14,26,{dens:5,seed:1}),{always:1})); trSign(L,6,'نفق ضيّق أرضه مكهربة ⚡\nما في وقت تعدّي... إلا إذا مناعتك 🤖') }},
 {id:'donkey',th:3,W:56,nm:'كسّارة الحمار',ds:'جدران بلوك من الأرض للسقف: الاندفاعة بتكسرها',
  build(L){ trWall(L,14,2,GR); trWall(L,26,3,GR); L.ents.push(mkSpk('static',32,2)); trWall(L,40,3,GR); L.ents.push(mkCp(21)); trSign(L,7,'جدار من الأرض للسقف 🧱\nاندفع فيه 🫏'); trSign(L,33,'مين يعرف شو وراه 😈') }},
 {id:'grandma',th:4,W:62,nm:'نفق الجدة',   ds:'نفق ضيّق ما بتقدر تقفز فيه، ومليان ماشيين: الملعقة بتنظّفه',
  build(L){ trRock(L,12,53); for(const [a,b] of [[18,22],[32,36],[46,50]])L.ents.push(mkWalk('walker',{x:a*TS,x0:a*TS,x1:b*TS,dir:1,sp:55})); trSign(L,6,'نفق ضيّق 🕳 ما في مجال تقفز\nمعك ملعقة 🥄') }},
 {id:'uncle',th:5,W:52,nm:'نفق العم',      ds:'نفق ضيّق مفروش شوك: الدرع بيبلع ضربة وبتعدّي',
  build(L){ trRock(L,12,33); L.ents.push(mkSpk('static',18,6)); trSign(L,6,'نفق ضيّق مفروش شوك 😬\nلا تقفز... الدرع شغّال 🛡') }},
 {id:'falafel',th:6,W:54,nm:'خزنة الفلافل',ds:'4 عملات مدفونة بأعمدة الفولاذ: المغناطيس بس بيوصلها',
  build(L){ L.tneed=4; L.trialGate=[]; const tops=[3,4,3,4,3], cy=[2,3,3,4,2];
    for(let i=0;i<5;i++){ const tx=8+i*4; for(let k=0;k<2;k++)trCol(L,tx+k,GR-tops[i],GR-1,'steel'); L.ents.push(mkCoin(tx*TS+16,(GR-cy[i])*TS+16,false)) }
    for(let tx=36;tx<=37;tx++)for(let ty=0;ty<GR;ty++){ blk(L,tx,ty,'steel'); L.trialGate.push(tx+','+ty) }
    trSign(L,4,'عملات عالقة بالأعمدة 🧲\nلازم 4 لتفتح الخزنة'); trSign(L,31,'الخزنة 🔒') }},
 {id:'mushroom',th:7,W:60,nm:'حقل الفطر',  ds:'فخاخ مخفية وبلوكة مخفية: الفطر بيشوفها (والبطء بيساعد)',
  build(L){ for(const tx of [16,22,29,36,43,49])L.ents.push(mkSpk('hidden',tx,2,{dl:.14})); L.blocks['25,'+(GR-3)]={rev:false,bump:0,st:'b'}; L.blocks['39,'+(GR-3)]={rev:false,bump:0,st:'b'};
    L.ents.push(mkCp(32)); trSign(L,7,'أرض هادية... كتير هادية 🍄') }},
];
const trialOf=n=>TRIALS[n-TR_BASE];
const trialIdx=id=>TRIALS.findIndex(t=>t.id===id);

function buildTrial(n){
  const k=n-TR_BASE, T=TRIALS[k], W=T.W, th=WORLD_ORDER[T.th];
  const L=buildLevel(12,{script:[['coin',null]],W,theme:th,noChase:true,diff:'normal'});      // a valid level shell (difficulty tables, etc.), emptied right away
  Object.assign(L,{n,ground:new Array(W).fill(GR),cr:{},blocks:{},ents:[],zones:[],signs:[],pits:[],torches:[],segs:[],cpList:[],dark:null,chase:null,fakeCp:0,name:T.nm,trial:T.id,theme:th,exitTx:W-5,spawnTx:2});
  for(let t=4;t<W;t+=10)L.torches.push(t);
  T.build(L); L.cpList=L.ents.filter(e=>e.t==='cp').map(e=>e.x);
  return L;
}

/* per-frame rules of a trial (the vault gate); runs inside update() only while playing */
function trialTick(){
  if(!L.trialGate||!L.trialGate.length)return;
  if(L.ents.filter(e=>e.t==='coin'&&e.got).length<L.tneed)return;
  for(const k of L.trialGate)delete L.blocks[k]; const x=L.trialGate.length?+L.trialGate[0].split(',')[0]:0; L.trialGate=[];
  if(!SIM){ Snd.win&&Snd.win(); G.shake=9; say('انفتحت الخزنة! 🧲🪙','any',2.2); for(let i=0;i<GR;i+=2)debris(36*TS,i*TS+TS,THEMES[L.theme].floor) }
}
const trialCoins=()=>L&&L.trial==='falafel'?L.ents.filter(e=>e.t==='coin'&&e.got).length:0;

/* reward (called by econClear): once per trial, plus a bonus for a clean run; the hero also earns trial XP (heroXpClear) */
function trialClear(){
  const id=L.trial, first=!S.tr[id], clean=G.lvDeaths===0&&!S.trn[id]; let b=0;
  if(first){ S.tr[id]=1; b+=40 } if(clean){ S.trn[id]=1; b+=15 }
  if(b){ S.wallet+=b; S.st.c+=b }
  heroXpClear(first,G.lvDeaths===0);
  save(); G.gain=b; G.starGain=0; if(b)econToast('+'+b+' 🪙  تحدّي '+HEROES[id].name+(first?' ✔':'')); hud(); achCheck();
}
function trialExit(){ goTitle(); openMap() }
const trialLabel=()=>'🦸 تحدّي '+HEROES[L.trial].name;

/* map entry: the trial belongs to its hero, so the hero gets equipped for it */
function trialStart(k){
  const T=TRIALS[k]; if(!heroOwned(T.id)||S.best<TR_UNLOCK)return false;
  S.hero=T.id; save(); syncHeroes(); closeMap(); G.cpX=null; G.lastLvl=-9; $('menu').classList.add('hide'); G.state='play'; startGame(TR_BASE+k); return true;
}
function trialHud(c){                                 // screen space: the vault counter
  if(!L||L.trial!=='falafel'||!L.tneed)return; const n=trialCoins(), open=!(L.trialGate&&L.trialGate.length);
  c.save(); c.textAlign='center'; c.font='900 15px Tahoma'; c.lineJoin='round'; c.lineWidth=4; c.strokeStyle='#000'; c.fillStyle=open?'#7dff9a':'#ffd23f';
  const t=open?'🔓 الخزنة مفتوحة':'🧲 عملات الخزنة: '+Math.min(n,L.tneed)+' / '+L.tneed; c.strokeText(t,VW/2,22); c.fillText(t,VW/2,22); c.restore();
}
