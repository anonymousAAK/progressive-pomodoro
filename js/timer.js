import { state, POMODOROS_BEFORE_LONG_BREAK } from './state.js';
import { dom } from './dom.js';
import { playSound } from './audio.js';
import { updateTimerDisplay, updateNextInfo, renderSessionDots, showCelebration } from './render.js';

// Injected from rating.js to avoid circular deps
let _onWorkComplete = null;
let _onBreakComplete = null;

export function setTimerCallbacks(onWork, onBreak) {
  _onWorkComplete  = onWork;
  _onBreakComplete = onBreak;
}

// --- Notification helper ---

function sendNotification(title, body) {
  if (!state.notifEnabled) return;
  if (Notification.permission === 'granted') new Notification(title, { body, icon: '🍅' });
}

// --- Controls ---

export function startTimer() {
  if (state.timerInterval) return;
  state.currentTask = dom.taskInput.value.trim();
  dom.startPauseBtn.textContent = 'Pause';
  if (state.secondsLeft <= 0) state.secondsLeft = state.totalSeconds;
  state.halfTimeChimed = false;

  // Show distraction counter only during work
  if (state.currentMode === 'work' && dom.distractionWrapper) {
    dom.distractionWrapper.classList.remove('hidden');
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

    updateTimerDisplay(state.secondsLeft, state.totalSeconds, state.currentMode, state.timerInterval);

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

  dom.startPauseBtn.textContent = 'Start';
  dom.startPauseBtn.classList.remove('break-mode');
  dom.timerMode.innerHTML = '<span class="mode-icon">⚡</span> Work';
  dom.timerControls.classList.remove('hidden');
  dom.skipBreakWrapper.classList.add('hidden');
  dom.focusRating.classList.add('hidden');
  dom.tipSection.classList.add('hidden');
  if (dom.distractionWrapper) dom.distractionWrapper.classList.add('hidden');
  if (dom.distractionCount)   dom.distractionCount.textContent = '0';

  updateTimerDisplay(state.secondsLeft, state.totalSeconds, state.currentMode, null);
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

  if (mode === 'work') {
    state.totalSeconds = state.workDuration;
    dom.timerMode.innerHTML = '<span class="mode-icon">⚡</span> Work';
    dom.skipBreakWrapper.classList.add('hidden');
    dom.startPauseBtn.classList.remove('break-mode');
  } else if (mode === 'longbreak') {
    state.totalSeconds = state.longBreakDuration;
    dom.timerMode.innerHTML = '<span class="mode-icon">🌿</span> Long Break';
    dom.skipBreakWrapper.classList.remove('hidden');
    dom.startPauseBtn.classList.add('break-mode');
    if (state.lastFocusRating === 'distracted' || state.lastFocusRating === 'okay') {
      dom.tipSection.classList.remove('hidden');
    }
  } else {
    state.totalSeconds = state.breakDuration;
    dom.timerMode.innerHTML = '<span class="mode-icon">☕</span> Break';
    dom.skipBreakWrapper.classList.remove('hidden');
    dom.startPauseBtn.classList.add('break-mode');
    if (state.lastFocusRating === 'distracted' || state.lastFocusRating === 'okay') {
      dom.tipSection.classList.remove('hidden');
    }
  }

  state.secondsLeft = state.totalSeconds;
  dom.startPauseBtn.textContent = 'Start';
  updateTimerDisplay(state.secondsLeft, state.totalSeconds, state.currentMode, null);
  updateNextInfo();
  renderSessionDots();
}

// --- Internal: timer done ---

function _onTimerComplete() {
  if (state.currentMode === 'work') {
    playSound('work-end');
    sendNotification('Work session complete!', 'Time to rate your focus.');
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
