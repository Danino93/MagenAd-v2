/*
 * Realtime Connection Manager
 * ----------------------------
 * ניהול חיבור WebSocket ל-Supabase Realtime
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

class RealtimeManager {
  constructor() {
    this.subscriptions = new Map()
    this.isConnected = false
    this.connectionCallbacks = []
  }

  /**
   * Subscribe to table changes
   */
  subscribe(table, callback, filter = {}) {
    const channelName = `${table}_${Date.now()}`
    
    let channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          ...filter
        },
        (payload) => {
          console.log(`[Realtime] ${table} changed:`, payload)
          callback(payload)
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ [Realtime] Subscribed to ${table}`)
          this.isConnected = true
          this.notifyConnectionChange(true)
        } else if (status === 'CLOSED') {
          console.log(`❌ [Realtime] Disconnected from ${table}`)
          this.isConnected = false
          this.notifyConnectionChange(false)
        }
      })
    
    this.subscriptions.set(channelName, channel)
    
    return () => this.unsubscribe(channelName)
  }

  /**
   * Subscribe to specific row
   */
  subscribeToRow(table, id, callback) {
    return this.subscribe(
      table,
      callback,
      { filter: `id=eq.${id}` }
    )
  }

  /**
   * Subscribe to user's data
   */
  subscribeToUser(table, userId, callback) {
    return this.subscribe(
      table,
      callback,
      { filter: `user_id=eq.${userId}` }
    )
  }

  /**
   * Unsubscribe from channel
   */
  unsubscribe(channelName) {
    const channel = this.subscriptions.get(channelName)
    if (channel) {
      supabase.removeChannel(channel)
      this.subscriptions.delete(channelName)
      console.log(`🔌 [Realtime] Unsubscribed from ${channelName}`)
    }
  }

  /**
   * Unsubscribe all
   */
  unsubscribeAll() {
    this.subscriptions.forEach((channel, name) => {
      this.unsubscribe(name)
    })
    console.log('🔌 [Realtime] All subscriptions closed')
  }

  /**
   * Connection status callbacks
   */
  onConnectionChange(callback) {
    this.connectionCallbacks.push(callback)
    
    // Call immediately with current status
    callback(this.isConnected)
    
    // Return unsubscribe function
    return () => {
      const index = this.connectionCallbacks.indexOf(callback)
      if (index > -1) {
        this.connectionCallbacks.splice(index, 1)
      }
    }
  }

  /**
   * Notify connection change
   */
  notifyConnectionChange(isConnected) {
    this.connectionCallbacks.forEach(callback => {
      callback(isConnected)
    })
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return this.isConnected
  }
}

// Export singleton
export const realtimeManager = new RealtimeManager()
export default realtimeManager
