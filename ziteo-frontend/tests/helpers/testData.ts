/**
 * Test data constants for Ziteo E2E tests.
 * Accounts are seeded in the remote Supabase project.
 */

export const TEST_ACCOUNTS = {
  constructor: {
    phone: '79999901',
    pin: '12345678',
    role: 'constructor' as const,
    label: 'Carlos Constructor',
  },
  proveedor: {
    phone: '79999902',
    pin: '12345678',
    role: 'proveedor' as const,
    label: 'Pedro Proveedor',
  },
  maestro: {
    phone: '79999903',
    pin: '12345678',
    role: 'maestro' as const,
    label: 'Mario Maestro',
  },
  chofer: {
    phone: '79999904',
    pin: '12345678',
    role: 'chofer' as const,
    label: 'Tomas Transportista',
  },
} as const

export type TestRole = keyof typeof TEST_ACCOUNTS

/**
 * Sample product data used when creating inventory items in tests.
 * Values are deterministic and use a timestamp-based suffix to avoid
 * collisions across parallel runs.
 */
export function makeTestProduct(suffix = Date.now().toString().slice(-6)) {
  return {
    name: `Cemento IP-30 E2E ${suffix}`,
    price: '58',
    stock: '100',
  }
}

/**
 * Expected dashboard "landmark" text for each role, used to confirm
 * that the login redirect landed on the correct screen.
 */
export const ROLE_DASHBOARD_MARKERS = {
  constructor: /tienda|home|constructor/i,
  proveedor: /inventario|inicio|proveedor/i,
  maestro: /trabajos|licitaciones|maestro/i,
  chofer: /radar|activar/i,
} as const
