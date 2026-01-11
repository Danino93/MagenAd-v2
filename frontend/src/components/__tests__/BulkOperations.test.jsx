/*
 * BulkOperations Tests
 * --------------------
 * בדיקות לפעולות מרוכזות
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BulkOperations } from '../BulkOperations'
import { anomaliesAPI } from '../../services/api'

vi.mock('../../services/api', () => ({
  anomaliesAPI: {
    bulkResolve: vi.fn(),
    bulkDismiss: vi.fn(),
    bulkDelete: vi.fn(),
    bulkInvestigate: vi.fn()
  }
}))

vi.mock('../../utils/notifications', () => ({
  notify: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

describe('BulkOperations', () => {
  const mockItems = [
    { id: 1, title: 'Anomaly 1' },
    { id: 2, title: 'Anomaly 2' },
    { id: 3, title: 'Anomaly 3' }
  ]

  const mockProps = {
    items: mockItems,
    selectedItems: [1, 2],
    onSelectionChange: vi.fn(),
    onActionComplete: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show selection count', () => {
    render(<BulkOperations {...mockProps} />)
    
    expect(screen.getByText(/2|נבחרו/i)).toBeInTheDocument()
  })

  it('should select all items', () => {
    const onSelectionChange = vi.fn()
    
    render(
      <BulkOperations
        {...mockProps}
        selectedItems={[]}
        onSelectionChange={onSelectionChange}
      />
    )
    
    const checkbox = screen.getByRole('checkbox', { name: /בחר הכל|select all/i })
    if (checkbox) {
      fireEvent.click(checkbox)
      expect(onSelectionChange).toHaveBeenCalled()
    }
  })

  it('should perform bulk resolve', async () => {
    anomaliesAPI.bulkResolve = vi.fn().mockResolvedValue({ success: true, message: 'Success' })
    
    const onActionComplete = vi.fn()
    
    render(
      <BulkOperations
        {...mockProps}
        onActionComplete={onActionComplete}
      />
    )
    
    const resolveButton = screen.getByText(/סמן כפתור|resolve/i)
    if (resolveButton) {
      fireEvent.click(resolveButton)
      
      await waitFor(() => {
        expect(anomaliesAPI.bulkResolve).toHaveBeenCalledWith([1, 2])
      })
    }
  })
})
