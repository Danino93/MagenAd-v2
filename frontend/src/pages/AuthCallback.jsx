import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function AuthCallbackHebrew() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      localStorage.setItem('token', token);
      
      setTimeout(() => {
        navigate('/app/dashboard');
      }, 1500);
    } else {
      navigate('/login?error=authentication_failed');
    }
  }, [searchParams, navigate]);

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
      <div className="relative z-10 text-center">
        {/* Animated Logo */}
        <div className="relative inline-flex mb-8">
          <div className="w-24 h-24 border-4 border-[var(--color-cyan)]/20 border-t-[var(--color-cyan)] rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[var(--color-cyan)] via-[var(--color-purple)] to-[var(--color-magenta)] flex items-center justify-center shadow-lg">
              <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Text */}
        <h2 className="text-4xl font-bold text-white mb-4">
          מחבר אתכם...
        </h2>
        <p className="text-xl text-[var(--color-text-secondary)] mb-8">
          רק רגע, מכינים הכל בשבילכם
        </p>

        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-3 h-3 bg-[var(--color-cyan)] rounded-full animate-bounce" />
          <div className="w-3 h-3 bg-[var(--color-purple)] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
          <div className="w-3 h-3 bg-[var(--color-magenta)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>

        {/* Loading Steps */}
        <div className="mt-12 max-w-md mx-auto">
          <div className="glass-strong rounded-2xl p-6 text-right">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
                <div className="w-6 h-6 rounded-full bg-[var(--color-success)] flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>מאמת זהות...</span>
              </div>
              <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
                <div className="w-6 h-6 rounded-full border-2 border-[var(--color-cyan)] animate-spin flex-shrink-0" />
                <span>יוצר חשבון...</span>
              </div>
              <div className="flex items-center gap-3 text-[var(--color-text-tertiary)]">
                <div className="w-6 h-6 rounded-full border-2 border-white/10 flex-shrink-0" />
                <span>מכין לוח בקרה...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthCallbackHebrew;