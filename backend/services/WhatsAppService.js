/*
 * WhatsAppService.js
 * 
 * שירות לשליחת הודעות WhatsApp דרך WhatsApp Business API
 * 
 * תפקיד:
 * - שליחת דוחות חודשיים
 * - שליחת התראות דחופות
 * - ניהול retry logic
 * 
 * דרישות:
 * - WhatsApp Business Account
 * - Phone Number ID
 * - Access Token
 * 
 * Environment Variables:
 * - WHATSAPP_PHONE_NUMBER_ID
 * - WHATSAPP_ACCESS_TOKEN
 */

const axios = require('axios');

class WhatsAppService {
  constructor() {
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    
    if (!this.phoneNumberId || !this.accessToken) {
      console.warn('⚠️  WhatsApp credentials not configured. WhatsAppService will not work.');
    }
    
    this.apiUrl = this.phoneNumberId 
      ? `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`
      : null;
    
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  /**
   * שליחת הודעה טקסט
   * 
   * @param {string} recipient - מספר טלפון בפורמט +972501234567
   * @param {string} message - תוכן ההודעה
   * @returns {Promise<Object>} { success: boolean, messageId?: string, error?: string }
   */
  async sendMessage(recipient, message) {
    if (!this.apiUrl) {
      return { success: false, error: 'WhatsApp not configured' };
    }

    try {
      // Normalize phone number
      const normalizedRecipient = this.normalizePhoneNumber(recipient);
      
      if (!normalizedRecipient) {
        return { success: false, error: 'Invalid phone number format' };
      }

      // Retry logic
      let lastError;
      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          const response = await axios.post(
            this.apiUrl,
            {
              messaging_product: 'whatsapp',
              to: normalizedRecipient,
              type: 'text',
              text: {
                body: message
              }
            },
            {
              headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
              },
              timeout: 10000
            }
          );

          const messageId = response.data?.messages?.[0]?.id;
          
          console.log(`✅ WhatsApp message sent to ${normalizedRecipient} (attempt ${attempt})`);
          
          return {
            success: true,
            messageId: messageId
          };
        } catch (error) {
          lastError = error;
          
          // Check if it's a retryable error
          if (this.isRetryableError(error) && attempt < this.maxRetries) {
            console.log(`⚠️  WhatsApp send failed (attempt ${attempt}), retrying...`);
            await this.delay(this.retryDelay * attempt);
            continue;
          }
          
          // Non-retryable or last attempt
          throw error;
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      console.error('WhatsApp send failed:', errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * שליחת דוח חודשי
   * 
   * @param {string} recipient - מספר טלפון
   * @param {Object} report - נתוני הדוח
   * @returns {Promise<Object>} { success: boolean, messageId?: string, error?: string }
   */
  async sendMonthlyReport(recipient, report) {
    const message = this.formatMonthlyReportMessage(report);
    return await this.sendMessage(recipient, message);
  }

  /**
   * עיצוב הודעת דוח חודשי
   * 
   * @param {Object} report - נתוני הדוח
   * @returns {string} הודעה מעוצבת
   */
  formatMonthlyReportMessage(report) {
    const emoji = report.quiet_status === 'quiet' ? '🟢'
                : report.quiet_status === 'normal' ? '🟡'
                : '🔴';
    
    const monthNames = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 
                       'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
    const monthName = monthNames[report.report_month - 1] || report.report_month;
    
    return `
*דוח חודשי - MagenAd* ${emoji}

📅 *${monthName} ${report.report_year}*

📊 *סיכום:*
• נבדקו: ${report.total_clicks?.toLocaleString('he-IL') || 0} קליקים
• חשודים: ${report.total_detections || 0}
• פעולות: ${report.total_actions_taken || 0}

${emoji} *מדד שקט:* ${report.quiet_index || 100}/100

💰 *הערכת חיסכון:* ${report.estimated_saved_amount?.toFixed(2) || 0} ₪

🔍 המערכת פעילה ${report.system_active_days || 0} ימים
⚙️ בוצעו ${report.scans_performed || 0} סריקות

🔗 לפירוט מלא: https://app.magenad.com
    `.trim();
  }

  /**
   * נורמליזציה של מספר טלפון
   * 
   * @param {string} phone - מספר טלפון
   * @returns {string|null} מספר מנורמל או null
   */
  normalizePhoneNumber(phone) {
    if (!phone) return null;
    
    // Remove all non-digit characters except +
    let normalized = phone.replace(/[^\d+]/g, '');
    
    // If starts with 0, replace with +972
    if (normalized.startsWith('0')) {
      normalized = '+972' + normalized.substring(1);
    }
    
    // If doesn't start with +, add +972
    if (!normalized.startsWith('+')) {
      normalized = '+972' + normalized;
    }
    
    // Validate format: +972XXXXXXXXX (10 digits after country code)
    if (!/^\+972\d{9}$/.test(normalized)) {
      return null;
    }
    
    return normalized;
  }

  /**
   * בדיקה אם שגיאה ניתנת לניסיון חוזר
   */
  isRetryableError(error) {
    if (!error.response) {
      return true; // Network error - retry
    }
    
    const status = error.response.status;
    
    // Retry on 5xx errors and rate limits
    return status >= 500 || status === 429;
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new WhatsAppService();
