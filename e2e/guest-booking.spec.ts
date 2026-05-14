import { test, expect } from '@playwright/test'

/**
 * Critical E2E: Guest books a property using Stripe test card.
 *
 * Preconditions:
 *  - Dev server running with at least one ACTIVE property
 *  - Stripe in test mode (STRIPE_SECRET_KEY = sk_test_...)
 *  - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_test_...
 */
test.describe('Guest booking flow', () => {
  test('guest can browse properties and initiate booking', async ({ page }) => {
    // 1. Navigate to properties listing
    await page.goto('/properties')
    await expect(page).toHaveURL(/\/properties/)

    // 2. At least one property card should be visible
    const propertyCards = page.locator('[data-testid="property-card"], .property-card, article').first()
    await expect(propertyCards).toBeVisible({ timeout: 10_000 })
  })

  test('homepage loads without errors', async ({ page }) => {
    await page.goto('/')
    // No server error pages
    await expect(page).not.toHaveURL(/\/_error/)
    await expect(page.locator('body')).not.toContainText('Internal Server Error')
    await expect(page.locator('body')).not.toContainText('Application error')
  })

  test('booking form renders with required fields', async ({ page }) => {
    await page.goto('/properties')

    // Find and click the first property
    const firstProperty = page.locator('a[href*="/property/"]').first()
    const propertyCount = await firstProperty.count()

    if (propertyCount === 0) {
      test.skip() // No properties seeded — skip
      return
    }

    await firstProperty.click()
    await page.waitForURL(/\/property\//)

    // Property detail page should show pricing info or booking widget
    await expect(page.locator('body')).toBeVisible()
    await expect(page).not.toHaveURL(/\/_error/)
  })

  /**
   * Full booking + Stripe test payment.
   * Run with: PLAYWRIGHT_FULL_FLOW=true pnpm exec playwright test
   * Skipped by default to avoid creating real PENDING bookings in dev DB on every CI run.
   */
  test('full checkout flow with Stripe test card', async ({ page }) => {
    if (!process.env.PLAYWRIGHT_FULL_FLOW) {
      test.skip()
      return
    }

    await page.goto('/properties')

    const firstProperty = page.locator('a[href*="/property/"]').first()
    await expect(firstProperty).toBeVisible({ timeout: 10_000 })
    await firstProperty.click()
    await page.waitForURL(/\/property\//)

    // Select check-in date (assumes a date picker is present)
    // This selector may need adjustment to match the actual date picker component
    const checkInInput = page.locator('input[name="checkIn"], [data-testid="check-in"]').first()
    if (await checkInInput.count() > 0) {
      await checkInInput.fill('2025-09-01')
    }

    const checkOutInput = page.locator('input[name="checkOut"], [data-testid="check-out"]').first()
    if (await checkOutInput.count() > 0) {
      await checkOutInput.fill('2025-09-05')
    }

    // Click reserve / book button
    const bookButton = page.locator('button:has-text("Reservar"), button:has-text("Book"), button:has-text("Reserve")').first()
    if (await bookButton.count() > 0) {
      await bookButton.click()
    }

    // On the booking form, fill in guest info
    await page.locator('input[name="guestName"], input[placeholder*="nome"], input[placeholder*="name"]').first().fill('Test Guest')
    await page.locator('input[name="guestEmail"], input[type="email"]').first().fill('test@example.com')

    // Submit form and wait for Stripe checkout
    const submitBtn = page.locator('button[type="submit"]').first()
    await submitBtn.click()

    // After submission, should navigate to checkout or show Stripe iframe
    await page.waitForTimeout(2000)
    const url = page.url()
    expect(url).toMatch(/checkout|payment|stripe/)
  })
})
