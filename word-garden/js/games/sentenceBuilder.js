/* =========================================================
   games/sentenceBuilder.js
   Takes the word's example sentence and scrambles it into
   tappable word-tiles. Reinforces the target word USED in
   context (not just in isolation) and gives light exposure
   to sentence structure/word order in both languages.
   ========================================================= */
const SentenceBuilderGame = (() => {
  async function render(root, params) {
    const word = await WordData.getWordById(params.word);
    const rawWords = word.sentenceEn.replace(/[.!?]/g, '').split(' ').filter(Boolean);
    const tiles = GameShared.shuffle(rawWords.map((w, i) => ({ text: w, key: i })));

    const wrap = document.createElement('div');
    wrap.className = 'screen';
    wrap.appendChild(GameShared.backBar(word));
    wrap.innerHTML += `
      <div class="bindi-bubble">
        <div class="bindi-bubble__avatar">🧚</div>
        <div class="bindi-bubble__text">Put the words in the right order!</div>
      </div>
      <div class="builder">
        <div style="font-size:3.5rem;">${word.emoji}</div>
        <div class="builder__slots" id="slots" style="min-height:64px; flex-wrap:wrap;">
          ${rawWords.map(() => `<div class="builder__slot" style="width:auto; min-width:44px; padding:0 6px; font-family:var(--font-body);"></div>`).join('')}
        </div>
        <div class="builder__tiles" id="tiles">
          ${tiles.map(t => `<button class="builder__tile" style="width:auto; padding:0 14px; font-family:var(--font-body); font-size:1.2rem;" data-key="${t.key}">${t.text}</button>`).join('')}
        </div>
      </div>
    `;
    root.appendChild(wrap);
    Speech.speak(word.sentenceEn, 'en');

    const slots = wrap.querySelectorAll('.builder__slot');
    let placed = [];

    wrap.querySelectorAll('.builder__tile').forEach(tile => {
      tile.addEventListener('click', () => {
        const key = parseInt(tile.dataset.key, 10);
        const expectedKey = placed.length; // words were keyed 0..n in original order
        if (key === expectedKey) {
          slots[placed.length].textContent = tile.textContent;
          tile.classList.add('builder__tile--used');
          placed.push(key);
          if (placed.length === rawWords.length) {
            setTimeout(finish, 500);
          }
        } else {
          tile.classList.add('builder__tile--wrong');
          setTimeout(() => tile.classList.remove('builder__tile--wrong'), 400);
        }
      });
    });

    function finish() {
      GameShared.recordResult(word.id, 'sentenceBuilder', true);
      Speech.speak(word.sentenceEn, 'en').then(() => Speech.speak(word.sentenceZh, 'zh'));
      GameShared.celebrate('Nice sentence! 📝');
      setTimeout(() => Router.navigate('word', { id: word.id }), 1600);
    }
  }

  return { render };
})();
