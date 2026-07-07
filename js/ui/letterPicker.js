/* =========================================================
   letterPicker.js — 'letters' route (A-Z grid) and
   'letter' route (word list for one letter)
   ========================================================= */
const LetterPicker = (() => {
  async function renderGrid(root) {
    const store = Storage.getRoot();
    const profile = store.profiles[store.activeProfileId];
    const idx = await WordData.loadIndex();

    const wrap = document.createElement('div');
    wrap.className = 'screen';
    wrap.innerHTML = `
      <div class="topbar"><h1 class="topbar__title">🔤 Pick a Letter</h1></div>
      <div class="letter-grid" id="grid"></div>
    `;
    root.appendChild(wrap);
    root.appendChild(GardenView.bottomNav('letters'));

    const grid = wrap.querySelector('#grid');
    for (const entry of idx.letters) {
      const words = await WordData.loadLetter(entry.letter);
      const completion = Progress.letterCompletion(store, profile.id, words);
      const pct = Math.round(completion * 100);
      const circumference = 2 * Math.PI * 26;
      const offset = circumference * (1 - completion);

      const tile = document.createElement('button');
      tile.className = 'letter-tile';
      tile.innerHTML = `
        <svg width="0" height="0"></svg>
        <div style="position:relative; width:44px; height:44px;">
          <svg viewBox="0 0 60 60" style="position:absolute; inset:0; transform:rotate(-90deg);">
            <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(0,0,0,0.08)" stroke-width="6"></circle>
            <circle cx="30" cy="30" r="26" fill="none" stroke="var(--color-meadow)" stroke-width="6"
              stroke-linecap="round" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"></circle>
          </svg>
          <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center;" class="letter-tile__char">${entry.letter.toUpperCase()}</div>
        </div>
        <span class="letter-tile__badge">${words.length} words</span>
      `;
      tile.addEventListener('click', () => Router.navigate('letter', { l: entry.letter }));
      grid.appendChild(tile);
    }
  }

  async function renderLetterDetail(root, params) {
    const letter = params.l || 'a';
    const store = Storage.getRoot();
    const profile = store.profiles[store.activeProfileId];
    const words = await WordData.loadLetter(letter);

    const wrap = document.createElement('div');
    wrap.className = 'screen';
    wrap.innerHTML = `
      <div class="topbar">
        <button class="btn--icon" id="backBtn" style="background:var(--color-white); box-shadow:var(--shadow-soft);">←</button>
        <h1 class="topbar__title">Letter ${letter.toUpperCase()}</h1>
        <div style="width:44px;"></div>
      </div>
      <div style="display:flex; flex-direction:column; gap:12px; padding-bottom:20px;">
        ${words.map(w => {
          const stat = profile.wordStats[w.id];
          const status = stat && stat.mastered ? '🌟' : (stat ? '🌱' : '⚪');
          return `
          <button class="card" data-word="${w.id}" style="display:flex; align-items:center; gap:16px; text-align:left; width:100%;">
            <span style="font-size:2.4rem;">${w.emoji}</span>
            <span style="flex:1;">
              <div style="font-family:var(--font-write); font-size:1.3rem; font-weight:700;">${w.word}</div>
              <div style="color:var(--color-ink-light); font-size:0.9rem;">${w.wordZh} · ${w.pinyin}</div>
            </span>
            <span style="font-size:1.4rem;">${status}</span>
          </button>`;
        }).join('')}
      </div>
    `;
    root.appendChild(wrap);
    root.appendChild(GardenView.bottomNav('letters'));

    wrap.querySelector('#backBtn').addEventListener('click', () => Router.navigate('letters'));
    wrap.querySelectorAll('[data-word]').forEach(btn => {
      btn.addEventListener('click', () => Router.navigate('word', { id: btn.dataset.word }));
    });
  }

  return { renderGrid, renderLetterDetail };
})();
