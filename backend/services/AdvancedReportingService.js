/*
 * AdvancedReportingService.js - דוחות מתקדמים וBI
 * 
 * מערכת דוחות מתקדמת:
 * - Custom Metrics Builder
 * - Scheduled Reports (Daily/Weekly/Monthly)
 * - Advanced Charts & Visualizations
 * - Export Options (PDF, Excel, CSV)
 * - Comparative Analysis
 * - Trend Forecasting
 */

const supabase = require('../config/supabase');

class AdvancedReportingService {
  /**
   * יצירת דוח מותאם אישית
   */
  async createCustomReport(accountId, config) {
    try {
      const {
        name,
        description,
        metrics = [],
        filters = {},
        schedule = null,
        recipients = []
      } = config;

      // שמירת תצורת דוח
      const { data, error } = await supabase
        .from('custom_reports')
        .insert({
          ad_account_id: accountId,
          name,
          description,
          metrics,
          filters,
          schedule,
          recipients,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ דוח מותאם נוצר:', name);
      return data;
    } catch (error) {
      console.error('שגיאה ביצירת דוח:', error);
      throw error;
    }
  }

  /**
   * חישוב מדדים מותאמים
   */
  async calculateCustomMetrics(accountId, metrics, dateRange) {
    const results = {};

    for (const metric of metrics) {
      try {
        switch (metric.type) {
          case 'total_clicks':
            results[metric.name] = await this.getTotalClicks(accountId, dateRange);
            break;
          case 'fraud_rate':
            results[metric.name] = await this.getFraudRate(accountId, dateRange);
            break;
          case 'cost_per_click':
            results[metric.name] = await this.getCostPerClick(accountId, dateRange);
            break;
          case 'qi_average':
            results[metric.name] = await this.getQIAverage(accountId, dateRange);
            break;
          case 'cost_saved':
            results[metric.name] = await this.getCostSaved(accountId, dateRange);
            break;
          case 'custom':
            results[metric.name] = await this.calculateCustomFormula(
              accountId,
              metric.formula,
              dateRange
            );
            break;
        }
      } catch (error) {
        console.error(`שגיאה בחישוב ${metric.name}:`, error);
        results[metric.name] = null;
      }
    }

    return results;
  }

  /**
   * סה"כ קליקים
   */
  async getTotalClicks(accountId, dateRange) {
    const { startDate, endDate } = dateRange;

    const { count } = await supabase
      .from('raw_events')
      .select('id', { count: 'exact', head: true })
      .eq('ad_account_id', accountId)
      .eq('event_type', 'click')
      .gte('event_timestamp', startDate)
      .lte('event_timestamp', endDate);

    return count || 0;
  }

  /**
   * שיעור הונאות
   */
  async getFraudRate(accountId, dateRange) {
    const totalClicks = await this.getTotalClicks(accountId, dateRange);
    if (totalClicks === 0) return 0;

    const { startDate, endDate } = dateRange;

    const { count: fraudCount } = await supabase
      .from('fraud_detections')
      .select('id', { count: 'exact', head: true })
      .eq('ad_account_id', accountId)
      .gte('detected_at', startDate)
      .lte('detected_at', endDate);

    return ((fraudCount / totalClicks) * 100).toFixed(2);
  }

  /**
   * עלות לקליק
   */
  async getCostPerClick(accountId, dateRange) {
    const { startDate, endDate } = dateRange;

    const { data } = await supabase
      .from('raw_events')
      .select('cost_micros')
      .eq('ad_account_id', accountId)
      .eq('event_type', 'click')
      .gte('event_timestamp', startDate)
      .lte('event_timestamp', endDate);

    if (!data || data.length === 0) return 0;

    const totalCost = data.reduce((sum, c) => sum + (c.cost_micros || 0), 0);
    return ((totalCost / 1000000) / data.length).toFixed(2);
  }

  /**
   * ממוצע Quiet Index
   */
  async getQIAverage(accountId, dateRange) {
    const { startDate, endDate } = dateRange;

    const { data } = await supabase
      .from('quiet_index_history')
      .select('qi_score')
      .eq('ad_account_id', accountId)
      .gte('calculated_at', startDate)
      .lte('calculated_at', endDate);

    if (!data || data.length === 0) return 0;

    const sum = data.reduce((total, item) => total + item.qi_score, 0);
    return (sum / data.length).toFixed(1);
  }

  /**
   * עלות שנחסכה
   */
  async getCostSaved(accountId, dateRange) {
    const { startDate, endDate } = dateRange;

    // קליקים שזוהו כהונאה
    const { data: fraudDetections } = await supabase
      .from('fraud_detections')
      .select('raw_event_id')
      .eq('ad_account_id', accountId)
      .gte('detected_at', startDate)
      .lte('detected_at', endDate);

    if (!fraudDetections || fraudDetections.length === 0) return 0;

    const eventIds = fraudDetections.map(d => d.raw_event_id);

    // סכום עלות הקליקים ההונאתיים
    const { data: fraudClicks } = await supabase
      .from('raw_events')
      .select('cost_micros')
      .in('id', eventIds);

    if (!fraudClicks) return 0;

    const totalSaved = fraudClicks.reduce((sum, c) => sum + (c.cost_micros || 0), 0);
    return (totalSaved / 1000000).toFixed(2);
  }

  /**
   * חישוב נוסחה מותאמת
   */
  async calculateCustomFormula(accountId, formula, dateRange) {
    // נוסחה לדוגמה: "totalClicks * avgCost - fraudCost"
    // כאן ניתן להוסיף מנוע נוסחאות מתקדם
    return 0;
  }

  /**
   * ניתוח השוואתי
   */
  async generateComparativeAnalysis(accountId, period1, period2) {
    const metrics1 = await this.calculateCustomMetrics(accountId, [
      { name: 'clicks', type: 'total_clicks' },
      { name: 'fraudRate', type: 'fraud_rate' },
      { name: 'cpc', type: 'cost_per_click' },
      { name: 'qi', type: 'qi_average' }
    ], period1);

    const metrics2 = await this.calculateCustomMetrics(accountId, [
      { name: 'clicks', type: 'total_clicks' },
      { name: 'fraudRate', type: 'fraud_rate' },
      { name: 'cpc', type: 'cost_per_click' },
      { name: 'qi', type: 'qi_average' }
    ], period2);

    return {
      period1: { ...period1, metrics: metrics1 },
      period2: { ...period2, metrics: metrics2 },
      changes: {
        clicks: this.calculateChange(metrics1.clicks, metrics2.clicks),
        fraudRate: this.calculateChange(metrics1.fraudRate, metrics2.fraudRate),
        cpc: this.calculateChange(metrics1.cpc, metrics2.cpc),
        qi: this.calculateChange(metrics1.qi, metrics2.qi)
      }
    };
  }

  /**
   * חישוב שינוי באחוזים
   */
  calculateChange(oldValue, newValue) {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    const change = ((newValue - oldValue) / oldValue * 100).toFixed(1);
    return {
      value: change,
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
    };
  }

  /**
   * חיזוי מגמות
   */
  async forecastTrends(accountId, metric, days = 30) {
    // שליפת נתונים היסטוריים
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const historicalData = await this.getHistoricalMetric(
      accountId,
      metric,
      { startDate: startDate.toISOString(), endDate: endDate.toISOString() }
    );

    // רגרסיה לינארית פשוטה
    const forecast = this.simpleLinearRegression(historicalData);

    return {
      historical: historicalData,
      forecast: forecast,
      trend: forecast.slope > 0 ? 'increasing' : 'decreasing'
    };
  }

  /**
   * נתונים היסטוריים למדד
   */
  async getHistoricalMetric(accountId, metric, dateRange) {
    const { startDate, endDate } = dateRange;
    const data = [];

    // שליפת נתונים יומיים
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayStart = new Date(d);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      const value = await this.calculateCustomMetrics(
        accountId,
        [{ name: metric, type: metric }],
        {
          startDate: dayStart.toISOString(),
          endDate: dayEnd.toISOString()
        }
      );

      data.push({
        date: d.toISOString().split('T')[0],
        value: parseFloat(value[metric]) || 0
      });
    }

    return data;
  }

  /**
   * רגרסיה לינארית פשוטה
   */
  simpleLinearRegression(data) {
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    data.forEach((point, index) => {
      const x = index;
      const y = point.value;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // חיזוי ל-7 ימים קדימה
    const predictions = [];
    for (let i = 0; i < 7; i++) {
      const x = n + i;
      const y = slope * x + intercept;
      predictions.push({
        day: i + 1,
        predicted: y.toFixed(2)
      });
    }

    return {
      slope: slope.toFixed(4),
      intercept: intercept.toFixed(2),
      predictions
    };
  }

  /**
   * יצוא דוח ל-CSV
   */
  async exportToCSV(accountId, reportData) {
    const lines = [];
    
    // כותרות
    lines.push(Object.keys(reportData[0]).join(','));
    
    // נתונים
    reportData.forEach(row => {
      lines.push(Object.values(row).join(','));
    });

    return lines.join('\n');
  }

  /**
   * תזמון דוח
   */
  async scheduleReport(accountId, reportId, schedule) {
    const { frequency, time, recipients } = schedule;

    await supabase
      .from('scheduled_reports')
      .insert({
        ad_account_id: accountId,
        report_id: reportId,
        frequency, // 'daily', 'weekly', 'monthly'
        scheduled_time: time,
        recipients,
        next_run: this.calculateNextRun(frequency, time),
        status: 'active'
      });

    console.log(`✅ דוח תוזמן: ${frequency} בשעה ${time}`);
  }

  /**
   * חישוב ההרצה הבאה
   */
  calculateNextRun(frequency, time) {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);

    const next = new Date(now);
    next.setHours(hours, minutes, 0, 0);

    if (next <= now) {
      if (frequency === 'daily') {
        next.setDate(next.getDate() + 1);
      } else if (frequency === 'weekly') {
        next.setDate(next.getDate() + 7);
      } else if (frequency === 'monthly') {
        next.setMonth(next.getMonth() + 1);
      }
    }

    return next.toISOString();
  }

  /**
   * הרצת דוחות מתוזמנים
   */
  async runScheduledReports() {
    const now = new Date();

    const { data: dueReports } = await supabase
      .from('scheduled_reports')
      .select('*')
      .eq('status', 'active')
      .lte('next_run', now.toISOString());

    for (const schedule of dueReports || []) {
      try {
        // יצירת הדוח
        await this.generateAndSendReport(schedule);

        // עדכון ההרצה הבאה
        const nextRun = this.calculateNextRun(schedule.frequency, schedule.scheduled_time);
        
        await supabase
          .from('scheduled_reports')
          .update({ next_run: nextRun, last_run: now.toISOString() })
          .eq('id', schedule.id);

        console.log(`✅ דוח מתוזמן הורץ: ${schedule.id}`);
      } catch (error) {
        console.error(`שגיאה בהרצת דוח ${schedule.id}:`, error);
      }
    }
  }

  /**
   * יצירה ושליחת דוח
   */
  async generateAndSendReport(schedule) {
    // כאן תהיה הלוגיקה של יצירת הדוח ושליחתו באימייל
    console.log('יוצר ושולח דוח:', schedule);
  }

  /**
   * dashboard metrics - מדדי מפתח לדשבורד
   */
  async getDashboardMetrics(accountId, dateRange) {
    const metrics = await this.calculateCustomMetrics(accountId, [
      { name: 'totalClicks', type: 'total_clicks' },
      { name: 'fraudRate', type: 'fraud_rate' },
      { name: 'costPerClick', type: 'cost_per_click' },
      { name: 'qiAverage', type: 'qi_average' },
      { name: 'costSaved', type: 'cost_saved' }
    ], dateRange);

    return {
      metrics,
      dateRange,
      generatedAt: new Date().toISOString()
    };
  }
}

module.exports = new AdvancedReportingService();