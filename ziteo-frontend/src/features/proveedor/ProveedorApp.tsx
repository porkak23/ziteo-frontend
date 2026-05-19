/**
 * ProveedorApp — root host for the "proveedor" (supplier/vendor) role.
 *
 * The full implementation lives in features/vendedor/VendedorApp.tsx;
 * this file is the canonical entry-point that App.tsx imports when
 * currentUser.active_role === 'proveedor'.
 */
export { VendedorApp as ProveedorApp } from '../vendedor/VendedorApp'
