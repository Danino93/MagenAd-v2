import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

function LoginHebrew() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = window.location.pathname;
  const isSignup = location === '/signup';

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }

    // Check if already logged in
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/app/dashboard');
    }
  }, [searchParams, navigate]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/auth/google');
      const data = await response.json();
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (err) {
      setError('שגיאה בהתחברות. אנא נסו שוב.');
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!email || !password) {
      setError('אנא מלאו את כל השדות');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        // אם נדרש אימות אימייל, הפנה לדף אימות
        if (data.requiresVerification) {
          localStorage.setItem('pendingVerificationEmail', data.email || email);
          navigate('/verify-email', {
            state: {
              email: data.email || email,
              message: data.error
            }
          });
          return;
        }
        throw new Error(data.error || 'שגיאה בהתחברות');
      }

      // שמור token
      localStorage.setItem('token', data.token);

      // בדוק אם צריך לדלג על onboarding (זמני)
      const skipEmails = ['admin_driveril_2024@example.com', 'admin_driveril_2024', 'danino93@gmail.com'];
      const shouldSkip = skipEmails.some(skipEmail => email.includes(skipEmail) || email === skipEmail);

      if (shouldSkip) {
        // דלג ישר לדשבורד
        navigate('/app/dashboard');
        return;
      }

      // בדוק onboarding status
      const onboardingResponse = await fetch('http://localhost:3001/api/auth/onboarding-status', {
        headers: {
          'Authorization': `Bearer ${data.token}`
        }
      });

      const onboardingData = await onboardingResponse.json();

      if (onboardingData.isOnboardingComplete) {
        navigate('/app/dashboard');
      } else {
        navigate('/app/onboarding');
      }
    } catch (err) {
      setError(err.message || 'שגיאה בהתחברות. אנא נסו שוב.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center p-4 relative overflow-hidden" dir="rtl">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] blob-cyan rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] blob-magenta rounded-full blur-3xl opacity-20" />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 grid-bg opacity-20" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Back to Home */}
        <Link 
          to="/"
          className="inline-flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-white mb-8 transition-colors group"
        >
          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
          <span>חזרה לדף הבית</span>
        </Link>

        {/* Card */}
        <div className="glass-strong rounded-3xl p-10 shadow-2xl border border-white/10">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--color-cyan)] via-[var(--color-purple)] to-[var(--color-magenta)] flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div>
                <span className="text-3xl font-bold text-white block">MagenAd</span>
                <span className="text-xs text-[var(--color-text-tertiary)]">AI Fraud Detection</span>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-3">
              {isSignup ? 'התחילו חינם' : 'ברוכים השבים'}
            </h1>
            <p className="text-[var(--color-text-secondary)] text-lg">
              {isSignup 
                ? 'צרו חשבון חדש כדי להתחיל להגן על הקמפיינים שלכם'
                : 'התחברו לחשבון שלכם כדי להמשיך'
              }
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 rounded-xl">
              <p className="text-[var(--color-danger)] text-sm text-center">{error}</p>
            </div>
          )}

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full group relative flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-bold py-5 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-gray-300 border-t-[var(--color-cyan)] rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="text-lg">המשיכו עם Google</span>
              </>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-cyan)]/5 via-[var(--color-purple)]/5 to-[var(--color-magenta)]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[var(--color-bg-primary)]/50 text-[var(--color-text-tertiary)]">או</span>
            </div>
          </div>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[var(--color-bg-primary)]/50 text-[var(--color-text-tertiary)]">או</span>
            </div>
          </div>

          {/* Manual Login Link */}
          {!showManualForm && (
            <button
              onClick={() => setShowManualForm(true)}
              className="w-full flex items-center justify-center gap-3 glass border border-white/10 hover:border-[var(--color-cyan)] text-white font-bold py-5 px-6 rounded-xl transition-all hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>התחברו עם אימייל וסיסמא</span>
            </button>
          )}

          {/* Email Login Form */}
          {showManualForm && (
            <form onSubmit={handleEmailLogin} className="space-y-4 animate-in fade-in slide-in-from-top-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                אימייל
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 glass border border-white/10 rounded-xl text-white placeholder-[var(--color-text-tertiary)] focus:border-[var(--color-cyan)] focus:outline-none transition-all"
                placeholder="הכניסו אימייל"
                dir="rtl"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                סיסמה
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 glass border border-white/10 rounded-xl text-white placeholder-[var(--color-text-tertiary)] focus:border-[var(--color-cyan)] focus:outline-none transition-all"
                placeholder="הכניסו סיסמה"
                dir="rtl"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[var(--color-cyan)] via-[var(--color-purple)] to-[var(--color-magenta)] text-white font-bold py-5 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 shadow-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{isSignup ? 'יוצר חשבון...' : 'מתחבר...'}</span>
                </div>
              ) : (
                isSignup ? 'צרו חשבון' : 'התחברו'
              )}
            </button>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={() => setShowManualForm(false)}
              className="w-full text-center text-[var(--color-text-secondary)] hover:text-white transition-colors text-sm mt-2"
            >
              ביטול
            </button>
          </form>
          )}

          {/* Sign Up / Login Link */}
          <p className="text-center text-[var(--color-text-secondary)] mt-8">
            {isSignup ? (
              <>
                כבר יש לכם חשבון?{' '}
                <Link to="/login" className="text-[var(--color-cyan)] hover:text-[var(--color-purple)] font-bold transition-colors">
                  התחברו כאן
                </Link>
              </>
            ) : (
              <>
                אין לכם חשבון?{' '}
                <Link to="/signup" className="text-[var(--color-cyan)] hover:text-[var(--color-purple)] font-bold transition-colors">
                  הירשמו עכשיו
                </Link>
              </>
            )}
          </p>

          {/* Security Info */}
          <div className="mt-8 p-4 glass rounded-xl border border-[var(--color-cyan)]/20">
            <p className="text-xs text-[var(--color-text-secondary)] text-center leading-relaxed">
              🔒 אימות מאובטח עם Google. אנחנו לעולם לא שומרים את הסיסמה שלכם.
            </p>
          </div>
        </div>

        {/* Bottom Text */}
        <p className="text-center text-xs text-[var(--color-text-tertiary)] mt-8">
          בהמשך, אתם מסכימים ל
          <Link to="/terms" className="hover:text-[var(--color-text-secondary)] transition-colors"> תנאי השימוש </Link>
          ו
          <Link to="/privacy" className="hover:text-[var(--color-text-secondary)] transition-colors">מדיניות הפרטיות</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginHebrew;