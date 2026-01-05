import { Link } from 'react-router-dom';
import { useState } from 'react';

function CTASectionHebrew() {
  const [email, setEmail] = useState('');
  const [budget, setBudget] = useState(10000);
  const fraudPercentage = 25;
  const monthlySavings = (budget * (fraudPercentage / 100)).toFixed(0);
  const yearlySavings = (monthlySavings * 12).toFixed(0);

  return (
    <section className="relative py-32 px-6 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-cyan)]/10 via-[var(--color-purple)]/10 to-[var(--color-magenta)]/10" />
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] blob-cyan rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] blob-magenta rounded-full blur-3xl opacity-20" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Calculator Section */}
        <div className="glass-strong rounded-3xl p-12 mb-12 border border-white/10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full mb-6">
              <span className="text-sm gradient-text font-bold">מחשבון חיסכון</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-4">
              כמה כסף <span className="gradient-text">תחסכו</span>?
            </h2>
            <p className="text-xl text-[var(--color-text-secondary)]">
              הזינו את התקציב החודשי שלכם ונראה את הפוטנציאל
            </p>
          </div>

          {/* Calculator */}
          <div className="max-w-2xl mx-auto">
            {/* Budget Input */}
            <div className="mb-8">
              <label className="block text-right text-lg font-bold text-white mb-4">
                תקציב חודשי ב-Google Ads:
              </label>
              <div className="relative">
                <input
                  type="range"
                  min="1000"
                  max="100000"
                  step="1000"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full h-3 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to left, var(--color-cyan) 0%, var(--color-purple) 50%, var(--color-magenta) 100%)`
                  }}
                />
                <div className="text-center mt-4">
                  <span className="text-5xl font-bold font-mono gradient-text">
                    ₪{budget.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="grid md:grid-cols-2 gap-6 mt-12">
              <div className="glass rounded-2xl p-8 text-center glow-cyan">
                <div className="text-sm text-[var(--color-text-secondary)] mb-2">חיסכון חודשי משוער</div>
                <div className="text-5xl font-bold font-mono gradient-text mb-2">
                  ₪{monthlySavings.toLocaleString()}
                </div>
                <div className="text-xs text-[var(--color-text-tertiary)]">
                  (25% ממוצע fraud)
                </div>
              </div>

              <div className="glass rounded-2xl p-8 text-center glow-magenta">
                <div className="text-sm text-[var(--color-text-secondary)] mb-2">חיסכון שנתי משוער</div>
                <div className="text-5xl font-bold font-mono gradient-text mb-2">
                  ₪{yearlySavings.toLocaleString()}
                </div>
                <div className="text-xs text-[var(--color-text-tertiary)]">
                  (12 חודשים)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main CTA */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full mb-6">
            <span className="text-sm font-bold gradient-text">מבצע לזמן מוגבל</span>
          </div>

          <h2 className="text-5xl md:text-7xl font-bold text-white mb-6">
            התחילו לחסוך כסף
            <br />
            <span className="gradient-text">היום</span>
          </h2>

          <p className="text-xl text-[var(--color-text-secondary)] mb-8 max-w-2xl mx-auto">
            הצטרפו למאות משווקים שהפסיקו לבזבז תקציב פרסום על קליקים מזויפים.
            <br />
            <span className="font-bold text-white">ללא כרטיס אשראי. ללא התחייבות.</span>
          </p>

          {/* Email Signup */}
          <div className="max-w-md mx-auto mb-8">
            <div className="flex gap-3">
              <input
                type="email"
                placeholder="הכניסו אימייל"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-6 py-4 glass-strong rounded-xl text-white placeholder-[var(--color-text-tertiary)] border border-white/10 focus:border-[var(--color-cyan)] focus:outline-none transition-all"
                dir="rtl"
              />
              <Link
                to="/signup"
                className="btn-primary whitespace-nowrap"
              >
                התחילו חינם →
              </Link>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--color-text-secondary)]">
            {[
              { icon: '✓', text: 'ללא כרטיס אשראי' },
              { icon: '✓', text: '14 ימי ניסיון' },
              { icon: '✓', text: 'ביטול בכל עת' },
              { icon: '✓', text: 'תמיכה בעברית' }
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-[var(--color-success)] text-lg">{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default CTASectionHebrew;
