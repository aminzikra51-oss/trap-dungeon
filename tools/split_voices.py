#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
split_voices.py — يقصّ ملفات الدفعات المولَّدة من Google AI Studio إلى مقاطع منفصلة لكل سطر.

الاستخدام:
    python3 tools/split_voices.py                  # يعالج كل شيء في incoming/audio
    python3 tools/split_voices.py --dry            # يعرض الخطة فقط بدون كتابة
    python3 tools/split_voices.py --batch B01 B05  # دفعات محددة
    python3 tools/split_voices.py --force          # يعيد كتابة المقاطع الموجودة

أسماء الملفات: الجزء الأول من الاسم هو رقم الدفعة (B01_sy_A.wav، B05.mp3 ...) وأي امتداد صوتي.
وإن كان اسم الملف يساوي مفتاح سطر مفرد (مثل sy_taunt_01.wav) يُحوَّل كما هو كمقطع واحد.

الطريقة: يكتشف الصمت بـ ffmpeg، ثم يختار N-1 نقطة فصل بين السطور بخوارزمية DP
تجمع بين طول الصمت ومطابقة مدة كل مقطع لطول النص المتوقع (فلا تخدعها وقفة داخل جملة).
ثم يقصّ الأطراف، ويعدّل مستوى الصوت، ويحفظ mp3 أحادي خفيف في assets/audio/<key>.mp3
"""
import argparse, glob, json, math, os, re, subprocess, sys, tempfile, wave
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO_EXT = ('.wav', '.mp3', '.m4a', '.ogg', '.flac', '.aac', '.opus', '.webm')
SR = 24000
TARGET_RMS = -17.5      # dBFS تقريباً مثل المقاطع الموجودة
PEAK_CAP = -1.0
SPEED = 1.08            # تسريع خفيف بدون تغيير الطبقة (TTS بطيء شوي) — غيّره بـ --speed 1 لإلغائه

def run(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, **kw)

def to_wav(src, dst):
    r = run(['ffmpeg', '-y', '-loglevel', 'error', '-i', src, '-ac', '1', '-ar', str(SR), '-c:a', 'pcm_s16le', dst])
    if r.returncode: raise RuntimeError(r.stderr.strip()[:300])

def read_wav(path):
    with wave.open(path, 'rb') as w:
        n = w.getnframes(); raw = w.readframes(n)
    return np.frombuffer(raw, dtype='<i2').astype(np.float32) / 32768.0

def write_wav(path, x):
    with wave.open(path, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes())

def detect_silences(x, noise_db, min_sil, frame=0.01):
    """صمت = مقاطع طاقتها أقل من العتبة لمدة >= min_sil. نحسب RMS لكل 10ms (أدق وأسرع من الاعتماد على ffmpeg)."""
    n = int(SR * frame); m = len(x) // n
    if m == 0: return []
    rms = np.sqrt((x[:m * n].reshape(m, n) ** 2).mean(axis=1) + 1e-12)
    db = 20 * np.log10(rms)
    quiet = db < noise_db
    sil, i = [], 0
    while i < m:
        if quiet[i]:
            j = i
            while j < m and quiet[j]: j += 1
            if (j - i) * frame >= min_sil: sil.append((i * frame, j * frame))
            i = j
        else: i += 1
    return sil

def active_range(x, noise_db, frame=0.01):
    """أول وآخر لحظة فيها كلام (مستقل عن حد الصمت الأدنى)."""
    n = int(SR * frame); m = len(x) // n
    db = 20 * np.log10(np.sqrt((x[:m * n].reshape(m, n) ** 2).mean(axis=1)) + 1e-9)
    act = np.where(db >= noise_db)[0]
    if len(act) == 0: return 0.0, len(x) / SR
    return act[0] * frame, (act[-1] + 1) * frame

def choose_splits(sils, dur, texts, kinds):
    """sils: صمت داخلي مرشّح (start,end). نختار len(texts)-1 فاصلاً بـ DP."""
    N = len(texts); M = len(sils)
    if N == 1: return []
    if M < N - 1: return None
    chars = np.array([max(len(re.sub(r'[\s!؟?.،,…\-]', '', t)), 2) for t in texts], dtype=float)
    w = np.array([0.15 if k in ('laugh', 'scream') else 1.0 for k in kinds])
    lens = np.array([e - s for s, e in sils])
    top = np.sort(lens)[::-1][:N - 1].sum()
    speech = max(dur - top, 1.0)
    cps = chars.sum() / speech
    exp = chars / cps + 0.25                         # المدة المتوقعة لكل سطر (ثانية)
    # نقاط البداية والنهاية لكل مقطع i بين فاصلين a (قبله) و b (بعده): من a.end إلى b.start
    def seg_cost(i, a, b):
        s = 0.0 if a is None else sils[a][1]
        e = dur if b is None else sils[b][0]
        d = max(e - s, 0.15)
        return w[i] * (math.log(d / exp[i])) ** 2
    A, B = 1.0, 1.4
    NEG = -1e18
    # f[j][c] = أفضل نتيجة بعد اختيار j+1 فاصلاً وآخرها c ، المقاطع 0..j مكتملة
    f = [[NEG] * M for _ in range(N - 1)]; back = [[-1] * M for _ in range(N - 1)]
    for c in range(M):
        f[0][c] = A * min(lens[c], 3.0) - B * seg_cost(0, None, c)
    for j in range(1, N - 1):
        for c in range(j, M):
            best, bi = NEG, -1
            for p in range(j - 1, c):
                if f[j - 1][p] == NEG: continue
                v = f[j - 1][p] - B * seg_cost(j, p, c)
                if v > best: best, bi = v, p
            if bi >= 0:
                f[j][c] = best + A * min(lens[c], 3.0); back[j][c] = bi
    best, last = NEG, -1
    for c in range(N - 2, M):
        if f[N - 2][c] == NEG: continue
        v = f[N - 2][c] - B * seg_cost(N - 1, c, None)
        if v > best: best, last = v, c
    if last < 0: return None
    path = [last]
    for j in range(N - 2, 0, -1):
        path.append(back[j][path[-1]])
    return path[::-1], exp

def process_batch(wav, texts, kinds, args):
    x = read_wav(wav); dur = len(x) / SR
    N = len(texts)
    attempts = [(-38, .9), (-38, .6), (-34, .5), (-32, .4), (-30, .3)]
    chosen = None; info = {}
    for noise, mins in attempts:
        sils = detect_silences(x, noise, mins)
        lead_end, trail_start = active_range(x, noise)
        inner = [s for s in sils if s[0] > lead_end + 0.05 and s[1] < trail_start - 0.05]
        if len(inner) < N - 1: continue
        res = choose_splits([(s - lead_end, e - lead_end) for s, e in inner], trail_start - lead_end, texts, kinds)
        if res is None: continue
        path, exp = res
        chosen = [inner[i] for i in path]; info = dict(noise=noise, min_sil=mins, lead=lead_end, trail=trail_start, inner=len(inner), exp=exp)
        break
    if chosen is None:
        return None, f'تعذّر إيجاد {N-1} فواصل في الملف (وُجد صمت أقل من اللازم). جرّب تقسيم الدفعة لنصفين أو زيادة مدة الصمت.'
    # حدود المقاطع
    bounds = []
    prev_end = info['lead']
    for k in range(N):
        s = prev_end
        e = chosen[k][0] if k < N - 1 else info['trail']
        bounds.append((max(s - .05, 0), min(e + .16, dur)))
        if k < N - 1: prev_end = chosen[k][1]
    # قياس "قوة" الفصل: أضعف فاصل مختار مقابل أقوى فاصل غير مختار
    lens = sorted([e - s for s, e in chosen])
    unchosen = [e - s for (s, e) in [(a, b) for a, b in detect_silences(x, info['noise'], info['min_sil'])] if (s, e) not in chosen and s > info['lead'] + .05 and e < info['trail'] - .05]
    margin = (lens[0] / max(unchosen)) if unchosen and lens else 99.0
    clips = []
    for k, (s, e) in enumerate(bounds):
        seg = x[int(s * SR):int(e * SR)].copy()
        # تدرّج بسيط لمنع الطقطقة
        fi, fo = int(.006 * SR), int(.03 * SR)
        if len(seg) > fi + fo:
            seg[:fi] *= np.linspace(0, 1, fi); seg[-fo:] *= np.linspace(1, 0, fo)
        clips.append(seg)
    return dict(clips=clips, info=info, margin=margin, bounds=bounds, dur=dur), None

def normalize(seg):
    if len(seg) == 0: return seg
    rms = 20 * math.log10(float(np.sqrt((seg ** 2).mean())) + 1e-9); peak = 20 * math.log10(float(np.abs(seg).max()) + 1e-9)
    g = TARGET_RMS - rms; g = min(g, PEAK_CAP - peak); g = max(min(g, 14), -10)
    return seg * (10 ** (g / 20))

def save_mp3(seg, out):
    with tempfile.TemporaryDirectory() as td:
        w = os.path.join(td, 'a.wav'); write_wav(w, seg)
        af = ['-af', f'atempo={SPEED}'] if abs(SPEED - 1) > 0.005 else []
        r = run(['ffmpeg', '-y', '-loglevel', 'error', '-i', w, *af, '-ac', '1', '-ar', str(SR), '-b:a', '32k', out])
        if r.returncode: raise RuntimeError(r.stderr.strip()[:300])

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--in', dest='inp', default=os.path.join(ROOT, 'incoming', 'audio'))
    ap.add_argument('--out', default=os.path.join(ROOT, 'assets', 'audio'))
    ap.add_argument('--batches', default=os.path.join(ROOT, 'content', 'voice_batches.json'))
    ap.add_argument('--batch', nargs='*', help='أرقام/أسماء دفعات محددة، مثل B01 B05')
    ap.add_argument('--dry', action='store_true'); ap.add_argument('--force', action='store_true')
    ap.add_argument('--keep-raw', action='store_true', help='احفظ المقاطع الخام بدون معالجة في incoming/audio/_cut')
    ap.add_argument('--speed', type=float, default=SPEED, help='سرعة التشغيل (1.0 = بدون تغيير)')
    args = ap.parse_args()
    globals()['SPEED'] = args.speed

    batches = json.load(open(args.batches, encoding='utf-8'))
    manifest = json.load(open(os.path.join(ROOT, 'assets', 'voices.json'), encoding='utf-8'))
    kind_of = {k: v['k'] for k, v in manifest.items()}
    files = sorted(f for f in glob.glob(os.path.join(args.inp, '*')) if f.lower().endswith(AUDIO_EXT))
    if not files: sys.exit(f'ما لقيت ملفات صوت في {args.inp}')
    os.makedirs(args.out, exist_ok=True)
    done, problems, warn = 0, [], []
    used = set()
    for b in batches:
        bid = b['id']; num = bid.split('_')[0]
        if args.batch and not any(bid.startswith(x) or x == bid for x in args.batch): continue
        f = next((f for f in files if re.match(rf'^{num}(?![0-9])', os.path.basename(f))), None)
        if not f: continue
        used.add(f)
        keys = [i['key'] for i in b['items']]; texts = [i['t'] for i in b['items']]; kinds = [kind_of.get(k, 'taunt') for k in keys]
        todo = [k for k in keys if args.force or not os.path.exists(os.path.join(args.out, k + '.mp3'))]
        if not todo: print(f'{bid}: كل المقاطع موجودة (استعمل --force لإعادتها)'); continue
        with tempfile.TemporaryDirectory() as td:
            wav = os.path.join(td, 'in.wav')
            try: to_wav(f, wav)
            except Exception as e: problems.append(f'{bid}: فشل قراءة الملف {os.path.basename(f)}: {e}'); continue
            res, err = process_batch(wav, texts, kinds, args)
        if err: problems.append(f'{bid}: {err}'); continue
        info = res['info']
        print(f"\n== {bid}  ({os.path.basename(f)}, {res['dur']:.1f}s) -> {len(keys)} مقطع | عتبة {info['noise']}dB / صمت>={info['min_sil']}s | ثقة الفصل ×{res['margin']:.1f}")
        if res['margin'] < 1.3: warn.append(f"{bid}: الفصل بين السطور غير واضح (×{res['margin']:.1f}) — اسمع المقاطع أو قسّم الدفعة")
        for k, (key, seg, text) in enumerate(zip(keys, res['clips'], texts)):
            d = len(seg) / SR; chars = len(re.sub(r'[\s!؟?.،,…\-]', '', text)); cps = chars / max(d, .1)
            flag = ''
            if kinds[k] not in ('laugh', 'scream') and (cps < 3 or cps > 26): flag = '  ⚠ مدة غريبة'; warn.append(f'{key}: مدة {d:.1f}s لنص {chars} حرف')
            if d < .35: flag = '  ⚠ قصير جداً'; warn.append(f'{key}: قصير جداً')
            print(f'  {key:18s} {d:4.1f}s  {cps:4.1f} حرف/ث {flag}  | {text[:40]}')
            if not args.dry and key in todo:
                save_mp3(normalize(seg), os.path.join(args.out, key + '.mp3')); done += 1
    # ملفات مفردة باسم المفتاح
    for f in files:
        if f in used: continue
        stem = os.path.splitext(os.path.basename(f))[0]
        if stem in manifest:
            out = os.path.join(args.out, stem + '.mp3')
            if os.path.exists(out) and not args.force: continue
            with tempfile.TemporaryDirectory() as td:
                wav = os.path.join(td, 'in.wav'); to_wav(f, wav); x = read_wav(wav)
                s0, e0 = active_range(x, -38)
                seg = x[int(max(s0 - .05, 0) * SR):int(min(e0 + .16, len(x) / SR) * SR)]
            print(f'  {stem:18s} (ملف مفرد) {len(seg)/SR:.1f}s')
            if not args.dry: save_mp3(normalize(seg), out); done += 1
        elif not any(stem.startswith(b['id'].split('_')[0]) for b in batches):
            warn.append(f'تجاهلت ملف غير معروف: {os.path.basename(f)}')
    print(f"\n{'(تجربة بدون كتابة) ' if args.dry else ''}تم: {done} مقطع")
    for w in warn: print('⚠', w)
    for p in problems: print('✗', p)
    if done and not args.dry: print('الآن شغّل:  python3 build.py')
    return 1 if problems else 0

if __name__ == '__main__':
    sys.exit(main())
