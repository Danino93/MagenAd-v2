/*
 * WebhookService.js - מערכת Webhooks
 * 
 * מערכת webhooks מלאה:
 * - Webhook Registration & Management
 * - Event Triggers (click, detection, alert, etc.)
 * - Payload Builder
 * - Retry Mechanism (exponential backoff)
 * - Security (HMAC signatures)
 * - Webhook Testing
 * - Delivery Logs
 */

const crypto = require('crypto');
const axios = require('axios');
const supabase = require('../config/supabase');

class WebhookService {
  constructor() {
    // סוגי אירועים נתמכים
    this.eventTypes = {
      'click.created': 'קליק חדש נוצר',
      'detection.created': 'זיהוי הונאה חדש',
      'alert.triggered': 'התראה הופעלה',
      'alert.resolved': 'התראה נפתרה',
      'qi.updated': 'Quiet Index עודכן',
      'ip.blocked': 'IP נחסם',
      'report.generated': 'דוח נוצר',
      'account.updated': 'חשבון עודכן'
    };

    // הגדרות retry
    this.retryConfig = {
      maxAttempts: 5,
      baseDelay: 1000, // 1 שנייה
      maxDelay: 60000  // 60 שניות
    };
  }

  /**
   * רישום webhook חדש
   */
  async registerWebhook(accountId, userId, webhookData) {
    try {
      const {
        url,
        events = [],
        description = '',
        secret = null
      } = webhookData;

      // ולידציה
      if (!this.isValidURL(url)) {
        throw new Error('URL לא תקין');
      }

      if (events.length === 0) {
        throw new Error('חייב לבחור לפחות אירוע אחד');
      }

      // וולידציה שהאירועים תקינים
      const invalidEvents = events.filter(e => !this.eventTypes[e]);
      if (invalidEvents.length > 0) {
        throw new Error(`אירועים לא תקינים: ${invalidEvents.join(', ')}`);
      }

      // יצירת secret אם לא סופק
      const webhookSecret = secret || this.generateSecret();

      // שמירה
      const { data, error } = await supabase
        .from('webhooks')
        .insert({
          ad_account_id: accountId,
          user_id: userId,
          url,
          events,
          description,
          secret: webhookSecret,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Webhook נרשם:', url);
      return {
        ...data,
        secret: webhookSecret // מחזירים פעם אחת בלבד!
      };
    } catch (error) {
      console.error('שגיאה ברישום webhook:', error);
      throw error;
    }
  }

  /**
   * בדיקת URL תקין
   */
  isValidURL(url) {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * יצירת secret אקראי
   */
  generateSecret() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * שליחת webhook
   */
  async triggerWebhook(accountId, eventType, payload) {
    try {
      // מציאת webhooks רלוונטיים
      const { data: webhooks } = await supabase
        .from('webhooks')
        .select('*')
        .eq('ad_account_id', accountId)
        .eq('status', 'active')
        .contains('events', [eventType]);

      if (!webhooks || webhooks.length === 0) {
        console.log(`אין webhooks עבור ${eventType}`);
        return;
      }

      console.log(`שולח ${webhooks.length} webhooks עבור ${eventType}`);

      // שליחה לכל webhook
      const deliveries = await Promise.all(
        webhooks.map(webhook => this.deliverWebhook(webhook, eventType, payload))
      );

      return deliveries;
    } catch (error) {
      console.error('שגיאה בהפעלת webhooks:', error);
      throw error;
    }
  }

  /**
   * משלוח webhook בודד
   */
  async deliverWebhook(webhook, eventType, payload, attempt = 1) {
    const deliveryId = crypto.randomBytes(16).toString('hex');
    const timestamp = new Date().toISOString();

    try {
      // בניית payload
      const fullPayload = {
        id: deliveryId,
        event: eventType,
        timestamp,
        data: payload,
        account_id: webhook.ad_account_id
      };

      // חישוב signature
      const signature = this.calculateSignature(fullPayload, webhook.secret);

      // שליחה
      const startTime = Date.now();
      const response = await axios.post(webhook.url, fullPayload, {
        headers: {
          'Content-Type': 'application/json',
          'X-MagenAd-Signature': signature,
          'X-MagenAd-Event': eventType,
          'X-MagenAd-Delivery': deliveryId,
          'User-Agent': 'MagenAd-Webhooks/1.0'
        },
        timeout: 10000 // 10 שניות
      });

      const duration = Date.now() - startTime;

      // רישום הצלחה
      await this.logDelivery(webhook.id, deliveryId, {
        event: eventType,
        status: 'success',
        statusCode: response.status,
        duration,
        attempt
      });

      console.log(`✅ Webhook נשלח: ${webhook.url} (${duration}ms)`);
      return { success: true, deliveryId, duration };

    } catch (error) {
      const duration = Date.now() - Date.parse(timestamp);
      const statusCode = error.response?.status || 0;

      // רישום כשלון
      await this.logDelivery(webhook.id, deliveryId, {
        event: eventType,
        status: 'failed',
        statusCode,
        duration,
        attempt,
        error: error.message
      });

      // ניסיון חוזר?
      if (attempt < this.retryConfig.maxAttempts) {
        const delay = this.calculateRetryDelay(attempt);
        console.log(`⚠️ Webhook נכשל, ניסיון ${attempt}. ניסיון חוזר בעוד ${delay}ms`);
        
        await this.sleep(delay);
        return this.deliverWebhook(webhook, eventType, payload, attempt + 1);
      }

      console.error(`❌ Webhook נכשל לחלוטין: ${webhook.url}`);
      return { success: false, deliveryId, error: error.message };
    }
  }

  /**
   * חישוב signature
   */
  calculateSignature(payload, secret) {
    const data = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('hex');
  }

  /**
   * אימות signature
   */
  verifySignature(payload, signature, secret) {
    const calculated = this.calculateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(calculated)
    );
  }

  /**
   * חישוב זמן המתנה לניסיון חוזר (exponential backoff)
   */
  calculateRetryDelay(attempt) {
    const delay = this.retryConfig.baseDelay * Math.pow(2, attempt - 1);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  /**
   * המתנה
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * רישום משלוח
   */
  async logDelivery(webhookId, deliveryId, details) {
    try {
      await supabase
        .from('webhook_deliveries')
        .insert({
          webhook_id: webhookId,
          delivery_id: deliveryId,
          event_type: details.event,
          status: details.status,
          status_code: details.statusCode,
          duration_ms: details.duration,
          attempt: details.attempt,
          error_message: details.error || null,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('שגיאה ברישום delivery:', error);
    }
  }

  /**
   * קבלת webhooks של חשבון
   */
  async getWebhooks(accountId) {
    try {
      const { data } = await supabase
        .from('webhooks')
        .select('id, url, events, description, status, created_at, last_triggered_at')
        .eq('ad_account_id', accountId)
        .order('created_at', { ascending: false });

      return data || [];
    } catch (error) {
      console.error('שגיאה בשליפת webhooks:', error);
      return [];
    }
  }

  /**
   * עדכון webhook
   */
  async updateWebhook(webhookId, accountId, updates) {
    try {
      const { data } = await supabase
        .from('webhooks')
        .update(updates)
        .eq('id', webhookId)
        .eq('ad_account_id', accountId)
        .select()
        .single();

      console.log('✅ Webhook עודכן:', webhookId);
      return data;
    } catch (error) {
      console.error('שגיאה בעדכון webhook:', error);
      throw error;
    }
  }

  /**
   * מחיקת webhook
   */
  async deleteWebhook(webhookId, accountId) {
    try {
      await supabase
        .from('webhooks')
        .delete()
        .eq('id', webhookId)
        .eq('ad_account_id', accountId);

      console.log('✅ Webhook נמחק:', webhookId);
    } catch (error) {
      console.error('שגיאה במחיקת webhook:', error);
      throw error;
    }
  }

  /**
   * בדיקת webhook (test delivery)
   */
  async testWebhook(webhookId, accountId) {
    try {
      // שליפת webhook
      const { data: webhook } = await supabase
        .from('webhooks')
        .select('*')
        .eq('id', webhookId)
        .eq('ad_account_id', accountId)
        .single();

      if (!webhook) {
        throw new Error('Webhook לא נמצא');
      }

      // payload לבדיקה
      const testPayload = {
        test: true,
        message: 'זוהי בדיקת webhook מ-MagenAd',
        timestamp: new Date().toISOString()
      };

      // שליחה
      const result = await this.deliverWebhook(webhook, 'test.webhook', testPayload);

      return result;
    } catch (error) {
      console.error('שגיאה בבדיקת webhook:', error);
      throw error;
    }
  }

  /**
   * קבלת היסטוריית משלוחים
   */
  async getDeliveries(webhookId, limit = 50) {
    try {
      const { data } = await supabase
        .from('webhook_deliveries')
        .select('*')
        .eq('webhook_id', webhookId)
        .order('created_at', { ascending: false })
        .limit(limit);

      return data || [];
    } catch (error) {
      console.error('שגיאה בשליפת deliveries:', error);
      return [];
    }
  }

  /**
   * סטטיסטיקות webhook
   */
  async getWebhookStats(webhookId, days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: deliveries } = await supabase
        .from('webhook_deliveries')
        .select('status, duration_ms, attempt')
        .eq('webhook_id', webhookId)
        .gte('created_at', startDate.toISOString());

      if (!deliveries || deliveries.length === 0) {
        return {
          total: 0,
          success: 0,
          failed: 0,
          successRate: '0',
          avgDuration: '0ms'
        };
      }

      const total = deliveries.length;
      const success = deliveries.filter(d => d.status === 'success').length;
      const failed = total - success;
      const successRate = ((success / total) * 100).toFixed(1);

      const totalDuration = deliveries.reduce((sum, d) => sum + (d.duration_ms || 0), 0);
      const avgDuration = Math.round(totalDuration / total);

      return {
        total,
        success,
        failed,
        successRate: `${successRate}%`,
        avgDuration: `${avgDuration}ms`,
        period: `${days} ימים`
      };
    } catch (error) {
      console.error('שגיאה בחישוב סטטיסטיקות:', error);
      throw error;
    }
  }

  /**
   * השבתת webhook אוטומטית אחרי כשלונות רבים
   */
  async checkAndDisableFailingWebhook(webhookId) {
    try {
      // בדיקה של 10 המשלוחים האחרונים
      const { data: recent } = await supabase
        .from('webhook_deliveries')
        .select('status')
        .eq('webhook_id', webhookId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!recent || recent.length < 10) {
        return; // לא מספיק נתונים
      }

      // אם כולם נכשלו
      const allFailed = recent.every(d => d.status === 'failed');
      if (allFailed) {
        await supabase
          .from('webhooks')
          .update({
            status: 'disabled',
            disabled_reason: 'כשלונות רבים ברציפות',
            disabled_at: new Date().toISOString()
          })
          .eq('id', webhookId);

        console.log('⚠️ Webhook הושבת אוטומטית:', webhookId);
      }
    } catch (error) {
      console.error('שגיאה בבדיקת webhook:', error);
    }
  }

  /**
   * קבלת כל סוגי האירועים
   */
  getEventTypes() {
    return Object.entries(this.eventTypes).map(([key, description]) => ({
      key,
      description
    }));
  }
}

module.exports = new WebhookService();