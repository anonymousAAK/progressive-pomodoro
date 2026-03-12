import { state, POMODOROS_BEFORE_LONG_BREAK, BREAK_ACTIVITIES } from './state.js';
import { dom } from './dom.js';
import { playSound } from './audio.js';
import { updateTimerDisplay, updateNextInfo, renderSessionDots, showCelebration, showToast, showAffirmation } from './render.js';

// Injected from rating.js to avoid circular deps
let _onWorkComplete = null;
let _onBreakComplete = null;

export function setTimerCallbacks(onWork, onBreak) {
  _onWorkComplete  = onWork;
  _onBreakComplete = onBreak;
}

// --- Notification helper ---

function sendNotification(title, body, notifActions) {
  if (!state.notifEnabled) return;
  if (Notification.permission !== 'granted') return;
  const opts = { body, icon: '🍅' };
  if (notifActions && Array.isArray(notifActions)) opts.actions = notifActions;
  const n = new Notification(title, opts);
  n.onclick = () => window.focus();
}

// --- Micro-break helper ---

function showMicroBreak() {
  showToast('🧘 30-second micro-break — stretch or breathe');
}

// --- Wind-down: adjust work duration if near end of day (#15) ---

function applyWindDown() {
  if (!state.windDownEnabled) return;
  const now = new Date();
  const [h, m] = state.windDownTime.split(':').map(Number);
  const endOfDay = new Date(now);
  endOfDay.setHours(h, m, 0, 0);
  const msUntilEnd = endOfDay - now;
  const oneHour = 60 * 60 * 1000;
  if (msUntilEnd > 0 && msUntilEnd <= oneHour) {
    // Within 1 hour of end time - reduce by 20% per session in window
    state.windDownSessionsInWindow++;
    const reduction = Math.pow(0.8, state.windDownSessionsInWindow);
    state.totalSeconds = Math.max(60, Math.round(state.totalSeconds * reduction));
    state.secondsLeft = state.totalSeconds;
    showToast(`🌙 Wind-down: session shortened to ${Math.round(state.totalSeconds / 60)}min`);
  } else {
    state.windDownSessionsInWindow = 0;
  }
}

// --- Smart break suggestion (#14) ---

function checkSmartBreakSuggestion() {
  const today = new Date().toDateString();
  const todaySessions = state.sessionHistory.filter(s => s.date === today);
  if (todaySessions.length >= 3) {
    // Check for consecutive sessions (no long break taken)
    const recentRatings = todaySessions.slice(0, 2).map(s => s.rating);
    const lowRatings = recentRatings.filter(r => r === 'Distracted' || r === 'Okay');
    if (lowRatings.length >= 2) {
      setTimeout(() => showToast('💡 Your last sessions rated low — consider a longer break to recharge'), 800);
    } else if (todaySessions.length >= 3 && state.completedPomodoros >= 3) {
      setTimeout(() => showToast('☕ You\'ve done 3+ sessions — a long break might boost your focus!'), 800);
    }
  }
}

// --- Controls ---

export function startTimer() {
  if (state.timerInterval) return;
  state.currentTask = dom.taskInput.value.trim();

  // Capture intention when starting fresh (not resuming)
  const isResume = dom.startPauseBtn.textContent === 'Resume';
  if (!isResume) {
    state.currentIntention = dom.intentionInput ? dom.intentionInput.value.trim() : '';
    state.microBreakShown = false;
    state.pausesUsed = 0;
    state.overtimeSeconds = 0;
    state.isOvertime = false;
    state.actualWorkSeconds = 0;
    // Show affirmation if enabled
    if (state.affirmationsEnabled) showAffirmation();

    // Warm-up mode (#2)
    if (state.warmUpEnabled && state.currentMode === 'work' && !state.isWarmUp) {
      state.isWarmUp = true;
      state.totalSeconds = 120; // 2 minutes
      state.secondsLeft = 120;
      dom.timerMode.innerHTML = '<span class="mode-icon">🔥</span> Warm-up';
      if (dom.ringProgress) dom.ringProgress.classList.add('warmup-mode');
    }

    // Wind-down check (#15)
    if (state.currentMode === 'work' && !state.isWarmUp) {
      applyWindDown();
    }
  }

  dom.startPauseBtn.textContent = 'Pause';
  if (state.secondsLeft <= 0) state.secondsLeft = state.totalSeconds;
  state.halfTimeChimed = false;

  // Update pause counter display
  updatePauseCounter();

  // Update lockout UI
  updateLockoutUI();

  // Show distraction counter only during work
  if (state.currentMode === 'work' && dom.distractionWrapper) {
    dom.distractionWrapper.classList.remove('hidden');
  }

  // Show quick switch wrapper during work
  if (state.currentMode === 'work' && dom.quickSwitchWrapper) {
    dom.quickSwitchWrapper.classList.remove('hidden');
  }

  state.timerInterval = setInterval(() => {
    state.secondsLeft--;

    // Track actual work time for variable break scaling (#8)
    if (state.currentMode === 'work' && !state.isWarmUp) {
      state.actualWorkSeconds++;
    }

    // Half-time chime (work only)
    if (
      state.currentMode === 'work' &&
      !state.halfTimeChimed &&
      state.secondsLeft === Math.floor(state.totalSeconds / 2)
    ) {
      playSound('halftime');
      state.halfTimeChimed = true;
    }

    // Micro-break reminder: 10 min elapsed in a long session (> 20 min)
    if (
      state.currentMode === 'work' &&
      state.microBreakEnabled &&
      !state.microBreakShown &&
      state.totalSeconds > 1200 &&
      (state.totalSeconds - state.secondsLeft) === 600
    ) {
      showMicroBreak();
      state.microBreakShown = true;
    }

    // Gradual timer acceleration (#13) - add CSS class in last 10%
    if (state.currentMode === 'work' && !state.isWarmUp) {
      const remaining = state.secondsLeft / state.totalSeconds;
      if (remaining <= 0.1 && remaining > 0) {
        if (dom.ringProgress) dom.ringProgress.classList.add('accelerating');
      } else {
        if (dom.ringProgress) dom.ringProgress.classList.remove('accelerating');
      }
    }

    // Determine display seconds (count-up shows elapsed)
    const displaySeconds = state.countUp
      ? state.totalSeconds - state.secondsLeft
      : state.secondsLeft;
    updateTimerDisplay(displaySeconds, state.totalSeconds, state.currentMode, state.timerInterval);

    if (state.secondsLeft <= 0) {
      // Check overtime mode (#3)
      if (state.overtimeEnabled && state.currentMode === 'work' && !state.isWarmUp && !state.isOvertime) {
        state.isOvertime = true;
        dom.timerMode.innerHTML = '<span class="mode-icon">⏱️</span> Overtime';
        if (dom.ringProgress) dom.ringProgress.classList.add('overtime-mode');
        playSound('halftime');
        showToast('⏱️ Overtime! Keep working or stop when ready.');
        // Don't clear interval - keep counting
        return;
      }

      if (state.isOvertime) {
        state.overtimeSeconds++;
        // Update display to show overtime
        const overtimeDisplay = state.overtimeSeconds;
        dom.timerDisplay.textContent = '+' + String(Math.floor(overtimeDisplay / 60)).padStart(2, '0') + ':' + String(overtimeDisplay % 60).padStart(2, '0');
        document.title = `+${String(Math.floor(overtimeDisplay / 60)).padStart(2, '0')}:${String(overtimeDisplay % 60).padStart(2, '0')} - Overtime | Progressive Pomodoro`;
        return;
      }

      clearInterval(state.timerInterval);
      state.timerInterval = null;
      if (dom.ringProgress) {
        dom.ringProgress.classList.remove('accelerating');
        dom.ringProgress.classList.remove('overtime-mode');
      }
      _onTimerComplete();
    }
  }, 1000);
}

export function stopOvertime() {
  if (!state.isOvertime) return;
  state.isOvertime = false;
  clearInterval(state.timerInterval);
  state.timerInterval = null;
  if (dom.ringProgress) {
    dom.ringProgress.classList.remove('overtime-mode');
    dom.ringProgress.classList.remove('accelerating');
  }
  _onTimerComplete();
}

export function pauseTimer() {
  // Check pause limit (#4)
  if (state.pauseLimit >= 0 && state.pausesUsed >= state.pauseLimit) {
    showToast('⚠️ Pause limit reached!');
    return;
  }

  // Check lockout (#9)
  if (state.lockoutRemaining > 0 && state.currentMode === 'work') {
    showToast('🔒 Focus lockout active — pausing disabled');
    return;
  }

  clearInterval(state.timerInterval);
  state.timerInterval = null;
  state.pausesUsed++;
  dom.startPauseBtn.textContent = 'Resume';
  updatePauseCounter();
}

function updatePauseCounter() {
  if (!dom.pauseCounter || !dom.pausesRemaining) return;
  if (state.pauseLimit >= 0 && state.currentMode === 'work') {
    dom.pauseCounter.classList.remove('hidden');
    const remaining = Math.max(0, state.pauseLimit - state.pausesUsed);
    dom.pausesRemaining.textContent = remaining;
    // Disable pause button visual cue
    if (remaining <= 0 && state.timerInterval) {
      dom.startPauseBtn.classList.add('pause-disabled');
    } else {
      dom.startPauseBtn.classList.remove('pause-disabled');
    }
  } else {
    dom.pauseCounter.classList.add('hidden');
    dom.startPauseBtn.classList.remove('pause-disabled');
  }
}

function updateLockoutUI() {
  if (!dom.lockoutBadge || !dom.lockoutCount) return;
  if (state.lockoutRemaining > 0) {
    dom.lockoutBadge.classList.remove('hidden');
    dom.lockoutCount.textContent = state.lockoutRemaining;
    // Disable skip button during lockout
    if (dom.skipBtn) dom.skipBtn.disabled = true;
  } else {
    dom.lockoutBadge.classList.add('hidden');
    if (dom.skipBtn) dom.skipBtn.disabled = false;
  }
}

export { updateLockoutUI };

export function resetTimer() {
  clearInterval(state.timerInterval);
  state.timerInterval = null;
  state.currentMode   = 'work';
  state.totalSeconds  = state.workDuration;
  state.secondsLeft   = state.totalSeconds;
  state.halfTimeChimed = false;
  state.distractionCount = 0;
  state.microBreakShown = false;
  state.isWarmUp = false;
  state.isOvertime = false;
  state.overtimeSeconds = 0;
  state.pausesUsed = 0;
  state.actualWorkSeconds = 0;

  dom.startPauseBtn.textContent = 'Start';
  dom.startPauseBtn.classList.remove('break-mode');
  dom.startPauseBtn.classList.remove('pause-disabled');
  dom.timerMode.innerHTML = '<span class="mode-icon">⚡</span> Work';
  dom.timerControls.classList.remove('hidden');
  dom.skipBreakWrapper.classList.add('hidden');
  dom.focusRating.classList.add('hidden');
  dom.tipSection.classList.add('hidden');
  if (dom.distractionWrapper) dom.distractionWrapper.classList.add('hidden');
  if (dom.distractionCount)   dom.distractionCount.textContent = '0';
  if (dom.quickSwitchWrapper) dom.quickSwitchWrapper.classList.add('hidden');
  if (dom.breakActivityCard)  dom.breakActivityCard.classList.add('hidden');
  if (dom.pauseCounter)       dom.pauseCounter.classList.add('hidden');
  if (dom.ringProgress) {
    dom.ringProgress.classList.remove('warmup-mode');
    dom.ringProgress.classList.remove('overtime-mode');
    dom.ringProgress.classList.remove('accelerating');
  }

  const displaySeconds = state.countUp ? 0 : state.secondsLeft;
  updateTimerDisplay(displaySeconds, state.totalSeconds, state.currentMode, null);
  updateNextInfo();
  renderSessionDots();
  updateLockoutUI();
  document.title = 'Progressive Pomodoro';
}

export function switchMode(mode) {
  clearInterval(state.timerInterval);
  state.timerInterval = null;
  state.currentMode = mode;
  state.halfTimeChimed = false;
  state.isWarmUp = false;
  state.isOvertime = false;
  state.overtimeSeconds = 0;

  dom.tipSection.classList.add('hidden');
  dom.tipDisplay.textContent = '';
  if (dom.distractionWrapper) dom.distractionWrapper.classList.add('hidden');
  if (dom.quickSwitchWrapper) dom.quickSwitchWrapper.classList.add('hidden');
  if (dom.ringProgress) {
    dom.ringProgress.classList.remove('warmup-mode');
    dom.ringProgress.classList.remove('overtime-mode');
    dom.ringProgress.classList.remove('accelerating');
  }

  if (mode === 'work') {
    state.totalSeconds = state.workDuration;
    dom.timerMode.innerHTML = '<span class="mode-icon">⚡</span> Work';
    dom.skipBreakWrapper.classList.add('hidden');
    dom.startPauseBtn.classList.remove('break-mode');
    if (dom.breakActivityCard) dom.breakActivityCard.classList.add('hidden');
  } else if (mode === 'longbreak') {
    // Variable break scaling (#8)
    const configuredWorkSec = state.workDuration;
    const actualWorkSec = state.actualWorkSeconds || configuredWorkSec;
    const scaleFactor = configuredWorkSec > 0 ? actualWorkSec / configuredWorkSec : 1;
    state.totalSeconds = Math.round(state.longBreakDuration * scaleFactor);

    dom.timerMode.innerHTML = '<span class="mode-icon">🌿</span> Long Break';
    dom.skipBreakWrapper.classList.remove('hidden');
    dom.startPauseBtn.classList.add('break-mode');
    if (state.lastFocusRating === 'distracted' || state.lastFocusRating === 'okay') {
      dom.tipSection.classList.remove('hidden');
    }
    // Show break activity suggestion
    if (dom.breakActivityCard && dom.breakActivityText) {
      dom.breakActivityText.textContent = BREAK_ACTIVITIES[Math.floor(Math.random() * BREAK_ACTIVITIES.length)];
      dom.breakActivityCard.classList.remove('hidden');
    }
  } else {
    // Variable break scaling (#8)
    const configuredWorkSec = state.workDuration;
    const actualWorkSec = state.actualWorkSeconds || configuredWorkSec;
    const scaleFactor = configuredWorkSec > 0 ? actualWorkSec / configuredWorkSec : 1;
    state.totalSeconds = Math.round(state.breakDuration * scaleFactor);

    dom.timerMode.innerHTML = '<span class="mode-icon">☕</span> Break';
    dom.skipBreakWrapper.classList.remove('hidden');
    dom.startPauseBtn.classList.add('break-mode');
    if (state.lastFocusRating === 'distracted' || state.lastFocusRating === 'okay') {
      dom.tipSection.classList.remove('hidden');
    }
    // Show break activity suggestion
    if (dom.breakActivityCard && dom.breakActivityText) {
      dom.breakActivityText.textContent = BREAK_ACTIVITIES[Math.floor(Math.random() * BREAK_ACTIVITIES.length)];
      dom.breakActivityCard.classList.remove('hidden');
    }
  }

  state.secondsLeft = state.totalSeconds;
  dom.startPauseBtn.textContent = 'Start';
  const displaySeconds = state.countUp ? 0 : state.secondsLeft;
  updateTimerDisplay(displaySeconds, state.totalSeconds, state.currentMode, null);
  updateNextInfo();
  renderSessionDots();
}

// --- Internal: timer done ---

function _onTimerComplete() {
  // Warm-up complete — transition to real timer (#2)
  if (state.isWarmUp) {
    state.isWarmUp = false;
    if (dom.ringProgress) dom.ringProgress.classList.remove('warmup-mode');
    state.totalSeconds = state.workDuration;
    state.secondsLeft = state.totalSeconds;
    dom.timerMode.innerHTML = '<span class="mode-icon">⚡</span> Work';
    // Apply wind-down to the real timer
    applyWindDown();
    showToast('🔥 Warm-up done — real timer starts now!');
    startTimer();
    return;
  }

  if (state.currentMode === 'work') {
    playSound('work-end');
    sendNotification('Work session complete!', 'Time to rate your focus.', [{ label: 'Start Break', action: 'break' }]);
    dom.timerControls.classList.add('hidden');
    if (dom.distractionWrapper) dom.distractionWrapper.classList.add('hidden');
    dom.focusRating.classList.remove('hidden');
    showCelebration();

    // Smart break suggestion (#14)
    checkSmartBreakSuggestion();

    if (_onWorkComplete) _onWorkComplete();
  } else {
    playSound('break-end');
    sendNotification('Break is over!', 'Ready for another work session?');

    // Session chaining (#11) - advance to next chain entry
    if (state.sessionChain.length > 0 && state.chainIndex >= 0 && state.chainIndex < state.sessionChain.length - 1) {
      advanceChain();
      return;
    }

    switchMode('work');
    if (state.autoWork) startTimer();
    if (_onBreakComplete) _onBreakComplete();
  }
}

// --- Session chaining helpers (#11) ---

export function startChain() {
  if (state.sessionChain.length === 0) return;
  state.chainIndex = 0;
  loadChainEntry(0);
  startTimer();
}

function loadChainEntry(index) {
  const entry = state.sessionChain[index];
  if (!entry) return;
  state.currentMode = 'work';
  state.workDuration = entry.duration * 60;
  state.totalSeconds = state.workDuration;
  state.secondsLeft = state.totalSeconds;
  state.currentTask = entry.task;
  if (dom.taskInput) dom.taskInput.value = entry.task;
  dom.timerMode.innerHTML = `<span class="mode-icon">⛓</span> Chain ${index + 1}/${state.sessionChain.length}`;
  dom.startPauseBtn.textContent = 'Start';
  dom.startPauseBtn.classList.remove('break-mode');
  const displaySeconds = state.countUp ? 0 : state.secondsLeft;
  updateTimerDisplay(displaySeconds, state.totalSeconds, state.currentMode, null);
}

function advanceChain() {
  state.chainIndex++;
  if (state.chainIndex < state.sessionChain.length) {
    // Mark previous as done
    state.sessionChain[state.chainIndex - 1].done = true;
    import('./render.js').then(m => m.renderSessionChain());
    loadChainEntry(state.chainIndex);
    // Auto-start next
    startTimer();
  } else {
    // Chain complete
    state.sessionChain.forEach(e => e.done = true);
    import('./render.js').then(m => m.renderSessionChain());
    showToast('⛓ Session chain complete!');
    switchMode('work');
  }
}
