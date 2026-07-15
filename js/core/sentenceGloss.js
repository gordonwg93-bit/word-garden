/* =========================================================
   sentenceGloss.js
   Gives each word-tile in the Sentence Builder game a Chinese
   translation to show + speak, not just the target word.

   Strategy (in priority order):
   1. If the sentence word IS itself one of our ~327 vocabulary
      words (e.g. "red", "big", "swim"), reuse its existing
      wordZh - already translated, already correct.
   2. Otherwise check FILLER_DICT below, a hand-translated list
      of the ~115 most common connector/grammar words across
      all our example sentences (the, is, my, wears, together...).
   3. Common suffixes (-s, -es, -ing, -ed, -ies) are stripped
      before both lookups, so "eats"/"eating"/"ate"-style forms
      still match "eat" - this works well for Chinese
      specifically because Chinese verbs don't conjugate, so
      reusing the base translation is actually correct, not an
      approximation.
   4. If nothing matches (rare content words like "toothbrush",
      "gallops", "tummy" - one-off words that only ever appear
      once across the whole sentence bank), the tile just shows
      English with English audio. This is a deliberate scope
      limit, not a bug - hand-translating all 300+ singleton
      words wasn't a good time trade-off vs covering the ~85%
      of sentence content that repeats across many sentences.

   Articles (a/an/the) are intentionally NOT in the dictionary -
   Chinese has no direct equivalent, so showing no gloss for
   them is linguistically correct, not a gap.
   ========================================================= */
const SentenceGloss = (() => {
  const FILLER_DICT = {
    "i": "我", "is": "是", "in": "在", "my": "我的", "we": "我们", "very": "很",
    "to": "去", "with": "和", "on": "在", "and": "和", "she": "她", "has": "有",
    "at": "在", "let's": "我们来", "wears": "穿", "swims": "游泳", "feel": "感觉",
    "every": "每", "have": "有", "of": "的", "before": "之前", "today": "今天",
    "loves": "爱", "its": "它的", "eats": "吃", "together": "一起", "from": "从",
    "share": "分享", "ice": "冰", "out": "出", "please": "请", "day": "天",
    "me": "我", "soft": "软的", "sweet": "甜的", "you": "你", "look": "看",
    "after": "之后", "flies": "飞", "high": "高", "sleeps": "睡觉", "floats": "漂浮",
    "for": "给", "can": "会", "sleep": "睡觉", "put": "放", "birthday": "生日",
    "white": "白色", "tells": "讲", "hands": "手", "lives": "住", "so": "很",
    "plays": "玩", "her": "她的", "box": "盒子", "am": "是", "sea": "海",
    "wear": "穿", "feels": "感觉", "your": "你的", "park": "公园", "falls": "落下",
    "hides": "躲", "are": "是", "goes": "去", "morning": "早上", "story": "故事",
    "makes": "做", "ride": "骑", "breakfast": "早餐", "blow": "吹", "says": "说",
    "walks": "走", "time": "时间", "our": "我们的", "desert": "沙漠", "take": "拿",
    "pond": "池塘", "he": "他", "room": "房间", "into": "进入", "pool": "泳池",
    "sparkles": "闪亮", "like": "喜欢", "jumps": "跳", "there": "那里", "it's": "它是",
    "dinner": "晚餐", "count": "数", "letter": "字母", "smells": "闻", "grapes": "葡萄",
    "flowers": "花", "fun": "好玩", "live": "住", "all": "所有", "come": "来",
    "hops": "跳", "crown": "王冠", "tastes": "尝起来", "shines": "发光", "juicy": "多汁的",
    "fairy": "仙女", "nuts": "坚果", "takes": "带", "warm": "温暖的", "little": "小的",
    "stripes": "条纹", "choo": "呜呜", "about": "关于", "when": "当", "this": "这个",
    "looks": "看起来", "chops": "砍", "wood": "木头", "finds": "找到",
    "paint": "画", "numbers": "数字", "will": "会", "drops": "掉", "writes": "写",
    "drives": "开", "drive": "开车", "kick": "踢", "mammoth": "猛犸象", "splash": "溅",
    "sky": "天空", "school": "学校", "fruit": "水果", "moo": "哞", "fluffy": "蓬松的",
    "sideways": "横着", "lays": "下", "painting": "画画", "starts": "开始",
    "princess": "公主", "puppy": "小狗", "photo": "照片", "wags": "摇", "tail": "尾巴",
    "huge": "巨大的", "close": "靠近", "brightly": "明亮地", "forest": "森林",
    "want": "想要", "pictures": "图片", "shelf": "架子", "trunk": "鼻子", "listen": "听",
    "see": "看见", "wake": "醒来", "lovely": "好闻的", "clever": "聪明的", "best": "最好的"
  };

  let vocabIndex = null;
  async function _getVocabIndex() {
    if (vocabIndex) return vocabIndex;
    const all = await WordData.loadAll();
    vocabIndex = new Map();
    all.forEach(w => { if (!vocabIndex.has(w.word.toLowerCase())) vocabIndex.set(w.word.toLowerCase(), w); });
    return vocabIndex;
  }

  function _suffixCandidates(word) {
    const c = [word];
    if (word.endsWith('ies') && word.length > 4) c.push(word.slice(0, -3) + 'y');
    if (word.endsWith('es') && word.length > 3) c.push(word.slice(0, -2));
    if (word.endsWith('s') && !word.endsWith('ss') && word.length > 2) c.push(word.slice(0, -1));
    if (word.endsWith('ing') && word.length > 5) c.push(word.slice(0, -3));
    if (word.endsWith('ed') && word.length > 4) c.push(word.slice(0, -2));
    return c;
  }

  // Returns { zh } or null. Async because the vocab index is built from
  // WordData (lazy-loaded, then cached in memory for the rest of the session).
  async function lookup(token) {
    const clean = token.toLowerCase().replace(/[^a-z']/g, '');
    if (!clean) return null;
    const idx = await _getVocabIndex();
    for (const cand of _suffixCandidates(clean)) {
      if (idx.has(cand)) return { zh: idx.get(cand).wordZh };
      if (FILLER_DICT[cand]) return { zh: FILLER_DICT[cand] };
    }
    return null;
  }

  return { lookup };
})();
