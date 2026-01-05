/*
 * APIDocService.js - API Documentation & Management
 * 
 * מערכת ניהול API:
 * - API Keys Generation & Management
 * - Rate Limiting per API Key
 * - Usage Tracking & Analytics
 * - API Documentation (Swagger/OpenAPI)
 * - Request Logging
 * - API Versioning
 */

const crypto = require('crypto');
const supabase = require('../config/supabase');

class APIDocService {
  constructor() {
    // הגדרות Rate Limiting
    this.rateLimits = {
      free: {
        requestsPerMinute: 60,
        requestsPerHour: 1000,
        requestsPerDay: 10000
      },
      pro: {
        requestsPerMinute: 300,
        requestsPerHour: 10000,
        requestsPerDay: 100000
      },
      enterprise: {
        requestsPerMinute: 1000,
        requestsPerHour: 50000,
        requestsPerDay: 500000
      }
    };
  }

  /**
   * יצירת API Key חדש
   */
  async generateAPIKey(userId, accountId, keyData) {
    try {
      const {
        name,
        description = '',
        tier = 'free',
        permissions = ['read'],
        expiresInDays = 365
      } = keyData;

      // יצירת מפתח ייחודי
      const apiKey = this.createSecureKey();
      const hashedKey = this.hashKey(apiKey);

      // תאריך תפוגה
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      // שמירה ל-DB
      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          user_id: userId,
          ad_account_id: accountId,
          name,
          description,
          key_hash: hashedKey,
          tier,
          permissions,
          rate_limit: this.rateLimits[tier],
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString(),
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ API Key נוצר:', name);

      // מחזירים את המפתח המלא רק פעם אחת!
      return {
        ...data,
        apiKey: `mad_${apiKey}`, // MagenAd prefix
        message: 'שמור את המפתח במקום בטוח! לא ניתן לצפות בו שוב'
      };
    } catch (error) {
      console.error('שגיאה ביצירת API Key:', error);
      throw error;
    }
  }

  /**
   * יצירת מפתח אקראי מאובטח
   */
  createSecureKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash של המפתח לשמירה
   */
  hashKey(key) {
    return crypto
      .createHash('sha256')
      .update(key)
      .digest('hex');
  }

  /**
   * אימות API Key
   */
  async validateAPIKey(apiKey) {
    try {
      // הסרת prefix
      const key = apiKey.replace('mad_', '');
      const hashedKey = this.hashKey(key);

      // חיפוש במסד נתונים
      const { data: keyData, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('key_hash', hashedKey)
        .eq('status', 'active')
        .single();

      if (error || !keyData) {
        return { valid: false, error: 'מפתח לא תקין' };
      }

      // בדיקת תפוגה
      if (new Date(keyData.expires_at) < new Date()) {
        return { valid: false, error: 'מפתח פג תוקף' };
      }

      // בדיקת Rate Limit
      const withinLimit = await this.checkRateLimit(keyData.id, keyData.rate_limit);
      if (!withinLimit) {
        return { valid: false, error: 'חרגת ממגבלת הקצב' };
      }

      // עדכון שימוש אחרון
      await this.updateLastUsed(keyData.id);

      return {
        valid: true,
        keyData: {
          id: keyData.id,
          userId: keyData.user_id,
          accountId: keyData.ad_account_id,
          tier: keyData.tier,
          permissions: keyData.permissions
        }
      };
    } catch (error) {
      console.error('שגיאה באימות API Key:', error);
      return { valid: false, error: 'שגיאה באימות' };
    }
  }

  /**
   * בדיקת Rate Limit
   */
  async checkRateLimit(keyId, limits) {
    try {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // ספירת בקשות
      const [perMinute, perHour, perDay] = await Promise.all([
        this.countRequests(keyId, oneMinuteAgo),
        this.countRequests(keyId, oneHourAgo),
        this.countRequests(keyId, oneDayAgo)
      ]);

      if (perMinute >= limits.requestsPerMinute) {
        return false;
      }
      if (perHour >= limits.requestsPerHour) {
        return false;
      }
      if (perDay >= limits.requestsPerDay) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('שגיאה בבדיקת Rate Limit:', error);
      return false;
    }
  }

  /**
   * ספירת בקשות
   */
  async countRequests(keyId, since) {
    const { count } = await supabase
      .from('api_requests')
      .select('id', { count: 'exact', head: true })
      .eq('api_key_id', keyId)
      .gte('timestamp', since.toISOString());

    return count || 0;
  }

  /**
   * רישום בקשת API
   */
  async logRequest(keyId, request) {
    try {
      const {
        method,
        endpoint,
        statusCode,
        responseTime,
        userAgent,
        ipAddress
      } = request;

      await supabase
        .from('api_requests')
        .insert({
          api_key_id: keyId,
          method,
          endpoint,
          status_code: statusCode,
          response_time: responseTime,
          user_agent: userAgent,
          ip_address: ipAddress,
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('שגיאה ברישום בקשה:', error);
    }
  }

  /**
   * עדכון שימוש אחרון
   */
  async updateLastUsed(keyId) {
    await supabase
      .from('api_keys')
      .update({
        last_used_at: new Date().toISOString()
      })
      .eq('id', keyId);
  }

  /**
   * קבלת כל המפתחות של משתמש
   */
  async getUserAPIKeys(userId, accountId = null) {
    try {
      let query = supabase
        .from('api_keys')
        .select('id, name, description, tier, permissions, status, created_at, last_used_at, expires_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (accountId) {
        query = query.eq('ad_account_id', accountId);
      }

      const { data } = await query;
      return data || [];
    } catch (error) {
      console.error('שגיאה בשליפת מפתחות:', error);
      return [];
    }
  }

  /**
   * ביטול מפתח
   */
  async revokeAPIKey(userId, keyId) {
    try {
      // בדיקה שהמפתח שייך למשתמש
      const { data: key } = await supabase
        .from('api_keys')
        .select('user_id')
        .eq('id', keyId)
        .single();

      if (!key || key.user_id !== userId) {
        throw new Error('מפתח לא נמצא');
      }

      // ביטול
      await supabase
        .from('api_keys')
        .update({
          status: 'revoked',
          revoked_at: new Date().toISOString()
        })
        .eq('id', keyId);

      console.log('✅ API Key בוטל:', keyId);
    } catch (error) {
      console.error('שגיאה בביטול מפתח:', error);
      throw error;
    }
  }

  /**
   * סטטיסטיקות שימוש ב-API
   */
  async getUsageStats(keyId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // סה"כ בקשות
      const { count: totalRequests } = await supabase
        .from('api_requests')
        .select('id', { count: 'exact', head: true })
        .eq('api_key_id', keyId)
        .gte('timestamp', startDate.toISOString());

      // בקשות לפי סטטוס
      const { data: requests } = await supabase
        .from('api_requests')
        .select('status_code, response_time')
        .eq('api_key_id', keyId)
        .gte('timestamp', startDate.toISOString());

      const statusCodes = {};
      let totalResponseTime = 0;

      (requests || []).forEach(req => {
        statusCodes[req.status_code] = (statusCodes[req.status_code] || 0) + 1;
        totalResponseTime += req.response_time || 0;
      });

      const avgResponseTime = requests && requests.length > 0
        ? (totalResponseTime / requests.length).toFixed(0)
        : 0;

      // בקשות לפי endpoint
      const { data: endpoints } = await supabase
        .from('api_requests')
        .select('endpoint')
        .eq('api_key_id', keyId)
        .gte('timestamp', startDate.toISOString());

      const endpointCounts = {};
      (endpoints || []).forEach(e => {
        endpointCounts[e.endpoint] = (endpointCounts[e.endpoint] || 0) + 1;
      });

      return {
        totalRequests: totalRequests || 0,
        avgResponseTime: `${avgResponseTime}ms`,
        statusCodes,
        topEndpoints: Object.entries(endpointCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([endpoint, count]) => ({ endpoint, count })),
        period: `${days} ימים`
      };
    } catch (error) {
      console.error('שגיאה בשליפת סטטיסטיקות:', error);
      throw error;
    }
  }

  /**
   * תיעוד API - OpenAPI/Swagger Schema
   */
  getAPIDocumentation() {
    return {
      openapi: '3.0.0',
      info: {
        title: 'MagenAd API',
        version: '1.0.0',
        description: 'API למערכת זיהוי הונאות בפרסום Google Ads',
        contact: {
          name: 'MagenAd Support',
          email: 'support@magenad.com'
        }
      },
      servers: [
        {
          url: 'https://api.magenad.com/v1',
          description: 'Production Server'
        },
        {
          url: 'http://localhost:3001/api',
          description: 'Development Server'
        }
      ],
      security: [
        {
          ApiKeyAuth: []
        }
      ],
      components: {
        securitySchemes: {
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key'
          }
        },
        schemas: {
          Click: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              ip_address: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' },
              device_type: { type: 'string' },
              cost: { type: 'number' },
              risk_score: { type: 'integer' }
            }
          },
          Detection: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              pattern_type: { type: 'string' },
              severity: { type: 'string' },
              fraud_score: { type: 'integer' },
              detected_at: { type: 'string', format: 'date-time' }
            }
          }
        }
      },
      paths: {
        '/clicks/{accountId}': {
          get: {
            summary: 'קבלת קליקים',
            parameters: [
              {
                name: 'accountId',
                in: 'path',
                required: true,
                schema: { type: 'string' }
              },
              {
                name: 'limit',
                in: 'query',
                schema: { type: 'integer', default: 100 }
              }
            ],
            responses: {
              200: {
                description: 'רשימת קליקים',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Click' }
                    }
                  }
                }
              },
              401: { description: 'Unauthorized' },
              429: { description: 'Rate Limit Exceeded' }
            }
          }
        },
        '/detections/{accountId}': {
          get: {
            summary: 'קבלת זיהויים',
            parameters: [
              {
                name: 'accountId',
                in: 'path',
                required: true,
                schema: { type: 'string' }
              }
            ],
            responses: {
              200: {
                description: 'רשימת זיהויים',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Detection' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };
  }

  /**
   * קבלת תיעוד HTML
   */
  getHTMLDocumentation() {
    const docs = this.getAPIDocumentation();
    
    return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <title>MagenAd API Documentation</title>
  <style>
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      border-radius: 10px;
      margin-bottom: 30px;
    }
    .endpoint {
      background: white;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .method {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-weight: bold;
      margin-left: 10px;
    }
    .get { background: #10b981; color: white; }
    .post { background: #3b82f6; color: white; }
    code {
      background: #f3f4f6;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🛡️ MagenAd API Documentation</h1>
    <p>גרסה 1.0.0 | תיעוד API מלא למערכת זיהוי הונאות</p>
  </div>
  
  <h2>🔑 אימות</h2>
  <p>כל הבקשות דורשות API Key בכותרת:</p>
  <code>X-API-Key: mad_your_api_key_here</code>
  
  <h2>📡 Endpoints</h2>
  ${Object.entries(docs.paths).map(([path, methods]) => `
    <div class="endpoint">
      <h3>${path}</h3>
      ${Object.entries(methods).map(([method, details]) => `
        <div>
          <span class="method ${method}">${method.toUpperCase()}</span>
          <strong>${details.summary}</strong>
          <p>${details.description || ''}</p>
        </div>
      `).join('')}
    </div>
  `).join('')}
  
  <h2>📊 Rate Limits</h2>
  <ul>
    <li><strong>Free:</strong> 60/דקה, 1,000/שעה, 10,000/יום</li>
    <li><strong>Pro:</strong> 300/דקה, 10,000/שעה, 100,000/יום</li>
    <li><strong>Enterprise:</strong> 1,000/דקה, 50,000/שעה, 500,000/יום</li>
  </ul>
</body>
</html>
    `;
  }
}

module.exports = new APIDocService();