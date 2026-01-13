import { TrendingUp, TrendingDown, BarChart3, MousePointer, AlertTriangle, DollarSign, Activity } from 'lucide-react';

function DemoDashboardStats() {
  // Demo data - מדויק למקור
  const demoStats = {
    total_campaigns: 12,
    total_clicks: 45230,
    total_anomalies: 127,
    high_severity: 23,
    total_cost: 125430,
    resolved_anomalies: 89
  };

  const demoChartData = [
    { date: '2024-01-15', clicks: 3200, cost: 8500 },
    { date: '2024-01-16', clicks: 4100, cost: 10200 },
    { date: '2024-01-17', clicks: 3800, cost: 9600 },
    { date: '2024-01-18', clicks: 5200, cost: 13200 },
    { date: '2024-01-19', clicks: 4800, cost: 12100 },
    { date: '2024-01-20', clicks: 6100, cost: 15400 },
    { date: '2024-01-21', clicks: 5500, cost: 13900 }
  ];

  const statsCards = [
    {
      title: 'סך הכל קמפיינים',
      value: demoStats.total_campaigns,
      icon: BarChart3,
      color: 'from-cyan-500 to-blue-500',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30',
      trend: null
    },
    {
      title: 'סך הכל קליקים',
      value: formatNumber(demoStats.total_clicks),
      icon: MousePointer,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      trend: 12.5
    },
    {
      title: 'אנומליות זוהו',
      value: formatNumber(demoStats.total_anomalies),
      icon: AlertTriangle,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30',
      subtitle: `${demoStats.high_severity} חמורות`,
      trend: null
    },
    {
      title: 'עלות כוללת',
      value: `₪${formatCurrency(demoStats.total_cost)}`,
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      trend: 8.3
    }
  ];

  return (
    <div className="mb-12">
      {/* Demo Badge */}
      <div className="mb-4 flex items-center justify-center">
        <div className="px-4 py-2 glass rounded-full border border-[var(--color-cyan)]/30">
          <p className="text-xs text-[var(--color-cyan)] font-bold">
            🎭 דמו - חברו Google Ads לראות נתונים אמיתיים
          </p>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className={`glass-strong rounded-2xl p-6 border-2 ${card.borderColor} hover:scale-105 transition-all duration-300 group relative overflow-hidden`}
            >
              {/* Gradient Background Effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              
              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} ${card.bgColor}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  {card.trend && (
                    <div className={`flex items-center gap-1 ${card.trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {card.trend > 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span className="text-sm font-bold">{Math.abs(card.trend)}%</span>
                    </div>
                  )}
                </div>

                {/* Value */}
                <div className="mb-2">
                  <div className="text-3xl font-bold text-white mb-1">
                    {card.value}
                  </div>
                  <div className="text-sm text-[var(--color-text-secondary)]">
                    {card.title}
                  </div>
                  {card.subtitle && (
                    <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
                      {card.subtitle}
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                {card.title === 'אנומליות זוהו' && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-[var(--color-text-tertiary)] mb-1">
                      <span>פתורות</span>
                      <span>{demoStats.resolved_anomalies} / {demoStats.total_anomalies}</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                        style={{
                          width: `${(demoStats.resolved_anomalies / demoStats.total_anomalies) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart Section */}
      <div className="glass-strong rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white flex items-center gap-3">
            <Activity className="w-6 h-6 text-[var(--color-cyan)]" />
            מגמת קליקים (7 ימים אחרונים)
          </h3>
        </div>

        {/* Simple Bar Chart */}
        <div className="flex items-end justify-between gap-2 h-64">
          {demoChartData.map((item, index) => {
            const maxClicks = Math.max(...demoChartData.map(d => d.clicks));
            const height = (item.clicks / maxClicks) * 100;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="relative w-full flex items-end justify-center">
                  <div
                    className="w-full bg-gradient-to-t from-[var(--color-cyan)] via-[var(--color-purple)] to-[var(--color-magenta)] rounded-t-lg transition-all duration-300 hover:opacity-80 cursor-pointer group-hover:scale-105"
                    style={{ height: `${height}%`, minHeight: '4px' }}
                    title={`${item.date}: ${item.clicks} קליקים`}
                  />
                </div>
                <div className="text-xs text-[var(--color-text-tertiary)] transform -rotate-45 origin-center whitespace-nowrap">
                  {new Date(item.date).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Chart Summary */}
        <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
          <div>
            <div className="text-sm text-[var(--color-text-tertiary)] mb-1">ממוצע יומי</div>
            <div className="text-xl font-bold text-white">
              {formatNumber(Math.round(demoChartData.reduce((sum, d) => sum + d.clicks, 0) / demoChartData.length))}
            </div>
          </div>
          <div>
            <div className="text-sm text-[var(--color-text-tertiary)] mb-1">שיא יומי</div>
            <div className="text-xl font-bold text-white">
              {formatNumber(Math.max(...demoChartData.map(d => d.clicks)))}
            </div>
          </div>
          <div>
            <div className="text-sm text-[var(--color-text-tertiary)] mb-1">עלות כוללת</div>
            <div className="text-xl font-bold text-white">
              ₪{formatCurrency(demoChartData.reduce((sum, d) => sum + d.cost, 0))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

function formatCurrency(num) {
  return new Intl.NumberFormat('he-IL').format(num);
}

export default DemoDashboardStats;
