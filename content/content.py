#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
مصدر كل محتوى الأصوات والصور. شغّله:  python3 content/content.py
ويولّد:
  assets/voices.json            مانيفست اللعبة (نص + نوع + لهجة + دفعة)
  content/voice_batches.json    الدفعات (للصفحة وللقاص)
  content/voice_script.md       سكربت الأصوات للصقه في AI Studio
  content/images.json           قائمة الصور (مفتاح + وصف)
  content/image_prompts.md      برومبتات الصور
  content/generation-kit.html   صفحة نسخ-ولصق لكل شيء
"""
import json, os, html, textwrap
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ------------------------------------------------------------------ اللهجات
DIA = {
 'sy':   dict(ar='سوري',   en='Levantine Syrian (Damascus) accent'),
 'lb':   dict(ar='لبناني', en='Lebanese accent'),
 'ps':   dict(ar='فلسطيني',en='Palestinian Levantine accent'),
 'eg':   dict(ar='مصري',   en='Egyptian Cairo accent'),
 'gulf': dict(ar='خليجي',  en='Gulf Khaleeji accent'),
 'iq':   dict(ar='عراقي',  en='Iraqi Baghdadi accent'),
 'ma':   dict(ar='مغربي',  en='Moroccan Darija accent'),
}
CAUSES = ['spike','pit','arrow','crush','boulder','saw','fakedoor','crumble','bait','monster','ball','ghost','wall']
ORDER  = ['taunt'] + ['c_'+c for c in CAUSES] + ['streak','quick','near','win']

# ------------------------------------------------------------------ سطور اللهجات
# لكل لهجة: {نوع: [سطور]}
D = {}

D['sy'] = {
 'taunt': [
  'هاهاها! شفت كيف؟ الفخ ما سلّم عليك بس، حضنك كمان!',
  'يا زلمة! أنا لو كنت مكانك كنت استحيت عن حالي!',
  'هههه! شو هاد؟ هاي حركة ولا مصيبة؟',
  'إي والله برافو! كل مرة بتموت بطريقة أحلى من اللي قبلها!',
  'هاهاها! خليك هون، الفخ لسا مشتاق لك!',
  'ما في حدا بيموت متل ما بتموت إنت، فنّان والله!',
  'هههه! قوم لا تعمل حالك ميت، إنت ميت فعلاً!',
  'يا ويلي عليك! حتى الأرض ضحكت!',
 ],
 'c_spike':   ['هاهاها! الشوك كان واقف ينطرك من الصبح، وإنت إجيت برجليك!'],
 'c_pit':     ['هههه! الحفرة كانت قدامك يا زلمة! بدك لافتة كمان؟'],
 'c_arrow':   ['هههه! السهم ما غلط، إنت اللي وقفت بمكانه!'],
 'c_crush':   ['هههه! الحجر قال لك: تعال نتعرّف، وسوّاك فطيرة!'],
 'c_boulder': ['هاهاها! جريت قدّام الصخرة؟ هي أسرع منك يا بطل!'],
 'c_saw':     ['هاهاها! المنشار بدّه يعملك حلاقة ببلاش!'],
 'c_fakedoor':['هههه! الباب كان مزيّف يا عبقري! حتى الباب كذب عليك!'],
 'c_crumble': ['هاهاها! الأرض انهارت؟ ولا إنت اللي تقيل؟'],
 'c_bait':    ['هههه! عيونك عالفلوس وراحت روحك! هاد الطمع يا حبيبي!'],
 'streak': [
  'هاهاها! هاي المرحلة صارت صديقتك المقرّبة! كم مرة بقى؟',
  'يا زلمة، كم مرة بدك تموت هون؟ حتى الفخاخ بلّشت تحفظ اسمك!',
  'هههه! عالأقل عم تتعلّم... ولا لأ؟ لأ.',
 ],
 'quick': [
  'هاهاها! حتى ما سخّنت! مات بثانيتين!',
  'هههه! أسرع موتة بتاريخ الزنزانة، مبروك!',
 ],
 'near': [
  'آخ! كنت قريب كتير! بس القريب ما بيكفي يا حبيبي!',
  'هههه! على بعد خطوتين من الباب، وطلعت ميت!',
 ],
 'win': [
  'ولك شو هاد؟ عبر؟ أكيد في غلطة بالنظام!',
  'برافو! بس لا تفرح كتير، المرحلة الجاية أنذل!',
 ],
}

D['lb'] = {
 'taunt': [
  'هاهاها! يا ساتر! شو هيدي الموتة؟ بدنا نعملّك فيلم!',
  'ولاا! حتى الفخ ما صدّق قدّيش كانت سهلة!',
  'هههه! حبيبي، ما في عيب إنك تموت، العيب إنك تعيدها!',
  'يخرب بيتك! عم تموت بأسلوب! وقّف فينا نصفّق!',
  'هاهاها! بدك نعطيك دقيقة صمت، ولا بتفضّل الضحك؟',
  'يا عيني عليك، مين قلّك إنك بطل؟',
  'هههه! الفخ مبسوط فيك كتير، عم يقلّك: زورنا كل يوم!',
  'يا حرام! مات! قدّيش قلبي حزين... لا لا، عم بمزح! هاهاها!',
  'هههه! ولا يهمك، الموت بيجي مرة وحدة... إنت عم تجيبها عشرين مرة!',
  'يا عيب الشوم! حتى الفخ استحى منك!',
  'هاهاها! خود نفس، الفخ لسا ما خلّص ضحك!',
  'ولاا! شو هيدا الأداء؟ بدك علامة؟ صفر!',
  'هههه! قوم يا بطل، الأرض مش مخدّة!',
  'يخرب بيتك! عم تموت بإتقان!',
  'هاهاها! لو في جايزة للموت، كنت أخدتها وبنص!',
  'هههه! بدك نكتب عا قبرك: جرّب وفشل؟',
  'يا حبيبي ركّز! الفخ ما رح يتعب منك!',
  'هيهيهي! حتى ستّي بتعدّي من هون وهي عم تفتل كبّة!',
  'هههه! عم تشتغل عند الفخاخ بالسخرة؟ كم أجرتك؟',
  'هاهاها! قول يا رب! لا، قول يا رب مرتين... بالهوا!',
  'ههههه! صرلك ميت أكتر ما إنت عايش! حدا عمل إحصائية؟',
 ],
 'c_spike': [
  'هههه! الشوك استقبلك بالأحضان، يا ساتر!',
  'هاهاها! صرت سيخ شاورما! بدنا توم وخبز!',
  'يخرب بيتك! الشوك كان ماشي بسلام وإنت جيت عليه!',
  'هههه! طلع ما كان دعسة، طلع مساج بالإبر!',
 ],
 'c_pit': [
  'ولاا! الحفرة كانت قدّامك! شو، عم تدوّر على كنز تحت الأرض؟',
  'هاهاها! الجاذبية ربحت! الجاذبية دايماً بتربح!',
  'يا ساتر! نزلت أسرع من المصعد!',
  'ههههه! الحفرة قالتلك أهلين، وإنت قلتلها: تحياتي من فوق!',
 ],
 'c_arrow': [
  'هاهاها! السهم قال: أنا جاي! وإنت قلتلو: تفضّل!',
  'هههه! السهم ما غلط، إنت اللي وقفت بمطرحو!',
  'ولاا! صاروا يبعتولك بالبريد السريع... بالسهم!',
  'هاهاها! السهم عندو عنوانك ومحفوظ عن ظهر قلب!',
 ],
 'c_crush': [
  'يخرب بيتك! الحجر نزل عليك متل الفطيرة! هاهاها!',
  'هههه! الفرن مبسوط! جاهزة المناقيش!',
  'ولاا! صرت أرقّ من خبز الصاج!',
  'هاهاها! الحجر قلّك: تعا نتعرّف... وسوّاك سجّادة!',
 ],
 'c_boulder': [
  'هههه! الصخرة لحقتك! جريت منيح بس هيدي أسرع!',
  'هاهاها! جريت قدّام الصخرة؟ هيدي رياضية أكتر منك!',
  'ولاا! الصخرة دعستك دعس! ما خلّتلك لا خبر ولا أثر!',
 ],
 'c_saw': [
  'هاهاها! المنشار قال: بدّي ياك! وإنت ما قدرت تهرب!',
  'يا ساتر! المنشار فتّك فتّ! بدنا نعملك كبّة!',
  'هههه! المنشار عنده شغل بالنجارة... وإنت الخشبة!',
 ],
 'c_fakedoor': [
  'هاهاها! الباب مزيّف يا شاطر! مين بيصدّق باب بهالشكل؟',
  'ولاا! الباب كذب عليك! حتى الأبواب ما عاد بتتصدّق!',
  'هههه! فتحت الباب؟ شو كنت عم تتوقّع، حديقة الأحلام؟',
 ],
 'c_crumble': [
  'ولاا! الأرض تركتك! حتى الأرض ما بدها ياك!',
  'هاهاها! الأرض كانت من كرتون! ما حدا قلّك؟',
  'هههه! الأرض طلعت مش أرض... طلعت بسكويت!',
 ],
 'c_bait': [
  'هههه! الطمع! شفت الفلوس وفقدت العقل!',
  'هاهاها! العملة بتنادي وإنت لبّيت! يا طمّاع!',
  'ولاا! كل ما بيلمع مش دهب... وبعضو فخ كمان!',
 ],
 'c_monster': [
  'هاهاها! الوحش عملّك مقلب! كان لازم تدعس عليه، مش تضمّو!',
  'ولاا! قلّك بوو وإنت متّ! يا جبان!',
  'هههه! الوحش صغير وإنت أصغر منو بالشجاعة!',
 ],
 'c_ball': [
  'هاهاها! الكرة الحديد عملتلك ضربة براس! ولاا طرت!',
  'ولاا! البندول عم يتأرجح وإنت عم تتأرجح بالهوا!',
  'هههه! ضربة قاضية! الكرة سجّلت هدف فيك!',
 ],
 'c_ghost': [
  'هاهاها! الشبح قلّك: ليش واقف؟ وخطفك!',
  'ولاا! قلتلك ما توقف! الشبح بيحب الواقفين!',
  'يا ساتر! شبح! حتى الأشباح عندها شغل أكتر منك!',
 ],
 'c_wall': [
  'هاهاها! الحيط لحقك! وإنت قلت ما فيني!',
  'ولاا! الحيط ما بيرحم! صرت لوحة معلّقة عالحيط!',
  'هههه! فزّ يا بطل! الحيط ما بيستنّى حدا!',
 ],
 'streak': [
  'هاهاها! هيدي المرحلة صارت بيتك التاني! بدنا نجيبلك فرشة!',
  'يا ساتر! كم مرة؟ أنا عديت وما قدرت أخلّص العدّ!',
  'هههه! شو، عم تعمل تمرين؟ كل مرة بتموت بنفس المكان!',
  'ولاا! عندك مبدأ، عم تعيد نفس الموتة بنفس الأسلوب! هاهاها!',
 ],
 'quick': [
  'ولاا! ثانية وحدة؟ هيدا رقم قياسي!',
  'هههه! حتى القهوة ما برّدت، ومتّ!',
  'هاهاها! سخّنت؟ لا؟ متّ قبل التسخين!',
 ],
 'near': [
  'آخ! كنت قريب منها! بس كلمة قريب ما بتطعمي خبز!',
  'ولاا! بس خطوة وحدة! يا حظّك الحلو!',
  'هههه! كنت عالباب! والباب ضحك عليك!',
 ],
 'win': [
  'يا سلام! عبرت؟! مين ساعدك؟ قول الصدق!',
  'برافو عليك! هلّق جاي الأصعب، تعا لعندي!',
  'يخرب بيتك! عبرت! دقيقة دقيقة، مين لعبلك؟',
  'هاهاها! عبرت بالغلط، صح؟ لا تنكر!',
  'مبروك يا بطل! بس لا تفرح كتير، الجاية أنذل!',
 ],
}

D['ps'] = {
 'taunt': [
  'هههه! يا عمي أنا بشوف وأنا مش مصدّق! شو هالموتة؟',
  'هاهاها! فش مثلك، كل مرة بتموت بشكل جديد!',
  'يا زلمة، قوم! هاي مش وقت النوم!',
  'هههه! والله لو كنت مكانك كنت لعبت لعبة تانية!',
  'هاهاها! شو هالحظ يا عمي؟ كأنه مطبوخ مخصوص إلك!',
  'ههههه! ابتسم يا حبيبي، الكاميرا عليك وإنت ميت!',
  'يا ويلي! الفخ ضحك لدرجة وقع! هاهاها!',
  'هههه! خلص هلأ؟ بدك تجرّب مرة تانية ولا نكمّل ضحك؟',
 ],
 'c_spike':   ['هاهاها! الشوك مرتاح عليك كتير، ما بدّه يخلّيك تروح!'],
 'c_pit':     ['ههههه! الحفرة كانت قدامك يا زلمة، ما شفتها؟ ولا شفتها وقلت خليني أجرّب؟'],
 'c_arrow':   ['هاهاها! السهم كان معه عنوانك يا حبيبي!'],
 'c_crush':   ['ههههه! الحجر فرشك عالأرض متل العجين! هاهاها!'],
 'c_boulder': ['هاهاها! الصخرة لحقتك يا عمي! ما كان في شغلة تهرب؟'],
 'c_saw':     ['ههههه! المنشار شغّال وإنت متفرّج! مين قلّك تقرب؟'],
 'c_fakedoor':['هاهاها! الباب كان إشي مزيّف يا زلمة، وإنت صدّقت!'],
 'c_crumble': ['ههههه! الأرض خانتك! حتى الأرض ما بتحمل ثقلك!'],
 'c_bait':    ['هاهاها! شفت الفلوس وعيونك لمعت! هيك بتصير يا طمّاع!'],
 'streak': [
  'هاهاها! هاي المرحلة صارت بيتك، بس الإيجار بتدفعه بالموت!',
  'ههههه! كم مرة بدك تموت هون؟ نحنا بلشنا نحبك!',
  'يا زلمة، لا تعيد نفس الغلط! ... أو لا، عيده، بنضحك أكتر! هاهاها!',
 ],
 'quick': [
  'هاهاها! بدون سخونة؟ مات من أول خطوة!',
  'ههههه! ثانيتين وانتهت الحكاية! سيناريو قصير وكوميدي!',
 ],
 'near': [
  'آه! قريب كتير يا حبيبي! بس الباب بعيد شوي... ههههه!',
  'هاهاها! كنت على بعد خطوة! شو هالنحس المرتّب؟',
 ],
 'win': [
  'ما شاء الله! مين بدّه يصدّق؟ عبر المرحلة! أكيد حدا ساعده!',
  'هاهاها! برافو يا زلمة! بس الجاية أحلى... يعني أصعب!',
 ],
}

D['eg'] = {
 'taunt': [
  'هههه! يا نهار أبيض! مات تاني؟ ده الفخ مش مصدّق نفسه!',
  'ههههه! ارجع يا بطل، ده كان تسخين!',
  'يا عم ده إنت بتموت بشياكة! مين مصمم الموتة دي؟',
  'هههه! خلاص يا معلم، كفاية كده، الفخ تعب منك!',
  'هاهاها! إيه الجمال ده؟ مات وعلى وشه ابتسامة!',
  'ياض إنت بتعمل كده ليه؟ الفخ لسه معملش حاجة!',
  'هههه! أنا لو منك كنت روحت نمت، ده إنت مش في يومك!',
  'يا باشا مفيش حد بيموت زيك! أصالة والله!',
 ],
 'c_spike':   ['هههه! الشوك استقبلك بالأحضان يا باشا! فين الأدب بقى؟'],
 'c_pit':     ['ههههه! الحفرة كانت قدامك يا معلم! إنت كنت بتبص على إيه؟'],
 'c_arrow':   ['هاهاها! السهم كان جاي من بدري، وإنت واقف زي القمر!'],
 'c_crush':   ['ههههه! الحجر نزل عليك زي الفطير المشلتت! بالهنا والشفا!'],
 'c_boulder': ['هاهاها! الصخرة جريت وراك وكسبت! مبروك عليها!'],
 'c_saw':     ['هههه! المنشار بيقولك: تعالى أظبطلك قصة شعر! هاهاها!'],
 'c_fakedoor':['هاهاها! الباب ده تمثيلية يا برنس! وإنت صدّقت!'],
 'c_crumble': ['ههههه! الأرض اتهدّت من تحتك! دي مش أرض، دي كيكة!'],
 'c_bait':    ['هاهاها! دي طُعم يا حبيبي! الطمع يقلّ ما جمع!'],
 'streak': [
  'هههه! المرحلة دي بقت بيتك! عاوز نجيبلك شاي؟',
  'يا عم كام مرة؟ أنا بطّلت أعدّ من بدري!',
  'ههههه! إنت بتحاول ولا بتتسلّى بالموت؟',
 ],
 'quick': [
  'هاهاها! لحقت تتنفس؟ مات من أول نص ثانية!',
  'هههه! رقم قياسي! جينيس هتتصل بيك دلوقتي!',
 ],
 'near': [
  'آه يا خسارة! كنت قريب أوي من الباب! الحظ مش معاك النهاردة!',
  'هاهاها! كام خطوة وتوصل! بس الفخ كان أسرع منك!',
 ],
 'win': [
  'إيه ده! عدّيت؟! أكيد في غلطة! هنراجع الكاميرات!',
  'برافو عليك! بس استنى المرحلة الجاية، دي أصعب بكتير!',
 ],
}

D['gulf'] = {
 'taunt': [
  'ههههه! يا شيخ الله يعينك، حتى الشوك مستحي!',
  'ههههه! وين رايح يا حبيبي؟ ارجع من جديد!',
  'هاهاها! مرة ثانية؟ يا رجال أنت وين مركّز؟',
  'ههههه! الفخ يقول: وينك يا غالي؟ تعال مرة ثانية!',
  'هههههه! والله إنك فنان، تموت بإبداع!',
  'هاهاها! يا شيخ الفخ بعده ما لعب، وانت خلصت!',
 ],
 'c_spike':   ['ههههه! الشوك مرة مبسوط فيك! وش هالضيافة؟'],
 'c_pit':     ['هاهاها! الحفرة قدامك يا شيخ! عيونك وين؟'],
 'c_arrow':   ['ههههه! السهم جاك ما استأذن! طاح فيك وانت واقف!'],
 'c_crush':   ['هاهاها! الحجر نزل عليك مثل الصاروخ! الله يعينك!'],
 'c_boulder': ['ههههه! الصخرة لحقتك! ركضت حيل بس ما نفع!'],
 'c_saw':     ['هاهاها! المنشار يبي يسوّي لك قصّة! بس غلط بالمكان!'],
 'c_fakedoor':['ههههه! الباب مزيّف يا شيخ! عاد انت بعد صدّقت!'],
 'c_crumble': ['ههههه! الأرض تهاوت! يمكن من وزن الحماس!'],
 'c_bait':    ['هاهاها! الطعم يا غالي! شفت الفلوس وطار عقلك!'],
 'streak': [
  'ههههه! هالمرحلة صارت بيتك! ننتظر منك الإيجار!',
  'يا شيخ كم مرة؟ أنا مليت من العدّ!',
 ],
 'quick': ['هاهاها! بسرعة مرة! ما لحقنا نشوفك!'],
 'near':  ['آآخ! كنت قريب وايد! بس الباب بعد عنك مرة!'],
 'win': [
  'ما شاء الله! وش هالمفاجأة؟ نجا الحين! أكيد غشّ!',
  'يا سلام! عبرت المرحلة! ترى اللي جاي أقوى، تهيّأ!',
 ],
}

D['iq'] = {
 'taunt': [
  'هههه! عيني شنو سويت؟ مات بدون ما يكمل!',
  'هاهاها! ولك أخوي، هذا شنو؟ موتة لو مسرحية؟',
  'ههههه! يا حيف عليك! هواية تحاول وبعدك تموت!',
  'هاهاها! خوش حركة! بس بالمقلوب!',
  'ههههه! ماكو مثلك، كل مرة بنفس الخطأ ونفس الضحك!',
 ],
 'c_spike':   ['هاهاها! ولك الشوك كان واكف ينتظرك، وإنت رحت إله بنفسك!'],
 'c_pit':     ['ههههه! الحفرة كانت كدّامك! ماكو شي ينشاف أوضح!'],
 'c_arrow':   ['هاهاها! السهم جاك بدون موعد! شلون ما حسيت؟'],
 'c_crush':   ['هاهاها! الحجر سوّاك مثل الخبزة المبطوحة!'],
 'c_boulder': ['ههههه! الصخرة ركضت وراك وجابتك! سرعتك ما نفعتك!'],
 'c_saw':     ['ههههه! المنشار يريد يسوّي إلك قصّة شعر!'],
 'streak': [
  'هاهاها! هالمرحلة صارت بيتك التاني! جيب الفراش!',
  'ولك كم مرة؟ أني عديت وتعبت!',
 ],
 'quick': ['ههههه! بثانية وحدة؟ هذا مو موت، هذا برق!'],
 'near':  ['آخ! كنت قريب هواية! بس القريب ما يكفي يا عيني!'],
 'win':   ['شنو؟ عبرت؟ ماكو مجال! أكيد صارت غلطة!'],
}

D['ma'] = {
 'taunt': [
  'هههه! الله يعاونك آ خويا، عاود جرّب!',
  'هاهاها! علاش كتموت بهاد الطريقة؟ الفخ ما درا والو!',
  'ههههه! واخا آ صاحبي، غادي نعطيك فرصة تانية!',
  'هاهاها! هادي ماشي موتة، هادي مسرحية!',
  'ههههه! آ خويا كتموت مزيان! أحسن واحد فالزنزانة!',
 ],
 'c_spike':   ['هاهاها! الشوك كان كيتسناك، وإنت جيتي برجليك!'],
 'c_pit':     ['ههههه! الحفرة كانت قدامك! فين كانو عينيك؟'],
 'c_arrow':   ['هاهاها! السهم جا مباشرة ليك! واش عندو عنوانك؟'],
 'c_crush':   ['ههههه! الحجر طاح عليك وولّيتي بحال الفطيرة!'],
 'c_boulder': ['هاهاها! الصخرة مشات وراك! جري بزربة آ صاحبي!'],
 'c_saw':     ['ههههه! المنشار بغا يحلق ليك! هاهاها!'],
 'streak': [
  'ههههه! هاد المرحلة ولات دارك! خاصنا نجيبو ليك الأتاي!',
  'هاهاها! شحال من مرة؟ أنا عييت نعدّ!',
 ],
 'quick': ['ههههه! فثانية وحدة؟ هادا رقم قياسي آ صاحبي!'],
 'near':  ['آخ! كنتي قريب بزاف! ولكن القريب ماشي هو الفايز!'],
 'win':   ['واو! داز المرحلة؟ مستحيل! أكيد غش!'],
}

def _more(d, **kw):
    for k, v in kw.items(): D[d].setdefault(k, []).extend(v)
_more('eg',
 taunt=['ههههه! يا عم ده الفخ نفسه استغرب! إنت جاي من كوكب تاني؟',
        'هاهاها! خد نفس يا بطل، لسه الفرح في أوله!',
        'هههه! لا لا لا، ده إنت محتاج دروس خصوصي في القفز!'],
 c_spike=['هههه! بقيت زي القنفذ يا باشا! بس من غير حنية!'],
 c_pit=['هاهاها! الجاذبية قالتلك: تعالى في حضني! وإنت لبّيت!'],
 c_arrow=['هههه! السهم وصلك لحد البيت! خدمة توصيل سريعة!'],
 c_crush=['هاهاها! بقيت فطيرة مشلتت! ناقصك عسل وجبنة!'],
 c_boulder=['ههههه! الصخرة قالتلك: استنى بس! وإنت جري زي المجنون!'],
 c_saw=['هاهاها! المنشار ده نجّار شاطر! حوّلك ألواح خشب!'],
 c_fakedoor=['ههههه! الباب طلع كرتون! حتى أبواب الزنزانة بتنصب عليك!'],
 c_crumble=['هاهاها! الأرض قالت سلام عليكم! وراحت في حالها!'],
 c_bait=['ههههه! الطمع يا باشا! شفت العملة ونسيت الدنيا!'],
 c_monster=['هاهاها! الوحش ده صغير وإنت اتخضّيت منه! يا خسارة!',
            'ههههه! حد يقول للوحش إنه كسب! مبروك عليه!'],
 c_ball=['هاهاها! الكورة جت في دماغك! جووول!',
         'هههه! الكورة الحديد شالتك على طول! رحلة طيران مجانية!'],
 c_ghost=['هاهاها! قلتلك ماتقفش! الشبح ده بيحب الواقفين!',
          'ههههه! اتخطفت يا باشا! الشبح بيقولك: بووو!'],
 c_wall=['هاهاها! الحيطة جاتلك! هي اللي جت، مش إنت اللي روحتلها!',
         'ههههه! اتفرشت على الحيطة زي الإعلان!'],
 streak=['هاهاها! مرحلة بتموت فيها كل يوم، دي مش لعبة، دي وظيفة!'],
 quick=['ههههه! حتى الشاي ما اتعملش، ومت!'],
 near=['هههه! الباب كان قدامك! مدّ إيدك يا شيخ!'],
 win=['ياااه! عدّيت! دي أكيد حظ مبتدئين!'])
_more('ps',
 taunt=['ههههه! يا زلمة هاي موتة بتنحكى للأحفاد!',
        'هاهاها! الله يعطيك العافية على الجهد! بس الفخ أقوى!',
        'هههه! يا عمي ركّز شوي، الفخ ما إلو ذنب!'],
 c_spike=['ههههه! صرت قنفذ يا زلمة! بس بدون حنية!'],
 c_pit=['هاهاها! نزلت ع الحفرة كأنها بيتك! ما شاء الله عليك!'],
 c_arrow=['ههههه! السهم اشتاقلك وطار عليك طيران!'],
 c_crush=['هاهاها! صرت متل الكنافة المفرودة! ناقصك قطر!'],
 c_boulder=['ههههه! الصخرة دحرجتك دحرجة! هاي رياضة ثقيلة!'],
 c_saw=['هاهاها! المنشار بدو يعمل منك ألواح! كمّل!'],
 c_fakedoor=['ههههه! الباب مزيّف يا زلمة! حتى الأبواب بتنصب علينا!'],
 c_crumble=['هاهاها! الأرض انهدّت! كانت من ورق، ما حدا قلّك؟'],
 c_bait=['ههههه! ركضت ورا العملة ولقيت الفخ بانتظارك!'],
 c_monster=['هاهاها! الوحش صغير وإنت خفت منه! يا عيب الشوم!',
            'ههههه! الوحش قلّك بوو وإنت مت! شو هالشجاعة؟'],
 c_ball=['هاهاها! الكرة الحديد ضربتك عالراس! هدف يا زلمة!',
         'ههههه! البندول بيتأرجح وإنت بتتأرجح معه بالهوا!'],
 c_ghost=['هاهاها! قلتلك لا توقف! الشبح بيحب الواقفين!',
          'ههههه! الشبح أخدك معه! سلّم عالأشباح!'],
 c_wall=['هاهاها! الحيط لحقك! وإنت قلت ما بدي!',
         'ههههه! انسحقت عالحيط متل الصورة!'],
 streak=['هاهاها! هاي المرحلة صارت وظيفتك! بدك راتب؟'],
 quick=['ههههه! ما لحقت تسخّن وخلصت!'],
 near=['هاهاها! الباب قدامك يا زلمة! مدّ إيدك!'],
 win=['يا سلام! عبرت! أكيد حدا لعب عنك!'])

# ------------------------------------------------------------------ الراوي والضحك والصراخ
NAR = [
 ('intro', None, 'أهلاً وسهلاً بزنزانة الفخاخ! كل شي هون شكلو آمن... وكلّو كذب!'),
 ('intro', None, 'تفضّل يا بطل... الفخاخ جاهزة، والضحك مضمون!'),
 ('intro', None, 'بيقولوا ما حدا بيطلع من هون سالم... وإنت مش رح تكون الاستثناء!'),
 ('level', None, 'مرحلة جديدة، فخاخ جديدة، وأعذار جديدة لموتك!'),
 ('level', None, 'الأرض شكلها آمن... وهيدي أول كذبة!'),
 ('level', None, 'لا تثق بأي شي. حتى بهالجملة!'),
 ('level', None, 'الفخاخ عم تمزح معك... وإنت ما عم تفهم المزحة!'),
 ('level', None, 'هيدي المرحلة سهلة... هيك قالولهم للي قبلك!'),
 ('level', None, 'ابتسم! الفخ بيحب يشوف وجه مبسوط!'),
 ('milestone', 5,   'المرحلة الخامسة! هون بيبلّش الجدّ... تقريباً!'),
 ('milestone', 10,  'المرحلة العاشرة! يا إنت شجاع كتير، يا ما عندك شي تعملو!'),
 ('milestone', 20,  'العشرين! والله إنك عنيد! الفخاخ بحالة صدمة!'),
 ('milestone', 50,  'الخمسين! إنت أسطورة... أو عالق باللعبة!'),
 ('milestone', 100, 'المية! يا حبيبي خلّصت... مزح! في مرحلة كمان!'),
 ('idle', None, 'إنت حيّ؟ ولا عم تستنى الفخ يجيك لعندك؟'),
 ('idle', None, 'الوقت عم يمرّ... والفخاخ عم تتثاوب من الملل.'),
 ('idle', None, 'تعرف؟ وقوفك بمطرحك ما رح يجيبلك الباب!'),
 ('idle', None, 'نمت؟ ولا يهمك، نحنا بنستنى... والفخاخ كمان!'),
 ('idle', None, 'حتى السلحفاة عدّت من هون وإنت لسا واقف!'),
 ('idle', None, 'اختار موتتك بنفسك... بعدك عم تفكّر؟'),
 ('fake', None, 'الباب؟ لا لا لا! هيدا مش الباب الحقيقي!'),
 ('fake', None, 'يا حرام! الباب كان رسمة... بس رسمة!'),
 ('fake', None, 'صدّقت الباب؟ إنت طيّب كتير!'),
 ('bait', None, 'العملة اللامعة؟ كانت فخ... دايماً هيي فخ!'),
 ('bait', None, 'الطمع مصيبة! وإنت أثبتّ هالشي هلّق!'),
 ('bait', None, 'شفت الدهب ونسيت الحذر. كلنا هيك!'),
]
LAUGHS = [
 'موهاهاهاهاها! هاهاهاها!',
 'هيهيهيهي! هيهيهي!',
 'هو هو هو هو! هاهاهاها!',
 'هاهاهاهاهاهاها! آآه! هاهاها!',
 'هههههه... هههههه... هههههه...',
 'هيييي هااا! هيييي هااا!',
 'ها... ها... ها... مضحك كتير... ها!',
 'هيهيهيهي هيهيهي هيهي!',
]
TLAUGHS = [
 'هيهيهيهي!',
 'هاهاهاها! هاهاها!',
 'خخخخخ! بخخخخ!',
 'هو هو هو هو!',
 'هخخ هخخ هخخ!',
 'موهاهاها!',
 'تيهيهيهي!',
 'هاااا هاااا هااا!',
 'هيييي! هيييي!',
 'ههههههه... ههههههه!',
]
SCREAMS = [
 'آآآآآآآه!',
 'يا ماااااما!',
 'لااااااا!',
 'يا ويلييييي!',
 'دخيلك! دخيلك! دخيلك!',
 'واااااي واااي واااي!',
 'يا لهويييي!',
 'ولااااااا!',
]

# ------------------------------------------------------------------ الدفعة الوحيدة (كلها لبنانية)
STYLE_LB = ("You are a team of Lebanese voice actors for a funny cartoon video game. Accent: Lebanese Arabic (Beirut). "
 "Taunt lines are shown when the player loses, so perform them as gleeful, cheeky, over-the-top mockery, like laughing at a friend who just failed. "
 "Written laughter such as هاهاها / ههههه must be performed as real laughter. Narrator lines are delivered like a dramatic movie-trailer voice, "
 "but the content is a joke. Pure laughter lines are only silly cartoon laughs without words; scream lines are short comic panic cries, never scary. "
 "Read ONLY the text lines, in order, without any numbering or labels. Leave a clear silence of about 3 seconds after each line before starting the next one.")

entries = []    # قائمة مرتبة: كل عنصر dict(key,k,d,t,batch,...)
def add(d, k, t, batch, **kw):
    n = 1 + sum(1 for e in entries if e['d'] == d and e['k'] == k)
    e = dict(key=f'{d}_{k}_{n:02d}', k=k, d=d, t=t, batch=batch); e.update(kw); entries.append(e)

batches = {}   # id -> dict
def mk_batch(bid, label, voice, style, items, prio):
    batches[bid] = dict(id=bid, label=label, voice=voice, style=style, prio=prio, items=items)

# لهجات أخرى: نصوص فقط (ترجمة/تعليق على الشاشة) بدون صوت
VOICED = ('lb', 'eg', 'ps')
for d, kinds in D.items():
    if d in VOICED: continue
    for k in ORDER:
        for t in kinds.get(k, []): add(d, k, t, None)

# اللبناني + الراوي + ضحكات الفخاخ + الضحك + الصراخ = دفعة وحدة
seq = [(d_, k, t, {}) for d_ in VOICED for k in ORDER for t in D[d_].get(k, [])]
seq += [('any', k, t, ({'lv': lv} if lv else {})) for (k, lv, t) in NAR]
seq += [('any', 'tlaugh', t, {}) for t in TLAUGHS]
seq += [('any', 'laugh', t, {}) for t in LAUGHS]
seq += [('any', 'scream', t, {}) for t in SCREAMS]
ACC = {'lb': 'Lebanese Arabic (Beirut)', 'eg': 'Egyptian Arabic (Cairo)', 'ps': 'Palestinian Levantine Arabic'}
def STYLE_T(d):
    return ("You are a voice actor for a funny cartoon video game. Accent: " + ACC[d] + ". "
     "Every line below is shown when the player loses, so perform it as gleeful, cheeky, over-the-top mockery, like laughing at a friend who just failed. "
     "Written laughter such as هاهاها / ههههه must be performed as real laughter. Read ONLY the text lines, in order, without any numbering or labels. "
     "Leave a clear silence of about 3 seconds after each line before starting the next one.")
STYLE_N = ("Dramatic deep movie-trailer narrator, Lebanese (Beirut) accent, very serious voice but the content is a joke, "
 "with a tiny cheeky wink at the end of each line. Read ONLY the text lines, in order, without numbering or labels. "
 "Leave a clear silence of about 3 seconds after each line.")
STYLE_TL = ("Each line is the silly mocking laugh of a tiny mischievous cartoon trap. Perform exactly the laugh spelled in the line, no words, "
 "short, high-pitched, cheeky, each one different. Read ONLY the text lines, in order. Leave a clear silence of about 3 seconds after each line.")
STYLE_LAUGH2 = ("Each line is a different big cartoon laugh. Perform exactly the laugh spelled in the line, no words, "
 "very expressive, silly, loud, mocking, sometimes evil, sometimes giggly. Read ONLY the text lines, in order. Leave a clear silence of about 3 seconds after each line.")
def _kd(d, *ks): return [(d, k) for k in ks]
C1 = ('c_spike','c_pit','c_arrow','c_crush','c_boulder'); C2 = ('c_saw','c_fakedoor','c_crumble','c_bait','c_monster'); C3 = ('c_ball','c_ghost','c_wall','streak')
GROUPS = [   # (label, voice, style, [(dialect, kind)], max_items, priority)  -- الترتيب = ترتيب الأولوية
 ('لبناني: شماتة 1',            'Puck',      'T:lb', _kd('lb','taunt'), 11, 1),
 ('مصري: شماتة',               'Fenrir',    'T:eg', _kd('eg','taunt'), 13, 1),
 ('فلسطيني: شماتة',            'Algieba',   'T:ps', _kd('ps','taunt'), 11, 1),
 ('لبناني: شوك/حفرة/سهم',        'Aoede',     'T:lb', _kd('lb','c_spike','c_pit','c_arrow'), 12, 1),
 ('مصري: أسباب 1',             'Orus',      'T:eg', _kd('eg', *C1), 10, 1),
 ('فلسطيني: أسباب 1',          'Achird',    'T:ps', _kd('ps', *C1), 10, 1),
 ('لبناني: حجر/صخرة/منشار/باب', 'Kore',      'T:lb', _kd('lb','c_crush','c_boulder','c_saw','c_fakedoor'), 13, 1),
 ('مصري: أسباب 2',             'Sadachbia', 'T:eg', _kd('eg', *C2), 10, 1),
 ('فلسطيني: أسباب 2',          'Algieba',   'T:ps', _kd('ps', *C2), 10, 1),
 ('لبناني: أرض/طمع/وحش/كرة',    'Zephyr',    'T:lb', _kd('lb','c_crumble','c_bait','c_monster','c_ball'), 12, 1),
 ('ضحكات الفخاخ',              'Zephyr',    'TL',   _kd('any','tlaugh'), 10, 1),
 ('ضحكات كبيرة',               'Puck',      'LA',   _kd('any','laugh'), 8, 1),
 ('صرخات',                    'Fenrir',    'SC',   _kd('any','scream'), 8, 1),
 ('مصري: أسباب 3',             'Fenrir',    'T:eg', _kd('eg', *C3), 10, 2),
 ('فلسطيني: أسباب 3',          'Puck',      'T:ps', _kd('ps', *C3), 10, 2),
 ('لبناني: شبح/جدار/تكرار/سرعة', 'Laomedeia', 'T:lb', _kd('lb','c_ghost','c_wall','streak','quick'), 13, 2),
 ('لبناني: شماتة 2',            'Fenrir',    'T:lb', _kd('lb','taunt'), 10, 2),
 ('مصري: سرعة/قريب/فوز',        'Orus',      'T:eg', _kd('eg','quick','near','win'), 9, 2),
 ('فلسطيني: سرعة/قريب/فوز',     'Achird',    'T:ps', _kd('ps','quick','near','win'), 9, 2),
 ('لبناني: قريب/فوز',           'Laomedeia', 'T:lb', _kd('lb','near','win'), 8, 2),
 ('الراوي 1',                 'Charon',    'N',    _kd('any','intro','level','milestone'), 14, 2),
 ('الراوي 2',                 'Charon',    'N',    _kd('any','idle','fake','bait'), 12, 2),
]
STYLE_SCREAM = ("Each line is a short comedic cartoon scream or panic cry, exaggerated and funny, not scary or disturbing, "
 "like a character falling off a cliff in a silly cartoon. Read ONLY the text lines, in order. Leave a clear silence of about 3 seconds after each line.")
def _fill():
    used = [0]*len(seq)
    for gi, (label, voice, sk, dks, mx, prio) in enumerate(GROUPS, 1):
        style = {'TL': STYLE_TL, 'LA': STYLE_LAUGH2, 'SC': STYLE_SCREAM, 'N': STYLE_N}.get(sk) or STYLE_T(sk.split(':')[1])
        bid = f'B{gi:02d}_' + (sk.split(':')[1] if sk.startswith('T:') else 'any')
        batches[bid] = dict(id=bid, label=label, voice=voice, style=style, prio=prio, items=[])
        for i, (d, k, t, ex) in enumerate(seq):
            if used[i] or (d, k) not in dks or len(batches[bid]['items']) >= mx: continue
            used[i] = 1
            add(d, k, t, bid, **ex)
            batches[bid]['items'].append(dict(key=entries[-1]['key'], t=t, k=k))
    assert all(used), [seq[i] for i, u in enumerate(used) if not u]
_fill()

# ------------------------------------------------------------------ أصوات الأبطال (كل بطل بلهجته وشخصيته؛ ما تتأثر بإعداد اللهجة)
# حدث: pick (ترحيب عند الاختيار/البدء) · die (موت) · run (هروب من مطاردة) · win (فوز) · warn (خوف لما فخ يضحك)
HERO_EV = ['pick', 'die', 'run', 'win', 'warn']
HEROES_V = {
 'falafel': dict(name='فلافل المسكين', d='ps', voice='Puck', who="a tiny sad falafel ball wearing a miner's helmet, whiny, pitiful, always about to cry but funny",
   L={'pick': ['أهلا يا فلافل... يا مسكين!', 'أنا فلافل! ما بدي أموت!', 'يلا يا فلافل، عالمصيبة!'],
      'die':  ['متّ يا عمي! متّ!', 'آخ يا ظهري، يا فلافل!', 'ليش أنا؟ ليش دايماً أنا؟', 'قلتلكم الأرض مش آمنة!'],
      'run':  ['هربان يا فلافل! هربان!', 'الحقوني! بدي أهرب!', 'ما بدي أنقلي! لأ لأ لأ!'],
      'win':  ['عدّيتها يا عمي! إيه والله!', 'نجوت! أنا فلافل الخارق!', 'يا ساتر! عدّيت!'],
      'warn': ['إيش هالضحكة؟!', 'يا ويلي شو هاد؟']}),
 'uncle': dict(name='العم بالبيجاما', d='lb', voice='Algenib', who="a grumpy sleepy middle-aged uncle in pyjamas, gravelly voice, always complaining, secretly lovable",
   L={'pick': ['أهلين يا عمّو، نعسان أنا!', 'جيت بالبيجاما، شو بدك؟', 'يلا يا عمو، بدي نام بعدين!'],
      'die':  ['متّ يا عمي! حرام عليكم!', 'آخ ضهري! ضهري يا ولاد!', 'مين حطّ هالفخ يا ناس؟', 'ولا مرة بنام بسلام!'],
      'run':  ['هربان يا عمو! هربان!', 'يلا يا بيجاما، اركض!', 'ركبي يا ركبي، لا تخونّي!'],
      'win':  ['عدّيت، وبدي نام هلأ!', 'خلص؟ تصبحوا على خير!', 'بيجاماتي نجت! الحمد لله!'],
      'warn': ['هاي شو؟ مين هونيك؟', 'لا لا لا لا لا!']}),
 'chicken': dict(name='الفرخة بالنظارة', d='eg', voice='Leda', who="a fussy bookish hen with big glasses, dramatic diva, clucks when excited",
   L={'pick': ['أهلاً يا فرخة! قوقوقو!', 'فرخة مثقفة بنضّارة!', 'يلا يا فرخة، على الفخاخ!'],
      'die':  ['قوقو! مت يا ناس!', 'ياااه! نضّارتي!', 'أنا فرخة محترمة يا عالم!', 'كان لازم أفضل في القن!'],
      'run':  ['اجري يا فرخة، اجري!', 'قوق قوق قوق! الحقوني!', 'هربانة يا ناس، هربانة!'],
      'win':  ['عدّيت يا ولاد! قوقوقو!', 'الفرخة نجحت! اتفرجوا!', 'طلعت أشطر من الديك!'],
      'warn': ['إيه ده؟ ده فخ ولا إيه؟', 'يا لهوي! بصّوا!']}),
 'grandma': dict(name='الجدّة الغاضبة', d='ps', voice='Gacrux', who="an angry old grandmother, scolding, dramatic, shouting at the traps like they are naughty grandchildren",
   L={'pick': ['أهلين! أنا تيتا، وغاضبة!', 'ولا كلمة! تيتا هون!', 'يلا يا تيتا، فشّي خلقك!'],
      'die':  ['الله يسامحكم يا ولاد!', 'آخ يا ركبتي! يا ركبتي!', 'بأيامنا ما كان في فخاخ!', 'متّ يا ستّي! متّ!'],
      'run':  ['اركضي يا تيتا! لا تقفي!', 'تفو عالفخاخ! ركض ركض!', 'ما بلحقوني! أنا أسرع منهم!'],
      'win':  ['عدّيت يا ولاد! شفتوا؟', 'هيك الستّات بتنجح!', 'حطّولي عالغدا!'],
      'warn': ['ولاا! شو هاد؟', 'بس! لا تعمل هيك!']}),
 'cat': dict(name='القط الكسلان', d='lb', voice='Umbriel', who="a very lazy cat, slow sleepy drawn-out voice, yawns, meows now and then, easy-going",
   L={'pick': ['مياو... أهلا يا قطة', 'ما بدي أتحرك... بس طيب', 'يلا يا قطة، بعد خمس دقايق'],
      'die':  ['مياااو! متّ... أوف', 'فدّا لمشوار! بدي نام', 'باقي لي ثمان أرواح، عادي', 'أوف... مين نيّم الأرض؟'],
      'run':  ['هربان يا قطة! هربان!', 'ما بحب الركض... بس ركض!', 'مياو مياو! بسرعة!'],
      'win':  ['خلصت؟ خلص... بدي نام', 'عدّيت... هلأ قيلولة', 'مياو! عبرت وما تعبت'],
      'warn': ['هاي شو؟ مياو؟', 'ما شفت شي... أنا نايم']}),
 'donkey': dict(name='الحمار الكوول', d='eg', voice='Iapetus', who="a super cool donkey wearing sunglasses, laid-back, chill, says hee-haw when excited",
   L={'pick': ['أهلاً يا حمار... كوول!', 'هي هاو! أنا الحمار الكوول!', 'يلا يا عم، رايق أنا'],
      'die':  ['هي هااو! متّ يا ريس!', 'ده مش كوول خالص!', 'نضّارتي! حد شاف نضّارتي؟', 'فخ؟ على الحمار الكوول؟!'],
      'run':  ['اجري يا حمار! مش وقت فرجة!', 'يا ابني بسرعة! هيهو هيهو!', 'كوول بس هربان!'],
      'win':  ['قلتلكم كوول! هيهو!', 'عدّيتها ببرود يا عم!', 'الحمار عدّاها! هي هاو!'],
      'warn': ['إيه ده يا ابني؟', 'أنا مش خايف... شوية']}),
}
STYLE_H = ("You are the voice of {who}, a character in a funny cartoon video game. Accent: {acc}. "
 "Each line below is a short spoken exclamation by this character: perform it with big comic emotion, fully in character, natural and quick, "
 "never reading it flat. Read ONLY the text lines, in order, without any numbering or labels. "
 "Leave a clear silence of about 3 seconds after each line before starting the next one.")
for _i, (_h, _v) in enumerate(HEROES_V.items(), 1):
    _bid = f'H{_i:02d}_{_h}'
    batches[_bid] = dict(id=_bid, label=f"بطل: {_v['name']} ({DIA[_v['d']]['ar']})", voice=_v['voice'], prio=1,
                         style=STYLE_H.format(who=_v['who'], acc=ACC[_v['d']]), items=[])
    for _ev in HERO_EV:
        for _t in _v['L'][_ev]:
            assert len(_t) <= 28, (_h, _ev, _t, len(_t))
            add(_v['d'], 'h_' + _ev, _t, _bid, h=_h)
            batches[_bid]['items'].append(dict(key=entries[-1]['key'], t=_t, k='h_' + _ev))
# ------------------------------------------------------------------ زعيم المرحلة العاشرة (الملك فخ) — صوت واحد عميق ومغرور
BOSS_EV = ['intro', 'hit', 'die', 'rage', 'defeat', 'win', 'idle']
BOSS_L = {
 'intro':  ['أهلاً بالضحية الجديدة!', 'أنا الملك فخ! اركع!', 'غرفتي، قوانيني، موتك!'],
 'hit':    ['آخ! مين علّمك تدعس؟!', 'زر؟! مين حطّ هالزر؟!', 'ما هيك الاتفاق يا ولد!', 'ظهري! دبّرت له ظهري!', 'حسابك معي بعدين!'],
 'die':    ['هههه! بطلنا طار!', 'قلتلك أنا الملك!', 'ارجع جرّب، بضحك أكتر', 'الفخ الملكي ما بيغلط', 'سجّلت نقطة، وإنت صفر'],
 'rage':   ['هلّق بلّش الجد!', 'كنت عم أمزح معك!'],
 'defeat': ['مستحيل! أنا الملك!', 'كيف؟! بزر؟! بزر!!', 'بتندم... بعد تسع مراحل'],
 'win':    ['روح، بس إخواتي أصعب!', 'المرحلة الجاية بتبكّيك!'],
 'idle':   ['لا تتأخر... مو حلو', 'عم أنتظر... هههه', 'يلا ازعل شوي'],
}
STYLE_B = ("You are the voice of the Trap King, the big arrogant boss of a funny cartoon dungeon game: a deep booming theatrical villain voice, "
 "Lebanese Arabic accent (Beirut), pompous and gloating, never truly scary: the mockery is cartoonish. When the king is hurt or defeated, "
 "perform comic pain and outrage. Read ONLY the text lines, in order, without any numbering or labels. "
 "Leave a clear silence of about 3 seconds after each line before starting the next one.")
batches['K01_boss'] = dict(id='K01_boss', label='الزعيم: الملك فخ (لبناني، صوت عميق)', voice='Orus', prio=1, style=STYLE_B, items=[])
for _ev in BOSS_EV:
    for _t in BOSS_L[_ev]:
        assert len(_t) <= 28, (_ev, _t, len(_t))
        add('lb', 'b_' + _ev, _t, 'K01_boss', h='boss')
        batches['K01_boss']['items'].append(dict(key=entries[-1]['key'], t=_t, k='b_' + _ev))
# سطر له مقطع صوتي جاهز يُحذف من الدفعة (يبقى بالمانيفست)
for _b in list(batches):
    batches[_b]['items'] = [i for i in batches[_b]['items'] if not os.path.exists(f"{ROOT}/assets/audio/{i['key']}.mp3")]
    if not batches[_b]['items']: del batches[_b]

# ------------------------------------------------------------------ الأصوات الموجودة أصلاً (10 مقاطع مولّدة) - تبقى بمفاتيحها القديمة
OLD = {
 'taunt_sy1':  ('taunt','sy','هاهاها! مات مرة تانية يا بطل! شو هاد، حتى الفخ استحى منك!'),
 'taunt_sy2':  ('taunt','sy','يا حرام! مات! العدّاد عم يبكي من الفرحة! هاهاها!'),
 'taunt_eg':   ('taunt','eg','هههه! إيه ده يا برنس؟ الفخ بيسلّم عليك!'),
 'taunt_gulf': ('taunt','gulf','هههه! وش هالمصيبة يا شيخ؟ حتى الفخ استحى منك!'),
 'taunt_iq':   ('taunt','iq','هههه! ولك شكو هذا؟ قوم عاود يا بطل!'),
 'taunt_ma':   ('taunt','ma','هاهاها! آش هادشي آ صاحبي؟ مات قبل ما يبدا!'),
 'taunt_lb':   ('taunt','lb','هاهاها! يا ساتر! مات وهو عم يضحك!'),
 'taunt_ps':   ('taunt','ps','هههه! يا زلمة، الفخ نفسه ضحك عليك! قوم جرّب تاني!'),
 'laugh_evil': ('laugh','any','موهاهاهاهاها!'),
 'win_sy1':    ('win','sy','مش معقول! نجا! أكيد بالغلط!'),
}

def write(path, s):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, 'w', encoding='utf-8').write(s)

# --- voices.json (مانيفست اللعبة)
man = {}
for key, (k, d, t) in OLD.items():
    man[key] = dict(k=k, d=d, t=t, old=1)
for e in entries:
    m = dict(k=e['k'], d=e['d'], t=e['t'])
    if 'lv' in e: m['lv'] = e['lv']
    if 'h' in e: m['h'] = e['h']
    man[e['key']] = m
write(f'{ROOT}/assets/voices.json', json.dumps(man, ensure_ascii=False, indent=0).replace('\n}', '\n}\n'))

# --- voice_batches.json
write(f'{ROOT}/content/voice_batches.json',
      json.dumps([batches[b] | {'n': len(batches[b]['items'])} for b in batches], ensure_ascii=False, indent=1))

# --- إحصاءات
from collections import Counter
cnt = Counter((e['d'], e['k']) for e in entries)
print('lines:', len(entries), 'batches:', len(batches))
print('voiced (batch) lines:', sum(len(b['items']) for b in batches.values()))

# ------------------------------------------------------------------ voice_script.md
md = []
md.append('# سكربت الأصوات لـ Google AI Studio\n')
md.append(f'**{sum(len(b['items']) for b in batches.values())} سطر في {len(batches)} دفعات.**\n')
md.append('''## طريقة العمل (لكل دفعة، دقيقتين)
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
''')
for bid, b in batches.items():
    md.append(f"\n---\n## {bid[:3]} — {b['label']}   (أولوية {b['prio']}، {len(b['items'])} سطر)\n")
    md.append(f"- **Voice:** `{b['voice']}`\n- **ملف الحفظ:** `{bid}.wav`\n")
    md.append("**Style instructions:**\n```\n" + b['style'] + "\n```\n")
    md.append("**Text:**\n```\n" + "\n\n".join(i['t'] for i in b['items']) + "\n```\n")
write(f'{ROOT}/content/voice_script.md', '\n'.join(md))

# ------------------------------------------------------------------ الصور
STYLE_IMG = ("Funny cartoon illustration in a consistent style: thick black outlines, flat bright saturated colors, "
 "simple cel shading, exaggerated expressions, playful and slapstick, family friendly (no blood, no gore). "
 "MAIN CHARACTER (identical in every cell): a tiny clumsy explorer with HUGE round thick-rimmed glasses, a brown mining helmet "
 "with a yellow lamp on the front, a tan tunic, a brown belt with a gold buckle, and big dark boots. "
 "Every cell has a plain flat light cream-colored background (no scenery fills the whole cell), one clear centered subject, "
 "and NO text, NO letters, NO numbers, NO captions, NO logos anywhere in the image.")

CELLS = [
 ('card_spike_2',   'The explorer sits calmly on a bed of metal floor spikes, spikes poking up through his tunic so he looks like a hedgehog, one eyebrow raised, tiny stars circling his helmet.'),
 ('card_pit_1',     'The explorer falls into a dark round pit, arms and legs spread wide, mouth open in a huge scream, one boot flying off, his helmet lamp lighting the pit walls.'),
 ('card_pit_2',     'Only the explorer\'s hand holding a tiny white flag and the top of his helmet peek out of the edge of a hole in the ground.'),
 ('card_arrow_1',   'The explorer stands frozen like a pincushion with many cartoon arrows stuck in his helmet and tunic, arrows have colorful feathers, he looks very surprised (no blood).'),
 ('card_arrow_2',   'A stone wall turret with a smug smirking face shoots a tiny arrow that bonks the explorer\'s helmet so it spins on his head, stars around.'),
 ('card_crush_2',   'A huge stone block with a smug face lies on the ground, only the explorer\'s two boots and two hands stick out from underneath, a puff of dust around it.'),
 ('card_boulder_2', 'The explorer runs in panic, sweating, with his glasses crooked, while a huge round boulder with a smirking face rolls right behind him almost touching.'),
 ('card_saw_1',     'A big spinning circular saw blade with a cheeky grin has cut the explorer\'s helmet cleanly into two halves; the explorer stands frozen in shock, unhurt, sparks flying.'),
 ('card_saw_2',     'The explorer\'s tunic has been cut into ridiculous tiny shorts by a saw; he blushes with embarrassment and covers himself with his arms while the saw blade smugly smiles.'),
 ('card_fakedoor_2','A flimsy painted cardboard door has collapsed flat, the explorer sits dazed in a cloud of dust behind it in front of a plain brick wall, spirals in his glasses.'),
 ('card_crumble_1', 'The floor tiles crumble beneath the explorer; he hangs in mid-air for a moment like a cartoon character who has not realised yet, legs pedalling, one tiny sweat drop.'),
 ('card_crumble_2', 'The explorer sits dazed in a pile of broken stone tiles with one tile balanced on his head like a hat, dizzy spiral eyes, dust cloud.'),
 ('card_bait_1',    'A huge shiny gold coin hangs on a thin string with a tiny fishing hook; the explorer\'s eyes have turned into sparkling gold coins and he is drooling, reaching for it.'),
 ('card_bait_2',    'The explorer\'s hand is stuck in a big clamp trap that was holding a gold coin; two comic fountains of tears shoot out of his eyes, glasses fogged.'),
 ('card_any_2',     'The explorer\'s transparent soul floats up out of his body making a peace sign, wearing a tiny halo, while his body lies flat on the ground with X-shaped eyes.'),
 ('card_any_3',     'The explorer is flattened like a cartoon pancake on the floor, arms and legs spread out, spiral eyes, stars circling above.'),
 ('card_any_4',     'The explorer\'s helmet alone sits on the ground with a small flower growing out of it, a tiny cute tombstone with a sad cartoon face beside it (no text on it).'),
 ('card_any_5',     'The explorer with a huge bandage around his head, one arm in a sling and crutches, looking totally bored, glasses cracked.'),
 ('card_any_6',     'The explorer lies relaxed in a small open wooden coffin wearing sunglasses and drinking juice through a straw, giving a thumbs up.'),
 ('card_any_7',     'The explorer is completely burnt black with only his white eyes and glasses visible, smoke rising from the helmet, his hair standing up straight.'),
 ('card_any_8',     'A big cartoon vulture carries the explorer away by his collar; he dangles in the air looking annoyed with arms crossed.'),
 ('card_any_9',     'The explorer sits on the ground crying a huge river of tears from both eyes, forming a puddle around him, glasses completely fogged.'),
 ('card_any_10',    'The explorer is stuck upside-down in the ground, only his legs and boots sticking out and wiggling, a little flower growing between them.'),
 ('card_streak_1',  'The explorer sits tired in front of a stone wall covered with a huge number of scratched tally lines, holding a tiny pencil-like stone, hopeless face.'),
 ('card_streak_2',  'The explorer has set up a tiny bed with a pillow, blanket and nightcap in the middle of the trap room and is sleeping on it, a spike stands next to him like a bedside lamp.'),
 ('card_streak_3',  'A tall wobbling tower made of many identical explorer helmets stacked up; the explorer holds the newest helmet in his hand, exhausted, with dark circles under his eyes.'),
 ('card_streak_4',  'The explorer slumps with a small personal rain cloud right above his head only, raining on him, gloomy face.'),
 ('card_near_1',    'The explorer lies face-down on the floor, one hand stretched toward a glowing exit door that is just a few centimetres away, light shining through the open door.'),
 ('card_near_2',    'The exit door has a mocking face and sticks its tongue out at the explorer, whose fingertips are inches from the door frame; he is stretching with all his strength.'),
 ('card_quick_1',   'A big puff of smoke shaped like the explorer remains on the ground with only his boots left standing, a speed line burst, a tiny stopwatch floating above.'),
 ('card_quick_2',   'A smug trap leans on its elbow and checks an imaginary wristwatch looking bored, while the explorer already lies flat as a pancake on the floor.'),
 ('card_win_1',     'The explorer celebrates on top of a green exit door with both arms in the air, sweating and happy, colorful confetti everywhere.'),
 ('card_win_2',     'The explorer proudly holds a dented golden trophy over his head, while in the background spikes and a saw blade look jealous and angry with tiny eyebrows.'),
 ('card_win_3',     'A row of cute traps (spike, saw, arrow turret, boulder) clap with tiny hands sarcastically while the explorer takes a deep bow.'),
 ('card_win_4',     'The explorer sits on a golden throne wearing his helmet as a crown, holding a gold coin like a scepter, defeated sad spikes lying at his feet.'),
 ('title_1',        'A dungeon entrance made of big stone blocks shaped like a wide grinning mouth, tiny traps peeking out of the dark inside, the small explorer standing at the entrance looking nervous, composition centered so it can be cropped to a wide picture.'),
]
assert len(CELLS) == 36

def prompt_grid(cells, cols, rows, extra=''):
    lines = [f"Create ONE image: a clean {cols}x{rows} grid sheet ({cols} columns, {rows} rows = {cols*rows} cells) of separate, equally sized SQUARE cells.",
             "Separate the cells with straight, solid BLACK grid lines (about 1% of the image width) that run all the way across the sheet, plus a black outer border; keep every drawing inside its own cell and never cross these lines.",
             "Number the cells in your head from left to right, then top to bottom, and fill each cell with exactly the scene below (do not draw the numbers).",
             "", "STYLE FOR ALL CELLS:", STYLE_IMG, "", "CELLS:"]
    for i, (key, desc) in enumerate(cells, 1):
        lines.append(f"Cell {i}: {desc}")
    if extra: lines += ['', extra]
    lines += ['', "Reference image (if attached): follow only its drawing style and the explorer character design, not its composition."]
    return '\n'.join(lines)

img_json = [dict(n=i+1, key=k, desc=d) for i, (k, d) in enumerate(CELLS)]
write(f'{ROOT}/content/images.json', json.dumps(img_json, ensure_ascii=False, indent=1))

P_ALL = prompt_grid(CELLS, 6, 6)
P_PARTS = [prompt_grid(CELLS[i*9:(i+1)*9], 3, 3) for i in range(4)]
imd = ['# برومبتات الصور\n',
 '''عندك خيارين:
- **خيار 1 (دفعة وحدة):** برومبت واحد لـ36 صورة بشبكة 6×6. يشتغل بشكل ممتاز فقط لو النموذج بيطلّع صورة كبيرة (2K/4K)، وإلا بتطلع الخلايا صغيرة.
- **خيار 2 (الأفضل عملياً):** 4 شبكات 3×3 (كل واحدة 9 صور)، ما بتفرق عليك لأن البرومبت جاهز.

أرفق مع كل برومبت صورة `style_reference.jpg` (ورقة بالصور الخمس الأولى) كمرجع للأسلوب والشخصية.
بعد التوليد نزّل الصور وسمّيها `sheet_all.png` أو `sheet_1.png`..`sheet_4.png` وارفعها هون.

الصور المطلوبة (36):
''']
for r in img_json: imd.append(f"{r['n']:>2}. `{r['key']}` — {r['desc']}")
imd.append('\n---\n## خيار 1: كل الصور بدفعة وحدة (6×6)\n```\n' + P_ALL + '\n```\n')
for i, p in enumerate(P_PARTS, 1):
    imd.append(f'\n---\n## خيار 2 — شبكة {i} من 4 (الخلايا {(i-1)*9+1}-{i*9})\n```\n{p}\n```\n')
write(f'{ROOT}/content/image_prompts.md', '\n'.join(imd))

# ------------------------------------------------------------------ generation-kit.html (صفحة نسخ ولصق)
def esc(s): return html.escape(s, quote=True)
cards = []
for bid, b in batches.items():
    text = '\n\n'.join(i['t'] for i in b['items'])
    cards.append(f'''<section class="card p{b['prio']}">
<h3><span class="n">{bid[:3]}</span> {esc(b['label'])} <small>{len(b['items'])} سطر · أولوية {b['prio']}</small></h3>
<div class="meta">Voice: <b>{b['voice']}</b> · احفظ باسم <code>{bid}.wav</code></div>
<div class="row"><button data-c="s-{bid}">انسخ Style</button><button data-c="t-{bid}" class="pri">انسخ Text</button></div>
<details><summary>معاينة النص</summary>
<pre id="s-{bid}" dir="ltr">{esc(b['style'])}</pre>
<pre id="t-{bid}">{esc(text)}</pre></details></section>''')
icards = []
icards.append(f'''<section class="card p1"><h3><span class="n">كلها</span> 36 صورة بدفعة وحدة (6×6) <small>تحتاج نموذج بدقة عالية</small></h3>
<div class="row"><button data-c="i-all" class="pri">انسخ البرومبت</button></div><details><summary>معاينة</summary><pre id="i-all" dir="ltr">{esc(P_ALL)}</pre></details></section>''')
for i, p in enumerate(P_PARTS, 1):
    icards.append(f'''<section class="card p1"><h3><span class="n">شبكة {i}</span> الصور {(i-1)*9+1}–{i*9} (3×3) <small>الأفضل عملياً</small></h3>
<div class="row"><button data-c="i-{i}" class="pri">انسخ البرومبت</button></div><details><summary>معاينة</summary><pre id="i-{i}" dir="ltr">{esc(p)}</pre></details></section>''')

KIT_BODY = '''<title>عدّة التوليد</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap">
<style>
/* layout: one narrow column of batch cards, the two most-used buttons on the left edge of each card */
:root{--bg:#eef1ee;--fg:#18211d;--card:#ffffff;--line:#d3dad4;--accent:#0c7a69;--accent-fg:#ffffff;--mut:#58665f;--ok:#2a7d3f;--first:#c2410c;
 --ui:'Cairo','Segoe UI',Tahoma,system-ui,sans-serif;--mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#121816;--fg:#e8eeea;--card:#1b2420;--line:#33423b;--accent:#4fd1b5;--accent-fg:#06211b;--mut:#9db0a6;--ok:#6fd48a;--first:#fb923c;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#121816;--fg:#e8eeea;--card:#1b2420;--line:#33423b;--accent:#4fd1b5;--accent-fg:#06211b;--mut:#9db0a6;--ok:#6fd48a;--first:#fb923c;color-scheme:dark}
body{background:var(--bg);color:var(--fg);font:16px/1.7 var(--ui);margin:0}
#wrap{max-width:760px;margin:0 auto;padding-inline:16px;padding-block:20px 48px}
h1{font-size:1.6rem;margin:0 0 6px;font-weight:900;text-wrap:balance}
.note{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px 14px;color:var(--mut);margin-block:10px}
.tabs{display:flex;gap:8px;margin-block:14px 6px;position:sticky;top:env(safe-area-inset-top,0px);background:var(--bg);padding-block:8px;z-index:2}
.tabs button{flex:1;padding:10px;border-radius:10px;border:1px solid var(--line);background:var(--card);color:var(--fg);font:inherit;font-weight:700;cursor:pointer}
.tabs button[aria-selected="true"]{background:var(--accent);color:var(--accent-fg);border-color:var(--accent)}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin-block:10px}
.card.p1{border-inline-start:4px solid var(--first)}
h3{margin:0 0 2px;font-size:1.02rem;display:flex;flex-wrap:wrap;gap:4px 8px;align-items:baseline}
h3 small{color:var(--mut);font-weight:400;font-size:.85rem}
.n{font-family:var(--mono);background:var(--bg);border:1px solid var(--line);border-radius:6px;padding:0 7px;font-size:.85rem}
.meta{color:var(--mut);font-size:.9rem;margin-bottom:8px}
code{font-family:var(--mono);background:var(--bg);padding:1px 6px;border-radius:6px;font-size:.88em}
.row{display:flex;gap:8px;flex-wrap:wrap}
.row button{padding:9px 14px;border-radius:9px;border:1px solid var(--line);background:var(--bg);color:var(--fg);font:inherit;cursor:pointer}
.row button.pri{background:var(--accent);color:var(--accent-fg);border-color:var(--accent);font-weight:700}
.row button.done{background:var(--ok);border-color:var(--ok);color:#fff}
button:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
details{margin-top:8px;min-width:0}summary{cursor:pointer;color:var(--mut)}
pre{white-space:pre-wrap;word-break:break-word;background:var(--bg);border-radius:8px;padding:10px;font:inherit;font-size:.92rem;margin:8px 0 0}
pre[dir="ltr"]{font-family:var(--mono);font-size:.82rem;text-align:left}
</style>
<div id="wrap" dir="rtl" lang="ar">
<h1>أصوات زنزانة الفخاخ</h1>
<div class="note">انسخ، الصق في Google AI Studio، نزّل الملف باسم الدفعة، وارفع كل الملفات للمحادثة. البطاقات ذات الشريط البرتقالي (أول 13 دفعة) هي الأهم، ابدأ فيها. الصوت المكتوب فوق كل دفعة مقترح، غيّره لو ما عجبك.</div>
<section id="v">
<div class="note"><b>AI Studio ← Generate Media ← Speech generation:</b> اختر Single-speaker، الصق Style في Style instructions، اختر الـ Voice، الصق Text، اضغط Run، ونزّل الملف باسم الدفعة (<code>B01_lb.wav</code> مثلاً — الاسم يبدأ برقم الدفعة).</div>
%VCARDS%
</section>
</div>
<script>
const $=s=>document.querySelector(s);
function selectText(el){const r=document.createRange();r.selectNodeContents(el);const s=getSelection();s.removeAllRanges();s.addRange(r)}
document.querySelectorAll('[data-c]').forEach(b=>b.onclick=async()=>{
 const el=document.getElementById(b.dataset.c),old=b.textContent;let ok=false;
 try{await navigator.clipboard.writeText(el.textContent);ok=true}catch(e){}
 if(!ok){const d=el.closest('details');if(d)d.open=true;selectText(el);try{ok=document.execCommand('copy')}catch(e){}}
 b.textContent=ok?'تم النسخ':'حدّد النص وانسخه يدوياً';b.classList.add('done');setTimeout(()=>{b.textContent=old;b.classList.remove('done')},1600)});
</script>'''
cards = []
for bid, b in batches.items():
    text = '\n\n'.join(i['t'] for i in b['items'])
    cards.append(f'''<div class="card p{b['prio']}">
<h3><span class="n">{bid[:3]}</span> {esc(b['label'])} <small>{len(b['items'])} سطر · أولوية {b['prio']}</small></h3>
<div class="meta">Voice: <b>{b['voice']}</b> · احفظ باسم <code>{bid}.wav</code></div>
<div class="row"><button data-c="s-{bid}">انسخ Style</button><button data-c="t-{bid}" class="pri">انسخ Text</button></div>
<details><summary>معاينة النص</summary>
<pre id="s-{bid}" dir="ltr">{esc(b['style'])}</pre>
<pre id="t-{bid}">{esc(text)}</pre></details></div>''')
icards = [f'''<div class="card p1"><h3><span class="n">كلها</span> 36 صورة بدفعة وحدة (6×6) <small>تحتاج نموذجاً بدقة عالية</small></h3>
<div class="row"><button data-c="i-all" class="pri">انسخ البرومبت</button></div><details><summary>معاينة</summary><pre id="i-all" dir="ltr">{esc(P_ALL)}</pre></details></div>''']
for i, p in enumerate(P_PARTS, 1):
    icards.append(f'''<div class="card p1"><h3><span class="n">شبكة {i}</span> الصور {(i-1)*9+1}–{i*9} (3×3) <small>الأفضل عملياً</small></h3>
<div class="row"><button data-c="i-{i}" class="pri">انسخ البرومبت</button></div><details><summary>معاينة</summary><pre id="i-{i}" dir="ltr">{esc(p)}</pre></details></div>''')
body = KIT_BODY.replace('%NB%', str(len(batches))).replace('%VCARDS%', '\n'.join(cards)).replace('%ICARDS%', '\n'.join(icards))
write(f'{ROOT}/content/generation-kit.artifact.html', body)
write(f'{ROOT}/content/generation-kit.html', '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>\n' + body + '\n</body></html>')
print('ok')
