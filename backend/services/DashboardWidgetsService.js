/*
 * DashboardWidgetsService.js
 * 
 * Dashboard Customization:
 * - Widget management
 * - Custom metrics
 * - Widget layouts
 * - User preferences
 * - Quick stats
 * - Data refresh
 */

const supabase = require('../config/supabase');

class DashboardWidgetsService {
  /**
   * Get user's dashboard configuration
   */
  async getDashboardConfig(userId) {
    try {
      const { data, error } = await supabase
        .from('dashboard_configs')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      // Return default if no config
      if (!data) {
        return this.getDefaultConfig();
      }

      return data.config;
    } catch (error) {
      console.error('Error getting dashboard config:', error);
      return this.getDefaultConfig();
    }
  }

  /**
   * Save dashboard configuration
   */
  async saveDashboardConfig(userId, config) {
    try {
      const { data, error } = await supabase
        .from('dashboard_configs')
        .upsert({
          user_id: userId,
          config,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving dashboard config:', error);
      throw error;
    }
  }

  /**
   * Get default configuration
   */
  getDefaultConfig() {
    return {
      layout: 'default',
      widgets: [
        { id: 'realtime-monitoring', enabled: true, position: 1 },
        { id: 'quiet-index', enabled: true, position: 2 },
        { id: 'advanced-analytics', enabled: true, position: 3 },
        { id: 'detection-settings', enabled: true, position: 4 },
        { id: 'fraud-alerts', enabled: true, position: 5 },
        { id: 'live-clicks', enabled: true, position: 6 },
        { id: 'ip-management', enabled: true, position: 7 }
      ],
      theme: 'dark',
      refreshInterval: 30
    };
  }

  /**
   * Get quick stats for widgets
   */
  async getQuickStats(accountId) {
    try {
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const [
        clicksToday,
        detectionsToday,
        activeAlerts,
        currentQI,
        blockedIPs
      ] = await Promise.all([
        this.getClicksCount(accountId, last24h),
        this.getDetectionsCount(accountId, last24h),
        this.getActiveAlertsCount(accountId),
        this.getCurrentQI(accountId),
        this.getBlockedIPsCount(accountId)
      ]);

      return {
        clicksToday,
        detectionsToday,
        activeAlerts,
        currentQI,
        blockedIPs,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting quick stats:', error);
      return null;
    }
  }

  /**
   * Get clicks count
   */
  async getClicksCount(accountId, since) {
    const { count, error } = await supabase
      .from('raw_events')
      .select('id', { count: 'exact', head: true })
      .eq('ad_account_id', accountId)
      .eq('event_type', 'click')
      .gte('event_timestamp', since.toISOString());

    if (error) throw error;
    return count || 0;
  }

  /**
   * Get detections count
   */
  async getDetectionsCount(accountId, since) {
    const { count, error } = await supabase
      .from('fraud_detections')
      .select('id', { count: 'exact', head: true })
      .eq('ad_account_id', accountId)
      .gte('detected_at', since.toISOString());

    if (error) throw error;
    return count || 0;
  }

  /**
   * Get active alerts count
   */
  async getActiveAlertsCount(accountId) {
    const { count, error } = await supabase
      .from('alerts')
      .select('id', { count: 'exact', head: true })
      .eq('ad_account_id', accountId)
      .eq('status', 'active');

    if (error) throw error;
    return count || 0;
  }

  /**
   * Get current QI
   */
  async getCurrentQI(accountId) {
    const { data, error } = await supabase
      .from('quiet_index_history')
      .select('qi_score')
      .eq('ad_account_id', accountId)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.qi_score || 0;
  }

  /**
   * Get blocked IPs count
   */
  async getBlockedIPsCount(accountId) {
    const { count, error } = await supabase
      .from('ip_blacklist')
      .select('id', { count: 'exact', head: true })
      .eq('ad_account_id', accountId)
      .eq('status', 'active');

    if (error) throw error;
    return count || 0;
  }

  /**
   * Get widget data by type
   */
  async getWidgetData(accountId, widgetType, options = {}) {
    try {
      switch (widgetType) {
        case 'cost-summary':
          return await this.getCostSummary(accountId, options);
        case 'top-threats':
          return await this.getTopThreats(accountId, options);
        case 'geographic-map':
          return await this.getGeographicMap(accountId, options);
        case 'hourly-activity':
          return await this.getHourlyActivity(accountId, options);
        case 'device-breakdown':
          return await this.getDeviceBreakdown(accountId, options);
        default:
          return null;
      }
    } catch (error) {
      console.error(`Error getting widget data for ${widgetType}:`, error);
      return null;
    }
  }

  /**
   * Get cost summary widget
   */
  async getCostSummary(accountId, options) {
    const { days = 7 } = options;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: clicks } = await supabase
      .from('raw_events')
      .select('cost_micros')
      .eq('ad_account_id', accountId)
      .eq('event_type', 'click')
      .gte('event_timestamp', startDate.toISOString());

    const { data: detections } = await supabase
      .from('fraud_detections')
      .select('event_id')
      .eq('ad_account_id', accountId)
      .gte('detected_at', startDate.toISOString());

    const fraudEventIds = new Set(detections?.map(d => d.event_id) || []);
    
    const totalCost = (clicks || []).reduce((sum, c) => sum + (c.cost_micros || 0), 0) / 1000000;
    const fraudCost = (clicks || [])
      .filter(c => fraudEventIds.has(c.id))
      .reduce((sum, c) => sum + (c.cost_micros || 0), 0) / 1000000;

    return {
      total: totalCost.toFixed(2),
      fraud: fraudCost.toFixed(2),
      clean: (totalCost - fraudCost).toFixed(2),
      saved: fraudCost.toFixed(2)
    };
  }

  /**
   * Get top threats widget
   */
  async getTopThreats(accountId, options) {
    const { days = 7, limit = 5 } = options;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data } = await supabase
      .from('fraud_detections')
      .select('pattern_type, severity, fraud_score')
      .eq('ad_account_id', accountId)
      .gte('detected_at', startDate.toISOString())
      .order('fraud_score', { ascending: false })
      .limit(limit);

    return data || [];
  }

  /**
   * Get geographic map widget
   */
  async getGeographicMap(accountId, options) {
    const { days = 7 } = options;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data } = await supabase
      .from('raw_events')
      .select('country_code, cost_micros')
      .eq('ad_account_id', accountId)
      .eq('event_type', 'click')
      .gte('event_timestamp', startDate.toISOString())
      .not('country_code', 'is', null);

    const grouped = {};
    (data || []).forEach(item => {
      if (!grouped[item.country_code]) {
        grouped[item.country_code] = { count: 0, cost: 0 };
      }
      grouped[item.country_code].count++;
      grouped[item.country_code].cost += (item.cost_micros || 0) / 1000000;
    });

    return Object.entries(grouped).map(([code, stats]) => ({
      country: code,
      clicks: stats.count,
      cost: stats.cost.toFixed(2)
    }));
  }

  /**
   * Get hourly activity widget
   */
  async getHourlyActivity(accountId, options) {
    const { days = 1 } = options;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data } = await supabase
      .from('raw_events')
      .select('event_timestamp')
      .eq('ad_account_id', accountId)
      .eq('event_type', 'click')
      .gte('event_timestamp', startDate.toISOString());

    const hourly = {};
    (data || []).forEach(item => {
      const hour = new Date(item.event_timestamp).getHours();
      hourly[hour] = (hourly[hour] || 0) + 1;
    });

    return Object.entries(hourly).map(([hour, count]) => ({
      hour: parseInt(hour),
      clicks: count
    }));
  }

  /**
   * Get device breakdown widget
   */
  async getDeviceBreakdown(accountId, options) {
    const { days = 7 } = options;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data } = await supabase
      .from('raw_events')
      .select('device_type, cost_micros')
      .eq('ad_account_id', accountId)
      .eq('event_type', 'click')
      .gte('event_timestamp', startDate.toISOString())
      .not('device_type', 'is', null);

    const grouped = {};
    (data || []).forEach(item => {
      const device = item.device_type || 'UNKNOWN';
      if (!grouped[device]) {
        grouped[device] = { count: 0, cost: 0 };
      }
      grouped[device].count++;
      grouped[device].cost += (item.cost_micros || 0) / 1000000;
    });

    return Object.entries(grouped).map(([device, stats]) => ({
      device,
      clicks: stats.count,
      cost: stats.cost.toFixed(2)
    }));
  }
}

module.exports = new DashboardWidgetsService();