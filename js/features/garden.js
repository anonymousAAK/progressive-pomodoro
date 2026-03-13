/**
 * Focus Garden module
 * Implements Feature #78 — Focus Garden.
 * Displays a visual garden of emoji plants representing recent session ratings.
 */

import { state } from '../state.js';

/**
 * Maps a focus rating string to a garden emoji.
 * @param {string} rating - The focus rating (Distracted, Okay, Focused, Flow)
 * @returns {string} An emoji representing the rating
 */
function getGardenEmoji(rating) {
  switch (rating) {
    case 'Distracted': return '\u{1F331}'; // seedling
    case 'Okay': return '\u{1F33F}'; // herb
    case 'Focused': return '\u{1F338}'; // cherry blossom
    case 'Flow': return '\u{1F333}'; // deciduous tree
    default: return '\u{1F331}';
  }
}

/**
 * Renders the focus garden grid into the DOM element with id 'focus-garden-grid'.
 * Shows up to 50 recent sessions as emoji plants.
 */
export function renderFocusGarden() {
  const el = document.getElementById('focus-garden-grid');
  if (!el) return;
  const recent = state.sessionHistory.slice(0, 50);
  if (recent.length === 0) {
    el.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">Complete sessions to grow your garden!</p>';
    return;
  }
  el.innerHTML = recent.map(s =>
    `<span class="garden-cell" title="${s.task || 'Session'} - ${s.rating}">${getGardenEmoji(s.rating)}</span>`
  ).join('');
}
