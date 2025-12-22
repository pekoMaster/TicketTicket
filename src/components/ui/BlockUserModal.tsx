'use client';

import { useState } from 'react';
import { X, Ban, Loader2, AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useTranslations } from 'next-intl';

interface BlockUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    userName: string;
    onSuccess: () => void;
}

export default function BlockUserModal({
    isOpen,
    onClose,
    userId,
    userName,
    onSuccess,
}: BlockUserModalProps) {
    const t = useTranslations('block');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleBlock = async () => {
        setIsSubmitting(true);
        setError('');

        try {
            const response = await fetch('/api/users/block', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blocked_id: userId }),
            });

            if (response.ok) {
                onSuccess();
                onClose();
            } else {
                const data = await response.json();
                setError(data.error || t('error', { defaultValue: '封鎖失敗' }));
            }
        } catch (err) {
            setError(t('error', { defaultValue: '封鎖失敗' }));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <Ban className="w-5 h-5 text-gray-500" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {t('title', { defaultValue: '封鎖用戶' })}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                        {t('confirm', { name: userName, defaultValue: `確定要封鎖 ${userName} 嗎？` })}
                    </p>

                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t('effect1', { defaultValue: '您將無法看到對方的刊登' })}
                            </p>
                        </div>
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t('effect2', { defaultValue: '對方也無法看到您的刊登' })}
                            </p>
                        </div>
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t('effect3', { defaultValue: '雙方無法再進行私訊對話' })}
                            </p>
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 mt-4">{error}</p>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-3">
                    <Button variant="secondary" className="flex-1" onClick={onClose}>
                        {t('cancel', { defaultValue: '取消' })}
                    </Button>
                    <Button
                        variant="primary"
                        className="flex-1 !bg-gray-700 hover:!bg-gray-800"
                        onClick={handleBlock}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            t('confirm_btn', { defaultValue: '確認封鎖' })
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
