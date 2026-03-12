import { state, TIMER_PRESETS, BREAK_ACTIVITIES } from './state.js';
import { dom } from './dom.js';
import { playSound, startAmbient, stopAmbient } from './audio.js';
import { applyTheme, applyAccent, applyFontSize, applyAnimations, applyReducedMotion } from './theme.js';
import { loadSettings, saveSettings, backupData, restoreData, exportHistoryCSV, clearHistory, saveTaskQueue, importSessionsCSV } from './storage.js';
import { startTimer, pauseTimer, resetTimer, switchMode } from './timer.js';
import { handleRating } from './rating.js';
import { getFocusTip } from './tips.js';
import { renderHistory, renderWeeklyChart, renderStats, updateTopStats, showToast, renderTaskQueue } from './render.js';
import {
  applyHighContrast,
  applyColorblindPalette,
  toggleVoiceControl,
  setHapticEnabled,
  hapticFeedback,
  applyPerformanceMode,
  toggleWidgetMode,
  shareDailySummary,
  shareWeeklyDigest,
  shareAchievement,
  generateChallengeString,
  decodeChallengeString,
  renderChallengeComparison,
  generateICalFile,
  setWebhookUrl,
  applyUnlockableTheme,
  renderUnlockableThemes,
  renderWeeklyMissions,
  renderFocusGarden,
  renderProgressTimeline,
  announceToScreenReader,
} from './features-batch5.js';
import { i18n } from './i18n.js';

export function registerAllEvents() {
  // --- Start / Pause ---
  dom.startPauseBtn.addEventListener('click', () => {
    hapticFeedback('click');
    if (state.timerInterval) pauseTimer(); else startTimer();
  });

  // --- Stop (Reset) ---
  dom.stopBtn.addEventListener('click', () => {
    hapticFeedback('click');
    resetTimer();
  });

  // --- Skip ---
  dom.skipBtn.addEventListener('click', () => {
    hapticFeedback('click');
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

  // --- Focus rating ---
  dom.focusRating.addEventListener('click', e => {
    const btn = e.target.closest('[data-rating]');
    if (btn) { playSound('click'); hapticFeedback('click'); handleRating(btn.dataset.rating); }
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
      if (targetId === 'stats-page') {
        renderStats();
        // Batch 5 stats renders
        renderWeeklyMissions();
        renderFocusGarden();
        renderProgressTimeline();
      }
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
      import('./render.js').then(m => m.renderSessionTarget());
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

  // --- Task queue ---
  const newTaskInput = document.getElementById('new-task-input');
  const addTaskBtn   = document.getElementById('add-task-btn');
  const priorityChips = document.querySelectorAll('.priority-chip');
  let selectedPriority = 'medium';

  priorityChips.forEach(chip => {
    chip.addEventListener('click', () => {
      priorityChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      selectedPriority = chip.dataset.priority;
    });
  });

  function addTask() {
    const name = newTaskInput ? newTaskInput.value.trim() : '';
    if (!name) return;
    const task = { id: state.nextTaskId++, name, priority: selectedPriority, done: false };
    state.taskQueue.push(task);
    saveTaskQueue();
    if (newTaskInput) newTaskInput.value = '';
    renderTaskQueue();
  }

  if (addTaskBtn) addTaskBtn.addEventListener('click', addTask);
  if (newTaskInput) {
    newTaskInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });
  }

  // Task queue item interactions (delegated)
  const taskQueueList = document.getElementById('task-queue-list');
  if (taskQueueList) {
    taskQueueList.addEventListener('click', e => {
      const item = e.target.closest('.task-item');
      if (!item) return;
      const id = parseInt(item.dataset.id, 10);

      if (e.target.closest('.task-item-check')) {
        const task = state.taskQueue.find(t => t.id === id);
        if (task) { task.done = !task.done; saveTaskQueue(); renderTaskQueue(); }
      } else if (e.target.closest('.btn-focus-task')) {
        const task = state.taskQueue.find(t => t.id === id);
        if (task) {
          if (dom.taskInput) dom.taskInput.value = task.name;
          state.currentTask = task.name;
          // Switch to timer tab
          dom.navBtns.forEach(b => b.classList.remove('active'));
          dom.pages.forEach(p => p.classList.remove('active'));
          const timerBtn = document.querySelector('[data-target="timer-page"]');
          if (timerBtn) timerBtn.classList.add('active');
          const timerPage = document.getElementById('timer-page');
          if (timerPage) timerPage.classList.add('active');
        }
      } else if (e.target.closest('.btn-delete-task')) {
        state.taskQueue = state.taskQueue.filter(t => t.id !== id);
        saveTaskQueue();
        renderTaskQueue();
      }
    });
  }

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

  // --- Navigation (update to include tasks page) ---
  dom.navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.target === 'tasks-page') renderTaskQueue();
    });
  });

  // --- Keyboard shortcuts (#97 enhanced) ---
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    if (e.code === 'Space') {
      e.preventDefault();
      if (state.timerInterval) {
        pauseTimer();
        announceToScreenReader('Timer paused');
      } else {
        startTimer();
        announceToScreenReader('Timer started');
      }
    } else if (e.key === 'r' || e.key === 'R') {
      resetTimer();
      announceToScreenReader('Timer reset');
    } else if (e.key === 's' || e.key === 'S') {
      if (state.currentMode !== 'work') { switchMode('work'); startTimer(); }
      announceToScreenReader('Skipped to work');
    }
  });

  // ====================================================================
  // Batch 5 Event Listeners
  // ====================================================================

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
