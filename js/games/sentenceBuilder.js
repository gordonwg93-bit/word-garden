/* =========================================================
   games/sentenceBuilder.js
   Takes the word's example sentence and scrambles it into
   tappable word-tiles. Reinforces the target word USED in
   context (not just in isolation) and gives light exposure
   to sentence structure/word order in both languages.

   Every tile shows a Chinese gloss (where we have one - see
   sentenceGloss.js) and speaks BOTH languages when tapped,
   not just the target word - so a Chinese-speaking child gets
   sound and translation for the whole sentence, not one word.
   ========================================================= */
const SentenceBuilderGame = (() => {
  async function render(root, params) {
    const word = await WordData.getWordById(params.word);
    const rawWords = word.sentenceEn.replace(/[.!?]/g, '').split(' ').filter(Boolean);

    // Look up a Chinese gloss for every word in the sentence (not just the
    // target word) before rendering, so each tile can show + speak it.
    const glosses = await Promise.all(rawWords.map(w => SentenceGloss.lookup(w)));

    const tiles = GameShared.shuffle(rawWords.map((w, i) => ({ text: w, zh: glosses[i] ? glosses[i].zh : '', key: i })));

    const wrap = document.createElement('div');
    wrap.className = 'screen';
    wrap.appendChild(GameShared.backBar(word));
    wrap.innerHTML += `
      ${GameShared.bindiBubble('Put the words in the right order! Tap a tile to hear it.', '把单词按正确的顺序排好！点一下就能听到发音。')}
      <div class="builder">
        <div style="font-size:3.5rem;">${word.emoji}</div>
        <div class="builder__slots" id="slots" style="min-height:64px; flex-wrap:wrap;">
          ${rawWords.map(() => `<div class="builder__slot" style="width:auto; min-width:44px; padding:0 6px; font-family:var(--font-body);"></div>`).join('')}
        </div>
        <div class="builder__tiles" id="tiles">
          ${tiles.map(t => `
            <button class="builder__tile" data-key="${t.key}" data-en="${t.text}" data-zh="${t.zh}"
              style="width:auto; height:auto; min-height:58px; padding:6px 14px; flex-direction:column; gap:0;">
              <span style="font-family:var(--font-body); font-size:1.15rem;">${t.text}</span>
              ${t.zh ? `<span style="font-family:var(--font-write); font-size:0.85rem; opacity:0.85;">${t.zh}</span>` : ''}
            </button>`).join('')}
        </div>
        <p id="zhReveal" style="font-family:var(--font-write); color:var(--color-lilac-dk); font-size:1.3rem; min-height:1.6em; text-align:center;"></p>
      </div>
    `;
    root.appendChild(wrap);
    GameShared.wireBubble(wrap, 'Put the words in the right order! Tap a tile to hear it.', '把单词按正确的顺序排好！点一下就能听到发音。');
    Speech.speak(word.sentenceEn, 'en');

    const slots = wrap.querySelectorAll('.builder__slot');
    let placed = [];

    wrap.querySelectorAll('.builder__tile').forEach(tile => {
      tile.addEventListener('click', () => {
        // Every tap gets sound - English, plus Chinese if we have a gloss -
        // regardless of whether it's placed in the right spot yet.
        const en = tile.dataset.en;
        const zh = tile.dataset.zh;
        if (zh) Speech.speakBilingual(en, zh); else Speech.speak(en, 'en');

        const key = parseInt(tile.dataset.key, 10);
        const expectedKey = placed.length; // words were keyed 0..n in original order
        if (key === expectedKey) {
          GameShared.correctFeedback();
          slots[placed.length].textContent = en;
          tile.classList.add('builder__tile--used');
          placed.push(key);
          if (placed.length === rawWords.length) {
            setTimeout(finish, 700);
          }
        } else {
          tile.classList.add('builder__tile--wrong');
          GameShared.wrongFeedback();
          setTimeout(() => tile.classList.remove('builder__tile--wrong'), 400);
        }
      });
    });

    function finish() {
      GameShared.recordResult(word.id, 'sentenceBuilder', true);
      wrap.querySelector('#zhReveal').textContent = word.sentenceZh;
      Speech.speak(word.sentenceEn, 'en').then(() => Speech.speak(word.sentenceZh, 'zh'));
      GameShared.celebrate('Nice sentence! 📝');
      setTimeout(() => Router.navigate('word', { id: word.id }), 1800);
    }
  }

  return { render };
})();
