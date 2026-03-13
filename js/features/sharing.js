/**
 * Sharing module
 * Implements Features #86 (Share Daily Summary), #87 (Share Achievements),
 * #88 (Focus Challenge Links), and #92 (Weekly Digest Sharing).
 * Generates PNG share cards and challenge comparison data.
 */

import { state, ACHIEVEMENTS } from '../state.js';
import { showToast } from '../render/index.js';
import { getWeekMondayKey, getWeekSessions } from './missions.js';

/**
 * Creates a canvas element with a styled share card.
 * @param {string} title - The card title
 * @param {Array<{text: string, color?: string}>} lines - Content lines to render
 * @param {string} accentColor - Border accent color
 * @returns {HTMLCanvasElement} The rendered canvas
 */
function createShareCanvas(title, lines, accentColor) {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, 600, 400);

  // Accent border
  ctx.strokeStyle = accentColor || '#6366f1';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, 580, 380);

  // Title
  ctx.fillStyle = '#e8e8ed';
  ctx.font = 'bold 24px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 300, 60);

  // App name
  ctx.fillStyle = '#55556a';
  ctx.font = '14px Inter, sans-serif';
  ctx.fillText('Progressive Pomodoro', 300, 380);

  // Content lines
  ctx.textAlign = 'left';
  ctx.font = '18px Inter, sans-serif';
  lines.forEach((line, i) => {
    ctx.fillStyle = line.color || '#e8e8ed';
    ctx.fillText(line.text, 60, 120 + i * 40);
  });

  return canvas;
}

/**
 * Triggers a PNG download of the given canvas.
 * @param {HTMLCanvasElement} canvas - Canvas to download
 * @param {string} filename - Download filename
 */
function downloadCanvas(canvas, filename) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/**
 * Generates and downloads a PNG summary of today's focus sessions.
 */
export function shareDailySummary() {
  const today = new Date().toDateString();
  const todaySessions = state.sessionHistory.filter(s => s.date === today);
  const totalMins = todaySessions.reduce((sum, s) => sum + s.duration, 0);
  const ratingCounts = {};
  todaySessions.forEach(s => { ratingCounts[s.rating] = (ratingCounts[s.rating] || 0) + 1; });
  const topRating = Object.entries(ratingCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  const lines = [
    { text: `Sessions: ${todaySessions.length}`, color: '#67e8f9' },
    { text: `Focus Time: ${totalMins >= 60 ? (totalMins / 60).toFixed(1) + 'h' : totalMins + 'm'}`, color: '#10b981' },
    { text: `Top Rating: ${topRating}`, color: '#c4b5fd' },
    { text: `Streak: ${state.streakData.current} days`, color: '#f59e0b' },
    { text: `Level: ${state.level}`, color: '#6366f1' },
    { text: `Date: ${new Date().toLocaleDateString()}`, color: '#8b8b9e' },
  ];

  const canvas = createShareCanvas('Daily Focus Summary', lines, '#6366f1');
  downloadCanvas(canvas, `focus-summary-${new Date().toISOString().slice(0, 10)}.png`);
  showToast('Daily summary downloaded!');
}

/**
 * Generates and downloads a PNG card for a specific achievement.
 * @param {string} achievementId - The achievement id to share
 */
export function shareAchievement(achievementId) {
  const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
  if (!achievement) return;

  const lines = [
    { text: `${achievement.icon}  ${achievement.name}`, color: '#fcd34d' },
    { text: achievement.desc, color: '#8b8b9e' },
    { text: '', color: '#0a0a0f' },
    { text: `Total Sessions: ${state.sessionHistory.length}`, color: '#67e8f9' },
    { text: `Level: ${state.level}`, color: '#6366f1' },
    { text: `Streak: ${state.streakData.current} days`, color: '#f59e0b' },
  ];

  const canvas = createShareCanvas('Achievement Unlocked!', lines, '#f59e0b');
  downloadCanvas(canvas, `achievement-${achievementId}.png`);
  showToast('Achievement card downloaded!');
}

/**
 * Generates and downloads a PNG weekly digest summary.
 */
export function shareWeeklyDigest() {
  const weekSessions = getWeekSessions();
  const totalMins = weekSessions.reduce((sum, s) => sum + s.duration, 0);
  const ratingCounts = {};
  weekSessions.forEach(s => { ratingCounts[s.rating] = (ratingCounts[s.rating] || 0) + 1; });
  const topRating = Object.entries(ratingCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  const daysActive = new Set(weekSessions.map(s => s.date)).size;

  const lines = [
    { text: `Sessions: ${weekSessions.length}`, color: '#67e8f9' },
    { text: `Focus Time: ${totalMins >= 60 ? (totalMins / 60).toFixed(1) + 'h' : totalMins + 'm'}`, color: '#10b981' },
    { text: `Days Active: ${daysActive}/7`, color: '#f59e0b' },
    { text: `Top Rating: ${topRating}`, color: '#c4b5fd' },
    { text: `Current Streak: ${state.streakData.current} days`, color: '#f59e0b' },
    { text: `Week of ${getWeekMondayKey()}`, color: '#8b8b9e' },
  ];

  const canvas = createShareCanvas('Weekly Focus Digest', lines, '#10b981');
  downloadCanvas(canvas, `weekly-digest-${getWeekMondayKey()}.png`);
  showToast('Weekly digest downloaded!');
}

/**
 * Generates a base64-encoded challenge string containing today's stats.
 * @returns {string} Base64-encoded JSON string
 */
export function generateChallengeString() {
  const today = new Date().toDateString();
  const todaySessions = state.sessionHistory.filter(s => s.date === today);
  const data = {
    sessions: todaySessions.length,
    minutes: Math.round(todaySessions.reduce((sum, s) => sum + s.duration, 0)),
    streak: state.streakData.current,
    level: state.level,
    totalSessions: state.sessionHistory.length,
    date: new Date().toISOString().slice(0, 10),
  };
  return btoa(JSON.stringify(data));
}

/**
 * Decodes a base64 challenge string back into stats data.
 * @param {string} encoded - Base64-encoded challenge string
 * @returns {Object|null} Decoded stats or null on failure
 */
export function decodeChallengeString(encoded) {
  try {
    return JSON.parse(atob(encoded));
  } catch {
    return null;
  }
}

/**
 * Renders a side-by-side comparison of your stats vs a challenger's stats.
 * @param {Object} theirData - Decoded challenge data from another user
 */
export function renderChallengeComparison(theirData) {
  const el = document.getElementById('challenge-comparison');
  if (!el || !theirData) return;

  const today = new Date().toDateString();
  const myTodaySessions = state.sessionHistory.filter(s => s.date === today);
  const myData = {
    sessions: myTodaySessions.length,
    minutes: Math.round(myTodaySessions.reduce((sum, s) => sum + s.duration, 0)),
    streak: state.streakData.current,
    level: state.level,
    totalSessions: state.sessionHistory.length,
  };

  const metrics = [
    { label: 'Sessions Today', mine: myData.sessions, theirs: theirData.sessions },
    { label: 'Minutes Today', mine: myData.minutes, theirs: theirData.minutes },
    { label: 'Streak', mine: myData.streak, theirs: theirData.streak },
    { label: 'Level', mine: myData.level, theirs: theirData.level },
    { label: 'Total Sessions', mine: myData.totalSessions, theirs: theirData.totalSessions },
  ];

  el.innerHTML = `
    <div class="challenge-compare-header">
      <span>You</span><span>Metric</span><span>Them</span>
    </div>
    ${metrics.map(m => {
      const myWin = m.mine > m.theirs;
      const theirWin = m.theirs > m.mine;
      return `
      <div class="challenge-compare-row">
        <span class="${myWin ? 'compare-win' : ''}">${m.mine}</span>
        <span class="compare-label">${m.label}</span>
        <span class="${theirWin ? 'compare-win' : ''}">${m.theirs}</span>
      </div>`;
    }).join('')}
    <div class="challenge-compare-date">Their data from: ${theirData.date || 'unknown'}</div>`;
}
