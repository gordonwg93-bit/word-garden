/* =========================================================
   games/speedQuiz.js
   A quick 5-round "hear it, tap it" review round across a
   mix of words (not tied to one word), for extra replay
   value from the Games hub and to spread review across the
   whole garden rather than one word at a time.
   ========================================================= */
const SpeedQuizGame = (() => {
  async function render(root) {
    const store = Storage.getRoot();
    const profile = store.profiles[store.activeProfileId];
    const introducedIds = Object.keys(profile.wordStats);

    if (introducedIds.length < 4) {
      const wrap = document.createElement('div');
      wrap.className = 'screen';
      wrap.innerHTML = `
        <div class="topbar"><button class="btn--icon" id="exitBtn" style="background:var(--color-white); box-shadow:var(--shadow-soft);">✕</button></div>
        <div class="results"><div class="results__emoji">🌱</div><h2>Learn a few more words first!</h2></div>`;
      root.appendChild(wrap);
      wrap.querySelector('#exitBtn').addEventListener('click', () => Router.navigate('games'));
      return;
    }

    const all = await WordData.loadAll();
    const notMastered = introducedIds.filter(id => !profile.wordStats[id].mastered);
    const pool = GameShared.shuffle([...notMastered, ...introducedIds]).filter((v, i, a) => a.indexOf(v) === i).slice(0, 5);
    const quizWords = pool.map(id => all.find(w => w.id === id)).filter(Boolean);

    let round = 0;
    let correctCount = 0;

    async function playRound() {
      const word = quizWords[round];
      const distractors = await GameShared.randomDistractors(word, 3);
      const tiles = GameShared.shuffle([word, ...distractors]);

      const wrap = document.createElement('div');
      wrap.className = 'screen';
      wrap.innerHTML = `
        <div class="topbar">
          <button class="btn--icon" id="exitBtn" style="background:var(--color-white); box-shadow:var(--shadow-soft);">✕</button>
          <h1 class="topbar__title">⚡ Speed Quiz ${round + 1}/${quizWords.length}</h1>
          <div style="width:44px;"></div>
        </div>
        <div class="choice-grid" id="grid" style="margin-top:20px;">
          ${tiles.map(t => `<button class="choice-tile" data-id="${t.id}">${t.emoji}</button>`).join('')}
        </div>
      `;
      root.innerHTML = '';
      root.appendChild(wrap);
      wrap.querySelector('#exitBtn').addEventListener('click', () => Router.navigate('games'));

      Speech.speakBilingual(word.word, word.wordZh);

      wrap.querySelectorAll('[data-id]').forEach(tile => {
        tile.addEventListener('click', () => {
          const correct = tile.dataset.id === word.id;
          tile.classList.add(correct ? 'choice-tile--correct' : 'choice-tile--wrong');
          GameShared.recordResult(word.id, 'speedQuiz', correct);
          if (correct) correctCount++;
          setTimeout(() => {
            round++;
            if (round < quizWords.length) playRound();
            else showResults();
          }, 700);
        });
      });
    }

    function showResults() {
      const stars = '⭐'.repeat(correctCount) + '☆'.repeat(quizWords.length - correctCount);
      const wrap = document.createElement('div');
      wrap.className = 'screen';
      wrap.innerHTML = `
        <div class="results">
          <div class="results__emoji">${correctCount === quizWords.length ? '🏆' : '🎉'}</div>
          <h2>${correctCount} / ${quizWords.length} correct!</h2>
          <div class="results__stars">${stars}</div>
          <button class="btn btn--sun" id="againBtn">Play again</button>
          <button class="btn btn--ghost" id="doneBtn">Back to Games</button>
        </div>`;
      root.innerHTML = '';
      root.appendChild(wrap);
      Speech.speakEncouragement(correctCount === quizWords.length ? "Perfect score, you little ripper!" : "Good effort, mate!");
      wrap.querySelector('#againBtn').addEventListener('click', () => Router.navigate('play', { game: 'speedQuiz' }));
      wrap.querySelector('#doneBtn').addEventListener('click', () => Router.navigate('games'));
    }

    playRound();
  }

  return { render };
})();
