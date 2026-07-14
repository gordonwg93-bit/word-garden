/* =========================================================
   storage.js
   Thin wrapper around localStorage. Everything is namespaced
   under one root key so we never collide with other sites,
   and versioned so future schema changes can migrate safely.
   ========================================================= */
const Storage = (() => {
  const ROOT_KEY = 'wordGarden_v1';
  const SCHEMA_VERSION = 1;

  function _readRoot() {
    try {
      const raw = localStorage.getItem(ROOT_KEY);
      if (!raw) return _defaultRoot();
      const parsed = JSON.parse(raw);
      if (parsed.schemaVersion !== SCHEMA_VERSION) {
        return _migrate(parsed);
      }
      return parsed;
    } catch (e) {
      console.warn('WordGarden storage read failed, resetting.', e);
      return _defaultRoot();
    }
  }

  function _defaultRoot() {
    return {
      schemaVersion: SCHEMA_VERSION,
      profiles: {},        // profileId -> profile object
      activeProfileId: null,
      parentPinHash: null,  // optional, see parentGate.js
      audioSettings: { sfxOn: true, musicOn: true }
    };
  }

  function _migrate(oldData) {
    // Placeholder for future migrations. For now just wrap safely.
    const fresh = _defaultRoot();
    if (oldData && oldData.profiles) fresh.profiles = oldData.profiles;
    return fresh;
  }

  function _writeRoot(root) {
    localStorage.setItem(ROOT_KEY, JSON.stringify(root));
  }

  function getRoot() {
    const root = _readRoot();
    Object.values(root.profiles).forEach(_backfillProfileDefaults);
    return root;
  }

  function _backfillProfileDefaults(profile) {
    if (profile.starBalance === undefined) profile.starBalance = 0;
    if (!profile.pet) profile.pet = { name: 'Sunny', starsFed: 0 };
    if (!profile.gardenDecor) profile.gardenDecor = [];
    if (!profile.languageMode) profile.languageMode = 'en-first';
    return profile;
  }

  function saveRoot(root) { _writeRoot(root); }

  function defaultProfile(name, avatar) {
    return {
      id: 'p_' + Date.now(),
      name: name || 'Explorer',
      avatar: avatar || '🦋',
      createdAt: new Date().toISOString(),
      // per-word mastery: wordId -> { seenCount, correctStreak, mastered, lastSeen }
      wordStats: {},
      // per-day challenge log: 'YYYY-MM-DD' -> [ {id, wordIds, ...} ] confirmed challenges (used to avoid repeats)
      dailyLog: {},
      currentStreak: 0,
      longestStreak: 0,
      totalMinutes: 0,
      lastActiveDate: null,
      // spendable currency - +1 each time a NEW word is mastered, spent on pet feeding / shop
      starBalance: 0,
      pet: { name: 'Sunny', starsFed: 0 },
      gardenDecor: [],           // array of owned shop item ids
      languageMode: 'en-first'   // 'en-first' | 'zh-first' - which language leads on screen + in audio
    };
  }

  return { getRoot, saveRoot, defaultProfile };
})();
