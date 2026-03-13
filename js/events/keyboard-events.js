/**
 * Keyboard shortcut event listeners.
 * Handles all global keyboard shortcuts including Space (start/pause),
 * R (reset), and S (skip).
 * @module keyboard-events
 */

import { state } from '../state.js';
import { startTimer, pauseTimer, resetTimer, switchMode, stopOvertime } from '../timer.js';
import { announceToScreenReader } from '../features/index.js';

/**
 * Registers all keyboard shortcut event listeners.
 * Space toggles start/pause, R resets the timer, S skips to work mode.
 * Shortcuts are disabled when an input, textarea, or select is focused.
 */
export function registerKeyboardEvents() {
  // --- Keyboard shortcuts (#97 enhanced) ---
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    if (e.code === 'Space') {
      e.preventDefault();
      if (state.isOvertime) { stopOvertime(); return; }
      if (state.timerInterval) {
        pauseTimer();
        announceToScreenReader('Timer paused');
      } else {
        startTimer();
        announceToScreenReader('Timer started');
      }
    } else if (e.key === 'r' || e.key === 'R') {
      resetTimer();
      announceToScreenReader('Timer reset');
    } else if (e.key === 's' || e.key === 'S') {
      if (state.currentMode !== 'work') { switchMode('work'); startTimer(); }
      announceToScreenReader('Skipped to work');
    }
  });
}
