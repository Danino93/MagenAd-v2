/*
 * Notifications Context
 * ---------------------
 * Real-time notifications provider
 */

import { createContext, useContext, useState, useEffect } from 'react'
import { useRealtimeUser } from '../Hooks/useRealtime'
import { useAuthStore } from '../store/useStore'
import { notify } from '../utils/notifications'
import api from '../services/api'

const NotificationsContext = createContext()

export function NotificationsProvider({ children }) {
  const user = useAuthStore(state => state.user)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  
  // Subscribe to real-time notifications (only if user exists)
  useRealtimeUser('notifications', user?.id || null, (payload) => {
    if (payload.eventType === 'INSERT') {
      const newNotification = payload.new
      
      // Add to list
      setNotifications(prev => [newNotification, ...prev])
      setUnreadCount(prev => prev + 1)
      
      // Show toast
      showNotificationToast(newNotification)
      
      // Play sound (optional)
      playNotificationSound()
    }
    
    if (payload.eventType === 'UPDATE') {
      setNotifications(prev =>
        prev.map(n => n.id === payload.new.id ? payload.new : n)
      )
      
      // Update unread count
      if (payload.new.read && !payload.old?.read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    }
  })
  
  // Load initial notifications
  useEffect(() => {
    if (user?.id) {
      loadNotifications()
    }
  }, [user?.id])
  
  async function loadNotifications() {
    try {
      // TODO: Fetch from API when endpoint is ready
      // const response = await api.get(`/notifications?user_id=${user.id}`)
      // setNotifications(response.data)
      // setUnreadCount(response.data.filter(n => !n.read).length)
    } catch (error) {
      console.error('Failed to load notifications:', error)
    }
  }
  
  async function markAsRead(id) {
    try {
      // TODO: Update in DB when endpoint is ready
      // await api.patch(`/notifications/${id}`, { read: true })
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }
  
  async function markAllAsRead() {
    try {
      // TODO: Update all in DB when endpoint is ready
      // await api.patch(`/notifications/mark-all-read`, { user_id: user.id })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }
  
  function showNotificationToast(notification) {
    const severityMap = {
      high: notify.error,
      medium: notify.warning,
      low: notify.info,
      success: notify.success
    }
    
    const notifyFn = severityMap[notification.severity] || notify.info
    notifyFn(notification.title || notification.message)
  }
  
  function playNotificationSound() {
    // Optional: play notification sound
    try {
      const audio = new Audio('/notification.mp3')
      audio.volume = 0.3
      audio.play().catch(() => {}) // Ignore errors
    } catch (error) {
      // Sound file might not exist - that's okay
    }
  }
  
  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  }
  
  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider')
  }
  return context
}
