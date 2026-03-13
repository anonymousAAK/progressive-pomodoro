/**
 * @module render/ui
 * General UI rendering helpers: toast notifications, session target bar,
 * focus score banner, cognitive load indicator, and focus trend alert.
 */

import { state } from '../state.js';
import { dom } from '../dom.js';

/**
 * Show a brief toast notification.
 * @description Displays a message in the save-toast element that auto-hides after 2.5 seconds.
 * @param {string} msg - The message to display.
 * @returns {void}
 */
export function showToast(msg) {
  dom.saveToast.textContent = msg;
  dom.saveToast.classList.add('show');
  setTimeout(() => dom.saveToast.classList.remove('show'), 2500);
}

/**
 * Render the daily session target progress bar.
 * @description Shows or hides the target row and updates the count / fill width.
 * @returns {void}
 */
export function renderSessionTarget() {
  if (!dom.sessionTargetRow) return;
  if (!state.sessionTarget || state.sessionTarget <= 0) {
    dom.sessionTargetRow.classList.add('hidden');
    return;
  }
  const today = new Date().toDateString();
  const count = state.sessionHistory.filter(s => s.date === today).length;
  dom.sessionTargetRow.classList.remove('hidden');
  if (dom.sessionTargetText) dom.sessionTargetText.textContent = `${count} / ${state.sessionTarget} today`;
  if (dom.targetBarFill) {
    const pct = Math.min(100, (count / state.sessionTarget) * 100);
    dom.targetBarFill.style.width = pct + '%';
  }
}

/**
 * Render the focus score banner.
 * @description Computes a weighted focus score from today's session ratings and displays it.
 * @returns {void}
 */
export function renderFocusScore() {
  const banner = document.getElementById('focus-score-banner');
  const valueEl = document.getElementById('focus-score-value');
  if (!banner || !valueEl) return;
  const today = new Date().toDateString();
  const todaySessions = state.sessionHistory.filter(s => s.date === today);
  if (todaySessions.length === 0) { valueEl.textContent = '—'; return; }
  const ratingScore = { Distracted: 0, Okay: 33, Focused: 66, Flow: 100 };
  const avg = todaySessions.reduce((sum, s) => sum + (ratingScore[s.rating] || 0), 0) / todaySessions.length;
  const factor = Math.min(1, todaySessions.length / 4);
  const score = Math.round(avg * (0.7 + 0.3 * factor));
  valueEl.textContent = score;
}

/**
 * Render the cognitive load indicator.
 * @description Calculates today's cognitive load from complexity * duration and shows a level.
 * @returns {void}
 */
export function renderCognitiveLoad() {
  const el = dom.cognitiveLoadValue;
  if (!el) return;
  const today = new Date().toDateString();
  const todaySessions = state.sessionHistory.filter(s => s.date === today);
  let load = 0;
  todaySessions.forEach(s => {
    const complexity = s.complexity || 1;
    load += complexity * s.duration;
  });
  let level, color;
  if (load < 60)       { level = 'Low';      color = 'var(--accent-success)'; }
  else if (load < 150) { level = 'Medium';   color = 'var(--accent-okay)'; }
  else if (load < 300) { level = 'High';     color = 'var(--accent-warning)'; }
  else                 { level = 'Overload'; color = 'var(--accent-danger)'; }
  el.textContent = level;
  el.style.color = color;
}

/**
 * Check recent focus trend and show a warning toast if focus has been consistently low.
 * @description Examines the last 3 sessions; if all rated Distracted or Okay, shows a toast.
 * @returns {void}
 */
export function checkFocusTrend() {
  const last3 = state.sessionHistory.slice(0, 3);
  if (last3.length < 3) return;
  const allLow = last3.every(s => s.rating === 'Distracted' || s.rating === 'Okay');
  if (allLow) {
    setTimeout(() => showToast('⚠️ Focus has been low lately — consider a break or change of environment'), 600);
  }
}

/**
 * Update the top stats bar (streak, today's minutes, session count, level, etc.).
 * @description Computes today's totals and delegates to renderSessionTarget, renderFocusScore,
 *              and renderCognitiveLoad.
 * @returns {void}
 */
export function updateTopStats() {
  const today = new Date().toDateString();
  const todaySessions = state.sessionHistory.filter(s => s.date === today);
  const todayMins = todaySessions.reduce((sum, s) => sum + s.duration, 0);

  // Streak with shield count
  const shieldStr = state.streakShields > 0 ? ` 🛡️${state.streakShields}` : '';
  dom.streakValue.textContent  = state.streakData.current + shieldStr;
  dom.todayMinutes.textContent = todayMins >= 60
    ? `${(todayMins / 60).toFixed(1)}h`
    : `${Math.round(todayMins)}m`;
  dom.sessionCount.textContent = todaySessions.length;
  if (dom.xpValue) dom.xpValue.textContent = 'Lv.' + state.level;
  renderSessionTarget();
  renderFocusScore();
  renderCognitiveLoad();
}
