/*
 * GoogleSheetsService.js - ייצוא ל-Google Sheets
 * 
 * תכונות:
 * - Auto-Export Reports
 * - Real-Time Sync
 * - Custom Templates
 * - Scheduled Exports
 * - Multiple Sheet Types
 * - Formatting & Charts
 */

const { google } = require('googleapis');
const supabase = require('../config/supabase');

class GoogleSheetsService {
  constructor() {
    this.sheets = null;
  }

  /**
   * אתחול Google Sheets API
   */
  async initializeAPI(accountId) {
    try {
      // שליפת credentials
      const { data: oauth } = await supabase
        .from('google_oauth_tokens')
        .select('*')
        .eq('ad_account_id', accountId)
        .single();

      if (!oauth) {
        throw new Error('לא נמצאו credentials');
      }

      // יצירת OAuth2 client
      const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      auth.setCredentials({
        access_token: oauth.access_token,
        refresh_token: oauth.refresh_token
      });

      this.sheets = google.sheets({ version: 'v4', auth });
      return true;
    } catch (error) {
      console.error('שגיאה באתחול Sheets API:', error);
      return false;
    }
  }

  /**
   * יצירת spreadsheet חדש
   */
  async createSpreadsheet(accountId, title, sheetType = 'clicks') {
    try {
      await this.initializeAPI(accountId);

      const resource = {
        properties: {
          title: `MagenAd - ${title}`,
          locale: 'he_IL',
          timeZone: 'Asia/Jerusalem'
        },
        sheets: [
          {
            properties: {
              title: this.getSheetTitle(sheetType),
              gridProperties: {
                rowCount: 1000,
                columnCount: 20
              }
            }
          }
        ]
      };

      const response = await this.sheets.spreadsheets.create({ resource });
      const spreadsheetId = response.data.spreadsheetId;

      // הוספת כותרות
      await this.addHeaders(spreadsheetId, sheetType);

      // שמירה ל-DB
      await this.saveSpreadsheetConfig(accountId, {
        spreadsheet_id: spreadsheetId,
        title,
        sheet_type: sheetType,
        url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
      });

      console.log('✅ Spreadsheet נוצר:', title);
      return {
        spreadsheetId,
        url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
      };
    } catch (error) {
      console.error('שגיאה ביצירת spreadsheet:', error);
      throw error;
    }
  }

  /**
   * כותרת sheet לפי סוג
   */
  getSheetTitle(type) {
    const titles = {
      clicks: 'קליקים',
      detections: 'זיהויים',
      daily_report: 'דוח יומי',
      qi_history: 'היסטוריית Quiet Index',
      cost_analysis: 'ניתוח עלויות'
    };
    return titles[type] || 'נתונים';
  }

  /**
   * הוספת כותרות
   */
  async addHeaders(spreadsheetId, sheetType) {
    try {
      const headers = this.getHeaders(sheetType);

      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'A1:Z1',
        valueInputOption: 'RAW',
        resource: {
          values: [headers]
        }
      });

      // עיצוב כותרות
      await this.formatHeaders(spreadsheetId);
    } catch (error) {
      console.error('שגיאה בהוספת כותרות:', error);
    }
  }

  /**
   * כותרות לפי סוג
   */
  getHeaders(type) {
    const headers = {
      clicks: [
        'תאריך',
        'שעה',
        'IP',
        'מדינה',
        'עיר',
        'ISP',
        'VPN',
        'Hosting',
        'מכשיר',
        'דפדפן',
        'עלות (₪)',
        'ציון סיכון',
        'הונאה'
      ],
      detections: [
        'תאריך',
        'שעה',
        'IP',
        'סוג זיהוי',
        'חומרה',
        'ציון הונאה',
        'פרטים',
        'סטטוס'
      ],
      daily_report: [
        'תאריך',
        'קליקים',
        'זיהויים',
        'שיעור הונאות (%)',
        'עלות כוללת',
        'חיסכון',
        'Quiet Index'
      ],
      qi_history: [
        'תאריך',
        'שעה',
        'Quiet Index',
        'מגמה',
        'שינוי'
      ],
      cost_analysis: [
        'תאריך',
        'סה"כ קליקים',
        'קליקים נקיים',
        'קליקים הונאתיים',
        'עלות כוללת',
        'עלות נקייה',
        'בזבוז',
        'חיסכון'
      ]
    };

    return headers[type] || [];
  }

  /**
   * עיצוב כותרות
   */
  async formatHeaders(spreadsheetId) {
    try {
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: 0,
                  startRowIndex: 0,
                  endRowIndex: 1
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: {
                      red: 0.26,
                      green: 0.4,
                      blue: 0.92
                    },
                    textFormat: {
                      foregroundColor: {
                        red: 1,
                        green: 1,
                        blue: 1
                      },
                      bold: true
                    }
                  }
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat)'
              }
            },
            {
              autoResizeDimensions: {
                dimensions: {
                  sheetId: 0,
                  dimension: 'COLUMNS',
                  startIndex: 0,
                  endIndex: 20
                }
              }
            }
          ]
        }
      });
    } catch (error) {
      console.error('שגיאה בעיצוב:', error);
    }
  }

  /**
   * ייצוא קליקים
   */
  async exportClicks(accountId, spreadsheetId, dateRange) {
    try {
      await this.initializeAPI(accountId);

      const { startDate, endDate } = dateRange;

      // שליפת נתונים
      const { data: clicks } = await supabase
        .from('raw_events')
        .select(`
          event_timestamp,
          ip_address,
          country,
          city,
          isp,
          is_vpn,
          is_hosting,
          device_type,
          browser,
          cost_micros
        `)
        .eq('ad_account_id', accountId)
        .eq('event_type', 'click')
        .gte('event_timestamp', startDate)
        .lte('event_timestamp', endDate)
        .order('event_timestamp', { ascending: false })
        .limit(1000);

      if (!clicks || clicks.length === 0) {
        console.log('אין קליקים לייצוא');
        return;
      }

      // המרה לשורות
      const rows = clicks.map(click => [
        new Date(click.event_timestamp).toLocaleDateString('he-IL'),
        new Date(click.event_timestamp).toLocaleTimeString('he-IL'),
        click.ip_address,
        click.country || '',
        click.city || '',
        click.isp || '',
        click.is_vpn ? 'כן' : 'לא',
        click.is_hosting ? 'כן' : 'לא',
        click.device_type || '',
        click.browser || '',
        (click.cost_micros / 1000000).toFixed(2),
        '',  // ציון סיכון
        ''   // הונאה
      ]);

      // כתיבה
      await this.sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'A2:Z',
        valueInputOption: 'RAW',
        resource: {
          values: rows
        }
      });

      console.log(`✅ ${rows.length} קליקים יוצאו`);
      return rows.length;
    } catch (error) {
      console.error('שגיאה בייצוא קליקים:', error);
      throw error;
    }
  }

  /**
   * ייצוא דוח יומי
   */
  async exportDailyReport(accountId, spreadsheetId, days = 30) {
    try {
      await this.initializeAPI(accountId);

      const rows = [];
      const endDate = new Date();
      
      for (let i = 0; i < days; i++) {
        const date = new Date(endDate);
        date.setDate(date.getDate() - i);
        
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));

        // נתוני יום
        const { count: clicks } = await supabase
          .from('raw_events')
          .select('id', { count: 'exact', head: true })
          .eq('ad_account_id', accountId)
          .eq('event_type', 'click')
          .gte('event_timestamp', dayStart.toISOString())
          .lte('event_timestamp', dayEnd.toISOString());

        const { count: detections } = await supabase
          .from('fraud_detections')
          .select('id', { count: 'exact', head: true })
          .eq('ad_account_id', accountId)
          .gte('detected_at', dayStart.toISOString())
          .lte('detected_at', dayEnd.toISOString());

        const fraudRate = clicks > 0 ? ((detections / clicks) * 100).toFixed(1) : '0';

        // QI
        const { data: qiData } = await supabase
          .from('quiet_index_history')
          .select('qi_score')
          .eq('ad_account_id', accountId)
          .gte('calculated_at', dayStart.toISOString())
          .lte('calculated_at', dayEnd.toISOString())
          .limit(1);

        const qi = qiData?.[0]?.qi_score || 0;

        rows.push([
          date.toLocaleDateString('he-IL'),
          clicks || 0,
          detections || 0,
          fraudRate,
          '', // עלות
          '', // חיסכון
          qi
        ]);
      }

      // כתיבה
      await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'A2:Z',
        valueInputOption: 'RAW',
        resource: {
          values: rows.reverse() // מהישן לחדש
        }
      });

      console.log(`✅ דוח ${days} ימים יוצא`);
      return rows.length;
    } catch (error) {
      console.error('שגיאה בייצוא דוח:', error);
      throw error;
    }
  }

  /**
   * סנכרון אוטומטי
   */
  async scheduleAutoSync(accountId, spreadsheetId, config) {
    try {
      const {
        sheet_type,
        frequency = 'daily', // daily, hourly, realtime
        enabled = true
      } = config;

      await supabase
        .from('sheets_sync_configs')
        .insert({
          ad_account_id: accountId,
          spreadsheet_id: spreadsheetId,
          sheet_type,
          frequency,
          enabled,
          last_synced_at: null,
          next_sync_at: this.calculateNextSync(frequency),
          created_at: new Date().toISOString()
        });

      console.log('✅ סנכרון אוטומטי תוזמן');
    } catch (error) {
      console.error('שגיאה בתזמון:', error);
      throw error;
    }
  }

  /**
   * חישוב סנכרון הבא
   */
  calculateNextSync(frequency) {
    const now = new Date();
    
    switch (frequency) {
      case 'hourly':
        now.setHours(now.getHours() + 1);
        break;
      case 'daily':
        now.setDate(now.getDate() + 1);
        now.setHours(8, 0, 0, 0); // 08:00
        break;
      case 'realtime':
        now.setMinutes(now.getMinutes() + 15); // כל 15 דקות
        break;
    }

    return now.toISOString();
  }

  /**
   * שמירת תצורה
   */
  async saveSpreadsheetConfig(accountId, config) {
    try {
      await supabase
        .from('sheets_configs')
        .insert({
          ad_account_id: accountId,
          ...config,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('שגיאה בשמירת תצורה:', error);
    }
  }

  /**
   * קבלת spreadsheets
   */
  async getSpreadsheets(accountId) {
    try {
      const { data } = await supabase
        .from('sheets_configs')
        .select('*')
        .eq('ad_account_id', accountId)
        .order('created_at', { ascending: false });

      return data || [];
    } catch (error) {
      console.error('שגיאה בשליפת spreadsheets:', error);
      return [];
    }
  }

  /**
   * מחיקת spreadsheet config
   */
  async deleteSpreadsheetConfig(configId) {
    try {
      await supabase
        .from('sheets_configs')
        .delete()
        .eq('id', configId);

      console.log('✅ תצורה נמחקה');
    } catch (error) {
      console.error('שגיאה במחיקה:', error);
      throw error;
    }
  }
}

module.exports = new GoogleSheetsService();