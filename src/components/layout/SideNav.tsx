'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Home, PlusCircle, MessageCircle, User, Ticket, HelpCircle, Bell, MessageSquare } from 'lucide-react';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { useNotification } from '@/contexts/NotificationContext';

// Discord SVG Icon
const DiscordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

export default function SideNav() {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const tNotif = useTranslations('notifications');
  const { unreadMessageCount, unreadNotificationCount } = useNotification();

  const navItems = [
    { href: '/', label: t('home'), icon: Home },
    { href: '/create', label: t('create'), icon: PlusCircle },
    { href: '/notifications', label: tNotif('title'), icon: Bell, showBadge: unreadNotificationCount > 0 },
    { href: '/messages', label: t('messages'), icon: MessageCircle, showBadge: unreadMessageCount > 0, badgeCount: unreadMessageCount },
    { href: '/forum', label: t('forum'), icon: MessageSquare },
    { href: '/profile', label: t('profile'), icon: User },
    { href: '/help', label: t('help'), icon: HelpCircle },
  ];

  // 在聊天頁面等特定頁面隱藏導覽
  const hiddenPaths = ['/chat'];
  const shouldHide = hiddenPaths.some((path) => pathname.startsWith(path));

  if (shouldHide) return null;

  return (
    <aside
      className="
        hidden lg:flex flex-col
        fixed left-0 top-0 bottom-0
        w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        z-40
      "
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-100 dark:border-gray-700">
        <Ticket className="w-8 h-8 text-indigo-500" />
        <span className="text-xl font-bold text-gray-900 dark:text-gray-100">TicketTicket</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {navItems.map(({ href, label, icon: Icon, showBadge, badgeCount }) => {
            const isActive = pathname === href;

            return (
              <li key={href}>
                <Link
                  href={href}
                  data-tutorial={href === '/create' ? 'publish-button' : undefined}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl
                    transition-all duration-200
                    ${isActive
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'}
                  `}
                >
                  <div className="relative">
                    <Icon
                      className={`w-5 h-5 ${href === '/create' ? 'w-6 h-6' : ''}`}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    {showBadge && (
                      badgeCount ? (
                        <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white border-2 border-white dark:border-gray-800 z-10">
                          {badgeCount > 99 ? '99+' : badgeCount}
                        </span>
                      ) : (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-gray-800" />
                      )
                    )}
                  </div>
                  <span className="text-sm">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
        <div className="flex gap-2">
          <LanguageSwitcher />
          <a
            href="https://discord.gg/KpPD9cpdH8"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-medium transition-colors"
            title="Discord"
          >
            <DiscordIcon className="w-4 h-4" />
            <span>Discord</span>
          </a>
        </div>
        <div className="p-4 text-xs text-center text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-white/5">
          TicketTicket v1.24
          <br />
          &copy; 2024 TicketTicket
        </div>
      </div>
    </aside>
  );
}
