/*
 * A3-DailyRepeat.js
 * 
 * חוק A3: Daily Repeat Source
 * 
 * מזהה: 8+ קליקים מאותו מקור ב-24 שעות
 * Severity: Medium
 * 
 * Thresholds:
 * - Easy: 10 clicks / 24 hours
 * - Normal: 8 clicks / 24 hours
 * - Aggressive: 6 clicks / 24 hours
 */

const DetectionRule = require('./DetectionRule');
const { groupBySourceKey } = require('../utils/sourceKey');

class A3_DailyRepeat extends DetectionRule {
  constructor() {
    super('A3', 'Daily Repeat Source', 'medium');
  }

  /**
   * זיהוי Daily Repeat Source
   * 
   * @param {Object} account - חשבון Google Ads
   * @param {number} timeWindow - חלון זמן בדקות (ברירת מחדל: 1440 = 24 שעות)
   * @returns {Promise<Array>} מערך של detections
   */
  async detect(account, timeWindow = 1440) {
    try {
      // 1. טען profile
      const profile = await this.getAccountProfile(account.id);
      const preset = profile.preset || 'normal';
      
      // 2. קבל thresholds
      const thresholds = this.getThresholds(preset);
      
      // 3. שלוף קליקים מ-24 שעות אחרונות
      const startTime = new Date(Date.now() - timeWindow * 60 * 1000);
      
      const { data: clicks, error } = await this.supabase
        .from('raw_events')
        .select('*')
        .eq('ad_account_id', account.id)
        .gte('click_timestamp', startTime.toISOString())
        .order('click_timestamp', { ascending: true });

      if (error) {
        console.error(`Error fetching clicks for A3:`, error);
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
        // בדוק אם יש מספיק קליקים ב-24 שעות
        if (sourceClicks.length >= thresholds.clicks) {
          const inCooldown = await this.checkCooldown(account.id, sourceKey);

          if (!inCooldown) {
            // חלון זמן = מהיום הראשון עד האחרון
            const firstClick = sourceClicks[0];
            const lastClick = sourceClicks[sourceClicks.length - 1];
            const windowStart = new Date(firstClick.click_timestamp);
            const windowEnd = new Date(lastClick.click_timestamp);

            const detection = {
              time_window_start: windowStart.toISOString(),
              time_window_end: windowEnd.toISOString(),
              campaign_id: sourceClicks[0].campaign_id,
              evidence: {
                source_key: sourceKey,
                clicks_count: sourceClicks.length,
                threshold: thresholds.clicks,
                window_hours: 24,
                device_type: sourceClicks[0].device_type,
                network: sourceClicks[0].network,
                country_code: sourceClicks[0].country_code,
                first_click: firstClick.click_timestamp,
                last_click: lastClick.click_timestamp
              },
              action_decided: 'report',
              severity: 'medium'
            };

            detections.push(detection);

            const cooldownHours = profile.thresholds?.cooldown_hours || 12;
            await this.setCooldown(account.id, sourceKey, cooldownHours);
          }
        }
      }

      return detections;
    } catch (error) {
      console.error(`Error in A3-DailyRepeat detection:`, error);
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
        clicks: 10,
        window_hours: 24
      },
      normal: {
        clicks: 8,
        window_hours: 24
      },
      aggressive: {
        clicks: 6,
        window_hours: 24
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
      return `${evidence.clicks_count} קליקים מאותו מקור ב-24 שעות - חריגה מהסף (${evidence.threshold})`;
    }
    return super.formatDetectionMessage(detectionData);
  }
}

module.exports = A3_DailyRepeat;
