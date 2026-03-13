/**
 * @module render/utils
 * Shared utility helpers used by other render modules.
 * These are private helpers (escapeHtml, formatTime) that multiple
 * render submodules depend on.
 */

/**
 * Escape a string for safe insertion into HTML.
 * @description Creates a text node and reads its innerHTML to neutralise HTML entities.
 * @param {string} str - The raw string to escape.
 * @returns {string} The HTML-escaped string.
 */
export function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

/**
 * Format a number of seconds as MM:SS.
 * @description Converts total seconds into a zero-padded minutes:seconds string.
 * @param {number} seconds - Total seconds to format.
 * @returns {string} Formatted time string, e.g. "05:30".
 */
export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
