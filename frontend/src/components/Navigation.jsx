import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function NavigationHebrew() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'glass-strong border-b border-white/10' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo - מיוחד! */}
          <Link 
            to="/" 
            className="flex items-center gap-3 group"
          >
            {/* Logo Icon - Shield + AI */}
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-cyan)] via-[var(--color-purple)] to-[var(--color-magenta)] flex items-center justify-center font-bold text-white text-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 glow-hover">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              {/* Pulsing dot */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-[var(--color-success)] rounded-full pulse-glow" />
            </div>
            
            {/* Logo Text */}
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-white leading-none">
                MagenAd
              </span>
              <span className="text-xs text-[var(--color-text-tertiary)] leading-none">
                AI Fraud Detection
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link 
              to="/features" 
              className="text-[var(--color-text-secondary)] hover:text-white transition-colors relative group"
            >
              <span>תכונות</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[var(--color-cyan)] to-[var(--color-purple)] group-hover:w-full transition-all duration-300" />
            </Link>
            <Link 
              to="/pricing" 
              className="text-[var(--color-text-secondary)] hover:text-white transition-colors relative group"
            >
              <span>תמחור</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[var(--color-purple)] to-[var(--color-magenta)] group-hover:w-full transition-all duration-300" />
            </Link>
            <Link 
              to="/about" 
              className="text-[var(--color-text-secondary)] hover:text-white transition-colors relative group"
            >
              <span>אודות</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[var(--color-magenta)] to-[var(--color-cyan)] group-hover:w-full transition-all duration-300" />
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-4">
            {token ? (
              <button
                onClick={() => navigate('/app/dashboard')}
                className="btn-primary text-base py-3 px-6"
              >
                לוח הבקרה
              </button>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-[var(--color-text-secondary)] hover:text-white transition-colors font-medium"
                >
                  התחברות
                </Link>
                <Link 
                  to="/signup"
                  className="btn-primary text-base py-3 px-6"
                >
                  התחילו חינם
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default NavigationHebrew;