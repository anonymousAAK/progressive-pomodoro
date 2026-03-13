import { state, ACHIEVEMENTS, DAILY_CHALLENGES, RING_CIRCUMFERENCE, POMODOROS_BEFORE_LONG_BREAK, AFFIRMATIONS, MOOD_OPTIONS } from './state.js';
import { saveTaskQueue, saveSessionChain, saveRecurringTasks, saveTaskTemplates } from './storage.js';
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
  renderCognitiveLoad();
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
        <div class="h-meta">${entry.duration}m${entry.overtime ? ` +${Math.round(entry.overtime / 60)}m OT` : ''} · ${entry.displayTime || ''}${entry.mood ? ` · ${MOOD_OPTIONS.find(m=>m.value===entry.mood)?.emoji||''}` : ''}${entry.complexity ? ` · ${'★'.repeat(entry.complexity)}` : ''}${entry.distractions ? ` · ${entry.distractions} dist.` : ''}${entry.note ? ` · "${escapeHtml(entry.note)}"` : ''}</div>
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
  renderFocusZone();
  renderMoodDistribution();
  renderComplexityFocusChart();
  renderCognitiveLoad();
  renderFocusSuggestion();
  renderWeekComparison();
  renderVizThemePicker();
  renderCumulativeFocusGraph();
  renderSessionGapAnalysis();
  renderGoalVsActual();
  setupExportReport();
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

  // Filter based on archive state (#40)
  const showArchived = state.showArchived;
  const visibleTasks = showArchived ? state.taskQueue : state.taskQueue.filter(t => !t.archived);

  if (visibleTasks.length === 0) {
    list.innerHTML = '<div class="tasks-empty">No tasks yet. Add one above!</div>';
    if (progress) progress.textContent = '';
    return;
  }
  const done = state.taskQueue.filter(t => t.done).length;
  if (progress) progress.textContent = `Completed: ${done}/${state.taskQueue.length}`;

  list.innerHTML = visibleTasks.map(task => {
    // Estimate progress (#34)
    const estimateHtml = task.estimate > 0
      ? `<span class="task-estimate">${task.pomodorosCompleted || 0}/${task.estimate} poms</span>`
      : '';
    // Subtasks (#35)
    const subtasks = task.subtasks || [];
    const subtaskHtml = subtasks.length > 0 ? `
      <div class="subtask-list">
        ${subtasks.map((st, i) => `
          <label class="subtask-item" data-task-id="${task.id}" data-subtask-idx="${i}">
            <input type="checkbox" class="subtask-check" ${st.done ? 'checked' : ''}>
            <span class="${st.done ? 'done-text' : ''}">${escapeHtml(st.text)}</span>
          </label>`).join('')}
        <div class="subtask-progress-bar"><div class="subtask-progress-fill" style="width:${subtasks.length > 0 ? (subtasks.filter(s=>s.done).length/subtasks.length*100) : 0}%"></div></div>
      </div>` : '';
    const archivedClass = task.archived ? ' archived' : '';
    return `
    <div class="task-item${task.done ? ' done' : ''}${archivedClass}" data-id="${task.id}" draggable="true">
      <div class="drag-handle" title="Drag to reorder">⠿</div>
      <div class="task-item-check${task.done ? ' checked' : ''}">${task.done ? '✓' : ''}</div>
      <div class="priority-dot ${task.priority}"></div>
      <div class="task-item-body">
        <div class="task-item-name${task.done ? ' done-text' : ''}">${escapeHtml(task.name)} ${estimateHtml}</div>
        ${subtaskHtml}
      </div>
      <div class="task-item-actions">
        <button class="btn-focus-task" title="Focus on this task">▶</button>
        <button class="btn-add-subtask" title="Add subtask">+</button>
        ${task.done && !task.archived ? '<button class="btn-archive-task" title="Archive">📦</button>' : ''}
        <button class="btn-delete-task" title="Delete" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:0.9rem;padding:4px;">✕</button>
      </div>
    </div>`;
  }).join('');

  // Set up drag and drop (#42)
  setupDragAndDrop(list);
}

function setupDragAndDrop(list) {
  let draggedId = null;
  list.querySelectorAll('.task-item[draggable]').forEach(item => {
    item.addEventListener('dragstart', e => {
      draggedId = parseInt(item.dataset.id, 10);
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      draggedId = null;
    });
    item.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      item.classList.add('drag-over');
    });
    item.addEventListener('dragleave', () => {
      item.classList.remove('drag-over');
    });
    item.addEventListener('drop', e => {
      e.preventDefault();
      item.classList.remove('drag-over');
      const targetId = parseInt(item.dataset.id, 10);
      if (draggedId === null || draggedId === targetId) return;
      const fromIdx = state.taskQueue.findIndex(t => t.id === draggedId);
      const toIdx = state.taskQueue.findIndex(t => t.id === targetId);
      if (fromIdx < 0 || toIdx < 0) return;
      const [moved] = state.taskQueue.splice(fromIdx, 1);
      state.taskQueue.splice(toIdx, 0, moved);
      saveTaskQueue();
      renderTaskQueue();
    });
  });
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

// --- Celebration (#70 — style-aware) ---

function _spawnConfetti(count, colors, delayMax, durMin) {
  for (let i = 0; i < count; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.cssText = `left:${Math.random() * 100}%;top:-10px;background:${colors[Math.floor(Math.random() * colors.length)]};animation-delay:${Math.random() * delayMax}s;animation-duration:${durMin + Math.random()}s`;
    dom.celebration.appendChild(c);
  }
}

function _spawnFireworks(count, colors) {
  for (let i = 0; i < count; i++) {
    const fw = document.createElement('div');
    fw.className = 'firework';
    fw.style.cssText = `left:${10 + Math.random() * 80}%;top:${10 + Math.random() * 60}%;background:${colors[Math.floor(Math.random() * colors.length)]};animation-delay:${Math.random() * 1}s;`;
    dom.celebration.appendChild(fw);
  }
}

function _spawnSparkles(count, colors) {
  for (let i = 0; i < count; i++) {
    const sp = document.createElement('div');
    sp.className = 'sparkle';
    sp.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;color:${colors[Math.floor(Math.random() * colors.length)]};animation-delay:${Math.random() * 1.5}s;`;
    dom.celebration.appendChild(sp);
  }
}

export function showCelebration() {
  const style = state.celebrationStyle || 'confetti';
  if (style === 'none') return;

  dom.celebration.innerHTML = '';
  dom.celebration.classList.add('show');
  const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

  switch (style) {
    case 'fireworks':
      _spawnFireworks(20, colors);
      break;
    case 'sparkles':
      _spawnSparkles(30, colors);
      break;
    case 'confetti':
    default:
      _spawnConfetti(40, colors, 0.5, 1.5);
      break;
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

// --- Focus Zone Detection (#19) ---

export function renderFocusZone() {
  const el = document.getElementById('focus-zone-display');
  if (!el) return;
  if (state.sessionHistory.length < 5) {
    el.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">Need 5+ sessions for analysis</p>';
    return;
  }
  const ratingVal = { Distracted: 1, Okay: 2, Focused: 3, Flow: 4 };
  const hourRatings = {};
  const hourCounts = {};
  state.sessionHistory.forEach(s => {
    try {
      const h = new Date(s.timestamp).getHours();
      hourRatings[h] = (hourRatings[h] || 0) + (ratingVal[s.rating] || 0);
      hourCounts[h] = (hourCounts[h] || 0) + 1;
    } catch {}
  });
  let bestHour = -1, bestAvg = 0;
  Object.keys(hourCounts).forEach(h => {
    const avg = hourRatings[h] / hourCounts[h];
    if (avg > bestAvg) { bestAvg = avg; bestHour = parseInt(h); }
  });
  if (bestHour < 0) { el.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">Not enough data</p>'; return; }
  const formatHour = h => { const ampm = h >= 12 ? 'pm' : 'am'; return `${h % 12 || 12}${ampm}`; };
  el.innerHTML = `<div style="font-size:1.1rem;font-weight:700;color:var(--accent-work);">🎯 Your Focus Zone: ${formatHour(bestHour)} - ${formatHour((bestHour + 1) % 24)}</div>
    <p style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;">Avg rating: ${bestAvg.toFixed(1)}/4 across ${hourCounts[bestHour]} sessions</p>`;
}

// --- Mood Distribution (#21) ---

export function renderMoodDistribution() {
  const el = document.getElementById('mood-distribution');
  if (!el) return;
  const moodCounts = {};
  state.sessionHistory.forEach(s => {
    if (s.mood) moodCounts[s.mood] = (moodCounts[s.mood] || 0) + 1;
  });
  const total = Object.values(moodCounts).reduce((a, b) => a + b, 0);
  if (total === 0) { el.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">No mood data yet. Select a mood before starting sessions.</p>'; return; }
  el.innerHTML = MOOD_OPTIONS.map(m => {
    const count = moodCounts[m.value] || 0;
    const pct = total > 0 ? (count / total * 100) : 0;
    return `<div class="dur-dist-item">
      <div class="dur-dist-label">${m.emoji} ${m.label}</div>
      <div class="dur-dist-track"><div class="dur-dist-bar" style="width:${pct}%"></div></div>
      <div class="dur-dist-count">${count}</div>
    </div>`;
  }).join('');
}

// --- Complexity vs Focus Chart (#28) ---

export function renderComplexityFocusChart() {
  const el = document.getElementById('complexity-focus-chart');
  if (!el) return;
  const ratingVal = { Distracted: 1, Okay: 2, Focused: 3, Flow: 4 };
  const compData = {};
  const compCounts = {};
  state.sessionHistory.forEach(s => {
    if (s.complexity && s.complexity > 0) {
      compData[s.complexity] = (compData[s.complexity] || 0) + (ratingVal[s.rating] || 0);
      compCounts[s.complexity] = (compCounts[s.complexity] || 0) + 1;
    }
  });
  const total = Object.values(compCounts).reduce((a, b) => a + b, 0);
  if (total < 3) { el.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">Rate task complexity before sessions for analysis</p>'; return; }
  const maxAvg = 4;
  el.innerHTML = [1,2,3,4,5].map(c => {
    const avg = compCounts[c] ? compData[c] / compCounts[c] : 0;
    const pct = (avg / maxAvg) * 100;
    return `<div class="dur-dist-item">
      <div class="dur-dist-label">${'★'.repeat(c)}</div>
      <div class="dur-dist-track"><div class="dur-dist-bar" style="width:${pct}%"></div></div>
      <div class="dur-dist-count">${avg.toFixed(1)}</div>
    </div>`;
  }).join('');
}

// --- Cognitive Load Indicator (#29) ---

export function renderCognitiveLoad() {
  const el = dom.cognitiveLoadValue;
  if (!el) return;
  const today = new Date().toDateString();
  const todaySessions = state.sessionHistory.filter(s => s.date === today);
  let load = 0;
  todaySessions.forEach(s => {
    const complexity = s.complexity || 1;
    load += complexity * s.duration;
  });
  let level, color;
  if (load < 60)       { level = 'Low';      color = 'var(--accent-success)'; }
  else if (load < 150) { level = 'Medium';   color = 'var(--accent-okay)'; }
  else if (load < 300) { level = 'High';     color = 'var(--accent-warning)'; }
  else                 { level = 'Overload'; color = 'var(--accent-danger)'; }
  el.textContent = level;
  el.style.color = color;
}

// --- Focus Improvement Suggestions (#30) ---

export function renderFocusSuggestion() {
  const el = document.getElementById('focus-suggestion');
  if (!el) return;
  const today = new Date().toDateString();
  if (state.lastSuggestionDate === today && el.dataset.filled) return; // Only 1 per day

  if (state.sessionHistory.length < 5) {
    el.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">Complete more sessions for insights</p>';
    return;
  }

  const suggestions = [];
  const ratingVal = { Distracted: 1, Okay: 2, Focused: 3, Flow: 4 };

  // Check morning vs afternoon
  const morningRatings = [], afternoonRatings = [];
  state.sessionHistory.forEach(s => {
    try {
      const h = new Date(s.timestamp).getHours();
      const val = ratingVal[s.rating] || 0;
      if (h < 12) morningRatings.push(val);
      else afternoonRatings.push(val);
    } catch {}
  });
  if (morningRatings.length >= 3 && afternoonRatings.length >= 3) {
    const morningAvg = morningRatings.reduce((a,b) => a+b, 0) / morningRatings.length;
    const afternoonAvg = afternoonRatings.reduce((a,b) => a+b, 0) / afternoonRatings.length;
    if (morningAvg > afternoonAvg + 0.5) {
      suggestions.push('📌 Your morning sessions rate higher. Try scheduling hard tasks before noon.');
    } else if (afternoonAvg > morningAvg + 0.5) {
      suggestions.push('📌 You focus better in the afternoon. Save challenging work for after lunch.');
    }
  }

  // Check distraction correlation
  const highDist = state.sessionHistory.filter(s => (s.distractions || 0) >= 3);
  const lowDist = state.sessionHistory.filter(s => (s.distractions || 0) === 0);
  if (highDist.length >= 3 && lowDist.length >= 3) {
    const highAvg = highDist.reduce((a,s) => a + (ratingVal[s.rating]||0), 0) / highDist.length;
    const lowAvg = lowDist.reduce((a,s) => a + (ratingVal[s.rating]||0), 0) / lowDist.length;
    if (lowAvg > highAvg + 0.5) {
      suggestions.push('📌 Zero-distraction sessions rate much higher. Try distraction-free mode more often.');
    }
  }

  // Check short vs long sessions
  const shortSessions = state.sessionHistory.filter(s => s.duration < 15);
  const longSessions = state.sessionHistory.filter(s => s.duration >= 30);
  if (shortSessions.length >= 3 && longSessions.length >= 3) {
    const shortAvg = shortSessions.reduce((a,s) => a + (ratingVal[s.rating]||0), 0) / shortSessions.length;
    const longAvg = longSessions.reduce((a,s) => a + (ratingVal[s.rating]||0), 0) / longSessions.length;
    if (shortAvg > longAvg + 0.3) {
      suggestions.push('📌 Shorter sessions seem to work better for you. Try the Sprint or Classic preset.');
    } else if (longAvg > shortAvg + 0.3) {
      suggestions.push('📌 You shine in longer sessions. Consider Deep Work mode for more flow states.');
    }
  }

  // Check energy correlation
  const energyHigh = state.sessionHistory.filter(s => s.energy === 'high');
  const energyLow = state.sessionHistory.filter(s => s.energy === 'low');
  if (energyHigh.length >= 2 && energyLow.length >= 2) {
    const highAvg = energyHigh.reduce((a,s) => a + (ratingVal[s.rating]||0), 0) / energyHigh.length;
    const lowAvg = energyLow.reduce((a,s) => a + (ratingVal[s.rating]||0), 0) / energyLow.length;
    if (highAvg > lowAvg + 0.7) {
      suggestions.push('📌 High-energy sessions perform much better. Track and optimize your energy levels.');
    }
  }

  if (suggestions.length === 0) {
    suggestions.push('📌 Keep completing sessions! More data will unlock personalized suggestions.');
  }

  const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
  el.innerHTML = `<p style="font-size:0.85rem;color:var(--text-secondary);line-height:1.5;">${suggestion}</p>`;
  el.dataset.filled = 'true';
  state.lastSuggestionDate = today;
  localStorage.setItem('pp_lastSuggestionDate', today);
}

// --- #47 Week Comparison ---

export function renderWeekComparison() {
  const el = document.getElementById('week-comparison');
  if (!el) return;
  const today = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const thisWeek = [];
  const lastWeek = [];
  for (let i = 6; i >= 0; i--) {
    const d1 = new Date(today); d1.setDate(d1.getDate() - i);
    const d2 = new Date(today); d2.setDate(d2.getDate() - i - 7);
    const mins1 = state.sessionHistory.filter(s => s.date === d1.toDateString()).reduce((sum, s) => sum + s.duration, 0);
    const mins2 = state.sessionHistory.filter(s => s.date === d2.toDateString()).reduce((sum, s) => sum + s.duration, 0);
    thisWeek.push({ day: days[d1.getDay()], mins: Math.round(mins1) });
    lastWeek.push({ day: days[d2.getDay()], mins: Math.round(mins2) });
  }

  const thisTotal = thisWeek.reduce((s, d) => s + d.mins, 0);
  const lastTotal = lastWeek.reduce((s, d) => s + d.mins, 0);
  const maxMins = Math.max(...thisWeek.map(d => d.mins), ...lastWeek.map(d => d.mins), 1);
  const diff = thisTotal - lastTotal;
  const diffSign = diff >= 0 ? '+' : '';
  const diffColor = diff >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)';

  el.innerHTML = `
    <div class="week-cmp-summary" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-size:0.78rem;">
      <span style="color:var(--text-secondary);">This week: <strong style="color:var(--accent-work);">${thisTotal}m</strong></span>
      <span style="color:var(--text-secondary);">Last week: <strong style="color:var(--text-muted);">${lastTotal}m</strong></span>
      <span style="color:${diffColor};font-weight:700;">${diffSign}${diff}m</span>
    </div>
    <div class="week-cmp-bars" style="display:flex;align-items:flex-end;gap:4px;">
      ${thisWeek.map((d, i) => {
        const h1 = (d.mins / maxMins) * 100;
        const h2 = (lastWeek[i].mins / maxMins) * 100;
        return `<div class="week-cmp-col" style="flex:1;display:flex;flex-direction:column;align-items:center;">
          <div style="height:60px;width:100%;display:flex;align-items:flex-end;gap:2px;">
            <div style="height:${h2}%;flex:1;background:var(--text-muted);opacity:0.3;border-radius:2px;" title="Last: ${lastWeek[i].mins}m"></div>
            <div style="height:${h1}%;flex:1;background:var(--accent-work);border-radius:2px;" title="This: ${d.mins}m"></div>
          </div>
          <div style="font-size:0.55rem;color:var(--text-muted);text-align:center;margin-top:3px;">${d.day}</div>
        </div>`;
      }).join('')}
    </div>
    <div style="display:flex;gap:12px;margin-top:8px;font-size:0.65rem;color:var(--text-muted);">
      <span><span style="display:inline-block;width:8px;height:8px;background:var(--accent-work);border-radius:2px;margin-right:4px;"></span>This week</span>
      <span><span style="display:inline-block;width:8px;height:8px;background:var(--text-muted);opacity:0.3;border-radius:2px;margin-right:4px;"></span>Last week</span>
    </div>`;
}

// --- #51 Data Visualization Themes ---

const VIZ_THEMES = {
  default:  { name: 'Default',  colors: ['var(--accent-work)', 'var(--accent-break)', 'var(--accent-success)', 'var(--accent-warning)', 'var(--accent-danger)'] },
  ocean:    { name: 'Ocean',    colors: ['#0ea5e9', '#06b6d4', '#14b8a6', '#2dd4bf', '#67e8f9'] },
  sunset:   { name: 'Sunset',   colors: ['#f97316', '#ef4444', '#f59e0b', '#ec4899', '#fb923c'] },
  forest:   { name: 'Forest',   colors: ['#22c55e', '#16a34a', '#84cc16', '#4ade80', '#a3e635'] },
  neon:     { name: 'Neon',     colors: ['#a855f7', '#ec4899', '#6366f1', '#f43f5e', '#8b5cf6'] },
  mono:     { name: 'Mono',     colors: ['#e5e7eb', '#9ca3af', '#6b7280', '#d1d5db', '#4b5563'] },
};

export function renderVizThemePicker() {
  const el = document.getElementById('viz-theme-picker');
  if (!el) return;
  const current = state.vizTheme || 'default';
  el.innerHTML = Object.entries(VIZ_THEMES).map(([key, theme]) => {
    const activeClass = key === current ? ' active' : '';
    const swatches = theme.colors.slice(0, 5).map(c => `<span style="width:10px;height:10px;border-radius:50%;background:${c};display:inline-block;"></span>`).join('');
    return `<button class="viz-theme-btn${activeClass}" data-viz-theme="${key}" title="${theme.name}">
      <span style="font-size:0.7rem;font-weight:600;">${theme.name}</span>
      <span style="display:flex;gap:3px;margin-top:2px;">${swatches}</span>
    </button>`;
  }).join('');

  el.querySelectorAll('.viz-theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.vizTheme = btn.dataset.vizTheme;
      localStorage.setItem('pp_vizTheme', state.vizTheme);
      const colors = VIZ_THEMES[state.vizTheme].colors;
      document.documentElement.style.setProperty('--viz-color-1', colors[0]);
      document.documentElement.style.setProperty('--viz-color-2', colors[1]);
      document.documentElement.style.setProperty('--viz-color-3', colors[2]);
      document.documentElement.style.setProperty('--viz-color-4', colors[3]);
      document.documentElement.style.setProperty('--viz-color-5', colors[4]);
      renderVizThemePicker();
    });
  });
}

// --- #54 Cumulative Focus Time Graph ---

export function renderCumulativeFocusGraph() {
  const svg = document.getElementById('cumulative-focus-svg');
  if (!svg) return;

  const today = new Date();
  const weeks = [];
  for (let w = 11; w >= 0; w--) {
    const weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate() - w * 7);
    const weekStart = new Date(weekEnd); weekStart.setDate(weekStart.getDate() - 6);
    const weekMins = state.sessionHistory.filter(s => {
      try {
        const ts = new Date(s.timestamp);
        return ts >= weekStart && ts <= weekEnd;
      } catch { return false; }
    }).reduce((sum, s) => sum + s.duration, 0);
    weeks.push(weekMins);
  }

  const cumulative = [];
  let runningTotal = 0;
  weeks.forEach(m => { runningTotal += m; cumulative.push(runningTotal); });

  if (runningTotal === 0) {
    svg.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="var(--text-muted)" font-size="10">No data yet</text>';
    return;
  }

  const W = 300, H = 100, pad = 12;
  const maxVal = Math.max(...cumulative, 1);
  const xStep = (W - pad * 2) / 11;
  const toX = i => pad + i * xStep;
  const toY = v => H - pad - ((v / maxVal) * (H - pad * 2));

  const linePoints = cumulative.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');
  const areaPath = `${linePoints} L${toX(11).toFixed(1)},${H - pad} L${toX(0).toFixed(1)},${H - pad} Z`;

  svg.innerHTML = `
    <defs>
      <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--accent-work)" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="var(--accent-work)" stop-opacity="0.02"/>
      </linearGradient>
    </defs>
    <path d="${areaPath}" fill="url(#cumGrad)"/>
    <path d="${linePoints}" fill="none" stroke="var(--accent-work)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    ${cumulative.map((v, i) => `<circle cx="${toX(i).toFixed(1)}" cy="${toY(v).toFixed(1)}" r="2.5" fill="var(--accent-work)"/>`).join('')}
    <text x="${toX(0)}" y="${H - 1}" fill="var(--text-muted)" font-size="7">12w ago</text>
    <text x="${toX(11) - 20}" y="${H - 1}" fill="var(--text-muted)" font-size="7">Now</text>
    <text x="${toX(11) + 4}" y="${toY(cumulative[11]).toFixed(1)}" fill="var(--accent-work)" font-size="8" font-weight="700">${(runningTotal / 60).toFixed(1)}h</text>`;
}

// --- #55 Session Gap Analysis ---

export function renderSessionGapAnalysis() {
  const el = document.getElementById('session-gap-analysis');
  if (!el) return;

  const sessions = [...state.sessionHistory].filter(s => s.timestamp);
  if (sessions.length < 2) {
    el.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">Need 2+ sessions with timestamps for gap analysis</p>';
    return;
  }

  const sorted = sessions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const gaps = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const s1 = sorted[i];
    const s2 = sorted[i + 1];
    if (s1.date !== s2.date) continue;
    try {
      const t1 = new Date(s1.timestamp).getTime();
      const t2 = new Date(s2.timestamp).getTime();
      const gapMins = Math.round((t1 - t2) / 60000);
      if (gapMins > 0 && gapMins < 480) {
        gaps.push(gapMins);
      }
    } catch {}
  }

  if (gaps.length === 0) {
    el.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">Not enough same-day session pairs yet</p>';
    return;
  }

  const avgGap = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
  const minGap = Math.min(...gaps);
  const maxGap = Math.max(...gaps);

  const buckets = [
    { label: '<5m',     min: 0,  max: 5 },
    { label: '5-15m',   min: 5,  max: 15 },
    { label: '15-30m',  min: 15, max: 30 },
    { label: '30-60m',  min: 30, max: 60 },
    { label: '60m+',    min: 60, max: Infinity },
  ];
  buckets.forEach(b => {
    b.count = gaps.filter(g => g >= b.min && g < b.max).length;
  });
  const maxCount = Math.max(...buckets.map(b => b.count), 1);

  let procrastinationNote = '';
  if (avgGap > 45) procrastinationNote = '<p style="font-size:0.72rem;color:var(--accent-warning);margin-top:8px;">Long average gaps may indicate procrastination between sessions. Try session chaining!</p>';
  else if (avgGap < 10) procrastinationNote = '<p style="font-size:0.72rem;color:var(--accent-success);margin-top:8px;">Great momentum! You move quickly between sessions.</p>';

  el.innerHTML = `
    <div style="display:flex;gap:16px;margin-bottom:10px;font-size:0.78rem;">
      <div style="text-align:center;"><div style="font-weight:700;color:var(--accent-work);">${avgGap}m</div><div style="font-size:0.65rem;color:var(--text-muted);">Avg Gap</div></div>
      <div style="text-align:center;"><div style="font-weight:700;color:var(--accent-success);">${minGap}m</div><div style="font-size:0.65rem;color:var(--text-muted);">Shortest</div></div>
      <div style="text-align:center;"><div style="font-weight:700;color:var(--accent-warning);">${maxGap}m</div><div style="font-size:0.65rem;color:var(--text-muted);">Longest</div></div>
    </div>
    ${buckets.map(b => `
    <div class="dur-dist-item">
      <div class="dur-dist-label">${b.label}</div>
      <div class="dur-dist-track"><div class="dur-dist-bar" style="width:${(b.count / maxCount) * 100}%"></div></div>
      <div class="dur-dist-count">${b.count}</div>
    </div>`).join('')}
    ${procrastinationNote}`;
}

// --- #56 Goal vs Actual Comparison ---

export function renderGoalVsActual() {
  const el = document.getElementById('goal-vs-actual');
  if (!el) return;

  const target = state.sessionTarget;
  if (!target || target <= 0) {
    el.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">Set a daily session target in Settings to compare goals with actual performance.</p>';
    return;
  }

  const today = new Date();
  const dayArr = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const dateStr = d.toDateString();
    const actual = state.sessionHistory.filter(s => s.date === dateStr).length;
    dayArr.push({ name: dayNames[d.getDay()], actual, goal: target, isToday: i === 0 });
  }

  const maxVal = Math.max(target, ...dayArr.map(d => d.actual), 1);
  const hitDays = dayArr.filter(d => d.actual >= d.goal).length;
  const totalActual = dayArr.reduce((s, d) => s + d.actual, 0);
  const totalGoal = target * 7;
  const completionPct = Math.round((totalActual / totalGoal) * 100);

  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;margin-bottom:10px;font-size:0.78rem;">
      <span style="color:var(--text-secondary);">Goal hit: <strong style="color:var(--accent-work);">${hitDays}/7 days</strong></span>
      <span style="color:var(--text-secondary);">Completion: <strong style="color:${completionPct >= 80 ? 'var(--accent-success)' : completionPct >= 50 ? 'var(--accent-warning)' : 'var(--accent-danger)'};">${completionPct}%</strong></span>
    </div>
    <div style="display:flex;align-items:flex-end;gap:6px;height:70px;">
      ${dayArr.map(d => {
        const goalH = (d.goal / maxVal) * 100;
        const actualH = (d.actual / maxVal) * 100;
        const barColor = d.actual >= d.goal ? 'var(--accent-success)' : 'var(--accent-work)';
        const todayStyle = d.isToday ? 'outline:1px solid var(--accent-work);outline-offset:1px;' : '';
        return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;height:100%;">
          <div style="flex:1;width:100%;display:flex;align-items:flex-end;gap:1px;position:relative;">
            <div style="flex:1;height:${goalH}%;background:var(--text-muted);opacity:0.15;border-radius:2px;" title="Goal: ${d.goal}"></div>
            <div style="flex:1;height:${actualH}%;background:${barColor};border-radius:2px;${todayStyle}" title="Actual: ${d.actual}"></div>
          </div>
          <div style="font-size:0.55rem;color:var(--text-muted);margin-top:3px;">${d.name}</div>
        </div>`;
      }).join('')}
    </div>
    <div style="display:flex;gap:12px;margin-top:8px;font-size:0.65rem;color:var(--text-muted);">
      <span><span style="display:inline-block;width:8px;height:8px;background:var(--text-muted);opacity:0.15;border-radius:2px;margin-right:4px;"></span>Goal (${target}/day)</span>
      <span><span style="display:inline-block;width:8px;height:8px;background:var(--accent-work);border-radius:2px;margin-right:4px;"></span>Actual</span>
    </div>`;
}

// --- #58 Exportable Reports (Canvas-based image export) ---

export function setupExportReport() {
  const btn = document.getElementById('export-report-btn');
  if (!btn) return;
  btn.addEventListener('click', () => exportReportAsImage());
}

function exportReportAsImage() {
  const sessions = state.sessionHistory;
  const totalMins = sessions.reduce((sum, s) => sum + s.duration, 0);
  const totalHours = (totalMins / 60).toFixed(1);
  const today = new Date();

  const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 6);
  const weekSessions = sessions.filter(s => {
    try { return new Date(s.timestamp) >= weekAgo; } catch { return false; }
  });
  const weekMins = weekSessions.reduce((sum, s) => sum + s.duration, 0);

  const counts = { Distracted: 0, Okay: 0, Focused: 0, Flow: 0 };
  sessions.forEach(s => { if (counts[s.rating] !== undefined) counts[s.rating]++; });

  const dailyData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const dateStr = d.toDateString();
    const mins = sessions.filter(s => s.date === dateStr).reduce((sum, s) => sum + s.duration, 0);
    const dayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
    dailyData.push({ day: dayName, mins: Math.round(mins) });
  }

  const canvas = document.createElement('canvas');
  const W = 600, H = 440;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0f0f17';
  ctx.fillRect(0, 0, W, H);

  // Title
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 20px Inter, sans-serif';
  ctx.fillText('Progressive Pomodoro - Focus Report', 24, 36);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px Inter, sans-serif';
  ctx.fillText(`Generated: ${today.toLocaleDateString()}`, 24, 56);

  // Summary stats
  const statsY = 80;
  const statBoxes = [
    { label: 'Total Focus', value: `${totalHours}h`, color: '#6366f1' },
    { label: 'Sessions', value: `${sessions.length}`, color: '#06b6d4' },
    { label: 'This Week', value: `${Math.round(weekMins)}m`, color: '#10b981' },
    { label: 'Streak', value: `${state.streakData.current}d`, color: '#f59e0b' },
  ];
  statBoxes.forEach((box, i) => {
    const x = 24 + i * 140;
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.roundRect(x, statsY, 125, 60, 8);
    ctx.fill();
    ctx.fillStyle = box.color;
    ctx.font = 'bold 22px JetBrains Mono, monospace';
    ctx.fillText(box.value, x + 12, statsY + 30);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText(box.label, x + 12, statsY + 48);
  });

  // Weekly bar chart
  const chartY = 165;
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 13px Inter, sans-serif';
  ctx.fillText('Last 7 Days', 24, chartY);

  const maxDayMins = Math.max(...dailyData.map(d => d.mins), 1);
  const barW = 60, barGap = 14, chartBaseY = chartY + 130;
  dailyData.forEach((d, i) => {
    const x = 24 + i * (barW + barGap);
    const barH = Math.max(2, (d.mins / maxDayMins) * 100);
    ctx.fillStyle = '#6366f1';
    ctx.beginPath();
    ctx.roundRect(x, chartBaseY - barH, barW, barH, 3);
    ctx.fill();
    if (d.mins > 0) {
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText(`${d.mins}m`, x + 14, chartBaseY - barH - 6);
    }
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText(d.day, x + 18, chartBaseY + 14);
  });

  // Focus distribution
  const distY = chartBaseY + 40;
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 13px Inter, sans-serif';
  ctx.fillText('Focus Distribution', 24, distY);

  const distColors = { Distracted: '#ef4444', Okay: '#f59e0b', Focused: '#6366f1', Flow: '#10b981' };
  const total = sessions.length || 1;
  let dx = 24;
  Object.entries(counts).forEach(([key, val]) => {
    const pct = (val / total) * 100;
    const w = Math.max(2, (pct / 100) * 530);
    ctx.fillStyle = distColors[key];
    ctx.beginPath();
    ctx.roundRect(dx, distY + 12, w, 12, 3);
    ctx.fill();
    dx += w + 4;
  });

  // Legend
  let lx = 24;
  const legY = distY + 36;
  Object.entries(counts).forEach(([key, val]) => {
    ctx.fillStyle = distColors[key];
    ctx.fillRect(lx, legY, 8, 8);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText(`${key} (${val})`, lx + 12, legY + 8);
    lx += ctx.measureText(`${key} (${val})`).width + 24;
  });

  // Watermark
  ctx.fillStyle = '#4a4a5a';
  ctx.font = '10px Inter, sans-serif';
  ctx.fillText('progressivepomodoro.app', W - 160, H - 12);

  // Download
  const link = document.createElement('a');
  link.download = `focus-report-${today.toISOString().split('T')[0]}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// --- Session Chain Render (#11) ---

export function renderSessionChain() {
  const list = dom.chainList;
  if (!list) return;
  if (state.sessionChain.length === 0) {
    list.innerHTML = '<div style="font-size:0.75rem;color:var(--text-muted);padding:8px 0;">No entries in chain.</div>';
    return;
  }
  list.innerHTML = state.sessionChain.map((entry, i) => {
    const activeClass = i === state.chainIndex ? ' chain-active' : '';
    const doneClass = entry.done ? ' chain-done' : '';
    return `<div class="chain-entry${activeClass}${doneClass}" data-chain-idx="${i}">
      <span class="chain-idx">${i + 1}</span>
      <span class="chain-entry-dur">${entry.duration}m</span>
      <span class="chain-entry-task">${escapeHtml(entry.task || 'Untitled')}</span>
      ${entry.done ? '<span style="color:var(--accent-success);">✓</span>' : ''}
      <button class="btn-delete-chain" data-chain-idx="${i}" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:0.8rem;padding:2px 4px;">✕</button>
    </div>`;
  }).join('');
}

// --- Recurring Tasks Render (#33) ---

export function renderRecurringTasks() {
  const list = dom.recurringTaskList;
  if (!list) return;
  if (state.recurringTasks.length === 0) {
    list.innerHTML = '';
    return;
  }
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  list.innerHTML = state.recurringTasks.map(rt => {
    const days = rt.days.map(d => dayNames[d]).join(', ');
    return `<div class="recurring-item" data-recurring-id="${rt.id}">
      <div class="recurring-item-name">${escapeHtml(rt.name)}</div>
      <div class="recurring-item-days">${days}</div>
      <button class="btn-delete-recurring" data-recurring-id="${rt.id}" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:0.8rem;padding:2px 4px;">✕</button>
    </div>`;
  }).join('');
}

// --- Task Templates Render (#39) ---

export function renderTaskTemplates() {
  const list = dom.templateList;
  if (!list) return;
  if (state.taskTemplates.length === 0) {
    list.innerHTML = '<div class="tasks-empty">No templates saved yet.</div>';
    return;
  }
  list.innerHTML = state.taskTemplates.map(t => `
    <div class="template-item" data-template-id="${t.id}">
      <div class="template-item-info">
        <div class="template-item-name">${escapeHtml(t.name)}</div>
        <div class="template-item-meta">${t.category ? t.category : ''} ${t.complexity ? '★'.repeat(t.complexity) : ''} ${t.estimate ? t.estimate + ' poms' : ''}</div>
      </div>
      <button class="btn-load-template" data-template-id="${t.id}" title="Load template">▶ Use</button>
      <button class="btn-delete-template" data-template-id="${t.id}" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:0.8rem;padding:2px 4px;">✕</button>
    </div>`).join('');
}

// --- Spawn recurring tasks for today (#33) ---

export function spawnRecurringTasks() {
  const today = new Date().getDay();
  const todayDateStr = new Date().toDateString();
  state.recurringTasks.forEach(rt => {
    if (!rt.days.includes(today)) return;
    // Check if already spawned today
    const alreadyExists = state.taskQueue.some(t => t.recurringSourceId === rt.id && t.spawnDate === todayDateStr);
    if (alreadyExists) return;
    const task = {
      id: state.nextTaskId++,
      name: rt.name,
      priority: 'medium',
      done: false,
      archived: false,
      estimate: 0,
      pomodorosCompleted: 0,
      subtasks: [],
      recurringSourceId: rt.id,
      spawnDate: todayDateStr,
    };
    state.taskQueue.push(task);
  });
  saveTaskQueue();
}
