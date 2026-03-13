/**
 * Event registration barrel file.
 * Imports all event registration modules and exports a single
 * registerAllEvents() function that initializes all event listeners.
 * @module events/index
 */

import { registerTimerEvents } from './timer-events.js';
import { registerRatingEvents } from './rating-events.js';
import { registerNavEvents } from './nav-events.js';
import { registerSettingsEvents } from './settings-events.js';
import { registerTaskEvents } from './task-events.js';
import { registerKeyboardEvents } from './keyboard-events.js';
import { registerBatch5Events } from './batch5-events.js';
import { registerProfileEvents } from './profile-events.js';

/**
 * Registers all event listeners for the application.
 * Delegates to individual module registration functions.
 */
export function registerAllEvents() {
  registerTimerEvents();
  registerRatingEvents();
  registerNavEvents();
  registerSettingsEvents();
  registerTaskEvents();
  registerKeyboardEvents();
  registerBatch5Events();
  registerProfileEvents();
}
