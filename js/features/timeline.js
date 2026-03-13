/**
 * Progress Timeline module
 * Implements Feature #85 — Progress Timeline.
 * Renders a chronological timeline of milestones including first session,
 * level-ups, badge unlocks, streak records, and session milestones.
 */

import { state, ACHIEVEMENTS, calculateXP } from '../state.js';

/**
 * Renders the progress timeline into the DOM element with id 'progress-timeline'.
 * Shows up to 15 milestone events sorted by date (newest first).
 */
export function renderProgressTimeline() {
  const el = document.getElementById('progress-timeline');
  if (!el) return;
  const events = [];

  // First session
  if (state.sessionHistory.length > 0) {
    const first = state.sessionHistory[state.sessionHistory.length - 1];
    events.push({ date: first.timestamp, icon: '\u{1F331}', text: 'First session completed' });
  }

  // Level ups
  let xpAccum = 0;
  const reversedHistory = [...state.sessionHistory].reverse();
  let lastLevel = 0;
  for (const s of reversedHistory) {
    const earned = calculateXP(s.duration, s.rating?.toLowerCase());
    xpAccum += earned;
    const level = Math.floor(xpAccum / 250) + 1;
    if (level > lastLevel && level > 1) {
      events.push({ date: s.timestamp, icon: '\u2B50', text: `Reached Level ${level}` });
    }
    lastLevel = level;
  }

  // Badge unlocks
  ACHIEVEMENTS.forEach(a => {
    if (state.unlockedAchievements.includes(a.id)) {
      events.push({ date: null, icon: a.icon, text: `Unlocked: ${a.name}` });
    }
  });

  // Streak records
  if (state.streakData.best > 0) {
    events.push({ date: null, icon: '\u{1F525}', text: `Best streak: ${state.streakData.best} days` });
  }

  // Session milestones
  [10, 25, 50, 100, 250, 500].forEach(n => {
    if (state.sessionHistory.length >= n) {
      const s = state.sessionHistory[state.sessionHistory.length - n];
      events.push({ date: s?.timestamp || null, icon: '\u{1F3C6}', text: `${n} sessions completed` });
    }
  });

  // Sort by date (newest first), nulls at end
  events.sort((a, b) => {
    if (!a.date && !b.date) return 0;
    if (!a.date) return 1;
    if (!b.date) return -1;
    return new Date(b.date) - new Date(a.date);
  });

  if (events.length === 0) {
    el.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">Complete sessions to build your timeline!</p>';
    return;
  }

  el.innerHTML = events.slice(0, 15).map(e => {
    const dateStr = e.date ? new Date(e.date).toLocaleDateString() : '';
    return `
    <div class="timeline-item">
      <div class="timeline-dot">${e.icon}</div>
      <div class="timeline-content">
        <div class="timeline-text">${e.text}</div>
        ${dateStr ? `<div class="timeline-date">${dateStr}</div>` : ''}
      </div>
    </div>`;
  }).join('');
}
