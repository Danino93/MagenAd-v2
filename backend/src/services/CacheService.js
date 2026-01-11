/*
 * Cache Service (Redis)
 * ---------------------
 * שירות Caching עם Redis
 */

class CacheService {
  constructor() {
    this.redis = null
    this.enabled = false
    
    // Try to initialize Redis if available
    try {
      const Redis = require('ioredis')
      
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000)
          return delay
        },
        lazyConnect: true
      })
      
      this.redis.on('connect', () => {
        console.log('✅ Redis connected')
        this.enabled = true
      })
      
      this.redis.on('error', (err) => {
        console.error('❌ Redis error:', err.message)
        this.enabled = false
      })
      
      // Try to connect
      this.redis.connect().catch(() => {
        console.log('⚠️  Redis not available, caching disabled')
        this.enabled = false
      })
    } catch (error) {
      console.log('⚠️  Redis not installed, using in-memory cache')
      this.enabled = false
      this.memoryCache = new Map()
    }
  }
  
  /**
   * Get cached value
   */
  async get(key) {
    if (!this.enabled) {
      // Fallback to memory cache
      if (this.memoryCache) {
        const item = this.memoryCache.get(key)
        if (item && item.expires > Date.now()) {
          return item.value
        }
        this.memoryCache.delete(key)
      }
      return null
    }
    
    try {
      const value = await this.redis.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }
  
  /**
   * Set cache value with TTL
   */
  async set(key, value, ttl = 3600) {
    if (!this.enabled) {
      // Fallback to memory cache
      if (this.memoryCache) {
        this.memoryCache.set(key, {
          value,
          expires: Date.now() + (ttl * 1000)
        })
        // Cleanup expired entries periodically
        if (this.memoryCache.size > 1000) {
          this.cleanupMemoryCache()
        }
      }
      return true
    }
    
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value))
      return true
    } catch (error) {
      console.error('Cache set error:', error)
      return false
    }
  }
  
  /**
   * Delete cache key
   */
  async del(key) {
    if (!this.enabled) {
      if (this.memoryCache) {
        this.memoryCache.delete(key)
      }
      return true
    }
    
    try {
      await this.redis.del(key)
      return true
    } catch (error) {
      console.error('Cache delete error:', error)
      return false
    }
  }
  
  /**
   * Clear cache by pattern
   */
  async delPattern(pattern) {
    if (!this.enabled) {
      if (this.memoryCache) {
        for (const key of this.memoryCache.keys()) {
          if (key.includes(pattern.replace('*', ''))) {
            this.memoryCache.delete(key)
          }
        }
      }
      return true
    }
    
    try {
      const keys = await this.redis.keys(pattern)
      if (keys.length > 0) {
        await this.redis.del(...keys)
      }
      return true
    } catch (error) {
      console.error('Cache pattern delete error:', error)
      return false
    }
  }
  
  /**
   * Check if key exists
   */
  async exists(key) {
    if (!this.enabled) {
      if (this.memoryCache) {
        const item = this.memoryCache.get(key)
        return item && item.expires > Date.now()
      }
      return false
    }
    
    try {
      const exists = await this.redis.exists(key)
      return exists === 1
    } catch (error) {
      console.error('Cache exists error:', error)
      return false
    }
  }
  
  /**
   * Get or set (cache-aside pattern)
   */
  async getOrSet(key, fetchFn, ttl = 3600) {
    // Try to get from cache
    let value = await this.get(key)
    
    if (value !== null) {
      return value
    }
    
    // Fetch from source
    value = await fetchFn()
    
    // Store in cache
    await this.set(key, value, ttl)
    
    return value
  }
  
  /**
   * Cleanup expired memory cache entries
   */
  cleanupMemoryCache() {
    if (!this.memoryCache) return
    
    const now = Date.now()
    for (const [key, item] of this.memoryCache.entries()) {
      if (item.expires <= now) {
        this.memoryCache.delete(key)
      }
    }
  }
}

// Export singleton
module.exports = new CacheService()
