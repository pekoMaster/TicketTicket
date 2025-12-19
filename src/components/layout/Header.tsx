'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  transparent?: boolean;
}

export default function Header({
  title,
  showBack = false,
  rightAction,
  transparent = false,
}: HeaderProps) {
  const router = useRouter();

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-30
        lg:left-64
        h-14 flex items-center justify-between px-4
        ${transparent ? 'bg-transparent' : 'bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700'}
        safe-area-top
      `}
    >
      <div className="flex items-center gap-2 min-w-[60px]">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="p-1 -ml-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700 dark:text-gray-200" />
          </button>
        )}
      </div>

      {title && (
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{title}</h1>
      )}

      <div className="flex items-center gap-2 min-w-[60px] justify-end">
        {rightAction}
      </div>
    </header>
  );
}
