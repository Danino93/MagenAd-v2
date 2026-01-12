import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function ConnectAdsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for OAuth callback messages
    const errorParam = searchParams.get('error');
    const successParam = searchParams.get('success');

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
    if (successParam) {
      setSuccess('חשבון Google Ads חובר בהצלחה! 🎉');
      // Redirect to onboarding after 2 seconds
      setTimeout(() => {
        navigate('/app/dashboard');
      }, 2000);
    }

    loadAccounts();
  }, [searchParams]);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/googleads/accounts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to load accounts');

      const data = await response.json();
      setAccounts(data.accounts || []);
    } catch (err) {
      console.error('Error loading accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/googleads/auth', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (err) {
      setError('שגיאה בחיבור לGoogle Ads. נסו שוב.');
      setConnecting(false);
    }
  };

  const handleDisconnect = async (accountId) => {
    if (!confirm('האם אתם בטוחים שאתם רוצים לנתק חשבון זה?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/googleads/accounts/${accountId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSuccess('חשבון נותק בהצלחה');
        loadAccounts();
      }
    } catch (err) {
      setError('שגיאה בניתוק החשבון');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--color-cyan)]/20 border-t-[var(--color-cyan)] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--color-text-secondary)]">טוען חשבונות...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]" dir="rtl">
      {/* Header */}
      <header className="border-b border-white/10 glass-strong sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-cyan)] via-[var(--color-purple)] to-[var(--color-magenta)] flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div>
                <span className="text-2xl font-bold text-white block">MagenAd</span>
                <span className="text-xs text-[var(--color-text-tertiary)]">חיבור חשבון פרסום</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/app/dashboard')}
              className="px-6 py-3 glass hover:glass-strong border border-white/10 rounded-xl text-white text-sm font-bold transition-all"
            >
              ← חזרה לדשבורד
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="mb-12">
          <h1 className="text-6xl font-bold text-white mb-4">
            חיבור <span className="gradient-text">Google Ads</span>
          </h1>
          <p className="text-2xl text-[var(--color-text-secondary)]">
            חברו את חשבון הפרסום שלכם כדי להתחיל לזהות הונאות
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-8 p-6 bg-[var(--color-danger)]/10 border-2 border-[var(--color-danger)]/30 rounded-2xl">
            <p className="text-[var(--color-danger)] text-lg font-bold">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-8 p-6 bg-[var(--color-success)]/10 border-2 border-[var(--color-success)]/30 rounded-2xl">
            <p className="text-[var(--color-success)] text-lg font-bold">{success}</p>
          </div>
        )}

        {/* No Accounts - Connect Button */}
        {accounts.length === 0 && (
          <div className="glass-strong rounded-3xl p-12 border-2 border-white/10 text-center">
            <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-[var(--color-cyan)] via-[var(--color-purple)] to-[var(--color-magenta)] rounded-full flex items-center justify-center glow-cyan">
              <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>

            <h2 className="text-4xl font-bold text-white mb-4">חברו את Google Ads</h2>
            <p className="text-xl text-[var(--color-text-secondary)] mb-10 max-w-2xl mx-auto">
              כדי להתחיל לזהות הונאות בקמפיינים שלכם, אנחנו צריכים גישה לחשבון Google Ads שלכם.
              זה לוקח רק כמה שניות!
            </p>

            <button
              onClick={handleConnect}
              disabled={connecting}
              className="group relative inline-flex items-center gap-4 bg-gradient-to-r from-[var(--color-cyan)] via-[var(--color-purple)] to-[var(--color-magenta)] text-white font-bold text-xl px-12 py-6 rounded-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl"
            >
              {connecting ? (
                <div className="w-7 h-7 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                  </svg>
                  <span>חיבור עם Google Ads</span>
                </>
              )}
            </button>

            <div className="mt-10 p-6 glass rounded-2xl max-w-2xl mx-auto">
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                🔒 <strong>פרטיות מובטחת:</strong> אנחנו רק קוראים נתונים. לעולם לא משנים או מוחקים קמפיינים.
              </p>
            </div>
          </div>
        )}

        {/* Connected Accounts */}
        {accounts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-white">חשבונות מחוברים</h2>
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="px-8 py-4 bg-gradient-to-r from-[var(--color-cyan)] to-[var(--color-purple)] text-white font-bold rounded-xl hover:scale-105 transition-all disabled:opacity-50"
              >
                + חיבור חשבון נוסף
              </button>
            </div>

            <div className="grid gap-6">
              {accounts.map((account) => (
                <div key={account.id} className="glass-strong rounded-2xl p-8 border border-white/10 hover:border-[var(--color-cyan)]/30 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-6 flex-1">
                      {/* Icon */}
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[var(--color-cyan)] to-[var(--color-purple)] flex items-center justify-center flex-shrink-0">
                        <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                        </svg>
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-bold text-white">{account.customer_name}</h3>
                          <span className="px-3 py-1 bg-[var(--color-success)]/20 text-[var(--color-success)] text-xs font-bold rounded-full">
                            מחובר
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-[var(--color-text-tertiary)] mb-1">מספר חשבון</p>
                            <p className="text-sm font-mono text-white">{account.customer_id}</p>
                          </div>
                          <div>
                            <p className="text-xs text-[var(--color-text-tertiary)] mb-1">מטבע</p>
                            <p className="text-sm text-white">{account.currency_code}</p>
                          </div>
                          <div>
                            <p className="text-xs text-[var(--color-text-tertiary)] mb-1">אזור זמן</p>
                            <p className="text-sm text-white">{account.time_zone}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => navigate(`/app/campaigns/${account.id}`)}
                        className="px-6 py-3 glass hover:glass-strong border border-white/10 rounded-xl text-white text-sm font-bold transition-all"
                      >
                        צפה בקמפיינים
                      </button>
                      <button
                        onClick={() => handleDisconnect(account.id)}
                        className="px-6 py-3 glass hover:bg-[var(--color-danger)]/10 border border-white/10 hover:border-[var(--color-danger)]/30 rounded-xl text-[var(--color-danger)] text-sm font-bold transition-all"
                      >
                        נתק
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ConnectAdsPage;