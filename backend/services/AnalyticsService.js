/*
 * AnalyticsSerמספק analytics מתקדמים על clicks - geographic, ISP, risk, time series. מחשב aggregations וstatistics לdashboard.vice.js
 * 
 * שירות Analytics מתקדם:
 * - Geographic analytics (countries, cities, heatmap)
 * - ISP breakdown
 * - Risk distribution
 * - VPN/Hosting statistics
 * - Time series data
 * - Device analytics
 * - Cost analytics
 */

const supabase = require('../config/supabase');

class AnalyticsService {
  /**
   * Get comprehensive analytics for account
   */
  async getAnalytics(accountId, options = {}) {
    const {
      days = 7,
      startDate = null,
      endDate = null
    } = options;

    try {
      const [
        geographic,
        ispBreakdown,
        riskDistribution,
        vpnStats,
        timeSeries,
        deviceBreakdown,
        costAnalytics
      ] = await Promise.all([
        this.getGeographicAnalytics(accountId, days),
        this.getISPBreakdown(accountId, days),
        this.getRiskDistribution(accountId, days),
        this.getVPNStats(accountId, days),
        this.getTimeSeries(accountId, days),
        this.getDeviceBreakdown(accountId, days),
        this.getCostAnalytics(accountId, days)
      ]);

      return {
        geographic,
        ispBreakdown,
        riskDistribution,
        vpnStats,
        timeSeries,
        deviceBreakdown,
        costAnalytics,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting analytics:', error);
      throw error;
    }
  }

  /**
   * Geographic Analytics - countries, cities, coordinates
   */
  async getGeographicAnalytics(accountId, days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Top Countries
      const { data: countries, error: countriesError } = await supabase
        .from('raw_events')
        .select('country_code, cost_micros')
        .eq('ad_account_id', accountId)
        .eq('event_type', 'click')
        .gte('event_timestamp', startDate.toISOString())
        .not('country_code', 'is', null);

      if (countriesError) throw countriesError;

      const countryStats = this.aggregateByField(countries || [], 'country_code');

      // Top Cities
      const { data: cities, error: citiesError } = await supabase
        .from('raw_events')
        .select('city, country_code, cost_micros')
        .eq('ad_account_id', accountId)
        .eq('event_type', 'click')
        .gte('event_timestamp', startDate.toISOString())
        .not('city', 'is', null);

      if (citiesError) throw citiesError;

      const cityStats = this.aggregateByField(cities || [], 'city', 'country_code');

      // Heatmap data (for map visualization)
      const heatmapData = countryStats.map(country => ({
        code: country.name,
        value: country.count,
        cost: country.totalCost
      }));

      return {
        countries: countryStats.slice(0, 10),
        cities: cityStats.slice(0, 10),
        heatmap: heatmapData,
        totalCountries: new Set(countries?.map(c => c.country_code)).size,
        totalCities: new Set(cities?.map(c => c.city)).size
      };
    } catch (error) {
      console.error('Error getting geographic analytics:', error);
      return { countries: [], cities: [], heatmap: [] };
    }
  }

  /**
   * ISP Breakdown - top ISPs with click counts
   */
  async getISPBreakdown(accountId, days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('raw_events')
        .select('isp, cost_micros, is_hosting')
        .eq('ad_account_id', accountId)
        .eq('event_type', 'click')
        .gte('event_timestamp', startDate.toISOString())
        .not('isp', 'is', null);

      if (error) throw error;

      const ispStats = this.aggregateByField(data || [], 'isp');

      // Add hosting flag
      const enriched = ispStats.map(isp => {
        const ispClicks = data.filter(d => d.isp === isp.name);
        const hostingClicks = ispClicks.filter(c => c.is_hosting).length;
        
        return {
          ...isp,
          isHosting: hostingClicks > ispClicks.length / 2,
          hostingPercentage: (hostingClicks / ispClicks.length * 100).toFixed(1)
        };
      });

      return {
        isps: enriched.slice(0, 10),
        totalISPs: new Set(data?.map(d => d.isp)).size
      };
    } catch (error) {
      console.error('Error getting ISP breakdown:', error);
      return { isps: [], totalISPs: 0 };
    }
  }

  /**
   * Risk Distribution - breakdown by risk levels
   */
  async getRiskDistribution(accountId, days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('raw_events')
        .select('risk_score, cost_micros')
        .eq('ad_account_id', accountId)
        .eq('event_type', 'click')
        .gte('event_timestamp', startDate.toISOString())
        .not('risk_score', 'is', null);

      if (error) throw error;

      // Group by risk level
      const distribution = {
        safe: { count: 0, cost: 0, range: '0-9' },
        low: { count: 0, cost: 0, range: '10-29' },
        medium: { count: 0, cost: 0, range: '30-49' },
        high: { count: 0, cost: 0, range: '50-69' },
        critical: { count: 0, cost: 0, range: '70-100' }
      };

      data?.forEach(click => {
        const score = click.risk_score || 0;
        const cost = (click.cost_micros || 0) / 1000000;

        if (score < 10) {
          distribution.safe.count++;
          distribution.safe.cost += cost;
        } else if (score < 30) {
          distribution.low.count++;
          distribution.low.cost += cost;
        } else if (score < 50) {
          distribution.medium.count++;
          distribution.medium.cost += cost;
        } else if (score < 70) {
          distribution.high.count++;
          distribution.high.cost += cost;
        } else {
          distribution.critical.count++;
          distribution.critical.cost += cost;
        }
      });

      const total = data?.length || 0;
      const distributionArray = Object.entries(distribution).map(([level, stats]) => ({
        level,
        count: stats.count,
        percentage: total > 0 ? (stats.count / total * 100).toFixed(1) : 0,
        totalCost: stats.cost.toFixed(2),
        range: stats.range
      }));

      return {
        distribution: distributionArray,
        averageRisk: total > 0 
          ? (data.reduce((sum, c) => sum + (c.risk_score || 0), 0) / total).toFixed(1)
          : 0
      };
    } catch (error) {
      console.error('Error getting risk distribution:', error);
      return { distribution: [], averageRisk: 0 };
    }
  }

  /**
   * VPN/Hosting Statistics
   */
  async getVPNStats(accountId, days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('raw_events')
        .select('is_vpn, is_proxy, is_hosting, cost_micros')
        .eq('ad_account_id', accountId)
        .eq('event_type', 'click')
        .gte('event_timestamp', startDate.toISOString());

      if (error) throw error;

      const total = data?.length || 0;
      const vpnClicks = data?.filter(c => c.is_vpn).length || 0;
      const proxyClicks = data?.filter(c => c.is_proxy).length || 0;
      const hostingClicks = data?.filter(c => c.is_hosting).length || 0;

      const vpnCost = data?.filter(c => c.is_vpn)
        .reduce((sum, c) => sum + (c.cost_micros || 0), 0) / 1000000 || 0;
      
      const hostingCost = data?.filter(c => c.is_hosting)
        .reduce((sum, c) => sum + (c.cost_micros || 0), 0) / 1000000 || 0;

      return {
        vpn: {
          count: vpnClicks,
          percentage: total > 0 ? (vpnClicks / total * 100).toFixed(1) : 0,
          cost: vpnCost.toFixed(2)
        },
        proxy: {
          count: proxyClicks,
          percentage: total > 0 ? (proxyClicks / total * 100).toFixed(1) : 0
        },
        hosting: {
          count: hostingClicks,
          percentage: total > 0 ? (hostingClicks / total * 100).toFixed(1) : 0,
          cost: hostingCost.toFixed(2)
        },
        clean: {
          count: total - vpnClicks - hostingClicks,
          percentage: total > 0 
            ? ((total - vpnClicks - hostingClicks) / total * 100).toFixed(1) 
            : 0
        }
      };
    } catch (error) {
      console.error('Error getting VPN stats:', error);
      return { vpn: {}, proxy: {}, hosting: {}, clean: {} };
    }
  }

  /**
   * Time Series Data - clicks over time
   */
  async getTimeSeries(accountId, days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('raw_events')
        .select('event_timestamp, cost_micros, risk_score')
        .eq('ad_account_id', accountId)
        .eq('event_type', 'click')
        .gte('event_timestamp', startDate.toISOString())
        .order('event_timestamp', { ascending: true });

      if (error) throw error;

      // Group by hour
      const hourly = {};
      data?.forEach(click => {
        const hour = new Date(click.event_timestamp).toISOString().slice(0, 13) + ':00:00Z';
        if (!hourly[hour]) {
          hourly[hour] = { count: 0, cost: 0, totalRisk: 0 };
        }
        hourly[hour].count++;
        hourly[hour].cost += (click.cost_micros || 0) / 1000000;
        hourly[hour].totalRisk += click.risk_score || 0;
      });

      const series = Object.entries(hourly).map(([time, stats]) => ({
        time,
        clicks: stats.count,
        cost: parseFloat(stats.cost.toFixed(2)),
        avgRisk: stats.count > 0 ? (stats.totalRisk / stats.count).toFixed(1) : 0
      }));

      return {
        hourly: series,
        totalPoints: series.length
      };
    } catch (error) {
      console.error('Error getting time series:', error);
      return { hourly: [], totalPoints: 0 };
    }
  }

  /**
   * Device Breakdown
   */
  async getDeviceBreakdown(accountId, days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('raw_events')
        .select('device_type, cost_micros')
        .eq('ad_account_id', accountId)
        .eq('event_type', 'click')
        .gte('event_timestamp', startDate.toISOString())
        .not('device_type', 'is', null);

      if (error) throw error;

      const deviceStats = this.aggregateByField(data || [], 'device_type');

      return {
        devices: deviceStats,
        totalDevices: deviceStats.length
      };
    } catch (error) {
      console.error('Error getting device breakdown:', error);
      return { devices: [], totalDevices: 0 };
    }
  }

  /**
   * Cost Analytics
   */
  async getCostAnalytics(accountId, days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('raw_events')
        .select('cost_micros, is_vpn, is_hosting, risk_score')
        .eq('ad_account_id', accountId)
        .eq('event_type', 'click')
        .gte('event_timestamp', startDate.toISOString());

      if (error) throw error;

      const totalCost = data?.reduce((sum, c) => sum + (c.cost_micros || 0), 0) / 1000000 || 0;
      const suspiciousCost = data?.filter(c => c.is_vpn || c.is_hosting || (c.risk_score || 0) > 50)
        .reduce((sum, c) => sum + (c.cost_micros || 0), 0) / 1000000 || 0;

      return {
        total: totalCost.toFixed(2),
        suspicious: suspiciousCost.toFixed(2),
        clean: (totalCost - suspiciousCost).toFixed(2),
        suspiciousPercentage: totalCost > 0 
          ? (suspiciousCost / totalCost * 100).toFixed(1) 
          : 0
      };
    } catch (error) {
      console.error('Error getting cost analytics:', error);
      return { total: 0, suspicious: 0, clean: 0 };
    }
  }

  /**
   * Helper: Aggregate by field
   */
  aggregateByField(data, fieldName, secondaryField = null) {
    const grouped = {};

    data.forEach(item => {
      const key = item[fieldName];
      if (!key) return;

      if (!grouped[key]) {
        grouped[key] = {
          name: key,
          count: 0,
          totalCost: 0,
          secondary: secondaryField ? item[secondaryField] : null
        };
      }

      grouped[key].count++;
      grouped[key].totalCost += (item.cost_micros || 0) / 1000000;
    });

    return Object.values(grouped)
      .map(item => ({
        ...item,
        totalCost: parseFloat(item.totalCost.toFixed(2)),
        percentage: ((item.count / data.length) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count);
  }
}

module.exports = new AnalyticsService();