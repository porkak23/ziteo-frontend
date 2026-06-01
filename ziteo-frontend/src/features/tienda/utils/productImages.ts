/**
 * Helper utility to map product names to their high-quality generated images
 * to avoid blank placeholders when database image_url is null.
 */

const PRODUCT_IMAGE_MAP: Array<{ keywords: string[]; path: string }> = [
  { keywords: ['acero', 'fierro', 'varilla'], path: '/images/products/acero_construccion.png' },
  { keywords: ['cemento', 'portland'], path: '/images/products/cemento_portland.png' },
  { keywords: ['arena', 'fina'], path: '/images/products/arena_fina.png' },
  { keywords: ['ladrillo'], path: '/images/products/ladrillo_ceramico.png' },
  { keywords: ['cable', 'unipolar'], path: '/images/products/cable_unipolar.png' },
  { keywords: ['tubo', 'fluorescente', 'plafon', 'led'], path: '/images/products/tubo_fluorescente.png' },
  { keywords: ['caño', 'pvc', 'cano'], path: '/images/products/cano_pvc.png' },
  { keywords: ['llave', 'paso', 'termofusion'], path: '/images/products/llave_de_paso.png' },
  { keywords: ['taladro', 'percutor'], path: '/images/products/taladro_percutor.png' },
  { keywords: ['amoladora'], path: '/images/products/amoladora_angular.png' },
  { keywords: ['disco', 'corte'], path: '/images/products/disco_de_corte.png' },
  { keywords: ['nivel', 'laser', 'láser'], path: '/images/products/nivel_laser.png' },
  { keywords: ['martillo', 'demoledor'], path: '/images/products/martillo_demoledor.png' },
  { keywords: ['andamio'], path: '/images/products/andamio_tubular.png' },
  { keywords: ['casco', 'seguridad'], path: '/images/products/casco_seguridad.png' },
  { keywords: ['guante', 'trabajo'], path: '/images/products/guantes_trabajo.png' }
]

/**
 * Returns the path to the high-quality local image for standard products if the
 * database image is null/empty or a placeholder.
 *
 * @param name The name of the product
 * @param dbUrl The image_url returned from the database
 */
export function getProductImageUrl(name: string, dbUrl?: string | null): string {
  // If the database has a valid, non-placeholder URL, use it
  if (dbUrl && dbUrl.trim() !== '' && !dbUrl.includes('https://...')) {
    return dbUrl
  }

  const normalizedName = name.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents

  // Check keyword matches
  for (const item of PRODUCT_IMAGE_MAP) {
    const matchesAllKeywords = item.keywords.every(kw => {
      const normalizedKw = kw.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
      return normalizedName.includes(normalizedKw)
    })

    if (matchesAllKeywords) {
      return item.path
    }
  }

  // If no specific match, try a partial match on any keyword
  for (const item of PRODUCT_IMAGE_MAP) {
    const matchesAnyKeyword = item.keywords.some(kw => {
      const normalizedKw = kw.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
      return normalizedName.includes(normalizedKw)
    })

    if (matchesAnyKeyword) {
      return item.path
    }
  }

  // Return empty string or undefined if no match, letting the components fallback to default icon/UI
  return dbUrl || ''
}
