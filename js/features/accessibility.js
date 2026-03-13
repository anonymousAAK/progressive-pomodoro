/**
 * Accessibility module
 * Implements Features #94 (Screen Reader Support), #95 (High Contrast Mode),
 * and #99 (Colorblind-Friendly Palettes).
 * Provides ARIA enhancements, high contrast toggling, and colorblind palette support.
 */

import { dom } from '../dom.js';

/**
 * Initializes screen reader support by adding ARIA attributes to key DOM elements.
 * Creates an aria-live region for dynamic announcements.
 */
export function initScreenReaderSupport() {
  // Add aria-live region for timer announcements
  let liveRegion = document.getElementById('aria-live-region');
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'aria-live-region';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
  }

  // Add roles to semantic sections
  document.querySelector('.app-header')?.setAttribute('role', 'banner');
  document.querySelector('.nav')?.setAttribute('role', 'navigation');
  document.querySelector('main')?.setAttribute('role', 'main');
  document.querySelector('.stats-bar')?.setAttribute('role', 'status');

  // Add aria-labels to interactive elements
  dom.startPauseBtn?.setAttribute('aria-label', 'Start or pause timer');
  dom.stopBtn?.setAttribute('aria-label', 'Reset timer');
  dom.skipBtn?.setAttribute('aria-label', 'Skip current phase');
  dom.skipBreakBtn?.setAttribute('aria-label', 'Skip break and start work');
  dom.taskInput?.setAttribute('aria-label', 'Task name input');
  dom.themeToggleBtn?.setAttribute('aria-label', 'Toggle light or dark theme');
  dom.focusModeBtn?.setAttribute('aria-label', 'Toggle distraction-free mode');

  // Nav buttons
  dom.navBtns.forEach(btn => {
    btn.setAttribute('aria-label', `Navigate to ${btn.textContent.trim()}`);
  });

  // Preset buttons
  dom.presetBtns.forEach(btn => {
    btn.setAttribute('aria-label', `Timer preset: ${btn.textContent.trim()}`);
  });

  // Category chips
  dom.categoryChips.forEach(chip => {
    chip.setAttribute('aria-label', `Category: ${chip.textContent.trim()}`);
  });

  // Rating buttons
  document.querySelectorAll('.focus-btn').forEach(btn => {
    const rating = btn.dataset.rating;
    btn.setAttribute('aria-label', `Rate focus as ${rating}`);
  });

  // Settings toggles
  document.querySelectorAll('.toggle-switch input').forEach(input => {
    const label = input.closest('.setting-row')?.querySelector('.setting-label');
    if (label) input.setAttribute('aria-label', label.textContent);
  });
}

/**
 * Announces a message to screen readers via the aria-live region.
 * @param {string} message - The message to announce
 */
export function announceToScreenReader(message) {
  const el = document.getElementById('aria-live-region');
  if (el) {
    el.textContent = '';
    setTimeout(() => { el.textContent = message; }, 100);
  }
}

/**
 * Enables or disables high contrast mode on the document.
 * Persists the setting to localStorage.
 * @param {boolean} enabled - Whether to enable high contrast
 */
export function applyHighContrast(enabled) {
  document.documentElement.classList.toggle('high-contrast', enabled);
  localStorage.setItem('pp_highContrast', enabled);
}

/**
 * Loads the high contrast setting from localStorage and applies it if saved.
 * @returns {boolean} Whether high contrast is enabled
 */
export function loadHighContrast() {
  const saved = localStorage.getItem('pp_highContrast') === 'true';
  if (saved) applyHighContrast(true);
  return saved;
}

/**
 * Applies a colorblind-friendly palette to the document.
 * Removes any existing palette class before applying the new one.
 * @param {string} palette - Palette name (deuteranopia, protanopia, tritanopia, or 'none')
 */
export function applyColorblindPalette(palette) {
  document.documentElement.classList.remove('cb-deuteranopia', 'cb-protanopia', 'cb-tritanopia');
  if (palette && palette !== 'none') {
    document.documentElement.classList.add(`cb-${palette}`);
  }
  localStorage.setItem('pp_colorblind', palette || 'none');
}

/**
 * Loads the colorblind palette setting from localStorage and applies it if saved.
 * @returns {string} The current colorblind palette setting
 */
export function loadColorblindPalette() {
  const saved = localStorage.getItem('pp_colorblind') || 'none';
  if (saved !== 'none') applyColorblindPalette(saved);
  return saved;
}
