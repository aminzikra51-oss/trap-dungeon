"""A tiny stand-in for Firebase Realtime Database's REST + Server-Sent-Events API (just what src/w_net.js uses): PUT/DELETE of a JSON tree and
GET with Accept: text/event-stream -> 'put' events {path,data}. CORS enabled, so tests can run without a Firebase project.
Network model (all in seconds): lat = one-way delivery delay to a listener, jit = +-random on it, loss = chance that an event needs a TCP retransmission
(+rto, and because an SSE stream is ordered, everything behind it waits too = head-of-line blocking), wjit = random extra delay of each PUT before the
server applies it (separate HTTP requests DO overtake each other), spike = (period, length, extra): a periodic burst of extra delay (handover / bufferbloat)."""
import json, threading, time, heapq, random
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse

class Chan:
    """one listener's ordered stream: an event is handed out when its due time has come, never before an earlier one (TCP order)"""
    def __init__(self): self.cv = threading.Condition(); self.h = []; self.last = 0.0; self.n = 0
    def put(self, ev, due=0.0):
        with self.cv:
            due = max(due, self.last); self.last = due; self.n += 1; heapq.heappush(self.h, (due, self.n, ev)); self.cv.notify()
    def get(self, timeout):
        end = time.time() + timeout
        with self.cv:
            while True:
                now = time.time()
                if self.h and self.h[0][0] <= now: return heapq.heappop(self.h)[2]
                if now >= end: return None
                self.cv.wait(max(0.001, min(end, self.h[0][0] if self.h else end) - now))

class FakeRtdb:
    def __init__(self, lat=0.0, jit=0.0, loss=0.0, rto=0.25, wjit=0.0, spike=None, seed=7):
        self.tree = {}; self.lock = threading.Lock(); self.ls = []; self.lat = lat; self.log = []
        self.jit = jit; self.loss = loss; self.rto = rto; self.wjit = wjit; self.spike = spike; self.rnd = random.Random(seed); self.t0 = time.time(); self.nput = 0
        db = self
        class H(BaseHTTPRequestHandler):
            protocol_version = 'HTTP/1.0'
            def log_message(self, *a): pass
            def _cors(self):
                self.send_header('Access-Control-Allow-Origin', '*'); self.send_header('Access-Control-Allow-Methods', 'GET,PUT,POST,PATCH,DELETE,OPTIONS')
                self.send_header('Access-Control-Allow-Headers', '*'); self.send_header('Access-Control-Max-Age', '3600')
            def _segs(self):
                path = urlparse(self.path).path
                if path.endswith('.json'): path = path[:-5]
                return [x for x in path.split('/') if x]
            def do_OPTIONS(self):
                self.send_response(204); self._cors(); self.end_headers()
            def do_PUT(self):
                n = int(self.headers.get('Content-Length') or 0); body = self.rfile.read(n).decode() if n else 'null'
                db.nput += 1
                if db.wjit: time.sleep(db.rnd.uniform(0, db.wjit))
                val = db.resolve(json.loads(body)); db.write(self._segs(), val)
                self.send_response(200); self._cors(); self.send_header('Content-Type', 'application/json'); self.end_headers()
                self.wfile.write(b'null' if 'print=silent' in self.path else json.dumps(val).encode())       # the real service echoes what it stored (server values resolved)
            def do_DELETE(self):
                db.write(self._segs(), None); self.send_response(200); self._cors(); self.end_headers(); self.wfile.write(b'null')
            def do_GET(self):
                segs = self._segs()
                if 'text/event-stream' not in (self.headers.get('Accept') or ''):
                    self.send_response(200); self._cors(); self.send_header('Content-Type', 'application/json'); self.end_headers(); self.wfile.write(json.dumps(db.get(segs)).encode()); return
                q = Chan(); ent = (segs, q)
                with db.lock: db.ls.append(ent); first = json.dumps({'path': '/', 'data': db.get(segs)})
                self.send_response(200); self._cors(); self.send_header('Content-Type', 'text/event-stream'); self.send_header('Cache-Control', 'no-cache'); self.end_headers()
                try:
                    self.wfile.write(('event: put\ndata: %s\n\n' % first).encode()); self.wfile.flush()
                    while True:
                        ev = q.get(4)
                        self.wfile.write(('event: put\ndata: %s\n\n' % ev).encode() if ev else b'event: keep-alive\ndata: null\n\n'); self.wfile.flush()
                except Exception: pass
                finally:
                    with db.lock:
                        if ent in db.ls: db.ls.remove(ent)
        class Srv(ThreadingHTTPServer):
            def handle_error(self, *a): pass                         # clients that went away (closed pages) are normal here
        self.srv = Srv(('127.0.0.1', 0), H); self.srv.daemon_threads = True
        self.port = self.srv.server_address[1]; self.url = f'http://127.0.0.1:{self.port}'
        threading.Thread(target=self.srv.serve_forever, daemon=True).start()
    def delay(self):
        d = self.lat
        if self.jit: d += self.rnd.uniform(-self.jit, self.jit)
        if self.loss and self.rnd.random() < self.loss: d += self.rto
        if self.spike:
            per, ln, extra = self.spike
            if (time.time() - self.t0) % per < ln: d += extra
        return max(0.0, d)
    def resolve(self, v):
        # {".sv": "timestamp"} -> server time in ms, like the real REST API
        if isinstance(v, dict):
            if v.get('.sv') == 'timestamp': return int(time.time() * 1000)
            return {k: self.resolve(x) for k, x in v.items()}
        return v
    def get(self, segs):
        node = self.tree
        for s in segs:
            if not isinstance(node, dict) or s not in node: return None
            node = node[s]
        return node
    def write(self, segs, val):
        with self.lock:
            if not segs: self.tree = val if isinstance(val, dict) else {}
            else:
                node = self.tree
                for s in segs[:-1]:
                    if not isinstance(node.get(s), dict):
                        if val is None: return                  # deleting something that is not there is a no-op (the real service does not create empty parents)
                        node[s] = {}
                    node = node[s]
                if val is None: node.pop(segs[-1], None)
                else: node[segs[-1]] = val
            self.log.append((time.time(), '/'.join(segs)))
            for lsegs, q in list(self.ls):
                if segs[:len(lsegs)] == lsegs:
                    ev = json.dumps({'path': '/' + '/'.join(segs[len(lsegs):]), 'data': val})
                elif lsegs[:len(segs)] == segs:
                    ev = json.dumps({'path': '/', 'data': self.get(lsegs)})
                else: continue
                q.put(ev, time.time() + self.delay())
    def close(self): self.srv.shutdown()
