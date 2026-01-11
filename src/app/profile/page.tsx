'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useApp } from '@/contexts/AppContext';
import { useTranslations } from 'next-intl';
import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import StarRating from '@/components/ui/StarRating';
import Tag from '@/components/ui/Tag';
import { TicketTypeTag } from '@/components/ui/Tag';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import ThemeSwitcher from '@/components/ui/ThemeSwitcher';
import ReviewCard from '@/components/features/ReviewCard';
import Modal from '@/components/ui/Modal';
import {
  Ticket,
  Calendar,
  MapPin,
  ChevronRight,
  Settings,
  HelpCircle,
  FileText,
  LogOut,
  Scale,
  Star,
  Users,
  Edit3,
  Trash2,
  X,
  Check,
  History,
} from 'lucide-react';
import { isListingExpired } from '@/lib/listing-utils';

interface ApiReview {
  id: string;
  rating: number;
  comment?: string;
  created_at: string;
  reviewer: {
    id: string;
    username: string;
    avatar_url?: string;
    custom_avatar_url?: string;
  };
  listing?: {
    id: string;
    event_name: string;
    event_date: string;
  };
}

interface ApiApplication {
  id: string;
  listing_id: string;
  status: string;
  created_at: string;
  listing: {
    id: string;
    event_name: string;
    event_date: string;
    venue: string;
    status: string;
    ticket_type: string;
    seat_grade: string;
    asking_price_jpy: number;
    host: {
      id: string;
      username: string;
      avatar_url?: string;
      custom_avatar_url?: string;
    };
  };
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  customAvatarUrl?: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
}

interface CompletedMatch {
  id: string;
  listingId: string;
  listing: {
    event_name: string;
    event_date: string;
    venue: string;
    ticket_type: string;
  };
  isHost: boolean;
  otherUser: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  completedAt: string;
  myReview: {
    rating: number;
    isAuto?: boolean;
  } | null;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { listings, deleteListing } = useApp();
  const t = useTranslations('profile');
  const tStatus = useTranslations('status');
  const tLegal = useTranslations('legal');
  const tReview = useTranslations('review');
  const tCommon = useTranslations('common');
  const tMessages = useTranslations('messages');
  const { locale } = useLanguage();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userReviews, setUserReviews] = useState<ApiReview[]>([]);
  const [myApplications, setMyApplications] = useState<ApiApplication[]>([]);
  const [completedMatches, setCompletedMatches] = useState<CompletedMatch[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Delete listing modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Withdraw application modal
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [applicationToWithdraw, setApplicationToWithdraw] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // 取得用戶資料和評價
  const fetchUserData = useCallback(async () => {
    if (!session?.user?.dbId) {
      setIsLoadingProfile(false);
      return;
    }

    try {
      // 並行取得用戶資料、評價、申請和已完成配對
      const [profileRes, reviewsRes, applicationsRes, completedRes] = await Promise.all([
        fetch('/api/profile'),
        fetch(`/api/reviews?userId=${session.user.dbId}`),
        fetch('/api/applications'),
        fetch('/api/profile/completed?limit=2'),
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setUserProfile({
          id: profileData.id,
          username: profileData.username,
          email: profileData.email || '',
          avatarUrl: profileData.avatarUrl,
          customAvatarUrl: profileData.customAvatarUrl,
          rating: profileData.rating || 0,
          reviewCount: profileData.reviewCount || 0,
          isVerified: profileData.isVerified || false,
        });
      } else if (profileRes.status === 401) {
        // 用戶被刪除，自動登出並導向登入頁
        const errorData = await profileRes.json();
        if (errorData.error === 'user_deleted') {
          alert('此帳號已被刪除，請重新註冊');
          await signOut({ callbackUrl: '/login' });
          return;
        }
      }

      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        setUserReviews(reviewsData);
      }

      if (applicationsRes.ok) {
        const applicationsData = await applicationsRes.json();
        // 過濾掉已撤回的申請
        const activeApplications = (applicationsData.sent || []).filter(
          (app: ApiApplication) => app.status !== 'cancelled'
        );
        setMyApplications(activeApplications);
      }

      if (completedRes.ok) {
        const completedData = await completedRes.json();
        setCompletedMatches(completedData.items || []);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  }, [session?.user?.dbId]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // 使用 API 回傳的用戶資訊，fallback 到 session
  const currentUser = userProfile || (session?.user ? {
    id: session.user.dbId || session.user.id || '',
    username: session.user.name || tCommon('defaultUser'),
    email: session.user.email || '',
    avatarUrl: session.user.image || undefined,
    customAvatarUrl: undefined,
    rating: 0,
    reviewCount: 0,
    isVerified: false,
  } : null);

  // 我的刊登 (分為進行中與歷史記錄)
  const myListings = useMemo(() => {
    if (!currentUser) return [];
    return listings.filter((l) => l.hostId === currentUser.id);
  }, [currentUser, listings]);

  const activeListings = useMemo(() =>
    myListings.filter((l) => !isListingExpired(l))
    , [myListings]);

  const expiredListings = useMemo(() =>
    myListings.filter((l) => isListingExpired(l))
    , [myListings]);

  // 刊登分頁狀態
  const [listingsTab, setListingsTab] = useState<'active' | 'history'>('active');

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
    });
  };

  // Handle delete listing
  const handleDeleteListing = async () => {
    if (!listingToDelete) return;

    setIsDeleting(true);
    const success = await deleteListing(listingToDelete);
    setIsDeleting(false);

    if (success) {
      setShowDeleteModal(false);
      setListingToDelete(null);
    } else {
      alert(tCommon('deleteFailed'));
    }
  };

  // Handle withdraw application
  const handleWithdrawApplication = async () => {
    if (!applicationToWithdraw) return;

    setIsWithdrawing(true);
    try {
      const response = await fetch(`/api/applications/${applicationToWithdraw}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMyApplications(prev => prev.filter(app => app.id !== applicationToWithdraw));
        setShowWithdrawModal(false);
        setApplicationToWithdraw(null);
      } else {
        alert(tCommon('deleteFailed'));
      }
    } catch (error) {
      console.error('Error withdrawing application:', error);
      alert(tCommon('deleteFailed'));
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">{t('title')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header title={t('title')} />

      <div className="pt-20 pb-20 px-4 space-y-6">
        {/* 個人資訊卡片 - 名片風格 */}
        <Card variant="glass" className="relative overflow-hidden">
          {/* 背景裝飾 */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-pink-500/10" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-500/20 to-transparent rounded-full blur-xl" />

          <div className="relative">
            {/* 頭像與基本資訊 */}
            <div className="flex items-center gap-5">
              {/* 頭像區域 - 帶光環效果 */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-full blur-sm opacity-50 scale-105" />
                <div className="relative ring-4 ring-white/50 dark:ring-gray-700/50 rounded-full">
                  <Avatar src={currentUser.customAvatarUrl || currentUser.avatarUrl} size="xl" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                {/* 用戶名 - 加強視覺 */}
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-gray-900 dark:from-white dark:via-indigo-200 dark:to-white bg-clip-text text-transparent truncate">
                  {currentUser.username}
                </h2>

                {/* 評分區域 */}
                <div className="mt-1">
                  <StarRating
                    value={currentUser.rating}
                    readonly
                    size="sm"
                    showValue
                    totalReviews={currentUser.reviewCount}
                  />
                </div>

                {/* 驗證標籤 */}
                {currentUser.isVerified && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {t('verified')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 統計數據 - 漸層數字 */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-gray-200/50 dark:border-gray-700/50">
              <div className="text-center group cursor-default">
                <p className="text-3xl font-bold bg-gradient-to-br from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                  {myListings.length}
                </p>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{t('listings')}</p>
              </div>
              <div className="text-center group cursor-default">
                <p className="text-3xl font-bold bg-gradient-to-br from-pink-600 to-rose-600 dark:from-pink-400 dark:to-rose-400 bg-clip-text text-transparent">
                  {myApplications.length}
                </p>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{t('applications')}</p>
              </div>
              <div className="text-center group cursor-default">
                <p className="text-3xl font-bold bg-gradient-to-br from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
                  {userReviews.length}
                </p>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{t('reviews')}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* 我的刊登 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('myListings')}</h3>
            {myListings.length > 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">{myListings.length}</span>
            )}
          </div>

          {/* 分頁標籤 */}
          {myListings.length > 0 && (
            <div className="flex gap-2 mb-4 p-1 bg-gray-100/80 dark:bg-gray-800/80 rounded-xl backdrop-blur">
              <button
                onClick={() => setListingsTab('active')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${listingsTab === 'active'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-white/50 dark:text-gray-400 dark:hover:bg-gray-700/50'
                  }`}
              >
                <Ticket className="w-3.5 h-3.5 inline mr-1.5" />
                {t('activeListings')} ({activeListings.length})
              </button>
              <button
                onClick={() => setListingsTab('history')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${listingsTab === 'history'
                  ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-white/50 dark:text-gray-400 dark:hover:bg-gray-700/50'
                  }`}
              >
                <History className="w-3.5 h-3.5 inline mr-1.5" />
                {t('historyListings')} ({expiredListings.length})
              </button>
            </div>
          )}

          {/* 進行中的刊登 */}
          {listingsTab === 'active' && activeListings.length > 0 && (
            <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
              {activeListings.map((listing) => (
                <Card key={listing.id} className="dark:bg-gray-800 dark:border-gray-700 hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-600/50 transition-all duration-200 cursor-pointer">
                  <Link href={`/listing/${listing.id}`}>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <TicketTypeTag type={listing.ticketType} size="sm" />
                          <Tag
                            variant={
                              listing.status === 'open'
                                ? 'success'
                                : listing.status === 'matched'
                                  ? 'info'
                                  : 'default'
                            }
                            size="sm"
                          >
                            {listing.status === 'open' && tStatus('open')}
                            {listing.status === 'matched' && tStatus('matched')}
                            {listing.status === 'closed' && tStatus('closed')}
                          </Tag>
                        </div>
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {listing.eventName}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(listing.eventDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {listing.venue}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </div>
                  </Link>

                  {/* 管理按鈕 */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => router.push('/messages')}
                      className="flex-1 text-xs"
                    >
                      <Users className="w-3.5 h-3.5 mr-1" />
                      {t('manageApplications')}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => router.push(`/listing/${listing.id}/edit`)}
                      className="flex-1 text-xs"
                      disabled={listing.status === 'matched'}
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1" />
                      {t('editListing')}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setListingToDelete(listing.id);
                        setShowDeleteModal(true);
                      }}
                      className="text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* 歷史記錄 (過期的刊登) */}
          {listingsTab === 'history' && expiredListings.length > 0 && (
            <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
              {expiredListings.map((listing) => (
                <Card key={listing.id} className="dark:bg-gray-800 dark:border-gray-700 opacity-60 hover:opacity-80 transition-all duration-200 cursor-pointer">
                  <Link href={`/listing/${listing.id}`}>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <TicketTypeTag type={listing.ticketType} size="sm" />
                          <Tag variant="default" size="sm">
                            {t('expired')}
                          </Tag>
                        </div>
                        <p className="font-medium text-gray-600 dark:text-gray-400 truncate">
                          {listing.eventName}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-gray-400 dark:text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(listing.eventDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {listing.venue}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          )}

          {/* 歷史記錄為空時的提示 */}
          {listingsTab === 'history' && expiredListings.length === 0 && (
            <Card className="text-center py-6 dark:bg-gray-800 dark:border-gray-700">
              <History className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">{t('noHistory')}</p>
            </Card>
          )}

          {/* 進行中為空時的提示 */}
          {listingsTab === 'active' && activeListings.length === 0 && myListings.length > 0 && (
            <Card className="text-center py-6 dark:bg-gray-800 dark:border-gray-700">
              <Ticket className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">{t('noActiveListings')}</p>
            </Card>
          )}

          {/* 完全沒有刊登時的提示 */}
          {myListings.length === 0 && (
            <Card className="text-center py-8 dark:bg-gray-800 dark:border-gray-700">
              <Ticket className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">{t('noListings')}</p>
              <Link
                href="/create"
                className="text-indigo-500 dark:text-indigo-400 font-medium text-sm mt-2 inline-block"
              >
                {t('createFirst')}
              </Link>
            </Card>
          )}
        </section>

        {/* 我的申請 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('myApplications')}</h3>
            {myApplications.length > 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">{myApplications.length}</span>
            )}
          </div>

          {myApplications.length > 0 ? (
            <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
              {myApplications.map((application) => (
                <Card key={application.id} className="dark:bg-gray-800 dark:border-gray-700">
                  <Link href={`/listing/${application.listing_id}`}>
                    <div className="flex items-start gap-3">
                      {/* 主辦方頭像 */}
                      <Avatar
                        src={application.listing.host?.custom_avatar_url || application.listing.host?.avatar_url}
                        size="md"
                        className="flex-shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        {/* 狀態 + 活動名稱 */}
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <Tag
                            variant={
                              application.status === 'pending'
                                ? 'warning'
                                : application.status === 'accepted'
                                  ? 'success'
                                  : 'default'
                            }
                            size="sm"
                          >
                            {application.status === 'pending' && tMessages('waiting')}
                            {application.status === 'accepted' && tMessages('accepted')}
                            {application.status === 'rejected' && tMessages('rejected')}
                          </Tag>
                          <TicketTypeTag type={application.listing.ticket_type as 'find_companion' | 'sub_ticket_transfer' | 'ticket_exchange'} size="sm" />
                        </div>

                        {/* 活動名稱 */}
                        <p className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2 break-words mb-1">
                          {application.listing.event_name}
                        </p>

                        {/* 主辦方 + 座位 */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                          <span>{application.listing.host?.username}</span>
                          <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                            {application.listing.seat_grade}
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                    </div>
                  </Link>

                  {/* 撤回按鈕 - 只有 pending 狀態可以撤回 */}
                  {application.status === 'pending' && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setApplicationToWithdraw(application.id);
                          setShowWithdrawModal(true);
                        }}
                        className="w-full text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        {t('withdrawApplication')}
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-8 dark:bg-gray-800 dark:border-gray-700">
              <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">{t('noApplications')}</p>
              <Link
                href="/"
                className="text-indigo-500 dark:text-indigo-400 font-medium text-sm mt-2 inline-block"
              >
                {t('goExplore')}
              </Link>
            </Card>
          )}
        </section>

        {/* 我的已完成配對 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('completedMatches')}</h3>
            {completedMatches.length > 0 && (
              <Link
                href="/profile/completed"
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {t('viewMore')}
              </Link>
            )}
          </div>

          {completedMatches.length > 0 ? (
            <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
              {completedMatches.map((match) => (
                <Card key={match.id} className="dark:bg-gray-800 dark:border-gray-700">
                  <Link href={`/listing/${match.listingId}`}>
                    <div className="flex items-center gap-3">
                      <Avatar src={match.otherUser.avatarUrl} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <TicketTypeTag type={match.listing.ticket_type as 'find_companion' | 'sub_ticket_transfer' | 'ticket_exchange'} size="sm" />
                          <Tag variant={match.isHost ? 'purple' : 'info'} size="sm">
                            {match.isHost ? t('iWasHost') : t('iWasGuest')}
                          </Tag>
                        </div>
                        <p className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2 break-words">
                          {match.listing.event_name}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <span>{t('matchedWith')}: {match.otherUser.username}</span>
                          {match.myReview && (
                            <span className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                              {match.myReview.rating}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-8 dark:bg-gray-800 dark:border-gray-700">
              <Check className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">{t('noCompleted')}</p>
            </Card>
          )}
        </section>

        {/* 收到的評價 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{tReview('receivedReviews')}</h3>
            {userReviews.length > 5 && currentUser && (
              <Link
                href={`/reviews/${currentUser.id}`}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {tReview('viewAll')} ({userReviews.length})
              </Link>
            )}
          </div>

          {userReviews.length > 0 ? (
            <div className="space-y-3">
              {userReviews.slice(0, 5).map((review) => (
                <ReviewCard key={review.id} review={review} showEvent />
              ))}
              {userReviews.length > 5 && currentUser && (
                <Link
                  href={`/reviews/${currentUser.id}`}
                  className="block text-center py-3 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {tReview('viewAll')} ({userReviews.length})
                </Link>
              )}
            </div>
          ) : (
            <Card className="text-center py-8 dark:bg-gray-800 dark:border-gray-700">
              <Star className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">{tReview('noReviewsYet')}</p>
            </Card>
          )}
        </section>

        {/* 設定選單 */}
        <section>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('settings')}</h3>
          <Card padding="none" className="dark:bg-gray-800 dark:border-gray-700">
            <ThemeSwitcher variant="menu-item" />
            <LanguageSwitcher variant="menu-item" />
            <MenuItem
              icon={<Settings className="w-5 h-5" />}
              label={t('accountSettings')}
              href="/profile/settings"
            />
            <MenuItem
              icon={<HelpCircle className="w-5 h-5" />}
              label={t('helpSupport')}
              href="#"
            />
            <MenuItem
              icon={<FileText className="w-5 h-5" />}
              label={t('terms')}
              href="/legal/terms"
            />
            <MenuItem
              icon={<FileText className="w-5 h-5" />}
              label={t('privacy')}
              href="/legal/privacy"
            />
            <MenuItem
              icon={<Scale className="w-5 h-5" />}
              label={tLegal('tokushoho')}
              href="/legal/tokushoho"
            />
            <MenuItem
              icon={<Ticket className="w-5 h-5" />}
              label={tLegal('ticketRegulations')}
              href="/legal/ticket-regulations"
            />
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-3 px-4 py-3.5 w-full text-left text-red-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="flex-1 font-medium">{t('logout')}</span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          </Card>
        </section>

        {/* Discord 社群連結 - 手機版 */}
        <div className="flex justify-center lg:hidden mb-3">
          <a
            href="https://discord.gg/KpPD9cpdH8"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-medium transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            <span>{t('joinDiscord', { defaultValue: '加入 Discord 社群' })}</span>
          </a>
        </div>

        {/* 版本資訊 */}
        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
          TicketTicket v1.08 ({t('version')})
        </p>
      </div>

      {/* 刪除確認 Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={t('withdrawConfirmTitle')}
      >
        <div className="p-4">
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            確定要刪除此刊登嗎？此操作無法復原。
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowDeleteModal(false)}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              fullWidth
              onClick={handleDeleteListing}
              loading={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('deleteListing')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 撤回申請確認 Modal */}
      <Modal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        title={t('withdrawConfirmTitle')}
      >
        <div className="p-4">
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {t('withdrawConfirmMessage')}
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowWithdrawModal(false)}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              fullWidth
              onClick={handleWithdrawApplication}
              loading={isWithdrawing}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('withdrawApplication')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  danger?: boolean;
  isLast?: boolean;
}

function MenuItem({ icon, label, href, danger, isLast }: MenuItemProps) {
  return (
    <Link
      href={href}
      className={`
        flex items-center gap-3 px-4 py-3.5
        ${!isLast && 'border-b border-gray-100 dark:border-gray-700'}
        ${danger ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'}
        hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
      `}
    >
      {icon}
      <span className="flex-1 font-medium">{label}</span>
      <ChevronRight className="w-5 h-5 text-gray-400" />
    </Link>
  );
}
