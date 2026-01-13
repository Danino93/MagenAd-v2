import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wifi, 
  WifiOff, 
  BarChart3, 
  Zap, 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  Eye, 
  Shield, 
  Globe, 
  FileText, 
  Settings 
} from 'lucide-react';
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
import DashboardSidebar from '../components/DashboardSidebar';
// Demo Components
import DemoDashboardStats from '../components/DemoComponents/DemoDashboardStats';
import DemoLiveClicksFeed from '../components/DemoComponents/DemoLiveClicksFeed';
import DemoFraudAlertsPanel from '../components/DemoComponents/DemoFraudAlertsPanel';
import DemoQuietIndexWidget from '../components/DemoComponents/DemoQuietIndexWidget';
import DemoAdvancedAnalytics from '../components/DemoComponents/DemoAdvancedAnalytics';
import DemoRealTimeMonitoring from '../components/DemoComponents/DemoRealTimeMonitoring';
import DemoIPManagement from '../components/DemoComponents/DemoIPManagement';
import DemoDetectionSettings from '../components/DemoComponents/DemoDetectionSettings';
import DemoReportsGenerator from '../components/DemoComponents/DemoReportsGenerator';

function DashboardHebrew() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectedAccountId, setConnectedAccountId] = useState(null);
  const [activeView, setActiveView] = useState('overview');
  const [emailVerified, setEmailVerified] = useState(true); // Default to true to avoid blocking
  const [checkingVerification, setCheckingVerification] = useState(true);
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
    checkEmailVerification();
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

  const checkEmailVerification = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:3001/api/auth/verification-status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEmailVerified(data.isVerified);
      }
    } catch (error) {
      console.error('Error checking verification:', error);
    } finally {
      setCheckingVerification(false);
    }
  };

  const loadConnectedAccount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // בדוק אם צריך לדלג על onboarding (זמני)
      const userResponse = await fetch('http://localhost:3001/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      let shouldSkipOnboarding = false;
      if (userResponse.ok) {
        const userData = await userResponse.json();
        const skipEmails = ['admin_driveril_2024@example.com', 'admin_driveril_2024', 'danino93@gmail.com'];
        if (userData.user?.email && skipEmails.some(skipEmail => 
          userData.user.email.includes(skipEmail) || userData.user.email === skipEmail
        )) {
          shouldSkipOnboarding = true;
        }
      }

      // בדוק onboarding status
      const onboardingResponse = await fetch('http://localhost:3001/api/auth/onboarding-status', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (onboardingResponse.ok) {
        const onboardingData = await onboardingResponse.json();
        
        if (!shouldSkipOnboarding && !onboardingData.isOnboardingComplete) {
          // אם לא סיים onboarding, הפנה לשם
          navigate('/app/onboarding');
          return;
        }

        if (onboardingData.adAccountId) {
          setConnectedAccountId(onboardingData.adAccountId);
        }
      }

      // גם בדוק ישירות את החשבונות (למקרה שהבדיקה הראשונה נכשלה)
      const response = await fetch('http://localhost:3001/api/googleads/accounts', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) return;

      const data = await response.json();
      if (data.accounts && data.accounts.length > 0) {
        setConnectedAccountId(data.accounts[0].id);
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

  // לא נציג OnboardingPage כאן - נציג את הדשבורד תמיד
  // עם באנר שמזכיר להשלים את ההגדרות אם צריך

  // Render function for different views
  const renderView = () => {
    switch (activeView) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-5xl font-bold text-white mb-3">
                שלום, <span className="gradient-text">{firstName}</span>! 👋
              </h1>
              <p className="text-xl text-[var(--color-text-secondary)]">
                {connectedAccountId 
                  ? 'ברוכים הבאים ללוח הבקרה שלכם! 🚀'
                  : 'ברוכים הבאים! התחילו בהגדרת החשבון שלכם 🚀'
                }
              </p>
              {lastUpdate && (
                <p className="text-sm text-[var(--color-text-tertiary)] mt-2">
                  עדכון אחרון: {lastUpdate.toLocaleTimeString('he-IL')}
                </p>
              )}
            </div>

            {/* Email Verification Banner */}
            {!checkingVerification && !emailVerified && (
              <div className="glass-strong border-2 border-orange-500/50 rounded-3xl p-6 mb-8 animate-pulse">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2">⚠️ אימות אימייל נדרש</h3>
                    <p className="text-lg text-[var(--color-text-secondary)] mb-4">
                      כדי להשתמש בשירות, אנא אמתו את כתובת האימייל שלכם. 
                      <br />
                      <span className="text-sm text-orange-400">לא תוכלו לחבר Google Ads או ליצור מנוי עד לאימות האימייל.</span>
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={async () => {
                          try {
                            const token = localStorage.getItem('token');
                            const response = await fetch('http://localhost:3001/api/auth/resend-verification', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json'
                              },
                              body: JSON.stringify({ email: user?.email })
                            });

                            if (response.ok) {
                              alert('✅ אימייל אימות נשלח! אנא בדקו את תיבת הדואר.');
                            } else {
                              const data = await response.json();
                              alert(`❌ ${data.error || 'שגיאה בשליחת אימייל'}`);
                            }
                          } catch (error) {
                            alert('❌ שגיאה בשליחת אימייל אימות');
                          }
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl hover:scale-105 transition-all shadow-lg"
                      >
                        שלח אימייל אימות
                      </button>
                      <button
                        onClick={() => navigate('/app/profile')}
                        className="px-6 py-3 glass border border-white/20 text-white font-bold rounded-xl hover:scale-105 transition-all"
                      >
                        לפרופיל שלי
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Onboarding Reminder Banner */}
            {!connectedAccountId && emailVerified && (
              <div className="glass-strong border-2 border-[var(--color-purple)]/50 rounded-3xl p-8 mb-8 animate-pulse">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-[var(--color-purple)] to-[var(--color-cyan)] rounded-2xl flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">השלמת הגדרות ראשוניות</h3>
                      <p className="text-[var(--color-text-secondary)] text-lg">
                        כדי לראות נתונים אמיתיים, אנא השלימו את תהליך ההגדרה הראשונית
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/app/onboarding')}
                    className="px-8 py-4 bg-gradient-to-r from-[var(--color-purple)] to-[var(--color-cyan)] text-white font-bold rounded-xl hover:scale-105 transition-all flex items-center gap-2"
                  >
                    <span>התחילו עכשיו</span>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5l-7 7 7 7M5 12h14" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* System Status Card */}
            {connectedAccountId ? (
              <div className="glass-strong border-2 border-[var(--color-success)]/30 rounded-3xl p-10 glow-cyan">
                <div className="flex items-start gap-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-[var(--color-success)] to-[var(--color-cyan)] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg animate-pulse">
                    <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold text-white mb-4">✅ מערכת פעילה!</h3>
                    <p className="text-lg text-[var(--color-text-secondary)] mb-6">
                      Google Ads מחובר והמערכת מוכנה לזיהוי הונאות
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      {[
                        '✅ חיבור Google Ads פעיל',
                        '✅ זיהוי הונאות בזמן אמת',
                        '✅ ניטור רציף 24/7',
                        '✅ התראות אוטומטיות'
                      ].map((item, index) => (
                        <div key={index} className="flex items-center gap-3 text-[var(--color-text-secondary)]">
                          <span className="text-lg">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-strong border-2 border-[var(--color-cyan)]/30 rounded-3xl p-10 glow-cyan">
                <div className="flex items-start gap-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-[var(--color-cyan)] to-[var(--color-purple)] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold text-white mb-4">🎉 ברוכים הבאים לדשבורד!</h3>
                    <p className="text-lg text-[var(--color-text-secondary)] mb-6">
                      כדי לראות נתונים אמיתיים ולהגן על הקמפיינים שלכם, אנא השלימו את תהליך ההגדרה הראשונית
                    </p>
                    <button
                      onClick={() => navigate('/app/onboarding')}
                      className="px-8 py-4 bg-gradient-to-r from-[var(--color-cyan)] via-[var(--color-purple)] to-[var(--color-magenta)] text-white font-bold rounded-xl hover:scale-105 transition-all shadow-lg"
                    >
                      התחילו בהגדרה הראשונית →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Dashboard Components */}
            <div className="space-y-8 mt-8">
              {/* Stats */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-[var(--color-cyan)]" />
                  סטטיסטיקות
                </h2>
                {connectedAccountId ? (
                  <DashboardStats userId={user?.id} />
                ) : (
                  <DemoDashboardStats />
                )}
              </div>

              {/* Quick Actions */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-[var(--color-purple)]" />
                  פעולות מהירות
                </h2>
                {connectedAccountId ? (
                  <QuickActions accountId={connectedAccountId} />
                ) : (
                  <div className="glass rounded-2xl p-8 border border-white/10">
                    <p className="text-center text-[var(--color-text-secondary)]">
                      אין פעולות זמינות - חברו Google Ads כדי לראות פעולות מהירות
                    </p>
                  </div>
                )}
              </div>

              {/* Activity Feed */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-6 h-6 text-[var(--color-magenta)]" />
                  פעילות אחרונה
                </h2>
                {connectedAccountId ? (
                  <ActivityFeed />
                ) : (
                  <div className="glass rounded-2xl p-8 border border-white/10">
                    <p className="text-center text-[var(--color-text-secondary)]">
                      אין פעילות להצגה - חברו Google Ads כדי לראות פעילות
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      
      case 'stats':
        return (
          <div>
            <h2 className="text-4xl font-bold text-white mb-6">סטטיסטיקות</h2>
            {connectedAccountId ? (
              <DashboardStats userId={user?.id} />
            ) : (
              <DemoDashboardStats />
            )}
          </div>
        );
      
      case 'live':
        return (
          <div>
            <h2 className="text-4xl font-bold text-white mb-6">קליקים בזמן אמת</h2>
            {connectedAccountId ? (
              <LiveClicksFeed accountId={connectedAccountId} />
            ) : (
              <DemoLiveClicksFeed />
            )}
          </div>
        );
      
      case 'alerts':
        return (
          <div>
            <h2 className="text-4xl font-bold text-white mb-6">התראות הונאה</h2>
            {connectedAccountId ? (
              <FraudAlertsPanel accountId={connectedAccountId} />
            ) : (
              <DemoFraudAlertsPanel />
            )}
          </div>
        );
      
      case 'analytics':
        return (
          <div>
            <h2 className="text-4xl font-bold text-white mb-6">אנליטיקס מתקדם</h2>
            {connectedAccountId ? (
              <AdvancedAnalytics accountId={connectedAccountId} />
            ) : (
              <DemoAdvancedAnalytics />
            )}
          </div>
        );
      
      case 'monitoring':
        return (
          <div>
            <h2 className="text-4xl font-bold text-white mb-6">ניטור בזמן אמת</h2>
            {connectedAccountId ? (
              <RealTimeMonitoring accountId={connectedAccountId} />
            ) : (
              <DemoRealTimeMonitoring />
            )}
          </div>
        );
      
      case 'quiet-index':
        return (
          <div>
            <h2 className="text-4xl font-bold text-white mb-6">מדד שקט</h2>
            {connectedAccountId ? (
              <QuietIndexWidget accountId={connectedAccountId} />
            ) : (
              <DemoQuietIndexWidget />
            )}
          </div>
        );
      
      case 'ip-management':
        return (
          <div>
            <h2 className="text-4xl font-bold text-white mb-6">ניהול IP</h2>
            {connectedAccountId ? (
              <IPManagement accountId={connectedAccountId} />
            ) : (
              <DemoIPManagement />
            )}
          </div>
        );
      
      case 'reports':
        return (
          <div>
            <h2 className="text-4xl font-bold text-white mb-6">דוחות</h2>
            {connectedAccountId ? (
              <ReportsGenerator />
            ) : (
              <DemoReportsGenerator />
            )}
          </div>
        );
      
      case 'settings':
        return (
          <div>
            <h2 className="text-4xl font-bold text-white mb-6">הגדרות זיהוי</h2>
            {connectedAccountId ? (
              <DetectionSettings accountId={connectedAccountId} />
            ) : (
              <DemoDetectionSettings />
            )}
          </div>
        );
      
      default:
        return <div>View not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex" dir="rtl">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 border-b border-white/10 glass-strong z-50">
        <div className="px-6 py-4">
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
              {/* Back to Onboarding Button - רק אם לא סיים onboarding */}
              {!connectedAccountId && (
                <button
                  onClick={() => navigate('/app/onboarding')}
                  className="px-4 py-2 glass hover:glass-strong border border-[var(--color-purple)]/30 hover:border-[var(--color-purple)] rounded-xl text-[var(--color-purple)] text-sm font-medium transition-all hover:scale-105 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5l-7 7 7 7M5 12h14" />
                  </svg>
                  <span className="hidden md:inline">חזור להגדרות</span>
                  <span className="md:hidden">הגדרות</span>
                </button>
              )}
              
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
              
              {/* User Info */}
              {user && (
                <button
                  onClick={() => navigate('/app/profile')}
                  className="flex items-center gap-3 hover:scale-105 transition-all group"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-cyan)] via-[var(--color-purple)] to-[var(--color-magenta)] flex items-center justify-center border-2 border-white/20 group-hover:border-[var(--color-cyan)] transition-all">
                    <span className="text-white font-bold text-sm">
                      {user.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-bold text-white group-hover:text-[var(--color-cyan)] transition-colors">{user.full_name}</p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">{user.email}</p>
                  </div>
                </button>
              )}
              
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

      {/* Main Layout */}
      <div className="flex flex-1 pt-20">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Onboarding Reminder Banner - רק אם לא סיים את ההגדרות */}
        {!connectedAccountId && (
          <div className="mb-8 glass-strong border-2 border-[var(--color-purple)]/50 rounded-3xl p-6 animate-pulse">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-purple)] to-[var(--color-cyan)] rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">השלמת הגדרות ראשוניות</h3>
                  <p className="text-[var(--color-text-secondary)]">
                    כדי לראות נתונים אמיתיים, אנא השלימו את תהליך ההגדרה הראשונית
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/app/onboarding')}
                className="px-6 py-3 bg-gradient-to-r from-[var(--color-purple)] to-[var(--color-cyan)] text-white font-bold rounded-xl hover:scale-105 transition-all flex items-center gap-2"
              >
                <span>התחילו עכשיו</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5l-7 7 7 7M5 12h14" />
                </svg>
              </button>
            </div>
          </div>
        )}

            {/* View Content */}
            <div className="animate-in fade-in slide-in-from-right-4">
              {renderView()}
            </div>
          </div>
        </main>

        {/* Sidebar */}
        <DashboardSidebar 
          activeView={activeView} 
          onViewChange={setActiveView}
          hasConnection={!!connectedAccountId}
        />
      </div>
    </div>
  );
}

export default DashboardHebrew;