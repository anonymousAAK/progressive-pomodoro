import { state, POMODOROS_BEFORE_LONG_BREAK, MILESTONES, calculateXP } from './state.js';
import { dom } from './dom.js';
import { playSound } from './audio.js';
import { saveHistory, saveStreak } from './storage.js';
import { updateTopStats, renderHistory, renderWeeklyChart, renderStats, renderDailyChallenge, showToast, showMilestoneCelebration, checkFocusTrend } from './render.js';
import { switchMode, startTimer } from './timer.js';
import { updateStreak, checkAchievements } from './gamification.js';
import {
  getSessionMultiplier,
  calculateCoins,
  addCoins,
  renderCoinBalance,
  renderMultiplierBadge,
  fireWebhook,
  sendEnhancedNotification,
  hapticFeedback,
  announceToScreenReader,
} from './features-batch5.js';

// BroadcastChannel for multi-tab sync (shared via window)
let _bc = null;
export function setRatingBC(bc) { _bc = bc; }

export function handleRating(rating) {
  state.lastFocusRating = rating;
  const durationMin = parseFloat((state.totalSeconds / 60).toFixed(1));

  // Capture note and reset input
  const note = dom.sessionNoteInput ? dom.sessionNoteInput.value.trim() : '';
  if (dom.sessionNoteInput) dom.sessionNoteInput.value = '';

  state.completedPomodoros++;
  updateStreak();
  saveStreak();

  // #82 Session multiplier (calculate before saving session)
  const multiplier = getSessionMultiplier();

  // Save session entry
  const sessionEntry = {
    mode: 'Work',
    task:        state.currentTask || 'Untitled',
    category:    state.currentCategory,
    duration:    durationMin,
    rating:      rating.charAt(0).toUpperCase() + rating.slice(1),
    distractions: state.distractionCount,
    note,
    energy:      state.currentEnergy,
    intention:   state.currentIntention,
    timestamp:   new Date().toISOString(),
    displayTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date:        new Date().toDateString(),
  };
  state.sessionHistory.unshift(sessionEntry);
  saveHistory();

  // Notify other tabs
  if (_bc) _bc.postMessage({ type: 'session_saved' });

  // #82 XP with multiplier
  const baseXP = calculateXP(durationMin, rating);
  const xpMultiplier = Math.min(multiplier, 5);
  const earned = baseXP * xpMultiplier;
  state.xp += earned;
  state.level = Math.floor(state.xp / 250) + 1;
  localStorage.setItem('pp_xp', state.xp);
  const multText = xpMultiplier > 1 ? ` (x${xpMultiplier})` : '';
  setTimeout(() => showToast(`+${earned} XP${multText}`), 100);

  // #84 Focus Coins
  const coinsEarned = calculateCoins(durationMin, sessionEntry.rating);
  addCoins(coinsEarned);
  setTimeout(() => showToast(`+${coinsEarned} coins`), 600);

  // #82 Update multiplier badge
  renderMultiplierBadge();
  renderCoinBalance();

  // #109 Webhook
  fireWebhook(sessionEntry);

  // #101 Haptic feedback on session end
  hapticFeedback('timer-end');

  // #94 Screen reader announcement
  announceToScreenReader(`Session complete. Rating: ${rating}. Earned ${earned} XP and ${coinsEarned} coins.`);

  // Milestone check
  if (MILESTONES.has(state.sessionHistory.length)) {
    setTimeout(() => showMilestoneCelebration(state.sessionHistory.length), 400);
  }

  // Focus trend check
  checkFocusTrend();

  // Reset energy
  state.currentEnergy = '';
  document.querySelectorAll('.energy-btn').forEach(b => b.classList.remove('active'));

  // Clear intention input
  if (dom.intentionInput) dom.intentionInput.value = '';
  state.currentIntention = '';

  // Reset distraction counter
  state.distractionCount = 0;
  if (dom.distractionCount) dom.distractionCount.textContent = '0';

  // Hide rating panel, show controls
  dom.focusRating.classList.add('hidden');
  dom.timerControls.classList.remove('hidden');

  // Adaptive duration adjustment
  switch (rating) {
    case 'distracted': state.workDuration = Math.max(60, state.workDuration - state.intervalAdjust); break;
    case 'focused':    state.workDuration += state.intervalAdjust;     break;
    case 'flow':       state.workDuration += state.intervalAdjust * 2; break;
    // 'okay': no change
  }

  // Determine next mode
  const nextMode = state.completedPomodoros >= POMODOROS_BEFORE_LONG_BREAK ? 'longbreak' : 'break';
  if (nextMode === 'longbreak') state.completedPomodoros = 0;

  // Focused / Flow → skip break
  if (rating === 'focused' || rating === 'flow') {
    switchMode('work');
    startTimer();
  } else {
    switchMode(nextMode);
    if (state.autoBreak) startTimer();
  }

  // Update all UI
  updateTopStats();
  renderHistory();
  renderWeeklyChart();
  renderStats();
  renderDailyChallenge();
  checkAchievements();
}
