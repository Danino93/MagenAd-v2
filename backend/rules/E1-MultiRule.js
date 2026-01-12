/*
 * E1-MultiRule.js
 * 
 * חוק E1: Multi-Rule Confirmation
 * 
 * מזהה: 2+ חוקים הופעלו במקביל על אותו source
 * Severity: High
 * 
 * Thresholds:
 * - Easy: 3+ rules simultaneously
 * - Normal: 2+ rules simultaneously
 * - Aggressive: 2+ rules simultaneously
 */

const DetectionRule = require('./DetectionRule');

class E1_MultiRule extends DetectionRule {
  constructor() {
    super('E1', 'Multi-Rule Confirmation', 'high');
  }

  /**
   * זיהוי Multi-Rule Confirmation
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
        .eq('action_status', 'pending'); // רק detections שלא טופלו

      if (error) {
        console.error(`Error fetching detections for E1:`, error);
        return [];
      }

      if (!recentDetections || recentDetections.length === 0) {
        return [];
      }

      // 4. קבץ לפי source_key (מ-evidence)
      const detectionsBySource = {};

      for (const detection of recentDetections) {
        const evidence = detection.evidence || {};
        const sourceKey = evidence.source_key || detection.campaign_id || 'unknown';

        if (!detectionsBySource[sourceKey]) {
          detectionsBySource[sourceKey] = [];
        }

        detectionsBySource[sourceKey].push(detection);
      }

      const multiRuleDetections = [];

      // 5. בדוק כל source
      for (const [sourceKey, detections] of Object.entries(detectionsBySource)) {
        // קבל unique rule IDs
        const ruleIds = [...new Set(detections.map(d => d.rule_id))];

        if (ruleIds.length >= threshold) {
          // יש 2+ חוקים שונים!
          const inCooldown = await this.checkCooldown(account.id, sourceKey);

          if (!inCooldown) {
            // מצא את ה-detection הראשון והאחרון
            const sortedDetections = detections.sort((a, b) => 
              new Date(a.created_at) - new Date(b.created_at)
            );

            const detection = {
              time_window_start: sortedDetections[0].time_window_start || sortedDetections[0].created_at,
              time_window_end: sortedDetections[sortedDetections.length - 1].time_window_end || sortedDetections[sortedDetections.length - 1].created_at,
              campaign_id: sortedDetections[0].campaign_id,
              evidence: {
                source_key: sourceKey,
                rule_ids: ruleIds,
                rule_count: ruleIds.length,
                threshold: threshold,
                detection_ids: detections.map(d => d.id),
                rules: ruleIds.map(ruleId => {
                  const ruleDetections = detections.filter(d => d.rule_id === ruleId);
                  return {
                    rule_id: ruleId,
                    rule_name: ruleDetections[0].rule_name,
                    count: ruleDetections.length,
                    severity: ruleDetections[0].severity
                  };
                })
              },
              action_decided: 'report',
              severity: 'high'
            };

            multiRuleDetections.push(detection);

            const cooldownHours = profile.thresholds?.cooldown_hours || 12;
            await this.setCooldown(account.id, sourceKey, cooldownHours);
          }
        }
      }

      return multiRuleDetections;
    } catch (error) {
      console.error(`Error in E1-MultiRule detection:`, error);
      return [];
    }
  }

  /**
   * קבלת Threshold לפי Preset
   */
  getThreshold(preset) {
    const thresholds = {
      easy: 3,
      normal: 2,
      aggressive: 2
    };

    return thresholds[preset] || thresholds.normal;
  }

  /**
   * עיצוב הודעת Detection
   */
  formatDetectionMessage(detectionData) {
    const { evidence } = detectionData;
    if (evidence) {
      const ruleNames = evidence.rules.map(r => r.rule_name).join(', ');
      return `אישור מרובה: ${evidence.rule_count} חוקים הופעלו במקביל (${ruleNames}) - רמת ביטחון גבוהה`;
    }
    return super.formatDetectionMessage(detectionData);
  }
}

module.exports = E1_MultiRule;
