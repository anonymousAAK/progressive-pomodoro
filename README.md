# Progressive Pomodoro

> Adapt. Focus. Flow.

A beautiful, browser-native Pomodoro app that adjusts to your real focus patterns instead of forcing you into a rigid timer. Progressive Pomodoro blends adaptive sessions, task planning, habit tracking, gamification, accessibility, and offline-friendly PWA behavior into one polished experience.

## Why it feels different

Most Pomodoro timers stop at `25/5`.
Progressive Pomodoro keeps evolving with you:

- **Adaptive timing** based on post-session focus ratings
- **Task-aware sessions** with intentions, categories, energy, mood, and complexity
- **Rich progress tracking** with streaks, charts, history, achievements, and levels
- **Motivating extras** like coins, missions, gardens, unlockable themes, and share cards
- **Accessibility-first enhancements** including keyboard shortcuts, screen reader support, colorblind palettes, high contrast, reduced motion, voice controls, and haptics
- **Offline-first usage** through a service worker and installable web app manifest

## Complete feature list

### Timer & session control

| Feature | Detail |
|---|---|
| Adaptive intervals | Work duration automatically increases or decreases after each session based on focus rating |
| Four built-in presets | Micro 5/5 · Classic 25/5 · Deep Work 50/10 · Sprint 15/3 |
| Configurable durations | Initial work time, short break, long break, and adjustment step are all user-defined |
| Long break | Triggers automatically after every 4 completed work sessions |
| Auto-start | Optional auto-start for both breaks and the next work session |
| Count-up mode | Show elapsed time instead of a countdown |
| Warm-up mode | Optional 2-minute warm-up period before the main timer starts |
| Overtime tracking | Allow working beyond timer end and record the extra time |
| Pause limit | Set a maximum number of pauses per session to build discipline |
| Focus lockout | Disable skip and pause for a configurable number of consecutive sessions |
| Session chaining | Queue multiple timed sessions with individual tasks in advance; start the chain and it runs automatically |
| Session target planner | Set a daily session goal and track progress with a progress bar |
| Wind-down mode | Progressively shorter sessions as the configured end-of-day time approaches |
| Minimum session threshold | Sessions shorter than a configurable duration are excluded from stats |
| Half-time chime | Subtle audio cue at the halfway point of a work session |
| Micro-break reminders | 30-second stretch prompt shown mid-session during long intervals |
| Skip controls | Skip the current phase or jump directly to work at any time |
| Timer ring | Animated SVG progress ring that fills as time passes |
| Session dots | Visual cycle indicator showing position within the 4-session pomodoro cycle |
| Timer size | Slider to scale the ring from 60% to 140% of its default size |

### Pre-session workflow

| Feature | Detail |
|---|---|
| Task name | What you are working on, shown on the timer and saved to history |
| Intention setting | Optional free-text field for a session-level micro-goal |
| Energy level | Rate starting energy as Low, Medium, or High before the session |
| Mood tracker | Choose from Happy, Neutral, Sad, Frustrated, or Tired |
| Task category | Tag each session as Work, Study, Creative, Admin, Personal, or Health |
| Task complexity | Rate task difficulty 1–5 stars |
| Focus affirmations | Optional motivational message shown when a session starts |

### During-session features

| Feature | Detail |
|---|---|
| Distraction logger | Tap a counter button to log distractions without stopping the timer |
| Quick task switching | Change the active task mid-session without resetting the timer |
| Break activity suggestions | Curated rest suggestions during breaks with a refresh button |
| Distraction-free mode | One-click fullscreen view that hides all UI except the timer ring |
| Widget mode | Minimal floating overlay that persists over other content |
| Pause counter | Shows remaining pauses when a pause limit is configured |
| Lockout badge | Shows how many sessions remain in the current lockout period |

### Post-session rating & reflection

| Feature | Detail |
|---|---|
| Focus ratings | Four levels: Distracted (shrinks interval) · Okay (no change) · Focused (grows interval) · Flow State (grows interval ×2) |
| Reflection prompts | Rotating reflection question shown before the rating, e.g. "What went well?" |
| Session notes | Optional free-text note saved alongside each session record |
| Custom rating labels | Rename all four rating levels to your own preferred terms |

### Focus intelligence

| Feature | Detail |
|---|---|
| Daily focus score | Computed 0–100 score from today's ratings shown as a banner |
| Cognitive load indicator | Real-time Low / Medium / High indicator based on session count and ratings |
| Focus zone detection | Identifies which hours of the day your sessions tend to perform best |
| Focus improvement suggestions | Personalized tips generated from your historical patterns |

### Task management

| Feature | Detail |
|---|---|
| Task queue | Ordered to-do list that feeds tasks into the timer |
| Priority levels | Tag each queued task as Low, Medium, or High priority |
| Pomodoro estimates | Estimate how many sessions a task will need and track accuracy |
| Task archiving | Archive completed tasks; toggle archived items on or off |
| Task templates | Save frequently used task configurations and re-apply with one click |
| Recurring tasks | Assign tasks to specific days of the week; they auto-appear each morning |

### History

| Feature | Detail |
|---|---|
| Session list | Every completed session with task, duration, rating, category, mood, and timestamp |
| Weekly chart | Bar chart of daily session counts for the current week |
| CSV export | Download full history as a comma-separated file |
| CSV import | Merge sessions from an external CSV file |
| Clear history | Wipe all recorded sessions with one button |

### Statistics & analytics

| Feature | Detail |
|---|---|
| Summary stats | Total focus time, total sessions, average duration, best streak |
| Focus distribution | Visual breakdown of session counts by rating |
| Weekly summary | Auto-generated text description of this week's performance |
| 35-day heatmap | Calendar-style grid showing focus intensity per day |
| Focus by hour chart | Bar chart of sessions per hour of day |
| Day-of-week chart | Average focus output for each day of the week |
| Rating trend line | 14-day SVG line chart of rating values |
| Duration distribution | Histogram of session lengths |
| Time by task | Total time logged per unique task name |
| Personal records | Longest session, most sessions in a day, longest streak |
| Longest sessions list | Top sessions ranked by duration |
| Focus zone | Best focus hours highlighted from your historical data |
| Mood distribution | Breakdown of session counts by starting mood |
| Complexity vs focus | Correlation chart between task complexity and focus rating |
| Week comparison | Side-by-side stats for this week and last week |
| Cumulative focus time | Running total focus time plotted as an SVG area chart |
| Session gap analysis | Time between sessions to identify procrastination patterns |
| Goal vs actual | Planned session targets compared against actual completions |
| Chart color schemes | Multiple visualization palette options |
| Export stats as image | Download a visual stats summary card as a PNG file |

### Achievements

Ten built-in achievements that unlock based on your real history:

| Badge | Condition |
|---|---|
| 🌱 First Step | Complete your first session |
| 🎩 Hat Trick | 3 sessions in one day |
| 🌊 Flow Master | 10 flow-state sessions |
| ⚔️ Week Warrior | 7-day streak |
| 🏃 Marathon | Complete a 45+ minute session |
| 💯 Century | 100 total sessions |
| 🌅 Early Bird | Start a session before 8 am |
| 🦉 Night Owl | Start a session after 10 pm |
| 🏆 Focus God | 24 total hours of focus |
| ✨ Perfectionist | 5 consecutive flow-state sessions |

### Gamification

| Feature | Detail |
|---|---|
| XP system | Earn experience points per session, weighted by duration and rating |
| Level progression | Advance levels as XP accumulates; displayed in the header |
| Focus coins | Virtual currency earned per session, shown in the header |
| Session multiplier | Consecutive high-focus sessions activate a bonus XP/coin multiplier |
| Daily challenges | A new random focus challenge each day with progress tracking |
| Weekly missions | Longer-term goals that reset every Monday |
| Focus garden | Grid of emoji plants where each emoji reflects the rating of a recent session |
| Progress timeline | Milestone markers on a visual journey from your first session to now |
| Streak shields | Earned every 7 consecutive days (max 3 held); each shield covers one missed day without breaking your streak |
| Unlockable themes | Cosmetic themes that unlock upon reaching specific achievements |

### Sharing & social

| Feature | Detail |
|---|---|
| Share daily summary | Download a styled PNG card with today's key stats |
| Share weekly digest | Download a styled PNG card with this week's performance |
| Share achievements | Download a styled PNG badge card for any unlocked achievement |
| Focus challenge | Copy an encoded string of your stats; others paste it for a side-by-side comparison |
| Leaderboard | Multiple named profiles on the same device with ranking view |

### Data & integrations

| Feature | Detail |
|---|---|
| JSON backup | Export a full data snapshot (settings, history, profiles) as a JSON file |
| JSON restore | Import a backup JSON file to fully restore data |
| iCal export | Download all sessions as an .ics calendar file |
| Webhook | Configure a URL to receive a POST payload after every completed session |
| Hash API | Navigate to `#api/sessions` or `#api/stats` to open JSON data in a new tab |
| Multi-tab sync | Timer state is synchronized across browser tabs via BroadcastChannel |

### Accessibility

| Feature | Detail |
|---|---|
| Screen reader support | Full ARIA labels, roles, and a live region that announces timer state changes |
| Keyboard navigation | Space starts/pauses, R resets, S skips; all controls are keyboard-reachable |
| High contrast mode | WCAG AAA-level contrast ratios applied throughout |
| Colorblind palettes | Deuteranopia, Protanopia, and Tritanopia safe palettes selectable in settings |
| Reduced motion | Disables all CSS transitions and animations |
| Voice control | Continuous speech recognition for start, pause, stop, reset, and skip commands |
| Haptic feedback | Vibration patterns on mobile for button presses and timer end |
| Tooltip help system | Contextual tooltips on first use explaining each feature |
| Onboarding tutorial | Step-by-step guided tour for new users |
| Multi-language support | English (en) and Spanish (es) with full UI string coverage |
| RTL layout | Correct right-to-left layout when an RTL language is selected (Arabic, Hebrew, Farsi, Urdu) |

### Customization & appearance

| Feature | Detail |
|---|---|
| Theme | Dark, light, or system-auto |
| Accent color | 7 choices: Indigo · Purple · Blue · Teal · Green · Rose · Orange |
| Font size | 4 scale steps: S, M, L, XL |
| Background animations | Toggle the floating orb effects on or off |
| Background style | 6 gradient presets: Warm · Cool · Forest · Sunset · Ocean, plus solid and none |
| Timer font | 4 styles: Mono · Sans · Serif · Display |
| Notification sound | 6 options: Default · Bell · Chime · Ding · Gong · Marimba |
| Ambient sounds | White noise · Rain · Lo-fi pads · Off |
| UI density | Compact · Normal · Spacious |
| Celebration style | Confetti · Fireworks · Sparkles · None |
| Timer ring size | Continuous slider from 60% to 140% |
| Seasonal theme | Automatic color tint that changes with the current season |
| Unlockable themes | Additional theme variants unlocked via achievements |

### Profiles

| Feature | Detail |
|---|---|
| Multiple profiles | Create named profiles on the same device, each with isolated history, streaks, XP, coins, tasks, and achievements |
| Profile switching | Switch active profile from the Settings page |
| Profile deletion | Delete any non-default profile |

### Technical & platform

| Feature | Detail |
|---|---|
| Progressive Web App | Web manifest + service worker = installable, offline-capable app |
| Offline-first | Cache-first service worker strategy; app works without a network connection |
| Desktop notifications | Browser notifications at session end with actionable buttons (Start Break, Skip Break, Start Work) |
| Widget mode | Compact always-on timer overlay |
| Performance mode | Disables animations and reduces render frequency for low-power devices |

## Getting started

This project is a **static web app** built with HTML, CSS, and modern ES modules. No backend is required.

### Run locally

From the repository root, start any simple static server:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

You can also use any equivalent static server, such as `npx serve .`.

### Install as an app

Because the project includes a web manifest and service worker, you can install it from a supported browser as a lightweight desktop or mobile PWA.

## How to use it

1. Pick a preset or customize your durations.
2. Enter a task and optional intention.
3. Start a focus session.
4. Rate your focus when the session ends.
5. Let the app adapt your next interval and keep building streaks, stats, and rewards.

## Keyboard shortcuts

- `Space` — start / pause
- `R` — reset
- `S` — skip to work

## Voice commands

When voice control is enabled, the app listens for simple commands such as:

- `start`
- `pause`
- `stop`
- `reset`
- `skip`

## Project structure

```text
.
├── index.html          # Main application shell
├── manifest.json       # PWA metadata
├── sw.js               # Service worker for offline caching
├── css/                # UI layers: base, themes, timer, stats, tasks, accessibility, etc.
├── js/
│   ├── events/         # Event registration and UI interaction handlers
│   ├── features/       # Accessibility, sharing, voice, haptics, integrations, widget, performance
│   ├── render/         # Rendering logic for timer, history, stats, tasks, profiles, UI
│   ├── main.js         # Application bootstrap
│   ├── state.js        # Shared app state and static data
│   ├── storage.js      # localStorage persistence, backup, import/export
│   ├── timer.js        # Timer behavior and mode switching
│   └── ...
└── FEATURES.md         # Feature backlog and product ideas
```

## Data and privacy

Progressive Pomodoro stores data locally in your browser using `localStorage`. That includes settings, session history, streaks, achievements, profiles, and related app state.

Optional export, backup, and webhook features are user-triggered.

## Tech stack

- HTML5
- CSS3
- Vanilla JavaScript (ES modules)
- Browser APIs: Notifications, Service Workers, Web Speech, Vibration, Canvas, localStorage, BroadcastChannel

## Roadmap

A large backlog of product ideas lives in [`FEATURES.md`](./FEATURES.md), covering future timer mechanics, analytics, social features, integrations, accessibility, and platform improvements.

## Contributing

If you want to improve the app, good contribution areas include:

- UI polish and responsiveness
- Performance improvements
- Accessibility refinements
- New focus workflows
- Better analytics and exports
- Additional integrations and languages

---

Built for people who want a Pomodoro timer with more personality, more feedback, and more room to grow.
