'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations, useFormatter } from 'next-intl';
import { useLanguage } from '@/contexts/LanguageContext';
import { MapPin, Eye, Users, Armchair, Clock } from 'lucide-react';
import Card from '@/components/ui/Card';
import Tag from '@/components/ui/Tag';
import Avatar from '@/components/ui/Avatar';
import StarRating from '@/components/ui/StarRating';
import UserProfileModal from '@/components/ui/UserProfileModal';
import { Listing, User, LANGUAGE_OPTIONS, TICKET_COUNT_TYPE_INFO, TICKET_SOURCE_INFO } from '@/types';

interface ListingCardProps {
  listing: Listing;
  host?: User;
}

export default function ListingCard({ listing, host }: ListingCardProps) {
  const t = useTranslations('listing');
  const tTicket = useTranslations('ticketType');
  const { locale } = useLanguage();
  const format = useFormatter();
  const [showUserModal, setShowUserModal] = useState(false);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // 頭像優先顯示自訂頭像，沒有才顯示 OAuth 頭像
  const getDisplayAvatar = (user: User) => {
    return user.customAvatarUrl || user.avatarUrl;
  };

  // 取得語言顯示名稱
  const getLanguageLabel = (code: string) => {
    const lang = LANGUAGE_OPTIONS.find(l => l.value === code);
    return lang?.label || code;
  };

  // 語言排序順序（按 LANGUAGE_OPTIONS 中的順序）
  const LANGUAGE_ORDER = ['zh-TW', 'zh-CN', 'ja', 'en', 'ko', 'id', 'th', 'vi'];
  const sortLanguages = (langs: string[]) => {
    return [...langs].sort((a, b) => {
      const orderA = LANGUAGE_ORDER.indexOf(a);
      const orderB = LANGUAGE_ORDER.indexOf(b);
      // 如果不在列表中，放到最後
      const idxA = orderA === -1 ? 999 : orderA;
      const idxB = orderB === -1 ? 999 : orderB;
      return idxA - idxB;
    });
  };

  // 取得票種數量類型標籤
  const getTicketCountLabel = (type: string) => {
    const info = TICKET_COUNT_TYPE_INFO[type as keyof typeof TICKET_COUNT_TYPE_INFO];
    return info?.label || type;
  };

  // 決定主要標籤（可協助入場 優先於 尋找同行者）
  const getMainTagInfo = () => {
    if (listing.ticketType === 'find_companion' && listing.willAssistEntry) {
      return { label: t('canAssistEntry', { defaultValue: '可協助入場' }), variant: 'success' as const };
    }
    // 其他票種類型
    const typeLabels: Record<string, { label: string; variant: 'success' | 'info' | 'warning' }> = {
      find_companion: { label: tTicket('findCompanion', { defaultValue: '尋找同行者' }), variant: 'success' },
      sub_ticket_transfer: { label: tTicket('subTicketTransfer', { defaultValue: '子票轉讓' }), variant: 'info' },
      ticket_exchange: { label: tTicket('ticketExchange', { defaultValue: '換票' }), variant: 'warning' },
    };
    return typeLabels[listing.ticketType] || { label: listing.ticketType, variant: 'info' as const };
  };

  const mainTag = getMainTagInfo();

  return (
    <>
      <Card variant="glass" className="animate-fade-in flex flex-col h-full hover:shadow-lg dark:hover:shadow-indigo-500/10 hover:border-indigo-300/50 dark:hover:border-indigo-500/30 transition-all duration-300">
        {/* Header: User Info */}
        {host && (
          <div
            className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer -mx-4 -mt-4 px-4 pt-4 rounded-t-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            onClick={() => setShowUserModal(true)}
          >
            <Avatar src={getDisplayAvatar(host)} size="sm" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 flex-1 truncate">{host.username}</span>
            <StarRating
              value={host.rating}
              readonly
              size="sm"
              showValue={false}
              totalReviews={host.reviewCount}
            />
          </div>
        )}

        {/* Body: Event Info */}
        <div className="flex flex-col gap-2 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700 border-dashed">
          {/* 1. Event Name */}
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 line-clamp-1" title={listing.eventName}>
            {listing.eventName}
          </h3>

          {/* 2. Seat Grade & Ticket Count */}
          <div className="flex flex-wrap gap-2 items-center text-sm">
            {listing.seatGrade && (
              <span className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                <Armchair className="w-3.5 h-3.5" />
                {listing.seatGrade}
              </span>
            )}
            {listing.ticketCountType && (
              <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-2 py-0.5 rounded border border-gray-100 dark:border-gray-700">
                <Users className="w-3.5 h-3.5" />
                {getTicketCountLabel(listing.ticketCountType)}
              </span>
            )}
          </div>

          {/* 3. Listing Type */}
          <div className="mt-1">
            {/* Ticket Source TAG */}
            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${listing.ticketSource === 'lawson'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
              }`}>
              {TICKET_SOURCE_INFO[listing.ticketSource || 'zaiko'].label}
            </span>

            {/* Listing Type TAG */}
            <Tag variant={mainTag.variant} size="sm" className="w-fit">
              {mainTag.label}
            </Tag>
          </div>

          {/* 4. Price Display */}
          {listing.originalPriceJpy > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="flex flex-col items-center justify-center p-1.5 rounded border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mb-0.5">
                  {t('askingPrice')}
                </span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300 leading-tight">
                  ¥{listing.askingPriceJpy.toLocaleString()}
                </span>
              </div>
              <div className="flex flex-col items-center justify-center p-1.5 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <span className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">
                  {t('originalPrice')}
                </span>
                <span className="text-gray-600 dark:text-gray-300 leading-tight">
                  ¥{listing.originalPriceJpy.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer: Date, Nationality, Languages */}
        <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center justify-between">
            {/* Nationality */}
            {listing.hostNationality && (
              <span className="font-medium text-gray-600 dark:text-gray-300 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded text-indigo-600 dark:text-indigo-400">
                {getLanguageLabel(listing.hostNationality)}
              </span>
            )}

            {/* Venue and Posted Time */}
            <div className="flex items-center gap-1.5 ml-auto">
              {listing.venue && (
                <>
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[100px]">{listing.venue}</span>
                  <span className="text-gray-300 dark:text-gray-600 mx-0.5">•</span>
                </>
              )}
              <Clock className="w-3 h-3 text-gray-400 dark:text-gray-500" />
              <span className="text-gray-400 dark:text-gray-500">{format.relativeTime(new Date(listing.createdAt))}</span>
            </div>
          </div>

          {/* Languages */}
          {listing.hostLanguages && listing.hostLanguages.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {sortLanguages(listing.hostLanguages).map((lang) => (
                <span
                  key={lang}
                  className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30"
                >
                  {getLanguageLabel(lang)}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* View Button - Flexible Spacer & Bottom */}
        <div className="flex-grow" />
        <div className="mt-4 pt-3 flex justify-center">
          <Link
            href={`/listing/${listing.id}`}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg font-medium transition-all text-sm shadow-lg shadow-indigo-500/25 dark:shadow-indigo-500/20 hover:shadow-xl"
          >
            <Eye className="w-4 h-4" />
            <span>{t('view')}</span>
          </Link>
        </div>
      </Card>

      {/* 用戶資訊浮動視窗 */}
      {host && (
        <UserProfileModal
          user={host}
          isOpen={showUserModal}
          onClose={() => setShowUserModal(false)}
        />
      )}
    </>
  );
}

