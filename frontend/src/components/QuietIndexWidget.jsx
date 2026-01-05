/*
 * QuietIndeמציגה את ה-QI Score בצורה ויזואלית גדולה עם צבעים, רמה, ו-trend. כולל כפתור לחישוב מחדש.
xWidget.jsx
 * 
 * Widget להצגת Quiet Index™ Score
 * מציג:
 * - QI Score (0-100) עם צבע
 * - Level (Excellent/Good/Warning/Poor/Critical)
 * - Trend (עולה/יורד/יציב)
 * - Breakdown של detections
 * - כפתור Recalculate
 */

import { useState, useEffect } from 'react';

function QuietIndexWidget({ accountId }) {
  const [qi, setQi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    if (!accountId) {
      setLoading(false);
      return;
    }
    loadQI();

    // Auto-refresh every 5 minutes
    const interval = setInterval(loadQI, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [accountId]);

  const loadQI = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3001/api/qi/${accountId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) throw new Error('Failed to load QI');

      const data = await response.json();
      setQi(data.qi);
      setLoading(false);
    } catch (error) {
      console.error('Error loading QI:', error);
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    setCalculating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3001/api/qi/${accountId}/calculate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ days: 7 })
        }
      );

      if (!response.ok) throw new Error('Failed to calculate QI');

      const data = await response.json();
      setQi(data.qi);
      alert('✅ Quiet Index חושב מחדש בהצלחה!');
    } catch (error) {
      console.error('Error calculating QI:', error);
      alert('❌ שגיאה בחישוב Quiet Index');
    } finally {
      setCalculating(false);
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

  if (!accountId) {
    return (
      <div className="glass-strong rounded-2xl p-12 border border-white/10 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[var(--color-cyan)] to-[var(--color-purple)] rounded-full flex items-center justify-center opacity-50">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">📊 Quiet Index™</h3>
        <p className="text-[var(--color-text-secondary)] mb-4">
          Quiet Index™ הוא ציון איכות הקליקים שלך (0-100):
        </p>
        <div className="flex justify-center gap-4 mb-6 text-sm">
          <div className="glass rounded-lg p-3 border border-white/10">
            <div className="text-2xl mb-1">🟢</div>
            <p className="text-[var(--color-text-secondary)]">80-100</p>
            <p className="text-xs text-[var(--color-text-tertiary)]">מצוין</p>
          </div>
          <div className="glass rounded-lg p-3 border border-white/10">
            <div className="text-2xl mb-1">🟡</div>
            <p className="text-[var(--color-text-secondary)]">60-79</p>
            <p className="text-xs text-[var(--color-text-tertiary)]">טוב</p>
          </div>
          <div className="glass rounded-lg p-3 border border-white/10">
            <div className="text-2xl mb-1">🟠</div>
            <p className="text-[var(--color-text-secondary)]">40-59</p>
            <p className="text-xs text-[var(--color-text-tertiary)]">אזהרה</p>
          </div>
          <div className="glass rounded-lg p-3 border border-white/10">
            <div className="text-2xl mb-1">🔴</div>
            <p className="text-[var(--color-text-secondary)]">0-39</p>
            <p className="text-xs text-[var(--color-text-tertiary)]">קריטי</p>
          </div>
        </div>
        <p className="text-[var(--color-text-tertiary)] text-sm mb-6">
          כדי לראות את ה-Quiet Index שלך, חברו את חשבון Google Ads שלכם
        </p>
        <button
          onClick={() => window.location.href = '/app/connect-ads'}
          className="px-8 py-4 bg-gradient-to-r from-[var(--color-cyan)] to-[var(--color-purple)] rounded-xl text-white font-bold hover:scale-105 transition-transform"
        >
          חברו עכשיו →
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass-strong rounded-2xl p-8 border border-white/10">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--color-cyan)]/20 border-t-[var(--color-cyan)] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--color-text-secondary)]">טוען Quiet Index...</p>
        </div>
      </div>
    );
  }

  if (!qi) {
    return (
      <div className="glass-strong rounded-2xl p-8 border border-white/10 text-center">
        <div className="text-4xl mb-4">🤔</div>
        <p className="text-[var(--color-text-secondary)] mb-4">
          אין מספיק נתונים לחישוב Quiet Index
        </p>
        <button
          onClick={handleRecalculate}
          disabled={calculating}
          className="px-6 py-3 bg-gradient-to-r from-[var(--color-cyan)] to-[var(--color-purple)] text-white font-bold rounded-xl hover:scale-105 transition-all"
        >
          {calculating ? 'מחשב...' : '🔄 חשב עכשיו'}
        </button>
      </div>
    );
  }

  return (
    <div className="glass-strong rounded-2xl border border-white/10 overflow-hidden">
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

          <button
            onClick={handleRecalculate}
            disabled={calculating}
            className="px-4 py-2 glass hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition-all disabled:opacity-50"
          >
            {calculating ? '⏳ מחשב...' : '🔄 חשב מחדש'}
          </button>
        </div>
      </div>

      {/* Main Score */}
      <div className="p-12 text-center">
        {/* Big Score */}
        <div className="mb-8">
          <div 
            className="text-9xl font-bold mb-4"
            style={{ color: getScoreColor(qi.qi) }}
          >
            {qi.qi}
          </div>
          <div className="text-2xl text-[var(--color-text-secondary)]">
            מתוך 100
          </div>
        </div>

        {/* Level Badge */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="text-4xl">{getLevelEmoji(qi.level)}</div>
          <div className="px-6 py-3 glass-strong rounded-full border border-white/10">
            <p className="text-xl font-bold text-white">{qi.message}</p>
          </div>
        </div>

        {/* Trend */}
        {qi.trend && qi.trend.direction !== 'stable' && (
          <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-lg border border-white/10">
            <span className="text-2xl">{getTrendIcon(qi.trend.direction)}</span>
            <span className="text-sm text-[var(--color-text-secondary)]">
              {qi.trend.direction === 'up' ? 'עלייה' : 'ירידה'} של {qi.trend.change} נקודות
            </span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-6 p-6 border-t border-white/10">
        <div className="text-center">
          <div className="text-3xl font-bold text-white mb-2">
            {qi.totalClicks || 0}
          </div>
          <div className="text-sm text-[var(--color-text-secondary)]">
            סה"כ clicks
          </div>
        </div>

        <div className="text-center">
          <div className="text-3xl font-bold text-green-500 mb-2">
            {qi.cleanClicks || 0}
          </div>
          <div className="text-sm text-[var(--color-text-secondary)]">
            נקיים
          </div>
        </div>

        <div className="text-center">
          <div className="text-3xl font-bold text-red-500 mb-2">
            {qi.fraudClicks || 0}
          </div>
          <div className="text-sm text-[var(--color-text-secondary)]">
            הונאות
          </div>
        </div>
      </div>

      {/* Breakdown */}
      {qi.breakdown && Object.keys(qi.breakdown).length > 0 && (
        <div className="p-6 border-t border-white/10">
          <h4 className="text-lg font-bold text-white mb-4">פירוט זיהויים:</h4>
          <div className="space-y-2">
            {Object.entries(qi.breakdown).map(([rule, count]) => (
              <div key={rule} className="flex items-center justify-between glass rounded-lg p-3 border border-white/10">
                <span className="text-sm text-[var(--color-text-secondary)]">
                  {rule.replace(/_/g, ' ')}
                </span>
                <span className="text-lg font-bold text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="p-6 border-t border-white/10 glass">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-[var(--color-cyan)]/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-[var(--color-cyan)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h5 className="text-white font-bold mb-1">💡 מה זה Quiet Index?</h5>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Quiet Index™ הוא ציון איכות שמודד עד כמה הclicks שלך "שקטים" ונקיים מהונאות.
              100 = מושלם, 0 = התקפה פעילה. הציון מחושב על סמך 8 כללי זיהוי מתקדמים.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuietIndexWidget;