'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Modal from './Modal';
import Button from './Button';
import { Flag, AlertTriangle } from 'lucide-react';
import { ReportType } from '@/types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedUserName?: string;
  conversationId?: string;
  listingId?: string;
}

const REPORT_TYPES: ReportType[] = ['scalper', 'ticket_issue', 'fraud', 'payment_issue'];

export default function ReportModal({
  isOpen,
  onClose,
  reportedUserId,
  reportedUserName,
  conversationId,
  listingId,
}: ReportModalProps) {
  const t = useTranslations('report');
  const [reportType, setReportType] = useState<ReportType | ''>('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!reportType || !reason.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportedUserId,
          conversationId,
          listingId,
          reportType,
          reason: reason.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit report');
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        // Reset form
        setReportType('');
        setReason('');
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setReportType('');
      setReason('');
      setError(null);
      setSuccess(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('title')} size="md">
      <div className="p-4 space-y-4">
        {success ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
              <Flag className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-green-600 dark:text-green-400 font-medium">{t('success')}</p>
          </div>
        ) : (
          <>
            {/* Warning */}
            <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  {t('warning')}
                </p>
              </div>
            </div>

            {/* Reported User */}
            {reportedUserName && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t('reportingUser')}: <span className="font-medium text-gray-900 dark:text-gray-100">{reportedUserName}</span>
              </div>
            )}

            {/* Report Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('type')} <span className="text-red-500">*</span>
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">{t('selectType')}</option>
                {REPORT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`types.${type}`)}
                  </option>
                ))}
              </select>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('reason')} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('reasonPlaceholder')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                fullWidth
                onClick={handleClose}
                disabled={isSubmitting}
              >
                {t('cancel')}
              </Button>
              <Button
                fullWidth
                onClick={handleSubmit}
                disabled={!reportType || !reason.trim() || isSubmitting}
                loading={isSubmitting}
              >
                {t('submit')}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
