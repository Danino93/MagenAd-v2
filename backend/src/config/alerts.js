/*
 * Alert Configuration
 * -------------------
 * הגדרות התראות
 */

const alerts = {
  // Email alerts
  email: {
    enabled: process.env.ALERT_EMAIL_ENABLED === 'true',
    recipients: process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL] : [],
    smtp: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    }
  },
  
  // Thresholds
  thresholds: {
    errorRate: 5, // Alert if error rate > 5%
    responseTime: 2000, // Alert if response time > 2s
    memoryUsage: 80, // Alert if memory > 80%
    cpuUsage: 80 // Alert if CPU > 80%
  },
  
  // Alert channels
  channels: {
    critical: ['email', 'slack'],
    warning: ['slack'],
    info: ['log']
  }
}

module.exports = alerts
