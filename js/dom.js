// Cached DOM element references — queried once at startup

const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

export const dom = {
  // Timer
  timerDisplay:       $('timer-display'),
  timerMode:          $('timer-mode'),
  timerNextInfo:      $('timer-next-info'),
  ringProgress:       $('ring-progress'),
  startPauseBtn:      $('start-pause-btn'),
  stopBtn:            $('stop-btn'),
  skipBtn:            $('skip-btn'),
  skipBreakWrapper:   $('skip-break-wrapper'),
  skipBreakBtn:       $('skip-break-btn'),
  timerControls:      $('timer-controls'),
  sessionDots:        $('session-dots'),
  taskInput:          $('task-input'),

  // Presets & Categories
  presetsRow:         $('presets-row'),
  categoryRow:        $('category-row'),

  // Distraction counter
  distractionWrapper: $('distraction-wrapper'),
  distractionBtn:     $('distraction-btn'),
  distractionCount:   $('distraction-count'),

  // Focus rating
  focusRating:        $('focus-rating'),
  sessionNoteInput:   $('session-note-input'),

  // Tip section
  tipSection:         $('tip-section'),
  getTipBtn:          $('get-tip-btn'),
  tipDisplay:         $('tip-display'),

  // Challenge
  challengeCard:      $('challenge-card'),
  challengeDesc:      $('challenge-desc'),
  challengeStatus:    $('challenge-status'),

  // History
  historyList:        $('history-list'),
  clearHistoryBtn:    $('clear-history-btn'),
  exportBtn:          $('export-btn'),
  weeklyChart:        $('weekly-chart'),

  // Stats
  totalFocusTime:     $('total-focus-time'),
  totalSessionsStat:  $('total-sessions-stat'),
  avgDuration:        $('avg-duration'),
  bestStreak:         $('best-streak'),
  focusDistribution:  $('focus-distribution'),
  focusLegend:        $('focus-legend'),
  longestSessions:    $('longest-sessions'),
  heatmapGrid:        $('heatmap-grid'),
  recordsGrid:        $('records-grid'),
  achievementsGrid:   $('achievements-grid'),

  // Top stats bar
  streakValue:        $('streak-value'),
  todayMinutes:       $('today-minutes'),
  sessionCount:       $('session-count'),

  // Settings
  initialWork:        $('initial-work'),
  intervalAdjust:     $('interval-adjust'),
  breakDuration:      $('break-duration'),
  longBreakDuration:  $('long-break-duration'),
  soundEnabled:       $('sound-enabled'),
  notifEnabled:       $('notif-enabled'),
  autoBreak:          $('auto-break'),
  autoWork:           $('auto-work'),
  saveSettingsBtn:    $('save-settings-btn'),
  animationsEnabled:  $('animations-enabled'),
  reducedMotion:      $('reduced-motion'),
  backupBtn:          $('backup-btn'),
  restoreInput:       $('restore-input'),

  // Appearance
  colorSwatches:      $$('.color-swatch'),
  themeOpts:          $$('.theme-opt'),
  fontOpts:           $$('.font-opt'),
  ambientBtns:        $$('.ambient-btn'),
  presetBtns:         $$('.preset-btn'),
  categoryChips:      $$('.category-chip'),
  navBtns:            $$('.nav-btn'),
  pages:              $$('.page'),

  // Misc
  saveToast:          $('save-toast'),
  celebration:        $('celebration'),
  themeToggleBtn:     $('theme-toggle-btn'),

  // Feature additions
  countUpToggle:      $('count-up-toggle'),
  sessionTargetRow:   $('session-target-row'),
  sessionTargetText:  $('session-target-text'),
  targetBarFill:      $('target-bar-fill'),
  sessionTargetInput: $('session-target'),
  breakActivityCard:  $('break-activity-card'),
  breakActivityText:  $('break-activity-text'),
  nextActivityBtn:    $('next-activity-btn'),
  intentionInput:     $('intention-input'),
  affirmationOverlay: $('affirmation-overlay'),
  focusModeBtn:       $('focus-mode-btn'),
  quickSwitchWrapper: $('quick-switch-wrapper'),
  quickSwitchInput:   $('quick-switch-input'),
  quickSwitchBtn:     $('quick-switch-btn'),
  xpValue:            $('xp-value'),
  hourlyChart:        $('hourly-chart'),
  dowChart:           $('dow-chart'),
  microBreakEnabled:  $('micro-break-enabled'),

  // New feature elements
  warmupToggle:       $('warmup-toggle'),
  overtimeToggle:     $('overtime-toggle'),
  pauseLimitInput:    $('pause-limit-input'),
  pauseCounter:       $('pause-counter'),
  pausesRemaining:    $('pauses-remaining'),
  lockoutInput:       $('lockout-input'),
  lockoutBadge:       $('lockout-badge'),
  lockoutCount:       $('lockout-count'),
  minSessionInput:    $('min-session-input'),
  winddownToggle:     $('winddown-toggle'),
  winddownTimeInput:  $('winddown-time-input'),
  reflectionPrompt:   $('reflection-prompt'),
  reflectionQuestion: $('reflection-question'),
  cognitiveLoadValue: $('cognitive-load-value'),

  // Chain
  chainSection:       $('chain-section'),
  chainBody:          $('chain-body'),
  chainToggleBtn:     $('chain-toggle-btn'),
  chainDurationInput: $('chain-duration-input'),
  chainTaskInput:     $('chain-task-input'),
  chainAddBtn:        $('chain-add-btn'),
  chainList:          $('chain-list'),
  chainStartBtn:      $('chain-start-btn'),
  chainClearBtn:      $('chain-clear-btn'),

  // Mood & Complexity
  moodBtns:           $$('.mood-btn'),
  complexityStars:    $$('.complexity-star'),

  // Tasks page
  taskEstimateInput:  $('task-estimate-input'),
  saveTemplateBtn:    $('save-template-btn'),
  templateList:       $('template-list'),
  showArchivedToggle: $('show-archived-toggle'),
  recurringTaskInput: $('recurring-task-input'),
  addRecurringBtn:    $('add-recurring-btn'),
  recurringTaskList:  $('recurring-task-list'),
};
