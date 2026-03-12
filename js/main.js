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
  renderTaskQueue,
  renderSessionChain,
  renderRecurringTasks,
  renderTaskTemplates,
  spawnRecurringTasks,
} from './render.js';
import { registerAllEvents } from './events.js';
import { setRatingBC } from './rating.js';

// --- BroadcastChannel for multi-tab sync ---
const bc = new BroadcastChannel('pp_sync');
bc.onmessage = (e) => {
  if (e.data.type === 'session_saved') {
    loadHistory();
    updateTopStats();
    renderHistory();
  }
};
setRatingBC(bc);

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

  // Sync new feature toggles
  if (dom.countUpToggle) dom.countUpToggle.checked = state.countUp;
  if (dom.microBreakEnabled) dom.microBreakEnabled.checked = state.microBreakEnabled;
  if (dom.sessionTargetInput) dom.sessionTargetInput.value = state.sessionTarget;
  const affirmToggle = document.getElementById('affirmations-enabled');
  if (affirmToggle) affirmToggle.checked = state.affirmationsEnabled;

  // New feature settings sync
  if (dom.warmupToggle) dom.warmupToggle.checked = state.warmUpEnabled;
  if (dom.overtimeToggle) dom.overtimeToggle.checked = state.overtimeEnabled;
  if (dom.pauseLimitInput) dom.pauseLimitInput.value = state.pauseLimit;
  if (dom.lockoutInput) dom.lockoutInput.value = state.lockoutSessions;
  if (dom.minSessionInput) dom.minSessionInput.value = state.minSessionMinutes;
  if (dom.winddownToggle) dom.winddownToggle.checked = state.windDownEnabled;
  if (dom.winddownTimeInput) dom.winddownTimeInput.value = state.windDownTime;

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
  renderTaskQueue();
  renderSessionChain();
  renderRecurringTasks();
  renderTaskTemplates();

  // 7. Spawn recurring tasks for today (#33)
  spawnRecurringTasks();

  // 8. Resume ambient sound if user had one active
  if (state.currentAmbient !== 'none') startAmbient(state.currentAmbient);

  // 9. Request notification permission if needed
  if (state.notifEnabled && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  // 10. Register service worker for PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
});
