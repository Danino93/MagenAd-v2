function DemoIPManagement() {
  // Demo data
  const demoStats = {
    blocked: {
      total: 47,
      auto: 32,
      clicksBlocked: 1247
    },
    whitelisted: {
      total: 12
    }
  };

  const demoBlacklist = [
    {
      id: '1',
      ipAddress: '185.220.101.45',
      reason: 'VPN/Proxy detected',
      source: 'auto',
      blockedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      clicksBlocked: 23,
      costSaved: 1250
    },
    {
      id: '2',
      ipAddress: '45.33.32.156',
      reason: 'Click velocity spike',
      source: 'auto',
      blockedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      clicksBlocked: 15,
      costSaved: 890
    },
    {
      id: '3',
      ipAddress: '192.168.1.100',
      reason: 'Manual block - suspicious activity',
      source: 'manual',
      blockedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      clicksBlocked: 8,
      costSaved: 450
    }
  ];

  const demoWhitelist = [
    {
      id: '1',
      ipAddress: '192.168.1.50',
      reason: 'Office IP - trusted',
      addedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      ipAddress: '10.0.0.25',
      reason: 'Server IP - internal',
      addedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffDays = Math.floor((now - time) / (24 * 60 * 60 * 1000));
    if (diffDays === 0) return 'היום';
    if (diffDays === 1) return 'אתמול';
    return `לפני ${diffDays} ימים`;
  };

  return (
    <div className="space-y-8">
      {/* Demo Badge */}
      <div className="flex items-center justify-center">
        <div className="px-4 py-2 glass rounded-full border border-[var(--color-blue)]/30">
          <p className="text-xs text-[var(--color-blue)] font-bold">
            🎭 דמו - חברו Google Ads לראות ניהול IP אמיתי
          </p>
        </div>
      </div>

      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">🛡️ ניהול IP</h2>
        <p className="text-[var(--color-text-secondary)]">
          חסום והרשה כתובות IP
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-6">
        <div className="glass-strong rounded-2xl p-6 border border-white/10">
          <div className="text-3xl font-bold text-red-400 mb-2">
            {demoStats.blocked.total}
          </div>
          <div className="text-sm text-[var(--color-text-secondary)]">
            IPs חסומים
          </div>
        </div>

        <div className="glass-strong rounded-2xl p-6 border border-white/10">
          <div className="text-3xl font-bold text-green-400 mb-2">
            {demoStats.whitelisted.total}
          </div>
          <div className="text-sm text-[var(--color-text-secondary)]">
            IPs מורשים
          </div>
        </div>

        <div className="glass-strong rounded-2xl p-6 border border-white/10">
          <div className="text-3xl font-bold text-orange-400 mb-2">
            {demoStats.blocked.auto}
          </div>
          <div className="text-sm text-[var(--color-text-secondary)]">
            חסימות אוטומטיות
          </div>
        </div>

        <div className="glass-strong rounded-2xl p-6 border border-white/10">
          <div className="text-3xl font-bold text-white mb-2">
            {demoStats.blocked.clicksBlocked.toLocaleString('he-IL')}
          </div>
          <div className="text-sm text-[var(--color-text-secondary)]">
            Clicks נחסמו
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4">
        <button className="px-6 py-3 rounded-lg font-medium transition-all bg-gradient-to-r from-red-500 to-orange-500 text-white">
          🚫 רשימה שחורה ({demoBlacklist.length})
        </button>
        <button className="px-6 py-3 rounded-lg font-medium transition-all glass hover:bg-white/10 text-[var(--color-text-secondary)]">
          ✅ רשימה לבנה ({demoWhitelist.length})
        </button>
      </div>

      {/* Blacklist */}
      <div className="glass-strong rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-xl font-bold text-white">🚫 רשימה שחורה</h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            IPs חסומים - לא יוכלו לבצע קליקים
          </p>
        </div>

        <div className="p-6 space-y-4">
          {demoBlacklist.map(item => (
            <div
              key={item.id}
              className="glass rounded-lg p-4 border border-red-500/30 hover:scale-[1.02] transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg font-mono text-sm font-bold">
                      {item.ipAddress}
                    </div>
                    {item.source === 'auto' && (
                      <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full border border-orange-500/30">
                        אוטומטי
                      </span>
                    )}
                    {item.source === 'manual' && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                        ידני
                      </span>
                    )}
                  </div>
                  <p className="text-white font-medium mb-1">{item.reason}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    נחסם {getTimeAgo(item.blockedAt)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold">{item.clicksBlocked} clicks</div>
                  <div className="text-xs text-green-400">₪{item.costSaved} נחסך</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DemoIPManagement;
