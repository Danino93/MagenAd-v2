/*
 * CooldownService.js
 * 
 * שירות לניהול תקופות Cooldown למניעת דיווחים כפולים
 * 
 * תפקיד:
 * - מניעת דיווחים כפולים מאותו מקור
 * - ניהול תקופות המתנה (12 שעות ברירת מחדל)
 * - ניקוי cooldowns שפג תוקפם
 * 
 * Database:
 * - Table: cooldown_tracker
 * - Fields: ad_account_id, rule_code, source_key, cooldown_until, created_at
 */

const supabase = require('../config/supabase');

class CooldownService {
  /**
   * בדיקה אם יש Cooldown פעיל
   * 
   * @param {string} accountId - מזהה החשבון
   * @param {string} ruleCode - קוד החוק (A1, A2, וכו')
   * @param {string} sourceKey - Source Key (או entity אחר)
   * @returns {Promise<boolean>} true אם יש cooldown פעיל
   */
  async checkCooldown(accountId, ruleCode, sourceKey) {
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('cooldown_tracker')
        .select('cooldown_until')
        .eq('ad_account_id', accountId)
        .eq('rule_code', ruleCode)
        .eq('source_key', sourceKey)
        .gt('cooldown_until', now)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking cooldown:', error);
        return false; // במקרה של שגיאה, נחזיר false (אין cooldown)
      }

      // אם יש רשומה, יש cooldown פעיל
      return !!data;
    } catch (error) {
      console.error('Error in checkCooldown:', error);
      return false;
    }
  }

  /**
   * הגדרת Cooldown
   * 
   * @param {string} accountId - מזהה החשבון
   * @param {string} ruleCode - קוד החוק (A1, A2, וכו')
   * @param {string} sourceKey - Source Key (או entity אחר)
   * @param {number} hours - מספר שעות cooldown (ברירת מחדל: 12)
   * @returns {Promise<void>}
   */
  async setCooldown(accountId, ruleCode, sourceKey, hours = 12) {
    try {
      const now = new Date();
      const cooldownUntil = new Date(now.getTime() + hours * 60 * 60 * 1000);

      const { error } = await supabase
        .from('cooldown_tracker')
        .upsert({
          ad_account_id: accountId,
          rule_code: ruleCode,
          source_key: sourceKey,
          cooldown_until: cooldownUntil.toISOString(),
          created_at: now.toISOString()
        }, {
          onConflict: 'ad_account_id,rule_code,source_key'
        });

      if (error) {
        console.error('Error setting cooldown:', error);
        throw error;
      }

      console.log(`✅ Cooldown set for account ${accountId}, rule ${ruleCode}, source ${sourceKey} until ${cooldownUntil.toISOString()}`);
    } catch (error) {
      console.error('Failed to set cooldown:', error);
      throw error;
    }
  }

  /**
   * ביטול Cooldown
   * 
   * @param {string} accountId - מזהה החשבון
   * @param {string} ruleCode - קוד החוק (A1, A2, וכו')
   * @param {string} sourceKey - Source Key (או entity אחר)
   * @returns {Promise<void>}
   */
  async clearCooldown(accountId, ruleCode, sourceKey) {
    try {
      const { error } = await supabase
        .from('cooldown_tracker')
        .delete()
        .eq('ad_account_id', accountId)
        .eq('rule_code', ruleCode)
        .eq('source_key', sourceKey);

      if (error) {
        console.error('Error clearing cooldown:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to clear cooldown:', error);
      throw error;
    }
  }

  /**
   * קבלת כל ה-Cooldowns הפעילים לחשבון
   * 
   * @param {string} accountId - מזהה החשבון
   * @returns {Promise<Array>} מערך של cooldowns פעילים
   */
  async getActiveCooldowns(accountId) {
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('cooldown_tracker')
        .select('*')
        .eq('ad_account_id', accountId)
        .gt('cooldown_until', now)
        .order('cooldown_until', { ascending: true });

      if (error) {
        console.error('Error getting active cooldowns:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get active cooldowns:', error);
      return [];
    }
  }

  /**
   * ניקוי Cooldowns שפג תוקפם
   * 
   * @returns {Promise<number>} מספר cooldowns שנוקו
   */
  async cleanupExpiredCooldowns() {
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('cooldown_tracker')
        .delete()
        .lt('cooldown_until', now)
        .select();

      if (error) {
        console.error('Error cleaning up expired cooldowns:', error);
        throw error;
      }

      const cleanedCount = data?.length || 0;
      
      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} expired cooldowns`);
      }

      return cleanedCount;
    } catch (error) {
      console.error('Failed to cleanup expired cooldowns:', error);
      return 0;
    }
  }

  /**
   * קבלת Cooldown ספציפי
   * 
   * @param {string} accountId - מזהה החשבון
   * @param {string} ruleCode - קוד החוק
   * @param {string} sourceKey - Source Key
   * @returns {Promise<Object|null>} Cooldown data או null
   */
  async getCooldown(accountId, ruleCode, sourceKey) {
    try {
      const { data, error } = await supabase
        .from('cooldown_tracker')
        .select('*')
        .eq('ad_account_id', accountId)
        .eq('rule_code', ruleCode)
        .eq('source_key', sourceKey)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error getting cooldown:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to get cooldown:', error);
      return null;
    }
  }
}

module.exports = new CooldownService();
