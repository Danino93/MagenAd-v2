/*
 * A2-ShortWindow.js
 * 
 * חוק A2: Short Window Repeat
 * 
 * מזהה: 5+ קליקים מאותו מקור ב-10 דקות
 * Severity: Medium
 * 
 * Thresholds:
 * - Easy: 6 clicks / 10 minutes
 * - Normal: 5 clicks / 10 minutes
 * - Aggressive: 4 clicks / 10 minutes
 */

const DetectionRule = require('./DetectionRule');
const { groupBySourceKey } = require('../utils/sourceKey');

class A2_ShortWindow extends DetectionRule {
  constructor() {
    super('A2', 'Short Window Repeat', 'medium');
  }

  /**
   * זיהוי Short Window Repeat
   * 
   * @param {Object} account - חשבון Google Ads
   * @param {number} timeWindow - חלון זמן בדקות (ברירת מחדל: 120)
   * @returns {Promise<Array>} מערך של detections
   */
  async detect(account, timeWindow = 120) {
    try {
      // 1. טען profile
      const profile = await this.getAccountProfile(account.id);
      const preset = profile.preset || 'normal';
      
      // 2. קבל thresholds
      const thresholds = this.getThresholds(preset);
      
      // 3. שלוף קליקים מ-2 שעות אחרונות
      const startTime = new Date(Date.now() - timeWindow * 60 * 1000);
      
      const { data: clicks, error } = await this.supabase
        .from('raw_events')
        .select('*')
        .eq('ad_account_id', account.id)
        .gte('click_timestamp', startTime.toISOString())
        .order('click_timestamp', { ascending: true });

      if (error) {
        console.error(`Error fetching clicks for A2:`, error);
        return [];
      }

      if (!clicks || clicks.length === 0) {
        return [];
      }

      // 4. צור Source Keys
      const clicksWithSourceKey = clicks.map(click => {
        const sourceKey = this.generateSourceKeyFromClick(click);
        return { ...click, source_key: sourceKey };
      });

      // 5. קבץ לפי Source Key
      const grouped = groupBySourceKey(clicksWithSourceKey);

      const detections = [];

      // 6. בדוק כל source
      for (const [sourceKey, sourceClicks] of Object.entries(grouped)) {
        // Sliding window - בדוק כל חלון של 10 דקות
        for (let i = 0; i < sourceClicks.length; i++) {
          const windowStart = new Date(sourceClicks[i].click_timestamp);
          const windowEnd = new Date(windowStart.getTime() + thresholds.window_minutes * 60 * 1000);

          const clicksInWindow = sourceClicks.filter(c => {
            const ts = new Date(c.click_timestamp);
            return ts >= windowStart && ts <= windowEnd;
          });

          if (clicksInWindow.length >= thresholds.clicks) {
            const inCooldown = await this.checkCooldown(account.id, sourceKey);

            if (!inCooldown) {
              const detection = {
                time_window_start: windowStart.toISOString(),
                time_window_end: windowEnd.toISOString(),
                campaign_id: clicksInWindow[0].campaign_id,
                evidence: {
                  source_key: sourceKey,
                  clicks_count: clicksInWindow.length,
                  threshold: thresholds.clicks,
                  window_minutes: thresholds.window_minutes,
                  device_type: clicksInWindow[0].device_type,
                  network: clicksInWindow[0].network,
                  country_code: clicksInWindow[0].country_code,
                  click_timestamps: clicksInWindow.map(c => c.click_timestamp)
                },
                action_decided: 'report',
                severity: 'medium'
              };

              detections.push(detection);

              const cooldownHours = profile.thresholds?.cooldown_hours || 12;
              await this.setCooldown(account.id, sourceKey, cooldownHours);

              break;
            }
          }
        }
      }

      return detections;
    } catch (error) {
      console.error(`Error in A2-ShortWindow detection:`, error);
      return [];
    }
  }

  /**
   * יצירת Source Key מקליק
   */
  generateSourceKeyFromClick(click) {
    const deviceType = (click.device_type || 'UNKNOWN').toUpperCase();
    const network = (click.network || 'UNKNOWN').toUpperCase();
    const countryCode = (click.country_code || click.country || 'UNKNOWN').toUpperCase();
    const campaignId = click.campaign_id || 'UNKNOWN';

    return `${deviceType}::${network}::${countryCode}::${campaignId}`;
  }

  /**
   * קבלת Thresholds לפי Preset
   */
  getThresholds(preset) {
    const thresholds = {
      easy: {
        clicks: 6,
        window_minutes: 10
      },
      normal: {
        clicks: 5,
        window_minutes: 10
      },
      aggressive: {
        clicks: 4,
        window_minutes: 10
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
      return `${evidence.clicks_count} קליקים מאותו מקור תוך ${evidence.window_minutes} דקות - חריגה מהסף (${evidence.threshold})`;
    }
    return super.formatDetectionMessage(detectionData);
  }
}

module.exports = A2_ShortWindow;
