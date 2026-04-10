'use client';

import { useState } from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTranslations } from 'next-intl';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Check, ChevronRight, Coins } from 'lucide-react';
import { CURRENCY_INFO, CurrencyCode } from '@/types';

interface CurrencySwitcherProps {
  variant?: 'button' | 'menu-item';
}

export default function CurrencySwitcher({ variant = 'button' }: CurrencySwitcherProps) {
  const { preferredCurrency, setPreferredCurrency } = useCurrency();
  const t = useTranslations('common'); // Assuming 'common.currency' exists, or 'settings'
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(preferredCurrency);

  const handleOpen = () => {
    setSelectedCurrency(preferredCurrency);
    setIsOpen(true);
  };

  const handleConfirm = () => {
    if (selectedCurrency !== preferredCurrency) {
      setPreferredCurrency(selectedCurrency);
    }
    setIsOpen(false);
  };

  if (variant === 'menu-item') {
    return (
      <>
        <button
          onClick={handleOpen}
          className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Coins className="w-5 h-5 text-gray-500" />
          <span className="flex-1 text-left font-medium">{t('currency', { defaultValue: 'Currency' })}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {preferredCurrency}
          </span>
          <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
        </button>

        <CurrencyModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          selectedCurrency={selectedCurrency}
          onSelectCurrency={setSelectedCurrency}
          onConfirm={handleConfirm}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <Coins className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{preferredCurrency}</span>
      </button>

      <CurrencyModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        selectedCurrency={selectedCurrency}
        onSelectCurrency={setSelectedCurrency}
        onConfirm={handleConfirm}
      />
    </>
  );
}

interface CurrencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCurrency: CurrencyCode;
  onSelectCurrency: (currency: CurrencyCode) => void;
  onConfirm: () => void;
}

function CurrencyModal({ isOpen, onClose, selectedCurrency, onSelectCurrency, onConfirm }: CurrencyModalProps) {
  const t = useTranslations('common');

  // Object keys return string, so we must assert to CurrencyCode
  const currencies = Object.keys(CURRENCY_INFO) as CurrencyCode[];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('selectCurrency', { defaultValue: 'Select Currency' })}>
      <div className="p-4">
        {/* Currency Options */}
        <div className="space-y-2 mb-6">
          {currencies.map((code) => {
            const info = CURRENCY_INFO[code];
            return (
              <button
                key={code}
                onClick={() => onSelectCurrency(code)}
                className={`
                  w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all
                  ${selectedCurrency === code
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}
                `}
              >
                <div className="flex-1 text-left">
                  <div className="font-bold text-gray-900 dark:text-gray-100 flex items-center justify-between">
                    <span>{info.nameZh} ({code})</span>
                    <span className="text-gray-500">{info.symbol}</span>
                  </div>
                </div>
                {selectedCurrency === code && (
                  <Check className="w-5 h-5 text-indigo-500" />
                )}
              </button>
            );
          })}
        </div>

        {/* Confirm Button */}
        <Button fullWidth onClick={onConfirm}>
          {t('confirm', { defaultValue: 'Confirm' })}
        </Button>
      </div>
    </Modal>
  );
}
