/**
 * Internationalization (i18n)
 *
 * Multi-language support (#104) with RTL detection (#105).
 * Currently supports English and Spanish. Uses a simple key-value
 * lookup with fallback to English for missing translations.
 *
 * @module js/i18n
 */

/**
 * i18n singleton with translation strings and language management.
 * @type {{currentLang: string, strings: Object, t: Function, setLang: Function, loadLang: Function}}
 */
export const i18n = {
  /** @type {string} Current language code */
  currentLang: 'en',

  strings: {
    en: {
      appTitle: 'Progressive Pomodoro',
      subtitle: 'Adapt. Focus. Flow.',
      dayStreak: 'Day Streak',
      today: 'Today',
      sessions: 'Sessions',
      level: 'Level',
      timer: 'Timer',
      history: 'History',
      stats: 'Stats',
      tasks: 'Tasks',
      settings: 'Settings',
      start: 'Start',
      pause: 'Pause',
      resume: 'Resume',
      work: 'Work',
      break: 'Break',
      longBreak: 'Long Break',
      howWasFocus: 'How was your focus?',
      adjustsNext: 'This adjusts your next work interval',
      distracted: 'Distracted',
      okay: 'Okay',
      focused: 'Focused',
      flowState: 'Flow State',
      whatWorking: 'What are you working on?',
      setIntention: 'Set your intention for this session... (optional)',
      energy: 'Energy:',
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      dailyChallenge: 'Daily Challenge',
      inProgress: 'In progress',
      complete: 'Complete!',
      statistics: 'Statistics',
      totalFocusTime: 'Total Focus Time',
      totalSessions: 'Total Sessions',
      avgDuration: 'Avg Duration',
      bestStreak: 'Best Streak',
      focusDistribution: 'Focus Distribution',
      weeklySummary: 'Weekly Summary',
      last35Days: 'Last 35 Days',
      achievements: 'Achievements',
      settingsSaved: 'Settings saved!',
      exportCSV: 'Export CSV',
      clear: 'Clear',
      thisWeek: 'This Week',
      recentSessions: 'Recent Sessions',
      noSessionsYet: 'No sessions yet. Start your first pomodoro!',
      timerSettings: 'Timer',
      notifications: 'Notifications',
      appearance: 'Appearance',
      soundAlerts: 'Sound Alerts',
      browserNotif: 'Browser Notifications',
      autoStartBreaks: 'Auto-start Breaks',
      autoStartWork: 'Auto-start Work',
      save: 'Save Settings',
      missions: 'Weekly Missions',
      focusGarden: 'Focus Garden',
      focusCoins: 'Focus Coins',
      coins: 'coins',
      multiplier: 'Multiplier',
      timeline: 'Progress Timeline',
      share: 'Share',
      shareWeek: 'Share Week',
      copyChallenge: 'Copy Challenge',
      pasteChallenge: 'Paste & Compare',
      accessibility: 'Accessibility',
      highContrast: 'High Contrast',
      colorblindMode: 'Colorblind Mode',
      voiceControl: 'Voice Control',
      hapticFeedback: 'Haptic Feedback',
      language: 'Language',
      performanceMode: 'Performance Mode',
      widgetMode: 'Widget Mode',
      webhookUrl: 'Webhook URL',
      data: 'Data',
      icalDownload: 'Download iCal',
    },
    es: {
      appTitle: 'Pomodoro Progresivo',
      subtitle: 'Adapta. Enfoca. Fluye.',
      dayStreak: 'Racha',
      today: 'Hoy',
      sessions: 'Sesiones',
      level: 'Nivel',
      timer: 'Temporizador',
      history: 'Historial',
      stats: 'Estadísticas',
      tasks: 'Tareas',
      settings: 'Ajustes',
      start: 'Iniciar',
      pause: 'Pausa',
      resume: 'Reanudar',
      work: 'Trabajo',
      break: 'Descanso',
      longBreak: 'Descanso Largo',
      howWasFocus: '¿Cómo fue tu enfoque?',
      adjustsNext: 'Esto ajusta tu próximo intervalo de trabajo',
      distracted: 'Distraído',
      okay: 'Normal',
      focused: 'Enfocado',
      flowState: 'Estado de Flujo',
      whatWorking: '¿En qué estás trabajando?',
      setIntention: 'Establece tu intención para esta sesión... (opcional)',
      energy: 'Energía:',
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
      dailyChallenge: 'Desafío Diario',
      inProgress: 'En progreso',
      complete: '¡Completado!',
      statistics: 'Estadísticas',
      totalFocusTime: 'Tiempo Total de Enfoque',
      totalSessions: 'Sesiones Totales',
      avgDuration: 'Duración Promedio',
      bestStreak: 'Mejor Racha',
      focusDistribution: 'Distribución de Enfoque',
      weeklySummary: 'Resumen Semanal',
      last35Days: 'Últimos 35 Días',
      achievements: 'Logros',
      settingsSaved: '¡Ajustes guardados!',
      exportCSV: 'Exportar CSV',
      clear: 'Borrar',
      thisWeek: 'Esta Semana',
      recentSessions: 'Sesiones Recientes',
      noSessionsYet: 'Sin sesiones aún. ¡Inicia tu primer pomodoro!',
      timerSettings: 'Temporizador',
      notifications: 'Notificaciones',
      appearance: 'Apariencia',
      soundAlerts: 'Alertas de Sonido',
      browserNotif: 'Notificaciones del Navegador',
      autoStartBreaks: 'Inicio Automático de Descansos',
      autoStartWork: 'Inicio Automático de Trabajo',
      save: 'Guardar Ajustes',
      missions: 'Misiones Semanales',
      focusGarden: 'Jardín de Enfoque',
      focusCoins: 'Monedas de Enfoque',
      coins: 'monedas',
      multiplier: 'Multiplicador',
      timeline: 'Línea de Progreso',
      share: 'Compartir',
      shareWeek: 'Compartir Semana',
      copyChallenge: 'Copiar Desafío',
      pasteChallenge: 'Pegar y Comparar',
      accessibility: 'Accesibilidad',
      highContrast: 'Alto Contraste',
      colorblindMode: 'Modo Daltónico',
      voiceControl: 'Control por Voz',
      hapticFeedback: 'Retroalimentación Háptica',
      language: 'Idioma',
      performanceMode: 'Modo Rendimiento',
      widgetMode: 'Modo Widget',
      webhookUrl: 'URL de Webhook',
      data: 'Datos',
      icalDownload: 'Descargar iCal',
    },
  },

  t(key) {
    return this.strings[this.currentLang]?.[key] || this.strings.en[key] || key;
  },

  setLang(lang) {
    this.currentLang = lang;
    localStorage.setItem('pp_lang', lang);
    // Update dir attribute for RTL support (#105)
    const rtlLangs = ['ar', 'he', 'fa', 'ur'];
    if (rtlLangs.includes(lang)) {
      document.documentElement.setAttribute('dir', 'rtl');
      document.getElementById('app')?.classList.add('rtl-mode');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
      document.getElementById('app')?.classList.remove('rtl-mode');
    }
  },

  loadLang() {
    const saved = localStorage.getItem('pp_lang') || 'en';
    this.setLang(saved);
  },
};
