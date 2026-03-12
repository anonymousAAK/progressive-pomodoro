import { state, ACHIEVEMENTS, DAILY_CHALLENGES, RING_CIRCUMFERENCE, POMODOROS_BEFORE_LONG_BREAK, AFFIRMATIONS } from './state.js';
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

  // Streak with shield count
  const shieldStr = state.streakShields > 0 ? ` 🛡️${state.streakShields}` : '';
  dom.streakValue.textContent  = state.streakData.current + shieldStr;
  dom.todayMinutes.textContent = todayMins >= 60
    ? `${(todayMins / 60).toFixed(1)}h`
    : `${Math.round(todayMins)}m`;
  dom.sessionCount.textContent = todaySessions.length;
  if (dom.xpValue) dom.xpValue.textContent = 'Lv.' + state.level;
  renderSessionTarget();
  renderFocusScore();
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
  renderWeeklySummary();
  renderHourlyChart();
  renderDurationDistribution();
  renderRatingTrend();
  renderDayOfWeekChart();
  renderTaskHistory();
  renderFocusScore();
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
        ${unlocked ? `<button class="badge-share-btn" data-ach-id="${a.id}" aria-label="Share ${a.name} achievement">Share</button>` : ''}
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

// --- Task queue ---

export function renderTaskQueue() {
  const list = document.getElementById('task-queue-list');
  const progress = document.getElementById('task-progress');
  if (!list) return;
  if (state.taskQueue.length === 0) {
    list.innerHTML = '<div class="tasks-empty">No tasks yet. Add one above!</div>';
    if (progress) progress.textContent = '';
    return;
  }
  const done = state.taskQueue.filter(t => t.done).length;
  if (progress) progress.textContent = `Completed: ${done}/${state.taskQueue.length}`;
  list.innerHTML = state.taskQueue.map(task => `
    <div class="task-item${task.done ? ' done' : ''}" data-id="${task.id}">
      <div class="task-item-check${task.done ? ' checked' : ''}">${task.done ? '✓' : ''}</div>
      <div class="priority-dot ${task.priority}"></div>
      <div class="task-item-name${task.done ? ' done-text' : ''}">${escapeHtml(task.name)}</div>
      <button class="btn-focus-task" title="Focus on this task">▶ Focus</button>
      <button class="btn-delete-task" title="Delete" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:0.9rem;padding:4px;">✕</button>
    </div>`).join('');
}

// --- Toast ---

export function showToast(msg) {
  dom.saveToast.textContent = msg;
  dom.saveToast.classList.add('show');
  setTimeout(() => dom.saveToast.classList.remove('show'), 2500);
}

// --- Timer display (called by timer.js) ---

export function updateTimerDisplay(secondsLeft, totalSeconds, currentMode, timerInterval) {
  // secondsLeft may be "elapsed" if countUp mode is active (passed adjusted from timer.js)
  dom.timerDisplay.textContent = formatTime(secondsLeft);
  // Ring always uses actual remaining seconds (caller passes correct value for display,
  // but ring percent is based on elapsed regardless of count-up mode)
  const elapsed = state.countUp ? secondsLeft : (totalSeconds - secondsLeft);
  const percent = totalSeconds > 0 ? elapsed / totalSeconds : 0;
  dom.ringProgress.style.strokeDashoffset = RING_CIRCUMFERENCE * (1 - percent);
  dom.ringProgress.classList.toggle('break-mode', currentMode !== 'work');

  const displayForTitle = state.countUp ? secondsLeft : secondsLeft;
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

// --- Milestone celebration ---

export function showMilestoneCelebration(n) {
  dom.celebration.innerHTML = '';
  dom.celebration.classList.add('show');
  const colors = ['#f59e0b', '#fbbf24', '#fcd34d', '#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#06b6d4'];
  for (let i = 0; i < 80; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.cssText = `left:${Math.random() * 100}%;top:-10px;background:${colors[Math.floor(Math.random() * colors.length)]};animation-delay:${Math.random() * 0.8}s;animation-duration:${1.5 + Math.random() * 1.5}s`;
    dom.celebration.appendChild(c);
  }
  // Overlay message
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(10,10,15,0.92);border:2px solid #f59e0b;border-radius:16px;padding:24px 32px;font-size:1.4rem;font-weight:700;color:#fcd34d;text-align:center;z-index:200;';
  overlay.textContent = `🎉 Session #${n}!`;
  document.body.appendChild(overlay);
  setTimeout(() => { dom.celebration.classList.remove('show'); overlay.remove(); }, 3500);
}

// --- Affirmation overlay ---

export function showAffirmation() {
  if (!dom.affirmationOverlay) return;
  dom.affirmationOverlay.textContent = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
  dom.affirmationOverlay.classList.add('show');
  setTimeout(() => dom.affirmationOverlay.classList.remove('show'), 2500);
}

// --- Session target ---

export function renderSessionTarget() {
  if (!dom.sessionTargetRow) return;
  if (!state.sessionTarget || state.sessionTarget <= 0) {
    dom.sessionTargetRow.classList.add('hidden');
    return;
  }
  const today = new Date().toDateString();
  const count = state.sessionHistory.filter(s => s.date === today).length;
  dom.sessionTargetRow.classList.remove('hidden');
  if (dom.sessionTargetText) dom.sessionTargetText.textContent = `${count} / ${state.sessionTarget} today`;
  if (dom.targetBarFill) {
    const pct = Math.min(100, (count / state.sessionTarget) * 100);
    dom.targetBarFill.style.width = pct + '%';
  }
}

// --- Focus score ---

export function renderFocusScore() {
  const banner = document.getElementById('focus-score-banner');
  const valueEl = document.getElementById('focus-score-value');
  if (!banner || !valueEl) return;
  const today = new Date().toDateString();
  const todaySessions = state.sessionHistory.filter(s => s.date === today);
  if (todaySessions.length === 0) { valueEl.textContent = '—'; return; }
  const ratingScore = { Distracted: 0, Okay: 33, Focused: 66, Flow: 100 };
  const avg = todaySessions.reduce((sum, s) => sum + (ratingScore[s.rating] || 0), 0) / todaySessions.length;
  const factor = Math.min(1, todaySessions.length / 4);
  const score = Math.round(avg * (0.7 + 0.3 * factor));
  valueEl.textContent = score;
}

// --- Focus trend alert ---

export function checkFocusTrend() {
  const last3 = state.sessionHistory.slice(0, 3);
  if (last3.length < 3) return;
  const allLow = last3.every(s => s.rating === 'Distracted' || s.rating === 'Okay');
  if (allLow) {
    setTimeout(() => showToast('⚠️ Focus has been low lately — consider a break or change of environment'), 600);
  }
}

// --- Weekly summary ---

export function renderWeeklySummary() {
  const el = document.getElementById('weekly-summary-text');
  if (!el) return;
  const today = new Date();
  const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 6);
  const weekSessions = state.sessionHistory.filter(s => {
    try { return new Date(s.timestamp) >= weekAgo; } catch { return false; }
  });
  if (weekSessions.length === 0) { el.textContent = 'No sessions this week yet.'; return; }
  const totalMins = weekSessions.reduce((sum, s) => sum + s.duration, 0);
  const hours = (totalMins / 60).toFixed(1);
  // Best day
  const dayCounts = {};
  weekSessions.forEach(s => { dayCounts[s.date] = (dayCounts[s.date] || 0) + 1; });
  const bestDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
  const bestDayName = new Date(bestDay[0]).toLocaleDateString('en-US', { weekday: 'long' });
  // Most common rating
  const ratingCounts = {};
  weekSessions.forEach(s => { ratingCounts[s.rating] = (ratingCounts[s.rating] || 0) + 1; });
  const topRating = Object.entries(ratingCounts).sort((a, b) => b[1] - a[1])[0][0];
  const streakLine = state.streakData.current > 1 ? ` You're on a ${state.streakData.current}-day streak!` : '';
  el.textContent = `This week: ${weekSessions.length} session${weekSessions.length !== 1 ? 's' : ''}, ${hours}h focus time. Best day: ${bestDayName} with ${bestDay[1]} session${bestDay[1] !== 1 ? 's' : ''}. Most common rating: ${topRating}.${streakLine}`;
}

// --- Hourly chart ---

export function renderHourlyChart() {
  if (!dom.hourlyChart) return;
  const hourMins = new Array(24).fill(0);
  state.sessionHistory.forEach(s => {
    try {
      const h = new Date(s.timestamp).getHours();
      hourMins[h] += s.duration;
    } catch {}
  });
  const displayHours = [];
  for (let h = 6; h <= 23; h++) displayHours.push(h);
  const maxMins = Math.max(...displayHours.map(h => hourMins[h]), 1);
  dom.hourlyChart.innerHTML = displayHours.map(h => {
    const mins = hourMins[h];
    const heightPct = (mins / maxMins) * 100;
    const label = h === 12 ? '12p' : h > 12 ? `${h - 12}p` : `${h}a`;
    return `
    <div class="hourly-bar-wrapper">
      <div class="hourly-bar-track">
        <div class="hourly-bar" style="height:${heightPct}%"></div>
      </div>
      <div class="hourly-label">${label}</div>
    </div>`;
  }).join('');
}

// --- Duration distribution ---

export function renderDurationDistribution() {
  const el = document.getElementById('duration-dist');
  if (!el) return;
  const buckets = [
    { label: '<10m',   min: 0,  max: 10  },
    { label: '10-20m', min: 10, max: 20  },
    { label: '20-30m', min: 20, max: 30  },
    { label: '30-45m', min: 30, max: 45  },
    { label: '45m+',   min: 45, max: Infinity },
  ];
  buckets.forEach(b => {
    b.count = state.sessionHistory.filter(s => s.duration >= b.min && s.duration < b.max).length;
  });
  const maxCount = Math.max(...buckets.map(b => b.count), 1);
  el.innerHTML = buckets.map(b => `
    <div class="dur-dist-item">
      <div class="dur-dist-label">${b.label}</div>
      <div class="dur-dist-track">
        <div class="dur-dist-bar" style="width:${(b.count / maxCount) * 100}%"></div>
      </div>
      <div class="dur-dist-count">${b.count}</div>
    </div>`).join('');
}

// --- Rating trend (SVG sparkline) ---

export function renderRatingTrend() {
  const svg = document.getElementById('rating-trend-svg');
  if (!svg) return;
  const ratingVal = { Distracted: 0, Okay: 1, Focused: 2, Flow: 3 };
  const today = new Date();
  const points = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const dateStr = d.toDateString();
    const daySessions = state.sessionHistory.filter(s => s.date === dateStr);
    if (daySessions.length > 0) {
      const avg = daySessions.reduce((sum, s) => sum + (ratingVal[s.rating] || 0), 0) / daySessions.length;
      points.push({ x: 13 - i, y: avg });
    } else {
      points.push({ x: 13 - i, y: null });
    }
  }
  const validPoints = points.filter(p => p.y !== null);
  if (validPoints.length < 2) { svg.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="var(--text-muted)" font-size="10">Not enough data</text>'; return; }
  const W = 300, H = 60, pad = 10;
  const xScale = (W - pad * 2) / 13;
  const yScale = (H - pad * 2) / 3;
  const toX = i => pad + i * xScale;
  const toY = v => H - pad - v * yScale;
  const pathParts = [];
  let first = true;
  points.forEach(p => {
    if (p.y === null) { first = true; return; }
    if (first) { pathParts.push(`M${toX(p.x).toFixed(1)},${toY(p.y).toFixed(1)}`); first = false; }
    else        { pathParts.push(`L${toX(p.x).toFixed(1)},${toY(p.y).toFixed(1)}`); }
  });
  svg.innerHTML = `
    <defs><linearGradient id="trendGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="var(--accent-distracted)"/>
      <stop offset="100%" stop-color="var(--accent-flow)"/>
    </linearGradient></defs>
    <path d="${pathParts.join(' ')}" fill="none" stroke="url(#trendGrad)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    ${validPoints.map(p => `<circle cx="${toX(p.x).toFixed(1)}" cy="${toY(p.y).toFixed(1)}" r="3" fill="var(--accent-work)"/>`).join('')}`;
}

// --- Day of week chart ---

export function renderDayOfWeekChart() {
  if (!dom.dowChart) return;
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayMins = new Array(7).fill(0);
  const dayCounts = new Array(7).fill(0);
  state.sessionHistory.forEach(s => {
    try {
      const dow = new Date(s.timestamp).getDay();
      dayMins[dow] += s.duration;
      dayCounts[dow]++;
    } catch {}
  });
  const avgMins = dayMins.map((m, i) => dayCounts[i] > 0 ? m / dayCounts[i] : 0);
  const maxAvg = Math.max(...avgMins, 1);
  dom.dowChart.innerHTML = days.map((d, i) => {
    const heightPct = (avgMins[i] / maxAvg) * 100;
    return `
    <div class="chart-bar-wrapper">
      <div class="chart-value">${avgMins[i] > 0 ? Math.round(avgMins[i]) + 'm' : ''}</div>
      <div class="chart-bar-track">
        <div class="chart-bar" style="height:${heightPct}%"></div>
      </div>
      <div class="chart-label">${d}</div>
    </div>`;
  }).join('');
}

// --- Task history ---

export function renderTaskHistory() {
  const el = document.getElementById('task-history');
  if (!el) return;
  const taskTotals = {};
  state.sessionHistory.forEach(s => {
    const name = s.task || 'Untitled';
    taskTotals[name] = (taskTotals[name] || 0) + s.duration;
  });
  const sorted = Object.entries(taskTotals).sort((a, b) => b[1] - a[1]).slice(0, 8);
  if (sorted.length === 0) { el.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">No task data yet</p>'; return; }
  const maxMins = sorted[0][1];
  el.innerHTML = sorted.map(([name, mins]) => `
    <div class="task-hist-item">
      <div class="task-hist-name">${escapeHtml(name)}</div>
      <div class="task-hist-bar-track"><div class="task-hist-bar" style="width:${(mins / maxMins) * 100}%"></div></div>
      <div class="task-hist-mins">${Math.round(mins)}m</div>
    </div>`).join('');
}
