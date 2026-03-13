/**
 * Gamification module
 * Implements Features #82 (Session Multiplier), #83 (Unlockable Themes),
 * and #84 (Focus Coins).
 * Provides XP multipliers based on streaks, theme unlocking, and a coin economy.
 */

import { state } from '../state.js';

// ========================================================================
// #82 - Session Multiplier
// ========================================================================

/**
 * Calculates the current session multiplier based on consecutive
 * Focused/Flow ratings at the start of session history.
 * @returns {number} The multiplier value (minimum 1)
 */
export function getSessionMultiplier() {
  let streak = 0;
  for (const s of state.sessionHistory) {
    if (s.rating === 'Focused' || s.rating === 'Flow') {
      streak++;
    } else {
      break;
    }
  }
  return Math.max(1, streak);
}

/**
 * Renders the multiplier badge into the DOM element with id 'multiplier-badge'.
 * Hidden when multiplier is 1.
 */
export function renderMultiplierBadge() {
  const el = document.getElementById('multiplier-badge');
  if (!el) return;
  const mult = getSessionMultiplier();
  if (mult > 1) {
    el.textContent = `\u00D7${mult}`;
    el.classList.remove('hidden');
  } else {
    el.classList.add('hidden');
  }
}

// ========================================================================
// #83 - Unlockable Themes
// ========================================================================

/**
 * Available unlockable themes with their unlock conditions.
 * @type {Array<{id: string, name: string, desc: string, check: Function}>}
 */
export const UNLOCKABLE_THEMES = [
  {
    id: 'midnight',
    name: 'Midnight',
    desc: 'Unlocked at Level 5',
    check: () => state.level >= 5,
  },
  {
    id: 'neon',
    name: 'Neon',
    desc: 'Unlocked at 50 sessions',
    check: () => state.sessionHistory.length >= 50,
  },
  {
    id: 'gold',
    name: 'Gold',
    desc: 'Unlocked at 100-day streak',
    check: () => state.streakData.best >= 100,
  },
];

/**
 * Renders the unlockable theme buttons into the DOM element with id 'unlockable-themes'.
 * Locked themes are disabled; unlocked themes are clickable.
 */
export function renderUnlockableThemes() {
  const container = document.getElementById('unlockable-themes');
  if (!container) return;
  container.innerHTML = UNLOCKABLE_THEMES.map(t => {
    const unlocked = t.check();
    return `
    <button class="theme-unlock-btn ${unlocked ? 'unlocked' : 'locked'}" data-unlock-theme="${t.id}" ${!unlocked ? 'disabled' : ''}>
      ${unlocked ? '' : '<span class="lock-icon">&#128274;</span>'}
      ${t.name}
      <span class="theme-unlock-desc">${t.desc}</span>
    </button>`;
  }).join('');
}

/**
 * Applies an unlockable theme by its id if the unlock condition is met.
 * Persists the selection to localStorage.
 * @param {string} themeId - The theme id to apply (midnight, neon, gold)
 */
export function applyUnlockableTheme(themeId) {
  const theme = UNLOCKABLE_THEMES.find(t => t.id === themeId);
  if (!theme || !theme.check()) return;
  document.documentElement.classList.remove('theme-midnight', 'theme-neon', 'theme-gold');
  document.documentElement.classList.add(`theme-${themeId}`);
  localStorage.setItem('pp_unlockTheme', themeId);
  document.querySelectorAll('.theme-unlock-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.unlockTheme === themeId);
  });
}

/**
 * Loads the previously saved unlockable theme from localStorage on startup.
 */
export function loadUnlockableTheme() {
  const saved = localStorage.getItem('pp_unlockTheme');
  if (saved) {
    const theme = UNLOCKABLE_THEMES.find(t => t.id === saved);
    if (theme && theme.check()) {
      document.documentElement.classList.add(`theme-${saved}`);
    }
  }
}

// ========================================================================
// #84 - Focus Coins
// ========================================================================

/**
 * Calculates the number of coins earned for a session.
 * @param {number} durationMin - Session duration in minutes
 * @param {string} rating - Focus rating (Distracted, Okay, Focused, Flow)
 * @returns {number} Coins earned
 */
export function calculateCoins(durationMin, rating) {
  const ratingMultiplier = { Distracted: 0.5, Okay: 1, Focused: 1.5, Flow: 2 }[rating] || 1;
  const multiplier = getSessionMultiplier();
  return Math.round(10 * ratingMultiplier * Math.min(multiplier, 5));
}

/**
 * Gets the current coin balance from localStorage.
 * @returns {number} Current coin count
 */
export function getCoins() {
  return parseInt(localStorage.getItem('pp_coins') || '0', 10);
}

/**
 * Adds coins to the current balance in localStorage.
 * @param {number} amount - Number of coins to add
 */
export function addCoins(amount) {
  const current = getCoins();
  localStorage.setItem('pp_coins', current + amount);
}

/**
 * Renders the coin balance into the DOM element with id 'coin-value'.
 */
export function renderCoinBalance() {
  const el = document.getElementById('coin-value');
  if (!el) return;
  el.textContent = getCoins();
}
