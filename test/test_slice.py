import os, sys, subprocess, tempfile, glob, numpy as np
from PIL import Image, ImageDraw
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
td=tempfile.mkdtemp()
raws=[Image.open(p).convert('RGB') for p in sorted(glob.glob(ROOT+'/raw/img/*.jpg'))]
rng=np.random.default_rng(5)
while len(raws)<9:
    im=Image.new('RGB',(1024,1024),(250,244,225)); d=ImageDraw.Draw(im)
    for _ in range(4): x,y=rng.integers(100,800,2); d.ellipse([x,y,x+150,y+150],fill=tuple(int(v) for v in rng.integers(30,255,3)),outline='black',width=8)
    raws.append(im)
def make(kind, name):
    W=H=1536; sheet=Image.new('RGB',(W,H),'white'); d=ImageDraw.Draw(sheet)
    # حدود غير متساوية قليلاً
    xs=[0,500,1020,1536] if kind!='equal' else [0,512,1024,1536]; ys=[0,508,1030,1536]
    lw=10 if kind!='equal' else 0
    for r in range(3):
        for c in range(3):
            x0,x1=xs[c]+lw,xs[c+1]-lw; y0,y1=ys[r]+lw,ys[r+1]-lw
            if kind=='equal': x0,x1,y0,y1=xs[c]+12,xs[c+1]-12,ys[r]+12,ys[r+1]-12
            sheet.paste(raws[r*3+c].resize((x1-x0,y1-y0)),(x0,y0))
    if kind!='equal':
        for x in xs: d.rectangle([x-lw,0,x+lw,H],fill='black')
        for y in ys: d.rectangle([0,y-lw,W,y+lw],fill='black')
    sheet.save(f'{td}/{name}'); return
make('lines','sheet_2.png'); make('equal','sheet_3.png')
out=f'{td}/out'
r=subprocess.run([sys.executable,ROOT+'/tools/slice_sheet.py',f'{td}/sheet_2.png',f'{td}/sheet_3.png','--out',out,'--force'],capture_output=True,text=True)
print(r.stdout[-2200:],r.stderr[-600:])
import json
items={r['n']:r['key'] for r in json.load(open(ROOT+'/content/images.json'))}
ok=True
for start,label in ((10,'lines'),(19,'equal')):
    for i in range(9):
        key=items[start+i]; f=f'{out}/{key}.jpg'
        if not os.path.exists(f): print('MISSING',key); ok=False; continue
        a=Image.open(f).convert('L').resize((8,8),Image.BOX); b=raws[i].convert('L').resize((8,8),Image.BOX)
        # القص يزيل بعض الأطراف فنقارن صورة مصغّرة جداً (8×8) لتجاهل فروق الإزاحة الصغيرة
        diff=np.abs(np.asarray(a,dtype=float)-np.asarray(b,dtype=float)).mean()
        if diff>14: ok=False
        print(label,key,'diff',round(diff,1), Image.open(f).size)
print('RESULT','PASS' if ok else 'FAIL')
for p in glob.glob(ROOT+'/incoming/img/_preview_sheet_*'): print('preview',p)
