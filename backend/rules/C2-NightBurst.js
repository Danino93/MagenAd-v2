/*
 * C2-NightBurst.js
 * 
 * חוק C2: Night Micro-Burst
 * 
 * מזהה: B3 + לילה (00:00-06:00)
 * Severity: High
 * 
 * Thresholds:
 * - Easy: 15 clicks / 2 minutes (night)
 * - Normal: 12 clicks / 2 minutes (night)
 * - Aggressive: 10 clicks / 2 minutes (night)
 */

const DetectionRule = require('./DetectionRule');
const B3_MicroBurst = require('./B3-MicroBurst');

class C2_NightBurst extends DetectionRule {
  constructor() {
    super('C2', 'Night Micro-Burst', 'high');
    this.b3Rule = new B3_MicroBurst();
  }

  /**
   * זיהוי Night Micro-Burst
   * 
   * @param {Object} account - חשבון Google Ads
   * @param {number} timeWindow - חלון זמן בדקות (ברירת מחדל: 5)
   * @returns {Promise<Array>} מערך של detections
   */
  async detect(account, timeWindow = 5) {
    try {
      // 1. הרץ B3 detection
      const b3Detections = await this.b3Rule.detect(account, timeWindow);

      if (!b3Detections || b3Detections.length === 0) {
        return [];
      }

      // 2. בדוק אם ה-Burst קרה בלילה
      const nightDetections = [];

      for (const detection of b3Detections) {
        const windowStart = new Date(detection.time_window_start);
        const hour = windowStart.getHours();

        // לילה = 00:00-06:00
        if (hour >= 0 && hour < 6) {
          // זה Night Burst!
          const nightDetection = {
            ...detection,
            rule_id: 'C2',
            rule_name: 'Night Micro-Burst',
            severity: 'high',
            evidence: {
              ...detection.evidence,
              is_night: true,
              hour: hour,
              original_rule: 'B3'
            }
          };

          nightDetections.push(nightDetection);
        }
      }

      // 3. אם יש Night Burst, בדוק cooldown
      if (nightDetections.length > 0) {
        const profile = await this.getAccountProfile(account.id);
        const sourceKey = `night_burst_${new Date().toISOString().split('T')[0]}`;
        const inCooldown = await this.checkCooldown(account.id, sourceKey);

        if (!inCooldown) {
          const cooldownHours = profile.thresholds?.cooldown_hours || 12;
          await this.setCooldown(account.id, sourceKey, cooldownHours);

          return nightDetections;
        }
      }

      return [];
    } catch (error) {
      console.error(`Error in C2-NightBurst detection:`, error);
      return [];
    }
  }

  /**
   * עיצוב הודעת Detection
   */
  formatDetectionMessage(detectionData) {
    const { evidence } = detectionData;
    if (evidence) {
      return `Night Micro-Burst: ${evidence.clicks_count} קליקים תוך ${evidence.window_minutes} דקות בשעות הלילה (${evidence.hour}:00) - התקפה חשודה מאוד`;
    }
    return super.formatDetectionMessage(detectionData);
  }
}

module.exports = C2_NightBurst;
