"""One TTS clip per line -> assets/audio/<key>.mp3 (trim silence, fade, normalise, same encoder as split_voices.py).
usage: python3 tools/tts_single.py [--dry] [--force]   (clips whose mp3 already exists are skipped unless --force)   — takes every incoming/tts/<key>.wav (the key is the voices.json entry key, e.g. lb_h_die_09)"""
import os, sys, glob, subprocess, tempfile
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import split_voices as sv
IN = os.path.join(sv.ROOT, 'incoming', 'tts'); OUT = os.path.join(sv.ROOT, 'assets', 'audio')
def trim(x, sr=sv.SR, thr_db=-44, pad=.07):
    n = int(sr * .01); fr = x[:len(x) // n * n].reshape(-1, n); db = 20 * np.log10(np.sqrt((fr ** 2).mean(1)) + 1e-9)
    idx = np.where(db > thr_db)[0]
    if len(idx) == 0: return x
    a = max(0, int((idx[0] * .01 - pad) * sr)); b = min(len(x), int(((idx[-1] + 1) * .01 + pad) * sr)); return x[a:b].copy()
def main():
    dry = '--dry' in sys.argv; n = 0
    for f in sorted(glob.glob(os.path.join(IN, '*.wav'))):
        key = os.path.basename(f)[:-4]
        if os.path.exists(os.path.join(OUT, key + '.mp3')) and '--force' not in sys.argv: continue
        with tempfile.TemporaryDirectory() as td:
            w = os.path.join(td, 'a.wav'); sv.to_wav(f, w); x = sv.read_wav(w)
        seg = trim(x); fi = min(len(seg) // 4, int(sv.SR * .01)); fo = min(len(seg) // 4, int(sv.SR * .06))
        if fi: seg[:fi] *= np.linspace(0, 1, fi)
        if fo: seg[-fo:] *= np.linspace(1, 0, fo)
        print(f'{key}: {len(x)/sv.SR:.2f}s -> {len(seg)/sv.SR/sv.SPEED:.2f}s')
        if not dry: sv.save_mp3(sv.normalize(seg), os.path.join(OUT, key + '.mp3')); n += 1
    print('written', n)
main()
