/**
 * @module render/profiles
 * Profile-related rendering: leaderboard and profile select dropdown.
 */

import { state } from '../state.js';
import { getProfileStats } from '../storage.js';
import { dom } from '../dom.js';
import { escapeHtml } from './utils.js';

/**
 * Render the multi-profile leaderboard.
 * @description Sorts profiles by total focus minutes and displays ranked rows
 *              with medals, hours, level, and session count.
 * @returns {void}
 */
export function renderLeaderboard() {
  const el = dom.leaderboardGrid;
  if (!el) return;
  if (state.profiles.length <= 1) {
    el.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">Create more profiles in Settings to see the leaderboard.</p>';
    return;
  }
  const stats = state.profiles.map(name => getProfileStats(name));
  stats.sort((a, b) => b.totalMins - a.totalMins);
  const medals = ['🥇', '🥈', '🥉'];
  el.innerHTML = stats.map((p, i) => {
    const hrs = (p.totalMins / 60).toFixed(1);
    const isCurrent = p.name === state.currentProfile;
    return `<div class="leaderboard-row${isCurrent ? ' current' : ''}">
      <span class="lb-rank">${medals[i] || `#${i + 1}`}</span>
      <span class="lb-name">${escapeHtml(p.name)}</span>
      <span class="lb-stat">${hrs}h · Lv.${p.level} · ${p.sessions} sessions</span>
    </div>`;
  }).join('');
}

/**
 * Populate the profile-select dropdown.
 * @description Fills the select element with option elements for each profile,
 *              marking the current profile as selected.
 * @returns {void}
 */
export function populateProfileSelect() {
  const sel = dom.profileSelect;
  if (!sel) return;
  sel.innerHTML = state.profiles.map(p =>
    `<option value="${escapeHtml(p)}"${p === state.currentProfile ? ' selected' : ''}>${escapeHtml(p)}</option>`
  ).join('');
}
