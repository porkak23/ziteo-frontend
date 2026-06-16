import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

/**
 * Auth flow helpers for E2E tests.
 *
 * The beta auth flow is registration-first and login is phone-only (no PIN):
 *   SplashScreen (≈3s) → WelcomeScreen → "Ya estoy registrado"
 *     → AlreadyRegisteredNotice (enter phone → "Ingresar") → role dashboard
 *
 * loginBeta() in authService recovers an existing beta account from the
 * phone number alone, so the PIN step that older tests used no longer exists.
 *
 * Selectors prefer the data-testid attributes added to the auth components:
 *   - welcome-login-btn  → WelcomeScreen "Ya estoy registrado"
 *   - login-phone-input  → AlreadyRegisteredNotice phone <input>
 *   - login-submit-btn   → AlreadyRegisteredNotice "Ingresar"
 *   - login-api-error    → AlreadyRegisteredNotice error banner
 */

/**
 * Navigates through splash + welcome to reach the login (AlreadyRegisteredNotice).
 */
async function navigateToLogin(page: Page): Promise<void> {
  // Wait for splash to finish and the welcome screen to appear.
  const loginBtn = page.getByTestId('welcome-login-btn')
  await expect(loginBtn).toBeVisible({ timeout: 10_000 })
  await loginBtn.click()
}

/**
 * Fills the phone input on the login screen with the 8-digit local number
 * (without the +591 prefix, which is rendered as a static span).
 */
async function fillPhone(page: Page, phone: string): Promise<void> {
  const phoneInput = page.getByTestId('login-phone-input')
  await expect(phoneInput).toBeVisible({ timeout: 5_000 })
  await phoneInput.fill(phone)
}

/**
 * Submits the login form via the "Ingresar" button.
 */
async function submitLogin(page: Page): Promise<void> {
  const submitBtn = page.getByTestId('login-submit-btn')
  await expect(submitBtn).toBeEnabled({ timeout: 5_000 })
  await submitBtn.click()
}

/**
 * Waits for the app to leave the login screen after a successful login.
 * Once authenticated the app unmounts AlreadyRegisteredNotice and renders the
 * role-specific dashboard; we confirm by waiting for the phone input to detach.
 */
async function waitForDashboard(page: Page): Promise<void> {
  await expect(page.getByTestId('login-phone-input')).toBeHidden({ timeout: 15_000 })
}

/**
 * Full login flow helper.
 *
 * @param page  - Playwright Page object
 * @param phone - 8-digit local number without +591 prefix, e.g. "79999901"
 *
 * Usage:
 *   await page.goto('/')
 *   await loginAs(page, '79999901')
 *   // page is now on the role dashboard
 */
export async function loginAs(page: Page, phone: string): Promise<void> {
  await navigateToLogin(page)
  await fillPhone(page, phone)
  await submitLogin(page)
  await waitForDashboard(page)
}
