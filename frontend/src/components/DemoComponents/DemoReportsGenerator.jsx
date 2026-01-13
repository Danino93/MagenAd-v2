import { Download, FileText, Calendar, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';

function DemoReportsGenerator() {
  const reportTypes = [
    { 
      value: 'summary', 
      label: 'סיכום כללי',
      icon: FileText,
      description: 'סקירה כוללת של כל הפעילות'
    },
    { 
      value: 'anomalies', 
      label: 'דוח אנומליות',
      icon: AlertTriangle,
      description: 'ריכוז כל האנומליות שזוהו'
    },
    { 
      value: 'financial', 
      label: 'דוח פיננסי',
      icon: DollarSign,
      description: 'הוצאות, חיסכון ו-ROI'
    },
    { 
      value: 'campaigns', 
      label: 'דוח קמפיינים',
      icon: TrendingUp,
      description: 'ביצועים של כל הקמפיינים'
    }
  ];

  const dateRanges = [
    { value: 'today', label: 'היום' },
    { value: 'yesterday', label: 'אתמול' },
    { value: '7days', label: '7 ימים אחרונים' },
    { value: '30days', label: '30 ימים אחרונים' },
    { value: 'thisMonth', label: 'החודש הנוכחי' },
    { value: 'lastMonth', label: 'החודש שעבר' }
  ];

  const formats = [
    { value: 'pdf', label: 'PDF', icon: '📄' },
    { value: 'excel', label: 'Excel', icon: '📊' },
    { value: 'csv', label: 'CSV', icon: '📋' }
  ];

  return (
    <div className="glass-strong rounded-2xl border border-white/10 overflow-hidden">
      {/* Demo Badge */}
      <div className="p-2 bg-[var(--color-pink)]/10 border-b border-white/10 text-center">
        <p className="text-xs text-[var(--color-pink)] font-bold">
          🎭 דמו - חברו Google Ads ליצור דוחות אמיתיים
        </p>
      </div>

      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-pink)] to-[var(--color-rose)] rounded-xl flex items-center justify-center">
            <Download className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">הפקת דוח מתקדם</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              בחרו סוג דוח, טווח תאריכים ופורמט
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Report Type */}
        <div>
          <label className="block text-white font-bold mb-3">סוג דוח</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {reportTypes.map(type => {
              const Icon = type.icon;
              return (
                <div
                  key={type.value}
                  className="glass rounded-xl p-4 border border-white/10 hover:border-[var(--color-cyan)]/50 transition-all cursor-pointer hover:scale-105"
                >
                  <Icon className="w-8 h-8 text-[var(--color-cyan)] mb-2" />
                  <div className="text-white font-bold text-sm mb-1">{type.label}</div>
                  <div className="text-xs text-[var(--color-text-secondary)]">{type.description}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-white font-bold mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            טווח תאריכים
          </label>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {dateRanges.map(range => (
              <button
                key={range.value}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  range.value === '7days'
                    ? 'bg-gradient-to-r from-[var(--color-cyan)] to-[var(--color-purple)] text-white'
                    : 'glass hover:bg-white/10 text-[var(--color-text-secondary)]'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Format */}
        <div>
          <label className="block text-white font-bold mb-3">פורמט</label>
          <div className="flex gap-4">
            {formats.map(format => (
              <button
                key={format.value}
                className={`flex-1 px-6 py-4 rounded-xl font-medium transition-all ${
                  format.value === 'pdf'
                    ? 'bg-gradient-to-r from-[var(--color-cyan)] to-[var(--color-purple)] text-white'
                    : 'glass hover:bg-white/10 text-[var(--color-text-secondary)]'
                }`}
              >
                <span className="text-2xl mb-2 block">{format.icon}</span>
                {format.label}
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div>
          <label className="block text-white font-bold mb-3">אפשרויות</label>
          <div className="space-y-2">
            {[
              { label: 'כלול גרפים', checked: true },
              { label: 'כלול אנומליות', checked: true },
              { label: 'כלול קמפיינים', checked: true },
              { label: 'כלול נתונים פיננסיים', checked: true }
            ].map((option, index) => (
              <label key={index} className="flex items-center gap-3 glass rounded-lg p-3 border border-white/10 cursor-pointer hover:bg-white/5">
                <input
                  type="checkbox"
                  defaultChecked={option.checked}
                  className="w-5 h-5 rounded border-white/20 bg-white/10 text-[var(--color-cyan)] focus:ring-[var(--color-cyan)]"
                />
                <span className="text-white">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <div className="pt-4 border-t border-white/10">
          <button
            disabled
            className="w-full px-8 py-4 bg-gradient-to-r from-[var(--color-pink)] to-[var(--color-rose)] text-white font-bold rounded-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <Download className="w-5 h-5" />
            <span>הפק דוח (דמו)</span>
          </button>
          <p className="text-xs text-[var(--color-text-tertiary)] text-center mt-2">
            חברו Google Ads כדי ליצור דוחות אמיתיים
          </p>
        </div>
      </div>
    </div>
  );
}

export default DemoReportsGenerator;
