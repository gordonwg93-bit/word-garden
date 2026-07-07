/* =========================================================
   onboarding.js — first-run profile creation
   ========================================================= */
const Onboarding = (() => {
  const AVATARS = ['🦋', '🧚', '🐰', '🦄', '🐨', '🐸', '🦊', '🐬'];

  function render(root) {
    const wrap = document.createElement('div');
    wrap.className = 'screen';
    wrap.innerHTML = `
      <div class="sparkle-bg">${_sparkles()}</div>
      <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; gap:18px;">
        <div style="font-size:4rem;">🧚‍♀️🌸</div>
        <h1>G'day! I'm Bindi.</h1>
        <p>What's your name, friend?</p>
        <input id="nameInput" class="parent-gate__input" style="width:220px; font-size:1.3rem;" maxlength="16" placeholder="Type here" autocomplete="off">
        <p>Pick your fairy friend:</p>
        <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:center; max-width:400px;">
          ${AVATARS.map(a => `<button class="btn--icon" data-avatar="${a}" style="background:var(--color-white); box-shadow:var(--shadow-soft); font-size:2rem;">${a}</button>`).join('')}
        </div>
        <button id="startBtn" class="btn" style="margin-top:10px;" disabled>Let's grow our garden! 🌱</button>
      </div>
    `;
    root.appendChild(wrap);

    let chosenAvatar = null;
    const nameInput = wrap.querySelector('#nameInput');
    const startBtn = wrap.querySelector('#startBtn');

    wrap.querySelectorAll('[data-avatar]').forEach(btn => {
      btn.addEventListener('click', () => {
        wrap.querySelectorAll('[data-avatar]').forEach(b => b.style.outline = 'none');
        btn.style.outline = '4px solid var(--color-blossom)';
        chosenAvatar = btn.dataset.avatar;
        _checkReady();
      });
    });
    nameInput.addEventListener('input', _checkReady);

    function _checkReady() {
      startBtn.disabled = !(nameInput.value.trim().length > 0 && chosenAvatar);
    }

    startBtn.addEventListener('click', () => {
      const root_ = Storage.getRoot();
      const profile = Storage.defaultProfile(nameInput.value.trim(), chosenAvatar);
      root_.profiles[profile.id] = profile;
      root_.activeProfileId = profile.id;
      Storage.saveRoot(root_);
      Speech.speakEncouragement(`G'day ${profile.name}! Let's grow your word garden!`);
      Router.navigate('home');
    });
  }

  function _sparkles() {
    const icons = ['✨', '🌸', '🦋', '⭐'];
    let out = '';
    for (let i = 0; i < 12; i++) {
      const left = Math.random() * 100;
      const delay = Math.random() * 14;
      const icon = icons[i % icons.length];
      out += `<span style="left:${left}%; animation-delay:-${delay}s;">${icon}</span>`;
    }
    return out;
  }

  return { render };
})();
