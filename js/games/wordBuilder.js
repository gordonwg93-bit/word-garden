/* =========================================================
   games/wordBuilder.js
   The core "learn to spell" game. Key idea from Gordon's
   brief: a kid can KNOW a word by sight/sound but freeze
   when asked to spell it "from nothing" — that's a recall
   problem, not a knowledge problem. So this game scaffolds:

   Hint level 0 (new word):      next correct letter glows.
   Hint level 1 (streak 1-2):    no glow, but no wrong letters
                                  in the tile pool either.
   Hint level 2 (near mastery):  1-2 distractor letters added,
                                  no glow — real spelling test.

   The scaffold fades automatically as correctStreak rises,
   so the child is never dropped straight into "memorise it
   cold" — confidence is built in stages.
   ========================================================= */
const WordBuilderGame = (() => {
  async function render(root, params) {
    const word = await WordData.getWordById(params.word);
    const letters = word.word.toLowerCase().split('');

    const store = Storage.getRoot();
    const profile = store.profiles[store.activeProfileId];
    const stat = Progress.getStats(store, profile.id, word.id) || { correctStreak: 0 };
    const hintLevel = stat.correctStreak >= 3 ? 2 : (stat.correctStreak >= 1 ? 1 : 0);

    let tilePool = [...letters];
    if (hintLevel === 2) {
      const extras = 'aeioustlmnr'.split('').filter(c => !letters.includes(c));
      tilePool.push(extras[Math.floor(Math.random() * extras.length)]);
      if (letters.length > 3) tilePool.push(extras[Math.floor(Math.random() * extras.length)]);
    }
    tilePool = GameShared.shuffle(tilePool);

    const wrap = document.createElement('div');
    wrap.className = 'screen';
    wrap.appendChild(GameShared.backBar(word));
    wrap.innerHTML += `
      ${GameShared.bindiBubble("Let's spell it! Tap the letters in order.", '我们来拼写吧！按顺序点字母。')}
      <div class="builder">
        <div style="font-size:5rem;">${word.emoji}</div>
        <button class="btn btn--secondary" id="replayBtn">🔊 Hear it</button>
        <div class="builder__slots" id="slots">
          ${letters.map(() => `<div class="builder__slot"></div>`).join('')}
        </div>
        <div class="builder__tiles" id="tiles">
          ${tilePool.map((l, i) => `<button class="builder__tile" data-letter="${l}" data-idx="${i}">${l}</button>`).join('')}
        </div>
      </div>
    `;
    root.appendChild(wrap);
    GameShared.wireBubble(wrap, "Let's spell it! Tap the letters in order.", '我们来拼写吧！按顺序点字母。');

    Speech.speakBilingual(word.word, word.wordZh);
    wrap.querySelector('#replayBtn').addEventListener('click', () => Speech.speak(word.word, 'en'));

    const slots = wrap.querySelectorAll('.builder__slot');
    let built = [];
    let mistakeMade = false;

    function refreshHints() {
      if (hintLevel > 0) return;
      wrap.querySelectorAll('.builder__tile:not(.builder__tile--used)').forEach(t => t.style.boxShadow = '');
      const needed = letters[built.length];
      const candidate = [...wrap.querySelectorAll('.builder__tile:not(.builder__tile--used)')]
        .find(t => t.dataset.letter === needed);
      if (candidate) candidate.style.boxShadow = '0 0 0 5px var(--color-sun), 0 4px 0 var(--color-sky-dk)';
    }
    refreshHints();

    wrap.querySelectorAll('.builder__tile').forEach(tile => {
      tile.addEventListener('click', () => {
        const needed = letters[built.length];
        if (tile.dataset.letter === needed) {
          GameShared.correctFeedback();
          slots[built.length].textContent = tile.dataset.letter;
          tile.classList.add('builder__tile--used');
          built.push(tile.dataset.letter);
          Speech.speak(tile.dataset.letter, 'en', { rate: 1 });
          if (built.length === letters.length) {
            setTimeout(() => finish(!mistakeMade), 400);
          } else {
            refreshHints();
          }
        } else {
          mistakeMade = true;
          tile.classList.add('builder__tile--wrong');
          GameShared.wrongFeedback();
          setTimeout(() => tile.classList.remove('builder__tile--wrong'), 400);
        }
      });
    });

    function finish(perfect) {
      GameShared.recordResult(word.id, 'wordBuilder', true);
      GameShared.celebrate(perfect ? 'PERFECT! 🌟' : GameShared.randomEncouragement());
      Speech.speakEncouragement(perfect ? "You little ripper, perfect spelling!" : "Nice one, you got there!");
      setTimeout(() => Router.navigate('word', { id: word.id }), 1200);
    }
  }

  return { render };
})();
