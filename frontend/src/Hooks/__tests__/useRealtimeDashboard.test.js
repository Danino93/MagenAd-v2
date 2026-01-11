/*
 * useRealtimeDashboard Tests
 * --------------------------
 * בדיקות ל-Hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useRealtimeDashboard } from '../useRealtimeDashboard'
import { dashboardAPI } from '../../services/api'

vi.mock('../../services/api', () => ({
  dashboardAPI: {
    getStats: vi.fn(),
    getRecentAnomalies: vi.fn()
  }
}))

vi.mock('../useRealtime', () => ({
  useRealtimeUser: vi.fn(() => ({ isConnected: true }))
}))

describe('useRealtimeDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch initial data', async () => {
    const mockStats = { total_anomalies: 10 }
    const mockAnomalies = [{ id: 1, title: 'Test' }]
    
    dashboardAPI.getStats = vi.fn().mockResolvedValue(mockStats)
    dashboardAPI.getRecentAnomalies = vi.fn().mockResolvedValue(mockAnomalies)
    
    const { result } = renderHook(() => useRealtimeDashboard('user-id'))
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.stats).toEqual(mockStats)
    expect(result.current.recentAnomalies).toEqual(mockAnomalies)
  })

  it('should handle errors', async () => {
    dashboardAPI.getStats = vi.fn().mockRejectedValue(new Error('Failed'))
    dashboardAPI.getRecentAnomalies = vi.fn().mockResolvedValue([])
    
    const { result } = renderHook(() => useRealtimeDashboard('user-id'))
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.stats).toBeNull()
  })
})
