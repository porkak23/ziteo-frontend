import { useState } from 'react';

interface StarRatingProps {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StarRating({ value, onChange, readonly = false, size = 'sm' }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const sizeClasses = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const currentVal = hoverValue !== null && !readonly ? hoverValue : value;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        let iconName = 'star_border';
        let isAmber = false;

        if (currentVal >= star) {
          iconName = 'star';
          isAmber = true;
        } else if (currentVal >= star - 0.5) {
          iconName = 'star_half';
          isAmber = true;
        }

        return (
          <button
            key={star}
            type="button"
            className={`${sizeClasses[size]} material-symbols-outlined transition-colors leading-none p-0 outline-none ${
              isAmber ? 'text-[var(--color-rating)]' : 'text-on-surface-variant'
            } ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
            onMouseEnter={() => !readonly && setHoverValue(star)}
            onMouseLeave={() => !readonly && setHoverValue(null)}
            onClick={() => !readonly && onChange?.(star)}
            disabled={readonly}
          >
            {iconName}
          </button>
        );
      })}
    </div>
  );
}
