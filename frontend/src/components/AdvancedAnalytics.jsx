/*
 * AdvancedAnalytics.jsx
 * 
 * Dashboard מתקדם ל-Analytics:
 * - Geographic breakdown (top countries/cities)
 * - ISP breakdown (top ISPs)
 * - Risk distribution (bar chart visualization)
 * - VPN/Hosting stats (percentage meters)
 * - Time series chart (clicks over time)
 * - Device breakdown
 * - Cost analytics
 */

import { useState, useEffect } from 'react';

function AdvancedAnalytics({ accountId }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    if (!accountId) {
      setLoading(false);
      return;
    }
    loadAnalytics();
  }, [accountId, days]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3001/api/analytics/${accountId}?days=${days}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) throw new Error('Failed to load analytics');

      const data = await response.json();
      setAnalytics(data.analytics);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
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

  const getCountryFlag = (code) => {
    if (!code || code === 'XX') return '🌍';
    const codePoints = code
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
  };

  if (!accountId) {
    return (
      <div className="glass-strong rounded-2xl p-12 border border-white/10 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[var(--color-cyan)] to-[var(--color-purple)] rounded-full flex items-center justify-center opacity-50">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">📊 Analytics מתקדם</h3>
        <p className="text-[var(--color-text-secondary)] mb-4">
          כאן תראו ניתוח מעמיק של ה-clicks שלכם:
        </p>
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm max-w-md mx-auto">
          <div className="glass rounded-lg p-3 border border-white/10">
            <div className="text-xl mb-1">🌍</div>
            <p className="text-[var(--color-text-secondary)]">ניתוח גיאוגרפי</p>
          </div>
          <div className="glass rounded-lg p-3 border border-white/10">
            <div className="text-xl mb-1">🌐</div>
            <p className="text-[var(--color-text-secondary)]">ספקי אינטרנט</p>
          </div>
          <div className="glass rounded-lg p-3 border border-white/10">
            <div className="text-xl mb-1">⚠️</div>
            <p className="text-[var(--color-text-secondary)]">פילוח סיכון</p>
          </div>
          <div className="glass rounded-lg p-3 border border-white/10">
            <div className="text-xl mb-1">🔒</div>
            <p className="text-[var(--color-text-secondary)]">VPN/Hosting</p>
          </div>
        </div>
        <p className="text-[var(--color-text-tertiary)] text-sm mb-6">
          כדי לראות analytics מפורטים, חברו את חשבון Google Ads שלכם
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
        <p className="text-[var(--color-text-secondary)]">טוען analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="glass-strong rounded-2xl p-8 border border-white/10 text-center">
        <p className="text-[var(--color-text-secondary)]">אין נתוני analytics זמינים</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Time Range Selector */}
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
              onClick={() => setDays(d)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                days === d
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
            {analytics.geographic.totalCountries} מדינות • {analytics.geographic.totalCities} ערים
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 p-6">
          {/* Top Countries */}
          <div>
            <h4 className="text-lg font-bold text-white mb-4">מדינות מובילות</h4>
            <div className="space-y-3">
              {analytics.geographic.countries.slice(0, 5).map((country, index) => (
                <div key={country.name} className="flex items-center justify-between glass rounded-lg p-3 border border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getCountryFlag(country.name)}</span>
                    <div>
                      <div className="text-white font-medium">{country.name}</div>
                      <div className="text-xs text-[var(--color-text-secondary)]">
                        ₪{country.totalCost}
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-white font-bold">{country.count}</div>
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
              {analytics.geographic.cities.slice(0, 5).map((city, index) => (
                <div key={city.name} className="flex items-center justify-between glass rounded-lg p-3 border border-white/10">
                  <div>
                    <div className="text-white font-medium">{city.name}</div>
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      ₪{city.totalCost}
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-white font-bold">{city.count}</div>
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
              {analytics.ispBreakdown.totalISPs} ספקים שונים
            </p>
          </div>
          <div className="p-6 space-y-3">
            {analytics.ispBreakdown.isps.slice(0, 8).map(isp => (
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
                  <span className="text-white font-bold">{isp.count}</span>
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
              ממוצע: {analytics.riskDistribution.averageRisk}/100
            </p>
          </div>
          <div className="p-6 space-y-4">
            {analytics.riskDistribution.distribution.map(level => (
              <div key={level.level} className="glass rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-white font-bold capitalize">{level.level}</div>
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      {level.range} • ₪{level.totalCost}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">{level.count}</div>
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

      {/* VPN/Hosting Statistics */}
      <div className="glass-strong rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-[var(--color-purple)]/20 to-[var(--color-cyan)]/20">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            🔒 סטטיסטיקות אבטחה
          </h3>
        </div>
        <div className="grid grid-cols-4 gap-6 p-6">
          {/* Clean */}
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-green-500/20 border-4 border-green-500 flex items-center justify-center">
              <div className="text-3xl font-bold text-green-400">
                {analytics.vpnStats.clean.percentage}%
              </div>
            </div>
            <div className="text-lg font-bold text-white mb-1">נקי</div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              {analytics.vpnStats.clean.count} clicks
            </div>
          </div>

          {/* VPN */}
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-orange-500/20 border-4 border-orange-500 flex items-center justify-center">
              <div className="text-3xl font-bold text-orange-400">
                {analytics.vpnStats.vpn.percentage}%
              </div>
            </div>
            <div className="text-lg font-bold text-white mb-1">VPN</div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              {analytics.vpnStats.vpn.count} clicks • ₪{analytics.vpnStats.vpn.cost}
            </div>
          </div>

          {/* Proxy */}
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-yellow-500/20 border-4 border-yellow-500 flex items-center justify-center">
              <div className="text-3xl font-bold text-yellow-400">
                {analytics.vpnStats.proxy.percentage}%
              </div>
            </div>
            <div className="text-lg font-bold text-white mb-1">Proxy</div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              {analytics.vpnStats.proxy.count} clicks
            </div>
          </div>

          {/* Hosting */}
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-red-500/20 border-4 border-red-500 flex items-center justify-center">
              <div className="text-3xl font-bold text-red-400">
                {analytics.vpnStats.hosting.percentage}%
              </div>
            </div>
            <div className="text-lg font-bold text-white mb-1">Hosting</div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              {analytics.vpnStats.hosting.count} clicks • ₪{analytics.vpnStats.hosting.cost}
            </div>
          </div>
        </div>
      </div>

      {/* Cost Summary */}
      <div className="glass-strong rounded-2xl border border-white/10 p-6">
        <h3 className="text-xl font-bold text-white mb-4">💰 סיכום עלויות</h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center p-4 glass rounded-xl border border-white/10">
            <div className="text-3xl font-bold text-white mb-2">
              ₪{analytics.costAnalytics.total}
            </div>
            <div className="text-sm text-[var(--color-text-secondary)]">סה"כ</div>
          </div>
          <div className="text-center p-4 glass rounded-xl border border-green-500/30">
            <div className="text-3xl font-bold text-green-400 mb-2">
              ₪{analytics.costAnalytics.clean}
            </div>
            <div className="text-sm text-[var(--color-text-secondary)]">נקי</div>
          </div>
          <div className="text-center p-4 glass rounded-xl border border-red-500/30">
            <div className="text-3xl font-bold text-red-400 mb-2">
              ₪{analytics.costAnalytics.suspicious}
            </div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              חשוד ({analytics.costAnalytics.suspiciousPercentage}%)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdvancedAnalytics;