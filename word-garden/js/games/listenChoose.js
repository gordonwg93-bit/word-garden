/* =========================================================
   games/listenChoose.js
   Bindi says the word (EN then ZH), child taps the matching
   emoji among 4 tiles. Reinforces listening comprehension
   before spelling is ever attempted.
   ========================================================= */
const ListenChooseGame = (() => {
  async function render(root, params) {
    const word = await WordData.getWordById(params.word);
    const distractors = await GameShared.randomDistractors(word, 3);
    const tiles = GameShared.shuffle([word, ...distractors]);

    const wrap = document.createElement('div');
    wrap.className = 'screen';
    wrap.appendChild(GameShared.backBar(word));
    wrap.innerHTML += `
      <div class="bindi-bubble">
        <div class="bindi-bubble__avatar">🧚</div>
        <div class="bindi-bubble__text">Which one am I saying?</div>
      </div>
      <div style="text-align:center; margin-bottom:16px;">
        <button class="btn btn--secondary" id="replayBtn">🔊 Hear it again</button>
      </div>
      <div class="choice-grid" id="grid">
        ${tiles.map(t => `<button class="choice-tile" data-id="${t.id}">${t.emoji}</button>`).join('')}
      </div>
    `;
    root.appendChild(wrap);

    const speakTarget = () => Speech.speakBilingual(word.word, word.wordZh);
    speakTarget();
    wrap.querySelector('#replayBtn').addEventListener('click', speakTarget);

    wrap.querySelectorAll('[data-id]').forEach(tile => {
      tile.addEventListener('click', async () => {
        const correct = tile.dataset.id === word.id;
        tile.classList.add(correct ? 'choice-tile--correct' : 'choice-tile--wrong');
        if (correct) {
          GameShared.recordResult(word.id, 'listenChoose', true);
          GameShared.celebrate(GameShared.randomEncouragement());
          Speech.speakEncouragement(GameShared.randomEncouragement());
          setTimeout(() => Router.navigate('play', { game: 'wordBuilder', word: word.id }), 900);
        } else {
          GameShared.recordResult(word.id, 'listenChoose', false);
          setTimeout(() => { tile.classList.remove('choice-tile--wrong'); }, 500);
        }
      });
    });
  }

  return { render };
})();
