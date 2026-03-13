/**
 * @module render/timer
 * Timer-related rendering functions: ring progress, session dots,
 * timer display updates, next-session info, celebrations, and affirmations.
 */

import { state, RING_CIRCUMFERENCE, POMODOROS_BEFORE_LONG_BREAK, AFFIRMATIONS } from '../state.js';
import { dom } from '../dom.js';
import { formatTime } from './utils.js';

/**
 * Update the SVG ring progress indicator.
 * @description Sets the stroke-dashoffset on the ring and toggles break-mode class.
 * @param {number} percent - Progress fraction between 0 and 1.
 * @returns {void}
 */
export function updateRing(percent) {
  const offset = RING_CIRCUMFERENCE * (1 - percent);
  dom.ringProgress.style.strokeDashoffset = offset;
  dom.ringProgress.classList.toggle('break-mode', state.currentMode !== 'work');
}

/**
 * Render the session-dot indicators below the timer.
 * @description Creates dot elements showing completed, active, and long-break pomodoros.
 * @returns {void}
 */
export function renderSessionDots() {
  const TOTAL = POMODOROS_BEFORE_LONG_BREAK;
  dom.sessionDots.innerHTML = '';
  for (let i = 0; i < TOTAL; i++) {
    const dot = document.createElement('div');
    dot.className = 'session-dot';
    if (i < state.completedPomodoros) dot.classList.add('completed');
    if (i === state.completedPomodoros && state.currentMode === 'work') dot.classList.add('active');
    if (i === TOTAL - 1 && state.completedPomodoros >= TOTAL) dot.classList.add('long-break');
    dom.sessionDots.appendChild(dot);
  }
}

/**
 * Update the main timer display and document title.
 * @description Writes the formatted time to the timer element, updates the ring, and sets the page title.
 * @param {number} secondsLeft - Seconds remaining (or elapsed in count-up mode).
 * @param {number} totalSeconds - Total duration of the current session in seconds.
 * @param {string} currentMode - Either 'work' or 'break'.
 * @param {number|null} timerInterval - The active interval ID, or null if stopped.
 * @returns {void}
 */
export function updateTimerDisplay(secondsLeft, totalSeconds, currentMode, timerInterval) {
  dom.timerDisplay.textContent = formatTime(secondsLeft);
  const elapsed = state.countUp ? secondsLeft : (totalSeconds - secondsLeft);
  const percent = totalSeconds > 0 ? elapsed / totalSeconds : 0;
  dom.ringProgress.style.strokeDashoffset = RING_CIRCUMFERENCE * (1 - percent);
  dom.ringProgress.classList.toggle('break-mode', currentMode !== 'work');

  const displayForTitle = state.countUp ? secondsLeft : secondsLeft;
  document.title = timerInterval
    ? `${formatTime(secondsLeft)} - ${currentMode === 'work' ? 'Work' : 'Break'} | Progressive Pomodoro`
    : 'Progressive Pomodoro';
}

/**
 * Display what comes after the current session (break or work duration).
 * @description Updates the "Next:" info text below the timer.
 * @returns {void}
 */
export function updateNextInfo() {
  if (!dom.timerNextInfo) return;
  dom.timerNextInfo.textContent = state.currentMode === 'work'
    ? `Next: ${Math.round(state.breakDuration / 60)} min break`
    : `Next: ${Math.round(state.workDuration / 60)} min work`;
}

// --- Private celebration helpers ---

function _spawnConfetti(count, colors, delayMax, durMin) {
  for (let i = 0; i < count; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.cssText = `left:${Math.random() * 100}%;top:-10px;background:${colors[Math.floor(Math.random() * colors.length)]};animation-delay:${Math.random() * delayMax}s;animation-duration:${durMin + Math.random()}s`;
    dom.celebration.appendChild(c);
  }
}

function _spawnFireworks(count, colors) {
  for (let i = 0; i < count; i++) {
    const fw = document.createElement('div');
    fw.className = 'firework';
    fw.style.cssText = `left:${10 + Math.random() * 80}%;top:${10 + Math.random() * 60}%;background:${colors[Math.floor(Math.random() * colors.length)]};animation-delay:${Math.random() * 1}s;`;
    dom.celebration.appendChild(fw);
  }
}

function _spawnSparkles(count, colors) {
  for (let i = 0; i < count; i++) {
    const sp = document.createElement('div');
    sp.className = 'sparkle';
    sp.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;color:${colors[Math.floor(Math.random() * colors.length)]};animation-delay:${Math.random() * 1.5}s;`;
    dom.celebration.appendChild(sp);
  }
}

/**
 * Show a celebration animation (confetti, fireworks, or sparkles).
 * @description Triggers the user's chosen celebration style after completing a session.
 * @returns {void}
 */
export function showCelebration() {
  const style = state.celebrationStyle || 'confetti';
  if (style === 'none') return;

  dom.celebration.innerHTML = '';
  dom.celebration.classList.add('show');
  const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

  switch (style) {
    case 'fireworks':
      _spawnFireworks(20, colors);
      break;
    case 'sparkles':
      _spawnSparkles(30, colors);
      break;
    case 'confetti':
    default:
      _spawnConfetti(40, colors, 0.5, 1.5);
      break;
  }
  setTimeout(() => dom.celebration.classList.remove('show'), 2500);
}

/**
 * Show an enhanced milestone celebration with overlay message.
 * @description Displays extra confetti and a centred overlay announcing the milestone session number.
 * @param {number} n - The milestone session number to display.
 * @returns {void}
 */
export function showMilestoneCelebration(n) {
  dom.celebration.innerHTML = '';
  dom.celebration.classList.add('show');
  const colors = ['#f59e0b', '#fbbf24', '#fcd34d', '#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#06b6d4'];
  for (let i = 0; i < 80; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.cssText = `left:${Math.random() * 100}%;top:-10px;background:${colors[Math.floor(Math.random() * colors.length)]};animation-delay:${Math.random() * 0.8}s;animation-duration:${1.5 + Math.random() * 1.5}s`;
    dom.celebration.appendChild(c);
  }
  // Overlay message
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(10,10,15,0.92);border:2px solid #f59e0b;border-radius:16px;padding:24px 32px;font-size:1.4rem;font-weight:700;color:#fcd34d;text-align:center;z-index:200;';
  overlay.textContent = `🎉 Session #${n}!`;
  document.body.appendChild(overlay);
  setTimeout(() => { dom.celebration.classList.remove('show'); overlay.remove(); }, 3500);
}

/**
 * Show a random affirmation overlay.
 * @description Picks a random affirmation string and briefly displays it.
 * @returns {void}
 */
export function showAffirmation() {
  if (!dom.affirmationOverlay) return;
  dom.affirmationOverlay.textContent = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
  dom.affirmationOverlay.classList.add('show');
  setTimeout(() => dom.affirmationOverlay.classList.remove('show'), 2500);
}
