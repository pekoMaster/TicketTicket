'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations, useFormatter } from 'next-intl';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdmin } from '@/contexts/AdminContext';
import { Eye, Clock, Calendar, HandHeart, CheckCircle2, Globe2, MapPin, AlignLeft, Armchair } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import UserProfileModal from '@/components/ui/UserProfileModal';
import { TicketRequest, User, ACCEPTED_TICKET_TYPE_INFO, NATIONALITY_OPTIONS, LANGUAGE_OPTIONS, TicketType } from '@/types';

interface RequestCardProps {
    request: TicketRequest;
    isFirstCard?: boolean;
}

export default function RequestCard({ request, isFirstCard }: RequestCardProps) {
    const t = useTranslations('request');
    const tCommon = useTranslations('common');
    const tTicket = useTranslations('ticketType');
    const { locale } = useLanguage();
    const format = useFormatter();
    const { events } = useAdmin();
    const [showUserModal, setShowUserModal] = useState(false);

    // 查找活動資訊
    const event = events.find(e => e.name === request.eventName || e.id === request.eventId);

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString(locale, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    };

    // 取得顯示頭像
    const getDisplayAvatar = (user?: User) => {
        if (!user) return undefined;
        return user.customAvatarUrl || user.avatarUrl;
    };

  // 取得語言顯示名稱
  const getLanguageLabel = (code: string) => {
    return tCommon(`languagesList.${code}`, { defaultValue: code });
  };

  // 取得國籍顯示名稱
  const getNationalityLabel = (code: string) => {
    return tCommon(`nationalities.${code}`, { defaultValue: code });
  };

  // 語言排序順序 (對齊 ListingCard)
  const LANGUAGE_ORDER = ['zh-TW', 'zh-CN', 'ja', 'en', 'ko', 'id', 'th', 'vi'];
  const sortLanguages = (langs: string[]) => {
    return [...langs].sort((a, b) => {
      const orderA = LANGUAGE_ORDER.indexOf(a);
      const orderB = LANGUAGE_ORDER.indexOf(b);
      const idxA = orderA === -1 ? 999 : orderA;
      const idxB = orderB === -1 ? 999 : orderB;
      return idxA - idxB;
    });
  };

  // 生成星星
  const renderStars = (rating: number) => {
    return (
      <div
        className="flex"
        aria-label={t('ratingStars', { rating: rating.toFixed(1) })}
        role="img"
      >
        {Array.from({ length: 5 }, (_, i) => (
          <span
            key={i}
            className={i < Math.round(rating) ? 'text-pink-400' : 'text-gray-300 dark:text-gray-600'}
            aria-hidden="true"
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <>
      <div
        data-tutorial={isFirstCard ? 'request-card' : undefined}
        className="group relative bg-white/90 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl p-4 flex flex-col h-full border border-gray-200/50 dark:border-white/10 hover:border-pink-300 dark:hover:border-pink-500/50 transition-all duration-300 hover:shadow-xl dark:hover:shadow-pink-500/10 animate-fade-in"
      >
        {/* Gradient border effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 dark:block hidden" />

        {/* Header - 發布者資訊 (對齊 ListingCard) */}
        {request.user && (
          <div
            className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-200/50 dark:border-white/10 cursor-pointer group/header hover:bg-gray-50 dark:hover:bg-white/5 transition-all -mx-4 -mt-4 px-4 pt-4 rounded-t-2xl"
            onClick={() => setShowUserModal(true)}
          >
            <div className="relative">
              <Avatar
                src={getDisplayAvatar(request.user)}
                size="md"
                className="transition-all"
                priority={isFirstCard}
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-gray-800 dark:text-white block truncate">{request.user.username}</span>
              <div className="flex items-center gap-1 text-xs">
                {renderStars(request.user.rating || 0)}
                <span className="text-gray-700 dark:text-white font-medium ml-1">{(request.user.rating || 0).toFixed(1)}</span>
                <span className="text-gray-400">({request.user.reviewCount || 0})</span>
              </div>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex flex-col gap-3 mb-4">
          {/* Event Name */}
          <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 h-14 group-hover:text-pink-600 dark:group-hover:text-pink-100 transition-colors">
            {request.eventName}
          </h3>

          {/* Seat Grade & Quantity (對齊 ListingCard 樣式) */}
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-white/90 bg-gray-100 dark:bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-gray-200/50 dark:border-white/10">
              <HandHeart className="w-4 h-4 text-pink-500 dark:text-pink-400" />
              {t('needs', { count: request.quantity })}
            </span>
            {request.seatGrades && request.seatGrades.length > 0 && (
              <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-white/70 bg-gray-50 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-gray-100 dark:border-white/5">
                <Armchair className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                {request.seatGrades[0]}
                {request.seatGrades.length > 1 && ` +${request.seatGrades.length - 1}`}
              </span>
            )}
          </div>

          {/* Tags (Ticket Source + Accepted Types 對齊 ListingCard 漸層) */}
          <div className="flex gap-2 flex-wrap">
            {/* Ticket Source */}
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold shadow-lg ${
              !request.ticketSource 
                ? 'bg-gradient-to-r from-gray-600 to-gray-500 text-white shadow-gray-500/20'
                : request.ticketSource === 'lawson'
                  ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-green-500/20'
                  : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-blue-500/20'
            }`}>
              {!request.ticketSource ? tCommon('anySource') : request.ticketSource === 'lawson' ? 'LAWSON' : 'ZAIKO'}
            </span>

            {/* Accepted Types */}
            {request.acceptedTypes && request.acceptedTypes[0] && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/20">
                {tTicket(request.acceptedTypes[0])}
                {request.acceptedTypes.length > 1 && ` +${request.acceptedTypes.length - 1}`}
              </span>
            )}
          </div>

          {/* Description Preview - 保留但調整樣式以符合設計感 */}
          {request.description && (
            <div className="flex items-start gap-1.5 p-2.5 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-100 dark:border-white/5 line-clamp-2 text-xs text-gray-600 dark:text-gray-400 leading-relaxed italic">
              <AlignLeft className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400/50" />
              <span>{request.description}</span>
            </div>
          )}
        </div>

        {/* Footer (依據 ListingCard 修正排版) */}
        <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400 mt-auto pt-2">
          <div className="flex items-center justify-between">
            {/* Nationality flag - 置左對齊 */}
            {request.requesterNationality && (
              <span className="bg-pink-100 dark:bg-pink-500/20 px-2 py-1 rounded-lg text-pink-600 dark:text-pink-300 font-medium">
                {getNationalityLabel(request.requesterNationality)}
              </span>
            )}
            {/* Date - 置右對齊 */}
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 ml-auto">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(request.createdAt)}</span>
            </div>
          </div>

          {/* Languages - 最底部排序顯示 */}
          {request.requesterLanguages && request.requesterLanguages.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {sortLanguages(request.requesterLanguages).map(lang => (
                <span
                  key={lang}
                  className="px-2 py-0.5 rounded-md text-[10px] bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-500/20"
                >
                  {getLanguageLabel(lang)}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* View Button - 使用統一樣式的按鈕文字 */}
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5">
          <Link
            href={`/request/${request.id}`}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl font-semibold transition-all text-sm shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Eye className="w-4 h-4" />
            {t('view')}
          </Link>
        </div>
      </div>

            {request.user && (
                <UserProfileModal
                    user={request.user}
                    isOpen={showUserModal}
                    onClose={() => setShowUserModal(false)}
                />
            )}
        </>
    );
}
