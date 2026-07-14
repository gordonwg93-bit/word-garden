/* =========================================================
   progress.js
   Tracks per-word mastery for the active profile.

   Mastery model (deliberately simple + transparent for parents):
   - "seen"      : shown at least once
   - "practicing": correctStreak 1-2 across any game
   - "mastered"  : correctStreak >= 3 across DIFFERENT games
                   (stops it being "memorised one game's pattern")
   ========================================================= */
const Progress = (() => {
  const MASTERY_STREAK = 3;

  function _getProfile(root, profileId) {
    return root.profiles[profileId];
  }

  function getStats(root, profileId, wordId) {
    const profile = _getProfile(root, profileId);
    if (!profile) return null;
    return profile.wordStats[wordId] || {
      seenCount: 0,
      correctStreak: 0,
      gamesUsedForStreak: [],
      mastered: false,
      lastSeen: null
    };
  }

  function recordAttempt(root, profileId, wordId, gameId, wasCorrect) {
    const profile = _getProfile(root, profileId);
    if (!profile) return root;
    const stat = profile.wordStats[wordId] || {
      seenCount: 0, correctStreak: 0, gamesUsedForStreak: [], mastered: false, lastSeen: null
    };
    stat.seenCount += 1;
    stat.lastSeen = new Date().toISOString();

    if (wasCorrect) {
      if (!stat.gamesUsedForStreak.includes(gameId)) {
        stat.gamesUsedForStreak.push(gameId);
      }
      stat.correctStreak += 1;
      if (stat.correctStreak >= MASTERY_STREAK && stat.gamesUsedForStreak.length >= 2 && !stat.mastered) {
        stat.mastered = true;
        profile.starBalance = (profile.starBalance || 0) + 1; // spendable currency for pet/shop
      }
    } else {
      // Don't punish too harshly - a slip shouldn't erase all progress,
      // it just needs one more correct rep to re-prove mastery.
      stat.correctStreak = Math.max(0, stat.correctStreak - 1);
    }

    profile.wordStats[wordId] = stat;
    return root;
  }

  function letterCompletion(root, profileId, letterWords) {
    const profile = _getProfile(root, profileId);
    if (!profile || !letterWords.length) return 0;
    const masteredCount = letterWords.filter(w => {
      const s = profile.wordStats[w.id];
      return s && s.mastered;
    }).length;
    return masteredCount / letterWords.length;
  }

  function updateDailyStreak(root, profileId) {
    const profile = _getProfile(root, profileId);
    if (!profile) return root;
    const today = new Date().toISOString().slice(0, 10);
    if (profile.lastActiveDate === today) return root; // already counted today

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (profile.lastActiveDate === yesterday) {
      profile.currentStreak += 1;
    } else {
      profile.currentStreak = 1;
    }
    profile.longestStreak = Math.max(profile.longestStreak, profile.currentStreak);
    profile.lastActiveDate = today;
    return root;
  }

  function allMasteredWordIds(root, profileId) {
    const profile = _getProfile(root, profileId);
    if (!profile) return [];
    return Object.entries(profile.wordStats)
      .filter(([, s]) => s.mastered)
      .map(([id]) => id);
  }

  return { getStats, recordAttempt, letterCompletion, updateDailyStreak, allMasteredWordIds, MASTERY_STREAK };
})();
