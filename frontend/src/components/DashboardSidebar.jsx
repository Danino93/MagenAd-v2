import { useState } from 'react';
import { 
  LayoutDashboard, 
  Activity, 
  TrendingUp, 
  Shield, 
  AlertTriangle, 
  BarChart3,
  Settings,
  Globe,
  FileText,
  Zap,
  Eye
} from 'lucide-react';

function DashboardSidebar({ activeView, onViewChange, hasConnection }) {
  const menuItems = [
    {
      id: 'overview',
      label: 'סקירה כללית',
      icon: LayoutDashboard,
      color: 'from-cyan-500 to-blue-500',
      available: true
    },
    {
      id: 'stats',
      label: 'סטטיסטיקות',
      icon: BarChart3,
      color: 'from-purple-500 to-pink-500',
      available: true
    },
    {
      id: 'live',
      label: 'קליקים בזמן אמת',
      icon: Activity,
      color: 'from-green-500 to-emerald-500',
      available: true
    },
    {
      id: 'alerts',
      label: 'התראות הונאה',
      icon: AlertTriangle,
      color: 'from-red-500 to-rose-500',
      available: true
    },
    {
      id: 'analytics',
      label: 'אנליטיקס מתקדם',
      icon: TrendingUp,
      color: 'from-yellow-500 to-orange-500',
      available: true
    },
    {
      id: 'monitoring',
      label: 'ניטור בזמן אמת',
      icon: Eye,
      color: 'from-indigo-500 to-purple-500',
      available: true
    },
    {
      id: 'quiet-index',
      label: 'מדד שקט',
      icon: Shield,
      color: 'from-teal-500 to-cyan-500',
      available: true
    },
    {
      id: 'ip-management',
      label: 'ניהול IP',
      icon: Globe,
      color: 'from-blue-500 to-indigo-500',
      available: true
    },
    {
      id: 'reports',
      label: 'דוחות',
      icon: FileText,
      color: 'from-pink-500 to-rose-500',
      available: true
    },
    {
      id: 'settings',
      label: 'הגדרות זיהוי',
      icon: Settings,
      color: 'from-gray-500 to-slate-500',
      available: true
    }
  ];

  return (
    <aside className="w-80 glass-strong border-l border-white/10 h-[calc(100vh-80px)] sticky top-20 overflow-y-auto">
      <div className="p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Zap className="w-5 h-5 text-[var(--color-cyan)]" />
          תפריט ניווט
        </h2>
        
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                disabled={!item.available}
                className={`w-full group relative flex items-center gap-4 p-4 rounded-xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-r ' + item.color + ' text-white shadow-lg scale-105'
                    : item.available
                      ? 'glass hover:glass-strong text-[var(--color-text-secondary)] hover:text-white hover:scale-105'
                      : 'glass opacity-40 cursor-not-allowed text-[var(--color-text-tertiary)]'
                }`}
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-white/20'
                    : 'bg-white/5 group-hover:bg-white/10'
                }`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[var(--color-cyan)]'}`} />
                </div>
                
                {/* Label */}
                <span className="font-bold text-sm flex-1 text-right">
                  {item.label}
                </span>
                
                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                )}
                
              </button>
            );
          })}
        </nav>
        
        {/* Info Card */}
        {!hasConnection && (
          <div className="mt-8 p-4 glass rounded-xl border border-[var(--color-cyan)]/30">
            <p className="text-xs text-[var(--color-text-secondary)] text-center leading-relaxed">
              💡 חיבור Google Ads נדרש כדי לראות נתונים אמיתיים
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}

export default DashboardSidebar;
