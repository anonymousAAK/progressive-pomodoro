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
} from './render.js';
import { registerAllEvents } from './events.js';
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
} from './features-batch5.js';
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

  // 6b. Batch 5 features init
  initBatch5Features();
  renderCoinBalance();
  renderMultiplierBadge();
  renderUnlockableThemes();

  // 7. Resume ambient sound if user had one active
  if (state.currentAmbient !== 'none') startAmbient(state.currentAmbient);

  // 8. Request notification permission if needed
  if (state.notifEnabled && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  // 9. Register service worker for PWA
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
