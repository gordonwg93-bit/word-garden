/* =========================================================
   ui/challenge.js — 'challenge' route
   ========================================================= */
const ChallengeView = (() => {
  async function render(root) {
    const store = Storage.getRoot();
    const profile = store.profiles[store.activeProfileId];
    const all = await WordData.loadAll();
    const wordsByLetter = {};
    all.forEach(w => { const l = w.id.charAt(0); (wordsByLetter[l] = wordsByLetter[l] || []).push(w); });

    const challenge = await DailyChallenge.getOrCreateChallenge(store, profile.id, wordsByLetter);
    Storage.saveRoot(store);
    const words = challenge.wordIds.map(id => all.find(w => w.id === id)).filter(Boolean);
    const readyForReview = DailyChallenge.isReadyForParentReview(profile);

    const wrap = document.createElement('div');
    wrap.className = 'screen';
    wrap.innerHTML = `
      <div class="topbar"><h1 class="topbar__title">🎯 Today's 5 Words</h1></div>
      <div class="bindi-bubble">
        <div class="bindi-bubble__avatar">🧚</div>
        <div class="bindi-bubble__text">${readyForReview ? "You've had a go at all 5! Ask a grown-up to check them off." : "Let's learn these 5 words today!"}</div>
      </div>
      <div style="display:flex; flex-direction:column; gap:12px; margin:10px 0;">
        ${words.map(w => {
          const done = challenge.wordProgress[w.id];
          return `
          <button class="card" data-word="${w.id}" style="display:flex; align-items:center; gap:16px; text-align:left; width:100%; ${done ? 'border:3px solid var(--color-meadow);' : ''}">
            <span style="font-size:2.4rem;">${w.emoji}</span>
            <span style="flex:1;">
              <div style="font-family:var(--font-write); font-size:1.2rem; font-weight:700;">${w.word}</div>
              <div style="color:var(--color-ink-light); font-size:0.85rem;">${w.wordZh}</div>
            </span>
            <span style="font-size:1.3rem;">${done ? '✅' : '▶️'}</span>
          </button>`;
        }).join('')}
      </div>
      <button class="btn btn--sun" id="confirmBtn" style="align-self:center; margin-top:8px;" ${readyForReview ? '' : 'disabled'}>
        👪 Parent: Confirm today's challenge complete
      </button>
    `;
    root.appendChild(wrap);
    root.appendChild(GardenView.bottomNav('challenge'));

    wrap.querySelectorAll('[data-word]').forEach(btn => {
      btn.addEventListener('click', () => Router.navigate('word', { id: btn.dataset.word }));
    });

    wrap.querySelector('#confirmBtn').addEventListener('click', async () => {
      const ok = await ParentGate.prompt({
        title: 'Confirm the challenge',
        subtitle: "Have you sat with your child and checked they can say and attempt to spell all 5 words?"
      });
      if (!ok) return;
      const store2 = Storage.getRoot();
      DailyChallenge.confirmChallenge(store2, profile.id);
      Storage.saveRoot(store2);
      GameShared.celebrate("Day complete! 🎉");
      Router.navigate('home');
    });
  }

  return { render };
})();
