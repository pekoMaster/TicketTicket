'use client';

import Link from 'next/link';
import { useTranslations, useFormatter } from 'next-intl';
import { useLanguage } from '@/contexts/LanguageContext';
import Avatar from '@/components/ui/Avatar';
import { Listing, User, LANGUAGE_OPTIONS, TICKET_SOURCE_INFO } from '@/types';

interface MobileListingItemProps {
    listing: Listing;
    host?: User;
    isFirstItem?: boolean;
}

export default function MobileListingItem({ listing, host, isFirstItem }: MobileListingItemProps) {
    const t = useTranslations('listing');
    const tTicket = useTranslations('ticketType');
    const tFilter = useTranslations('filter');
    const tCommon = useTranslations('common');
    const { locale } = useLanguage();
    const format = useFormatter();

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString(locale, {
            month: '2-digit',
            day: '2-digit',
        });
    };

    // 頭像優先顯示自訂頭像
    const getDisplayAvatar = (user: User) => {
        return user.customAvatarUrl || user.avatarUrl;
    };

    // 取得國籍 emoji (從語言推測)
    const getNationalityEmoji = (code: string) => {
        const lang = LANGUAGE_OPTIONS.find(l => l.value === code);
        // 從語言代碼映射國旗
        const flagMap: Record<string, string> = {
            'zh-TW': '🇹🇼', 'zh-CN': '🇨🇳', 'ja': '🇯🇵', 'en': '🇺🇸',
            'ko': '🇰🇷', 'id': '🇮🇩', 'th': '🇹🇭', 'vi': '🇻🇳'
        };
        return flagMap[code] || '';
    };

    // 票種資訊
    const ticketSourceInfo = TICKET_SOURCE_INFO[listing.ticketSource as keyof typeof TICKET_SOURCE_INFO];

    // 計算相對時間
    const getRelativeTime = (date: Date) => {
        const now = new Date();
        const eventDate = new Date(date);
        const diffDays = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return t('expired');
        if (diffDays === 0) return t('today');
        if (diffDays === 1) return t('tomorrow');
        return `${diffDays}${t('daysLater', { defaultValue: '天後' })}`;
    };

    return (
        <Link href={`/listing/${listing.id}`} className="block" {...(isFirstItem ? { 'data-tutorial': 'mobile-listing-item' } : {})}>
            <div className="bg-white/90 dark:bg-gray-800/60 backdrop-blur rounded-lg px-3 py-2.5 border border-gray-200/50 dark:border-gray-700/50 hover:border-pink-300 dark:hover:border-purple-500/50 transition-all active:scale-[0.99] overflow-hidden">
                {/* 第一列：頭像 + 活動名稱 */}
                <div className="flex items-center gap-2 mb-1.5">
                    {host && (
                        <Avatar
                            src={getDisplayAvatar(host)}
                            alt={host.username}
                            size="sm"
                            className="w-8 h-8 flex-shrink-0"
                        />
                    )}
                    <span className="text-sm font-bold text-gray-900 dark:text-white truncate flex-1">
                        {listing.eventName}
                    </span>
                </div>

                {/* 第二列：用戶名 + 評分 + 日期 + 價格 */}
                <div className="flex items-center gap-2 mb-1.5 pl-10 flex-wrap">
                    {host && (
                        <>
                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[80px]">{host.username}</span>
                            {host.rating && host.rating > 0 && (
                                <span className="text-[10px] text-yellow-500">★{host.rating.toFixed(1)}</span>
                            )}
                        </>
                    )}
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">•</span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">{formatDate(listing.eventDate)}</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">•</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        ¥{listing.askingPriceJpy?.toLocaleString() || listing.originalPriceJpy?.toLocaleString()}
                    </span>
                </div>

                {/* 第三列：座位 + 票種 + 標籤 */}
                <div className="flex items-center gap-1.5 pl-10 flex-wrap">
                    {/* 座位等級 */}
                    {listing.seatGrade && (
                        <span className="text-[10px] bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded">
                            {listing.seatGrade}
                        </span>
                    )}

                    {/* 票種 */}
                    {listing.ticketPeopleCount > 0 && (
                        <span className="text-[10px] bg-purple-100 dark:bg-purple-600/30 text-purple-600 dark:text-purple-300 px-1.5 py-0.5 rounded">
                            {listing.ticketPeopleCount}人票
                        </span>
                    )}

                    {/* 票源 */}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded text-white ${
                        !listing.ticketSource 
                            ? 'bg-gray-500'
                            : listing.ticketSource === 'lawson'
                                ? 'bg-green-600'
                                : 'bg-blue-600'
                    }`}>
                        {!listing.ticketSource ? tCommon('anySource') : TICKET_SOURCE_INFO[listing.ticketSource].label}
                    </span>

                    {/* 協助入場 */}
                    {listing.willAssistEntry && (
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-600/30 text-emerald-600 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                            {tFilter('willAssistEntry')}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}

