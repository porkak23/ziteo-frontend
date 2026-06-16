/**
 * E2E spec — Proveedor: Inventario
 *
 * Tests the core inventory management flow for the "proveedor" (supplier) role.
 *
 * Account used: Pedro Proveedor (+59179999902 / pin 12345678)
 * Dashboard entry: VendedorApp (rendered by ProveedorApp re-export)
 * Nav tab: "Inventario" (key: 'inventario')
 *
 * Missing data-testids to add to components (see MISSING_TEST_IDS.md):
 *   - data-testid="vendedor-nav-inventario"  on the "Inventario" RoleDashNav tab button
 *   - data-testid="inventario-heading"       on the <h2>Inventario</h2> in VendedorApp
 *   - data-testid="inventario-agregar-btn"   on the "Agregar" button in InventarioTab
 *   - data-testid="inventario-empty-state"   on the empty state container div
 *   - data-testid="inventario-product-list"  on the product list container div
 *   - data-testid="form-nombre-input"        on the ZInput for "Nombre" in the add-product form
 *   - data-testid="form-precio-input"        on the ZInput for "Precio (Bs.)"
 *   - data-testid="form-stock-input"         on the ZInput for "Stock"
 *   - data-testid="form-categoria-select"    on the category <select>
 *   - data-testid="form-guardar-btn"         on the "Guardar producto" ZButton
 *   - data-testid="toast-success"            on the Toast success notification
 */

import { test, expect } from '@playwright/test'
import { loginAs } from '../helpers/auth'
import { TEST_ACCOUNTS, makeTestProduct } from '../helpers/testData'

const PROVEEDOR = TEST_ACCOUNTS.proveedor

test.describe('Proveedor - Inventario', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('login como Pedro Proveedor llega al dashboard de proveedor', async ({ page }) => {
    await loginAs(page, PROVEEDOR.phone)

    // The VendedorApp renders a nav tab labeled "Inventario" and "Inicio"
    // and shows a greeting in the HomeTab. We verify at least one of these.
    // TODO data-testid: add data-testid="vendedor-home-greeting" to the h2 greeting
    //   in HomeTab inside VendedorApp so we can assert by testid.
    const inventarioTab = page.getByRole('button', { name: /inventario/i })
    await expect(inventarioTab).toBeVisible({ timeout: 10_000 })
  })

  test('navegar a Inventario muestra la lista o estado vacio', async ({ page }) => {
    await loginAs(page, PROVEEDOR.phone)

    // Click the Inventario nav tab
    // TODO data-testid: add data-testid="vendedor-nav-inventario" to the tab button
    const inventarioTab = page.getByRole('button', { name: /^inventario$/i })
    await inventarioTab.click()

    // The InventarioTab renders either:
    //   (a) a loading skeleton (divs with animation pulse)
    //   (b) an empty state with text "Tu inventario esta vacio"
    //   (c) a list of product cards
    // We wait for the section heading to appear.
    const heading = page.getByRole('heading', { name: /^inventario$/i })
    await expect(heading).toBeVisible({ timeout: 10_000 })

    // Verify one of the expected states is visible
    const emptyState = page.getByText(/tu inventario está vacío/i)
    const agregar = page.getByRole('button', { name: /agregar/i }).first()

    // Either the empty state or the "Agregar" button must be visible
    const emptyVisible = await emptyState.isVisible().catch(() => false)
    const agregarVisible = await agregar.isVisible().catch(() => false)

    expect(emptyVisible || agregarVisible).toBe(true)
  })

  test('abrir formulario de nuevo producto, llenar campos y guardar', async ({ page }) => {
    await loginAs(page, PROVEEDOR.phone)

    // Navigate to Inventario tab
    const inventarioTab = page.getByRole('button', { name: /^inventario$/i })
    await inventarioTab.click()
    await expect(page.getByRole('heading', { name: /^inventario$/i })).toBeVisible({ timeout: 10_000 })

    // Click the "Agregar" button to open the add-product form
    // TODO data-testid: add data-testid="inventario-agregar-btn" to this button
    const agregarBtn = page.getByRole('button', { name: /^agregar$/i })
    await expect(agregarBtn).toBeVisible({ timeout: 5_000 })
    await agregarBtn.click()

    // The form is a full-screen overlay with ZHeader title "Agregar producto"
    // TODO data-testid: add data-testid="form-agregar-producto" on the form overlay div
    await expect(page.getByText(/agregar producto/i)).toBeVisible({ timeout: 5_000 })

    const product = makeTestProduct()

    // Fill "Nombre" — ZInput renders a label + input; we locate by placeholder
    // TODO data-testid: add data-testid="form-nombre-input" to the input in ZInput for "Nombre"
    const nombreInput = page.getByPlaceholder(/cemento ip-30/i)
    await expect(nombreInput).toBeVisible({ timeout: 5_000 })
    await nombreInput.fill(product.name)

    // Fill "Precio (Bs.)"
    // TODO data-testid: add data-testid="form-precio-input"
    const precioInput = page.getByPlaceholder(/^58$/)
    await expect(precioInput).toBeVisible({ timeout: 5_000 })
    await precioInput.fill(product.price)

    // Fill "Stock"
    // TODO data-testid: add data-testid="form-stock-input"
    const stockInput = page.getByPlaceholder(/^100$/)
    await expect(stockInput).toBeVisible({ timeout: 5_000 })
    await stockInput.fill(product.stock)

    // Select a category — the <select> starts with "Selecciona una categoria"
    // TODO data-testid: add data-testid="form-categoria-select"
    const categoriaSelect = page.locator('select').filter({ has: page.getByRole('option', { name: /selecciona una categoría/i }) })
    await expect(categoriaSelect).toBeVisible({ timeout: 8_000 })

    // Wait for categories to load (they are fetched from Supabase)
    // then pick the first non-placeholder option
    await page.waitForFunction(
      (sel) => {
        const el = document.querySelector(sel) as HTMLSelectElement | null
        return el !== null && el.options.length > 1
      },
      'select',
      { timeout: 10_000 }
    )
    // Select the first real option (index 1 is the first category)
    await categoriaSelect.selectOption({ index: 1 })

    // Click "Guardar producto"
    // TODO data-testid: add data-testid="form-guardar-btn"
    const guardarBtn = page.getByRole('button', { name: /guardar producto/i })
    await expect(guardarBtn).toBeEnabled({ timeout: 5_000 })
    await guardarBtn.click()

    // After saving, a success toast "Producto guardado" should appear
    // and the form overlay should close (heading "Inventario" becomes visible again)
    // TODO data-testid: add data-testid="toast-success" on the Toast component
    await expect(page.getByText(/producto guardado/i)).toBeVisible({ timeout: 10_000 })

    // The inventory list should now show the new product name
    await expect(page.getByText(product.name)).toBeVisible({ timeout: 10_000 })
  })
})
