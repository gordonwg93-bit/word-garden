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
      ${GameShared.bindiBubble('Which one am I saying?', '我说的是哪一个？')}
      <div style="text-align:center; margin-bottom:16px;">
        <button class="btn btn--secondary" id="replayBtn">🔊 Hear it again</button>
      </div>
      <div class="choice-grid" id="grid">
        ${tiles.map(t => `<button class="choice-tile" data-id="${t.id}">${t.emoji}</button>`).join('')}
      </div>
    `;
    root.appendChild(wrap);
    GameShared.wireBubble(wrap, 'Which one am I saying?', '我说的是哪一个？');

    const speakTarget = () => Speech.speakBilingual(word.word, word.wordZh);
    speakTarget();
    wrap.querySelector('#replayBtn').addEventListener('click', speakTarget);

    wrap.querySelectorAll('[data-id]').forEach(tile => {
      tile.addEventListener('click', async () => {
        const correct = tile.dataset.id === word.id;
        tile.classList.add(correct ? 'choice-tile--correct' : 'choice-tile--wrong');
        if (correct) {
          GameShared.correctFeedback();
          GameShared.recordResult(word.id, 'listenChoose', true);
          GameShared.celebrate(GameShared.randomEncouragement());
          Speech.speakEncouragement(GameShared.randomEncouragement());
          setTimeout(() => Router.navigate('play', { game: 'wordBuilder', word: word.id }), 900);
        } else {
          GameShared.wrongFeedback();
          GameShared.recordResult(word.id, 'listenChoose', false);
          setTimeout(() => { tile.classList.remove('choice-tile--wrong'); }, 500);
        }
      });
    });
  }

  return { render };
})();
