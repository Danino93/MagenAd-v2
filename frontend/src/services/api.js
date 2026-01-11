/*
 * API Service Layer
 * ----------------
 * שכבת תקשורת מרכזית עם Backend
 * כולל: Authentication, Error Handling, Retry Logic
 */

import axios from 'axios'
import { notify } from '../utils/notifications'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor - add auth token and performance tracking
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Track performance
    config.metadata = { startTime: performance.now() }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle errors and track performance
api.interceptors.response.use(
  (response) => {
    // Track API call performance
    if (response.config.metadata) {
      const duration = performance.now() - response.config.metadata.startTime
      console.log(`[API] ${response.config.url} - ${duration.toFixed(2)}ms`)
      
      if (duration > 1000) {
        console.warn(`[API] Slow request detected: ${response.config.url} - ${duration.toFixed(2)}ms`)
      }
    }
    return response
  },
  (error) => {
    // Track API error performance
    if (error.config?.metadata) {
      const duration = performance.now() - error.config.metadata.startTime
      console.log(`[API Error] ${error.config.url} - ${duration.toFixed(2)}ms`)
    }
    if (error.response) {
      // Server responded with error
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          localStorage.removeItem('token')
          window.location.href = '/login'
          notify.error('נא להתחבר מחדש')
          break
          
        case 403:
          notify.error('אין לך הרשאה לבצע פעולה זו')
          break
          
        case 404:
          notify.error('המשאב לא נמצא')
          break
          
        case 422:
          // Validation error
          const message = data.message || 'שגיאת ולידציה'
          notify.error(message)
          break
          
        case 429:
          notify.warning('יותר מדי בקשות, נסה שוב בעוד מספר דקות')
          break
          
        case 500:
          notify.error('שגיאת שרת, נסה שוב מאוחר יותר')
          break
          
        default:
          notify.error(data.message || 'שגיאה לא צפויה')
      }
    } else if (error.request) {
      // Request made but no response
      notify.error('אין תקשורת עם השרת')
    } else {
      // Something else happened
      notify.error('שגיאה בשליחת הבקשה')
    }
    
    return Promise.reject(error)
  }
)

/*
 * API Methods
 * -----------
 */

export const reportsAPI = {
  /**
   * Generate Report
   * @param {Object} config - Report configuration
   * @returns {Promise<Blob>}
   */
  generate: async (config) => {
    const response = await api.post('/reports/generate', config, {
      responseType: 'blob'
    })
    return response.data
  },
  
  /**
   * Get Reports List
   * @param {string} accountId - Account ID
   * @returns {Promise<Array>}
   */
  getList: async (accountId) => {
    const response = await api.get(`/reports/${accountId}`)
    return response.data
  },
  
  /**
   * Export to CSV
   * @param {string} accountId - Account ID
   * @returns {Promise<Blob>}
   */
  exportCSV: async (accountId) => {
    const response = await api.get(`/reports/${accountId}/export`, {
      responseType: 'blob'
    })
    return response.data
  }
}

export const anomaliesAPI = {
  /**
   * Get Anomalies
   * @param {Object} filters - Filter parameters
   * @returns {Promise<Array>}
   */
  getAll: async (filters = {}) => {
    const response = await api.get('/anomalies', { params: filters })
    return response.data
  },
  
  /**
   * Get Single Anomaly
   * @param {number} id - Anomaly ID
   * @returns {Promise<Object>}
   */
  getById: async (id) => {
    const response = await api.get(`/anomalies/${id}`)
    return response.data
  },
  
  /**
   * Bulk Resolve
   * @param {Array<number>} ids - Anomaly IDs
   * @returns {Promise<Object>}
   */
  bulkResolve: async (ids) => {
    const response = await api.post('/anomalies/bulk-resolve', { ids })
    return response.data
  },
  
  /**
   * Bulk Dismiss
   * @param {Array<number>} ids - Anomaly IDs
   * @returns {Promise<Object>}
   */
  bulkDismiss: async (ids) => {
    const response = await api.post('/anomalies/bulk-dismiss', { ids })
    return response.data
  },
  
  /**
   * Bulk Delete
   * @param {Array<number>} ids - Anomaly IDs
   * @returns {Promise<Object>}
   */
  bulkDelete: async (ids) => {
    const response = await api.post('/anomalies/bulk-delete', { ids })
    return response.data
  },
  
  /**
   * Bulk Investigate
   * @param {Array<number>} ids - Anomaly IDs
   * @returns {Promise<Object>}
   */
  bulkInvestigate: async (ids) => {
    const response = await api.post('/anomalies/bulk-investigate', { ids })
    return response.data
  }
}

export const campaignsAPI = {
  /**
   * Get All Campaigns
   * @returns {Promise<Array>}
   */
  getAll: async () => {
    const response = await api.get('/campaigns')
    return response.data
  },
  
  /**
   * Get Single Campaign
   * @param {string} id - Campaign ID
   * @returns {Promise<Object>}
   */
  getById: async (id) => {
    const response = await api.get(`/campaigns/${id}`)
    return response.data
  }
}

export const dashboardAPI = {
  /**
   * Get Dashboard Stats
   * @returns {Promise<Object>}
   */
  getStats: async () => {
    const response = await api.get('/dashboard/stats')
    return response.data
  },
  
  /**
   * Get Chart Data
   * @param {number} days - Number of days
   * @returns {Promise<Array>}
   */
  getChartData: async (days = 7) => {
    const response = await api.get('/dashboard/chart', { params: { days } })
    return response.data
  },
  
  /**
   * Get Recent Anomalies
   * @returns {Promise<Array>}
   */
  getRecentAnomalies: async () => {
    const response = await api.get('/dashboard/recent-anomalies')
    return response.data
  }
}

export default api
