/*
 * QuickActions.jsx
 * 
 * Quick Actions Panel - פעולות מהירות
 */

import { useNavigate } from 'react-router-dom';
import { 
  Zap, 
  FileText, 
  Settings, 
  Download, 
  RefreshCw, 
  Shield,
  BarChart3,
  AlertCircle
} from 'lucide-react';

function QuickActions({ accountId }) {
  const navigate = useNavigate();

  const actions = [
    {
      icon: Zap,
      label: 'הפעל זיהוי',
      description: 'הרץ זיהוי הונאות עכשיו',
      color: 'from-yellow-500 to-orange-500',
      onClick: () => {
        // TODO: Trigger detection
        console.log('Trigger detection');
      }
    },
    {
      icon: FileText,
      label: 'הפק דוח',
      description: 'צור דוח מפורט',
      color: 'from-blue-500 to-cyan-500',
      onClick: () => navigate('/app/reports')
    },
    {
      icon: Download,
      label: 'ייצא נתונים',
      description: 'הורד CSV/Excel',
      color: 'from-green-500 to-emerald-500',
      onClick: () => {
        // TODO: Export data
        console.log('Export data');
      }
    },
    {
      icon: RefreshCw,
      label: 'רענון נתונים',
      description: 'סנכרן עם Google Ads',
      color: 'from-purple-500 to-pink-500',
      onClick: () => {
        // TODO: Sync with Google Ads
        console.log('Sync with Google Ads');
      }
    },
    {
      icon: Settings,
      label: 'הגדרות',
      description: 'הגדר זיהוי ופרופילים',
      color: 'from-gray-500 to-slate-500',
      onClick: () => navigate('/app/settings')
    },
    {
      icon: Shield,
      label: 'ניהול IP',
      description: 'נהל רשימות שחור/לבן',
      color: 'from-red-500 to-rose-500',
      onClick: () => {
        // TODO: Navigate to IP management
        console.log('IP Management');
      }
    }
  ];

  if (!accountId) {
    return (
      <div className="glass-strong rounded-2xl p-8 border border-white/10 mb-8">
        <div className="text-center">
          <Shield className="w-16 h-16 text-[var(--color-text-tertiary)] mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-white mb-2">פעולות מהירות</h3>
          <p className="text-[var(--color-text-secondary)] mb-6">
            חברו את Google Ads כדי לגשת לפעולות מהירות
          </p>
          <button
            onClick={() => navigate('/app/connect-ads')}
            className="px-6 py-3 bg-gradient-to-r from-[var(--color-cyan)] to-[var(--color-purple)] rounded-xl text-white font-bold hover:scale-105 transition-all"
          >
            חברו עכשיו
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-strong rounded-2xl p-6 border border-white/10 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
          <Zap className="w-6 h-6 text-[var(--color-cyan)]" />
          פעולות מהירות
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className="group relative glass rounded-xl p-4 hover:glass-strong transition-all duration-300 hover:scale-105 border border-white/10 hover:border-white/30"
          >
            <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all`}>
              <action.icon className="w-6 h-6 text-white" />
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-white mb-1">
                {action.label}
              </div>
              <div className="text-xs text-[var(--color-text-tertiary)]">
                {action.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default QuickActions;
