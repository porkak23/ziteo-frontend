import type { TiendaFilters } from '../../features/tienda/types/tiendaTypes'

export const queryKeys = {
  // Tienda
  categories: () => ['categories'] as const,
  products: (filters: TiendaFilters, offset: number) =>
    ['products',
      filters.listing_type ?? null,
      filters.city ?? null,
      filters.category_id ?? null,
      filters.construction_stage ?? null,
      filters.search ?? null,
      filters.provider_id ?? null,
      offset,
    ] as const,
  product: (id: string) => ['product', id] as const,

  // Licitaciones
  licitacionesAbiertas: (filters?: { city?: string; specialty?: string }) =>
    ['licitaciones-abiertas', filters?.city ?? null, filters?.specialty ?? null] as const,
  misLicitaciones: (userId?: string) => ['mis-licitaciones', userId ?? null] as const,
  postulantesDeLicitacion: (licitacionId: string) => ['postulantes-licitacion', licitacionId] as const,

  // Proveedor / Pedidos
  incomingOrders: (providerId: string) => ['incoming-orders', providerId] as const,
  orderDetail: (orderId: string) => ['order', orderId] as const,

  // Maestros / Trabajadores
  maestros: (filters?: Record<string, unknown>) => ['maestros', filters ?? null] as const,
  maestroPerfil: (userId: string) => ['maestro-perfil', userId] as const,

  // Proyectos
  proyectos: (constructorId: string) => ['proyectos', constructorId] as const,
  proyecto: (id: string) => ['proyecto', id] as const,
} as const
