/* =========================================================
   games/missingLetter.js

   This is the missing rung on the ladder Gordon flagged:
   "knows the word but freezes when asked to spell it cold."
   Between Listen&Choose (pure recognition) and Word Builder
   (full recall) sits THIS: most letters are already there,
   the child only has to supply 1-2. Much lower cognitive
   load, so it builds the confidence Word Builder then draws on.

   Blank count scales with word length; the first letter is
   never blanked (keeps a visual anchor). Blanks are filled
   strictly left-to-right so it stays simple to follow.
   ========================================================= */
const MissingLetterGame = (() => {
  async function render(root, params) {
    const word = await WordData.getWordById(params.word);
    const letters = word.word.toLowerCase().split('');

    const blankCount = letters.length <= 4 ? 1 : (letters.length <= 7 ? 2 : 3);
    const blankable = letters.map((_, i) => i).filter(i => i !== 0); // never blank the first letter
    const blankIdx = GameShared.shuffle(blankable).slice(0, blankCount).sort((a, b) => a - b);

    const wrap = document.createElement('div');
    wrap.className = 'screen';
    wrap.appendChild(GameShared.backBar(word));
    wrap.innerHTML += `
      <div class="bindi-bubble">
        <div class="bindi-bubble__avatar">🧚</div>
        <div class="bindi-bubble__text">Fill in the missing letters!</div>
      </div>
      <div class="builder">
        <div style="font-size:5rem;">${word.emoji}</div>
        <button class="btn btn--secondary" id="replayBtn">🔊 Hear it</button>
        <div class="builder__slots" id="slots">
          ${letters.map((l, i) => blankIdx.includes(i)
            ? `<div class="builder__slot" data-blank="${i}" style="border-bottom-color:var(--color-blossom);">_</div>`
            : `<div class="builder__slot" style="color:var(--color-ink-light);">${l}</div>`).join('')}
        </div>
        <div class="builder__tiles" id="tiles"></div>
      </div>
    `;
    root.appendChild(wrap);
    Speech.speakBilingual(word.word, word.wordZh);
    wrap.querySelector('#replayBtn').addEventListener('click', () => Speech.speak(word.word, 'en'));

    let mistakeMade = false;
    let blankQueue = [...blankIdx];

    function renderTilesFor(position) {
      const correct = letters[position];
      const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('').filter(c => c !== correct);
      const distractors = GameShared.shuffle(alphabet).slice(0, 3);
      const options = GameShared.shuffle([correct, ...distractors]);
      const tilesEl = wrap.querySelector('#tiles');
      tilesEl.innerHTML = options.map(l => `<button class="builder__tile" data-letter="${l}">${l}</button>`).join('');
      tilesEl.querySelectorAll('.builder__tile').forEach(tile => {
        tile.addEventListener('click', () => {
          if (tile.dataset.letter === correct) {
            GameShared.correctFeedback();
            const slot = wrap.querySelector(`[data-blank="${position}"]`);
            slot.textContent = correct;
            slot.style.color = 'var(--color-ink)';
            Speech.speak(correct, 'en', { rate: 1 });
            blankQueue.shift();
            if (blankQueue.length) {
              renderTilesFor(blankQueue[0]);
            } else {
              setTimeout(() => finish(!mistakeMade), 400);
            }
          } else {
            mistakeMade = true;
            tile.classList.add('builder__tile--wrong');
            GameShared.wrongFeedback();
            setTimeout(() => tile.classList.remove('builder__tile--wrong'), 400);
          }
        });
      });
    }
    renderTilesFor(blankQueue[0]);

    function finish(perfect) {
      GameShared.recordResult(word.id, 'missingLetter', true);
      GameShared.celebrate(perfect ? 'PERFECT! 🌟' : GameShared.randomEncouragement());
      Speech.speakEncouragement(perfect ? "Bonza, you nailed every letter!" : "Good on ya, you got it!");
      setTimeout(() => Router.navigate('word', { id: word.id }), 1200);
    }
  }

  return { render };
})();
