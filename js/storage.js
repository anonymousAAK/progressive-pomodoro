import { state } from './state.js';

// --- Persistence helpers ---

export function loadSettings() {
  state.workDuration     = parseInt(localStorage.getItem('pp_work')      || '5',  10) * 60;
  state.intervalAdjust   = parseInt(localStorage.getItem('pp_adjust')    || '2',  10) * 60;
  state.breakDuration    = parseInt(localStorage.getItem('pp_break')     || '5',  10) * 60;
  state.longBreakDuration= parseInt(localStorage.getItem('pp_longBreak') || '15', 10) * 60;
  state.soundEnabled     = localStorage.getItem('pp_sound')    !== 'false';
  state.notifEnabled     = localStorage.getItem('pp_notif')    === 'true';
  state.autoBreak        = localStorage.getItem('pp_autoBreak') !== 'false';
  state.autoWork         = localStorage.getItem('pp_autoWork')  === 'true';
  state.currentTheme     = localStorage.getItem('pp_theme')    || 'dark';
  state.currentAccent    = localStorage.getItem('pp_accent')   || 'indigo';
  state.currentFontSize  = parseFloat(localStorage.getItem('pp_fontSize') || '1');
  state.animationsEnabled   = localStorage.getItem('pp_animations')   !== 'false';
  state.reducedMotionEnabled= localStorage.getItem('pp_reducedMotion') === 'true';
  state.currentAmbient   = localStorage.getItem('pp_ambient')  || 'none';
  state.unlockedAchievements = JSON.parse(localStorage.getItem('pp_achievements') || '[]');
}

export function saveSettings() {
  localStorage.setItem('pp_work',         state.workDuration / 60);
  localStorage.setItem('pp_adjust',       state.intervalAdjust / 60);
  localStorage.setItem('pp_break',        state.breakDuration / 60);
  localStorage.setItem('pp_longBreak',    state.longBreakDuration / 60);
  localStorage.setItem('pp_sound',        state.soundEnabled);
  localStorage.setItem('pp_notif',        state.notifEnabled);
  localStorage.setItem('pp_autoBreak',    state.autoBreak);
  localStorage.setItem('pp_autoWork',     state.autoWork);
  localStorage.setItem('pp_theme',        state.currentTheme);
  localStorage.setItem('pp_accent',       state.currentAccent);
  localStorage.setItem('pp_fontSize',     state.currentFontSize);
  localStorage.setItem('pp_animations',   state.animationsEnabled);
  localStorage.setItem('pp_reducedMotion',state.reducedMotionEnabled);
  localStorage.setItem('pp_ambient',      state.currentAmbient);
}

export function loadHistory() {
  state.sessionHistory = JSON.parse(localStorage.getItem('pp_history') || '[]');
}

export function saveHistory() {
  localStorage.setItem('pp_history', JSON.stringify(state.sessionHistory));
}

export function loadStreak() {
  state.streakData = JSON.parse(localStorage.getItem('pp_streak') || '{"current":0,"best":0,"lastDate":null}');
}

export function saveStreak() {
  localStorage.setItem('pp_streak', JSON.stringify(state.streakData));
}

export function loadAchievements() {
  state.unlockedAchievements = JSON.parse(localStorage.getItem('pp_achievements') || '[]');
}

export function saveAchievements() {
  localStorage.setItem('pp_achievements', JSON.stringify(state.unlockedAchievements));
}

// --- Full backup / restore ---

export function backupData() {
  const keys = [
    'pp_work', 'pp_adjust', 'pp_break', 'pp_longBreak',
    'pp_sound', 'pp_notif', 'pp_autoBreak', 'pp_autoWork',
    'pp_history', 'pp_streak', 'pp_achievements',
    'pp_theme', 'pp_accent', 'pp_fontSize', 'pp_animations',
    'pp_reducedMotion', 'pp_ambient',
  ];
  const data = {};
  keys.forEach(k => { const v = localStorage.getItem(k); if (v !== null) data[k] = v; });
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pomodoro-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function restoreData(file, showToastFn) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (!confirm('Restore from backup? Current data will be overwritten.')) return;
      Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, v));
      location.reload();
    } catch {
      showToastFn('Invalid backup file');
    }
  };
  reader.readAsText(file);
}

// --- CSV export ---

export function exportHistoryCSV() {
  if (state.sessionHistory.length === 0) return;
  const csv = 'Task,Category,Duration (min),Rating,Distractions,Note,Date,Time\n' +
    state.sessionHistory.map(s =>
      `"${(s.task || 'Untitled').replace(/"/g, '""')}",` +
      `"${(s.category || '').replace(/"/g, '""')}",` +
      `${s.duration},${s.rating},${s.distractions || 0},` +
      `"${(s.note || '').replace(/"/g, '""')}",` +
      `${s.date || ''},${s.displayTime || ''}`
    ).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pomodoro-history-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// --- Clear history ---

export function clearHistory(callbacks) {
  if (!confirm('Clear all session history? This cannot be undone.')) return;
  state.sessionHistory = [];
  saveHistory();
  callbacks.forEach(fn => fn());
}
