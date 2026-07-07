/* =========================================================
   dailyChallenge.js

   Design intent (per Gordon's brief):
   - A challenge is "5 words", not "5 words per calendar day".
     It stays open — and the app will NOT hand out a new set —
     until a parent confirms it's genuinely done. This stops a
     kid from tapping through and unlocking tomorrow's words
     before today's are actually learned.
   - Word selection walks the alphabet in order (matches how
     the letter garden unlocks) but always fills gaps with
     already-introduced-but-not-yet-mastered words first, so
     review is baked in rather than being 100% new content.
   ========================================================= */
const DailyChallenge = (() => {
  const CHALLENGE_SIZE = 5;

  function _lettersInOrder() {
    return 'abcdefghijklmnopqrstuvwxyz'.split('');
  }

  async function _pickNextWords(root, profileId, allWordsByLetter) {
    const profile = root.profiles[profileId];
    const introducedIds = new Set(Object.keys(profile.wordStats));

    // 1. Prefer introduced-but-not-mastered words (spaced review), oldest first.
    const reviewCandidates = Object.entries(profile.wordStats)
      .filter(([, s]) => !s.mastered)
      .sort((a, b) => new Date(a[1].lastSeen) - new Date(b[1].lastSeen))
      .map(([id]) => id);

    const picked = [];
    for (const id of reviewCandidates) {
      if (picked.length >= 2) break; // cap review words so new content still dominates
      picked.push(id);
    }

    // 2. Fill remaining slots with new words, walking the alphabet in order.
    outer:
    for (const letter of _lettersInOrder()) {
      const words = allWordsByLetter[letter] || [];
      for (const w of words) {
        if (picked.length >= CHALLENGE_SIZE) break outer;
        if (!introducedIds.has(w.id) && !picked.includes(w.id)) {
          picked.push(w.id);
        }
      }
    }

    return picked.slice(0, CHALLENGE_SIZE);
  }

  async function getOrCreateChallenge(root, profileId, allWordsByLetter) {
    const profile = root.profiles[profileId];
    if (profile.currentChallenge && !profile.currentChallenge.parentConfirmed) {
      return profile.currentChallenge;
    }
    const wordIds = await _pickNextWords(root, profileId, allWordsByLetter);
    profile.currentChallenge = {
      id: 'ch_' + Date.now(),
      wordIds,
      startedAt: new Date().toISOString(),
      wordProgress: {},     // wordId -> true once child has "completed" it in-session
      parentConfirmed: false,
      confirmedAt: null
    };
    return profile.currentChallenge;
  }

  function markWordDone(root, profileId, wordId) {
    const profile = root.profiles[profileId];
    if (!profile.currentChallenge) return root;
    profile.currentChallenge.wordProgress[wordId] = true;
    return root;
  }

  function isReadyForParentReview(profile) {
    if (!profile.currentChallenge) return false;
    return profile.currentChallenge.wordIds.every(id => profile.currentChallenge.wordProgress[id]);
  }

  function confirmChallenge(root, profileId) {
    const profile = root.profiles[profileId];
    if (!profile.currentChallenge) return root;
    profile.currentChallenge.parentConfirmed = true;
    profile.currentChallenge.confirmedAt = new Date().toISOString();
    const dateKey = new Date().toISOString().slice(0, 10);
    profile.dailyLog[dateKey] = profile.dailyLog[dateKey] || [];
    profile.dailyLog[dateKey].push(profile.currentChallenge);
    return root;
  }

  return { getOrCreateChallenge, markWordDone, isReadyForParentReview, confirmChallenge, CHALLENGE_SIZE };
})();
