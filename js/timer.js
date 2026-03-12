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

// --- Controls ---

export function startTimer() {
  if (state.timerInterval) return;
  state.currentTask = dom.taskInput.value.trim();

  // Capture intention when starting fresh (not resuming)
  const isResume = dom.startPauseBtn.textContent === 'Resume';
  if (!isResume) {
    state.currentIntention = dom.intentionInput ? dom.intentionInput.value.trim() : '';
    state.microBreakShown = false;
    // Show affirmation if enabled
    if (state.affirmationsEnabled) showAffirmation();
  }

  dom.startPauseBtn.textContent = 'Pause';
  if (state.secondsLeft <= 0) state.secondsLeft = state.totalSeconds;
  state.halfTimeChimed = false;

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

    // Determine display seconds (count-up shows elapsed)
    const displaySeconds = state.countUp
      ? state.totalSeconds - state.secondsLeft
      : state.secondsLeft;
    updateTimerDisplay(displaySeconds, state.totalSeconds, state.currentMode, state.timerInterval);

    if (state.secondsLeft <= 0) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
      _onTimerComplete();
    }
  }, 1000);
}

export function pauseTimer() {
  clearInterval(state.timerInterval);
  state.timerInterval = null;
  dom.startPauseBtn.textContent = 'Resume';
}

export function resetTimer() {
  clearInterval(state.timerInterval);
  state.timerInterval = null;
  state.currentMode   = 'work';
  state.totalSeconds  = state.workDuration;
  state.secondsLeft   = state.totalSeconds;
  state.halfTimeChimed = false;
  state.distractionCount = 0;
  state.microBreakShown = false;

  dom.startPauseBtn.textContent = 'Start';
  dom.startPauseBtn.classList.remove('break-mode');
  dom.timerMode.innerHTML = '<span class="mode-icon">⚡</span> Work';
  dom.timerControls.classList.remove('hidden');
  dom.skipBreakWrapper.classList.add('hidden');
  dom.focusRating.classList.add('hidden');
  dom.tipSection.classList.add('hidden');
  if (dom.distractionWrapper) dom.distractionWrapper.classList.add('hidden');
  if (dom.distractionCount)   dom.distractionCount.textContent = '0';
  if (dom.quickSwitchWrapper) dom.quickSwitchWrapper.classList.add('hidden');
  if (dom.breakActivityCard)  dom.breakActivityCard.classList.add('hidden');

  const displaySeconds = state.countUp ? 0 : state.secondsLeft;
  updateTimerDisplay(displaySeconds, state.totalSeconds, state.currentMode, null);
  updateNextInfo();
  renderSessionDots();
  document.title = 'Progressive Pomodoro';
}

export function switchMode(mode) {
  clearInterval(state.timerInterval);
  state.timerInterval = null;
  state.currentMode = mode;
  state.halfTimeChimed = false;

  dom.tipSection.classList.add('hidden');
  dom.tipDisplay.textContent = '';
  if (dom.distractionWrapper) dom.distractionWrapper.classList.add('hidden');
  if (dom.quickSwitchWrapper) dom.quickSwitchWrapper.classList.add('hidden');

  if (mode === 'work') {
    state.totalSeconds = state.workDuration;
    dom.timerMode.innerHTML = '<span class="mode-icon">⚡</span> Work';
    dom.skipBreakWrapper.classList.add('hidden');
    dom.startPauseBtn.classList.remove('break-mode');
    if (dom.breakActivityCard) dom.breakActivityCard.classList.add('hidden');
  } else if (mode === 'longbreak') {
    state.totalSeconds = state.longBreakDuration;
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
    state.totalSeconds = state.breakDuration;
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
  if (state.currentMode === 'work') {
    playSound('work-end');
    sendNotification('Work session complete!', 'Time to rate your focus.', [{ label: 'Start Break', action: 'break' }]);
    dom.timerControls.classList.add('hidden');
    if (dom.distractionWrapper) dom.distractionWrapper.classList.add('hidden');
    dom.focusRating.classList.remove('hidden');
    showCelebration();
    if (_onWorkComplete) _onWorkComplete();
  } else {
    playSound('break-end');
    sendNotification('Break is over!', 'Ready for another work session?');
    switchMode('work');
    if (state.autoWork) startTimer();
    if (_onBreakComplete) _onBreakComplete();
  }
}
