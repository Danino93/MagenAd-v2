/*
 * Jest Test Setup
 * ---------------
 * הגדרות כלליות לבדיקות
 */

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'test-key'

// Increase timeout for async operations
jest.setTimeout(10000)
