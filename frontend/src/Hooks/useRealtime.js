/*
 * useRealtime Hook
 * ----------------
 * React Hook לחיבור Realtime
 */

import { useEffect, useState } from 'react'
import { realtimeManager } from '../services/realtime'

/**
 * Subscribe to table changes
 */
export function useRealtimeTable(table, callback, filter = {}) {
  const [isConnected, setIsConnected] = useState(false)
  
  useEffect(() => {
    if (!table || !callback) return
    
    // Subscribe to table
    const unsubscribe = realtimeManager.subscribe(table, callback, filter)
    
    // Subscribe to connection status
    const unsubscribeStatus = realtimeManager.onConnectionChange(setIsConnected)
    
    // Cleanup
    return () => {
      unsubscribe()
      unsubscribeStatus()
    }
  }, [table, filter])
  
  return { isConnected }
}

/**
 * Subscribe to user's data
 */
export function useRealtimeUser(table, userId, callback) {
  if (!userId) {
    return { isConnected: false }
  }
  
  return useRealtimeTable(table, callback, { filter: `user_id=eq.${userId}` })
}

/**
 * Subscribe to specific row
 */
export function useRealtimeRow(table, id, callback) {
  if (!id) {
    return { isConnected: false }
  }
  
  return useRealtimeTable(table, callback, { filter: `id=eq.${id}` })
}

/**
 * Connection status
 */
export function useRealtimeStatus() {
  const [isConnected, setIsConnected] = useState(false)
  
  useEffect(() => {
    const unsubscribe = realtimeManager.onConnectionChange(setIsConnected)
    return unsubscribe
  }, [])
  
  return isConnected
}
