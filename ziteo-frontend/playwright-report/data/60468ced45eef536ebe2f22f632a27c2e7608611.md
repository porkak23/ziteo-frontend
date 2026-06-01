# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\smoke\auth-smoke.spec.ts >> Smoke — Login all 4 roles >> chofer login redirige a dashboard de chofer
- Location: tests\smoke\auth-smoke.spec.ts:62:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /inicia sesión/i })
Expected: visible
Timeout: 8000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 8000ms
  - waiting for getByRole('button', { name: /inicia sesión/i })

```

```yaml
- text: Recomendado
- heading "Instala Ziteo en tu teléfono" [level=2]
- paragraph: Tendrás una experiencia más rápida y completa, pero también puedes seguir en el navegador si prefieres probar primero.
- text: Acceso desde tu pantalla de inicio Abre Ziteo con un toque, como cualquier app nativa. Funciona sin conexión Consulta tu información incluso sin internet en obra. Notificaciones de pedidos Entérate al instante cuando algo necesita tu atención.
- button "Instalar app"
- button "Continuar en el navegador"
```

# Test source

```ts
  1   | import type { Page } from '@playwright/test'
  2   | import { expect } from '@playwright/test'
  3   | 
  4   | /**
  5   |  * Navigates through the splash screen and welcome screen to reach the
  6   |  * login form.
  7   |  *
  8   |  * The app shows a SplashScreen (3 second progress bar) before revealing
  9   |  * the WelcomeScreen. We wait for the "Inicia Sesion" button which is
  10  |  * rendered on WelcomeScreen.
  11  |  *
  12  |  * TODO data-testid: add data-testid="welcome-login-btn" to the
  13  |  *   "Inicia Sesion" button in WelcomeScreen.tsx so this selector is
  14  |  *   resilient to label changes.
  15  |  */
  16  | async function navigateToLogin(page: Page): Promise<void> {
  17  |   // Wait for splash to finish and welcome screen to appear (up to 8s)
  18  |   const loginBtn = page.getByRole('button', { name: /inicia sesión/i })
> 19  |   await expect(loginBtn).toBeVisible({ timeout: 8_000 })
      |                          ^ Error: expect(locator).toBeVisible() failed
  20  |   await loginBtn.click()
  21  | }
  22  | 
  23  | /**
  24  |  * Fills in the phone number input on the login form.
  25  |  *
  26  |  * The phone field is a <input type="tel"> that accepts only the local
  27  |  * 8-digit part (without +591 prefix). The prefix is rendered as a static
  28  |  * span.
  29  |  *
  30  |  * TODO data-testid: add data-testid="login-phone-input" to the phone
  31  |  *   <input> in LoginForm.tsx so this selector is resilient.
  32  |  */
  33  | async function fillPhone(page: Page, phone: string): Promise<void> {
  34  |   // The login form has a tel input right after the "+591" prefix span.
  35  |   // We target it by its placeholder which is stable.
  36  |   const phoneInput = page.locator('input[type="tel"][placeholder="7XX XXX XX"]')
  37  |   await expect(phoneInput).toBeVisible({ timeout: 5_000 })
  38  |   await phoneInput.fill(phone)
  39  | }
  40  | 
  41  | /**
  42  |  * Fills in the PIN by clicking on the PIN box area (which focuses the
  43  |  * hidden input) and typing the digits.
  44  |  *
  45  |  * The PIN UI renders 8 visual boxes backed by a single hidden
  46  |  * <input type="tel"> with opacity:0. We click the first box to focus
  47  |  * the hidden input, then type the digits.
  48  |  *
  49  |  * TODO data-testid: add data-testid="login-pin-hidden-input" to the
  50  |  *   hidden PIN <input> in LoginForm.tsx so we can target it directly
  51  |  *   without relying on opacity:0 positioning tricks.
  52  |  */
  53  | async function fillPin(page: Page, pin: string): Promise<void> {
  54  |   // The hidden PIN input is the second input[type="tel"] on the page
  55  |   // (first is the phone field). It has maxLength=8.
  56  |   const pinInput = page.locator('input[type="tel"][maxlength="8"]')
  57  |   await expect(pinInput).toBeAttached({ timeout: 5_000 })
  58  |   // Click the surrounding PIN box area to ensure focus lands on the hidden input
  59  |   await pinInput.focus()
  60  |   await pinInput.fill(pin)
  61  | }
  62  | 
  63  | /**
  64  |  * Submits the login form by clicking the submit button.
  65  |  *
  66  |  * TODO data-testid: add data-testid="login-submit-btn" to the submit
  67  |  *   <button type="submit"> in LoginForm.tsx.
  68  |  */
  69  | async function submitLogin(page: Page): Promise<void> {
  70  |   const submitBtn = page.getByRole('button', { name: /^ingresar$/i })
  71  |   await expect(submitBtn).toBeVisible({ timeout: 5_000 })
  72  |   await submitBtn.click()
  73  | }
  74  | 
  75  | /**
  76  |  * Waits for the app to redirect to the authenticated dashboard after login.
  77  |  *
  78  |  * After a successful login the app unmounts the LoginForm and renders the
  79  |  * role-specific dashboard (ConstructorApp, VendedorApp/ProveedorApp,
  80  |  * TrabajadorApp, or RepartidorApp). We look for text that only appears
  81  |  * in an authenticated context.
  82  |  *
  83  |  * Strategy: wait for the login form heading to disappear (i.e., "Inicia
  84  |  * Sesion" h2 is gone), which confirms the screen transition happened.
  85  |  */
  86  | async function waitForDashboard(page: Page): Promise<void> {
  87  |   // The login form has h2 "Inicia Sesion". Once logged in it disappears.
  88  |   // We wait up to 15s for the Supabase auth round-trip.
  89  |   await expect(
  90  |     page.getByRole('heading', { name: /^inicia sesión$/i })
  91  |   ).not.toBeVisible({ timeout: 15_000 })
  92  | }
  93  | 
  94  | /**
  95  |  * Full login flow helper.
  96  |  *
  97  |  * @param page       - Playwright Page object
  98  |  * @param phone      - 8-digit local number without +591 prefix, e.g. "79999901"
  99  |  * @param pin        - 8-digit PIN string, e.g. "12345678"
  100 |  *
  101 |  * Usage:
  102 |  *   await page.goto('/')
  103 |  *   await loginAs(page, '79999901', '12345678')
  104 |  *   // page is now on the constructor dashboard
  105 |  */
  106 | export async function loginAs(page: Page, phone: string, pin: string): Promise<void> {
  107 |   await navigateToLogin(page)
  108 |   await fillPhone(page, phone)
  109 |   await fillPin(page, pin)
  110 |   await submitLogin(page)
  111 |   await waitForDashboard(page)
  112 | }
  113 | 
```