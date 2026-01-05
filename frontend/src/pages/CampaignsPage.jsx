import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function CampaignsPage() {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCampaigns();
  }, [accountId]);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Get campaigns
      const response = await fetch(`http://localhost:3001/api/googleads/campaigns/${accountId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to load campaigns');

      const data = await response.json();
      setCampaigns(data.campaigns || []);

      // Get account info
      const accountsResponse = await fetch('http://localhost:3001/api/googleads/accounts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (accountsResponse.ok) {
        const accountsData = await accountsResponse.json();
        const foundAccount = accountsData.accounts.find(acc => acc.id === parseInt(accountId));
        setAccount(foundAccount);
      }
    } catch (err) {
      setError('שגיאה בטעינת קמפיינים. נסו שוב.');
      console.error('Error loading campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (micros, currency) => {
    const amount = micros / 1000000;
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: currency || 'ILS',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ENABLED':
        return 'text-[var(--color-success)] bg-[var(--color-success)]/20';
      case 'PAUSED':
        return 'text-yellow-500 bg-yellow-500/20';
      case 'REMOVED':
        return 'text-[var(--color-danger)] bg-[var(--color-danger)]/20';
      default:
        return 'text-[var(--color-text-tertiary)] bg-white/10';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ENABLED': return 'פעיל';
      case 'PAUSED': return 'מושהה';
      case 'REMOVED': return 'הוסר';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--color-cyan)]/20 border-t-[var(--color-cyan)] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--color-text-secondary)]">טוען קמפיינים...</p>
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
                <span className="text-xs text-[var(--color-text-tertiary)]">קמפיינים</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/app/connect-ads')}
              className="px-6 py-3 glass hover:glass-strong border border-white/10 rounded-xl text-white text-sm font-bold transition-all"
            >
              ← חזרה לחשבונות
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="mb-12">
          <h1 className="text-6xl font-bold text-white mb-4">
            קמפיינים - <span className="gradient-text">{account?.customer_name}</span>
          </h1>
          <p className="text-2xl text-[var(--color-text-secondary)]">
            סקירה של כל הקמפיינים בחשבון
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-8 p-6 bg-[var(--color-danger)]/10 border-2 border-[var(--color-danger)]/30 rounded-2xl">
            <p className="text-[var(--color-danger)] text-lg font-bold">{error}</p>
          </div>
        )}

        {/* Stats Overview */}
        {campaigns.length > 0 && (
          <div className="grid grid-cols-4 gap-6 mb-12">
            {[
              {
                label: 'סה"כ קמפיינים',
                value: campaigns.length,
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                ),
                color: 'from-[var(--color-cyan)] to-[var(--color-purple)]'
              },
              {
                label: 'פעילים',
                value: campaigns.filter(c => c.campaign.status === 'ENABLED').length,
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                color: 'from-[var(--color-success)] to-[var(--color-cyan)]'
              },
              {
                label: 'סה"כ הקלקות',
                value: campaigns.reduce((sum, c) => sum + (c.metrics?.clicks || 0), 0).toLocaleString('he-IL'),
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                ),
                color: 'from-[var(--color-purple)] to-[var(--color-magenta)]'
              },
              {
                label: 'סה"כ הוצאה',
                value: formatCurrency(
                  campaigns.reduce((sum, c) => sum + (c.metrics?.cost_micros || 0), 0),
                  account?.currency_code
                ),
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                color: 'from-[var(--color-magenta)] to-[var(--color-cyan)]'
              }
            ].map((stat, index) => (
              <div key={index} className="glass-strong rounded-2xl p-6 border border-white/10">
                <div className={`inline-flex p-4 bg-gradient-to-br ${stat.color} rounded-xl text-white mb-4`}>
                  {stat.icon}
                </div>
                <p className="text-sm text-[var(--color-text-tertiary)] mb-2">{stat.label}</p>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Campaigns List */}
        {campaigns.length === 0 ? (
          <div className="glass-strong rounded-3xl p-16 border border-white/10 text-center">
            <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-[var(--color-cyan)] to-[var(--color-purple)] rounded-full flex items-center justify-center opacity-50">
              <svg className="w-16 h-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">אין קמפיינים</h3>
            <p className="text-xl text-[var(--color-text-secondary)]">
              לא נמצאו קמפיינים בחשבון זה
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {campaigns.map((campaign) => (
              <div key={campaign.campaign.id} className="glass-strong rounded-2xl p-8 border border-white/10 hover:border-[var(--color-cyan)]/30 transition-all">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-2xl font-bold text-white">{campaign.campaign.name}</h3>
                      <span className={`px-3 py-1 ${getStatusColor(campaign.campaign.status)} text-xs font-bold rounded-full`}>
                        {getStatusText(campaign.campaign.status)}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--color-text-tertiary)]">
                      ID: {campaign.campaign.id}
                    </p>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-4 gap-6">
                  <div className="glass rounded-xl p-4">
                    <p className="text-xs text-[var(--color-text-tertiary)] mb-2">חשיפות</p>
                    <p className="text-2xl font-bold text-white">
                      {(campaign.metrics?.impressions || 0).toLocaleString('he-IL')}
                    </p>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <p className="text-xs text-[var(--color-text-tertiary)] mb-2">הקלקות</p>
                    <p className="text-2xl font-bold text-white">
                      {(campaign.metrics?.clicks || 0).toLocaleString('he-IL')}
                    </p>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <p className="text-xs text-[var(--color-text-tertiary)] mb-2">CTR</p>
                    <p className="text-2xl font-bold text-white">
                      {campaign.metrics?.impressions > 0
                        ? ((campaign.metrics.clicks / campaign.metrics.impressions) * 100).toFixed(2)
                        : 0}%
                    </p>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <p className="text-xs text-[var(--color-text-tertiary)] mb-2">הוצאה</p>
                    <p className="text-2xl font-bold gradient-text">
                      {formatCurrency(campaign.metrics?.cost_micros || 0, account?.currency_code)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default CampaignsPage;