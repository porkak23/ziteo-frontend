import { StarRating } from './StarRating';

export interface Review {
  id: string;
  reviewer_id: string;
  reviewed_id: string;
  contract_id?: string;
  rating: number;
  comment?: string;
  created_at: string;
  reviewer_name?: string;
}

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const dateStr = new Date(review.created_at).toLocaleDateString();
  return (
    <div className="bg-surface rounded-2xl p-3 border border-outline-variant flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {review.contract_id ? (
            <div className="flex items-center gap-1 text-primary">
              <span className="material-symbols-outlined text-sm">verified</span>
              <span className="text-xs font-label">Usuario verificado</span>
            </div>
          ) : (
            <span className="text-xs font-label text-on-surface-variant">
              {review.reviewer_name || 'Usuario'}
            </span>
          )}
        </div>
        <span className="text-xs text-on-surface-variant font-body">{dateStr}</span>
      </div>
      <StarRating value={review.rating} readonly size="sm" />
      {review.comment && (
        <p className="text-sm font-body text-on-surface leading-relaxed">
          {review.comment}
        </p>
      )}
    </div>
  );
}
