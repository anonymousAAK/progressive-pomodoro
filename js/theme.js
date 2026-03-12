import { state } from './state.js';
import { dom } from './dom.js';

const html = document.documentElement;

// --- Theme (dark / light / system) ---

export function applyTheme(theme) {
  state.currentTheme = theme;

  let useDark = theme === 'dark';
  if (theme === 'system') {
    useDark = !window.matchMedia('(prefers-color-scheme: light)').matches;
  }

  html.classList.toggle('light', !useDark);

  // Sync theme-option buttons in settings
  dom.themeOpts.forEach(b => b.classList.toggle('active', b.dataset.theme === theme));

  // Update header toggle icon
  if (dom.themeToggleBtn) {
    dom.themeToggleBtn.textContent = html.classList.contains('light') ? '🌙' : '☀️';
  }

  // Update meta theme-color
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.content = html.classList.contains('light') ? '#f0f0f7' : '#0a0a0f';

  localStorage.setItem('pp_theme', theme);
}

// --- Accent color ---

export function applyAccent(accent) {
  state.currentAccent = accent;
  html.setAttribute('data-accent', accent);
  dom.colorSwatches.forEach(s => s.classList.toggle('active', s.dataset.accent === accent));
  localStorage.setItem('pp_accent', accent);
}

// --- Font size ---

export function applyFontSize(scale) {
  state.currentFontSize = scale;
  html.style.fontSize = (scale * 16) + 'px';
  dom.fontOpts.forEach(b => b.classList.toggle('active', parseFloat(b.dataset.size) === scale));
  localStorage.setItem('pp_fontSize', scale);
}

// --- Background animations ---

export function applyAnimations(enabled) {
  state.animationsEnabled = enabled;
  html.classList.toggle('no-animations', !enabled);
  localStorage.setItem('pp_animations', enabled);
}

// --- Reduced motion ---

export function applyReducedMotion(enabled) {
  state.reducedMotionEnabled = enabled;
  html.classList.toggle('reduced-motion', enabled);
  localStorage.setItem('pp_reducedMotion', enabled);
}

// --- Initialise all appearance settings from state ---

export function initAppearance() {
  applyTheme(state.currentTheme);
  applyAccent(state.currentAccent);
  applyFontSize(state.currentFontSize);
  applyAnimations(state.animationsEnabled);
  applyReducedMotion(state.reducedMotionEnabled);

  // Sync settings checkboxes
  if (dom.animationsEnabled) dom.animationsEnabled.checked = state.animationsEnabled;
  if (dom.reducedMotion)     dom.reducedMotion.checked     = state.reducedMotionEnabled;

  // Listen for OS color-scheme changes when in 'system' mode
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (state.currentTheme === 'system') applyTheme('system');
  });
}
