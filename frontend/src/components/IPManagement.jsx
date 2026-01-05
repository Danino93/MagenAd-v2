/*
 * IPManagement.jsx
 * 
 * IP Blocking & Whitelist Management:
 * - Blacklist view (active blocks)
 * - Whitelist view
 * - Add/Remove IPs
 * - Bulk blocking
 * - Blocking statistics
 * - IP search & check
 */

import { useState, useEffect } from 'react';

function IPManagement({ accountId }) {
  const [activeTab, setActiveTab] = useState('blacklist');
  const [blacklist, setBlacklist] = useState([]);
  const [whitelist, setWhitelist] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Add IP form
  const [newIP, setNewIP] = useState('');
  const [reason, setReason] = useState('');
  const [blockType, setBlockType] = useState('full');

  useEffect(() => {
    if (!accountId) {
      setLoading(false);
      return;
    }
    loadData();
  }, [accountId, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const [blacklistRes, whitelistRes, statsRes] = await Promise.all([
        fetch(`http://localhost:3001/api/ipblocking/${accountId}/blacklist`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`http://localhost:3001/api/ipblocking/${accountId}/whitelist`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`http://localhost:3001/api/ipblocking/${accountId}/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const blacklistData = await blacklistRes.json();
      const whitelistData = await whitelistRes.json();
      const statsData = await statsRes.json();

      setBlacklist(blacklistData.blacklist || []);
      setWhitelist(whitelistData.whitelist || []);
      setStats(statsData.stats);
    } catch (error) {
      console.error('Error loading IP management data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockIP = async () => {
    if (!newIP || !reason) {
      alert('נא למלא IP וסיבה');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3001/api/ipblocking/${accountId}/blacklist`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ipAddress: newIP,
            reason,
            source: 'manual',
            blockType
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      alert('✅ IP נחסם בהצלחה!');
      setNewIP('');
      setReason('');
      loadData();
    } catch (error) {
      alert(`❌ שגיאה: ${error.message}`);
    }
  };

  const handleWhitelistIP = async () => {
    if (!newIP || !reason) {
      alert('נא למלא IP וסיבה');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3001/api/ipblocking/${accountId}/whitelist`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ipAddress: newIP,
            reason
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      alert('✅ IP הוסף לרשימה הלבנה!');
      setNewIP('');
      setReason('');
      loadData();
    } catch (error) {
      alert(`❌ שגיאה: ${error.message}`);
    }
  };

  const handleUnblock = async (ip) => {
    if (!confirm(`האם לבטל חסימה של ${ip}?`)) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(
        `http://localhost:3001/api/ipblocking/${accountId}/blacklist/${ip}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert('✅ חסימה בוטלה!');
      loadData();
    } catch (error) {
      alert('❌ שגיאה בביטול חסימה');
    }
  };

  const handleRemoveFromWhitelist = async (ip) => {
    if (!confirm(`האם להסיר ${ip} מהרשימה הלבנה?`)) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(
        `http://localhost:3001/api/ipblocking/${accountId}/whitelist/${ip}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert('✅ הוסר מהרשימה הלבנה!');
      loadData();
    } catch (error) {
      alert('❌ שגיאה בהסרה');
    }
  };

  if (!accountId) {
    return (
      <div className="glass-strong rounded-2xl p-12 border border-white/10 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center opacity-50">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">🛡️ ניהול IP</h3>
        <p className="text-[var(--color-text-secondary)] mb-4">
          כאן תוכלו לנהל רשימות IP:
        </p>
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm max-w-md mx-auto">
          <div className="glass rounded-lg p-3 border border-white/10">
            <div className="text-xl mb-1">🚫</div>
            <p className="text-[var(--color-text-secondary)]">רשימה שחורה</p>
            <p className="text-xs text-[var(--color-text-tertiary)]">חסום IPs חשודים</p>
          </div>
          <div className="glass rounded-lg p-3 border border-white/10">
            <div className="text-xl mb-1">✅</div>
            <p className="text-[var(--color-text-secondary)]">רשימה לבנה</p>
            <p className="text-xs text-[var(--color-text-tertiary)]">אשר IPs בטוחים</p>
          </div>
        </div>
        <p className="text-[var(--color-text-tertiary)] text-sm mb-6">
          כדי לנהל IPs, חברו את חשבון Google Ads שלכם
        </p>
        <button
          onClick={() => window.location.href = '/app/connect-ads'}
          className="px-8 py-4 bg-gradient-to-r from-[var(--color-cyan)] to-[var(--color-purple)] rounded-xl text-white font-bold hover:scale-105 transition-transform"
        >
          חברו עכשיו →
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass-strong rounded-2xl p-8 border border-white/10 text-center">
        <div className="w-12 h-12 border-4 border-[var(--color-cyan)]/20 border-t-[var(--color-cyan)] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[var(--color-text-secondary)]">טוען...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">🛡️ ניהול IP</h2>
        <p className="text-[var(--color-text-secondary)]">
          חסום והרשה כתובות IP
        </p>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-4 gap-6">
          <div className="glass-strong rounded-2xl p-6 border border-white/10">
            <div className="text-3xl font-bold text-red-400 mb-2">
              {stats.blocked.total}
            </div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              IPs חסומים
            </div>
          </div>

          <div className="glass-strong rounded-2xl p-6 border border-white/10">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {stats.whitelisted.total}
            </div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              IPs מורשים
            </div>
          </div>

          <div className="glass-strong rounded-2xl p-6 border border-white/10">
            <div className="text-3xl font-bold text-orange-400 mb-2">
              {stats.blocked.auto}
            </div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              חסימות אוטומטיות
            </div>
          </div>

          <div className="glass-strong rounded-2xl p-6 border border-white/10">
            <div className="text-3xl font-bold text-white mb-2">
              {stats.blocked.clicksBlocked}
            </div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              Clicks נחסמו
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4">
        <button
          onClick={() => setActiveTab('blacklist')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'blacklist'
              ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
              : 'glass hover:bg-white/10 text-[var(--color-text-secondary)]'
          }`}
        >
          🚫 רשימה שחורה ({blacklist.length})
        </button>
        <button
          onClick={() => setActiveTab('whitelist')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'whitelist'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
              : 'glass hover:bg-white/10 text-[var(--color-text-secondary)]'
          }`}
        >
          ✅ רשימה לבנה ({whitelist.length})
        </button>
      </div>

      {/* Add IP Form */}
      <div className="glass-strong rounded-2xl p-6 border border-white/10">
        <h3 className="text-xl font-bold text-white mb-4">
          {activeTab === 'blacklist' ? '🚫 חסום IP' : '✅ אשר IP'}
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <input
            type="text"
            value={newIP}
            onChange={(e) => setNewIP(e.target.value)}
            placeholder="כתובת IP (לדוגמה: 185.220.101.42)"
            className="px-4 py-3 glass rounded-lg border border-white/10 text-white placeholder-white/40"
          />
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="סיבה"
            className="px-4 py-3 glass rounded-lg border border-white/10 text-white placeholder-white/40"
          />
          {activeTab === 'blacklist' && (
            <select
              value={blockType}
              onChange={(e) => setBlockType(e.target.value)}
              className="px-4 py-3 glass rounded-lg border border-white/10 text-white"
            >
              <option value="full">חסימה מלאה</option>
              <option value="temporary">חסימה זמנית (24h)</option>
            </select>
          )}
        </div>
        <button
          onClick={activeTab === 'blacklist' ? handleBlockIP : handleWhitelistIP}
          className={`mt-4 px-6 py-3 rounded-lg font-bold text-white ${
            activeTab === 'blacklist'
              ? 'bg-gradient-to-r from-red-500 to-orange-500'
              : 'bg-gradient-to-r from-green-500 to-emerald-500'
          } hover:scale-105 transition-all`}
        >
          {activeTab === 'blacklist' ? '🚫 חסום' : '✅ אשר'}
        </button>
      </div>

      {/* List */}
      <div className="glass-strong rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-xl font-bold text-white">
            {activeTab === 'blacklist' ? '🚫 רשימה שחורה' : '✅ רשימה לבנה'}
          </h3>
        </div>

        <div className="p-6 max-h-[600px] overflow-y-auto space-y-3">
          {activeTab === 'blacklist' ? (
            blacklist.length === 0 ? (
              <div className="text-center py-8 text-[var(--color-text-secondary)]">
                אין IPs חסומים
              </div>
            ) : (
              blacklist.map(item => (
                <div
                  key={item.id}
                  className="glass rounded-lg p-4 border border-white/10 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center border border-red-500/30">
                      <span className="text-xl">🚫</span>
                    </div>
                    <div>
                      <div className="text-white font-bold">{item.ip_address}</div>
                      <div className="text-sm text-[var(--color-text-secondary)]">
                        {item.reason}
                      </div>
                      <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                        {item.source === 'auto' ? '🤖 אוטומטי' : '👤 ידני'} • {item.block_type} • {new Date(item.blocked_at).toLocaleDateString('he-IL')}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnblock(item.ip_address)}
                    className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg border border-green-500/30 hover:bg-green-500/30 transition-all"
                  >
                    בטל חסימה
                  </button>
                </div>
              ))
            )
          ) : (
            whitelist.length === 0 ? (
              <div className="text-center py-8 text-[var(--color-text-secondary)]">
                אין IPs ברשימה הלבנה
              </div>
            ) : (
              whitelist.map(item => (
                <div
                  key={item.id}
                  className="glass rounded-lg p-4 border border-white/10 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center border border-green-500/30">
                      <span className="text-xl">✅</span>
                    </div>
                    <div>
                      <div className="text-white font-bold">{item.ip_address}</div>
                      <div className="text-sm text-[var(--color-text-secondary)]">
                        {item.reason}
                      </div>
                      <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                        {new Date(item.added_at).toLocaleDateString('he-IL')}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveFromWhitelist(item.ip_address)}
                    className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 hover:bg-red-500/30 transition-all"
                  >
                    הסר
                  </button>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default IPManagement;