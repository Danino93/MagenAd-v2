/*
 * DetectionRule.js - Base Class for All Detection Rules
 * 
 * כל חוקי הזיהוי יורשים מהקלאס הזה.
 * 
 * תפקידים:
 * - מספק ממשק אחיד לכל החוקים
 * - מטפל ב-Cooldown
 * - שומר detections ל-DB
 * - מחשב severity
 * - מעצב הודעות
 */

const supabase = require('../config/supabase');
const CooldownService = require('../services/CooldownService');

class DetectionRule {
  /**
   * @param {string} ruleId - מזהה החוק (A1, A2, B1, וכו')
   * @param {string} ruleName - שם החוק (Rapid Repeat Clicks, וכו')
   * @param {string} defaultSeverity - חומרה ברירת מחדל ('high' | 'medium' | 'low')
   */
  constructor(ruleId, ruleName, defaultSeverity = 'medium') {
    this.ruleId = ruleId;
    this.ruleName = ruleName;
    this.defaultSeverity = defaultSeverity;
    this.supabase = supabase;
  }

  /**
   * Method שכל חוק חייב לממש
   * 
   * @param {Object} account - חשבון Google Ads
   * @param {number} timeWindow - חלון זמן בדקות (ברירת מחדל: 60)
   * @returns {Promise<Array>} מערך של detections
   */
  async detect(account, timeWindow = 60) {
    throw new Error(`detect() method must be implemented in ${this.ruleId}`);
  }

  /**
   * בדיקה אם יש Cooldown פעיל
   * 
   * @param {string} accountId - מזהה החשבון
   * @param {string} sourceKey - Source Key (או entity אחר)
   * @returns {Promise<boolean>} true אם יש cooldown פעיל
   */
  async checkCooldown(accountId, sourceKey) {
    return await CooldownService.checkCooldown(accountId, this.ruleId, sourceKey);
  }

  /**
   * הגדרת Cooldown
   * 
   * @param {string} accountId - מזהה החשבון
   * @param {string} sourceKey - Source Key (או entity אחר)
   * @param {number} hours - מספר שעות cooldown (ברירת מחדל: 12)
   * @returns {Promise<void>}
   */
  async setCooldown(accountId, sourceKey, hours = 12) {
    return await CooldownService.setCooldown(accountId, this.ruleId, sourceKey, hours);
  }

  /**
   * חישוב Severity לפי נתוני Detection
   * 
   * @param {Object} detectionData - נתוני ה-detection
   * @returns {string} 'high' | 'medium' | 'low'
   */
  calculateSeverity(detectionData) {
    // אם יש severity מפורש, השתמש בו
    if (detectionData.severity) {
      return detectionData.severity;
    }

    // אחרת, השתמש ב-default
    return this.defaultSeverity;
  }

  /**
   * עיצוב הודעת Detection למשתמש
   * 
   * @param {Object} detectionData - נתוני ה-detection
   * @returns {string} הודעה בעברית
   */
  formatDetectionMessage(detectionData) {
    const { evidence, clicks_count, threshold, window_minutes } = detectionData;
    
    // הודעה גנרית - כל חוק יכול לדרוס
    if (clicks_count && threshold) {
      return `${clicks_count} קליקים תוך ${window_minutes || 2} דקות - חריגה מהסף (${threshold})`;
    }
    
    return `זוהתה חריגה לפי חוק ${this.ruleId}: ${this.ruleName}`;
  }

  /**
   * שמירת Detection ל-DB
   * 
   * @param {string} accountId - מזהה החשבון
   * @param {Object} detection - נתוני ה-detection
   * @returns {Promise<Object>} Detection שנשמר
   */
  async saveDetection(accountId, detection) {
    try {
      const detectionData = {
        ad_account_id: accountId,
        rule_id: this.ruleId,
        rule_name: this.ruleName,
        severity: this.calculateSeverity(detection),
        time_window_start: detection.time_window_start || new Date().toISOString(),
        time_window_end: detection.time_window_end || new Date().toISOString(),
        campaign_id: detection.campaign_id || null,
        evidence: detection.evidence || {},
        action_decided: detection.action_decided || 'report',
        action_status: 'pending',
        created_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('detections')
        .insert(detectionData)
        .select()
        .single();

      if (error) {
        console.error(`Error saving detection for rule ${this.ruleId}:`, error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`Failed to save detection for rule ${this.ruleId}:`, error);
      throw error;
    }
  }

  /**
   * שמירת מספר Detections בבת אחת
   * 
   * @param {string} accountId - מזהה החשבון
   * @param {Array} detections - מערך של detections
   * @returns {Promise<Array>} מערך של detections שנשמרו
   */
  async saveDetections(accountId, detections) {
    const saved = [];
    
    for (const detection of detections) {
      try {
        const savedDetection = await this.saveDetection(accountId, detection);
        saved.push(savedDetection);
      } catch (error) {
        console.error(`Failed to save detection:`, error);
        // ממשיך עם הבא גם אם אחד נכשל
      }
    }
    
    return saved;
  }

  /**
   * קבלת Profile של החשבון (presets, thresholds, וכו')
   * 
   * @param {string} accountId - מזהה החשבון
   * @returns {Promise<Object>} Profile data
   */
  async getAccountProfile(accountId) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('ad_account_id', accountId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // אם אין profile, החזר default
      if (!data) {
        return this.getDefaultProfile();
      }

      return data;
    } catch (error) {
      console.error(`Error getting profile for account ${accountId}:`, error);
      return this.getDefaultProfile();
    }
  }

  /**
   * Profile ברירת מחדל
   * 
   * @returns {Object} Default profile
   */
  getDefaultProfile() {
    return {
      preset: 'normal',
      thresholds: {
        frequency: {
          rapid_repeat_clicks: 3,
          rapid_repeat_window_minutes: 2,
          short_window_clicks: 5,
          short_window_minutes: 10,
          daily_repeat_clicks: 8
        },
        burst: {
          account_spike_multiplier: 2,
          campaign_spike_multiplier: 2.3,
          micro_burst_clicks: 12,
          micro_burst_minutes: 2
        },
        temporal: {
          off_hours_percentage: 30
        },
        cooldown_hours: 12
      },
      business_hours: {
        enabled: true,
        timezone: 'Asia/Jerusalem',
        days: {
          sunday: { enabled: true, start: '08:00', end: '18:00' },
          monday: { enabled: true, start: '08:00', end: '18:00' },
          tuesday: { enabled: true, start: '08:00', end: '18:00' },
          wednesday: { enabled: true, start: '08:00', end: '18:00' },
          thursday: { enabled: true, start: '08:00', end: '18:00' },
          friday: { enabled: true, start: '08:00', end: '14:00' },
          saturday: { enabled: false }
        }
      }
    };
  }
}

module.exports = DetectionRule;
