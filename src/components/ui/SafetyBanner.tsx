'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

interface SafetyBannerProps {
  variant?: 'chat' | 'listing';
  className?: string;
}

export default function SafetyBanner({ variant = 'chat', className = '' }: SafetyBannerProps) {
  const t = useTranslations('safety');

  if (variant === 'chat') {
    return (
      <div
        className={`
          bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-lg p-3
          flex items-start gap-2
          ${className}
        `}
      >
        <AlertTriangle className="w-5 h-5 text-orange-500 dark:text-orange-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-orange-800 dark:text-orange-200">
          {t('chatWarning')}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4
        flex items-start gap-3
        ${className}
      `}
    >
      <ShieldAlert className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
      <div className="text-sm text-amber-800 dark:text-amber-200">
        <p className="font-semibold mb-1">{t('transactionTitle')}</p>
        <p className="text-red-600 dark:text-red-400 font-medium mb-2">{t('scamWarning')}</p>
        <ul className="list-disc list-inside space-y-1 text-amber-700 dark:text-amber-300">
          <li>{t('tip1')}</li>
          <li>{t('tip2')}</li>
          <li>{t('tip3')}</li>
        </ul>
      </div>
    </div>
  );
}
