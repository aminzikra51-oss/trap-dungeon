"""PWA check: serve docs/ on localhost, confirm manifest + installability, SW activates, then reload OFFLINE and start a game."""
import subprocess, time, json, sys
from playwright.sync_api import sync_playwright
srv=subprocess.Popen([sys.executable,'-m','http.server','8765','--directory','/home/claude/trap-dungeon/docs'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
try:
  with sync_playwright() as p:
    b=p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    ctx=b.new_context(viewport={'width':844,'height':390}); pg=ctx.new_page(); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m:errs.append(m.text) if m.type=='error' else None)
    pg.goto('http://localhost:8765/'); pg.wait_for_timeout(1500)
    print('manifest link:',pg.evaluate("document.querySelector('link[rel=manifest]')?.href"))
    cdp=ctx.new_cdp_session(pg)
    r=cdp.send('Page.getInstallabilityErrors'); print('installability errors:',r.get('installabilityErrors'))
    m=cdp.send('Page.getAppManifest'); print('manifest errors:',m.get('errors'),'| name:',json.loads(m['data'])['name'] if m.get('data') else None)
    pg.wait_for_function("navigator.serviceWorker.controller||navigator.serviceWorker.ready.then(r=>!!r.active)",timeout=15000)
    print('sw state:',pg.evaluate("navigator.serviceWorker.ready.then(r=>r.active.state)"))
    pg.reload(); pg.wait_for_timeout(1200); print('controlled after reload:',pg.evaluate("!!navigator.serviceWorker.controller"))
    print('caches:',pg.evaluate("caches.keys()"))
    ctx.set_offline(True); pg.reload(); pg.wait_for_timeout(1500)
    ok=pg.evaluate("()=>{try{TD.startGame(1);return TD.G.state}catch(e){return 'ERR '+e}}"); print('OFFLINE reload + startGame ->',ok, '| title:',pg.title())
    print('install btn present:',pg.evaluate("!!document.getElementById('bInst')"))
    print('errs',errs); b.close()
finally: srv.terminate()
