/*
 * B2-CampaignSpike.js
 * 
 * חוק B2: Campaign Spike
 * 
 * מזהה: קפיצה ברמת קמפיין (2.3x מהממוצע)
 * Severity: Medium
 * 
 * Thresholds:
 * - Easy: 2.8x average
 * - Normal: 2.3x average
 * - Aggressive: 2x average
 */

const DetectionRule = require('./DetectionRule');

class B2_CampaignSpike extends DetectionRule {
  constructor() {
    super('B2', 'Campaign Spike', 'medium');
  }

  /**
   * זיהוי Campaign Spike
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
      
      // 3. קבל baseline stats לכל הקמפיינים
      const { data: baselines, error: baselineError } = await this.supabase
        .from('baseline_stats')
        .select('campaign_id, avg_clicks_per_hour')
        .eq('ad_account_id', account.id)
        .not('campaign_id', 'is', null);

      if (baselineError) {
        console.error('Error getting campaign baselines:', baselineError);
        return [];
      }

      if (!baselines || baselines.length === 0) {
        return [];
      }

      // 4. ספור קליקים בשעה האחרונה לכל קמפיין
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const { data: recentClicks, error } = await this.supabase
        .from('raw_events')
        .select('campaign_id')
        .eq('ad_account_id', account.id)
        .gte('click_timestamp', oneHourAgo.toISOString());

      if (error) {
        console.error(`Error fetching clicks for B2:`, error);
        return [];
      }

      // 5. קבץ לפי campaign_id
      const clicksByCampaign = {};
      for (const click of recentClicks || []) {
        const campaignId = click.campaign_id;
        clicksByCampaign[campaignId] = (clicksByCampaign[campaignId] || 0) + 1;
      }

      const detections = [];

      // 6. בדוק כל קמפיין
      for (const baseline of baselines) {
        const campaignId = baseline.campaign_id;
        const currentClicks = clicksByCampaign[campaignId] || 0;
        const threshold = baseline.avg_clicks_per_hour * multiplier;

        if (currentClicks >= threshold) {
          const sourceKey = `campaign_${campaignId}`;
          const inCooldown = await this.checkCooldown(account.id, sourceKey);

          if (!inCooldown) {
            const detection = {
              time_window_start: oneHourAgo.toISOString(),
              time_window_end: new Date().toISOString(),
              campaign_id: campaignId,
              evidence: {
                campaign_id: campaignId,
                current_clicks: currentClicks,
                baseline_avg: baseline.avg_clicks_per_hour,
                multiplier: multiplier,
                threshold: threshold,
                spike_ratio: (currentClicks / baseline.avg_clicks_per_hour).toFixed(2)
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
      console.error(`Error in B2-CampaignSpike detection:`, error);
      return [];
    }
  }

  /**
   * קבלת Multiplier לפי Preset
   */
  getMultiplier(preset) {
    const multipliers = {
      easy: 2.8,
      normal: 2.3,
      aggressive: 2.0
    };

    return multipliers[preset] || multipliers.normal;
  }

  /**
   * עיצוב הודעת Detection
   */
  formatDetectionMessage(detectionData) {
    const { evidence } = detectionData;
    if (evidence) {
      return `קפיצה בקמפיין ${evidence.campaign_id}: ${evidence.current_clicks} קליקים בשעה (${evidence.spike_ratio}x מהממוצע)`;
    }
    return super.formatDetectionMessage(detectionData);
  }
}

module.exports = B2_CampaignSpike;
