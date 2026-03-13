import { state, TIMER_PRESETS, BREAK_ACTIVITIES } from './state.js';
import { dom } from './dom.js';
import { playSound, startAmbient, stopAmbient } from './audio.js';
import { applyTheme, applyAccent, applyFontSize, applyAnimations, applyReducedMotion, applyBackground, applyTimerFont, applyNotificationSound, applyDensity, applyFocusLabels, applyCelebrationStyle, applyTimerScale, applySeasonalTheme } from './theme.js';
import { previewNotificationSound } from './audio.js';
import { loadSettings, saveSettings, backupData, restoreData, exportHistoryCSV, clearHistory, saveTaskQueue, importSessionsCSV, saveSessionChain, saveRecurringTasks, saveTaskTemplates, switchProfile, createProfile, deleteProfile, saveProfiles } from './storage.js';
import { startTimer, pauseTimer, resetTimer, switchMode, stopOvertime, startChain } from './timer.js';
import { handleRating, showReflectionPrompt } from './rating.js';
import { getFocusTip } from './tips.js';
import { renderHistory, renderWeeklyChart, renderStats, updateTopStats, showToast, renderTaskQueue, renderSessionChain, renderRecurringTasks, renderTaskTemplates, renderLeaderboard, populateProfileSelect } from './render.js';
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

  // --- Focus rating ---
  dom.focusRating.addEventListener('click', e => {
    const btn = e.target.closest('[data-rating]');
    if (btn) { playSound('click'); hapticFeedback('click'); handleRating(btn.dataset.rating); }
  });

  // Show reflection prompt when focus-rating becomes visible
  const observer = new MutationObserver(() => {
    if (!dom.focusRating.classList.contains('hidden')) {
      showReflectionPrompt();
    }
  });
  observer.observe(dom.focusRating, { attributes: true, attributeFilter: ['class'] });

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

  // --- Mood buttons (#21) ---
  dom.moodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      dom.moodBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.currentMood = btn.dataset.mood;
    });
  });

  // --- Complexity stars (#28) ---
  dom.complexityStars.forEach(star => {
    star.addEventListener('click', () => {
      const val = parseInt(star.dataset.complexity, 10);
      state.currentComplexity = val;
      dom.complexityStars.forEach(s => {
        s.classList.toggle('active', parseInt(s.dataset.complexity, 10) <= val);
      });
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

  // --- Session Chain (#11) ---
  if (dom.chainToggleBtn) {
    dom.chainToggleBtn.addEventListener('click', () => {
      if (dom.chainBody) dom.chainBody.classList.toggle('hidden');
      dom.chainToggleBtn.textContent = dom.chainBody.classList.contains('hidden') ? '▸' : '▾';
    });
  }

  if (dom.chainAddBtn) {
    dom.chainAddBtn.addEventListener('click', () => {
      const dur = parseInt(dom.chainDurationInput?.value, 10) || 25;
      const task = dom.chainTaskInput?.value.trim() || 'Untitled';
      state.sessionChain.push({ duration: dur, task, done: false });
      saveSessionChain();
      renderSessionChain();
      if (dom.chainTaskInput) dom.chainTaskInput.value = '';
    });
  }

  if (dom.chainStartBtn) {
    dom.chainStartBtn.addEventListener('click', () => {
      if (state.sessionChain.length === 0) { showToast('Add sessions to the chain first'); return; }
      startChain();
    });
  }

  if (dom.chainClearBtn) {
    dom.chainClearBtn.addEventListener('click', () => {
      state.sessionChain = [];
      state.chainIndex = -1;
      saveSessionChain();
      renderSessionChain();
    });
  }

  // Chain list: delete entries
  if (dom.chainList) {
    dom.chainList.addEventListener('click', e => {
      const btn = e.target.closest('.btn-delete-chain');
      if (!btn) return;
      const idx = parseInt(btn.dataset.chainIdx, 10);
      state.sessionChain.splice(idx, 1);
      saveSessionChain();
      renderSessionChain();
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
    const estimate = dom.taskEstimateInput ? parseInt(dom.taskEstimateInput.value, 10) || 0 : 0;
    const task = {
      id: state.nextTaskId++,
      name,
      priority: selectedPriority,
      done: false,
      archived: false,
      estimate,
      pomodorosCompleted: 0,
      subtasks: [],
    };
    state.taskQueue.push(task);
    saveTaskQueue();
    if (newTaskInput) newTaskInput.value = '';
    renderTaskQueue();
  }

  if (addTaskBtn) addTaskBtn.addEventListener('click', addTask);
  if (newTaskInput) {
    newTaskInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });
  }

  // --- Save as template (#39) ---
  if (dom.saveTemplateBtn) {
    dom.saveTemplateBtn.addEventListener('click', () => {
      const name = newTaskInput ? newTaskInput.value.trim() : '';
      if (!name) { showToast('Enter a task name first'); return; }
      const template = {
        id: state.nextTemplateId++,
        name,
        category: state.currentCategory,
        complexity: state.currentComplexity,
        estimate: dom.taskEstimateInput ? parseInt(dom.taskEstimateInput.value, 10) || 0 : 0,
      };
      state.taskTemplates.push(template);
      saveTaskTemplates();
      renderTaskTemplates();
      showToast('Template saved!');
    });
  }

  // --- Template list interactions ---
  if (dom.templateList) {
    dom.templateList.addEventListener('click', e => {
      const loadBtn = e.target.closest('.btn-load-template');
      const deleteBtn = e.target.closest('.btn-delete-template');
      if (loadBtn) {
        const id = parseInt(loadBtn.dataset.templateId, 10);
        const t = state.taskTemplates.find(t => t.id === id);
        if (t) {
          if (newTaskInput) newTaskInput.value = t.name;
          if (t.category) {
            state.currentCategory = t.category;
            dom.categoryChips.forEach(c => c.classList.toggle('active', c.dataset.cat === t.category));
          }
          if (t.complexity) {
            state.currentComplexity = t.complexity;
            dom.complexityStars.forEach(s => s.classList.toggle('active', parseInt(s.dataset.complexity, 10) <= t.complexity));
          }
          if (dom.taskEstimateInput) dom.taskEstimateInput.value = t.estimate || 0;
          showToast('Template loaded!');
        }
      }
      if (deleteBtn) {
        const id = parseInt(deleteBtn.dataset.templateId, 10);
        state.taskTemplates = state.taskTemplates.filter(t => t.id !== id);
        saveTaskTemplates();
        renderTaskTemplates();
      }
    });
  }

  // --- Show archived toggle (#40) ---
  if (dom.showArchivedToggle) {
    dom.showArchivedToggle.addEventListener('change', e => {
      state.showArchived = e.target.checked;
      renderTaskQueue();
    });
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
        if (task) {
          task.done = !task.done;
          // Track pomodoro completion for estimates (#34)
          if (task.done && task.estimate > 0) {
            task.pomodorosCompleted = (task.pomodorosCompleted || 0) + 1;
          }
          saveTaskQueue();
          renderTaskQueue();
        }
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
      } else if (e.target.closest('.btn-archive-task')) {
        const task = state.taskQueue.find(t => t.id === id);
        if (task) {
          task.archived = true;
          saveTaskQueue();
          renderTaskQueue();
          showToast('Task archived');
        }
      } else if (e.target.closest('.btn-add-subtask')) {
        const task = state.taskQueue.find(t => t.id === id);
        if (task) {
          const text = prompt('Subtask name:');
          if (text && text.trim()) {
            if (!task.subtasks) task.subtasks = [];
            task.subtasks.push({ text: text.trim(), done: false });
            saveTaskQueue();
            renderTaskQueue();
          }
        }
      } else if (e.target.closest('.btn-delete-task')) {
        state.taskQueue = state.taskQueue.filter(t => t.id !== id);
        saveTaskQueue();
        renderTaskQueue();
      }
    });

    // Subtask checkbox handling
    taskQueueList.addEventListener('change', e => {
      if (!e.target.classList.contains('subtask-check')) return;
      const label = e.target.closest('.subtask-item');
      if (!label) return;
      const taskId = parseInt(label.dataset.taskId, 10);
      const subtaskIdx = parseInt(label.dataset.subtaskIdx, 10);
      const task = state.taskQueue.find(t => t.id === taskId);
      if (task && task.subtasks && task.subtasks[subtaskIdx] !== undefined) {
        task.subtasks[subtaskIdx].done = e.target.checked;
        saveTaskQueue();
        renderTaskQueue();
      }
    });
  }

  // --- Recurring tasks (#33) ---
  if (dom.addRecurringBtn) {
    dom.addRecurringBtn.addEventListener('click', () => {
      const name = dom.recurringTaskInput ? dom.recurringTaskInput.value.trim() : '';
      if (!name) { showToast('Enter a task name'); return; }
      const dayCheckboxes = document.querySelectorAll('#recurring-days-row input[type="checkbox"]');
      const days = [];
      dayCheckboxes.forEach(cb => { if (cb.checked) days.push(parseInt(cb.dataset.day, 10)); });
      if (days.length === 0) { showToast('Select at least one day'); return; }
      state.recurringTasks.push({ id: state.nextRecurringId++, name, days });
      saveRecurringTasks();
      renderRecurringTasks();
      if (dom.recurringTaskInput) dom.recurringTaskInput.value = '';
      dayCheckboxes.forEach(cb => cb.checked = false);
      showToast('Recurring task added');
    });
  }

  if (dom.recurringTaskList) {
    dom.recurringTaskList.addEventListener('click', e => {
      const btn = e.target.closest('.btn-delete-recurring');
      if (!btn) return;
      const id = parseInt(btn.dataset.recurringId, 10);
      state.recurringTasks = state.recurringTasks.filter(rt => rt.id !== id);
      saveRecurringTasks();
      renderRecurringTasks();
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
      if (btn.dataset.target === 'tasks-page') {
        renderTaskQueue();
        renderRecurringTasks();
        renderTaskTemplates();
      }
    });
  });

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

  // --- Keyboard shortcuts (#97 enhanced) ---
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    if (e.code === 'Space') {
      e.preventDefault();
      if (state.isOvertime) { stopOvertime(); return; }
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

  // --- #81 Profiles & Leaderboard ---
  populateProfileSelect();

  if (dom.profileSelect) {
    dom.profileSelect.addEventListener('change', e => {
      const refreshAll = [renderHistory, renderWeeklyChart, renderStats, updateTopStats, renderTaskQueue, renderRecurringTasks, renderTaskTemplates];
      switchProfile(e.target.value, refreshAll);
      showToast(`Switched to ${e.target.value}`);
    });
  }

  if (dom.createProfileBtn) {
    dom.createProfileBtn.addEventListener('click', () => {
      const name = dom.newProfileInput ? dom.newProfileInput.value.trim() : '';
      if (!name) { showToast('Enter a profile name'); return; }
      if (createProfile(name)) {
        populateProfileSelect();
        renderLeaderboard();
        if (dom.newProfileInput) dom.newProfileInput.value = '';
        showToast(`Profile "${name}" created`);
      } else {
        showToast('Profile already exists');
      }
    });
  }

  if (dom.deleteProfileBtn) {
    dom.deleteProfileBtn.addEventListener('click', () => {
      const name = state.currentProfile;
      if (name === 'Default') { showToast('Cannot delete Default profile'); return; }
      if (!confirm(`Delete profile "${name}"? All its data will be lost.`)) return;
      const refreshAll = [renderHistory, renderWeeklyChart, renderStats, updateTopStats, renderTaskQueue, renderRecurringTasks, renderTaskTemplates];
      deleteProfile(name, refreshAll);
      populateProfileSelect();
      renderLeaderboard();
      showToast(`Profile "${name}" deleted`);
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
