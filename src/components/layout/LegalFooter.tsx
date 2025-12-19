'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function LegalFooter() {
  const t = useTranslations('legal');

  return (
    <footer className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center space-y-4">
          {/* Legal Links */}
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/legal/terms" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">
              {t('terms')}
            </Link>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <Link href="/legal/privacy" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">
              {t('privacy')}
            </Link>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <Link href="/legal/tokushoho" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">
              {t('tokushoho')}
            </Link>
          </div>

          {/* Japanese Law Compliance Notice */}
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>{t('complianceNotice')}</p>
            <p>{t('copyright')}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
