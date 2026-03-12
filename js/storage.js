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
  // Feature settings
  state.countUp            = localStorage.getItem('pp_countUp') === 'true';
  state.sessionTarget      = parseInt(localStorage.getItem('pp_sessionTarget') || '0', 10);
  state.microBreakEnabled  = localStorage.getItem('pp_microBreak') !== 'false';
  state.affirmationsEnabled= localStorage.getItem('pp_affirmations') !== 'false';
  state.xp                 = parseInt(localStorage.getItem('pp_xp') || '0', 10);
  state.level              = Math.floor(state.xp / 250) + 1;
  state.streakShields      = parseInt(localStorage.getItem('pp_shields') || '0', 10);
  state.taskQueue          = JSON.parse(localStorage.getItem('pp_taskQueue') || '[]');
  state.nextTaskId         = parseInt(localStorage.getItem('pp_nextTaskId') || '1', 10);
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

// --- Save task queue ---

export function saveTaskQueue() {
  localStorage.setItem('pp_taskQueue', JSON.stringify(state.taskQueue));
  localStorage.setItem('pp_nextTaskId', state.nextTaskId);
}

// --- Import CSV sessions ---

export function importSessionsCSV(file, showToastFn, callbacks) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const lines = e.target.result.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) { showToastFn('CSV is empty'); return; }
      const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim().toLowerCase());
      const taskIdx = headers.indexOf('task');
      const durIdx  = headers.findIndex(h => h.includes('duration'));
      const ratingIdx = headers.indexOf('rating');
      const dateIdx   = headers.indexOf('date');
      const timeIdx   = headers.indexOf('time');
      if (taskIdx < 0 || durIdx < 0 || ratingIdx < 0) {
        showToastFn('Invalid CSV: missing columns'); return;
      }
      const existingTs = new Set(state.sessionHistory.map(s => s.timestamp));
      let added = 0;
      for (let i = 1; i < lines.length; i++) {
        // Parse CSV row handling quoted fields
        const row = [];
        let cur = '', inQ = false;
        for (const ch of lines[i] + ',') {
          if (ch === '"') { inQ = !inQ; }
          else if (ch === ',' && !inQ) { row.push(cur.trim()); cur = ''; }
          else cur += ch;
        }
        const task = row[taskIdx] || 'Untitled';
        const dur  = parseFloat(row[durIdx]) || 0;
        const rating = row[ratingIdx] || 'Okay';
        const dateStr = dateIdx >= 0 ? row[dateIdx] : '';
        const timeStr = timeIdx >= 0 ? row[timeIdx] : '';
        // Build a timestamp
        let ts;
        try { ts = new Date(`${dateStr} ${timeStr}`).toISOString(); } catch { ts = new Date().toISOString(); }
        if (existingTs.has(ts)) continue;
        existingTs.add(ts);
        state.sessionHistory.push({
          mode: 'Work', task, duration: dur,
          rating: rating.charAt(0).toUpperCase() + rating.slice(1),
          distractions: 0, note: '',
          timestamp: ts,
          displayTime: timeStr,
          date: dateStr || new Date(ts).toDateString(),
        });
        added++;
      }
      // Sort by timestamp desc
      state.sessionHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      saveHistory();
      showToastFn(`Imported ${added} session${added !== 1 ? 's' : ''}`);
      callbacks.forEach(fn => fn());
    } catch (err) {
      showToastFn('Import failed: ' + err.message);
    }
  };
  reader.readAsText(file);
}
