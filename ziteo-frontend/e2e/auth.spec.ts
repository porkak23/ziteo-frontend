import { test, expect } from '@playwright/test'

test.describe('Auth screens', () => {
  test('app loads and shows the welcome screen', async ({ page }) => {
    await page.goto('/')
    // After the splash, WelcomeScreen exposes register + login entry buttons.
    await expect(page.getByTestId('welcome-register-btn')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByTestId('welcome-login-btn')).toBeVisible({ timeout: 10_000 })
  })

  test('login screen shows the phone field (beta login is phone-only)', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('welcome-login-btn').click()
    // AlreadyRegisteredNotice: phone input + "Ingresar" submit. There is no PIN
    // field in the beta flow — loginBeta recovers the account from the phone.
    await expect(page.getByTestId('login-phone-input')).toBeVisible({ timeout: 5_000 })
    await expect(page.getByTestId('login-submit-btn')).toBeVisible({ timeout: 5_000 })
  })

  test('register is accessible from the welcome screen', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('welcome-register-btn')).toBeVisible({ timeout: 10_000 })
  })
})
