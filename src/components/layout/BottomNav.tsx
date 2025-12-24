'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Home, PlusCircle, MessageCircle, User, Bell } from 'lucide-react';
import { useNotification } from '@/contexts/NotificationContext';

export default function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const tNotif = useTranslations('notifications');
  const { hasUnread } = useNotification();

  const navItems = [
    { href: '/', label: t('home'), icon: Home },
    { href: '/notifications', label: tNotif('title'), icon: Bell, showBadge: hasUnread },
    { href: '/create', label: t('create'), icon: PlusCircle },
    { href: '/messages', label: t('messages'), icon: MessageCircle },
    { href: '/profile', label: t('profile'), icon: User },
  ];

  // 在聊天頁面等特定頁面隱藏底部導覽
  const hiddenPaths = ['/chat'];
  const shouldHide = hiddenPaths.some((path) => pathname.startsWith(path));

  if (shouldHide) return null;

  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0 z-40
        bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700
        safe-area-bottom
        lg:hidden
      "
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ href, label, icon: Icon, showBadge }) => {
          const isActive = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={`
                flex flex-col items-center justify-center
                w-full h-full gap-1
                transition-colors duration-200
                ${isActive ? 'text-indigo-500' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}
              `}
            >
              <div className="relative">
                <Icon
                  className={`w-6 h-6 ${href === '/create' ? 'w-7 h-7' : ''}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800" />
                )}
              </div>
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
