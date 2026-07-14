/* =========================================================
   ui/parentDashboard.js — 'parent' route
   Gated behind ParentGate so a child can't casually wander
   in. Shows the things a parent actually wants to know:
   how much progress, where they're stuck, and streak health.
   ========================================================= */
const ParentDashboard = (() => {
  let unlocked = false;

  async function render(root) {
    if (!unlocked) {
      const ok = await ParentGate.prompt({ title: 'Parent Dashboard', subtitle: 'Quick check before we open the reports:' });
      if (!ok) { Router.navigate('home'); return; }
      unlocked = true;
    }

    const store = Storage.getRoot();
    const profile = store.profiles[store.activeProfileId];
    const idx = await WordData.loadIndex();

    const wordStats = profile.wordStats;
    const totalIntroduced = Object.keys(wordStats).length;
    const totalMastered = Object.values(wordStats).filter(s => s.mastered).length;

    const strugglingWords = await _findStrugglers(wordStats);
    const letterRows = await _letterBreakdown(store, profile);
    const historyDays = Object.keys(profile.dailyLog).sort().reverse().slice(0, 14);

    const wrap = document.createElement('div');
    wrap.className = 'screen';
    wrap.innerHTML = `
      <div class="topbar"><h1 class="topbar__title">👪 ${profile.name}'s Progress</h1></div>

      <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:18px;">
        ${_statCard('🌟', totalMastered, 'Words mastered')}
        ${_statCard('🌱', totalIntroduced - totalMastered, 'Still practising')}
        ${_statCard('🔥', profile.currentStreak, 'Day streak')}
      </div>

      <h3>Learning language focus</h3>
      <div class="card" style="margin-bottom:20px;">
        <p style="margin-top:0; color:var(--color-ink-light); font-size:0.9rem;">Which language leads on screen and in the audio order, everywhere in the app.</p>
        <div style="display:flex; gap:10px;">
          <button class="btn ${profile.languageMode !== 'zh-first' ? '' : 'btn--ghost'}" id="langEnBtn" style="flex:1;">English first</button>
          <button class="btn ${profile.languageMode === 'zh-first' ? '' : 'btn--ghost'}" id="langZhBtn" style="flex:1;">中文 first</button>
        </div>
      </div>

      <h3>Progress by letter</h3>
      <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:20px;">
        ${letterRows.map(r => `
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="width:22px; font-family:var(--font-write); font-weight:700;">${r.letter.toUpperCase()}</span>
            <div style="flex:1; background:var(--color-bg-soft); border-radius:999px; height:14px; overflow:hidden;">
              <div style="width:${Math.round(r.pct * 100)}%; background:var(--color-meadow); height:100%;"></div>
            </div>
            <span style="font-size:0.8rem; color:var(--color-ink-light); width:52px; text-align:right;">${r.mastered}/${r.total}</span>
          </div>
        `).join('')}
      </div>

      ${strugglingWords.length ? `
      <h3>Words needing a bit more practice</h3>
      <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:20px;">
        ${strugglingWords.map(w => `<span class="card" style="padding:8px 14px; display:inline-flex; align-items:center; gap:6px;">${w.emoji} ${w.word}</span>`).join('')}
      </div>` : ''}

      <h3>Daily challenge history</h3>
      <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:20px;">
        ${historyDays.length ? historyDays.map(d => `
          <div class="card" style="display:flex; justify-content:space-between; padding:10px 16px;">
            <span>${d}</span><span>✅ ${profile.dailyLog[d].length} challenge(s) confirmed</span>
          </div>`).join('') : '<p style="color:var(--color-ink-light);">No confirmed days yet — confirm from the Challenge tab once you\'ve sat with your child.</p>'}
      </div>

      <button class="btn btn--ghost" id="resetBtn" style="align-self:center;">Reset this child's progress</button>
    `;
    root.appendChild(wrap);
    root.appendChild(GardenView.bottomNav('parent'));

    wrap.querySelector('#langEnBtn').addEventListener('click', async () => {
      const store2 = Storage.getRoot();
      store2.profiles[profile.id].languageMode = 'en-first';
      Storage.saveRoot(store2);
      const appRoot = document.getElementById('app');
      appRoot.innerHTML = '';
      await render(appRoot);
    });
    wrap.querySelector('#langZhBtn').addEventListener('click', async () => {
      const store2 = Storage.getRoot();
      store2.profiles[profile.id].languageMode = 'zh-first';
      Storage.saveRoot(store2);
      const appRoot = document.getElementById('app');
      appRoot.innerHTML = '';
      await render(appRoot);
    });

    wrap.querySelector('#resetBtn').addEventListener('click', async () => {
      const ok = await ParentGate.prompt({ title: 'Are you sure?', subtitle: 'This clears all progress for this child. One more check:' });
      if (!ok) return;
      if (!confirm(`Really reset all progress for ${profile.name}?`)) return;
      const store2 = Storage.getRoot();
      const fresh = Storage.defaultProfile(profile.name, profile.avatar);
      fresh.id = profile.id;
      store2.profiles[profile.id] = fresh;
      Storage.saveRoot(store2);
      Router.navigate('home');
    });
  }

  function _statCard(icon, value, label) {
    return `<div class="card" style="text-align:center; padding:14px 6px;">
      <div style="font-size:1.6rem;">${icon}</div>
      <div style="font-family:var(--font-display); font-weight:700; font-size:1.3rem;">${value}</div>
      <div style="font-size:0.75rem; color:var(--color-ink-light);">${label}</div>
    </div>`;
  }

  async function _letterBreakdown(store, profile) {
    const idx = await WordData.loadIndex();
    const rows = [];
    for (const entry of idx.letters) {
      const words = await WordData.loadLetter(entry.letter);
      const mastered = words.filter(w => profile.wordStats[w.id] && profile.wordStats[w.id].mastered).length;
      if (words.length) rows.push({ letter: entry.letter, mastered, total: words.length, pct: mastered / words.length });
    }
    return rows;
  }

  async function _findStrugglers(wordStats) {
    const strugglerIds = Object.entries(wordStats)
      .filter(([, s]) => !s.mastered && s.seenCount >= 3)
      .map(([id]) => id);
    if (!strugglerIds.length) return [];
    const all = await WordData.loadAll();
    return strugglerIds.map(id => all.find(w => w.id === id)).filter(Boolean).slice(0, 10);
  }

  return { render };
})();
