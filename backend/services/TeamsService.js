/*
 * TeamsService.js - אינטגרציה עם Microsoft Teams
 * 
 * תכונות:
 * - Teams Webhook Integration
 * - Adaptive Cards
 * - Alert Notifications
 * - Daily Reports
 * - Rich Formatting
 * - Action Buttons
 */

const axios = require('axios');
const supabase = require('../config/supabase');

class TeamsService {
  /**
   * שמירת Teams webhook
   */
  async saveWebhook(accountId, userId, webhookData) {
    try {
      const { webhook_url, channel_name, description = '' } = webhookData;

      // ולידציה
      if (!webhook_url.includes('webhook.office.com')) {
        throw new Error('URL לא תקין של Teams');
      }

      const { data, error } = await supabase
        .from('teams_integrations')
        .insert({
          ad_account_id: accountId,
          user_id: userId,
          webhook_url,
          channel_name,
          description,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Teams webhook נשמר:', channel_name);
      return data;
    } catch (error) {
      console.error('שגיאה בשמירת Teams webhook:', error);
      throw error;
    }
  }

  /**
   * שליחת Adaptive Card
   */
  async sendCard(accountId, card) {
    try {
      const integration = await this.getIntegration(accountId);
      if (!integration) {
        throw new Error('Teams לא מחובר');
      }

      const response = await axios.post(integration.webhook_url, card, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ כרטיס נשלח ל-Teams');
      return response.data;
    } catch (error) {
      console.error('שגיאה בשליחה ל-Teams:', error);
      throw error;
    }
  }

  /**
   * שליחת התראת הונאה
   */
  async sendFraudAlert(accountId, detection) {
    try {
      const {
        pattern_type,
        severity,
        fraud_score,
        ip_address,
        detected_at,
        id
      } = detection;

      // צבעים לפי חומרה
      const colors = {
        critical: 'attention',  // אדום
        high: 'warning',        // כתום
        medium: 'good',         // ירוק
        low: 'default'          // אפור
      };

      const card = {
        type: 'message',
        attachments: [
          {
            contentType: 'application/vnd.microsoft.card.adaptive',
            content: {
              type: 'AdaptiveCard',
              version: '1.4',
              body: [
                {
                  type: 'Container',
                  style: colors[severity] || 'default',
                  items: [
                    {
                      type: 'TextBlock',
                      text: '🚨 התראת הונאה חדשה!',
                      size: 'Large',
                      weight: 'Bolder',
                      color: 'Attention'
                    }
                  ]
                },
                {
                  type: 'FactSet',
                  facts: [
                    {
                      title: 'סוג זיהוי:',
                      value: this.translatePattern(pattern_type)
                    },
                    {
                      title: 'חומרה:',
                      value: severity
                    },
                    {
                      title: 'ציון הונאה:',
                      value: `${fraud_score}/100`
                    },
                    {
                      title: 'כתובת IP:',
                      value: ip_address
                    },
                    {
                      title: 'זמן זיהוי:',
                      value: new Date(detected_at).toLocaleString('he-IL')
                    }
                  ]
                },
                {
                  type: 'TextBlock',
                  text: '⚠️ מומלץ לבדוק את הזיהוי ולשקול חסימת ה-IP',
                  wrap: true,
                  color: 'Warning'
                }
              ],
              actions: [
                {
                  type: 'Action.OpenUrl',
                  title: '🔍 פרטים מלאים',
                  url: `https://app.magenad.com/detections/${id}`
                },
                {
                  type: 'Action.OpenUrl',
                  title: '🚫 חסום IP',
                  url: `https://app.magenad.com/ip-blocking?ip=${ip_address}`
                }
              ]
            }
          }
        ]
      };

      await this.sendCard(accountId, card);
      console.log('✅ התראה נשלחה ל-Teams');
    } catch (error) {
      console.error('שגיאה בשליחת התראה:', error);
    }
  }

  /**
   * תרגום pattern
   */
  translatePattern(pattern) {
    const translations = {
      'same_ip_multiple_clicks': 'קליקים מרובים מ-IP זהה',
      'rapid_consecutive_clicks': 'קליקים רצופים מהירים',
      'vpn_proxy_detection': 'זיהוי VPN/Proxy',
      'hosting_provider': 'קליק מ-Hosting Provider',
      'off_hours_activity': 'פעילות בשעות לא רגילות',
      'geographic_anomaly': 'חריגה גיאוגרפית',
      'device_inconsistency': 'אי התאמת מכשיר'
    };

    return translations[pattern] || pattern;
  }

  /**
   * שליחת דוח יומי
   */
  async sendDailyReport(accountId, reportData) {
    try {
      const {
        date,
        clicks,
        detections,
        fraudRate,
        cost,
        costSaved,
        qiAverage
      } = reportData;

      const card = {
        type: 'message',
        attachments: [
          {
            contentType: 'application/vnd.microsoft.card.adaptive',
            content: {
              type: 'AdaptiveCard',
              version: '1.4',
              body: [
                {
                  type: 'TextBlock',
                  text: '📊 דוח יומי - MagenAd',
                  size: 'ExtraLarge',
                  weight: 'Bolder',
                  color: 'Accent'
                },
                {
                  type: 'TextBlock',
                  text: `תאריך: ${date}`,
                  spacing: 'None',
                  color: 'Default'
                },
                {
                  type: 'Container',
                  separator: true,
                  spacing: 'Medium',
                  items: [
                    {
                      type: 'ColumnSet',
                      columns: [
                        {
                          type: 'Column',
                          width: 'stretch',
                          items: [
                            {
                              type: 'TextBlock',
                              text: '📊 קליקים',
                              weight: 'Bolder',
                              size: 'Medium'
                            },
                            {
                              type: 'TextBlock',
                              text: clicks.toLocaleString(),
                              size: 'ExtraLarge',
                              color: 'Accent'
                            }
                          ]
                        },
                        {
                          type: 'Column',
                          width: 'stretch',
                          items: [
                            {
                              type: 'TextBlock',
                              text: '🎯 זיהויים',
                              weight: 'Bolder',
                              size: 'Medium'
                            },
                            {
                              type: 'TextBlock',
                              text: detections.toLocaleString(),
                              size: 'ExtraLarge',
                              color: 'Warning'
                            }
                          ]
                        }
                      ]
                    },
                    {
                      type: 'ColumnSet',
                      spacing: 'Medium',
                      columns: [
                        {
                          type: 'Column',
                          width: 'stretch',
                          items: [
                            {
                              type: 'TextBlock',
                              text: '📈 שיעור הונאות',
                              weight: 'Bolder',
                              size: 'Medium'
                            },
                            {
                              type: 'TextBlock',
                              text: `${fraudRate}%`,
                              size: 'ExtraLarge'
                            }
                          ]
                        },
                        {
                          type: 'Column',
                          width: 'stretch',
                          items: [
                            {
                              type: 'TextBlock',
                              text: '🏆 Quiet Index',
                              weight: 'Bolder',
                              size: 'Medium'
                            },
                            {
                              type: 'TextBlock',
                              text: qiAverage.toString(),
                              size: 'ExtraLarge',
                              color: 'Good'
                            }
                          ]
                        }
                      ]
                    },
                    {
                      type: 'ColumnSet',
                      spacing: 'Medium',
                      columns: [
                        {
                          type: 'Column',
                          width: 'stretch',
                          items: [
                            {
                              type: 'TextBlock',
                              text: '💰 עלות כוללת',
                              weight: 'Bolder',
                              size: 'Medium'
                            },
                            {
                              type: 'TextBlock',
                              text: `₪${cost}`,
                              size: 'Large'
                            }
                          ]
                        },
                        {
                          type: 'Column',
                          width: 'stretch',
                          items: [
                            {
                              type: 'TextBlock',
                              text: '💎 חיסכון',
                              weight: 'Bolder',
                              size: 'Medium'
                            },
                            {
                              type: 'TextBlock',
                              text: `₪${costSaved}`,
                              size: 'Large',
                              color: 'Good'
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ],
              actions: [
                {
                  type: 'Action.OpenUrl',
                  title: '📈 דשבורד מלא',
                  url: 'https://app.magenad.com/dashboard'
                },
                {
                  type: 'Action.OpenUrl',
                  title: '📊 דוחות',
                  url: 'https://app.magenad.com/reports'
                }
              ]
            }
          }
        ]
      };

      await this.sendCard(accountId, card);
      console.log('✅ דוח יומי נשלח ל-Teams');
    } catch (error) {
      console.error('שגיאה בשליחת דוח:', error);
    }
  }

  /**
   * שליחת התראת Quiet Index נמוך
   */
  async sendQIAlert(accountId, qiData) {
    try {
      const { current, previous, change } = qiData;

      const card = {
        type: 'message',
        attachments: [
          {
            contentType: 'application/vnd.microsoft.card.adaptive',
            content: {
              type: 'AdaptiveCard',
              version: '1.4',
              body: [
                {
                  type: 'Container',
                  style: 'warning',
                  items: [
                    {
                      type: 'TextBlock',
                      text: '⚠️ Quiet Index ירד משמעותית!',
                      size: 'Large',
                      weight: 'Bolder',
                      color: 'Warning'
                    }
                  ]
                },
                {
                  type: 'FactSet',
                  facts: [
                    {
                      title: 'ציון נוכחי:',
                      value: current.toString()
                    },
                    {
                      title: 'ציון קודם:',
                      value: previous.toString()
                    },
                    {
                      title: 'שינוי:',
                      value: `${change}%`
                    }
                  ]
                },
                {
                  type: 'TextBlock',
                  text: '💡 **המלצות:**\n- בדוק זיהויים אחרונים\n- בדוק מקורות תנועה\n- שקול העלאת רף זיהוי',
                  wrap: true
                }
              ],
              actions: [
                {
                  type: 'Action.OpenUrl',
                  title: '🔍 בדוק זיהויים',
                  url: 'https://app.magenad.com/detections'
                }
              ]
            }
          }
        ]
      };

      await this.sendCard(accountId, card);
      console.log('✅ התראת QI נשלחה ל-Teams');
    } catch (error) {
      console.error('שגיאה בשליחת התראה:', error);
    }
  }

  /**
   * שליחת עדכון IP נחסם
   */
  async sendIPBlockedNotification(accountId, blockData) {
    try {
      const { ip_address, reason, blocked_by } = blockData;

      const card = {
        type: 'message',
        attachments: [
          {
            contentType: 'application/vnd.microsoft.card.adaptive',
            content: {
              type: 'AdaptiveCard',
              version: '1.4',
              body: [
                {
                  type: 'TextBlock',
                  text: '🚫 IP נחסם',
                  size: 'Large',
                  weight: 'Bolder'
                },
                {
                  type: 'FactSet',
                  facts: [
                    {
                      title: 'כתובת IP:',
                      value: ip_address
                    },
                    {
                      title: 'סיבה:',
                      value: reason
                    },
                    {
                      title: 'נחסם על ידי:',
                      value: blocked_by
                    }
                  ]
                }
              ]
            }
          }
        ]
      };

      await this.sendCard(accountId, card);
      console.log('✅ עדכון חסימה נשלח ל-Teams');
    } catch (error) {
      console.error('שגיאה בשליחת עדכון:', error);
    }
  }

  /**
   * בדיקת webhook
   */
  async testWebhook(accountId) {
    try {
      const integration = await this.getIntegration(accountId);
      if (!integration) {
        throw new Error('Teams לא מחובר');
      }

      const card = {
        type: 'message',
        attachments: [
          {
            contentType: 'application/vnd.microsoft.card.adaptive',
            content: {
              type: 'AdaptiveCard',
              version: '1.4',
              body: [
                {
                  type: 'TextBlock',
                  text: '✅ חיבור ל-Teams פעיל!',
                  size: 'Large',
                  weight: 'Bolder',
                  color: 'Good'
                },
                {
                  type: 'TextBlock',
                  text: 'זוהי הודעת בדיקה מ-MagenAd',
                  wrap: true
                }
              ]
            }
          }
        ]
      };

      await this.sendCard(accountId, card);
      return { success: true, message: 'הודעת בדיקה נשלחה' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * עדכון webhook
   */
  async updateWebhook(accountId, updates) {
    try {
      await supabase
        .from('teams_integrations')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('ad_account_id', accountId);

      console.log('✅ Teams webhook עודכן');
    } catch (error) {
      console.error('שגיאה בעדכון webhook:', error);
      throw error;
    }
  }

  /**
   * ניתוק
   */
  async disconnect(accountId) {
    try {
      await supabase
        .from('teams_integrations')
        .update({
          status: 'disconnected',
          disconnected_at: new Date().toISOString()
        })
        .eq('ad_account_id', accountId);

      console.log('✅ Teams נותק');
    } catch (error) {
      console.error('שגיאה בניתוק Teams:', error);
      throw error;
    }
  }

  /**
   * קבלת אינטגרציה
   */
  async getIntegration(accountId) {
    try {
      const { data } = await supabase
        .from('teams_integrations')
        .select('*')
        .eq('ad_account_id', accountId)
        .eq('status', 'active')
        .single();

      return data;
    } catch (error) {
      return null;
    }
  }
}

module.exports = new TeamsService();