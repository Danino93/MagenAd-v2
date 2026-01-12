/*
 * B1-AccountSpike.js
 * 
 * חוק B1: Account Spike
 * 
 * מזהה: קפיצה ברמת החשבון (2x מהממוצע)
 * Severity: Medium
 * 
 * Thresholds:
 * - Easy: 2.5x average
 * - Normal: 2x average
 * - Aggressive: 1.5x average
 */

const DetectionRule = require('./DetectionRule');

class B1_AccountSpike extends DetectionRule {
  constructor() {
    super('B1', 'Account Spike', 'medium');
  }

  /**
   * זיהוי Account Spike
   * 
   * @param {Object} account - חשבון Google Ads
   * @param {number} timeWindow - חלון זמן בדקות (ברירת מחדל: 60)
   * @returns {Promise<Array>} מערך של detections
   */
  async detect(account, timeWindow = 60) {
    try {
      // 1. טען profile
      const profile = await this.getAccountProfile(account.id);
      const preset = profile.preset || 'normal';
      
      // 2. קבל threshold multiplier
      const multiplier = this.getMultiplier(preset);
      
      // 3. קבל baseline stats
      const baseline = await this.getBaselineStats(account.id);
      
      if (!baseline || !baseline.avg_clicks_per_hour) {
        // אין baseline - לא ניתן לזהות spike
        return [];
      }

      // 4. ספור קליקים בשעה האחרונה
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const { data: recentClicks, error } = await this.supabase
        .from('raw_events')
        .select('id, click_timestamp')
        .eq('ad_account_id', account.id)
        .gte('click_timestamp', oneHourAgo.toISOString());

      if (error) {
        console.error(`Error fetching clicks for B1:`, error);
        return [];
      }

      const currentClicks = recentClicks?.length || 0;
      const threshold = baseline.avg_clicks_per_hour * multiplier;

      // 5. בדוק אם יש spike
      if (currentClicks >= threshold) {
        const inCooldown = await this.checkCooldown(account.id, 'account_spike');

        if (!inCooldown) {
          const detection = {
            time_window_start: oneHourAgo.toISOString(),
            time_window_end: new Date().toISOString(),
            campaign_id: null, // Account-level
            evidence: {
              current_clicks: currentClicks,
              baseline_avg: baseline.avg_clicks_per_hour,
              multiplier: multiplier,
              threshold: threshold,
              spike_ratio: (currentClicks / baseline.avg_clicks_per_hour).toFixed(2)
            },
            action_decided: 'report',
            severity: 'medium'
          };

          const cooldownHours = profile.thresholds?.cooldown_hours || 12;
          await this.setCooldown(account.id, 'account_spike', cooldownHours);

          return [detection];
        }
      }

      return [];
    } catch (error) {
      console.error(`Error in B1-AccountSpike detection:`, error);
      return [];
    }
  }

  /**
   * קבלת Baseline Stats
   */
  async getBaselineStats(accountId) {
    try {
      const { data, error } = await this.supabase
        .from('baseline_stats')
        .select('avg_clicks_per_hour, std_clicks_per_hour')
        .eq('ad_account_id', accountId)
        .is('campaign_id', null) // Account-level baseline
        .order('calculated_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error getting baseline stats:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to get baseline stats:', error);
      return null;
    }
  }

  /**
   * קבלת Multiplier לפי Preset
   */
  getMultiplier(preset) {
    const multipliers = {
      easy: 2.5,
      normal: 2.0,
      aggressive: 1.5
    };

    return multipliers[preset] || multipliers.normal;
  }

  /**
   * עיצוב הודעת Detection
   */
  formatDetectionMessage(detectionData) {
    const { evidence } = detectionData;
    if (evidence) {
      return `קפיצה ברמת החשבון: ${evidence.current_clicks} קליקים בשעה (${evidence.spike_ratio}x מהממוצע)`;
    }
    return super.formatDetectionMessage(detectionData);
  }
}

module.exports = B1_AccountSpike;
