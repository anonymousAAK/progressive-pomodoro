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

## Feature highlights

### Core timer
- Progressive work intervals that adapt over time
- Micro, Classic, Deep Work, and Sprint presets
- Auto-start options for work and breaks
- Count-up mode, warm-up mode, overtime tracking, and pause limits
- Long breaks, skip controls, and distraction logging
- Session chaining and session target planning

### Focus workflow
- Task name, intention, category, mood, energy, and complexity before you start
- Post-session reflection prompts and focus ratings
- Focus score banner and cognitive load indicator
- Break activity suggestions and optional affirmations
- Distraction-free focus mode and widget mode

### Tasks and planning
- Task queue management
- Recurring tasks
- Task templates
- Task archiving support
- Quick task switching during active sessions

### Stats and insights
- Session history and weekly charts
- Focus distribution and summary stats
- Streak tracking and personal progress
- Achievements, XP, levels, coins, and multipliers
- Weekly missions, focus garden, and progress timeline

### Sharing, export, and integrations
- PNG share cards for daily summaries, achievements, and weekly digests
- CSV export/import for session history
- JSON backup and restore
- iCal export for session history
- Optional webhook posting for completed sessions
- Hash-based local API views for sessions and stats

### Accessibility and customization
- Light, dark, and system-aware appearance behavior
- Accent colors, density, font scaling, timer fonts, and timer sizing
- Seasonal themes, custom backgrounds, and celebration styles
- High contrast and colorblind-friendly palettes
- Screen reader announcements and strong keyboard support
- Voice control and haptic feedback where supported
- English and Spanish UI strings, with RTL-aware layout handling

## Getting started

This project is a **static web app** built with HTML, CSS, and modern ES modules. No backend is required.

### Run locally

Use any simple static server from the repository root:

```bash
cd /home/runner/work/progressive-pomodoro/progressive-pomodoro
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
- performance improvements
- accessibility refinements
- new focus workflows
- better analytics and exports
- additional integrations and languages

---

Built for people who want a Pomodoro timer with more personality, more feedback, and more room to grow.
