import { state, POMODOROS_BEFORE_LONG_BREAK } from './state.js';
import { dom } from './dom.js';
import { playSound } from './audio.js';
import { saveHistory, saveStreak } from './storage.js';
import { updateTopStats, renderHistory, renderWeeklyChart, renderStats, renderDailyChallenge } from './render.js';
import { switchMode, startTimer } from './timer.js';
import { updateStreak, checkAchievements } from './gamification.js';

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
    timestamp:   new Date().toISOString(),
    displayTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date:        new Date().toDateString(),
  });
  saveHistory();

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
