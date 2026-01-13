import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

function SignupHebrew() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!email || !password || !confirmPassword || !firstName || !lastName) {
      setError('אנא מלאו את כל השדות החובה');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('הסיסמה חייבת להכיל לפחות 8 תווים');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      setLoading(false);
      return;
    }

    if (!acceptTerms) {
      setError('אנא הסכימו לתנאי השימוש');
      setLoading(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('אנא הכניסו כתובת אימייל תקינה');
      setLoading(false);
      return;
    }

    // Validate phone (if provided)
    if (phone && phone.length > 0) {
      const phoneRegex = /^[0-9\-\+\(\)\s]+$/;
      if (!phoneRegex.test(phone) || phone.replace(/\D/g, '').length < 9) {
        setError('אנא הכניסו מספר טלפון תקין');
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch('http://localhost:3001/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          full_name: `${firstName} ${lastName}`.trim(),
          phone: phone || null,
          company_name: companyName || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'שגיאה בהרשמה');
      }

      // אם נדרש אימות אימייל
      if (data.requiresEmailVerification) {
        // שמור את האימייל ב-localStorage כדי להציג הודעה
        localStorage.setItem('pendingVerificationEmail', email);
        // הפנה לדף אימות אימייל
        navigate('/verify-email', { 
          state: { 
            email,
            message: data.message 
          } 
        });
        return;
      }

      // אם יש token (לא אמור לקרות, אבל למקרה)
      if (data.token) {
        localStorage.setItem('token', data.token);

      // בדוק אם צריך לדלג על onboarding (זמני)
      const skipEmails = ['admin_driveril_2024@example.com', 'admin_driveril_2024', 'danino93@gmail.com'];
      const shouldSkip = skipEmails.some(skipEmail => email.includes(skipEmail) || email === skipEmail);

        if (shouldSkip) {
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
      }
    } catch (err) {
      setError(err.message || 'שגיאה בהרשמה. אנא נסו שוב.');
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
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
        <div className={`glass-strong rounded-3xl shadow-2xl border border-white/10 transition-all ${
          showManualForm ? 'p-8' : 'p-10'
        }`}>
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
              התחילו חינם
            </h1>
            <p className="text-[var(--color-text-secondary)] text-lg">
              צרו חשבון חדש כדי להתחיל להגן על הקמפיינים שלכם
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 rounded-xl">
              <p className="text-[var(--color-danger)] text-sm text-center">{error}</p>
            </div>
          )}

          {/* Google Signup Button */}
          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full group relative flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-bold py-5 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden shadow-lg hover:shadow-xl mb-6"
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

          {/* Manual Signup Link */}
          {!showManualForm && (
            <button
              onClick={() => setShowManualForm(true)}
              className="w-full flex items-center justify-center gap-3 glass border border-white/10 hover:border-[var(--color-cyan)] text-white font-bold py-5 px-6 rounded-xl transition-all hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>הירשמו עם אימייל וסיסמא</span>
            </button>
          )}

          {/* Email Signup Form */}
          {showManualForm && (
            <form onSubmit={handleEmailSignup} className="space-y-5 animate-in fade-in slide-in-from-top-4">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  שם פרטי <span className="text-[var(--color-danger)]">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full px-4 py-3 glass border border-white/10 rounded-xl text-white placeholder-[var(--color-text-tertiary)] focus:border-[var(--color-cyan)] focus:outline-none transition-all"
                  placeholder="שם פרטי"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  שם משפחה <span className="text-[var(--color-danger)]">*</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full px-4 py-3 glass border border-white/10 rounded-xl text-white placeholder-[var(--color-text-tertiary)] focus:border-[var(--color-cyan)] focus:outline-none transition-all"
                  placeholder="שם משפחה"
                  dir="rtl"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                אימייל <span className="text-[var(--color-danger)]">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 glass border border-white/10 rounded-xl text-white placeholder-[var(--color-text-tertiary)] focus:border-[var(--color-cyan)] focus:outline-none transition-all"
                placeholder="example@company.com"
                dir="ltr"
              />
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                נשתמש באימייל הזה להתחברות והתראות
              </p>
            </div>

            {/* Phone & Company */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  טלפון (אופציונלי)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 glass border border-white/10 rounded-xl text-white placeholder-[var(--color-text-tertiary)] focus:border-[var(--color-cyan)] focus:outline-none transition-all"
                  placeholder="050-1234567"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  שם החברה (אופציונלי)
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-3 glass border border-white/10 rounded-xl text-white placeholder-[var(--color-text-tertiary)] focus:border-[var(--color-cyan)] focus:outline-none transition-all"
                  placeholder="שם החברה"
                  dir="rtl"
                />
              </div>
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  סיסמה <span className="text-[var(--color-danger)]">*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 glass border border-white/10 rounded-xl text-white placeholder-[var(--color-text-tertiary)] focus:border-[var(--color-cyan)] focus:outline-none transition-all"
                  placeholder="לפחות 8 תווים"
                  dir="ltr"
                />
                <div className="text-xs text-[var(--color-text-tertiary)] mt-1 space-y-1">
                  <p>✓ לפחות 8 תווים</p>
                  <p className={password.length >= 8 ? 'text-green-400' : ''}>
                    {password.length >= 8 ? '✓' : '○'} {password.length}/8 תווים
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  אימות סיסמה <span className="text-[var(--color-danger)]">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className={`w-full px-4 py-3 glass border rounded-xl text-white placeholder-[var(--color-text-tertiary)] focus:outline-none transition-all ${
                    confirmPassword && password !== confirmPassword 
                      ? 'border-[var(--color-danger)]' 
                      : 'border-white/10 focus:border-[var(--color-cyan)]'
                  }`}
                  placeholder="הכניסו שוב את הסיסמה"
                  dir="ltr"
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-[var(--color-danger)] mt-1">
                    הסיסמאות אינן תואמות
                  </p>
                )}
                {confirmPassword && password === confirmPassword && (
                  <p className="text-xs text-green-400 mt-1">
                    ✓ הסיסמאות תואמות
                  </p>
                )}
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className={`flex items-start gap-3 p-4 glass rounded-xl border transition-all ${
              !acceptTerms && error && error.includes('תנאי') 
                ? 'border-[var(--color-danger)]/50' 
                : 'border-white/10'
            }`}>
              <input
                type="checkbox"
                id="acceptTerms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-white/20 bg-white/5 text-[var(--color-cyan)] focus:ring-[var(--color-cyan)] focus:ring-offset-0 cursor-pointer"
              />
              <label htmlFor="acceptTerms" className="text-sm text-[var(--color-text-secondary)] cursor-pointer leading-relaxed">
                אני מסכים/ה ל
                <Link to="/terms" target="_blank" className="text-[var(--color-cyan)] hover:text-[var(--color-purple)] font-bold transition-colors mx-1 underline">
                  תנאי השימוש
                </Link>
                ו
                <Link to="/privacy" target="_blank" className="text-[var(--color-cyan)] hover:text-[var(--color-purple)] font-bold transition-colors mx-1 underline">
                  מדיניות הפרטיות
                </Link>
                של MagenAd <span className="text-[var(--color-danger)]">*</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[var(--color-cyan)] via-[var(--color-purple)] to-[var(--color-magenta)] text-white font-bold py-5 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 shadow-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>יוצר חשבון...</span>
                </div>
              ) : (
                'צרו חשבון'
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

          {/* Login Link */}
          <p className="text-center text-[var(--color-text-secondary)] mt-8">
            כבר יש לכם חשבון?{' '}
            <Link to="/login" className="text-[var(--color-cyan)] hover:text-[var(--color-purple)] font-bold transition-colors">
              התחברו כאן
            </Link>
          </p>

          {/* Security Info */}
          <div className="mt-8 p-4 glass rounded-xl border border-[var(--color-cyan)]/20">
            <p className="text-xs text-[var(--color-text-secondary)] text-center leading-relaxed">
              🔒 אימות מאובטח. אנחנו לעולם לא שומרים את הסיסמה שלכם.
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

export default SignupHebrew;
