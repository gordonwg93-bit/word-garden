/* =========================================================
   games/letterTrace.js
   Finger-tracing on iPad over a faint Andika outline of the
   whole word. This targets handwriting muscle memory, which
   is a different skill from recognising/spelling the word.
   We don't attempt stroke-accuracy scoring (too fiddly for a
   4-5yo and prone to false "wrong" feedback) — completion by
   attempt is what counts here, consistent with early
   handwriting practice sheets.
   ========================================================= */
const LetterTraceGame = (() => {
  async function render(root, params) {
    const word = await WordData.getWordById(params.word);

    const wrap = document.createElement('div');
    wrap.className = 'screen';
    wrap.appendChild(GameShared.backBar(word));
    wrap.innerHTML += `
      ${GameShared.bindiBubble('Trace the word with your finger!', '用手指描出这个词！')}
      <div class="trace-wrap">
        <div class="trace-canvas-holder">
          <div class="trace-guide">${word.word}</div>
          <canvas id="traceCanvas"></canvas>
        </div>
        <div style="display:flex; gap:12px;">
          <button class="btn btn--secondary" id="clearBtn">🧹 Clear</button>
          <button class="btn btn--sun" id="doneBtn">✅ I'm done!</button>
        </div>
      </div>
    `;
    root.appendChild(wrap);
    GameShared.wireBubble(wrap, 'Trace the word with your finger!', '用手指描出这个词！');
    Speech.speak(word.word, 'en');

    const holder = wrap.querySelector('.trace-canvas-holder');
    const canvas = wrap.querySelector('#traceCanvas');
    const ctx = canvas.getContext('2d');

    function sizeCanvas() {
      const rect = holder.getBoundingClientRect();
      canvas.width = rect.width * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      ctx.scale(devicePixelRatio, devicePixelRatio);
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-blossom');
    }
    sizeCanvas();

    let drawing = false;
    function pos(e) {
      const rect = canvas.getBoundingClientRect();
      const t = e.touches ? e.touches[0] : e;
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    function start(e) { drawing = true; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); e.preventDefault(); }
    function move(e) { if (!drawing) return; const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); e.preventDefault(); }
    function end() { drawing = false; }

    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', end);
    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', end);

    wrap.querySelector('#clearBtn').addEventListener('click', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
    wrap.querySelector('#doneBtn').addEventListener('click', () => {
      GameShared.recordResult(word.id, 'letterTrace', true);
      GameShared.celebrate('Great writing! ✏️');
      Speech.speakEncouragement('Beauty! Your handwriting is coming along a treat!');
      setTimeout(() => Router.navigate('word', { id: word.id }), 1000);
    });
  }

  return { render };
})();
