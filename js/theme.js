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

  // Smooth theme transition
  document.body.classList.add('theme-transitioning');
  html.classList.toggle('light', !useDark);
  setTimeout(() => document.body.classList.remove('theme-transitioning'), 350);

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

// --- Custom background style (#63) ---

export function applyBackground(style) {
  state.backgroundStyle = style;
  // Remove all bg-style classes
  html.className = html.className.replace(/\bbg-style-\S+/g, '').trim();
  if (style && style !== 'none') {
    html.classList.add(`bg-style-${style}`);
  }
  dom.backgroundOpts.forEach(b => b.classList.toggle('active', b.dataset.bg === style));
  localStorage.setItem('pp_background', style);
}

// --- Timer font selection (#64) ---

export function applyTimerFont(font) {
  state.timerFont = font;
  html.setAttribute('data-timer-font', font);
  dom.timerFontOpts.forEach(b => b.classList.toggle('active', b.dataset.font === font));
  localStorage.setItem('pp_timerFont', font);
}

// --- Notification sound (#66) ---

export function applyNotificationSound(sound) {
  state.notificationSound = sound;
  dom.notifSoundOpts.forEach(b => b.classList.toggle('active', b.dataset.sound === sound));
  localStorage.setItem('pp_notifSound', sound);
}

// --- UI density (#68) ---

export function applyDensity(density) {
  state.uiDensity = density;
  html.setAttribute('data-density', density);
  dom.densityOpts.forEach(b => b.classList.toggle('active', b.dataset.density === density));
  localStorage.setItem('pp_density', density);
}

// --- Custom focus labels (#69) ---

export function applyFocusLabels(labels) {
  state.focusLabels = { ...state.focusLabels, ...labels };
  // Update the focus rating button text
  const btnMap = {
    distracted: '[data-rating="distracted"]',
    okay: '[data-rating="okay"]',
    focused: '[data-rating="focused"]',
    flow: '[data-rating="flow"]',
  };
  for (const [key, selector] of Object.entries(btnMap)) {
    const btn = document.querySelector(`.focus-btn${selector}`);
    if (btn) {
      // The button structure: emoji span, text node, effect span
      const nodes = btn.childNodes;
      for (const node of nodes) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
          node.textContent = state.focusLabels[key];
          break;
        }
      }
    }
  }
  localStorage.setItem('pp_focusLabels', JSON.stringify(state.focusLabels));
}

// --- Celebration style (#70) ---

export function applyCelebrationStyle(style) {
  state.celebrationStyle = style;
  dom.celebrationOpts.forEach(b => b.classList.toggle('active', b.dataset.celebration === style));
  localStorage.setItem('pp_celebrationStyle', style);
}

// --- Timer size (#71) ---

export function applyTimerScale(scale) {
  state.timerScale = scale;
  const wrapper = dom.timerRingWrapper;
  if (wrapper) {
    const size = Math.round(260 * scale);
    wrapper.style.width = size + 'px';
    wrapper.style.height = size + 'px';
  }
  if (dom.timerScaleValue) dom.timerScaleValue.textContent = Math.round(scale * 100) + '%';
  localStorage.setItem('pp_timerScale', scale);
}

// --- Seasonal themes (#72) ---

export function getSeasonalSeason() {
  const month = new Date().getMonth(); // 0-11
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

export function applySeasonalTheme(enabled) {
  state.seasonalThemeEnabled = enabled;
  html.className = html.className.replace(/\bseason-\S+/g, '').trim();
  if (enabled) {
    html.classList.add(`season-${getSeasonalSeason()}`);
  }
  localStorage.setItem('pp_seasonalTheme', enabled);
}

// --- System theme detection (#60) ---
// Already handled by the 'system' option in applyTheme and the matchMedia listener.
// The Auto button triggers applyTheme('system') which uses matchMedia internally.

// --- Initialise all appearance settings from state ---

export function initAppearance() {
  applyTheme(state.currentTheme);
  applyAccent(state.currentAccent);
  applyFontSize(state.currentFontSize);
  applyAnimations(state.animationsEnabled);
  applyReducedMotion(state.reducedMotionEnabled);

  // Batch 4 customization
  applyBackground(state.backgroundStyle);
  applyTimerFont(state.timerFont);
  applyNotificationSound(state.notificationSound);
  applyDensity(state.uiDensity);
  applyFocusLabels(state.focusLabels);
  applyCelebrationStyle(state.celebrationStyle);
  applyTimerScale(state.timerScale);
  applySeasonalTheme(state.seasonalThemeEnabled);

  // Sync settings checkboxes
  if (dom.animationsEnabled) dom.animationsEnabled.checked = state.animationsEnabled;
  if (dom.reducedMotion)     dom.reducedMotion.checked     = state.reducedMotionEnabled;
  if (dom.seasonalToggle)    dom.seasonalToggle.checked    = state.seasonalThemeEnabled;
  if (dom.timerScaleSlider)  dom.timerScaleSlider.value    = state.timerScale;

  // Sync focus label inputs
  if (dom.focusLabelDistracted) dom.focusLabelDistracted.value = state.focusLabels.distracted;
  if (dom.focusLabelOkay)       dom.focusLabelOkay.value       = state.focusLabels.okay;
  if (dom.focusLabelFocused)    dom.focusLabelFocused.value    = state.focusLabels.focused;
  if (dom.focusLabelFlow)       dom.focusLabelFlow.value       = state.focusLabels.flow;

  // Listen for OS color-scheme changes when in 'system' mode (#60)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (state.currentTheme === 'system') applyTheme('system');
  });
}
