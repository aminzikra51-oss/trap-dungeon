"""يبني نسخة اختبار فيها أصوات وهمية لكل مفاتيح المانيفست وصور وهمية لكل أسماء الصور المخططة (لاختبار المنطق فقط)."""
import base64, json, glob, os
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
b64=lambda p: base64.b64encode(open(p,'rb').read()).decode()
mp3=[ 'data:audio/mpeg;base64,'+b64(p) for p in sorted(glob.glob(f'{root}/assets/audio/*.mp3'))]
jpg=[ 'data:image/jpeg;base64,'+b64(p) for p in sorted(glob.glob(f'{root}/assets/img/*.jpg'))]
voices=json.load(open(f'{root}/assets/voices.json',encoding='utf-8'))
imgs=json.load(open(f'{root}/content/images.json',encoding='utf-8'))
A={'audio':{}, 'img':{}, 'voices':voices}
for i,k in enumerate(voices): A['audio'][k]=mp3[i%len(mp3)]
for k in glob.glob(f'{root}/assets/img/*.jpg'): A['img'][os.path.basename(k)[:-4]]='data:image/jpeg;base64,'+b64(k)
for i,r in enumerate(imgs): A['img'][r['key']]=jpg[i%len(jpg)]
src=open(f'{root}/src/index.src.html',encoding='utf-8').read()
open(f'{root}/test/fake.html','w',encoding='utf-8').write(src.replace('__ASSETS_JSON__',json.dumps(A,ensure_ascii=False)))
print('fake build', len(A['audio']),'audio', len(A['img']),'img')
