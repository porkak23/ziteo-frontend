import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'
import { useAuthStore } from '../../auth/store/authStore'
import type { UserRole } from '../../auth/store/authStore'

interface ConstructorStats {
  activeProjects: number
  pendingContracts: number
  totalInvested: number
}

interface MaestroStats {
  activeContracts: number
  pendingOffers: number
  totalEarned: number
}

interface ProveedorStats {
  activeProducts: number
  pendingOrders: number
  totalSales: number
}

type DashboardStats = ConstructorStats | MaestroStats | ProveedorStats

const safeCount = (data: unknown[] | null) => (Array.isArray(data) ? data.length : 0)
const safeSum = (data: { budget?: number; total?: number }[] | null, key: 'budget' | 'total') =>
  Array.isArray(data) ? data.reduce((acc, row) => acc + (row[key] ?? 0), 0) : 0

async function fetchConstructorStats(userId: string): Promise<ConstructorStats> {
  const [projectsRes, pendingRes, investedRes] = await Promise.all([
    supabase
      .from('projects')
      .select('id')
      .eq('constructor_id', userId)
      .eq('status', 'active'),
    supabase
      .from('contracts')
      .select('id')
      .eq('constructor_id', userId)
      .eq('status', 'pending'),
    supabase
      .from('contracts')
      .select('budget')
      .eq('constructor_id', userId)
      .in('status', ['active', 'completed']),
  ])

  return {
    activeProjects: safeCount(projectsRes.data),
    pendingContracts: safeCount(pendingRes.data),
    totalInvested: safeSum(investedRes.data as { budget?: number }[], 'budget'),
  }
}

async function fetchMaestroStats(userId: string): Promise<MaestroStats> {
  const [activeRes, pendingRes, earnedRes] = await Promise.all([
    supabase
      .from('contracts')
      .select('id')
      .eq('maestro_id', userId)
      .eq('status', 'active'),
    supabase
      .from('contracts')
      .select('id')
      .eq('maestro_id', userId)
      .eq('status', 'pending'),
    supabase
      .from('contracts')
      .select('budget')
      .eq('maestro_id', userId)
      .eq('status', 'completed'),
  ])

  return {
    activeContracts: safeCount(activeRes.data),
    pendingOffers: safeCount(pendingRes.data),
    totalEarned: safeSum(earnedRes.data as { budget?: number }[], 'budget'),
  }
}

async function fetchProveedorStats(userId: string): Promise<ProveedorStats> {
  const [productsRes, ordersRes, salesRes] = await Promise.all([
    supabase
      .from('products')
      .select('id')
      .eq('provider_id', userId)
      .eq('active', true),
    supabase
      .from('orders')
      .select('id')
      .eq('provider_id', userId)
      .eq('status', 'pending'),
    supabase
      .from('orders')
      .select('total')
      .eq('provider_id', userId)
      .eq('status', 'delivered'),
  ])

  return {
    activeProducts: safeCount(productsRes.data),
    pendingOrders: safeCount(ordersRes.data),
    totalSales: safeSum(salesRes.data as { total?: number }[], 'total'),
  }
}

const DEFAULT_CONSTRUCTOR: ConstructorStats = { activeProjects: 0, pendingContracts: 0, totalInvested: 0 }
const DEFAULT_MAESTRO: MaestroStats = { activeContracts: 0, pendingOffers: 0, totalEarned: 0 }
const DEFAULT_PROVEEDOR: ProveedorStats = { activeProducts: 0, pendingOrders: 0, totalSales: 0 }

export function useDashboardStats() {
  const user = useAuthStore((s) => s.user)
  const userId = user?.user_id ?? ''
  const role: UserRole = user?.active_role ?? 'constructor'

  return useQuery<DashboardStats>({
    queryKey: ['dashboardStats', userId, role],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      try {
        if (role === 'constructor') return await fetchConstructorStats(userId)
        if (role === 'maestro') return await fetchMaestroStats(userId)
        if (role === 'proveedor') return await fetchProveedorStats(userId)
        return DEFAULT_CONSTRUCTOR
      } catch {
        // Fail silently — return zeros
        if (role === 'maestro') return DEFAULT_MAESTRO
        if (role === 'proveedor') return DEFAULT_PROVEEDOR
        return DEFAULT_CONSTRUCTOR
      }
    },
  })
}
