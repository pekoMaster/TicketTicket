'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface StarRatingProps {
  value?: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  totalReviews?: number;
}

export default function StarRating({
  value = 0,
  onChange,
  readonly = false,
  size = 'md',
  showValue = false,
  totalReviews,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const t = useTranslations('rating');

  const sizeStyles = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const displayValue = hoverValue ?? value;

  const handleClick = (index: number) => {
    if (!readonly && onChange) {
      onChange(index);
    }
  };

  const handleMouseEnter = (index: number) => {
    if (!readonly) {
      setHoverValue(index);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverValue(null);
    }
  };

  return (
    <div className="inline-flex items-center gap-1">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((index) => (
          <button
            key={index}
            type="button"
            disabled={readonly}
            onClick={() => handleClick(index)}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
            className={`
              ${readonly ? 'cursor-default' : 'cursor-pointer'}
              transition-transform duration-100
              ${!readonly && 'hover:scale-110 active:scale-95'}
            `}
          >
            <Star
              className={`
                ${sizeStyles[size]}
                ${index <= displayValue
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300 dark:text-gray-600'
                }
                transition-colors duration-100
              `}
            />
          </button>
        ))}
      </div>
      {showValue && (
        <span className="text-sm text-gray-600 dark:text-gray-300 ml-1">
          {value > 0 ? value.toFixed(1) : t('noRating')}
          {totalReviews !== undefined && totalReviews > 0 && (
            <span className="text-gray-400 dark:text-gray-500"> ({totalReviews})</span>
          )}
        </span>
      )}
    </div>
  );
}
