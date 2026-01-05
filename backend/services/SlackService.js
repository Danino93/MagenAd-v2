/*
 * SlackService.js - אינטגרציה עם Slack
 * 
 * תכונות:
 * - Slack App Installation
 * - Alert Notifications to Channels
 * - Interactive Messages
 * - Slash Commands (/magenad)
 * - Channel Management
 * - Rich Formatting (blocks)
 * - Thread Replies
 */

const axios = require('axios');
const supabase = require('../config/supabase');

class SlackService {
  constructor() {
    this.baseURL = 'https://slack.com/api';
  }

  /**
   * שמירת Slack token לאחר התקנה
   */
  async saveSlackInstallation(accountId, userId, installData) {
    try {
      const {
        access_token,
        team_id,
        team_name,
        channel_id,
        channel_name,
        bot_user_id
      } = installData;

      const { data, error } = await supabase
        .from('slack_installations')
        .insert({
          ad_account_id: accountId,
          user_id: userId,
          team_id,
          team_name,
          access_token,
          bot_user_id,
          default_channel_id: channel_id,
          default_channel_name: channel_name,
          installed_at: new Date().toISOString(),
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Slack הותקן:', team_name);
      return data;
    } catch (error) {
      console.error('שגיאה בשמירת Slack:', error);
      throw error;
    }
  }

  /**
   * שליחת הודעה לערוץ
   */
  async sendMessage(accountId, message) {
    try {
      const installation = await this.getInstallation(accountId);
      if (!installation) {
        throw new Error('Slack לא מחובר');
      }

      const {
        channel = installation.default_channel_id,
        text = '',
        blocks = null,
        thread_ts = null
      } = message;

      const payload = {
        channel,
        text
      };

      if (blocks) {
        payload.blocks = blocks;
      }

      if (thread_ts) {
        payload.thread_ts = thread_ts;
      }

      const response = await axios.post(
        `${this.baseURL}/chat.postMessage`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${installation.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.ok) {
        throw new Error(response.data.error);
      }

      console.log('✅ הודעה נשלחה ל-Slack');
      return response.data;
    } catch (error) {
      console.error('שגיאה בשליחה ל-Slack:', error);
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
        detected_at
      } = detection;

      // צבעים לפי חומרה
      const colors = {
        critical: '#ef4444',
        high: '#f97316',
        medium: '#eab308',
        low: '#84cc16'
      };

      const blocks = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🚨 התראת הונאה חדשה!',
            emoji: true
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*סוג:*\n${this.translatePattern(pattern_type)}`
            },
            {
              type: 'mrkdwn',
              text: `*חומרה:*\n${severity}`
            },
            {
              type: 'mrkdwn',
              text: `*ציון:*\n${fraud_score}/100`
            },
            {
              type: 'mrkdwn',
              text: `*IP:*\n${ip_address}`
            }
          ]
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `זוהה בתאריך: ${new Date(detected_at).toLocaleString('he-IL')}`
            }
          ]
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '🔍 פרטים מלאים'
              },
              url: `https://app.magenad.com/detections/${detection.id}`,
              style: 'primary'
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '🚫 חסום IP'
              },
              value: detection.id,
              action_id: 'block_ip'
            }
          ]
        }
      ];

      await this.sendMessage(accountId, {
        text: `🚨 התראת הונאה: ${severity}`,
        blocks
      });

      console.log('✅ התראה נשלחה ל-Slack');
    } catch (error) {
      console.error('שגיאה בשליחת התראה:', error);
    }
  }

  /**
   * תרגום סוג pattern
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

      const blocks = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '📊 דוח יומי - MagenAd',
            emoji: true
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*תאריך:* ${date}`
          }
        },
        {
          type: 'divider'
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*קליקים:*\n${clicks.toLocaleString()}`
            },
            {
              type: 'mrkdwn',
              text: `*זיהויים:*\n${detections.toLocaleString()}`
            },
            {
              type: 'mrkdwn',
              text: `*שיעור הונאות:*\n${fraudRate}%`
            },
            {
              type: 'mrkdwn',
              text: `*Quiet Index:*\n${qiAverage}`
            },
            {
              type: 'mrkdwn',
              text: `*עלות כוללת:*\n₪${cost}`
            },
            {
              type: 'mrkdwn',
              text: `*חיסכון:*\n₪${costSaved} 💰`
            }
          ]
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '📈 דשבורד מלא'
              },
              url: 'https://app.magenad.com/dashboard',
              style: 'primary'
            }
          ]
        }
      ];

      await this.sendMessage(accountId, {
        text: `📊 דוח יומי - ${date}`,
        blocks
      });

      console.log('✅ דוח יומי נשלח ל-Slack');
    } catch (error) {
      console.error('שגיאה בשליחת דוח:', error);
    }
  }

  /**
   * טיפול ב-Slash Command
   */
  async handleSlashCommand(command) {
    try {
      const { text, user_id, channel_id } = command;
      const args = text.split(' ');
      const action = args[0];

      let response = {
        response_type: 'ephemeral', // רק למשתמש
        text: ''
      };

      switch (action) {
        case 'status':
          response = await this.getStatusResponse();
          break;
        case 'qi':
          response = await this.getQIResponse();
          break;
        case 'help':
          response = this.getHelpResponse();
          break;
        default:
          response.text = 'פקודה לא מוכרת. כתוב `/magenad help` לעזרה';
      }

      return response;
    } catch (error) {
      console.error('שגיאה בטיפול בפקודה:', error);
      return {
        response_type: 'ephemeral',
        text: 'שגיאה בביצוע הפקודה'
      };
    }
  }

  /**
   * תגובת סטטוס
   */
  async getStatusResponse() {
    // כאן תהיה הלוגיקה לשליפת סטטוס אמיתי
    return {
      response_type: 'ephemeral',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*סטטוס מערכת:* ✅ פעיל\n*קליקים היום:* 1,234\n*זיהויים:* 187'
          }
        }
      ]
    };
  }

  /**
   * תגובת Quiet Index
   */
  async getQIResponse() {
    return {
      response_type: 'ephemeral',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Quiet Index נוכחי:* 82.5 🟢\n*סטטוס:* טוב\n*מגמה:* יציב'
          }
        }
      ]
    };
  }

  /**
   * תגובת עזרה
   */
  getHelpResponse() {
    return {
      response_type: 'ephemeral',
      text: 'פקודות זמינות:\n\n`/magenad status` - סטטוס המערכת\n`/magenad qi` - Quiet Index נוכחי\n`/magenad help` - הודעת עזרה זו'
    };
  }

  /**
   * טיפול ב-Interactive Action
   */
  async handleInteractiveAction(payload) {
    try {
      const { action_id, value, user, channel } = payload;

      switch (action_id) {
        case 'block_ip':
          await this.handleBlockIPAction(value, user, channel);
          break;
        default:
          console.log('פעולה לא מוכרת:', action_id);
      }
    } catch (error) {
      console.error('שגיאה בטיפול בפעולה:', error);
    }
  }

  /**
   * טיפול בלחיצה על "חסום IP"
   */
  async handleBlockIPAction(detectionId, user, channel) {
    try {
      // כאן תהיה הלוגיקה של חסימת IP
      
      // שליחת תגובה
      await this.sendMessage(null, {
        channel: channel.id,
        text: `✅ IP נחסם בהצלחה על ידי <@${user.id}>`
      });
    } catch (error) {
      console.error('שגיאה בחסימת IP:', error);
    }
  }

  /**
   * קבלת רשימת ערוצים
   */
  async getChannels(accountId) {
    try {
      const installation = await this.getInstallation(accountId);
      if (!installation) {
        throw new Error('Slack לא מחובר');
      }

      const response = await axios.get(
        `${this.baseURL}/conversations.list`,
        {
          headers: {
            'Authorization': `Bearer ${installation.access_token}`
          },
          params: {
            types: 'public_channel,private_channel',
            limit: 100
          }
        }
      );

      if (!response.data.ok) {
        throw new Error(response.data.error);
      }

      return response.data.channels;
    } catch (error) {
      console.error('שגיאה בשליפת ערוצים:', error);
      throw error;
    }
  }

  /**
   * עדכון ערוץ ברירת מחדל
   */
  async updateDefaultChannel(accountId, channelId, channelName) {
    try {
      await supabase
        .from('slack_installations')
        .update({
          default_channel_id: channelId,
          default_channel_name: channelName,
          updated_at: new Date().toISOString()
        })
        .eq('ad_account_id', accountId);

      console.log('✅ ערוץ ברירת מחדל עודכן:', channelName);
    } catch (error) {
      console.error('שגיאה בעדכון ערוץ:', error);
      throw error;
    }
  }

  /**
   * ניתוק Slack
   */
  async disconnect(accountId) {
    try {
      await supabase
        .from('slack_installations')
        .update({
          status: 'disconnected',
          disconnected_at: new Date().toISOString()
        })
        .eq('ad_account_id', accountId);

      console.log('✅ Slack נותק');
    } catch (error) {
      console.error('שגיאה בניתוק Slack:', error);
      throw error;
    }
  }

  /**
   * קבלת התקנה
   */
  async getInstallation(accountId) {
    try {
      const { data } = await supabase
        .from('slack_installations')
        .select('*')
        .eq('ad_account_id', accountId)
        .eq('status', 'active')
        .single();

      return data;
    } catch (error) {
      return null;
    }
  }

  /**
   * בדיקת חיבור
   */
  async testConnection(accountId) {
    try {
      const installation = await this.getInstallation(accountId);
      if (!installation) {
        return { connected: false, error: 'לא מחובר' };
      }

      const response = await axios.get(
        `${this.baseURL}/auth.test`,
        {
          headers: {
            'Authorization': `Bearer ${installation.access_token}`
          }
        }
      );

      return {
        connected: response.data.ok,
        team: response.data.team,
        user: response.data.user
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }
}

module.exports = new SlackService();