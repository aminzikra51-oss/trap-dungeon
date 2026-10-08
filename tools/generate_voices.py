#!/usr/bin/env python3
"""
generate_voices.py — (اختياري) يولّد الدفعات تلقائياً عبر Gemini API بدل النسخ واللصق في AI Studio.

يولّد ملف WAV لكل دفعة (19 طلباً فقط) داخل incoming/audio/ بنفس أسماء الدفعات (B01_sy_A.wav ...)،
ثم تشغّل:   python3 tools/split_voices.py   ليقصّها إلى مقاطع، ثم   python3 build.py

    pip install requests
    export GEMINI_API_KEY=...          (من aistudio.google.com/apikey)
    python3 tools/generate_voices.py                 # كل الدفعات الناقصة
    python3 tools/generate_voices.py B01 B05 B06     # دفعات محددة

الطبقة المجانية لها حد يومي، فالسكربت يتوقف عند أول خطأ 429 ويكمل من حيث توقف لو أعدت تشغيله.
غيّر النموذج بـ  GEMINI_TTS_MODEL  لو تغيّر اسمه.
"""
import os, sys, json, time, base64, wave
import requests

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL = os.environ.get("GEMINI_TTS_MODEL", "gemini-2.5-flash-preview-tts")
KEY = os.environ.get("GEMINI_API_KEY")
WAIT = float(os.environ.get("TTS_WAIT", "25"))
ONLY = sys.argv[1:]
if not KEY: sys.exit("حط مفتاحك أولاً:  export GEMINI_API_KEY=...")

batches = json.load(open(os.path.join(ROOT, "content", "voice_batches.json"), encoding="utf-8"))
out_dir = os.path.join(ROOT, "incoming", "audio"); os.makedirs(out_dir, exist_ok=True)

def synth(style, voice, text):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={KEY}"
    body = {"contents": [{"parts": [{"text": style + "\n\nTranscript:\n" + text}]}],
            "generationConfig": {"responseModalities": ["AUDIO"],
                                 "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}}}}
    r = requests.post(url, json=body, timeout=300)
    if r.status_code == 429: raise RuntimeError("429 تجاوزت الحد المسموح: " + r.text[:160])
    r.raise_for_status()
    return base64.b64decode(r.json()["candidates"][0]["content"]["parts"][0]["inlineData"]["data"])   # PCM16 24kHz mono

todo = [b for b in batches if (not ONLY or any(b["id"].startswith(x) for x in ONLY)) and not os.path.exists(os.path.join(out_dir, b["id"] + ".wav"))]
print(f"{len(todo)} دفعة للتوليد")
for i, b in enumerate(todo, 1):
    text = "\n\n".join(it["t"] for it in b["items"])
    try: pcm = synth(b["style"], b["voice"], text)
    except Exception as e:
        print("توقف عند", b["id"], "->", e, "\nأعد التشغيل لاحقاً ليكمل."); break
    with wave.open(os.path.join(out_dir, b["id"] + ".wav"), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000); w.writeframes(pcm)
    print(f"[{i}/{len(todo)}] {b['id']} ✓  ({len(pcm)/48000:.1f}s)")
    if i < len(todo): time.sleep(WAIT)
print("خلصت. الخطوة التالية:  python3 tools/split_voices.py")
