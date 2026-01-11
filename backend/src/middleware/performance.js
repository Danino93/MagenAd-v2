/*
 * Performance Monitoring Middleware
 * ----------------------------------
 * מעקב אחר ביצועים
 */

const performance = (req, res, next) => {
  const start = Date.now()
  
  // Override res.json to log performance
  const originalJson = res.json.bind(res)
  
  res.json = function(data) {
    const duration = Date.now() - start
    
    // Log slow requests (> 1 second)
    if (duration > 1000) {
      console.warn(`[Performance] Slow request: ${req.method} ${req.path} - ${duration}ms`)
    }
    
    // Add performance header
    res.setHeader('X-Response-Time', `${duration}ms`)
    
    return originalJson(data)
  }
  
  next()
}

module.exports = performance
