'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Moon, Sun, Monitor, ChevronRight } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import Modal from './Modal';

interface ThemeSwitcherProps {
  variant?: 'button' | 'menu-item';
}

export default function ThemeSwitcher({ variant = 'button' }: ThemeSwitcherProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const t = useTranslations('theme');

  const themes = [
    { value: 'light' as const, label: t('light'), icon: Sun },
    { value: 'dark' as const, label: t('dark'), icon: Moon },
    { value: 'system' as const, label: t('system'), icon: Monitor },
  ];

  const currentTheme = themes.find((th) => th.value === theme) || themes[2];
  const CurrentIcon = currentTheme.icon;

  if (variant === 'menu-item') {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-3 px-4 py-3.5 w-full text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700"
        >
          <CurrentIcon className="w-5 h-5" />
          <span className="flex-1 font-medium">{t('title')}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">{currentTheme.label}</span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={t('title')}>
          <div className="p-2">
            {themes.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => {
                  setTheme(value);
                  setShowModal(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${theme === value
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'}
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{label}</span>
                {theme === value && (
                  <span className="ml-auto text-indigo-600 dark:text-indigo-400">✓</span>
                )}
              </button>
            ))}
          </div>
        </Modal>
      </>
    );
  }

  return (
    <button
      onClick={() => setShowModal(true)}
      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200"
    >
      <CurrentIcon className="w-5 h-5" />
      <span className="text-sm">{currentTheme.label}</span>
    </button>
  );
}
