import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

function VerifyEmailHebrew() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // קבל אימייל מ-state או localStorage
    const stateEmail = location.state?.email;
    const storedEmail = localStorage.getItem('pendingVerificationEmail');
    const emailToUse = stateEmail || storedEmail || '';
    
    if (emailToUse) {
      setEmail(emailToUse);
    } else {
      // אם אין אימייל, הפנה ל-signup
      navigate('/signup');
    }
  }, [location, navigate]);

  const handleResendEmail = async () => {
    if (!email) {
      setError('אנא הכניסו כתובת אימייל');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('http://localhost:3001/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'שגיאה בשליחת אימייל');
      }

      setMessage(data.message || 'אימייל אימות נשלח מחדש. אנא בדקו את תיבת הדואר.');
    } catch (err) {
      setError(err.message || 'שגיאה בשליחת אימייל אימות');
    } finally {
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <span className="text-3xl font-bold text-white block">MagenAd</span>
                <span className="text-xs text-[var(--color-text-tertiary)]">אימות אימייל</span>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[var(--color-cyan)] to-[var(--color-purple)] rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">
              בדקו את האימייל שלכם
            </h1>
            <p className="text-[var(--color-text-secondary)] text-lg">
              שלחנו לכם קישור אימות לכתובת:
            </p>
            <p className="text-[var(--color-cyan)] font-bold text-lg mt-2 break-all">
              {email}
            </p>
          </div>

          {/* Success Message */}
          {message && (
            <div className="mb-6 p-4 bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 rounded-xl">
              <p className="text-[var(--color-success)] text-sm text-center">{message}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 rounded-xl">
              <p className="text-[var(--color-danger)] text-sm text-center">{error}</p>
            </div>
          )}

          {/* Instructions */}
          <div className="mb-8 p-6 glass rounded-xl border border-white/10">
            <h3 className="text-lg font-bold text-white mb-4">מה הלאה?</h3>
            <ol className="space-y-3 text-[var(--color-text-secondary)] text-sm list-decimal list-inside">
              <li>פתחו את תיבת הדואר הנכנס שלכם</li>
              <li>חפשו אימייל מ-MagenAd</li>
              <li>לחצו על קישור האימות באימייל</li>
              <li>אחרי האימות תועברו אוטומטית למערכת</li>
            </ol>
          </div>

          {/* Resend Email Button */}
          <button
            onClick={handleResendEmail}
            disabled={loading}
            className="w-full bg-gradient-to-r from-[var(--color-cyan)] via-[var(--color-purple)] to-[var(--color-magenta)] text-white font-bold py-5 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 shadow-lg mb-4"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>שולח...</span>
              </div>
            ) : (
              'שלחו אימייל אימות מחדש'
            )}
          </button>

          {/* Back to Login */}
          <p className="text-center text-[var(--color-text-secondary)]">
            כבר אימתתם?{' '}
            <Link to="/login" className="text-[var(--color-cyan)] hover:text-[var(--color-purple)] font-bold transition-colors">
              התחברו כאן
            </Link>
          </p>
        </div>

        {/* Help Text */}
        <div className="mt-8 p-4 glass rounded-xl border border-white/10">
          <p className="text-xs text-[var(--color-text-secondary)] text-center leading-relaxed">
            💡 לא קיבלתם את האימייל? בדקו גם בתיקיית הספאם או לחצו על "שלחו אימייל אימות מחדש"
          </p>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmailHebrew;
