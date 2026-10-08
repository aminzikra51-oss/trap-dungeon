"""PWA update flow: install v1, publish v2 (new sw hash + page change), reopen -> old cache dropped, new page served."""
import subprocess, time, sys, re
from playwright.sync_api import sync_playwright
D=sys.argv[1]
srv=subprocess.Popen([sys.executable,'-m','http.server','8767','--directory',D],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
try:
  with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':844,'height':390}); pg=ctx.new_page(); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('http://localhost:8767/'); pg.wait_for_function("navigator.serviceWorker.controller||navigator.serviceWorker.ready.then(r=>!!r.active)",timeout=15000); pg.wait_for_timeout(800)
    pg.reload(); pg.wait_for_timeout(1000)
    c1=pg.evaluate("caches.keys()"); print('v1 caches',c1,'marker v2 present:',pg.evaluate("document.documentElement.outerHTML.includes('TD_V2_MARKER')"))
    # publish v2
    html=open(D+'/index.html',encoding='utf8').read().replace('</body>','<!--TD_V2_MARKER--></body>',1); open(D+'/index.html','w',encoding='utf8').write(html)
    sw=open(D+'/sw.js',encoding='utf8').read(); sw=re.sub(r"const V = 'td-[0-9a-f]+'","const V = 'td-v2hash0001'",sw); open(D+'/sw.js','w',encoding='utf8').write(sw)
    pg.reload()                       # old SW serves the old page; browser notices the new sw.js, installs, activates, page reloads itself (we are on the title screen)
    pg.wait_for_timeout(6000)
    print('v2 caches',pg.evaluate("caches.keys()"),'| marker v2 present:',pg.evaluate("document.body.innerHTML.length>0 && fetch('/index.html').then(r=>r.text()).then(t=>t.includes('TD_V2_MARKER'))"))
    pg.reload(); pg.wait_for_timeout(1200); print('after next launch marker (served by SW cache):',pg.evaluate("caches.match('index.html').then(r=>r.text()).then(t=>t.includes('TD_V2_MARKER'))"),'| errs',errs); b.close()
finally: srv.terminate()
