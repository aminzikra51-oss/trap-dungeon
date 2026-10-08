import json, sys
from playwright.sync_api import sync_playwright
n=int(sys.argv[1])
JS = """
(n) => { const T=window.TD; const L=T.buildLevel(n); const o=[];
 for(const e of L.ents){ o.push([e.k, Math.round((e.x0!==undefined?e.x0:e.x)/32), e.x1!==undefined?Math.round(e.x1/32):(e.w?Math.round(e.w/32):null), e.sp||null]); }
 return {w:L.w, pits:L.pits, cr:Object.keys(L.cr).map(Number), ents:o, signs:L.signs.map(s=>s.tx)}; }
"""
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(); pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html')
    print(json.dumps(pg.evaluate(JS,n)))
    b.close()
