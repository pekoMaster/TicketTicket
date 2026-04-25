import type { User } from '@/types';

/**
 * 取得用戶顯示頭像 — 優先使用自訂頭像，否則使用 OAuth 頭像
 */
export function getDisplayAvatar(user: User): string | undefined {
  return user.customAvatarUrl || user.avatarUrl;
}

/**
 * 語言排序順序（依使用頻率與地區優先級）
 */
export const LANGUAGE_ORDER = ['zh-TW', 'zh-CN', 'ja', 'en', 'ko', 'id', 'th', 'vi'] as const;

/**
 * 依預設順序排序語言代碼陣列
 */
export function sortLanguages(langs: string[]): string[] {
  return [...langs].sort((a, b) => {
    const orderA = LANGUAGE_ORDER.indexOf(a as typeof LANGUAGE_ORDER[number]);
    const orderB = LANGUAGE_ORDER.indexOf(b as typeof LANGUAGE_ORDER[number]);
    const idxA = orderA === -1 ? 999 : orderA;
    const idxB = orderB === -1 ? 999 : orderB;
    return idxA - idxB;
  });
}

/**
 * 語言代碼 → 國旗 emoji 對照
 */
export const LANGUAGE_FLAG_MAP: Record<string, string> = {
  'zh-TW': '🇹🇼',
  'zh-CN': '🇨🇳',
  ja: '🇯🇵',
  en: '🇺🇸',
  ko: '🇰🇷',
  id: '🇮🇩',
  th: '🇹🇭',
  vi: '🇻🇳',
};

/**
 * 取得語言代碼對應的國旗 emoji
 */
export function getNationalityEmoji(code: string): string {
  return LANGUAGE_FLAG_MAP[code] ?? '';
}

/**
 * 計算事件日期相對於今天的天數，回傳對應翻譯鍵與參數
 * 呼叫端負責用 t(key, params) 翻譯
 */
export function getRelativeTimeKey(date: Date | string): { key: 'expired' | 'today' | 'tomorrow' | 'daysLater'; days?: number } {
  const now = new Date();
  const eventDate = new Date(date);
  const diffDays = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { key: 'expired' };
  if (diffDays === 0) return { key: 'today' };
  if (diffDays === 1) return { key: 'tomorrow' };
  return { key: 'daysLater', days: diffDays };
}
