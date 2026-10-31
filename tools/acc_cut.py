"""Background removal + defringe + downscale for the AI-generated accessory pictures.
usage: MAXD=160 python3 tools/acc_cut.py [name ...]   (reads raw/<name>.jpg and map.txt in the cwd, writes png/<name>.png; then save as webp into assets/acc/)
needs: pip install rembg onnxruntime (the isnet-general-use model downloads from github on first run)"""
import sys, os, json, numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
from rembg import remove, new_session
sess=new_session('isnet-general-use')
CROP={'grandma_n':(230,435,830,800),'donkey_n':(200,420,820,880),'donkey_b':(440,400,850,830)}
ERASE={'cat_b':[(425,470,605,900)],'face_monocle':[(270,656,478,790)],'falafel_h3':[(366,445,654,602),(440,598,625,830)]}
ELL={'falafel_h3':[(510,445,148,94)]}      # rounded top for that opening (cx,cy,rx,ry)   # falafel_h3: the dark lining inside the pharaoh headdress would hide the face
TRIM={'falafel_h':(0,0,1,.80),'face_3d':(0,.28,1,1),'donkey_h3':(0,0,1,.55),'chicken_h2':(0,0,1,.55),'robot_h3':(0,0,1,.50)}   # donkey_h3: keep only the dome + horns, the face guard and chain mail would cover the donkey's face
DESPILL={'falafel_h2'}
BRIGHT={'falafel_h2':1.14}      # the white chef hat came out light grey
ARC={'donkey_h3':(.80,.20),'chicken_h2':(.78,.22),'robot_h3':(.76,.24)}   # curved bottom edge for the pieces cut in half (a flat cut looked like a straight line across the forehead): the rim bulges down in the middle
KEYBG={'chicken_h2'}      # rembg drops the gold visor of this one: key the flat backdrop colour instead
HOLEBG={'falafel_n2','falafel_h3','chicken_n2','donkey_n2','mushroom_h2','mushroom_n2','grandma_n2'}   # rings and open shapes: backdrop colour seen THROUGH the piece (not touching the picture edge) is keyed out
HOLES={'face_mask'}      # pieces whose openings must be see-through: the orange backdrop seen through them is keyed out
MAXD=int(os.environ.get('MAXD','220'))
names=[l.split()[0] for l in open('map.txt')]
if len(sys.argv)>1: names=sys.argv[1:]
os.makedirs('png',exist_ok=True); info={}
for n in names:
    im=Image.open('raw/%s.jpg'%n).convert('RGB')
    if n in CROP: im=im.crop(CROP[n])
    out=remove(im,session=sess,post_process_mask=True); a=np.array(out)
    if n in KEYBG:
        q=np.array(im).astype(int); bd=np.concatenate([q[0],q[-1],q[:,0],q[:,-1]]); bgc=np.median(bd,axis=0); dist=np.abs(q-bgc).sum(axis=2)
        a=np.dstack([q.astype(np.uint8),(np.clip((dist-45)/45,0,1)*255).astype(np.uint8)])
    al=a[...,3].astype(np.uint8)
    for (x0,y0,x1,y1) in ERASE.get(n,[]):
        ox,oy=(CROP[n][0],CROP[n][1]) if n in CROP else (0,0)
        al[y0-oy:y1-oy,x0-ox:x1-ox]=0
    for (ex,ey,rx,ry) in ELL.get(n,[]):
        ox,oy=(CROP[n][0],CROP[n][1]) if n in CROP else (0,0); yy,xx=np.ogrid[:al.shape[0],:al.shape[1]]
        al[((xx+ox-ex)/rx)**2+((yy+oy-ey)/ry)**2<=1]=0
    if n in HOLES:
        q=np.array(im).astype(int); r_,g_,b_=q[...,0],q[...,1],q[...,2]
        org=(r_>170)&(b_<125)&(r_-b_>90)&(g_<175)&(r_-g_>45)&(al>20)
        org=ndi.binary_opening(org,iterations=2); lab_,k_=ndi.label(org)
        if k_:
            sz=ndi.sum(org,lab_,range(1,k_+1)); org=np.isin(lab_,[i+1 for i,v in enumerate(sz) if v>=1500])
        al[ndi.binary_dilation(org,iterations=1)]=0
    if n in HOLEBG:
        q=np.array(im).astype(int); bd=np.concatenate([q[0],q[-1],q[:,0],q[:,-1]]); bgc=np.median(bd,axis=0)
        near=(np.abs(q-bgc).sum(axis=2)<70)&(al>20); near=ndi.binary_opening(near,iterations=1); lab_,k_=ndi.label(near)
        if k_:
            sz=ndi.sum(near,lab_,range(1,k_+1)); keep=[i+1 for i,v in enumerate(sz) if v>=900]; near=np.isin(lab_,keep)
            al[ndi.binary_dilation(near,iterations=1)]=0
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
    if n in DESPILL: rgb=rgb.copy(); rgb[...,1]=np.minimum(rgb[...,1],np.maximum(rgb[...,0],rgb[...,2]))      # white things lit by a green backdrop pick up a green tint
    # soft alpha: slightly eroded + blurred edge
    soft=ndi.gaussian_filter(ndi.binary_erosion(m,iterations=1).astype(np.float32),0.9)
    res=np.dstack([rgb,(np.clip(soft,0,1)*255).astype(np.uint8)])
    A_=Image.fromarray(res[...,3]); C_=Image.fromarray(res[...,:3])
    bb=A_.getbbox(); A_=A_.crop(bb); C_=C_.crop(bb)
    if n in TRIM:
        f=TRIM[n]; box=(int(f[0]*A_.width),int(f[1]*A_.height),int(f[2]*A_.width),int(f[3]*A_.height)); A_=A_.crop(box); C_=C_.crop(box)
        bb=A_.getbbox(); A_=A_.crop(bb); C_=C_.crop(bb)
    if n in ARC:
        base,bul=ARC[n]; aa=np.array(A_); hh,ww=aa.shape
        for x in range(ww):
            t=(x-ww/2)/(ww/2); yc=int(hh*(base+bul*(1-t*t))); aa[yc:,x]=0
            if 0<yc<hh: aa[max(0,yc-3):yc,x]=(aa[max(0,yc-3):yc,x]*np.linspace(1,.35,min(3,yc))).astype(np.uint8)
        A_=Image.fromarray(aa); bb=A_.getbbox(); A_=A_.crop(bb); C_=C_.crop(bb)
    if n in BRIGHT: C_=Image.fromarray(np.clip(np.array(C_).astype(np.float32)*BRIGHT[n],0,255).astype(np.uint8))
    r=MAXD/max(A_.size)
    if r<1:
        sz=(round(A_.width*r),round(A_.height*r)); A_=A_.resize(sz,Image.LANCZOS); C_=C_.resize(sz,Image.LANCZOS)
    img=Image.merge('RGBA',(*C_.split(),A_))
    img.save('png/%s.png'%n); info[n]=img.size; print(n,img.size,flush=True)
json.dump(info,open('png/_sizes.json','w'))
