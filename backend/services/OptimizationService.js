/*
 * OptimizationService.js - אופטימיזציה וביצועים
 * 
 * מערכת שיפור ביצועים:
 * - מטמון (Cache) חכם
 * - אופטימיזציה של שאילתות
 * - דחיסת נתונים
 * - ניהול זיכרון
 * - ביצועי API
 * - ניטור ביצועים
 */

const supabase = require('../config/supabase');
const NodeCache = require('node-cache');

class OptimizationService {
  constructor() {
    // מטמון עם TTL של 5 דקות
    this.cache = new NodeCache({ stdTTL: 300 });
    
    // מטמון לתוצאות מודל ML
    this.mlCache = new NodeCache({ stdTTL: 600 });
    
    // ספירת פניות לניטור
    this.requestCounts = new Map();
    
    // ביצועים
    this.performanceMetrics = {
      apiCalls: 0,
      cacheHits: 0,
      cacheMisses: 0,
      avgResponseTime: 0
    };
  }

  /**
   * קבלת נתונים עם מטמון
   */
  async getCached(key, fetchFunction, ttl = 300) {
    const startTime = Date.now();
    
    // בדיקה במטמון
    const cached = this.cache.get(key);
    if (cached) {
      this.performanceMetrics.cacheHits++;
      console.log(`✅ Cache HIT: ${key} (${Date.now() - startTime}ms)`);
      return cached;
    }

    // לא במטמון - שליפה מהDB
    this.performanceMetrics.cacheMisses++;
    console.log(`❌ Cache MISS: ${key}`);
    
    const data = await fetchFunction();
    
    // שמירה במטמון
    this.cache.set(key, data, ttl);
    
    const duration = Date.now() - startTime;
    this.updateAvgResponseTime(duration);
    
    return data;
  }

  /**
   * מטמון לחיזויי ML
   */
  async getMLPredictionCached(accountId, clickId, predictFunction) {
    const key = `ml_${accountId}_${clickId}`;
    
    const cached = this.mlCache.get(key);
    if (cached) {
      return cached;
    }

    const prediction = await predictFunction();
    this.mlCache.set(key, prediction);
    
    return prediction;
  }

  /**
   * שאילתה מאופטמת לקליקים
   */
  async getClicksOptimized(accountId, options = {}) {
    const {
      limit = 100,
      offset = 0,
      startDate = null,
      endDate = null
    } = options;

    const cacheKey = `clicks_${accountId}_${limit}_${offset}_${startDate}_${endDate}`;

    return await this.getCached(cacheKey, async () => {
      let query = supabase
        .from('raw_events')
        .select('id, event_timestamp, ip_address, device_type, cost_micros, risk_score', { count: 'exact' })
        .eq('ad_account_id', accountId)
        .eq('event_type', 'click')
        .order('event_timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      if (startDate) query = query.gte('event_timestamp', startDate);
      if (endDate) query = query.lte('event_timestamp', endDate);

      const { data, error, count } = await query;
      if (error) throw error;

      return { data, count };
    }, 60); // מטמון ל-60 שניות
  }

  /**
   * שאילתה מאופטמת לזיהויים
   */
  async getDetectionsOptimized(accountId, options = {}) {
    const { limit = 100, severity = null } = options;

    const cacheKey = `detections_${accountId}_${limit}_${severity}`;

    return await this.getCached(cacheKey, async () => {
      let query = supabase
        .from('fraud_detections')
        .select('id, pattern_type, severity, fraud_score, detected_at')
        .eq('ad_account_id', accountId)
        .order('detected_at', { ascending: false })
        .limit(limit);

      if (severity) query = query.eq('severity', severity);

      const { data, error } = await query;
      if (error) throw error;

      return data;
    }, 120); // מטמון ל-2 דקות
  }

  /**
   * צבירת נתונים מאופטמת
   */
  async aggregateOptimized(accountId, metric, period = 'day') {
    const cacheKey = `agg_${accountId}_${metric}_${period}`;

    return await this.getCached(cacheKey, async () => {
      const startDate = this.getStartDateForPeriod(period);

      switch (metric) {
        case 'clicks':
          return await this.aggregateClicks(accountId, startDate);
        case 'cost':
          return await this.aggregateCost(accountId, startDate);
        case 'fraud':
          return await this.aggregateFraud(accountId, startDate);
        default:
          return null;
      }
    }, 300); // מטמון ל-5 דקות
  }

  /**
   * צבירת קליקים
   */
  async aggregateClicks(accountId, startDate) {
    const { count } = await supabase
      .from('raw_events')
      .select('id', { count: 'exact', head: true })
      .eq('ad_account_id', accountId)
      .eq('event_type', 'click')
      .gte('event_timestamp', startDate.toISOString());

    return count || 0;
  }

  /**
   * צבירת עלות
   */
  async aggregateCost(accountId, startDate) {
    const { data } = await supabase
      .from('raw_events')
      .select('cost_micros')
      .eq('ad_account_id', accountId)
      .eq('event_type', 'click')
      .gte('event_timestamp', startDate.toISOString());

    const total = (data || []).reduce((sum, c) => sum + (c.cost_micros || 0), 0);
    return (total / 1000000).toFixed(2);
  }

  /**
   * צבירת הונאות
   */
  async aggregateFraud(accountId, startDate) {
    const { count } = await supabase
      .from('fraud_detections')
      .select('id', { count: 'exact', head: true })
      .eq('ad_account_id', accountId)
      .gte('detected_at', startDate.toISOString());

    return count || 0;
  }

  /**
   * קבלת תאריך התחלה לפי תקופה
   */
  getStartDateForPeriod(period) {
    const date = new Date();
    
    switch (period) {
      case 'hour':
        date.setHours(date.getHours() - 1);
        break;
      case 'day':
        date.setHours(0, 0, 0, 0);
        break;
      case 'week':
        date.setDate(date.getDate() - 7);
        break;
      case 'month':
        date.setMonth(date.getMonth() - 1);
        break;
    }
    
    return date;
  }

  /**
   * טעינה מקבילה של נתונים
   */
  async loadDashboardData(accountId) {
    const startTime = Date.now();
    
    const cacheKey = `dashboard_${accountId}`;
    
    return await this.getCached(cacheKey, async () => {
      // טעינה מקבילית של כל הנתונים
      const [clicks, detections, qi, alerts, cost] = await Promise.all([
        this.aggregateOptimized(accountId, 'clicks', 'day'),
        this.aggregateOptimized(accountId, 'fraud', 'day'),
        this.getCurrentQI(accountId),
        this.getActiveAlertsCount(accountId),
        this.aggregateOptimized(accountId, 'cost', 'day')
      ]);

      console.log(`✅ Dashboard loaded in ${Date.now() - startTime}ms`);

      return {
        clicks,
        detections,
        qi,
        alerts,
        cost,
        loadTime: Date.now() - startTime
      };
    }, 30); // מטמון ל-30 שניות
  }

  /**
   * קבלת QI נוכחי
   */
  async getCurrentQI(accountId) {
    const cacheKey = `qi_${accountId}`;
    
    return await this.getCached(cacheKey, async () => {
      const { data } = await supabase
        .from('quiet_index_history')
        .select('qi_score')
        .eq('ad_account_id', accountId)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .single();

      return data?.qi_score || 0;
    }, 60);
  }

  /**
   * קבלת מספר התראות פעילות
   */
  async getActiveAlertsCount(accountId) {
    const cacheKey = `alerts_${accountId}`;
    
    return await this.getCached(cacheKey, async () => {
      const { count } = await supabase
        .from('alerts')
        .select('id', { count: 'exact', head: true })
        .eq('ad_account_id', accountId)
        .eq('status', 'active');

      return count || 0;
    }, 60);
  }

  /**
   * ניקוי מטמון
   */
  clearCache(pattern = null) {
    if (!pattern) {
      this.cache.flushAll();
      this.mlCache.flushAll();
      console.log('🧹 Cache cleared');
      return;
    }

    // ניקוי לפי דפוס
    const keys = this.cache.keys();
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.cache.del(key);
      }
    });
    
    console.log(`🧹 Cleared cache for pattern: ${pattern}`);
  }

  /**
   * ניקוי מטמון לחשבון ספציפי
   */
  clearCacheForAccount(accountId) {
    this.clearCache(accountId);
  }

  /**
   * עדכון זמן תגובה ממוצע
   */
  updateAvgResponseTime(duration) {
    const count = this.performanceMetrics.apiCalls;
    const current = this.performanceMetrics.avgResponseTime;
    
    this.performanceMetrics.apiCalls++;
    this.performanceMetrics.avgResponseTime = 
      (current * count + duration) / (count + 1);
  }

  /**
   * קבלת מדדי ביצועים
   */
  getPerformanceMetrics() {
    const hitRate = this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses > 0
      ? (this.performanceMetrics.cacheHits / 
         (this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses) * 100).toFixed(1)
      : 0;

    return {
      ...this.performanceMetrics,
      cacheHitRate: `${hitRate}%`,
      avgResponseTime: `${this.performanceMetrics.avgResponseTime.toFixed(0)}ms`,
      cacheSize: this.cache.keys().length
    };
  }

  /**
   * ניטור שימוש
   */
  trackUsage(endpoint) {
    const count = this.requestCounts.get(endpoint) || 0;
    this.requestCounts.set(endpoint, count + 1);
  }

  /**
   * קבלת סטטיסטיקות שימוש
   */
  getUsageStats() {
    const stats = [];
    
    this.requestCounts.forEach((count, endpoint) => {
      stats.push({ endpoint, count });
    });

    return stats.sort((a, b) => b.count - a.count);
  }

  /**
   * דחיסת תוצאות גדולות
   */
  compressLargeResults(data) {
    if (!data || data.length < 100) return data;

    // החזרת רק שדות חיוניים
    return data.map(item => ({
      id: item.id,
      timestamp: item.event_timestamp || item.detected_at,
      key: item.ip_address || item.pattern_type,
      value: item.cost_micros || item.fraud_score
    }));
  }

  /**
   * Batch processing - עיבוד אצוות
   */
  async processBatch(items, processor, batchSize = 50) {
    const results = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(item => processor(item))
      );
      results.push(...batchResults);
      
      // השהייה קצרה בין אצוות
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  /**
   * ניקוי אוטומטי של מטמון ישן
   */
  scheduleAutoCleanup() {
    // ניקוי כל 10 דקות
    setInterval(() => {
      const stats = this.cache.getStats();
      console.log('🧹 Auto cleanup - Cache stats:', stats);
      
      // ניקוי entries ישנים
      this.cache.keys().forEach(key => {
        const ttl = this.cache.getTtl(key);
        if (ttl && ttl < Date.now()) {
          this.cache.del(key);
        }
      });
    }, 600000); // 10 דקות
  }
}

module.exports = new OptimizationService();