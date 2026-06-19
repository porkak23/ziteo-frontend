import { useState } from 'react';
import { StarRating } from './StarRating';
import { useSubmitReview } from '../hooks/useReviews';
import { useAuthStore } from '../../features/auth/store/authStore';

interface ReviewModalProps {
  reviewedId: string;
  contractId?: string;
  onClose: () => void;
}

export function ReviewModal({ reviewedId, contractId, onClose }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const user = useAuthStore((s) => s.user);
  const { mutate: submitReview, isPending } = useSubmitReview();

  const handleSubmit = () => {
    if (!user || rating < 1) return;
    submitReview(
      {
        reviewer_id: user.user_id,
        reviewed_id: reviewedId,
        contract_id: contractId,
        rating,
        comment: comment.trim() || undefined,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50">
      <div className="w-full sm:max-w-md bg-surface rounded-t-3xl sm:rounded-3xl p-5 flex flex-col gap-4 animate-slide-up sm:animate-fade-in shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="font-label font-semibold text-lg text-on-surface">Calificar</h2>
          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-container/80 transition-colors" aria-label="Cerrar"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="flex flex-col items-center gap-2 py-4">
          <StarRating value={rating} onChange={setRating} size="lg" />
          <span className="text-xs text-on-surface-variant">Selecciona 1 a 5 estrellas</span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-label text-xs text-on-surface-variant">Comentario (opcional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="¿Cómo fue tu experiencia?"
            className="min-h-24 bg-surface-container rounded-2xl p-3 font-body text-sm text-on-surface placeholder:text-on-surface-variant resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || rating < 1}
          className="w-full bg-primary text-on-primary rounded-2xl py-3 font-label font-semibold text-sm transition-opacity disabled:opacity-60"
        >
          {isPending ? 'Enviando...' : 'Enviar calificación'}
        </button>
      </div>
    </div>
  );
}
