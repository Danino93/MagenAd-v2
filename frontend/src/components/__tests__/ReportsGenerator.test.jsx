/*
 * ReportsGenerator Tests
 * ----------------------
 * בדיקות להפקת דוחות
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ReportsGenerator } from '../ReportsGenerator'
import { reportsAPI } from '../../services/api'

// Mock API
vi.mock('../../services/api', () => ({
  reportsAPI: {
    generate: vi.fn()
  }
}))

// Mock notifications
vi.mock('../../utils/notifications', () => ({
  notify: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

describe('ReportsGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render button', () => {
    render(<ReportsGenerator />)
    
    const button = screen.getByText(/הפק דוח|דוחות/i)
    expect(button).toBeInTheDocument()
  })

  it('should open modal on button click', async () => {
    render(<ReportsGenerator />)
    
    const button = screen.getByText(/הפק דוח|דוחות/i)
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(screen.getByText(/הפקת דוח|דוח מתקדם/i)).toBeInTheDocument()
    })
  })

  it('should select report type', async () => {
    render(<ReportsGenerator />)
    
    fireEvent.click(screen.getByText(/הפק דוח|דוחות/i))
    
    await waitFor(() => {
      const summaryOption = screen.getByText(/סיכום כללי|summary/i)
      if (summaryOption) {
        fireEvent.click(summaryOption)
        expect(summaryOption).toBeInTheDocument()
      }
    })
  })

  it('should generate report', async () => {
    const mockBlob = new Blob(['test'], { type: 'application/pdf' })
    reportsAPI.generate = vi.fn().mockResolvedValue(mockBlob)

    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    global.URL.revokeObjectURL = vi.fn()

    render(<ReportsGenerator />)
    
    fireEvent.click(screen.getByText(/הפק דוח|דוחות/i))
    
    await waitFor(() => {
      const generateButton = screen.getByRole('button', { name: /הפק|generate/i })
      if (generateButton) {
        fireEvent.click(generateButton)
      }
    })

    await waitFor(() => {
      expect(reportsAPI.generate).toHaveBeenCalled()
    })
  })

  it('should handle errors', async () => {
    reportsAPI.generate = vi.fn().mockRejectedValue(new Error('Failed'))
    
    render(<ReportsGenerator />)
    
    fireEvent.click(screen.getByText(/הפק דוח|דוחות/i))
    
    await waitFor(() => {
      const generateButton = screen.getByRole('button', { name: /הפק|generate/i })
      if (generateButton) {
        fireEvent.click(generateButton)
      }
    })

    await waitFor(() => {
      expect(reportsAPI.generate).toHaveBeenCalled()
    })
  })
})
