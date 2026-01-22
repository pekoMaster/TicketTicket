'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import {
    Bell,
    Calendar,
    Ticket,
    Trash2,
    ChevronLeft,
    Loader2,
    AlertTriangle,
    Check,
    Mail,
    BellOff,
} from 'lucide-react';

interface Subscription {
    id: string;
    event_id: string | null;
    event_name: string;
    seat_grades: string[];
    max_price_jpy: number;
    ticket_types: string[];
    notify_email: boolean;
    notify_discord: boolean;
    notify_line: boolean;
    is_active: boolean;
    triggered_count: number;
    last_triggered_at: string | null;
    created_at: string;
}

export default function SubscriptionsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const t = useTranslations('subscription');
    const tCommon = useTranslations('common');

    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 刪除確認彈窗
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [subscriptionToDelete, setSubscriptionToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // 載入訂閱列表
    const fetchSubscriptions = useCallback(async () => {
        try {
            const response = await fetch('/api/subscriptions');
            if (!response.ok) throw new Error('Failed to fetch subscriptions');
            const data = await response.json();
            setSubscriptions(data.subscriptions || []);
        } catch (err) {
            console.error('Error fetching subscriptions:', err);
            setError(t('fetchError', { defaultValue: '無法載入訂閱列表' }));
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchSubscriptions();
        } else if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, fetchSubscriptions, router]);

    // 刪除訂閱
    const handleDelete = async () => {
        if (!subscriptionToDelete) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/subscriptions/${subscriptionToDelete}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setSubscriptions(prev => prev.filter(s => s.id !== subscriptionToDelete));
                setShowDeleteModal(false);
                setSubscriptionToDelete(null);
            } else {
                alert(tCommon('deleteFailed'));
            }
        } catch (err) {
            console.error('Error deleting subscription:', err);
            alert(tCommon('deleteFailed'));
        } finally {
            setIsDeleting(false);
        }
    };

    // 切換訂閱啟用狀態
    const toggleActive = async (sub: Subscription) => {
        try {
            const response = await fetch(`/api/subscriptions/${sub.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !sub.is_active }),
            });

            if (response.ok) {
                setSubscriptions(prev =>
                    prev.map(s =>
                        s.id === sub.id ? { ...s, is_active: !s.is_active } : s
                    )
                );
            }
        } catch (err) {
            console.error('Error toggling subscription:', err);
        }
    };

    // 格式化日期
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // 票券類型標籤
    const ticketTypeLabels: Record<string, string> = {
        find_companion: t('findCompanion', { defaultValue: '尋找同行' }),
        sub_ticket_transfer: t('subTicketTransfer', { defaultValue: '子票轉讓' }),
        ticket_exchange: t('ticketExchange', { defaultValue: '換票' }),
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
                title={t('mySubscriptions', { defaultValue: '我的訂閱' })}
                showBack
            />

            <div className="pt-20 pb-20 px-4 max-w-2xl mx-auto">
                {/* 說明 */}
                <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl border border-indigo-200 dark:border-indigo-700">
                    <div className="flex items-start gap-3">
                        <Bell className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm text-indigo-700 dark:text-indigo-300">
                                {t('subscriptionDescription', { defaultValue: '當有符合您訂閱條件的新票券上架時，我們會發送通知給您。每個帳號最多可訂閱 3 個活動。' })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 錯誤訊息 */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 rounded-xl border border-red-200 dark:border-red-700">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <AlertTriangle className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                {/* 訂閱列表 */}
                {subscriptions.length > 0 ? (
                    <div className="space-y-4">
                        {subscriptions.map(sub => (
                            <Card key={sub.id} className={`dark:bg-gray-800 dark:border-gray-700 ${!sub.is_active ? 'opacity-60' : ''}`}>
                                <div className="flex items-start gap-4">
                                    {/* 活動資訊 */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            {sub.is_active ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                                    <Check className="w-3 h-3" />
                                                    {t('active', { defaultValue: '啟用中' })}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500">
                                                    <BellOff className="w-3 h-3" />
                                                    {t('paused', { defaultValue: '已暫停' })}
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                                            {sub.event_name}
                                        </h3>

                                        {/* 篩選條件 */}
                                        <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
                                            {/* 座位等級 */}
                                            {sub.seat_grades.length > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <Ticket className="w-4 h-4 text-gray-400" />
                                                    <span>{t('seatGrades', { defaultValue: '座位：' })}</span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {sub.seat_grades.map(g => (
                                                            <span key={g} className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded text-xs">
                                                                {g}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* 價格上限 */}
                                            {sub.max_price_jpy > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-400">💰</span>
                                                    <span>{t('maxPriceLabel', { defaultValue: '價格上限：' })}¥{sub.max_price_jpy.toLocaleString()}</span>
                                                </div>
                                            )}

                                            {/* 票券類型 */}
                                            {sub.ticket_types.length > 0 && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-400">🏷️</span>
                                                    <span>{t('ticketTypesLabel', { defaultValue: '類型：' })}</span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {sub.ticket_types.map(type => (
                                                            <span key={type} className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded text-xs">
                                                                {ticketTypeLabels[type] || type}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* 通知方式 */}
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-gray-400" />
                                                <span>{t('notifyVia', { defaultValue: '通知方式：' })}</span>
                                                <div className="flex gap-1">
                                                    {sub.notify_email && (
                                                        <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded text-xs">
                                                            Email
                                                        </span>
                                                    )}
                                                    {sub.notify_discord && (
                                                        <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded text-xs">
                                                            Discord
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* 觸發次數 */}
                                            <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>{t('createdAt', { defaultValue: '建立於' })} {formatDate(sub.created_at)}</span>
                                                {sub.triggered_count > 0 && (
                                                    <span className="ml-2">
                                                        {t('triggeredCount', { count: sub.triggered_count, defaultValue: `已通知 ${sub.triggered_count} 次` })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 操作按鈕 */}
                                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => toggleActive(sub)}
                                        className="flex-1"
                                    >
                                        {sub.is_active ? (
                                            <>
                                                <BellOff className="w-4 h-4 mr-1" />
                                                {t('pause', { defaultValue: '暫停' })}
                                            </>
                                        ) : (
                                            <>
                                                <Bell className="w-4 h-4 mr-1" />
                                                {t('resume', { defaultValue: '啟用' })}
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => {
                                            setSubscriptionToDelete(sub.id);
                                            setShowDeleteModal(true);
                                        }}
                                        className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="text-center py-12 dark:bg-gray-800 dark:border-gray-700">
                        <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400 mb-2">
                            {t('noSubscriptions', { defaultValue: '尚未訂閱任何活動' })}
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                            {t('howToSubscribe', { defaultValue: '前往刊登詳情頁點擊 🔔 鈴鐺按鈕即可訂閱' })}
                        </p>
                        <Button onClick={() => router.push('/')}>
                            {t('goExplore', { defaultValue: '探索刊登' })}
                        </Button>
                    </Card>
                )}

                {/* 訂閱數量提示 */}
                {subscriptions.length > 0 && (
                    <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-4">
                        {t('subscriptionCount', { count: subscriptions.length, max: 3, defaultValue: `已使用 ${subscriptions.length} / 3 個訂閱額度` })}
                    </p>
                )}
            </div>

            {/* 刪除確認彈窗 */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title={t('deleteConfirmTitle', { defaultValue: '確認取消訂閱' })}
            >
                <div className="p-4">
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        {t('deleteConfirmMessage', { defaultValue: '確定要取消此訂閱嗎？取消後將不再收到此活動的新票券通知。' })}
                    </p>
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            fullWidth
                            onClick={() => setShowDeleteModal(false)}
                            disabled={isDeleting}
                        >
                            {tCommon('cancel')}
                        </Button>
                        <Button
                            fullWidth
                            onClick={handleDelete}
                            loading={isDeleting}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            {t('confirmDelete', { defaultValue: '確認取消' })}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
