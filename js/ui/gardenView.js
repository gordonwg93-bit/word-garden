/* =========================================================
   gardenView.js — home screen
   ========================================================= */
const GardenView = (() => {
  const FLOWER_EMOJIS = ['🌷', '🌸', '🌼', '🌻', '🪻', '🌺'];

  async function render(root) {
    const store = Storage.getRoot();
    const profile = store.profiles[store.activeProfileId];
    if (!profile) { Router.navigate('onboarding'); return; }

    Progress.updateDailyStreak(store, profile.id);
    Storage.saveRoot(store);

    const allWords = await WordData.loadAll();
    const wordsByLetter = {};
    allWords.forEach(w => {
      const l = w.id.charAt(0);
      wordsByLetter[l] = wordsByLetter[l] || [];
      wordsByLetter[l].push(w);
    });
    const challenge = await DailyChallenge.getOrCreateChallenge(store, profile.id, wordsByLetter);
    Storage.saveRoot(store);

    const masteredIds = Progress.allMasteredWordIds(store, profile.id);
    const readyForReview = DailyChallenge.isReadyForParentReview(profile);

    const wrap = document.createElement('div');
    wrap.className = 'screen';
    wrap.innerHTML = `
      <div class="topbar">
        <h1 class="topbar__title">${profile.avatar} Hi ${profile.name}!</h1>
        <div style="display:flex; align-items:center; gap:8px;">
          <button class="btn--icon" id="sfxToggle" style="background:var(--color-white); box-shadow:var(--shadow-soft); font-size:1.3rem;">${SFX.isSfxOn() ? '🔊' : '🔇'}</button>
          <button class="btn--icon" id="musicToggle" style="background:var(--color-white); box-shadow:var(--shadow-soft); font-size:1.3rem;">${SFX.isMusicOn() ? '🎵' : '🚫'}</button>
          <div class="topbar__stars">🌟 ${masteredIds.length}</div>
        </div>
      </div>

      <div class="garden">
        <div class="garden__hero">
          <p>Your word garden is growing!</p>
        </div>
        <div class="garden__streak">
          ${_streakDots(profile.currentStreak)}
        </div>
        <div class="garden__plot" id="gardenPlot">
          ${masteredIds.length ? masteredIds.map((id, i) => `<span class="garden__flower" style="animation-delay:${i * 40}ms">${FLOWER_EMOJIS[i % FLOWER_EMOJIS.length]}</span>`).join('')
            : `<p class="garden__empty">Learn your first word to plant a flower! 🌱</p>`}
        </div>
        <div class="garden__cta">
          <div class="garden__challenge-card">
            <div class="garden__challenge-card__icon">${readyForReview ? '🎉' : '🎯'}</div>
            <div class="garden__challenge-card__text">
              <strong>${readyForReview ? 'Today\'s 5 words are done!' : 'Today\'s Challenge'}</strong>
              <span>${readyForReview ? 'Ask a grown-up to check it off' : `${challenge.wordIds.filter(id => challenge.wordProgress[id]).length} / ${challenge.wordIds.length} words practised`}</span>
            </div>
            <button class="btn ${readyForReview ? 'btn--sun' : ''}" id="challengeBtn">${readyForReview ? 'Finish up' : 'Start'}</button>
          </div>
        </div>
      </div>
    `;
    root.appendChild(wrap);
    root.appendChild(_bottomNav('home'));

    wrap.querySelector('#challengeBtn').addEventListener('click', () => {
      Router.navigate('challenge');
    });
    wrap.querySelector('#sfxToggle').addEventListener('click', (e) => {
      const nowOn = !SFX.isSfxOn();
      SFX.setSfxOn(nowOn);
      e.currentTarget.textContent = nowOn ? '🔊' : '🔇';
      if (nowOn) SFX.playTap();
    });
    wrap.querySelector('#musicToggle').addEventListener('click', (e) => {
      const nowOn = !SFX.isMusicOn();
      SFX.setMusicOn(nowOn);
      e.currentTarget.textContent = nowOn ? '🎵' : '🚫';
    });
  }

  function _streakDots(streak) {
    const days = ['S','M','T','W','T','F','S'];
    const todayIdx = new Date().getDay();
    let out = '';
    for (let i = 0; i < 7; i++) {
      const done = i <= todayIdx && (todayIdx - i) < streak;
      out += `<div class="garden__streak-day ${done ? 'garden__streak-day--done' : ''}">${done ? '⭐' : days[i]}</div>`;
    }
    return out;
  }

  function _bottomNav(active) {
    const items = [
      { id: 'home', icon: '🏡', label: 'Garden' },
      { id: 'letters', icon: '🔤', label: 'Letters' },
      { id: 'challenge', icon: '🎯', label: 'Challenge' },
      { id: 'games', icon: '🎮', label: 'Games' },
      { id: 'parent', icon: '👪', label: 'Parents' },
    ];
    const nav = document.createElement('div');
    nav.className = 'bottom-nav';
    nav.innerHTML = items.map(it => `
      <button class="bottom-nav__item ${it.id === active ? 'bottom-nav__item--active' : ''}" data-route="${it.id}">
        <span class="icon">${it.icon}</span>
        <span>${it.label}</span>
      </button>
    `).join('');
    nav.querySelectorAll('[data-route]').forEach(btn => {
      btn.addEventListener('click', () => Router.navigate(btn.dataset.route));
    });
    return nav;
  }

  return { render, bottomNav: _bottomNav };
})();
