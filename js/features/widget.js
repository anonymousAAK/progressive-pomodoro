/**
 * Widget Mode module
 * Implements Feature #119 — Widget Mode.
 * Provides a draggable floating mini-timer widget with a progress ring.
 */

import { state } from '../state.js';

let widgetActive = false;
let widgetEl = null;
let widgetDragState = { dragging: false, offsetX: 0, offsetY: 0 };

/**
 * Toggles the floating widget mode on or off.
 * @returns {boolean} Whether widget mode is now active
 */
export function toggleWidgetMode() {
  widgetActive = !widgetActive;

  if (widgetActive) {
    createWidget();
  } else {
    destroyWidget();
  }
  return widgetActive;
}

/**
 * Creates the floating widget DOM element with a progress ring and drag support.
 */
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

/**
 * Removes the widget element from the DOM.
 */
function destroyWidget() {
  if (widgetEl) {
    widgetEl.remove();
    widgetEl = null;
  }
}

/**
 * Handles mousedown events on the widget for drag-to-move.
 * @param {MouseEvent} e
 */
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

/**
 * Handles touchstart events on the widget for touch drag-to-move.
 * @param {TouchEvent} e
 */
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

/**
 * Updates the widget display with the current timer state (time and progress ring).
 */
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
