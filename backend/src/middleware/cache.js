/*
 * Cache Middleware
 * ----------------
 * Middleware לcaching של responses
 */

const CacheService = require('../services/CacheService')

/**
 * Cache middleware factory
 */
function cacheMiddleware(ttl = 3600) {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next()
    }
    
    // Create cache key from URL and query
    const cacheKey = `cache:${req.originalUrl}`
    
    try {
      // Check cache
      const cachedData = await CacheService.get(cacheKey)
      
      if (cachedData) {
        console.log(`[Cache] HIT: ${cacheKey}`)
        return res.json(cachedData)
      }
      
      console.log(`[Cache] MISS: ${cacheKey}`)
      
      // Store original res.json
      const originalJson = res.json.bind(res)
      
      // Override res.json to cache response
      res.json = function(data) {
        // Cache the response
        CacheService.set(cacheKey, data, ttl).catch(err => {
          console.error('Failed to cache response:', err)
        })
        
        return originalJson(data)
      }
      
      next()
    } catch (error) {
      console.error('Cache middleware error:', error)
      next()
    }
  }
}

module.exports = cacheMiddleware
