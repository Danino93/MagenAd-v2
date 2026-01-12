/*
 * Monitoring Service
 * ------------------
 * שירות ניטור ולוגים
 */

class MonitoringService {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTime: []
    }
  }
  
  /**
   * Log request
   */
  logRequest(req, res, duration) {
    this.metrics.requests++
    this.metrics.responseTime.push(duration)
    
    // Keep only last 1000 response times
    if (this.metrics.responseTime.length > 1000) {
      this.metrics.responseTime.shift()
    }
    
    const log = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    }
    
    console.log('[Request]', JSON.stringify(log))
    
    // Alert on slow requests (> 2 seconds)
    if (duration > 2000) {
      this.alert('slow_request', log)
    }
  }
  
  /**
   * Log error
   */
  logError(error, req = null) {
    this.metrics.errors++
    
    const log = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      url: req?.originalUrl,
      method: req?.method
    }
    
    console.error('[Error]', JSON.stringify(log))
    
    // Alert on critical errors
    this.alert('error', log)
  }
  
  /**
   * Get metrics
   */
  getMetrics() {
    const avgResponseTime = this.metrics.responseTime.length > 0
      ? this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length
      : 0
    
    return {
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      errorRate: this.metrics.requests > 0 
        ? (this.metrics.errors / this.metrics.requests * 100).toFixed(2) + '%'
        : '0%',
      avgResponseTime: avgResponseTime.toFixed(2) + 'ms',
      p95ResponseTime: this.getPercentile(95) + 'ms',
      p99ResponseTime: this.getPercentile(99) + 'ms'
    }
  }
  
  /**
   * Get percentile
   */
  getPercentile(percentile) {
    if (this.metrics.responseTime.length === 0) return 0
    
    const sorted = [...this.metrics.responseTime].sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[index] || 0
  }
  
  /**
   * Send alert
   */
  alert(type, data) {
    // TODO: Integrate with alerting service (email, Slack, etc.)
    console.warn(`[Alert] ${type}:`, data)
  }
  
  /**
   * Health check
   */
  async healthCheck() {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      metrics: this.getMetrics()
    }
    
    // Check database connection
    try {
      const supabase = require('../config/supabase')
      const { error } = await supabase.from('users').select('id', { count: 'exact', head: true })
      health.database = error ? 'disconnected' : 'connected'
      if (error) health.status = 'unhealthy'
    } catch (error) {
      health.database = 'disconnected'
      health.status = 'unhealthy'
    }
    
    // Check Redis connection (optional - don't fail if not connected)
    try {
      const CacheService = require('./CacheService')
      health.cache = CacheService.enabled ? 'connected' : 'disabled'
    } catch (error) {
      health.cache = 'disabled'
    }
    
    return health
  }
  
  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      requests: 0,
      errors: 0,
      responseTime: []
    }
  }
}

module.exports = new MonitoringService()
