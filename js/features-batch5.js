/**
 * Batch 5 Features: Gamification, Social, Accessibility, Data, Technical
 * Features: 77,78,82,83,84,85,86,87,88,92,94,95,97,99,100,101,102,103,104,105,109,112,114,118,119,121
 */

import { state, ACHIEVEMENTS, calculateXP } from './state.js';
import { dom } from './dom.js';
import { showToast } from './render.js';
import { playSound } from './audio.js';
import { i18n } from './i18n.js';

// ========================================================================
// #77 - Weekly Missions
// ========================================================================

const WEEKLY_MISSION_POOL = [
  { id: 'complete_20', desc: 'Complete 20 sessions', target: 20, check: (sessions) => sessions.length },
  { id: 'deep_focus_5', desc: 'Achieve 5 Deep Focus ratings', target: 5, check: (sessions) => sessions.filter(s => s.rating === 'Flow').length },
  { id: 'focus_10h', desc: 'Focus for 10 hours', target: 600, check: (sessions) => sessions.reduce((sum, s) => sum + s.duration, 0), unit: 'min' },
  { id: 'streak_5', desc: 'Maintain a 5-day streak', target: 5, check: (sessions, streakData) => streakData.current },
  { id: 'no_distraction_10', desc: 'Complete 10 distraction-free sessions', target: 10, check: (sessions) => sessions.filter(s => (s.distractions || 0) === 0).length },
  { id: 'focused_5', desc: 'Achieve 5 Focused ratings', target: 5, check: (sessions) => sessions.filter(s => s.rating === 'Focused').length },
  { id: 'sessions_3_days', desc: 'Complete sessions on 5 different days', target: 5, check: (sessions) => new Set(sessions.map(s => s.date)).size },
  { id: 'long_sessions_3', desc: 'Complete 3 sessions over 30 min', target: 3, check: (sessions) => sessions.filter(s => s.duration >= 30).length },
  { id: 'morning_5', desc: 'Complete 5 morning sessions (before noon)', target: 5, check: (sessions) => sessions.filter(s => { try { return new Date(s.timestamp).getHours() < 12; } catch { return false; } }).length },
  { id: 'total_15h', desc: 'Focus for 15 hours total', target: 900, check: (sessions) => sessions.reduce((sum, s) => sum + s.duration, 0), unit: 'min' },
];

function getWeekMondayKey() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

function getWeekSessions() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return state.sessionHistory.filter(s => {
    try { return new Date(s.timestamp) >= monday; } catch { return false; }
  });
}

export function getWeeklyMissions() {
  const weekKey = getWeekMondayKey();
  const savedKey = localStorage.getItem('pp_missions_week');
  let missionIds = JSON.parse(localStorage.getItem('pp_missions') || '[]');
  if (savedKey !== weekKey || missionIds.length === 0) {
    // Select 5 random missions
    const shuffled = [...WEEKLY_MISSION_POOL].sort(() => Math.random() - 0.5);
    missionIds = shuffled.slice(0, 5).map(m => m.id);
    localStorage.setItem('pp_missions', JSON.stringify(missionIds));
    localStorage.setItem('pp_missions_week', weekKey);
  }
  return missionIds.map(id => WEEKLY_MISSION_POOL.find(m => m.id === id)).filter(Boolean);
}

export function renderWeeklyMissions() {
  const el = document.getElementById('missions-grid');
  if (!el) return;
  const missions = getWeeklyMissions();
  const weekSessions = getWeekSessions();
  el.innerHTML = missions.map(m => {
    const progress = m.check(weekSessions, state.streakData);
    const pct = Math.min(100, (progress / m.target) * 100);
    const done = progress >= m.target;
    return `
    <div class="mission-item ${done ? 'mission-done' : ''}">
      <div class="mission-desc">${done ? '&#10003; ' : ''}${m.desc}</div>
      <div class="mission-bar-track">
        <div class="mission-bar-fill" style="width:${pct}%"></div>
      </div>
      <div class="mission-progress">${m.unit === 'min' ? Math.round(progress) + 'm' : progress} / ${m.unit === 'min' ? m.target + 'm' : m.target}</div>
    </div>`;
  }).join('');
}

// ========================================================================
// #78 - Focus Garden
// ========================================================================

function getGardenEmoji(rating) {
  switch (rating) {
    case 'Distracted': return '\u{1F331}'; // seedling
    case 'Okay': return '\u{1F33F}'; // herb
    case 'Focused': return '\u{1F338}'; // cherry blossom
    case 'Flow': return '\u{1F333}'; // deciduous tree
    default: return '\u{1F331}';
  }
}

export function renderFocusGarden() {
  const el = document.getElementById('focus-garden-grid');
  if (!el) return;
  const recent = state.sessionHistory.slice(0, 50);
  if (recent.length === 0) {
    el.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">Complete sessions to grow your garden!</p>';
    return;
  }
  el.innerHTML = recent.map(s =>
    `<span class="garden-cell" title="${s.task || 'Session'} - ${s.rating}">${getGardenEmoji(s.rating)}</span>`
  ).join('');
}

// ========================================================================
// #82 - Session Multiplier
// ========================================================================

export function getSessionMultiplier() {
  let streak = 0;
  for (const s of state.sessionHistory) {
    if (s.rating === 'Focused' || s.rating === 'Flow') {
      streak++;
    } else {
      break;
    }
  }
  return Math.max(1, streak);
}

export function renderMultiplierBadge() {
  const el = document.getElementById('multiplier-badge');
  if (!el) return;
  const mult = getSessionMultiplier();
  if (mult > 1) {
    el.textContent = `\u00D7${mult}`;
    el.classList.remove('hidden');
  } else {
    el.classList.add('hidden');
  }
}

// ========================================================================
// #83 - Unlockable Themes
// ========================================================================

export const UNLOCKABLE_THEMES = [
  {
    id: 'midnight',
    name: 'Midnight',
    desc: 'Unlocked at Level 5',
    check: () => state.level >= 5,
  },
  {
    id: 'neon',
    name: 'Neon',
    desc: 'Unlocked at 50 sessions',
    check: () => state.sessionHistory.length >= 50,
  },
  {
    id: 'gold',
    name: 'Gold',
    desc: 'Unlocked at 100-day streak',
    check: () => state.streakData.best >= 100,
  },
];

export function renderUnlockableThemes() {
  const container = document.getElementById('unlockable-themes');
  if (!container) return;
  container.innerHTML = UNLOCKABLE_THEMES.map(t => {
    const unlocked = t.check();
    return `
    <button class="theme-unlock-btn ${unlocked ? 'unlocked' : 'locked'}" data-unlock-theme="${t.id}" ${!unlocked ? 'disabled' : ''}>
      ${unlocked ? '' : '<span class="lock-icon">&#128274;</span>'}
      ${t.name}
      <span class="theme-unlock-desc">${t.desc}</span>
    </button>`;
  }).join('');
}

export function applyUnlockableTheme(themeId) {
  const theme = UNLOCKABLE_THEMES.find(t => t.id === themeId);
  if (!theme || !theme.check()) return;
  document.documentElement.classList.remove('theme-midnight', 'theme-neon', 'theme-gold');
  document.documentElement.classList.add(`theme-${themeId}`);
  localStorage.setItem('pp_unlockTheme', themeId);
  document.querySelectorAll('.theme-unlock-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.unlockTheme === themeId);
  });
}

export function loadUnlockableTheme() {
  const saved = localStorage.getItem('pp_unlockTheme');
  if (saved) {
    const theme = UNLOCKABLE_THEMES.find(t => t.id === saved);
    if (theme && theme.check()) {
      document.documentElement.classList.add(`theme-${saved}`);
    }
  }
}

// ========================================================================
// #84 - Focus Coins
// ========================================================================

export function calculateCoins(durationMin, rating) {
  const ratingMultiplier = { Distracted: 0.5, Okay: 1, Focused: 1.5, Flow: 2 }[rating] || 1;
  const multiplier = getSessionMultiplier();
  return Math.round(10 * ratingMultiplier * Math.min(multiplier, 5));
}

export function getCoins() {
  return parseInt(localStorage.getItem('pp_coins') || '0', 10);
}

export function addCoins(amount) {
  const current = getCoins();
  localStorage.setItem('pp_coins', current + amount);
}

export function renderCoinBalance() {
  const el = document.getElementById('coin-value');
  if (!el) return;
  el.textContent = getCoins();
}

// ========================================================================
// #85 - Progress Timeline
// ========================================================================

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

// ========================================================================
// #86 - Share Daily Summary (PNG)
// ========================================================================

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

function downloadCanvas(canvas, filename) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

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

// ========================================================================
// #87 - Share Achievements
// ========================================================================

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

// ========================================================================
// #88 - Focus Challenge Links
// ========================================================================

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

export function decodeChallengeString(encoded) {
  try {
    return JSON.parse(atob(encoded));
  } catch {
    return null;
  }
}

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

// ========================================================================
// #92 - Weekly Digest Sharing
// ========================================================================

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

// ========================================================================
// #94 - Screen Reader Support
// ========================================================================

export function initScreenReaderSupport() {
  // Add aria-live region for timer announcements
  let liveRegion = document.getElementById('aria-live-region');
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'aria-live-region';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
  }

  // Add roles to semantic sections
  document.querySelector('.app-header')?.setAttribute('role', 'banner');
  document.querySelector('.nav')?.setAttribute('role', 'navigation');
  document.querySelector('main')?.setAttribute('role', 'main');
  document.querySelector('.stats-bar')?.setAttribute('role', 'status');

  // Add aria-labels to interactive elements
  dom.startPauseBtn?.setAttribute('aria-label', 'Start or pause timer');
  dom.stopBtn?.setAttribute('aria-label', 'Reset timer');
  dom.skipBtn?.setAttribute('aria-label', 'Skip current phase');
  dom.skipBreakBtn?.setAttribute('aria-label', 'Skip break and start work');
  dom.taskInput?.setAttribute('aria-label', 'Task name input');
  dom.themeToggleBtn?.setAttribute('aria-label', 'Toggle light or dark theme');
  dom.focusModeBtn?.setAttribute('aria-label', 'Toggle distraction-free mode');

  // Nav buttons
  dom.navBtns.forEach(btn => {
    btn.setAttribute('aria-label', `Navigate to ${btn.textContent.trim()}`);
  });

  // Preset buttons
  dom.presetBtns.forEach(btn => {
    btn.setAttribute('aria-label', `Timer preset: ${btn.textContent.trim()}`);
  });

  // Category chips
  dom.categoryChips.forEach(chip => {
    chip.setAttribute('aria-label', `Category: ${chip.textContent.trim()}`);
  });

  // Rating buttons
  document.querySelectorAll('.focus-btn').forEach(btn => {
    const rating = btn.dataset.rating;
    btn.setAttribute('aria-label', `Rate focus as ${rating}`);
  });

  // Settings toggles
  document.querySelectorAll('.toggle-switch input').forEach(input => {
    const label = input.closest('.setting-row')?.querySelector('.setting-label');
    if (label) input.setAttribute('aria-label', label.textContent);
  });
}

export function announceToScreenReader(message) {
  const el = document.getElementById('aria-live-region');
  if (el) {
    el.textContent = '';
    setTimeout(() => { el.textContent = message; }, 100);
  }
}

// ========================================================================
// #95 - High Contrast Mode
// ========================================================================

export function applyHighContrast(enabled) {
  document.documentElement.classList.toggle('high-contrast', enabled);
  localStorage.setItem('pp_highContrast', enabled);
}

export function loadHighContrast() {
  const saved = localStorage.getItem('pp_highContrast') === 'true';
  if (saved) applyHighContrast(true);
  return saved;
}

// ========================================================================
// #99 - Colorblind-Friendly Palettes
// ========================================================================

export function applyColorblindPalette(palette) {
  document.documentElement.classList.remove('cb-deuteranopia', 'cb-protanopia', 'cb-tritanopia');
  if (palette && palette !== 'none') {
    document.documentElement.classList.add(`cb-${palette}`);
  }
  localStorage.setItem('pp_colorblind', palette || 'none');
}

export function loadColorblindPalette() {
  const saved = localStorage.getItem('pp_colorblind') || 'none';
  if (saved !== 'none') applyColorblindPalette(saved);
  return saved;
}

// ========================================================================
// #100 - Voice Control
// ========================================================================

let recognition = null;
let voiceActive = false;

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
export function setTimerFunctions(fns) { _timerFns = fns; }
function getTimerFunctions() { return _timerFns; }

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

// ========================================================================
// #101 - Haptic Feedback
// ========================================================================

let hapticEnabled = false;

export function initHaptic() {
  hapticEnabled = localStorage.getItem('pp_haptic') === 'true';
  return hapticEnabled;
}

export function setHapticEnabled(enabled) {
  hapticEnabled = enabled;
  localStorage.setItem('pp_haptic', enabled);
}

export function hapticFeedback(type) {
  if (!hapticEnabled || !navigator.vibrate) return;
  switch (type) {
    case 'click': navigator.vibrate(30); break;
    case 'timer-end': navigator.vibrate([200, 100, 200, 100, 200]); break;
    case 'success': navigator.vibrate([50, 50, 100]); break;
    default: navigator.vibrate(30);
  }
}

// ========================================================================
// #102 - Tooltip Help System
// ========================================================================

const TOOLTIPS = [
  { selector: '#presets-row', text: 'Choose a timer preset to quickly set your work and break durations.' },
  { selector: '#task-input', text: 'Enter what you are working on to track it in your history.' },
  { selector: '#start-pause-btn', text: 'Click to start or pause your focus timer.' },
  { selector: '#focus-rating', text: 'Rate your focus after each session to adapt your timer.' },
  { selector: '.stats-bar', text: 'Your key stats at a glance: streak, time, sessions, and level.' },
  { selector: '.nav', text: 'Navigate between Timer, History, Stats, Tasks, and Settings.' },
];

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

// ========================================================================
// #103 - Onboarding Tutorial
// ========================================================================

const ONBOARDING_STEPS = [
  { title: 'Set Your Timer', text: 'Choose a timer preset or customize your work duration in Settings.', icon: '\u23F0' },
  { title: 'Start Focusing', text: 'Press Start to begin your focus session. Stay concentrated until the timer ends.', icon: '\u{1F3AF}' },
  { title: 'Rate Your Focus', text: 'After each session, rate how focused you were. This adapts your next interval!', icon: '\u2B50' },
  { title: 'Track Progress', text: 'Check History and Stats to see your focus patterns and achievements.', icon: '\u{1F4CA}' },
  { title: 'Customize', text: 'Explore Settings to personalize themes, sounds, and accessibility options.', icon: '\u2699\uFE0F' },
];

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

// ========================================================================
// #109 - Webhook Support
// ========================================================================

export function getWebhookUrl() {
  return localStorage.getItem('pp_webhookUrl') || '';
}

export function setWebhookUrl(url) {
  localStorage.setItem('pp_webhookUrl', url);
}

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

// ========================================================================
// #119 - Widget Mode
// ========================================================================

let widgetActive = false;
let widgetEl = null;
let widgetDragState = { dragging: false, offsetX: 0, offsetY: 0 };

export function toggleWidgetMode() {
  widgetActive = !widgetActive;

  if (widgetActive) {
    createWidget();
  } else {
    destroyWidget();
  }
  return widgetActive;
}

function createWidget() {
  if (widgetEl) return;
  widgetEl = document.createElement('div');
  widgetEl.id = 'focus-widget';
  widgetEl.className = 'focus-widget';
  widgetEl.innerHTML = `
    <svg class="widget-ring" viewBox="0 0 100 100">
      <circle class="widget-ring-bg" cx="50" cy="50" r="42"/>
      <circle class="widget-ring-progress" cx="50" cy="50" r="42" id="widget-ring-progress"
        stroke-dasharray="263.89" stroke-dashoffset="263.89"/>
    </svg>
    <div class="widget-time" id="widget-time">00:00</div>
    <button class="widget-close" id="widget-close" title="Close widget">&times;</button>
  `;

  document.body.appendChild(widgetEl);

  // Drag support
  widgetEl.addEventListener('mousedown', onWidgetMouseDown);
  widgetEl.addEventListener('touchstart', onWidgetTouchStart, { passive: false });
  document.getElementById('widget-close').addEventListener('click', (e) => {
    e.stopPropagation();
    toggleWidgetMode();
  });

  updateWidget();
}

function destroyWidget() {
  if (widgetEl) {
    widgetEl.remove();
    widgetEl = null;
  }
}

function onWidgetMouseDown(e) {
  if (e.target.id === 'widget-close') return;
  widgetDragState.dragging = true;
  widgetDragState.offsetX = e.clientX - widgetEl.getBoundingClientRect().left;
  widgetDragState.offsetY = e.clientY - widgetEl.getBoundingClientRect().top;

  function onMove(e) {
    if (!widgetDragState.dragging) return;
    widgetEl.style.left = (e.clientX - widgetDragState.offsetX) + 'px';
    widgetEl.style.top = (e.clientY - widgetDragState.offsetY) + 'px';
    widgetEl.style.right = 'auto';
    widgetEl.style.bottom = 'auto';
  }
  function onUp() {
    widgetDragState.dragging = false;
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  }
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

function onWidgetTouchStart(e) {
  if (e.target.id === 'widget-close') return;
  const touch = e.touches[0];
  widgetDragState.dragging = true;
  widgetDragState.offsetX = touch.clientX - widgetEl.getBoundingClientRect().left;
  widgetDragState.offsetY = touch.clientY - widgetEl.getBoundingClientRect().top;

  function onMove(e) {
    if (!widgetDragState.dragging) return;
    e.preventDefault();
    const t = e.touches[0];
    widgetEl.style.left = (t.clientX - widgetDragState.offsetX) + 'px';
    widgetEl.style.top = (t.clientY - widgetDragState.offsetY) + 'px';
    widgetEl.style.right = 'auto';
    widgetEl.style.bottom = 'auto';
  }
  function onUp() {
    widgetDragState.dragging = false;
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onUp);
  }
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('touchend', onUp);
}

export function updateWidget() {
  if (!widgetEl) return;
  const timeEl = document.getElementById('widget-time');
  const ringEl = document.getElementById('widget-ring-progress');
  if (!timeEl || !ringEl) return;

  const m = Math.floor(state.secondsLeft / 60);
  const s = state.secondsLeft % 60;
  timeEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  const circumference = 2 * Math.PI * 42;
  const elapsed = state.totalSeconds > 0 ? (state.totalSeconds - state.secondsLeft) / state.totalSeconds : 0;
  ringEl.style.strokeDashoffset = circumference * (1 - elapsed);
  ringEl.style.stroke = state.currentMode === 'work' ? 'var(--accent-work)' : 'var(--accent-break)';
}

// ========================================================================
// #121 - Performance Mode
// ========================================================================

export function applyPerformanceMode(enabled) {
  const app = document.getElementById('app');
  if (!app) return;
  app.classList.toggle('performance-mode', enabled);
  document.documentElement.classList.toggle('performance-mode', enabled);
  localStorage.setItem('pp_performanceMode', enabled);
}

export function loadPerformanceMode() {
  const saved = localStorage.getItem('pp_performanceMode') === 'true';
  if (saved) applyPerformanceMode(true);
  return saved;
}

// ========================================================================
// Master init for all batch 5 features
// ========================================================================

export function initBatch5Features() {
  // #94 Screen reader
  initScreenReaderSupport();

  // #95 High contrast
  loadHighContrast();

  // #99 Colorblind
  loadColorblindPalette();

  // #101 Haptic
  initHaptic();

  // #102 Tooltips
  initTooltips();

  // #103 Onboarding
  initOnboarding();

  // #104 i18n
  i18n.loadLang();

  // #83 Unlockable themes
  loadUnlockableTheme();

  // #112 Hash API
  initHashAPI();

  // #121 Performance mode
  loadPerformanceMode();
}
