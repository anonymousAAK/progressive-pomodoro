// Central mutable state — imported and mutated by all other modules

export const RING_CIRCUMFERENCE = 2 * Math.PI * 116; // ~729.12
export const POMODOROS_BEFORE_LONG_BREAK = 4;

// All mutable app state lives here so modules can share it without circular deps.
// ES modules export live bindings for primitives only, so we use a single object.
export const state = {
  // Timer
  timerInterval: null,
  totalSeconds: 0,
  secondsLeft: 0,
  currentMode: 'work', // 'work' | 'break' | 'longbreak'
  lastFocusRating: '',
  halfTimeChimed: false,

  // Session
  currentTask: '',
  currentCategory: '',
  distractionCount: 0,
  completedPomodoros: 0,

  // Settings — durations in seconds
  workDuration: 5 * 60,
  intervalAdjust: 2 * 60,
  breakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  soundEnabled: true,
  notifEnabled: false,
  autoBreak: true,
  autoWork: false,

  // Appearance
  currentTheme: 'dark',   // 'dark' | 'light' | 'system'
  currentAccent: 'indigo',
  currentFontSize: 1,
  animationsEnabled: true,
  reducedMotionEnabled: false,

  // Ambient sound
  currentAmbient: 'none',
  ambientSource: null,
  ambientGain: null,
  lofiTimeout: null,

  // Data
  sessionHistory: [],
  streakData: { current: 0, best: 0, lastDate: null },
  unlockedAchievements: [],

  // Feature: count-up toggle (#1)
  countUp: false,

  // Feature: session target planner (#2)
  sessionTarget: 0,

  // Feature: micro-break reminders (#3)
  microBreakEnabled: true,
  microBreakShown: false,

  // Feature: energy level tracker (#4)
  currentEnergy: '',

  // Feature: intention setting (#6)
  currentIntention: '',

  // Feature: affirmations (#7)
  affirmationsEnabled: true,

  // Feature: distraction-free mode (#8)
  isFocusMode: false,

  // Feature: XP + Level system (#10)
  xp: 0,
  level: 1,

  // Feature: streak shields (#11)
  streakShields: 0,

  // Task queue (#19)
  taskQueue: [],
  nextTaskId: 1,

  // Feature: Warm-up mode (#2)
  warmUpEnabled: false,
  isWarmUp: false,

  // Feature: Overtime tracking (#3)
  overtimeEnabled: false,
  isOvertime: false,
  overtimeSeconds: 0,

  // Feature: Pause limit (#4)
  pauseLimit: -1, // -1 = unlimited
  pausesUsed: 0,

  // Feature: Variable break scaling (#8)
  actualWorkSeconds: 0, // track actual work time for break scaling

  // Feature: Focus lockout mode (#9)
  lockoutSessions: 0, // N consecutive sessions to lock
  lockoutRemaining: 0, // remaining sessions in lockout

  // Feature: Session chaining (#11)
  sessionChain: [], // [{duration, task, done}]
  chainIndex: -1,

  // Feature: Minimum session threshold (#12)
  minSessionMinutes: 5,

  // Feature: End-of-day wind-down (#15)
  windDownEnabled: false,
  windDownTime: '18:00',
  windDownSessionsInWindow: 0,

  // Feature: Mood tracker (#21)
  currentMood: '',

  // Feature: Task complexity (#28)
  currentComplexity: 0,

  // Feature: Cognitive load (#29) - computed from today's sessions

  // Feature: Recurring tasks (#33)
  recurringTasks: [],
  nextRecurringId: 1,

  // Feature: Task templates (#39)
  taskTemplates: [],
  nextTemplateId: 1,

  // Feature: Task archiving (#40)
  showArchived: false,

  // Feature: Reflection prompts (#25)
  lastReflectionIndex: -1,

  // Feature: Daily suggestion shown (#30)
  lastSuggestionDate: '',

  // Feature: Visualization theme (#51)
  vizTheme: 'default',

  // Feature: Custom background images (#63)
  backgroundStyle: 'none', // 'none' | 'gradient-warm' | 'gradient-cool' | 'gradient-forest' | 'gradient-sunset' | 'gradient-ocean' | 'solid-dark' | 'solid-light'

  // Feature: Timer font selection (#64)
  timerFont: 'mono', // 'mono' | 'sans' | 'serif' | 'display'

  // Feature: Custom notification sounds (#66)
  notificationSound: 'default', // 'default' | 'bell' | 'chime' | 'ding' | 'gong' | 'marimba'

  // Feature: UI density options (#68)
  uiDensity: 'comfortable', // 'compact' | 'comfortable' | 'spacious'

  // Feature: Custom focus rating labels (#69)
  focusLabels: { distracted: 'Distracted', okay: 'Okay', focused: 'Focused', flow: 'Flow State' },

  // Feature: Celebration animation options (#70)
  celebrationStyle: 'confetti', // 'confetti' | 'fireworks' | 'sparkles' | 'none'

  // Feature: Timer size adjustment (#71)
  timerScale: 1.0, // 0.6 to 1.4

  // Feature: Seasonal themes (#72)
  seasonalThemeEnabled: true,
};

// --- Static data ---

export const ACHIEVEMENTS = [
  {
    id: 'first_session', icon: '🌱', name: 'First Step', desc: 'Complete your first session',
    check: (h, s) => h.length >= 1,
  },
  {
    id: 'hat_trick', icon: '🎩', name: 'Hat Trick', desc: '3 sessions in one day',
    check: (h) => { const t = new Date().toDateString(); return h.filter(x => x.date === t).length >= 3; },
  },
  {
    id: 'flow_master', icon: '🌊', name: 'Flow Master', desc: '10 flow-state sessions',
    check: (h) => h.filter(x => x.rating === 'Flow').length >= 10,
  },
  {
    id: 'week_warrior', icon: '⚔️', name: 'Week Warrior', desc: '7-day streak',
    check: (h, s) => s.best >= 7,
  },
  {
    id: 'marathon', icon: '🏃', name: 'Marathon', desc: 'Complete a 45+ min session',
    check: (h) => h.some(x => x.duration >= 45),
  },
  {
    id: 'century', icon: '💯', name: 'Century', desc: '100 total sessions',
    check: (h) => h.length >= 100,
  },
  {
    id: 'early_bird', icon: '🌅', name: 'Early Bird', desc: 'Start a session before 8 am',
    check: (h) => h.some(x => { try { return new Date(x.timestamp).getHours() < 8; } catch { return false; } }),
  },
  {
    id: 'night_owl', icon: '🦉', name: 'Night Owl', desc: 'Start a session after 10 pm',
    check: (h) => h.some(x => { try { return new Date(x.timestamp).getHours() >= 22; } catch { return false; } }),
  },
  {
    id: 'focus_god', icon: '🏆', name: 'Focus God', desc: '24 total hours of focus',
    check: (h) => h.reduce((sum, x) => sum + x.duration, 0) >= 1440,
  },
  {
    id: 'perfectionist', icon: '✨', name: 'Perfectionist', desc: '5 consecutive flow sessions',
    check: (h) => {
      let streak = 0;
      for (const x of h) {
        if (x.rating === 'Flow') { streak++; if (streak >= 5) return true; }
        else streak = 0;
      }
      return false;
    },
  },
];

export const DAILY_CHALLENGES = [
  {
    desc: 'Complete 4 sessions today',
    check: h => { const t = new Date().toDateString(); return h.filter(x => x.date === t).length >= 4; },
  },
  {
    desc: 'Rate every session today as Focused or Flow',
    check: h => { const t = new Date().toDateString(); const td = h.filter(x => x.date === t); return td.length > 0 && td.every(x => ['Focused', 'Flow'].includes(x.rating)); },
  },
  {
    desc: 'Log 60+ minutes of focus today',
    check: h => { const t = new Date().toDateString(); return h.filter(x => x.date === t).reduce((s, x) => s + x.duration, 0) >= 60; },
  },
  {
    desc: 'Label every session with a task name today',
    check: h => { const t = new Date().toDateString(); const td = h.filter(x => x.date === t); return td.length > 0 && td.every(x => x.task && x.task !== 'Untitled'); },
  },
  {
    desc: 'Achieve flow state at least once today',
    check: h => { const t = new Date().toDateString(); return h.some(x => x.date === t && x.rating === 'Flow'); },
  },
  {
    desc: 'Complete 2 sessions before noon',
    check: h => { const t = new Date().toDateString(); return h.filter(x => x.date === t && new Date(x.timestamp).getHours() < 12).length >= 2; },
  },
  {
    desc: 'Complete 3 sessions with zero distractions',
    check: h => { const t = new Date().toDateString(); return h.filter(x => x.date === t && (x.distractions || 0) === 0).length >= 3; },
  },
];

export const MILESTONES = new Set([1, 5, 10, 25, 50, 100, 250, 500]);

export function calculateXP(durationMin, rating) {
  const ratingBonus = { distracted: 0, okay: 5, focused: 15, flow: 30 }[rating] || 0;
  return 10 + Math.floor(durationMin * 2) + ratingBonus;
}

export const BREAK_ACTIVITIES = [
  'Do 10 shoulder rolls',
  'Drink a glass of water',
  'Stand up and stretch for 60 seconds',
  'Look out a window for 20 seconds',
  'Take 5 deep breaths',
  'Walk around for 2 minutes',
  'Rest your eyes — close them for 30 seconds',
  'Step outside for fresh air if possible',
  'Do a quick neck and shoulder massage',
  'Tidy one small area of your desk',
];

export const AFFIRMATIONS = [
  'Deep work creates deep value.',
  'One focused session at a time.',
  'Your future self thanks you.',
  'Progress, not perfection.',
  'Clarity comes through action.',
  'Small steps, big results.',
  'You are capable of this.',
  'This session matters.',
  'Quiet the noise. Find the flow.',
  'Every minute of focus counts.',
];

export const REFLECTION_PROMPTS = [
  'What went well during this session?',
  'What distracted you the most?',
  'How could you improve your next session?',
  'Did you accomplish what you set out to do?',
  'What was your biggest win this session?',
  'Were there any unexpected challenges?',
  'How does your energy feel right now?',
  'What would you do differently next time?',
  'Did you maintain your focus throughout?',
  'What are you most proud of from this session?',
  'Was your task well-defined before starting?',
  'Did your environment support your focus?',
];

export const MOOD_OPTIONS = [
  { emoji: '\u{1F60A}', label: 'Happy', value: 'happy' },
  { emoji: '\u{1F610}', label: 'Neutral', value: 'neutral' },
  { emoji: '\u{1F614}', label: 'Sad', value: 'sad' },
  { emoji: '\u{1F624}', label: 'Frustrated', value: 'frustrated' },
  { emoji: '\u{1F634}', label: 'Tired', value: 'tired' },
];

export const TIMER_PRESETS = {
  micro:    { label: 'Micro',     work: 5,  breakDur: 5,  adjust: 2 },
  classic:  { label: 'Classic',   work: 25, breakDur: 5,  adjust: 2 },
  deepwork: { label: 'Deep Work', work: 50, breakDur: 10, adjust: 5 },
  sprint:   { label: 'Sprint',    work: 15, breakDur: 3,  adjust: 1 },
};
