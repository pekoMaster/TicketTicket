'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useNotification, ToastType } from '@/contexts/NotificationContext';
import { Bell, Check, X, MessageCircle, UserPlus } from 'lucide-react';

const iconMap: Record<ToastType, React.ReactNode> = {
    new_application: <UserPlus className="w-5 h-5" />,
    application_accepted: <Check className="w-5 h-5" />,
    application_rejected: <X className="w-5 h-5" />,
    new_message: <MessageCircle className="w-5 h-5" />,
};

const colorMap: Record<ToastType, string> = {
    new_application: 'from-blue-500 to-indigo-600',
    application_accepted: 'from-green-500 to-emerald-600',
    application_rejected: 'from-red-500 to-rose-600',
    new_message: 'from-purple-500 to-violet-600',
};

export default function ToastNotification() {
    const { toasts, removeToast } = useNotification();
    const t = useTranslations('notification');

    return (
        <div className="fixed top-4 left-4 z-[100] space-y-2 pointer-events-none">
            {toasts.map((toast) => (
                <ToastItem
                    key={toast.id}
                    id={toast.id}
                    type={toast.type}
                    messageKey={toast.message}
                    onClose={() => removeToast(toast.id)}
                    t={t}
                />
            ))}
        </div>
    );
}

interface ToastItemProps {
    id: string;
    type: ToastType;
    messageKey: string;
    onClose: () => void;
    t: ReturnType<typeof useTranslations>;
}

function ToastItem({ type, messageKey, onClose, t }: ToastItemProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        // 進入動畫
        requestAnimationFrame(() => {
            setIsVisible(true);
        });

        // 離開動畫
        const timer = setTimeout(() => {
            setIsLeaving(true);
            setTimeout(onClose, 300);
        }, 4700);

        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div
            className={`
        pointer-events-auto
        flex items-center gap-3 px-4 py-3 rounded-xl
        bg-gradient-to-r ${colorMap[type]}
        text-white shadow-lg
        backdrop-blur-sm
        transform transition-all duration-300 ease-out
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}
      `}
            onClick={onClose}
            role="alert"
        >
            {/* 圖標 */}
            <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                {iconMap[type]}
            </div>

            {/* 內容 */}
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{t('title')}</p>
                <p className="text-white/90 text-xs">{t(messageKey)}</p>
            </div>

            {/* 進度條 */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20 rounded-b-xl overflow-hidden">
                <div
                    className="h-full bg-white/50 animate-shrink"
                    style={{ animationDuration: '5s' }}
                />
            </div>
        </div>
    );
}
