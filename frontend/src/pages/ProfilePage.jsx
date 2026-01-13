import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  CreditCard, 
  Settings, 
  Bell,
  Shield,
  Key,
  LogOut,
  ArrowRight,
  Save,
  Edit,
  X
} from 'lucide-react';

// Password Change Component
function PasswordChangeSection() {
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      alert('נא למלא את כל השדות');
      return;
    }

    if (passwords.new !== passwords.confirm) {
      alert('הסיסמאות החדשות לא תואמות');
      return;
    }

    if (passwords.new.length < 6) {
      alert('סיסמה חדשה חייבת להכיל לפחות 6 תווים');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/user/password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_password: passwords.current,
          new_password: passwords.new
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to change password');
      }

      alert('✅ הסיסמה עודכנה בהצלחה!');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      alert(`❌ שגיאה בשינוי סיסמה: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-white mb-6">אבטחה</h2>
      
      {/* Change Password */}
      <div className="glass rounded-2xl p-6 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Key className="w-5 h-5" />
          שנה סיסמה
        </h3>
        <div className="space-y-4">
          <input
            type="password"
            value={passwords.current}
            onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
            placeholder="סיסמה נוכחית"
            className="w-full px-4 py-3 glass rounded-xl border border-white/10 text-white placeholder-[var(--color-text-tertiary)] focus:border-[var(--color-cyan)] focus:outline-none"
          />
          <input
            type="password"
            value={passwords.new}
            onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
            placeholder="סיסמה חדשה"
            className="w-full px-4 py-3 glass rounded-xl border border-white/10 text-white placeholder-[var(--color-text-tertiary)] focus:border-[var(--color-cyan)] focus:outline-none"
          />
          <input
            type="password"
            value={passwords.confirm}
            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
            placeholder="אישור סיסמה חדשה"
            className="w-full px-4 py-3 glass rounded-xl border border-white/10 text-white placeholder-[var(--color-text-tertiary)] focus:border-[var(--color-cyan)] focus:outline-none"
          />
          <button 
            onClick={handleChangePassword}
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-[var(--color-cyan)] to-[var(--color-purple)] text-white font-bold rounded-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'שומר...' : 'שמור סיסמה חדשה'}
          </button>
        </div>
      </div>

      {/* Two Factor Auth */}
      <div className="glass rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">אימות דו-שלבי</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              הוסף שכבת אבטחה נוספת לחשבון שלך
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-14 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:right-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[var(--color-cyan)]"></div>
          </label>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="glass rounded-2xl p-6 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-4">סשנים פעילים</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 glass rounded-xl border border-white/10">
            <div>
              <div className="text-white font-bold">דפדפן זה</div>
              <div className="text-sm text-[var(--color-text-secondary)]">
                Windows • Chrome • {new Date().toLocaleDateString('he-IL')}
              </div>
            </div>
            <div className="px-3 py-1 bg-[var(--color-success)]/20 text-[var(--color-success)] rounded-lg text-sm font-bold">
              פעיל
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Notification Settings Component
function NotificationSettings() {
  const [settings, setSettings] = useState({
    email_alerts: true,
    sms_alerts: false,
    daily_summary: true,
    weekly_report: true
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/user/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || settings);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/user/notifications', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSettings)
      });

      if (!response.ok) {
        // Revert on error
        setSettings(settings);
        throw new Error('Failed to update');
      }
    } catch (error) {
      console.error('Error updating notifications:', error);
      alert('❌ שגיאה בעדכון הגדרות התראות');
    }
  };

  if (loading) {
    return <div className="text-center py-8"><div className="w-8 h-8 border-4 border-[var(--color-cyan)]/20 border-t-[var(--color-cyan)] rounded-full animate-spin mx-auto" /></div>;
  }

  return (
    <div className="space-y-4">
      {[
        { id: 'email_alerts', label: 'התראות באימייל', description: 'קבלו התראות על הונאות באימייל' },
        { id: 'sms_alerts', label: 'התראות SMS', description: 'קבלו התראות חשובות ב-SMS' },
        { id: 'daily_summary', label: 'סיכום יומי', description: 'קבלו סיכום יומי של הפעילות' },
        { id: 'weekly_report', label: 'דוח שבועי', description: 'קבלו דוח שבועי מפורט' }
      ].map(setting => (
        <div key={setting.id} className="glass rounded-xl p-4 border border-white/10 flex items-center justify-between">
          <div>
            <div className="text-white font-bold mb-1">{setting.label}</div>
            <div className="text-sm text-[var(--color-text-secondary)]">{setting.description}</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={settings[setting.id] || false}
              onChange={(e) => handleToggle(setting.id, e.target.checked)}
              className="sr-only peer" 
            />
            <div className="w-14 h-7 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:right-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[var(--color-cyan)]"></div>
          </label>
        </div>
      ))}
    </div>
  );
}

function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    company_name: ''
  });

  // Subscription states
  const [subscription, setSubscription] = useState(null);
  
  // Email verification states
  const [emailVerified, setEmailVerified] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(true);
  const [resendingEmail, setResendingEmail] = useState(false);

  useEffect(() => {
    checkAuth();
    loadSubscription();
    checkVerificationStatus();
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
      setFormData({
        full_name: data.user.full_name || '',
        email: data.user.email || '',
        phone: data.user.phone || '',
        company_name: data.user.company_name || ''
      });
      setLoading(false);
    } catch (error) {
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  const loadSubscription = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/subscription/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      } else {
        // אם אין מנוי, זה בסדר
        setSubscription(null);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
      setSubscription(null);
    }
  };

  const checkVerificationStatus = async () => {
    try {
      const token = localStorage.getItem('token');
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
      console.error('Error checking verification status:', error);
    } finally {
      setCheckingVerification(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;

    setResendingEmail(true);
    try {
      const response = await fetch('http://localhost:3001/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: user.email })
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ אימייל אימות נשלח! אנא בדקו את תיבת הדואר.');
      } else {
        alert(`❌ ${data.error || 'שגיאה בשליחת אימייל אימות'}`);
      }
    } catch (error) {
      console.error('Error resending verification:', error);
      alert('❌ שגיאה בשליחת אימייל אימות');
    } finally {
      setResendingEmail(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: formData.full_name,
          phone: formData.phone,
          company_name: formData.company_name
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const data = await response.json();
      setUser(data.user);
      setIsEditing(false);
      alert('✅ הפרופיל עודכן בהצלחה!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(`❌ שגיאה בעדכון הפרופיל: ${error.message}`);
    }
  };

  const handleLogout = () => {
    if (window.confirm('האם אתם בטוחים שברצונכם להתנתק?')) {
      localStorage.removeItem('token');
      navigate('/');
    }
  };

  const tabs = [
    { id: 'profile', label: 'פרופיל אישי', icon: User },
    { id: 'subscription', label: 'מנוי ותשלום', icon: CreditCard },
    { id: 'notifications', label: 'התראות', icon: Bell },
    { id: 'security', label: 'אבטחה', icon: Shield },
    { id: 'settings', label: 'הגדרות', icon: Settings }
  ];

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
  const userInitial = user?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]" dir="rtl">
      {/* Header */}
      <header className="border-b border-white/10 glass-strong sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/app/dashboard')}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-cyan)] via-[var(--color-purple)] to-[var(--color-magenta)] flex items-center justify-center hover:scale-105 transition-all"
              >
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </button>
              <div>
                <span className="text-2xl font-bold text-white block">MagenAd</span>
                <span className="text-xs text-[var(--color-text-tertiary)]">הגדרות משתמש</span>
              </div>
            </div>

            {/* Back Button */}
            <button
              onClick={() => navigate('/app/dashboard')}
              className="px-6 py-3 glass hover:glass-strong border border-white/10 rounded-xl text-white text-sm font-bold transition-all hover:scale-105 flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              חזור לדשבורד
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Profile Header */}
        <div className="mb-12">
          <div className="glass-strong rounded-3xl p-8 border-2 border-white/10">
            <div className="flex items-center gap-6">
              {/* Avatar */}
              <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[var(--color-cyan)] via-[var(--color-purple)] to-[var(--color-magenta)] flex items-center justify-center border-4 border-white/20 shadow-2xl">
                <span className="text-5xl font-bold text-white">
                  {userInitial}
                </span>
              </div>

              {/* User Info */}
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-white mb-2">
                  {user?.full_name || 'משתמש'}
                </h1>
                <p className="text-xl text-[var(--color-text-secondary)] mb-4">
                  {user?.email}
                </p>
                {user?.company_name && (
                  <div className="flex items-center gap-2 text-[var(--color-text-tertiary)]">
                    <Building className="w-4 h-4" />
                    <span>{user.company_name}</span>
                  </div>
                )}
              </div>

              {/* Status Badges */}
              <div className="text-left flex flex-col gap-3">
                {/* Subscription Badge */}
                <div className="px-6 py-3 glass rounded-xl border border-[var(--color-success)]/30">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-[var(--color-success)] rounded-full animate-pulse" />
                    <span className="text-sm text-[var(--color-text-secondary)]">פעיל</span>
                  </div>
                  <div className="text-lg font-bold text-white">
                    {subscription?.plan || 'ללא מנוי'}
                  </div>
                </div>

                {/* Email Verification Badge */}
                {!checkingVerification && (
                  <div className={`px-4 py-2 glass rounded-xl border ${
                    emailVerified 
                      ? 'border-[var(--color-success)]/30' 
                      : 'border-orange-500/30'
                  }`}>
                    {emailVerified ? (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[var(--color-success)] rounded-full" />
                        <span className="text-xs text-[var(--color-text-secondary)]">אימייל מאומת</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                          <span className="text-xs text-orange-400">אימייל לא מאומת</span>
                        </div>
                        <button
                          onClick={handleResendVerification}
                          disabled={resendingEmail}
                          className="text-xs px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                        >
                          {resendingEmail ? 'שולח...' : 'שלח אימייל אימות'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex gap-4 overflow-x-auto pb-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-6 py-4 rounded-xl font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-[var(--color-cyan)] to-[var(--color-purple)] text-white shadow-lg scale-105'
                      : 'glass hover:glass-strong text-[var(--color-text-secondary)] hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="glass-strong rounded-3xl p-8 border border-white/10">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-white">פרטים אישיים</h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-3 glass hover:glass-strong border border-[var(--color-cyan)]/30 rounded-xl text-[var(--color-cyan)] font-bold transition-all hover:scale-105 flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    ערוך
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          full_name: user?.full_name || '',
                          email: user?.email || '',
                          phone: user?.phone || '',
                          company_name: user?.company_name || ''
                        });
                      }}
                      className="px-6 py-3 glass hover:glass-strong border border-white/10 rounded-xl text-white font-bold transition-all hover:scale-105 flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      ביטול
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      className="px-6 py-3 bg-gradient-to-r from-[var(--color-cyan)] to-[var(--color-purple)] text-white font-bold rounded-xl hover:scale-105 transition-all flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      שמור
                    </button>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label className="block text-white font-bold mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    שם מלא
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-4 py-3 glass rounded-xl border border-white/10 text-white placeholder-[var(--color-text-tertiary)] focus:border-[var(--color-cyan)] focus:outline-none"
                      placeholder="הזינו שם מלא"
                    />
                  ) : (
                    <div className="px-4 py-3 glass rounded-xl border border-white/10 text-white">
                      {user?.full_name || 'לא הוזן'}
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-white font-bold mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    אימייל
                  </label>
                  <div className="px-4 py-3 glass rounded-xl border border-white/10 text-white">
                    {user?.email}
                  </div>
                  <p className="text-xs text-[var(--color-text-tertiary)] mt-2">
                    האימייל לא ניתן לשינוי
                  </p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-white font-bold mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    טלפון
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 glass rounded-xl border border-white/10 text-white placeholder-[var(--color-text-tertiary)] focus:border-[var(--color-cyan)] focus:outline-none"
                      placeholder="הזינו מספר טלפון"
                    />
                  ) : (
                    <div className="px-4 py-3 glass rounded-xl border border-white/10 text-white">
                      {user?.phone || 'לא הוזן'}
                    </div>
                  )}
                </div>

                {/* Company */}
                <div>
                  <label className="block text-white font-bold mb-2 flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    שם חברה
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      className="w-full px-4 py-3 glass rounded-xl border border-white/10 text-white placeholder-[var(--color-text-tertiary)] focus:border-[var(--color-cyan)] focus:outline-none"
                      placeholder="הזינו שם חברה"
                    />
                  ) : (
                    <div className="px-4 py-3 glass rounded-xl border border-white/10 text-white">
                      {user?.company_name || 'לא הוזן'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'subscription' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-white mb-6">מנוי ותשלום</h2>
              
              {subscription ? (
                <div className="space-y-6">
                  {/* Current Plan */}
                  <div className="glass rounded-2xl p-6 border-2 border-[var(--color-cyan)]/30">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-2">{subscription.plan}</h3>
                        <p className="text-[var(--color-text-secondary)]">
                          {subscription.status === 'active' ? 'מנוי פעיל' : 'מנוי לא פעיל'}
                        </p>
                      </div>
                      <div className="text-left">
                        <div className="text-3xl font-bold gradient-text mb-1">
                          ₪{subscription.price}/חודש
                        </div>
                        <p className="text-xs text-[var(--color-text-tertiary)]">
                          {subscription.billing_cycle}
                        </p>
                      </div>
                    </div>
                    {subscription.next_billing_date && (
                      <div className="pt-4 border-t border-white/10">
                        <p className="text-sm text-[var(--color-text-secondary)]">
                          תאריך חידוש הבא: {new Date(subscription.next_billing_date).toLocaleDateString('he-IL')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Change Plan */}
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4">שנה תוכנית</h3>
                    <div className="grid md:grid-cols-3 gap-6">
                      {[
                        { name: 'Basic', price: 299, features: ['עד 5 קמפיינים', 'זיהוי בסיסי', 'דוחות חודשיים'] },
                        { name: 'Pro', price: 499, features: ['קמפיינים ללא הגבלה', 'זיהוי מתקדם', 'דוחות שבועיים', 'תמיכה 24/7'] },
                        { name: 'Enterprise', price: 999, features: ['הכל ב-Pro', 'API Access', 'ניהול צוות', 'תמיכה ייעודית'] }
                      ].map(plan => (
                        <div
                          key={plan.name}
                          className={`glass rounded-2xl p-6 border-2 transition-all hover:scale-105 cursor-pointer ${
                            subscription.plan === plan.name
                              ? 'border-[var(--color-cyan)]/50 bg-[var(--color-cyan)]/10'
                              : 'border-white/10 hover:border-[var(--color-cyan)]/30'
                          }`}
                        >
                          <h4 className="text-xl font-bold text-white mb-2">{plan.name}</h4>
                          <div className="text-3xl font-bold gradient-text mb-4">₪{plan.price}/חודש</div>
                          <ul className="space-y-2 mb-4">
                            {plan.features.map((feature, index) => (
                              <li key={index} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                                <div className="w-1.5 h-1.5 bg-[var(--color-cyan)] rounded-full" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                          <button
                            onClick={async () => {
                              if (subscription?.plan === plan.name) return;
                              try {
                                const token = localStorage.getItem('token');
                                const response = await fetch('http://localhost:3001/api/subscription/change-plan', {
                                  method: 'PUT',
                                  headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                  },
                                  body: JSON.stringify({ 
                                    plan_type: plan.name.toLowerCase(),
                                    billing_cycle: 'monthly'
                                  })
                                });

                                if (!response.ok) {
                                  const errorData = await response.json();
                                  throw new Error(errorData.error || 'Failed to change plan');
                                }

                                const data = await response.json();
                                setSubscription(data.subscription);
                                alert('✅ תוכנית המנוי עודכנה בהצלחה!');
                                loadSubscription();
                              } catch (error) {
                                console.error('Error changing plan:', error);
                                alert(`❌ שגיאה בשינוי תוכנית: ${error.message}`);
                              }
                            }}
                            className={`w-full py-3 rounded-xl font-bold transition-all ${
                              subscription?.plan === plan.name
                                ? 'glass border border-[var(--color-cyan)]/30 text-[var(--color-cyan)]'
                                : 'bg-gradient-to-r from-[var(--color-cyan)] to-[var(--color-purple)] text-white hover:scale-105'
                            }`}
                          >
                            {subscription?.plan === plan.name ? 'תוכנית נוכחית' : 'עבור לתוכנית זו'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-[var(--color-cyan)] to-[var(--color-purple)] rounded-3xl flex items-center justify-center">
                    <CreditCard className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">אין מנוי פעיל</h3>
                  <p className="text-[var(--color-text-secondary)] mb-6">
                    בחרו תוכנית מנוי כדי להתחיל להשתמש בשירות
                  </p>
                  <button
                    onClick={() => navigate('/app/pricing')}
                    className="px-8 py-4 bg-gradient-to-r from-[var(--color-cyan)] to-[var(--color-purple)] text-white font-bold rounded-xl hover:scale-105 transition-all"
                  >
                    בחרו תוכנית →
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-white mb-6">הגדרות התראות</h2>
              
              <NotificationSettings />
            </div>
          )}

          {activeTab === 'security' && (
            <PasswordChangeSection />
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-white mb-6">הגדרות כלליות</h2>
              
              <div className="space-y-4">
                {/* Language */}
                <div className="glass rounded-xl p-4 border border-white/10">
                  <label className="block text-white font-bold mb-2">שפה</label>
                  <select className="w-full px-4 py-3 glass rounded-xl border border-white/10 text-white bg-transparent focus:border-[var(--color-cyan)] focus:outline-none">
                    <option value="he">עברית</option>
                    <option value="en">English</option>
                  </select>
                </div>

                {/* Timezone */}
                <div className="glass rounded-xl p-4 border border-white/10">
                  <label className="block text-white font-bold mb-2">אזור זמן</label>
                  <select className="w-full px-4 py-3 glass rounded-xl border border-white/10 text-white bg-transparent focus:border-[var(--color-cyan)] focus:outline-none">
                    <option value="Asia/Jerusalem">ירושלים (GMT+2)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>

                {/* Date Format */}
                <div className="glass rounded-xl p-4 border border-white/10">
                  <label className="block text-white font-bold mb-2">פורמט תאריך</label>
                  <select className="w-full px-4 py-3 glass rounded-xl border border-white/10 text-white bg-transparent focus:border-[var(--color-cyan)] focus:outline-none">
                    <option value="he-IL">DD/MM/YYYY</option>
                    <option value="en-US">MM/DD/YYYY</option>
                  </select>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="mt-12 pt-8 border-t border-red-500/30">
                <h3 className="text-2xl font-bold text-red-400 mb-4">אזור מסוכן</h3>
                <div className="space-y-4">
                  <button
                    onClick={handleLogout}
                    className="w-full px-6 py-4 glass rounded-xl border border-red-500/30 text-red-400 font-bold hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-5 h-5" />
                    התנתקות מהחשבון
                  </button>
                  <button
                    className="w-full px-6 py-4 glass rounded-xl border border-red-500/30 text-red-400 font-bold hover:bg-red-500/10 transition-all"
                  >
                    מחק חשבון לצמיתות
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default ProfilePage;
