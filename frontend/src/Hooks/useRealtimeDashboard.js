/*
 * useRealtimeDashboard Hook
 * -------------------------
 * Dashboard עם עדכונים בזמן אמת
 */

import { useState, useEffect } from 'react'
import { useRealtimeUser } from './useRealtime'
import { dashboardAPI } from '../services/api'
import { notify } from '../utils/notifications'

export function useRealtimeDashboard(userId) {
  const [stats, setStats] = useState(null)
  const [recentAnomalies, setRecentAnomalies] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  
  // Initial data fetch
  useEffect(() => {
    if (userId) {
      fetchDashboardData()
    }
  }, [userId])
  
  // Real-time updates for detections/anomalies
  useRealtimeUser('anomalies', userId, (payload) => {
    console.log('🔴 New anomaly:', payload)
    
    if (payload.eventType === 'INSERT') {
      // New anomaly detected
      const newAnomaly = payload.new
      
      setRecentAnomalies(prev => [newAnomaly, ...prev].slice(0, 10))
      
      // Update stats
      setStats(prev => ({
        ...prev,
        total_anomalies: (prev?.total_anomalies || 0) + 1,
        high_severity: (prev?.high_severity || 0) + (newAnomaly.severity_level === 'high' ? 1 : 0)
      }))
      
      // Show notification
      if (newAnomaly.severity_level === 'high') {
        notify.error(`🚨 ${newAnomaly.rule_name || 'אנומליה חמורה זוהתה'}`)
      } else {
        notify.warning(`⚠️ ${newAnomaly.rule_name || 'אנומליה זוהתה'}`)
      }
      
      setLastUpdate(new Date())
    }
    
    if (payload.eventType === 'UPDATE') {
      // Anomaly status changed
      setRecentAnomalies(prev => 
        prev.map(a => a.id === payload.new.id ? payload.new : a)
      )
      setLastUpdate(new Date())
    }
  })
  
  // Real-time updates for baseline stats
  useRealtimeUser('baseline_stats', userId, (payload) => {
    console.log('📊 Baseline updated:', payload)
    fetchDashboardData() // Refresh all stats
  })
  
  // Fetch dashboard data
  async function fetchDashboardData() {
    try {
      setLoading(true)
      
      const [statsData, anomaliesData] = await Promise.all([
        dashboardAPI.getStats().catch(() => ({})),
        dashboardAPI.getRecentAnomalies().catch(() => [])
      ])
      
      setStats(statsData)
      setRecentAnomalies(anomaliesData || [])
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      notify.error('שגיאה בטעינת נתוני Dashboard')
    } finally {
      setLoading(false)
    }
  }
  
  return {
    stats,
    recentAnomalies,
    loading,
    lastUpdate,
    refresh: fetchDashboardData
  }
}
