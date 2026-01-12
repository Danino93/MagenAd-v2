/*
 * C1-OffHours.js
 * 
 * חוק C1: Off-Hours Activity
 * 
 * מזהה: 30%+ קליקים מחוץ לשעות העסק
 * Severity: Low→Medium
 * 
 * Thresholds:
 * - Easy: 40% off-hours
 * - Normal: 30% off-hours
 * - Aggressive: 20% off-hours
 */

const DetectionRule = require('./DetectionRule');

class C1_OffHours extends DetectionRule {
  constructor() {
    super('C1', 'Off-Hours Activity', 'low');
  }

  /**
   * זיהוי Off-Hours Activity
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
      
      // 2. בדוק אם business hours מופעל
      if (!profile.business_hours || !profile.business_hours.enabled) {
        return []; // אין business hours מוגדרים
      }

      // 3. קבל threshold
      const threshold = this.getThreshold(preset);
      
      // 4. שלוף קליקים מ-24 שעות אחרונות
      const startTime = new Date(Date.now() - timeWindow * 60 * 1000);
      
      const { data: clicks, error } = await this.supabase
        .from('raw_events')
        .select('click_timestamp')
        .eq('ad_account_id', account.id)
        .gte('click_timestamp', startTime.toISOString());

      if (error) {
        console.error(`Error fetching clicks for C1:`, error);
        return [];
      }

      if (!clicks || clicks.length === 0) {
        return [];
      }

      // 5. ספור קליקים בתוך ומחוץ לשעות העסק
      let offHoursCount = 0;
      const timezone = profile.business_hours.timezone || 'Asia/Jerusalem';

      for (const click of clicks) {
        const clickTime = new Date(click.click_timestamp);
        if (!this.isBusinessHour(clickTime, profile.business_hours, timezone)) {
          offHoursCount++;
        }
      }

      const offHoursPercentage = (offHoursCount / clicks.length) * 100;

      // 6. בדוק אם יש חריגה
      if (offHoursPercentage >= threshold) {
        const sourceKey = `off_hours_${new Date().toISOString().split('T')[0]}`;
        const inCooldown = await this.checkCooldown(account.id, sourceKey);

        if (!inCooldown) {
          const detection = {
            time_window_start: startTime.toISOString(),
            time_window_end: new Date().toISOString(),
            campaign_id: null,
            evidence: {
              total_clicks: clicks.length,
              off_hours_clicks: offHoursCount,
              off_hours_percentage: offHoursPercentage.toFixed(2),
              threshold: threshold,
              business_hours: profile.business_hours
            },
            action_decided: 'report',
            severity: offHoursPercentage >= 50 ? 'medium' : 'low'
          };

          const cooldownHours = profile.thresholds?.cooldown_hours || 12;
          await this.setCooldown(account.id, sourceKey, cooldownHours);

          return [detection];
        }
      }

      return [];
    } catch (error) {
      console.error(`Error in C1-OffHours detection:`, error);
      return [];
    }
  }

  /**
   * בדיקה אם זמן הוא בתוך שעות העסק
   */
  isBusinessHour(date, businessHours, timezone) {
    // Convert to timezone (simplified - should use proper timezone library)
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    const hour = date.getHours();
    const minute = date.getMinutes();
    const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];
    const dayConfig = businessHours.days[dayName];

    if (!dayConfig || !dayConfig.enabled) {
      return false; // יום לא פעיל
    }

    const start = dayConfig.start;
    const end = dayConfig.end;

    return time >= start && time <= end;
  }

  /**
   * קבלת Threshold לפי Preset
   */
  getThreshold(preset) {
    const thresholds = {
      easy: 40,
      normal: 30,
      aggressive: 20
    };

    return thresholds[preset] || thresholds.normal;
  }

  /**
   * עיצוב הודעת Detection
   */
  formatDetectionMessage(detectionData) {
    const { evidence } = detectionData;
    if (evidence) {
      return `${evidence.off_hours_percentage}% מהקליקים מחוץ לשעות העסק (${evidence.off_hours_clicks}/${evidence.total_clicks})`;
    }
    return super.formatDetectionMessage(detectionData);
  }
}

module.exports = C1_OffHours;
