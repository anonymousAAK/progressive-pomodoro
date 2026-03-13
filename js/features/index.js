/**
 * Features barrel module
 * Re-exports all public functions from Batch 5 feature modules and provides
 * the master initBatch5Features() initialization function.
 *
 * Features: #77, #78, #82, #83, #84, #85, #86, #87, #88, #92, #94, #95,
 * #97, #99, #100, #101, #102, #103, #104, #105, #109, #112, #114, #118,
 * #119, #121
 */

import { i18n } from '../i18n.js';

// Internal imports for use in initBatch5Features
import { renderWeeklyMissions as _renderWeeklyMissions } from './missions.js';
import { renderFocusGarden as _renderFocusGarden } from './garden.js';
import { loadUnlockableTheme as _loadUnlockableTheme } from './gamification.js';
import { renderProgressTimeline as _renderProgressTimeline } from './timeline.js';
import {
  initScreenReaderSupport as _initScreenReaderSupport,
  loadHighContrast as _loadHighContrast,
  loadColorblindPalette as _loadColorblindPalette,
} from './accessibility.js';
import { initVoiceControl as _initVoiceControl } from './voice.js';
import { initHaptic as _initHaptic } from './haptics.js';
import {
  initTooltips as _initTooltips,
  initOnboarding as _initOnboarding,
} from './onboarding.js';
import {
  initHashAPI as _initHashAPI,
  sendEnhancedNotification as _sendEnhancedNotification,
} from './integrations.js';
import { loadPerformanceMode as _loadPerformanceMode } from './performance.js';

// --- Missions (#77) ---
export { getWeeklyMissions, renderWeeklyMissions } from './missions.js';

// --- Garden (#78) ---
export { renderFocusGarden } from './garden.js';

// --- Gamification (#82, #83, #84) ---
export {
  getSessionMultiplier,
  renderMultiplierBadge,
  UNLOCKABLE_THEMES,
  renderUnlockableThemes,
  applyUnlockableTheme,
  loadUnlockableTheme,
  calculateCoins,
  getCoins,
  addCoins,
  renderCoinBalance,
} from './gamification.js';

// --- Timeline (#85) ---
export { renderProgressTimeline } from './timeline.js';

// --- Sharing (#86, #87, #88, #92) ---
export {
  shareDailySummary,
  shareAchievement,
  shareWeeklyDigest,
  generateChallengeString,
  decodeChallengeString,
  renderChallengeComparison,
} from './sharing.js';

// --- Accessibility (#94, #95, #99) ---
export {
  initScreenReaderSupport,
  announceToScreenReader,
  applyHighContrast,
  loadHighContrast,
  applyColorblindPalette,
  loadColorblindPalette,
} from './accessibility.js';

// --- Voice Control (#100) ---
export {
  initVoiceControl,
  toggleVoiceControl,
  setTimerFunctions,
} from './voice.js';

// --- Haptics (#101) ---
export {
  initHaptic,
  setHapticEnabled,
  hapticFeedback,
} from './haptics.js';

// --- Onboarding (#102, #103) ---
export {
  initTooltips,
  initOnboarding,
} from './onboarding.js';

// --- Integrations (#109, #112, #114, #118) ---
export {
  getWebhookUrl,
  setWebhookUrl,
  fireWebhook,
  initHashAPI,
  generateICalFile,
  sendEnhancedNotification,
} from './integrations.js';

// --- Widget (#119) ---
export {
  toggleWidgetMode,
  updateWidget,
} from './widget.js';

// --- Performance (#121) ---
export {
  applyPerformanceMode,
  loadPerformanceMode,
} from './performance.js';

/**
 * Master initialization function for all Batch 5 features.
 * Calls all init/load functions in the correct order.
 */
export function initBatch5Features() {
  // #94 Screen reader
  _initScreenReaderSupport();

  // #95 High contrast
  _loadHighContrast();

  // #99 Colorblind
  _loadColorblindPalette();

  // #101 Haptic
  _initHaptic();

  // #102 Tooltips
  _initTooltips();

  // #103 Onboarding
  _initOnboarding();

  // #104 i18n
  i18n.loadLang();

  // #83 Unlockable themes
  _loadUnlockableTheme();

  // #112 Hash API
  _initHashAPI();

  // #121 Performance mode
  _loadPerformanceMode();
}
