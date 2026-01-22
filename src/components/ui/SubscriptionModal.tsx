'use client';

import { useState, useEffect } from 'react';
import { X, Bell, Mail, Loader2, AlertTriangle, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import Modal from './Modal';
import Button from './Button';

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId?: string;
    eventName: string;
    seatGrades?: string[];
    onSuccess?: () => void;
}

interface UserInfo {
    hasDiscord: boolean;
    hasLine: boolean;
}

export default function SubscriptionModal({
    isOpen,
    onClose,
    eventId,
    eventName,
    seatGrades = [],
    onSuccess,
}: SubscriptionModalProps) {
    const { data: session } = useSession();
    const t = useTranslations('subscription');
    const tCommon = useTranslations('common');

    // 表單狀態
    const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
    const [maxPrice, setMaxPrice] = useState<number>(0);
    const [ticketTypes, setTicketTypes] = useState<string[]>([]);
    const [notifyEmail, setNotifyEmail] = useState(true);
    const [notifyDiscord, setNotifyDiscord] = useState(false);
    const [notifyLine, setNotifyLine] = useState(false);

    // UI 狀態
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [userInfo, setUserInfo] = useState<UserInfo>({ hasDiscord: false, hasLine: false });

    // 票種類型選項
    const ticketTypeOptions = [
        { value: 'find_companion', label: t('findCompanion', { defaultValue: '尋找同行' }) },
        { value: 'sub_ticket_transfer', label: t('subTicketTransfer', { defaultValue: '子票轉讓' }) },
        { value: 'ticket_exchange', label: t('ticketExchange', { defaultValue: '換票' }) },
    ];

    // 檢查用戶連結狀態
    useEffect(() => {
        if (isOpen && session?.user?.dbId) {
            fetch('/api/profile')
                .then(res => res.json())
                .then(data => {
                    setUserInfo({
                        hasDiscord: !!data.discordId,
                        hasLine: !!data.lineId,
                    });
                })
                .catch(console.error);
        }
    }, [isOpen, session?.user?.dbId]);

    // 重置表單
    useEffect(() => {
        if (isOpen) {
            setSelectedGrades([]);
            setMaxPrice(0);
            setTicketTypes([]);
            setNotifyEmail(true);
            setNotifyDiscord(false);
            setNotifyLine(false);
            setError(null);
            setSuccess(false);
        }
    }, [isOpen]);

    const handleGradeToggle = (grade: string) => {
        setSelectedGrades(prev =>
            prev.includes(grade)
                ? prev.filter(g => g !== grade)
                : [...prev, grade]
        );
    };

    const handleTicketTypeToggle = (type: string) => {
        setTicketTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    const handleSubmit = async () => {
        if (!session?.user) return;

        // 驗證至少一種通知方式
        if (!notifyEmail && !notifyDiscord && !notifyLine) {
            setError(t('selectNotificationMethod', { defaultValue: '請至少選擇一種通知方式' }));
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/subscriptions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId,
                    eventName,
                    seatGrades: selectedGrades,
                    maxPriceJpy: maxPrice,
                    ticketTypes,
                    notifyEmail,
                    notifyDiscord,
                    notifyLine,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.code === 'MAX_SUBSCRIPTIONS_REACHED') {
                    setError(t('maxSubscriptionsReached', { defaultValue: '已達訂閱上限（3個）' }));
                } else if (data.code === 'ALREADY_SUBSCRIBED') {
                    setError(t('alreadySubscribed', { defaultValue: '您已訂閱此活動' }));
                } else if (data.code === 'DISCORD_NOT_LINKED') {
                    setError(t('discordNotLinked', { defaultValue: '請先連結 Discord 帳號' }));
                } else {
                    setError(data.error || t('subscriptionFailed', { defaultValue: '訂閱失敗，請稍後再試' }));
                }
                return;
            }

            setSuccess(true);
            setTimeout(() => {
                onSuccess?.();
                onClose();
            }, 1500);
        } catch (err) {
            console.error('Subscription error:', err);
            setError(t('subscriptionFailed', { defaultValue: '訂閱失敗，請稍後再試' }));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!session?.user) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('subscribeToEvent', { defaultValue: '🔔 訂閱活動通知' })}
        >
            <div className="p-4 space-y-5">
                {/* 活動名稱 */}
                <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-4">
                    <p className="text-sm text-indigo-600 dark:text-indigo-400 mb-1">
                        {t('subscribingTo', { defaultValue: '訂閱活動' })}
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{eventName}</p>
                </div>

                {/* 座位等級選擇 */}
                {seatGrades.length > 0 && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                            {t('desiredSeatGrades', { defaultValue: '想要的座位等級' })}
                            <span className="text-gray-400 text-xs ml-1">{t('optional', { defaultValue: '（可選，不選=任意）' })}</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {seatGrades.map(grade => (
                                <button
                                    key={grade}
                                    type="button"
                                    onClick={() => handleGradeToggle(grade)}
                                    className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-all border-2
                    ${selectedGrades.includes(grade)
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-200'}
                  `}
                                >
                                    {grade}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* 價格上限 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        {t('maxPrice', { defaultValue: '價格上限' })}
                        <span className="text-gray-400 text-xs ml-1">{t('zeroPriceNote', { defaultValue: '（0 = 不限）' })}</span>
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
                        <input
                            type="number"
                            value={maxPrice || ''}
                            onChange={(e) => setMaxPrice(parseInt(e.target.value) || 0)}
                            min={0}
                            placeholder="0"
                            className="w-full pl-8 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                {/* 票券類型選擇 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        {t('ticketTypes', { defaultValue: '票券類型' })}
                        <span className="text-gray-400 text-xs ml-1">{t('optional', { defaultValue: '（可選，不選=任意）' })}</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {ticketTypeOptions.map(option => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleTicketTypeToggle(option.value)}
                                className={`
                  px-3 py-2 rounded-lg text-sm font-medium transition-all border-2
                  ${ticketTypes.includes(option.value)
                                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-200'}
                `}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 通知方式 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        {t('notificationMethod', { defaultValue: '通知方式' })}
                        <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="space-y-2">
                        {/* Email */}
                        <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <input
                                type="checkbox"
                                checked={notifyEmail}
                                onChange={(e) => setNotifyEmail(e.target.checked)}
                                className="w-5 h-5 rounded text-indigo-500 focus:ring-indigo-500"
                            />
                            <Mail className="w-5 h-5 text-gray-500" />
                            <span className="flex-1 text-gray-700 dark:text-gray-200">Email</span>
                            <span className="text-xs text-green-600 dark:text-green-400">{t('available', { defaultValue: '可用' })}</span>
                        </label>

                        {/* Discord */}
                        <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${userInfo.hasDiscord
                                ? 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                : 'border-gray-200 dark:border-gray-700 opacity-60'
                            }`}>
                            <input
                                type="checkbox"
                                checked={notifyDiscord}
                                onChange={(e) => setNotifyDiscord(e.target.checked)}
                                disabled={!userInfo.hasDiscord}
                                className="w-5 h-5 rounded text-indigo-500 focus:ring-indigo-500 disabled:opacity-50"
                            />
                            <svg className="w-5 h-5 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
                            </svg>
                            <span className="flex-1 text-gray-700 dark:text-gray-200">Discord DM</span>
                            {userInfo.hasDiscord ? (
                                <span className="text-xs text-green-600 dark:text-green-400">{t('available', { defaultValue: '可用' })}</span>
                            ) : (
                                <span className="text-xs text-orange-500">{t('linkRequired', { defaultValue: '需連結' })}</span>
                            )}
                        </label>

                        {/* LINE (未來支援) */}
                        <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed">
                            <input
                                type="checkbox"
                                checked={false}
                                disabled
                                className="w-5 h-5 rounded text-indigo-500 opacity-50"
                            />
                            <svg className="w-5 h-5 text-[#00B900]" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755z" />
                            </svg>
                            <span className="flex-1 text-gray-400">LINE</span>
                            <span className="text-xs text-gray-400">{t('comingSoon', { defaultValue: '即將推出' })}</span>
                        </label>
                    </div>
                </div>

                {/* 錯誤訊息 */}
                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                {/* 成功訊息 */}
                {success && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center gap-2 text-green-600 dark:text-green-400">
                        <Check className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm">{t('subscriptionSuccess', { defaultValue: '訂閱成功！有新票券上架時會通知您' })}</span>
                    </div>
                )}

                {/* 提交按鈕 */}
                <div className="flex gap-3 pt-2">
                    <Button
                        variant="secondary"
                        fullWidth
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        {tCommon('cancel')}
                    </Button>
                    <Button
                        fullWidth
                        onClick={handleSubmit}
                        loading={isSubmitting}
                        disabled={success}
                    >
                        <Bell className="w-4 h-4 mr-1" />
                        {t('subscribe', { defaultValue: '確認訂閱' })}
                    </Button>
                </div>

                {/* 提示 */}
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    {t('subscriptionNote', { defaultValue: '每個帳號最多可訂閱 3 個活動' })}
                </p>
            </div>
        </Modal>
    );
}
