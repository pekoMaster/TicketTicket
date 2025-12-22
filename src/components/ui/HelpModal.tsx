'use client';

import { useState } from 'react';
import { X, AlertTriangle, Ban, Flag, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useTranslations } from 'next-intl';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
    conversationType: 'inquiry' | 'pending' | 'matched';
    otherUserName: string;
    onCancelRequest: () => void;
    onReport: () => void;
    onBlock: () => void;
}

export default function HelpModal({
    isOpen,
    onClose,
    conversationType,
    otherUserName,
    onCancelRequest,
    onReport,
    onBlock,
}: HelpModalProps) {
    const t = useTranslations('help');

    if (!isOpen) return null;

    const canCancel = conversationType === 'matched';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {t('title', { defaultValue: '請問您需要什麼幫助？' })}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Options */}
                <div className="p-4 space-y-3">
                    {/* 取消同行 - 只有 matched 才顯示 */}
                    {canCancel && (
                        <button
                            onClick={() => {
                                onClose();
                                onCancelRequest();
                            }}
                            className="w-full flex items-center gap-3 p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors text-left"
                        >
                            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/50">
                                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                    {t('cancelMatch', { defaultValue: '取消同行' })}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {t('cancelMatchDesc', { defaultValue: '解除與對方的配對關係' })}
                                </p>
                            </div>
                        </button>
                    )}

                    {/* 檢舉對方 */}
                    <button
                        onClick={() => {
                            onClose();
                            onReport();
                        }}
                        className="w-full flex items-center gap-3 p-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-left"
                    >
                        <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/50">
                            <Flag className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                                {t('report', { defaultValue: '檢舉對方' })}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {t('reportDesc', { defaultValue: '回報不當行為或違規' })}
                            </p>
                        </div>
                    </button>

                    {/* 加入黑名單 */}
                    <button
                        onClick={() => {
                            onClose();
                            onBlock();
                        }}
                        className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                        <div className="p-2 rounded-full bg-gray-200 dark:bg-gray-600">
                            <Ban className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                                {t('block', { defaultValue: '加入黑名單' })}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {t('blockDesc', { defaultValue: '封鎖後將無法看到對方' })}
                            </p>
                        </div>
                    </button>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                    <Button variant="secondary" className="w-full" onClick={onClose}>
                        {t('close', { defaultValue: '關閉' })}
                    </Button>
                </div>
            </div>
        </div>
    );
}
