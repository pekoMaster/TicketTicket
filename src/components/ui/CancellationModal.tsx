'use client';

import { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useTranslations } from 'next-intl';

interface CancellationModalProps {
    isOpen: boolean;
    onClose: () => void;
    conversationId: string;
    eventName: string;
    mode: 'request' | 'respond';
    cancellationReason?: string;
    onSuccess: () => void;
}

export default function CancellationModal({
    isOpen,
    onClose,
    conversationId,
    eventName,
    mode,
    cancellationReason,
    onSuccess,
}: CancellationModalProps) {
    const t = useTranslations('cancellation');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmitRequest = async () => {
        if (!reason.trim()) {
            setError(t('reasonRequired', { defaultValue: '請填寫取消原因' }));
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const response = await fetch(`/api/conversations/${conversationId}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: reason.trim() }),
            });

            if (response.ok) {
                onSuccess();
                onClose();
            } else {
                const data = await response.json();
                setError(data.error || t('submitError', { defaultValue: '提交失敗' }));
            }
        } catch (err) {
            setError(t('submitError', { defaultValue: '提交失敗' }));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRespond = async (action: 'accept' | 'reject') => {
        setIsSubmitting(true);
        setError('');

        try {
            const response = await fetch(`/api/conversations/${conversationId}/cancel`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });

            if (response.ok) {
                onSuccess();
                onClose();
            } else {
                const data = await response.json();
                setError(data.error || t('submitError', { defaultValue: '提交失敗' }));
            }
        } catch (err) {
            setError(t('submitError', { defaultValue: '提交失敗' }));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {mode === 'request'
                                ? t('requestTitle', { defaultValue: '取消同行' })
                                : t('respondTitle', { defaultValue: '收到取消請求' })}
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
                    {/* 活動名稱 */}
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('event', { defaultValue: '活動' })}
                        </p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{eventName}</p>
                    </div>

                    {mode === 'request' ? (
                        <>
                            {/* 警告提示 */}
                            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                <p className="text-sm text-amber-700 dark:text-amber-300">
                                    {t('warning', { defaultValue: '取消同行將影響雙方的評價記錄。請謹慎使用。' })}
                                </p>
                            </div>

                            {/* 原因輸入 */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t('reasonLabel', { defaultValue: '取消原因' })} *
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder={t('reasonPlaceholder', { defaultValue: '請說明您希望取消的原因...' })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    rows={3}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            {/* 顯示對方的取消原因 */}
                            <div className="mb-4">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                    {t('otherReason', { defaultValue: '對方的取消原因' })}
                                </p>
                                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <p className="text-gray-900 dark:text-gray-100">{cancellationReason}</p>
                                </div>
                            </div>

                            {/* 說明 */}
                            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    {t('respondHint', { defaultValue: '若您同意取消，配對將解除。若您拒絕，雙方可繼續溝通協調。' })}
                                </p>
                            </div>
                        </>
                    )}

                    {/* Error */}
                    {error && (
                        <p className="text-sm text-red-500 mb-4">{error}</p>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-3">
                    {mode === 'request' ? (
                        <>
                            <Button variant="secondary" className="flex-1" onClick={onClose}>
                                {t('cancel', { defaultValue: '取消' })}
                            </Button>
                            <Button
                                variant="primary"
                                className="flex-1 !bg-amber-500 hover:!bg-amber-600"
                                onClick={handleSubmitRequest}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    t('submit', { defaultValue: '送出請求' })
                                )}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="secondary"
                                className="flex-1"
                                onClick={() => handleRespond('reject')}
                                disabled={isSubmitting}
                            >
                                {t('reject', { defaultValue: '拒絕' })}
                            </Button>
                            <Button
                                variant="primary"
                                className="flex-1"
                                onClick={() => handleRespond('accept')}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    t('accept', { defaultValue: '同意取消' })
                                )}
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
