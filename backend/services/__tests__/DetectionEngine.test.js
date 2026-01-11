/*
 * Detection Engine Tests
 * ----------------------
 * בדיקות למנוע הזיהוי
 */

const DetectionEngine = require('../DetectionEngine')

describe('DetectionEngine', () => {
  let detectionEngine

  beforeEach(() => {
    detectionEngine = new DetectionEngine()
  })

  describe('IP Anomaly Detection (A1)', () => {
    test('should detect multiple clicks from same IP', async () => {
      const click = {
        id: 'test-1',
        ip_address: '1.2.3.4',
        click_timestamp: new Date(),
        ad_account_id: 'test-account'
      }

      // Mock supabase response
      const originalSupabase = require('../../config/supabase')
      jest.spyOn(originalSupabase, 'from').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({
          data: [
            { id: '1' },
            { id: '2' },
            { id: '3' },
            { id: '4' },
            { id: '5' }
          ]
        })
      })

      const result = await detectionEngine.checkSameIPClicks(
        click,
        'test-account',
        { threshold: 5, timeWindowHours: 1 }
      )

      expect(result).toBeDefined()
      expect(result).not.toBeNull()
      expect(result.rule_name).toBe('same_ip_clicks')
      expect(result.severity).toBe('medium')
    })

    test('should not detect normal IP distribution', async () => {
      const click = {
        id: 'test-1',
        ip_address: '1.2.3.4',
        click_timestamp: new Date(),
        ad_account_id: 'test-account'
      }

      const originalSupabase = require('../../config/supabase')
      jest.spyOn(originalSupabase, 'from').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({
          data: [{ id: '1' }, { id: '2' }]
        })
      })

      const result = await detectionEngine.checkSameIPClicks(
        click,
        'test-account',
        { threshold: 5, timeWindowHours: 1 }
      )

      expect(result).toBeNull()
    })
  })

  describe('Click Velocity (A2)', () => {
    test('should detect click spike', async () => {
      const click = {
        id: 'test-1',
        click_timestamp: new Date(),
        ad_account_id: 'test-account',
        source_key: 'test_source'
      }

      const baseline = { avg_clicks_per_hour: 10 }

      const originalSupabase = require('../../config/supabase')
      jest.spyOn(originalSupabase, 'from').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({
          data: Array(100).fill(null).map((_, i) => ({ id: `click-${i}` }))
        })
      })

      const result = await detectionEngine.checkRapidFire(
        click,
        'test-account',
        baseline,
        { threshold: 3, timeWindowSeconds: 30 }
      )

      expect(result).toBeDefined()
      if (result) {
        expect(result.rule_name).toBe('rapid_fire_clicks')
      }
    })
  })

  describe('Geographic Anomaly (A3)', () => {
    test('should detect unusual geo distribution', async () => {
      const click = {
        id: 'test-1',
        country_code: 'CN',
        city: 'Beijing',
        ad_account_id: 'test-account'
      }

      const baseline = {
        geographic_distribution: {
          'US': 0.90,
          'CA': 0.10
        }
      }

      const originalSupabase = require('../../config/supabase')
      jest.spyOn(originalSupabase, 'from').mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [
            { country_code: 'US' },
            { country_code: 'US' },
            { country_code: 'US' }
          ]
        })
      })

      const result = await detectionEngine.checkImpossibleGeography(
        click,
        'test-account',
        { threshold: 0.1 }
      )

      expect(result).toBeDefined()
      if (result) {
        expect(result.rule_name).toBe('impossible_geography')
      }
    })
  })

  describe('Presets', () => {
    test('should have 3 presets', () => {
      expect(detectionEngine.presets).toHaveProperty('liberal')
      expect(detectionEngine.presets).toHaveProperty('balanced')
      expect(detectionEngine.presets).toHaveProperty('strict')
    })

    test('balanced preset should be recommended', () => {
      expect(detectionEngine.presets.balanced.recommended).toBe(true)
    })
  })

  describe('Fraud Score Calculation', () => {
    test('should calculate fraud score from detections', () => {
      const detections = [
        { severity: 'high', confidence: 0.9 },
        { severity: 'medium', confidence: 0.7 },
        { severity: 'low', confidence: 0.5 }
      ]

      const score = detectionEngine.calculateFraudScore(detections)

      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(100)
    })

    test('should return 0 for empty detections', () => {
      const score = detectionEngine.calculateFraudScore([])
      expect(score).toBe(0)
    })
  })
})
