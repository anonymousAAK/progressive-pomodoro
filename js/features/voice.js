/**
 * Voice Control module
 * Implements Feature #100 — Voice Control.
 * Provides speech recognition-based voice commands for timer control
 * (start, pause, stop/reset, skip).
 */

import { state } from '../state.js';
import { showToast } from '../render/index.js';
import { announceToScreenReader } from './accessibility.js';

let recognition = null;
let voiceActive = false;

/**
 * Initializes the SpeechRecognition API for continuous voice control.
 * @returns {boolean} True if speech recognition is supported, false otherwise
 */
export function initVoiceControl() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return false;

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onresult = (event) => {
    const last = event.results[event.results.length - 1];
    if (!last.isFinal) return;
    const command = last[0].transcript.trim().toLowerCase();
    handleVoiceCommand(command);
  };

  recognition.onerror = () => {};
  recognition.onend = () => {
    if (voiceActive) {
      try { recognition.start(); } catch {}
    }
  };

  return true;
}

/**
 * Processes a recognized voice command and dispatches timer actions.
 * @param {string} command - The recognized voice command text
 */
function handleVoiceCommand(command) {
  const { startTimer, pauseTimer, resetTimer, switchMode } = getTimerFunctions();

  if (command.includes('start')) {
    if (!state.timerInterval) startTimer();
    showToast('Voice: Start');
    announceToScreenReader('Timer started by voice command');
  } else if (command.includes('pause')) {
    if (state.timerInterval) pauseTimer();
    showToast('Voice: Pause');
    announceToScreenReader('Timer paused by voice command');
  } else if (command.includes('stop') || command.includes('reset')) {
    resetTimer();
    showToast('Voice: Reset');
    announceToScreenReader('Timer reset by voice command');
  } else if (command.includes('skip')) {
    if (state.currentMode !== 'work') {
      switchMode('work');
      startTimer();
    }
    showToast('Voice: Skip');
    announceToScreenReader('Phase skipped by voice command');
  }
}

// Store timer functions for voice control (set from events registration)
let _timerFns = {};

/**
 * Sets the timer control functions used by voice commands.
 * Must be called during initialization to wire up startTimer, pauseTimer, etc.
 * @param {Object} fns - Object with startTimer, pauseTimer, resetTimer, switchMode functions
 */
export function setTimerFunctions(fns) { _timerFns = fns; }

function getTimerFunctions() { return _timerFns; }

/**
 * Toggles voice control on or off.
 * @param {boolean} enable - Whether to enable voice control
 * @returns {boolean} True if the operation succeeded, false if not supported
 */
export function toggleVoiceControl(enable) {
  if (!recognition && !initVoiceControl()) {
    showToast('Voice control not supported');
    return false;
  }
  voiceActive = enable;
  if (enable) {
    try { recognition.start(); } catch {}
    showToast('Voice control: ON');
  } else {
    try { recognition.stop(); } catch {}
    showToast('Voice control: OFF');
  }
  localStorage.setItem('pp_voiceControl', enable);
  return true;
}
