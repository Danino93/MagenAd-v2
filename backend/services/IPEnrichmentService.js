/*
מעשיר IP addresses עם מידע גיאוגרפי, ISP, VPN detection, וrisk scoring. משתמש ב-IP-API.com (חינמי) ו-IPHub (VPN detection). * 
 * מעשיר IP addresses עם מידע:
 * - GeoIP (country, city, region, lat/lon)
 * - ISP (Internet Service Provider)
 * - Organization
 * - ASN (Autonomous System Number)
 * - VPN/Proxy detection
 * - Hosting/Data Center detection
 * - Risk scoring
 * 
 * APIs Used:
 * - ip-api.com (חינמי, 45 requests/minute)
 * - IPHub.info (VPN detection, צריך API key)
 */

const supabase = require('../config/supabase');
const axios = require('axios');

class IPEnrichmentService {
  constructor() {
    // Cache למניעת duplicate requests
    this.cache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
    
    // Rate limiting
    this.lastRequestTime = 0;
    this.minRequestInterval = 1500; // 1.5 seconds (40/minute)
  }

  /**
   * Enrich IP address with all available data
   */
  async enrichIP(ipAddress) {
    try {
      // Input validation
      if (!ipAddress || ipAddress === '0.0.0.0' || ipAddress === '::1' || ipAddress === 'localhost') {
        return this.getDefaultEnrichment(ipAddress);
      }

      // Check cache first
      const cached = this.getFromCache(ipAddress);
      if (cached) {
        return cached;
      }

      // Rate limiting
      await this.rateLimit();

      // Get GeoIP + ISP data
      const geoData = await this.getGeoIPData(ipAddress);
      
      // Get VPN/Proxy detection (optional - requires API key)
      let vpnData = { isVPN: false, isProxy: false, isHosting: false };
      if (process.env.IPHUB_API_KEY) {
        vpnData = await this.getVPNData(ipAddress);
      } else {
        // Fallback: basic hosting detection from ISP name
        vpnData = this.detectHostingFromISP(geoData.isp, geoData.org);
      }

      // Calculate risk score
      const riskScore = this.calculateRiskScore(geoData, vpnData);

      // Combine all data
      const enrichment = {
        ip: ipAddress,
        
        // Geographic
        country: geoData.country,
        countryCode: geoData.countryCode,
        region: geoData.region,
        regionName: geoData.regionName,
        city: geoData.city,
        zip: geoData.zip,
        lat: geoData.lat,
        lon: geoData.lon,
        timezone: geoData.timezone,
        
        // Network
        isp: geoData.isp,
        org: geoData.org,
        as: geoData.as,
        asname: geoData.asname,
        
        // Security
        isVPN: vpnData.isVPN,
        isProxy: vpnData.isProxy,
        isHosting: vpnData.isHosting,
        isTor: vpnData.isTor || false,
        
        // Risk
        riskScore,
        riskLevel: this.getRiskLevel(riskScore),
        
        // Meta
        enrichedAt: new Date().toISOString()
      };

      // Save to cache
      this.saveToCache(ipAddress, enrichment);

      // Save to database
      await this.saveEnrichmentToDB(enrichment);

      return enrichment;
    } catch (error) {
      console.error('Error enriching IP:', error);
      return this.getDefaultEnrichment(ipAddress);
    }
  }

  /**
   * Get GeoIP data from ip-api.com (free)
   */
  async getGeoIPData(ipAddress) {
    try {
      const response = await axios.get(
        `http://ip-api.com/json/${ipAddress}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,asname`
      );

      const data = response.data;

      if (data.status === 'fail') {
        throw new Error(data.message || 'GeoIP lookup failed');
      }

      return {
        country: data.country || 'Unknown',
        countryCode: data.countryCode || 'XX',
        region: data.region || '',
        regionName: data.regionName || '',
        city: data.city || 'Unknown',
        zip: data.zip || '',
        lat: data.lat || 0,
        lon: data.lon || 0,
        timezone: data.timezone || '',
        isp: data.isp || 'Unknown',
        org: data.org || '',
        as: data.as || '',
        asname: data.asname || ''
      };
    } catch (error) {
      console.error('Error getting GeoIP data:', error.message);
      return this.getDefaultGeoData();
    }
  }

  /**
   * Get VPN/Proxy data from IPHub (requires API key)
   */
  async getVPNData(ipAddress) {
    try {
      if (!process.env.IPHUB_API_KEY) {
        return { isVPN: false, isProxy: false, isHosting: false };
      }

      const response = await axios.get(
        `https://v2.api.iphub.info/ip/${ipAddress}`,
        {
          headers: { 'X-Key': process.env.IPHUB_API_KEY }
        }
      );

      const data = response.data;

      // IPHub block types:
      // 0 = Residential/Unclassified
      // 1 = VPN/Proxy/Hosting
      // 2 = Tor
      const block = data.block || 0;

      return {
        isVPN: block === 1,
        isProxy: block === 1,
        isHosting: block === 1,
        isTor: block === 2,
        blockType: block
      };
    } catch (error) {
      console.error('Error getting VPN data:', error.message);
      return { isVPN: false, isProxy: false, isHosting: false };
    }
  }

  /**
   * Detect hosting/data center from ISP name (fallback)
   */
  detectHostingFromISP(isp, org) {
    const hostingKeywords = [
      'amazon', 'aws', 'google cloud', 'microsoft azure', 'digitalocean',
      'linode', 'vultr', 'ovh', 'hetzner', 'hosting', 'data center',
      'datacenter', 'server', 'vps', 'cloud', 'colocation'
    ];

    const text = `${isp} ${org}`.toLowerCase();
    const isHosting = hostingKeywords.some(keyword => text.includes(keyword));

    return {
      isVPN: false,
      isProxy: false,
      isHosting,
      isTor: false
    };
  }

  /**
   * Calculate risk score (0-100)
   */
  calculateRiskScore(geoData, vpnData) {
    let score = 0;

    // VPN/Proxy = high risk
    if (vpnData.isVPN || vpnData.isProxy) score += 40;
    if (vpnData.isTor) score += 50;

    // Hosting/Data Center = medium risk
    if (vpnData.isHosting) score += 25;

    // High-risk countries (example - customize based on your business)
    const highRiskCountries = ['CN', 'RU', 'NG', 'PK'];
    if (highRiskCountries.includes(geoData.countryCode)) {
      score += 15;
    }

    // Unknown ISP = slight risk
    if (geoData.isp === 'Unknown' || !geoData.isp) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Get risk level from score
   */
  getRiskLevel(score) {
    if (score >= 70) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 30) return 'medium';
    if (score >= 10) return 'low';
    return 'safe';
  }

  /**
   * Rate limiting
   */
  async rateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Cache management
   */
  getFromCache(ipAddress) {
    const cached = this.cache.get(ipAddress);
    if (!cached) return null;

    // Check expiry
    const age = Date.now() - new Date(cached.enrichedAt).getTime();
    if (age > this.cacheExpiry) {
      this.cache.delete(ipAddress);
      return null;
    }

    return cached;
  }

  saveToCache(ipAddress, enrichment) {
    this.cache.set(ipAddress, enrichment);

    // Limit cache size
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  /**
   * Save enrichment to database
   */
  async saveEnrichmentToDB(enrichment) {
    try {
      const { data, error } = await supabase
        .from('ip_enrichments')
        .upsert({
          ip_address: enrichment.ip,
          country: enrichment.country,
          country_code: enrichment.countryCode,
          region: enrichment.region,
          city: enrichment.city,
          latitude: enrichment.lat,
          longitude: enrichment.lon,
          timezone: enrichment.timezone,
          isp: enrichment.isp,
          organization: enrichment.org,
          asn: enrichment.as,
          is_vpn: enrichment.isVPN,
          is_proxy: enrichment.isProxy,
          is_hosting: enrichment.isHosting,
          is_tor: enrichment.isTor,
          risk_score: enrichment.riskScore,
          risk_level: enrichment.riskLevel,
          enriched_at: enrichment.enrichedAt
        }, {
          onConflict: 'ip_address'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving enrichment to DB:', error);
      return null;
    }
  }

  /**
   * Get enrichment from database
   */
  async getEnrichmentFromDB(ipAddress) {
    try {
      const { data, error } = await supabase
        .from('ip_enrichments')
        .select('*')
        .eq('ip_address', ipAddress)
        .single();

      if (error) throw error;

      // Check if data is fresh (24 hours)
      const age = Date.now() - new Date(data.enriched_at).getTime();
      if (age > this.cacheExpiry) {
        return null;
      }

      return {
        ip: data.ip_address,
        country: data.country,
        countryCode: data.country_code,
        region: data.region,
        city: data.city,
        lat: data.latitude,
        lon: data.longitude,
        timezone: data.timezone,
        isp: data.isp,
        org: data.organization,
        as: data.asn,
        isVPN: data.is_vpn,
        isProxy: data.is_proxy,
        isHosting: data.is_hosting,
        isTor: data.is_tor,
        riskScore: data.risk_score,
        riskLevel: data.risk_level,
        enrichedAt: data.enriched_at
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Default enrichment for invalid IPs
   */
  getDefaultEnrichment(ipAddress) {
    return {
      ip: ipAddress,
      country: 'Unknown',
      countryCode: 'XX',
      region: '',
      city: 'Unknown',
      isp: 'Unknown',
      org: '',
      isVPN: false,
      isProxy: false,
      isHosting: false,
      riskScore: 0,
      riskLevel: 'safe',
      enrichedAt: new Date().toISOString()
    };
  }

  getDefaultGeoData() {
    return {
      country: 'Unknown',
      countryCode: 'XX',
      region: '',
      regionName: '',
      city: 'Unknown',
      zip: '',
      lat: 0,
      lon: 0,
      timezone: '',
      isp: 'Unknown',
      org: '',
      as: '',
      asname: ''
    };
  }

  /**
   * Batch enrich multiple IPs
   */
  async enrichBatch(ipAddresses) {
    const results = [];

    for (const ip of ipAddresses) {
      const enrichment = await this.enrichIP(ip);
      results.push(enrichment);
    }

    return results;
  }
}

module.exports = new IPEnrichmentService();