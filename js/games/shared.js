/* =========================================================
   games/shared.js
   Common helpers reused by every game module so each game
   file only contains its own unique gameplay logic.
   ========================================================= */
const GameShared = (() => {
  const ENCOURAGEMENTS = [
    'Ripper effort!', 'You little beauty!', 'Good on ya!', "Ace job!", 'Too easy for you!', 'Beauty!'
  ];

  async function randomDistractors(targetWord, count) {
    const all = await WordData.loadAll();
    const pool = all.filter(w => w.id !== targetWord.id && w.emoji !== targetWord.emoji);
    const shuffled = pool.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  function shuffle(arr) {
    return [...arr].sort(() => Math.random() - 0.5);
  }

  function recordResult(wordId, gameId, wasCorrect) {
    const store = Storage.getRoot();
    const profile = store.profiles[store.activeProfileId];
    Progress.recordAttempt(store, profile.id, wordId, gameId, wasCorrect);
    if (wasCorrect) DailyChallenge.markWordDone(store, profile.id, wordId);
    Storage.saveRoot(store);
  }

  function celebrate(text = '⭐') {
    SFX.playCelebrate();
    const el = document.createElement('div');
    el.className = 'celebrate-burst';
    el.innerHTML = `<div class="celebrate-burst__text">${text}</div>`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  function correctFeedback() { SFX.playCorrect(); }
  function wrongFeedback() { SFX.playWrong(); }

  function randomEncouragement() {
    return ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
  }

  function backBar(word) {
    const bar = document.createElement('div');
    bar.className = 'topbar';
    bar.innerHTML = `
      <button class="btn--icon" id="exitGameBtn" style="background:var(--color-white); box-shadow:var(--shadow-soft);">✕</button>
      <h1 class="topbar__title">${word.emoji} ${word.word}</h1>
      <div style="width:44px;"></div>
    `;
    bar.querySelector('#exitGameBtn').addEventListener('click', () => Router.navigate('word', { id: word.id }));
    return bar;
  }

  // Bindi's instruction bubble, always bilingual with a tap-to-hear speaker,
  // so a Chinese-speaking child isn't stuck relying on English reading to
  // follow what to do.
  function bindiBubble(textEn, textZh) {
    return `
      <div class="bindi-bubble">
        <div class="bindi-bubble__avatar">🧚</div>
        <div class="bindi-bubble__text">
          <div>${textEn}</div>
          <div style="font-family:var(--font-write); color:var(--color-lilac-dk); margin-top:2px;">${textZh}</div>
        </div>
        <button class="btn--icon" data-bubble-speak style="background:var(--color-white); box-shadow:var(--shadow-soft); font-size:1.1rem; width:40px; height:40px; flex-shrink:0;">🔊</button>
      </div>`;
  }

  function wireBubble(root, textEn, textZh) {
    const btn = root.querySelector('[data-bubble-speak]');
    if (!btn) return;
    btn.addEventListener('click', () => Speech.speakBilingual(textEn, textZh));
  }

  return { randomDistractors, shuffle, recordResult, celebrate, randomEncouragement, backBar, correctFeedback, wrongFeedback, bindiBubble, wireBubble };
})();
