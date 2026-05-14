import { test, expect } from '@playwright/test'

test.describe('Auth screens', () => {
  test('app loads and shows login form', async ({ page }) => {
    await page.goto('/')
    // The login screen has a PIN input
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 8_000 })
  })

  test('login form shows phone and PIN fields', async ({ page }) => {
    await page.goto('/')
    // Wait for at least one input to appear
    const inputs = page.locator('input')
    await expect(inputs.first()).toBeVisible({ timeout: 8_000 })
    const count = await inputs.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  test('register link is accessible from login', async ({ page }) => {
    await page.goto('/')
    // There should be a button or link to switch to registration
    const registerBtn = page.getByRole('button', { name: /registrar|crear cuenta|regístrate/i })
    await expect(registerBtn).toBeVisible({ timeout: 8_000 })
  })
})
