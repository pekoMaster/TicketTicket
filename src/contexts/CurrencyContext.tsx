'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { CurrencyCode } from '@/types';

interface CurrencyContextType {
  preferredCurrency: CurrencyCode;
  setPreferredCurrency: (currency: CurrencyCode) => void;
  exchangeRates: Record<string, number> | null;
  isLoadingRates: boolean;
  convertPrice: (amount: number, fromCurrency: CurrencyCode, toCurrency?: CurrencyCode) => number | null;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [preferredCurrency, setPreferredCurrencyState] = useState<CurrencyCode>('JPY');
  const [exchangeRates, setExchangeRates] = useState<Record<string, number> | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState(true);

  // 初始化讀取使用者偏好幣值
  useEffect(() => {
    const savedCurrency = localStorage.getItem('preferredCurrency') as CurrencyCode;
    if (savedCurrency) {
      setPreferredCurrencyState(savedCurrency);
    }
  }, []);

  // 取得最新匯率
  const fetchRates = useCallback(async () => {
    try {
      setIsLoadingRates(true);
      const res = await fetch('/api/currency/rates');
      if (res.ok) {
        const data = await res.json();
        setExchangeRates(data.rates);
      }
    } catch (error) {
      console.error('Failed to fetch exchange rates', error);
    } finally {
      setIsLoadingRates(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const setPreferredCurrency = useCallback((currency: CurrencyCode) => {
    setPreferredCurrencyState(currency);
    localStorage.setItem('preferredCurrency', currency);
  }, []);

  // 轉換金額
  const convertPrice = useCallback(
    (amount: number, fromCurrency: CurrencyCode, toCurrency: CurrencyCode = preferredCurrency) => {
      if (fromCurrency === toCurrency) return amount;
      if (!exchangeRates || !exchangeRates[fromCurrency] || !exchangeRates[toCurrency]) return null;

      // 轉換流程：先轉成 USD (base)，再轉成目標幣值
      const inUsd = amount / exchangeRates[fromCurrency];
      return Math.round(inUsd * exchangeRates[toCurrency]);
    },
    [exchangeRates, preferredCurrency]
  );

  const value = useMemo(
    () => ({
      preferredCurrency,
      setPreferredCurrency,
      exchangeRates,
      isLoadingRates,
      convertPrice,
    }),
    [preferredCurrency, setPreferredCurrency, exchangeRates, isLoadingRates, convertPrice]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
