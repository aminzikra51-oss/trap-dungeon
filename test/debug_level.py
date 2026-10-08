import json, sys
from playwright.sync_api import sync_playwright
n=int(sys.argv[1])
src=open('test/sim.py',encoding='utf-8').read()
BOT=src.split('BOT = r"""')[1].split('"""')[0]
BOT=BOT.replace("([maxLevel, tries]) => {","([maxLevel, tries]) => {").replace("for (let n = 1; n <= maxLevel; n++) {","for (let n = maxLevel; n <= maxLevel; n++) {")
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(); pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(300)
    # collect all death tiles
    pg.evaluate("window.__d=[]")
    wrapped=BOT.replace("(res.dx = res.dx || {})[n] = Math.round(T.P.x / 32);","window.__d.push([T.G.cause, Math.round(T.P.x/32)]);")
    r=pg.evaluate(wrapped,[n,25])
    print(r['levels'])
    print('deaths at', pg.evaluate("window.__d"))
    print(json.dumps(pg.evaluate("""(n)=>{const L=TD.buildLevel(n);return {pits:L.pits,ents:L.ents.map(e=>[e.k,Math.round((e.x0!==undefined?e.x0:e.x)/32),e.w?Math.round(e.w/32):(e.x1?Math.round(e.x1/32):null)]).filter(e=>e[0]!=='coin'),cr:Object.keys(L.cr).map(Number).join(','),blocks:Object.keys(L.blocks)}}""",n)))
    b.close()
