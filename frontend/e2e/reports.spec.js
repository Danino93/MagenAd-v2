/*
 * Reports E2E Tests
 * ------------------
 * בדיקות End-to-End להפקת דוחות
 */

import { test, expect } from '@playwright/test'

test.describe('Reports Generation', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Wait for dashboard
    await page.waitForURL('/app/dashboard')
  })
  
  test('should open reports modal', async ({ page }) => {
    // Click report button
    await page.click('text=הפק דוח')
    
    // Modal should be visible
    await expect(page.locator('text=הפקת דוח מתקדם')).toBeVisible()
  })
  
  test('should generate PDF report', async ({ page }) => {
    // Open modal
    await page.click('text=הפק דוח')
    
    // Select report type
    await page.click('text=סיכום כללי')
    
    // Select format
    await page.click('text=PDF')
    
    // Generate
    const downloadPromise = page.waitForEvent('download')
    await page.click('button:has-text("הפק דוח")')
    
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('.pdf')
  })
  
  test('should show loading state', async ({ page }) => {
    await page.click('text=הפק דוח')
    await page.click('button:has-text("הפק דוח")')
    
    // Should show loading
    await expect(page.locator('text=מפיק דוח...')).toBeVisible()
  })
})
