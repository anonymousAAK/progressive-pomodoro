import { state, ACHIEVEMENTS, DAILY_CHALLENGES, RING_CIRCUMFERENCE, POMODOROS_BEFORE_LONG_BREAK } from './state.js';
import { dom } from './dom.js';

// --- Utilities ---

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// --- Top stats bar ---

export function updateTopStats() {
  const today = new Date().toDateString();
  const todaySessions = state.sessionHistory.filter(s => s.date === today);
  const todayMins = todaySessions.reduce((sum, s) => sum + s.duration, 0);

  dom.streakValue.textContent  = state.streakData.current;
  dom.todayMinutes.textContent = todayMins >= 60
    ? `${(todayMins / 60).toFixed(1)}h`
    : `${Math.round(todayMins)}m`;
  dom.sessionCount.textContent = todaySessions.length;
}

// --- Ring progress ---

export function updateRing(percent) {
  const offset = RING_CIRCUMFERENCE * (1 - percent);
  dom.ringProgress.style.strokeDashoffset = offset;
  dom.ringProgress.classList.toggle('break-mode', state.currentMode !== 'work');
}

// --- Session dots ---

export function renderSessionDots() {
  const TOTAL = POMODOROS_BEFORE_LONG_BREAK;
  dom.sessionDots.innerHTML = '';
  for (let i = 0; i < TOTAL; i++) {
    const dot = document.createElement('div');
    dot.className = 'session-dot';
    if (i < state.completedPomodoros) dot.classList.add('completed');
    if (i === state.completedPomodoros && state.currentMode === 'work') dot.classList.add('active');
    if (i === TOTAL - 1 && state.completedPomodoros >= TOTAL) dot.classList.add('long-break');
    dom.sessionDots.appendChild(dot);
  }
}

// --- History list ---

const RATING_EMOJI = { Distracted: '😵‍💫', Okay: '😐', Focused: '🎯', Flow: '🚀' };
const CATEGORY_ICON = { work: '💼', study: '📚', creative: '🎨', admin: '📋', personal: '🏠', health: '❤️' };

export function renderHistory() {
  if (state.sessionHistory.length === 0) {
    dom.historyList.innerHTML = `
      <div class="history-empty">
        <div class="empty-icon">📋</div>
        <p>No sessions yet. Start your first pomodoro!</p>
      </div>`;
    return;
  }

  dom.historyList.innerHTML = state.sessionHistory.slice(0, 50).map(entry => {
    const ratingClass = entry.rating.toLowerCase();
    const catIcon = CATEGORY_ICON[entry.category] || '⚡';
    return `
    <div class="history-item">
      <div class="h-icon work">${catIcon}</div>
      <div class="h-details">
        <div class="h-task">${escapeHtml(entry.task || 'Untitled')}</div>
        <div class="h-meta">${entry.duration}m · ${entry.displayTime || ''}${entry.distractions ? ` · ${entry.distractions} dist.` : ''}${entry.note ? ` · "${escapeHtml(entry.note)}"` : ''}</div>
      </div>
      <span class="h-rating ${ratingClass}">${entry.rating}</span>
    </div>`;
  }).join('');
}

// --- Weekly bar chart ---

export function renderWeeklyChart() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const weekData = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toDateString();
    const mins = state.sessionHistory
      .filter(s => s.date === dateStr)
      .reduce((sum, s) => sum + s.duration, 0);
    weekData.push({ day: days[d.getDay()], mins: Math.round(mins), isToday: i === 0 });
  }

  const maxMins = Math.max(...weekData.map(d => d.mins), 1);

  dom.weeklyChart.innerHTML = weekData.map(d => {
    const heightPct = (d.mins / maxMins) * 100;
    const todayStyle = d.isToday ? 'background:linear-gradient(180deg,var(--accent-success),rgba(16,185,129,0.4))' : '';
    const todayLabel = d.isToday ? 'color:var(--accent-success);font-weight:700' : '';
    return `
    <div class="chart-bar-wrapper">
      <div class="chart-value">${d.mins > 0 ? d.mins + 'm' : ''}</div>
      <div class="chart-bar-track">
        <div class="chart-bar" style="height:${heightPct}%;${todayStyle}"></div>
      </div>
      <div class="chart-label" style="${todayLabel}">${d.day}</div>
    </div>`;
  }).join('');
}

// --- Stats page ---

export function renderStats() {
  const sessions = state.sessionHistory;
  const totalMins  = sessions.reduce((sum, s) => sum + s.duration, 0);
  const totalHours = totalMins / 60;

  dom.totalFocusTime.textContent    = totalHours >= 1 ? `${totalHours.toFixed(1)}h` : `${Math.round(totalMins)}m`;
  dom.totalSessionsStat.textContent = sessions.length;
  dom.avgDuration.textContent       = sessions.length > 0 ? `${(totalMins / sessions.length).toFixed(1)}m` : '0m';
  dom.bestStreak.textContent        = state.streakData.best;

  // Focus distribution bar
  const counts = { Distracted: 0, Okay: 0, Focused: 0, Flow: 0 };
  sessions.forEach(s => { if (counts[s.rating] !== undefined) counts[s.rating]++; });
  const total = sessions.length || 1;

  dom.focusDistribution.innerHTML = Object.entries(counts).map(([key, val]) => {
    const pct = (val / total) * 100;
    return `<div class="focus-dist-bar ${key.toLowerCase()}" style="width:${pct}%"></div>`;
  }).join('');

  const legendColors = {
    Distracted: 'var(--accent-distracted)', Okay: 'var(--accent-okay)',
    Focused: 'var(--accent-focused)', Flow: 'var(--accent-flow)',
  };
  dom.focusLegend.innerHTML = Object.entries(counts).map(([key, val]) => `
    <div class="focus-legend-item">
      <div class="focus-legend-dot" style="background:${legendColors[key]}"></div>
      ${key} (${val})
    </div>`).join('');

  // Longest sessions
  const longest = [...sessions].sort((a, b) => b.duration - a.duration).slice(0, 5);
  dom.longestSessions.innerHTML = longest.length === 0
    ? '<p style="color:var(--text-muted);font-size:0.85rem;">No data yet</p>'
    : longest.map((s, i) => `
      <div class="history-item">
        <div class="h-icon work" style="font-size:0.75rem;font-weight:700;color:var(--accent-work);">#${i + 1}</div>
        <div class="h-details">
          <div class="h-task">${escapeHtml(s.task || 'Untitled')}</div>
          <div class="h-meta">${s.rating} · ${s.displayTime || ''}</div>
        </div>
        <span style="font-family:'JetBrains Mono',monospace;font-size:0.85rem;font-weight:700;color:var(--accent-work);">${s.duration}m</span>
      </div>`).join('');

  renderHeatmap();
  renderRecords();
  renderAchievements();
  renderDailyChallenge();
}

// --- Calendar heatmap (last 35 days) ---

export function renderHeatmap() {
  if (!dom.heatmapGrid) return;
  const today = new Date();
  const dayData = {};
  state.sessionHistory.forEach(s => { dayData[s.date] = (dayData[s.date] || 0) + s.duration; });
  const maxMins = Math.max(...Object.values(dayData), 1);

  let cells = '';
  for (let i = 34; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toDateString();
    const mins = dayData[dateStr] || 0;
    const intensity = mins > 0 ? Math.max(0.15, mins / maxMins) : 0;
    cells += `<div class="heatmap-cell${i === 0 ? ' today' : ''}" style="--intensity:${intensity.toFixed(2)}" title="${dateStr}: ${Math.round(mins)}m"></div>`;
  }
  dom.heatmapGrid.innerHTML = cells;
}

// --- Personal records ---

export function renderRecords() {
  if (!dom.recordsGrid) return;
  const sessions = state.sessionHistory;
  if (sessions.length === 0) {
    dom.recordsGrid.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">Complete sessions to see records</p>';
    return;
  }

  const longest = [...sessions].sort((a, b) => b.duration - a.duration)[0];

  const dayTotals = {};
  sessions.forEach(s => { dayTotals[s.date] = (dayTotals[s.date] || 0) + s.duration; });
  const bestDay = Object.entries(dayTotals).sort((a, b) => b[1] - a[1])[0];

  const dayCounts = {};
  sessions.forEach(s => { dayCounts[s.date] = (dayCounts[s.date] || 0) + 1; });
  const mostSessions = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];

  dom.recordsGrid.innerHTML = `
    <div class="record-card">
      <div class="record-icon">⏱️</div>
      <div class="record-value">${longest.duration}m</div>
      <div class="record-label">Longest Session</div>
    </div>
    <div class="record-card">
      <div class="record-icon">🔥</div>
      <div class="record-value">${Math.round(bestDay[1])}m</div>
      <div class="record-label">Best Day</div>
    </div>
    <div class="record-card">
      <div class="record-icon">📈</div>
      <div class="record-value">${mostSessions[1]}</div>
      <div class="record-label">Most in a Day</div>
    </div>`;
}

// --- Achievements ---

export function renderAchievements() {
  if (!dom.achievementsGrid) return;
  dom.achievementsGrid.innerHTML = ACHIEVEMENTS.map(a => {
    const unlocked = state.unlockedAchievements.includes(a.id);
    return `
    <div class="badge ${unlocked ? 'unlocked' : 'locked'}">
      <div class="badge-icon">${a.icon}</div>
      <div class="badge-info">
        <div class="badge-name">${a.name}</div>
        <div class="badge-desc">${a.desc}</div>
      </div>
    </div>`;
  }).join('');
}

// --- Daily challenge ---

export function renderDailyChallenge() {
  if (!dom.challengeDesc || !dom.challengeStatus) return;
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const challenge = DAILY_CHALLENGES[dayOfYear % DAILY_CHALLENGES.length];
  dom.challengeDesc.textContent = challenge.desc;
  const done = challenge.check(state.sessionHistory);
  dom.challengeStatus.textContent  = done ? '✓ Complete!' : 'In progress';
  dom.challengeStatus.style.color   = done ? 'var(--accent-success)' : 'var(--text-muted)';
}

// --- Toast ---

export function showToast(msg) {
  dom.saveToast.textContent = msg;
  dom.saveToast.classList.add('show');
  setTimeout(() => dom.saveToast.classList.remove('show'), 2500);
}

// --- Timer display (called by timer.js) ---

export function updateTimerDisplay(secondsLeft, totalSeconds, currentMode, timerInterval) {
  dom.timerDisplay.textContent = formatTime(secondsLeft);
  const percent = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0;
  dom.ringProgress.style.strokeDashoffset = RING_CIRCUMFERENCE * (1 - percent);
  dom.ringProgress.classList.toggle('break-mode', currentMode !== 'work');

  document.title = timerInterval
    ? `${formatTime(secondsLeft)} - ${currentMode === 'work' ? 'Work' : 'Break'} | Progressive Pomodoro`
    : 'Progressive Pomodoro';
}

export function updateNextInfo() {
  if (!dom.timerNextInfo) return;
  dom.timerNextInfo.textContent = state.currentMode === 'work'
    ? `Next: ${Math.round(state.breakDuration / 60)} min break`
    : `Next: ${Math.round(state.workDuration / 60)} min work`;
}

// --- Celebration (confetti) ---

export function showCelebration() {
  dom.celebration.innerHTML = '';
  dom.celebration.classList.add('show');
  const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
  for (let i = 0; i < 40; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.cssText = `left:${Math.random() * 100}%;top:-10px;background:${colors[Math.floor(Math.random() * colors.length)]};animation-delay:${Math.random() * 0.5}s;animation-duration:${1.5 + Math.random()}s`;
    dom.celebration.appendChild(c);
  }
  setTimeout(() => dom.celebration.classList.remove('show'), 2500);
}
