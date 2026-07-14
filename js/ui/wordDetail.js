/* =========================================================
   wordDetail.js — 'word' route
   The big single-word hero screen. This is the primary
   "first exposure" screen: huge emoji, huge word, audio,
   then a choice of games to practise it.
   ========================================================= */
const WordDetail = (() => {
  async function render(root, params) {
    const wordId = params.id;
    const word = await WordData.getWordById(wordId);
    if (!word) { Router.navigate('letters'); return; }

    const store = Storage.getRoot();
    const profile = store.profiles[store.activeProfileId];
    const letter = wordId.charAt(0);
    const siblings = await WordData.loadLetter(letter);
    const myIndex = siblings.findIndex(w => w.id === wordId);
    const prevWord = siblings[myIndex - 1];
    const nextWord = siblings[myIndex + 1];

    const zhFirst = profile.languageMode === 'zh-first';
    const heroText = zhFirst ? word.wordZh : word.word;
    const subText = zhFirst ? `${word.word}` : `${word.wordZh} · ${word.pinyin}`;

    const wrap = document.createElement('div');
    wrap.className = 'screen';
    wrap.innerHTML = `
      <div class="topbar">
        <button class="btn--icon" id="backBtn" style="background:var(--color-white); box-shadow:var(--shadow-soft);">←</button>
        <span class="word-stage__tag">${word.partOfSpeech}</span>
        <div style="width:44px;"></div>
      </div>

      <div class="word-stage">
        <div class="word-stage__emoji">${word.emoji}</div>
        <div class="word-stage__word">${heroText}</div>
        <div class="word-stage__zh">
          <span class="word-stage__zh-char">${subText}</span>
        </div>
        ${zhFirst ? `<div class="word-stage__pinyin">${word.pinyin}</div>` : ''}
        <div class="word-stage__audio-row">
          <button class="btn btn--secondary" id="playBtn">🔊 Hear the word</button>
        </div>
        <p class="word-stage__sentence">"${word.sentenceEn}"<br>"${word.sentenceZh}"</p>
        <div class="word-stage__audio-row">
          <button class="btn btn--secondary" id="playSentenceBtn">🔊 Hear the sentence</button>
        </div>

        <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:center; margin-top:14px;">
          <button class="btn btn--sun" data-play="listenChoose">🎧 Listen & Choose</button>
          <button class="btn btn--sun" data-play="missingLetter">🧩 Fill the Gap</button>
          <button class="btn btn--sun" data-play="wordBuilder">🔤 Build it</button>
          <button class="btn btn--sun" data-play="sentenceBuilder">📝 Make a Sentence</button>
          <button class="btn btn--sun" data-play="letterTrace">✏️ Trace it</button>
        </div>

        <div class="word-stage__nav">
          <button class="btn btn--ghost" id="prevBtn" ${prevWord ? '' : 'disabled'}>← Back</button>
          <button class="btn btn--ghost" id="nextBtn" ${nextWord ? '' : 'disabled'}>Next →</button>
        </div>
      </div>
    `;
    root.appendChild(wrap);

    const doSpeak = () => Speech.speakBilingual(word.word, word.wordZh);
    wrap.querySelector('#playBtn').addEventListener('click', doSpeak);
    doSpeak(); // auto-play on first arrival, matches "lots of sound" requirement

    wrap.querySelector('#playSentenceBtn').addEventListener('click', () => Speech.speakBilingual(word.sentenceEn, word.sentenceZh));

    wrap.querySelector('#backBtn').addEventListener('click', () => Router.navigate('letter', { l: letter }));
    if (prevWord) wrap.querySelector('#prevBtn').addEventListener('click', () => Router.navigate('word', { id: prevWord.id }));
    if (nextWord) wrap.querySelector('#nextBtn').addEventListener('click', () => Router.navigate('word', { id: nextWord.id }));

    wrap.querySelectorAll('[data-play]').forEach(btn => {
      btn.addEventListener('click', () => Router.navigate('play', { game: btn.dataset.play, word: wordId }));
    });

    // First view of a word counts as "seen" for progress purposes.
    const stat = profile.wordStats[wordId] || { seenCount: 0, correctStreak: 0, gamesUsedForStreak: [], mastered: false, lastSeen: null };
    stat.seenCount += 1;
    stat.lastSeen = new Date().toISOString();
    profile.wordStats[wordId] = stat;
    Storage.saveRoot(store);
  }

  return { render };
})();
