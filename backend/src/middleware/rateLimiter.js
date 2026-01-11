/*
 * Rate Limiter Middleware
 * -----------------------
 * הגנה מפני DDoS ו-Brute Force
 */

const rateLimit = require('express-rate-limit')

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'יותר מדי בקשות מכתובת IP זו, נסה שוב מאוחר יותר',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'יותר מדי בקשות, נסה שוב בעוד 15 דקות'
    })
  }
})

// Strict rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  skipSuccessfulRequests: true, // Don't count successful logins
  message: 'יותר מדי ניסיונות התחברות, נסה שוב בעוד 15 דקות',
  handler: (req, res) => {
    console.warn(`[Security] Rate limit exceeded for IP: ${req.ip}`)
    
    res.status(429).json({
      error: 'Too Many Attempts',
      message: 'יותר מדי ניסיונות התחברות. חשבונך ננעל זמנית.',
      retryAfter: 900 // 15 minutes in seconds
    })
  }
})

// Report generation rate limiter (resource intensive)
const reportLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 reports per minute
  message: 'יותר מדי בקשות ליצירת דוחות',
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'יותר מדי בקשות ליצירת דוחות, נסה שוב בעוד דקה'
    })
  }
})

// Export limiters
module.exports = {
  apiLimiter,
  authLimiter,
  reportLimiter
}
