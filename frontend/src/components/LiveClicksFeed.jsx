import { useState, useEffect } from 'react';

function LiveClicksFeed({ accountId }) {
  const [clicks, setClicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newClickIds, setNewClickIds] = useState(new Set());

  useEffect(() => {
    if (!accountId) {
      setLoading(false);
      return;
    }

    loadRecentClicks();
    const interval = setInterval(loadRecentClicks, 10000); // Update every 10s

    return () => clearInterval(interval);
  }, [accountId]);

  const loadRecentClicks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3001/api/clicks/${accountId}/recent?limit=20`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!response.ok) throw new Error('Failed to load clicks');

      const data = await response.json();
      const newClicks = data.clicks || [];

      // Mark new clicks for animation
      const existingIds = new Set(clicks.map(c => c.id));
      const newIds = new Set(
        newClicks
          .filter(c => !existingIds.has(c.id))
          .map(c => c.id)
      );

      setNewClickIds(newIds);
      setClicks(newClicks);
      setLoading(false);

      // Remove animation class after 2 seconds
      setTimeout(() => setNewClickIds(new Set()), 2000);
    } catch (error) {
      console.error('Error loading clicks:', error);
      setLoading(false);
    }
  };

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
    
    // Convert country code to emoji flag
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
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return `לפני ${diffSec} שניות`;
    if (diffMin < 60) return `לפני ${diffMin} דקות`;
    if (diffHour < 24) return `לפני ${diffHour} שעות`;
    return `לפני ${diffDay} ימים`;
  };

  if (!accountId) {
    return (
      <div className="glass-strong rounded-2xl p-12 border border-white/10 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[var(--color-cyan)] to-[var(--color-purple)] rounded-full flex items-center justify-center opacity-50">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">⚡ Clicks בזמן אמת</h3>
        <p className="text-[var(--color-text-secondary)] mb-4">
          כאן תראו רשימה של כל ה-clicks שמגיעים לקמפיינים שלכם בזמן אמת:
        </p>
        <div className="glass rounded-lg p-4 mb-6 border border-white/10 text-right max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--color-purple)] to-[var(--color-magenta)] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-white font-bold">ישראל 🇮🇱</p>
              <p className="text-xs text-[var(--color-text-tertiary)]">Mobile • Keyword</p>
            </div>
            <div>
              <p className="text-lg font-bold gradient-text">₪2.50</p>
              <p className="text-xs text-[var(--color-text-tertiary)]">לפני 2 דקות</p>
            </div>
          </div>
          <p className="text-xs text-[var(--color-text-tertiary)]">
            כל click יופיע כאן עם פרטים: מיקום, מכשיר, עלות, וזמן
          </p>
        </div>
        <p className="text-[var(--color-text-tertiary)] text-sm mb-6">
          כדי לראות clicks בזמן אמת, חברו את חשבון Google Ads שלכם
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
          <p className="text-[var(--color-text-secondary)]">טוען clicks...</p>
        </div>
      </div>
    );
  }

  if (clicks.length === 0) {
    return (
      <div className="glass-strong rounded-2xl p-12 border border-white/10 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[var(--color-cyan)] to-[var(--color-purple)] rounded-full flex items-center justify-center opacity-50">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">אין clicks עדיין</h3>
        <p className="text-[var(--color-text-secondary)]">
          סנכרן את הנתונים מGoogle Ads כדי לראות clicks
        </p>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Clicks בזמן אמת</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {clicks.length} clicks אחרונים
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
        {clicks.map((click, index) => (
          <div
            key={click.id || index}
            className={`p-6 border-b border-white/5 hover:bg-white/5 transition-all ${
              newClickIds.has(click.id) ? 'animate-slideInRight bg-[var(--color-cyan)]/10' : ''
            }`}
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
                        {click.campaign_name || click.campaign_id || 'Unknown Campaign'}
                      </p>
                      <p className="text-xs text-[var(--color-text-tertiary)]">
                        {click.device || 'Desktop'} • {click.country_code || 'Unknown Country'}
                      </p>
                    </div>
                  </div>

                  {/* Campaign Info */}
                  {click.campaign_id && (
                    <div className="mt-2 px-3 py-1 glass rounded-lg inline-block">
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        Campaign ID: {click.campaign_id}
                      </p>
                    </div>
                  )}
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

      {/* Slide in animation */}
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideInRight {
          animation: slideInRight 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}

export default LiveClicksFeed;