/**
 * Gamification — Streaks & Achievements
 *
 * Manages daily streak tracking with streak shields (awarded every 7 days,
 * max 3), and checks/awards achievements after each completed session.
 *
 * @module js/gamification
 */

import { state, ACHIEVEMENTS } from './state.js';
import { saveAchievements } from './storage.js';
import { renderAchievements, showToast } from './render/index.js';

// ---------------------------------------------------------------------------
// Streak tracking
// ---------------------------------------------------------------------------

/**
 * Update the daily streak. Uses streak shields to bridge a single missed day.
 * Awards a new shield every 7 consecutive days (max 3).
 */
export function updateStreak() {
  const today = new Date().toDateString();
  if (state.streakData.lastDate === today) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  if (state.streakData.lastDate === yesterday.toDateString()) {
    state.streakData.current++;
  } else if (state.streakData.lastDate === twoDaysAgo.toDateString() && state.streakShields > 0) {
    // Use a shield to bridge the missed day
    state.streakShields--;
    localStorage.setItem('pp_shields', state.streakShields);
    state.streakData.current++;
    showToast('🛡️ Streak Shield used — streak maintained!');
  } else {
    state.streakData.current = 1;
  }

  state.streakData.lastDate = today;
  if (state.streakData.current > state.streakData.best) {
    state.streakData.best = state.streakData.current;
  }

  // Award shield every 7 days
  if (state.streakData.current % 7 === 0) {
    state.streakShields = Math.min(3, state.streakShields + 1);
    localStorage.setItem('pp_shields', state.streakShields);
    showToast('🛡️ Streak Shield earned!');
  }
}

// ---------------------------------------------------------------------------
// Achievement checking
// ---------------------------------------------------------------------------

/**
 * Check all achievement conditions and unlock any newly earned ones.
 * Shows toast notifications for each new unlock.
 */
export function checkAchievements() {
  const newlyUnlocked = [];

  ACHIEVEMENTS.forEach(a => {
    if (state.unlockedAchievements.includes(a.id)) return;
    if (a.check(state.sessionHistory, state.streakData)) {
      state.unlockedAchievements.push(a.id);
      newlyUnlocked.push(a);
    }
  });

  if (newlyUnlocked.length > 0) {
    saveAchievements();
    newlyUnlocked.forEach((a, i) => {
      setTimeout(() => showToast(`${a.icon} Unlocked: ${a.name}!`), 600 * (i + 1));
    });
    renderAchievements();
  }
}
