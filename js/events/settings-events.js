/**
 * Settings and appearance event listeners.
 * Handles all settings inputs (work duration, break duration, toggles, etc.),
 * the save button, theme/accent/font/animation/background/density options,
 * ambient sounds, notification sounds, celebration style, timer scale,
 * seasonal theme, focus labels, and data backup/restore/export/clear/import.
 * @module settings-events
 */

import { state } from '../state.js';
import { dom } from '../dom.js';
import { playSound, startAmbient, stopAmbient, previewNotificationSound } from '../audio.js';
import { applyTheme, applyAccent, applyFontSize, applyAnimations, applyReducedMotion, applyBackground, applyTimerFont, applyNotificationSound, applyDensity, applyFocusLabels, applyCelebrationStyle, applyTimerScale, applySeasonalTheme } from '../theme.js';
import { saveSettings, backupData, restoreData, exportHistoryCSV, clearHistory, importSessionsCSV } from '../storage.js';
import { resetTimer } from '../timer.js';
import { renderHistory, renderWeeklyChart, renderStats, updateTopStats, showToast } from '../render/index.js';
import { setWebhookUrl } from '../features/index.js';

/**
 * Registers all settings and appearance event listeners.
 * Includes the save settings button, theme/accent/font options,
 * animation toggles, ambient sounds, background options, timer font,
 * notification sounds, density, focus labels, celebration style,
 * timer scale, seasonal theme, warmup/overtime toggles, and
 * data backup/restore/export/clear/import buttons.
 */
export function registerSettingsEvents() {
  // --- Settings: Save ---
  dom.saveSettingsBtn.addEventListener('click', () => {
    state.workDuration      = parseInt(dom.initialWork.value,       10) * 60;
    state.intervalAdjust    = parseInt(dom.intervalAdjust.value,    10) * 60;
    state.breakDuration     = parseInt(dom.breakDuration.value,     10) * 60;
    state.longBreakDuration = parseInt(dom.longBreakDuration.value, 10) * 60;
    state.soundEnabled      = dom.soundEnabled.checked;
    state.notifEnabled      = dom.notifEnabled.checked;
    state.autoBreak         = dom.autoBreak.checked;
    state.autoWork          = dom.autoWork.checked;
    // New settings
    state.warmUpEnabled     = dom.warmupToggle ? dom.warmupToggle.checked : false;
    state.overtimeEnabled   = dom.overtimeToggle ? dom.overtimeToggle.checked : false;
    state.pauseLimit        = dom.pauseLimitInput ? parseInt(dom.pauseLimitInput.value, 10) : -1;
    state.lockoutSessions   = dom.lockoutInput ? parseInt(dom.lockoutInput.value, 10) : 0;
    state.minSessionMinutes = dom.minSessionInput ? parseInt(dom.minSessionInput.value, 10) : 5;
    state.windDownEnabled   = dom.winddownToggle ? dom.winddownToggle.checked : false;
    state.windDownTime      = dom.winddownTimeInput ? dom.winddownTimeInput.value : '18:00';

    // If lockout sessions changed and > 0, set lockout remaining
    if (state.lockoutSessions > 0 && state.lockoutRemaining <= 0) {
      state.lockoutRemaining = state.lockoutSessions;
      localStorage.setItem('pp_lockoutRemaining', state.lockoutRemaining);
    }

    if (state.notifEnabled && Notification.permission === 'default') Notification.requestPermission();

    // Save webhook URL (#109)
    const webhookInput = document.getElementById('webhook-url-input');
    if (webhookInput) setWebhookUrl(webhookInput.value.trim());
    const webhookEnabled = document.getElementById('webhook-enabled-toggle');
    if (webhookEnabled) localStorage.setItem('pp_webhookEnabled', webhookEnabled.checked);

    saveSettings();
    resetTimer();
    showToast('Settings saved!');
  });

  // --- Appearance: Theme buttons ---
  dom.themeOpts.forEach(btn => {
    btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
  });

  // --- Appearance: Header theme toggle ---
  if (dom.themeToggleBtn) {
    dom.themeToggleBtn.addEventListener('click', () => {
      const next = document.documentElement.classList.contains('light') ? 'dark' : 'light';
      applyTheme(next);
    });
  }

  // --- Appearance: Accent color ---
  dom.colorSwatches.forEach(swatch => {
    swatch.addEventListener('click', () => applyAccent(swatch.dataset.accent));
  });

  // --- Appearance: Font size ---
  dom.fontOpts.forEach(btn => {
    btn.addEventListener('click', () => applyFontSize(parseFloat(btn.dataset.size)));
  });

  // --- Appearance: Animation toggle ---
  if (dom.animationsEnabled) {
    dom.animationsEnabled.addEventListener('change', () => applyAnimations(dom.animationsEnabled.checked));
  }

  // --- Appearance: Reduced motion ---
  if (dom.reducedMotion) {
    dom.reducedMotion.addEventListener('change', () => applyReducedMotion(dom.reducedMotion.checked));
  }

  // --- Ambient sounds ---
  dom.ambientBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.ambient;
      dom.ambientBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (type === 'none') { stopAmbient(); state.currentAmbient = 'none'; }
      else startAmbient(type);
      localStorage.setItem('pp_ambient', type);
    });
  });

  // --- Data: Backup ---
  if (dom.backupBtn) dom.backupBtn.addEventListener('click', backupData);

  // --- Data: Restore ---
  if (dom.restoreInput) {
    dom.restoreInput.addEventListener('change', e => {
      if (e.target.files[0]) restoreData(e.target.files[0], showToast);
    });
  }

  // --- History: Export CSV ---
  dom.exportBtn.addEventListener('click', exportHistoryCSV);

  // --- History: Clear ---
  dom.clearHistoryBtn.addEventListener('click', () => {
    clearHistory([
      renderHistory,
      renderWeeklyChart,
      renderStats,
      updateTopStats,
    ]);
  });

  // --- Import CSV ---
  const importCsvInput = document.getElementById('import-csv-input');
  if (importCsvInput) {
    importCsvInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      importSessionsCSV(file, showToast, [renderHistory, renderWeeklyChart, renderStats, updateTopStats]);
      e.target.value = '';
    });
  }

  // --- New settings toggles ---
  if (dom.warmupToggle) {
    dom.warmupToggle.addEventListener('change', e => {
      state.warmUpEnabled = e.target.checked;
      localStorage.setItem('pp_warmUp', e.target.checked);
    });
  }
  if (dom.overtimeToggle) {
    dom.overtimeToggle.addEventListener('change', e => {
      state.overtimeEnabled = e.target.checked;
      localStorage.setItem('pp_overtime', e.target.checked);
    });
  }

  // ====================================================================
  // Batch 4 Event Listeners — Customization/Themes
  // ====================================================================

  // --- #63 Custom background ---
  dom.backgroundOpts.forEach(btn => {
    btn.addEventListener('click', () => applyBackground(btn.dataset.bg));
  });

  // --- #64 Timer font selection ---
  dom.timerFontOpts.forEach(btn => {
    btn.addEventListener('click', () => applyTimerFont(btn.dataset.font));
  });

  // --- #66 Custom notification sounds ---
  dom.notifSoundOpts.forEach(btn => {
    btn.addEventListener('click', () => {
      applyNotificationSound(btn.dataset.sound);
      previewNotificationSound(btn.dataset.sound);
    });
  });

  // --- #68 UI density options ---
  dom.densityOpts.forEach(btn => {
    btn.addEventListener('click', () => applyDensity(btn.dataset.density));
  });

  // --- #69 Custom focus rating labels ---
  const focusLabelInputs = [
    { el: dom.focusLabelDistracted, key: 'distracted' },
    { el: dom.focusLabelOkay,       key: 'okay' },
    { el: dom.focusLabelFocused,    key: 'focused' },
    { el: dom.focusLabelFlow,       key: 'flow' },
  ];
  focusLabelInputs.forEach(({ el, key }) => {
    if (el) {
      el.addEventListener('change', () => {
        const val = el.value.trim();
        if (val) applyFocusLabels({ [key]: val });
      });
    }
  });

  // --- #70 Celebration animation style ---
  dom.celebrationOpts.forEach(btn => {
    btn.addEventListener('click', () => applyCelebrationStyle(btn.dataset.celebration));
  });

  // --- #71 Timer size adjustment ---
  if (dom.timerScaleSlider) {
    dom.timerScaleSlider.addEventListener('input', e => {
      applyTimerScale(parseFloat(e.target.value));
    });
  }

  // --- #72 Seasonal theme toggle ---
  if (dom.seasonalToggle) {
    dom.seasonalToggle.addEventListener('change', e => {
      applySeasonalTheme(e.target.checked);
    });
  }
}
