/**
 * Haptic Feedback module
 * Implements Feature #101 — Haptic Feedback.
 * Provides vibration patterns for different interaction types on supported devices.
 */

let hapticEnabled = false;

/**
 * Initializes haptic feedback by loading the saved preference from localStorage.
 * @returns {boolean} Whether haptic feedback is enabled
 */
export function initHaptic() {
  hapticEnabled = localStorage.getItem('pp_haptic') === 'true';
  return hapticEnabled;
}

/**
 * Sets the haptic feedback enabled state and persists it to localStorage.
 * @param {boolean} enabled - Whether to enable haptic feedback
 */
export function setHapticEnabled(enabled) {
  hapticEnabled = enabled;
  localStorage.setItem('pp_haptic', enabled);
}

/**
 * Triggers a haptic vibration pattern based on the interaction type.
 * No-op if haptic is disabled or the Vibration API is not available.
 * @param {string} type - Interaction type: 'click', 'timer-end', or 'success'
 */
export function hapticFeedback(type) {
  if (!hapticEnabled || !navigator.vibrate) return;
  switch (type) {
    case 'click': navigator.vibrate(30); break;
    case 'timer-end': navigator.vibrate([200, 100, 200, 100, 200]); break;
    case 'success': navigator.vibrate([50, 50, 100]); break;
    default: navigator.vibrate(30);
  }
}
