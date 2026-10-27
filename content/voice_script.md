# سكربت الأصوات لـ Google AI Studio

**63 سطر: إمّا الملفات J (صوت واحد) أو 3 دفعات منفصلة بأصوات مختلفة.**

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
## J01 — أبطال: الروبوت BOT 01 + فطر المستكشف (أردني، صوت واحد)   (أولوية 0، 18 سطر)

- **Voice:** `Puck`
- **ملف الحفظ:** `J01_heroes.wav`

**Style instructions:**
```
You are one voice actor in a funny cartoon video game, speaking Jordanian Arabic (urban Amman), natural Levantine pronunciation. Keep the SAME voice and timbre for every line; change only the energy and the emotion. First, 3 lines spoken by BOT 01, a small clumsy retro robot with a flat monotone computer voice that glitches into panic, deadpan and funny, says beep-boop style status messages. Then 15 lines spoken by a cheerful curious little mushroom explorer with a backpack and notebook, enthusiastic, wide-eyed, narrates his discoveries like a nature documentary. Perform each with big comic emotion, fully in character, natural and quick. Read ONLY the text lines, in order, without any numbering, labels or character names. Leave a clear silence of about 3 seconds after each line before starting the next one.
```

**Text:**
```
عدّيت وما احترقت دارتي

تنبيه: ضحكة مريبة!

رصدت فخ... بس متأخر

يا هلا! مستكشف الفطر هون!

مغامرة جديدة! يا حلو!

يلا نكتشف الزنزانة!

آخ! قبّعتي تفطّرت!

ما قرأت عن هالفخ بالكتاب!

فطر مسكين! وقعت!

سجّلوا: الفخ خطير جداً!

اهرب يا فطر! اهرب!

ركض ركض! الشنطة ثقيلة!

ما كنت ناوي أركض هيك!

اكتشاف عظيم! عدّيت!

سجّلت الإنجاز بدفتري!

الفطر بيعدّي! هيهي!

شو هالصوت؟ مثير للاهتمام!

يا ساتر! شو هاد؟
```


---
## J02 — تعليقات الفخاخ 1 (أردني، صوت واحد)   (أولوية 0، 25 سطر)

- **Voice:** `Puck`
- **ملف الحفظ:** `J02_traps_a.wav`

**Style instructions:**
```
You are one voice actor in a funny cartoon video game, speaking Jordanian Arabic (urban Amman), natural Levantine pronunciation. Keep the SAME voice and timbre for every line; change only the energy and the emotion. Every line is a comment shown when the player dies to a trap, so perform it as gleeful, cheeky, over-the-top mockery, like laughing at a friend who just failed. Written laughter such as هههه must be performed as real laughter. Read ONLY the text lines, in order, without any numbering, labels or character names. Leave a clear silence of about 3 seconds after each line before starting the next one.
```

**Text:**
```
يا ساتر! ريحة شاورما بالزنزانة!

النار قالتلك: على مهلك يا زلمة!

صرت فحمة! حدا معه خبز؟

نفّاثة نار؟ كان لازم تلبس مريول مطبخ!

شوّيناك! بالهنا والشفا!

الغيمة قالتلك: ما توقف مكانك!

شعرك وقف! كان لازم تفكّر قبل!

صعقة مجانية! بس ما حدا طلبها!

الغيمة زعلانة منك! كمّل ركض!

برق ورعد وإنت النتيجة!

ديسكو بلا تذكرة! رقصت يا بطل!

كنت بترقص ولا بتنصعق؟ ما بنعرف!

الأرض كلها كهربا يا زلمة!

البلاطة الصفرا كانت تحذير، مش ديكور!

تحت رجليك كهربا! شو كنت متوقع؟

انقسمت نصّين! شو سوّيت يا عيني؟

الليزر ما بيفرّق: نصّك إلك ونصّك للأرض!

الشعاع الأحمر كان مكتوب عليه: لا تلمس!

قطعة من هون وقطعة من هناك!

ليزر دوّار وإنت صرت بازل!

القطار زمّر وإنت ما سمعت!

صرت ورقة رفيعة خالص!

تشو تشو! وانتهت الرحلة!

القطار مش واقف على حدا يا زلمة!

انفرشت عالقضبان مثل الصاج!
```


---
## J03 — تعليقات الفخاخ 2 (أردني، صوت واحد)   (أولوية 0، 20 سطر)

- **Voice:** `Puck`
- **ملف الحفظ:** `J03_traps_b.wav`

**Style instructions:**
```
You are one voice actor in a funny cartoon video game, speaking Jordanian Arabic (urban Amman), natural Levantine pronunciation. Keep the SAME voice and timbre for every line; change only the energy and the emotion. Every line is a comment shown when the player dies to a trap, so perform it as gleeful, cheeky, over-the-top mockery, like laughing at a friend who just failed. Written laughter such as هههه must be performed as real laughter. Read ONLY the text lines, in order, without any numbering, labels or character names. Leave a clear silence of about 3 seconds after each line before starting the next one.
```

**Text:**
```
الخلد قالك: تفضّل عالقمر!

قبّعتك وصلت السما وإنت لسا نازل!

كان تحت رجليك من زمان وما حسّيت!

مطرقة وطيران! عرض مجاني!

الخلد أقوى منك يا بطل!

الصندوق جعان! وإنت الوجبة!

قلتلك الصندوق مش آمن! ما سمعت!

صندوق بأسنان؟ هاد مش كنز، هاد مطعم!

كل الكنوز ببطن الصندوق... وإنت كمان!

الصندوق قال: بالهنا والشفا!

الضفدع حبّك... بس على طريقته!

لسانه أسرع من إنك تقول يا ضفدع!

وجبة سريعة بدون انتظار!

انبلعت وما رجعت! بالهنا!

كان جعان من الصبح والله!

المصعد قالك: شو بدك ببقيّة الطوابق؟

علّقت بالسقف مثل الثريّا!

اللافتة قالت آمن مية بالمية... كذّابة!

طلّعك المصعد وطلّع روحك معك!

السقف كان واطي... وإنت كنت طويل!
```


---
## B23 — الفخاخ الجديدة: تعليقات   (أولوية 1، 45 سطر)

- **Voice:** `Puck`
- **ملف الحفظ:** `B23_ps.wav`

**Style instructions:**
```
You are a voice actor for a funny cartoon video game. Accent: Palestinian Levantine Arabic. Every line below is shown when the player loses, so perform it as gleeful, cheeky, over-the-top mockery, like laughing at a friend who just failed. Written laughter such as هاهاها / ههههه must be performed as real laughter. Read ONLY the text lines, in order, without any numbering or labels. Leave a clear silence of about 3 seconds after each line before starting the next one.
```

**Text:**
```
يا ساتر! ريحة شاورما بالزنزانة!

النار قالتلك: على مهلك يا زلمة!

صرت فحمة! حدا معه خبز؟

نفّاثة نار؟ كان لازم تلبس مريول مطبخ!

شوّيناك! بالهنا والشفا!

الغيمة قالتلك: ما توقف مكانك!

شعرك وقف! كان لازم تفكّر قبل!

صعقة مجانية! بس ما حدا طلبها!

الغيمة زعلانة منك! كمّل ركض!

برق ورعد وإنت النتيجة!

ديسكو بلا تذكرة! رقصت يا بطل!

كنت بترقص ولا بتنصعق؟ ما بنعرف!

الأرض كلها كهربا يا زلمة!

البلاطة الصفرا كانت تحذير، مش ديكور!

تحت رجليك كهربا! شو كنت متوقع؟

انقسمت نصّين! شو سوّيت يا عيني؟

الليزر ما بيفرّق: نصّك إلك ونصّك للأرض!

الشعاع الأحمر كان مكتوب عليه: لا تلمس!

قطعة من هون وقطعة من هناك!

ليزر دوّار وإنت صرت بازل!

القطار زمّر وإنت ما سمعت!

صرت ورقة رفيعة خالص!

تشو تشو! وانتهت الرحلة!

القطار مش واقف على حدا يا زلمة!

انفرشت عالقضبان مثل الصاج!

الخلد قالك: تفضّل عالقمر!

قبّعتك وصلت السما وإنت لسا نازل!

كان تحت رجليك من زمان وما حسّيت!

مطرقة وطيران! عرض مجاني!

الخلد أقوى منك يا بطل!

الصندوق جعان! وإنت الوجبة!

قلتلك الصندوق مش آمن! ما سمعت!

صندوق بأسنان؟ هاد مش كنز، هاد مطعم!

كل الكنوز ببطن الصندوق... وإنت كمان!

الصندوق قال: بالهنا والشفا!

الضفدع حبّك... بس على طريقته!

لسانه أسرع من إنك تقول يا ضفدع!

وجبة سريعة بدون انتظار!

انبلعت وما رجعت! بالهنا!

كان جعان من الصبح والله!

المصعد قالك: شو بدك ببقيّة الطوابق؟

علّقت بالسقف مثل الثريّا!

اللافتة قالت آمن مية بالمية... كذّابة!

طلّعك المصعد وطلّع روحك معك!

السقف كان واطي... وإنت كنت طويل!
```


---
## H07 — بطل: الروبوت BOT 01 (أردني)   (أولوية 1، 3 سطر)

- **Voice:** `Charon`
- **ملف الحفظ:** `H07_robot.wav`

**Style instructions:**
```
You are the voice of BOT 01, a small clumsy retro robot with a flat monotone computer voice that glitches into panic, deadpan and funny, says beep-boop style status messages, a character in a funny cartoon video game. Accent: Jordanian Arabic (urban Amman), natural Levantine pronunciation. Each line below is a short spoken exclamation by this character: perform it with big comic emotion, fully in character, natural and quick, never reading it flat. Read ONLY the text lines, in order, without any numbering or labels. Leave a clear silence of about 3 seconds after each line before starting the next one.
```

**Text:**
```
عدّيت وما احترقت دارتي

تنبيه: ضحكة مريبة!

رصدت فخ... بس متأخر
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

ما كنت ناوي أركض هيك!

اكتشاف عظيم! عدّيت!

سجّلت الإنجاز بدفتري!

الفطر بيعدّي! هيهي!

شو هالصوت؟ مثير للاهتمام!

يا ساتر! شو هاد؟
```
