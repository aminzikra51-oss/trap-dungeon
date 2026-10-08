# برومبتات الصور

عندك خيارين:
- **خيار 1 (دفعة وحدة):** برومبت واحد لـ36 صورة بشبكة 6×6. يشتغل بشكل ممتاز فقط لو النموذج بيطلّع صورة كبيرة (2K/4K)، وإلا بتطلع الخلايا صغيرة.
- **خيار 2 (الأفضل عملياً):** 4 شبكات 3×3 (كل واحدة 9 صور)، ما بتفرق عليك لأن البرومبت جاهز.

أرفق مع كل برومبت صورة `style_reference.jpg` (ورقة بالصور الخمس الأولى) كمرجع للأسلوب والشخصية.
بعد التوليد نزّل الصور وسمّيها `sheet_all.png` أو `sheet_1.png`..`sheet_4.png` وارفعها هون.

الصور المطلوبة (36):

 1. `card_spike_2` — The explorer sits calmly on a bed of metal floor spikes, spikes poking up through his tunic so he looks like a hedgehog, one eyebrow raised, tiny stars circling his helmet.
 2. `card_pit_1` — The explorer falls into a dark round pit, arms and legs spread wide, mouth open in a huge scream, one boot flying off, his helmet lamp lighting the pit walls.
 3. `card_pit_2` — Only the explorer's hand holding a tiny white flag and the top of his helmet peek out of the edge of a hole in the ground.
 4. `card_arrow_1` — The explorer stands frozen like a pincushion with many cartoon arrows stuck in his helmet and tunic, arrows have colorful feathers, he looks very surprised (no blood).
 5. `card_arrow_2` — A stone wall turret with a smug smirking face shoots a tiny arrow that bonks the explorer's helmet so it spins on his head, stars around.
 6. `card_crush_2` — A huge stone block with a smug face lies on the ground, only the explorer's two boots and two hands stick out from underneath, a puff of dust around it.
 7. `card_boulder_2` — The explorer runs in panic, sweating, with his glasses crooked, while a huge round boulder with a smirking face rolls right behind him almost touching.
 8. `card_saw_1` — A big spinning circular saw blade with a cheeky grin has cut the explorer's helmet cleanly into two halves; the explorer stands frozen in shock, unhurt, sparks flying.
 9. `card_saw_2` — The explorer's tunic has been cut into ridiculous tiny shorts by a saw; he blushes with embarrassment and covers himself with his arms while the saw blade smugly smiles.
10. `card_fakedoor_2` — A flimsy painted cardboard door has collapsed flat, the explorer sits dazed in a cloud of dust behind it in front of a plain brick wall, spirals in his glasses.
11. `card_crumble_1` — The floor tiles crumble beneath the explorer; he hangs in mid-air for a moment like a cartoon character who has not realised yet, legs pedalling, one tiny sweat drop.
12. `card_crumble_2` — The explorer sits dazed in a pile of broken stone tiles with one tile balanced on his head like a hat, dizzy spiral eyes, dust cloud.
13. `card_bait_1` — A huge shiny gold coin hangs on a thin string with a tiny fishing hook; the explorer's eyes have turned into sparkling gold coins and he is drooling, reaching for it.
14. `card_bait_2` — The explorer's hand is stuck in a big clamp trap that was holding a gold coin; two comic fountains of tears shoot out of his eyes, glasses fogged.
15. `card_any_2` — The explorer's transparent soul floats up out of his body making a peace sign, wearing a tiny halo, while his body lies flat on the ground with X-shaped eyes.
16. `card_any_3` — The explorer is flattened like a cartoon pancake on the floor, arms and legs spread out, spiral eyes, stars circling above.
17. `card_any_4` — The explorer's helmet alone sits on the ground with a small flower growing out of it, a tiny cute tombstone with a sad cartoon face beside it (no text on it).
18. `card_any_5` — The explorer with a huge bandage around his head, one arm in a sling and crutches, looking totally bored, glasses cracked.
19. `card_any_6` — The explorer lies relaxed in a small open wooden coffin wearing sunglasses and drinking juice through a straw, giving a thumbs up.
20. `card_any_7` — The explorer is completely burnt black with only his white eyes and glasses visible, smoke rising from the helmet, his hair standing up straight.
21. `card_any_8` — A big cartoon vulture carries the explorer away by his collar; he dangles in the air looking annoyed with arms crossed.
22. `card_any_9` — The explorer sits on the ground crying a huge river of tears from both eyes, forming a puddle around him, glasses completely fogged.
23. `card_any_10` — The explorer is stuck upside-down in the ground, only his legs and boots sticking out and wiggling, a little flower growing between them.
24. `card_streak_1` — The explorer sits tired in front of a stone wall covered with a huge number of scratched tally lines, holding a tiny pencil-like stone, hopeless face.
25. `card_streak_2` — The explorer has set up a tiny bed with a pillow, blanket and nightcap in the middle of the trap room and is sleeping on it, a spike stands next to him like a bedside lamp.
26. `card_streak_3` — A tall wobbling tower made of many identical explorer helmets stacked up; the explorer holds the newest helmet in his hand, exhausted, with dark circles under his eyes.
27. `card_streak_4` — The explorer slumps with a small personal rain cloud right above his head only, raining on him, gloomy face.
28. `card_near_1` — The explorer lies face-down on the floor, one hand stretched toward a glowing exit door that is just a few centimetres away, light shining through the open door.
29. `card_near_2` — The exit door has a mocking face and sticks its tongue out at the explorer, whose fingertips are inches from the door frame; he is stretching with all his strength.
30. `card_quick_1` — A big puff of smoke shaped like the explorer remains on the ground with only his boots left standing, a speed line burst, a tiny stopwatch floating above.
31. `card_quick_2` — A smug trap leans on its elbow and checks an imaginary wristwatch looking bored, while the explorer already lies flat as a pancake on the floor.
32. `card_win_1` — The explorer celebrates on top of a green exit door with both arms in the air, sweating and happy, colorful confetti everywhere.
33. `card_win_2` — The explorer proudly holds a dented golden trophy over his head, while in the background spikes and a saw blade look jealous and angry with tiny eyebrows.
34. `card_win_3` — A row of cute traps (spike, saw, arrow turret, boulder) clap with tiny hands sarcastically while the explorer takes a deep bow.
35. `card_win_4` — The explorer sits on a golden throne wearing his helmet as a crown, holding a gold coin like a scepter, defeated sad spikes lying at his feet.
36. `title_1` — A dungeon entrance made of big stone blocks shaped like a wide grinning mouth, tiny traps peeking out of the dark inside, the small explorer standing at the entrance looking nervous, composition centered so it can be cropped to a wide picture.

---
## خيار 1: كل الصور بدفعة وحدة (6×6)
```
Create ONE image: a clean 6x6 grid sheet (6 columns, 6 rows = 36 cells) of separate, equally sized SQUARE cells.
Separate the cells with straight, solid BLACK grid lines (about 1% of the image width) that run all the way across the sheet, plus a black outer border; keep every drawing inside its own cell and never cross these lines.
Number the cells in your head from left to right, then top to bottom, and fill each cell with exactly the scene below (do not draw the numbers).

STYLE FOR ALL CELLS:
Funny cartoon illustration in a consistent style: thick black outlines, flat bright saturated colors, simple cel shading, exaggerated expressions, playful and slapstick, family friendly (no blood, no gore). MAIN CHARACTER (identical in every cell): a tiny clumsy explorer with HUGE round thick-rimmed glasses, a brown mining helmet with a yellow lamp on the front, a tan tunic, a brown belt with a gold buckle, and big dark boots. Every cell has a plain flat light cream-colored background (no scenery fills the whole cell), one clear centered subject, and NO text, NO letters, NO numbers, NO captions, NO logos anywhere in the image.

CELLS:
Cell 1: The explorer sits calmly on a bed of metal floor spikes, spikes poking up through his tunic so he looks like a hedgehog, one eyebrow raised, tiny stars circling his helmet.
Cell 2: The explorer falls into a dark round pit, arms and legs spread wide, mouth open in a huge scream, one boot flying off, his helmet lamp lighting the pit walls.
Cell 3: Only the explorer's hand holding a tiny white flag and the top of his helmet peek out of the edge of a hole in the ground.
Cell 4: The explorer stands frozen like a pincushion with many cartoon arrows stuck in his helmet and tunic, arrows have colorful feathers, he looks very surprised (no blood).
Cell 5: A stone wall turret with a smug smirking face shoots a tiny arrow that bonks the explorer's helmet so it spins on his head, stars around.
Cell 6: A huge stone block with a smug face lies on the ground, only the explorer's two boots and two hands stick out from underneath, a puff of dust around it.
Cell 7: The explorer runs in panic, sweating, with his glasses crooked, while a huge round boulder with a smirking face rolls right behind him almost touching.
Cell 8: A big spinning circular saw blade with a cheeky grin has cut the explorer's helmet cleanly into two halves; the explorer stands frozen in shock, unhurt, sparks flying.
Cell 9: The explorer's tunic has been cut into ridiculous tiny shorts by a saw; he blushes with embarrassment and covers himself with his arms while the saw blade smugly smiles.
Cell 10: A flimsy painted cardboard door has collapsed flat, the explorer sits dazed in a cloud of dust behind it in front of a plain brick wall, spirals in his glasses.
Cell 11: The floor tiles crumble beneath the explorer; he hangs in mid-air for a moment like a cartoon character who has not realised yet, legs pedalling, one tiny sweat drop.
Cell 12: The explorer sits dazed in a pile of broken stone tiles with one tile balanced on his head like a hat, dizzy spiral eyes, dust cloud.
Cell 13: A huge shiny gold coin hangs on a thin string with a tiny fishing hook; the explorer's eyes have turned into sparkling gold coins and he is drooling, reaching for it.
Cell 14: The explorer's hand is stuck in a big clamp trap that was holding a gold coin; two comic fountains of tears shoot out of his eyes, glasses fogged.
Cell 15: The explorer's transparent soul floats up out of his body making a peace sign, wearing a tiny halo, while his body lies flat on the ground with X-shaped eyes.
Cell 16: The explorer is flattened like a cartoon pancake on the floor, arms and legs spread out, spiral eyes, stars circling above.
Cell 17: The explorer's helmet alone sits on the ground with a small flower growing out of it, a tiny cute tombstone with a sad cartoon face beside it (no text on it).
Cell 18: The explorer with a huge bandage around his head, one arm in a sling and crutches, looking totally bored, glasses cracked.
Cell 19: The explorer lies relaxed in a small open wooden coffin wearing sunglasses and drinking juice through a straw, giving a thumbs up.
Cell 20: The explorer is completely burnt black with only his white eyes and glasses visible, smoke rising from the helmet, his hair standing up straight.
Cell 21: A big cartoon vulture carries the explorer away by his collar; he dangles in the air looking annoyed with arms crossed.
Cell 22: The explorer sits on the ground crying a huge river of tears from both eyes, forming a puddle around him, glasses completely fogged.
Cell 23: The explorer is stuck upside-down in the ground, only his legs and boots sticking out and wiggling, a little flower growing between them.
Cell 24: The explorer sits tired in front of a stone wall covered with a huge number of scratched tally lines, holding a tiny pencil-like stone, hopeless face.
Cell 25: The explorer has set up a tiny bed with a pillow, blanket and nightcap in the middle of the trap room and is sleeping on it, a spike stands next to him like a bedside lamp.
Cell 26: A tall wobbling tower made of many identical explorer helmets stacked up; the explorer holds the newest helmet in his hand, exhausted, with dark circles under his eyes.
Cell 27: The explorer slumps with a small personal rain cloud right above his head only, raining on him, gloomy face.
Cell 28: The explorer lies face-down on the floor, one hand stretched toward a glowing exit door that is just a few centimetres away, light shining through the open door.
Cell 29: The exit door has a mocking face and sticks its tongue out at the explorer, whose fingertips are inches from the door frame; he is stretching with all his strength.
Cell 30: A big puff of smoke shaped like the explorer remains on the ground with only his boots left standing, a speed line burst, a tiny stopwatch floating above.
Cell 31: A smug trap leans on its elbow and checks an imaginary wristwatch looking bored, while the explorer already lies flat as a pancake on the floor.
Cell 32: The explorer celebrates on top of a green exit door with both arms in the air, sweating and happy, colorful confetti everywhere.
Cell 33: The explorer proudly holds a dented golden trophy over his head, while in the background spikes and a saw blade look jealous and angry with tiny eyebrows.
Cell 34: A row of cute traps (spike, saw, arrow turret, boulder) clap with tiny hands sarcastically while the explorer takes a deep bow.
Cell 35: The explorer sits on a golden throne wearing his helmet as a crown, holding a gold coin like a scepter, defeated sad spikes lying at his feet.
Cell 36: A dungeon entrance made of big stone blocks shaped like a wide grinning mouth, tiny traps peeking out of the dark inside, the small explorer standing at the entrance looking nervous, composition centered so it can be cropped to a wide picture.

Reference image (if attached): follow only its drawing style and the explorer character design, not its composition.
```


---
## خيار 2 — شبكة 1 من 4 (الخلايا 1-9)
```
Create ONE image: a clean 3x3 grid sheet (3 columns, 3 rows = 9 cells) of separate, equally sized SQUARE cells.
Separate the cells with straight, solid BLACK grid lines (about 1% of the image width) that run all the way across the sheet, plus a black outer border; keep every drawing inside its own cell and never cross these lines.
Number the cells in your head from left to right, then top to bottom, and fill each cell with exactly the scene below (do not draw the numbers).

STYLE FOR ALL CELLS:
Funny cartoon illustration in a consistent style: thick black outlines, flat bright saturated colors, simple cel shading, exaggerated expressions, playful and slapstick, family friendly (no blood, no gore). MAIN CHARACTER (identical in every cell): a tiny clumsy explorer with HUGE round thick-rimmed glasses, a brown mining helmet with a yellow lamp on the front, a tan tunic, a brown belt with a gold buckle, and big dark boots. Every cell has a plain flat light cream-colored background (no scenery fills the whole cell), one clear centered subject, and NO text, NO letters, NO numbers, NO captions, NO logos anywhere in the image.

CELLS:
Cell 1: The explorer sits calmly on a bed of metal floor spikes, spikes poking up through his tunic so he looks like a hedgehog, one eyebrow raised, tiny stars circling his helmet.
Cell 2: The explorer falls into a dark round pit, arms and legs spread wide, mouth open in a huge scream, one boot flying off, his helmet lamp lighting the pit walls.
Cell 3: Only the explorer's hand holding a tiny white flag and the top of his helmet peek out of the edge of a hole in the ground.
Cell 4: The explorer stands frozen like a pincushion with many cartoon arrows stuck in his helmet and tunic, arrows have colorful feathers, he looks very surprised (no blood).
Cell 5: A stone wall turret with a smug smirking face shoots a tiny arrow that bonks the explorer's helmet so it spins on his head, stars around.
Cell 6: A huge stone block with a smug face lies on the ground, only the explorer's two boots and two hands stick out from underneath, a puff of dust around it.
Cell 7: The explorer runs in panic, sweating, with his glasses crooked, while a huge round boulder with a smirking face rolls right behind him almost touching.
Cell 8: A big spinning circular saw blade with a cheeky grin has cut the explorer's helmet cleanly into two halves; the explorer stands frozen in shock, unhurt, sparks flying.
Cell 9: The explorer's tunic has been cut into ridiculous tiny shorts by a saw; he blushes with embarrassment and covers himself with his arms while the saw blade smugly smiles.

Reference image (if attached): follow only its drawing style and the explorer character design, not its composition.
```


---
## خيار 2 — شبكة 2 من 4 (الخلايا 10-18)
```
Create ONE image: a clean 3x3 grid sheet (3 columns, 3 rows = 9 cells) of separate, equally sized SQUARE cells.
Separate the cells with straight, solid BLACK grid lines (about 1% of the image width) that run all the way across the sheet, plus a black outer border; keep every drawing inside its own cell and never cross these lines.
Number the cells in your head from left to right, then top to bottom, and fill each cell with exactly the scene below (do not draw the numbers).

STYLE FOR ALL CELLS:
Funny cartoon illustration in a consistent style: thick black outlines, flat bright saturated colors, simple cel shading, exaggerated expressions, playful and slapstick, family friendly (no blood, no gore). MAIN CHARACTER (identical in every cell): a tiny clumsy explorer with HUGE round thick-rimmed glasses, a brown mining helmet with a yellow lamp on the front, a tan tunic, a brown belt with a gold buckle, and big dark boots. Every cell has a plain flat light cream-colored background (no scenery fills the whole cell), one clear centered subject, and NO text, NO letters, NO numbers, NO captions, NO logos anywhere in the image.

CELLS:
Cell 1: A flimsy painted cardboard door has collapsed flat, the explorer sits dazed in a cloud of dust behind it in front of a plain brick wall, spirals in his glasses.
Cell 2: The floor tiles crumble beneath the explorer; he hangs in mid-air for a moment like a cartoon character who has not realised yet, legs pedalling, one tiny sweat drop.
Cell 3: The explorer sits dazed in a pile of broken stone tiles with one tile balanced on his head like a hat, dizzy spiral eyes, dust cloud.
Cell 4: A huge shiny gold coin hangs on a thin string with a tiny fishing hook; the explorer's eyes have turned into sparkling gold coins and he is drooling, reaching for it.
Cell 5: The explorer's hand is stuck in a big clamp trap that was holding a gold coin; two comic fountains of tears shoot out of his eyes, glasses fogged.
Cell 6: The explorer's transparent soul floats up out of his body making a peace sign, wearing a tiny halo, while his body lies flat on the ground with X-shaped eyes.
Cell 7: The explorer is flattened like a cartoon pancake on the floor, arms and legs spread out, spiral eyes, stars circling above.
Cell 8: The explorer's helmet alone sits on the ground with a small flower growing out of it, a tiny cute tombstone with a sad cartoon face beside it (no text on it).
Cell 9: The explorer with a huge bandage around his head, one arm in a sling and crutches, looking totally bored, glasses cracked.

Reference image (if attached): follow only its drawing style and the explorer character design, not its composition.
```


---
## خيار 2 — شبكة 3 من 4 (الخلايا 19-27)
```
Create ONE image: a clean 3x3 grid sheet (3 columns, 3 rows = 9 cells) of separate, equally sized SQUARE cells.
Separate the cells with straight, solid BLACK grid lines (about 1% of the image width) that run all the way across the sheet, plus a black outer border; keep every drawing inside its own cell and never cross these lines.
Number the cells in your head from left to right, then top to bottom, and fill each cell with exactly the scene below (do not draw the numbers).

STYLE FOR ALL CELLS:
Funny cartoon illustration in a consistent style: thick black outlines, flat bright saturated colors, simple cel shading, exaggerated expressions, playful and slapstick, family friendly (no blood, no gore). MAIN CHARACTER (identical in every cell): a tiny clumsy explorer with HUGE round thick-rimmed glasses, a brown mining helmet with a yellow lamp on the front, a tan tunic, a brown belt with a gold buckle, and big dark boots. Every cell has a plain flat light cream-colored background (no scenery fills the whole cell), one clear centered subject, and NO text, NO letters, NO numbers, NO captions, NO logos anywhere in the image.

CELLS:
Cell 1: The explorer lies relaxed in a small open wooden coffin wearing sunglasses and drinking juice through a straw, giving a thumbs up.
Cell 2: The explorer is completely burnt black with only his white eyes and glasses visible, smoke rising from the helmet, his hair standing up straight.
Cell 3: A big cartoon vulture carries the explorer away by his collar; he dangles in the air looking annoyed with arms crossed.
Cell 4: The explorer sits on the ground crying a huge river of tears from both eyes, forming a puddle around him, glasses completely fogged.
Cell 5: The explorer is stuck upside-down in the ground, only his legs and boots sticking out and wiggling, a little flower growing between them.
Cell 6: The explorer sits tired in front of a stone wall covered with a huge number of scratched tally lines, holding a tiny pencil-like stone, hopeless face.
Cell 7: The explorer has set up a tiny bed with a pillow, blanket and nightcap in the middle of the trap room and is sleeping on it, a spike stands next to him like a bedside lamp.
Cell 8: A tall wobbling tower made of many identical explorer helmets stacked up; the explorer holds the newest helmet in his hand, exhausted, with dark circles under his eyes.
Cell 9: The explorer slumps with a small personal rain cloud right above his head only, raining on him, gloomy face.

Reference image (if attached): follow only its drawing style and the explorer character design, not its composition.
```


---
## خيار 2 — شبكة 4 من 4 (الخلايا 28-36)
```
Create ONE image: a clean 3x3 grid sheet (3 columns, 3 rows = 9 cells) of separate, equally sized SQUARE cells.
Separate the cells with straight, solid BLACK grid lines (about 1% of the image width) that run all the way across the sheet, plus a black outer border; keep every drawing inside its own cell and never cross these lines.
Number the cells in your head from left to right, then top to bottom, and fill each cell with exactly the scene below (do not draw the numbers).

STYLE FOR ALL CELLS:
Funny cartoon illustration in a consistent style: thick black outlines, flat bright saturated colors, simple cel shading, exaggerated expressions, playful and slapstick, family friendly (no blood, no gore). MAIN CHARACTER (identical in every cell): a tiny clumsy explorer with HUGE round thick-rimmed glasses, a brown mining helmet with a yellow lamp on the front, a tan tunic, a brown belt with a gold buckle, and big dark boots. Every cell has a plain flat light cream-colored background (no scenery fills the whole cell), one clear centered subject, and NO text, NO letters, NO numbers, NO captions, NO logos anywhere in the image.

CELLS:
Cell 1: The explorer lies face-down on the floor, one hand stretched toward a glowing exit door that is just a few centimetres away, light shining through the open door.
Cell 2: The exit door has a mocking face and sticks its tongue out at the explorer, whose fingertips are inches from the door frame; he is stretching with all his strength.
Cell 3: A big puff of smoke shaped like the explorer remains on the ground with only his boots left standing, a speed line burst, a tiny stopwatch floating above.
Cell 4: A smug trap leans on its elbow and checks an imaginary wristwatch looking bored, while the explorer already lies flat as a pancake on the floor.
Cell 5: The explorer celebrates on top of a green exit door with both arms in the air, sweating and happy, colorful confetti everywhere.
Cell 6: The explorer proudly holds a dented golden trophy over his head, while in the background spikes and a saw blade look jealous and angry with tiny eyebrows.
Cell 7: A row of cute traps (spike, saw, arrow turret, boulder) clap with tiny hands sarcastically while the explorer takes a deep bow.
Cell 8: The explorer sits on a golden throne wearing his helmet as a crown, holding a gold coin like a scepter, defeated sad spikes lying at his feet.
Cell 9: A dungeon entrance made of big stone blocks shaped like a wide grinning mouth, tiny traps peeking out of the dark inside, the small explorer standing at the entrance looking nervous, composition centered so it can be cropped to a wide picture.

Reference image (if attached): follow only its drawing style and the explorer character design, not its composition.
```
