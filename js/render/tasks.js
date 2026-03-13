/**
 * @module render/tasks
 * Task management rendering: task queue, session chain, recurring tasks,
 * task templates, recurring-task spawning, and drag-and-drop reordering.
 */

import { state } from '../state.js';
import { saveTaskQueue, saveSessionChain, saveRecurringTasks, saveTaskTemplates } from '../storage.js';
import { dom } from '../dom.js';
import { escapeHtml } from './utils.js';

/**
 * Render the task queue list.
 * @description Builds the full task list HTML including subtasks, estimates, priorities,
 *              archive state, and attaches drag-and-drop handlers.
 * @returns {void}
 */
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

/**
 * Set up drag-and-drop reordering on the task list.
 * @description Attaches dragstart, dragend, dragover, dragleave, and drop listeners
 *              to each draggable task item for manual reordering.
 * @param {HTMLElement} list - The task list container element.
 * @returns {void}
 */
export function setupDragAndDrop(list) {
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

/**
 * Render the session chain list.
 * @description Shows numbered chain entries with task names, durations, done state,
 *              and delete buttons.
 * @returns {void}
 */
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

/**
 * Render the recurring tasks list.
 * @description Shows each recurring task with its scheduled days and a delete button.
 * @returns {void}
 */
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

/**
 * Render saved task templates.
 * @description Shows each template with metadata and load/delete buttons.
 * @returns {void}
 */
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

/**
 * Spawn recurring tasks for today.
 * @description Checks each recurring task's scheduled days against today and creates
 *              new task-queue entries for any that haven't been spawned yet.
 * @returns {void}
 */
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
