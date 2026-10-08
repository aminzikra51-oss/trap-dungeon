#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
align_asr.py — يقصّ دفعة صوت طويلة (مثل J01_all.wav) بالاعتماد على تفريغ الكلام لنص (Whisper عبر sherpa-onnx)
بدل الاعتماد على طول الصمت فقط. مفيد لما يكون الصمت بين الأسطر قصير أو غير منتظم.

الاستخدام:
    python3 tools/align_asr.py --wav incoming/one/J01_all.wav --batch J01 --model-dir <مجلد نموذج whisper> [--dry] [--force]

المتطلبات: pip install sherpa-onnx numpy  +  نموذج whisper بصيغة sherpa-onnx (مثل sherpa-onnx-whisper-turbo من
https://github.com/k2-fsa/sherpa-onnx/releases/tag/asr-models) — فيه turbo-encoder.int8.onnx / turbo-decoder.int8.onnx / turbo-tokens.txt.

الطريقة:
  1) نقسّم الملف عند كل صمت >= 0.5 ثانية إلى "قطع كلام" (أكثر من عدد الأسطر عادةً).
  2) نفرّغ كل قطعة لنص عربي (يُحفظ بملف .pieces.json بجانب الصوت فلا يُعاد).
  3) خوارزمية DP تطابق القطع المتتالية مع الأسطر بالترتيب (سطر = 1..4 قطع متجاورة، مع إمكانية تخطّي قطعة أو سطر)
     بأعلى تشابه بين النص المفرَّغ والنص المتوقّع (بعد توحيد الحروف العربية).
  4) نقصّ، نعدّل مستوى الصوت، ونحفظ mp3 بنفس معالجة split_voices.py.
"""
import argparse, difflib, glob, json, os, re, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import split_voices as sv

def norm(s):
    s = re.sub(r'[ً-ٰٟـ]', '', s)
    s = re.sub(r'[أإآٱ]', 'ا', s); s = s.replace('ى', 'ي').replace('ة', 'ه').replace('ؤ', 'و').replace('ئ', 'ي').replace('ء', '')
    return re.sub(r'[^ء-ي]', '', s)

def make_recognizer(model_dir, lang, threads):
    import sherpa_onnx
    enc = glob.glob(os.path.join(model_dir, '**', '*encoder*.onnx'), recursive=True)[0]
    dec = glob.glob(os.path.join(model_dir, '**', '*decoder*.onnx'), recursive=True)[0]
    tok = glob.glob(os.path.join(model_dir, '**', '*tokens.txt'), recursive=True)[0]
    return sherpa_onnx.OfflineRecognizer.from_whisper(encoder=enc, decoder=dec, tokens=tok, language=lang, task='transcribe', num_threads=threads)

def pieces_of(x, noise=-40, min_sil=.5):
    sils = sv.detect_silences(x, noise, min_sil); lead, trail = sv.active_range(x, noise)
    pcs, cur = [], lead
    for a, b in sils:
        if a <= lead + .02 or b >= trail - .02: continue
        pcs.append([cur, a]); cur = b
    pcs.append([cur, trail])
    return pcs

def transcribe(x, pcs, rec):
    SR = sv.SR; out = []
    for i, (a, b) in enumerate(pcs):
        seg = x[int(max(a - .15, 0) * SR):int(min(b + .15, len(x) / SR) * SR)]
        pad = np.zeros(int(.2 * SR), dtype=np.float32)
        s = rec.create_stream(); s.accept_waveform(SR, np.concatenate([pad, seg, pad]).astype(np.float32)); rec.decode_stream(s)
        out.append(s.result.text.strip())
        if i % 20 == 0: print(f'  تفريغ {i}/{len(pcs)}', flush=True)
    return out

def align(ptxt, texts, maxk=4, skip_line=.5, skip_piece=.12, bonus=.02):
    P, N = len(ptxt), len(texts); A = [norm(t) for t in ptxt]; B = [norm(t) for t in texts]
    cache = {}
    def sim(i, k, j):
        key = (i, k, j)
        if key not in cache:
            a = ''.join(A[i:i + k]); b = B[j]
            cache[key] = difflib.SequenceMatcher(None, a, b).ratio() if a and b else 0.0
        return cache[key]
    NEG = -1e9; dp = np.full((N + 1, P + 1), NEG); bk = {}
    dp[0, 0] = 0
    for j in range(N + 1):
        for i in range(P + 1):
            v = dp[j, i]
            if v <= NEG / 2: continue
            if i < P:   # junk piece
                c = v - (0 if not A[i] else skip_piece)
                if c > dp[j, i + 1]: dp[j, i + 1] = c; bk[(j, i + 1)] = ('p', j, i)
            if j < N:
                c = v - skip_line   # line missing from audio
                if c > dp[j + 1, i]: dp[j + 1, i] = c; bk[(j + 1, i)] = ('l', j, i)
                for k in range(1, maxk + 1):
                    if i + k > P: break
                    c = v + sim(i, k, j) + bonus * k
                    if c > dp[j + 1, i + k]: dp[j + 1, i + k] = c; bk[(j + 1, i + k)] = ('m', j, i, k)
    j, i = N, P; res = [None] * N
    while (j, i) != (0, 0):
        t = bk[(j, i)]
        if t[0] == 'p': j, i = t[1], t[2]
        elif t[0] == 'l': res[t[1]] = None; j, i = t[1], t[2]
        else: res[t[1]] = (t[2], t[3], sim(t[2], t[3], t[1])); j, i = t[1], t[2]
    return res

def repair(x, res, pcs, ptxt, texts, keys, rec):
    """سطر ما لقيناله قطعة غالباً انلصق بجاره بدون صمت طويل: نجرّب نشقّ قطعة الجار عند صمت قصير ونتحقق بالتفريغ."""
    SR = sv.SR; N = len(texts)
    spans = [None if r is None else [pcs[r[0]][0], pcs[r[0] + r[1] - 1][1], r[2], ' '.join(ptxt[r[0]:r[0] + r[1]])] for r in res]
    def tr(a, b):
        seg = x[int(max(a - .1, 0) * SR):int(min(b + .1, len(x) / SR) * SR)]; pad = np.zeros(int(.2 * SR), dtype=np.float32)
        s = rec.create_stream(); s.accept_waveform(SR, np.concatenate([pad, seg, pad]).astype(np.float32)); rec.decode_stream(s); return s.result.text.strip()
    R = lambda p, q: difflib.SequenceMatcher(None, norm(p), norm(q)).ratio() if norm(p) and norm(q) else 0.0
    for m in [k for k in range(N) if spans[k] is None]:
        opts = []
        for p, q in ((m - 1, m), (m, m + 1)):
            if p < 0 or q >= N: continue
            o = p if q == m else q
            if spans[o] is None: continue
            g = R(spans[o][3], texts[p] + texts[q]) - R(spans[o][3], texts[o])
            if spans[o][1] - spans[o][0] > 4.0: g = max(g, .1)     # قطعة طويلة بشكل مريب (مثلاً ضحك طويل بياخد التفريغ)
            opts.append((g, p, q, o))
        if not opts: continue
        gain, p, q, o = max(opts)
        if gain < .08: continue
        st, en = spans[o][0], spans[o][1]
        sils = sv.detect_silences(x[int(st * SR):int(en * SR)], -33, .12); best = None
        for a0, b0 in sils:
            if a0 < .25 or b0 > en - st - .25: continue
            cm = st + (a0 + b0) / 2; L, Rt = tr(st, cm), tr(cm, en)      # التفريغ من منتصف الصمت (الاقتطاع عند حافته بيخرّب Whisper أحياناً)
            sc = R(L, texts[p]) + R(Rt, texts[q])
            if best is None or sc > best[0]: best = (sc, a0, b0, L, Rt)
        if best and best[0] >= 1.0:
            sc, a0, b0, L, Rt = best
            spans[p] = [st, st + a0, R(L, texts[p]), L]; spans[q] = [st + b0, en, R(Rt, texts[q]), Rt]
            print(f'  ↺ {keys[p]} + {keys[q]} كانوا ملتصقين: شققتهم عند {st + (a0 + b0) / 2:.2f}s')
    return spans

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--wav', required=True); ap.add_argument('--batch', required=True, help='رقم/اسم الدفعة مثل J01')
    ap.add_argument('--model-dir', help='مجلد نموذج whisper (مطلوب أول مرة فقط)'); ap.add_argument('--lang', default='ar'); ap.add_argument('--threads', type=int, default=4)
    ap.add_argument('--batches', default=os.path.join(ROOT, 'content', 'voice_batches.json')); ap.add_argument('--out', default=os.path.join(ROOT, 'assets', 'audio'))
    ap.add_argument('--dry', action='store_true'); ap.add_argument('--force', action='store_true'); ap.add_argument('--min-sim', type=float, default=.45, help='تحت هالتشابه يُعلَّم السطر للمراجعة ولا يُحفظ إلا مع --keep-low')
    ap.add_argument('--keep-low', action='store_true'); ap.add_argument('--speed', type=float, default=sv.SPEED)
    a = ap.parse_args(); sv.SPEED = a.speed
    batches = json.load(open(a.batches, encoding='utf-8'))
    b = next(x for x in batches if x['id'] == a.batch or x['id'].startswith(a.batch + '_'))
    keys = [i['key'] for i in b['items']]; texts = [i['t'] for i in b['items']]
    import tempfile
    with tempfile.TemporaryDirectory() as td:
        w = os.path.join(td, 'in.wav'); sv.to_wav(a.wav, w); x = sv.read_wav(w)
    pcs = pieces_of(x); cache = os.path.splitext(a.wav)[0] + '.pieces.json'
    if os.path.exists(cache) and json.load(open(cache, encoding='utf-8')).get('n') == len(pcs):
        ptxt = json.load(open(cache, encoding='utf-8'))['txt']
    else:
        if not a.model_dir: sys.exit('أول مرة تحتاج --model-dir')
        print(f'{len(pcs)} قطعة كلام، عم أفرّغها...'); ptxt = transcribe(x, pcs, make_recognizer(a.model_dir, a.lang, a.threads))
        json.dump(dict(n=len(pcs), txt=ptxt), open(cache, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    res = align(ptxt, texts)
    if any(r is None for r in res) and a.model_dir:
        spans = repair(x, res, pcs, ptxt, texts, keys, make_recognizer(a.model_dir, a.lang, a.threads))
    else:
        spans = [None if r is None else [pcs[r[0]][0], pcs[r[0] + r[1] - 1][1], r[2], ' '.join(ptxt[r[0]:r[0] + r[1]])] for r in res]
    os.makedirs(a.out, exist_ok=True); done = 0; low = []; miss = []
    for k, (key, text) in enumerate(zip(keys, texts)):
        r = spans[k]
        if r is None: miss.append(key); print(f'  {key:16s} ✗ غير موجود بالصوت'); continue
        st, en, s, heard = r
        flag = '' if s >= a.min_sim else '  ⚠ تشابه ضعيف'
        if flag: low.append(key)
        print(f'  {key:16s} {en - st:4.1f}s  تشابه {s:.2f}{flag} | {text[:24]} ← {heard[:30]}')
        if a.dry or (flag and not a.keep_low): continue
        out = os.path.join(a.out, key + '.mp3')
        if os.path.exists(out) and not a.force: continue
        seg = x[int(max(st - .06, 0) * sv.SR):int(min(en + .16, len(x) / sv.SR) * sv.SR)].copy()
        fi, fo = int(.006 * sv.SR), int(.03 * sv.SR)
        if len(seg) > fi + fo: seg[:fi] *= np.linspace(0, 1, fi); seg[-fo:] *= np.linspace(1, 0, fo)
        sv.save_mp3(sv.normalize(seg), out); done += 1
    sims = [r[2] for r in spans if r]
    print(f'\n{"(تجربة) " if a.dry else ""}حُفظ {done} | ضعيف {len(low)} | ناقص {len(miss)} | متوسط التشابه {np.mean(sims):.2f}')
    if low: print('للمراجعة:', ' '.join(low))
    if miss: print('غير موجود:', ' '.join(miss))

if __name__ == '__main__':
    main()
