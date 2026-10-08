# سكربت الأصوات لـ Google AI Studio

**114 سطر في 8 دفعات.**

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
## B03 — أردني: شماتة (سطر واحد)   (أولوية 1، 1 سطر)

- **Voice:** `Algieba`
- **ملف الحفظ:** `B03_ps.wav`

**Style instructions:**
```
You are a voice actor for a funny cartoon video game. Accent: Jordanian Arabic (urban Amman), natural Levantine pronunciation. Every line below is shown when the player loses, so perform it as gleeful, cheeky, over-the-top mockery, like laughing at a friend who just failed. Written laughter such as هاهاها / ههههه must be performed as real laughter. Read ONLY the text lines, in order, without any numbering or labels. Leave a clear silence of about 3 seconds after each line before starting the next one.
```

**Text:**
```
ههههه! ابتسم يا حبيبي، الكاميرا عليك وإنت ميت!
```


---
## H01 — بطل: فلافل المسكين (أردني)   (أولوية 1، 15 سطر)

- **Voice:** `Puck`
- **ملف الحفظ:** `H01_falafel.wav`

**Style instructions:**
```
You are the voice of a tiny sad falafel ball wearing a miner's helmet, whiny, pitiful, always about to cry but funny, a character in a funny cartoon video game. Accent: Jordanian Arabic (urban Amman), natural Levantine pronunciation. Each line below is a short spoken exclamation by this character: perform it with big comic emotion, fully in character, natural and quick, never reading it flat. Read ONLY the text lines, in order, without any numbering or labels. Leave a clear silence of about 3 seconds after each line before starting the next one.
```

**Text:**
```
أهلا يا فلافل... يا مسكين!

أنا فلافل! ما بدي أموت!

يلا يا فلافل، عالمصيبة!

متّ يا عمي! متّ!

آخ يا ظهري، يا فلافل!

ليش أنا؟ ليش دايماً أنا؟

قلتلكم الأرض مش آمنة!

هربان يا فلافل! هربان!

الحقوني! بدي أهرب!

ما بدي أنقتل! لأ لأ لأ!

عدّيتها يا زلمة! إي والله!

نجوت! أنا فلافل الخارق!

يا ساتر! عدّيت!

إيش هالضحكة؟!

يا ويلي شو هاد؟
```


---
## H02 — بطل: العم بالبيجاما (أردني)   (أولوية 1، 15 سطر)

- **Voice:** `Algenib`
- **ملف الحفظ:** `H02_uncle.wav`

**Style instructions:**
```
You are the voice of a grumpy sleepy middle-aged uncle in pyjamas, gravelly voice, always complaining, secretly lovable, a character in a funny cartoon video game. Accent: Jordanian Arabic (urban Amman), natural Levantine pronunciation. Each line below is a short spoken exclamation by this character: perform it with big comic emotion, fully in character, natural and quick, never reading it flat. Read ONLY the text lines, in order, without any numbering or labels. Leave a clear silence of about 3 seconds after each line before starting the next one.
```

**Text:**
```
أهلين يا عمّو، أنا نعسان!

جيت بالبيجاما، شو بدك؟

يلا يا عمو، بدي أنام بعدين!

متّ يا عمي! حرام عليكم!

آخ ظهري! ظهري يا ولاد!

مين حطّ هالفخ يا ناس؟

ولا مرة بنام بسلام!

هربان يا عمو! هربان!

يلا يا بيجاما، اركض!

ركبي يا ركبي، لا تخونّي!

عدّيت، وبدي أنام هسا!

خلص؟ تصبحوا على خير!

بيجاماتي نجت! الحمد لله!

شو هاد؟ مين هناك؟

لا لا لا لا لا!
```


---
## H03 — بطل: الفرخة بالنظارة (أردني)   (أولوية 1، 15 سطر)

- **Voice:** `Leda`
- **ملف الحفظ:** `H03_chicken.wav`

**Style instructions:**
```
You are the voice of a fussy bookish hen with big glasses, dramatic diva, clucks when excited, a character in a funny cartoon video game. Accent: Jordanian Arabic (urban Amman), natural Levantine pronunciation. Each line below is a short spoken exclamation by this character: perform it with big comic emotion, fully in character, natural and quick, never reading it flat. Read ONLY the text lines, in order, without any numbering or labels. Leave a clear silence of about 3 seconds after each line before starting the next one.
```

**Text:**
```
أهلاً يا فرخة! قوقوقو!

فرخة مثقفة وبنظّارة!

يلا يا فرخة، على الفخاخ!

قوقو! متّ يا ناس!

ياااه! نظّارتي!

أنا فرخة محترمة يا عالم!

كان لازم أضل بالقن!

اركضي يا فرخة، اركضي!

قوق قوق قوق! الحقوني!

هربانة يا ناس، هربانة!

عدّيت يا ولاد! قوقوقو!

الفرخة نجحت! شوفوا!

طلعت أشطر من الديك!

شو هاد؟ هاد فخ ولا شو؟

يا ويلي! شوفوا!
```


---
## H04 — بطل: الجدّة الغاضبة (أردني)   (أولوية 1، 15 سطر)

- **Voice:** `Gacrux`
- **ملف الحفظ:** `H04_grandma.wav`

**Style instructions:**
```
You are the voice of an angry old grandmother, scolding, dramatic, shouting at the traps like they are naughty grandchildren, a character in a funny cartoon video game. Accent: Jordanian Arabic (urban Amman), natural Levantine pronunciation. Each line below is a short spoken exclamation by this character: perform it with big comic emotion, fully in character, natural and quick, never reading it flat. Read ONLY the text lines, in order, without any numbering or labels. Leave a clear silence of about 3 seconds after each line before starting the next one.
```

**Text:**
```
أهلين! أنا تيتا، وغاضبة!

ولا كلمة! تيتا هون!

يلا يا تيتا، فشّي خلقك!

الله يسامحكم يا ولاد!

آخ يا ركبتي! يا ركبتي!

بأيامنا ما كان في فخاخ!

متّ يا ستّي! متّ!

اركضي يا تيتا! لا تقفي!

تفو عالفخاخ! ركض ركض!

ما بلحقوني! أنا أسرع منهم!

عدّيت يا ولاد! شفتوا؟

هيك الستّات بتنجح!

حطّولي عالغدا!

ولك! شو هاد؟

بس! لا تعمل هيك!
```


---
## H05 — بطل: القط الكسلان (أردني)   (أولوية 1، 15 سطر)

- **Voice:** `Umbriel`
- **ملف الحفظ:** `H05_cat.wav`

**Style instructions:**
```
You are the voice of a very lazy cat, slow sleepy drawn-out voice, yawns, meows now and then, easy-going, a character in a funny cartoon video game. Accent: Jordanian Arabic (urban Amman), natural Levantine pronunciation. Each line below is a short spoken exclamation by this character: perform it with big comic emotion, fully in character, natural and quick, never reading it flat. Read ONLY the text lines, in order, without any numbering or labels. Leave a clear silence of about 3 seconds after each line before starting the next one.
```

**Text:**
```
مياو... أهلا يا قطة

ما بدي أتحرك... بس طيب

يلا يا قطة، بعد خمس دقايق

مياااو! متّ... أوف

مشوار تعبان! بدي أنام

باقي لي ثمان أرواح، عادي

أوف... مين نيّم الأرض؟

هربان يا قطة! هربان!

ما بحب الركض... بس اركض!

مياو مياو! بسرعة!

خلصت؟ خلص... بدي أنام

عدّيت... هسا قيلولة

مياو! عبرت وما تعبت

شو هاد؟ مياو؟

ما شفت شي... أنا نايم
```


---
## H06 — بطل: الحمار الكوول (أردني)   (أولوية 1، 15 سطر)

- **Voice:** `Iapetus`
- **ملف الحفظ:** `H06_donkey.wav`

**Style instructions:**
```
You are the voice of a super cool donkey wearing sunglasses, laid-back, chill, says hee-haw when excited, a character in a funny cartoon video game. Accent: Jordanian Arabic (urban Amman), natural Levantine pronunciation. Each line below is a short spoken exclamation by this character: perform it with big comic emotion, fully in character, natural and quick, never reading it flat. Read ONLY the text lines, in order, without any numbering or labels. Leave a clear silence of about 3 seconds after each line before starting the next one.
```

**Text:**
```
أهلاً يا حمار... كوول!

هي هاو! أنا الحمار الكوول!

يلا يا زلمة، رايق أنا

هي هااو! متّ يا زلمة!

هاد مش كوول أبداً!

نظّارتي! حدا شاف نظّارتي؟

فخ؟ على الحمار الكوول؟!

اركض يا حمار! مش وقت فرجة!

يا زلمة بسرعة! هيهو هيهو!

كوول بس هربان!

قلتلكم كوول! هيهو!

عدّيتها ببرود يا زلمة!

الحمار عدّاها! هي هاو!

شو هاد يا زلمة؟

أنا مش خايف... شوي
```


---
## K01 — الزعيم: الملك فخ (أردني، صوت عميق)   (أولوية 1، 23 سطر)

- **Voice:** `Orus`
- **ملف الحفظ:** `K01_boss.wav`

**Style instructions:**
```
You are the voice of the Trap King, the big arrogant boss of a funny cartoon dungeon game: a deep booming theatrical villain voice, Jordanian Arabic accent (urban Amman), pompous and gloating, never truly scary: the mockery is cartoonish. When the king is hurt or defeated, perform comic pain and outrage. Read ONLY the text lines, in order, without any numbering or labels. Leave a clear silence of about 3 seconds after each line before starting the next one.
```

**Text:**
```
أهلاً بالضحية الجديدة!

أنا الملك فخ! اركع!

غرفتي، قوانيني، موتك!

آخ! مين علّمك تدعس؟!

زر؟! مين حطّ هالزر؟!

ما هيك الاتفاق يا ولد!

ظهري! كسّرت لي ظهري!

حسابك معي بعدين!

هههه! بطلنا طار!

قلتلك أنا الملك!

ارجع جرّب، بضحك أكتر

الفخ الملكي ما بيغلط

سجّلت نقطة، وإنت صفر

هسا بلّش الجد!

كنت بمزح معك!

مستحيل! أنا الملك!

كيف؟! بزر؟! بزر!!

بتندم... بعد تسع مراحل

روح، بس إخوتي أصعب!

المرحلة الجاية بتبكّيك!

لا تتأخر... مش حلو

أنا بستنى... هههه

يلا ازعل شوي
```
