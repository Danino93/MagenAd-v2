/*
 * Activity Feed
 * -------------
 * פיד פעילות בזמן אמת
 */

import { useState, useEffect } from 'react'
import { useRealtimeUser } from '../Hooks/useRealtime'
import { useAuthStore } from '../store/useStore'
import { Activity, Clock } from 'lucide-react'
import api from '../services/api'

export function ActivityFeed() {
  const user = useAuthStore(state => state.user)
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Real-time updates
  useRealtimeUser('activity_feed', user?.id, (payload) => {
    if (payload.eventType === 'INSERT') {
      setActivities(prev => [payload.new, ...prev].slice(0, 50))
    }
  })
  
  // Load initial activities
  useEffect(() => {
    if (user?.id) {
      loadActivities()
    }
  }, [user?.id])
  
  async function loadActivities() {
    try {
      // TODO: Fetch from API when endpoint is ready
      // const response = await api.get(`/activity-feed?user_id=${user.id}`)
      // setActivities(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load activities:', error)
      setLoading(false)
    }
  }
  
  const formatTime = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (minutes < 1) return 'עכשיו'
    if (minutes < 60) return `לפני ${minutes} דקות`
    if (hours < 24) return `לפני ${hours} שעות`
    if (days < 7) return `לפני ${days} ימים`
    return date.toLocaleDateString('he-IL')
  }
  
  const severityColors = {
    success: 'text-green-600 bg-green-50',
    info: 'text-blue-600 bg-blue-50',
    warning: 'text-yellow-600 bg-yellow-50',
    error: 'text-red-600 bg-red-50'
  }
  
  return (
    <div className="bg-white rounded-lg shadow" dir="rtl">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          <h3 className="font-bold text-lg">פעילות אחרונה</h3>
          <span className="text-sm text-gray-500 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Live
          </span>
        </div>
      </div>
      
      <div className="divide-y max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
            <p>טוען פעילות...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>אין פעילות עדיין</p>
          </div>
        ) : (
          activities.map(activity => (
            <div 
              key={activity.id}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  severityColors[activity.severity] || severityColors.info
                }`}>
                  <Clock className="w-4 h-4" />
                </div>
                
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {activity.title}
                  </p>
                  {activity.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {activity.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {formatTime(activity.created_at)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
