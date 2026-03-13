/**
 * Application Entry Point
 *
 * Boots the Progressive Pomodoro app by orchestrating module initialization
 * in the correct order:
 *
 *   1. Load persisted data (settings, history, streaks, achievements)
 *   2. Apply visual appearance (theme, accent, fonts, animations)
 *   3. Sync DOM inputs with loaded state values
 *   4. Wire timer completion callbacks (avoids circular import)
 *   5. Register all DOM event listeners
 *   6. Perform initial render of all UI components
 *   7. Initialize batch 5 features (accessibility, gamification, etc.)
 *   8. Resume ambient sound, request notifications, register service worker
 *
 * Also sets up BroadcastChannel for multi-tab session sync.
 *
 * @module js/main
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
} from './render/index.js';
import { registerAllEvents } from './events/index.js';
import { setRatingBC } from './rating.js';
import {
  initBatch5Features,
  renderWeeklyMissions,
  renderFocusGarden,
  renderMultiplierBadge,
  renderUnlockableThemes,
  renderCoinBalance,
  renderProgressTimeline,
  updateWidget,
  setTimerFunctions,
} from './features/index.js';
import { startTimer, pauseTimer, switchMode } from './timer.js';

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

  // 5b. Provide timer functions to voice control (#100)
  setTimerFunctions({ startTimer, pauseTimer, resetTimer, switchMode });

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

  // 7b. Batch 5 features init
  initBatch5Features();
  renderCoinBalance();
  renderMultiplierBadge();
  renderUnlockableThemes();

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

  // 10. Sync batch 5 settings UI
  const highContrastToggle = document.getElementById('high-contrast-toggle');
  if (highContrastToggle) highContrastToggle.checked = localStorage.getItem('pp_highContrast') === 'true';

  const hapticToggle = document.getElementById('haptic-toggle');
  if (hapticToggle) hapticToggle.checked = localStorage.getItem('pp_haptic') === 'true';

  const voiceToggle = document.getElementById('voice-control-toggle');
  if (voiceToggle) voiceToggle.checked = localStorage.getItem('pp_voiceControl') === 'true';

  const perfToggle = document.getElementById('performance-mode-toggle');
  if (perfToggle) perfToggle.checked = localStorage.getItem('pp_performanceMode') === 'true';

  const webhookInput = document.getElementById('webhook-url-input');
  if (webhookInput) webhookInput.value = localStorage.getItem('pp_webhookUrl') || '';

  const webhookEnabled = document.getElementById('webhook-enabled-toggle');
  if (webhookEnabled) webhookEnabled.checked = localStorage.getItem('pp_webhookEnabled') === 'true';

  const langSelect = document.getElementById('language-select');
  if (langSelect) langSelect.value = localStorage.getItem('pp_lang') || 'en';

  const cbPalette = localStorage.getItem('pp_colorblind') || 'none';
  document.querySelectorAll('.cb-opt').forEach(b => {
    b.classList.toggle('active', b.dataset.cb === cbPalette);
  });

  // 11. Widget update loop
  setInterval(() => {
    updateWidget();
  }, 1000);
});
