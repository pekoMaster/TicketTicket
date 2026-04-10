import { CurrencyCode, CURRENCY_INFO } from '@/types';

/**
 * 取得幣值符號
 */
export function getCurrencySymbol(currency: CurrencyCode): string {
  return CURRENCY_INFO[currency]?.symbol || '¥';
}

/**
 * 格式化金額（帶幣值符號）
 */
export function formatPrice(amount: number, currency: CurrencyCode = 'JPY'): string {
  const info = CURRENCY_INFO[currency];
  if (!info) return `¥${amount.toLocaleString()}`;
  return `${info.symbol}${amount.toLocaleString()}`;
}

/**
 * 取得幣值中文名
 */
export function getCurrencyName(currency: CurrencyCode): string {
  return CURRENCY_INFO[currency]?.nameZh || currency;
}
