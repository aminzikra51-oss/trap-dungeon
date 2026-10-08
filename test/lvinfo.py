import sys, json
from playwright.sync_api import sync_playwright
levels=[int(x) for x in sys.argv[1].split(',')]; lo=int(sys.argv[2]); hi=int(sys.argv[3])
JS="""([n,lo,hi])=>{const L=TD.buildLevel(n);const ex=e=>(e.cx!==undefined?e.cx:(e.px!==undefined?e.px:e.x));
 return JSON.stringify({segs:L.segs.filter(s=>s[1]+s[2]>=lo&&s[1]<=hi),zones:L.zones.map(z=>[z.type,Math.round(z.x0/32),Math.round(z.x1/32),z.dir]).filter(z=>z[2]>=lo&&z[1]<=hi),
 pits:L.pits.filter(p=>p[0]+p[1]>=lo&&p[0]<=hi),
 ents:L.ents.filter(e=>ex(e)>=lo*32&&ex(e)<=hi*32&&e.t!=='coin').map(e=>[e.t+(e.v?':'+e.v:''),Math.round(ex(e)/32),e.w?Math.round(e.w/32):null,e.t==='plat'?Math.round(e.x0/32)+'-'+Math.round(e.x1/32):null])})}"""
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(); pg.goto('file:///home/claude/trap-dungeon/trap-dungeon.html'); pg.wait_for_timeout(300)
    for n in levels: print(n, pg.evaluate(JS,[n,lo,hi]))
    b.close()
