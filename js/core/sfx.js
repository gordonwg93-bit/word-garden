/* =========================================================
   sfx.js
   All sound effects + background music are SYNTHESISED with
   the Web Audio API — no .mp3/.wav files to license, host,
   or keep in sync as more words get added. Same reasoning as
   using emoji instead of custom art for the word bank.

   iOS requires a user gesture before audio can play, so we
   lazily create/resume the AudioContext on the first tap
   anywhere in the app (see _unlockOnFirstGesture below).
   ========================================================= */
const SFX = (() => {
  let ctx = null;
  let musicTimer = null;
  let musicNoteIndex = 0;
  let musicGain = null;

  function _ctx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    return ctx;
  }

  function _settings() {
    const root = Storage.getRoot();
    if (!root.audioSettings) {
      root.audioSettings = { sfxOn: true, musicOn: true };
      Storage.saveRoot(root);
    }
    return root.audioSettings;
  }

  function setSfxOn(on) {
    const root = Storage.getRoot();
    root.audioSettings = root.audioSettings || {};
    root.audioSettings.sfxOn = on;
    Storage.saveRoot(root);
  }

  function setMusicOn(on) {
    const root = Storage.getRoot();
    root.audioSettings = root.audioSettings || {};
    root.audioSettings.musicOn = on;
    Storage.saveRoot(root);
    if (on) startMusic(); else stopMusic();
  }

  // --- low-level tone helper: sine/triangle blip with a soft
  // attack/decay envelope so nothing clicks or pops harshly ---
  function _tone(freq, startOffset, duration, { type = 'sine', gain = 0.18, glideTo = null } = {}) {
    const c = _ctx();
    if (!c) return;
    const t0 = c.currentTime + startOffset;
    const osc = c.createOscillator();
    const gainNode = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + duration);
    gainNode.gain.setValueAtTime(0, t0);
    gainNode.gain.linearRampToValueAtTime(gain, t0 + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.connect(gainNode);
    gainNode.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }

  // --- Sound effects ---
  function playTap() {
    if (!_settings().sfxOn) return;
    _tone(520, 0, 0.08, { type: 'sine', gain: 0.1 });
  }

  function playCorrect() {
    if (!_settings().sfxOn) return;
    _tone(523.25, 0, 0.14, { type: 'triangle' });     // C5
    _tone(659.25, 0.09, 0.16, { type: 'triangle' });  // E5
    _tone(783.99, 0.18, 0.22, { type: 'triangle' });  // G5
  }

  function playWrong() {
    if (!_settings().sfxOn) return;
    _tone(220, 0, 0.16, { type: 'sine', gain: 0.14, glideTo: 160 });
  }

  function playCelebrate() {
    if (!_settings().sfxOn) return;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C(octave)
    notes.forEach((f, i) => _tone(f, i * 0.1, 0.28, { type: 'triangle', gain: 0.16 }));
  }

  function playPop() {
    if (!_settings().sfxOn) return;
    _tone(880, 0, 0.06, { type: 'square', gain: 0.06 });
  }

  function playWhoosh() {
    if (!_settings().sfxOn) return;
    _tone(300, 0, 0.18, { type: 'sine', gain: 0.08, glideTo: 700 });
  }

  // --- Background music: a gentle looping pentatonic phrase.
  // Uses lookahead scheduling (schedule slightly ahead of real
  // time) rather than setInterval-triggered notes, which keeps
  // timing smooth even if the tab is briefly busy. ---
  const MUSIC_SCALE = [392.00, 440.00, 523.25, 587.33, 659.25, 783.99]; // G major pentatonic-ish, calm
  const MUSIC_PATTERN = [0, 2, 4, 2, 1, 3, 5, 3, 0, 4, 2, 5, 3, 1, 4, 2]; // indices into scale, loops
  const NOTE_DURATION = 0.55; // seconds between notes - slow, unobtrusive

  function startMusic() {
    if (!_settings().musicOn) return;
    const c = _ctx();
    if (!c || musicTimer) return;
    if (!musicGain) {
      musicGain = c.createGain();
      musicGain.gain.value = 0.05; // deliberately quiet - it's a backdrop, not a feature
      musicGain.connect(c.destination);
    }
    musicNoteIndex = 0;
    _scheduleNextNote();
  }

  function _scheduleNextNote() {
    const c = _ctx();
    if (!c) return;
    const freq = MUSIC_SCALE[MUSIC_PATTERN[musicNoteIndex % MUSIC_PATTERN.length]];
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime(1, c.currentTime + 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + NOTE_DURATION * 0.9);
    osc.connect(g);
    g.connect(musicGain);
    osc.start();
    osc.stop(c.currentTime + NOTE_DURATION);
    musicNoteIndex++;
    musicTimer = setTimeout(_scheduleNextNote, NOTE_DURATION * 1000);
  }

  function stopMusic() {
    if (musicTimer) { clearTimeout(musicTimer); musicTimer = null; }
  }

  // --- Unlock audio on the very first tap anywhere (iOS policy) ---
  function _unlockOnFirstGesture() {
    const unlock = () => {
      const c = _ctx();
      if (c && c.state === 'suspended') c.resume();
      if (_settings().musicOn) startMusic();
      document.removeEventListener('touchend', unlock);
      document.removeEventListener('click', unlock);
    };
    document.addEventListener('touchend', unlock, { once: true });
    document.addEventListener('click', unlock, { once: true });
  }
  _unlockOnFirstGesture();

  return {
    playTap, playCorrect, playWrong, playCelebrate, playPop, playWhoosh,
    startMusic, stopMusic, setSfxOn, setMusicOn,
    isSfxOn: () => _settings().sfxOn,
    isMusicOn: () => _settings().musicOn
  };
})();
