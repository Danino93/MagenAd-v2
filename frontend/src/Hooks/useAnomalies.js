// src/hooks/useAnomalies.js
import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAnomalyStore } from '../store/useStore'
import { notify } from '../utils/notifications'

const API_URL = 'http://localhost:3001/api'

export function useAnomalies() {
  const { 
    anomalies, 
    filters, 
    setAnomalies, 
    setFilters 
  } = useAnomalyStore()
  
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    fetchAnomalies()
  }, [filters])
  
  const fetchAnomalies = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      const response = await axios.get(`${API_URL}/anomalies`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      })
      
      setAnomalies(response.data)
    } catch (error) {
      notify.error('שגיאה בטעינת אנומליות')
    } finally {
      setLoading(false)
    }
  }
  
  const investigateAnomaly = async (id) => {
    try {
      const token = localStorage.getItem('token')
      
      await axios.post(
        `${API_URL}/anomalies/${id}/investigate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      notify.success('אנומליה נשלחה לבדיקה מעמיקה')
      fetchAnomalies()
    } catch (error) {
      notify.error('שגיאה בשליחה לבדיקה')
    }
  }
  
  const resolveAnomaly = async (id, resolution) => {
    try {
      const token = localStorage.getItem('token')
      
      await axios.put(
        `${API_URL}/anomalies/${id}/resolve`,
        { resolution },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      notify.success('אנומליה סומנה כפתורה')
      fetchAnomalies()
    } catch (error) {
      notify.error('שגיאה בסימון כפתורה')
    }
  }
  
  const dismissAnomaly = async (id) => {
    try {
      const token = localStorage.getItem('token')
      
      await axios.put(
        `${API_URL}/anomalies/${id}/dismiss`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      notify.success('אנומליה נדחתה')
      fetchAnomalies()
    } catch (error) {
      notify.error('שגיאה בדחיית אנומליה')
    }
  }
  
  return { 
    anomalies,
    loading,
    filters,
    setFilters,
    investigateAnomaly,
    resolveAnomaly,
    dismissAnomaly,
    refresh: fetchAnomalies
  }
}

export default useAnomalies
