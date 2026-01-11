/*
 * MonitoringService.js
 * 
 * שירות ניטור ותיעוד - MagenAd V2
 * 
 * תפקיד:
 * - ניטור בריאות המערכת (System Health)
 * - מעקב שגיאות (Error Tracking)
 * - מדדי ביצועים (Performance Metrics)
 * - רישום פעילות משתמשים (User Activity Logging)
 * - התראות והתרעות (Alerts & Notifications)
 * - Analytics Dashboard
 * 
 * פונקציות עיקריות:
 * - getMonitoringData(): נתוני ניטור מלאים
 * - getThreats(): איומים פעילים
 * - getLiveStats(): סטטיסטיקות בזמן אמת
 * - getTimeline(): ציר זמן של איומים
 * - detectAttack(): זיהוי התקפות
 * - logActivity(): רישום פעילות
 * - trackError(): מעקב שגיאות
 * 
 * Metrics:
 * - requests: מספר בקשות
 * - errors: מספר שגיאות
 * - responseTime: זמן תגובה ממוצע
 * - activeUsers: משתמשים פעילים
 * - systemHealth: בריאות המערכת
 * 
 * Database:
 * - Table: monitoring_logs
 * - Table: error_logs
 * - Table: activity_logs
 */

const supabase = require('../config/supabase');

class MonitoringService {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      totalResponseTime: 0,
      activeUsers: new Set()
    };

    this.errorLog = [];
    this.activityLog = [];
    this.systemMetrics = [];
  }

  /**
   * רישום פעילות
   */
  async logActivity(userId, action, details = {}) {
    const activity = {
      userId,
      action,
      details,
      timestamp: new Date(),
      ip: details.ip || 'unknown'
    };

    this.activityLog.push(activity);

    // שמירה ל-DB
    try {
      await supabase.from('activity_logs').insert({
        user_id: userId,
        action,
        details,
        created_at: activity.timestamp
      });
    } catch (error) {
      console.error('שגיאה ברישום פעילות:', error);
    }

    return activity;
  }

  /**
   * רישום שגיאה
   */
  async logError(error, context = {}) {
    const errorEntry = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date(),
      severity: this.calculateErrorSeverity(error)
    };

    this.errorLog.push(errorEntry);
    this.metrics.errors++;

    // שמירה ל-DB
    try {
      await supabase.from('error_logs').insert({
        error_message: error.message,
        error_stack: error.stack,
        context,
        severity: errorEntry.severity,
        created_at: errorEntry.timestamp
      });
    } catch (err) {
      console.error('שגיאה ברישום שגיאה:', err);
    }

    // התראה על שגיאות קריטיות
    if (errorEntry.severity === 'critical') {
      await this.sendCriticalAlert(errorEntry);
    }

    return errorEntry;
  }

  /**
   * חישוב חומרת שגיאה
   */
  calculateErrorSeverity(error) {
    const criticalKeywords = ['database', 'connection', 'authentication', 'payment'];
    const message = error.message.toLowerCase();

    for (const keyword of criticalKeywords) {
      if (message.includes(keyword)) {
        return 'critical';
      }
    }

    if (error.stack?.includes('TypeError') || error.stack?.includes('ReferenceError')) {
      return 'high';
    }

    return 'medium';
  }

  /**
   * שליחת התראה קריטית
   */
  async sendCriticalAlert(errorEntry) {
    console.error('🚨 שגיאה קריטית:', errorEntry.message);
    
    // כאן ניתן לשלוח אימייל/SMS/Slack
    // לדוגמה: await emailService.sendAlert(...)
  }

  /**
   * ניטור בריאות המערכת
   */
  async monitorSystemHealth() {
    const health = {
      timestamp: new Date(),
      uptime: process.uptime(),
      memory: {
        used: process.memoryUsage().heapUsed / 1024 / 1024,
        total: process.memoryUsage().heapTotal / 1024 / 1024,
        percentage: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal * 100).toFixed(1)
      },
      cpu: process.cpuUsage(),
      database: await this.checkDatabaseHealth(),
      api: {
        totalRequests: this.metrics.requests,
        errorRate: this.metrics.requests > 0 
          ? ((this.metrics.errors / this.metrics.requests) * 100).toFixed(2)
          : 0,
        avgResponseTime: this.metrics.requests > 0
          ? (this.metrics.totalResponseTime / this.metrics.requests).toFixed(0)
          : 0
      }
    };

    this.systemMetrics.push(health);

    // שמור רק את ה-100 אחרונים
    if (this.systemMetrics.length > 100) {
      this.systemMetrics.shift();
    }

    return health;
  }

  /**
   * בדיקת בריאות DB
   */
  async checkDatabaseHealth() {
    try {
      const startTime = Date.now();
      const { error } = await supabase.from('ad_accounts').select('id').limit(1);
      const responseTime = Date.now() - startTime;

      return {
        status: error ? 'unhealthy' : 'healthy',
        responseTime: `${responseTime}ms`,
        lastCheck: new Date()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        lastCheck: new Date()
      };
    }
  }

  /**
   * רישום בקשת API
   */
  trackRequest(req, res, responseTime) {
    this.metrics.requests++;
    this.metrics.totalResponseTime += responseTime;
    this.metrics.activeUsers.add(req.user?.id);

    // רישום בקשות איטיות
    if (responseTime > 1000) {
      console.warn(`⚠️ בקשה איטית: ${req.path} (${responseTime}ms)`);
    }
  }

  /**
   * קבלת מדדים נוכחיים
   */
  getCurrentMetrics() {
    return {
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      errorRate: this.metrics.requests > 0 
        ? `${((this.metrics.errors / this.metrics.requests) * 100).toFixed(2)}%`
        : '0%',
      avgResponseTime: this.metrics.requests > 0
        ? `${(this.metrics.totalResponseTime / this.metrics.requests).toFixed(0)}ms`
        : '0ms',
      activeUsers: this.metrics.activeUsers.size,
      uptime: `${(process.uptime() / 3600).toFixed(1)}h`
    };
  }

  /**
   * קבלת לוג שגיאות
   */
  getErrorLog(limit = 50) {
    return this.errorLog
      .slice(-limit)
      .reverse();
  }

  /**
   * קבלת לוג פעילות
   */
  getActivityLog(limit = 100, userId = null) {
    let logs = this.activityLog;

    if (userId) {
      logs = logs.filter(log => log.userId === userId);
    }

    return logs
      .slice(-limit)
      .reverse();
  }

  /**
   * קבלת מגמות
   */
  getTrends(hours = 24) {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const recentMetrics = this.systemMetrics.filter(m => m.timestamp > cutoff);

    if (recentMetrics.length === 0) {
      return { message: 'אין נתונים' };
    }

    const avgMemory = recentMetrics.reduce((sum, m) => sum + parseFloat(m.memory.percentage), 0) / recentMetrics.length;
    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + parseFloat(m.api.avgResponseTime), 0) / recentMetrics.length;

    return {
      period: `${hours} שעות אחרונות`,
      avgMemoryUsage: `${avgMemory.toFixed(1)}%`,
      avgResponseTime: `${avgResponseTime.toFixed(0)}ms`,
      dataPoints: recentMetrics.length
    };
  }

  /**
   * דוח יומי
   */
  async generateDailyReport() {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const errors24h = this.errorLog.filter(e => e.timestamp > last24h);
    const activities24h = this.activityLog.filter(a => a.timestamp > last24h);

    return {
      date: new Date().toLocaleDateString('he-IL'),
      summary: {
        totalRequests: this.metrics.requests,
        totalErrors: errors24h.length,
        errorRate: this.metrics.requests > 0 
          ? `${((errors24h.length / this.metrics.requests) * 100).toFixed(2)}%`
          : '0%',
        activeUsers: this.metrics.activeUsers.size,
        totalActivities: activities24h.length
      },
      topErrors: this.getTopErrors(errors24h),
      topActivities: this.getTopActivities(activities24h),
      systemHealth: await this.monitorSystemHealth()
    };
  }

  /**
   * שגיאות נפוצות
   */
  getTopErrors(errors) {
    const errorCounts = {};
    
    errors.forEach(error => {
      const msg = error.message;
      errorCounts[msg] = (errorCounts[msg] || 0) + 1;
    });

    return Object.entries(errorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([message, count]) => ({ message, count }));
  }

  /**
   * פעילויות נפוצות
   */
  getTopActivities(activities) {
    const activityCounts = {};
    
    activities.forEach(activity => {
      const action = activity.action;
      activityCounts[action] = (activityCounts[action] || 0) + 1;
    });

    return Object.entries(activityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([action, count]) => ({ action, count }));
  }

  /**
   * ניקוי לוגים ישנים
   */
  cleanupOldLogs(days = 30) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const beforeCount = {
      errors: this.errorLog.length,
      activities: this.activityLog.length
    };

    this.errorLog = this.errorLog.filter(e => e.timestamp > cutoff);
    this.activityLog = this.activityLog.filter(a => a.timestamp > cutoff);

    const removed = {
      errors: beforeCount.errors - this.errorLog.length,
      activities: beforeCount.activities - this.activityLog.length
    };

    console.log(`🧹 ניקוי לוגים: ${removed.errors} שגיאות, ${removed.activities} פעילויות`);

    return removed;
  }

  /**
   * אתחול ניטור אוטומטי
   */
  startAutoMonitoring(intervalMinutes = 5) {
    console.log(`📊 מתחיל ניטור אוטומטי כל ${intervalMinutes} דקות`);

    setInterval(async () => {
      const health = await this.monitorSystemHealth();
      
      // התראה על שימוש גבוה בזיכרון
      if (parseFloat(health.memory.percentage) > 80) {
        console.warn('⚠️ שימוש גבוה בזיכרון:', health.memory.percentage + '%');
      }

      // התראה על שיעור שגיאות גבוה
      if (parseFloat(health.api.errorRate) > 5) {
        console.warn('⚠️ שיעור שגיאות גבוה:', health.api.errorRate);
      }
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * ייצוא לוגים
   */
  exportLogs(format = 'json') {
    const data = {
      exportDate: new Date(),
      metrics: this.getCurrentMetrics(),
      errors: this.errorLog,
      activities: this.activityLog,
      systemMetrics: this.systemMetrics
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    // פורמטים נוספים...
    return data;
  }

  /**
   * איפוס מדדים
   */
  resetMetrics() {
    this.metrics = {
      requests: 0,
      errors: 0,
      totalResponseTime: 0,
      activeUsers: new Set()
    };

    console.log('🔄 מדדים אופסו');
  }
}

module.exports = new MonitoringService();