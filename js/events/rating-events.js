/**
 * Rating and mood event listeners.
 * Handles focus rating buttons, reflection prompt observer,
 * mood selection, and complexity star interactions.
 * @module rating-events
 */

import { state } from '../state.js';
import { dom } from '../dom.js';
import { playSound } from '../audio.js';
import { handleRating, showReflectionPrompt } from '../rating.js';
import { hapticFeedback } from '../features/index.js';

/**
 * Registers all rating-related event listeners.
 * Includes focus rating buttons, mutation observer for reflection prompt,
 * mood buttons, and complexity stars.
 */
export function registerRatingEvents() {
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
}
