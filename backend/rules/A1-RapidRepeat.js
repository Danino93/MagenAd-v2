/*
 * A1-RapidRepeat.js
 * 
 * חוק A1: Rapid Repeat Clicks
 * 
 * מזהה: אותו מקור לוחץ מהר מדי (3+ קליקים ב-2 דקות)
 * Severity: High
 * 
 * Thresholds:
 * - Easy: 4 clicks / 2 minutes
 * - Normal: 3 clicks / 2 minutes
 * - Aggressive: 2 clicks / 2 minutes
 */

const DetectionRule = require('./DetectionRule');
const { generateSourceKey, groupBySourceKey } = require('../utils/sourceKey');

class A1_RapidRepeat extends DetectionRule {
  constructor() {
    super('A1', 'Rapid Repeat Clicks', 'high');
  }

  /**
   * זיהוי Rapid Repeat Clicks
   * 
   * @param {Object} account - חשבון Google Ads
   * @param {number} timeWindow - חלון זמן בדקות (ברירת מחדל: 60)
   * @returns {Promise<Array>} מערך של detections
   */
  async detect(account, timeWindow = 60) {
    try {
      // 1. טען profile לקבלת thresholds
      const profile = await this.getAccountProfile(account.id);
      const preset = profile.preset || 'normal';
      
      // 2. קבל thresholds לפי preset
      const thresholds = this.getThresholds(preset);
      
      // 3. שלוף קליקים משעה אחרונה
      const startTime = new Date(Date.now() - timeWindow * 60 * 1000);
      
      const { data: clicks, error } = await this.supabase
        .from('raw_events')
        .select('*')
        .eq('ad_account_id', account.id)
        .gte('click_timestamp', startTime.toISOString())
        .order('click_timestamp', { ascending: true });

      if (error) {
        console.error(`Error fetching clicks for A1:`, error);
        return [];
      }

      if (!clicks || clicks.length === 0) {
        return [];
      }

      // 4. צור Source Keys לכל click
      const clicksWithSourceKey = clicks.map(click => {
        // יצירת Source Key מ-device_type, network, country_code, campaign_id
        const sourceKey = this.generateSourceKeyFromClick(click);
        return { ...click, source_key: sourceKey };
      });

      // 5. קבץ לפי Source Key
      const grouped = groupBySourceKey(clicksWithSourceKey);

      const detections = [];

      // 6. בדוק כל source
      for (const [sourceKey, sourceClicks] of Object.entries(grouped)) {
        // Sliding window - בדוק כל חלון של 2 דקות
        for (let i = 0; i < sourceClicks.length; i++) {
          const windowStart = new Date(sourceClicks[i].click_timestamp);
          const windowEnd = new Date(windowStart.getTime() + thresholds.window_minutes * 60 * 1000);

          // ספור קליקים בחלון
          const clicksInWindow = sourceClicks.filter(c => {
            const ts = new Date(c.click_timestamp);
            return ts >= windowStart && ts <= windowEnd;
          });

          // אם עבר את הסף
          if (clicksInWindow.length >= thresholds.clicks) {
            // בדוק cooldown
            const inCooldown = await this.checkCooldown(account.id, sourceKey);

            if (!inCooldown) {
              // צור detection
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
                severity: 'high'
              };

              detections.push(detection);

              // הוסף cooldown
              const cooldownHours = profile.thresholds?.cooldown_hours || 12;
              await this.setCooldown(account.id, sourceKey, cooldownHours);

              break; // מצאנו, עבור ל-source הבא
            }
          }
        }
      }

      return detections;
    } catch (error) {
      console.error(`Error in A1-RapidRepeat detection:`, error);
      return [];
    }
  }

  /**
   * יצירת Source Key מקליק
   * 
   * @param {Object} click - Click object
   * @returns {string} Source Key
   */
  generateSourceKeyFromClick(click) {
    // Source Key = device_type::network::country_code::campaign_id
    const deviceType = (click.device_type || 'UNKNOWN').toUpperCase();
    const network = (click.network || 'UNKNOWN').toUpperCase();
    const countryCode = (click.country_code || click.country || 'UNKNOWN').toUpperCase();
    const campaignId = click.campaign_id || 'UNKNOWN';

    return `${deviceType}::${network}::${countryCode}::${campaignId}`;
  }

  /**
   * קבלת Thresholds לפי Preset
   * 
   * @param {string} preset - 'easy' | 'normal' | 'aggressive'
   * @returns {Object} Thresholds
   */
  getThresholds(preset) {
    const thresholds = {
      easy: {
        clicks: 4,
        window_minutes: 2
      },
      normal: {
        clicks: 3,
        window_minutes: 2
      },
      aggressive: {
        clicks: 2,
        window_minutes: 2
      }
    };

    return thresholds[preset] || thresholds.normal;
  }

  /**
   * עיצוב הודעת Detection (override)
   */
  formatDetectionMessage(detectionData) {
    const { evidence } = detectionData;
    if (evidence) {
      return `${evidence.clicks_count} קליקים מאותו מקור תוך ${evidence.window_minutes} דקות - חריגה מהסף (${evidence.threshold})`;
    }
    return super.formatDetectionMessage(detectionData);
  }
}

module.exports = A1_RapidRepeat;
