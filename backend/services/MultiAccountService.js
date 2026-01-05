/*
 * MultiAccountService.js - ניהול מרובה חשבונות
 * 
 * מערכת ניהול חשבונות:
 * - Account Switching (מעבר בין חשבונות)
 * - Cross-Account Analytics (ניתוח משולב)
 * - Consolidated Dashboard (דשבורד מאוחד)
 * - Bulk Operations (פעולות קבוצתיות)
 * - Account Groups (קבוצות חשבונות)
 * - Master View (תצוגת על)
 */

const supabase = require('../config/supabase');

class MultiAccountService {
  /**
   * קבלת כל החשבונות של משתמש
   */
  async getUserAccounts(userId) {
    try {
      // חשבונות שהמשתמש הוא הבעלים שלהם
      const { data: ownedAccounts } = await supabase
        .from('ad_accounts')
        .select(`
          *,
          google_oauth_tokens(access_token, refresh_token, expires_at),
          _count:raw_events(count)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // חשבונות שהמשתמש חבר בצוות שלהם
      const { data: teamMemberships } = await supabase
        .from('team_members')
        .select(`
          role,
          ad_account:ad_accounts(
            *,
            google_oauth_tokens(access_token, refresh_token, expires_at)
          )
        `)
        .eq('user_id', userId);

      const accounts = [
        ...(ownedAccounts || []).map(acc => ({
          ...acc,
          role: 'admin',
          isOwner: true,
          totalClicks: acc._count?.[0]?.count || 0
        })),
        ...(teamMemberships || []).map(tm => ({
          ...tm.ad_account,
          role: tm.role,
          isOwner: false
        }))
      ];

      console.log(`✅ נמצאו ${accounts.length} חשבונות למשתמש ${userId}`);
      return accounts;
    } catch (error) {
      console.error('שגיאה בשליפת חשבונות:', error);
      return [];
    }
  }

  /**
   * החלפת חשבון פעיל
   */
  async switchAccount(userId, accountId) {
    try {
      // בדיקה שהמשתמש יכול לגשת לחשבון
      const hasAccess = await this.canAccessAccount(userId, accountId);
      if (!hasAccess) {
        throw new Error('אין גישה לחשבון זה');
      }

      // עדכון חשבון פעיל
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          active_account_id: accountId,
          updated_at: new Date().toISOString()
        });

      console.log(`✅ חשבון הוחלף: ${accountId}`);
      return { success: true, accountId };
    } catch (error) {
      console.error('שגיאה בהחלפת חשבון:', error);
      throw error;
    }
  }

  /**
   * קבלת חשבון פעיל
   */
  async getActiveAccount(userId) {
    try {
      const { data } = await supabase
        .from('user_preferences')
        .select('active_account_id')
        .eq('user_id', userId)
        .single();

      return data?.active_account_id || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * בדיקת גישה לחשבון
   */
  async canAccessAccount(userId, accountId) {
    // בעל החשבון
    const { data: account } = await supabase
      .from('ad_accounts')
      .select('user_id')
      .eq('id', accountId)
      .single();

    if (account?.user_id === userId) {
      return true;
    }

    // חבר צוות
    const { data: member } = await supabase
      .from('team_members')
      .select('id')
      .eq('ad_account_id', accountId)
      .eq('user_id', userId)
      .single();

    return !!member;
  }

  /**
   * ניתוח משולב - כל החשבונות
   */
  async getCrossAccountAnalytics(userId, dateRange) {
    try {
      const accounts = await this.getUserAccounts(userId);
      const accountIds = accounts.map(acc => acc.id);

      if (accountIds.length === 0) {
        return { accounts: [], totals: {} };
      }

      const { startDate, endDate } = dateRange;

      // קליקים כוללים
      const { count: totalClicks } = await supabase
        .from('raw_events')
        .select('id', { count: 'exact', head: true })
        .in('ad_account_id', accountIds)
        .eq('event_type', 'click')
        .gte('event_timestamp', startDate)
        .lte('event_timestamp', endDate);

      // זיהויים כוללים
      const { count: totalDetections } = await supabase
        .from('fraud_detections')
        .select('id', { count: 'exact', head: true })
        .in('ad_account_id', accountIds)
        .gte('detected_at', startDate)
        .lte('detected_at', endDate);

      // עלות כוללת
      const { data: clicksData } = await supabase
        .from('raw_events')
        .select('cost_micros, ad_account_id')
        .in('ad_account_id', accountIds)
        .eq('event_type', 'click')
        .gte('event_timestamp', startDate)
        .lte('event_timestamp', endDate);

      const totalCost = (clicksData || []).reduce((sum, c) => sum + (c.cost_micros || 0), 0) / 1000000;

      // פירוט לפי חשבון
      const accountBreakdown = await Promise.all(
        accountIds.map(async (accountId) => {
          const account = accounts.find(a => a.id === accountId);
          
          const { count: clicks } = await supabase
            .from('raw_events')
            .select('id', { count: 'exact', head: true })
            .eq('ad_account_id', accountId)
            .eq('event_type', 'click')
            .gte('event_timestamp', startDate)
            .lte('event_timestamp', endDate);

          const { count: detections } = await supabase
            .from('fraud_detections')
            .select('id', { count: 'exact', head: true })
            .eq('ad_account_id', accountId)
            .gte('detected_at', startDate)
            .lte('detected_at', endDate);

          const accountClicks = clicksData?.filter(c => c.ad_account_id === accountId) || [];
          const cost = accountClicks.reduce((sum, c) => sum + (c.cost_micros || 0), 0) / 1000000;

          return {
            accountId,
            accountName: account?.account_name || 'Unknown',
            clicks: clicks || 0,
            detections: detections || 0,
            cost: cost.toFixed(2),
            fraudRate: clicks > 0 ? ((detections / clicks) * 100).toFixed(1) : '0'
          };
        })
      );

      return {
        totals: {
          accounts: accountIds.length,
          clicks: totalClicks || 0,
          detections: totalDetections || 0,
          cost: totalCost.toFixed(2),
          fraudRate: totalClicks > 0 
            ? ((totalDetections / totalClicks) * 100).toFixed(1)
            : '0'
        },
        breakdown: accountBreakdown,
        dateRange
      };
    } catch (error) {
      console.error('שגיאה בניתוח משולב:', error);
      throw error;
    }
  }

  /**
   * דשבורד מאוחד
   */
  async getConsolidatedDashboard(userId) {
    try {
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [today, week] = await Promise.all([
        this.getCrossAccountAnalytics(userId, {
          startDate: last24h.toISOString(),
          endDate: now.toISOString()
        }),
        this.getCrossAccountAnalytics(userId, {
          startDate: last7d.toISOString(),
          endDate: now.toISOString()
        })
      ]);

      return {
        today: today.totals,
        week: week.totals,
        accounts: today.breakdown,
        generatedAt: now.toISOString()
      };
    } catch (error) {
      console.error('שגיאה בדשבורד מאוחד:', error);
      throw error;
    }
  }

  /**
   * יצירת קבוצת חשבונות
   */
  async createAccountGroup(userId, groupData) {
    try {
      const { name, description, accountIds } = groupData;

      // בדיקה שיש גישה לכל החשבונות
      for (const accountId of accountIds) {
        const hasAccess = await this.canAccessAccount(userId, accountId);
        if (!hasAccess) {
          throw new Error(`אין גישה לחשבון ${accountId}`);
        }
      }

      const { data, error } = await supabase
        .from('account_groups')
        .insert({
          user_id: userId,
          name,
          description,
          account_ids: accountIds,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ קבוצת חשבונות נוצרה:', name);
      return data;
    } catch (error) {
      console.error('שגיאה ביצירת קבוצה:', error);
      throw error;
    }
  }

  /**
   * קבלת קבוצות חשבונות
   */
  async getAccountGroups(userId) {
    try {
      const { data } = await supabase
        .from('account_groups')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      return data || [];
    } catch (error) {
      console.error('שגיאה בשליפת קבוצות:', error);
      return [];
    }
  }

  /**
   * פעולות קבוצתיות - חסימת IP בכל החשבונות
   */
  async bulkBlockIP(userId, accountIds, ipAddress, reason) {
    try {
      const results = [];

      for (const accountId of accountIds) {
        const hasAccess = await this.canAccessAccount(userId, accountId);
        if (!hasAccess) {
          results.push({
            accountId,
            success: false,
            error: 'אין גישה'
          });
          continue;
        }

        try {
          await supabase
            .from('ip_blacklist')
            .insert({
              ad_account_id: accountId,
              ip_address: ipAddress,
              reason,
              source: 'bulk_manual',
              blocked_at: new Date().toISOString()
            });

          results.push({
            accountId,
            success: true
          });
        } catch (error) {
          results.push({
            accountId,
            success: false,
            error: error.message
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      console.log(`✅ IP נחסם ב-${successCount}/${accountIds.length} חשבונות`);

      return {
        total: accountIds.length,
        success: successCount,
        failed: accountIds.length - successCount,
        results
      };
    } catch (error) {
      console.error('שגיאה בחסימה קבוצתית:', error);
      throw error;
    }
  }

  /**
   * פעולות קבוצתיות - עדכון הגדרות זיהוי
   */
  async bulkUpdateDetectionSettings(userId, accountIds, settings) {
    try {
      const results = [];

      for (const accountId of accountIds) {
        const hasAccess = await this.canAccessAccount(userId, accountId);
        if (!hasAccess) {
          results.push({
            accountId,
            success: false,
            error: 'אין גישה'
          });
          continue;
        }

        try {
          await supabase
            .from('ad_accounts')
            .update({
              detection_preset: settings.preset || 'balanced',
              updated_at: new Date().toISOString()
            })
            .eq('id', accountId);

          results.push({
            accountId,
            success: true
          });
        } catch (error) {
          results.push({
            accountId,
            success: false,
            error: error.message
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      console.log(`✅ הגדרות עודכנו ב-${successCount}/${accountIds.length} חשבונות`);

      return {
        total: accountIds.length,
        success: successCount,
        failed: accountIds.length - successCount,
        results
      };
    } catch (error) {
      console.error('שגיאה בעדכון קבוצתי:', error);
      throw error;
    }
  }

  /**
   * השוואת ביצועים בין חשבונות
   */
  async compareAccounts(userId, accountIds, dateRange) {
    try {
      const comparisons = await Promise.all(
        accountIds.map(async (accountId) => {
          const hasAccess = await this.canAccessAccount(userId, accountId);
          if (!hasAccess) {
            return null;
          }

          const { startDate, endDate } = dateRange;

          // נתונים בסיסיים
          const { count: clicks } = await supabase
            .from('raw_events')
            .select('id', { count: 'exact', head: true })
            .eq('ad_account_id', accountId)
            .eq('event_type', 'click')
            .gte('event_timestamp', startDate)
            .lte('event_timestamp', endDate);

          const { count: detections } = await supabase
            .from('fraud_detections')
            .select('id', { count: 'exact', head: true })
            .eq('ad_account_id', accountId)
            .gte('detected_at', startDate)
            .lte('detected_at', endDate);

          // Quiet Index ממוצע
          const { data: qiData } = await supabase
            .from('quiet_index_history')
            .select('qi_score')
            .eq('ad_account_id', accountId)
            .gte('calculated_at', startDate)
            .lte('calculated_at', endDate);

          const avgQI = qiData && qiData.length > 0
            ? (qiData.reduce((sum, d) => sum + d.qi_score, 0) / qiData.length).toFixed(1)
            : 0;

          // עלות
          const { data: costData } = await supabase
            .from('raw_events')
            .select('cost_micros')
            .eq('ad_account_id', accountId)
            .eq('event_type', 'click')
            .gte('event_timestamp', startDate)
            .lte('event_timestamp', endDate);

          const totalCost = (costData || []).reduce((sum, c) => sum + (c.cost_micros || 0), 0) / 1000000;

          // פרטי חשבון
          const { data: account } = await supabase
            .from('ad_accounts')
            .select('account_name, google_ads_customer_id')
            .eq('id', accountId)
            .single();

          return {
            accountId,
            accountName: account?.account_name || 'Unknown',
            customerId: account?.google_ads_customer_id,
            clicks: clicks || 0,
            detections: detections || 0,
            fraudRate: clicks > 0 ? ((detections / clicks) * 100).toFixed(1) : '0',
            avgQI: parseFloat(avgQI),
            cost: totalCost.toFixed(2),
            costPerClick: clicks > 0 ? (totalCost / clicks).toFixed(2) : '0'
          };
        })
      );

      return comparisons.filter(c => c !== null);
    } catch (error) {
      console.error('שגיאה בהשוואת חשבונות:', error);
      throw error;
    }
  }

  /**
   * מציאת החשבון הטוב ביותר
   */
  findBestAccount(comparisons) {
    if (!comparisons || comparisons.length === 0) {
      return null;
    }

    // ציון משולב: QI גבוה + fraudRate נמוך
    const scored = comparisons.map(account => ({
      ...account,
      score: parseFloat(account.avgQI) - parseFloat(account.fraudRate)
    }));

    return scored.sort((a, b) => b.score - a.score)[0];
  }

  /**
   * מציאת החשבון הגרוע ביותר
   */
  findWorstAccount(comparisons) {
    if (!comparisons || comparisons.length === 0) {
      return null;
    }

    const scored = comparisons.map(account => ({
      ...account,
      score: parseFloat(account.avgQI) - parseFloat(account.fraudRate)
    }));

    return scored.sort((a, b) => a.score - b.score)[0];
  }
}

module.exports = new MultiAccountService();