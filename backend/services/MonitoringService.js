/*
Real-time monitoring של fraud detections - מעקב אחר threats פעילים, alerts חדשים, וstatistics בזמן אמת. * 
 * Real-Time Monitoring Service:
 * - Active threats tracking
 * - Recent fraud detections
 * - Live statistics
 * - Alert generation
 * - Threat timeline
 * - Attack pattern detection
 */

const supabase = require('../config/supabase');
const detectionEngine = require('./DetectionEngine');

class MonitoringService {
  /**
   * Get comprehensive monitoring data
   */
  async getMonitoringData(accountId, options = {}) {
    const {
      minutes = 60,
      includeHistory = true
    } = options;

    try {
      const [
        activeThreats,
        recentDetections,
        liveStats,
        threatTimeline,
        alertsCount
      ] = await Promise.all([
        this.getActiveThreats(accountId, minutes),
        this.getRecentDetections(accountId, 20),
        this.getLiveStatistics(accountId, minutes),
        includeHistory ? this.getThreatTimeline(accountId, 24) : null,
        this.getActiveAlertsCount(accountId)
      ]);

      return {
        activeThreats,
        recentDetections,
        liveStats,
        threatTimeline,
        alertsCount,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting monitoring data:', error);
      throw error;
    }
  }

  /**
   * Get active threats (high severity, recent)
   */
  async getActiveThreats(accountId, minutes = 60) {
    try {
      const startTime = new Date();
      startTime.setMinutes(startTime.getMinutes() - minutes);

      // Get high-severity fraud detections
      const { data: threats, error } = await supabase
        .from('fraud_detections')
        .select(`
          *,
          raw_events:event_id (
            ip_address,
            country_code,
            city,
            isp,
            device_type,
            cost_micros,
            campaign_name
          )
        `)
        .eq('ad_account_id', accountId)
        .gte('detected_at', startTime.toISOString())
        .in('severity', ['high', 'critical'])
        .order('detected_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Enrich with threat analysis
      const enrichedThreats = threats?.map(threat => {
        const event = threat.raw_events || {};
        
        return {
          id: threat.id,
          type: threat.pattern_type,
          severity: threat.severity,
          confidence: threat.confidence_score,
          fraudScore: threat.fraud_score,
          detectedAt: threat.detected_at,
          
          // Event details
          ip: event.ip_address,
          country: event.country_code,
          city: event.city,
          isp: event.isp,
          device: event.device_type,
          campaign: event.campaign_name,
          cost: event.cost_micros ? (event.cost_micros / 1000000).toFixed(2) : 0,
          
          // Threat classification
          category: this.classifyThreat(threat.pattern_type),
          actionable: threat.severity === 'critical',
          
          // Time since detection
          age: this.getTimeSince(threat.detected_at)
        };
      }) || [];

      // Group by pattern type
      const grouped = this.groupThreats(enrichedThreats);

      return {
        threats: enrichedThreats,
        grouped,
        total: enrichedThreats.length,
        critical: enrichedThreats.filter(t => t.severity === 'critical').length,
        high: enrichedThreats.filter(t => t.severity === 'high').length
      };
    } catch (error) {
      console.error('Error getting active threats:', error);
      return { threats: [], grouped: {}, total: 0, critical: 0, high: 0 };
    }
  }

  /**
   * Get recent fraud detections (all severities)
   */
  async getRecentDetections(accountId, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('fraud_detections')
        .select(`
          *,
          raw_events:event_id (
            ip_address,
            country_code,
            device_type,
            cost_micros
          )
        `)
        .eq('ad_account_id', accountId)
        .order('detected_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data?.map(detection => ({
        id: detection.id,
        type: detection.pattern_type,
        severity: detection.severity,
        fraudScore: detection.fraud_score,
        confidence: detection.confidence_score,
        detectedAt: detection.detected_at,
        ip: detection.raw_events?.ip_address,
        country: detection.raw_events?.country_code,
        device: detection.raw_events?.device_type,
        cost: detection.raw_events?.cost_micros 
          ? (detection.raw_events.cost_micros / 1000000).toFixed(2) 
          : 0,
        age: this.getTimeSince(detection.detected_at)
      })) || [];
    } catch (error) {
      console.error('Error getting recent detections:', error);
      return [];
    }
  }

  /**
   * Get live statistics
   */
  async getLiveStatistics(accountId, minutes = 60) {
    try {
      const startTime = new Date();
      startTime.setMinutes(startTime.getMinutes() - minutes);

      // Get all clicks in timeframe
      const { data: clicks, error: clicksError } = await supabase
        .from('raw_events')
        .select('id, cost_micros, risk_score, is_vpn, is_hosting')
        .eq('ad_account_id', accountId)
        .eq('event_type', 'click')
        .gte('event_timestamp', startTime.toISOString());

      if (clicksError) throw clicksError;

      // Get fraud detections in timeframe
      const { data: detections, error: detectionsError } = await supabase
        .from('fraud_detections')
        .select('id, severity, fraud_score')
        .eq('ad_account_id', accountId)
        .gte('detected_at', startTime.toISOString());

      if (detectionsError) throw detectionsError;

      const totalClicks = clicks?.length || 0;
      const totalDetections = detections?.length || 0;
      const totalCost = clicks?.reduce((sum, c) => sum + (c.cost_micros || 0), 0) / 1000000 || 0;
      
      const fraudulentCost = detections?.map(d => {
        const click = clicks?.find(c => c.id === d.id);
        return click ? (click.cost_micros || 0) / 1000000 : 0;
      }).reduce((sum, cost) => sum + cost, 0) || 0;

      const avgRisk = totalClicks > 0
        ? clicks.reduce((sum, c) => sum + (c.risk_score || 0), 0) / totalClicks
        : 0;

      const vpnClicks = clicks?.filter(c => c.is_vpn).length || 0;
      const hostingClicks = clicks?.filter(c => c.is_hosting).length || 0;

      // Critical vs High
      const critical = detections?.filter(d => d.severity === 'critical').length || 0;
      const high = detections?.filter(d => d.severity === 'high').length || 0;

      return {
        period: `Last ${minutes} minutes`,
        clicks: {
          total: totalClicks,
          clean: totalClicks - totalDetections,
          fraudulent: totalDetections,
          fraudRate: totalClicks > 0 ? ((totalDetections / totalClicks) * 100).toFixed(1) : 0
        },
        cost: {
          total: totalCost.toFixed(2),
          fraudulent: fraudulentCost.toFixed(2),
          wasted: totalCost > 0 ? ((fraudulentCost / totalCost) * 100).toFixed(1) : 0
        },
        risk: {
          average: avgRisk.toFixed(1),
          vpnPercentage: totalClicks > 0 ? ((vpnClicks / totalClicks) * 100).toFixed(1) : 0,
          hostingPercentage: totalClicks > 0 ? ((hostingClicks / totalClicks) * 100).toFixed(1) : 0
        },
        detections: {
          total: totalDetections,
          critical,
          high,
          medium: totalDetections - critical - high
        }
      };
    } catch (error) {
      console.error('Error getting live statistics:', error);
      return null;
    }
  }

  /**
   * Get threat timeline (hourly breakdown)
   */
  async getThreatTimeline(accountId, hours = 24) {
    try {
      const startTime = new Date();
      startTime.setHours(startTime.getHours() - hours);

      const { data, error } = await supabase
        .from('fraud_detections')
        .select('detected_at, severity, fraud_score')
        .eq('ad_account_id', accountId)
        .gte('detected_at', startTime.toISOString())
        .order('detected_at', { ascending: true });

      if (error) throw error;

      // Group by hour
      const hourly = {};
      data?.forEach(detection => {
        const hour = new Date(detection.detected_at).toISOString().slice(0, 13) + ':00:00Z';
        if (!hourly[hour]) {
          hourly[hour] = { total: 0, critical: 0, high: 0, medium: 0, avgScore: 0, scores: [] };
        }
        hourly[hour].total++;
        hourly[hour].scores.push(detection.fraud_score);
        if (detection.severity === 'critical') hourly[hour].critical++;
        if (detection.severity === 'high') hourly[hour].high++;
        if (detection.severity === 'medium') hourly[hour].medium++;
      });

      // Calculate averages and format
      const timeline = Object.entries(hourly).map(([time, stats]) => ({
        time,
        total: stats.total,
        critical: stats.critical,
        high: stats.high,
        medium: stats.medium,
        avgScore: (stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length).toFixed(1)
      }));

      return timeline;
    } catch (error) {
      console.error('Error getting threat timeline:', error);
      return [];
    }
  }

  /**
   * Get count of active (unresolved) alerts
   */
  async getActiveAlertsCount(accountId) {
    try {
      const { count, error } = await supabase
        .from('alerts')
        .select('id', { count: 'exact', head: true })
        .eq('ad_account_id', accountId)
        .eq('status', 'active');

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting alerts count:', error);
      return 0;
    }
  }

  /**
   * Classify threat by pattern type
   */
  classifyThreat(patternType) {
    const categories = {
      'same_ip_multiple_clicks': 'IP Abuse',
      'rapid_fire_clicks': 'Bot Attack',
      'impossible_geography': 'VPN/Proxy',
      'cost_spike': 'Budget Attack',
      'device_switching': 'Device Fraud',
      'weekend_surge': 'Timing Attack',
      'night_activity': 'Suspicious Hours',
      'keyword_mismatch': 'Search Fraud'
    };
    return categories[patternType] || 'Unknown';
  }

  /**
   * Group threats by type
   */
  groupThreats(threats) {
    const grouped = {};
    threats.forEach(threat => {
      const category = threat.category;
      if (!grouped[category]) {
        grouped[category] = { count: 0, threats: [] };
      }
      grouped[category].count++;
      grouped[category].threats.push(threat);
    });
    return grouped;
  }

  /**
   * Get time since (human readable)
   */
  getTimeSince(timestamp) {
    const now = new Date();
    const then = new Date(timestamp);
    const seconds = Math.floor((now - then) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  /**
   * Check if there's an active attack
   */
  async detectActiveAttack(accountId) {
    try {
      const stats = await this.getLiveStatistics(accountId, 15); // Last 15 minutes
      
      if (!stats) return { isAttack: false };

      // Attack indicators
      const highFraudRate = parseFloat(stats.clicks.fraudRate) > 30;
      const highCritical = stats.detections.critical > 5;
      const highVPN = parseFloat(stats.risk.vpnPercentage) > 40;

      const isAttack = highFraudRate && (highCritical || highVPN);

      return {
        isAttack,
        indicators: {
          fraudRate: stats.clicks.fraudRate,
          critical: stats.detections.critical,
          vpnPercentage: stats.risk.vpnPercentage
        },
        severity: isAttack ? (highCritical ? 'critical' : 'high') : 'normal'
      };
    } catch (error) {
      console.error('Error detecting active attack:', error);
      return { isAttack: false };
    }
  }
}

module.exports = new MonitoringService();