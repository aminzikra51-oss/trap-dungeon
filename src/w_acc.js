/* =============== ACCESSORIES ===============
   Three pieces per hero (head / neck / back) + a stage-IV aura. Each piece unlocks with the hero's upgrade stage (II, III, IV) and can be toggled on/off.
   The pieces are AI-rendered "clay 3D" pictures (assets/acc/<hero>_<h|n|b>.webp, background removed) in the same style as the hero sprites.
   The hero sprites are pictures too (some already wear a miner helmet or sunglasses), so a piece is drawn ABOVE / AROUND the sprite, placed by per-hero fractions (ACC_PL).
   Pure drawing: no state except S.hq[id] = {h,n,b,a} (0 = switched off). Only in the 3D look (sprites); the flat vector look has none. */
const ACCIMG={};
for(const k in (A.acc||{})){ const im=new Image(),o={im,ok:false}; ACCIMG[k]=o; im.onload=()=>{o.ok=true}; im.src=A.acc[k] }

/* placement, in fractions of the hero sprite box (0,0 = top-left, 1,1 = bottom-right):
   x,y   where the piece is pinned on the hero         ax,ay  the pinned point inside the piece (0..1)
   w     width of the piece (fraction of the sprite's width)
   pair  a single picture drawn twice, mirrored, at x-pair / x+pair (rockets, saddle-bags)
   rot   tilt in degrees (a pair tilts outwards)        sw,sp  idle sway: amplitude in degrees, speed
   sy    vertical squash (halo seen from a slant)       gl     soft glow colour behind the piece */
const ACC_PL={
 falafel: {h:{x:.46,y:.13,w:.50,ax:.5,ay:.9}, n:{x:.50,y:.68,w:.36,ax:.5,ay:.22}, b:{x:.50,y:.52,w:1.12,ax:.5,ay:.5,sw:1.6,sp:3}},
 uncle:   {h:{x:.52,y:.20,w:.50,ax:.5,ay:.96,rot:-3}, n:{x:.52,y:.455,w:.19,ax:.5,ay:.10}, b:{x:.50,y:.42,w:1.28,ax:.5,ay:.5,sw:3.5,sp:5}},
 chicken: {h:{x:.50,y:.17,w:.52,ax:.5,ay:.95}, n:{x:.50,y:.455,w:.50,ax:.5,ay:.55}, b:{x:.50,y:.56,w:.27,ax:.5,ay:.5,pair:.40,rot:14,sw:2,sp:4}},
 cat:     {h:{x:.50,y:.215,w:.58,ax:.5,ay:.93}, n:{x:.51,y:.57,w:.34,ax:.5,ay:.5}, b:{x:.52,y:.40,w:1.42,ax:.5,ay:.5,sw:3,sp:4}},
 grandma: {h:{x:.56,y:.13,w:.30,ax:.5,ay:.62}, n:{x:.53,y:.60,w:.36,ax:.5,ay:.5}, b:{x:.55,y:.58,w:1.10,ax:.5,ay:.5}},
 donkey:  {h:{x:.47,y:.30,w:.92,ax:.5,ay:.80}, n:{x:.50,y:.72,w:.70,ax:.5,ay:.28}, b:{x:.50,y:.74,w:.44,ax:.5,ay:.5,pair:.50,rot:-4}},
 robot:   {h:{x:.50,y:.035,w:.115,ax:.5,ay:.92,sw:3,sp:5}, n:{x:.50,y:.40,w:.34,ax:.5,ay:.45}, b:{x:.50,y:.32,w:.21,ax:.5,ay:.5,pair:.40,rot:12}},
 mushroom:{h:{x:.50,y:-.03,w:.66,ax:.5,ay:.5,sy:.34,gl:'#ffe36b',sw:0,bob:1.4}, n:{x:.50,y:.52,w:.44,ax:.5,ay:.4}, b:{x:.50,y:.42,w:1.62,ax:.5,ay:.5,sw:4,sp:5}},
};
const ACCS={                                       // [slot, picture key, -, stage that unlocks it, Arabic name]
 falafel: [['h','falafel_h','',1,'تاج الفلافل'],     ['n','falafel_n','',2,'وشاح الذوق'],      ['b','falafel_b','',3,'عباءة الخارق']],
 uncle:   [['h','uncle_h','',1,'طاقية النوم'],       ['n','uncle_n','',2,'ميدالية الصبر'],      ['b','uncle_b','',3,'أجنحة الملاك']],
 chicken: [['h','chicken_h','',1,'طاقية المروحة'],   ['n','chicken_n','',2,'فيونكة الجرس'],     ['b','chicken_b','',3,'صواريخ الفرخة']],
 cat:     [['h','cat_h','',1,'قبعة الساحر'],         ['n','cat_n','',2,'فيونكة القطة'],         ['b','cat_b','',3,'أجنحة الليل']],
 grandma: [['h','grandma_h','',1,'وردة الجدة'],      ['n','grandma_n','',2,'عقد اللؤلؤ'],       ['b','grandma_b','',3,'شال الحكمة']],
 donkey:  [['h','donkey_h','',1,'قبعة الكاوبوي'],    ['n','donkey_n','',2,'بندانة الصحرا'],     ['b','donkey_b','',3,'خُرج السرج']],
 robot:   [['h','robot_h','',1,'هوائي الروبوت'],     ['n','robot_n','',2,'ترس الشرف'],          ['b','robot_b','',3,'صواريخ نفّاثة']],
 mushroom:[['h','mushroom_h','',1,'هالة الفطر'],     ['n','mushroom_n','',2,'عقد الجواهر'],     ['b','mushroom_b','',3,'أجنحة الجنية']],
};
const ACC_AURA={falafel:'#ffb347',uncle:'#7fb2ff',chicken:'#ffe36b',cat:'#c9a0ff',grandma:'#ff9ad0',donkey:'#ffd29a',robot:'#7fe3ff',mushroom:'#9fffd0'};
const ACCX={};                                     // extra (bought) sets: ACCX[hero]=[[slot, picture key, set number, stage needed, Arabic name, price, optional placement override], ...]
const ACC_SETCOL=['','#ffd23f','#4dc3ff','#ff7ac8'], ACC_SETRAR=['','c','r','e'], ACC_SETNM=['','الأول','التاني','التالت'];
function accItem(id,slot,set){                     // one catalogue entry (set 1 = the free stage-unlocked ones above)
  if(set===1){ const a=(ACCS[id]||[]).find(x=>x[0]===slot); return a?{slot,key:a[1],set:1,need:a[3],nm:a[4],price:0,pl:null}:null }
  const x=(ACCX[id]||[]).find(x=>x[0]===slot&&x[2]===set); return x?{slot,key:x[1],set,need:x[3],nm:x[4],price:x[5]|0,pl:x[6]||null}:null;
}
const accSel=(id,slot)=>{ const v=(S.hq[id]||{})[slot]; return v===0?0:(v||1) };      // which set is worn on that slot (0 = nothing)
const accOn=(id,slot)=>accSel(id,slot)>0;
const accOwn=(id,slot,set)=>set===1||!!S.aq[id+':'+slot+':'+set];
const accSetMax=id=>(ACCX[id]||[]).reduce((m,x)=>Math.max(m,x[2]),1);
const accReady=(id,it)=>!!it&&accOwn(id,it.slot,it.set)&&heroStage(id)>=it.need;
function accShown(id,slot,o){                      // the piece to draw on a slot right now (or null)
  const set=(o&&o.set)||accSel(id,slot); if(!set)return null; const it=accItem(id,slot,set); if(!it)return null; return (o&&o.force)||accReady(id,it)?it:null;
}
function accSetFull(id){                           // a whole set worn at once -> small glow in the set's colour
  for(let s=1;s<=accSetMax(id);s++){ let all=true; for(const sl of ['h','n','b']){ const it=accItem(id,sl,s); if(!it||accSel(id,sl)!==s||!accReady(id,it)){ all=false; break } } if(all)return s }
  return 0;
}
function accSetGlow(c,col,w,h,t){                  // pulsing ring on the floor + three rising sparkles
  c.save(); const a=.42+Math.sin(t*3)*.14; c.strokeStyle=col; c.fillStyle=col; c.globalAlpha=a*.35; c.beginPath(); c.ellipse(0,-1,w*.46,h*.07,0,0,7); c.fill(); c.globalAlpha=a; c.lineWidth=1.1; c.stroke();
  for(let i=0;i<3;i++){ const k=((t*.45+i/3)%1), x=Math.sin(t*1.3+i*2.1)*w*.38, y=-k*h*.92; c.globalAlpha=(1-k)*.85; c.beginPath(); c.arc(x,y,.5+(1-k)*.7,0,7); c.fill() }
  c.restore();
}
function accAura(c,id,w,h,cx){                           // stage IV glow behind the hero + two lazy sparkles
  const col=ACC_AURA[id]||'#fff', t=(typeof G!=='undefined'?G.t:0), g=c.createRadialGradient(0,-h*.5,h*.1,0,-h*.5,h*.9); g.addColorStop(0,col+'88'); g.addColorStop(1,col+'00');
  c.save(); c.fillStyle=g; c.fillRect(-h,-h*1.5,h*2,h*2); c.fillStyle='#fff'; c.globalAlpha=.7; for(let i=0;i<3;i++){ const a=t*1.4+i*2.1, r=h*.5; c.beginPath(); c.arc(Math.cos(a)*r,-h*.5+Math.sin(a*1.3)*r*.8,.55+Math.abs(Math.sin(t*5+i))*.45,0,7); c.fill() } c.restore();
}
/* one picture, pinned at (x,y) in the current (sprite) space; mir flips it for the left copy of a pair */
function accPic(c,key,x,y,dw,P,mir,t){
  const o=ACCIMG[key]; if(!o||!o.ok)return; const iw=o.im.width, ih=o.im.height, dh=dw*ih/iw*(P.sy||1);
  const sway=P.sw?Math.sin(t*(P.sp||4)+(mir?Math.PI:0))*P.sw:0, rot=((P.rot||0)+sway)*Math.PI/180;
  c.save(); c.translate(x,y+(P.bob?Math.sin(t*3)*P.bob:0)); if(mir)c.scale(-1,1); c.rotate(rot);
  if(P.gl){ const r=dw*.62, g=c.createRadialGradient(0,0,r*.2,0,0,r); g.addColorStop(0,P.gl+'aa'); g.addColorStop(1,P.gl+'00'); c.save(); c.scale(1,P.sy||1); c.fillStyle=g; c.beginPath(); c.arc(0,0,r,0,7); c.fill(); c.restore() }
  c.imageSmoothingEnabled=true; c.imageSmoothingQuality='high';
  c.drawImage(o.im,-dw*P.ax,-dh*P.ay,dw,dh); c.restore();
}
function accDraw(c,id,w,h,cx,layer,o){                   // layer 'back' (before the picture) or 'front' (after). o={only:'h'|'n'|'b'|'a', force:true, set:n} for previews
  const PL=ACC_PL[id]; if(!ACCS[id]||!PL)return; o=o||{}; const X=f=>-w*cx+f*w, Y=f=>-h+f*h, t=(typeof G!=='undefined'?G.t:0);
  if(layer==='back'){
    if((o.only?o.only==='a':(heroStage(id)>=3&&accOn(id,'a')))&&(o.force||heroStage(id)>=3))accAura(c,id,w,h,cx);
    if(!o.only){ const sf=accSetFull(id); if(sf)accSetGlow(c,ACC_SETCOL[sf]||'#fff',w,h,t) }
  }
  for(const slot of ['h','n','b']){ if(o.only&&o.only!==slot)continue; if((layer==='back')!==(slot==='b'))continue;
    const it=accShown(id,slot,o); if(!it)continue; const P=it.pl?Object.assign({},PL[slot],it.pl):PL[slot], dw=P.w*w;
    if(P.pair){ accPic(c,it.key,X(P.x+P.pair),Y(P.y),dw,P,false,t); accPic(c,it.key,X(P.x-P.pair),Y(P.y),dw,P,true,t) }
    else accPic(c,it.key,X(P.x),Y(P.y),dw,P,false,t) }
}
