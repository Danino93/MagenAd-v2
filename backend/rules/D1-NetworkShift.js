/*
 * D1-NetworkShift.js
 * 
 * חוק D1: Unusual Network Shift
 * 
 * מזהה: שינוי רשת חריג (SEARCH → DISPLAY → VIDEO)
 * Severity: Medium
 * 
 * Thresholds:
 * - Easy: 3+ network changes in 10 minutes
 * - Normal: 2+ network changes in 10 minutes
 * - Aggressive: 2+ network changes in 5 minutes
 */

const DetectionRule = require('./DetectionRule');

class D1_NetworkShift extends DetectionRule {
  constructor() {
    super('D1', 'Unusual Network Shift', 'medium');
  }

  /**
   * זיהוי Unusual Network Shift
   * 
   * @param {Object} account - חשבון Google Ads
   * @param {number} timeWindow - חלון זמן בדקות (ברירת מחדל: 10)
   * @returns {Promise<Array>} מערך של detections
   */
  async detect(account, timeWindow = 10) {
    try {
      // 1. טען profile
      const profile = await this.getAccountProfile(account.id);
      const preset = profile.preset || 'normal';
      
      // 2. קבל thresholds
      const thresholds = this.getThresholds(preset);
      
      // 3. שלוף קליקים מ-10 דקות אחרונות
      const startTime = new Date(Date.now() - timeWindow * 60 * 1000);
      
      const { data: clicks, error } = await this.supabase
        .from('raw_events')
        .select('*')
        .eq('ad_account_id', account.id)
        .gte('click_timestamp', startTime.toISOString())
        .order('click_timestamp', { ascending: true });

      if (error) {
        console.error(`Error fetching clicks for D1:`, error);
        return [];
      }

      if (!clicks || clicks.length === 0) {
        return [];
      }

      // 4. קבץ לפי Source Key (device::country::campaign)
      const clicksBySource = {};
      for (const click of clicks) {
        const sourceKey = this.generateSourceKeyFromClick(click);
        if (!clicksBySource[sourceKey]) {
          clicksBySource[sourceKey] = [];
        }
        clicksBySource[sourceKey].push(click);
      }

      const detections = [];

      // 5. בדוק כל source
      for (const [sourceKey, sourceClicks] of Object.entries(clicksBySource)) {
        if (sourceClicks.length < 2) {
          continue; // צריך לפחות 2 קליקים
        }

        // 6. בדוק שינויי רשת
        const networks = sourceClicks.map(c => c.network).filter(Boolean);
        const uniqueNetworks = [...new Set(networks)];

        if (uniqueNetworks.length >= thresholds.network_changes) {
          // יש שינוי רשת חריג
          const inCooldown = await this.checkCooldown(account.id, sourceKey);

          if (!inCooldown) {
            const firstClick = sourceClicks[0];
            const lastClick = sourceClicks[sourceClicks.length - 1];

            const detection = {
              time_window_start: new Date(firstClick.click_timestamp).toISOString(),
              time_window_end: new Date(lastClick.click_timestamp).toISOString(),
              campaign_id: firstClick.campaign_id,
              evidence: {
                source_key: sourceKey,
                clicks_count: sourceClicks.length,
                networks: uniqueNetworks,
                network_changes: uniqueNetworks.length,
                threshold: thresholds.network_changes,
                window_minutes: thresholds.window_minutes,
                network_sequence: networks
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
      console.error(`Error in D1-NetworkShift detection:`, error);
      return [];
    }
  }

  /**
   * יצירת Source Key מקליק (ללא network)
   */
  generateSourceKeyFromClick(click) {
    const deviceType = (click.device_type || 'UNKNOWN').toUpperCase();
    const countryCode = (click.country_code || click.country || 'UNKNOWN').toUpperCase();
    const campaignId = click.campaign_id || 'UNKNOWN';

    return `${deviceType}::${countryCode}::${campaignId}`;
  }

  /**
   * קבלת Thresholds לפי Preset
   */
  getThresholds(preset) {
    const thresholds = {
      easy: {
        network_changes: 3,
        window_minutes: 10
      },
      normal: {
        network_changes: 2,
        window_minutes: 10
      },
      aggressive: {
        network_changes: 2,
        window_minutes: 5
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
      return `שינוי רשת חריג: ${evidence.network_changes} רשתות שונות תוך ${evidence.window_minutes} דקות (${evidence.networks.join(', ')})`;
    }
    return super.formatDetectionMessage(detectionData);
  }
}

module.exports = D1_NetworkShift;
