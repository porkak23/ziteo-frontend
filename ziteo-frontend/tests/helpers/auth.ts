import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

/**
 * Auth flow helpers for E2E tests.
 *
 * The new auth flow is PIN-based:
 *   SplashScreen (≈3s) → WelcomeScreen → "Ya estoy registrado"
 *     → AlreadyRegisteredNotice (phase: phone)
 *       → enter phone → "Continuar"
 *     → AlreadyRegisteredNotice (phase: pin)
 *       → enter 6-digit PIN via PinPad → auto-submit
 *     → role dashboard
 *
 * Selectors:
 *   - welcome-login-btn  → WelcomeScreen "Ya estoy registrado"
 *   - login-phone-input  → AlreadyRegisteredNotice phone <input>
 *   - login-submit-btn   → AlreadyRegisteredNotice "Continuar" button
 *   - login-api-error    → AlreadyRegisteredNotice error span
 *
 * PIN digits are entered by clicking PinPad buttons (aria-label matches the digit).
 */

/**
 * Navigates through splash + welcome to reach the login (AlreadyRegisteredNotice).
 */
async function navigateToLogin(page: Page): Promise<void> {
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
 * Submits the phone form via the "Continuar" button to advance to the PIN phase.
 */
async function submitPhone(page: Page): Promise<void> {
  const submitBtn = page.getByTestId('login-submit-btn')
  await expect(submitBtn).toBeEnabled({ timeout: 5_000 })
  await submitBtn.click()
}

/**
 * Enters a 6-digit PIN via the PinPad by clicking each digit button.
 * Auto-submit fires when the 6th digit is entered.
 *
 * @param pin - 6-digit PIN string, e.g. "123456"
 */
async function enterPin(page: Page, pin: string): Promise<void> {
  // Wait for the PinPad to appear — the "Borrar último dígito" button is a reliable landmark
  await expect(
    page.getByRole('button', { name: 'Borrar último dígito' })
  ).toBeVisible({ timeout: 5_000 })

  for (const digit of pin) {
    await page.getByRole('button', { name: digit, exact: true }).first().click()
  }
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
 * @param pin   - 6-digit PIN string, e.g. "123456"
 *
 * Usage:
 *   await page.goto('/')
 *   await loginAs(page, '79999901', '123456')
 *   // page is now on the role dashboard
 */
export async function loginAs(page: Page, phone: string, pin: string): Promise<void> {
  await navigateToLogin(page)
  await fillPhone(page, phone)
  await submitPhone(page)
  await enterPin(page, pin)
  await waitForDashboard(page)
}
