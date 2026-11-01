> **قديم / OBSOLETE:** الأبطال صار لكل واحد 5 صور مراحل جاهزة (`assets/hero/<id>_s1..s5.webp`، من `tools/make_stages.py`). هالملف بس مرجع لبرومبتات `_f2/_f3` القديمة وللتوسّع المستقبلي (مسارات تطوّر إضافية).

# Hero evolution pictures (forms II and III)

The game already works WITHOUT these: until a picture exists, a form is drawn in code (colour boost, glow, rim light, sparkles, halo at stage V).
A picture replaces the code-made look as soon as the file exists — no code change.

Stages → forms: I–II = base picture, III–IV = form II (`<id>_f2`), V = form III (`<id>_f3`).

## Workflow
1. Generate each prompt below (FLUX / any generator), same plain light-grey background, full body, front view, centred.
2. Save as `raw/heroes/<id>_f2.jpg` and `raw/heroes/<id>_f3.jpg` (e.g. `raw/heroes/falafel_f2.jpg`).
3. `python3 tools/make_heroes.py falafel_f2 falafel_f3` (cut-out → `assets/hero/falafel_f2.webp` + meta.json entry, 224 px tall).
4. `python3 build.py`. Check in the shop (upgrade tab) and in a level with `stage falafel 3` / `stage falafel 5` in the admin console.
5. Accessories are placed by ratios of the sprite box (`ACC_PL`); keep the silhouette close to the base picture (same head position, same size) so the hats / necklaces / backs still fit.

Common tail for every prompt: `front view, full body standing, cute stylized 3D clay render, soft plasticine, chunky rounded shapes, soft studio lighting, centered, isolated on a plain flat solid pure light grey background, no ground, no cast shadow, no text, game asset`

## falafel (test this one first)
- **f2**: a round fuzzy brown falafel ball character with big white eyes with black pupils, pink cheeks, thin brown stick legs, orange shoes, glossy yellow miner hard hat with a headlamp, golden crispy texture, small shiny steel shoulder pads, a brown leather satchel across the chest, determined eyebrows, confident small smile, + common tail
- **f3**: a round fuzzy golden-brown falafel ball hero with big white glowing eyes, pink cheeks, thin stick legs with golden boots, a glossy golden miner hard hat with a bright headlamp and tiny wings on the sides, a short red cape, glowing golden aura sparks around the body, heroic proud expression, + common tail

## uncle (pajama uncle with a moustache)
- **f2**: a stocky cartoon uncle with black slicked hair and a thick black moustache, striped pajamas, fluffy slippers, now wearing a steel breastplate over the pajamas and a small round shield on one arm, brave expression, + common tail
- **f3**: the same stocky uncle with moustache, golden royal armor over striped pajamas, a glowing blue energy shield on the arm, a long royal-blue cape, golden laurel on his hair, glowing eyes, majestic pose, + common tail

## chicken (white chicken with sunglasses and a hard hat)
- **f2**: a fluffy white chicken with black sunglasses, orange beak and legs, yellow miner hard hat with a headlamp, small steel wing guards, a red scarf, proud posture, + common tail
- **f3**: a majestic fluffy white-golden chicken with black sunglasses, yellow hard hat with a glowing lamp, large golden feathered wings spread slightly, glowing golden tail feathers, heroic posture, + common tail

## cat (orange cat with a hard hat)
- **f2**: a cute orange tabby cat standing on two legs, big green eyes, yellow miner hard hat with a headlamp, a small purple wizard cape, a tiny glowing amulet on the chest, agile pose, + common tail
- **f3**: a cute orange cat hero with glowing green eyes, yellow hard hat with a bright headlamp, flowing purple-and-gold cape, two swirling magic tails, golden paws, stars floating around, + common tail

## grandma (grandma with a wooden spoon)
- **f2**: a sweet grandma with a white headscarf, round black glasses, flowery dress, holding a big wooden spoon, now with a small steel pot as a helmet on the headscarf and an apron with a gold embroidered edge, warrior expression, + common tail
- **f3**: a majestic grandma with white headscarf and round glasses, flowery dress with a golden apron and a flowing royal cape, holding a huge glowing golden wooden spoon like a scepter, sparkles around, + common tail

## donkey (grey donkey with a hard hat)
- **f2**: a cute grey donkey standing on two legs, big dark eyes, long ears, yellow miner hard hat with a headlamp, leather straps with metal studs across the chest, steel hoof guards, determined look, + common tail
- **f3**: a heroic grey donkey with glowing eyes, long ears, golden hard hat with a bright headlamp, golden armor plates and a flowing red cape, glowing golden hooves with speed-streak sparks, + common tail

## robot (dark blue robot with a square head and one lens eye)
- **f2**: a boxy dark blue robot with a square head and a single large glowing lens eye, orange shoulder joints, now with extra silver armor plates, small thruster fins on the back and glowing cyan lines on the body, + common tail
- **f3**: an advanced dark blue and gold robot with a square head and a bright glowing lens eye, golden armor plates, large glowing cyan jet wings on the back, energy halo ring above the head, + common tail

## mushroom (child with a pink mushroom cap)
- **f2**: a small child with a big pink spotted mushroom cap on his head, teal tunic, brown belt and boots, now with a green leaf cloak and glowing blue spores floating around, calm wise smile, + common tail
- **f3**: a small child sage with a large glowing pink and gold mushroom cap with luminous spots, teal tunic with golden trim, a long magical leaf cape, glowing spores and tiny stars around, serene expression, + common tail
