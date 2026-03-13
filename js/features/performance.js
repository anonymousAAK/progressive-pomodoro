/**
 * Performance Mode module
 * Implements Feature #121 — Performance Mode.
 * Toggles a reduced-animation, lightweight rendering mode for low-end devices.
 */

/**
 * Enables or disables performance mode on the app and document root.
 * Persists the setting to localStorage.
 * @param {boolean} enabled - Whether to enable performance mode
 */
export function applyPerformanceMode(enabled) {
  const app = document.getElementById('app');
  if (!app) return;
  app.classList.toggle('performance-mode', enabled);
  document.documentElement.classList.toggle('performance-mode', enabled);
  localStorage.setItem('pp_performanceMode', enabled);
}

/**
 * Loads the performance mode setting from localStorage and applies it if saved.
 * @returns {boolean} Whether performance mode is enabled
 */
export function loadPerformanceMode() {
  const saved = localStorage.getItem('pp_performanceMode') === 'true';
  if (saved) applyPerformanceMode(true);
  return saved;
}
