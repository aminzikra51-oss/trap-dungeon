"""Background removal + defringe + downscale for the AI-generated accessory pictures.
usage: MAXD=160 python3 tools/acc_cut.py [name ...]   (reads raw/<name>.jpg and map.txt in the cwd, writes png/<name>.png; then save as webp into assets/acc/)
needs: pip install rembg onnxruntime (the isnet-general-use model downloads from github on first run)"""
import sys, os, json, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
from rembg import remove, new_session
sess=new_session('isnet-general-use')
CROP={'grandma_n':(230,435,830,800),'donkey_n':(200,420,820,880),'donkey_b':(440,400,850,830)}
ERASE={'cat_b':[(425,470,605,900)]}
TRIM={'falafel_h':(0,0,1,.80)}
MAXD=int(os.environ.get('MAXD','220'))
names=[l.split()[0] for l in open('map.txt')]
if len(sys.argv)>1: names=sys.argv[1:]
os.makedirs('png',exist_ok=True); info={}
for n in names:
    im=Image.open('raw/%s.jpg'%n).convert('RGB')
    if n in CROP: im=im.crop(CROP[n])
    out=remove(im,session=sess,post_process_mask=True); a=np.array(out)
    al=a[...,3].astype(np.uint8)
    for (x0,y0,x1,y1) in ERASE.get(n,[]):
        ox,oy=(CROP[n][0],CROP[n][1]) if n in CROP else (0,0)
        al[y0-oy:y1-oy,x0-ox:x1-ox]=0
    m=al>128
    lab,k=ndi.label(m); 
    if k>1:
        sizes=ndi.sum(m,lab,range(1,k+1)); keep=[i+1 for i,s in enumerate(sizes) if s>=0.015*sizes.sum()]
        m=np.isin(lab,keep)
    # defringe: shrink 2px, copy colours from the nearest interior pixel
    inner=ndi.binary_erosion(m,iterations=2)
    if inner.sum()<50: inner=ndi.binary_erosion(m,iterations=1)
    idx=ndi.distance_transform_edt(~inner,return_distances=False,return_indices=True)
    rgb=a[...,:3][idx[0],idx[1]]
    # soft alpha: slightly eroded + blurred edge
    soft=ndi.gaussian_filter(ndi.binary_erosion(m,iterations=1).astype(np.float32),0.9)
    res=np.dstack([rgb,(np.clip(soft,0,1)*255).astype(np.uint8)])
    A_=Image.fromarray(res[...,3]); C_=Image.fromarray(res[...,:3])
    bb=A_.getbbox(); A_=A_.crop(bb); C_=C_.crop(bb)
    if n in TRIM:
        f=TRIM[n]; box=(int(f[0]*A_.width),int(f[1]*A_.height),int(f[2]*A_.width),int(f[3]*A_.height)); A_=A_.crop(box); C_=C_.crop(box)
        bb=A_.getbbox(); A_=A_.crop(bb); C_=C_.crop(bb)
    r=MAXD/max(A_.size)
    if r<1:
        sz=(round(A_.width*r),round(A_.height*r)); A_=A_.resize(sz,Image.LANCZOS); C_=C_.resize(sz,Image.LANCZOS)
    img=Image.merge('RGBA',(*C_.split(),A_))
    img.save('png/%s.png'%n); info[n]=img.size; print(n,img.size,flush=True)
json.dump(info,open('png/_sizes.json','w'))
