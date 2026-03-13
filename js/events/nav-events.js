/**
 * Navigation event listeners.
 * Handles navigation button clicks and page switching.
 * @module nav-events
 */

import { dom } from '../dom.js';
import { playSound } from '../audio.js';
import { renderHistory, renderWeeklyChart, renderStats, renderTaskQueue, renderRecurringTasks, renderTaskTemplates } from '../render/index.js';
import { renderWeeklyMissions, renderFocusGarden, renderProgressTimeline } from '../features/index.js';

/**
 * Registers all navigation-related event listeners.
 * Includes nav button clicks, page switching, and page-specific render triggers.
 */
export function registerNavEvents() {
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
}
