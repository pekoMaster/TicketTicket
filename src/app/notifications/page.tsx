'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
    Bell,
    BellOff,
    Check,
    Trash2,
    ExternalLink,
    Loader2,
    UserPlus,
    CheckCircle,
    XCircle,
    Clock,
    Star,
    Megaphone,
} from 'lucide-react';
import Link from 'next/link';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    is_read: boolean;
    created_at: string;
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    new_application: UserPlus,
    application_accepted: CheckCircle,
    application_rejected: XCircle,
    listing_expired: Clock,
    new_review: Star,
    system: Megaphone,
};

export default function NotificationsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const t = useTranslations('notifications');

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isMarkingAll, setIsMarkingAll] = useState(false);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch('/api/notifications?limit=50');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }
        if (session?.user) {
            fetchNotifications();
        }
    }, [session, status, router, fetchNotifications]);

    const handleMarkAllRead = async () => {
        setIsMarkingAll(true);
        try {
            const res = await fetch('/api/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ markAll: true }),
            });
            if (res.ok) {
                setNotifications((prev) =>
                    prev.map((n) => ({ ...n, is_read: true }))
                );
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error marking all as read:', error);
        } finally {
            setIsMarkingAll(false);
        }
    };

    const handleMarkRead = async (id: string) => {
        try {
            const res = await fetch(`/api/notifications/${id}`, {
                method: 'PUT',
            });
            if (res.ok) {
                setNotifications((prev) =>
                    prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/notifications/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                const notification = notifications.find((n) => n.id === id);
                setNotifications((prev) => prev.filter((n) => n.id !== id));
                if (notification && !notification.is_read) {
                    setUnreadCount((prev) => Math.max(0, prev - 1));
                }
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}${t('minutesAgo')}`;
        if (diffHours < 24) return `${diffHours}${t('hoursAgo')}`;
        if (diffDays < 7) return `${diffDays}${t('daysAgo')}`;
        return date.toLocaleDateString();
    };

    if (status === 'loading' || isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Header
                title={t('title')}
                showBack
                rightAction={
                    unreadCount > 0 && (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleMarkAllRead}
                            disabled={isMarkingAll}
                        >
                            {isMarkingAll ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Check className="w-4 h-4" />
                            )}
                            <span className="ml-1 hidden sm:inline">{t('markAllRead')}</span>
                        </Button>
                    )
                }
            />

            <div className="pt-20 pb-20 px-4">
                {notifications.length > 0 ? (
                    <div className="space-y-2 max-w-2xl mx-auto">
                        {notifications.map((notification) => {
                            const IconComponent = TYPE_ICONS[notification.type] || Bell;
                            return (
                                <Card
                                    key={notification.id}
                                    className={`dark:bg-gray-800 dark:border-gray-700 ${!notification.is_read ? 'border-l-4 border-l-indigo-500' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={`p-2 rounded-full flex-shrink-0 ${!notification.is_read
                                                    ? 'bg-indigo-100 dark:bg-indigo-900/50'
                                                    : 'bg-gray-100 dark:bg-gray-700'
                                                }`}
                                        >
                                            <IconComponent
                                                className={`w-4 h-4 ${!notification.is_read
                                                        ? 'text-indigo-600 dark:text-indigo-400'
                                                        : 'text-gray-500 dark:text-gray-400'
                                                    }`}
                                            />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p
                                                        className={`font-medium ${!notification.is_read
                                                                ? 'text-gray-900 dark:text-gray-100'
                                                                : 'text-gray-700 dark:text-gray-300'
                                                            }`}
                                                    >
                                                        {notification.title}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                        {formatTime(notification.created_at)}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    {notification.link && (
                                                        <Link
                                                            href={notification.link}
                                                            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                            title={t('viewDetail')}
                                                        >
                                                            <ExternalLink className="w-4 h-4 text-gray-400" />
                                                        </Link>
                                                    )}
                                                    {!notification.is_read && (
                                                        <button
                                                            onClick={() => handleMarkRead(notification.id)}
                                                            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                                            title={t('markAsRead')}
                                                        >
                                                            <Check className="w-4 h-4 text-gray-400" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(notification.id)}
                                                        className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                        title={t('delete')}
                                                    >
                                                        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <Card className="text-center py-12 max-w-md mx-auto dark:bg-gray-800 dark:border-gray-700">
                        <BellOff className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">{t('noNotifications')}</p>
                    </Card>
                )}
            </div>
        </div>
    );
}
