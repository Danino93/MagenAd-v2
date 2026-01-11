// src/hooks/useCampaigns.js
import { useState, useEffect } from 'react'
import axios from 'axios'
import { useCampaignStore } from '../store/useStore'
import { notify } from '../utils/notifications'

const API_URL = 'http://localhost:3001/api'

export function useCampaigns() {
  const { campaigns, setCampaigns, setLoading, setError } = useCampaignStore()
  const [refreshKey, setRefreshKey] = useState(0)
  
  useEffect(() => {
    fetchCampaigns()
  }, [refreshKey])
  
  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      const response = await axios.get(`${API_URL}/campaigns`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setCampaigns(response.data)
      setError(null)
    } catch (error) {
      const message = error.response?.data?.message || 'שגיאה בטעינת קמפיינים'
      setError(message)
      notify.error(message)
    } finally {
      setLoading(false)
    }
  }
  
  const refresh = () => {
    setRefreshKey(prev => prev + 1)
  }
  
  return { 
    campaigns, 
    fetchCampaigns,
    refresh
  }
}

export default useCampaigns
