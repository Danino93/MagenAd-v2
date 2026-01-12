/*
 * E2-SuspiciousScore.js
 * 
 * חוק E2: Suspicious Score
 * 
 * מזהה: ניקוד חריגות גבוה (80+) מצירוף של מספר חוקים
 * Severity: High
 * 
 * Thresholds:
 * - Easy: 90+ score
 * - Normal: 80+ score
 * - Aggressive: 70+ score
 */

const DetectionRule = require('./DetectionRule');

class E2_SuspiciousScore extends DetectionRule {
  constructor() {
    super('E2', 'Suspicious Score', 'high');
  }

  /**
   * זיהוי Suspicious Score
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
      
      // 2. קבל threshold
      const threshold = this.getThreshold(preset);
      
      // 3. שלוף detections משעה אחרונה
      const startTime = new Date(Date.now() - timeWindow * 60 * 1000);
      
      const { data: recentDetections, error } = await this.supabase
        .from('detections')
        .select('*')
        .eq('ad_account_id', account.id)
        .gte('created_at', startTime.toISOString())
        .eq('action_status', 'pending');

      if (error) {
        console.error(`Error fetching detections for E2:`, error);
        return [];
      }

      if (!recentDetections || recentDetections.length === 0) {
        return [];
      }

      // 4. קבץ לפי source_key
      const detectionsBySource = {};

      for (const detection of recentDetections) {
        const evidence = detection.evidence || {};
        const sourceKey = evidence.source_key || detection.campaign_id || 'unknown';

        if (!detectionsBySource[sourceKey]) {
          detectionsBySource[sourceKey] = [];
        }

        detectionsBySource[sourceKey].push(detection);
      }

      const suspiciousDetections = [];

      // 5. חשב suspicious score לכל source
      for (const [sourceKey, detections] of Object.entries(detectionsBySource)) {
        const score = this.calculateSuspiciousScore(detections);

        if (score >= threshold) {
          const inCooldown = await this.checkCooldown(account.id, sourceKey);

          if (!inCooldown) {
            const sortedDetections = detections.sort((a, b) => 
              new Date(a.created_at) - new Date(b.created_at)
            );

            const detection = {
              time_window_start: sortedDetections[0].time_window_start || sortedDetections[0].created_at,
              time_window_end: sortedDetections[sortedDetections.length - 1].time_window_end || sortedDetections[sortedDetections.length - 1].created_at,
              campaign_id: sortedDetections[0].campaign_id,
              evidence: {
                source_key: sourceKey,
                suspicious_score: score,
                threshold: threshold,
                detection_count: detections.length,
                detections: detections.map(d => ({
                  rule_id: d.rule_id,
                  rule_name: d.rule_name,
                  severity: d.severity
                })),
                score_breakdown: this.getScoreBreakdown(detections)
              },
              action_decided: 'report',
              severity: 'high'
            };

            suspiciousDetections.push(detection);

            const cooldownHours = profile.thresholds?.cooldown_hours || 12;
            await this.setCooldown(account.id, sourceKey, cooldownHours);
          }
        }
      }

      return suspiciousDetections;
    } catch (error) {
      console.error(`Error in E2-SuspiciousScore detection:`, error);
      return [];
    }
  }

  /**
   * חישוב Suspicious Score
   * 
   * @param {Array} detections - מערך של detections
   * @returns {number} Score (0-100)
   */
  calculateSuspiciousScore(detections) {
    let score = 0;

    // משקלים לפי severity
    const severityWeights = {
      high: 40,
      medium: 25,
      low: 15
    };

    // משקלים לפי סוג חוק
    const ruleWeights = {
      'A1': 30, // Rapid Repeat
      'A2': 20, // Short Window
      'A3': 15, // Daily Repeat
      'B1': 25, // Account Spike
      'B2': 25, // Campaign Spike
      'B3': 35, // Micro-Burst
      'C1': 10, // Off-Hours
      'C2': 40, // Night Burst
      'D1': 20, // Network Shift
      'E1': 50, // Multi-Rule
      'E2': 0   // Suspicious Score (לא נכלל בחישוב)
    };

    for (const detection of detections) {
      const severityWeight = severityWeights[detection.severity] || 15;
      const ruleWeight = ruleWeights[detection.rule_id] || 20;
      
      // Score = (severity weight + rule weight) / 2
      score += (severityWeight + ruleWeight) / 2;
    }

    // הגבל ל-100
    return Math.min(Math.round(score), 100);
  }

  /**
   * קבלת Score Breakdown
   */
  getScoreBreakdown(detections) {
    const breakdown = {
      high_severity: 0,
      medium_severity: 0,
      low_severity: 0,
      rule_types: {}
    };

    for (const detection of detections) {
      breakdown[`${detection.severity}_severity`]++;
      breakdown.rule_types[detection.rule_id] = (breakdown.rule_types[detection.rule_id] || 0) + 1;
    }

    return breakdown;
  }

  /**
   * קבלת Threshold לפי Preset
   */
  getThreshold(preset) {
    const thresholds = {
      easy: 90,
      normal: 80,
      aggressive: 70
    };

    return thresholds[preset] || thresholds.normal;
  }

  /**
   * עיצוב הודעת Detection
   */
  formatDetectionMessage(detectionData) {
    const { evidence } = detectionData;
    if (evidence) {
      return `ניקוד חריגות גבוה: ${evidence.suspicious_score}/100 (${evidence.detection_count} detections) - רמת ביטחון גבוהה מאוד`;
    }
    return super.formatDetectionMessage(detectionData);
  }
}

module.exports = E2_SuspiciousScore;
