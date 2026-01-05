'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations, useFormatter } from 'next-intl';
import { useLanguage } from '@/contexts/LanguageContext';
import { Eye, Users, Armchair, Clock, Calendar, Check } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
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

  // 語言排序順序
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

  // 取得票種數量類型標籤
  const getTicketCountLabel = (type: string) => {
    const info = TICKET_COUNT_TYPE_INFO[type as keyof typeof TICKET_COUNT_TYPE_INFO];
    return info?.label || type;
  };

  // 生成星星
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < Math.round(rating) ? 'text-pink-400' : 'text-gray-600'}>
        ★
      </span>
    )).join('');
  };

  return (
    <>
      {/* V4 HybridCard 設計 - Glassmorphism + Aurora Price */}
      <div className="group relative bg-white/90 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl p-4 flex flex-col h-full border border-gray-200/50 dark:border-white/10 hover:border-pink-300 dark:hover:border-pink-500/50 transition-all duration-300 hover:shadow-xl dark:hover:shadow-pink-500/10 animate-fade-in">

        {/* Gradient border effect (深色模式懸停效果) */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 dark:block hidden" />

        {/* Header with glass effect */}
        {host && (
          <div
            className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-200/50 dark:border-white/10 cursor-pointer group/header hover:bg-gray-50 dark:hover:bg-white/5 transition-all -mx-4 -mt-4 px-4 pt-4 rounded-t-2xl"
            onClick={() => setShowUserModal(true)}
          >
            <div className="relative">
              <Avatar
                src={getDisplayAvatar(host)}
                size="md"
                className="ring-2 ring-pink-300/30 dark:ring-pink-500/30 group-hover/header:ring-pink-400/60 dark:group-hover/header:ring-pink-500/60 transition-all"
              />
              {/* 上線狀態指示器 */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-gray-800 dark:text-white block truncate">{host.username}</span>
              <div className="flex items-center gap-1 text-xs text-pink-500 dark:text-pink-400">
                <span>★★★★★</span>
                <span className="text-gray-700 dark:text-white font-medium">{host.rating.toFixed(1)}</span>
                <span className="text-gray-400">({host.reviewCount})</span>
              </div>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex flex-col gap-3 mb-4">
          {/* Event Name */}
          <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight group-hover:text-pink-600 dark:group-hover:text-pink-100 transition-colors">
            {listing.eventName}
          </h3>

          {/* Seat Grade & Ticket Count */}
          <div className="flex flex-wrap gap-2">
            {listing.seatGrade && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-white/90 bg-gray-100 dark:bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-gray-200/50 dark:border-white/10">
                <Armchair className="w-4 h-4 text-pink-500 dark:text-pink-400" />
                {listing.seatGrade}
              </span>
            )}
            {listing.ticketCountType && (
              <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-white/70 bg-gray-50 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-gray-100 dark:border-white/5">
                <Users className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                {getTicketCountLabel(listing.ticketCountType)}
              </span>
            )}
          </div>

          {/* Tags (Ticket Source + Entry Assist) */}
          <div className="flex gap-2 flex-wrap">
            {/* Ticket Source */}
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold shadow-lg ${listing.ticketSource === 'lawson'
              ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-green-500/20'
              : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-blue-500/20'
              }`}>
              {TICKET_SOURCE_INFO[listing.ticketSource || 'zaiko'].label}
            </span>

            {/* Entry Assist */}
            {listing.ticketType === 'find_companion' && listing.willAssistEntry && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-600 to-green-500 text-white shadow-lg shadow-green-500/20">
                <Check className="w-3 h-3 inline-block mr-1" />
                {t('canAssistEntry', { defaultValue: '可協助入場' })}
              </span>
            )}

            {/* Ticket Type for non-companion types */}
            {listing.ticketType !== 'find_companion' && (
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold shadow-lg ${listing.ticketType === 'sub_ticket_transfer'
                ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-purple-500/20'
                : 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-orange-500/20'
                }`}>
                {listing.ticketType === 'sub_ticket_transfer'
                  ? tTicket('subTicketTransfer', { defaultValue: '子票轉讓' })
                  : tTicket('ticketExchange', { defaultValue: '換票' })
                }
              </span>
            )}
          </div>

          {/* Price with Aurora effect */}
          {listing.originalPriceJpy > 0 && (
            <div className="relative rounded-xl overflow-hidden mt-1">
              {/* Aurora gradient background */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-100 to-cyan-100 dark:from-emerald-500/20 dark:to-cyan-500/20" />
              <div className="relative grid grid-cols-2 divide-x divide-gray-200 dark:divide-white/10 backdrop-blur-sm">
                <div className="p-3 text-center">
                  <span className="text-xs text-emerald-600 dark:text-emerald-300 block mb-1">{t('askingPrice')}</span>
                  <span className="text-2xl font-bold text-emerald-700 dark:text-white">¥{listing.askingPriceJpy.toLocaleString()}</span>
                </div>
                <div className="p-3 text-center bg-gray-50/50 dark:bg-black/20">
                  <span className="text-xs text-gray-500 dark:text-white/50 block mb-1">{t('originalPrice')}</span>
                  <span className="text-2xl font-medium text-gray-600 dark:text-white/70">¥{listing.originalPriceJpy.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400 mt-auto">
          <div className="flex items-center justify-between">
            {/* Nationality flag */}
            {listing.hostNationality && (
              <span className="bg-pink-100 dark:bg-pink-500/20 px-2 py-1 rounded-lg text-pink-600 dark:text-pink-300 font-medium">
                {getLanguageLabel(listing.hostNationality)}
              </span>
            )}
            {/* Date */}
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 ml-auto">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(listing.createdAt)}</span>
            </div>
          </div>

          {/* Languages */}
          {listing.hostLanguages && listing.hostLanguages.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {sortLanguages(listing.hostLanguages).map(lang => (
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

        {/* View Button - V4 Gradient Style */}
        <div className="mt-4 pt-3">
          <Link
            href={`/listing/${listing.id}`}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl font-semibold transition-all text-sm shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Eye className="w-4 h-4" />
            {t('view')}
          </Link>
        </div>
      </div>

      {/* User Profile Modal */}
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
