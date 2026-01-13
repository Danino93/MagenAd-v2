function DemoLiveClicksFeed() {
  // Demo clicks data - מדויק למקור
  const demoClicks = [
    {
      id: '1',
      campaign_name: 'קמפיין קיץ 2024',
      device: 'Mobile',
      country_code: 'IL',
      cost_micros: 2500000,
      click_timestamp: new Date(Date.now() - 2 * 60000).toISOString()
    },
    {
      id: '2',
      campaign_name: 'מוצרים חדשים',
      device: 'Desktop',
      country_code: 'US',
      cost_micros: 3200000,
      click_timestamp: new Date(Date.now() - 5 * 60000).toISOString()
    },
    {
      id: '3',
      campaign_name: 'קמפיין קיץ 2024',
      device: 'Tablet',
      country_code: 'GB',
      cost_micros: 1800000,
      click_timestamp: new Date(Date.now() - 8 * 60000).toISOString()
    },
    {
      id: '4',
      campaign_name: 'מבצעים מיוחדים',
      device: 'Mobile',
      country_code: 'IL',
      cost_micros: 4100000,
      click_timestamp: new Date(Date.now() - 12 * 60000).toISOString()
    },
    {
      id: '5',
      campaign_name: 'מוצרים חדשים',
      device: 'Desktop',
      country_code: 'DE',
      cost_micros: 2900000,
      click_timestamp: new Date(Date.now() - 15 * 60000).toISOString()
    }
  ];

  const getDeviceIcon = (device) => {
    switch (device?.toLowerCase()) {
      case 'mobile':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'tablet':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
    }
  };

  const getCountryFlag = (countryCode) => {
    if (!countryCode) return '🌍';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
  };

  const formatCost = (costMicros) => {
    const cost = (costMicros || 0) / 1000000;
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 2
    }).format(cost);
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'לא ידוע';
    const now = new Date();
    const clickTime = new Date(timestamp);
    const diffMs = now - clickTime;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    if (diffSec < 60) return `לפני ${diffSec} שניות`;
    if (diffMin < 60) return `לפני ${diffMin} דקות`;
    return `לפני ${Math.floor(diffMin / 60)} שעות`;
  };

  return (
    <div className="glass-strong rounded-2xl border border-white/10 overflow-hidden">
      {/* Demo Badge */}
      <div className="p-2 bg-[var(--color-cyan)]/10 border-b border-white/10 text-center">
        <p className="text-xs text-[var(--color-cyan)] font-bold">
          🎭 דמו - חברו Google Ads לראות קליקים אמיתיים
        </p>
      </div>

      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-cyan)] to-[var(--color-purple)] rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Clicks בזמן אמת</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {demoClicks.length} clicks אחרונים
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[var(--color-success)] rounded-full animate-pulse" />
            <span className="text-sm text-[var(--color-text-secondary)]">Live</span>
          </div>
        </div>
      </div>

      {/* Clicks Feed */}
      <div className="max-h-[600px] overflow-y-auto">
        {demoClicks.map((click, index) => (
          <div
            key={click.id}
            className="p-6 border-b border-white/5 hover:bg-white/5 transition-all"
            style={{
              animationDelay: `${index * 50}ms`
            }}
          >
            <div className="flex items-start justify-between">
              {/* Left: Click Info */}
              <div className="flex items-start gap-4 flex-1">
                {/* Device Icon */}
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--color-purple)] to-[var(--color-magenta)] flex items-center justify-center text-white flex-shrink-0">
                  {getDeviceIcon(click.device)}
                </div>

                {/* Details */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{getCountryFlag(click.country_code)}</span>
                    <div>
                      <p className="text-white font-bold">
                        {click.campaign_name}
                      </p>
                      <p className="text-xs text-[var(--color-text-tertiary)]">
                        {click.device} • {click.country_code}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Cost & Time */}
              <div className="text-left flex-shrink-0 ml-4">
                <p className="text-2xl font-bold gradient-text mb-1">
                  {formatCost(click.cost_micros)}
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  ⏰ {getTimeAgo(click.click_timestamp)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 bg-white/5 text-center">
        <p className="text-xs text-[var(--color-text-tertiary)]">
          מתעדכן אוטומטית כל 10 שניות
        </p>
      </div>
    </div>
  );
}

export default DemoLiveClicksFeed;
