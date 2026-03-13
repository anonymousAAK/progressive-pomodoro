/**
 * Batch 5 feature event listeners.
 * Handles high contrast, colorblind palette, haptic feedback,
 * voice control, performance mode, webhook, language selection,
 * widget mode, iCal export, sharing features, focus challenges,
 * and unlockable themes.
 * @module batch5-events
 */

import { state } from '../state.js';
import { showToast } from '../render/index.js';
import {
  applyHighContrast,
  applyColorblindPalette,
  toggleVoiceControl,
  setHapticEnabled,
  applyPerformanceMode,
  toggleWidgetMode,
  shareDailySummary,
  shareWeeklyDigest,
  shareAchievement,
  generateChallengeString,
  decodeChallengeString,
  renderChallengeComparison,
  generateICalFile,
  applyUnlockableTheme,
} from '../features/index.js';
import { i18n } from '../i18n.js';

/**
 * Registers all batch 5 feature event listeners.
 * Includes high contrast toggle, colorblind palette options, voice control,
 * haptic feedback toggle, language select, iCal download, widget mode,
 * performance mode, unlockable themes, share buttons, and focus challenges.
 */
export function registerBatch5Events() {
  // --- #95 High Contrast ---
  const highContrastToggle = document.getElementById('high-contrast-toggle');
  if (highContrastToggle) {
    highContrastToggle.addEventListener('change', e => {
      applyHighContrast(e.target.checked);
    });
  }

  // --- #99 Colorblind Palette ---
  document.querySelectorAll('.cb-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cb-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyColorblindPalette(btn.dataset.cb);
    });
  });

  // --- #100 Voice Control ---
  const voiceToggleBtn = document.getElementById('voice-toggle-btn');
  if (voiceToggleBtn) {
    voiceToggleBtn.addEventListener('click', () => {
      const isActive = voiceToggleBtn.classList.toggle('active');
      toggleVoiceControl(isActive);
    });
  }
  const voiceSettingToggle = document.getElementById('voice-control-toggle');
  if (voiceSettingToggle) {
    voiceSettingToggle.addEventListener('change', e => {
      toggleVoiceControl(e.target.checked);
      const voiceBtn = document.getElementById('voice-toggle-btn');
      if (voiceBtn) voiceBtn.classList.toggle('active', e.target.checked);
    });
  }

  // --- #101 Haptic Feedback ---
  const hapticToggle = document.getElementById('haptic-toggle');
  if (hapticToggle) {
    hapticToggle.addEventListener('change', e => {
      setHapticEnabled(e.target.checked);
    });
  }

  // --- #104 Language Select ---
  const langSelect = document.getElementById('language-select');
  if (langSelect) {
    langSelect.addEventListener('change', e => {
      i18n.setLang(e.target.value);
      showToast(`Language: ${e.target.value === 'es' ? 'Español' : 'English'}`);
    });
  }

  // --- #109 Webhook ---
  // Saved via the save settings button above

  // --- #114 iCal ---
  const icalBtn = document.getElementById('ical-download-btn');
  if (icalBtn) {
    icalBtn.addEventListener('click', generateICalFile);
  }

  // --- #119 Widget Mode ---
  const widgetBtn = document.getElementById('widget-toggle-btn');
  if (widgetBtn) {
    widgetBtn.addEventListener('click', () => {
      const active = toggleWidgetMode();
      widgetBtn.classList.toggle('active', active);
    });
  }

  // --- #121 Performance Mode ---
  const perfToggle = document.getElementById('performance-mode-toggle');
  if (perfToggle) {
    perfToggle.addEventListener('change', e => {
      applyPerformanceMode(e.target.checked);
    });
  }

  // --- #83 Unlockable themes ---
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-unlock-theme]');
    if (!btn || btn.disabled) return;
    applyUnlockableTheme(btn.dataset.unlockTheme);
  });

  // --- #86 Share Daily Summary ---
  const shareDailyBtn = document.getElementById('share-daily-btn');
  if (shareDailyBtn) {
    shareDailyBtn.addEventListener('click', shareDailySummary);
  }

  // --- #92 Share Weekly Digest ---
  const shareWeeklyBtn = document.getElementById('share-weekly-btn');
  if (shareWeeklyBtn) {
    shareWeeklyBtn.addEventListener('click', shareWeeklyDigest);
  }

  // --- #87 Share Achievement (delegated on achievements grid) ---
  const achGrid = document.getElementById('achievements-grid');
  if (achGrid) {
    achGrid.addEventListener('click', e => {
      const shareBtn = e.target.closest('.badge-share-btn');
      if (shareBtn) {
        shareAchievement(shareBtn.dataset.achId);
      }
    });
  }

  // --- #88 Focus Challenge ---
  const copyChallengeBtn = document.getElementById('copy-challenge-btn');
  if (copyChallengeBtn) {
    copyChallengeBtn.addEventListener('click', () => {
      const challengeStr = generateChallengeString();
      navigator.clipboard.writeText(challengeStr).then(() => {
        showToast('Challenge copied to clipboard!');
      }).catch(() => {
        // Fallback
        showToast('Challenge: ' + challengeStr.slice(0, 20) + '...');
      });
    });
  }

  const compareChallengeBtn = document.getElementById('compare-challenge-btn');
  if (compareChallengeBtn) {
    compareChallengeBtn.addEventListener('click', () => {
      const input = document.getElementById('paste-challenge-input');
      if (!input || !input.value.trim()) { showToast('Paste a challenge first'); return; }
      const theirData = decodeChallengeString(input.value.trim());
      if (!theirData) { showToast('Invalid challenge string'); return; }
      renderChallengeComparison(theirData);
    });
  }
}
