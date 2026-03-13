/**
 * @module render/history
 * Rendering functions for the session history list and weekly bar chart.
 */

import { state, MOOD_OPTIONS } from '../state.js';
import { dom } from '../dom.js';
import { escapeHtml } from './utils.js';

const RATING_EMOJI = { Distracted: '😵‍💫', Okay: '😐', Focused: '🎯', Flow: '🚀' };
const CATEGORY_ICON = { work: '💼', study: '📚', creative: '🎨', admin: '📋', personal: '🏠', health: '❤️' };

/**
 * Render the session history list.
 * @description Builds HTML for up to 50 most-recent sessions, including task name,
 *              duration, overtime, mood, complexity, distractions, and notes.
 * @returns {void}
 */
export function renderHistory() {
  if (state.sessionHistory.length === 0) {
    dom.historyList.innerHTML = `
      <div class="history-empty">
        <div class="empty-icon">📋</div>
        <p>No sessions yet. Start your first pomodoro!</p>
      </div>`;
    return;
  }

  dom.historyList.innerHTML = state.sessionHistory.slice(0, 50).map(entry => {
    const ratingClass = entry.rating.toLowerCase();
    const catIcon = CATEGORY_ICON[entry.category] || '⚡';
    return `
    <div class="history-item">
      <div class="h-icon work">${catIcon}</div>
      <div class="h-details">
        <div class="h-task">${escapeHtml(entry.task || 'Untitled')}</div>
        <div class="h-meta">${entry.duration}m${entry.overtime ? ` +${Math.round(entry.overtime / 60)}m OT` : ''} · ${entry.displayTime || ''}${entry.mood ? ` · ${MOOD_OPTIONS.find(m=>m.value===entry.mood)?.emoji||''}` : ''}${entry.complexity ? ` · ${'★'.repeat(entry.complexity)}` : ''}${entry.distractions ? ` · ${entry.distractions} dist.` : ''}${entry.note ? ` · "${escapeHtml(entry.note)}"` : ''}</div>
      </div>
      <span class="h-rating ${ratingClass}">${entry.rating}</span>
    </div>`;
  }).join('');
}

/**
 * Render the 7-day weekly bar chart.
 * @description Computes total focus minutes for each of the last 7 days and
 *              renders vertical bars with labels.
 * @returns {void}
 */
export function renderWeeklyChart() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const weekData = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toDateString();
    const mins = state.sessionHistory
      .filter(s => s.date === dateStr)
      .reduce((sum, s) => sum + s.duration, 0);
    weekData.push({ day: days[d.getDay()], mins: Math.round(mins), isToday: i === 0 });
  }

  const maxMins = Math.max(...weekData.map(d => d.mins), 1);

  dom.weeklyChart.innerHTML = weekData.map(d => {
    const heightPct = (d.mins / maxMins) * 100;
    const todayStyle = d.isToday ? 'background:linear-gradient(180deg,var(--accent-success),rgba(16,185,129,0.4))' : '';
    const todayLabel = d.isToday ? 'color:var(--accent-success);font-weight:700' : '';
    return `
    <div class="chart-bar-wrapper">
      <div class="chart-value">${d.mins > 0 ? d.mins + 'm' : ''}</div>
      <div class="chart-bar-track">
        <div class="chart-bar" style="height:${heightPct}%;${todayStyle}"></div>
      </div>
      <div class="chart-label" style="${todayLabel}">${d.day}</div>
    </div>`;
  }).join('');
}
