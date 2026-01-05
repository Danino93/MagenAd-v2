/*
 * QuietIndexService.js
 * 
 * Quiet Index™ - ציון איכות clicks (0-100)
 * 
 * Algorithm:
 * 1. מושך את כל ה-clicks מתקופה מסוימת
 * 2. מריץ Detection Engine על כל click
 * 3. מחשב average fraud score
 * 4. QI = 100 - average fraud score
 * 
 * Scoring:
 * 80-100 = Excellent (ירוק)
 * 60-79 = Good (צהוב בהיר)
 * 40-59 = Warning (צהוב)
 * 20-39 = Poor (כתום)
 * 0-19 = Critical (אדום)
 */

const supabase = require('../config/supabase');
const detectionEngine = require('./DetectionEngine');
const clicksService = require('./ClicksService');

class QuietIndexService {
  /**
   * Calculate Quiet Index for an account
   */
  async calculateQI(accountId, options = {}) {
    try {
      const {
        days = 7,
        preset = 'balanced',
        useCache = true
      } = options;

      // Get all clicks for the period
      const clicks = await clicksService.getClicksFromDB(accountId, { days, limit: 1000 });

      if (!clicks || clicks.length === 0) {
        return {
          qi: 100,
          level: 'excellent',
          totalClicks: 0,
          cleanClicks: 0,
          fraudClicks: 0,
          avgFraudScore: 0,
          breakdown: {},
          message: 'אין clicks להערכה'
        };
      }

      // Run detection on each click
      const fraudScores = [];
      const detectionBreakdown = {};
      let fraudClicksCount = 0;

      for (const click of clicks) {
        const detection = await detectionEngine.detectFraud(click, accountId, preset);
        
        fraudScores.push(detection.fraudScore);
        
        if (detection.isFraud) {
          fraudClicksCount++;
          
          // Count detection types
          detection.detections.forEach(det => {
            detectionBreakdown[det.rule_name] = (detectionBreakdown[det.rule_name] || 0) + 1;
          });
        }
      }

      // Calculate average fraud score
      const avgFraudScore = fraudScores.reduce((a, b) => a + b, 0) / fraudScores.length;

      // Calculate QI
      const qi = Math.round(100 - avgFraudScore);

      // Determine level and color
      const level = this.getQILevel(qi);
      const color = this.getQIColor(qi);

      // Calculate percentages
      const cleanClicks = clicks.length - fraudClicksCount;
      const fraudPercentage = ((fraudClicksCount / clicks.length) * 100).toFixed(1);

      // Save to database
      await this.saveQIRecord(accountId, {
        qi_score: qi,
        total_clicks: clicks.length,
        fraud_clicks: fraudClicksCount,
        clean_clicks: cleanClicks,
        avg_fraud_score: avgFraudScore,
        detection_breakdown: detectionBreakdown,
        calculated_at: new Date().toISOString()
      });

      return {
        qi,
        level,
        color,
        totalClicks: clicks.length,
        cleanClicks,
        fraudClicks: fraudClicksCount,
        fraudPercentage,
        avgFraudScore: avgFraudScore.toFixed(2),
        breakdown: detectionBreakdown,
        message: this.getQIMessage(qi),
        trend: await this.getQITrend(accountId, qi)
      };
    } catch (error) {
      console.error('Error calculating QI:', error);
      throw error;
    }
  }

  /**
   * Get QI level based on score
   */
  getQILevel(qi) {
    if (qi >= 80) return 'excellent';
    if (qi >= 60) return 'good';
    if (qi >= 40) return 'warning';
    if (qi >= 20) return 'poor';
    return 'critical';
  }

  /**
   * Get QI color based on score
   */
  getQIColor(qi) {
    if (qi >= 80) return '#10b981'; // green
    if (qi >= 60) return '#84cc16'; // lime
    if (qi >= 40) return '#eab308'; // yellow
    if (qi >= 20) return '#f97316'; // orange
    return '#ef4444'; // red
  }

  /**
   * Get QI message based on score
   */
  getQIMessage(qi) {
    if (qi >= 80) return '🟢 מעולה! הקמפיין שלך נקי ושקט';
    if (qi >= 60) return '🟡 טוב! יש מעט רעש אבל הכל תחת שליטה';
    if (qi >= 40) return '🟠 אזהרה! יש רעש משמעותי, מומלץ לבדוק';
    if (qi >= 20) return '🔴 בעייתי! רמת הונאה גבוהה, נדרש טיפול';
    return '🚨 קריטי! התקפה פעילה, פעל מיידית!';
  }

  /**
   * Get QI trend (up, down, stable)
   */
  async getQITrend(accountId, currentQI) {
    try {
      // Get previous QI from database
      const { data: previousRecords } = await supabase
        .from('quiet_index_history')
        .select('qi_score')
        .eq('ad_account_id', accountId)
        .order('calculated_at', { ascending: false })
        .limit(2);

      if (!previousRecords || previousRecords.length < 2) {
        return { direction: 'stable', change: 0 };
      }

      const previousQI = previousRecords[1].qi_score;
      const change = currentQI - previousQI;

      let direction = 'stable';
      if (change > 5) direction = 'up';
      if (change < -5) direction = 'down';

      return { direction, change: Math.abs(change) };
    } catch (error) {
      console.error('Error getting QI trend:', error);
      return { direction: 'stable', change: 0 };
    }
  }

  /**
   * Save QI record to database
   */
  async saveQIRecord(accountId, record) {
    try {
      const { data, error } = await supabase
        .from('quiet_index_history')
        .insert({
          ad_account_id: accountId,
          ...record
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving QI record:', error);
      throw error;
    }
  }

  /**
   * Get QI history for an account
   */
  async getQIHistory(accountId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('quiet_index_history')
        .select('*')
        .eq('ad_account_id', accountId)
        .gte('calculated_at', startDate.toISOString())
        .order('calculated_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting QI history:', error);
      throw error;
    }
  }

  /**
   * Get current QI (most recent)
   */
  async getCurrentQI(accountId) {
    try {
      const { data, error } = await supabase
        .from('quiet_index_history')
        .select('*')
        .eq('ad_account_id', accountId)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        // No QI yet - calculate it
        return await this.calculateQI(accountId);
      }

      // If older than 1 hour - recalculate
      const calculatedAt = new Date(data.calculated_at);
      const now = new Date();
      const hoursSince = (now - calculatedAt) / (1000 * 60 * 60);

      if (hoursSince > 1) {
        return await this.calculateQI(accountId);
      }

      // Return cached QI with additional formatting
      return {
        qi: data.qi_score,
        level: this.getQILevel(data.qi_score),
        color: this.getQIColor(data.qi_score),
        totalClicks: data.total_clicks,
        cleanClicks: data.clean_clicks,
        fraudClicks: data.fraud_clicks,
        fraudPercentage: ((data.fraud_clicks / data.total_clicks) * 100).toFixed(1),
        avgFraudScore: data.avg_fraud_score,
        breakdown: data.detection_breakdown,
        message: this.getQIMessage(data.qi_score),
        calculatedAt: data.calculated_at
      };
    } catch (error) {
      console.error('Error getting current QI:', error);
      throw error;
    }
  }

  /**
   * Get QI comparison between periods
   */
  async compareQI(accountId, period1Days = 7, period2Days = 14) {
    try {
      // Calculate QI for both periods
      const qi1 = await this.calculateQI(accountId, { days: period1Days });
      const qi2 = await this.calculateQI(accountId, { days: period2Days });

      const change = qi1.qi - qi2.qi;
      const percentChange = ((change / qi2.qi) * 100).toFixed(1);

      return {
        current: qi1,
        previous: qi2,
        change,
        percentChange,
        improved: change > 0
      };
    } catch (error) {
      console.error('Error comparing QI:', error);
      throw error;
    }
  }
}

module.exports = new QuietIndexService();