/*
 * B3-MicroBurst.js
 * 
 * חוק B3: Micro-Burst
 * 
 * מזהה: 12+ קליקים ב-2 דקות (account-wide)
 * Severity: High
 * 
 * Thresholds:
 * - Easy: 15 clicks / 2 minutes
 * - Normal: 12 clicks / 2 minutes
 * - Aggressive: 10 clicks / 2 minutes
 */

const DetectionRule = require('./DetectionRule');

class B3_MicroBurst extends DetectionRule {
  constructor() {
    super('B3', 'Micro-Burst', 'high');
  }

  /**
   * זיהוי Micro-Burst
   * 
   * @param {Object} account - חשבון Google Ads
   * @param {number} timeWindow - חלון זמן בדקות (ברירת מחדל: 5)
   * @returns {Promise<Array>} מערך של detections
   */
  async detect(account, timeWindow = 5) {
    try {
      // 1. טען profile
      const profile = await this.getAccountProfile(account.id);
      const preset = profile.preset || 'normal';
      
      // 2. קבל thresholds
      const thresholds = this.getThresholds(preset);
      
      // 3. שלוף קליקים מ-5 דקות אחרונות
      const startTime = new Date(Date.now() - timeWindow * 60 * 1000);
      
      const { data: clicks, error } = await this.supabase
        .from('raw_events')
        .select('*')
        .eq('ad_account_id', account.id)
        .gte('click_timestamp', startTime.toISOString())
        .order('click_timestamp', { ascending: true });

      if (error) {
        console.error(`Error fetching clicks for B3:`, error);
        return [];
      }

      if (!clicks || clicks.length === 0) {
        return [];
      }

      const detections = [];

      // 4. Sliding window - בדוק כל חלון של 2 דקות
      for (let i = 0; i < clicks.length; i++) {
        const windowStart = new Date(clicks[i].click_timestamp);
        const windowEnd = new Date(windowStart.getTime() + thresholds.window_minutes * 60 * 1000);

        const clicksInWindow = clicks.filter(c => {
          const ts = new Date(c.click_timestamp);
          return ts >= windowStart && ts <= windowEnd;
        });

        if (clicksInWindow.length >= thresholds.clicks) {
          const sourceKey = `micro_burst_${windowStart.toISOString()}`;
          const inCooldown = await this.checkCooldown(account.id, sourceKey);

          if (!inCooldown) {
            // קבל breakdown לפי campaign
            const campaignBreakdown = {};
            for (const click of clicksInWindow) {
              const campaignId = click.campaign_id || 'unknown';
              campaignBreakdown[campaignId] = (campaignBreakdown[campaignId] || 0) + 1;
            }

            const detection = {
              time_window_start: windowStart.toISOString(),
              time_window_end: windowEnd.toISOString(),
              campaign_id: null, // Account-wide
              evidence: {
                clicks_count: clicksInWindow.length,
                threshold: thresholds.clicks,
                window_minutes: thresholds.window_minutes,
                campaign_breakdown: campaignBreakdown,
                click_timestamps: clicksInWindow.map(c => c.click_timestamp)
              },
              action_decided: 'report',
              severity: 'high'
            };

            detections.push(detection);

            const cooldownHours = profile.thresholds?.cooldown_hours || 12;
            await this.setCooldown(account.id, sourceKey, cooldownHours);

            break; // מצאנו burst, עבור הלאה
          }
        }
      }

      return detections;
    } catch (error) {
      console.error(`Error in B3-MicroBurst detection:`, error);
      return [];
    }
  }

  /**
   * קבלת Thresholds לפי Preset
   */
  getThresholds(preset) {
    const thresholds = {
      easy: {
        clicks: 15,
        window_minutes: 2
      },
      normal: {
        clicks: 12,
        window_minutes: 2
      },
      aggressive: {
        clicks: 10,
        window_minutes: 2
      }
    };

    return thresholds[preset] || thresholds.normal;
  }

  /**
   * עיצוב הודעת Detection
   */
  formatDetectionMessage(detectionData) {
    const { evidence } = detectionData;
    if (evidence) {
      return `Micro-Burst: ${evidence.clicks_count} קליקים תוך ${evidence.window_minutes} דקות - התקפה חשודה`;
    }
    return super.formatDetectionMessage(detectionData);
  }
}

module.exports = B3_MicroBurst;
