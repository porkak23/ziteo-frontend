/**
 * Smoke test — Auth: All 4 roles login successfully
 *
 * This test runs against the production / staging deployment to verify
 * that all 4 test accounts can log in and reach their respective dashboards.
 *
 * Run with:
 *   npm run test:smoke -- --project=chromium
 *
 * Set PLAYWRIGHT_BASE_URL env var to point at the live deployment:
 *   PLAYWRIGHT_BASE_URL=https://ziteo.app npm run test:smoke
 *
 * Each test is independent and runs sequentially (workers: 1 in CI is
 * already set in playwright.config.ts).
 */

import { test, expect } from '@playwright/test'
import { loginAs } from '../helpers/auth'
import { TEST_ACCOUNTS } from '../helpers/testData'

/**
 * For each role we verify:
 *   1. Login completes without errors
 *   2. The app redirects to the role-specific dashboard
 *   3. A tab or heading from that dashboard is visible
 */

test.describe('Smoke — Login all 4 roles', () => {
  test('constructor login redirige a dashboard de constructor', async ({ page }) => {
    await page.goto('/')
    await loginAs(page, TEST_ACCOUNTS.constructor.phone)

    // ConstructorApp nav: Home | Tienda | Proyectos | Licitar
    // At least the "Tienda" tab must be visible
    await expect(
      page.getByRole('button', { name: /^tienda$/i })
    ).toBeVisible({ timeout: 15_000 })
  })

  test('proveedor login redirige a dashboard de proveedor', async ({ page }) => {
    await page.goto('/')
    await loginAs(page, TEST_ACCOUNTS.proveedor.phone)

    // VendedorApp nav: Inicio | Inventario | Pedidos | Cotizaciones
    // At least the "Inventario" tab must be visible
    await expect(
      page.getByRole('button', { name: /^inventario$/i })
    ).toBeVisible({ timeout: 15_000 })
  })

  test('maestro login redirige a dashboard de maestro', async ({ page }) => {
    await page.goto('/')
    await loginAs(page, TEST_ACCOUNTS.maestro.phone)

    // TrabajadorApp nav: Home | Trabajos | Proyectos | Mi Perfil
    // At least the "Trabajos" tab must be visible
    await expect(
      page.getByRole('button', { name: /^trabajos$/i })
    ).toBeVisible({ timeout: 15_000 })
  })

  test('chofer login redirige a dashboard de chofer', async ({ page }) => {
    await page.goto('/')
    await loginAs(page, TEST_ACCOUNTS.chofer.phone)

    // RepartidorApp: RadarScreen is the default tab
    // The "ACTIVAR RADAR" button confirms the chofer dashboard loaded
    await expect(
      page.getByRole('button', { name: /activar radar/i })
    ).toBeVisible({ timeout: 15_000 })
  })
})
