import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'
import { useAuthStore } from '../../auth/store/authStore'
import type { CargoCapability, VehicleType } from '../types/deliveryTypes'
import { vehicleToCargoCapability } from '../types/deliveryTypes'

interface DriverProfileData {
  vehicle_type: VehicleType | null
  cargo_capability: CargoCapability | null
}

export function useDriverProfile() {
  const user = useAuthStore((s) => s.user)
  const userId = user?.user_id ?? ''

  return useQuery<DriverProfileData>({
    queryKey: ['driver-profile', userId],
    enabled: !!userId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('vehicle_type')
        .eq('user_id', userId)
        .eq('role', 'chofer')
        .maybeSingle()
      if (error) throw error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vt = ((data as any)?.vehicle_type ?? null) as VehicleType | null
      return { vehicle_type: vt, cargo_capability: vehicleToCargoCapability(vt) }
    },
  })
}

export function useSaveVehicleType() {
  const user = useAuthStore((s) => s.user)
  const userId = user?.user_id ?? ''
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (vehicleType: VehicleType) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ vehicle_type: vehicleType })
        .eq('user_id', userId)
        .eq('role', 'chofer')
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-profile', userId] })
    },
  })
}
