import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'
import { useAuthStore } from '../../auth/store/authStore'
import { useToast } from '../../../shared/hooks/useToast'
import { Toast } from '../../../shared/components/Toast'

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuotationItem {
  product_id: string
  name: string
  quantity: number
  price_unit: number
}

interface Quotation {
  id: string
  buyer_id: string
  provider_id: string
  items: QuotationItem[]
  subtotal: number
  status: 'pending' | 'accepted' | 'expired' | 'converted'
  pdf_url: string | null
  expires_at: string | null
  created_at: string
  buyer?: {
    name: string | null
    phone: string | null
  } | null
}

// ─── Status badge config ───────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  Quotation['status'],
  { label: string; bg: string; text: string }
> = {
  pending: {
    label: 'Pendiente',
    bg: 'bg-amber-100 dark:bg-amber-900/40',
    text: 'text-amber-800 dark:text-amber-200',
  },
  accepted: {
    label: 'Aceptada',
    bg: 'bg-green-100 dark:bg-green-900/40',
    text: 'text-green-800 dark:text-green-200',
  },
  expired: {
    label: 'Expirada',
    bg: 'bg-surface-container',
    text: 'text-on-surface-variant',
  },
  converted: {
    label: 'Convertida',
    bg: 'bg-blue-100 dark:bg-blue-900/40',
    text: 'text-blue-800 dark:text-blue-200',
  },
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

function useProveedorQuotations(providerId: string) {
  return useQuery<Quotation[]>({
    queryKey: ['proveedor-quotations', providerId],
    enabled: !!providerId,
    staleTime: 30_000,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('quotations')
        .select('*, buyer:profiles!buyer_id(name, phone)')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false })
      if (error) {
        if (error.code === '42P01') return []
        throw error
      }
      return (data ?? []) as Quotation[]
    },
  })
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CotizacionesScreen() {
  const user = useAuthStore((s) => s.user)
  const providerId = user?.user_id ?? ''
  const { toasts, showToast, removeToast } = useToast()
  const queryClient = useQueryClient()

  const { data: quotations = [], isLoading } = useProveedorQuotations(providerId)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { mutate: acceptQuotation, isPending: accepting } = useMutation({
    mutationFn: async (quotationId: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('quotations')
        .update({ status: 'accepted' })
        .eq('id', quotationId)
        .eq('provider_id', providerId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proveedor-quotations', providerId] })
      showToast('Cotización aceptada', 'success')
    },
    onError: () => {
      showToast('Error al aceptar la cotización', 'error')
    },
  })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-surface-container animate-pulse rounded-2xl h-36" />
        ))}
      </div>
    )
  }

  return (
    <>
      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="flex flex-col gap-4 py-3 pb-24">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4">
          <h2 className="font-headline font-semibold text-lg text-on-surface">
            Cotizaciones
          </h2>
          {quotations.filter((q) => q.status === 'pending').length > 0 && (
            <span className="bg-primary text-on-primary text-xs font-label px-2 py-1 rounded-full">
              {quotations.filter((q) => q.status === 'pending').length} pendientes
            </span>
          )}
        </div>

        <div className="flex flex-col gap-3 px-4">
          {quotations.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 px-8">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant/20">request_quote</span>
              <p className="font-headline font-bold text-[18px] text-on-surface/70 text-center">
                Sin cotizaciones aún
              </p>
              <p className="font-body text-sm text-on-surface-variant/50 text-center">
                Cuando un comprador genere una cotización de tu tienda, aparecerá aquí
              </p>
            </div>
          ) : (
            quotations.map((quotation) => {
              const cfg = STATUS_CONFIG[quotation.status] ?? STATUS_CONFIG.pending
              const isExpanded = expandedId === quotation.id
              const dateLabel = new Date(quotation.created_at).toLocaleDateString('es-BO', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const buyerName = Array.isArray(quotation.buyer) ? (quotation.buyer[0] as any)?.name ?? 'Comprador' : quotation.buyer?.name ?? 'Comprador'
              const items: QuotationItem[] = Array.isArray(quotation.items) ? quotation.items : []

              return (
                <div
                  key={quotation.id}
                  className="bg-surface rounded-2xl border border-outline-variant flex flex-col overflow-hidden"
                >
                  {/* Card header */}
                  <div className="p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="font-body text-xs text-on-surface-variant">{dateLabel}</span>
                      <span className={`px-2.5 py-1 rounded-full font-label text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                        {cfg.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-on-surface-variant text-base leading-none"
                          style={{ fontVariationSettings: "'FILL' 1" }}>
                          person
                        </span>
                      </div>
                      <div>
                        <p className="font-label font-semibold text-on-surface text-sm">{buyerName}</p>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(Array.isArray(quotation.buyer) ? (quotation.buyer[0] as any)?.phone : quotation.buyer?.phone) && (
                          <p className="font-body text-xs text-on-surface-variant">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {Array.isArray(quotation.buyer) ? (quotation.buyer[0] as any)?.phone : quotation.buyer?.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-outline-variant pt-3">
                      <div>
                        <span className="font-body text-xs text-on-surface-variant">
                          {items.length} {items.length === 1 ? 'producto' : 'productos'}
                        </span>
                      </div>
                      <span className="font-headline font-extrabold text-primary text-base">
                        Bs. {quotation.subtotal.toFixed(2)}
                      </span>
                    </div>

                    {/* Action row */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : quotation.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-surface-container text-on-surface-variant font-label text-sm font-semibold rounded-xl py-2.5 transition-opacity active:opacity-70"
                      >
                        <span className="material-symbols-outlined text-base leading-none">
                          {isExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                        Ver items
                      </button>

                      {quotation.status === 'pending' && (
                        <button
                          onClick={() => acceptQuotation(quotation.id)}
                          disabled={accepting}
                          className="flex-1 bg-primary text-on-primary font-label text-sm font-semibold rounded-xl py-2.5 transition-opacity active:opacity-70 disabled:opacity-50"
                        >
                          Aceptar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded items */}
                  {isExpanded && items.length > 0 && (
                    <div className="border-t border-outline-variant bg-surface-container/50 px-4 py-3 flex flex-col gap-2">
                      {items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="font-body text-sm text-on-surface">
                            {item.quantity}x {item.name ?? 'Producto'}
                          </span>
                          <span className="font-body text-sm text-on-surface-variant">
                            Bs. {(item.price_unit * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

      </div>
    </>
  )
}
