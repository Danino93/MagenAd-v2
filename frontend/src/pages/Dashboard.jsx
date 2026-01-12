import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wifi, WifiOff } from 'lucide-react';
import { useRealtimeStatus } from '../Hooks/useRealtime';
import { useRealtimeDashboard } from '../Hooks/useRealtimeDashboard';
import { NotificationsBell } from '../components/NotificationsBell';
import { ActivityFeed } from '../components/ActivityFeed';
import { MobileMenu } from '../components/MobileMenu';
import DashboardStats from '../components/DashboardStats';
import QuickActions from '../components/QuickActions';
import OnboardingPage from './OnboardingPage';
import LiveClicksFeed from '../components/LiveClicksFeed';
import QuietIndexWidget from '../components/QuietIndexWidget';
import DetectionSettings from '../components/DetectionSettings';
import FraudAlertsPanel from '../components/FraudAlertsPanel';
import AdvancedAnalytics from '../components/AdvancedAnalytics';
import RealTimeMonitoring from '../components/RealTimeMonitoring';
import IPManagement from '../components/IPManagement';
import ReportsGenerator from '../components/ReportsGenerator';

function DashboardHebrew() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectedAccountId, setConnectedAccountId] = useState(null);
  const navigate = useNavigate();
  
  // Real-time features
  const isRealtimeConnected = useRealtimeStatus();
  const { 
    stats, 
    recentAnomalies, 
    loading: dashboardLoading, 
    lastUpdate,
    refresh 
  } = useRealtimeDashboard(user?.id);

  useEffect(() => {
    checkAuth();
    loadConnectedAccount();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Not authenticated');
      }

      const data = await response.json();
      setUser(data.user);
      setLoading(false);
    } catch (error) {
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const loadConnectedAccount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:3001/api/googleads/accounts', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) return;

      const data = await response.json();
      if (data.accounts && data.accounts.length > 0) {
        setConnectedAccountId(data.accounts[0].id);
        // If we just connected, refresh the page to show full dashboard
        if (window.location.pathname === '/app/dashboard') {
          // Already on dashboard, just update state
        }
      } else {
        setConnectedAccountId(null);
      }
    } catch (error) {
      console.error('Error loading account:', error);
      setConnectedAccountId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--color-cyan)]/20 border-t-[var(--color-cyan)] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--color-text-secondary)]">טוען...</p>
        </div>
      </div>
    );
  }

  const firstName = user?.full_name?.split(' ')[0] || 'משתמש';

  // Show onboarding if no account connected
  if (!connectedAccountId && !loading) {
    return (
      <OnboardingPage 
        user={user} 
        onComplete={() => {
          // Reload account after onboarding
          loadConnectedAccount();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]" dir="rtl">
      {/* Header */}
      <header className="border-b border-white/10 glass-strong sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-cyan)] via-[var(--color-purple)] to-[var(--color-magenta)] flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div>
                <span className="text-2xl font-bold text-white block">MagenAd</span>
                <span className="text-xs text-[var(--color-text-tertiary)]">לוח בקרה</span>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              {/* Real-time status indicator */}
              <div className="flex items-center gap-2 text-sm">
                {isRealtimeConnected ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-500" />
                    <span className="text-green-400 hidden md:inline">מחובר</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-red-500" />
                    <span className="text-red-400 hidden md:inline">לא מחובר</span>
                  </>
                )}
              </div>
              
              {/* Notifications Bell */}
              <NotificationsBell />
              
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-white">{user?.full_name}</p>
                <p className="text-xs text-[var(--color-text-tertiary)]">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-6 py-3 glass hover:glass-strong border border-white/10 rounded-xl text-white text-sm font-bold transition-all hover:scale-105"
              >
                התנתקות
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-6xl font-bold text-white mb-4">
              שלום, <span className="gradient-text">{firstName}</span>! 👋
            </h1>
            <p className="text-2xl text-[var(--color-text-secondary)]">
              ברוכים הבאים ללוח הבקרה שלכם! 🚀
            </p>
            {lastUpdate && (
              <p className="text-sm text-[var(--color-text-tertiary)] mt-2">
                עדכון אחרון: {lastUpdate.toLocaleTimeString('he-IL')}
              </p>
            )}
          </div>
          <div>
            <ReportsGenerator />
          </div>
        </div>
        
        {/* Dashboard Stats */}
        <div className="mb-12">
          <DashboardStats userId={user?.id} />
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <QuickActions accountId={connectedAccountId} />
        </div>

        {/* Activity Feed */}
        <div className="mb-12">
          <ActivityFeed />
        </div>

        {/* System Status Card */}
        {connectedAccountId ? (
          <div className="glass-strong border-2 border-[var(--color-success)]/30 rounded-3xl p-10 mb-8 glow-cyan">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-gradient-to-br from-[var(--color-success)] to-[var(--color-cyan)] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg animate-pulse">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-3xl font-bold text-white mb-3">✅ מערכת פעילה!</h3>
                <p className="text-lg text-[var(--color-text-secondary)] mb-6">
                  Google Ads מחובר והמערכת מוכנה לזיהוי הונאות. הנה מה שפועל:
                </p>
                <ul className="space-y-3 text-[var(--color-text-secondary)]">
                  {[
                    '✅ חיבור Google Ads פעיל',
                    '✅ זיהוי הונאות בזמן אמת',
                    '✅ ניטור רציף 24/7',
                    '✅ התראות אוטומטיות',
                    '✅ דוחות חודשיים'
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <span className="text-lg">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-strong border-2 border-[var(--color-cyan)]/30 rounded-3xl p-10 mb-8 glow-cyan">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-gradient-to-br from-[var(--color-cyan)] to-[var(--color-purple)] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-3xl font-bold text-white mb-3">🎉 אימות הושלם בהצלחה!</h3>
                <p className="text-lg text-[var(--color-text-secondary)] mb-6">
                  החשבון שלכם מוכן ומחכה. הנה מה שהשלמנו:
                </p>
                <ul className="space-y-3 text-[var(--color-text-secondary)]">
                  {[
                    '✅ אימות Google OAuth עובד מצוין',
                    '✅ JWT Tokens נוצרו ונשמרו',
                    '✅ פרופיל משתמש נשמר ב-Supabase',
                    '✅ Routes מוגנים עובדים',
                    '✅ התנתקות עובדת'
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <span className="text-lg">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Connect Google Ads CTA */}
        <div className="mb-12">
          <button
            onClick={() => navigate('/app/connect-ads')}
            className="w-full group relative glass-strong border-2 border-[var(--color-cyan)]/30 rounded-3xl p-12 hover:border-[var(--color-cyan)]/60 transition-all hover:scale-[1.02]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8">
                <div className="w-24 h-24 bg-gradient-to-br from-[var(--color-cyan)] via-[var(--color-purple)] to-[var(--color-magenta)] rounded-2xl flex items-center justify-center glow-cyan">
                  <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="text-right">
                  <h3 className="text-4xl font-bold text-white mb-3">חברו את Google Ads</h3>
                  <p className="text-xl text-[var(--color-text-secondary)]">
                    הצעד הראשון - חיבור חשבון הפרסום שלכם
                  </p>
                </div>
              </div>
              <svg className="w-12 h-12 text-[var(--color-cyan)] group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </button>
        </div>

        {/* Live Clicks Feed */}
        <div className="mb-12">
          <LiveClicksFeed accountId={connectedAccountId} />
        </div>

        {/* Quiet Index Widget */}
        <div className="mb-12">
          <QuietIndexWidget accountId={connectedAccountId} />
        </div>

        {/* Advanced Analytics */}
        <div className="mb-12">
          <AdvancedAnalytics accountId={connectedAccountId} />
        </div>

        {/* Real-Time Monitoring */}
        <div className="mb-12">
          <RealTimeMonitoring accountId={connectedAccountId} />
        </div>

        {/* Detection Settings */}
        <div className="mb-12">
          <DetectionSettings accountId={connectedAccountId} />
        </div>

        {/* Fraud Alerts */}
        <div className="mb-12">
          <FraudAlertsPanel accountId={connectedAccountId} />
        </div>

        {/* IP Management */}
        <div className="mb-12">
          <IPManagement accountId={connectedAccountId} />
        </div>

        {/* Next Steps */}
        <div className="glass-strong rounded-3xl p-10 border border-white/10">
          <h3 className="text-3xl font-bold text-white mb-8">מה הלאה?</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'אימות הושלם',
                description: 'החשבון שלכם מאומת ומוכן לשימוש',
                color: 'from-[var(--color-success)] to-[var(--color-cyan)]'
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                ),
                title: 'מצב למידה',
                description: '7 ימים של למידה כדי לבסס את הדפוסים הנורמליים שלכם',
                color: 'from-[var(--color-purple)] to-[var(--color-magenta)]'
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                ),
                title: 'הגנה בזמן אמת',
                description: '12 כללי AI מזהים הונאות 24/7',
                color: 'from-[var(--color-magenta)] to-[var(--color-cyan)]'
              }
            ].map((step, index) => (
              <div key={index} className="glass rounded-2xl p-8 hover:scale-105 transition-all duration-300 border border-white/10">
                <div className={`inline-flex p-4 bg-gradient-to-br ${step.color} rounded-xl text-white mb-6 shadow-lg`}>
                  {step.icon}
                </div>
                <h4 className="text-xl font-bold text-white mb-3">{step.title}</h4>
                <p className="text-[var(--color-text-secondary)] leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mt-12 glass-strong rounded-2xl p-8 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xl font-bold text-white">התקדמות בהגדרת החשבון</h4>
            <span className="text-2xl font-bold gradient-text">20%</span>
          </div>
          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[var(--color-cyan)] to-[var(--color-purple)] rounded-full" style={{ width: '20%' }} />
          </div>
          <p className="text-sm text-[var(--color-text-tertiary)] mt-3">
            נותרו עוד כמה צעדים להשלמת ההגדרה
          </p>
        </div>
      </main>
    </div>
  );
}

export default DashboardHebrew;