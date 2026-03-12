import { state, POMODOROS_BEFORE_LONG_BREAK, MILESTONES, calculateXP } from './state.js';
import { dom } from './dom.js';
import { playSound } from './audio.js';
import { saveHistory, saveStreak } from './storage.js';
import { updateTopStats, renderHistory, renderWeeklyChart, renderStats, renderDailyChallenge, showToast, showMilestoneCelebration, checkFocusTrend } from './render.js';
import { switchMode, startTimer } from './timer.js';
import { updateStreak, checkAchievements } from './gamification.js';

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

  // Save session entry
  state.sessionHistory.unshift({
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
  });
  saveHistory();

  // Notify other tabs
  if (_bc) _bc.postMessage({ type: 'session_saved' });

  // XP + Level
  const earned = calculateXP(durationMin, rating);
  state.xp += earned;
  state.level = Math.floor(state.xp / 250) + 1;
  localStorage.setItem('pp_xp', state.xp);
  setTimeout(() => showToast(`+${earned} XP`), 100);

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
