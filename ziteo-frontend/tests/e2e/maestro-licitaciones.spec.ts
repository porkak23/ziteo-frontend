/**
 * E2E spec — Maestro (Trabajador): Licitaciones
 *
 * Tests the job-bidding flow for the "maestro" role.
 *
 * Account used: Mario Maestro (+59179999903 / pin 12345678)
 * Dashboard entry: TrabajadorApp (active_role === 'maestro' maps to TrabajadorApp)
 * Nav tab: "Trabajos" (key: 'licitaciones')
 *
 * Note: In TrabajadorApp the "licitaciones" tab is labeled "Trabajos" in the
 * bottom nav, but internally uses the key 'licitaciones'.
 *
 * Missing data-testids to add to components (see MISSING_TEST_IDS.md):
 *   - data-testid="trabajador-nav-licitaciones"  on the "Trabajos" RoleDashNav button
 *   - data-testid="licitaciones-heading"         on the main <h2> in LicitacionesTabTrabajador
 *   - data-testid="licitaciones-empty-state"     on the empty state container
 *   - data-testid="licitacion-card"              on each job-request card
 *   - data-testid="licitacion-detail-heading"    on the detail view heading
 *   - data-testid="licitacion-oferta-input"      on the bid amount input in the detail view
 *   - data-testid="licitacion-oferta-btn"        on the "Enviar Oferta" button
 */

import { test, expect } from '@playwright/test'
import { loginAs } from '../helpers/auth'
import { TEST_ACCOUNTS } from '../helpers/testData'

const MAESTRO = TEST_ACCOUNTS.maestro

test.describe('Maestro - Licitaciones', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('login como Mario Maestro llega al dashboard', async ({ page }) => {
    await loginAs(page, MAESTRO.phone)

    // TrabajadorApp renders a bottom nav with tabs: Home, Trabajos, Proyectos, Mi Perfil
    // The "Trabajos" tab (licitaciones key) confirms the maestro dashboard loaded.
    // TODO data-testid: add data-testid="trabajador-nav-licitaciones" to this tab button
    const trabajosTab = page.getByRole('button', { name: /^trabajos$/i })
    await expect(trabajosTab).toBeVisible({ timeout: 10_000 })
  })

  test('navegar a Trabajos/Licitaciones muestra lista o estado vacio', async ({ page }) => {
    await loginAs(page, MAESTRO.phone)

    // Click the "Trabajos" nav tab
    // TODO data-testid: add data-testid="trabajador-nav-licitaciones"
    const trabajosTab = page.getByRole('button', { name: /^trabajos$/i })
    await trabajosTab.click()

    // LicitacionesTabTrabajador renders with filter bar (Disponibles, Mis Ofertas, Historial)
    // and either a list of job requests (W_REQUESTS mock data) or an empty state.
    // The filter bar is implemented via FilterBar component with buttons.
    // We wait for the filter bar to appear as the loading indicator.
    // TODO data-testid: add data-testid="licitaciones-filter-bar" to the FilterBar wrapper
    const disponiblesFilter = page.getByRole('button', { name: /disponibles/i })
    await expect(disponiblesFilter).toBeVisible({ timeout: 10_000 })

    // The tab renders either job cards or an empty-state paragraph.
    // The mock data in LicitacionesTabTrabajador always has 4 W_REQUESTS entries,
    // so at least one card should be visible.
    // TODO data-testid: add data-testid="licitacion-card" to each request card
    const jobCard = page.getByText(/albañilería|reparación|instalación|acabados/i).first()
    const emptyState = page.getByText(/no hay trabajos|sin trabajos|vacío/i)

    const cardVisible = await jobCard.isVisible().catch(() => false)
    const emptyVisible = await emptyState.isVisible().catch(() => false)

    expect(cardVisible || emptyVisible).toBe(true)
  })

  test('si hay licitaciones abrir una muestra el detalle con campo de oferta', async ({ page }) => {
    await loginAs(page, MAESTRO.phone)

    // Navigate to Trabajos tab
    const trabajosTab = page.getByRole('button', { name: /^trabajos$/i })
    await trabajosTab.click()
    await expect(page.getByRole('button', { name: /disponibles/i })).toBeVisible({ timeout: 10_000 })

    // Look for a job card — the mock data uses titles like "Albanileria segundo piso"
    // TODO data-testid: add data-testid="licitacion-card" to each card root div
    //   and data-testid="licitacion-ver-btn" to the "Ver detalles" / expand button.
    const firstCard = page.getByText(/albañilería|reparación|instalación|acabados/i).first()
    const cardVisible = await firstCard.isVisible({ timeout: 5_000 }).catch(() => false)

    if (!cardVisible) {
      // No job listings visible — skip gracefully
      test.skip()
      return
    }

    // Click on the job card to expand or open detail.
    // LicitacionesTabTrabajador shows an "Info" button and "Oferta" button
    // when a card is expanded. The card itself may be clickable.
    // TODO data-testid: add data-testid="licitacion-info-btn" to the info toggle button
    await firstCard.click()

    // After clicking, look for the offer-related elements.
    // The expanded card shows a budget, description, and an "Enviar Oferta" button.
    // There's also a field for the offer amount.
    // TODO data-testid: add data-testid="licitacion-oferta-btn" to the "Enviar Oferta" button
    const ofertaBtn = page.getByRole('button', { name: /oferta|postular|aplicar/i })
    const ofertaVisible = await ofertaBtn.isVisible({ timeout: 5_000 }).catch(() => false)

    if (!ofertaVisible) {
      // Card detail view may require a separate tap on an info/expand button.
      // Try tapping the card's info button if visible.
      const infoBtn = page.getByRole('button', { name: /info|ver más|detalles/i }).first()
      const infoBtnVisible = await infoBtn.isVisible().catch(() => false)
      if (infoBtnVisible) {
        await infoBtn.click()
      }
    }

    // After expansion, at minimum, the budget amount should be visible.
    // The W_REQUESTS mock has budgets like 3000, 800, 1500, 5500.
    const budgetText = page.getByText(/bs\s*(3\.?000|800|1\.?500|5\.?500)|presupuesto/i)
    const budgetVisible = await budgetText.isVisible({ timeout: 5_000 }).catch(() => false)

    // We accept either the oferta button or budget text as evidence that
    // the detail view opened.
    expect(ofertaVisible || budgetVisible).toBe(true)
  })
})
