import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

/**
 * Navigates through the splash screen and welcome screen to reach the
 * login form.
 *
 * The app shows a SplashScreen (3 second progress bar) before revealing
 * the WelcomeScreen. We wait for the "Inicia Sesion" button which is
 * rendered on WelcomeScreen.
 *
 * TODO data-testid: add data-testid="welcome-login-btn" to the
 *   "Inicia Sesion" button in WelcomeScreen.tsx so this selector is
 *   resilient to label changes.
 */
async function navigateToLogin(page: Page): Promise<void> {
  // Wait for splash to finish and welcome screen to appear (up to 8s)
  const loginBtn = page.getByRole('button', { name: /inicia sesión/i })
  await expect(loginBtn).toBeVisible({ timeout: 8_000 })
  await loginBtn.click()
}

/**
 * Fills in the phone number input on the login form.
 *
 * The phone field is a <input type="tel"> that accepts only the local
 * 8-digit part (without +591 prefix). The prefix is rendered as a static
 * span.
 *
 * TODO data-testid: add data-testid="login-phone-input" to the phone
 *   <input> in LoginForm.tsx so this selector is resilient.
 */
async function fillPhone(page: Page, phone: string): Promise<void> {
  // The login form has a tel input right after the "+591" prefix span.
  // We target it by its placeholder which is stable.
  const phoneInput = page.locator('input[type="tel"][placeholder="7XX XXX XX"]')
  await expect(phoneInput).toBeVisible({ timeout: 5_000 })
  await phoneInput.fill(phone)
}

/**
 * Fills in the PIN by clicking on the PIN box area (which focuses the
 * hidden input) and typing the digits.
 *
 * The PIN UI renders 8 visual boxes backed by a single hidden
 * <input type="tel"> with opacity:0. We click the first box to focus
 * the hidden input, then type the digits.
 *
 * TODO data-testid: add data-testid="login-pin-hidden-input" to the
 *   hidden PIN <input> in LoginForm.tsx so we can target it directly
 *   without relying on opacity:0 positioning tricks.
 */
async function fillPin(page: Page, pin: string): Promise<void> {
  // The hidden PIN input is the second input[type="tel"] on the page
  // (first is the phone field). It has maxLength=8.
  const pinInput = page.locator('input[type="tel"][maxlength="8"]')
  await expect(pinInput).toBeAttached({ timeout: 5_000 })
  // Click the surrounding PIN box area to ensure focus lands on the hidden input
  await pinInput.focus()
  await pinInput.fill(pin)
}

/**
 * Submits the login form by clicking the submit button.
 *
 * TODO data-testid: add data-testid="login-submit-btn" to the submit
 *   <button type="submit"> in LoginForm.tsx.
 */
async function submitLogin(page: Page): Promise<void> {
  const submitBtn = page.getByRole('button', { name: /^ingresar$/i })
  await expect(submitBtn).toBeVisible({ timeout: 5_000 })
  await submitBtn.click()
}

/**
 * Waits for the app to redirect to the authenticated dashboard after login.
 *
 * After a successful login the app unmounts the LoginForm and renders the
 * role-specific dashboard (ConstructorApp, VendedorApp/ProveedorApp,
 * TrabajadorApp, or RepartidorApp). We look for text that only appears
 * in an authenticated context.
 *
 * Strategy: wait for the login form heading to disappear (i.e., "Inicia
 * Sesion" h2 is gone), which confirms the screen transition happened.
 */
async function waitForDashboard(page: Page): Promise<void> {
  // The login form has h2 "Inicia Sesion". Once logged in it disappears.
  // We wait up to 15s for the Supabase auth round-trip.
  await expect(
    page.getByRole('heading', { name: /^inicia sesión$/i })
  ).not.toBeVisible({ timeout: 15_000 })
}

/**
 * Full login flow helper.
 *
 * @param page       - Playwright Page object
 * @param phone      - 8-digit local number without +591 prefix, e.g. "79999901"
 * @param pin        - 8-digit PIN string, e.g. "12345678"
 *
 * Usage:
 *   await page.goto('/')
 *   await loginAs(page, '79999901', '12345678')
 *   // page is now on the constructor dashboard
 */
export async function loginAs(page: Page, phone: string, pin: string): Promise<void> {
  await navigateToLogin(page)
  await fillPhone(page, phone)
  await fillPin(page, pin)
  await submitLogin(page)
  await waitForDashboard(page)
}
