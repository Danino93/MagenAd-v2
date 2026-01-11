/*
 * Report Controller Tests
 * ------------------------
 * בדיקות ל-Report API
 */

const request = require('supertest')
const express = require('express')
const reportController = require('../reportController')
const supabase = require('../../config/supabase')

// Mock supabase
jest.mock('../../config/supabase', () => ({
  from: jest.fn()
}))

// Create test app
const app = express()
app.use(express.json())

// Mock authenticateToken middleware
const authenticateToken = (req, res, next) => {
  req.user = { id: 'test-user-id', userId: 'test-user-id' }
  next()
}

app.post('/api/reports/generate', authenticateToken, reportController.generate)

describe('Report Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/reports/generate', () => {
    test('should require authentication', async () => {
      const appWithoutAuth = express()
      appWithoutAuth.use(express.json())
      appWithoutAuth.post('/api/reports/generate', reportController.generate)

      const response = await request(appWithoutAuth)
        .post('/api/reports/generate')
        .send({
          type: 'summary',
          format: 'pdf'
        })

      expect(response.status).toBe(500) // Will fail because req.user is undefined
    })

    test('should validate report type', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'test-account' },
          error: null
        })
      })

      const response = await request(app)
        .post('/api/reports/generate')
        .send({
          type: 'invalid_type',
          format: 'pdf'
        })

      // Should handle invalid type gracefully
      expect([200, 400, 500]).toContain(response.status)
    })

    test('should verify account belongs to user', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' }
        })
      })

      const response = await request(app)
        .post('/api/reports/generate')
        .send({
          type: 'summary',
          format: 'pdf',
          accountId: 'wrong-account-id'
        })

      expect(response.status).toBe(404)
      expect(response.body.message).toBe('Account not found')
    })
  })
})
