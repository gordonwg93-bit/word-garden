/* =========================================================
   speech.js
   Bilingual audio via the Web Speech API (SpeechSynthesis).
   No audio files to manage per word — voices are generated
   on-device, which is why "lots of sound" scales to 400+
   words without a huge asset bundle.
   ========================================================= */
const Speech = (() => {
  let voices = [];
  let voicesReady = false;

  function loadVoices() {
    voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
    voicesReady = voices.length > 0;
  }

  if (window.speechSynthesis) {
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  function pickVoice(lang) {
    // lang: 'en' or 'zh'
    if (!voices.length) loadVoices();
    const prefixMap = { en: ['en-AU', 'en-au', 'en-GB', 'en-US', 'en'], zh: ['zh-CN', 'zh-cn', 'zh-TW', 'zh'] };
    const prefixes = prefixMap[lang] || [lang];
    for (const p of prefixes) {
      const match = voices.find(v => v.lang && v.lang.toLowerCase().startsWith(p.toLowerCase()));
      if (match) return match;
    }
    return null;
  }

  function speak(text, lang, opts = {}) {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) { resolve(false); return; }
      window.speechSynthesis.cancel(); // stop overlapping speech from fast tapping
      const utter = new SpeechSynthesisUtterance(text);
      const voice = pickVoice(lang);
      if (voice) utter.voice = voice;
      utter.lang = voice ? voice.lang : (lang === 'zh' ? 'zh-CN' : 'en-AU');
      utter.rate = opts.rate || 0.85;   // slightly slower, easier for little ears
      utter.pitch = opts.pitch || 1.05;
      utter.onend = () => resolve(true);
      utter.onerror = () => resolve(false);
      window.speechSynthesis.speak(utter);
    });
  }

  // Speak the word, a short pause, then its translation. Order follows the
  // active profile's languageMode so a Chinese-first family can flip which
  // language leads, everywhere in the app, from one setting.
  async function speakBilingual(wordEn, wordZh) {
    const zhFirst = _isZhFirst();
    const first = zhFirst ? wordZh : wordEn;
    const firstLang = zhFirst ? 'zh' : 'en';
    const second = zhFirst ? wordEn : wordZh;
    const secondLang = zhFirst ? 'en' : 'zh';
    await speak(first, firstLang);
    await new Promise(r => setTimeout(r, 350));
    await speak(second, secondLang);
  }

  function _isZhFirst() {
    try {
      const root = Storage.getRoot();
      const profile = root.profiles[root.activeProfileId];
      return profile && profile.languageMode === 'zh-first';
    } catch (e) { return false; }
  }

  function speakEncouragement(phrase) {
    // Aussie encouragement phrases are always spoken in English.
    return speak(phrase, 'en', { rate: 0.95, pitch: 1.15 });
  }

  return { speak, speakBilingual, speakEncouragement };
})();
