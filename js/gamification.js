import { state, ACHIEVEMENTS } from './state.js';
import { saveAchievements } from './storage.js';
import { renderAchievements, showToast } from './render.js';

// --- Streak ---

export function updateStreak() {
  const today = new Date().toDateString();
  if (state.streakData.lastDate === today) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (state.streakData.lastDate === yesterday.toDateString()) {
    state.streakData.current++;
  } else {
    state.streakData.current = 1;
  }

  state.streakData.lastDate = today;
  if (state.streakData.current > state.streakData.best) {
    state.streakData.best = state.streakData.current;
  }
}

// --- Achievements ---

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
