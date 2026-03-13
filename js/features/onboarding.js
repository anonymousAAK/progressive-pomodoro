/**
 * Onboarding and Tooltip Tour module
 * Implements Features #102 (Tooltip Help System) and #103 (Onboarding Tutorial).
 * Provides a guided tooltip tour for returning users and a multi-step
 * onboarding tutorial for first-time users.
 */

import { state } from '../state.js';

/**
 * Tooltip definitions for the guided tour.
 * @type {Array<{selector: string, text: string}>}
 */
const TOOLTIPS = [
  { selector: '#presets-row', text: 'Choose a timer preset to quickly set your work and break durations.' },
  { selector: '#task-input', text: 'Enter what you are working on to track it in your history.' },
  { selector: '#start-pause-btn', text: 'Click to start or pause your focus timer.' },
  { selector: '#focus-rating', text: 'Rate your focus after each session to adapt your timer.' },
  { selector: '.stats-bar', text: 'Your key stats at a glance: streak, time, sessions, and level.' },
  { selector: '.nav', text: 'Navigate between Timer, History, Stats, Tasks, and Settings.' },
];

/**
 * Onboarding step definitions for the first-time tutorial.
 * @type {Array<{title: string, text: string, icon: string}>}
 */
const ONBOARDING_STEPS = [
  { title: 'Set Your Timer', text: 'Choose a timer preset or customize your work duration in Settings.', icon: '\u23F0' },
  { title: 'Start Focusing', text: 'Press Start to begin your focus session. Stay concentrated until the timer ends.', icon: '\u{1F3AF}' },
  { title: 'Rate Your Focus', text: 'After each session, rate how focused you were. This adapts your next interval!', icon: '\u2B50' },
  { title: 'Track Progress', text: 'Check History and Stats to see your focus patterns and achievements.', icon: '\u{1F4CA}' },
  { title: 'Customize', text: 'Explore Settings to personalize themes, sounds, and accessibility options.', icon: '\u2699\uFE0F' },
];

/**
 * Displays the tooltip tour overlay, stepping through each tooltip.
 */
function showTooltipTour() {
  let currentStep = 0;

  function showStep() {
    // Remove previous overlay
    document.querySelectorAll('.tooltip-overlay, .tooltip-highlight').forEach(el => el.remove());

    if (currentStep >= TOOLTIPS.length) {
      localStorage.setItem('pp_tooltipTourDone', 'true');
      return;
    }

    const tip = TOOLTIPS[currentStep];
    const target = document.querySelector(tip.selector);
    if (!target) { currentStep++; showStep(); return; }

    const overlay = document.createElement('div');
    overlay.className = 'tooltip-overlay';
    overlay.innerHTML = `
      <div class="tooltip-card">
        <div class="tooltip-text">${tip.text}</div>
        <div class="tooltip-actions">
          <button class="btn-tooltip-skip">Skip Tour</button>
          <button class="btn-tooltip-next">${currentStep < TOOLTIPS.length - 1 ? 'Next' : 'Done'}</button>
        </div>
        <div class="tooltip-step">${currentStep + 1} / ${TOOLTIPS.length}</div>
      </div>`;

    document.body.appendChild(overlay);

    overlay.querySelector('.btn-tooltip-next').addEventListener('click', () => {
      currentStep++;
      showStep();
    });
    overlay.querySelector('.btn-tooltip-skip').addEventListener('click', () => {
      document.querySelectorAll('.tooltip-overlay').forEach(el => el.remove());
      localStorage.setItem('pp_tooltipTourDone', 'true');
    });
  }

  // Delay slightly for DOM to be ready
  setTimeout(showStep, 500);
}

/**
 * Initializes the tooltip system by adding title attributes to key elements.
 * Triggers the tooltip tour on first visit.
 */
export function initTooltips() {
  // Add title attributes to major elements
  TOOLTIPS.forEach(t => {
    const el = document.querySelector(t.selector);
    if (el) el.setAttribute('title', t.text);
  });

  // Check if first visit
  if (!localStorage.getItem('pp_tooltipTourDone')) {
    showTooltipTour();
  }
}

/**
 * Initializes the onboarding tutorial for first-time users.
 * Shows a multi-step overlay if no sessions exist and onboarding hasn't been completed.
 */
export function initOnboarding() {
  if (state.sessionHistory.length > 0 || localStorage.getItem('pp_onboardingDone')) return;

  let step = 0;

  function showOnboardingStep() {
    document.querySelectorAll('.onboarding-overlay').forEach(el => el.remove());

    if (step >= ONBOARDING_STEPS.length) {
      localStorage.setItem('pp_onboardingDone', 'true');
      return;
    }

    const s = ONBOARDING_STEPS[step];
    const overlay = document.createElement('div');
    overlay.className = 'onboarding-overlay';
    overlay.innerHTML = `
      <div class="onboarding-card">
        <div class="onboarding-icon">${s.icon}</div>
        <div class="onboarding-title">${s.title}</div>
        <div class="onboarding-text">${s.text}</div>
        <div class="onboarding-actions">
          <button class="btn-onboarding-skip">Skip</button>
          <button class="btn-onboarding-next">${step < ONBOARDING_STEPS.length - 1 ? 'Next' : 'Get Started!'}</button>
        </div>
        <div class="onboarding-dots">
          ${ONBOARDING_STEPS.map((_, i) => `<span class="ob-dot ${i === step ? 'active' : ''}"></span>`).join('')}
        </div>
      </div>`;

    document.body.appendChild(overlay);

    overlay.querySelector('.btn-onboarding-next').addEventListener('click', () => {
      step++;
      showOnboardingStep();
    });
    overlay.querySelector('.btn-onboarding-skip').addEventListener('click', () => {
      document.querySelectorAll('.onboarding-overlay').forEach(el => el.remove());
      localStorage.setItem('pp_onboardingDone', 'true');
    });
  }

  setTimeout(showOnboardingStep, 800);
}
