'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useLanguage } from '@/contexts/LanguageContext';
import { Calendar, Eye, Users, Armchair } from 'lucide-react';
import Card from '@/components/ui/Card';
import Tag from '@/components/ui/Tag';
import Avatar from '@/components/ui/Avatar';
import StarRating from '@/components/ui/StarRating';
import UserProfileModal from '@/components/ui/UserProfileModal';
import { Listing, User, LANGUAGE_OPTIONS, TICKET_COUNT_TYPE_INFO } from '@/types';

interface ListingCardProps {
  listing: Listing;
  host?: User;
}

export default function ListingCard({ listing, host }: ListingCardProps) {
  const t = useTranslations('listing');
  const tTicket = useTranslations('ticketType');
  const { locale } = useLanguage();
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
      <Card className="animate-fade-in">
        {/* 主辦方資訊 - 移到頂部，可點擊顯示用戶資訊 */}
        {host && (
          <div
            className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 -mx-4 -mt-4 px-4 pt-4 rounded-t-xl transition-colors"
            onClick={() => setShowUserModal(true)}
          >
            <Avatar src={getDisplayAvatar(host)} size="sm" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 flex-1">{host.username}</span>
            <StarRating
              value={host.rating}
              readonly
              size="sm"
              showValue
              totalReviews={host.reviewCount}
            />
          </div>
        )}

        {/* 標籤列 - 票種類型 + 座位等級 + 幾人票 */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {/* 主要標籤（可協助入場 or 票種類型） */}
          <Tag variant={mainTag.variant} size="sm">
            {mainTag.label}
          </Tag>

          {/* 座位等級 */}
          {listing.seatGrade && (
            <Tag variant="default" size="sm">
              <Armchair className="w-3 h-3 mr-1" />
              {listing.seatGrade}
            </Tag>
          )}

          {/* 幾人票 */}
          {listing.ticketCountType && (
            <Tag variant="default" size="sm">
              <Users className="w-3 h-3 mr-1" />
              {getTicketCountLabel(listing.ticketCountType)}
            </Tag>
          )}
        </div>

        {/* 活動資訊 */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-1">
          {listing.eventName}
        </h3>

        {/* 藝人標籤 */}
        {listing.artistTags && listing.artistTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {listing.artistTags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-300"
              >
                {tag}
              </span>
            ))}
            {listing.artistTags.length > 3 && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                +{listing.artistTags.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="space-y-1 mb-4">
          {/* 日期 */}
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(listing.eventDate)}</span>
          </div>

          {/* 可使用語言 */}
          {listing.hostLanguages && listing.hostLanguages.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {listing.hostLanguages.map((lang) => (
                <span
                  key={lang}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300"
                >
                  {getLanguageLabel(lang)}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 查看按鈕 */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href={`/listing/${listing.id}`}
            className="flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
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

