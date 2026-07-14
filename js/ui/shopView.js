/* =========================================================
   ui/shopView.js — 'shop' route
   ========================================================= */
const ShopView = (() => {
  async function render(root) {
    const store = Storage.getRoot();
    const profile = store.profiles[store.activeProfileId];

    const wrap = document.createElement('div');
    wrap.className = 'screen';
    wrap.innerHTML = `
      <div class="topbar">
        <button class="btn--icon" id="backBtn" style="background:var(--color-white); box-shadow:var(--shadow-soft);">←</button>
        <h1 class="topbar__title">🛍️ Garden Shop</h1>
        <div class="topbar__stars">🌟 ${profile.starBalance || 0}</div>
      </div>
      <p style="color:var(--color-ink-light); text-align:center; margin-top:0;">Spend your stars on decorations for your garden!</p>
      <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:14px; padding-bottom:20px;">
        ${SHOP_CATALOG.map(item => {
          const owned = profile.gardenDecor.includes(item.id);
          const canAfford = (profile.starBalance || 0) >= item.cost;
          return `
          <div class="card" style="text-align:center;">
            <div style="font-size:3rem;">${item.emoji}</div>
            <div style="font-family:var(--font-display); font-weight:600; margin:6px 0;">${item.name}</div>
            <button class="btn ${owned ? 'btn--ghost' : (canAfford ? 'btn--sun' : 'btn--ghost')}" data-item="${item.id}" ${owned || !canAfford ? 'disabled' : ''} style="width:100%;">
              ${owned ? '✓ In your garden' : `${item.cost} 🌟`}
            </button>
          </div>`;
        }).join('')}
      </div>
    `;
    root.appendChild(wrap);

    wrap.querySelector('#backBtn').addEventListener('click', () => Router.navigate('home'));

    wrap.querySelectorAll('[data-item]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const item = SHOP_CATALOG.find(i => i.id === btn.dataset.item);
        const store2 = Storage.getRoot();
        const p2 = store2.profiles[profile.id];
        if (p2.gardenDecor.includes(item.id) || (p2.starBalance || 0) < item.cost) return;
        p2.starBalance -= item.cost;
        p2.gardenDecor.push(item.id);
        Storage.saveRoot(store2);
        SFX.playCorrect();
        GameShared.celebrate(`${item.emoji} added to your garden!`);
        Speech.speakEncouragement(`Beauty! Your garden looks even better now.`);
        setTimeout(async () => {
          const appRoot = document.getElementById('app');
          appRoot.innerHTML = '';
          await render(appRoot);
        }, 700);
      });
    });
  }

  return { render };
})();
