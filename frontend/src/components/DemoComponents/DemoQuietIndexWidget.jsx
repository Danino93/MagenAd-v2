function DemoQuietIndexWidget() {
  // Demo QI data
  const demoQI = {
    qi: 78,
    level: 'good',
    message: 'טוב',
    trend: {
      direction: 'up',
      change: 5
    },
    breakdown: {
      total_clicks: 45230,
      suspicious_clicks: 127,
      clean_clicks: 45103
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#84cc16'; // lime
    if (score >= 40) return '#eab308'; // yellow
    if (score >= 20) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const getLevelEmoji = (level) => {
    switch (level) {
      case 'excellent': return '🟢';
      case 'good': return '🟡';
      case 'warning': return '🟠';
      case 'poor': return '🔴';
      case 'critical': return '🚨';
      default: return '⚪';
    }
  };

  const getTrendIcon = (direction) => {
    if (direction === 'up') return '📈';
    if (direction === 'down') return '📉';
    return '➡️';
  };

  return (
    <div className="glass-strong rounded-2xl border border-white/10 overflow-hidden">
      {/* Demo Badge */}
      <div className="p-2 bg-[var(--color-teal)]/10 border-b border-white/10 text-center">
        <p className="text-xs text-[var(--color-teal)] font-bold">
          🎭 דמו - חברו Google Ads לראות Quiet Index אמיתי
        </p>
      </div>

      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-cyan)] to-[var(--color-purple)] rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Quiet Index™</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                ציון איכות הclicks שלך
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Score */}
      <div className="p-12 text-center">
        {/* Big Score */}
        <div className="mb-8">
          <div 
            className="text-9xl font-bold mb-4"
            style={{ color: getScoreColor(demoQI.qi) }}
          >
            {demoQI.qi}
          </div>
          <div className="text-2xl text-[var(--color-text-secondary)]">
            מתוך 100
          </div>
        </div>

        {/* Level Badge */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="text-4xl">{getLevelEmoji(demoQI.level)}</div>
          <div className="px-6 py-3 glass-strong rounded-full border border-white/10">
            <p className="text-xl font-bold text-white">{demoQI.message}</p>
          </div>
        </div>

        {/* Trend */}
        {demoQI.trend && demoQI.trend.direction !== 'stable' && (
          <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-lg border border-white/10">
            <span className="text-2xl">{getTrendIcon(demoQI.trend.direction)}</span>
            <span className="text-sm text-[var(--color-text-secondary)]">
              {demoQI.trend.direction === 'up' ? 'עלייה' : 'ירידה'} של {demoQI.trend.change} נקודות
            </span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-6 p-6 border-t border-white/10">
        <div className="text-center">
          <div className="text-3xl font-bold text-white mb-2">
            {demoQI.breakdown.total_clicks.toLocaleString('he-IL')}
          </div>
          <div className="text-sm text-[var(--color-text-secondary)]">
            סך הכל קליקים
          </div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-white mb-2">
            {demoQI.breakdown.suspicious_clicks}
          </div>
          <div className="text-sm text-[var(--color-text-secondary)]">
            קליקים חשודים
          </div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-white mb-2">
            {demoQI.breakdown.clean_clicks.toLocaleString('he-IL')}
          </div>
          <div className="text-sm text-[var(--color-text-secondary)]">
            קליקים נקיים
          </div>
        </div>
      </div>
    </div>
  );
}

export default DemoQuietIndexWidget;
