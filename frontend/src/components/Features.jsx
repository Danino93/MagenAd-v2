function FeaturesHebrew() {
  const features = [
    {
      icon: (
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      ),
      title: 'זיהוי בזמן אמת',
      description: '12 כללי AI מתקדמים מזהים דפוסים חשודים באופן מיידי. חוסמים הונאות לפני שהן מרוקנות את התקציב.',
      gradient: 'from-[var(--color-cyan)] to-[var(--color-purple)]',
      glowClass: 'glow-cyan'
    },
    {
      icon: (
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: 'מדד השקט™',
      description: 'מערכת ניקוד ייחודית שמראה כמה "שקט" הקמפיין שלכם. ציון נמוך = פחות הונאות. פשוט וברור.',
      gradient: 'from-[var(--color-purple)] to-[var(--color-magenta)]',
      glowClass: 'glow-purple'
    },
    {
      icon: (
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: 'מצב למידה חכם',
      description: 'תקופת למידה של 7 ימים שמבססת דפוסי baseline. אפס false positives, דיוק מקסימלי. המערכת לומדת את העסק שלכם.',
      gradient: 'from-[var(--color-magenta)] to-[var(--color-cyan)]',
      glowClass: 'glow-magenta'
    }
  ];

  return (
    <section className="relative py-32 px-6 overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 blob-cyan rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-0 right-0 w-96 h-96 blob-magenta rounded-full blur-3xl opacity-30" />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 grid-bg opacity-20" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full mb-6">
            <span className="w-2 h-2 bg-[var(--color-success)] rounded-full pulse-glow" />
            <span className="text-sm text-[var(--color-text-secondary)]">למה MagenAd?</span>
          </div>
          
          <h2 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            הגנה ש
            <span className="gradient-text">באמת עובדת</span>
          </h2>
          <p className="text-xl text-[var(--color-text-secondary)] max-w-3xl mx-auto leading-relaxed">
            נבנה על ידי משווקים שנמאס להם לאבד כסף על קליקים מזויפים.
            <br />
            <span className="font-bold text-white">אנחנו יודעים בדיוק מה לחפש.</span>
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`group relative glass-strong rounded-3xl p-10 hover:bg-white/10 transition-all duration-500 card-3d border border-white/10 hover:border-white/20 ${feature.glowClass}`}
              style={{
                animationDelay: `${index * 0.1}s`
              }}
            >
              {/* Gradient Overlay on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-3xl transition-opacity duration-500`} />
              
              {/* Content */}
              <div className="relative z-10">
                {/* Icon with Gradient Background */}
                <div className={`inline-flex p-5 bg-gradient-to-br ${feature.gradient} rounded-2xl text-white mb-8 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                  {feature.icon}
                </div>

                {/* Title */}
                <h3 className="text-3xl font-bold text-white mb-5 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[var(--color-cyan)] group-hover:to-[var(--color-magenta)] transition-all duration-300">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-[var(--color-text-secondary)] text-lg leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Animated Border on Hover */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-b-3xl`} />
              
              {/* Corner Accent */}
              <div className={`absolute top-6 left-6 w-12 h-12 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 rounded-full blur-xl transition-opacity duration-500`} />
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-20">
          <a
            href="/features"
            className="inline-flex items-center gap-3 text-lg font-bold group"
          >
            <span className="gradient-text">צפו בכל 12 כללי הזיהוי</span>
            <svg className="w-6 h-6 text-[var(--color-cyan)] group-hover:-translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
        </div>

        {/* Additional Stats */}
        <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: '99.9%', label: 'דיוק זיהוי' },
            { value: '< 1ms', label: 'זמן תגובה' },
            { value: '24/7', label: 'ניטור רציף' },
            { value: '0', label: 'False Positives' }
          ].map((stat, index) => (
            <div key={index} className="glass rounded-2xl p-6 text-center hover:scale-105 transition-transform duration-300">
              <div className="text-4xl font-bold font-mono gradient-text mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-[var(--color-text-secondary)]">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturesHebrew;