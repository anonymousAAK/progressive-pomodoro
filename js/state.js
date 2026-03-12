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

export const TIMER_PRESETS = {
  micro:    { label: 'Micro',     work: 5,  breakDur: 5,  adjust: 2 },
  classic:  { label: 'Classic',   work: 25, breakDur: 5,  adjust: 2 },
  deepwork: { label: 'Deep Work', work: 50, breakDur: 10, adjust: 5 },
  sprint:   { label: 'Sprint',    work: 15, breakDur: 3,  adjust: 1 },
};
