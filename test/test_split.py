"""اختبار قاص الأصوات: يركّب ملف دفعة اصطناعي من المقاطع الموجودة مع صمت عشوائي ووقفات داخل بعض الجمل، ثم يتحقق من القص."""
import os, sys, json, random, subprocess, tempfile, wave, numpy as np
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); sys.path.insert(0,ROOT+'/tools')
import split_voices as sv
SR=sv.SR
man=json.load(open(ROOT+'/assets/voices.json',encoding='utf-8'))
old=[k for k,v in man.items() if v.get('old')]
random.seed(int(sys.argv[1]) if len(sys.argv)>1 else 1)
td=tempfile.mkdtemp(); clips=[]
for k in old:
    w=f'{td}/{k}.wav'; sv.to_wav(f'{ROOT}/assets/audio/{k}.mp3',w); clips.append((k,sv.read_wav(w)))
pieces=[]; truth=[]; rng=np.random.default_rng(3)
def sil(sec): return (rng.standard_normal(int(sec*SR))*0.0008).astype(np.float32)   # ضجيج خلفية ~ -62dB
pieces.append(sil(random.uniform(.3,.8)))
for k,x in clips:
    # بعض الجمل فيها وقفة داخلية
    if random.random()<.4 and len(x)>SR*2:
        mid=len(x)//2; a,b=x[:mid],x[mid:]; g=sil(random.uniform(.5,.9)); pieces+= [a,g,b]; x=np.concatenate([a,g,b])
    else: pieces.append(x)
    truth.append(len(x)/SR); clips[len(truth)-1]=(k,x)
    pieces.append(sil(random.uniform(.8,2.4)))
full=np.concatenate(pieces); wavp=f'{td}/B99_test.wav'; sv.write_wav(wavp,full)
inp=f'{td}/in'; os.makedirs(inp); os.rename(wavp,f'{inp}/B99_test.wav')
items=[dict(key='t_'+k,t=man[k]['t']) for k in old]
json.dump([dict(id='B99_test',items=items)],open(f'{td}/b.json','w',encoding='utf-8'),ensure_ascii=False)
out=f'{td}/out'
r=subprocess.run([sys.executable,ROOT+'/tools/split_voices.py','--in',inp,'--out',out,'--batches',f'{td}/b.json','--speed','1'],capture_output=True,text=True)
print(r.stdout[-1800:],r.stderr[-500:])
ok=True
for (k,x),t in zip(clips,truth):
    f=f'{out}/t_{k}.mp3'
    if not os.path.exists(f): print('MISSING',k); ok=False; continue
    w=f'{td}/chk.wav'; sv.to_wav(f,w); y=sv.read_wav(w); d=len(y)/SR
    diff=abs(d-t); flag='' if diff<.45 else '  <<< MISMATCH'
    if diff>=.45: ok=False
    # تطابق المحتوى: ارتباط الغلاف الطاقي مع الأصل
    def env(z): n=int(SR*.02); m=len(z)//n; return np.sqrt((z[:m*n].reshape(m,n)**2).mean(1))
    ex,ey=env(x),env(y); c=-1
    for lag in range(-6,7):
        a=ex[max(lag,0):]; bb=ey[max(-lag,0):]; m=min(len(a),len(bb)); 
        if m>20: c=max(c,np.corrcoef(a[:m],bb[:m])[0,1])
    print(f'{k:12s} orig {t:4.1f}s  cut {d:4.1f}s  env-corr {c:.2f}{flag}')
    if c<.9: ok=False
print('RESULT','PASS' if ok else 'FAIL')
