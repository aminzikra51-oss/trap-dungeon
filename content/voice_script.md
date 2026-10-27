# سكربت الأصوات لـ Google AI Studio

**30 سطر: إمّا دفعة وحدة (J01) أو 2 دفعات منفصلة بأصوات مختلفة.**

## طريقة العمل (لكل دفعة، دقيقتين)
1. افتح **aistudio.google.com** ← **Generate Media** ← **Speech generation** (أو "Generate speech").
2. اختر نموذج **Gemini TTS** (Flash أو Pro)، والوضع **Single-speaker**.
3. في خانة **Style instructions** الصق نص "Style" الخاص بالدفعة.
4. اختر الصوت (Voice) المكتوب فوق الدفعة (مقترح، غيّره لو ما عجبك).
5. في خانة **Text** الصق نص الدفعة كما هو (كل سطر بسطر منفصل).
6. اضغط **Run** واسمع النتيجة. لو في سطر انقرأ غلط أعد التوليد (الأصوات عشوائية شوي).
7. نزّل الملف وسمّه باسم الدفعة، مثلاً `B01_sy_A.wav`.
8. لما تخلّص ارفع كل الملفات هون بالمحادثة وأنا بقصّها وبركّبها بالعبة.

**نصائح:** لو تقطّع الصوت أو دمج سطرين، قسّم الدفعة لنصفين. الطبقة المجانية لها حد يومي، فابدأ بدفعات الأولوية 1.
اللهجات المغربية والعراقية والخليجية أنا أقل ثقة فيها، فلو في عبارة غلط عدّلها وأنا بحدّث النص بالعبة.


---
## J01 — دفعة وحدة: كل الناقص بصوت واحد (أردني)   (أولوية 0، 30 سطر)

- **Voice:** `Puck`
- **ملف الحفظ:** `J01_all.wav`

**Style instructions:**
```
You are one versatile voice actor in a funny cartoon video game, performing several different characters one after another, all speaking Jordanian Arabic (urban Amman), natural Levantine pronunciation. The lines come in this exact order: the first 15 lines of BOT 01, a small clumsy retro robot with a flat monotone computer voice that glitches into panic, deadpan and funny, says beep-boop style status messages; then the next 15 lines of a cheerful curious little mushroom explorer with a backpack and notebook, enthusiastic, wide-eyed, narrates his discoveries like a nature documentary. Change your voice and delivery clearly for each character, with big comic emotion, fully in character, natural and quick, never flat. Written laughter such as هههه must be performed as real laughter. Read ONLY the text lines, in order, without any numbering, labels or character names. Leave a clear silence of about 3 seconds after each line before starting the next one.
```

**Text:**
```
تشغيل... أهلاً يا بشر!

بوت واحد جاهز للموت

تحميل الشجاعة... فشل

خطأ! خطأ! النظام معطّل!

جاري الموت... اكتمل

ما في نسخة احتياطية! آخ!

ما انبرمجت على الفخاخ!

تحذير! اهرب! اهرب! اهرب!

جاري الهروب بأقصى سرعة

البطارية ثلاثة بالمية! اركض!

اكتملت المهمة! بيب بوب!

نجاح! سأحتفل... بصمت

عدّيت وما احترقت دارتي

تنبيه: ضحكة مريبة!

رصدت فخ... متأخر

يا هلا! مستكشف الفطر هون!

مغامرة جديدة! يا حلو!

يلا نكتشف الزنزانة!

آخ! قبّعتي تفطّرت!

ما قرأت عن هالفخ بالكتاب!

فطر مسكين! وقعت!

سجّلوا: الفخ خطير جداً!

اهرب يا فطر! اهرب!

ركض ركض! الشنطة ثقيلة!

ما كنت ناوي أجري هيك!

اكتشاف عظيم! عدّيت!

سجّلت الإنجاز بدفتري!

الفطر بيعدّي! هيهي!

شو هالصوت؟ مثير للاهتمام!

يا ساتر! شو هاد؟
```


---
## H07 — بطل: الروبوت BOT 01 (أردني)   (أولوية 1، 15 سطر)

- **Voice:** `Charon`
- **ملف الحفظ:** `H07_robot.wav`

**Style instructions:**
```
You are the voice of BOT 01, a small clumsy retro robot with a flat monotone computer voice that glitches into panic, deadpan and funny, says beep-boop style status messages, a character in a funny cartoon video game. Accent: Jordanian Arabic (urban Amman), natural Levantine pronunciation. Each line below is a short spoken exclamation by this character: perform it with big comic emotion, fully in character, natural and quick, never reading it flat. Read ONLY the text lines, in order, without any numbering or labels. Leave a clear silence of about 3 seconds after each line before starting the next one.
```

**Text:**
```
تشغيل... أهلاً يا بشر!

بوت واحد جاهز للموت

تحميل الشجاعة... فشل

خطأ! خطأ! النظام معطّل!

جاري الموت... اكتمل

ما في نسخة احتياطية! آخ!

ما انبرمجت على الفخاخ!

تحذير! اهرب! اهرب! اهرب!

جاري الهروب بأقصى سرعة

البطارية ثلاثة بالمية! اركض!

اكتملت المهمة! بيب بوب!

نجاح! سأحتفل... بصمت

عدّيت وما احترقت دارتي

تنبيه: ضحكة مريبة!

رصدت فخ... متأخر
```


---
## H08 — بطل: فطر المستكشف (أردني)   (أولوية 1، 15 سطر)

- **Voice:** `Zephyr`
- **ملف الحفظ:** `H08_mushroom.wav`

**Style instructions:**
```
You are the voice of a cheerful curious little mushroom explorer with a backpack and notebook, enthusiastic, wide-eyed, narrates his discoveries like a nature documentary, a character in a funny cartoon video game. Accent: Jordanian Arabic (urban Amman), natural Levantine pronunciation. Each line below is a short spoken exclamation by this character: perform it with big comic emotion, fully in character, natural and quick, never reading it flat. Read ONLY the text lines, in order, without any numbering or labels. Leave a clear silence of about 3 seconds after each line before starting the next one.
```

**Text:**
```
يا هلا! مستكشف الفطر هون!

مغامرة جديدة! يا حلو!

يلا نكتشف الزنزانة!

آخ! قبّعتي تفطّرت!

ما قرأت عن هالفخ بالكتاب!

فطر مسكين! وقعت!

سجّلوا: الفخ خطير جداً!

اهرب يا فطر! اهرب!

ركض ركض! الشنطة ثقيلة!

ما كنت ناوي أجري هيك!

اكتشاف عظيم! عدّيت!

سجّلت الإنجاز بدفتري!

الفطر بيعدّي! هيهي!

شو هالصوت؟ مثير للاهتمام!

يا ساتر! شو هاد؟
```
