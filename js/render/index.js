/**
 * @module render/index
 * Barrel file that re-exports every public function from the render submodules.
 * Consumers can import from './render/index.js' (or '../render/index.js')
 * to access any render function.
 */

export { escapeHtml, formatTime } from './utils.js';

export {
  updateRing,
  renderSessionDots,
  updateTimerDisplay,
  updateNextInfo,
  showCelebration,
  showMilestoneCelebration,
  showAffirmation,
} from './timer.js';

export {
  renderHistory,
  renderWeeklyChart,
} from './history.js';

export {
  renderStats,
  renderHeatmap,
  renderRecords,
  renderAchievements,
  renderDailyChallenge,
  renderWeeklySummary,
  renderHourlyChart,
  renderDurationDistribution,
  renderRatingTrend,
  renderDayOfWeekChart,
  renderTaskHistory,
  renderFocusZone,
  renderMoodDistribution,
  renderComplexityFocusChart,
  renderFocusSuggestion,
  renderWeekComparison,
  renderVizThemePicker,
  renderCumulativeFocusGraph,
  renderSessionGapAnalysis,
  renderGoalVsActual,
  setupExportReport,
} from './stats.js';

export {
  renderTaskQueue,
  renderSessionChain,
  renderRecurringTasks,
  renderTaskTemplates,
  spawnRecurringTasks,
  setupDragAndDrop,
} from './tasks.js';

export {
  showToast,
  renderSessionTarget,
  renderFocusScore,
  renderCognitiveLoad,
  checkFocusTrend,
  updateTopStats,
} from './ui.js';

export {
  renderLeaderboard,
  populateProfileSelect,
} from './profiles.js';
