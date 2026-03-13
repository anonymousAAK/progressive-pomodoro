/**
 * Weekly Missions module
 * Implements Feature #77 — Weekly Missions system.
 * Provides a rotating pool of weekly missions that track session-based goals,
 * persisted via localStorage and rendered as progress bars.
 */

import { state } from '../state.js';

/**
 * Pool of possible weekly missions. Each mission has an id, description,
 * target value, and a check function that computes progress from sessions.
 * @type {Array<{id: string, desc: string, target: number, check: Function, unit?: string}>}
 */
const WEEKLY_MISSION_POOL = [
  { id: 'complete_20', desc: 'Complete 20 sessions', target: 20, check: (sessions) => sessions.length },
  { id: 'deep_focus_5', desc: 'Achieve 5 Deep Focus ratings', target: 5, check: (sessions) => sessions.filter(s => s.rating === 'Flow').length },
  { id: 'focus_10h', desc: 'Focus for 10 hours', target: 600, check: (sessions) => sessions.reduce((sum, s) => sum + s.duration, 0), unit: 'min' },
  { id: 'streak_5', desc: 'Maintain a 5-day streak', target: 5, check: (sessions, streakData) => streakData.current },
  { id: 'no_distraction_10', desc: 'Complete 10 distraction-free sessions', target: 10, check: (sessions) => sessions.filter(s => (s.distractions || 0) === 0).length },
  { id: 'focused_5', desc: 'Achieve 5 Focused ratings', target: 5, check: (sessions) => sessions.filter(s => s.rating === 'Focused').length },
  { id: 'sessions_3_days', desc: 'Complete sessions on 5 different days', target: 5, check: (sessions) => new Set(sessions.map(s => s.date)).size },
  { id: 'long_sessions_3', desc: 'Complete 3 sessions over 30 min', target: 3, check: (sessions) => sessions.filter(s => s.duration >= 30).length },
  { id: 'morning_5', desc: 'Complete 5 morning sessions (before noon)', target: 5, check: (sessions) => sessions.filter(s => { try { return new Date(s.timestamp).getHours() < 12; } catch { return false; } }).length },
  { id: 'total_15h', desc: 'Focus for 15 hours total', target: 900, check: (sessions) => sessions.reduce((sum, s) => sum + s.duration, 0), unit: 'min' },
];

/**
 * Returns the ISO date string (YYYY-MM-DD) of the Monday of the current week.
 * @returns {string} Monday date key
 */
function getWeekMondayKey() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

/**
 * Returns all sessions from the current week (starting Monday).
 * @returns {Array} Filtered session history for this week
 */
function getWeekSessions() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return state.sessionHistory.filter(s => {
    try { return new Date(s.timestamp) >= monday; } catch { return false; }
  });
}

/**
 * Gets or generates the 5 weekly missions for the current week.
 * Missions are randomly selected from the pool and cached in localStorage.
 * @returns {Array} Array of mission objects for this week
 */
export function getWeeklyMissions() {
  const weekKey = getWeekMondayKey();
  const savedKey = localStorage.getItem('pp_missions_week');
  let missionIds = JSON.parse(localStorage.getItem('pp_missions') || '[]');
  if (savedKey !== weekKey || missionIds.length === 0) {
    // Select 5 random missions
    const shuffled = [...WEEKLY_MISSION_POOL].sort(() => Math.random() - 0.5);
    missionIds = shuffled.slice(0, 5).map(m => m.id);
    localStorage.setItem('pp_missions', JSON.stringify(missionIds));
    localStorage.setItem('pp_missions_week', weekKey);
  }
  return missionIds.map(id => WEEKLY_MISSION_POOL.find(m => m.id === id)).filter(Boolean);
}

/**
 * Renders the weekly missions grid into the DOM element with id 'missions-grid'.
 * Shows progress bars and completion status for each mission.
 */
export function renderWeeklyMissions() {
  const el = document.getElementById('missions-grid');
  if (!el) return;
  const missions = getWeeklyMissions();
  const weekSessions = getWeekSessions();
  el.innerHTML = missions.map(m => {
    const progress = m.check(weekSessions, state.streakData);
    const pct = Math.min(100, (progress / m.target) * 100);
    const done = progress >= m.target;
    return `
    <div class="mission-item ${done ? 'mission-done' : ''}">
      <div class="mission-desc">${done ? '&#10003; ' : ''}${m.desc}</div>
      <div class="mission-bar-track">
        <div class="mission-bar-fill" style="width:${pct}%"></div>
      </div>
      <div class="mission-progress">${m.unit === 'min' ? Math.round(progress) + 'm' : progress} / ${m.unit === 'min' ? m.target + 'm' : m.target}</div>
    </div>`;
  }).join('');
}

export { getWeekMondayKey, getWeekSessions };
