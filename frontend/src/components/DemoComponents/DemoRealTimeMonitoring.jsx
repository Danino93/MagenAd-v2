function DemoRealTimeMonitoring() {
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

  // Demo data
  const demoLiveStats = {
    clicks: { total: 1247, fraudRate: 2.8 },
    cost: { total: 3120, fraudulent: 87 },
    risk: { average: 42, vpnPercentage: 8.5 },
    detections: { total: 23, critical: 3 }
  };

  const demoActiveThreats = {
    critical: 3,
    high: 8,
    threats: [
      {
        id: '1',
        severity: 'critical',
        category: 'Click Velocity Spike',
        age: '5 דקות',
        fraudScore: 92,
        city: 'תל אביב',
        country: 'IL',
        device: 'Mobile',
        isp: 'AWS',
        cost: 1250
      },
      {
        id: '2',
        severity: 'high',
        category: 'Geographic Anomaly',
        age: '12 דקות',
        fraudScore: 78,
        city: 'מוסקבה',
        country: 'RU',
        device: 'Desktop',
        isp: 'DigitalOcean',
        cost: 890
      },
      {
        id: '3',
        severity: 'high',
        category: 'VPN Detection',
        age: '18 דקות',
        fraudScore: 85,
        city: 'Unknown',
        country: 'XX',
        device: 'Mobile',
        isp: 'NordVPN',
        cost: 650
      }
    ]
  };

  const demoRecentDetections = [
    {
      id: '1',
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
      rule: 'Click Velocity',
      severity: 'critical',
      clicks: 4,
      cost: 1250
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
      rule: 'Geographic Anomaly',
      severity: 'high',
      clicks: 2,
      cost: 890
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
      rule: 'VPN Detection',
      severity: 'medium',
      clicks: 1,
      cost: 450
    }
  ];

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMin = Math.floor((now - time) / 60000);
    if (diffMin < 60) return `לפני ${diffMin} דקות`;
    return `לפני ${Math.floor(diffMin / 60)} שעות`;
  };

  return (
    <div className="space-y-8">
      {/* Demo Badge */}
      <div className="flex items-center justify-center">
        <div className="px-4 py-2 glass rounded-full border border-[var(--color-indigo)]/30">
          <p className="text-xs text-[var(--color-indigo)] font-bold">
            🎭 דמו - חברו Google Ads לראות ניטור אמיתי
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            🔴 Live Monitoring
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-normal text-[var(--color-text-secondary)]">
                Auto-refresh
              </span>
            </div>
          </h2>
          <p className="text-[var(--color-text-secondary)]">
            Last update: {new Date().toLocaleTimeString('he-IL')} • 60 דקות אחרונות
          </p>
        </div>
      </div>

      {/* Live Statistics Cards */}
      <div className="grid grid-cols-4 gap-6">
        {/* Clicks */}
        <div className="glass-strong rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[var(--color-text-secondary)]">Clicks</span>
            <span className="text-2xl">👆</span>
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            {demoLiveStats.clicks.total.toLocaleString('he-IL')}
          </div>
          <div className="text-sm text-[var(--color-text-secondary)]">
            {demoLiveStats.clicks.fraudRate}% הונאה
          </div>
        </div>

        {/* Cost */}
        <div className="glass-strong rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[var(--color-text-secondary)]">עלות</span>
            <span className="text-2xl">💰</span>
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            ₪{demoLiveStats.cost.total.toLocaleString('he-IL')}
          </div>
          <div className="text-sm text-red-400">
            ₪{demoLiveStats.cost.fraudulent} הוצאו לשווא
          </div>
        </div>

        {/* Risk */}
        <div className="glass-strong rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[var(--color-text-secondary)]">סיכון</span>
            <span className="text-2xl">⚠️</span>
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            {demoLiveStats.risk.average}/100
          </div>
          <div className="text-sm text-[var(--color-text-secondary)]">
            {demoLiveStats.risk.vpnPercentage}% VPN
          </div>
        </div>

        {/* Detections */}
        <div className="glass-strong rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[var(--color-text-secondary)]">זיהויים</span>
            <span className="text-2xl">🎯</span>
          </div>
          <div className="text-3xl font-bold text-white mb-2">
            {demoLiveStats.detections.total}
          </div>
          <div className="text-sm text-red-400">
            {demoLiveStats.detections.critical} critical
          </div>
        </div>
      </div>

      {/* Active Threats & Recent Detections */}
      <div className="grid grid-cols-2 gap-8">
        {/* Active Threats */}
        <div className="glass-strong rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10 bg-gradient-to-r from-red-500/20 to-orange-500/20">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              🚨 איומים פעילים
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              {demoActiveThreats.critical} critical • {demoActiveThreats.high} high
            </p>
          </div>
          
          <div className="p-6 max-h-[500px] overflow-y-auto space-y-3">
            {demoActiveThreats.threats.map(threat => (
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
            ))}
          </div>
        </div>

        {/* Recent Detections */}
        <div className="glass-strong rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10 bg-gradient-to-r from-[var(--color-cyan)]/20 to-[var(--color-purple)]/20">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              📡 זיהויים אחרונים
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              {demoRecentDetections.length} זיהויים ב-60 דקות אחרונות
            </p>
          </div>
          
          <div className="p-6 max-h-[500px] overflow-y-auto space-y-3">
            {demoRecentDetections.map(detection => {
              const badge = getSeverityEmoji(detection.severity);
              return (
                <div
                  key={detection.id}
                  className="glass rounded-lg p-4 border border-white/10 hover:scale-[1.02] transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{badge}</span>
                      <div>
                        <div className="text-white font-bold">{detection.rule}</div>
                        <div className="text-xs text-[var(--color-text-secondary)]">
                          {getTimeAgo(detection.timestamp)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold">{detection.clicks} clicks</div>
                      <div className="text-xs text-red-400">₪{detection.cost}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DemoRealTimeMonitoring;
