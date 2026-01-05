/*
 * RealTimeMonitoring.jsx
 * 
 * Real-Time Monitoring Dashboard:
 * - Live statistics (auto-refresh every 30s)
 * - Active threats panel
 * - Recent detections feed
 * - Attack status indicator
 * - Threat timeline chart
 */

import { useState, useEffect } from 'react';

function RealTimeMonitoring({ accountId }) {
  const [monitoring, setMonitoring] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!accountId) {
      setLoading(false);
      return;
    }
    
    loadMonitoring();

    // Auto-refresh every 30 seconds
    if (autoRefresh) {
      const interval = setInterval(loadMonitoring, 30000);
      return () => clearInterval(interval);
    }
  }, [accountId, autoRefresh]);

  const loadMonitoring = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3001/api/monitoring/${accountId}?minutes=60`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) throw new Error('Failed to load monitoring');

      const data = await response.json();
      setMonitoring(data.monitoring);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error('Error loading monitoring:', error);
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: '#ef4444',
      high: '#f97316',
      medium: '#eab308',
      low: '#84cc16',
      safe: '#10b981'
    };
    return colors[severity] || '#6b7280';
  };

  const getSeverityEmoji = (severity) => {
    const emojis = {
      critical: '🚨',
      high: '🔴',
      medium: '🟠',
      low: '🟡',
      safe: '🟢'
    };
    return emojis[severity] || '⚪';
  };

  if (!accountId) {
    return (
      <div className="glass-strong rounded-2xl p-12 border border-white/10 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center opacity-50">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">🔴 Live Monitoring</h3>
        <p className="text-[var(--color-text-secondary)] mb-4">
          כאן תראו ניטור בזמן אמת של ה-clicks שלכם:
        </p>
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm max-w-md mx-auto">
          <div className="glass rounded-lg p-3 border border-white/10">
            <div className="text-xl mb-1">👆</div>
            <p className="text-[var(--color-text-secondary)]">Clicks בזמן אמת</p>
          </div>
          <div className="glass rounded-lg p-3 border border-white/10">
            <div className="text-xl mb-1">🚨</div>
            <p className="text-[var(--color-text-secondary)]">איומים פעילים</p>
          </div>
          <div className="glass rounded-lg p-3 border border-white/10">
            <div className="text-xl mb-1">📡</div>
            <p className="text-[var(--color-text-secondary)]">זיהויים אחרונים</p>
          </div>
          <div className="glass rounded-lg p-3 border border-white/10">
            <div className="text-xl mb-1">⚠️</div>
            <p className="text-[var(--color-text-secondary)]">רמת סיכון</p>
          </div>
        </div>
        <p className="text-[var(--color-text-tertiary)] text-sm mb-6">
          כדי לראות ניטור בזמן אמת, חברו את חשבון Google Ads שלכם
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
      <div className="glass-strong rounded-2xl p-8 border border-white/10 text-center">
        <div className="w-12 h-12 border-4 border-[var(--color-cyan)]/20 border-t-[var(--color-cyan)] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[var(--color-text-secondary)]">טוען monitoring...</p>
      </div>
    );
  }

  if (!monitoring) {
    return (
      <div className="glass-strong rounded-2xl p-8 border border-white/10 text-center">
        <p className="text-[var(--color-text-secondary)]">אין נתוני monitoring זמינים</p>
      </div>
    );
  }

  const { activeThreats, recentDetections, liveStats, threatTimeline, alertsCount } = monitoring;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            🔴 Live Monitoring
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-normal text-[var(--color-text-secondary)]">
                {autoRefresh ? 'Auto-refresh' : 'Paused'}
              </span>
            </div>
          </h2>
          <p className="text-[var(--color-text-secondary)]">
            Last update: {lastUpdate?.toLocaleTimeString('he-IL')} • {liveStats?.period}
          </p>
        </div>

        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            autoRefresh
              ? 'bg-gradient-to-r from-[var(--color-cyan)] to-[var(--color-purple)] text-white'
              : 'glass hover:bg-white/10 text-[var(--color-text-secondary)]'
          }`}
        >
          {autoRefresh ? '⏸ Pause' : '▶ Resume'}
        </button>
      </div>

      {/* Live Statistics Cards */}
      {liveStats && (
        <div className="grid grid-cols-4 gap-6">
          {/* Clicks */}
          <div className="glass-strong rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[var(--color-text-secondary)]">Clicks</span>
              <span className="text-2xl">👆</span>
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {liveStats.clicks.total}
            </div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              {liveStats.clicks.fraudRate}% הונאה
            </div>
          </div>

          {/* Cost */}
          <div className="glass-strong rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[var(--color-text-secondary)]">עלות</span>
              <span className="text-2xl">💰</span>
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              ₪{liveStats.cost.total}
            </div>
            <div className="text-sm text-red-400">
              ₪{liveStats.cost.fraudulent} הוצאו לשווא
            </div>
          </div>

          {/* Risk */}
          <div className="glass-strong rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[var(--color-text-secondary)]">סיכון</span>
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {liveStats.risk.average}/100
            </div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              {liveStats.risk.vpnPercentage}% VPN
            </div>
          </div>

          {/* Detections */}
          <div className="glass-strong rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[var(--color-text-secondary)]">זיהויים</span>
              <span className="text-2xl">🎯</span>
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {liveStats.detections.total}
            </div>
            <div className="text-sm text-red-400">
              {liveStats.detections.critical} critical
            </div>
          </div>
        </div>
      )}

      {/* Active Threats & Recent Detections */}
      <div className="grid grid-cols-2 gap-8">
        {/* Active Threats */}
        <div className="glass-strong rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10 bg-gradient-to-r from-red-500/20 to-orange-500/20">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              🚨 איומים פעילים
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              {activeThreats.critical} critical • {activeThreats.high} high
            </p>
          </div>
          
          <div className="p-6 max-h-[500px] overflow-y-auto space-y-3">
            {activeThreats.threats.length === 0 ? (
              <div className="text-center py-8 text-[var(--color-text-secondary)]">
                ✅ אין איומים פעילים
              </div>
            ) : (
              activeThreats.threats.map(threat => (
                <div
                  key={threat.id}
                  className="glass rounded-lg p-4 border transition-all hover:scale-[1.02]"
                  style={{ borderColor: `${getSeverityColor(threat.severity)}40` }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getSeverityEmoji(threat.severity)}</span>
                      <div>
                        <div className="text-white font-bold">{threat.category}</div>
                        <div className="text-xs text-[var(--color-text-secondary)]">
                          {threat.age} • Score: {threat.fraudScore}/100
                        </div>
                      </div>
                    </div>
                    <div
                      className="px-3 py-1 rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: `${getSeverityColor(threat.severity)}20`,
                        color: getSeverityColor(threat.severity),
                        border: `1px solid ${getSeverityColor(threat.severity)}40`
                      }}
                    >
                      {threat.severity.toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1 text-[var(--color-text-secondary)]">
                      <span>📍</span>
                      <span>{threat.city || threat.country || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[var(--color-text-secondary)]">
                      <span>💻</span>
                      <span>{threat.device || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[var(--color-text-secondary)]">
                      <span>🌐</span>
                      <span className="truncate">{threat.isp || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[var(--color-text-secondary)]">
                      <span>💰</span>
                      <span>₪{threat.cost}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Detections Feed */}
        <div className="glass-strong rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10 bg-gradient-to-r from-[var(--color-purple)]/20 to-[var(--color-magenta)]/20">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              📡 זיהויים אחרונים
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Real-time fraud detection feed
            </p>
          </div>
          
          <div className="p-6 max-h-[500px] overflow-y-auto space-y-2">
            {recentDetections.length === 0 ? (
              <div className="text-center py-8 text-[var(--color-text-secondary)]">
                אין זיהויים אחרונים
              </div>
            ) : (
              recentDetections.map(detection => (
                <div
                  key={detection.id}
                  className="glass rounded-lg p-3 border border-white/10 flex items-center justify-between hover:bg-white/5 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getSeverityEmoji(detection.severity)}</span>
                    <div>
                      <div className="text-white font-medium text-sm">
                        {detection.type.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xs text-[var(--color-text-secondary)]">
                        {detection.ip} • {detection.country} • {detection.age}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">{detection.fraudScore}</div>
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      ₪{detection.cost}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Active Alerts Badge */}
      {alertsCount > 0 && (
        <div className="glass-strong rounded-2xl border-2 border-red-500/50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center border-2 border-red-500">
                <span className="text-3xl">🔔</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  {alertsCount} התראות פעילות
                </h3>
                <p className="text-[var(--color-text-secondary)]">
                  צריך טיפול מידי
                </p>
              </div>
            </div>
            <button className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold rounded-xl hover:scale-105 transition-all">
              צפה בהתראות
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RealTimeMonitoring;