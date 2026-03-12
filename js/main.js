/**
 * Progressive Pomodoro — main entry point
 * Imports all modules and boots the application.
 */

import { state } from './state.js';
import { dom } from './dom.js';
import { loadSettings, loadHistory, loadStreak, loadAchievements } from './storage.js';
import { initAppearance } from './theme.js';
import { startAmbient } from './audio.js';
import { setTimerCallbacks } from './timer.js';
import { resetTimer } from './timer.js';
import {
  updateTopStats,
  renderHistory,
  renderWeeklyChart,
  renderStats,
  renderDailyChallenge,
  renderSessionDots,
} from './render.js';
import { registerAllEvents } from './events.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Load all persisted data into state
  loadSettings();
  loadHistory();
  loadStreak();
  loadAchievements();

  // 2. Apply appearance (theme, accent, font-size, animations)
  initAppearance();

  // 3. Sync settings inputs with loaded state
  dom.initialWork.value       = state.workDuration / 60;
  dom.intervalAdjust.value    = state.intervalAdjust / 60;
  dom.breakDuration.value     = state.breakDuration / 60;
  dom.longBreakDuration.value = state.longBreakDuration / 60;
  dom.soundEnabled.checked    = state.soundEnabled;
  dom.notifEnabled.checked    = state.notifEnabled;
  dom.autoBreak.checked       = state.autoBreak;
  dom.autoWork.checked        = state.autoWork;

  // Highlight active ambient button
  document.querySelectorAll('.ambient-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.ambient === state.currentAmbient);
  });

  // 4. Wire timer → rating callback (avoid circular import)
  setTimerCallbacks(
    /* onWorkComplete  */ () => { /* already handled inside timer.js */ },
    /* onBreakComplete */ () => { updateTopStats(); renderDailyChallenge(); },
  );

  // 5. Register all DOM event listeners
  registerAllEvents();

  // 6. Initial render
  resetTimer();
  updateTopStats();
  renderHistory();
  renderWeeklyChart();
  renderStats();
  renderSessionDots();
  renderDailyChallenge();

  // 7. Resume ambient sound if user had one active
  if (state.currentAmbient !== 'none') startAmbient(state.currentAmbient);

  // 8. Request notification permission if needed
  if (state.notifEnabled && Notification.permission === 'default') {
    Notification.requestPermission();
  }
});
