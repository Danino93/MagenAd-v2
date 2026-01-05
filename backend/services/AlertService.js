/*
 * AlertService.js
 * 
 * Alert Management System:
 * - Alert creation & triggering
 * - Alert rules evaluation
 * - Notification sending (Email)
 * - Alert status management
 * - Alert history
 * - Batch notifications
 */

const supabase = require('../config/supabase');
const nodemailer = require('nodemailer');

class AlertService {
  constructor() {
    // Email transporter setup
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  /**
   * Create new alert
   */
  async createAlert(accountId, alertData) {
    try {
      const {
        type,
        severity,
        title,
        message,
        metadata = {},
        triggeredBy = null,
        autoResolve = false
      } = alertData;

      // Create alert
      const { data: alert, error } = await supabase
        .from('alerts')
        .insert({
          ad_account_id: accountId,
          alert_type: type,
          severity,
          title,
          message,
          metadata,
          triggered_by: triggeredBy,
          status: 'active',
          auto_resolve: autoResolve,
          triggered_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Send notification
      await this.sendNotification(alert);

      return alert;
    } catch (error) {
      console.error('Error creating alert:', error);
      throw error;
    }
  }

  /**
   * Evaluate alert rules and trigger alerts
   */
  async evaluateAlertRules(accountId) {
    try {
      // Get alert rules for account
      const { data: rules, error: rulesError } = await supabase
        .from('alert_rules')
        .select('*')
        .eq('ad_account_id', accountId)
        .eq('enabled', true);

      if (rulesError) throw rulesError;

      const triggeredAlerts = [];

      for (const rule of rules || []) {
        const shouldTrigger = await this.checkRule(accountId, rule);
        
        if (shouldTrigger) {
          const alert = await this.createAlert(accountId, {
            type: rule.rule_type,
            severity: rule.severity,
            title: rule.alert_title,
            message: this.formatAlertMessage(rule, shouldTrigger),
            metadata: { ruleId: rule.id, data: shouldTrigger },
            triggeredBy: 'auto',
            autoResolve: rule.auto_resolve
          });
          
          triggeredAlerts.push(alert);
        }
      }

      return triggeredAlerts;
    } catch (error) {
      console.error('Error evaluating alert rules:', error);
      return [];
    }
  }

  /**
   * Check if rule should trigger
   */
  async checkRule(accountId, rule) {
    const { rule_type, conditions } = rule;

    try {
      switch (rule_type) {
        case 'fraud_spike':
          return await this.checkFraudSpike(accountId, conditions);
        
        case 'cost_threshold':
          return await this.checkCostThreshold(accountId, conditions);
        
        case 'qi_drop':
          return await this.checkQIDrop(accountId, conditions);
        
        case 'vpn_surge':
          return await this.checkVPNSurge(accountId, conditions);
        
        case 'attack_detected':
          return await this.checkAttack(accountId, conditions);
        
        case 'multiple_critical':
          return await this.checkMultipleCritical(accountId, conditions);
        
        default:
          return false;
      }
    } catch (error) {
      console.error(`Error checking rule ${rule_type}:`, error);
      return false;
    }
  }

  /**
   * Check fraud spike
   */
  async checkFraudSpike(accountId, conditions) {
    const { threshold = 30, minutes = 30 } = conditions;
    
    const startTime = new Date();
    startTime.setMinutes(startTime.getMinutes() - minutes);

    const { data: clicks } = await supabase
      .from('raw_events')
      .select('id')
      .eq('ad_account_id', accountId)
      .eq('event_type', 'click')
      .gte('event_timestamp', startTime.toISOString());

    const { data: detections } = await supabase
      .from('fraud_detections')
      .select('id')
      .eq('ad_account_id', accountId)
      .gte('detected_at', startTime.toISOString());

    const total = clicks?.length || 0;
    const fraud = detections?.length || 0;
    const rate = total > 0 ? (fraud / total) * 100 : 0;

    if (rate > threshold) {
      return { rate: rate.toFixed(1), total, fraud, minutes };
    }

    return false;
  }

  /**
   * Check cost threshold
   */
  async checkCostThreshold(accountId, conditions) {
    const { threshold = 1000, period = 'day' } = conditions;
    
    const startTime = new Date();
    if (period === 'day') startTime.setHours(0, 0, 0, 0);
    if (period === 'hour') startTime.setHours(startTime.getHours() - 1);

    const { data: clicks } = await supabase
      .from('raw_events')
      .select('cost_micros')
      .eq('ad_account_id', accountId)
      .eq('event_type', 'click')
      .gte('event_timestamp', startTime.toISOString());

    const totalCost = clicks?.reduce((sum, c) => sum + (c.cost_micros || 0), 0) / 1000000 || 0;

    if (totalCost > threshold) {
      return { cost: totalCost.toFixed(2), threshold, period };
    }

    return false;
  }

  /**
   * Check QI drop
   */
  async checkQIDrop(accountId, conditions) {
    const { dropThreshold = 20 } = conditions;

    const { data: history } = await supabase
      .from('quiet_index_history')
      .select('qi_score, calculated_at')
      .eq('ad_account_id', accountId)
      .order('calculated_at', { ascending: false })
      .limit(2);

    if (history?.length === 2) {
      const [current, previous] = history;
      const drop = previous.qi_score - current.qi_score;

      if (drop > dropThreshold) {
        return { 
          drop, 
          from: previous.qi_score, 
          to: current.qi_score 
        };
      }
    }

    return false;
  }

  /**
   * Check VPN surge
   */
  async checkVPNSurge(accountId, conditions) {
    const { threshold = 20, minutes = 60 } = conditions;
    
    const startTime = new Date();
    startTime.setMinutes(startTime.getMinutes() - minutes);

    const { data: clicks } = await supabase
      .from('raw_events')
      .select('is_vpn')
      .eq('ad_account_id', accountId)
      .eq('event_type', 'click')
      .gte('event_timestamp', startTime.toISOString());

    const total = clicks?.length || 0;
    const vpn = clicks?.filter(c => c.is_vpn).length || 0;
    const rate = total > 0 ? (vpn / total) * 100 : 0;

    if (rate > threshold) {
      return { rate: rate.toFixed(1), vpn, total, minutes };
    }

    return false;
  }

  /**
   * Check for active attack
   */
  async checkAttack(accountId, conditions) {
    const { fraudRate = 30, criticalCount = 5 } = conditions;
    
    const startTime = new Date();
    startTime.setMinutes(startTime.getMinutes() - 15);

    const { data: clicks } = await supabase
      .from('raw_events')
      .select('id')
      .eq('ad_account_id', accountId)
      .eq('event_type', 'click')
      .gte('event_timestamp', startTime.toISOString());

    const { data: detections } = await supabase
      .from('fraud_detections')
      .select('id, severity')
      .eq('ad_account_id', accountId)
      .gte('detected_at', startTime.toISOString());

    const total = clicks?.length || 0;
    const fraud = detections?.length || 0;
    const critical = detections?.filter(d => d.severity === 'critical').length || 0;
    const rate = total > 0 ? (fraud / total) * 100 : 0;

    if (rate > fraudRate || critical > criticalCount) {
      return { rate: rate.toFixed(1), critical, total, fraud };
    }

    return false;
  }

  /**
   * Check multiple critical detections
   */
  async checkMultipleCritical(accountId, conditions) {
    const { threshold = 5, minutes = 30 } = conditions;
    
    const startTime = new Date();
    startTime.setMinutes(startTime.getMinutes() - minutes);

    const { data: detections } = await supabase
      .from('fraud_detections')
      .select('id')
      .eq('ad_account_id', accountId)
      .eq('severity', 'critical')
      .gte('detected_at', startTime.toISOString());

    const count = detections?.length || 0;

    if (count >= threshold) {
      return { count, minutes };
    }

    return false;
  }

  /**
   * Format alert message
   */
  formatAlertMessage(rule, data) {
    const { rule_type } = rule;

    switch (rule_type) {
      case 'fraud_spike':
        return `שיעור הונאה עלה ל-${data.rate}% (${data.fraud} מתוך ${data.total} clicks) ב-${data.minutes} דקות האחרונות`;
      
      case 'cost_threshold':
        return `הוצאת ₪${data.cost} ב-${data.period === 'day' ? 'היום' : 'שעה האחרונה'} (מעל סף ₪${data.threshold})`;
      
      case 'qi_drop':
        return `Quiet Index ירד ב-${data.drop} נקודות (${data.from} → ${data.to})`;
      
      case 'vpn_surge':
        return `${data.rate}% מהclicks הם VPN (${data.vpn} מתוך ${data.total}) ב-${data.minutes} דקות האחרונות`;
      
      case 'attack_detected':
        return `זוהתה התקפה פעילה - ${data.rate}% הונאה, ${data.critical} critical detections`;
      
      case 'multiple_critical':
        return `${data.count} זיהויים קריטיים ב-${data.minutes} דקות האחרונות`;
      
      default:
        return rule.message || 'התראה חדשה';
    }
  }

  /**
   * Send notification (Email)
   */
  async sendNotification(alert) {
    try {
      // Get user email
      const { data: account } = await supabase
        .from('ad_accounts')
        .select('user_id, users:user_id(email, full_name)')
        .eq('id', alert.ad_account_id)
        .single();

      if (!account?.users?.email) {
        console.log('No email for alert notification');
        return;
      }

      const { email, full_name } = account.users;

      // Email template
      const html = this.getEmailTemplate(alert, full_name);

      // Send email
      await this.transporter.sendMail({
        from: `"MagenAd Alerts" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `🚨 ${alert.title}`,
        html
      });

      // Log notification
      await supabase
        .from('alert_notifications')
        .insert({
          alert_id: alert.id,
          notification_type: 'email',
          recipient: email,
          status: 'sent',
          sent_at: new Date().toISOString()
        });

      console.log(`✅ Alert notification sent to ${email}`);
    } catch (error) {
      console.error('Error sending notification:', error);
      
      // Log failed notification
      await supabase
        .from('alert_notifications')
        .insert({
          alert_id: alert.id,
          notification_type: 'email',
          status: 'failed',
          error_message: error.message
        });
    }
  }

  /**
   * Email template
   */
  getEmailTemplate(alert, userName) {
    const severityColors = {
      critical: '#ef4444',
      high: '#f97316',
      medium: '#eab308',
      low: '#84cc16'
    };

    const color = severityColors[alert.severity] || '#6b7280';

    return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f3f4f6; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: ${color}; color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .alert-box { background: #f9fafb; border-right: 4px solid ${color}; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .alert-box h2 { margin: 0 0 10px 0; color: ${color}; }
    .alert-box p { margin: 0; color: #374151; line-height: 1.6; }
    .button { display: inline-block; background: ${color}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin-top: 20px; }
    .footer { background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 התראת MagenAd</h1>
    </div>
    <div class="content">
      <p>שלום ${userName},</p>
      <div class="alert-box">
        <h2>${alert.title}</h2>
        <p>${alert.message}</p>
      </div>
      <p>התראה זו נוצרה אוטומטית על ידי מערכת ניטור ההונאות שלך.</p>
      <p><strong>רמת חומרה:</strong> ${alert.severity.toUpperCase()}</p>
      <p><strong>זמן:</strong> ${new Date(alert.triggered_at).toLocaleString('he-IL')}</p>
      <a href="${process.env.APP_URL || 'http://localhost:5173'}/dashboard" class="button">
        פתח Dashboard
      </a>
    </div>
    <div class="footer">
      <p>MagenAd - Fraud Protection System</p>
      <p>התראה זו נשלחה אוטומטית. אל תשיב למייל זה.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Get alerts for account
   */
  async getAlerts(accountId, options = {}) {
    const {
      status = null,
      severity = null,
      limit = 50
    } = options;

    try {
      let query = supabase
        .from('alerts')
        .select('*')
        .eq('ad_account_id', accountId)
        .order('triggered_at', { ascending: false })
        .limit(limit);

      if (status) query = query.eq('status', status);
      if (severity) query = query.eq('severity', severity);

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting alerts:', error);
      return [];
    }
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId, resolvedBy = null) {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: resolvedBy
        })
        .eq('id', alertId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error resolving alert:', error);
      throw error;
    }
  }

  /**
   * Dismiss alert
   */
  async dismissAlert(alertId, dismissedBy = null) {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .update({
          status: 'dismissed',
          resolved_at: new Date().toISOString(),
          resolved_by: dismissedBy
        })
        .eq('id', alertId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error dismissing alert:', error);
      throw error;
    }
  }
}

module.exports = new AlertService();