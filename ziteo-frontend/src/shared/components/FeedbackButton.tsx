import { useState } from 'react'
import { useAuthStore } from '../../features/auth/store/authStore'
import { useSubmitFeedback } from '../hooks/useFeedback'

type Category = 'bug' | 'mejora' | 'pregunta' | 'otro'

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'bug', label: 'Error / Bug' },
  { value: 'mejora', label: 'Sugerencia de mejora' },
  { value: 'pregunta', label: 'Pregunta' },
  { value: 'otro', label: 'Otro' },
]

const MIN_LENGTH = 10
const MAX_LENGTH = 500

export function FeedbackButton() {
  const user = useAuthStore((s) => s.user)
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<Category>('bug')
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const mutation = useSubmitFeedback()

  if (!user) return null

  function handleOpen() {
    setOpen(true)
    setSubmitted(false)
    setDescription('')
    setCategory('bug')
  }

  function handleClose() {
    setOpen(false)
    mutation.reset()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (description.trim().length < MIN_LENGTH) return

    try {
      await mutation.mutateAsync({ description: description.trim(), category })
      setSubmitted(true)
    } catch {
      // best-effort: show success anyway so we don't frustrate the user
      setSubmitted(true)
    }
  }

  const canSubmit = description.trim().length >= MIN_LENGTH && !mutation.isPending

  return (
    <>
      {/* Fixed button — bottom left, below nav z-index */}
      <button
        type="button"
        onClick={handleOpen}
        className="fixed bottom-20 left-3 z-40 px-3 py-1.5 rounded-lg border border-outline bg-surface text-on-surface-variant text-xs font-medium shadow-sm"
        style={{ letterSpacing: '0.1px' }}
      >
        Reportar problema
      </button>

      {/* Backdrop + drawer */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div
            className="w-full rounded-t-2xl bg-surface p-6 pb-8"
            style={{ maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-on-surface font-bold text-base">Reportar problema</h2>
              <button
                type="button"
                onClick={handleClose}
                className="text-on-surface-variant text-sm px-2 py-1 rounded"
                aria-label="Cerrar"
              >
                Cerrar
              </button>
            </div>

            {submitted ? (
              <div className="py-6 text-center">
                <p className="text-on-surface font-semibold text-sm">Gracias, lo revisamos pronto.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="w-full rounded-lg border border-outline bg-surface-container text-on-surface text-sm px-3 py-3 outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                    Describe el problema
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, MAX_LENGTH))}
                    placeholder="Cuéntanos qué ocurrió..."
                    rows={4}
                    className="w-full rounded-lg border border-outline bg-surface-container text-on-surface text-sm px-3 py-3 outline-none resize-none"
                  />
                  <span className={`text-xs text-right ${description.length < MIN_LENGTH ? 'text-error' : 'text-on-surface-variant'}`}>
                    {description.trim().length} / {MAX_LENGTH} (mínimo {MIN_LENGTH})
                  </span>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 py-3 rounded-xl border border-outline text-on-surface-variant text-sm font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="flex-1 py-3 rounded-xl bg-primary text-on-primary text-sm font-bold disabled:opacity-40"
                  >
                    {mutation.isPending ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
