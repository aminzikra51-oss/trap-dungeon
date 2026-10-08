#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
split_aligned.py — يقصّ دفعات الصوت حسب جدول محاذاة (start/end لكل سطر) نتج عن التعرّف على الكلام (Whisper).
المدخل: ملفات al_<batch>.json (من asr/align.py) + ملفات الدفعات في incoming/audio
المخرج: assets/audio/<key>.mp3 (نفس المعالجة تماماً: قصّ + تسوية مستوى + تسريع 1.08 + mp3 أحادي 32k)

python3 tools/split_aligned.py --al /home/claude/asr [--min-score 0.5] [--force] [--dry]
"""
import argparse, glob, json, os, sys, tempfile
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import split_voices as sv

ROOT = sv.ROOT


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--al', default='/home/claude/asr')
    ap.add_argument('--in', dest='inp', default=os.path.join(ROOT, 'incoming', 'audio'))
    ap.add_argument('--out', default=os.path.join(ROOT, 'assets', 'audio'))
    ap.add_argument('--min-score', type=float, default=0.5)
    ap.add_argument('--force', action='store_true')
    ap.add_argument('--dry', action='store_true')
    ap.add_argument('--speed', type=float, default=sv.SPEED)
    ap.add_argument('--pre', type=float, default=0.10, help='ثواني قبل أول كلمة')
    ap.add_argument('--post', type=float, default=0.22, help='ثواني بعد آخر كلمة')
    args = ap.parse_args()
    sv.SPEED = args.speed
    os.makedirs(args.out, exist_ok=True)
    done, low = 0, []
    for al in sorted(glob.glob(os.path.join(args.al, 'al_*.json'))):
        r = json.load(open(al, encoding='utf-8'))
        src = os.path.join(args.inp, r['file'])
        with tempfile.TemporaryDirectory() as td:
            wav = os.path.join(td, 'in.wav'); sv.to_wav(src, wav); x = sv.read_wav(wav)
        dur = len(x) / sv.SR
        L = r['lines']
        print(f"== {os.path.basename(al)[3:-5]}  {dur:.1f}s  {len(L)} سطر")
        for i, (key, ln) in enumerate(zip(r['keys'], L)):
            s = max(ln['start'] - args.pre, (L[i - 1]['end'] + ln['start']) / 2 if i else 0)
            e = min(ln['end'] + args.post, (ln['end'] + L[i + 1]['start']) / 2 if i + 1 < len(L) else dur, dur)
            seg = x[int(s * sv.SR):int(e * sv.SR)].copy()
            fi, fo = int(.006 * sv.SR), int(.03 * sv.SR)
            if len(seg) > fi + fo:
                seg[:fi] *= np.linspace(0, 1, fi); seg[-fo:] *= np.linspace(1, 0, fo)
            flag = ''
            if ln['score'] < args.min_score: flag = ' ⚠ ثقة منخفضة'; low.append((key, ln['score'], ln['asr']))
            out = os.path.join(args.out, key + '.mp3')
            skip = os.path.exists(out) and not args.force
            print(f"  {key:20s} {e - s:4.1f}s sc={ln['score']:.2f}{flag}{'  (موجود)' if skip else ''}")
            if not args.dry and not skip:
                sv.save_mp3(sv.normalize(seg), out); done += 1
    print(f"\nتم: {done} مقطع")
    for k, s, a in low: print('⚠', k, s, a)


if __name__ == '__main__':
    main()
