'use client';

import { CurrencyCode, CURRENCY_INFO } from '@/types';

interface CurrencyBadgeProps {
  currency: CurrencyCode;
  className?: string;
}

/**
 * 幣值提示小標籤 — 僅在非 JPY 時顯示
 */
export default function CurrencyBadge({ currency, className = '' }: CurrencyBadgeProps) {
  if (!currency || currency === 'JPY') return null;

  const info = CURRENCY_INFO[currency];
  if (!info) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700 ${className}`}
      title={`此票價以${info.nameZh}(${info.name})計價，非日圓`}
    >
      💱 {info.name}
    </span>
  );
}
