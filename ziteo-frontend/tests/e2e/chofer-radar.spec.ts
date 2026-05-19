/**
 * E2E spec — Chofer (Repartidor): Radar
 *
 * Tests the radar activation flow for the "chofer" role.
 *
 * Account used: Tomas Transportista (+59179999904 / pin 12345678)
 * Dashboard entry: RepartidorApp (active_role === 'chofer' maps to RepartidorApp)
 * Default tab: "Radar" (key: 'radar') — rendered as RadarScreen
 *
 * RadarScreen has three modes: 'offline' | 'online' | 'active'
 * On mount it starts in 'offline' mode, showing:
 *   - An info panel with "Estas fuera de linea" text
 *   - An "ACTIVAR RADAR" button (large orange CTA)
 *   - A toggle switch in the floating controls area (role="button", aria-label="Conectarse")
 *
 * After clicking ACTIVAR RADAR the mode changes to 'online', which shows:
 *   - The status indicator text "EN LINEA" (in the floating controls area)
 *   - The offline panel slides away
 *
 * Note: RadarScreen uses Leaflet maps. In Playwright's headless browser Leaflet
 * initializes correctly but map tiles may not load (network dependent).
 * We only assert on UI state, not map tile rendering.
 *
 * Missing data-testids to add to components (see MISSING_TEST_IDS.md):
 *   - data-testid="radar-activar-btn"      on the "ACTIVAR RADAR" button in RadarScreen.tsx
 *   - data-testid="radar-status-badge"     on the status span ("EN LINEA" / "OFFLINE")
 *   - data-testid="radar-toggle"           on the toggle div (role="button") in floatingControls
 *   - data-testid="radar-offline-panel"    on the offline info panel div
 *   - data-testid="repartidor-nav-radar"   on the "Radar" RoleDashNav tab button
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

    // RepartidorApp renders a bottom nav with tabs: Radar, Pedidos, Ganancias, Perfil
    // The "Radar" tab is the default and should be active on login.
    // TODO data-testid: add data-testid="repartidor-nav-radar" to the Radar nav tab button
    const radarTab = page.getByRole('button', { name: /^radar$/i })
    await expect(radarTab).toBeVisible({ timeout: 10_000 })
  })

  test('boton ACTIVAR RADAR es visible en estado offline', async ({ page }) => {
    await loginAs(page, CHOFER.phone, CHOFER.pin)

    // RadarScreen starts in 'offline' mode.
    // The offline info panel is visible and contains the "ACTIVAR RADAR" button.
    // TODO data-testid: add data-testid="radar-activar-btn" to the ACTIVAR RADAR button
    const activarBtn = page.getByRole('button', { name: /activar radar/i })
    await expect(activarBtn).toBeVisible({ timeout: 10_000 })

    // The offline status text should also be visible in the floating controls area.
    // The span shows "OFFLINE" when mode === 'offline'.
    // TODO data-testid: add data-testid="radar-status-badge" to the status span
    const offlineStatus = page.getByText(/offline/i)
    await expect(offlineStatus).toBeVisible({ timeout: 5_000 })
  })

  test('click en ACTIVAR RADAR cambia estado a EN LINEA', async ({ page }) => {
    await loginAs(page, CHOFER.phone, CHOFER.pin)

    // Wait for the ACTIVAR RADAR button to be visible
    // TODO data-testid: add data-testid="radar-activar-btn"
    const activarBtn = page.getByRole('button', { name: /activar radar/i })
    await expect(activarBtn).toBeVisible({ timeout: 10_000 })

    // Click ACTIVAR RADAR — this transitions mode from 'offline' to 'online'
    await activarBtn.click()

    // After clicking:
    //   1. The floating status badge changes from "OFFLINE" to "EN LINEA"
    //   2. The offline info panel slides away (CSS transform translateY(110%))
    //   3. The online bottom sheet becomes visible
    //
    // We assert the "EN LINEA" text appears in the floating controls.
    // TODO data-testid: add data-testid="radar-status-badge" to verify state change
    const onlineStatus = page.getByText(/en línea|en linea/i)
    await expect(onlineStatus).toBeVisible({ timeout: 8_000 })

    // Additionally confirm the ACTIVAR RADAR button is no longer visible
    // (the offline panel has slid off-screen)
    // Note: the panel is kept in DOM with CSS transform, so we check visibility
    // rather than presence.
    await expect(activarBtn).not.toBeVisible({ timeout: 5_000 })
  })
})
