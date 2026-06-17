/**
 * E2E spec — Chofer (Transportista): Radar
 *
 * Tests the radar activation flow for the "chofer" role.
 *
 * Account used: Tomas Transportista (+59179999904)
 * Dashboard entry: ChofersApp (active_role === 'chofer')
 * Default tab: "Radar" — rendered as TransportistaScreen
 *
 * TransportistaScreen has two states driven by `isOnline`:
 *   - Offline: a "radar-offline-panel" with the "Offline" status badge and a
 *     large "CONECTARME" CTA ("radar-activar-btn").
 *   - Online: the dark hero shows the "Conectado" status ("radar-status-badge")
 *     and the offline panel is unmounted.
 *
 * Note: TransportistaScreen uses map tiles that may not load in headless
 * Playwright. We only assert on UI state, not map tile rendering.
 *
 * Stable selectors use the data-testid attributes added to TransportistaScreen:
 *   - radar-offline-panel  · offline root container
 *   - radar-status-badge   · "Offline" badge (offline) / "Conectado" (online)
 *   - radar-activar-btn    · "CONECTARME" activation button
 *   - repartidor-nav-radar · "Radar" RoleDashNav tab button
 */

import { test, expect } from '@playwright/test'
import { loginAs } from '../helpers/auth'
import { TEST_ACCOUNTS } from '../helpers/testData'

const CHOFER = TEST_ACCOUNTS.chofer

test.describe('Chofer - Radar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('login como Tomas Transportista llega al dashboard del chofer', async ({ page }) => {
    await loginAs(page, CHOFER.phone, CHOFER.pin)

    // ChofersApp renders a bottom nav whose Radar tab is the default.
    const radarTab = page.getByTestId('repartidor-nav-radar')
    await expect(radarTab).toBeVisible({ timeout: 10_000 })
  })

  test('estado offline muestra el panel y el boton CONECTARME', async ({ page }) => {
    await loginAs(page, CHOFER.phone, CHOFER.pin)

    // TransportistaScreen starts offline.
    await expect(page.getByTestId('radar-offline-panel')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByTestId('radar-activar-btn')).toBeVisible({ timeout: 10_000 })

    // The "Offline" status badge is visible in the offline state.
    await expect(page.getByTestId('radar-status-badge')).toBeVisible({ timeout: 5_000 })
  })

  test('click en CONECTARME cambia el estado a Conectado', async ({ page }) => {
    await loginAs(page, CHOFER.phone, CHOFER.pin)

    const activarBtn = page.getByTestId('radar-activar-btn')
    await expect(activarBtn).toBeVisible({ timeout: 10_000 })

    // Activate — transitions from offline to online.
    await activarBtn.click()

    // Online: the status badge now reads "Conectado" and the offline panel
    // is unmounted (so the CONECTARME button is gone).
    await expect(page.getByTestId('radar-status-badge')).toHaveText(/conectado/i, { timeout: 8_000 })
    await expect(page.getByTestId('radar-offline-panel')).toBeHidden({ timeout: 5_000 })
  })
})
