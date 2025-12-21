'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Home,
  PlusCircle,
  MessageCircle,
  CheckCircle,
  AlertTriangle,
  Search,
  Ticket,
  Send,
  Star,
} from 'lucide-react';

export default function HelpPage() {
  const t = useTranslations('help');
  const router = useRouter();

  const sections = [
    {
      icon: Home,
      color: 'indigo',
      titleKey: 'browsing.title',
      steps: [
        { icon: Search, key: 'browsing.step1' },
        { icon: Ticket, key: 'browsing.step2' },
        { icon: null, key: 'browsing.step3' },
      ],
    },
    {
      icon: PlusCircle,
      color: 'green',
      titleKey: 'listing.title',
      steps: [
        { icon: null, key: 'listing.step1' },
        { icon: null, key: 'listing.step2' },
        { icon: null, key: 'listing.step3' },
      ],
    },
    {
      icon: MessageCircle,
      color: 'blue',
      titleKey: 'messaging.title',
      steps: [
        { icon: Send, key: 'messaging.step1' },
        { icon: null, key: 'messaging.step2' },
        { icon: null, key: 'messaging.step3' },
      ],
    },
    {
      icon: CheckCircle,
      color: 'emerald',
      titleKey: 'completing.title',
      steps: [
        { icon: null, key: 'completing.step1' },
        { icon: Star, key: 'completing.step2' },
        { icon: null, key: 'completing.step3' },
      ],
    },
  ];

  const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-900/30',
      text: 'text-indigo-600 dark:text-indigo-400',
      border: 'border-indigo-200 dark:border-indigo-800',
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/30',
      text: 'text-green-600 dark:text-green-400',
      border: 'border-green-200 dark:border-green-800',
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800',
    },
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/30',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800',
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center h-14 px-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="ml-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('title')}
          </h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 lg:pb-6">
        {/* Intro */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-full mb-4">
            <Ticket className="w-8 h-8 text-indigo-500" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {t('intro')}
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section, idx) => {
            const Icon = section.icon;
            const colors = colorClasses[section.color];

            return (
              <div
                key={idx}
                className={`${colors.bg} border ${colors.border} rounded-xl p-5`}
              >
                <div className={`flex items-center gap-3 ${colors.text} font-semibold mb-4`}>
                  <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-lg">{t(section.titleKey)}</span>
                </div>

                <div className="space-y-3 ml-2">
                  {section.steps.map((step, stepIdx) => (
                    <div key={stepIdx} className="flex items-start gap-3">
                      <span className={`flex-shrink-0 w-6 h-6 rounded-full bg-white dark:bg-gray-800 ${colors.text} text-sm font-medium flex items-center justify-center shadow-sm`}>
                        {stepIdx + 1}
                      </span>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed pt-0.5">
                        {t(step.key)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Safety Warning */}
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-5">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 font-semibold mb-4">
              <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <span className="text-lg">{t('safety.title')}</span>
            </div>

            <div className="space-y-3 ml-2">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 text-sm font-medium flex items-center justify-center shadow-sm">
                  !
                </span>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed pt-0.5">
                  {t('safety.point1')}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 text-sm font-medium flex items-center justify-center shadow-sm">
                  !
                </span>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed pt-0.5">
                  {t('safety.point2')}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 text-sm font-medium flex items-center justify-center shadow-sm">
                  !
                </span>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed pt-0.5">
                  {t('safety.point3')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
