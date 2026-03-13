/**
 * Task management event listeners.
 * Handles the task form, task queue interactions, session chain,
 * recurring tasks, and task templates.
 * @module task-events
 */

import { state } from '../state.js';
import { dom } from '../dom.js';
import { saveTaskQueue, saveSessionChain, saveRecurringTasks, saveTaskTemplates } from '../storage.js';
import { startChain } from '../timer.js';
import { showToast, renderTaskQueue, renderSessionChain, renderRecurringTasks, renderTaskTemplates } from '../render/index.js';

/**
 * Registers all task-related event listeners.
 * Includes task creation, task queue interactions (check, focus, archive,
 * subtask, delete), session chain management, recurring tasks,
 * task templates, and show-archived toggle.
 */
export function registerTaskEvents() {
  // --- Session Chain (#11) ---
  if (dom.chainToggleBtn) {
    dom.chainToggleBtn.addEventListener('click', () => {
      if (dom.chainBody) dom.chainBody.classList.toggle('hidden');
      dom.chainToggleBtn.textContent = dom.chainBody.classList.contains('hidden') ? '▸' : '▾';
    });
  }

  if (dom.chainAddBtn) {
    dom.chainAddBtn.addEventListener('click', () => {
      const dur = parseInt(dom.chainDurationInput?.value, 10) || 25;
      const task = dom.chainTaskInput?.value.trim() || 'Untitled';
      state.sessionChain.push({ duration: dur, task, done: false });
      saveSessionChain();
      renderSessionChain();
      if (dom.chainTaskInput) dom.chainTaskInput.value = '';
    });
  }

  if (dom.chainStartBtn) {
    dom.chainStartBtn.addEventListener('click', () => {
      if (state.sessionChain.length === 0) { showToast('Add sessions to the chain first'); return; }
      startChain();
    });
  }

  if (dom.chainClearBtn) {
    dom.chainClearBtn.addEventListener('click', () => {
      state.sessionChain = [];
      state.chainIndex = -1;
      saveSessionChain();
      renderSessionChain();
    });
  }

  // Chain list: delete entries
  if (dom.chainList) {
    dom.chainList.addEventListener('click', e => {
      const btn = e.target.closest('.btn-delete-chain');
      if (!btn) return;
      const idx = parseInt(btn.dataset.chainIdx, 10);
      state.sessionChain.splice(idx, 1);
      saveSessionChain();
      renderSessionChain();
    });
  }

  // --- Task queue ---
  const newTaskInput = document.getElementById('new-task-input');
  const addTaskBtn   = document.getElementById('add-task-btn');
  const priorityChips = document.querySelectorAll('.priority-chip');
  let selectedPriority = 'medium';

  priorityChips.forEach(chip => {
    chip.addEventListener('click', () => {
      priorityChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      selectedPriority = chip.dataset.priority;
    });
  });

  function addTask() {
    const name = newTaskInput ? newTaskInput.value.trim() : '';
    if (!name) return;
    const estimate = dom.taskEstimateInput ? parseInt(dom.taskEstimateInput.value, 10) || 0 : 0;
    const task = {
      id: state.nextTaskId++,
      name,
      priority: selectedPriority,
      done: false,
      archived: false,
      estimate,
      pomodorosCompleted: 0,
      subtasks: [],
    };
    state.taskQueue.push(task);
    saveTaskQueue();
    if (newTaskInput) newTaskInput.value = '';
    renderTaskQueue();
  }

  if (addTaskBtn) addTaskBtn.addEventListener('click', addTask);
  if (newTaskInput) {
    newTaskInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });
  }

  // --- Save as template (#39) ---
  if (dom.saveTemplateBtn) {
    dom.saveTemplateBtn.addEventListener('click', () => {
      const name = newTaskInput ? newTaskInput.value.trim() : '';
      if (!name) { showToast('Enter a task name first'); return; }
      const template = {
        id: state.nextTemplateId++,
        name,
        category: state.currentCategory,
        complexity: state.currentComplexity,
        estimate: dom.taskEstimateInput ? parseInt(dom.taskEstimateInput.value, 10) || 0 : 0,
      };
      state.taskTemplates.push(template);
      saveTaskTemplates();
      renderTaskTemplates();
      showToast('Template saved!');
    });
  }

  // --- Template list interactions ---
  if (dom.templateList) {
    dom.templateList.addEventListener('click', e => {
      const loadBtn = e.target.closest('.btn-load-template');
      const deleteBtn = e.target.closest('.btn-delete-template');
      if (loadBtn) {
        const id = parseInt(loadBtn.dataset.templateId, 10);
        const t = state.taskTemplates.find(t => t.id === id);
        if (t) {
          if (newTaskInput) newTaskInput.value = t.name;
          if (t.category) {
            state.currentCategory = t.category;
            dom.categoryChips.forEach(c => c.classList.toggle('active', c.dataset.cat === t.category));
          }
          if (t.complexity) {
            state.currentComplexity = t.complexity;
            dom.complexityStars.forEach(s => s.classList.toggle('active', parseInt(s.dataset.complexity, 10) <= t.complexity));
          }
          if (dom.taskEstimateInput) dom.taskEstimateInput.value = t.estimate || 0;
          showToast('Template loaded!');
        }
      }
      if (deleteBtn) {
        const id = parseInt(deleteBtn.dataset.templateId, 10);
        state.taskTemplates = state.taskTemplates.filter(t => t.id !== id);
        saveTaskTemplates();
        renderTaskTemplates();
      }
    });
  }

  // --- Show archived toggle (#40) ---
  if (dom.showArchivedToggle) {
    dom.showArchivedToggle.addEventListener('change', e => {
      state.showArchived = e.target.checked;
      renderTaskQueue();
    });
  }

  // Task queue item interactions (delegated)
  const taskQueueList = document.getElementById('task-queue-list');
  if (taskQueueList) {
    taskQueueList.addEventListener('click', e => {
      const item = e.target.closest('.task-item');
      if (!item) return;
      const id = parseInt(item.dataset.id, 10);

      if (e.target.closest('.task-item-check')) {
        const task = state.taskQueue.find(t => t.id === id);
        if (task) {
          task.done = !task.done;
          // Track pomodoro completion for estimates (#34)
          if (task.done && task.estimate > 0) {
            task.pomodorosCompleted = (task.pomodorosCompleted || 0) + 1;
          }
          saveTaskQueue();
          renderTaskQueue();
        }
      } else if (e.target.closest('.btn-focus-task')) {
        const task = state.taskQueue.find(t => t.id === id);
        if (task) {
          if (dom.taskInput) dom.taskInput.value = task.name;
          state.currentTask = task.name;
          // Switch to timer tab
          dom.navBtns.forEach(b => b.classList.remove('active'));
          dom.pages.forEach(p => p.classList.remove('active'));
          const timerBtn = document.querySelector('[data-target="timer-page"]');
          if (timerBtn) timerBtn.classList.add('active');
          const timerPage = document.getElementById('timer-page');
          if (timerPage) timerPage.classList.add('active');
        }
      } else if (e.target.closest('.btn-archive-task')) {
        const task = state.taskQueue.find(t => t.id === id);
        if (task) {
          task.archived = true;
          saveTaskQueue();
          renderTaskQueue();
          showToast('Task archived');
        }
      } else if (e.target.closest('.btn-add-subtask')) {
        const task = state.taskQueue.find(t => t.id === id);
        if (task) {
          const text = prompt('Subtask name:');
          if (text && text.trim()) {
            if (!task.subtasks) task.subtasks = [];
            task.subtasks.push({ text: text.trim(), done: false });
            saveTaskQueue();
            renderTaskQueue();
          }
        }
      } else if (e.target.closest('.btn-delete-task')) {
        state.taskQueue = state.taskQueue.filter(t => t.id !== id);
        saveTaskQueue();
        renderTaskQueue();
      }
    });

    // Subtask checkbox handling
    taskQueueList.addEventListener('change', e => {
      if (!e.target.classList.contains('subtask-check')) return;
      const label = e.target.closest('.subtask-item');
      if (!label) return;
      const taskId = parseInt(label.dataset.taskId, 10);
      const subtaskIdx = parseInt(label.dataset.subtaskIdx, 10);
      const task = state.taskQueue.find(t => t.id === taskId);
      if (task && task.subtasks && task.subtasks[subtaskIdx] !== undefined) {
        task.subtasks[subtaskIdx].done = e.target.checked;
        saveTaskQueue();
        renderTaskQueue();
      }
    });
  }

  // --- Recurring tasks (#33) ---
  if (dom.addRecurringBtn) {
    dom.addRecurringBtn.addEventListener('click', () => {
      const name = dom.recurringTaskInput ? dom.recurringTaskInput.value.trim() : '';
      if (!name) { showToast('Enter a task name'); return; }
      const dayCheckboxes = document.querySelectorAll('#recurring-days-row input[type="checkbox"]');
      const days = [];
      dayCheckboxes.forEach(cb => { if (cb.checked) days.push(parseInt(cb.dataset.day, 10)); });
      if (days.length === 0) { showToast('Select at least one day'); return; }
      state.recurringTasks.push({ id: state.nextRecurringId++, name, days });
      saveRecurringTasks();
      renderRecurringTasks();
      if (dom.recurringTaskInput) dom.recurringTaskInput.value = '';
      dayCheckboxes.forEach(cb => cb.checked = false);
      showToast('Recurring task added');
    });
  }

  if (dom.recurringTaskList) {
    dom.recurringTaskList.addEventListener('click', e => {
      const btn = e.target.closest('.btn-delete-recurring');
      if (!btn) return;
      const id = parseInt(btn.dataset.recurringId, 10);
      state.recurringTasks = state.recurringTasks.filter(rt => rt.id !== id);
      saveRecurringTasks();
      renderRecurringTasks();
    });
  }
}
