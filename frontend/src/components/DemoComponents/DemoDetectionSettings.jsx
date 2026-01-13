function DemoDetectionSettings() {
  // Demo presets
  const demoPresets = [
    {
      id: 'liberal',
      name: 'רגוע על מלא',
      emoji: '🧘',
      description: 'זיהוי מינימלי - רק מקרים ברורים מאוד',
      recommended: false,
      useCases: [
        'עסקים עם תקציב גדול',
        'מי שלא רוצה false positives',
        'קמפיינים עם CTR גבוה'
      ],
      rules: {
        click_velocity: { threshold: 5, window: 2 },
        ctr_anomaly: { threshold: 3.0 },
        geographic: { enabled: false }
      }
    },
    {
      id: 'balanced',
      name: 'חשדן בקטנה',
      emoji: '🤨',
      description: 'איזון מושלם - מומלץ לרוב המשתמשים',
      recommended: true,
      useCases: [
        'רוב העסקים',
        'מי שרוצה איזון',
        'קמפיינים סטנדרטיים'
      ],
      rules: {
        click_velocity: { threshold: 3, window: 2 },
        ctr_anomaly: { threshold: 2.0 },
        geographic: { enabled: true }
      }
    },
    {
      id: 'aggressive',
      name: 'בלי חרטות',
      emoji: '😤',
      description: 'זיהוי מקסימלי - תופס הכי הרבה הונאות',
      recommended: false,
      useCases: [
        'מי שסובל מהונאות כבדות',
        'תקציב קטן',
        'קמפיינים רגישים'
      ],
      rules: {
        click_velocity: { threshold: 2, window: 2 },
        ctr_anomaly: { threshold: 1.5 },
        geographic: { enabled: true }
      }
    }
  ];

  const getPresetColor = (presetId) => {
    switch (presetId) {
      case 'liberal':
        return 'from-green-500 to-teal-500';
      case 'balanced':
        return 'from-[var(--color-cyan)] to-[var(--color-purple)]';
      case 'aggressive':
        return 'from-red-500 to-orange-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getPresetBorder = (presetId) => {
    switch (presetId) {
      case 'liberal':
        return 'border-green-500/50';
      case 'balanced':
        return 'border-[var(--color-cyan)]/50';
      case 'aggressive':
        return 'border-red-500/50';
      default:
        return 'border-white/20';
    }
  };

  return (
    <div className="glass-strong rounded-2xl border border-white/10 overflow-hidden">
      {/* Demo Badge */}
      <div className="p-2 bg-[var(--color-gray)]/10 border-b border-white/10 text-center">
        <p className="text-xs text-[var(--color-gray)] font-bold">
          🎭 דמו - חברו Google Ads להגדיר זיהוי אמיתי
        </p>
      </div>

      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-purple)] to-[var(--color-magenta)] rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">רמת זיהוי הונאות</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              בחרו את רמת הרגישות שמתאימה לכם
            </p>
          </div>
        </div>
      </div>

      {/* Presets Grid */}
      <div className="p-6">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {demoPresets.map((preset) => (
            <div
              key={preset.id}
              className={`relative group p-6 glass rounded-2xl border-2 transition-all hover:scale-105 ${
                preset.id === 'balanced'
                  ? `${getPresetBorder(preset.id)} bg-white/5`
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              {/* Selected Badge */}
              {preset.id === 'balanced' && (
                <div className="absolute -top-3 -right-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-[var(--color-success)] to-[var(--color-cyan)] rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Recommended Badge */}
              {preset.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full text-xs font-bold text-white whitespace-nowrap">
                    ⭐ מומלץ
                  </div>
                </div>
              )}

              {/* Icon */}
              <div className={`w-20 h-20 mx-auto mb-4 bg-gradient-to-br ${getPresetColor(preset.id)} rounded-2xl flex items-center justify-center text-4xl`}>
                {preset.emoji}
              </div>

              {/* Title */}
              <h4 className="text-xl font-bold text-white mb-2">{preset.name}</h4>

              {/* Description */}
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                {preset.description}
              </p>

              {/* Use Cases */}
              <div className="space-y-2">
                <p className="text-xs text-[var(--color-text-tertiary)] font-bold">מתאים ל:</p>
                {preset.useCases?.slice(0, 2).map((useCase, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-[var(--color-cyan)] rounded-full mt-1.5 flex-shrink-0" />
                    <p className="text-xs text-[var(--color-text-secondary)]">{useCase}</p>
                  </div>
                ))}
              </div>

              {/* Rules Count */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  {Object.keys(preset.rules || {}).length} כללי זיהוי פעילים
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-8 p-6 glass rounded-2xl border border-[var(--color-cyan)]/30">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-[var(--color-cyan)]/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-[var(--color-cyan)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h5 className="text-white font-bold mb-2">💡 טיפ מקצועי</h5>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                מומלץ להתחיל עם רמת "חשדן בקטנה" ואז להתאים בהתאם לתוצאות. 
                אם אתם רואים הרבה False Positives - עברו ל"רגוע על מלא". 
                אם אתם סובלים מהונאות כבדות - עברו ל"בלי חרטות".
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DemoDetectionSettings;
