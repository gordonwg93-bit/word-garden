/* =========================================================
   ui/gamesHub.js — 'games' route
   Kids don't pick a word here, just a game — we auto-pick a
   sensible word (favouring introduced-but-not-mastered) so
   there's no decision fatigue before the fun starts.
   ========================================================= */
const GamesHub = (() => {
  async function render(root) {
    const store = Storage.getRoot();
    const profile = store.profiles[store.activeProfileId];
    const introducedIds = Object.keys(profile.wordStats);

    const wrap = document.createElement('div');
    wrap.className = 'screen';
    wrap.innerHTML = `
      <div class="topbar"><h1 class="topbar__title">🎮 Games</h1></div>
      <div style="display:flex; flex-direction:column; gap:14px;">
        <button class="card" data-game="listenChoose" style="display:flex; align-items:center; gap:16px; text-align:left;">
          <span style="font-size:2.4rem;">🎧</span>
          <span><strong style="font-family:var(--font-display);">Listen & Choose</strong><br><span style="color:var(--color-ink-light); font-size:0.9rem;">Hear a word, tap the picture</span></span>
        </button>
        <button class="card" data-game="missingLetter" style="display:flex; align-items:center; gap:16px; text-align:left;">
          <span style="font-size:2.4rem;">🧩</span>
          <span><strong style="font-family:var(--font-display);">Fill the Gap</strong><br><span style="color:var(--color-ink-light); font-size:0.9rem;">Most letters are there — find the missing ones</span></span>
        </button>
        <button class="card" data-game="wordBuilder" style="display:flex; align-items:center; gap:16px; text-align:left;">
          <span style="font-size:2.4rem;">🔤</span>
          <span><strong style="font-family:var(--font-display);">Word Builder</strong><br><span style="color:var(--color-ink-light); font-size:0.9rem;">Tap the letters to spell it</span></span>
        </button>
        <button class="card" data-game="sentenceBuilder" style="display:flex; align-items:center; gap:16px; text-align:left;">
          <span style="font-size:2.4rem;">📝</span>
          <span><strong style="font-family:var(--font-display);">Make a Sentence</strong><br><span style="color:var(--color-ink-light); font-size:0.9rem;">Put the words in order</span></span>
        </button>
        <button class="card" data-game="letterTrace" style="display:flex; align-items:center; gap:16px; text-align:left;">
          <span style="font-size:2.4rem;">✏️</span>
          <span><strong style="font-family:var(--font-display);">Trace It</strong><br><span style="color:var(--color-ink-light); font-size:0.9rem;">Practise writing with your finger</span></span>
        </button>
        <button class="card" id="memoryBtn" style="display:flex; align-items:center; gap:16px; text-align:left;">
          <span style="font-size:2.4rem;">🧠</span>
          <span><strong style="font-family:var(--font-display);">Memory Match</strong><br><span style="color:var(--color-ink-light); font-size:0.9rem;">Review words you already know</span></span>
        </button>
        <button class="card" id="speedQuizBtn" style="display:flex; align-items:center; gap:16px; text-align:left;">
          <span style="font-size:2.4rem;">⚡</span>
          <span><strong style="font-family:var(--font-display);">Speed Quiz</strong><br><span style="color:var(--color-ink-light); font-size:0.9rem;">5 quick rounds mixing your words</span></span>
        </button>
      </div>
    `;
    root.appendChild(wrap);
    root.appendChild(GardenView.bottomNav('games'));

    wrap.querySelector('#memoryBtn').addEventListener('click', () => Router.navigate('play', { game: 'memoryGame' }));
    wrap.querySelector('#speedQuizBtn').addEventListener('click', () => Router.navigate('play', { game: 'speedQuiz' }));

    wrap.querySelectorAll('[data-game]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const wordId = await _pickWord(introducedIds);
        if (!wordId) { alert('Learn a word first from the Letters garden!'); return; }
        Router.navigate('play', { game: btn.dataset.game, word: wordId });
      });
    });
  }

  async function _pickWord(introducedIds) {
    const store = Storage.getRoot();
    const profile = store.profiles[store.activeProfileId];
    if (!introducedIds.length) return null;
    const notMastered = introducedIds.filter(id => !profile.wordStats[id].mastered);
    const pool = notMastered.length ? notMastered : introducedIds;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  return { render };
})();
