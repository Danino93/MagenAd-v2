function DemoFraudAlertsPanel() {
  // Demo stats
  const demoStats = {
    fraud_rate: 2.8,
    total_detections: 127,
    cost_impact: {
      fraud_cost: 3512,
      percentage: 2.8
    }
  };

  // Demo alerts
  const demoAlerts = [
    {
      id: '1',
      severity_level: 'high',
      detection_message: 'זוהה spike חריג של 4 קליקים תוך 2 דקות',
      detection_rule: 'Click Velocity',
      click_count: 4,
      time_window: '2 דקות',
      cost_impact: 1250,
      timestamp: new Date(Date.now() - 30 * 60000).toISOString()
    },
    {
      id: '2',
      severity_level: 'medium',
      detection_message: 'CTR גבוה מהרגיל - 8.5% לעומת ממוצע 3.2%',
      detection_rule: 'CTR Anomaly',
      click_count: 12,
      time_window: 'שעה',
      cost_impact: 890,
      timestamp: new Date(Date.now() - 2 * 60 * 60000).toISOString()
    },
    {
      id: '3',
      severity_level: 'low',
      detection_message: 'מיקום חריג - IP מישראל עם קליקים מרוסיה',
      detection_rule: 'Geographic Anomaly',
      click_count: 3,
      time_window: '30 דקות',
      cost_impact: 450,
      timestamp: new Date(Date.now() - 4 * 60 * 60000).toISOString()
    }
  ];

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'high': return { emoji: '🚨', text: 'חמור', color: 'red', bgColor: 'bg-red-500/20', borderColor: 'border-red-500/50' };
      case 'medium': return { emoji: '⚠️', text: 'בינוני', color: 'yellow', bgColor: 'bg-yellow-500/20', borderColor: 'border-yellow-500/50' };
      case 'low': return { emoji: 'ℹ️', text: 'נמוך', color: 'blue', bgColor: 'bg-blue-500/20', borderColor: 'border-blue-500/50' };
      default: return { emoji: '❓', text: 'לא ידוע', color: 'gray', bgColor: 'bg-gray-500/20', borderColor: 'border-gray-500/50' };
    }
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'לא ידוע';
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMs = now - alertTime;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    if (diffMin < 60) return `לפני ${diffMin} דקות`;
    if (diffHour < 24) return `לפני ${diffHour} שעות`;
    return `לפני ${Math.floor(diffHour / 24)} ימים`;
  };

  return (
    <div className="space-y-6">
      {/* Demo Badge */}
      <div className="flex items-center justify-center">
        <div className="px-4 py-2 glass rounded-full border border-[var(--color-red)]/30">
          <p className="text-xs text-[var(--color-red)] font-bold">
            🎭 דמו - חברו Google Ads לראות התראות אמיתיות
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6">
        <div className="glass-strong rounded-2xl p-6 border border-white/10">
          <p className="text-sm text-[var(--color-text-secondary)] mb-2">שיעור הונאה</p>
          <p className="text-4xl font-bold gradient-text">{demoStats.fraud_rate}%</p>
        </div>
        <div className="glass-strong rounded-2xl p-6 border border-white/10">
          <p className="text-sm text-[var(--color-text-secondary)] mb-2">זיהויים</p>
          <p className="text-4xl font-bold text-white">{demoStats.total_detections}</p>
        </div>
        <div className="glass-strong rounded-2xl p-6 border border-white/10">
          <p className="text-sm text-[var(--color-text-secondary)] mb-2">עלות הונאה</p>
          <p className="text-4xl font-bold text-white">₪{demoStats.cost_impact.fraud_cost}</p>
        </div>
        <div className="glass-strong rounded-2xl p-6 border border-white/10">
          <p className="text-sm text-[var(--color-text-secondary)] mb-2">% מתקציב</p>
          <p className="text-4xl font-bold gradient-text">{demoStats.cost_impact.percentage}%</p>
        </div>
      </div>

      {/* Alerts */}
      <div className="glass-strong rounded-2xl border border-white/10">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-2xl font-bold text-white">🚨 התראות הונאה</h3>
        </div>
        <div className="max-h-[600px] overflow-y-auto">
          {demoAlerts.map((alert) => {
            const badge = getSeverityBadge(alert.severity_level);
            return (
              <div 
                key={alert.id} 
                className="p-6 border-b border-white/5 hover:bg-white/5 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Severity Badge */}
                    <div className={`px-4 py-2 rounded-lg border ${badge.borderColor} ${badge.bgColor} flex items-center gap-2 flex-shrink-0`}>
                      <span className="text-xl">{badge.emoji}</span>
                      <span className="text-sm font-bold text-white">{badge.text}</span>
                    </div>

                    {/* Alert Details */}
                    <div className="flex-1">
                      <p className="text-white font-bold mb-2">{alert.detection_message}</p>
                      <div className="flex items-center gap-4 text-xs text-[var(--color-text-tertiary)]">
                        <span>📋 {alert.detection_rule}</span>
                        <span>👆 {alert.click_count} קליקים</span>
                        <span>⏱️ {alert.time_window}</span>
                        <span>💰 ₪{alert.cost_impact}</span>
                      </div>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="text-left flex-shrink-0">
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      {getTimeAgo(alert.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DemoFraudAlertsPanel;
