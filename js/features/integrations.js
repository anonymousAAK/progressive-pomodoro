/**
 * Integrations module
 * Implements Features #109 (Webhook Support), #112 (API Endpoint via hash routes),
 * #114 (iCal Feed), and #118 (Desktop Notifications with Actions).
 * Provides webhook firing, hash-based API endpoints, iCal export, and enhanced notifications.
 */

import { state } from '../state.js';
import { showToast } from '../render/index.js';
import { getCoins } from './gamification.js';

// ========================================================================
// #109 - Webhook Support
// ========================================================================

/**
 * Gets the configured webhook URL from localStorage.
 * @returns {string} The webhook URL, or empty string if not set
 */
export function getWebhookUrl() {
  return localStorage.getItem('pp_webhookUrl') || '';
}

/**
 * Sets the webhook URL in localStorage.
 * @param {string} url - The webhook URL to save
 */
export function setWebhookUrl(url) {
  localStorage.setItem('pp_webhookUrl', url);
}

/**
 * Fires a webhook POST request with session data if enabled and configured.
 * Uses no-cors mode and silently ignores failures.
 * @param {Object} sessionData - The session data to send
 */
export function fireWebhook(sessionData) {
  const url = getWebhookUrl();
  if (!url) return;
  const webhookEnabled = localStorage.getItem('pp_webhookEnabled') === 'true';
  if (!webhookEnabled) return;

  try {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...sessionData,
        timestamp: new Date().toISOString(),
        source: 'progressive-pomodoro',
      }),
      mode: 'no-cors',
    }).catch(() => {});
  } catch {}
}

// ========================================================================
// #112 - API Endpoint (hash routes)
// ========================================================================

/**
 * Initializes hash-based API endpoints. Listens for #api/sessions and #api/stats
 * hash changes and opens JSON blobs in a new tab.
 */
export function initHashAPI() {
  function handleHash() {
    const hash = window.location.hash;
    if (hash === '#api/sessions') {
      const data = JSON.stringify(state.sessionHistory, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      window.location.hash = '';
    } else if (hash === '#api/stats') {
      const totalMins = state.sessionHistory.reduce((sum, s) => sum + s.duration, 0);
      const stats = {
        totalSessions: state.sessionHistory.length,
        totalMinutes: Math.round(totalMins),
        totalHours: (totalMins / 60).toFixed(1),
        currentStreak: state.streakData.current,
        bestStreak: state.streakData.best,
        level: state.level,
        xp: state.xp,
        coins: getCoins(),
      };
      const data = JSON.stringify(stats, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      window.location.hash = '';
    }
  }

  window.addEventListener('hashchange', handleHash);
  // Check on load
  if (window.location.hash.startsWith('#api/')) {
    setTimeout(handleHash, 500);
  }
}

// ========================================================================
// #114 - iCal Feed
// ========================================================================

/**
 * Generates and downloads an iCal (.ics) file containing all session history.
 */
export function generateICalFile() {
  const sessions = state.sessionHistory;
  if (sessions.length === 0) {
    showToast('No sessions to export');
    return;
  }

  let ical = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Progressive Pomodoro//EN\r\nCALSCALE:GREGORIAN\r\n';

  sessions.forEach((s, i) => {
    try {
      const start = new Date(s.timestamp);
      const end = new Date(start.getTime() + s.duration * 60000);
      const dtStart = start.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      const dtEnd = end.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      const uid = `session-${i}-${start.getTime()}@progressive-pomodoro`;

      ical += `BEGIN:VEVENT\r\n`;
      ical += `UID:${uid}\r\n`;
      ical += `DTSTART:${dtStart}\r\n`;
      ical += `DTEND:${dtEnd}\r\n`;
      ical += `SUMMARY:Focus: ${(s.task || 'Untitled').replace(/[,;\\]/g, '')}\r\n`;
      ical += `DESCRIPTION:Rating: ${s.rating}\\nDuration: ${s.duration}m${s.note ? '\\nNote: ' + s.note.replace(/[,;\\]/g, '') : ''}\r\n`;
      ical += `END:VEVENT\r\n`;
    } catch {}
  });

  ical += 'END:VCALENDAR\r\n';

  const blob = new Blob([ical], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pomodoro-sessions-${new Date().toISOString().slice(0, 10)}.ics`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('iCal file downloaded!');
}

// ========================================================================
// #118 - Desktop Notifications with Actions
// ========================================================================

/**
 * Sends an enhanced desktop notification with action buttons.
 * Falls back to a basic notification if actions are not supported.
 * @param {string} type - Notification type: 'work-end' or 'break-end'
 */
export function sendEnhancedNotification(type) {
  if (!state.notifEnabled) return;
  if (Notification.permission !== 'granted') return;

  let title, body, actions;
  if (type === 'work-end') {
    title = 'Work session complete!';
    body = 'Time to rate your focus and take a break.';
    actions = [
      { action: 'start-break', title: 'Start Break' },
      { action: 'skip-break', title: 'Skip Break' },
    ];
  } else if (type === 'break-end') {
    title = 'Break is over!';
    body = 'Ready for another work session?';
    actions = [
      { action: 'start-work', title: 'Start Work' },
    ];
  }

  try {
    const n = new Notification(title, {
      body,
      icon: '\u{1F345}',
      actions,
      requireInteraction: true,
    });

    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    // Fallback to basic notification
    const n = new Notification(title, { body });
    n.onclick = () => window.focus();
  }
}
