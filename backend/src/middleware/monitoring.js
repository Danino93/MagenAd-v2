/*
 * Monitoring Middleware
 * ---------------------
 * מעקב אחר requests
 */

const MonitoringService = require('../services/MonitoringService')

function monitoringMiddleware(req, res, next) {
  const start = Date.now()
  
  // Override res.json to log after response
  const originalJson = res.json.bind(res)
  
  res.json = function(data) {
    const duration = Date.now() - start
    MonitoringService.logRequest(req, res, duration)
    return originalJson(data)
  }
  
  // Handle errors
  res.on('finish', () => {
    const duration = Date.now() - start
    MonitoringService.logRequest(req, res, duration)
  })
  
  next()
}

module.exports = monitoringMiddleware
