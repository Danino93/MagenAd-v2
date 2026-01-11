/*
 * Global Error Handler
 * --------------------
 * טיפול בשגיאות גלובלי
 */

const MonitoringService = require('../services/MonitoringService')

function errorHandler(err, req, res, next) {
  // Log error
  MonitoringService.logError(err, req)
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  const response = {
    error: {
      message: isDevelopment ? err.message : 'שגיאת שרת',
      ...(isDevelopment && { stack: err.stack })
    }
  }
  
  // Determine status code
  const statusCode = err.statusCode || err.status || 500
  
  res.status(statusCode).json(response)
}

module.exports = errorHandler
