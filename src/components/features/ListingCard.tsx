'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useLanguage } from '@/contexts/LanguageContext';
import { Calendar, Globe, Eye } from 'lucide-react';
import Card from '@/components/ui/Card';
import { TicketTypeTag } from '@/components/ui/Tag';
import Avatar from '@/components/ui/Avatar';
import StarRating from '@/components/ui/StarRating';
import UserProfileModal from '@/components/ui/UserProfileModal';
import { Listing, User } from '@/types';

interface ListingCardProps {
  listing: Listing;
  host?: User;
}

export default function ListingCard({ listing, host }: ListingCardProps) {
  const t = useTranslations('listing');
  const { locale } = useLanguage();
  const [showUserModal, setShowUserModal] = useState(false);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 頭像優先顯示自訂頭像，沒有才顯示 OAuth 頭像
  const getDisplayAvatar = (user: User) => {
    return user.customAvatarUrl || user.avatarUrl;
  };

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

        {/* 標籤 - 移除警告圖示 */}
        <div className="mb-3 flex flex-wrap gap-2">
          <TicketTypeTag
            type={listing.ticketType}
            showWarning={false}
          />
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
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(listing.eventDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Globe className="w-4 h-4" />
            <span>{listing.hostNationality || '-'}</span>
          </div>
        </div>

        {/* 價格與查看按鈕 */}
        <div className="flex items-center gap-3">
          {listing.ticketType === 'ticket_exchange' ? (
            // 換票類型：顯示補貼資訊
            <div className={`flex-1 rounded-lg py-2 px-3 text-center ${listing.subsidyDirection === 'i_pay_you'
              ? 'bg-red-50 dark:bg-red-900/30'
              : 'bg-green-50 dark:bg-green-900/30'
              }`}>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                {listing.subsidyDirection === 'i_pay_you' ? t('subsidyToApplicant') : t('subsidyToHost')}
              </p>
              <p className={`text-lg font-bold ${listing.subsidyDirection === 'i_pay_you'
                ? 'text-red-600 dark:text-red-400'
                : 'text-green-600 dark:text-green-400'
                }`}>
                ¥{(listing.subsidyAmount || 0).toLocaleString()}
              </p>
            </div>
          ) : (
            // 其他類型：顯示希望費用
            <div className="flex-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg py-2 px-3 text-center">
              <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                ¥{listing.askingPriceJPY.toLocaleString()}
              </p>
            </div>
          )}
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
