/*
 * Performance Monitoring
 * ----------------------
 * ניטור ביצועים של האפליקציה
 */

/**
 * Measure component render time
 */
export function measureRenderTime(componentName) {
  return {
    start: performance.now(),
    end: function() {
      const duration = performance.now() - this.start
      console.log(`[Performance] ${componentName} rendered in ${duration.toFixed(2)}ms`)
      
      // Send to analytics
      if (duration > 100) {
        console.warn(`[Performance] Slow render detected: ${componentName}`)
      }
    }
  }
}

/**
 * Measure API call time
 */
export function measureAPICall(endpoint) {
  return {
    start: performance.now(),
    end: function(success = true) {
      const duration = performance.now() - this.start
      console.log(`[API] ${endpoint} - ${success ? 'Success' : 'Failed'} - ${duration.toFixed(2)}ms`)
      
      if (duration > 1000) {
        console.warn(`[API] Slow request: ${endpoint}`)
      }
    }
  }
}

/**
 * Log Web Vitals
 */
export function logWebVitals() {
  if ('PerformanceObserver' in window) {
    // Log Core Web Vitals
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log(`[Web Vitals] ${entry.name}:`, entry.value)
        }
      })
      
      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] })
    } catch (e) {
      // PerformanceObserver might not be supported
      console.warn('[Performance] PerformanceObserver not fully supported')
    }
  }
}

/**
 * Monitor memory usage
 */
export function monitorMemory() {
  if (performance.memory) {
    const memory = performance.memory
    console.log('[Memory]', {
      used: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
      total: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
      limit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`
    })
  }
}

/**
 * Track page load time
 */
export function trackPageLoad() {
  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0]
    
    if (perfData) {
      console.log('[Page Load]', {
        dns: `${perfData.domainLookupEnd - perfData.domainLookupStart}ms`,
        tcp: `${perfData.connectEnd - perfData.connectStart}ms`,
        request: `${perfData.responseStart - perfData.requestStart}ms`,
        response: `${perfData.responseEnd - perfData.responseStart}ms`,
        domLoad: `${perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart}ms`,
        total: `${perfData.loadEventEnd - perfData.fetchStart}ms`
      })
    }
  })
}

// Initialize on load
if (typeof window !== 'undefined') {
  trackPageLoad()
  logWebVitals()
}
