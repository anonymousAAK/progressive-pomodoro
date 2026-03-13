/**
 * Profile management event listeners.
 * Handles profile selection, creation, and deletion.
 * @module profile-events
 */

import { state } from '../state.js';
import { dom } from '../dom.js';
import { switchProfile, createProfile, deleteProfile } from '../storage.js';
import { renderHistory, renderWeeklyChart, renderStats, updateTopStats, showToast, renderTaskQueue, renderRecurringTasks, renderTaskTemplates, renderLeaderboard, populateProfileSelect } from '../render/index.js';

/**
 * Registers all profile-related event listeners.
 * Includes profile select dropdown, create profile button,
 * and delete profile button. Also populates the profile select on init.
 */
export function registerProfileEvents() {
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
}
