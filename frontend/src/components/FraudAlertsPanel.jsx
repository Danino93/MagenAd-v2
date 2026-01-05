/*
 * FraudAlertsPanel.jsx
 * 
 * פאנל התראות הונאה עם:
 * - 4 סטטיסטיקות עיקריות
 * - רשימת התראות עם severity
 * - אפשרות לסנן ולמחוק
 */
import { useState, useEffect } from 'react';

function FraudAlertsPanel({ accountId }) {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!accountId) {
      setLoading(false);
      return;
    }
    loadAlerts();
    loadStats();
  }, [accountId, filter]);

  const loadAlerts = async () => {
    try {
      const token = localStorage.getItem('token');
      const severityParam = filter !== 'all' ? `&severity=${filter}` : '';
      
      const response = await fetch(
        `http://localhost:3001/api/detection/${accountId}/alerts?days=7&limit=20${severityParam}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await response.json();
      setAlerts(data.alerts || []);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3001/api/detection/${accountId}/stats?days=7`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'high': return { emoji: '🚨', text: 'חמור', color: 'red' };
      case 'medium': return { emoji: '⚠️', text: 'בינוני', color: 'yellow' };
      case 'low': return { emoji: 'ℹ️', text: 'נמוך', color: 'blue' };
      default: return { emoji: '❓', text: 'לא ידוע', color: 'gray' };
    }
  };

  if (!accountId) {
    return (
      <div className="glass-strong rounded-2xl p-12 border border-white/10 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center opacity-50">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">🚨 התראות הונאה</h3>
        <p className="text-[var(--color-text-secondary)] mb-4">
          כאן תראו התראות בזמן אמת על הונאות שזוהו בקמפיינים שלכם:
        </p>
        <div className="grid grid-cols-4 gap-4 mb-6 text-sm">
          <div className="glass rounded-lg p-3 border border-white/10">
            <p className="text-xs text-[var(--color-text-tertiary)] mb-1">שיעור הונאה</p>
            <p className="text-lg font-bold gradient-text">--%</p>
          </div>
          <div className="glass rounded-lg p-3 border border-white/10">
            <p className="text-xs text-[var(--color-text-tertiary)] mb-1">זיהויים</p>
            <p className="text-lg font-bold text-white">--</p>
          </div>
          <div className="glass rounded-lg p-3 border border-white/10">
            <p className="text-xs text-[var(--color-text-tertiary)] mb-1">עלות הונאה</p>
            <p className="text-lg font-bold text-white">₪--</p>
          </div>
          <div className="glass rounded-lg p-3 border border-white/10">
            <p className="text-xs text-[var(--color-text-tertiary)] mb-1">% מתקציב</p>
            <p className="text-lg font-bold gradient-text">--%</p>
          </div>
        </div>
        <p className="text-[var(--color-text-tertiary)] text-sm mb-6">
          כדי לראות התראות וסטטיסטיקות, חברו את חשבון Google Ads שלכם
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
    return <div className="glass-strong rounded-2xl p-8 text-center"><div className="w-12 h-12 border-4 border-[var(--color-cyan)]/20 border-t-[var(--color-cyan)] rounded-full animate-spin mx-auto mb-4" /><p className="text-[var(--color-text-secondary)]">טוען התראות...</p></div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-6">
          <div className="glass-strong rounded-2xl p-6 border border-white/10">
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">שיעור הונאה</p>
            <p className="text-4xl font-bold gradient-text">{stats.fraud_rate}%</p>
          </div>
          <div className="glass-strong rounded-2xl p-6 border border-white/10">
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">זיהויים</p>
            <p className="text-4xl font-bold text-white">{stats.total_detections}</p>
          </div>
          <div className="glass-strong rounded-2xl p-6 border border-white/10">
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">עלות הונאה</p>
            <p className="text-4xl font-bold text-white">₪{stats.cost_impact?.fraud_cost}</p>
          </div>
          <div className="glass-strong rounded-2xl p-6 border border-white/10">
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">% מתקציב</p>
            <p className="text-4xl font-bold gradient-text">{stats.cost_impact?.percentage}%</p>
          </div>
        </div>
      )}

      {/* Alerts */}
      <div className="glass-strong rounded-2xl border border-white/10">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-2xl font-bold text-white">🚨 התראות הונאה</h3>
        </div>
        <div className="max-h-[600px] overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-4">✅</div>
              <h4 className="text-2xl font-bold text-white mb-3">הכל נקי!</h4>
              <p className="text-[var(--color-text-secondary)]">לא זוהו הונאות בימים האחרונים</p>
            </div>
          ) : (
            alerts.map((alert) => {
              const badge = getSeverityBadge(alert.severity_level);
              return (
                <div key={alert.id} className="p-6 border-b border-white/5">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{badge.emoji}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-white font-bold">{alert.detection_message}</h4>
                        <span className="px-3 py-1 bg-white/10 text-xs font-bold rounded-full">{badge.text}</span>
                      </div>
                      <p className="text-sm text-[var(--color-text-tertiary)]">{new Date(alert.detected_at).toLocaleString('he-IL')}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default FraudAlertsPanel;