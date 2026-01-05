const { GoogleAdsApi } = require('google-ads-api');

class GoogleAdsService {
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
   * Get OAuth URL for user to authorize
   */
  getAuthUrl() {
    // Use GOOGLE_ADS_CLIENT_ID if available, otherwise fallback to GOOGLE_CLIENT_ID
    const clientId = process.env.GOOGLE_ADS_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
    let redirectUri = process.env.GOOGLE_ADS_REDIRECT_URI;

    if (!clientId) {
      throw new Error('Missing GOOGLE_ADS_CLIENT_ID or GOOGLE_CLIENT_ID in environment variables');
    }

    if (!redirectUri) {
      console.error('❌ Missing GOOGLE_ADS_REDIRECT_URI');
      console.error('Available env vars:', {
        hasGoogleAdsRedirect: !!process.env.GOOGLE_ADS_REDIRECT_URI,
        hasGoogleRedirect: !!process.env.GOOGLE_REDIRECT_URI,
        googleRedirect: process.env.GOOGLE_REDIRECT_URI
      });
      throw new Error('Missing GOOGLE_ADS_REDIRECT_URI in environment variables. Please add GOOGLE_ADS_REDIRECT_URI=http://localhost:3001/api/googleads/callback to .env.local');
    }

    console.log('✅ Google Ads OAuth URL generated:', {
      clientId: clientId.substring(0, 20) + '...',
      redirectUri: redirectUri
    });
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent('https://www.googleapis.com/auth/adwords')}&` +
      `access_type=offline&` +
      `prompt=consent`;

    return authUrl;
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(code) {
    try {
      // Use GOOGLE_ADS_CLIENT_ID if available, otherwise fallback to GOOGLE_CLIENT_ID
      const clientId = process.env.GOOGLE_ADS_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri = process.env.GOOGLE_ADS_REDIRECT_URI;

      if (!clientId || !clientSecret || !redirectUri) {
        throw new Error('Missing Google Ads OAuth configuration');
      }

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to get tokens: ${JSON.stringify(error)}`);
      }

      const tokens = await response.json();
      return tokens;
    } catch (error) {
      console.error('Error getting tokens:', error);
      throw error;
    }
  }

  /**
   * Get customer (ad account) details
   */
  async getCustomer(customerId, refreshToken) {
    try {
      const customer = this.client.Customer({
        customer_id: customerId,
        refresh_token: refreshToken,
        login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
      });

      // Get basic customer info
      const query = `
        SELECT
          customer.id,
          customer.descriptive_name,
          customer.currency_code,
          customer.time_zone
        FROM customer
        WHERE customer.id = ${customerId}
      `;

      const [result] = await customer.query(query);
      return result;
    } catch (error) {
      console.error('Error getting customer:', error);
      throw error;
    }
  }

  /**
   * List all accessible customers
   */
  async listAccessibleCustomers(refreshToken) {
    try {
      console.log('🔄 Listing accessible customers using google-ads-api client...');
      
      // Use the client's listAccessibleCustomers method (not customer's)
      const response = await this.client.listAccessibleCustomers(refreshToken);
      
      console.log('✅ Customers listed:', response.resourceNames?.length || 0);
      return response.resourceNames || [];
    } catch (error) {
      console.error('Error listing customers:', error);
      
      // Extract meaningful error message
      let errorMessage = 'Failed to list customers';
      
      if (error.errors && Array.isArray(error.errors)) {
        const firstError = error.errors[0];
        if (firstError.message) {
          errorMessage = firstError.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.details) {
        errorMessage = error.details;
      }
      
      // Check if it's a developer token issue
      if (errorMessage.includes('developer token') || errorMessage.includes('not valid')) {
        errorMessage = 'Developer token is not valid. Please add a valid GOOGLE_ADS_DEVELOPER_TOKEN to .env.local. For now, you can use test-token for development, but it has limitations.';
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Get access token from refresh token
   */
  async getAccessToken(refreshToken) {
    try {
      // Use GOOGLE_ADS_CLIENT_ID if available, otherwise fallback to GOOGLE_CLIENT_ID
      const clientId = process.env.GOOGLE_ADS_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error('Missing Google Ads OAuth configuration for token refresh');
      }

      console.log('🔄 Refreshing access token...', {
        clientId: clientId.substring(0, 20) + '...'
      });

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Token refresh error:', error);
        throw new Error(`Failed to refresh token: ${JSON.stringify(error)}`);
      }

      const tokens = await response.json();
      console.log('✅ Access token refreshed');
      return tokens.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }

  /**
   * Get campaigns for a customer
   */
  async getCampaigns(customerId, refreshToken) {
    try {
      const customer = this.client.Customer({
        customer_id: customerId,
        refresh_token: refreshToken,
        login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
      });

      const query = `
        SELECT
          campaign.id,
          campaign.name,
          campaign.status,
          campaign.advertising_channel_type,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros
        FROM campaign
        WHERE campaign.status != 'REMOVED'
        ORDER BY campaign.name
        LIMIT 50
      `;

      const campaigns = await customer.query(query);
      return campaigns;
    } catch (error) {
      console.error('Error getting campaigns:', error);
      throw error;
    }
  }

  /**
   * Test connection with customer ID
   */
  async testConnection(customerId, refreshToken) {
    try {
      const customer = await this.getCustomer(customerId, refreshToken);
      return {
        success: true,
        customer,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = new GoogleAdsService();