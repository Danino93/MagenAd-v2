import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function HeroHebrew() {
  const [mounted, setMounted] = useState(false);
  const [count, setCount] = useState({ fraud: 0, saved: 0, detections: 0 });

  useEffect(() => {
    setMounted(true);
    
    // אנימציית מספרים עולים
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;
    
    const targets = {
      fraud: 2400000,
      saved: 8500000,
      detections: 145000
    };
    
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      
      setCount({
        fraud: Math.floor(targets.fraud * progress),
        saved: Math.floor(targets.saved * progress),
        detections: Math.floor(targets.detections * progress)
      });
      
      if (step >= steps) {
        clearInterval(timer);
        setCount(targets);
      }
    }, interval);
    
    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return `₪${(num / 1000000).toFixed(1)}M`;
    }
    return `₪${(num / 1000).toFixed(0)}K`;
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Animated Blobs Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] blob-cyan rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] blob-purple rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blob-magenta rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 grid-bg opacity-20" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 text-center">
        {/* Badge */}
        <div className={`inline-flex items-center gap-2 px-5 py-2.5 glass rounded-full mb-8 transition-all duration-700 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <span className="w-2.5 h-2.5 rounded-full pulse-glow" style={{ background: 'var(--gradient-success)' }} />
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">מגן על תקציב הפרסום שלך ב-Google Ads</span>
        </div>

        {/* Main Headline - עם צבעים מתחלפים! */}
        <h1 className={`text-6xl md:text-8xl font-bold mb-6 leading-tight transition-all duration-700 delay-100 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <span className="text-white">תפסיקו לבזבז כסף</span>
          <br />
          <span className="gradient-text text-7xl md:text-9xl">על קליקים מזויפים</span>
        </h1>

        {/* Subheadline */}
        <p className={`text-xl md:text-2xl text-[var(--color-text-secondary)] max-w-3xl mx-auto mb-12 leading-relaxed transition-all duration-700 delay-200 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          זיהוי הונאות מבוסס AI עבור Google Ads.
          <br />
          <span className="gradient-text font-bold">חסכו עד 30% מתקציב הפרסום</span> עם הגנה בזמן אמת.
        </p>

        {/* CTA Buttons */}
        <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 transition-all duration-700 delay-300 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <Link
            to="/signup"
            className="btn-primary group relative"
          >
            <span className="relative z-10 flex items-center gap-2">
              התחילו ניסיון חינם
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </span>
          </Link>
          
          <Link
            to="#how-it-works"
            className="btn-secondary"
          >
            איך זה עובד? →
          </Link>
        </div>

        {/* Live Stats - מספרים עם צבעים מתחלפים */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 transition-all duration-700 delay-500 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          {/* Stat 1 */}
          <div className="glass-strong rounded-2xl p-8 card-3d group">
            <div className="text-5xl font-bold font-mono mb-2 count-up gradient-text">
              {formatNumber(count.fraud)}+
            </div>
            <div className="text-sm text-[var(--color-text-secondary)] font-medium">
              הונאות שזוהו ונחסמו
            </div>
            <div className="mt-4 h-1 w-full bg-gradient-to-r from-[var(--color-cyan)] via-[var(--color-purple)] to-[var(--color-magenta)] rounded-full" />
          </div>

          {/* Stat 2 */}
          <div className="glass-strong rounded-2xl p-8 card-3d group">
            <div className="text-5xl font-bold font-mono mb-2 count-up gradient-text">
              {formatNumber(count.saved)}
            </div>
            <div className="text-sm text-[var(--color-text-secondary)] font-medium">
              נחסכו ללקוחותינו
            </div>
            <div className="mt-4 h-1 w-full bg-gradient-to-r from-[var(--color-magenta)] via-[var(--color-purple)] to-[var(--color-cyan)] rounded-full" />
          </div>

          {/* Stat 3 */}
          <div className="glass-strong rounded-2xl p-8 card-3d group">
            <div className="text-5xl font-bold font-mono mb-2 count-up gradient-text">
              {(count.detections / 1000).toFixed(0)}K+
            </div>
            <div className="text-sm text-[var(--color-text-secondary)] font-medium">
              קליקים מנותחים מדי יום
            </div>
            <div className="mt-4 h-1 w-full bg-gradient-to-r from-[var(--color-purple)] via-[var(--color-cyan)] to-[var(--color-magenta)] rounded-full" />
          </div>
        </div>

        {/* Dashboard Preview Mock */}
        <div className={`mt-20 relative transition-all duration-700 delay-700 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="relative max-w-6xl mx-auto">
            {/* Multiple Glow Layers */}
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-cyan)] via-[var(--color-purple)] to-[var(--color-magenta)] blur-3xl opacity-20 animate-pulse" />
            <div className="absolute inset-0 bg-[var(--color-cyan)] blur-2xl opacity-10" style={{ animationDelay: '1s' }} />
            
            {/* Dashboard Container */}
            <div className="relative glass-strong rounded-3xl p-2 overflow-hidden border-2 border-white/10">
              <div className="bg-[var(--color-bg-primary)] rounded-2xl p-8">
                {/* Mock Header */}
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[var(--color-danger)]" />
                    <div className="w-3 h-3 rounded-full bg-[#FFB800]" />
                    <div className="w-3 h-3 rounded-full bg-[var(--color-success)]" />
                  </div>
                  <div className="text-xs text-[var(--color-text-tertiary)] font-mono">לוח הבקרה של MagenAd</div>
                </div>
                
                {/* Mock Content */}
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-28 glass rounded-xl border border-[var(--color-cyan)]/20 glow-cyan" />
                    <div className="h-28 glass rounded-xl border border-[var(--color-purple)]/20 glow-purple" />
                    <div className="h-28 glass rounded-xl border border-[var(--color-magenta)]/20 glow-magenta" />
                  </div>
                  
                  {/* Chart */}
                  <div className="h-64 glass rounded-xl border border-white/5 relative overflow-hidden">
                    {/* Animated Lines */}
                    <div className="absolute bottom-0 left-0 right-0 h-40 flex items-end justify-around gap-2 p-4">
                      {[...Array(12)].map((_, i) => (
                        <div 
                          key={i}
                          className="flex-1 rounded-t-lg transition-all duration-1000"
                          style={{
                            background: 'linear-gradient(180deg, var(--color-cyan), var(--color-purple))',
                            height: `${Math.random() * 80 + 20}%`,
                            animationDelay: `${i * 0.1}s`,
                            opacity: mounted ? 1 : 0
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="flex flex-col items-center gap-2 animate-bounce">
          <span className="text-xs text-[var(--color-text-tertiary)]">גללו למטה</span>
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center p-2">
            <div className="w-1 h-3 bg-gradient-to-b from-[var(--color-cyan)] to-transparent rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroHebrew;