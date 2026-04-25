import { useState } from 'react'
import { StarRating } from './StarRating'
import { useSubmitReview } from '../hooks/useReviews'
import { useAuthStore } from '../../features/auth/store/authStore'
import { useToast } from '../hooks/useToast'
import { Toast } from './Toast'

interface ReviewFormProps {
  reviewedId: string
  reviewedName: string
  onClose: () => void
}

const RATING_LABELS = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente']

export function ReviewForm({ reviewedId, reviewedName, onClose }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const currentUser = useAuthStore((s) => s.user)
  const { mutate: submitReview, isPending } = useSubmitReview()
  const { toasts, showToast, removeToast } = useToast()

  function handleSubmit() {
    if (!currentUser || rating === 0) return

    submitReview(
      {
        reviewer_id: currentUser.user_id,
        reviewed_id: reviewedId,
        rating,
        comment: comment.trim() || undefined,
      },
      {
        onSuccess: () => {
          showToast('Calificación enviada', 'success')
          setTimeout(onClose, 1200)
        },
        onError: (err: unknown) => {
          const msg = err instanceof Error ? err.message : 'Error al enviar la calificación'
          showToast(msg, 'error')
        },
      }
    )
  }

  return (
    <>
      <Toast toasts={toasts} onRemove={removeToast} />
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center pointer-events-none">
        <div className="w-full max-w-lg bg-surface rounded-t-3xl shadow-2xl flex flex-col pointer-events-auto">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-outline-variant" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-2 pb-1">
            <h2 className="font-headline font-bold text-on-surface text-base">
              Calificar a {reviewedName}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
              aria-label="Cerrar formulario de calificación"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          <div className="flex flex-col gap-5 px-6 pb-8 pt-3">
            {/* Star rating */}
            <div className="flex flex-col items-center gap-3 py-3 bg-surface-container rounded-2xl">
              <span className="font-label text-sm text-on-surface-variant h-5">
                {rating === 0 ? 'Selecciona una calificación' : RATING_LABELS[rating]}
              </span>
              <StarRating value={rating} onChange={setRating} size="lg" />
              <span className="font-label text-xs text-on-surface-variant">
                {rating > 0 ? `${rating} de 5 estrellas` : '\u00a0'}
              </span>
            </div>

            {/* Comment textarea */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label text-xs text-on-surface-variant">
                Comentario (opcional)
              </label>
              <textarea
                id="review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Describe tu experiencia..."
                maxLength={500}
                rows={3}
                className="bg-surface-container rounded-2xl p-3 font-body text-sm text-on-surface placeholder:text-on-surface-variant resize-none focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
              />
              <span className="text-right text-xs font-body text-on-surface-variant">
                {comment.length}/500
              </span>
            </div>

            {/* Submit button */}
            <button
              id="review-submit-btn"
              type="button"
              onClick={handleSubmit}
              disabled={rating === 0 || isPending}
              className="w-full bg-primary text-on-primary rounded-2xl py-3.5 font-label font-semibold text-sm disabled:opacity-50 transition-opacity active:opacity-80 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-base leading-none">
                    progress_activity
                  </span>
                  Enviando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base leading-none">star</span>
                  Enviar calificación
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
