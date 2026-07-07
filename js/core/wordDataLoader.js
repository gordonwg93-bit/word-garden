/* =========================================================
   wordDataLoader.js

   HOW TO ADD MORE WORDS (this is the whole point of this file):
   1. Open /data/words/<letter>.json (e.g. b.json)
   2. Copy an existing word object and change its fields
   3. Give it a unique "id" (letter + number, e.g. "b013")
   4. Save. That's it — nothing else in the app needs to change.

   HOW TO ADD A BRAND NEW LETTER SET (already all 26 exist,
   but if you ever split one letter into two files, etc.):
   1. Create /data/words/<letter>.json following the same shape
   2. Add an entry to /data/words/index.json

   Word object shape:
   {
     "id": "a001",
     "word": "apple",
     "wordZh": "苹果",
     "pinyin": "píngguǒ",
     "emoji": "🍎",
     "partOfSpeech": "noun",          // noun | verb | adjective | adverb
     "sentenceEn": "I eat a red apple.",
     "sentenceZh": "我吃一个红苹果。"
   }
   ========================================================= */
const WordData = (() => {
  let letterCache = {};   // letter -> array of word objects
  let indexCache = null;

  async function loadIndex() {
    if (indexCache) return indexCache;
    const res = await fetch('data/words/index.json');
    indexCache = await res.json();
    return indexCache;
  }

  async function loadLetter(letter) {
    const key = letter.toLowerCase();
    if (letterCache[key]) return letterCache[key];
    const res = await fetch(`data/words/${key}.json`);
    const data = await res.json();
    letterCache[key] = data.words || [];
    return letterCache[key];
  }

  async function loadAll() {
    const idx = await loadIndex();
    const all = await Promise.all(idx.letters.map(l => loadLetter(l.letter)));
    return all.flat();
  }

  async function getWordById(wordId) {
    const letter = wordId.charAt(0);
    const words = await loadLetter(letter);
    return words.find(w => w.id === wordId) || null;
  }

  return { loadIndex, loadLetter, loadAll, getWordById };
})();
