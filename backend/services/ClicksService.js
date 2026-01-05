const { GoogleAdsApi } = require('google-ads-api');
const supabase = require('../config/supabase');

class ClicksService {
  constructor() {
    // Use GOOGLE_ADS_CLIENT_ID if available, otherwise fallback to GOOGLE_CLIENT_ID
    const clientId = process.env.GOOGLE_ADS_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      console.warn('⚠️ Warning: GOOGLE_ADS_CLIENT_ID not found, using GOOGLE_CLIENT_ID as fallback');
    }

    // Clean developer token - remove placeholder values
    let developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || 'test-token';
    
    // Check if it's a placeholder (contains brackets or Hebrew characters)
    if (developerToken.includes('[') || developerToken.includes(']') || /[\u0590-\u05FF]/.test(developerToken)) {
      console.warn('⚠️ Warning: GOOGLE_ADS_DEVELOPER_TOKEN appears to be a placeholder, using test-token');
      developerToken = 'test-token';
    }

    this.client = new GoogleAdsApi({
      client_id: clientId,
      client_secret: clientSecret,
      developer_token: developerToken,
    });
  }

  /**
   * Fetch clicks from Google Ads for specific date range
   */
  async getClicks(customerId, refreshToken, options = {}) {
    try {
      const {
        days = 7,
        campaignId = null,
        limit = 1000
      } = options;

      const customer = this.client.Customer({
        customer_id: customerId,
        refresh_token: refreshToken,
        login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
      });

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const startDateStr = this.formatDate(startDate);
      const endDateStr = this.formatDate(endDate);

      // Build query
      let query = `
        SELECT
          click_view.gclid,
          click_view.area_of_interest.city,
          click_view.area_of_interest.country,
          click_view.area_of_interest.metro,
          click_view.area_of_interest.most_specific,
          click_view.area_of_interest.region,
          click_view.keyword_info.text,
          click_view.keyword_info.match_type,
          campaign.id,
          campaign.name,
          ad_group.id,
          ad_group.name,
          segments.date,
          segments.hour,
          segments.device,
          metrics.cost_micros
        FROM click_view
        WHERE segments.date BETWEEN '${startDateStr}' AND '${endDateStr}'
      `;

      if (campaignId) {
        query += ` AND campaign.id = ${campaignId}`;
      }

      query += ` LIMIT ${limit}`;

      // Execute query
      const clicks = await customer.query(query);

      // Process and enrich clicks
      const processedClicks = clicks.map(click => this.processClick(click, customerId));

      return processedClicks;
    } catch (error) {
      console.error('Error fetching clicks:', error);
      throw error;
    }
  }

  /**
   * Process and enrich a single click
   */
  processClick(click, customerId) {
    const clickView = click.click_view || {};
    const campaign = click.campaign || {};
    const adGroup = click.ad_group || {};
    const segments = click.segments || {};
    const metrics = click.metrics || {};

    // Extract location info
    const location = clickView.area_of_interest || {};
    
    return {
      // Identifiers
      gclid: clickView.gclid,
      customer_id: customerId,
      campaign_id: campaign.id?.toString(),
      campaign_name: campaign.name,
      ad_group_id: adGroup.id?.toString(),
      ad_group_name: adGroup.name,
      
      // Location
      city: location.city,
      country: location.country,
      region: location.region,
      metro: location.metro,
      
      // Keyword
      keyword: clickView.keyword_info?.text,
      match_type: clickView.keyword_info?.match_type,
      
      // Device
      device: segments.device,
      
      // Time
      click_date: segments.date,
      click_hour: segments.hour,
      click_timestamp: this.buildTimestamp(segments.date, segments.hour),
      
      // Cost
      cost_micros: metrics.cost_micros || 0,
      cost: (metrics.cost_micros || 0) / 1000000,
      
      // Metadata
      raw_data: click,
    };
  }

  /**
   * Save clicks to database
   */
  async saveClicks(accountId, clicks) {
    try {
      const events = clicks.map(click => ({
        ad_account_id: accountId,
        gclid: click.gclid || null,
        campaign_id: click.campaign_id || 'unknown',
        campaign_name: click.campaign_name || null,
        ad_group_id: click.ad_group_id || null,
        ad_group_name: click.ad_group_name || null,
        click_timestamp: click.click_timestamp || new Date().toISOString(),
        device: click.device || null,
        network: click.network || null, // Will be set from segments if available
        country_code: click.country || null,
        cost_micros: click.cost_micros || 0,
      }));

      const { data, error } = await supabase
        .from('raw_events')
        .insert(events)
        .select();

      if (error) {
        console.error('Error saving clicks:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in saveClicks:', error);
      throw error;
    }
  }

  /**
   * Get clicks from database with filters
   */
  async getClicksFromDB(accountId, options = {}) {
    try {
      const {
        days = 7,
        campaignId = null,
        limit = 100,
        offset = 0
      } = options;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      let query = supabase
        .from('raw_events')
        .select('*')
        .eq('ad_account_id', accountId)
        .gte('click_timestamp', startDate.toISOString())
        .order('click_timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting clicks from DB:', error);
      throw error;
    }
  }

  /**
   * Sync clicks from Google Ads to database
   */
  async syncClicks(accountId, customerId, refreshToken, options = {}) {
    try {
      // Fetch from Google Ads
      console.log(`Fetching clicks for account ${accountId}...`);
      const clicks = await this.getClicks(customerId, refreshToken, options);
      
      console.log(`Fetched ${clicks.length} clicks`);

      // Save to database
      if (clicks.length > 0) {
        console.log(`Saving ${clicks.length} clicks to database...`);
        const saved = await this.saveClicks(accountId, clicks);
        console.log(`Saved ${saved.length} clicks`);
        return saved;
      }

      return [];
    } catch (error) {
      console.error('Error syncing clicks:', error);
      throw error;
    }
  }

  /**
   * Get click statistics
   */
  async getClickStats(accountId, days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('raw_events')
        .select('*')
        .eq('ad_account_id', accountId)
        .gte('click_timestamp', startDate.toISOString());

      if (error) throw error;

      const clicks = data || [];

      // Calculate stats
      const stats = {
        total_clicks: clicks.length,
        total_cost: clicks.reduce((sum, c) => sum + (c.cost_micros || 0), 0) / 1000000,
        unique_campaigns: new Set(clicks.map(c => c.campaign_id)).size,
        devices: this.groupBy(clicks, 'device'),
        countries: this.groupBy(clicks, 'country_code'),
        hourly_distribution: this.getHourlyDistribution(clicks),
      };

      return stats;
    } catch (error) {
      console.error('Error getting click stats:', error);
      throw error;
    }
  }

  /**
   * Helper: Format date for Google Ads API (YYYY-MM-DD)
   */
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Helper: Build timestamp from date and hour
   */
  buildTimestamp(date, hour) {
    if (!date) return new Date().toISOString();
    
    // date is in format YYYY-MM-DD
    // hour is 0-23
    const [year, month, day] = date.split('-');
    const timestamp = new Date(year, parseInt(month) - 1, day, hour || 0);
    return timestamp.toISOString();
  }

  /**
   * Helper: Group array by field
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
   * Helper: Get hourly distribution
   */
  getHourlyDistribution(clicks) {
    const distribution = Array(24).fill(0);
    clicks.forEach(click => {
      if (click.event_timestamp) {
        const hour = new Date(click.event_timestamp).getHours();
        distribution[hour]++;
      }
    });
    return distribution;
  }
}

module.exports = new ClicksService();