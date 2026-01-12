/*
 * DashboardStats.jsx
 * 
 * Dashboard Statistics Cards עם נתונים בזמן אמת
 * מציג: סטטיסטיקות, גרפים, ומגמות
 */

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, AlertTriangle, DollarSign, MousePointer, Shield, BarChart3 } from 'lucide-react';
import { dashboardAPI } from '../services/api';

function DashboardStats({ userId }) {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    loadStats();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const loadStats = async () => {
    try {
      setError(null);
      const [statsData, chartDataResult] = await Promise.all([
        dashboardAPI.getStats().catch(() => ({})),
        dashboardAPI.getChartData(7).catch(() => [])
      ]);
      
      setStats(statsData);
      setChartData(chartDataResult || []);
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
      setError('שגיאה בטעינת נתונים');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="glass-strong rounded-2xl p-6 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-1/2 mb-4" />
            <div className="h-8 bg-white/10 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-strong rounded-2xl p-6 mb-8 border border-red-500/30">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'סך הכל קמפיינים',
      value: stats?.total_campaigns || 0,
      icon: BarChart3,
      color: 'from-cyan-500 to-blue-500',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30',
      trend: null
    },
    {
      title: 'סך הכל קליקים',
      value: formatNumber(stats?.total_clicks || 0),
      icon: MousePointer,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      trend: chartData.length > 1 ? calculateTrend(chartData, 'clicks') : null
    },
    {
      title: 'אנומליות זוהו',
      value: formatNumber(stats?.total_anomalies || 0),
      icon: AlertTriangle,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30',
      subtitle: `${stats?.high_severity || 0} חמורות`,
      trend: null
    },
    {
      title: 'עלות כוללת',
      value: `₪${formatCurrency(stats?.total_cost || 0)}`,
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      trend: chartData.length > 1 ? calculateTrend(chartData, 'cost') : null
    }
  ];

  return (
    <div className="mb-12">
      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((card, index) => (
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
                  <card.icon className="w-6 h-6 text-white" />
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

              {/* Progress Bar (if applicable) */}
              {card.title === 'אנומליות זוהו' && stats?.total_anomalies > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-[var(--color-text-tertiary)] mb-1">
                    <span>פתורות</span>
                    <span>{stats?.resolved_anomalies || 0} / {stats?.total_anomalies || 0}</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${((stats?.resolved_anomalies || 0) / (stats?.total_anomalies || 1)) * 100}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      {chartData.length > 0 && (
        <div className="glass-strong rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
              <Activity className="w-6 h-6 text-[var(--color-cyan)]" />
              מגמת קליקים (7 ימים אחרונים)
            </h3>
            <button
              onClick={loadStats}
              className="px-4 py-2 glass rounded-xl text-sm text-white hover:glass-strong transition-all"
            >
              רענון
            </button>
          </div>

          {/* Simple Bar Chart */}
          <div className="flex items-end justify-between gap-2 h-64">
            {chartData.map((item, index) => {
              const maxClicks = Math.max(...chartData.map(d => d.clicks || 0));
              const height = maxClicks > 0 ? ((item.clicks || 0) / maxClicks) * 100 : 0;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="relative w-full flex items-end justify-center">
                    <div
                      className="w-full bg-gradient-to-t from-[var(--color-cyan)] via-[var(--color-purple)] to-[var(--color-magenta)] rounded-t-lg transition-all duration-300 hover:opacity-80 cursor-pointer group-hover:scale-105"
                      style={{ height: `${height}%`, minHeight: '4px' }}
                      title={`${item.date}: ${item.clicks || 0} קליקים`}
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
                {formatNumber(Math.round(chartData.reduce((sum, d) => sum + (d.clicks || 0), 0) / chartData.length))}
              </div>
            </div>
            <div>
              <div className="text-sm text-[var(--color-text-tertiary)] mb-1">שיא יומי</div>
              <div className="text-xl font-bold text-white">
                {formatNumber(Math.max(...chartData.map(d => d.clicks || 0)))}
              </div>
            </div>
            <div>
              <div className="text-sm text-[var(--color-text-tertiary)] mb-1">עלות כוללת</div>
              <div className="text-xl font-bold text-white">
                ₪{formatCurrency(chartData.reduce((sum, d) => sum + (d.cost || 0), 0))}
              </div>
            </div>
          </div>
        </div>
      )}
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
  return new Intl.NumberFormat('he-IL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
}

function calculateTrend(data, field) {
  if (data.length < 2) return null;
  
  const recent = data.slice(-3).reduce((sum, d) => sum + (d[field] || 0), 0) / 3;
  const previous = data.slice(-6, -3).reduce((sum, d) => sum + (d[field] || 0), 0) / 3;
  
  if (previous === 0) return null;
  
  const change = ((recent - previous) / previous) * 100;
  return Math.round(change);
}

export default DashboardStats;
