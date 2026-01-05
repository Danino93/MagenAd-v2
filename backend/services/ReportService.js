/*
 * ReportService.js
 * 
 * Report Generation & Export:
 * - PDF report generation
 * - Weekly/Monthly summaries
 * - Executive dashboards
 * - CSV/JSON export
 * - Custom report builder
 * - Report scheduling
 */

const supabase = require('../config/supabase');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class ReportService {
  /**
   * Generate comprehensive report
   */
  async generateReport(accountId, options = {}) {
    try {
      const {
        period = 'week',
        startDate = null,
        endDate = null,
        format = 'summary'
      } = options;

      // Calculate date range
      const { start, end } = this.getDateRange(period, startDate, endDate);

      // Gather all data
      const data = await this.gatherReportData(accountId, start, end);

      // Generate report based on format
      let report;
      switch (format) {
        case 'executive':
          report = this.generateExecutiveSummary(data);
          break;
        case 'detailed':
          report = this.generateDetailedReport(data);
          break;
        case 'summary':
        default:
          report = this.generateSummaryReport(data);
      }

      // Save to database
      await this.saveReport(accountId, report, period);

      return report;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  /**
   * Get date range
   */
  getDateRange(period, startDate, endDate) {
    const end = endDate ? new Date(endDate) : new Date();
    let start;

    switch (period) {
      case 'day':
        start = new Date(end);
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start = new Date(end);
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start = new Date(end);
        start.setMonth(start.getMonth() - 1);
        break;
      case 'quarter':
        start = new Date(end);
        start.setMonth(start.getMonth() - 3);
        break;
      case 'year':
        start = new Date(end);
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        start = startDate ? new Date(startDate) : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    return { start, end };
  }

  /**
   * Gather all report data
   */
  async gatherReportData(accountId, startDate, endDate) {
    try {
      const [
        clicks,
        detections,
        costs,
        qi,
        alerts,
        blockedIPs
      ] = await Promise.all([
        this.getClicksData(accountId, startDate, endDate),
        this.getDetectionsData(accountId, startDate, endDate),
        this.getCostsData(accountId, startDate, endDate),
        this.getQIData(accountId, startDate, endDate),
        this.getAlertsData(accountId, startDate, endDate),
        this.getBlockedIPsData(accountId, startDate, endDate)
      ]);

      return {
        period: {
          start: startDate,
          end: endDate,
          days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
        },
        clicks,
        detections,
        costs,
        qi,
        alerts,
        blockedIPs
      };
    } catch (error) {
      console.error('Error gathering report data:', error);
      throw error;
    }
  }

  /**
   * Get clicks data
   */
  async getClicksData(accountId, startDate, endDate) {
    const { data, error } = await supabase
      .from('raw_events')
      .select('*')
      .eq('ad_account_id', accountId)
      .eq('event_type', 'click')
      .gte('event_timestamp', startDate.toISOString())
      .lte('event_timestamp', endDate.toISOString());

    if (error) throw error;

    const clicks = data || [];
    
    return {
      total: clicks.length,
      byDevice: this.groupBy(clicks, 'device_type'),
      byCountry: this.groupBy(clicks, 'country_code'),
      byHour: this.groupByHour(clicks),
      avgRisk: clicks.length > 0 
        ? (clicks.reduce((sum, c) => sum + (c.risk_score || 0), 0) / clicks.length).toFixed(1)
        : 0,
      vpnCount: clicks.filter(c => c.is_vpn).length,
      hostingCount: clicks.filter(c => c.is_hosting).length
    };
  }

  /**
   * Get detections data
   */
  async getDetectionsData(accountId, startDate, endDate) {
    const { data, error } = await supabase
      .from('fraud_detections')
      .select('*')
      .eq('ad_account_id', accountId)
      .gte('detected_at', startDate.toISOString())
      .lte('detected_at', endDate.toISOString());

    if (error) throw error;

    const detections = data || [];

    return {
      total: detections.length,
      bySeverity: {
        critical: detections.filter(d => d.severity === 'critical').length,
        high: detections.filter(d => d.severity === 'high').length,
        medium: detections.filter(d => d.severity === 'medium').length,
        low: detections.filter(d => d.severity === 'low').length
      },
      byPattern: this.groupBy(detections, 'pattern_type'),
      avgScore: detections.length > 0
        ? (detections.reduce((sum, d) => sum + d.fraud_score, 0) / detections.length).toFixed(1)
        : 0
    };
  }

  /**
   * Get costs data
   */
  async getCostsData(accountId, startDate, endDate) {
    const { data: clicks } = await supabase
      .from('raw_events')
      .select('cost_micros, is_vpn, is_hosting, risk_score')
      .eq('ad_account_id', accountId)
      .eq('event_type', 'click')
      .gte('event_timestamp', startDate.toISOString())
      .lte('event_timestamp', endDate.toISOString());

    const { data: detections } = await supabase
      .from('fraud_detections')
      .select('event_id')
      .eq('ad_account_id', accountId)
      .gte('detected_at', startDate.toISOString())
      .lte('detected_at', endDate.toISOString());

    const fraudEventIds = new Set(detections?.map(d => d.event_id) || []);

    const totalCost = (clicks || []).reduce((sum, c) => sum + (c.cost_micros || 0), 0) / 1000000;
    const fraudCost = (clicks || [])
      .filter(c => fraudEventIds.has(c.id))
      .reduce((sum, c) => sum + (c.cost_micros || 0), 0) / 1000000;

    return {
      total: totalCost.toFixed(2),
      fraud: fraudCost.toFixed(2),
      clean: (totalCost - fraudCost).toFixed(2),
      saved: fraudCost.toFixed(2),
      wastePercentage: totalCost > 0 ? ((fraudCost / totalCost) * 100).toFixed(1) : 0
    };
  }

  /**
   * Get QI data
   */
  async getQIData(accountId, startDate, endDate) {
    const { data, error } = await supabase
      .from('quiet_index_history')
      .select('*')
      .eq('ad_account_id', accountId)
      .gte('calculated_at', startDate.toISOString())
      .lte('calculated_at', endDate.toISOString())
      .order('calculated_at', { ascending: true });

    if (error) throw error;

    const scores = data || [];

    return {
      current: scores.length > 0 ? scores[scores.length - 1].qi_score : 0,
      average: scores.length > 0
        ? (scores.reduce((sum, s) => sum + s.qi_score, 0) / scores.length).toFixed(1)
        : 0,
      trend: scores.length >= 2
        ? scores[scores.length - 1].qi_score - scores[0].qi_score
        : 0,
      history: scores.map(s => ({
        score: s.qi_score,
        date: s.calculated_at
      }))
    };
  }

  /**
   * Get alerts data
   */
  async getAlertsData(accountId, startDate, endDate) {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('ad_account_id', accountId)
      .gte('triggered_at', startDate.toISOString())
      .lte('triggered_at', endDate.toISOString());

    if (error) throw error;

    const alerts = data || [];

    return {
      total: alerts.length,
      active: alerts.filter(a => a.status === 'active').length,
      resolved: alerts.filter(a => a.status === 'resolved').length,
      bySeverity: {
        critical: alerts.filter(a => a.severity === 'critical').length,
        high: alerts.filter(a => a.severity === 'high').length,
        medium: alerts.filter(a => a.severity === 'medium').length
      },
      byType: this.groupBy(alerts, 'alert_type')
    };
  }

  /**
   * Get blocked IPs data
   */
  async getBlockedIPsData(accountId, startDate, endDate) {
    const { data, error } = await supabase
      .from('ip_blacklist')
      .select('*')
      .eq('ad_account_id', accountId)
      .gte('blocked_at', startDate.toISOString())
      .lte('blocked_at', endDate.toISOString());

    if (error) throw error;

    const blocked = data || [];

    return {
      total: blocked.length,
      manual: blocked.filter(b => b.source === 'manual').length,
      auto: blocked.filter(b => b.source === 'auto').length,
      active: blocked.filter(b => b.status === 'active').length
    };
  }

  /**
   * Generate executive summary
   */
  generateExecutiveSummary(data) {
    return {
      type: 'executive',
      period: data.period,
      summary: {
        totalClicks: data.clicks.total,
        fraudRate: data.detections.total > 0
          ? ((data.detections.total / data.clicks.total) * 100).toFixed(1)
          : 0,
        costSaved: data.costs.saved,
        qiScore: data.qi.current,
        alertsTriggered: data.alerts.total
      },
      highlights: this.generateHighlights(data),
      recommendations: this.generateRecommendations(data),
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Generate summary report
   */
  generateSummaryReport(data) {
    return {
      type: 'summary',
      period: data.period,
      clicks: data.clicks,
      detections: data.detections,
      costs: data.costs,
      qi: data.qi,
      alerts: data.alerts,
      blockedIPs: data.blockedIPs,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Generate detailed report
   */
  generateDetailedReport(data) {
    return {
      type: 'detailed',
      ...this.generateSummaryReport(data),
      details: {
        topThreats: this.getTopThreats(data),
        geographicBreakdown: data.clicks.byCountry,
        deviceBreakdown: data.clicks.byDevice,
        hourlyPatterns: data.clicks.byHour,
        detectionPatterns: data.detections.byPattern
      }
    };
  }

  /**
   * Generate highlights
   */
  generateHighlights(data) {
    const highlights = [];

    if (data.costs.wastePercentage > 20) {
      highlights.push({
        type: 'warning',
        message: `${data.costs.wastePercentage}% מהתקציב הוצא על הונאות`
      });
    }

    if (data.qi.trend < -10) {
      highlights.push({
        type: 'warning',
        message: `Quiet Index ירד ב-${Math.abs(data.qi.trend)} נקודות`
      });
    }

    if (data.detections.bySeverity.critical > 10) {
      highlights.push({
        type: 'critical',
        message: `${data.detections.bySeverity.critical} זיהויים קריטיים`
      });
    }

    if (data.blockedIPs.total > 0) {
      highlights.push({
        type: 'success',
        message: `${data.blockedIPs.total} IPs נחסמו בהצלחה`
      });
    }

    return highlights;
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(data) {
    const recommendations = [];

    if (data.clicks.vpnCount > data.clicks.total * 0.2) {
      recommendations.push('שקול לחסום VPNs או להגביל גישה');
    }

    if (data.costs.wastePercentage > 15) {
      recommendations.push('הגדר alert rules אגרסיביים יותר');
    }

    if (data.qi.current < 60) {
      recommendations.push('בדוק targeting ו-keyword strategy');
    }

    if (data.alerts.active > 5) {
      recommendations.push('טפל בהתראות הפעילות');
    }

    return recommendations;
  }

  /**
   * Get top threats
   */
  getTopThreats(data) {
    return Object.entries(data.detections.byPattern)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pattern, count]) => ({ pattern, count }));
  }

  /**
   * Export to CSV
   */
  async exportToCSV(accountId, dataType, startDate, endDate) {
    try {
      let data;
      let headers;

      switch (dataType) {
        case 'clicks':
          data = await this.getClicksForExport(accountId, startDate, endDate);
          headers = ['timestamp', 'ip', 'country', 'device', 'cost', 'risk_score', 'is_fraud'];
          break;
        case 'detections':
          data = await this.getDetectionsForExport(accountId, startDate, endDate);
          headers = ['timestamp', 'pattern', 'severity', 'score', 'ip', 'cost'];
          break;
        default:
          throw new Error('Invalid data type');
      }

      const csv = this.convertToCSV(data, headers);
      return csv;
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw error;
    }
  }

  /**
   * Convert to CSV
   */
  convertToCSV(data, headers) {
    const rows = [headers.join(',')];
    
    data.forEach(item => {
      const row = headers.map(h => item[h] || '').join(',');
      rows.push(row);
    });

    return rows.join('\n');
  }

  /**
   * Helper: Group by field
   */
  groupBy(array, field) {
    const grouped = {};
    array.forEach(item => {
      const key = item[field] || 'unknown';
      grouped[key] = (grouped[key] || 0) + 1;
    });
    return grouped;
  }

  /**
   * Helper: Group by hour
   */
  groupByHour(array) {
    const grouped = {};
    array.forEach(item => {
      const hour = new Date(item.event_timestamp).getHours();
      grouped[hour] = (grouped[hour] || 0) + 1;
    });
    return grouped;
  }

  /**
   * Save report to database
   */
  async saveReport(accountId, report, period) {
    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          ad_account_id: accountId,
          report_type: report.type,
          period,
          data: report,
          generated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving report:', error);
    }
  }

  /**
   * Get clicks for export
   */
  async getClicksForExport(accountId, startDate, endDate) {
    const { data } = await supabase
      .from('raw_events')
      .select('event_timestamp, ip_address, country_code, device_type, cost_micros, risk_score')
      .eq('ad_account_id', accountId)
      .eq('event_type', 'click')
      .gte('event_timestamp', startDate.toISOString())
      .lte('event_timestamp', endDate.toISOString());

    return (data || []).map(c => ({
      timestamp: c.event_timestamp,
      ip: c.ip_address,
      country: c.country_code,
      device: c.device_type,
      cost: (c.cost_micros / 1000000).toFixed(2),
      risk_score: c.risk_score,
      is_fraud: c.risk_score > 70 ? 'Yes' : 'No'
    }));
  }

  /**
   * Get detections for export
   */
  async getDetectionsForExport(accountId, startDate, endDate) {
    const { data } = await supabase
      .from('fraud_detections')
      .select(`
        detected_at,
        pattern_type,
        severity,
        fraud_score,
        raw_events:event_id(ip_address, cost_micros)
      `)
      .eq('ad_account_id', accountId)
      .gte('detected_at', startDate.toISOString())
      .lte('detected_at', endDate.toISOString());

    return (data || []).map(d => ({
      timestamp: d.detected_at,
      pattern: d.pattern_type,
      severity: d.severity,
      score: d.fraud_score,
      ip: d.raw_events?.ip_address || '',
      cost: d.raw_events?.cost_micros 
        ? (d.raw_events.cost_micros / 1000000).toFixed(2)
        : '0'
    }));
  }
}

module.exports = new ReportService();