/**
 * Focus Rating Handler
 *
 * Processes the user's post-session focus rating. Saves the session entry,
 * awards XP and coins (with multiplier), updates streaks and achievements,
 * adjusts the next work duration based on the adaptive algorithm, and
 * transitions to the appropriate break/work mode.
 *
 * Also handles reflection prompts (#25) and multi-tab sync via
 * BroadcastChannel.
 *
 * @module js/rating
 */

import { state, POMODOROS_BEFORE_LONG_BREAK, MILESTONES, calculateXP, REFLECTION_PROMPTS } from './state.js';
import { dom } from './dom.js';
import { playSound } from './audio.js';
import { saveHistory, saveStreak } from './storage.js';
import { updateTopStats, renderHistory, renderWeeklyChart, renderStats, renderDailyChallenge, showToast, showMilestoneCelebration, checkFocusTrend } from './render/index.js';
import { switchMode, startTimer, updateLockoutUI } from './timer.js';
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
} from './features/index.js';

/** @type {BroadcastChannel|null} For multi-tab session sync */
let _bc = null;

/**
 * Set the BroadcastChannel instance for multi-tab sync.
 * @param {BroadcastChannel} bc
 */
export function setRatingBC(bc) { _bc = bc; }

/**
 * Show a random reflection prompt (#25).
 * Avoids repeating the same prompt consecutively.
 */
export function showReflectionPrompt() {
  if (!dom.reflectionPrompt || !dom.reflectionQuestion) return;
  let idx = Math.floor(Math.random() * REFLECTION_PROMPTS.length);
  // Avoid repeating the same prompt
  if (idx === state.lastReflectionIndex && REFLECTION_PROMPTS.length > 1) {
    idx = (idx + 1) % REFLECTION_PROMPTS.length;
  }
  state.lastReflectionIndex = idx;
  dom.reflectionQuestion.textContent = '💭 ' + REFLECTION_PROMPTS[idx];
}

/**
 * Process a focus rating after a work session completes.
 * Saves session, awards XP/coins, updates streak, adjusts next duration,
 * and transitions to break or next work session.
 * @param {'distracted'|'okay'|'focused'|'flow'} rating
 */
export function handleRating(rating) {
  state.lastFocusRating = rating;
  const durationMin = parseFloat((state.totalSeconds / 60).toFixed(1));
  const actualDurationMin = parseFloat(((state.actualWorkSeconds || state.totalSeconds) / 60).toFixed(1));

  // Check minimum session threshold (#12)
  const effectiveDuration = state.actualWorkSeconds > 0 ? state.actualWorkSeconds / 60 : durationMin;
  const belowThreshold = effectiveDuration < state.minSessionMinutes;
  if (belowThreshold) {
    showToast(`⚠️ Session under ${state.minSessionMinutes}min — not counted in stats`);
  }

  // Capture note and reset input
  const note = dom.sessionNoteInput ? dom.sessionNoteInput.value.trim() : '';
  if (dom.sessionNoteInput) dom.sessionNoteInput.value = '';

  state.completedPomodoros++;

  // Lockout tracking (#9)
  if (state.lockoutRemaining > 0) {
    state.lockoutRemaining--;
    localStorage.setItem('pp_lockoutRemaining', state.lockoutRemaining);
  }

  updateStreak();
  saveStreak();

  // #82 Session multiplier (calculate before saving session)
  const multiplier = getSessionMultiplier();

  // Save session entry (with new fields)
  const sessionEntry = {
    mode: 'Work',
    task:        state.currentTask || 'Untitled',
    category:    state.currentCategory,
    duration:    actualDurationMin > 0 ? actualDurationMin : durationMin,
    rating:      rating.charAt(0).toUpperCase() + rating.slice(1),
    distractions: state.distractionCount,
    note,
    energy:      state.currentEnergy,
    intention:   state.currentIntention,
    overtime:    state.overtimeSeconds || 0,
    mood:        state.currentMood || '',
    complexity:  state.currentComplexity || 0,
    belowThreshold,
    timestamp:   new Date().toISOString(),
    displayTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date:        new Date().toDateString(),
  };

  state.sessionHistory.unshift(sessionEntry);
  saveHistory();

  // Notify other tabs
  if (_bc) _bc.postMessage({ type: 'session_saved' });

  // #82 XP with multiplier (skip if below threshold)
  if (!belowThreshold) {
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

    // #94 Screen reader announcement
    announceToScreenReader(`Session complete. Rating: ${rating}. Earned ${earned} XP and ${coinsEarned} coins.`);
  }

  // #82 Update multiplier badge
  renderMultiplierBadge();
  renderCoinBalance();

  // #109 Webhook
  fireWebhook(sessionEntry);

  // #101 Haptic feedback on session end
  hapticFeedback('timer-end');

  // Milestone check
  const countableSessions = state.sessionHistory.filter(s => !s.belowThreshold).length;
  if (MILESTONES.has(countableSessionsCount())) {
    setTimeout(() => showMilestoneCelebration(countableSessionsCount()), 400);
  }

  // Focus trend check
  checkFocusTrend();

  // Reset energy, mood, complexity
  state.currentEnergy = '';
  state.currentMood = '';
  state.currentComplexity = 0;
  document.querySelectorAll('.energy-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.complexity-star').forEach(b => b.classList.remove('active'));

  // Clear intention input
  if (dom.intentionInput) dom.intentionInput.value = '';
  state.currentIntention = '';

  // Reset distraction counter
  state.distractionCount = 0;
  if (dom.distractionCount) dom.distractionCount.textContent = '0';

  // Reset overtime
  state.overtimeSeconds = 0;
  state.isOvertime = false;

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

  // Check if in a session chain (#11)
  if (state.sessionChain.length > 0 && state.chainIndex >= 0) {
    if (state.chainIndex < state.sessionChain.length) {
      state.sessionChain[state.chainIndex].done = true;
    }
    // Move to break then next chain entry
    switchMode(nextMode);
    if (state.autoBreak) startTimer();
  } else if (rating === 'focused' || rating === 'flow') {
    // Focused / Flow -> skip break
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
  updateLockoutUI();
}

function countableSessionsCount() {
  return state.sessionHistory.filter(s => !s.belowThreshold).length;
}
