import { test, expect } from '@playwright/test'

/**
 * Critical E2E: Owner authenticates and views the dashboard.
 *
 * Preconditions:
 *  - E2E_OWNER_EMAIL and E2E_OWNER_PASSWORD env vars set
 *  - Owner account exists in the DB with OWNER role
 */

const OWNER_EMAIL = process.env.E2E_OWNER_EMAIL ?? ''
const OWNER_PASSWORD = process.env.E2E_OWNER_PASSWORD ?? ''

test.describe('Owner dashboard flow', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible()
    await expect(page.locator('input[type="password"]').first()).toBeVisible()
  })

  test('unauthenticated user is redirected from dashboard to login', async ({ page }) => {
    await page.goto('/dashboard')
    // Should redirect to /login
    await page.waitForURL(/\/login/, { timeout: 5_000 })
    await expect(page).toHaveURL(/\/login/)
  })

  test('owner can log in and access dashboard', async ({ page }) => {
    if (!OWNER_EMAIL || !OWNER_PASSWORD) {
      test.skip() // E2E credentials not configured
      return
    }

    await page.goto('/login')

    await page.locator('input[type="email"], input[name="email"]').first().fill(OWNER_EMAIL)
    await page.locator('input[type="password"]').first().fill(OWNER_PASSWORD)
    await page.locator('button[type="submit"]').first().click()

    // Should redirect to /dashboard after login
    await page.waitForURL(/\/dashboard/, { timeout: 10_000 })
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
  })

  test('owner dashboard shows reservations section', async ({ page }) => {
    if (!OWNER_EMAIL || !OWNER_PASSWORD) {
      test.skip()
      return
    }

    await page.goto('/login')
    await page.locator('input[type="email"], input[name="email"]').first().fill(OWNER_EMAIL)
    await page.locator('input[type="password"]').first().fill(OWNER_PASSWORD)
    await page.locator('button[type="submit"]').first().click()
    await page.waitForURL(/\/dashboard/, { timeout: 10_000 })

    // Navigate to reservations
    await page.goto('/dashboard/reservations')
    await expect(page).toHaveURL(/\/dashboard\/reservations/)
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
    await expect(page.locator('body')).not.toHaveText('403')
  })

  test('API /api/reservations GET returns 401 when not authenticated', async ({ request }) => {
    const response = await request.get('/api/reservations')
    expect(response.status()).toBe(401)
  })
})
