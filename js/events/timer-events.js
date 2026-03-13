/**
 * Timer event listeners.
 * Handles Start/Pause, Stop/Reset, Skip, and Skip Break button interactions,
 * as well as timer presets, category chips, and count-up toggle.
 * @module timer-events
 */

import { state, TIMER_PRESETS, BREAK_ACTIVITIES } from '../state.js';
import { dom } from '../dom.js';
import { playSound } from '../audio.js';
import { saveSettings } from '../storage.js';
import { startTimer, pauseTimer, resetTimer, switchMode, stopOvertime } from '../timer.js';
import { showToast } from '../render/index.js';
import { hapticFeedback } from '../features/index.js';
import { getFocusTip } from '../tips.js';

/**
 * Registers all timer-related event listeners.
 * Includes Start/Pause, Stop, Skip, Skip Break, timer presets,
 * category chips, count-up toggle, micro-break toggle, and focus mode.
 */
export function registerTimerEvents() {
  // --- Start / Pause ---
  dom.startPauseBtn.addEventListener('click', () => {
    hapticFeedback('click');
    if (state.isOvertime) {
      stopOvertime();
      return;
    }
    if (state.timerInterval) pauseTimer(); else startTimer();
  });

  // --- Stop (Reset) ---
  dom.stopBtn.addEventListener('click', () => {
    hapticFeedback('click');
    if (state.isOvertime) { stopOvertime(); return; }
    resetTimer();
  });

  // --- Skip ---
  dom.skipBtn.addEventListener('click', () => {
    hapticFeedback('click');
    // Check lockout (#9)
    if (state.lockoutRemaining > 0 && state.currentMode === 'work') {
      showToast('🔒 Focus lockout active — skipping disabled');
      return;
    }
    if (state.currentMode === 'work') {
      resetTimer();
    } else {
      switchMode('work');
      startTimer();
    }
  });

  // --- Skip break ---
  dom.skipBreakBtn.addEventListener('click', () => {
    hapticFeedback('click');
    switchMode('work');
    startTimer();
  });

  // --- Timer presets ---
  dom.presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = TIMER_PRESETS[btn.dataset.preset];
      if (!preset) return;
      playSound('click');
      hapticFeedback('click');
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
      hapticFeedback('click');
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

  // --- Count-up toggle ---
  if (dom.countUpToggle) {
    dom.countUpToggle.addEventListener('change', e => {
      state.countUp = e.target.checked;
      localStorage.setItem('pp_countUp', e.target.checked);
    });
  }

  // --- Micro-break toggle ---
  if (dom.microBreakEnabled) {
    dom.microBreakEnabled.addEventListener('change', e => {
      state.microBreakEnabled = e.target.checked;
      localStorage.setItem('pp_microBreak', e.target.checked);
    });
  }

  // --- Affirmations toggle ---
  const affirmToggle = document.getElementById('affirmations-enabled');
  if (affirmToggle) {
    affirmToggle.addEventListener('change', e => {
      state.affirmationsEnabled = e.target.checked;
      localStorage.setItem('pp_affirmations', e.target.checked);
    });
  }

  // --- Session target input ---
  if (dom.sessionTargetInput) {
    dom.sessionTargetInput.addEventListener('change', e => {
      state.sessionTarget = parseInt(e.target.value, 10) || 0;
      localStorage.setItem('pp_sessionTarget', state.sessionTarget);
      import('../render/index.js').then(m => m.renderSessionTarget());
    });
  }

  // --- Energy level buttons ---
  document.addEventListener('click', e => {
    const btn = e.target.closest('.energy-btn');
    if (!btn) return;
    document.querySelectorAll('.energy-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.currentEnergy = btn.dataset.energy;
  });

  // --- Next activity button ---
  if (dom.nextActivityBtn) {
    dom.nextActivityBtn.addEventListener('click', () => {
      if (dom.breakActivityText) {
        dom.breakActivityText.textContent = BREAK_ACTIVITIES[Math.floor(Math.random() * BREAK_ACTIVITIES.length)];
      }
    });
  }

  // --- Focus mode button ---
  if (dom.focusModeBtn) {
    dom.focusModeBtn.addEventListener('click', () => {
      state.isFocusMode = !state.isFocusMode;
      document.getElementById('app').classList.toggle('focus-mode', state.isFocusMode);
      dom.focusModeBtn.textContent = state.isFocusMode ? '✕' : '⛶';
    });
  }

  // --- Quick switch ---
  if (dom.quickSwitchBtn) {
    dom.quickSwitchBtn.addEventListener('click', () => {
      const val = dom.quickSwitchInput ? dom.quickSwitchInput.value.trim() : '';
      if (val) {
        state.currentTask = val;
        if (dom.taskInput) dom.taskInput.value = val;
        if (dom.quickSwitchInput) dom.quickSwitchInput.value = '';
        showToast('Task switched!');
      }
    });
  }

  // --- Distraction counter ---
  if (dom.distractionBtn) {
    dom.distractionBtn.addEventListener('click', () => {
      state.distractionCount++;
      if (dom.distractionCount) dom.distractionCount.textContent = state.distractionCount;
    });
  }

  // --- Focus tip ---
  dom.getTipBtn.addEventListener('click', getFocusTip);
}
