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
} from 'lucide-react';

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

  // 我的刊登
  const myListings = useMemo(() => {
    if (!currentUser) return [];
    return listings.filter((l) => l.hostId === currentUser.id);
  }, [currentUser, listings]);

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

      <div className="pt-14 pb-20 px-4 py-6 space-y-6">
        {/* 個人資訊卡片 */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <Avatar src={currentUser.customAvatarUrl || currentUser.avatarUrl} size="xl" />
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {currentUser.username}
              </h2>
              <StarRating
                value={currentUser.rating}
                readonly
                size="sm"
                showValue
                totalReviews={currentUser.reviewCount}
              />
              {currentUser.isVerified && (
                <Tag variant="success" className="mt-2">
                  {t('verified')}
                </Tag>
              )}
            </div>
          </div>

          {/* 統計數據 */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{myListings.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('listings')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{myApplications.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('applications')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{userReviews.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('reviews')}</p>
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

          {myListings.length > 0 ? (
            <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
              {myListings.map((listing) => (
                <Card key={listing.id} className="dark:bg-gray-800 dark:border-gray-700">
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
          ) : (
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
              icon={<Scale className="w-5 h-5" />}
              label={tLegal('tokushoho')}
              href="/legal/tokushoho"
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

        {/* 版本資訊 */}
        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
          TicketTicket v1.0.0 ({t('version')})
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
