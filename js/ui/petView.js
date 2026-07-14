/* =========================================================
   ui/petView.js — 'pet' route

   Design note: deliberately NO hunger/decay mechanic. The pet
   never gets sad or needs "rescuing" if the child doesn't
   visit for a few days - that would turn a reward into a
   guilt trip for a 4-5 year old (and their parent). Feeding
   only ever moves forward: more feeds = pet grows, that's it.
   ========================================================= */
const PetView = (() => {
  const STAGES = [
    { min: 0,  emoji: '🥚',     name: 'Egg' },
    { min: 3,  emoji: '🐣',     name: 'Hatchling' },
    { min: 8,  emoji: '🐥',     name: 'Fledgling' },
    { min: 15, emoji: '🦋',     name: 'Garden Fairy' },
    { min: 25, emoji: '🦋',     name: 'Radiant Garden Fairy', radiant: true },
  ];

  function _stageFor(feeds) {
    let current = STAGES[0];
    for (const s of STAGES) if (feeds >= s.min) current = s;
    return current;
  }

  function _nextStage(feeds) {
    return STAGES.find(s => s.min > feeds) || null;
  }

  async function render(root) {
    const store = Storage.getRoot();
    const profile = store.profiles[store.activeProfileId];
    const pet = profile.pet;
    const stage = _stageFor(pet.starsFed);
    const next = _nextStage(pet.starsFed);
    const pct = next ? Math.round((pet.starsFed / next.min) * 100) : 100;

    const wrap = document.createElement('div');
    wrap.className = 'screen';
    wrap.innerHTML = `
      <div class="topbar">
        <h1 class="topbar__title">🐾 ${pet.name}</h1>
        <div class="topbar__stars">🌟 ${profile.starBalance || 0}</div>
      </div>
      <div class="garden" style="align-items:center; justify-content:center; text-align:center;">
        <div id="petEmoji" style="font-size:9rem; filter:${stage.radiant ? 'drop-shadow(0 0 18px var(--color-sun))' : 'none'};">${stage.emoji}</div>
        <h2 style="margin-top:6px;">${stage.name}</h2>
        <button class="btn btn--ghost" id="renameBtn" style="margin-bottom:14px;">✏️ Rename ${pet.name}</button>
        <div style="width:80%; max-width:320px; background:var(--color-bg-soft); border-radius:999px; height:16px; overflow:hidden; margin-bottom:8px;">
          <div style="width:${pct}%; background:var(--color-meadow); height:100%;"></div>
        </div>
        <p style="color:var(--color-ink-light); font-size:0.9rem; margin-top:0;">
          ${next ? `${next.min - pet.starsFed} more feed${next.min - pet.starsFed === 1 ? '' : 's'} to grow!` : 'Fully grown - you did it!'}
        </p>
        <button class="btn btn--sun" id="feedBtn" ${(profile.starBalance || 0) < 1 ? 'disabled' : ''} style="font-size:1.3rem; padding:16px 36px;">
          🍓 Feed ${pet.name} (1 🌟)
        </button>
        ${(profile.starBalance || 0) < 1 ? '<p style="color:var(--color-ink-light); font-size:0.85rem;">Master more words to earn stars!</p>' : ''}
        <button class="btn btn--secondary" id="shopBtn" style="margin-top:14px;">🛍️ Visit the Garden Shop</button>
      </div>
    `;
    root.appendChild(wrap);
    root.appendChild(GardenView.bottomNav('pet'));

    wrap.querySelector('#feedBtn').addEventListener('click', async () => {
      const store2 = Storage.getRoot();
      const p2 = store2.profiles[profile.id];
      if ((p2.starBalance || 0) < 1) return;
      p2.starBalance -= 1;
      const prevStage = _stageFor(p2.pet.starsFed);
      p2.pet.starsFed += 1;
      const newStage = _stageFor(p2.pet.starsFed);
      Storage.saveRoot(store2);

      SFX.playPop();
      const emojiEl = wrap.querySelector('#petEmoji');
      emojiEl.style.transition = 'transform 200ms var(--ease-bounce)';
      emojiEl.style.transform = 'scale(1.3)';
      setTimeout(() => { emojiEl.style.transform = 'scale(1)'; }, 200);

      if (newStage.name !== prevStage.name) {
        GameShared.celebrate(`${p2.pet.name} grew! ${newStage.emoji}`);
        Speech.speakEncouragement(`Beauty! ${p2.pet.name} grew into a ${newStage.name}!`);
        setTimeout(renderFresh, 900);
      } else {
        renderFresh();
      }
    });

    async function renderFresh() {
      const appRoot = document.getElementById('app');
      appRoot.innerHTML = '';
      await render(appRoot);
    }

    wrap.querySelector('#renameBtn').addEventListener('click', () => {
      const newName = prompt(`What should we call your pet?`, pet.name);
      if (newName && newName.trim()) {
        const store2 = Storage.getRoot();
        store2.profiles[profile.id].pet.name = newName.trim().slice(0, 16);
        Storage.saveRoot(store2);
        renderFresh();
      }
    });

    wrap.querySelector('#shopBtn').addEventListener('click', () => Router.navigate('shop'));
  }

  return { render };
})();
