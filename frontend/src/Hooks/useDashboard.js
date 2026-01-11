// src/hooks/useDashboard.js
import { useEffect } from 'react'
import axios from 'axios'
import { useDashboardStore } from '../store/useStore'
import { notify } from '../utils/notifications'

const API_URL = 'http://localhost:3001/api'

export function useDashboard() {
  const { 
    stats, 
    chartData, 
    recentAnomalies,
    setStats,
    setChartData,
    setRecentAnomalies,
    setLoading 
  } = useDashboardStore()
  
  useEffect(() => {
    loadDashboardData()
  }, [])
  
  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      const [statsRes, chartRes, anomaliesRes] = await Promise.all([
        axios.get(`${API_URL}/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/dashboard/chart`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { days: 7 }
        }),
        axios.get(`${API_URL}/dashboard/recent-anomalies`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])
      
      setStats(statsRes.data)
      setChartData(chartRes.data)
      setRecentAnomalies(anomaliesRes.data)
    } catch (error) {
      notify.error('שגיאה בטעינת נתוני Dashboard')
    } finally {
      setLoading(false)
    }
  }
  
  return {
    stats,
    chartData,
    recentAnomalies,
    refresh: loadDashboardData
  }
}

export default useDashboard
