'use client';

// Star rating display + input — Item 14

import { useState } from 'react';

interface Props {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

const SIZES = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' };

export default function StarRating({
  value,
  onChange,
  readOnly = false,
  size = 'md',
  showValue = false,
}: Props) {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  const cls = SIZES[size];

  return (
    <div className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= display;
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(n)}
            onMouseEnter={() => !readOnly && setHover(n)}
            onMouseLeave={() => !readOnly && setHover(0)}
            className={`transition ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
            aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
          >
            <svg
              className={`${cls} ${filled ? 'text-yellow-400' : 'text-gray-300'}`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2l2.9 6.26 6.85.62-5.18 4.53 1.54 6.69L12 16.9l-6.11 3.2 1.54-6.69-5.18-4.53 6.85-.62L12 2z" />
            </svg>
          </button>
        );
      })}
      {showValue && (
        <span className="ml-2 text-sm font-medium text-gray-700">{value.toFixed(1)}</span>
      )}
    </div>
  );
}
