/* =========================================================
   games/memoryGame.js
   Classic flip-and-match, but the deck is built from words
   the child has already met (weighted toward not-yet-mastered
   ones) — this is the spaced-repetition review loop that
   keeps old words alive instead of forgotten after day one.
   No single "target word", so it lives under the Games hub
   rather than a word's detail screen.
   ========================================================= */
const MemoryGame = (() => {
  async function render(root) {
    const store = Storage.getRoot();
    const profile = store.profiles[store.activeProfileId];
    const introducedIds = Object.keys(profile.wordStats);

    const wrap = document.createElement('div');
    wrap.className = 'screen';

    if (introducedIds.length < 3) {
      wrap.innerHTML = `
        <div class="topbar"><button class="btn--icon" id="exitBtn" style="background:var(--color-white); box-shadow:var(--shadow-soft);">✕</button></div>
        <div class="results">
          <div class="results__emoji">🌱</div>
          <h2>Learn a few more words first!</h2>
          <p>Memory match needs at least 3 words in your garden.</p>
        </div>`;
      root.appendChild(wrap);
      wrap.querySelector('#exitBtn').addEventListener('click', () => Router.navigate('games'));
      return;
    }

    const all = await WordData.loadAll();
    const notMastered = introducedIds.filter(id => !profile.wordStats[id].mastered);
    const pickIds = GameShared.shuffle([...notMastered, ...introducedIds]).filter((v, i, a) => a.indexOf(v) === i).slice(0, 6);
    const words = pickIds.map(id => all.find(w => w.id === id)).filter(Boolean);

    const cards = GameShared.shuffle([
      ...words.map(w => ({ key: w.id, type: 'emoji', display: w.emoji })),
      ...words.map(w => ({ key: w.id, type: 'word', display: w.word }))
    ]);

    wrap.innerHTML = `
      <div class="topbar">
        <button class="btn--icon" id="exitBtn" style="background:var(--color-white); box-shadow:var(--shadow-soft);">✕</button>
        <h1 class="topbar__title">🧠 Memory Match</h1>
        <div style="width:44px;"></div>
      </div>
      <div class="memory-grid" id="grid">
        ${cards.map((c, i) => `<button class="memory-card" data-i="${i}" data-key="${c.key}"><span class="memory-card__face">❓</span></button>`).join('')}
      </div>
    `;
    root.appendChild(wrap);
    wrap.querySelector('#exitBtn').addEventListener('click', () => Router.navigate('games'));

    let flipped = [];
    let lock = false;
    let matchedCount = 0;

    wrap.querySelectorAll('.memory-card').forEach((cardEl, i) => {
      cardEl.addEventListener('click', () => {
        if (lock || cardEl.classList.contains('memory-card--flipped') || cardEl.classList.contains('memory-card--matched')) return;
        cardEl.classList.add('memory-card--flipped');
        cardEl.querySelector('span').textContent = cards[i].display;
        if (cards[i].type === 'word') cardEl.querySelector('span').style.fontFamily = 'var(--font-write)';
        flipped.push(i);

        if (flipped.length === 2) {
          lock = true;
          const [a, b] = flipped;
          const isMatch = cards[a].key === cards[b].key && cards[a].type !== cards[b].type;
          setTimeout(() => {
            const elA = wrap.querySelectorAll('.memory-card')[a];
            const elB = wrap.querySelectorAll('.memory-card')[b];
            if (isMatch) {
              elA.classList.add('memory-card--matched');
              elB.classList.add('memory-card--matched');
              GameShared.recordResult(cards[a].key, 'memoryGame', true);
              matchedCount++;
              if (matchedCount === words.length) {
                setTimeout(() => {
                  GameShared.celebrate('YOU WON! 🏆');
                  Speech.speakEncouragement('Bonza! You matched them all!');
                  setTimeout(() => Router.navigate('games'), 1200);
                }, 200);
              }
            } else {
              elA.classList.remove('memory-card--flipped');
              elB.classList.remove('memory-card--flipped');
              elA.querySelector('span').textContent = '❓';
              elB.querySelector('span').textContent = '❓';
            }
            flipped = [];
            lock = false;
          }, 700);
        }
      });
    });
  }

  return { render };
})();
