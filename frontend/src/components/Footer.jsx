import { Link } from 'react-router-dom';

function FooterHebrew() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-white/10 bg-[var(--color-bg-primary)]">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-cyan)] via-[var(--color-purple)] to-[var(--color-magenta)] flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div>
                <span className="text-2xl font-bold text-white block">MagenAd</span>
                <span className="text-xs text-[var(--color-text-tertiary)]">AI Fraud Detection</span>
              </div>
            </div>
            <p className="text-[var(--color-text-secondary)] text-sm mb-6 leading-relaxed">
              זיהוי הונאות מבוסס AI עבור Google Ads. 
              הגנו על התקציב שלכם בזמן אמת.
            </p>
            
            {/* Social Links */}
            <div className="flex items-center gap-3">
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-11 h-11 flex items-center justify-center glass hover:glass-strong rounded-xl transition-all hover:scale-110 glow-hover"
              >
                <svg className="w-5 h-5 text-[var(--color-text-secondary)]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-11 h-11 flex items-center justify-center glass hover:glass-strong rounded-xl transition-all hover:scale-110 glow-hover"
              >
                <svg className="w-5 h-5 text-[var(--color-text-secondary)]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-11 h-11 flex items-center justify-center glass hover:glass-strong rounded-xl transition-all hover:scale-110 glow-hover"
              >
                <svg className="w-5 h-5 text-[var(--color-text-secondary)]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            </div>
          </div>

          {/* מוצר */}
          <div>
            <h3 className="text-white font-bold mb-6 text-lg">המוצר</h3>
            <ul className="space-y-4">
              {['תכונות', 'תמחור', 'איך זה עובד', 'אינטגרציות'].map((item) => (
                <li key={item}>
                  <Link 
                    to={`/${item.toLowerCase()}`} 
                    className="text-[var(--color-text-secondary)] hover:text-white hover:translate-x-1 inline-block transition-all"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* חברה */}
          <div>
            <h3 className="text-white font-bold mb-6 text-lg">החברה</h3>
            <ul className="space-y-4">
              {['אודות', 'בלוג', 'קריירה', 'צור קשר'].map((item) => (
                <li key={item}>
                  <Link 
                    to={`/${item.toLowerCase()}`} 
                    className="text-[var(--color-text-secondary)] hover:text-white hover:translate-x-1 inline-block transition-all"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* משפטי */}
          <div>
            <h3 className="text-white font-bold mb-6 text-lg">משפטי</h3>
            <ul className="space-y-4">
              {['מדיניות פרטיות', 'תנאי שימוש', 'GDPR', 'אבטחת מידע'].map((item) => (
                <li key={item}>
                  <Link 
                    to={`/${item.toLowerCase()}`} 
                    className="text-[var(--color-text-secondary)] hover:text-white hover:translate-x-1 inline-block transition-all"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[var(--color-text-secondary)] text-sm">
            © {currentYear} MagenAd. כל הזכויות שמורות.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[var(--color-text-tertiary)] text-xs">נוצר עם</span>
            <span className="text-[var(--color-magenta)] animate-pulse">♥</span>
            <span className="text-[var(--color-text-tertiary)] text-xs">בישראל</span>
            <span className="text-2xl">🇮🇱</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default FooterHebrew;
