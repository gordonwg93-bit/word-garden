/* =========================================================
   parentGate.js
   A 4-5 year old shouldn't be able to unlock the Parent
   Dashboard or confirm the daily challenge by mashing
   buttons. We use a simple on-the-fly maths question rather
   than a PIN, so there's nothing for you to forget/reset.
   (If you'd rather use a real PIN, set root.parentPinHash
   via Settings — this function checks that first.)
   ========================================================= */
const ParentGate = (() => {
  function _randomQuestion() {
    const a = 3 + Math.floor(Math.random() * 6);   // 3-8
    const b = 2 + Math.floor(Math.random() * 6);   // 2-7
    return { text: `${a} + ${b} = ?`, answer: a + b };
  }

  // Renders a modal, resolves true/false based on user response.
  function prompt({ title = 'Just checking!', subtitle = 'A quick one for the grown-ups:' } = {}) {
    return new Promise((resolve) => {
      const q = _randomQuestion();
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal" role="dialog" aria-modal="true" aria-label="${title}">
          <h2>${title}</h2>
          <p>${subtitle}</p>
          <div class="parent-gate__question">${q.text}</div>
          <input class="parent-gate__input" type="number" inputmode="numeric" aria-label="Answer">
          <div style="display:flex; gap:10px; justify-content:center; margin-top:8px;">
            <button class="btn btn--ghost" data-action="cancel">Cancel</button>
            <button class="btn" data-action="confirm">Confirm</button>
          </div>
          <p class="parent-gate__note">Grown-ups only — helps make sure today's 5 words are really done before moving on.</p>
        </div>`;
      document.body.appendChild(overlay);
      const input = overlay.querySelector('.parent-gate__input');
      input.focus();

      function cleanup(result) {
        overlay.remove();
        resolve(result);
      }
      overlay.querySelector('[data-action="cancel"]').addEventListener('click', () => cleanup(false));
      overlay.querySelector('[data-action="confirm"]').addEventListener('click', () => {
        cleanup(parseInt(input.value, 10) === q.answer);
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') cleanup(parseInt(input.value, 10) === q.answer);
      });
    });
  }

  return { prompt };
})();
