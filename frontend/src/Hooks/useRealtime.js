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
  const [isConnected, setIsConnected] = useState(false)
  
  useEffect(() => {
    // Don't subscribe if no userId
    if (!userId || !table || !callback) {
      setIsConnected(false)
      return
    }
    
    // Subscribe to table with user filter
    const unsubscribe = realtimeManager.subscribe(
      table, 
      callback, 
      { filter: `user_id=eq.${userId}` }
    )
    
    // Subscribe to connection status
    const unsubscribeStatus = realtimeManager.onConnectionChange(setIsConnected)
    
    // Cleanup
    return () => {
      unsubscribe()
      unsubscribeStatus()
    }
  }, [table, userId, callback])
  
  return { isConnected }
}

/**
 * Subscribe to specific row
 */
export function useRealtimeRow(table, id, callback) {
  const [isConnected, setIsConnected] = useState(false)
  
  useEffect(() => {
    // Don't subscribe if no id
    if (!id || !table || !callback) {
      setIsConnected(false)
      return
    }
    
    // Subscribe to table with id filter
    const unsubscribe = realtimeManager.subscribe(
      table, 
      callback, 
      { filter: `id=eq.${id}` }
    )
    
    // Subscribe to connection status
    const unsubscribeStatus = realtimeManager.onConnectionChange(setIsConnected)
    
    // Cleanup
    return () => {
      unsubscribe()
      unsubscribeStatus()
    }
  }, [table, id, callback])
  
  return { isConnected }
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
