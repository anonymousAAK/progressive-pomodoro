import { state, TIMER_PRESETS } from './state.js';
import { dom } from './dom.js';
import { playSound, startAmbient, stopAmbient } from './audio.js';
import { applyTheme, applyAccent, applyFontSize, applyAnimations, applyReducedMotion } from './theme.js';
import { loadSettings, saveSettings, backupData, restoreData, exportHistoryCSV, clearHistory } from './storage.js';
import { startTimer, pauseTimer, resetTimer, switchMode } from './timer.js';
import { handleRating } from './rating.js';
import { getFocusTip } from './tips.js';
import { renderHistory, renderWeeklyChart, renderStats, updateTopStats, showToast } from './render.js';

export function registerAllEvents() {
  // --- Start / Pause ---
  dom.startPauseBtn.addEventListener('click', () => {
    if (state.timerInterval) pauseTimer(); else startTimer();
  });

  // --- Stop (Reset) ---
  dom.stopBtn.addEventListener('click', resetTimer);

  // --- Skip ---
  dom.skipBtn.addEventListener('click', () => {
    if (state.currentMode === 'work') {
      resetTimer();
    } else {
      switchMode('work');
      startTimer();
    }
  });

  // --- Skip break ---
  dom.skipBreakBtn.addEventListener('click', () => {
    switchMode('work');
    startTimer();
  });

  // --- Focus rating ---
  dom.focusRating.addEventListener('click', e => {
    const btn = e.target.closest('[data-rating]');
    if (btn) { playSound('click'); handleRating(btn.dataset.rating); }
  });

  // --- Timer presets ---
  dom.presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = TIMER_PRESETS[btn.dataset.preset];
      if (!preset) return;
      playSound('click');
      state.workDuration      = preset.work      * 60;
      state.breakDuration     = preset.breakDur  * 60;
      state.intervalAdjust    = preset.adjust    * 60;
      state.longBreakDuration = preset.work >= 50 ? 20 * 60 : 15 * 60;
      // Save and reflect in settings inputs
      if (dom.initialWork)       dom.initialWork.value       = preset.work;
      if (dom.intervalAdjust)    dom.intervalAdjust.value    = preset.adjust;
      if (dom.breakDuration)     dom.breakDuration.value     = preset.breakDur;
      if (dom.longBreakDuration) dom.longBreakDuration.value = state.longBreakDuration / 60;
      saveSettings();
      resetTimer();
      dom.presetBtns.forEach(b => b.classList.toggle('active', b === btn));
      showToast(`Preset: ${preset.label}`);
    });
  });

  // --- Category chips ---
  dom.categoryChips.forEach(chip => {
    chip.addEventListener('click', () => {
      playSound('click');
      const cat = chip.dataset.cat;
      const isActive = chip.classList.contains('active');
      dom.categoryChips.forEach(c => c.classList.remove('active'));
      if (!isActive) {
        chip.classList.add('active');
        state.currentCategory = cat;
      } else {
        state.currentCategory = '';
      }
    });
  });

  // --- Distraction counter ---
  if (dom.distractionBtn) {
    dom.distractionBtn.addEventListener('click', () => {
      state.distractionCount++;
      if (dom.distractionCount) dom.distractionCount.textContent = state.distractionCount;
    });
  }

  // --- Focus tip ---
  dom.getTipBtn.addEventListener('click', getFocusTip);

  // --- Navigation ---
  dom.navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      dom.navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      dom.pages.forEach(page => page.classList.toggle('active', page.id === targetId));
      playSound('click');
      if (targetId === 'history-page') { renderHistory(); renderWeeklyChart(); }
      if (targetId === 'stats-page')   renderStats();
    });
  });

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
    if (state.notifEnabled && Notification.permission === 'default') Notification.requestPermission();
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

  // --- Keyboard shortcuts ---
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.code === 'Space') {
      e.preventDefault();
      if (state.timerInterval) pauseTimer(); else startTimer();
    } else if (e.key === 'r' || e.key === 'R') {
      resetTimer();
    } else if (e.key === 's' || e.key === 'S') {
      if (state.currentMode !== 'work') { switchMode('work'); startTimer(); }
    }
  });
}
