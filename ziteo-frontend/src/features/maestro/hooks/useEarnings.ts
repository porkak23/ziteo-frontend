import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'

export interface EarningMonth {
  month: string
  amount: number
}

export interface EarningsData {
  totalEarned: number
  completedCount: number
  avgBudget: number
  chartData: EarningMonth[]
}

export function useEarnings(maestroId: string) {
  return useQuery<EarningsData>({
    queryKey: ['earnings', maestroId],
    enabled: !!maestroId,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('contracts')
          .select('budget, created_at')
          .eq('maestro_id', maestroId)
          .eq('status', 'completed')

        if (error) throw error

        const contracts = data || []
        
        const totalEarned = contracts.reduce((sum, c) => sum + (c.budget || 0), 0)
        const completedCount = contracts.length
        const avgBudget = completedCount > 0 ? totalEarned / completedCount : 0

        // Calcular datos del gráfico de los últimos 6 meses
        const chartData: EarningMonth[] = []
        const now = new Date()
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const mName = monthNames[d.getMonth()]
          
          // Sumar el budget para el mes y año en curso del ciclo
          const amount = contracts.filter(c => {
            const cd = new Date(c.created_at)
            return cd.getMonth() === d.getMonth() && cd.getFullYear() === d.getFullYear()
          }).reduce((sum, c) => sum + (c.budget || 0), 0)
          
          chartData.push({ month: mName, amount })
        }

        return {
          totalEarned,
          completedCount,
          avgBudget,
          chartData
        }
      } catch (err) {
        // Retornar fallback si la tabla no existe u otro error
        return {
          totalEarned: 0,
          completedCount: 0,
          avgBudget: 0,
          chartData: []
        }
      }
    }
  })
}
