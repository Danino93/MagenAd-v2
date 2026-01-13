function DemoAdvancedAnalytics() {
  const getCountryFlag = (code) => {
    if (!code || code === 'XX') return '🌍';
    const codePoints = code
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
  };

  const getRiskColor = (level) => {
    const colors = {
      safe: '#10b981',
      low: '#84cc16',
      medium: '#eab308',
      high: '#f97316',
      critical: '#ef4444'
    };
    return colors[level] || '#6b7280';
  };

  // Demo data
  const demoAnalytics = {
    geographic: {
      totalCountries: 12,
      totalCities: 45,
      countries: [
        { name: 'IL', count: 15230, percentage: 33.7, totalCost: 38500 },
        { name: 'US', count: 12450, percentage: 27.5, totalCost: 31200 },
        { name: 'GB', count: 8900, percentage: 19.7, totalCost: 22300 },
        { name: 'DE', count: 5200, percentage: 11.5, totalCost: 13100 },
        { name: 'FR', count: 3450, percentage: 7.6, totalCost: 8600 }
      ],
      cities: [
        { name: 'תל אביב', count: 8200, percentage: 18.1, totalCost: 20500 },
        { name: 'ירושלים', count: 4500, percentage: 9.9, totalCost: 11200 },
        { name: 'ניו יורק', count: 6800, percentage: 15.0, totalCost: 17000 },
        { name: 'לונדון', count: 5200, percentage: 11.5, totalCost: 13000 },
        { name: 'ברלין', count: 3100, percentage: 6.9, totalCost: 7800 }
      ]
    },
    ispBreakdown: {
      totalISPs: 28,
      isps: [
        { name: 'Bezeq', count: 12400, percentage: 27.4, isHosting: false },
        { name: 'Partner', count: 8900, percentage: 19.7, isHosting: false },
        { name: 'AWS', count: 5200, percentage: 11.5, isHosting: true },
        { name: 'Google Cloud', count: 3800, percentage: 8.4, isHosting: true },
        { name: 'DigitalOcean', count: 2900, percentage: 6.4, isHosting: true },
        { name: 'Hetzner', count: 2100, percentage: 4.6, isHosting: true },
        { name: 'OVH', count: 1800, percentage: 4.0, isHosting: true },
        { name: 'Cloudflare', count: 1500, percentage: 3.3, isHosting: false }
      ]
    },
    riskDistribution: {
      averageRisk: 42,
      distribution: [
        { level: 'safe', range: '0-20', count: 28500, percentage: 63.0, totalCost: 71250 },
        { level: 'low', range: '21-40', count: 11200, percentage: 24.8, totalCost: 28000 },
        { level: 'medium', range: '41-60', count: 4200, percentage: 9.3, totalCost: 10500 },
        { level: 'high', range: '61-80', count: 980, percentage: 2.2, totalCost: 2450 },
        { level: 'critical', range: '81-100', count: 350, percentage: 0.8, totalCost: 875 }
      ]
    }
  };

  return (
    <div className="space-y-8">
      {/* Demo Badge */}
      <div className="flex items-center justify-center">
        <div className="px-4 py-2 glass rounded-full border border-[var(--color-yellow)]/30">
          <p className="text-xs text-[var(--color-yellow)] font-bold">
            🎭 דמו - חברו Google Ads לראות אנליטיקס אמיתי
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">📊 Analytics מתקדם</h2>
          <p className="text-[var(--color-text-secondary)]">
            ניתוח מעמיק של הclicks שלך
          </p>
        </div>
        <div className="flex gap-2">
          {[7, 14, 30].map(d => (
            <button
              key={d}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                d === 7
                  ? 'bg-gradient-to-r from-[var(--color-cyan)] to-[var(--color-purple)] text-white'
                  : 'glass hover:bg-white/10 text-[var(--color-text-secondary)]'
              }`}
            >
              {d} ימים
            </button>
          ))}
        </div>
      </div>

      {/* Geographic Analytics */}
      <div className="glass-strong rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-[var(--color-purple)]/20 to-[var(--color-magenta)]/20">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            🌍 ניתוח גיאוגרפי
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {demoAnalytics.geographic.totalCountries} מדינות • {demoAnalytics.geographic.totalCities} ערים
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 p-6">
          {/* Top Countries */}
          <div>
            <h4 className="text-lg font-bold text-white mb-4">מדינות מובילות</h4>
            <div className="space-y-3">
              {demoAnalytics.geographic.countries.map((country, index) => (
                <div key={country.name} className="flex items-center justify-between glass rounded-lg p-3 border border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getCountryFlag(country.name)}</span>
                    <div>
                      <div className="text-white font-medium">{country.name}</div>
                      <div className="text-xs text-[var(--color-text-secondary)]">
                        ₪{country.totalCost.toLocaleString('he-IL')}
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-white font-bold">{country.count.toLocaleString('he-IL')}</div>
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      {country.percentage}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Cities */}
          <div>
            <h4 className="text-lg font-bold text-white mb-4">ערים מובילות</h4>
            <div className="space-y-3">
              {demoAnalytics.geographic.cities.map((city, index) => (
                <div key={city.name} className="flex items-center justify-between glass rounded-lg p-3 border border-white/10">
                  <div>
                    <div className="text-white font-medium">{city.name}</div>
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      ₪{city.totalCost.toLocaleString('he-IL')}
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-white font-bold">{city.count.toLocaleString('he-IL')}</div>
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      {city.percentage}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ISP & Risk Distribution Row */}
      <div className="grid grid-cols-2 gap-8">
        {/* ISP Breakdown */}
        <div className="glass-strong rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10 bg-gradient-to-r from-[var(--color-cyan)]/20 to-[var(--color-purple)]/20">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              🌐 ספקי אינטרנט
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              {demoAnalytics.ispBreakdown.totalISPs} ספקים שונים
            </p>
          </div>
          <div className="p-6 space-y-3">
            {demoAnalytics.ispBreakdown.isps.map(isp => (
              <div key={isp.name} className="glass rounded-lg p-3 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{isp.name}</span>
                    {isp.isHosting && (
                      <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full border border-orange-500/30">
                        Hosting
                      </span>
                    )}
                  </div>
                  <span className="text-white font-bold">{isp.count.toLocaleString('he-IL')}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-[var(--color-cyan)] to-[var(--color-purple)] h-2 rounded-full transition-all"
                    style={{ width: `${isp.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="glass-strong rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10 bg-gradient-to-r from-[var(--color-magenta)]/20 to-[var(--color-purple)]/20">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              ⚠️ פילוח סיכון
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              ממוצע: {demoAnalytics.riskDistribution.averageRisk}/100
            </p>
          </div>
          <div className="p-6 space-y-4">
            {demoAnalytics.riskDistribution.distribution.map(level => (
              <div key={level.level} className="glass rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-white font-bold capitalize">{level.level}</div>
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      {level.range} • ₪{level.totalCost.toLocaleString('he-IL')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">{level.count.toLocaleString('he-IL')}</div>
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      {level.percentage}%
                    </div>
                  </div>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all"
                    style={{
                      width: `${level.percentage}%`,
                      backgroundColor: getRiskColor(level.level)
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DemoAdvancedAnalytics;
