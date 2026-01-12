/*
 * OnboardingPage.jsx
 * 
 * דף Onboarding עם שלבי הגדרה והתקדמות
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  Circle, 
  ArrowLeft, 
  ArrowRight,
  Shield,
  Link2,
  Settings,
  BarChart3,
  Sparkles
} from 'lucide-react';

function OnboardingPage({ user, onComplete }) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [connectedAccountId, setConnectedAccountId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAccountStatus();
    
    // Check every 2 seconds if account was connected (when on connect step)
    const interval = setInterval(() => {
      if (currentStep === 1) {
        checkAccountStatus();
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [currentStep]);

  const checkAccountStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:3001/api/googleads/accounts', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.accounts && data.accounts.length > 0) {
          setConnectedAccountId(data.accounts[0].id);
          // If on connect step, move to next step
          if (currentStep === 1) {
            setTimeout(() => {
              setCurrentStep(2);
            }, 1000);
          }
        }
      }
    } catch (error) {
      console.error('Error checking account:', error);
    }
  };

  const steps = [
    {
      id: 'welcome',
      title: 'ברוכים הבאים ל-MagenAd! 🎉',
      description: 'בואו נתחיל בהגדרת החשבון שלכם',
      icon: Sparkles,
      color: 'from-cyan-500 to-blue-500',
      content: (
        <div className="text-center space-y-6">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl">
            <Shield className="w-16 h-16 text-white" />
          </div>
          <div>
            <h2 className="text-4xl font-bold text-white mb-4">
              מערכת זיהוי הונאות מתקדמת
            </h2>
            <p className="text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto">
              MagenAd תגן על הקמפיינים שלכם ב-Google Ads מפני קליקים מזויפים והונאות
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {[
              { icon: '🛡️', title: 'זיהוי אוטומטי', desc: '12 כללי AI מתקדמים' },
              { icon: '⚡', title: 'זמן אמת', desc: 'ניטור רציף 24/7' },
              { icon: '📊', title: 'דוחות מפורטים', desc: 'ניתוח מעמיק של הנתונים' }
            ].map((feature, i) => (
              <div key={i} className="glass rounded-2xl p-6 text-center">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-[var(--color-text-secondary)]">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'connect',
      title: 'חברו את Google Ads',
      description: 'הצעד הראשון - חיבור חשבון הפרסום שלכם',
      icon: Link2,
      color: 'from-purple-500 to-pink-500',
      content: (
        <div className="text-center space-y-8">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl">
            <Link2 className="w-12 h-12 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">
              חיבור Google Ads
            </h2>
            <p className="text-lg text-[var(--color-text-secondary)] max-w-xl mx-auto mb-8">
              כדי להתחיל, אנחנו צריכים גישה לחשבון Google Ads שלכם. זה בטוח לחלוטין - אנחנו משתמשים ב-OAuth של Google.
            </p>
            <button
              onClick={() => navigate('/app/connect-ads')}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-bold text-lg hover:scale-105 transition-all shadow-lg"
            >
              חברו עכשיו →
            </button>
          </div>
          <div className="glass rounded-2xl p-6 text-right max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-white mb-4">מה זה כולל?</h3>
            <ul className="space-y-3 text-[var(--color-text-secondary)]">
              {[
                'גישה לקליקים בקמפיינים שלכם',
                'ניתוח בזמן אמת',
                'זיהוי הונאות אוטומטי',
                'דוחות מפורטים'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'settings',
      title: 'הגדרת זיהוי',
      description: 'בחרו את רמת הזיהוי המתאימה לכם',
      icon: Settings,
      color: 'from-blue-500 to-cyan-500',
      content: (
        <div className="text-center space-y-8">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl">
            <Settings className="w-12 h-12 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">
              רמת זיהוי
            </h2>
            <p className="text-lg text-[var(--color-text-secondary)] max-w-xl mx-auto mb-8">
              בחרו את רמת הזיהוי המתאימה לקמפיינים שלכם. תוכלו לשנות זאת בכל עת.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                emoji: '🧘',
                title: 'רגוע',
                desc: '8+ קליקים/שעה',
                color: 'from-green-500 to-emerald-500',
                recommended: false
              },
              {
                emoji: '🤨',
                title: 'מאוזן',
                desc: '5+ קליקים/שעה',
                color: 'from-yellow-500 to-orange-500',
                recommended: true
              },
              {
                emoji: '😤',
                title: 'אגרסיבי',
                desc: '3+ קליקים/שעה',
                color: 'from-red-500 to-rose-500',
                recommended: false
              }
            ].map((level, i) => (
              <div
                key={i}
                className={`glass rounded-2xl p-6 border-2 ${
                  level.recommended ? 'border-yellow-500/50' : 'border-white/10'
                } hover:scale-105 transition-all cursor-pointer`}
                onClick={() => {
                  // TODO: Save detection preset
                  console.log('Selected:', level.title);
                }}
              >
                {level.recommended && (
                  <div className="text-center mb-4">
                    <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-bold">
                      ⭐ מומלץ
                    </span>
                  </div>
                )}
                <div className="text-6xl mb-4">{level.emoji}</div>
                <h3 className="text-2xl font-bold text-white mb-2">{level.title}</h3>
                <p className="text-[var(--color-text-secondary)] mb-4">{level.desc}</p>
                <div className={`h-2 w-full bg-gradient-to-r ${level.color} rounded-full`} />
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'complete',
      title: 'הכל מוכן! 🎉',
      description: 'המערכת מוכנה לזיהוי הונאות',
      icon: BarChart3,
      color: 'from-green-500 to-emerald-500',
      content: (
        <div className="text-center space-y-8">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
            <CheckCircle2 className="w-16 h-16 text-white" />
          </div>
          <div>
            <h2 className="text-4xl font-bold text-white mb-4">
              הכל מוכן!
            </h2>
            <p className="text-xl text-[var(--color-text-secondary)] max-w-xl mx-auto mb-8">
              המערכת שלכם מוכנה לזיהוי הונאות. בואו נתחיל!
            </p>
          </div>
          <div className="glass rounded-2xl p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-6">מה הלאה?</h3>
            <div className="grid md:grid-cols-2 gap-4 text-right">
              {[
                { icon: '📊', title: 'לוח בקרה', desc: 'צפו בסטטיסטיקות' },
                { icon: '🔍', title: 'זיהוי הונאות', desc: 'בדקו אנומליות' },
                { icon: '📈', title: 'אנליטיקס', desc: 'ניתוח מעמיק' },
                { icon: '📧', title: 'דוחות', desc: 'הפקת דוחות' }
              ].map((item, i) => (
                <div key={i} className="glass-strong rounded-xl p-4 text-center">
                  <div className="text-4xl mb-2">{item.icon}</div>
                  <h4 className="font-bold text-white mb-1">{item.title}</h4>
                  <p className="text-sm text-[var(--color-text-secondary)]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => {
              if (onComplete) {
                onComplete();
              } else {
                navigate('/app/dashboard');
              }
            }}
            className="px-12 py-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white font-bold text-lg hover:scale-105 transition-all shadow-lg"
          >
            היכנסו ללוח הבקרה →
          </button>
        </div>
      )
    }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] relative overflow-hidden" dir="rtl">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] blob-cyan rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] blob-magenta rounded-full blur-3xl opacity-20" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 glass-strong">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 flex items-center justify-center">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="text-2xl font-bold text-white block">MagenAd</span>
                <span className="text-xs text-[var(--color-text-tertiary)]">הגדרת חשבון</span>
              </div>
            </div>
            {user && (
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-white">{user.full_name}</p>
                <p className="text-xs text-[var(--color-text-tertiary)]">{user.email}</p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="relative z-10 border-b border-white/10 glass-strong">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">התקדמות</span>
              <span className="text-2xl font-bold gradient-text">{Math.round(progress)}%</span>
            </div>
            <div className="text-sm text-[var(--color-text-tertiary)]">
              שלב {currentStep + 1} מתוך {steps.length}
            </div>
          </div>
          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Steps Indicator */}
      <div className="relative z-10 border-b border-white/10 glass-strong">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                      index <= currentStep
                        ? 'bg-gradient-to-br ' + step.color + ' border-transparent'
                        : 'bg-white/5 border-white/20'
                    }`}
                  >
                    {index < currentStep ? (
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    ) : (
                      <step.icon className={`w-6 h-6 ${index === currentStep ? 'text-white' : 'text-white/40'}`} />
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <div className={`text-xs font-bold ${index <= currentStep ? 'text-white' : 'text-white/40'}`}>
                      {step.title.split(' ')[0]}
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 transition-all ${
                      index < currentStep ? 'bg-gradient-to-r ' + step.color : 'bg-white/5'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <div className="glass-strong rounded-3xl p-12 border border-white/10 min-h-[600px] flex items-center justify-center">
          {currentStepData.content}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
              currentStep === 0
                ? 'glass opacity-50 cursor-not-allowed'
                : 'glass-strong hover:scale-105'
            }`}
          >
            <ArrowRight className="w-5 h-5" />
            <span>הקודם</span>
          </button>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={() => {
                if (currentStep === 1 && !connectedAccountId) {
                  // If on connect step and not connected, navigate to connect
                  navigate('/app/connect-ads');
                } else {
                  setCurrentStep(currentStep + 1);
                }
              }}
              className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl text-white font-bold hover:scale-105 transition-all flex items-center gap-2"
            >
              <span>הבא</span>
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => {
                if (onComplete) {
                  onComplete();
                } else {
                  navigate('/app/dashboard');
                }
              }}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white font-bold hover:scale-105 transition-all flex items-center gap-2"
            >
              <span>סיום</span>
              <CheckCircle2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

export default OnboardingPage;
