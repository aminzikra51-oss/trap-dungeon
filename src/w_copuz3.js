/* =============== CO-OP PUZZLES 3: carry & throw (the grab key, see carryStep in w_coop.js) ===============
   Builders take (L,x,o): o={sz,pt} = size 0..2 and pattern 0..2 (see coVar in w_copuz.js). 0/0 is the plain version.
   tossup  - a wall too high for any jump: carry your partner under the ledge and toss him straight up, he pulls the lever that opens the door
   tossgap - a pit too wide for any jump: carry your partner to the edge and throw him across, he pulls the lever that raises the bridge */
Object.assign(COV,{
 tossup(L,x,o){ const g=newId(L), H=[5,6,7][o.sz]||5, wx=x+13, sw=o.pt===1?3:2, gp=o.pt===2?1:0, sl=wx-sw-gp;      // wx = the door column, sl = first column of the ledge
  coCp(L,x); coSign(L,x+3,'الحيط عالي كتير! 😱\nاحمل رفيقك: اقف جنبه واضغط S أو ⬇ (🤲 بالموبايل)\nبعدين اضغط كمان مرة ليرميه لفوق',5.2);
  for(let c2=0;c2<sw;c2++)blk(L,sl+c2,GR-H);                                        // the ledge (one floating row of blocks)
  L.ents.push(mkGate(g,wx,1,GR-H,GR-1,'door'), mkLever(g,(sl+sw-1)*TS+16,(GR-H)*TS));
  coCpEnd(L,x+21); return 23 },
 tossgap(L,x,o){ const g=newId(L), G2=([8,9,10][o.sz]||8)-(o.pt?1:0), bx=x+9, h=o.pt===0?0:o.pt;                                   // h = height of the far bank's step in blocks
  coCp(L,x); coSign(L,x+3,'حفرة كبيرة! 🕳\nاحمل رفيقك: اقف جنبه واضغط S أو ⬇ (🤲 بالموبايل)\nوارميه للضفة التانية، هو بيطلّع الجسر',5.2);
  cutPit(L,bx,G2); L.ents.push(mkGate(g,bx,G2,GR,GR,'bridge',1));
  for(let k=1;k<=h;k++){ blk(L,bx+G2,GR-k); blk(L,bx+G2+1,GR-k) }
  L.ents.push(mkLever(g,(bx+G2+1)*TS+16,GY-h*TS));
  coCpEnd(L,bx+G2+6); return G2+16 },
});
for(const v of [['tossup',8,3,27],['tossgap',8,4,30]])COV_LIST.push(v);
Object.assign(CO_HW,{tossup:2,tossgap:2});
