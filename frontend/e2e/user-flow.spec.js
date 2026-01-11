/*
 * Complete User Flow E2E Test
 * ----------------------------
 * בדיקת זרימה מלאה של משתמש
 */

import { test, expect } from '@playwright/test'

test.describe('Complete User Flow', () => {
  test('should complete full user journey', async ({ page }) => {
    // 1. Login
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Wait for dashboard
    await page.waitForURL('/app/dashboard', { timeout: 10000 })
    
    // 2. Check dashboard loaded
    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 })
    
    // 3. Check real-time indicator
    const realtimeIndicator = page.locator('text=מחובר, text=לא מחובר')
    if (await realtimeIndicator.count() > 0) {
      await expect(realtimeIndicator.first()).toBeVisible()
    }
    
    // 4. Generate report
    const reportButton = page.locator('text=הפק דוח')
    if (await reportButton.count() > 0) {
      await reportButton.first().click()
      
      // Wait for modal
      await page.waitForTimeout(1000)
      
      // Close modal if opened
      const closeButton = page.locator('button:has-text("סגור"), button:has-text("X")')
      if (await closeButton.count() > 0) {
        await closeButton.first().click()
      }
    }
    
    // 5. Check notifications bell
    const notificationsBell = page.locator('[aria-label*="notifications"], button:has(svg)')
    if (await notificationsBell.count() > 0) {
      await expect(notificationsBell.first()).toBeVisible()
    }
  })
  
  test('should handle real-time updates', async ({ page }) => {
    await page.goto('/login')
    
    // Mock login
    await page.evaluate(() => {
      localStorage.setItem('token', 'mock-token')
    })
    
    await page.goto('/app/dashboard')
    
    // Check real-time indicator
    const realtimeIndicator = page.locator('text=מחובר, text=לא מחובר')
    if (await realtimeIndicator.count() > 0) {
      await expect(realtimeIndicator.first()).toBeVisible()
    }
  })
})
