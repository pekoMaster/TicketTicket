'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { AlertTriangle, ShieldX, Ban, Info } from 'lucide-react';

interface AgreementModalProps {
    isOpen: boolean;
    onAgree: () => void;
    onCancel: () => void;
    variant: 'create' | 'apply';
}

export default function AgreementModal({
    isOpen,
    onAgree,
    onCancel,
    variant,
}: AgreementModalProps) {
    const t = useTranslations('agreement');
    const [isChecked, setIsChecked] = useState(false);

    const handleAgree = () => {
        if (isChecked) {
            setIsChecked(false); // reset for next time
            onAgree();
        }
    };

    const handleCancel = () => {
        setIsChecked(false);
        onCancel();
    };

    const isCreate = variant === 'create';

    return (
        <Modal isOpen={isOpen} onClose={handleCancel} size="md">
            <div className="p-6">
                {/* Title */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full mb-3">
                        <ShieldX className="w-7 h-7 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {isCreate ? t('createTitle') : t('applyTitle')}
                    </h2>
                </div>

                {/* Warning: Not a trading platform */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            {t('notResale')}
                        </p>
                    </div>
                </div>

                {/* Prohibited actions */}
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-semibold mb-3">
                        <AlertTriangle className="w-5 h-5" />
                        <span>{isCreate ? t('createWarning') : t('applyWarning')}</span>
                    </div>
                    <p className="text-sm text-red-600 dark:text-red-300 mb-2">
                        {isCreate ? t('createWarningContent') : t('applyWarningContent')}
                    </p>
                    <ul className="space-y-2">
                        {isCreate ? (
                            <>
                                <li className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                                    <Ban className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <span>{t('createRule1')}</span>
                                </li>
                                <li className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                                    <Ban className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <span>{t('createRule2')}</span>
                                </li>
                                <li className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                                    <Ban className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <span>{t('createRule3')}</span>
                                </li>
                                <li className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                                    <Ban className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <span>{t('createRule4')}</span>
                                </li>
                            </>
                        ) : (
                            <>
                                <li className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                                    <Ban className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <span>{t('applyRule1')}</span>
                                </li>
                                <li className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                                    <Ban className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <span>{t('applyRule2')}</span>
                                </li>
                                <li className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                                    <Ban className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <span>{t('applyRule3')}</span>
                                </li>
                            </>
                        )}
                    </ul>
                </div>

                {/* Checkbox */}
                <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer mb-4">
                    <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => setIsChecked(e.target.checked)}
                        className="w-5 h-5 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-200 font-medium">
                        {t('agreeCheckbox')}
                    </span>
                </label>

                {/* Buttons */}
                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        fullWidth
                        onClick={handleCancel}
                    >
                        {t('cancel')}
                    </Button>
                    <Button
                        fullWidth
                        disabled={!isChecked}
                        onClick={handleAgree}
                    >
                        {t('confirm')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
