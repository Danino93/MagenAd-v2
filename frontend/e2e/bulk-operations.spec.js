/*
 * Bulk Operations E2E Tests
 * --------------------------
 * בדיקות End-to-End לפעולות מרוכזות
 */

import { test, expect } from '@playwright/test'

test.describe('Bulk Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/app/dashboard')
    
    // Navigate to anomalies
    await page.click('text=אנומליות')
  })
  
  test('should select multiple anomalies', async ({ page }) => {
    // Select first 3 checkboxes
    const checkboxes = page.locator('input[type="checkbox"]')
    await checkboxes.nth(0).check()
    await checkboxes.nth(1).check()
    await checkboxes.nth(2).check()
    
    // Should show count
    await expect(page.locator('text=3 נבחרו')).toBeVisible()
  })
  
  test('should resolve multiple anomalies', async ({ page }) => {
    // Select anomalies
    const checkboxes = page.locator('input[type="checkbox"]')
    await checkboxes.nth(0).check()
    await checkboxes.nth(1).check()
    
    // Click resolve
    await page.click('text=סמן כפתור')
    
    // Confirm
    await page.click('button:has-text("אישור")')
    
    // Should show success message
    await expect(page.locator('text=אנומליות סומנו כפתורות')).toBeVisible()
  })
  
  test('should show confirmation modal for delete', async ({ page }) => {
    const checkboxes = page.locator('input[type="checkbox"]')
    await checkboxes.first().check()
    
    await page.click('text=מחק')
    
    // Confirmation modal should appear
    await expect(page.locator('text=האם למחוק')).toBeVisible()
    await expect(page.locator('text=לא ניתן לבטל פעולה זו')).toBeVisible()
  })
})
